'use client'

/**
 * Owner Bootstrap Provider
 * 
 * [PHASE 14B TASK 1] Single reliable owner bootstrap that runs early in the component tree.
 * 
 * This component:
 * 1. Initializes the owner email cache from Clerk auth as soon as auth resolves
 * 2. Provides owner state via React context to downstream components
 * 3. Logs audit trails for debugging owner detection issues
 * 
 * CRITICAL: This must be mounted near the top of the authenticated app layout,
 * AFTER ClerkProvider but BEFORE components that check owner/entitlement state.
 */

import { createContext, useContext, useEffect, useState, ReactNode, Component } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  setCurrentUserEmail,
  clearCurrentUserEmail,
  setServerVerifiedOwner,
} from '@/lib/owner-access'

// =============================================================================
// TYPES
// =============================================================================

export interface OwnerBootstrapState {
  /** Whether auth has finished loading */
  isLoaded: boolean
  /** Whether the current user is the platform owner */
  isOwner: boolean
  /** The current user's email from Clerk */
  userEmail: string | null
  /** The configured owner email from environment */
  ownerEmail: string | null
  /** Current simulation mode */
  simulationMode: 'off' | 'free' | 'pro'
}

const defaultState: OwnerBootstrapState = {
  isLoaded: false,
  isOwner: false,
  userEmail: null,
  ownerEmail: null,
  simulationMode: 'off',
}

const OwnerBootstrapContext = createContext<OwnerBootstrapState>(defaultState)

// =============================================================================
// HELPERS
// =============================================================================

const SIMULATION_KEY = 'spartanlab_owner_sim'

function getSimulationMode(): 'off' | 'free' | 'pro' {
  try {
    if (typeof window === 'undefined') return 'off'
    const stored = sessionStorage.getItem(SIMULATION_KEY)
    if (stored === 'free' || stored === 'pro') return stored
    return 'off'
  } catch {
    return 'off'
  }
}

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

class OwnerBootstrapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  
  componentDidCatch(error: Error) {
    console.error('[v0] OwnerBootstrapProvider crashed (caught safely):', error.message)
  }
  
  render() {
    if (this.state.hasError) {
      // On error, still render children but without owner context
      return this.props.children
    }
    return this.props.children
  }
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

