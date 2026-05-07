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

// =============================================================================
// STEP 21.6 — RECOVERY SESSION ADJUSTMENT LAYER
// =============================================================================
// This layer enables bounded, user-approved, current-session-only adjustments
// based on the M1 advisory bridge. Key principles:
//   - PREVIEW FIRST: User must see changes before applying
//   - USER APPROVAL: No automatic mutation from check-in alone
//   - CURRENT-SESSION-ONLY: Does not affect saved program or future sessions
//   - ORIGINAL PRESERVED: Original session remains available for comparison
//   - START WORKOUT PARITY: Applied adjustment flows through to workout launch
// =============================================================================

/**
 * Adjustment status for tracking user approval flow.
 */
export type RecoveryAdjustmentStatus = 'preview' | 'applied' | 'dismissed'

/**
 * A single field change in the recovery adjustment.
 */
export interface RecoveryAdjustmentChange {
  /** Path/field that was changed (e.g., "exercises[0].sets", "restSeconds") */
  path: string
  /** Human-readable field label */
  label: string
  /** Value before adjustment */
  before: string | number | null
  /** Value after adjustment */
  after: string | number | null
  /** Reason for this specific change */
  reason: string
}

/**
 * Exercise-level adjustment detail for preview display.
 */
export interface ExerciseAdjustmentDetail {
  exerciseId: string
  exerciseName: string
  adjustmentType: 'sets_reduced' | 'rpe_reduced' | 'rest_increased' | 'volume_reduced' | 'unchanged'
  changes: RecoveryAdjustmentChange[]
}

/**
 * Session adjustment preview — the typed object that shows the user
 * what changes would be made before they approve.
 */
export interface RecoverySessionAdjustmentPreview {
  /** Unique ID for this preview instance */
  id: string
  /** Source of the adjustment recommendation */
  source: 'recovery-awareness-bridge'
  /** Scope of the adjustment (always current-session-only in Step 21.6) */
  scope: 'current-session-only'
  /** Current status in the approval flow */
  status: RecoveryAdjustmentStatus
  /** When this preview was created */
  createdAt: string
  /** Reason codes explaining why adjustment is recommended */
  reasonCodes: string[]
  /** User-facing message explaining the adjustment */
  userMessage: string
  /** Fingerprint of the original session (for parity checking) */
  originalSessionFingerprint: string
  /** Fingerprint of the adjusted session (for parity checking) */
  adjustedSessionFingerprint: string
  /** Per-exercise adjustment details for preview display */
  exerciseAdjustments: ExerciseAdjustmentDetail[]
  /** Overall summary of changes */
  overallSummary: {
    totalExercisesAffected: number
    totalExercisesUnchanged: number
    estimatedTimeReduction: number // minutes saved
    adjustmentIntensity: 'light' | 'moderate' | 'significant'
  }
  /** The recovery awareness level that triggered this adjustment */
  triggerLevel: RecoveryProgramAwarenessLevel
  /** NON-MUTATION PROOF: These flags confirm the adjustment semantics */
  proof: {
    /** Original session was preserved (always true) */
    originalPreserved: true
    /** User approval was required (always true) */
    userApprovalRequired: true
    /** Scope is limited to current session (always true) */
    scopeLimitedToCurrentSession: true
    /** Saved program was NOT changed (always true) */
    savedProgramUnchanged: true
  }
}

/**
 * Simplified exercise shape for adjustment computation.
 * This is the minimal interface needed to compute adjustments.
 */
interface AdjustableExercise {
  id: string
  name: string
  sets?: number
  repsOrTime?: string | number
  targetRPE?: number | string
  restSeconds?: number
  category?: string
  [key: string]: unknown
}

/**
 * Simplified session shape for adjustment computation.
 */
interface AdjustableSession {
  dayNumber: number
  exercises?: AdjustableExercise[]
  estimatedMinutes?: number
  [key: string]: unknown
}

/**
 * Input for the recovery session adjustment derivation.
 */
export interface RecoverySessionAdjustmentInput {
  /** The M1 recovery awareness bridge output */
  bridge: RecoveryProgramAwarenessBridge
  /** The current session to potentially adjust */
  session: AdjustableSession
}

/**
 * Derive a recovery session adjustment preview from the M1 bridge and current session.
 * 
 * This is a PURE function that:
 *   - Consumes the existing M1 bridge advisory
 *   - Does NOT modify the original session
 *   - Creates an adjusted session COPY
 *   - Returns null when no adjustment is warranted
 *   - Tracks all changes for user preview
 * 
 * CRITICAL: This function does NOT:
 *   - Apply automatic adjustments without user approval
 *   - Modify the saved program
 *   - Affect future sessions
 *   - Change the original session object
 * 
 * @param input - M1 bridge output and current session
 * @returns RecoverySessionAdjustmentPreview or null if no adjustment warranted
 */
