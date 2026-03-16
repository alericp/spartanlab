/**
 * Performance Envelope Engine
 * 
 * Learns each athlete's effective training response zones over time.
 * Models best-performing ranges for intensity, reps, sets, session density, 
 * weekly volume, and fatigue tolerance by movement family and goal type.
 * 
 * KEY DESIGN PRINCIPLES:
 * - Movement-family specific (not one global envelope)
 * - Goal-type aware (skill vs strength vs hypertrophy responses differ)
 * - Confidence-tracked (low data = conservative recommendations)
 * - Deterministic and explainable (no random AI outputs)
 * - Learns gradually (doesn't overreact to single workouts)
 */

import type { MovementFamily, TrainingGoalType } from './movement-family-registry'

export type DensityLevel = 'low_density' | 'moderate_density' | 'high_density'

/**
 * Granular rep zone classification for better inference
 */
export type RepZone = 
  | 'strength_low'    // 1-3 reps
  | 'strength_mid'    // 4-6 reps  
  | 'hypertrophy'     // 7-10 reps
  | 'endurance'       // 11-15 reps
  | 'high_rep'        // 16+ reps

/**
 * Response signal from a single workout or session
 */
export interface TrainingResponseSignal {
  athleteId: string
  movementFamily: MovementFamily
  goalType: TrainingGoalType
  
  // Performance data
  repsPerformed: number
  setsPerformed: number
  repRange: 'low' | 'moderate' | 'high' // Legacy: 1-3, 4-6, 7+
  repZone: RepZone // Granular zone
  performanceMetric: number // reps, seconds, or score
  performanceVsPrevious: 'improved' | 'maintained' | 'declined' | 'unknown'
  
  // Session context
  sessionDensity: DensityLevel
  restSecondsUsed: number
  sessionDurationMinutes: number
  
  // Weekly volume context (movement-family specific)
  weeklyVolumePrior: number // Sets in this family BEFORE this session
  weeklyVolumeAfter: number // Sets in this family AFTER this session
  weeklySessionCount: number // How many sessions this week included this family
  
  // Response indicators
  difficultyRating: 'easy' | 'normal' | 'hard'
  completionRatio: number // 0-1
  qualityRating: 'poor' | 'moderate' | 'good' | 'excellent' // Execution quality
  sessionTruncated: boolean
  exercisesSkipped: number
  exercisesSubstituted: number
  
  // Progression tracking
  progressionAdjustment: 'increased' | 'decreased' | 'maintained' | 'none'
  wasDeloadSession: boolean
  
  // Metadata
  recordedAt: Date
  dataQuality: 'complete' | 'partial' | 'minimal' // How complete the logging was
}

/**
 * Inferred performance envelope for an athlete
 * Movement-family and goal-type specific
 */
export interface PerformanceEnvelope {
  athleteId: string
  movementFamily: MovementFamily
  goalType: TrainingGoalType
  
  // Rep range preferences (learned from performance correlation)
  preferredRepRangeMin: number
  preferredRepRangeMax: number
  bestRepZone: RepZone
  repZoneConfidence: number // 0-1, how confident we are in the rep zone
  
  // Set preferences (per session)
  preferredSetRangeMin: number
  preferredSetRangeMax: number
  
  // Weekly volume preferences (movement-family specific)
  preferredWeeklyVolumeMin: number
  preferredWeeklyVolumeMax: number
  toleratedWeeklyVolumeMax: number // Volume threshold before quality degrades
  excessiveVolumeThreshold: number // Volume where performance consistently drops
  weeklyVolumeConfidence: number // 0-1
  
  // Density preferences
  preferredDensityLevel: DensityLevel
  densityTolerance: 'poor' | 'moderate' | 'good' // How well athlete handles compressed sessions
  densityConfidence: number // 0-1
  
  // Fatigue threshold (movement-family specific)
  fatigueThreshold: number // Weekly stress units before degradation
  fatigueThresholdConfidence: number // 0-1
  recoveryNeeds: 'standard' | 'elevated' | 'high' // How much recovery this family needs
  
  // Performance tracking
  performanceTrend: 'improving' | 'stable' | 'declining'
  trendConfidence: number // 0-1
  lastPositiveSignal: Date | null
  lastNegativeSignal: Date | null
  
  // Overall confidence
  confidenceScore: number // 0-1, overall confidence in this envelope
  signalCount: number
  recentSignalCount: number // Signals in last 30 days
  dataQualityScore: number // 0-1, based on logging completeness
  
  // Learning metadata
  lastUpdated: Date
  createdAt: Date
  updateCount: number // How many times this envelope has been updated
}

/**
 * Movement-family-specific fatigue thresholds
 * Straight-arm work typically has lower thresholds than bent-arm
 */
export const MOVEMENT_FAMILY_FATIGUE_DEFAULTS: Record<MovementFamily, {
  baseThreshold: number
  recoveryMultiplier: number
  description: string
}> = {
  vertical_pull: { baseThreshold: 45, recoveryMultiplier: 1.0, description: 'Moderate recovery needs' },
  horizontal_pull: { baseThreshold: 50, recoveryMultiplier: 0.9, description: 'Good recovery' },
  straight_arm_pull: { baseThreshold: 25, recoveryMultiplier: 1.4, description: 'High recovery needs - connective tissue stress' },
  vertical_push: { baseThreshold: 45, recoveryMultiplier: 1.0, description: 'Moderate recovery needs' },
  horizontal_push: { baseThreshold: 50, recoveryMultiplier: 0.9, description: 'Good recovery' },
  straight_arm_push: { baseThreshold: 20, recoveryMultiplier: 1.5, description: 'Very high recovery needs - shoulder/wrist stress' },
  dip_pattern: { baseThreshold: 50, recoveryMultiplier: 0.9, description: 'Good recovery' },
  squat_pattern: { baseThreshold: 55, recoveryMultiplier: 0.8, description: 'Low recovery needs' },
  hinge_pattern: { baseThreshold: 55, recoveryMultiplier: 0.8, description: 'Low recovery needs' },
  unilateral_leg: { baseThreshold: 50, recoveryMultiplier: 0.9, description: 'Good recovery' },
  compression_core: { baseThreshold: 35, recoveryMultiplier: 1.1, description: 'Moderate-high recovery' },
  anti_extension_core: { baseThreshold: 40, recoveryMultiplier: 1.0, description: 'Moderate recovery' },
  anti_rotation_core: { baseThreshold: 45, recoveryMultiplier: 0.9, description: 'Good recovery' },
  rotational_core: { baseThreshold: 50, recoveryMultiplier: 0.8, description: 'Low recovery needs' },
  scapular_control: { baseThreshold: 55, recoveryMultiplier: 0.8, description: 'Low recovery - can train frequently' },
  explosive_pull: { baseThreshold: 30, recoveryMultiplier: 1.3, description: 'High recovery needs - neural demand' },
  explosive_push: { baseThreshold: 35, recoveryMultiplier: 1.2, description: 'Moderate-high recovery - neural demand' },
  joint_integrity: { baseThreshold: 70, recoveryMultiplier: 0.6, description: 'Very low recovery impact' },
  mobility: { baseThreshold: 80, recoveryMultiplier: 0.5, description: 'Minimal recovery impact' },
  transition: { baseThreshold: 35, recoveryMultiplier: 1.2, description: 'Moderate-high recovery - technique intensive' },
  rings_stability: { baseThreshold: 30, recoveryMultiplier: 1.3, description: 'High recovery needs - stabilizer demand' },
  rings_strength: { baseThreshold: 20, recoveryMultiplier: 1.5, description: 'Very high recovery needs - tendon stress' },
  shoulder_isolation: { baseThreshold: 55, recoveryMultiplier: 0.8, description: 'Low recovery needs' },
  arm_isolation: { baseThreshold: 60, recoveryMultiplier: 0.7, description: 'Low recovery needs' },
  grip_strength: { baseThreshold: 45, recoveryMultiplier: 1.0, description: 'Moderate recovery needs' },
  hypertrophy_accessory: { baseThreshold: 60, recoveryMultiplier: 0.7, description: 'Low recovery needs' },
}

