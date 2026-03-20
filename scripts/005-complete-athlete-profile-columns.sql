-- Migration 005: Add missing athlete profile columns for onboarding persistence
-- This ensures the DB can store all onboarding selections canonically

-- Add schedule_mode column (flexible/static)
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS schedule_mode TEXT DEFAULT 'static';

-- Add session_length_minutes column
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS session_length_minutes INTEGER DEFAULT 60;

-- Add equipment_available column (JSON array)
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '[]'::jsonb;

-- Add joint_cautions column (JSON array)
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS joint_cautions JSONB DEFAULT '[]'::jsonb;

-- Add weakest_area column
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS weakest_area TEXT;

-- Add training_style column
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS training_style TEXT DEFAULT 'balanced_hybrid';

-- Add onboarding_complete column
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- Add sex column
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS sex TEXT;

-- Add height/weight columns if missing
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS height NUMERIC;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'inches';

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'lbs';

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS body_fat_percent NUMERIC;

-- Add unique constraint on user_id for upsert support
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'athlete_profiles_user_id_key'
    ) THEN
        ALTER TABLE athlete_profiles ADD CONSTRAINT athlete_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON athlete_profiles(user_id);
