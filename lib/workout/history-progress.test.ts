import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { decideRecordAccess, decideRequestedAthleteAccess } from '../server/athlete-ownership.ts'
import { describeWorkoutSaveResult, planLocalWorkoutSave } from './save-reliability.ts'
import {
  buildLiveWorkoutHistoryInput,
  buildLoggedWorkoutHistoryInput,
  measuredSessionRpe,
  selectOwnedHistoryRetry,
  classifyHistoryHttp,
  classifyHistoryPersistence,
  compareExerciseSnapshots,
  DEVICE_STRENGTH_PROGRESS,
  displayHistoryNote,
  formatExerciseComparison,
  historyLoadCopy,
  historyNoteForStorage,
  historyNoteLines,
  historyPerformanceLines,
  legitimatePrHits,
  LOGGED_LOAD_HISTORY_DECISION,
  planHistorySyncRetry,
  previousExerciseSnapshots,
  recentTrainingModel,
  shouldRetainOccurrenceForHistoryRetry,
} from './history-progress.ts'
import type { ExerciseResultSnapshot, PRHitSnapshot } from '../../types/history.ts'

const OWNER = 'user_owner_synthetic'
const OTHER = 'user_other_synthetic'

function exercise(partial: Partial<ExerciseResultSnapshot> & Pick<ExerciseResultSnapshot, 'exerciseId' | 'exerciseName'>): ExerciseResultSnapshot {
  return {
    category: 'bodyweight',
    prescribed: {},
    actual: { setsCompleted: 1 },
    wasCompleted: true,
    wasSkipped: false,
    ...partial,
  }
}

describe('live save and history sync status', () => {
  it('says the workout and History were both updated', () => {
    const status = describeWorkoutSaveResult({
      outcome: 'saved',
      saveDisposition: 'inserted',
      serverEvidence: 'saved',
      historySync: 'updated',
    })
    assert.equal(status.state, 'saved')
    assert.equal(status.historySync, 'updated')
    assert.match(status.detail, /saved locally and History updated/)
    assert.equal(classifyHistoryPersistence({ persisted: 'saved', success: true }), 'updated')
    assert.equal(classifyHistoryPersistence({ persisted: 'duplicate', success: true }), 'updated')
  })

  it('keeps a local save when history sync fails', () => {
    const status = describeWorkoutSaveResult({
      outcome: 'saved',
      saveDisposition: 'inserted',
      serverEvidence: 'saved',
      historySync: 'failed',
    })
    assert.equal(status.state, 'saved')
    assert.equal(status.title, 'Saved')
    assert.match(status.detail, /saved locally/)
    assert.match(status.detail, /History sync failed/)
    assert.match(status.detail, /still on this device/)
    assert.doesNotMatch(status.detail, /was not saved/)
    assert.equal(classifyHistoryPersistence({ persisted: 'failed', success: false }), 'failed')
    assert.equal(shouldRetainOccurrenceForHistoryRetry({
      serverEvidence: 'saved',
      historySync: 'failed',
    }), true)
  })

  it('does not call a failed workout a history update', () => {
    const status = describeWorkoutSaveResult({
      outcome: 'failed',
      saveDisposition: 'inserted',
      serverEvidence: 'saved',
      historySync: 'updated',
    })
    assert.equal(status.state, 'failed')
    assert.equal(status.title, 'Save error')
    assert.match(status.detail, /was not saved/)
    assert.equal(status.historySync, undefined)
    assert.doesNotMatch(status.detail, /History updated/)
  })

  it('does not claim History was updated when the athlete is signed out', () => {
    const status = describeWorkoutSaveResult({
      outcome: 'saved',
      saveDisposition: 'inserted',
      serverEvidence: 'skipped',
      historySync: 'skipped',
    })
    assert.match(status.detail, /History was not updated/)
    assert.doesNotMatch(status.detail, /History updated/)
    assert.equal(classifyHistoryPersistence(null), 'skipped')
  })

  it('builds the history payload from the occurrence id and Clerk user id', () => {
    const payload = buildLiveWorkoutHistoryInput({
      userId: OWNER,
      occurrenceId: 'occ-live-1',
      workoutName: 'Pull Day',
      dayLabel: 'Pull Day',
      durationMinutes: 20,
      workoutDate: '2026-10-19',
      sessionNote: 'grip limited the last set',
      exercises: [{
        id: 'pull_up',
        name: 'Pull-up',
        category: 'pull',
        sets: 3,
        repsOrTime: '6-8',
        weight: 10,
      }],
      completedSets: [{
        exerciseIndex: 0,
        setNumber: 1,
        actualReps: 8,
        actualRPE: 7,
        holdSeconds: 12,
        actualLoad: 10,
        note: 'athlete@example.com felt the grip',
      }],
    })
    assert.equal(payload.userId, OWNER)
    assert.equal(payload.clientSessionId, 'occ-live-1')
    assert.equal(payload.exercises[0].targetReps, 6)
    assert.equal(payload.exercises[0].targetHold, undefined)
    assert.equal(payload.completedSets[0].exerciseId, 'pull_up')
    assert.equal(payload.completedSets[0].actualReps, 8)
    assert.equal(payload.completedSets[0].actualHoldSeconds, 12)
    assert.equal(payload.completedSets[0].actualLoad, 10)
    assert.match(payload.exercises[0].note ?? '', /athlete@example.com/)
    assert.equal(historyNoteForStorage(payload.exercises[0].note), 'Private details stay with this set and are not shown here.')
    assert.doesNotMatch(historyNoteForStorage(payload.sessionNote ? 'grip limited the last set' : '') ?? '', /@/)
  })
})

