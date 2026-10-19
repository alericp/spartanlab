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
  try {
    return readResumableSessionSummary(localStorage.getItem(WORKOUT_SESSION_STORAGE_KEY), now, ownerUserId)
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
 * The single local snapshot may be replaced only by its owner, or after the
 * signed-in athlete has logged progress in the workout now on screen.
 * An empty open must not erase another account's unfinished workout.
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
  if (typeof owner !== 'string' || owner !== ownerUserId) return hasLoggedProgress
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
