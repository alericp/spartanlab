import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  createOccurrenceId,
  describeWorkoutSaveResult,
  historyWritePlan,
  missingSessionPersonalRecords,
  occurrenceAfterEvidenceSave,
  occurrenceAfterHistoryResult,
  personalRecordPersistencePlan,
  planLocalWorkoutSave,
  readPersonalRecordSnapshot,
  resolveOccurrenceId,
  shouldKeepOccurrenceAfterLocalSave,
  workoutLogIdForOccurrence,
} from './save-reliability.ts'

const completed = {
  id: workoutLogIdForOccurrence('occ-1'),
  occurrenceId: 'occ-1',
  sessionDate: '2026-10-18',
  completionStatus: 'completed' as const,
  serverEvidence: 'saved' as const,
  exercises: [{ name: 'Pull-Up', reps: 5, load: 20, completed: true }],
  notes: 'smooth',
}

describe('duplicate workout saves', () => {
  it('inserts the first occurrence and keeps that log on a repeated save', () => {
    const incoming = {
      ...completed,
      exercises: [{ name: 'Pull-Up', reps: 99, load: 1, completed: true }],
      notes: 'retry should not replace the completed sets',
    }
    const first = planLocalWorkoutSave([], incoming)
    assert.equal(first.action, 'insert')
    const second = planLocalWorkoutSave([completed], incoming)
    assert.equal(second.action, 'keep')
    assert.equal(second.log.id, completed.id)
    assert.equal(second.log.exercises[0].reps, 5)
    assert.equal(second.log.exercises[0].load, 20)
    assert.equal(second.log.notes, 'smooth')
    assert.equal(second.log.sessionDate, '2026-10-18')
  })

  it('allows a different occurrence on the same day and name', () => {
    const other = {
      ...completed,
      id: workoutLogIdForOccurrence('occ-2'),
      occurrenceId: 'occ-2',
      exercises: [{ name: 'Pull-Up', reps: 6, load: 20, completed: true }],
    }
    const plan = planLocalWorkoutSave([completed], other)
    assert.equal(plan.action, 'insert')
    assert.equal(plan.log.occurrenceId, 'occ-2')
  })

  it('retries a pending server copy without a new log id', () => {
    const pending = { ...completed, serverEvidence: 'pending' as const }
    const plan = planLocalWorkoutSave([pending], { ...pending, exercises: [] })
    assert.equal(plan.action, 'retry-server')
    assert.equal(plan.log.id, pending.id)
    assert.equal(plan.log.exercises[0].reps, 5)
  })

  it('still appends when an older caller has no occurrence id', () => {
    const legacy = { ...completed, occurrenceId: undefined, id: 'workout-legacy' }
    const plan = planLocalWorkoutSave([], legacy)
    assert.equal(plan.action, 'insert')
  })
})

describe('failed saves and retries', () => {
  it('does not insert history when the database lookup is unavailable or unknown', () => {
    assert.equal(historyWritePlan({ databaseAvailable: false, lookup: 'absent' }), 'retry')
    assert.equal(historyWritePlan({ databaseAvailable: true, lookup: 'unknown' }), 'retry')
    assert.equal(historyWritePlan({ databaseAvailable: true, lookup: 'found' }), 'already_saved')
    assert.equal(historyWritePlan({ databaseAvailable: true, lookup: 'absent' }), 'insert')
  })

  it('reuses the occurrence id for the same session and mints a new one after it changes', () => {
    const stored = { sessionId: 'session-Day 1-1', occurrenceId: 'occ-stable' }
    const same = resolveOccurrenceId({ sessionId: stored.sessionId, stored })
    assert.equal(same.reused, true)
    assert.equal(same.occurrence.occurrenceId, 'occ-stable')
    const next = resolveOccurrenceId({
      sessionId: 'session-Day 2-2',
      stored,
      createId: () => 'occ-next',
    })
    assert.equal(next.reused, false)
    assert.equal(next.occurrence.occurrenceId, 'occ-next')
    assert.equal(createOccurrenceId(10, 'abc'), 'occ-10-abc')
  })

  it('rejects an occurrence owned by someone else or by nobody once an athlete is signed in', () => {
    const foreign = resolveOccurrenceId({
      sessionId: 'session-Day 1-1',
      stored: { sessionId: 'session-Day 1-1', occurrenceId: 'occ-stable', ownerUserId: 'user_a' },
      ownerUserId: 'user_b',
      createId: () => 'occ-new',
    })
    assert.equal(foreign.reused, false)
    assert.equal(foreign.rejected, 'foreign_owner')
    assert.equal(foreign.occurrence.occurrenceId, 'occ-new')
    assert.equal(foreign.occurrence.ownerUserId, 'user_b')
    const ownerless = resolveOccurrenceId({
      sessionId: 'session-Day 1-1',
      stored: { sessionId: 'session-Day 1-1', occurrenceId: 'occ-stable' },
      ownerUserId: 'user_b',
      createId: () => 'occ-owned',
    })
    assert.equal(ownerless.reused, false)
    assert.equal(ownerless.rejected, 'ownerless')
    assert.equal(ownerless.occurrence.occurrenceId, 'occ-owned')
  })
})

