/**
 * ============================================================================
 * MASTER-8C.32/8C.44 — WORKOUT LOG SESSION IDENTITY READ-ONLY BRIDGE
 * ============================================================================
 *
 * Pure, deterministic, read-only bridge that resolves completed-day/session
 * identity from trusted workout logs already loaded by the component.
 *
 * [MASTER-8C.44] Extended to support current-program scoping to prevent
 * stale/foreign logs from falsely marking days completed.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. Accepts logs passed in from the component (never reads storage itself).
 *   4. Never mutates program, sessions, exercises, sets, reps.
 *   5. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   6. Safe for empty arrays and missing fields.
 *   7. Does NOT call loadMutationPlans(), addConfirmedPlan(), clearMutationPlans().
 *   8. Does NOT write to localStorage/sessionStorage/database.
 */

// ─── Minimal log input shape ───────────────────────────────────────────────

/**
 * Minimal subset of WorkoutLog fields needed for session identity resolution.
 * Avoids importing the full WorkoutLog type to keep the helper decoupled.
 */
export interface MinimalWorkoutLogForSessionIdentity {
  readonly generatedWorkoutId?: string | null
  readonly sessionName?: string | null
  readonly trusted?: boolean | null
  readonly createdAt?: string | null
  readonly sessionDate?: string | null
}

/**
 * Minimal session shape for matching logs to program days.
 * Avoids importing AdaptiveSession directly.
 */
export interface MinimalSessionForIdentity {
  readonly dayNumber?: number | null
  readonly dayLabel?: string | null
  readonly focus?: string | null
  readonly focusLabel?: string | null
}

// ─── Output types ──────────────────────────────────────────────────────────

export type WorkoutLogSessionIdentityStatus =
  | 'no_logs'
  | 'identity_unavailable'
  | 'partially_resolved'
  | 'resolved'
  | 'program_scoped_resolved' // [MASTER-8C.44] All logs scoped to current program

export interface WorkoutLogSessionIdentityModel {
  readonly status: WorkoutLogSessionIdentityStatus
  /**
   * [MASTER-8C.44.1] Accepted completed days for current program ONLY.
   * When programScopeAvailable && requireProgramScope, this contains ONLY
   * logs whose extracted program id exactly matches currentProgramId.
   * Legacy/stale/foreign logs are EXCLUDED from this field.
   * Target resolution MUST consume this field, not rawResolvedDayNumbers.
   */
  readonly completedDayNumbers: readonly number[]
  readonly trustedWorkoutCount: number
  readonly resolvedWorkoutCount: number
  readonly unresolvedWorkoutCount: number
  readonly duplicateDayCount: number
  readonly latestIdentityLabel: string | null
  readonly sourceLabels: readonly string[]
  readonly missingProof: readonly string[]
  readonly safetyNotes: readonly string[]
  // [MASTER-8C.44] Current-program scoping fields
  readonly currentProgramId: string | null
  readonly programScopeAvailable: boolean
  /**
   * [MASTER-8C.44.1] Same as completedDayNumbers in scoped mode.
   * Explicit alias for UI proof display.
   */
  readonly programScopedCompletedDayNumbers: readonly number[]
  /**
   * [MASTER-8C.44.1] All parseable day numbers from trusted logs, including
   * legacy/stale/foreign. For DIAGNOSTICS ONLY - never use for target resolution.
   */
  readonly rawResolvedDayNumbers: readonly number[]
  readonly staleOrForeignLogCount: number
  readonly unscopedLegacyLogCount: number
  readonly ignoredLogCount: number
  readonly scopeSafetyNotes: readonly string[]
  // Locked safety flags
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly mutationAllowed: false
  readonly canMutateNow: false
}

// ─── Input type ────────────────────────────────────────────────────────────

