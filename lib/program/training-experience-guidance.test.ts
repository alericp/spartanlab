import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { recoveryDecisionExplanation } from '../server/server-fatigue-from-logs.ts'
import {
  PERSONAL_READINESS_BOUNDARY,
  COMPLETIONS_UNAVAILABLE_EXPLANATION,
  buildCurrentSessionHandoff,
  describeTodayAdjustmentTransfer,
  resolveSavedProgramGuidance,
  shouldInferMissedSessions,
} from './training-experience-guidance.ts'

describe('saved program guidance', () => {
  it('shows a recovered plan and the saved frequency', () => {
    const guidanceText = recoveryDecisionExplanation('TRAIN_AS_PLANNED')
    const guidance = resolveSavedProgramGuidance({
      trainingDaysPerWeek: 4,
      fatigueDecision: { decision: 'TRAIN_AS_PLANNED', guidance: guidanceText ?? '' },
    })
    assert.equal(guidance.headline, 'Program guidance: train as planned')
    assert.equal(guidance.explanation, guidanceText)
    assert.equal(guidance.savedScheduleLabel, 'Saved schedule: 4 days per week.')
  })

  it('keeps a fatigued explanation without changing the saved frequency', () => {
    const guidanceText = recoveryDecisionExplanation('LIGHTEN_SESSION')
    const guidance = resolveSavedProgramGuidance({
      trainingDaysPerWeek: 4,
      fatigueDecision: { decision: 'LIGHTEN_SESSION', guidance: guidanceText ?? '' },
    })
    assert.equal(guidance.headline, 'Program guidance: lighter sessions')
    assert.equal(guidance.explanation, guidanceText)
    assert.match(guidance.explanation, /saved weekly schedule is unchanged/i)
    assert.equal(guidance.savedScheduleLabel, 'Saved schedule: 4 days per week.')
  })

  it('does not invent guidance when recovery was not saved', () => {
    const guidance = resolveSavedProgramGuidance({ trainingDaysPerWeek: 3, fatigueDecision: null })
    assert.equal(guidance.headline, 'Program guidance')
    assert.match(guidance.explanation, /No recovery adjustment is saved/)
    assert.doesNotMatch(guidance.explanation, /moderate|deload week/i)
  })

  it('labels a flexible schedule and a missing program', () => {
    assert.equal(
      resolveSavedProgramGuidance({ trainingDaysPerWeek: 'flexible' }).savedScheduleLabel,
      'Saved schedule: flexible.',
    )
    assert.equal(
      resolveSavedProgramGuidance(null).savedScheduleLabel,
      'Saved schedule was not recorded on this program.',
    )
    assert.equal(
      resolveSavedProgramGuidance({ trainingDaysPerWeek: null }).savedScheduleLabel,
      'Saved schedule was not recorded on this program.',
    )
  })

  it('keeps the personal-check boundary separate from program guidance', () => {
    assert.match(PERSONAL_READINESS_BOUNDARY, /personal check/i)
    assert.match(PERSONAL_READINESS_BOUNDARY, /does not change your saved weekly schedule/i)
    assert.match(PERSONAL_READINESS_BOUNDARY, /deload week/i)
  })
})

describe('completion and session override', () => {
  it('does not infer misses from a missing completion record', () => {
    assert.equal(shouldInferMissedSessions(null), false)
    assert.equal(shouldInferMissedSessions([]), true)
    assert.match(COMPLETIONS_UNAVAILABLE_EXPLANATION, /not inferred/)
    assert.match(COMPLETIONS_UNAVAILABLE_EXPLANATION, /saved schedule is unchanged/i)
  })

  it('transfers set reductions for this session and leaves removed exercises on the saved session', () => {
    const transfer = describeTodayAdjustmentTransfer({
      wasAdjusted: true,
      original: [
        { id: 'a', name: 'Pull-up', sets: 4 },
        { id: 'b', name: 'Row', sets: 3 },
      ],
      adjusted: [
        { id: 'a', name: 'Pull-up', sets: 3 },
        { id: 'b', name: 'Row', sets: 3 },
      ],
    })
    assert.equal(transfer.transferable, true)
    assert.equal(transfer.exerciseAdjustments.length, 1)
    assert.equal(transfer.exerciseAdjustments[0]?.changes[0]?.after, 3)
    const handoff = buildCurrentSessionHandoff(transfer, '2026-10-18T00:00:00.000Z')
    assert.equal(handoff?.scope, 'current-session-only')
    assert.equal(handoff?.previewId, 'today-session-preview')
    assert.match(transfer.explanation, /saved weekly schedule stays as written/i)

    const shortened = describeTodayAdjustmentTransfer({
      wasAdjusted: true,
      original: [
        { id: 'a', name: 'Pull-up', sets: 4 },
        { id: 'b', name: 'Curl', sets: 3 },
      ],
      adjusted: [{ id: 'a', name: 'Pull-up', sets: 3 }],
    })
    assert.equal(shortened.transferable, false)
    assert.deepEqual(shortened.exerciseAdjustments, [])
    assert.deepEqual(shortened.removedExerciseNames, ['Curl'])
    assert.equal(buildCurrentSessionHandoff(shortened, '2026-10-18T00:00:00.000Z'), null)
    assert.match(shortened.explanation, /keeps every saved exercise/i)
  })

  it('does not transfer a set increase', () => {
    const transfer = describeTodayAdjustmentTransfer({
      wasAdjusted: true,
      original: [{ id: 'a', name: 'Pull-up', sets: 3 }],
      adjusted: [{ id: 'a', name: 'Pull-up', sets: 5 }],
    })
    assert.equal(transfer.transferable, false)
    assert.equal(buildCurrentSessionHandoff(transfer, '2026-10-18T00:00:00.000Z'), null)
  })
})

describe('experience surfaces', () => {
  it('keeps Today, week, dashboard, program, and workout start on the saved decision', () => {
    const today = readFileSync(new URL('../../app/(app)/today/page.tsx', import.meta.url), 'utf8')
    const week = readFileSync(new URL('../../app/(app)/week/page.tsx', import.meta.url), 'utf8')
    const readiness = readFileSync(
      new URL('../../components/dashboard/DailyReadinessCard.tsx', import.meta.url),
      'utf8',
    )
    const recovery = readFileSync(
      new URL('../../components/dashboard/RecoveryStatusCard.tsx', import.meta.url),
      'utf8',
    )
    const program = readFileSync(new URL('../../app/(app)/program/page.tsx', import.meta.url), 'utf8')
    const workout = readFileSync(
      new URL('../../app/(app)/workout/session/page.tsx', import.meta.url),
      'utf8',
    )

    assert.match(today, /resolveSavedProgramGuidance/)
    assert.match(today, /PERSONAL_READINESS_BOUNDARY/)
    assert.match(today, /Not prescribed/)
    assert.match(today, /equipmentBlocked/)
    assert.doesNotMatch(today, /getQuickWeekStatus\(program, \[\]\)/)
    assert.match(week, /shouldInferMissedSessions/)
    assert.match(week, /COMPLETIONS_UNAVAILABLE_EXPLANATION/)
    assert.doesNotMatch(week, /const completed: string\[\] = \[\]/)
    assert.match(readiness, /was not available and was not used to change your plan/)
    assert.match(readiness, /PERSONAL_READINESS_BOUNDARY/)
    assert.match(recovery, /PERSONAL_READINESS_BOUNDARY/)
    assert.match(program, /resolveSavedProgramGuidance/)
    assert.match(workout, /Saved week unchanged/)
  })
})
