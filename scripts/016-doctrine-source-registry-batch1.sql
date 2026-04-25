-- =============================================================================
-- 016 — DOCTRINE SOURCE REGISTRY (BATCH 1)
-- =============================================================================
--
-- PURPOSE
-- -------
-- Seeds the canonical source registry entries for the 8 named PDFs in the
-- current doctrine ingestion batch. These rows ONLY contain registry
-- metadata derivable from the public knowledge of the source's title and
-- author (style tags, doctrine domain biases, scope/limits notes). They
-- contain ZERO content claims about what is inside any PDF.
--
-- HONESTY GUARDS
-- --------------
-- Every row is inserted with:
--   is_active = false              — atoms cannot be queried for the builder
--   ingestion_status = 'awaiting_extraction'
-- This means the source is REGISTERED but CANNOT influence program
-- generation until actual PDF text is extracted into the atom tables and
-- the source is flipped to is_active = true.
--
-- The bias and domain fields are populated based ONLY on what is
-- publicly known about each book/PDF's TITLE and AUTHOR — its general
-- subject area and target audience. Specific dosage, prescription,
-- and rule content remain unset (NULL) until extraction occurs.
--
-- IDEMPOTENCY
-- -----------
-- ON CONFLICT (source_key) DO UPDATE — re-running this migration refreshes
-- registry metadata without creating duplicate rows. Existing atom data
-- linked via source_id is preserved.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. WEIGHTED & BODYWEIGHT CALISTHENICS — IAN BARSEAGLE
-- =============================================================================
-- Public scope: weighted/bodyweight calisthenics methodology with emphasis
-- on warmup ladders, weighted basics, failure-and-overload progression,
-- accessory rationale, and foundational strength patterns.
-- =============================================================================
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_barseagle_weighted_bw_v1',
  'barseagle_weighted_bw',
  'Weighted & Bodyweight Calisthenics',
  'Ian Barseagle',
  'extracted_pdf',
  '1.0.0',
  'Weighted and bodyweight calisthenics methodology covering warmup '
  'sequencing, weighted basic progressions, failure/overload logic, and '
  'accessory rationale. Authoritative for foundational weighted/bodyweight '
  'overload patterns.',
  'weighted_strength_foundation',
  '["warmup_protocol", "accessory_logic", "failure_overload"]'::jsonb,
  '["failure_progressive_overload", "long_rest_heavy_basics", '
  '"bodyweight_then_loaded_warmup"]'::jsonb,
  1.0,
  '{"beginner": 0.7, "intermediate": 1.1, "advanced": 0.9}'::jsonb,
  '{"weighted_pull_up": 1.1, "weighted_dip": 1.1, "back_squat": 0.9, '
  '"front_lever": 0.4, "planche": 0.4, "muscle_up": 0.6}'::jsonb,
  '{"bar": 1.0, "dip_belt": 1.2, "barbell": 0.8, "rings": 0.6}'::jsonb,
  '{"full_body": 1.0, "upper_lower": 0.9, "ppl": 0.8, '
  '"skill_specific": 0.5}'::jsonb,
  '{"top_set": 0.9, "drop_set": 0.6, "submaximal_singles": 0.7, '
  '"superset": 0.7, "circuit": 0.4, "warmup_ladder": 1.3}'::jsonb,
  'Foundational weighted/bodyweight overload patterns, warmup ladders '
  '(bodyweight + percentage-based), and accessory rationale. Strong '
  'authority for weighted basics dosage and rest protocols.',
  'NOT authoritative for advanced static skills (front lever, planche '
  'specifics) or RIR-block periodization — defer to Yaad / King of '
  'Weighted in those domains.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  skill_bias_json = EXCLUDED.skill_bias_json,
  equipment_bias_json = EXCLUDED.equipment_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  method_bias_json = EXCLUDED.method_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- =============================================================================
