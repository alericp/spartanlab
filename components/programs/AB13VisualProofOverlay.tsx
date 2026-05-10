/**
 * ============================================================================
 * AB13-10 / AB13-11 / AB13-11B — V0-COMPATIBLE VISUAL PROOF OVERLAY
 * ============================================================================
 *
 * Gated, owner-only visual proof surface that demonstrates the AB13 conservative
 * progression shaping chain end-to-end on the deployed Program page WITHOUT
 * mutating the user's saved program and WITHOUT affecting normal users.
 *
 * AB13-11B status:
 *   AB13-11 was previously reported as complete, but a source audit confirmed
 *   the deterministic fixture fallback was NOT actually implemented in this
 *   file (it remained the AB13-10 single-mode overlay). AB13-11B reconciles
 *   that mismatch by actually shipping the two ordered proof modes:
 *     1. current-program  — the AB13-10 path
 *     2. fixture-fallback — the deterministic guaranteed-cap path
 *
 * Why this exists:
 *   AB13-4..AB13-9 locked the static AB13 chain (program-level
 *   `evidenceCalibrationShapingProof` + row-level `evidenceCalibrationRpeCap`),
 *   but a deployed runtime visual confirmation requires triggering the exact
 *   gate condition `status === 'active'` AND `allowedToMutateProgram === true`
 *   AND `progressionAggressiveness === 'conservative'` AND ≥1 prescribed
 *   working-set row originally `targetRPE > 7`. The first three are produced
 *   by a synthetic influence object below; the fourth condition is the one
 *   that fails when the user's loaded program has no eligible RPE>7 row, and
 *   that is exactly what the fixture fallback solves.
 *
 * What this is:
 *   - A SEPARATE, clearly-labeled proof section rendered next to the existing
 *     FeedbackLoopProofCard / EvidenceCoachRecommendationCard.
 *   - Activated ONLY by an explicit URL query flag `?ab13ProofOverlay=force-rpe-cap`.
 *   - Returns `null` (renders absolutely nothing) when the flag is absent.
 *     Normal users on every other URL are not affected at all.
 *   - Calls the REAL `applyConservativeProgressionShaping` helper from
 *     `lib/program/evidence-calibration-program-shaping.ts` (no duplicate
 *     helper, no fake mutation).
 *   - Renders the resulting program-level proof through the REAL
 *     `EvidenceCoachRecommendationCard` via the REAL
 *     `deriveEvidenceCoachRecommendations` helper.
 *   - Renders each row that the helper actually stamped with
 *     `evidenceCalibrationRpeCap` using the SAME chip text + Tailwind
 *     classes that `AdaptiveSessionCard` uses, derived ONLY from the
 *     stamp (no `targetRPE === 7` inference).
 *
 * Two ordered proof modes (AB13-11):
 *   1. CURRENT-PROGRAM mode runs the helper against the user's loaded
 *      program. If the helper produces ≥1 capped row, the overlay renders
 *      that result.
 *   2. FIXTURE-FALLBACK mode runs only when current-program produced zero
 *      capped rows. It immutably clones the loaded program, picks one
 *      non-warmup-style exercise, and sets that cloned exercise's
 *      `targetRPE` to 8. The CLONE (never the user's program) is then
 *      passed to the SAME real helper, which produces a real
 *      `evidenceCalibrationShapingProof` and a real
 *      `evidenceCalibrationRpeCap` stamp. The user's `program` reference
 *      is never read after cloning, never written, never persisted.
 *
 * What this is NOT:
 *   - NOT a second structural hook.
 *   - NOT AB14.
 *   - NOT a duplicate shaping helper.
 *   - NOT a Program-page local mutator — the user's `program` state is never
 *     written; the helper produces a NEW program reference that lives only
 *     inside this component's `useMemo`.
 *   - NOT a card that fakes the applied state — every value rendered comes
 *     from the helper's return value.
 *   - NOT a hand-written stamp producer — the only producer of the
 *     `evidenceCalibrationRpeCap` stamp anywhere in the codebase is the
 *     real helper. The overlay only seeds eligibility; the helper decides.
 *
 * Safety guarantees:
 *   1. Gate is `searchParams.get('ab13ProofOverlay') === 'force-rpe-cap'`.
 *      The exact-match value is intentionally unique so accidental access
 *      via crawlers, prefetch, or copy-pasted links is essentially
 *      impossible.
 *   2. Gate is read on the client via `useSearchParams`. When the flag is
 *      absent, this component renders `null` before any helper call runs.
 *   3. The synthetic `EvidenceCalibrationGenerationInfluence` is defined as
 *      a const inside this file and is NEVER exported; it is also NEVER
 *      written into the user's program object. It exists only as the second
 *      argument to `applyConservativeProgressionShaping` inside `useMemo`.
 *   4. The shaped program returned by the helper is consumed only by this
 *      component's render — it is never written to React state, never
 *      persisted, never returned to the parent.
 *   5. The fixture fallback clones the program structure with object spreads
 *      and `.map()` rebuilds; the original sessions array, the original
 *      session objects, and the original exercise objects are never written.
 *   6. The visible banner (and an explicit amber note in fixture-fallback
 *      mode) makes the overlay's verification-only purpose unmistakable.
 *
 * Removal:
 *   This entire feature can be removed by deleting this file and the
 *   single `<AB13VisualProofOverlay />` render site in
 *   `app/(app)/program/page.tsx`. No other file depends on it.
 */

