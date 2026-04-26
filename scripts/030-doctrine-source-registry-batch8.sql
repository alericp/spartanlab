-- =============================================================================
-- DOCTRINE BATCH 8 — SOURCE REGISTRY
-- =============================================================================
-- Inserts 9 Batch 8 doctrine source registry rows. Pattern matches scripts/022
-- (Batch 4), scripts/024 (Batch 5), scripts/026 (Batch 6), scripts/028 (Batch 7).
-- Uses the exact column shape (id, source_key, title, source_type, description,
-- version, is_active) — confidence_tier is NOT a real column and lives in the
-- in-code metadata only.
--
-- ON CONFLICT (id) DO NOTHING so it is safe to re-run.
--
-- IMPORTANT (read with scripts/031):
-- The full ~212-atom Batch 8 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-08-elite-rings-advanced-calisthenics-doctrine.ts.
-- This SQL only seeds the SOURCE REGISTRY so the live DB doctrine audit
-- endpoint can list Batch 8 sources. The runtime per-batch completeness gate
-- in lib/doctrine-runtime-contract.ts compares DB atom count vs in-code
-- fallback atom count per batch and uses fallback for any batch where DB is
-- partial — so a partial DB anchor seed CANNOT silently suppress the richer
-- in-code fallback.
--
-- LEGAL-SOURCE GATE: every Batch 8 source carries `sourceLegalityStatus =
-- public_official` or `public_paraphrased` or `original_synthesis` in the
-- in-code metadata. FIG Code of Points and FIG Named Elements are official
-- public gymnastics documents. Advanced isometrics / iron-cross / FitnessFAQs
-- / GymnasticBodies atoms are paraphrased from publicly accessible articles,
-- videos, and free-tier creator content; no paid book contents were
-- transcribed. Where direct elite programming detail would require paid
-- material, the corresponding atom is routed through
-- elite_ring_skill_source_gap_batch_08 with sourceConfidence = 'gap' so the
-- builder cannot prescribe invented elite progressions.
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_08_fig_code_of_points_rings',
   'fig_mag_code_of_points_rings_batch_08',
   'FIG MAG Code of Points - Rings Element Classification',
   'extracted_pdf',
   'Official FIG MAG Code of Points: still rings element classification, difficulty values, 2-second hold standard. Confidence: official. Classification only — does not authorize direct programming.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_fig_named_elements_mag',
   'fig_named_elements_mens_gymnastics_batch_08',
   'FIG Named Elements (Men''s Gymnastics)',
   'extracted_pdf',
   'Official FIG named element tables (Azarian, Nakayama, Yamawaki, Honma, etc.). Confidence: official. Validates existence/elite classification of named transitions; does not authorize direct programming.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_advanced_isometrics_corpus',
   'overcoming_gravity_advanced_isometrics_batch_08',
   'Advanced Isometrics Programming (public coaching corpus)',
   'extracted_pdf',
   'Steven Low / Overcoming Gravity-style public-domain doctrine for advanced isometric training: weakness identification, exercise category separation, plateau management, connective tissue progression. Confidence: high. Public articles/videos only; no paid book transcription.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_iron_cross_corpus',
   'overcoming_gravity_iron_cross_batch_08',
   'Iron Cross / Ring Pulling Doctrine (public corpus)',
   'extracted_pdf',
   'Public coaching corpus on iron cross and ring pulling: tendon stress management, support strength, slow transition control, high-risk straight-arm training. Confidence: high. Validates ring transition prerequisites; does not authorize direct Azarian/Nakayama/Victorian/Maltese prescription.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_fitnessfaqs_advanced',
   'fitnessfaqs_front_lever_planche_advanced_batch_08',
   'FitnessFAQs FL/Planche/Row/Push-Up Advanced (public)',
   'extracted_pdf',
   'Public FitnessFAQs-style coaching: front lever, planche, front lever rows, planche push-up progressions, calisthenics-skill-specific staging. Confidence: high. Direct doctrine for FL row + planche push-up + press-to-planche carryover; not a substitute for FIG/Sommer source.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_gymnasticbodies_historical',
   'gymnasticbodies_historical_strength_batch_08',
   'GymnasticBodies-style Historical Strength (public)',
   'extracted_pdf',
   'Coach Sommer / GymnasticBodies-style public-domain perspective on rings strength, historical gymnastics strength, leverage logic, progression caution. Confidence: medium. Secondary support only; never the sole source for elite prescription.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_elite_ring_source_gap',
   'elite_ring_skill_source_gap_batch_08',
   'Elite Ring Skill Source Gap (governance)',
   'extracted_pdf',
   'Honest source-gap governance: Victorian, one-arm back lever, Azarian, Nakayama, one-arm front lever row direct programming is NOT supported by current trusted sources. Confidence: gap. Forces SOURCE_GAP_UNSUPPORTED handling and prevents invented progressions.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_advanced_carryover_mapping',
   'advanced_carryover_mapping_batch_08',
   'Advanced Carryover Mapping (synthesis)',
   'extracted_pdf',
   'Original synthesis mapping advanced skills (Victorian, Maltese, OAFL, OABL, Azarian, Nakayama, full planche push-up, press-to-planche) to source-backed prerequisites and carryover work. Confidence: high. Carryover labeled carryover, never relabeled as direct.',
   'batch_08_v1',
   TRUE),

  ('src_batch_08_advanced_onboarding_guards',
   'advanced_onboarding_guardrails_batch_08',
   'Advanced Onboarding Guardrails (synthesis)',
   'extracted_pdf',
   'Future onboarding doctrine ONLY (no UI implementation): optional skippable advanced layer, dropdown sub-goals under foundational families, prerequisite warning copy, long-term-goal-without-direct-prescription rule. Confidence: high.',
   'batch_08_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
