/**
 * SpartanLab Doctrine Module
 * 
 * Exports canonical doctrine registry, method profiles, skill support mappings,
 * and coverage validation for the AI engine.
 */

// Method Profile Registry
export {
  METHOD_PROFILES,
  selectMethodProfile,
  applyProfileToExerciseCount,
  isPatternAllowedByProfile,
  getSlotWeightForRole,
  canAddStraightArmWork,
  validateMethodProfileCoverage,
  type MethodProfile,
  type MethodProfileType,
  type MethodProfileContext,
} from './method-profile-registry'

// Skill Support Mappings
export {
  SKILL_SUPPORT_MAPPINGS,
  getSupportMapping,
  getDirectSupportExercises,
  getSkillLimiters,
  getSafeAlternatives,
  isSkillTendonSensitive,
  getMaxStraightArmForSkill,
  type SkillSupportMapping,
  type LimiterMapping,
  type PrerequisiteExercise,
} from './skill-support-mappings'

// Coverage Validation
export {
  validateDoctrineCoverage,
  hasGoalCoverage,
  isDragonFlagIntegrated,
  canMethodProfileResolveSession,
  getMissingLadderExercises,
  type CoverageValidationResult,
  type GoalCoverageStatus,
  type LadderCoverageStatus,
  type LimiterCoverageStatus,
  type DragonFlagCoverageStatus,
  type MethodProfileCoverageStatus,
} from './coverage-validator'

// Unified Doctrine Decision Model
export {
  buildUnifiedDoctrineDecision,
  isExerciseAllowedByDoctrine,
  getDoctrineMaxExercises,
  getDoctrineDosageModifier,
  isSessionStructureDoctrineCompliant,
  type UnifiedDoctrineDecision,
  type DominantSpineType,
  type IntegrationMode,
} from './unified-doctrine-decision-model'
