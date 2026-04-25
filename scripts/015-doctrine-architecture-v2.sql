-- =============================================================================
-- 015 — DOCTRINE ARCHITECTURE V2
-- =============================================================================
--
-- PURPOSE
-- -------
-- Upgrades the existing 10 doctrine tables (sources, principles, methods,
-- prescriptions, selection, progression, prerequisites, contraindications,
-- carryover, versions) to support the 10 architecture layers required by
-- the doctrine-ingestion-and-storage upgrade prompt:
--
--   Layer 1: Source Registry — richer source metadata (author, biases,
--            domains, style tags, confidence default, scope/limits notes,
--            ingestion status).
--   Layer 2: Doctrine Atom Model — adds applies_when/does_not_apply_when
--            JSONB conditions, plain-language vs computation-friendly rule
--            split, evidence snippet, priority type, tags, conflict link.
--   Layer 3: Doctrine Domains — supported via existing doctrine_family text
--            column on principles + new tags_json (no new table needed).
--   Layer 4: Method Eligibility Matrix — new table
--            exercise_family_method_eligibility for explicit per-family
--            method compatibility (drop-set, superset, top-set, etc.).
--   Layer 5: Phase/Week Intelligence Separation — new boolean columns
--            is_base_intelligence and is_phase_modulation on principles
--            and prescription_rules. Builds the "base day first, phase
--            scaling on top" architecture into the data model itself.
--   Layer 6: Conflict Resolution — new table doctrine_conflict_groups and
--            new conflict_group_id link column on every atom table.
--   Layer 7: Athlete-Context Matching — supported via new
--            applies_when_json on every atom table (richer than the
--            existing single-field scope columns).
--   Layer 8: Source-Specific Extraction Staging — new table
--            doctrine_ingestion_staging holds raw extracted text awaiting
--            structured normalization.
--   Layer 9: No-Genericization Rules — enforced in code
--            (lib/doctrine-ingestion-contract.ts), not schema. This file
--            adds the data primitives those rules guard.
--   Layer 10: Builder-Readable Output — supported via the existing
--            UnifiedDoctrineDecision type; this migration adds the data
--            primitives that contract reads from.
--
-- SAFETY
-- ------
-- - Every change is ADDITIVE. No DROP, no ALTER TYPE on existing columns,
--   no data loss possible.
-- - All new columns are NULLABLE so existing 153 rows stay valid.
-- - All ADD COLUMN uses IF NOT EXISTS, all CREATE TABLE uses IF NOT EXISTS.
-- - Re-running this migration is a no-op (idempotent).
-- - Existing readers (lib/doctrine-db.ts, doctrine-query-service.ts,
--   doctrine-runtime-contract.ts) are untouched and continue to work
--   because they only read columns they know about; new columns are
--   transparent to them.
--
-- WHAT IS NOT IN THIS MIGRATION
-- -----------------------------
-- - No PDF content. PDF extraction happens in a later step once the actual
--   PDF text is available. This migration only builds the SHAPE that
--   extraction will fill.
-- - No data backfill of new columns on existing rows. Existing rules keep
--   their current behavior (NULL applies_when_json = "no extra
--   conditions, use existing scope columns").
-- - No deletion or demotion of code-based registries
--   (training-doctrine-registry/, doctrine/method-profile-registry.ts).
--   Those continue to function as documented intentional fallbacks until
--   DB coverage exceeds them per source-by-source decision.
-- =============================================================================

BEGIN;

-- =============================================================================
-- LAYER 1: SOURCE REGISTRY UPGRADE
-- =============================================================================
-- Existing training_doctrine_sources columns:
--   id, source_key, title, source_type, version, description, is_active,
--   created_at, updated_at
--
-- Add author + bias/domain/style/notes/ingestion-status to support the
-- canonical source registry described in Layer 1 of the prompt.
-- =============================================================================

-- Author of the source (book/PDF/article author). Nullable: legacy
-- system_seeded sources have no human author.
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS author TEXT;

-- The dominant doctrine domain this source speaks to (e.g. 'weighted_strength',
-- 'vertical_pull_specialization', 'front_lever_skill_architecture',
-- 'schedule_template'). Drives query-time source priority by context.
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS primary_domain TEXT;

-- Secondary doctrine domains this source contributes meaningfully to.
-- JSONB array of strings.
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS secondary_domains_json JSONB;

-- Coaching-style tags ('rir_block_periodization', 'failure_progressive_overload',
-- 'skill_hypertrophy_split', 'prerequisite_gated', 'schedule_reference').
-- JSONB array of strings.
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS style_tags_json JSONB;

-- Default confidence weight applied to atoms from this source when no
-- atom-level override exists. Range 0.0 - 1.5. Higher = stronger influence
-- in conflict resolution. NULL = use 1.0.
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS confidence_weight_default NUMERIC(3,2);

-- Athlete-level bias: which levels this source serves best.
-- JSONB e.g. {"beginner": 0.3, "intermediate": 1.0, "advanced": 1.2}
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS athlete_level_bias_json JSONB;

-- Skill bias: which skills this source most authoritatively addresses.
-- JSONB e.g. {"front_lever": 1.3, "weighted_pull_up": 0.9, "planche": 0.0}
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS skill_bias_json JSONB;

-- Equipment bias: equipment contexts where this source is most relevant.
-- JSONB e.g. {"bar_only": 1.0, "rings": 1.0, "dip_belt": 1.2}
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS equipment_bias_json JSONB;

-- Program-type bias: which program structures this source informs.
-- JSONB e.g. {"full_body": 0.6, "upper_lower": 1.0, "ppl": 1.0,
--             "skill_specific": 1.2}
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS program_type_bias_json JSONB;

-- Method bias: which training methods this source most strongly endorses
-- or most strongly deprioritizes. JSONB e.g.
-- {"top_set": 1.3, "drop_set": 0.4, "submaximal_singles": 1.5}
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS method_bias_json JSONB;

-- Free-text notes on the source's intended scope (what it covers well).
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS notes_on_scope TEXT;

-- Free-text notes on the source's known limits (what it is NOT for / where
-- it must defer to a more specialized source).
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS notes_on_limits TEXT;

