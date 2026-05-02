/**
 * SpartanLab Strength Intelligence Engine
 * 
 * Advanced powerlifting and streetlifting-informed intelligence layer.
 * Teaches the engine HOW elite strength training actually works.
 * 
 * PHILOSOPHY:
 * - Not just "add deadlift" but intelligent intensity management
 * - Fatigue cycling based on real athletic methodology
 * - Neural demand awareness
 * - Progression styles from actual strength sports
 * - Hybrid compatibility without diluting calisthenics identity
 * 
 * This engine handles:
 * - Strength method profiles (internal)
 * - Intensity distribution logic
 * - Frequency recommendations
 * - Fatigue category tracking
 * - Progression models
 * - Streetlifting coordination
 * - Auto-bias detection
 * - Enhanced explanations
 */

import {
  type HybridStrengthModality,
  type HybridStrengthProfile,
  type DeadliftExperienceLevel,
} from './athlete-profile'

// =============================================================================
// STRENGTH METHOD PROFILES (INTERNAL)
// =============================================================================

/**
 * Internal strength method profile IDs
 * These influence programming decisions but are NOT exposed to users directly
 */
export type StrengthMethodId =
  | 'volume_bias'           // Higher total volume, moderate intensity
  | 'intensity_bias'        // Lower volume, higher intensity, more rest
  | 'hybrid_skill_strength' // Balanced skill + strength, careful fatigue management
  | 'streetlifting_bias'    // WPU + WDip + DL emphasis, neural management critical

/**
 * Strength method profile definition
 */
export interface StrengthMethodProfile {
  id: StrengthMethodId
  name: string
  description: string
  
  // Rep range preferences (percentage of total sets)
  repRangeDistribution: {
    heavy: number      // 1-5 reps (0-100%)
    moderate: number   // 6-8 reps (0-100%)
    volume: number     // 9-15 reps (0-100%)
  }
  
  // Intensity parameters
  typicalRPE: { min: number; max: number }
  peakRPE: number
  
  // Frequency
  mainLiftFrequency: 1 | 2 | 3  // times per week
  accessoryFrequency: 2 | 3 | 4
  
  // Fatigue expectations
  expectedWeeklyFatigue: {
    neural: 'low' | 'moderate' | 'high'
    muscular: 'low' | 'moderate' | 'high'
    connective: 'low' | 'moderate' | 'high'
  }
  
  // Recovery needs
  minimumRestDays: number
  deloadFrequency: number  // weeks between deloads
  
  // Set structures
  preferredSetStructure: SetStructureType[]
  
  // Compatibility
  skillWorkCompatibility: 'high' | 'moderate' | 'low'
  calisthenicsEmphasisMultiplier: number  // 0.5-1.5
}

export type SetStructureType =
  | 'straight_sets'       // 5x5, 3x8
  | 'pyramid'             // 5,4,3,2,1
  | 'reverse_pyramid'     // 1,2,3,4,5
  | 'wave'                // 5,3,1,5,3,1
  | 'top_set_backoff'     // 1x heavy, then 3x moderate
  | 'cluster'             // Intra-set rest
  | 'emom'                // Every minute on the minute

/**
 * Strength method profile definitions
 */
