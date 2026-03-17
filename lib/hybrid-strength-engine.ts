/**
 * SpartanLab Hybrid Strength Engine
 * 
 * Foundation layer for integrating barbell work (primarily deadlift) into
 * calisthenics-first programming. Supports streetlifting-style hybrid training.
 * 
 * PHILOSOPHY:
 * - Calisthenics remains the PRIMARY training modality
 * - Deadlift is a SUPPORTING element for posterior chain strength
 * - Streetlifting elements (weighted pull-up, weighted dip, deadlift) are optional
 * - All hybrid features are OPT-IN and equipment-gated
 * 
 * This engine handles:
 * - Deadlift eligibility checks
 * - Fatigue conflict detection
 * - Recovery overlap management
 * - Hybrid programming rules
 * - Explanation generation for hybrid decisions
 */

import {
  type HybridStrengthModality,
  type HybridStrengthProfile,
  type DeadliftExperienceLevel,
  type JointCaution,
  type EquipmentType,
  isHybridStrengthEnabled,
  shouldIncludeDeadlift,
  getDefaultHybridStrengthProfile,
} from './athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Deadlift placement recommendation within weekly programming
 */
export type DeadliftPlacement = {
  recommended: boolean
  dayOfWeek: number | null      // 1-7 (Monday-Sunday), null if not recommended
  reason: string
  conflictingExercises: string[]
  frequencyPerWeek: 1 | 2       // Almost always 1 for hybrid programs
}

/**
 * Fatigue conflict between deadlift and calisthenics work
 */
export interface FatigueConflict {
  exerciseId: string
  exerciseName: string
  conflictType: 'neural' | 'posterior_chain' | 'grip' | 'spinal_loading'
  severity: 'low' | 'moderate' | 'high'
  recommendation: string
  minimumDaysBetween: number
}

/**
 * Hybrid programming context for session assembly
 */
export interface HybridProgrammingContext {
  isHybridEnabled: boolean
  modality: HybridStrengthModality
  deadliftEligible: boolean
  deadliftReason: string
  conflicts: FatigueConflict[]
  weeklyDeadliftBudget: number  // 0, 1, or 2 sessions per week
  shouldReducePullVolume: boolean
  shouldReduceHingeAccessories: boolean
  explanationSummary: string
}

/**
 * Hybrid decision explanation for coach messaging
 */
export interface HybridExplanation {
  title: string
  body: string
  bulletPoints: string[]
}

// =============================================================================
// FATIGUE CONFLICT DEFINITIONS
// =============================================================================

/**
 * Exercises that conflict with deadlift due to overlapping stress
 */
export const DEADLIFT_CONFLICT_MAP: Record<string, FatigueConflict> = {
  // Front lever conflicts (posterior chain + spinal loading)
  'tuck_fl': {
    exerciseId: 'tuck_fl',
    exerciseName: 'Tuck Front Lever',
    conflictType: 'posterior_chain',
    severity: 'moderate',
    recommendation: 'Place 48+ hours apart. Reduce front lever volume on deadlift days.',
    minimumDaysBetween: 2,
  },
  'adv_tuck_fl': {
    exerciseId: 'adv_tuck_fl',
    exerciseName: 'Advanced Tuck Front Lever',
    conflictType: 'posterior_chain',
    severity: 'high',
    recommendation: 'Place 72+ hours apart. Avoid on same day.',
    minimumDaysBetween: 3,
  },
  'one_leg_fl': {
    exerciseId: 'one_leg_fl',
    exerciseName: 'One Leg Front Lever',
    conflictType: 'posterior_chain',
    severity: 'high',
    recommendation: 'Place 72+ hours apart. High spinal loading overlap.',
    minimumDaysBetween: 3,
  },
  'straddle_fl': {
    exerciseId: 'straddle_fl',
    exerciseName: 'Straddle Front Lever',
    conflictType: 'posterior_chain',
    severity: 'high',
    recommendation: 'Avoid same week if training heavy deadlifts.',
    minimumDaysBetween: 3,
  },
  'full_fl': {
    exerciseId: 'full_fl',
    exerciseName: 'Full Front Lever',
    conflictType: 'posterior_chain',
    severity: 'high',
    recommendation: 'Major spinal/posterior overlap. Space carefully.',
    minimumDaysBetween: 4,
  },
  
  // Weighted pull-up conflicts (neural + grip)
  'weighted_pull_up': {
    exerciseId: 'weighted_pull_up',
    exerciseName: 'Weighted Pull-Up',
    conflictType: 'neural',
    severity: 'moderate',
    recommendation: 'Both are max-effort neural work. Space 48+ hours apart.',
    minimumDaysBetween: 2,
  },
  
  // Back lever conflicts
  'tuck_bl': {
    exerciseId: 'tuck_bl',
    exerciseName: 'Tuck Back Lever',
    conflictType: 'spinal_loading',
    severity: 'moderate',
    recommendation: 'Spinal loading overlap. Place 48+ hours apart.',
    minimumDaysBetween: 2,
  },
  'adv_tuck_bl': {
    exerciseId: 'adv_tuck_bl',
    exerciseName: 'Advanced Tuck Back Lever',
    conflictType: 'spinal_loading',
    severity: 'high',
    recommendation: 'Heavy spinal stress. Avoid same day.',
    minimumDaysBetween: 3,
  },
  
  // Row variations (grip fatigue)
  'barbell_row': {
    exerciseId: 'barbell_row',
    exerciseName: 'Barbell Row',
    conflictType: 'grip',
    severity: 'moderate',
    recommendation: 'Grip fatigue overlap. Can superset if desired.',
    minimumDaysBetween: 1,
  },
  
  // Hip hinge accessories
  'romanian_deadlift': {
    exerciseId: 'romanian_deadlift',
    exerciseName: 'Romanian Deadlift',
    conflictType: 'posterior_chain',
    severity: 'moderate',
    recommendation: 'Redundant on deadlift days. Skip or swap to hip thrust.',
    minimumDaysBetween: 2,
  },
  'good_morning': {
    exerciseId: 'good_morning',
    exerciseName: 'Good Morning',
    conflictType: 'spinal_loading',
    severity: 'high',
    recommendation: 'Too much spinal loading. Avoid same day as deadlift.',
    minimumDaysBetween: 3,
  },
}