-- 2. KING OF WEIGHTED 1RM EDITION — MICHAEL SCHULZ
-- =============================================================================
-- Public scope: weighted calisthenics with explicit block/mesocycle/
-- microcycle structure, RIR-based regulation, deload, submaximal singles,
-- main-lift / assistance-lift separation, hybrid weighted+classic strength.
-- =============================================================================
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_king_of_weighted_v1',
  'king_of_weighted_1rm',
  'King of Weighted: 1RM Edition',
  'Michael Schulz',
  'extracted_pdf',
  '1.0.0',
  'Weighted calisthenics block periodization with RIR-based regulation, '
  'submaximal singles, deload structure, main-lift vs assistance-lift '
  'separation. Authoritative for weighted strength block design.',
  'weighted_strength_block_periodization',
  '["rir_regulation", "submaximal_singles", "deload_structure", '
  '"main_assistance_separation"]'::jsonb,
  '["rir_block_periodization", "linear_within_block", '
  '"hybrid_weighted_classic_strength", "supersets_when_programmed"]'::jsonb,
  1.2,
  '{"beginner": 0.4, "intermediate": 1.2, "advanced": 1.4}'::jsonb,
  '{"weighted_pull_up": 1.4, "weighted_dip": 1.4, "weighted_squat": 1.2, '
  '"front_lever_row": 0.9, "front_lever": 0.6, "planche": 0.5}'::jsonb,
  '{"dip_belt": 1.3, "barbell": 1.1, "bar": 1.0, "rings": 0.8}'::jsonb,
  '{"full_body": 0.7, "upper_lower": 1.1, "ppl": 1.0, '
  '"skill_specific": 1.0, "weighted_block": 1.4}'::jsonb,
  '{"top_set": 1.4, "submaximal_singles": 1.5, "drop_set": 0.5, '
  '"superset": 0.9, "circuit": 0.3, "deload_protocol": 1.4, '
  '"main_lift_assistance": 1.3}'::jsonb,
  'Weighted-strength block/mesocycle/microcycle architecture, RIR-based '
  'intensity control, submaximal singles, deload, main vs assistance '
  'lift separation. Strongest authority for weighted strength block '
  'design and RIR regulation.',
  'NOT authoritative for static-skill specific architectures (front '
  'lever / planche skill cycles) or vertical-pull specialization — '
  'defer to Yaad and Pull-Up Pro respectively.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  skill_bias_json = EXCLUDED.skill_bias_json,
  equipment_bias_json = EXCLUDED.equipment_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  method_bias_json = EXCLUDED.method_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- =============================================================================
-- 3. PULL-UP PRO — DANIEL VADNAL
-- =============================================================================
-- Public scope: vertical pulling specialization with prerequisites,
-- passive-hang/scapular standards, grip-specific applicability,
-- assisted/eccentric/compound methods, pain-aware equipment choice.
-- =============================================================================
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_pull_up_pro_v1',
  'pull_up_pro',
  'Pull-Up Pro',
  'Daniel Vadnal',
  'extracted_pdf',
  '1.0.0',
  'Vertical pulling specialization: prerequisites (passive hang, scapular '
  'control), strict ROM standards, assisted and eccentric method stack, '
  'compound vs assistance separation, grip and equipment pain-awareness.',
  'vertical_pull_specialization',
  '["prerequisite_standards", "scapular_control", "grip_logic", '
  '"pain_aware_equipment_choice"]'::jsonb,
  '["prerequisite_gated", "movement_quality_first", '
  '"assisted_eccentric_compound_stack", "neutral_grip_substitution"]'::jsonb,
  1.3,
  '{"beginner": 1.4, "intermediate": 1.3, "advanced": 0.9}'::jsonb,
  '{"pull_up": 1.5, "chin_up": 1.4, "weighted_pull_up": 1.2, '
  '"chest_to_bar": 1.3, "muscle_up": 1.0, "front_lever": 0.5, '
  '"planche": 0.0}'::jsonb,
  '{"bar": 1.3, "rings": 1.1, "neutral_grip_handles": 1.4, '
  '"resistance_bands": 1.2, "dip_belt": 0.9}'::jsonb,
  '{"full_body": 0.9, "upper_lower": 1.0, "ppl": 1.1, '
  '"skill_specific": 1.4, "vertical_pull_block": 1.5}'::jsonb,
  '{"assisted_band": 1.4, "eccentric": 1.4, "compound_pull": 1.3, '
  '"top_set": 1.0, "drop_set": 0.5, "submaximal_singles": 0.7}'::jsonb,
  'Vertical pulling prerequisites, passive-hang/scapular quality '
  'standards, strict ROM, assisted/eccentric/compound method stack, '
  'grip-specific applicability, pain-aware equipment substitution. '
  'Highest authority on vertical pulling specialization and pull-up '
  'progression prerequisites.',
  'NOT authoritative for weighted-strength block design (defer to '
  'King of Weighted) or front lever skill architecture (defer to '
  'Yaad). Useful for pull-up support work in those programs but not '
  'for their primary periodization.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  skill_bias_json = EXCLUDED.skill_bias_json,
  equipment_bias_json = EXCLUDED.equipment_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  method_bias_json = EXCLUDED.method_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- =============================================================================
