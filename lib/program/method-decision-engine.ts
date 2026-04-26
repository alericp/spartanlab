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

export interface MethodDecision {
  methodId: MethodDecisionMethodId
  status: MethodDecisionStatus
  confidence: MethodDecisionConfidence
  source: MethodDecisionSource
  appliesTo: MethodDecisionAppliesTo
  prescriptionIntent: MethodDecisionPrescriptionIntent
  renderLabel: string
  renderSummary: string
  /** Stable machine-readable code for tests / analytics. */
  debugCode: string
}

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
// MAIN ENGINE
// =============================================================================

export interface MethodDecisionEngineInput {
  session: MethodDecisionSessionInput
  runtimeContract?: DoctrineRuntimeContract | null
  decisionContext?: DoctrineBuilderDecisionContext | null
  trainingGoal?: string | null
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
  const { session, runtimeContract, decisionContext, trainingGoal } = input

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

  // --- finalize -------------------------------------------------------------
  const renderLabel = buildRenderLabel(materialized.methodId)
  const renderSummary = buildRenderSummary(materialized.methodId, category, whyThis)

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
      whyThisMethod: whyThis.slice(0, 4),
      whyNotOtherMethods: whyNot.slice(0, 4),
      contraindications: contraindications.slice(0, 3),
      fatigueNotes: fatigueNotes.slice(0, 3),
      timeEfficiencyNotes: timeNotes.slice(0, 3),
    },
    renderLabel,
    renderSummary,
    debugCode: `${materialized.debugCode}|cat:${safeCategory}|ctx:${contextStatus}|conf:${confidence}`,
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
}

export function stampMethodDecisionsOnSessions(
  sessions: MethodDecisionSessionInput[],
  runtimeContract: DoctrineRuntimeContract | null | undefined,
  decisionContext: DoctrineBuilderDecisionContext | null | undefined,
  trainingGoal?: string | null,
): { decisions: Array<MethodDecision | null>; summary: MethodDecisionStampSummary } {
  const decisions: Array<MethodDecision | null> = []
  const byMethod: Partial<Record<MethodDecisionMethodId, number>> = {}
  const byStatus: Partial<Record<MethodDecisionStatus, number>> = {}
  const batchSet = new Set<string>()
  let attached = 0

  const ctxStatus: MethodDecisionContextStatus =
    !runtimeContract || runtimeContract.available !== true || (decisionContext?.sourceMode ?? 'unavailable') === 'unavailable'
      ? 'unavailable'
      : (decisionContext?.diagnostics.usable === true ? 'active' : 'degraded')

  for (const s of sessions) {
    const decision = deriveMethodDecisionForSession({
      session: s,
      runtimeContract: runtimeContract ?? null,
      decisionContext: decisionContext ?? null,
      trainingGoal: trainingGoal ?? null,
    })
    decisions.push(decision)
    if (decision) {
      attached += 1
      byMethod[decision.methodId] = (byMethod[decision.methodId] ?? 0) + 1
      byStatus[decision.status] = (byStatus[decision.status] ?? 0) + 1
      for (const b of decision.source.doctrineBatchIds) batchSet.add(b)
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
    },
  }
}
