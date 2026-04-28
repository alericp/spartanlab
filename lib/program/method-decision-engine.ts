// =============================================================================
// [DOCTRINE-TO-BUILDER PHASE 3] METHOD DECISION ENGINE — single authoritative
// doctrine-attributable method decision per session.
//
// PURPOSE
// SpartanLab already has rich method MATERIALIZATION (lib/training-methods.ts,
// lib/doctrine/method-profile-registry.ts, AdaptiveSession.styleMetadata.*,
// methodMaterializationSummary, compositionMetadata.methodEligibility, the
// Batch 10 METHOD_COMPATIBILITY_MATRIX, and existing builder selection in
// adaptive-program-builder.ts). What it has NOT had is a single layer that
// answers, for THIS specific generated session:
//
//   "Which method did doctrine select, which methods did doctrine reject for
//    this exercise category, and what is the source-attributable rationale?"
//
// This module is that layer. It is a PURE READER:
//   - it does not re-decide methods,
//   - it does not change exercises / sets / reps / rest,
//   - it does not write to the doctrine DB,
//   - it does not touch live workout.
// It produces a compact MethodDecision object stamped onto session.methodDecision
// by the authoritative wrapper after Phase 2's doctrineIntegration proof.
//
// SOURCES OF TRUTH (read-only, in order of priority)
//   1. session.styleMetadata.methodMaterializationSummary  (what materialized)
//   2. session.styleMetadata.appliedMethods + rejectedMethods
//   3. session.styleMetadata.primaryStyle / structureDescription
//   4. session.compositionMetadata.spineSessionType + methodEligibility
//   5. session.exercises[*].category + .name (for category classification)
//   6. program.doctrineRuntimeContract.methodDoctrine
//      (preferredMethods / blockedMethods / methodReasons)
//   7. Batch 10 METHOD_COMPATIBILITY_MATRIX
//      (per (method, exerciseCategory) preferred/allowed/caution/avoid/forbidden)
//   8. DoctrineBuilderDecisionContext (Phase 2 — sourceMode, batches, flags)
//
// OUTPUT
//   A single MethodDecision per session — the canonical, doctrine-attributable
//   decision. Renders compact rationale on the program card. Survives save/load
//   via whole-object JSON serialization.
//
// ZERO-BREAKAGE
//   - All AdaptiveSession field reads are .? optional and fall back safely.
//   - Returns null when doctrine context is unavailable AND materialization
//     has nothing useful to attribute (legacy sessions render as before).
//   - Does NOT mutate the input session; returns a new MethodDecision object.
// =============================================================================

import type {
  ExerciseCategoryKey,
  MethodCompatibilityLevel,
  MethodKey,
} from '@/lib/doctrine/source-batches/batch-10-training-method-decision-governor-doctrine'
import { METHOD_COMPATIBILITY_MATRIX } from '@/lib/doctrine/source-batches/batch-10-training-method-decision-governor-doctrine'
import type { DoctrineBuilderDecisionContext } from '@/lib/doctrine/doctrine-builder-integration-contract'
import type { DoctrineRuntimeContract } from '@/lib/doctrine-runtime-contract'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type MethodDecisionMethodId =
  | 'straight_sets'
  | 'skill_practice'
  | 'top_set_backoff'
  | 'backoff_sets'
  | 'drop_set'
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'endurance_density'
  | 'accessory_pairing'
  | 'rejected_method_only'

export type MethodDecisionStatus =
  | 'selected'
  | 'rejected'
  | 'not_applicable'
  | 'degraded'

export type MethodDecisionConfidence = 'high' | 'medium' | 'low'

export type MethodDecisionContextStatus = 'active' | 'degraded' | 'unavailable'

export interface MethodDecisionSource {
  doctrineContextStatus: MethodDecisionContextStatus
  doctrineBatchIds: string[]
  doctrineRuleIds: string[]
  fallbackUsed: boolean
}

export interface MethodDecisionAppliesTo {
  sessionId?: string
  exerciseId?: string
  exerciseName?: string
  movementPattern?: string
  trainingGoal?: string
  skill?: string
  exerciseCategory?: ExerciseCategoryKey
}

export interface MethodDecisionPrescriptionIntent {
  whyThisMethod: string[]
  whyNotOtherMethods: string[]
  contraindications: string[]
  fatigueNotes: string[]
  timeEfficiencyNotes: string[]
}

// ============================================================================
// [PHASE 3C] PROFILE-AWARE DECISION CONTEXT
// Canonical onboarding/profile truth that the engine reads ALONGSIDE the
// session's already-materialized signals. This is the missing wire that
// Phase 3 / 3B did not have — the engine was attributing methods using only
// session shape + Batch 10 matrix + runtime methodDoctrine, with NO knowledge
// of the user's actual selectedSkills, equipment, joint cautions, schedule,
// session-style preference, etc. Phase 3C extracts this context (preferring
// program.profileSnapshot when available, with a typed fallback shape) and
// surfaces a `profileInfluence` block on every MethodDecision so the visible
// rationale on the Program card can honestly cite which profile fields
// drove or constrained the decision.
//
// SOURCE PRIORITY (set by the caller, recorded on profileInfluence.source):
//   1. 'program.profileSnapshot'  — frozen at generation time (preferred)
//   2. 'canonicalProfile'         — if no snapshot is on the program
//   3. 'generationInputs'         — composed input bundle
//   4. 'legacyFallback'           — only the trainingGoal string is known
// ============================================================================

export type MethodDecisionProfileSource =
  | 'program.profileSnapshot'
  | 'canonicalProfile'
  | 'generationInputs'
  | 'legacyFallback'

export interface MethodDecisionProfileContext {
  source: MethodDecisionProfileSource
  primaryGoal?: string | null
  secondaryGoal?: string | null
  experienceLevel?: string | null
  selectedSkills?: string[] | null
  primarySkill?: string | null
  trainingDaysPerWeek?: number | null
  scheduleMode?: string | null
  sessionLengthMinutes?: number | null
  sessionDurationMode?: string | null
  sessionStylePreference?: string | null
  selectedTrainingStyles?: string[] | null
  equipmentAvailable?: string[] | null
  jointCautions?: string[] | null
  flexibilitySelections?: string[] | null
  trainingPathType?: string | null
  /** Optional skill progression markers from the snapshot (front lever / planche / hspu). */
  skillProgressions?: {
    frontLever?: string | null
    planche?: string | null
    hspu?: string | null
  } | null
}

export interface MethodDecisionProfileInfluence {
  /** Where the profile context came from. */
  source: MethodDecisionProfileSource
  /** Subset of selectedSkills the engine actually USED in attribution. */
  selectedSkillsUsed: string[]
  primarySkillUsed?: string | null
  trainingGoalUsed?: string | null
  stylePreferenceUsed?: string | null
  equipmentUsed?: string[]
  jointCautionsUsed?: string[]
  flexibilityUsed?: string[]
  scheduleUsed?: {
    mode?: string | null
    daysPerWeek?: number | null
    sessionDuration?: number | null
  }
  /** One-line plain-English driver shown on the visible card. */
  primaryDriverLine: string
  /** Additional human reasons the profile field set steered selection / rejection. */
  influenceReasons: string[]
}

export interface MethodDecision {
  methodId: MethodDecisionMethodId
  status: MethodDecisionStatus
  confidence: MethodDecisionConfidence
  source: MethodDecisionSource
  appliesTo: MethodDecisionAppliesTo
  prescriptionIntent: MethodDecisionPrescriptionIntent
  /** [PHASE 3C] Profile-truth influence on this decision. Always present. */
  profileInfluence: MethodDecisionProfileInfluence
  /**
   * [PHASE 4A] Authoritative read-only verdict of what ACTUALLY MATERIALIZED on
   * this session — derived from `session.styleMetadata.methodMaterializationSummary`
   * (the builder-locked single source of truth) when present, otherwise
   * computed from the same raw fields the builder used. This is the field the
   * Program card MUST gate the visible "Doctrine Decision" panel on, so the
   * panel never claims doctrine on sessions whose structure is purely flat
   * straight sets (the fake-proof failure mode of pre-4A Phase 3C). Always
   * present; check `hasRealStructuralChange` before presenting.
   */
  actualMaterialization: MethodDecisionActualMaterialization
  renderLabel: string
  renderSummary: string
  /** Stable machine-readable code for tests / analytics. */
  debugCode: string
}

