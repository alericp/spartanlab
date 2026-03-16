/**
 * Performance Envelope Service
 * 
 * Database operations for storing and retrieving performance envelopes
 * and training response signals.
 */

import { getDb } from './db'
import type { 
  PerformanceEnvelope, 
  TrainingResponseSignal, 
  DensityLevel,
  RepZone,
} from './performance-envelope-engine'
import { 
  analyzePerformanceEnvelope, 
  updateEnvelopeWithSignals,
  applyFatigueFeedbackToEnvelope,
  MOVEMENT_FAMILY_FATIGUE_DEFAULTS,
} from './performance-envelope-engine'
import type { MovementFamily, TrainingGoalType } from './movement-family-registry'

/**
 * Get or create performance envelope for athlete + movement family + goal type
 */
export async function getOrCreateEnvelope(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType
): Promise<PerformanceEnvelope> {
  const db = getDb()

  // Try to get existing envelope
  const existing = await db.query(
    `SELECT * FROM performance_envelopes 
     WHERE athlete_id = $1 AND movement_family = $2 AND goal_type = $3`,
    [athleteId, movementFamily, goalType]
  )

  if (existing.rows.length > 0) {
    return rowToEnvelope(existing.rows[0])
  }

  // Get recent signals to initialize
  const signals = await getRecentSignals(athleteId, movementFamily, goalType, 20)
  const envelope = analyzePerformanceEnvelope(signals)
  
  // Set athlete/family/goal on the envelope
  envelope.athleteId = athleteId
  envelope.movementFamily = movementFamily
  envelope.goalType = goalType

  // Store the new envelope
  await saveEnvelope(envelope)

  return envelope
}

/**
 * Get performance envelope for athlete
 */
export async function getEnvelope(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType
): Promise<PerformanceEnvelope | null> {
  const db = getDb()

  const result = await db.query(
    `SELECT * FROM performance_envelopes 
     WHERE athlete_id = $1 AND movement_family = $2 AND goal_type = $3`,
    [athleteId, movementFamily, goalType]
  )

  return result.rows.length > 0 ? rowToEnvelope(result.rows[0]) : null
}

/**
 * Get all envelopes for an athlete
 */
export async function getAthleteEnvelopes(athleteId: string): Promise<PerformanceEnvelope[]> {
  const db = getDb()

  const result = await db.query(
    `SELECT * FROM performance_envelopes 
     WHERE athlete_id = $1
     ORDER BY movement_family, goal_type`,
    [athleteId]
  )

  return result.rows.map(rowToEnvelope)
}

/**
 * Record a training response signal
 * Enhanced to capture all the new signal fields
 */
