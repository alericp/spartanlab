/**
 * Weighted Load Estimation Engine
 * 
 * Converts user's weighted exercise benchmarks into actionable load prescriptions.
 * Uses the Epley formula for 1RM estimation and applies role-based intensity bands.
 * 
 * ENGINE PIPELINE STAGE: Exercise Prescription (Load)
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Weighted benchmark data from user profile
 */
export interface WeightedBenchmark {
  addedWeight: number
  reps: number
  unit?: 'lbs' | 'kg'
}

/**
 * All-time PR benchmark with timeframe context
 */
export interface WeightedPRBenchmark {
  load: number
  reps: number
  unit: 'lbs' | 'kg'
  timeframe?: string
}

/**
 * Prescribed load for a weighted exercise - stored in program snapshot
 */
export interface PrescribedLoad {
  /** The actual weight to add (e.g., 25 for +25 lbs) */
  weight: number
  /** Unit of measurement */
  unit: 'lbs' | 'kg'
  /** How this load was derived */
  basis: 'current_benchmark' | 'pr_benchmark' | 'estimated' | 'bodyweight_only'
  /** Target percentage of estimated 1RM used */
  targetPercentage?: number
  /** Estimated 1RM used for calculation */
  estimated1RM?: number
  /** Confidence in this prescription */
  confidence: 'high' | 'medium' | 'low'
  /** Human-readable explanation */
  rationale: string
}

/**
 * Weighted exercise prescription role
 * Determines intensity band and rep scheme
 */
export type WeightedPrescriptionRole =
  | 'strength_primary'    // Heavy, low-rep (3-5) for max strength
  | 'strength_secondary'  // Moderate-heavy (5-8) for strength support
  | 'hypertrophy_support' // Moderate load (8-12) for muscle building
  | 'volume_accumulation' // Light-moderate (10-15) for volume

// =============================================================================
// INTENSITY BANDS
// =============================================================================

/**
 * Intensity bands for weighted exercises by role
 * Expressed as percentage of estimated 1RM
 */
const WEIGHTED_INTENSITY_BANDS: Record<WeightedPrescriptionRole, {
  percentage: [number, number]
  repRange: [number, number]
  rpe: number
}> = {
  strength_primary: {
    percentage: [80, 90],
    repRange: [3, 5],
    rpe: 8,
  },
  strength_secondary: {
    percentage: [70, 80],
    repRange: [5, 8],
    rpe: 7,
  },
  hypertrophy_support: {
    percentage: [60, 70],
    repRange: [8, 12],
    rpe: 7,
  },
  volume_accumulation: {
    percentage: [50, 60],
    repRange: [10, 15],
    rpe: 6,
  },
}

// =============================================================================
// CORE ESTIMATION FUNCTIONS
// =============================================================================

/**
 * Estimate 1RM from a weight and rep combination.
 * 
 * FORMULA: Epley Formula
 * 1RM = weight × (1 + reps/30)
 * 
 * This is a well-established formula that works well for rep ranges 1-15.
 * For calisthenics with added weight, the "weight" is bodyweight + added weight,
 * but we calculate relative to added weight for prescription purposes.
 * 
 * @param addedWeight The weight added beyond bodyweight
 * @param reps Number of reps achieved
 * @returns Estimated 1RM of added weight
 */
