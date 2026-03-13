/**
 * Subscription Service
 * 
 * Handles subscription status checks from the database.
 * Integrates with Stripe subscription data stored in the users table.
 */

'use server'

import { query, queryOne, isDatabaseAvailable } from './db'
import { isPreviewMode } from './app-mode'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
export type SubscriptionPlan = 'free' | 'pro'

export interface SubscriptionInfo {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

/**
 * Get user subscription info from database
 */
export async function getUserSubscription(clerkId: string): Promise<SubscriptionInfo> {
  // Default free subscription
  const defaultSub: SubscriptionInfo = {
    plan: 'free',
    status: 'none',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  }

  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return defaultSub
  }

  try {
    const result = await queryOne<{
      subscription_plan: string
      stripe_customer_id: string | null
      stripe_subscription_id: string | null
    }>(
      'SELECT subscription_plan, stripe_customer_id, stripe_subscription_id FROM users WHERE clerk_id = $1',
      [clerkId]
    )

    if (!result) {
      return defaultSub
    }

    return {
      plan: (result.subscription_plan as SubscriptionPlan) || 'free',
      status: result.stripe_subscription_id ? 'active' : 'none',
      stripeCustomerId: result.stripe_customer_id,
      stripeSubscriptionId: result.stripe_subscription_id,
    }
  } catch (error) {
    console.error('[SpartanLab] Failed to get subscription:', error)
    return defaultSub
  }
}

/**
 * Check if user has Pro access
 */
export async function hasProSubscription(clerkId: string): Promise<boolean> {
  const sub = await getUserSubscription(clerkId)
  return sub.plan === 'pro' && (sub.status === 'active' || sub.status === 'trialing')
}

/**
 * Update user subscription in database (called from Stripe webhook)
 */
export async function updateUserSubscription(
  clerkId: string,
  data: {
    plan: SubscriptionPlan
    stripeCustomerId: string
    stripeSubscriptionId: string
  }
): Promise<boolean> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return false
  }

  try {
    await query(
      `UPDATE users 
       SET subscription_plan = $1, stripe_customer_id = $2, stripe_subscription_id = $3, updated_at = $4
       WHERE clerk_id = $5`,
      [
        data.plan,
        data.stripeCustomerId,
        data.stripeSubscriptionId,
        new Date().toISOString(),
        clerkId,
      ]
    )
    return true
  } catch (error) {
    console.error('[SpartanLab] Failed to update subscription:', error)
    return false
  }
}

/**
 * Cancel user subscription in database
 */
export async function cancelUserSubscription(clerkId: string): Promise<boolean> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return false
  }

  try {
    await query(
      `UPDATE users 
       SET subscription_plan = 'free', stripe_subscription_id = NULL, updated_at = $1
       WHERE clerk_id = $2`,
      [new Date().toISOString(), clerkId]
    )
    return true
  } catch (error) {
    console.error('[SpartanLab] Failed to cancel subscription:', error)
    return false
  }
}

/**
 * Create or update user record when they sign up
 */
export async function ensureUserExists(
  clerkId: string,
  email: string,
  username?: string
): Promise<boolean> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return false
  }

  try {
    // Try to update existing user first
    const updated = await query(
      `UPDATE users SET email = $1, username = $2, updated_at = $3 WHERE clerk_id = $4 RETURNING id`,
      [email, username || email.split('@')[0], new Date().toISOString(), clerkId]
    )

    // If no rows updated, insert new user
    if (!updated || updated.length === 0) {
      await query(
        `INSERT INTO users (id, clerk_id, email, username, subscription_plan, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'free', $5, $6)`,
        [
          `user_${clerkId}`,
          clerkId,
          email,
          username || email.split('@')[0],
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      )
    }

    return true
  } catch (error) {
    console.error('[SpartanLab] Failed to ensure user exists:', error)
    return false
  }
}
