// =============================================================================
// DOCTRINE INGESTION CONTRACT — V2 ARCHITECTURE
// =============================================================================
//
// PURPOSE
// -------
// This is the SINGLE typed gate through which any new doctrine atom (rule)
// must pass before being written to the Neon doctrine tables. Its job is to
// enforce the user-stated non-negotiables from the V2 architecture brief:
//
//   * NO sourceless rules         — every atom must cite source_id
//   * NO generic blob rules       — every atom must declare a typed domain
//   * NO non-computable rules     — every atom must carry both
//                                   plain_language_rule (human) AND
//                                   computation_friendly_rule (structured)
//   * NO method nonsense          — methods must declare exercise_family
//                                   eligibility, never bare-named
//   * NO genericization           — atoms must declare appliesWhen +
//                                   doesNotApplyWhen + priorityType so they
//                                   can be ranked and conflict-resolved
//                                   instead of averaged
//   * NO base/phase confusion     — every atom declares whether it is
//                                   base-week intelligence or phase-week
//                                   modulation, so phase scaling can never
//                                   silently override base programming
//
// This contract is intentionally STRICT. If a candidate doctrine atom cannot
// fill in these fields with concrete, traceable values, it is not yet
// computable and must be rejected (or routed to the staging table for
// human review) rather than persisted as authoritative truth. That is the
// difference between "PDF imported" and "doctrine ingested."
//
// IMPORTANT — RELATIONSHIP TO EXISTING SYSTEMS
// --------------------------------------------
// We do NOT replace the existing doctrine query layer. The existing
// `lib/doctrine-query-service.ts` already merges DB-backed atoms with
// code-based registry fallbacks; that is intentional. This contract is the
// WRITE path. Reads continue through the existing query service. The
// query service will be extended with `queryDoctrineForAthleteContext()`
// in a sibling file so callers have a typed retrieval entry point that
// matches this typed write entry point.
//
// FUTURE BATCHES
// --------------
// When the next 5–8 PDFs are added, only two things change: (1) new rows
// in `training_doctrine_sources` (typed by the SourceRegistryEntry below),
// and (2) new atoms passed through `validateDoctrineAtomCandidate()`. The
// schema, the conflict-resolution machinery, and the eligibility matrix
// are stable.
// =============================================================================

// -----------------------------------------------------------------------------
// SECTION 1 — DOCTRINE DOMAINS
// -----------------------------------------------------------------------------
// Closed enum. Adding a domain is a deliberate, audited change. New PDFs
// CANNOT silently introduce a new domain — they must map their content to
// one of these or escalate for an explicit additive migration.
// -----------------------------------------------------------------------------

export const DOCTRINE_DOMAINS = [
  'athlete_prerequisites',
  'readiness_and_entry_criteria',
  'movement_pattern_logic',
  'skill_progression_logic',
  'weighted_strength_logic',
  'hypertrophy_logic',
  'technique_exposure_logic',
  'frequency_logic',
  'weekly_distribution_logic',
  'exercise_selection_logic',
  'exercise_substitution_logic',
  'progression_selection_logic',
  'assisted_variation_logic',
  'eccentric_logic',
  'top_set_logic',
  'single_logic',
  'drop_set_logic',
  'superset_logic',
  'circuit_logic',
  'density_logic',
  'hold_logic',
  'rep_range_logic',
  'set_count_logic',
  'rest_interval_logic',
  'deload_logic',
  'phase_progression_logic',
  'pain_modification_logic',
  'grip_logic',
  'warmup_logic',
  'accessory_logic',
  'recovery_protection_logic',
  'overuse_risk_logic',
  'skill_vs_hypertrophy_tradeoff_logic',
  'straight_arm_vs_bent_arm_logic',
  'vertical_vs_horizontal_pull_logic',
  'push_pull_balance_logic',
  'lower_body_integration_logic',
  'bodyweight_vs_external_load_logic',
] as const

export type DoctrineDomain = (typeof DOCTRINE_DOMAINS)[number]

// -----------------------------------------------------------------------------
// SECTION 2 — PRIORITY TYPE
// -----------------------------------------------------------------------------
// `priority_type` is the AUTHORITATIVE ranking lane. The retrieval layer uses
// it to decide what wins when two sources disagree, rather than blending.
//
//   hard_constraint   — must be respected (e.g. "do not perform weighted
//                       chest-to-bar with active shoulder pain"). Cannot be
//                       overridden by a softer atom from any source.
//   strong_preference — should be respected unless an even stronger
//                       source-specific rule overrides via a conflict group.
//   soft_preference   — informs ranking but does not block alternatives.
//   informational     — surfaced as evidence/explanation only; never
//                       drives a builder decision on its own.
// -----------------------------------------------------------------------------

