/**
 * Flexible Schedule Engine
 * 
 * DO NOT DRIFT: CANONICAL FLEXIBLE SCHEDULE SEMANTICS.
 * Resolves adaptive weekly frequency for users who selected "flexible" schedule mode.
 * This engine determines the current week's training structure based on:
 * - Primary goal demands
 * - Recovery/readiness state
 * - Joint cautions
 * - Training style
 * - Skill emphasis and tendon load
 * 
 * CRITICAL: Flexible schedule is a REAL semantic, not just a numeric variable.
 * currentWeekFrequency is DERIVED (not identity-defining).
 * Generator must preserve scheduleMode through entire flow.
 * Dashboard must show frequency as "this week" not permanent choice.
 * 
 * KEY PRINCIPLES:
 * - Flexible does NOT mean 7 hard days
 * - Stress must be varied across days
 * - High tendon/skill sessions must be controlled
 * - Recovery-managed consistency, not unrestricted frequency
 */

import type { 
  PrimaryGoal, 
  ExperienceLevel,
  JointCaution,
  RecoveryProfile,
} from './athlete-profile'
import { recordIntegrationProof } from './engine-integration-proof'

// =============================================================================
// TYPES
// =============================================================================

export type ScheduleMode = 'static' | 'flexible'

export type DayStressLevel = 
  | 'high_neural_skill'      // Primary skill day with high neural/tendon demand
  | 'moderate_strength'      // Strength support day with moderate intensity
  | 'lower_fatigue_density'  // Mixed work with lower recovery cost
  | 'recovery_bias_technical' // Light technical work, minimal stress
  | 'rest'                   // Programmed rest day

export type IntensityDistribution = 
  | 'conservative'   // More rest, careful progression
  | 'balanced'       // Standard recovery-managed approach
  | 'aggressive'     // Higher frequency for advanced athletes

export interface FlexibleFrequencyInput {
  scheduleMode: ScheduleMode
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  jointCautions?: JointCaution[]
  recoveryProfile?: RecoveryProfile
  recentWorkoutCount?: number  // Last 7 days
  currentLimiter?: string
  sessionMinutes?: number
  trainingStyle?: string
  weekNumber?: number
}

// =============================================================================
// [TASK 1] FLEXIBLE FREQUENCY ROOT-CAUSE CLASSIFICATION
// =============================================================================

/**
 * [TASK 1] Why did the flexible frequency resolve to its final number?
 * This is the critical diagnostic to distinguish true adaptive from baseline fallback.
 */
export type FlexibleFrequencyReasonCategory =
  | 'goal_typical_baseline'        // Used goal's typical value (4 for most goals)
  | 'joint_caution_conservative'   // Reduced due to joint cautions
  | 'poor_recovery_reduction'      // Reduced due to recovery profile
  | 'high_compliance_expansion'    // Increased due to good compliance history
  | 'low_history_default'          // Low workout history, using safe default
  | 'high_volume_conservative'     // Recent high volume, being conservative
  | 'true_adaptive_adjustment'     // Real feedback-driven adjustment
  | 'static_contamination'         // Flexible mode but static value leaked through
  | 'fallback_frequency'           // Could not resolve, used emergency fallback
  | 'experience_modifier_applied'  // Adjusted based on experience level

/**
 * [TASK 1] Root-cause audit for flexible frequency resolution.
 * This enables precise diagnosis of why frequency landed on a specific value.
 */
export interface FlexibleFrequencyRootCauseAudit {
  // Input values
  canonicalScheduleMode: string
  canonicalTrainingDaysPerWeek: number | string | null
  canonicalSessionDurationMode: string
  requestedScheduleMode: string
  requestedTrainingDaysPerWeek: number | string | null
  
  // Goal-based resolution
  goalRangeMin: number
  goalRangeMax: number
  goalTypical: number
  
  // Modifiers applied
  experienceModifier: number
  jointCautionPenalty: number
  recoveryScore: number | null
  recentWorkoutCount: number | null
  
  // Resolution trace
  preAdjustmentFrequency: number
  postAdjustmentFrequency: number
  finalFrequency: number
  
  // Root cause classification
  finalReasonCategory: FlexibleFrequencyReasonCategory
  reasonDetails: string
  
