// Exercise Library API
// Central interface for accessing and filtering exercises in SpartanLab
// This module provides a clean API for the Program Builder and other systems

import {
  type Exercise,
  type ExerciseCategory,
  type MovementPattern,
  type MovementCategory,
  type DifficultyLevel,
  type EquipmentType,
  type ExerciseFilterCriteria,
  getAllExercises,
  getExerciseById,
  getExercisesByTransfer,
  getExercisesByCategory,
  getExercisesByMovement,
  getExercisesByDifficulty,
  getExercisesByMovementCategory,
  getBandAssistedExercises,
  getRPETrackableExercises,
  getIsometricExercises,
  filterExercises,
  getBalancedExerciseSelection,
  inferDifficultyLevel,
  inferMovementCategory,
  isIsometricExercise,
  hasRequiredEquipment,
  SKILL_EXERCISES,
  STRENGTH_EXERCISES,
  ACCESSORY_EXERCISES,
  CORE_EXERCISES_POOL,
  WARMUP_EXERCISES,
  COOLDOWN_EXERCISES,
  COMPRESSION_EXERCISES,
  FLEXIBILITY_EXERCISES,
} from './adaptive-exercise-pool'

// =============================================================================
// RE-EXPORTS - Direct access to types and functions
// =============================================================================

export type {
  Exercise,
  ExerciseCategory,
  MovementPattern,
  MovementCategory,
  DifficultyLevel,
  EquipmentType,
  ExerciseFilterCriteria,
}

export {
  getAllExercises,
  getExerciseById,
  getExercisesByTransfer,
  getExercisesByCategory,
  getExercisesByMovement,
  getExercisesByDifficulty,
  getExercisesByMovementCategory,
  getBandAssistedExercises,
  getRPETrackableExercises,
  getIsometricExercises,
  filterExercises,
  getBalancedExerciseSelection,
  inferDifficultyLevel,
  inferMovementCategory,
  isIsometricExercise,
  hasRequiredEquipment,
}

// =============================================================================
// EXERCISE COLLECTIONS BY CATEGORY
// =============================================================================

export const EXERCISE_COLLECTIONS = {
  skill: SKILL_EXERCISES,
  strength: STRENGTH_EXERCISES,
  accessory: ACCESSORY_EXERCISES,
  core: CORE_EXERCISES_POOL,
  warmup: WARMUP_EXERCISES,
  cooldown: COOLDOWN_EXERCISES,
  compression: COMPRESSION_EXERCISES,
  flexibility: FLEXIBILITY_EXERCISES,
} as const

// =============================================================================
// CATEGORY METADATA
// =============================================================================

export interface CategoryMetadata {
  id: ExerciseCategory | 'compression' | 'flexibility'
  name: string
  description: string
  icon: string
  color: string
}

export const CATEGORY_METADATA: CategoryMetadata[] = [
  {
    id: 'skill',
    name: 'Skill Work',
    description: 'High neural demand movements requiring technique focus',
    icon: 'Target',
    color: '#C1121F',
  },
  {
    id: 'strength',
    name: 'Strength',
    description: 'Primary strength builders for progressive overload',
    icon: 'Dumbbell',
    color: '#2563EB',
  },
  {
    id: 'core',
    name: 'Core',
    description: 'Core stability and anti-rotation exercises',
    icon: 'Activity',
    color: '#059669',
  },
  {
    id: 'compression',
    name: 'Compression',
    description: 'L-sit, V-sit, and related compression skills',
    icon: 'Zap',
    color: '#7C3AED',
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    description: 'Mobility and flexibility drills for joint health',
    icon: 'Sparkles',
    color: '#EC4899',
  },
  {
    id: 'accessory',
    name: 'Accessory',
    description: 'Support exercises for balanced development',
    icon: 'Plus',
    color: '#6B7280',
  },
  {
    id: 'warmup',
    name: 'Warm-Up',
    description: 'Preparation exercises before main work',
    icon: 'Flame',
    color: '#F59E0B',
  },
  {
    id: 'cooldown',
    name: 'Cool-Down',
    description: 'Recovery and stretching after training',
    icon: 'Moon',
    color: '#0EA5E9',
  },
]

// =============================================================================
// MOVEMENT PATTERN METADATA
// =============================================================================

export interface MovementPatternMetadata {
  id: MovementPattern
  name: string
  description: string
  primaryCategory: MovementCategory
}

export const MOVEMENT_PATTERN_METADATA: MovementPatternMetadata[] = [
  {
    id: 'horizontal_push',
    name: 'Horizontal Push',
    description: 'Pushing movements in the horizontal plane (push-ups, planche)',
    primaryCategory: 'push',
  },
  {
    id: 'vertical_push',
    name: 'Vertical Push',
    description: 'Pushing movements in the vertical plane (dips, HSPU)',
    primaryCategory: 'push',
  },
  {
    id: 'horizontal_pull',
    name: 'Horizontal Pull',
    description: 'Pulling movements in the horizontal plane (rows, front lever)',
    primaryCategory: 'pull',
  },
  {
    id: 'vertical_pull',
    name: 'Vertical Pull',
    description: 'Pulling movements in the vertical plane (pull-ups)',
    primaryCategory: 'pull',
  },
  {
    id: 'compression',
    name: 'Compression',
    description: 'Hip flexion and core compression movements',
    primaryCategory: 'compression',
  },
  {
    id: 'core',
    name: 'Core Stability',
    description: 'Anti-extension, anti-rotation, and core control',
    primaryCategory: 'core',
  },
  {
    id: 'transition',
    name: 'Transition',
    description: 'Complex movements combining patterns (muscle-up)',
    primaryCategory: 'pull',
  },
  {
    id: 'mobility',
    name: 'Mobility',
    description: 'Flexibility and joint mobility work',
    primaryCategory: 'flexibility',
  },
  {
    id: 'skill',
    name: 'General Skill',
    description: 'Skill-based movements not fitting other patterns',
    primaryCategory: 'accessory',
  },
]

