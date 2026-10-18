/**
 * Stripe subscription sync utilities
 * 
 * Syncs Stripe subscription data with SpartanLab users in the database.
 * Called by the Stripe webhook to keep subscription state in sync.
 */

import 'server-only'

import { query, queryOne, isDatabaseAvailable } from './db'
import type { User } from '@/types/domain'

export interface BillingAccountRow {
  id: string
  email: string
  username: string
  stripeCustomerId: string | null
}

interface UserLookupRow {
  id: string
  email: string
  username: string
  stripe_customer_id?: string | null
  stripeCustomerId?: string | null
}

function toBillingAccount(row: UserLookupRow | null): BillingAccountRow | null {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    stripeCustomerId: row.stripe_customer_id ?? row.stripeCustomerId ?? null,
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

/**
 * Update user with Stripe subscription data
 * 
 * Syncs Stripe customer/subscription IDs, status, and trial end date to the database.
 * Now updates subscription_status and trial_ends_at columns for accurate trial tracking.
 */
export async function syncStripeSubscriptionToUser(
  userId: string,
  subscriptionData: StripeSubscriptionData
): Promise<User | null> {
  console.log(`[Subscription Sync] Syncing Stripe data to user ${userId}:`, {
    customerId: subscriptionData.customerId,
    subscriptionId: subscriptionData.subscriptionId,
    status: subscriptionData.status,
  })

  if (!(await isDatabaseAvailable())) {
    console.warn('[Subscription Sync] Database not available, skipping sync')
    return null
  }

  try {
    // Determine subscription plan based on status
    // 'active' and 'trialing' both grant Pro access
    const subscriptionPlan = 
      subscriptionData.status === 'active' || subscriptionData.status === 'trialing' 
        ? 'pro' 
        : 'free'

    // Update user with Stripe data, including status and trial end date
    const result = await query<User>(
      `UPDATE users 
       SET stripe_customer_id = $1,
           stripe_subscription_id = $2,
           subscription_plan = $3,
           subscription_status = $4,
           trial_ends_at = $5,
           updated_at = $6
       WHERE id = $7
       RETURNING id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at`,
      [
        subscriptionData.customerId,
        subscriptionData.subscriptionId,
        subscriptionPlan,
        subscriptionData.status, // 'active' | 'trialing' | 'canceled' | etc
        subscriptionData.status === 'trialing' ? new Date(subscriptionData.currentPeriodEnd).toISOString() : null,
        new Date().toISOString(),
        userId,
      ]
    )

    if (result && result.length > 0) {
      console.log(`[Subscription Sync] Successfully updated user ${userId} to plan: ${subscriptionPlan}, status: ${subscriptionData.status}`)
      return result[0]
    }

    console.warn(`[Subscription Sync] User not found with id: ${userId}`)
    return null
  } catch (error) {
    console.error('[Subscription Sync] Error syncing subscription:', error)
    return null
  }
}

/**
 * Downgrade user subscription (for cancellations)
 * 
 * Sets subscription_plan to 'free', status to 'canceled', and clears subscription ID
 */
export async function downgradeUserSubscription(userId: string): Promise<User | null> {
  console.log(`[Subscription Sync] Downgrading user ${userId} to free plan`)

  if (!(await isDatabaseAvailable())) {
    console.warn('[Subscription Sync] Database not available, skipping downgrade')
    return null
  }

  try {
    // Downgrade to free plan but keep customer ID for billing history
    const result = await query<User>(
      `UPDATE users 
       SET subscription_plan = 'free',
           subscription_status = 'canceled',
           stripe_subscription_id = NULL,
           trial_ends_at = NULL,
           updated_at = $1
       WHERE id = $2
       RETURNING id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at`,
      [new Date().toISOString(), userId]
    )

    if (result && result.length > 0) {
      console.log(`[Subscription Sync] Successfully downgraded user ${userId} to free plan`)
      return result[0]
    }

    console.warn(`[Subscription Sync] User not found with id: ${userId}`)
    return null
  } catch (error) {
    console.error('[Subscription Sync] Error downgrading subscription:', error)
    return null
  }
}

/**
 * Find user by Stripe customer ID
 */
export async function findUserByStripeCustomerId(customerId: string): Promise<BillingAccountRow | null> {
  console.log(`[Subscription Sync] Looking up user by Stripe customer ID: ${customerId}`)

  if (!(await isDatabaseAvailable())) {
    return null
  }

  try {
    const user = await queryOne<UserLookupRow>(
      `${USER_LOOKUP_SQL}
       WHERE stripe_customer_id = $1`,
      [customerId]
    )
    const account = toBillingAccount(user)

    if (account) {
      console.log(`[Subscription Sync] Found user: ${account.id}`)
    } else {
      console.log(`[Subscription Sync] No user found for customer: ${customerId}`)
    }

    return account
  } catch (error) {
    console.error('[Subscription Sync] Error finding user by customer ID:', error)
    return null
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<BillingAccountRow | null> {
  console.log(`[Subscription Sync] Looking up user by email: ${email}`)

  if (!(await isDatabaseAvailable())) {
    return null
  }

  try {
    const user = await queryOne<UserLookupRow>(
      `${USER_LOOKUP_SQL}
       WHERE email = $1`,
      [email]
    )
    const account = toBillingAccount(user)

    if (account) {
      console.log(`[Subscription Sync] Found user: ${account.id}`)
    } else {
      console.log(`[Subscription Sync] No user found for email: ${email}`)
    }

    return account
  } catch (error) {
    console.error('[Subscription Sync] Error finding user by email:', error)
    return null
  }
}

/**
 * Find the account that started checkout. metadata.userId is the raw Clerk id.
 */
export async function findUserByClerkId(clerkId: string): Promise<BillingAccountRow | null> {
  console.log(`[Subscription Sync] Looking up user by Clerk id`)

  if (!(await isDatabaseAvailable())) {
    return null
  }

  try {
    const user = await queryOne<UserLookupRow>(
      `${USER_LOOKUP_SQL}
       WHERE clerk_id = $1`,
      [clerkId]
    )
    const account = toBillingAccount(user)

    if (account) {
      console.log(`[Subscription Sync] Found user: ${account.id}`)
    } else {
      console.log(`[Subscription Sync] No user found for Clerk id`)
    }

    return account
  } catch (error) {
    console.error('[Subscription Sync] Error finding user by Clerk id:', error)
    return null
  }
}
