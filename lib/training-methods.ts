// Training Method Engine
// Determines HOW exercises are performed within a workout
// Methods can be combined with exercise selection to produce intelligent workouts

import type { ExerciseCategory, MovementPattern } from './adaptive-exercise-pool'
import type { PrimaryGoal, SessionLength } from './program-service'
import type { FatigueSensitivity, EnduranceCompatibility, SessionCapacity } from './athlete-calibration'

// =============================================================================
// ENDURANCE BLOCK TYPES
// =============================================================================

export type EnduranceBlockType = 
  | 'density_finisher'
  | 'core_circuit'
  | 'pull_push_density'
  | 'compression_circuit'
  | 'conditioning_ladder'
  | 'emom_finisher'

export type EnduranceBlockDuration = 4 | 6 | 8 | 10

export interface EnduranceBlockTemplate {
  id: EnduranceBlockType
  name: string
  description: string
  defaultDuration: EnduranceBlockDuration
  minDuration: EnduranceBlockDuration
  maxDuration: EnduranceBlockDuration
  exercises: EnduranceExerciseTemplate[]
  instruction: string
  compatibleGoals: PrimaryGoal[]
  fatigueCost: 'low' | 'moderate' | 'high'
  requiresEquipment: string[]
}

export interface EnduranceExerciseTemplate {
  name: string
  reps: string
  note?: string
  alternatives?: string[]
}

// =============================================================================
// SUPERSET PAIRING TYPES
// =============================================================================

export type SupersetPairingType = 
  | 'pull_push'
  | 'compression_support'
  | 'push_core'
  | 'pull_core'
  | 'upper_mobility'
  | 'antagonist'

export interface SupersetPairing {
  type: SupersetPairingType
  name: string
  description: string
  pattern1: MovementPattern[]
  pattern2: MovementPattern[]
  examples: string[]
  timeEfficiency: number // 0-1, higher = more time saved
  fatigueSynergy: 'low' | 'moderate' | 'high' // How well recovery aligns
}

export const SUPERSET_PAIRINGS: Record<SupersetPairingType, SupersetPairing> = {
  pull_push: {
    type: 'pull_push',
    name: 'Pull + Push Superset',
    description: 'Antagonist pairing for balanced upper body work',
    pattern1: ['vertical_pull', 'horizontal_pull'],
    pattern2: ['vertical_push', 'horizontal_push'],
    examples: ['Ring Rows + Push-Ups', 'Pull-Ups + Dips', 'Bodyweight Rows + Pike Push-Ups'],
    timeEfficiency: 0.8,
    fatigueSynergy: 'low',
  },
  compression_support: {
    type: 'compression_support',
    name: 'Compression + Support',
    description: 'Core compression paired with support holds',
    pattern1: ['compression'],
    pattern2: ['horizontal_push', 'vertical_push'],
    examples: ['L-Sit Hold + Support Hold', 'Compression Pulses + Planche Lean'],
    timeEfficiency: 0.7,
    fatigueSynergy: 'moderate',
  },
  push_core: {
    type: 'push_core',
    name: 'Push + Core',
    description: 'Pushing movement with core activation',
    pattern1: ['horizontal_push', 'vertical_push'],
    pattern2: ['core', 'compression'],
    examples: ['Push-Ups + Hollow Hold', 'Dips + Hanging Knee Raises'],
    timeEfficiency: 0.75,
    fatigueSynergy: 'low',
  },
  pull_core: {
    type: 'pull_core',
    name: 'Pull + Core',
    description: 'Pulling movement with core work',
    pattern1: ['vertical_pull', 'horizontal_pull'],
    pattern2: ['core', 'compression'],
    examples: ['Pull-Ups + Hollow Hold', 'Ring Rows + L-Sit'],
    timeEfficiency: 0.75,
    fatigueSynergy: 'low',
  },
  upper_mobility: {
    type: 'upper_mobility',
    name: 'Upper + Mobility',
    description: 'Strength work paired with active mobility',
    pattern1: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull'],
    pattern2: ['skill'],
    examples: ['Dips + Shoulder Dislocates', 'Pull-Ups + Hanging Stretch'],
    timeEfficiency: 0.6,
    fatigueSynergy: 'low',
  },
  antagonist: {
    type: 'antagonist',
    name: 'Antagonist Superset',
    description: 'Opposing muscle groups for efficient recovery',
    pattern1: ['horizontal_push'],
    pattern2: ['horizontal_pull'],
    examples: ['Push-Ups + Bodyweight Rows', 'Ring Dips + Ring Rows'],
    timeEfficiency: 0.85,
    fatigueSynergy: 'low',
  },
}

// =============================================================================
// DROP SET TYPES - Calisthenics Specific
// =============================================================================

export type DropSetStyle = 
  | 'mechanical'      // Same exercise, easier position
  | 'assistance'      // Add band or support
  | 'regression'      // Move to easier variation

export interface DropSetProgression {
  style: DropSetStyle
  name: string
  description: string
  fromExercise: string
  toExercise: string
  repAdjustment: number // Multiply reps by this factor
}

export const CALISTHENICS_DROP_SETS: DropSetProgression[] = [
  // Push progressions
  {
    style: 'mechanical',
    fromExercise: 'Pseudo Planche Push-Up',
    toExercise: 'Regular Push-Up',
    name: 'Push-Up Mechanical Drop',
    description: 'Reduce lean angle to continue pushing',
    repAdjustment: 1.3,
  },
  {
    style: 'regression',
    fromExercise: 'Ring Dips',
    toExercise: 'Bar Dips',
    name: 'Dip Stability Drop',
    description: 'Move to more stable surface',
    repAdjustment: 1.2,
  },
  {
    style: 'regression',
    fromExercise: 'Archer Push-Up',
    toExercise: 'Wide Push-Up',
    name: 'Push-Up Width Drop',
    description: 'Reduce unilateral demand',
    repAdjustment: 1.4,
  },
  // Pull progressions
  {
    style: 'mechanical',
    fromExercise: 'Wide Pull-Up',
    toExercise: 'Regular Pull-Up',
    name: 'Pull-Up Grip Drop',
    description: 'Move to stronger grip position',
    repAdjustment: 1.2,
  },
  {
    style: 'regression',
    fromExercise: 'Pull-Up',
    toExercise: 'Bodyweight Row',
    name: 'Vertical to Horizontal Drop',
    description: 'Reduce intensity by changing angle',
    repAdjustment: 1.5,
  },
  {
    style: 'assistance',
    fromExercise: 'Pull-Up',
    toExercise: 'Band-Assisted Pull-Up',
    name: 'Band-Assisted Drop',
    description: 'Add band assistance to continue',
    repAdjustment: 1.3,
  },
  // Compression progressions
  {
    style: 'mechanical',
    fromExercise: 'L-Sit Hold',
    toExercise: 'Tuck L-Sit Hold',
    name: 'L-Sit Tuck Drop',
    description: 'Reduce lever length',
    repAdjustment: 1.5,
  },
  {
    style: 'mechanical',
    fromExercise: 'V-Sit Hold',
    toExercise: 'L-Sit Hold',
    name: 'V-Sit to L-Sit Drop',
    description: 'Reduce compression demand',
    repAdjustment: 1.3,
  },
]

// =============================================================================
// FAILURE BUDGET MODEL
// =============================================================================

export interface FailureBudget {
  maxHardFailureSetsPerSession: number
  maxNearFailureSetsPerSession: number
  currentHardFailureSets: number
  currentNearFailureSets: number
  budgetRemaining: number // 0-100
}

export interface FailureBudgetContext {
  sessionType: 'skill' | 'strength' | 'endurance' | 'mixed'
  primaryGoal: PrimaryGoal
  fatigueSensitivity: FatigueSensitivity
  currentFatigueScore: number // 0-100
  sessionNeuralDemand: 'low' | 'moderate' | 'high'
}

/**
 * Calculate the failure budget for a session
 * Returns conservative limits based on athlete profile and session type
 */
export function calculateFailureBudget(context: FailureBudgetContext): FailureBudget {
  const { sessionType, primaryGoal, fatigueSensitivity, currentFatigueScore, sessionNeuralDemand } = context

  // Base limits
  let maxHard = 2
  let maxNear = 6

  // Adjust for session type
  if (sessionType === 'skill') {
    maxHard = 0 // No true failure on skill work
    maxNear = 2
  } else if (sessionType === 'strength') {
    maxHard = 1
    maxNear = 4
  } else if (sessionType === 'endurance') {
    maxHard = 2
    maxNear = 8 // More near-failure tolerance for conditioning
  }

  // Adjust for goal
  if (primaryGoal === 'skill') {
    maxHard = Math.min(maxHard, 1)
    maxNear = Math.min(maxNear, 3)
  }

  // Adjust for fatigue sensitivity
  if (fatigueSensitivity === 'high') {
    maxHard = Math.max(0, maxHard - 1)
    maxNear = Math.max(2, maxNear - 2)
  } else if (fatigueSensitivity === 'low') {
    maxNear += 2
  }

  // Adjust for current fatigue
  if (currentFatigueScore > 70) {
    maxHard = 0
    maxNear = Math.max(2, maxNear - 3)
  } else if (currentFatigueScore > 50) {
    maxHard = Math.max(0, maxHard - 1)
    maxNear = Math.max(2, maxNear - 1)
  }

  // Adjust for neural demand
  if (sessionNeuralDemand === 'high') {
    maxHard = Math.min(maxHard, 1)
    maxNear = Math.max(2, maxNear - 2)
  }

  return {
    maxHardFailureSetsPerSession: maxHard,
    maxNearFailureSetsPerSession: maxNear,
    currentHardFailureSets: 0,
    currentNearFailureSets: 0,
    budgetRemaining: 100,
  }
}

/**
 * Check if a training method is safe given the current failure budget
 */
export function isMethodSafeForBudget(
  method: TrainingMethod,
  failureRisk: 'low' | 'moderate' | 'high',
  budget: FailureBudget
): { safe: boolean; reason: string } {
  // High-intensity methods with high-risk exercises
  if (method === 'drop_set' || method === 'rest_pause') {
    if (failureRisk === 'high') {
      if (budget.currentNearFailureSets >= budget.maxNearFailureSetsPerSession - 1) {
        return { safe: false, reason: 'Failure budget nearly exhausted' }
      }
    }
  }

  // Density blocks can accumulate fatigue
  if (method === 'density_block' && budget.currentNearFailureSets >= budget.maxNearFailureSetsPerSession) {
    return { safe: false, reason: 'Near-failure budget exhausted' }
  }

  return { safe: true, reason: 'Within failure budget' }
}

