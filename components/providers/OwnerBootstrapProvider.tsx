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
  isCurrentUserOwner,
  getOwnerEmail,
  getCurrentUserEmail,
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

function isPreviewEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('vusercontent.net') || 
         hostname.includes('localhost') ||
         hostname.includes('vercel.app')
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
    const isPreview = isPreviewEnvironment()
    const ownerEmail = getOwnerEmail()
    const simMode = getSimulationMode()
    
    // [PHASE 14B] Audit: Log bootstrap start
    console.log('[phase14b-owner-bootstrap-audit]', {
      authLoaded: isLoaded,
      isPreview,
      clerkUserExists: !!user,
      clerkEmail: user?.emailAddresses?.[0]?.emailAddress ?? null,
      configuredOwnerEmail: ownerEmail,
      cachedEmailBefore: getCurrentUserEmail(),
    })
    
    // In preview environments, enable owner features for testing
    if (isPreview) {
      setState({
        isLoaded: true,
        isOwner: true,
        userEmail: 'preview-mode@spartanlab.app',
        ownerEmail,
        simulationMode: simMode,
      })
      
      console.log('[phase14b-owner-bootstrap-final-verdict]', {
        verdict: 'owner_enabled_preview_mode',
        isOwner: true,
        simulationMode: simMode,
      })
      return
    }
    
    if (isLoaded) {
      if (user) {
        // Get email from Clerk
        const rawEmail = user?.emailAddresses?.[0]?.emailAddress
        const email = rawEmail ? rawEmail.trim() : null
        
        // CRITICAL: Set the cached email for owner-access module
        setCurrentUserEmail(email)
        
        const isOwnerResult = isCurrentUserOwner()
        
        setState({
          isLoaded: true,
          isOwner: isOwnerResult,
          userEmail: email,
          ownerEmail,
          simulationMode: isOwnerResult ? simMode : 'off',
        })
        
        // [PHASE 14B] Audit: Log final bootstrap result
        console.log('[phase14b-owner-bootstrap-final-verdict]', {
          verdict: isOwnerResult ? 'owner_detected' : 'not_owner',
          isOwner: isOwnerResult,
          userEmail: email,
          ownerEmail,
          cachedEmailAfter: getCurrentUserEmail(),
          simulationMode: isOwnerResult ? simMode : 'off',
        })
        
        // [PHASE 14C TASK 6] Owner E2E flow audit
        console.log('[phase14c-owner-e2e-flow-audit]', {
          step: 'bootstrap_complete',
          isOwner: isOwnerResult,
          simulationMode: isOwnerResult ? simMode : 'off',
          expectedBehavior: isOwnerResult
            ? (simMode === 'off' ? 'owner_bypass_pro' : `owner_simulation_${simMode}`)
            : 'regular_user',
        })
        
        console.log('[phase14c-owner-flow-final-verdict]', {
          ownerDetected: isOwnerResult,
          simulationMode: isOwnerResult ? simMode : 'off',
          checkoutPrevented: isOwnerResult && simMode !== 'free',
          proAccessGranted: isOwnerResult && simMode !== 'free',
          verdict: isOwnerResult ? 'owner_flow_correct' : 'regular_user_flow',
        })
      } else {
        // No user - clear cache
        clearCurrentUserEmail()
        
        setState({
          isLoaded: true,
          isOwner: false,
          userEmail: null,
          ownerEmail,
          simulationMode: 'off',
        })
        
        console.log('[phase14b-owner-bootstrap-final-verdict]', {
          verdict: 'no_user',
          isOwner: false,
          cachedEmailAfter: getCurrentUserEmail(),
        })
      }
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
