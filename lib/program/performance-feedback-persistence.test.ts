import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  applyIdempotentPerformanceFeedback,
  applyLoggedPerformanceFeedback,
  revertPerformanceAdaptation,
  type CompletedSetEvidence,
  type PhaseLProgramShape,
} from './performance-feedback-adaptation-contract.ts'

function exercise(sets: number, repsOrTime = '8-12', targetRPE = 8) {
  return {
    id: 'push-1',
    name: 'Push-ups',
    sets,
    repsOrTime,
    targetRPE,
    restSeconds: 90,
  }
}

function program(): PhaseLProgramShape {
  return {
    id: 'prog-1',
    sessions: [
      { dayNumber: 1, dayLabel: 'Day 1', exercises: [exercise(3)] },
      { dayNumber: 2, dayLabel: 'Day 2', exercises: [exercise(3)] },
    ],
  }
}

function setEvidence(
  setNumber: number,
  actualReps: number,
  actualRPE: number,
): CompletedSetEvidence {
  return {
    exerciseName: 'Push-ups',
    exerciseId: 'push-1',
    setNumber,
    prescribedReps: 8,
    actualReps,
    prescribedRPE: 8,
    actualRPE,
    exerciseClass: 'bodyweight_strength',
    trusted: true,
    completed: true,
    timestamp: '2026-10-18T12:00:00.000Z',
  }
}

function daySets(current: PhaseLProgramShape, dayNumber: number): number | undefined {
  return current.sessions?.find((session) => session.dayNumber === dayNumber)?.exercises?.[0]?.sets
}

function futureStamp(current: PhaseLProgramShape) {
  return current.sessions?.find((session) => session.dayNumber === 2)?.exercises?.[0]?.performanceAdaptation
}

describe('future session performance adjustment', () => {
  it('advances a future session after strong performance and explains it', () => {
    const before = program()
    const completed = JSON.stringify(before.sessions?.[0])
    const result = applyIdempotentPerformanceFeedback(before, {
      completedSetEvidence: [setEvidence(1, 12, 6), setEvidence(2, 12, 6)],
      completedDayNumbers: [1],
      evidenceHash: 'strong-1',
      incomingLogIds: ['log-strong'],
      nowIso: '2026-10-18T12:05:00.000Z',
    })
    assert.equal(daySets(result.program, 1), 3)
    assert.equal(JSON.stringify(result.program.sessions?.[0]), completed)
    assert.equal(daySets(result.program, 2), 4)
    const stamp = futureStamp(result.program)
    assert.equal(stamp?.mutationType, 'increase_progression_slightly')
    assert.equal(stamp?.status, 'applied')
    assert.match(stamp?.userVisibleExplanation ?? '', /3 → 4 sets/)
    assert.equal(stamp?.evidenceHash, 'strong-1')
  })

  it('trims a future session after poor performance and explains it', () => {
    const result = applyIdempotentPerformanceFeedback(program(), {
      completedSetEvidence: [setEvidence(1, 4, 9), setEvidence(2, 4, 9)],
      completedDayNumbers: [1],
      evidenceHash: 'poor-1',
      incomingLogIds: ['log-poor'],
      nowIso: '2026-10-18T12:05:00.000Z',
    })
    assert.equal(daySets(result.program, 1), 3)
    assert.equal(daySets(result.program, 2), 2)
    const stamp = futureStamp(result.program)
    assert.equal(stamp?.status, 'applied')
    assert.ok(stamp?.userVisibleExplanation)
    assert.match(stamp?.userVisibleExplanation ?? '', /3 → 2 sets/)
  })

  it('leaves the prescription unchanged when performance is on target', () => {
    const before = program()
    const result = applyIdempotentPerformanceFeedback(before, {
      completedSetEvidence: [setEvidence(1, 8, 8), setEvidence(2, 8, 8)],
      completedDayNumbers: [1],
      evidenceHash: 'flat-1',
      incomingLogIds: ['log-flat'],
      nowIso: '2026-10-18T12:05:00.000Z',
    })
    assert.equal(daySets(result.program, 1), 3)
    assert.equal(daySets(result.program, 2), 3)
    assert.equal(futureStamp(result.program), undefined)
    assert.equal(result.adaptation.proof.mutationsApplied, 0)
  })

  it('does not apply the same completed workout twice, including after revert', () => {
    const first = applyIdempotentPerformanceFeedback(program(), {
      completedSetEvidence: [setEvidence(1, 12, 6), setEvidence(2, 12, 6)],
      completedDayNumbers: [1],
      evidenceHash: 'strong-1',
      incomingLogIds: ['log-strong'],
      nowIso: '2026-10-18T12:05:00.000Z',
    })
    const second = applyIdempotentPerformanceFeedback(first.program, {
      completedSetEvidence: [setEvidence(1, 12, 6), setEvidence(2, 12, 6)],
      completedDayNumbers: [1],
      evidenceHash: 'strong-1',
      consumedLogIds: first.program.performanceFeedbackAppliedLogIds,
      incomingLogIds: ['log-strong'],
      nowIso: '2026-10-18T12:06:00.000Z',
    })
    assert.equal(second.changed, false)
    assert.equal(daySets(second.program, 2), 4)

    const reverted = revertPerformanceAdaptation(first.program, {
      dayNumber: 2,
      exerciseId: 'push-1',
    })
    assert.equal(reverted.changed, true)
    assert.equal(daySets(reverted.program, 2), 3)
    assert.equal(daySets(reverted.program, 1), 3)
    assert.equal(futureStamp(reverted.program)?.status, 'reverted_by_athlete')
    assert.equal(futureStamp(reverted.program)?.evidenceHash, 'strong-1')
    assert.match(futureStamp(reverted.program)?.userVisibleExplanation ?? '', /original prescription/)

    const afterRevert = applyIdempotentPerformanceFeedback(reverted.program, {
      completedSetEvidence: [setEvidence(1, 12, 6), setEvidence(2, 12, 6)],
      completedDayNumbers: [1],
      evidenceHash: 'strong-1',
      consumedLogIds: reverted.program.performanceFeedbackAppliedLogIds,
      incomingLogIds: ['log-strong'],
      nowIso: '2026-10-18T12:07:00.000Z',
    })
    assert.equal(daySets(afterRevert.program, 2), 3)
    assert.equal(futureStamp(afterRevert.program)?.status, 'reverted_by_athlete')
  })
})

