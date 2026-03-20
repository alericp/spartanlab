/**
 * Universal 1RM Calculator Helper
 * 
 * Centralized one-rep max estimation using the Epley formula.
 * This is the SINGLE source of truth for 1RM calculations across:
 * - Public SEO calculator pages
 * - AI engine load prescription
 * - Profile benchmarks
 * 
 * Formula: 1RM = weight × (1 + reps / 30)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface OneRepMaxInput {
  /** Weight lifted (lbs or kg) */
  weight: number
  /** Number of reps completed */
  reps: number
}

export interface WeightedExerciseInput extends OneRepMaxInput {
  /** Bodyweight for pull-ups/dips (added to weight for total system load) */
  bodyweight?: number
}

export interface OneRepMaxResult {
  /** Estimated 1RM (total system load for weighted exercises) */
  oneRepMax: number
  /** For weighted exercises: the added weight portion of 1RM */
  addedWeight1RM?: number
  /** Hypertrophy working weight (70% of 1RM) */
  hypertrophyLoad: number
  /** Strength working weight (80% of 1RM) */
  strengthLoad: number
  /** Heavy/peaking working weight (85% of 1RM) */
  heavyLoad: number
  /** Near-max working weight (90% of 1RM) */
  nearMaxLoad: number
  /** Relative strength as percentage of bodyweight (for weighted exercises) */
  relativeStrength?: number
}

export interface WorkingWeightTable {
  percentage: number
  label: string
  weight: number
}

export type LiftType = 
  | 'weighted_pull_up'
  | 'weighted_dip'
  | 'bench_press'
  | 'squat'
  | 'deadlift'

export interface LiftConfig {
  id: LiftType
  name: string
  slug: string
  requiresBodyweight: boolean
  description: string
  seoTitle: string
  seoDescription: string
  strengthStandards: {
    beginner: string
    intermediate: string
    advanced: string
    elite: string
  }
}

// =============================================================================
// LIFT CONFIGURATIONS (SEO + Display)
// =============================================================================

export const LIFT_CONFIGS: Record<LiftType, LiftConfig> = {
  weighted_pull_up: {
    id: 'weighted_pull_up',
    name: 'Weighted Pull-Up',
    slug: 'weighted-pull-up',
    requiresBodyweight: true,
    description: 'Calculate your weighted pull-up 1RM including bodyweight. Essential for tracking pulling strength and predicting skill readiness.',
    seoTitle: 'Weighted Pull-Up 1RM Calculator',
    seoDescription: 'Free weighted pull-up 1RM calculator. Estimate your one-rep max, get working weights for strength and hypertrophy, and track pulling progress.',
    strengthStandards: {
      beginner: '+0-20% BW',
      intermediate: '+20-50% BW',
      advanced: '+50-80% BW',
      elite: '+80%+ BW',
    },
  },
  weighted_dip: {
    id: 'weighted_dip',
    name: 'Weighted Dip',
    slug: 'weighted-dip',
    requiresBodyweight: true,
    description: 'Calculate your weighted dip 1RM including bodyweight. Track pushing strength for muscle-up and planche development.',
    seoTitle: 'Weighted Dip 1RM Calculator',
    seoDescription: 'Free weighted dip 1RM calculator. Estimate your one-rep max, calculate working weights, and benchmark your pushing strength.',
    strengthStandards: {
      beginner: '+0-25% BW',
      intermediate: '+25-60% BW',
      advanced: '+60-100% BW',
      elite: '+100%+ BW',
    },
  },
  bench_press: {
    id: 'bench_press',
    name: 'Bench Press',
    slug: 'bench-press',
    requiresBodyweight: false,
    description: 'Calculate your bench press 1RM. The classic upper body pushing benchmark for horizontal pressing strength.',
    seoTitle: 'Bench Press 1RM Calculator',
    seoDescription: 'Free bench press 1RM calculator using the Epley formula. Estimate your one-rep max and get recommended working weights for training.',
    strengthStandards: {
      beginner: '0.5-0.75x BW',
      intermediate: '0.75-1.25x BW',
      advanced: '1.25-1.75x BW',
      elite: '1.75x+ BW',
    },
  },
  squat: {
    id: 'squat',
    name: 'Squat',
    slug: 'squat',
    requiresBodyweight: false,
    description: 'Calculate your squat 1RM. The foundational lower body strength movement and key indicator of total body strength.',
    seoTitle: 'Squat 1RM Calculator',
    seoDescription: 'Free squat 1RM calculator. Estimate your one-rep max using proven formulas and get training percentages for strength programming.',
    strengthStandards: {
      beginner: '0.75-1x BW',
      intermediate: '1-1.5x BW',
      advanced: '1.5-2x BW',
      elite: '2x+ BW',
    },
  },
  deadlift: {
    id: 'deadlift',
    name: 'Deadlift',
    slug: 'deadlift',
    requiresBodyweight: false,
    description: 'Calculate your deadlift 1RM. The ultimate test of full-body strength and posterior chain development.',
    seoTitle: 'Deadlift 1RM Calculator',
    seoDescription: 'Free deadlift 1RM calculator. Estimate your one-rep max and calculate working weights for strength and hypertrophy training.',
    strengthStandards: {
      beginner: '1-1.25x BW',
      intermediate: '1.25-1.75x BW',
      advanced: '1.75-2.5x BW',
      elite: '2.5x+ BW',
    },
  },
}

