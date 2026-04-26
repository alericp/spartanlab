-- ============================================================================
-- DOCTRINE BATCH 1 — UPLOADED PDF DOCTRINE (SQL SEED)
-- ============================================================================
-- Mirrors lib/doctrine/source-batches/batch-01-uploaded-pdf-doctrine.ts.
-- The in-code file is the FALLBACK; this SQL seed is the LIVE/PRIMARY truth
-- consumed by lib/doctrine-runtime-contract.ts via lib/doctrine-db.ts.
--
-- Provenance: every atom is paraphrased from prompt Section 3 of the
-- "DOCTRINE BATCH 1 INGESTION + TRUTH-TO-UI DELIVERY LOCK" prompt. Raw PDFs
-- were not attached. evidence_snippet is intentionally NULL so a future
-- refinement pass can populate verbatim quotes when PDFs are attached.
--
-- Strictly additive. ON CONFLICT DO NOTHING. Idempotent.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SOURCES (9)
-- ============================================================================

INSERT INTO training_doctrine_sources (
  id, source_key, title, source_type, description, version, is_active,
  ingestion_status, author, primary_domain,
  secondary_domains_json, style_tags_json, athlete_level_bias_json,
  skill_bias_json, equipment_bias_json, program_type_bias_json,
  method_bias_json, confidence_weight_default,
  notes_on_scope, notes_on_limits
) VALUES
  ('src_batch_01_hybrid_ppl',
   'hybrid_ppl_uploaded_pdf_batch_01',
   'Hybrid Push/Pull/Legs (uploaded PDF)',
   'extracted_pdf',
   '6-day Pull/Push/Legs hybrid hypertrophy + strength support. Heavy compounds 6-8 reps, accessories 8-20 reps.',
   'v1', TRUE, 'fully_extracted', NULL, 'hypertrophy_logic',
   '["weighted_strength_logic","hypertrophy_logic","weekly_distribution_logic","accessory_logic","rep_range_logic","rest_interval_logic","set_count_logic"]'::jsonb,
   '["hybrid","ppl","barbell_compound","hypertrophy_bias"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '[]'::jsonb,
   '["barbell","dumbbell","cable","pull_up_bar","dip_bars","rack"]'::jsonb,
   '["push_pull_legs"]'::jsonb,
   '["straight_set","superset","drop_set","top_set"]'::jsonb,
   0.7,
   'Hybrid hypertrophy + strength support template.',
   'Reference for hybrid hypertrophy, not a skill-specific replacement. Should not override skill-specific doctrine when a skill is selected.'),

  ('src_batch_01_forearm_health',
   'forearm_health_uploaded_pdf_batch_01',
   'Forearm Health (uploaded PDF)',
   'extracted_pdf',
   'Tendon support: wrist pronation/extension/supination/flexion, 2x15 reps, low rest, paired/circuit.',
   'v1', TRUE, 'fully_extracted', NULL, 'recovery_protection_logic',
   '["accessory_logic","warmup_logic","overuse_risk_logic"]'::jsonb,
   '["prehab","tendon_support","low_volume"]'::jsonb,
   '["beginner","intermediate","advanced"]'::jsonb,
   '["planche","front_lever","back_lever","rings_skills","one_arm_pull_up"]'::jsonb,
   '["light_db","band","none"]'::jsonb,
   '["any"]'::jsonb,
   '["paired_set","circuit","superset"]'::jsonb,
   0.85,
   'Joint support for pulling, planche, lever, rings, grip-heavy phases.',
   'Never replaces primary strength or skill work. Stays low-volume support.'),

  ('src_batch_01_pull_up_pro_phase_1',
   'pull_up_pro_phase_1_uploaded_pdf_batch_01',
   'Pull-Up Pro — Phase 1 (uploaded PDF)',
   'extracted_pdf',
   'Foundational vertical pulling: two-arm pull primary, rows support, hangs, external rotation, curls.',
   'v1', TRUE, 'fully_extracted', 'Daniel Vadnal', 'vertical_vs_horizontal_pull_logic',
   '["athlete_prerequisites","frequency_logic","exercise_selection_logic","weighted_strength_logic","accessory_logic"]'::jsonb,
   '["foundational","two_pull_per_week","strict_rom"]'::jsonb,
   '["beginner","early_intermediate"]'::jsonb,
   '["pull_up","rows","one_arm_pull_up_prereq"]'::jsonb,
   '["pull_up_bar","dip_bars"]'::jsonb,
   '["upper_lower","push_pull_legs","full_body"]'::jsonb,
   '["straight_set"]'::jsonb,
   0.9,
   'Vertical-pulling specialization for athletes building base.',
   'Not for advanced one-arm specialization; phase 1 only.'),

  ('src_batch_01_pull_up_pro_phase_2',
   'pull_up_pro_phase_2_uploaded_pdf_batch_01',
   'Pull-Up Pro — Phase 2 (uploaded PDF)',
   'extracted_pdf',
   'Assisted one-arm pull transition: assisted before eccentric-heavy work, two-arm support continues.',
   'v1', TRUE, 'fully_extracted', 'Daniel Vadnal', 'skill_progression_logic',
   '["assisted_variation_logic","athlete_prerequisites","exercise_selection_logic","rest_interval_logic","frequency_logic"]'::jsonb,
   '["assisted_first","low_rep_long_rest","two_pull_per_week"]'::jsonb,
   '["intermediate"]'::jsonb,
   '["one_arm_pull_up","pull_up","rows"]'::jsonb,
   '["pull_up_bar","band","cable"]'::jsonb,
   '["upper_lower","push_pull_legs"]'::jsonb,
   '["straight_set","cluster"]'::jsonb,
   0.9,
   'Assisted one-arm work for athletes with sufficient pulling base.',
   'Pulling base prerequisite must be confirmed.'),

  ('src_batch_01_pull_up_pro_phase_3',
   'pull_up_pro_phase_3_uploaded_pdf_batch_01',
   'Pull-Up Pro — Phase 3 (uploaded PDF)',
   'extracted_pdf',
   'Eccentric one-arm pull specialization: eccentrics primary, one-arm rows/hangs, freq up to 3.',
   'v1', TRUE, 'fully_extracted', 'Daniel Vadnal', 'eccentric_logic',
   '["skill_progression_logic","frequency_logic","rest_interval_logic","weighted_strength_logic","exercise_selection_logic"]'::jsonb,
   '["eccentric_primary","up_to_three_pull_sessions","long_rest"]'::jsonb,
   '["advanced"]'::jsonb,
   '["one_arm_pull_up"]'::jsonb,
   '["pull_up_bar","rings_optional"]'::jsonb,
   '["upper_lower","push_pull_legs"]'::jsonb,
   '["straight_set","eccentric"]'::jsonb,
   0.9,
   'Advanced pulling exposure when readiness justifies it.',
   'Athlete profile must justify advanced exposure.'),

  ('src_batch_01_front_lever',
   'front_lever_uploaded_pdf_batch_01',
   'Front Lever skill + carryover (uploaded PDF)',
   'extracted_pdf',
   'FL holds, pulls/eccentrics, band holds, dragon flags, horizontal scap pulls, FL pulldowns. 3x/week valid when justified.',
   'v1', TRUE, 'fully_extracted', NULL, 'skill_progression_logic',
   '["movement_pattern_logic","exercise_selection_logic","accessory_logic","skill_vs_hypertrophy_tradeoff_logic","straight_arm_vs_bent_arm_logic","frequency_logic"]'::jsonb,
   '["direct_skill","carryover_acceptable","scap_specific"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '["front_lever","front_lever_tuck","front_lever_advanced","front_lever_one_leg","front_lever_full"]'::jsonb,
   '["pull_up_bar","band","rings_optional"]'::jsonb,
   '["upper_lower","push_pull_legs","full_body"]'::jsonb,
   '["straight_set","eccentric","static_hold"]'::jsonb,
   0.9,
   'Front lever skill + carryover representation.',
   'Missing direct skill does not always mean missing representation if carryover work is intentionally chosen.'),

  ('src_batch_01_lower_body_b',
   'lower_body_b_uploaded_pdf_batch_01',
   'Lower Body B (uploaded PDF)',
   'extracted_pdf',
   'Step-ups, hamstring curls, sissy squat progressions, glute bridges, calf raises. Level-based progression with tempo.',
   'v1', TRUE, 'fully_extracted', NULL, 'lower_body_integration_logic',
   '["exercise_selection_logic","progression_selection_logic","frequency_logic","recovery_protection_logic"]'::jsonb,
   '["bodyweight_lower","level_based","tempo_aware"]'::jsonb,
   '["beginner","intermediate","advanced"]'::jsonb,
   '[]'::jsonb,
   '["bench","band","dumbbell","none"]'::jsonb,
   '["upper_lower","push_pull_legs","full_body"]'::jsonb,
   '["straight_set"]'::jsonb,
   0.7,
   'Bodyweight-biased lower-body progression.',
   'Should support whole-athlete development without hijacking upper-body skill recovery.'),

  ('src_batch_01_body_by_rings',
   'body_by_rings_uploaded_pdf_batch_01',
   'Body By Rings (uploaded PDF)',
   'extracted_pdf',
   'Rings hypertrophy + SAID. Push-up/pull-up/dip prereq. ~4 sessions sweet spot. Dynamic warm-up, static stretch after.',
   'v1', TRUE, 'fully_extracted', NULL, 'hypertrophy_logic',
   '["athlete_prerequisites","exercise_selection_logic","skill_vs_hypertrophy_tradeoff_logic","warmup_logic","frequency_logic","weekly_distribution_logic","recovery_protection_logic","overuse_risk_logic"]'::jsonb,
   '["rings","hypertrophy_bias","said_principle","four_session_sweet_spot"]'::jsonb,
   '["intermediate","advanced"]'::jsonb,
   '["pull_up","dip","push_up","rings_skills"]'::jsonb,
   '["rings","pull_up_bar","dip_bars"]'::jsonb,
   '["upper_lower","push_pull"]'::jsonb,
   '["straight_set","superset","tempo"]'::jsonb,
   0.85,
   'Rings hypertrophy and SAID-aware programming.',
   'Not optimal as a direct planche/front-lever skill protocol. Skill goals need specific repeated practice.'),

  ('src_batch_01_cardio_guide',
   'cardio_guide_uploaded_pdf_batch_01',
   'Cardio Guide (uploaded PDF)',
   'extracted_pdf',
   'HIIT vs LISS recovery cost. HIIT efficient but taxing; LISS lower risk but more time. Respect recovery.',
   'v1', TRUE, 'fully_extracted', NULL, 'recovery_protection_logic',
   '["overuse_risk_logic","weekly_distribution_logic","frequency_logic","accessory_logic"]'::jsonb,
   '["conditioning","hiit_liss_split","recovery_aware"]'::jsonb,
   '["beginner","intermediate","advanced"]'::jsonb,
   '[]'::jsonb,
   '["any"]'::jsonb,
   '["any"]'::jsonb,
   '["interval","steady_state"]'::jsonb,
   0.75,
   'Cardio selection respecting recovery and primary goal.',
   'Do not blindly add HIIT to demanding strength/skill weeks.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PRINCIPLES (cross-cutting + base/phase rules) — at least one per source where applicable
-- ============================================================================

INSERT INTO training_doctrine_principles (
  id, source_id, doctrine_family, principle_key, principle_title,
  principle_summary, plain_language_rule, priority_type, is_base_intelligence,
  is_phase_modulation, applies_when_json, does_not_apply_when_json,
  computation_friendly_rule_json, athlete_level_scope, goal_scope,
  applies_to_skill_types, applies_to_training_styles, priority_weight,
  safety_priority, tags_json
)
SELECT
  'pr_b01_' || row_id,
  source_id, doctrine_family, principle_key, principle_title,
  principle_summary, plain_language_rule, priority_type,
  is_base_intelligence, is_phase_modulation,
  applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  computation_friendly_rule_json::jsonb,
  athlete_level_scope::jsonb, goal_scope::jsonb,
  applies_to_skill_types::jsonb, applies_to_training_styles::jsonb,
  priority_weight, safety_priority, tags_json::jsonb
FROM (VALUES
  -- Hybrid PPL principle
  ('001', 'src_batch_01_hybrid_ppl', 'weekly_distribution_logic', 'ppl_six_day_split',
   'PPL 6-day split for hybrid hypertrophy',
   'Pull/Push/Legs across 6 days supports hybrid hypertrophy and strength when recovery allows.',
   'When training 5-6 days/week with hybrid hypertrophy goal, PPL distributes pull/push/legs once or twice per week.',
   'soft_preference', TRUE, FALSE,
   '{"trainingDaysPerWeek":{"gte":5},"goal":["hypertrophy","hybrid","general_strength"]}',
   '{"primaryGoalIsSkillSpecialization":true,"recoveryCapacity":"low"}',
   '{"templateStyle":"ppl","compoundsPerSession":{"min":1,"max":2}}',
   '["intermediate","advanced"]', '["hypertrophy","hybrid"]',
   NULL, '["ppl"]', 0.7, 1, '["ppl","split","hybrid"]'),

  -- Forearm Health principle
  ('002', 'src_batch_01_forearm_health', 'recovery_protection_logic', 'forearm_prehab_low_volume',
   'Forearm prehab is low-volume support',
   'Forearm/wrist work supports grip and tendon capacity at low volume; never replaces primary strength.',
   'Wrist pron/sup/flex/ext at 2x15 fits prehab/accessory lane.',
   'recommendation', TRUE, FALSE,
   '{"hasGripIntenseWork":true}', '{"injuryAcuteWrist":true}',
   '{"sets":2,"reps":15,"role":"prehab","placement":"end_or_paired"}',
   '["beginner","intermediate","advanced"]', NULL,
   '["planche","front_lever","one_arm_pull_up","rings_skills"]', NULL, 0.8, 2,
   '["prehab","forearm","tendon"]'),

  -- Pull-Up Pro Phase 1 principle
  ('003', 'src_batch_01_pull_up_pro_phase_1', 'frequency_logic', 'pup_phase1_two_pull_exposures',
   'Phase 1: two pull exposures per week',
   'Foundational vertical pulling uses two pull exposures per week with rows in support.',
   'Two pull sessions per week with two-arm pull primary, rows support, hangs, external rotations, curls.',
   'recommendation', TRUE, FALSE,
   '{"goal":["pull_up","one_arm_pull_up_prereq"],"phase":"phase_1"}', '{}',
   '{"pullExposuresPerWeek":2,"primary":"two_arm_pull","support":["rows","hangs","face_pull","curl"]}',
   '["beginner","early_intermediate"]', '["pull_up"]', NULL, NULL, 0.9, 1,
   '["pull_up_pro","phase_1","frequency"]'),

  -- Pull-Up Pro Phase 2 principle
  ('004', 'src_batch_01_pull_up_pro_phase_2', 'assisted_variation_logic', 'pup_phase2_assisted_before_eccentric',
   'Phase 2: assisted one-arm before eccentrics',
   'Assisted one-arm precedes eccentric-heavy one-arm work. Low reps, long rest.',
   'Assisted one-arm pull-ups with low reps and long rest before introducing heavy eccentrics.',
   'hard_constraint', TRUE, FALSE,
   '{"goal":"one_arm_pull_up","phase":"phase_2","pullingBaseAdequate":true}',
   '{"phase":"phase_3","pullingBaseAdequate":false}',
   '{"variationOrder":["assisted_oapu","eccentric_oapu"],"reps":{"min":2,"max":5},"restMinutes":{"min":3,"max":5}}',
   '["intermediate"]', '["one_arm_pull_up"]', NULL, NULL, 0.95, 1,
   '["pull_up_pro","phase_2","assisted","gating"]'),

  -- Pull-Up Pro Phase 3 principle
  ('005', 'src_batch_01_pull_up_pro_phase_3', 'eccentric_logic', 'pup_phase3_eccentrics_advanced',
   'Phase 3: eccentrics for advanced one-arm work',
   'Eccentrics become primary advanced exposure with one-arm rows/hangs more relevant. Frequency up to 3.',
   'Phase 3 athletes use eccentrics, one-arm hangs, one-arm rows; up to 3 pull sessions per week.',
   'recommendation', TRUE, FALSE,
   '{"goal":"one_arm_pull_up","phase":"phase_3","experienceLevel":"advanced"}', '{"experienceLevel":["beginner","intermediate"]}',
   '{"pullExposuresPerWeek":{"min":2,"max":3},"primary":"eccentric_oapu"}',
   '["advanced"]', '["one_arm_pull_up"]', NULL, NULL, 0.9, 1,
   '["pull_up_pro","phase_3","eccentric"]'),

  -- Front Lever direct + carryover representation
  ('006', 'src_batch_01_front_lever', 'movement_pattern_logic', 'fl_direct_or_carryover_representation',
   'Front lever must be represented (direct OR carryover)',
   'If FL is selected and athlete eligible, include direct FL exposure; if direct exposure is omitted, carryover work must represent FL with explicit rationale.',
   'Selected skill must resolve to direct_block / microdose / carryover_only / deferred_with_reason / omitted_due_to_constraint.',
   'hard_constraint', TRUE, FALSE,
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   '{"directCandidates":["fl_hold","fl_pull","fl_eccentric","band_fl_hold"],"carryoverCandidates":["dragon_flag","horizontal_scap_pull","fl_pulldown"],"resolutionStates":["direct_block","microdose","carryover_only","deferred_with_reason","omitted_due_to_constraint"]}',
   '["intermediate","advanced"]', '["front_lever","bodyweight_skill"]',
   '["front_lever"]', NULL, 0.95, 1,
   '["front_lever","representation","carryover","said"]'),

  -- Front Lever frequency
  ('007', 'src_batch_01_front_lever', 'frequency_logic', 'fl_frequency_up_to_3',
   'FL frequency can rise to 3/week when justified',
   '3x/week FL exposure is valid when recovery and priority justify it.',
   'When FL is primary skill priority and recovery is adequate, allow 3 weekly FL exposures.',
   'soft_preference', TRUE, FALSE,
   '{"selectedSkills":{"contains":"front_lever"},"recoveryCapacity":["moderate","high"]}', '{"recoveryCapacity":"low"}',
   '{"weeklyFrequency":{"min":1,"max":3}}',
   '["intermediate","advanced"]', '["front_lever"]', '["front_lever"]', NULL, 0.8, 1,
   '["front_lever","frequency"]'),

  -- Lower Body B principle
  ('008', 'src_batch_01_lower_body_b', 'lower_body_integration_logic', 'lb_no_hijack_upper_recovery',
   'Lower body must not hijack upper-body skill recovery',
   'Lower body work scales by available days/session length and uses level-based progression with tempo.',
   'When primary goal is upper-body skill, scale lower-body volume so it does not compromise upper recovery.',
   'recommendation', TRUE, FALSE,
   '{"primaryGoalIsUpperBodySkill":true}', '{}',
   '{"scaleByDays":true,"levelBasedProgression":true,"tempoAware":true}',
   '["beginner","intermediate","advanced"]', NULL, NULL, NULL, 0.8, 1,
   '["lower_body","integration","recovery"]'),

  -- Body By Rings prerequisite
  ('009', 'src_batch_01_body_by_rings', 'athlete_prerequisites', 'bbr_basic_competence_required',
   'BBR requires push-up/pull-up/dip competence',
   'Basic push-up, pull-up, and dip competence required before advanced ring-heavy work.',
   'Advanced ring exercises require prerequisite flags; if missing, regress to stable or assisted ring variation.',
   'hard_constraint', TRUE, FALSE,
   '{"hasRings":true,"selectsAdvancedRingExercises":true}', '{}',
   '{"prerequisites":["push_up","pull_up","dip"],"regressionWhenMissing":"stable_or_assisted_ring"}',
   '["intermediate","advanced"]', '["hypertrophy","rings_skills"]', '["rings_skills"]', NULL, 0.95, 2,
   '["rings","prerequisite","said"]'),

  -- Body By Rings SAID
  ('010', 'src_batch_01_body_by_rings', 'skill_vs_hypertrophy_tradeoff_logic', 'bbr_said_principle',
   'SAID: skill goals need specific repeated practice',
   'BBR-style hypertrophy work does not substitute for direct skill practice on planche/FL/etc.',
   'When skill is selected, hypertrophy substitutes are insufficient unless explicitly labeled as carryover.',
   'hard_constraint', TRUE, FALSE,
   '{"selectedSkills":{"nonEmpty":true}}', '{}',
   '{"requireDirectOrLabeledCarryover":true}',
   '["intermediate","advanced"]', NULL, NULL, NULL, 0.95, 1,
   '["said","skill_specificity"]'),

  -- Body By Rings warm-up
  ('011', 'src_batch_01_body_by_rings', 'warmup_logic', 'bbr_dynamic_warmup_pre_strength',
   'Dynamic warm-up pre strength/skill (~10–15 min)',
   'Dynamic, joint-specific warm-up before strength/skill work; static stretching belongs after.',
   'Dynamic prep before skill/strength; static stretching is not primary pre-strength prep.',
   'recommendation', TRUE, FALSE,
   '{"sessionType":["strength","skill","power"]}', '{}',
   '{"dynamicMinutes":{"min":10,"max":15},"includeWristsScapShouldersForUpperRingsPullSessions":true}',
   '["beginner","intermediate","advanced"]', NULL, NULL, NULL, 0.85, 1,
   '["warmup","dynamic"]'),

  -- Body By Rings 4 sessions sweet spot
  ('012', 'src_batch_01_body_by_rings', 'frequency_logic', 'bbr_four_session_sweet_spot',
   '~4 upper sessions/week is hypertrophy sweet spot; 5 may compromise recovery',
   'Push/pull upper ~4/week is a hypertrophy sweet spot; 5 sessions can compromise quality.',
   'For hypertrophy, prefer 4 upper-body sessions/week; allow 5 only when recovery is high.',
   'soft_preference', TRUE, FALSE,
   '{"goal":"hypertrophy","split":["upper_lower","push_pull"]}', '{}',
   '{"upperSessionsPerWeek":{"preferred":4,"maxIfRecoveryHigh":5}}',
   '["intermediate","advanced"]', '["hypertrophy"]', NULL, NULL, 0.75, 1,
   '["frequency","hypertrophy"]'),

  -- Cardio principle: HIIT recovery cost
  ('013', 'src_batch_01_cardio_guide', 'overuse_risk_logic', 'hiit_recovery_cost_gating',
   'HIIT restricted under high fatigue/dense weeks',
   'HIIT is recovery-taxing and higher injury risk; restrict when fatigue is high or week is already dense.',
   'If fatigue/recovery risk high or strength/skill priority and week dense, prefer LISS or omit conditioning.',
   'recommendation', TRUE, FALSE,
   '{"or":[{"recoveryCapacity":"low"},{"strengthSkillLoad":"high"},{"weeklyDensity":"high"}]}', '{}',
   '{"recommend":["liss","omit"],"avoid":["hiit"]}',
   '["beginner","intermediate","advanced"]', NULL, NULL, NULL, 0.85, 2,
   '["cardio","hiit","gating"]'),

  -- Cardio principle: HIIT allowed when good recovery + fat-loss focus
  ('014', 'src_batch_01_cardio_guide', 'accessory_logic', 'hiit_allowed_sparingly',
   'HIIT allowed sparingly when recovery is good',
   'For fat loss/general conditioning with good recovery, HIIT can be used sparingly.',
   'Allow HIIT only when recovery is good and primary goal includes fat loss or general conditioning.',
   'soft_preference', TRUE, FALSE,
   '{"recoveryCapacity":"high","goal":["fat_loss","general_conditioning"]}', '{}',
   '{"hiitSessionsPerWeek":{"max":2}}',
   '["intermediate","advanced"]', '["fat_loss","general_conditioning"]', NULL, NULL, 0.7, 1,
   '["cardio","hiit","sparingly"]')
) AS v(row_id, source_id, doctrine_family, principle_key, principle_title,
       principle_summary, plain_language_rule, priority_type,
       is_base_intelligence, is_phase_modulation,
       applies_when_json, does_not_apply_when_json,
       computation_friendly_rule_json,
       athlete_level_scope, goal_scope,
       applies_to_skill_types, applies_to_training_styles,
       priority_weight, safety_priority, tags_json)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PRESCRIPTION RULES (rep/set/rest/RPE per role)
-- ============================================================================

INSERT INTO prescription_rules (
  id, source_id, level_scope, goal_scope, exercise_role_scope,
  rep_range_json, set_range_json, hold_range_json, rest_range_json,
  rpe_guidance_json, progression_guidance, plain_language_rule,
  computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
  is_base_intelligence, is_phase_modulation, priority_type, tags_json
)
SELECT
  'rx_b01_' || row_id,
  source_id, level_scope::jsonb, goal_scope::jsonb, exercise_role_scope::jsonb,
  rep_range_json::jsonb, set_range_json::jsonb, hold_range_json::jsonb, rest_range_json::jsonb,
  rpe_guidance_json::jsonb, progression_guidance, plain_language_rule,
  computation_friendly_rule_json::jsonb, applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  is_base_intelligence, is_phase_modulation, priority_type, tags_json::jsonb
FROM (VALUES
  -- Hybrid PPL: heavy compound 6-8 reps, 3-4 min rest
  ('001', 'src_batch_01_hybrid_ppl',
   '["intermediate","advanced"]', '["hypertrophy","hybrid","general_strength"]',
   '["primary_compound_pull","primary_compound_push","primary_compound_squat","primary_compound_hinge"]',
   '{"min":6,"max":8}', '{"min":3,"max":4}', NULL, '{"minSeconds":180,"maxSeconds":240}',
   '{"rpe":{"min":7,"max":9}}',
   'Add reps within range, then add load when top of range hit; advance microcycles by adding sets.',
   'Heavy compounds use 6-8 reps with 3-4 min rest.',
   '{"role":"primary_compound","repRange":{"min":6,"max":8},"restMinutes":{"min":3,"max":4}}',
   '{"role":["primary_compound_pull","primary_compound_push","primary_compound_squat","primary_compound_hinge"]}',
   '{}', TRUE, FALSE, 'recommendation', '["ppl","heavy_compound","rest"]'),

  -- Hybrid PPL: secondary/accessory 8-20 reps, shorter rest
  ('002', 'src_batch_01_hybrid_ppl',
   '["intermediate","advanced"]', '["hypertrophy","hybrid"]',
   '["accessory","isolation","secondary"]',
   '{"min":8,"max":20}', '{"min":2,"max":4}', NULL, '{"minSeconds":60,"maxSeconds":120}',
   '{"rpe":{"min":7,"max":9}}',
   'Progress reps within range, then add load.',
   'Secondary/accessory work uses 8-20 reps with 1-2 min rest.',
   '{"role":"accessory","repRange":{"min":8,"max":20},"restMinutes":{"min":1,"max":2}}',
   '{"role":["accessory","isolation","secondary"]}',
   '{}', TRUE, FALSE, 'recommendation', '["ppl","accessory","rest"]'),

  -- Hybrid PPL: week progression by adding sets/reps
  ('003', 'src_batch_01_hybrid_ppl',
   '["intermediate","advanced"]', '["hypertrophy","hybrid"]',
   '["any"]',
   NULL, '{"weekProgression":{"week1":3,"week2":3,"week3":4,"week4":"deload_or_test"}}', NULL, NULL,
   NULL,
   'Week progression adds sets/reps while preserving exercise identity.',
   'Microcycle adds sets or reps without swapping exercises.',
   '{"weekShape":{"week1":3,"week2":3,"week3":4,"week4":"deload_or_test"}}',
   '{}', '{}', FALSE, TRUE, 'soft_preference', '["ppl","week_scaling"]'),

  -- Forearm Health: 2x15
  ('004', 'src_batch_01_forearm_health',
   '["beginner","intermediate","advanced"]', NULL,
   '["prehab"]',
   '{"min":15,"max":15}', '{"min":2,"max":2}', NULL, '{"minSeconds":30,"maxSeconds":60}',
   '{"rpe":{"min":5,"max":7}}',
   'Increase load only when 2x15 feels easy with full ROM.',
   'Forearm prehab: 2 sets x 15 reps, short rest.',
   '{"sets":2,"reps":15,"role":"prehab"}',
   '{"role":"prehab"}', '{}', TRUE, FALSE, 'recommendation',
   '["forearm","prehab","2x15"]'),

  -- Pull-Up Pro Phase 1: rep ranges
  ('005', 'src_batch_01_pull_up_pro_phase_1',
   '["beginner","early_intermediate"]', '["pull_up"]',
   '["primary_pull"]',
   '{"min":4,"max":8}', '{"min":3,"max":5}', NULL, '{"minSeconds":120,"maxSeconds":180}',
   '{"rpe":{"min":7,"max":9}}',
   'Add reps until top of range, then progress to harder vertical pull variation.',
   'Phase 1: two-arm pull at 4-8 reps, 2-3 min rest.',
   '{"phase":"phase_1","repRange":{"min":4,"max":8}}',
   '{"phase":"phase_1"}', '{}', TRUE, FALSE, 'recommendation', '["pull_up_pro","phase_1"]'),

  -- Pull-Up Pro Phase 2: assisted one-arm low reps
  ('006', 'src_batch_01_pull_up_pro_phase_2',
   '["intermediate"]', '["one_arm_pull_up"]',
   '["primary_skill_pull"]',
   '{"min":2,"max":5}', '{"min":3,"max":5}', NULL, '{"minSeconds":180,"maxSeconds":300}',
   '{"rpe":{"min":7,"max":9}}',
   'Reduce assistance progressively; do not add eccentrics until assisted reps in range with low assistance.',
   'Phase 2: assisted one-arm at 2-5 reps, 3-5 min rest.',
   '{"phase":"phase_2","repRange":{"min":2,"max":5}}',
   '{"phase":"phase_2"}', '{}', TRUE, FALSE, 'recommendation', '["pull_up_pro","phase_2"]'),

  -- Pull-Up Pro Phase 3: eccentric long rest
  ('007', 'src_batch_01_pull_up_pro_phase_3',
   '["advanced"]', '["one_arm_pull_up"]',
   '["primary_skill_pull"]',
   '{"min":1,"max":3}', '{"min":3,"max":5}', NULL, '{"minSeconds":240,"maxSeconds":360}',
   '{"rpe":{"min":8,"max":9}}',
   'Slow eccentric (5-10s); concentric assist when needed.',
   'Phase 3 eccentrics: 1-3 reps, 4-6 min rest.',
   '{"phase":"phase_3","repRange":{"min":1,"max":3},"eccentricSeconds":{"min":5,"max":10}}',
   '{"phase":"phase_3"}', '{}', TRUE, FALSE, 'recommendation', '["pull_up_pro","phase_3","eccentric"]'),

  -- Front lever holds and pulls
  ('008', 'src_batch_01_front_lever',
   '["intermediate","advanced"]', '["front_lever"]',
   '["primary_skill_static"]',
   NULL, '{"min":4,"max":6}', '{"minSeconds":3,"maxSeconds":10}', '{"minSeconds":120,"maxSeconds":180}',
   '{"rpe":{"min":7,"max":9}}',
   'Progress hold time; advance progression when 3x clean 8-10s achieved.',
   'FL holds: 4-6 sets x 3-10s, 2-3 min rest.',
   '{"role":"primary_skill_static","holdSeconds":{"min":3,"max":10}}',
   '{"role":"primary_skill_static"}', '{}', TRUE, FALSE, 'recommendation', '["front_lever","hold"]'),

  -- Lower Body B
  ('009', 'src_batch_01_lower_body_b',
   '["beginner","intermediate","advanced"]', NULL,
   '["lower_body_primary","lower_body_accessory"]',
   '{"min":8,"max":15}', '{"min":3,"max":4}', NULL, '{"minSeconds":60,"maxSeconds":120}',
   '{"rpe":{"min":7,"max":9}}',
   'Tempo emphasis (3-1-1 or slower); progress level when top of range hit.',
   'Lower body: 8-15 reps, 3-4 sets, 1-2 min rest, tempo aware.',
   '{"tempo":"3-1-1","repRange":{"min":8,"max":15}}',
   '{}', '{}', TRUE, FALSE, 'soft_preference', '["lower_body","tempo"]'),

  -- BBR rings hypertrophy
  ('010', 'src_batch_01_body_by_rings',
   '["intermediate","advanced"]', '["hypertrophy"]',
   '["primary_compound_push","primary_compound_pull","accessory"]',
   '{"min":6,"max":12}', '{"min":3,"max":4}', NULL, '{"minSeconds":90,"maxSeconds":150}',
   '{"rpe":{"min":7,"max":9}}',
   'Adjust intensity by ring height/body angle; progress when top of range with control.',
   'Rings hypertrophy: 6-12 reps, 3-4 sets, 90-150s rest.',
   '{"role":"hypertrophy","repRange":{"min":6,"max":12}}',
   '{}', '{}', TRUE, FALSE, 'soft_preference', '["rings","hypertrophy"]')
) AS v(row_id, source_id, level_scope, goal_scope, exercise_role_scope,
       rep_range_json, set_range_json, hold_range_json, rest_range_json,
       rpe_guidance_json, progression_guidance, plain_language_rule,
       computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
       is_base_intelligence, is_phase_modulation, priority_type, tags_json)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- METHOD RULES
-- ============================================================================

INSERT INTO method_rules (
  id, source_id, method_key, category,
  compatible_levels_json, compatible_goals_json,
  best_use_cases_json, avoid_use_cases_json,
  structure_bias_json, plain_language_rule,
  computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
  priority_type, tags_json
)
SELECT
  'mr_b01_' || row_id, source_id, method_key, category,
  compatible_levels_json::jsonb, compatible_goals_json::jsonb,
  best_use_cases_json::jsonb, avoid_use_cases_json::jsonb,
  structure_bias_json::jsonb, plain_language_rule,
  computation_friendly_rule_json::jsonb, applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  priority_type, tags_json::jsonb
FROM (VALUES
  ('001', 'src_batch_01_pull_up_pro_phase_3', 'eccentric', 'tempo_method',
   '["advanced"]', '["one_arm_pull_up"]',
   '["one_arm_pull_eccentrics","controlled_lowering_pull"]',
   '["beginner_pulling_base","phase_1","phase_2"]',
   '{"eccentricSeconds":{"min":5,"max":10},"concentricAssist":true}',
   'Eccentric method belongs in advanced one-arm pull only after assisted phase.',
   '{"phaseGate":"phase_3","prerequisite":"assisted_oapu_proficient"}',
   '{"goal":"one_arm_pull_up","phase":"phase_3"}', '{"phase":["phase_1","phase_2"]}',
   'recommendation', '["eccentric","pull_up_pro","phase_3"]'),

  ('002', 'src_batch_01_pull_up_pro_phase_2', 'assisted', 'assistance_method',
   '["intermediate"]', '["one_arm_pull_up"]',
   '["assisted_oapu","band_assisted_pull","cable_assisted_pull"]',
   '["phase_3_advanced"]',
   '{"assistanceProgression":"reduce_band_or_partner_assist_over_weeks"}',
   'Assistance method gates one-arm pull progression in phase 2.',
   '{"phaseGate":"phase_2"}',
   '{"goal":"one_arm_pull_up","phase":"phase_2"}', '{"phase":"phase_3"}',
   'recommendation', '["assisted","pull_up_pro","phase_2"]'),

  ('003', 'src_batch_01_forearm_health', 'paired_set', 'density_method',
   '["beginner","intermediate","advanced"]', NULL,
   '["forearm_prehab_pair","wrist_circuit"]',
   '["primary_strength_compound"]',
   '{"pairing":"opposing_or_same_joint","restSeconds":{"min":30,"max":60}}',
   'Forearm prehab uses paired sets/circuits, never paired with primary strength.',
   '{"role":"prehab","placement":"end_or_paired"}',
   '{"role":"prehab"}', '{}',
   'soft_preference', '["paired_set","forearm","prehab"]'),

  ('004', 'src_batch_01_hybrid_ppl', 'straight_set', 'standard_method',
   '["beginner","intermediate","advanced"]', '["hypertrophy","hybrid","general_strength"]',
   '["compound_strength","accessory_hypertrophy"]',
   '[]',
   '{"defaultForCompoundsAndAccessories":true}',
   'Straight sets are the default for PPL hypertrophy and strength support.',
   '{"templateStyle":"ppl","default":true}',
   '{}', '{}',
   'soft_preference', '["straight_set","ppl"]'),

  ('005', 'src_batch_01_cardio_guide', 'hiit', 'conditioning_method',
   '["intermediate","advanced"]', '["fat_loss","general_conditioning"]',
   '["fat_loss_recovery_high","time_efficient_conditioning"]',
   '["high_fatigue","dense_strength_skill_week","low_recovery_capacity"]',
   '{"sessionsPerWeek":{"max":2},"workRestRatio":"high_intensity_short_work_easy_rest"}',
   'HIIT must be gated by recovery and weekly load.',
   '{"recoveryGate":"high","weeklyLoad":"not_dense"}',
   '{}', '{"or":[{"recoveryCapacity":"low"},{"weeklyDensity":"high"}]}',
   'recommendation', '["hiit","cardio","gating"]'),

  ('006', 'src_batch_01_cardio_guide', 'liss', 'conditioning_method',
   '["beginner","intermediate","advanced"]', '["fat_loss","general_conditioning","recovery"]',
   '["recovery_aid","fat_loss_low_risk","high_fatigue_alternative_to_hiit"]',
   '[]',
   '{"sessionsPerWeek":{"min":0,"max":4},"durationMinutes":{"min":20,"max":60}}',
   'LISS is the safe default when fatigue or injury risk is high.',
   '{"defaultUnderHighLoad":true}',
   '{}', '{}',
   'soft_preference', '["liss","cardio"]'),

  ('007', 'src_batch_01_body_by_rings', 'tempo', 'tempo_method',
   '["intermediate","advanced"]', '["hypertrophy"]',
   '["ring_dip","ring_row","ring_push_up"]',
   '["max_strength_singles"]',
   '{"defaultTempo":"2-1-2_to_3-1-1"}',
   'Tempo control on rings improves stability and hypertrophy quality.',
   '{"equipment":"rings","emphasizeControl":true}',
   '{"hasRings":true}', '{}',
   'soft_preference', '["tempo","rings"]'),

  ('008', 'src_batch_01_front_lever', 'static_hold', 'isometric_method',
   '["intermediate","advanced"]', '["front_lever"]',
   '["fl_hold","fl_tuck_hold","band_assisted_fl_hold"]',
   '["pure_endurance_circuit"]',
   '{"holdSeconds":{"min":3,"max":12}}',
   'Static holds are primary FL skill expression.',
   '{"role":"primary_skill_static"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["static_hold","front_lever"]')
) AS v(row_id, source_id, method_key, category,
       compatible_levels_json, compatible_goals_json,
       best_use_cases_json, avoid_use_cases_json,
       structure_bias_json, plain_language_rule,
       computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
       priority_type, tags_json)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROGRESSION RULES
-- ============================================================================

INSERT INTO progression_rules (
  id, source_id, skill_key, current_level_key, next_level_key,
  required_prerequisites_json, min_readiness_json, progression_rule_summary,
  caution_flags_json, confidence_weight, plain_language_rule,
  computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
  priority_type, tags_json
)
SELECT
  'pg_b01_' || row_id, source_id, skill_key, current_level_key, next_level_key,
  required_prerequisites_json::jsonb, min_readiness_json::jsonb, progression_rule_summary,
  caution_flags_json::jsonb, confidence_weight, plain_language_rule,
  computation_friendly_rule_json::jsonb, applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  priority_type, tags_json::jsonb
FROM (VALUES
  ('001', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up',
   'two_arm_pull_strong', 'assisted_oapu',
   '{"pull_up_strict":"8x1+","row_strict":"10x1+"}',
   '{"shoulder_health":"green","elbow_health":"green"}',
   'Move from strong two-arm pull to assisted one-arm pull when pull base is adequate.',
   '["elbow_overuse","shoulder_overuse"]',
   0.95,
   'Two-arm strong → assisted OAPU.',
   '{"prerequisite":"two_arm_strong","next":"assisted_oapu"}',
   '{"goal":"one_arm_pull_up"}', '{}',
   'hard_constraint', '["pull_up_pro","phase_2","gating"]'),

  ('002', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up',
   'assisted_oapu_proficient', 'eccentric_oapu',
   '{"assisted_oapu":"5x3 with low assistance"}',
   '{"shoulder_health":"green","elbow_health":"green"}',
   'Assisted proficient → eccentric OAPU only when assistance is minimal.',
   '["elbow_tendinopathy_risk"]',
   0.95,
   'Assisted proficient → eccentric OAPU.',
   '{"prerequisite":"assisted_oapu_proficient","next":"eccentric_oapu"}',
   '{"goal":"one_arm_pull_up"}', '{"phase":["phase_1","phase_2"]}',
   'hard_constraint', '["pull_up_pro","phase_3","gating"]'),

  ('003', 'src_batch_01_front_lever', 'front_lever',
   'tuck_fl_hold', 'advanced_tuck_fl',
   '{"tuck_fl_hold":"3x10s clean"}',
   '{"shoulder_health":"green","scap_control":"adequate"}',
   'Tuck FL clean → advanced tuck FL.',
   '["lumbar_extension_risk"]',
   0.9,
   'Tuck → advanced tuck FL on clean 3x10s.',
   '{"current":"tuck_fl_hold","next":"advanced_tuck_fl"}',
   '{"goal":"front_lever"}', '{}',
   'recommendation', '["front_lever","progression"]'),

  ('004', 'src_batch_01_front_lever', 'front_lever',
   'advanced_tuck_fl', 'one_leg_fl',
   '{"advanced_tuck_fl":"3x10s clean"}',
   '{}',
   'Advanced tuck → one-leg FL.',
   NULL, 0.9,
   'Advanced tuck → one leg FL on 3x10s.',
   '{"current":"advanced_tuck_fl","next":"one_leg_fl"}',
   '{"goal":"front_lever"}', '{}',
   'recommendation', '["front_lever","progression"]'),

  ('005', 'src_batch_01_front_lever', 'front_lever',
   'one_leg_fl', 'straddle_fl',
   '{"one_leg_fl":"3x10s clean each side"}',
   '{}',
   'One leg → straddle FL.',
   NULL, 0.9,
   'One-leg → straddle FL.',
   '{"current":"one_leg_fl","next":"straddle_fl"}',
   '{"goal":"front_lever"}', '{}',
   'recommendation', '["front_lever","progression"]'),

  ('006', 'src_batch_01_front_lever', 'front_lever',
   'straddle_fl', 'full_fl',
   '{"straddle_fl":"3x8s clean"}',
   '{}',
   'Straddle → full FL.',
   '["lumbar_overload"]',
   0.9,
   'Straddle → full FL.',
   '{"current":"straddle_fl","next":"full_fl"}',
   '{"goal":"front_lever"}', '{}',
   'recommendation', '["front_lever","progression"]'),

  ('007', 'src_batch_01_pull_up_pro_phase_1', 'pull_up',
   'negatives_or_band_assisted', 'strict_pull_up',
   '{"negatives":"5x3-5s slow"}',
   '{}',
   'Negatives → strict pull-up.',
   NULL, 0.9,
   'Negatives/banded → strict.',
   '{"current":"negatives_or_band_assisted","next":"strict_pull_up"}',
   '{"goal":"pull_up"}', '{}',
   'recommendation', '["pull_up_pro","phase_1"]'),

  ('008', 'src_batch_01_lower_body_b', 'sissy_squat',
   'partial_sissy', 'full_rom_sissy',
   '{"partial_sissy":"3x10 controlled"}',
   '{"knee_health":"green"}',
   'Partial sissy → full ROM with tempo.',
   '["knee_pain"]',
   0.7,
   'Partial sissy → full ROM sissy.',
   '{"current":"partial_sissy","next":"full_rom_sissy"}',
   '{}', '{}',
   'soft_preference', '["lower_body","sissy"]')
) AS v(row_id, source_id, skill_key, current_level_key, next_level_key,
       required_prerequisites_json, min_readiness_json, progression_rule_summary,
       caution_flags_json, confidence_weight, plain_language_rule,
       computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
       priority_type, tags_json)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CARRYOVER RULES (skill carryover)
-- ============================================================================

INSERT INTO skill_carryover_rules (
  id, source_id, source_exercise_or_skill_key, target_skill_key,
  carryover_type, carryover_strength, rationale, plain_language_rule,
  computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
  priority_type, tags_json
)
SELECT
  'co_b01_' || row_id, source_id, source_exercise_or_skill_key, target_skill_key,
  carryover_type, carryover_strength, rationale, plain_language_rule,
  computation_friendly_rule_json::jsonb, applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  priority_type, tags_json::jsonb
FROM (VALUES
  ('001', 'src_batch_01_front_lever', 'dragon_flag', 'front_lever',
   'indirect', 0.7,
   'Dragon flag builds anterior chain compression that supports FL hold posture.',
   'Dragon flag → front lever (compression carryover).',
   '{"primaryAdaptation":"anterior_compression","carryoverDomain":"front_lever_position"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","carryover","compression"]'),

  ('002', 'src_batch_01_front_lever', 'horizontal_scap_pull', 'front_lever',
   'accessory', 0.6,
   'Horizontal scap pulls strengthen scap retraction needed for FL.',
   'Horizontal scap pull → front lever (scap retraction).',
   '{"primaryAdaptation":"scap_retraction"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","scap"]'),

  ('003', 'src_batch_01_front_lever', 'fl_pulldown', 'front_lever',
   'direct', 0.85,
   'FL pulldown trains the FL pulling pattern with reduced load.',
   'FL pulldown → front lever (pattern-specific dynamic).',
   '{"primaryAdaptation":"fl_pulling_pattern"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","pulldown"]'),

  ('004', 'src_batch_01_pull_up_pro_phase_1', 'row', 'pull_up',
   'accessory', 0.6,
   'Rows build horizontal pull base supporting vertical pull.',
   'Rows → pull-up (horizontal pull support).',
   '{"primaryAdaptation":"horizontal_pull_base"}',
   '{"goal":"pull_up"}', '{}',
   'soft_preference', '["pull_up","row","carryover"]'),

  ('005', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'one_arm_pull_up',
   'prerequisite', 1.0,
   'Strict two-arm pull is mandatory base for one-arm pull progression.',
   'Two-arm pull is prerequisite for OAPU.',
   '{"prerequisiteFor":"one_arm_pull_up","minStandard":"8x1"}',
   '{"goal":"one_arm_pull_up"}', '{}',
   'hard_constraint', '["pull_up","oapu","prerequisite"]'),

  ('006', 'src_batch_01_body_by_rings', 'push_up', 'rings_skills',
   'prerequisite', 0.9,
   'Push-up competence required before advanced ring instability.',
   'Push-up → rings advanced (prerequisite).',
   '{"prerequisiteFor":"advanced_ring_pushing"}',
   '{"hasRings":true}', '{}',
   'hard_constraint', '["rings","prerequisite"]'),

  ('007', 'src_batch_01_body_by_rings', 'dip', 'rings_skills',
   'prerequisite', 0.9,
   'Dip competence required before advanced ring dipping/pushing.',
   'Dip → rings advanced (prerequisite).',
   '{"prerequisiteFor":"advanced_ring_dip"}',
   '{"hasRings":true}', '{}',
   'hard_constraint', '["rings","prerequisite"]'),

  ('008', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_hang', 'one_arm_pull_up',
   'accessory', 0.7,
   'One-arm hangs build grip and shoulder stability for OAPU.',
   'One-arm hang → OAPU (grip+shoulder).',
   '{"primaryAdaptation":"grip_shoulder_stability"}',
   '{"goal":"one_arm_pull_up"}', '{}',
   'recommendation', '["one_arm_pull_up","hang"]')
) AS v(row_id, source_id, source_exercise_or_skill_key, target_skill_key,
       carryover_type, carryover_strength, rationale, plain_language_rule,
       computation_friendly_rule_json, applies_when_json, does_not_apply_when_json,
       priority_type, tags_json)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EXERCISE SELECTION RULES — bulk via UNNEST
-- ============================================================================

INSERT INTO exercise_selection_rules (
  id, source_id, goal_key, skill_key, exercise_key, role_key,
  level_scope, equipment_requirements_json,
  preferred_when_json, avoid_when_json, selection_weight,
  plain_language_rule, computation_friendly_rule_json,
  applies_when_json, does_not_apply_when_json,
  priority_type, tags_json
)
SELECT
  'es_b01_' || row_id, source_id, goal_key, skill_key, exercise_key, role_key,
  level_scope::jsonb, equipment_requirements_json::jsonb,
  preferred_when_json::jsonb, avoid_when_json::jsonb, selection_weight,
  plain_language_rule, computation_friendly_rule_json::jsonb,
  applies_when_json::jsonb, does_not_apply_when_json::jsonb,
  priority_type, tags_json::jsonb
FROM (VALUES
  -- Hybrid PPL
  ('001', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'weighted_pull_up',         'primary_compound_pull',
   '["intermediate","advanced"]', '{"pull_up_bar":true,"weight_belt":true}',
   '{"templateStyle":"ppl_hybrid"}', '{"primaryGoalIsSkillSpecialization":true}', 0.85,
   'Weighted pull-up: primary pull compound for hybrid PPL.',
   '{"role":"primary_compound_pull","repRange":{"min":6,"max":8},"restMinutes":{"min":3,"max":4}}',
   '{}', '{}', 'recommendation', '["ppl","compound","pull"]'),

  ('002', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'weighted_dip',             'primary_compound_push',
   '["intermediate","advanced"]', '{"dip_bars":true,"weight_belt":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.85,
   'Weighted dip: primary push compound.',
   '{"role":"primary_compound_push","repRange":{"min":6,"max":8}}',
   '{}', '{}', 'recommendation', '["ppl","compound","push"]'),

  ('003', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'barbell_row',              'primary_compound_pull',
   '["intermediate","advanced"]', '{"barbell":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.8,
   'Barbell row: horizontal pull compound.',
   '{"role":"primary_compound_pull","repRange":{"min":6,"max":10}}',
   '{}', '{}', 'recommendation', '["ppl","compound","pull"]'),

  ('004', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'overhead_press',           'primary_compound_push',
   '["intermediate","advanced"]', '{"barbell":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.8,
   'Overhead press: vertical push compound.',
   '{"role":"primary_compound_push","repRange":{"min":6,"max":8}}',
   '{}', '{}', 'recommendation', '["ppl","compound","push"]'),

  ('005', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'romanian_deadlift',        'primary_compound_hinge',
   '["intermediate","advanced"]', '{"barbell":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.8,
   'Romanian deadlift: hinge compound.',
   '{"role":"primary_compound_hinge","repRange":{"min":6,"max":10}}',
   '{}', '{}', 'recommendation', '["ppl","compound","hinge"]'),

  ('006', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'curl',                     'accessory',
   '["intermediate","advanced"]', '{"dumbbell":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.6,
   'Curl: arm accessory.',
   '{"role":"accessory","repRange":{"min":8,"max":15}}',
   '{}', '{}', 'soft_preference', '["ppl","accessory"]'),

  ('007', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'tricep_extension',         'accessory',
   '["intermediate","advanced"]', '{"cable":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.6,
   'Tricep extension: arm accessory.',
   '{"role":"accessory","repRange":{"min":8,"max":15}}',
   '{}', '{}', 'soft_preference', '["ppl","accessory"]'),

  ('008', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'lateral_raise',            'isolation',
   '["intermediate","advanced"]', '{"dumbbell":true}',
   '{"templateStyle":"ppl_hybrid"}', '{}', 0.55,
   'Lateral raise: shoulder isolation.',
   '{"role":"isolation","repRange":{"min":10,"max":20}}',
   '{}', '{}', 'soft_preference', '["ppl","isolation"]'),

  ('009', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'barbell_squat',            'primary_compound_squat',
   '["intermediate","advanced"]', '{"barbell":true,"rack":true}',
   '{"templateStyle":"ppl_hybrid","availableSessionsPerWeek":{"gte":5}}',
   '{"primaryGoalIsSkillSpecialization":true}', 0.85,
   'Barbell back squat: heavy compound squat.',
   '{"role":"primary_compound_squat","repRange":{"min":6,"max":8}}',
   '{}', '{}', 'recommendation', '["ppl","compound","squat"]'),

  ('010', 'src_batch_01_hybrid_ppl', 'hybrid', NULL, 'barbell_bench_press',      'primary_compound_push',
   '["intermediate","advanced"]', '{"barbell":true,"rack":true}',
   '{"templateStyle":"ppl_hybrid","availableSessionsPerWeek":{"gte":5}}',
   '{"primaryGoalIsSkillSpecialization":true}', 0.85,
   'Barbell bench press: heavy push compound.',
   '{"role":"primary_compound_push","repRange":{"min":6,"max":8}}',
   '{}', '{}', 'recommendation', '["ppl","compound","push"]'),

  -- Forearm Health
  ('011', 'src_batch_01_forearm_health', NULL, NULL, 'wrist_pronation',          'prehab',
   '["beginner","intermediate","advanced"]', '{"light_db":true}',
   '{"hasGripIntenseWork":true}', '{}', 0.85,
   'Wrist pronation 2x15.',
   '{"role":"prehab","sets":2,"reps":15}',
   '{}', '{}', 'recommendation', '["forearm","prehab"]'),

  ('012', 'src_batch_01_forearm_health', NULL, NULL, 'wrist_extension',          'prehab',
   '["beginner","intermediate","advanced"]', '{"light_db":true}',
   '{}', '{}', 0.85,
   'Wrist extension 2x15.',
   '{"role":"prehab","sets":2,"reps":15}',
   '{}', '{}', 'recommendation', '["forearm","prehab"]'),

  ('013', 'src_batch_01_forearm_health', NULL, NULL, 'wrist_supination',         'prehab',
   '["beginner","intermediate","advanced"]', '{"light_db":true}',
   '{}', '{}', 0.85,
   'Wrist supination 2x15.',
   '{"role":"prehab","sets":2,"reps":15}',
   '{}', '{}', 'recommendation', '["forearm","prehab"]'),

  ('014', 'src_batch_01_forearm_health', NULL, NULL, 'wrist_flexion',            'prehab',
   '["beginner","intermediate","advanced"]', '{"light_db":true}',
   '{}', '{}', 0.85,
   'Wrist flexion 2x15.',
   '{"role":"prehab","sets":2,"reps":15}',
   '{}', '{}', 'recommendation', '["forearm","prehab"]'),

  -- Pull-Up Pro Phase 1 (8 picks)
  ('015', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'pull_up',                    'primary_pull',
   '["beginner","early_intermediate"]', '{"pull_up_bar":true}',
   '{"phase":"phase_1"}', '{}', 0.95,
   'Pull-up: phase 1 primary.',
   '{"phase":"phase_1","role":"primary_pull"}',
   '{"phase":"phase_1"}', '{}', 'recommendation', '["pull_up_pro","phase_1"]'),

  ('016', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'inverted_row',               'support_pull',
   '["beginner","early_intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.85,
   'Inverted row: phase 1 horizontal pull support.',
   '{"phase":"phase_1","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_1"]'),

  ('017', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'dead_hang',                  'tendon_capacity',
   '["beginner","early_intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.8,
   'Dead hang: grip and scap.',
   '{"phase":"phase_1","role":"tendon_capacity"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_1","hang"]'),

  ('018', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'scap_pull_up',               'scap_quality',
   '["beginner","early_intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.8,
   'Scap pull-up: scap activation.',
   '{"phase":"phase_1","role":"scap_quality"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_1","scap"]'),

  ('019', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'face_pull',                  'shoulder_balance',
   '["beginner","early_intermediate"]', '{"cable":true}',
   '{}', '{}', 0.75,
   'Face pull: shoulder balance.',
   '{"phase":"phase_1","role":"shoulder_balance"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_1"]'),

  ('020', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'curl',                       'accessory',
   '["beginner","early_intermediate"]', '{"dumbbell":true}',
   '{}', '{}', 0.65,
   'Curl: arm accessory.',
   '{"phase":"phase_1","role":"accessory"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_1","accessory"]'),

  ('021', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'chin_up',                    'primary_pull',
   '["beginner","early_intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.85,
   'Chin-up: alternative phase 1 primary.',
   '{"phase":"phase_1","role":"primary_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_1"]'),

  ('022', 'src_batch_01_pull_up_pro_phase_1', 'pull_up', 'pull_up', 'chest_supported_row',        'support_pull',
   '["beginner","early_intermediate"]', '{"dumbbell":true}',
   '{}', '{}', 0.8,
   'Chest-supported row: stable horizontal pull.',
   '{"phase":"phase_1","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_1","row"]'),

  -- Pull-Up Pro Phase 2 (8 picks)
  ('023', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'assisted_oapu',          'primary_skill_pull',
   '["intermediate"]', '{"pull_up_bar":true,"band":true}',
   '{"phase":"phase_2","pullingBaseAdequate":true}', '{}', 0.95,
   'Assisted OAPU: phase 2 primary skill.',
   '{"phase":"phase_2","role":"primary_skill_pull"}',
   '{"phase":"phase_2"}', '{}', 'hard_constraint', '["pull_up_pro","phase_2","assisted"]'),

  ('024', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'pull_up',               'support_pull',
   '["intermediate"]', '{"pull_up_bar":true}',
   '{"phase":"phase_2"}', '{}', 0.85,
   'Two-arm pull stays in support during phase 2.',
   '{"phase":"phase_2","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_2"]'),

  ('025', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'inverted_row',          'support_pull',
   '["intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.8,
   'Row support during phase 2.',
   '{"phase":"phase_2","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_2","row"]'),

  ('026', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'scap_pull_up',          'scap_quality',
   '["intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.8,
   'Scap pull-up support.',
   '{"phase":"phase_2","role":"scap_quality"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_2","scap"]'),

  ('027', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'dead_hang',             'tendon_capacity',
   '["intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.75,
   'Dead hang phase 2.',
   '{"phase":"phase_2","role":"tendon_capacity"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_2","hang"]'),

  ('028', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'face_pull',             'shoulder_balance',
   '["intermediate"]', '{"cable":true}',
   '{}', '{}', 0.75,
   'Face pull phase 2.',
   '{"phase":"phase_2","role":"shoulder_balance"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_2"]'),

  ('029', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'curl',                  'accessory',
   '["intermediate"]', '{"dumbbell":true}',
   '{}', '{}', 0.65,
   'Curl accessory phase 2.',
   '{"phase":"phase_2","role":"accessory"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_2","accessory"]'),

  ('030', 'src_batch_01_pull_up_pro_phase_2', 'one_arm_pull_up', 'one_arm_pull_up', 'cable_assisted_oapu',   'primary_skill_pull',
   '["intermediate"]', '{"cable":true}',
   '{"phase":"phase_2"}', '{}', 0.85,
   'Cable-assisted OAPU: alternative phase 2 primary.',
   '{"phase":"phase_2","role":"primary_skill_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_2","cable"]'),

  -- Pull-Up Pro Phase 3 (8 picks)
  ('031', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'eccentric_oapu',         'primary_skill_pull',
   '["advanced"]', '{"pull_up_bar":true}',
   '{"phase":"phase_3"}', '{}', 0.95,
   'Eccentric OAPU: phase 3 primary.',
   '{"phase":"phase_3","role":"primary_skill_pull","eccentricSeconds":{"min":5,"max":10}}',
   '{"phase":"phase_3"}', '{}', 'hard_constraint', '["pull_up_pro","phase_3","eccentric"]'),

  ('032', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'one_arm_row',            'support_pull',
   '["advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.85,
   'One-arm row phase 3 support.',
   '{"phase":"phase_3","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_3","row"]'),

  ('033', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'one_arm_hang',           'tendon_capacity',
   '["advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.85,
   'One-arm hang grip+shoulder.',
   '{"phase":"phase_3","role":"tendon_capacity"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_3","hang"]'),

  ('034', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'pull_up',               'support_pull',
   '["advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.8,
   'Two-arm pull stays in support phase 3.',
   '{"phase":"phase_3","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_3"]'),

  ('035', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'scap_pull_up',          'scap_quality',
   '["advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.75,
   'Scap pull-up phase 3.',
   '{"phase":"phase_3","role":"scap_quality"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_3","scap"]'),

  ('036', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'face_pull',             'shoulder_balance',
   '["advanced"]', '{"cable":true}',
   '{}', '{}', 0.7,
   'Face pull phase 3.',
   '{"phase":"phase_3","role":"shoulder_balance"}',
   '{}', '{}', 'soft_preference', '["pull_up_pro","phase_3"]'),

  ('037', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'weighted_pull_up',      'support_pull',
   '["advanced"]', '{"pull_up_bar":true,"weight_belt":true}',
   '{}', '{}', 0.8,
   'Weighted pull-up: phase 3 weighted support.',
   '{"phase":"phase_3","role":"support_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_3","weighted"]'),

  ('038', 'src_batch_01_pull_up_pro_phase_3', 'one_arm_pull_up', 'one_arm_pull_up', 'archer_pull_up',        'primary_skill_pull',
   '["advanced"]', '{"pull_up_bar":true}',
   '{"phase":"phase_3"}', '{}', 0.85,
   'Archer pull-up: alternative phase 3 primary.',
   '{"phase":"phase_3","role":"primary_skill_pull"}',
   '{}', '{}', 'recommendation', '["pull_up_pro","phase_3","archer"]'),

  -- Front Lever (10+ picks already covered partly via principles/progressions; add 8 selections)
  ('039', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'fl_hold',                'primary_skill_static',
   '["intermediate","advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.95,
   'Front lever hold: primary FL skill.',
   '{"role":"primary_skill_static","holdSeconds":{"min":3,"max":12}}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'hard_constraint', '["front_lever","static"]'),

  ('040', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'fl_pull',                'dynamic_strength',
   '["intermediate","advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.9,
   'Front lever pull: dynamic FL strength.',
   '{"role":"dynamic_strength"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","pull"]'),

  ('041', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'fl_eccentric',           'eccentric_dynamic',
   '["intermediate","advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.85,
   'FL eccentric: control descent.',
   '{"role":"eccentric_dynamic","eccentricSeconds":{"min":4,"max":8}}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","eccentric"]'),

  ('042', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'band_fl_hold',           'assisted_static',
   '["intermediate"]', '{"pull_up_bar":true,"band":true}',
   '{}', '{}', 0.8,
   'Band-assisted FL hold: assisted volume + position practice.',
   '{"role":"assisted_static"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","band"]'),

  ('043', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'dragon_flag',            'compression_carryover',
   '["intermediate","advanced"]', '{"bench":true}',
   '{}', '{}', 0.7,
   'Dragon flag: anterior chain carryover.',
   '{"role":"compression_carryover"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","dragon_flag","carryover"]'),

  ('044', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'horizontal_scap_pull',   'scap_quality',
   '["intermediate","advanced"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.75,
   'Horizontal scap pull: scap-specific support for FL.',
   '{"role":"scap_quality"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","scap","carryover"]'),

  ('045', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'fl_pulldown',            'pattern_specific_dynamic',
   '["intermediate","advanced"]', '{"cable":true}',
   '{}', '{}', 0.8,
   'FL pulldown: lat-specific FL pattern.',
   '{"role":"pattern_specific_dynamic"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","pulldown","carryover"]'),

  ('046', 'src_batch_01_front_lever', 'front_lever', 'front_lever', 'tuck_fl_hold',           'progression_static',
   '["intermediate"]', '{"pull_up_bar":true}',
   '{}', '{}', 0.95,
   'Tuck FL hold: progression entry.',
   '{"role":"progression_static"}',
   '{"selectedSkills":{"contains":"front_lever"}}', '{}',
   'recommendation', '["front_lever","tuck"]'),

  -- Lower Body B (8 picks)
  ('047', 'src_batch_01_lower_body_b', NULL, NULL, 'step_up',                'lower_body_primary',
   '["beginner","intermediate","advanced"]', '{"bench":true}',
   '{}', '{}', 0.85,
   'Step-up: unilateral leg.',
   '{"role":"lower_body_primary"}',
   '{}', '{}', 'soft_preference', '["lower_body","step_up"]'),

  ('048', 'src_batch_01_lower_body_b', NULL, NULL, 'hamstring_curl',         'lower_body_primary',
   '["beginner","intermediate","advanced"]', '{"band":true}',
   '{}', '{}', 0.8,
   'Hamstring curl.',
   '{"role":"lower_body_primary"}',
   '{}', '{}', 'soft_preference', '["lower_body","hamstring"]'),

  ('049', 'src_batch_01_lower_body_b', NULL, NULL, 'sissy_squat',            'lower_body_primary',
   '["intermediate","advanced"]', '{"none":true}',
   '{}', '{}', 0.75,
   'Sissy squat: knee-extensor.',
   '{"role":"lower_body_primary"}',
   '{}', '{}', 'soft_preference', '["lower_body","sissy"]'),

  ('050', 'src_batch_01_lower_body_b', NULL, NULL, 'glute_bridge',           'lower_body_accessory',
   '["beginner","intermediate","advanced"]', '{"none":true}',
   '{}', '{}', 0.7,
   'Glute bridge.',
   '{"role":"lower_body_accessory"}',
   '{}', '{}', 'soft_preference', '["lower_body","glute"]'),

  ('051', 'src_batch_01_lower_body_b', NULL, NULL, 'calf_raise',             'lower_body_accessory',
   '["beginner","intermediate","advanced"]', '{"none":true}',
   '{}', '{}', 0.65,
   'Calf raise.',
   '{"role":"lower_body_accessory"}',
   '{}', '{}', 'soft_preference', '["lower_body","calf"]'),

  ('052', 'src_batch_01_lower_body_b', NULL, NULL, 'bulgarian_split_squat',  'lower_body_primary',
   '["intermediate","advanced"]', '{"bench":true,"dumbbell":true}',
   '{}', '{}', 0.8,
   'Bulgarian split squat.',
   '{"role":"lower_body_primary"}',
   '{}', '{}', 'soft_preference', '["lower_body","bulgarian"]'),

  ('053', 'src_batch_01_lower_body_b', NULL, NULL, 'single_leg_rdl',         'lower_body_primary',
   '["intermediate","advanced"]', '{"dumbbell":true}',
   '{}', '{}', 0.75,
   'Single-leg RDL.',
   '{"role":"lower_body_primary"}',
   '{}', '{}', 'soft_preference', '["lower_body","rdl"]'),

  ('054', 'src_batch_01_lower_body_b', NULL, NULL, 'nordic_curl',            'lower_body_primary',
   '["intermediate","advanced"]', '{"none":true}',
   '{}', '{}', 0.75,
   'Nordic curl: hamstring eccentric.',
   '{"role":"lower_body_primary"}',
   '{}', '{}', 'soft_preference', '["lower_body","nordic","eccentric"]'),

  -- Body By Rings (12 picks)
  ('055', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_dip',                  'primary_compound_push',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.9,
   'Ring dip.',
   '{"role":"primary_compound_push"}',
   '{}', '{}', 'recommendation', '["rings","push"]'),

  ('056', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_row',                  'primary_compound_pull',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.85,
   'Ring row.',
   '{"role":"primary_compound_pull"}',
   '{}', '{}', 'recommendation', '["rings","pull"]'),

  ('057', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_push_up',              'primary_compound_push',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.8,
   'Ring push-up.',
   '{"role":"primary_compound_push"}',
   '{}', '{}', 'recommendation', '["rings","push"]'),

  ('058', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_pull_up',              'primary_compound_pull',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.85,
   'Ring pull-up.',
   '{"role":"primary_compound_pull"}',
   '{}', '{}', 'recommendation', '["rings","pull"]'),

  ('059', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_chest_fly',            'isolation',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.75,
   'Ring chest fly.',
   '{"role":"isolation"}',
   '{}', '{}', 'soft_preference', '["rings","isolation"]'),

  ('060', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_face_pull',            'shoulder_balance',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.7,
   'Ring face pull.',
   '{"role":"shoulder_balance"}',
   '{}', '{}', 'soft_preference', '["rings","balance"]'),

  ('061', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_bulgarian_dip',        'primary_compound_push',
   '["advanced"]', '{"rings":true}',
   '{}', '{}', 0.8,
   'Ring Bulgarian dip.',
   '{"role":"primary_compound_push"}',
   '{}', '{}', 'soft_preference', '["rings","advanced"]'),

  ('062', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_archer_row',           'primary_compound_pull',
   '["advanced"]', '{"rings":true}',
   '{}', '{}', 0.8,
   'Ring archer row.',
   '{"role":"primary_compound_pull"}',
   '{}', '{}', 'soft_preference', '["rings","advanced"]'),

  ('063', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_l_sit',                'compression_carryover',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.7,
   'Ring L-sit.',
   '{"role":"compression_carryover"}',
   '{}', '{}', 'soft_preference', '["rings","l_sit"]'),

  ('064', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_curl',                 'accessory',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.6,
   'Ring curl: arm accessory.',
   '{"role":"accessory"}',
   '{}', '{}', 'soft_preference', '["rings","accessory"]'),

  ('065', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_tricep_extension',     'accessory',
   '["intermediate","advanced"]', '{"rings":true}',
   '{}', '{}', 0.6,
   'Ring tricep extension.',
   '{"role":"accessory"}',
   '{}', '{}', 'soft_preference', '["rings","accessory"]'),

  ('066', 'src_batch_01_body_by_rings', 'hypertrophy', NULL, 'ring_archer_push_up',       'primary_compound_push',
   '["advanced"]', '{"rings":true}',
   '{}', '{}', 0.8,
   'Ring archer push-up.',
   '{"role":"primary_compound_push"}',
   '{}', '{}', 'soft_preference', '["rings","advanced"]'),

  -- Cardio Guide (8 picks)
  ('067', 'src_batch_01_cardio_guide', NULL, NULL, 'liss_walk',                'conditioning_low',
   '["beginner","intermediate","advanced"]', '{"any":true}',
   '{}', '{}', 0.75,
   'LISS walk.',
   '{"role":"conditioning_low"}',
   '{}', '{}', 'soft_preference', '["cardio","liss"]'),

  ('068', 'src_batch_01_cardio_guide', NULL, NULL, 'liss_cycle',               'conditioning_low',
   '["beginner","intermediate","advanced"]', '{"any":true}',
   '{}', '{}', 0.7,
   'LISS cycle.',
   '{"role":"conditioning_low"}',
   '{}', '{}', 'soft_preference', '["cardio","liss"]'),

  ('069', 'src_batch_01_cardio_guide', NULL, NULL, 'liss_swim',                'conditioning_low',
   '["intermediate","advanced"]', '{"any":true}',
   '{}', '{}', 0.7,
   'LISS swim.',
   '{"role":"conditioning_low"}',
   '{}', '{}', 'soft_preference', '["cardio","liss"]'),

  ('070', 'src_batch_01_cardio_guide', NULL, NULL, 'hiit_intervals',           'conditioning_high',
   '["intermediate","advanced"]', '{"any":true}',
   '{"recoveryCapacity":"high"}', '{"recoveryCapacity":"low"}', 0.7,
   'HIIT intervals — recovery-gated.',
   '{"role":"conditioning_high","recoveryGate":"high"}',
   '{}', '{"or":[{"recoveryCapacity":"low"},{"weeklyDensity":"high"}]}',
   'recommendation', '["cardio","hiit"]'),

  ('071', 'src_batch_01_cardio_guide', NULL, NULL, 'hiit_sprint',              'conditioning_high',
   '["advanced"]', '{"any":true}',
   '{"recoveryCapacity":"high"}', '{"recoveryCapacity":"low"}', 0.6,
   'HIIT sprint.',
   '{"role":"conditioning_high"}',
   '{}', '{"recoveryCapacity":"low"}',
   'soft_preference', '["cardio","hiit","sprint"]'),

  ('072', 'src_batch_01_cardio_guide', NULL, NULL, 'liss_row',                 'conditioning_low',
   '["intermediate","advanced"]', '{"any":true}',
   '{}', '{}', 0.7,
   'LISS row.',
   '{"role":"conditioning_low"}',
   '{}', '{}', 'soft_preference', '["cardio","liss","row"]'),

  ('073', 'src_batch_01_cardio_guide', NULL, NULL, 'zone2_cycle',              'conditioning_low',
   '["intermediate","advanced"]', '{"any":true}',
   '{}', '{}', 0.75,
   'Zone 2 cycle: aerobic base.',
   '{"role":"conditioning_low","zone":2}',
   '{}', '{}', 'soft_preference', '["cardio","zone2"]'),

  ('074', 'src_batch_01_cardio_guide', NULL, NULL, 'jump_rope',                'conditioning_moderate',
   '["intermediate","advanced"]', '{"any":true}',
   '{}', '{"injuryAcuteLowerBody":true}', 0.65,
   'Jump rope.',
   '{"role":"conditioning_moderate"}',
   '{}', '{}', 'soft_preference', '["cardio","jump_rope"]')
) AS v(row_id, source_id, goal_key, skill_key, exercise_key, role_key,
       level_scope, equipment_requirements_json,
       preferred_when_json, avoid_when_json, selection_weight,
       plain_language_rule, computation_friendly_rule_json,
       applies_when_json, does_not_apply_when_json,
       priority_type, tags_json)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION (read-only — run separately)
-- ============================================================================
-- SELECT source_id, COUNT(*)
-- FROM (
--   SELECT source_id FROM training_doctrine_principles WHERE id LIKE 'pr_b01_%'
--   UNION ALL SELECT source_id FROM prescription_rules WHERE id LIKE 'rx_b01_%'
--   UNION ALL SELECT source_id FROM method_rules WHERE id LIKE 'mr_b01_%'
--   UNION ALL SELECT source_id FROM progression_rules WHERE id LIKE 'pg_b01_%'
--   UNION ALL SELECT source_id FROM skill_carryover_rules WHERE id LIKE 'co_b01_%'
--   UNION ALL SELECT source_id FROM exercise_selection_rules WHERE id LIKE 'es_b01_%'
-- ) all_atoms
-- GROUP BY source_id ORDER BY source_id;
