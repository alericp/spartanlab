/**
 * SpartanLab Exercise Family Integration
 * 
 * Integrates the Movement Family Registry with existing systems:
 * - Exercise Override Service (intelligent substitutions)
 * - Program Generation (equipment-aware selection)
 * - Hypertrophy Layer (targeted accessory work)
 * - Workout Time Optimization (priority-based trimming)
 * - Constraint Detection (movement family recommendations)
 */

import {
  type MovementFamily,
  type TrainingIntent,
  type SkillCarryover,
  type EquipmentTag,
  type DifficultyBand,
  MOVEMENT_FAMILY_METADATA,
  SKILL_CARRYOVER_METADATA,
  TRAINING_INTENT_METADATA,
} from './movement-family-registry'

import {
  type ExerciseClassification,
  EXERCISE_CLASSIFICATIONS,
  getExerciseClassification,
  getExercisesByFamily,
  getExercisesByIntent,
  getExercisesWithCarryover,
  getExercisesForEquipment,
  getValidSubstitutions,
  prioritizeForTimeConstraint,
  canCompressExercise,
} from './exercise-classification-registry'

import type { Exercise, EquipmentType } from './adaptive-exercise-pool'
import type { ConstraintCategory } from './constraint-detection-engine'

// =============================================================================
// TYPES
// =============================================================================

export interface SmartSubstitution {
  originalId: string
  originalName: string
  substitutionId: string
  substitutionName: string
  reason: string
  intentPreserved: boolean
  familyPreserved: boolean
  skillCarryoverPreserved: boolean
  difficultyMatch: 'exact' | 'close' | 'different'
}

export interface ExerciseSelectionContext {
  primaryGoal: SkillCarryover | string
  availableEquipment: EquipmentTag[]
  experienceLevel: DifficultyBand
  sessionFocus: TrainingIntent
  fatigueLevel: 'low' | 'moderate' | 'high'
  timeAvailable: number // minutes
  constraints?: ConstraintCategory[]
}

export interface PrioritizedExerciseList {
  mustInclude: ExerciseClassification[]
  shouldInclude: ExerciseClassification[]
  canInclude: ExerciseClassification[]
  canOmit: ExerciseClassification[]
}

// =============================================================================
// EQUIPMENT MAPPING
// =============================================================================

/**
 * Map old EquipmentType to new EquipmentTag
 */
export function mapEquipmentToTag(equipment: EquipmentType | string): EquipmentTag {
  const mapping: Record<string, EquipmentTag> = {
    'pull_bar': 'pullup_bar',
    'dip_bars': 'dip_bars',
    'rings': 'rings',
    'parallettes': 'parallettes',
    'bands': 'resistance_bands',
    'floor': 'floor',
    'wall': 'wall',
    // Additional mappings
    'dumbbells': 'dumbbells',
    'barbell': 'barbell',
    'cables': 'cables',
    'bench': 'bench',
    'lat_pulldown': 'lat_pulldown',
    'weight_vest': 'weight_vest',
  }
  return mapping[equipment] || 'floor'
}

/**
 * Map array of old equipment types to new tags
 */
export function mapEquipmentArray(equipment: (EquipmentType | string)[]): EquipmentTag[] {
  return equipment.map(mapEquipmentToTag)
}

// =============================================================================
// INTELLIGENT SUBSTITUTION
// =============================================================================

/**
 * Get smart substitution options for an exercise
 * Preserves training intent and movement family where possible
 */
