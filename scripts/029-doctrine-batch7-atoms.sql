-- =============================================================================
-- DOCTRINE BATCH 7 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 7 source (12 total). The full
-- Batch 7 atom set (212 atoms across 12 sources, distributed over principles,
-- progression, selection, method, prescription, and carryover) lives in the
-- in-code fallback at:
--   lib/doctrine/source-batches/batch-07-lower-body-military-doctrine.ts
-- and is surfaced through the unified uploaded-PDF aggregator.
--
-- Why anchors-only is safe:
--   The runtime contract uses a PER-BATCH completeness gate that compares
--   DB atoms vs in-code fallback atoms for each batch and uses fallback for
--   any batch where DB is partial. Source mode becomes
--   `hybrid_db_plus_uploaded_fallback` and the Program UI proof strip
--   surfaces this honestly. See:
--     lib/doctrine-runtime-contract.ts → DOCTRINE-DB-FALLBACK-COMPLETENESS-GATE
--     app/(app)/program/page.tsx       → DoctrineRuntimeProof completenessLine
--
-- LEGAL SOURCE GATE: every Batch 7 atom carries
-- `sourceLegalityStatus = user_uploaded_owned` in tags_json. All sources
-- are public branch fitness standards (USMC/Army/Navy/AF/SF), public
-- training-science fundamentals, or original synthesis. No leaked /
-- pirated paid material.
--
-- Provenance: derived_from_public_standards_and_original_synthesis. Each
-- insert guarded by EXISTS so it skips silently if the matching Batch 7
-- source row from scripts/028 isn't present yet.
-- =============================================================================