/**
 * [PHASE 4A] Concrete, citable evidence of what actually materialized on the
 * session. Every field is a count/list of fields that ALREADY exist on the
 * session (styledGroups, blockId, setExecutionMethod, clusterDecision). No
 * field is invented. The card uses these counts to render honest sentences
 * like "Density Block applied · 3 accessories grouped" — never abstract
 * "doctrine" claims.
 */
export interface MethodDecisionActualMaterialization {
  /**
   * True iff the session has at least one renderable grouped block OR a
   * row-level set-execution method (cluster / top_set / drop_set / rest_pause).
   * False for genuinely flat straight-set sessions — in which case the card
   * MUST hide the doctrine panel rather than claim doctrine fired.
   */
  hasRealStructuralChange: boolean
  /** Single authoritative render mode the user actually sees. */
  dominantRenderMode: 'grouped' | 'flat_with_method_cues' | 'flat'
  /** Count of renderable grouped blocks (superset + circuit + density_block). */
  groupedBlockCount: number
  /** Per-method renderable grouped block counts. */
  groupedMethodCounts: {
    superset: number
    circuit: number
    density_block: number
  }
  /** Per-method row-level set-execution counts (rows OUTSIDE renderable groups). */
  rowExecutionCounts: {
    cluster: number
    top_set: number
    drop_set: number
    rest_pause: number
  }
  /** Total number of exercises that participate in any non-straight materialization. */
  changedExerciseCount: number
  /**
   * Compact, plain-English description of WHAT structurally changed — read by
   * the card. Empty array when `hasRealStructuralChange === false`.
   * Examples:
   *   "Density Block applied — 3 accessory exercises grouped"
   *   "Top set + Back-off applied to Weighted Pull-Up"
   *   "Cluster set applied to Front Lever Tuck"
   */
  structuralChangeDescriptions: string[]
  /** Where the materialization summary came from. */
  evidenceSource:
    | 'builder_session_summary'   // session.styleMetadata.methodMaterializationSummary
    | 'derived_from_session'      // computed on read from styledGroups + exercises
    | 'unavailable'               // session has no usable signals
}

/**
 * [PHASE 3C] Stable version marker stamped onto program.doctrineIntegration
 * so the UI can detect saved programs that predate profile-aware stamping
 * and surface a "regenerate to apply" diagnostic without claiming false
 * progress. Bumping this string forces a fresh stamp on regenerate.
 */
export const METHOD_DECISION_VERSION = 'phase_3c.profile_aware.v1'

// =============================================================================
// MINIMAL INPUT SHAPES — keeps this engine decoupled from the full
// AdaptiveSession type graph so it can be reused / tested in isolation.
// =============================================================================

export interface MethodDecisionExerciseInput {
  id?: string | null
  name?: string | null
  category?: string | null
  isPrimary?: boolean | null
  movementPattern?: string | null
}

export interface MethodDecisionSessionInput {
  dayNumber?: number | null
  dayLabel?: string | null
  focus?: string | null
  isPrimary?: boolean | null
  exercises?: MethodDecisionExerciseInput[] | null
  /** session.styleMetadata.* (selected fields) */
  styleMetadata?: {
    primaryStyle?: string | null
    appliedMethods?: readonly string[] | null
    rejectedMethods?: ReadonlyArray<{ method: string; reason: string }> | null
    structureDescription?: string | null
    methodMaterializationSummary?: {
      dominantRenderMode?: string | null
      groupedMethodCounts?: {
        superset?: number
        circuit?: number
        density_block?: number
        cluster?: number
      } | null
      rowExecutionCounts?: {
        top_set?: number
        drop_set?: number
        rest_pause?: number
        cluster?: number
        superset?: number
        circuit?: number
        density?: number
      } | null
      primaryPackagingOutcome?: string | null
    } | null
  } | null
  /** session.compositionMetadata.* (selected fields) */
  compositionMetadata?: {
    spineSessionType?: string | null
    methodEligibility?: {
      supersets?: string
      circuits?: string
      density?: string
      finisher?: string
    } | null
  } | null
  skillExpressionMetadata?: {
    sessionPurpose?: string | null
    directlyExpressedSkills?: readonly string[] | null
  } | null
}

// =============================================================================
// EXERCISE CATEGORY CLASSIFICATION
// Maps the session's primary exercise(s) onto a Batch 10 ExerciseCategoryKey.
// This is INTENTIONALLY conservative — when uncertain, we degrade rather than
// invent a category claim.
// =============================================================================

const HIGH_SKILL_TOKENS = [
  'planche',
  'front lever',
  'back lever',
  'iron cross',
  'maltese',
  'victorian',
  'one arm',
  'one-arm',
  'handstand push',
  'hspu',
  'press handstand',
]

const HEAVY_WEIGHTED_TOKENS = [
  'weighted pull',
  'weighted dip',
  'weighted chin',
  'weighted muscle',
  'barbell',
  'deadlift',
  'bench press',
  'overhead press',
  'squat',
  'front squat',
  'back squat',
]

const LOWER_BODY_TOKENS = [
  'squat',
  'lunge',
  'deadlift',
  'split squat',
  'bulgarian',
  'rdl',
  'glute',
  'hamstring',
  'calf',
  'sled',
  'step up',
]

const FLEX_MOBILITY_TOKENS = [
  'split',
  'pancake',
  'pike',
  'bridge',
  'middle split',
  'front split',
  'side split',
  'shoulder dislocate',
  'hip flexor',
  'wrist prep',
]

const CORE_COMPRESSION_TOKENS = [
  'l-sit',
  'l sit',
  'v-sit',
  'compression',
  'hollow',
  'tuck',
  'manna',
  'leg raise',
  'dragon flag',
]

const MILITARY_TEST_TOKENS = [
  'pft',
  'pst',
  'acft',
  'crossfit',
  'pull-ups for time',
  'push-ups for time',
  'burpee',
  'ruck',
  'run mile',
  '2-mile',
  'sit-up test',
]

const PREHAB_TOKENS = [
  'prehab',
  'scapula',
  'rotator cuff',
  'wrist conditioning',
  'elbow conditioning',
  'tendon prep',
  'banded',
]

function lower(s: string | null | undefined): string {
  return (s ?? '').toString().toLowerCase()
}

function tokenMatch(text: string, tokens: string[]): boolean {
  if (!text) return false
  for (const t of tokens) {
    if (text.includes(t)) return true
  }
  return false
}

/**
 * Pick the dominant Batch 10 exercise category for the session's primary work.
 * Looks at the FIRST primary exercise (or first non-warmup exercise) and falls
 * back to focus/spine signals. Returns null when the session is too ambiguous
 * to attribute (e.g. mixed accessory grab-bag with no anchor).
 */
export function classifyDominantExerciseCategory(
  session: MethodDecisionSessionInput,
): { category: ExerciseCategoryKey | null; anchorName: string | null } {
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  // Anchor: first explicit primary, else first exercise with a useful name.
  let anchor: MethodDecisionExerciseInput | null = null
  for (const ex of exercises) {
    if (ex?.isPrimary && ex?.name) {
      anchor = ex
      break
    }
  }
  if (!anchor) {
    for (const ex of exercises) {
      if (ex?.name && lower(ex.category) !== 'warmup' && lower(ex.category) !== 'cooldown') {
        anchor = ex
        break
      }
    }
  }

  const anchorName = anchor?.name ?? null
  const text = [
    lower(anchor?.name),
    lower(anchor?.category),
    lower(anchor?.movementPattern),
    lower(session.focus),
  ].join(' ')

  if (tokenMatch(text, HIGH_SKILL_TOKENS)) {
    return { category: 'high_skill_isometrics', anchorName }
  }
  if (tokenMatch(text, HEAVY_WEIGHTED_TOKENS)) {
    // Lower-body weighted basics get their own category in Batch 10.
    if (tokenMatch(text, LOWER_BODY_TOKENS)) {
      return { category: 'lower_body_strength_hypertrophy', anchorName }
    }
    return { category: 'heavy_weighted_basics', anchorName }
  }
  if (tokenMatch(text, LOWER_BODY_TOKENS)) {
    return { category: 'lower_body_strength_hypertrophy', anchorName }
  }
  if (tokenMatch(text, MILITARY_TEST_TOKENS)) {
    return { category: 'military_test_calisthenics', anchorName }
  }
  if (tokenMatch(text, FLEX_MOBILITY_TOKENS)) {
    return { category: 'flexibility_mobility', anchorName }
  }
  if (tokenMatch(text, CORE_COMPRESSION_TOKENS)) {
    return { category: 'core_compression', anchorName }
  }
  if (tokenMatch(text, PREHAB_TOKENS)) {
    return { category: 'prehab_joint_integrity', anchorName }
  }

  // Fallback to spineSessionType when present.
  const spine = lower(session.compositionMetadata?.spineSessionType)
  if (spine === 'technical_focus') return { category: 'high_skill_isometrics', anchorName }
  if (spine === 'direct_intensity') return { category: 'heavy_weighted_basics', anchorName }
  if (spine === 'strength_support') return { category: 'stable_hypertrophy_accessories', anchorName }

  // Last fallback: stable_hypertrophy_accessories is the broadest neutral bin.
  if (anchorName) return { category: 'stable_hypertrophy_accessories', anchorName }
  return { category: null, anchorName: null }
}

