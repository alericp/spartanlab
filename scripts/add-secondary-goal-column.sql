-- Migration: Add secondary_goal column to athlete_profiles
-- This column stores the canonical secondary goal from onboarding
-- TASK 3: Ensures secondaryGoal is truly persisted, not just derived at runtime

-- Add secondary_goal column if it doesn't exist
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS secondary_goal text;

-- Add selected_skills column for storing full skill selection array
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS selected_skills jsonb DEFAULT '[]'::jsonb;

-- Add selected_flexibility column
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS selected_flexibility jsonb DEFAULT '[]'::jsonb;

-- Add selected_strength column  
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS selected_strength jsonb DEFAULT '[]'::jsonb;

-- Add goal_category column (skills, flexibility, strength)
ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS goal_category text;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'athlete_profiles' 
AND column_name IN ('secondary_goal', 'selected_skills', 'selected_flexibility', 'selected_strength', 'goal_category');
