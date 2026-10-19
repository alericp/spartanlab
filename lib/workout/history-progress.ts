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
  surface: 'archive' | 'workouts' | 'session' | 'prs' | 'programs' | 'program',
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
  if (kind === 'error' && surface === 'prs') {
    return {
      title: 'PR history could not be loaded',
      detail: 'This is a loading problem. It does not mean you have no personal records.',
    }
  }
  if (kind === 'error' && surface === 'programs') {
    return {
      title: 'Program history could not be loaded',
      detail: 'This is a loading problem. It does not mean you have no saved programs.',
    }
  }
  if (kind === 'error' && surface === 'program') {
    return {
      title: 'Program history could not be loaded',
      detail: 'This program could not be loaded. That does not mean it was removed.',
    }
  }
  if (kind === 'error') {
    return {
      title: 'History could not be loaded',
      detail: 'This workout could not be loaded. That does not mean it was removed.',
    }
  }
  if (kind === 'missing' && surface === 'program') {
    return {
      title: 'Program Not Found',
      detail: 'This program could not be found or may have been removed.',
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

/**
 * Manual and quick logs do not record whether a load was pounds or kilograms.
 * The history writer labels a max-weight record as kg. The dashboard estimated
 * 1RM chart labels device strength records as pounds. Leave the entered load
 * on the device log. Do not copy it and do not convert it.
 */
export const LOGGED_LOAD_HISTORY_DECISION = {
  writtenToHistory: false,
  reason:
    'Manual and quick logs store load as a number without a unit. History max-weight records are labeled kg, and device estimated 1RM charts are labeled pounds. The load stays on the device log.',
} as const

/** Estimated 1RM stays on the device strength log and its existing calculation. */
export const DEVICE_STRENGTH_PROGRESS = {
  source: 'device-strength-records',
  unitLabel: 'lbs',
  reason:
    'Estimated 1RM stays on strength logs saved on this device. It is not combined with history loads.',
} as const

export interface LoggedWorkoutHistoryExercise {
  id: string
  name: string
  category?: string
  sets?: number
  reps?: number
  holdSeconds?: number
  note?: string
}

export interface LoggedWorkoutHistoryInput {
  userId: string
  occurrenceId: string
  workoutName: string
  sessionDate: string
  durationMinutes: number
  focusArea?: string
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  notes?: string
  exercises?: LoggedWorkoutHistoryExercise[]
  keyPerformance?: {
    pullUps?: number
    dips?: number
    pushUps?: number
    skillHoldSeconds?: number
    skillName?: string
  }
}

function loggedPositive(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/**
 * Shape a manual or quick log for the existing history writer.
 * Reps and holds pass through. Load is omitted on purpose.
 */
export function buildLoggedWorkoutHistoryInput(input: LoggedWorkoutHistoryInput): {
  userId: string
  workoutName: string
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
    note?: string
  }>
  perceivedDifficulty?: 'easy' | 'normal' | 'hard'
  notes?: string
  workoutDate: string
  clientSessionId: string
} {
  const exercises: Array<{
    id: string
    name: string
    category: string
    sets: number
    targetReps?: number
    targetHold?: number
    note?: string
  }> = []
  const completedSets: CompletedSetData[] = []
  const pushExercise = (exercise: {
    id: string
    name: string
    category: string
    reps: number | null
    hold: number | null
    sets: number
    note?: string
  }) => {
    exercises.push({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      sets: exercise.sets,
      targetReps: exercise.reps ?? undefined,
      targetHold: exercise.hold ?? undefined,
      note: exercise.note,
    })
    for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
      completedSets.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseCategory: exercise.category,
        setNumber,
        targetReps: exercise.reps ?? 0,
        actualReps: exercise.reps ?? 0,
        targetRPE: 0,
        actualRPE: 0,
        restSeconds: 0,
        actualHoldSeconds: exercise.hold ?? undefined,
      })
    }
  }

  for (const exercise of input.exercises ?? []) {
    const name = exercise.name.trim()
    if (!name) continue
    const reps = loggedPositive(exercise.reps)
    const hold = loggedPositive(exercise.holdSeconds)
    const setCount = loggedPositive(exercise.sets) ?? (reps || hold ? 1 : 0)
    if (!setCount) continue
    pushExercise({
      id: exercise.id,
      name,
      category: exercise.category || 'bodyweight',
      reps,
      hold,
      sets: setCount,
      note: exercise.note,
    })
  }

  const knownNames = new Set(exercises.map(exercise => exercise.name.toLowerCase()))
  const extras: Array<{ id: string; name: string; reps?: number; hold?: number }> = []
  const performance = input.keyPerformance
  if (performance?.pullUps) extras.push({ id: 'quick-pull-up', name: 'Pull-Up', reps: performance.pullUps })
  if (performance?.dips) extras.push({ id: 'quick-dip', name: 'Dip', reps: performance.dips })
  if (performance?.pushUps) extras.push({ id: 'quick-push-up', name: 'Push-Up', reps: performance.pushUps })
  if (performance?.skillHoldSeconds) {
    extras.push({
      id: 'quick-skill-hold',
      name: performance.skillName?.trim() || 'Skill Hold',
      hold: performance.skillHoldSeconds,
    })
  }
  for (const extra of extras) {
    if (knownNames.has(extra.name.toLowerCase())) continue
    const reps = loggedPositive(extra.reps)
    const hold = loggedPositive(extra.hold)
    if (!reps && !hold) continue
    pushExercise({
      id: extra.id,
      name: extra.name,
      category: hold ? 'skill' : 'bodyweight',
      reps,
      hold,
      sets: 1,
    })
  }

  return {
    userId: input.userId,
    workoutName: input.workoutName,
    focusArea: input.focusArea,
    durationMinutes: input.durationMinutes,
    completedSets,
    exercises,
    perceivedDifficulty: input.perceivedDifficulty,
    notes: input.notes,
    workoutDate: input.sessionDate,
    clientSessionId: input.occurrenceId,
  }
}

