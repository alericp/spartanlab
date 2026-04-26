-- =============================================================================
-- DOCTRINE BATCH 10 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 10 source (14 total). The
-- full ~170-atom Batch 10 set lives in the in-code fallback at:
--   lib/doctrine/source-batches/batch-10-training-method-decision-governor-doctrine.ts
-- and is surfaced through the unified uploaded-PDF aggregator.
--
-- Why anchors-only is safe:
--   The runtime contract uses a PER-BATCH completeness gate that compares
--   DB atoms vs in-code fallback atoms for each batch and uses fallback for
--   any batch where DB is partial. Source mode becomes
--   `hybrid_db_plus_uploaded_fallback`. See:
--     lib/doctrine-runtime-contract.ts → DOCTRINE-DB-FALLBACK-COMPLETENESS-GATE
--     app/(app)/program/page.tsx       → DoctrineRuntimeProof completenessLine
--
-- LEGAL SOURCE GATE: every Batch 10 atom carries source legality metadata in
-- tags_json (sourceConfidence_*, sourceLegalityStatus_*).
--
-- Each insert guarded by EXISTS so it skips silently if the matching Batch 10
-- source row from scripts/034 isn't present yet.
-- =============================================================================

-- 1) Strength quality principles
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_strength_quality_principles',
  'training_method_decision_governor',
  'strength_quality_first_principle',
  'Strength method prioritized quality and rest',
  'Maximal strength prioritizes quality reps, longer rest intervals, low technical degradation, progressive overload, and measurable output. Straight sets, top sets, back-off sets, and clusters usually outrank drop sets / density / rest-pause for primary heavy strength.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["strength","weighted_strength","heavy_basics","skill_strength"]'::jsonb,
  '["strength_quality","quality_first","long_rest","progressive_overload","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_strength_quality_principles')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) Hypertrophy method context-dependent
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_hypertrophy_principles',
  'training_method_decision_governor',
  'hypertrophy_method_context_dependent_principle',
  'Hypertrophy method chosen by muscle/equipment/fatigue context',
  'Hypertrophy programming may use straight sets, back-off sets, drop sets, supersets, density, or circuits. Choice depends on muscle group, fatigue, available time, equipment, and pattern stability. Stable patterns tolerate higher-intensity techniques; irritated joints require reduced intensity.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["hypertrophy","accessory","stable_accessories"]'::jsonb,
  '["hypertrophy","method_context_dependent","stable_pattern","fatigue_tracked","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_hypertrophy_principles')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Density / endurance quality cap
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_density_endurance_principles',
  'training_method_decision_governor',
  'density_endurance_quality_capped_principle',
  'Density and endurance methods are quality-capped, not random fatigue',
  'Density blocks accumulate quality work in a fixed time window. They preserve clean reps, safe exercise selection, and sustainable pacing. If form breaks, density reduces reps or swaps exercises. Repeat-effort endurance is paced for repeated quality output, not smoke-session burnout.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["density","endurance","work_capacity","conditioning","military"]'::jsonb,
  '["density","endurance","quality_capped","pacing","no_random_fatigue","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_density_endurance_principles')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Calisthenics skill priority (USER-AUTHORED)
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_calisthenics_skill_priority',
  'training_method_decision_governor',
  'selected_skill_priority_principle',
  'Selected calisthenics skills represented before optional methods',
  'Selected calisthenics skills (planche, front lever, back lever, handstand, muscle-up, weighted pull-up, etc.) receive direct or labeled-carryover representation before optional hypertrophy/endurance methods dominate session structure. High-skill isometrics protected from drop-set / same-muscle superset / random density.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["planche","front_lever","back_lever","handstand","muscle_up","weighted_pull_up","skill"]'::jsonb,
  '["selected_skill_priority","skill_protection","high_skill_iso","sourceConfidence_user_authored","sourceLegalityStatus_user_authored_preference"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_calisthenics_skill_priority')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) Top set / back-off set decision
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_top_back_off_decision',
  'training_method_decision_governor',
  'top_set_back_off_set_decision_principle',
  'Top sets after ramp-up; back-off sets for quality volume',
  'Top sets used when strength expression / heavy weighted basics / measurable progression is the priority. They follow ramp-up and precede back-off and accessories. Back-off sets follow the top set with 10-25% reduced load to preserve form. Top sets are rejected for mobility / recovery / endurance / early acclimation / test-week taper.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["weighted_strength","heavy_basics","weighted_pull_up","weighted_dip","press","squat","deadlift"]'::jsonb,
  '["top_set","back_off_set","ramp_up_required","reject_recovery","reject_taper","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_top_back_off_decision')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) Drop set / mechanical drop set decision
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_drop_mechanical_drop_decision',
  'training_method_decision_governor',
  'drop_set_mechanical_drop_set_decision_principle',
  'Drop sets restricted to safer accessory; mechanical drops use safer regression',
  'Drop sets are hypertrophy/time-efficiency tools for safer accessory or stable patterns. They are rejected for high-skill isometrics, near-max heavy weighted basics, unstable rings strength, and pain-sensitive joints. Mechanical drop sets move from harder to easier variations of the same pattern (e.g. pseudo planche push-up to push-up) without changing movement intent.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["hypertrophy","accessory","stable_accessories"]'::jsonb,
  '["drop_set","mechanical_drop","accessory_only","reject_skill","reject_max_load","reject_unstable","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_drop_mechanical_drop_decision')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Superset pairing decision
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_superset_pairing_decision',
  'training_method_decision_governor',
  'superset_pairing_decision_principle',
  'Antagonist supersets preferred; same-muscle restricted to accessory',
  'Antagonist (non-competing) supersets are preferred over same-muscle supersets when the goal is time efficiency without destroying quality (pull+push, upper+lower, accessory+mobility, core+non-competing strength). Same-muscle supersets are higher fatigue and reserved for accessory hypertrophy, not primary skill / max strength. Skill is paired only with low-cost support (wrist prep, mobility, breathing).',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["hypertrophy","accessory","skill","time_efficiency"]'::jsonb,
  '["superset_antagonist","same_muscle_caution","skill_low_cost_support","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_superset_pairing_decision')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Circuit / density block decision
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_circuit_density_decision',
  'training_method_decision_governor',
  'circuit_density_decision_principle',
  'Circuits for work-capacity; density for time-capped quality; reject for max strength',
  'Circuits are multi-exercise sequences for conditioning, general fitness, work capacity, accessory/prehab flows, military prep, or time-efficient non-maximal work. Density blocks accumulate quality work in a fixed time window. Both are rejected for maximal strength, early technical skill learning, heavy weighted basics primary work, and high-stress rings strength.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["conditioning","work_capacity","accessory","military","time_efficient"]'::jsonb,
  '["circuit","density_block","work_capacity","reject_max_strength","reject_skill_learning","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_circuit_density_decision')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Rest-pause / cluster decision
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_rest_pause_cluster_decision',
  'training_method_decision_governor',
  'rest_pause_cluster_decision_principle',
  'Rest-pause for advanced stable hypertrophy; clusters preserve rep quality',
  'Rest-pause is a high-effort density/hypertrophy tool for advanced users on stable exercises — not a beginner default and not for fragile skill technique. Cluster sets are intra-set execution methods using short intra-set rest (~10-30s) to preserve rep quality under fatigue. Both are rejected for skill acquisition, painful joints, poor form consistency, and test-week taper.',
  '["intermediate","advanced","elite"]'::jsonb,
  '["hypertrophy","accessory","stable_accessories","quality_preservation"]'::jsonb,
  '["rest_pause","cluster","intra_set","reject_skill","reject_painful","reject_taper","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 1.5, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_rest_pause_cluster_decision')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 10) Fatigue / recovery method rejection
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_fatigue_recovery_rejection',
  'training_method_decision_governor',
  'fatigue_recovery_method_rejection_principle',
  'High-fatigue methods reduced or rejected by readiness/soreness/joint state',
  'High-fatigue methods (drop set, rest-pause, same-muscle superset, high density) should be reduced, moved later, or rejected when readiness is low, soreness is high, joints are irritated, or the athlete has accumulated high method stress recently. During first 1-2 weeks of acclimation, advanced methods are delayed. During deload/test-week taper, methods preserve rhythm but reduce fatigue.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["recovery","readiness","acclimation","deload","taper"]'::jsonb,
  '["fatigue_reject","readiness_gate","soreness_gate","acclimation_delay","taper_lower_fatigue","sourceConfidence_high","sourceLegalityStatus_public_evidence_informed"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_fatigue_recovery_rejection')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 11) Time-constrained method compression
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_time_constraint_compression',
  'training_method_decision_governor',
  'time_constraint_method_compression_principle',
  'Compress accessories first; preserve essential warm-up and primary skill quality',
  'Under short-session constraints, accessories are compressed before primary skill or heavy strength work. Essential warm-up for high-skill or high-stress movements is preserved. Antagonist supersets and short density finishers may be used safely for time efficiency. Selected flexibility goals are not silently deleted; the cooldown is compressed but at least one round of the selected goal remains.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["short_session","time_constraint","compression","accessory","warmup_preserved"]'::jsonb,
  '["short_session_compression","accessory_first","warmup_preserved","skill_quality_preserved","sourceConfidence_high","sourceLegalityStatus_original_synthesis"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_time_constraint_compression')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 12) Method materialization truth guard
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_method_materialization_truth',
  'training_method_decision_governor',
  'method_materialization_truth_principle',
  'Method claims must reflect final materialized program object',
  'No method (top set, drop set, superset, circuit, density, rest-pause, cluster) claim is made unless it exists in the final materialized program object or final session display contract. UI explanations must derive from the same final program truth that built the session structure. No fake "AI optimized" claims without input-driven decision (goal, skill, readiness, schedule, equipment, experience, fatigue, time, doctrine).',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["truth","materialization","ui_parity","explanation","ai_claim_guard"]'::jsonb,
  '["materialization_truth","ui_parity","no_fake_ai_claim","input_driven","sourceConfidence_high","sourceLegalityStatus_original_synthesis"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_method_materialization_truth')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 13) Existing code-observed method registry
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_existing_code_observed_methods',
  'training_method_decision_governor',
  'method_profile_registry_observed_principle',
  'Existing session-shape method profiles observed in codebase',
  'Existing method profiles observed in lib/doctrine/method-profile-registry.ts (skill_frequency, neural_strength, mixed_strength_hypertrophy, density_condensed, recovery_technical, weighted_basics, flexibility_integration). Existing density/endurance engines observed in lib/skill-density-engine.ts and lib/endurance-density-config.ts. Existing materialization summary in lib/program/method-materialization-summary.ts. Batch 10 reinforces and adds method-level decision atoms; does not replace session-shape profiles.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["method_profile","session_shape","density_engine","materialization"]'::jsonb,
  '["codebase_observed","reinforcement","no_replacement","sourceConfidence_implementation_observed","sourceLegalityStatus_codebase_observed_runtime"]'::jsonb,
  TRUE, FALSE, 1.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_existing_code_observed_methods')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 14) Existing PDF doctrine reinforcement
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_10_existing_pdf_doctrine_reinforcement',
  'training_method_decision_governor',
  'existing_pdf_doctrine_reinforcement_principle',
  'Incidental method anchors from Batches 1-9 reinforced as decision-usable',
  'Reinforcement bridge to incidental method anchors already encoded in Batches 1-9 (e.g. Batch 1 antagonist_pairing_accessory; Batch 4 add_load_when_top_set_clean for top-set progression). Batch 10 makes those anchors decision-usable across all session contexts and exercise categories via the METHOD_COMPATIBILITY_MATRIX (12 methods × 8 categories).',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["antagonist_pairing","top_set_clean","method_compatibility_matrix"]'::jsonb,
  '["pdf_reinforcement","decision_usable","compatibility_matrix","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_10_existing_pdf_doctrine_reinforcement')
ON CONFLICT (source_id, principle_key) DO NOTHING;