export async function recordSignal(signal: TrainingResponseSignal): Promise<void> {
  const db = getDb()

  await db.query(
    `INSERT INTO training_response_signals 
     (athlete_id, movement_family, goal_type, reps_performed, sets_performed, 
      rep_range, rep_zone, performance_metric, performance_vs_previous,
      session_density, rest_seconds_used, session_duration_minutes,
      weekly_volume_prior, weekly_volume_after, weekly_session_count,
      difficulty_rating, completion_ratio, quality_rating, session_truncated, 
      exercises_skipped, exercises_substituted, progression_adjustment, 
      was_deload_session, data_quality, recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
    [
      signal.athleteId,
      signal.movementFamily,
      signal.goalType,
      signal.repsPerformed,
      signal.setsPerformed,
      signal.repRange,
      signal.repZone,
      signal.performanceMetric,
      signal.performanceVsPrevious,
      signal.sessionDensity,
      signal.restSecondsUsed,
      signal.sessionDurationMinutes,
      signal.weeklyVolumePrior,
      signal.weeklyVolumeAfter,
      signal.weeklySessionCount,
      signal.difficultyRating,
      signal.completionRatio,
      signal.qualityRating,
      signal.sessionTruncated,
      signal.exercisesSkipped,
      signal.exercisesSubstituted,
      signal.progressionAdjustment,
      signal.wasDeloadSession,
      signal.dataQuality,
      signal.recordedAt.toISOString(),
    ]
  )
}

/**
 * Get recent signals for an athlete and movement family
 */
export async function getRecentSignals(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType,
  limit: number = 20
): Promise<TrainingResponseSignal[]> {
  const db = getDb()

  const result = await db.query(
    `SELECT * FROM training_response_signals 
     WHERE athlete_id = $1 AND movement_family = $2 AND goal_type = $3
     ORDER BY recorded_at DESC
     LIMIT $4`,
    [athleteId, movementFamily, goalType, limit]
  )

  return result.rows.map(rowToSignal)
}

/**
 * Update envelope after processing new signals
 * Uses incremental learning to blend new data with existing envelope
 */
export async function updateEnvelopeFromSignals(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType
): Promise<PerformanceEnvelope> {
  // Get existing envelope
  const existing = await getEnvelope(athleteId, movementFamily, goalType)

  // Get recent signals (use more for better pattern detection)
  const signals = await getRecentSignals(athleteId, movementFamily, goalType, 30)

  // Update envelope using incremental learning
  let updated: PerformanceEnvelope
  if (existing) {
    // Use most recent signals for incremental update
    const recentSignals = signals.slice(0, 10)
    updated = updateEnvelopeWithSignals(existing, recentSignals)
  } else {
    // Create new envelope from all available signals
    updated = analyzePerformanceEnvelope(signals)
  }
  
  // Ensure athlete/family/goal are set
  updated.athleteId = athleteId
  updated.movementFamily = movementFamily
  updated.goalType = goalType

  // Save updated envelope
  await saveEnvelope(updated)

  // Store snapshot for history (only if meaningful change)
  if (!existing || updated.updateCount % 5 === 0 || Math.abs(updated.confidenceScore - (existing?.confidenceScore || 0)) > 0.1) {
    await saveEnvelopeSnapshot(updated)
  }

  return updated
}

/**
 * Apply fatigue/deload feedback to envelope
 */
export async function applyFatigueFeedback(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType,
  feedback: {
    wasDeloadTriggered: boolean
    fatigueLevel: 'low' | 'moderate' | 'high' | 'critical'
    volumeAtTrigger: number
  }
): Promise<PerformanceEnvelope | null> {
  const existing = await getEnvelope(athleteId, movementFamily, goalType)
  if (!existing) return null
  
  const updated = applyFatigueFeedbackToEnvelope(existing, {
    ...feedback,
    movementFamily,
  })
  
  if (updated !== existing) {
    await saveEnvelope(updated)
    await saveEnvelopeSnapshot(updated, 'deload_feedback')
  }
  
  return updated
}

/**
 * Save envelope to database
 * Handles both legacy and new enhanced fields
 */
async function saveEnvelope(envelope: PerformanceEnvelope): Promise<void> {
  const db = getDb()

  const existing = await getEnvelope(envelope.athleteId, envelope.movementFamily, envelope.goalType)

  if (existing) {
    // Update with all enhanced fields
    await db.query(
      `UPDATE performance_envelopes 
       SET preferred_rep_range_min = $1,
           preferred_rep_range_max = $2,
           preferred_set_range_min = $3,
           preferred_set_range_max = $4,
           preferred_weekly_volume_min = $5,
           preferred_weekly_volume_max = $6,
           preferred_density_level = $7,
           fatigue_threshold = $8,
           performance_trend = $9,
           confidence_score = $10,
           signal_count = $11,
           last_updated = $12,
           best_rep_zone = $13,
           rep_zone_confidence = $14,
           tolerated_weekly_volume_max = $15,
           excessive_volume_threshold = $16,
           weekly_volume_confidence = $17,
           density_tolerance = $18,
           density_confidence = $19,
           fatigue_threshold_confidence = $20,
           recovery_needs = $21,
           trend_confidence = $22,
           recent_signal_count = $23,
           data_quality_score = $24,
           update_count = $25
       WHERE athlete_id = $26 AND movement_family = $27 AND goal_type = $28`,
      [
        envelope.preferredRepRangeMin,
        envelope.preferredRepRangeMax,
        envelope.preferredSetRangeMin,
        envelope.preferredSetRangeMax,
        envelope.preferredWeeklyVolumeMin,
        envelope.preferredWeeklyVolumeMax,
        envelope.preferredDensityLevel,
        envelope.fatigueThreshold,
        envelope.performanceTrend,
        envelope.confidenceScore,
        envelope.signalCount,
        envelope.lastUpdated.toISOString(),
        envelope.bestRepZone,
        envelope.repZoneConfidence,
        envelope.toleratedWeeklyVolumeMax,
        envelope.excessiveVolumeThreshold,
        envelope.weeklyVolumeConfidence,
        envelope.densityTolerance,
        envelope.densityConfidence,
        envelope.fatigueThresholdConfidence,
        envelope.recoveryNeeds,
        envelope.trendConfidence,
        envelope.recentSignalCount,
        envelope.dataQualityScore,
        envelope.updateCount,
        envelope.athleteId,
        envelope.movementFamily,
        envelope.goalType,
      ]
    )
  } else {
    // Insert with all enhanced fields
    await db.query(
      `INSERT INTO performance_envelopes 
       (athlete_id, movement_family, goal_type, preferred_rep_range_min,
        preferred_rep_range_max, preferred_set_range_min, preferred_set_range_max,
        preferred_weekly_volume_min, preferred_weekly_volume_max, preferred_density_level,
        fatigue_threshold, performance_trend, confidence_score, signal_count, last_updated,
        best_rep_zone, rep_zone_confidence, tolerated_weekly_volume_max, 
        excessive_volume_threshold, weekly_volume_confidence, density_tolerance,
        density_confidence, fatigue_threshold_confidence, recovery_needs,
        trend_confidence, recent_signal_count, data_quality_score, update_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
               $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
      [
        envelope.athleteId,
        envelope.movementFamily,
        envelope.goalType,
        envelope.preferredRepRangeMin,
        envelope.preferredRepRangeMax,
        envelope.preferredSetRangeMin,
        envelope.preferredSetRangeMax,
        envelope.preferredWeeklyVolumeMin,
        envelope.preferredWeeklyVolumeMax,
        envelope.preferredDensityLevel,
        envelope.fatigueThreshold,
        envelope.performanceTrend,
        envelope.confidenceScore,
        envelope.signalCount,
        envelope.lastUpdated.toISOString(),
        envelope.bestRepZone,
        envelope.repZoneConfidence,
        envelope.toleratedWeeklyVolumeMax,
        envelope.excessiveVolumeThreshold,
        envelope.weeklyVolumeConfidence,
        envelope.densityTolerance,
        envelope.densityConfidence,
        envelope.fatigueThresholdConfidence,
        envelope.recoveryNeeds,
        envelope.trendConfidence,
        envelope.recentSignalCount,
        envelope.dataQualityScore,
        envelope.updateCount,
        envelope.createdAt?.toISOString() || new Date().toISOString(),
      ]
    )
  }
}

