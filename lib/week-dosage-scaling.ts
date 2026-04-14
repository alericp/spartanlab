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
  // [DOCTRINE-STRENGTHENING] Session character flags for visible week differentiation
  densityAllowed: boolean // Can include density blocks/supersets
  finishersAllowed: boolean // Can include finisher exercises
  skillExposureLevel: 'conservative' | 'moderate' | 'full' // How much skill work is allowed
  sessionIntensityCap: number // Max RPE allowed (6-10 scale)
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
  // [DOCTRINE-STRENGTHENING] Session-level week character flags
  weekCharacter: {
    densityAllowed: boolean
    finishersAllowed: boolean
    skillExposureLevel: 'conservative' | 'moderate' | 'full'
    sessionIntensityCap: number
    phaseLabel: 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'
  }
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Week-specific scaling factors
 * These define how dosage scales across a 4-week cycle
 * 
 * [DOCTRINE-STRENGTHENING] Made multipliers MORE PRONOUNCED so users can actually
 * see meaningful week-to-week differences in their program:
 * - Week 1: 2 sets base (conservative acclimation)
 * - Week 2: 3 sets (ramp-up, +50% from base)
 * - Week 3: 4 sets (peak, +100% from base)
 * - Week 4: 3 sets (consolidation, maintain without overreaching)
 */
