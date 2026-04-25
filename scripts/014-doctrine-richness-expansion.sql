-- =============================================================================
-- 014 — DOCTRINE RICHNESS EXPANSION (REAL DATA, NOT FOUNDATION STUB)
-- =============================================================================
-- Honest audit (2026-04-25):
--   Before this script, Neon doctrine totaled ~33 rows across 10 tables:
--     training_doctrine_sources       1
--     training_doctrine_principles    3
--     exercise_selection_rules        4
--     method_rules                    3
--     prescription_rules              3
--     progression_rules               4
--     skill_carryover_rules           4
--     exercise_prerequisite_rules     0
--     exercise_contraindication_rules 4
--     doctrine_rule_versions          7
--   That is a foundation skeleton, not a doctrine corpus. The runtime contract
--   and builder had almost nothing to consume — which is why prior weekly-role
--   passes had to bake doctrine into TS code instead of reading it from DB.
--
-- This migration adds ~125 queryable, structured rows covering the doctrine
-- categories the prompt explicitly named:
--   * weighted calisthenics strength doctrine
--   * straight-arm / bent-arm balance
--   * horizontal / vertical balance
--   * skill-frequency doctrine
--   * progression-sensitive dosing
--   * support / carryover doctrine
--   * top-set / drop-set / superset / circuit / density / cluster method rules
--   * progression / regression ladders
--   * level-sensitive prescription
--   * heavy / moderate / recovery-supportive day construction
--
-- Idempotency: every row uses an explicit deterministic text id and
-- ON CONFLICT (id) DO NOTHING. Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) NEW DOCTRINE SOURCES
-- -----------------------------------------------------------------------------
INSERT INTO training_doctrine_sources (id, source_key, title, source_type, description, version, is_active) VALUES
('src-weighted-calisthenics-v1', 'weighted_calisthenics_doctrine', 'Weighted Calisthenics Strength Doctrine', 'system_seeded',
 'Top-set / back-off / cluster doctrine for weighted pull-ups, dips, ring rows, and weighted gymnastic strength. 2 warm-up sets to top-set, 1-2 heavy working sets, then back-off volume. Long rest between heavy efforts. Movement-family conservative.',
 '1.0.0', true),

('src-movement-balance-v1', 'movement_balance_doctrine', 'Movement Family Balance Doctrine', 'system_seeded',
 'Straight-arm vs bent-arm balance, horizontal vs vertical balance, push/pull ratio targets, primary/secondary/support exposure ratios. Rotates skill exposures intelligently across the week.',
 '1.0.0', true),

('src-method-toolbox-v1', 'method_toolbox_doctrine', 'Training Method Toolbox Doctrine', 'system_seeded',
 'Top-set, back-off, cluster, drop-set, rest-pause, superset, circuit, density (EMOM/AMRAP), finisher, isometric hold, paused rep, tempo. Each carries explicit eligibility, exercise-family safety, and dose-shape rules.',
 '1.0.0', true),

('src-recovery-tissue-v1', 'recovery_tissue_doctrine', 'Recovery & Tissue Management Doctrine', 'system_seeded',
 'Recovery-supportive day construction, tendon-management dosing for elbows / shoulders / wrists, deload rules, RPE caps for low-stress days.',
 '1.0.0', true)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2) DOCTRINE PRINCIPLES (~25 new rows)
-- -----------------------------------------------------------------------------
INSERT INTO training_doctrine_principles
  (id, source_id, doctrine_family, principle_key, principle_title, principle_summary,
   athlete_level_scope, goal_scope, applies_to_skill_types, applies_to_training_styles,
   applies_to_equipment_context, safety_priority, priority_weight)
VALUES
-- Weighted strength family
('prn-weighted-2up-2heavy', 'src-weighted-calisthenics-v1', 'weighted_strength', 'two_up_two_heavy',
 'Two Warm-Up Sets, Two Heavy Working Sets',
 'For weighted calisthenics primary strength (weighted pull-up, weighted dip, weighted ring row), use 2 progressive warm-up sets to a working top set, then 1-2 heavy working sets in the 3-6 rep range, with 3-5 min rest. Optional back-off set at -10 to -20% load for accumulated volume.',
 '["intermediate","advanced"]'::jsonb, '["strength","weighted_calisthenics"]'::jsonb,
 '["weighted_pull_up","weighted_dip","weighted_ring_row"]'::jsonb,
 '["weighted_calisthenics","strength","calisthenics"]'::jsonb,
 '["weight_belt","backpack_loaded","ring"]'::jsonb, 8, 1.4),

('prn-weighted-rest-long', 'src-weighted-calisthenics-v1', 'weighted_strength', 'long_rest_heavy_strength',
 'Long Rest Between Heavy Working Sets',
 'When working at ≥85% of weighted max for 3-6 reps, rest 180-300s between working sets. Short rest sacrifices the strength stimulus to fatigue.',
 '["intermediate","advanced"]'::jsonb, '["strength","weighted_calisthenics"]'::jsonb,
 '["weighted_pull_up","weighted_dip"]'::jsonb,
 '["weighted_calisthenics","strength"]'::jsonb,
 '["weight_belt","backpack_loaded"]'::jsonb, 6, 1.2),

('prn-weighted-cluster-eligible', 'src-weighted-calisthenics-v1', 'weighted_strength', 'cluster_eligible_when_strong',
 'Cluster Sets Earned, Not Default',
 'Cluster sets (e.g., 5 × 2 with 15-30s intra-set rest at heavy load) are valuable for advanced lifters working at 85-92% of weighted max. They are NOT default — applied only when athlete has consistent RPE 8 quality on the parent movement.',
 '["advanced"]'::jsonb, '["strength","weighted_calisthenics"]'::jsonb,
 '["weighted_pull_up","weighted_dip"]'::jsonb,
 '["weighted_calisthenics","strength"]'::jsonb,
 '["weight_belt"]'::jsonb, 5, 1.0),

-- Movement balance family
('prn-balance-pull-push', 'src-movement-balance-v1', 'movement_balance', 'pull_push_ratio',
 'Pull-to-Push Ratio Target',
 'Across a training week, total pulling volume should equal or slightly exceed total pushing volume (1.0-1.3x), correcting for the pull-deficient posture most trainees carry. Both horizontal and vertical pulls count.',
 '["beginner","intermediate","advanced"]'::jsonb, '["strength","general","skill","weighted_calisthenics"]'::jsonb,
 NULL, '["calisthenics","strength","weighted_calisthenics"]'::jsonb,
 NULL, 5, 1.1),

('prn-balance-horizontal-vertical', 'src-movement-balance-v1', 'movement_balance', 'horizontal_vertical_balance',
 'Horizontal & Vertical Coverage Both Required',
 'Each week should include at least one horizontal pull (row, inverted row, front lever pull), one vertical pull (pull-up, muscle-up), one horizontal push (push-up, planche lean, planche), and one vertical push (dip, HSPU, overhead press). Skipping a plane creates joint imbalances.',
 '["beginner","intermediate","advanced"]'::jsonb, '["strength","general","skill"]'::jsonb,
 NULL, '["calisthenics","strength"]'::jsonb,
 NULL, 6, 1.2),

('prn-balance-straight-bent-arm', 'src-movement-balance-v1', 'movement_balance', 'straight_arm_bent_arm_balance',
 'Straight-Arm and Bent-Arm Both Required for Skill Athletes',
 'Skill athletes pursuing planche, front lever, back lever, iron cross, or maltese must train both straight-arm strength (the skill itself + leans, tucks, straddle holds) AND bent-arm strength (pull-ups, dips, rows, presses). Bent-arm provides the joint-supporting hypertrophy and connective tissue resilience that protect the straight-arm skill.',
 '["intermediate","advanced"]'::jsonb, '["skill","strength"]'::jsonb,
 '["planche","front_lever","back_lever","iron_cross"]'::jsonb,
 '["calisthenics","strength"]'::jsonb,
 NULL, 7, 1.3),