/**
 * Get failure risk for an exercise based on category and neural demand
 */
export function getDefaultFailureRisk(
  category: ExerciseCategory,
  neuralDemand: number,
  movementPattern: MovementPattern
): 'low' | 'moderate' | 'high' {
  // Skill exercises are always high risk near failure
  if (category === 'skill' || neuralDemand >= 4) {
    return 'high'
  }

  // Transition movements (like muscle-ups) are high risk
  if (movementPattern === 'transition') {
    return 'high'
  }

  // Compression work is moderate risk
  if (movementPattern === 'compression') {
    return 'moderate'
  }

  // Strength exercises with moderate neural demand
  if (category === 'strength' && neuralDemand >= 3) {
    return 'moderate'
  }

  // Core and accessory work is generally lower risk
  if (category === 'core' || category === 'accessory') {
    return 'low'
  }

  return 'moderate'
}

// =============================================================================
// CORE TYPES
// =============================================================================

export type TrainingMethod =
  | 'straight_sets'
  | 'superset'
  | 'density_block'
  | 'drop_set'
  | 'ladder'
  | 'emom'
  | 'cluster_set'
  | 'rest_pause'

export type MethodIntensity = 'low' | 'moderate' | 'high'

export interface MethodCompatibility {
  straightSets: boolean
  superset: boolean
  density: boolean
  dropSet: boolean
  ladder: boolean
  emom: boolean
  clusterSet: boolean
  restPause: boolean
}

// Default compatibility for exercises that don't specify
export const DEFAULT_METHOD_COMPATIBILITY: MethodCompatibility = {
  straightSets: true,
  superset: false,
  density: false,
  dropSet: false,
  ladder: false,
  emom: false,
  clusterSet: false,
  restPause: false,
}

// =============================================================================
// METHOD DEFINITIONS
// =============================================================================

export interface TrainingMethodDefinition {
  id: TrainingMethod
  name: string
  description: string
  intensity: MethodIntensity
  fatigueCostMultiplier: number // 1.0 = normal, 1.3 = 30% more fatiguing
  timePerSetMultiplier: number // Affects session length estimation
  bestFor: PrimaryGoal[]
  notRecommendedFor: ExerciseCategory[]
  minExercises: number
  maxExercises: number
  requiresSimilarMovement: boolean // e.g., supersets work best with opposing movements
  restBetweenSets: number // seconds
  restBetweenExercises: number // seconds (for supersets/blocks)
}

export const TRAINING_METHODS: Record<TrainingMethod, TrainingMethodDefinition> = {
  straight_sets: {
    id: 'straight_sets',
    name: 'Straight Sets',
    description: 'Traditional sets with rest between each set',
    intensity: 'moderate',
    fatigueCostMultiplier: 1.0,
    timePerSetMultiplier: 1.0,
    bestFor: ['skill', 'strength', 'endurance', 'abs', 'general'],
    notRecommendedFor: [],
    minExercises: 1,
    maxExercises: 1,
    requiresSimilarMovement: false,
    restBetweenSets: 90,
    restBetweenExercises: 0,
  },
  superset: {
    id: 'superset',
    name: 'Superset',
    description: 'Two exercises performed back-to-back with minimal rest',
    intensity: 'moderate',
    fatigueCostMultiplier: 1.2,
    timePerSetMultiplier: 0.75, // More time efficient
    bestFor: ['strength', 'endurance', 'general'],
    notRecommendedFor: ['skill'],
    minExercises: 2,
    maxExercises: 2,
    requiresSimilarMovement: false, // Best with opposing muscle groups
    restBetweenSets: 60,
    restBetweenExercises: 10,
  },
  density_block: {
    id: 'density_block',
    name: 'Density Block',
    description: 'Multiple exercises in a timed circuit for maximum work in minimum time',
    intensity: 'high',
    fatigueCostMultiplier: 1.4,
    timePerSetMultiplier: 0.6,
    bestFor: ['endurance', 'abs', 'general'],
    notRecommendedFor: ['skill'],
    minExercises: 3,
    maxExercises: 5,
    requiresSimilarMovement: false,
    restBetweenSets: 0,
    restBetweenExercises: 15,
  },
  drop_set: {
    id: 'drop_set',
    name: 'Drop Set',
    description: 'Reduce resistance/difficulty and continue without rest',
    intensity: 'high',
    fatigueCostMultiplier: 1.5,
    timePerSetMultiplier: 1.3,
    bestFor: ['strength', 'endurance'],
    notRecommendedFor: ['skill', 'warmup', 'cooldown'],
    minExercises: 1,
    maxExercises: 1,
    requiresSimilarMovement: true,
    restBetweenSets: 120,
    restBetweenExercises: 0,
  },
  ladder: {
    id: 'ladder',
    name: 'Ladder',
    description: 'Ascending or descending rep scheme (1-2-3-4-5 or 5-4-3-2-1)',
    intensity: 'moderate',
    fatigueCostMultiplier: 1.1,
    timePerSetMultiplier: 0.9,
    bestFor: ['strength', 'endurance', 'general'],
    notRecommendedFor: ['skill'],
    minExercises: 1,
    maxExercises: 2,
    requiresSimilarMovement: false,
    restBetweenSets: 45,
    restBetweenExercises: 30,
  },
  emom: {
    id: 'emom',
    name: 'EMOM',
    description: 'Every Minute On the Minute - perform reps at the start of each minute',
    intensity: 'moderate',
    fatigueCostMultiplier: 1.2,
    timePerSetMultiplier: 0.8,
    bestFor: ['endurance', 'strength', 'general'],
    notRecommendedFor: ['skill'],
    minExercises: 1,
    maxExercises: 3,
    requiresSimilarMovement: false,
    restBetweenSets: 0, // Rest is built into the minute
    restBetweenExercises: 0,
  },
  cluster_set: {
    id: 'cluster_set',
    name: 'Cluster Set',
    description: 'Brief intra-set rest periods to maintain quality on heavy work',
    intensity: 'high',
    fatigueCostMultiplier: 1.1,
    timePerSetMultiplier: 1.4,
    bestFor: ['strength', 'skill'],
    notRecommendedFor: ['warmup', 'cooldown'],
    minExercises: 1,
    maxExercises: 1,
    requiresSimilarMovement: true,
    restBetweenSets: 120,
    restBetweenExercises: 0,
  },
  rest_pause: {
    id: 'rest_pause',
    name: 'Rest-Pause',
    description: 'Short rest periods within a set to extend total reps',
    intensity: 'high',
    fatigueCostMultiplier: 1.4,
    timePerSetMultiplier: 1.2,
    bestFor: ['strength', 'endurance'],
    notRecommendedFor: ['skill', 'warmup', 'cooldown'],
    minExercises: 1,
    maxExercises: 1,
    requiresSimilarMovement: true,
    restBetweenSets: 120,
    restBetweenExercises: 0,
  },
}

// =============================================================================
// TRAINING BLOCK MODEL
// =============================================================================

export interface TrainingBlock {
  id: string
  method: TrainingMethod
  exercises: TrainingBlockExercise[]
  sets: number
  durationMinutes?: number // For timed blocks like density/EMOM
  restBetweenSets: number // seconds
  notes?: string
}

export interface TrainingBlockExercise {
  exerciseId: string
  name: string
  repsOrTime: string
  note?: string
}

// =============================================================================
// METHOD COMPATIBILITY PRESETS
// =============================================================================

// Standard method compatibility by exercise category
export function getDefaultMethodCompatibility(
  category: ExerciseCategory,
  movementPattern: MovementPattern,
  neuralDemand: number
): MethodCompatibility {
  // Skill work should almost always be straight sets
  if (category === 'skill' || neuralDemand >= 4) {
    return {
      straightSets: true,
      superset: false,
      density: false,
      dropSet: false,
      ladder: false,
      emom: false,
      clusterSet: neuralDemand >= 4, // Cluster sets can help skill work
      restPause: false,
    }
  }

  // Heavy strength work
  if (category === 'strength') {
    return {
      straightSets: true,
      superset: true,
      density: false,
      dropSet: true,
      ladder: true,
      emom: true,
      clusterSet: true,
      restPause: true,
    }
  }

  // Accessory work - most methods work
  if (category === 'accessory') {
    return {
      straightSets: true,
      superset: true,
      density: true,
      dropSet: true,
      ladder: true,
      emom: true,
      clusterSet: false,
      restPause: true,
    }
  }

  // Core work - good for density and supersets
  if (category === 'core' || movementPattern === 'compression') {
    return {
      straightSets: true,
      superset: true,
      density: true,
      dropSet: false,
      ladder: true,
      emom: true,
      clusterSet: false,
      restPause: false,
    }
  }

  // Warmup/cooldown - straight sets only
  if (category === 'warmup' || category === 'cooldown') {
    return {
      straightSets: true,
      superset: false,
      density: false,
      dropSet: false,
      ladder: false,
      emom: false,
      clusterSet: false,
      restPause: false,
    }
  }

  return DEFAULT_METHOD_COMPATIBILITY
}

// =============================================================================
// METHOD SELECTION RULES
// =============================================================================

export interface MethodSelectionContext {
  primaryGoal: PrimaryGoal
  sessionLength: SessionLength
  exerciseCategory: ExerciseCategory
  movementPattern: MovementPattern
  neuralDemand: number
  fatigueBudgetRemaining: number // 0-100
  isEndOfSession: boolean
  athleteFatigueSensitivity?: 'high' | 'moderate' | 'low'
}

export interface MethodSelectionResult {
  recommendedMethod: TrainingMethod
  alternativeMethods: TrainingMethod[]
  rationale: string
}

/**
 * Select the optimal training method based on context
 * Falls back to straight_sets if no better option
 */
