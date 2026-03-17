-- Program History Versioning System
-- Creates tables for durable program history, session tracking, and PR records
-- Part of SpartanLab core differentiator: never lose program data

-- =============================================================================
-- PROGRAM HISTORY TABLE
-- =============================================================================
-- Archives complete program snapshots for long-term history

CREATE TABLE IF NOT EXISTS program_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  -- Program identification
  source_program_id TEXT,                    -- Reference to original programs.id if applicable
  version_number INTEGER NOT NULL DEFAULT 1,
  program_name TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'replaced', 'completed', 'paused')),
  
  -- Why this program was created
  generation_reason TEXT NOT NULL DEFAULT 'initial_generation',
  reason_summary TEXT,                       -- Human-readable explanation
  
  -- Full snapshots (JSON for durability)
  goals_snapshot JSONB NOT NULL DEFAULT '{}',
  athlete_inputs_snapshot JSONB NOT NULL DEFAULT '{}',
  program_structure_snapshot JSONB NOT NULL DEFAULT '{}',
  
  -- Summary fields for quick queries
  primary_goal TEXT,
  training_days_per_week INTEGER,
  session_length_minutes INTEGER,
  block_summary TEXT,
  
  -- Notes
  user_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Statistics (updated as workouts complete)
  total_sessions_completed INTEGER DEFAULT 0,
  total_prs_achieved INTEGER DEFAULT 0
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_program_history_user_id ON program_history(user_id);
CREATE INDEX IF NOT EXISTS idx_program_history_status ON program_history(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_history_created ON program_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_history_active ON program_history(user_id) WHERE status = 'active';

-- =============================================================================
-- WORKOUT SESSION HISTORY TABLE
-- =============================================================================
-- Stores completed workout sessions with full context

CREATE TABLE IF NOT EXISTS workout_session_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  -- Program linkage (preserved even if program changes)
  program_history_id TEXT REFERENCES program_history(id) ON DELETE SET NULL,
  active_program_id TEXT,                    -- Link to programs.id at time of workout
  
  -- Session identification
  workout_date DATE NOT NULL,
  workout_name TEXT NOT NULL,
  day_label TEXT,                            -- e.g., "Day 1", "Week 2 Day 3"
  session_number INTEGER,                    -- Sequential session number in program
  
  -- Status
  session_status TEXT NOT NULL DEFAULT 'completed' CHECK (session_status IN ('completed', 'partial', 'skipped', 'deload')),
  
  -- Summary message (the daily highlight)
  summary_message TEXT,                      -- e.g., "Crushed it! New pull-up PR!"
  
  -- Full snapshots (JSON for durability)
  session_metrics_snapshot JSONB NOT NULL DEFAULT '{}',
  exercise_results_snapshot JSONB NOT NULL DEFAULT '[]',
  prs_hit_snapshot JSONB NOT NULL DEFAULT '[]',
  
  -- Quick-access metrics
  duration_minutes INTEGER,
  total_volume INTEGER,
  exercises_completed INTEGER,
  exercises_skipped INTEGER,
  fatigue_rating INTEGER CHECK (fatigue_rating >= 1 AND fatigue_rating <= 10),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_workout_session_history_user_id ON workout_session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_history_date ON workout_session_history(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_session_history_program ON workout_session_history(program_history_id);

-- =============================================================================
-- PERSONAL RECORD HISTORY TABLE
-- =============================================================================
-- Optimized PR lookup across all training history

CREATE TABLE IF NOT EXISTS personal_record_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  -- Exercise identification
  exercise_key TEXT NOT NULL,                -- Normalized exercise identifier
  exercise_name TEXT NOT NULL,               -- Human-readable name
  exercise_category TEXT,                    -- 'skill', 'strength', 'weighted', 'bodyweight'
  
  -- PR type and value
  pr_type TEXT NOT NULL CHECK (pr_type IN (
    'max_weight',      -- Heaviest weight lifted
    'best_reps',       -- Most reps at given weight
    'best_hold',       -- Longest hold time
    'best_volume',     -- Highest single-session volume
    'best_density',    -- Best work per time
    'best_level',      -- Highest progression level achieved
    'best_sets',       -- Most quality sets
    'first_unlock'     -- First time achieving the movement
  )),
  
  -- Values (flexible for different PR types)
  value_primary NUMERIC NOT NULL,            -- Main PR value
  value_secondary NUMERIC,                   -- Supporting value (e.g., reps for max_weight)
  unit TEXT,                                 -- 'kg', 'lbs', 'seconds', 'reps', 'level'
  
  -- Context
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workout_session_id TEXT REFERENCES workout_session_history(id) ON DELETE SET NULL,
  program_history_id TEXT REFERENCES program_history(id) ON DELETE SET NULL,
  
  -- Additional context
  bodyweight_at_time NUMERIC,                -- For relative strength calculations
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure we can track PR progression
  UNIQUE(user_id, exercise_key, pr_type, achieved_at)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_pr_history_user_id ON personal_record_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pr_history_exercise ON personal_record_history(user_id, exercise_key);
CREATE INDEX IF NOT EXISTS idx_pr_history_type ON personal_record_history(user_id, pr_type);
CREATE INDEX IF NOT EXISTS idx_pr_history_achieved ON personal_record_history(user_id, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_pr_history_session ON personal_record_history(workout_session_id);

-- =============================================================================
-- TABLE COMMENTS
-- =============================================================================

COMMENT ON TABLE program_history IS 'Durable archive of all program versions with full snapshots - never lose program data';
COMMENT ON TABLE workout_session_history IS 'Complete workout session records with exercise results and PRs';
COMMENT ON TABLE personal_record_history IS 'Optimized PR index for fast lookup of best performances';

COMMENT ON COLUMN program_history.reason_summary IS 'Human-readable explanation for why this program was generated';
COMMENT ON COLUMN program_history.status IS 'Current status: active (current), archived (replaced), completed (finished), paused (on hold)';
COMMENT ON COLUMN workout_session_history.program_history_id IS 'Links session to program history for permanent tracking across program changes';
COMMENT ON COLUMN personal_record_history.pr_type IS 'Type of personal record being tracked';
