/**
 * Stripe subscription sync utilities
 * Helpers for syncing Stripe subscription data with SpartanLab users
 */

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
 * This creates a standardized interface for subscription updates
 * In production, implement this to update your database
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

  // Production implementation:
  // 1. Query database for user by userId
  // 2. Update user fields:
  //    - stripeCustomerId = subscriptionData.customerId
  //    - stripeSubscriptionId = subscriptionData.subscriptionId
  //    - subscriptionStatus = subscriptionData.status
  //    - subscriptionTier = subscriptionData.status === 'active' ? 'pro' : 'free'
  //    - subscriptionCurrentPeriodEnd = subscriptionData.currentPeriodEnd
  // 3. Save to database
  // 4. Return updated user

  const subscriptionTier = subscriptionData.status === 'active' ? 'pro' : 'free'

  const updatedUser: User = {
    id: userId,
    email: subscriptionData.email,
    username: '', // Keep existing username
    subscriptionPlan: subscriptionTier,
    stripeCustomerId: subscriptionData.customerId,
    stripeSubscriptionId: subscriptionData.subscriptionId,
    subscriptionStatus: subscriptionData.status,
    subscriptionTier: subscriptionTier,
    subscriptionCurrentPeriodEnd: subscriptionData.currentPeriodEnd,
    createdAt: new Date().toISOString(),
  }

  console.log(`[Subscription Sync] Updated user subscription to:`, {
    subscriptionTier,
    subscriptionStatus: subscriptionData.status,
  })

  return updatedUser
}

/**
 * Downgrade user subscription (for cancellations)
 */
export async function downgradeUserSubscription(userId: string): Promise<User | null> {
  console.log(`[Subscription Sync] Downgrading user ${userId} to free plan`)

  // Production implementation:
  // 1. Query database for user by userId
  // 2. Update user fields:
  //    - subscriptionPlan = 'free'
  //    - subscriptionStatus = 'canceled'
  //    - subscriptionTier = 'free'
  // 3. Save to database
  // 4. Return updated user

  const downgradedUser: User = {
    id: userId,
    email: '',
    username: '',
    subscriptionPlan: 'free',
    subscriptionStatus: 'canceled',
    subscriptionTier: 'free',
    createdAt: new Date().toISOString(),
  }

  console.log(`[Subscription Sync] User downgraded to free plan`)

  return downgradedUser
}

/**
 * Find user by Stripe customer ID
 * Production: query database
 */
export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  console.log(`[Subscription Sync] Looking up user by Stripe customer ID: ${customerId}`)
  // Production: query database where stripeCustomerId = customerId
  return null
}

/**
 * Find user by email
 * Production: query database
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  console.log(`[Subscription Sync] Looking up user by email: ${email}`)
  // Production: query database where email = email
  return null
}