describe('history retry does not duplicate the workout or personal records', () => {
  const intended = [{
    exerciseKey: 'pull_up',
    prType: 'best_reps',
    exerciseName: 'Pull-up',
    newValue: 8,
    unit: 'reps',
  }]

  it('recovers an absent history row without another local insert or a second achievement pass', () => {
    const failed = planHistorySyncRetry({
      localAlreadyStored: false,
      serverEvidence: 'saved',
      databaseAvailable: false,
      lookup: 'unknown',
      intendedRecords: intended,
      storedRecords: [],
    })
    assert.equal(failed.localAction, 'insert')
    assert.equal(failed.historyAction, 'retry')
    assert.equal(failed.personalRecordsToWrite.length, 0)
    assert.equal(failed.discardsLocalWorkout, false)

    const recovered = planHistorySyncRetry({
      localAlreadyStored: true,
      serverEvidence: 'saved',
      databaseAvailable: true,
      lookup: 'absent',
      intendedRecords: intended,
      storedRecords: [],
    })
    assert.equal(recovered.localAction, 'keep')
    assert.equal(recovered.historyAction, 'insert')
    assert.equal(recovered.personalRecordsToWrite.length, 1)
    assert.equal(recovered.rerunsInsertedEffects, false)
    assert.equal(recovered.discardsLocalWorkout, false)
    assert.equal(shouldRetainOccurrenceForHistoryRetry({ historySync: 'updated', serverEvidence: 'saved' }), false)
  })

  it('does not write a second session row or a personal record that is already stored', () => {
    const duplicate = planHistorySyncRetry({
      localAlreadyStored: true,
      serverEvidence: 'pending',
      databaseAvailable: true,
      lookup: 'found',
      intendedRecords: [intended[0], intended[0]],
      storedRecords: [{ exerciseKey: 'pull_up', prType: 'best_reps' }],
    })
    assert.equal(duplicate.localAction, 'retry-server')
    assert.equal(duplicate.historyAction, 'already_saved')
    assert.equal(duplicate.personalRecordsToWrite.length, 0)
    assert.equal(duplicate.rerunsInsertedEffects, false)
  })

  it('writes only the personal record that the first attempt missed', () => {
    const retry = planHistorySyncRetry({
      localAlreadyStored: true,
      serverEvidence: 'saved',
      databaseAvailable: true,
      lookup: 'found',
      intendedRecords: intended,
      storedRecords: [],
    })
    assert.equal(retry.historyAction, 'already_saved')
    assert.equal(retry.personalRecordsToWrite.length, 1)
    assert.equal(retry.personalRecordsToWrite[0].exerciseKey, 'pull_up')
  })
})

