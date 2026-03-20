-- Migration 010: Add canonical benchmark columns to athlete_profiles
-- =============================================================================
-- REGRESSION GUARD: This migration adds all benchmark fields needed for
-- program generation to work from canonical truth stored in the database.
-- =============================================================================

-- STRENGTH BENCHMARKS (current)
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS pull_up_max TEXT;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS dip_max TEXT;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS push_up_max TEXT;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS wall_hspu_reps TEXT;

-- Weighted benchmarks stored as JSONB: { addedWeight, reps, unit }
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS weighted_pull_up JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS weighted_dip JSONB;

-- STRENGTH BENCHMARKS (all-time PR for rebound potential)
-- Stored as JSONB: { load, reps, timeframe, unit }
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS all_time_pr_pull_up JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS all_time_pr_dip JSONB;

-- SKILL BENCHMARKS (stored as JSONB for nested structure)
-- { progression, holdSeconds, isAssisted, bandLevel, highestLevelEverReached }
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS front_lever JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS planche JSONB;

-- Simple TEXT fields for these skills
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS muscle_up TEXT;

-- HSPU stored as JSONB: { progression }
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS hspu JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS l_sit_hold TEXT;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS v_sit_hold TEXT;

-- FLEXIBILITY BENCHMARKS (stored as JSONB for nested structure)
-- { level, rangeIntent }
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS pancake JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS toe_touch JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS front_splits JSONB;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS side_splits JSONB;

-- GOAL CATEGORIES (expanded selection from onboarding)
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS goal_categories JSONB DEFAULT '[]'::jsonb;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS training_path_type TEXT;

ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS primary_training_outcome TEXT;

-- Create indexes for frequently queried benchmark fields
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_pull_up_max ON athlete_profiles(pull_up_max);
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_dip_max ON athlete_profiles(dip_max);
