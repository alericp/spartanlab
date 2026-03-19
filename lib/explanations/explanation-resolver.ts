/**
 * Explanation Resolver
 * 
 * Converts reason codes and engine metadata into short, grounded,
 * user-facing explanation text. This is the single place where
 * machine-readable decisions become human-readable explanations.
 * 
 * PRINCIPLES:
 * - Never invent information not present in metadata
 * - Keep explanations concise (1-3 sentences max)
 * - Use non-hype, factual language
 * - Degrade gracefully when data is missing
 */

import {
  type ProgramExplanation,
  type ProgramReasonCode,
  type DayExplanation,
  type ExerciseExplanation,
  type WeekStructureExplanation,
  type ChangeExplanation,
  type SummaryExplanation,
  REASON_CODE_LABELS,
  isValidReasonCode,
} from './types'
import type { ScheduleMode, DayStressLevel } from '../flexible-schedule-engine'
import type { PrimaryGoal } from '../program-service'
import { GOAL_LABELS } from '../program-service'

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface ExplanationContext {
  primaryGoal: PrimaryGoal
  scheduleMode: ScheduleMode
  currentWeekFrequency: number
  experienceLevel?: string
  currentLimiter?: string
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
}

// =============================================================================
// SUMMARY EXPLANATION GENERATION
// =============================================================================

/**
 * Generate the primary summary explanation for the program
 */
export function resolveSummaryExplanation(
  context: ExplanationContext,
  reasonCodes: ProgramReasonCode[]
): SummaryExplanation {
  const goalLabel = GOAL_LABELS[context.primaryGoal] || context.primaryGoal
  
  // Primary goal reason
  let primaryGoalReason = `This program focuses on ${goalLabel} as your primary goal.`
  
  // Schedule reason - handle flexible vs static correctly
  let scheduleReason: string
  if (context.scheduleMode === 'flexible') {
    scheduleReason = `Your flexible schedule is currently set to ${context.currentWeekFrequency} sessions this week based on training load and recovery.`
  } else {
    scheduleReason = `Following your ${context.currentWeekFrequency}-day training schedule.`
  }
  
  // Progression reason based on data confidence
  let progressionReason: string | undefined
  if (context.dataConfidence === 'high') {
    if (reasonCodes.includes('progression_advance')) {
      progressionReason = 'Recent performance supports progression advancement.'
    } else if (reasonCodes.includes('progression_hold')) {
      progressionReason = 'Building consistency before next progression.'
    } else if (reasonCodes.includes('progression_regress')) {
      progressionReason = 'Adjusted progression for better recovery.'
    }
  } else if (context.dataConfidence === 'low' || context.dataConfidence === 'none') {
    progressionReason = 'More training data will enable smarter adaptations.'
  }
  
  // Recovery reason if relevant
  let recoveryReason: string | undefined
  if (reasonCodes.includes('fatigue_high_reduce_volume')) {
    recoveryReason = 'Volume adjusted based on recent fatigue signals.'
  } else if (reasonCodes.includes('recovery_bias_day')) {
    recoveryReason = 'Some sessions biased toward recovery this week.'
  }
  
  return {
    primaryGoalReason,
    scheduleReason,
    progressionReason,
    recoveryReason,
    reasonCodes: reasonCodes.filter(isValidReasonCode),
  }
}

// =============================================================================
// WEEK STRUCTURE EXPLANATION
// =============================================================================

/**
 * Generate explanation for why the week is structured this way
 */
