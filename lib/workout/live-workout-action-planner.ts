/**
 * [LIVE-WORKOUT-ACTION-PLANNER] Canonical Live Adaptive Action Planner
 * 
 * This module is the SINGLE authoritative decision owner for:
 * - What to do next set
 * - Whether to adjust load/support
 * - Whether to reduce remaining sets
 * - Whether to add recovery protection
 * - Whether to recommend ending an exercise early
 * 
 * ALL same-session action decisions MUST flow through this planner.
 * No parallel decision paths allowed.
 */

import type { ExerciseInputMode } from './live-workout-authority-contract'
import type { 
  AdaptiveExecutionSummary, 
  SessionAdaptiveReadiness,
  RecoverySignal,
  TechnicalSignal,
  IntensityDirection,
} from './live-workout-adaptive-signals'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'

// =============================================================================
// ACTION TYPE DEFINITIONS
// =============================================================================

/**
 * Canonical action type that the planner can recommend.
 */
export type PlannerActionType =
  | 'continue_as_prescribed'           // No changes needed
  | 'keep_load_add_rest'               // Maintain intensity, extend rest
  | 'reduce_load'                      // Lower weight
  | 'increase_load'                    // Raise weight
  | 'raise_assistance'                 // Add more band support (easier)
  | 'lower_assistance'                 // Remove band support (harder)
  | 'cap_remaining_sets'               // Limit further sets to protect recovery
  | 'reduce_target_range'              // Lower target reps/hold
  | 'preserve_load_reduce_volume'      // Keep weight but fewer reps
  | 'end_exercise_early_recovery'      // Stop exercise for recovery protection
  | 'end_exercise_early_pain'          // Stop exercise due to pain signal
  | 'hold_current_no_change'           // Active decision to maintain (not default)
  | 'technique_priority_mode'          // Focus on form over intensity

/**
 * Scope of the action recommendation.
 */
export type ActionScope =
  | 'next_set'                         // Applies to immediate next set only
  | 'remaining_sets_current_exercise'  // Applies to all remaining sets
  | 'later_exercises_same_session'     // Affects exercises later in session
  | 'session_wide'                     // Affects entire remaining session

/**
 * Reason codes explaining why the planner chose this action.
 */
export type PlannerReasonCode =
  // Performance-based
  | 'target_exceeded_consistently'
  | 'target_missed_single'
  | 'target_missed_repeatedly'
  | 'rpe_overshoot_single'
  | 'rpe_overshoot_trend'
  | 'rpe_undershoot_consistent'
  // Load/support specific
  | 'load_too_heavy'
  | 'load_too_light'
  | 'assistance_insufficient'
  | 'assistance_excessive'
  // Recovery/safety
  | 'pain_signal_detected'
  | 'fatigue_accumulating'
  | 'technique_degradation'
  | 'straight_arm_exposure_high'
  | 'recovery_protection_needed'
  | 'grip_limited_warning'
  // Positive signals
  | 'performance_stable'
  | 'technique_solid'
  | 'ready_for_progression'
  // Hold/skill specific
  | 'hold_quality_degraded'
  | 'balance_unstable'

/**
 * Recovery protection level.
 */
export type RecoveryProtectionLevel = 'none' | 'light' | 'moderate' | 'high' | 'critical'

/**
 * Technical protection level.
 */
export type TechnicalProtectionLevel = 'none' | 'form_focus' | 'reduced_load' | 'supervised_only'

/**
 * Optimization focus - what dimension the planner is currently optimizing.
 * This enables the UI to show clear intent to the user.
 */
export type OptimizationFocus =
  | 'strength_output'           // Maximizing load/reps for strength
  | 'skill_quality'             // Prioritizing technique/form
  | 'recovery_protection'       // Protecting joints/connective tissue
  | 'technical_control'         // Maintaining form under fatigue
  | 'assistance_calibration'    // Finding right support level
  | 'volume_control'            // Managing total work exposure
  | 'endurance_building'        // Building work capacity
  | 'none'                      // No specific focus (default behavior)

// =============================================================================
// CANONICAL PLANNER RESULT
// =============================================================================

/**
 * The canonical planner result.
 * ONE object that captures all action decisions for current exercise state.
 */
export interface ActionPlannerResult {
  // Primary recommendation
  actionType: PlannerActionType
  reasonCodes: PlannerReasonCode[]
  confidence: number                    // 0-1, based on data quality and clarity
  
  // Scope
  appliesTo: ActionScope
  
  // Protection levels
  recoveryProtectionLevel: RecoveryProtectionLevel
  technicalProtectionLevel: TechnicalProtectionLevel
  
  // [VISIBLE-EXPRESSION] Optimization focus for UI display
  optimizationFocus: OptimizationFocus
  
  // Specific suggestions (optional, filled when relevant)
  suggestedRestDeltaSec: number | null  // Positive = more rest, negative = less
  suggestedLoadDelta: number | null     // Positive = heavier, negative = lighter
  suggestedAssistanceDelta: number | null // Positive = more help, negative = less
  remainingSetCap: number | null        // Max remaining sets if capping
  
  // Trend context
  trendSummary: 'improving' | 'stable' | 'declining' | 'volatile' | 'insufficient_data'
  setsAnalyzed: number
  
  // Human-readable hint (calm, concise, optional)
  humanReadableHint: string | null
  
  // Traceability
  inputsConsumed: string[]
}

// =============================================================================
// EXERCISE CONTEXT FOR PLANNING
// =============================================================================

export interface ExercisePlanningContext {
  exerciseIndex: number
  exerciseName: string
  inputMode: ExerciseInputMode
  totalPrescribedSets: number
  currentSetNumber: number
  
