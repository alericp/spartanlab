// =============================================================================
// PHASE N — WORKOUT SET EVIDENCE READER (SERVER-ONLY)
// =============================================================================
// Server-safe reader that pulls recent rows from `workout_log_set_evidence`
// and reshapes them into "synthetic workout logs" — one log per
// `workout_log_id` with a CompletedSetEvidence[] array — so the existing
// Phase M `buildPerformanceHistoryContext()` and Phase L resolver can
// consume them WITHOUT any new code path or duplicated rule logic.
//
// Doctrine:
//   - Reader only. No adaptation decisions, no UI labels, no program mutation.
//   - Always user-scoped. We refuse to query if userId is missing.
//   - Bounded by both row limit and time window (sinceDays).
//   - Results are sorted newest-first so the resolver respects recency.
//   - Returns an empty array on missing/no rows so the caller's existing
//     "insufficient_data" path is reused.
// =============================================================================

import { neon } from '@neondatabase/serverless'
import type {
  CompletedSetEvidence,
  MinimalWorkoutLogShape,
} from '@/lib/program/performance-feedback-adaptation-contract'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface EvidenceQuery {
  /** Canonical app user id (users.id), required. */
  userId: string
  /** Optional program scope. When provided, only matching rows are returned. */
  programId?: string | null
  /**
   * Maximum number of synthetic workout logs to return (groups by
   * workout_log_id). Defaults to 14 to match the Phase M client-side
   * recent-log slice.
   */
  limit?: number
  /**
   * Maximum age of evidence in days. Defaults to 30. Caller can pass a
   * smaller window for tighter signal-to-noise.
   */
  sinceDays?: number
}

export type SyntheticWorkoutLog = MinimalWorkoutLogShape & {
  id: string
  createdAt?: string
  sessionDate?: string
  trusted?: boolean
  completedSetEvidence: CompletedSetEvidence[]
}

export interface EvidenceReaderResult {
  logs: SyntheticWorkoutLog[]
  totalRowsRead: number
  groupCount: number
  status: 'ok' | 'no_user' | 'no_rows' | 'db_error'
  error?: string
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('[phase-n-evidence-reader] DATABASE_URL not set')
  }
  return neon(url)
}

interface RawEvidenceRow {
  user_id: string
  program_id: string | null
  workout_log_id: string
  day_number: number | null
  session_id: string | null
  exercise_id: string | null
  exercise_name: string | null
  exercise_slug: string | null
  set_index: number
  target_reps: number | null
  actual_reps: number | null
  target_hold_seconds: number | null
  actual_hold_seconds: number | null
  target_rpe: number | null
  actual_rpe: number | null
  prescribed_load: number | null
  actual_load: number | null
  load_unit: string | null
  band_assistance: boolean | null
  band_color: string | null
  method_type: string | null
  group_type: string | null
  is_time_based: boolean
  note_text: string | null
  note_tags: unknown
  signal_flags: unknown
  evidence_hash: string
  source: string
  session_date: string | null
  created_at: string
}

/** Coerce a Neon JSONB array column back to a string array. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string')
}

function rowToCompletedSetEvidence(row: RawEvidenceRow): CompletedSetEvidence {
  // Field names here MUST match the canonical CompletedSetEvidence contract
  // exported by lib/program/performance-feedback-adaptation-contract.ts —
  // setNumber (not setIndex), actualRPE/prescribedRPE (uppercase),
  // prescribedReps/prescribedHoldSeconds, note (not noteText),
  // noteFlags (not noteTags). Phase L resolver consumes this shape directly.
  return {
    exerciseId: row.exercise_id ?? undefined,
    exerciseName: row.exercise_name ?? '',
    sessionId: row.session_id ?? undefined,
    dayNumber: row.day_number ?? undefined,
    setNumber: row.set_index,
    prescribedReps: row.target_reps ?? undefined,
    prescribedHoldSeconds: row.target_hold_seconds ?? undefined,
    actualReps: row.actual_reps ?? undefined,
    actualHoldSeconds: row.actual_hold_seconds ?? undefined,
    prescribedLoad: row.prescribed_load ?? undefined,
    actualLoad: row.actual_load ?? undefined,
    prescribedRPE: row.target_rpe ?? undefined,
    actualRPE: row.actual_rpe ?? undefined,
    note: row.note_text ?? undefined,
    noteFlags: toStringArray(row.note_tags),
    timestamp: row.created_at,
    trusted: true,
  }
}

// -----------------------------------------------------------------------------
// Public reader
// -----------------------------------------------------------------------------

/**
 * Fetch recent persisted workout set evidence for the given user, grouped
 * into synthetic workout logs ready for Phase M
 * `buildPerformanceHistoryContext()`.
 *
 * Always user-scoped. Refuses to query if `userId` is empty so an
 * authentication failure upstream cannot leak evidence across users.
 */
