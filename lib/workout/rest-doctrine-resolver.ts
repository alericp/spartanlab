/**
 * Rest Doctrine Resolver
 * 
 * =============================================================================
 * PHASE NEXT - DOCTRINE-AWARE REST RECOMMENDATIONS
 * =============================================================================
 * 
 * This module provides intelligent rest time recommendations based on:
 * - Exercise category and movement type
 * - Intensity target (RPE)
 * - Actual RPE from previous set
 * - Grouped method type (superset/circuit/cluster)
 * - Hold vs rep execution
 * - Exercise characteristics (straight-arm, high neural demand, etc.)
 * 
 * All logic is deterministic - no AI guessing.
 */

import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { GroupType } from './execution-unit-contract'

// =============================================================================
// REST CONTEXT
// =============================================================================

export type RestType =
  | 'between_sets'
  | 'between_grouped_members'
  | 'between_grouped_rounds'
  | 'between_exercises'

export interface RestContext {
  restType: RestType
  exerciseCategory: string
  exerciseName: string
  targetRPE: number
  actualRPE: number | null
  isHoldBased: boolean
  groupType: GroupType
  nextExerciseCategory?: string
  nextExerciseName?: string
  // Explicit rest override from exercise data
  explicitRestSeconds?: number
}

export interface RestRecommendation {
  seconds: number
  reason: string
  isExtended: boolean // True if rest was extended due to high RPE
  minSeconds: number
  maxSeconds: number
}

// =============================================================================
// CATEGORY CHARACTERISTICS
// =============================================================================

interface CategoryTraits {
  baseRest: number
  highIntensityRest: number
  isStraightArm: boolean
  isHighNeural: boolean
  isSkillBased: boolean
  isConditioning: boolean
}

const CATEGORY_TRAITS: Record<string, CategoryTraits> = {
  // Skill movements - need focus recovery
  skill: {
    baseRest: 90,
    highIntensityRest: 120,
    isStraightArm: false,
    isHighNeural: true,
    isSkillBased: true,
    isConditioning: false,
  },
  // Push movements
  push: {
    baseRest: 90,
    highIntensityRest: 150,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: false,
  },
  // Pull movements
  pull: {
    baseRest: 90,
    highIntensityRest: 150,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: false,
  },
  // Core work
  core: {
    baseRest: 60,
    highIntensityRest: 90,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: false,
  },
  // Leg movements
  legs: {
    baseRest: 90,
    highIntensityRest: 180,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: false,
  },
  // Mobility/flexibility
  mobility: {
    baseRest: 30,
    highIntensityRest: 45,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: false,
  },
  // Conditioning/cardio
  conditioning: {
    baseRest: 45,
    highIntensityRest: 60,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: true,
  },
  // Default fallback
  general: {
    baseRest: 90,
    highIntensityRest: 120,
    isStraightArm: false,
    isHighNeural: false,
    isSkillBased: false,
    isConditioning: false,
  },
}

// Exercises with straight-arm holds (higher tendon demand)
const STRAIGHT_ARM_EXERCISES = [
  'planche',
  'front lever',
  'back lever',
  'iron cross',
  'maltese',
  'victorian',
  'l-sit',
  'manna',
  'straddle planche',
  'full planche',
  'tuck planche',
  'advanced tuck planche',
  'straddle front lever',
  'full front lever',
  'tuck front lever',
]

// High neural demand exercises
const HIGH_NEURAL_EXERCISES = [
  'muscle up',
  'muscle-up',
  'one arm pull',
  'one arm chin',
  'human flag',
  'handstand push',
  'hspu',
  'pistol squat',
  'dragon flag',
  'back flip',
  'front flip',
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getTraits(category: string): CategoryTraits {
  const lower = category.toLowerCase()
  return CATEGORY_TRAITS[lower] || CATEGORY_TRAITS.general
}

function isStraightArmExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return STRAIGHT_ARM_EXERCISES.some(ex => lower.includes(ex))
}