('prn-balance-leg-presence', 'src-movement-balance-v1', 'movement_balance', 'lower_body_presence_required',
 'Lower-Body Presence Required Even for Upper-Focus Programs',
 'Upper-body / skill-focused programs must still hit the lower body 1-2x per week (squats, lunges, hamstring, calves) to maintain systemic athleticism, hormonal response, and tendon health. Skipping legs degrades upper-body progress over months.',
 '["beginner","intermediate","advanced"]'::jsonb, '["strength","skill","general"]'::jsonb,
 NULL, '["calisthenics","strength"]'::jsonb,
 NULL, 4, 0.9),

-- Skill frequency family
('prn-skill-frequency', 'src-spartan-foundation-v1', 'skill_frequency', 'high_frequency_low_dose_skill',
 'Skill Movements Earn Frequent Low-Fatigue Exposures',
 'Skill movements (planche, front lever, handstand, muscle-up transitions) progress fastest with frequent (3-5x/week) low-fatigue exposures rather than rare exhaustive sessions. Skill is neural — repetitions in clean form matter more than total volume.',
 '["intermediate","advanced"]'::jsonb, '["skill"]'::jsonb,
 '["planche","front_lever","handstand","muscle_up","back_lever"]'::jsonb,
 '["calisthenics","skill"]'::jsonb,
 NULL, 5, 1.2),

('prn-skill-fresh-cns', 'src-spartan-foundation-v1', 'skill_frequency', 'skill_fresh_cns_only',
 'Skill Work First, Always Fresh',
 'Skill exposures must come at the start of the session before any pre-fatigue. Practicing skills with accumulated fatigue trains a degraded motor pattern.',
 '["beginner","intermediate","advanced"]'::jsonb, '["skill","strength"]'::jsonb,
 '["planche","front_lever","handstand","muscle_up","back_lever","iron_cross"]'::jsonb,
 '["calisthenics","skill"]'::jsonb,
 NULL, 8, 1.4),

('prn-skill-no-failure', 'src-spartan-foundation-v1', 'skill_frequency', 'skill_no_failure',
 'Never Train Skill to Failure',
 'Static holds and skill-progressions stop at form breakdown, not at muscular failure. Failure on skill teaches incorrect compensations and increases injury risk.',
 '["beginner","intermediate","advanced"]'::jsonb, '["skill"]'::jsonb,
 '["planche","front_lever","handstand","back_lever","iron_cross"]'::jsonb,
 '["calisthenics","skill"]'::jsonb,
 NULL, 9, 1.5),

-- Progression-sensitive dosing
('prn-progression-conservative', 'src-spartan-foundation-v1', 'progression_dosing', 'conservative_when_progressing',
 'Hold Volume When Increasing Progression Difficulty',
 'When advancing to a harder progression (e.g., tuck → straddle planche), keep total weekly volume CONSTANT or slightly lower for 1-2 weeks. Stacking new variant + more volume is the most common cause of skill regression.',
 '["intermediate","advanced"]'::jsonb, '["skill","strength"]'::jsonb, NULL,
 '["calisthenics","skill"]'::jsonb, NULL, 6, 1.2),

('prn-progression-rir-quality', 'src-spartan-foundation-v1', 'progression_dosing', 'rir_quality_threshold',
 'RIR≥2 Quality Threshold to Advance',
 'Only advance to the next progression when current variant can be performed for the prescribed reps with at least 2 reps in reserve, at full ROM, with clean form across all working sets in 2 consecutive sessions.',
 '["beginner","intermediate","advanced"]'::jsonb, '["strength","skill"]'::jsonb, NULL,
 '["calisthenics","strength"]'::jsonb, NULL, 7, 1.3),

-- Method toolbox principles
('prn-superset-pairing', 'src-method-toolbox-v1', 'methods', 'superset_pairing_rule',
 'Supersets Pair Antagonists or Non-Competing Movements',
 'Superset pairs should be antagonist (e.g., pull + push), non-competing (upper + core, push + lower-mobility), or compound + isolation of the SAME movement. Never superset two movements that compete for the same fatigue substrate (e.g., two heavy vertical pulls).',
 '["beginner","intermediate","advanced"]'::jsonb, '["strength","general","weighted_calisthenics"]'::jsonb,
 NULL, '["calisthenics","strength"]'::jsonb,
 NULL, 6, 1.2),

('prn-circuit-eligibility', 'src-method-toolbox-v1', 'methods', 'circuit_eligibility',
 'Circuits Earn Their Place — Density-Capacity Days Only',
 'Circuit format (3-5 movements, minimal rest, multiple rounds) belongs on density-capacity days or as conditioning finishers — NOT on skill-quality, primary-strength, or recovery days. Circuits degrade skill and primary strength stimulus.',
 '["intermediate","advanced"]'::jsonb, '["general","weighted_calisthenics","strength"]'::jsonb,
 NULL, '["calisthenics","conditioning","weighted_calisthenics"]'::jsonb,
 NULL, 5, 1.0),

('prn-cluster-eligibility', 'src-method-toolbox-v1', 'methods', 'cluster_eligibility',
 'Clusters Are For Heavy Strength, Not Hypertrophy',
 'Cluster sets (mini-rests inside a working set) are a heavy-strength tool for advanced trainees on weighted compounds. They are NOT a hypertrophy or accessory tool. Use 2-5 reps per cluster, 15-30s intra-rest, ≥85% load.',
 '["advanced"]'::jsonb, '["strength","weighted_calisthenics"]'::jsonb,
 NULL, '["weighted_calisthenics","strength"]'::jsonb,
 '["weight_belt"]'::jsonb, 6, 1.1),

('prn-rest-pause-eligibility', 'src-method-toolbox-v1', 'methods', 'rest_pause_eligibility',
 'Rest-Pause for Hypertrophy Accumulation, Not Skill or Heavy',
 'Rest-pause (drop reps to mini-rest then continue) is a hypertrophy / accumulation tool on accessory and isolation movements. Never on skill, never on max-strength compound rows, never on technique-dominant calisthenics.',
 '["intermediate","advanced"]'::jsonb, '["strength","weighted_calisthenics","general"]'::jsonb,
 NULL, '["calisthenics","weighted_calisthenics"]'::jsonb,
 NULL, 5, 1.0),

('prn-density-eligibility', 'src-method-toolbox-v1', 'methods', 'density_capacity_only',
 'Density Methods Only on Density Days',
 'EMOM, AMRAP, density blocks belong on capacity / conditioning days. They downgrade strength and skill stimulus when applied elsewhere.',
 '["intermediate","advanced"]'::jsonb, '["general","weighted_calisthenics"]'::jsonb,
 NULL, '["conditioning","calisthenics"]'::jsonb,
 NULL, 4, 0.9),

-- Recovery / tissue
('prn-recovery-rpe-cap', 'src-recovery-tissue-v1', 'recovery', 'recovery_rpe_cap',
 'Recovery Days Cap RPE at 6',
 'Recovery-supportive days run RPE ≤ 6, fewer sets (-1 from working baseline), and reduced rep ranges. The intent is tissue restoration, not stimulus.',
 '["beginner","intermediate","advanced"]'::jsonb, '["general","strength","skill","weighted_calisthenics"]'::jsonb,
 NULL, '["calisthenics","strength","skill"]'::jsonb,
 NULL, 7, 1.2),

('prn-tendon-elbow-volume', 'src-recovery-tissue-v1', 'tendon_management', 'elbow_tendon_volume_cap',
 'Cap Weekly Heavy Elbow-Loaded Sets',
 'Heavy bent-arm pulling/pushing (weighted pull-up, weighted dip, ring chest fly, ring archer) total ≤ 18 hard sets per week to manage elbow tendon load. Distribute across 2-3 sessions, never all in one day.',
 '["intermediate","advanced"]'::jsonb, '["strength","weighted_calisthenics","skill"]'::jsonb,
 NULL, '["calisthenics","weighted_calisthenics","strength"]'::jsonb,
 NULL, 7, 1.2),

('prn-tendon-shoulder-rom', 'src-recovery-tissue-v1', 'tendon_management', 'shoulder_full_rom',
 'Full Active Shoulder ROM Pre-Heavy',
 'Before heavy overhead, vertical-pull, or skill work, the session must include at least one active shoulder ROM warm-up (scapular pull-ups, dead hangs, shoulder dislocates with stick/band, wall slides).',
 '["beginner","intermediate","advanced"]'::jsonb, '["strength","skill","weighted_calisthenics"]'::jsonb,
 '["planche","front_lever","handstand","muscle_up"]'::jsonb,
 '["calisthenics","strength","skill"]'::jsonb,
 NULL, 8, 1.3),

