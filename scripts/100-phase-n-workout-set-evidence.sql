-- =============================================================================
-- PHASE N — Workout Log Set Evidence (additive, idempotent)
-- =============================================================================
-- Closes the Phase M remaining blocker: per-set completedSetEvidence was only
-- in client localStorage / route payload, so server-initiated generations or
-- generations missing recentWorkoutLogs could not see recent performance.
--
-- This migration introduces a server-readable evidence ledger. It does NOT
-- own adaptation rules; the Phase L resolver is still the only mutation
-- decision owner. This table is the durable backing store for the same
-- CompletedSetEvidence shape the Phase L contract already consumes.
--
-- SAFETY:
--   - All operations are guarded by IF NOT EXISTS — re-runnable.
--   - No existing tables are dropped, renamed, or destructively altered.
--   - No rows are deleted.
--   - Workout log rows continue to live in workout_logs; this table is the
--     normalized per-set companion ledger keyed by workout_log_id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS workout_log_set_evidence (
  -- Primary identity
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Ownership (matches existing convention on workout_logs.user_id /
  -- athlete_profiles.user_id — canonical users.id, i.e. "user_<clerkId>").
  user_id                  TEXT NOT NULL,

  -- Optional program / session relation. Nullable because some clients log
  -- workouts without a generated program reference (quick log).
  program_id               TEXT,
  workout_log_id           TEXT,
  session_id               TEXT,
  day_number               INTEGER,

  -- Exercise identity. exercise_name is required since logs always have a
  -- display name; exercise_id / exercise_slug are best-effort.
  exercise_id              TEXT,
  exercise_name            TEXT NOT NULL,
  exercise_slug            TEXT,

  -- Set identity. -1 represents an aggregated per-exercise summary row.
  set_index                INTEGER NOT NULL,

  -- Prescribed values (nullable when log payload didn't carry them).
  target_reps              INTEGER,
  target_hold_seconds      NUMERIC,
  target_rpe               NUMERIC,
  prescribed_load          NUMERIC,
  load_unit                TEXT,

  -- Actual values (nullable when not reported — never faked).
  actual_reps              INTEGER,
  actual_hold_seconds      NUMERIC,
  actual_rpe               NUMERIC,
  actual_load              NUMERIC,

  -- Band assistance / method context.
  band_assistance          BOOLEAN,
  band_color               TEXT,
  method_type              TEXT,
  group_type               TEXT,

  -- Time-vs-rep flag.
  is_time_based            BOOLEAN NOT NULL DEFAULT FALSE,

  -- Notes + structured tag flags from execution-truth notes.
  note_text                TEXT,
  note_tags                JSONB NOT NULL DEFAULT '[]'::jsonb,
  signal_flags             JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Dedupe + provenance.
  evidence_hash            TEXT NOT NULL,
  source                   TEXT NOT NULL DEFAULT 'live_workout',

  -- Timestamps.
  created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Read indexes -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workout_log_set_evidence_user_created
  ON workout_log_set_evidence (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_log_set_evidence_user_program_created
  ON workout_log_set_evidence (user_id, program_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_log_set_evidence_log
  ON workout_log_set_evidence (workout_log_id);

-- Dedupe ---------------------------------------------------------------------
-- evidence_hash is a deterministic FNV-1a hex of
--   user_id | workout_log_id | exercise_id_or_name | set_index | actual_reps
--   | actual_hold_seconds | actual_rpe | created_at_bucket
-- so re-saving the same workout produces the same hash and the unique index
-- silently dedupes. Different workouts cannot collide because user_id +
-- workout_log_id + set_index are part of the input.
CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_log_set_evidence_hash_unique
  ON workout_log_set_evidence (evidence_hash);
