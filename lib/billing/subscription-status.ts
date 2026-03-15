/**
 * Subscription Status Helper
 * 
 * Normalizes subscription state into simple UI-friendly statuses.
 * Single source of truth for subscription display logic.
 */

import { 
  hasProAccess, 
  getCurrentTier, 
  isInTrial, 
  getTrialDaysRemaining,
  isOwnerAccount,
} from '@/lib/feature-access'

// =============================================================================
// UI-FRIENDLY STATUS TYPES
// =============================================================================

export type UISubscriptionStatus = 'free' | 'trial' | 'pro'

export interface SubscriptionDisplayInfo {
  status: UISubscriptionStatus
  label: string
  shortLabel: string
  isPaid: boolean
  isTrialing: boolean
  trialDaysRemaining: number
  showUpgradeCTA: boolean
  showTrialCTA: boolean
  isOwner: boolean
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

/**
 * Get the current UI subscription status
 * Maps internal subscription state to simple free/trial/pro
 */
export function getUISubscriptionStatus(): UISubscriptionStatus {
  if (typeof window === 'undefined') return 'free'
  
  // Owner is always pro
  if (isOwnerAccount()) return 'pro'
  
  // Check if actively trialing
  if (isInTrial()) return 'trial'
  
  // Check if pro (active subscription)
  if (hasProAccess()) return 'pro'
  
  return 'free'
}

/**
 * Get comprehensive subscription display info for UI components
 */
export function getSubscriptionDisplayInfo(): SubscriptionDisplayInfo {
  if (typeof window === 'undefined') {
    return {
      status: 'free',
      label: 'Free',
      shortLabel: 'Free',
      isPaid: false,
      isTrialing: false,
      trialDaysRemaining: 0,
      showUpgradeCTA: true,
      showTrialCTA: true,
      isOwner: false,
    }
  }
  
  const isOwner = isOwnerAccount()
  const trialing = isInTrial()
  const hasPro = hasProAccess()
  const trialDays = getTrialDaysRemaining()
  
  // Owner always shows as Pro
  if (isOwner) {
    return {
      status: 'pro',
      label: 'Pro',
      shortLabel: 'Pro',
      isPaid: true,
      isTrialing: false,
      trialDaysRemaining: 0,
      showUpgradeCTA: false,
      showTrialCTA: false,
      isOwner: true,
    }
  }
  
  // Trialing user
  if (trialing) {
    return {
      status: 'trial',
      label: trialDays > 0 ? `Trial (${trialDays}d left)` : 'Trial',
      shortLabel: 'Trial',
      isPaid: true,
      isTrialing: true,
      trialDaysRemaining: trialDays,
      showUpgradeCTA: false, // Don't show upgrade, they're already on trial
      showTrialCTA: false,   // Don't show "start trial" again
      isOwner: false,
    }
  }
  
  // Active Pro
  if (hasPro) {
    return {
      status: 'pro',
      label: 'Pro',
      shortLabel: 'Pro',
      isPaid: true,
      isTrialing: false,
      trialDaysRemaining: 0,
      showUpgradeCTA: false,
      showTrialCTA: false,
      isOwner: false,
    }
  }
  
  // Free user
  return {
    status: 'free',
    label: 'Free',
    shortLabel: 'Free',
    isPaid: false,
    isTrialing: false,
    trialDaysRemaining: 0,
    showUpgradeCTA: true,
    showTrialCTA: true,
    isOwner: false,
  }
}

/**
 * React hook version for components
 */
export function useSubscriptionDisplay(): SubscriptionDisplayInfo {
  return getSubscriptionDisplayInfo()
}