  // Classification flags
  isStraightArm: boolean
  isRecoverySensitive: boolean
  isHoldBased: boolean
  isWeighted: boolean
  isBandAssisted: boolean
  isUnilateral: boolean
  
  // Prescription
  targetReps?: number
  targetHoldSeconds?: number
  targetRPE?: number
  prescribedLoad?: number
  recommendedBand?: ResistanceBandColor
  
  // Completed set summaries for this exercise
  completedSummaries: AdaptiveExecutionSummary[]
  
  // Session-level readiness
  sessionReadiness: SessionAdaptiveReadiness
}

// =============================================================================
// STRAIGHT-ARM / RECOVERY-SENSITIVE EXERCISE DETECTION
// =============================================================================

const STRAIGHT_ARM_PATTERNS = [
  'front lever',
  'back lever',
  'planche',
  'iron cross',
  'maltese',
  'german hang',
  'skin the cat',
  'straight arm',
  'rings support',
  'hollow back press',
  'victorian',
]

const RECOVERY_SENSITIVE_PATTERNS = [
  ...STRAIGHT_ARM_PATTERNS,
  'handstand',
  'manna',
  'v-sit',
  'l-sit press',
  'press to handstand',
  'wrist',
]

function isStraightArmExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return STRAIGHT_ARM_PATTERNS.some(p => lower.includes(p))
}

function isRecoverySensitiveExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return RECOVERY_SENSITIVE_PATTERNS.some(p => lower.includes(p))
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

function analyzeTrend(summaries: AdaptiveExecutionSummary[]): {
  direction: 'improving' | 'stable' | 'declining' | 'volatile' | 'insufficient_data'
  consecutiveHighRPE: number
  avgRPEDeviation: number
  avgVolumeDeviation: number
} {
  if (summaries.length < 2) {
    return {
      direction: 'insufficient_data',
      consecutiveHighRPE: summaries[0]?.consecutiveHighRPE || 0,
      avgRPEDeviation: summaries[0]?.rpeDeviation || 0,
      avgVolumeDeviation: summaries[0]?.volumeDeviation || 0,
    }
  }
  
  // Calculate trends
  const rpeDeviations = summaries.map(s => s.rpeDeviation)
  const volumeDeviations = summaries.map(s => s.volumeDeviation)
  
  const avgRPEDeviation = rpeDeviations.reduce((a, b) => a + b, 0) / rpeDeviations.length
  const avgVolumeDeviation = volumeDeviations.reduce((a, b) => a + b, 0) / volumeDeviations.length
  
  // Check for trend direction by comparing first half vs second half
  const midpoint = Math.floor(summaries.length / 2)
  const firstHalfRPE = rpeDeviations.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint
  const secondHalfRPE = rpeDeviations.slice(midpoint).reduce((a, b) => a + b, 0) / (summaries.length - midpoint)
  
  const rpeTrendDelta = secondHalfRPE - firstHalfRPE
  
  // Count consecutive high RPE from the end
  let consecutiveHighRPE = 0
  for (let i = summaries.length - 1; i >= 0; i--) {
    if (summaries[i].rpeDeviation >= 1) {  // RPE at least 1 above target
      consecutiveHighRPE++
    } else {
      break
    }
  }
  
  // Check for volatility (high variance)
  const rpeVariance = rpeDeviations.reduce((sum, d) => sum + Math.pow(d - avgRPEDeviation, 2), 0) / rpeDeviations.length
  const isVolatile = rpeVariance > 2  // Significant swing
  
  let direction: 'improving' | 'stable' | 'declining' | 'volatile' | 'insufficient_data'
  
  if (isVolatile) {
    direction = 'volatile'
  } else if (rpeTrendDelta > 0.5) {
    // RPE increasing (getting harder) = declining performance
    direction = 'declining'
  } else if (rpeTrendDelta < -0.5) {
    // RPE decreasing (getting easier) = improving
    direction = 'improving'
  } else {
    direction = 'stable'
  }
  
  return {
    direction,
    consecutiveHighRPE,
    avgRPEDeviation,
    avgVolumeDeviation,
  }
}

// =============================================================================
// WEIGHTED EXERCISE PLANNER
// =============================================================================