// =============================================================================
// MATERIALIZED METHOD DERIVATION
// What did the builder ACTUALLY choose for this session? We trust the existing
// materialization summary first, fall back to appliedMethods, then to
// primaryStyle, then to a conservative "straight_sets" default.
// =============================================================================

function deriveMaterializedMethod(
  session: MethodDecisionSessionInput,
  category: ExerciseCategoryKey | null,
): { methodId: MethodDecisionMethodId; debugCode: string } {
  const sm = session.styleMetadata ?? null
  const summary = sm?.methodMaterializationSummary ?? null

  // Priority 1: methodMaterializationSummary.primaryPackagingOutcome
  const primary = lower(summary?.primaryPackagingOutcome)
  if (primary === 'superset') return { methodId: 'superset', debugCode: 'mat_summary_superset' }
  if (primary === 'circuit') return { methodId: 'circuit', debugCode: 'mat_summary_circuit' }
  if (primary === 'density_block') return { methodId: 'density_block', debugCode: 'mat_summary_density' }
  if (primary === 'method_only_top_set') return { methodId: 'top_set_backoff', debugCode: 'mat_summary_top_set' }
  if (primary === 'method_only_drop_set') return { methodId: 'drop_set', debugCode: 'mat_summary_drop_set' }
  if (primary === 'method_only_cluster') return { methodId: 'straight_sets', debugCode: 'mat_summary_cluster_as_straight' }

  // Priority 2: row-level execution counts (top_set / drop_set / etc.)
  const rec = summary?.rowExecutionCounts ?? null
  if (rec) {
    if ((rec.top_set ?? 0) > 0) return { methodId: 'top_set_backoff', debugCode: 'mat_row_top_set' }
    if ((rec.drop_set ?? 0) > 0) return { methodId: 'drop_set', debugCode: 'mat_row_drop_set' }
  }

  // Priority 3: appliedMethods[0]
  const applied = (sm?.appliedMethods ?? []) as readonly string[]
  if (applied.length > 0) {
    const first = lower(applied[0])
    if (first === 'superset') return { methodId: 'superset', debugCode: 'mat_applied_superset' }
    if (first === 'circuit') return { methodId: 'circuit', debugCode: 'mat_applied_circuit' }
    if (first === 'density' || first === 'density_block')
      return { methodId: 'density_block', debugCode: 'mat_applied_density' }
  }

  // Priority 4: primaryStyle
  const style = lower(sm?.primaryStyle)
  if (style.includes('density')) return { methodId: 'density_block', debugCode: 'style_density' }
  if (style.includes('superset')) return { methodId: 'superset', debugCode: 'style_superset' }
  if (style.includes('circuit')) return { methodId: 'circuit', debugCode: 'style_circuit' }

  // Priority 5: category-anchored conservative defaults
  if (category === 'high_skill_isometrics') {
    return { methodId: 'skill_practice', debugCode: 'category_default_skill_practice' }
  }
  if (category === 'heavy_weighted_basics') {
    return { methodId: 'top_set_backoff', debugCode: 'category_default_top_set_backoff' }
  }
  if (category === 'military_test_calisthenics') {
    return { methodId: 'density_block', debugCode: 'category_default_density' }
  }
  if (category === 'flexibility_mobility' || category === 'prehab_joint_integrity') {
    return { methodId: 'straight_sets', debugCode: 'category_default_straight_low_fatigue' }
  }
  return { methodId: 'straight_sets', debugCode: 'fallback_straight_sets' }
}

// =============================================================================
// BATCH 10 COMPATIBILITY LOOKUP
// =============================================================================

const METHOD_ID_TO_BATCH10_KEYS: Record<MethodDecisionMethodId, MethodKey[]> = {
  straight_sets: ['straight_set'],
  skill_practice: ['straight_set', 'skill_plus_low_cost_support'],
  top_set_backoff: ['top_set', 'back_off_set'],
  backoff_sets: ['back_off_set'],
  drop_set: ['drop_set', 'mechanical_drop_set'],
  superset: ['superset_antagonist', 'superset_same_muscle'],
  circuit: ['circuit'],
  density_block: ['density_block', 'amrap_density'],
  endurance_density: ['repeat_effort_endurance', 'emom_finisher'],
  accessory_pairing: ['superset_antagonist', 'skill_plus_low_cost_support'],
  rejected_method_only: ['straight_set'],
}

const COMPAT_RANK: Record<MethodCompatibilityLevel, number> = {
  preferred: 4,
  allowed: 3,
  caution: 2,
  avoid: 1,
  forbidden: 0,
}

interface CompatLookup {
  level: MethodCompatibilityLevel
  rationale: string
  visibleEvidence: string
}

function lookupCompatibility(
  methodKey: MethodKey,
  category: ExerciseCategoryKey,
): CompatLookup | null {
  for (const e of METHOD_COMPATIBILITY_MATRIX) {
    if (e.method === methodKey && e.category === category) {
      return { level: e.level, rationale: e.rationale, visibleEvidence: e.visibleEvidence }
    }
  }
  return null
}

function bestCompatibilityForDecisionMethod(
  methodId: MethodDecisionMethodId,
  category: ExerciseCategoryKey,
): { best: CompatLookup | null; viaMethodKey: MethodKey | null } {
  const keys = METHOD_ID_TO_BATCH10_KEYS[methodId] ?? []
  let best: CompatLookup | null = null
  let viaKey: MethodKey | null = null
  for (const k of keys) {
    const c = lookupCompatibility(k, category)
    if (!c) continue
    if (!best || COMPAT_RANK[c.level] > COMPAT_RANK[best.level]) {
      best = c
      viaKey = k
    }
  }
  return { best, viaMethodKey: viaKey }
}

// =============================================================================
// REJECTED METHOD COLLECTION
// =============================================================================

const REJECTABLE_DECISION_METHODS: MethodDecisionMethodId[] = [
  'drop_set',
  'superset',
  'circuit',
  'density_block',
  'top_set_backoff',
]

const DECISION_METHOD_HUMAN_LABEL: Record<MethodDecisionMethodId, string> = {
  straight_sets: 'Straight Sets',
  skill_practice: 'Straight Skill Practice',
  top_set_backoff: 'Top Set + Back-Off',
  backoff_sets: 'Back-Off Sets',
  drop_set: 'Drop Set',
  superset: 'Accessory Superset',
  circuit: 'Circuit Conditioning',
  density_block: 'Density Block',
  endurance_density: 'Endurance Density',
  accessory_pairing: 'Accessory Pairing',
  rejected_method_only: 'Conservative Default',
}

function collectRejectedMethods(
  selected: MethodDecisionMethodId,
  category: ExerciseCategoryKey,
  runtimeBlocked: string[],
): { whyNot: string[]; contraindications: string[] } {
  const whyNot: string[] = []
  const contraindications: string[] = []

  for (const candidate of REJECTABLE_DECISION_METHODS) {
    if (candidate === selected) continue
    const { best, viaMethodKey } = bestCompatibilityForDecisionMethod(candidate, category)
    if (!best || !viaMethodKey) continue
    if (best.level === 'avoid' || best.level === 'forbidden') {
      const label = DECISION_METHOD_HUMAN_LABEL[candidate]
      whyNot.push(`${label}: ${best.rationale}`)
      if (best.level === 'forbidden') {
        contraindications.push(`${label} forbidden — ${best.rationale}`)
      }
    }
  }

  // Runtime-blocked methods (from doctrine.methodDoctrine.blockedMethods) —
  // surface them when they aren't already covered by the matrix scan.
  for (const blocked of runtimeBlocked) {
    const lblKey = lower(blocked)
    if (!lblKey) continue
    const already = whyNot.some(line => lower(line).includes(lblKey))
    if (!already) {
      whyNot.push(`${blocked}: blocked by current doctrine context`)
    }
  }

  return { whyNot, contraindications }
}

