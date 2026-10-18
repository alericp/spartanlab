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

export function workoutLogIdForOccurrence(occurrenceId: string): string {
  return `workout-${occurrenceId}`
}
