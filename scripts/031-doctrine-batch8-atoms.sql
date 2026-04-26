-- =============================================================================
-- DOCTRINE BATCH 8 — ANCHOR ATOM SEEDS (training_doctrine_principles)
-- =============================================================================
-- Inserts 9 representative principle anchor atoms (one per Batch 8 source) into
-- training_doctrine_principles. Schema-aligned to Batches 4/5/6/7's proven
-- column shape (jsonb scopes, is_base_intelligence, doctrine_family NOT NULL,
-- priority_type IN ('hard_constraint','soft_preference','recommendation'),
-- priority_weight 0..2 via safety_priority).
--
-- The richer ~212-atom Batch 8 set lives in the in-code fallback. The per-
-- batch hybrid completeness gate guarantees the 9-anchor DB seed will NOT
-- suppress the in-code fallback, because the runtime gate compares dbTotal vs
-- fallbackTotal per batch and falls back when dbTotal < fallbackTotal.
--
-- Each insert is guarded by EXISTS so it skips silently if the matching Batch
-- 8 source row from script 030 isn't present. Additive only,
-- ON CONFLICT (source_id, principle_key) DO NOTHING. No DROP / DELETE /
-- destructive ALTER / TRUNCATE.
--
-- LEGAL-SOURCE NOTE
-- -----------------
-- No leaked / pirated / unauthorized paid PDFs were ingested. FIG sources are
-- official public docs; corpus sources are paraphrased from publicly accessible
-- creator content; source-gap honesty + carryover mapping + onboarding
-- guardrails are original synthesis recorded honestly.
-- =============================================================================

-- 1. FIG Code of Points - Rings Classification anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_fig_code_of_points_rings',
  'fcp_official_classification_principle',
  'FIG Code of Points classifies, does not prescribe',
  'Official rings element classification confirms a skill exists and its difficulty group, but classification alone does not authorize direct training prescription.',
  'fig_classification', 'hard_constraint', 2,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Official classification confirmed; direct programming requires coaching source support',
    'sourceConfidence', 'official',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_fig_code_of_points_rings')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2. FIG Named Elements anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_fig_named_elements_mag',
  'fne_named_element_principle',
  'Named elements confirm existence, not method',
  'Skills attributed to named gymnasts (Azarian, Nakayama, Yamawaki, etc.) are recognized elements, but recognition is not training prescription.',
  'fig_named_elements', 'soft_preference', 1,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Azarian classified as elite rings transition',
    'sourceConfidence', 'official',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_fig_named_elements_mag')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3. Advanced Isometrics Programming anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_advanced_isometrics_corpus',
  'ogi_weakness_first_principle',
  'Identify the weakest link before adding volume',
  'Advanced isometric progress stalls when volume is added before weakness identification; address the limiting factor (mobility, scapular control, straight-arm tendons, leverage) first.',
  'advanced_isometrics', 'soft_preference', 2,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Connective tissue adaptation controls progression speed',
    'sourceConfidence', 'high',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_advanced_isometrics_corpus')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4. Iron Cross / Ring Pulling anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_iron_cross_corpus',
  'ogc_cross_high_risk_principle',
  'Iron cross is high tendon-load and high biceps stress',
  'Cross loading concentrates torque at the biceps tendon and elbow; progression must respect biceps tendon adaptation.',
  'iron_cross_doctrine', 'soft_preference', 2,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Connective tissue adaptation controls progression speed',
    'sourceConfidence', 'high',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_iron_cross_corpus')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5. FitnessFAQs FL/Planche/Row/Push-Up Advanced anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_fitnessfaqs_advanced',
  'ffa_protraction_principle',
  'Scapular protraction is the planche signature',
  'Planche progressions live or die by scapular protraction strength; weak protraction is the most common planche limiter.',
  'fl_planche_advanced', 'soft_preference', 1,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Planche push-up gated by hold + press readiness',
    'sourceConfidence', 'high',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_fitnessfaqs_advanced')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6. GymnasticBodies-style Historical Strength anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_gymnasticbodies_historical',
  'gbh_long_timeline_principle',
  'Elite ring strength has historically taken years',
  'Public coaching commentary repeatedly emphasizes that elite ring strength (Maltese, Victorian) is a multi-year goal, not a multi-month one.',
  'historical_strength', 'soft_preference', 1,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Connective tissue adaptation controls progression speed',
    'sourceConfidence', 'medium',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_gymnasticbodies_historical')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7. Elite Ring Skill Source Gap anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_elite_ring_source_gap',
  'esg_source_gap_principle',
  'Source gap is recorded honestly, never papered over',
  'When SpartanLab lacks trusted direct doctrine for an elite skill, that gap is recorded as data, not hidden behind generic content.',
  'source_gap_honesty', 'hard_constraint', 2,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Direct doctrine gap detected; using prerequisite/carryover only',
    'sourceConfidence', 'high',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_elite_ring_source_gap')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8. Advanced Carryover Mapping anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_advanced_carryover_mapping',
  'acm_carryover_principle',
  'Direct vs carryover is a programming truth axis',
  'Every advanced-skill prescription is either direct (skill is trained as itself) or carryover (skill is trained through prerequisites). The doctrine never blurs the line.',
  'advanced_carryover', 'hard_constraint', 2,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Advanced skill represented through prerequisite carryover, not direct prescription',
    'sourceConfidence', 'high',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_advanced_carryover_mapping')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9. Advanced Onboarding Guardrails anchor
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  doctrine_family, priority_type, safety_priority,
  is_base_intelligence, is_phase_modulation, applies_when_json,
  does_not_apply_when_json, tags_json, created_at, updated_at
)
SELECT
  'src_batch_08_advanced_onboarding_guards',
  'aog_optional_advanced_layer_principle',
  'Advanced skills live in an optional skippable layer',
  'Future onboarding should expose advanced skills (Victorian, Maltese, OAFL, OABL, Azarian, Nakayama, full planche pushup, press-to-planche, OAFL row) only as optional sub-goals, never as default selections.',
  'onboarding_guardrails', 'soft_preference', 1,
  TRUE, FALSE, '{}'::jsonb, '{}'::jsonb,
  jsonb_build_object(
    'provenance', 'derived_from_public_creator_content_and_original_synthesis',
    'evidence_snippet', NULL,
    'sourceLegalityStatus', 'official_free_creator_published',
    'userVisibleEvidenceLabel', 'Advanced goal saved without forcing unsafe direct training',
    'sourceConfidence', 'high',
    'inventingAllowed', FALSE
  ),
  NOW(), NOW()
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_08_advanced_onboarding_guards')
ON CONFLICT (source_id, principle_key) DO NOTHING;