const WEEK_SCALING_PROFILES: Record<number, WeekDosageScalingResult> = {
  1: {
    weekNumber: 1,
    scalingApplied: false, // Week 1 uses stored acclimation values as-is
    phaseLabel: 'acclimation',
    volumeMultiplier: 1.0, // Base acclimation - typically 2 sets per exercise
    intensityMultiplier: 1.0, // Conservative RPE
    holdDurationMultiplier: 1.0, // Base hold times
    restMultiplier: 1.2, // MORE rest in acclimation (longer recovery)
    scalingReason: 'Acclimation: Conservative entry with reduced volume and extended rest',
    // [DOCTRINE] Week 1 is protective - no density, no finishers, capped intensity
    densityAllowed: false,
    finishersAllowed: false,
    skillExposureLevel: 'conservative',
    sessionIntensityCap: 7,
  },
  2: {
    weekNumber: 2,
    scalingApplied: true,
    phaseLabel: 'ramp_up',
    volumeMultiplier: 1.50, // 50% more sets (2→3 sets)
    intensityMultiplier: 1.10, // Moderate RPE increase
    holdDurationMultiplier: 1.25, // 25% longer holds
    restMultiplier: 1.0, // Normal rest periods
    scalingReason: 'Ramp-Up: Building toward full training capacity',
    // [DOCTRINE] Week 2 starts to open up - some density allowed
    densityAllowed: true,
    finishersAllowed: false,
    skillExposureLevel: 'moderate',
    sessionIntensityCap: 8,
  },
  3: {
    weekNumber: 3,
    scalingApplied: true,
    phaseLabel: 'peak',
    volumeMultiplier: 2.0, // Double the sets (2→4 sets)
    intensityMultiplier: 1.15, // Higher RPE targets
    holdDurationMultiplier: 1.50, // 50% longer holds
    restMultiplier: 0.85, // Reduced rest for density
    scalingReason: 'Peak: Maximum productive volume and intensity',
    // [DOCTRINE] Week 3 is full exposure - everything allowed
    densityAllowed: true,
    finishersAllowed: true,
    skillExposureLevel: 'full',
    sessionIntensityCap: 9,
  },
  4: {
    weekNumber: 4,
    scalingApplied: true,
    phaseLabel: 'consolidation',
    volumeMultiplier: 1.80, // 90% of peak (slightly reduced from 100%, not a full deload)
    intensityMultiplier: 1.12, // Maintain intensity but reduce volume stress
    holdDurationMultiplier: 1.40, // Moderate-high holds
    restMultiplier: 0.90, // Moderate rest (between ramp-up and peak)
    scalingReason: 'Consolidation: Maintain adaptations while managing fatigue',
    // [DOCTRINE] Week 4 consolidates - maintain quality but reduce stress
    densityAllowed: true,
    finishersAllowed: false, // No finishers - focus on core work
    skillExposureLevel: 'moderate',
    sessionIntensityCap: 8,
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
  
  // Week 1: acclimation - still apply dosage fields for consistent display
  // [WEEK-SCALING-FIX] Always attach scaled fields even for week 1 so display contract works
  // [PRESCRIPTION-TYPE-FIX] Use repsOrTime field (canonical) with fallback to reps for compatibility
  const rawRepsOrTime = exercise.repsOrTime || (exercise as { reps?: string }).reps || '8-12'
  
  if (!scaling.scalingApplied || weekNumber === 1) {
    const originalSets = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets)) || 3
    const originalTargetRPE = exercise.targetRPE || 8
    // [PRESCRIPTION-TYPE-FIX] Preserve hold format for week 1 display
    const holdDuration = parseHoldDuration(rawRepsOrTime)
    const scaledReps = holdDuration !== null ? formatHoldDuration(holdDuration) : rawRepsOrTime
    return {
      ...exercise,
      scaledSets: originalSets, // Same as original for week 1
      scaledReps,
      scaledHoldDuration: holdDuration ?? undefined,
      scaledTargetRPE: originalTargetRPE,
      weekScalingApplied: false,
    }
  }
  
  // Parse original values
  const originalSets = typeof exercise.sets === 'number' ? exercise.sets : parseInt(String(exercise.sets)) || 3
  const originalTargetRPE = exercise.targetRPE || 8
  const originalRestPeriod = exercise.restPeriod || 90
  const originalHoldDuration = parseHoldDuration(rawRepsOrTime)
  
  // Apply scaling
  const scaledSets = Math.round(originalSets * scaling.volumeMultiplier)
  // [DOCTRINE-STRENGTHENING] RPE is scaled but ALSO capped by week's sessionIntensityCap
  const scaledTargetRPE = Math.min(
    scaling.sessionIntensityCap, // Week-based cap
    10, // Absolute max
    Math.round((originalTargetRPE * scaling.intensityMultiplier) * 10) / 10
  )
  const scaledRestPeriod = Math.round(originalRestPeriod * scaling.restMultiplier)
  
  // [PRESCRIPTION-TYPE-FIX] Scale hold durations for isometric exercises, preserve reps for rep-based
  let scaledReps = rawRepsOrTime
  let scaledHoldDuration: number | undefined
  
  if (originalHoldDuration !== null) {
    // Hold-based exercise: scale hold duration, keep format as "Xs hold"
    scaledHoldDuration = Math.round(originalHoldDuration * scaling.holdDurationMultiplier)
    scaledReps = formatHoldDuration(scaledHoldDuration)
  } else {
    // Rep-based exercise: scale rep range
    scaledReps = scaleRepRange(rawRepsOrTime, scaling.volumeMultiplier)
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
    originalReps: rawRepsOrTime,
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
    // [DOCTRINE-STRENGTHENING] Include week character for UI differentiation
    weekCharacter: {
      densityAllowed: scaling.densityAllowed,
      finishersAllowed: scaling.finishersAllowed,
      skillExposureLevel: scaling.skillExposureLevel,
      sessionIntensityCap: scaling.sessionIntensityCap,
      phaseLabel: scaling.phaseLabel,
    },
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
 * [PRESCRIPTION-TYPE-FIX] Output format matches builder: "Xs" (e.g., "20s")
 */
function formatHoldDuration(seconds: number): string {
  return `${seconds}s`
}

/**
 * Clean Rep Band Normalization
 * 
 * [DOCTRINE-CLEAN-BANDS] Volume scaling applies to SETS, not rep ranges.
 * Rep ranges should remain clean and doctrine-appropriate based on exercise intent.
 * This function normalizes any awkward ranges into clean coaching-credible bands.
 * 
 * Clean Band Families:
 * - Strength/Neural: 3-5, 4-6, 5-8
 * - Hybrid Strength-Hypertrophy: 6-8, 6-10, 8-10
 * - Hypertrophy: 8-12, 10-12, 10-15
 * - Endurance/Burnout: 12-15, 15-20
 */
function normalizeToCleanBand(reps: string, _multiplier: number): string {
  // Handle "XxY" format (e.g., "3x8") - preserve sets part, normalize reps
  const setRepMatch = reps.match(/(\d+)\s*x\s*(\d+)/i)
  if (setRepMatch) {
    const sets = parseInt(setRepMatch[1], 10)
    const repCount = parseInt(setRepMatch[2], 10)
    const cleanReps = normalizeRepCountToCleanBand(repCount)
    return `${sets}x${cleanReps}`
  }
  
  // Handle range format (e.g., "8-12")
  const rangeMatch = reps.match(/(\d+)\s*-\s*(\d+)/)
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10)
    const high = parseInt(rangeMatch[2], 10)
    return normalizeRangeToCleanBand(low, high)
  }
  
  // Handle single number - keep as clean single rep target
  const singleMatch = reps.match(/^(\d+)$/)
  if (singleMatch) {
    return singleMatch[1]
  }
  
  // Return unchanged if format not recognized (AMRAP, special formats)
  return reps
}

/**
 * Normalize a single rep count to the nearest clean band midpoint
 */
function normalizeRepCountToCleanBand(repCount: number): number {
  // Keep single rep targets clean - don't change them
  return repCount
}

/**
 * Normalize a rep range to the nearest clean doctrine-friendly band
 * 
 * [DOCTRINE-CLEAN-BANDS] Maps any range to clean coaching bands:
 * - Very low (1-4): 3-5 (neural/max strength)
 * - Low (5-7): 5-8 (strength)
 * - Moderate (8-10): 8-10 (hybrid)
 * - Standard hypertrophy (11-13): 8-12 (classic hypertrophy)
 * - Higher (14+): 10-15 (higher volume hypertrophy)
 */