// =============================================================================
// ELIGIBILITY LOGIC
// =============================================================================

/**
 * Build full hybrid programming context from profile and equipment
 */
export function buildHybridProgrammingContext(
  hybridProfile: HybridStrengthProfile | null | undefined,
  equipment: EquipmentType[],
  jointCautions: JointCaution[],
  trainingDaysPerWeek: number,
  primaryGoal: string
): HybridProgrammingContext {
  // Default: calisthenics-only, no hybrid features
  const profile = hybridProfile || getDefaultHybridStrengthProfile()
  
  const isEnabled = isHybridStrengthEnabled(profile, equipment)
  const deadliftCheck = shouldIncludeDeadlift(profile, equipment, jointCautions)
  
  // Determine weekly deadlift budget based on modality and training days
  let weeklyDeadliftBudget = 0
  if (deadliftCheck.eligible) {
    if (profile.modality === 'hybrid_light') {
      weeklyDeadliftBudget = 1
    } else if (profile.modality === 'streetlifting_biased') {
      weeklyDeadliftBudget = trainingDaysPerWeek >= 4 ? 2 : 1
    }
  }
  
  // Determine if we should reduce pull/hinge volume
  const shouldReducePullVolume = profile.modality === 'streetlifting_biased' && deadliftCheck.eligible
  const shouldReduceHingeAccessories = deadliftCheck.eligible
  
  // Build explanation
  const explanationSummary = generateHybridExplanationSummary(profile, deadliftCheck, primaryGoal)
  
  return {
    isHybridEnabled: isEnabled,
    modality: profile.modality,
    deadliftEligible: deadliftCheck.eligible,
    deadliftReason: deadliftCheck.reason,
    conflicts: [], // Populated during session assembly
    weeklyDeadliftBudget,
    shouldReducePullVolume,
    shouldReduceHingeAccessories,
    explanationSummary,
  }
}

/**
 * Check if a specific exercise conflicts with deadlift in the same session
 */
export function checkDeadliftConflict(
  exerciseId: string,
  includesDeadliftToday: boolean
): FatigueConflict | null {
  if (!includesDeadliftToday) return null
  
  return DEADLIFT_CONFLICT_MAP[exerciseId] || null
}

/**
 * Get all exercises that should be avoided or modified on a deadlift day
 */
export function getDeadliftDayExclusions(): string[] {
  return Object.entries(DEADLIFT_CONFLICT_MAP)
    .filter(([_, conflict]) => conflict.severity === 'high')
    .map(([id]) => id)
}

/**
 * Get all exercises that should be reduced (not excluded) on a deadlift day
 */
export function getDeadliftDayReductions(): string[] {
  return Object.entries(DEADLIFT_CONFLICT_MAP)
    .filter(([_, conflict]) => conflict.severity === 'moderate')
    .map(([id]) => id)
}

// =============================================================================
// PLACEMENT LOGIC
// =============================================================================