-- 1) Lower-Body Skill Foundations
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_lower_body_skill_foundations',
  'lower_body_skill',
  'lbs_unilateral_priority_anchor',
  'Unilateral squat skill is gated by control, not bravery',
  'Pistol/shrimp/skater squat readiness depends on demonstrated control (mobility, knee tracking, stable trunk), not on willingness to attempt.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["lower_body_skill","unilateral_squat"]'::jsonb,
  '["lower_body_skill","unilateral_squat","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_lower_body_skill_foundations')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) Dragon Squat Skill
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_dragon_squat_skill',
  'dragon_squat_skill',
  'dss_mobility_first_anchor',
  'Dragon squat is mobility-and-control gated, not strength-gated',
  'Dragon squat requires ankle dorsiflexion, hip rotation/control, knee tracking tolerance, trunk rotation, and deep squat mobility before any meaningful loading.',
  '["intermediate","advanced"]'::jsonb,
  '["lower_body_skill","dragon_squat"]'::jsonb,
  '["dragon_squat","mobility_gated","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_dragon_squat_skill')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Lower-Body Strength / Hypertrophy
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_lower_body_strength_hyper',
  'lower_body_strength',
  'lsh_squat_hinge_balance_anchor',
  'Programs balance squat (knee-dominant) and hinge (hip-dominant)',
  'Lower-body programming includes both knee-dominant (squat/lunge/split squat) and hip-dominant (hinge/RDL/deadlift/glute bridge) patterns to protect joints and develop carryover.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["hypertrophy","general_strength","hybrid_strength"]'::jsonb,
  '["lower_body_strength","squat_hinge_balance","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_lower_body_strength_hyper')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Skill Interference / Leg Dose
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_skill_interference_leg_dose',
  'leg_skill_interference',
  'sil_preference_respected_anchor',
  'Leg-training preference is user truth, surfaced honestly',
  'Programs respect legTrainingPreference (no/minimal/regular/tactical) and surface a clear imbalance warning when the user picks no_leg_training.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["calisthenics_skill","leg_dose","interference_management"]'::jsonb,
  '["leg_preference","interference","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_skill_interference_leg_dose')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) Military Fitness Test Foundation
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_military_fitness_foundation',
  'military_fitness',
  'mft_test_specificity_anchor',
  'Military prep is matched to selected test events first',
  'Programs identify the target test/events before prescribing volume; generic hard PT does not replace event-specific preparation.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["military_general","military_test_prep"]'::jsonb,
  '["military","test_specificity","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_military_fitness_foundation')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) Army AFT/ACFT-style Tactical Prep
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_army_aft_tactical_prep',
  'army_tactical',
  'aat_six_event_balance_anchor',
  'Army-style prep balances strength, power, anaerobic, core, run',
  'AFT/ACFT-style prep covers deadlift strength, hand-release push-up endurance, sprint-drag-carry/shuttle anaerobic power, core, and 2-mile run — none neglected.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["army_aft","army_acft","tactical_strength_endurance"]'::jsonb,
  '["army","aft_acft_style","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_army_aft_tactical_prep')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Marine PFT / CFT Prep
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_marine_pft_cft_prep',
  'marine_tactical',
  'mpc_pft_cft_split_anchor',
  'Marine prep splits PFT (pull/push, plank, 3mi) and CFT (combat anaerobic)',
  'PFT prep covers pull-up/push-up, plank, 3-mile run with event-specific endurance and pacing. CFT prep is anaerobic and combat-style with sprint conditioning, overhead pressing endurance, loaded carries, and combat-style circuits.',
  '["intermediate","advanced"]'::jsonb,
  '["marine_pft","marine_cft","tactical_endurance","tactical_anaerobic"]'::jsonb,
  '["marine","pft_cft","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_marine_pft_cft_prep')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Navy PRT Prep
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_navy_prt_prep',
  'navy_tactical',
  'npp_event_balance_anchor',
  'Navy PRT prep balances push-ups, forearm plank, and 1.5-mile run',
  'PRT covers push-up endurance, forearm plank endurance, and 1.5-mile run; cardio alternatives may apply where supported by the test.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["navy_prt","tactical_endurance"]'::jsonb,
  '["navy","prt","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 1.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_navy_prt_prep')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Air Force / Space Force PFA Prep
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_air_force_space_force_pfa',
  'air_force_tactical',
  'app_event_options_anchor',
  'PFA includes optional events; user picks strengths',
  'Air Force/Space Force PFA supports run/HAMR options, push-up or hand-release push-up options, sit-up/cross-leg-reverse-crunch/plank options, and waist-to-height body composition awareness.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["air_force_pfa","space_force_pfa","tactical_endurance"]'::jsonb,
  '["air_force","space_force","pfa","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 1.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_air_force_space_force_pfa')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 10) Ruck / Load Carriage / Tactical Durability
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_ruck_load_carriage',
  'ruck_tactical_durability',
  'rlc_gradual_progression_anchor',
  'Ruck progresses load, distance, pace, terrain, frequency gradually',
  'Ruck and load-carriage progresses one variable at a time and avoids sudden spikes that injure feet, shins, calves, knees, hips, and low back.',
  '["intermediate","advanced"]'::jsonb,
  '["tactical_ruck_load_carriage","tactical_selection_prep"]'::jsonb,
  '["ruck","load_carriage","gradual_progression","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_ruck_load_carriage')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 11) Tactical Running Engine
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_tactical_running_engine',
  'tactical_running',
  'tre_aerobic_base_required_anchor',
  'Aerobic base is the foundation of any military run',
  'Easy aerobic running anchors the engine; quality work (tempo/intervals/repeats/strides/test-pace) sits on top of base, not in place of it.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["military_general","run_endurance"]'::jsonb,
  '["running","aerobic_base","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_tactical_running_engine')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 12) Tactical Calisthenics Endurance
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_07_tactical_cal_endurance',
  'tactical_cal_endurance',
  'tce_density_principle_anchor',
  'Density training builds calisthenics endurance without daily maxing',
  'EMOMs, ladders, and submax volume sets build push-up/pull-up/sit-up endurance with less wear than daily max attempts.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["military_general","calisthenics_endurance"]'::jsonb,
  '["calisthenics_endurance","density","emom","ladder","derived_from_public_standards_and_original_synthesis","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 1.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_07_tactical_cal_endurance')
ON CONFLICT (source_id, principle_key) DO NOTHING;
