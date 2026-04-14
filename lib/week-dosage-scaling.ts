/**
 * Week Dosage Scaling Service
 * 
 * =============================================================================
 * PHASE: WEEK PROGRESSION TRUTH
 * =============================================================================
 * 
 * This service provides REAL week-over-week progression by computing
 * scaled dosage based on the current weekNumber. The stored program contains
 * week 1 (acclimation) dosage, and this service DERIVES the correct dosage
 * for week 2, 3, 4 etc. at display/consumption time.
 * 
 * CORE PRINCIPLES:
 * - Week 1 = stored acclimation dosage (conservative first-week values)
 * - Week 2+ = scaled UP from acclimation to normal/progressive dosage
 * - Scaling is computed, not stored - preserves program identity
 * - Week 4 may include slight deload or maintain progression
 * 
 * DOSAGE SCALING PHILOSOPHY:
 * - Week 1: ~70-80% of normal volume/intensity (acclimation)
 * - Week 2: ~90% of normal volume, normal intensity
 * - Week 3: 100% normal volume and intensity
 * - Week 4: 95-100% or slight deload depending on cycle design
 */

import type { AdaptiveSession, AdaptiveExercise } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export interface WeekDosageScalingResult {
  weekNumber: number
  scalingApplied: boolean
  phaseLabel: 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'
  volumeMultiplier: number
  intensityMultiplier: number
  holdDurationMultiplier: number
  restMultiplier: number // >1 = more rest for early weeks, <1 = less rest for peak weeks
  scalingReason: string
}

export interface ScaledExercise extends AdaptiveExercise {
  // Scaled values for display
  scaledSets?: number
  scaledReps?: string
  scaledHoldDuration?: number
  scaledTargetRPE?: number
  scaledRestPeriod?: number
  // Metadata about scaling
  weekScalingApplied?: boolean
  originalSets?: number
  originalReps?: string
  originalTargetRPE?: number
}

export interface ScaledSession extends Omit<AdaptiveSession, 'exercises'> {
  exercises: ScaledExercise[]
  weekScalingApplied: boolean
  weekNumber: number
  dosageScaling: WeekDosageScalingResult
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Week-specific scaling factors
 * These define how dosage scales across a 4-week cycle
 */
const WEEK_SCALING_PROFILES: Record<number, WeekDosageScalingResult> = {
  1: {
    weekNumber: 1,
    scalingApplied: false, // Week 1 uses stored acclimation values as-is
    phaseLabel: 'acclimation',
    volumeMultiplier: 1.0, // Already reduced in generation
    intensityMultiplier: 1.0,
    holdDurationMultiplier: 1.0,
    restMultiplier: 1.0,
    scalingReason: 'Week 1 uses stored acclimation dosage - no scaling needed',
  },
  2: {
    weekNumber: 2,
    scalingApplied: true,
    phaseLabel: 'ramp_up',
    volumeMultiplier: 1.20, // 20% more sets than week 1
    intensityMultiplier: 1.05, // Slight RPE increase
    holdDurationMultiplier: 1.15, // 15% longer holds
    restMultiplier: 0.95, // Slightly less rest
    scalingReason: 'Week 2 ramp-up: increased volume and intensity from acclimation baseline',
  },
  3: {
    weekNumber: 3,
    scalingApplied: true,
    phaseLabel: 'peak',
    volumeMultiplier: 1.35, // 35% more sets than week 1
    intensityMultiplier: 1.10, // Higher RPE targets
    holdDurationMultiplier: 1.25, // 25% longer holds
    restMultiplier: 0.90, // Less rest for density
    scalingReason: 'Week 3 peak: full training volume and intensity',
  },
  4: {
    weekNumber: 4,
    scalingApplied: true,
    phaseLabel: 'consolidation',
    volumeMultiplier: 1.25, // Slightly backed off from peak
    intensityMultiplier: 1.08, // Maintain good intensity
    holdDurationMultiplier: 1.20,
    restMultiplier: 0.95,
    scalingReason: 'Week 4 consolidation: maintaining gains, slight volume reduction before next cycle',
  },
}

// =============================================================================
// MAIN SCALING FUNCTIONS
// =============================================================================

/**
 * Get the dosage scaling profile for a given week number
 */
export function getWeekDosageScaling(weekNumber: number): WeekDosageScalingResult {
  // Clamp to valid range
  const clampedWeek = Math.max(1, Math.min(4, weekNumber))
  return WEEK_SCALING_PROFILES[clampedWeek] || WEEK_SCALING_PROFILES[1]
}

/**
 * Apply week-specific dosage scaling to a single exercise
 */
export function scaleExerciseForWeek(
  exercise: AdaptiveExercise,
  weekNumber: number
): ScaledExercise {
  const scaling = getWeekDosageScaling(weekNumber)
  
  // Week 1: no scaling, return as-is
  if (!scaling.scalingApplied || weekNumber === 1) {
    return {
      ...exercise,
      weekScalingApplied: false,
    }
  }
  
  // Parse original values
  const originalSets = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets)) || 3
  const originalReps = exercise.reps || '8-12'
  const originalTargetRPE = exercise.targetRPE || 8
  const originalRestPeriod = exercise.restPeriod || 90
  const originalHoldDuration = parseHoldDuration(exercise.reps)
  
  // Apply scaling
  const scaledSets = Math.round(originalSets * scaling.volumeMultiplier)
  const scaledTargetRPE = Math.min(10, Math.round((originalTargetRPE * scaling.intensityMultiplier) * 10) / 10)
  const scaledRestPeriod = Math.round(originalRestPeriod * scaling.restMultiplier)
  
  // Scale hold durations for isometric exercises
  let scaledReps = originalReps
  let scaledHoldDuration: number | undefined
  
  if (originalHoldDuration !== null) {
    scaledHoldDuration = Math.round(originalHoldDuration * scaling.holdDurationMultiplier)
    scaledReps = formatHoldDuration(scaledHoldDuration)
  } else {
    scaledReps = scaleRepRange(originalReps, scaling.volumeMultiplier)
  }
  
  return {
    ...exercise,
    // Scaled values for display
    scaledSets: Math.max(2, Math.min(6, scaledSets)), // Bound to reasonable range
    scaledReps,
    scaledHoldDuration,
    scaledTargetRPE: Math.max(6, scaledTargetRPE), // Minimum RPE 6
    scaledRestPeriod: Math.max(60, scaledRestPeriod), // Minimum 60s rest
    // Metadata
    weekScalingApplied: true,
    originalSets,
    originalReps,
    originalTargetRPE,
  }
}

