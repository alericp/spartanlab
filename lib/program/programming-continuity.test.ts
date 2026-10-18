import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  applyIdempotentPerformanceFeedback,
  revertPerformanceAdaptation,
  type CompletedSetEvidence,
  type PhaseLProgramShape,
} from './performance-feedback-adaptation-contract.ts'
import { scaleExerciseForWeek } from '../week-dosage-scaling.ts'

function scaledDisplay(sets: number, scaledSets: number, originalSets: number) {
  return {
    id: 'push-1',
    name: 'Push-ups',
    sets,
    repsOrTime: '8-12',
    targetRPE: 8,
    restSeconds: 90,
    scaledSets,
    originalSets,
    weekScalingApplied: true,
  }
}

function programWith(exercise: ReturnType<typeof scaledDisplay>): PhaseLProgramShape {
  return {
    id: 'prog-1',
    sessions: [
      { dayNumber: 1, dayLabel: 'Day 1', exercises: [{ ...exercise, weekScalingApplied: false }] },
      { dayNumber: 2, dayLabel: 'Day 2', exercises: [exercise] },
    ],
  }
}

function strongEvidence(): CompletedSetEvidence[] {
  return [1, 2].map((setNumber) => ({
    exerciseName: 'Push-ups',
    exerciseId: 'push-1',
    setNumber,
    prescribedReps: 8,
    actualReps: 12,
    prescribedRPE: 8,
    actualRPE: 6,
    exerciseClass: 'bodyweight_strength' as const,
    trusted: true,
    completed: true,
    timestamp: '2026-10-18T12:00:00.000Z',
  }))
}

describe('programming continuity', () => {
  it('scales a saved base once and does not scale a saved display dose again', () => {
    const base = {
      id: 'push-1',
      name: 'Push-ups',
      sets: 3,
      repsOrTime: '8-12',
      targetRPE: 8,
      restSeconds: 90,
    }
    const week3 = scaleExerciseForWeek(base, 3)
    assert.equal(base.sets, 3)
    assert.equal(week3.originalSets, 3)
    assert.equal(week3.scaledSets, 6)
    assert.equal(week3.sets, 3)

    const savedDisplay = {
      ...week3,
      sets: week3.scaledSets,
    }
    const scaledAgain = scaleExerciseForWeek(savedDisplay, 3)
    assert.equal(scaledAgain.originalSets, 3)
    assert.equal(scaledAgain.scaledSets, 6)
    assert.notEqual(scaledAgain.scaledSets, 12)
  })

  it('adjusts the unscaled base, then later-week scaling multiplies that base once', () => {
    const completed = {
      id: 'push-1',
      name: 'Push-ups',
      sets: 3,
      repsOrTime: '8-12',
      targetRPE: 8,
      restSeconds: 90,
    }
    const future = scaledDisplay(6, 6, 3)
    const current = programWith(future)
    current.sessions?.[0]?.exercises?.splice(0, 1, completed)
    const beforeHistory = JSON.stringify(current.sessions?.[0]?.exercises?.[0])
    const adjusted = applyIdempotentPerformanceFeedback(current, {
      completedSetEvidence: strongEvidence(),
      completedDayNumbers: [1],
      evidenceHash: 'continuity-strong',
      incomingLogIds: ['log-1'],
      nowIso: '2026-10-18T12:05:00.000Z',
    })
    const futureExercise = adjusted.program.sessions?.[1]?.exercises?.[0]
    assert.equal(futureExercise?.sets, 4)
    assert.equal(futureExercise?.scaledSets, undefined)
    assert.equal(futureExercise?.weekScalingApplied, undefined)
    assert.match(futureExercise?.performanceAdaptation?.userVisibleExplanation ?? '', /3 → 4 sets/)
    assert.equal(JSON.stringify(adjusted.program.sessions?.[0]?.exercises?.[0]), beforeHistory)

    const week3 = scaleExerciseForWeek(futureExercise ?? future, 3)
    assert.equal(week3.sets, 4)
    assert.equal(week3.originalSets, 4)
    assert.equal(week3.scaledSets, 6)

    const nextWorkout = applyIdempotentPerformanceFeedback(adjusted.program, {
      completedSetEvidence: strongEvidence(),
      completedDayNumbers: [1],
      evidenceHash: 'continuity-strong-2',
      consumedLogIds: adjusted.program.performanceFeedbackAppliedLogIds,
      incomingLogIds: ['log-2'],
      nowIso: '2026-10-18T13:00:00.000Z',
    })
    assert.equal(nextWorkout.program.sessions?.[1]?.exercises?.[0]?.sets, 5)
    assert.equal(nextWorkout.program.sessions?.[0]?.exercises?.[0]?.sets, 3)

    const reverted = revertPerformanceAdaptation(adjusted.program, { dayNumber: 2, exerciseId: 'push-1' })
    const restored = reverted.program.sessions?.[1]?.exercises?.[0]
    assert.equal(restored?.sets, 3)
    assert.equal(restored?.scaledSets, undefined)
    assert.equal(restored?.performanceAdaptation?.status, 'reverted_by_athlete')
    const rescaled = scaleExerciseForWeek(restored ?? future, 3)
    assert.equal(rescaled.originalSets, 3)
    assert.equal(rescaled.scaledSets, 6)
  })

  it('keeps the disabled deload writers disabled', () => {
    const phase13 = readFileSync('lib/active-week-mutation-service.ts', 'utf8')
    const master = readFileSync('lib/program/future-session-adaptive-mutation-proposal.ts', 'utf8')
    const recovery = readFileSync('lib/program/recovery-program-awareness-bridge.ts', 'utf8')
    assert.match(phase13, /LEGACY_PHASE13_AUTO_MUTATION_ENABLED = false/)
    assert.match(master, /realMutationEnabled: false/)
    assert.match(master, /applyAllowedNow: false/)
    assert.match(recovery, /automaticDeloadApplied: false/)
  })
})