function planWeightedAction(
  context: ExercisePlanningContext,
  trend: ReturnType<typeof analyzeTrend>,
  lastSummary: AdaptiveExecutionSummary | null
): ActionPlannerResult {
  const inputsConsumed: string[] = ['inputMode:weighted']
  const reasonCodes: PlannerReasonCode[] = []
  
  let actionType: PlannerActionType = 'continue_as_prescribed'
  let recoveryProtectionLevel: RecoveryProtectionLevel = 'none'
  let technicalProtectionLevel: TechnicalProtectionLevel = 'none'
  let suggestedRestDeltaSec: number | null = null
  let suggestedLoadDelta: number | null = null
  let remainingSetCap: number | null = null
  let humanReadableHint: string | null = null
  let confidence = 0.8
  
  if (!lastSummary) {
    return buildDefaultResult(context, trend, inputsConsumed)
  }
  
  inputsConsumed.push(`lastRPE:${lastSummary.rpeDeviation}`)
  inputsConsumed.push(`lastVolume:${lastSummary.volumeDeviation}`)
  inputsConsumed.push(`trend:${trend.direction}`)
  
  // Check for pain - highest priority
  if (lastSummary.hasCriticalSignal || lastSummary.performanceOutcome === 'pain_flag') {
    actionType = 'end_exercise_early_pain'
    reasonCodes.push('pain_signal_detected')
    recoveryProtectionLevel = 'critical'
    humanReadableHint = 'Pain detected. Stopping exercise for safety.'
    confidence = 0.95
    return buildResult(actionType, reasonCodes, context, trend, {
      recoveryProtectionLevel,
      technicalProtectionLevel,
      suggestedRestDeltaSec,
      suggestedLoadDelta,
      remainingSetCap,
      humanReadableHint,
      confidence,
      inputsConsumed,
    })
  }
  
  // High RPE + under target = load too heavy
  if (lastSummary.rpeDeviation >= 1 && lastSummary.volumeDeviation < -1) {
    if (trend.consecutiveHighRPE >= 2) {
      // Repeated issue - reduce load
      actionType = 'reduce_load'
      reasonCodes.push('load_too_heavy', 'target_missed_repeatedly')
      suggestedLoadDelta = -5 // Suggest 5lb/kg reduction
      recoveryProtectionLevel = 'moderate'
      humanReadableHint = 'Load feels heavy. Consider reducing weight.'
      confidence = 0.85
    } else {
      // Single set - add rest first
      actionType = 'keep_load_add_rest'
      reasonCodes.push('rpe_overshoot_single')
      suggestedRestDeltaSec = 30
      recoveryProtectionLevel = 'light'
      humanReadableHint = 'Take extra rest before next set.'
    }
  }
  // High RPE but hitting target = working hard, protect volume
  else if (lastSummary.rpeDeviation >= 1 && lastSummary.volumeDeviation >= 0) {
    if (trend.consecutiveHighRPE >= 2) {
      actionType = 'preserve_load_reduce_volume'
      reasonCodes.push('fatigue_accumulating', 'rpe_overshoot_trend')
      recoveryProtectionLevel = 'moderate'
      humanReadableHint = 'Working hard. Protecting remaining volume.'
      
      // Cap at 1-2 more sets
      const remainingSets = context.totalPrescribedSets - context.currentSetNumber
      if (remainingSets > 2) {
        remainingSetCap = context.currentSetNumber + 2
      }
    } else {
      actionType = 'keep_load_add_rest'
      reasonCodes.push('rpe_overshoot_single')
      suggestedRestDeltaSec = 20
      recoveryProtectionLevel = 'light'
    }
  }
  // Low RPE + exceeding target = ready for progression
  else if (lastSummary.rpeDeviation <= -1 && lastSummary.volumeDeviation >= 1) {
    if (trend.direction === 'improving' || trend.direction === 'stable') {
      actionType = 'increase_load'
      reasonCodes.push('load_too_light', 'ready_for_progression')
      suggestedLoadDelta = 5
      humanReadableHint = 'Strong performance. Consider adding weight.'
      confidence = 0.75  // Lower confidence for progression suggestions
    }
  }
  // Technique issues
  else if (lastSummary.technicalSignal === 'degraded' || lastSummary.technicalSignal === 'failed') {
    actionType = 'technique_priority_mode'
    reasonCodes.push('technique_degradation')
    technicalProtectionLevel = 'form_focus'
    suggestedLoadDelta = -5
    humanReadableHint = 'Focus on form. Reduce load if needed.'
    confidence = 0.8
  }
  // Performance stable
  else {
    actionType = 'continue_as_prescribed'
    reasonCodes.push('performance_stable')
  }
  
  return buildResult(actionType, reasonCodes, context, trend, {
    recoveryProtectionLevel,
    technicalProtectionLevel,
    suggestedRestDeltaSec,
    suggestedLoadDelta,
    remainingSetCap,
    humanReadableHint,
    confidence,
    inputsConsumed,
  })
}

// =============================================================================
// BAND-ASSISTED EXERCISE PLANNER
// =============================================================================

