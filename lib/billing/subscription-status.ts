/**
 * Subscription Status Helper
 * 
 * Normalizes subscription state into simple UI-friendly statuses.
 * Single source of truth for subscription display logic.
 * 
 * Includes owner-only simulation mode for testing Free/Pro states.
 */

import { 
  hasProAccess, 
  getCurrentTier, 
  isInTrial, 
  getTrialDaysRemaining,
  isOwnerAccount,
} from '@/lib/feature-access'
import { isCurrentUserOwner } from '@/lib/owner-access'

// =============================================================================
// SIMULATION MODE (Owner Only)
// =============================================================================

export type SimulationMode = 'off' | 'free' | 'pro'

// CANONICAL simulation storage key - used everywhere
const SIMULATION_KEY = 'spartanlab_owner_sim'

/**
 * Get current simulation mode (owner only)
 */
export function getSimulationMode(): SimulationMode {
  if (typeof window === 'undefined') return 'off'
  if (!isCurrentUserOwner()) return 'off'
  
  const stored = sessionStorage.getItem(SIMULATION_KEY)
  if (stored === 'free' || stored === 'pro') return stored
  return 'off'
}

/**
 * Set simulation mode (owner only)
 */
export function setSimulationMode(mode: SimulationMode): void {
  if (typeof window === 'undefined') return
  if (!isCurrentUserOwner()) return
  
  if (mode === 'off') {
    sessionStorage.removeItem(SIMULATION_KEY)
  } else {
    sessionStorage.setItem(SIMULATION_KEY, mode)
  }
  
  // Dispatch event for components to update
  window.dispatchEvent(new CustomEvent('simulation-mode-changed', { detail: mode }))
}

/**
 * Check if simulation is active
 */
export function isSimulationActive(): boolean {
  return getSimulationMode() !== 'off'
}

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
 * Respects owner simulation mode when active
 */
export function getUISubscriptionStatus(): UISubscriptionStatus {
  if (typeof window === 'undefined') return 'free'
  
  // Check for owner simulation mode first
  const simMode = getSimulationMode()
  if (simMode !== 'off') {
    return simMode // 'free' or 'pro'
  }
  
  // Owner without simulation is always pro
  if (isOwnerAccount()) return 'pro'
  
  // Check if actively trialing
  if (isInTrial()) return 'trial'
  
  // Check if pro (active subscription)
  if (hasProAccess()) return 'pro'
  
  return 'free'
}

/**
 * Get the real subscription status (ignores simulation)
 * Used for billing/account screens to show actual state
 */
export function getRealSubscriptionStatus(): UISubscriptionStatus {
  if (typeof window === 'undefined') return 'free'
  
  // Owner's real state is Free unless they actually paid
  if (isOwnerAccount()) {
    // Check if owner has a real subscription
    if (isInTrial()) return 'trial'
    if (hasProAccess()) return 'pro'
    return 'free'
  }
  
  if (isInTrial()) return 'trial'
  if (hasProAccess()) return 'pro'
  return 'free'
}

/**
 * Get comprehensive subscription display info for UI components
 * Respects owner simulation mode
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
  const simMode = getSimulationMode()
  const trialing = isInTrial()
  const hasPro = hasProAccess()
  const trialDays = getTrialDaysRemaining()
  
  // Owner simulation mode takes priority
  if (isOwner && simMode !== 'off') {
    if (simMode === 'free') {
      return {
        status: 'free',
        label: 'Free',
        shortLabel: 'Free',
        isPaid: false,
        isTrialing: false,
        trialDaysRemaining: 0,
        showUpgradeCTA: true,
        showTrialCTA: true,
        isOwner: true,
      }
    }
    // simMode === 'pro'
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
  
  // Owner without simulation always shows as Pro
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