-- Heavy / moderate / supportive day construction
('prn-day-heavy-shape', 'src-spartan-foundation-v1', 'day_construction', 'heavy_day_shape',
 'Heavy Day Reads Narrower and Higher-Intent',
 'Heavy strength days run fewer rows (3-5), lower reps (3-6), longer rest (3-5min), higher RPE ceiling (8-9). Less total breadth, more intent per row.',
 '["intermediate","advanced"]'::jsonb, '["strength","weighted_calisthenics"]'::jsonb,
 NULL, '["calisthenics","weighted_calisthenics","strength"]'::jsonb,
 NULL, 6, 1.2),

('prn-day-broad-shape', 'src-spartan-foundation-v1', 'day_construction', 'broad_mixed_shape',
 'Broad/Mixed Day Reads Wider and Mid-Intent',
 'Broad mixed-volume days run more rows (5-7) covering multiple movement families, mid rep ranges (6-12), moderate rest (90-180s), RPE 7-8 ceiling. Coverage > peak intent.',
 '["beginner","intermediate","advanced"]'::jsonb, '["general","strength","skill"]'::jsonb,
 NULL, '["calisthenics","strength"]'::jsonb,
 NULL, 5, 1.0),

('prn-day-recovery-shape', 'src-recovery-tissue-v1', 'day_construction', 'recovery_supportive_shape',
 'Recovery Day Reads Smallest and Lowest-Intent',
 'Recovery-supportive days run 2-4 rows of supportive/technical movements, reduced sets (-1), reduced reps (-1), RPE ≤ 6, no methods, no finisher. Visibly the lightest day of the week.',
 '["beginner","intermediate","advanced"]'::jsonb, '["general","strength","skill","weighted_calisthenics"]'::jsonb,
 NULL, '["calisthenics","strength"]'::jsonb,
 NULL, 7, 1.2),

('prn-day-skill-quality-shape', 'src-spartan-foundation-v1', 'day_construction', 'skill_quality_shape',
 'Skill-Quality Day Reads Cleaner and CNS-Fresh',
 'Skill-quality days run 3-5 rows, skill exposures FIRST and FRESH, conservative progression dosing (no progression bumps), RPE ≤ 7, longer rest between skill attempts (2-4min). Quality > quantity.',
 '["intermediate","advanced"]'::jsonb, '["skill"]'::jsonb,
 '["planche","front_lever","handstand","muscle_up","back_lever"]'::jsonb,
 '["calisthenics","skill"]'::jsonb,
 NULL, 7, 1.3)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3) METHOD RULES (~12 new rows)
-- -----------------------------------------------------------------------------
INSERT INTO method_rules
  (id, source_id, method_key, category, compatible_goals_json, compatible_levels_json,
   best_use_cases_json, avoid_use_cases_json, structure_bias_json, volume_bias_json,
   intensity_bias_json, density_bias_json)
VALUES
('mth-top-set', 'src-method-toolbox-v1', 'top_set', 'intensification',
 '["strength","weighted_calisthenics"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["weighted_pull_up","weighted_dip","weighted_ring_row","front_lever_row"]'::jsonb,
 '["skill_holds","explosive_movements","isolation_accessories"]'::jsonb,
 '{"sets":1,"warmup_sets":2,"reps":"3-6","rest_seconds":240}'::jsonb,
 '{"weekly_max_per_movement":1,"sessions_per_week_per_movement":1}'::jsonb,
 '{"target_rpe":9,"load_pct_1rm":"85-92"}'::jsonb,
 '{"intra_set_rest":null,"between_sets_rest_seconds":240}'::jsonb),

('mth-back-off', 'src-method-toolbox-v1', 'back_off', 'volume_accumulation',
 '["strength","weighted_calisthenics","general"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["weighted_pull_up","weighted_dip","weighted_ring_row","barbell_row"]'::jsonb,
 '["skill_holds","explosive_movements"]'::jsonb,
 '{"sets":"2-3","reps":"6-10","rest_seconds":150,"load_drop_pct":"10-20"}'::jsonb,
 '{"weekly_max_per_movement":2}'::jsonb,
 '{"target_rpe":8,"load_pct_1rm":"70-80"}'::jsonb,
 '{"between_sets_rest_seconds":150}'::jsonb),

('mth-cluster', 'src-method-toolbox-v1', 'cluster', 'intensification',
 '["strength","weighted_calisthenics"]'::jsonb,
 '["advanced"]'::jsonb,
 '["weighted_pull_up","weighted_dip"]'::jsonb,
 '["skill_holds","explosive_movements","isolation_accessories","beginner_progressions"]'::jsonb,
 '{"sets":"4-6","reps_per_cluster":"2-3","intra_set_rest_seconds":"15-30","rest_seconds":180}'::jsonb,
 '{"weekly_max_per_movement":1}'::jsonb,
 '{"target_rpe":8.5,"load_pct_1rm":"85-92"}'::jsonb,
 '{"intra_set_rest_seconds":"15-30","between_sets_rest_seconds":180}'::jsonb),

('mth-drop-set', 'src-method-toolbox-v1', 'drop_set', 'hypertrophy_accumulation',
 '["strength","general"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["accessory_isolation","support_movements","push_ups","ring_rows","tricep_extensions","bicep_curls","lateral_raises"]'::jsonb,
 '["skill_holds","weighted_compounds_at_max","explosive_movements","chest_to_bar","muscle_up","planche","front_lever","archer_pulls","typewriter_pulls","one_arm_progressions"]'::jsonb,
 '{"primary_set":1,"drop_count":"1-2","drop_pct":"20-30","total_reps":"15-30"}'::jsonb,
 '{"placement":"finisher_only","sets_per_session":1}'::jsonb,
 '{"target_rpe":9,"effort":"to_form_failure"}'::jsonb,
 '{"between_drops_rest_seconds":"5-10"}'::jsonb),

('mth-rest-pause', 'src-method-toolbox-v1', 'rest_pause', 'hypertrophy_accumulation',
 '["strength","general"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["accessory_isolation","ring_rows","push_ups","bicep_curls","tricep_extensions"]'::jsonb,
 '["skill_holds","weighted_compounds","explosive_movements","beginner_progressions"]'::jsonb,
 '{"primary_set":1,"mini_rests":"2-3","mini_rest_seconds":"15-20","reps_per_burst":"2-5"}'::jsonb,
 '{"placement":"late_accessory","sets_per_session":1}'::jsonb,
 '{"target_rpe":9,"effort":"hard"}'::jsonb,
 '{"intra_set_rest_seconds":"15-20"}'::jsonb),

('mth-superset', 'src-method-toolbox-v1', 'superset', 'efficiency_density',
 '["strength","general","weighted_calisthenics"]'::jsonb,
 '["beginner","intermediate","advanced"]'::jsonb,
 '["antagonist_pairs_pull_push","non_competing_upper_core","compound_plus_isolation_same_pattern","accessory_pairs"]'::jsonb,
 '["heavy_skill_holds","two_competing_max_strength","two_vertical_pulls_back_to_back"]'::jsonb,
 '{"members":2,"rounds":"3-4","rest_between_pair_seconds":"60-120"}'::jsonb,
 '{"shared_rounds":true,"member_rounds_must_match":true}'::jsonb,
 '{"target_rpe":"7-8","effort":"productive"}'::jsonb,
 '{"between_pairs_rest_seconds":"60-120"}'::jsonb),

('mth-circuit', 'src-method-toolbox-v1', 'circuit', 'density_conditioning',
 '["general","weighted_calisthenics"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["density_capacity_day","conditioning_finisher","accessory_breadth"]'::jsonb,
 '["skill_quality_day","primary_strength_day","recovery_day","heavy_compound_rows"]'::jsonb,
 '{"members":"3-5","rounds":"3-5","rest_between_rounds_seconds":"60-90"}'::jsonb,
 '{"shared_rounds":true,"member_rounds_must_match":true}'::jsonb,
 '{"target_rpe":"7-8","effort":"sustainable_pace"}'::jsonb,
 '{"intra_circuit_rest_seconds":"0-15"}'::jsonb),

