/**
 * Stripe subscription sync utilities
 * 
 * Syncs Stripe subscription data with SpartanLab users in the database.
 * Called by the Stripe webhook to keep subscription state in sync.
 */

import 'server-only'

import { queryStrict, isDatabaseAvailable } from './db'

export interface BillingAccountRow {
  id: string
  email: string
  username: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

interface UserLookupRow {
  id: string
  email: string
  username: string
  stripe_customer_id?: string | null
  stripeCustomerId?: string | null
  stripe_subscription_id?: string | null
  stripeSubscriptionId?: string | null
}

function toBillingAccount(row: UserLookupRow | null): BillingAccountRow | null {
  if (!row) return null
  const subscriptionId = row.stripe_subscription_id ?? row.stripeSubscriptionId ?? null
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    stripeCustomerId: row.stripe_customer_id ?? row.stripeCustomerId ?? null,
    stripeSubscriptionId: subscriptionId || null,
  }
}

const USER_LOOKUP_SQL = `SELECT id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at
       FROM users`

/**
 * User subscription data from Stripe
 */
export interface StripeSubscriptionData {
  customerId: string
  subscriptionId: string
  email: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  currentPeriodEnd: string
}

export type SubscriptionMutationResult =
  | { status: 'updated' }
  | { status: 'not_found' }
  | { status: 'failed' }
  | { status: 'stale' }
  | { status: 'skipped' }

/** The write is applied only while this event still owns both version rows. */
export interface SubscriptionWriteGuard {
  customerId: string
  subscriptionId: string
  eventId: string
  grantsEntitlement: boolean
}

export type AccountLookupResult =
  | { status: 'found'; account: BillingAccountRow }
  | { status: 'not_found' }
  | { status: 'failed' }

/**
 * Update user with Stripe subscription data
 * 
 * Syncs Stripe customer/subscription IDs, status, and trial end date to the database.
 * Now updates subscription_status and trial_ends_at columns for accurate trial tracking.
 * A database error is `failed`, which is distinct from a completed update that matched no row.
 */
async function classifyUnappliedWrite(
  userId: string,
  guard: SubscriptionWriteGuard,
): Promise<SubscriptionMutationResult> {
  const users = await queryStrict<{ id: string; stripe_subscription_id: string | null }>(
    `SELECT id, stripe_subscription_id FROM users WHERE id = $1`,
    [userId],
  )
  if (users.length === 0) return { status: 'not_found' }

  const versions = await queryStrict<{ object_id: string; event_id: string }>(
    `SELECT object_id, event_id
     FROM stripe_subscription_versions
     WHERE object_id = $1 OR object_id = $2`,
    [guard.customerId, guard.subscriptionId],
  )
  const owns = (objectId: string) => versions.some((row) => row.object_id === objectId && row.event_id === guard.eventId)
  if (!owns(guard.customerId) || !owns(guard.subscriptionId)) return { status: 'stale' }

  const storedSubscriptionId = users[0].stripe_subscription_id || null
  if (storedSubscriptionId && storedSubscriptionId !== guard.subscriptionId && !guard.grantsEntitlement) {
    return { status: 'skipped' }
  }
  return { status: 'failed' }
}

export async function syncStripeSubscriptionToUser(
  userId: string,
  subscriptionData: StripeSubscriptionData,
  guard: SubscriptionWriteGuard,
): Promise<SubscriptionMutationResult> {
  console.log(`[Subscription Sync] Syncing Stripe data to user ${userId}:`, {
    customerId: subscriptionData.customerId,
    subscriptionId: subscriptionData.subscriptionId,
    status: subscriptionData.status,
  })

  if (!(await isDatabaseAvailable())) {
    console.warn('[Subscription Sync] Database not available, subscription sync failed')
    return { status: 'failed' }
  }

  try {
    // Determine subscription plan based on status
    // 'active' and 'trialing' both grant Pro access
    const subscriptionPlan = 
      subscriptionData.status === 'active' || subscriptionData.status === 'trialing' 
        ? 'pro' 
        : 'free'

    // Update user with Stripe data, including status and trial end date
    const result = await queryStrict<{ id: string }>(
      `UPDATE users 
       SET stripe_customer_id = $1,
           stripe_subscription_id = $2,
           subscription_plan = $3,
           subscription_status = $4,
           trial_ends_at = $5,
           updated_at = $6
       WHERE id = $7
         AND (
           stripe_subscription_id IS NULL
           OR stripe_subscription_id = $2
           OR $8::boolean
         )
         AND EXISTS (
           SELECT 1 FROM stripe_subscription_versions
           WHERE object_id = $9 AND event_id = $10
         )
         AND EXISTS (
           SELECT 1 FROM stripe_subscription_versions
           WHERE object_id = $2 AND event_id = $10
         )
       RETURNING id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at`,
      [
        subscriptionData.customerId,
        subscriptionData.subscriptionId,
        subscriptionPlan,
        subscriptionData.status, // 'active' | 'trialing' | 'canceled' | etc
        subscriptionData.status === 'trialing' ? new Date(subscriptionData.currentPeriodEnd).toISOString() : null,
        new Date().toISOString(),
        userId,
        guard.grantsEntitlement,
        guard.customerId,
        guard.eventId,
      ]
    )

    if (result.length > 0) {
      console.log(`[Subscription Sync] Successfully updated user ${userId} to plan: ${subscriptionPlan}, status: ${subscriptionData.status}`)
      return { status: 'updated' }
    }

    return classifyUnappliedWrite(userId, guard)
  } catch (error) {
    console.error('[Subscription Sync] Error syncing subscription:', error)
    return { status: 'failed' }
  }
}

