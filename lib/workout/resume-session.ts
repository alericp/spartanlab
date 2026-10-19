/**
 * Identity-only reader for an unfinished live workout.
 *
 * The live session component still owns hydration of completed sets, notes,
 * and overrides. This module only answers whether a recent in-progress
 * snapshot can be resumed, and which launch URL rebuilds that same session.
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

export function readResumableSessionSummary(
  raw: string | null,
  now = Date.now(),
): ResumableSessionSummary | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>

  if (record.schemaVersion !== WORKOUT_SESSION_SCHEMA_VERSION) return null
  if (typeof record.savedAt !== 'number') return null
  if (now - record.savedAt > RESUME_WINDOW_MS) return null

  const status = record.status
  if (status !== 'active' && status !== 'resting') return null

  const completedSetsCount = Array.isArray(record.completedSets) ? record.completedSets.length : 0
  const currentExerciseIndex = typeof record.currentExerciseIndex === 'number'
    ? record.currentExerciseIndex
    : 0
  if (completedSetsCount === 0 && currentExerciseIndex === 0) return null

  const dayLabel = typeof record.dayLabel === 'string' ? record.dayLabel : ''
  const dayNumber = typeof record.dayNumber === 'number' ? record.dayNumber : NaN
  const executionMode = record.executionMode === '30_min'
    || record.executionMode === '45_min'
    || record.executionMode === 'full'
    || record.executionMode === '10_min'
    || record.executionMode === '15_min'
    || record.executionMode === '20_min'
    ? record.executionMode
    : null
  const variantIndex = typeof record.variantIndex === 'number' ? record.variantIndex : null
  const weekOverride = typeof record.weekOverride === 'number'
    ? record.weekOverride
    : record.weekOverride === null
      ? null
      : null
  if (!dayLabel || !Number.isFinite(dayNumber) || executionMode === null || variantIndex === null) {
    return null
  }

  return {
    sessionId: typeof record.sessionId === 'string' ? record.sessionId : `session-${dayLabel}-${dayNumber}`,
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

export function getResumableSessionSummary(now = Date.now()): ResumableSessionSummary | null {
  if (typeof window === 'undefined') return null
  try {
    return readResumableSessionSummary(localStorage.getItem(WORKOUT_SESSION_STORAGE_KEY), now)
  } catch {
    return null
  }
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
}