export const STRENGTH_METHOD_PROFILES: Record<StrengthMethodId, StrengthMethodProfile> = {
  volume_bias: {
    id: 'volume_bias',
    name: 'Volume Bias',
    description: 'Higher total volume, moderate intensity. Builds work capacity and muscle.',
    repRangeDistribution: {
      heavy: 20,
      moderate: 35,
      volume: 45,
    },
    typicalRPE: { min: 6, max: 8 },
    peakRPE: 8.5,
    mainLiftFrequency: 2,
    accessoryFrequency: 4,
    expectedWeeklyFatigue: {
      neural: 'moderate',
      muscular: 'high',
      connective: 'moderate',
    },
    minimumRestDays: 1,
    deloadFrequency: 4,
    preferredSetStructure: ['straight_sets', 'pyramid'],
    skillWorkCompatibility: 'moderate',
    calisthenicsEmphasisMultiplier: 0.9,
  },
  
  intensity_bias: {
    id: 'intensity_bias',
    name: 'Intensity Bias',
    description: 'Lower volume, higher intensity. Maximizes neural adaptations and peak strength.',
    repRangeDistribution: {
      heavy: 50,
      moderate: 35,
      volume: 15,
    },
    typicalRPE: { min: 7, max: 9 },
    peakRPE: 10,
    mainLiftFrequency: 2,
    accessoryFrequency: 2,
    expectedWeeklyFatigue: {
      neural: 'high',
      muscular: 'moderate',
      connective: 'moderate',
    },
    minimumRestDays: 2,
    deloadFrequency: 3,
    preferredSetStructure: ['top_set_backoff', 'wave', 'cluster'],
    skillWorkCompatibility: 'low',
    calisthenicsEmphasisMultiplier: 0.7,
  },
  
  hybrid_skill_strength: {
    id: 'hybrid_skill_strength',
    name: 'Hybrid Skill + Strength',
    description: 'Balanced approach prioritizing skill development with strength support.',
    repRangeDistribution: {
      heavy: 30,
      moderate: 40,
      volume: 30,
    },
    typicalRPE: { min: 6, max: 8 },
    peakRPE: 9,
    mainLiftFrequency: 1,
    accessoryFrequency: 3,
    expectedWeeklyFatigue: {
      neural: 'moderate',
      muscular: 'moderate',
      connective: 'low',
    },
    minimumRestDays: 1,
    deloadFrequency: 4,
    preferredSetStructure: ['straight_sets', 'top_set_backoff'],
    skillWorkCompatibility: 'high',
    calisthenicsEmphasisMultiplier: 1.2,
  },
  
  streetlifting_bias: {
    id: 'streetlifting_bias',
    name: 'Streetlifting Bias',
    description: 'Weighted pull-up, weighted dip, and deadlift as primary strength drivers.',
    repRangeDistribution: {
      heavy: 45,
      moderate: 40,
      volume: 15,
    },
    typicalRPE: { min: 7, max: 9 },
    peakRPE: 10,
    mainLiftFrequency: 2,
    accessoryFrequency: 2,
    expectedWeeklyFatigue: {
      neural: 'high',
      muscular: 'high',
      connective: 'moderate',
    },
    minimumRestDays: 2,
    deloadFrequency: 3,
    preferredSetStructure: ['top_set_backoff', 'wave', 'straight_sets'],
    skillWorkCompatibility: 'moderate',
    calisthenicsEmphasisMultiplier: 0.8,
  },
}

// =============================================================================
// INTENSITY CLASSIFICATION
// =============================================================================

/**
 * Intensity zone classification
 */
export type IntensityZone = 'heavy' | 'moderate' | 'volume' | 'deload'

export interface IntensityClassification {
  zone: IntensityZone
  repRange: { min: number; max: number }
  rpeRange: { min: number; max: number }
  neuralCost: 1 | 2 | 3 | 4 | 5
  recoveryDays: number
}

export const INTENSITY_ZONES: Record<IntensityZone, IntensityClassification> = {
  heavy: {
    zone: 'heavy',
    repRange: { min: 1, max: 5 },
    rpeRange: { min: 8, max: 10 },
    neuralCost: 5,
    recoveryDays: 3,
  },
  moderate: {
    zone: 'moderate',
    repRange: { min: 6, max: 8 },
    rpeRange: { min: 6, max: 8 },
    neuralCost: 3,
    recoveryDays: 2,
  },
  volume: {
    zone: 'volume',
    repRange: { min: 9, max: 15 },
    rpeRange: { min: 5, max: 7 },
    neuralCost: 1,
    recoveryDays: 1,
  },
  deload: {
    zone: 'deload',
    repRange: { min: 5, max: 10 },
    rpeRange: { min: 4, max: 6 },
    neuralCost: 1,
    recoveryDays: 0,
  },
}

/**
 * Classify a set by reps and RPE
 */
export function classifyIntensity(reps: number, rpe: number): IntensityZone {
  if (rpe >= 8 && reps <= 5) return 'heavy'
  if (rpe <= 6 && reps >= 8) return 'volume'
  if (rpe <= 5) return 'deload'
  return 'moderate'
}

/**
 * Check if two heavy lifts should be in the same session
 */