('mth-density-emom', 'src-method-toolbox-v1', 'emom', 'density_conditioning',
 '["general","weighted_calisthenics"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["density_capacity_day","skill_practice_low_load","conditioning"]'::jsonb,
 '["max_strength","heavy_skill","recovery_day"]'::jsonb,
 '{"interval_seconds":60,"work_seconds_per_minute":"20-40","total_minutes":"8-15"}'::jsonb,
 '{"placement":"density_block_or_finisher"}'::jsonb,
 '{"target_rpe":"7","effort":"repeatable"}'::jsonb,
 '{"work_to_rest_ratio":"1:1_to_1:2"}'::jsonb),

('mth-density-amrap', 'src-method-toolbox-v1', 'amrap', 'density_conditioning',
 '["general","weighted_calisthenics"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["density_capacity_day","conditioning_finisher"]'::jsonb,
 '["skill_quality_day","primary_strength_day","recovery_day","heavy_compounds"]'::jsonb,
 '{"duration_minutes":"6-12","movements":"2-4"}'::jsonb,
 '{"placement":"finisher_only"}'::jsonb,
 '{"target_rpe":"8","effort":"sustainable_hard"}'::jsonb,
 '{"continuous":true}'::jsonb),

('mth-finisher-burnout', 'src-method-toolbox-v1', 'finisher_burnout', 'finisher',
 '["strength","general","weighted_calisthenics"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["accessory_close","capacity_day_close","hypertrophy_focus"]'::jsonb,
 '["skill_quality_day","recovery_day","primary_strength_day_close"]'::jsonb,
 '{"duration_minutes":"3-6","movements":"1-2"}'::jsonb,
 '{"placement":"session_close_only"}'::jsonb,
 '{"target_rpe":"9","effort":"to_form_failure"}'::jsonb,
 NULL),

('mth-isometric-hold', 'src-method-toolbox-v1', 'isometric_hold', 'skill_strength',
 '["skill","strength"]'::jsonb,
 '["beginner","intermediate","advanced"]'::jsonb,
 '["planche_progressions","front_lever_progressions","l_sit","handstand_hold","back_lever","iron_cross"]'::jsonb,
 '["density_circuits","drop_sets","rest_pause"]'::jsonb,
 '{"sets":"3-5","hold_seconds":"5-20","rest_seconds":120}'::jsonb,
 '{"weekly_frequency":"3-5","placement":"first_when_fresh"}'::jsonb,
 '{"target_rpe":"7","effort":"clean_form_no_failure"}'::jsonb,
 NULL),

('mth-paused-rep', 'src-method-toolbox-v1', 'paused_rep', 'technique_strength',
 '["strength","skill","weighted_calisthenics"]'::jsonb,
 '["intermediate","advanced"]'::jsonb,
 '["pull_ups","dips","squats","handstand_push_ups","ring_dips"]'::jsonb,
 '["explosive_movements","circuits"]'::jsonb,
 '{"pause_seconds":"1-3","sets":"3-4","reps":"5-8","rest_seconds":150}'::jsonb,
 '{"placement":"primary_or_secondary"}'::jsonb,
 '{"target_rpe":"8","effort":"strict_quality"}'::jsonb,
 NULL),

('mth-tempo-eccentric', 'src-method-toolbox-v1', 'tempo_eccentric', 'technique_hypertrophy',
 '["strength","skill","general"]'::jsonb,
 '["beginner","intermediate","advanced"]'::jsonb,
 '["pull_ups","dips","ring_rows","push_ups","squats","negative_progressions"]'::jsonb,
 '["explosive_movements","density_circuits","emom"]'::jsonb,
 '{"eccentric_seconds":"3-5","concentric_seconds":"1-2","sets":"3-4","reps":"5-8"}'::jsonb,
 '{"placement":"primary_or_accessory"}'::jsonb,
 '{"target_rpe":"7-8","effort":"controlled"}'::jsonb,
 NULL)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4) PRESCRIPTION RULES (~15 new rows)
-- -----------------------------------------------------------------------------
INSERT INTO prescription_rules
  (id, source_id, level_scope, goal_scope, exercise_role_scope,
   rep_range_json, set_range_json, hold_range_json, rest_range_json,
   rpe_guidance_json, progression_guidance)
VALUES
-- Strength / weighted strength
('pres-primary-strength-int', 'src-weighted-calisthenics-v1', '["intermediate"]'::jsonb,
 '["strength","weighted_calisthenics"]'::jsonb, '["primary"]'::jsonb,
 '{"min":4,"max":6}'::jsonb, '{"min":3,"max":4}'::jsonb, NULL,
 '{"min_seconds":180,"max_seconds":240}'::jsonb,
 '{"target":8,"min":7,"max":9}'::jsonb,
 'Add load when 4 working sets at the top of the rep range hit RPE ≤8 with full ROM.'),

('pres-primary-strength-adv', 'src-weighted-calisthenics-v1', '["advanced"]'::jsonb,
 '["strength","weighted_calisthenics"]'::jsonb, '["primary"]'::jsonb,
 '{"min":3,"max":5}'::jsonb, '{"min":3,"max":5}'::jsonb, NULL,
 '{"min_seconds":240,"max_seconds":300}'::jsonb,
 '{"target":8.5,"min":8,"max":9}'::jsonb,
 'Top set + back-off shape. Advance load when top set hits target reps at RPE ≤8.5.'),

('pres-secondary-strength-int', 'src-spartan-foundation-v1', '["intermediate"]'::jsonb,
 '["strength","weighted_calisthenics","general"]'::jsonb, '["secondary","support"]'::jsonb,
 '{"min":6,"max":10}'::jsonb, '{"min":3,"max":4}'::jsonb, NULL,
 '{"min_seconds":120,"max_seconds":180}'::jsonb,
 '{"target":8,"min":7,"max":8}'::jsonb,
 'Standard double-progression. Add reps to top of range, then increase load/progression.'),

('pres-accessory-int', 'src-spartan-foundation-v1', '["intermediate","advanced"]'::jsonb,
 '["strength","general","weighted_calisthenics"]'::jsonb, '["accessory"]'::jsonb,
 '{"min":8,"max":15}'::jsonb, '{"min":3,"max":4}'::jsonb, NULL,
 '{"min_seconds":75,"max_seconds":120}'::jsonb,
 '{"target":8,"min":7,"max":9}'::jsonb,
 'Volume-driven. RIR≥1 on last working set. Drop sets / rest-pause acceptable as finisher.'),

('pres-accessory-beg', 'src-spartan-foundation-v1', '["beginner"]'::jsonb,
 '["strength","general"]'::jsonb, '["accessory"]'::jsonb,
 '{"min":10,"max":15}'::jsonb, '{"min":2,"max":3}'::jsonb, NULL,
 '{"min_seconds":60,"max_seconds":90}'::jsonb,
 '{"target":7,"min":6,"max":8}'::jsonb,
 'Build volume tolerance. Stay 2-3 RIR until consistent form.'),

-- Skill prescriptions
('pres-skill-hold-int', 'src-spartan-foundation-v1', '["intermediate"]'::jsonb,
 '["skill"]'::jsonb, '["primary","secondary"]'::jsonb,
 NULL, '{"min":4,"max":6}'::jsonb,
 '{"min_seconds":5,"max_seconds":15}'::jsonb,
 '{"min_seconds":120,"max_seconds":180}'::jsonb,
 '{"target":7,"min":6,"max":8}'::jsonb,
 'Accumulate clean static seconds. Advance progression only when total clean seconds at RPE ≤7 across the session.'),

('pres-skill-hold-adv', 'src-spartan-foundation-v1', '["advanced"]'::jsonb,
 '["skill"]'::jsonb, '["primary"]'::jsonb,
 NULL, '{"min":4,"max":8}'::jsonb,
 '{"min_seconds":5,"max_seconds":20}'::jsonb,
 '{"min_seconds":120,"max_seconds":240}'::jsonb,
 '{"target":7,"min":6,"max":8}'::jsonb,
 'Quality > duration. Stop holds at first form breakdown.'),