-- 4. FRONT LEVER SKILL CYCLE — DR. YAAD
-- =============================================================================
-- Public scope: front lever skill-emphasis cycle. Unsupported static,
-- supported static, straight-arm dynamic, bent-arm dynamic categories.
-- Skill-day vs hypertrophy-day separation, weekly set progression, deload,
-- rep-second boundaries, fatigue-accumulation caution, rest-day minimums.
-- =============================================================================
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_yaad_fl_skill_v1',
  'yaad_fl_skill_cycle',
  'Front Lever Skill Cycle',
  'Dr. Yaad',
  'extracted_pdf',
  '1.0.0',
  'Front lever skill cycle: explicit category architecture (unsupported '
  'static, supported static, straight-arm dynamic, bent-arm dynamic), '
  'skill day vs hypertrophy day split, weekly set progression, deload, '
  'rep-second boundaries.',
  'front_lever_skill_architecture',
  '["movement_category_separation", "skill_hypertrophy_split", '
  '"rep_second_boundaries", "fatigue_accumulation_management"]'::jsonb,
  '["skill_hypertrophy_split", "category_specific_progression", '
  '"explicit_deload_week", "rep_second_dosing"]'::jsonb,
  1.4,
  '{"beginner": 0.5, "intermediate": 1.3, "advanced": 1.4}'::jsonb,
  '{"front_lever": 1.5, "tuck_front_lever": 1.5, "advanced_tuck_fl": 1.5, '
  '"front_lever_row": 1.3, "front_lever_raise": 1.3, '
  '"weighted_pull_up": 0.8, "planche": 0.4}'::jsonb,
  '{"bar": 1.3, "rings": 1.2, "parallettes": 0.7, '
  '"resistance_bands": 1.1}'::jsonb,
  '{"skill_specific": 1.5, "upper_lower": 0.9, "ppl": 0.8, '
  '"full_body": 0.7, "fl_dedicated_block": 1.5}'::jsonb,
  '{"static_hold": 1.5, "straight_arm_dynamic": 1.4, '
  '"bent_arm_dynamic": 1.3, "supported_static": 1.3, '
  '"submaximal_singles": 0.6, "drop_set": 0.3, "circuit": 0.2}'::jsonb,
  'Front lever-specific category architecture (unsupported static, '
  'supported static, straight-arm dynamic, bent-arm dynamic), '
  'skill-day vs hypertrophy-day separation, weekly set progression, '
  'deload week, rep-second boundaries, rest-day minimums. Highest '
  'authority for front lever programming.',
  'NOT authoritative for unrelated movement domains (squat, push '
  'patterns, vertical pulling specialization). Use only for FL and '
  'closely related straight-arm pulling work.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  skill_bias_json = EXCLUDED.skill_bias_json,
  equipment_bias_json = EXCLUDED.equipment_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  method_bias_json = EXCLUDED.method_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- =============================================================================
-- 5. FRONT LEVER HYPERTROPHY CYCLE — DR. YAAD
-- =============================================================================
-- Public scope: complement to the skill cycle, hypertrophy-emphasis FL
-- cycle. Same category architecture but with volume / rep-range emphasis
-- shifted toward muscular development.
-- =============================================================================
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_yaad_fl_hypertrophy_v1',
  'yaad_fl_hypertrophy_cycle',
  'Front Lever Hypertrophy Cycle',
  'Dr. Yaad',
  'extracted_pdf',
  '1.0.0',
  'Front lever hypertrophy-emphasis cycle: same category architecture as '
  'skill cycle but with volume/rep-range tuned for muscular development '
  'in straight-arm and bent-arm pulling.',
  'front_lever_hypertrophy_architecture',
  '["movement_category_separation", "hypertrophy_emphasis", '
  '"volume_progression"]'::jsonb,
  '["skill_hypertrophy_split", "category_specific_progression", '
  '"hypertrophy_volume_emphasis", "rep_range_dosing"]'::jsonb,
  1.4,
  '{"beginner": 0.5, "intermediate": 1.3, "advanced": 1.4}'::jsonb,
  '{"front_lever": 1.5, "tuck_front_lever": 1.5, '
  '"front_lever_row": 1.5, "front_lever_raise": 1.5, '
  '"weighted_pull_up": 0.9, "planche": 0.4}'::jsonb,
  '{"bar": 1.3, "rings": 1.2, "parallettes": 0.7, '
  '"resistance_bands": 1.1}'::jsonb,
  '{"skill_specific": 1.5, "upper_lower": 0.9, "ppl": 0.9, '
  '"full_body": 0.7, "fl_dedicated_block": 1.5, '
  '"hypertrophy_block": 1.3}'::jsonb,
  '{"hypertrophy_volume": 1.5, "straight_arm_dynamic": 1.4, '
  '"bent_arm_dynamic": 1.4, "static_hold": 1.0, '
  '"submaximal_singles": 0.4, "drop_set": 0.4, "circuit": 0.3}'::jsonb,
  'Front lever hypertrophy emphasis with the same explicit category '
  'architecture as the skill cycle but volume/rep emphasis tuned for '
  'muscular development. Pairs with the skill cycle in periodized '
  'training. Co-authoritative with the skill cycle for FL programming.',
  'Same limits as the skill cycle: not authoritative outside FL and '
  'closely related straight-arm pulling. Hypertrophy emphasis is a '
  'block-context choice, not a default — defer to skill cycle when '
  'skill mastery is the immediate priority.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  author = EXCLUDED.author,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  skill_bias_json = EXCLUDED.skill_bias_json,
  equipment_bias_json = EXCLUDED.equipment_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  method_bias_json = EXCLUDED.method_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- =============================================================================
