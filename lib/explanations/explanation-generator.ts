/**
 * Explanation Generator
 * 
 * Instruments the live program generation to capture reason codes
 * at real decision points. This module is called by the adaptive
 * program builder to produce grounded explanations.
 * 
 * DESIGN:
 * - Called at each major decision point during generation
 * - Captures machine-readable reason codes
 * - Produces final ProgramExplanation after generation complete
 */

import {
  type ProgramExplanation,
  type ProgramReasonCode,
  type DayExplanation,
  type ExerciseExplanation,
  isValidReasonCode,
} from './types'
import {
  buildProgramExplanation,
  resolveDayExplanation,
  resolveExerciseExplanation,
  type ExplanationContext,
} from './explanation-resolver'
import type { ScheduleMode, DayStressLevel } from '../flexible-schedule-engine'
import type { PrimaryGoal, ExperienceLevel } from '../program-service'
import type { TrainingFeedbackSummary, AdjustmentReasonCode } from '../training-feedback-loop'
import type { MovementFamily } from '../movement-family-registry'

// =============================================================================
// EXPLANATION ACCUMULATOR
// =============================================================================

/**
 * Accumulator for building explanation during generation.
 * Created at start of generation, populated at decision points,
 * finalized into ProgramExplanation at end.
 */
export interface ExplanationAccumulator {
  // Context
  primaryGoal: PrimaryGoal
  scheduleMode: ScheduleMode
  currentWeekFrequency: number
  experienceLevel?: ExperienceLevel
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
  
  // Accumulated reason codes
  programReasonCodes: Set<ProgramReasonCode>
  dayReasonCodes: Map<number, Set<ProgramReasonCode>>
  exerciseReasonCodes: Map<string, Set<ProgramReasonCode>>
  
  // Day stress levels
  dayStressLevels: DayStressLevel[]
  
  // Exercise selection reasons
  exerciseSelectionReasons: Map<string, string>
  
  // Day metadata
  dayMetadata: Map<number, {
    label: string
    focus: string
    isPrimary: boolean
    limiters?: string[]
  }>
  
  // Change tracking
  priorProgramExists: boolean
  changed: boolean
  frequencyChanged: boolean
  progressionChanged: boolean
  exercisesSwapped: number
  limiterShifted: boolean
  
  // Current limiter
  currentLimiter?: string
}

/**
 * Create a new explanation accumulator
 */
export function createExplanationAccumulator(
  primaryGoal: PrimaryGoal,
  scheduleMode: ScheduleMode,
  currentWeekFrequency: number,
  experienceLevel?: ExperienceLevel
): ExplanationAccumulator {
  return {
    primaryGoal,
    scheduleMode,
    currentWeekFrequency,
    experienceLevel,
    dataConfidence: 'none',
    programReasonCodes: new Set(),
    dayReasonCodes: new Map(),
    exerciseReasonCodes: new Map(),
    dayStressLevels: [],
    exerciseSelectionReasons: new Map(),
    dayMetadata: new Map(),
    priorProgramExists: false,
    changed: false,
    frequencyChanged: false,
    progressionChanged: false,
    exercisesSwapped: 0,
    limiterShifted: false,
  }
}

// =============================================================================
// DECISION POINT CAPTURE FUNCTIONS
// =============================================================================

/**
 * Record reason code from a decision point
 */
export function recordReasonCode(
  accumulator: ExplanationAccumulator,
  code: ProgramReasonCode,
  context?: {
    dayNumber?: number
    exerciseId?: string
  }
): void {
  if (!isValidReasonCode(code)) {
    console.warn('[explanation] Invalid reason code:', code)
    return
  }
  
  // Always add to program-level
  accumulator.programReasonCodes.add(code)
  
  // Add to day if specified
  if (context?.dayNumber !== undefined) {
    if (!accumulator.dayReasonCodes.has(context.dayNumber)) {
      accumulator.dayReasonCodes.set(context.dayNumber, new Set())
    }
    accumulator.dayReasonCodes.get(context.dayNumber)!.add(code)
  }
  
  // Add to exercise if specified
  if (context?.exerciseId) {
    if (!accumulator.exerciseReasonCodes.has(context.exerciseId)) {
      accumulator.exerciseReasonCodes.set(context.exerciseId, new Set())
    }
    accumulator.exerciseReasonCodes.get(context.exerciseId)!.add(code)
  }
  
  console.log('[explanation] Recorded:', code, context || '')
}

/**
 * Record flexible schedule decision
 */
export function recordFlexibleScheduleDecision(
  accumulator: ExplanationAccumulator,
  adjustment: 'maintain' | 'increase' | 'decrease',
  reason?: string
): void {
  if (adjustment === 'maintain') {
    recordReasonCode(accumulator, 'flexible_frequency_maintain')
  } else if (adjustment === 'increase') {
    recordReasonCode(accumulator, 'flexible_frequency_expand')
    accumulator.frequencyChanged = true
    accumulator.changed = true
  } else if (adjustment === 'decrease') {
    recordReasonCode(accumulator, 'flexible_frequency_contract')
    accumulator.frequencyChanged = true
    accumulator.changed = true
  }
  
  console.log('[explanation] Flexible schedule:', adjustment, reason || '')
}

