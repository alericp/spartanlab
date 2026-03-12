// Plan source abstraction for dual-mode architecture
// Preview mode: localStorage-backed plan switching
// Production mode: Neon/Postgres-backed subscription state
//
// NOTE: This file is 'use client' - server-only functions are in plan-source-server.ts

'use client'

import { isPreviewMode } from './app-mode'
import type { SubscriptionPlan, PlanState, FeatureAccess } from '@/types/domain'

const STORAGE_KEY = 'spartanlab_user_plan'

// Default plan state
const DEFAULT_PLAN_STATE: PlanState = {
  plan: 'pro', // Preview mode defaults to pro for testing
  source: 'preview',
}

// Feature access by plan
// NOTE: Elite features are now merged into Pro for launch simplicity
const PLAN_FEATURES: Record<SubscriptionPlan, FeatureAccess> = {
  free: {
    skillTracker: true,
    strengthTracker: true,
    programBuilder: false,
    workoutLog: false,
    dashboard: true,
    spartanScore: false,
    volumeAnalyzer: false,
    goalProjection: false,
    advancedInsights: false,
  },
  pro: {
    // Pro now includes all previously Elite features
    skillTracker: true,
    strengthTracker: true,
    programBuilder: true,
    workoutLog: true,
    dashboard: true,
    spartanScore: true,
    volumeAnalyzer: true,
    goalProjection: true,
    advancedInsights: true,
  },
  elite: {
    // Legacy: Elite users get same access as Pro (backward compatibility)
    skillTracker: true,
    strengthTracker: true,
    programBuilder: true,
    workoutLog: true,
    dashboard: true,
    spartanScore: true,
    volumeAnalyzer: true,
    goalProjection: true,
    advancedInsights: true,
  },
}

// Check if we're in browser
function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// =============================================================================
// PREVIEW MODE - localStorage backed
// =============================================================================

/**
 * Get the current user's plan state from localStorage
 */
export function getPreviewPlanFromStorage(): PlanState {
  if (!isBrowser()) {
    return DEFAULT_PLAN_STATE
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return DEFAULT_PLAN_STATE
    }
  }

  // Initialize with default
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLAN_STATE))
  return DEFAULT_PLAN_STATE
}

/**
 * Set plan in localStorage (preview mode)
 */
export function setPreviewPlanInStorage(plan: SubscriptionPlan): PlanState {
  if (!isBrowser()) {
    return { plan, source: 'preview' }
  }

  const planState: PlanState = {
    plan,
    source: 'preview',
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(planState))
  return planState
}

// =============================================================================
// PRODUCTION MODE - Database operations are handled via server actions
// Import from plan-source-server.ts for database operations
// =============================================================================

// =============================================================================
// PUBLIC API - Client-side plan access
// =============================================================================

/**
 * Get the current user's plan state (client-side)
 * Uses localStorage for both preview and production client-side caching
 */
export function getUserPlan(): PlanState {
  if (!isBrowser()) {
    return DEFAULT_PLAN_STATE
  }

  // Always read from localStorage on client
  // In production, server actions sync to localStorage after DB operations
  return getPreviewPlanFromStorage()
}

/**
 * Get just the plan name
 */
export function getCurrentPlan(): SubscriptionPlan {
  return getUserPlan().plan
}

/**
 * Set plan in localStorage (client-side)
 * In preview mode: this is the primary store
 * In production mode: server actions update localStorage after DB sync
 */
export function setPreviewPlan(plan: SubscriptionPlan): PlanState {
  return setPreviewPlanInStorage(plan)
}

/**
 * Update local plan cache (called after server sync)
 */
export function updateLocalPlanCache(planState: PlanState): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(planState))
}

// =============================================================================
// FEATURE GATING
// =============================================================================

/**
 * Get feature access for current plan
 */
export function getFeatureAccess(): FeatureAccess {
  const plan = getCurrentPlan()
  return PLAN_FEATURES[plan]
}

/**
 * Check if a specific feature is accessible
 */
export function hasFeatureAccess(feature: keyof FeatureAccess): boolean {
  const access = getFeatureAccess()
  return access[feature]
}

/**
 * Check if user can access premium features
 */
export function isPremiumUser(): boolean {
  const plan = getCurrentPlan()
  return plan === 'pro' || plan === 'elite'
}

/**
 * Check if user has elite plan
 * NOTE: Elite tier is now merged into Pro. This function is kept for backward compatibility.
 * Elite users are treated as Pro users with full access.
 */
export function isEliteUser(): boolean {
  const plan = getCurrentPlan()
  // Elite is merged into Pro - both get full access
  return plan === 'elite' || plan === 'pro'
}

/**
 * Get all available plans with pricing info
 * NOTE: Elite tier is hidden from UI but kept in backend for backward compatibility
 */
export function getAvailablePlans(): {
  id: SubscriptionPlan
  name: string
  price: number
  features: string[]
}[] {
  return [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Basic skill tracking', 'Basic strength logging', 'Dashboard access'],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 15,
      features: [
        'Full skill tracker',
        'Full strength tracker',
        'Program builder',
        'Workout log',
        'Spartan Strength Score',
        'Full dashboard access',
        'Adaptive Training Engine',
        'Volume & Recovery Analyzer',
        'Goal Projection Engine',
        'Advanced insights',
      ],
    },
    // Elite tier kept for backward compatibility but not shown to new users
  ]
}

/**
 * Check if preview mode plan switching is available
 */
export function canSwitchPreviewPlan(): boolean {
  return isPreviewMode()
}