('pres-skill-dynamic-int', 'src-spartan-foundation-v1', '["intermediate"]'::jsonb,
 '["skill"]'::jsonb, '["primary"]'::jsonb,
 '{"min":3,"max":6}'::jsonb, '{"min":4,"max":6}'::jsonb, NULL,
 '{"min_seconds":120,"max_seconds":180}'::jsonb,
 '{"target":7,"min":6,"max":8}'::jsonb,
 'Skill reps stop at form breakdown, never to failure. RIR≥2.'),

-- Core / support
('pres-core-int', 'src-spartan-foundation-v1', '["intermediate","advanced"]'::jsonb,
 '["strength","general","skill"]'::jsonb, '["accessory","support"]'::jsonb,
 '{"min":8,"max":20}'::jsonb, '{"min":3,"max":4}'::jsonb,
 '{"min_seconds":15,"max_seconds":45}'::jsonb,
 '{"min_seconds":60,"max_seconds":90}'::jsonb,
 '{"target":7,"min":6,"max":8}'::jsonb,
 'Mix dynamic reps and isometric holds. Quality > volume.'),

-- Recovery-supportive day prescription
('pres-recovery-day', 'src-recovery-tissue-v1', '["beginner","intermediate","advanced"]'::jsonb,
 '["general","strength","skill","weighted_calisthenics"]'::jsonb,
 '["accessory","support"]'::jsonb,
 '{"min":6,"max":10}'::jsonb, '{"min":2,"max":3}'::jsonb,
 '{"min_seconds":15,"max_seconds":30}'::jsonb,
 '{"min_seconds":60,"max_seconds":120}'::jsonb,
 '{"target":6,"min":5,"max":6}'::jsonb,
 'Do NOT push. Restorative dosing. Tissue-friendly support movements only.'),

-- Density / capacity day prescription
('pres-density-day-int', 'src-method-toolbox-v1', '["intermediate","advanced"]'::jsonb,
 '["general","weighted_calisthenics"]'::jsonb, '["accessory","support"]'::jsonb,
 '{"min":8,"max":15}'::jsonb, '{"min":3,"max":4}'::jsonb, NULL,
 '{"min_seconds":30,"max_seconds":75}'::jsonb,
 '{"target":7,"min":6,"max":7}'::jsonb,
 'Density-driven. Repeatable pace. Avoid grinding to failure.'),

-- Heavy day RPE shape
('pres-heavy-day', 'src-spartan-foundation-v1', '["intermediate","advanced"]'::jsonb,
 '["strength","weighted_calisthenics"]'::jsonb, '["primary"]'::jsonb,
 '{"min":3,"max":6}'::jsonb, '{"min":3,"max":4}'::jsonb, NULL,
 '{"min_seconds":180,"max_seconds":300}'::jsonb,
 '{"target":8.5,"min":8,"max":9}'::jsonb,
 'Heavy strength stimulus. Long rest. Top set + back-off acceptable when earned.'),

-- Beginner skill caution
('pres-skill-beg-cautious', 'src-spartan-foundation-v1', '["beginner"]'::jsonb,
 '["skill"]'::jsonb, '["primary"]'::jsonb,
 '{"min":3,"max":6}'::jsonb, '{"min":3,"max":4}'::jsonb,
 '{"min_seconds":3,"max_seconds":10}'::jsonb,
 '{"min_seconds":120,"max_seconds":180}'::jsonb,
 '{"target":6,"min":5,"max":7}'::jsonb,
 'Neural rehearsal phase. Stop at any form deviation. Never to failure.'),

-- Mobility
('pres-mobility-any', 'src-recovery-tissue-v1', '["beginner","intermediate","advanced"]'::jsonb,
 '["general","strength","skill","weighted_calisthenics"]'::jsonb,
 '["support","mobility"]'::jsonb,
 '{"min":8,"max":15}'::jsonb, '{"min":2,"max":3}'::jsonb,
 '{"min_seconds":20,"max_seconds":45}'::jsonb,
 '{"min_seconds":30,"max_seconds":60}'::jsonb,
 '{"target":5,"min":4,"max":6}'::jsonb,
 'Active range work. No effort target. Focus on position quality.')

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5) EXERCISE SELECTION RULES (~20 new rows)
-- -----------------------------------------------------------------------------
INSERT INTO exercise_selection_rules
  (id, source_id, goal_key, skill_key, exercise_key, role_key,
   level_scope, equipment_requirements_json, joint_conflict_json,
   preferred_when_json, avoid_when_json, carryover_tags_json, selection_weight)
VALUES
-- Vertical pull family
('sel-pullup-bw-int', 'src-spartan-foundation-v1', 'strength', 'pull_up', 'pull_up', 'primary',
 '["beginner","intermediate"]'::jsonb,
 '["pull_up_bar"]'::jsonb, '[]'::jsonb,
 '["vertical_pull_needed","beginner_progression","general_strength"]'::jsonb,
 '["primary_vertical_pull_already_present"]'::jsonb,
 '["vertical_pull","bent_arm_pull","pull_strength_base"]'::jsonb, 1.3),

('sel-weighted-pullup', 'src-weighted-calisthenics-v1', 'weighted_calisthenics', NULL, 'weighted_pull_up', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '["pull_up_bar","weight_belt"]'::jsonb, '["elbow_pain","shoulder_pain"]'::jsonb,
 '["weighted_strength_day","heavy_pull_focus"]'::jsonb,
 '["recovery_day","skill_quality_day","elbow_tendon_overload"]'::jsonb,
 '["vertical_pull","bent_arm_pull","weighted_strength","muscle_up_carryover"]'::jsonb, 1.5),

('sel-c2b-pullup', 'src-spartan-foundation-v1', 'skill', 'muscle_up', 'chest_to_bar_pull_up', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '["pull_up_bar"]'::jsonb, '["shoulder_pain"]'::jsonb,
 '["muscle_up_progression","high_pull_strength_focus"]'::jsonb,
 '["recovery_day","beginner_level"]'::jsonb,
 '["vertical_pull","high_pull","muscle_up_carryover","skill_adjacent"]'::jsonb, 1.2),

('sel-archer-pullup', 'src-spartan-foundation-v1', 'skill', 'one_arm_pull_up', 'archer_pull_up', 'primary',
 '["advanced"]'::jsonb,
 '["pull_up_bar"]'::jsonb, '["shoulder_pain","elbow_pain"]'::jsonb,
 '["one_arm_pullup_progression","unilateral_pull_focus"]'::jsonb,
 '["recovery_day","intermediate_level","beginner_level"]'::jsonb,
 '["vertical_pull","unilateral","one_arm_pullup_carryover","skill_adjacent"]'::jsonb, 1.1),

-- Horizontal pull family
('sel-ring-row-int', 'src-spartan-foundation-v1', 'strength', NULL, 'ring_row', 'secondary',
 '["beginner","intermediate","advanced"]'::jsonb,
 '["rings"]'::jsonb, '[]'::jsonb,
 '["horizontal_pull_needed","support_pull"]'::jsonb,
 '["horizontal_pull_already_present"]'::jsonb,
 '["horizontal_pull","bent_arm_pull","ring_strength"]'::jsonb, 1.2),

('sel-front-lever-row', 'src-movement-balance-v1', 'skill', 'front_lever', 'front_lever_row', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '["pull_up_bar","rings"]'::jsonb, '["lower_back_pain"]'::jsonb,
 '["front_lever_progression","horizontal_pull_strength"]'::jsonb,
 '["recovery_day","beginner_level"]'::jsonb,
 '["horizontal_pull","front_lever_carryover","compression"]'::jsonb, 1.3),

('sel-tuck-fl-hold', 'src-movement-balance-v1', 'skill', 'front_lever', 'tuck_front_lever_hold', 'primary',
 '["intermediate"]'::jsonb,
 '["pull_up_bar","rings"]'::jsonb, '[]'::jsonb,
 '["front_lever_progression","straight_arm_pull_focus"]'::jsonb,
 '["beginner_level"]'::jsonb,
 '["straight_arm_pull","front_lever_carryover","isometric_hold"]'::jsonb, 1.4),

