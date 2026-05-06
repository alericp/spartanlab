/**
 * useEntitlement - Client-side entitlement hook backed by server state
 * 
 * This hook fetches entitlement from /api/entitlement (database truth)
 * and applies owner simulation overlay for testing.
 * 
 * Key principles:
 * - Database is the source of truth for subscription status
 * - Owner simulation is a CLIENT-ONLY overlay for testing
 * - Simulation does NOT affect server-side checks or database
 * - SWR handles caching and revalidation
 * 
 * [PHASE 14C TASK 2] CANONICAL CLIENT ENTITLEMENT SYSTEM
 * This is the SINGLE SOURCE OF TRUTH for client-side entitlement.
 * 
 * ENTITLEMENT SOURCE MAP:
 * - OnboardingCompleteClient: useEntitlement() ✅ migrated
 * - UpgradePage: useEntitlement() ✅ migrated
 * - PremiumFeature hooks: useEntitlement() ✅ migrated
 * - OwnerSimulationToggle: useEntitlement() ✅ uses hook
 * - Navigation badges: Should use useEntitlement() (future migration)
 * - PostWorkoutSummary: hasProAccess() (legacy, allowed for now)
 * - UpgradePromptCard: hasProAccess() (legacy, allowed for non-critical UI)
 * - SmartUpgradeTrigger: hasProAccess() (legacy, allowed for non-critical UI)
 * - DailyReadinessCard: hasProAccess() (legacy, allowed for non-critical UI)
 * 
 * LEGACY HELPERS (still exist but deprecated for UI gating):
 * - hasProAccess(): allowed for low-level helpers, deprecated for UI
 * - getCurrentTier(): allowed for low-level helpers, deprecated for UI
 * - isInTrial(): allowed for low-level helpers, deprecated for UI
 * - getUISubscriptionStatus(): deprecated, use useEntitlement()
 */

'use client'

import useSWR from 'swr'
import type { EntitlementResponse } from '@/app/api/entitlement/route'

// Simulation storage key (client-only, owner-only)
const SIMULATION_KEY = 'spartanlab_owner_sim'

export type SimulationMode = 'off' | 'free' | 'pro'

/**
 * Get current simulation mode from sessionStorage (owner-only)
 */
function getSimulationMode(isOwner: boolean): SimulationMode {
  if (typeof window === 'undefined') return 'off'
  if (!isOwner) return 'off'
  
  const stored = sessionStorage.getItem(SIMULATION_KEY)
  if (stored === 'free' || stored === 'pro') return stored
  return 'off'
}

/**
 * Set simulation mode (owner-only)
 */
export function setSimulationMode(mode: SimulationMode): void {
  if (typeof window === 'undefined') return
  
  if (mode === 'off') {
    sessionStorage.removeItem(SIMULATION_KEY)
  } else {
    sessionStorage.setItem(SIMULATION_KEY, mode)
  }
  
  // Dispatch event for components to update
  window.dispatchEvent(new CustomEvent('entitlement-simulation-changed', { detail: mode }))
}

export interface Entitlement {
  // Core state
  isSignedIn: boolean
  plan: 'free' | 'pro'
  isPro: boolean
  isTrialing: boolean
  isOwner: boolean
  hasProAccess: boolean
  
  // Metadata
  accessSource: 'database' | 'owner' | 'ownerSimulation' | 'unauthenticated'
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  
  // Simulation (owner-only)
  simulationMode: SimulationMode
  isSimulating: boolean
  
  // Loading state
  isLoading: boolean
  error: Error | null
  
  // Actions
  mutate: () => void
}

const fetcher = async (url: string): Promise<EntitlementResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch entitlement')
  }
  return res.json()
}

/**
 * Main entitlement hook - use this throughout the app
 * 
 * Features:
 * - Fetches from /api/entitlement (database truth)
 * - Applies owner simulation overlay
 * - SWR caching with automatic revalidation
 * - Fail-closed on error (returns free tier)
 */
