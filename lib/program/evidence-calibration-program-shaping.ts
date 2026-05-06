/**
 * ============================================================================
 * AB13-4 — EVIDENCE CALIBRATION PROGRAM SHAPING (PROGRESSION AGGRESSIVENESS)
 * ============================================================================
 *
 * First real evidence-to-program structural shaping pass.
 *
 * AB12-1 produced the calibration plan.
 * AB12-2 produced the bounded `EvidenceCalibrationGenerationInfluence` and
 *   stamped it on the program. Until AB13-4 every structural constraint was
 *   suppressed because there was no audited builder consumer.
 * AB13-3 verified the proof / coach-card delivery chain.
 *
 * AB13-4 introduces exactly ONE structural consumer: `progressionAggressiveness`
 * with the `'conservative'` value. The standard/aggressive cases are NOT
 * implemented yet — keeping the safe direction (cap RPE) is the only direction
 * we are willing to take in this prompt because it cannot make a session
 * harder than the builder already prescribed.
 *
 * Contract guarantees:
 *
 *   1. Pure function. No I/O, no DB, no React, no `fetch`, no `localStorage`.
 *      Safe to call inside server actions and inside render paths.
 *   2. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
 *   3. Operates on a SHALLOW-CLONED program object. The caller's original
 *      reference is never mutated. Sessions and the exercises that get
 *      reshaped are also cloned (only the affected ones).
 *   4. Mutation gate is exact: the shaping pass runs ONLY when ALL three
 *      conditions hold:
 *         influence.status === 'active'
 *         influence.allowedToMutateProgram === true
 *         influence.progressionAggressiveness === 'conservative'
 *      Any other state — null, inactive, metadata_only, degraded, standard,
 *      aggressive — produces NO mutation and the helper returns the original
 *      program reference plus a `applied: false` proof object.
 *   5. The "conservative" effect is intentionally narrow: cap `targetRPE`
 *      to max 7 ONLY on exercises that ALREADY have a numeric `targetRPE`
 *      strictly greater than 7. We do NOT invent dosage where the builder
 *      did not prescribe it. We do NOT touch warmup/cooldown rows.
 *      We do NOT change sets, reps, exercise selection, schedule, weeks,
 *      blocks, methods, or skill progression — those are owned by separate
 *      builder phases and would be out of AB13-4 scope.
 *   6. Honest proof object. `cappedExerciseCount === 0` is allowed and is
 *      reported truthfully (the system checked but found nothing to cap).
 *   7. Idempotent. Re-running the helper with the same inputs returns the
 *      same proof and produces no further mutation.
 *
 * This file consumes ONLY:
 *   - `AdaptiveProgram` and `AdaptiveExercise` types from the builder.
 *   - `EvidenceCalibrationGenerationInfluence` from AB12-2.
 * It exports ONLY pure functions and a typed proof object.
 */

import type {
  AdaptiveProgram,
  AdaptiveSession,
  AdaptiveExercise,
} from '@/lib/adaptive-program-builder'
import type { EvidenceCalibrationGenerationInfluence } from './evidence-calibration-generation-influence'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Conservative RPE ceiling. Chosen to match the existing
 * `lib/adaptive-program-builder.ts` precedent for "soften" load (RPE 8 → 7
 * range, see line ~29429 / 29444 / 29534) so the shaping pass produces a
 * value the rest of the system already treats as safe.
 */
const CONSERVATIVE_RPE_CEILING = 7 as const

/**
 * Categories whose RPE we never cap because their dosage is owned by a
 * different doctrine (mobility / cooldown / warmup is supposed to be
 * intentionally low or, conversely, deliberately accommodated outside the
 * normal RPE scale).
 */
const NON_PRESCRIPTIVE_CATEGORIES: ReadonlySet<string> = new Set([
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
])

const SHAPING_VERSION =
  'ab13-4-evidence-calibration-conservative-progression' as const

// ---------------------------------------------------------------------------
// AB14 — Volume-bias materialization constants
// ---------------------------------------------------------------------------