export function resolveWeekStructureExplanation(
  context: ExplanationContext,
  dayStressLevels: DayStressLevel[],
  reasonCodes: ProgramReasonCode[]
): WeekStructureExplanation {
  let rationale: string
  let frequencyBasis: string | undefined
  
  if (context.scheduleMode === 'flexible') {
    // Flexible mode - emphasize it's current, not permanent
    if (reasonCodes.includes('flexible_frequency_contract')) {
      rationale = `Flexible mode is planning ${context.currentWeekFrequency} sessions this week to allow for recovery.`
      frequencyBasis = 'recovery-focused'
    } else if (reasonCodes.includes('flexible_frequency_expand')) {
      rationale = `Flexible mode is planning ${context.currentWeekFrequency} sessions this week as training load supports it.`
      frequencyBasis = 'load-supported'
    } else {
      rationale = `Flexible mode is currently planning ${context.currentWeekFrequency} sessions this week based on recovery and training load.`
      frequencyBasis = 'balanced'
    }
  } else {
    // Static mode
    rationale = `Training ${context.currentWeekFrequency} days per week as you selected.`
    frequencyBasis = 'user-selected'
  }
  
  // Describe stress distribution
  const highDays = dayStressLevels.filter(s => s === 'high_neural_skill').length
  const lowerDays = dayStressLevels.filter(s => s === 'lower_fatigue_density' || s === 'recovery_bias_technical').length
  
  let stressDistribution: string
  if (highDays > 0 && lowerDays > 0) {
    stressDistribution = `${highDays} higher-intensity skill day${highDays > 1 ? 's' : ''} balanced with ${lowerDays} lower-fatigue session${lowerDays > 1 ? 's' : ''}.`
  } else if (highDays > 0) {
    stressDistribution = `${highDays} skill-focused session${highDays > 1 ? 's' : ''} for consistent practice.`
  } else {
    stressDistribution = 'Sessions balanced for sustainable progress.'
  }
  
  return {
    currentWeekFrequency: context.currentWeekFrequency,
    scheduleMode: context.scheduleMode,
    reasonCodes: reasonCodes.filter(isValidReasonCode),
    rationale,
    stressDistribution,
    frequencyBasis,
  }
}

// =============================================================================
// DAY EXPLANATION
// =============================================================================

/**
 * Generate explanation for a specific training day
 */
export function resolveDayExplanation(
  dayNumber: number,
  dayLabel: string,
  stressLevel: DayStressLevel,
  isPrimary: boolean,
  focus: string,
  reasonCodes: ProgramReasonCode[],
  limiters?: string[],
  context?: ExplanationContext
): Omit<DayExplanation, 'exerciseExplanations'> {
  const dayKey = `day_${dayNumber}`
  
  // Generate primary intent description
  let primaryIntent = focus
  let title = dayLabel
  
  // Generate why this day explanation
  let whyThisDay: string
  
  if (stressLevel === 'high_neural_skill') {
    whyThisDay = isPrimary
      ? 'Primary skill day with focused practice on your main goal.'
      : 'Skill-focused session for consistent neural development.'
  } else if (stressLevel === 'lower_fatigue_density') {
    whyThisDay = 'Lower-intensity session to build volume without taxing recovery.'
  } else if (stressLevel === 'recovery_bias_technical') {
    whyThisDay = 'Light technical work to maintain patterns while recovering.'
  } else if (stressLevel === 'moderate_strength') {
    whyThisDay = 'Strength support work to build the base for skill development.'
  } else {
    whyThisDay = 'Balanced session supporting your training goals.'
  }
  
  // Add limiter support info
  const limiterSupport = limiters?.length 
    ? limiters.map(l => l.replace(/_/g, ' '))
    : undefined
  
  // Generate lighter/heavier explanation if relevant
  let whyLighterOrHeavier: string | undefined
  if (reasonCodes.includes('recovery_bias_day')) {
    whyLighterOrHeavier = 'Lighter load this day to preserve recovery capacity.'
  } else if (reasonCodes.includes('high_neural_day')) {
    whyLighterOrHeavier = 'Higher neural demand for skill acquisition.'
  } else if (reasonCodes.includes('fatigue_high_reduce_volume')) {
    whyLighterOrHeavier = 'Volume adjusted based on recent fatigue.'
  }
  
  return {
    dayKey,
    dayNumber,
    title,
    primaryIntent,
    stressLevel,
    reasonCodes: reasonCodes.filter(isValidReasonCode),
    whyThisDay,
    whyLighterOrHeavier,
    limiterSupport,
  }
}

// =============================================================================
// EXERCISE EXPLANATION
// =============================================================================

