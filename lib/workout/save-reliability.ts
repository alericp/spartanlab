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
  /**
   * The history write has not been confirmed. A successful evidence post must
   * not drop this id, or a later retry would mint a new one and duplicate
   * the session, personal records, and set evidence.
   */
  historyPending?: boolean
  /** The evidence post for this occurrence already reached the server. */
  evidenceSaved?: boolean
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

export interface SessionPersonalRecord {
  exerciseKey: string
  prType: string
  exerciseName: string
  newValue: number
  unit: string
}

function personalRecordKey(record: { exerciseKey: string; prType: string }): string {
  return `${record.exerciseKey}\0${record.prType}`
}

function parseSnapshotJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

/**
 * Reads the PR list already stored on a workout row.
 * Invalid entries are dropped. The workout row itself is not changed.
 */
export function readPersonalRecordSnapshot(value: unknown): SessionPersonalRecord[] {
  const parsed = typeof value === 'string' ? parseSnapshotJson(value) : value
  if (!Array.isArray(parsed)) return []
  const records: SessionPersonalRecord[] = []
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as Record<string, unknown>
    const exerciseKey = candidate.exerciseKey
    const prType = candidate.prType
    const newValue = typeof candidate.newValue === 'number'
      ? candidate.newValue
      : Number(candidate.newValue)
    if (typeof exerciseKey !== 'string' || exerciseKey.length === 0) continue
    if (typeof prType !== 'string' || prType.length === 0) continue
    if (!Number.isFinite(newValue)) continue
    records.push({
      exerciseKey,
      prType,
      exerciseName: typeof candidate.exerciseName === 'string' && candidate.exerciseName.length > 0
        ? candidate.exerciseName
        : exerciseKey,
      newValue,
      unit: typeof candidate.unit === 'string' ? candidate.unit : '',
    })
  }
  return records
}

/**
 * Personal records already stored for this workout are left untouched.
 * Only identities missing from that workout are returned for insert.
 */
export function missingSessionPersonalRecords<T extends { exerciseKey: string; prType: string }>(
  intended: T[],
  stored: Array<{ exerciseKey: string; prType: string }>,
): T[] {
  const storedKeys = new Set(stored.map(personalRecordKey))
  const accepted = new Set<string>()
  const missing: T[] = []
  for (const record of intended) {
    if (!record.exerciseKey || !record.prType) continue
    const key = personalRecordKey(record)
    if (storedKeys.has(key) || accepted.has(key)) continue
    accepted.add(key)
    missing.push(record)
  }
  return missing
}

export function personalRecordPersistencePlan(input: {
  lookup: 'known' | 'unknown'
  missingCount: number
  failedCount: number
}): 'unchanged' | 'completed' | 'retry' {
  if (input.lookup === 'unknown') return 'retry'
  if (input.missingCount === 0) return 'unchanged'
  if (input.failedCount > 0) return 'retry'
  return 'completed'
}

/** A pending evidence post still belongs to this occurrence. */
export function shouldKeepOccurrenceAfterLocalSave(
  serverEvidence: 'pending' | 'saved' | 'skipped' | undefined,
): boolean {
  return serverEvidence === 'pending'
}

/**
 * Evidence success while history is still unconfirmed marks the occurrence
 * instead of deleting it. The occurrence id stays the retry identity.
 */
export function occurrenceAfterEvidenceSave(
  stored: StoredOccurrence | null,
  occurrenceId: string,
): { action: 'ignore' } | { action: 'release' } | { action: 'keep'; occurrence: StoredOccurrence } {
  if (!stored || stored.occurrenceId !== occurrenceId) return { action: 'ignore' }
  if (stored.historyPending) {
    return {
      action: 'keep',
      occurrence: {
        sessionId: stored.sessionId,
        occurrenceId: stored.occurrenceId,
        historyPending: true,
        evidenceSaved: true,
      },
    }
  }
  return { action: 'release' }
}

/**
 * Drop the occurrence only after history is confirmed and evidence is settled.
 * A failed or timed-out history write keeps the original occurrence id.
 */
export function occurrenceAfterHistoryResult(input: {
  occurrence: StoredOccurrence
  historyConfirmed: boolean
  serverEvidence?: 'pending' | 'saved' | 'skipped'
}): { action: 'release' } | { action: 'keep'; occurrence: StoredOccurrence } {
  const evidenceSettled = input.occurrence.evidenceSaved === true
    || input.serverEvidence === 'saved'
    || input.serverEvidence === 'skipped'
  if (input.historyConfirmed && evidenceSettled) return { action: 'release' }
  return {
    action: 'keep',
    occurrence: {
      sessionId: input.occurrence.sessionId,
      occurrenceId: input.occurrence.occurrenceId,
      historyPending: !input.historyConfirmed,
      evidenceSaved: input.occurrence.evidenceSaved === true || input.serverEvidence === 'saved',
    },
  }
}

export function workoutLogIdForOccurrence(occurrenceId: string): string {
  return `workout-${occurrenceId}`
}

export interface WorkoutSaveAthleteStatus {
  state: 'in_progress' | 'saving' | 'saved' | 'failed'
  title: string
  detail: string
  historySync?: 'updated' | 'failed' | 'skipped'
}

/**
 * Athlete-facing save status. This reads the existing save result and does
 * not write a second log.
 */
export function describeWorkoutSaveResult(input: {
  outcome: 'in_progress' | 'saving' | 'failed' | 'saved'
  saveDisposition?: 'inserted' | 'kept'
  serverEvidence?: 'pending' | 'saved' | 'skipped'
  historySync?: 'updated' | 'failed' | 'skipped'
}): WorkoutSaveAthleteStatus {
  if (input.outcome === 'in_progress') {
    return {
      state: 'in_progress',
      title: 'In progress',
      detail: 'Logged sets stay on this device until you save the workout.',
    }
  }
  if (input.outcome === 'saving') {
    return {
      state: 'saving',
      title: 'Saving',
      detail: 'Saving this workout to your history.',
    }
  }
  if (input.outcome === 'failed') {
    return {
      state: 'failed',
      title: 'Save error',
      detail: 'This workout was not saved. Your logged sets are still here. Try again.',
    }
  }
  if (input.historySync === 'failed') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Workout saved locally. History sync failed. Your workout is still on this device.',
      historySync: 'failed',
    }
  }
  if (input.historySync === 'updated' && input.saveDisposition === 'kept') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Already saved. History is up to date. This did not add a second history entry.',
      historySync: 'updated',
    }
  }
  if (input.historySync === 'updated' && input.serverEvidence === 'pending') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Workout saved locally and History updated. Set evidence sync is still finishing.',
      historySync: 'updated',
    }
  }
  if (input.historySync === 'updated') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Workout saved locally and History updated.',
      historySync: 'updated',
    }
  }
  if (input.historySync === 'skipped' && input.saveDisposition === 'kept') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Already saved on this device. This did not add a second history entry, and History was not updated.',
      historySync: 'skipped',
    }
  }
  if (input.historySync === 'skipped') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Saved on this device. History was not updated.',
      historySync: 'skipped',
    }
  }
  if (input.saveDisposition === 'kept') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Already saved. This did not add a second history entry.',
    }
  }
  if (input.serverEvidence === 'pending') {
    return {
      state: 'saved',
      title: 'Saved',
      detail: 'Saved on this device. History sync is still finishing.',
    }
  }
  return {
    state: 'saved',
    title: 'Saved',
    detail: 'This workout is in your history.',
  }
}
