/**
 * [SELECTED-VARIANT-SESSION-CONTRACT] Single authoritative owner.
 *
 * This module is the ONE owner of "given (session, variantIndex), what is the
 * selected-variant main exercise body and its fingerprint?". Before this
 * module existed, three separate surfaces each derived a variant body with
 * slightly different algorithms:
 *
 *   1. AdaptiveSessionCard `displayExercises` (simple shape mapper)
 *   2. AdaptiveSessionCard `buildFullVisibleRoutineExercises(...)` (with
 *      warmup/cooldown/accessory scope around variant selection)
 *   3. app/(app)/workout/session/page.tsx inline `variantExercises` mapper
 *      (identity-preserving map of variant.selection.main onto full
 *      session exercises)
 *
 * Three mappers -> three possible bodies for the same requested variant ->
 * silent divergence between what the Program card showed and what Start
 * Workout booted. That is the last remaining owner split in the 45/30
 * selected-variant corridor.
 *
 * This module provides:
 *   - `buildSelectedVariantMain(session, variantIndex)`
 *     The canonical variant-main builder. Preserves original exercise
 *     identity (id/blockId/method/methodLabel/category/prescribedLoad) by
 *     looking up each variant.selection.main[i] against the full session's
 *     exercises, then overlaying variant-specific prescription fields
 *     (sets/repsOrTime/targetRPE/restSeconds/note/selectionReason/wasAdapted/
 *     coachingMeta). Falls back to the variant row's own shape only if no
 *     original match exists. Returns an explicit `resolvedFrom` tag so the
 *     caller can see whether the body came from a real variant, was forced
 *     to full, or is invalid.
 *
 *   - `buildSessionFingerprint(params)`
 *     Produces a compact, diffable fingerprint of the selected-variant body
 *     (mode, variantIndex, exerciseCount, firstId, firstName, lastId,
 *     lastName, totalSets, estimatedMinutes, exerciseIds[]). Both the
 *     Program card (at Start Workout time) and the live workout route
 *     (after finalSession is built) compute a fingerprint; comparing them
 *     is the parity proof required by the selected-session corridor lock.
 *
 *   - `stampLaunchFingerprint(fp)` / `readLaunchFingerprint(day, idx)`
 *     sessionStorage bridge. The card stamps its expected fingerprint
 *     immediately before router.push(selectedLaunchUrl), the route reads
 *     it on mount keyed by (day, variantIndex), and diffs against its own
 *     resolved fingerprint.
 *
 *   - `compareFingerprints(expected, actual)`
 *     Returns { ok, mismatches[] } so the route can surface the exact
 *     fields where Program-card body truth disagreed with booted body
 *     truth. No silent drift.
 */

import type { AdaptiveSession } from '@/lib/adaptive-program-builder'
import type { SessionVariant } from '@/lib/session-compression-engine'
import {
  type WorkoutExecutionMode,
  resolveExecutionModeFromMinutes,
  EXECUTION_MODE_LABELS,
  EXECUTION_MODE_TARGET_MINUTES,
} from '@/lib/workout/live-workout-authority-contract'

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedVariantMainResult {
  /** The authoritative main-body exercises for the selected variant. */
  exercises: AdaptiveSession['exercises']
  /** Declared duration of the selected variant, or full session duration. */
  estimatedMinutes: number
  /** [PEX-5A] Human label - now supports 10/15/20/30/45/Full. */
  variantLabel: string
  /** Canonical 0-based variant index. */
  variantIndex: number
  /**
   * Where the resolved body came from:
   *   - 'variant'          : variant.selection.main materialized (happy path)
   *   - 'full'             : variantIndex === 0 (no variant requested)
   *   - 'variant_missing'  : variantIndex > 0 but session.variants is unusable;
   *                          full exercises kept, estimatedMinutes stamped
   *                          from declared variant duration (or mode hint)
   *   - 'variant_hollow'   : variantIndex > 0 and variant exists but its
   *                          selection.main is empty/missing; full exercises
   *                          kept, estimatedMinutes stamped from declared
   *                          variant duration
   */
  resolvedFrom: 'variant' | 'full' | 'variant_missing' | 'variant_hollow'
}

export interface SessionFingerprint {
  /** [PEX-5A] Execution mode - now supports 10/15/20/30/45/full. */
  mode: WorkoutExecutionMode
  variantIndex: number
  exerciseCount: number
  firstId: string | null
  firstName: string | null
  lastId: string | null
  lastName: string | null
  totalSets: number
  estimatedMinutes: number | null
  /** Ordered exercise ids for fine-grained parity (order matters). */
  exerciseIds: string[]
}

export interface FingerprintComparison {
  ok: boolean
  mismatches: string[]
}

// ============================================================================
// STORAGE KEY
// ============================================================================

const STORAGE_PREFIX = 'spartanlab:launch_fp'

function storageKey(day: number | string, variantIndex: number): string {
  return `${STORAGE_PREFIX}:${day}:${variantIndex}`
}

// ============================================================================
// AUTHORITATIVE VARIANT MAIN BUILDER
// ============================================================================

function normKey(s: string | undefined | null): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * [PEX-5A] Delegate to the canonical resolver in live-workout-authority-contract.
 * Supports 10/15/20/30/45/full execution modes.
 */
