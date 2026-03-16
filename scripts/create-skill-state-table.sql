-- SkillState Table
-- Persistent skill-specific state tracking for each athlete
-- This becomes the source of truth for skill-specific coaching decisions

CREATE TABLE IF NOT EXISTS skill_states (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL, -- front_lever, back_lever, planche, hspu, muscle_up, l_sit
  
  -- Current ability
  current_level INTEGER NOT NULL DEFAULT 0,
  current_best_metric NUMERIC DEFAULT 0, -- hold seconds, reps, or transition success
  metric_type TEXT DEFAULT 'hold_seconds', -- hold_seconds, reps, assisted_reps, transition_completion
  
  -- Historical peak (all-time best)
  highest_level INTEGER NOT NULL DEFAULT 0,
  highest_best_metric NUMERIC DEFAULT 0,
  highest_level_achieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Readiness and limitations
  readiness_score INTEGER DEFAULT 0, -- 0-100
  limiting_factor TEXT, -- pull_strength, compression, scapular_control, straight_arm, mobility, etc.
  limiting_factor_score INTEGER DEFAULT 0, -- The score of the limiting factor
  
  -- Next milestone tracking
  next_milestone TEXT, -- The next progression level name
  next_milestone_readiness INTEGER DEFAULT 0, -- 0-100 readiness for next milestone
  
  -- Training recency
  last_serious_training_at TIMESTAMP WITH TIME ZONE,
  total_training_sessions INTEGER DEFAULT 0,
  
  -- Notes and coaching context
  notes TEXT,
  coaching_context TEXT, -- e.g., "returning_from_break", "building_foundation", "approaching_milestone"
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, skill)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_skill_states_user_id ON skill_states(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_states_skill ON skill_states(skill);
CREATE INDEX IF NOT EXISTS idx_skill_states_user_skill ON skill_states(user_id, skill);

-- SkillState History Table (for tracking progression over time)
CREATE TABLE IF NOT EXISTS skill_state_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  current_level INTEGER NOT NULL,
  current_best_metric NUMERIC,
  readiness_score INTEGER,
  limiting_factor TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent multiple snapshots per day
  UNIQUE(user_id, skill, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_skill_state_history_user_id ON skill_state_history(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_state_history_user_skill ON skill_state_history(user_id, skill);
CREATE INDEX IF NOT EXISTS idx_skill_state_history_date ON skill_state_history(snapshot_date);