function planBandAssistedAction(
  context: ExercisePlanningContext,
  trend: ReturnType<typeof analyzeTrend>,
  lastSummary: AdaptiveExecutionSummary | null
): ActionPlannerResult {
  const inputsConsumed: string[] = ['inputMode:band_assisted']
  const reasonCodes: PlannerReasonCode[] = []
  
  let actionType: PlannerActionType = 'continue_as_prescribed'
  let recoveryProtectionLevel: RecoveryProtectionLevel = 'none'
  let technicalProtectionLevel: TechnicalProtectionLevel = 'none'
  let suggestedRestDeltaSec: number | null = null
  let suggestedAssistanceDelta: number | null = null
  let remainingSetCap: number | null = null
  let humanReadableHint: string | null = null
  let confidence = 0.8
  
  if (!lastSummary) {
    return buildDefaultResult(context, trend, inputsConsumed)
  }
  
  inputsConsumed.push(`supportSignal:${lastSummary.supportSignal}`)
  inputsConsumed.push(`assistanceDeviation:${lastSummary.assistanceDeviation}`)
  inputsConsumed.push(`trend:${trend.direction}`)
  
  // Check for pain - highest priority
  if (lastSummary.hasCriticalSignal || lastSummary.performanceOutcome === 'pain_flag') {
    actionType = 'end_exercise_early_pain'
    reasonCodes.push('pain_signal_detected')
    recoveryProtectionLevel = 'critical'
    humanReadableHint = 'Pain detected. Stopping exercise for safety.'
    confidence = 0.95
    return buildResult(actionType, reasonCodes, context, trend, {
      recoveryProtectionLevel,
      technicalProtectionLevel,
      suggestedRestDeltaSec,
      suggestedAssistanceDelta,
      suggestedLoadDelta: null,
      remainingSetCap,
      humanReadableHint,
      confidence,
      inputsConsumed,
    })
  }
  
  // Straight-arm protection
  if (context.isStraightArm) {
    inputsConsumed.push('straightArm:true')
    
    // Straight-arm with high fatigue = protect recovery
    if (trend.consecutiveHighRPE >= 2 || lastSummary.recoverySignal === 'high') {
      actionType = 'cap_remaining_sets'
      reasonCodes.push('straight_arm_exposure_high', 'recovery_protection_needed')
      recoveryProtectionLevel = 'high'
      
      const remainingSets = context.totalPrescribedSets - context.currentSetNumber
      if (remainingSets > 1) {
        remainingSetCap = context.currentSetNumber + 1
        humanReadableHint = 'Protecting straight-arm recovery. One more set max.'
      }
      confidence = 0.9
      
      return buildResult(actionType, reasonCodes, context, trend, {
        recoveryProtectionLevel,
        technicalProtectionLevel,
        suggestedRestDeltaSec,
        suggestedAssistanceDelta,
        suggestedLoadDelta: null,
        remainingSetCap,
        humanReadableHint,
        confidence,
        inputsConsumed,
      })
    }
  }
  
  // Support signal analysis
  if (lastSummary.supportSignal === 'under_supported') {
    // Too hard - needs more assistance
    if (trend.consecutiveHighRPE >= 1 && lastSummary.volumeDeviation < 0) {
      actionType = 'raise_assistance'
      reasonCodes.push('assistance_insufficient')
      suggestedAssistanceDelta = 1  // One band level up
      recoveryProtectionLevel = 'light'
      humanReadableHint = 'Consider adding more band support.'
    }
  } else if (lastSummary.supportSignal === 'over_supported') {
    // Too easy - can reduce assistance
    if (lastSummary.rpeDeviation <= -1 && lastSummary.volumeDeviation >= 1) {
      actionType = 'lower_assistance'
      reasonCodes.push('assistance_excessive', 'ready_for_progression')
      suggestedAssistanceDelta = -1  // One band level down
      humanReadableHint = 'Strong! Consider lighter band next time.'
      confidence = 0.75
    }
  }
  
  // High RPE with declining trend
  if (trend.direction === 'declining' && trend.consecutiveHighRPE >= 2) {
    if (actionType === 'continue_as_prescribed') {
      actionType = 'keep_load_add_rest'
      reasonCodes.push('fatigue_accumulating')
      suggestedRestDeltaSec = 30
      recoveryProtectionLevel = 'moderate'
      humanReadableHint = 'Fatigue building. Extra rest recommended.'
    }
  }
  
  // Technique degradation
  if (lastSummary.technicalSignal === 'degraded' || lastSummary.technicalSignal === 'failed') {
    actionType = 'technique_priority_mode'
    reasonCodes.push('technique_degradation')
    technicalProtectionLevel = 'form_focus'
    humanReadableHint = 'Technique wavering. Prioritize form.'
  }
  
  // Default stable
  if (reasonCodes.length === 0) {
    reasonCodes.push('performance_stable')
  }
  
  return buildResult(actionType, reasonCodes, context, trend, {
    recoveryProtectionLevel,
    technicalProtectionLevel,
    suggestedRestDeltaSec,
    suggestedAssistanceDelta,
    suggestedLoadDelta: null,
    remainingSetCap,
    humanReadableHint,
    confidence,
    inputsConsumed,
  })
}

// =============================================================================
// HOLD-BASED / SKILL PLANNER
// =============================================================================