'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AdaptiveExercise, AdaptiveProgram } from '@/lib/adaptive-program-builder'
import {
  applyConservativeProgressionShaping,
  type EvidenceCalibrationShapingResult,
} from '@/lib/program/evidence-calibration-program-shaping'
import type { EvidenceCalibrationGenerationInfluence } from '@/lib/program/evidence-calibration-generation-influence'
import { deriveEvidenceCoachRecommendations } from '@/lib/program/evidence-derived-coach-recommendations'
import { EvidenceCoachRecommendationCard } from './EvidenceCoachRecommendationCard'

// ---------------------------------------------------------------------------
// Gate constants
// ---------------------------------------------------------------------------

/**
 * URL query parameter key. The exact key + value combination is intentionally
 * unique so accidental access (search engines, prefetch, copy-paste of a
 * shortened URL) is essentially impossible. Owners verify by visiting:
 *
 *   /program?ab13ProofOverlay=force-rpe-cap
 */
const PROOF_FLAG_NAME = 'ab13ProofOverlay'
const PROOF_FLAG_VALUE = 'force-rpe-cap'

// ---------------------------------------------------------------------------
// Synthetic influence (verification-only, never exported, never persisted)
// ---------------------------------------------------------------------------

/**
 * A minimal, fully-typed `EvidenceCalibrationGenerationInfluence` that opens
 * the AB13-4 gate exactly:
 *
 *   status === 'active'
 *   allowedToMutateProgram === true
 *   progressionAggressiveness === 'conservative'
 *
 * This object is the SECOND argument to `applyConservativeProgressionShaping`
 * inside this overlay only. It is NOT exported. It is NOT written into any
 * `AdaptiveProgram.evidenceCalibrationInfluence` field. It exists solely so
 * the real helper sees the gate as open and produces real
 * `EvidenceCalibrationShapingProof` + real `EvidenceCalibrationRpeCapStamp`
 * stamps on whatever rows are actually eligible. The helper itself decides
 * what to mutate; we never hand-write a stamp.
 */
const SYNTHETIC_PROOF_INFLUENCE: EvidenceCalibrationGenerationInfluence = {
  status: 'active',
  sourceGovernorVersion: 'ab12-1-evidence-aware-calibration-governor',
  confidence: 'high',
  allowedToMutateProgram: true,
  progressionAggressiveness: 'conservative',
  volumeBias: null,
  intensityBias: null,
  recoveryBias: null,
  benchmarkRetestPrompt: false,
  appliedConstraints: ['progression: conservative'],
  suppressedConstraints: [],
  reasonSummary: [
    'AB13-10 visual proof overlay — verification fixture only.',
  ],
  proof: {
    label: 'AB13 visual proof overlay',
    summary:
      'Verification-only synthetic active+conservative+allowed influence; not stamped on the program.',
    chips: ['progression: conservative'],
  },
  influenceVersion: 'ab12-2-evidence-calibration-generation-influence',
}

// ---------------------------------------------------------------------------
// Fixture fallback constants
// ---------------------------------------------------------------------------

