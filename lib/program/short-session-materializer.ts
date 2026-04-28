/**
 * ============================================================================
 * [PHASE AB4] SHORT-SESSION DOCTRINE MUTATION / MATERIALIZATION OWNER
 * ============================================================================
 *
 * AB3 stamped analysis truth on top of compression but explicitly did NOT
 * mutate `variant.selection.main`. AB4 is the missing causal layer: a pure,
 * deterministic, safe mutator that takes the reconciled short-variant body
 * and applies actual doctrine-driven prescription/method mutations BEFORE
 * AB3 stamps the recomposition sidecar.
 *
 * Pipeline after AB4:
 *   buildSession(...)
 *     └─ generateSessionVariants(...)            (compression seed)
 *     └─ [VARIANT-PARENT-TRUTH-RECONCILE]        (atomic groups, identity)
 *     └─ materializeShortSessionVariant(...)     (THIS MODULE — causal mutation
 *                                                 of variant.selection.main)
 *     └─ recomposeSessionVariants(...)           (analyses the now-mutated
 *                                                 body and stamps truth)
 *     └─ buildSelectedVariantMain(...)           (Start Workout reads the
 *                                                 same selection.main this
 *                                                 module mutated — parity is
 *                                                 automatic)
 *
 * GUARANTEES (these are PASS criteria, not aspirations):
 *
 *   1. PURE FUNCTION. No db writes, no React, no hooks, no module-level
 *      mutable state, no side effects except a single console diagnostic
 *      log. Inputs are read; a NEW variant object is returned (the caller
 *      decides whether to splice it back into session.variants).
 *
 *   2. NEVER MUTATES FULL. We only mutate the short-variant clone. Full
 *      session is parent truth and must remain stable so 45/30 deltas have
 *      a fixed reference.
 *
 *   3. SAFETY FIRST. Mutations are gated by row role / category / method /
 *      RPE. A primary skill anchor is never set-reduced, never RPE-reduced,
 *      and never rest-shortened. A row already carrying rest-pause / cluster
 *      / density is never further compressed (no "fatigue trap").
 *
 *   4. METHOD COMBINATIONS ALLOWED. AB4 does NOT enforce "one method per
 *      session" or "if X applied then Y blocked". Multi-method coexistence
 *      flows through the upstream method materialiser; AB4 only READS what
 *      is on the rows and refuses to compress on top of it. Adding NEW
 *      methods (e.g. supersetting two accessories that weren't grouped in
 *      Full) is OUT OF SCOPE for AB4 to keep the mutation surface small,
 *      deterministic, and Start-Workout-parity-safe.
 *
 *   5. HONEST RECORDS. Every mutation produces a typed record that the
 *      analyser/UI can consume. If zero mutations were applied because no
 *      safe mutation was available, the result honestly reports that —
 *      `materializationState: 'preserved'` — and the UI then refuses to
 *      label the variant as "recomposed" / "materialized".
 *
 *   6. JSON-SAFE. All output is plain objects, plain arrays, plain numbers
 *      and strings. Survives every save/load layer.
 *
 * ============================================================================
 */

import type { ExerciseSelection, SelectedExercise } from '@/lib/program-exercise-selector'
import type { SessionVariant } from '@/lib/session-compression-engine'

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------

/**
 * Single typed mutation record. The analyser/UI consumes this directly so
 * the surface text can be precise ("reduced 1 set on Hindu Push-Ups",
 * "trimmed 30s rest on Side Lever"), and the record always carries a reason
 * AND optionally a safety reason.
 *
 * `before` / `after` are stringified so the record is uniformly renderable
 * regardless of the underlying field type (sets is a number, RPE is a
 * number, rest is seconds, method is a string).
 */
export type MutationRecordType =
  | 'set_delta'
  | 'rpe_delta'
  | 'rest_delta'
  | 'method_preserved'
  | 'method_blocked'
  | 'no_safe_mutation_available'

export interface MutationRecord {
  type: MutationRecordType
  exerciseNames: string[]
  before?: string | number
  after?: string | number
  reason: string
  safetyReason?: string
}

/**
 * Causal materialization state. Distinct from AB3's analysis-only engine
 * field — this records what THIS MODULE did to the body.
 *
 *   - materialized      : at least one set/rpe/rest mutation applied; body
 *                         differs causally from compression seed.
 *   - preserved         : analyser ran, no safe mutation was available, body
 *                         is intentionally identical to compression seed.
 *                         UI MUST NOT label as "materialized" / "recomposed".
 *   - no_safe_mutation  : a tighter form of `preserved` where every candidate
 *                         row was eligibility-blocked (e.g. all rows were
 *                         priority anchors). Carries the typed reason in the
 *                         mutation records list.
 *   - fallback          : module errored or context was missing.
 */