export function selectTrainingMethod(
  context: MethodSelectionContext,
  compatibility: MethodCompatibility
): MethodSelectionResult {
  const {
    primaryGoal,
    sessionLength,
    exerciseCategory,
    neuralDemand,
    fatigueBudgetRemaining,
    isEndOfSession,
    athleteFatigueSensitivity = 'moderate',
  } = context

  // RULE 1: Skill training = straight sets (or cluster sets for heavy skill work)
  if (exerciseCategory === 'skill' || neuralDemand >= 4) {
    if (compatibility.clusterSet && neuralDemand >= 4) {
      return {
        recommendedMethod: 'cluster_set',
        alternativeMethods: ['straight_sets'],
        rationale: 'Cluster sets help maintain quality on high-skill work',
      }
    }
    return {
      recommendedMethod: 'straight_sets',
      alternativeMethods: [],
      rationale: 'Skill work requires full focus and recovery between sets',
    }
  }

  // RULE 2: Heavy strength work = straight sets or light supersets
  if (exerciseCategory === 'strength' && neuralDemand >= 3) {
    if (compatibility.superset && fatigueBudgetRemaining > 50) {
      return {
        recommendedMethod: 'straight_sets',
        alternativeMethods: ['superset', 'cluster_set'],
        rationale: 'Heavy strength work benefits from adequate rest',
      }
    }
    return {
      recommendedMethod: 'straight_sets',
      alternativeMethods: compatibility.restPause ? ['rest_pause'] : [],
      rationale: 'Prioritize quality reps for strength development',
    }
  }

  // RULE 3: Endurance/conditioning goals = density blocks or ladders
  if (primaryGoal === 'endurance' && compatibility.density) {
    if (isEndOfSession && fatigueBudgetRemaining > 30) {
      return {
        recommendedMethod: 'density_block',
        alternativeMethods: ['emom', 'ladder'],
        rationale: 'Density work builds conditioning efficiently',
      }
    }
  }

  // RULE 4: Short sessions (20-30 min) = allow density finishers
  if ((sessionLength === '20-30' || sessionLength === '30-45') && isEndOfSession) {
    if (compatibility.density && exerciseCategory !== 'skill') {
      return {
        recommendedMethod: 'superset',
        alternativeMethods: ['density_block', 'emom'],
        rationale: 'Time-efficient methods for shorter sessions',
      }
    }
  }

  // RULE 5: Abs goal with core exercises = density or supersets
  if (primaryGoal === 'abs' && exerciseCategory === 'core') {
    if (compatibility.density) {
      return {
        recommendedMethod: isEndOfSession ? 'density_block' : 'superset',
        alternativeMethods: ['ladder', 'emom'],
        rationale: 'Core work responds well to higher density training',
      }
    }
  }

  // RULE 6: Low fatigue budget = straight sets to conserve energy
  if (fatigueBudgetRemaining < 30 || athleteFatigueSensitivity === 'high') {
    return {
      recommendedMethod: 'straight_sets',
      alternativeMethods: [],
      rationale: 'Conserving energy with traditional sets',
    }
  }

  // RULE 7: Accessory work at end of session = supersets for efficiency
  if (exerciseCategory === 'accessory' && isEndOfSession && compatibility.superset) {
    return {
      recommendedMethod: 'superset',
      alternativeMethods: ['straight_sets', 'ladder'],
      rationale: 'Supersets make accessory work time-efficient',
    }
  }

  // DEFAULT: Straight sets (safe fallback)
  return {
    recommendedMethod: 'straight_sets',
    alternativeMethods: [],
    rationale: 'Standard approach for this exercise type',
  }
}

// =============================================================================
// BLOCK GENERATION
// =============================================================================

export interface BlockGenerationInput {
  exercises: Array<{
    id: string
    name: string
    category: ExerciseCategory
    movementPattern: MovementPattern
    neuralDemand: number
    defaultSets: number
    defaultRepsOrTime: string
    note?: string
  }>
  method: TrainingMethod
  goalSets?: number
  durationMinutes?: number
}

/**
 * Generate a training block from exercises and method
 */
export function generateTrainingBlock(input: BlockGenerationInput): TrainingBlock {
  const { exercises, method, goalSets, durationMinutes } = input
  const methodDef = TRAINING_METHODS[method]

  // Validate exercise count for method
  if (exercises.length < methodDef.minExercises) {
    // Fall back to straight sets if not enough exercises
    return generateTrainingBlock({ ...input, method: 'straight_sets' })
  }

  if (exercises.length > methodDef.maxExercises) {
    // Trim to max allowed
    exercises.splice(methodDef.maxExercises)
  }

  const blockExercises: TrainingBlockExercise[] = exercises.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    repsOrTime: ex.defaultRepsOrTime,
    note: ex.note,
  }))

  // Determine sets based on method
  let sets = goalSets || exercises[0]?.defaultSets || 3

  // Adjust sets for method
  if (method === 'density_block' || method === 'emom') {
    sets = 1 // These are timed, not set-based
  }

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    method,
    exercises: blockExercises,
    sets,
    durationMinutes: durationMinutes || (method === 'density_block' ? 6 : method === 'emom' ? 8 : undefined),
    restBetweenSets: methodDef.restBetweenSets,
    notes: methodDef.description,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a method is compatible with an exercise
 */
export function isMethodCompatible(
  method: TrainingMethod,
  compatibility: MethodCompatibility
): boolean {
  switch (method) {
    case 'straight_sets': return compatibility.straightSets
    case 'superset': return compatibility.superset
    case 'density_block': return compatibility.density
    case 'drop_set': return compatibility.dropSet
    case 'ladder': return compatibility.ladder
    case 'emom': return compatibility.emom
    case 'cluster_set': return compatibility.clusterSet
    case 'rest_pause': return compatibility.restPause
    default: return false
  }
}

/**
 * Get all compatible methods for an exercise
 */
export function getCompatibleMethods(compatibility: MethodCompatibility): TrainingMethod[] {
  const methods: TrainingMethod[] = []
  if (compatibility.straightSets) methods.push('straight_sets')
  if (compatibility.superset) methods.push('superset')
  if (compatibility.density) methods.push('density_block')
  if (compatibility.dropSet) methods.push('drop_set')
  if (compatibility.ladder) methods.push('ladder')
  if (compatibility.emom) methods.push('emom')
  if (compatibility.clusterSet) methods.push('cluster_set')
  if (compatibility.restPause) methods.push('rest_pause')
  return methods
}

/**
 * Estimate time for a training block
 */
export function estimateBlockTime(block: TrainingBlock): number {
  const methodDef = TRAINING_METHODS[block.method]

  // Timed blocks
  if (block.durationMinutes) {
    return block.durationMinutes
  }

  // Set-based blocks
  const baseTimePerSet = 1.5 // minutes per set on average
  const exerciseCount = block.exercises.length
  const totalSets = block.sets * exerciseCount
  const restTime = (block.sets - 1) * (methodDef.restBetweenSets / 60)

  return Math.ceil(
    (totalSets * baseTimePerSet * methodDef.timePerSetMultiplier) + restTime
  )
}

/**
 * Get a human-readable label for a method
 */
export function getMethodLabel(method: TrainingMethod): string {
  return TRAINING_METHODS[method]?.name || 'Straight Sets'
}

// =============================================================================
// SUPERSET GENERATION
// =============================================================================

export interface SupersetCandidate {
  exercise1: {
    id: string
    name: string
    movementPattern: MovementPattern
    category: ExerciseCategory
    neuralDemand: number
    failureRisk: 'low' | 'moderate' | 'high'
  }
  exercise2: {
    id: string
    name: string
    movementPattern: MovementPattern
    category: ExerciseCategory
    neuralDemand: number
    failureRisk: 'low' | 'moderate' | 'high'
  }
}

export interface SupersetResult {
  canSuperset: boolean
  pairingType: SupersetPairingType | null
  label: string
  rationale: string
  timeEfficiency: number
}

/**
 * Determine if two exercises can be supersetted and what type
 */
export function evaluateSupersetPairing(candidate: SupersetCandidate): SupersetResult {
  const { exercise1, exercise2 } = candidate

  // RULE: Do NOT superset high neural demand exercises
  if (exercise1.neuralDemand >= 4 || exercise2.neuralDemand >= 4) {
    return {
      canSuperset: false,
      pairingType: null,
      label: 'Straight Sets',
      rationale: 'High neural demand exercises require full rest',
      timeEfficiency: 1.0,
    }
  }

  // RULE: Do NOT superset skill work
  if (exercise1.category === 'skill' || exercise2.category === 'skill') {
    return {
      canSuperset: false,
      pairingType: null,
      label: 'Straight Sets',
      rationale: 'Skill work requires focused practice',
      timeEfficiency: 1.0,
    }
  }

  // RULE: Do NOT superset two high failure risk exercises
  if (exercise1.failureRisk === 'high' && exercise2.failureRisk === 'high') {
    return {
      canSuperset: false,
      pairingType: null,
      label: 'Straight Sets',
      rationale: 'Both exercises have high failure risk',
      timeEfficiency: 1.0,
    }
  }

  // Check for pull + push pairing
  const isPullPush = (
    (['vertical_pull', 'horizontal_pull'].includes(exercise1.movementPattern) &&
     ['vertical_push', 'horizontal_push'].includes(exercise2.movementPattern)) ||
    (['vertical_push', 'horizontal_push'].includes(exercise1.movementPattern) &&
     ['vertical_pull', 'horizontal_pull'].includes(exercise2.movementPattern))
  )
  
  if (isPullPush) {
    return {
      canSuperset: true,
      pairingType: 'pull_push',
      label: 'Pull + Push Superset',
      rationale: 'Antagonist pairing allows efficient recovery',
      timeEfficiency: SUPERSET_PAIRINGS.pull_push.timeEfficiency,
    }
  }

  // Check for push + core
  const isPushCore = (
    (['vertical_push', 'horizontal_push'].includes(exercise1.movementPattern) &&
     ['core', 'compression'].includes(exercise2.movementPattern)) ||
    (['core', 'compression'].includes(exercise1.movementPattern) &&
     ['vertical_push', 'horizontal_push'].includes(exercise2.movementPattern))
  )
  
  if (isPushCore) {
    return {
      canSuperset: true,
      pairingType: 'push_core',
      label: 'Push + Core Superset',
      rationale: 'Core work pairs well with pushing movements',
      timeEfficiency: SUPERSET_PAIRINGS.push_core.timeEfficiency,
    }
  }

  // Check for pull + core
  const isPullCore = (
    (['vertical_pull', 'horizontal_pull'].includes(exercise1.movementPattern) &&
     ['core', 'compression'].includes(exercise2.movementPattern)) ||
    (['core', 'compression'].includes(exercise1.movementPattern) &&
     ['vertical_pull', 'horizontal_pull'].includes(exercise2.movementPattern))
  )
  
  if (isPullCore) {
    return {
      canSuperset: true,
      pairingType: 'pull_core',
      label: 'Pull + Core Superset',
      rationale: 'Core work pairs well with pulling movements',
      timeEfficiency: SUPERSET_PAIRINGS.pull_core.timeEfficiency,
    }
  }

  // Check for compression + support
  const isCompressionSupport = (
    (exercise1.movementPattern === 'compression' &&
     ['horizontal_push', 'vertical_push'].includes(exercise2.movementPattern)) ||
    (['horizontal_push', 'vertical_push'].includes(exercise1.movementPattern) &&
     exercise2.movementPattern === 'compression')
  )
  
  if (isCompressionSupport) {
    return {
      canSuperset: true,
      pairingType: 'compression_support',
      label: 'Compression + Support Superset',
      rationale: 'Compression pairs with support work for L-sit development',
      timeEfficiency: SUPERSET_PAIRINGS.compression_support.timeEfficiency,
    }
  }

  // Default: can superset accessory work
  if (exercise1.category === 'accessory' && exercise2.category === 'accessory') {
    return {
      canSuperset: true,
      pairingType: 'antagonist',
      label: 'Accessory Superset',
      rationale: 'Accessory exercises pair efficiently',
      timeEfficiency: 0.7,
    }
  }

  return {
    canSuperset: false,
    pairingType: null,
    label: 'Straight Sets',
    rationale: 'Exercises do not form an efficient pairing',
    timeEfficiency: 1.0,
  }
}