/**
 * Apply week-specific dosage scaling to an entire session
 */
export function scaleSessionForWeek(
  session: AdaptiveSession,
  weekNumber: number
): ScaledSession {
  const scaling = getWeekDosageScaling(weekNumber)
  
  const scaledExercises = (session.exercises || []).map(ex => 
    scaleExerciseForWeek(ex, weekNumber)
  )
  
  return {
    ...session,
    exercises: scaledExercises,
    weekScalingApplied: scaling.scalingApplied,
    weekNumber,
    dosageScaling: scaling,
  }
}

/**
 * Apply week-specific dosage scaling to all sessions in a program
 */
export function scaleSessionsForWeek(
  sessions: AdaptiveSession[],
  weekNumber: number
): ScaledSession[] {
  return sessions.map(session => scaleSessionForWeek(session, weekNumber))
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse hold duration from reps string (e.g., "20s hold" -> 20)
 */
function parseHoldDuration(reps: string | undefined): number | null {
  if (!reps) return null
  
  const holdMatch = reps.match(/(\d+)\s*s(?:ec)?(?:ond)?s?\s*(?:hold)?/i)
  if (holdMatch) {
    return parseInt(holdMatch[1], 10)
  }
  
  return null
}

/**
 * Format hold duration back to string
 */
function formatHoldDuration(seconds: number): string {
  return `${seconds}s hold`
}

/**
 * Scale a rep range string (e.g., "8-12" -> "10-15")
 */
function scaleRepRange(reps: string, multiplier: number): string {
  // Handle "XxY" format (e.g., "3x8")
  const setRepMatch = reps.match(/(\d+)\s*x\s*(\d+)/i)
  if (setRepMatch) {
    const sets = parseInt(setRepMatch[1], 10)
    const repCount = parseInt(setRepMatch[2], 10)
    const scaledReps = Math.round(repCount * Math.sqrt(multiplier)) // Square root for moderate scaling
    return `${sets}x${scaledReps}`
  }
  
  // Handle range format (e.g., "8-12")
  const rangeMatch = reps.match(/(\d+)\s*-\s*(\d+)/)
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10)
    const high = parseInt(rangeMatch[2], 10)
    const scaledLow = Math.round(low * Math.sqrt(multiplier))
    const scaledHigh = Math.round(high * Math.sqrt(multiplier))
    return `${scaledLow}-${scaledHigh}`
  }
  
  // Handle single number
  const singleMatch = reps.match(/^(\d+)$/)
  if (singleMatch) {
    const count = parseInt(singleMatch[1], 10)
    const scaled = Math.round(count * Math.sqrt(multiplier))
    return String(scaled)
  }
  
  // Return unchanged if format not recognized
  return reps
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get a human-readable description of the current week's training phase
 */
export function getWeekPhaseDescription(weekNumber: number): string {
  const scaling = getWeekDosageScaling(weekNumber)
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return 'Acclimation Week - Conservative volume to establish baseline'
    case 'ramp_up':
      return 'Ramp-Up Week - Increasing volume and intensity'
    case 'peak':
      return 'Peak Week - Full training volume and intensity'
    case 'consolidation':
      return 'Consolidation Week - Maintaining gains before next cycle'
    default:
      return `Week ${weekNumber}`
  }
}

/**
 * Get short phase label for UI chips
 */
export function getWeekPhaseLabel(weekNumber: number): string {
  const scaling = getWeekDosageScaling(weekNumber)
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return 'Acclimation'
    case 'ramp_up':
      return 'Ramp Up'
    case 'peak':
      return 'Peak'
    case 'consolidation':
      return 'Consolidation'
    default:
      return `Week ${weekNumber}`
  }
}

/**
 * Get volume indicator for display
 */
export function getWeekVolumeIndicator(weekNumber: number): { label: string; percentage: number } {
  const scaling = getWeekDosageScaling(weekNumber)
  
  // Week 1 is the stored baseline (which is ~70-80% of full volume)
  // So we describe it relative to "full" volume
  const baselinePercentage = 75 // Week 1 is approximately 75% of full volume
  
  // [WEEK-PROGRESSION-TRUTH] Cap display percentage at 100% to avoid confusing "101%" displays
  // The actual scaling can exceed 100% (e.g., peak week), but we display it as "Full" / 100%
  const capAt100 = (pct: number) => Math.min(100, Math.round(pct))
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return { label: 'Reduced', percentage: baselinePercentage }
    case 'ramp_up':
      return { label: 'Building', percentage: capAt100(baselinePercentage * scaling.volumeMultiplier) }
    case 'peak':
      return { label: 'Full', percentage: capAt100(baselinePercentage * scaling.volumeMultiplier) }
    case 'consolidation':
      return { label: 'Maintained', percentage: capAt100(baselinePercentage * scaling.volumeMultiplier) }
    default:
      return { label: 'Normal', percentage: 100 }
  }
}
