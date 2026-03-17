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
 * 
 * INTELLIGENCE INTEGRATION:
 * Uses strength-intelligence-engine for:
 * - Method profiles (volume/intensity/hybrid/streetlifting bias)
 * - Fatigue category tracking
 * - Progression models
 * - Auto-bias detection
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

import {
  type StrengthMethodId,
  type IntensityZone,
  type FatigueState,
  type ProgressionModel,
  type StrengthBiasProfile,
  STRENGTH_METHOD_PROFILES,
  selectStrengthMethod,
  getFrequencyRecommendation,
  getProgressionRecommendation,
  detectStrengthBias,
  checkFatigueOverload,
  getFatigueBasedVolumeReduction,
  getExerciseFatigueContribution,
  coordinateStreetliftingSession,
  shouldHoldProgression,
  generateStrengthExplanation,
  generateWeeklySummary,
} from './strength-intelligence-engine'

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
 * Extended with intelligence engine data
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
  
  // Intelligence engine extensions
  strengthMethodId: StrengthMethodId | null
  currentFatigueState: FatigueState
  progressionModel: ProgressionModel | null
  strengthBias: StrengthBiasProfile | null
  intelligentExplanations: string[]
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
 * Now includes intelligence engine data for smarter programming
 */
export function buildHybridProgrammingContext(
  hybridProfile: HybridStrengthProfile | null | undefined,
  equipment: EquipmentType[],
  jointCautions: JointCaution[],
  trainingDaysPerWeek: number,
  primaryGoal: string,
  // Optional intelligence inputs
  pullUpMax?: number | null,
  dipMax?: number | null,
  bodyweight?: number | null
): HybridProgrammingContext {
  // Default: calisthenics-only, no hybrid features
  const profile = hybridProfile || getDefaultHybridStrengthProfile()
  
  const isEnabled = isHybridStrengthEnabled(profile, equipment)
  const deadliftCheck = shouldIncludeDeadlift(profile, equipment, jointCautions)
  
  // Get frequency recommendations from intelligence engine
  const frequencyRec = getFrequencyRecommendation(
    profile.modality,
    trainingDaysPerWeek,
    profile.deadliftExperience
  )
  
  // Determine weekly deadlift budget from intelligence engine
  const weeklyDeadliftBudget = deadliftCheck.eligible ? frequencyRec.deadliftPerWeek : 0
  
  // Select strength method based on context
  const strengthMethodId = isEnabled 
    ? selectStrengthMethod(profile.modality, profile.deadliftExperience, primaryGoal)
    : null
  
  // Get progression recommendation
  const progressionRec = strengthMethodId
    ? getProgressionRecommendation(profile.deadliftExperience, strengthMethodId, 'deadlift')
    : null
  
  // Detect strength bias if we have data
  const strengthBias = (pullUpMax || dipMax || profile.deadlift1RM)
    ? detectStrengthBias(
        pullUpMax ?? null,
        dipMax ?? null,
        profile.deadlift1RM,
        bodyweight ?? null,
        primaryGoal
      )
    : null
  
  // Initialize fatigue state (will be updated during session planning)
  const currentFatigueState: FatigueState = {
    neural: 0,
    posterior_chain: 0,
    pulling: 0,
    pushing: 0,
    grip: 0,
    spinal: 0,
  }
  
  // Determine if we should reduce pull/hinge volume
  const shouldReducePullVolume = profile.modality === 'streetlifting_biased' && deadliftCheck.eligible
  const shouldReduceHingeAccessories = deadliftCheck.eligible
  
  // Build intelligent explanations
  const intelligentExplanations: string[] = []
  if (strengthMethodId) {
    const summaries = generateWeeklySummary(strengthMethodId, frequencyRec, strengthBias || {
      pullStrength: 'average',
      pushStrength: 'average',
      legStrength: 'average',
      coreStrength: 'average',
      overallBias: 'balanced',
      recommendations: [],
    })
    intelligentExplanations.push(...summaries)
  }
  
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
    
    // Intelligence engine extensions
    strengthMethodId,
    currentFatigueState,
    progressionModel: progressionRec?.model ?? null,
    strengthBias,
    intelligentExplanations,
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
// INTELLIGENT SESSION PLANNING
// =============================================================================

/**
 * Plan session with fatigue-aware exercise selection
 * Uses the strength intelligence engine to prevent overload
 */
export function planIntelligentHybridSession(
  context: HybridProgrammingContext,
  plannedExercises: string[],
  sessionIntensity: IntensityZone,
  sets: number
): {
  approvedExercises: string[]
  volumeReductions: Record<string, number>
  fatigueWarnings: string[]
  sessionExplanation: string
} {
  const volumeReductions: Record<string, number> = {}
  const fatigueWarnings: string[] = []
  let workingFatigue = { ...context.currentFatigueState }
  
  // Check streetlifting coordination if applicable
  if (context.modality === 'streetlifting_biased') {
    const coordination = coordinateStreetliftingSession(
      plannedExercises,
      workingFatigue,
      false // Not competition prep
    )
    
    if (!coordination.canTrainAllThreeToday) {
      fatigueWarnings.push(coordination.reasoning)
      // Apply volume caps
      for (const [exercise, cap] of Object.entries(coordination.volumeCaps)) {
        if (cap === 0) {
          plannedExercises = plannedExercises.filter(e => e !== exercise)
        } else {
          volumeReductions[exercise] = cap / sets
        }
      }
    }
  }
  
  // Check each exercise for fatigue overload
  for (const exerciseId of plannedExercises) {
    const contribution = getExerciseFatigueContribution(exerciseId, sessionIntensity, sets)
    const overloadCheck = checkFatigueOverload(workingFatigue, contribution.fatigueAdded)
    
    if (overloadCheck.overloaded) {
      // Try with reduced volume
      const reducedContribution = getExerciseFatigueContribution(exerciseId, sessionIntensity, Math.ceil(sets * 0.6))
      const reducedCheck = checkFatigueOverload(workingFatigue, reducedContribution.fatigueAdded)
      
      if (reducedCheck.overloaded) {
        fatigueWarnings.push(`${exerciseId} excluded - ${overloadCheck.recommendation}`)
        plannedExercises = plannedExercises.filter(e => e !== exerciseId)
      } else {
        volumeReductions[exerciseId] = 0.6
        fatigueWarnings.push(`${exerciseId} volume reduced 40% - fatigue management`)
        // Add reduced fatigue
        for (const [cat, val] of Object.entries(reducedContribution.fatigueAdded)) {
          workingFatigue[cat as keyof FatigueState] += val as number
        }
      }
    } else {
      // Add full fatigue contribution
      for (const [cat, val] of Object.entries(contribution.fatigueAdded)) {
        workingFatigue[cat as keyof FatigueState] += val as number
      }
    }
  }
  
  // Generate session explanation
  const explanation = generateStrengthExplanation({
    exercise: plannedExercises[0] || 'session',
    intensityZone: sessionIntensity,
    fatigueState: workingFatigue,
    volumeReduction: Object.values(volumeReductions)[0] || 1.0,
    progressionHeld: false,
  })
  
  return {
    approvedExercises: plannedExercises,
    volumeReductions,
    fatigueWarnings,
    sessionExplanation: explanation.body,
  }
}

/**
 * Check if progression should advance, hold, or deload
 */
export function checkProgressionStatus(
  context: HybridProgrammingContext,
  consecutiveFailures: number,
  weeksSinceDeload: number
): { action: 'progress' | 'hold' | 'deload'; reason: string } {
  if (!context.strengthMethodId) {
    return { action: 'progress', reason: 'No strength method active.' }
  }
  
  const progressionCheck = shouldHoldProgression(
    context.currentFatigueState,
    consecutiveFailures,
    weeksSinceDeload,
    context.strengthMethodId
  )
  
  if (progressionCheck.deload) {
    return { action: 'deload', reason: progressionCheck.reason }
  }
  
  if (progressionCheck.hold) {
    return { action: 'hold', reason: progressionCheck.reason }
  }
  
  return { action: 'progress', reason: 'Continue progression.' }
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

// Re-export intelligence engine types and functions for convenience
export {
  type StrengthMethodId,
  type IntensityZone,
  type FatigueState,
  type FatigueCategory,
  type ProgressionModel,
  type StrengthBiasProfile,
  type FrequencyRecommendation,
  STRENGTH_METHOD_PROFILES,
  INTENSITY_ZONES,
  selectStrengthMethod,
  getFrequencyRecommendation,
  getProgressionRecommendation,
  detectStrengthBias,
  checkFatigueOverload,
  getFatigueBasedVolumeReduction,
  getExerciseFatigueContribution,
  coordinateStreetliftingSession,
  shouldHoldProgression,
  generateStrengthExplanation,
  generateWeeklySummary,
  classifyIntensity,
  canStackHeavyLifts,
} from './strength-intelligence-engine'
