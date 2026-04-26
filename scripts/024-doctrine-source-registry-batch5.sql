-- ============================================================================
-- 024: Doctrine Source Registry — Batch 5
-- ============================================================================
-- Adds 9 uploaded-PDF doctrine sources for Batch 5:
--   1. BL/FL 3x Weekly Training
--   2. Gladiolus 6-Day PPL Arnold
--   3. Gladiolus 5-Day PPL + Upper/Lower
--   4. Gladiolus 4-Day Push/Pull/Legs/Shoulder-Arms
--   5. Gladiolus 3-Day Full Body + Upper/Lower
--   6. Monster Maker Total Body Muscle Building
--   7. Nicky Lyan: Actually Get Better at Calisthenics (theory/recovery)
--   8. Nicolas Lyan: How to Start Calisthenics (foundations)
--   9. Nicky Lyan: Master the Handstand
--
-- The richer 142-atom Batch 5 set lives in
-- `lib/doctrine/source-batches/batch-05-uploaded-pdf-doctrine.ts`.
-- This file seeds source registry rows. Atom anchors land in 025.
--
-- Additive only:
--   • INSERT only
--   • ON CONFLICT (source_key) DO NOTHING
--   • No DROP / ALTER / DELETE / TRUNCATE
--
-- The runtime DB/fallback completeness gate
-- (`lib/doctrine-runtime-contract.ts`) compares per-batch DB atom counts
-- against in-code fallback atom counts. Even after this script runs, the
-- DB will hold only representative anchor atoms for Batch 5 (script 025);
-- the per-batch gate ensures the richer in-code fallback fills missing
-- atoms via `hybrid_db_plus_uploaded_fallback` source mode.
-- ============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, confidence_tier, is_active, created_at, updated_at)
VALUES
  ('src_batch_05_bl_fl_3x_weekly',          'bl_fl_3x_weekly_training_uploaded_pdf_batch_05',                'BL/FL 3x Weekly Training',           'high', true, NOW(), NOW()),
  ('src_batch_05_gladiolus_6day_ppl_arnold', 'gladiolus_6_day_ppl_arnold_uploaded_pdf_batch_05',              'Gladiolus 6-Day PPL Arnold',         'high', true, NOW(), NOW()),
  ('src_batch_05_gladiolus_5day_ppl_ul',     'gladiolus_5_day_ppl_upper_lower_uploaded_pdf_batch_05',         'Gladiolus 5-Day PPL + Upper/Lower',  'high', true, NOW(), NOW()),
  ('src_batch_05_gladiolus_4day_ppl_sh',     'gladiolus_4_day_push_pull_legs_shoulders_arms_uploaded_pdf_batch_05', 'Gladiolus 4-Day P/P/L/Sh-Arms', 'high', true, NOW(), NOW()),
  ('src_batch_05_gladiolus_3day_fb_ul',      'gladiolus_3_day_full_body_upper_lower_uploaded_pdf_batch_05',   'Gladiolus 3-Day Full Body + U/L',    'high', true, NOW(), NOW()),
  ('src_batch_05_monster_maker',             'monster_maker_total_body_muscle_building_uploaded_pdf_batch_05', 'Monster Maker Total Body',           'high', true, NOW(), NOW()),
  ('src_batch_05_nl_theory',                 'nicky_lyan_actual_get_better_calisthenics_uploaded_pdf_batch_05', 'Nicky Lyan: Actually Get Better',    'high', true, NOW(), NOW()),
  ('src_batch_05_nl_start',                  'nicolas_lyan_how_to_start_calisthenics_uploaded_pdf_batch_05',   'Nicolas Lyan: How to Start',         'high', true, NOW(), NOW()),
  ('src_batch_05_nl_handstand',              'nicky_lyan_master_the_handstand_uploaded_pdf_batch_05',          'Nicky Lyan: Master the Handstand',   'high', true, NOW(), NOW())
ON CONFLICT (source_key) DO NOTHING;
