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
// Types
// ---------------------------------------------------------------------------

/**
 * Compact proof object describing what the AB13-4 shaping pass actually did.
 * Stamped on the program (optional field on `AdaptiveProgram`) so any future
 * audit / UI consumer can verify the pass ran AND distinguish "active and
 * applied" from "active but nothing in the program needed capping".
 */
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
  // Gate 1: missing influence
  if (!influence) {
    return {
      program,
      shapingProof: buildSkippedProof('no_influence'),
    }
  }
  // Gate 2: status must be active
  if (influence.status !== 'active') {
    return {
      program,
      shapingProof: buildSkippedProof('status_not_active'),
    }
  }
  // Gate 3: caller must have explicitly allowed mutation
  if (influence.allowedToMutateProgram !== true) {
    return {
      program,
      shapingProof: buildSkippedProof('not_allowed_to_mutate'),
    }
  }
  // Gate 4: only the conservative case has an audited consumer in AB13-4
  if (influence.progressionAggressiveness !== 'conservative') {
    return {
      program,
      shapingProof: buildSkippedProof('progression_not_conservative'),
    }
  }

  // Gate is open. Walk sessions/exercises and clone-on-write only the rows
  // we actually touch, so the original references stay intact for any other
  // consumer that may already hold a reference.
  let cappedExerciseCount = 0
  const newSessions: AdaptiveSession[] = program.sessions.map((session) => {
    let sessionMutated = false
    const newExercises: AdaptiveExercise[] = session.exercises.map((ex) => {
      if (!isExerciseEligibleForCap(ex)) return ex
      cappedExerciseCount += 1
      sessionMutated = true
      return {
        ...ex,
        targetRPE: CONSERVATIVE_RPE_CEILING,
      }
    })
    if (!sessionMutated) return session
    return {
      ...session,
      exercises: newExercises,
    }
  })

  const appliedAtLeastOneMutation = cappedExerciseCount > 0

  const shapingProof: EvidenceCalibrationShapingProof = {
    shapingVersion: SHAPING_VERSION,
    ranShapingPass: true,
    appliedAtLeastOneMutation,
    cappedExerciseCount,
    ceilingRpe: CONSERVATIVE_RPE_CEILING,
    summary: appliedAtLeastOneMutation
      ? `Conservative progression applied — ${cappedExerciseCount} exercise${cappedExerciseCount === 1 ? '' : 's'} capped at RPE ${CONSERVATIVE_RPE_CEILING}.`
      : `Conservative progression active — no exercises required capping (every prescribed RPE was already ≤ ${CONSERVATIVE_RPE_CEILING}).`,
    skippedReason: null,
  }

  // Always return a NEW program reference when the gate ran, even if no
  // sessions were mutated, so a downstream consumer that compares
  // references can detect "AB13-4 ran on this program".
  return {
    program: {
      ...program,
      sessions: newSessions,
    },
    shapingProof,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers — pure
// ---------------------------------------------------------------------------

function isExerciseEligibleForCap(ex: AdaptiveExercise): boolean {
  // Only cap when the builder already prescribed a numeric targetRPE.
  // Never invent an RPE for a row that did not have one.
  if (typeof ex.targetRPE !== 'number') return false
  if (!Number.isFinite(ex.targetRPE)) return false
  if (ex.targetRPE <= CONSERVATIVE_RPE_CEILING) return false
  // Never cap warmup / cooldown / mobility / recovery / pre-/re-hab rows.
  // Their dosage convention is different from prescribed working sets.
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
      return 'Conservative progression shaping skipped — no influence stamped on this program.'
    case 'status_not_active':
      return 'Conservative progression shaping skipped — influence is not active (waiting / observing / degraded).'
    case 'not_allowed_to_mutate':
      return 'Conservative progression shaping skipped — influence is not allowed to mutate the program.'
    case 'progression_not_conservative':
      return 'Conservative progression shaping skipped — plan did not request the conservative direction.'
  }
}
