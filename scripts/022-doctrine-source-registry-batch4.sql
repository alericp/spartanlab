-- =============================================================================
-- DOCTRINE BATCH 4 — SOURCE REGISTRY
-- =============================================================================
--
-- Additive only. Inserts 9 Batch 4 source registry rows. Pattern matches
-- scripts/018 (Batch 2) and scripts/020 (Batch 3). ON CONFLICT DO NOTHING so
-- it is safe to re-run.
--
-- IMPORTANT (read with scripts/023):
-- The full 118-atom Batch 4 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-04-uploaded-pdf-doctrine.ts. This SQL
-- file only seeds the SOURCE REGISTRY so the live DB doctrine audit endpoint
-- can list Batch 4 sources. The runtime completeness gate in
-- lib/doctrine-runtime-contract.ts compares DB atom count vs in-code
-- fallback atom count per batch and uses fallback for any batch where the
-- DB is partial — so a partial DB anchor seed CANNOT silently suppress the
-- richer in-code fallback (the failure mode that previously hid Batch 2 and
-- Batch 3 doctrine despite their SQL seeds existing).
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_04_pull_up_pro_phase_1',
   'pull_up_pro_phase_1_uploaded_pdf_batch_04',
   'Pull-Up Pro Phase 1 (uploaded PDF)',
   'extracted_pdf',
   'One-arm pull-up foundation: two-arm vertical pull, bodyweight rows, hangs, external rotation, biceps, late introduction of assisted one-arm.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_pull_up_pro_phase_2',
   'pull_up_pro_phase_2_uploaded_pdf_batch_04',
   'Pull-Up Pro Phase 2 (uploaded PDF)',
   'extracted_pdf',
   'Assisted one-arm pulling becomes primary; two-arm vertical and rows remain support; scapula pulls / hangs / accessories retained.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_pull_up_pro_phase_3',
   'pull_up_pro_phase_3_uploaded_pdf_batch_04',
   'Pull-Up Pro Phase 3 (uploaded PDF)',
   'extracted_pdf',
   'Eccentric one-arm specialization with one-arm rows and one-arm hangs. Capped volume and long rest. Pain rules block eccentrics.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_mz_weighted_guide',
   'mathew_zlat_weighted_calisthenics_guide_uploaded_pdf_batch_04',
   'Mathew Zlat Weighted Calisthenics Guide (uploaded PDF)',
   'extracted_pdf',
   'Pull-up and dip form standards, grip width, initiation/lockout, swing/kipping bans, weighted load control, normal vs slow lowering.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_mz_weighted_dup',
   'mathew_zlat_weighted_calisthenics_duplicate_batch_04',
   'Mathew Zlat Weighted Duplicate (uploaded PDF)',
   'extracted_pdf',
   'Duplicate confirmation of MZ weighted calisthenics standards. Increases confidence/provenance only; does not duplicate visible volume.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_bws_5day_full_body',
   'bws_5_day_full_body_uploaded_pdf_batch_04',
   'BWS 5-Day Full Body (uploaded PDF)',
   'extracted_pdf',
   '5-day full-body hypertrophy template, 2 rest days, weeks 1-2 acclimation, alternatives only for equipment/injury/preference.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_lever_pro',
   'lever_pro_uploaded_pdf_batch_04',
   'Lever Pro (uploaded PDF)',
   'extracted_pdf',
   'Front lever and back lever doctrine: isometric/dynamic/eccentric methods, scapular cues, dosage tables, individual factors, biceps risk.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_lever_pro_4x',
   'lever_pro_4x_bl_fl_training_uploaded_pdf_batch_04',
   'Lever Pro 4x BL/FL Training (uploaded PDF)',
   'extracted_pdf',
   '4x weekly BL/FL split: separated BL/FL focus days with rest spacing, dosage for holds/pulls/eccentrics/banded holds, accessory mapping.',
   'batch_04_v1',
   TRUE),

  ('src_batch_04_bws_4day_upper_lower',
   'bws_4_day_upper_lower_uploaded_pdf_batch_04',
   'BWS 4-Day Upper/Lower (uploaded PDF)',
   'extracted_pdf',
   '4-day upper/lower template, 3+ rest days, max two consecutive workout days, alternatives only for equipment/injury/preference.',
   'batch_04_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
