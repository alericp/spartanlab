-- Migration: Expand athlete_profiles table to match AthleteProfile model
-- This makes the database the single source of truth for all athlete training data
-- Date: 2026-03-15

-- =============================================================================
-- ADD PHYSICAL ATTRIBUTES
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS height NUMERIC,
ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'inches' CHECK (height_unit IN ('inches', 'cm')),
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
ADD COLUMN IF NOT EXISTS body_fat_percent NUMERIC,
ADD COLUMN IF NOT EXISTS body_fat_source TEXT CHECK (body_fat_source IN ('manual', 'calculator', 'unknown')),
ADD COLUMN IF NOT EXISTS training_experience TEXT CHECK (training_experience IN ('new', 'some', 'intermediate', 'advanced'));

-- =============================================================================
-- ADD GOAL FIELDS
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS goal_categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS secondary_goal TEXT,
ADD COLUMN IF NOT EXISTS selected_skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_flexibility JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_strength JSONB DEFAULT '[]'::jsonb;

-- =============================================================================
-- ADD STRENGTH BENCHMARKS
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS pull_up_max INTEGER,
ADD COLUMN IF NOT EXISTS push_up_max INTEGER,
ADD COLUMN IF NOT EXISTS dip_max INTEGER,
ADD COLUMN IF NOT EXISTS wall_hspu_reps INTEGER,
ADD COLUMN IF NOT EXISTS weighted_pull_up_load NUMERIC,
ADD COLUMN IF NOT EXISTS weighted_pull_up_unit TEXT CHECK (weighted_pull_up_unit IN ('lbs', 'kg')),
ADD COLUMN IF NOT EXISTS weighted_dip_load NUMERIC,
ADD COLUMN IF NOT EXISTS weighted_dip_unit TEXT CHECK (weighted_dip_unit IN ('lbs', 'kg'));

-- =============================================================================
-- ADD SKILL BENCHMARKS
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS front_lever_progression TEXT,
ADD COLUMN IF NOT EXISTS front_lever_hold_seconds INTEGER,
ADD COLUMN IF NOT EXISTS planche_progression TEXT,
ADD COLUMN IF NOT EXISTS planche_hold_seconds INTEGER,
ADD COLUMN IF NOT EXISTS muscle_up_readiness TEXT,
ADD COLUMN IF NOT EXISTS hspu_progression TEXT,
ADD COLUMN IF NOT EXISTS l_sit_hold_seconds INTEGER,
ADD COLUMN IF NOT EXISTS v_sit_hold_seconds INTEGER;

-- =============================================================================
-- ADD FLEXIBILITY BENCHMARKS
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS pancake_level TEXT,
ADD COLUMN IF NOT EXISTS pancake_range_intent TEXT,
ADD COLUMN IF NOT EXISTS toe_touch_level TEXT,
ADD COLUMN IF NOT EXISTS front_splits_level TEXT,
ADD COLUMN IF NOT EXISTS front_splits_range_intent TEXT,
ADD COLUMN IF NOT EXISTS side_splits_level TEXT,
ADD COLUMN IF NOT EXISTS side_splits_range_intent TEXT;

-- =============================================================================
-- ADD EQUIPMENT & SCHEDULE
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS session_length_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS session_style TEXT CHECK (session_style IN ('efficient', 'full'));

-- =============================================================================
-- ADD RECOVERY / LIFESTYLE
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS sleep_quality TEXT CHECK (sleep_quality IN ('good', 'normal', 'poor')),
ADD COLUMN IF NOT EXISTS energy_level TEXT CHECK (energy_level IN ('good', 'normal', 'poor')),
ADD COLUMN IF NOT EXISTS stress_level TEXT CHECK (stress_level IN ('good', 'normal', 'poor')),
ADD COLUMN IF NOT EXISTS recovery_confidence TEXT CHECK (recovery_confidence IN ('good', 'normal', 'poor'));

-- =============================================================================
-- ADD INJURY / CAUTION FLAGS
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS joint_cautions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS primary_limitation TEXT,
ADD COLUMN IF NOT EXISTS weakest_area TEXT;

-- =============================================================================
-- ADD RANGE/FLEXIBILITY INTENT
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS range_intent TEXT CHECK (range_intent IN ('deeper_range', 'stronger_control', 'both')),
ADD COLUMN IF NOT EXISTS range_training_mode TEXT CHECK (range_training_mode IN ('flexibility', 'mobility', 'hybrid'));

-- =============================================================================
-- ADD ONBOARDING META
-- =============================================================================

ALTER TABLE athlete_profiles
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS goal_category TEXT;

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_athlete_profiles_experience 
  ON athlete_profiles(experience_level);

CREATE INDEX IF NOT EXISTS idx_athlete_profiles_goal 
  ON athlete_profiles(primary_goal);

-- =============================================================================
-- ADD COMMENT FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE athlete_profiles IS 
'Single source of truth for all athlete training data. 
Populated by onboarding, read by program generation, 
editable via settings, used by adaptive engine.';
