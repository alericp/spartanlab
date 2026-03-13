// Server-side plan source operations
// Use this for database operations in server actions and API routes

'use server'

import { isPreviewMode } from './app-mode'
import { isDatabaseAvailable, queryOne, query } from './db'
import type { SubscriptionPlan, PlanState } from '@/types/domain'

/**
 * Get user's plan from database (server-side only)
 */
export async function getProductionPlan(userId: string): Promise<SubscriptionPlan> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return 'free'
  }

  try {
    const result = await queryOne<{ subscription_plan: string }>(
      'SELECT subscription_plan FROM athlete_profiles WHERE user_id = $1',
      [userId]
    )

    return (result?.subscription_plan as SubscriptionPlan) || 'free'
  } catch (error) {
    console.error('[SpartanLab] Failed to get production plan:', error)
    return 'free'
  }
}

/**
 * Set user's plan in database (server-side only)
 */
export async function setProductionPlan(
  userId: string,
  plan: SubscriptionPlan
): Promise<PlanState> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return { plan, source: 'preview' }
  }

  try {
    // Try update first
    const updated = await query(
      'UPDATE athlete_profiles SET subscription_plan = $1, updated_at = $2 WHERE user_id = $3 RETURNING id',
      [plan, new Date().toISOString(), userId]
    )

    // If no rows updated, insert new profile
    if (!updated || updated.length === 0) {
      await query(
        `INSERT INTO athlete_profiles 
         (id, user_id, subscription_plan, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `profile_${userId}_${Date.now()}`,
          userId,
          plan,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      )
    }

    return { plan, source: 'database' }
  } catch (error) {
    console.error('[SpartanLab] Failed to set production plan:', error)
    return { plan, source: 'database' }
  }
}

/**
 * Sync plan from Stripe webhook (server-side)
 */
export async function syncPlanFromStripe(
  userId: string,
  data: {
    plan: SubscriptionPlan
    stripeCustomerId: string
    stripeSubscriptionId: string
  }
): Promise<PlanState> {
  if (isPreviewMode() || !(await isDatabaseAvailable())) {
    return {
      plan: data.plan,
      source: 'stripe',
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    }
  }

  try {
    await query(
      `UPDATE athlete_profiles 
       SET subscription_plan = $1, stripe_customer_id = $2, stripe_subscription_id = $3, updated_at = $4
       WHERE user_id = $5`,
      [
        data.plan,
        data.stripeCustomerId,
        data.stripeSubscriptionId,
        new Date().toISOString(),
        userId,
      ]
    )
  } catch (error) {
    console.error('[SpartanLab] Failed to sync Stripe plan:', error)
  }

  return {
    plan: data.plan,
    source: 'stripe',
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
  }
}

/**
 * Get user's plan state from database
 */
export async function getUserPlanFromDatabase(userId: string): Promise<PlanState> {
  const plan = await getProductionPlan(userId)
  return { plan, source: 'database' }
}