/** Lines for reps, holds, and loads already stored on a history snapshot. */
export function historyPerformanceLines(
  exercises: ExerciseResultSnapshot[] | null | undefined,
): string[] {
  if (!exercises) return []
  const lines: string[] = []
  for (const exercise of exercises) {
    const name = exercise.exerciseName?.trim()
    if (!name) continue
    const reps = bestPositive(exercise.actual?.repsPerSet)
    const hold = bestPositive(exercise.actual?.holdPerSet)
    const load = positiveNumber(exercise.actual?.weightUsed)
    if (reps !== null) lines.push(`${name} ${reps} reps`)
    if (hold !== null) lines.push(`${name} ${hold}s hold`)
    if (load !== null) lines.push(`${name} load ${load}`)
  }
  return lines
}

export interface HistoryTrainingSessionView {
  id: string
  name: string
  date: string
  lines: string[]
}

export interface DeviceTrainingSummary {
  totalWorkouts: number
  workoutsThisWeek: number
  lastWorkoutName: string | null
  lastWorkoutDate: string | null
}

export type RecentTrainingModel =
  | {
      mode: 'history'
      href: '/history/workouts'
      workoutsThisWeek: number
      sessions: HistoryTrainingSessionView[]
    }
  | ({ mode: 'device'; href: '/workouts' } & DeviceTrainingSummary)
  | {
      mode: 'error'
      title: string
      detail: string
      device: ({ href: '/workouts' } & DeviceTrainingSummary) | null
    }
  | { mode: 'empty'; href: '/workouts' }

function startOfMonday(now: Date): Date {
  const day = now.getDay()
  const daysToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Recent training follows saved history when that read succeeds.
 * A failed read stays an error. Device logs stay a separate list.
 */
export function recentTrainingModel(input: {
  historyStatus: 'ready' | 'error' | 'signed_out'
  sessions?: Array<{
    id: string
    workoutName: string
    workoutDate: string
    exerciseResultsSnapshot?: ExerciseResultSnapshot[]
  }>
  device?: DeviceTrainingSummary | null
  now?: Date
}): RecentTrainingModel {
  const device = input.device && input.device.totalWorkouts > 0
    ? { href: '/workouts' as const, ...input.device }
    : null
  if (input.historyStatus === 'error') {
    const copy = historyLoadCopy('error', 'workouts')
    return { mode: 'error', title: copy.title, detail: copy.detail, device }
  }
  if (input.historyStatus === 'signed_out') {
    if (!device) return { mode: 'empty', href: '/workouts' }
    return { mode: 'device', ...device }
  }
  const now = input.now ?? new Date()
  const weekStart = startOfMonday(now)
  const source = input.sessions ?? []
  const sessions = source.map(session => ({
    id: session.id,
    name: session.workoutName,
    date: session.workoutDate,
    lines: historyPerformanceLines(session.exerciseResultsSnapshot).slice(0, 4),
  }))
  if (sessions.length > 0) {
    const workoutsThisWeek = source.filter(session => {
      const date = new Date(session.workoutDate)
      return date >= weekStart && date <= now
    }).length
    return {
      mode: 'history',
      href: '/history/workouts',
      workoutsThisWeek,
      sessions: sessions.slice(0, 3),
    }
  }
  if (device) return { mode: 'device', ...device }
  return { mode: 'empty', href: '/workouts' }
}