export function useEntitlement(): Entitlement {
  const { data, error, isLoading, mutate } = useSWR<EntitlementResponse>(
    '/api/entitlement',
    fetcher,
    {
      // Revalidate on focus (user returns to tab)
      revalidateOnFocus: true,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
      // Keep stale data while revalidating
      revalidateIfStale: true,
      // Cache for 30 seconds
      dedupingInterval: 30000,
      // Don't retry on error (fail fast)
      shouldRetryOnError: false,
    }
  )

  // Default state (used during loading and on error)
  const defaultState: Omit<Entitlement, 'isLoading' | 'error' | 'mutate'> = {
    isSignedIn: false,
    plan: 'free',
    isPro: false,
    isTrialing: false,
    isOwner: false,
    hasProAccess: false,
    accessSource: 'unauthenticated',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    simulationMode: 'off',
    isSimulating: false,
  }

  // If loading or error, return safe defaults
  if (isLoading || error || !data) {
    return {
      ...defaultState,
      isLoading,
      error: error || null,
      mutate: () => mutate(),
    }
  }

  // Get simulation mode (only applies if user is owner)
  const simulationMode = getSimulationMode(data.isOwner)
  const isSimulating = data.isOwner && simulationMode !== 'off'

  // Apply simulation overlay (owner testing only)
  let finalState = {
    isSignedIn: data.isSignedIn,
    plan: data.plan,
    isPro: data.isPro,
    isTrialing: data.isTrialing,
    isOwner: data.isOwner,
    hasProAccess: data.hasProAccess,
    accessSource: data.accessSource,
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
  }

  // Owner simulation overlay
  // [ENTITLEMENT-ACCESS-SOURCE-OWNER] `accessSource` is
  // `'database' | 'owner' | 'unauthenticated'`. There is no
  // `'ownerSimulation'` value on the union — owner simulation is a
  // platform-owner overlay, so it MUST surface as `'owner'` to
  // downstream consumers (gate logic, analytics).
  if (isSimulating) {
    if (simulationMode === 'free') {
      finalState = {
        ...finalState,
        plan: 'free',
        isPro: false,
        isTrialing: false,
        hasProAccess: false,
        accessSource: 'owner' as const,
      }
    } else if (simulationMode === 'pro') {
      finalState = {
        ...finalState,
        plan: 'pro',
        isPro: true,
        isTrialing: false,
        hasProAccess: true,
        accessSource: 'owner' as const,
      }
    }
  }
  
  // [PHASE 14C TASK 2] Client entitlement single truth audit
  // Only log in development and not too frequently
  if (typeof window !== 'undefined' && !window.__entitlementAuditLogged) {
    console.log('[phase14c-entitlement-source-map-audit]', {
      source: 'useEntitlement',
      isCanonical: true,
      databaseBacked: true,
      ownerSimulationApplied: isSimulating,
      finalPlan: finalState.plan,
      finalHasProAccess: finalState.hasProAccess,
      accessSource: finalState.accessSource,
    })
    
    console.log('[phase14c-client-entitlement-single-truth-verdict]', {
      hookUsed: 'useEntitlement',
      isCanonicalSource: true,
      simulationMode,
      verdict: 'canonical_entitlement_used',
    })
    
    window.__entitlementAuditLogged = true
  }

  return {
    ...finalState,
    simulationMode,
    isSimulating,
    isLoading: false,
    error: null,
    mutate: () => mutate(),
  }
}

// Extend Window interface for audit flag
declare global {
  interface Window {
    __entitlementAuditLogged?: boolean
  }
}

/**
 * Simple boolean check for Pro access
 * For components that just need a yes/no
 */
export function useHasProAccess(): boolean {
  const { hasProAccess, isLoading } = useEntitlement()
  // Return false while loading (fail-closed)
  return isLoading ? false : hasProAccess
}

/**
 * Check if user is in trial period
 */
export function useIsTrialing(): boolean {
  const { isTrialing, isLoading } = useEntitlement()
  return isLoading ? false : isTrialing
}
