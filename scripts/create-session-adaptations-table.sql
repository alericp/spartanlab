-- Session Adaptations Table
-- Records minor settings changes that affect future sessions without requiring a new program version
-- These adaptations modify session generation behavior within the current active program

-- Check if table already exists before creating
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session_adaptations') THEN
    
    CREATE TABLE session_adaptations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      athlete_id TEXT NOT NULL,
      program_version_id UUID NOT NULL REFERENCES program_versions(id) ON DELETE CASCADE,
      
      -- Adaptation details
      adaptation_type TEXT NOT NULL CHECK (adaptation_type IN ('pacing', 'emphasis', 'intensity', 'substitution')),
      description TEXT NOT NULL,
      
      -- Timing
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent until program version changes
      
      -- Metadata
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for efficient querying
    CREATE INDEX idx_session_adaptations_athlete ON session_adaptations(athlete_id);
    CREATE INDEX idx_session_adaptations_version ON session_adaptations(program_version_id);
    CREATE INDEX idx_session_adaptations_active ON session_adaptations(athlete_id, program_version_id, expires_at);

    RAISE NOTICE 'Created session_adaptations table successfully';
  ELSE
    RAISE NOTICE 'session_adaptations table already exists, skipping creation';
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE session_adaptations IS 'Records minor settings changes that affect future sessions without new program version';
COMMENT ON COLUMN session_adaptations.adaptation_type IS 'Type of adaptation: pacing, emphasis, intensity, or substitution';
COMMENT ON COLUMN session_adaptations.expires_at IS 'When adaptation expires (NULL = permanent until program changes)';