function modeFromMinutes(min: number | null | undefined): WorkoutExecutionMode {
  return resolveExecutionModeFromMinutes(min)
}

/**
 * Build the canonical selected-variant main body.
 *
 * Invariants:
 *   - For variantIndex === 0: returns session.exercises as-is with
 *     resolvedFrom='full'. No transformation.
 *   - For variantIndex > 0: requires session.variants[variantIndex] with a
 *     non-empty selection.main. When valid, maps each variant row to the
 *     matching original session exercise (by id, then normalized name),
 *     preserving full identity and overlaying variant prescription.
 *   - If variant is missing or hollow: KEEPS full-session exercises but
 *     stamps estimatedMinutes from the variant's declared duration so the
 *     mode chip/duration in downstream UI stays consistent with what was
 *     launched. Returns a non-'variant' resolvedFrom so callers can
 *     surface the divergence. NEVER silently collapses to 'full'.
 */
export function buildSelectedVariantMain(
  session: AdaptiveSession,
  variantIndex: number,
  /** [PEX-5A] Optional URL executionMode hint - now supports 10/15/20/30/45/full */
  executionModeHint?: WorkoutExecutionMode | null
): SelectedVariantMainResult {
  // Full session path
  if (!variantIndex || variantIndex <= 0) {
    return {
      exercises: session.exercises ?? [],
      estimatedMinutes: typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 60,
      variantLabel: 'Full Session',
      variantIndex: 0,
      resolvedFrom: 'full',
    }
  }

  const variantsArr = Array.isArray(session.variants) ? session.variants : []
  const variant = variantsArr[variantIndex] as SessionVariant | undefined

  // Variants array entirely unusable (missing, too short, stale program state)
  if (!variant) {
    // [PEX-5A] Derive minutes from execution mode hint using canonical target values
    const modeMinutes = executionModeHint && executionModeHint !== 'full'
      ? EXECUTION_MODE_TARGET_MINUTES[executionModeHint]
      : null
    const labelFromHint = executionModeHint ? EXECUTION_MODE_LABELS[executionModeHint] : 'Full Session'
    return {
      exercises: session.exercises ?? [],
      estimatedMinutes:
        modeMinutes ?? (typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 60),
      variantLabel: labelFromHint,
      variantIndex,
      resolvedFrom: 'variant_missing',
    }
  }

  // [PEX-5A] Derive variant duration from explicit value or execution mode hint
  const variantDuration =
    typeof variant.duration === 'number' && variant.duration > 0
      ? variant.duration
      : executionModeHint && executionModeHint !== 'full'
        ? (EXECUTION_MODE_TARGET_MINUTES[executionModeHint] ?? 60)
        : typeof session.estimatedMinutes === 'number'
          ? session.estimatedMinutes
          : 60
  // [PEX-5A] Use canonical label resolver instead of hardcoded 30/45/full bands
  const derivedMode = resolveExecutionModeFromMinutes(variantDuration)
  const variantLabel = variant.label || EXECUTION_MODE_LABELS[derivedMode]

  // Variant exists but selection.main is unusable (hollow)
  if (!variant.selection?.main || !Array.isArray(variant.selection.main) || variant.selection.main.length === 0) {
    return {
      exercises: session.exercises ?? [],
      estimatedMinutes: variantDuration,
      variantLabel,
      variantIndex,
      resolvedFrom: 'variant_hollow',
    }
  }

  // Happy path: materialize variant body with identity preservation.
  const fullExercises = session.exercises ?? []
  const originalById = new Map<string, (typeof fullExercises)[number]>()
  const originalByName = new Map<string, (typeof fullExercises)[number]>()
  for (const ex of fullExercises) {
    if (ex?.id) originalById.set(ex.id, ex)
    if (ex?.name) originalByName.set(normKey(ex.name), ex)
  }

  const variantExercises = variant.selection.main.map((sel, idx) => {
    const selEx = sel.exercise as unknown as {
      id?: string
      name?: string
      category?: string
      method?: string
      methodLabel?: string
      blockId?: string
      setExecutionMethod?: 'cluster' | 'rest_pause' | 'top_set' | 'drop_set'
    }
    const selExId = selEx?.id
    const selExName = selEx?.name || (sel as unknown as { name?: string }).name

    const matched =
      (selExId && originalById.get(selExId)) ||
      (selExName && originalByName.get(normKey(selExName))) ||
      null

    const base =
      matched ??
      ({
        id: selExId || `variant-${variantIndex}-${idx}`,
        name: selExName || 'Exercise',
        category: selEx?.category || 'general',
        sets: sel.sets,
        repsOrTime: sel.repsOrTime,
        note: (sel as unknown as { note?: string }).note || '',
        isOverrideable: true,
        selectionReason: sel.selectionReason || '',
      } as (typeof fullExercises)[number])

    return {
      ...base,
      // Overlay variant-specific prescription
      sets: sel.sets ?? base.sets,
      repsOrTime: sel.repsOrTime ?? base.repsOrTime,
      note: (sel as unknown as { note?: string }).note ?? (base as { note?: string }).note,
      selectionReason: sel.selectionReason ?? (base as { selectionReason?: string }).selectionReason,
      targetRPE:
        (sel as unknown as { targetRPE?: unknown }).targetRPE ??
        (base as { targetRPE?: unknown }).targetRPE,
      restSeconds:
        (sel as unknown as { restSeconds?: unknown }).restSeconds ??
        (base as { restSeconds?: unknown }).restSeconds,
      wasAdapted:
        (sel as unknown as { wasAdapted?: unknown }).wasAdapted ??
        (base as { wasAdapted?: unknown }).wasAdapted,
      coachingMeta:
        (sel as unknown as { coachingMeta?: unknown }).coachingMeta ??
        (base as { coachingMeta?: unknown }).coachingMeta,
      // Grouped-truth carry: variant-decorated wins, original is fallback
      method: selEx?.method ?? (base as { method?: string }).method,
      methodLabel: selEx?.methodLabel ?? (base as { methodLabel?: string }).methodLabel,
      blockId: selEx?.blockId ?? (base as { blockId?: string }).blockId,
      setExecutionMethod:
        selEx?.setExecutionMethod ?? (base as { setExecutionMethod?: string }).setExecutionMethod,
      // ====================================================================
      // [SELECTED-VARIANT-PRESCRIPTION-AUTHORITY] Strip leaked week-scaled
      // dosage fields from the full-session base.
      //
      // The route-side `loadAuthoritativeSession` decorates every full-session
      // exercise with `scaledSets / scaledReps / scaledTargetRPE /
      // scaledRestPeriod / scaledHoldDuration` (and `weekScalingApplied`)
      // computed against the FULL-SESSION baseline. Those values are
      // intentionally NOT computed for variant bodies (the variant's own
      // sets/reps/RPE/rest are already the authoritative dosage for that
      // selected length). When `buildSelectedVariantMain` runs at the route
      // and matches a variant row to its full-session base via id/name, the
      // `...base` spread above silently inherits those `scaled*` fields onto
      // the variant exercise.
      //
      // Downstream, `getEffectiveExerciseValues` in StreamlinedWorkoutSession
      // (and the matching helper in AdaptiveSessionCard) reads
      //   scaled.scaledSets ?? exercise.sets
      // i.e. scaled fields WIN over the variant's `sets`. Result: live
      // workout 45/30 booted into full-session week-scaled dosage (5x8s /
      // 5x4-6) instead of the variant's reduced dosage shown on the card.
      //
      // The card itself never hit this leak because the parent program page
      // hands the card a raw (un-scaled) session; the card's
      // buildSelectedVariantMain call therefore had no `scaled*` fields on
      // its base to leak. Fixing only the route would leave the two
      // surfaces re-derived. Fixing it inside the shared builder keeps
      // ONE owner of selected-variant truth and guarantees parity:
      //   - card variant body  -> no scaled*, falls through to variant.sets
      //   - route variant body -> no scaled*, falls through to variant.sets
      // ====================================================================
      scaledSets: undefined,
      scaledReps: undefined,
      scaledTargetRPE: undefined,
      scaledRestPeriod: undefined,
      scaledHoldDuration: undefined,
      weekScalingApplied: undefined,
    } as (typeof fullExercises)[number]
  })

  return {
    exercises: variantExercises,
    estimatedMinutes: variantDuration,
    variantLabel,
    variantIndex,
    resolvedFrom: 'variant',
  }
}