export interface WorkoutLogSessionIdentityInput {
  readonly logs: readonly MinimalWorkoutLogForSessionIdentity[]
  readonly programSessions: readonly MinimalSessionForIdentity[]
  // [MASTER-8C.44] Optional current program scoping
  readonly currentProgramId?: string | null
  readonly currentProgramCreatedAt?: string | null
  readonly requireProgramScope?: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────

const LOCKED_FLAGS = {
  noProgramChangesApplied: true as const,
  noFutureSessionChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
  mutationAllowed: false as const,
  canMutateNow: false as const,
}

const EMPTY_MODEL: WorkoutLogSessionIdentityModel = {
  status: 'no_logs',
  completedDayNumbers: [],
  trustedWorkoutCount: 0,
  resolvedWorkoutCount: 0,
  unresolvedWorkoutCount: 0,
  duplicateDayCount: 0,
  latestIdentityLabel: null,
  sourceLabels: [],
  missingProof: ['Completed workout logs required'],
  safetyNotes: ['No trusted workout logs available for session identity resolution'],
  // [MASTER-8C.44] Program scope fields
  currentProgramId: null,
  programScopeAvailable: false,
  programScopedCompletedDayNumbers: [],
  rawResolvedDayNumbers: [], // [MASTER-8C.44.1] Diagnostics only
  staleOrForeignLogCount: 0,
  unscopedLegacyLogCount: 0,
  ignoredLogCount: 0,
  scopeSafetyNotes: ['No logs available for program scoping'],
  ...LOCKED_FLAGS,
}

// ─── Day-number extraction from generatedWorkoutId ─────────────────────────

/**
 * Extracts a day number from a generatedWorkoutId string.
 * 
 * Recognizes patterns:
 *   - "...day-1..." / "...day_1..." / "...day1..."
 *   - "...Day 1..." / "...DAY-1..."
 * 
 * Returns null if no day number can be safely extracted.
 */
function extractDayNumberFromGeneratedWorkoutId(
  generatedWorkoutId: string,
): number | null {
  const match = generatedWorkoutId.match(/day[-_\s]?(\d+)/i)
  if (!match) return null
  const dayNum = Number.parseInt(match[1], 10)
  if (!Number.isFinite(dayNum) || dayNum < 0) return null
  return dayNum
}

/**
 * [MASTER-8C.44] Extracts program identity from generatedWorkoutId.
 * 
 * Uses the observed convention from workout-log-service.ts:
 *   generatedWorkoutId?.split('_session_')[0] → programId
 * 
 * Returns null if _session_ is absent or the id cannot be extracted.
 */
export function extractProgramIdentityFromGeneratedWorkoutId(
  generatedWorkoutId: string | null | undefined,
): string | null {
  if (!generatedWorkoutId || typeof generatedWorkoutId !== 'string') {
    return null
  }
  const parts = generatedWorkoutId.split('_session_')
  if (parts.length < 2 || !parts[0]) {
    return null
  }
  return parts[0]
}

// ─── Label helpers ─────────────────────────────────────────────────────────

export function getSessionIdentityStatusLabel(
  status: WorkoutLogSessionIdentityStatus,
): string {
  switch (status) {
    case 'no_logs': return 'No logs'
    case 'identity_unavailable': return 'Identity unavailable'
    case 'partially_resolved': return 'Partial'
    case 'resolved': return 'Resolved'
    case 'program_scoped_resolved': return 'Program Scoped'
    default: return 'Unknown'
  }
}

export function getSessionIdentityStatusColor(
  status: WorkoutLogSessionIdentityStatus,
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'no_logs':
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#6A6A7A]', border: 'border-[#2A2A35]' }
    case 'identity_unavailable':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'partially_resolved':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
    case 'resolved':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'program_scoped_resolved':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' }
    default:
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#8A8A9A]', border: 'border-[#2A2A35]' }
  }
}

// ─── Main resolver ─────────────────────────────────────────────────────────

/**
 * Resolves completed-day/session identity from trusted workout logs.
 * 
 * [MASTER-8C.44] Extended to support current-program scoping:
 * - If currentProgramId is provided, only logs matching that program count
 * - Stale/foreign logs are tracked but ignored for completion
 * - Legacy unscoped mode is reported honestly
 */