// =============================================================================
// CORE CALCULATION (EPLEY FORMULA)
// =============================================================================

/**
 * Estimate 1RM using the Epley formula: 1RM = weight × (1 + reps / 30)
 * 
 * This is the SINGLE source of truth for 1RM calculations.
 * Use this function everywhere - do NOT duplicate the formula.
 */
export function estimateOneRepMax(input: OneRepMaxInput): number {
  const { weight, reps } = input
  
  // Direct 1RM test
  if (reps === 1) {
    return weight
  }
  
  // Epley formula
  const oneRM = weight * (1 + reps / 30)
  
  // Round to 1 decimal place
  return Math.round(oneRM * 10) / 10
}

/**
 * Calculate full 1RM result with working weights.
 * For weighted exercises (pull-ups, dips), include bodyweight in system load.
 */
export function calculateOneRepMaxResult(input: WeightedExerciseInput): OneRepMaxResult {
  const { weight, reps, bodyweight } = input
  
  // For weighted exercises, total system load = bodyweight + added weight
  const totalWeight = bodyweight ? bodyweight + weight : weight
  
  // Calculate 1RM using Epley formula
  const oneRepMax = estimateOneRepMax({ weight: totalWeight, reps })
  
  // Calculate working weights
  const hypertrophyLoad = Math.round(oneRepMax * 0.70)
  const strengthLoad = Math.round(oneRepMax * 0.80)
  const heavyLoad = Math.round(oneRepMax * 0.85)
  const nearMaxLoad = Math.round(oneRepMax * 0.90)
  
  const result: OneRepMaxResult = {
    oneRepMax,
    hypertrophyLoad,
    strengthLoad,
    heavyLoad,
    nearMaxLoad,
  }
  
  // For weighted exercises, calculate added weight and relative strength
  if (bodyweight) {
    result.addedWeight1RM = Math.round((oneRepMax - bodyweight) * 10) / 10
    result.relativeStrength = Math.round(((oneRepMax - bodyweight) / bodyweight) * 100)
  }
  
  return result
}

/**
 * Generate a full working weight table for training percentages.
 */
export function generateWorkingWeightTable(oneRepMax: number): WorkingWeightTable[] {
  return [
    { percentage: 50, label: 'Warm-up', weight: Math.round(oneRepMax * 0.50) },
    { percentage: 60, label: 'Light', weight: Math.round(oneRepMax * 0.60) },
    { percentage: 70, label: 'Hypertrophy', weight: Math.round(oneRepMax * 0.70) },
    { percentage: 75, label: 'Volume', weight: Math.round(oneRepMax * 0.75) },
    { percentage: 80, label: 'Strength', weight: Math.round(oneRepMax * 0.80) },
    { percentage: 85, label: 'Heavy', weight: Math.round(oneRepMax * 0.85) },
    { percentage: 90, label: 'Near-Max', weight: Math.round(oneRepMax * 0.90) },
    { percentage: 95, label: 'Peak', weight: Math.round(oneRepMax * 0.95) },
  ]
}

/**
 * Get strength level classification based on relative strength.
 * Used for weighted exercises (pull-ups, dips).
 */
export function getRelativeStrengthLevel(
  relativeStrength: number,
  liftType: LiftType
): { level: string; color: string } {
  const config = LIFT_CONFIGS[liftType]
  
  if (liftType === 'weighted_pull_up' || liftType === 'weighted_dip') {
    // Bodyweight-relative thresholds
    if (relativeStrength >= 80) return { level: 'Elite', color: 'text-[#E63946]' }
    if (relativeStrength >= 50) return { level: 'Advanced', color: 'text-orange-400' }
    if (relativeStrength >= 25) return { level: 'Intermediate', color: 'text-yellow-400' }
    return { level: 'Beginner', color: 'text-[#6B7280]' }
  }
  
  // For barbell lifts - would need bodyweight for accurate classification
  // Return generic levels
  return { level: 'Calculated', color: 'text-[#A5A5A5]' }
}

/**
 * Get lift config from slug (for dynamic routing)
 */
export function getLiftConfigFromSlug(slug: string): LiftConfig | null {
  const entry = Object.entries(LIFT_CONFIGS).find(([_, config]) => config.slug === slug)
  return entry ? entry[1] : null
}

/**
 * Get all lift slugs for static generation
 */
export function getAllLiftSlugs(): string[] {
  return Object.values(LIFT_CONFIGS).map(config => config.slug)
}