/**
 * Learning metrics from signal analysis - enhanced for better inference
 */
interface EnvelopeMetrics {
  // Rep zone scoring (granular)
  repZoneScores: Map<RepZone, { score: number; signalCount: number; avgQuality: number }>
  bestRepZone: RepZone
  repZoneConfidence: number
  
  // Volume analysis
  volumeAnalysis: {
    minObserved: number
    maxObserved: number
    avgObserved: number
    optimalMin: number // Volume range with best performance
    optimalMax: number
    toleratedMax: number // Max before quality drops
    excessiveThreshold: number // Where performance consistently drops
    confidence: number
  }
  
  // Density analysis
  densityAnalysis: {
    scores: Map<DensityLevel, { score: number; signalCount: number }>
    preferred: DensityLevel
    tolerance: 'poor' | 'moderate' | 'good'
    confidence: number
  }
  
  // Fatigue analysis
  fatigueAnalysis: {
    volumeThreshold: number
    hardSessionFrequency: number
    truncationRate: number
    skipRate: number
    substitutionRate: number
    recoveryNeeds: 'standard' | 'elevated' | 'high'
    confidence: number
  }
  
  // Performance trend
  trendAnalysis: {
    direction: 'improving' | 'stable' | 'declining'
    strength: number // 0-1, how strong is the trend
    recentPerformance: number // 0-1
    confidence: number
  }
  
  // Data quality
  dataQuality: {
    signalCount: number
    recentSignalCount: number
    avgCompleteness: number // How complete logging is
    consistency: number // How consistent the logging pattern is
    recency: number // How recent the data is (decay factor)
  }
}

/**
 * Analyze workout signals and infer performance envelope
 * Uses weighted scoring that accounts for signal quality, recency, and consistency
 */
export function analyzePerformanceEnvelope(
  signals: TrainingResponseSignal[],
  existingEnvelope?: PerformanceEnvelope
): PerformanceEnvelope {
  const movementFamily = signals[0]?.movementFamily || existingEnvelope?.movementFamily || 'vertical_pull'
  const goalType = signals[0]?.goalType || existingEnvelope?.goalType || 'strength'
  const athleteId = signals[0]?.athleteId || existingEnvelope?.athleteId || 'unknown'
  
  if (signals.length === 0) {
    // Return conservative defaults with movement-family-specific fatigue thresholds
    return createConservativeEnvelope(athleteId, movementFamily, goalType)
  }

  const metrics = extractMetricsFromSignals(signals, movementFamily)
  
  // Convert rep zone to rep range
  const repRange = repZoneToRange(metrics.bestRepZone)
  
  // Get movement-family-specific defaults
  const familyDefaults = MOVEMENT_FAMILY_FATIGUE_DEFAULTS[movementFamily] || MOVEMENT_FAMILY_FATIGUE_DEFAULTS.vertical_pull
  
  // Calculate overall confidence with weighted components
  const overallConfidence = calculateOverallConfidence(metrics)

  return {
    athleteId,
    movementFamily,
    goalType,
    
    // Rep preferences
    preferredRepRangeMin: repRange.min,
    preferredRepRangeMax: repRange.max,
    bestRepZone: metrics.bestRepZone,
    repZoneConfidence: metrics.repZoneConfidence,
    
    // Set preferences
    preferredSetRangeMin: Math.max(2, Math.round(metrics.volumeAnalysis.optimalMin)),
    preferredSetRangeMax: Math.min(8, Math.round(metrics.volumeAnalysis.optimalMax)),
    
    // Weekly volume preferences (movement-family aware)
    preferredWeeklyVolumeMin: Math.round(metrics.volumeAnalysis.optimalMin),
    preferredWeeklyVolumeMax: Math.round(metrics.volumeAnalysis.optimalMax),
    toleratedWeeklyVolumeMax: Math.round(metrics.volumeAnalysis.toleratedMax),
    excessiveVolumeThreshold: Math.round(metrics.volumeAnalysis.excessiveThreshold),
    weeklyVolumeConfidence: metrics.volumeAnalysis.confidence,
    
    // Density preferences
    preferredDensityLevel: metrics.densityAnalysis.preferred,
    densityTolerance: metrics.densityAnalysis.tolerance,
    densityConfidence: metrics.densityAnalysis.confidence,
    
    // Fatigue threshold (blended from data and family defaults)
    fatigueThreshold: blendFatigueThreshold(
      metrics.fatigueAnalysis.volumeThreshold,
      familyDefaults.baseThreshold,
      metrics.fatigueAnalysis.confidence
    ),
    fatigueThresholdConfidence: metrics.fatigueAnalysis.confidence,
    recoveryNeeds: metrics.fatigueAnalysis.recoveryNeeds,
    
    // Performance trend
    performanceTrend: metrics.trendAnalysis.direction,
    trendConfidence: metrics.trendAnalysis.confidence,
    lastPositiveSignal: findLastSignalOfType(signals, 'positive'),
    lastNegativeSignal: findLastSignalOfType(signals, 'negative'),
    
    // Overall confidence
    confidenceScore: overallConfidence,
    signalCount: signals.length,
    recentSignalCount: metrics.dataQuality.recentSignalCount,
    dataQualityScore: metrics.dataQuality.avgCompleteness,
    
    // Metadata
    lastUpdated: new Date(),
    createdAt: existingEnvelope?.createdAt || new Date(),
    updateCount: (existingEnvelope?.updateCount || 0) + 1,
  }
}

