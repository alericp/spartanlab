-- =============================================================================
-- DOCTRINE FOUNDATION SEED DATA
-- Phase: Doctrine DB Foundation Audit and Wiring
-- Purpose: Seed minimal real doctrine data for structural proof
-- =============================================================================
-- This is NOT a full doctrine dump. It's a minimal foundation to prove the
-- doctrine DB structure works. Full doctrine migration comes in a later phase.
-- =============================================================================

-- 1. INSERT SYSTEM-SEEDED DOCTRINE SOURCE
INSERT INTO training_doctrine_sources (id, source_key, title, source_type, description, version, is_active)
VALUES (
  'src_system_foundation_v1',
  'system_seeded_foundation',
  'SpartanLab Foundation Doctrine',
  'system_seeded',
  'Core training principles seeded from SpartanLab code registries. Represents baseline calisthenics training knowledge.',
  '1.0.0',
  true
) ON CONFLICT (source_key) DO NOTHING;

-- 2. INSERT CORE TRAINING PRINCIPLES
INSERT INTO training_doctrine_principles (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, athlete_level_scope, safety_priority, priority_weight)
VALUES 
  -- Static skill principles
  ('prin_001', 'src_system_foundation_v1', 'static_skill_training', 'skill_frequency_principle', 
   'High-Frequency Skill Exposure', 
   'Frequent submaximal exposure to static holds accelerates motor learning more effectively than infrequent maximal attempts.',
   '["intermediate", "advanced"]', 5, 1.2),
  
  ('prin_002', 'src_system_foundation_v1', 'static_skill_training', 'tendon_conservative_principle',
   'Conservative Tendon Loading',
   'Connective tissue adapts slower than muscle. Progression pace must respect tendon adaptation timelines to prevent injury.',
   '["beginner", "intermediate", "advanced"]', 9, 1.5),
  
  ('prin_003', 'src_system_foundation_v1', 'static_skill_training', 'straight_arm_limitation',
   'Straight-Arm Work Limits',
   'Limit straight-arm pressing and pulling to 2 exercises per session to manage bicep tendon and elbow stress.',
   '["intermediate", "advanced"]', 8, 1.3),
  
  -- Strength principles
  ('prin_004', 'src_system_foundation_v1', 'strength_foundation', 'strength_skill_transfer',
   'Strength-to-Skill Transfer',
   'Heavy weighted basics (pull-ups, dips) build raw strength that transfers to advanced static positions.',
   '["beginner", "intermediate", "advanced"]', 3, 1.1),
  
  ('prin_005', 'src_system_foundation_v1', 'strength_foundation', 'progressive_overload',
   'Progressive Overload Principle',
   'Systematic increase in training stress (load, volume, or density) drives strength adaptation.',
   '["beginner", "intermediate", "advanced"]', 2, 1.0),
  
  -- Recovery principles
  ('prin_006', 'src_system_foundation_v1', 'recovery_management', 'fatigue_accumulation',
   'Fatigue Accumulation Awareness',
   'High-frequency skill training accumulates fatigue differently than strength training. Monitor joint soreness as a leading indicator.',
   '["intermediate", "advanced"]', 7, 1.2),
  
  ('prin_007', 'src_system_foundation_v1', 'recovery_management', 'deload_necessity',
   'Deload Necessity',
   'Regular deload periods (every 4-6 weeks) prevent overuse and allow connective tissue recovery.',
   '["intermediate", "advanced"]', 6, 1.1)
ON CONFLICT DO NOTHING;

-- 3. INSERT PROGRESSION RULES (Planche)
INSERT INTO progression_rules (id, source_id, skill_key, current_level_key, next_level_key, required_prerequisites_json, min_readiness_json, progression_rule_summary, caution_flags_json)
VALUES
  ('prog_pl_001', 'src_system_foundation_v1', 'planche', 'lean', 'tuck',
   '{"planche_lean_hold": "30s", "pseudo_planche_pushup": "8 reps"}',
   '{"wrist_health": "good", "shoulder_protraction": "adequate"}',
   'Progress from planche lean to tuck planche when lean hold exceeds 30s with good protraction.',
   '["wrist_sensitivity", "elbow_tendon_stress"]'),
  
  ('prog_pl_002', 'src_system_foundation_v1', 'planche', 'tuck', 'advanced_tuck',
   '{"tuck_planche_hold": "15s", "pseudo_planche_pushup": "12 reps"}',
   '{"wrist_health": "good", "bicep_tendon": "healthy"}',
   'Progress to advanced tuck when tuck hold exceeds 15s with consistent form.',
   '["bicep_tendon_stress", "wrist_sensitivity"]'),
  
  ('prog_pl_003', 'src_system_foundation_v1', 'planche', 'advanced_tuck', 'straddle',
   '{"advanced_tuck_hold": "10s", "hip_flexibility": "adequate_straddle"}',
   '{"bicep_tendon": "healthy", "shoulder_stability": "excellent"}',
   'Progress to straddle only with solid advanced tuck hold and adequate hip mobility.',
   '["high_straight_arm_stress", "hip_mobility_required"]')