// ============================================================================
// FINGERPRINT
// ============================================================================

export interface BuildFingerprintInput {
  variantIndex: number
  /** [PEX-5A] Authoritative mode; if omitted, derived from estimatedMinutes. Supports 10/15/20/30/45/full. */
  mode?: WorkoutExecutionMode | null
  exercises: { id?: string | null; name?: string | null; sets?: number | null }[]
  estimatedMinutes?: number | null
}

export function buildSessionFingerprint(input: BuildFingerprintInput): SessionFingerprint {
  const exs = Array.isArray(input.exercises) ? input.exercises : []
  const first = exs[0]
  const last = exs[exs.length - 1]
  const totalSets = exs.reduce((s, e) => s + (typeof e?.sets === 'number' ? e.sets : 0), 0)
  const ids = exs.map(e => (typeof e?.id === 'string' && e.id ? e.id : '')).filter(Boolean)
  const resolvedMode =
    input.mode && input.mode !== null
      ? input.mode
      : modeFromMinutes(typeof input.estimatedMinutes === 'number' ? input.estimatedMinutes : null)
  return {
    mode: resolvedMode,
    variantIndex: input.variantIndex,
    exerciseCount: exs.length,
    firstId: (first?.id as string | undefined) ?? null,
    firstName: (first?.name as string | undefined) ?? null,
    lastId: (last?.id as string | undefined) ?? null,
    lastName: (last?.name as string | undefined) ?? null,
    totalSets,
    estimatedMinutes:
      typeof input.estimatedMinutes === 'number' ? input.estimatedMinutes : null,
    exerciseIds: ids,
  }
}

// ============================================================================
// FINGERPRINT COMPARISON
// ============================================================================