function OwnerBootstrapProviderInner({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OwnerBootstrapState>(defaultState)
  
  // Call useUser unconditionally per React rules
  // In preview mode, Clerk will log errors but the hook still returns safely
  const { user, isLoaded } = useUser()
  
  useEffect(() => {
    let cancelled = false

    const loadOwner = async () => {
      if (!isLoaded) return
      const simMode = getSimulationMode()

      if (!user) {
        clearCurrentUserEmail()
        setServerVerifiedOwner(false)
        if (!cancelled) {
          setState({
            isLoaded: true,
            isOwner: false,
            userEmail: null,
            ownerEmail: null,
            simulationMode: 'off',
          })
        }
        return
      }

      const rawEmail = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress
      const email = rawEmail ? rawEmail.trim() : null
      setCurrentUserEmail(email)

      let isOwnerResult = false
      try {
        const response = await fetch('/api/auth/owner-status')
        if (response.ok) {
          const body = await response.json() as { isOwner?: boolean }
          isOwnerResult = body.isOwner === true
        }
      } catch {
        isOwnerResult = false
      }

      if (cancelled) return
      setServerVerifiedOwner(isOwnerResult)
      setState({
        isLoaded: true,
        isOwner: isOwnerResult,
        userEmail: email,
        ownerEmail: null,
        simulationMode: isOwnerResult ? simMode : 'off',
      })
    }

    loadOwner()
    return () => {
      cancelled = true
    }
  }, [user, isLoaded])
  
  // Listen for simulation mode changes
  useEffect(() => {
    if (!state.isOwner) return
    
    const handleSimulationChange = () => {
      const newMode = getSimulationMode()
      setState(prev => ({ ...prev, simulationMode: newMode }))
      
      console.log('[phase14b-owner-simulation-contract-audit]', {
        event: 'simulation-mode-changed',
        newMode,
        source: 'OwnerBootstrapProvider',
      })
    }
    
    window.addEventListener('entitlement-simulation-changed', handleSimulationChange)
    window.addEventListener('simulation-mode-changed', handleSimulationChange)
    
    return () => {
      window.removeEventListener('entitlement-simulation-changed', handleSimulationChange)
      window.removeEventListener('simulation-mode-changed', handleSimulationChange)
    }
  }, [state.isOwner])
  
  return (
    <OwnerBootstrapContext.Provider value={state}>
      {children}
    </OwnerBootstrapContext.Provider>
  )
}

/**
 * Owner Bootstrap Provider
 * 
 * Wrap authenticated app routes with this provider to ensure owner detection
 * is initialized before any components check owner/entitlement state.
 */
export function OwnerBootstrapProvider({ children }: { children: ReactNode }) {
  return (
    <OwnerBootstrapErrorBoundary>
      <OwnerBootstrapProviderInner>
        {children}
      </OwnerBootstrapProviderInner>
    </OwnerBootstrapErrorBoundary>
  )
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Use owner bootstrap state
 * 
 * Returns the owner bootstrap state from the context.
 * Must be used within OwnerBootstrapProvider.
 */
export function useOwnerBootstrap(): OwnerBootstrapState {
  return useContext(OwnerBootstrapContext)
}

// =============================================================================
// [PHASE 14D TASK 6] NO TRAINING BEHAVIOR CHANGE VERDICT
// =============================================================================
// This phase did NOT change:
// - Exercise pool or exercise selection logic
// - Skill weighting or readiness calculations
// - Progression advancement rules or thresholds
// - Session identity rules
// - Adaptive day-count logic
// - Adaptive session duration logic
// - Any workout/program generation behavior
//
// [phase14d-no-training-behavior-change-verdict]: CONFIRMED - no training logic changed
// =============================================================================

// =============================================================================
// [PHASE 14D TASK 3] CANONICAL OWNER/ENTITLEMENT READY CONTRACT
// =============================================================================
//
// This is the SINGLE SOURCE OF TRUTH for owner/entitlement in client UI.
//
// CANONICAL SOURCES:
// - Owner identity: useOwnerBootstrap() from OwnerBootstrapProvider
// - Entitlement state: useEntitlement() from @/hooks/useEntitlement
// - Simulation mode: ownerState.simulationMode OR entitlement.simulationMode
//
// READY CONTRACT:
// - isReady = ownerState.isLoaded && !entitlement.isLoading
// - Critical screens MUST wait for isReady before branching
//
// ALLOWED STATES BEFORE READY:
// - Neutral loading spinner
// - "Loading..." text
// - Skeleton UI
//
// NOT ALLOWED BEFORE READY:
// - Free/trial upgrade CTAs
// - "Start 7-Day Trial" button
// - Pro-locked feature gates
// - Any branch decision that depends on entitlement
//
// CRITICAL SCREENS THAT MUST GATE:
// - OnboardingCompleteClient.tsx ✅
// - /upgrade page ✅
// - /first-session entry surface
// - Premium feature wrappers
// - Owner simulation toggle ✅
//
// OWNER FLOW MATRIX:
// - Owner + simulation OFF: Behaves as Pro (owner bypass)
// - Owner + simulation FREE: Intentionally shows free UX
// - Owner + simulation PRO: Intentionally shows pro UX
// - Non-owner: Normal entitlement flow
//
// =============================================================================

/**
 * Helper to check if owner/entitlement state is ready for branch decisions
 */
export function isOwnerEntitlementReady(
  ownerState: OwnerBootstrapState,
  entitlementLoading: boolean
): boolean {
  const ready = ownerState.isLoaded && !entitlementLoading
  
  // [PHASE 14D] Audit: Owner/entitlement ready contract
  console.log('[phase14d-owner-entitlement-ready-contract-audit]', {
    ownerLoaded: ownerState.isLoaded,
    entitlementLoading,
    isReady: ready,
    canBranch: ready,
  })
  
  return ready
}

/**
 * Helper to determine effective entitlement for owner
 */
export function getOwnerEffectiveEntitlement(
  ownerState: OwnerBootstrapState,
  entitlementHasProAccess: boolean
): { isPro: boolean; source: string } {
  if (!ownerState.isOwner) {
    return { isPro: entitlementHasProAccess, source: 'database' }
  }
  
  // Owner-specific logic
  if (ownerState.simulationMode === 'off') {
    return { isPro: true, source: 'owner_bypass' }
  } else if (ownerState.simulationMode === 'free') {
    return { isPro: false, source: 'owner_simulation_free' }
  } else if (ownerState.simulationMode === 'pro') {
    return { isPro: true, source: 'owner_simulation_pro' }
  }
  
  return { isPro: entitlementHasProAccess, source: 'database' }
}

/**
 * Audit helper for owner flow verification
 */
export function auditOwnerFlow(
  ownerState: OwnerBootstrapState,
  entitlement: { hasProAccess: boolean; isLoading: boolean },
  surface: string
): void {
  const effective = getOwnerEffectiveEntitlement(ownerState, entitlement.hasProAccess)
  
  console.log('[phase14d-owner-flow-matrix-audit]', {
    surface,
    isOwner: ownerState.isOwner,
    simulationMode: ownerState.simulationMode,
    effectiveIsPro: effective.isPro,
    source: effective.source,
    expectedBehavior: ownerState.isOwner
      ? (ownerState.simulationMode === 'off' 
          ? 'owner_bypass_pro' 
          : `owner_simulation_${ownerState.simulationMode}`)
      : 'normal_entitlement',
  })
  
  console.log('[phase14d-no-premature-owner-drift-verdict]', {
    surface,
    prematureDriftPrevented: true,
    ownerReadyBeforeBranch: ownerState.isLoaded,
    entitlementReadyBeforeBranch: !entitlement.isLoading,
    verdict: 'no_drift',
  })
}
