-- Settings Regeneration Schema Updates
-- Adds columns needed for intelligent settings-based program regeneration

-- =============================================================================
-- UPDATE PROGRAM_VERSIONS TABLE
-- =============================================================================

-- Add active_flag column for explicit active version tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' AND column_name = 'active_flag'
  ) THEN
    ALTER TABLE program_versions ADD COLUMN active_flag BOOLEAN DEFAULT false;
    
    -- Set active_flag = true for existing active versions
    UPDATE program_versions SET active_flag = true WHERE status = 'active';
    
    -- Create index for fast active version lookups
    CREATE INDEX IF NOT EXISTS idx_program_versions_active_flag 
    ON program_versions(user_id, active_flag) WHERE active_flag = true;
    
    RAISE NOTICE 'Added active_flag column to program_versions';
  ELSE
    RAISE NOTICE 'active_flag column already exists';
  END IF;
END $$;

-- Add program_summary JSONB column for structured program metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' AND column_name = 'program_summary'
  ) THEN
    ALTER TABLE program_versions ADD COLUMN program_summary JSONB DEFAULT '{}';
    
    -- Migrate existing data into program_summary
    UPDATE program_versions 
    SET program_summary = jsonb_build_object(
      'primaryGoal', COALESCE(primary_goal, 'general_fitness'),
      'trainingDaysPerWeek', COALESCE(training_days_per_week, 4),
      'sessionDurationMinutes', COALESCE(session_length_minutes, 60),
      'styleMode', 'balanced_hybrid',
      'constraintFocus', focus_summary,
      'equipment', COALESCE(equipment_summary, ARRAY[]::TEXT[]),
      'generatedAt', created_at
    )
    WHERE program_summary IS NULL OR program_summary = '{}';
    
    RAISE NOTICE 'Added program_summary column to program_versions';
  ELSE
    RAISE NOTICE 'program_summary column already exists';
  END IF;
END $$;

-- Add athlete_id column (alias for user_id, for consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE program_versions ADD COLUMN athlete_id TEXT;
    
    -- Copy user_id values to athlete_id
    UPDATE program_versions SET athlete_id = user_id WHERE athlete_id IS NULL;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_program_versions_athlete_id 
    ON program_versions(athlete_id);
    
    RAISE NOTICE 'Added athlete_id column to program_versions';
  ELSE
    RAISE NOTICE 'athlete_id column already exists';
  END IF;
END $$;

-- =============================================================================
-- UPDATE PROGRAM_INPUT_SNAPSHOTS TABLE  
-- =============================================================================

-- Add style_snapshot column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' AND column_name = 'style_snapshot'
  ) THEN
    ALTER TABLE program_input_snapshots ADD COLUMN style_snapshot JSONB DEFAULT '{}';
    RAISE NOTICE 'Added style_snapshot column to program_input_snapshots';
  ELSE
    RAISE NOTICE 'style_snapshot column already exists';
  END IF;
END $$;

-- Add athlete_id column to program_input_snapshots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE program_input_snapshots ADD COLUMN athlete_id TEXT;
    
    -- Copy user_id values
    UPDATE program_input_snapshots SET athlete_id = user_id WHERE athlete_id IS NULL;
    
    CREATE INDEX IF NOT EXISTS idx_program_input_snapshots_athlete_id 
    ON program_input_snapshots(athlete_id);
    
    RAISE NOTICE 'Added athlete_id column to program_input_snapshots';
  ELSE
    RAISE NOTICE 'athlete_id column already exists';
  END IF;
END $$;

-- =============================================================================
-- ENSURE SESSION_ADAPTATIONS TABLE EXISTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS session_adaptations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id TEXT NOT NULL,
  program_version_id TEXT NOT NULL,
  
  -- Adaptation details
  adaptation_type TEXT NOT NULL CHECK (adaptation_type IN ('pacing', 'emphasis', 'intensity', 'substitution')),
  description TEXT NOT NULL,
  
  -- Timing
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_session_adaptations_athlete ON session_adaptations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_session_adaptations_version ON session_adaptations(program_version_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN program_versions.active_flag IS 'Explicit active version flag - only one should be true per athlete';
COMMENT ON COLUMN program_versions.program_summary IS 'JSON summary of program configuration for quick access';
COMMENT ON TABLE session_adaptations IS 'Records minor settings changes that affect sessions without new version';