/**
 * Convert rep zone to min/max range
 */
function repZoneToRange(zone: RepZone): { min: number; max: number } {
  switch (zone) {
    case 'strength_low': return { min: 1, max: 3 }
    case 'strength_mid': return { min: 4, max: 6 }
    case 'hypertrophy': return { min: 7, max: 10 }
    case 'endurance': return { min: 11, max: 15 }
    case 'high_rep': return { min: 16, max: 20 }
    default: return { min: 4, max: 8 }
  }
}

/**
 * Classify reps into granular zone
 */
function classifyRepZone(reps: number): RepZone {
  if (reps <= 3) return 'strength_low'
  if (reps <= 6) return 'strength_mid'
  if (reps <= 10) return 'hypertrophy'
  if (reps <= 15) return 'endurance'
  return 'high_rep'
}

/**
 * Blend learned fatigue threshold with family defaults based on confidence
 */
function blendFatigueThreshold(
  learned: number,
  familyDefault: number,
  confidence: number
): number {
  // Low confidence = use more of the default
  // High confidence = use more of the learned value
  return Math.round(learned * confidence + familyDefault * (1 - confidence))
}

/**
 * Find the last signal of a certain type (positive = improving, negative = declining)
 */
function findLastSignalOfType(
  signals: TrainingResponseSignal[],
  type: 'positive' | 'negative'
): Date | null {
  const sorted = [...signals].sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )
  
  for (const signal of sorted) {
    if (type === 'positive' && signal.performanceVsPrevious === 'improved') {
      return new Date(signal.recordedAt)
    }
    if (type === 'negative' && signal.performanceVsPrevious === 'declined') {
      return new Date(signal.recordedAt)
    }
  }
  return null
}

/**
 * Calculate overall confidence from component confidences
 */
function calculateOverallConfidence(metrics: EnvelopeMetrics): number {
  const weights = {
    repZone: 0.2,
    volume: 0.25,
    density: 0.15,
    fatigue: 0.2,
    trend: 0.1,
    dataQuality: 0.1,
  }
  
  const dataQualityConfidence = Math.min(
    metrics.dataQuality.signalCount / 15, // More signals = higher confidence
    1
  ) * metrics.dataQuality.avgCompleteness * metrics.dataQuality.recency
  
  return Math.min(1, 
    metrics.repZoneConfidence * weights.repZone +
    metrics.volumeAnalysis.confidence * weights.volume +
    metrics.densityAnalysis.confidence * weights.density +
    metrics.fatigueAnalysis.confidence * weights.fatigue +
    metrics.trendAnalysis.confidence * weights.trend +
    dataQualityConfidence * weights.dataQuality
  )
}

/**
 * Extract comprehensive metrics from training signals
 * Uses weighted scoring that accounts for recency and data quality
 */
function extractMetricsFromSignals(
  signals: TrainingResponseSignal[],
  movementFamily: MovementFamily
): EnvelopeMetrics {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Initialize rep zone tracking
  const repZoneScores = new Map<RepZone, { score: number; signalCount: number; avgQuality: number }>([
    ['strength_low', { score: 0, signalCount: 0, avgQuality: 0 }],
    ['strength_mid', { score: 0, signalCount: 0, avgQuality: 0 }],
    ['hypertrophy', { score: 0, signalCount: 0, avgQuality: 0 }],
    ['endurance', { score: 0, signalCount: 0, avgQuality: 0 }],
    ['high_rep', { score: 0, signalCount: 0, avgQuality: 0 }],
  ])
  
  // Initialize density tracking
  const densityScores = new Map<DensityLevel, { score: number; signalCount: number }>([
    ['low_density', { score: 0, signalCount: 0 }],
    ['moderate_density', { score: 0, signalCount: 0 }],
    ['high_density', { score: 0, signalCount: 0 }],
  ])
  
  // Volume tracking
  const weeklyVolumes: number[] = []
  const volumeWithQuality: Array<{ volume: number; quality: number; wasHard: boolean }> = []
  
  // Fatigue tracking
  let hardSessionCount = 0
  let truncatedCount = 0
  let skippedCount = 0
  let substitutedCount = 0
  
  // Performance tracking
  let improvedCount = 0
  let declinedCount = 0
  let recentSignalCount = 0
  
  // Data quality
  let totalCompleteness = 0
  
  for (const signal of signals) {
    // Calculate recency weight (more recent = higher weight)
    const signalDate = new Date(signal.recordedAt)
    const daysSinceSignal = (now.getTime() - signalDate.getTime()) / (24 * 60 * 60 * 1000)
    const recencyWeight = Math.max(0.3, 1 - (daysSinceSignal / 90)) // Decay over 90 days
    
    // Track recent signals
    if (signalDate >= thirtyDaysAgo) {
      recentSignalCount++
    }
    
    // Calculate quality score for this signal
    const qualityScore = calculateSignalQuality(signal)
    
    // Rep zone scoring
    // Score based on: performance improvement + high completion + appropriate difficulty
    const zone = signal.repZone || classifyRepZone(signal.repsPerformed)
    const performanceBonus = signal.performanceVsPrevious === 'improved' ? 1.5 :
                            signal.performanceVsPrevious === 'maintained' ? 1.0 :
                            signal.performanceVsPrevious === 'declined' ? 0.5 : 0.8
    const completionBonus = signal.completionRatio
    const difficultyBonus = signal.difficultyRating === 'normal' ? 1.2 :
                           signal.difficultyRating === 'easy' ? 0.9 : 0.7
    
    const repScore = performanceBonus * completionBonus * difficultyBonus * recencyWeight
    const zoneData = repZoneScores.get(zone)!
    zoneData.score += repScore
    zoneData.signalCount++
    zoneData.avgQuality = (zoneData.avgQuality * (zoneData.signalCount - 1) + qualityScore) / zoneData.signalCount
    
    // Density scoring
    // Good density tolerance = high completion + appropriate difficulty at that density
    const densityData = densityScores.get(signal.sessionDensity)!
    const densityScore = signal.completionRatio * 
                        (signal.difficultyRating === 'hard' ? 0.6 : 1.0) *
                        (signal.sessionTruncated ? 0.5 : 1.0) *
                        recencyWeight
    densityData.score += densityScore
    densityData.signalCount++
    
    // Volume tracking (use weekly volume after the session)
    if (signal.weeklyVolumeAfter > 0) {
      weeklyVolumes.push(signal.weeklyVolumeAfter)
      volumeWithQuality.push({
        volume: signal.weeklyVolumeAfter,
        quality: qualityScore,
        wasHard: signal.difficultyRating === 'hard',
      })
    }
    
    // Fatigue indicators
    if (signal.difficultyRating === 'hard') hardSessionCount++
    if (signal.sessionTruncated) truncatedCount++
    if (signal.exercisesSkipped > 0) skippedCount++
    if (signal.exercisesSubstituted > 0) substitutedCount++
    
    // Performance trend tracking
    if (signal.performanceVsPrevious === 'improved') improvedCount++
    if (signal.performanceVsPrevious === 'declined') declinedCount++
    
    // Data completeness
    const completeness = signal.dataQuality === 'complete' ? 1.0 :
                        signal.dataQuality === 'partial' ? 0.7 : 0.4
    totalCompleteness += completeness
  }
  
  // Calculate best rep zone
  const bestRepZone = findBestRepZone(repZoneScores)
  const repZoneConfidence = calculateRepZoneConfidence(repZoneScores)
  
  // Calculate volume analysis
  const volumeAnalysis = analyzeVolumePatterns(volumeWithQuality, movementFamily)
  
  // Calculate density analysis
  const densityAnalysis = analyzeDensityPatterns(densityScores)
  
  // Calculate fatigue analysis
  const fatigueAnalysis = analyzeFatiguePatterns(
    signals.length,
    hardSessionCount,
    truncatedCount,
    skippedCount,
    substitutedCount,
    weeklyVolumes,
    movementFamily
  )
  
  // Calculate trend analysis
  const trendAnalysis = analyzeTrendPatterns(signals, improvedCount, declinedCount)
  
  // Calculate data quality
  const avgCompleteness = signals.length > 0 ? totalCompleteness / signals.length : 0
  const recency = recentSignalCount > 0 ? Math.min(1, recentSignalCount / 5) : 0
  
  return {
    repZoneScores,
    bestRepZone,
    repZoneConfidence,
    volumeAnalysis,
    densityAnalysis,
    fatigueAnalysis,
    trendAnalysis,
    dataQuality: {
      signalCount: signals.length,
      recentSignalCount,
      avgCompleteness,
      consistency: calculateLoggingConsistency(signals),
      recency,
    },
  }
}