// =============================================================================
// DROP SET GENERATION
// =============================================================================

export interface DropSetResult {
  canDropSet: boolean
  progression: DropSetProgression | null
  label: string
  rationale: string
}

/**
 * Check if an exercise can use drop sets and find appropriate progression
 */
export function evaluateDropSet(
  exerciseName: string,
  exerciseCategory: ExerciseCategory,
  failureRisk: 'low' | 'moderate' | 'high',
  budget: FailureBudget
): DropSetResult {
  // RULE: Never drop set skill work
  if (exerciseCategory === 'skill') {
    return {
      canDropSet: false,
      progression: null,
      label: 'Not Applicable',
      rationale: 'Skill work should not use drop sets',
    }
  }

  // RULE: Check failure budget
  if (budget.currentNearFailureSets >= budget.maxNearFailureSetsPerSession - 1) {
    return {
      canDropSet: false,
      progression: null,
      label: 'Budget Exceeded',
      rationale: 'Near-failure budget would be exceeded',
    }
  }

  // RULE: High failure risk exercises need extra caution
  if (failureRisk === 'high' && budget.currentNearFailureSets >= budget.maxNearFailureSetsPerSession / 2) {
    return {
      canDropSet: false,
      progression: null,
      label: 'Not Recommended',
      rationale: 'High-risk exercise with limited failure budget',
    }
  }

  // Find matching drop set progression
  const progression = CALISTHENICS_DROP_SETS.find(
    ds => ds.fromExercise.toLowerCase() === exerciseName.toLowerCase()
  )

  if (progression) {
    return {
      canDropSet: true,
      progression,
      label: `Mechanical Drop Set`,
      rationale: `${progression.fromExercise} → ${progression.toExercise}`,
    }
  }

  // No specific progression found
  return {
    canDropSet: false,
    progression: null,
    label: 'No Progression',
    rationale: 'No suitable drop set progression available',
  }
}

// =============================================================================
// IMPROVED METHOD SELECTION - FINAL DECISION RULES
// =============================================================================

export interface ImprovedMethodContext extends MethodSelectionContext {
  failureBudget: FailureBudget
  exerciseFailureRisk: 'low' | 'moderate' | 'high'
  hasMatchingExerciseForSuperset: boolean
  supersetCandidate?: SupersetCandidate
}

/**
 * Improved method selection with superset, drop set, and failure budget awareness
 */
export function selectMethodWithBudget(
  context: ImprovedMethodContext,
  compatibility: MethodCompatibility
): MethodSelectionResult {
  const {
    primaryGoal,
    sessionLength,
    exerciseCategory,
    neuralDemand,
    fatigueBudgetRemaining,
    isEndOfSession,
    athleteFatigueSensitivity = 'moderate',
    failureBudget,
    exerciseFailureRisk,
    hasMatchingExerciseForSuperset,
    supersetCandidate,
  } = context

  // STRAIGHT SETS: Skill work, primary max-strength, technical progressions
  if (exerciseCategory === 'skill' || neuralDemand >= 4) {
    if (compatibility.clusterSet && neuralDemand >= 4) {
      return {
        recommendedMethod: 'cluster_set',
        alternativeMethods: ['straight_sets'],
        rationale: 'Cluster sets maintain quality on demanding skill work',
      }
    }
    return {
      recommendedMethod: 'straight_sets',
      alternativeMethods: [],
      rationale: 'Skill work requires full focus and recovery between sets',
    }
  }

  // SUPERSETS: Accessory work, short-session efficiency, antagonist work
  if (compatibility.superset && hasMatchingExerciseForSuperset && supersetCandidate) {
    const supersetResult = evaluateSupersetPairing(supersetCandidate)
    
    if (supersetResult.canSuperset) {
      // Check if session length benefits from supersets
      const isShortSession = sessionLength === '10-20' || sessionLength === '20-30' || sessionLength === '30-45'
      const isAccessoryWork = exerciseCategory === 'accessory' || exerciseCategory === 'core'
      
      if (isShortSession || (isAccessoryWork && isEndOfSession)) {
        return {
          recommendedMethod: 'superset',
          alternativeMethods: ['straight_sets'],
          rationale: supersetResult.rationale,
        }
      }
    }
  }

  // DROP SETS: Carefully selected accessory work, mechanical regression
  if (compatibility.dropSet && exerciseCategory === 'accessory') {
    const budgetSafe = isMethodSafeForBudget('drop_set', exerciseFailureRisk, failureBudget)
    
    if (budgetSafe.safe && primaryGoal !== 'skill' && athleteFatigueSensitivity !== 'high') {
      // Only use drop sets for endurance/hypertrophy emphasis
      if (primaryGoal === 'endurance' || (primaryGoal === 'strength' && isEndOfSession)) {
        return {
          recommendedMethod: 'drop_set',
          alternativeMethods: ['straight_sets', 'rest_pause'],
          rationale: 'Controlled drop set for additional volume',
        }
      }
    }
  }

  // DENSITY BLOCKS: Endurance exposure, short finishers, core circuits
  if (compatibility.density && isEndOfSession) {
    const budgetSafe = isMethodSafeForBudget('density_block', exerciseFailureRisk, failureBudget)
    
    if (budgetSafe.safe) {
      if (primaryGoal === 'endurance' || primaryGoal === 'abs') {
        return {
          recommendedMethod: 'density_block',
          alternativeMethods: ['emom', 'ladder'],
          rationale: 'Density work builds conditioning efficiently',
        }
      }
    }
  }

  // LADDERS: Pull or push endurance, skill-adjacent endurance
  if (compatibility.ladder && (primaryGoal === 'endurance' || primaryGoal === 'general')) {
    if (exerciseCategory === 'strength' && neuralDemand <= 3) {
      return {
        recommendedMethod: 'ladder',
        alternativeMethods: ['straight_sets', 'emom'],
        rationale: 'Ladder builds work capacity with controlled intensity',
      }
    }
  }

  // EMOM: Controlled repeatability, moderate time-boxed blocks
  if (compatibility.emom && primaryGoal === 'endurance' && isEndOfSession) {
    return {
      recommendedMethod: 'emom',
      alternativeMethods: ['density_block', 'straight_sets'],
      rationale: 'EMOM provides structured work capacity training',
    }
  }

  // Low fatigue budget = straight sets to conserve energy
  if (fatigueBudgetRemaining < 30 || athleteFatigueSensitivity === 'high') {
    return {
      recommendedMethod: 'straight_sets',
      alternativeMethods: [],
      rationale: 'Conserving energy with traditional sets',
    }
  }

  // DEFAULT: Straight sets (smallest effective method)
  return {
    recommendedMethod: 'straight_sets',
    alternativeMethods: [],
    rationale: 'Standard approach for focused training',
  }
}

// =============================================================================
// BLOCK OUTPUT FORMATTING
// =============================================================================

export interface FormattedTrainingBlock {
  id: string
  method: TrainingMethod
  label: string
  exercises: Array<{
    prefix: string // A1, A2, or empty
    name: string
    prescription: string // e.g., "x10" or "x6 → x8"
    note?: string
  }>
  instruction: string
  restNote: string
}

/**
 * Format a training block for clean display
 */
