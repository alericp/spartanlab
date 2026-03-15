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
 */
export function getUISubscriptionStatus(): UISubscriptionStatus {
  // Owner bypass - treated as Pro
  if (isOwnerAccount()) return 'pro'
  
  // Check if user has Pro access
  const hasPro = hasProAccess()
  if (!hasPro) return 'free'
  
  // Has Pro access - check if trialing
  if (isInTrial()) return 'trial'
  
  return 'pro'
}

/**
 * Get full subscription info for UI components
 */
export function getUISubscriptionInfo(): UISubscriptionInfo {
  const status = getUISubscriptionStatus()
  const isOwner = isOwnerAccount()
  const hasPro = hasProAccess()
  const isTrial = isInTrial()
  const trialDays = getTrialDaysRemaining()
  
  // Determine plan label
  let planLabel: string
  let badgeText: string | null
  
  if (isOwner) {
    planLabel = 'Owner'
    badgeText = null // Owner doesn't need a badge
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
    hasPremiumAccess: hasPro || isOwner,
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
      return 'Start 7-Day Free Trial'
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
