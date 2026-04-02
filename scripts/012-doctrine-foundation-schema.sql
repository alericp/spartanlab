-- =============================================================================
-- DOCTRINE FOUNDATION SCHEMA
-- Phase: Doctrine DB Foundation Audit and Wiring
-- Purpose: Create structured doctrine knowledge tables for future generator use
-- =============================================================================
-- This migration creates the foundational doctrine database layer.
-- It does NOT replace existing code-based doctrine registries.
-- It enables future doctrine-aware generation by providing a queryable DB structure.
-- =============================================================================

-- 1. TRAINING DOCTRINE SOURCES
-- Master table for doctrine origins (system-seeded, manual, extracted from PDFs, etc.)
CREATE TABLE IF NOT EXISTS training_doctrine_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('system_seeded', 'manual', 'extracted_pdf', 'imported_note')),
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TRAINING DOCTRINE PRINCIPLES
-- Core training principles that inform decision-making
CREATE TABLE IF NOT EXISTS training_doctrine_principles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  doctrine_family TEXT NOT NULL,
  principle_key TEXT NOT NULL,
  principle_title TEXT NOT NULL,
  principle_summary TEXT NOT NULL,
  athlete_level_scope JSONB DEFAULT '["beginner", "intermediate", "advanced"]',
  goal_scope JSONB,
  applies_to_skill_types JSONB,
  applies_to_training_styles JSONB,
  applies_to_equipment_context JSONB,
  safety_priority INTEGER DEFAULT 0 CHECK (safety_priority >= 0 AND safety_priority <= 10),
  priority_weight NUMERIC(3,2) DEFAULT 1.0 CHECK (priority_weight >= 0 AND priority_weight <= 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, principle_key)
);

-- 3. PROGRESSION RULES
-- Rules governing skill/exercise progression
CREATE TABLE IF NOT EXISTS progression_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  current_level_key TEXT NOT NULL,
  next_level_key TEXT NOT NULL,
  required_prerequisites_json JSONB,
  min_readiness_json JSONB,
  progression_rule_summary TEXT,
  caution_flags_json JSONB,
  confidence_weight NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, skill_key, current_level_key, next_level_key)
);

-- 4. EXERCISE SELECTION RULES
-- Rules for when/why to select specific exercises
CREATE TABLE IF NOT EXISTS exercise_selection_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  goal_key TEXT,
  skill_key TEXT,
  exercise_key TEXT NOT NULL,
  role_key TEXT,
  level_scope JSONB DEFAULT '["beginner", "intermediate", "advanced"]',
  equipment_requirements_json JSONB,
  joint_conflict_json JSONB,
  preferred_when_json JSONB,
  avoid_when_json JSONB,
  carryover_tags_json JSONB,
  selection_weight NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. EXERCISE PREREQUISITE RULES
-- Prerequisites required before an exercise is appropriate
CREATE TABLE IF NOT EXISTS exercise_prerequisite_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  target_exercise_key TEXT NOT NULL,
  prerequisite_exercise_key TEXT NOT NULL,
  prerequisite_standard_json JSONB,
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, target_exercise_key, prerequisite_exercise_key)
);

-- 6. EXERCISE CONTRAINDICATION RULES
-- Safety rules for when to avoid exercises
CREATE TABLE IF NOT EXISTS exercise_contraindication_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  exercise_key TEXT NOT NULL,
  blocked_joint_json JSONB,
  blocked_context_json JSONB,
  modification_guidance TEXT,
  severity TEXT CHECK (severity IN ('warning', 'caution', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. METHOD RULES
-- Training method profiles and their application rules
CREATE TABLE IF NOT EXISTS method_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  method_key TEXT NOT NULL,
  category TEXT,
  compatible_goals_json JSONB,
  compatible_levels_json JSONB,
  best_use_cases_json JSONB,
  avoid_use_cases_json JSONB,
  structure_bias_json JSONB,
  volume_bias_json JSONB,
  intensity_bias_json JSONB,
  density_bias_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, method_key)
);

-- 8. SKILL CARRYOVER RULES
-- How exercises/skills transfer to other skills
CREATE TABLE IF NOT EXISTS skill_carryover_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  source_exercise_or_skill_key TEXT NOT NULL,
  target_skill_key TEXT NOT NULL,
  carryover_type TEXT CHECK (carryover_type IN ('direct', 'indirect', 'prerequisite', 'accessory')),
  carryover_strength NUMERIC(3,2) DEFAULT 1.0 CHECK (carryover_strength >= 0 AND carryover_strength <= 1),
  rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_id, source_exercise_or_skill_key, target_skill_key)
);

-- 9. PRESCRIPTION RULES
-- Rep/set/hold/rest/RPE guidance by context
CREATE TABLE IF NOT EXISTS prescription_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  level_scope JSONB,
  goal_scope JSONB,
  exercise_role_scope JSONB,
  rep_range_json JSONB,
  set_range_json JSONB,
  hold_range_json JSONB,
  rest_range_json JSONB,
  rpe_guidance_json JSONB,
  progression_guidance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. DOCTRINE RULE VERSIONS
-- Version tracking for doctrine updates
CREATE TABLE IF NOT EXISTS doctrine_rule_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  changelog TEXT,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR EFFICIENT QUERIES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_doctrine_principles_source ON training_doctrine_principles(source_id);
CREATE INDEX IF NOT EXISTS idx_doctrine_principles_family ON training_doctrine_principles(doctrine_family);
CREATE INDEX IF NOT EXISTS idx_progression_rules_source ON progression_rules(source_id);
CREATE INDEX IF NOT EXISTS idx_progression_rules_skill ON progression_rules(skill_key);
CREATE INDEX IF NOT EXISTS idx_exercise_selection_rules_source ON exercise_selection_rules(source_id);
CREATE INDEX IF NOT EXISTS idx_exercise_selection_rules_exercise ON exercise_selection_rules(exercise_key);
CREATE INDEX IF NOT EXISTS idx_exercise_selection_rules_goal ON exercise_selection_rules(goal_key);
CREATE INDEX IF NOT EXISTS idx_contraindication_rules_exercise ON exercise_contraindication_rules(exercise_key);
CREATE INDEX IF NOT EXISTS idx_method_rules_method ON method_rules(method_key);
CREATE INDEX IF NOT EXISTS idx_skill_carryover_rules_target ON skill_carryover_rules(target_skill_key);
CREATE INDEX IF NOT EXISTS idx_prescription_rules_source ON prescription_rules(source_id);

-- =============================================================================
-- COMPLETION MARKER
-- =============================================================================
-- Migration: 012-doctrine-foundation-schema.sql
-- Status: Complete
-- Tables Created: 10
-- Purpose: Foundation for doctrine-aware generation
-- =============================================================================
