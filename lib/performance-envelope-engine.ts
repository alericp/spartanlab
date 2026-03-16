/**
 * Performance Envelope Engine
 * 
 * Learns each athlete's effective training response zones over time.
 * Models best-performing ranges for intensity, reps, sets, session density, 
 * weekly volume, and fatigue tolerance by movement family and goal type.
 */

import type { MovementFamily, TrainingGoalType } from './movement-family-registry'

export type DensityLevel = 'low_density' | 'moderate_density' | 'high_density'

/**
 * Response signal from a single workout or session
 */
export interface TrainingResponseSignal {
  athleteId: string
  movementFamily: MovementFamily
  goalType: TrainingGoalType
  repsPerformed: number
  setsPerformed: number
  repRange: 'low' | 'moderate' | 'high' // 1-3, 4-6, 7+
  performanceMetric: number // reps, seconds, or score
  sessionDensity: DensityLevel
  weeklyVolume: number // cumulative sets for the week in this family
  difficultyRating: 'easy' | 'normal' | 'hard'
  completionRatio: number // 0-1, did they complete the planned session
  sessionTruncated: boolean
  exercisesSkipped: number
  progressionAdjustment?: 'increased' | 'decreased' | 'maintained'
  recordedAt: Date
}

/**
 * Inferred performance envelope for an athlete
 */
export interface PerformanceEnvelope {
  athleteId: string
  movementFamily: MovementFamily
  goalType: TrainingGoalType
  preferredRepRangeMin: number
  preferredRepRangeMax: number
  preferredSetRangeMin: number
  preferredSetRangeMax: number
  preferredWeeklyVolumeMin: number
  preferredWeeklyVolumeMax: number
  preferredDensityLevel: DensityLevel
  fatigueThreshold: number // weekly stress units
  performanceTrend: 'improving' | 'stable' | 'declining'
  confidenceScore: number // 0-1
  signalCount: number
  lastUpdated: Date
}

/**
 * Learning metrics from signal analysis
 */
interface EnvelopeMetrics {
  repRanges: Map<'low' | 'moderate' | 'high', number> // performance score for each range
  volumeRanges: { min: number; max: number; optimalMin: number; optimalMax: number }
  densityPreferences: Map<DensityLevel, number> // performance score per density
  fatigueIndicators: {
    volumeThreshold: number
    hardSessionFrequency: number
    truncationRate: number
  }
}

/**
 * Analyze workout signals and infer performance envelope
 */
export function analyzePerformanceEnvelope(
  signals: TrainingResponseSignal[],
  existingEnvelope?: PerformanceEnvelope
): PerformanceEnvelope {
  if (signals.length === 0) {
    // Return conservative defaults
    return createConservativeEnvelope(existingEnvelope?.athleteId || 'unknown')
  }

  const metrics = extractMetricsFromSignals(signals)
  const trend = calculatePerformanceTrend(signals)
  const confidence = calculateConfidenceScore(signals, metrics)

  return {
    athleteId: signals[0]?.athleteId || 'unknown',
    movementFamily: signals[0]?.movementFamily || 'vertical_pull',
    goalType: signals[0]?.goalType || 'strength',
    preferredRepRangeMin: metrics.repRanges.get('low') ? 1 : metrics.repRanges.get('moderate') ? 4 : 7,
    preferredRepRangeMax: metrics.repRanges.get('low') ? 3 : metrics.repRanges.get('moderate') ? 6 : 12,
    preferredSetRangeMin: metrics.volumeRanges.optimalMin,
    preferredSetRangeMax: metrics.volumeRanges.optimalMax,
    preferredWeeklyVolumeMin: Math.floor(metrics.volumeRanges.optimalMin * 3),
    preferredWeeklyVolumeMax: Math.floor(metrics.volumeRanges.optimalMax * 3),
    preferredDensityLevel: inferPreferredDensity(metrics.densityPreferences),
    fatigueThreshold: metrics.fatigueIndicators.volumeThreshold,
    performanceTrend: trend,
    confidenceScore: confidence,
    signalCount: signals.length,
    lastUpdated: new Date(),
  }
}

/**
 * Extract metrics from training signals
 */