function planHoldBasedAction(
  context: ExercisePlanningContext,
  trend: ReturnType<typeof analyzeTrend>,
  lastSummary: AdaptiveExecutionSummary | null
): ActionPlannerResult {
  const inputsConsumed: string[] = ['inputMode:hold_based']
  const reasonCodes: PlannerReasonCode[] = []
  
  let actionType: PlannerActionType = 'continue_as_prescribed'
  let recoveryProtectionLevel: RecoveryProtectionLevel = 'none'
  let technicalProtectionLevel: TechnicalProtectionLevel = 'none'
  let suggestedRestDeltaSec: number | null = null
  let remainingSetCap: number | null = null
  let humanReadableHint: string | null = null
  let confidence = 0.8
  
  if (!lastSummary) {
    return buildDefaultResult(context, trend, inputsConsumed)
  }
  
  inputsConsumed.push(`technicalSignal:${lastSummary.technicalSignal}`)
  inputsConsumed.push(`volumeDeviation:${lastSummary.volumeDeviation}`)
  inputsConsumed.push(`trend:${trend.direction}`)
  
  // Pain check
  if (lastSummary.hasCriticalSignal || lastSummary.performanceOutcome === 'pain_flag') {
    actionType = 'end_exercise_early_pain'
    reasonCodes.push('pain_signal_detected')
    recoveryProtectionLevel = 'critical'
    humanReadableHint = 'Pain detected. Stopping for safety.'
    confidence = 0.95
    return buildResult(actionType, reasonCodes, context, trend, {
      recoveryProtectionLevel,
      technicalProtectionLevel,
      suggestedRestDeltaSec,
      suggestedAssistanceDelta: null,
      suggestedLoadDelta: null,
      remainingSetCap,
      humanReadableHint,
      confidence,
      inputsConsumed,
    })
  }
  
  // Hold quality is primary concern for skill work
  if (lastSummary.technicalSignal === 'failed') {
    actionType = 'end_exercise_early_recovery'
    reasonCodes.push('hold_quality_degraded', 'technique_degradation')
    recoveryProtectionLevel = 'high'
    technicalProtectionLevel = 'form_focus'
    humanReadableHint = 'Hold quality lost. End exercise to protect technique.'
    confidence = 0.9
  } else if (lastSummary.technicalSignal === 'degraded') {
    actionType = 'technique_priority_mode'
    reasonCodes.push('hold_quality_degraded')
    technicalProtectionLevel = 'form_focus'
    suggestedRestDeltaSec = 30
    humanReadableHint = 'Quality dropping. Focus on form, add rest.'
  } else if (lastSummary.technicalSignal === 'unstable') {
    // Balance/stability issues
    if (lastSummary.coachingSignals.includes('balance_issue')) {
      reasonCodes.push('balance_unstable')
      technicalProtectionLevel = 'form_focus'
      humanReadableHint = 'Balance wavering. Focus on stability.'
    }
  }
  
  // Hold duration falling short
  if (lastSummary.volumeDeviation < -3) {  // More than 3 seconds short
    if (trend.direction === 'declining') {
      actionType = 'cap_remaining_sets'
      reasonCodes.push('target_missed_repeatedly', 'recovery_protection_needed')
      recoveryProtectionLevel = 'moderate'
      
      const remainingSets = context.totalPrescribedSets - context.currentSetNumber
      if (remainingSets > 1) {
        remainingSetCap = context.currentSetNumber + 1
      }
      humanReadableHint = 'Hold times declining. Capping sets for quality.'
    } else {
      actionType = 'keep_load_add_rest'
      reasonCodes.push('target_missed_single')
      suggestedRestDeltaSec = 30
      humanReadableHint = 'Take more rest to hit hold target.'
    }
  }
  
  // Straight-arm hold protection
  if (context.isStraightArm && trend.consecutiveHighRPE >= 2) {
    actionType = 'cap_remaining_sets'
    reasonCodes.push('straight_arm_exposure_high')
    recoveryProtectionLevel = 'high'
    
    const remainingSets = context.totalPrescribedSets - context.currentSetNumber
    if (remainingSets > 1) {
      remainingSetCap = context.currentSetNumber + 1
      humanReadableHint = 'Protecting straight-arm recovery.'
    }
  }
  
  // Default stable
  if (reasonCodes.length === 0) {
    reasonCodes.push('performance_stable', 'technique_solid')
  }
  
  return buildResult(actionType, reasonCodes, context, trend, {
    recoveryProtectionLevel,
    technicalProtectionLevel,
    suggestedRestDeltaSec,
    suggestedAssistanceDelta: null,
    suggestedLoadDelta: null,
    remainingSetCap,
    humanReadableHint,
    confidence,
    inputsConsumed,
  })
}

// =============================================================================
// BODYWEIGHT STRENGTH PLANNER
// =============================================================================

function planBodyweightAction(
  context: ExercisePlanningContext,
  trend: ReturnType<typeof analyzeTrend>,
  lastSummary: AdaptiveExecutionSummary | null
): ActionPlannerResult {
  const inputsConsumed: string[] = ['inputMode:bodyweight']
  const reasonCodes: PlannerReasonCode[] = []
  
  let actionType: PlannerActionType = 'continue_as_prescribed'
  let recoveryProtectionLevel: RecoveryProtectionLevel = 'none'
  let technicalProtectionLevel: TechnicalProtectionLevel = 'none'
  let suggestedRestDeltaSec: number | null = null
  let remainingSetCap: number | null = null
  let humanReadableHint: string | null = null
  let confidence = 0.8
  
  if (!lastSummary) {
    return buildDefaultResult(context, trend, inputsConsumed)
  }
  
  inputsConsumed.push(`trend:${trend.direction}`)
  inputsConsumed.push(`rpeDeviation:${lastSummary.rpeDeviation}`)
  
  // Pain check
  if (lastSummary.hasCriticalSignal || lastSummary.performanceOutcome === 'pain_flag') {
    actionType = 'end_exercise_early_pain'
    reasonCodes.push('pain_signal_detected')
    recoveryProtectionLevel = 'critical'
    humanReadableHint = 'Pain detected. Stopping for safety.'
    confidence = 0.95
    return buildResult(actionType, reasonCodes, context, trend, {
      recoveryProtectionLevel,
      technicalProtectionLevel,
      suggestedRestDeltaSec,
      suggestedAssistanceDelta: null,
      suggestedLoadDelta: null,
      remainingSetCap,
      humanReadableHint,
      confidence,
      inputsConsumed,
    })
  }
  
  // Grip limited is important for bodyweight (pullups, etc.)
  if (lastSummary.coachingSignals.includes('grip_limited')) {
    reasonCodes.push('grip_limited_warning')
    suggestedRestDeltaSec = 30
    recoveryProtectionLevel = 'light'
    humanReadableHint = 'Grip limiting. Rest forearms.'
  }
  
  // High RPE + under target = need more rest or reduce target
  if (lastSummary.rpeDeviation >= 1 && lastSummary.volumeDeviation < -2) {
    if (trend.consecutiveHighRPE >= 2) {
      actionType = 'reduce_target_range'
      reasonCodes.push('target_missed_repeatedly', 'fatigue_accumulating')
      recoveryProtectionLevel = 'moderate'
      humanReadableHint = 'Fatigue building. Reduce rep target.'
    } else {
      actionType = 'keep_load_add_rest'
      reasonCodes.push('rpe_overshoot_single')
      suggestedRestDeltaSec = 30
      humanReadableHint = 'Take more rest before next set.'
    }
  }
  
  // Declining trend
  if (trend.direction === 'declining' && context.completedSummaries.length >= 2) {
    if (actionType === 'continue_as_prescribed') {
      actionType = 'keep_load_add_rest'
      reasonCodes.push('fatigue_accumulating')
      suggestedRestDeltaSec = 20
    }
  }
  
  // Default
  if (reasonCodes.length === 0) {
    reasonCodes.push('performance_stable')
  }
  
  return buildResult(actionType, reasonCodes, context, trend, {
    recoveryProtectionLevel,
    technicalProtectionLevel,
    suggestedRestDeltaSec,
    suggestedAssistanceDelta: null,
    suggestedLoadDelta: null,
    remainingSetCap,
    humanReadableHint,
    confidence,
    inputsConsumed,
  })
}

