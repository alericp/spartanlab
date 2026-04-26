-- =============================================================================
-- DOCTRINE BATCH 3 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned v3)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 3 source. The full Batch 3
-- atom set (100 atoms across 9 sources, distributed over principles,
-- progression, selection, contraindication, method, prescription, and
-- carryover) lives in the in-code fallback at:
--   lib/doctrine/source-batches/batch-03-uploaded-pdf-doctrine.ts
-- and is surfaced through the unified uploaded-PDF aggregator.
--
-- Live DB column shape used (verified 2026-04-25 against information_schema):
--   source_id, doctrine_family (NOT NULL),
--   principle_key, principle_title, principle_summary,
--   athlete_level_scope (jsonb), goal_scope (jsonb),
--   tags_json (jsonb),
--   is_base_intelligence (bool), is_phase_modulation (bool),
--   priority_weight (numeric, 0..2),
--   priority_type ('hard_constraint' | 'soft_preference' | 'recommendation'),
--   safety_priority (int, 0..10).
--
-- Provenance: derived_from_prompt_section_5_summary
-- Raw PDFs: not attached. Evidence snippet column does not exist on the live
-- table; provenance is carried in tags_json instead.
-- Each insert is guarded by EXISTS so it skips silently if the matching
-- Batch 3 source row from script 020 isn't present (e.g. dry-run order).
-- =============================================================================

