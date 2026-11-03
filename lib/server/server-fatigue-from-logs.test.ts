import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { deriveServerFatigueFromWorkoutLogs } from './server-fatigue-from-logs.ts'
import { buildWeekAdaptationDecision } from '../program-generation/week-adaptation-decision-contract.ts'

const NOW = new Date('2026-10-18T12:00:00.000Z')

function log(partial: {
  id: string
  daysAgo: number
  rpe?: number
  difficulty?: 'easy' | 'normal' | 'hard'
  completed?: boolean
  trusted?: boolean
  dated?: boolean
}) {
  const when = new Date(NOW.getTime() - partial.daysAgo * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: partial.id,
    trusted: partial.trusted ?? true,
    sessionDate: partial.dated === false ? undefined : when,
    perceivedDifficulty: partial.difficulty,
    exercises: typeof partial.completed === 'boolean' ? [{ completed: partial.completed }] : undefined,
    completedSetEvidence: typeof partial.rpe === 'number' ? [{ actualRPE: partial.rpe, completed: true, trusted: true }] : undefined,
  }
}

describe('server fatigue from existing workout logs', () => {
  it('lightens generation when recent workouts were hard, without a deload decision', () => {
    const derived = deriveServerFatigueFromWorkoutLogs(
      [
        log({ id: 'a', daysAgo: 1, rpe: 9, difficulty: 'hard', completed: false }),
        log({ id: 'b', daysAgo: 3, rpe: 9, difficulty: 'hard', completed: false }),
      ],
      { expectedSessionsPerWeek: 4, now: NOW },
    )
    assert.equal(derived.reliable, true)
    assert.equal(derived.decision, 'LIGHTEN_SESSION')
    assert.equal(derived.needsAttention, true)
    assert.match(derived.shortGuidance, /No deload week/)
    assert.equal(derived.trainingFeedback?.totalSessionsLast7Days, 2)
    assert.equal(derived.trainingFeedback?.expectedSessionsPerWeek, null)
    assert.equal(derived.savedWeeklyAvailability, 4)
    assert.equal(derived.recoveryRiskForWeek, 'high')
    assert.match(derived.shortGuidance, /sessions are lighter/)
    assert.match(derived.shortGuidance, /saved weekly schedule is unchanged/)
    const expected = derived.trainingFeedback?.expectedSessionsPerWeek
    const knownExpected = typeof expected === 'number' && expected > 0
    const missed = knownExpected
      ? Math.max(0, (expected as number) - (derived.trainingFeedback?.totalSessionsLast7Days ?? 0))
      : 0
    assert.equal(missed, 0)
    assert.ok((derived.trainingFeedback?.averageRecentRPE ?? 0) > 8.5)
    assert.equal(JSON.stringify(derived).includes('DELOAD'), false)
  })

  it('keeps a clearly manageable athlete on the planned session', () => {
    const derived = deriveServerFatigueFromWorkoutLogs(
      [
        log({ id: 'a', daysAgo: 1, rpe: 6, difficulty: 'easy', completed: true }),
        log({ id: 'b', daysAgo: 2, rpe: 6, difficulty: 'normal', completed: true }),
      ],
      { now: NOW },
    )
    assert.equal(derived.decision, 'TRAIN_AS_PLANNED')
    assert.equal(derived.recoveryRiskForWeek, 'low')
    assert.match(derived.shortGuidance, /normal training difficulty/)
    assert.equal(derived.trainingFeedback?.expectedSessionsPerWeek, null)
    assert.equal(derived.needsAttention, false)
  })

  it('does not invent fatigue when the logs cannot support it', () => {
    const one = deriveServerFatigueFromWorkoutLogs([log({ id: 'a', daysAgo: 1, rpe: 9 })], { now: NOW })
    assert.equal(one.reliable, false)
    assert.equal(one.decision, null)
    assert.equal(one.trainingFeedback, null)
    assert.equal(one.recoveryRiskForWeek, null)
    assert.match(one.limitation ?? '', /fresh-session/)

    const undated = deriveServerFatigueFromWorkoutLogs(
      [
        log({ id: 'a', daysAgo: 1, rpe: 9, dated: false }),
        log({ id: 'b', daysAgo: 1, rpe: 9, dated: false }),
      ],
      { now: NOW },
    )
    assert.equal(undated.reliable, false)
    assert.equal(undated.trainingFeedback, null)

    const demo = deriveServerFatigueFromWorkoutLogs(
      [
        { ...log({ id: 'a', daysAgo: 1, rpe: 9 }), sourceRoute: 'demo' },
        { ...log({ id: 'b', daysAgo: 1, rpe: 9 }), trusted: false },
      ],
      { now: NOW },
    )
    assert.equal(demo.reliable, false)
  })

  it('keeps a manageable week on the current plan', () => {
    const decision = buildWeekAdaptationDecision({
      generationIntent: 'regenerate',
      isFreshBaselineBuild: false,
      weekNumber: 1,
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      experienceLevel: 'intermediate',
      reportedRecoveryRisk: 'low',
      lockSavedDayCount: true,
    })
    assert.equal(decision.targetDays, 4)
    assert.equal(decision.recoveryContext.recoveryRisk, 'low')
    assert.equal(decision.loadStrategy.volumeBias, 'normal')
  })

  it('lightens sessions for high fatigue without changing the saved week', () => {
    const locked = buildWeekAdaptationDecision({
      generationIntent: 'regenerate',
      isFreshBaselineBuild: false,
      weekNumber: 1,
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      experienceLevel: 'intermediate',
      reportedRecoveryRisk: 'high',
      lockSavedDayCount: true,
    })
    assert.equal(locked.targetDays, 4)
    assert.equal(locked.loadStrategy.volumeBias, 'reduced')
    assert.equal(locked.loadStrategy.intensityBias, 'reduced')
    assert.match(locked.dayCountReason, /Saved weekly schedule kept/)

    const unlocked = buildWeekAdaptationDecision({
      generationIntent: 'regenerate',
      isFreshBaselineBuild: false,
      weekNumber: 2,
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      experienceLevel: 'intermediate',
      isFirstGeneratedWeek: false,
      reportedRecoveryRisk: 'high',
      lockSavedDayCount: false,
    })
    assert.equal(unlocked.targetDays, 3)
  })

  it('does not invent a moderate recovery penalty when no signal exists', () => {
    const decision = buildWeekAdaptationDecision({
      generationIntent: 'regenerate',
      isFreshBaselineBuild: false,
      weekNumber: 2,
      isFirstGeneratedWeek: false,
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      experienceLevel: 'intermediate',
      reportedRecoveryRisk: 'unknown',
      lockSavedDayCount: true,
    })
    assert.equal(decision.recoveryContext.recoveryRisk, 'unknown')
    assert.equal(decision.recoveryContext.readinessState, 'unknown')
    assert.equal(decision.loadStrategy.volumeBias, 'normal')
    assert.equal(decision.loadStrategy.densityBias, 'normal')
    assert.equal(decision.loadStrategy.finisherBias, 'normal')
    assert.equal(decision.targetDays, 4)
  })

  it('trims extra stress for temporary fatigue and keeps the saved week', () => {
    const decision = buildWeekAdaptationDecision({
      generationIntent: 'regenerate',
      isFreshBaselineBuild: false,
      weekNumber: 2,
      isFirstGeneratedWeek: false,
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      experienceLevel: 'intermediate',
      reportedRecoveryRisk: 'moderate',
      lockSavedDayCount: true,
    })
    assert.equal(decision.targetDays, 4)
    assert.equal(decision.loadStrategy.volumeBias, 'normal')
    assert.equal(decision.loadStrategy.densityBias, 'reduced')
    assert.equal(decision.loadStrategy.finisherBias, 'limited')
  })

  it('does not shrink the saved week when missed sessions were not inferred', () => {
    const decision = buildWeekAdaptationDecision({
      generationIntent: 'regenerate',
      isFreshBaselineBuild: false,
      weekNumber: 1,
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      experienceLevel: 'intermediate',
      recentMissedSessions: 0,
      totalSessionsLast7Days: 2,
    })
    assert.equal(decision.targetDays, 4)
    assert.notEqual(decision.adherenceContext.consistencyStatus, 'disrupted')
    assert.match(decision.dayCountReason, /Base: 4 days/)
  })

  it('wires the decision into server generation and refuses a deload decision', () => {
    const generation = readFileSync('lib/server/authoritative-program-generation.ts', 'utf8')
    const builder = readFileSync('lib/adaptive-program-builder.ts', 'utf8')
    const fatigue = readFileSync('lib/server/server-fatigue-from-logs.ts', 'utf8')
    assert.match(generation, /deriveServerFatigueFromWorkoutLogs/)
    assert.match(generation, /serverFatigueDecision:/)
    assert.match(generation, /isFreshBaselineBuild !== true && derivedServerFatigue\.reliable/)
    assert.match(builder, /serverOptions\?\.serverFatigueDecision/)
    assert.match(builder, /LIGHTEN_SESSION' \? 'accumulated'/)
    assert.match(builder, /PRESERVE_QUALITY' \? 'moderate'/)
    assert.match(builder, /fatigueDecision\.shortGuidance/)
    assert.match(generation, /reportedRecoveryRiskFromDecision/)
    assert.equal(fatigue.includes('DELOAD_RECOMMENDED'), false)
    assert.equal(fatigue.includes("'DELOAD"), false)
  })
})