/**
 * Record progression decision
 */
export function recordProgressionDecision(
  accumulator: ExplanationAccumulator,
  decision: 'advance' | 'hold' | 'regress',
  exerciseId?: string
): void {
  const code = decision === 'advance' 
    ? 'progression_advance' 
    : decision === 'regress' 
      ? 'progression_regress' 
      : 'progression_hold'
  
  recordReasonCode(accumulator, code, { exerciseId })
  
  if (decision !== 'hold') {
    accumulator.progressionChanged = true
    accumulator.changed = true
  }
}

/**
 * Record fatigue-based adjustment
 */
export function recordFatigueDecision(
  accumulator: ExplanationAccumulator,
  fatigueLevel: 'high' | 'moderate' | 'low',
  dayNumber?: number
): void {
  if (fatigueLevel === 'high') {
    recordReasonCode(accumulator, 'fatigue_high_reduce_volume', { dayNumber })
    accumulator.changed = true
  } else {
    recordReasonCode(accumulator, 'fatigue_stable_maintain', { dayNumber })
  }
}

/**
 * Record day stress level
 */
export function recordDayStress(
  accumulator: ExplanationAccumulator,
  dayNumber: number,
  stressLevel: DayStressLevel,
  metadata: {
    label: string
    focus: string
    isPrimary: boolean
    limiters?: string[]
  }
): void {
  // Ensure array is long enough
  while (accumulator.dayStressLevels.length < dayNumber) {
    accumulator.dayStressLevels.push('moderate_strength')
  }
  accumulator.dayStressLevels[dayNumber - 1] = stressLevel
  
  accumulator.dayMetadata.set(dayNumber, metadata)
  
  // Record appropriate reason code
  if (stressLevel === 'high_neural_skill') {
    recordReasonCode(accumulator, 'high_neural_day', { dayNumber })
  } else if (stressLevel === 'lower_fatigue_density' || stressLevel === 'recovery_bias_technical') {
    recordReasonCode(accumulator, 'lower_fatigue_day', { dayNumber })
  } else if (stressLevel === 'recovery_bias_technical') {
    recordReasonCode(accumulator, 'recovery_bias_day', { dayNumber })
  }
}

/**
 * Record exercise selection with reason
 */