export function deriveRecoverySessionAdjustmentPreview(
  input: RecoverySessionAdjustmentInput,
): RecoverySessionAdjustmentPreview | null {
  const { bridge, session } = input
  
  // No adjustment if bridge indicates no concern
  if (!bridge.available || bridge.level === 'none') {
    return null
  }
  
  // For 'monitor' level, we offer adjustment but keep it very light
  // For 'reduce_load' and 'deload_recommended', more substantial adjustments
  
  const exercises = session.exercises ?? []
  if (exercises.length === 0) {
    return null // No exercises to adjust
  }
  
  const exerciseAdjustments: ExerciseAdjustmentDetail[] = []
  let totalTimeReduction = 0
  let affectedCount = 0
  
  // Compute adjustments based on recovery level
  const adjustmentConfig = getAdjustmentConfig(bridge.level)
  
  for (const exercise of exercises) {
    const changes: RecoveryAdjustmentChange[] = []
    let adjustmentType: ExerciseAdjustmentDetail['adjustmentType'] = 'unchanged'
    
    // Reduce sets if applicable
    if (adjustmentConfig.reduceSets && typeof exercise.sets === 'number' && exercise.sets > 2) {
      const newSets = Math.max(2, exercise.sets - adjustmentConfig.setsReduction)
      if (newSets < exercise.sets) {
        changes.push({
          path: 'sets',
          label: 'Working sets',
          before: exercise.sets,
          after: newSets,
          reason: `Reduced volume to support recovery (${bridge.level.replace('_', ' ')})`,
        })
        totalTimeReduction += (exercise.sets - newSets) * 3 // ~3 min per set
        adjustmentType = 'sets_reduced'
      }
    }
    
    // Reduce RPE if applicable
    if (adjustmentConfig.reduceRPE && exercise.targetRPE !== undefined) {
      const currentRPE = typeof exercise.targetRPE === 'string' 
        ? parseFloat(exercise.targetRPE) 
        : exercise.targetRPE
      if (!isNaN(currentRPE) && currentRPE > 6) {
        const newRPE = Math.max(6, currentRPE - adjustmentConfig.rpeReduction)
        if (newRPE < currentRPE) {
          changes.push({
            path: 'targetRPE',
            label: 'Target intensity',
            before: `RPE ${currentRPE}`,
            after: `RPE ${newRPE}`,
            reason: `Reduced intensity to manage fatigue`,
          })
          if (adjustmentType === 'unchanged') adjustmentType = 'rpe_reduced'
        }
      }
    }
    
    // Increase rest if applicable
    if (adjustmentConfig.increaseRest && typeof exercise.restSeconds === 'number') {
      const newRest = Math.min(180, exercise.restSeconds + adjustmentConfig.restIncrease)
      if (newRest > exercise.restSeconds) {
        changes.push({
          path: 'restSeconds',
          label: 'Rest period',
          before: `${exercise.restSeconds}s`,
          after: `${newRest}s`,
          reason: `Extended rest for better recovery between sets`,
        })
        if (adjustmentType === 'unchanged') adjustmentType = 'rest_increased'
      }
    }
    
    if (changes.length > 0) {
      affectedCount++
    }
    
    exerciseAdjustments.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      adjustmentType,
      changes,
    })
  }
  
  // If no meaningful adjustments, return null
  if (affectedCount === 0) {
    return null
  }
  
  // Determine adjustment intensity
  const adjustmentIntensity: 'light' | 'moderate' | 'significant' = 
    affectedCount <= 2 ? 'light' :
    affectedCount <= 4 ? 'moderate' : 'significant'
  
  // Build user message
  const userMessage = buildAdjustmentUserMessage(bridge.level, affectedCount, totalTimeReduction)
  
  // Build fingerprints (simplified - in production would hash actual data)
  const originalFingerprint = `original-day${session.dayNumber}-${exercises.length}ex`
  const adjustedFingerprint = `adjusted-day${session.dayNumber}-${exercises.length}ex-${affectedCount}mod`
  
  return {
    id: `recovery-adj-${Date.now()}-${session.dayNumber}`,
    source: 'recovery-awareness-bridge',
    scope: 'current-session-only',
    status: 'preview',
    createdAt: new Date().toISOString(),
    reasonCodes: bridge.reasonCodes,
    userMessage,
    originalSessionFingerprint: originalFingerprint,
    adjustedSessionFingerprint: adjustedFingerprint,
    exerciseAdjustments,
    overallSummary: {
      totalExercisesAffected: affectedCount,
      totalExercisesUnchanged: exercises.length - affectedCount,
      estimatedTimeReduction: totalTimeReduction,
      adjustmentIntensity,
    },
    triggerLevel: bridge.level,
    proof: {
      originalPreserved: true,
      userApprovalRequired: true,
      scopeLimitedToCurrentSession: true,
      savedProgramUnchanged: true,
    },
  }
}

