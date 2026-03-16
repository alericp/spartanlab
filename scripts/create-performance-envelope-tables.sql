-- Performance Envelope Tables
-- Stores learned athlete response patterns for individualized programming

-- Main performance envelope table
CREATE TABLE IF NOT EXISTS performance_envelopes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  movement_family TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'strength',
  
  -- Preferred ranges (learned from athlete responses)
  preferred_rep_range_min INTEGER DEFAULT 3,
  preferred_rep_range_max INTEGER DEFAULT 8,
  preferred_set_range_min INTEGER DEFAULT 3,
  preferred_set_range_max INTEGER DEFAULT 5,
  preferred_weekly_volume_min INTEGER DEFAULT 6,
  preferred_weekly_volume_max INTEGER DEFAULT 12,
  
  -- Density and fatigue characteristics
  preferred_density_level TEXT DEFAULT 'moderate_density',
  fatigue_threshold INTEGER DEFAULT 70,
  
  -- Performance tracking
  performance_trend TEXT DEFAULT 'stable',
  response_quality TEXT DEFAULT 'neutral',
  
  -- Confidence in the envelope estimate
  confidence_score INTEGER DEFAULT 20,
  data_points_count INTEGER DEFAULT 0,
  
  -- Learning signals
  positive_responses INTEGER DEFAULT 0,
  negative_responses INTEGER DEFAULT 0,
  stagnation_count INTEGER DEFAULT 0,
  regression_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, movement_family, goal_type)
);

-- Performance envelope snapshots for historical tracking
CREATE TABLE IF NOT EXISTS performance_envelope_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  movement_family TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  
  -- Snapshot of envelope state
  rep_range_min INTEGER,
  rep_range_max INTEGER,
  weekly_volume_min INTEGER,
  weekly_volume_max INTEGER,
  density_level TEXT,
  fatigue_threshold INTEGER,
  confidence_score INTEGER,
  performance_trend TEXT,
  
  -- Context at time of snapshot
  trigger_event TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training response signals table (raw input data for learning)
CREATE TABLE IF NOT EXISTS training_response_signals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  -- Exercise/session context
  movement_family TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  exercise_name TEXT,
  session_date DATE NOT NULL,
  
  -- What was prescribed
  prescribed_sets INTEGER,
  prescribed_reps INTEGER,
  prescribed_rest_seconds INTEGER,
  
  -- What actually happened
  actual_sets INTEGER,
  actual_reps INTEGER,
  actual_weight NUMERIC,
  actual_hold_seconds NUMERIC,
  
  -- Response signals
  perceived_difficulty TEXT,
  was_completed BOOLEAN DEFAULT true,
  was_skipped BOOLEAN DEFAULT false,
  performance_vs_previous TEXT,
  
  -- Fatigue context
  pre_session_fatigue INTEGER,
  post_session_fatigue INTEGER,
  session_truncated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_performance_envelopes_user_id ON performance_envelopes(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_envelopes_movement ON performance_envelopes(user_id, movement_family);
CREATE INDEX IF NOT EXISTS idx_envelope_snapshots_user_id ON performance_envelope_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_envelope_snapshots_date ON performance_envelope_snapshots(created_at);
CREATE INDEX IF NOT EXISTS idx_training_signals_user_id ON training_response_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_training_signals_date ON training_response_signals(session_date);
CREATE INDEX IF NOT EXISTS idx_training_signals_movement ON training_response_signals(user_id, movement_family);