export function recordExerciseSelection(
  accumulator: ExplanationAccumulator,
  exerciseId: string,
  selectionReason: string,
  context?: {
    dayNumber?: number
    movementPattern?: MovementFamily
    isForWeakPoint?: boolean
    isForLimiter?: boolean
    isForSkillTransfer?: boolean
    jointStressDownranked?: boolean
  }
): void {
  accumulator.exerciseSelectionReasons.set(exerciseId, selectionReason)
  
  // Add reason codes based on context
  if (context?.isForWeakPoint) {
    recordReasonCode(accumulator, 'weak_point_support', { exerciseId, dayNumber: context.dayNumber })
  }
  if (context?.isForLimiter) {
    recordReasonCode(accumulator, 'limiter_addressed', { exerciseId, dayNumber: context.dayNumber })
  }
  if (context?.isForSkillTransfer) {
    recordReasonCode(accumulator, 'skill_transfer_reason', { exerciseId, dayNumber: context.dayNumber })
  }
  if (context?.jointStressDownranked) {
    recordReasonCode(accumulator, 'joint_stress_downrank', { exerciseId, dayNumber: context.dayNumber })
  }
  
  // Add movement-specific codes
  if (context?.movementPattern) {
    switch (context.movementPattern) {
      case 'straight_arm_pull':
        recordReasonCode(accumulator, 'straight_arm_pull_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'straight_arm_push':
        recordReasonCode(accumulator, 'straight_arm_push_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'compression_core':
        recordReasonCode(accumulator, 'compression_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'anti_extension_core':
        recordReasonCode(accumulator, 'anti_extension_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'vertical_push':
        recordReasonCode(accumulator, 'vertical_push_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'vertical_pull':
        recordReasonCode(accumulator, 'vertical_pull_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'horizontal_push':
        recordReasonCode(accumulator, 'horizontal_push_support', { exerciseId, dayNumber: context.dayNumber })
        break
      case 'horizontal_pull':
        recordReasonCode(accumulator, 'horizontal_pull_support', { exerciseId, dayNumber: context.dayNumber })
        break
    }
  }
}

/**
 * Record feedback summary context
 */
export function recordFeedbackContext(
  accumulator: ExplanationAccumulator,
  feedbackSummary: TrainingFeedbackSummary
): void {
  accumulator.dataConfidence = feedbackSummary.dataConfidence
  
  // Map adjustment reason codes
  for (const reason of feedbackSummary.adjustmentReasons) {
    switch (reason) {
      case 'fatigue_high':
        recordReasonCode(accumulator, 'fatigue_high_reduce_volume')
        break
      case 'progression_advance':
        recordReasonCode(accumulator, 'progression_advance')
        break
      case 'progression_hold':
        recordReasonCode(accumulator, 'progression_hold')
        break
      case 'progression_regress':
        recordReasonCode(accumulator, 'progression_regress')
        break
      case 'flexible_frequency_contract':
        recordReasonCode(accumulator, 'flexible_frequency_contract')
        break
      case 'flexible_frequency_expand':
        recordReasonCode(accumulator, 'flexible_frequency_expand')
        break
      case 'insufficient_data':
        recordReasonCode(accumulator, 'no_progress_due_to_incomplete_data')
        break
      case 'stable_performance':
        recordReasonCode(accumulator, 'no_change_due_to_stability')
        break
    }
  }
}

/**
 * Record comparison with prior program
 */
export function recordPriorProgramComparison(
  accumulator: ExplanationAccumulator,
  priorExists: boolean,
  exercisesSwapped?: number,
  limiterShifted?: boolean
): void {
  accumulator.priorProgramExists = priorExists
  if (exercisesSwapped !== undefined) {
    accumulator.exercisesSwapped = exercisesSwapped
    if (exercisesSwapped > 0) {
      accumulator.changed = true
    }
  }
  if (limiterShifted) {
    accumulator.limiterShifted = true
    accumulator.changed = true
  }
}

// =============================================================================
// FINALIZATION
// =============================================================================

/**
 * Finalize accumulator into ProgramExplanation
 */
export function finalizeExplanation(
  accumulator: ExplanationAccumulator,
  exercises: Array<{
    dayNumber: number
    id: string
    name: string
    movementPattern?: string
    skillTransfer?: string[]
    isSubstitutable?: boolean
  }>
): ProgramExplanation {
  console.log('[explanation] Finalizing with', accumulator.programReasonCodes.size, 'reason codes')
  
  // Build day explanations
  const dayExplanations: DayExplanation[] = []
  
  for (const [dayNumber, metadata] of accumulator.dayMetadata) {
    const dayReasons = accumulator.dayReasonCodes.get(dayNumber) || new Set()
    const stressLevel = accumulator.dayStressLevels[dayNumber - 1] || 'moderate_strength'
    
    const dayExplanation = resolveDayExplanation(
      dayNumber,
      metadata.label,
      stressLevel,
      metadata.isPrimary,
      metadata.focus,
      [...dayReasons] as ProgramReasonCode[],
      metadata.limiters,
      {
        primaryGoal: accumulator.primaryGoal,
        scheduleMode: accumulator.scheduleMode,
        currentWeekFrequency: accumulator.currentWeekFrequency,
        currentLimiter: accumulator.currentLimiter,
        dataConfidence: accumulator.dataConfidence,
      }
    )
    
    // Build exercise explanations for this day
    const dayExercises = exercises.filter(e => e.dayNumber === dayNumber)
    const exerciseExplanations: ExerciseExplanation[] = []
    
    for (const ex of dayExercises) {
      const exReasons = accumulator.exerciseReasonCodes.get(ex.id) || new Set()
      const selectionReason = accumulator.exerciseSelectionReasons.get(ex.id) || 'Selected for training goals'
      
      exerciseExplanations.push(
        resolveExerciseExplanation(
          ex.id,
          ex.name,
          selectionReason,
          [...exReasons] as ProgramReasonCode[],
          {
            movementPattern: ex.movementPattern,
            skillTransfer: ex.skillTransfer,
            isSubstitutable: ex.isSubstitutable,
          }
        )
      )
    }
    
    dayExplanations.push({
      ...dayExplanation,
      exerciseExplanations,
    })
  }
  
  // Sort by day number
  dayExplanations.sort((a, b) => a.dayNumber - b.dayNumber)
  
  // Build context
  const context: ExplanationContext = {
    primaryGoal: accumulator.primaryGoal,
    scheduleMode: accumulator.scheduleMode,
    currentWeekFrequency: accumulator.currentWeekFrequency,
    currentLimiter: accumulator.currentLimiter,
    dataConfidence: accumulator.dataConfidence,
  }
  
  // Build change context
  const changeContext = {
    priorProgramExists: accumulator.priorProgramExists,
    changed: accumulator.changed,
    frequencyChanged: accumulator.frequencyChanged,
    progressionChanged: accumulator.progressionChanged,
    exercisesSwapped: accumulator.exercisesSwapped,
    limiterShifted: accumulator.limiterShifted,
  }
  
  // Build final explanation
  return buildProgramExplanation(
    context,
    dayExplanations,
    accumulator.dayStressLevels,
    [...accumulator.programReasonCodes] as ProgramReasonCode[],
    changeContext
  )
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export {
  type ProgramExplanation,
  type ProgramReasonCode,
  type DayExplanation,
  type ExerciseExplanation,
}