export const DOCTRINE_PRIORITY_TYPES = [
  'hard_constraint',
  'strong_preference',
  'soft_preference',
  'informational',
] as const

export type DoctrinePriorityType = (typeof DOCTRINE_PRIORITY_TYPES)[number]

// -----------------------------------------------------------------------------
// SECTION 3 — INTELLIGENCE TIER (BASE vs PHASE)
// -----------------------------------------------------------------------------
// This is the single field that prevents weekly phase scaling from silently
// overriding base programming. Every atom declares which tier it operates at.
// The base-week composition layer reads `base_week_intelligence` atoms;
// the phase-scaling layer reads `phase_week_modulation` atoms; nothing
// about week-1/2/3/4 percentages can be authored as base intelligence
// (and vice versa). This is the architectural enforcement of the
// brief's "first store what a good day should fundamentally look like;
// then store how week 1/2/3/4 modify that base day."
// -----------------------------------------------------------------------------

export const DOCTRINE_INTELLIGENCE_TIERS = [
  'base_week_intelligence',
  'phase_week_modulation',
  'cross_cutting',
] as const

export type DoctrineIntelligenceTier = (typeof DOCTRINE_INTELLIGENCE_TIERS)[number]

// -----------------------------------------------------------------------------
// SECTION 4 — APPLIES-WHEN CONDITION SHAPE
// -----------------------------------------------------------------------------
// A typed JSON shape that the retrieval layer evaluates against a concrete
// AthleteContext. Every field is OPTIONAL — an absent field means "any."
// A present field must MATCH for the atom to fire. This is what makes
// retrieval deterministic instead of fuzzy.
// -----------------------------------------------------------------------------

export interface DoctrineAppliesWhen {
  /** Athlete training-age levels this atom applies to. Omit = any. */
  athleteLevels?: Array<'beginner' | 'intermediate' | 'advanced' | 'elite'>
  /** Goals this atom supports. Omit = any. */
  goals?: Array<
    | 'general_strength'
    | 'weighted_calisthenics_strength'
    | 'bodyweight_skill'
    | 'front_lever'
    | 'planche'
    | 'one_arm_pull_up'
    | 'muscle_up'
    | 'handstand_push_up'
    | 'hypertrophy'
    | 'tendon_resilience'
    | 'recovery'
    | 'general_conditioning'
  >
  /** Training phases this atom applies to. Omit = any. */
  phases?: Array<'acclimation' | 'build' | 'peak' | 'deload' | 'maintenance'>
  /** Day-role context (must match the role contract IDs). Omit = any. */
  dayRoles?: Array<
    | 'primary_strength_emphasis'
    | 'skill_quality_emphasis'
    | 'broad_mixed_volume'
    | 'secondary_support'
    | 'density_capacity'
    | 'recovery_supportive'
  >
  /** Movement patterns this atom is scoped to. Omit = any. */
  movementPatterns?: Array<
    | 'vertical_pull'
    | 'horizontal_pull'
    | 'vertical_push'
    | 'horizontal_push'
    | 'straight_arm_pull_iso'
    | 'straight_arm_push_iso'
    | 'compression_core'
    | 'lower_body_squat'
    | 'lower_body_hinge'
    | 'lower_body_unilateral'
    | 'tendon_support'
  >
  /** Exercise families this atom binds to (canonical IDs). Omit = any. */
  exerciseFamilies?: string[]
  /** Methods this atom binds to (when domain is method-related). Omit = any. */
  methods?: Array<
    | 'top_set_back_off'
    | 'cluster_set'
    | 'drop_set'
    | 'superset_antagonist'
    | 'superset_paired'
    | 'circuit_density_block'
    | 'eccentric_negative'
    | 'assisted_variation'
    | 'submax_single'
    | 'tempo_pause'
  >
  /** Equipment requirements/preferences. Omit = any. */
  equipment?: Array<'pull_up_bar' | 'rings' | 'dip_bars' | 'belt_for_load' | 'bands' | 'parallettes'>
  /** Schedule frequency (sessions per week). Omit = any. */
  sessionsPerWeek?: { min?: number; max?: number }
  /** Recovery state. Omit = any. */
  recoveryStates?: Array<'fresh' | 'normal' | 'fatigued' | 'recovering_from_injury'>
  /** Free-form tags for ad-hoc filters not yet promoted to typed fields. */
  tags?: string[]
}

