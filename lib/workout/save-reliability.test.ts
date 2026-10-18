import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  createOccurrenceId,
  historyWritePlan,
  planLocalWorkoutSave,
  resolveOccurrenceId,
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
})

describe('workout save wiring', () => {
  it('keeps completed history on the client session id and does not treat a database miss as saved', () => {
    const persistence = readFileSync('lib/workout-history-persistence.ts', 'utf8')
    assert.match(persistence, /historyWritePlan/)
    assert.match(persistence, /clientSessionId/)
    assert.match(persistence, /persisted: 'failed'/)
    assert.match(persistence, /persisted: 'duplicate'/)
    const history = readFileSync('lib/history-service.ts', 'utf8')
    assert.match(history, /session_metrics_snapshot->>'clientSessionId'/)
    const hook = readFileSync('hooks/useWorkoutSession.ts', 'utf8')
    assert.match(hook, /occurrenceId/)
    assert.doesNotMatch(hook, /session-\$\{Date\.now\(\)\}/)
    const live = readFileSync('components/workout/StreamlinedWorkoutSession.tsx', 'utf8')
    assert.match(live, /saveLockRef/)
    assert.match(live, /occurrenceId/)
    assert.match(live, /retryPendingWorkoutEvidence/)
  })
})
