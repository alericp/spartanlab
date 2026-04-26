-- =============================================================================
-- DOCTRINE BATCH 8 — SOURCE REGISTRY
-- =============================================================================
-- Inserts 9 Batch 8 doctrine source registrations into training_doctrine_sources
-- covering FIG MAG Code of Points (rings classification), FIG named elements,
-- advanced isometrics public corpus, iron cross / ring pulling corpus,
-- FitnessFAQs FL/Planche/Row/Push-Up Advanced corpus, GymnasticBodies-style
-- historical strength corpus, the elite-ring-skill source-gap honesty source,
-- the advanced carryover mapping synthesis source, and the advanced onboarding
-- guardrails synthesis source.
--
-- Schema parity with Batches 4/5/6/7. source_type = 'extracted_pdf' to satisfy
-- the existing training_doctrine_sources_source_type_check constraint.
-- Confidence tiers preserved (FIG = 'official'; OGI/OGC/FFA/ESG/ACM/AOG = 'high';
-- GBH = 'medium').
--
-- LEGAL-SOURCE NOTE
-- -----------------
-- No leaked, pirated, or unauthorized paid PDF was ingested for Batch 8. FIG
-- Code of Points and FIG Named Elements are official public gymnastics
-- documents. Advanced isometrics / iron-cross / FitnessFAQs / GymnasticBodies
-- atoms are paraphrased from publicly accessible articles, videos, and free-
-- tier creator content; no paid book contents were transcribed. Where direct
-- elite programming detail would require paid material, the corresponding atom
-- is routed through the elite_ring_skill_source_gap_batch_08 source or marked
-- sourceConfidence = 'gap' / 'medium'.
--
-- The richer ~212-atom Batch 8 set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-08-elite-rings-advanced-calisthenics-doctrine.ts.
-- The runtime per-batch hybrid completeness gate ensures the DB anchor seed
-- below will NOT suppress the in-code fallback.
--
-- Additive only. ON CONFLICT (id) DO NOTHING. No DROP / DELETE / destructive
-- ALTER / TRUNCATE.
-- =============================================================================

INSERT INTO training_doctrine_sources (
  id, source_key, title, source_type, confidence_tier, is_active, created_at, updated_at
) VALUES
  ('src_batch_08_fig_code_of_points_rings',   'fig_mag_code_of_points_rings_batch_08',            'FIG MAG Code of Points - Rings Element Classification',  'extracted_pdf', 'official', TRUE, NOW(), NOW()),
  ('src_batch_08_fig_named_elements_mag',     'fig_named_elements_mens_gymnastics_batch_08',      'FIG Named Elements (Men''s Gymnastics)',                  'extracted_pdf', 'official', TRUE, NOW(), NOW()),
  ('src_batch_08_advanced_isometrics_corpus', 'overcoming_gravity_advanced_isometrics_batch_08',  'Advanced Isometrics Programming (public coaching corpus)', 'extracted_pdf', 'high',     TRUE, NOW(), NOW()),
  ('src_batch_08_iron_cross_corpus',          'overcoming_gravity_iron_cross_batch_08',           'Iron Cross / Ring Pulling Doctrine (public corpus)',      'extracted_pdf', 'high',     TRUE, NOW(), NOW()),
  ('src_batch_08_fitnessfaqs_advanced',       'fitnessfaqs_front_lever_planche_advanced_batch_08', 'FitnessFAQs FL/Planche/Row/Push-Up Advanced (public)',   'extracted_pdf', 'high',     TRUE, NOW(), NOW()),
  ('src_batch_08_gymnasticbodies_historical', 'gymnasticbodies_historical_strength_batch_08',     'GymnasticBodies-style Historical Strength (public)',      'extracted_pdf', 'medium',   TRUE, NOW(), NOW()),
  ('src_batch_08_elite_ring_source_gap',      'elite_ring_skill_source_gap_batch_08',             'Elite Ring Skill Source Gap (governance)',                 'extracted_pdf', 'high',     TRUE, NOW(), NOW()),
  ('src_batch_08_advanced_carryover_mapping', 'advanced_carryover_mapping_batch_08',              'Advanced Carryover Mapping (synthesis)',                   'extracted_pdf', 'high',     TRUE, NOW(), NOW()),
  ('src_batch_08_advanced_onboarding_guards', 'advanced_onboarding_guardrails_batch_08',          'Advanced Onboarding Guardrails (synthesis)',               'extracted_pdf', 'high',     TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