/** AB14 only reduces rows with sets >= this value */
const VOLUME_REDUCTION_ELIGIBLE_MIN = 3 as const
/** AB14 never reduces below this floor */
const VOLUME_REDUCTION_FLOOR = 2 as const
/** Max rows reduced per session to avoid gutting a single session */
const VOLUME_REDUCTION_PER_SESSION_CAP = 2 as const

const VOLUME_SHAPING_VERSION = 'ab14-volume-bias-materialization' as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Compact proof object describing what the AB13-4 shaping pass actually did.
 * Stamped on the program (optional field on `AdaptiveProgram`) so any future
 * audit / UI consumer can verify the pass ran AND distinguish "active and
 * applied" from "active but nothing in the program needed capping".
 */
/**
 * AB14 volume-adjustment program-level proof.
 */
export interface EvidenceCalibrationVolumeAdjustmentProof {
  source: 'evidence_calibration_volume_bias_reduce'
  applied: boolean
  eligibleExerciseCount: number
  adjustedExerciseCount: number
  totalSetsRemoved: number
  volumeBias: 'reduce' | null
  reasonCode: 'volume_bias_reduce' | 'no_eligible_rows' | 'not_active' | 'not_allowed_to_mutate' | 'volume_bias_not_reduce'
  summary: string
}

export interface EvidenceCalibrationShapingProof {
  /** Stable audit stamp. */
  shapingVersion: typeof SHAPING_VERSION
  /**
   * True iff the helper actually ran a mutation (or attempted one and there
   * was nothing eligible to cap, but the gate was open). False means the
   * gate was closed (status not active, not allowed, not conservative).
   */
  ranShapingPass: boolean
  /**
   * True iff at least one `targetRPE` value was reduced. When the gate is
   * open but every prescribed RPE was already ≤ ceiling, this stays false
   * — the system is honest that nothing in the program needed adjusting.
   */
  appliedAtLeastOneMutation: boolean
  /** How many exercise rows had their `targetRPE` capped. */
  cappedExerciseCount: number
  /** RPE ceiling used by this pass. */
  ceilingRpe: number
  /**
   * Human-readable summary suitable for display surfaces. Always honest:
   * either describes the cap count or explains why no cap fired.
   */
  summary: string
  /**
   * Reason the pass did not run (gate closed). `null` when the gate was open.
   */
  skippedReason:
    | null
    | 'no_influence'
    | 'status_not_active'
    | 'not_allowed_to_mutate'
    | 'progression_not_conservative'
    | 'no_actionable_bias'
  /**
   * AB14 volume-adjustment sub-proof. Present when the AB14 gate was open.
   */
  volumeAdjustment?: EvidenceCalibrationVolumeAdjustmentProof
}

export interface EvidenceCalibrationShapingResult {
  /**
   * The (possibly cloned) program. When the shaping pass mutated anything,
   * this is a NEW object reference. Otherwise it's the same reference the
   * caller passed in.
   */
  program: AdaptiveProgram
  /** Always non-null. See `EvidenceCalibrationShapingProof`. */
  shapingProof: EvidenceCalibrationShapingProof
}

// ---------------------------------------------------------------------------
// AB13-7 — Row-level RPE cap provenance
// ---------------------------------------------------------------------------

/**
 * AB13-7 row-level mutation provenance stamp.
 *
 * Stamped on `AdaptiveExercise.evidenceCalibrationRpeCap` ONLY at the exact
 * site in `applyConservativeProgressionShaping` where the helper actually
 * reduces a numeric `targetRPE` from above the conservative ceiling down
 * to the ceiling. The numeric mutation itself lives on `targetRPE` — this
 * stamp is the audit + visible-proof surface for display layers, NOT a
 * parallel cosmetic banner. It is NOT used as an input to any future
 * structural logic; AB13-7 is provenance-only.
 *
 * Honesty rules (enforced by the producer in this file):
 *   - Only present on rows whose `targetRPE` was ACTUALLY changed by the
 *     AB13-4 shaping pass. Rows that were already at or below the ceiling
 *     are NOT stamped.
 *   - `rpeBefore` is captured from the row BEFORE the cap is applied and
 *     is therefore always strictly greater than `rpeAfter` and `ceilingRpe`.
 *   - `applied` is the literal `true` so that consumers cannot read the
 *     stamp as a "would have applied" intent — its presence proves a real
 *     mutation occurred.
 *   - `reasonCode` is a stable machine identifier; user-facing surfaces
 *     read `reasonCoachLine` instead and never expose the raw enum.
 *
 * Mirrors the existing per-row provenance precedent set by
 * `stressAdjustmentDelta` (Phase K) on the same `AdaptiveExercise` type.
 */
