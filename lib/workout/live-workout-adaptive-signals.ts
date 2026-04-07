/**
 * [LIVE-WORKOUT-ADAPTIVE-SIGNALS] Canonical Adaptive Execution Summary
 * 
 * This module is the SINGLE authoritative translator between:
 * A. Raw logged workout execution facts (reps, RPE, load, bands, tags, notes)
 * B. Normalized adaptive decision signals (load direction, support direction, recovery signals)
 * 
 * All adaptive interpretation MUST flow through this module.
 * No parallel mini-interpreters allowed.
 */

import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'
import type { 
  ExerciseInputMode, 
  CoachingSignalTag,
  COACHING_SIGNAL_SEVERITY,
} from './live-workout-authority-contract'
import type { CompletedSet } from './live-workout-machine'

// =============================================================================
// CANONICAL ADAPTIVE EXECUTION SUMMARY
// =============================================================================

/**
 * Performance outcome classification.
 * Deterministic based on target vs actual comparison.
 */
export type PerformanceOutcome =
  | 'above_target'        // Exceeded target reps/time
  | 'on_target'           // Met target within acceptable range
  | 'under_target'        // Below target reps/time
  | 'high_fatigue'        // High RPE suggests fatigue limit
  | 'technique_limited'   // Form/balance issues limiting performance
  | 'pain_flag'           // Pain signal present - protective stop
  | 'recovery_concern'    // Fatigue/discomfort signals present
  | 'assistance_changed'  // Band selection differs from recommended
  | 'load_adjusted'       // Actual load differs from prescribed

/**
 * Direction signal for intensity/load adjustments.
 */
export type IntensityDirection =
  | 'maintain'            // Keep current difficulty
  | 'reduce_load'         // Lower weight/difficulty
  | 'increase_load'       // Raise weight/difficulty  
  | 'reduce_volume'       // Fewer reps/sets
  | 'increase_volume'     // More reps/sets
  | 'lower_assistance'    // Less band support (harder)
  | 'raise_assistance'    // More band support (easier)
  | 'extend_rest'         // Longer rest needed
  | 'protective_stop'     // Stop this exercise for safety

/**
 * Recovery signal level.
 */
export type RecoverySignal = 'low' | 'moderate' | 'high' | 'critical'

/**
 * Technical execution signal.
 */
export type TechnicalSignal = 'stable' | 'unstable' | 'degraded' | 'failed'

/**
 * Support/assistance adequacy signal (for band-assisted work).
 */
export type SupportSignal = 'under_supported' | 'well_supported' | 'over_supported'

/**
 * Completion status for partial exercise tracking.
 */
export type CompletionStatus =
  | 'complete'            // All sets done
  | 'partial_planned'     // Stopped early by plan (time constraint)
  | 'partial_fatigue'     // Stopped early due to fatigue
  | 'partial_pain'        // Stopped early due to pain/discomfort
  | 'partial_choice'      // User chose to stop (no specific reason)
  | 'skipped'             // Exercise fully skipped

/**
 * The canonical adaptive execution summary.
 * ONE object per completed set that captures all adaptive truth.
 */
export interface AdaptiveExecutionSummary {
  // Identity
  exerciseIndex: number
  setNumber: number
  inputMode: ExerciseInputMode
  timestamp: number
  
  // Performance classification
  performanceOutcome: PerformanceOutcome
  
  // Direction signals
  intensityDirection: IntensityDirection
  recoverySignal: RecoverySignal
  technicalSignal: TechnicalSignal
  supportSignal: SupportSignal | null  // Only for band-assisted
  
  // Quantified deltas
  rpeDeviation: number        // Actual RPE - Target RPE (positive = harder than expected)
  volumeDeviation: number     // Actual reps - Target reps (positive = exceeded)
  loadDeviation: number       // Actual load - Prescribed load (positive = heavier)
  assistanceDeviation: number // 0 = same, negative = less assistance, positive = more
  
  // Confidence and source tracking
  confidenceScore: number     // 0-1, based on data completeness
  sourceFactsUsed: string[]   // List of inputs that contributed to this summary
  
  // Completion tracking
  completionStatus: CompletionStatus
  
  // Trend awareness (populated when prior sets exist)
  trendDirection: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  consecutiveHighRPE: number  // Count of RPE >= 9 in recent sets
  
