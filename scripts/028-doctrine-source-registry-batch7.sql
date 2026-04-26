-- =============================================================================
-- DOCTRINE BATCH 7 — SOURCE REGISTRY
-- =============================================================================
--
-- Additive only. Inserts 12 Batch 7 source registry rows. Pattern matches
-- scripts/022 (Batch 4), scripts/024 (Batch 5), and scripts/026 (Batch 6).
-- ON CONFLICT (id) DO NOTHING so it is safe to re-run.
--
-- IMPORTANT (read with scripts/029):
-- The full 212-atom Batch 7 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-07-lower-body-military-doctrine.ts.
-- This SQL file only seeds the SOURCE REGISTRY so the live DB doctrine audit
-- endpoint can list Batch 7 sources. The runtime per-batch completeness
-- gate in lib/doctrine-runtime-contract.ts compares DB atom count vs
-- in-code fallback atom count per batch and uses fallback for any batch
-- where DB is partial — so a partial DB anchor seed CANNOT silently
-- suppress the richer in-code fallback.
--
-- LEGAL SOURCE GATE: every Batch 7 source carries `sourceLegalityStatus =
-- user_uploaded_owned` in the in-code metadata. All sources are public
-- branch fitness standards (USMC/Army/Navy/AF/SF), public training-science
-- fundamentals, or original synthesis. No leaked / pirated paid PDFs were
-- ingested for Batch 7.
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_07_lower_body_skill_foundations',
   'lower_body_skill_foundations_batch_07',
   'Lower-Body Skill Foundations',
   'extracted_pdf',
   'Pistol/shrimp/skater/split squat progressions with control-gated readiness, knee-friendly defaults, and balance prerequisites.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_dragon_squat_skill',
   'dragon_squat_skill_batch_07',
   'Dragon Squat Skill',
   'extracted_pdf',
   'Dragon-squat / dragon-pistol mobility-and-control gated progression with eccentric-first introduction and load lockout until clean control.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_lower_body_strength_hyper',
   'lower_body_strength_hypertrophy_batch_07',
   'Lower-Body Strength / Hypertrophy',
   'extracted_pdf',
   'Squat/hinge balance, unilateral inclusion, calf/ankle/foot durability, double-progression dose, and form-cap (no failure) rules.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_skill_interference_leg_dose',
   'calisthenics_skill_interference_leg_dose_batch_07',
   'Calisthenics Skill Interference / Leg Dose',
   'extracted_pdf',
   'Leg-training preference governance (no/minimal/regular/tactical), skill-day soreness buffer, no-leg imbalance warning, tactical no-leg warning.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_military_fitness_foundation',
   'military_fitness_test_foundation_batch_07',
   'Military Fitness Test Foundation',
   'extracted_pdf',
   'Test-specificity, weakest-event priority, no-smoke-session rule, taper, periodized base/build/specific/taper, no-daily-max rule.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_army_aft_tactical_prep',
   'army_aft_tactical_prep_batch_07',
   'Army AFT/ACFT-style Tactical Prep',
   'extracted_pdf',
   'Deadlift strength, hand-release push-up endurance, sprint-drag-carry/shuttle anaerobic power, plank/leg-tuck core, 2-mile run; test-order fatigue rehearsal.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_marine_pft_cft_prep',
   'marine_pft_cft_prep_batch_07',
   'Marine PFT / CFT Prep',
   'extracted_pdf',
   'PFT pull-up/push-up option mapping, plank, 3-mile run; CFT MTC sprint intervals, ammo-can overhead-press endurance, MUF combat circuits.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_navy_prt_prep',
   'navy_prt_prep_batch_07',
   'Navy PRT Prep',
   'extracted_pdf',
   'Push-up endurance with submax volume, forearm plank progression, 1.5-mile run; swim alternative supported where applicable.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_air_force_space_force_pfa',
   'air_force_space_force_pfa_prep_batch_07',
   'Air Force / Space Force PFA Prep',
   'extracted_pdf',
   '1-min push-up/HRP/sit-up/cross-leg-reverse-crunch pacing practice, run/HAMR option, body composition awareness without prescription.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_ruck_load_carriage',
   'ruck_load_carriage_tactical_durability_batch_07',
   'Ruck / Load Carriage / Tactical Durability',
   'extracted_pdf',
   'Gradual load/distance/pace/terrain progression, no-simultaneous-spike rule, lower-leg/foot/ankle durability, hinge strength support.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_tactical_running_engine',
   'tactical_running_engine_batch_07',
   'Tactical Running Engine',
   'extracted_pdf',
   'Aerobic base + tempo + intervals + strides/hills + test-pace; not-every-run-hard rule; 1.5/2/3-mile event-specific interval emphasis.',
   'batch_07_v1',
   TRUE),

  ('src_batch_07_tactical_cal_endurance',
   'tactical_calisthenics_endurance_batch_07',
   'Tactical Calisthenics Endurance',
   'extracted_pdf',
   'EMOM/ladder/AMRAP-capped density, tendon protection, GTG optional (never to failure), no daily max-out, pain-stop rule.',
   'batch_07_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