export function canStackHeavyLifts(
  lift1: string,
  lift2: string,
  methodId: StrengthMethodId
): { allowed: boolean; reason: string } {
  const method = STRENGTH_METHOD_PROFILES[methodId]
  
  // Neural-heavy lifts that should rarely be stacked
  const neuralHeavyLifts = [
    'conventional_deadlift',
    'sumo_deadlift',
    'weighted_pull_up',
    'weighted_chin_up',
  ]
  
  const lift1Heavy = neuralHeavyLifts.includes(lift1)
  const lift2Heavy = neuralHeavyLifts.includes(lift2)
  
  if (lift1Heavy && lift2Heavy) {
    // Streetlifting bias allows controlled overlap
    if (methodId === 'streetlifting_bias') {
      return {
        allowed: true,
        reason: 'Streetlifting bias permits heavy lift pairing with volume reduction.',
      }
    }
    
    // Intensity bias strongly discourages
    if (methodId === 'intensity_bias') {
      return {
        allowed: false,
        reason: 'Intensity bias requires separating max-effort neural work.',
      }
    }
    
    // Others: cautiously allow
    return {
      allowed: true,
      reason: 'Heavy lifts paired - reduce total sets by 20%.',
    }
  }
  
  return { allowed: true, reason: 'No neural overlap conflict.' }
}

// =============================================================================
// FREQUENCY LOGIC
// =============================================================================

export interface FrequencyRecommendation {
  deadliftPerWeek: 0 | 1 | 2
  weightedPullPerWeek: 0 | 1 | 2 | 3
  weightedDipPerWeek: 0 | 1 | 2 | 3
  skillWorkDays: number
  reason: string
}

/**
 * Get frequency recommendations based on modality and training days
 */
export function getFrequencyRecommendation(
  modality: HybridStrengthModality,
  trainingDaysPerWeek: number,
  deadliftExperience: DeadliftExperienceLevel | null
): FrequencyRecommendation {
  // Calisthenics only: no barbell work
  if (modality === 'calisthenics_only') {
    return {
      deadliftPerWeek: 0,
      weightedPullPerWeek: 0,
      weightedDipPerWeek: 0,
      skillWorkDays: Math.min(trainingDaysPerWeek, 4),
      reason: 'Pure calisthenics focus with maximum skill development.',
    }
  }
  
  // Weighted calisthenics: no deadlift
  if (modality === 'weighted_calisthenics') {
    const weightedDays = Math.min(Math.floor(trainingDaysPerWeek / 2), 2)
    return {
      deadliftPerWeek: 0,
      weightedPullPerWeek: weightedDays,
      weightedDipPerWeek: weightedDays,
      skillWorkDays: trainingDaysPerWeek - weightedDays,
      reason: 'Weighted calisthenics for strength, skill work on alternating days.',
    }
  }
  
  // Hybrid light: 1x deadlift
  if (modality === 'hybrid_light') {
    return {
      deadliftPerWeek: 1,
      weightedPullPerWeek: Math.min(trainingDaysPerWeek >= 4 ? 2 : 1, 2),
      weightedDipPerWeek: Math.min(trainingDaysPerWeek >= 4 ? 2 : 1, 2),
      skillWorkDays: Math.max(trainingDaysPerWeek - 2, 2),
      reason: 'Light hybrid: 1x deadlift for posterior chain, skill remains priority.',
    }
  }
  
  // Streetlifting bias: prioritize the big three
  if (modality === 'streetlifting_biased') {
    // More experienced = can handle 2x deadlift
    const dlFreq = deadliftExperience === 'advanced' && trainingDaysPerWeek >= 5 ? 2 : 1
    return {
      deadliftPerWeek: dlFreq as 0 | 1 | 2,
      weightedPullPerWeek: 2,
      weightedDipPerWeek: 2,
      skillWorkDays: Math.max(trainingDaysPerWeek - 3, 1),
      reason: 'Streetlifting focus: WPU + WDip + DL as primary drivers.',
    }
  }
  
  return {
    deadliftPerWeek: 0,
    weightedPullPerWeek: 0,
    weightedDipPerWeek: 0,
    skillWorkDays: trainingDaysPerWeek,
    reason: 'Default calisthenics programming.',
  }
}

// =============================================================================
// FATIGUE MANAGEMENT
// =============================================================================

export type FatigueCategory =
  | 'neural'          // Heavy lifts, max effort, explosive work
  | 'posterior_chain' // Deadlifts, rows, hip hinges, back work
  | 'pulling'         // All pulling movements
  | 'pushing'         // All pushing movements
  | 'grip'            // Grip-intensive work
  | 'spinal'          // Axial loading

