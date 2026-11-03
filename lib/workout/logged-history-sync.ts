/**
 * Send a manual or quick log through the existing history writer.
 * The device workout log remains the local record. This does not open
 * another history table.
 */

import { persistWorkoutSession } from '../workout-history-persistence'
import {
  buildLoggedWorkoutHistoryInput,
  classifyHistoryPersistence,
  type HistorySyncState,
  type LoggedWorkoutHistoryExercise,
  type LoggedWorkoutHistoryInput,
} from './history-progress'

export async function syncLoggedWorkoutHistory(input: {
  userId: string | null | undefined
  occurrenceId: string
  workoutName: string
  sessionDate: string
  durationMinutes: number
  focusArea?: string
  perceivedDifficulty?: LoggedWorkoutHistoryInput['perceivedDifficulty']
  notes?: string
  exercises?: LoggedWorkoutHistoryExercise[]
  keyPerformance?: LoggedWorkoutHistoryInput['keyPerformance']
}): Promise<HistorySyncState> {
  if (!input.userId) return 'skipped'
  const result = await persistWorkoutSession(buildLoggedWorkoutHistoryInput({
    userId: input.userId,
    occurrenceId: input.occurrenceId,
    workoutName: input.workoutName,
    sessionDate: input.sessionDate,
    durationMinutes: input.durationMinutes,
    focusArea: input.focusArea,
    perceivedDifficulty: input.perceivedDifficulty,
    notes: input.notes,
    exercises: input.exercises,
    keyPerformance: input.keyPerformance,
  }))
  return classifyHistoryPersistence(result)
}
