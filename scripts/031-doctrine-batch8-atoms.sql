-- =============================================================================
-- DOCTRINE BATCH 8 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 8 source (9 total). The full
-- ~212-atom Batch 8 set lives in the in-code fallback at:
--   lib/doctrine/source-batches/batch-08-elite-rings-advanced-calisthenics-doctrine.ts
-- and is surfaced through the unified uploaded-PDF aggregator.
--
-- Why anchors-only is safe:
--   The runtime contract uses a PER-BATCH completeness gate that compares
--   DB atoms vs in-code fallback atoms for each batch and uses fallback for
--   any batch where DB is partial. Source mode becomes
--   `hybrid_db_plus_uploaded_fallback`. See:
--     lib/doctrine-runtime-contract.ts → DOCTRINE-DB-FALLBACK-COMPLETENESS-GATE
--     app/(app)/program/page.tsx       → DoctrineRuntimeProof completenessLine
--
-- LEGAL SOURCE GATE: every Batch 8 atom carries source legality metadata in
-- tags_json. FIG = official; corpus paraphrase = high; source-gap rows are
-- explicitly recorded so the builder cannot prescribe invented elite work.
--
-- Each insert guarded by EXISTS so it skips silently if the matching Batch 8
-- source row from scripts/030 isn't present yet.
-- =============================================================================