  // Raw signals for downstream use
  coachingSignals: CoachingSignalTag[]
  hasCriticalSignal: boolean
  hasWarningSignal: boolean
}

// =============================================================================
// TARGET PRESCRIPTION INTERFACE
// =============================================================================

export interface TargetPrescription {
  targetReps?: number
  targetHoldSeconds?: number
  targetRPE?: number
  prescribedLoad?: number
  prescribedLoadUnit?: string
  recommendedBand?: ResistanceBandColor
  recommendedBands?: ResistanceBandColor[]
}

// =============================================================================
// PRIOR SET CONTEXT FOR TREND ANALYSIS
// =============================================================================

export interface PriorSetContext {
  completedSets: CompletedSet[]
  exerciseIndex: number
}

// =============================================================================
// CANONICAL SUMMARY BUILDER
// =============================================================================

const COACHING_SIGNAL_SEVERITY_MAP: Record<CoachingSignalTag, 'info' | 'warning' | 'critical'> = {
  'too_easy': 'info',
  'too_hard': 'warning',
  'pain': 'critical',
  'discomfort': 'warning',
  'fatigue': 'warning',
  'grip_limited': 'info',
  'form_issue': 'warning',
  'balance_issue': 'info',
  'focus_lost': 'info',
  'breathing_issue': 'warning',
  'joint_stress': 'critical',
  'muscle_cramping': 'warning',
}

/**
 * Build the canonical adaptive execution summary from a completed set.
 * This is the SINGLE translator for all adaptive logic.
 */
