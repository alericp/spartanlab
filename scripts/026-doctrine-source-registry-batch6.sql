-- =============================================================================
-- DOCTRINE BATCH 6 — SOURCE REGISTRY
-- =============================================================================
--
-- Additive only. Inserts 7 Batch 6 source registry rows. Pattern matches
-- scripts/022 (Batch 4) and scripts/024 (Batch 5). ON CONFLICT (id) DO NOTHING
-- so it is safe to re-run.
--
-- IMPORTANT (read with scripts/027):
-- The full 176-atom Batch 6 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-06-uploaded-pdf-doctrine.ts. This SQL
-- file only seeds the SOURCE REGISTRY so the live DB doctrine audit endpoint
-- can list Batch 6 sources. The runtime completeness gate in
-- lib/doctrine-runtime-contract.ts compares DB atom count vs in-code
-- fallback atom count per batch and uses fallback for any batch where the
-- DB is partial — so a partial DB anchor seed CANNOT silently suppress the
-- richer in-code fallback.
--
-- LEGAL SOURCE GATE: every Batch 6 source carries `sourceLegalityStatus =
-- user_uploaded_owned` in the in-code metadata. Leaked / pirated /
-- low-trust / unknown-status sources MUST NOT appear here.
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_06_otz_beginner',
   'otz_beginner_training_structure_uploaded_pdf_batch_06',
   'OTZ Beginner Training Structure (uploaded PDF)',
   'extracted_pdf',
   'Beginner planche/front lever programming with main/secondary goal time blocks (3x20 min main, ~30 min secondary), basics support, and time-block math.',
   'batch_06_v1',
   TRUE),

  ('src_batch_06_otz_intermediate',
   'otz_intermediate_training_structure_uploaded_pdf_batch_06',
   'OTZ Intermediate Training Structure (uploaded PDF)',
   'extracted_pdf',
   'Intermediate volume vs intensity separation for planche/front lever, ~30 min volume + ~30 min intensity, capped assistance, time-block math.',
   'batch_06_v1',
   TRUE),

  ('src_batch_06_davai_iron_cross',
   'davai_iron_cross_dailong_huynh_uploaded_pdf_batch_06',
   'Davai Iron Cross — Dailong Huynh (uploaded PDF)',
   'extracted_pdf',
   'Iron Cross programming: technique (straight arm, vertical body, shoulders near wrist), elbow/shoulder safety, frequency cap, four-week technique/volume/resistance/rest cycle, level ladder, Azarian/Nakayama gating.',
   'batch_06_v1',
   TRUE),

  ('src_batch_06_otz_full_planche',
   'valentin_otz_full_planche_uploaded_pdf_batch_06',
   'Valentin OTZ Full Planche (uploaded PDF)',
   'extracted_pdf',
   'Self-customizable full planche progression: stage selection by ability, deficiency-based format triage (strength/endurance/control/form/assisted/combinations), volume-form alternation, wrist pressure, pain handling.',
   'batch_06_v1',
   TRUE),

  ('src_batch_06_davai_front_lever',
   'davai_front_lever_flolit_uploaded_pdf_batch_06',
   'Davai/Flolit Front Lever (uploaded PDF)',
   'extracted_pdf',
   'Front lever doctrine: 4-level progression (0-15 pullups → tuck → advanced tuck → bad-form → clean), technique standard (horizontal body, scap retraction), method variation, transition-period 80% rule.',
   'batch_06_v1',
   TRUE),

  ('src_batch_06_nl_muscle_up',
   'nicolas_lyan_master_muscle_up_uploaded_pdf_batch_06',
   'Nicolas Lyan: Master the Muscle-Up (uploaded PDF)',
   'extracted_pdf',
   'Muscle-up doctrine: prerequisites (5 chest-to-bar pulls, 8-10 straight-bar dips), curved path around bar, up-and-out pull, sweet-spot timing, technique vs strength bottleneck classification.',
   'batch_06_v1',
   TRUE),

  ('src_batch_06_legal_source_gate',
   'legal_advanced_skill_source_gate_batch_06',
   'Legal Advanced-Skill Source Gate (governance)',
   'extracted_pdf',
   'Source-legality governance: only user_uploaded_owned, official_free_creator_published, official_paid_user_owned, public_sample_creator_released, or user_summary_only sources may be active. Leaked/pirated/low-trust/unknown sources are rejected.',
   'batch_06_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