/**
 * Generate explanation for why a specific exercise was selected
 */
export function resolveExerciseExplanation(
  exerciseId: string,
  displayName: string,
  selectionReason: string,
  reasonCodes: ProgramReasonCode[],
  context?: {
    movementPattern?: string
    skillTransfer?: string[]
    isSubstitutable?: boolean
  }
): ExerciseExplanation {
  // Convert selection reason to short explanation if not already concise
  let shortReason = selectionReason
  if (shortReason.length > 100) {
    // Truncate and make it a proper sentence
    shortReason = shortReason.substring(0, 97) + '...'
  }
  
  // Add movement intelligence context if available
  if (reasonCodes.includes('straight_arm_pull_support') && !shortReason.includes('straight-arm')) {
    shortReason = 'Straight-arm pull work for lever development. ' + shortReason
  } else if (reasonCodes.includes('compression_support') && !shortReason.includes('compression')) {
    shortReason = 'Core compression for skill transfer. ' + shortReason
  } else if (reasonCodes.includes('anti_extension_support') && !shortReason.includes('anti-extension')) {
    shortReason = 'Anti-extension strength for body control. ' + shortReason
  }
  
  return {
    exerciseId,
    displayName,
    reasonCodes: reasonCodes.filter(isValidReasonCode),
    shortReason: shortReason.substring(0, 150), // Hard cap
    movementPattern: context?.movementPattern as any,
    skillTransfer: context?.skillTransfer as any,
    isSubstitutable: context?.isSubstitutable ?? true,
  }
}

// =============================================================================
// CHANGE EXPLANATION
// =============================================================================

/**
 * Generate explanation for what changed and why (or why it stayed the same)
 */
export function resolveChangeExplanation(
  changed: boolean,
  reasonCodes: ProgramReasonCode[],
  priorProgramExists: boolean,
  changeContext?: {
    frequencyChanged?: boolean
    progressionChanged?: boolean
    exercisesSwapped?: number
    limiterShifted?: boolean
  }
): ChangeExplanation {
  let summary: string
  const majorReasons: string[] = []
  const preservedReasons: string[] = []
  
  if (!priorProgramExists) {
    // First program
    summary = 'Your initial program was built based on your goals and current ability level.'
    majorReasons.push('Initial program generation')
    return {
      changed: false,
      comparedToPrior: false,
      reasonCodes: reasonCodes.filter(isValidReasonCode),
      majorReasons,
      summary,
    }
  }
  
  if (!changed) {
    // No changes
    summary = 'Program maintained for training consistency. No changes needed based on current data.'
    
    if (reasonCodes.includes('no_change_due_to_stability')) {
      preservedReasons.push('Training is progressing well')
    }
    if (reasonCodes.includes('no_progress_due_to_incomplete_data')) {
      preservedReasons.push('More workout data will enable smarter adaptations')
    }
    if (reasonCodes.includes('maintained_for_consistency')) {
      preservedReasons.push('Consistency supports skill development')
    }
    
    return {
      changed: false,
      comparedToPrior: true,
      reasonCodes: reasonCodes.filter(isValidReasonCode),
      majorReasons,
      preservedReasons,
      summary,
    }
  }
  
  // Changes occurred
  const changes: string[] = []
  
  if (changeContext?.frequencyChanged) {
    changes.push('training frequency adjusted')
    if (reasonCodes.includes('flexible_frequency_contract')) {
      majorReasons.push('Frequency reduced for recovery')
    } else if (reasonCodes.includes('flexible_frequency_expand')) {
      majorReasons.push('Frequency increased with stable recovery')
    }
  }
  
  if (changeContext?.progressionChanged) {
    changes.push('progression updated')
    if (reasonCodes.includes('progression_advance')) {
      majorReasons.push('Progression advanced based on performance')
    } else if (reasonCodes.includes('progression_regress')) {
      majorReasons.push('Progression adjusted for better recovery')
    }
  }
  
  if (changeContext?.limiterShifted) {
    changes.push('focus areas updated')
    majorReasons.push('Current limiter has shifted')
  }
  
  if (changeContext?.exercisesSwapped && changeContext.exercisesSwapped > 0) {
    changes.push(`${changeContext.exercisesSwapped} exercise${changeContext.exercisesSwapped > 1 ? 's' : ''} updated`)
  }
  
  if (reasonCodes.includes('fatigue_high_reduce_volume')) {
    majorReasons.push('Volume adjusted for recovery')
  }
  if (reasonCodes.includes('joint_stress_downrank')) {
    majorReasons.push('Exercises adjusted for joint health')
  }
  
  if (changes.length > 0) {
    summary = `Program updated: ${changes.join(', ')}.`
  } else {
    summary = 'Minor adjustments made based on recent training.'
  }
  
  return {
    changed: true,
    comparedToPrior: true,
    reasonCodes: reasonCodes.filter(isValidReasonCode),
    majorReasons,
    preservedReasons,
    summary,
  }
}

