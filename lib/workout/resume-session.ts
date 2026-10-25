/**
 * Identity-only reader for an unfinished live workout.
 *
 * The live session component still owns hydration of completed sets, notes,
 * and overrides. This module only answers whether a recent in-progress
 * snapshot can be resumed, and which launch URL rebuilds that same session.
 *
 * One browser profile keeps one unfinished snapshot. Logging a set in a
 * different workout replaces it. A snapshot is resumed only for the Clerk
 * user id that wrote it, and only when its session id is
 * `session-${dayLabel}-${dayNumber}`.
 */

import { athleteStorageKey, getBoundAthleteId, legacyLocalStorageOpen, readAthleteItem } from '../athlete-local-scope'
import type { WorkoutExecutionMode } from '@/lib/workout/live-workout-authority-contract'

export const WORKOUT_SESSION_STORAGE_KEY = 'spartanlab_workout_session'
export const WORKOUT_SESSION_SCHEMA_VERSION = 'workout_session_v3_grouped_runtime'

const RESUME_WINDOW_MS = 4 * 60 * 60 * 1000

export interface ResumableSessionSummary {
  sessionId: string
  dayLabel: string
  dayNumber: number
  executionMode: WorkoutExecutionMode
  variantIndex: number
  weekOverride: number | null
  status: 'active' | 'resting'
  savedAt: number
  completedSetsCount: number
  currentExerciseIndex: number
  currentSetNumber: number
  elapsedSeconds: number
}

export function sessionIdForWorkout(dayLabel: string, dayNumber: number): string {
  return `session-${dayLabel}-${dayNumber}`
}

export function readResumableSessionSummary(
  raw: string | null,
  now = Date.now(),
  ownerUserId: string | null = null,
): ResumableSessionSummary | null {
  if (!raw || !ownerUserId) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>

  if (record.schemaVersion !== WORKOUT_SESSION_SCHEMA_VERSION) return null
  if (record.ownerUserId !== ownerUserId) return null
  if (typeof record.savedAt !== 'number' || !Number.isFinite(record.savedAt)) return null
  const age = now - record.savedAt
  if (age < 0 || age > RESUME_WINDOW_MS) return null

  const status = record.status
  if (status !== 'active' && status !== 'resting') return null

  const completedSetsCount = Array.isArray(record.completedSets) ? record.completedSets.length : 0
  const currentExerciseIndex = typeof record.currentExerciseIndex === 'number'
    ? record.currentExerciseIndex
    : 0
  if (completedSetsCount === 0 && currentExerciseIndex === 0) return null

  const dayLabel = typeof record.dayLabel === 'string' ? record.dayLabel : ''
  const dayNumber = typeof record.dayNumber === 'number' ? record.dayNumber : NaN
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return null
  const executionMode = record.executionMode === '30_min'
    || record.executionMode === '45_min'
    || record.executionMode === 'full'
    || record.executionMode === '10_min'
    || record.executionMode === '15_min'
    || record.executionMode === '20_min'
    ? record.executionMode
    : null
  const variantIndex = typeof record.variantIndex === 'number' && Number.isInteger(record.variantIndex) && record.variantIndex >= 0
    ? record.variantIndex
    : null
  const weekOverride = typeof record.weekOverride === 'number'
    ? record.weekOverride
    : record.weekOverride === null
      ? null
      : null
  const sessionId = typeof record.sessionId === 'string' ? record.sessionId : ''
  if (!dayLabel || executionMode === null || variantIndex === null) return null
  if (sessionId !== sessionIdForWorkout(dayLabel, dayNumber)) return null

  return {
    sessionId,
    dayLabel,
    dayNumber,
    executionMode,
    variantIndex,
    weekOverride,
    status,
    savedAt: record.savedAt,
    completedSetsCount,
    currentExerciseIndex,
    currentSetNumber: typeof record.currentSetNumber === 'number' ? record.currentSetNumber : 1,
    elapsedSeconds: typeof record.elapsedSeconds === 'number' ? record.elapsedSeconds : 0,
  }
}

export function getResumableSessionSummary(
  ownerUserId: string | null,
  now = Date.now(),
): ResumableSessionSummary | null {
  if (typeof window === 'undefined' || !ownerUserId) return null
  const bound = getBoundAthleteId()
  if (!legacyLocalStorageOpen() && bound !== ownerUserId) return null
  try {
    const raw = legacyLocalStorageOpen()
      ? localStorage.getItem(WORKOUT_SESSION_STORAGE_KEY)
      : readAthleteItem(WORKOUT_SESSION_STORAGE_KEY)
    return readResumableSessionSummary(raw, now, ownerUserId)
  } catch {
    return null
  }
}

