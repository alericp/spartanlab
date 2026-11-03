import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  dashboardEmptyPresence,
  shouldSkipCompletedGeneration,
  trialProgramSentence,
  welcomeProgramCopy,
} from './program-presence-copy.ts'

describe('program presence copy', () => {
  it('does not claim a program is ready when none is usable', () => {
    const fresh = dashboardEmptyPresence(false, false)
    const savedAnswers = dashboardEmptyPresence(false, true)
    const welcome = welcomeProgramCopy(false, true)

    assert.equal(fresh.claimsProgramReady, false)
    assert.equal(savedAnswers.claimsProgramReady, false)
    assert.equal(welcome.claimsProgramReady, false)
    assert.equal(fresh.primaryHref, '/onboarding')
    assert.equal(savedAnswers.primaryHref, '/onboarding/complete')
    assert.equal(welcome.primaryHref, '/onboarding/complete')
    assert.doesNotMatch(`${fresh.title} ${fresh.body}`, /ready/i)
    assert.doesNotMatch(`${savedAnswers.title} ${savedAnswers.body}`, /ready/i)
    assert.doesNotMatch(`${welcome.title} ${welcome.body}`, /ready/i)
    assert.equal(trialProgramSentence(false), 'Your program has not been created yet.')
  })

  it('claims a program is ready only when a usable program is confirmed', () => {
    const dashboard = dashboardEmptyPresence(true, true)
    const welcome = welcomeProgramCopy(true, true)

    assert.equal(dashboard.claimsProgramReady, true)
    assert.equal(welcome.claimsProgramReady, true)
    assert.match(dashboard.body, /personalized training program is ready/)
    assert.match(welcome.title, /Your Adaptive Program is Ready/)
    assert.equal(dashboard.primaryHref, '/first-session')
    assert.equal(welcome.primaryHref, '/first-session')
    assert.equal(trialProgramSentence(true), 'Your training program is now fully personalized.')
  })

  it('wires the dashboard surfaces to program state before a ready claim', () => {
    const emptyState = readFileSync(new URL('../../components/shared/EmptyStates.tsx', import.meta.url), 'utf8')
    const banner = readFileSync(new URL('../../components/dashboard/WelcomeBanner.tsx', import.meta.url), 'utf8')

    assert.match(emptyState, /getProgramState\(\)\.hasUsableWorkoutProgram === true/)
    assert.match(emptyState, /dashboardEmptyPresence\(hasUsableWorkoutProgram, onboardingComplete\)/)
    assert.match(banner, /getProgramState\(\)\.hasUsableWorkoutProgram === true/)
    assert.match(banner, /welcomeProgramCopy\(hasUsableProgram, profile\?\.onboardingComplete === true\)/)
    assert.match(banner, /trialProgramSentence\(hasUsableProgram\)/)
    assert.match(banner, /!mounted \|\| !isWelcome \|\| isDismissed \|\| !programChecked/)
    assert.match(banner, /hasUsableProgram &&/)
    const dashboard = readFileSync(new URL('../../components/dashboard/DashboardFullContent.tsx', import.meta.url), 'utf8')
    assert.match(dashboard, /isWelcomeFlow \? true : hasData/)
    assert.match(emptyState, /if \(!presence\)/)
  })

  it('routes a missing program by onboarding completion', () => {
    const fresh = dashboardEmptyPresence(false, false)
    const saved = dashboardEmptyPresence(false, true)
    assert.equal(fresh.primaryLabel, 'Start Setup')
    assert.equal(fresh.primaryHref, '/onboarding')
    assert.equal(saved.primaryLabel, 'Generate Program')
    assert.equal(saved.primaryHref, '/onboarding/complete')

    const next = readFileSync(new URL('../../components/dashboard/NextWorkoutCard.tsx', import.meta.url), 'utf8')
    const snapshot = readFileSync(new URL('../../components/dashboard/ProgramSnapshotCard.tsx', import.meta.url), 'utf8')
    const today = readFileSync(new URL('../../components/dashboard/TodayAdjustmentWidget.tsx', import.meta.url), 'utf8')
    for (const source of [next, snapshot, today]) {
      assert.match(source, /dashboardEmptyPresence\(false, isOnboardingComplete\(\)\)/)
    }
  })

  it('skips a recent generation only while a usable program exists', () => {
    assert.equal(shouldSkipCompletedGeneration({
      completed: true,
      elapsedMs: 1000,
      hasUsableWorkoutProgram: true,
    }), true)
    assert.equal(shouldSkipCompletedGeneration({
      completed: true,
      elapsedMs: 1000,
      hasUsableWorkoutProgram: false,
    }), false)
    assert.equal(shouldSkipCompletedGeneration({
      completed: false,
      elapsedMs: 1000,
      hasUsableWorkoutProgram: true,
    }), false)
    assert.equal(shouldSkipCompletedGeneration({
      completed: true,
      elapsedMs: 5 * 60 * 1000,
      hasUsableWorkoutProgram: true,
    }), false)

    const complete = readFileSync(new URL('../../components/onboarding/OnboardingCompleteClient.tsx', import.meta.url), 'utf8')
    const guard = complete.indexOf('shouldSkipCompletedGeneration({')
    const ready = complete.indexOf("setStep('ready')", guard)
    assert.ok(guard > 0)
    assert.ok(ready > guard)
    assert.match(complete, /generationAttemptedRef\.current/)
  })

  it('routes program deletion through the active-key record', () => {
    const builder = readFileSync(new URL('../adaptive-program-builder.ts', import.meta.url), 'utf8')
    assert.match(builder, /return deleteStoredAdaptiveProgram\(id\)/)
    assert.match(builder, /selectStoredProgram\(activeRecord, selectablePrograms\)/)
  })
})