export function compareFingerprints(
  expected: SessionFingerprint | null | undefined,
  actual: SessionFingerprint | null | undefined
): FingerprintComparison {
  if (!expected || !actual) {
    return {
      ok: false,
      mismatches: [!expected ? 'no_expected_fingerprint' : 'no_actual_fingerprint'],
    }
  }
  const mismatches: string[] = []
  if (expected.mode !== actual.mode) mismatches.push(`mode(${expected.mode}!=${actual.mode})`)
  if (expected.variantIndex !== actual.variantIndex)
    mismatches.push(`variantIndex(${expected.variantIndex}!=${actual.variantIndex})`)
  if (expected.exerciseCount !== actual.exerciseCount)
    mismatches.push(`exerciseCount(${expected.exerciseCount}!=${actual.exerciseCount})`)
  if (expected.firstId !== actual.firstId)
    mismatches.push(`firstId(${expected.firstId}!=${actual.firstId})`)
  if (expected.lastId !== actual.lastId)
    mismatches.push(`lastId(${expected.lastId}!=${actual.lastId})`)
  if (expected.totalSets !== actual.totalSets)
    mismatches.push(`totalSets(${expected.totalSets}!=${actual.totalSets})`)
  if (expected.estimatedMinutes !== actual.estimatedMinutes)
    mismatches.push(`estimatedMinutes(${expected.estimatedMinutes}!=${actual.estimatedMinutes})`)
  // Order-sensitive id list
  if (expected.exerciseIds.length !== actual.exerciseIds.length) {
    mismatches.push(`exerciseIds.length(${expected.exerciseIds.length}!=${actual.exerciseIds.length})`)
  } else {
    for (let i = 0; i < expected.exerciseIds.length; i++) {
      if (expected.exerciseIds[i] !== actual.exerciseIds[i]) {
        mismatches.push(`exerciseIds[${i}](${expected.exerciseIds[i]}!=${actual.exerciseIds[i]})`)
        break // first divergence is enough to surface
      }
    }
  }
  return { ok: mismatches.length === 0, mismatches }
}

// ============================================================================
// SESSION STORAGE BRIDGE
// ============================================================================

/**
 * [PROGRAM-TO-LIVE MIRROR CONTRACT] The exact visible main-body snapshot the
 * Program card resolved right before router.push. This is NOT a fingerprint
 * (thin audit surface) -- it is the authoritative boot payload the live
 * workout route consumes DIRECTLY when valid. It exists so the card and the
 * route no longer independently call `buildSelectedVariantMain` against
 * potentially-diverging session inputs (program-state vs loadAuthoritativeSession)
 * and silently end up with two different bodies for the same requested
 * (day, variantIndex, week, mode) tuple.
 *
 * Required fields:
 *   - executionMode : 'full' | '45_min' | '30_min' authoritative mode
 *   - weekNumber    : selected week the card displayed dosage for
 *   - variantIndex  : canonical variant idx (mirrors URL ?variant=)
 *   - variantLabel  : "Full Session" / "45 Min" / "30 Min"
 *   - estimatedMinutes : the exact minutes shown on the card for this mode
 *   - exercises     : the card's visible main-body exercises in render order,
 *                     with every field the live workout reads
 *                     (id, name, category, sets, repsOrTime, note,
 *                      isOverrideable, selectionReason, prescribedLoad,
 *                      targetRPE, restSeconds, method, methodLabel, blockId,
 *                      setExecutionMethod, wasAdapted, coachingMeta). Scaled
 *                      dosage is NOT re-applied downstream -- the snapshot
 *                      already reflects the card's authoritative display.
 */
export interface SelectedBodySnapshot {
  /** [PEX-5A] Execution mode - now supports 10/15/20/30/45/full */
  executionMode: WorkoutExecutionMode
  weekNumber: number | null
  variantIndex: number
  variantLabel: string
  estimatedMinutes: number
  exercises: AdaptiveSession['exercises']
  /**
   * [MIRROR-CORRIDOR-LOCKDOWN] The card's already-pruned styleMetadata for
   * this exact selected body. When the card's selected body narrows to a
   * variant, the full-session `styleMetadata.styledGroups` still references
   * exercises that have been dropped from the visible body. Feeding the
   * unpruned metadata downstream makes StreamlinedWorkoutSession's
   * executionPlan builder produce blocks whose `memberExerciseIndexes`
   * don't correspond to the visible exercise array, and the live machine's
   * member-advance path (live-workout-machine.ts:1208) then jumps to
   * wrong/ghost exercises -- i.e. grouped metadata becomes a SHADOW OWNER
   * of exercise order, which is exactly the failure mode the mirror
   * contract must eliminate.
   *
   * The card already computes `variantPrunedStyleMetadata` (see
   * AdaptiveSessionCard.tsx) which filters styledGroups to only members
   * present in the visible body and drops under-minimum groups. Stamping
   * that pruned object into the snapshot is what lets the live workout's
   * executionPlan builder derive from the SAME grouped owner the card
   * rendered from -- byte-identical order and grouping in live runtime.
   *
   * Semantics:
   *   - undefined : snapshot was stamped before mirror-lockdown, or no
   *                 styleMetadata exists upstream at all. Route falls back
   *                 to whatever `finalSession.styleMetadata` is already
   *                 populated from the loader (the pre-lockdown behavior).
   *   - null      : card intentionally has no grouped metadata for this
   *                 selected body (e.g. all groups were pruned away, or
   *                 the session is all-straight). Route should CLEAR
   *                 finalSession.styleMetadata so downstream derives a
   *                 flat executionPlan from the snapshot exercises only.
   *   - object    : card's authoritative pruned styleMetadata. Route
   *                 should assign it directly into finalSession.
   *
   * Loose `unknown` typing here matches the optional/session-level shape
   * already used by `sessionAny.styleMetadata` in StreamlinedWorkoutSession's
   * safe-contract normalizer. No type coupling on the upstream
   * SessionStyleMetadata shape is added by this module.
   */
  styleMetadata?: unknown | null
  