// =============================================================================
// LABEL + SUMMARY
// =============================================================================

function buildRenderLabel(methodId: MethodDecisionMethodId): string {
  return DECISION_METHOD_HUMAN_LABEL[methodId] ?? 'Selected Method'
}

function buildRenderSummary(
  methodId: MethodDecisionMethodId,
  category: ExerciseCategoryKey | null,
  whyThis: string[],
): string {
  const tail = whyThis[0] ?? ''
  const cat = category ? category.replace(/_/g, ' ') : 'this work'
  switch (methodId) {
    case 'skill_practice':
      return tail || `Preserves quality and joint control for ${cat}.`
    case 'top_set_backoff':
      return tail || `One high-quality top exposure plus controlled back-off volume for ${cat}.`
    case 'backoff_sets':
      return tail || `Controlled volume after primary exposure for ${cat}.`
    case 'drop_set':
      return tail || `Time-efficient hypertrophy stimulus on ${cat}.`
    case 'superset':
      return tail || `Time-efficient pairing on ${cat} without degrading primary output.`
    case 'circuit':
      return tail || `Work-capacity flow appropriate for ${cat}.`
    case 'density_block':
      return tail || `Time-capped quality work for ${cat}.`
    case 'endurance_density':
      return tail || `Repeat-effort pacing for ${cat}.`
    case 'accessory_pairing':
      return tail || `Low-risk accessory pairing for ${cat}.`
    case 'straight_sets':
      return tail || `Quality and rest preserved for ${cat}.`
    case 'rejected_method_only':
      return tail || `Conservative default — preferred methods rejected for ${cat}.`
  }
}

// =============================================================================
// [PHASE 3C] PROFILE-CONTEXT EXTRACTION
// Builds a uniform MethodDecisionProfileContext from any of the canonical
// sources. Callers should prefer `program.profileSnapshot` because it was
// frozen at generation time and is the same truth the program was built
// against; canonicalProfile / generationInputs are accepted as fallbacks.
// =============================================================================

/**
 * Shape of program.profileSnapshot as actually constructed by
 * adaptive-program-builder.ts (line 19510). We accept a permissive shape so
 * future snapshot-field additions don't silently break this extractor.
 */
export interface MethodDecisionProfileSnapshotLike {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  experienceLevel?: string | null
  trainingDaysPerWeek?: number | null
  sessionLengthMinutes?: number | null
  sessionDurationMode?: string | null
  scheduleMode?: string | null
  sessionStylePreference?: string | null
  selectedTrainingStyles?: string[] | null
  equipmentAvailable?: string[] | null
  jointCautions?: string[] | null
  selectedSkills?: string[] | null
  selectedFlexibility?: string[] | null
  flexibilitySelections?: string[] | null
  trainingPathType?: string | null
  skillProgressions?: {
    frontLever?: string | null
    planche?: string | null
    hspu?: string | null
  } | null
}

export function extractProfileContextFromSnapshot(
  snapshot: MethodDecisionProfileSnapshotLike | null | undefined,
  sourceLabel: MethodDecisionProfileSource = 'program.profileSnapshot',
): MethodDecisionProfileContext | null {
  if (!snapshot || typeof snapshot !== 'object') return null
  const skills = Array.isArray(snapshot.selectedSkills) ? snapshot.selectedSkills.filter(Boolean) : []
  const flex = Array.isArray(snapshot.flexibilitySelections)
    ? snapshot.flexibilitySelections.filter(Boolean)
    : Array.isArray(snapshot.selectedFlexibility)
      ? snapshot.selectedFlexibility.filter(Boolean)
      : []
  return {
    source: sourceLabel,
    primaryGoal: snapshot.primaryGoal ?? null,
    secondaryGoal: snapshot.secondaryGoal ?? null,
    experienceLevel: snapshot.experienceLevel ?? null,
    selectedSkills: skills,
    primarySkill: skills[0] ?? null,
    trainingDaysPerWeek: snapshot.trainingDaysPerWeek ?? null,
    scheduleMode: snapshot.scheduleMode ?? null,
    sessionLengthMinutes: snapshot.sessionLengthMinutes ?? null,
    sessionDurationMode: snapshot.sessionDurationMode ?? null,
    sessionStylePreference: snapshot.sessionStylePreference ?? null,
    selectedTrainingStyles: Array.isArray(snapshot.selectedTrainingStyles)
      ? snapshot.selectedTrainingStyles.filter(Boolean)
      : [],
    equipmentAvailable: Array.isArray(snapshot.equipmentAvailable)
      ? snapshot.equipmentAvailable.filter(Boolean)
      : [],
    jointCautions: Array.isArray(snapshot.jointCautions)
      ? snapshot.jointCautions.filter(Boolean)
      : [],
    flexibilitySelections: flex,
    trainingPathType: snapshot.trainingPathType ?? null,
    skillProgressions: snapshot.skillProgressions ?? null,
  }
}

// =============================================================================
// [PHASE 3C] PROFILE-INFLUENCE COMPUTATION
// Given the materialized method, the classified category, the session anchor
// name, and the user's profile context — produce concrete influence reasons
// that prove which profile fields actually steered THIS decision. We only
// emit reasons when the relevant field is present and applies to this method
// — never a fake reason.
// =============================================================================

