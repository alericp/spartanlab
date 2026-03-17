/**
 * Readiness Module Index
 * 
 * Central export point for all readiness-related functionality.
 * The canonical-readiness-engine is THE single source of truth.
 */

// =============================================================================
// CANONICAL ENGINE (PRIMARY EXPORT)
// =============================================================================

export {
  // Main calculation functions
  calculateCanonicalReadiness,
  calculateAllSkillReadiness,
  calculateReadinessFromProfile,
  calculateSkillReadinessLegacy,
  
  // Explanation generators
  getLimiterExplanation,
  getReadinessSummary,
  generateWhyThisWorkout,
  generateExerciseReason,
  buildWorkoutReasoningSummary,
  
  // Types
  type SkillType,
  type CanonicalReadinessResult,
  type ReadinessComponentScores,
  type LimitingFactor,
  type AthleteReadinessInput,
  type WorkoutReasoningSummary,
  
  // Constants
  LIMITING_FACTOR_LABELS,
} from './canonical-readiness-engine'

// =============================================================================
// SKILL-SPECIFIC CALCULATORS (For direct use in public calculators)
// =============================================================================

export {
  // Individual skill calculators
  calculateFrontLeverReadiness,
  calculatePlancheReadiness,
  calculateMuscleUpReadiness,
  calculateHSPUReadiness,
  calculateLSitReadiness,
  calculateVSitReadiness,
  calculateBackLeverReadiness,
  calculateIronCrossReadiness,
  calculateUnifiedReadiness,
  
  // Types
  type FrontLeverInputs,
  type PlancheInputs,
  type MuscleUpInputs,
  type HSPUInputs,
  type LSitInputs,
  type VSitInputs,
  type BackLeverInputs,
  type IronCrossInputs,
  type ReadinessResult,
  type ReadinessLevel,
  type ScoreBreakdown,
  type UnifiedReadinessResult,
  
  // Utility functions
  getReadinessTier,
  extractWeakPoints,
  getScoreColor,
  getLevelBgColor,
  getStatusColor,
  type ReadinessTier,
  type ReadinessTierInfo,
  type WeakPoint,
} from './skill-readiness'

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

// Re-export calculateSkillReadiness from canonical engine for backward compatibility
// This ensures existing imports continue to work while routing through canonical engine
export { calculateSkillReadinessLegacy as calculateSkillReadiness } from './canonical-readiness-engine'