ON CONFLICT DO NOTHING;

-- 4. INSERT PROGRESSION RULES (Front Lever)
INSERT INTO progression_rules (id, source_id, skill_key, current_level_key, next_level_key, required_prerequisites_json, min_readiness_json, progression_rule_summary, caution_flags_json)
VALUES
  ('prog_fl_001', 'src_system_foundation_v1', 'front_lever', 'tuck', 'advanced_tuck',
   '{"tuck_front_lever_hold": "15s", "pull_ups": "10 reps"}',
   '{"lat_strength": "good", "core_stability": "good"}',
   'Progress to advanced tuck front lever when tuck hold exceeds 15s with good lat engagement.',
   '["lat_tendon_stress"]'),
  
  ('prog_fl_002', 'src_system_foundation_v1', 'front_lever', 'advanced_tuck', 'straddle',
   '{"advanced_tuck_hold": "10s", "weighted_pull_up": "+20kg/5 reps"}',
   '{"pulling_strength": "excellent", "core_stability": "excellent"}',
   'Progress to straddle front lever with solid pulling strength base and advanced tuck mastery.',
   '["high_straight_arm_stress", "grip_demands"]')
ON CONFLICT DO NOTHING;

-- 5. INSERT EXERCISE SELECTION RULES
INSERT INTO exercise_selection_rules (id, source_id, goal_key, skill_key, exercise_key, role_key, level_scope, equipment_requirements_json, preferred_when_json, avoid_when_json, selection_weight)
VALUES
  ('esr_001', 'src_system_foundation_v1', 'planche', 'planche', 'planche_lean', 'primary_skill',
   '["beginner", "intermediate"]', '{"floor": true}',
   '{"progression_level": ["lean", "tuck"], "wrist_health": "good"}',
   '{"active_wrist_injury": true}', 1.2),
  
  ('esr_002', 'src_system_foundation_v1', 'planche', 'planche', 'pseudo_planche_pushup', 'strength_support',
   '["beginner", "intermediate", "advanced"]', '{"floor": true}',
   '{"goal_is_planche": true, "bent_arm_work_needed": true}',
   '{"wrist_sensitivity": "high"}', 1.1),
  
  ('esr_003', 'src_system_foundation_v1', 'front_lever', 'front_lever', 'tuck_front_lever', 'primary_skill',
   '["beginner", "intermediate"]', '{"pull_up_bar": true}',
   '{"progression_level": ["tuck", "advanced_tuck"]}',
   '{"active_shoulder_injury": true}', 1.2),
  
  ('esr_004', 'src_system_foundation_v1', 'front_lever', 'front_lever', 'front_lever_raises', 'strength_support',
   '["intermediate", "advanced"]', '{"pull_up_bar": true}',
   '{"lat_weakness_detected": true, "goal_is_front_lever": true}',
   '{"active_bicep_tendinopathy": true}', 1.1)
ON CONFLICT DO NOTHING;

-- 6. INSERT CONTRAINDICATION RULES
INSERT INTO exercise_contraindication_rules (id, source_id, exercise_key, blocked_joint_json, blocked_context_json, modification_guidance, severity)
VALUES
  ('ctr_001', 'src_system_foundation_v1', 'planche_lean', 
   '["wrist"]', '{"active_wrist_injury": true}',
   'Use parallettes to reduce wrist extension demand, or substitute with pseudo planche pushups on parallettes.',
   'caution'),
  
  ('ctr_002', 'src_system_foundation_v1', 'tuck_planche',
   '["wrist", "elbow", "shoulder"]', '{"bicep_tendinopathy": true, "active_wrist_injury": true}',
   'Avoid straight-arm pushing. Focus on bent-arm strength (dips, pushups) until tendon health improves.',
   'blocked'),
  
  ('ctr_003', 'src_system_foundation_v1', 'front_lever_holds',
   '["shoulder", "elbow"]', '{"active_shoulder_injury": true, "bicep_tendinopathy": true}',
   'Reduce to tuck or use banded assistance. Prioritize scapular health and lat strength.',
   'caution'),
  
  ('ctr_004', 'src_system_foundation_v1', 'weighted_pull_up',
   '["shoulder", "elbow"]', '{"active_elbow_tendinopathy": true}',
   'Reduce load, increase rest periods. Consider tempo pulls or eccentric-only work.',
   'warning')
ON CONFLICT DO NOTHING;

