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

import { getWorkoutLogs, type WorkoutLog } from '../workout-log-service'
import {
  applyLoggedPerformanceFeedback,
  type PerformanceFeedbackAdaptationResult,
  type PhaseLProgramShape,
} from './performance-feedback-adaptation-contract'
// [PHASE-P] Quality / doctrine sharpness audit. Pure deterministic resolver
// run AFTER the Phase L/M/N/O overlay finishes its bounded mutations so
// completed-day-aware corrections (tendon RPE cap, unilateral per-side note)
// and proof attributions (skill carryover, session-length realism, overlap
// warnings) reach the Program card from BOTH ingress paths — server-side
// generation and client-side boot overlay. Phase P obeys the same
// ownership rule as Phase L: server stamps win; the client never overwrites
// server-applied corrections. See lib/program/program-quality-doctrine-audit-contract.ts.
import {
  runProgramQualityDoctrineAudit,
  type ProgramQualityAuditResult,
} from './program-quality-doctrine-audit-contract'
// [PHASE-Q] Doctrine utilization causal trace. Pure reader — runs after
// Phase P in BOTH ingress paths so the Program card always renders honest,
// stamped causality data instead of recomputing it.
import { runDoctrineUtilizationContract } from './doctrine-utilization-contract'
// [PHASE-R] Session-length truth lock. Pure reader over `session.variants[]`.
// Runs AFTER Phase P, BEFORE Phase Q in BOTH ingress paths so Phase Q can
// credit session-length as ELIGIBLE_AND_APPLIED when shorts are structurally
// real. See lib/program/session-length-truth-contract.ts.
import { runSessionLengthTruthContract } from './session-length-truth-contract'
import type { AdaptiveProgram } from '../adaptive-program-builder'

// =============================================================================
// [PHASE-M] SERVER-STAMP DETECTORS — used by Program page boot effect to avoid
// double-applying mutations after the server has already applied them.
// =============================================================================

/**
 * Returns true when the program already carries any server-applied
 * performanceAdaptation stamp. The Program page boot effect uses this to
 * skip the client overlay when the authoritative generator has already
 * stamped server-side adaptation for the same evidence corridor.
 */
export function programHasAnyServerAdaptation(
  program: PhaseLProgramShape | null | undefined,
): boolean {
  if (!program || !Array.isArray(program.sessions)) return false
  for (const sess of program.sessions) {
    if (!Array.isArray(sess.exercises)) continue
    for (const ex of sess.exercises) {
      const stamp = (ex as { performanceAdaptation?: { appliedBy?: string } }).performanceAdaptation
      if (stamp && stamp.appliedBy === 'server') return true
    }
  }
  return false
}

/**
 * Returns true when the program already carries a server-applied
 * performanceAdaptation stamp whose evidenceHash matches `hash`. This is the
 * tightest idempotency check — same evidence corridor as the server saw.
 */
export function programHasServerAdaptationForHash(
  program: PhaseLProgramShape | null | undefined,
  hash: string,
): boolean {
  if (!program || !Array.isArray(program.sessions)) return false
  if (!hash) return false
  for (const sess of program.sessions) {
    if (!Array.isArray(sess.exercises)) continue
    for (const ex of sess.exercises) {
      const stamp = (ex as {
        performanceAdaptation?: { appliedBy?: string; evidenceHash?: string }
      }).performanceAdaptation
      if (
        stamp &&
        stamp.appliedBy === 'server' &&
        typeof stamp.evidenceHash === 'string' &&
        stamp.evidenceHash === hash
      ) {
        return true
      }
    }
  }
  return false
}

