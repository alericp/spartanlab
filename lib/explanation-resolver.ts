/**
 * Explanation Resolver
 * 
 * Converts reason codes and engine context into user-readable explanations.
 * This is the canonical module for generating truthful, grounded explanations.
 * 
 * CRITICAL: Never generate explanations that aren't backed by real data.
 */

import type {
  ProgramReasonCode,
  SessionReasonCode,
  ChangeReasonCode,
  ProgramExplanationMetadata,
  SessionExplanation,
  ExerciseExplanation,
  WeekStructureExplanation,
  ChangeExplanation,
} from './explanation-types'
import {
  PROGRAM_REASON_TEXT,
  SESSION_REASON_TEXT,
  CHANGE_REASON_TEXT,
  resolveReasonCodesToText,
  resolveSessionReasonCodesToText,
  resolveChangeReasonCodesToText,
} from './explanation-types'
import type { AdjustmentReasonCode, TrainingFeedbackSummary } from './training-feedback-loop'
import type { PrimaryGoal } from './program-service'

// =============================================================================
// TYPES
// =============================================================================

export interface ExplanationContext {
  primaryGoal: PrimaryGoal
  goalLabel: string
  scheduleMode: 'static' | 'flexible'
  currentWeekFrequency: number
  previousWeekFrequency?: number
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  fatigueState?: 'low' | 'moderate' | 'high'
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
  trustedWorkoutCount: number
  adjustmentReasons?: AdjustmentReasonCode[]
  isFirstProgram?: boolean
  limiters?: string[]
  weakPoints?: string[]
}