/**
 * Categories the fixture picker MUST NOT choose, mirroring the helper's own
 * `NON_PRESCRIPTIVE_CATEGORIES` set in
 * `lib/program/evidence-calibration-program-shaping.ts`. Picking from these
 * would cause the helper to (correctly) reject the row as ineligible and the
 * fallback would silently fail. Mirrored locally rather than imported so the
 * helper's internal contract stays internal — the overlay only needs the
 * picker to AVOID these categories; the helper remains the sole authority on
 * eligibility.
 *
 * Plus a few extra "obviously not a working set" tokens that are not in the
 * helper's set but are common in builder output and would still produce a
 * weird fixture experience (not "wrong", just confusing). The helper would
 * accept them — these are picker-quality-only, not eligibility filters.
 */
const FIXTURE_NON_PRESCRIPTIVE_CATEGORIES: ReadonlySet<string> = new Set([
  // Mirrored from the helper:
  'warmup',
  'warm-up',
  'warm_up',
  'cooldown',
  'cool-down',
  'cool_down',
  'mobility',
  'recovery',
  'prehab',
  'rehab',
  // Picker-quality only (helper would accept; we still avoid):
  'flexibility',
  'restorative',
  'breathing',
])

/**
 * RPE the fixture picker writes onto the cloned exercise. Strictly greater
 * than the helper's ceiling of 7 so the helper's eligibility check will
 * accept it. We deliberately use 8 (not 9 or 10) so the visible
 * before-and-after delta on the chip is small and obvious.
 */
const FIXTURE_TARGET_RPE_BEFORE = 8 as const

// ---------------------------------------------------------------------------
// Fixture builder — overlay-only, never exported, never persisted
// ---------------------------------------------------------------------------

interface FixturePickResult {
  fixtureProgram: AdaptiveProgram
  pickedSessionLabel: string
  pickedExerciseName: string
}

/**
 * Build a proof-only cloned program input that is guaranteed to contain at
 * least one eligible RPE>7 working-set row, IF the loaded program has any
 * exercise the picker considers acceptable.
 *
 * Immutability contract:
 *   - The original `program` reference is never written.
 *   - `program.sessions`, `program.sessions[i]`, and
 *     `program.sessions[i].exercises[j]` are never written.
 *   - The picked exercise is replaced with a fresh `{ ...exercise }` spread,
 *     and only its `targetRPE` is changed on the clone.
 *   - The session containing the picked exercise is replaced with a fresh
 *     spread `{ ...session, exercises: newExercises }` only on the clone.
 *   - The program is replaced with a fresh spread
 *     `{ ...program, sessions: newSessions }` only on the clone.
 *
 * Picker rules:
 *   - First exercise whose lowercased `category` is NOT in
 *     `FIXTURE_NON_PRESCRIPTIVE_CATEGORIES`.
 *   - Walks sessions in order, then exercises in order — deterministic.
 *
 * Returns `null` if no acceptable exercise exists in the loaded program.
 */
function buildFixtureProgram(program: AdaptiveProgram): FixturePickResult | null {
  let pickedSessionIndex = -1
  let pickedExerciseIndex = -1

  outer: for (let s = 0; s < program.sessions.length; s += 1) {
    const session = program.sessions[s]
    if (!session || !Array.isArray(session.exercises)) continue
    for (let e = 0; e < session.exercises.length; e += 1) {
      const ex = session.exercises[e]
      if (!ex) continue
      const category = (ex.category ?? '').toLowerCase()
      if (FIXTURE_NON_PRESCRIPTIVE_CATEGORIES.has(category)) continue
      // Acceptable candidate — pick it and stop walking.
      pickedSessionIndex = s
      pickedExerciseIndex = e
      break outer
    }
  }

  if (pickedSessionIndex === -1 || pickedExerciseIndex === -1) {
    return null
  }

  const pickedSession = program.sessions[pickedSessionIndex]
  const pickedExercise = pickedSession.exercises[pickedExerciseIndex]

  // Immutable clone of just the picked exercise. We set `targetRPE` to 8 so
  // the real helper's eligibility check accepts it; we also clear any prior
  // `evidenceCalibrationRpeCap` stamp from the source exercise so the
  // helper's stamp is unambiguously the one that ends up on the row.
  const newExercise: AdaptiveExercise = {
    ...pickedExercise,
    targetRPE: FIXTURE_TARGET_RPE_BEFORE,
    evidenceCalibrationRpeCap: undefined,
  }

  // Immutable clone of the picked session, replacing only the picked
  // exercise.
  const newExercises: AdaptiveExercise[] = pickedSession.exercises.map(
    (ex, i) => (i === pickedExerciseIndex ? newExercise : ex),
  )
  const newSession: AdaptiveProgram['sessions'][number] = {
    ...pickedSession,
    exercises: newExercises,
  }

  // Immutable clone of the program, replacing only the picked session.
  const newSessions: AdaptiveProgram['sessions'] = program.sessions.map(
    (session, i) => (i === pickedSessionIndex ? newSession : session),
  )
  const fixtureProgram: AdaptiveProgram = {
    ...program,
    sessions: newSessions,
    // Strip any previous shaping proof so the helper's proof on the
    // fixture is unambiguous. Optional field; safe to set to undefined.
    evidenceCalibrationShapingProof: undefined,
  }

  return {
    fixtureProgram,
    pickedSessionLabel:
      pickedSession.dayLabel || `Day ${pickedSession.dayNumber}`,
    pickedExerciseName: pickedExercise.name,
  }
}

