'use server'

import { getSqlClient, isDatabaseAvailable } from './db'
import type {
  ProgramHistory,
  WorkoutSessionHistory,
  PersonalRecordHistory,
  CreateProgramHistoryInput,
  CreateWorkoutSessionInput,
  CreatePersonalRecordInput,
  HistoryQueryOptions,
  PRQueryOptions,
  ProgramStatus,
} from '@/types/history'

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

interface ProgramHistoryRow {
  id: string
  user_id: string
  source_program_id: string | null
  version_number: number
  program_name: string
  status: string
  generation_reason: string
  reason_summary: string | null
  goals_snapshot: Record<string, unknown>
  athlete_inputs_snapshot: Record<string, unknown>
  program_structure_snapshot: Record<string, unknown>
  primary_goal: string | null
  training_days_per_week: number | null
  session_length_minutes: number | null
  block_summary: string | null
  user_notes: string | null
  total_sessions_completed: number
  total_prs_achieved: number
  created_at: string
  archived_at: string | null
  completed_at: string | null
}

interface WorkoutSessionRow {
  id: string
  user_id: string
  program_history_id: string | null
  active_program_id: string | null
  workout_date: string
  workout_name: string
  day_label: string | null
  session_number: number | null
  session_status: string
  summary_message: string | null
  session_metrics_snapshot: Record<string, unknown>
  exercise_results_snapshot: unknown[]
  prs_hit_snapshot: unknown[]
  duration_minutes: number | null
  total_volume: number | null
  exercises_completed: number | null
  exercises_skipped: number | null
  fatigue_rating: number | null
  difficulty_rating: number | null
  created_at: string
  updated_at: string
}

interface PersonalRecordRow {
  id: string
  user_id: string
  exercise_key: string
  exercise_name: string
  exercise_category: string | null
  pr_type: string
  value_primary: number
  value_secondary: number | null
  unit: string | null
  achieved_at: string
  workout_session_id: string | null
  program_history_id: string | null
  bodyweight_at_time: number | null
  notes: string | null
  created_at: string
}

// =============================================================================
// TYPE TRANSFORMERS
// =============================================================================

function toProgramHistory(row: ProgramHistoryRow): ProgramHistory {
  return {
    id: row.id,
    userId: row.user_id,
    sourceProgramId: row.source_program_id ?? undefined,
    versionNumber: row.version_number,
    programName: row.program_name,
    status: row.status as ProgramStatus,
    generationReason: row.generation_reason,
    reasonSummary: row.reason_summary ?? undefined,
    goalsSnapshot: row.goals_snapshot as ProgramHistory['goalsSnapshot'],
    athleteInputsSnapshot: row.athlete_inputs_snapshot as ProgramHistory['athleteInputsSnapshot'],
    programStructureSnapshot: row.program_structure_snapshot as ProgramHistory['programStructureSnapshot'],
    primaryGoal: row.primary_goal ?? undefined,
    trainingDaysPerWeek: row.training_days_per_week ?? undefined,
    sessionLengthMinutes: row.session_length_minutes ?? undefined,
    blockSummary: row.block_summary ?? undefined,
    userNotes: row.user_notes ?? undefined,
    totalSessionsCompleted: row.total_sessions_completed,
    totalPRsAchieved: row.total_prs_achieved,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  }
}

