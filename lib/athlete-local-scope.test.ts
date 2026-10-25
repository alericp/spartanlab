import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, it } from 'node:test'
import {
  athleteStorageKey,
  bindActiveAthlete,
  getBoundAthleteId,
  hasQuarantinedBlob,
  lookupOccurrenceOwner,
  quarantinedRecordCount,
  readAthleteItem,
  readPendingHistoryRetry,
  recoverQuarantinedBlob,
  recoverQuarantinedRecords,
  unbindActiveAthlete,
  writeAthleteItem,
  writePendingHistoryRetry,
} from './athlete-local-scope.ts'
import { getAthleteProfile, saveAthleteProfile } from './data-service.ts'
import { getOnboardingProfile, saveOnboardingProfile } from './athlete-profile.ts'
import { decideRequestedAthleteAccess } from './server/athlete-ownership.ts'
import { getRecentSessionFeedback, saveSessionFeedback } from './session-feedback.ts'
import { getStrengthRecords, saveStrengthRecord } from './strength-service.ts'
import {
  getWorkoutLogs,
  markLoggedHistorySync,
  saveWorkoutLog,
  selectOwnedPendingEvidence,
} from './workout-log-service.ts'
import { getRecentWorkoutLogsForGenerationRequest } from './program/performance-feedback-integration.ts'
import {
  applyOwnedCrashRecoveryWipe,
  canReplaceStoredSession,
  recordCrashRecoveryMarker,
  WORKOUT_SESSION_SCHEMA_VERSION,
  WORKOUT_SESSION_STORAGE_KEY,
} from './workout/resume-session.ts'
import { resolveOccurrenceId, WORKOUT_OCCURRENCE_STORAGE_KEY } from './workout/save-reliability.ts'

const store = new Map<string, string>()
const memoryStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, String(value))
  },
  removeItem: (key: string) => {
    store.delete(key)
  },
  clear: () => {
    store.clear()
  },
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size
  },
}

Object.assign(globalThis, { localStorage: memoryStorage, window: globalThis })

const ATHLETE_A = 'user_athlete_a'
const ATHLETE_B = 'user_athlete_b'

function logInput(notes: string, occurrenceId: string) {
  return {
    sessionName: 'Push',
    sessionType: 'strength' as const,
    sessionDate: '2026-10-24',
    durationMinutes: 45,
    focusArea: 'general' as const,
    notes,
    exercises: [{ id: 'ex-1', name: 'Pull-Up', category: 'pull' as const, sets: 3, reps: 5, completed: true }],
    occurrenceId,
    trusted: true,
    sourceRoute: 'workout_session' as const,
  }
}

beforeEach(() => {
  store.clear()
  unbindActiveAthlete()
})

afterEach(() => {
  unbindActiveAthlete()
})

describe('two accounts on one browser', () => {
  it('keeps workout notes, feedback, strength, profile, and program on the athlete who saved them', () => {
    bindActiveAthlete(ATHLETE_A)
    saveWorkoutLog(logInput('private jane@example.com 123-45-6789', 'occ-a'))
    saveSessionFeedback('session-a', { difficulty: 'hard', notes: 'shoulder sore — private', trusted: true, completed: true })
    saveStrengthRecord('weighted_pull_up', 25, 5, { notes: 'gym pin 4412' })
    saveAthleteProfile({ primaryGoal: 'planche', onboardingComplete: true })
    saveOnboardingProfile({
      onboardingComplete: true,
      primaryGoal: 'planche',
      selectedSkills: ['planche'],
      equipment: ['pullup_bar'],
      trainingExperience: 'intermediate',
    } as never)
    writeAthleteItem('spartanlab_active_program', JSON.stringify({
      id: 'program-a',
      sessions: [{ dayNumber: 1 }],
      createdAt: '2026-10-24T00:00:00.000Z',
    }))

    bindActiveAthlete(ATHLETE_B)
    assert.equal(getWorkoutLogs().length, 0)
    assert.equal(getRecentWorkoutLogsForGenerationRequest().length, 0)
    assert.equal(getRecentSessionFeedback().length, 0)
    assert.equal(getStrengthRecords().length, 0)
    assert.equal(getAthleteProfile(), null)
    assert.equal(getOnboardingProfile(), null)
    assert.equal(readAthleteItem('spartanlab_active_program'), null)
    saveWorkoutLog(logInput('athlete b only', 'occ-b'))

    bindActiveAthlete(ATHLETE_A)
    const logs = getWorkoutLogs()
    assert.equal(logs.length, 1)
    assert.equal(logs[0]?.ownerUserId, ATHLETE_A)
    assert.match(logs[0]?.notes ?? '', /jane@example.com/)
    assert.equal(
      getRecentSessionFeedback().some((entry) => entry.notes === 'shoulder sore — private'),
      true,
    )
    assert.equal(getStrengthRecords()[0]?.notes, 'gym pin 4412')
    assert.equal(getAthleteProfile()?.userId, ATHLETE_A)
    assert.equal(getOnboardingProfile()?.primaryGoal, 'planche')
    assert.match(readAthleteItem('spartanlab_active_program') ?? '', /program-a/)
    assert.equal(store.has('spartanlab_workout_logs'), false)
    assert.equal(store.has(athleteStorageKey('spartanlab_workout_logs', ATHLETE_B)), true)
  })
})