export function buildAdaptiveExecutionSummary(
  completedSet: CompletedSet,
  target: TargetPrescription,
  priorContext?: PriorSetContext
): AdaptiveExecutionSummary {
  const sourceFactsUsed: string[] = []
  
  // Extract input mode (with fallback)
  const inputMode: ExerciseInputMode = completedSet.inputMode || 'bodyweight_strength'
  sourceFactsUsed.push(`inputMode:${inputMode}`)
  
  // Extract coaching signals
  const coachingSignals: CoachingSignalTag[] = completedSet.structuredCoachingInputs || []
  const hasCriticalSignal = coachingSignals.some(s => COACHING_SIGNAL_SEVERITY_MAP[s] === 'critical')
  const hasWarningSignal = coachingSignals.some(s => COACHING_SIGNAL_SEVERITY_MAP[s] === 'warning')
  
  if (coachingSignals.length > 0) {
    sourceFactsUsed.push(`coachingSignals:${coachingSignals.join(',')}`)
  }
  
  // ===== CALCULATE DEVIATIONS =====
  
  // RPE deviation
  const actualRPE = completedSet.actualRPE || 7
  const targetRPE = target.targetRPE || 8
  const rpeDeviation = actualRPE - targetRPE
  sourceFactsUsed.push(`rpe:${actualRPE}/${targetRPE}`)
  
  // Volume deviation (reps or hold)
  let volumeDeviation = 0
  if (completedSet.holdSeconds !== undefined && target.targetHoldSeconds) {
    volumeDeviation = completedSet.holdSeconds - target.targetHoldSeconds
    sourceFactsUsed.push(`hold:${completedSet.holdSeconds}/${target.targetHoldSeconds}`)
  } else if (completedSet.actualReps && target.targetReps) {
    volumeDeviation = completedSet.actualReps - target.targetReps
    sourceFactsUsed.push(`reps:${completedSet.actualReps}/${target.targetReps}`)
  }
  
  // Load deviation (for weighted exercises)
  let loadDeviation = 0
  if (inputMode === 'weighted_strength' || inputMode === 'reps_per_side') {
    const actualLoad = completedSet.actualLoadUsed ?? completedSet.prescribedLoad ?? 0
    const prescribedLoad = target.prescribedLoad ?? 0
    loadDeviation = actualLoad - prescribedLoad
    if (prescribedLoad > 0 || actualLoad > 0) {
      sourceFactsUsed.push(`load:${actualLoad}/${prescribedLoad}`)
    }
  }
  
  // Assistance deviation (for band-assisted exercises)
  let assistanceDeviation = 0
  let supportSignal: SupportSignal | null = null
  if (inputMode === 'band_assisted_skill') {
    const selectedBands = completedSet.selectedBands || (completedSet.bandUsed !== 'none' ? [completedSet.bandUsed] : [])
    const recommendedBands = target.recommendedBands || (target.recommendedBand ? [target.recommendedBand] : [])
    
    // Calculate rough assistance levels
    const bandAssistance: Record<ResistanceBandColor, number> = {
      'black': 100, 'purple': 80, 'green': 60, 'blue': 45, 'red': 30, 'yellow': 15, 'orange': 10,
    }
    
    const actualAssistance = selectedBands.reduce((sum, b) => sum + (bandAssistance[b] || 20), 0)
    const recommendedAssistance = recommendedBands.reduce((sum, b) => sum + (bandAssistance[b] || 20), 0)
    assistanceDeviation = actualAssistance - recommendedAssistance
    
    // Determine support signal
    if (actualAssistance === 0 && recommendedAssistance > 0) {
      supportSignal = 'under_supported'
    } else if (assistanceDeviation > 20) {
      supportSignal = 'over_supported'
    } else if (assistanceDeviation < -20) {
      supportSignal = 'under_supported'
    } else {
      supportSignal = 'well_supported'
    }
    
    sourceFactsUsed.push(`bands:${selectedBands.join('+')||'none'}`)
  }
  
  // ===== DETERMINE PERFORMANCE OUTCOME =====
  
  let performanceOutcome: PerformanceOutcome = 'on_target'
  
  // Critical signals take priority
  if (hasCriticalSignal || coachingSignals.includes('pain') || coachingSignals.includes('joint_stress')) {
    performanceOutcome = 'pain_flag'
  } else if (coachingSignals.includes('fatigue') || coachingSignals.includes('discomfort') || coachingSignals.includes('muscle_cramping')) {
    performanceOutcome = 'recovery_concern'
  } else if (coachingSignals.includes('form_issue') || coachingSignals.includes('balance_issue')) {
    performanceOutcome = 'technique_limited'
  } else if (actualRPE >= 9) {
    performanceOutcome = 'high_fatigue'
  } else if (volumeDeviation >= 2) {
    performanceOutcome = 'above_target'
  } else if (volumeDeviation <= -2) {
    performanceOutcome = 'under_target'
  } else if (loadDeviation !== 0 && inputMode === 'weighted_strength') {
    performanceOutcome = 'load_adjusted'
  } else if (assistanceDeviation !== 0 && inputMode === 'band_assisted_skill') {
    performanceOutcome = 'assistance_changed'
  }
  
  // ===== DETERMINE INTENSITY DIRECTION =====
  
  let intensityDirection: IntensityDirection = 'maintain'
  
  if (performanceOutcome === 'pain_flag') {
    intensityDirection = 'protective_stop'
  } else if (performanceOutcome === 'high_fatigue' || performanceOutcome === 'recovery_concern') {
    // High fatigue: extend rest, possibly reduce
    if (actualRPE >= 10) {
      intensityDirection = 'reduce_volume'
    } else {
      intensityDirection = 'extend_rest'
    }
  } else if (performanceOutcome === 'technique_limited') {
    // Form issues: reduce load or raise assistance
    if (inputMode === 'band_assisted_skill') {
      intensityDirection = 'raise_assistance'
    } else if (inputMode === 'weighted_strength') {
      intensityDirection = 'reduce_load'
    } else {
      intensityDirection = 'reduce_volume'
    }
  } else if (coachingSignals.includes('too_hard')) {
    if (inputMode === 'weighted_strength') {
      intensityDirection = 'reduce_load'
    } else if (inputMode === 'band_assisted_skill') {
      intensityDirection = 'raise_assistance'
    } else {
      intensityDirection = 'reduce_volume'
    }
  } else if (coachingSignals.includes('too_easy')) {
    if (inputMode === 'weighted_strength') {
      intensityDirection = 'increase_load'
    } else if (inputMode === 'band_assisted_skill') {
      intensityDirection = 'lower_assistance'
    } else {
      intensityDirection = 'increase_volume'
    }
  } else if (volumeDeviation >= 3 && actualRPE <= 7) {
    // Significantly exceeded target with low effort
    if (inputMode === 'weighted_strength') {
      intensityDirection = 'increase_load'
    } else if (inputMode === 'band_assisted_skill') {
      intensityDirection = 'lower_assistance'
    } else {
      intensityDirection = 'increase_volume'
    }
  } else if (volumeDeviation <= -3 && actualRPE >= 8) {
    // Significantly under target with high effort
    if (inputMode === 'weighted_strength') {
      intensityDirection = 'reduce_load'
    } else if (inputMode === 'band_assisted_skill') {
      intensityDirection = 'raise_assistance'
    } else {
      intensityDirection = 'reduce_volume'
    }
  }
  
  // ===== DETERMINE RECOVERY SIGNAL =====
  
  let recoverySignal: RecoverySignal = 'low'
  
  if (hasCriticalSignal) {
    recoverySignal = 'critical'
  } else if (actualRPE >= 10 || (actualRPE >= 9 && hasWarningSignal)) {
    recoverySignal = 'high'
  } else if (actualRPE >= 9 || hasWarningSignal) {
    recoverySignal = 'moderate'
  }
  
  // ===== DETERMINE TECHNICAL SIGNAL =====
  
  let technicalSignal: TechnicalSignal = 'stable'
  
  if (coachingSignals.includes('form_issue')) {
    technicalSignal = volumeDeviation <= -3 ? 'failed' : 'degraded'
  } else if (coachingSignals.includes('balance_issue') || coachingSignals.includes('focus_lost')) {
    technicalSignal = 'unstable'
  } else if (actualRPE >= 10 && volumeDeviation <= -2) {
    technicalSignal = 'degraded'
  }
  
  // ===== TREND ANALYSIS =====
  
  let trendDirection: AdaptiveExecutionSummary['trendDirection'] = 'insufficient_data'
  let consecutiveHighRPE = actualRPE >= 9 ? 1 : 0
  
  if (priorContext && priorContext.completedSets.length > 0) {
    const priorSetsForExercise = priorContext.completedSets.filter(
      s => s.exerciseIndex === completedSet.exerciseIndex
    )
    
    if (priorSetsForExercise.length >= 1) {
      const lastSet = priorSetsForExercise[priorSetsForExercise.length - 1]
      const lastRPE = lastSet.actualRPE || 7
      
      // Count consecutive high RPE
      for (let i = priorSetsForExercise.length - 1; i >= 0; i--) {
        if ((priorSetsForExercise[i].actualRPE || 0) >= 9) {
          consecutiveHighRPE++
        } else {
          break
        }
      }
      
      // Determine trend
      if (actualRPE > lastRPE + 1) {
        trendDirection = 'declining'  // Getting harder
      } else if (actualRPE < lastRPE - 1) {
        trendDirection = 'improving'  // Getting easier
      } else {
        trendDirection = 'stable'
      }
      
      sourceFactsUsed.push(`priorSets:${priorSetsForExercise.length}`)
    }
  }
  
  // ===== CONFIDENCE SCORE =====
  
  let confidenceScore = 0.5  // Base confidence
  
  // Higher confidence with more data
  if (completedSet.actualReps > 0 || completedSet.holdSeconds) confidenceScore += 0.1
  if (completedSet.actualRPE) confidenceScore += 0.2
  if (target.targetReps || target.targetHoldSeconds) confidenceScore += 0.1
  if (priorContext && priorContext.completedSets.length >= 2) confidenceScore += 0.1
  
  confidenceScore = Math.min(1, confidenceScore)
  
  // ===== BUILD FINAL SUMMARY =====
  
  return {
    exerciseIndex: completedSet.exerciseIndex,
    setNumber: completedSet.setNumber,
    inputMode,
    timestamp: completedSet.timestamp,
    
    performanceOutcome,
    intensityDirection,
    recoverySignal,
    technicalSignal,
    supportSignal,
    
    rpeDeviation,
    volumeDeviation,
    loadDeviation,
    assistanceDeviation,
    
    confidenceScore,
    sourceFactsUsed,
    
    completionStatus: 'complete',  // Default; partial completion set separately
    
    trendDirection,
    consecutiveHighRPE,
    
    coachingSignals,
    hasCriticalSignal,
    hasWarningSignal,
  }
}

