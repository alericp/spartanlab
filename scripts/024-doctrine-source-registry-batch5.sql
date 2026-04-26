-- =============================================================================
-- DOCTRINE BATCH 5 — SOURCE REGISTRY
-- =============================================================================
--
-- Additive only. Inserts 9 Batch 5 source registry rows. Pattern matches
-- scripts/018 (Batch 2), 020 (Batch 3), and 022 (Batch 4). ON CONFLICT (id)
-- DO NOTHING so it is safe to re-run.
--
-- IMPORTANT (read with scripts/025):
-- The full 142-atom Batch 5 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-05-uploaded-pdf-doctrine.ts. This SQL
-- file only seeds the SOURCE REGISTRY so the live DB doctrine audit endpoint
-- can list Batch 5 sources. The runtime per-batch completeness gate in
-- lib/doctrine-runtime-contract.ts compares DB atom count vs in-code
-- fallback atom count per batch and uses fallback for any batch where the
-- DB is partial — so anchor-only DB seeds CANNOT silently suppress the
-- richer in-code fallback (the failure mode that previously hid Batch 2/3/4
-- doctrine despite their SQL seeds existing).
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_05_bl_fl_3x_weekly',
   'bl_fl_3x_weekly_training_uploaded_pdf_batch_05',
   'BL/FL 3x Weekly Training (uploaded PDF)',
   'extracted_pdf',
   '3-day BL/FL emphasis: direct lever pulls, holds, eccentrics, 360 pull, 3-min rest on main work, accessory mapping (dragon flag, scap, hyper, biceps, triceps).',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_gladiolus_6day_ppl_arnold',
   'gladiolus_6_day_ppl_arnold_uploaded_pdf_batch_05',
   'Gladiolus 6-Day PPL Arnold (uploaded PDF)',
   'extracted_pdf',
   '6-day push/pull/legs + Arnold hypertrophy split. Informs accessory and high-frequency hypertrophy packaging when recovery and goal support it.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_gladiolus_5day_ppl_ul',
   'gladiolus_5_day_ppl_upper_lower_uploaded_pdf_batch_05',
   'Gladiolus 5-Day PPL Upper/Lower (uploaded PDF)',
   'extracted_pdf',
   '5-day hybrid hypertrophy template combining PPL with upper/lower; informs schedule packaging without overriding skill priority.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_gladiolus_4day_ppl_sh',
   'gladiolus_4_day_push_pull_legs_shoulders_arms_uploaded_pdf_batch_05',
   'Gladiolus 4-Day Push/Pull/Legs/Shoulder-Arms (uploaded PDF)',
   'extracted_pdf',
   '4-day hybrid hypertrophy template; preserves selected skill priority while supplying accessory/upper-isolation structure.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_gladiolus_3day_fb_ul',
   'gladiolus_3_day_full_body_upper_lower_uploaded_pdf_batch_05',
   'Gladiolus 3-Day Full Body Upper/Lower (uploaded PDF)',
   'extracted_pdf',
   '3-day compressed full body / upper / lower template; recombines priority skill work with high-ROI strength/hypertrophy support.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_monster_maker',
   'monster_maker_total_body_muscle_building_uploaded_pdf_batch_05',
   'Monster Maker Total Body Muscle Building (uploaded PDF)',
   'extracted_pdf',
   'Density/circuit hypertrophy doctrine: vertical/horizontal push/pull/leg circuits, 3 rounds, 2:30 cap, 90s round / 3-min between-circuit rest, high-rep specialization.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_nl_theory',
   'nicky_lyan_actual_get_better_calisthenics_uploaded_pdf_batch_05',
   'Nicky Lyan — Actual Get Better at Calisthenics (uploaded PDF)',
   'extracted_pdf',
   'Calisthenics theory: leverage/tension, stimulus + recovery = adaptation, attempts vs training, ugly-to-clean-form progression, V/I/F balance, daily vs long-term.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_nl_start',
   'nicolas_lyan_how_to_start_calisthenics_uploaded_pdf_batch_05',
   'Nicolas Lyan — How to Start Calisthenics (uploaded PDF)',
   'extracted_pdf',
   'Beginner foundations: level 0 baselines (rows, pushups, pull-ups, dips, hollow, toes-to-bar, skin the cat, plank, squats), level system, progression/regression matching.',
   'batch_05_v1',
   TRUE),

  ('src_batch_05_nl_handstand',
   'nicky_lyan_master_the_handstand_uploaded_pdf_batch_05',
   'Nicky Lyan — Master the Handstand (uploaded PDF)',
   'extracted_pdf',
   'Handstand doctrine: form/balance/strength components, 45s high plank prerequisite, joint-stack alignment, offset stack as transitional tool, finger/grip/push/tension cues.',
   'batch_05_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
