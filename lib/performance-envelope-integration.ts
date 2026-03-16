/**
 * Performance Envelope Integration
 * 
 * Connects Performance Envelope Modeling to program generation,
 * adaptive progression, and workout logging.
 */

import { getAthleteEnvelopes, getOrCreateEnvelope, recordSignal, updateEnvelopeFromSignals } from './performance-envelope-service'
import { generateEnvelopeInsight, getEnvelopeBasedRecommendations, type PerformanceEnvelope, type TrainingResponseSignal } from './performance-envelope-engine'
import type { MovementFamily } from './movement-family-registry'
import type { WorkoutLog } from './workout-log-service'

/**
 * Get envelope-based rep range recommendation for program generation
 */
export async function getEnvelopeRepRange(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<{ min: number; max: number; confidence: number }> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    return {
      min: envelope.preferredRepRangeMin,
      max: envelope.preferredRepRangeMax,
      confidence: envelope.confidenceScore,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get rep range:', error)
    // Return conservative defaults
    return { min: 3, max: 6, confidence: 0 }
  }
}

/**
 * Get envelope-based volume recommendation for program generation
 */
export async function getEnvelopeVolume(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<{ weeklyMin: number; weeklyMax: number; setsPerSession: number; confidence: number }> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    return {
      weeklyMin: envelope.preferredWeeklyVolumeMin,
      weeklyMax: envelope.preferredWeeklyVolumeMax,
      setsPerSession: Math.round((envelope.preferredSetRangeMin + envelope.preferredSetRangeMax) / 2),
      confidence: envelope.confidenceScore,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get volume:', error)
    return { weeklyMin: 8, weeklyMax: 15, setsPerSession: 4, confidence: 0 }
  }
}

/**
 * Get envelope-based density recommendation for program generation
 */
export async function getEnvelopeDensity(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<{ preferredDensity: 'low_density' | 'moderate_density' | 'high_density'; confidence: number }> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    return {
      preferredDensity: envelope.preferredDensityLevel,
      confidence: envelope.confidenceScore,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get density:', error)
    return { preferredDensity: 'moderate_density', confidence: 0 }
  }
}

/**
 * Record workout performance for envelope learning
 */
export async function recordWorkoutEnvelopeSignals(
  athleteId: string,
  workoutLog: WorkoutLog,
  movementFamilyResults: Array<{
    movementFamily: MovementFamily
    goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
    repsPerformed: number
    setsPerformed: number
    performanceMetric: number
    difficultyRating: 'easy' | 'normal' | 'hard'
  }>
): Promise<void> {
  try {
    for (const result of movementFamilyResults) {
      const signal: TrainingResponseSignal = {
        athleteId,
        movementFamily: result.movementFamily,
        goalType: result.goalType,
        repsPerformed: result.repsPerformed,
        setsPerformed: result.setsPerformed,
        repRange: result.repsPerformed <= 3 ? 'low' : result.repsPerformed <= 6 ? 'moderate' : 'high',
        performanceMetric: result.performanceMetric,
        sessionDensity: workoutLog.sessionDensity as 'low_density' | 'moderate_density' | 'high_density',
        weeklyVolume: result.setsPerformed, // TODO: Calculate cumulative weekly volume
        difficultyRating: result.difficultyRating,
        completionRatio: workoutLog.completionRatio || 1,
        sessionTruncated: workoutLog.timeCompressedFlag || false,
        exercisesSkipped: workoutLog.skippedExercises?.length || 0,
        recordedAt: new Date(workoutLog.sessionDate),
      }

      await recordSignal(signal)

      // Update envelope with new signal
      await updateEnvelopeFromSignals(
        athleteId,
        result.movementFamily,
        result.goalType
      )
    }
  } catch (error) {
    console.warn('[Envelope] Could not record signals:', error)
  }
}

/**
 * Get coaching insight from envelopes
 */
export async function getEnvelopeCoachingInsights(athleteId: string): Promise<string[]> {
  try {
    const envelopes = await getAthleteEnvelopes(athleteId)
    const insights: string[] = []

    // Only include high-confidence envelopes
    const highConfidence = envelopes.filter(e => e.confidenceScore >= 0.4)

    for (const envelope of highConfidence) {
      const insight = generateEnvelopeInsight(envelope)
      if (insight) {
        insights.push(insight)
      }
    }

    return insights.slice(0, 3) // Return top 3 insights
  } catch (error) {
    console.warn('[Envelope] Could not get coaching insights:', error)
    return []
  }
}

/**
 * Detect fatigue trend from envelope analysis
 */
export async function detectFatigueTrendFromEnvelopes(athleteId: string): Promise<{
  hasFatigueConcern: boolean
  affectedFamilies: string[]
  recommendation: string
}> {
  try {
    const envelopes = await getAthleteEnvelopes(athleteId)

    const decliningEnvelopes = envelopes.filter(e => e.performanceTrend === 'declining' && e.confidenceScore >= 0.5)

    if (decliningEnvelopes.length === 0) {
      return { hasFatigueConcern: false, affectedFamilies: [], recommendation: '' }
    }

    const familiesAtRisk = decliningEnvelopes.map(e => e.movementFamily)

    return {
      hasFatigueConcern: true,
      affectedFamilies: familiesAtRisk,
      recommendation: `Performance decline detected in ${familiesAtRisk.join(', ')}. Consider reducing volume or intensity for recovery.`,
    }
  } catch (error) {
    console.warn('[Envelope] Could not detect fatigue trend:', error)
    return { hasFatigueConcern: false, affectedFamilies: [], recommendation: '' }
  }
}

/**
 * Get personalized program adjustments from envelopes
 */
export async function getEnvelopeBasedProgramAdjustments(
  athleteId: string,
  movementFamilies: MovementFamily[]
): Promise<
  Array<{
    movementFamily: MovementFamily
    repRange: string
    weeklyVolume: string
    sessionDensity: string
    fatigueWarning?: string
  }>
> {
  try {
    const adjustments = []

    for (const family of movementFamilies) {
      // Try to get envelope for strength goal first (most common)
      const envelope = await getOrCreateEnvelope(athleteId, family, 'strength')
      const recs = getEnvelopeBasedRecommendations(envelope)
      adjustments.push({
        movementFamily: family,
        repRange: recs.repRange,
        weeklyVolume: recs.weeklyVolume,
        sessionDensity: recs.sessionDensity,
        fatigueWarning: recs.fatigueWarning,
      })
    }

    return adjustments
  } catch (error) {
    console.warn('[Envelope] Could not get program adjustments:', error)
    return []
  }
}