-- Vertical push family
('sel-dip-int', 'src-spartan-foundation-v1', 'strength', 'dip', 'dip', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '["dip_bars","rings"]'::jsonb, '["shoulder_pain","elbow_pain"]'::jsonb,
 '["vertical_push_needed","general_strength"]'::jsonb,
 '["primary_vertical_push_already_present"]'::jsonb,
 '["vertical_push","bent_arm_push","push_strength_base"]'::jsonb, 1.3),

('sel-weighted-dip', 'src-weighted-calisthenics-v1', 'weighted_calisthenics', NULL, 'weighted_dip', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '["dip_bars","weight_belt"]'::jsonb, '["shoulder_pain","elbow_pain"]'::jsonb,
 '["weighted_strength_day","heavy_push_focus"]'::jsonb,
 '["recovery_day","skill_quality_day","shoulder_overload_week"]'::jsonb,
 '["vertical_push","bent_arm_push","weighted_strength"]'::jsonb, 1.4),

('sel-hspu-int', 'src-spartan-foundation-v1', 'skill', 'handstand_push_up', 'pike_push_up', 'primary',
 '["beginner","intermediate"]'::jsonb,
 '[]'::jsonb, '["wrist_pain","shoulder_pain"]'::jsonb,
 '["hspu_progression","vertical_push_skill"]'::jsonb,
 '["wrist_caution_active"]'::jsonb,
 '["vertical_push","hspu_carryover","bent_arm_push"]'::jsonb, 1.2),

-- Horizontal push family
('sel-pushup-int', 'src-spartan-foundation-v1', 'strength', NULL, 'push_up', 'secondary',
 '["beginner","intermediate","advanced"]'::jsonb,
 '[]'::jsonb, '["wrist_pain"]'::jsonb,
 '["horizontal_push_needed","accessory_volume"]'::jsonb,
 '["horizontal_push_already_present"]'::jsonb,
 '["horizontal_push","bent_arm_push"]'::jsonb, 1.1),

('sel-planche-lean', 'src-movement-balance-v1', 'skill', 'planche', 'planche_lean', 'primary',
 '["intermediate"]'::jsonb,
 '[]'::jsonb, '["wrist_pain"]'::jsonb,
 '["planche_progression","straight_arm_push_focus"]'::jsonb,
 '["beginner_level","wrist_caution_active"]'::jsonb,
 '["straight_arm_push","planche_carryover"]'::jsonb, 1.4),

('sel-tuck-planche-hold', 'src-movement-balance-v1', 'skill', 'planche', 'tuck_planche_hold', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '["parallettes"]'::jsonb, '["wrist_pain"]'::jsonb,
 '["planche_progression","straight_arm_push_isometric"]'::jsonb,
 '["beginner_level","wrist_caution_active"]'::jsonb,
 '["straight_arm_push","planche_carryover","isometric_hold"]'::jsonb, 1.3),

-- Core / compression
('sel-l-sit-int', 'src-movement-balance-v1', 'skill', 'l_sit', 'l_sit_hold', 'support',
 '["beginner","intermediate","advanced"]'::jsonb,
 '["parallettes","floor"]'::jsonb, '["wrist_pain"]'::jsonb,
 '["compression_needed","core_skill"]'::jsonb,
 '["wrist_caution_active"]'::jsonb,
 '["compression","l_sit_carryover","isometric_hold"]'::jsonb, 1.2),

('sel-hollow-hold', 'src-spartan-foundation-v1', 'general', NULL, 'hollow_hold', 'support',
 '["beginner","intermediate","advanced"]'::jsonb,
 '[]'::jsonb, '["lower_back_pain"]'::jsonb,
 '["core_stability_needed","skill_supportive"]'::jsonb,
 '[]'::jsonb,
 '["compression","trunk_stability"]'::jsonb, 1.0),

-- Lower body
('sel-bulgarian-split-squat', 'src-movement-balance-v1', 'general', NULL, 'bulgarian_split_squat', 'secondary',
 '["beginner","intermediate","advanced"]'::jsonb,
 '["bench_or_box"]'::jsonb, '["knee_pain"]'::jsonb,
 '["lower_body_needed","unilateral_leg_strength"]'::jsonb,
 '["lower_body_already_covered"]'::jsonb,
 '["leg_strength","unilateral","hip_stability"]'::jsonb, 1.2),

('sel-pistol-squat', 'src-spartan-foundation-v1', 'skill', 'pistol_squat', 'pistol_squat', 'primary',
 '["intermediate","advanced"]'::jsonb,
 '[]'::jsonb, '["knee_pain","ankle_mobility_limited"]'::jsonb,
 '["pistol_progression","unilateral_leg_skill"]'::jsonb,
 '["beginner_level","knee_caution_active"]'::jsonb,
 '["leg_strength","unilateral","leg_skill"]'::jsonb, 1.2),

-- Recovery day exercises
('sel-scapular-pullup', 'src-recovery-tissue-v1', 'general', NULL, 'scapular_pull_up', 'support',
 '["beginner","intermediate","advanced"]'::jsonb,
 '["pull_up_bar"]'::jsonb, '[]'::jsonb,
 '["recovery_day","shoulder_warmup","tissue_management"]'::jsonb,
 '[]'::jsonb,
 '["shoulder_health","scapular_strength","tissue_management"]'::jsonb, 1.0),

('sel-dead-hang', 'src-recovery-tissue-v1', 'general', NULL, 'dead_hang', 'support',
 '["beginner","intermediate","advanced"]'::jsonb,
 '["pull_up_bar"]'::jsonb, '[]'::jsonb,
 '["recovery_day","grip_endurance","shoulder_decompression"]'::jsonb,
 '[]'::jsonb,
 '["grip","shoulder_health","tissue_management"]'::jsonb, 1.0),

('sel-band-pullaparts', 'src-recovery-tissue-v1', 'general', NULL, 'band_pull_apart', 'support',
 '["beginner","intermediate","advanced"]'::jsonb,
 '["resistance_band"]'::jsonb, '[]'::jsonb,
 '["recovery_day","upper_back_health","postural_support"]'::jsonb,
 '[]'::jsonb,
 '["upper_back","postural_health","tissue_management"]'::jsonb, 0.9)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6) PROGRESSION RULES (~13 new rows)
-- -----------------------------------------------------------------------------
INSERT INTO progression_rules
  (id, source_id, skill_key, current_level_key, next_level_key,
   required_prerequisites_json, min_readiness_json, progression_rule_summary,
   caution_flags_json, confidence_weight)
VALUES
('prg-pullup-band-bw', 'src-spartan-foundation-v1', 'pull_up', 'band_assisted_pull_up', 'pull_up',
 '["3_clean_reps_with_lightest_band"]'::jsonb,
 '{"sets_at_top_of_range":2,"rpe_max":7.5}'::jsonb,
 'Advance from band-assisted to bodyweight pull-up when 3 clean reps with the lightest band at RPE ≤7.5 across 2 sessions.',
 '["scapular_control_required","no_kipping"]'::jsonb, 1.2),

('prg-pullup-bw-weighted', 'src-weighted-calisthenics-v1', 'pull_up', 'pull_up', 'weighted_pull_up',
 '["10_clean_strict_pull_ups"]'::jsonb,
 '{"sets_at_top_of_range":3,"rpe_max":7,"reps_min":10}'::jsonb,
 'Add load (start +5lb / 2.5kg) when bodyweight pull-up reaches 3×10 at RPE ≤7. Progress load only when current load reaches target reps at RPE ≤8.',
 '["elbow_tendon_load","scapular_control"]'::jsonb, 1.3),

('prg-dip-bw-weighted', 'src-weighted-calisthenics-v1', 'dip', 'dip', 'weighted_dip',
 '["12_clean_strict_dips_full_rom"]'::jsonb,
 '{"sets_at_top_of_range":3,"rpe_max":7,"reps_min":12}'::jsonb,
 'Add load when bodyweight dip reaches 3×12 at full ROM at RPE ≤7. Progress conservatively — shoulder warmup mandatory.',
 '["shoulder_full_rom_required","elbow_tendon_load"]'::jsonb, 1.3),

