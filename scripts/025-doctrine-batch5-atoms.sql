-- ============================================================================
-- 025: Doctrine Batch 5 — Representative Anchor Atoms
-- ============================================================================
-- Seeds 9 representative principle anchor atoms (one per Batch 5 source).
-- The richer 142-atom Batch 5 set lives in
-- `lib/doctrine/source-batches/batch-05-uploaded-pdf-doctrine.ts`.
--
-- Runtime gate guarantee: the DB/fallback completeness gate in
-- `lib/doctrine-runtime-contract.ts` compares per-batch DB atom count vs
-- in-code fallback atom count. Because this seed inserts only 9 anchor
-- principles for Batch 5 (vs ~142 in-code atoms), the gate will always
-- mark `batch_05` as `filled: 'fallback'` and report
-- `source = 'hybrid_db_plus_uploaded_fallback'` so the full doctrine
-- remains available without suppression.
--
-- Additive only:
--   • INSERT only
--   • ON CONFLICT (source_id, principle_key) DO NOTHING
--   • Each row guarded by EXISTS so it skips silently if 024 hasn't run
--   • No DROP / ALTER / DELETE / TRUNCATE
-- ============================================================================

-- 1. BL/FL 3x Weekly Training
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_bl_fl_3x',
  'src_batch_05_bl_fl_3x_weekly',
  'bl_fl_three_day_split',
  'lp3_anchor_direct_distribution',
  'BL/FL 3x weekly training distributes lever stress across the week',
  'When back/front lever is selected and readiness allows, direct lever pulls/holds/eccentrics are distributed across the 3-day week with main work resting ~3 minutes.',
  2, 'soft_preference', 1.5, true, false,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_bl_fl_3x_weekly')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2. Gladiolus 6-Day PPL Arnold
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_g6',
  'src_batch_05_gladiolus_6day_ppl_arnold',
  'six_day_hypertrophy_split',
  'g6_anchor_split_gates',
  '6-day PPL/Arnold split is gated by recovery and skill priority',
  'A 6-day high-frequency hypertrophy split is selected only when schedule, recovery, and goal support it; selected calisthenics skills retain direct or carryover representation.',
  2, 'hard_constraint', 2.0, true, false,
  '{"availableDays":6}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_6day_ppl_arnold')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3. Gladiolus 5-Day PPL + Upper/Lower
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_g5',
  'src_batch_05_gladiolus_5day_ppl_ul',
  'five_day_hypertrophy_split',
  'g5_anchor_skill_priority',
  '5-day PPL+UL split preserves selected skill priority',
  'A 5-day hybrid split supports rather than replaces direct calisthenics skill work; recovery shortfalls downshift to a lower-frequency split.',
  2, 'hard_constraint', 2.0, true, false,
  '{"availableDays":5}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_5day_ppl_ul')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4. Gladiolus 4-Day Push/Pull/Legs/Shoulder-Arms
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_g4',
  'src_batch_05_gladiolus_4day_ppl_sh',
  'four_day_hybrid_split',
  'g4_anchor_skill_priority',
  '4-day P/P/L/Sh-Arms split preserves selected skill priority',
  'A 4-day push/pull/legs/shoulder-arms split supports hybrid training while preserving direct skill exposure; the shoulders/arms day concentrates accessory hypertrophy without inflating compound stress.',
  2, 'hard_constraint', 2.0, true, false,
  '{"availableDays":4}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_4day_ppl_sh')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5. Gladiolus 3-Day Full Body + Upper/Lower
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_g3',
  'src_batch_05_gladiolus_3day_fb_ul',
  'three_day_compressed_split',
  'g3_anchor_recompose',
  '3-day compressed week recomposes around priority skills',
  'On a 3-day week, priority skill work and high-ROI strength/hypertrophy support are recombined rather than dropping selected skills silently.',
  2, 'hard_constraint', 2.0, true, false,
  '{"availableDays":3}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_gladiolus_3day_fb_ul')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6. Monster Maker Total Body
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_mm',
  'src_batch_05_monster_maker',
  'circuit_density_method',
  'mm_anchor_circuit_intent',
  'Circuit/density blocks selected by intent and preserve round structure',
  'Monster Maker-style circuits are selected when goal/fatigue/duration support density work; circuit method preserves rounds, inter-round rest, and time caps and is never silently flattened into straight sets.',
  1, 'soft_preference', 1.5, true, false,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_monster_maker')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7. Nicky Lyan Theory/Recovery
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_nlt',
  'src_batch_05_nl_theory',
  'calisthenics_theory_recovery',
  'nlt_anchor_stimulus_recovery',
  'Stimulus + recovery = adaptation; theory before brute force',
  'Adaptation requires both stimulus and recovery; advanced skills progress through leverage/angle/tension/scapula and recovery, not repeated max attempts. Volume/intensity/frequency are co-decided.',
  2, 'soft_preference', 2.0, true, false,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_nl_theory')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8. Nicolas Lyan How to Start
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_nls',
  'src_batch_05_nl_start',
  'beginner_foundations',
  'nls_anchor_foundations_first',
  'Foundations precede advanced skills; beginner plans are strategic',
  'Beginner athletes build foundation movement quality (rows, push-ups, pull-ups, dips, hollow body, squats, plank) before advanced skills become primary; sets/reps/rest/rest-days are chosen strategically.',
  2, 'hard_constraint', 2.0, true, false,
  '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_nl_start')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9. Nicky Lyan Master the Handstand
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary, safety_priority, priority_type, priority_weight, is_base_intelligence, is_phase_modulation, applies_when_json, does_not_apply_when_json, scopes_json, tags_json, created_at, updated_at)
SELECT
  'pr_b05_anchor_nlh',
  'src_batch_05_nl_handstand',
  'handstand_form_balance_strength',
  'nlh_anchor_components_alignment',
  'Handstand has three components — form, balance, strength — and stacked alignment is the form goal',
  'Programming classifies the limiting factor (form/balance/strength/mixed); proper stack of wrists/elbows/shoulders/hips/knees/ankles is the form goal; advanced freestanding work is gated by prerequisite plank/pressing capacity.',
  2, 'hard_constraint', 2.0, true, false,
  '{"selectedSkills":["handstand"]}'::jsonb, '{}'::jsonb, '{}'::jsonb,
  '{"provenance":"derived_from_prompt_section_5_summary","evidence_snippet":null,"anchor":true,"batch":"batch_05"}'::jsonb,
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_05_nl_handstand')
ON CONFLICT (source_id, principle_key) DO NOTHING;
