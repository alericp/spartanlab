-- Training Style Profile Tables
-- Stores athlete training style preferences and priority weighting

-- Training Style Profile Table
CREATE TABLE IF NOT EXISTS training_style_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Style mode (primary training approach)
  style_mode TEXT NOT NULL DEFAULT 'balanced_hybrid',
  
  -- Priority weights (0-100 scale, should sum to ~100 for normalization)
  skill_priority INTEGER NOT NULL DEFAULT 25,
  strength_priority INTEGER NOT NULL DEFAULT 25,
  power_priority INTEGER NOT NULL DEFAULT 10,
  endurance_priority INTEGER NOT NULL DEFAULT 20,
  hypertrophy_priority INTEGER NOT NULL DEFAULT 20,
  
  -- Additional style preferences
  density_tolerance TEXT DEFAULT 'moderate', -- low, moderate, high
  rest_preference TEXT DEFAULT 'balanced', -- minimal, balanced, extended
  technique_emphasis TEXT DEFAULT 'moderate', -- low, moderate, high
  
  -- Source tracking
  source TEXT DEFAULT 'derived', -- onboarding, manual, derived, adaptive
  confidence_score INTEGER DEFAULT 50, -- 0-100
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_style_mode CHECK (style_mode IN (
    'skill_focused',
    'strength_focused', 
    'power_focused',
    'endurance_focused',
    'hypertrophy_supported',
    'balanced_hybrid'
  )),
  CONSTRAINT valid_density CHECK (density_tolerance IN ('low', 'moderate', 'high')),
  CONSTRAINT valid_rest CHECK (rest_preference IN ('minimal', 'balanced', 'extended')),
  CONSTRAINT valid_technique CHECK (technique_emphasis IN ('low', 'moderate', 'high')),
  CONSTRAINT valid_source CHECK (source IN ('onboarding', 'manual', 'derived', 'adaptive')),
  CONSTRAINT valid_priorities CHECK (
    skill_priority >= 0 AND skill_priority <= 100 AND
    strength_priority >= 0 AND strength_priority <= 100 AND
    power_priority >= 0 AND power_priority <= 100 AND
    endurance_priority >= 0 AND endurance_priority <= 100 AND
    hypertrophy_priority >= 0 AND hypertrophy_priority <= 100
  )
);

-- Training Style History Table (for tracking changes over time)
CREATE TABLE IF NOT EXISTS training_style_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Snapshot of style profile
  style_mode TEXT NOT NULL,
  skill_priority INTEGER NOT NULL,
  strength_priority INTEGER NOT NULL,
  power_priority INTEGER NOT NULL,
  endurance_priority INTEGER NOT NULL,
  hypertrophy_priority INTEGER NOT NULL,
  
  -- Change tracking
  change_reason TEXT, -- onboarding, settings_update, adaptive_adjustment, etc.
  confidence_score INTEGER,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_style_user ON training_style_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_training_style_history_user ON training_style_history(user_id);
CREATE INDEX IF NOT EXISTS idx_training_style_history_date ON training_style_history(created_at DESC);

-- Unique constraint: one active profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_style_unique_user ON training_style_profiles(user_id);
