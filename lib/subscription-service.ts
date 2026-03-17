/**
 * Subscription Service
 * 
 * Handles subscription status checks from the database.
 * Integrates with Stripe subscription data stored in the users table.
 */

import 'server-only'

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
 * This is the SERVER-SIDE SOURCE OF TRUTH for subscription status
 * 
 * Queries the new subscription_status and trial_ends_at columns for accurate trial tracking
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
      subscription_status: string | null
      trial_ends_at: string | null
      stripe_customer_id: string | null
      stripe_subscription_id: string | null
    }>(
      `SELECT 
        subscription_plan, 
        subscription_status,
        trial_ends_at,
        stripe_customer_id, 
        stripe_subscription_id 
       FROM users 
       WHERE clerk_id = $1`,
      [clerkId]
    )

    if (!result) {
      return defaultSub
    }

    const plan = (result.subscription_plan as SubscriptionPlan) || 'free'
    let status = (result.subscription_status as SubscriptionStatus) || 'none'
    
    // Check if trial has expired
    if (status === 'trialing' && result.trial_ends_at) {
      const trialEndsAt = new Date(result.trial_ends_at)
      const now = new Date()
      if (trialEndsAt < now) {
        // Trial expired - revert to none status
        status = 'none'
      }
    }

    return {
      plan: plan,
      status: status,
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
 * Get user's clerk_id by their email (used for Stripe webhook matching)
 */
export async function getUserClerkIdByEmail(email: string): Promise<string | null> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return null
  }

  try {
    const result = await queryOne<{ clerk_id: string }>(
      'SELECT clerk_id FROM users WHERE email = $1',
      [email]
    )
    return result?.clerk_id || null
  } catch (error) {
    console.error('[SpartanLab] Failed to get user by email:', error)
    return null
  }
}

/**
 * Get user's clerk_id by their Stripe customer ID
 */
export async function getUserClerkIdByStripeCustomer(stripeCustomerId: string): Promise<string | null> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return null
  }

  try {
    const result = await queryOne<{ clerk_id: string }>(
      'SELECT clerk_id FROM users WHERE stripe_customer_id = $1',
      [stripeCustomerId]
    )
    return result?.clerk_id || null
  } catch (error) {
    console.error('[SpartanLab] Failed to get user by Stripe customer:', error)
    return null
  }
}

/**
 * Update user subscription in database (called from Stripe webhook)
 * 
 * Now tracks subscription_status (active/trialing/canceled/etc) and trial_ends_at
 * to provide accurate trial and subscription state
 */
export async function updateUserSubscription(
  clerkId: string,
  data: {
    plan: SubscriptionPlan
    status: SubscriptionStatus
    stripeCustomerId: string
    stripeSubscriptionId: string
    trialEndsAt?: Date
  }
): Promise<boolean> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return false
  }

  try {
    await query(
      `UPDATE users 
       SET subscription_plan = $1, 
           subscription_status = $2,
           trial_ends_at = $3,
           stripe_customer_id = $4, 
           stripe_subscription_id = $5, 
           updated_at = $6
       WHERE clerk_id = $7`,
      [
        data.plan,
        data.status,
        data.trialEndsAt ? data.trialEndsAt.toISOString() : null,
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
 * 
 * Downgrades user to free and clears subscription status
 */
export async function cancelUserSubscription(clerkId: string): Promise<boolean> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return false
  }

  try {
    await query(
      `UPDATE users 
       SET subscription_plan = 'free', 
           subscription_status = 'canceled',
           stripe_subscription_id = NULL, 
           trial_ends_at = NULL,
           updated_at = $1
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