-- Ingestion status: tracks the lifecycle of a source from registration to
-- full atom extraction. Values:
--   'pending'              — registered but no extraction yet
--   'awaiting_extraction'  — registered with metadata; PDF text not yet read
--   'partial_extraction'   — some atoms extracted, more pending
--   'fully_extracted'      — all available doctrine atoms extracted
--   'system_seeded'        — atoms are code-seeded (legacy script-013/014)
ALTER TABLE training_doctrine_sources
  ADD COLUMN IF NOT EXISTS ingestion_status TEXT
  CHECK (ingestion_status IS NULL OR ingestion_status IN (
    'pending', 'awaiting_extraction', 'partial_extraction',
    'fully_extracted', 'system_seeded'
  ));

-- =============================================================================
-- LAYER 6: CONFLICT RESOLUTION GROUPS
-- =============================================================================
-- A conflict group binds together two or more atoms from different sources
-- that disagree on the same coaching question. The group declares HOW the
-- conflict resolves: which source wins under which context, what the
-- tie-breaker is, whether coexistence is allowed, and what to fall back
-- to if no source's context matches.
-- =============================================================================

CREATE TABLE IF NOT EXISTS doctrine_conflict_groups (
  id TEXT PRIMARY KEY,

  -- Stable key naming the conflict topic, e.g.
  -- 'weighted_pullup_warmup_protocol', 'front_lever_skill_volume_per_week'.
  conflict_key TEXT NOT NULL UNIQUE,

  -- Domain this conflict lives in.
  doctrine_domain TEXT NOT NULL,

  -- Conflict type:
  --   'dosage_disagreement'      — different rep/set/rest prescriptions
  --   'method_eligibility'       — one source allows method X, another blocks
  --   'progression_path'         — different progression sequences
  --   'prerequisite_threshold'   — different prerequisite standards
  --   'phase_structure'          — different periodization
  --   'movement_pattern_truth'   — different movement-pattern claims
  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'dosage_disagreement', 'method_eligibility', 'progression_path',
    'prerequisite_threshold', 'phase_structure', 'movement_pattern_truth'
  )),

  -- Plain English description of the disagreement.
  conflict_description TEXT NOT NULL,

  -- Source priority by context. JSONB structure:
  --   {
  --     "vertical_pull_specialization": ["src_pull_up_pro_v1"],
  --     "weighted_strength_block":     ["src_king_of_weighted_v1"],
  --     "front_lever_skill_cycle":     ["src_yaad_fl_skill_v1"],
  --     "front_lever_hypertrophy":     ["src_yaad_fl_hypertrophy_v1"],
  --     "schedule_template":           ["src_hybrid_full_body_v1"],
  --     "default":                     ["src_king_of_weighted_v1"]
  --   }
  -- Builder reads this to pick a winner: it walks the athlete context keys
  -- against this map; first match wins. 'default' is the absolute fallback.
  source_priority_by_context JSONB NOT NULL,

  -- Tie-breaker logic when multiple sources are equally valid:
  --   'higher_confidence_weight' — pick the source with the higher
  --                                 confidence_weight_default.
  --   'more_specific_atom'       — pick the atom whose applies_when
  --                                 conditions are MORE specific.
  --   'newer_version'            — pick the more recently versioned atom.
  --   'manual_override'          — see override_conditions JSONB for
  --                                 explicit decisions.
  tie_breaker_logic TEXT NOT NULL CHECK (tie_breaker_logic IN (
    'higher_confidence_weight', 'more_specific_atom',
    'newer_version', 'manual_override'
  )),

  -- Override conditions: explicit per-context manual decisions when
  -- tie_breaker_logic is 'manual_override'. JSONB array of objects:
  --   [{ "context_match": {...}, "winner_source_id": "src_..." }, ...]
  override_conditions JSONB,

  -- Coexistence conditions: when two sources can BOTH apply at once
  -- (e.g. one informs warmup, the other informs working sets).
  -- JSONB array of context conditions where coexistence is permitted.
  coexistence_conditions JSONB,

  -- Fallback when no source's priority matches the athlete context.
  -- Either a source_id string or special value 'no_authority' to mean
  -- "skip this conflict, return no doctrine atom".
  if_no_winner_fallback TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflict_groups_domain
  ON doctrine_conflict_groups (doctrine_domain);