('prg-pullup-c2b', 'src-spartan-foundation-v1', 'muscle_up', 'pull_up', 'chest_to_bar_pull_up',
 '["8_clean_strict_pull_ups"]'::jsonb,
 '{"sets_at_top_of_range":2,"rpe_max":7,"reps_min":8}'::jsonb,
 'Advance to chest-to-bar pull-ups when 2×8 strict pull-ups at RPE ≤7. Aim for sternum contact, not chin-only.',
 '["shoulder_full_rom_required","high_pull_strength"]'::jsonb, 1.1),

('prg-c2b-archer', 'src-spartan-foundation-v1', 'one_arm_pull_up', 'chest_to_bar_pull_up', 'archer_pull_up',
 '["6_clean_chest_to_bar_pull_ups"]'::jsonb,
 '{"sets_at_top_of_range":2,"rpe_max":7.5,"reps_min":6}'::jsonb,
 'Archer pull-up earns when chest-to-bar reaches 2×6 at RPE ≤7.5. Begin with assisted side foot on box.',
 '["shoulder_pain_disqualifying","scapular_control"]'::jsonb, 1.0),

('prg-tuck-fl-straddle-fl', 'src-spartan-foundation-v1', 'front_lever', 'tuck_front_lever_hold', 'advanced_tuck_front_lever_hold',
 '["clean_tuck_fl_15s"]'::jsonb,
 '{"hold_seconds":15,"sets_at_top":3,"rpe_max":7}'::jsonb,
 'Open the tuck (advanced tuck) when 3×15s clean tuck-FL holds at RPE ≤7 across 2 sessions.',
 '["lower_back_neutral","scapular_control"]'::jsonb, 1.2),

('prg-adv-tuck-straddle-fl', 'src-spartan-foundation-v1', 'front_lever', 'advanced_tuck_front_lever_hold', 'straddle_front_lever_hold',
 '["advanced_tuck_fl_15s"]'::jsonb,
 '{"hold_seconds":15,"sets_at_top":3,"rpe_max":7}'::jsonb,
 'Open to straddle FL when 3×15s clean advanced-tuck FL at RPE ≤7. Hold quality > duration.',
 '["lower_back_neutral","scapular_control"]'::jsonb, 1.2),

('prg-planche-lean-tuck', 'src-spartan-foundation-v1', 'planche', 'planche_lean', 'tuck_planche_hold',
 '["lean_45deg_15s"]'::jsonb,
 '{"hold_seconds":15,"sets_at_top":3,"rpe_max":7,"shoulder_angle":"45deg"}'::jsonb,
 'Tuck planche earns when 3×15s lean at 45° shoulder angle clean at RPE ≤7. Wrists conditioned mandatory.',
 '["wrist_pain_disqualifying","wrist_conditioning_required"]'::jsonb, 1.2),

('prg-tuck-planche-straddle', 'src-spartan-foundation-v1', 'planche', 'tuck_planche_hold', 'advanced_tuck_planche_hold',
 '["clean_tuck_planche_10s"]'::jsonb,
 '{"hold_seconds":10,"sets_at_top":3,"rpe_max":7}'::jsonb,
 'Open the tuck planche when 3×10s clean tuck planche at RPE ≤7.',
 '["wrist_pain_disqualifying","scapular_control"]'::jsonb, 1.2),

('prg-pike-pp-elevated-pp', 'src-spartan-foundation-v1', 'handstand_push_up', 'pike_push_up', 'elevated_pike_push_up',
 '["10_clean_pike_push_ups"]'::jsonb,
 '{"sets_at_top":3,"rpe_max":7,"reps_min":10}'::jsonb,
 'Elevate feet (start with 12in box) when 3×10 pike push-ups at RPE ≤7.',
 '["wrist_conditioning_required","shoulder_full_rom_required"]'::jsonb, 1.1),

('prg-pushup-archer', 'src-spartan-foundation-v1', 'one_arm_push_up', 'push_up', 'archer_push_up',
 '["20_clean_strict_pushups"]'::jsonb,
 '{"sets_at_top":2,"rpe_max":7.5,"reps_min":20}'::jsonb,
 'Archer push-up earns when 2×20 strict push-ups at RPE ≤7.5. Begin with light hand assistance on weak side.',
 '["wrist_conditioning_required","shoulder_pain_disqualifying"]'::jsonb, 1.0),

('prg-squat-pistol', 'src-spartan-foundation-v1', 'pistol_squat', 'assisted_pistol_squat', 'pistol_squat',
 '["8_clean_assisted_pistols_per_side"]'::jsonb,
 '{"sets_at_top":2,"rpe_max":7,"reps_per_side_min":8}'::jsonb,
 'Unassisted pistol earns when 2×8 per side assisted pistol (light hand support) at RPE ≤7.',
 '["knee_pain_disqualifying","ankle_mobility_required"]'::jsonb, 1.1),

('prg-c2b-muscle-up', 'src-spartan-foundation-v1', 'muscle_up', 'chest_to_bar_pull_up', 'bar_muscle_up',
 '["12_clean_chest_to_bar_pull_ups","explosive_pull_to_lower_chest"]'::jsonb,
 '{"sets_at_top":2,"rpe_max":7.5,"reps_min":12,"explosive_quality":"to_sternum"}'::jsonb,
 'Muscle-up earns when 2×12 chest-to-bar at RPE ≤7.5 + the athlete can explosively pull to lower-chest in one rep. Practice transition with slow negatives.',
 '["shoulder_full_rom_required","wrist_strength"]'::jsonb, 1.1)

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7) SKILL CARRYOVER RULES (~14 new rows)
-- -----------------------------------------------------------------------------
INSERT INTO skill_carryover_rules
  (id, source_id, source_exercise_or_skill_key, target_skill_key, carryover_type, carryover_strength, rationale)
VALUES
('cry-weighted-pullup-muscleup', 'src-weighted-calisthenics-v1', 'weighted_pull_up', 'muscle_up',
 'indirect', 0.85,
 'Weighted pull-ups build the high-pull strength reserve required to clear the bar for muscle-up transitions.'),

('cry-weighted-pullup-c2b', 'src-weighted-calisthenics-v1', 'weighted_pull_up', 'chest_to_bar_pull_up',
 'direct', 0.9,
 'Weighted pull-ups directly carry to chest-to-bar — same movement, more strength in reserve = higher rep.'),

('cry-weighted-pullup-fl', 'src-weighted-calisthenics-v1', 'weighted_pull_up', 'front_lever',
 'indirect', 0.7,
 'Bent-arm pull strength supports straight-arm front lever holds via shared lat/teres engagement and overall pull capacity.'),

('cry-tuck-fl-fl', 'src-spartan-foundation-v1', 'tuck_front_lever_hold', 'front_lever',
 'prerequisite', 0.95,
 'Direct progression carryover. Tuck FL is the prerequisite isometric for straddle and full FL.'),

('cry-fl-row-fl', 'src-movement-balance-v1', 'front_lever_row', 'front_lever',
 'direct', 0.85,
 'Front lever rows build the dynamic horizontal pulling strength that strengthens the FL hold itself.'),

('cry-weighted-dip-rmu', 'src-weighted-calisthenics-v1', 'weighted_dip', 'ring_muscle_up',
 'indirect', 0.8,
 'Weighted dips build the lockout / dip-out strength of the ring muscle-up.'),

('cry-tuck-planche-planche', 'src-spartan-foundation-v1', 'tuck_planche_hold', 'planche',
 'prerequisite', 0.95,
 'Direct progression. Tuck planche is the prerequisite isometric.'),

('cry-planche-lean-planche', 'src-movement-balance-v1', 'planche_lean', 'planche',
 'accessory', 0.8,
 'Planche leans build the straight-arm shoulder strength, scapular protraction, and wrist conditioning the planche requires.'),

('cry-pike-pp-hspu', 'src-spartan-foundation-v1', 'pike_push_up', 'handstand_push_up',
 'prerequisite', 0.9,
 'Direct progression toward HSPU. Builds vertical push strength in increasingly inverted positions.'),

('cry-archer-pullup-oapu', 'src-spartan-foundation-v1', 'archer_pull_up', 'one_arm_pull_up',
 'prerequisite', 0.9,
 'Archer pull-up shifts load progressively toward one arm. Direct progression toward OAP.'),

