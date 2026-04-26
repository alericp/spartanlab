-- =============================================================================
-- DOCTRINE BATCH 9 — ATOM SEED (PRINCIPLE ANCHORS, schema-aligned)
-- =============================================================================
--
-- ADDITIVE ONLY. ON CONFLICT (source_id, principle_key) DO NOTHING.
-- No DROP / ALTER / DELETE / TRUNCATE. No edits to existing rows.
--
-- One representative principle anchor per Batch 9 source (12 total). The full
-- ~217-atom Batch 9 set lives in the in-code fallback at:
--   lib/doctrine/source-batches/batch-09-mobility-flexibility-warmup-cooldown-doctrine.ts
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
-- LEGAL SOURCE GATE: every Batch 9 atom carries source legality metadata in
-- tags_json. The user-preferred short-round flexibility protocol is marked
-- `sourceConfidence_user_authored_verified` because the protocol is already
-- encoded in the live codebase (lib/skill-progression-rules.ts and others).
--
-- Each insert guarded by EXISTS so it skips silently if the matching Batch 9
-- source row from scripts/032 isn't present yet.
-- =============================================================================

-- 1) Dynamic warm-up & mobility principles
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_dynamic_warmup_mobility_principles',
  'mobility_flexibility_warmup_cooldown',
  'warmup_dynamic_priority_principle',
  'Warm-up prioritizes dynamic mobility over long static holds',
  'Pre-workout warm-up uses dynamic mobility, pulses through range, activation, joint prep, and short positional exposures. Long relaxed static holds are avoided before maximal strength or high-skill calisthenics by default.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["warmup","mobility","strength","skill","calisthenics","military"]'::jsonb,
  '["warmup","dynamic_warmup","no_long_static_pre_strength","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_dynamic_warmup_mobility_principles')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 2) Static cooldown & flexibility principles
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_static_cooldown_flexibility_principles',
  'mobility_flexibility_warmup_cooldown',
  'cooldown_static_flexibility_principle',
  'Cooldown can use longer flexibility holds and downshift breathing',
  'Cooldown is the appropriate phase for longer relaxed flexibility holds and parasympathetic downshift. Cooldown should reflect the selected flexibility goal and trained tissues, not random unrelated stretches.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["cooldown","flexibility","recovery","selected_goals"]'::jsonb,
  '["cooldown","static_flexibility","goal_relevant","trained_tissue_relevant","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_static_cooldown_flexibility_principles')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 3) Skill-specific ramp-up
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_skill_specific_rampup',
  'mobility_flexibility_warmup_cooldown',
  'skill_specific_rampup_principle',
  'Warm-up must prepare the actual first main movement',
  'Warm-up includes a ramp-up matched to the first main exercise: easier progression holds, band-assisted variations, lower leverage positions, scapular prep, short low-fatigue ramp sets. The warm-up should flow into the first main movement, not feel disconnected.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["warmup","skill_rampup","planche","front_lever","back_lever","handstand","weighted_pull_up","squat","run"]'::jsonb,
  '["skill_rampup","pattern_match","strength_ramp","sourceConfidence_high","sourceLegalityStatus_original_synthesis"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_skill_specific_rampup')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 4) Front split progression
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_front_split_progression',
  'mobility_flexibility_warmup_cooldown',
  'front_split_progression_principle',
  'Front split progresses by hip-square depth and controlled descent',
  'Front split staged exposure: hip flexor + half split + split exposure per side, both sides each round. Progress by repeatable depth with hips square, not by forcing range. Default dose: 3 rounds × ~15s per position per side (verified user method).',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["front_split","flexibility","cooldown","flexibility_block","micro_session"]'::jsonb,
  '["front_split","staged_exposure","3x15_method","sourceConfidence_user_authored_verified","sourceLegalityStatus_user_authored_verified"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_front_split_progression')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 5) Side / middle split progression
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_side_split_middle_split',
  'mobility_flexibility_warmup_cooldown',
  'side_split_progression_principle',
  'Side / middle split staged exposure with adductor prep',
  'Side split staged exposure: horse stance + frog + split exposure. Progress by repeatable depth with knees aligned and adductors prepared, not by forced range. Avoid aggressive split holds before maximal lower-body or skill sessions. Default dose: 3 rounds × ~15s per position (verified user method).',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["side_split","middle_split","flexibility","cooldown","flexibility_block","micro_session"]'::jsonb,
  '["side_split","staged_exposure","3x15_method","no_aggressive_pre_lower","sourceConfidence_user_authored_verified","sourceLegalityStatus_user_authored_verified"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_side_split_middle_split')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 6) Pancake / straddle / compression
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_pancake_straddle_compression',
  'mobility_flexibility_warmup_cooldown',
  'pancake_progression_principle',
  'Pancake progresses by hip hinge + active compression, not by collapsing spine',
  'Pancake staged exposure: seated straddle + hands walking forward + active pancake. Progress by maintaining hip hinge and active compression while adding depth. Do not collapse spine to fake depth. Default dose: 3 rounds × ~15s per position (verified user method).',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["pancake","straddle","compression","flexibility","cooldown","flexibility_block","micro_session"]'::jsonb,
  '["pancake","staged_exposure","3x15_method","active_compression","sourceConfidence_user_authored_verified","sourceLegalityStatus_user_authored_verified"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_pancake_straddle_compression')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 7) Toe touch / hamstring / posterior chain
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_toe_touch_posterior_chain',
  'mobility_flexibility_warmup_cooldown',
  'toe_touch_progression_principle',
  'Toe touch staged exposure with nerve-sensitivity caution',
  'Toe touch staged exposure: 15s single-leg L + 15s single-leg R + 15s seated straight + 15s seated rounded, repeated 3 rounds. Stop on numbness, tingling, or sharp pain — these are nerve-sensitivity warning signs.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["toe_touch","hamstring","posterior_chain","flexibility","cooldown","flexibility_block","micro_session"]'::jsonb,
  '["toe_touch","staged_exposure","3x15_method","nerve_caution","sourceConfidence_user_authored_verified","sourceLegalityStatus_user_authored_verified"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_toe_touch_posterior_chain')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 8) Shoulder / wrist / spine mobility
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_shoulder_wrist_spine_mobility',
  'mobility_flexibility_warmup_cooldown',
  'shoulder_wrist_spine_mobility_principle',
  'Wrist prep is mandatory before planche/handstand loading',
  'Mobility supporting handstands, planche, HSPU, and overhead positions includes wrists, shoulders, scapular control, and thoracic spine. Wrist prep is mandatory before planche or handstand loading, not optional.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["shoulder_mobility","wrist_mobility","thoracic_mobility","handstand","planche","hspu","overhead"]'::jsonb,
  '["wrist_prep_mandatory","shoulder_mobility","thoracic_mobility","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_shoulder_wrist_spine_mobility')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 9) Calisthenics joint prep
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_calisthenics_joint_prep',
  'mobility_flexibility_warmup_cooldown',
  'joint_prep_session_match_principle',
  'Joint prep is matched to the actual session demands',
  'Calisthenics joint prep covers wrists, elbows, shoulders, scapula, hips, knees, ankles, and tendons. Prep is matched to the session: planche / front lever / back lever / handstand / pull / lower-body / run sessions each have specific joint prep doctrine.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["joint_prep","planche","front_lever","back_lever","handstand","weighted_pull_up","squat","run"]'::jsonb,
  '["joint_prep","session_match","tendon_prep","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_calisthenics_joint_prep')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 10) User-preferred short-round flexibility protocol (VERIFIED)
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_user_short_round_flexibility',
  'mobility_flexibility_warmup_cooldown',
  'user_short_round_flexibility_principle',
  'User-preferred short-round flexibility protocol (verified user method)',
  'User-authored verified protocol: 3 rounds of ~15-second holds across goal-specific cue sequences (pancake: seated straddle / hands walking forward / active pancake; toe touch: single-leg L / single-leg R / seated straight / seated rounded; front split: hip flexor / half split / split exposure per side; side split: horse stance / frog / split exposure). Already encoded in lib/skill-progression-rules.ts, lib/range-training-system.ts, lib/training-principles-engine.ts, lib/adaptive-exercise-pool.ts, and lib/skill-audit-system.ts has3Rounds validator.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["pancake","toe_touch","front_split","side_split","middle_split","flexibility","micro_session"]'::jsonb,
  '["user_protocol","3x15_method","verified_user_method","short_round","sourceConfidence_user_authored_verified","sourceLegalityStatus_user_authored_verified"]'::jsonb,
  TRUE, FALSE, 2.0, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_user_short_round_flexibility')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 11) Flexibility goal onboarding preservation
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_flexibility_goal_onboarding_preservation',
  'mobility_flexibility_warmup_cooldown',
  'flexibility_goal_no_silent_omission_principle',
  'Selected flexibility goals must not be silently omitted',
  'Future builder must not silently omit selected flexibility goals (side split, front split, pancake, toe touch, shoulder/wrist/thoracic/ankle mobility). The goal must appear in warm-up, cooldown, or flexibility block according to the FLEXIBILITY_GOAL_SUPPORT_MATRIX placement, unless explicitly constrained.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["onboarding","flexibility_goals","builder_truth","support_matrix"]'::jsonb,
  '["onboarding_preservation","no_silent_omission","support_matrix","sourceConfidence_high","sourceLegalityStatus_original_synthesis"]'::jsonb,
  TRUE, FALSE, 2.0, 'hard_constraint', 1
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_flexibility_goal_onboarding_preservation')
ON CONFLICT (source_id, principle_key) DO NOTHING;