// ---------------------------------------------------------------------------
// Resolved proof state (one of three discriminated cases)
// ---------------------------------------------------------------------------

type ProofMode = 'current-program' | 'fixture-fallback' | 'failed'

interface ResolvedProofSuccess {
  mode: 'current-program' | 'fixture-fallback'
  result: EvidenceCalibrationShapingResult
  cappedRows: Array<{ sessionLabel: string; exercise: AdaptiveExercise }>
  /** Only populated in fixture-fallback mode. */
  fixturePick?: { sessionLabel: string; exerciseName: string }
}

interface ResolvedProofFailed {
  mode: 'failed'
  reason: string
}

type ResolvedProof = ResolvedProofSuccess | ResolvedProofFailed

/**
 * Walk the helper's shaped program and collect every row whose
 * `evidenceCalibrationRpeCap` stamp is present and `applied === true`. This
 * is the ONLY way the overlay decides whether a row is "capped" — there is
 * no `targetRPE === 7` inference anywhere in this file.
 */
function collectCappedRows(
  result: EvidenceCalibrationShapingResult,
): Array<{ sessionLabel: string; exercise: AdaptiveExercise }> {
  const rows: Array<{ sessionLabel: string; exercise: AdaptiveExercise }> = []
  for (const session of result.program.sessions) {
    for (const ex of session.exercises) {
      if (ex.evidenceCalibrationRpeCap?.applied === true) {
        rows.push({
          sessionLabel: session.dayLabel || `Day ${session.dayNumber}`,
          exercise: ex,
        })
      }
    }
  }
  return rows
}

/**
 * Resolve the proof in two ordered modes:
 *   1. current-program — run helper against the loaded program; use if ≥1 cap.
 *   2. fixture-fallback — clone the program, seed one eligible row, run the
 *      helper; use if ≥1 cap.
 * If neither produces a real stamped row, return `failed` with a reason.
 */