// =============================================================================
// RESULT BUILDERS
// =============================================================================

/**
 * Derive optimization focus from action type, context, and protection levels.
 * This is the SINGLE source for UI focus expression.
 */
function deriveOptimizationFocus(
  actionType: PlannerActionType,
  context: ExercisePlanningContext,
  recoveryProtectionLevel: RecoveryProtectionLevel,
  technicalProtectionLevel: TechnicalProtectionLevel
): OptimizationFocus {
  // Critical/high recovery = always recovery protection focus
  if (recoveryProtectionLevel === 'critical' || recoveryProtectionLevel === 'high') {
    return 'recovery_protection'
  }
  
  // Technical protection active
  if (technicalProtectionLevel !== 'none') {
    return 'technical_control'
  }
  
  // Action-specific mapping
  switch (actionType) {
    case 'end_exercise_early_pain':
    case 'end_exercise_early_recovery':
    case 'cap_remaining_sets':
    case 'preserve_load_reduce_volume':
      return 'recovery_protection'
    
    case 'technique_priority_mode':
      return 'technical_control'
    
    case 'reduce_load':
    case 'increase_load':
      return 'strength_output'
    
    case 'raise_assistance':
    case 'lower_assistance':
      return 'assistance_calibration'
    
    case 'reduce_target_range':
      return 'volume_control'
    
    case 'keep_load_add_rest':
      // Context-dependent: is it for recovery or strength?
      if (recoveryProtectionLevel !== 'none') {
        return 'recovery_protection'
      }
      return 'strength_output'
    
    case 'hold_current_no_change':
    case 'continue_as_prescribed':
    default:
      // No specific focus for default/continue actions
      if (context.isHoldBased || context.isStraightArm) {
        return 'skill_quality'
      }
      if (context.isBandAssisted) {
        return 'assistance_calibration'
      }
      if (context.isWeighted) {
        return 'strength_output'
      }
      return 'none'
  }
}

function buildDefaultResult(
  context: ExercisePlanningContext,
  trend: ReturnType<typeof analyzeTrend>,
  inputsConsumed: string[]
): ActionPlannerResult {
  const optimizationFocus = deriveOptimizationFocus(
    'continue_as_prescribed',
    context,
    'none',
    'none'
  )
  
  return {
    actionType: 'continue_as_prescribed',
    reasonCodes: ['performance_stable'],
    confidence: 0.5,  // Lower confidence for no-data scenario
    appliesTo: 'next_set',
    recoveryProtectionLevel: 'none',
    technicalProtectionLevel: 'none',
    optimizationFocus,
    suggestedRestDeltaSec: null,
    suggestedLoadDelta: null,
    suggestedAssistanceDelta: null,
    remainingSetCap: null,
    trendSummary: trend.direction,
    setsAnalyzed: context.completedSummaries.length,
    humanReadableHint: null,
    inputsConsumed,
  }
}

function buildResult(
  actionType: PlannerActionType,
  reasonCodes: PlannerReasonCode[],
  context: ExercisePlanningContext,
  trend: ReturnType<typeof analyzeTrend>,
  extras: {
    recoveryProtectionLevel: RecoveryProtectionLevel
    technicalProtectionLevel: TechnicalProtectionLevel
    suggestedRestDeltaSec: number | null
    suggestedLoadDelta: number | null
    suggestedAssistanceDelta?: number | null
    remainingSetCap: number | null
    humanReadableHint: string | null
    confidence: number
    inputsConsumed: string[]
  }
): ActionPlannerResult {
  // Determine scope based on action type
  let appliesTo: ActionScope = 'next_set'
  
  if (actionType === 'end_exercise_early_pain' || actionType === 'end_exercise_early_recovery') {
    appliesTo = 'remaining_sets_current_exercise'
  } else if (actionType === 'cap_remaining_sets' || actionType === 'reduce_target_range') {
    appliesTo = 'remaining_sets_current_exercise'
  } else if (extras.recoveryProtectionLevel === 'high' || extras.recoveryProtectionLevel === 'critical') {
    appliesTo = 'later_exercises_same_session'
  }
  
  // Derive optimization focus from action and context
  const optimizationFocus = deriveOptimizationFocus(
    actionType,
    context,
    extras.recoveryProtectionLevel,
    extras.technicalProtectionLevel
  )
  
  return {
    actionType,
    reasonCodes,
    confidence: extras.confidence,
    appliesTo,
    recoveryProtectionLevel: extras.recoveryProtectionLevel,
    technicalProtectionLevel: extras.technicalProtectionLevel,
    optimizationFocus,
    suggestedRestDeltaSec: extras.suggestedRestDeltaSec,
    suggestedLoadDelta: extras.suggestedLoadDelta,
    suggestedAssistanceDelta: extras.suggestedAssistanceDelta ?? null,
    remainingSetCap: extras.remainingSetCap,
    trendSummary: trend.direction,
    setsAnalyzed: context.completedSummaries.length,
    humanReadableHint: extras.humanReadableHint,
    inputsConsumed: extras.inputsConsumed,
  }
}

// =============================================================================
// MAIN PLANNER FUNCTION
// =============================================================================

/**
 * Build the canonical action plan for the current exercise state.
 * This is the SINGLE authoritative decision owner.
 */
