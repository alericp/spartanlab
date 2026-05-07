/**
 * PHASE M1 — Recovery-to-Program Awareness Bridge Contract
 * 
 * This module provides a typed, non-mutating bridge that reads existing L1/L2/L3/L4
 * recovery and deload recommendation truth and converts it into a safe advisory object
 * for Program/Workout page consumption.
 * 
 * CRITICAL INVARIANTS:
 * - This bridge CONSUMES L4 recommendation truth — it does NOT recompute deload logic.
 * - No program mutation ever occurs through this bridge.
 * - No workout mutation ever occurs through this bridge.
 * - No automatic deloads are applied.
 * - All output is strictly ADVISORY ONLY.
 * 
 * @phase M1
 * @step M1.1 of M1.3
 */

import type {
  RecoveryAdaptationSnapshot,
  DeloadRecommendationDecision,
  DeloadRecommendationLevel,
  RecoveryReadinessCheckIn,
} from './recovery-adaptation-snapshot-contract'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Recovery awareness level for Program/Workout surfaces.
 * Maps from L4 DeloadRecommendationLevel to a simpler, display-friendly ladder.
 */
export type RecoveryProgramAwarenessLevel =
  | 'none'              // No notable recovery concern — train as planned
  | 'monitor'           // Mild strain signals — stay aware
  | 'reduce_load'       // Moderate strain — consider lighter training
  | 'deload_recommended' // High strain — deload is recommended

/**
 * Source signals snapshot for the bridge — tracks what L4/L1 data was consumed.
 */
export interface BridgeSourceSignals {
  /** Whether an L1 recovery snapshot was available */
  hasRecoverySnapshot: boolean
  /** Whether an L4 deload recommendation was available */
  hasDeloadRecommendation: boolean
  /** The L4 recommendation level (if available) */
  l4RecommendationLevel: DeloadRecommendationLevel | null
  /** The L1 recovery readiness level (if available) */
  recoveryReadinessLevel: string | null
  /** The L1 deload signal (if available) */
  deloadSignal: string | null
  /** The L1 fatigue level (if available) */
  fatigueLevel: string | null
  /** The L1 source quality (if available) */
  sourceQuality: string | null
}

/**
 * Proof fields for the bridge — confirms no mutation occurred and L4 truth was consumed.
 */
export interface BridgeProof {
  /** Whether the L4 recommendation was successfully consumed */
  consumedL4Recommendation: boolean
  /** Whether the bridge recomputed deload logic (MUST always be false in M1) */
  recomputedDeloadLogic: false
  /** Whether mutation is allowed (MUST always be false in M1) */
  mutationAllowed: false
  /** Whether this bridge output is safe for Program surface display */
  safeForProgramSurface: boolean
}

/**
 * The M1 Recovery-to-Program Awareness Bridge output.
 * 
 * This is a typed advisory object that Program/Workout surfaces can safely consume
 * to display recovery-aware guidance WITHOUT mutating any program data.
 */
export interface RecoveryProgramAwarenessBridge {
  // ----- Phase/Source identification -----
  /** Phase identifier for this bridge */
  phase: 'M1'
  /** Source of the recommendation truth */
  source: 'l4_deload_recommendation'
  
  // ----- Availability -----
  /** Whether recovery awareness data is available */
  available: boolean
  
  // ----- Advisory level -----
  /** The mapped awareness level for Program surfaces */
  level: RecoveryProgramAwarenessLevel
  
  // ----- Display text -----
  /** Short headline for UI display */
  headline: string
  /** Longer summary explanation */
  summary: string
  
  // ----- NON-MUTATION GUARANTEES (all must be false in M1) -----
  /** Whether any program mutation was applied (MUST be false) */
  programMutationApplied: false
  /** Whether any workout mutation was applied (MUST be false) */
  workoutMutationApplied: false
  /** Whether any automatic deload was applied (MUST be false) */
  automaticDeloadApplied: false
  /** Whether this is advisory only (MUST be true) */
  advisoryOnly: true
  