// =============================================================================
// PARTIAL COMPLETION SUMMARY
// =============================================================================

/**
 * Build summary for partial completion / early stop.
 */
export function buildPartialCompletionSummary(
  exerciseIndex: number,
  completedSets: number,
  totalSets: number,
  reason: 'fatigue' | 'pain' | 'time' | 'choice' | 'skipped',
  lastSetSummary?: AdaptiveExecutionSummary
): AdaptiveExecutionSummary {
  const baseTimestamp = Date.now()
  
  let completionStatus: CompletionStatus = 'partial_choice'
  let recoverySignal: RecoverySignal = 'moderate'
  let intensityDirection: IntensityDirection = 'maintain'
  
  switch (reason) {
    case 'fatigue':
      completionStatus = 'partial_fatigue'
      recoverySignal = 'high'
      intensityDirection = 'reduce_volume'
      break
    case 'pain':
      completionStatus = 'partial_pain'
      recoverySignal = 'critical'
      intensityDirection = 'protective_stop'
      break
    case 'time':
      completionStatus = 'partial_planned'
      recoverySignal = 'low'
      break
    case 'skipped':
      completionStatus = 'skipped'
      recoverySignal = 'low'
      break
  }
  
  return {
    exerciseIndex,
    setNumber: completedSets,
    inputMode: lastSetSummary?.inputMode || 'bodyweight_strength',
    timestamp: baseTimestamp,
    
    performanceOutcome: reason === 'pain' ? 'pain_flag' : 
                        reason === 'fatigue' ? 'high_fatigue' : 'on_target',
    intensityDirection,
    recoverySignal,
    technicalSignal: lastSetSummary?.technicalSignal || 'stable',
    supportSignal: lastSetSummary?.supportSignal || null,
    
    rpeDeviation: lastSetSummary?.rpeDeviation || 0,
    volumeDeviation: completedSets - totalSets,  // Negative (under-volume)
    loadDeviation: lastSetSummary?.loadDeviation || 0,
    assistanceDeviation: lastSetSummary?.assistanceDeviation || 0,
    
    confidenceScore: 0.7,
    sourceFactsUsed: [`partialCompletion:${completedSets}/${totalSets}`, `reason:${reason}`],
    
    completionStatus,
    
    trendDirection: lastSetSummary?.trendDirection || 'insufficient_data',
    consecutiveHighRPE: lastSetSummary?.consecutiveHighRPE || 0,
    
    coachingSignals: [],
    hasCriticalSignal: reason === 'pain',
    hasWarningSignal: reason === 'fatigue',
  }
}