/**
 * Save envelope snapshot for history tracking
 * Includes trigger event for context
 */
async function saveEnvelopeSnapshot(
  envelope: PerformanceEnvelope,
  triggerEvent: string = 'regular_update'
): Promise<void> {
  const db = getDb()

  await db.query(
    `INSERT INTO performance_envelope_snapshots 
     (athlete_id, movement_family, goal_type, rep_range, weekly_volume_range,
      density_level, fatigue_threshold, confidence_score, trigger_event,
      recovery_needs, density_tolerance, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      envelope.athleteId,
      envelope.movementFamily,
      envelope.goalType,
      `${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax}`,
      `${envelope.preferredWeeklyVolumeMin}-${envelope.preferredWeeklyVolumeMax}`,
      envelope.preferredDensityLevel,
      envelope.fatigueThreshold,
      envelope.confidenceScore,
      triggerEvent,
      envelope.recoveryNeeds,
      envelope.densityTolerance,
      new Date().toISOString(),
    ]
  )
}

/**
 * Get envelope history snapshots
 */
export async function getEnvelopeHistory(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: TrainingGoalType,
  limit: number = 12
): Promise<
  Array<{
    created_at: string
    rep_range: string
    weekly_volume_range: string
    density_level: DensityLevel
    confidence_score: number
    trigger_event?: string
    recovery_needs?: string
  }>
> {
  const db = getDb()

  const result = await db.query(
    `SELECT created_at, rep_range, weekly_volume_range, density_level, 
            confidence_score, trigger_event, recovery_needs
     FROM performance_envelope_snapshots
     WHERE athlete_id = $1 AND movement_family = $2 AND goal_type = $3
     ORDER BY created_at DESC
     LIMIT $4`,
    [athleteId, movementFamily, goalType, limit]
  )

  return result.rows
}

/**
 * Convert database row to PerformanceEnvelope
 * Handles both legacy and new enhanced fields with defaults for missing values
 */
function rowToEnvelope(row: any): PerformanceEnvelope {
  // Get movement family defaults for fallbacks
  const familyDefaults = MOVEMENT_FAMILY_FATIGUE_DEFAULTS[row.movement_family as MovementFamily] || 
                         MOVEMENT_FAMILY_FATIGUE_DEFAULTS.vertical_pull
  
  return {
    athleteId: row.athlete_id,
    movementFamily: row.movement_family,
    goalType: row.goal_type,
    
    // Rep preferences
    preferredRepRangeMin: row.preferred_rep_range_min,
    preferredRepRangeMax: row.preferred_rep_range_max,
    bestRepZone: row.best_rep_zone || 'strength_mid',
    repZoneConfidence: row.rep_zone_confidence ?? 0,
    
    // Set preferences
    preferredSetRangeMin: row.preferred_set_range_min,
    preferredSetRangeMax: row.preferred_set_range_max,
    
    // Weekly volume preferences
    preferredWeeklyVolumeMin: row.preferred_weekly_volume_min,
    preferredWeeklyVolumeMax: row.preferred_weekly_volume_max,
    toleratedWeeklyVolumeMax: row.tolerated_weekly_volume_max ?? Math.round(row.preferred_weekly_volume_max * 1.3),
    excessiveVolumeThreshold: row.excessive_volume_threshold ?? Math.round(row.preferred_weekly_volume_max * 1.5),
    weeklyVolumeConfidence: row.weekly_volume_confidence ?? 0,
    
    // Density preferences
    preferredDensityLevel: row.preferred_density_level,
    densityTolerance: row.density_tolerance || 'moderate',
    densityConfidence: row.density_confidence ?? 0,
    
    // Fatigue threshold
    fatigueThreshold: row.fatigue_threshold,
    fatigueThresholdConfidence: row.fatigue_threshold_confidence ?? 0,
    recoveryNeeds: row.recovery_needs || (familyDefaults.recoveryMultiplier > 1.2 ? 'elevated' : 'standard'),
    
    // Performance tracking
    performanceTrend: row.performance_trend,
    trendConfidence: row.trend_confidence ?? 0,
    lastPositiveSignal: row.last_positive_signal ? new Date(row.last_positive_signal) : null,
    lastNegativeSignal: row.last_negative_signal ? new Date(row.last_negative_signal) : null,
    
    // Overall confidence
    confidenceScore: row.confidence_score,
    signalCount: row.signal_count,
    recentSignalCount: row.recent_signal_count ?? 0,
    dataQualityScore: row.data_quality_score ?? 0,
    
    // Metadata
    lastUpdated: new Date(row.last_updated),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(row.last_updated),
    updateCount: row.update_count ?? 0,
  }
}

/**
 * Convert database row to TrainingResponseSignal
 * Handles both legacy and new enhanced fields
 */
function rowToSignal(row: any): TrainingResponseSignal {
  return {
    athleteId: row.athlete_id,
    movementFamily: row.movement_family,
    goalType: row.goal_type,
    
    // Performance data
    repsPerformed: row.reps_performed,
    setsPerformed: row.sets_performed,
    repRange: row.rep_range,
    repZone: row.rep_zone || classifyRepZoneFromReps(row.reps_performed),
    performanceMetric: row.performance_metric,
    performanceVsPrevious: row.performance_vs_previous || 'unknown',
    
    // Session context
    sessionDensity: row.session_density,
    restSecondsUsed: row.rest_seconds_used ?? 120,
    sessionDurationMinutes: row.session_duration_minutes ?? 0,
    
    // Weekly volume context
    weeklyVolumePrior: row.weekly_volume_prior ?? row.weekly_volume ?? 0,
    weeklyVolumeAfter: row.weekly_volume_after ?? (row.weekly_volume ?? 0) + row.sets_performed,
    weeklySessionCount: row.weekly_session_count ?? 1,
    
    // Response indicators
    difficultyRating: row.difficulty_rating,
    completionRatio: row.completion_ratio,
    qualityRating: row.quality_rating || 'moderate',
    sessionTruncated: row.session_truncated,
    exercisesSkipped: row.exercises_skipped,
    exercisesSubstituted: row.exercises_substituted ?? 0,
    
    // Progression tracking
    progressionAdjustment: row.progression_adjustment || 'none',
    wasDeloadSession: row.was_deload_session ?? false,
    
    // Metadata
    recordedAt: new Date(row.recorded_at),
    dataQuality: row.data_quality || 'partial',
  }
}

/**
 * Helper to classify rep zone from reps (for legacy signals)
 */
function classifyRepZoneFromReps(reps: number): RepZone {
  if (reps <= 3) return 'strength_low'
  if (reps <= 6) return 'strength_mid'
  if (reps <= 10) return 'hypertrophy'
  if (reps <= 15) return 'endurance'
  return 'high_rep'
}

// Re-export types for convenience
export type { PerformanceEnvelope, TrainingResponseSignal } from './performance-envelope-engine'
export { MOVEMENT_FAMILY_FATIGUE_DEFAULTS } from './performance-envelope-engine'
