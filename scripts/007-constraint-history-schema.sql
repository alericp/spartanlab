-- Constraint History Schema
-- Stores constraint detection results over time to track improvement

-- Constraint history table
CREATE TABLE IF NOT EXISTS constraint_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  
  -- Detection timestamp
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Primary constraint
  primary_constraint TEXT NOT NULL,
  primary_severity_score INTEGER NOT NULL CHECK (primary_severity_score >= 0 AND primary_severity_score <= 100),
  primary_severity_level TEXT NOT NULL,
  
  -- Secondary constraint (optional)
  secondary_constraint TEXT,
  secondary_severity_score INTEGER CHECK (secondary_severity_score >= 0 AND secondary_severity_score <= 100),
  
  -- Strong areas (JSON array of constraint categories)
  strong_areas JSONB DEFAULT '[]'::jsonb,
  
  -- Skill context (which skill this constraint was detected for, if any)
  skill_context TEXT,
  
  -- Data quality at time of detection
  data_quality TEXT NOT NULL,
  
  -- Intervention recommended
  intervention_exercises JSONB DEFAULT '[]'::jsonb,
  intervention_note TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user and time
CREATE INDEX IF NOT EXISTS idx_constraint_history_user_time 
ON constraint_history(user_id, detected_at DESC);

-- Index for filtering by constraint type
CREATE INDEX IF NOT EXISTS idx_constraint_history_constraint 
ON constraint_history(user_id, primary_constraint);

-- Constraint improvement tracking view
CREATE OR REPLACE VIEW constraint_improvement AS
SELECT 
  ch1.user_id,
  ch1.primary_constraint,
  ch1.skill_context,
  ch1.primary_severity_score as current_score,
  ch1.detected_at as current_date,
  ch2.primary_severity_score as previous_score,
  ch2.detected_at as previous_date,
  (ch2.primary_severity_score - ch1.primary_severity_score) as improvement,
  CASE 
    WHEN (ch2.primary_severity_score - ch1.primary_severity_score) > 10 THEN 'significant_improvement'
    WHEN (ch2.primary_severity_score - ch1.primary_severity_score) > 0 THEN 'minor_improvement'
    WHEN (ch2.primary_severity_score - ch1.primary_severity_score) = 0 THEN 'no_change'
    WHEN (ch2.primary_severity_score - ch1.primary_severity_score) > -10 THEN 'minor_regression'
    ELSE 'significant_regression'
  END as improvement_status
FROM constraint_history ch1
LEFT JOIN LATERAL (
  SELECT primary_severity_score, detected_at
  FROM constraint_history
  WHERE user_id = ch1.user_id
    AND primary_constraint = ch1.primary_constraint
    AND skill_context IS NOT DISTINCT FROM ch1.skill_context
    AND detected_at < ch1.detected_at
  ORDER BY detected_at DESC
  LIMIT 1
) ch2 ON true;
