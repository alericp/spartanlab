/**
 * ============================================================================
 * MASTER-8C.32 / AB20.4.25 — WORKOUT LOG SESSION IDENTITY READ-ONLY BRIDGE
 * ============================================================================
 *
 * Pure, deterministic, read-only bridge that resolves completed-day/session
 * identity from trusted workout logs already loaded by the component.
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

export interface WorkoutLogSessionIdentityModel {
  readonly status: WorkoutLogSessionIdentityStatus
  readonly completedDayNumbers: readonly number[]
  readonly trustedWorkoutCount: number
  readonly resolvedWorkoutCount: number
  readonly unresolvedWorkoutCount: number
  readonly duplicateDayCount: number
  readonly latestIdentityLabel: string | null
  readonly sourceLabels: readonly string[]
  readonly missingProof: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly mutationAllowed: false
  readonly canMutateNow: false
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
 * 
 * This regex is intentionally conservative: it only matches
 * explicit day markers, never infers from array indices.
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

// ─── Label helpers ─────────────────────────────────────────────────────────

export function getSessionIdentityStatusLabel(
  status: WorkoutLogSessionIdentityStatus,
): string {
  switch (status) {
    case 'no_logs': return 'No logs'
    case 'identity_unavailable': return 'Identity unavailable'
    case 'partially_resolved': return 'Partial'
    case 'resolved': return 'Resolved'
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
    default:
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#8A8A9A]', border: 'border-[#2A2A35]' }
  }
}

// ─── Main resolver ─────────────────────────────────────────────────────────

/**
 * Resolves completed-day/session identity from trusted workout logs.
 * 
 * This is a pure, read-only function that:
 * 1. Accepts logs already loaded by the component (never reads storage).
 * 2. Extracts day numbers from generatedWorkoutId using a conservative regex.
 * 3. Validates extracted days against program session day numbers.
 * 4. Reports resolved, unresolved, and duplicate counts honestly.
 * 5. Never mutates anything.
 */
export function resolveWorkoutLogSessionIdentity(input: {
  readonly logs: readonly MinimalWorkoutLogForSessionIdentity[]
  readonly programSessions: readonly MinimalSessionForIdentity[]
}): WorkoutLogSessionIdentityModel {
  const { logs, programSessions } = input

  // ── No logs at all ─────────────────────────────────────────────────────
  if (!logs || logs.length === 0) {
    return EMPTY_MODEL
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
    }
  }

  // Extract day numbers from trusted logs
  const resolvedDays = new Set<number>()
  const allExtractedDays: number[] = []
  let resolvedCount = 0
  let unresolvedCount = 0
  let duplicateDayCount = 0
  const sourceLabels: string[] = []

  for (const log of trustedLogs) {
    const gid = log.generatedWorkoutId
    let extracted: number | null = null

    if (typeof gid === 'string' && gid.length > 0) {
      extracted = extractDayNumberFromGeneratedWorkoutId(gid)
    }

    if (extracted !== null && validDayNumbers.has(extracted)) {
      // Valid day number that matches a program session
      if (resolvedDays.has(extracted)) {
        duplicateDayCount++
      }
      resolvedDays.add(extracted)
      allExtractedDays.push(extracted)
      resolvedCount++

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
  } else if (unresolvedCount > 0) {
    status = 'partially_resolved'
    missingProof.push(
      `${unresolvedCount} trusted log(s) could not be mapped to program sessions`
    )
    safetyNotes.push(
      `${resolvedCount} log(s) resolved to day(s): ${completedDayNumbers.join(', ')}`
    )
    safetyNotes.push(
      `${unresolvedCount} log(s) have missing/unparseable generatedWorkoutId — ignored for targeting`
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

  // Latest identity label
  const latestIdentityLabel = sourceLabels.length > 0
    ? sourceLabels[sourceLabels.length - 1]
    : null

  return {
    status,
    completedDayNumbers,
    trustedWorkoutCount: trustedLogs.length,
    resolvedWorkoutCount: resolvedCount,
    unresolvedWorkoutCount: unresolvedCount,
    duplicateDayCount,
    latestIdentityLabel,
    sourceLabels,
    missingProof,
    safetyNotes,
    ...LOCKED_FLAGS,
  }
}