/**
 * Calculate quality score for a single signal
 */
function calculateSignalQuality(signal: TrainingResponseSignal): number {
  let quality = 0.5 // Base
  
  // Completion bonus
  quality += signal.completionRatio * 0.2
  
  // Data completeness bonus
  if (signal.dataQuality === 'complete') quality += 0.2
  else if (signal.dataQuality === 'partial') quality += 0.1
  
  // Non-truncated bonus
  if (!signal.sessionTruncated) quality += 0.05
  
  // No skips bonus
  if (signal.exercisesSkipped === 0) quality += 0.05
  
  return Math.min(1, quality)
}

/**
 * Find the best performing rep zone
 */
function findBestRepZone(
  scores: Map<RepZone, { score: number; signalCount: number; avgQuality: number }>
): RepZone {
  let bestZone: RepZone = 'strength_mid'
  let bestScore = 0
  
  for (const [zone, data] of scores) {
    // Only consider zones with enough signals
    if (data.signalCount >= 2) {
      // Normalize by signal count and weight by quality
      const normalizedScore = (data.score / data.signalCount) * data.avgQuality
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore
        bestZone = zone
      }
    }
  }
  
  return bestZone
}

/**
 * Calculate confidence in rep zone inference
 */
function calculateRepZoneConfidence(
  scores: Map<RepZone, { score: number; signalCount: number; avgQuality: number }>
): number {
  let totalSignals = 0
  let maxSignals = 0
  
  for (const [, data] of scores) {
    totalSignals += data.signalCount
    maxSignals = Math.max(maxSignals, data.signalCount)
  }
  
  if (totalSignals < 3) return 0.1 // Very low confidence
  if (totalSignals < 8) return 0.3 // Low confidence
  
  // Higher confidence if one zone clearly dominates
  const dominance = maxSignals / totalSignals
  return Math.min(0.9, 0.3 + dominance * 0.5 + Math.min(totalSignals / 20, 0.2))
}

/**
 * Analyze volume patterns to find optimal ranges
 */
function analyzeVolumePatterns(
  volumeData: Array<{ volume: number; quality: number; wasHard: boolean }>,
  movementFamily: MovementFamily
): EnvelopeMetrics['volumeAnalysis'] {
  const familyDefaults = MOVEMENT_FAMILY_FATIGUE_DEFAULTS[movementFamily] || MOVEMENT_FAMILY_FATIGUE_DEFAULTS.vertical_pull
  
  if (volumeData.length < 3) {
    // Not enough data - return family-specific defaults
    return {
      minObserved: 0,
      maxObserved: 0,
      avgObserved: 0,
      optimalMin: Math.round(familyDefaults.baseThreshold * 0.5),
      optimalMax: Math.round(familyDefaults.baseThreshold * 0.8),
      toleratedMax: familyDefaults.baseThreshold,
      excessiveThreshold: Math.round(familyDefaults.baseThreshold * 1.3),
      confidence: 0.1,
    }
  }
  
  const volumes = volumeData.map(d => d.volume)
  const minObserved = Math.min(...volumes)
  const maxObserved = Math.max(...volumes)
  const avgObserved = volumes.reduce((a, b) => a + b, 0) / volumes.length
  
  // Find volume range where quality was best
  // Sort by volume and find sweet spot
  const sorted = [...volumeData].sort((a, b) => a.volume - b.volume)
  
  // Calculate quality scores for volume quartiles
  const quartileSize = Math.ceil(sorted.length / 4)
  const quartiles: Array<{ avgVolume: number; avgQuality: number; hardRate: number }> = []
  
  for (let i = 0; i < 4; i++) {
    const start = i * quartileSize
    const end = Math.min(start + quartileSize, sorted.length)
    const slice = sorted.slice(start, end)
    
    if (slice.length > 0) {
      quartiles.push({
        avgVolume: slice.reduce((s, d) => s + d.volume, 0) / slice.length,
        avgQuality: slice.reduce((s, d) => s + d.quality, 0) / slice.length,
        hardRate: slice.filter(d => d.wasHard).length / slice.length,
      })
    }
  }
  
  // Find optimal quartile (highest quality, moderate hard rate)
  let optimalQuartile = quartiles[1] || quartiles[0] // Default to second quartile
  let bestScore = 0
  
  for (const q of quartiles) {
    // Score: quality bonus, hard rate penalty
    const score = q.avgQuality * (1 - q.hardRate * 0.3)
    if (score > bestScore) {
      bestScore = score
      optimalQuartile = q
    }
  }
  
  // Find tolerated max (where hard rate starts climbing)
  const highVolumeQuartiles = quartiles.slice(-2)
  const toleratedMax = highVolumeQuartiles[0]?.hardRate < 0.5 
    ? highVolumeQuartiles[0]?.avgVolume || maxObserved 
    : optimalQuartile.avgVolume * 1.2
  
  // Find excessive threshold (where quality drops significantly)
  const excessiveThreshold = Math.max(
    toleratedMax * 1.2,
    quartiles[quartiles.length - 1]?.avgVolume || maxObserved
  )
  
  // Calculate confidence based on data quality
  const confidence = Math.min(
    0.9,
    0.2 + (volumeData.length / 20) * 0.3 + // More data = higher confidence
    (maxObserved - minObserved > 5 ? 0.2 : 0) + // Variety in volume = higher confidence
    (quartiles.length >= 3 ? 0.2 : 0) // Enough quartiles = higher confidence
  )
  
  return {
    minObserved,
    maxObserved,
    avgObserved,
    optimalMin: Math.max(3, Math.round(optimalQuartile.avgVolume * 0.8)),
    optimalMax: Math.round(optimalQuartile.avgVolume * 1.2),
    toleratedMax: Math.round(toleratedMax),
    excessiveThreshold: Math.round(excessiveThreshold),
    confidence,
  }
}