-- 1) Lower Body A duplicate confirmation
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_lower_body_a_dup',
  'lower_body_progression',
  'lower_body_a_duplicate_confirmation',
  'Lower Body A progression confirmed by duplicate source',
  'A second Lower Body A source independently confirms the L1/L2/L3 pistol-squat / glute-ham / wall-squat / calf-raise progression. Duplicate source increases provenance confidence; it must NOT duplicate visible exercise blocks.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["lower_body_strength","general_fitness"]'::jsonb,
  '["lower_body","duplicate_confirmation","provenance","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_lower_body_a_dup')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) MZ Intermediate Weighted Calisthenics
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_mz_intermediate_weighted',
  'weighted_calisthenics_intermediate',
  'intermediate_weighted_overcomplication_guard',
  'Intermediate weighted calisthenics: keep progression stable',
  'Intermediate stage is where overcomplication kills progress. Hold a stable heavy / assistance / PR weekly cycle and progress via PR-set reps and assistance reps/RIR before introducing advanced complexity.',
  '["intermediate"]'::jsonb,
  '["weighted_pull_up","weighted_dip","strength"]'::jsonb,
  '["weighted_calisthenics","weekly_cycle","heavy_pr_linkage","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_mz_intermediate_weighted')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Forearm Health duplicate confirmation
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_forearm_health_dup',
  'forearm_prehab_duplicate',
  'forearm_prehab_duplicate_confirmation',
  'Forearm prehab confirmed by duplicate source',
  'A second Forearm Health source independently confirms wrist pronation / extension / supination / flexion at 2x15 with short rest. Duplicate source raises provenance confidence; do not duplicate visible prehab blocks.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["prehab","general_fitness"]'::jsonb,
  '["wrist","forearm","prehab","duplicate_confirmation","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.0, 'recommendation', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_forearm_health_dup')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Kinevo Bodyweight Strength Foundation
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_kinevo_bw_foundation',
  'bodyweight_strength_foundation',
  'leverage_progression_principle',
  'Calisthenics scales through leverage and body position',
  'Bodyweight strength/hypertrophy progresses primarily through leverage and position changes, not only added external load. Equipment choice (bands below 8 pull-ups, free weights above 8) follows from current strength.',
  '["beginner","intermediate"]'::jsonb,
  '["bodyweight_strength","calisthenics_foundation"]'::jsonb,
  '["leverage_progression","equipment_gate","calisthenics","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_kinevo_bw_foundation')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) No-BS Nutrition System (supportive only)
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_no_bs_nutrition',
  'nutrition_adherence',
  'nutrition_consistency_over_obsession',
  'Nutrition: calories, protein, and consistency over obsession',
  'Body composition is driven by sustained calorie/protein targets and adherence, not by tracking minutiae. Nutrition guidance supports training; it is not medical advice and does not override training generation.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["fat_loss","muscle_gain","general_fitness"]'::jsonb,
  '["nutrition","supportive","not_medical","derived_from_prompt_section_5_summary"]'::jsonb,
  FALSE, FALSE, 1.0, 'recommendation', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_no_bs_nutrition')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) BSF Training Log / Warm-up / Hypertrophy
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_bsf_training_log',
  'warmup_hypertrophy_progression',
  'progression_stability_during_hypertrophy_phase',
  'Hold progression constant; progress reps/sets in early hypertrophy phase',
  'During early hypertrophy phase advance reps or sets while keeping the chosen progression constant rather than rotating exercises every week. Warm-up reps/holds are readiness-guided, not fixed.',
  '["beginner","intermediate"]'::jsonb,
  '["hypertrophy","skill_strength_blend"]'::jsonb,
  '["progression_stability","phase_design","warm_up","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, TRUE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_bsf_training_log')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Ian Barseagle Weighted & Bodyweight Calisthenics
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_ian_barseagle_weighted',
  'weighted_calisthenics_ramp',
  'weighted_plan_prerequisite_gate',
  'Weighted pull-up/dip plan gated by bodyweight prerequisites',
  'Apply heavy weighted progressions only after roughly 15+ pull-ups and 20+ dips. Below threshold use band/negative/low-rep practice (1-3 reps -> low-rep sets, 3-4 min rest, ramp to 8 reps; then max-rep sets with 5-6 min rest toward 15). Always include a movement-specific ramp-up at ~50% of working load.',
  '["beginner","intermediate"]'::jsonb,
  '["weighted_pull_up","weighted_dip","strength"]'::jsonb,
  '["prerequisite_gate","ramp_warmup","pull_up_progression","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 4
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_ian_barseagle_weighted')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Flexibility Notes
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_flexibility_notes',
  'flexibility_mobility',
  'active_flexibility_for_skills',
  'Skill work demands active flexibility and mobility, not only passive stretch',
  'Street-workout skills (planche, manna/V-sit, hollowback handstand) require strength under stretched range. Active mobility supports tolerance and reduces risk but does not eliminate it; pain rules still apply. Planche forward lean specifically demands wrist mobility/prehab support.',
  '["intermediate","advanced"]'::jsonb,
  '["mobility","skill_support","prehab"]'::jsonb,
  '["active_flexibility","planche_wrist_support","injury_risk_modulation","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 5
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_flexibility_notes')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Muscle & Strength Pyramid Training (high-level conflict resolution)
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family,
  principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_03_mns_pyramid',
  'pyramid_priority_hierarchy',
  'pyramid_priority_hierarchy',
  'Pyramid hierarchy resolves general programming conflicts',
  'When doctrine conflicts, resolve in order: adherence -> volume/intensity/frequency balance -> progression matched to training age -> exercise selection (specificity, weak points, ROM) -> rest -> tempo. Calisthenics-specific doctrine still wins on its own domain.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["strength","hypertrophy","general_fitness"]'::jsonb,
  '["priority_hierarchy","conflict_resolution","evidence_based","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 2
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_03_mns_pyramid')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- =============================================================================
-- VERIFICATION (read-only)
-- =============================================================================

SELECT
  (SELECT COUNT(*) FROM training_doctrine_sources    WHERE id        LIKE 'src_batch_03_%') AS batch3_sources,
  (SELECT COUNT(*) FROM training_doctrine_principles WHERE source_id LIKE 'src_batch_03_%') AS batch3_principles,
  (SELECT COUNT(*) FROM training_doctrine_sources    WHERE id        LIKE 'src_batch_%')    AS uploaded_sources,
  (SELECT COUNT(*) FROM training_doctrine_principles WHERE source_id LIKE 'src_batch_%')    AS uploaded_principles;