function toWorkoutSession(row: WorkoutSessionRow): WorkoutSessionHistory {
  return {
    id: row.id,
    userId: row.user_id,
    programHistoryId: row.program_history_id ?? undefined,
    activeProgramId: row.active_program_id ?? undefined,
    workoutDate: row.workout_date,
    workoutName: row.workout_name,
    dayLabel: row.day_label ?? undefined,
    sessionNumber: row.session_number ?? undefined,
    sessionStatus: row.session_status as WorkoutSessionHistory['sessionStatus'],
    summaryMessage: row.summary_message ?? undefined,
    sessionMetricsSnapshot: row.session_metrics_snapshot as WorkoutSessionHistory['sessionMetricsSnapshot'],
    exerciseResultsSnapshot: row.exercise_results_snapshot as WorkoutSessionHistory['exerciseResultsSnapshot'],
    prsHitSnapshot: row.prs_hit_snapshot as WorkoutSessionHistory['prsHitSnapshot'],
    durationMinutes: row.duration_minutes ?? undefined,
    totalVolume: row.total_volume ?? undefined,
    exercisesCompleted: row.exercises_completed ?? undefined,
    exercisesSkipped: row.exercises_skipped ?? undefined,
    fatigueRating: row.fatigue_rating ?? undefined,
    difficultyRating: row.difficulty_rating ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toPersonalRecord(row: PersonalRecordRow): PersonalRecordHistory {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseKey: row.exercise_key,
    exerciseName: row.exercise_name,
    exerciseCategory: row.exercise_category as PersonalRecordHistory['exerciseCategory'],
    prType: row.pr_type as PersonalRecordHistory['prType'],
    valuePrimary: row.value_primary,
    valueSecondary: row.value_secondary ?? undefined,
    unit: row.unit ?? undefined,
    achievedAt: row.achieved_at,
    workoutSessionId: row.workout_session_id ?? undefined,
    programHistoryId: row.program_history_id ?? undefined,
    bodyweightAtTime: row.bodyweight_at_time ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }
}

// =============================================================================
// PROGRAM HISTORY HELPERS
// =============================================================================

/**
 * Create a new program history entry
 */
export async function createProgramHistoryEntry(
  input: CreateProgramHistoryInput
): Promise<ProgramHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO program_history (
        user_id,
        source_program_id,
        version_number,
        program_name,
        status,
        generation_reason,
        reason_summary,
        goals_snapshot,
        athlete_inputs_snapshot,
        program_structure_snapshot,
        primary_goal,
        training_days_per_week,
        session_length_minutes,
        block_summary,
        user_notes
      ) VALUES (
        ${input.userId},
        ${input.sourceProgramId ?? null},
        ${input.versionNumber ?? 1},
        ${input.programName},
        'active',
        ${input.generationReason},
        ${input.reasonSummary ?? null},
        ${JSON.stringify(input.goalsSnapshot)},
        ${JSON.stringify(input.athleteInputsSnapshot)},
        ${JSON.stringify(input.programStructureSnapshot)},
        ${input.primaryGoal ?? null},
        ${input.trainingDaysPerWeek ?? null},
        ${input.sessionLengthMinutes ?? null},
        ${input.blockSummary ?? null},
        ${input.userNotes ?? null}
      )
      RETURNING *
    `

    return result[0] ? toProgramHistory(result[0] as ProgramHistoryRow) : null
  } catch (error) {
    console.error('[HistoryService] Error creating program history:', error)
    return null
  }
}

/**
 * Archive current active program and optionally create a new one
 */
export async function archiveCurrentProgram(
  userId: string,
  archiveReason?: string
): Promise<boolean> {
  if (!(await isDatabaseAvailable())) return false

  const sql = await getSqlClient()
  if (!sql) return false

  try {
    await sql`
      UPDATE program_history
      SET 
        status = 'archived',
        archived_at = NOW(),
        reason_summary = COALESCE(reason_summary, ${archiveReason ?? 'User started new program'})
      WHERE user_id = ${userId}
        AND status = 'active'
    `
    return true
  } catch (error) {
    console.error('[HistoryService] Error archiving program:', error)
    return false
  }
}

/**
 * Get the next version number for a user's program
 */
export async function getNextProgramVersionNumber(userId: string): Promise<number> {
  if (!(await isDatabaseAvailable())) return 1

  const sql = await getSqlClient()
  if (!sql) return 1

  try {
    const result = await sql`
      SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
      FROM program_history
      WHERE user_id = ${userId}
    `
    return result[0]?.next_version ?? 1
  } catch (error) {
    console.error('[HistoryService] Error getting version number:', error)
    return 1
  }
}

/**
 * Get program history for a user
 */
export async function getProgramHistoryForUser(
  userId: string,
  options: HistoryQueryOptions = {}
): Promise<ProgramHistory[]> {
  if (!(await isDatabaseAvailable())) return []

  const sql = await getSqlClient()
  if (!sql) return []

  const { limit = 50, offset = 0, status, sortOrder = 'desc' } = options

  try {
    let result: ProgramHistoryRow[]

    if (status) {
      result = await sql`
        SELECT * FROM program_history
        WHERE user_id = ${userId} AND status = ${status}
        ORDER BY created_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT * FROM program_history
        WHERE user_id = ${userId}
        ORDER BY created_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return result.map(toProgramHistory)
  } catch (error) {
    console.error('[HistoryService] Error fetching program history:', error)
    return []
  }
}

/**
 * Get the active program history entry for a user
 */