export function buildActionPlan(context: ExercisePlanningContext): ActionPlannerResult {
  // Analyze trend from completed summaries
  const trend = analyzeTrend(context.completedSummaries)
  
  // Get last summary if available
  const lastSummary = context.completedSummaries.length > 0
    ? context.completedSummaries[context.completedSummaries.length - 1]
    : null
  
  // Enrich context with exercise classification
  const enrichedContext: ExercisePlanningContext = {
    ...context,
    isStraightArm: context.isStraightArm || isStraightArmExercise(context.exerciseName),
    isRecoverySensitive: context.isRecoverySensitive || isRecoverySensitiveExercise(context.exerciseName),
  }
  
  // Route to appropriate planner based on input mode
  switch (context.inputMode) {
    case 'weighted_strength':
      return planWeightedAction(enrichedContext, trend, lastSummary)
    
    case 'band_assisted_skill':
      return planBandAssistedAction(enrichedContext, trend, lastSummary)
    
    case 'timed_hold':
      return planHoldBasedAction(enrichedContext, trend, lastSummary)
    
    case 'reps_per_side':
      // Unilateral uses weighted planner logic with same basics
      return planWeightedAction(enrichedContext, trend, lastSummary)
    
    case 'bodyweight_strength':
    case 'density_block':
    default:
      return planBodyweightAction(enrichedContext, trend, lastSummary)
  }
}

// =============================================================================
// PARTIAL COMPLETION PLANNING
// =============================================================================

/**
 * Build action plan for partial completion / early stop scenarios.
 */
export function buildPartialCompletionPlan(
  context: ExercisePlanningContext,
  reason: 'fatigue' | 'pain' | 'time' | 'choice'
): ActionPlannerResult {
  const trend = analyzeTrend(context.completedSummaries)
  
  let actionType: PlannerActionType
  let reasonCodes: PlannerReasonCode[]
  let recoveryProtectionLevel: RecoveryProtectionLevel
  let humanReadableHint: string | null
  
  switch (reason) {
    case 'pain':
      actionType = 'end_exercise_early_pain'
      reasonCodes = ['pain_signal_detected']
      recoveryProtectionLevel = 'critical'
      humanReadableHint = 'Stopping due to pain. Recovery priority.'
      break
    case 'fatigue':
      actionType = 'end_exercise_early_recovery'
      reasonCodes = ['recovery_protection_needed', 'fatigue_accumulating']
      recoveryProtectionLevel = 'high'
      humanReadableHint = 'Stopping early to protect recovery.'
      break
    case 'time':
      actionType = 'cap_remaining_sets'
      reasonCodes = ['performance_stable']  // Time constraint, not performance issue
      recoveryProtectionLevel = 'none'
      humanReadableHint = null
      break
    case 'choice':
    default:
      actionType = 'end_exercise_early_recovery'
      reasonCodes = ['recovery_protection_needed']
      recoveryProtectionLevel = 'light'
      humanReadableHint = null
      break
  }
  
  // Derive optimization focus
  const optimizationFocus = deriveOptimizationFocus(
    actionType,
    context,
    recoveryProtectionLevel,
    'none'
  )
  
  return {
    actionType,
    reasonCodes,
    confidence: 0.9,
    appliesTo: 'remaining_sets_current_exercise',
    recoveryProtectionLevel,
    technicalProtectionLevel: 'none',
    optimizationFocus,
    suggestedRestDeltaSec: null,
    suggestedLoadDelta: null,
    suggestedAssistanceDelta: null,
    remainingSetCap: context.currentSetNumber,  // Cap at current
    trendSummary: trend.direction,
    setsAnalyzed: context.completedSummaries.length,
    humanReadableHint,
    inputsConsumed: [`partialCompletion:${reason}`],
  }
}

// =============================================================================
// UI EXPRESSION LAYER - Maps canonical planner output to visible coaching
// =============================================================================

/**
 * Get human-readable optimization focus label for UI display.
 */
export function getOptimizationFocusLabel(focus: OptimizationFocus): string {
  const labels: Record<OptimizationFocus, string> = {
    strength_output: 'Strength',
    skill_quality: 'Skill Quality',
    recovery_protection: 'Recovery Protection',
    technical_control: 'Technical Control',
    assistance_calibration: 'Assistance Calibration',
    volume_control: 'Volume Control',
    endurance_building: 'Endurance',
    none: '',
  }
  return labels[focus]
}

/**
 * Get scope label for UI display.
 */
export function getActionScopeLabel(scope: ActionScope): string {
  const labels: Record<ActionScope, string> = {
    next_set: 'Next Set',
    remaining_sets_current_exercise: 'Remaining Sets',
    later_exercises_same_session: 'Rest of Session',
    session_wide: 'Session',
  }
  return labels[scope]
}

/**
 * Structured coaching expression for UI rendering.
 * This is the SINGLE canonical source for visible coaching text.
 */
export interface CoachingExpression {
  // Whether to show coaching (false = no coaching visible)
  shouldShow: boolean
  // Primary recommendation (short, clear)
  primaryText: string | null
  // Secondary rationale (explains why)
  rationaleText: string | null
  // Focus badge label
  focusLabel: string | null
  // Scope badge label
  scopeLabel: string | null
  // Visual severity for styling
  severity: 'info' | 'warning' | 'caution' | 'critical'
  // Whether this is a protective/defensive recommendation
  isProtective: boolean
}

/**
 * Build coaching expression from planner result.
 * This is the SINGLE UI expression mapper - no other component should
 * invent coaching text outside of this function.
 */