export interface FatigueBudget {
  category: FatigueCategory
  currentLevel: number      // 0-100
  weeklyBudget: number      // Max accumulation before recovery needed
  recoveryRate: number      // Points recovered per day
  warningThreshold: number  // Level at which to reduce volume
  criticalThreshold: number // Level at which to avoid category
}

export interface FatigueState {
  neural: number
  posterior_chain: number
  pulling: number
  pushing: number
  grip: number
  spinal: number
}

/**
 * Default fatigue budgets by category
 */
export const DEFAULT_FATIGUE_BUDGETS: Record<FatigueCategory, Omit<FatigueBudget, 'currentLevel'>> = {
  neural: {
    category: 'neural',
    weeklyBudget: 100,
    recoveryRate: 15, // per day
    warningThreshold: 70,
    criticalThreshold: 90,
  },
  posterior_chain: {
    category: 'posterior_chain',
    weeklyBudget: 120,
    recoveryRate: 20,
    warningThreshold: 80,
    criticalThreshold: 100,
  },
  pulling: {
    category: 'pulling',
    weeklyBudget: 100,
    recoveryRate: 18,
    warningThreshold: 75,
    criticalThreshold: 95,
  },
  pushing: {
    category: 'pushing',
    weeklyBudget: 100,
    recoveryRate: 18,
    warningThreshold: 75,
    criticalThreshold: 95,
  },
  grip: {
    category: 'grip',
    weeklyBudget: 80,
    recoveryRate: 25,
    warningThreshold: 60,
    criticalThreshold: 80,
  },
  spinal: {
    category: 'spinal',
    weeklyBudget: 100,
    recoveryRate: 12, // Slowest recovery
    warningThreshold: 70,
    criticalThreshold: 85,
  },
}

/**
 * Exercise fatigue contributions
 */
export interface ExerciseFatigueContribution {
  exerciseId: string
  fatigueAdded: Partial<FatigueState>
}

/**
 * Get fatigue contribution for an exercise
 */
export function getExerciseFatigueContribution(
  exerciseId: string,
  intensityZone: IntensityZone,
  sets: number
): ExerciseFatigueContribution {
  const intensity = INTENSITY_ZONES[intensityZone]
  const multiplier = sets * (intensity.neuralCost / 3)
  
  // Base contributions by exercise type
  const contributions: Record<string, Partial<FatigueState>> = {
    // Deadlifts - heavy on everything
    'conventional_deadlift': {
      neural: 25 * multiplier,
      posterior_chain: 30 * multiplier,
      pulling: 15 * multiplier,
      grip: 20 * multiplier,
      spinal: 30 * multiplier,
    },
    'sumo_deadlift': {
      neural: 25 * multiplier,
      posterior_chain: 25 * multiplier,
      pulling: 15 * multiplier,
      grip: 20 * multiplier,
      spinal: 25 * multiplier,
    },
    'romanian_deadlift': {
      neural: 10 * multiplier,
      posterior_chain: 25 * multiplier,
      grip: 15 * multiplier,
      spinal: 15 * multiplier,
    },
    'trap_bar_deadlift': {
      neural: 20 * multiplier,
      posterior_chain: 20 * multiplier,
      pulling: 10 * multiplier,
      grip: 15 * multiplier,
      spinal: 20 * multiplier,
    },
    
    // Weighted pull-up - neural + pulling
    'weighted_pull_up': {
      neural: 20 * multiplier,
      pulling: 25 * multiplier,
      grip: 15 * multiplier,
    },
    'weighted_chin_up': {
      neural: 18 * multiplier,
      pulling: 25 * multiplier,
      grip: 15 * multiplier,
    },
    
    // Weighted dip - neural + pushing
    'weighted_dip': {
      neural: 15 * multiplier,
      pushing: 25 * multiplier,
    },
    
    // Front lever work - posterior + pulling
    'tuck_fl': {
      posterior_chain: 15 * multiplier,
      pulling: 20 * multiplier,
      spinal: 10 * multiplier,
    },
    'adv_tuck_fl': {
      posterior_chain: 20 * multiplier,
      pulling: 25 * multiplier,
      spinal: 15 * multiplier,
    },
    'straddle_fl': {
      neural: 15 * multiplier,
      posterior_chain: 25 * multiplier,
      pulling: 25 * multiplier,
      spinal: 20 * multiplier,
    },
    'full_fl': {
      neural: 20 * multiplier,
      posterior_chain: 30 * multiplier,
      pulling: 30 * multiplier,
      spinal: 25 * multiplier,
    },
  }
  
  const base = contributions[exerciseId] || {
    neural: 5 * multiplier,
    posterior_chain: 5 * multiplier,
  }
  
  return {
    exerciseId,
    fatigueAdded: base,
  }
}

