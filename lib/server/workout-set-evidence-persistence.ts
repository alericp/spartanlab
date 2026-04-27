// =============================================================================
// PHASE N — WORKOUT SET EVIDENCE PERSISTENCE (SERVER-ONLY WRITER)
// =============================================================================
// Server-safe writer that flattens a canonical WorkoutLog (Phase L
// completedSetEvidence) into per-row inserts on `workout_log_set_evidence`.
//
// Doctrine:
//   - This module is the persistence corridor only. It does NOT decide
//     adaptation, it does NOT generate UI labels, it does NOT mutate any
//     program object. Adaptation logic stays in
//     lib/program/performance-feedback-adaptation-contract.ts (Phase L).
//   - Writes are user-scoped. The caller MUST pass the canonical dbUserId
//     resolved via resolveCanonicalDbUserId (no Clerk ids leak into rows).
//   - Inserts are deduped by `evidence_hash` via ON CONFLICT DO NOTHING so
//     re-saving the same workout (or replaying the same payload) cannot
//     create duplicate evidence rows.
//   - Failure in this writer must NEVER crash the live workout UI. Callers
//     are expected to invoke this from a server route (fire-and-forget from
//     the client) so localStorage / live-reducer state is unaffected.
// =============================================================================

import { neon } from '@neondatabase/serverless'
import type {
  CompletedSetEvidence,
  MinimalWorkoutLogShape,
} from '@/lib/program/performance-feedback-adaptation-contract'

// -----------------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------------

export interface PersistWorkoutLogEvidenceInput {
  /** Canonical app user id (users.id), NOT a Clerk id. */
  dbUserId: string
  /** Optional program id this workout was performed against. */
  programId?: string | null
  /** The WorkoutLog as captured by saveWorkoutLog. */
  workoutLog: MinimalWorkoutLogShape & { id: string; createdAt?: string }
}

export interface PersistResult {
  attempted: number
  inserted: number
  skipped: number
  failed: number
  reason?:
    | 'no_evidence'
    | 'untrusted_log'
    | 'demo_log'
    | 'no_user'
    | 'db_error'
    | 'no_log_id'
    | null
  error?: string
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('[phase-n-evidence-persistence] DATABASE_URL not set')
  }
  return neon(url)
}

/**
 * FNV-1a 32-bit, JSON-safe (NOT a security primitive). We use the SAME
 * algorithm in the reader so identical inputs produce identical hashes
 * across server boundaries — this is the dedupe key.
 *
 * Hash inputs deliberately include workoutLogId + setNumber + (exerciseId
 * or normalized exerciseName) + actuals so two distinct workouts cannot
 * collide, but the same workout replayed produces identical hashes per row.
 */
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function buildEvidenceHash(parts: {
  dbUserId: string
  workoutLogId: string
  setNumber: number
  exerciseKey: string
  actualReps: number | null
  actualHold: number | null
  actualRPE: number | null
}): string {
  return fnv1aHex(
    [
      parts.dbUserId,
      parts.workoutLogId,
      parts.exerciseKey,
      `s${parts.setNumber}`,
      `r${parts.actualReps ?? ''}`,
      `h${parts.actualHold ?? ''}`,
      `e${parts.actualRPE ?? ''}`,
    ].join('|'),
  )
}

function normalizeExerciseKey(ev: CompletedSetEvidence): string {
  if (typeof ev.exerciseId === 'string' && ev.exerciseId.length > 0) return ev.exerciseId
  const name = ev.exerciseName ?? ''
  return name.toLowerCase().trim().replace(/\s+/g, '_')
}

function safeNumber(value: unknown): number | null {
  if (typeof value !== 'number') return null
  if (!Number.isFinite(value)) return null
  return value
}

function safeString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (value.length === 0) return null
  return value
}

// -----------------------------------------------------------------------------
// Public writer
// -----------------------------------------------------------------------------

/**
 * Flatten a WorkoutLog's completedSetEvidence into rows on
 * `workout_log_set_evidence`. Idempotent via the unique `evidence_hash`
 * column — calling twice with the same payload inserts no new rows.
 *
 * Untrusted / demo logs are SKIPPED (returned with reason). The Phase L/M
 * resolver also filters untrusted logs at the read step, so persisting them
 * would only be wasted writes.
 */