// =============================================================================
// SESSION-LEVEL READINESS STATE
// =============================================================================

/**
 * Aggregated readiness state for the current session.
 * Updated after each set to inform later-exercise decisions.
 */
export interface SessionAdaptiveReadiness {
  // Overall session fatigue level
  sessionFatigueLevel: 'fresh' | 'warming' | 'working' | 'fatigued' | 'exhausted'
  
  // Direction readiness for different adaptations
  loadDirectionReady: boolean      // Safe to suggest load changes
  supportDirectionReady: boolean   // Safe to suggest band changes
  volumeCautionActive: boolean     // Should reduce volume
  technicalCautionActive: boolean  // Should prioritize form over intensity
  
  // Accumulated signals
  totalHighRPESets: number
  totalCriticalSignals: number
  totalWarningSignals: number
  painFlagActive: boolean
  
  // Per-exercise tracking
  exerciseSummaries: Map<number, AdaptiveExecutionSummary[]>
}

/**
 * Create initial session readiness state.
 */
export function createInitialSessionReadiness(): SessionAdaptiveReadiness {
  return {
    sessionFatigueLevel: 'fresh',
    loadDirectionReady: true,
    supportDirectionReady: true,
    volumeCautionActive: false,
    technicalCautionActive: false,
    totalHighRPESets: 0,
    totalCriticalSignals: 0,
    totalWarningSignals: 0,
    painFlagActive: false,
    exerciseSummaries: new Map(),
  }
}

/**
 * Update session readiness after a set is completed.
 */