  // Was this truly adaptive?
  isTrueAdaptive: boolean
  isBaselineDefault: boolean
  wasModifiedFromBaseline: boolean
  modificationSteps: string[]
}

export interface FlexibleWeekStructure {
  // Core output
  currentWeekFrequency: number
  recommendedMinDays: number
  recommendedMaxDays: number
  
  // Day structure
  dayStressPattern: DayStressLevel[]
  
  // Metadata
  intensityDistribution: IntensityDistribution
  rationale: string
  includesAdaptiveDay: boolean
  isConservative: boolean
  
  // ISSUE D FIX: Clear wording source tracking
  wordingSource: 'saved_preference' | 'profile_resolution' | 'history_adaptation'
  
  // [TASK 1] Root-cause audit for why frequency resolved to this value
  rootCauseAudit: FlexibleFrequencyRootCauseAudit
  
  // For future weekly adaptation
  suggestedNextWeekAdjustment?: 'maintain' | 'increase' | 'decrease'
  adjustmentReason?: string
}

export interface WeeklyAdaptationInput {
  previousWeekFrequency: number
  completionRate: number  // 0-1
  fatigueTrend: 'increasing' | 'stable' | 'decreasing'
  readinessTrend: 'improving' | 'stable' | 'declining'
  limiterState: 'blocking' | 'moderate' | 'minimal'
  progressionStable: boolean
}

