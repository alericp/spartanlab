/**
 * Unified Prediction Types
 * 
 * Central type definitions for the prediction system.
 * Re-exports all types from the main engine for convenience.
 */

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

// =============================================================================
// ADDITIONAL HELPER TYPES
// =============================================================================

/**
 * Simplified prediction summary for UI components
 */
export interface PredictionSummary {
  skillName: string
  currentLevel: string
  nextLevel: string | null
  timeEstimate: string | null
  readinessPercent: number
  mainLimiter: string | null
  status: 'achieved' | 'on_track' | 'building' | 'needs_data'
}

/**
 * Prediction display config for different UI contexts
 */
export interface PredictionDisplayConfig {
  showDetailedTimeline: boolean
  showConfidenceBand: boolean
  showLimiters: boolean
  showCoachNotes: boolean
  showSessionCount: boolean
  compactMode: boolean
}

/**
 * Marketing-safe prediction claims
 */
export interface MarketingSafeClaims {
  canClaimPersonalized: boolean
  canClaimAdaptive: boolean
  canClaimPredictive: boolean
  canClaimCoaching: boolean
  disclaimerRequired: boolean
  disclaimerText: string
}

/**
 * Get marketing-safe claims based on prediction data quality
 */
export function getMarketingSafeClaims(
  dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
): MarketingSafeClaims {
  const hasEnoughData = dataQuality === 'good' || dataQuality === 'excellent'
  
  return {
    canClaimPersonalized: hasEnoughData,
    canClaimAdaptive: true, // System always adapts
    canClaimPredictive: hasEnoughData,
    canClaimCoaching: true, // Always provides guidance
    disclaimerRequired: true,
    disclaimerText: 'Timeline estimates are projections based on your training data and are not guarantees. Individual results vary based on consistency, recovery, and other factors.',
  }
}

/**
 * Convert full prediction to UI-friendly summary
 */
export function predictionToSummary(
  prediction: import('./skill-progress-prediction-engine').UnifiedSkillPrediction
): PredictionSummary {
  let status: PredictionSummary['status'] = 'building'
  
  if (prediction.currentStage.level >= prediction.longTermTarget.level) {
    status = 'achieved'
  } else if (prediction.dataQuality === 'insufficient') {
    status = 'needs_data'
  } else if (prediction.readinessScore >= 70) {
    status = 'on_track'
  }
  
  return {
    skillName: prediction.skillName,
    currentLevel: prediction.currentStage.name,
    nextLevel: prediction.nextStage?.name || null,
    timeEstimate: prediction.estimatedTimeToNextStage?.displayLabel || null,
    readinessPercent: prediction.readinessScore,
    mainLimiter: prediction.primaryLimiter?.label || null,
    status,
  }
}