export function updateSessionReadiness(
  current: SessionAdaptiveReadiness,
  summary: AdaptiveExecutionSummary
): SessionAdaptiveReadiness {
  const updated = { ...current }
  
  // Track in exercise summaries
  const exerciseSummaries = new Map(current.exerciseSummaries)
  const existing = exerciseSummaries.get(summary.exerciseIndex) || []
  exerciseSummaries.set(summary.exerciseIndex, [...existing, summary])
  updated.exerciseSummaries = exerciseSummaries
  
  // Update counters
  if (summary.recoverySignal === 'high' || summary.recoverySignal === 'critical') {
    updated.totalHighRPESets++
  }
  if (summary.hasCriticalSignal) {
    updated.totalCriticalSignals++
    updated.painFlagActive = true
  }
  if (summary.hasWarningSignal) {
    updated.totalWarningSignals++
  }
  
  // Update fatigue level
  const totalSets = Array.from(exerciseSummaries.values()).reduce((sum, arr) => sum + arr.length, 0)
  if (updated.painFlagActive || updated.totalCriticalSignals > 0) {
    updated.sessionFatigueLevel = 'exhausted'
  } else if (updated.totalHighRPESets >= 5 || updated.totalWarningSignals >= 3) {
    updated.sessionFatigueLevel = 'fatigued'
  } else if (totalSets >= 10 || updated.totalHighRPESets >= 2) {
    updated.sessionFatigueLevel = 'working'
  } else if (totalSets >= 3) {
    updated.sessionFatigueLevel = 'warming'
  }
  
  // Update caution flags
  updated.volumeCautionActive = 
    summary.intensityDirection === 'reduce_volume' ||
    summary.recoverySignal === 'critical' ||
    updated.totalHighRPESets >= 3
    
  updated.technicalCautionActive =
    summary.technicalSignal === 'degraded' ||
    summary.technicalSignal === 'failed' ||
    summary.coachingSignals.includes('form_issue')
  
  // Direction readiness
  updated.loadDirectionReady = !updated.painFlagActive && summary.confidenceScore >= 0.6
  updated.supportDirectionReady = !updated.painFlagActive && summary.confidenceScore >= 0.6
  
  return updated
}

// =============================================================================
// ADAPTIVE HINT GENERATION (SAFE, MINIMAL)
// =============================================================================

export interface AdaptiveHint {
  type: 'rest' | 'load' | 'support' | 'volume' | 'technique' | 'stop'
  message: string
  priority: 'low' | 'medium' | 'high'
  source: string
}

/**
 * Generate safe, minimal adaptive hints from summary.
 * Returns at most one high-priority hint.
 */
export function generateAdaptiveHint(
  summary: AdaptiveExecutionSummary,
  sessionReadiness: SessionAdaptiveReadiness
): AdaptiveHint | null {
  // Critical: pain flag
  if (summary.performanceOutcome === 'pain_flag' || summary.intensityDirection === 'protective_stop') {
    return {
      type: 'stop',
      message: 'Consider stopping this exercise for safety',
      priority: 'high',
      source: 'pain_signal',
    }
  }
  
  // High fatigue: suggest rest
  if (summary.recoverySignal === 'high' && summary.consecutiveHighRPE >= 2) {
    return {
      type: 'rest',
      message: 'Extended rest recommended',
      priority: 'high',
      source: 'consecutive_high_rpe',
    }
  }
  
  // Technique degradation
  if (summary.technicalSignal === 'degraded' || summary.technicalSignal === 'failed') {
    return {
      type: 'technique',
      message: 'Focus on form for remaining sets',
      priority: 'medium',
      source: 'technique_signal',
    }
  }
  
  // Support direction for band-assisted
  if (summary.supportSignal === 'under_supported' && summary.performanceOutcome === 'under_target') {
    return {
      type: 'support',
      message: 'Consider adding more band assistance',
      priority: 'medium',
      source: 'support_signal',
    }
  }
  
  // Load direction for weighted
  if (summary.inputMode === 'weighted_strength') {
    if (summary.intensityDirection === 'reduce_load' && summary.recoverySignal !== 'low') {
      return {
        type: 'load',
        message: 'Consider reducing load for next set',
        priority: 'medium',
        source: 'load_direction',
      }
    }
    if (summary.intensityDirection === 'increase_load' && summary.confidenceScore >= 0.8) {
      return {
        type: 'load',
        message: 'Ready for more weight next set',
        priority: 'low',
        source: 'load_direction',
      }
    }
  }
  
  // No hint needed
  return null
}
