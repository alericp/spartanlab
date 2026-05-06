/**
 * ============================================================================
 * AB13-10 — V0-COMPATIBLE VISUAL PROOF OVERLAY
 * ============================================================================
 *
 * Gated, owner-only visual proof surface that demonstrates the AB13 conservative
 * progression shaping chain end-to-end on the deployed Program page WITHOUT
 * mutating the user's saved program and WITHOUT affecting normal users.
 *
 * Why this exists:
 *   AB13-4..AB13-9 locked the static AB13 chain (program-level
 *   `evidenceCalibrationShapingProof` + row-level `evidenceCalibrationRpeCap`),
 *   but a deployed runtime visual confirmation requires triggering the exact
 *   gate condition `status === 'active'` AND `allowedToMutateProgram === true`
 *   AND `progressionAggressiveness === 'conservative'` AND ≥1 prescribed
 *   working-set row originally `targetRPE > 7`. Naturally producing that
 *   condition on a real account requires a specific evidence/log history
 *   that v0 cannot reliably reproduce.
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
 * What this is NOT:
 *   - NOT a second structural hook.
 *   - NOT AB14.
 *   - NOT a duplicate shaping helper.
 *   - NOT a Program-page local mutator — the user's `program` state is never
 *     written; the helper produces a NEW program reference that lives only
 *     inside this component's `useMemo`.
 *   - NOT a card that fakes the applied state — every value rendered comes
 *     from the helper's return value.
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
 *   5. The visible banner makes the overlay's verification-only purpose
 *      unmistakable.
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

  // Run the REAL shaping helper against the user's real program with the
  // synthetic active+conservative+allowed influence. The helper returns a
  // NEW program reference; the user's `program` state is never touched.
  // Memoized so a deployed account can navigate within the page without
  // re-running the helper on every render.
  const proofResult: EvidenceCalibrationShapingResult | null = useMemo(() => {
    if (!isProofModeRequested) return null
    if (!program) return null
    return applyConservativeProgressionShaping(program, SYNTHETIC_PROOF_INFLUENCE)
  }, [isProofModeRequested, program])

  // Build a real `EvidenceCoachRecommendationBundle` from the helper's real
  // output, so the EvidenceCoachRecommendationCard renders the SAME copy it
  // would render on a real account where conservative progression actually
  // fired. `plan: null` is supported by the helper's "Rule 1: nothing to
  // show" path; passing the synthetic influence + real shapingProof
  // produces the canonical AB13-6 program-shaping-proof line.
  const coachBundle = useMemo(() => {
    if (!proofResult) return null
    return deriveEvidenceCoachRecommendations({
      plan: null,
      influence: SYNTHETIC_PROOF_INFLUENCE,
      shapingProof: proofResult.shapingProof,
    })
  }, [proofResult])

  // Gate closed → render absolutely nothing.
  if (!isProofModeRequested) return null

  // Gate open but no program loaded → tell the owner what to do, but make
  // it unmistakably clear this is the proof overlay, not the real program.
  if (!program || !proofResult || !coachBundle) {
    return (
      <ProofOverlayShell>
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

  // Collect every row the REAL helper actually stamped. We deliberately
  // iterate the SHAPED program (`proofResult.program.sessions`) because the
  // stamp lives on the shaped row only — not on the user's pre-shaped row.
  // No `targetRPE === 7` inference; the predicate is "stamp present and
  // applied".
  const cappedRows: Array<{
    sessionLabel: string
    exercise: AdaptiveExercise
  }> = []
  for (const session of proofResult.program.sessions) {
    for (const ex of session.exercises) {
      if (ex.evidenceCalibrationRpeCap?.applied === true) {
        cappedRows.push({
          sessionLabel: session.dayLabel || `Day ${session.dayNumber}`,
          exercise: ex,
        })
      }
    }
  }

  const { shapingProof } = proofResult

  return (
    <ProofOverlayShell>
      {/* Honest one-line status from the real helper output. */}
      <p className="text-sm text-foreground/90">
        <span className="font-semibold">Helper result: </span>
        <span data-ab13-10-shaping-summary>{shapingProof.summary}</span>
      </p>

      {/* Render the real coach card with the real bundle. This is the same
          component and same path the production Program page uses to render
          the program-level shaping proof line. */}
      <div data-ab13-10-coach-card>
        <EvidenceCoachRecommendationCard bundle={coachBundle} />
      </div>

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
                  data-ab13-10-capped-row="true"
                >
                  <span className="text-xs text-muted-foreground shrink-0">
                    {sessionLabel}
                  </span>
                  <span className="truncate">{exercise.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    RPE {stamp.rpeAfter}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shrink-0 bg-teal-500/10 text-teal-300 border border-teal-500/30"
                    title={tooltip}
                    aria-label={tooltip}
                    data-ab13-10-row-rpe-cap="true"
                    data-ab13-10-rpe-before={stamp.rpeBefore}
                    data-ab13-10-rpe-after={stamp.rpeAfter}
                  >
                    RPE capped
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground" data-ab13-10-no-cap-required>
          The real helper ran with the proof influence but no row in your
          current program needed capping (every prescribed RPE was already
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
function ProofOverlayShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      role="region"
      aria-label="AB13 visual proof overlay"
      data-ab13-10-overlay="true"
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
