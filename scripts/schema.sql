-- SpartanLab Database Schema
-- This schema will be applied when production database is connected
-- DO NOT execute until ready for production

-- =============================================================================
-- USERS & PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'elite')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athlete_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  bodyweight NUMERIC,
  experience_level TEXT DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  training_days_per_week INTEGER DEFAULT 4,
  primary_goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================================================
-- SKILL PROGRESSIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS skill_progressions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  current_level INTEGER DEFAULT 0,
  target_level INTEGER DEFAULT 0,
  progress_score NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- =============================================================================
-- STRENGTH RECORDS
-- =============================================================================

CREATE TABLE IF NOT EXISTS strength_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL CHECK (exercise IN ('weighted_pull_up', 'weighted_dip', 'weighted_muscle_up')),
  weight_added NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  estimated_one_rm NUMERIC NOT NULL,
  date_logged DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strength_records_user_exercise ON strength_records(user_id, exercise);
CREATE INDEX IF NOT EXISTS idx_strength_records_date ON strength_records(user_id, date_logged DESC);

-- =============================================================================
-- PROGRAMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  primary_goal TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  training_days_per_week INTEGER NOT NULL,
  secondary_emphasis TEXT,
  session_length INTEGER NOT NULL,
  generated_days JSONB NOT NULL,
  strength_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id, created_at DESC);

-- =============================================================================
-- WORKOUT LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS workout_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('skill', 'strength', 'mixed', 'recovery')),
  session_date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  focus_area TEXT NOT NULL,
  notes TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(session_date DESC);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athlete_profiles_updated_at
  BEFORE UPDATE ON athlete_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);