export function estimateWeighted1RM(addedWeight: number, reps: number): number {
  if (reps <= 0 || addedWeight <= 0) return 0
  if (reps === 1) return addedWeight
  
  // Epley formula: 1RM = weight × (1 + reps/30)
  const estimated1RM = addedWeight * (1 + reps / 30)
  
  return Math.round(estimated1RM * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate working weight from 1RM and target percentage.
 * Rounds to practical increments (2.5 lbs or 1 kg).
 */
export function calculateWorkingWeight(
  estimated1RM: number,
  targetPercentage: number,
  unit: 'lbs' | 'kg' = 'lbs'
): number {
  const rawWeight = estimated1RM * (targetPercentage / 100)
  
  // Round to practical increments
  const increment = unit === 'lbs' ? 2.5 : 1
  return Math.round(rawWeight / increment) * increment
}

// =============================================================================
// MAIN PRESCRIPTION RESOLVER
// =============================================================================

/**
 * Resolve prescribed load for a weighted exercise.
 * 
 * This is the main entry point for weighted load estimation.
 * 
 * Priority order:
 * 1. Current benchmark (most accurate for today's prescription)
 * 2. All-time PR (used as context/ceiling, with derating for time away)
 * 3. No load (bodyweight only with guidance)
 * 
 * @param exerciseType The weighted exercise type
 * @param currentBenchmark User's current benchmark for this exercise
 * @param prBenchmark User's all-time PR for this exercise (optional)
 * @param role The prescription role (determines intensity band)
 * @returns PrescribedLoad with weight, unit, and rationale
 */
export function resolveWeightedLoadPrescription(
  exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up',
  currentBenchmark: WeightedBenchmark | null | undefined,
  prBenchmark: WeightedPRBenchmark | null | undefined,
  role: WeightedPrescriptionRole = 'strength_secondary'
): PrescribedLoad {
  const band = WEIGHTED_INTENSITY_BANDS[role]
  const midPercentage = (band.percentage[0] + band.percentage[1]) / 2
  const exerciseLabel = exerciseType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  // CASE 1: Have current benchmark - use it directly
  if (currentBenchmark && currentBenchmark.addedWeight > 0 && currentBenchmark.reps > 0) {
    const estimated1RM = estimateWeighted1RM(currentBenchmark.addedWeight, currentBenchmark.reps)
    const workingWeight = calculateWorkingWeight(estimated1RM, midPercentage, currentBenchmark.unit || 'lbs')
    
    // Ensure working weight is not higher than current benchmark weight
    const safeWeight = Math.min(workingWeight, currentBenchmark.addedWeight)
    
    // Dev-safe logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WeightedLoad] Resolved from current benchmark:', {
        exercise: exerciseType,
        currentBenchmark: `${currentBenchmark.addedWeight} x ${currentBenchmark.reps}`,
        estimated1RM,
        targetPercentage: midPercentage,
        workingWeight: safeWeight,
        role,
      })
    }
    
    return {
      weight: safeWeight,
      unit: currentBenchmark.unit || 'lbs',
      basis: 'current_benchmark',
      targetPercentage: midPercentage,
      estimated1RM,
      confidence: 'high',
      rationale: `Based on your current ${exerciseLabel} of +${currentBenchmark.addedWeight}${currentBenchmark.unit || 'lbs'} x ${currentBenchmark.reps}`,
    }
  }
  
  // CASE 2: Have PR benchmark but no current - use with caution
  if (prBenchmark && prBenchmark.load > 0 && prBenchmark.reps > 0) {
    const estimated1RM = estimateWeighted1RM(prBenchmark.load, prBenchmark.reps)
    
    // Derate by 15-25% for PR that may be stale
    const derateFactor = prBenchmark.timeframe === 'within_1_year' ? 0.85 : 0.75
    const deratedLoad = estimated1RM * derateFactor
    const workingWeight = calculateWorkingWeight(deratedLoad, midPercentage, prBenchmark.unit)
    
    // Dev-safe logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[WeightedLoad] Resolved from PR benchmark (derated):', {
        exercise: exerciseType,
        prBenchmark: `${prBenchmark.load} x ${prBenchmark.reps}`,
        timeframe: prBenchmark.timeframe,
        derateFactor,
        workingWeight,
        role,
      })
    }
    
    return {
      weight: workingWeight,
      unit: prBenchmark.unit,
      basis: 'pr_benchmark',
      targetPercentage: midPercentage * derateFactor,
      estimated1RM: deratedLoad,
      confidence: 'medium',
      rationale: `Estimated from your PR of +${prBenchmark.load}${prBenchmark.unit} x ${prBenchmark.reps} (conservative start)`,
    }
  }
  
  // CASE 3: No benchmark data - cannot prescribe specific load
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WeightedLoad] No benchmark data for:', exerciseType)
  }
  
  return {
    weight: 0,
    unit: 'lbs',
    basis: 'bodyweight_only',
    confidence: 'low',
    rationale: 'Add benchmark data in settings for personalized load recommendations',
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format prescribed load for display.
 * Returns a string like "+25 lbs" or empty string for bodyweight-only.
 */
export function formatPrescribedLoad(load: PrescribedLoad | null | undefined): string {
  if (!load || load.weight === 0 || load.basis === 'bodyweight_only') {
    return '' // No load to display
  }
  
  const sign = load.weight > 0 ? '+' : ''
  return `${sign}${load.weight} ${load.unit}`
}

/**
 * Check if an exercise is a weighted movement that can have a prescribed load.
 */
export function isWeightedExercise(exerciseName: string): boolean {
  const normalizedName = exerciseName.toLowerCase().replace(/[\s-]+/g, '_')
  const weightedPatterns = [
    'weighted_pull',
    'weighted_dip',
    'weighted_push',
  ]
  return weightedPatterns.some(pattern => normalizedName.includes(pattern))
}

/**
 * Get the weighted exercise type from exercise name.
 */
export function getWeightedExerciseType(
  exerciseName: string
): 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | null {
  const normalizedName = exerciseName.toLowerCase()
  
  if (normalizedName.includes('pull')) return 'weighted_pull_up'
  if (normalizedName.includes('dip')) return 'weighted_dip'
  if (normalizedName.includes('push')) return 'weighted_push_up'
  
  return null
}

/**
 * Determine the prescription role for a weighted exercise based on context.
 */
export function determineWeightedRole(
  exerciseCategory: string,
  isPrimarySupport: boolean,
  goalType: string
): WeightedPrescriptionRole {
  // Primary support work for strength goals = heavier
  if (isPrimarySupport && (goalType.includes('strength') || goalType.includes('muscle_up'))) {
    return 'strength_primary'
  }
  
  // Primary support for skill goals = moderate-heavy
  if (isPrimarySupport) {
    return 'strength_secondary'
  }
  
  // Accessory/support category = hypertrophy
  if (exerciseCategory === 'accessory' || exerciseCategory === 'support') {
    return 'hypertrophy_support'
  }
  
  // Default to secondary strength
  return 'strength_secondary'
}

/**
 * Get rep range for a weighted prescription role.
 */
export function getWeightedRepRange(role: WeightedPrescriptionRole): [number, number] {
  return WEIGHTED_INTENSITY_BANDS[role].repRange
}

/**
 * Get RPE target for a weighted prescription role.
 */
export function getWeightedRPE(role: WeightedPrescriptionRole): number {
  return WEIGHTED_INTENSITY_BANDS[role].rpe
}
