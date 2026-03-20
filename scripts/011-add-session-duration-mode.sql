-- Add session_duration_mode column to athlete_profiles
-- TASK 3: This column stores whether the user prefers fixed or adaptive session duration
-- 'static' = fixed duration (user picked specific minutes)
-- 'adaptive' = engine adapts session length based on recovery and day focus

-- Add the column if it doesn't exist
ALTER TABLE athlete_profiles 
ADD COLUMN IF NOT EXISTS session_duration_mode VARCHAR(20) DEFAULT 'static';

-- Create an index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_session_duration_mode 
ON athlete_profiles(session_duration_mode);

-- Add a comment for documentation
COMMENT ON COLUMN athlete_profiles.session_duration_mode IS 
'Session duration mode: static = fixed duration, adaptive = engine adapts based on recovery';