CREATE INDEX IF NOT EXISTS idx_conflict_groups_key
  ON doctrine_conflict_groups (conflict_key);

-- =============================================================================
-- LAYER 2: DOCTRINE ATOM ENRICHMENT (across all atom tables)
-- =============================================================================
-- Each atom table gets a consistent set of additional columns that turn the
-- atoms from "stored tip with scope" into "computation-usable rule with
-- explicit applicability conditions, evidence trail, and conflict link."
-- =============================================================================

-- Helper: a list of every atom-bearing table. Each gets the same enrichment.
-- Tables: training_doctrine_principles, method_rules, prescription_rules,
--         exercise_selection_rules, progression_rules, skill_carryover_rules,
--         exercise_prerequisite_rules, exercise_contraindication_rules.
--
-- Per-atom additions:
--   applies_when_json           - JSONB. Conditions that must ALL match for
--                                 the atom to apply. Richer replacement for
--                                 the existing single-purpose scope columns.
--                                 Existing scope columns remain authoritative
--                                 when applies_when_json is NULL.
--   does_not_apply_when_json    - JSONB. Conditions any of which BLOCK the
--                                 atom. Equivalent to the avoid_when_json
--                                 column on selection rules but generalized.
--   plain_language_rule         - TEXT. Human-readable form of the rule.
--                                 Many tables already have a 'summary' / 
--                                 'rationale' field; this is the 'plain'
--                                 form when summary serves a different role.
--   computation_friendly_rule_json - JSONB. The structured, deterministic
--                                 form a builder can consume without prose
--                                 parsing. e.g. {"action": "block_method",
--                                 "method": "drop_set", "exercise_family":
--                                 "weighted_pull_up"}
--   priority_type               - TEXT. 'hard_constraint' (must), 
--                                 'soft_preference' (should), or
--                                 'recommendation' (consider).
--   evidence_snippet            - TEXT. Short verbatim quote from the source
--                                 that justifies the atom. Required for
--                                 auditability of extracted_pdf atoms.
--   tags_json                   - JSONB array of free-form tag strings.
--   conflict_group_id           - FK to doctrine_conflict_groups(id).
--                                 NULL = atom is not part of any conflict.
-- =============================================================================

-- 2a. training_doctrine_principles
ALTER TABLE training_doctrine_principles
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_base_intelligence BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_phase_modulation BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN training_doctrine_principles.is_base_intelligence IS
  'TRUE = this principle defines what a good day fundamentally looks like '
  '(Layer 5: BASE intelligence). Most principles are base.';
COMMENT ON COLUMN training_doctrine_principles.is_phase_modulation IS
  'TRUE = this principle modifies the base across week 1/2/3/4 (Layer 5: '
  'PHASE modulation). Phase modulators must NOT also be base intelligence.';

-- 2b. method_rules
ALTER TABLE method_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL;

-- 2c. prescription_rules
ALTER TABLE prescription_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_base_intelligence BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_phase_modulation BOOLEAN DEFAULT FALSE,
  -- Phase eligibility: which week phases this prescription applies to.
  -- JSONB array, e.g. ["acclimation", "build", "peak", "deload"] or
  -- ["week_1", "week_2", "week_3", "week_4"]. NULL = all phases.
  ADD COLUMN IF NOT EXISTS phase_eligibility_json JSONB;

