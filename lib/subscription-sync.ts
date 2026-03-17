/**
 * Stripe subscription sync utilities
 * 
 * Syncs Stripe subscription data with SpartanLab users in the database.
 * Called by the Stripe webhook to keep subscription state in sync.
 */

import 'server-only'

import { query, queryOne, isDatabaseAvailable } from './db'
import type { User } from '@/types/domain'

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
 * Syncs Stripe customer/subscription IDs and status to the database
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

    // Update user with Stripe data
    const result = await query<User>(
      `UPDATE users 
       SET stripe_customer_id = $1,
           stripe_subscription_id = $2,
           subscription_plan = $3,
           updated_at = $4
       WHERE id = $5
       RETURNING id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at`,
      [
        subscriptionData.customerId,
        subscriptionData.subscriptionId,
        subscriptionPlan,
        new Date().toISOString(),
        userId,
      ]
    )

    if (result && result.length > 0) {
      console.log(`[Subscription Sync] Successfully updated user ${userId} to plan: ${subscriptionPlan}`)
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
 * Sets subscription_plan to 'free' and clears subscription ID
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
           stripe_subscription_id = NULL,
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
export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  console.log(`[Subscription Sync] Looking up user by Stripe customer ID: ${customerId}`)

  if (!(await isDatabaseAvailable())) {
    return null
  }

  try {
    const user = await queryOne<User>(
      `SELECT id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at
       FROM users 
       WHERE stripe_customer_id = $1`,
      [customerId]
    )
    
    if (user) {
      console.log(`[Subscription Sync] Found user: ${user.id}`)
    } else {
      console.log(`[Subscription Sync] No user found for customer: ${customerId}`)
    }
    
    return user
  } catch (error) {
    console.error('[Subscription Sync] Error finding user by customer ID:', error)
    return null
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  console.log(`[Subscription Sync] Looking up user by email: ${email}`)

  if (!(await isDatabaseAvailable())) {
    return null
  }

  try {
    const user = await queryOne<User>(
      `SELECT id, email, username, subscription_plan, stripe_customer_id, stripe_subscription_id, created_at
       FROM users 
       WHERE email = $1`,
      [email]
    )
    
    if (user) {
      console.log(`[Subscription Sync] Found user: ${user.id}`)
    } else {
      console.log(`[Subscription Sync] No user found for email: ${email}`)
    }
    
    return user
  } catch (error) {
    console.error('[Subscription Sync] Error finding user by email:', error)
    return null
  }
}