describe('partial personal-record saves', () => {
  const intended = [
    {
      exerciseKey: 'pull_up',
      prType: 'best_reps',
      exerciseName: 'Pull-Up',
      newValue: 8,
      unit: 'reps',
    },
    {
      exerciseKey: 'pull_up',
      prType: 'best_hold',
      exerciseName: 'Pull-Up',
      newValue: 12,
      unit: 'seconds',
    },
  ]

  it('returns only the personal records missing from the saved workout', () => {
    const missing = missingSessionPersonalRecords(intended, [
      { exerciseKey: 'pull_up', prType: 'best_reps' },
    ])
    assert.equal(missing.length, 1)
    assert.equal(missing[0].prType, 'best_hold')
    assert.equal(missing[0].newValue, 12)
  })

  it('does not insert or replace a personal record that is already stored', () => {
    const missing = missingSessionPersonalRecords(
      [{ ...intended[0], newValue: 99 }],
      [{ exerciseKey: 'pull_up', prType: 'best_reps' }],
    )
    assert.deepEqual(missing, [])
  })

  it('inserts each exercise and type once when the snapshot repeats it', () => {
    const missing = missingSessionPersonalRecords(
      [intended[0], { ...intended[0], newValue: 99 }, intended[1]],
      [],
    )
    assert.equal(missing.length, 2)
    assert.equal(missing[0].newValue, 8)
    assert.equal(missing[1].prType, 'best_hold')
  })

  it('retries when the existing personal records cannot be read or a write fails', () => {
    assert.equal(personalRecordPersistencePlan({
      lookup: 'unknown',
      missingCount: 1,
      failedCount: 0,
    }), 'retry')
    assert.equal(personalRecordPersistencePlan({
      lookup: 'known',
      missingCount: 2,
      failedCount: 1,
    }), 'retry')
    assert.equal(personalRecordPersistencePlan({
      lookup: 'known',
      missingCount: 1,
      failedCount: 0,
    }), 'completed')
    assert.equal(personalRecordPersistencePlan({
      lookup: 'known',
      missingCount: 0,
      failedCount: 0,
    }), 'unchanged')
  })

  it('reads the stored snapshot and drops entries that are not personal records', () => {
    const records = readPersonalRecordSnapshot([
      intended[0],
      { exerciseKey: '', prType: 'best_reps', newValue: 4 },
      { exerciseKey: 'dip', prType: 'max_weight' },
      'not-a-record',
    ])
    assert.equal(records.length, 1)
    assert.equal(records[0].exerciseKey, 'pull_up')
    const encoded = readPersonalRecordSnapshot(JSON.stringify([intended[1]]))
    assert.equal(encoded[0].newValue, 12)
  })
})

describe('athlete save status', () => {
  it('names in progress, a failed save, a pending sync, and a duplicate keep', () => {
    const failed = describeWorkoutSaveResult({
      outcome: 'failed',
      saveDisposition: 'inserted',
      serverEvidence: 'saved',
    })
    assert.equal(failed.state, 'failed')
    assert.equal(failed.title, 'Save error')
    assert.doesNotMatch(failed.detail, /in your history/)
    assert.equal(describeWorkoutSaveResult({ outcome: 'in_progress' }).title, 'In progress')
    assert.match(describeWorkoutSaveResult({ outcome: 'failed' }).detail, /not saved/)
    assert.match(
      describeWorkoutSaveResult({ outcome: 'saved', saveDisposition: 'inserted', serverEvidence: 'pending' }).detail,
      /this device/,
    )
    assert.match(
      describeWorkoutSaveResult({ outcome: 'saved', saveDisposition: 'kept', serverEvidence: 'saved' }).detail,
      /second history entry/,
    )
    assert.match(
      describeWorkoutSaveResult({ outcome: 'saved', saveDisposition: 'inserted', serverEvidence: 'skipped' }).detail,
      /in your history/,
    )
  })
})