-- 2d. exercise_selection_rules
ALTER TABLE exercise_selection_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL;

-- 2e. progression_rules
ALTER TABLE progression_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL;

-- 2f. skill_carryover_rules
ALTER TABLE skill_carryover_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL;

-- 2g. exercise_prerequisite_rules
ALTER TABLE exercise_prerequisite_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL;

-- 2h. exercise_contraindication_rules
ALTER TABLE exercise_contraindication_rules
  ADD COLUMN IF NOT EXISTS applies_when_json JSONB,
  ADD COLUMN IF NOT EXISTS does_not_apply_when_json JSONB,
  ADD COLUMN IF NOT EXISTS plain_language_rule TEXT,
  ADD COLUMN IF NOT EXISTS computation_friendly_rule_json JSONB,
  ADD COLUMN IF NOT EXISTS priority_type TEXT
    CHECK (priority_type IS NULL OR priority_type IN (
      'hard_constraint', 'soft_preference', 'recommendation'
    )),
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS tags_json JSONB,
  ADD COLUMN IF NOT EXISTS conflict_group_id TEXT
    REFERENCES doctrine_conflict_groups(id) ON DELETE SET NULL;

-- =============================================================================
-- LAYER 4: EXERCISE FAMILY METHOD ELIGIBILITY MATRIX
-- =============================================================================
-- An explicit per-exercise-family x per-method eligibility table. Builder
-- consults this BEFORE applying any method to any exercise. Replaces the
-- previous implicit assumption that any method could be applied to any row.
--
-- Key invariant the prompt names: "a drop set must not appear on an exercise
-- family unless doctrine says it is eligible." This table is that doctrine.
-- =============================================================================