  /**
   * [AB20.4.5.4.2] The card's already-pruned methodStructures for this exact
   * selected body. methodStructures is the canonical Phase 4P structure the
   * live-grouped-execution-contract uses to build executable Circuit/Superset/
   * Density blocks via buildExecutionBlocksFromMethodStructures(). When a
   * variant prunes exercises, we must also prune methodStructures so the live
   * runtime only tries to bind members that actually exist in the variant body.
   *
   * Semantics:
   *   - undefined : snapshot was stamped before AB20.4.5.4.2, or no
   *                 methodStructures exists upstream. Route falls back to
   *                 whatever finalSession.methodStructures is already
   *                 populated from the loader.
   *   - null      : card intentionally has no methodStructures for this
   *                 selected body (e.g. all structures were pruned, or session
   *                 has no grouped methods). Route should CLEAR
   *                 finalSession.methodStructures.
   *   - array     : card's authoritative pruned methodStructures. Route
   *                 should assign it directly into finalSession.
   *
   * Loose `unknown` typing matches the pattern used for styleMetadata above.
   */
  methodStructures?: unknown | null
}

export interface LaunchFingerprintPayload {
  dayNumber: number | string
  variantIndex: number
  stampedAt: string
  fingerprint: SessionFingerprint
  /** Source tag from the card build (variant / full / missing / hollow). */
  resolvedFrom: SelectedVariantMainResult['resolvedFrom']
  /** The exact URL pushed by the card; pure audit surface. */
  launchUrl: string
  /**
   * [PROGRAM-TO-LIVE MIRROR CONTRACT] Full visible main-body snapshot, used
   * by the live workout route as the primary boot source. Absent (undefined)
   * is tolerated for backward-compat with older stamps (payload.fingerprint
   * alone still yields the parity diagnostic); when absent, the route falls
   * back to loader + buildSelectedVariantMain re-derivation. When present
   * AND structurally valid, the route boots from this payload directly.
   */
  selectedBody?: SelectedBodySnapshot
}

// ============================================================================
// SNAPSHOT VALIDATION
// ============================================================================

export interface SnapshotValidation {
  valid: boolean
  /** Null when valid. One short reason string when invalid. */
  reason:
    | null
    | 'snapshot_missing'
    | 'snapshot_not_object'
    | 'exercises_not_array'
    | 'exercises_empty'
    | 'exercise_row_missing_id_or_name'
    | 'exercises_order_mismatch_fingerprint'
    | 'resolvedFrom_divergent'
    | 'variantIndex_mismatch'
    | 'executionMode_invalid'
  /** Diagnostic counters for the log. */
  detail: {
    hasSelectedBody: boolean
    exerciseCount: number | null
    fingerprintIdCount: number | null
    firstMismatchIndex: number | null
  }
}

/**
 * Validate a stamped launch payload for direct snapshot-boot.
 *
 * Strictness is intentional: any structural weakness drops the route back
 * to its legacy loader+builder fallback path. A "close but not exact"
 * snapshot is NOT allowed to boot the live workout because the whole point
 * of the mirror contract is exact parity with the visible Program card.
 *
 * Checks:
 *   1. selectedBody exists and is an object
 *   2. selectedBody.exercises is a non-empty array
 *   3. every exercise row has a non-empty id AND a non-empty name
 *   4. the ordered ids in selectedBody.exercises match the ordered ids in
 *      the companion fingerprint (internal consistency)
 *   5. resolvedFrom is 'variant' or 'full' (NOT 'variant_missing' /
 *      'variant_hollow' -- those are explicit divergence markers and must
 *      not snapshot-boot)
 *   6. variantIndex matches between snapshot and payload
 *   7. executionMode is a known value
 */