export function formatTrainingBlock(
  block: TrainingBlock,
  dropSetProgression?: DropSetProgression | null
): FormattedTrainingBlock {
  const method = TRAINING_METHODS[block.method]
  
  let label = method.name
  let instruction = ''
  let restNote = `Rest ${block.restBetweenSets}s between sets`

  const exercises: FormattedTrainingBlock['exercises'] = []

  switch (block.method) {
    case 'superset':
      label = 'Superset Block'
      instruction = `Perform A1 then A2 back-to-back, then rest.`
      restNote = `Rest ${block.restBetweenSets}s after completing both exercises`
      block.exercises.forEach((ex, i) => {
        exercises.push({
          prefix: `A${i + 1}`,
          name: ex.name,
          prescription: `x${ex.repsOrTime}`,
          note: ex.note,
        })
      })
      break

    case 'drop_set':
      label = 'Mechanical Drop Set'
      instruction = dropSetProgression 
        ? `${dropSetProgression.description}. Continue without rest.`
        : 'Reduce difficulty and continue without rest.'
      restNote = `Rest ${block.restBetweenSets}s between drop set clusters`
      if (dropSetProgression) {
        exercises.push({
          prefix: '',
          name: block.exercises[0]?.name || dropSetProgression.fromExercise,
          prescription: `x${block.exercises[0]?.repsOrTime || '6'}`,
        })
        exercises.push({
          prefix: '→',
          name: dropSetProgression.toExercise,
          prescription: `x${Math.round(parseInt(block.exercises[0]?.repsOrTime || '6') * dropSetProgression.repAdjustment)}`,
          note: 'Continue immediately',
        })
      } else {
        block.exercises.forEach(ex => {
          exercises.push({
            prefix: '',
            name: ex.name,
            prescription: `x${ex.repsOrTime}`,
            note: ex.note,
          })
        })
      }
      break

    case 'density_block':
      label = `${block.durationMinutes || 6}-Minute Density Block`
      instruction = `Complete quality rounds for ${block.durationMinutes || 6} minutes.`
      restNote = 'Rest as needed but keep moving'
      block.exercises.forEach(ex => {
        exercises.push({
          prefix: '•',
          name: ex.name,
          prescription: `x${ex.repsOrTime}`,
          note: ex.note,
        })
      })
      break

    case 'ladder':
      label = 'Conditioning Ladder'
      instruction = 'Complete ladder pattern (1-2-3-4-5 or 5-4-3-2-1).'
      restNote = `Rest ${block.restBetweenSets}s between ladder rungs`
      block.exercises.forEach(ex => {
        exercises.push({
          prefix: '',
          name: ex.name,
          prescription: '1-2-3-4-5',
          note: ex.note || 'Ladder up',
        })
      })
      break

    case 'emom':
      label = `${block.durationMinutes || 8}-Minute EMOM`
      instruction = 'Perform reps at the start of each minute.'
      restNote = 'Rest remaining time in each minute'
      block.exercises.forEach((ex, i) => {
        exercises.push({
          prefix: i % 2 === 0 ? 'Odd:' : 'Even:',
          name: ex.name,
          prescription: `x${ex.repsOrTime}`,
          note: ex.note,
        })
      })
      break

    default:
      // Straight sets, cluster sets, rest-pause
      block.exercises.forEach(ex => {
        exercises.push({
          prefix: '',
          name: ex.name,
          prescription: `${block.sets} × ${ex.repsOrTime}`,
          note: ex.note,
        })
      })
  }

  return {
    id: block.id,
    method: block.method,
    label,
    exercises,
    instruction,
    restNote,
  }
}

/**
 * Safe method selection - always returns straight_sets if anything fails
 */
export function safeSelectMethod(
  context: Partial<MethodSelectionContext>,
  compatibility?: Partial<MethodCompatibility>
): TrainingMethod {
  try {
    const fullContext: MethodSelectionContext = {
      primaryGoal: context.primaryGoal || 'general',
      sessionLength: context.sessionLength || '45-60',
      exerciseCategory: context.exerciseCategory || 'strength',
      movementPattern: context.movementPattern || 'vertical_pull',
      neuralDemand: context.neuralDemand || 2,
      fatigueBudgetRemaining: context.fatigueBudgetRemaining || 100,
      isEndOfSession: context.isEndOfSession || false,
      athleteFatigueSensitivity: context.athleteFatigueSensitivity || 'moderate',
    }

    const fullCompatibility: MethodCompatibility = {
      ...DEFAULT_METHOD_COMPATIBILITY,
      ...compatibility,
    }

    const result = selectTrainingMethod(fullContext, fullCompatibility)
    return result.recommendedMethod
  } catch {
    // Safe fallback
    return 'straight_sets'
  }
}

// =============================================================================
// ENDURANCE BLOCK TEMPLATES
// =============================================================================

export const ENDURANCE_BLOCK_TEMPLATES: Record<EnduranceBlockType, EnduranceBlockTemplate> = {
  density_finisher: {
    id: 'density_finisher',
    name: '6-Minute Density Finisher',
    description: 'Complete quality rounds for time without sacrificing form',
    defaultDuration: 6,
    minDuration: 4,
    maxDuration: 8,
    exercises: [
      { name: 'Pull-Ups', reps: '4', alternatives: ['Bodyweight Rows', 'Ring Rows'] },
      { name: 'Dips', reps: '6', alternatives: ['Push-Ups', 'Ring Dips'] },
      { name: 'Hollow Hold', reps: '20s', alternatives: ['Plank', 'Dead Bug'] },
    ],
    instruction: 'Complete quality rounds for {duration} minutes. Rest as needed but keep moving.',
    compatibleGoals: ['endurance', 'general', 'strength'],
    fatigueCost: 'moderate',
    requiresEquipment: ['pull_bar'],
  },
  core_circuit: {
    id: 'core_circuit',
    name: 'Core Density Block',
    description: 'Focused core work in a time-efficient format',
    defaultDuration: 6,
    minDuration: 4,
    maxDuration: 10,
    exercises: [
      { name: 'Hollow Hold', reps: '20s', alternatives: ['Plank'] },
      { name: 'Hanging Knee Raises', reps: '10', alternatives: ['Lying Leg Raises'] },
      { name: 'Arch Hold', reps: '15s', alternatives: ['Superman Hold'] },
      { name: 'Dead Bug', reps: '10 each', alternatives: ['Bird Dog'] },
    ],
    instruction: 'Cycle through exercises for {duration} minutes. Focus on quality contractions.',
    compatibleGoals: ['abs', 'general', 'endurance'],
    fatigueCost: 'low',
    requiresEquipment: [],
  },
  pull_push_density: {
    id: 'pull_push_density',
    name: 'Pull-Push Density Block',
    description: 'Balanced upper body conditioning',
    defaultDuration: 6,
    minDuration: 4,
    maxDuration: 8,
    exercises: [
      { name: 'Pull-Ups', reps: '5', alternatives: ['Bodyweight Rows'] },
      { name: 'Push-Ups', reps: '10', alternatives: ['Dips'] },
    ],
    instruction: 'Alternate between pulling and pushing for {duration} minutes. Maintain quality reps.',
    compatibleGoals: ['endurance', 'general', 'strength'],
    fatigueCost: 'moderate',
    requiresEquipment: ['pull_bar'],
  },
  compression_circuit: {
    id: 'compression_circuit',
    name: 'Compression Core Block',
    description: 'Hip flexor and compression-focused core work',
    defaultDuration: 6,
    minDuration: 4,
    maxDuration: 8,
    exercises: [
      { name: 'L-Sit Hold', reps: '10-15s', alternatives: ['Tuck L-Sit', 'Seated Leg Lifts'] },
      { name: 'Compression Pulses', reps: '10', alternatives: ['Pike Pulses'] },
      { name: 'Hanging Leg Raises', reps: '8', alternatives: ['Lying Leg Raises'] },
    ],
    instruction: 'Work through compression exercises for {duration} minutes. Build toward longer L-sit holds.',
    compatibleGoals: ['abs', 'skill', 'general'],
    fatigueCost: 'moderate',
    requiresEquipment: ['parallettes'],
  },
  conditioning_ladder: {
    id: 'conditioning_ladder',
    name: 'Conditioning Ladder',
    description: 'Ascending rep ladder for conditioning',
    defaultDuration: 8,
    minDuration: 6,
    maxDuration: 10,
    exercises: [
      { name: 'Push-Ups', reps: '1-2-3-4-5', note: 'Ladder up' },
      { name: 'Bodyweight Rows', reps: '1-2-3-4-5', note: 'Ladder up', alternatives: ['Ring Rows'] },
    ],
    instruction: 'Complete ladder pattern (1-2-3-4-5) for each exercise. Repeat for {duration} minutes.',
    compatibleGoals: ['endurance', 'general'],
    fatigueCost: 'moderate',
    requiresEquipment: [],
  },
  emom_finisher: {
    id: 'emom_finisher',
    name: 'EMOM Finisher',
    description: 'Every minute on the minute work capacity builder',
    defaultDuration: 6,
    minDuration: 4,
    maxDuration: 10,
    exercises: [
      { name: 'Pull-Ups', reps: '3-5', note: 'Odd minutes', alternatives: ['Bodyweight Rows'] },
      { name: 'Dips', reps: '5-8', note: 'Even minutes', alternatives: ['Push-Ups'] },
    ],
    instruction: 'Minute 1: Pull-Ups. Minute 2: Dips. Repeat for {duration} minutes total.',
    compatibleGoals: ['endurance', 'strength', 'general'],
    fatigueCost: 'moderate',
    requiresEquipment: ['pull_bar', 'dip_bars'],
  },
}

// =============================================================================
// ENDURANCE SELECTION ENGINE
// =============================================================================

export interface EnduranceSelectionContext {
  primaryGoal: PrimaryGoal
  sessionLength: SessionLength
  sessionCapacity: SessionCapacity
  enduranceCompatibility: EnduranceCompatibility
  fatigueSensitivity: FatigueSensitivity
  currentFatigueScore?: number // 0-100, higher = more fatigued
  sessionNeuralDemand: 'low' | 'moderate' | 'high'
  timeRemainingMinutes: number
  availableEquipment: string[]
}

export interface EnduranceSelectionResult {
  shouldIncludeEndurance: boolean
  blockType: EnduranceBlockType | null
  duration: EnduranceBlockDuration
  rationale: string
  wasCondensed: boolean
  condensedMessage?: string
}

/**
 * Determine if and what endurance work should be included
 * Uses existing calibration signals to make intelligent decisions
 */
