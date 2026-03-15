/**
 * Unified Prediction Engine - Main Export
 * 
 * This is the single entry point for all prediction functionality.
 * Import from this file rather than individual engine files.
 */

// =============================================================================
// MAIN ENGINE EXPORTS
// =============================================================================

export {
  // Main prediction function
  generateUnifiedPrediction,
  generateBatchPredictions,
  
  // Modifier calculations
  calculateExperienceModifier,
  calculateFrequencyModifier,
  calculateMomentumModifier,
  calculateRecoveryModifier,
  identifyLimiters,
  
  // Configuration
  SKILL_DIFFICULTY_CONFIG,
  SKILL_NAMES,
  SKILL_LEVELS,
  LIMITER_LABELS,
  LIMITER_TIMELINE_IMPACTS,
  LIMITER_FOCUS_EXERCISES,
} from './skill-progress-prediction-engine'

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  SkillId,
  ConfidenceTier,
  TimelineConfidenceBand,
  PredictionLimiter,
  LimiterCategory,
  TimelineEstimate,
  ProgressionStage,
  MomentumModifier,
  RecoveryModifier,
  UnifiedSkillPrediction,
  SkillDifficultyConfig,
  PredictionInputs,
  BatchPredictionResult,
} from './skill-progress-prediction-engine'

export type {
  PredictionSummary,
  PredictionDisplayConfig,
  MarketingSafeClaims,
} from './prediction-types'

// =============================================================================
// HELPER EXPORTS
// =============================================================================

export {
  getMarketingSafeClaims,
  predictionToSummary,
} from './prediction-types'

// =============================================================================
// CONFIGURATION EXPORTS
// =============================================================================

export {
  TIMELINE_CONFIG,
  MODIFIER_BOUNDS,
  CONFIDENCE_THRESHOLDS,
  CONFIDENCE_BAND_THRESHOLDS,
  DATA_QUALITY_REQUIREMENTS,
  READINESS_WEIGHTS,
  DIFFICULTY_TIERS,
  TENDON_RISK_CONFIG,
  DISPLAY_CONFIG,
  MARKETING_COMPLIANCE,
} from './prediction-config'

// =============================================================================
// NORMALIZER EXPORTS
// =============================================================================

export {
  normalizeStrengthSupport,
  normalizeConsistencyLevel,
  normalizeTendonLevel,
  normalizeExperienceLevel,
  normalizeTrainingFrequency,
  normalizeFatigueToRecovery,
  normalizeStrengthTrend,
  normalizeSkillLevel,
  normalizeBodyweight,
  normalizeSessionCount,
  normalizePredictionInputs,
  calculateDataQualityScore,
} from './prediction-normalizers'

export type { NormalizedRecoveryStatus } from './prediction-normalizers'

// =============================================================================
// SERVICE LAYER EXPORTS
// =============================================================================

export {
  getSkillPrediction,
  getAllSkillPredictions,
  getSpecificSkillPredictions,
  getDashboardPredictionSummary,
  gatherPredictionInputs,
} from './prediction-service'
