-- Program Versioning Tables
-- Enables tracking of program regenerations while preserving continuity

-- =============================================================================
-- PROGRAM VERSIONS TABLE
-- =============================================================================
-- Tracks each distinct program version generated for an athlete

CREATE TABLE IF NOT EXISTS program_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded', 'pending')),
  
  -- Generation context
  generation_reason TEXT NOT NULL DEFAULT 'onboarding_initial_generation',
  source_snapshot_id TEXT,
  
  -- Program summary (compact metadata)
  primary_goal TEXT,
  training_days_per_week INTEGER,
  session_length_minutes INTEGER,
  equipment_summary TEXT[],
  focus_summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  superseded_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure only one active version per user
  CONSTRAINT unique_active_version EXCLUDE (user_id WITH =) WHERE (status = 'active')
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_program_versions_user_id ON program_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_program_versions_status ON program_versions(status);
CREATE INDEX IF NOT EXISTS idx_program_versions_user_active ON program_versions(user_id, status) WHERE status = 'active';

-- =============================================================================
-- PROGRAM INPUT SNAPSHOTS TABLE
-- =============================================================================
-- Captures the exact inputs that generated a program version

CREATE TABLE IF NOT EXISTS program_input_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  -- Athlete Profile Snapshot (JSON for flexibility)
  athlete_profile_snapshot JSONB NOT NULL DEFAULT '{}',
  
  -- Skill State Snapshot
  skill_state_snapshot JSONB DEFAULT '{}',
  
  -- Readiness Snapshot
  readiness_snapshot JSONB DEFAULT '{}',
  
  -- Constraint Detection Snapshot
  constraint_snapshot JSONB DEFAULT '{}',
  
  -- Fatigue State Snapshot
  fatigue_snapshot JSONB DEFAULT '{}',
  
  -- Equipment at time of generation
  equipment_snapshot TEXT[] DEFAULT '{}',
  
  -- Schedule at time of generation
  training_days_snapshot INTEGER,
  session_length_snapshot INTEGER,
  
  -- Meta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_input_snapshots_user_id ON program_input_snapshots(user_id);

-- =============================================================================
-- GENERATION REASONS ENUM (for reference)
-- =============================================================================
-- Valid generation_reason values:
-- 'onboarding_initial_generation' - First program after onboarding
-- 'settings_schedule_change' - Training days or session length changed
-- 'settings_equipment_change' - Equipment availability changed
-- 'settings_goal_change' - Primary/secondary goal changed
-- 'fatigue_deload' - Fatigue system triggered structural deload
-- 'skill_priority_update' - Skill focus changed
-- 'benchmark_update' - Major strength benchmark update
-- 'adaptive_rebalance' - Adaptive engine structural adjustment
-- 'joint_caution_change' - Joint cautions updated
-- 'manual_regeneration' - User requested regeneration
-- 'comeback_adjustment' - Returning after consistency gap

COMMENT ON TABLE program_versions IS 'Tracks versioned training programs with continuity preservation';
COMMENT ON TABLE program_input_snapshots IS 'Captures generation inputs for reproducibility and comparison';
