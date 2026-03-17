/**
 * Skill Readiness Module
 * 
 * Universal Skill Readiness Calculator Engine for SpartanLab.
 * 
 * Powers:
 * - Public SEO calculator pages (no auth required)
 * - Internal AI program generation
 * - Diagnostic tools
 * 
 * Supported Skills:
 * - Front Lever
 * - Back Lever
 * - Planche
 * - Muscle-Up
 * - HSPU (Handstand Push-Up)
 * - L-Sit
 * - V-Sit
 * - Iron Cross
 */

// =============================================================================
// SERVICE LAYER (Primary API)
// =============================================================================

export {
  // Core functions
  calculateSkillReadiness,
  getSkillPrerequisites,
  getSupportedSkills,
  interpretReadinessScore,
  getRecommendedFocus,
  
  // AI engine integration
  calculateAllSkillReadiness,
  analyzeSkillProfile,
  
  // Prerequisite database
  SKILL_PREREQUISITES,
  
  // Types
  type SkillReadinessInput,
  type SkillReadinessResult,
  type ReadinessClassification,
  type ProgressionStage,
  type LimitingFactorDetail,
  type ComponentBreakdown,
  type SkillPrerequisites,
} from './skillReadinessService'

// =============================================================================
// PREREQUISITE DATA
// =============================================================================

export {
  SKILL_PREREQUISITE_PROFILES,
  getPrerequisiteProfile,
  getAllPrerequisiteProfiles,
  getSkillsByDifficulty,
  getCoachingNotes,
  getInjuryPreventionTips,
  
  type PrerequisiteCategory,
  type PrerequisiteMetric,
  type SkillPrerequisiteProfile,
} from './skillPrerequisiteData'

// =============================================================================
// TYPES (Re-exports for convenience)
// =============================================================================

export type {
  SkillType,
  CanonicalReadinessResult,
  AthleteReadinessInput,
  LimitingFactor,
  ReadinessComponentScores,
} from './skillReadinessTypes'

export type {
  FrontLeverInputs,
  PlancheInputs,
  MuscleUpInputs,
  HSPUInputs,
  LSitInputs,
  VSitInputs,
  BackLeverInputs,
  IronCrossInputs,
  ReadinessResult,
  ReadinessLevel,
  ScoreBreakdown,
} from './skillReadinessTypes'

// =============================================================================
// VALIDATION
// =============================================================================

export {
  validateCalculatorInput,
  type ValidationResult,
  type ValidationError,
  type CalculatorPageConfig,
  type InputFieldConfig,
  type CalculatorState,
  type SkillReadinessAPIRequest,
  type SkillReadinessAPIResponse,
} from './skillReadinessTypes'
