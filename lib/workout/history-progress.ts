/**
 * History sync, comparison, and display decisions for a saved workout.
 *
 * The local workout log stays the device record. persistWorkoutSession stays
 * the history writer. These helpers only decide what the athlete is told and
 * which existing snapshot values are safe to show.
 */

import type { ExerciseResultSnapshot, PRHitSnapshot, CompletedSetData } from '@/types/history'
import { workoutNoteSummaryLine } from './notes-interpretation'
import {
  historyWritePlan,
  missingSessionPersonalRecords,
  readPersonalRecordSnapshot,
  shouldKeepOccurrenceAfterLocalSave,
  type SessionPersonalRecord,
} from './save-reliability'

export type HistorySyncState = 'updated' | 'failed' | 'skipped'

export function classifyHistoryPersistence(
  result: { persisted?: 'saved' | 'duplicate' | 'failed' } | null | undefined,
): HistorySyncState {
  if (!result) return 'skipped'
  if (result.persisted === 'saved' || result.persisted === 'duplicate') return 'updated'
  return 'failed'
}

/**
 * A failed history write keeps the occurrence id so the next attempt uses the
 * same client session. Pending set evidence still keeps it too.
 */
export function shouldRetainOccurrenceForHistoryRetry(input: {
  serverEvidence?: 'pending' | 'saved' | 'skipped'
  historySync?: HistorySyncState
}): boolean {
  if (input.historySync === 'failed') return true
  return shouldKeepOccurrenceAfterLocalSave(input.serverEvidence)
}

export interface HistorySyncRetryPlan {
  localAction: 'insert' | 'keep' | 'retry-server'
  historyAction: 'insert' | 'already_saved' | 'retry'
  personalRecordsToWrite: SessionPersonalRecord[]
  rerunsInsertedEffects: boolean
  discardsLocalWorkout: false
}

/**
 * A later save of the same occurrence does not append another local log or
 * another personal record that is already stored. History inserts only when
 * the existing writer says the session is absent.
 */
export function planHistorySyncRetry(input: {
  localAlreadyStored: boolean
  serverEvidence?: 'pending' | 'saved' | 'skipped'
  databaseAvailable: boolean
  lookup: 'found' | 'absent' | 'unknown'
  intendedRecords: SessionPersonalRecord[]
  storedRecords: Array<{ exerciseKey: string; prType: string }>
}): HistorySyncRetryPlan {
  const localAction = input.localAlreadyStored
    ? input.serverEvidence === 'pending' ? 'retry-server' : 'keep'
    : 'insert'
  const historyAction = historyWritePlan({
    databaseAvailable: input.databaseAvailable,
    lookup: input.lookup,
  })
  const personalRecordsToWrite = historyAction === 'retry'
    ? []
    : missingSessionPersonalRecords(
      input.intendedRecords,
      historyAction === 'already_saved' ? input.storedRecords : [],
    )
  return {
    localAction,
    historyAction,
    personalRecordsToWrite,
    rerunsInsertedEffects: localAction === 'insert',
    discardsLocalWorkout: false,
  }
}

export type HistoryHttpClass = 'ready' | 'missing' | 'error'

export function classifyHistoryHttp(status: number, threw = false): HistoryHttpClass {
  if (threw) return 'error'
  if (status >= 200 && status < 300) return 'ready'
  if (status === 404) return 'missing'
  return 'error'
}

export function historyLoadCopy(
  kind: 'error' | 'empty' | 'missing',
  surface: 'archive' | 'workouts' | 'session',
): { title: string; detail: string } {
  if (kind === 'error' && surface === 'archive') {
    return {
      title: 'History could not be loaded',
      detail: 'This is a loading problem. It does not mean you have no saved workouts.',
    }
  }
  if (kind === 'error' && surface === 'workouts') {
    return {
      title: 'Workout history could not be loaded',
      detail: 'This is a loading problem. It does not mean you have no workout history.',
    }
  }
  if (kind === 'error') {
    return {
      title: 'History could not be loaded',
      detail: 'This workout could not be loaded. That does not mean it was removed.',
    }
  }
  if (kind === 'missing') {
    return {
      title: 'Session Not Found',
      detail: 'This workout session could not be found or may have been removed.',
    }
  }
  if (surface === 'workouts') {
    return {
      title: 'No Workout History',
      detail: 'Complete your first workout to start building your training history.',
    }
  }
  return {
    title: 'No workout history yet',
    detail: 'Complete your first session to start building your training archive.',
  }
}

