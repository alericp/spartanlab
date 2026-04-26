-- ============================================================================
-- DOCTRINE BATCH 2 — UPLOADED PDF DOCTRINE (PRINCIPLE ATOM SEED)
-- ============================================================================
-- Mirrors the principle atoms in
--   lib/doctrine/source-batches/batch-02-uploaded-pdf-doctrine.ts
--
-- This seed registers ONE LIVE PRINCIPLE per Batch 2 source so that:
--   1) doctrineCoverage.principlesCount > 0 from the DB path,
--   2) every Batch 2 source has at least one DB-side atom anchoring it,
--   3) source-confidence overlap with Batch 1 (e.g. forearm health) becomes
--      a real cross-source merge in the live coverage summary.
--
-- The remaining Batch 2 atoms (selection, prescription, method, contraindication,
-- carryover) live in lib/doctrine/source-batches/batch-02-uploaded-pdf-doctrine.ts
-- and are surfaced via the unified uploaded-PDF batch aggregator. Live DB atoms
-- always win over the in-code aggregator; the aggregator is read only when the
-- DB returns zero atoms.
--
-- Provenance: Section 5 of the Batch 2 prompt. Raw PDFs were not attached;
-- evidence_snippet is intentionally NULL.
--
-- Strictly additive. ON CONFLICT DO NOTHING. Idempotent.
-- ============================================================================

BEGIN;

INSERT INTO training_doctrine_principles (
  id, source_id, doctrine_family, principle_key, principle_title,
  principle_summary, plain_language_rule, priority_type, is_base_intelligence,
  is_phase_modulation, applies_when_json, does_not_apply_when_json,
  computation_friendly_rule_json, athlete_level_scope, goal_scope,
  applies_to_skill_types, applies_to_training_styles, priority_weight,
  safety_priority, tags_json
)
SELECT
  'pr_b02_' || row_id,
  source_id, doctrine_family, principle_key, principle_title,
  principle_summary, plain_language_rule, priority_type,
  is_base_intelligence, is_phase_modulation,
  applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  computation_friendly_rule_json::jsonb,
  athlete_level_scope::jsonb, goal_scope::jsonb,
  applies_to_skill_types::jsonb, applies_to_training_styles::jsonb,
  priority_weight, safety_priority, tags_json::jsonb