-- 7. INSERT METHOD RULES
INSERT INTO method_rules (id, source_id, method_key, category, compatible_goals_json, compatible_levels_json, best_use_cases_json, avoid_use_cases_json, structure_bias_json)
VALUES
  ('mth_001', 'src_system_foundation_v1', 'skill_frequency', 'static_skill',
   '["planche", "front_lever", "handstand"]', '["intermediate", "advanced"]',
   '["motor_learning_phase", "skill_acquisition", "4_plus_training_days"]',
   '["active_tendon_issues", "less_than_3_days_per_week", "pure_strength_goal"]',
   '{"slot_weighting": {"skill": 0.5, "strength": 0.2, "accessory": 0.15, "core": 0.1, "mobility": 0.05}}'),
  
  ('mth_002', 'src_system_foundation_v1', 'weighted_basics', 'strength',
   '["weighted_strength", "muscle_up", "general_strength"]', '["intermediate", "advanced"]',
   '["building_base_strength", "plateau_breaking", "skill_deficit"]',
   '["beginner_without_movement_mastery", "active_injury", "pure_skill_focus"]',
   '{"slot_weighting": {"skill": 0.15, "strength": 0.55, "accessory": 0.15, "core": 0.1, "mobility": 0.05}}'),
  
  ('mth_003', 'src_system_foundation_v1', 'tendon_conservative', 'recovery',
   '["planche", "front_lever", "ring_strength"]', '["beginner", "intermediate", "advanced"]',
   '["history_of_tendon_issues", "returning_from_injury", "older_athletes"]',
   '["aggressive_timeline_goals", "competition_prep"]',
   '{"progression_pace_multiplier": 0.7, "extra_rest_days": 1, "max_straight_arm_per_session": 1}')
ON CONFLICT DO NOTHING;

-- 8. INSERT PRESCRIPTION RULES
INSERT INTO prescription_rules (id, source_id, level_scope, goal_scope, exercise_role_scope, rep_range_json, set_range_json, hold_range_json, rest_range_json, rpe_guidance_json, progression_guidance)
VALUES
  ('presc_001', 'src_system_foundation_v1', '["intermediate", "advanced"]', '["planche", "front_lever"]', '["primary_skill"]',
   '{"min": 1, "max": 3, "note": "For skill holds, 1-3 quality reps"}',
   '{"min": 3, "max": 5}',
   '{"min": 5, "max": 15, "unit": "seconds", "note": "Submaximal holds"}',
   '{"min": 120, "max": 180, "unit": "seconds"}',
   '{"target": 7, "max": 8, "note": "Leave 1-2 reps in reserve"}',
   'Progress hold time before advancing to harder progression. Quality over duration.'),
  
  ('presc_002', 'src_system_foundation_v1', '["intermediate", "advanced"]', '["weighted_strength"]', '["primary_strength"]',
   '{"min": 3, "max": 6}',
   '{"min": 3, "max": 5}',
   null,
   '{"min": 180, "max": 300, "unit": "seconds"}',
   '{"target": 8, "max": 9}',
   'Progressive overload: add 1-2.5kg when completing all sets at RPE 7.'),
  
  ('presc_003', 'src_system_foundation_v1', '["beginner", "intermediate"]', '["general"]', '["accessory"]',
   '{"min": 8, "max": 12}',
   '{"min": 2, "max": 3}',
   null,
   '{"min": 60, "max": 90, "unit": "seconds"}',
   '{"target": 7, "max": 8}',
   'Focus on controlled tempo and muscle connection. Progress reps before adding load.')
ON CONFLICT DO NOTHING;

-- 9. INSERT SKILL CARRYOVER RULES
INSERT INTO skill_carryover_rules (id, source_id, source_exercise_or_skill_key, target_skill_key, carryover_type, carryover_strength, rationale)
VALUES
  ('carry_001', 'src_system_foundation_v1', 'weighted_pull_up', 'front_lever', 'indirect', 0.7,
   'Heavy weighted pull-ups build pulling strength foundation that transfers to front lever.'),
  
  ('carry_002', 'src_system_foundation_v1', 'weighted_dip', 'planche', 'indirect', 0.6,
   'Weighted dips build pushing strength that supports planche lean and tuck positions.'),
  
  ('carry_003', 'src_system_foundation_v1', 'hollow_body_hold', 'front_lever', 'accessory', 0.5,
   'Anti-extension core strength supports maintaining straight body position in front lever.'),
  
  ('carry_004', 'src_system_foundation_v1', 'planche_lean', 'planche', 'direct', 0.9,
   'Direct progression: planche lean is the foundational position for all planche progressions.'),
  
  ('carry_005', 'src_system_foundation_v1', 'tuck_front_lever', 'front_lever', 'direct', 0.9,
   'Direct progression: tuck front lever is the foundational position for front lever development.')
ON CONFLICT DO NOTHING;

-- 10. INSERT VERSION TRACKING
INSERT INTO doctrine_rule_versions (id, source_id, version_label, changelog, is_live)
VALUES
  ('ver_001', 'src_system_foundation_v1', '1.0.0', 'Initial system-seeded doctrine foundation. Minimal real principles for structural proof.', true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED COMPLETION MARKER
-- =============================================================================
-- Migration: 013-doctrine-foundation-seed.sql
-- Status: Complete
-- Records Seeded: ~30 foundation records across 9 tables
-- Purpose: Prove doctrine DB structure works with real data
-- =============================================================================