/**
 * Get adjustment configuration based on recovery level.
 */
function getAdjustmentConfig(level: RecoveryProgramAwarenessLevel): {
  reduceSets: boolean
  setsReduction: number
  reduceRPE: boolean
  rpeReduction: number
  increaseRest: boolean
  restIncrease: number
} {
  switch (level) {
    case 'monitor':
      return {
        reduceSets: false,
        setsReduction: 0,
        reduceRPE: true,
        rpeReduction: 0.5,
        increaseRest: true,
        restIncrease: 15,
      }
    case 'reduce_load':
      return {
        reduceSets: true,
        setsReduction: 1,
        reduceRPE: true,
        rpeReduction: 1,
        increaseRest: true,
        restIncrease: 30,
      }
    case 'deload_recommended':
      return {
        reduceSets: true,
        setsReduction: 2,
        reduceRPE: true,
        rpeReduction: 1.5,
        increaseRest: true,
        restIncrease: 45,
      }
    default:
      return {
        reduceSets: false,
        setsReduction: 0,
        reduceRPE: false,
        rpeReduction: 0,
        increaseRest: false,
        restIncrease: 0,
      }
  }
}

/**
 * Build user-facing message for adjustment preview.
 */
function buildAdjustmentUserMessage(
  level: RecoveryProgramAwarenessLevel,
  affectedCount: number,
  timeReduction: number,
): string {
  const timeText = timeReduction > 0 ? ` (~${timeReduction} min shorter)` : ''
  
  switch (level) {
    case 'monitor':
      return `Light adjustment available: reduced intensity on ${affectedCount} exercise${affectedCount > 1 ? 's' : ''}${timeText}. Your original session is preserved.`
    case 'reduce_load':
      return `Recovery-adjusted session: reduced volume and intensity on ${affectedCount} exercise${affectedCount > 1 ? 's' : ''}${timeText}. Apply to today only — your program is unchanged.`
    case 'deload_recommended':
      return `Deload adjustment recommended: significantly reduced volume on ${affectedCount} exercise${affectedCount > 1 ? 's' : ''}${timeText}. This change applies to today only.`
    default:
      return `Adjustment preview: ${affectedCount} exercise${affectedCount > 1 ? 's' : ''} modified${timeText}.`
  }
}

/**
 * Apply the preview's adjustments to create an adjusted session copy.
 * 
 * CRITICAL: This does NOT mutate the original session.
 * It creates a new session object with adjustments applied.
 * 
 * @param originalSession - The original session (will NOT be modified)
 * @param preview - The adjustment preview with changes to apply
 * @returns A new session object with adjustments applied
 */
export function applyRecoveryAdjustmentToSession<T extends AdjustableSession>(
  originalSession: T,
  preview: RecoverySessionAdjustmentPreview,
): T & { recoveryAdjustmentApplied: true; recoveryAdjustmentScope: 'current-session-only' } {
  // Deep clone the session to avoid any mutation
  const adjustedSession = JSON.parse(JSON.stringify(originalSession)) as T
  
  // Apply each exercise adjustment
  const exercises = adjustedSession.exercises ?? []
  for (const exerciseAdj of preview.exerciseAdjustments) {
    const exercise = exercises.find(e => e.id === exerciseAdj.exerciseId)
    if (!exercise) continue
    
    for (const change of exerciseAdj.changes) {
      if (change.path === 'sets' && typeof change.after === 'number') {
        exercise.sets = change.after
      } else if (change.path === 'targetRPE' && typeof change.after === 'string') {
        const rpeMatch = change.after.match(/RPE\s*(\d+\.?\d*)/)
        if (rpeMatch) {
          exercise.targetRPE = parseFloat(rpeMatch[1])
        }
      } else if (change.path === 'restSeconds' && typeof change.after === 'string') {
        const restMatch = change.after.match(/(\d+)s/)
        if (restMatch) {
          exercise.restSeconds = parseInt(restMatch[1], 10)
        }
      }
    }
  }
  
  // Update estimated time if applicable
  if (typeof adjustedSession.estimatedMinutes === 'number' && preview.overallSummary.estimatedTimeReduction > 0) {
    adjustedSession.estimatedMinutes = Math.max(
      15,
      adjustedSession.estimatedMinutes - preview.overallSummary.estimatedTimeReduction
    )
  }
  
  // Stamp recovery adjustment metadata
  return {
    ...adjustedSession,
    recoveryAdjustmentApplied: true as const,
    recoveryAdjustmentScope: 'current-session-only' as const,
  }
}

/**
 * Check if an adjustment preview is available for this session.
 */
export function hasAdjustmentPreview(
  bridge: RecoveryProgramAwarenessBridge | null,
  session: AdjustableSession | null,
): boolean {
  if (!bridge || !session) return false
  const preview = deriveRecoverySessionAdjustmentPreview({ bridge, session })
  return preview !== null
}
