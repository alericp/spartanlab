-- Settings Regeneration Support Tables
-- Enhances program version management for intelligent settings changes
-- Preserves continuity while enabling smart program updates

-- =============================================================================
-- ENHANCE PROGRAM_VERSIONS TABLE
-- =============================================================================

-- Add athlete_id column if it doesn't exist (for consistency with other tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE program_versions ADD COLUMN athlete_id TEXT;
    -- Copy data from user_id to athlete_id
    UPDATE program_versions SET athlete_id = user_id WHERE athlete_id IS NULL;
  END IF;
END $$;

-- Add active_flag column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' AND column_name = 'active_flag'
  ) THEN
    ALTER TABLE program_versions ADD COLUMN active_flag BOOLEAN DEFAULT FALSE;
    -- Set active_flag based on status
    UPDATE program_versions SET active_flag = (status = 'active') WHERE active_flag IS NULL;
  END IF;
END $$;

-- Add program_summary JSONB column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' AND column_name = 'program_summary'
  ) THEN
    ALTER TABLE program_versions ADD COLUMN program_summary JSONB DEFAULT '{}';
    -- Migrate existing data to program_summary
    UPDATE program_versions 
    SET program_summary = jsonb_build_object(
      'primaryGoal', COALESCE(primary_goal, 'general'),
      'trainingDaysPerWeek', COALESCE(training_days_per_week, 3),
      'sessionDurationMinutes', COALESCE(session_length_minutes, 60),
      'styleMode', 'balanced_hybrid',
      'constraintFocus', focus_summary,
      'equipment', COALESCE(equipment_summary, ARRAY[]::TEXT[]),
      'generatedAt', created_at
    )
    WHERE program_summary = '{}' OR program_summary IS NULL;
  END IF;
END $$;

-- Create index for active_flag
CREATE INDEX IF NOT EXISTS idx_program_versions_active_flag 
ON program_versions(athlete_id, active_flag) WHERE active_flag = true;

-- =============================================================================
-- ADD STYLE_SNAPSHOT TO PROGRAM_INPUT_SNAPSHOTS
-- =============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' AND column_name = 'style_snapshot'
  ) THEN
    ALTER TABLE program_input_snapshots ADD COLUMN style_snapshot JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add athlete_id to program_input_snapshots if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE program_input_snapshots ADD COLUMN athlete_id TEXT;
    UPDATE program_input_snapshots SET athlete_id = user_id WHERE athlete_id IS NULL;
  END IF;
END $$;

-- =============================================================================
-- SESSION ADAPTATIONS TABLE
-- =============================================================================
-- Tracks minor adaptations that don't require a new program version

CREATE TABLE IF NOT EXISTS session_adaptations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  athlete_id TEXT NOT NULL,
  program_version_id TEXT NOT NULL REFERENCES program_versions(id) ON DELETE CASCADE,
  
  -- Adaptation details
  adaptation_type TEXT NOT NULL CHECK (adaptation_type IN ('pacing', 'emphasis', 'intensity', 'substitution')),
  description TEXT NOT NULL,
  
  -- Change tracking
  trigger_field TEXT,  -- Which settings field triggered this
  previous_value TEXT, -- Optional: what the value was before
  new_value TEXT,      -- Optional: what the value is now
  
  -- Application scope
  applies_to TEXT DEFAULT 'future', -- 'future' or 'current_and_future'
  
  -- Timestamps and expiry
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for session_adaptations
CREATE INDEX IF NOT EXISTS idx_session_adaptations_athlete 
ON session_adaptations(athlete_id);

CREATE INDEX IF NOT EXISTS idx_session_adaptations_version 
ON session_adaptations(program_version_id);

CREATE INDEX IF NOT EXISTS idx_session_adaptations_active 
ON session_adaptations(athlete_id, is_active) WHERE is_active = true;

-- =============================================================================
-- SETTINGS CHANGE LOG TABLE
-- =============================================================================
-- Audit log of all settings changes for debugging and analysis

CREATE TABLE IF NOT EXISTS settings_change_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  athlete_id TEXT NOT NULL,
  
  -- Change details
  field_name TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  
  -- Classification
  change_category TEXT NOT NULL CHECK (change_category IN ('minor', 'structural')),
  triggered_regeneration BOOLEAN DEFAULT FALSE,
  
  -- Context
  program_version_before TEXT,
  program_version_after TEXT,
  
  -- Coaching message shown to user
  coaching_message TEXT,
  
  -- Timestamps
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for settings change log
CREATE INDEX IF NOT EXISTS idx_settings_change_log_athlete 
ON settings_change_log(athlete_id);

CREATE INDEX IF NOT EXISTS idx_settings_change_log_field 
ON settings_change_log(field_name);

-- =============================================================================
-- CONTINUITY PRESERVATION RULES
-- =============================================================================
-- This comment documents what should NEVER be deleted/reset on settings changes:
-- 
-- PRESERVED (Never Reset):
-- - skill_states table (SkillState data)
-- - skill_readiness table (readiness scores and history)
-- - workout_logs table (training history)
-- - strength_records table (PRs and benchmarks)
-- - fatigue_indicators table (recovery tracking)
-- - readiness_snapshots table (historical readiness)
--
-- UPDATED (May Change):
-- - program_versions (new version created, old superseded)
-- - session_adaptations (new adaptations added)
-- - athlete_profiles (settings fields updated)
--
-- This ensures that when an athlete changes settings:
-- - Their skill progress history remains intact
-- - Their workout history remains intact
-- - Their strength benchmarks remain intact
-- - Only future training changes, not past records

COMMENT ON TABLE session_adaptations IS 'Minor settings adaptations without full program regeneration';
COMMENT ON TABLE settings_change_log IS 'Audit log of all settings changes for continuity tracking';
