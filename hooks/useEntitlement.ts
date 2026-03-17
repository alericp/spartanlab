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
  if (isSimulating) {
    if (simulationMode === 'free') {
      finalState = {
        ...finalState,
        plan: 'free',
        isPro: false,
        isTrialing: false,
        hasProAccess: false,
        accessSource: 'ownerSimulation' as const,
      }
    } else if (simulationMode === 'pro') {
      finalState = {
        ...finalState,
        plan: 'pro',
        isPro: true,
        isTrialing: false,
        hasProAccess: true,
        accessSource: 'ownerSimulation' as const,
      }
    }
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
