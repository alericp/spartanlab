-- =============================================================================
-- BENCHMARK TRACKING SCHEMA
-- =============================================================================
-- Stores athlete performance benchmarks for baseline and progress testing
-- Tracks historical performance to detect progress and plateaus

-- Main benchmarks table
CREATE TABLE IF NOT EXISTS benchmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Movement classification
  movement_family TEXT NOT NULL, -- vertical_pull, horizontal_pull, vertical_push, dip_pattern, straight_arm_pull, compression_core, explosive_pull
  test_name TEXT NOT NULL, -- max_pull_ups, max_dips, weighted_pull_1rm, l_sit_hold, etc.
  test_category TEXT NOT NULL, -- strength, skill, endurance, flexibility
  
  -- Test results
  test_value NUMERIC NOT NULL, -- The measured value (reps, seconds, weight)
  test_unit TEXT NOT NULL, -- reps, seconds, kg, lbs, progression_level
  
  -- Context
  bodyweight_at_test NUMERIC, -- Bodyweight when test was taken (for relative strength)
  test_conditions TEXT, -- fresh, fatigued, post_workout, etc.
  
  -- Confidence and quality
  confidence_score INTEGER DEFAULT 80, -- 0-100, how confident we are in this value
  data_quality TEXT DEFAULT 'self_reported', -- self_reported, video_verified, coached
  
  -- Previous comparison
  previous_value NUMERIC, -- Last benchmark value for comparison
  previous_test_date TIMESTAMP WITH TIME ZONE,
  change_percent NUMERIC, -- Percentage change from previous
  
  -- Triggers and flags
  is_baseline BOOLEAN DEFAULT FALSE, -- Is this the initial baseline test?
  triggered_recalibration BOOLEAN DEFAULT FALSE, -- Did this trigger skill readiness recalibration?
  plateau_detected BOOLEAN DEFAULT FALSE, -- Has a plateau been detected?
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  test_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_benchmarks_user_id ON benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_movement_family ON benchmarks(movement_family);
CREATE INDEX IF NOT EXISTS idx_benchmarks_test_name ON benchmarks(test_name);
CREATE INDEX IF NOT EXISTS idx_benchmarks_test_date ON benchmarks(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_user_movement ON benchmarks(user_id, movement_family);

-- Progress test recommendations table
-- Tracks when athletes should retest and what tests to prioritize
CREATE TABLE IF NOT EXISTS benchmark_test_recommendations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Test details
  test_name TEXT NOT NULL,
  movement_family TEXT NOT NULL,
  
  -- Recommendation context
  recommendation_reason TEXT NOT NULL, -- scheduled, plateau_detected, progress_suspected, user_requested
  priority TEXT DEFAULT 'normal', -- low, normal, high
  
  -- Timing
  recommended_date TIMESTAMP WITH TIME ZONE,
  last_test_date TIMESTAMP WITH TIME ZONE,
  days_since_last_test INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, completed, skipped, deferred
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_recommendations_user ON benchmark_test_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_recommendations_status ON benchmark_test_recommendations(status);

-- Plateau detection tracking
CREATE TABLE IF NOT EXISTS plateau_detections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- What plateaued
  movement_family TEXT NOT NULL,
  test_name TEXT,
  skill_affected TEXT, -- front_lever, planche, etc.
  
  -- Plateau metrics
  plateau_duration_weeks INTEGER, -- How long the plateau has lasted
  benchmark_value_at_detection NUMERIC,
  benchmark_variance NUMERIC, -- How much values varied during plateau
  
  -- Detection confidence
  confidence_score INTEGER DEFAULT 70, -- 0-100
  
  -- Response
  intervention_recommended TEXT, -- framework_change, volume_increase, deload, etc.
  intervention_applied BOOLEAN DEFAULT FALSE,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_method TEXT,
  post_resolution_value NUMERIC,
  
  -- Timestamps
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plateau_user ON plateau_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_plateau_movement ON plateau_detections(movement_family);
CREATE INDEX IF NOT EXISTS idx_plateau_unresolved ON plateau_detections(user_id) WHERE resolved_at IS NULL;
