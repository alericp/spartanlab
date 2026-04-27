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
  applyFuturePrescriptionMutations,
  extractCompletedSetEvidence,
  resolvePerformanceFeedbackAdaptation,
  type PerformanceFeedbackAdaptationResult,
  type PhaseLProgramShape,
  type PhaseLSessionShape,
} from './performance-feedback-adaptation-contract'

// =============================================================================
// [PHASE-M] EVIDENCE HASH — same algorithm as the server adapter so
// server-applied and client-applied stamps can be compared for idempotency.
// FNV-1a, JSON-safe, no crypto dependency. NOT a security primitive.
// =============================================================================

function fnv1aHex(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function buildEvidenceHashFromLogs(logs: ReadonlyArray<{ id?: string; createdAt?: string; sessionDate?: string }>): string {
  if (!Array.isArray(logs) || logs.length === 0) return ''
  const ids = logs
    .map((l) => (typeof l.id === 'string' && l.id.length > 0 ? l.id : l.createdAt ?? l.sessionDate ?? ''))
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .sort()
  if (ids.length === 0) return ''
  return fnv1aHex(`${ids.length}::${ids.join('|')}`)
}

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
  options?: { nowIso?: string },
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

  // [PHASE-M] Compute the same evidence hash the server would have computed
  // and short-circuit if the server has already applied adaptation. We do NOT
  // re-mutate on top of server-applied stamps because (a) the contract is
  // stateful w.r.t. the program input it reads, so re-running on already
  // mutated `sets`/`targetRPE`/etc. could compound bounds, and (b) the
  // authoritative ownership rule is server-first.
  const evidenceHash = buildEvidenceHashFromLogs(recent)
  if (programHasServerAdaptationForHash(program, evidenceHash)) {
    return {
      program,
      adaptation: {
        status: 'healthy',
        signals: [],
        mutations: [],
        summary: 'Server already applied adaptation for this exact evidence set.',
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
      signature,
      changed: false,
      skipReason: 'server_already_applied_same_evidence',
    }
  }
  if (programHasAnyServerAdaptation(program)) {
    // Server applied for a different evidence corridor (e.g. older logs were
    // present at generation time, then the user logged a new workout). Keep
    // the server stamps as authoritative; do not stack a second corridor on
    // top. Next regenerate will pick up the newer logs.
    return {
      program,
      adaptation: {
        status: 'partial',
        signals: [],
        mutations: [],
        summary: 'Server-applied adaptation present; client overlay yielding to server authority.',
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
      signature,
      changed: false,
      skipReason: 'server_already_applied_other_evidence',
    }
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
      skipReason: 'no_mutations',
    }
  }

  // [PHASE-M] Stamp client provenance + the same evidence hash so a later
  // server overlay (or another mount) can recognize what evidence corridor
  // produced the existing adaptation.
  const adapted = applyFuturePrescriptionMutations(
    program,
    adaptation.mutations,
    options?.nowIso,
    {
      appliedBy: 'client',
      evidenceHash,
    },
  )

  return {
    program: adapted,
    adaptation,
    signature,
    changed: true,
  }
}

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