  // ----- Reason tracing -----
  /** Reason codes from L4 (pass-through) */
  reasonCodes: string[]
  
  // ----- Source signals -----
  /** What L4/L1 data was consumed */
  sourceSignals: BridgeSourceSignals
  
  // ----- Proof -----
  /** Proof that no mutation occurred and L4 was consumed */
  proof: BridgeProof
  
  // ----- Timestamp -----
  /** When this bridge output was generated */
  generatedAt: string
}

// =============================================================================
// BRIDGE INPUT TYPE
// =============================================================================

/**
 * Input for the M1 bridge derivation.
 * Accepts L1 snapshot and/or L4 recommendation — both optional for legacy safety.
 */
export interface RecoveryProgramAwarenessBridgeInput {
  /** L1 recovery adaptation snapshot (optional) */
  snapshot?: RecoveryAdaptationSnapshot | null
  /** L4 deload recommendation decision (optional) */
  deloadRecommendation?: DeloadRecommendationDecision | null
  /** L2 check-in (optional, for additional context) */
  checkIn?: RecoveryReadinessCheckIn | null
}

// =============================================================================
// MAPPING HELPERS
// =============================================================================

/**
 * Map L4 DeloadRecommendationLevel to M1 RecoveryProgramAwarenessLevel.
 * This is a conservative, non-recomputing pass-through mapping.
 */
function mapL4LevelToAwarenessLevel(
  l4Level: DeloadRecommendationLevel | null,
): RecoveryProgramAwarenessLevel {
  if (!l4Level) return 'none'
  
  switch (l4Level) {
    case 'NONE':
      return 'none'
    case 'WATCH':
      return 'monitor'
    case 'CONSIDER_DELOAD':
      return 'reduce_load'
    case 'STRONGLY_RECOMMEND_DELOAD':
      return 'deload_recommended'
    default:
      return 'none'
  }
}

/**
 * Generate headline text based on awareness level.
 * Uses truthful, non-mutating language.
 */
function getHeadline(level: RecoveryProgramAwarenessLevel): string {
  switch (level) {
    case 'none':
      return 'Ready to train'
    case 'monitor':
      return 'Monitor recovery'
    case 'reduce_load':
      return 'Consider lighter training'
    case 'deload_recommended':
      return 'Deload recommended'
    default:
      return 'Recovery status'
  }
}

/**
 * Generate summary text based on awareness level and source data.
 * Uses truthful, non-mutating, advisory-only language.
 */
function getSummary(
  level: RecoveryProgramAwarenessLevel,
  hasData: boolean,
  l4Summary?: string | null,
): string {
  // If L4 provided a summary, prefer it (it's already advisory-compliant)
  if (l4Summary && hasData) {
    return l4Summary
  }
  
  if (!hasData) {
    return 'No recovery check-in data available. Complete a check-in for personalized guidance.'
  }
  
  switch (level) {
    case 'none':
      return 'Recovery signals look good. Train as planned.'
    case 'monitor':
      return 'Some recovery strain detected. Stay aware of how you feel during training.'
    case 'reduce_load':
      return 'Recovery signals suggest considering lighter training today. No automatic changes have been made.'
    case 'deload_recommended':
      return 'Multiple strain signals indicate a deload may be beneficial. This is a recommendation only — your program has not been changed.'
    default:
      return 'Recovery guidance is available.'
  }
}

// =============================================================================
// MAIN BRIDGE DERIVATION FUNCTION
// =============================================================================

/**
 * Derive the M1 Recovery-to-Program Awareness Bridge from L1 snapshot and L4 recommendation.
 * 
 * This is a PURE function that:
 *   - Consumes existing L4 recommendation truth (does NOT recompute)
 *   - Maps L4 levels to display-friendly awareness levels
 *   - Guarantees all mutation flags are false
 *   - Returns a typed advisory object for Program/Workout surfaces
 * 
 * CRITICAL: This function does NOT:
 *   - Recompute deload logic
 *   - Mutate programs or workouts
 *   - Apply automatic deloads
 *   - Read from localStorage or window
 *   - Have any side effects
 * 
 * @param input - L1 snapshot and/or L4 recommendation
 * @returns RecoveryProgramAwarenessBridge - typed advisory object
 */