/**
 * Recommend optimal deadlift placement for the week
 */
export function recommendDeadliftPlacement(
  trainingDaysPerWeek: number,
  sessionTypes: string[],  // e.g., ['pull', 'push', 'legs', 'skill']
  existingConflicts: string[]
): DeadliftPlacement {
  // Not enough training days
  if (trainingDaysPerWeek < 3) {
    return {
      recommended: false,
      dayOfWeek: null,
      reason: 'Insufficient training frequency for deadlift integration. Consider 3+ days/week.',
      conflictingExercises: [],
      frequencyPerWeek: 1,
    }
  }
  
  // Find a day that doesn't conflict heavily
  // Prefer days labeled as 'legs', 'lower', or 'pull'
  const preferredDayTypes = ['legs', 'lower', 'pull', 'full_body']
  let bestDay: number | null = null
  
  for (let i = 0; i < sessionTypes.length; i++) {
    const sessionType = sessionTypes[i].toLowerCase()
    if (preferredDayTypes.some(pref => sessionType.includes(pref))) {
      bestDay = i + 1 // 1-indexed
      break
    }
  }
  
  // Default to middle of the week if no preference found
  if (bestDay === null && trainingDaysPerWeek >= 3) {
    bestDay = Math.ceil(trainingDaysPerWeek / 2)
  }
  
  return {
    recommended: bestDay !== null,
    dayOfWeek: bestDay,
    reason: bestDay 
      ? 'Deadlift placed to minimize recovery overlap with skill work.'
      : 'Could not find optimal placement.',
    conflictingExercises: existingConflicts,
    frequencyPerWeek: 1,
  }
}

// =============================================================================
// STREETLIFTING RULES
// =============================================================================

/**
 * Check for streetlifting-specific programming conflicts
 * Streetlifting = weighted pull-up + weighted dip + deadlift
 */
export function checkStreetliftingConflicts(
  plannedExercises: string[],
  modality: HybridStrengthModality
): { hasConflict: boolean; message: string; adjustments: string[] } {
  if (modality !== 'streetlifting_biased') {
    return { hasConflict: false, message: '', adjustments: [] }
  }
  
  const hasWeightedPull = plannedExercises.some(e => 
    e.includes('weighted_pull') || e.includes('weighted_chin')
  )
  const hasWeightedDip = plannedExercises.some(e => 
    e.includes('weighted_dip')
  )
  const hasDeadlift = plannedExercises.some(e => 
    e.includes('deadlift')
  )
  
  // All three heavy lifts in one session = too much neural stress
  if (hasWeightedPull && hasWeightedDip && hasDeadlift) {
    return {
      hasConflict: true,
      message: 'Too many max-effort lifts in one session. Split across days.',
      adjustments: [
        'Move deadlift to separate day',
        'Keep weighted pull-up and dip together (streetlifting upper day)',
      ],
    }
  }
  
  // Deadlift + weighted pull-up in same session = manageable but reduce volume
  if (hasWeightedPull && hasDeadlift) {
    return {
      hasConflict: false,
      message: 'Weighted pull-up + deadlift is acceptable. Reduce total sets by 20%.',
      adjustments: [
        'Limit weighted pull-up to 3-4 sets',
        'Limit deadlift to 3-5 sets',
      ],
    }
  }
  
  return { hasConflict: false, message: '', adjustments: [] }
}

// =============================================================================
// EXPLANATION GENERATION
// =============================================================================

/**
 * Generate short explanation summary for hybrid programming decisions
 */
function generateHybridExplanationSummary(
  profile: HybridStrengthProfile,
  deadliftCheck: { eligible: boolean; reason: string },
  primaryGoal: string
): string {
  if (profile.modality === 'calisthenics_only') {
    return 'Calisthenics-first programming with no barbell work.'
  }
  
  if (profile.modality === 'weighted_calisthenics') {
    return 'Weighted calisthenics for strength development. No barbell work.'
  }
  
  if (!deadliftCheck.eligible) {
    return `Hybrid mode enabled, but deadlift excluded: ${deadliftCheck.reason}`
  }
  
  if (profile.modality === 'hybrid_light') {
    return 'Calisthenics-first with deadlift 1x/week for posterior chain strength.'
  }
  
  if (profile.modality === 'streetlifting_biased') {
    return 'Streetlifting-style hybrid: weighted pull-up, weighted dip, and deadlift as primary strength drivers.'
  }
  
  return 'Hybrid strength programming enabled.'
}

/**
 * Generate detailed explanation for why deadlift was included/excluded
 */
