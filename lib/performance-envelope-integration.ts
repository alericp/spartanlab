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
 * Now properly tracks weekly volume by movement family
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
    weeklyVolumePrior?: number // Sets completed in this family this week BEFORE session
    performanceVsPrevious?: 'improved' | 'maintained' | 'declined' | 'unknown'
    qualityRating?: 'poor' | 'moderate' | 'good' | 'excellent'
    restSecondsUsed?: number
  }>
): Promise<void> {
  try {
    for (const result of movementFamilyResults) {
      // Calculate rep zone from reps
      const repZone = result.repsPerformed <= 3 ? 'strength_low' as const :
                     result.repsPerformed <= 6 ? 'strength_mid' as const :
                     result.repsPerformed <= 10 ? 'hypertrophy' as const :
                     result.repsPerformed <= 15 ? 'endurance' as const : 'high_rep' as const
      
      // Calculate weekly volume context
      const weeklyVolumePrior = result.weeklyVolumePrior || 0
      const weeklyVolumeAfter = weeklyVolumePrior + result.setsPerformed
      
      const signal: TrainingResponseSignal = {
        athleteId,
        movementFamily: result.movementFamily,
        goalType: result.goalType,
        
        // Performance data
        repsPerformed: result.repsPerformed,
        setsPerformed: result.setsPerformed,
        repRange: result.repsPerformed <= 3 ? 'low' : result.repsPerformed <= 6 ? 'moderate' : 'high',
        repZone,
        performanceMetric: result.performanceMetric,
        performanceVsPrevious: result.performanceVsPrevious || 'unknown',
        
        // Session context
        sessionDensity: (workoutLog.sessionDensity as 'low_density' | 'moderate_density' | 'high_density') || 'moderate_density',
        restSecondsUsed: result.restSecondsUsed || 120,
        sessionDurationMinutes: workoutLog.sessionDurationMinutes || 0,
        
        // Weekly volume context (movement-family specific)
        weeklyVolumePrior,
        weeklyVolumeAfter,
        weeklySessionCount: 1, // Will be properly calculated by the signal processor
        
        // Response indicators
        difficultyRating: result.difficultyRating,
        completionRatio: workoutLog.completionRatio || 1,
        qualityRating: result.qualityRating || 'moderate',
        sessionTruncated: workoutLog.timeCompressedFlag || false,
        exercisesSkipped: workoutLog.skippedExercises?.length || 0,
        exercisesSubstituted: workoutLog.substitutedExercises?.length || 0,
        
        // Progression tracking
        progressionAdjustment: 'none',
        wasDeloadSession: workoutLog.wasDeloadSession || false,
        
        // Metadata
        recordedAt: new Date(workoutLog.sessionDate),
        dataQuality: workoutLog.logQuality === 'complete' ? 'complete' : 
                     workoutLog.logQuality === 'partial' ? 'partial' : 'partial',
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

/**
 * Calculate weekly volume for a movement family from recent logs
 * Used to provide accurate weeklyVolumePrior when recording signals
 */
export function calculateWeeklyVolumeFromLogs(
  logs: WorkoutLog[],
  movementFamily: MovementFamily,
  beforeDate: Date
): number {
  const oneWeekAgo = new Date(beforeDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Map exercise categories to movement families
  const categoryToFamily: Record<string, MovementFamily[]> = {
    'pull': ['vertical_pull', 'horizontal_pull'],
    'push': ['vertical_push', 'horizontal_push'],
    'core': ['compression_core', 'anti_extension_core'],
    'skill': ['straight_arm_pull', 'straight_arm_push'],
    'legs': ['squat', 'hip_hinge'],
    'mobility': ['mobility'],
  }
  
  let totalSets = 0
  
  for (const log of logs) {
    const logDate = new Date(log.sessionDate)
    // Only count logs from the past week, before the current session
    if (logDate >= oneWeekAgo && logDate < beforeDate) {
      for (const exercise of log.exercises) {
        if (exercise.completed) {
          // Check if this exercise's category maps to the target movement family
          const families = categoryToFamily[exercise.category] || []
          if (families.includes(movementFamily)) {
            totalSets += exercise.sets
          }
        }
      }
    }
  }
  
  return totalSets
}

/**
 * Extract movement family results from a workout log
 * Used to automatically generate envelope signals from completed workouts
 */
export function extractMovementFamilyResultsFromLog(
  log: WorkoutLog,
  previousLogs: WorkoutLog[]
): Array<{
  movementFamily: MovementFamily
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
  repsPerformed: number
  setsPerformed: number
  performanceMetric: number
  difficultyRating: 'easy' | 'normal' | 'hard'
  weeklyVolumePrior: number
  performanceVsPrevious: 'improved' | 'maintained' | 'declined' | 'unknown'
  qualityRating: 'poor' | 'moderate' | 'good' | 'excellent'
}> {
  const results: Array<{
    movementFamily: MovementFamily
    goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
    repsPerformed: number
    setsPerformed: number
    performanceMetric: number
    difficultyRating: 'easy' | 'normal' | 'hard'
    weeklyVolumePrior: number
    performanceVsPrevious: 'improved' | 'maintained' | 'declined' | 'unknown'
    qualityRating: 'poor' | 'moderate' | 'good' | 'excellent'
  }> = []
  
  // Group exercises by movement family
  const familyGroups = new Map<MovementFamily, {
    totalSets: number
    totalReps: number
    exerciseCount: number
    completedCount: number
  }>()
  
  // Map exercise categories to movement families
  const categoryToFamily: Record<string, MovementFamily> = {
    'pull': 'vertical_pull',
    'push': 'vertical_push',
    'core': 'compression_core',
    'skill': 'straight_arm_pull', // Will be refined based on focus area
    'legs': 'squat',
    'mobility': 'mobility',
  }
  
  // Refine skill category based on focus area
  const focusToFamily: Record<string, MovementFamily> = {
    'planche': 'straight_arm_push',
    'front_lever': 'straight_arm_pull',
    'muscle_up': 'vertical_pull',
    'handstand_pushup': 'vertical_push',
    'weighted_strength': 'vertical_pull',
    'general': 'vertical_pull',
  }
  
  const logDate = new Date(log.sessionDate)
  
  for (const exercise of log.exercises) {
    if (!exercise.completed) continue
    
    // Determine movement family
    let family = categoryToFamily[exercise.category] || 'vertical_pull'
    if (exercise.category === 'skill') {
      family = focusToFamily[log.focusArea] || 'straight_arm_pull'
    }
    
    // Aggregate by family
    const existing = familyGroups.get(family) || {
      totalSets: 0,
      totalReps: 0,
      exerciseCount: 0,
      completedCount: 0,
    }
    
    existing.totalSets += exercise.sets
    existing.totalReps += (exercise.reps || 0) * exercise.sets
    existing.exerciseCount++
    existing.completedCount++
    
    familyGroups.set(family, existing)
  }
  
  // Convert to results
  for (const [family, data] of familyGroups) {
    // Calculate weekly volume prior to this session
    const weeklyVolumePrior = calculateWeeklyVolumeFromLogs(previousLogs, family, logDate)
    
    // Determine goal type from session type
    const goalType = log.sessionType === 'skill' ? 'skill' as const :
                     log.sessionType === 'strength' ? 'strength' as const :
                     'strength' as const
    
    // Calculate quality based on completion
    const completionRatio = data.completedCount / data.exerciseCount
    const qualityRating = completionRatio >= 0.95 ? 'excellent' as const :
                         completionRatio >= 0.8 ? 'good' as const :
                         completionRatio >= 0.6 ? 'moderate' as const : 'poor' as const
    
    // Average reps per set
    const avgReps = data.totalSets > 0 ? Math.round(data.totalReps / data.totalSets) : 5
    
    results.push({
      movementFamily: family,
      goalType,
      repsPerformed: avgReps,
      setsPerformed: data.totalSets,
      performanceMetric: data.totalReps,
      difficultyRating: log.perceivedDifficulty || 'normal',
      weeklyVolumePrior,
      performanceVsPrevious: 'unknown', // Would need historical comparison
      qualityRating,
    })
  }
  
  return results
}