/**
 * Downgrade user subscription (for cancellations)
 * 
 * Sets subscription_plan to 'free', status to 'canceled', and clears subscription ID
 */
export async function downgradeUserSubscription(
  userId: string,
  guard: SubscriptionWriteGuard,
): Promise<SubscriptionMutationResult> {
  console.log(`[Subscription Sync] Downgrading user ${userId} to free plan`)

  if (!(await isDatabaseAvailable())) {
    console.warn('[Subscription Sync] Database not available, downgrade failed')
    return { status: 'failed' }
  }

  try {
    // Downgrade to free plan but keep customer ID for billing history
    const result = await queryStrict<{ id: string }>(
      `UPDATE users 
       SET subscription_plan = 'free',
           subscription_status = 'canceled',
           stripe_subscription_id = NULL,
           trial_ends_at = NULL,
           updated_at = $1
       WHERE id = $2
         AND (stripe_subscription_id IS NULL OR stripe_subscription_id = $3)
         AND EXISTS (
           SELECT 1 FROM stripe_subscription_versions
           WHERE object_id = $4 AND event_id = $5
         )
         AND EXISTS (
           SELECT 1 FROM stripe_subscription_versions
           WHERE object_id = $3 AND event_id = $5
         )
       RETURNING id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at`,
      [new Date().toISOString(), userId, guard.subscriptionId, guard.customerId, guard.eventId]
    )

    if (result.length > 0) {
      console.log(`[Subscription Sync] Successfully downgraded user ${userId} to free plan`)
      return { status: 'updated' }
    }

    return classifyUnappliedWrite(userId, { ...guard, grantsEntitlement: false })
  } catch (error) {
    console.error('[Subscription Sync] Error downgrading subscription:', error)
    return { status: 'failed' }
  }
}

async function lookupAccount(sql: string, params: any[], failureLog: string): Promise<AccountLookupResult> {
  if (!(await isDatabaseAvailable())) {
    console.error(failureLog)
    return { status: 'failed' }
  }

  try {
    const rows = await queryStrict<UserLookupRow>(sql, params)
    const account = toBillingAccount(rows[0] ?? null)
    return account ? { status: 'found', account } : { status: 'not_found' }
  } catch (error) {
    console.error(failureLog, error)
    return { status: 'failed' }
  }
}

/**
 * Find user by Stripe customer ID
 */
export async function findUserByStripeCustomerId(customerId: string): Promise<AccountLookupResult> {
  console.log(`[Subscription Sync] Looking up user by Stripe customer ID: ${customerId}`)
  const result = await lookupAccount(
    `${USER_LOOKUP_SQL}
       WHERE stripe_customer_id = $1`,
    [customerId],
    '[Subscription Sync] Error finding user by customer ID:',
  )
  if (result.status === 'found') console.log(`[Subscription Sync] Found user: ${result.account.id}`)
  if (result.status === 'not_found') console.log(`[Subscription Sync] No user found for customer: ${customerId}`)
  return result
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<AccountLookupResult> {
  console.log(`[Subscription Sync] Looking up user by email: ${email}`)
  const result = await lookupAccount(
    `${USER_LOOKUP_SQL}
       WHERE email = $1`,
    [email],
    '[Subscription Sync] Error finding user by email:',
  )
  if (result.status === 'found') console.log(`[Subscription Sync] Found user: ${result.account.id}`)
  if (result.status === 'not_found') console.log(`[Subscription Sync] No user found for email: ${email}`)
  return result
}

/**
 * Find the account that started checkout. metadata.userId is the raw Clerk id.
 */
export async function findUserByClerkId(clerkId: string): Promise<AccountLookupResult> {
  console.log(`[Subscription Sync] Looking up user by Clerk id`)
  const result = await lookupAccount(
    `${USER_LOOKUP_SQL}
       WHERE clerk_id = $1`,
    [clerkId],
    '[Subscription Sync] Error finding user by Clerk id:',
  )
  if (result.status === 'found') console.log(`[Subscription Sync] Found user: ${result.account.id}`)
  if (result.status === 'not_found') console.log(`[Subscription Sync] No user found for Clerk id`)
  return result
}
