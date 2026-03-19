/**
 * Flexible Schedule Engine
 * 
 * Resolves adaptive weekly frequency for users who selected "flexible" schedule mode.
 * This engine determines the current week's training structure based on:
 * - Primary goal demands
 * - Recovery/readiness state
 * - Joint cautions
 * - Training style
 * - Skill emphasis and tendon load
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
 */
export function resolveFlexibleFrequency(input: FlexibleFrequencyInput): FlexibleWeekStructure {
  console.log('[flex-frequency] Resolving flexible week structure:', {
    scheduleMode: input.scheduleMode,
    primaryGoal: input.primaryGoal,
    experienceLevel: input.experienceLevel,
  })
  
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
  
  // Apply joint caution adjustments
  if (input.jointCautions && input.jointCautions.length > 0) {
    const cautionPenalty = Math.min(input.jointCautions.length, 2)
    maxDays = Math.max(minDays, maxDays - cautionPenalty)
    typicalDays = Math.max(minDays, typicalDays - 1)
    console.log('[flex-frequency] Joint cautions applied:', { cautionPenalty, maxDays, typicalDays })
  }
  
  // Apply recovery profile adjustments
  if (input.recoveryProfile) {
    const recoveryScore = calculateRecoveryScore(input.recoveryProfile)
    if (recoveryScore < 0.5) {
      typicalDays = Math.max(minDays, typicalDays - 1)
      console.log('[flex-frequency] Poor recovery - reducing frequency')
    } else if (recoveryScore > 0.8 && expMod.canGoHigh) {
      typicalDays = Math.min(maxDays, typicalDays + 1)
      console.log('[flex-frequency] Good recovery - allowing higher frequency')
    }
  }
  
  // Apply recent training load check
  if (input.recentWorkoutCount !== undefined) {
    if (input.recentWorkoutCount > 5) {
      // Already training frequently, be conservative
      typicalDays = Math.max(minDays, typicalDays - 1)
      console.log('[flex-frequency] High recent volume - being conservative')
    } else if (input.recentWorkoutCount < 2) {
      // Under-training, can encourage more
      typicalDays = Math.min(maxDays, typicalDays + 1)
    }
  }
  
  // Ensure typical is within bounds
  const currentFrequency = Math.max(minDays, Math.min(maxDays, typicalDays))
  
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
  
  const result: FlexibleWeekStructure = {
    currentWeekFrequency: currentFrequency,
    recommendedMinDays: minDays,
    recommendedMaxDays: maxDays,
    dayStressPattern,
    intensityDistribution,
    rationale,
    includesAdaptiveDay,
    isConservative: intensityDistribution === 'conservative',
  }
  
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
  
  let rationale = `Based on your ${goalName} focus`
  
  if (isHighTendon) {
    rationale += `, ${frequency} training days this week balances skill exposure with tendon recovery`
  } else {
    rationale += `, ${frequency} training days provides effective stimulus while managing fatigue`
  }
  
  if (input.jointCautions && input.jointCautions.length > 0) {
    rationale += `. Frequency adjusted for joint considerations`
  }
  
  if (distribution === 'conservative') {
    rationale += `. Taking a conservative approach to build consistency`
  } else if (distribution === 'aggressive') {
    rationale += `. Higher frequency supported by your experience level`
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
  
  return {
    currentWeekFrequency: days,
    recommendedMinDays: days,
    recommendedMaxDays: days,
    dayStressPattern: pattern,
    intensityDistribution: 'balanced',
    rationale: `Static ${days}-day schedule as selected.`,
    includesAdaptiveDay: false,
    isConservative: false,
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
}
