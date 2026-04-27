/**
 * ==========================================================================
 * PHASE M — SERVER-SAFE PERFORMANCE HISTORY CONTEXT
 * ==========================================================================
 *
 * Thin server-safe adapter around the canonical Phase L resolver
 * (`lib/program/performance-feedback-adaptation-contract.ts`).
 *
 * RESPONSIBILITIES (and only these):
 *   - Accept JSON-safe recent workout logs supplied by the route caller
 *     (typically the Program page client, which has localStorage access).
 *   - Sanitize / sort / cap the log set so generation cannot be slowed by a
 *     huge accidental payload.
 *   - Compute a deterministic `evidenceHash` so server- and client-applied
 *     adaptation stamps can be compared for idempotency.
 *   - Run the SAME Phase L resolver + applier the Program page boot effect
 *     uses, stamping `appliedBy: 'server'` + `evidenceHash` so the boot
 *     effect can see the work was already done and refuse to double-apply.
 *
 * NON-RESPONSIBILITIES:
 *   - This file does NOT own adaptation rules. Those live entirely inside
 *     `performance-feedback-adaptation-contract.ts`.
 *   - This file does NOT read the database. Per-set evidence is currently
 *     persisted only in client localStorage; the route already has the user
 *     id, but the workout_logs table does not yet store completedSetEvidence,
 *     so attempting a DB read here would silently return nothing. The route
 *     handler is the canonical bridge: client → route body → this adapter.
 *   - This file does NOT mutate the program in place; it always returns a
 *     new program object via the underlying applier.
 *
 * SERVER SAFETY:
 *   - No `localStorage`, `window`, `fetch`, or React imports.
 *   - Pure / deterministic given (program, logs).
 */

import {
  applyFuturePrescriptionMutations,
  extractCompletedSetEvidence,
  resolvePerformanceFeedbackAdaptation,
  type CompletedSetEvidence,
  type MinimalWorkoutLogShape,
  type PerformanceFeedbackAdaptationResult,
  type PhaseLProgramShape,
  type PhaseLSessionShape,
} from '@/lib/program/performance-feedback-adaptation-contract'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * The route-supplied log shape. This is intentionally a subset of the
 * canonical client-side `WorkoutLog` type — the route only needs the fields
 * the Phase L extractor reads. Keeping it loose lets the page POST the same
 * objects it has in localStorage without re-validating every field.
 */
export type ServerWorkoutLogInput = MinimalWorkoutLogShape & {
  id?: string
  /** Field present on real client logs; ignored here other than as an id source. */
  generatedWorkoutId?: string
}

export interface PerformanceHistoryContext {
  /** True when there is at least one trusted, parseable log to work with. */
  hasEvidence: boolean
  /** Stable hash of the evidence set. Empty string when hasEvidence is false. */
  evidenceHash: string
  /** Trusted, recent (last 14) logs, newest first. */
  recentLogs: ServerWorkoutLogInput[]
  /** Day numbers (1-based) the athlete has completed in the current program. */
  completedDayNumbers: number[]
  /** Diagnostics for logging / blueprint proof. */
  diagnostics: {
    rawLogCount: number
    trustedLogCount: number
    cappedLogCount: number
    completedDayNumbersFromLogs: number[]
  }
}

export interface ServerOverlayResult<T extends PhaseLProgramShape> {
  /** Program with stamped server-side performanceAdaptation, or the original
   *  program when no mutations were applied. */
  program: T
  /** Phase L resolver output (signals + mutations + proof). */
  adaptation: PerformanceFeedbackAdaptationResult
  /** True when at least one mutation actually altered the program. */
  changed: boolean
  /** The evidence hash that the stamps carry. */
  evidenceHash: string
  /** Concise log summary suitable for `[phase-m-...]` audit logs. */
  summary: {
    mutationsApplied: number
    mutationsBlocked: number
    completedSetsRead: number
    sessionsRead: number
    signalCount: number
    status: PerformanceFeedbackAdaptationResult['status']
  }
}

// =============================================================================
// HASH — deterministic, JSON-safe, no crypto dependency required
// =============================================================================