describe('ownerless legacy records', () => {
  it('quarantines them and does not give them to the next athlete', () => {
    const legacyLogs = JSON.stringify([
      {
        id: 'legacy-1',
        createdAt: '2026-10-01T00:00:00.000Z',
        sessionName: 'Old',
        sessionType: 'mixed',
        sessionDate: '2026-10-01',
        durationMinutes: 30,
        focusArea: 'general',
        notes: 'legacy private note',
        exercises: [],
      },
    ])
    const legacyProfile = JSON.stringify({
      id: 'stored-profile',
      userId: 'local-user',
      primaryGoal: 'front_lever',
      onboardingComplete: true,
    })
    store.set('spartanlab_workout_logs', legacyLogs)
    store.set('spartanlab_onboarding_profile', legacyProfile)

    bindActiveAthlete(ATHLETE_A)
    assert.equal(getWorkoutLogs().length, 0)
    assert.equal(getOnboardingProfile(), null)
    assert.equal(store.get('spartanlab_workout_logs'), legacyLogs)
    assert.equal(store.get('spartanlab_onboarding_profile'), legacyProfile)
    assert.equal(quarantinedRecordCount('spartanlab_workout_logs'), 1)
    assert.equal(hasQuarantinedBlob('spartanlab_onboarding_profile'), true)
    markLoggedHistorySync('missing', ATHLETE_A, 'pending')
    assert.equal(store.get('spartanlab_workout_logs'), legacyLogs)

    assert.equal(recoverQuarantinedRecords('spartanlab_workout_logs', ATHLETE_A), 1)
    assert.equal(getWorkoutLogs()[0]?.notes, 'legacy private note')
    assert.equal(getWorkoutLogs()[0]?.ownerUserId, ATHLETE_A)
    bindActiveAthlete(ATHLETE_B)
    assert.equal(getWorkoutLogs().length, 0)
    assert.equal(store.get('spartanlab_workout_logs'), legacyLogs)
  })
})

describe('occurrence ids and history retries', () => {
  it('rejects another account occurrence and keeps one history row for a repeated save', () => {
    bindActiveAthlete(ATHLETE_A)
    writeAthleteItem(WORKOUT_OCCURRENCE_STORAGE_KEY, JSON.stringify({
      sessionId: 'session-Push-1',
      occurrenceId: 'occ-a',
      ownerUserId: ATHLETE_A,
      historyPending: true,
    }))
    const first = saveWorkoutLog(logInput('same session', 'occ-a'))
    const second = saveWorkoutLog(logInput('retry must not duplicate', 'occ-a'))
    assert.equal(first.saveDisposition, 'inserted')
    assert.equal(second.saveDisposition, 'kept')
    assert.equal(getWorkoutLogs().length, 1)
    assert.equal(getWorkoutLogs()[0]?.occurrenceId, 'occ-a')

    bindActiveAthlete(ATHLETE_B)
    assert.equal(lookupOccurrenceOwner('occ-a'), ATHLETE_A)
    const rejected = resolveOccurrenceId({
      sessionId: 'session-Push-1',
      stored: {
        sessionId: 'session-Push-1',
        occurrenceId: 'occ-a',
        ownerUserId: ATHLETE_A,
        historyPending: true,
      },
      ownerUserId: ATHLETE_B,
      createId: () => 'occ-b',
    })
    assert.equal(rejected.rejected, 'foreign_owner')
    assert.equal(rejected.occurrence.occurrenceId, 'occ-b')
    const saved = saveWorkoutLog(logInput('other athlete', 'occ-a'))
    assert.notEqual(saved.occurrenceId, 'occ-a')
    assert.equal(saved.ownerUserId, ATHLETE_B)
    bindActiveAthlete(ATHLETE_A)
    assert.equal(getWorkoutLogs().length, 1)
    assert.equal(getWorkoutLogs()[0]?.occurrenceId, 'occ-a')
  })

  it('restores a pending history payload for the saving athlete after a fresh read', () => {
    bindActiveAthlete(ATHLETE_A)
    writePendingHistoryRetry({
      ownerUserId: ATHLETE_A,
      occurrenceId: 'occ-a',
      serverEvidence: 'pending',
      payload: {
        userId: ATHLETE_A,
        clientSessionId: 'occ-a',
        workoutName: 'Push',
      },
    })
    const restored = readPendingHistoryRetry<{ userId: string; clientSessionId: string; workoutName: string }>(ATHLETE_A)
    assert.equal(restored?.payload.workoutName, 'Push')
    assert.equal(restored?.occurrenceId, 'occ-a')
    bindActiveAthlete(ATHLETE_B)
    assert.equal(readPendingHistoryRetry(ATHLETE_A), null)
    assert.equal(readPendingHistoryRetry(ATHLETE_B), null)
    bindActiveAthlete(ATHLETE_A)
    assert.equal(readPendingHistoryRetry<{ workoutName: string }>(ATHLETE_A)?.payload.workoutName, 'Push')
    assert.equal(getBoundAthleteId(), ATHLETE_A)
  })
})