describe('history loading errors stay distinct from an empty archive', () => {
  it('classifies transport failures separately from a real empty list and a missing session', () => {
    assert.equal(classifyHistoryHttp(200), 'ready')
    assert.equal(classifyHistoryHttp(500), 'error')
    assert.equal(classifyHistoryHttp(401), 'error')
    assert.equal(classifyHistoryHttp(404), 'missing')
    assert.equal(classifyHistoryHttp(200, true), 'error')
    const errorCopy = historyLoadCopy('error', 'workouts')
    const emptyCopy = historyLoadCopy('empty', 'workouts')
    assert.match(errorCopy.title, /could not be loaded/)
    assert.match(errorCopy.detail, /does not mean you have no workout history/)
    assert.equal(emptyCopy.title, 'No Workout History')
    assert.notEqual(errorCopy.title, emptyCopy.title)
    assert.match(historyLoadCopy('error', 'archive').detail, /does not mean you have no saved workouts/)
    assert.match(historyLoadCopy('error', 'session').detail, /does not mean it was removed/)
    assert.equal(historyLoadCopy('missing', 'session').title, 'Session Not Found')
  })
})

describe('performance comparisons and legitimate personal records', () => {
  it('compares only metrics that exist on both snapshots', () => {
    const previous = [
      exercise({
        exerciseId: 'pull_up',
        exerciseName: 'Pull-up',
        actual: { setsCompleted: 3, repsPerSet: [5, 6], weightUsed: 8 },
      }),
      exercise({
        exerciseId: 'tuck_hold',
        exerciseName: 'Tuck hold',
        actual: { setsCompleted: 1, holdPerSet: [15] },
      }),
    ]
    const latest = [
      exercise({
        exerciseId: 'pull_up',
        exerciseName: 'Pull-up',
        actual: { setsCompleted: 3, repsPerSet: [8, 7], weightUsed: 8 },
      }),
      exercise({
        exerciseId: 'tuck_hold',
        exerciseName: 'Tuck hold',
        actual: { setsCompleted: 1, repsPerSet: [1] },
      }),
      exercise({
        exerciseId: 'dip',
        exerciseName: 'Dip',
        actual: { setsCompleted: 2, repsPerSet: [10] },
      }),
    ]
    const comparisons = compareExerciseSnapshots(previous, latest)
    assert.deepEqual(comparisons.map(item => item.metric), ['reps', 'load'])
    assert.equal(comparisons[0].direction, 'higher')
    assert.equal(comparisons[0].previous, 6)
    assert.equal(comparisons[0].latest, 8)
    assert.equal(comparisons[1].direction, 'same')
    assert.equal(formatExerciseComparison(comparisons[0]), 'Pull-up reps 8, up from 6.')
    const earlier = previousExerciseSnapshots([
      { id: 'new', workoutDate: '2026-10-19', exerciseResultsSnapshot: latest },
      { id: 'old', workoutDate: '2026-10-12', exerciseResultsSnapshot: previous },
      { id: 'empty', workoutDate: '2026-10-18', exerciseResultsSnapshot: [] },
    ], 'new')
    assert.equal(earlier?.[0].exerciseId, 'pull_up')
    assert.equal(previousExerciseSnapshots([
      { id: 'only', workoutDate: '2026-10-19', exerciseResultsSnapshot: latest },
    ], 'only'), null)
  })

  it('shows a stored personal record and drops an incomplete one', () => {
    const snapshot: Array<PRHitSnapshot | { exerciseKey: string; prType: string }> = [
      {
        exerciseKey: 'pull_up',
        exerciseName: 'Pull-up',
        prType: 'best_reps',
        newValue: 8,
        previousValue: 6,
        unit: 'reps',
      },
      { exerciseKey: 'dip', prType: 'max_weight' },
      {
        exerciseKey: 'pull_up',
        exerciseName: 'Pull-up',
        prType: 'best_reps',
        newValue: 8,
        unit: 'reps',
      },
    ]
    const hits = legitimatePrHits(snapshot)
    assert.equal(hits.length, 1)
    assert.equal(hits[0].exerciseKey, 'pull_up')
    assert.equal(hits[0].newValue, 8)
    assert.equal(legitimatePrHits([{ isPR: true, exerciseName: 'Dip' }]).length, 0)
  })
})