/**
 * Cheap deterministic 32-bit hash (FNV-1a) rendered as hex. Adequate for
 * idempotency comparison between server- and client-applied stamps. NOT a
 * security primitive.
 */
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/**
 * Build the canonical evidence hash from a list of logs. We keep the input
 * simple on purpose so the client (Phase L integration helper) and the
 * server compute the same value with no shared crypto state:
 *
 *   sorted(log.id ?? createdAt) joined by '|'
 *
 * If everything is missing we hash the empty string and the caller treats
 * that as "no evidence" anyway.
 */
function buildEvidenceHashFromLogs(logs: ServerWorkoutLogInput[]): string {
  if (!Array.isArray(logs) || logs.length === 0) return ''
  const ids = logs
    .map((l) => (typeof l.id === 'string' && l.id.length > 0 ? l.id : l.createdAt ?? l.sessionDate ?? ''))
    .filter((s) => typeof s === 'string' && s.length > 0)
    .sort()
  if (ids.length === 0) return ''
  return fnv1aHex(`${ids.length}::${ids.join('|')}`)
}

/**
 * Re-export so the client integration layer can compute the SAME hash. This
 * is the single shared algorithm; do not duplicate it client-side.
 */
export function computeEvidenceHashForLogs(logs: ServerWorkoutLogInput[]): string {
  return buildEvidenceHashFromLogs(logs)
}

// =============================================================================
// CONTEXT BUILDER
// =============================================================================

const TRUSTED_LOG_CAP = 14

function isTrustedLog(log: ServerWorkoutLogInput): boolean {
  if (!log || typeof log !== 'object') return false
  if (log.trusted === false) return false
  if (log.sourceRoute === 'demo') return false
  return true
}

function safeLogTimestamp(log: ServerWorkoutLogInput): number {
  const t1 = log.createdAt ? Date.parse(log.createdAt) : NaN
  if (Number.isFinite(t1)) return t1
  const t2 = log.sessionDate ? Date.parse(log.sessionDate) : NaN
  if (Number.isFinite(t2)) return t2
  return 0
}

/**
 * Build a server-safe performance history context from caller-supplied logs.
 *
 * - Sorts newest-first
 * - Drops untrusted / demo logs
 * - Caps at the most recent 14
 * - Derives completedDayNumbers from `generatedWorkoutId` when parseable
 * - Computes the evidence hash
 *
 * Returns `hasEvidence: false` (with empty hash) when there is nothing usable
 * — never fakes evidence and never throws on missing fields.
 */
export function buildPerformanceHistoryContext(input: {
  recentWorkoutLogs?: ServerWorkoutLogInput[] | null
}): PerformanceHistoryContext {
  const raw = Array.isArray(input.recentWorkoutLogs) ? input.recentWorkoutLogs : []
  const trusted = raw.filter(isTrustedLog)
  const sorted = [...trusted].sort((a, b) => safeLogTimestamp(b) - safeLogTimestamp(a))
  const recent = sorted.slice(0, TRUSTED_LOG_CAP)

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

  const evidenceHash = buildEvidenceHashFromLogs(recent)

  return {
    hasEvidence: recent.length > 0 && evidenceHash.length > 0,
    evidenceHash,
    recentLogs: recent,
    completedDayNumbers,
    diagnostics: {
      rawLogCount: raw.length,
      trustedLogCount: trusted.length,
      cappedLogCount: recent.length,
      completedDayNumbersFromLogs: completedDayNumbers,
    },
  }
}

// =============================================================================
// SERVER OVERLAY APPLIER
// =============================================================================

/**
 * Apply Phase L performance feedback as part of authoritative server
 * generation. Calls the SAME resolver + applier the Program page boot effect
 * uses; the only difference is the `appliedBy: 'server'` + `evidenceHash`
 * provenance stamped onto each affected exercise.
 *
 * Safe defaults:
 *   - Returns the program unchanged when the context has no evidence.
 *   - Returns the program unchanged when the resolver reports
 *     `insufficient_data` or zero applied mutations.
 *   - Never throws; on any internal failure returns the original program
 *     plus the resolver's status object so the caller can log it.
 */