export interface WeeklyAdaptationResult {
  recommendedFrequency: number
  adjustment: 'increase' | 'maintain' | 'decrease'
  reason: string
  confidenceLevel: 'high' | 'medium' | 'low'
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Goal-specific frequency guidance
const GOAL_FREQUENCY_RANGES: Record<PrimaryGoal, { min: number; max: number; typical: number }> = {
  front_lever: { min: 3, max: 5, typical: 4 },
  back_lever: { min: 3, max: 5, typical: 4 },
  planche: { min: 3, max: 5, typical: 4 },  // High tendon demand, controlled frequency
  muscle_up: { min: 3, max: 5, typical: 4 },
  handstand: { min: 4, max: 6, typical: 5 }, // Can train more frequently with skill focus
  l_sit: { min: 3, max: 5, typical: 4 },
  weighted_pull: { min: 3, max: 5, typical: 4 },
  weighted_dip: { min: 3, max: 5, typical: 4 },
  general_strength: { min: 3, max: 5, typical: 4 },
  flexibility: { min: 4, max: 6, typical: 5 }, // Flexibility can be higher frequency
  mobility: { min: 4, max: 6, typical: 5 },
}

// Experience-based modifiers
const EXPERIENCE_MODIFIERS: Record<ExperienceLevel, { freqMod: number; canGoHigh: boolean }> = {
  beginner: { freqMod: -1, canGoHigh: false },
  intermediate: { freqMod: 0, canGoHigh: true },
  advanced: { freqMod: 1, canGoHigh: true },
}

// High tendon-stress goals that need careful frequency management
const HIGH_TENDON_GOALS: PrimaryGoal[] = ['planche', 'front_lever', 'back_lever', 'muscle_up']

// =============================================================================
// CORE FREQUENCY RESOLVER
// =============================================================================

/**
 * Resolves the current week's flexible training structure.
 * This is the main entry point for flexible schedule resolution.
 * 
 * [TASK 1] Now includes root-cause audit for precise diagnosis.
 */
export function resolveFlexibleFrequency(input: FlexibleFrequencyInput): FlexibleWeekStructure {
  console.log('[flex-frequency] Resolving flexible week structure:', {
    scheduleMode: input.scheduleMode,
    primaryGoal: input.primaryGoal,
    experienceLevel: input.experienceLevel,
  })
  
  // [TASK 1] Track modification steps for root-cause audit
  const modificationSteps: string[] = []
  let reasonCategory: FlexibleFrequencyReasonCategory = 'goal_typical_baseline'
  
  // If static mode, return a simple structure matching the static days
  if (input.scheduleMode === 'static') {
    console.log('[flex-frequency] Static mode - using standard structure')
    return createStaticWeekStructure(4) // Default if somehow called with static
  }
  
  // Get base frequency range for the goal
  const goalRange = GOAL_FREQUENCY_RANGES[input.primaryGoal] || GOAL_FREQUENCY_RANGES.general_strength
  const expMod = EXPERIENCE_MODIFIERS[input.experienceLevel] || EXPERIENCE_MODIFIERS.intermediate
  
  // Calculate recommended range
  let minDays = Math.max(2, goalRange.min + (expMod.freqMod < 0 ? expMod.freqMod : 0))
  let maxDays = Math.min(6, goalRange.max + (expMod.canGoHigh ? 1 : 0))
  let typicalDays = goalRange.typical + expMod.freqMod
  
  // [TASK 1] Track baseline before modifications
  const goalTypicalBaseline = goalRange.typical
  const preModificationTypical = typicalDays
  modificationSteps.push(`Goal baseline: ${goalRange.typical}, with exp modifier: ${expMod.freqMod} -> ${typicalDays}`)
  
  if (expMod.freqMod !== 0) {
    reasonCategory = 'experience_modifier_applied'
  }
  
  // [TASK 1] Track joint caution penalty
  let jointCautionPenalty = 0
  
  // Apply joint caution adjustments
  if (input.jointCautions && input.jointCautions.length > 0) {
    jointCautionPenalty = Math.min(input.jointCautions.length, 2)
    const beforeCaution = typicalDays
    maxDays = Math.max(minDays, maxDays - jointCautionPenalty)
    typicalDays = Math.max(minDays, typicalDays - 1)
    modificationSteps.push(`Joint caution penalty: -${jointCautionPenalty} max, -1 typical (${beforeCaution} -> ${typicalDays})`)
    reasonCategory = 'joint_caution_conservative'
    console.log('[flex-frequency] Joint cautions applied:', { cautionPenalty: jointCautionPenalty, maxDays, typicalDays })
  }
  
  // [TASK 1] Track recovery score
  let recoveryScore: number | null = null
  
  // Apply recovery profile adjustments
  if (input.recoveryProfile) {
    recoveryScore = calculateRecoveryScore(input.recoveryProfile)
    const beforeRecovery = typicalDays
    if (recoveryScore < 0.5) {
      typicalDays = Math.max(minDays, typicalDays - 1)
      modificationSteps.push(`Poor recovery (score: ${recoveryScore.toFixed(2)}): -1 (${beforeRecovery} -> ${typicalDays})`)
      reasonCategory = 'poor_recovery_reduction'
      console.log('[flex-frequency] Poor recovery - reducing frequency')
    } else if (recoveryScore > 0.8 && expMod.canGoHigh) {
      typicalDays = Math.min(maxDays, typicalDays + 1)
      modificationSteps.push(`Good recovery (score: ${recoveryScore.toFixed(2)}): +1 (${beforeRecovery} -> ${typicalDays})`)
      reasonCategory = 'high_compliance_expansion'
      console.log('[flex-frequency] Good recovery - allowing higher frequency')
    }
  }
  
  // Apply recent training load check
  if (input.recentWorkoutCount !== undefined) {
    const beforeWorkloadCheck = typicalDays
    if (input.recentWorkoutCount > 5) {
      // Already training frequently, be conservative
      typicalDays = Math.max(minDays, typicalDays - 1)
      modificationSteps.push(`High recent volume (${input.recentWorkoutCount} sessions): -1 (${beforeWorkloadCheck} -> ${typicalDays})`)
      reasonCategory = 'high_volume_conservative'
      console.log('[flex-frequency] High recent volume - being conservative')
    } else if (input.recentWorkoutCount < 2) {
      // Under-training, can encourage more
      typicalDays = Math.min(maxDays, typicalDays + 1)
      modificationSteps.push(`Low recent volume (${input.recentWorkoutCount} sessions): +1 (${beforeWorkloadCheck} -> ${typicalDays})`)
      reasonCategory = 'low_history_default'
    }
  }
  
  // Ensure typical is within bounds
  const currentFrequency = Math.max(minDays, Math.min(maxDays, typicalDays))
  
  // [TASK 1] Determine if this was truly adaptive or just baseline
  const isBaselineDefault = currentFrequency === goalTypicalBaseline && modificationSteps.length <= 1
  const wasModifiedFromBaseline = currentFrequency !== goalTypicalBaseline || modificationSteps.length > 1
  const isTrueAdaptive = wasModifiedFromBaseline && reasonCategory !== 'goal_typical_baseline'
  
  // If nothing modified and we're at baseline, explicitly mark it
  if (!wasModifiedFromBaseline) {
    reasonCategory = 'goal_typical_baseline'
    modificationSteps.push(`No modifiers applied - using goal baseline: ${goalTypicalBaseline}`)
  }
  
  // Determine intensity distribution
  const intensityDistribution = determineIntensityDistribution(input, currentFrequency)
  
  // Generate day stress pattern
  const dayStressPattern = generateDayStressPattern(
    currentFrequency,
    input.primaryGoal,
    intensityDistribution
  )
  
  // Check if we're including an adaptive/lighter day
  const includesAdaptiveDay = dayStressPattern.some(
    d => d === 'lower_fatigue_density' || d === 'recovery_bias_technical'
  )
  
  // Generate rationale
  const rationale = generateFrequencyRationale(input, currentFrequency, intensityDistribution)
  
  // [TASK 1] Build root-cause audit
  const rootCauseAudit: FlexibleFrequencyRootCauseAudit = {
    canonicalScheduleMode: input.scheduleMode,
    canonicalTrainingDaysPerWeek: input.trainingDaysPerWeek ?? null,
    canonicalSessionDurationMode: 'adaptive', // flexible always implies adaptive duration
    requestedScheduleMode: input.scheduleMode,
    requestedTrainingDaysPerWeek: input.trainingDaysPerWeek ?? null,
    goalRangeMin: goalRange.min,
    goalRangeMax: goalRange.max,
    goalTypical: goalRange.typical,
    experienceModifier: expMod.freqMod,
    jointCautionPenalty,
    recoveryScore,
    recentWorkoutCount: input.recentWorkoutCount ?? null,
    preAdjustmentFrequency: preModificationTypical,
    postAdjustmentFrequency: typicalDays,
    finalFrequency: currentFrequency,
    finalReasonCategory: reasonCategory,
    reasonDetails: modificationSteps.join(' | '),
    isTrueAdaptive,
    isBaselineDefault,
    wasModifiedFromBaseline,
    modificationSteps,
  }
  
  const result: FlexibleWeekStructure = {
    currentWeekFrequency: currentFrequency,
    recommendedMinDays: minDays,
    recommendedMaxDays: maxDays,
    dayStressPattern,
    intensityDistribution,
    rationale,
    includesAdaptiveDay,
    isConservative: intensityDistribution === 'conservative',
    // ISSUE D FIX: Track wording source - this is based on profile resolution, not history yet
    wordingSource: 'profile_resolution',
    // [TASK 1] Include root-cause audit
    rootCauseAudit,
  }
  
  // ENGINE PROOF: Record flexible schedule resolution
  recordIntegrationProof('flexible_schedule', 'resolved week structure', {
    scheduleMode: input.scheduleMode,
    frequency: currentFrequency,
    range: `${minDays}-${maxDays}`,
    distribution: intensityDistribution,
    hasJointCautions: (input.jointCautions?.length || 0) > 0,
  })
  
  // [TASK 1] Structured root-cause audit log
  console.log('[flex-root-cause-audit]', {
    finalFrequency: currentFrequency,
    finalReasonCategory: reasonCategory,
    isTrueAdaptive,
    isBaselineDefault,
    wasModifiedFromBaseline,
    goalTypical: goalRange.typical,
    goalRange: `${goalRange.min}-${goalRange.max}`,
    experienceModifier: expMod.freqMod,
    jointCautionPenalty,
    recoveryScore,
    recentWorkoutCount: input.recentWorkoutCount,
    modificationSteps,
  })
  
  console.log('[flex-frequency] Resolved structure:', {
    frequency: currentFrequency,
    range: `${minDays}-${maxDays}`,
    distribution: intensityDistribution,
  })
  
  return result
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateRecoveryScore(recovery: RecoveryProfile): number {
  const scores = {
    good: 1,
    normal: 0.6,
    poor: 0.3,
  }
  
  const total = 
    scores[recovery.sleepQuality] +
    scores[recovery.energyLevel] +
    (1 - scores[recovery.stressLevel]) + // Invert stress
    scores[recovery.recoveryConfidence]
  
  return total / 4
}

function determineIntensityDistribution(
  input: FlexibleFrequencyInput,
  frequency: number
): IntensityDistribution {
  // Conservative conditions
  if (input.experienceLevel === 'beginner') return 'conservative'
  if (input.jointCautions && input.jointCautions.length >= 2) return 'conservative'
  if (input.weekNumber !== undefined && input.weekNumber <= 2) return 'conservative'
  
  // Aggressive conditions (only for advanced with good recovery)
  if (
    input.experienceLevel === 'advanced' &&
    frequency >= 5 &&
    (!input.jointCautions || input.jointCautions.length === 0)
  ) {
    return 'aggressive'
  }
  
  return 'balanced'
}

function generateDayStressPattern(
  frequency: number,
  goal: PrimaryGoal,
  distribution: IntensityDistribution
): DayStressLevel[] {
  const isHighTendon = HIGH_TENDON_GOALS.includes(goal)
  const pattern: DayStressLevel[] = []
  
  // Day 1: Always primary skill focus
  pattern.push('high_neural_skill')
  
  if (frequency >= 2) {
    // Day 2: Strength support or moderate work
    pattern.push('moderate_strength')
  }
  
  if (frequency >= 3) {
    // Day 3: For high tendon goals, add lower intensity day
    // For others, another strength day is okay
    if (isHighTendon || distribution === 'conservative') {
      pattern.push('lower_fatigue_density')
    } else {
      pattern.push('high_neural_skill')
    }
  }
  
  if (frequency >= 4) {
    // Day 4: Mix of support work
    pattern.push('moderate_strength')
  }
  
  if (frequency >= 5) {
    // Day 5: Technical/recovery bias for high tendon, strength for others
    if (isHighTendon) {
      pattern.push('recovery_bias_technical')
    } else {
      pattern.push('lower_fatigue_density')
    }
  }
  
  if (frequency >= 6) {
    // Day 6: Optional lighter day
    pattern.push('recovery_bias_technical')
  }
  
  return pattern
}

function generateFrequencyRationale(
  input: FlexibleFrequencyInput,
  frequency: number,
  distribution: IntensityDistribution
): string {
  const goalName = input.primaryGoal.replace(/_/g, ' ')
  const isHighTendon = HIGH_TENDON_GOALS.includes(input.primaryGoal)
  
  // ISSUE C/D FIX: Clear wording that distinguishes saved preference vs current resolution
  // Start with what this week resolves to (not what history says)
  let rationale = `This week: ${frequency} training days`
  
  if (isHighTendon) {
    rationale += ` (balancing ${goalName} skill work with tendon recovery)`
  } else {
    rationale += ` (optimized for ${goalName} progress)`
  }
  
  if (input.jointCautions && input.jointCautions.length > 0) {
    rationale += `. Adjusted for joint considerations`
  }
  
  if (distribution === 'conservative') {
    rationale += `. Conservative approach for consistent progress`
  } else if (distribution === 'aggressive') {
    rationale += `. Higher frequency supported by your experience`
  }
  
  return rationale + '.'
}

function createStaticWeekStructure(days: number): FlexibleWeekStructure {
  const pattern: DayStressLevel[] = []
  for (let i = 0; i < days; i++) {
    if (i === 0) pattern.push('high_neural_skill')
    else if (i % 2 === 0) pattern.push('moderate_strength')
    else pattern.push('lower_fatigue_density')
  }
  
  // [TASK 1] Static mode root-cause audit - marks as static contamination if called for flexible
  const staticRootCauseAudit: FlexibleFrequencyRootCauseAudit = {
    canonicalScheduleMode: 'static',
    canonicalTrainingDaysPerWeek: days,
    canonicalSessionDurationMode: 'static',
    requestedScheduleMode: 'static',
    requestedTrainingDaysPerWeek: days,
    goalRangeMin: days,
    goalRangeMax: days,
    goalTypical: days,
    experienceModifier: 0,
    jointCautionPenalty: 0,
    recoveryScore: null,
    recentWorkoutCount: null,
    preAdjustmentFrequency: days,
    postAdjustmentFrequency: days,
    finalFrequency: days,
    finalReasonCategory: 'static_contamination', // Static mode called - not true flexible
    reasonDetails: `Static ${days}-day schedule from profile preference`,
    isTrueAdaptive: false,
    isBaselineDefault: true,
    wasModifiedFromBaseline: false,
    modificationSteps: [`Static mode: using ${days} days as configured`],
  }
  
  return {
    currentWeekFrequency: days,
    recommendedMinDays: days,
    recommendedMaxDays: days,
    dayStressPattern: pattern,
    intensityDistribution: 'balanced',
    rationale: `${days}-day schedule as selected in your profile.`,
    includesAdaptiveDay: false,
    isConservative: false,
    // ISSUE D FIX: Static mode is always based on saved preference
    wordingSource: 'saved_preference',
    // [TASK 1] Include root-cause audit even for static
    rootCauseAudit: staticRootCauseAudit,
  }
}

// =============================================================================
// WEEKLY ADAPTATION (FOUNDATION)
// =============================================================================

/**
 * Evaluates whether next week's frequency should be adjusted.
 * This is the foundation for future weekly adaptation features.
 */
export function evaluateFlexibleWeekAdjustment(
  input: WeeklyAdaptationInput
): WeeklyAdaptationResult {
  console.log('[flex-frequency] Evaluating week adjustment:', input)
  
  let adjustment: 'increase' | 'maintain' | 'decrease' = 'maintain'
  let reason = 'Current frequency is appropriate.'
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let recommendedFrequency = input.previousWeekFrequency
  
  // Check completion rate
  if (input.completionRate < 0.6) {
    adjustment = 'decrease'
    recommendedFrequency = Math.max(2, input.previousWeekFrequency - 1)
    reason = 'Completion rate below 60% suggests frequency may be too high.'
    confidence = 'high'
  } else if (input.completionRate >= 0.95 && input.progressionStable) {
    // Consider increasing only if fully completing and stable
    if (input.fatigueTrend !== 'increasing' && input.readinessTrend !== 'declining') {
      adjustment = 'increase'
      recommendedFrequency = Math.min(6, input.previousWeekFrequency + 1)
      reason = 'Excellent completion with stable progression allows frequency increase.'
      confidence = 'medium'
    }
  }
  
  // Override for concerning fatigue/readiness trends
  if (input.fatigueTrend === 'increasing' && input.readinessTrend === 'declining') {
    adjustment = 'decrease'
    recommendedFrequency = Math.max(2, input.previousWeekFrequency - 1)
    reason = 'Fatigue increasing while readiness declining - reducing frequency for recovery.'
    confidence = 'high'
  }
  
  // Check limiter state
  if (input.limiterState === 'blocking') {
    adjustment = 'maintain'
    reason = 'Current limiter requires attention before adjusting frequency.'
    confidence = 'medium'
  }
  
  console.log('[flex-frequency] Adjustment result:', { adjustment, recommendedFrequency, reason })
  
  return {
    recommendedFrequency,
    adjustment,
    reason,
    confidenceLevel: confidence,
  }
}

// =============================================================================
// SCHEDULE MODE UTILITIES
// =============================================================================

/**
 * Determines if a value represents flexible mode.
 */
export function isFlexibleMode(value: unknown): boolean {
  return value === 'flexible' || value === 'Flexible'
}

/**
 * Normalizes schedule mode from various input formats.
 */
export function normalizeScheduleMode(
  trainingDaysPerWeek: number | string | 'flexible' | undefined
): ScheduleMode {
  if (isFlexibleMode(trainingDaysPerWeek)) {
    return 'flexible'
  }
  return 'static'
}

/**
 * Gets the numeric frequency from a potentially flexible value.
 * For flexible users, this returns a reasonable default.
 * For static users, returns the actual value.
 */
export function getEffectiveFrequency(
  trainingDaysPerWeek: number | string | 'flexible' | undefined,
  defaultFlexible: number = 4
): number {
  if (isFlexibleMode(trainingDaysPerWeek)) {
    return defaultFlexible
  }
  if (typeof trainingDaysPerWeek === 'number') {
    return trainingDaysPerWeek
  }
  if (typeof trainingDaysPerWeek === 'string') {
    const parsed = parseInt(trainingDaysPerWeek, 10)
    return isNaN(parsed) ? 4 : parsed
  }
  return 4 // Default
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  FlexibleFrequencyInput,
  FlexibleWeekStructure,
  WeeklyAdaptationInput,
  WeeklyAdaptationResult,
  FlexibleFrequencyReasonCategory,
  FlexibleFrequencyRootCauseAudit,
}