export function selectEnduranceBlock(context: EnduranceSelectionContext): EnduranceSelectionResult {
  const {
    primaryGoal,
    sessionLength,
    sessionCapacity,
    enduranceCompatibility,
    fatigueSensitivity,
    currentFatigueScore = 50,
    sessionNeuralDemand,
    timeRemainingMinutes,
    availableEquipment,
  } = context

  // RULE D: High fatigue sensitivity = reduce or skip endurance
  if (fatigueSensitivity === 'high' && currentFatigueScore > 60) {
    return {
      shouldIncludeEndurance: false,
      blockType: null,
      duration: 4,
      rationale: 'Skipping endurance block due to elevated fatigue',
      wasCondensed: false,
    }
  }

  // RULE E: High neural demand session = short or no endurance
  if (sessionNeuralDemand === 'high') {
    if (timeRemainingMinutes < 6 || fatigueSensitivity === 'high') {
      return {
        shouldIncludeEndurance: false,
        blockType: null,
        duration: 4,
        rationale: 'Session already demanding - skipping finisher to preserve recovery',
        wasCondensed: false,
      }
    }
    // Allow very short finisher only
    return selectShortFinisher(context, 4)
  }

  // RULE F: Skill/strength goal = endurance sparingly
  if (primaryGoal === 'skill' || primaryGoal === 'strength') {
    if (enduranceCompatibility === 'low') {
      return {
        shouldIncludeEndurance: false,
        blockType: null,
        duration: 4,
        rationale: 'Prioritizing skill/strength work over conditioning',
        wasCondensed: false,
      }
    }
    // Short finisher only for skill/strength focused athletes
    return selectShortFinisher(context, 4)
  }

  // RULE A: Endurance goal = more frequent endurance blocks
  if (primaryGoal === 'endurance') {
    const duration = timeRemainingMinutes >= 10 ? 8 : timeRemainingMinutes >= 6 ? 6 : 4
    return selectEnduranceBlockForGoal(context, duration, 'density_finisher')
  }

  // RULE B: Abs goal = core circuits allowed
  if (primaryGoal === 'abs') {
    const duration = timeRemainingMinutes >= 8 ? 6 : 4
    const blockType = selectCoreBlockType(availableEquipment)
    return selectEnduranceBlockForGoal(context, duration as EnduranceBlockDuration, blockType)
  }

  // RULE C: Short sessions = very short density finishers only
  if (sessionLength === '10-20' || sessionLength === '20-30') {
    if (timeRemainingMinutes < 4) {
      return {
        shouldIncludeEndurance: false,
        blockType: null,
        duration: 4,
        rationale: 'Session too short for additional conditioning',
        wasCondensed: true,
        condensedMessage: 'Your routine was condensed to match your available time while prioritizing your main goals.',
      }
    }
    return selectShortFinisher(context, 4)
  }

  // Default: Moderate endurance block for general fitness
  if (primaryGoal === 'general' && enduranceCompatibility !== 'low') {
    const duration = timeRemainingMinutes >= 8 ? 6 : 4
    return selectEnduranceBlockForGoal(context, duration as EnduranceBlockDuration, 'density_finisher')
  }

  // No endurance by default
  return {
    shouldIncludeEndurance: false,
    blockType: null,
    duration: 4,
    rationale: 'No endurance block needed for current session',
    wasCondensed: false,
  }
}

function selectShortFinisher(
  context: EnduranceSelectionContext,
  duration: EnduranceBlockDuration
): EnduranceSelectionResult {
  const blockType = context.primaryGoal === 'abs' 
    ? selectCoreBlockType(context.availableEquipment)
    : 'density_finisher'

  return {
    shouldIncludeEndurance: true,
    blockType,
    duration,
    rationale: 'Short finisher to build work capacity without compromising main training',
    wasCondensed: duration < 6,
    condensedMessage: duration < 6 ? 'Finisher condensed to preserve your primary training focus.' : undefined,
  }
}

function selectEnduranceBlockForGoal(
  context: EnduranceSelectionContext,
  duration: EnduranceBlockDuration,
  preferredBlockType: EnduranceBlockType
): EnduranceSelectionResult {
  // Check equipment compatibility
  const template = ENDURANCE_BLOCK_TEMPLATES[preferredBlockType]
  const hasRequiredEquipment = template.requiresEquipment.every(
    eq => context.availableEquipment.includes(eq) || context.availableEquipment.includes('full_gym')
  )

  let blockType = preferredBlockType
  if (!hasRequiredEquipment) {
    // Fall back to equipment-free option
    blockType = selectCoreBlockType([])
  }

  // Adjust duration based on fatigue
  let adjustedDuration = duration
  if (context.currentFatigueScore && context.currentFatigueScore > 70) {
    adjustedDuration = Math.max(4, duration - 2) as EnduranceBlockDuration
  }

  return {
    shouldIncludeEndurance: true,
    blockType,
    duration: adjustedDuration,
    rationale: `${ENDURANCE_BLOCK_TEMPLATES[blockType].name} selected for ${context.primaryGoal} goal`,
    wasCondensed: adjustedDuration < duration,
    condensedMessage: adjustedDuration < duration 
      ? 'Block shortened based on current recovery status.' 
      : undefined,
  }
}

function selectCoreBlockType(availableEquipment: string[]): EnduranceBlockType {
  const hasParallettes = availableEquipment.includes('parallettes') || 
                         availableEquipment.includes('dip_bars') ||
                         availableEquipment.includes('full_gym')
  
  return hasParallettes ? 'compression_circuit' : 'core_circuit'
}

// =============================================================================
// FINISHER GENERATION
// =============================================================================

export interface GeneratedFinisher {
  id: string
  type: EnduranceBlockType
  name: string
  durationMinutes: number
  exercises: Array<{
    name: string
    reps: string
    note?: string
  }>
  instruction: string
  failureBudgetNote: string
}

/**
 * Generate a finisher block from a template
 * Includes failure budget awareness
 */