// -----------------------------------------------------------------------------
// SECTION 5 — DOSAGE / REST / INTENSITY GUIDANCE SHAPES
// -----------------------------------------------------------------------------
// These are TYPED — never a free-text "do 3-5 sets of 5-8 reps maybe."
// The retrieval layer ranks and merges these deterministically.
// -----------------------------------------------------------------------------

export interface DoctrineDosageGuidance {
  setsMin?: number
  setsTarget?: number
  setsMax?: number
  /** For rep-based exercises. */
  repsMin?: number
  repsTarget?: number
  repsMax?: number
  /** For hold-based exercises (front lever, planche, L-sit, etc.). */
  holdSecondsMin?: number
  holdSecondsTarget?: number
  holdSecondsMax?: number
  /** RIR (reps-in-reserve) when source uses RIR-based regulation (e.g. King of Weighted). */
  rirMin?: number
  rirMax?: number
}

export interface DoctrineRestGuidance {
  restSecondsMin?: number
  restSecondsTarget?: number
  restSecondsMax?: number
  /** Source-tagged note explaining why this rest range matters here. */
  rationale?: string
}

export interface DoctrineIntensityGuidance {
  rpeMin?: number
  rpeTarget?: number
  rpeMax?: number
  /** Percentage of 1RM, where source uses %1RM (e.g. King of Weighted). */
  percent1RMMin?: number
  percent1RMTarget?: number
  percent1RMMax?: number
}

// -----------------------------------------------------------------------------
// SECTION 6 — DOCTRINE ATOM CANDIDATE
// -----------------------------------------------------------------------------
// The full typed shape an ingestion pipeline must produce per atom. This
// is the SINGLE write contract. Anything that cannot fill these fields
// is not computable and must not be persisted as doctrine.
// -----------------------------------------------------------------------------

export interface DoctrineAtomCandidate {
  /** Stable canonical ID. Required so re-ingestion is idempotent. */
  doctrineAtomId: string
  /** REQUIRED — every atom must cite its source. No sourceless rules. */
  sourceId: string
  /** Closed-enum domain. */
  doctrineDomain: DoctrineDomain
  /** Sub-categorization within the domain (free-form, but encouraged-canonical). */
  doctrineCategory: string
  /** Short title for human admin views. */
  title: string
  /** REQUIRED — human-readable rule, kept as evidence. */
  plainLanguageRule: string
  /** REQUIRED — structured form the builder can act on. */
  computationFriendlyRule: Record<string, unknown>
  /** REQUIRED — when this rule applies. */
  appliesWhen: DoctrineAppliesWhen
  /** OPTIONAL — explicit exclusions so the rule doesn't bleed into wrong contexts. */
  doesNotApplyWhen?: DoctrineAppliesWhen
  /** REQUIRED — ranking lane. */
  priorityType: DoctrinePriorityType
  /** REQUIRED — base vs phase. Prevents phase scaling from overriding base. */
  intelligenceTier: DoctrineIntelligenceTier
  /** Source-default-overridable confidence weight in [0,1]. */
  confidenceWeight?: number
  /** Conflict group ID if this atom participates in a known conflict. */
  conflictGroupId?: string

  /** Athlete prerequisites (e.g. "10 strict pull-ups before weighted bracket"). */
  athletePrerequisites?: Record<string, unknown>
  /** Movement families this atom binds to. */
  movementFamilies?: string[]
  /** Skill targets (e.g. front_lever, planche). */
  skillTargets?: string[]
  /** Goals supported. Mirror of appliesWhen.goals; kept separate for index speed. */
  goalsSupported?: string[]
  /** Phase eligibility. Mirror of appliesWhen.phases. */
  phaseEligibility?: string[]
  /** Fatigue eligibility (e.g. "fresh-only", "any"). */
  fatigueEligibility?: Array<'fresh' | 'normal' | 'fatigued' | 'recovering_from_injury'>
  /** Equipment requirements. */
  equipmentRequirements?: string[]
  /** Recovery requirements (e.g. "≥48h since previous heavy pull"). */
  recoveryRequirements?: Record<string, unknown>
  /** Hard contraindications that BLOCK regardless of other matches. */
  contraindications?: string[]

  /** Exercise-family eligibility (positive list). */
  exerciseEligibility?: string[]
  /** Progression-family eligibility. */
  progressionEligibility?: string[]
  /** Method eligibility (positive list). */
  methodEligibility?: string[]

  /** Typed dosage / rest / intensity guidance. */
  dosageGuidance?: DoctrineDosageGuidance
  restGuidance?: DoctrineRestGuidance
  intensityGuidance?: DoctrineIntensityGuidance