/**
 * Analyze density tolerance patterns
 */
function analyzeDensityPatterns(
  scores: Map<DensityLevel, { score: number; signalCount: number }>
): EnvelopeMetrics['densityAnalysis'] {
  let bestDensity: DensityLevel = 'moderate_density'
  let bestScore = 0
  let totalSignals = 0
  
  for (const [density, data] of scores) {
    totalSignals += data.signalCount
    if (data.signalCount > 0) {
      const normalizedScore = data.score / data.signalCount
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore
        bestDensity = density
      }
    }
  }
  
  // Determine density tolerance based on high-density performance
  const highDensityData = scores.get('high_density')!
  const highDensityPerformance = highDensityData.signalCount > 0 
    ? highDensityData.score / highDensityData.signalCount 
    : 0.5
  
  const tolerance: 'poor' | 'moderate' | 'good' = 
    highDensityPerformance > 0.8 ? 'good' :
    highDensityPerformance > 0.5 ? 'moderate' : 'poor'
  
  const confidence = totalSignals >= 5 ? Math.min(0.8, 0.3 + totalSignals / 20) : 0.2
  
  return {
    scores,
    preferred: bestDensity,
    tolerance,
    confidence,
  }
}

/**
 * Analyze fatigue patterns for this movement family
 */
function analyzeFatiguePatterns(
  totalSignals: number,
  hardSessionCount: number,
  truncatedCount: number,
  skippedCount: number,
  substitutedCount: number,
  weeklyVolumes: number[],
  movementFamily: MovementFamily
): EnvelopeMetrics['fatigueAnalysis'] {
  const familyDefaults = MOVEMENT_FAMILY_FATIGUE_DEFAULTS[movementFamily] || MOVEMENT_FAMILY_FATIGUE_DEFAULTS.vertical_pull
  
  const hardRate = totalSignals > 0 ? hardSessionCount / totalSignals : 0
  const truncationRate = totalSignals > 0 ? truncatedCount / totalSignals : 0
  const skipRate = totalSignals > 0 ? skippedCount / totalSignals : 0
  const subRate = totalSignals > 0 ? substitutedCount / totalSignals : 0
  
  // Find volume threshold where hard sessions start appearing
  let volumeThreshold = familyDefaults.baseThreshold
  if (weeklyVolumes.length >= 3) {
    // Sort volumes and find where hard sessions cluster
    const sorted = [...weeklyVolumes].sort((a, b) => a - b)
    const upperQuartile = sorted[Math.floor(sorted.length * 0.75)] || familyDefaults.baseThreshold
    volumeThreshold = upperQuartile
  }
  
  // Determine recovery needs based on rates
  const recoveryNeedsScore = hardRate * 0.4 + truncationRate * 0.3 + skipRate * 0.2 + subRate * 0.1
  const recoveryNeeds: 'standard' | 'elevated' | 'high' = 
    recoveryNeedsScore > 0.4 ? 'high' :
    recoveryNeedsScore > 0.2 ? 'elevated' : 'standard'
  
  // Confidence based on signal count
  const confidence = Math.min(0.85, 0.2 + totalSignals / 15)
  
  return {
    volumeThreshold,
    hardSessionFrequency: hardRate,
    truncationRate,
    skipRate,
    substitutionRate: subRate,
    recoveryNeeds,
    confidence,
  }
}

/**
 * Analyze performance trend patterns
 */
function analyzeTrendPatterns(
  signals: TrainingResponseSignal[],
  improvedCount: number,
  declinedCount: number
): EnvelopeMetrics['trendAnalysis'] {
  if (signals.length < 3) {
    return { direction: 'stable', strength: 0, recentPerformance: 0.5, confidence: 0.1 }
  }
  
  // Look at recent signals more heavily
  const recent = signals
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 5)
  
  const recentImproved = recent.filter(s => s.performanceVsPrevious === 'improved').length
  const recentDeclined = recent.filter(s => s.performanceVsPrevious === 'declined').length
  
  const recentPerformance = recent.reduce((sum, s) => {
    return sum + (s.performanceVsPrevious === 'improved' ? 1 : 
                  s.performanceVsPrevious === 'maintained' ? 0.6 :
                  s.performanceVsPrevious === 'declined' ? 0.2 : 0.5)
  }, 0) / recent.length
  
  // Determine direction
  let direction: 'improving' | 'stable' | 'declining' = 'stable'
  if (recentImproved >= 3 || (recentImproved > recentDeclined && recentImproved >= 2)) {
    direction = 'improving'
  } else if (recentDeclined >= 3 || (recentDeclined > recentImproved && recentDeclined >= 2)) {
    direction = 'declining'
  }
  
  // Calculate trend strength
  const totalWithTrend = improvedCount + declinedCount
  const strength = totalWithTrend > 0 
    ? Math.abs(improvedCount - declinedCount) / totalWithTrend 
    : 0
  
  // Confidence based on signal count and trend clarity
  const confidence = Math.min(0.85, 
    0.2 + 
    (signals.length / 15) * 0.3 + 
    strength * 0.3 +
    (recent.length / 5) * 0.2
  )
  
  return { direction, strength, recentPerformance, confidence }
}

/**
 * Calculate logging consistency (how regularly the athlete logs)
 */
function calculateLoggingConsistency(signals: TrainingResponseSignal[]): number {
  if (signals.length < 2) return 0
  
  // Sort by date
  const sorted = [...signals].sort((a, b) => 
    new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )
  
  // Calculate gaps between sessions
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const gap = (new Date(sorted[i].recordedAt).getTime() - new Date(sorted[i-1].recordedAt).getTime()) / (24 * 60 * 60 * 1000)
    gaps.push(gap)
  }
  
  // Consistency = inverse of variance in gaps
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length
  
  // High variance = low consistency
  return Math.max(0.2, 1 - Math.min(variance / 100, 0.8))
}