export interface SessionContext {
  dayNumber: number
  sessionTitle: string
  primaryIntent: string
  isLowerFatigue?: boolean
  isRecoveryBias?: boolean
  exercises: Array<{
    exerciseId: string
    displayName: string
    role: string
    coachingReason?: string
    movementPattern?: string
    skillTransfer?: string[]
  }>
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Build complete program explanation metadata from generation context.
 * This is the main entry point called during program generation.
 */
export function buildProgramExplanation(
  context: ExplanationContext,
  sessions: SessionContext[]
): ProgramExplanationMetadata {
  console.log('[explanation] Building program explanation:', {
    goal: context.primaryGoal,
    scheduleMode: context.scheduleMode,
    dataConfidence: context.dataConfidence,
    isFirstProgram: context.isFirstProgram,
    limiters: context.limiters?.length || 0,
  })
  
  // Build summary
  const summary = buildSummaryExplanation(context)
  
  // Build week structure explanation
  const weekStructure = buildWeekStructureExplanation(context)
  
  // Build session explanations
  const sessionExplanations = sessions.map(session => 
    buildSessionExplanation(session, context)
  )
  
  // Build change explanation if we have comparison data
  const changeExplanation = buildChangeExplanation(context)
  
  const metadata: ProgramExplanationMetadata = {
    summary,
    weekStructure,
    sessionExplanations,
    changeExplanation,
    generatedAt: new Date().toISOString(),
    dataConfidence: context.dataConfidence,
    trustedWorkoutCount: context.trustedWorkoutCount,
  }
  
  console.log('[explanation] Built explanation metadata:', {
    sessionCount: sessionExplanations.length,
    hasChangeExplanation: !!changeExplanation,
  })
  
  return metadata
}

// =============================================================================
// SUMMARY EXPLANATION
// =============================================================================

function buildSummaryExplanation(context: ExplanationContext): ProgramExplanationMetadata['summary'] {
  // Primary goal reason - always present
  const primaryGoalReason = getPrimaryGoalExplanation(context.primaryGoal, context.goalLabel)
  
  // Schedule reason - explain flexible vs static
  let scheduleReason: string | undefined
  if (context.scheduleMode === 'flexible') {
    scheduleReason = `Flexible mode: ${context.currentWeekFrequency} sessions planned based on your recovery state.`
  } else {
    scheduleReason = `${context.currentWeekFrequency} sessions per week as selected.`
  }
  
  // Progression reason based on data confidence
  let progressionReason: string | undefined
  if (context.dataConfidence === 'none' || context.dataConfidence === 'low') {
    progressionReason = 'Building training data for smarter progression decisions.'
  } else if (context.adjustmentReasons?.includes('progression_advance')) {
    progressionReason = 'Recent performance supports progression on key exercises.'
  } else if (context.adjustmentReasons?.includes('progression_hold')) {
    progressionReason = 'Maintaining current level while building consistency.'
  } else if (context.adjustmentReasons?.includes('progression_regress')) {
    progressionReason = 'Stepped back to reinforce technique and recovery.'
  }
  
  // Recovery reason
  let recoveryReason: string | undefined
  if (context.fatigueState === 'high') {
    recoveryReason = 'Higher fatigue detected. Volume adjusted for recovery.'
  } else if (context.adjustmentReasons?.includes('recovery_needed')) {
    recoveryReason = 'Recovery focus based on recent training load.'
  }
  
  return {
    primaryGoalReason,
    scheduleReason,
    progressionReason,
    recoveryReason,
  }
}

function getPrimaryGoalExplanation(goal: PrimaryGoal, label: string): string {
  const goalExplanations: Partial<Record<PrimaryGoal, string>> = {
    front_lever: 'Building toward front lever through straight-arm pulling and anti-extension strength.',
    planche: 'Developing planche through straight-arm pushing and protraction control.',
    muscle_up: 'Training muscle-up with transition work and pulling/pushing power.',
    l_sit: 'Developing L-sit through compression strength and hip flexor conditioning.',
    v_sit: 'Building V-sit through advanced compression and hamstring flexibility.',
    handstand_pushup: 'Training handstand push-up through vertical pressing and overhead stability.',
    handstand: 'Developing handstand balance and line through positioning practice.',
    iron_cross: 'Working toward iron cross through straight-arm strength and ring stability.',
    maltese: 'Building maltese prerequisites through advanced straight-arm work.',
    victorian: 'Developing victorian through straight-arm pulling and lever control.',
    back_lever: 'Training back lever through straight-arm pulling and shoulder extension.',
    straddle_planche: 'Building straddle planche through advanced protraction and lean.',
    full_planche: 'Working toward full planche with maximum straight-arm pushing development.',
    one_arm_chin: 'Developing one-arm chin through unilateral pulling strength.',
    ring_muscle_up: 'Training ring muscle-up through ring-specific transition work.',
    general_strength: 'Building overall calisthenics strength foundation.',
    skill_variety: 'Developing multiple skills through varied practice.',
    mobility_flexibility: 'Improving mobility and flexibility for skill prerequisites.',
    muscle_building: 'Focused hypertrophy work for muscle development.',
  }
  
  return goalExplanations[goal] || `Training ${label} with appropriate progression.`
}

// =============================================================================
// WEEK STRUCTURE EXPLANATION
// =============================================================================

function buildWeekStructureExplanation(context: ExplanationContext): WeekStructureExplanation {
  const reasonCodes: ProgramReasonCode[] = []
  
  // Add appropriate reason codes
  if (context.scheduleMode === 'flexible') {
    if (context.previousWeekFrequency) {
      if (context.currentWeekFrequency < context.previousWeekFrequency) {
        reasonCodes.push('flexible_frequency_contract')
      } else if (context.currentWeekFrequency > context.previousWeekFrequency) {
        reasonCodes.push('flexible_frequency_expand')
      } else {
        reasonCodes.push('flexible_frequency_maintain')
      }
    } else {
      reasonCodes.push('flexible_frequency_maintain')
    }
  } else {
    reasonCodes.push('static_schedule_locked')
  }
  
  // Add fatigue-related codes
  if (context.fatigueState === 'high') {
    reasonCodes.push('fatigue_high_reduce_volume')
  } else if (context.fatigueState === 'moderate') {
    reasonCodes.push('fatigue_moderate_maintain')
  }
  
  // Build rationale
  let rationale: string
  if (context.scheduleMode === 'flexible') {
    if (context.dataConfidence === 'none' || context.dataConfidence === 'low') {
      rationale = `Starting with ${context.currentWeekFrequency} sessions. Flexible mode will adjust as we learn your recovery patterns.`
    } else if (context.fatigueState === 'high') {
      rationale = `${context.currentWeekFrequency} sessions this week to support recovery while maintaining training stimulus.`
    } else {
      rationale = `${context.currentWeekFrequency} sessions based on your current recovery state and training consistency.`
    }
  } else {
    rationale = `${context.currentWeekFrequency} sessions per week as selected in your training preferences.`
  }
  
  const result: WeekStructureExplanation = {
    currentWeekFrequency: context.currentWeekFrequency,
    scheduleMode: context.scheduleMode,
    reasonCodes,
    rationale,
  }
  
  // Add comparison if we have previous data
  if (context.previousWeekFrequency !== undefined) {
    result.comparedToPrevious = {
      previousFrequency: context.previousWeekFrequency,
      frequencyChange: context.currentWeekFrequency === context.previousWeekFrequency 
        ? 'same' 
        : context.currentWeekFrequency > context.previousWeekFrequency 
          ? 'increased' 
          : 'decreased',
    }
    
    if (result.comparedToPrevious.frequencyChange !== 'same') {
      result.comparedToPrevious.changeReason = context.fatigueState === 'high'
        ? 'Recovery-based adjustment'
        : context.adjustmentReasons?.includes('high_compliance')
          ? 'Strong consistency supports more volume'
          : 'Adjusted based on recent training patterns'
    }
  }
  
  return result
}

// =============================================================================
// SESSION EXPLANATION
// =============================================================================

function buildSessionExplanation(
  session: SessionContext,
  context: ExplanationContext
): SessionExplanation {
  const reasonCodes: SessionReasonCode[] = []
  
  // Determine session type
  if (session.isRecoveryBias) {
    reasonCodes.push('recovery_active_day')
  } else if (session.isLowerFatigue) {
    reasonCodes.push('volume_reduced_fatigue')
  } else if (session.primaryIntent.toLowerCase().includes('skill')) {
    reasonCodes.push('skill_primary_day')
  } else if (session.primaryIntent.toLowerCase().includes('strength')) {
    reasonCodes.push('strength_primary_day')
  } else {
    reasonCodes.push('balanced_session')
  }
  
  // Check for limiter support
  if (context.limiters && context.limiters.length > 0) {
    reasonCodes.push('support_limiter_specific')
  }
  
  // Build exercise explanations
  const exerciseExplanations = session.exercises.map(ex => 
    buildExerciseExplanation(ex, context)
  )
  
  // Build whyThisDay
  const whyThisDay = buildWhyThisDay(session, context)
  
  // Build whyLighterOrHeavier if applicable
  let whyLighterOrHeavier: string | undefined
  if (session.isRecoveryBias) {
    whyLighterOrHeavier = 'Lighter load to support recovery while maintaining movement practice.'
  } else if (session.isLowerFatigue && context.fatigueState === 'high') {
    whyLighterOrHeavier = 'Reduced intensity due to elevated fatigue markers.'
  }
  
  // Limiter support list
  const limiterSupport = context.limiters?.filter(l => 
    session.exercises.some(ex => 
      ex.skillTransfer?.includes(l) || 
      ex.coachingReason?.toLowerCase().includes(l.replace('_', ' '))
    )
  )
  
  return {
    dayKey: `day_${session.dayNumber}`,
    dayNumber: session.dayNumber,
    title: session.sessionTitle,
    primaryIntent: session.primaryIntent,
    reasonCodes,
    whyThisDay,
    whyLighterOrHeavier,
    limiterSupport: limiterSupport?.length ? limiterSupport : undefined,
    exerciseExplanations,
  }
}

function buildWhyThisDay(session: SessionContext, context: ExplanationContext): string {
  if (session.isRecoveryBias) {
    return 'Active recovery session to maintain training frequency while supporting adaptation.'
  }
  
  if (session.isLowerFatigue) {
    return 'Lower-fatigue session to balance weekly training stress.'
  }
  
  if (session.primaryIntent.toLowerCase().includes('skill')) {
    return `Skill-focused session prioritizing ${context.goalLabel} development.`
  }
  
  if (session.primaryIntent.toLowerCase().includes('strength')) {
    return 'Strength-focused session building capacity for skill progression.'
  }
  
  return `Day ${session.dayNumber}: ${session.primaryIntent}.`
}

// =============================================================================
// EXERCISE EXPLANATION
// =============================================================================

function buildExerciseExplanation(
  exercise: SessionContext['exercises'][0],
  context: ExplanationContext
): ExerciseExplanation {
  const reasonCodes: ProgramReasonCode[] = []
  
  // Determine reason codes from exercise properties
  if (exercise.skillTransfer?.includes(context.primaryGoal)) {
    reasonCodes.push('primary_goal_direct')
  } else if (exercise.skillTransfer && exercise.skillTransfer.length > 0) {
    reasonCodes.push('skill_transfer_priority')
  }
  
  // Check role
  const roleLower = exercise.role?.toLowerCase() || ''
  if (roleLower.includes('weak') || roleLower.includes('limiter')) {
    reasonCodes.push('weak_point_support')
  }
  if (roleLower.includes('accessory')) {
    reasonCodes.push('secondary_goal_support')
  }
  
  // Check movement pattern for support type
  const pattern = exercise.movementPattern?.toLowerCase() || ''
  if (pattern.includes('compression')) {
    reasonCodes.push('compression_support')
  } else if (pattern.includes('anti_extension')) {
    reasonCodes.push('anti_extension_support')
  } else if (pattern.includes('straight_arm') && pattern.includes('pull')) {
    reasonCodes.push('straight_arm_pull_support')
  } else if (pattern.includes('straight_arm') && pattern.includes('push')) {
    reasonCodes.push('straight_arm_push_support')
  } else if (pattern.includes('vertical') && pattern.includes('push')) {
    reasonCodes.push('vertical_push_support')
  } else if (pattern.includes('vertical') && pattern.includes('pull')) {
    reasonCodes.push('vertical_pull_support')
  }
  
  // If no reason codes yet, add a generic one
  if (reasonCodes.length === 0) {
    reasonCodes.push('secondary_goal_support')
  }
  
  // Build short reason
  const shortReason = exercise.coachingReason || resolveReasonCodesToText(reasonCodes, 1)
  
  return {
    exerciseId: exercise.exerciseId,
    displayName: exercise.displayName,
    reasonCodes,
    shortReason,
  }
}

// =============================================================================
// CHANGE EXPLANATION
// =============================================================================

function buildChangeExplanation(context: ExplanationContext): ChangeExplanation | undefined {
  if (context.isFirstProgram) {
    return {
      changed: false,
      reasonCodes: ['first_generation'],
      majorReasons: ['Initial program generation based on your goals and preferences.'],
    }
  }
  
  const reasonCodes: ChangeReasonCode[] = []
  const majorReasons: string[] = []
  const preservedReasons: string[] = []
  
  // Map adjustment reason codes to change reason codes
  if (context.adjustmentReasons) {
    if (context.adjustmentReasons.includes('fatigue_high') || 
        context.adjustmentReasons.includes('fatigue_moderate')) {
      reasonCodes.push('fatigue_adjustment')
      majorReasons.push('Adjusted based on current fatigue state.')
    }
    
    if (context.adjustmentReasons.includes('limiter_shifted')) {
      reasonCodes.push('limiter_shifted')
      majorReasons.push('Primary limiter focus updated.')
    }
    
    if (context.adjustmentReasons.includes('flexible_frequency_contract')) {
      reasonCodes.push('schedule_contracted')
      majorReasons.push('Reduced training days for recovery.')
    }
    
    if (context.adjustmentReasons.includes('flexible_frequency_expand')) {
      reasonCodes.push('schedule_expanded')
      majorReasons.push('Added training days based on readiness.')
    }
    
    if (context.adjustmentReasons.includes('progression_advance')) {
      reasonCodes.push('progression_updated')
      majorReasons.push('Progressions advanced based on performance.')
    }
    
    if (context.adjustmentReasons.includes('stable_performance')) {
      reasonCodes.push('stability_maintained')
      preservedReasons.push('Training is progressing well. Maintaining structure.')
    }
    
    if (context.adjustmentReasons.includes('insufficient_data')) {
      reasonCodes.push('no_change_required')
      preservedReasons.push('Building data for smarter adaptation.')
    }
  }
  
  // If no changes detected
  if (reasonCodes.length === 0) {
    reasonCodes.push('no_change_required')
    preservedReasons.push('Program maintained based on stable progress.')
  }
  
  return {
    changed: majorReasons.length > 0,
    reasonCodes,
    majorReasons,
    preservedReasons: preservedReasons.length > 0 ? preservedReasons : undefined,
  }
}

// =============================================================================
// COMPACT DISPLAY HELPERS
// =============================================================================

/**
 * Get a compact "Why This Workout" summary for UI display.
 * Returns 2-4 concise lines max.
 */
export function getCompactWorkoutExplanation(
  metadata: ProgramExplanationMetadata,
  dayNumber: number
): { title: string; lines: string[] } {
  const session = metadata.sessionExplanations.find(s => s.dayNumber === dayNumber)
  
  if (!session) {
    return {
      title: 'Why This Workout',
      lines: ['Session details not available.'],
    }
  }
  
  const lines: string[] = []
  
  // Primary intent
  if (session.primaryIntent) {
    lines.push(session.primaryIntent)
  }
  
  // Why this day
  if (session.whyThisDay && lines.length < 3) {
    lines.push(session.whyThisDay)
  }
  
  // Limiter support
  if (session.limiterSupport && session.limiterSupport.length > 0 && lines.length < 4) {
    const limiters = session.limiterSupport.slice(0, 2).join(', ')
    lines.push(`Supporting: ${limiters}`)
  }
  
  // Why lighter/heavier
  if (session.whyLighterOrHeavier && lines.length < 4) {
    lines.push(session.whyLighterOrHeavier)
  }
  
  return {
    title: 'Why This Workout',
    lines: lines.slice(0, 4),
  }
}

/**
 * Get a compact "Why This Plan" summary for UI display.
 * Returns 2-4 concise lines max.
 */
export function getCompactPlanExplanation(
  metadata: ProgramExplanationMetadata
): { title: string; lines: string[] } {
  const lines: string[] = []
  
  // Primary goal
  if (metadata.summary.primaryGoalReason) {
    lines.push(metadata.summary.primaryGoalReason)
  }
  
  // Schedule
  if (metadata.summary.scheduleReason && lines.length < 3) {
    lines.push(metadata.summary.scheduleReason)
  }
  
  // Progression or recovery
  if (metadata.summary.recoveryReason && lines.length < 4) {
    lines.push(metadata.summary.recoveryReason)
  } else if (metadata.summary.progressionReason && lines.length < 4) {
    lines.push(metadata.summary.progressionReason)
  }
  
  return {
    title: 'Why This Plan',
    lines: lines.slice(0, 4),
  }
}

/**
 * Get a compact "Why It Changed" or "Why It Stayed" summary.
 */
export function getCompactChangeExplanation(
  metadata: ProgramExplanationMetadata
): { title: string; lines: string[] } | null {
  if (!metadata.changeExplanation) return null
  
  const change = metadata.changeExplanation
  
  if (change.reasonCodes.includes('first_generation')) {
    return null // No change explanation for first program
  }
  
  const title = change.changed ? 'Why It Changed' : 'Why It Stayed'
  const lines: string[] = []
  
  if (change.changed) {
    lines.push(...change.majorReasons.slice(0, 3))
  } else if (change.preservedReasons) {
    lines.push(...change.preservedReasons.slice(0, 3))
  }
  
  if (lines.length === 0) {
    lines.push(change.changed 
      ? 'Adapted based on recent training data.'
      : 'Maintaining proven structure.'
    )
  }
  
  return { title, lines: lines.slice(0, 3) }
}
