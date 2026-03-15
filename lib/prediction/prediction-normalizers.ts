/**
 * Prediction Normalizers
 * 
 * Utilities for normalizing and aggregating data from various engines
 * into a consistent format for the unified prediction system.
 */

import type { TrainingMomentum } from '../training-momentum-engine'
import type { FatigueIndicators } from '../fatigue-engine'
import type { StrengthTrend } from '../strength-trend-engine'
import type { SkillGoal, TendonAdaptationLevel } from '../athlete-profile'
import type { PredictionInputs } from './skill-progress-prediction-engine'

// =============================================================================
// STRENGTH SUPPORT NORMALIZER
// =============================================================================

export function normalizeStrengthSupport(
  relevantStrength1RM: number | null,
  bodyweight: number | null,
  requiredThresholdPercent: number
): 'strong' | 'moderate' | 'weak' | 'unknown' {
  if (!bodyweight || bodyweight <= 0) return 'unknown'
  if (relevantStrength1RM === null) return 'unknown'
  
  const percentBW = (relevantStrength1RM / bodyweight) * 100
  const thresholdStrong = requiredThresholdPercent * 1.2
  const thresholdModerate = requiredThresholdPercent * 0.8
  
  if (percentBW >= thresholdStrong) return 'strong'
  if (percentBW >= thresholdModerate) return 'moderate'
  return 'weak'
}

// =============================================================================
// CONSISTENCY LEVEL NORMALIZER
// =============================================================================

export function normalizeConsistencyLevel(
  momentum: TrainingMomentum | null
): 'high' | 'moderate' | 'low' | 'unknown' {
  if (!momentum || !momentum.hasData) return 'unknown'
  
  switch (momentum.level) {
    case 'very_strong':
    case 'strong':
      return 'high'
    case 'developing':
      return 'moderate'
    case 'low':
    case 'none':
    default:
      return 'low'
  }
}

// =============================================================================
// TENDON ADAPTATION NORMALIZER
// =============================================================================

export function normalizeTendonLevel(
  tendonLevel: string | undefined | null
): TendonAdaptationLevel | null {
  if (!tendonLevel) return null
  
  const validLevels: TendonAdaptationLevel[] = [
    'low', 'low_moderate', 'moderate', 'moderate_high', 'high'
  ]
  
  if (validLevels.includes(tendonLevel as TendonAdaptationLevel)) {
    return tendonLevel as TendonAdaptationLevel
  }
  
  return null
}

// =============================================================================
// EXPERIENCE LEVEL NORMALIZER
// =============================================================================

export function normalizeExperienceLevel(
  experienceLevel: string | undefined | null
): string {
  if (!experienceLevel) return 'intermediate'
  
  const level = experienceLevel.toLowerCase()
  if (level === 'advanced' || level === 'expert') return 'advanced'
  if (level === 'beginner' || level === 'novice') return 'beginner'
  return 'intermediate'
}

// =============================================================================
// TRAINING FREQUENCY NORMALIZER
// =============================================================================

export function normalizeTrainingFrequency(
  trainingDaysPerWeek: number | undefined | null
): number {
  if (!trainingDaysPerWeek || trainingDaysPerWeek < 1) return 3 // Default
  if (trainingDaysPerWeek > 7) return 7
  return Math.round(trainingDaysPerWeek)
}

// =============================================================================
// FATIGUE TO RECOVERY STATUS NORMALIZER
// =============================================================================

export interface NormalizedRecoveryStatus {
  status: 'optimal' | 'adequate' | 'compromised' | 'fatigued'
  modifier: number
}

export function normalizeFatigueToRecovery(
  fatigue: FatigueIndicators | null
): NormalizedRecoveryStatus {
  if (!fatigue) {
    return { status: 'adequate', modifier: 1.0 }
  }
  
  switch (fatigue.fatigueScore.level) {
    case 'low':
      return { status: 'optimal', modifier: 0.95 }
    case 'moderate':
      return { status: 'adequate', modifier: 1.0 }
    case 'elevated':
      return { status: 'compromised', modifier: 1.1 }
    case 'high':
      return { status: 'fatigued', modifier: 1.25 }
    default:
      return { status: 'adequate', modifier: 1.0 }
  }
}

// =============================================================================
// STRENGTH TREND TO MODIFIER NORMALIZER
// =============================================================================

