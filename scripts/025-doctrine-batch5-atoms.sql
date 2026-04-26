-- =============================================================================
-- DOCTRINE BATCH 5 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 5 source. The full Batch 5
-- atom set (142 atoms across 9 sources, distributed over principles,
-- progression, selection, method, prescription, and carryover) lives in the
-- in-code fallback at:
--   lib/doctrine/source-batches/batch-05-uploaded-pdf-doctrine.ts
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
-- Provenance: derived_from_prompt_section_5_summary. Raw PDFs not attached.
-- Each insert guarded by EXISTS so it skips silently if the matching Batch 5
-- source row from scripts/024 isn't present yet.
-- =============================================================================

-- 1) BL/FL 3x Weekly Training
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_bl_fl_3x_weekly',
  'bl_fl_3x_direct_expression',
  'lever_direct_expression_3x',
  'BL/FL 3x: distribute direct lever exposure across 3 weekly sessions',
  'When BL/FL are selected and readiness allows, direct lever pulls, holds, and eccentrics should appear across the week with main work on long rest spacing.',
  '["intermediate","advanced"]'::jsonb,
  '["back_lever","front_lever","lever_strength"]'::jsonb,
  '["bl_fl","direct_expression","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_bl_fl_3x_weekly')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) Gladiolus 6-Day PPL Arnold
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_gladiolus_6day_ppl_arnold',
  'high_frequency_hypertrophy_split',
  'six_day_split_recovery_gate',
  '6-day PPL/Arnold split is gated by recovery, time, and hypertrophy goal',
  'High-frequency hypertrophy splits should only influence programming when schedule, recovery capacity, and explicit hypertrophy/hybrid goal support 6 sessions per week.',
  '["intermediate","advanced"]'::jsonb,
  '["hypertrophy","hybrid"]'::jsonb,
  '["6_day","ppl","arnold","recovery_gate","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.6, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_6day_ppl_arnold')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Gladiolus 5-Day PPL Upper/Lower
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_gladiolus_5day_ppl_ul',
  'hybrid_5_day_split',
  'five_day_skill_priority_preserved',
  '5-day hybrid split preserves skill priority',
  'PPL combined with upper/lower can inform 5-day hybrid scheduling, but selected calisthenics skills must retain direct or labeled-carryover representation.',
  '["intermediate","advanced"]'::jsonb,
  '["hybrid","hypertrophy","skill"]'::jsonb,
  '["5_day","hybrid","skill_priority","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.6, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_5day_ppl_ul')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Gladiolus 4-Day PPL Shoulder-Arms
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_gladiolus_4day_ppl_sh',
  'hybrid_4_day_split',
  'four_day_accessory_packaging',
  '4-day hybrid split packages accessory/upper-isolation around skill priority',
  'A 4-day push/pull/legs/shoulder-arms structure may inform hybrid programming, but selected calisthenics skills must retain direct or labeled-carryover representation.',
  '["intermediate"]'::jsonb,
  '["hybrid","hypertrophy"]'::jsonb,
  '["4_day","hybrid","accessory","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_4day_ppl_sh')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) Gladiolus 3-Day Full Body Upper/Lower
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_gladiolus_3day_fb_ul',
  'compressed_3_day_recomposition',
  'three_day_recompose_priority_skills',
  '3-day compressed week recombines priority skill work, never silently drops it',
  'When training days shrink to 3, the engine must recompose high-ROI skill work and essential strength/hypertrophy support rather than dropping selected skills.',
  '["beginner","intermediate"]'::jsonb,
  '["hybrid","skill","hypertrophy"]'::jsonb,
  '["3_day","compressed","recomposition","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.8, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_3day_fb_ul')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) Monster Maker Total Body Muscle Building
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_monster_maker',
  'circuit_density_method',
  'circuit_method_eligibility',
  'Density circuits are eligible only when goal, session duration, and fatigue support them',
  'Monster Maker style circuits/density blocks may be selected when the user goal is hypertrophy/conditioning, session duration allows the time cap, and fatigue is not elevated.',
  '["intermediate","advanced"]'::jsonb,
  '["hypertrophy","conditioning","density"]'::jsonb,
  '["circuit","density","time_cap","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_monster_maker')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Nicky Lyan — Actual Get Better at Calisthenics
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_nl_theory',
  'stimulus_recovery_adaptation',
  'srb_balance_principle',
  'Stimulus + recovery = adaptation; volume/intensity/frequency must balance',
  'Increasing volume/intensity/frequency without proportional recovery support causes burnout or plateau. The engine must balance the three together and protect long-term progression on daily adjustments.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["recovery","progression","fatigue"]'::jsonb,
  '["stimulus_recovery_adaptation","vif_balance","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_nl_theory')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Nicolas Lyan — How to Start Calisthenics
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_nl_start',
  'beginner_foundation_calisthenics',
  'foundation_before_advanced',
  'Foundations come before advanced skills; classify level before selecting progressions',
  'Beginner athletes must establish baseline strength on rows, pushups, pull-ups, dips, hollow body, toes-to-bar, skin the cat, plank, and squats before advanced skill exposure becomes primary. Classify level first; match progression/regression to current ability.',
  '["beginner"]'::jsonb,
  '["foundation","skill","general_strength"]'::jsonb,
  '["beginner","foundation","level_classification","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_nl_start')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Nicky Lyan — Master the Handstand
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_05_nl_handstand',
  'handstand_form_balance_strength',
  'handstand_prerequisite_and_components',
  'Handstand has form, balance, and strength components; check 45s high plank prerequisite',
  'Handstand programming should classify the limiter (form/balance/strength/mixed), confirm prerequisite pressing/plank capacity, prefer joint-stacked alignment as the goal, and use offset stack only as a transitional learning tool.',
  '["beginner","intermediate"]'::jsonb,
  '["handstand","skill","form"]'::jsonb,
  '["handstand","prerequisite","limiter_classification","derived_from_prompt_section_5_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_nl_handstand')
ON CONFLICT (source_id, principle_key) DO NOTHING;
