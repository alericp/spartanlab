-- Skill Readiness Tables
-- Stores calculated readiness data for calisthenics skills to power the AI engine

-- Main skill_readiness table storing the latest readiness assessment
CREATE TABLE IF NOT EXISTS skill_readiness (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL CHECK (skill IN ('front_lever', 'planche', 'hspu', 'muscle_up', 'l_sit')),
  
  -- Overall readiness score (0-100)
  readiness_score INTEGER NOT NULL DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  
  -- Component scores (0-100)
  pull_strength_score INTEGER DEFAULT 0 CHECK (pull_strength_score >= 0 AND pull_strength_score <= 100),
  push_strength_score INTEGER DEFAULT 0 CHECK (push_strength_score >= 0 AND push_strength_score <= 100),
  compression_score INTEGER DEFAULT 0 CHECK (compression_score >= 0 AND compression_score <= 100),
  scapular_control_score INTEGER DEFAULT 0 CHECK (scapular_control_score >= 0 AND scapular_control_score <= 100),
  straight_arm_score INTEGER DEFAULT 0 CHECK (straight_arm_score >= 0 AND straight_arm_score <= 100),
  mobility_score INTEGER DEFAULT 0 CHECK (mobility_score >= 0 AND mobility_score <= 100),
  skill_specific_score INTEGER DEFAULT 0 CHECK (skill_specific_score >= 0 AND skill_specific_score <= 100),
  
  -- Limiting factor identification
  limiting_factor TEXT,
  limiting_factor_explanation TEXT,
  
  -- Readiness level classification
  readiness_level TEXT CHECK (readiness_level IN ('not-ready', 'foundation-phase', 'early-progression', 'intermediate-progression', 'advanced-ready')),
  
  -- Recommendation and next steps
  recommendation TEXT,
  next_progression TEXT,
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per skill
  UNIQUE (user_id, skill)
);

-- Readiness snapshot history for trend tracking
CREATE TABLE IF NOT EXISTS readiness_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL CHECK (skill IN ('front_lever', 'planche', 'hspu', 'muscle_up', 'l_sit')),
  
  -- Snapshot data
  readiness_score INTEGER NOT NULL CHECK (readiness_score >= 0 AND readiness_score <= 100),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Component scores at snapshot time
  pull_strength_score INTEGER DEFAULT 0,
  push_strength_score INTEGER DEFAULT 0,
  compression_score INTEGER DEFAULT 0,
  scapular_control_score INTEGER DEFAULT 0,
  straight_arm_score INTEGER DEFAULT 0,
  mobility_score INTEGER DEFAULT 0,
  
  limiting_factor TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate snapshots per day per skill
  UNIQUE (user_id, skill, snapshot_date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_skill_readiness_user_id ON skill_readiness(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_readiness_skill ON skill_readiness(skill);
CREATE INDEX IF NOT EXISTS idx_skill_readiness_user_skill ON skill_readiness(user_id, skill);

CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user_id ON readiness_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_skill ON readiness_snapshots(skill);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_date ON readiness_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user_skill_date ON readiness_snapshots(user_id, skill, snapshot_date DESC);