function resolveProof(program: AdaptiveProgram): ResolvedProof {
  // Mode 1: current program.
  const currentResult = applyConservativeProgressionShaping(
    program,
    SYNTHETIC_PROOF_INFLUENCE,
  )
  const currentCapped = collectCappedRows(currentResult)
  if (currentCapped.length > 0) {
    return {
      mode: 'current-program',
      result: currentResult,
      cappedRows: currentCapped,
    }
  }

  // Mode 2: fixture fallback. Build a cloned proof input with one seeded
  // eligible row, then run the SAME real helper on the clone. The user's
  // `program` reference is unchanged.
  const fixturePick = buildFixtureProgram(program)
  if (!fixturePick) {
    return {
      mode: 'failed',
      reason:
        'No usable exercise shape: the loaded program contains no exercise outside the non-prescriptive category set, so the fixture picker could not seed a proof row.',
    }
  }
  const fixtureResult = applyConservativeProgressionShaping(
    fixturePick.fixtureProgram,
    SYNTHETIC_PROOF_INFLUENCE,
  )
  const fixtureCapped = collectCappedRows(fixtureResult)
  if (fixtureCapped.length === 0) {
    return {
      mode: 'failed',
      reason:
        'Fixture seeded an eligible RPE>7 row, but the real helper did not stamp evidenceCalibrationRpeCap on the returned program. Helper eligibility may have rejected the row, or the helper-program shape changed.',
    }
  }
  return {
    mode: 'fixture-fallback',
    result: fixtureResult,
    cappedRows: fixtureCapped,
    fixturePick: {
      sessionLabel: fixturePick.pickedSessionLabel,
      exerciseName: fixturePick.pickedExerciseName,
    },
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AB13VisualProofOverlayProps {
  /**
   * The user's currently loaded program from page state. The overlay reads
   * the program but NEVER writes to it. The overlay clones-and-shapes a
   * NEW program reference internally; the parent's reference is untouched.
   */
  program: AdaptiveProgram | null
}

/**
 * Gated AB13 visual proof overlay. Renders nothing unless the explicit URL
 * query flag is present.
 */
export function AB13VisualProofOverlay({ program }: AB13VisualProofOverlayProps) {
  const searchParams = useSearchParams()
  const isProofModeRequested =
    searchParams?.get(PROOF_FLAG_NAME) === PROOF_FLAG_VALUE

  // Resolve proof in two ordered modes inside one memo so a deployed account
  // can navigate within the page without re-running the helper twice on
  // every render. Both modes use the SAME real helper; the only difference
  // is whether the input was the user's program or an immutable clone with
  // one seeded eligible row.
  const resolved: ResolvedProof | null = useMemo(() => {
    if (!isProofModeRequested) return null
    if (!program) return null
    return resolveProof(program)
  }, [isProofModeRequested, program])

  // Build the real `EvidenceCoachRecommendationBundle` from the resolved
  // helper output, so the EvidenceCoachRecommendationCard renders the SAME
  // copy it would render on a real account where conservative progression
  // actually fired.
  const coachBundle = useMemo(() => {
    if (!resolved || resolved.mode === 'failed') return null
    return deriveEvidenceCoachRecommendations({
      plan: null,
      influence: SYNTHETIC_PROOF_INFLUENCE,
      shapingProof: resolved.result.shapingProof,
    })
  }, [resolved])

  // Gate closed → render absolutely nothing.
  if (!isProofModeRequested) return null

  // Gate open but no program loaded.
  if (!program) {
    return (
      <ProofOverlayShell proofMode="failed">
        <p className="text-sm text-muted-foreground">
          Proof overlay active, but no program is loaded yet. Generate or load
          a program first; the overlay will then run the real
          {' '}<code className="font-mono text-xs">applyConservativeProgressionShaping</code>{' '}
          helper against it with a synthetic active + conservative + allowed
          influence.
        </p>
      </ProofOverlayShell>
    )
  }

  // Failure state (both modes exhausted).
  if (!resolved || resolved.mode === 'failed') {
    return (
      <ProofOverlayShell proofMode="failed">
        <p className="text-sm font-semibold text-foreground">
          AB13 visual proof failed
        </p>
        <p className="text-sm text-muted-foreground">
          {resolved && resolved.mode === 'failed'
            ? resolved.reason
            : 'Proof could not be resolved. AB13 readiness for AB14 is NOT confirmed by this overlay.'}
        </p>
      </ProofOverlayShell>
    )
  }

  // Success: either current-program or fixture-fallback. Both render through
  // the same components and the same row-stamp predicate.
  const { mode, result, cappedRows } = resolved
  const { shapingProof } = result
  const isFixture = mode === 'fixture-fallback'

  return (
    <ProofOverlayShell proofMode={mode}>
      {/* Mode label. Always visible so the owner can never confuse fixture
          fallback proof with current-program proof. */}
      <p className="text-xs uppercase tracking-wider font-semibold text-amber-300">
        {isFixture
          ? 'AB13 proof mode: overlay fixture fallback'
          : 'AB13 proof mode: current program'}
      </p>

      {/* Fixture-fallback explanatory note. Only rendered in fixture mode so
          the owner is unmistakably aware the proof is from an isolated
          cloned input, not from their saved program. */}
      {isFixture && resolved.fixturePick && (
        <p className="text-sm text-foreground/90">
          Your current loaded program did not contain an eligible RPE &gt; 7 row,
          so this overlay created an isolated proof-only cloned input — picked{' '}
          <strong>{resolved.fixturePick.exerciseName}</strong> from{' '}
          <strong>{resolved.fixturePick.sessionLabel}</strong> and seeded its{' '}
          <code className="font-mono text-xs">targetRPE</code> to{' '}
          {FIXTURE_TARGET_RPE_BEFORE} on the clone before running the real
          helper. Your saved program was not modified.
        </p>
      )}

      {/* Honest one-line status from the real helper output. */}
      <p className="text-sm text-foreground/90">
        <span className="font-semibold">Helper result: </span>
        <span data-ab13-11-shaping-summary>{shapingProof.summary}</span>
      </p>

      {/* Render the real coach card with the real bundle. This is the same
          component and same path the production Program page uses to render
          the program-level shaping proof line. */}
      {coachBundle && (
        <div data-ab13-11-coach-card>
          <EvidenceCoachRecommendationCard bundle={coachBundle} />
        </div>
      )}

      {/* Row-level capped exercises. Same chip styling as
          AdaptiveSessionCard's AB13-7 chip; data sourced ONLY from
          `exercise.evidenceCalibrationRpeCap`. */}
      {shapingProof.appliedAtLeastOneMutation && cappedRows.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Capped exercise rows (from real{' '}
            <code className="font-mono">evidenceCalibrationRpeCap</code> stamps)
          </p>
          <ul className="flex flex-col gap-1.5">
            {cappedRows.map(({ sessionLabel, exercise }) => {
              const stamp = exercise.evidenceCalibrationRpeCap
              if (!stamp || stamp.applied !== true) return null
              const tooltip = stamp.reasonCoachLine
              return (
                <li
                  key={`${sessionLabel}-${exercise.id}`}
                  className="flex items-center gap-2 text-sm text-foreground/90"
                  data-ab13-11-capped-row="true"
                  data-ab13-11-proof-mode={mode}
                  data-ab13-11-rpe-before={stamp.rpeBefore}
                  data-ab13-11-rpe-after={stamp.rpeAfter}
                >
                  <span className="text-xs text-muted-foreground shrink-0">
                    {sessionLabel}
                  </span>
                  <span className="truncate">{exercise.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    RPE {Math.round(stamp.rpeAfter)}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 bg-teal-500/10 text-teal-300 border border-teal-500/30"
                    title={tooltip}
                    aria-label={tooltip}
                    data-ab13-11-row-rpe-cap="true"
                    data-ab13-11-rpe-before={stamp.rpeBefore}
                    data-ab13-11-rpe-after={stamp.rpeAfter}
                  >
                    RPE capped
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        // Should be unreachable in success modes (both are guarded by
        // cappedRows.length > 0 in resolveProof), but keep the honest
        // fallback so a future contract drift cannot silently render an
        // empty success card.
        <p className="text-sm text-muted-foreground" data-ab13-11-no-cap-required>
          The real helper ran with the proof influence but no row in this
          program needed capping (every prescribed RPE was already
          {' '}≤ {shapingProof.ceilingRpe}). This is the honest{' '}
          <em>checked / no cap required</em> state.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Remove the{' '}
        <code className="font-mono">?{PROOF_FLAG_NAME}={PROOF_FLAG_VALUE}</code>{' '}
        query parameter from the URL to hide this overlay. Your real saved
        program is not modified by this view.
      </p>
    </ProofOverlayShell>
  )
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

/**
 * Visual shell that makes the overlay's verification-only nature unmistakable.
 * Distinct accent + a clear header so the overlay can never be confused with
 * the user's real program shaping proof.
 */
function ProofOverlayShell({
  children,
  proofMode,
}: {
  children: React.ReactNode
  proofMode: ProofMode
}) {
  return (
    <section
      role="region"
      aria-label="AB13 visual proof overlay"
      data-ab13-10-overlay="true"
      data-ab13-11-proof-mode={proofMode}
      className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4"
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40">
          Proof overlay
        </span>
        <h3 className="text-sm font-semibold text-foreground">
          AB13 conservative progression shaping — visual verification
        </h3>
      </header>
      {children}
    </section>
  )
}