describe('private workout notes stay out of history summaries', () => {
  it('replaces private text and keeps a safe training statement', () => {
    const privateLine = displayHistoryNote('email me at athlete@example.com about my diagnosis')
    assert.equal(privateLine, 'Private details stay with this set and are not shown here.')
    assert.doesNotMatch(privateLine ?? '', /athlete@example.com|diagnosis/)
    const stored = historyNoteForStorage('grip limited the set')
    assert.equal(stored, 'You wrote that grip limited the set.')
    assert.equal(displayHistoryNote(stored), stored)
    const lines = historyNoteLines([
      'athlete@example.com',
      'grip limited the set',
      'grip limited the set',
    ])
    assert.deepEqual(lines, [
      'Private details stay with this set and are not shown here.',
      'You wrote that grip limited the set.',
    ])
  })
})

describe('history reads report a failure instead of an empty archive', () => {
  it('throws when the archive asks for errors and stays empty for other callers', async () => {
    const { isDatabaseAvailable } = await import('../db.ts')
    if (await isDatabaseAvailable()) return
    const {
      HistoryReadError,
      getWorkoutHistoryForUser,
      getWorkoutSessionHistoryById,
      getPersonalRecordHistoryForUser,
      getPersonalRecordsByExercise,
      getProgramHistoryForUser,
      getProgramHistoryById,
    } = await import('../history-service.ts')
    await assert.rejects(
      () => getWorkoutHistoryForUser(OWNER, { reportErrors: true }),
      HistoryReadError,
    )
    assert.deepEqual(await getWorkoutHistoryForUser(OWNER), [])
    await assert.rejects(
      () => getWorkoutSessionHistoryById('session-missing', { reportErrors: true }),
      HistoryReadError,
    )
    assert.equal(await getWorkoutSessionHistoryById('session-missing'), null)
    await assert.rejects(
      () => getPersonalRecordHistoryForUser(OWNER, { reportErrors: true }),
      HistoryReadError,
    )
    assert.deepEqual(await getPersonalRecordHistoryForUser(OWNER), [])
    await assert.rejects(
      () => getPersonalRecordsByExercise(OWNER, 'pull-up', { reportErrors: true }),
      HistoryReadError,
    )
    assert.deepEqual(await getPersonalRecordsByExercise(OWNER, 'pull-up'), [])
    await assert.rejects(
      () => getProgramHistoryForUser(OWNER, { reportErrors: true }),
      HistoryReadError,
    )
    assert.deepEqual(await getProgramHistoryForUser(OWNER), [])
    await assert.rejects(
      () => getProgramHistoryById('program-missing', { reportErrors: true }),
      HistoryReadError,
    )
    assert.equal(await getProgramHistoryById('program-missing'), null)
  })
})