export async function getActiveProgramHistory(userId: string): Promise<ProgramHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT * FROM program_history
      WHERE user_id = ${userId} AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `

    return result[0] ? toProgramHistory(result[0] as ProgramHistoryRow) : null
  } catch (error) {
    console.error('[HistoryService] Error fetching active program:', error)
    return null
  }
}

// =============================================================================
// WORKOUT SESSION HISTORY HELPERS
// =============================================================================

/**
 * Create a workout session history entry
 */
export async function createWorkoutSessionHistoryEntry(
  input: CreateWorkoutSessionInput
): Promise<WorkoutSessionHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO workout_session_history (
        user_id,
        program_history_id,
        active_program_id,
        workout_date,
        workout_name,
        day_label,
        session_number,
        session_status,
        summary_message,
        session_metrics_snapshot,
        exercise_results_snapshot,
        prs_hit_snapshot,
        duration_minutes,
        total_volume,
        exercises_completed,
        exercises_skipped,
        fatigue_rating,
        difficulty_rating
      ) VALUES (
        ${input.userId},
        ${input.programHistoryId ?? null},
        ${input.activeProgramId ?? null},
        ${input.workoutDate},
        ${input.workoutName},
        ${input.dayLabel ?? null},
        ${input.sessionNumber ?? null},
        ${input.sessionStatus ?? 'completed'},
        ${input.summaryMessage ?? null},
        ${JSON.stringify(input.sessionMetricsSnapshot)},
        ${JSON.stringify(input.exerciseResultsSnapshot)},
        ${JSON.stringify(input.prsHitSnapshot ?? [])},
        ${input.durationMinutes ?? null},
        ${input.totalVolume ?? null},
        ${input.exercisesCompleted ?? null},
        ${input.exercisesSkipped ?? null},
        ${input.fatigueRating ?? null},
        ${input.difficultyRating ?? null}
      )
      RETURNING *
    `

    // Update program history stats if linked
    if (input.programHistoryId) {
      await sql`
        UPDATE program_history
        SET 
          total_sessions_completed = total_sessions_completed + 1,
          total_prs_achieved = total_prs_achieved + ${(input.prsHitSnapshot ?? []).length}
        WHERE id = ${input.programHistoryId}
      `
    }

    return result[0] ? toWorkoutSession(result[0] as WorkoutSessionRow) : null
  } catch (error) {
    console.error('[HistoryService] Error creating workout session:', error)
    return null
  }
}

/**
 * Get workout history for a user
 */