  /** Progression / regression direction notes. */
  progressionDirection?: string
  regressionDirection?: string
  /** Replacement logic (e.g. "if shoulder pain on C2B, substitute strict pull-up"). */
  replacementLogic?: string
  /** Notes used by the conflict-resolution layer when this atom collides. */
  conflictResolutionNotes?: string
  /** Verbatim or near-verbatim snippet from the source as evidence. */
  evidenceSnippet?: string
  /** Free-form tags for indexing. */
  tags?: string[]
}

// -----------------------------------------------------------------------------
// SECTION 7 — VALIDATOR
// -----------------------------------------------------------------------------
// Strict validation. Returns errors, never throws — callers can route
// invalid candidates to `doctrine_ingestion_staging` (human review) instead
// of dropping them silently.
// -----------------------------------------------------------------------------

export interface DoctrineAtomValidationError {
  field: string
  reason: string
}

export interface DoctrineAtomValidationResult {
  ok: boolean
  errors: DoctrineAtomValidationError[]
}

const DOCTRINE_DOMAIN_SET: ReadonlySet<string> = new Set(DOCTRINE_DOMAINS)
const DOCTRINE_PRIORITY_SET: ReadonlySet<string> = new Set(DOCTRINE_PRIORITY_TYPES)
const DOCTRINE_TIER_SET: ReadonlySet<string> = new Set(DOCTRINE_INTELLIGENCE_TIERS)

/**
 * Reject candidates that fall into the four named genericization traps:
 *   1. Sourceless rules
 *   2. Untyped (free-text-only) rules
 *   3. Method rules with no exercise eligibility
 *   4. Atoms that cannot answer "when does this apply?"
 *
 * Returns a structured error list. Callers decide whether to (a) drop,
 * (b) route to staging for human review, or (c) re-emit corrected.
 */
export function validateDoctrineAtomCandidate(
  candidate: Partial<DoctrineAtomCandidate>,
): DoctrineAtomValidationResult {
  const errors: DoctrineAtomValidationError[] = []

  // [NO SOURCELESS RULES]
  if (!candidate.sourceId || candidate.sourceId.trim().length === 0) {
    errors.push({ field: 'sourceId', reason: 'Every doctrine atom must cite a source. Sourceless rules are not allowed.' })
  }

  // [NO UNTYPED RULES] — domain must be from the closed enum
  if (!candidate.doctrineDomain) {
    errors.push({ field: 'doctrineDomain', reason: 'doctrineDomain is required.' })
  } else if (!DOCTRINE_DOMAIN_SET.has(candidate.doctrineDomain)) {
    errors.push({
      field: 'doctrineDomain',
      reason: `doctrineDomain "${candidate.doctrineDomain}" is not in the canonical enum. Map to an existing domain or escalate for a typed migration.`,
    })
  }

  // [NO PROSE-ONLY RULES] — both human and computable forms required
  if (!candidate.plainLanguageRule || candidate.plainLanguageRule.trim().length === 0) {
    errors.push({ field: 'plainLanguageRule', reason: 'plainLanguageRule (human form) is required.' })
  }
  if (!candidate.computationFriendlyRule || Object.keys(candidate.computationFriendlyRule).length === 0) {
    errors.push({
      field: 'computationFriendlyRule',
      reason: 'computationFriendlyRule (structured form) is required and cannot be empty. Free-text-only rules are not computable.',
    })
  }

  // [PRIORITY TIERING REQUIRED]
  if (!candidate.priorityType) {
    errors.push({ field: 'priorityType', reason: 'priorityType is required for ranking and conflict resolution.' })
  } else if (!DOCTRINE_PRIORITY_SET.has(candidate.priorityType)) {
    errors.push({
      field: 'priorityType',
      reason: `priorityType "${candidate.priorityType}" is not valid. Use hard_constraint | strong_preference | soft_preference | informational.`,
    })
  }

  // [BASE vs PHASE — REQUIRED]
  if (!candidate.intelligenceTier) {
    errors.push({
      field: 'intelligenceTier',
      reason: 'intelligenceTier is required. Atoms must declare whether they are base-week intelligence or phase-week modulation.',
    })
  } else if (!DOCTRINE_TIER_SET.has(candidate.intelligenceTier)) {
    errors.push({
      field: 'intelligenceTier',
      reason: `intelligenceTier "${candidate.intelligenceTier}" is not valid. Use base_week_intelligence | phase_week_modulation | cross_cutting.`,
    })
  }

  // [APPLIES-WHEN REQUIRED] — atoms that cannot answer "when do I fire?" are
  // genericization risks because they get matched to too many contexts.
  if (!candidate.appliesWhen || Object.keys(candidate.appliesWhen).length === 0) {
    errors.push({
      field: 'appliesWhen',
      reason: 'appliesWhen must declare at least one matching dimension (level, goal, phase, dayRole, movement, exercise family, method, equipment, etc.). Atoms with no scope cannot be retrieved deterministically.',
    })
  }

  // [METHOD ATOMS MUST DECLARE EXERCISE ELIGIBILITY]
  // This is the brief's explicit "drop set must not appear on a wrong family" rule.
  const methodDomains: Set<string> = new Set([
    'top_set_logic',
    'single_logic',
    'drop_set_logic',
    'superset_logic',
    'circuit_logic',
    'density_logic',
    'eccentric_logic',
    'assisted_variation_logic',
  ])
  if (candidate.doctrineDomain && methodDomains.has(candidate.doctrineDomain)) {
    const hasExerciseScope =
      (candidate.exerciseEligibility && candidate.exerciseEligibility.length > 0) ||
      (candidate.appliesWhen?.exerciseFamilies && candidate.appliesWhen.exerciseFamilies.length > 0)
    if (!hasExerciseScope) {
      errors.push({
        field: 'exerciseEligibility',
        reason: `Method-domain atom (${candidate.doctrineDomain}) must declare exercise-family eligibility. A method without an exercise family is genericization.`,
      })
    }
  }

  // [HARD CONSTRAINT ATOMS MUST CARRY EVIDENCE]
  // A hard constraint that cannot be cited cannot be defended in conflicts.
  if (candidate.priorityType === 'hard_constraint') {
    if (!candidate.evidenceSnippet || candidate.evidenceSnippet.trim().length < 20) {
      errors.push({
        field: 'evidenceSnippet',
        reason: 'hard_constraint atoms must include an evidenceSnippet (≥20 chars) so the rule is defensible against softer atoms in conflict resolution.',
      })
    }
  }

  // [CONFIDENCE WEIGHT IN RANGE]
  if (typeof candidate.confidenceWeight === 'number') {
    if (candidate.confidenceWeight < 0 || candidate.confidenceWeight > 1) {
      errors.push({ field: 'confidenceWeight', reason: 'confidenceWeight must be in [0, 1].' })
    }
  }

  return { ok: errors.length === 0, errors }
}