describe('programming evidence and crash recovery', () => {
  it('retries evidence only for the athlete who owns the pending log', () => {
    const logs = [
      { id: 'a', ownerUserId: ATHLETE_A, serverEvidence: 'pending' as const },
      { id: 'b', ownerUserId: ATHLETE_B, serverEvidence: 'pending' as const },
      { id: 'legacy', serverEvidence: 'pending' as const },
      { id: 'done', ownerUserId: ATHLETE_A, serverEvidence: 'saved' as const },
    ]
    assert.deepEqual(selectOwnedPendingEvidence(logs, ATHLETE_A).map((log) => log.id), ['a'])
    assert.deepEqual(selectOwnedPendingEvidence(logs, null), [])
    const integration = readFileSync('lib/program/performance-feedback-integration.ts', 'utf8')
    assert.match(integration, /getWorkoutLogs\(\)/)
    assert.match(readFileSync('lib/daily-readiness.ts', 'utf8'), /getWorkoutLogs/)
    assert.match(readFileSync('lib/recovery-fatigue-engine.ts', 'utf8'), /getWorkoutLogs/)
    assert.match(readFileSync('lib/strength-score-engine.ts', 'utf8'), /getWorkoutLogs/)
    assert.match(readFileSync('lib/workout-log-service.ts', 'utf8'), /selectOwnedPendingEvidence/)
  })

  it('clears only the crashed athlete unfinished snapshot', () => {
    const now = 1_700_000_000_000
    store.set(athleteStorageKey(WORKOUT_SESSION_STORAGE_KEY, ATHLETE_A), '{"owner":"a"}')
    store.set(athleteStorageKey(WORKOUT_SESSION_STORAGE_KEY, ATHLETE_B), '{"owner":"b"}')
    store.set(WORKOUT_SESSION_STORAGE_KEY, '{"owner":"legacy"}')
    store.set('spartanlab_workout_boot_failed', String(now))
    assert.equal(applyOwnedCrashRecoveryWipe(now + 1_000), false)
    assert.equal(store.get(WORKOUT_SESSION_STORAGE_KEY), '{"owner":"legacy"}')

    recordCrashRecoveryMarker(ATHLETE_A, now)
    assert.equal(applyOwnedCrashRecoveryWipe(now + 1_000), true)
    assert.equal(store.has(athleteStorageKey(WORKOUT_SESSION_STORAGE_KEY, ATHLETE_A)), false)
    assert.equal(store.get(athleteStorageKey(WORKOUT_SESSION_STORAGE_KEY, ATHLETE_B)), '{"owner":"b"}')
    assert.equal(store.get(WORKOUT_SESSION_STORAGE_KEY), '{"owner":"legacy"}')
    const foreignSnapshot = JSON.stringify({
      schemaVersion: WORKOUT_SESSION_SCHEMA_VERSION,
      ownerUserId: ATHLETE_A,
      sessionId: 'session-Pull-2',
      dayLabel: 'Pull',
      dayNumber: 2,
      executionMode: '45_min',
      variantIndex: 0,
      weekOverride: null,
      status: 'active',
      savedAt: now - 1_000,
      completedSets: [{ setNumber: 1 }],
    })
    assert.equal(canReplaceStoredSession(foreignSnapshot, ATHLETE_B, 'session-Legs-1', true, now), false)
  })
})

describe('server history ownership', () => {
  it('still refuses a requested athlete id that is not the authenticated Clerk user', () => {
    const allowed = decideRequestedAthleteAccess(ATHLETE_A, ATHLETE_A)
    assert.equal(allowed.allowed, true)
    const denied = decideRequestedAthleteAccess(ATHLETE_A, ATHLETE_B)
    assert.equal(denied.allowed, false)
    if (!denied.allowed) assert.equal(denied.status, 403)
    assert.match(readFileSync('app/api/workout-log/save-evidence/route.ts', 'utf8'), /NEVER from/)
    assert.match(readFileSync('app/api/history/workouts/route.ts', 'utf8'), /readOwnedAthleteResource/)
    assert.equal(recoverQuarantinedBlob('spartanlab_onboarding_profile', ATHLETE_B), false)
  })
})