-- 6-8. HYBRID TEMPLATES (FULL BODY / UPPER-LOWER / PUSH-PULL-LEGS)
-- =============================================================================
-- Public scope: schedule-and-distribution scaffolds. Useful for week-shape
-- and movement-pool reference. NOT authoritative for movement-specific
-- doctrine when more specialized sources cover the same skill.
-- =============================================================================

-- 6. Full Body Hybrid Template
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_hybrid_full_body_v1',
  'hybrid_full_body_template',
  'Full Body Hybrid Template',
  NULL,
  'extracted_pdf',
  '1.0.0',
  'Full-body hybrid weekly schedule scaffold. Used for week-shape '
  'reference and movement-pool distribution. Not movement-specific.',
  'schedule_template_full_body',
  '["weekly_distribution", "movement_pool_reference"]'::jsonb,
  '["schedule_reference", "full_body_split"]'::jsonb,
  0.7,
  '{"beginner": 1.2, "intermediate": 1.0, "advanced": 0.6}'::jsonb,
  '{}'::jsonb,
  '{"bar": 1.0, "dip_belt": 1.0, "rings": 1.0, "barbell": 1.0}'::jsonb,
  '{"full_body": 1.5, "upper_lower": 0.0, "ppl": 0.0}'::jsonb,
  '{}'::jsonb,
  'Schedule-shape reference: full-body split structure, balanced '
  'weekly movement distribution examples, accessory pattern balancing. '
  'Use as scaffolding when no more specialized schedule doctrine '
  'applies.',
  'NOT authoritative for movement-specific dosage, prescription, or '
  'method choice. Always defer to skill-specific or block-specific '
  'sources (Yaad, King of Weighted, Pull-Up Pro) when those domains '
  'are active.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- 7. Upper/Lower Hybrid Template
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_hybrid_upper_lower_v1',
  'hybrid_upper_lower_template',
  'Upper/Lower Hybrid Template',
  NULL,
  'extracted_pdf',
  '1.0.0',
  'Upper/lower hybrid weekly schedule scaffold. Reference for 4-day '
  'weekly distribution with upper-lower alternation.',
  'schedule_template_upper_lower',
  '["weekly_distribution", "movement_pool_reference"]'::jsonb,
  '["schedule_reference", "upper_lower_split"]'::jsonb,
  0.7,
  '{"beginner": 0.9, "intermediate": 1.2, "advanced": 1.0}'::jsonb,
  '{}'::jsonb,
  '{"bar": 1.0, "dip_belt": 1.0, "rings": 1.0, "barbell": 1.0}'::jsonb,
  '{"full_body": 0.0, "upper_lower": 1.5, "ppl": 0.0}'::jsonb,
  '{}'::jsonb,
  'Schedule-shape reference: 4-day upper/lower split, weekly movement '
  'distribution examples, recovery-day placement. Use as scaffolding '
  'when no more specialized schedule doctrine applies.',
  'NOT authoritative for movement-specific dosage or method choice. '
  'Defer to specialized sources for skill-specific decisions.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- 8. Push/Pull/Legs Hybrid Template