export interface OverlayApplicationResult<T extends PhaseLProgramShape> {
  /** Program with stamped performanceAdaptation + bounded numeric mutations. */
  program: T
  /** Raw adaptation contract result (signals + mutations + proof). */
  adaptation: PerformanceFeedbackAdaptationResult
  /** Stable signature so callers can dedupe re-runs. */
  signature: string
  /** True if any mutation actually altered the program. */
  changed: boolean
  /**
   * [PHASE-M] Why the overlay decided to short-circuit (when applicable).
   * Helps the Program page log a precise reason for skipping the client
   * overlay rather than silently doing nothing.
   */
  skipReason?:
    | 'no_program'
    | 'no_logs'
    | 'server_already_applied_same_evidence'
    | 'server_already_applied_other_evidence'
    | 'already_applied_same_evidence'
    | 'no_mutations'
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
 * Apply the Phase L overlay to a program. Returns `null` when there is no
 * program at all. Otherwise returns a result with `changed` set to true only
 * when at least one bounded mutation was applied.
 *
 * [PHASE-M] Idempotency rule: when the program already carries any
 * server-applied performanceAdaptation stamp, the client overlay yields
 * entirely. The server is the authoritative owner; the client never
 * double-stacks on top of server-applied mutations.
 */
export function applyPerformanceFeedbackOverlay<T extends PhaseLProgramShape>(
  program: T | null | undefined,
  options?: { nowIso?: string; logs?: readonly WorkoutLog[] },
): OverlayApplicationResult<T> | null {
  if (!program || typeof program !== 'object') return null
  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  if (sessions.length === 0) {
    return {
      program,
      adaptation: {
        status: 'insufficient_data',
        signals: [],
        mutations: [],
        summary: 'No program sessions to overlay.',
        blockedReasons: [],
        proof: {
          completedSetsRead: 0,
          sessionsRead: 0,
          highRpeCount: 0,
          underTargetCount: 0,
          noteWarningsCount: 0,
          mutationsApplied: 0,
          mutationsBlocked: 0,
          currentProgramPreserved: true,
        },
      },
      signature: buildSignature((program as { id?: string }).id, []),
      changed: false,
      skipReason: 'no_program',
    }
  }

  // Read canonical workout logs (browser-only). Server prerender returns [].
  // Tests pass logs directly so the same path can run without browser storage.
  const logs = options?.logs ?? getWorkoutLogs()
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

  // Closed workouts stay closed, including after an athlete revert.
  // A newer log can still adjust the next future session.
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

  const idempotent = applyLoggedPerformanceFeedback(program, recent, {
    nowIso: options?.nowIso,
  })
  const adaptation = idempotent.adaptation

  if (!idempotent.changed || adaptation.proof.mutationsApplied === 0) {
    return {
      program: idempotent.program,
      adaptation,
      signature,
      changed: idempotent.changed,
      skipReason: idempotent.changed ? undefined : (idempotent.skipReason ?? 'no_mutations'),
    }
  }

  const adapted = idempotent.program

  // [PHASE-P] Run the quality / doctrine sharpness audit on the adapted
  // program. The resolver is pure / non-blocking; if it throws we keep the
  // Phase L mutations exactly as they are. completedDayNumbers come from
  // the same per-log inference we built above so Phase P never edits a
  // session the user already finished.
  let postPhaseP: T = adapted
  try {
    const phasePResult = runProgramQualityDoctrineAudit(
      adapted as unknown as AdaptiveProgram,
      { completedDayNumbers, nowIso: options?.nowIso },
    )
    postPhaseP = phasePResult.program as unknown as T
  } catch (err) {
    console.log('[phase-p-client-overlay-failed]', { error: String(err) })
  }

  // [PHASE-R] Stamp `sessionLengthTruth` over `session.variants[]` BEFORE
  // Phase Q so the doctrine utilization trace can credit session-length as
  // ELIGIBLE_AND_APPLIED when shorts are structurally real. Pure reader,
  // non-blocking. If the contract throws we keep the Phase P output exactly
  // as it is — the truth stamp is proof, not a builder.
  let postPhaseR: T = postPhaseP
  try {
    const phaseRResult = runSessionLengthTruthContract(
      postPhaseP as unknown as AdaptiveProgram,
    )
    postPhaseR = phaseRResult.program as unknown as T
  } catch (err) {
    console.log('[phase-r-client-overlay-failed]', { error: String(err) })
  }

  // [PHASE-Q] Stamp the doctrine utilization trace on top of the
  // post-Phase-R program. Pure reader; non-blocking. If the contract throws
  // we keep the Phase R output exactly as it is — the trace is proof, not a
  // builder.
  let postPhaseQ: T = postPhaseR
  try {
    const phaseQResult = runDoctrineUtilizationContract(
      postPhaseR as unknown as AdaptiveProgram,
      { nowIso: options?.nowIso },
    )
    postPhaseQ = phaseQResult.program as unknown as T
  } catch (err) {
    console.log('[phase-q-client-overlay-failed]', { error: String(err) })
  }

  return {
    program: {
      ...postPhaseQ,
      performanceFeedbackAppliedLogIds: idempotent.program.performanceFeedbackAppliedLogIds,
    },
    adaptation,
    signature,
    changed: true,
  }
}

// [PHASE-P] Re-export type for callers that want to inspect the audit
// result without importing from the contract directly.
export type { ProgramQualityAuditResult }

// =============================================================================
// [PHASE-M] CLIENT-SIDE RECENT-LOG ACCESSOR FOR SERVER GENERATION ROUTES
// -----------------------------------------------------------------------------
// Returns the same recent-trusted-log slice the client overlay would consume,
// shaped as a JSON-safe array for forwarding to the authoritative server
// generator (`generate-fresh`, `regenerate`, `modify-builder`,
// `rebuild-adjustment`). The server adapter
// (`lib/server/performance-history-context.ts`) sanitizes / caps / hashes
// regardless of what the client sends, so this helper is only an
// availability/transport bridge — never a trust boundary.
//
// Returns `[]` on the server (no localStorage), so the route's optional
// `recentWorkoutLogs` field is naturally omitted during prerender.
// =============================================================================
export function getRecentWorkoutLogsForGenerationRequest(): WorkoutLog[] {
  if (typeof window === 'undefined') return []
  const logs = getWorkoutLogs()
  if (!Array.isArray(logs) || logs.length === 0) return []
  const sortedLogs = [...logs].sort((a, b) => {
    const ta = new Date(a.createdAt ?? a.sessionDate ?? 0).getTime()
    const tb = new Date(b.createdAt ?? b.sessionDate ?? 0).getTime()
    return tb - ta
  })
  return sortedLogs.filter((log) => log.trusted !== false).slice(0, 14)
}