function buildProfileInfluence(
  methodId: MethodDecisionMethodId,
  category: ExerciseCategoryKey | null,
  anchorName: string | null,
  profile: MethodDecisionProfileContext | null,
  trainingGoalFallback: string | null,
): MethodDecisionProfileInfluence {
  const reasons: string[] = []
  const skillsUsed: string[] = []
  const equipmentUsed: string[] = []
  const jointsUsed: string[] = []
  const flexUsed: string[] = []

  // No profile at all — be honest about it.
  if (!profile) {
    return {
      source: 'legacyFallback',
      selectedSkillsUsed: [],
      primarySkillUsed: null,
      trainingGoalUsed: trainingGoalFallback ?? null,
      stylePreferenceUsed: null,
      equipmentUsed: [],
      jointCautionsUsed: [],
      flexibilityUsed: [],
      scheduleUsed: undefined,
      primaryDriverLine: trainingGoalFallback
        ? `Goal "${trainingGoalFallback}" only — no profile snapshot was available for this saved program.`
        : 'No profile snapshot available; method attributed from session shape alone.',
      influenceReasons: [],
    }
  }

  const goal = profile.primaryGoal ?? trainingGoalFallback ?? null
  const style = profile.sessionStylePreference ?? null
  const skills = profile.selectedSkills ?? []
  const equipment = profile.equipmentAvailable ?? []
  const joints = profile.jointCautions ?? []
  const flex = profile.flexibilitySelections ?? []
  const days = profile.trainingDaysPerWeek ?? null
  const sessLen = profile.sessionLengthMinutes ?? null

  // ---- skill influence -----------------------------------------------------
  // Match anchor and category against selected skills to surface concrete
  // skill-driven reasoning.
  const anchorLower = lower(anchorName)
  const matchedSkills = skills.filter(s => {
    const sl = lower(s)
    return sl && (anchorLower.includes(sl) || sl.includes(anchorLower) || sl.split(/[_\s-]+/).some(t => t && anchorLower.includes(t)))
  })
  if (matchedSkills.length > 0) {
    skillsUsed.push(...matchedSkills)
  }

  if (category === 'high_skill_isometrics' && skills.length > 0) {
    skillsUsed.push(...skills.filter(s => !skillsUsed.includes(s)).slice(0, 3))
    if (methodId === 'skill_practice' || methodId === 'straight_sets') {
      reasons.push(
        `Selected skills (${skillsUsed.slice(0, 3).join(', ')}) require fresh, fatigue-free expression — straight skill practice protects technical quality.`,
      )
    } else {
      reasons.push(
        `Selected skills (${skillsUsed.slice(0, 3).join(', ')}) typically argue for skill-practice; method materialized differently because of session structure.`,
      )
    }
  }

  // ---- goal influence ------------------------------------------------------
  if (goal) {
    const gl = lower(goal)
    if ((gl.includes('strength') || gl.includes('weighted')) && (methodId === 'top_set_backoff' || methodId === 'backoff_sets' || methodId === 'straight_sets')) {
      reasons.push(`Strength goal "${goal}" favors quality load exposure with controlled volume.`)
    }
    if ((gl.includes('hypertrophy') || gl.includes('muscle')) && (methodId === 'superset' || methodId === 'accessory_pairing' || methodId === 'drop_set')) {
      reasons.push(`Hypertrophy goal "${goal}" tolerates time-efficient pairing on accessory work.`)
    }
    if ((gl.includes('endurance') || gl.includes('military') || gl.includes('test') || gl.includes('conditioning')) && (methodId === 'density_block' || methodId === 'circuit' || methodId === 'endurance_density')) {
      reasons.push(`Endurance / conditioning goal "${goal}" favors repeatable work-capacity expression.`)
    }
    if ((gl.includes('skill') || gl.includes('calisthenic')) && (methodId === 'skill_practice' || methodId === 'straight_sets')) {
      reasons.push(`Skill-priority goal "${goal}" protects technical quality from fatigue interference.`)
    }
  }

  // ---- session-style preference -------------------------------------------
  if (style) {
    const sl = lower(style)
    if (sl.includes('shorter') || sl.includes('time') || sl.includes('density')) {
      if (methodId === 'density_block' || methodId === 'superset' || methodId === 'circuit' || methodId === 'accessory_pairing') {
        reasons.push(`Session-style preference "${style}" supports time-efficient packaging.`)
      }
    }
    if (sl.includes('longer') || sl.includes('complete') || sl.includes('full')) {
      if (methodId === 'straight_sets' || methodId === 'top_set_backoff' || methodId === 'skill_practice') {
        reasons.push(`Session-style preference "${style}" supports complete rest and quality output.`)
      }
    }
  }

  // ---- joint cautions ------------------------------------------------------
  if (joints.length > 0) {
    jointsUsed.push(...joints)
    if (methodId === 'drop_set' || methodId === 'circuit') {
      reasons.push(
        `Joint cautions (${joints.join(', ')}) argue against high-fatigue technical methods on this anchor.`,
      )
    }
    if (category === 'high_skill_isometrics') {
      reasons.push(
        `Joint cautions (${joints.join(', ')}) reinforce conservative skill-quality protection for this category.`,
      )
    }
  }

  // ---- equipment -----------------------------------------------------------
  if (equipment.length > 0) {
    equipmentUsed.push(...equipment.slice(0, 4))
    if (category === 'heavy_weighted_basics' && (methodId === 'top_set_backoff' || methodId === 'backoff_sets')) {
      const loadable = equipment.filter(e => /weight|belt|barbell|dumb|kettle|plate|vest|loadable/i.test(e))
      if (loadable.length > 0) {
        reasons.push(`Loadable equipment available (${loadable.slice(0, 3).join(', ')}) supports top-set + back-off load progression.`)
      }
    }
  }

  // ---- flexibility selections ---------------------------------------------
  if (flex.length > 0 && (category === 'flexibility_mobility' || category === 'prehab_joint_integrity')) {
    flexUsed.push(...flex.slice(0, 4))
    reasons.push(`Flexibility selections (${flex.slice(0, 3).join(', ')}) keep this block at low-fatigue straight work.`)
  }

  // ---- schedule constraints -----------------------------------------------
  if (typeof days === 'number' && days >= 5 && (methodId === 'density_block' || methodId === 'circuit')) {
    reasons.push(`High training frequency (${days} days/week) caps systemic conditioning to avoid fatigue spillover.`)
  }
  if (typeof sessLen === 'number' && sessLen <= 45 && (methodId === 'superset' || methodId === 'circuit' || methodId === 'density_block' || methodId === 'accessory_pairing')) {
    reasons.push(`Short session window (${sessLen} min) favors compact packaging.`)
  }
  if (typeof sessLen === 'number' && sessLen >= 75 && (methodId === 'straight_sets' || methodId === 'top_set_backoff' || methodId === 'skill_practice')) {
    reasons.push(`Long session window (${sessLen} min) supports full rest and quality output.`)
  }

  // ---- primary driver line (single visible line on the card) --------------
  const driverParts: string[] = []
  if (matchedSkills.length > 0) driverParts.push(`selected skill: ${matchedSkills.slice(0, 2).join(' / ')}`)
  else if (skills.length > 0 && category === 'high_skill_isometrics') driverParts.push(`skill priorities: ${skills.slice(0, 2).join(' / ')}`)
  if (goal) driverParts.push(`goal: ${goal}`)
  if (style) driverParts.push(`style: ${style}`)
  if (joints.length > 0) driverParts.push(`joint care: ${joints.slice(0, 2).join(', ')}`)
  if (driverParts.length === 0 && equipment.length > 0) driverParts.push(`equipment: ${equipment.slice(0, 2).join(', ')}`)
  if (driverParts.length === 0 && typeof days === 'number') driverParts.push(`schedule: ${days}d/wk`)
  const primaryDriverLine = driverParts.length > 0
    ? driverParts.join(' · ')
    : 'Profile snapshot available; no field directly applied to this method.'

  return {
    source: profile.source,
    selectedSkillsUsed: skillsUsed.length > 0 ? Array.from(new Set(skillsUsed)) : (skills.length > 0 ? skills.slice(0, 3) : []),
    primarySkillUsed: matchedSkills[0] ?? profile.primarySkill ?? null,
    trainingGoalUsed: goal,
    stylePreferenceUsed: style,
    equipmentUsed: equipmentUsed.length > 0 ? equipmentUsed : equipment.slice(0, 4),
    jointCautionsUsed: jointsUsed,
    flexibilityUsed: flexUsed,
    scheduleUsed: {
      mode: profile.scheduleMode ?? null,
      daysPerWeek: days,
      sessionDuration: sessLen,
    },
    primaryDriverLine,
    influenceReasons: reasons.slice(0, 5),
  }
}

// =============================================================================
// [PHASE 4A] ACTUAL-MATERIALIZATION READER
// Reads session.styleMetadata.methodMaterializationSummary (the builder's
// canonical, post-materialization single source of truth) when present.
// Falls back to a direct count of styledGroups + per-exercise blockId/
// setExecutionMethod for legacy programs where the builder did not stamp the
// summary. EVERY field cited here is a real, already-existing field — no
// invention. Pure function; does not mutate the session.
// =============================================================================