export function generateFinisher(
  blockType: EnduranceBlockType,
  duration: EnduranceBlockDuration,
  availableEquipment: string[],
  fatigueSensitivity: FatigueSensitivity
): GeneratedFinisher {
  const template = ENDURANCE_BLOCK_TEMPLATES[blockType]
  
  // Select exercises (use alternatives if needed based on equipment)
  const exercises = template.exercises.map(ex => {
    // Check if we have equipment for primary exercise
    const canDoExercise = canPerformExercise(ex.name, availableEquipment)
    
    if (!canDoExercise && ex.alternatives && ex.alternatives.length > 0) {
      // Find suitable alternative
      const alternative = ex.alternatives.find(alt => canPerformExercise(alt, availableEquipment))
      if (alternative) {
        return { name: alternative, reps: ex.reps, note: ex.note }
      }
    }
    
    return { name: ex.name, reps: ex.reps, note: ex.note }
  })

  // Failure budget note based on fatigue sensitivity
  const failureBudgetNote = getFailureBudgetNote(fatigueSensitivity, template.fatigueCost)

  return {
    id: `finisher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: blockType,
    name: template.name.replace('6-Minute', `${duration}-Minute`),
    durationMinutes: duration,
    exercises,
    instruction: template.instruction.replace('{duration}', duration.toString()),
    failureBudgetNote,
  }
}

function canPerformExercise(exerciseName: string, equipment: string[]): boolean {
  // Equipment requirements mapping
  const requiresEquipment: Record<string, string[]> = {
    'Pull-Ups': ['pull_bar', 'full_gym'],
    'Dips': ['dip_bars', 'full_gym'],
    'Hanging Knee Raises': ['pull_bar', 'full_gym'],
    'Hanging Leg Raises': ['pull_bar', 'full_gym'],
    'L-Sit Hold': ['parallettes', 'dip_bars', 'full_gym'],
    'Tuck L-Sit': ['parallettes', 'dip_bars', 'full_gym'],
    'Ring Rows': ['rings', 'full_gym'],
    'Ring Dips': ['rings', 'full_gym'],
  }

  const required = requiresEquipment[exerciseName]
  if (!required) return true // No equipment needed
  
  return required.some(eq => equipment.includes(eq))
}

function getFailureBudgetNote(
  fatigueSensitivity: FatigueSensitivity,
  blockFatigueCost: 'low' | 'moderate' | 'high'
): string {
  // STEP 5: Failure budget awareness
  if (fatigueSensitivity === 'high') {
    return 'Keep effort sustainable. Stop each set with 2-3 reps in reserve. Quality over quantity.'
  }
  
  if (fatigueSensitivity === 'moderate' && blockFatigueCost === 'high') {
    return 'Challenge yourself but maintain form. Leave 1-2 reps in reserve on each set.'
  }
  
  if (fatigueSensitivity === 'low' && blockFatigueCost !== 'high') {
    return 'Push hard but maintain quality reps. Stop if form breaks down.'
  }
  
  return 'Complete quality rounds without sacrificing form. Rest as needed.'
}

// =============================================================================
// SESSION TIME FITTING
// =============================================================================

export interface SessionTimeFit {
  canFitEndurance: boolean
  recommendedDuration: EnduranceBlockDuration
  wouldCondense: boolean
  condensedMessage?: string
}

/**
 * Determine how endurance work fits into remaining session time
 * STEP 6: Time-aware session fit
 */
export function fitEnduranceToSession(
  sessionLength: SessionLength,
  mainWorkMinutes: number,
  warmupMinutes: number = 5
): SessionTimeFit {
  const sessionMinutes = getSessionMinutes(sessionLength)
  const timeRemaining = sessionMinutes - mainWorkMinutes - warmupMinutes

  // 30-minute session
  if (sessionLength === '20-30' || sessionLength === '30-45') {
    if (timeRemaining >= 6) {
      return { canFitEndurance: true, recommendedDuration: 6, wouldCondense: false }
    }
    if (timeRemaining >= 4) {
      return {
        canFitEndurance: true,
        recommendedDuration: 4,
        wouldCondense: true,
        condensedMessage: 'Your routine was condensed to match your available time while prioritizing your main goals.',
      }
    }
    return { canFitEndurance: false, recommendedDuration: 4, wouldCondense: true }
  }

  // 45-minute session
  if (sessionLength === '45-60') {
    if (timeRemaining >= 8) {
      return { canFitEndurance: true, recommendedDuration: 8, wouldCondense: false }
    }
    if (timeRemaining >= 6) {
      return { canFitEndurance: true, recommendedDuration: 6, wouldCondense: false }
    }
    return { canFitEndurance: timeRemaining >= 4, recommendedDuration: 4, wouldCondense: true }
  }

  // 60+ minute session
  if (sessionLength === '60+') {
    if (timeRemaining >= 10) {
      return { canFitEndurance: true, recommendedDuration: 10, wouldCondense: false }
    }
    return { canFitEndurance: true, recommendedDuration: 8, wouldCondense: false }
  }

  // Default
  return { canFitEndurance: timeRemaining >= 4, recommendedDuration: 4, wouldCondense: true }
}

function getSessionMinutes(sessionLength: SessionLength): number {
  switch (sessionLength) {
    case '10-20': return 15
    case '20-30': return 25
    case '30-45': return 37
    case '45-60': return 52
    case '60+': return 70
    default: return 45
  }
}

// =============================================================================
// FATIGUE-AWARE ADJUSTMENTS
// =============================================================================

export interface FatigueAdjustedBlock {
  originalDuration: EnduranceBlockDuration
  adjustedDuration: EnduranceBlockDuration
  shouldSkip: boolean
  adjustmentReason: string
}

/**
 * Adjust endurance block based on fatigue signals
 * STEP 8: Fatigue integration
 */
export function adjustBlockForFatigue(
  plannedDuration: EnduranceBlockDuration,
  currentFatigueScore: number,
  fatigueSensitivity: FatigueSensitivity
): FatigueAdjustedBlock {
  // Very elevated fatigue = skip finisher
  if (currentFatigueScore > 80 || (currentFatigueScore > 65 && fatigueSensitivity === 'high')) {
    return {
      originalDuration: plannedDuration,
      adjustedDuration: 4,
      shouldSkip: true,
      adjustmentReason: 'Finisher skipped to support recovery',
    }
  }

  // Moderate-high fatigue = reduce duration
  if (currentFatigueScore > 60) {
    const reduced = Math.max(4, plannedDuration - 2) as EnduranceBlockDuration
    return {
      originalDuration: plannedDuration,
      adjustedDuration: reduced,
      shouldSkip: false,
      adjustmentReason: `Block reduced from ${plannedDuration} to ${reduced} minutes based on current recovery`,
    }
  }

  // Normal fatigue = keep as planned
  return {
    originalDuration: plannedDuration,
    adjustedDuration: plannedDuration,
    shouldSkip: false,
    adjustmentReason: 'Block duration maintained',
  }
}

// =============================================================================
// [PHASE 7A] SESSION STYLE STRUCTURING ENGINE
// Applies user training method preferences to session exercise structure
// =============================================================================

export type TrainingMethodPreference = 
  | 'straight_sets'
  | 'supersets'
  | 'circuits'
  | 'drop_sets'
  | 'density_blocks'
  | 'ladder_sets'
  | 'cluster_sets'
  | 'rest_pause'

export interface SessionStyleInput {
  exercises: Array<{
    id: string
    name: string
    category: ExerciseCategory
    movementPattern: MovementPattern
    neuralDemand?: number
    failureRisk?: 'low' | 'moderate' | 'high'
    selectionReason?: string
  }>
  methodPreferences: TrainingMethodPreference[]
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  sessionFocus: string  // 'skill' | 'strength' | 'endurance' | 'mixed'
  availableMinutes: number
  dayNumber: number
}

export interface StyledExerciseGroup {
  id: string
  groupType: 'straight' | 'superset' | 'circuit' | 'density_block' | 'cluster'
  exercises: Array<{
    id: string
    name: string
    prefix?: string  // 'A1', 'A2', etc. for supersets
    trainingMethod: TrainingMethod
    methodRationale: string
  }>
  instruction: string
  restProtocol: string
}

export interface SessionStyleResult {
  styledGroups: StyledExerciseGroup[]
  appliedMethods: TrainingMethodPreference[]
  rejectedMethods: Array<{ method: TrainingMethodPreference; reason: string }>
  styleMetadata: {
    primarySessionStyle: TrainingMethodPreference
    hasSupersetsApplied: boolean
    hasCircuitsApplied: boolean
    hasDensityApplied: boolean
    structureDescription: string
  }
}

/**
 * [PHASE 7A TASK 3] Apply training method preferences to structure a session
 * This converts a flat exercise list into styled groups with appropriate methods
 */
export function applySessionStylePreferences(input: SessionStyleInput): SessionStyleResult {
  const { exercises, methodPreferences, experienceLevel, sessionFocus, availableMinutes, dayNumber } = input
  
  const styledGroups: StyledExerciseGroup[] = []
  const appliedMethods: TrainingMethodPreference[] = []
  const rejectedMethods: Array<{ method: TrainingMethodPreference; reason: string }> = []
  
  // Categorize exercises by type for intelligent grouping
  const skillExercises = exercises.filter(e => e.category === 'skill')
  const strengthExercises = exercises.filter(e => e.category === 'strength')
  const accessoryExercises = exercises.filter(e => e.category === 'accessory')
  const coreExercises = exercises.filter(e => e.category === 'core')
  
  // ==========================================================================
  // [PHASE 7A TASK 4] STYLE FEASIBILITY RULES
  // ==========================================================================
  const feasibleMethods = methodPreferences.filter(method => {
    // Skill-focused sessions protect skill quality
    if (sessionFocus === 'skill' && ['circuits', 'drop_sets', 'rest_pause'].includes(method)) {
      if (skillExercises.length >= exercises.length / 2) {
        rejectedMethods.push({ method, reason: 'skill_quality_protection' })
        return false
      }
    }
    
    // Beginners limited on complex methods
    if (experienceLevel === 'beginner' && ['circuits', 'drop_sets', 'rest_pause', 'cluster_sets'].includes(method)) {
      rejectedMethods.push({ method, reason: 'experience_level_restriction' })
      return false
    }
    
    // Short sessions may need density methods
    if (availableMinutes < 30 && !['supersets', 'density_blocks', 'circuits'].includes(method)) {
      // Don't reject, just note it's less ideal
    }
    
    return true
  })
  
  let groupId = 0
  const usedExerciseIds = new Set<string>()
  
  // ==========================================================================
  // SKILL WORK: Always straight sets or cluster sets (never degrade quality)
  // ==========================================================================
  for (const exercise of skillExercises) {
    if (usedExerciseIds.has(exercise.id)) continue
    usedExerciseIds.add(exercise.id)
    
    const useCluster = feasibleMethods.includes('cluster_sets') && 
                       (exercise.neuralDemand || 0) >= 3
    
    styledGroups.push({
      id: `group_${groupId++}`,
      groupType: useCluster ? 'cluster' : 'straight',
      exercises: [{
        id: exercise.id,
        name: exercise.name,
        trainingMethod: useCluster ? 'cluster_set' : 'straight_sets',
        methodRationale: useCluster 
          ? 'Cluster sets preserve neural quality on demanding skill work'
          : 'Straight sets for focused skill practice',
      }],
      instruction: useCluster 
        ? 'Rest 10-15s between mini-sets within each cluster'
        : 'Full rest between sets for quality',
      restProtocol: '2-3 min between sets',
    })
    
    if (useCluster && !appliedMethods.includes('cluster_sets')) {
      appliedMethods.push('cluster_sets')
    }
  }
  
  // ==========================================================================
  // STRENGTH WORK: Check for superset opportunities with antagonist pairing
  // [PHASE 11] Enhanced to be more willing to create supersets when preferred
  // ==========================================================================
  const strengthNotUsed = strengthExercises.filter(e => !usedExerciseIds.has(e.id))
  const supersetsPreferred = methodPreferences.indexOf('supersets') !== -1 && 
    (methodPreferences.indexOf('supersets') < methodPreferences.indexOf('circuits') || !methodPreferences.includes('circuits'))
  
  if (feasibleMethods.includes('supersets') && strengthNotUsed.length >= 2) {
    // Try to pair antagonist movements first
    const pullStrength = strengthNotUsed.filter(e => 
      ['vertical_pull', 'horizontal_pull'].includes(e.movementPattern)
    )
    const pushStrength = strengthNotUsed.filter(e => 
      ['vertical_push', 'horizontal_push'].includes(e.movementPattern)
    )
    
    // Create pull-push supersets
    const pairCount = Math.min(pullStrength.length, pushStrength.length)
    for (let i = 0; i < pairCount; i++) {
      const pull = pullStrength[i]
      const push = pushStrength[i]
      
      // Don't superset high neural demand
      if ((pull.neuralDemand || 2) >= 4 || (push.neuralDemand || 2) >= 4) {
        continue
      }
      
      usedExerciseIds.add(pull.id)
      usedExerciseIds.add(push.id)
      
      styledGroups.push({
        id: `group_${groupId++}`,
        groupType: 'superset',
        exercises: [
          {
            id: pull.id,
            name: pull.name,
            prefix: 'A1',
            trainingMethod: 'superset',
            methodRationale: 'Antagonist superset for time efficiency',
          },
          {
            id: push.id,
            name: push.name,
            prefix: 'A2',
            trainingMethod: 'superset',
            methodRationale: 'Antagonist superset for time efficiency',
          },
        ],
        instruction: 'Alternate between A1 and A2 with minimal rest',
        restProtocol: '60-90s after completing both exercises',
      })
      
      if (!appliedMethods.includes('supersets')) {
        appliedMethods.push('supersets')
      }
    }
    
    // [PHASE 11] If supersets preferred but no antagonist pairs, try non-competing pairs
    const remainingStrength = strengthNotUsed.filter(e => !usedExerciseIds.has(e.id))
    if (supersetsPreferred && remainingStrength.length >= 2 && !appliedMethods.includes('supersets')) {
      // Pair non-competing strength exercises (different movement patterns)
      const grouped: Array<{ e1: typeof remainingStrength[0], e2: typeof remainingStrength[0] }> = []
      const usedForPairing = new Set<string>()
      
      for (let i = 0; i < remainingStrength.length; i++) {
        if (usedForPairing.has(remainingStrength[i].id)) continue
        for (let j = i + 1; j < remainingStrength.length; j++) {
          if (usedForPairing.has(remainingStrength[j].id)) continue
          const e1 = remainingStrength[i]
          const e2 = remainingStrength[j]
          // Non-competing if different movement patterns
          if (e1.movementPattern !== e2.movementPattern) {
            // Also avoid pairing high neural demand
            if ((e1.neuralDemand || 2) < 4 && (e2.neuralDemand || 2) < 4) {
              grouped.push({ e1, e2 })
              usedForPairing.add(e1.id)
              usedForPairing.add(e2.id)
              break
            }
          }
        }
      }
      
      for (const pair of grouped) {
        usedExerciseIds.add(pair.e1.id)
        usedExerciseIds.add(pair.e2.id)
        
        styledGroups.push({
          id: `group_${groupId++}`,
          groupType: 'superset',
          exercises: [
            {
              id: pair.e1.id,
              name: pair.e1.name,
              prefix: 'A1',
              trainingMethod: 'superset',
              methodRationale: 'Non-competing superset for time efficiency',
            },
            {
              id: pair.e2.id,
              name: pair.e2.name,
              prefix: 'A2',
              trainingMethod: 'superset',
              methodRationale: 'Non-competing superset for time efficiency',
            },
          ],
          instruction: 'Alternate between A1 and A2 with minimal rest',
          restProtocol: '60-90s after completing both exercises',
        })
        
        if (!appliedMethods.includes('supersets')) {
          appliedMethods.push('supersets')
        }
      }
    }
  }
  
  // Remaining strength as straight sets
  for (const exercise of strengthNotUsed.filter(e => !usedExerciseIds.has(e.id))) {
    usedExerciseIds.add(exercise.id)
    styledGroups.push({
      id: `group_${groupId++}`,
      groupType: 'straight',
      exercises: [{
        id: exercise.id,
        name: exercise.name,
        trainingMethod: 'straight_sets',
        methodRationale: 'Focused strength work with full recovery',
      }],
      instruction: 'Complete all sets before moving on',
      restProtocol: '2-3 min between sets',
    })
  }
  
  // ==========================================================================
  // ACCESSORY/CORE: Prime candidates for circuits, supersets, density
  // [PHASE 11] Changed from else-if to prioritize supersets when preferred
  // ==========================================================================
  const accessoryNotUsed = [...accessoryExercises, ...coreExercises]
    .filter(e => !usedExerciseIds.has(e.id))
  
  // [PHASE 11] Determine method priority - supersets first if preferred and not yet applied
  const shouldPrioritizeAccessorySupersets = supersetsPreferred && 
    !appliedMethods.includes('supersets') && 
    accessoryNotUsed.length >= 2
    
  // [PHASE 11] Try accessory supersets FIRST if supersets are preferred method
  if (shouldPrioritizeAccessorySupersets) {
    // Create up to 2 superset pairs from accessories
    const supersetPairCount = Math.min(2, Math.floor(accessoryNotUsed.length / 2))
    for (let p = 0; p < supersetPairCount; p++) {
      const idx = p * 2
      const ex1 = accessoryNotUsed[idx]
      const ex2 = accessoryNotUsed[idx + 1]
      
      if (!ex1 || !ex2) break
      
      usedExerciseIds.add(ex1.id)
      usedExerciseIds.add(ex2.id)
      
      styledGroups.push({
        id: `group_${groupId++}`,
        groupType: 'superset',
        exercises: [
          {
            id: ex1.id,
            name: ex1.name,
            prefix: `${String.fromCharCode(66 + p)}1`, // B1, C1, etc.
            trainingMethod: 'superset',
            methodRationale: 'Superset for time efficiency',
          },
          {
            id: ex2.id,
            name: ex2.name,
            prefix: `${String.fromCharCode(66 + p)}2`, // B2, C2, etc.
            trainingMethod: 'superset',
            methodRationale: 'Superset for time efficiency',
          },
        ],
        instruction: 'Alternate between exercises',
        restProtocol: '60s after completing both',
      })
      
      if (!appliedMethods.includes('supersets')) {
        appliedMethods.push('supersets')
      }
    }
  }
  
  // Re-calculate what's left after supersets
  const accessoryStillNotUsed = accessoryNotUsed.filter(e => !usedExerciseIds.has(e.id))
  
  // Try circuits if preferred and we have enough exercises
  if (feasibleMethods.includes('circuits') && accessoryStillNotUsed.length >= 3) {
    const circuitExercises = accessoryStillNotUsed.slice(0, Math.min(4, accessoryStillNotUsed.length))
    
    for (const e of circuitExercises) {
      usedExerciseIds.add(e.id)
    }
    
    styledGroups.push({
      id: `group_${groupId++}`,
      groupType: 'circuit',
      exercises: circuitExercises.map((e, i) => ({
        id: e.id,
        name: e.name,
        prefix: `${i + 1}`,
        trainingMethod: 'circuit',
        methodRationale: 'Circuit for conditioning and efficiency',
      })),
      instruction: 'Move through exercises with minimal rest, rest after completing round',
      restProtocol: '60-90s after each round, complete 2-3 rounds',
    })
    
    if (!appliedMethods.includes('circuits')) {
      appliedMethods.push('circuits')
    }
  }
  // Try density blocks (only if circuits not used)
  else if (feasibleMethods.includes('density_blocks') && accessoryStillNotUsed.length >= 2) {
    const densityExercises = accessoryStillNotUsed.slice(0, Math.min(3, accessoryStillNotUsed.length))
    
    for (const e of densityExercises) {
      usedExerciseIds.add(e.id)
    }
    
    styledGroups.push({
      id: `group_${groupId++}`,
      groupType: 'density_block',
      exercises: densityExercises.map(e => ({
        id: e.id,
        name: e.name,
        trainingMethod: 'density_block',
        methodRationale: 'Density block for work capacity',
      })),
      instruction: 'AMRAP style: complete as many quality rounds as possible in 6-8 minutes',
      restProtocol: 'Rest as needed to maintain quality',
    })
    
    if (!appliedMethods.includes('density_blocks')) {
      appliedMethods.push('density_blocks')
    }
  }
  // [PHASE 11] Try accessory supersets as fallback (if not already applied and circuit didn't trigger)
  else if (feasibleMethods.includes('supersets') && accessoryStillNotUsed.length >= 2 && !appliedMethods.includes('supersets')) {
    for (let i = 0; i < accessoryStillNotUsed.length - 1; i += 2) {
      const ex1 = accessoryStillNotUsed[i]
      const ex2 = accessoryStillNotUsed[i + 1]
      
      usedExerciseIds.add(ex1.id)
      usedExerciseIds.add(ex2.id)
      
      styledGroups.push({
        id: `group_${groupId++}`,
        groupType: 'superset',
        exercises: [
          {
            id: ex1.id,
            name: ex1.name,
            prefix: 'B1',
            trainingMethod: 'superset',
            methodRationale: 'Superset for time efficiency',
          },
          {
            id: ex2.id,
            name: ex2.name,
            prefix: 'B2',
            trainingMethod: 'superset',
            methodRationale: 'Superset for time efficiency',
          },
        ],
        instruction: 'Alternate between exercises',
        restProtocol: '60s after completing both',
      })
      
      if (!appliedMethods.includes('supersets')) {
        appliedMethods.push('supersets')
      }
    }
  }
  
  // Any remaining exercises as straight sets
  for (const exercise of accessoryNotUsed.filter(e => !usedExerciseIds.has(e.id))) {
    usedExerciseIds.add(exercise.id)
    styledGroups.push({
      id: `group_${groupId++}`,
      groupType: 'straight',
      exercises: [{
        id: exercise.id,
        name: exercise.name,
        trainingMethod: 'straight_sets',
        methodRationale: 'Standard training approach',
      }],
      instruction: 'Complete all sets before moving on',
      restProtocol: '60-90s between sets',
    })
  }
  
  // If no special methods were applied, add straight_sets as the applied method
  if (appliedMethods.length === 0) {
    appliedMethods.push('straight_sets')
  }
  
  // Build style metadata
  const primaryStyle = appliedMethods[0] || 'straight_sets'
  const hasSupersetsApplied = styledGroups.some(g => g.groupType === 'superset')
  const hasCircuitsApplied = styledGroups.some(g => g.groupType === 'circuit')
  const hasDensityApplied = styledGroups.some(g => g.groupType === 'density_block')
  
  const structureDescParts: string[] = []
  if (styledGroups.some(g => g.groupType === 'cluster')) structureDescParts.push('cluster sets for skill work')
  if (hasSupersetsApplied) structureDescParts.push('antagonist supersets')
  if (hasCircuitsApplied) structureDescParts.push('conditioning circuit')
  if (hasDensityApplied) structureDescParts.push('density finisher')
  if (structureDescParts.length === 0) structureDescParts.push('traditional straight sets')
  
  // ==========================================================================
  // [PHASE 7A TASK 3] STRUCTURAL INFLUENCE AUDIT
  // ==========================================================================
  console.log('[training-style-structural-influence-audit]', {
    sessionId: `day_${dayNumber}`,
    selectedStyles: methodPreferences,
    feasibleStylesForSession: feasibleMethods,
    chosenStyleForSession: primaryStyle,
    rejectedStylesForSession: rejectedMethods.map(r => r.method),
    exactRejectionReasons: rejectedMethods,
    didStyleActuallyChangeStructure: appliedMethods.length > 1 || primaryStyle !== 'straight_sets',
    groupsCreated: styledGroups.length,
    finalVerdict: hasSupersetsApplied || hasCircuitsApplied || hasDensityApplied
      ? 'style_influenced_structure'
      : 'straight_sets_default',
  })
  
  return {
    styledGroups,
    appliedMethods,
    rejectedMethods,
    styleMetadata: {
      primarySessionStyle: primaryStyle,
      hasSupersetsApplied,
      hasCircuitsApplied,
      hasDensityApplied,
      structureDescription: structureDescParts.join(', '),
    },
  }
}

/**
 * [PHASE 7A TASK 5] Track weekly style representation
 */
export function auditWeeklyStyleRepresentation(
  selectedStyles: TrainingMethodPreference[],
  sessionsStyleResults: SessionStyleResult[]
): void {
  const representedStyles = new Set<TrainingMethodPreference>()
  
  for (const result of sessionsStyleResults) {
    for (const method of result.appliedMethods) {
      representedStyles.add(method)
    }
  }
  
  const neverUsed = selectedStyles.filter(s => !representedStyles.has(s))
  const whyUnused: Record<string, string> = {}
  
  for (const style of neverUsed) {
    // Aggregate rejection reasons from all sessions
    const allReasons = sessionsStyleResults
      .flatMap(r => r.rejectedMethods)
      .filter(r => r.method === style)
      .map(r => r.reason)
    
    whyUnused[style] = allReasons.length > 0 
      ? [...new Set(allReasons)].join(', ')
      : 'no_eligible_exercises_or_session_context'
  }
  
  console.log('[weekly-training-style-representation-audit]', {
    selectedStylesCanonical: selectedStyles,
    stylesActuallyRepresentedThisWeek: [...representedStyles],
    stylesNeverUsed: neverUsed,
    whyUnused,
    weekTooConstrained: neverUsed.length === selectedStyles.length,
    structureTooGeneric: representedStyles.size === 1 && representedStyles.has('straight_sets'),
    finalVerdict: neverUsed.length === 0 
      ? 'all_selected_styles_represented'
      : neverUsed.length < selectedStyles.length / 2
        ? 'most_styles_represented'
        : 'style_underrepresentation_detected',
  })
}