-- 1) FIG Code of Points (rings) — official classification, not prescription
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_fig_code_of_points_rings',
  'fig_classification',
  'fcp_official_classification_principle',
  'FIG Code of Points classifies, does not prescribe',
  'Official rings element classification confirms a skill exists and its difficulty group, but classification alone does not authorize direct training prescription.',
  '["intermediate","advanced","elite"]'::jsonb,
  '["rings_skills","still_rings_strength","elite_skill_classification"]'::jsonb,
  '["fig_classification","official_source","not_prescription","sourceConfidence_official","sourceLegalityStatus_public_official"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_fig_code_of_points_rings')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) FIG Named Elements — recognition, not method
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_fig_named_elements_mag',
  'fig_named_elements',
  'fne_named_element_principle',
  'Named elements confirm existence, not method',
  'Skills attributed to named gymnasts (Azarian, Nakayama, Yamawaki, etc.) are recognized elements, but recognition is not training prescription.',
  '["advanced","elite"]'::jsonb,
  '["rings_transitions","azarian","nakayama"]'::jsonb,
  '["fig_named_elements","azarian_classified","nakayama_classified","sourceConfidence_official","sourceLegalityStatus_public_official"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_fig_named_elements_mag')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Advanced Isometrics Programming — weakness identification first
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_advanced_isometrics_corpus',
  'advanced_isometric_programming',
  'ogi_weakness_first_principle',
  'Identify the weakest link before adding volume',
  'Plateau on advanced isometrics (planche, FL, BL, cross) is broken by identifying the limiting factor (lever shape, scapular position, straight-arm strength, time-under-tension) and training that factor specifically — not by adding generic volume.',
  '["intermediate","advanced","elite"]'::jsonb,
  '["planche","front_lever","back_lever","iron_cross","advanced_isometrics"]'::jsonb,
  '["isometrics","weakness_first","plateau_management","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_advanced_isometrics_corpus')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Iron Cross / Ring Pulling — connective tissue progression
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_iron_cross_corpus',
  'iron_cross_ring_pulling',
  'ogc_connective_tissue_pacing',
  'Iron cross and ring pulling adapt slower than muscle',
  'Cross/ring pulling/straight-arm work loads tendons and ligaments more aggressively than typical hypertrophy. Progress slowly even when muscular strength feels ready; ring transitions (Azarian, Nakayama) require this conditioning as prerequisite.',
  '["advanced","elite"]'::jsonb,
  '["iron_cross","rings","ring_transitions","azarian","nakayama"]'::jsonb,
  '["iron_cross","tendon_pacing","slow_adaptation","ring_pulling","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_iron_cross_corpus')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) FitnessFAQs FL/Planche/Row/Push-Up Advanced — leverage staging
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_fitnessfaqs_advanced',
  'advanced_calisthenics_skill',
  'ffa_lever_shape_progression',
  'Front lever rows and planche push-ups stage by lever shape',
  'FL row and planche push-up progression follows lever shape (tuck → advanced tuck → straddle → full), not arbitrary rep count. Hip pike, momentum, and shape break invalidate the progression.',
  '["intermediate","advanced","elite"]'::jsonb,
  '["front_lever_row","planche_push_up","press_to_planche"]'::jsonb,
  '["lever_shape","progression_staging","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_fitnessfaqs_advanced')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) GymnasticBodies-style Historical Strength — secondary support, not sole source
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_gymnasticbodies_historical',
  'gymnastics_historical_strength',
  'gbh_secondary_support_only',
  'Historical perspective supports prerequisite logic, never sole source',
  'Coach Sommer / GymnasticBodies-style historical perspective on rings strength supports prerequisite logic and progression caution but is never the sole source for elite prescription (Victorian, Maltese, Azarian, Nakayama).',
  '["intermediate","advanced","elite"]'::jsonb,
  '["rings","planche","front_lever","maltese","victorian","historical_strength"]'::jsonb,
  '["historical_strength","secondary_support","not_sole_source","sourceConfidence_medium","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 1.0, 'recommendation', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_gymnasticbodies_historical')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Elite Ring Skill Source Gap — honesty layer, blocks invented prescription
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_elite_ring_source_gap',
  'elite_skill_source_gap',
  'esg_no_invented_doctrine_principle',
  'Source-gap skills must not receive invented prescription',
  'Victorian, one-arm back lever, one-arm front lever row, Azarian, and Nakayama lack trusted direct training doctrine in the current source base. They MUST be classified SOURCE_GAP_UNSUPPORTED and trained only through prerequisite carryover, never invented progressions.',
  '["intermediate","advanced","elite"]'::jsonb,
  '["victorian","one_arm_back_lever","one_arm_front_lever_row","azarian","nakayama"]'::jsonb,
  '["source_gap","no_invented_doctrine","carryover_only","sourceConfidence_gap","sourceLegalityStatus_governance"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 2
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_elite_ring_source_gap')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Advanced Carryover Mapping — carryover is not direct
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_advanced_carryover_mapping',
  'advanced_carryover_mapping',
  'acm_carryover_not_direct_principle',
  'Carryover preparation must not be relabeled as direct training',
  'When advanced skills (Victorian, Maltese, OAFL, OABL, full planche push-up, press-to-planche, Azarian, Nakayama) are represented only by prerequisite carryover, the program label MUST say carryover preparation, never direct skill training.',
  '["intermediate","advanced","elite"]'::jsonb,
  '["victorian","maltese","one_arm_front_lever","one_arm_back_lever","azarian","nakayama","full_planche_push_up","press_to_planche"]'::jsonb,
  '["carryover_mapping","not_direct","label_truth","sourceConfidence_high","sourceLegalityStatus_original_synthesis"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_advanced_carryover_mapping')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Advanced Onboarding Guardrails — long-term goal without unsafe direct training
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_08_advanced_onboarding_guards',
  'advanced_onboarding_guardrails',
  'aog_optional_advanced_layer_principle',
  'Elite skills live behind an optional skippable advanced layer',
  'Future onboarding stores elite skills (Victorian, Maltese, OAFL, OABL, Azarian, Nakayama, full planche push-up, press-to-planche, archer pathways) as optional skippable long-term goals under foundational families. If prerequisites are not met, save the goal but never prescribe direct elite work.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["onboarding","advanced_skill_layer","long_term_goal_safety"]'::jsonb,
  '["onboarding_guardrails","optional_advanced_layer","goal_without_unsafe_prescription","sourceConfidence_high","sourceLegalityStatus_original_synthesis"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_advanced_onboarding_guards')
ON CONFLICT (source_id, principle_key) DO NOTHING;