describe('persisted future session adjustment', () => {
  it('saves the next session, survives reopen, and keeps completed history', () => {
    const active = program()
    const logs = [{
      id: 'log-strong',
      createdAt: '2026-10-18T12:00:00.000Z',
      sessionDate: '2026-10-18',
      trusted: true,
      generatedWorkoutId: 'prog-1_session_day-1',
      completedSetEvidence: [setEvidence(1, 12, 6), setEvidence(2, 12, 6)],
    }]
    const history = JSON.stringify(logs)
    const first = applyLoggedPerformanceFeedback(active, logs, { nowIso: '2026-10-18T12:05:00.000Z' })
    assert.equal(first.changed, true)
    const saved = first.program
    assert.equal(daySets(saved, 2), 4)
    assert.equal(daySets(saved, 1), 3)
    assert.equal(JSON.stringify(logs), history)

    const reopened = applyLoggedPerformanceFeedback(saved, logs, { nowIso: '2026-10-18T12:06:00.000Z' })
    assert.equal(reopened.changed, false)
    assert.equal(daySets(reopened.program, 2), 4)
    assert.equal(daySets(reopened.program, 1), 3)

    const reverted = revertPerformanceAdaptation(saved, { dayNumber: 2, exerciseId: 'push-1' })
    const afterRevert = applyLoggedPerformanceFeedback(reverted.program, logs, {
      nowIso: '2026-10-18T12:07:00.000Z',
    })
    assert.equal(daySets(afterRevert.program, 2), 3)
    assert.equal(futureStamp(afterRevert.program)?.status, 'reverted_by_athlete')
    assert.equal(JSON.stringify(logs), history)

    const persistence = readFileSync('lib/program/performance-feedback-persistence.ts', 'utf8')
    const workoutLog = readFileSync('lib/workout-log-service.ts', 'utf8')
    const programPage = readFileSync('app/(app)/program/page.tsx', 'utf8')
    assert.match(persistence, /saveAdaptiveProgram\(result\.program/)
    assert.match(persistence, /getLatestAdaptiveProgram\(\)/)
    assert.match(workoutLog, /persistActiveProgramPerformanceFeedback\(\)/)
    assert.match(programPage, /saveAdaptiveProgram\(result\.program/)

    const withoutIdList = {
      ...saved,
      performanceFeedbackAppliedLogIds: undefined,
    }
    const seeded = applyLoggedPerformanceFeedback(withoutIdList, logs, {
      nowIso: '2026-10-18T12:08:00.000Z',
    })
    assert.equal(daySets(seeded.program, 2), 4)
    assert.equal(daySets(seeded.program, 1), 3)
  })
})