export interface ExerciseComparison {
  exerciseId: string
  exerciseName: string
  metric: 'reps' | 'hold' | 'load'
  previous: number
  latest: number
  direction: 'higher' | 'lower' | 'same'
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function bestPositive(values: number[] | undefined): number | null {
  if (!values) return null
  const nums = values.map(positiveNumber).filter((value): value is number => value !== null)
  if (nums.length === 0) return null
  return Math.max(...nums)
}

/**
 * Compare two existing snapshots. A metric is included only when both sides
 * have a real number. Missing values are left out rather than treated as zero.
 */
export function compareExerciseSnapshots(
  previous: ExerciseResultSnapshot[],
  latest: ExerciseResultSnapshot[],
): ExerciseComparison[] {
  const previousByKey = new Map<string, ExerciseResultSnapshot>()
  for (const exercise of previous) {
    const key = exercise.exerciseId || exercise.exerciseName
    if (key) previousByKey.set(key, exercise)
  }
  const comparisons: ExerciseComparison[] = []
  for (const exercise of latest) {
    const key = exercise.exerciseId || exercise.exerciseName
    const prior = key ? previousByKey.get(key) : undefined
    if (!prior) continue
    const pairs: Array<{ metric: ExerciseComparison['metric']; previous: number | null; latest: number | null }> = [
      {
        metric: 'reps',
        previous: bestPositive(prior.actual?.repsPerSet),
        latest: bestPositive(exercise.actual?.repsPerSet),
      },
      {
        metric: 'hold',
        previous: bestPositive(prior.actual?.holdPerSet),
        latest: bestPositive(exercise.actual?.holdPerSet),
      },
      {
        metric: 'load',
        previous: positiveNumber(prior.actual?.weightUsed),
        latest: positiveNumber(exercise.actual?.weightUsed),
      },
    ]
    for (const pair of pairs) {
      if (pair.previous === null || pair.latest === null) continue
      comparisons.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        metric: pair.metric,
        previous: pair.previous,
        latest: pair.latest,
        direction: pair.latest > pair.previous ? 'higher' : pair.latest < pair.previous ? 'lower' : 'same',
      })
    }
  }
  return comparisons
}

export function formatExerciseComparison(comparison: ExerciseComparison): string {
  const unit = comparison.metric === 'hold' ? 's hold' : comparison.metric === 'reps' ? 'reps' : 'load'
  const relation = comparison.direction === 'higher'
    ? 'up from'
    : comparison.direction === 'lower'
      ? 'down from'
      : 'same as'
  return `${comparison.exerciseName} ${unit} ${comparison.latest}, ${relation} ${comparison.previous}.`
}

export function previousExerciseSnapshots<T extends {
  id: string
  workoutDate: string
  updatedAt?: string
  exerciseResultsSnapshot?: ExerciseResultSnapshot[]
}>(sessions: T[], currentId: string): ExerciseResultSnapshot[] | null {
  const ordered = [...sessions].sort((a, b) => {
    if (a.workoutDate !== b.workoutDate) return a.workoutDate < b.workoutDate ? 1 : -1
    const aUpdated = a.updatedAt ?? ''
    const bUpdated = b.updatedAt ?? ''
    if (aUpdated === bUpdated) return 0
    return aUpdated < bUpdated ? 1 : -1
  })
  const index = ordered.findIndex(session => session.id === currentId)
  if (index < 0) return null
  for (let cursor = index + 1; cursor < ordered.length; cursor += 1) {
    const snapshot = ordered[cursor].exerciseResultsSnapshot
    if (snapshot && snapshot.length > 0) return snapshot
  }
  return null
}

/** Personal records already accepted by the existing snapshot reader. */
export function legitimatePrHits(snapshot: unknown): PRHitSnapshot[] {
  if (!Array.isArray(snapshot)) return []
  const allowed = new Set(
    readPersonalRecordSnapshot(snapshot).map(record => `${record.exerciseKey}\0${record.prType}`),
  )
  const seen = new Set<string>()
  const hits: PRHitSnapshot[] = []
  for (const entry of snapshot) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as PRHitSnapshot
    if (typeof candidate.exerciseKey !== 'string' || typeof candidate.prType !== 'string') continue
    const key = `${candidate.exerciseKey}\0${candidate.prType}`
    if (!allowed.has(key) || seen.has(key)) continue
    seen.add(key)
    hits.push(candidate)
  }
  return hits
}