export function validateSelectedBodySnapshot(
  payload: LaunchFingerprintPayload | null | undefined
): SnapshotValidation {
  const detail: SnapshotValidation['detail'] = {
    hasSelectedBody: false,
    exerciseCount: null,
    fingerprintIdCount: null,
    firstMismatchIndex: null,
  }
  if (!payload) return { valid: false, reason: 'snapshot_missing', detail }
  const sb = payload.selectedBody
  if (!sb || typeof sb !== 'object') {
    return { valid: false, reason: 'snapshot_missing', detail }
  }
  detail.hasSelectedBody = true

  if (!Array.isArray(sb.exercises)) {
    return { valid: false, reason: 'exercises_not_array', detail }
  }
  detail.exerciseCount = sb.exercises.length
  if (sb.exercises.length === 0) {
    return { valid: false, reason: 'exercises_empty', detail }
  }

  for (let i = 0; i < sb.exercises.length; i++) {
    const row = sb.exercises[i] as unknown as { id?: unknown; name?: unknown }
    const hasId = typeof row?.id === 'string' && row.id.length > 0
    const hasName = typeof row?.name === 'string' && row.name.length > 0
    if (!hasId || !hasName) {
      detail.firstMismatchIndex = i
      return { valid: false, reason: 'exercise_row_missing_id_or_name', detail }
    }
  }

  // Internal consistency vs fingerprint (same stamp, same card build).
  const fpIds = Array.isArray(payload.fingerprint?.exerciseIds)
    ? payload.fingerprint.exerciseIds
    : []
  detail.fingerprintIdCount = fpIds.length
  // Fingerprint only stamps non-empty ids; snapshot iterator above already
  // guaranteed every row has a non-empty id, so lengths must match.
  if (fpIds.length !== sb.exercises.length) {
    return { valid: false, reason: 'exercises_order_mismatch_fingerprint', detail }
  }
  for (let i = 0; i < fpIds.length; i++) {
    const snapId = (sb.exercises[i] as unknown as { id?: string })?.id
    if (fpIds[i] !== snapId) {
      detail.firstMismatchIndex = i
      return { valid: false, reason: 'exercises_order_mismatch_fingerprint', detail }
    }
  }

  if (payload.resolvedFrom !== 'variant' && payload.resolvedFrom !== 'full') {
    return { valid: false, reason: 'resolvedFrom_divergent', detail }
  }

  if (sb.variantIndex !== payload.variantIndex) {
    return { valid: false, reason: 'variantIndex_mismatch', detail }
  }

  if (
    sb.executionMode !== 'full' &&
    sb.executionMode !== '45_min' &&
    sb.executionMode !== '30_min'
  ) {
    return { valid: false, reason: 'executionMode_invalid', detail }
  }

  return { valid: true, reason: null, detail }
}

export function stampLaunchFingerprint(payload: LaunchFingerprintPayload): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      storageKey(payload.dayNumber, payload.variantIndex),
      JSON.stringify(payload)
    )
  } catch {
    // sessionStorage unavailable - silent. Parity chip will report
    // no_expected_fingerprint, which is the correct honest signal.
  }
}