('cry-l-sit-compression-fl', 'src-movement-balance-v1', 'l_sit_hold', 'front_lever',
 'accessory', 0.65,
 'L-sit builds the active compression and hip-flexor strength that supports the FL straight-body line.'),

('cry-hollow-hold-fl', 'src-movement-balance-v1', 'hollow_hold', 'front_lever',
 'accessory', 0.55,
 'Hollow hold trains the body line FL requires without the pull demand.'),

('cry-pistol-bulgarian', 'src-spartan-foundation-v1', 'bulgarian_split_squat', 'pistol_squat',
 'indirect', 0.75,
 'Bulgarian split squat builds the unilateral leg strength pistol squat needs.'),

('cry-pullup-c2b', 'src-spartan-foundation-v1', 'pull_up', 'chest_to_bar_pull_up',
 'prerequisite', 0.9,
 'Pull-up is the strict precursor. Higher rep capacity at strict pull-up = easier transition to C2B.')

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8) EXERCISE PREREQUISITE RULES (~10 new rows; was 0)
-- -----------------------------------------------------------------------------
INSERT INTO exercise_prerequisite_rules
  (id, source_id, target_exercise_key, prerequisite_exercise_key, prerequisite_standard_json, rationale)
VALUES
('pre-c2b-needs-pullup', 'src-spartan-foundation-v1', 'chest_to_bar_pull_up', 'pull_up',
 '{"reps_min":8,"sets":2,"rpe_max":7,"form":"strict_full_rom"}'::jsonb,
 'Chest-to-bar requires reserve strength above strict pull-up — needs 8 clean strict pull-ups before C2B is programmed.'),

('pre-archer-needs-c2b', 'src-spartan-foundation-v1', 'archer_pull_up', 'chest_to_bar_pull_up',
 '{"reps_min":6,"sets":2,"rpe_max":7.5}'::jsonb,
 'Archer pull-up is a unilateral-shifted progression that requires C2B-level strength in the working arm.'),

('pre-muscle-up-needs-c2b', 'src-spartan-foundation-v1', 'bar_muscle_up', 'chest_to_bar_pull_up',
 '{"reps_min":12,"sets":2,"rpe_max":7.5,"form":"explosive_to_sternum"}'::jsonb,
 'Muscle-up needs 12 explosive C2B pull-ups before transition work is appropriate.'),

('pre-weighted-pullup-needs-bw', 'src-weighted-calisthenics-v1', 'weighted_pull_up', 'pull_up',
 '{"reps_min":10,"sets":3,"rpe_max":7,"form":"strict_full_rom"}'::jsonb,
 'Weighted pull-up should not be loaded until 3×10 strict bodyweight pull-ups at RPE ≤7. Loading earlier overloads connective tissue before strength base is built.'),

('pre-weighted-dip-needs-bw', 'src-weighted-calisthenics-v1', 'weighted_dip', 'dip',
 '{"reps_min":12,"sets":3,"rpe_max":7,"form":"full_rom_no_kip"}'::jsonb,
 'Weighted dip needs 3×12 strict full-ROM bodyweight dips first.'),

('pre-tuck-fl-needs-pullup', 'src-spartan-foundation-v1', 'tuck_front_lever_hold', 'pull_up',
 '{"reps_min":6,"sets":2,"rpe_max":7}'::jsonb,
 'Tuck FL hold needs sufficient bent-arm pull base (6 strict pull-ups) before straight-arm isometric loading is appropriate.'),

('pre-straddle-fl-needs-tuck', 'src-spartan-foundation-v1', 'straddle_front_lever_hold', 'advanced_tuck_front_lever_hold',
 '{"hold_seconds":15,"sets":3,"rpe_max":7}'::jsonb,
 'Straddle FL needs clean 3×15s advanced-tuck FL first.'),

('pre-tuck-planche-needs-lean', 'src-spartan-foundation-v1', 'tuck_planche_hold', 'planche_lean',
 '{"hold_seconds":15,"shoulder_angle":"45deg","sets":3,"rpe_max":7}'::jsonb,
 'Tuck planche requires clean 45° planche leans for 15s × 3 sets first.'),

('pre-pistol-needs-assisted', 'src-spartan-foundation-v1', 'pistol_squat', 'assisted_pistol_squat',
 '{"reps_per_side_min":8,"sets":2,"rpe_max":7}'::jsonb,
 'Pistol squat needs 2×8 per side assisted pistol with light hand support before unassisted attempts.'),

('pre-hspu-needs-pike', 'src-spartan-foundation-v1', 'handstand_push_up', 'pike_push_up',
 '{"reps_min":10,"sets":3,"rpe_max":7}'::jsonb,
 'Free-standing HSPU requires 3×10 pike push-ups at RPE ≤7 minimum to ensure vertical push base.')

ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9) EXERCISE CONTRAINDICATION RULES (~8 new rows; was 4)
-- -----------------------------------------------------------------------------
INSERT INTO exercise_contraindication_rules
  (id, source_id, exercise_key, blocked_joint_json, blocked_context_json, modification_guidance, severity)
VALUES
('ctr-c2b-shoulder-pain', 'src-spartan-foundation-v1', 'chest_to_bar_pull_up',
 '["shoulder_pain","shoulder_impingement"]'::jsonb,
 '{"acute_pain":true,"unresolved_impingement":true}'::jsonb,
 'Substitute strict pull-up to sternum-aware ROM tolerated. Resolve shoulder issue with mobility work and scapular strength before reintroducing C2B.',
 'blocked'),

('ctr-weighted-pullup-elbow', 'src-weighted-calisthenics-v1', 'weighted_pull_up',
 '["elbow_pain","medial_epicondylitis","lateral_epicondylitis"]'::jsonb,
 '{"acute_elbow_pain":true,"tendon_irritation":true}'::jsonb,
 'Replace with bodyweight pull-up at RPE ≤7. Add eccentric tendon-loading wrist/forearm work. Reintroduce weighted only after 2 weeks pain-free.',
 'blocked'),

('ctr-weighted-dip-shoulder', 'src-weighted-calisthenics-v1', 'weighted_dip',
 '["shoulder_pain","anterior_shoulder_impingement"]'::jsonb,
 '{"acute_pain":true,"depth_painful":true}'::jsonb,
 'Replace with parallel-bar dip to ROM tolerated, or ring dips at higher angle. Avoid going below parallel until pain resolves.',
 'blocked'),

('ctr-muscle-up-shoulder', 'src-spartan-foundation-v1', 'bar_muscle_up',
 '["shoulder_pain","shoulder_instability"]'::jsonb,
 '{"acute_pain":true,"instability_history":true}'::jsonb,
 'Substitute slow-negative muscle-up only with assistance, or replace with explosive C2B work. Resolve shoulder before transition.',
 'blocked'),

('ctr-pistol-knee', 'src-spartan-foundation-v1', 'pistol_squat',
 '["knee_pain","patellar_tendinitis"]'::jsonb,
 '{"acute_knee_pain":true,"patellar_irritation":true}'::jsonb,
 'Replace with split squat at depth tolerated, or box pistol to manageable height.',
 'blocked'),

('ctr-planche-wrist', 'src-spartan-foundation-v1', 'tuck_planche_hold',
 '["wrist_pain"]'::jsonb,
 '{"acute_wrist_pain":true,"unresolved_wrist_strain":true}'::jsonb,
 'Replace with parallette tuck planche or knuckle support. Resolve wrist with conditioning work before flat-palm planche.',
 'blocked'),

('ctr-fl-row-lower-back', 'src-movement-balance-v1', 'front_lever_row',
 '["lower_back_pain"]'::jsonb,
 '{"acute_pain":true,"hyperextension_painful":true}'::jsonb,
 'Maintain hollow body throughout. If hollow cannot be held painlessly, regress to tuck FL row.',
 'caution'),

('ctr-hspu-wrist', 'src-spartan-foundation-v1', 'handstand_push_up',
 '["wrist_pain"]'::jsonb,
 '{"acute_pain":true,"unresolved_wrist_strain":true}'::jsonb,
 'Replace with parallette HSPU or pike push-up on parallettes. Add wrist conditioning.',
 'blocked')

ON CONFLICT (id) DO NOTHING;