export function getSmartSubstitutions(
  exerciseId: string,
  availableEquipment: EquipmentTag[],
  targetSkill?: SkillCarryover
): SmartSubstitution[] {
  const original = getExerciseClassification(exerciseId)
  if (!original) return []
  
  const substitutions = getValidSubstitutions(exerciseId, availableEquipment, true)
  
  return substitutions.map(sub => {
    const intentPreserved = sub.intents.some(i => original.intents.includes(i))
    const familyPreserved = sub.primaryFamily === original.primaryFamily
    const skillCarryoverPreserved = targetSkill 
      ? (sub.skillCarryover?.includes(targetSkill) ?? false)
      : true
    
    let difficultyMatch: 'exact' | 'close' | 'different' = 'different'
    if (sub.difficulty === original.difficulty) {
      difficultyMatch = 'exact'
    } else {
      const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
      const originalIdx = difficultyOrder.indexOf(original.difficulty)
      const subIdx = difficultyOrder.indexOf(sub.difficulty)
      if (Math.abs(originalIdx - subIdx) === 1) {
        difficultyMatch = 'close'
      }
    }
    
    // Build reason string
    const reasons: string[] = []
    if (familyPreserved) reasons.push('same movement pattern')
    if (intentPreserved) reasons.push('preserves training intent')
    if (skillCarryoverPreserved && targetSkill) reasons.push(`transfers to ${targetSkill}`)
    if (difficultyMatch === 'exact') reasons.push('same difficulty level')
    
    return {
      originalId: original.id,
      originalName: original.name,
      substitutionId: sub.id,
      substitutionName: sub.name,
      reason: reasons.length > 0 ? reasons.join(', ') : 'alternative option',
      intentPreserved,
      familyPreserved,
      skillCarryoverPreserved,
      difficultyMatch,
    }
  })
}

/**
 * Get the best single substitution for an exercise
 */
export function getBestSubstitution(
  exerciseId: string,
  availableEquipment: EquipmentTag[],
  targetSkill?: SkillCarryover
): SmartSubstitution | null {
  const substitutions = getSmartSubstitutions(exerciseId, availableEquipment, targetSkill)
  
  if (substitutions.length === 0) return null
  
  // Score and sort substitutions
  const scored = substitutions.map(sub => {
    let score = 0
    if (sub.familyPreserved) score += 30
    if (sub.intentPreserved) score += 25
    if (sub.skillCarryoverPreserved) score += 20
    if (sub.difficultyMatch === 'exact') score += 15
    else if (sub.difficultyMatch === 'close') score += 8
    return { sub, score }
  })
  
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.sub || null
}

// =============================================================================
// SKILL-BASED EXERCISE SELECTION
// =============================================================================

/**
 * Get exercises that support a specific skill goal
 */
export function getExercisesForSkillGoal(
  skill: SkillCarryover,
  equipment: EquipmentTag[],
  experienceLevel: DifficultyBand
): ExerciseClassification[] {
  const skillMeta = SKILL_CARRYOVER_METADATA[skill]
  if (!skillMeta) return []
  
  const exercises: ExerciseClassification[] = []
  
  // Get direct skill progressions (highest priority)
  const directSkillExercises = getExercisesWithCarryover(skill).filter(ex => 
    ex.primaryIntent === 'skill' && 
    ex.requiredEquipment.every(req => equipment.includes(req))
  )
  exercises.push(...directSkillExercises)
  
  // Get exercises from primary movement families
  for (const family of skillMeta.primaryFamilies) {
    const familyExercises = getExercisesByFamily(family).filter(ex =>
      !exercises.some(e => e.id === ex.id) &&
      ex.requiredEquipment.every(req => equipment.includes(req))
    )
    exercises.push(...familyExercises)
  }
  
  // Get support work from secondary families
  for (const family of skillMeta.supportFamilies) {
    const supportExercises = getExercisesByFamily(family).filter(ex =>
      !exercises.some(e => e.id === ex.id) &&
      ex.requiredEquipment.every(req => equipment.includes(req))
    )
    exercises.push(...supportExercises)
  }
  
  // Filter by appropriate difficulty
  const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
  const levelIdx = difficultyOrder.indexOf(experienceLevel)
  
  return exercises.filter(ex => {
    const exIdx = difficultyOrder.indexOf(ex.difficulty)
    // Allow exercises at current level or one below
    return exIdx <= levelIdx + 1 && exIdx >= Math.max(0, levelIdx - 1)
  })
}

/**
 * Get accessory exercises that support a skill without being direct progressions
 */
export function getAccessoriesForSkill(
  skill: SkillCarryover,
  equipment: EquipmentTag[],
  limit: number = 5
): ExerciseClassification[] {
  const skillMeta = SKILL_CARRYOVER_METADATA[skill]
  if (!skillMeta) return []
  
  // Get exercises from support families with accessory/hypertrophy intent
  const accessories: ExerciseClassification[] = []
  
  for (const family of [...skillMeta.supportFamilies, ...skillMeta.primaryFamilies]) {
    const familyExercises = getExercisesByFamily(family).filter(ex =>
      ex.primaryIntent !== 'skill' &&
      (ex.intents.includes('strength') || ex.intents.includes('hypertrophy') || ex.intents.includes('durability')) &&
      ex.requiredEquipment.every(req => equipment.includes(req)) &&
      !accessories.some(a => a.id === ex.id)
    )
    accessories.push(...familyExercises)
  }
  
  // Sort by placement tier (accessories should be tier 2-3)
  return accessories
    .filter(ex => ex.placementTier >= 2)
    .sort((a, b) => a.placementTier - b.placementTier)
    .slice(0, limit)
}