CREATE TABLE IF NOT EXISTS exercise_family_method_eligibility (
  id TEXT PRIMARY KEY,

  -- Stable identifier for the exercise family (e.g. 'weighted_pull_up',
  -- 'front_lever_progression', 'pseudo_planche_pushup', 'pistol_squat').
  exercise_family_id TEXT NOT NULL,

  -- Movement pattern: 'vertical_pull', 'horizontal_pull', 'vertical_push',
  -- 'horizontal_push', 'squat', 'hinge', 'static_hold', 'compression',
  -- 'rotational'.
  movement_pattern TEXT NOT NULL,

  -- Primary adaptation this family develops: 'maximal_strength',
  -- 'hypertrophy', 'static_strength', 'dynamic_skill', 'endurance',
  -- 'mobility', 'compression_strength'.
  primary_adaptation TEXT NOT NULL,

  -- Secondary adaptations supported. JSONB array.
  secondary_adaptations_json JSONB,

  -- Skill specificity: 'general', 'skill_supportive',
  -- 'skill_specific_progression', 'skill_competition_form'.
  skill_specificity TEXT NOT NULL CHECK (skill_specificity IN (
    'general', 'skill_supportive', 'skill_specific_progression',
    'skill_competition_form'
  )),

  -- Loadability type: 'bodyweight_only', 'weighted_externally_addable',
  -- 'progression_chain', 'leverage_modulated', 'banded_assist_chain'.
  loadability_type TEXT NOT NULL CHECK (loadability_type IN (
    'bodyweight_only', 'weighted_externally_addable',
    'progression_chain', 'leverage_modulated', 'banded_assist_chain'
  )),

  -- Per-method compatibility. Each value is one of:
  --   'eligible'              — method works on this family
  --   'eligible_with_caveat'  — works only under the caveat in caveats_json
  --   'doctrine_blocked'      — explicitly forbidden by doctrine
  --   'unsupported'           — does not make biomechanical sense
  --   'unknown'               — not yet evaluated
  assistance_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    assistance_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  eccentric_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    eccentric_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  drop_set_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    drop_set_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  top_set_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    top_set_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  submax_single_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    submax_single_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  superset_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    superset_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  circuit_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    circuit_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  density_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    density_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  tempo_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    tempo_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  pause_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    pause_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  band_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    band_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  static_hold_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    static_hold_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  unilateral_compatibility TEXT NOT NULL DEFAULT 'unknown' CHECK (
    unilateral_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  regression_compatibility TEXT NOT NULL DEFAULT 'eligible' CHECK (
    regression_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),
  progression_compatibility TEXT NOT NULL DEFAULT 'eligible' CHECK (
    progression_compatibility IN (
      'eligible', 'eligible_with_caveat', 'doctrine_blocked',
      'unsupported', 'unknown'
    )
  ),

  -- Per-method caveats: when compatibility is 'eligible_with_caveat',
  -- this JSONB documents the constraint, e.g.
  -- {"drop_set": "only on weighted variants, never bodyweight max-rep"}
  caveats_json JSONB,

  -- Risk flags: free-form list of safety/overuse considerations.
  risk_flags_json JSONB,

  -- Common misuses observed in real programs. Used for builder warnings.
  common_misuses_json JSONB,

  -- Free-text explanation supporting the eligibility judgments.
  explanation_notes TEXT,

  -- Source provenance: which doctrine source supports this matrix row.
  source_id TEXT REFERENCES training_doctrine_sources(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A given exercise family can have at most one row per source (so two
  -- different sources can BOTH have eligibility opinions, resolved via
  -- the conflict-group system above).
  UNIQUE (exercise_family_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_efme_family
  ON exercise_family_method_eligibility (exercise_family_id);
CREATE INDEX IF NOT EXISTS idx_efme_pattern
  ON exercise_family_method_eligibility (movement_pattern);
CREATE INDEX IF NOT EXISTS idx_efme_loadability
  ON exercise_family_method_eligibility (loadability_type);

-- =============================================================================
-- LAYER 8: INGESTION STAGING TABLE
-- =============================================================================
-- Holds raw extracted PDF text awaiting structured normalization into atoms.
-- Decouples "PDF parsed into text" from "text turned into structured atoms"
-- so we can review extraction quality before atoms hit the live tables.
-- =============================================================================

CREATE TABLE IF NOT EXISTS doctrine_ingestion_staging (
  id TEXT PRIMARY KEY,

  -- Source this raw text came from.
  source_id TEXT NOT NULL REFERENCES training_doctrine_sources(id)
    ON DELETE CASCADE,

  -- Section identifier within the source (e.g. "Chapter 3 — Warmup",
  -- "Block 2 — Submaximal Singles", "FL Skill Cycle, Week 2").
  section_label TEXT NOT NULL,

  -- Raw extracted text. May be paragraph, table, or list form.
  raw_text TEXT NOT NULL,

  -- Page reference for auditability (e.g. "p.42-44" or "pp.12,17").
  page_reference TEXT,

  -- Extraction method used (e.g. 'manual_typed', 'pdf_text_layer',
  -- 'ocr_tesseract', 'llm_assisted_review').
  extraction_method TEXT,

  -- Provisional doctrine domain hint (refined when atoms are normalized).
  provisional_domain TEXT,

  -- Status of the staged section:
  --   'raw'                — just dumped, not yet reviewed
  --   'review_pending'     — awaiting human/LLM-assisted normalization
  --   'normalized'         — atoms have been emitted to live tables
  --   'rejected'           — content not usable as doctrine (kept for audit)
  status TEXT NOT NULL DEFAULT 'raw' CHECK (status IN (
    'raw', 'review_pending', 'normalized', 'rejected'
  )),

  -- IDs of the atoms emitted from this staging row (for traceability).
  -- JSONB array of strings naming the atom IDs across all atom tables.
  emitted_atom_ids_json JSONB,

  -- Free-text note from the normalization pass.
  normalization_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_source
  ON doctrine_ingestion_staging (source_id);
CREATE INDEX IF NOT EXISTS idx_staging_status
  ON doctrine_ingestion_staging (status);
CREATE INDEX IF NOT EXISTS idx_staging_domain
  ON doctrine_ingestion_staging (provisional_domain);

-- =============================================================================
-- COMPLETION MARKER
-- =============================================================================
-- Record this migration in the doctrine_rule_versions table so the version
-- registry tracks the architecture upgrade itself.
-- =============================================================================

INSERT INTO doctrine_rule_versions (
  id, source_id, version_label, changelog, is_live, activated_at, created_at
)
SELECT
  'dvers_v2_arch_upgrade_2026',
  'src_system_foundation_v1',
  'architecture_v2',
  'Schema v2: source registry richness (author, biases, scope/limits notes, '
  'ingestion status); doctrine_conflict_groups; per-atom applies_when, '
  'computation_friendly_rule, priority_type, evidence_snippet, tags, conflict '
  'link; base-vs-phase intelligence flags; phase_eligibility_json on '
  'prescriptions; exercise_family_method_eligibility matrix; '
  'doctrine_ingestion_staging table.',
  true, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM doctrine_rule_versions
  WHERE id = 'dvers_v2_arch_upgrade_2026'
)
AND EXISTS (
  SELECT 1 FROM training_doctrine_sources
  WHERE id = 'src_system_foundation_v1'
);

COMMIT;