describe('manual and quick logs use the existing history writer', () => {
  it('keeps the occurrence id and writes reps and holds without converting load', () => {
    assert.equal(LOGGED_LOAD_HISTORY_DECISION.writtenToHistory, false)
    const first = buildLoggedWorkoutHistoryInput({
      userId: OWNER,
      occurrenceId: 'occ-manual-1',
      workoutName: 'Push Day',
      sessionDate: '2026-10-18',
      durationMinutes: 40,
      perceivedDifficulty: 'normal',
      exercises: [{
        id: 'dip',
        name: 'Dip',
        category: 'push',
        sets: 3,
        reps: 8,
        holdSeconds: 12,
      }],
      keyPerformance: { pullUps: 10, skillHoldSeconds: 20, skillName: 'Tuck Planche' },
    })
    const retry = buildLoggedWorkoutHistoryInput({
      userId: OWNER,
      occurrenceId: 'occ-manual-1',
      workoutName: 'Push Day',
      sessionDate: '2026-10-18',
      durationMinutes: 40,
      exercises: [{
        id: 'dip',
        name: 'Dip',
        category: 'push',
        sets: 3,
        reps: 8,
        holdSeconds: 12,
      }],
      keyPerformance: { pullUps: 10, skillHoldSeconds: 20, skillName: 'Tuck Planche' },
    })
    assert.equal(first.clientSessionId, 'occ-manual-1')
    assert.equal(retry.clientSessionId, first.clientSessionId)
    assert.equal(first.userId, OWNER)
    assert.equal(first.exercises.find(item => item.id === 'dip')?.targetReps, 8)
    assert.equal(first.exercises.find(item => item.id === 'dip')?.targetHold, 12)
    assert.equal(first.completedSets.filter(set => set.exerciseId === 'dip').length, 3)
    assert.equal(first.completedSets[0].actualHoldSeconds, 12)
    assert.equal(first.completedSets.every(set => set.actualRPE === undefined && set.targetRPE === undefined), true)
    assert.equal(measuredSessionRpe([undefined, 0, 8, 6]), 7)
    assert.equal(measuredSessionRpe([0, undefined]), null)
    assert.equal(first.exercises.some(item => 'weight' in item), false)
    assert.equal(first.completedSets.some(set => set.actualLoad !== undefined), false)
    assert.equal(first.exercises.find(item => item.id === 'quick-pull-up')?.targetReps, 10)
    assert.equal(first.exercises.find(item => item.id === 'quick-skill-hold')?.targetHold, 20)
    assert.deepEqual(
      first.exercises.map(item => item.id),
      retry.exercises.map(item => item.id),
    )
  })

  it('shows stored history reps, holds, and loads without relabeling the unit', () => {
    const lines = historyPerformanceLines([
      exercise({
        exerciseId: 'pull-up',
        exerciseName: 'Pull-Up',
        actual: { setsCompleted: 3, repsPerSet: [6, 8], holdPerSet: [15] },
      }),
      exercise({
        exerciseId: 'old-dip',
        exerciseName: 'Dip',
        actual: { setsCompleted: 2, repsPerSet: [5] },
      }),
      exercise({
        exerciseId: 'weighted',
        exerciseName: 'Weighted Pull-Up',
        actual: { setsCompleted: 1, repsPerSet: [3], weightUsed: 20 },
      }),
    ])
    assert.deepEqual(lines, [
      'Pull-Up 8 reps',
      'Pull-Up 15s hold',
      'Dip 5 reps',
      'Weighted Pull-Up 3 reps',
      'Weighted Pull-Up load 20',
    ])
    assert.equal(lines.some(line => /lbs|kg/i.test(line)), false)
    assert.equal(DEVICE_STRENGTH_PROGRESS.unitLabel, 'lbs')
    assert.match(DEVICE_STRENGTH_PROGRESS.reason, /not combined with history loads/i)
  })

  it('keeps a history load error distinct from an empty archive and from device logs', () => {
    const now = new Date('2026-10-19T12:00:00')
    const history = recentTrainingModel({
      historyStatus: 'ready',
      now,
      sessions: [{
        id: 'session-1',
        workoutName: 'Skill Day',
        workoutDate: '2026-10-19',
        exerciseResultsSnapshot: [
          exercise({
            exerciseId: 'hold',
            exerciseName: 'Front Lever',
            actual: { setsCompleted: 1, holdPerSet: [18], weightUsed: 0 },
          }),
        ],
      }],
      device: {
        totalWorkouts: 2,
        workoutsThisWeek: 2,
        lastWorkoutName: 'Device only',
        lastWorkoutDate: '2026-10-18',
      },
    })
    assert.equal(history.mode, 'history')
    if (history.mode === 'history') {
      assert.equal(history.href, '/history/workouts')
      assert.equal(history.sessions[0].lines[0], 'Front Lever 18s hold')
      assert.equal(history.sessions[0].lines.some(line => line.includes('load')), false)
    }
    const failed = recentTrainingModel({
      historyStatus: 'error',
      sessions: [],
      device: {
        totalWorkouts: 1,
        workoutsThisWeek: 1,
        lastWorkoutName: 'Local session',
        lastWorkoutDate: '2026-10-18',
      },
    })
    assert.equal(failed.mode, 'error')
    if (failed.mode === 'error') {
      assert.match(failed.title, /could not be loaded/i)
      assert.match(failed.detail, /loading problem/i)
      assert.equal(failed.device?.href, '/workouts')
    }
    const empty = recentTrainingModel({ historyStatus: 'ready', sessions: [] })
    assert.equal(empty.mode, 'empty')
    if (empty.mode === 'empty') assert.equal(empty.href, '/workouts')
    assert.equal(historyLoadCopy('error', 'prs').title, 'PR history could not be loaded')
    assert.match(historyLoadCopy('error', 'prs').detail, /does not mean you have no personal records/)
    assert.equal(historyLoadCopy('error', 'programs').title, 'Program history could not be loaded')
    assert.equal(historyLoadCopy('missing', 'program').title, 'Program Not Found')
    assert.match(historyLoadCopy('error', 'program').detail, /does not mean it was removed/)
  })
})