export type MaterializationState =
  | 'materialized'
  | 'preserved'
  | 'no_safe_mutation'
  | 'fallback'

export interface MaterializeShortSessionVariantInput {
  /** Full session variant (post-reconcile). Read-only; never mutated. */
  fullVariant: SessionVariant
  /** Compression seed for this short variant (post-reconcile). Cloned, not mutated. */
  compressedVariant: SessionVariant
  /** 45 or 30 in current product surface. */
  targetMinutes: number
  /**
   * Methods the materialiser actually applied at session level. Used to
   * decide whether to label `method_preserved`. AB4 does not introduce new
   * methods, so this list flows through unchanged.
   */
  appliedMethodsThisSession: string[]
  /**
   * Names of priority anchors (resolved upstream from architecture truth or
   * influencing-skill harvest). Anchors are PROTECTED from set/rpe/rest
   * mutation. Empty list means we fall back to the row-level isPrimary
   * heuristic.
   */
  primarySkillExpressions: string[]
  /** Day number for telemetry only. */
  dayNumber?: number
  /** Day focus for telemetry only. */
  focus?: string
}

export interface MaterializeShortSessionVariantResult {
  /** New variant object with mutated `selection.main`. NOT the same reference as the input. */
  variant: SessionVariant
  /** Final state of THIS module's work. */
  materializationState: MaterializationState
  /** Flat list of every mutation we applied (or refused to apply, when typed). */
  mutationRecords: MutationRecord[]
  /** Number of rows actually mutated (deduplicated by row id). */
  mutatedRowCount: number
}

// ----------------------------------------------------------------------------
// Doctrine constants
// ----------------------------------------------------------------------------

/**
 * For 30 Min: trim accessory sets from N down to (N-1) when N >= 3. We never
 * drop a row to <2 sets (loses identity) and never trim primary anchors.
 */
const SET_REDUCTION_FLOOR_30MIN = 2
const SET_REDUCTION_MIN_BEFORE_30MIN = 3

/**
 * For 30 Min: trim accessory RPE by 1 when current >= 8. Targets crunch-
 * time quality (lower output → faster recovery between rows). Floor at 6
 * so we never collapse to "warm-up effort".
 */
const RPE_REDUCTION_FLOOR_30MIN = 6
const RPE_REDUCTION_MIN_BEFORE_30MIN = 8

/**
 * For 45 Min: trim accessory rest by 30s when current >= 90s. For 30 Min
 * we trim more aggressively (45s when current >= 75s). Floor at 45s so we
 * never compromise strength quality.
 */
const REST_REDUCTION_FLOOR = 45
const REST_REDUCTION_MIN_BEFORE_45 = 90
const REST_REDUCTION_DELTA_45 = 30
const REST_REDUCTION_MIN_BEFORE_30 = 75
const REST_REDUCTION_DELTA_30 = 45

/**
 * Categories that are PROTECTED from mutation. These categories represent
 * primary technical skill or heavy-strength work where reducing volume,
 * RPE, or rest would compromise the training stimulus. Lowercase compared.
 */
const PROTECTED_CATEGORIES = new Set(['skill', 'progression', 'main_lift'])

/**
 * Methods that signal a row is already fatigue-managed. We refuse to
 * compress further on top of these (no fatigue traps). Lowercase compared
 * after stripping `_blocks` / `_sets` suffixes.
 */
const FATIGUE_MANAGED_METHODS = new Set([
  'cluster',
  'rest_pause',
  'rest-pause',
  'restpause',
  'density',
  'density_block',
  'circuit',
])

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

interface RowHandle {
  index: number
  row: SelectedExercise
  name: string
  category: string
  sets: number
  rpe: number | null
  rest: number | null
  method: string | null
  isProtectedAnchor: boolean
  isFatigueManaged: boolean
}