/**
 * Create conservative envelope for new athletes
 * Uses movement-family-specific defaults
 */
function createConservativeEnvelope(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType
): PerformanceEnvelope {
  const familyDefaults = MOVEMENT_FAMILY_FATIGUE_DEFAULTS[movementFamily] || MOVEMENT_FAMILY_FATIGUE_DEFAULTS.vertical_pull
  
  // Goal-type specific rep range defaults
  const repRangeDefaults: Record<TrainingGoalType, { min: number; max: number; zone: RepZone }> = {
    strength: { min: 3, max: 6, zone: 'strength_mid' },
    skill: { min: 3, max: 5, zone: 'strength_low' },
    hypertrophy: { min: 8, max: 12, zone: 'hypertrophy' },
    endurance: { min: 12, max: 20, zone: 'endurance' },
    power: { min: 1, max: 3, zone: 'strength_low' },
    mobility: { min: 1, max: 1, zone: 'strength_low' },
    conditioning: { min: 15, max: 25, zone: 'high_rep' },
  }
  
  const repDefaults = repRangeDefaults[goalType] || repRangeDefaults.strength
  
  return {
    athleteId,
    movementFamily,
    goalType,
    
    // Rep preferences - conservative defaults by goal type
    preferredRepRangeMin: repDefaults.min,
    preferredRepRangeMax: repDefaults.max,
    bestRepZone: repDefaults.zone,
    repZoneConfidence: 0,
    
    // Set preferences - conservative
    preferredSetRangeMin: 3,
    preferredSetRangeMax: 5,
    
    // Weekly volume - movement-family specific
    preferredWeeklyVolumeMin: Math.round(familyDefaults.baseThreshold * 0.4),
    preferredWeeklyVolumeMax: Math.round(familyDefaults.baseThreshold * 0.7),
    toleratedWeeklyVolumeMax: familyDefaults.baseThreshold,
    excessiveVolumeThreshold: Math.round(familyDefaults.baseThreshold * 1.3),
    weeklyVolumeConfidence: 0,
    
    // Density - conservative moderate
    preferredDensityLevel: 'moderate_density',
    densityTolerance: 'moderate',
    densityConfidence: 0,
    
    // Fatigue - use family defaults
    fatigueThreshold: familyDefaults.baseThreshold,
    fatigueThresholdConfidence: 0,
    recoveryNeeds: familyDefaults.recoveryMultiplier > 1.2 ? 'elevated' : 'standard',
    
    // Performance - unknown
    performanceTrend: 'stable',
    trendConfidence: 0,
    lastPositiveSignal: null,
    lastNegativeSignal: null,
    
    // Confidence - zero for new envelope
    confidenceScore: 0,
    signalCount: 0,
    recentSignalCount: 0,
    dataQualityScore: 0,
    
    // Metadata
    lastUpdated: new Date(),
    createdAt: new Date(),
    updateCount: 0,
  }
}

/**
 * Generate coaching insight from envelope
 * Produces concise, premium-quality insights based on confidence level
 */