describe('logged history retry stays with the athlete who saved it', () => {
  it('restores the same occurrence for that athlete and hides it from everyone else', () => {
    const pending = {
      id: 'workout-occ-1',
      occurrenceId: 'occ-1',
      ownerUserId: OWNER,
      historySync: 'pending' as const,
      createdAt: '2026-10-19T01:00:00.000Z',
      isQuickLog: false,
      sessionName: 'Push Day',
    }
    const older = { ...pending, id: 'workout-occ-0', occurrenceId: 'occ-0', createdAt: '2026-10-18T01:00:00.000Z' }
    const quick = { ...pending, id: 'workout-quick', occurrenceId: 'occ-quick', isQuickLog: true, sessionName: 'Skill Day', generatedWorkoutId: 'gen-1' }
    const finished = { ...pending, id: 'workout-done', occurrenceId: 'occ-done', historySync: 'updated' as const }
    const logs = [older, pending, quick, finished]
    assert.equal(selectOwnedHistoryRetry(logs, OWNER, 'manual')?.occurrenceId, 'occ-1')
    assert.equal(selectOwnedHistoryRetry(logs, OTHER, 'manual'), null)
    assert.equal(selectOwnedHistoryRetry(logs, null, 'manual'), null)
    assert.equal(selectOwnedHistoryRetry([{ ...pending, ownerUserId: undefined }], OWNER, 'manual'), null)
    assert.equal(selectOwnedHistoryRetry(logs, OWNER, 'quick', { sessionName: 'Skill Day', generatedWorkoutId: 'gen-1' })?.occurrenceId, 'occ-quick')
    assert.equal(selectOwnedHistoryRetry(logs, OWNER, 'quick', { sessionName: 'Other Day' }), null)
    const retry = planLocalWorkoutSave(
      [{ id: 'workout-occ-1', occurrenceId: 'occ-1', serverEvidence: 'saved' as const }],
      { id: 'workout-occ-1', occurrenceId: 'occ-1' },
    )
    assert.equal(retry.action, 'keep')
    assert.equal(retry.log.occurrenceId, 'occ-1')
  })
})

