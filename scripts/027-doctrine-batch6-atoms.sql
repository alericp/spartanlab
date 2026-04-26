-- =============================================================================
-- DOCTRINE BATCH 6 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 6 source. The full Batch 6
-- atom set (176 atoms across 7 sources, distributed over principles,
-- progression, selection, method, prescription, and carryover) lives in the
-- in-code fallback at:
--   lib/doctrine/source-batches/batch-06-uploaded-pdf-doctrine.ts
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
-- LEGAL SOURCE GATE: every Batch 6 atom carries
-- `sourceLegalityStatus = user_uploaded_owned` in tags_json. Future advanced-
-- skill enrichment must use legal sources only — leaked/pirated/low-trust
-- material is rejected at the in-code source level.
--
-- Provenance: derived_from_uploaded_pdf_summary. Raw PDFs not attached.
-- Each insert guarded by EXISTS so it skips silently if the matching Batch 6
-- source row from scripts/026 isn't present yet.
-- =============================================================================

-- 1) OTZ Beginner Training Structure
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_otz_beginner',
  'beginner_training_structure',
  'beginner_main_secondary_time_alloc',
  'Beginner: main goal across 3x20-min blocks, secondary ~30 min',
  'Beginner plans with main + secondary skill goals allocate the main goal across multiple ~20-minute blocks and ~30 minutes for secondary, plus ~10 min warm-up and basics support.',
  '["beginner"]'::jsonb,
  '["planche","front_lever","skill_foundation"]'::jsonb,
  '["beginner","time_block","main_secondary","derived_from_uploaded_pdf_summary","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_otz_beginner')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) OTZ Intermediate Training Structure
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_otz_intermediate',
  'intermediate_training_structure',
  'intermediate_volume_intensity_separated',
  'Intermediate: volume and intensity blocks must be separated',
  'Intermediate sessions schedule volume work (~30 min, assistance allowed) and intensity work (~30 min, clean form, max attempts) as conceptually separate blocks.',
  '["intermediate"]'::jsonb,
  '["planche","front_lever","skill_strength"]'::jsonb,
  '["intermediate","volume_intensity_split","derived_from_uploaded_pdf_summary","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_otz_intermediate')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Davai Iron Cross
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_davai_iron_cross',
  'iron_cross',
  'iron_cross_advanced_safety_gate',
  'Iron Cross is advanced and gated by elbow/shoulder safety',
  'Iron Cross stresses lats/chest/straight-arm strength under major elbow and shoulder pressure. Conditioning, warm-up, mobility, and strict technique are mandatory; frequency capped at 1x/week default, 3x/week max.',
  '["advanced"]'::jsonb,
  '["iron_cross","ring_strength","straight_arm"]'::jsonb,
  '["iron_cross","safety_gate","frequency_cap","derived_from_uploaded_pdf_summary","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_davai_iron_cross')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Valentin OTZ Full Planche
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_otz_full_planche',
  'full_planche',
  'planche_stage_and_volume_form_cycle',
  'Full planche: start at current stage; alternate volume production and form correction',
  'Planche progression starts at the stage matching current ability. Strength produces volume first, form is corrected to that volume, then volume is raised again. Bodyweight intensity equals execution quality.',
  '["intermediate","advanced"]'::jsonb,
  '["planche","skill_strength","skill_form"]'::jsonb,
  '["planche","stage_selection","volume_form_cycle","derived_from_uploaded_pdf_summary","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_otz_full_planche')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) Davai/Flolit Front Lever
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_davai_front_lever',
  'front_lever',
  'front_lever_level_and_technique_gate',
  'Front lever: level matches current ability; technique is non-negotiable',
  'Front lever progression uses 4 levels: 0-15 pullups → tuck → advanced tuck → bad-form → clean. Technique standard (horizontal body, scapular retraction, shoulder-width grip) is a hard constraint; pain stops or changes the work.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["front_lever","straight_arm","back_strength"]'::jsonb,
  '["front_lever","level_gate","technique_gate","pain_stop","derived_from_uploaded_pdf_summary","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_davai_front_lever')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) Nicolas Lyan Master the Muscle-Up
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_nl_muscle_up',
  'muscle_up',
  'muscle_up_prereq_and_two_domain',
  'Muscle-up: prerequisites and technique-vs-strength classification',
  'Muscle-up requires 5 chest-to-bar pulls and 8-10 straight-bar dips before learning. It is one curved path around the bar (up-and-out pull), and weakness must be classified as technique/path/timing OR strength.',
  '["intermediate","advanced"]'::jsonb,
  '["muscle_up","pulling","dip_strength","bar_transition"]'::jsonb,
  '["muscle_up","prerequisite","two_domain","curved_path","derived_from_uploaded_pdf_summary","sourceLegalityStatus_user_uploaded_owned"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_nl_muscle_up')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Legal Advanced-Skill Source Gate (governance)
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_06_legal_source_gate',
  'legal_source_gate',
  'legal_source_gate_active',
  'Legal source gate: only legally usable sources may activate',
  'Active doctrine atoms must come from legally usable sources (user_uploaded_owned, official_free_creator_published, official_paid_user_owned, public_sample_creator_released, or user_summary_only). Leaked, pirated, low-trust, and unknown-status sources are rejected and never activated.',
  '["beginner","intermediate","advanced"]'::jsonb,
  '["governance"]'::jsonb,
  '["legal_source_gate","governance","leaked_rejected","low_trust_rejected","derived_from_uploaded_pdf_summary"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 2
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_06_legal_source_gate')
ON CONFLICT (source_id, principle_key) DO NOTHING;
