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

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedVariantMainResult {
  /** The authoritative main-body exercises for the selected variant. */
  exercises: AdaptiveSession['exercises']
  /** Declared duration of the selected variant, or full session duration. */
  estimatedMinutes: number
  /** Human label ("Full Session" / "45 Min" / "30 Min"). */
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
  /** 'full' | '45_min' | '30_min' - derived from estimatedMinutes band. */
  mode: 'full' | '45_min' | '30_min'
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

function modeFromMinutes(min: number | null | undefined): 'full' | '45_min' | '30_min' {
  if (typeof min !== 'number') return 'full'
  if (min <= 35) return '30_min'
  if (min <= 50) return '45_min'
  return 'full'
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
  /** Optional URL executionMode hint used only when no variant duration is declared. */
  executionModeHint?: 'full' | '45_min' | '30_min' | null
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
    const modeMinutes =
      executionModeHint === '45_min' ? 45 : executionModeHint === '30_min' ? 30 : null
    return {
      exercises: session.exercises ?? [],
      estimatedMinutes:
        modeMinutes ?? (typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 60),
      variantLabel: executionModeHint === '45_min' ? '45 Min' : executionModeHint === '30_min' ? '30 Min' : 'Full Session',
      variantIndex,
      resolvedFrom: 'variant_missing',
    }
  }

  const variantDuration =
    typeof variant.duration === 'number' && variant.duration > 0
      ? variant.duration
      : executionModeHint === '45_min'
        ? 45
        : executionModeHint === '30_min'
          ? 30
          : typeof session.estimatedMinutes === 'number'
            ? session.estimatedMinutes
            : 60
  const variantLabel = variant.label || (variantDuration <= 35 ? '30 Min' : variantDuration <= 50 ? '45 Min' : 'Full Session')

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
  /** Authoritative mode; if omitted, derived from estimatedMinutes. */
  mode?: 'full' | '45_min' | '30_min' | null
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

export interface LaunchFingerprintPayload {
  dayNumber: number | string
  variantIndex: number
  stampedAt: string
  fingerprint: SessionFingerprint
  /** Source tag from the card build (variant / full / missing / hollow). */
  resolvedFrom: SelectedVariantMainResult['resolvedFrom']
  /** The exact URL pushed by the card; pure audit surface. */
  launchUrl: string
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
