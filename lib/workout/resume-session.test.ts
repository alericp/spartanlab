import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  WORKOUT_SESSION_SCHEMA_VERSION,
  buildResumeWorkoutUrl,
  readResumableSessionSummary,
  shouldClearStoredSessionOnRestoreRejection,
  type ResumableSessionSummary,
} from './resume-session.ts'

const now = 1_700_000_000_000

function snapshot(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: WORKOUT_SESSION_SCHEMA_VERSION,
    sessionId: 'session-Pull-2',
    dayLabel: 'Pull',
    dayNumber: 2,
    executionMode: '45_min',
    variantIndex: 1,
    weekOverride: 3,
    status: 'active',
    savedAt: now - 60_000,
    completedSets: [{ setNumber: 1 }, { setNumber: 2 }],
    currentExerciseIndex: 1,
    currentSetNumber: 3,
    elapsedSeconds: 400,
    ...overrides,
  })
}

describe('resumable workout identity', () => {
  it('rebuilds the saved day, mode, variant, and week without reading set values', () => {
    const summary = readResumableSessionSummary(snapshot(), now)
    assert.ok(summary)
    assert.equal(summary?.completedSetsCount, 2)
    assert.equal(summary?.dayLabel, 'Pull')
    const url = buildResumeWorkoutUrl(summary as ResumableSessionSummary)
    assert.equal(url, '/workout/session?day=2&mode=45_min&variant=1&week=3&resume=1')
  })

  it('omits week when the saved session has no week override', () => {
    const summary = readResumableSessionSummary(snapshot({ weekOverride: null }), now)
    assert.equal(
      buildResumeWorkoutUrl(summary as ResumableSessionSummary),
      '/workout/session?day=2&mode=45_min&variant=1&resume=1',
    )
  })

  it('ignores a finished, stale, or identity-less snapshot', () => {
    assert.equal(readResumableSessionSummary(snapshot({ status: 'completed' }), now), null)
    assert.equal(readResumableSessionSummary(snapshot({ status: 'ready', completedSets: [], currentExerciseIndex: 0 }), now), null)
    assert.equal(readResumableSessionSummary(snapshot({ savedAt: now - 5 * 60 * 60 * 1000 }), now), null)
    assert.equal(readResumableSessionSummary(snapshot({ schemaVersion: 'old' }), now), null)
    assert.equal(readResumableSessionSummary(snapshot({ dayLabel: '' }), now), null)
    assert.equal(readResumableSessionSummary('not-json', now), null)
  })

  it('keeps a different session snapshot when restore is rejected for an id mismatch', () => {
    assert.equal(shouldClearStoredSessionOnRestoreRejection('session_id_mismatch'), false)
    assert.equal(shouldClearStoredSessionOnRestoreRejection('schema_version_mismatch'), true)
    assert.equal(shouldClearStoredSessionOnRestoreRejection('invalid_json_parse'), true)
  })

  it('wires Today resume and safe note summaries onto the existing workout path', () => {
    const today = readFileSync('app/(app)/today/page.tsx', 'utf8')
    assert.match(today, /getResumableSessionSummary/)
    assert.match(today, /Resume workout/)
    assert.match(today, /Start saved session/)
    const corridor = readFileSync('components/workout/ActiveWorkoutStartCorridor.tsx', 'utf8')
    assert.match(corridor, /workoutNoteSummaryLine/)
    assert.doesNotMatch(corridor, /title=\{trimmedNote\}/)
    assert.doesNotMatch(corridor, /title=\{trimmedLatestNote\}/)
    assert.match(corridor, /Choose an RPE to log this set/)
    const live = readFileSync('components/workout/StreamlinedWorkoutSession.tsx', 'utf8')
    assert.match(live, /describeWorkoutSaveResult/)
    assert.match(live, /shouldClearStoredSessionOnRestoreRejection/)
    assert.match(live, /Try Save Again/)
    assert.doesNotMatch(live, /Save & Return to Dashboard/)
  })
})