/**
 * Check if adding an exercise would exceed fatigue thresholds
 */
export function checkFatigueOverload(
  currentState: FatigueState,
  addition: Partial<FatigueState>
): { overloaded: boolean; categories: FatigueCategory[]; recommendation: string } {
  const overloadedCategories: FatigueCategory[] = []
  
  for (const [category, budget] of Object.entries(DEFAULT_FATIGUE_BUDGETS)) {
    const cat = category as FatigueCategory
    const current = currentState[cat] || 0
    const added = addition[cat] || 0
    const total = current + added
    
    if (total >= budget.criticalThreshold) {
      overloadedCategories.push(cat)
    }
  }
  
  if (overloadedCategories.length > 0) {
    return {
      overloaded: true,
      categories: overloadedCategories,
      recommendation: `Reduce ${overloadedCategories.join(', ')} work to prevent overtraining.`,
    }
  }
  
  return { overloaded: false, categories: [], recommendation: '' }
}

/**
 * Get volume reduction factor based on fatigue state
 */
export function getFatigueBasedVolumeReduction(
  currentState: FatigueState,
  targetCategory: FatigueCategory
): number {
  const budget = DEFAULT_FATIGUE_BUDGETS[targetCategory]
  const current = currentState[targetCategory] || 0
  
  if (current >= budget.criticalThreshold) {
    return 0 // Skip entirely
  }
  
  if (current >= budget.warningThreshold) {
    return 0.6 // 40% reduction
  }
  
  if (current >= budget.warningThreshold * 0.8) {
    return 0.8 // 20% reduction
  }
  
  return 1.0 // Full volume
}

// =============================================================================
// PROGRESSION MODELS
// =============================================================================

export type ProgressionModel =
  | 'linear'           // Add weight/reps each session
  | 'wave'             // 3 week waves (light, medium, heavy)
  | 'top_set_backoff'  // One heavy set, then drop for volume
  | 'double_progression' // Add reps until target, then add weight
  | 'dip_wave'         // Specific to streetlifting dips

export interface ProgressionRecommendation {
  model: ProgressionModel
  reason: string
  weeklyStructure: string[]
  deloadTrigger: string
  exampleProgression: string
}

/**
 * Get progression recommendation based on experience and method
 */
export function getProgressionRecommendation(
  experience: DeadliftExperienceLevel | null,
  methodId: StrengthMethodId,
  exerciseType: 'deadlift' | 'weighted_pull' | 'weighted_dip' | 'skill'
): ProgressionRecommendation {
  // Beginners: linear progression
  if (experience === 'none' || experience === 'beginner') {
    return {
      model: 'linear',
      reason: 'Linear progression maximizes beginner gains.',
      weeklyStructure: ['Add 2.5-5kg when all target reps hit'],
      deloadTrigger: '2 consecutive sessions failing target reps',
      exampleProgression: 'Week 1: 60kg x 5, Week 2: 62.5kg x 5, Week 3: 65kg x 5',
    }
  }
  
  // Intermediates: wave or double progression
  if (experience === 'intermediate') {
    if (exerciseType === 'deadlift') {
      return {
        model: 'wave',
        reason: 'Wave progression manages fatigue while building strength.',
        weeklyStructure: [
          'Week 1: Light (RPE 7)',
          'Week 2: Medium (RPE 8)',
          'Week 3: Heavy (RPE 9)',
          'Week 4: Deload',
        ],
        deloadTrigger: 'After week 3 or when RPE 9 feels like RPE 10',
        exampleProgression: 'Light: 100kg x 5, Med: 110kg x 4, Heavy: 120kg x 3',
      }
    }
    
    return {
      model: 'double_progression',
      reason: 'Build reps before adding weight for sustainable progress.',
      weeklyStructure: ['Add reps (5→6→7→8) then reset at higher weight'],
      deloadTrigger: 'Unable to hit minimum reps for 2 sessions',
      exampleProgression: '+20kg x 5→6→7→8, then +22.5kg x 5',
    }
  }
  
  // Advanced: top set + backoff
  if (experience === 'advanced') {
    return {
      model: 'top_set_backoff',
      reason: 'Top set drives adaptation, backoffs build volume without excessive fatigue.',
      weeklyStructure: [
        '1 top set at RPE 9',
        '3-4 backoff sets at 85-90%',
        'Rotate intensity focus weekly',
      ],
      deloadTrigger: 'Top set RPE 10 for 2+ weeks or grip/back fatigue',
      exampleProgression: 'Top: 180kg x 3 RPE 9, Backoffs: 155kg x 5 x 3',
    }
  }
  
  // Default: linear
  return {
    model: 'linear',
    reason: 'Start with linear progression.',
    weeklyStructure: ['Add weight when target reps hit'],
    deloadTrigger: 'Stalled for 2 weeks',
    exampleProgression: 'Add 2.5kg per session when successful',
  }
}