// =============================================================================
// DIFFICULTY LEVEL METADATA
// =============================================================================

export interface DifficultyMetadata {
  id: DifficultyLevel
  name: string
  description: string
  minMonthsTraining: number
  color: string
}

export const DIFFICULTY_METADATA: DifficultyMetadata[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Suitable for athletes new to calisthenics',
    minMonthsTraining: 0,
    color: '#22C55E',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Requires solid foundation in basics',
    minMonthsTraining: 6,
    color: '#3B82F6',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Requires significant strength and skill development',
    minMonthsTraining: 18,
    color: '#F59E0B',
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Peak calisthenics movements requiring years of training',
    minMonthsTraining: 36,
    color: '#C1121F',
  },
]

// =============================================================================
// PROGRAM BUILDER HELPERS
// =============================================================================

/**
 * Get exercises appropriate for an athlete's experience level
 */
export function getExercisesForExperienceLevel(
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): Exercise[] {
  const allowedDifficulties: DifficultyLevel[] = 
    experienceLevel === 'beginner' ? ['beginner'] :
    experienceLevel === 'intermediate' ? ['beginner', 'intermediate'] :
    ['beginner', 'intermediate', 'advanced', 'elite']
  
  return getAllExercises().filter(e => {
    const level = inferDifficultyLevel(e)
    return allowedDifficulties.includes(level)
  })
}

/**
 * Get exercises that transfer to a specific skill goal
 */
export function getExercisesForSkillGoal(
  skillId: string,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): Exercise[] {
  const transferExercises = getExercisesByTransfer(skillId)
  const levelAppropriate = getExercisesForExperienceLevel(experienceLevel)
  
  return transferExercises.filter(e => levelAppropriate.includes(e))
}

/**
 * Get a balanced push/pull/compression selection
 */
export function getBalancedPPCSelection(
  count: number,
  equipment: EquipmentType[],
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): { push: Exercise[]; pull: Exercise[]; compression: Exercise[] } {
  const allowedDifficulties: DifficultyLevel[] = 
    experienceLevel === 'beginner' ? ['beginner'] :
    experienceLevel === 'intermediate' ? ['beginner', 'intermediate'] :
    ['beginner', 'intermediate', 'advanced', 'elite']
  
  const perCategory = Math.ceil(count / 3)
  
  const push = filterExercises({
    movementCategories: ['push'],
    equipment,
    difficultyLevels: allowedDifficulties,
  }).slice(0, perCategory)
  
  const pull = filterExercises({
    movementCategories: ['pull'],
    equipment,
    difficultyLevels: allowedDifficulties,
  }).slice(0, perCategory)
  
  const compression = filterExercises({
    movementCategories: ['compression'],
    equipment,
    difficultyLevels: allowedDifficulties,
  }).slice(0, perCategory)
  
  return { push, pull, compression }
}

/**
 * Get exercise count summary
 */
export function getExerciseLibrarySummary(): {
  total: number
  byCategory: Record<string, number>
  byDifficulty: Record<DifficultyLevel, number>
  byMovementCategory: Record<MovementCategory, number>
  withBandSupport: number
} {
  const all = getAllExercises()
  
  const byCategory: Record<string, number> = {}
  const byDifficulty: Record<DifficultyLevel, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    elite: 0,
  }
  const byMovementCategory: Record<MovementCategory, number> = {
    push: 0,
    pull: 0,
    compression: 0,
    core: 0,
    flexibility: 0,
    accessory: 0,
    warmup: 0,
    cooldown: 0,
  }
  
  all.forEach(e => {
    // By category
    byCategory[e.category] = (byCategory[e.category] || 0) + 1
    
    // By difficulty
    const diff = inferDifficultyLevel(e)
    byDifficulty[diff]++
    
    // By movement category
    const movCat = inferMovementCategory(e)
    byMovementCategory[movCat]++
  })
  
  return {
    total: all.length,
    byCategory,
    byDifficulty,
    byMovementCategory,
    withBandSupport: getBandAssistedExercises().length,
  }
}

// =============================================================================
// PROGRESSION SYSTEM RE-EXPORTS
// =============================================================================

export {
  PROGRESSION_LADDERS,
  SUBSTITUTION_MAPPINGS,
  getExerciseLadder,
  getProgressionUp,
  getProgressionDown,
  getSubstitutes,
  getBestSubstitute,
  isReadyToProgress,
  getAdaptedExercise,
  getLadderExercises,
  getLadderProgress,
  findStartingExercise,
  getFatigueRegression,
  type ProgressionLadder,
  type ProgressionStep,
  type SubstitutionMapping,
  type SubstituteOption,
  type ProgressionResult,
} from './progression-ladders'

// =============================================================================
// PROGRESSION-AWARE SELECTION RE-EXPORTS
// =============================================================================

export {
  adaptExerciseForAthlete,
  getSubstituteExercise,
  getProgressionExercise,
  adaptSessionForFatigue,
} from './program-exercise-selector'