export function buildActualMaterialization(
  session: MethodDecisionSessionInput,
): MethodDecisionActualMaterialization {
  const sm = (session as unknown as {
    styleMetadata?: {
      methodMaterializationSummary?: {
        groupedStructurePresent?: boolean
        rowLevelMethodCuesPresent?: boolean
        dominantRenderMode?: 'grouped' | 'flat_with_method_cues' | 'flat'
        groupedBlockCount?: number
        groupedMethodCounts?: {
          superset?: number
          circuit?: number
          density_block?: number
          cluster?: number
        }
        rowExecutionCounts?: {
          superset?: number
          circuit?: number
          density?: number
          cluster?: number
          top_set?: number
          drop_set?: number
          rest_pause?: number
        }
        // [PHASE AA1R] Integrity gate fields. Old summaries lack these, so all
        // reads are guarded with sane defaults.
        summaryIntegrityVerdict?:
          | 'PASS_FINAL_STRUCTURE_CONFIRMED'
          | 'WARN_STYLED_GROUP_WITHOUT_ROW_BINDING'
          | 'FAIL_METHOD_CLAIM_WITH_ZERO_CHANGED_EXERCISES'
        staleStyledGroupCount?: number
        orphanedStyledGroupMethods?: string[]
        groupedExerciseRowCount?: number
      } | null
      styledGroups?: Array<{
        groupType?: string | null
        exercises?: Array<{ name?: string | null }> | null
      }> | null
      clusterDecision?: {
        targetExerciseId?: string | null
        targetExerciseName?: string | null
      } | null
    } | null
  }).styleMetadata ?? null

  const exercises = (session as unknown as { exercises?: Array<{
    name?: string | null
    blockId?: string | null
    method?: string | null
    setExecutionMethod?: string | null
  }> }).exercises ?? []

  // ---- PATH 1: builder-locked summary present (post-3F builds) -----------
  const summary = sm?.methodMaterializationSummary ?? null
  if (summary && typeof summary === 'object') {
    // [PHASE AA1R] Integrity-gate the grouped counts. If the summary's
    // integrity verdict is FAIL_METHOD_CLAIM_WITH_ZERO_CHANGED_EXERCISES we
    // refuse to surface any grouped claim — the styledGroup was orphaned and
    // the doctrine panel must not lie. The reconciler also zeroes counts in
    // this case, but we double-check here so older saved programs that read
    // a stale summary still get an honest verdict at display time.
    const verdict = summary.summaryIntegrityVerdict ?? 'PASS_FINAL_STRUCTURE_CONFIRMED'
    const integrityFailed = verdict === 'FAIL_METHOD_CLAIM_WITH_ZERO_CHANGED_EXERCISES'

    const groupedSuperset = integrityFailed ? 0 : (summary.groupedMethodCounts?.superset ?? 0)
    const groupedCircuit = integrityFailed ? 0 : (summary.groupedMethodCounts?.circuit ?? 0)
    const groupedDensity = integrityFailed ? 0 : (summary.groupedMethodCounts?.density_block ?? 0)
    const rowCluster = summary.rowExecutionCounts?.cluster ?? 0
    const rowTopSet = summary.rowExecutionCounts?.top_set ?? 0
    const rowDropSet = summary.rowExecutionCounts?.drop_set ?? 0
    const rowRestPause = summary.rowExecutionCounts?.rest_pause ?? 0
    const groupedBlockCountRaw = summary.groupedBlockCount ?? (groupedSuperset + groupedCircuit + groupedDensity)
    const groupedBlockCount = integrityFailed ? 0 : groupedBlockCountRaw

    // Count exercises that materially changed (have a blockId in a renderable
    // grouped block OR carry a setExecutionMethod). This is a count of REAL
    // mutated fields on session.exercises.
    let changedExerciseCount = 0
    const blockIdsSeen = new Set<string>()
    for (const ex of exercises) {
      if (ex && typeof ex.blockId === 'string' && ex.blockId.length > 0) {
        blockIdsSeen.add(ex.blockId)
        changedExerciseCount += 1
        continue
      }
      const sx = ex?.setExecutionMethod
      if (typeof sx === 'string' && sx.length > 0 && sx !== 'straight' && sx !== 'straight_sets') {
        changedExerciseCount += 1
      }
    }

    // [PHASE AA1R] Final defense-in-depth gate: even if the summary says
    // grouped count > 0, refuse to claim grouped if no exercise rows survive
    // with a blockId (groupedExerciseRowCount preferred when present).
    const groupedRowProof = summary.groupedExerciseRowCount ?? blockIdsSeen.size
    const groupedClaimSurvives = groupedBlockCount > 0 && groupedRowProof >= 2
    const finalGroupedSuperset = groupedClaimSurvives ? groupedSuperset : 0
    const finalGroupedCircuit = groupedClaimSurvives ? groupedCircuit : 0
    const finalGroupedDensity = groupedClaimSurvives ? groupedDensity : 0
    const finalGroupedBlockCount = groupedClaimSurvives ? groupedBlockCount : 0

    // Recompute dominant mode AFTER all integrity gates so a failed claim
    // collapses to flat / flat_with_method_cues honestly.
    const dominant: 'grouped' | 'flat_with_method_cues' | 'flat' = finalGroupedBlockCount > 0
      ? 'grouped'
      : (rowCluster + rowTopSet + rowDropSet + rowRestPause) > 0 ? 'flat_with_method_cues'
      : 'flat'
    const hasReal = dominant !== 'flat'

    const descriptions: string[] = []
    if (finalGroupedDensity > 0) {
      descriptions.push(
        `Density Block applied — ${finalGroupedDensity === 1 ? 'one block' : `${finalGroupedDensity} blocks`} of accessory exercises grouped under a timed work cap`,
      )
    }
    if (finalGroupedSuperset > 0) {
      descriptions.push(
        `Superset applied — ${finalGroupedSuperset === 1 ? 'one paired block' : `${finalGroupedSuperset} paired blocks`} with minimal rest between movements`,
      )
    }
    if (finalGroupedCircuit > 0) {
      descriptions.push(
        `Circuit applied — ${finalGroupedCircuit === 1 ? 'one round-based block' : `${finalGroupedCircuit} round-based blocks`} with rest after the full round`,
      )
    }
    if (rowCluster > 0) {
      const target = sm?.clusterDecision?.targetExerciseName
      descriptions.push(
        target
          ? `Cluster set applied to ${target} — short intra-set rest to preserve quality`
          : `Cluster set applied — short intra-set rest to preserve quality on ${rowCluster} exercise${rowCluster === 1 ? '' : 's'}`,
      )
    }
    if (rowTopSet > 0) {
      descriptions.push(
        `Top set + Back-off applied to ${rowTopSet} exercise${rowTopSet === 1 ? '' : 's'} — quality load with controlled volume`,
      )
    }
    if (rowDropSet > 0) {
      descriptions.push(
        `Drop set applied to ${rowDropSet} exercise${rowDropSet === 1 ? '' : 's'} — extended single-set work via load reduction`,
      )
    }
    if (rowRestPause > 0) {
      descriptions.push(
        `Rest-pause applied to ${rowRestPause} exercise${rowRestPause === 1 ? '' : 's'} — short pause sets within a target rep total`,
      )
    }

    return {
      hasRealStructuralChange: hasReal,
      dominantRenderMode: dominant,
      groupedBlockCount: finalGroupedBlockCount,
      groupedMethodCounts: {
        superset: finalGroupedSuperset,
        circuit: finalGroupedCircuit,
        density_block: finalGroupedDensity,
      },
      rowExecutionCounts: {
        cluster: rowCluster,
        top_set: rowTopSet,
        drop_set: rowDropSet,
        rest_pause: rowRestPause,
      },
      changedExerciseCount,
      structuralChangeDescriptions: descriptions,
      evidenceSource: 'builder_session_summary',
    }
  }

  // ---- PATH 2: derive from raw session fields (legacy builds) -------------
  // Mirrors the visible adapter's MIN_MEMBERS=2 + cluster-stripping rules.
  let supersetGroups = 0
  let circuitGroups = 0
  let densityGroups = 0
  const styledGroups = sm?.styledGroups ?? []
  for (const g of styledGroups) {
    const t = (g?.groupType ?? '').toLowerCase()
    if (!t || t === 'straight' || t === 'cluster') continue
    const usable = (g?.exercises ?? []).filter(m => typeof m?.name === 'string' && m!.name!.trim().length >= 2)
    if (usable.length < 2) continue
    if (t === 'superset') supersetGroups += 1
    else if (t === 'circuit') circuitGroups += 1
    else if (t === 'density' || t === 'density_block') densityGroups += 1
  }
  let rowCluster = 0
  let rowTopSet = 0
  let rowDropSet = 0
  let rowRestPause = 0
  let changed = 0
  for (const ex of exercises) {
    const sx = (ex?.setExecutionMethod ?? '').toLowerCase()
    if (sx === 'cluster' || sx === 'cluster_sets' || sx === 'cluster_set') { rowCluster += 1; changed += 1 }
    else if (sx === 'top_set' || sx === 'top-set') { rowTopSet += 1; changed += 1 }
    else if (sx === 'drop_set' || sx === 'drop-set') { rowDropSet += 1; changed += 1 }
    else if (sx === 'rest_pause' || sx === 'rest-pause') { rowRestPause += 1; changed += 1 }
    else if (typeof ex?.blockId === 'string' && ex.blockId.length > 0) { changed += 1 }
  }
  // Cluster sidecar evidence — when builder wrote clusterDecision but per-row
  // tag was stripped on save.
  if (
    rowCluster === 0 &&
    sm?.clusterDecision &&
    typeof sm.clusterDecision.targetExerciseId === 'string' &&
    sm.clusterDecision.targetExerciseId.length > 0
  ) {
    rowCluster = 1
  }

  const groupedBlockCount = supersetGroups + circuitGroups + densityGroups
  const dominant: 'grouped' | 'flat_with_method_cues' | 'flat' =
    groupedBlockCount > 0 ? 'grouped'
    : (rowCluster + rowTopSet + rowDropSet + rowRestPause) > 0 ? 'flat_with_method_cues'
    : 'flat'
  const hasReal = dominant !== 'flat'

  const descriptions: string[] = []
  if (densityGroups > 0) {
    descriptions.push(
      `Density Block applied — ${densityGroups === 1 ? 'one block' : `${densityGroups} blocks`} of accessory exercises grouped under a timed work cap`,
    )
  }
  if (supersetGroups > 0) {
    descriptions.push(
      `Superset applied — ${supersetGroups === 1 ? 'one paired block' : `${supersetGroups} paired blocks`} with minimal rest between movements`,
    )
  }
  if (circuitGroups > 0) {
    descriptions.push(
      `Circuit applied — ${circuitGroups === 1 ? 'one round-based block' : `${circuitGroups} round-based blocks`} with rest after the full round`,
    )
  }
  if (rowCluster > 0) {
    const target = sm?.clusterDecision?.targetExerciseName
    descriptions.push(
      target
        ? `Cluster set applied to ${target} — short intra-set rest to preserve quality`
        : `Cluster set applied — short intra-set rest to preserve quality on ${rowCluster} exercise${rowCluster === 1 ? '' : 's'}`,
    )
  }
  if (rowTopSet > 0) {
    descriptions.push(
      `Top set + Back-off applied to ${rowTopSet} exercise${rowTopSet === 1 ? '' : 's'} — quality load with controlled volume`,
    )
  }
  if (rowDropSet > 0) {
    descriptions.push(
      `Drop set applied to ${rowDropSet} exercise${rowDropSet === 1 ? '' : 's'} — extended single-set work via load reduction`,
    )
  }
  if (rowRestPause > 0) {
    descriptions.push(
      `Rest-pause applied to ${rowRestPause} exercise${rowRestPause === 1 ? '' : 's'} — short pause sets within a target rep total`,
    )
  }

  return {
    hasRealStructuralChange: hasReal,
    dominantRenderMode: dominant,
    groupedBlockCount,
    groupedMethodCounts: {
      superset: supersetGroups,
      circuit: circuitGroups,
      density_block: densityGroups,
    },
    rowExecutionCounts: {
      cluster: rowCluster,
      top_set: rowTopSet,
      drop_set: rowDropSet,
      rest_pause: rowRestPause,
    },
    changedExerciseCount: changed,
    structuralChangeDescriptions: descriptions,
    evidenceSource: hasReal || styledGroups.length > 0 || exercises.length > 0
      ? 'derived_from_session'
      : 'unavailable',
  }
}