/**
 * Check if progression should be held or deloaded
 */
export function shouldHoldProgression(
  recentFatigue: FatigueState,
  consecutiveFailures: number,
  weeksSinceDeload: number,
  methodId: StrengthMethodId
): { hold: boolean; deload: boolean; reason: string } {
  const method = STRENGTH_METHOD_PROFILES[methodId]
  
  // Deload trigger: too long since last deload
  if (weeksSinceDeload >= method.deloadFrequency) {
    return {
      hold: true,
      deload: true,
      reason: `Scheduled deload after ${method.deloadFrequency} weeks.`,
    }
  }
  
  // Deload trigger: consecutive failures
  if (consecutiveFailures >= 2) {
    return {
      hold: true,
      deload: true,
      reason: 'Multiple failed sessions indicate recovery need.',
    }
  }
  
  // Hold trigger: high fatigue
  const criticalFatigue = Object.entries(recentFatigue).some(
    ([cat, level]) => level >= DEFAULT_FATIGUE_BUDGETS[cat as FatigueCategory].criticalThreshold
  )
  if (criticalFatigue) {
    return {
      hold: true,
      deload: false,
      reason: 'Fatigue elevated - maintain current loads.',
    }
  }
  
  return { hold: false, deload: false, reason: 'Continue progression.' }
}

// =============================================================================
// AUTO-BIAS DETECTION
// =============================================================================

export interface StrengthBiasProfile {
  pullStrength: 'weak' | 'average' | 'strong'
  pushStrength: 'weak' | 'average' | 'strong'
  legStrength: 'weak' | 'average' | 'strong'
  coreStrength: 'weak' | 'average' | 'strong'
  overallBias: 'pull_dominant' | 'push_dominant' | 'balanced' | 'leg_dominant'
  recommendations: string[]
}

/**
 * Detect strength biases from profile data
 */