export async function getRecentWorkoutSetEvidenceForGeneration(
  query: EvidenceQuery,
): Promise<EvidenceReaderResult> {
  const userId = query.userId
  if (!userId) {
    return { logs: [], totalRowsRead: 0, groupCount: 0, status: 'no_user' }
  }

  const limit = Math.min(Math.max(query.limit ?? 14, 1), 50)
  const sinceDays = Math.min(Math.max(query.sinceDays ?? 30, 1), 90)
  const programId = query.programId ?? null

  let rows: RawEvidenceRow[] = []
  try {
    const sql = getSql()
    // [PHASE-N] Two-step: get the most-recent N distinct workout_log_ids in
    // window, then fetch all evidence rows for them. Keeps the result
    // bounded even when a single workout has many sets.
    //
    // programId filter rule: when a programId is provided, prefer rows that
    // either match it exactly OR have program_id IS NULL. The current
    // writer (lib/server/workout-set-evidence-persistence.ts, called from
    // /api/workout-log/save-evidence) doesn't yet receive a programId from
    // the client and persists NULL — so a strict equality filter would
    // discard otherwise-valid recent evidence. Widening to "NULL or match"
    // is still user-scoped and future-proof for when the writer learns
    // programId. Without programId, we fetch all user-scoped rows in window.
    if (programId) {
      const idRows = (await sql/* sql */`
        SELECT workout_log_id, MAX(created_at) AS latest_at
        FROM workout_log_set_evidence
        WHERE user_id = ${userId}
          AND (program_id = ${programId} OR program_id IS NULL)
          AND created_at >= NOW() - (${sinceDays} || ' days')::interval
        GROUP BY workout_log_id
        ORDER BY latest_at DESC
        LIMIT ${limit}
      `) as Array<{ workout_log_id: string }>

      const ids = idRows.map((r) => r.workout_log_id)
      if (ids.length === 0) {
        return { logs: [], totalRowsRead: 0, groupCount: 0, status: 'no_rows' }
      }
      rows = (await sql/* sql */`
        SELECT *
        FROM workout_log_set_evidence
        WHERE user_id = ${userId}
          AND workout_log_id = ANY(${ids})
        ORDER BY created_at DESC, set_index ASC
      `) as RawEvidenceRow[]
    } else {
      const idRows = (await sql/* sql */`
        SELECT workout_log_id, MAX(created_at) AS latest_at
        FROM workout_log_set_evidence
        WHERE user_id = ${userId}
          AND created_at >= NOW() - (${sinceDays} || ' days')::interval
        GROUP BY workout_log_id
        ORDER BY latest_at DESC
        LIMIT ${limit}
      `) as Array<{ workout_log_id: string }>

      const ids = idRows.map((r) => r.workout_log_id)
      if (ids.length === 0) {
        return { logs: [], totalRowsRead: 0, groupCount: 0, status: 'no_rows' }
      }
      rows = (await sql/* sql */`
        SELECT *
        FROM workout_log_set_evidence
        WHERE user_id = ${userId}
          AND workout_log_id = ANY(${ids})
        ORDER BY created_at DESC, set_index ASC
      `) as RawEvidenceRow[]
    }
  } catch (err) {
    console.log('[phase-n-evidence-reader-failed]', {
      userId,
      programId,
      error: String(err),
    })
    return {
      logs: [],
      totalRowsRead: 0,
      groupCount: 0,
      status: 'db_error',
      error: String(err),
    }
  }

  if (rows.length === 0) {
    return { logs: [], totalRowsRead: 0, groupCount: 0, status: 'no_rows' }
  }

  // Group rows by workout_log_id, preserving newest-first order.
  const byLogId = new Map<string, SyntheticWorkoutLog>()
  for (const row of rows) {
    const existing = byLogId.get(row.workout_log_id)
    if (existing) {
      existing.completedSetEvidence.push(rowToCompletedSetEvidence(row))
      continue
    }
    byLogId.set(row.workout_log_id, {
      // Use the SAME id the localStorage WorkoutLog used so client
      // payload + Neon evidence dedupe naturally by log id.
      id: row.workout_log_id,
      createdAt: row.created_at,
      sessionDate: row.session_date ?? row.created_at,
      // Persisted rows are by definition trusted (untrusted/demo logs are
      // never written by the persistence corridor).
      trusted: true,
      completedSetEvidence: [rowToCompletedSetEvidence(row)],
    })
  }

  // Map order is insertion order; rows came back DESC by created_at so
  // byLogId iteration order matches newest-first.
  const logs = Array.from(byLogId.values())

  return {
    logs,
    totalRowsRead: rows.length,
    groupCount: logs.length,
    status: 'ok',
  }
}
