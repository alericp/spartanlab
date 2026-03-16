/**
 * Performance Envelope Service
 * 
 * Database operations for storing and retrieving performance envelopes
 * and training response signals.
 */

import { getDb } from './db'
import type { PerformanceEnvelope, TrainingResponseSignal, DensityLevel } from './performance-envelope-engine'
import { analyzePerformanceEnvelope, updateEnvelopeWithSignals } from './performance-envelope-engine'
import type { MovementFamily } from './movement-family-registry'

/**
 * Get or create performance envelope for athlete + movement family + goal type
 */
export async function getOrCreateEnvelope(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
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
  const signals = await getRecentSignals(athleteId, movementFamily, goalType, 10)
  const envelope = analyzePerformanceEnvelope(signals)

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
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
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
 */
export async function recordSignal(signal: TrainingResponseSignal): Promise<void> {
  const db = getDb()

  await db.query(
    `INSERT INTO training_response_signals 
     (athlete_id, movement_family, goal_type, reps_performed, sets_performed, 
      rep_range, performance_metric, session_density, weekly_volume, 
      difficulty_rating, completion_ratio, session_truncated, exercises_skipped,
      progression_adjustment, recorded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      signal.athleteId,
      signal.movementFamily,
      signal.goalType,
      signal.repsPerformed,
      signal.setsPerformed,
      signal.repRange,
      signal.performanceMetric,
      signal.sessionDensity,
      signal.weeklyVolume,
      signal.difficultyRating,
      signal.completionRatio,
      signal.sessionTruncated,
      signal.exercisesSkipped,
      signal.progressionAdjustment || null,
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
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power',
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
 */
export async function updateEnvelopeFromSignals(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<PerformanceEnvelope> {
  const db = getDb()

  // Get existing envelope
  const existing = await getEnvelope(athleteId, movementFamily, goalType)

  // Get recent signals
  const signals = await getRecentSignals(athleteId, movementFamily, goalType, 30)

  // Update envelope
  const updated = existing
    ? updateEnvelopeWithSignals(existing, signals.slice(0, 10)) // Only use most recent 10 for update
    : analyzePerformanceEnvelope(signals)

  // Save updated envelope
  await saveEnvelope(updated)

  // Store snapshot for history
  await saveEnvelopeSnapshot(updated)

  return updated
}

/**
 * Save envelope to database
 */
async function saveEnvelope(envelope: PerformanceEnvelope): Promise<void> {
  const db = getDb()

  const existing = await getEnvelope(envelope.athleteId, envelope.movementFamily, envelope.goalType)

  if (existing) {
    // Update
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
           last_updated = $12
       WHERE athlete_id = $13 AND movement_family = $14 AND goal_type = $15`,
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
        envelope.athleteId,
        envelope.movementFamily,
        envelope.goalType,
      ]
    )
  } else {
    // Insert
    await db.query(
      `INSERT INTO performance_envelopes 
       (athlete_id, movement_family, goal_type, preferred_rep_range_min,
        preferred_rep_range_max, preferred_set_range_min, preferred_set_range_max,
        preferred_weekly_volume_min, preferred_weekly_volume_max, preferred_density_level,
        fatigue_threshold, performance_trend, confidence_score, signal_count, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
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
      ]
    )
  }
}

/**
 * Save envelope snapshot for history tracking
 */
async function saveEnvelopeSnapshot(envelope: PerformanceEnvelope): Promise<void> {
  const db = getDb()

  await db.query(
    `INSERT INTO performance_envelope_snapshots 
     (athlete_id, movement_family, goal_type, rep_range, weekly_volume_range,
      density_level, fatigue_threshold, confidence_score, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      envelope.athleteId,
      envelope.movementFamily,
      envelope.goalType,
      `${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax}`,
      `${envelope.preferredWeeklyVolumeMin}-${envelope.preferredWeeklyVolumeMax}`,
      envelope.preferredDensityLevel,
      envelope.fatigueThreshold,
      envelope.confidenceScore,
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
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power',
  limit: number = 12
): Promise<
  Array<{
    created_at: string
    rep_range: string
    weekly_volume_range: string
    density_level: DensityLevel
    confidence_score: number
  }>
> {
  const db = getDb()

  const result = await db.query(
    `SELECT created_at, rep_range, weekly_volume_range, density_level, confidence_score
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
 */
function rowToEnvelope(row: any): PerformanceEnvelope {
  return {
    athleteId: row.athlete_id,
    movementFamily: row.movement_family,
    goalType: row.goal_type,
    preferredRepRangeMin: row.preferred_rep_range_min,
    preferredRepRangeMax: row.preferred_rep_range_max,
    preferredSetRangeMin: row.preferred_set_range_min,
    preferredSetRangeMax: row.preferred_set_range_max,
    preferredWeeklyVolumeMin: row.preferred_weekly_volume_min,
    preferredWeeklyVolumeMax: row.preferred_weekly_volume_max,
    preferredDensityLevel: row.preferred_density_level,
    fatigueThreshold: row.fatigue_threshold,
    performanceTrend: row.performance_trend,
    confidenceScore: row.confidence_score,
    signalCount: row.signal_count,
    lastUpdated: new Date(row.last_updated),
  }
}

/**
 * Convert database row to TrainingResponseSignal
 */
function rowToSignal(row: any): TrainingResponseSignal {
  return {
    athleteId: row.athlete_id,
    movementFamily: row.movement_family,
    goalType: row.goal_type,
    repsPerformed: row.reps_performed,
    setsPerformed: row.sets_performed,
    repRange: row.rep_range,
    performanceMetric: row.performance_metric,
    sessionDensity: row.session_density,
    weeklyVolume: row.weekly_volume,
    difficultyRating: row.difficulty_rating,
    completionRatio: row.completion_ratio,
    sessionTruncated: row.session_truncated,
    exercisesSkipped: row.exercises_skipped,
    progressionAdjustment: row.progression_adjustment,
    recordedAt: new Date(row.recorded_at),
  }
}

// Re-export types for convenience
export type { PerformanceEnvelope, TrainingResponseSignal } from './performance-envelope-engine'