export function normalizeStrengthTrend(
  trend: StrengthTrend | null
): { direction: 'improving' | 'stable' | 'regressing'; modifier: number } {
  if (!trend || trend.direction === 'insufficient_data') {
    return { direction: 'stable', modifier: 1.0 }
  }
  
  switch (trend.direction) {
    case 'improving':
      return { direction: 'improving', modifier: 0.95 }
    case 'stable':
      return { direction: 'stable', modifier: 1.0 }
    case 'regressing':
      return { direction: 'regressing', modifier: 1.1 }
    default:
      return { direction: 'stable', modifier: 1.0 }
  }
}

// =============================================================================
// SKILL LEVEL NORMALIZER
// =============================================================================

export function normalizeSkillLevel(
  currentLevel: number | string | undefined | null
): number {
  if (currentLevel === null || currentLevel === undefined) return 0
  
  if (typeof currentLevel === 'number') {
    return Math.max(0, Math.floor(currentLevel))
  }
  
  const parsed = parseInt(currentLevel, 10)
  return isNaN(parsed) ? 0 : Math.max(0, parsed)
}

// =============================================================================
// BODYWEIGHT NORMALIZER
// =============================================================================

export function normalizeBodyweight(
  bodyweight: number | string | undefined | null
): number | null {
  if (bodyweight === null || bodyweight === undefined) return null
  
  const value = typeof bodyweight === 'string' ? parseFloat(bodyweight) : bodyweight
  
  if (isNaN(value) || value <= 0) return null
  
  // Reasonable bodyweight range (60-400 lbs)
  if (value < 60 || value > 400) return null
  
  return value
}

// =============================================================================
// SESSION COUNT NORMALIZER
// =============================================================================

export function normalizeSessionCount(
  sessionCount: number | undefined | null
): number {
  if (!sessionCount || sessionCount < 0) return 0
  return Math.floor(sessionCount)
}

// =============================================================================
// FULL INPUT NORMALIZER
// =============================================================================

interface RawPredictionInputs {
  skillId: string
  currentLevel?: number | string | null
  experienceLevel?: string | null
  trainingDaysPerWeek?: number | null
  bodyweight?: number | string | null
  sessionCount?: number | null
  strengthRecordCount?: number | null
  relevantStrength1RM?: number | null
  requiredStrengthThreshold?: number
  momentum?: TrainingMomentum | null
  fatigue?: FatigueIndicators | null
  weakPoints?: any[] | null
  tendonLevel?: string | null
}

export function normalizePredictionInputs(raw: RawPredictionInputs): PredictionInputs {
  const bodyweight = normalizeBodyweight(raw.bodyweight)
  const momentum = raw.momentum || null
  
  return {
    skillId: raw.skillId as any,
    currentLevel: normalizeSkillLevel(raw.currentLevel),
    experienceLevel: normalizeExperienceLevel(raw.experienceLevel),
    trainingDaysPerWeek: normalizeTrainingFrequency(raw.trainingDaysPerWeek),
    bodyweight,
    sessionCount: normalizeSessionCount(raw.sessionCount),
    strengthRecordCount: normalizeSessionCount(raw.strengthRecordCount),
    strengthSupport: normalizeStrengthSupport(
      raw.relevantStrength1RM ?? null,
      bodyweight,
      raw.requiredStrengthThreshold ?? 30
    ),
    momentum,
    fatigue: raw.fatigue || null,
    weakPoints: raw.weakPoints || null,
    tendonLevel: normalizeTendonLevel(raw.tendonLevel),
    consistencyLevel: normalizeConsistencyLevel(momentum),
    relevantStrength1RM: raw.relevantStrength1RM ?? null,
  }
}

// =============================================================================
// DATA QUALITY CALCULATOR
// =============================================================================

export function calculateDataQualityScore(inputs: PredictionInputs): number {
  let score = 0
  
  // Session data (0-30 points)
  if (inputs.sessionCount >= 10) score += 30
  else if (inputs.sessionCount >= 5) score += 25
  else if (inputs.sessionCount >= 3) score += 15
  else if (inputs.sessionCount >= 1) score += 5
  
  // Strength data (0-25 points)
  if (inputs.strengthRecordCount >= 5) score += 25
  else if (inputs.strengthRecordCount >= 3) score += 20
  else if (inputs.strengthRecordCount >= 1) score += 10
  
  // Bodyweight (0-15 points)
  if (inputs.bodyweight) score += 15
  
  // Momentum data (0-20 points)
  if (inputs.momentum?.hasData) {
    if (inputs.momentum.workoutsLast14Days >= 4) score += 20
    else if (inputs.momentum.workoutsLast14Days >= 2) score += 15
    else score += 10
  }
  
  // Fatigue data (0-10 points)
  if (inputs.fatigue) score += 10
  
  return Math.min(100, score)
}
