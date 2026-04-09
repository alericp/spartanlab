/**
 * PROGRAMMING TRUTH BUNDLE CONTRACT
 * 
 * =============================================================================
 * READ-ONLY UPSTREAM TRUTH FOR PROGRAM GENERATION
 * =============================================================================
 * 
 * This contract defines the authoritative pre-generation intelligence bundle.
 * It merges canonical profile truth with Neon-backed intelligence systems
 * (benchmarks, skill progressions, performance envelopes, constraint history)
 * into ONE read-only contract for the generator to consume.
 * 
 * DESIGN PRINCIPLES:
 * 1. READ-ONLY: This is input truth, not a write-back model
 * 2. EXPLICIT SOURCE LABELING: Every section has TruthMeta with source/confidence
 * 3. NO SILENT FAKES: If DB truth unavailable, mark as unavailable - don't invent
 * 4. CANONICAL PROFILE PRESERVED: Identity/settings truth always comes from canonical
 * 5. ADDITIVE ENRICHMENT: DB truth enriches, never replaces identity truth
 * 
 * USAGE:
 * - Build once at generation ingress via buildProgrammingTruthBundle()
 * - Pass to generator as upstream context
 * - Use for dosage/load decisions, progression decisions, constraint-aware selection
 */

import type { CanonicalProgrammingProfile } from '../canonical-profile-service'

// =============================================================================
// TRUTH SOURCE & CONFIDENCE TYPES
// =============================================================================

export type TruthSourceLabel =
  | 'canonical_profile'
  | 'neon_athlete_profile'
  | 'neon_skill_progressions'
  | 'neon_benchmarks'
  | 'neon_strength_records'
  | 'neon_performance_envelopes'
  | 'neon_constraint_history'
  | 'neon_training_response'
  | 'neon_workout_logs'
  | 'derived_from_available'
  | 'unavailable'

export type TruthConfidence = 'none' | 'low' | 'medium' | 'high'

export interface TruthMeta {
  source: TruthSourceLabel
  confidence: TruthConfidence
  available: boolean
  lastUpdated?: string | null
  dataPointsCount?: number
  note?: string
}

// =============================================================================
// SECTION: ATHLETE IDENTITY
// =============================================================================

export interface AthleteIdentitySection {
  userId: string
  canonicalProfilePresent: boolean
  onboardingComplete: boolean
  meta: TruthMeta
}

// =============================================================================
// SECTION: CANONICAL PROFILE (passthrough - not duplicated)
// =============================================================================

export interface CanonicalProfileSection {
  value: CanonicalProgrammingProfile
  meta: TruthMeta
}

// =============================================================================
// SECTION: BENCHMARKS (from strength_records + canonical profile)
// =============================================================================

export interface BenchmarkStrengthData {
  pullUpMax?: number | null
  dipMax?: number | null
  pushUpMax?: number | null
  weightedPullUpLoad?: number | null
  weightedPullUpReps?: number | null
  weightedDipLoad?: number | null
  weightedDipReps?: number | null
  wallHspuReps?: number | null
}

export interface BenchmarkSkillData {
  frontLeverProgression?: string | null
  frontLeverHoldSeconds?: number | null
  frontLeverIsAssisted?: boolean
  plancheProgression?: string | null
  plancheHoldSeconds?: number | null
  plancheIsAssisted?: boolean
  hspuProgression?: string | null
  muscleUpReadiness?: string | null
  lSitHoldSeconds?: number | null
  vSitHoldSeconds?: number | null
}

export interface BenchmarksSection {
  strength: BenchmarkStrengthData
  skills: BenchmarkSkillData
  strengthRecordsCount: number
  mostRecentStrengthDate?: string | null
  meta: TruthMeta
}

// =============================================================================
// SECTION: SKILL PROGRESSIONS (from skill_progressions table)
// =============================================================================

export interface SkillProgressionData {
  currentLevel?: number | null
  targetLevel?: number | null
  progressScore?: number | null
  lastUpdated?: string | null
}

export interface SkillProgressionsSection {
  bySkill: Record<string, SkillProgressionData>
  totalSkillsTracked: number
  meta: TruthMeta
}

// =============================================================================
// SECTION: PERFORMANCE ENVELOPES (from performance_envelopes table)
// =============================================================================

export interface PerformanceEnvelopeData {
  preferredRepRangeMin?: number | null
  preferredRepRangeMax?: number | null
  preferredSetRangeMin?: number | null
  preferredSetRangeMax?: number | null
  preferredWeeklyVolumeMin?: number | null
  preferredWeeklyVolumeMax?: number | null
  preferredDensityLevel?: string | null
  fatigueThreshold?: number | null
  confidenceScore?: number | null
  performanceTrend?: string | null
  dataPointsCount?: number | null
}