describe('occurrence retention after a local save', () => {
  it('keeps the occurrence while server evidence is still pending', () => {
    assert.equal(shouldKeepOccurrenceAfterLocalSave('pending'), true)
    assert.equal(shouldKeepOccurrenceAfterLocalSave('saved'), false)
    assert.equal(shouldKeepOccurrenceAfterLocalSave('skipped'), false)
    assert.equal(shouldKeepOccurrenceAfterLocalSave(undefined), false)
  })

  it('keeps the original occurrence when evidence succeeds before history is confirmed', () => {
    const stored = {
      sessionId: 'session-pull-1',
      occurrenceId: 'occ-timeout',
      historyPending: true,
    }
    const afterEvidence = occurrenceAfterEvidenceSave(stored, 'occ-timeout')
    assert.equal(afterEvidence.action, 'keep')
    if (afterEvidence.action !== 'keep') return
    assert.equal(afterEvidence.occurrence.occurrenceId, 'occ-timeout')
    assert.equal(afterEvidence.occurrence.evidenceSaved, true)

    const timedOut = occurrenceAfterHistoryResult({
      occurrence: afterEvidence.occurrence,
      historyConfirmed: false,
      serverEvidence: 'saved',
    })
    assert.equal(timedOut.action, 'keep')
    if (timedOut.action !== 'keep') return
    assert.equal(timedOut.occurrence.occurrenceId, 'occ-timeout')
    assert.equal(timedOut.occurrence.historyPending, true)

    const replayId = workoutLogIdForOccurrence(timedOut.occurrence.occurrenceId)
    const replay = planLocalWorkoutSave(
      [{ id: replayId, occurrenceId: 'occ-timeout', serverEvidence: 'saved' as const }],
      { id: replayId, occurrenceId: 'occ-timeout', serverEvidence: 'saved' as const },
    )
    assert.equal(replay.action, 'keep')
    assert.equal(historyWritePlan({ databaseAvailable: true, lookup: 'found' }), 'already_saved')
    assert.equal(missingSessionPersonalRecords(
      [{ exerciseKey: 'pull_up', prType: 'best_reps' }],
      [{ exerciseKey: 'pull_up', prType: 'best_reps' }],
    ).length, 0)

    const recovered = occurrenceAfterHistoryResult({
      occurrence: afterEvidence.occurrence,
      historyConfirmed: true,
      serverEvidence: 'saved',
    })
    assert.equal(recovered.action, 'release')
    assert.equal(occurrenceAfterEvidenceSave(
      { sessionId: 'session-pull-1', occurrenceId: 'occ-timeout' },
      'occ-timeout',
    ).action, 'release')
  })
})

describe('workout save wiring', () => {
  it('keeps completed history on the client session id and does not treat a database miss as saved', () => {
    const persistence = readFileSync('lib/workout-history-persistence.ts', 'utf8')
    assert.match(persistence, /historyWritePlan/)
    assert.match(persistence, /clientSessionId/)
    assert.match(persistence, /persisted: 'failed'/)
    assert.match(persistence, /persisted: 'duplicate'/)
    assert.match(persistence, /completeMissingPersonalRecords/)
    assert.match(persistence, /missingSessionPersonalRecords/)
    assert.match(persistence, /Personal records were not fully saved/)
    const history = readFileSync('lib/history-service.ts', 'utf8')
    assert.match(history, /session_metrics_snapshot->>'clientSessionId'/)
    assert.match(history, /lookupSessionPersonalRecords/)
    assert.match(history, /failedCount/)
    const live = readFileSync('components/workout/StreamlinedWorkoutSession.tsx', 'utf8')
    assert.match(live, /historyPending: Boolean\(userId\)/)
    assert.match(live, /occurrenceAfterHistoryResult/)
    assert.match(readFileSync('lib/workout/history-progress.ts', 'utf8'), /shouldKeepOccurrenceAfterLocalSave/)
    const logs = readFileSync('lib/workout-log-service.ts', 'utf8')
    assert.match(logs, /releaseOccurrenceAfterEvidenceSave/)
    const hook = readFileSync('hooks/useWorkoutSession.ts', 'utf8')
    assert.match(hook, /occurrenceId/)
    assert.doesNotMatch(hook, /session-\$\{Date\.now\(\)\}/)
    assert.match(live, /saveLockRef/)
    assert.match(live, /occurrenceId/)
    assert.match(live, /retryPendingWorkoutEvidence/)
  })
})