// -----------------------------------------------------------------------------
// SECTION 8 — SOURCE REGISTRY ENTRY (for future batches)
// -----------------------------------------------------------------------------
// Typed shape for adding a new source. Mirrors the Neon
// `training_doctrine_sources` schema (post-migration 015). Future batch
// ingestion must produce one of these per PDF before any atoms are accepted.
// -----------------------------------------------------------------------------

export interface SourceRegistryEntry {
  sourceId: string
  /** Canonical type tag (e.g. 'weighted_calisthenics_program'). */
  sourceType: string
  /** Human title (book/PDF name). */
  title: string
  /** REQUIRED for V2 — author/coach attribution. */
  author?: string
  description: string
  /** Domain this source has the most authority over. */
  primaryDomain: DoctrineDomain | null
  /** Other domains this source touches. */
  secondaryDomains?: DoctrineDomain[]
  /** Style descriptors (e.g. ['weighted', 'foundational', 'failure-tolerant']). */
  styleTags?: string[]
  /** Athlete levels this source is most authoritative for. */
  athleteLevelBias?: Array<'beginner' | 'intermediate' | 'advanced' | 'elite'>
  /** Skills this source is most authoritative for. */
  skillBias?: string[]
  /** Equipment this source assumes / specializes in. */
  equipmentBias?: string[]
  /** Program-type bias (e.g. 'full_body', 'upper_lower', 'ppl', 'specialization'). */
  programTypeBias?: string[]
  /** Methods this source uses authoritatively. */
  methodBias?: string[]
  /** Confidence weight default in [0, 1]. */
  confidenceWeightDefault: number
  /** Scope notes — what this source is authoritative for. */
  scopeNotes?: string
  /** Limit notes — what this source explicitly is NOT authoritative for. */
  limitNotes?: string
  version: string
  /**
   * GATE — sources start at 'awaiting_extraction' and ONLY become 'ingested'
   * after at least one validated atom has been written. Until then,
   * is_active = false and the retrieval layer must not surface them.
   */
  ingestionStatus:
    | 'awaiting_extraction'
    | 'in_review'
    | 'partial'
    | 'ingested'
    | 'archived'
}