const STORED_PRIVATE_NOTE = 'Private details stay with this set and are not shown here.'

export function historyNoteForStorage(text: string | null | undefined): string | undefined {
  return workoutNoteSummaryLine(text) ?? undefined
}

export function displayHistoryNote(text: string | null | undefined): string | null {
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!trimmed) return null
  if (trimmed === STORED_PRIVATE_NOTE) return trimmed
  const summary = workoutNoteSummaryLine(trimmed)
  if (!summary || summary === STORED_PRIVATE_NOTE) return summary
  if (trimmed.includes('@') || /\b\d{3}-\d{2}-\d{4}\b/.test(trimmed)) return STORED_PRIVATE_NOTE
  return summary
}

export function historyNoteLines(notes: Array<string | null | undefined>): string[] {
  const lines: string[] = []
  for (const note of notes) {
    const line = displayHistoryNote(note)
    if (!line || lines.includes(line)) continue
    lines.push(line)
  }
  return lines
}

export interface LiveHistoryExerciseInput {
  id?: string
  name: string
  category?: string
  sets?: number
  repsOrTime?: string
  weight?: number
  note?: string
}

export interface LiveHistorySetInput {
  exerciseIndex: number
  setNumber: number
  actualReps: number
  actualRPE: number
  holdSeconds?: number
  actualLoad?: number
  note?: string
  targetRPE?: number
  restSeconds?: number
}

export interface LiveWorkoutHistoryInput {
  userId: string
  occurrenceId: string
  workoutName: string
  dayLabel?: string
  focusArea?: string
  durationMinutes: number
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  sessionNote?: string
  workoutDate: string
  exercises: LiveHistoryExerciseInput[]
  completedSets: LiveHistorySetInput[]
}

function prescriptionNumbers(repsOrTime: string | undefined): { isHold: boolean; numericLowerBound?: number } {
  const text = repsOrTime ?? ''
  const isHold = /s\s*$/i.test(text)
  const match = text.match(/(\d+(?:\.\d+)?)/)
  return {
    isHold,
    numericLowerBound: match ? Number.parseFloat(match[1]) : undefined,
  }
}

/**
 * Shape a successful live save for the existing history writer.
 * The user id and occurrence id are passed through unchanged.
 */
export function buildLiveWorkoutHistoryInput(input: LiveWorkoutHistoryInput): {
  userId: string
  workoutName: string
  dayLabel?: string
  focusArea?: string
  durationMinutes: number
  completedSets: CompletedSetData[]
  exercises: Array<{
    id: string
    name: string
    category: string
    sets: number
    targetReps?: number
    targetHold?: number
    weight?: number
    note?: string
  }>
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  notes?: string
  workoutDate: string
  clientSessionId: string
} {
  const exercises = input.exercises.map((exercise, index) => {
    const prescription = prescriptionNumbers(exercise.repsOrTime)
    const setNotes = input.completedSets
      .filter(set => set.exerciseIndex === index && set.note)
      .map(set => set.note)
    return {
      id: exercise.id || `ex-${index}`,
      name: exercise.name,
      category: exercise.category || 'bodyweight',
      sets: exercise.sets ?? 0,
      targetReps: prescription.isHold ? undefined : prescription.numericLowerBound,
      targetHold: prescription.isHold ? prescription.numericLowerBound : undefined,
      weight: exercise.weight,
      note: [exercise.note, ...setNotes].filter((note): note is string => Boolean(note)).join('\n') || undefined,
    }
  })
  const completedSets: CompletedSetData[] = input.completedSets.flatMap(set => {
    const exercise = exercises[set.exerciseIndex]
    if (!exercise) return []
    return [{
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseCategory: exercise.category,
      setNumber: set.setNumber,
      targetReps: exercise.targetReps ?? 0,
      actualReps: set.actualReps,
      targetRPE: set.targetRPE ?? set.actualRPE,
      actualRPE: set.actualRPE,
      restSeconds: set.restSeconds ?? 0,
      actualHoldSeconds: set.holdSeconds,
      actualLoad: set.actualLoad,
    }]
  })
  return {
    userId: input.userId,
    workoutName: input.workoutName,
    dayLabel: input.dayLabel,
    focusArea: input.focusArea,
    durationMinutes: input.durationMinutes,
    completedSets,
    exercises,
    perceivedDifficulty: input.perceivedDifficulty,
    notes: input.sessionNote,
    workoutDate: input.workoutDate,
    clientSessionId: input.occurrenceId,
  }
}