// =============================================================================
// TIME-CONSTRAINED WORKOUT OPTIMIZATION
// =============================================================================

/**
 * Prioritize exercises for time-constrained sessions
 * Returns exercises grouped by priority for trimming
 */
export function prioritizeForSession(
  exercises: ExerciseClassification[],
  sessionFocus: TrainingIntent,
  targetSkill?: SkillCarryover
): PrioritizedExerciseList {
  const mustInclude: ExerciseClassification[] = []
  const shouldInclude: ExerciseClassification[] = []
  const canInclude: ExerciseClassification[] = []
  const canOmit: ExerciseClassification[] = []
  
  for (const exercise of exercises) {
    // Skill work for target skill is always must-include
    if (targetSkill && exercise.skillCarryover?.includes(targetSkill) && exercise.primaryIntent === 'skill') {
      mustInclude.push(exercise)
      continue
    }
    
    // Exercises matching session focus are should-include
    if (exercise.primaryIntent === sessionFocus) {
      shouldInclude.push(exercise)
      continue
    }
    
    // Check if exercise can be compressed
    const intentMeta = TRAINING_INTENT_METADATA[exercise.primaryIntent]
    if (!intentMeta?.canCompress) {
      shouldInclude.push(exercise)
      continue
    }
    
    // Tier 1-2 exercises go to canInclude
    if (exercise.placementTier <= 2) {
      canInclude.push(exercise)
      continue
    }
    
    // Everything else can be omitted
    canOmit.push(exercise)
  }
  
  return { mustInclude, shouldInclude, canInclude, canOmit }
}

/**
 * Trim exercises to fit time budget
 */
export function trimForTimeBudget(
  prioritized: PrioritizedExerciseList,
  availableMinutes: number,
  minutesPerExercise: number = 5
): ExerciseClassification[] {
  const result: ExerciseClassification[] = []
  let remainingMinutes = availableMinutes
  
  // Always include must-include
  for (const ex of prioritized.mustInclude) {
    result.push(ex)
    remainingMinutes -= minutesPerExercise
  }
  
  // Add should-include if time permits
  for (const ex of prioritized.shouldInclude) {
    if (remainingMinutes >= minutesPerExercise) {
      result.push(ex)
      remainingMinutes -= minutesPerExercise
    }
  }
  
  // Add can-include if time permits
  for (const ex of prioritized.canInclude) {
    if (remainingMinutes >= minutesPerExercise) {
      result.push(ex)
      remainingMinutes -= minutesPerExercise
    }
  }
  
  // Add can-omit only if significant time remains
  if (remainingMinutes >= minutesPerExercise * 2) {
    for (const ex of prioritized.canOmit) {
      if (remainingMinutes >= minutesPerExercise) {
        result.push(ex)
        remainingMinutes -= minutesPerExercise
      }
    }
  }
  
  return result
}

// =============================================================================
// CONSTRAINT-BASED RECOMMENDATIONS
// =============================================================================

/**
 * Map constraint categories to movement families
 */
export function getMovementFamiliesForConstraint(constraint: ConstraintCategory): MovementFamily[] {
  const mapping: Partial<Record<ConstraintCategory, MovementFamily[]>> = {
    'pull_strength': ['vertical_pull', 'horizontal_pull'],
    'push_strength': ['horizontal_push', 'vertical_push', 'dip_pattern'],
    'straight_arm_pull_strength': ['straight_arm_pull'],
    'straight_arm_push_strength': ['straight_arm_push'],
    'compression_strength': ['compression_core'],
    'core_control': ['anti_extension_core', 'anti_rotation_core', 'compression_core'],
    'scapular_control': ['scapular_control'],
    'shoulder_stability': ['joint_integrity', 'scapular_control', 'shoulder_isolation'],
    'wrist_tolerance': ['joint_integrity'],
    'explosive_pull_power': ['explosive_pull'],
    'mobility': ['mobility', 'joint_integrity'],
    'transition_strength': ['transition', 'dip_pattern'],
    'vertical_push_strength': ['vertical_push'],
  }
  
  return mapping[constraint] || []
}