export function generateDeadliftExplanation(
  context: HybridProgrammingContext
): HybridExplanation {
  if (!context.deadliftEligible) {
    return {
      title: 'Deadlift Not Included',
      body: context.deadliftReason,
      bulletPoints: [
        'Calisthenics skill work remains the priority',
        'Hip hinge patterns addressed through bodyweight alternatives',
      ],
    }
  }
  
  if (context.modality === 'hybrid_light') {
    return {
      title: 'Deadlift Included (Light Hybrid)',
      body: 'Deadlift added 1x/week to build posterior chain force production while preserving calisthenics skill priorities.',
      bulletPoints: [
        'Placed to minimize conflict with front lever and weighted pulling',
        'Lower-back recovery protected by spacing',
        'Accessory hip hinge work reduced to prevent overload',
      ],
    }
  }
  
  if (context.modality === 'streetlifting_biased') {
    return {
      title: 'Streetlifting Hybrid Structure',
      body: 'Deadlift integrated alongside weighted pull-ups and dips as primary strength work.',
      bulletPoints: [
        'Neural fatigue managed by separating heavy lifts across days',
        'Calisthenics skill maintenance prioritized over skill acquisition',
        'Recovery windows built between max-effort sessions',
      ],
    }
  }
  
  return {
    title: 'Hybrid Strength Enabled',
    body: context.explanationSummary,
    bulletPoints: [],
  }
}

// =============================================================================
// EXERCISE DEFINITIONS (DEADLIFT VARIANTS)
// =============================================================================

/**
 * Deadlift exercise definitions for the classification registry
 * These should be added to EXERCISE_CLASSIFICATIONS
 */
export const DEADLIFT_EXERCISE_DEFINITIONS = {
  conventional_deadlift: {
    id: 'conventional_deadlift',
    name: 'Conventional Deadlift',
    primaryFamily: 'barbell_hinge' as const,
    intents: ['strength'] as const,
    primaryIntent: 'strength' as const,
    skillCarryover: [] as const,
    requiredEquipment: ['barbell'] as const,
    difficulty: 'intermediate' as const,
    progressionStage: 5,
    fatigueCost: 5 as const,
    neuralDemand: 5 as const,
    jointStress: 4 as const,
    placementTier: 2 as const,
    substitutionPool: ['sumo_deadlift', 'trap_bar_deadlift', 'romanian_deadlift'],
  },
  sumo_deadlift: {
    id: 'sumo_deadlift',
    name: 'Sumo Deadlift',
    primaryFamily: 'barbell_hinge' as const,
    intents: ['strength'] as const,
    primaryIntent: 'strength' as const,
    skillCarryover: [] as const,
    requiredEquipment: ['barbell'] as const,
    difficulty: 'intermediate' as const,
    progressionStage: 5,
    fatigueCost: 5 as const,
    neuralDemand: 5 as const,
    jointStress: 3 as const,
    placementTier: 2 as const,
    substitutionPool: ['conventional_deadlift', 'trap_bar_deadlift'],
  },
  romanian_deadlift: {
    id: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    primaryFamily: 'barbell_hinge' as const,
    secondaryFamilies: ['hinge_pattern'] as const,
    intents: ['strength', 'hypertrophy'] as const,
    primaryIntent: 'hypertrophy' as const,
    skillCarryover: [] as const,
    requiredEquipment: ['barbell'] as const,
    optionalEquipment: ['dumbbells'] as const,
    difficulty: 'beginner' as const,
    progressionStage: 3,
    fatigueCost: 3 as const,
    neuralDemand: 2 as const,
    jointStress: 3 as const,
    placementTier: 3 as const,
    substitutionPool: ['conventional_deadlift', 'good_morning', 'hip_hinge'],
  },
  trap_bar_deadlift: {
    id: 'trap_bar_deadlift',
    name: 'Trap Bar Deadlift',
    primaryFamily: 'barbell_hinge' as const,
    secondaryFamilies: ['squat_pattern'] as const,
    intents: ['strength'] as const,
    primaryIntent: 'strength' as const,
    skillCarryover: [] as const,
    requiredEquipment: ['barbell'] as const, // Trap bar treated as barbell variant
    difficulty: 'beginner' as const,
    progressionStage: 4,
    fatigueCost: 4 as const,
    neuralDemand: 4 as const,
    jointStress: 3 as const,
    placementTier: 2 as const,
    substitutionPool: ['conventional_deadlift', 'sumo_deadlift'],
  },
} as const

// =============================================================================
// EXPORTS
// =============================================================================

export {
  isHybridStrengthEnabled,
  shouldIncludeDeadlift,
  getDefaultHybridStrengthProfile,
}