// =============================================================================
// MAIN ENGINE
// =============================================================================

export interface MethodDecisionEngineInput {
  session: MethodDecisionSessionInput
  runtimeContract?: DoctrineRuntimeContract | null
  decisionContext?: DoctrineBuilderDecisionContext | null
  trainingGoal?: string | null
  /** [PHASE 3C] Canonical profile context (preferred: program.profileSnapshot). */
  profileContext?: MethodDecisionProfileContext | null
}

/**
 * Authoritative method-decision derivation for ONE session.
 *
 * Returns `null` only when the session has no usable anchor exercise AND no
 * doctrine context — in that case attribution would be invented, which the
 * truth-guard doctrine forbids.
 */
export function deriveMethodDecisionForSession(
  input: MethodDecisionEngineInput,
): MethodDecision | null {
  const { session, runtimeContract, decisionContext, trainingGoal, profileContext } = input

  // --- doctrine source health -----------------------------------------------
  const doctrineActive = !!runtimeContract && runtimeContract.available === true
  const sourceMode = decisionContext?.sourceMode ?? 'unavailable'
  const contextStatus: MethodDecisionContextStatus =
    !doctrineActive || sourceMode === 'unavailable'
      ? 'unavailable'
      : (decisionContext?.diagnostics.usable === true ? 'active' : 'degraded')

  // --- category classification ----------------------------------------------
  const { category, anchorName } = classifyDominantExerciseCategory(session)

  // If we have nothing to attribute to, bail rather than invent.
  if (!category && contextStatus === 'unavailable') {
    return null
  }

  const safeCategory: ExerciseCategoryKey = category ?? 'stable_hypertrophy_accessories'

  // --- materialized method --------------------------------------------------
  const materialized = deriveMaterializedMethod(session, safeCategory)

  // --- runtime doctrine cross-check -----------------------------------------
  const runtimeMethod = runtimeContract?.methodDoctrine ?? null
  const runtimePreferred = (runtimeMethod?.preferredMethods ?? []) as readonly string[]
  const runtimeBlocked = (runtimeMethod?.blockedMethods ?? []) as readonly string[]
  const runtimeReasons = runtimeMethod?.methodReasons ?? null

  // --- batch 10 compatibility for selected method ---------------------------
  const { best: selectedCompat, viaMethodKey } = bestCompatibilityForDecisionMethod(
    materialized.methodId,
    safeCategory,
  )

  // --- assemble whyThisMethod -----------------------------------------------
  const whyThis: string[] = []
  if (selectedCompat) whyThis.push(selectedCompat.rationale)
  if (viaMethodKey && runtimeReasons && runtimeReasons[viaMethodKey]) {
    const r0 = runtimeReasons[viaMethodKey]?.[0]
    if (r0) whyThis.push(r0)
  }
  if (runtimePreferred.includes(viaMethodKey ?? '')) {
    whyThis.push(`Preferred by current doctrine context (${sourceMode}).`)
  }
  if (whyThis.length === 0) {
    whyThis.push(
      `Materialized method derived from session structure for ${safeCategory.replace(/_/g, ' ')}.`,
    )
  }

  // --- assemble whyNotOtherMethods + contraindications ----------------------
  const { whyNot, contraindications } = collectRejectedMethods(
    materialized.methodId,
    safeCategory,
    runtimeBlocked.map(s => String(s)),
  )

  // --- existing rejectedMethods on the session (already-attributed misses) --
  const sessionRejected = session.styleMetadata?.rejectedMethods ?? []
  for (const r of sessionRejected) {
    if (!r?.method || !r?.reason) continue
    const line = `${r.method}: ${r.reason}`
    if (!whyNot.some(x => lower(x).includes(lower(r.method)))) {
      whyNot.push(line)
    }
  }

  // --- fatigue + time-efficiency notes from runtime prescription doctrine ---
  const fatigueNotes: string[] = []
  const timeNotes: string[] = []
  const px = runtimeContract?.prescriptionDoctrine ?? null
  if (px?.densityBias) timeNotes.push(`Density bias: ${px.densityBias}`)
  if (px?.intensityBias) fatigueNotes.push(`Intensity bias: ${px.intensityBias}`)
  if (px?.volumeBias) fatigueNotes.push(`Volume bias: ${px.volumeBias}`)

  // --- doctrine source attribution -----------------------------------------
  const doctrineBatchIds: string[] = []
  const doctrineRuleIds: string[] = []
  if (decisionContext?.batchCoverage?.presentBatches?.includes('batch_10')) {
    doctrineBatchIds.push('batch_10')
  }
  if (viaMethodKey) {
    doctrineRuleIds.push(`batch10:matrix:${viaMethodKey}:${safeCategory}`)
  }
  // Also surface batches that contributed methodDoctrine reasons.
  if (runtimeReasons) {
    for (const k of Object.keys(runtimeReasons)) {
      if (METHOD_ID_TO_BATCH10_KEYS[materialized.methodId].includes(k as MethodKey)) {
        doctrineRuleIds.push(`runtime:methodReason:${k}`)
      }
    }
  }
  // Phase 2 already proved active batches at the program level — copy them
  // as supporting attribution when the per-rule list is thin.
  if (doctrineBatchIds.length === 0 && contextStatus === 'active') {
    doctrineBatchIds.push(...(decisionContext?.batchCoverage?.presentBatches ?? []))
  }

  // --- decide status + confidence ------------------------------------------
  let status: MethodDecisionStatus = 'selected'
  let confidence: MethodDecisionConfidence = 'medium'
  if (selectedCompat?.level === 'forbidden') {
    // Materialization picked something doctrine forbids for this category.
    // We do NOT change the materialized method — but we honestly downgrade.
    status = 'degraded'
    confidence = 'low'
  } else if (selectedCompat?.level === 'avoid') {
    status = 'degraded'
    confidence = 'low'
  } else if (selectedCompat?.level === 'preferred') {
    status = 'selected'
    confidence = contextStatus === 'active' ? 'high' : 'medium'
  } else if (selectedCompat?.level === 'allowed') {
    status = 'selected'
    confidence = contextStatus === 'active' ? 'medium' : 'low'
  } else if (selectedCompat?.level === 'caution') {
    status = 'selected'
    confidence = 'low'
  }
  if (contextStatus === 'unavailable') {
    confidence = 'low'
  }

  const fallbackUsed = contextStatus !== 'active' || category === null

  // --- [PHASE 3C] profile-driven influence ---------------------------------
  // Computed BEFORE renderSummary so the visible "Why" line can lead with a
  // profile-aware reason when one exists.
  const profileInfluence = buildProfileInfluence(
    materialized.methodId,
    category,
    anchorName,
    profileContext ?? null,
    trainingGoal ?? null,
  )

  // Profile reasons join whyThisMethod ahead of generic doctrine matrix
  // rationale, so the rendered card surfaces the user-specific driver first.
  const whyWithProfile: string[] = [...profileInfluence.influenceReasons, ...whyThis]

  // [PHASE 4A] Read-only verdict of what actually materialized on the session.
  // Computed from session.styleMetadata.methodMaterializationSummary or, on
  // legacy programs, from raw styledGroups + per-exercise blockId/
  // setExecutionMethod fields. The card uses this to gate the visible
  // doctrine panel — a session whose actualMaterialization.hasRealStructuralChange
  // is false MUST NOT have a "Doctrine Decision" panel rendered, because that
  // would be a fake-proof claim against an unchanged straight-set session.
  const actualMaterialization = buildActualMaterialization(session)

  // --- finalize -------------------------------------------------------------
  const renderLabel = buildRenderLabel(materialized.methodId)
  const renderSummary = buildRenderSummary(materialized.methodId, category, whyWithProfile)

  const decision: MethodDecision = {
    methodId: materialized.methodId,
    status,
    confidence,
    source: {
      doctrineContextStatus: contextStatus,
      doctrineBatchIds,
      doctrineRuleIds,
      fallbackUsed,
    },
    appliesTo: {
      sessionId: session.dayLabel ?? (typeof session.dayNumber === 'number' ? `day_${session.dayNumber}` : undefined),
      exerciseName: anchorName ?? undefined,
      trainingGoal: trainingGoal ?? undefined,
      exerciseCategory: category ?? undefined,
    },
    prescriptionIntent: {
      whyThisMethod: whyWithProfile.slice(0, 5),
      whyNotOtherMethods: whyNot.slice(0, 4),
      contraindications: contraindications.slice(0, 3),
      fatigueNotes: fatigueNotes.slice(0, 3),
      timeEfficiencyNotes: timeNotes.slice(0, 3),
    },
    profileInfluence,
    actualMaterialization,
    renderLabel,
    renderSummary,
    debugCode: `${materialized.debugCode}|cat:${safeCategory}|ctx:${contextStatus}|conf:${confidence}|prof:${profileInfluence.source}|skills:${profileInfluence.selectedSkillsUsed.length}|matz:${actualMaterialization.dominantRenderMode}|grp:${actualMaterialization.groupedBlockCount}|chg:${actualMaterialization.changedExerciseCount}`,
  }

  return decision
}