export function deriveRecoveryProgramAwarenessBridge(
  input: RecoveryProgramAwarenessBridgeInput,
): RecoveryProgramAwarenessBridge {
  const { snapshot, deloadRecommendation } = input
  const now = new Date().toISOString()
  
  // Build source signals from available data
  const sourceSignals: BridgeSourceSignals = {
    hasRecoverySnapshot: snapshot !== null && snapshot !== undefined,
    hasDeloadRecommendation: deloadRecommendation !== null && deloadRecommendation !== undefined,
    l4RecommendationLevel: deloadRecommendation?.recommendationLevel ?? null,
    recoveryReadinessLevel: snapshot?.readinessLevel ?? null,
    deloadSignal: snapshot?.deloadSignal ?? null,
    fatigueLevel: snapshot?.fatigueLevel ?? null,
    sourceQuality: snapshot?.sourceQuality ?? null,
  }
  
  const hasData = sourceSignals.hasRecoverySnapshot || sourceSignals.hasDeloadRecommendation
  
  // Map L4 level to awareness level (no recomputation)
  const level = mapL4LevelToAwarenessLevel(deloadRecommendation?.recommendationLevel ?? null)
  
  // Generate display text
  const headline = getHeadline(level)
  const summary = getSummary(level, hasData, deloadRecommendation?.userFacingSummary)
  
  // Pass through reason codes from L4 (no invention)
  const reasonCodes: string[] = deloadRecommendation?.recommendationReasonCodes ?? []
  
  // Build proof
  const proof: BridgeProof = {
    consumedL4Recommendation: sourceSignals.hasDeloadRecommendation,
    recomputedDeloadLogic: false, // CRITICAL: Always false in M1
    mutationAllowed: false,       // CRITICAL: Always false in M1
    safeForProgramSurface: true,
  }
  
  return {
    // Phase/source
    phase: 'M1',
    source: 'l4_deload_recommendation',
    
    // Availability
    available: hasData,
    
    // Advisory level
    level,
    
    // Display text
    headline,
    summary,
    
    // NON-MUTATION GUARANTEES
    programMutationApplied: false,
    workoutMutationApplied: false,
    automaticDeloadApplied: false,
    advisoryOnly: true,
    
    // Reason tracing
    reasonCodes,
    
    // Source signals
    sourceSignals,
    
    // Proof
    proof,
    
    // Timestamp
    generatedAt: now,
  }
}

// =============================================================================
// UTILITY HELPERS
// =============================================================================

/**
 * Create an empty/neutral bridge output for cases where no data is available.
 * Safe fallback that guarantees no mutation claims.
 */
export function createEmptyAwarenessBridge(): RecoveryProgramAwarenessBridge {
  return deriveRecoveryProgramAwarenessBridge({
    snapshot: null,
    deloadRecommendation: null,
  })
}

/**
 * Check if the bridge indicates any notable recovery concern.
 * Useful for conditional UI rendering.
 */
export function hasRecoveryConcern(bridge: RecoveryProgramAwarenessBridge): boolean {
  return bridge.available && bridge.level !== 'none'
}

/**
 * Get a compact display object for UI chips/badges.
 */
export function getBridgeDisplayChip(bridge: RecoveryProgramAwarenessBridge): {
  visible: boolean
  label: string
  severity: 'info' | 'warning' | 'alert' | 'neutral'
} {
  if (!bridge.available) {
    return { visible: false, label: '', severity: 'neutral' }
  }
  
  switch (bridge.level) {
    case 'none':
      return { visible: false, label: '', severity: 'neutral' }
    case 'monitor':
      return { visible: true, label: 'Monitor', severity: 'info' }
    case 'reduce_load':
      return { visible: true, label: 'Consider lighter', severity: 'warning' }
    case 'deload_recommended':
      return { visible: true, label: 'Deload recommended', severity: 'alert' }
    default:
      return { visible: false, label: '', severity: 'neutral' }
  }
}
