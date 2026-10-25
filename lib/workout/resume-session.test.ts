import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  WORKOUT_SESSION_SCHEMA_VERSION,
  buildResumeWorkoutUrl,
  canReplaceStoredSession,
  readResumableSessionSummary,
  resumeMatchesLoadedSession,
  shouldClearStoredSessionOnRestoreRejection,
  type ResumableSessionSummary,
} from './resume-session.ts'

const now = 1_700_000_000_000

function snapshot(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: WORKOUT_SESSION_SCHEMA_VERSION,
    ownerUserId: 'user_owner',
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
    const summary = readResumableSessionSummary(snapshot(), now, 'user_owner')
    assert.ok(summary)
    assert.equal(summary?.completedSetsCount, 2)
    assert.equal(summary?.dayLabel, 'Pull')
    const url = buildResumeWorkoutUrl(summary as ResumableSessionSummary)
    assert.equal(url, '/workout/session?day=2&mode=45_min&variant=1&week=3&resume=1')
  })

  it('omits week when the saved session has no week override', () => {
    const summary = readResumableSessionSummary(snapshot({ weekOverride: null }), now, 'user_owner')
    assert.equal(
      buildResumeWorkoutUrl(summary as ResumableSessionSummary),
      '/workout/session?day=2&mode=45_min&variant=1&resume=1',
    )
  })

  it('ignores a finished, stale, or identity-less snapshot', () => {
    assert.equal(readResumableSessionSummary(snapshot({ status: 'completed' }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ status: 'ready', completedSets: [], currentExerciseIndex: 0 }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ savedAt: now - 5 * 60 * 60 * 1000 }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ savedAt: now + 60_000 }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ schemaVersion: 'old' }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ dayLabel: '' }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ dayNumber: -1 }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary('not-json', now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot(), now, null), null)
  })

  it('does not resume another account or a session id that disagrees with the day', () => {
    assert.equal(readResumableSessionSummary(snapshot(), now, 'user_other'), null)
    assert.equal(readResumableSessionSummary(snapshot({ ownerUserId: 'user_other' }), now, 'user_owner'), null)
    assert.equal(readResumableSessionSummary(snapshot({ sessionId: 'session-Legs-2' }), now, 'user_owner'), null)
    const summary = readResumableSessionSummary(snapshot(), now, 'user_owner') as ResumableSessionSummary
    assert.equal(resumeMatchesLoadedSession(summary, { dayLabel: 'Pull', dayNumber: 2 }), true)
    assert.equal(resumeMatchesLoadedSession(summary, { dayLabel: 'Legs', dayNumber: 2 }), false)
    assert.equal(canReplaceStoredSession(snapshot(), 'user_other', 'session-Legs-1', false, now), false)
    assert.equal(canReplaceStoredSession(snapshot(), 'user_owner', 'session-Legs-1', false, now), false)
    assert.equal(canReplaceStoredSession(snapshot(), 'user_owner', 'session-Pull-2', false, now), true)
    assert.equal(canReplaceStoredSession(snapshot(), 'user_other', 'session-Legs-1', true, now), false)
    assert.equal(canReplaceStoredSession(snapshot({ ownerUserId: undefined }), 'user_owner', 'session-Pull-2', true, now), false)
  })

  it('keeps a different session snapshot when restore is rejected for an id or owner mismatch', () => {
    assert.equal(shouldClearStoredSessionOnRestoreRejection('session_id_mismatch'), false)
    assert.equal(shouldClearStoredSessionOnRestoreRejection('owner_mismatch'), false)
    assert.equal(shouldClearStoredSessionOnRestoreRejection('owner_missing'), false)
    assert.equal(shouldClearStoredSessionOnRestoreRejection('schema_version_mismatch'), true)
    assert.equal(shouldClearStoredSessionOnRestoreRejection('invalid_json_parse'), true)
  })

  it('wires Today resume and safe note summaries onto the existing workout path', () => {
    const today = readFileSync('app/(app)/today/page.tsx', 'utf8')
    assert.match(today, /getResumableSessionSummary/)
    assert.match(today, /one unfinished workout/)
    assert.match(today, /Resume workout/)
    assert.match(today, /Start saved session/)
    const corridor = readFileSync('components/workout/ActiveWorkoutStartCorridor.tsx', 'utf8')
    assert.match(corridor, /workoutNoteSummaryLine/)
    assert.doesNotMatch(corridor, /title=\{trimmedNote\}/)
    assert.doesNotMatch(corridor, /title=\{trimmedLatestNote\}/)
    assert.match(corridor, /Choose an RPE to log this set/)
    const live = readFileSync('components/workout/StreamlinedWorkoutSession.tsx', 'utf8')
    assert.match(live, /describeWorkoutSaveResult/)
    assert.match(live, /ownerUserId/)
    assert.match(live, /canReplaceStoredSession/)
    assert.match(live, /shouldClearStoredSessionOnRestoreRejection/)
    const route = readFileSync('app/(app)/workout/session/page.tsx', 'utf8')
    assert.match(route, /Cannot resume this workout/)
    assert.match(route, /resumeMatchesLoadedSession/)
    assert.match(live, /Try Save Again/)
    assert.doesNotMatch(live, /Save & Return to Dashboard/)
  })
})