function readRowHandle(
  row: SelectedExercise,
  index: number,
  primarySkillExpressions: string[]
): RowHandle {
  const ex = row.exercise as unknown as {
    name?: string
    category?: string
    method?: string
    blockId?: string
  }
  const name = typeof ex.name === 'string' ? ex.name : 'unknown'
  const category = typeof ex.category === 'string' ? ex.category.toLowerCase() : ''
  const method = typeof ex.method === 'string' ? ex.method.toLowerCase() : null
  const sets = typeof row.sets === 'number' ? row.sets : 0
  const rpe = typeof row.targetRPE === 'number' ? row.targetRPE : null
  const rest = typeof row.restSeconds === 'number' ? row.restSeconds : null

  // Anchor detection. We check three signals in order of authority:
  //   1. influencingSkills with `primary` influence (architecture truth)
  //   2. selectionContext.sessionRole containing 'primary' / 'skill'
  //   3. exercise name matching one of the user's primary skill expressions
  //   4. category in PROTECTED_CATEGORIES
  let isProtectedAnchor = PROTECTED_CATEGORIES.has(category)
  if (!isProtectedAnchor) {
    const sr = (row.selectionContext?.sessionRole || '').toLowerCase()
    if (sr.includes('primary') || sr.includes('skill')) isProtectedAnchor = true
  }
  if (!isProtectedAnchor) {
    const inf = row.selectionContext?.influencingSkills ?? []
    for (const i of inf) {
      if (i.influence === 'primary') {
        isProtectedAnchor = true
        break
      }
    }
  }
  if (!isProtectedAnchor && primarySkillExpressions.length > 0) {
    const lowerName = name.toLowerCase()
    for (const skill of primarySkillExpressions) {
      const s = skill.toLowerCase().replace(/_/g, ' ')
      if (lowerName.includes(s)) {
        isProtectedAnchor = true
        break
      }
    }
  }

  // Fatigue-managed = already carrying a method that exhausts local capacity.
  // We refuse to add set/rpe/rest cuts on top of these. Strip common suffixes
  // before comparing so 'cluster_sets' / 'density_blocks' canonicalise.
  let isFatigueManaged = false
  if (method) {
    const canonical = method.replace(/_blocks?$/, '').replace(/_sets$/, '')
    isFatigueManaged = FATIGUE_MANAGED_METHODS.has(canonical) || FATIGUE_MANAGED_METHODS.has(method)
  }

  return {
    index,
    row,
    name,
    category,
    sets,
    rpe,
    rest,
    method,
    isProtectedAnchor,
    isFatigueManaged,
  }
}

/**
 * Deep-clone a SelectedExercise via JSON round-trip. We never include
 * non-serialisable fields on selection rows (verified by the existing
 * launch-fingerprint contract), so this is safe and dependency-free.
 */
function cloneSelectedExercise(row: SelectedExercise): SelectedExercise {
  return JSON.parse(JSON.stringify(row)) as SelectedExercise
}

function cloneSelection(selection: ExerciseSelection): ExerciseSelection {
  // We only clone fields we'll touch — main is the only mutated array.
  // Cool-down / warm-up survive intact.
  const cloned: ExerciseSelection = {
    ...selection,
    main: Array.isArray(selection.main) ? selection.main.map(cloneSelectedExercise) : [],
  }
  return cloned
}

function cloneVariant(variant: SessionVariant): SessionVariant {
  return {
    ...variant,
    selection: cloneSelection(variant.selection),
  }
}

// ----------------------------------------------------------------------------
// Mutation strategies
// ----------------------------------------------------------------------------

/**
 * 30 Min set reduction. Trim accessory rows from N to (N-1) when:
 *   - row is not a protected anchor,
 *   - row is not fatigue-managed,
 *   - current sets >= MIN_BEFORE,
 *   - resulting sets >= FLOOR.
 *
 * Returns the mutation records emitted. Mutates `cloned.selection.main`
 * in-place (the variant has already been cloned by the caller).
 */
function apply30MinSetReduction(
  rows: RowHandle[],
  cloned: SessionVariant,
  records: MutationRecord[]
): number {
  let mutatedCount = 0
  for (const handle of rows) {
    if (handle.isProtectedAnchor) continue
    if (handle.isFatigueManaged) continue
    if (handle.sets < SET_REDUCTION_MIN_BEFORE_30MIN) continue

    const before = handle.sets
    const after = Math.max(SET_REDUCTION_FLOOR_30MIN, before - 1)
    if (after === before) continue

    const target = cloned.selection.main[handle.index]
    if (!target) continue
    target.sets = after
    mutatedCount += 1
    records.push({
      type: 'set_delta',
      exerciseNames: [handle.name],
      before,
      after,
      reason: '30 Min crunch-time accessory volume reduction (preserves identity, frees ~3-4 min)',
    })
  }
  return mutatedCount
}

/**
 * 30 Min RPE reduction. Trim by 1 on accessory rows whose current RPE >= 8
 * and which are not protected anchors / fatigue-managed.
 */