export interface EvidenceCalibrationRpeCapStamp {
  /** Provenance source — only one valid value in AB13-7. */
  source: 'evidence_calibration_conservative_progression'
  /** Literal `true` — presence of this stamp implies a real mutation. */
  applied: true
  /** RPE on the row BEFORE the cap. Strictly greater than `rpeAfter`. */
  rpeBefore: number
  /** RPE on the row AFTER the cap. Equal to `ceilingRpe`. */
  rpeAfter: number
  /** Conservative-progression ceiling used by AB13-4. */
  ceilingRpe: number
  /** Stable machine identifier; not for user-facing copy. */
  reasonCode: 'progression_aggressiveness_conservative'
  /** Short coaching line safe to render verbatim in tooltips/chips. */
  reasonCoachLine: string
}

// ---------------------------------------------------------------------------
// AB14 — Row-level volume-adjustment provenance
// ---------------------------------------------------------------------------

/**
 * AB14 row-level mutation provenance stamp.
 * Stamped on `AdaptiveExercise.evidenceCalibrationVolumeAdjustment` ONLY
 * when the helper actually reduces a numeric `sets` value.
 */
export interface EvidenceCalibrationVolumeAdjustmentStamp {
  source: 'evidence_calibration_volume_bias_reduce'
  applied: true
  setsBefore: number
  setsAfter: number
  setsRemoved: number
  volumeBias: 'reduce'
  reasonCode: 'volume_bias_reduce'
  reasonCoachLine: string
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Apply the AB13-4 conservative-progression shaping pass.
 *
 * See file-level comment for the full contract. In short:
 *
 *   - Gate: influence.status === 'active'
 *           AND influence.allowedToMutateProgram === true
 *           AND influence.progressionAggressiveness === 'conservative'
 *   - Effect (only when gate is open):
 *       For each session.exercise where:
 *         typeof targetRPE === 'number'
 *         targetRPE > CONSERVATIVE_RPE_CEILING
 *         category is not in NON_PRESCRIPTIVE_CATEGORIES
 *       set targetRPE = CONSERVATIVE_RPE_CEILING.
 *   - Proof: always returned, always honest.
 *
 * Pure. Safe to call from server actions and route handlers.
 */
export function applyConservativeProgressionShaping(
  program: AdaptiveProgram,
  influence: EvidenceCalibrationGenerationInfluence | null | undefined,
): EvidenceCalibrationShapingResult {
  // ---------------------------------------------------------------------------
  // Universal gates (must pass before either AB13 or AB14 can run)
  // ---------------------------------------------------------------------------
  if (!influence) {
    return { program, shapingProof: buildSkippedProof('no_influence') }
  }
  if (influence.status !== 'active') {
    return { program, shapingProof: buildSkippedProof('status_not_active') }
  }
  if (influence.allowedToMutateProgram !== true) {
    return { program, shapingProof: buildSkippedProof('not_allowed_to_mutate') }
  }

  // ---------------------------------------------------------------------------
  // Determine which passes are gated open
  // ---------------------------------------------------------------------------
  const ab13Open = influence.progressionAggressiveness === 'conservative'
  const ab14Open = influence.volumeBias === 'reduce'

  // If NEITHER pass is gated open, skip with an honest reason.
  if (!ab13Open && !ab14Open) {
    return { program, shapingProof: buildSkippedProof('no_actionable_bias') }
  }

  // ---------------------------------------------------------------------------
  // Single combined walk — both passes in one iteration
  // ---------------------------------------------------------------------------
  let cappedExerciseCount = 0
  let adjustedExerciseCount = 0
  let totalSetsRemoved = 0
  let eligibleExerciseCount = 0

  const newSessions: AdaptiveSession[] = program.sessions.map((session) => {
    let sessionMutated = false
    let sessionVolumeReductions = 0

    const newExercises: AdaptiveExercise[] = session.exercises.map((ex) => {
      let mutatedEx: AdaptiveExercise = ex
      let rowMutated = false

      // -----------------------------------------------------------------------
      // AB13 — RPE cap pass
      // -----------------------------------------------------------------------
      if (ab13Open && isExerciseEligibleForRpeCap(mutatedEx)) {
        const rpeBefore = mutatedEx.targetRPE
        if (typeof rpeBefore === 'number') {
          cappedExerciseCount += 1
          rowMutated = true
          const rowStamp: EvidenceCalibrationRpeCapStamp = {
            source: 'evidence_calibration_conservative_progression',
            applied: true,
            rpeBefore,
            rpeAfter: CONSERVATIVE_RPE_CEILING,
            ceilingRpe: CONSERVATIVE_RPE_CEILING,
            reasonCode: 'progression_aggressiveness_conservative',
            reasonCoachLine: `Evidence calibration capped this from RPE ${rpeBefore} to ${CONSERVATIVE_RPE_CEILING}.`,
          }
          mutatedEx = {
            ...mutatedEx,
            targetRPE: CONSERVATIVE_RPE_CEILING,
            evidenceCalibrationRpeCap: rowStamp,
          }
        }
      }

      // -----------------------------------------------------------------------
      // AB14 — Volume reduction pass
      // -----------------------------------------------------------------------
      if (ab14Open && isExerciseEligibleForVolumeReduction(mutatedEx)) {
        eligibleExerciseCount += 1
        if (sessionVolumeReductions < VOLUME_REDUCTION_PER_SESSION_CAP) {
          const setsBefore = mutatedEx.sets
          if (typeof setsBefore === 'number') {
            const setsAfter = setsBefore - 1
            const setsRemoved = 1
            adjustedExerciseCount += 1
            totalSetsRemoved += setsRemoved
            sessionVolumeReductions += 1
            rowMutated = true
            const volumeStamp: EvidenceCalibrationVolumeAdjustmentStamp = {
              source: 'evidence_calibration_volume_bias_reduce',
              applied: true,
              setsBefore,
              setsAfter,
              setsRemoved,
              volumeBias: 'reduce',
              reasonCode: 'volume_bias_reduce',
              reasonCoachLine: `Evidence calibration reduced this from ${setsBefore} sets to ${setsAfter}.`,
            }
            mutatedEx = {
              ...mutatedEx,
              sets: setsAfter,
              evidenceCalibrationVolumeAdjustment: volumeStamp,
            }
          }
        }
      }

      if (rowMutated) sessionMutated = true
      return rowMutated ? mutatedEx : ex
    })

    if (!sessionMutated) return session
    return { ...session, exercises: newExercises }
  })

  // ---------------------------------------------------------------------------
  // Build proof objects
  // ---------------------------------------------------------------------------
  const ab13Applied = cappedExerciseCount > 0
  const ab14Applied = adjustedExerciseCount > 0

  const volumeAdjustmentProof: EvidenceCalibrationVolumeAdjustmentProof | undefined =
    ab14Open
      ? {
          source: 'evidence_calibration_volume_bias_reduce',
          applied: ab14Applied,
          eligibleExerciseCount,
          adjustedExerciseCount,
          totalSetsRemoved,
          volumeBias: 'reduce',
          reasonCode: ab14Applied ? 'volume_bias_reduce' : 'no_eligible_rows',
          summary: ab14Applied
            ? `Reduced sets on ${adjustedExerciseCount} exercise${adjustedExerciseCount === 1 ? '' : 's'} (${totalSetsRemoved} total sets removed).`
            : `Volume reduction active — no eligible exercises found (all working sets already at minimum).`,
        }
      : undefined

  const shapingProof: EvidenceCalibrationShapingProof = {
    shapingVersion: SHAPING_VERSION,
    ranShapingPass: ab13Open,
    appliedAtLeastOneMutation: ab13Applied,
    cappedExerciseCount,
    ceilingRpe: CONSERVATIVE_RPE_CEILING,
    summary: buildCombinedSummary(ab13Open, ab13Applied, cappedExerciseCount, ab14Open, ab14Applied, adjustedExerciseCount),
    skippedReason: null,
    volumeAdjustment: volumeAdjustmentProof,
  }

  return {
    program: { ...program, sessions: newSessions },
    shapingProof,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers — pure
// ---------------------------------------------------------------------------

/** AB13 eligibility: RPE cap */
function isExerciseEligibleForRpeCap(ex: AdaptiveExercise): boolean {
  if (typeof ex.targetRPE !== 'number') return false
  if (!Number.isFinite(ex.targetRPE)) return false
  if (ex.targetRPE <= CONSERVATIVE_RPE_CEILING) return false
  const category = (ex.category ?? '').toLowerCase()
  if (NON_PRESCRIPTIVE_CATEGORIES.has(category)) return false
  return true
}

/** AB14 eligibility: volume reduction */
function isExerciseEligibleForVolumeReduction(ex: AdaptiveExercise): boolean {
  if (typeof ex.sets !== 'number') return false
  if (!Number.isFinite(ex.sets)) return false
  if (ex.sets < VOLUME_REDUCTION_ELIGIBLE_MIN) return false
  const category = (ex.category ?? '').toLowerCase()
  if (NON_PRESCRIPTIVE_CATEGORIES.has(category)) return false
  return true
}

function buildSkippedProof(
  reason: NonNullable<EvidenceCalibrationShapingProof['skippedReason']>,
): EvidenceCalibrationShapingProof {
  return {
    shapingVersion: SHAPING_VERSION,
    ranShapingPass: false,
    appliedAtLeastOneMutation: false,
    cappedExerciseCount: 0,
    ceilingRpe: CONSERVATIVE_RPE_CEILING,
    summary: buildSkippedSummary(reason),
    skippedReason: reason,
  }
}

function buildSkippedSummary(
  reason: NonNullable<EvidenceCalibrationShapingProof['skippedReason']>,
): string {
  switch (reason) {
    case 'no_influence':
      return 'Program shaping skipped — no influence stamped.'
    case 'status_not_active':
      return 'Program shaping skipped — influence not active.'
    case 'not_allowed_to_mutate':
      return 'Program shaping skipped — mutation not allowed.'
    case 'progression_not_conservative':
      return 'Program shaping skipped — not conservative progression.'
    case 'no_actionable_bias':
      return 'Program shaping skipped — no actionable bias requested.'
  }
}

function buildCombinedSummary(
  ab13Open: boolean,
  ab13Applied: boolean,
  cappedCount: number,
  ab14Open: boolean,
  ab14Applied: boolean,
  adjustedCount: number,
): string {
  const parts: string[] = []
  if (ab13Open) {
    parts.push(ab13Applied
      ? `Capped ${cappedCount} exercise${cappedCount === 1 ? '' : 's'} at RPE ${CONSERVATIVE_RPE_CEILING}`
      : `Conservative progression active (no RPE capping needed)`)
  }
  if (ab14Open) {
    parts.push(ab14Applied
      ? `reduced sets on ${adjustedCount} exercise${adjustedCount === 1 ? '' : 's'}`
      : `volume reduction active (no eligible rows)`)
  }
  if (parts.length === 0) return 'No shaping applied.'
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  return parts.length === 1 ? `${first}.` : `${first} and ${parts.slice(1).join(' and ')}.`
}