function isHighNeuralExercise(name: string): boolean {
  const lower = name.toLowerCase()
  return HIGH_NEURAL_EXERCISES.some(ex => lower.includes(ex))
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve recommended rest time based on exercise context.
 * Returns doctrine-aligned rest recommendation.
 */
export function resolveRestTime(context: RestContext): RestRecommendation {
  const {
    restType,
    exerciseCategory,
    exerciseName,
    targetRPE,
    actualRPE,
    isHoldBased,
    groupType,
    nextExerciseCategory,
    explicitRestSeconds,
  } = context
  
  // If explicit rest is set, use it as base
  if (explicitRestSeconds && explicitRestSeconds > 0) {
    return {
      seconds: explicitRestSeconds,
      reason: 'Prescribed rest time',
      isExtended: false,
      minSeconds: Math.max(30, explicitRestSeconds - 30),
      maxSeconds: explicitRestSeconds + 60,
    }
  }
  
  const traits = getTraits(exerciseCategory)
  const isStraightArm = isStraightArmExercise(exerciseName)
  const isHighNeural = isHighNeuralExercise(exerciseName) || traits.isHighNeural
  
  let baseRest = traits.baseRest
  let reason = 'Standard rest'
  let isExtended = false
  
  // ==========================================================================
  // STEP 1: Base rest by category and exercise type
  // ==========================================================================
  
  if (isStraightArm) {
    // Straight-arm work needs longer recovery for tendons
    baseRest = Math.max(baseRest, 120)
    reason = 'Extended for tendon recovery (straight-arm)'
  }
  
  if (isHighNeural && !isStraightArm) {
    // High neural demand needs focus recovery
    baseRest = Math.max(baseRest, 90)
    reason = 'Neural recovery time'
  }
  
  if (isHoldBased) {
    // Hold exercises need slightly longer recovery
    baseRest = Math.max(baseRest, baseRest + 15)
    reason = reason === 'Standard rest' ? 'Hold exercise recovery' : reason
  }
  
  // ==========================================================================
  // STEP 2: Adjust for target intensity
  // ==========================================================================
  
  if (targetRPE >= 9) {
    // Very high intensity - use high intensity rest
    baseRest = traits.highIntensityRest
    reason = 'High intensity recovery'
  } else if (targetRPE >= 8) {
    // High intensity - increase by 30%
    baseRest = Math.round(baseRest * 1.3)
    reason = 'Moderate-high intensity'
  }
  
  // ==========================================================================
  // STEP 3: Adjust for actual RPE (if available)
  // ==========================================================================
  
  if (actualRPE !== null) {
    if (actualRPE >= 10) {
      // Maximal effort - extend rest significantly
      baseRest = Math.max(baseRest, traits.highIntensityRest + 30)
      reason = 'Recovery from maximal effort'
      isExtended = true
    } else if (actualRPE >= 9 && actualRPE > targetRPE) {
      // Exceeded target significantly
      baseRest = Math.round(baseRest * 1.2)
      reason = 'Extended due to high RPE'
      isExtended = true
    } else if (actualRPE <= 6 && targetRPE >= 8) {
      // Under-performed - might be fatigued, keep standard rest
      // Don't reduce rest when RPE is lower than expected
    }
  }
  
  // ==========================================================================
  // STEP 4: Adjust for rest type
  // ==========================================================================
  
  switch (restType) {
    case 'between_grouped_members':
      // Minimal or no rest between superset/circuit members
      if (groupType === 'superset') {
        baseRest = 0
        reason = 'Superset - no rest between exercises'
      } else if (groupType === 'circuit') {
        baseRest = Math.min(baseRest, 15)
        reason = 'Circuit - quick transition'
      } else if (groupType === 'cluster') {
        baseRest = Math.min(baseRest, 20)
        reason = 'Cluster - short intra-set rest'
      }
      break
      
    case 'between_grouped_rounds':
      // Full recovery between rounds
      if (groupType === 'superset') {
        baseRest = Math.max(baseRest, 90)
        reason = 'Superset round recovery'
      } else if (groupType === 'circuit') {
        baseRest = Math.max(baseRest, 60)
        reason = 'Circuit round recovery'
      }
      break
      
    case 'between_exercises':
      // Transition to different exercise
      if (nextExerciseCategory) {
        const nextTraits = getTraits(nextExerciseCategory)
        // If next exercise is skill-based, allow more recovery
        if (nextTraits.isSkillBased) {
          baseRest = Math.max(baseRest, 90)
          reason = 'Recovery before skill work'
        }
        // If moving from conditioning to strength, extend rest
        if (traits.isConditioning && !nextTraits.isConditioning) {
          baseRest = Math.max(baseRest, 120)
          reason = 'Transition from conditioning'
        }
      }
      break
      
    case 'between_sets':
    default:
      // Standard between-set rest (already calculated)
      break
  }
  
  // ==========================================================================
  // STEP 5: Apply bounds
  // ==========================================================================
  
  const minSeconds = Math.max(0, baseRest - 30)
  const maxSeconds = Math.min(300, baseRest + 60) // Cap at 5 minutes
  
  // Round to nearest 15 seconds for cleaner display
  const roundedRest = Math.round(baseRest / 15) * 15
  
  return {
    seconds: Math.max(0, roundedRest),
    reason,
    isExtended,
    minSeconds,
    maxSeconds,
  }
}

// =============================================================================
// QUICK REST PRESETS
// =============================================================================

export const REST_PRESETS = {
  minimal: 30,
  short: 60,
  standard: 90,
  extended: 120,
  full: 180,
  maximal: 240,
} as const

/**
 * Get a quick rest preset adjustment.
 */
export function applyRestAdjustment(
  currentSeconds: number,
  adjustment: 'add30' | 'subtract30' | 'preset',
  presetKey?: keyof typeof REST_PRESETS
): number {
  if (adjustment === 'add30') {
    return Math.min(300, currentSeconds + 30)
  }
  if (adjustment === 'subtract30') {
    return Math.max(0, currentSeconds - 30)
  }
  if (adjustment === 'preset' && presetKey) {
    return REST_PRESETS[presetKey]
  }
  return currentSeconds
}
