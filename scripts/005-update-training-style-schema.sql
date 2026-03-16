-- Update Training Style Profile Schema
-- Adds missing columns to align with training-style-service.ts

-- Add new boolean preference columns if they don't exist
DO $$
BEGIN
  -- Add prefer_high_frequency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'prefer_high_frequency'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN prefer_high_frequency BOOLEAN DEFAULT false;
  END IF;
  
  -- Add prefer_heavy_loading column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'prefer_heavy_loading'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN prefer_heavy_loading BOOLEAN DEFAULT false;
  END IF;
  
  -- Add prefer_explosive_work column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'prefer_explosive_work'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN prefer_explosive_work BOOLEAN DEFAULT false;
  END IF;
  
  -- Add prefer_density_work column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'prefer_density_work'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN prefer_density_work BOOLEAN DEFAULT false;
  END IF;
  
  -- Add include_hypertrophy_support column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'include_hypertrophy_support'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN include_hypertrophy_support BOOLEAN DEFAULT true;
  END IF;
  
  -- Add preferred_rep_range_min column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'preferred_rep_range_min'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN preferred_rep_range_min INTEGER DEFAULT 6;
  END IF;
  
  -- Add preferred_rep_range_max column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'preferred_rep_range_max'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN preferred_rep_range_max INTEGER DEFAULT 12;
  END IF;
  
  -- Add preferred_rest_seconds column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'preferred_rest_seconds'
  ) THEN
    ALTER TABLE training_style_profiles 
    ADD COLUMN preferred_rest_seconds INTEGER DEFAULT 90;
  END IF;
  
END $$;

-- Add athlete_id alias if user_id is the column name
-- (service uses athlete_id but table has user_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_style_profiles' 
    AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE training_style_profiles 
    RENAME COLUMN user_id TO athlete_id;
  END IF;
END $$;

-- Update program_versions table to add missing columns
DO $$
BEGIN
  -- Add active_flag column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' 
    AND column_name = 'active_flag'
  ) THEN
    ALTER TABLE program_versions 
    ADD COLUMN active_flag BOOLEAN DEFAULT false;
    
    -- Set active_flag based on status
    UPDATE program_versions 
    SET active_flag = (status = 'active');
  END IF;
  
  -- Add program_summary JSONB column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' 
    AND column_name = 'program_summary'
  ) THEN
    ALTER TABLE program_versions 
    ADD COLUMN program_summary JSONB DEFAULT '{}';
    
    -- Migrate existing data to JSON format
    UPDATE program_versions 
    SET program_summary = jsonb_build_object(
      'primaryGoal', primary_goal,
      'trainingDaysPerWeek', training_days_per_week,
      'sessionDurationMinutes', session_length_minutes,
      'equipment', COALESCE(equipment_summary, ARRAY[]::TEXT[]),
      'styleMode', 'balanced_hybrid',
      'constraintFocus', focus_summary,
      'generatedAt', created_at
    )
    WHERE program_summary = '{}' OR program_summary IS NULL;
  END IF;
  
  -- Rename user_id to athlete_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_versions' 
    AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE program_versions 
    RENAME COLUMN user_id TO athlete_id;
  END IF;
END $$;

-- Update program_input_snapshots table
DO $$
BEGIN
  -- Add style_snapshot column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' 
    AND column_name = 'style_snapshot'
  ) THEN
    ALTER TABLE program_input_snapshots 
    ADD COLUMN style_snapshot JSONB DEFAULT '{}';
  END IF;
  
  -- Rename user_id to athlete_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' 
    AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'program_input_snapshots' 
    AND column_name = 'athlete_id'
  ) THEN
    ALTER TABLE program_input_snapshots 
    RENAME COLUMN user_id TO athlete_id;
  END IF;
END $$;

-- Create index for active_flag lookups
CREATE INDEX IF NOT EXISTS idx_program_versions_active_flag 
ON program_versions(athlete_id) WHERE active_flag = true;