export function readLaunchFingerprint(
  day: number | string,
  variantIndex: number
): LaunchFingerprintPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(storageKey(day, variantIndex))
    if (!raw) return null
    const parsed = JSON.parse(raw) as LaunchFingerprintPayload
    if (!parsed || typeof parsed !== 'object') return null
    if (!parsed.fingerprint || typeof parsed.fingerprint !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

// ============================================================================
// [AB10 — START WORKOUT RUNTIME PARITY LOCK]
// ============================================================================
//
// AB10 sits on top of the existing PROGRAM-TO-LIVE MIRROR CONTRACT (snapshot
// boot + fingerprint diff) and converts it from "logs-only" into an explicit,
// JSON-safe runtime proof object that survives into the live workout UI/DOM
// surface. AB9 proves Program-card rule population. AB10 proves that the
// EXACT body the Program card stamped is the body Start Workout actually
// executes -- or, if it can't, that the fallback is honest and visible.
//
// AB10 owns three new artefacts:
//
//   1. `AB10RuntimeParityProof` (this contract)
//        Built by the workout route AFTER snapshot validation + parity
//        comparison. Forwarded to StreamlinedWorkoutSession as a prop so the
//        live workout can render a compact visible chip and stamp DOM
//        proof attributes (`data-ab10-runtime-parity`, `data-ab10-boot-source`,
//        etc.) on a stable wrapper. JSON-safe so future surfaces (post-
//        workout summary, telemetry) can consume it without re-deriving.
//
//   2. `AB10LaunchProof` (this contract)
//        Sibling sessionStorage payload stamped by AdaptiveSessionCard right
//        before `router.push(selectedLaunchUrl)`. PURELY DIAGNOSTIC -- the
//        authoritative launch body is still `LaunchFingerprintPayload.selectedBody`.
//
//   3. `data-ab10-*` DOM proof attributes (see StreamlinedWorkoutSession)
//        Stamped on the live workout wrapper. Visible to the user (via the
//        Runtime parity chip), to QA (via DOM inspection), and to future
//        regression scans without coupling to any UI string.
//
// Non-negotiables:
//   - AB10 NEVER becomes the source of truth.
//   - AB10 NEVER silently rescues a mismatch.
//   - AB10 NEVER requires the proof on legacy saved sessions.
// ============================================================================

export const AB10_RUNTIME_PARITY_VERSION = 'ab10-start-workout-runtime-parity-v1' as const

export interface AB10RuntimeParityProof {
  version: typeof AB10_RUNTIME_PARITY_VERSION
  bootSource: 'visible_snapshot' | 'fallback_loaded_session' | 'unknown'
  snapshotValid: boolean
  snapshotValidationReason: string
  dayNumber: number | null
  variantIndex: number | null
  executionMode: string | null
  weekNumber: number | null
  expectedExerciseCount: number
  actualExerciseCount: number
  expectedFirstExerciseId: string | null
  actualFirstExerciseId: string | null
  expectedLastExerciseId: string | null
  actualLastExerciseId: string | null
  parityOk: boolean
  parityMismatches: string[]
  groupedRuntimeExpected: boolean
  groupedRuntimeBuilt: boolean
  rowLevelMethodCount: number
  styleMetadataSource:
    | 'selected_body_object'
    | 'selected_body_cleared'
    | 'loader_fallback'
    | 'absent'
    | 'unknown'
  createdAt: string
  /**
   * [AB18] Session coaching handoff from AB10LaunchProof. When present,
   * the live workout displays a compact coaching focus derived from the
   * same AB17 truth the Program day card shows. Read-only display only.
   */
  sessionCoaching?: AB18SessionCoachingHandoff | null
}

export interface BuildAB10RuntimeParityProofInput {
  bootSource: AB10RuntimeParityProof['bootSource']
  snapshotValid: boolean
  snapshotValidationReason: string
  dayNumber: number | null
  variantIndex: number | null
  executionMode: string | null
  weekNumber: number | null
  expectedExercises: ReadonlyArray<{ id?: string | null }>
  actualExercises: ReadonlyArray<{
    id?: string | null
    method?: string | null
    methodLabel?: string | null
    blockId?: string | null
    setExecutionMethod?: string | null
  }>
  parityComparison: FingerprintComparison | null
  groupedRuntimeExpected: boolean
  groupedRuntimeBuilt: boolean
  styleMetadataSource: AB10RuntimeParityProof['styleMetadataSource']
  /** [AB18] Session coaching from AB10LaunchProof.sessionCoaching */
  sessionCoaching?: AB18SessionCoachingHandoff | null
}

/**
 * Builds the JSON-safe runtime parity proof. `parityOk` is true ONLY when the
 * snapshot path won AND every observable shape matches. Fallback boot is
 * NEVER reported as parityOk, even if it happens to coincide with the
 * expected body, because there is no proof surface guaranteeing that.
 */
export function buildAB10RuntimeParityProof(
  input: BuildAB10RuntimeParityProofInput
): AB10RuntimeParityProof {
  const expected = Array.isArray(input.expectedExercises) ? input.expectedExercises : []
  const actual = Array.isArray(input.actualExercises) ? input.actualExercises : []
  const expectedFirst = expected[0]?.id ?? null
  const expectedLast = expected.length > 0 ? (expected[expected.length - 1]?.id ?? null) : null
  const actualFirst = actual[0]?.id ?? null
  const actualLast = actual.length > 0 ? (actual[actual.length - 1]?.id ?? null) : null

  const fingerprintOk =
    input.parityComparison === null ? true : input.parityComparison.ok
  const parityOk =
    input.bootSource === 'visible_snapshot' &&
    input.snapshotValid &&
    expected.length > 0 &&
    expected.length === actual.length &&
    expectedFirst !== null &&
    expectedFirst === actualFirst &&
    expectedLast !== null &&
    expectedLast === actualLast &&
    fingerprintOk

  const parityMismatches = Array.isArray(input.parityComparison?.mismatches)
    ? [...input.parityComparison!.mismatches]
    : []

  let rowLevelMethodCount = 0
  for (const ex of actual) {
    if (
      (typeof ex?.method === 'string' && ex.method.length > 0) ||
      (typeof ex?.methodLabel === 'string' && ex.methodLabel.length > 0) ||
      (typeof ex?.blockId === 'string' && ex.blockId.length > 0) ||
      (typeof ex?.setExecutionMethod === 'string' && ex.setExecutionMethod.length > 0)
    ) {
      rowLevelMethodCount += 1
    }
  }

  return {
    version: AB10_RUNTIME_PARITY_VERSION,
    bootSource: input.bootSource,
    snapshotValid: input.snapshotValid,
    snapshotValidationReason: input.snapshotValidationReason,
    dayNumber: input.dayNumber,
    variantIndex: input.variantIndex,
    executionMode: input.executionMode,
    weekNumber: input.weekNumber,
    expectedExerciseCount: expected.length,
    actualExerciseCount: actual.length,
    expectedFirstExerciseId: expectedFirst,
    actualFirstExerciseId: actualFirst,
    expectedLastExerciseId: expectedLast,
    actualLastExerciseId: actualLast,
    parityOk,
    parityMismatches,
    groupedRuntimeExpected: !!input.groupedRuntimeExpected,
    groupedRuntimeBuilt: !!input.groupedRuntimeBuilt,
    rowLevelMethodCount,
    styleMetadataSource: input.styleMetadataSource,
    createdAt: new Date().toISOString(),
    // [AB18] Pass through session coaching for live workout display
    sessionCoaching: input.sessionCoaching ?? null,
  }
}

/**
 * Defensive reader for downstream consumers. Returns the proof unchanged if
 * structurally valid; otherwise returns a safe "unknown" proof so the UI
 * never crashes on legacy saved sessions that predate AB10.
 */
export function safeAB10RuntimeParityProof(
  proof: AB10RuntimeParityProof | null | undefined
): AB10RuntimeParityProof {
  if (
    proof &&
    typeof proof === 'object' &&
    (proof as AB10RuntimeParityProof).version === AB10_RUNTIME_PARITY_VERSION
  ) {
    return proof
  }
  return {
    version: AB10_RUNTIME_PARITY_VERSION,
    bootSource: 'unknown',
    snapshotValid: false,
    snapshotValidationReason: 'no_proof',
    dayNumber: null,
    variantIndex: null,
    executionMode: null,
    weekNumber: null,
    expectedExerciseCount: 0,
    actualExerciseCount: 0,
    expectedFirstExerciseId: null,
    actualFirstExerciseId: null,
    expectedLastExerciseId: null,
    actualLastExerciseId: null,
    parityOk: false,
    parityMismatches: [],
    groupedRuntimeExpected: false,
    groupedRuntimeBuilt: false,
    rowLevelMethodCount: 0,
    styleMetadataSource: 'unknown',
    createdAt: new Date(0).toISOString(),
    // [AB18-D] Default to null for missing/legacy proofs
    sessionCoaching: null,
  }
}

export function getAB10ProofFromSession(source: unknown): AB10RuntimeParityProof | null {
  if (!source || typeof source !== 'object') return null
  const candidate = (source as { ab10RuntimeParityProof?: unknown }).ab10RuntimeParityProof
  if (
    candidate &&
    typeof candidate === 'object' &&
    (candidate as AB10RuntimeParityProof).version === AB10_RUNTIME_PARITY_VERSION
  ) {
    return candidate as AB10RuntimeParityProof
  }
  return null
}

// ============================================================================
// [AB10] LAUNCH PROOF (sessionStorage diagnostic only)
// ============================================================================

const AB10_LAUNCH_PROOF_PREFIX = 'spartanlab:ab10_launch_proof'

function ab10LaunchProofKey(dayNumber: number | string, variantIndex: number): string {
  return `${AB10_LAUNCH_PROOF_PREFIX}:${dayNumber}:${variantIndex}`
}

/**
 * [AB18] Session-level training style coaching handoff shape.
 * Passed through AB10LaunchProof so live workout can display the same
 * session coaching truth that the Program day card shows. Read-only
 * display — never affects live adaptation decisions.
 */
export interface AB18SessionCoachingHandoff {
  /** The resolved training style mode (e.g., "skill_focused"). */
  styleMode: string
  /** One-line coaching explanation derived from AB17 per-day coaching. */
  coachingLine: string
  /** True when style actively shaped this specific session. */
  activeOnThisSession: boolean
  /** Methods the style favored that were applied on this session. */
  favoredMethodsApplied?: string[]
  /** Methods limited due to style-driven skill protection. */
  methodsLimitedForProtection?: string[]
}

export interface AB10LaunchProof {
  version: typeof AB10_RUNTIME_PARITY_VERSION
  dayNumber: number | string
  variantIndex: number
  /** [PEX-5A] Execution mode - now supports 10/15/20/30/45/full */
  executionMode: WorkoutExecutionMode
  weekNumber: number | null
  selectedBodyExerciseCount: number
  selectedBodyExerciseIds: string[]
  selectedBodyFirstName: string | null
  selectedBodyLastName: string | null
  selectedBodyEstimatedMinutes: number | null
  hasSelectedBodySnapshot: boolean
  hasPrunedStyleMetadata: boolean
  groupedMethodCount: number
  rowLevelMethodCount: number
  stampedAt: string
  /**
   * [AB18] Session-level training style coaching. Optional for backward
   * compatibility with older stamps. When present, live workout displays
   * this as a compact coaching focus line.
   */
  sessionCoaching?: AB18SessionCoachingHandoff | null
}

export function stampAB10LaunchProof(proof: AB10LaunchProof): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      ab10LaunchProofKey(proof.dayNumber, proof.variantIndex),
      JSON.stringify(proof)
    )
  } catch {
    if (typeof console !== 'undefined') {
      console.warn('[AB10] launch_proof_stamp_failed sessionStorage_unavailable')
    }
  }
}

// [AB18-D] Validate sessionCoaching shape defensively
function isValidAB18SessionCoaching(candidate: unknown): candidate is AB18SessionCoachingHandoff {
  if (!candidate || typeof candidate !== 'object') return false
  const c = candidate as Record<string, unknown>
  return (
    typeof c.styleMode === 'string' &&
    typeof c.coachingLine === 'string' &&
    typeof c.activeOnThisSession === 'boolean'
  )
}

export function readAB10LaunchProof(
  dayNumber: number | string,
  variantIndex: number
): AB10LaunchProof | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(ab10LaunchProofKey(dayNumber, variantIndex))
    if (!raw) return null
    const parsed = JSON.parse(raw) as AB10LaunchProof
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.version !== AB10_RUNTIME_PARITY_VERSION) return null
    // [AB18-D] Validate sessionCoaching shape - nullify if malformed
    if (parsed.sessionCoaching && !isValidAB18SessionCoaching(parsed.sessionCoaching)) {
      parsed.sessionCoaching = null
    }
    return parsed
  } catch {
    return null
  }
}