export function detectStrengthBias(
  pullUpMax: number | null,       // Max strict pull-ups
  dipMax: number | null,          // Max strict dips
  deadlift1RM: number | null,     // Deadlift 1RM
  bodyweight: number | null,      // Bodyweight in same unit as deadlift
  primarySkill: string
): StrengthBiasProfile {
  const recommendations: string[] = []
  
  // Default averages
  let pullStrength: 'weak' | 'average' | 'strong' = 'average'
  let pushStrength: 'weak' | 'average' | 'strong' = 'average'
  let legStrength: 'weak' | 'average' | 'strong' = 'average'
  const coreStrength: 'weak' | 'average' | 'strong' = 'average'
  
  // Pull-up assessment
  if (pullUpMax !== null) {
    if (pullUpMax < 8) {
      pullStrength = 'weak'
      recommendations.push('Prioritize pulling strength before weighted work.')
    } else if (pullUpMax >= 15) {
      pullStrength = 'strong'
    }
  }
  
  // Dip assessment
  if (dipMax !== null) {
    if (dipMax < 10) {
      pushStrength = 'weak'
      recommendations.push('Build dip base before adding weight.')
    } else if (dipMax >= 20) {
      pushStrength = 'strong'
    }
  }
  
  // Deadlift assessment (relative to bodyweight)
  if (deadlift1RM !== null && bodyweight !== null && bodyweight > 0) {
    const ratio = deadlift1RM / bodyweight
    if (ratio < 1.5) {
      legStrength = 'weak'
      recommendations.push('Focus on deadlift technique and progressive overload.')
    } else if (ratio >= 2.0) {
      legStrength = 'strong'
    }
  }
  
  // Determine overall bias
  let overallBias: 'pull_dominant' | 'push_dominant' | 'balanced' | 'leg_dominant' = 'balanced'
  
  if (pullStrength === 'strong' && pushStrength !== 'strong') {
    overallBias = 'pull_dominant'
    recommendations.push('Balance with additional pushing work.')
  } else if (pushStrength === 'strong' && pullStrength !== 'strong') {
    overallBias = 'push_dominant'
    recommendations.push('Balance with additional pulling work.')
  } else if (legStrength === 'strong' && pullStrength !== 'strong' && pushStrength !== 'strong') {
    overallBias = 'leg_dominant'
    recommendations.push('Upper body needs attention.')
  }
  
  // Skill-specific recommendations
  if (primarySkill === 'front_lever' && pullStrength === 'weak') {
    recommendations.push('Front lever requires pulling strength - prioritize pull-up development.')
  }
  if (primarySkill === 'planche' && pushStrength === 'weak') {
    recommendations.push('Planche requires pushing strength - prioritize pushing development.')
  }
  
  return {
    pullStrength,
    pushStrength,
    legStrength,
    coreStrength,
    overallBias,
    recommendations: recommendations.slice(0, 3), // Max 3 recommendations
  }
}

// =============================================================================
// ENHANCED EXPLANATIONS
// =============================================================================

export interface StrengthExplanation {
  title: string
  body: string
  reasoning: string[]
  icon: 'brain' | 'muscle' | 'shield' | 'target'
}

/**
 * Generate intelligent explanation for strength programming decisions
 */
export function generateStrengthExplanation(
  decision: {
    exercise: string
    intensityZone: IntensityZone
    fatigueState: FatigueState
    volumeReduction: number
    progressionHeld: boolean
  }
): StrengthExplanation {
  const explanations: StrengthExplanation[] = []
  
  // Intensity explanation
  if (decision.intensityZone === 'heavy') {
    explanations.push({
      title: 'Heavy Work Priority',
      body: 'Heavy sets placed early in session when neural capacity is highest.',
      reasoning: ['Neural freshness optimizes force production'],
      icon: 'brain',
    })
  }
  
  // Volume reduction explanation
  if (decision.volumeReduction < 1.0) {
    const reductionPercent = Math.round((1 - decision.volumeReduction) * 100)
    return {
      title: 'Volume Adjusted',
      body: `Volume reduced ${reductionPercent}% to manage accumulated fatigue.`,
      reasoning: [
        'Fatigue categories approaching thresholds',
        'Recovery preserved for skill work',
        'Prevents overreaching without losing stimulus',
      ],
      icon: 'shield',
    }
  }
  
  // Progression held explanation
  if (decision.progressionHeld) {
    return {
      title: 'Progression Maintained',
      body: 'Weight held this week to consolidate gains and manage recovery.',
      reasoning: [
        'Recent fatigue elevated',
        'Deload week approaching',
        'Skill work remains priority',
      ],
      icon: 'target',
    }
  }
  
  // Default
  return {
    title: 'Strength Work Programmed',
    body: 'Training progresses according to plan.',
    reasoning: ['Fatigue manageable', 'Recovery adequate'],
    icon: 'muscle',
  }
}

/**
 * Generate weekly summary explanation
 */
export function generateWeeklySummary(
  methodId: StrengthMethodId,
  frequencyRec: FrequencyRecommendation,
  biasProfile: StrengthBiasProfile
): string[] {
  const method = STRENGTH_METHOD_PROFILES[methodId]
  const summaries: string[] = []
  
  // Method summary
  summaries.push(`${method.name}: ${method.description}`)
  
  // Frequency summary
  if (frequencyRec.deadliftPerWeek > 0) {
    summaries.push(
      `Deadlift ${frequencyRec.deadliftPerWeek}x/week to build posterior chain without compromising skill work.`
    )
  }
  
  // Bias-aware adjustment
  if (biasProfile.recommendations.length > 0) {
    summaries.push(biasProfile.recommendations[0])
  }
  
  return summaries
}