// =============================================================================
// PROGRAM-WIDE STAMPING
// Walks the program's sessions, derives a MethodDecision per session, and
// returns a tuple of (stamped sessions, summary) WITHOUT mutating the original.
// The wrapper applies the result via shallow assignment.
// =============================================================================

export interface MethodDecisionStampSummary {
  sessionsConsidered: number
  decisionsAttached: number
  byMethod: Partial<Record<MethodDecisionMethodId, number>>
  byStatus: Partial<Record<MethodDecisionStatus, number>>
  contextStatus: MethodDecisionContextStatus
  doctrineBatchesUsed: string[]
  /** [PHASE 3C] Profile context source actually used for stamping. */
  profileSource: MethodDecisionProfileSource
  /** [PHASE 3C] Number of sessions whose decision cited at least one profile-influence reason. */
  profileInfluencedDecisions: number
  /** [PHASE 3C] Stable version marker — the UI uses this to detect stale saved programs. */
  methodDecisionVersion: string
  /** [PHASE 3C] Stamp timestamp (ISO). */
  methodDecisionStampedAt: string
  /**
   * [PHASE 4A] Program-wide roll-up of ACTUAL structural changes the builder
   * materialized — used by the UI to (a) gate honest visible proof and
   * (b) detect "all-flat" programs that need to be regenerated rather than
   * labeled as doctrine-driven. Every count is read from already-existing
   * fields on session.exercises / styledGroups / clusterDecision.
   */
  materialization: {
    sessionsWithStructuralChange: number
    totalGroupedBlocks: number
    totalGroupedSupersets: number
    totalGroupedCircuits: number
    totalGroupedDensityBlocks: number
    totalRowCluster: number
    totalRowTopSet: number
    totalRowDropSet: number
    totalRowRestPause: number
    totalChangedExercises: number
    /** True when EVERY session is flat — useful for the UI to surface a regenerate nudge. */
    allSessionsFlat: boolean
  }
}

export interface StampMethodDecisionsOptions {
  /** [PHASE 3C] Canonical profile context (preferred: program.profileSnapshot). */
  profileContext?: MethodDecisionProfileContext | null
}

export function stampMethodDecisionsOnSessions(
  sessions: MethodDecisionSessionInput[],
  runtimeContract: DoctrineRuntimeContract | null | undefined,
  decisionContext: DoctrineBuilderDecisionContext | null | undefined,
  trainingGoal?: string | null,
  options?: StampMethodDecisionsOptions,
): { decisions: Array<MethodDecision | null>; summary: MethodDecisionStampSummary } {
  const decisions: Array<MethodDecision | null> = []
  const byMethod: Partial<Record<MethodDecisionMethodId, number>> = {}
  const byStatus: Partial<Record<MethodDecisionStatus, number>> = {}
  const batchSet = new Set<string>()
  let attached = 0
  let profileInfluenced = 0

  // [PHASE 4A] Program-wide structural-materialization roll-up counters.
  let sessionsWithStructuralChange = 0
  let totalGroupedBlocks = 0
  let totalGroupedSupersets = 0
  let totalGroupedCircuits = 0
  let totalGroupedDensityBlocks = 0
  let totalRowCluster = 0
  let totalRowTopSet = 0
  let totalRowDropSet = 0
  let totalRowRestPause = 0
  let totalChangedExercises = 0

  const ctxStatus: MethodDecisionContextStatus =
    !runtimeContract || runtimeContract.available !== true || (decisionContext?.sourceMode ?? 'unavailable') === 'unavailable'
      ? 'unavailable'
      : (decisionContext?.diagnostics.usable === true ? 'active' : 'degraded')

  const profileContext = options?.profileContext ?? null

  for (const s of sessions) {
    const decision = deriveMethodDecisionForSession({
      session: s,
      runtimeContract: runtimeContract ?? null,
      decisionContext: decisionContext ?? null,
      trainingGoal: trainingGoal ?? null,
      profileContext,
    })
    decisions.push(decision)
    if (decision) {
      attached += 1
      byMethod[decision.methodId] = (byMethod[decision.methodId] ?? 0) + 1
      byStatus[decision.status] = (byStatus[decision.status] ?? 0) + 1
      for (const b of decision.source.doctrineBatchIds) batchSet.add(b)
      if ((decision.profileInfluence.influenceReasons?.length ?? 0) > 0) {
        profileInfluenced += 1
      }
      const am = decision.actualMaterialization
      if (am.hasRealStructuralChange) sessionsWithStructuralChange += 1
      totalGroupedBlocks += am.groupedBlockCount
      totalGroupedSupersets += am.groupedMethodCounts.superset
      totalGroupedCircuits += am.groupedMethodCounts.circuit
      totalGroupedDensityBlocks += am.groupedMethodCounts.density_block
      totalRowCluster += am.rowExecutionCounts.cluster
      totalRowTopSet += am.rowExecutionCounts.top_set
      totalRowDropSet += am.rowExecutionCounts.drop_set
      totalRowRestPause += am.rowExecutionCounts.rest_pause
      totalChangedExercises += am.changedExerciseCount
    }
  }

  return {
    decisions,
    summary: {
      sessionsConsidered: sessions.length,
      decisionsAttached: attached,
      byMethod,
      byStatus,
      contextStatus: ctxStatus,
      doctrineBatchesUsed: Array.from(batchSet).sort(),
      profileSource: profileContext?.source ?? 'legacyFallback',
      profileInfluencedDecisions: profileInfluenced,
      methodDecisionVersion: METHOD_DECISION_VERSION,
      methodDecisionStampedAt: new Date().toISOString(),
      materialization: {
        sessionsWithStructuralChange,
        totalGroupedBlocks,
        totalGroupedSupersets,
        totalGroupedCircuits,
        totalGroupedDensityBlocks,
        totalRowCluster,
        totalRowTopSet,
        totalRowDropSet,
        totalRowRestPause,
        totalChangedExercises,
        allSessionsFlat: attached > 0 && sessionsWithStructuralChange === 0,
      },
    },
  }
}
