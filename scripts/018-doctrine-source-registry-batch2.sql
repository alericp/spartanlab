-- ============================================================================
-- DOCTRINE BATCH 2 — UPLOADED PDF DOCTRINE (SOURCE REGISTRY ONLY)
-- ============================================================================
-- Mirrors the source registrations in
--   lib/doctrine/source-batches/batch-02-uploaded-pdf-doctrine.ts
--
-- The in-code file is the FALLBACK; this SQL seed is the LIVE/PRIMARY truth
-- consumed by lib/doctrine-runtime-contract.ts via lib/doctrine-db.ts.
--
-- Provenance: every row is paraphrased from prompt Section 5 of the
-- "DOCTRINE BATCH 2" prompt. Raw PDFs were not attached. evidence_snippet is
-- intentionally NULL so a future refinement pass can populate verbatim quotes
-- when PDFs are attached.
--
-- Strictly additive. ON CONFLICT DO NOTHING. Idempotent.
-- ============================================================================

BEGIN;

INSERT INTO training_doctrine_sources (
  id, source_key, title, source_type, description, version, is_active,
  ingestion_status, author, primary_domain,
  secondary_domains_json, style_tags_json, athlete_level_bias_json,
  skill_bias_json, equipment_bias_json, program_type_bias_json,
  method_bias_json, confidence_weight_default,
  notes_on_scope, notes_on_limits
) VALUES
  ('src_batch_02_lower_body_a',
   'lower_body_a_uploaded_pdf_batch_02',
   'Lower Body Workout A (uploaded PDF)',
   'extracted_pdf',
   'Bodyweight lower-body progression L1->L3: pistol box -> hand-assisted pistol -> skater squat; calf and posterior accessories with prescribed tempo.',
   'v1', TRUE, 'fully_extracted', NULL, 'progression_selection_logic',
   '["progression_selection_logic","bodyweight_strength","tempo_logic","unilateral_logic"]'::jsonb,
   '["bodyweight","unilateral","tempo","progression_levels"]'::jsonb,
   '["beginner","novice","intermediate","advanced"]'::jsonb,
   '[]'::jsonb,
   '["box","wall","none"]'::jsonb,
   '["upper_lower","full_body","push_pull_legs"]'::jsonb,
   '["straight_set","tempo"]'::jsonb,
   0.8,
   'Lower-body bodyweight progression with explicit level gating.',
   'Must not hijack upper-body skill recovery. Cap sessions/week when primary goal is upper-body skill.'),

  ('src_batch_02_bbr_push_pull',
   'body_by_rings_push_pull_uploaded_pdf_batch_02',
   'Body By Rings Push & Pull Phases (uploaded PDF)',
   'extracted_pdf',
   'Rings hypertrophy push/pull blocks with tempo prescriptions (30X1, 20X0, 30X2). Deload reduces sets while preserving movement identity.',
   'v1', TRUE, 'fully_extracted', NULL, 'rings_hypertrophy',
   '["hypertrophy_logic","tempo_logic","rest_interval_logic","deload_logic","accessory_logic"]'::jsonb,
   '["rings","hypertrophy","tempo","deload"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '["rings_skills"]'::jsonb,
   '["rings"]'::jsonb,
   '["push_pull_legs","upper_lower"]'::jsonb,
   '["straight_set","tempo","superset"]'::jsonb,
   0.8,
   'Rings hypertrophy phasing with prescribed tempo.',
   'Not a replacement for direct planche/front lever specificity.'),

  ('src_batch_02_superhero_origin',
   'superhero_origin_uploaded_pdf_batch_02',
   'Superhero At-Home Foundation (uploaded PDF)',
   'extracted_pdf',
   'Beginner foundation: training + sleep + nutrition. Lifestyle/recovery signals influence readiness and progression.',
   'v1', TRUE, 'fully_extracted', NULL, 'foundation_building',
   '["recovery_logic","nutrition_logic","sleep_logic","progression_logic"]'::jsonb,
   '["foundation","beginner","lifestyle","recovery"]'::jsonb,
   '["beginner","novice"]'::jsonb,
   '[]'::jsonb,
   '["none","minimal","pull_up_bar"]'::jsonb,
   '["full_body","upper_lower"]'::jsonb,
   '["straight_set","circuit"]'::jsonb,
   0.7,
   'Foundation/lifestyle for newer athletes building base.',
   'Lifestyle signals influence dosage; not just educational text.'),

  ('src_batch_02_forearm_health',
   'forearm_health_uploaded_pdf_batch_02',
   'Forearm Health (uploaded PDF, Batch 2 confirmation)',
   'extracted_pdf',
   'Confirms wrist circuit dosage (pronation/extension/supination/flexion, 2x15, short rest). Increases source-confidence; does not duplicate visible blocks.',
   'v1', TRUE, 'fully_extracted', NULL, 'recovery_protection_logic',
   '["accessory_logic","warmup_logic","overuse_risk_logic"]'::jsonb,
   '["prehab","tendon_support","low_volume","duplicate_confirmation"]'::jsonb,
   '["beginner","intermediate","advanced"]'::jsonb,
   '["planche","front_lever","one_arm_pull_up","rings_skills"]'::jsonb,
   '["light_db","band","none"]'::jsonb,
   '["any"]'::jsonb,
   '["paired_set","circuit","superset"]'::jsonb,
   0.85,
   'Confirms Batch 1 forearm prehab dosage.',
   'Does not produce duplicate visible prehab blocks; consolidates with Batch 1.'),

  ('src_batch_02_bbr_arms',
   'body_by_rings_arms_uploaded_pdf_batch_02',
   'Body By Rings Arms L1-L3 (uploaded PDF)',
   'extracted_pdf',
   'Arms accessory progression: pelican curl L1, pelican negative L2, ring support / hanging max holds L3. Tendon/stability gating beyond L1.',
   'v1', TRUE, 'fully_extracted', NULL, 'rings_hypertrophy',
   '["accessory_logic","tendon_loading","tempo_logic","gating_logic"]'::jsonb,
   '["rings","arms","accessory","tendon"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '[]'::jsonb,
   '["rings"]'::jsonb,
   '["push_pull_legs","upper_lower"]'::jsonb,
   '["straight_set","tempo"]'::jsonb,
   0.75,
   'Arms accessory work for rings athletes.',
   'Accessory only unless arm specialization is explicitly selected.'),

  ('src_batch_02_planche',
   'planche_uploaded_pdf_batch_02',
   'From Zero to Full Planche (uploaded PDF)',
   'extracted_pdf',
   'Planche path with stage acclimation (1-2 weeks at ~80% on stage/variant change), pain stop/change rule, band-quality rule, direct + handstand complement, rhythm 3-5 days/week with rest gating.',
   'v1', TRUE, 'fully_extracted', NULL, 'static_skill_mastery',
   '["progression_selection_logic","acclimation_logic","autoregulation_logic","pain_management_logic","carryover_logic"]'::jsonb,
   '["planche","static_skill","straight_arm","band_assistance"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '["planche","handstand"]'::jsonb,
   '["parallettes","bar","bands","rings"]'::jsonb,
   '["full_body","upper_lower","push_pull_legs"]'::jsonb,
   '["straight_set","skill_practice"]'::jsonb,
   0.9,
   'Planche progression and acclimation logic.',
   'Pain is a stop/change signal, not a metric to push through.'),

  ('src_batch_02_novice_weighted',
   'novice_weighted_calisthenics_uploaded_pdf_batch_02',
   'Novice Weighted Calisthenics (uploaded PDF)',
   'extracted_pdf',
   'Weighted dips/pullups 3x/week, 5-8 reps RIR 0-2. Next-session load depends on hardest set + RIR; deload at low rep range; consistency over overmaxing.',
   'v1', TRUE, 'fully_extracted', NULL, 'weighted_calisthenics',
   '["progression_logic","autoregulation_logic","deload_logic","rir_logic","frequency_logic"]'::jsonb,
   '["weighted","linear_progression","autoregulation","novice"]'::jsonb,
   '["novice","intermediate"]'::jsonb,
   '["weighted_pull_up","weighted_dip"]'::jsonb,
   '["pull_up_bar","dip_bars","weight_belt"]'::jsonb,
   '["push_pull_legs","upper_lower","full_body"]'::jsonb,
   '["straight_set"]'::jsonb,
   0.85,
   'Weighted novice progression with rep/RIR autoregulation.',
   'Stay in novice phase as long as productive; switch when deload no longer restores progress.'),

  ('src_batch_02_abs_street_workout',
   'abs_street_workout_uploaded_pdf_batch_02',
   'Abs / Street Workout Circuit Program (uploaded PDF)',
   'extracted_pdf',
   'Circuit method for density/endurance, skill-before-basics ordering, abs spot-fat-loss prevention, walking as low-impact conditioning.',
   'v1', TRUE, 'fully_extracted', NULL, 'circuit_density_logic',
   '["method_logic","ordering_logic","conditioning_logic","misconception_correction_logic"]'::jsonb,
   '["circuit","core","street_workout","conditioning"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '[]'::jsonb,
   '["pull_up_bar","parallettes","ab_wheel","none"]'::jsonb,
   '["full_body","push_pull_legs","upper_lower"]'::jsonb,
   '["circuit","superset","straight_set"]'::jsonb,
   0.75,
   'Circuit method for density/endurance and core training.',
   'Circuit must not be used as default packaging for max skill strength.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