export function generateEnvelopeInsight(envelope: PerformanceEnvelope): string {
  const familyLabel = formatMovementFamily(envelope.movementFamily)
  
  // Very low confidence - need more data
  if (envelope.confidenceScore < 0.2) {
    return `Continue logging ${familyLabel} sessions to personalize your programming.`
  }
  
  // Low confidence - tentative insights
  if (envelope.confidenceScore < 0.4) {
    const tentativeInsights: string[] = []
    
    if (envelope.performanceTrend === 'declining' && envelope.trendConfidence > 0.3) {
      tentativeInsights.push(`Early signs suggest ${familyLabel} may need a reduced workload.`)
    } else if (envelope.performanceTrend === 'improving') {
      tentativeInsights.push(`${familyLabel} showing early positive response to current programming.`)
    }
    
    return tentativeInsights.length > 0 
      ? tentativeInsights.join(' ')
      : `Building your ${familyLabel} response profile. More sessions will refine recommendations.`
  }

  const insights: string[] = []

  // Rep range insight (only if confident)
  if (envelope.repZoneConfidence > 0.4) {
    const repLabel = formatRepZone(envelope.bestRepZone)
    insights.push(`You respond best to ${repLabel} (${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax} reps) for ${familyLabel}.`)
  }

  // Volume insight (only if confident)
  if (envelope.weeklyVolumeConfidence > 0.4) {
    const optimalWeekly = Math.round((envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2)
    insights.push(`Optimal weekly volume: ${optimalWeekly} sets.`)
    
    // Add tolerance warning if approaching limits
    if (envelope.toleratedWeeklyVolumeMax - envelope.preferredWeeklyVolumeMax < 5) {
      insights.push(`Quality degrades above ${envelope.toleratedWeeklyVolumeMax} weekly sets.`)
    }
  }

  // Density insight (only if confident)
  if (envelope.densityConfidence > 0.4) {
    if (envelope.densityTolerance === 'poor') {
      insights.push(`${familyLabel} performs better with longer rest periods.`)
    } else if (envelope.densityTolerance === 'good') {
      insights.push(`You tolerate higher-density ${familyLabel} circuits well.`)
    }
  }

  // Fatigue/recovery insight
  if (envelope.fatigueThresholdConfidence > 0.4 && envelope.recoveryNeeds !== 'standard') {
    if (envelope.recoveryNeeds === 'high') {
      insights.push(`${familyLabel} requires elevated recovery focus.`)
    }
  }

  // Trend insight (only if confident and notable)
  if (envelope.trendConfidence > 0.5) {
    if (envelope.performanceTrend === 'improving') {
      insights.push(`${familyLabel} showing consistent progress.`)
    } else if (envelope.performanceTrend === 'declining') {
      insights.push(`${familyLabel} performance declining. Consider volume reduction or deload.`)
    }
  }

  return insights.length > 0 
    ? insights.join(' ')
    : `${familyLabel} programming is optimized for your current response patterns.`
}

/**
 * Format movement family for display
 */
function formatMovementFamily(family: MovementFamily): string {
  const labels: Record<MovementFamily, string> = {
    vertical_pull: 'Vertical pulling',
    horizontal_pull: 'Horizontal pulling',
    straight_arm_pull: 'Straight-arm pulling',
    vertical_push: 'Vertical pushing',
    horizontal_push: 'Horizontal pushing',
    straight_arm_push: 'Straight-arm pushing',
    dip_pattern: 'Dip work',
    squat_pattern: 'Squat work',
    hinge_pattern: 'Hip hinge',
    unilateral_leg: 'Single-leg work',
    compression_core: 'Compression core',
    anti_extension_core: 'Anti-extension core',
    anti_rotation_core: 'Anti-rotation core',
    rotational_core: 'Rotational core',
    scapular_control: 'Scapular control',
    explosive_pull: 'Explosive pulling',
    explosive_push: 'Explosive pushing',
    joint_integrity: 'Joint integrity',
    mobility: 'Mobility',
    transition: 'Transition work',
    rings_stability: 'Rings stability',
    rings_strength: 'Rings strength',
    shoulder_isolation: 'Shoulder isolation',
    arm_isolation: 'Arm isolation',
    grip_strength: 'Grip strength',
    hypertrophy_accessory: 'Accessory',
  }
  return labels[family] || family.replace(/_/g, ' ')
}

/**
 * Format rep zone for display
 */
function formatRepZone(zone: RepZone): string {
  switch (zone) {
    case 'strength_low': return 'lower-rep strength work'
    case 'strength_mid': return 'moderate-rep strength work'
    case 'hypertrophy': return 'hypertrophy-range work'
    case 'endurance': return 'muscular endurance work'
    case 'high_rep': return 'high-rep conditioning'
    default: return 'moderate-rep work'
  }
}

/**
 * Get detailed program recommendations based on envelope
 * Returns conservative defaults when confidence is low
 */
export interface EnvelopeRecommendation {
  repRange: { min: number; max: number; display: string }
  weeklyVolume: { min: number; max: number; tolerated: number; display: string }
  setsPerSession: { min: number; max: number }
  sessionDensity: { preferred: DensityLevel; tolerance: 'poor' | 'moderate' | 'good'; display: string }
  fatigueThreshold: number
  recoveryNeeds: 'standard' | 'elevated' | 'high'
  progressionPace: 'conservative' | 'moderate' | 'aggressive'
  confidence: {
    overall: number
    repRange: number
    volume: number
    density: number
    fatigue: number
  }
  warnings: string[]
  coachingNotes: string[]
}

export function getEnvelopeBasedRecommendations(
  envelope: PerformanceEnvelope
): EnvelopeRecommendation {
  const familyLabel = formatMovementFamily(envelope.movementFamily)
  const warnings: string[] = []
  const coachingNotes: string[] = []
  
  // Determine progression pace based on confidence and trend
  let progressionPace: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  
  if (envelope.confidenceScore < 0.3) {
    progressionPace = 'conservative'
    coachingNotes.push(`Limited data for ${familyLabel}. Using conservative programming.`)
  } else if (envelope.performanceTrend === 'improving' && envelope.trendConfidence > 0.5) {
    progressionPace = 'moderate'
  } else if (envelope.performanceTrend === 'declining') {
    progressionPace = 'conservative'
    warnings.push(`${familyLabel} performance declining. Recommending reduced progression pace.`)
  }
  
  // Add fatigue warnings
  if (envelope.performanceTrend === 'declining' && envelope.trendConfidence > 0.4) {
    warnings.push(`Recent performance decline in ${familyLabel}. Consider deload or volume reduction.`)
  }
  
  // Add recovery warnings
  if (envelope.recoveryNeeds === 'high') {
    coachingNotes.push(`${familyLabel} requires extended recovery. Space sessions appropriately.`)
  }
  
  // Format outputs
  const repDisplay = `${envelope.preferredRepRangeMin}–${envelope.preferredRepRangeMax}`
  const volumeDisplay = `${envelope.preferredWeeklyVolumeMin}–${envelope.preferredWeeklyVolumeMax} sets/week`
  const densityDisplay = envelope.preferredDensityLevel.replace(/_/g, ' ')

  return {
    repRange: {
      min: envelope.preferredRepRangeMin,
      max: envelope.preferredRepRangeMax,
      display: repDisplay,
    },
    weeklyVolume: {
      min: envelope.preferredWeeklyVolumeMin,
      max: envelope.preferredWeeklyVolumeMax,
      tolerated: envelope.toleratedWeeklyVolumeMax,
      display: volumeDisplay,
    },
    setsPerSession: {
      min: envelope.preferredSetRangeMin,
      max: envelope.preferredSetRangeMax,
    },
    sessionDensity: {
      preferred: envelope.preferredDensityLevel,
      tolerance: envelope.densityTolerance,
      display: densityDisplay,
    },
    fatigueThreshold: envelope.fatigueThreshold,
    recoveryNeeds: envelope.recoveryNeeds,
    progressionPace,
    confidence: {
      overall: envelope.confidenceScore,
      repRange: envelope.repZoneConfidence,
      volume: envelope.weeklyVolumeConfidence,
      density: envelope.densityConfidence,
      fatigue: envelope.fatigueThresholdConfidence,
    },
    warnings,
    coachingNotes,
  }
}

/**
 * Update envelope with new signals using incremental learning
 * Uses exponential moving average to blend new data with existing envelope
 * This avoids the need to store or reconstruct all historical signals
 */
export function updateEnvelopeWithSignals(
  existingEnvelope: PerformanceEnvelope,
  newSignals: TrainingResponseSignal[]
): PerformanceEnvelope {
  if (newSignals.length === 0) {
    return existingEnvelope
  }
  
  // Calculate learning rate based on existing confidence
  // High confidence = slower learning (more resistant to change)
  // Low confidence = faster learning (more responsive to new data)
  const baseLearningRate = 0.3
  const adjustedLearningRate = baseLearningRate * (1 - existingEnvelope.confidenceScore * 0.5)
  
  // Analyze new signals
  const newMetrics = extractMetricsFromSignals(newSignals, existingEnvelope.movementFamily)
  const newRepRange = repZoneToRange(newMetrics.bestRepZone)
  
  // Blend old and new values using learning rate
  const blend = (oldVal: number, newVal: number, weight: number = adjustedLearningRate): number => {
    return Math.round(oldVal * (1 - weight) + newVal * weight)
  }
  
  // Blend rep ranges
  const blendedRepMin = blend(existingEnvelope.preferredRepRangeMin, newRepRange.min)
  const blendedRepMax = blend(existingEnvelope.preferredRepRangeMax, newRepRange.max)
  
  // Blend volumes
  const blendedVolMin = blend(existingEnvelope.preferredWeeklyVolumeMin, newMetrics.volumeAnalysis.optimalMin)
  const blendedVolMax = blend(existingEnvelope.preferredWeeklyVolumeMax, newMetrics.volumeAnalysis.optimalMax)
  const blendedTolerated = blend(existingEnvelope.toleratedWeeklyVolumeMax, newMetrics.volumeAnalysis.toleratedMax)
  const blendedExcessive = blend(existingEnvelope.excessiveVolumeThreshold, newMetrics.volumeAnalysis.excessiveThreshold)
  
  // Blend fatigue threshold
  const blendedFatigue = blend(existingEnvelope.fatigueThreshold, newMetrics.fatigueAnalysis.volumeThreshold)
  
  // Update signal counts
  const newSignalCount = existingEnvelope.signalCount + newSignals.length
  const newRecentCount = Math.min(
    existingEnvelope.recentSignalCount + newMetrics.dataQuality.recentSignalCount,
    30 // Cap at 30
  )
  
  // Blend confidence scores (increase if we're getting consistent data)
  const confidenceIncrease = newMetrics.dataQuality.avgCompleteness > 0.7 ? 0.05 : 0.02
  const blendedOverallConfidence = Math.min(0.95, existingEnvelope.confidenceScore + confidenceIncrease)
  const blendedRepConfidence = blendConfidence(existingEnvelope.repZoneConfidence, newMetrics.repZoneConfidence, adjustedLearningRate)
  const blendedVolConfidence = blendConfidence(existingEnvelope.weeklyVolumeConfidence, newMetrics.volumeAnalysis.confidence, adjustedLearningRate)
  const blendedDensityConfidence = blendConfidence(existingEnvelope.densityConfidence, newMetrics.densityAnalysis.confidence, adjustedLearningRate)
  const blendedFatigueConfidence = blendConfidence(existingEnvelope.fatigueThresholdConfidence, newMetrics.fatigueAnalysis.confidence, adjustedLearningRate)
  
  // Determine best rep zone (prefer new if confident enough)
  const bestRepZone = newMetrics.repZoneConfidence > existingEnvelope.repZoneConfidence 
    ? newMetrics.bestRepZone 
    : existingEnvelope.bestRepZone
  
  // Determine density preference
  const preferredDensity = newMetrics.densityAnalysis.confidence > existingEnvelope.densityConfidence * 0.8
    ? newMetrics.densityAnalysis.preferred
    : existingEnvelope.preferredDensityLevel
  
  // Determine trend (favor recent data)
  const trend = newMetrics.trendAnalysis.confidence > 0.3 
    ? newMetrics.trendAnalysis.direction 
    : existingEnvelope.performanceTrend
  
  // Update positive/negative signal dates
  const latestPositive = findLastSignalOfType(newSignals, 'positive')
  const latestNegative = findLastSignalOfType(newSignals, 'negative')
  
  return {
    ...existingEnvelope,
    
    // Updated rep preferences
    preferredRepRangeMin: blendedRepMin,
    preferredRepRangeMax: blendedRepMax,
    bestRepZone,
    repZoneConfidence: blendedRepConfidence,
    
    // Updated set preferences
    preferredSetRangeMin: blend(existingEnvelope.preferredSetRangeMin, Math.max(2, Math.round(newMetrics.volumeAnalysis.optimalMin / 3))),
    preferredSetRangeMax: blend(existingEnvelope.preferredSetRangeMax, Math.min(8, Math.round(newMetrics.volumeAnalysis.optimalMax / 3))),
    
    // Updated volume preferences
    preferredWeeklyVolumeMin: blendedVolMin,
    preferredWeeklyVolumeMax: blendedVolMax,
    toleratedWeeklyVolumeMax: blendedTolerated,
    excessiveVolumeThreshold: blendedExcessive,
    weeklyVolumeConfidence: blendedVolConfidence,
    
    // Updated density preferences
    preferredDensityLevel: preferredDensity,
    densityTolerance: newMetrics.densityAnalysis.tolerance,
    densityConfidence: blendedDensityConfidence,
    
    // Updated fatigue characteristics
    fatigueThreshold: blendedFatigue,
    fatigueThresholdConfidence: blendedFatigueConfidence,
    recoveryNeeds: newMetrics.fatigueAnalysis.recoveryNeeds,
    
    // Updated performance tracking
    performanceTrend: trend,
    trendConfidence: blendConfidence(existingEnvelope.trendConfidence, newMetrics.trendAnalysis.confidence, adjustedLearningRate),
    lastPositiveSignal: latestPositive || existingEnvelope.lastPositiveSignal,
    lastNegativeSignal: latestNegative || existingEnvelope.lastNegativeSignal,
    
    // Updated confidence
    confidenceScore: blendedOverallConfidence,
    signalCount: newSignalCount,
    recentSignalCount: newRecentCount,
    dataQualityScore: blendConfidence(existingEnvelope.dataQualityScore, newMetrics.dataQuality.avgCompleteness, adjustedLearningRate),
    
    // Updated metadata
    lastUpdated: new Date(),
    updateCount: existingEnvelope.updateCount + 1,
  }
}

/**
 * Blend confidence scores, always trending upward with more data
 */
function blendConfidence(old: number, updated: number, rate: number): number {
  // Confidence can only slowly decrease, but can quickly increase
  if (updated > old) {
    return Math.min(0.95, old + (updated - old) * rate * 1.2)
  }
  return Math.max(0.1, old - (old - updated) * rate * 0.5)
}

/**
 * Apply deload/fatigue feedback to envelope
 * Called when deload system detects issues
 */
export function applyFatigueFeedbackToEnvelope(
  envelope: PerformanceEnvelope,
  feedback: {
    wasDeloadTriggered: boolean
    fatigueLevel: 'low' | 'moderate' | 'high' | 'critical'
    volumeAtTrigger: number
    movementFamily: MovementFamily
  }
): PerformanceEnvelope {
  // Only update if this is the relevant movement family
  if (feedback.movementFamily !== envelope.movementFamily) {
    return envelope
  }
  
  // If deload was triggered, we may have found the true fatigue threshold
  if (feedback.wasDeloadTriggered && feedback.volumeAtTrigger > 0) {
    const currentThreshold = envelope.fatigueThreshold
    const observedThreshold = feedback.volumeAtTrigger
    
    // If we triggered deload BELOW our current threshold, lower it
    if (observedThreshold < currentThreshold * 0.9) {
      const newThreshold = Math.round(observedThreshold * 0.9) // Set threshold below trigger point
      const confidenceBoost = envelope.fatigueThresholdConfidence < 0.7 ? 0.15 : 0.05
      
      return {
        ...envelope,
        fatigueThreshold: newThreshold,
        toleratedWeeklyVolumeMax: Math.min(envelope.toleratedWeeklyVolumeMax, newThreshold),
        fatigueThresholdConfidence: Math.min(0.9, envelope.fatigueThresholdConfidence + confidenceBoost),
        recoveryNeeds: feedback.fatigueLevel === 'critical' || feedback.fatigueLevel === 'high' ? 'high' : 'elevated',
        lastUpdated: new Date(),
        updateCount: envelope.updateCount + 1,
      }
    }
  }
  
  // If fatigue was high but we didn't need deload, our threshold might be accurate
  if (feedback.fatigueLevel === 'moderate' && !feedback.wasDeloadTriggered) {
    return {
      ...envelope,
      fatigueThresholdConfidence: Math.min(0.9, envelope.fatigueThresholdConfidence + 0.03),
      lastUpdated: new Date(),
    }
  }
  
  return envelope
}
