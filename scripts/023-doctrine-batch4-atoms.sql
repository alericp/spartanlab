-- =============================================================================
-- DOCTRINE BATCH 4 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 4 source. The full Batch 4
-- atom set (118 atoms across 9 sources, distributed over principles,
-- progression, selection, method, prescription, and carryover) lives in the
-- in-code fallback at:
--   lib/doctrine/source-batches/batch-04-uploaded-pdf-doctrine.ts
-- and is surfaced through the unified uploaded-PDF aggregator.
--
-- Why anchors-only is now safe (changed in Batch 4 task):
--   The runtime contract previously took a global threshold
--   (`coverage.totalRulesCount > 0`) to decide DB vs fallback. With that
--   gate, even a 9-row anchor seed would force `db_live` and silently hide
--   the richer 118-atom in-code Batch 4 set. The runtime contract was
--   rewritten to a PER-BATCH completeness gate that compares DB atoms vs
--   in-code fallback atoms for each batch and uses fallback for any batch
--   where DB is partial. Source mode becomes
--   `hybrid_db_plus_uploaded_fallback` and the Program UI proof strip
--   surfaces this honestly. See:
--     lib/doctrine-runtime-contract.ts → DOCTRINE-DB-FALLBACK-COMPLETENESS-GATE
--     app/(app)/program/page.tsx       → DoctrineRuntimeProof completenessLine
--
-- Provenance: derived_from_prompt_section_5_summary. Raw PDFs not attached.
-- Each insert guarded by EXISTS so it skips silently if the matching Batch 4
-- source row from scripts/022 isn't present yet.
-- =============================================================================

-- 1) Pull-Up Pro Phase 1
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_pull_up_pro_phase_1',
  'one_arm_pull_up_foundation',
  'phase_1_priority',
  'Phase 1 prioritizes two-arm vertical pull + row + hang support',
  'Foundation pulling builds the strength and tendon tolerance one-arm work later requires; rushing into eccentrics risks injury.',
  '["beginner","intermediate"]'::jsonb,
  '["one_arm_pull_up","pulling_strength"]'::jsonb,
  '["one_arm_pull_up","foundation","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_pull_up_pro_phase_1')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) Pull-Up Pro Phase 2
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_pull_up_pro_phase_2',
  'one_arm_pull_up_transition',
  'phase_2_assisted_primary',
  'Phase 2 makes assisted one-arm work primary',
  'When foundation pulling exists but eccentric readiness is not yet met, assisted one-arm becomes the primary stimulus before high-stress eccentrics.',
  '["intermediate"]'::jsonb,
  '["one_arm_pull_up"]'::jsonb,
  '["one_arm_pull_up","assisted_transition","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_pull_up_pro_phase_2')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Pull-Up Pro Phase 3
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_pull_up_pro_phase_3',
  'one_arm_pull_up_advanced',
  'phase_3_eccentric',
  'Phase 3 unlocks one-arm eccentrics, rows, and hangs',
  'Only advanced pulling readiness can unlock eccentric one-arm work, one-arm rows, and one-arm hangs as high-stress specialization.',
  '["advanced"]'::jsonb,
  '["one_arm_pull_up"]'::jsonb,
  '["one_arm_pull_up","advanced_eccentric","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_pull_up_pro_phase_3')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Mathew Zlat Weighted Guide
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_mz_weighted_guide',
  'weighted_calisthenics_form_standards',
  'wc_quality_first',
  'Form quality precedes load',
  'Pull-up and dip form standards (straight-arm start, chin-over-bar finish, controlled lowering, no kipping/swinging) are non-negotiable before adding external load.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["weighted_pull_up","weighted_dip","streetlifting"]'::jsonb,
  '["weighted_calisthenics","form_standard","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_mz_weighted_guide')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) MZ Duplicate confirmation
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_mz_weighted_dup',
  'weighted_calisthenics_duplicate',
  'wcd_no_block_dup',
  'Duplicate source must not duplicate visible blocks',
  'A second source aligns with the same pull-up/dip form/load standards. Confirmation only raises confidence/provenance, never doubles exercise prescriptions.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["weighted_pull_up","weighted_dip"]'::jsonb,
  '["weighted_calisthenics","duplicate_confirmation","provenance","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_mz_weighted_dup')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) BWS 5-Day Full Body
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_bws_5day_full_body',
  'traditional_hypertrophy_full_body',
  'bws5_two_rest',
  '5-day full body requires at least 2 rest days',
  'Day-of-week placement matters less than spacing two recovery days into the week. Higher-frequency hypertrophy templates need adequate recovery and schedule availability.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["hypertrophy","general_fitness"]'::jsonb,
  '["hypertrophy","schedule","5_day_full_body","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_bws_5day_full_body')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Lever Pro
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_lever_pro',
  'lever_progression',
  'lp_systematic',
  'Levers require systematic, patient progression',
  'Smart, leverage-based progression beats hurried band drops or premature full-lay attempts. Front lever and back lever require isometric/dynamic/eccentric methods with appropriate scapular cues and recovery spacing.',
  '["intermediate","advanced"]'::jsonb,
  '["front_lever","back_lever","skill_strength"]'::jsonb,
  '["lever","skill","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_lever_pro')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Lever Pro 4x BL/FL
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_lever_pro_4x',
  'lever_4x_split',
  'lp4_separated',
  '4x BL/FL split separates back-lever and front-lever exposures',
  'When training both levers four days per week, BL and FL get separate days with rest spacing rather than stacking all lever work every day.',
  '["intermediate","advanced"]'::jsonb,
  '["front_lever","back_lever"]'::jsonb,
  '["lever","schedule","4x_split","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_lever_pro_4x')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) BWS 4-Day Upper/Lower
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_04_bws_4day_upper_lower',
  'traditional_hypertrophy_upper_lower',
  'bws4_max_two',
  'No more than two workout days in a row',
  '4-day upper/lower split requires at least 3 rest days and avoids more than 2 consecutive workout days. Recovery quality requires spacing.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["hypertrophy","general_fitness"]'::jsonb,
  '["hypertrophy","schedule","4_day_upper_lower","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_04_bws_4day_upper_lower')
ON CONFLICT (source_id, principle_key) DO NOTHING;