export async function getWorkoutHistoryForUser(
  userId: string,
  options: HistoryQueryOptions = {}
): Promise<WorkoutSessionHistory[]> {
  if (!(await isDatabaseAvailable())) return []

  const sql = await getSqlClient()
  if (!sql) return []

  const { limit = 50, offset = 0, startDate, endDate, sortOrder = 'desc' } = options

  try {
    let result: WorkoutSessionRow[]

    if (startDate && endDate) {
      result = await sql`
        SELECT * FROM workout_session_history
        WHERE user_id = ${userId}
          AND workout_date >= ${startDate}
          AND workout_date <= ${endDate}
        ORDER BY workout_date ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT * FROM workout_session_history
        WHERE user_id = ${userId}
        ORDER BY workout_date ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return result.map(toWorkoutSession)
  } catch (error) {
    console.error('[HistoryService] Error fetching workout history:', error)
    return []
  }
}

/**
 * Get workout sessions for a specific program
 */
export async function getWorkoutSessionsForProgram(
  programHistoryId: string,
  options: HistoryQueryOptions = {}
): Promise<WorkoutSessionHistory[]> {
  if (!(await isDatabaseAvailable())) return []

  const sql = await getSqlClient()
  if (!sql) return []

  const { limit = 100, offset = 0, sortOrder = 'desc' } = options

  try {
    const result = await sql`
      SELECT * FROM workout_session_history
      WHERE program_history_id = ${programHistoryId}
      ORDER BY workout_date ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
      LIMIT ${limit} OFFSET ${offset}
    `

    return result.map(toWorkoutSession)
  } catch (error) {
    console.error('[HistoryService] Error fetching program sessions:', error)
    return []
  }
}

// =============================================================================
// PERSONAL RECORD HISTORY HELPERS
// =============================================================================

/**
 * Record a personal record entry
 */
export async function recordPersonalRecordEntry(
  input: CreatePersonalRecordInput
): Promise<PersonalRecordHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      INSERT INTO personal_record_history (
        user_id,
        exercise_key,
        exercise_name,
        exercise_category,
        pr_type,
        value_primary,
        value_secondary,
        unit,
        workout_session_id,
        program_history_id,
        bodyweight_at_time,
        notes
      ) VALUES (
        ${input.userId},
        ${input.exerciseKey},
        ${input.exerciseName},
        ${input.exerciseCategory ?? null},
        ${input.prType},
        ${input.valuePrimary},
        ${input.valueSecondary ?? null},
        ${input.unit ?? null},
        ${input.workoutSessionId ?? null},
        ${input.programHistoryId ?? null},
        ${input.bodyweightAtTime ?? null},
        ${input.notes ?? null}
      )
      RETURNING *
    `

    return result[0] ? toPersonalRecord(result[0] as PersonalRecordRow) : null
  } catch (error) {
    console.error('[HistoryService] Error recording PR:', error)
    return null
  }
}

/**
 * Record multiple PRs from a session
 */
export async function recordSessionPersonalRecords(
  userId: string,
  workoutSessionId: string,
  programHistoryId: string | undefined,
  prs: Array<{
    exerciseKey: string
    exerciseName: string
    exerciseCategory?: string
    prType: string
    valuePrimary: number
    valueSecondary?: number
    unit?: string
    bodyweightAtTime?: number
    notes?: string
  }>
): Promise<PersonalRecordHistory[]> {
  const results: PersonalRecordHistory[] = []

  for (const pr of prs) {
    const record = await recordPersonalRecordEntry({
      userId,
      exerciseKey: pr.exerciseKey,
      exerciseName: pr.exerciseName,
      exerciseCategory: pr.exerciseCategory as CreatePersonalRecordInput['exerciseCategory'],
      prType: pr.prType as CreatePersonalRecordInput['prType'],
      valuePrimary: pr.valuePrimary,
      valueSecondary: pr.valueSecondary,
      unit: pr.unit,
      workoutSessionId,
      programHistoryId,
      bodyweightAtTime: pr.bodyweightAtTime,
      notes: pr.notes,
    })

    if (record) {
      results.push(record)
    }
  }

  return results
}

/**
 * Get PR history for a user
 */
export async function getPersonalRecordHistoryForUser(
  userId: string,
  options: PRQueryOptions = {}
): Promise<PersonalRecordHistory[]> {
  if (!(await isDatabaseAvailable())) return []

  const sql = await getSqlClient()
  if (!sql) return []

  const { limit = 100, offset = 0, prType, exerciseCategory, sortOrder = 'desc' } = options

  try {
    let result: PersonalRecordRow[]

    if (prType && exerciseCategory) {
      result = await sql`
        SELECT * FROM personal_record_history
        WHERE user_id = ${userId}
          AND pr_type = ${prType}
          AND exercise_category = ${exerciseCategory}
        ORDER BY achieved_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (prType) {
      result = await sql`
        SELECT * FROM personal_record_history
        WHERE user_id = ${userId} AND pr_type = ${prType}
        ORDER BY achieved_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (exerciseCategory) {
      result = await sql`
        SELECT * FROM personal_record_history
        WHERE user_id = ${userId} AND exercise_category = ${exerciseCategory}
        ORDER BY achieved_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      result = await sql`
        SELECT * FROM personal_record_history
        WHERE user_id = ${userId}
        ORDER BY achieved_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    return result.map(toPersonalRecord)
  } catch (error) {
    console.error('[HistoryService] Error fetching PR history:', error)
    return []
  }
}

/**
 * Get PRs for a specific exercise
 */
export async function getPersonalRecordsByExercise(
  userId: string,
  exerciseKey: string,
  options: PRQueryOptions = {}
): Promise<PersonalRecordHistory[]> {
  if (!(await isDatabaseAvailable())) return []

  const sql = await getSqlClient()
  if (!sql) return []

  const { limit = 50, sortOrder = 'desc' } = options

  try {
    const result = await sql`
      SELECT * FROM personal_record_history
      WHERE user_id = ${userId} AND exercise_key = ${exerciseKey}
      ORDER BY achieved_at ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
      LIMIT ${limit}
    `

    return result.map(toPersonalRecord)
  } catch (error) {
    console.error('[HistoryService] Error fetching exercise PRs:', error)
    return []
  }
}

/**
 * Get the current best PR for an exercise and type
 */
export async function getCurrentBestPR(
  userId: string,
  exerciseKey: string,
  prType: string
): Promise<PersonalRecordHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT * FROM personal_record_history
      WHERE user_id = ${userId}
        AND exercise_key = ${exerciseKey}
        AND pr_type = ${prType}
      ORDER BY value_primary DESC
      LIMIT 1
    `

    return result[0] ? toPersonalRecord(result[0] as PersonalRecordRow) : null
  } catch (error) {
    console.error('[HistoryService] Error fetching best PR:', error)
    return null
  }
}

/**
 * Get total PR count for a user (optimized)
 */
export async function getTotalPRCount(userId: string): Promise<number> {
  if (!(await isDatabaseAvailable())) return 0

  const sql = await getSqlClient()
  if (!sql) return 0

  try {
    const result = await sql`
      SELECT COUNT(*) as count FROM personal_record_history
      WHERE user_id = ${userId}
    `
    return parseInt(result[0]?.count || '0', 10)
  } catch (error) {
    console.error('[HistoryService] Error counting PRs:', error)
    return 0
  }
}

/**
 * Get all-time best PRs grouped by exercise
 */
export async function getAllTimeBestPRs(
  userId: string
): Promise<Map<string, PersonalRecordHistory>> {
  if (!(await isDatabaseAvailable())) return new Map()

  const sql = await getSqlClient()
  if (!sql) return new Map()

  try {
    // Get best value for each exercise+type combination
    const result = await sql`
      SELECT DISTINCT ON (exercise_key, pr_type) *
      FROM personal_record_history
      WHERE user_id = ${userId}
      ORDER BY exercise_key, pr_type, value_primary DESC
    `

    const prMap = new Map<string, PersonalRecordHistory>()
    for (const row of result) {
      const pr = toPersonalRecord(row as PersonalRecordRow)
      const key = `${pr.exerciseKey}:${pr.prType}`
      prMap.set(key, pr)
    }

    return prMap
  } catch (error) {
    console.error('[HistoryService] Error fetching all-time PRs:', error)
    return new Map()
  }
}

/**
 * Check if a session was already persisted (for idempotency)
 * Prevents duplicate history entries for the same workout
 */
export async function isSessionAlreadyPersisted(
  userId: string,
  workoutName: string,
  workoutDate: string
): Promise<boolean> {
  if (!(await isDatabaseAvailable())) return false

  const sql = await getSqlClient()
  if (!sql) return false

  try {
    const result = await sql`
      SELECT id FROM workout_session_history
      WHERE user_id = ${userId}
        AND workout_name = ${workoutName}
        AND workout_date = ${workoutDate}
      LIMIT 1
    `
    return result.length > 0
  } catch (error) {
    console.error('[HistoryService] Error checking session existence:', error)
    return false
  }
}

/**
 * Get a workout session by ID
 */
export async function getWorkoutSessionHistoryById(
  sessionId: string
): Promise<WorkoutSessionHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT * FROM workout_session_history
      WHERE id = ${sessionId}
      LIMIT 1
    `

    return result[0] ? toWorkoutSession(result[0] as WorkoutSessionRow) : null
  } catch (error) {
    console.error('[HistoryService] Error fetching session by ID:', error)
    return null
  }
}

/**
 * Get a program history entry by ID
 */
export async function getProgramHistoryById(
  programId: string
): Promise<ProgramHistory | null> {
  if (!(await isDatabaseAvailable())) return null

  const sql = await getSqlClient()
  if (!sql) return null

  try {
    const result = await sql`
      SELECT * FROM program_history
      WHERE id = ${programId}
      LIMIT 1
    `

    return result[0] ? toProgramHistory(result[0] as ProgramHistoryRow) : null
  } catch (error) {
    console.error('[HistoryService] Error fetching program by ID:', error)
    return null
  }
}

/**
 * Get the active program history ID for workout session linkage
 * Returns the ID of the current active program or null if none exists
 */
export async function getActiveProgramHistoryId(userId: string): Promise<string | null> {
  const active = await getActiveProgramHistory(userId)
  return active?.id ?? null
}

/**
 * Get workout sessions for a specific program version
 */
export async function getWorkoutSessionsForProgram(
  userId: string,
  programHistoryId: string,
  options: HistoryQueryOptions = {}
): Promise<WorkoutSessionHistory[]> {
  if (!(await isDatabaseAvailable())) return []

  const sql = await getSqlClient()
  if (!sql) return []

  const { limit = 100, sortOrder = 'desc' } = options

  try {
    const result = await sql`
      SELECT * FROM workout_session_history
      WHERE user_id = ${userId} AND program_history_id = ${programHistoryId}
      ORDER BY workout_date ${sortOrder === 'asc' ? sql`ASC` : sql`DESC`}
      LIMIT ${limit}
    `

    return result.map(row => toWorkoutSession(row as WorkoutSessionRow))
  } catch (error) {
    console.error('[HistoryService] Error fetching program sessions:', error)
    return []
  }
}