// =============================================================================
// FULL PROGRAM EXPLANATION
// =============================================================================

/**
 * Build complete program explanation from components
 */
export function buildProgramExplanation(
  context: ExplanationContext,
  dayExplanations: DayExplanation[],
  dayStressLevels: DayStressLevel[],
  allReasonCodes: ProgramReasonCode[],
  changeContext?: {
    priorProgramExists: boolean
    changed: boolean
    frequencyChanged?: boolean
    progressionChanged?: boolean
    exercisesSwapped?: number
    limiterShifted?: boolean
  }
): ProgramExplanation {
  // Resolve summary
  const summary = resolveSummaryExplanation(context, allReasonCodes)
  
  // Resolve week structure
  const weekStructure = resolveWeekStructureExplanation(
    context,
    dayStressLevels,
    allReasonCodes
  )
  
  // Resolve change explanation if we have prior context
  let changeExplanation: ChangeExplanation | undefined
  if (changeContext) {
    changeExplanation = resolveChangeExplanation(
      changeContext.changed,
      allReasonCodes,
      changeContext.priorProgramExists,
      changeContext
    )
  }
  
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    summary,
    weekStructure,
    dayExplanations,
    changeExplanation,
    activeReasonCodes: [...new Set(allReasonCodes.filter(isValidReasonCode))],
    dataConfidence: context.dataConfidence,
  }
}

// =============================================================================
// COMPACT UI HELPERS
// =============================================================================

/**
 * Get a compact 2-4 line summary suitable for UI display
 */
export function getCompactSummary(explanation: ProgramExplanation): string[] {
  const lines: string[] = []
  
  // Line 1: Goal focus
  lines.push(explanation.summary.primaryGoalReason)
  
  // Line 2: Schedule (especially important for flexible mode)
  lines.push(explanation.summary.scheduleReason)
  
  // Line 3: Progression or recovery if relevant
  if (explanation.summary.progressionReason) {
    lines.push(explanation.summary.progressionReason)
  } else if (explanation.summary.recoveryReason) {
    lines.push(explanation.summary.recoveryReason)
  }
  
  // Line 4: Change summary if relevant
  if (explanation.changeExplanation?.changed) {
    lines.push(explanation.changeExplanation.summary)
  }
  
  return lines.slice(0, 4) // Max 4 lines
}

/**
 * Get compact day summary suitable for session card
 */
export function getCompactDaySummary(dayExplanation: DayExplanation): string {
  let summary = dayExplanation.whyThisDay
  
  if (dayExplanation.whyLighterOrHeavier) {
    summary += ' ' + dayExplanation.whyLighterOrHeavier
  }
  
  return summary.substring(0, 150) // Hard cap for UI
}

/**
 * Check if explanation has meaningful content worth showing
 */
export function hasSubstantiveExplanation(explanation: ProgramExplanation | null): boolean {
  if (!explanation) return false
  
  // Must have at least summary
  if (!explanation.summary.primaryGoalReason) return false
  
  // Must have some reason codes
  if (explanation.activeReasonCodes.length === 0) return false
  
  return true
}