/**
 * Get exercises to address a specific constraint
 */
export function getExercisesForConstraint(
  constraint: ConstraintCategory,
  equipment: EquipmentTag[],
  experienceLevel: DifficultyBand
): ExerciseClassification[] {
  const families = getMovementFamiliesForConstraint(constraint)
  if (families.length === 0) return []
  
  const exercises: ExerciseClassification[] = []
  
  for (const family of families) {
    const familyExercises = getExercisesByFamily(family).filter(ex =>
      ex.requiredEquipment.every(req => equipment.includes(req)) &&
      !exercises.some(e => e.id === ex.id)
    )
    exercises.push(...familyExercises)
  }
  
  // Filter by difficulty
  const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
  const levelIdx = difficultyOrder.indexOf(experienceLevel)
  
  return exercises.filter(ex => {
    const exIdx = difficultyOrder.indexOf(ex.difficulty)
    return exIdx <= levelIdx + 1 && exIdx >= Math.max(0, levelIdx - 1)
  })
}

// =============================================================================
// HYPERTROPHY LAYER INTEGRATION
// =============================================================================

/**
 * Get minimal high-ROI hypertrophy exercises
 * Maintains calisthenics-first approach with targeted isolation work
 */
export function getHypertrophyExercises(
  equipment: EquipmentTag[],
  targetMuscles?: string[]
): ExerciseClassification[] {
  // Get all exercises with hypertrophy intent
  const hypertrophyExercises = getExercisesByIntent('hypertrophy').filter(ex =>
    ex.requiredEquipment.every(req => equipment.includes(req))
  )
  
  // Prioritize isolation exercises (tier 3)
  const isolationWork = hypertrophyExercises.filter(ex => ex.placementTier === 3)
  
  // Also include compound hypertrophy work (tier 2)
  const compoundHypertrophy = hypertrophyExercises.filter(ex => 
    ex.placementTier === 2 && 
    !ex.intents.includes('skill')
  )
  
  // If target muscles specified, filter further
  if (targetMuscles && targetMuscles.length > 0) {
    return [...compoundHypertrophy, ...isolationWork].filter(ex => {
      // Check if exercise targets any of the target muscles
      // This would need to be enhanced with muscle-to-exercise mapping
      return true // For now, return all
    })
  }
  
  return [...compoundHypertrophy, ...isolationWork]
}

/**
 * Get calisthenics-first hypertrophy selection
 * Minimal, high-ROI accessory pool as specified in requirements
 */
export function getCalisthenicsHypertrophyPool(equipment: EquipmentTag[]): {
  upperPush: ExerciseClassification[]
  upperPull: ExerciseClassification[]
  arms: ExerciseClassification[]
  shoulders: ExerciseClassification[]
} {
  const hasEquipment = (ex: ExerciseClassification) =>
    ex.requiredEquipment.every(req => equipment.includes(req))
  
  return {
    upperPush: getExercisesByFamily('horizontal_push')
      .filter(ex => hasEquipment(ex) && ex.intents.includes('hypertrophy'))
      .slice(0, 3),
    upperPull: getExercisesByFamily('horizontal_pull')
      .filter(ex => hasEquipment(ex) && ex.intents.includes('hypertrophy'))
      .slice(0, 3),
    arms: getExercisesByFamily('arm_isolation')
      .filter(hasEquipment)
      .slice(0, 4),
    shoulders: getExercisesByFamily('shoulder_isolation')
      .filter(hasEquipment)
      .slice(0, 2),
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Re-export core types
  type MovementFamily,
  type TrainingIntent,
  type SkillCarryover,
  type EquipmentTag,
  type DifficultyBand,
  type ExerciseClassification,
  
  // Re-export metadata
  MOVEMENT_FAMILY_METADATA,
  SKILL_CARRYOVER_METADATA,
  TRAINING_INTENT_METADATA,
  
  // Re-export registry functions
  getExerciseClassification,
  getExercisesByFamily,
  getExercisesByIntent,
  getExercisesWithCarryover,
  getExercisesForEquipment,
  getValidSubstitutions,
  prioritizeForTimeConstraint,
  canCompressExercise,
}