-- 12) Mobility / recovery / interference management
INSERT INTO training_doctrine_principles (
  source_id, doctrine_family, principle_key, principle_title, principle_summary,
  athlete_level_scope, goal_scope, tags_json,
  is_base_intelligence, is_phase_modulation,
  priority_weight, priority_type, safety_priority
)
SELECT
  'src_batch_09_mobility_recovery_interference_management',
  'mobility_flexibility_warmup_cooldown',
  'mobility_interference_management_principle',
  'Mobility dose protects strength / skill / military performance',
  'Flexibility / mobility dosage is calibrated to avoid interfering with strength, skill, and military/calisthenics performance. Short sessions compress cooldown intelligently but never permanently delete the selected flexibility goal. Minimal-leg preference still preserves basic hip/knee/ankle/posterior-chain mobility. Military mobility supports running, rucking, loaded carries.',
  '["beginner","intermediate","advanced","elite"]'::jsonb,
  '["mobility_dosage","interference_management","short_session","minimal_leg","military","tactical"]'::jsonb,
  '["interference_management","short_session_compression","minimal_leg_basic_mobility","military_lower_body_carryover","sourceConfidence_high","sourceLegalityStatus_public_paraphrased"]'::jsonb,
  TRUE, FALSE, 1.5, 'soft_preference', 0
WHERE EXISTS (SELECT 1 FROM training_doctrine_sources WHERE id = 'src_batch_09_mobility_recovery_interference_management')
ON CONFLICT (source_id, principle_key) DO NOTHING;
