-- =============================================================================
-- DOCTRINE BATCH 9 — SOURCE REGISTRY
-- =============================================================================
-- Inserts 12 Batch 9 doctrine source registry rows. Pattern matches scripts/030
-- (Batch 8). Uses the exact column shape (id, source_key, title, source_type,
-- description, version, is_active) — confidence_tier is NOT a real column and
-- lives in the in-code metadata only.
--
-- ON CONFLICT (id) DO NOTHING so it is safe to re-run.
--
-- IMPORTANT (read with scripts/033):
-- The full ~217-atom Batch 9 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-09-mobility-flexibility-warmup-cooldown-doctrine.ts.
-- This SQL only seeds the SOURCE REGISTRY so the live DB doctrine audit
-- endpoint can list Batch 9 sources. The runtime per-batch completeness gate
-- in lib/doctrine-runtime-contract.ts compares DB atom count vs in-code
-- fallback atom count per batch and uses fallback for any batch where DB is
-- partial — so a partial DB anchor seed CANNOT silently suppress the richer
-- in-code fallback.
--
-- LEGAL-SOURCE GATE: every Batch 9 source carries `sourceLegalityStatus =
-- public_official`, `public_paraphrased`, `original_synthesis`, OR
-- `user_authored_verified`. The user-preferred 3×15s short-round flexibility
-- protocol is marked `user_authored_verified` because it is already encoded
-- in the live codebase (lib/skill-progression-rules.ts PANCAKE_PROGRESSION,
-- TOE_TOUCH_PROGRESSION, FRONT_SPLITS_PROGRESSION, SIDE_SPLITS_PROGRESSION;
-- lib/range-training-system.ts; lib/training-principles-engine.ts;
-- lib/adaptive-exercise-pool.ts; lib/skill-audit-system.ts has3Rounds
-- validator) — it is verified user authorship, not a placeholder.
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_09_dynamic_warmup_mobility_principles',
   'dynamic_warmup_mobility_principles_batch_09',
   'Dynamic Warm-Up & Mobility Principles (Batch 9)',
   'extracted_pdf',
   'Why pre-workout mobility prioritizes dynamic, pulse, activation, and short positional exposure over long relaxed static holds before strength/skill work. Confidence: high. Legal: public_paraphrased + original_synthesis.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_static_cooldown_flexibility_principles',
   'static_cooldown_flexibility_principles_batch_09',
   'Static Cooldown & Flexibility Principles (Batch 9)',
   'extracted_pdf',
   'Why cooldown can use longer calmer holds; how cooldown differs from warm-up; downshift, flexibility exposure, and recovery framing. Confidence: high. Legal: public_paraphrased + original_synthesis.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_skill_specific_rampup',
   'skill_specific_rampup_preparation_batch_09',
   'Skill-Specific Ramp-Up Preparation (Batch 9)',
   'extracted_pdf',
   'Warm-up should prepare the actual first major exercise/skill: easier progression, assisted/banded variation, scapular prep, short low-fatigue exposure. Confidence: high. Legal: original_synthesis.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_front_split_progression',
   'front_split_progression_batch_09',
   'Front Split Progression Doctrine (Batch 9)',
   'extracted_pdf',
   'Front split: hip flexor + hamstring + lunge/split exposure; gradual range; active control; cooldown/flexibility block placement. Confidence: high. Legal: user_authored_verified + public_paraphrased.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_side_split_middle_split',
   'side_split_middle_split_progression_batch_09',
   'Side / Middle Split Progression Doctrine (Batch 9)',
   'extracted_pdf',
   'Side split / middle split: adductor preparation, frog/straddle patterns, gradual range, active control, no aggressive forced depth. Confidence: high. Legal: user_authored_verified + public_paraphrased.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_pancake_straddle_compression',
   'pancake_straddle_compression_batch_09',
   'Pancake / Straddle / Compression Doctrine (Batch 9)',
   'extracted_pdf',
   'Pancake progression: hamstrings, adductors, hip hinge mechanics, anterior pelvic tilt, compression, active flexibility support. Confidence: high. Legal: user_authored_verified + public_paraphrased.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_toe_touch_posterior_chain',
   'toe_touch_hamstring_posterior_chain_batch_09',
   'Toe-Touch / Hamstring / Posterior-Chain Doctrine (Batch 9)',
   'extracted_pdf',
   'Toe touch: posterior-chain mobility, hip hinge, calf contribution, nerve-sensitivity caution. Confidence: high. Legal: user_authored_verified + public_paraphrased.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_shoulder_wrist_spine_mobility',
   'shoulder_wrist_spine_mobility_batch_09',
   'Shoulder / Wrist / Spine Mobility Doctrine (Batch 9)',
   'extracted_pdf',
   'Mobility supporting handstands, planche, HSPU, overhead positions, scapular control, wrists, shoulders, thoracic spine. Confidence: high. Legal: public_paraphrased + original_synthesis.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_calisthenics_joint_prep',
   'calisthenics_joint_prep_batch_09',
   'Calisthenics Joint Prep Doctrine (Batch 9)',
   'extracted_pdf',
   'Joint prep across wrists, elbows, shoulders, scapula, hips, knees, ankles, and tendon preparation for calisthenics skill/strength. Confidence: high. Legal: public_paraphrased + original_synthesis.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_user_short_round_flexibility',
   'user_preferred_short_round_flexibility_protocol_batch_09',
   'User-Preferred Short-Round Flexibility Protocol (Batch 9, VERIFIED)',
   'extracted_pdf',
   'User-authored verified protocol: 3 rounds of ~15-second holds across goal-specific cue sequences. Already encoded in lib/skill-progression-rules.ts (PANCAKE/TOE_TOUCH/FRONT_SPLITS/SIDE_SPLITS), lib/range-training-system.ts, lib/training-principles-engine.ts, lib/adaptive-exercise-pool.ts, lib/skill-audit-system.ts has3Rounds. Source confidence: user_authored_verified. Legal: user_authored_verified.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_flexibility_goal_onboarding_preservation',
   'flexibility_goal_onboarding_preservation_batch_09',
   'Flexibility Goal Onboarding Preservation Doctrine (Batch 9)',
   'extracted_pdf',
   'Future builder must not silently omit selected flexibility goals from onboarding (side split, front split, pancake, toe touch, mobility goals). Goals must appear in warm-up/cooldown/flexibility block unless explicitly constrained. Confidence: high. Legal: original_synthesis.',
   'batch_09_v1',
   TRUE),

  ('src_batch_09_mobility_recovery_interference_management',
   'mobility_recovery_interference_management_batch_09',
   'Mobility / Recovery / Interference Management Doctrine (Batch 9)',
   'extracted_pdf',
   'How flexibility/mobility avoids interfering with strength, skill, and military/calisthenics training. Confidence: high. Legal: public_paraphrased + original_synthesis.',
   'batch_09_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
