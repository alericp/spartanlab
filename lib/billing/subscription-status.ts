/**
 * Subscription Status Helper
 * 
 * Single source of truth for UI subscription status decisions.
 * Normalizes Stripe/database subscription states into simple app-facing statuses:
 * - free: No active subscription
 * - trial: Active trial (Pro features with trial indicator)
 * - pro: Active paid subscription
 * 
 * This file does NOT duplicate subscription logic - it provides a clean adapter
 * for UI components to make consistent status decisions.
 */

import {
  hasProAccess,
  isInTrial,
  getTrialDaysRemaining,
  getCurrentTier,
  isOwnerAccount,
  type SubscriptionTier,
} from '@/lib/feature-access'
import { getSimulationMode, isSimulationActive } from './subscription-simulation'
import { TRIAL } from './pricing'

// =============================================================================
// UI STATUS TYPES
// =============================================================================

/**
 * Simple UI-facing subscription status
 */
export type UISubscriptionStatus = 'free' | 'trial' | 'pro'

/**
 * Full subscription info for UI rendering
 */
export interface UISubscriptionInfo {
  /** Simple status for conditional rendering */
  status: UISubscriptionStatus
  /** Whether user has Pro access (trial counts as Pro) */
  hasPremiumAccess: boolean
  /** Whether this is a trial period */
  isTrial: boolean
  /** Days remaining in trial (0 if not trialing) */
  trialDaysRemaining: number
  /** Whether this is the platform owner */
  isOwner: boolean
  /** Display label for the current plan */
  planLabel: string
  /** Short badge text */
  badgeText: string | null
}

// =============================================================================
// STATUS FUNCTIONS
// =============================================================================

/**
 * Get the simple UI subscription status
 * Returns: 'free' | 'trial' | 'pro'
 * 
 * For owner accounts:
 * - If simulation is active, returns the simulated state
 * - If simulation is off, returns the REAL billing state (not auto-Pro)
 */
export function getUISubscriptionStatus(): UISubscriptionStatus {
  const isOwner = isOwnerAccount()
  
  // Owner with simulation active - use simulated state
  if (isOwner && isSimulationActive()) {
    const simMode = getSimulationMode()
    return simMode === 'pro' ? 'pro' : 'free'
  }
  
  // Owner without simulation - use REAL billing state (not auto-Pro)
  // This ensures owner sees real Free state unless actually paid
  if (isOwner) {
    // Get real subscription state (bypassing owner check in hasProAccess)
    const hasPro = hasProAccessReal()
    if (!hasPro) return 'free'
    if (isInTrial()) return 'trial'
    return 'pro'
  }
  
  // Regular users - standard logic
  const hasPro = hasProAccess()
  if (!hasPro) return 'free'
  if (isInTrial()) return 'trial'
  return 'pro'
}

/**
 * Check real Pro access without owner bypass
 * Used internally for owner's real billing state
 */
function hasProAccessReal(): boolean {
  // Import getSubscription directly to avoid owner bypass in hasProAccess
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem('spartanlab_subscription')
    if (!stored) return false
    const subscription = JSON.parse(stored)
    return subscription.tier === 'pro' && 
           (subscription.status === 'active' || subscription.status === 'trialing')
  } catch {
    return false
  }
}

/**
 * Get full subscription info for UI components
 */
export function getUISubscriptionInfo(): UISubscriptionInfo {
  const status = getUISubscriptionStatus()
  const isOwner = isOwnerAccount()
  const simActive = isOwner && isSimulationActive()
  const simMode = simActive ? getSimulationMode() : null
  const isTrial = !simActive && isInTrial()
  const trialDays = !simActive ? getTrialDaysRemaining() : 0
  
  // Effective premium access based on status
  const hasPremium = status === 'pro' || status === 'trial'
  
  // Determine plan label
  let planLabel: string
  let badgeText: string | null
  
  if (isOwner && simActive) {
    // Owner in simulation mode
    planLabel = simMode === 'pro' ? 'Pro (Sim)' : 'Free (Sim)'
    badgeText = simMode === 'pro' ? 'Pro' : null
  } else if (isOwner && status === 'pro') {
    planLabel = 'Pro'
    badgeText = 'Pro'
  } else if (isOwner && status === 'free') {
    planLabel = 'Free'
    badgeText = null
  } else if (status === 'pro') {
    planLabel = 'Pro'
    badgeText = 'Pro'
  } else if (status === 'trial') {
    planLabel = 'Pro Trial'
    badgeText = trialDays > 0 ? `Trial (${trialDays}d)` : 'Trial'
  } else {
    planLabel = 'Free'
    badgeText = null
  }
  
  return {
    status,
    hasPremiumAccess: hasPremium,
    isTrial,
    trialDaysRemaining: trialDays,
    isOwner,
    planLabel,
    badgeText,
  }
}

/**
 * Check if user should see upgrade prompts
 * Returns false for Pro, Trial, and Owner accounts
 */
export function shouldShowUpgradePrompt(): boolean {
  const status = getUISubscriptionStatus()
  return status === 'free'
}

/**
 * Check if user should see trial start prompts
 * Returns false if already trialing, Pro, or Owner
 */
export function shouldShowTrialPrompt(): boolean {
  const status = getUISubscriptionStatus()
  return status === 'free'
}

/**
 * Check if user should see the Pro badge
 * Returns true for Pro and Trial users
 */
export function shouldShowProBadge(): boolean {
  const status = getUISubscriptionStatus()
  return status === 'pro' || status === 'trial'
}

/**
 * Get the appropriate CTA text based on subscription status
 */
export function getUpgradeCtaText(status?: UISubscriptionStatus): string {
  const currentStatus = status ?? getUISubscriptionStatus()
  
  switch (currentStatus) {
    case 'trial':
      return 'Upgrade to Pro'
    case 'pro':
      return 'Manage Billing'
    default:
      return TRIAL.ctaText
  }
}

/**
 * Get the appropriate billing action based on subscription status
 */
export function getBillingAction(status?: UISubscriptionStatus): 'upgrade' | 'manage' | 'trial' {
  const currentStatus = status ?? getUISubscriptionStatus()
  
  switch (currentStatus) {
    case 'pro':
      return 'manage'
    case 'trial':
      return 'upgrade' // Trialing users might want to upgrade early
    default:
      return 'trial'
  }
}

// =============================================================================
// REACT HOOK
// =============================================================================

/**
 * React hook for subscription status
 * Use this in components for reactive updates
 */
export function useSubscriptionStatus(): UISubscriptionInfo {
  // For client-side, we read directly since feature-access uses localStorage
  if (typeof window === 'undefined') {
    return {
      status: 'free',
      hasPremiumAccess: false,
      isTrial: false,
      trialDaysRemaining: 0,
      isOwner: false,
      planLabel: 'Free',
      badgeText: null,
    }
  }
  
  return getUISubscriptionInfo()
}