export function applyServerPerformanceFeedbackOverlay<T extends PhaseLProgramShape>(
  program: T,
  context: PerformanceHistoryContext,
  options?: { nowIso?: string },
): ServerOverlayResult<T> {
  const buildEmptyAdaptation = (): PerformanceFeedbackAdaptationResult => ({
    status: 'insufficient_data',
    signals: [],
    mutations: [],
    summary: 'No usable performance evidence supplied to server overlay.',
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
  })

  const buildEmptySummary = (
    status: PerformanceFeedbackAdaptationResult['status'],
  ): ServerOverlayResult<T>['summary'] => ({
    mutationsApplied: 0,
    mutationsBlocked: 0,
    completedSetsRead: 0,
    sessionsRead: 0,
    signalCount: 0,
    status,
  })

  if (!program || typeof program !== 'object' || !Array.isArray(program.sessions)) {
    return {
      program,
      adaptation: buildEmptyAdaptation(),
      changed: false,
      evidenceHash: context.evidenceHash,
      summary: buildEmptySummary('insufficient_data'),
    }
  }

  if (!context.hasEvidence) {
    return {
      program,
      adaptation: buildEmptyAdaptation(),
      changed: false,
      evidenceHash: context.evidenceHash,
      summary: buildEmptySummary('insufficient_data'),
    }
  }

  // Build session-by-day lookup so the extractor can compare actual reps/hold
  // against prescribed reps/hold from the matching program day.
  const sessionByDay: Record<number, PhaseLSessionShape> = {}
  for (const sess of program.sessions) {
    const dn = typeof sess.dayNumber === 'number' ? sess.dayNumber : -1
    if (dn >= 0) sessionByDay[dn] = sess
  }

  // Concatenate evidence across all recent logs.
  const evidence: CompletedSetEvidence[] = context.recentLogs.flatMap((log) =>
    extractCompletedSetEvidence(log, sessionByDay),
  )

  const adaptation = resolvePerformanceFeedbackAdaptation({
    currentProgram: program,
    completedSetEvidence: evidence,
    completedDayNumbers: context.completedDayNumbers,
    nowIso: options?.nowIso,
  })

  const summary = {
    mutationsApplied: adaptation.proof.mutationsApplied,
    mutationsBlocked: adaptation.proof.mutationsBlocked,
    completedSetsRead: adaptation.proof.completedSetsRead,
    sessionsRead: adaptation.proof.sessionsRead,
    signalCount: adaptation.signals.length,
    status: adaptation.status,
  }

  if (adaptation.proof.mutationsApplied === 0) {
    return {
      program,
      adaptation,
      changed: false,
      evidenceHash: context.evidenceHash,
      summary,
    }
  }

  const adapted = applyFuturePrescriptionMutations(
    program,
    adaptation.mutations,
    options?.nowIso,
    {
      appliedBy: 'server',
      evidenceHash: context.evidenceHash,
    },
  )

  return {
    program: adapted,
    adaptation,
    changed: true,
    evidenceHash: context.evidenceHash,
    summary,
  }
}

// =============================================================================
// IDEMPOTENCY HELPER — used by both server and client paths
// =============================================================================

/**
 * Returns true when the given program already carries any
 * performanceAdaptation stamp marked `appliedBy: 'server'` whose
 * `evidenceHash` matches the supplied hash. Used by:
 *
 *   - server overlay: short-circuit when caller mistakenly re-applies the
 *     same evidence after a regenerate within the same session.
 *   - client Program page boot effect: skip the client overlay when the
 *     server has already applied the exact same evidence.
 *
 * Safe defaults: returns false when the program has no sessions/exercises or
 * when the hash is empty.
 */
export function programAlreadyHasServerAdaptationFor(
  program: PhaseLProgramShape | null | undefined,
  evidenceHash: string,
): boolean {
  if (!program || !Array.isArray(program.sessions)) return false
  if (!evidenceHash) return false
  for (const sess of program.sessions) {
    if (!Array.isArray(sess.exercises)) continue
    for (const ex of sess.exercises) {
      const stamp = (ex as { performanceAdaptation?: { appliedBy?: string; evidenceHash?: string } })
        .performanceAdaptation
      if (
        stamp &&
        stamp.appliedBy === 'server' &&
        typeof stamp.evidenceHash === 'string' &&
        stamp.evidenceHash === evidenceHash
      ) {
        return true
      }
    }
  }
  return false
}

/**
 * Returns true when the given program already carries ANY server-applied
 * performanceAdaptation stamp (regardless of hash). Used by the Program page
 * boot effect to avoid the client overlay double-stacking on top of a
 * server-applied adaptation. Safe default: false on missing program.
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