function extractMetricsFromSignals(signals: TrainingResponseSignal[]): EnvelopeMetrics {
  const repRangeScores = new Map<'low' | 'moderate' | 'high', number>([
    ['low', 0],
    ['moderate', 0],
    ['high', 0],
  ])

  const densityScores = new Map<DensityLevel, number>([
    ['low_density', 0],
    ['moderate_density', 0],
    ['high_density', 0],
  ])

  let volumeMin = Infinity
  let volumeMax = 0
  let volumeSum = 0
  const completionRatios: number[] = []
  const hardSessions: number[] = []
  const truncatedSessions: number[] = []

  for (const signal of signals) {
    // Rep range scoring: hard sessions with high completion = better rep range
    const repScore = signal.difficultyRating === 'easy' ? 1 : signal.difficultyRating === 'hard' ? 3 : 2
    const adjustedScore = repScore * signal.completionRatio
    repRangeScores.set(signal.repRange, (repRangeScores.get(signal.repRange) || 0) + adjustedScore)

    // Density scoring
    const densityScore = signal.completionRatio * (signal.difficultyRating === 'hard' ? 0.5 : 1)
    densityScores.set(signal.sessionDensity, (densityScores.get(signal.sessionDensity) || 0) + densityScore)

    // Volume tracking
    volumeMin = Math.min(volumeMin, signal.setsPerformed)
    volumeMax = Math.max(volumeMax, signal.setsPerformed)
    volumeSum += signal.setsPerformed
    completionRatios.push(signal.completionRatio)

    // Fatigue indicators
    if (signal.difficultyRating === 'hard') {
      hardSessions.push(signal.weeklyVolume)
    }
    if (signal.sessionTruncated) {
      truncatedSessions.push(signal.weeklyVolume)
    }
  }

  const avgVolume = volumeSum / signals.length
  const optimalMin = Math.max(1, Math.round(avgVolume * 0.75))
  const optimalMax = Math.round(avgVolume * 1.25)

  return {
    repRanges: repRangeScores,
    volumeRanges: {
      min: volumeMin === Infinity ? 3 : volumeMin,
      max: volumeMax || 5,
      optimalMin,
      optimalMax,
    },
    densityPreferences: densityScores,
    fatigueIndicators: {
      volumeThreshold: hardSessions.length > 0 ? Math.max(...hardSessions) * 1.2 : 50,
      hardSessionFrequency: hardSessions.length / signals.length,
      truncationRate: truncatedSessions.length / signals.length,
    },
  }
}

/**
 * Calculate performance trend from recent signals
 */
function calculatePerformanceTrend(signals: TrainingResponseSignal[]): 'improving' | 'stable' | 'declining' {
  if (signals.length < 3) return 'stable'

  // Look at last 3 signals
  const recent = signals.slice(-3)
  const older = signals.slice(-6, -3)

  const recentAvgCompletion = recent.reduce((sum, s) => sum + s.completionRatio, 0) / recent.length
  const olderAvgCompletion = older.length > 0 ? older.reduce((sum, s) => sum + s.completionRatio, 0) / older.length : 0.5

  if (recentAvgCompletion > olderAvgCompletion + 0.1) return 'improving'
  if (recentAvgCompletion < olderAvgCompletion - 0.1) return 'declining'
  return 'stable'
}

/**
 * Calculate confidence score based on signal quantity and stability
 */
function calculateConfidenceScore(signals: TrainingResponseSignal[], metrics: EnvelopeMetrics): number {
  let confidence = 0

  // Signal count: more signals = higher confidence (cap at 15)
  const countConfidence = Math.min(signals.length / 15, 1)
  confidence += countConfidence * 0.4

  // Trend stability: less variance = higher confidence
  const repRangeVariance = Array.from(metrics.repRanges.values()).reduce((sum, v) => sum + Math.abs(v - 100), 0)
  const stabilityConfidence = Math.max(0, 1 - repRangeVariance / 500)
  confidence += stabilityConfidence * 0.3

  // Completion consistency: higher avg completion = higher confidence
  const avgCompletion = signals.reduce((sum, s) => sum + s.completionRatio, 0) / signals.length
  confidence += avgCompletion * 0.3

  return Math.min(confidence, 1)
}

/**
 * Infer preferred density from performance scores
 */
function inferPreferredDensity(densityScores: Map<DensityLevel, number>): DensityLevel {
  const scores = Array.from(densityScores.entries())
  const best = scores.reduce((prev, current) => (current[1] > prev[1] ? current : prev))
  return best[0]
}

/**
 * Create conservative envelope for new athletes
 */
function createConservativeEnvelope(athleteId: string): PerformanceEnvelope {
  return {
    athleteId,
    movementFamily: 'vertical_pull',
    goalType: 'strength',
    preferredRepRangeMin: 3,
    preferredRepRangeMax: 6,
    preferredSetRangeMin: 3,
    preferredSetRangeMax: 5,
    preferredWeeklyVolumeMin: 8,
    preferredWeeklyVolumeMax: 15,
    preferredDensityLevel: 'moderate_density',
    fatigueThreshold: 50,
    performanceTrend: 'stable',
    confidenceScore: 0,
    signalCount: 0,
    lastUpdated: new Date(),
  }
}

