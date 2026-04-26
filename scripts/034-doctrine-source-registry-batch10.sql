-- =============================================================================
-- DOCTRINE BATCH 10 — SOURCE REGISTRY
-- =============================================================================
-- Inserts 14 Batch 10 doctrine source registry rows. Pattern matches scripts/032
-- (Batch 9). Uses the exact column shape (id, source_key, title, source_type,
-- description, version, is_active) — confidence_tier is NOT a real column and
-- lives in the in-code metadata only.
--
-- ON CONFLICT (id) DO NOTHING so it is safe to re-run.
--
-- IMPORTANT (read with scripts/035):
-- The full ~170-atom Batch 10 doctrine set lives in the in-code fallback at
-- lib/doctrine/source-batches/batch-10-training-method-decision-governor-doctrine.ts.
-- This SQL only seeds the SOURCE REGISTRY so the live DB doctrine audit
-- endpoint can list Batch 10 sources. The runtime per-batch completeness gate
-- in lib/doctrine-runtime-contract.ts compares DB atom count vs in-code
-- fallback atom count per batch and uses fallback for any batch where DB is
-- partial — so a partial DB anchor seed CANNOT silently suppress the richer
-- in-code fallback.
--
-- LEGAL-SOURCE GATE: every Batch 10 source is one of:
--   public_evidence_informed  — public strength-and-conditioning principles
--   user_authored_preference  — SpartanLab user-authored coaching doctrine
--   codebase_observed_runtime — observed in lib/doctrine/method-profile-registry,
--                                lib/training-methods, lib/skill-density-engine,
--                                lib/program/method-materialization-summary
--   general_consensus         — general training consensus
-- No leaked / pirated material; no copyrighted text reproduced.
-- =============================================================================

INSERT INTO training_doctrine_sources
  (id, source_key, title, source_type, description, version, is_active)
VALUES
  ('src_batch_10_strength_quality_principles',
   'method_governor_batch10_strength_quality_public_principles',
   'Strength Method Quality Principles (Batch 10)',
   'extracted_pdf',
   'Why maximal strength prioritizes quality reps, longer rest, low technical degradation, and progressive overload over fatigue-heavy compression. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_hypertrophy_principles',
   'method_governor_batch10_hypertrophy_public_principles',
   'Hypertrophy Method Selection Principles (Batch 10)',
   'extracted_pdf',
   'Why hypertrophy may use straight sets, back-off sets, drop sets, supersets, density, or circuits depending on muscle group, fatigue, time, equipment, and stability. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_density_endurance_principles',
   'method_governor_batch10_density_endurance_public_principles',
   'Density / Endurance / Work-Capacity Method Principles (Batch 10)',
   'extracted_pdf',
   'Why density blocks and repeat-effort work fit conditioning, calisthenics endurance, work capacity, time-constrained sessions, and military event preparation under quality and pacing constraints. Confidence: high. Legal: public_evidence_informed + general_consensus.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_calisthenics_skill_priority',
   'method_governor_batch10_calisthenics_skill_priority_user_doctrine',
   'Calisthenics Skill-Priority Protection (Batch 10, USER-AUTHORED)',
   'extracted_pdf',
   'User-authored SpartanLab coaching doctrine: selected calisthenics skills receive direct or labeled-carryover representation before optional hypertrophy/endurance methods dominate session structure. High-skill isometrics protected from drop-set / same-muscle superset / random density. Confidence: user_authored_preference.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_top_back_off_decision',
   'method_governor_batch10_top_set_backoff_set_decision',
   'Top Set / Back-Off Set Decision Doctrine (Batch 10)',
   'extracted_pdf',
   'When top sets and back-off sets are appropriate, when they are rejected, ramp-up requirements, load reduction ranges, and placement order in the session. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_drop_mechanical_drop_decision',
   'method_governor_batch10_drop_set_mechanical_drop_set_decision',
   'Drop Set / Mechanical Drop Set Decision Doctrine (Batch 10)',
   'extracted_pdf',
   'When drop sets fit hypertrophy accessory work, when they are rejected for primary skill / max load / unstable patterns, and how mechanical drops use safer regressions through similar movement patterns. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_superset_pairing_decision',
   'method_governor_batch10_superset_pairing_decision',
   'Superset Pairing Decision Doctrine (Batch 10)',
   'extracted_pdf',
   'Antagonist vs same-muscle vs skill+low-cost-support superset taxonomy, fatigue cost, when supersets are preferred for time efficiency, and how skill primaries stay protected. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_circuit_density_decision',
   'method_governor_batch10_circuit_density_decision',
   'Circuit / Density Block Decision Doctrine (Batch 10)',
   'extracted_pdf',
   'Circuits for work-capacity / accessory / military / time-efficient flows; density blocks for time-capped quality accumulation; rejection rules for max strength and early-acquisition skill. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_rest_pause_cluster_decision',
   'method_governor_batch10_rest_pause_cluster_decision',
   'Rest-Pause / Cluster Decision Doctrine (Batch 10)',
   'extracted_pdf',
   'Rest-pause for advanced stable hypertrophy; cluster sets as intra-set execution to preserve rep quality under fatigue; rejection rules for skill, painful joints, and beginner sessions. Confidence: high. Legal: public_evidence_informed.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_fatigue_recovery_rejection',
   'method_governor_batch10_fatigue_recovery_rejection_rules',
   'Fatigue / Recovery Method Rejection Rules (Batch 10)',
   'extracted_pdf',
   'How readiness, soreness, joint irritation, accumulated method stress, acclimation phase, and deload/taper context reduce, move, or reject high-fatigue methods. Confidence: high. Legal: public_evidence_informed + general_consensus.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_time_constraint_compression',
   'method_governor_batch10_time_constraint_compression_rules',
   'Time-Constrained Method Compression Rules (Batch 10)',
   'extracted_pdf',
   'Order of compression under short-session constraints: accessories first, then density structure, never primary skill quality or essential warm-up for high-stress movements. Confidence: high. Legal: original_synthesis + user_authored_preference.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_method_materialization_truth',
   'method_governor_batch10_method_materialization_truth_guard',
   'Method Materialization Truth Guard (Batch 10)',
   'extracted_pdf',
   'Method claims must reflect what the final materialized program object actually contains. UI explanations must derive from the same final program truth that built the session structure. No fake "AI optimized" claims without input-driven decision. Confidence: high. Legal: original_synthesis.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_existing_code_observed_methods',
   'method_governor_batch10_existing_code_observed_method_registry',
   'Existing Code-Observed Method Registry (Batch 10, CODEBASE-OBSERVED)',
   'extracted_pdf',
   'Codebase-observed method profiles already present in lib/doctrine/method-profile-registry.ts (skill_frequency, neural_strength, mixed_strength_hypertrophy, density_condensed, recovery_technical, weighted_basics, flexibility_integration). Batch 10 reinforces, does not replace. Confidence: implementation_observed. Legal: codebase_observed_runtime.',
   'batch_10_v1',
   TRUE),

  ('src_batch_10_existing_pdf_doctrine_reinforcement',
   'method_governor_batch10_existing_pdf_doctrine_reinforcement',
   'Existing PDF Doctrine Reinforcement (Batch 10)',
   'extracted_pdf',
   'Reinforcement bridge to incidental method anchors already encoded in Batches 1-9 (e.g. Batch 1 antagonist_pairing_accessory; Batch 4 add_load_when_top_set_clean). Batch 10 makes those anchors decision-usable across all session contexts. Confidence: high. Legal: public_paraphrased + original_synthesis.',
   'batch_10_v1',
   TRUE)
ON CONFLICT (id) DO NOTHING;