export function buildCoachingExpression(
  plan: ActionPlannerResult | null
): CoachingExpression {
  // No plan or continue_as_prescribed with high confidence = no coaching
  if (!plan) {
    return {
      shouldShow: false,
      primaryText: null,
      rationaleText: null,
      focusLabel: null,
      scopeLabel: null,
      severity: 'info',
      isProtective: false,
    }
  }
  
  // Low confidence or default action = minimal or no coaching
  if (plan.actionType === 'continue_as_prescribed' && plan.confidence < 0.7) {
    return {
      shouldShow: false,
      primaryText: null,
      rationaleText: null,
      focusLabel: null,
      scopeLabel: null,
      severity: 'info',
      isProtective: false,
    }
  }
  
  // Determine severity from protection levels
  let severity: CoachingExpression['severity'] = 'info'
  if (plan.recoveryProtectionLevel === 'critical') {
    severity = 'critical'
  } else if (plan.recoveryProtectionLevel === 'high') {
    severity = 'warning'
  } else if (plan.recoveryProtectionLevel === 'moderate' || plan.technicalProtectionLevel !== 'none') {
    severity = 'caution'
  }
  
  // Determine if protective
  const isProtective = 
    plan.recoveryProtectionLevel !== 'none' ||
    plan.technicalProtectionLevel !== 'none' ||
    plan.actionType.includes('recovery') ||
    plan.actionType.includes('pain') ||
    plan.actionType === 'cap_remaining_sets' ||
    plan.actionType === 'preserve_load_reduce_volume'
  
  // Build rationale from reason codes
  const rationaleText = buildRationaleText(plan.reasonCodes, plan.trendSummary)
  
  // Use humanReadableHint if available, otherwise generate primary text
  const primaryText = plan.humanReadableHint || generatePrimaryText(plan)
  
  // Skip showing if primary text is empty/null and it's just continue_as_prescribed
  if (!primaryText && plan.actionType === 'continue_as_prescribed') {
    return {
      shouldShow: false,
      primaryText: null,
      rationaleText: null,
      focusLabel: null,
      scopeLabel: null,
      severity: 'info',
      isProtective: false,
    }
  }
  
  return {
    shouldShow: primaryText !== null && primaryText.length > 0,
    primaryText,
    rationaleText,
    focusLabel: plan.optimizationFocus !== 'none' ? getOptimizationFocusLabel(plan.optimizationFocus) : null,
    scopeLabel: getActionScopeLabel(plan.appliesTo),
    severity,
    isProtective,
  }
}

/**
 * Generate primary text from action type when humanReadableHint is not available.
 */
function generatePrimaryText(plan: ActionPlannerResult): string | null {
  switch (plan.actionType) {
    case 'continue_as_prescribed':
      return null  // No message needed for normal flow
    case 'keep_load_add_rest':
      return 'Take extra rest before next set'
    case 'reduce_load':
      return 'Consider reducing weight'
    case 'increase_load':
      return 'Ready for progression'
    case 'raise_assistance':
      return 'Add more support for quality'
    case 'lower_assistance':
      return 'Ready to reduce assistance'
    case 'cap_remaining_sets':
      return 'Capping remaining sets for recovery'
    case 'reduce_target_range':
      return 'Reducing target for this exercise'
    case 'preserve_load_reduce_volume':
      return 'Maintaining load, protecting volume'
    case 'end_exercise_early_recovery':
      return 'Recovery protection active'
    case 'end_exercise_early_pain':
      return 'Stop for safety'
    case 'hold_current_no_change':
      return null
    case 'technique_priority_mode':
      return 'Focus on form quality'
    default:
      return null
  }
}

/**
 * Build rationale text from reason codes and trend.
 */
function buildRationaleText(
  reasonCodes: PlannerReasonCode[],
  trend: ActionPlannerResult['trendSummary']
): string | null {
  // Build context-aware rationale
  const reasons: string[] = []
  
  if (reasonCodes.includes('pain_signal_detected')) {
    return 'Pain detected. Safety first.'
  }
  
  if (reasonCodes.includes('rpe_overshoot_trend')) {
    reasons.push('RPE rising across sets')
  } else if (reasonCodes.includes('rpe_overshoot_single')) {
    reasons.push('High effort on last set')
  }
  
  if (reasonCodes.includes('target_missed_repeatedly')) {
    reasons.push('Missing targets consistently')
  } else if (reasonCodes.includes('target_missed_single')) {
    reasons.push('Under target on last set')
  }
  
  if (reasonCodes.includes('technique_degradation')) {
    reasons.push('Form quality declining')
  }
  
  if (reasonCodes.includes('fatigue_accumulating')) {
    reasons.push('Fatigue building')
  }
  
  if (reasonCodes.includes('straight_arm_exposure_high')) {
    reasons.push('Protecting straight-arm work')
  }
  
  if (reasonCodes.includes('assistance_insufficient')) {
    reasons.push('Need more support')
  } else if (reasonCodes.includes('assistance_excessive')) {
    reasons.push('Strong with current support')
  }
  
  if (reasonCodes.includes('load_too_heavy')) {
    reasons.push('Load feels heavy')
  } else if (reasonCodes.includes('load_too_light')) {
    reasons.push('Ready for more weight')
  }
  
  if (reasonCodes.includes('ready_for_progression')) {
    reasons.push('Performing well')
  }
  
  // Add trend context if meaningful
  if (trend === 'declining' && reasons.length === 0) {
    reasons.push('Performance trending down')
  } else if (trend === 'improving' && reasons.length === 0) {
    reasons.push('Performance improving')
  }
  
  if (reasons.length === 0) {
    return null
  }
  
  return reasons.slice(0, 2).join('. ') + '.'
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export { isStraightArmExercise, isRecoverySensitiveExercise }
