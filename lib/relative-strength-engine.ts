// Relative Strength Engine
// Calculates bodyweight-relative strength metrics for calisthenics athletes

import type { ExerciseType, StrengthRecord } from './strength-service'

// =============================================================================
// TYPES
// =============================================================================

export type RelativeStrengthTier = 
  | 'novice' 
  | 'developing' 
  | 'strong' 
  | 'advanced' 
  | 'elite'

export interface RelativeStrengthMetrics {
  exercise: ExerciseType
  // Raw metrics
  weightAdded: number
  reps: number
  estimatedOneRM: number
  // Relative metrics (requires bodyweight)
  addedWeightRatio: number | null  // weightAdded / bodyweight
  totalLoadRatio: number | null    // (bodyweight + weightAdded) / bodyweight
  oneRMRatio: number | null        // estimatedOneRM / bodyweight
  // Tier classification
  tier: RelativeStrengthTier | null
  tierLabel: string
  // Context
  bodyweight: number | null
  hasBodyweight: boolean
}

export interface TierThresholds {
  novice: number
  developing: number
  strong: number
  advanced: number
  elite: number
}

// =============================================================================
// TIER THRESHOLDS (1RM ratio = estimatedOneRM / bodyweight)
// These are for added weight only, not total system load
// =============================================================================

const TIER_THRESHOLDS: Record<ExerciseType, TierThresholds> = {
  weighted_pull_up: {
    novice: 0.10,      // +10% BW
    developing: 0.25,  // +25% BW
    strong: 0.45,      // +45% BW
    advanced: 0.65,    // +65% BW
    elite: 0.85,       // +85% BW
  },
  weighted_dip: {
    novice: 0.15,      // +15% BW
    developing: 0.35,  // +35% BW
    strong: 0.55,      // +55% BW
    advanced: 0.75,    // +75% BW
    elite: 1.00,       // +100% BW
  },
  weighted_muscle_up: {
    novice: 0.05,      // +5% BW
    developing: 0.15,  // +15% BW
    strong: 0.30,      // +30% BW
    advanced: 0.45,    // +45% BW
    elite: 0.60,       // +60% BW
  },
}

const TIER_LABELS: Record<RelativeStrengthTier, string> = {
  novice: 'Novice',
  developing: 'Developing',
  strong: 'Strong',
  advanced: 'Advanced',
  elite: 'Elite',
}

// =============================================================================
// CORE CALCULATIONS
// =============================================================================

/**
 * Calculate relative strength tier based on 1RM ratio
 */
export function calculateRelativeStrengthTier(
  exercise: ExerciseType,
  oneRMRatio: number
): RelativeStrengthTier {
  const thresholds = TIER_THRESHOLDS[exercise]
  
  if (oneRMRatio >= thresholds.elite) return 'elite'
  if (oneRMRatio >= thresholds.advanced) return 'advanced'
  if (oneRMRatio >= thresholds.strong) return 'strong'
  if (oneRMRatio >= thresholds.developing) return 'developing'
  return 'novice'
}

/**
 * Get tier label for display
 */
export function getTierLabel(tier: RelativeStrengthTier | null): string {
  if (!tier) return 'Unknown'
  return TIER_LABELS[tier]
}

/**
 * Calculate all relative strength metrics for a record
 */
export function calculateRelativeStrengthMetrics(
  record: StrengthRecord,
  bodyweight: number | null
): RelativeStrengthMetrics {
  const hasBodyweight = bodyweight !== null && bodyweight > 0
  
  let addedWeightRatio: number | null = null
  let totalLoadRatio: number | null = null
  let oneRMRatio: number | null = null
  let tier: RelativeStrengthTier | null = null
  
  if (hasBodyweight && bodyweight) {
    addedWeightRatio = record.weightAdded / bodyweight
    totalLoadRatio = (bodyweight + record.weightAdded) / bodyweight
    oneRMRatio = record.estimatedOneRM / bodyweight
    tier = calculateRelativeStrengthTier(record.exercise, oneRMRatio)
  }
  
  return {
    exercise: record.exercise,
    weightAdded: record.weightAdded,
    reps: record.reps,
    estimatedOneRM: record.estimatedOneRM,
    addedWeightRatio,
    totalLoadRatio,
    oneRMRatio,
    tier,
    tierLabel: getTierLabel(tier),
    bodyweight,
    hasBodyweight,
  }
}

/**
 * Get tier thresholds for an exercise (for display)
 */
export function getTierThresholds(exercise: ExerciseType): TierThresholds {
  return TIER_THRESHOLDS[exercise]
}

/**
 * Get next tier info for progress display
 */
export function getNextTierInfo(
  exercise: ExerciseType,
  currentTier: RelativeStrengthTier | null,
  currentRatio: number | null,
  bodyweight: number | null
): { nextTier: RelativeStrengthTier | null; gapRatio: number | null; gapWeight: number | null } {
  if (!currentTier || currentRatio === null || !bodyweight) {
    return { nextTier: null, gapRatio: null, gapWeight: null }
  }
  
  const thresholds = TIER_THRESHOLDS[exercise]
  const tierOrder: RelativeStrengthTier[] = ['novice', 'developing', 'strong', 'advanced', 'elite']
  const currentIndex = tierOrder.indexOf(currentTier)
  
  if (currentIndex >= tierOrder.length - 1) {
    // Already elite
    return { nextTier: null, gapRatio: null, gapWeight: null }
  }
  
  const nextTier = tierOrder[currentIndex + 1]
  const nextThreshold = thresholds[nextTier]
  const gapRatio = nextThreshold - currentRatio
  const gapWeight = gapRatio * bodyweight
  
  return { nextTier, gapRatio, gapWeight: Math.ceil(gapWeight) }
}

// =============================================================================
// EXERCISE-SPECIFIC DISPLAY INFO
// =============================================================================

export interface ExerciseRelativeInfo {
  name: string
  supportedSkills: string[]
  tipForImprovement: string
}

export const EXERCISE_RELATIVE_INFO: Record<ExerciseType, ExerciseRelativeInfo> = {
  weighted_pull_up: {
    name: 'Weighted Pull-Up',
    supportedSkills: ['Front Lever', 'Muscle-Up'],
    tipForImprovement: 'Focus on controlled negatives and building volume at current weight before progressing.',
  },
  weighted_dip: {
    name: 'Weighted Dip',
    supportedSkills: ['Planche', 'HSPU', 'Muscle-Up'],
    tipForImprovement: 'Develop lockout strength and lean forward slightly for better planche carryover.',
  },
  weighted_muscle_up: {
    name: 'Weighted Muscle-Up',
    supportedSkills: ['Muscle-Up'],
    tipForImprovement: 'Build explosive pull strength and practice the transition at lower weights first.',
  },
}

/**
 * Format ratio as percentage string
 */
export function formatRatio(ratio: number | null): string {
  if (ratio === null) return '—'
  return `${(ratio * 100).toFixed(0)}%`
}

/**
 * Format ratio as "x BW" string
 */
export function formatRatioAsBW(ratio: number | null): string {
  if (ratio === null) return '—'
  return `${ratio.toFixed(2)}x BW`
}
