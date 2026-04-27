/**
 * PHASE L — POST-WORKOUT PERFORMANCE FEEDBACK INTEGRATION
 *
 * Client-side glue that connects:
 *   getWorkoutLogs() → extractCompletedSetEvidence() → resolvePerformanceFeedbackAdaptation()
 *   → applyFuturePrescriptionMutations() → adapted program object.
 *
 * This module is the ONLY layer permitted to touch localStorage / window. The
 * underlying contract in `performance-feedback-adaptation-contract.ts` stays
 * pure / JSON-safe so it can be unit-tested without mocks.
 *
 * Used by app/(app)/program/page.tsx via a single boot-time effect that runs
 * once per `(programId, logSignature)` pair so the same overlay is never
 * applied twice and stale logs cannot win against a fresher in-memory program.
 */

import { getWorkoutLogs } from '../workout-log-service'
import {
  applyFuturePrescriptionMutations,
  extractCompletedSetEvidence,
  resolvePerformanceFeedbackAdaptation,
  type PerformanceFeedbackAdaptationResult,
  type PhaseLProgramShape,
  type PhaseLSessionShape,
} from './performance-feedback-adaptation-contract'

export interface OverlayApplicationResult<T extends PhaseLProgramShape> {
  /** Program with stamped performanceAdaptation + bounded numeric mutations. */
  program: T
  /** Raw adaptation contract result (signals + mutations + proof). */
  adaptation: PerformanceFeedbackAdaptationResult
  /** Stable signature so callers can dedupe re-runs. */
  signature: string
  /** True if any mutation actually altered the program. */
  changed: boolean
}

/**
 * Build a stable signature for memoization: combines program id + log count +
 * latest log id. The signature changes when the user logs a new workout
 * OR opens a different program. It does NOT change between renders for the
 * same (program, log) pair.
 */
function buildSignature(programId: string | undefined, logIds: string[]): string {
  return `${programId ?? 'no-program'}::${logIds.length}::${logIds[0] ?? 'none'}`
}

/**
 * Apply the Phase L overlay to a program. Returns `null` when there is
 * nothing to overlay (no logs, no program, no mutations) — the caller should
 * keep the original program in that case.
 */
export function applyPerformanceFeedbackOverlay<T extends PhaseLProgramShape>(
  program: T | null | undefined,
  options?: { nowIso?: string },
): OverlayApplicationResult<T> | null {
  if (!program || typeof program !== 'object') return null
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  if (sessions.length === 0) return null

  // Read canonical workout logs (browser-only). Server prerender returns [].
  const logs = getWorkoutLogs()
  // Sort newest first so `logs[0]` is the most recent.
  const sortedLogs = [...logs].sort((a, b) => {
    const ta = new Date(a.createdAt ?? a.sessionDate ?? 0).getTime()
    const tb = new Date(b.createdAt ?? b.sessionDate ?? 0).getTime()
    return tb - ta
  })
  // Limit to the last 14 trusted logs — Phase L is "recent performance",
  // not full lifetime history.
  const recent = sortedLogs.filter((log) => log.trusted !== false).slice(0, 14)
  const logIds = recent.map((l) => l.id).filter((id): id is string => typeof id === 'string')

  const signature = buildSignature(
    (program as { id?: string }).id,
    logIds,
  )
  if (recent.length === 0) {
    return null
  }

  // Build a session-by-day lookup so the extractor can compare actuals to
  // prescribed reps/hold from the matching program day.
  const sessionByDay: Record<number, PhaseLSessionShape> = {}
  for (const sess of sessions) {
    const dn = typeof sess.dayNumber === 'number' ? sess.dayNumber : -1
    if (dn >= 0) sessionByDay[dn] = sess
  }

  // Concatenate evidence across all recent logs.
  const evidence = recent.flatMap((log) =>
    extractCompletedSetEvidence(log, sessionByDay),
  )

  // Determine which day numbers in the program have been completed by mapping
  // each log's generatedWorkoutId back to a session.dayNumber. Logs without
  // a parseable mapping are simply ignored for the purposes of the
  // completed-day filter (the contract still skips earlier-than-current days
  // via signal application order).
  const completedDayNumbers: number[] = []
  for (const log of recent) {
    const gid = log.generatedWorkoutId
    if (typeof gid === 'string') {
      const m = gid.match(/day[-_]?(\d+)/i)
      if (m) {
        const dn = Number.parseInt(m[1], 10)
        if (Number.isFinite(dn) && !completedDayNumbers.includes(dn)) {
          completedDayNumbers.push(dn)
        }
      }
    }
  }

  const adaptation = resolvePerformanceFeedbackAdaptation({
    currentProgram: program,
    completedSetEvidence: evidence,
    completedDayNumbers,
    nowIso: options?.nowIso,
  })

  if (adaptation.proof.mutationsApplied === 0) {
    return {
      program,
      adaptation,
      signature,
      changed: false,
    }
  }

  const adapted = applyFuturePrescriptionMutations(
    program,
    adaptation.mutations,
    options?.nowIso,
  )

  return {
    program: adapted,
    adaptation,
    signature,
    changed: true,
  }
}