export function resumeMatchesLoadedSession(
  summary: ResumableSessionSummary,
  loaded: { dayLabel: string; dayNumber: number },
): boolean {
  return summary.dayLabel === loaded.dayLabel
    && summary.dayNumber === loaded.dayNumber
    && summary.sessionId === sessionIdForWorkout(loaded.dayLabel, loaded.dayNumber)
}

/**
 * The single local snapshot may be replaced only by its owner.
 * Logged progress in a different account does not erase the stored session.
 */
export function canReplaceStoredSession(
  raw: string | null,
  ownerUserId: string | null,
  currentSessionId: string,
  hasLoggedProgress: boolean,
  now = Date.now(),
): boolean {
  if (!ownerUserId) return false
  if (!raw) return true
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return hasLoggedProgress
  }
  if (!data || typeof data !== 'object') return hasLoggedProgress
  const owner = (data as { ownerUserId?: unknown }).ownerUserId
  if (typeof owner !== 'string' || owner !== ownerUserId) return false
  const summary = readResumableSessionSummary(raw, now, ownerUserId)
  if (summary && summary.sessionId !== currentSessionId && !hasLoggedProgress) return false
  return true
}

export function buildResumeWorkoutUrl(summary: ResumableSessionSummary): string {
  const params = new URLSearchParams()
  params.set('day', String(summary.dayNumber))
  params.set('mode', summary.executionMode)
  params.set('variant', String(summary.variantIndex))
  if (summary.weekOverride !== null && Number.isFinite(summary.weekOverride)) {
    params.set('week', String(summary.weekOverride))
  }
  params.set('resume', '1')
  return `/workout/session?${params.toString()}`
}

/**
 * A different session id means this route is not the unfinished workout.
 * Leaving the snapshot in place lets Today offer Resume. Corrupt payloads
 * for the session being opened are still cleared.
 */
export function shouldClearStoredSessionOnRestoreRejection(reason: string): boolean {
  return reason !== 'session_id_mismatch'
    && reason !== 'owner_mismatch'
    && reason !== 'owner_missing'
}

const BOOT_FAILED_KEY = 'spartanlab_workout_boot_failed'
const CRASH_RECOVERY_WINDOW_MS = 5 * 60 * 1000

/**
 * Remember which athlete's unfinished snapshot a crash may clear.
 * A marker without an owner clears nothing.
 */
export function recordCrashRecoveryMarker(ownerUserId: string | null, now = Date.now()): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(BOOT_FAILED_KEY, JSON.stringify({
      at: now,
      ownerUserId: ownerUserId ?? null,
    }))
  } catch {
    // The unfinished snapshot stays if the marker cannot be written.
  }
}

/**
 * Clear only the named athlete's unfinished snapshot.
 * Legacy numeric markers and another account's snapshot are left in place.
 */
export function applyOwnedCrashRecoveryWipe(now = Date.now()): boolean {
  if (typeof localStorage === 'undefined') return false
  let raw: string | null
  try {
    raw = localStorage.getItem(BOOT_FAILED_KEY)
  } catch {
    return false
  }
  if (!raw) return false

  let at = Number.NaN
  let owner: string | null = null
  let legacyMarker = false
  try {
    const parsed = JSON.parse(raw) as { at?: unknown; ownerUserId?: unknown }
    if (parsed && typeof parsed === 'object' && typeof parsed.at === 'number') {
      at = parsed.at
      owner = typeof parsed.ownerUserId === 'string' && parsed.ownerUserId ? parsed.ownerUserId : null
    } else {
      legacyMarker = true
    }
  } catch {
    legacyMarker = true
  }

  if (legacyMarker) {
    try { localStorage.removeItem(BOOT_FAILED_KEY) } catch { /* keep the sessions */ }
    return false
  }
  const age = now - at
  if (!Number.isFinite(at) || age < 0 || age >= CRASH_RECOVERY_WINDOW_MS || !owner) {
    try { localStorage.removeItem(BOOT_FAILED_KEY) } catch { /* marker only */ }
    return false
  }
  try {
    localStorage.removeItem(athleteStorageKey(WORKOUT_SESSION_STORAGE_KEY, owner))
    localStorage.removeItem(BOOT_FAILED_KEY)
  } catch {
    return false
  }
  return true
}