export interface PerformanceEnvelopesSection {
  byMovementFamily: Record<string, PerformanceEnvelopeData>
  totalEnvelopesTracked: number
  averageConfidenceScore: number | null
  meta: TruthMeta
}

// =============================================================================
// SECTION: CONSTRAINT HISTORY (from constraint_history table)
// =============================================================================

export interface ConstraintHistorySection {
  activeJointRiskFlags: string[]
  recentConstraintPatterns: Array<{
    constraint: string
    severity: string
    detectedAt: string
  }>
  constraintImprovements: Array<{
    constraint: string
    improvement: number
    trend: string
  }>
  totalHistoryRecords: number
  meta: TruthMeta
}

// =============================================================================
// SECTION: TRAINING RESPONSE (from training_response_signals + workout_logs)
// =============================================================================

export interface TrainingResponseSection {
  hasEarnedHistory: boolean
  totalWorkoutsLogged: number
  recentAdherencePattern?: 'consistent' | 'sporadic' | 'unknown' | null
  consistencySignal?: 'high' | 'medium' | 'low' | null
  averageDifficultyRating?: number | null
  averageCompletionRatio?: number | null
  memorySummary?: string | null
  meta: TruthMeta
}

// =============================================================================
// SECTION: DERIVED PROGRAMMING SIGNALS (computed from available truth)
// =============================================================================

export interface DerivedProgrammingSignalsSection {
  // Bias signals based on available truth
  straightArmExposureBias: 'low' | 'medium' | 'high'
  pullingStrengthBias: 'low' | 'medium' | 'high'
  pushingStrengthBias: 'low' | 'medium' | 'high'
  skillSpecificityBias: 'low' | 'medium' | 'high'
  
  // Confidence signals for generation decisions
  dosageConfidence: TruthConfidence
  densityConfidence: TruthConfidence
  progressionConfidence: TruthConfidence
  loadingConfidence: TruthConfidence
  
  // Risk/constraint signals
  hasActiveConstraints: boolean
  constraintInformedSelection: boolean
  
  meta: TruthMeta
}

// =============================================================================
// SECTION: DIAGNOSTICS
// =============================================================================

export interface BundleDiagnostics {
  bundleVersion: 1
  bundleBuiltAt: string
  sectionsAvailable: TruthSourceLabel[]
  sectionsUnavailable: TruthSourceLabel[]
  totalDataPointsAcrossSections: number
  buildDurationMs?: number
  errors: string[]
}

// =============================================================================
// MAIN BUNDLE CONTRACT
// =============================================================================

export interface ProgrammingTruthBundle {
  version: 1
  
  athleteIdentity: AthleteIdentitySection
  canonicalProfile: CanonicalProfileSection
  benchmarks: BenchmarksSection
  skillProgressions: SkillProgressionsSection
  performanceEnvelopes: PerformanceEnvelopesSection
  constraintHistory: ConstraintHistorySection
  trainingResponse: TrainingResponseSection
  derivedSignals: DerivedProgrammingSignalsSection
  
  diagnostics: BundleDiagnostics
}

// =============================================================================
// HELPER TYPE GUARDS
// =============================================================================

export function isSectionAvailable(meta: TruthMeta): boolean {
  return meta.available && meta.confidence !== 'none'
}

export function hasMeaningfulBenchmarks(bundle: ProgrammingTruthBundle): boolean {
  const { benchmarks } = bundle
  if (!benchmarks.meta.available) return false
  
  const { strength, skills } = benchmarks
  return !!(
    strength.pullUpMax ||
    strength.dipMax ||
    strength.weightedPullUpLoad ||
    strength.weightedDipLoad ||
    skills.frontLeverProgression ||
    skills.plancheProgression
  )
}

export function hasPerformanceEnvelopeData(bundle: ProgrammingTruthBundle): boolean {
  return (
    bundle.performanceEnvelopes.meta.available &&
    bundle.performanceEnvelopes.totalEnvelopesTracked > 0
  )
}

export function hasEarnedTrainingHistory(bundle: ProgrammingTruthBundle): boolean {
  return (
    bundle.trainingResponse.meta.available &&
    bundle.trainingResponse.hasEarnedHistory
  )
}

export function getBundleConfidenceLevel(bundle: ProgrammingTruthBundle): TruthConfidence {
  const availableSections = bundle.diagnostics.sectionsAvailable.length
  const totalSections = availableSections + bundle.diagnostics.sectionsUnavailable.length
  
  if (availableSections === 0) return 'none'
  if (availableSections <= 2) return 'low'
  if (availableSections <= 4) return 'medium'
  return 'high'
}