export async function persistWorkoutLogSetEvidence(
  input: PersistWorkoutLogEvidenceInput,
): Promise<PersistResult> {
  const { dbUserId, programId, workoutLog } = input

  if (!dbUserId) {
    return { attempted: 0, inserted: 0, skipped: 0, failed: 0, reason: 'no_user' }
  }
  if (!workoutLog?.id) {
    return { attempted: 0, inserted: 0, skipped: 0, failed: 0, reason: 'no_log_id' }
  }
  if (workoutLog.trusted === false) {
    return { attempted: 0, inserted: 0, skipped: 0, failed: 0, reason: 'untrusted_log' }
  }
  if (workoutLog.sourceRoute === 'demo') {
    return { attempted: 0, inserted: 0, skipped: 0, failed: 0, reason: 'demo_log' }
  }

  const evidence = Array.isArray(workoutLog.completedSetEvidence)
    ? workoutLog.completedSetEvidence
    : []
  if (evidence.length === 0) {
    return { attempted: 0, inserted: 0, skipped: 0, failed: 0, reason: 'no_evidence' }
  }

  const sql = getSql()

  let inserted = 0
  let skipped = 0
  let failed = 0

  // Insert one row at a time so a single bad row never blocks the others.
  // Volume per workout is small (~10-50 sets); per-row latency is acceptable
  // and ON CONFLICT DO NOTHING handles dedupe at the row level.
  for (let i = 0; i < evidence.length; i += 1) {
    const ev = evidence[i]
    if (!ev) continue

    const exerciseKey = normalizeExerciseKey(ev)
    const setNumber =
      typeof ev.setNumber === 'number' && Number.isFinite(ev.setNumber) ? ev.setNumber : i + 1
    const actualReps = safeNumber(ev.actualReps)
    const actualHold = safeNumber(ev.actualHoldSeconds)
    const actualRPE = safeNumber(ev.actualRPE)

    const evidenceHash = buildEvidenceHash({
      dbUserId,
      workoutLogId: workoutLog.id,
      setNumber,
      exerciseKey,
      actualReps,
      actualHold,
      actualRPE,
    })

    try {
      const result = (await sql/* sql */`
        INSERT INTO workout_log_set_evidence (
          user_id,
          program_id,
          workout_log_id,
          day_number,
          session_id,
          exercise_id,
          exercise_name,
          exercise_slug,
          set_index,
          target_reps,
          actual_reps,
          target_hold_seconds,
          actual_hold_seconds,
          target_rpe,
          actual_rpe,
          prescribed_load,
          actual_load,
          load_unit,
          band_assistance,
          band_color,
          method_type,
          group_type,
          is_time_based,
          note_text,
          note_tags,
          signal_flags,
          evidence_hash,
          source,
          session_date
        ) VALUES (
          ${dbUserId},
          ${programId ?? null},
          ${workoutLog.id},
          ${safeNumber(ev.dayNumber)},
          ${safeString(ev.sessionId)},
          ${safeString(ev.exerciseId)},
          ${ev.exerciseName ?? null},
          ${exerciseKey},
          ${setNumber},
          ${safeNumber(ev.prescribedReps)},
          ${actualReps},
          ${safeNumber(ev.prescribedHoldSeconds)},
          ${actualHold},
          ${safeNumber(ev.prescribedRPE)},
          ${actualRPE},
          ${safeNumber(ev.prescribedLoad)},
          ${safeNumber(ev.actualLoad)},
          ${null},
          ${null},
          ${null},
          ${null},
          ${null},
          ${false},
          ${safeString(ev.note)},
          ${JSON.stringify(Array.isArray(ev.noteFlags) ? ev.noteFlags : [])}::jsonb,
          ${JSON.stringify({})}::jsonb,
          ${evidenceHash},
          ${'live_workout'},
          ${safeString(workoutLog.sessionDate) ?? safeString(workoutLog.createdAt)}
        )
        ON CONFLICT (evidence_hash) DO NOTHING
        RETURNING id
      `) as Array<{ id: string }>

      const rows = Array.isArray(result) ? result : []
      if (rows.length > 0) {
        inserted += 1
      } else {
        skipped += 1
      }
    } catch (rowErr) {
      failed += 1
      console.log('[phase-n-evidence-row-failed]', {
        workoutLogId: workoutLog.id,
        setNumber,
        exerciseKey,
        error: String(rowErr),
      })
    }
  }

  return {
    attempted: evidence.length,
    inserted,
    skipped,
    failed,
    reason: failed > 0 ? 'db_error' : null,
  }
}