function apply30MinRpeReduction(
  rows: RowHandle[],
  cloned: SessionVariant,
  records: MutationRecord[]
): number {
  let mutatedCount = 0
  for (const handle of rows) {
    if (handle.isProtectedAnchor) continue
    if (handle.isFatigueManaged) continue
    if (handle.rpe === null) continue
    if (handle.rpe < RPE_REDUCTION_MIN_BEFORE_30MIN) continue

    const before = handle.rpe
    const after = Math.max(RPE_REDUCTION_FLOOR_30MIN, before - 1)
    if (after === before) continue

    const target = cloned.selection.main[handle.index]
    if (!target) continue
    target.targetRPE = after
    mutatedCount += 1
    records.push({
      type: 'rpe_delta',
      exerciseNames: [handle.name],
      before,
      after,
      reason: '30 Min crunch-time accessory RPE reduction (preserves quality at higher density)',
    })
  }
  return mutatedCount
}

/**
 * 45 Min / 30 Min rest reduction. For 45 Min: trim by 30s when rest >= 90s.
 * For 30 Min: trim by 45s when rest >= 75s. Floor at 45s in both cases so
 * heavy-output rows always retain enough rest for quality.
 */
function applyRestReduction(
  rows: RowHandle[],
  targetMinutes: number,
  cloned: SessionVariant,
  records: MutationRecord[]
): number {
  const minBefore = targetMinutes <= 30 ? REST_REDUCTION_MIN_BEFORE_30 : REST_REDUCTION_MIN_BEFORE_45
  const delta = targetMinutes <= 30 ? REST_REDUCTION_DELTA_30 : REST_REDUCTION_DELTA_45

  let mutatedCount = 0
  for (const handle of rows) {
    if (handle.isProtectedAnchor) continue
    if (handle.isFatigueManaged) continue
    if (handle.rest === null) continue
    if (handle.rest < minBefore) continue

    const before = handle.rest
    const after = Math.max(REST_REDUCTION_FLOOR, before - delta)
    if (after === before) continue

    const target = cloned.selection.main[handle.index]
    if (!target) continue
    target.restSeconds = after
    mutatedCount += 1
    records.push({
      type: 'rest_delta',
      exerciseNames: [handle.name],
      before,
      after,
      reason: `${targetMinutes} Min crunch-time rest trim on non-anchor accessory (floor ${REST_REDUCTION_FLOOR}s)`,
    })
  }
  return mutatedCount
}

/**
 * Method-preservation note. AB4 does not add new methods; it just records
 * that an upstream-applied method actually carried into THIS short body so
 * the analyser/UI can show it as `executable`. We emit one record per
 * unique method name actually present in the variant rows.
 */
function noteMethodsPreserved(
  rows: RowHandle[],
  appliedMethodsThisSession: string[],
  records: MutationRecord[]
): void {
  const seen = new Set<string>()
  for (const handle of rows) {
    if (!handle.method) continue
    const canonical = handle.method.replace(/_blocks?$/, '').replace(/_sets$/, '')
    if (seen.has(canonical)) continue
    seen.add(canonical)
    const carriers = rows.filter(r => {
      if (!r.method) return false
      const c = r.method.replace(/_blocks?$/, '').replace(/_sets$/, '')
      return c === canonical
    })
    records.push({
      type: 'method_preserved',
      exerciseNames: carriers.map(c => c.name),
      before: 'method-bearing rows in Full',
      after: `${canonical} retained on ${carriers.length} row${carriers.length === 1 ? '' : 's'} in short body`,
      reason: appliedMethodsThisSession.includes(canonical) ||
              appliedMethodsThisSession.includes(`${canonical}_sets`) ||
              appliedMethodsThisSession.includes(`${canonical}_blocks`)
        ? 'session-level method materialisation carried into short variant body'
        : 'row-level method present in short variant body without matching session-level claim',
    })
  }
}

// ----------------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------------

/**
 * Causal short-session materialiser. Given Full + compression seed for a
 * short variant, returns a NEW variant whose `selection.main` has been
 * doctrine-mutated. The caller splices the returned variant back into
 * `session.variants` so the analyser, the Program UI, and Start Workout all
 * see the same body.
 */