export function resolveWorkoutLogSessionIdentity(
  input: WorkoutLogSessionIdentityInput,
): WorkoutLogSessionIdentityModel {
  const { logs, programSessions, currentProgramId, requireProgramScope } = input
  const programScopeAvailable = typeof currentProgramId === 'string' && currentProgramId.length > 0

  // ── No logs at all ─────────────────────────────────────────────────────
  if (!logs || logs.length === 0) {
    return {
      ...EMPTY_MODEL,
      currentProgramId: currentProgramId ?? null,
      programScopeAvailable,
      scopeSafetyNotes: programScopeAvailable
        ? ['Program scope available but no logs to evaluate']
        : ['Program scope unavailable — legacy mode'],
    }
  }

  // Build a set of valid program day numbers for validation
  const validDayNumbers = new Set<number>()
  for (let i = 0; i < programSessions.length; i++) {
    const dn = programSessions[i].dayNumber
    if (typeof dn === 'number' && Number.isFinite(dn)) {
      validDayNumbers.add(dn)
    } else {
      // Fallback to 1-indexed if dayNumber is missing
      validDayNumbers.add(i + 1)
    }
  }

  // Filter trusted logs only
  const trustedLogs = logs.filter(log => log.trusted !== false)
  if (trustedLogs.length === 0) {
    return {
      ...EMPTY_MODEL,
      status: 'identity_unavailable',
      trustedWorkoutCount: 0,
      unresolvedWorkoutCount: logs.length,
      missingProof: ['Trusted workout logs required (all logs are untrusted)'],
      safetyNotes: ['All available workout logs are untrusted — cannot resolve session identity'],
      currentProgramId: currentProgramId ?? null,
      programScopeAvailable,
      scopeSafetyNotes: ['No trusted logs for program scoping evaluation'],
    }
  }

  // Extract day numbers from trusted logs with program scoping
  const resolvedDays = new Set<number>()
  const programScopedDays = new Set<number>()
  const allExtractedDays: number[] = []
  let resolvedCount = 0
  let unresolvedCount = 0
  let duplicateDayCount = 0
  let staleOrForeignLogCount = 0
  let unscopedLegacyLogCount = 0
  const sourceLabels: string[] = []
  const scopeSafetyNotes: string[] = []

  for (const log of trustedLogs) {
    const gid = log.generatedWorkoutId
    let extracted: number | null = null
    let logProgramId: string | null = null

    if (typeof gid === 'string' && gid.length > 0) {
      extracted = extractDayNumberFromGeneratedWorkoutId(gid)
      logProgramId = extractProgramIdentityFromGeneratedWorkoutId(gid)
    }

    if (extracted !== null && validDayNumbers.has(extracted)) {
      // Valid day number that matches a program session
      if (resolvedDays.has(extracted)) {
        duplicateDayCount++
      }
      resolvedDays.add(extracted)
      allExtractedDays.push(extracted)
      resolvedCount++

      // [MASTER-8C.44] Program scope check
      if (programScopeAvailable) {
        if (logProgramId === currentProgramId) {
          // Log belongs to current program - count as completed
          programScopedDays.add(extracted)
        } else if (logProgramId !== null) {
          // Log has a program id but it doesn't match - stale/foreign
          staleOrForeignLogCount++
        } else {
          // Log has no program id - legacy unscoped
          unscopedLegacyLogCount++
        }
      } else {
        // No program scope available - all resolved logs count in legacy mode
        programScopedDays.add(extracted)
        unscopedLegacyLogCount++
      }

      const sessionLabel = log.sessionName ?? `Day ${extracted}`
      if (!sourceLabels.includes(sessionLabel)) {
        sourceLabels.push(sessionLabel)
      }
    } else {
      unresolvedCount++
    }
  }

  // Sort completed day numbers for deterministic output
  const completedDayNumbers = Array.from(resolvedDays).sort((a, b) => a - b)
  const programScopedCompletedDayNumbers = Array.from(programScopedDays).sort((a, b) => a - b)
  const ignoredLogCount = staleOrForeignLogCount

  // Determine status
  let status: WorkoutLogSessionIdentityStatus
  const missingProof: string[] = []
  const safetyNotes: string[] = []

  if (resolvedCount === 0) {
    status = 'identity_unavailable'
    missingProof.push('Parseable generatedWorkoutId with day number required')
    missingProof.push('No trusted logs could be mapped to program session days')
    safetyNotes.push(
      `${trustedLogs.length} trusted log(s) exist but none have parseable day identifiers`
    )
    safetyNotes.push('Future targeting remains locked until completed-session identity is proven')
  } else if (programScopeAvailable && programScopedCompletedDayNumbers.length === resolvedCount && staleOrForeignLogCount === 0) {
    // [MASTER-8C.44] All logs are program-scoped
    status = 'program_scoped_resolved'
    safetyNotes.push(
      `All ${resolvedCount} trusted log(s) resolved and scoped to current program`
    )
    safetyNotes.push(`Completed day(s): ${programScopedCompletedDayNumbers.join(', ')}`)
    if (duplicateDayCount > 0) {
      safetyNotes.push(`${duplicateDayCount} duplicate day mapping(s) detected`)
    }
    safetyNotes.push('Completed sessions are permanently protected')
  } else if (unresolvedCount > 0 || staleOrForeignLogCount > 0) {
    status = 'partially_resolved'
    if (unresolvedCount > 0) {
      missingProof.push(
        `${unresolvedCount} trusted log(s) could not be mapped to program sessions`
      )
    }
    if (staleOrForeignLogCount > 0) {
      missingProof.push(
        `${staleOrForeignLogCount} log(s) belong to different program(s) — ignored`
      )
    }
    safetyNotes.push(
      `${programScopedCompletedDayNumbers.length} log(s) scoped to current program: ${programScopedCompletedDayNumbers.join(', ') || 'none'}`
    )
    if (duplicateDayCount > 0) {
      safetyNotes.push(`${duplicateDayCount} duplicate day mapping(s) detected`)
    }
    safetyNotes.push('Completed sessions are permanently protected')
  } else {
    status = 'resolved'
    safetyNotes.push(
      `All ${resolvedCount} trusted log(s) resolved to day(s): ${completedDayNumbers.join(', ')}`
    )
    if (duplicateDayCount > 0) {
      safetyNotes.push(`${duplicateDayCount} duplicate day mapping(s) detected`)
    }
    safetyNotes.push('Completed sessions are permanently protected')
  }

  // [MASTER-8C.44] Build scope safety notes
  if (programScopeAvailable) {
    scopeSafetyNotes.push(`Current program: ${currentProgramId}`)
    scopeSafetyNotes.push(`Program-scoped completed: ${programScopedCompletedDayNumbers.length}`)
    if (staleOrForeignLogCount > 0) {
      scopeSafetyNotes.push(`Stale/foreign logs ignored: ${staleOrForeignLogCount}`)
    }
    if (unscopedLegacyLogCount > 0) {
      scopeSafetyNotes.push(`Legacy unscoped logs: ${unscopedLegacyLogCount}`)
    }
    scopeSafetyNotes.push('Only logs matching this program can mark days completed')
  } else {
    scopeSafetyNotes.push('Program identity unavailable')
    scopeSafetyNotes.push('Legacy day-number matching is in use')
    if (requireProgramScope) {
      scopeSafetyNotes.push('No mutation allowed from unscoped proof')
    }
  }

  // Latest identity label
  const latestIdentityLabel = sourceLabels.length > 0
    ? sourceLabels[sourceLabels.length - 1]
    : null

  // [MASTER-8C.44.1] Determine accepted completed days based on scope requirements
  // If programScopeAvailable: use ONLY program-scoped completed days
  // If !programScopeAvailable && requireProgramScope: NO completed days allowed (conservative)
  // If !programScopeAvailable && !requireProgramScope: legacy mode, all resolved days
  let acceptedCompletedDays: readonly number[]
  if (programScopeAvailable) {
    // Only logs matching current program count as completed
    acceptedCompletedDays = programScopedCompletedDayNumbers
  } else if (requireProgramScope) {
    // Scope required but unavailable - NO mutation allowed, no completed days
    acceptedCompletedDays = []
  } else {
    // Legacy mode - all resolved days count (backwards compatibility)
    acceptedCompletedDays = completedDayNumbers
  }

  return {
    status,
    // [MASTER-8C.44.1] completedDayNumbers = accepted current-program completed days ONLY
    // Target resolution MUST use this field. Legacy/stale/foreign logs are EXCLUDED.
    completedDayNumbers: acceptedCompletedDays,
    trustedWorkoutCount: trustedLogs.length,
    resolvedWorkoutCount: resolvedCount,
    unresolvedWorkoutCount: unresolvedCount,
    duplicateDayCount,
    latestIdentityLabel,
    sourceLabels,
    missingProof,
    safetyNotes,
    // [MASTER-8C.44] Program scope fields
    currentProgramId: currentProgramId ?? null,
    programScopeAvailable,
    // [MASTER-8C.44.1] Same as completedDayNumbers in scoped mode
    programScopedCompletedDayNumbers: acceptedCompletedDays,
    // [MASTER-8C.44.1] ALL parseable day numbers - DIAGNOSTICS ONLY
    rawResolvedDayNumbers: completedDayNumbers,
    staleOrForeignLogCount,
    unscopedLegacyLogCount,
    ignoredLogCount,
    scopeSafetyNotes,
    ...LOCKED_FLAGS,
  }
}