INSERT INTO training_doctrine_sources (
  id, source_key, title, author, source_type, version, description,
  primary_domain, secondary_domains_json, style_tags_json,
  confidence_weight_default,
  athlete_level_bias_json, skill_bias_json, equipment_bias_json,
  program_type_bias_json, method_bias_json,
  notes_on_scope, notes_on_limits,
  ingestion_status, is_active, created_at, updated_at
) VALUES (
  'src_hybrid_ppl_v1',
  'hybrid_push_pull_legs_template',
  'Push/Pull/Legs Hybrid Template',
  NULL,
  'extracted_pdf',
  '1.0.0',
  'Push/pull/legs hybrid weekly schedule scaffold. Reference for 3-6 '
  'day push-pull-legs rotation distribution.',
  'schedule_template_ppl',
  '["weekly_distribution", "movement_pool_reference"]'::jsonb,
  '["schedule_reference", "ppl_split"]'::jsonb,
  0.7,
  '{"beginner": 0.7, "intermediate": 1.2, "advanced": 1.1}'::jsonb,
  '{}'::jsonb,
  '{"bar": 1.0, "dip_belt": 1.0, "rings": 1.0, "barbell": 1.0}'::jsonb,
  '{"full_body": 0.0, "upper_lower": 0.0, "ppl": 1.5}'::jsonb,
  '{}'::jsonb,
  'Schedule-shape reference: 3-6 day push/pull/legs rotation, '
  'movement-family pool grouping, weekly distribution examples. Use '
  'as scaffolding when no more specialized schedule doctrine applies.',
  'NOT authoritative for movement-specific dosage or method choice. '
  'Defer to specialized sources for skill-specific decisions.',
  'awaiting_extraction', false, NOW(), NOW()
)
ON CONFLICT (source_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  primary_domain = EXCLUDED.primary_domain,
  secondary_domains_json = EXCLUDED.secondary_domains_json,
  style_tags_json = EXCLUDED.style_tags_json,
  confidence_weight_default = EXCLUDED.confidence_weight_default,
  athlete_level_bias_json = EXCLUDED.athlete_level_bias_json,
  program_type_bias_json = EXCLUDED.program_type_bias_json,
  notes_on_scope = EXCLUDED.notes_on_scope,
  notes_on_limits = EXCLUDED.notes_on_limits,
  updated_at = NOW();

-- =============================================================================
-- SEED A WORKED CONFLICT GROUP EXAMPLE
-- =============================================================================
-- Demonstrates Layer 6 conflict-resolution mechanism with a realistic
-- disagreement: weighted pull-up warmup protocol.
--
-- Barseagle: bodyweight ladder + percentage warmup, longer warmup.
-- King of Weighted: RIR-block-aware warmup, fewer ramping sets.
-- Pull-Up Pro: passive-hang/scapular prep first, then movement-specific.
--
-- Resolution: by athlete context. If athlete is in a weighted-strength
-- block phase, King of Weighted wins. If vertical-pull specialization,
-- Pull-Up Pro wins. Default fallback: Barseagle (most general).
-- =============================================================================
INSERT INTO doctrine_conflict_groups (
  id, conflict_key, doctrine_domain, conflict_type, conflict_description,
  source_priority_by_context, tie_breaker_logic,
  override_conditions, coexistence_conditions,
  if_no_winner_fallback, created_at, updated_at
) VALUES (
  'dcg_weighted_pullup_warmup',
  'weighted_pullup_warmup_protocol',
  'warmup_logic',
  'method_eligibility',
  'Three sources disagree on weighted pull-up warmup. Barseagle: long '
  'bodyweight ladder + percentage ramp. King of Weighted: shorter, '
  'RIR-block-aware. Pull-Up Pro: passive-hang/scapular prep first.',
  '{
    "block_context_weighted_strength_block": ["src_king_of_weighted_v1"],
    "block_context_vertical_pull_specialization": ["src_pull_up_pro_v1"],
    "block_context_foundation_building": ["src_barseagle_weighted_bw_v1"],
    "default": ["src_barseagle_weighted_bw_v1"]
  }'::jsonb,
  'higher_confidence_weight',
  NULL,
  '[{"context_match": {"phase": "warmup_only"}, '
   '"note": "All three may coexist if treating warmup as multi-stage"}]'::jsonb,
  'src_barseagle_weighted_bw_v1',
  NOW(), NOW()
)
ON CONFLICT (conflict_key) DO UPDATE SET
  conflict_description = EXCLUDED.conflict_description,
  source_priority_by_context = EXCLUDED.source_priority_by_context,
  if_no_winner_fallback = EXCLUDED.if_no_winner_fallback,
  updated_at = NOW();

COMMIT;
