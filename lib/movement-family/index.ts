/**
 * SpartanLab Movement Family System
 * 
 * Central exports for the exercise classification and movement family system.
 * This provides intelligent exercise handling throughout the app.
 */

// Core type definitions
export {
  type MovementFamily,
  type TrainingIntent,
  type SkillCarryover,
  type EquipmentTag,
  type DifficultyBand,
  type ExerciseClassification,
  type MovementFamilyMetadata,
  type SkillCarryoverMetadata,
  type TrainingIntentMetadata,
  type EquipmentProfile,
  MOVEMENT_FAMILY_METADATA,
  SKILL_CARRYOVER_METADATA,
  TRAINING_INTENT_METADATA,
  EQUIPMENT_PROFILES,
} from '../movement-family-registry'

// Exercise classifications
export {
  EXERCISE_CLASSIFICATIONS,
  getExerciseClassification,
  getExercisesByFamily,
  getExercisesByIntent,
  getExercisesWithCarryover,
  getExercisesForEquipment,
  getValidSubstitutions,
  prioritizeForTimeConstraint,
  canCompressExercise,
} from '../exercise-classification-registry'

// Integration functions
export {
  type SmartSubstitution,
  type ExerciseSelectionContext,
  type PrioritizedExerciseList,
  mapEquipmentToTag,
  mapEquipmentArray,
  getSmartSubstitutions,
  getBestSubstitution,
  getExercisesForSkillGoal,
  getAccessoriesForSkill,
  prioritizeForSession,
  trimForTimeBudget,
  getMovementFamiliesForConstraint,
  getExercisesForConstraint,
  getHypertrophyExercises,
  getCalisthenicsHypertrophyPool,
} from '../exercise-family-integration'
