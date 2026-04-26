-- =============================================================================
-- DOCTRINE BATCH 3 — ATOM SEED (PRINCIPLE ANCHORS)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT DO NOTHING. No DROP / ALTER / DELETE.
-- One representative principle anchor per Batch 3 source. The full atom
-- diversity (100 atoms across 9 sources, distributed across principles,
-- progression, selection, contraindication, method, prescription, and
-- carryover categories) lives in the in-code fallback at:
--   lib/doctrine/source-batches/batch-03-uploaded-pdf-doctrine.ts
--
-- This SQL is intentionally narrow:
--   - it ensures a non-empty Batch 3 footprint exists in the live DB so
--     anyone querying training_doctrine_principles can see Batch 3 sources;
--   - it does NOT attempt to re-encode every Batch 3 rule, because the
--     in-code aggregator is the canonical fallback when DB returns < full.
--
-- Provenance: derived_from_prompt_section_5_summary
-- Raw PDFs: not attached. evidence_snippet is intentionally NULL.
-- =============================================================================

-- 1) Lower Body A duplicate confirmation
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_lower_body_a_dup',
  'lower_body_a_duplicate_confirmation',
  'Lower Body A progression confirmed by duplicate source',
  'A second Lower Body A source independently confirms the L1/L2/L3 pistol-squat / glute-ham / wall-squat / calf-raise progression. Duplicate source increases provenance confidence; it must NOT duplicate visible exercise blocks.',
  ARRAY['beginner','intermediate','advanced'],
  1, 'soft_preference', 'cross_cutting',
  'Duplicate source confirmed Lower Body A doctrine without duplicating blocks',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) MZ Intermediate Weighted Calisthenics
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_mz_intermediate_weighted',
  'intermediate_weighted_overcomplication_guard',
  'Intermediate weighted calisthenics: keep progression stable',
  'Intermediate stage is where overcomplication kills progress. Hold a stable heavy / assistance / PR weekly cycle and progress via PR-set reps and assistance reps/RIR before introducing advanced complexity.',
  ARRAY['intermediate'],
  3, 'strong_preference', 'base_week_intelligence',
  'Intermediate plan kept progression stable instead of overcomplicated',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Forearm Health duplicate confirmation
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_forearm_health_dup',
  'forearm_prehab_duplicate_confirmation',
  'Forearm prehab confirmed by duplicate source',
  'A second Forearm Health source independently confirms wrist pronation / extension / supination / flexion at 2x15 with short rest. Duplicate source raises provenance confidence; do not duplicate visible prehab blocks.',
  ARRAY['beginner','intermediate','advanced'],
  1, 'soft_preference', 'cross_cutting',
  'Duplicate forearm-health source raised provenance confidence',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Kinevo Bodyweight Strength Foundation
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_kinevo_foundation',
  'leverage_progression_principle',
  'Calisthenics scales through leverage and body position',
  'Bodyweight strength/hypertrophy progresses primarily through leverage and position changes, not only added external load. Equipment choice (bands below 8 pull-ups, free weights above 8) follows from current strength.',
  ARRAY['beginner','intermediate'],
  2, 'strong_preference', 'base_week_intelligence',
  'Progression scaled through leverage; equipment matched pull-up strength',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) No BS Nutrition System
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_no_bs_nutrition',
  'nutrition_consistency_over_obsession',
  'Nutrition: calories, protein, and consistency over obsession',
  'Body composition is driven by sustained calorie/protein targets and adherence, not by tracking minutiae. Nutrition guidance supports training; it is not medical advice and does not override training generation.',
  ARRAY['beginner','intermediate','advanced'],
  1, 'recommendation', 'cross_cutting',
  'Nutrition guidance focused on calories/protein/consistency',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) BSF Training Log / Warm-up / Hypertrophy
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_bsf_training_log',
  'progression_stability_during_hypertrophy_phase',
  'Hold progression constant; progress reps/sets in early hypertrophy phase',
  'During early hypertrophy phase advance reps or sets while keeping the chosen progression constant rather than rotating exercises every week. Warm-up reps/holds are readiness-guided, not fixed.',
  ARRAY['beginner','intermediate'],
  2, 'strong_preference', 'base_week_intelligence',
  'Progression held constant while reps/sets advanced',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Ian Barseagle Weighted & Bodyweight Calisthenics
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_ian_weighted_bw',
  'weighted_plan_prerequisite_gate',
  'Weighted pull-up/dip plan gated by bodyweight prerequisites',
  'Apply heavy weighted progressions only after roughly 15+ pull-ups and 20+ dips. Below threshold, use band/negative/low-rep practice; near 8 reps transition to max-rep capacity work with longer rest. Always include a movement-specific ramp-up.',
  ARRAY['beginner','intermediate'],
  3, 'strong_preference', 'base_week_intelligence',
  'Weighted plan gated by bodyweight prerequisite',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Flexibility Notes
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_flexibility_notes',
  'active_flexibility_for_skills',
  'Skill work demands active flexibility and mobility, not only passive stretch',
  'Street-workout skills (planche, manna/V-sit, hollowback handstand) require strength under stretched range. Active mobility supports tolerance and reduces risk but does not eliminate it; pain rules still apply.',
  ARRAY['intermediate','advanced'],
  2, 'strong_preference', 'cross_cutting',
  'Mobility chosen for active skill control; pain rules still apply',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Muscle & Strength Pyramid Training
INSERT INTO training_doctrine_principles (
  source_id, principle_key, principle_title, principle_summary,
  athlete_level_scope, priority_weight, priority_type, intelligence_tier,
  user_visible_evidence_label, evidence_snippet
) VALUES (
  'src_batch_03_muscle_strength_pyramid',
  'pyramid_priority_hierarchy',
  'Pyramid hierarchy resolves general programming conflicts',
  'When doctrine conflicts, resolve in order: adherence → volume/intensity/frequency balance → progression matched to training age → exercise selection (specificity, weak points, ROM) → rest → tempo. Calisthenics-specific doctrine still wins on its own domain.',
  ARRAY['beginner','intermediate','advanced'],
  3, 'strong_preference', 'cross_cutting',
  'Programming resolved by priority hierarchy',
  NULL
) ON CONFLICT (source_id, principle_key) DO NOTHING;

-- =============================================================================
-- VERIFICATION (read-only) — uncomment to inspect after running:
-- SELECT COUNT(*) AS batch3_principles
-- FROM training_doctrine_principles
-- WHERE source_id LIKE 'src_batch_03_%';
-- =============================================================================
