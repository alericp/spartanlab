-- =============================================================================
-- SpartanLab Adaptive Athlete Engine - Complete Schema Migration
-- =============================================================================
-- This migration formalizes the database schema to support the full coaching engine
-- Including: SkillState, Performance Envelopes, Training Style, Program Versioning,
-- Adaptation Events, Joint Protocols, and enhanced Workout Logs
-- 
-- SAFETY: All operations use IF NOT EXISTS / IF EXISTS to be idempotent
-- =============================================================================

-- =============================================================================
-- SECTION 1: EXPAND ATHLETE PROFILES (if not already expanded)
-- =============================================================================

-- Physical attributes
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'inches' CHECK (height_unit IN ('inches', 'cm'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS body_fat_percent NUMERIC;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS body_fat_source TEXT CHECK (body_fat_source IN ('manual', 'calculator', 'unknown'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS training_experience TEXT CHECK (training_experience IN ('new', 'some', 'intermediate', 'advanced'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS training_age_months INTEGER DEFAULT 0;

-- Goals
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS goal_categories JSONB DEFAULT '[]'::jsonb;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS secondary_goal TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS selected_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS selected_flexibility JSONB DEFAULT '[]'::jsonb;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS selected_strength JSONB DEFAULT '[]'::jsonb;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS goal_category TEXT;

-- Strength benchmarks
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS pull_up_max INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS push_up_max INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS dip_max INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS wall_hspu_reps INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weighted_pull_up_load NUMERIC;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weighted_pull_up_unit TEXT CHECK (weighted_pull_up_unit IN ('lbs', 'kg'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weighted_dip_load NUMERIC;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weighted_dip_unit TEXT CHECK (weighted_dip_unit IN ('lbs', 'kg'));

-- Skill benchmarks
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS front_lever_progression TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS front_lever_hold_seconds INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS back_lever_progression TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS back_lever_hold_seconds INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS planche_progression TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS planche_hold_seconds INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS muscle_up_readiness TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS hspu_progression TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS l_sit_hold_seconds INTEGER;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS v_sit_hold_seconds INTEGER;

-- Equipment and schedule
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS equipment_available JSONB DEFAULT '[]'::jsonb;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS session_length_minutes INTEGER DEFAULT 60;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS session_style TEXT CHECK (session_style IN ('efficient', 'full'));

-- Recovery/lifestyle
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS sleep_quality TEXT CHECK (sleep_quality IN ('good', 'normal', 'poor'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS energy_level TEXT CHECK (energy_level IN ('good', 'normal', 'poor'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS stress_level TEXT CHECK (stress_level IN ('good', 'normal', 'poor'));
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS recovery_confidence TEXT CHECK (recovery_confidence IN ('good', 'normal', 'poor'));

-- Joint cautions
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS joint_cautions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS primary_limitation TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS weakest_area TEXT;

-- Flexibility benchmarks
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS pancake_level TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS toe_touch_level TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS front_splits_level TEXT;
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS side_splits_level TEXT;

-- Meta
ALTER TABLE athlete_profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;

-- =============================================================================
-- SECTION 2: SKILL STATE TABLE (Source of truth for skill-specific coaching)
-- =============================================================================

CREATE TABLE IF NOT EXISTS skill_states (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up', 'l_sit')),
  
  -- Current ability
  current_level INTEGER NOT NULL DEFAULT 0,
  current_best_metric NUMERIC DEFAULT 0,
  metric_type TEXT DEFAULT 'hold_seconds' CHECK (metric_type IN ('hold_seconds', 'reps', 'assisted_reps', 'transition_completion')),
  
  -- Historical peak
  highest_level INTEGER NOT NULL DEFAULT 0,
  highest_best_metric NUMERIC DEFAULT 0,
  highest_level_achieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Readiness and limitations
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  limiting_factor TEXT,
  limiting_factor_score INTEGER DEFAULT 0,
  
  -- Next milestone
  next_milestone TEXT,
  next_milestone_readiness INTEGER DEFAULT 0 CHECK (next_milestone_readiness >= 0 AND next_milestone_readiness <= 100),
  
  -- Training recency
  last_serious_training_at TIMESTAMP WITH TIME ZONE,
  total_training_sessions INTEGER DEFAULT 0,
  
  -- Coaching context
  notes TEXT,
  coaching_context TEXT CHECK (coaching_context IN ('returning_from_break', 'building_foundation', 'approaching_milestone', 'at_plateau', 'progressing_steadily', 'new_skill')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, skill)
);

CREATE INDEX IF NOT EXISTS idx_skill_states_user_id ON skill_states(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_states_skill ON skill_states(skill);

-- Skill state history for progress tracking
CREATE TABLE IF NOT EXISTS skill_state_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  current_level INTEGER NOT NULL,
  current_best_metric NUMERIC,
  readiness_score INTEGER,
  limiting_factor TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, skill, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_skill_state_history_user ON skill_state_history(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_state_history_date ON skill_state_history(snapshot_date);

-- =============================================================================
-- SECTION 3: PERFORMANCE ENVELOPE (Learned athlete response patterns)
-- =============================================================================

CREATE TABLE IF NOT EXISTS performance_envelopes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  movement_family TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'strength' CHECK (goal_type IN ('strength', 'skill', 'endurance', 'hypertrophy', 'power')),
  
  -- Learned preferences
  preferred_rep_range_min INTEGER DEFAULT 3,
  preferred_rep_range_max INTEGER DEFAULT 8,
  preferred_set_range_min INTEGER DEFAULT 3,
  preferred_set_range_max INTEGER DEFAULT 5,
  preferred_weekly_volume_min INTEGER DEFAULT 6,
  preferred_weekly_volume_max INTEGER DEFAULT 12,
  
  -- Density and fatigue
  preferred_density_level TEXT DEFAULT 'moderate_density' CHECK (preferred_density_level IN ('low_density', 'moderate_density', 'high_density')),
  fatigue_threshold INTEGER DEFAULT 70 CHECK (fatigue_threshold >= 0 AND fatigue_threshold <= 100),
  
  -- Performance tracking
  performance_trend TEXT DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining', 'recovering')),
  response_quality TEXT DEFAULT 'neutral' CHECK (response_quality IN ('excellent', 'good', 'neutral', 'poor')),
  
  -- Confidence
  confidence_score INTEGER DEFAULT 20 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_points_count INTEGER DEFAULT 0,
  
  -- Learning signals
  positive_responses INTEGER DEFAULT 0,
  negative_responses INTEGER DEFAULT 0,
  stagnation_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, movement_family, goal_type)
);

CREATE INDEX IF NOT EXISTS idx_performance_envelopes_user ON performance_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_envelopes_movement ON performance_envelopes(user_id, movement_family);

-- Training response signals (raw input for learning)
CREATE TABLE IF NOT EXISTS training_response_signals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  movement_family TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  exercise_name TEXT,
  session_date DATE NOT NULL,
  
  -- Prescribed vs actual
  prescribed_sets INTEGER,
  prescribed_reps INTEGER,
  actual_sets INTEGER,
  actual_reps INTEGER,
  actual_weight NUMERIC,
  actual_hold_seconds NUMERIC,
  
  -- Response signals
  perceived_difficulty TEXT CHECK (perceived_difficulty IN ('easy', 'moderate', 'hard', 'very_hard')),
  was_completed BOOLEAN DEFAULT true,
  was_skipped BOOLEAN DEFAULT false,
  performance_vs_previous TEXT CHECK (performance_vs_previous IN ('better', 'same', 'worse')),
  
  -- Fatigue context
  session_truncated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_signals_user ON training_response_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_training_signals_date ON training_response_signals(session_date);

-- =============================================================================
-- SECTION 4: TRAINING STYLE PROFILE
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_style_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL UNIQUE,
  
  style_mode TEXT NOT NULL DEFAULT 'balanced_hybrid' CHECK (style_mode IN (
    'skill_focused', 'strength_focused', 'power_focused', 
    'endurance_focused', 'hypertrophy_supported', 'balanced_hybrid'
  )),
  
  -- Priority weights (0-100)
  skill_priority INTEGER NOT NULL DEFAULT 25 CHECK (skill_priority >= 0 AND skill_priority <= 100),
  strength_priority INTEGER NOT NULL DEFAULT 25 CHECK (strength_priority >= 0 AND strength_priority <= 100),
  power_priority INTEGER NOT NULL DEFAULT 10 CHECK (power_priority >= 0 AND power_priority <= 100),
  endurance_priority INTEGER NOT NULL DEFAULT 20 CHECK (endurance_priority >= 0 AND endurance_priority <= 100),
  hypertrophy_priority INTEGER NOT NULL DEFAULT 20 CHECK (hypertrophy_priority >= 0 AND hypertrophy_priority <= 100),
  
  -- Additional preferences
  density_tolerance TEXT DEFAULT 'moderate' CHECK (density_tolerance IN ('low', 'moderate', 'high')),
  rest_preference TEXT DEFAULT 'balanced' CHECK (rest_preference IN ('minimal', 'balanced', 'extended')),
  technique_emphasis TEXT DEFAULT 'moderate' CHECK (technique_emphasis IN ('low', 'moderate', 'high')),
  
  source TEXT DEFAULT 'derived' CHECK (source IN ('onboarding', 'manual', 'derived', 'adaptive')),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_style_user ON training_style_profiles(user_id);

-- =============================================================================
-- SECTION 5: PROGRAM VERSIONING
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded', 'pending')),
  
  generation_reason TEXT NOT NULL DEFAULT 'onboarding_initial_generation' CHECK (generation_reason IN (
    'onboarding_initial_generation', 'settings_schedule_change', 'settings_equipment_change',
    'settings_goal_change', 'fatigue_deload', 'skill_priority_update', 'benchmark_update',
    'adaptive_rebalance', 'joint_caution_change', 'manual_regeneration', 'comeback_adjustment'
  )),
  source_snapshot_id TEXT,
  
  -- Program summary
  primary_goal TEXT,
  training_days_per_week INTEGER,
  session_length_minutes INTEGER,
  equipment_summary TEXT[],
  focus_summary TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  superseded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_program_versions_user ON program_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_program_versions_active ON program_versions(user_id, status) WHERE status = 'active';

-- Program input snapshots
CREATE TABLE IF NOT EXISTS program_input_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  athlete_profile_snapshot JSONB NOT NULL DEFAULT '{}',
  skill_state_snapshot JSONB DEFAULT '{}',
  readiness_snapshot JSONB DEFAULT '{}',
  constraint_snapshot JSONB DEFAULT '{}',
  fatigue_snapshot JSONB DEFAULT '{}',
  style_snapshot JSONB DEFAULT '{}',
  equipment_snapshot TEXT[] DEFAULT '{}',
  training_days_snapshot INTEGER,
  session_length_snapshot INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_snapshots_user ON program_input_snapshots(user_id);

-- =============================================================================
-- SECTION 6: TRAINING ADAPTATION EVENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_adaptation_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'exercise_replaced', 'exercise_skipped', 'progression_lowered', 'progression_raised',
    'workout_shortened', 'plan_regenerated', 'deload_triggered', 'fatigue_spike',
    'benchmark_improved', 'milestone_achieved', 'joint_protocol_recommended'
  )),
  
  -- Context
  movement_family TEXT,
  skill TEXT,
  exercise_name TEXT,
  session_id TEXT,
  
  -- Details
  context JSONB DEFAULT '{}',
  reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptation_events_user ON training_adaptation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptation_events_type ON training_adaptation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_adaptation_events_date ON training_adaptation_events(created_at);

-- =============================================================================
-- SECTION 7: JOINT INTEGRITY PROTOCOLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS joint_protocols (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  protocol_id TEXT NOT NULL UNIQUE,
  joint_region TEXT NOT NULL CHECK (joint_region IN ('wrist', 'elbow', 'shoulder', 'scapula', 'hip', 'knee', 'ankle', 'spine')),
  protocol_name TEXT NOT NULL,
  
  -- Content
  purpose TEXT NOT NULL,
  duration_estimate_minutes INTEGER DEFAULT 10,
  recommended_frequency TEXT DEFAULT 'daily',
  exercise_list JSONB DEFAULT '[]',
  
  -- Skill relevance
  skill_relevance TEXT[] DEFAULT '{}',
  prerequisite_for TEXT[] DEFAULT '{}',
  
  -- SEO
  seo_slug TEXT UNIQUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_joint_protocols_region ON joint_protocols(joint_region);
CREATE INDEX IF NOT EXISTS idx_joint_protocols_slug ON joint_protocols(seo_slug);

-- =============================================================================
-- SECTION 8: ENHANCE WORKOUT LOGS
-- =============================================================================

-- Add columns for adaptive engine support
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS program_version_id TEXT;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS difficulty_rating TEXT CHECK (difficulty_rating IN ('easy', 'moderate', 'hard', 'very_hard'));
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS time_compressed BOOLEAN DEFAULT false;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS skipped_exercises JSONB DEFAULT '[]';
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS replaced_exercises JSONB DEFAULT '[]';
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS progression_adjustments JSONB DEFAULT '[]';
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT true;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS fatigue_pre INTEGER CHECK (fatigue_pre >= 0 AND fatigue_pre <= 10);
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS fatigue_post INTEGER CHECK (fatigue_post >= 0 AND fatigue_post <= 10);

-- =============================================================================
-- SECTION 9: EXERCISE METADATA (Lightweight registry support)
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercise_metadata (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  exercise_id TEXT NOT NULL UNIQUE,
  exercise_name TEXT NOT NULL,
  
  -- Classification
  primary_family TEXT NOT NULL,
  secondary_families TEXT[] DEFAULT '{}',
  intent_tags TEXT[] DEFAULT '{}',
  equipment_tags TEXT[] DEFAULT '{}',
  skill_carryover TEXT[] DEFAULT '{}',
  
  -- Difficulty
  difficulty_band TEXT DEFAULT 'intermediate' CHECK (difficulty_band IN ('beginner', 'intermediate', 'advanced', 'elite')),
  progression_stage INTEGER DEFAULT 0,
  
  -- Load characteristics
  fatigue_cost TEXT DEFAULT 'moderate' CHECK (fatigue_cost IN ('low', 'moderate', 'high', 'very_high')),
  neural_demand TEXT DEFAULT 'moderate' CHECK (neural_demand IN ('low', 'moderate', 'high')),
  joint_stress TEXT DEFAULT 'moderate' CHECK (joint_stress IN ('low', 'moderate', 'high')),
  
  -- Session placement
  placement_tier INTEGER DEFAULT 2 CHECK (placement_tier >= 1 AND placement_tier <= 3),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_metadata_id ON exercise_metadata(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_metadata_family ON exercise_metadata(primary_family);

-- =============================================================================
-- SECTION 10: SCHEMA DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE athlete_profiles IS 'Root athlete model - stable preferences, benchmarks, and configuration';
COMMENT ON TABLE skill_states IS 'Skill-specific coaching state - progression, readiness, and limitations per skill';
COMMENT ON TABLE performance_envelopes IS 'Learned athlete response patterns by movement family and goal type';
COMMENT ON TABLE training_style_profiles IS 'Training style weighting - skill/strength/power/endurance/hypertrophy priorities';
COMMENT ON TABLE program_versions IS 'Versioned training programs with generation tracking and continuity';
COMMENT ON TABLE program_input_snapshots IS 'Captured inputs at program generation for reproducibility';
COMMENT ON TABLE training_adaptation_events IS 'Adaptation signals for engine learning and debugging';
COMMENT ON TABLE joint_protocols IS 'Joint Integrity Protocol registry for warm-ups and prehab';
COMMENT ON TABLE exercise_metadata IS 'Lightweight exercise classification registry';
COMMENT ON TABLE workout_logs IS 'Workout completion logs with adaptive feedback signals';
COMMENT ON TABLE training_response_signals IS 'Raw training response data for performance envelope learning';
