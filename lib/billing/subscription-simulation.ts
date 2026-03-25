/**
 * Subscription Simulation System
 * 
 * Owner-only tool for testing Free/Pro states without modifying real billing.
 * 
 * Rules:
 * - Only the platform owner can use simulation
 * - Simulation does NOT write to Stripe or persistent billing records
 * - Simulation affects UI/feature gating only for testing
 * - Real users are completely unaffected
 */

import { isCurrentUserOwner } from '@/lib/owner-access'

// =============================================================================
// TYPES
// =============================================================================

export type SimulationMode = 'off' | 'free' | 'pro'

export interface SimulationState {
  mode: SimulationMode
  isActive: boolean
  effectiveTier: 'free' | 'pro' | null // null = use real state
}

// =============================================================================
// STORAGE
// =============================================================================

// CANONICAL simulation storage key - matches feature-access.ts
const SIMULATION_KEY = 'spartanlab_owner_sim'

/**
 * Get current simulation mode (owner only)
 */
export function getSimulationMode(): SimulationMode {
  if (typeof window === 'undefined') return 'off'
  
  // Only owner can have simulation active
  if (!isCurrentUserOwner()) return 'off'
  
  try {
    const stored = sessionStorage.getItem(SIMULATION_KEY)
    if (!stored) return 'off'
    
    const mode = stored as SimulationMode
    if (mode === 'free' || mode === 'pro') {
      return mode
    }
    return 'off'
  } catch {
    return 'off'
  }
}

/**
 * Set simulation mode (owner only)
 * [PHASE 14C TASK 3] This is the CANONICAL simulation setter
 */
export function setSimulationMode(mode: SimulationMode): void {
  if (typeof window === 'undefined') return
  
  // Safety check - only owner can set simulation
  if (!isCurrentUserOwner()) return
  
  const previousMode = getSimulationMode()
  
  if (mode === 'off') {
    sessionStorage.removeItem(SIMULATION_KEY)
  } else {
    sessionStorage.setItem(SIMULATION_KEY, mode)
  }
  
  // [PHASE 14C TASK 3] Unified event dispatch - canonical event name
  // Dispatching both names for backward compatibility during migration
  window.dispatchEvent(new CustomEvent('entitlement-simulation-changed', { detail: mode }))
  window.dispatchEvent(new CustomEvent('simulation-mode-changed', { detail: mode }))
  
  // [PHASE 14C] Simulation event unification audit
  console.log('[phase14c-simulation-event-unification-audit]', {
    modeBefore: previousMode,
    modeAfter: mode,
    canonicalEventDispatched: 'entitlement-simulation-changed',
    legacyEventDispatched: 'simulation-mode-changed',
    listenersWillUpdate: true,
    effectiveEntitlement: mode === 'off' ? 'real_state' : mode,
  })
  
  console.log('[phase14c-simulation-effective-entitlement-verdict]', {
    simulationMode: mode,
    effectiveEntitlement: mode === 'free' ? 'free' : mode === 'pro' ? 'pro' : 'real_database_state',
    sourceHelper: 'setSimulationMode',
  })
}

/**
 * Get full simulation state
 */
export function getSimulationState(): SimulationState {
  const mode = getSimulationMode()
  
  // [PHASE 14B TASK 2] Simulation tier verdict audit
  console.log('[phase14b-owner-simulation-tier-verdict]', {
    currentMode: mode,
    isActive: mode !== 'off',
    effectiveTier: mode === 'off' ? 'real_state' : mode,
    sourceHelper: 'getSimulationState',
  })
  
  return {
    mode,
    isActive: mode !== 'off',
    effectiveTier: mode === 'off' ? null : mode,
  }
}

/**
 * Check if simulation is currently active
 */
export function isSimulationActive(): boolean {
  return getSimulationMode() !== 'off'
}

/**
 * Get the simulated tier if active, null otherwise
 */
export function getSimulatedTier(): 'free' | 'pro' | null {
  const mode = getSimulationMode()
  if (mode === 'off') return null
  return mode
}

/**
 * Clear simulation (return to real state)
 */
export function clearSimulation(): void {
  setSimulationMode('off')
}

/**
 * Toggle to next simulation mode: off -> free -> pro -> off
 */
export function cycleSimulationMode(): SimulationMode {
  const current = getSimulationMode()
  const next: SimulationMode = 
    current === 'off' ? 'free' :
    current === 'free' ? 'pro' : 'off'
  
  setSimulationMode(next)
  return next
}