function normalizeRangeToCleanBand(low: number, high: number): string {
  const mid = (low + high) / 2
  const span = high - low
  
  // If already a clean narrow band (span <= 4), keep it
  if (span <= 4) {
    return `${low}-${high}`
  }
  
  // Wide ugly ranges get normalized to clean bands based on midpoint
  if (mid <= 4) {
    return '3-5'
  } else if (mid <= 6) {
    return '4-6'
  } else if (mid <= 7) {
    return '5-8'
  } else if (mid <= 9) {
    return '6-10'
  } else if (mid <= 11) {
    return '8-12'
  } else if (mid <= 14) {
    return '10-15'
  } else {
    return '12-15'
  }
}

// Backward compatibility alias
function scaleRepRange(reps: string, multiplier: number): string {
  return normalizeToCleanBand(reps, multiplier)
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
 * [WEEK-PHASE-DOCTRINE-FIX] Percentages now show meaningful distinct values per week phase
 * instead of all collapsing to 100% after capping
 */
export function getWeekVolumeIndicator(weekNumber: number): { label: string; percentage: number; description: string } {
  const scaling = getWeekDosageScaling(weekNumber)
  
  // [DOCTRINE-FIX] Show percentages relative to PEAK week (Week 3 = 100%)
  // This makes the progression visible: 50% → 75% → 100% → 90%
  // Week 4 is consolidation (90%), not a full deload (75%)
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return { 
        label: 'Reduced', 
        percentage: 50, 
        description: 'Conservative entry volume for safe adaptation'
      }
    case 'ramp_up':
      return { 
        label: 'Building', 
        percentage: 75, 
        description: 'Progressing toward full training capacity'
      }
    case 'peak':
      return { 
        label: 'Full', 
        percentage: 100, 
        description: 'Maximum productive volume for this cycle'
      }
    case 'consolidation':
      return { 
        label: 'Maintained', 
        percentage: 90, 
        description: 'Preserving gains while managing fatigue'
      }
    default:
      return { label: 'Normal', percentage: 100, description: 'Standard training volume' }
  }
}

/**
 * [WEEK-PHASE-DOCTRINE-FIX] Get comprehensive week phase context for UI display
 * This replaces stale static explanations with dynamic week-aware content
 */
export interface WeekPhaseContext {
  weekNumber: number
  phaseLabel: string
  phaseName: string
  isProtectiveWeek: boolean
  coachingHeadline: string
  volumeDescription: string
  keyCharacteristics: string[]
  scalingReason: string
}

export function getWeekPhaseContext(weekNumber: number): WeekPhaseContext {
  const scaling = getWeekDosageScaling(weekNumber)
  const volumeIndicator = getWeekVolumeIndicator(weekNumber)
  
  switch (scaling.phaseLabel) {
    case 'acclimation':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Acclimation',
        isProtectiveWeek: true,
        coachingHeadline: 'Building your foundation with controlled exposure',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Conservative volume to prevent overload',
          'Extended rest between sets',
          'No high-density or finisher work',
          'Focus on movement quality'
        ],
        scalingReason: scaling.scalingReason
      }
    case 'ramp_up':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Ramp Up',
        isProtectiveWeek: false,
        coachingHeadline: 'Progressing toward full training capacity',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Increased volume from acclimation',
          'Normal rest periods',
          'Density work now permitted',
          'Building toward peak performance'
        ],
        scalingReason: scaling.scalingReason
      }
    case 'peak':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Peak',
        isProtectiveWeek: false,
        coachingHeadline: 'Maximum productive training volume',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Highest volume of the cycle',
          'Reduced rest for density',
          'Finishers and advanced work unlocked',
          'Full skill exposure'
        ],
        scalingReason: scaling.scalingReason
      }
    case 'consolidation':
      return {
        weekNumber,
        phaseLabel: scaling.phaseLabel,
        phaseName: 'Consolidation',
        isProtectiveWeek: false,
        coachingHeadline: 'Maintaining gains while managing fatigue',
        volumeDescription: volumeIndicator.description,
        keyCharacteristics: [
          'Reduced volume from peak',
          'No finishers - focus on core work',
          'Preserving adaptations',
          'Preparing for next cycle'
        ],
        scalingReason: scaling.scalingReason
      }
    default:
      return {
        weekNumber,
        phaseLabel: 'normal',
        phaseName: 'Normal',
        isProtectiveWeek: false,
        coachingHeadline: 'Standard training week',
        volumeDescription: 'Normal training volume',
        keyCharacteristics: ['Standard training parameters'],
        scalingReason: 'Normal training week'
      }
  }
}