FROM (VALUES
  -- Lower Body A
  ('001', 'src_batch_02_lower_body_a', 'progression_selection_logic', 'lba_level_gated_progression',
   'Lower Body A: level-gated unilateral progression',
   'Lower Body A uses three explicit levels (pistol box -> hand-assisted -> skater squat) with calf and posterior accessories. Athletes do not skip levels.',
   'Selection of pistol/skater variant is gated by the assigned Lower Body level; primaries hold prescribed tempo.',
   'hard_constraint', TRUE, FALSE,
   '{"templateIncludesLowerBodyA":true}', '{"acuteKneePain":true}',
   '{"levelGated":true,"levels":[1,2,3],"primaryRoles":["primary_quad_unilateral","primary_posterior_unilateral","primary_quad_iso"],"tempoControlled":true}',
   '["beginner","novice","intermediate","advanced"]', NULL,
   NULL, '["upper_lower","full_body","push_pull_legs"]', 0.85, 1,
   '["lower_body","unilateral","progression_levels"]'),

  -- BBR Push/Pull
  ('002', 'src_batch_02_bbr_push_pull', 'rings_hypertrophy', 'bbr_pp_phase1_tempo_block',
   'BBR Push/Pull Phase 1: 30X1 / 20X0 tempo block',
   'Phase 1 push/pull blocks use prescribed ring tempos (primary 30X1, secondary 20X0) with deload reducing sets but preserving movement identity.',
   'Phase 1 athletes follow tempo prescriptions; deload weeks drop a set rather than swap exercises.',
   'recommendation', TRUE, TRUE,
   '{"equipmentIncludes":"rings","phase":"phase_1"}', '{"ringPrerequisitesUnmet":true}',
   '{"tempo":{"primary":"30X1","secondary":"20X0"},"deloadStrategy":"drop_set_keep_movement"}',
   '["intermediate","advanced"]', '["hypertrophy","rings"]',
   '["rings_skills"]', '["push_pull_legs","upper_lower"]', 0.8, 1,
   '["rings","tempo","deload"]'),

  -- Superhero Origin
  ('003', 'src_batch_02_superhero_origin', 'foundation_building', 'superhero_lifestyle_signals_active',
   'Superhero foundation: lifestyle signals influence dosage',
   'Sleep and nutrition are first-class inputs that scale dosage and progression for newer athletes; not just educational copy.',
   'When sleepHours < 6 or nutritionInadequate is true, intensity bias drops to conservative and progression slows.',
   'recommendation', TRUE, FALSE,
   '{"athleteLevel":["beginner","novice"]}', '{}',
   '{"signals":["sleepHours","nutritionAdequate"],"effects":{"lowSleep":"conservative","poorNutrition":"slower_progression"}}',
   '["beginner","novice"]', '["general_fitness"]',
   NULL, '["full_body","upper_lower"]', 0.7, 1,
   '["lifestyle","recovery","beginner"]'),

  -- Forearm Health (Batch 2 confirmation — strengthens Batch 1 source confidence)
  ('004', 'src_batch_02_forearm_health', 'recovery_protection_logic', 'forearm_b2_dosage_confirmation',
   'Forearm health: Batch 2 confirms Batch 1 wrist circuit dosage',
   'Wrist pron/sup/flex/ext at 2x15 with short rest in paired/circuit formatting is confirmed across Batch 1 and Batch 2 sources.',
   'Two independent uploaded sources prescribe the same wrist circuit dosage; do not produce duplicate visible prehab blocks.',
   'recommendation', TRUE, FALSE,
   '{"hasGripIntenseWork":true}', '{"injuryAcuteWrist":true}',
   '{"sets":2,"reps":15,"role":"prehab","duplicateBlock":false,"sourceConfidenceBoost":true}',
   '["beginner","intermediate","advanced"]', NULL,
   '["planche","front_lever","one_arm_pull_up","rings_skills"]', NULL, 0.85, 2,
   '["prehab","forearm","duplicate_confirmation"]'),

  -- BBR Arms
  ('005', 'src_batch_02_bbr_arms', 'rings_hypertrophy', 'bbr_arms_l1_to_l3_tendon_gating',
   'BBR Arms L1->L3 with tendon-readiness gating',
   'Pelican curl L1, pelican negative L2, ring support / hanging max holds L3. L2+ requires tendon readiness flags.',
   'L2 and L3 ring arm work require tendon-readiness; otherwise regress to L1 pelican curl.',
   'recommendation', TRUE, FALSE,
   '{"equipmentIncludes":"rings","goal":["hypertrophy","rings"]}', '{"acuteElbowOrShoulderPain":true}',
   '{"levels":[1,2,3],"gateLevelRequiresTendonReadiness":true,"role":"accessory_unless_arm_specialization"}',
   '["intermediate","advanced"]', '["hypertrophy","rings"]',
   NULL, '["push_pull_legs","upper_lower"]', 0.75, 1,
   '["rings","arms","accessory","tendon_gating"]'),

  -- Planche
  ('006', 'src_batch_02_planche', 'static_skill_mastery', 'planche_acclimation_pain_band_quality',
   'Planche: stage acclimation + pain stop/change + band quality rule',
   'On stage/variant change, run 1-2 weeks at ~80%. Pain is stop/change. Band assistance is allowed only when quality is acceptable.',
   'For 1-2 weeks after a stage change, hold sets/holds at ~80% capacity. Pain triggers stop or change, never push-through. Bands allowed only with quality threshold.',
   'hard_constraint', TRUE, TRUE,
   '{"selectedSkills":{"contains":"planche"},"phaseChange":true}', '{"acuteShoulderOrWristPain":false}',
   '{"acclimationWeeks":{"min":1,"max":2},"acclimationCapacityPercent":80,"painRule":"stop_or_change","bandRule":"quality_required"}',
   '["intermediate","advanced"]', '["planche"]',
   '["planche"]', '["full_body","upper_lower","push_pull_legs"]', 0.95, 1,
   '["planche","acclimation","pain_management"]'),

  -- Novice Weighted Calisthenics
  ('007', 'src_batch_02_novice_weighted', 'weighted_calisthenics', 'novice_weighted_3x_per_week_5_8_rir',
   'Novice weighted: 3x/week, 5-8 reps, RIR 0-2 autoreg',
   'Weighted dips/pullups 3 sessions/week, 5-8 reps with RIR 0-2. Next-session load follows hardest set + RIR; deload at low rep range.',
   'Maintain 3x/week with rep range 5-8; next-session load is determined by previous-session RIR on the hardest set.',
   'recommendation', TRUE, TRUE,
   '{"primaryGoal":["weighted_pull_up","weighted_dip"]}', '{"acuteElbowOrShoulderPain":true}',
   '{"sessionsPerWeek":3,"repRange":{"min":5,"max":8},"rir":{"min":0,"max":2},"deloadTrigger":"hits_low_rep_range_with_rir_0"}',
   '["novice","intermediate"]', '["weighted_pull_up","weighted_dip"]',
   NULL, '["push_pull_legs","upper_lower","full_body"]', 0.9, 1,
   '["weighted","autoregulation","linear_progression"]'),

  -- Abs / Street Workout
  ('008', 'src_batch_02_abs_street_workout', 'circuit_density_logic', 'abs_circuit_method_skill_first',
   'Street workout: circuit method for density, skill before basics',
   'Circuit format is for density/endurance. Skill work is performed before high-fatigue basics. Spot fat loss does not apply.',
   'When goal is core_density, package as circuit; when in a session, skill precedes high-fatigue basics regardless of order in the visible card.',
   'recommendation', TRUE, FALSE,
   '{"goalIncludes":"core_density"}', '{"goal":["max_skill_strength"]}',
   '{"method":"circuit","ordering":"skill_before_basics","misconception":"no_spot_fat_loss"}',
   '["intermediate","advanced"]', '["core_density"]',
   NULL, '["full_body","push_pull_legs","upper_lower"]', 0.75, 1,
   '["circuit","ordering","misconception_correction"]')
) AS source_data(
  row_id, source_id, doctrine_family, principle_key, principle_title,
  principle_summary, plain_language_rule, priority_type,
  is_base_intelligence, is_phase_modulation,
  applies_when_json, does_not_apply_when_json,
  computation_friendly_rule_json,
  athlete_level_scope, goal_scope, applies_to_skill_types,
  applies_to_training_styles, priority_weight, safety_priority, tags_json
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
