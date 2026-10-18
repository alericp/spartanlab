/**
 * Workout save identity and retry decisions.
 *
 * A completed log is kept on a repeated save. The occurrence id is stable for
 * one attempt, including a refresh that still has the draft, and changes when
 * a different session starts. Database uncertainty does not insert another
 * history row.
 */

export const WORKOUT_OCCURRENCE_STORAGE_KEY = 'spartanlab_workout_occurrence'

export interface StoredOccurrence {
  sessionId: string
  occurrenceId: string
}

export interface SaveIdentity {
  id: string
  occurrenceId?: string
  serverEvidence?: 'pending' | 'saved' | 'skipped'
}

export type LocalSavePlan<T extends SaveIdentity> =
  | { action: 'insert'; log: T }
  | { action: 'keep'; log: T }
  | { action: 'retry-server'; log: T }

export function createOccurrenceId(now = Date.now(), entropy = ''): string {
  const suffix = entropy || Math.random().toString(36).slice(2, 8)
  return `occ-${now}-${suffix}`
}

export function resolveOccurrenceId(input: {
  sessionId: string
  stored: StoredOccurrence | null
  createId?: () => string
}): { occurrence: StoredOccurrence; reused: boolean } {
  if (
    input.stored &&
    input.stored.sessionId === input.sessionId &&
    input.stored.occurrenceId
  ) {
    return { occurrence: input.stored, reused: true }
  }
  const occurrenceId = input.createId ? input.createId() : createOccurrenceId()
  return {
    occurrence: { sessionId: input.sessionId, occurrenceId },
    reused: false,
  }
}

/**
 * Repeated saves of a committed occurrence return the stored log.
 * A pending server copy retries that same log instead of appending another.
 * Calls without an occurrence id stay append-only for older entry points.
 */
export function planLocalWorkoutSave<T extends SaveIdentity>(
  existing: T[],
  incoming: T,
): LocalSavePlan<T> {
  if (!incoming.occurrenceId) {
    return { action: 'insert', log: incoming }
  }
  const match = existing.find(
    (log) => log.occurrenceId === incoming.occurrenceId || log.id === incoming.id,
  )
  if (!match) return { action: 'insert', log: incoming }
  if (match.serverEvidence === 'pending') return { action: 'retry-server', log: match }
  return { action: 'keep', log: match }
}

export function historyWritePlan(input: {
  databaseAvailable: boolean
  lookup: 'found' | 'absent' | 'unknown'
}): 'insert' | 'already_saved' | 'retry' {
  if (!input.databaseAvailable || input.lookup === 'unknown') return 'retry'
  if (input.lookup === 'found') return 'already_saved'
  return 'insert'
}

export function workoutLogIdForOccurrence(occurrenceId: string): string {
  return `workout-${occurrenceId}`
}