export function materializeShortSessionVariant(
  input: MaterializeShortSessionVariantInput
): MaterializeShortSessionVariantResult {
  const { fullVariant, compressedVariant, targetMinutes, appliedMethodsThisSession, primarySkillExpressions, dayNumber, focus } = input

  // Defensive: missing context → fallback. The recompose layer downstream
  // will then mark this variant `engine: 'fallback_compression'` and the UI
  // will refuse to label it as materialized.
  if (!compressedVariant?.selection?.main || !fullVariant?.selection?.main) {
    return {
      variant: compressedVariant,
      materializationState: 'fallback',
      mutationRecords: [
        {
          type: 'no_safe_mutation_available',
          exerciseNames: [],
          reason: 'missing fullVariant or compressedVariant selection.main — analyser cannot run',
        },
      ],
      mutatedRowCount: 0,
    }
  }

  const cloned = cloneVariant(compressedVariant)
  const main = cloned.selection.main
  const handles: RowHandle[] = main.map((row, idx) => readRowHandle(row, idx, primarySkillExpressions))

  const records: MutationRecord[] = []
  const mutatedRowIds = new Set<number>()

  let setMutated = 0
  let rpeMutated = 0
  let restMutated = 0

  // 30 Min: aggressive prescription cuts. 45 Min: rest-only trim.
  if (targetMinutes <= 30) {
    setMutated = apply30MinSetReduction(handles, cloned, records)
    rpeMutated = apply30MinRpeReduction(handles, cloned, records)
    restMutated = applyRestReduction(handles, targetMinutes, cloned, records)
  } else {
    // 45 Min and other short targets: rest reduction only — keep volume and
    // RPE intact since 45 has enough headroom for quality.
    restMutated = applyRestReduction(handles, targetMinutes, cloned, records)
  }

  // Track which rows were mutated by re-reading the post-mutation handles.
  // Any row whose sets/RPE/rest differs from the seed is counted once.
  for (let i = 0; i < main.length; i++) {
    const before = handles[i]
    const after = cloned.selection.main[i]
    if (!after) continue
    const afterSets = typeof after.sets === 'number' ? after.sets : 0
    const afterRpe = typeof after.targetRPE === 'number' ? after.targetRPE : null
    const afterRest = typeof after.restSeconds === 'number' ? after.restSeconds : null
    if (
      afterSets !== before.sets ||
      afterRpe !== before.rpe ||
      afterRest !== before.rest
    ) {
      mutatedRowIds.add(i)
    }
  }

  // Method preservation notes (do not change body, just record what carried).
  noteMethodsPreserved(handles, appliedMethodsThisSession, records)

  // Determine final state. If we mutated zero rows, distinguish:
  //   - no_safe_mutation : every candidate row was eligibility-blocked
  //                        (every non-anchor row was fatigue-managed, or
  //                        every row was a protected anchor)
  //   - preserved        : there were eligible candidates but none crossed
  //                        the threshold (e.g. all rests already at floor)
  let materializationState: MaterializationState = 'materialized'
  if (mutatedRowIds.size === 0) {
    const eligibleCandidates = handles.filter(
      h => !h.isProtectedAnchor && !h.isFatigueManaged
    ).length
    if (eligibleCandidates === 0) {
      materializationState = 'no_safe_mutation'
      records.push({
        type: 'no_safe_mutation_available',
        exerciseNames: [],
        reason:
          'every row in this short body is either a protected anchor or already fatigue-managed — no safe causal mutation available',
        safetyReason: 'protecting primary skill quality and avoiding compounded fatigue on already-method-bearing rows',
      })
    } else {
      materializationState = 'preserved'
      records.push({
        type: 'no_safe_mutation_available',
        exerciseNames: [],
        reason:
          'eligible candidates existed but none crossed the doctrine threshold (sets already minimal, RPE already moderate, rest already at floor)',
      })
    }
  }

  // Telemetry. Audit pass: PASS_AUDIT looks for this token to verify causal
  // mutation actually ran AND that materializationState honestly matches the
  // mutationRecords.
  console.log('[PHASE-AB4-SHORT-SESSION-MATERIALIZED]', {
    dayNumber,
    focus,
    targetMinutes,
    label: cloned.label,
    duration: cloned.duration,
    mainCount: main.length,
    handles: handles.map(h => ({
      name: h.name,
      category: h.category,
      sets: h.sets,
      rpe: h.rpe,
      rest: h.rest,
      method: h.method,
      isProtectedAnchor: h.isProtectedAnchor,
      isFatigueManaged: h.isFatigueManaged,
    })),
    setMutated,
    rpeMutated,
    restMutated,
    mutatedRowCount: mutatedRowIds.size,
    materializationState,
    mutationRecordCount: records.length,
    appliedMethodsThisSession,
    verdict: materializationState,
  })

  return {
    variant: cloned,
    materializationState,
    mutationRecords: records,
    mutatedRowCount: mutatedRowIds.size,
  }
}