/**
 * Generate coaching insight from envelope
 */
export function generateEnvelopeInsight(envelope: PerformanceEnvelope): string {
  if (envelope.confidenceScore < 0.3) {
    return `Need more training data to personalize ${envelope.movementFamily} programming.`
  }

  const insights: string[] = []

  // Rep range insight
  if (envelope.preferredRepRangeMax <= 5) {
    insights.push(`You respond best to lower-rep ${envelope.movementFamily} work (${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax} reps).`)
  } else if (envelope.preferredRepRangeMin >= 8) {
    insights.push(`Your ${envelope.movementFamily} improves best with moderate-rep ranges (${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax} reps).`)
  }

  // Volume insight
  const optimalWeekly = Math.round((envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2)
  insights.push(`Optimal weekly ${envelope.movementFamily} volume: ${optimalWeekly} sets.`)

  // Density insight
  if (envelope.preferredDensityLevel === 'low_density') {
    insights.push(`Low-density sessions with longer rest work better for your ${envelope.movementFamily} training.`)
  } else if (envelope.preferredDensityLevel === 'high_density') {
    insights.push(`You tolerate and progress well in higher-density ${envelope.movementFamily} circuits.`)
  }

  // Trend insight
  if (envelope.performanceTrend === 'improving') {
    insights.push(`Your ${envelope.movementFamily} is showing consistent improvement.`)
  } else if (envelope.performanceTrend === 'declining') {
    insights.push(`Your ${envelope.movementFamily} performance is declining; consider reducing volume or intensity.`)
  }

  return insights.join(' ')
}

/**
 * Get program recommendations based on envelope
 */
export function getEnvelopeBasedRecommendations(
  envelope: PerformanceEnvelope
): {
  repRange: string
  weeklyVolume: string
  sessionDensity: string
  fatigueWarning?: string
} {
  const reps = `${envelope.preferredRepRangeMin}–${envelope.preferredRepRangeMax}`
  const volume = `${envelope.preferredWeeklyVolumeMin}–${envelope.preferredWeeklyVolumeMax}`
  const density = envelope.preferredDensityLevel.replace(/_/g, ' ')

  let fatigueWarning: string | undefined
  if (envelope.performanceTrend === 'declining' && envelope.confidenceScore > 0.5) {
    fatigueWarning = `Recent performance decline detected; consider deload or volume reduction.`
  }

  return {
    repRange: reps,
    weeklyVolume: volume,
    sessionDensity: density,
    fatigueWarning,
  }
}

/**
 * Update envelope with new signals
 */
export function updateEnvelopeWithSignals(
  existingEnvelope: PerformanceEnvelope,
  newSignals: TrainingResponseSignal[]
): PerformanceEnvelope {
  // Combine existing confidence data with new signals
  const allSignals = reconstructSignalsFromEnvelope(existingEnvelope)
  const combined = [...allSignals, ...newSignals]

  return analyzePerformanceEnvelope(combined, existingEnvelope)
}

/**
 * Reconstruct approximate signals from historical envelope (for continuity)
 */
function reconstructSignalsFromEnvelope(envelope: PerformanceEnvelope): TrainingResponseSignal[] {
  const signals: TrainingResponseSignal[] = []
  
  // Create synthetic signals representing the envelope's history
  for (let i = 0; i < envelope.signalCount; i++) {
    signals.push({
      athleteId: envelope.athleteId,
      movementFamily: envelope.movementFamily,
      goalType: envelope.goalType,
      repsPerformed: (envelope.preferredRepRangeMin + envelope.preferredRepRangeMax) / 2,
      setsPerformed: (envelope.preferredSetRangeMin + envelope.preferredSetRangeMax) / 2,
      repRange: envelope.preferredRepRangeMin <= 3 ? 'low' : envelope.preferredRepRangeMin <= 6 ? 'moderate' : 'high',
      performanceMetric: 100,
      sessionDensity: envelope.preferredDensityLevel,
      weeklyVolume: (envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2,
      difficultyRating: envelope.performanceTrend === 'declining' ? 'hard' : 'normal',
      completionRatio: envelope.performanceTrend === 'declining' ? 0.8 : 0.95,
      sessionTruncated: false,
      exercisesSkipped: 0,
      recordedAt: new Date(Date.now() - (envelope.signalCount - i) * 86400000),
    })
  }

  return signals
}