describe('signed-in history ownership', () => {
  it('allows the signed-in athlete and refuses another athlete or a missing session owner', () => {
    assert.equal(decideRequestedAthleteAccess(OWNER, OWNER).allowed, true)
    const other = decideRequestedAthleteAccess(OWNER, OTHER)
    assert.equal(other.allowed, false)
    if (!other.allowed) assert.equal(other.status, 403)
    const foreignRecord = decideRecordAccess(OWNER, OTHER, 'Session not found')
    assert.equal(foreignRecord.allowed, false)
    if (!foreignRecord.allowed) assert.equal(foreignRecord.status, 404)
    assert.equal(decideRecordAccess(OWNER, OWNER, 'Session not found').allowed, true)
    assert.equal(decideRecordAccess(null, OWNER, 'Session not found').allowed, false)
  })
})

describe('history progress wiring', () => {
  it('connects the live save to the existing history writer and keeps retries idempotent', () => {
    const live = readFileSync('components/workout/StreamlinedWorkoutSession.tsx', 'utf8')
    assert.match(live, /persistWorkoutSession\(historyInput\)/)
    assert.match(live, /occurrenceId: occurrence\.occurrence\.occurrenceId/)
    assert.match(live, /userId,\s*\n\s*occurrenceId:/)
    assert.match(live, /historyPending: Boolean\(userId\)/)
    assert.match(live, /occurrenceAfterHistoryResult/)
    assert.match(readFileSync('lib/workout-log-service.ts', 'utf8'), /occurrenceAfterEvidenceSave/)
    assert.match(live, /saveDisposition: 'kept'/)
    const retry = live.match(/const retryHistorySync = useCallback\(async \(\) => \{[\s\S]*?\n  \}, \[\]\)/)
    assert.ok(retry)
    assert.doesNotMatch(retry[0], /quickLogWorkout|evaluateAchievements/)
    const persistence = readFileSync('lib/workout-history-persistence.ts', 'utf8')
    assert.match(persistence, /historyNoteForStorage/)
    assert.match(persistence, /clientSessionId/)
    assert.match(persistence, /missingSessionPersonalRecords/)
    const historyPage = readFileSync('app/(app)/history/page.tsx', 'utf8')
    const workoutsPage = readFileSync('app/(app)/history/workouts/page.tsx', 'utf8')
    const sessionPage = readFileSync('app/(app)/history/session/[id]/page.tsx', 'utf8')
    assert.match(historyPage, /historyLoadCopy\('error', 'archive'\)/)
    assert.doesNotMatch(historyPage, /return \{\s*workoutHistory: \[\]/)
    assert.match(workoutsPage, /historyLoadCopy\('error', 'workouts'\)/)
    assert.match(workoutsPage, /flex-wrap/)
    assert.doesNotMatch(workoutsPage, /w-fit/)
    assert.match(sessionPage, /historyLoadCopy\(loadKind === 'error' \? 'error' : 'missing', 'session'\)/)
    assert.match(sessionPage, /previousExerciseSnapshots/)
    assert.match(readFileSync('app/api/history/route.ts', 'utf8'), /reportErrors: true/)
    assert.match(readFileSync('app/api/history/workouts/route.ts', 'utf8'), /reportErrors: true/)
    assert.match(readFileSync('app/api/history/sessions/[id]/route.ts', 'utf8'), /reportErrors: true/)
    assert.match(readFileSync('app/api/history/prs/route.ts', 'utf8'), /reportErrors: true/)
    assert.match(readFileSync('app/api/history/programs/route.ts', 'utf8'), /reportErrors: true/)
    assert.match(readFileSync('app/api/history/program/[id]/route.ts', 'utf8'), /reportErrors: true/)
    assert.match(readFileSync('app/(app)/history/prs/page.tsx', 'utf8'), /historyLoadCopy\('error', 'prs'\)/)
    assert.match(readFileSync('app/(app)/history/programs/page.tsx', 'utf8'), /historyLoadCopy\('error', 'programs'\)/)
    assert.match(readFileSync('app/(app)/history/program/[id]/page.tsx', 'utf8'), /historyLoadCopy\(loadKind === 'error' \? 'error' : 'missing', 'program'\)/)
    const hook = readFileSync('hooks/useWorkoutSession.ts', 'utf8')
    const localSave = hook.indexOf('saveWorkoutLog(')
    const historySave = hook.indexOf('persistWorkoutSession(')
    assert.ok(localSave > 0 && historySave > localSave)
    assert.match(hook, /clientSessionId: occurrenceId/)
    assert.match(hook, /describeWorkoutSaveResult/)
    assert.doesNotMatch(hook, /persisted === 'failed'\) return false/)
    const manual = readFileSync('components/workouts/WorkoutLogForm.tsx', 'utf8')
    const quick = readFileSync('components/workouts/QuickLogModal.tsx', 'utf8')
    assert.match(manual, /readLoggedHistoryRetry/)
    assert.match(manual, /markLoggedHistorySync/)
    assert.match(manual, /syncLoggedWorkoutHistory/)
    assert.match(manual, /useAuth\(\)/)
    assert.match(manual, /holdSeconds: exercise\.holdSeconds/)
    assert.doesNotMatch(manual, /load: exercise\.load/)
    assert.match(quick, /readLoggedHistoryRetry/)
    assert.match(quick, /markLoggedHistorySync/)
    assert.match(quick, /syncLoggedWorkoutHistory/)
    assert.match(quick, /useAuth\(\)/)
    assert.match(quick, /keyPerformance: recordedPerformance/)
    assert.match(readFileSync('components/workout/WorkoutSessionSummary.tsx', 'utf8'), /Retry History Sync/)
    assert.match(readFileSync('components/dashboard/RecentTrainingCard.tsx', 'utf8'), /model\.href/)
    assert.match(readFileSync('components/dashboard/ProgressDashboard.tsx', 'utf8'), /DEVICE_STRENGTH_PROGRESS/)
    assert.match(readFileSync('components/dashboard/ProgressDashboard.tsx', 'utf8'), /recentTrainingModel/)
    const sync = readFileSync('lib/workout/logged-history-sync.ts', 'utf8')
    assert.match(readFileSync('lib/workout-history-persistence.ts', 'utf8'), /measuredSessionRpe/)
    assert.match(sync, /persistWorkoutSession\(buildLoggedWorkoutHistoryInput/)
    assert.match(sync, /if \(!input\.userId\) return 'skipped'/)
    assert.doesNotMatch(sync, /2\.204|lbs/)
    const detail = readFileSync('components/history/SessionDetail.tsx', 'utf8')
    assert.match(detail, /session\.summaryMessage/)
    assert.match(detail, /legitimatePrHits/)
    assert.match(detail, /displayHistoryNote/)
    assert.doesNotMatch(detail, /\{exercise\.notes\}/)
    for (const route of [
      'app/api/history/route.ts',
      'app/api/history/workouts/route.ts',
      'app/api/history/sessions/[id]/route.ts',
      'app/api/history/prs/route.ts',
      'app/api/history/programs/route.ts',
      'app/api/history/program/[id]/route.ts',
    ]) {
      const source = readFileSync(route, 'utf8')
      assert.match(source, /readOwnedAthleteResource|readOwnedRecord/)
    }
  })
})