// =============================================================================
// STREETLIFTING COORDINATION
// =============================================================================

export interface StreetliftingCoordination {
  canTrainAllThreeToday: boolean
  priorityOrder: string[]
  volumeCaps: Record<string, number>
  reasoning: string
}

/**
 * Coordinate the three streetlifting movements (WPU, WDip, Deadlift)
 */
export function coordinateStreetliftingSession(
  plannedExercises: string[],
  currentFatigue: FatigueState,
  isCompetitionPrep: boolean
): StreetliftingCoordination {
  const hasWPU = plannedExercises.includes('weighted_pull_up') || plannedExercises.includes('weighted_chin_up')
  const hasWDip = plannedExercises.includes('weighted_dip')
  const hasDeadlift = plannedExercises.some(e => e.includes('deadlift'))
  
  const allThree = hasWPU && hasWDip && hasDeadlift
  
  // Never all three heavy in one session (except competition simulation)
  if (allThree && !isCompetitionPrep) {
    return {
      canTrainAllThreeToday: false,
      priorityOrder: ['weighted_pull_up', 'weighted_dip', 'conventional_deadlift'],
      volumeCaps: {
        'weighted_pull_up': 4,
        'weighted_dip': 4,
        'conventional_deadlift': 0, // Move to another day
      },
      reasoning: 'All three streetlifting movements too fatiguing for one session. Deadlift moved.',
    }
  }
  
  // WPU + Deadlift: reduce both slightly
  if (hasWPU && hasDeadlift && !hasWDip) {
    return {
      canTrainAllThreeToday: true,
      priorityOrder: ['weighted_pull_up', 'conventional_deadlift'],
      volumeCaps: {
        'weighted_pull_up': 4,
        'conventional_deadlift': 4,
      },
      reasoning: 'Pull + deadlift paired - moderate volume to manage neural fatigue.',
    }
  }
  
  // WPU + WDip: classic upper day
  if (hasWPU && hasWDip && !hasDeadlift) {
    return {
      canTrainAllThreeToday: true,
      priorityOrder: ['weighted_pull_up', 'weighted_dip'],
      volumeCaps: {
        'weighted_pull_up': 5,
        'weighted_dip': 5,
      },
      reasoning: 'Streetlifting upper body focus - full volume permitted.',
    }
  }
  
  // Default: single lift, full volume
  return {
    canTrainAllThreeToday: true,
    priorityOrder: plannedExercises,
    volumeCaps: {},
    reasoning: 'Single primary lift - full volume.',
  }
}

// =============================================================================
// METHOD SELECTION
// =============================================================================

/**
 * Select appropriate method based on modality and experience
 */
export function selectStrengthMethod(
  modality: HybridStrengthModality,
  deadliftExperience: DeadliftExperienceLevel | null,
  primaryGoal: string
): StrengthMethodId {
  // Pure calisthenics
  if (modality === 'calisthenics_only' || modality === 'weighted_calisthenics') {
    return 'hybrid_skill_strength'
  }
  
  // Streetlifting focus
  if (modality === 'streetlifting_biased') {
    return 'streetlifting_bias'
  }
  
  // Hybrid light
  if (modality === 'hybrid_light') {
    // Skill-focused goals prioritize skill work
    const skillGoals = ['front_lever', 'planche', 'muscle_up', 'handstand_pushup', 'handstand']
    if (skillGoals.includes(primaryGoal)) {
      return 'hybrid_skill_strength'
    }
    
    // Strength-focused beginners
    if (deadliftExperience === 'none' || deadliftExperience === 'beginner') {
      return 'volume_bias'
    }
    
    // Strength-focused intermediates/advanced
    return 'intensity_bias'
  }
  
  return 'hybrid_skill_strength'
}

// =============================================================================
// EXPORTS
// =============================================================================
//
// [DUPLICATE-EXPORT-CONTRACT-FIX] STRENGTH_METHOD_PROFILES (line 99),
// INTENSITY_ZONES (line 218), and DEFAULT_FATIGUE_BUDGETS (line 416) are
// exported inline at their declarations. The previous bottom export block
// duplicated all three names (TS2300/TS2484). Inline export remains the
// single canonical export style; public API is unchanged.
