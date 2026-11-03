import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { resolveGenerationTruth } from './generation-truth.ts'

describe('saved goals', () => {
  it('keeps a saved goal that the old whitelist dropped', () => {
    for (const goal of ['general_strength', 'handstand', 'back_lever', 'muscle_building', 'work_capacity']) {
      const truth = resolveGenerationTruth({ primaryGoal: goal, secondaryGoal: 'front_lever' })
      assert.equal(truth.primaryGoal, goal)
      assert.equal(truth.secondaryGoal, 'front_lever')
    }
  })

  it('keeps an explicit goal ahead of a stored fallback', () => {
    const truth = resolveGenerationTruth(
      { primaryGoal: 'weighted_pull' },
      { primaryGoal: 'planche' },
    )
    assert.equal(truth.primaryGoal, 'weighted_pull')
  })

  it('uses a stored goal when the request omits one', () => {
    const truth = resolveGenerationTruth({}, { primaryGoal: 'general_strength', secondaryGoal: 'pancake' })
    assert.equal(truth.primaryGoal, 'general_strength')
    assert.equal(truth.secondaryGoal, 'pancake')
  })

  it('leaves a missing goal missing', () => {
    const truth = resolveGenerationTruth({ primaryGoal: '   ' }, { primaryGoal: null })
    assert.equal(truth.primaryGoal, null)
    assert.equal(truth.secondaryGoal, null)
  })
})

describe('schedule, duration, and experience', () => {
  it('keeps flexible availability unknown in day count', () => {
    const truth = resolveGenerationTruth({
      scheduleMode: 'flexible',
      trainingDaysPerWeek: 4,
      sessionDurationMode: null,
      sessionLengthMinutes: null,
      experienceLevel: 'beginner',
    })
    assert.equal(truth.schedule.kind, 'flexible')
    assert.equal(truth.schedule.scheduleMode, 'flexible')
    assert.equal(truth.schedule.days, null)
    assert.equal(truth.duration.kind, 'unknown')
    assert.equal(truth.duration.minutes, null)
    assert.equal(truth.duration.durationMode, null)
    assert.equal(truth.experienceLevel, 'beginner')
  })

  it('keeps an unknown duration and schedule unknown', () => {
    const truth = resolveGenerationTruth({
      scheduleMode: null,
      trainingDaysPerWeek: null,
      sessionDurationMode: null,
      sessionLengthMinutes: null,
      experienceLevel: null,
    })
    assert.equal(truth.schedule.scheduleMode, null)
    assert.equal(truth.schedule.days, null)
    assert.equal(truth.duration.durationMode, null)
    assert.equal(truth.duration.minutes, null)
    assert.equal(truth.experienceLevel, null)
  })

  it('keeps explicit days, duration, and experience', () => {
    const truth = resolveGenerationTruth({
      scheduleMode: 'static',
      trainingDaysPerWeek: 5,
      sessionDurationMode: 'static',
      sessionLengthMinutes: 60,
      experienceLevel: 'advanced',
    })
    assert.equal(truth.schedule.kind, 'explicit')
    assert.equal(truth.schedule.days, 5)
    assert.equal(truth.schedule.scheduleMode, 'static')
    assert.equal(truth.duration.kind, 'explicit')
    assert.equal(truth.duration.minutes, 60)
    assert.equal(truth.duration.durationMode, 'static')
    assert.equal(truth.experienceLevel, 'advanced')
  })

  it('keeps adaptive duration without inventing minutes', () => {
    const truth = resolveGenerationTruth({
      sessionDurationMode: 'adaptive',
      sessionLengthMinutes: null,
    })
    assert.equal(truth.duration.kind, 'flexible')
    assert.equal(truth.duration.durationMode, 'adaptive')
    assert.equal(truth.duration.minutes, null)
  })

  it('keeps a static choice that has no day count or minute count', () => {
    const truth = resolveGenerationTruth({
      scheduleMode: 'static',
      trainingDaysPerWeek: null,
      sessionDurationMode: 'static',
      sessionLengthMinutes: null,
    })
    assert.equal(truth.schedule.scheduleMode, 'static')
    assert.equal(truth.schedule.days, null)
    assert.equal(truth.duration.durationMode, 'static')
    assert.equal(truth.duration.minutes, null)
  })

  it('does not let a missing request replace a saved profile', () => {
    const truth = resolveGenerationTruth(
      {},
      {
        primaryGoal: 'general_strength',
        scheduleMode: 'static',
        trainingDaysPerWeek: 3,
        sessionDurationMode: 'static',
        sessionLengthMinutes: 45,
        experienceLevel: 'intermediate',
      },
    )
    assert.equal(truth.primaryGoal, 'general_strength')
    assert.equal(truth.schedule.days, 3)
    assert.equal(truth.duration.minutes, 45)
    assert.equal(truth.experienceLevel, 'intermediate')
  })
})

describe('generation truth wiring', () => {
  it('stops the confirmed planche whitelist and server fills', () => {
    const builder = readFileSync('lib/adaptive-program-builder.ts', 'utf8')
    const route = readFileSync('app/api/onboarding/generate-first-program/route.ts', 'utf8')
    const rebuild = readFileSync('app/api/program/rebuild-adjustment/route.ts', 'utf8')
    const authoritative = readFileSync('lib/server/authoritative-program-generation.ts', 'utf8')

    assert.match(builder, /resolveGenerationTruth\(/)
    assert.doesNotMatch(builder, /'handstand_pushup', 'weighted_strength'/)
    assert.doesNotMatch(route, /\|\| 'flexible'/)
    assert.doesNotMatch(route, /\|\| 'adaptive'/)
    assert.doesNotMatch(route, /\|\| 'intermediate'/)
    assert.doesNotMatch(route, /\|\| 4/)
    assert.doesNotMatch(route, /\|\| 45/)
    assert.doesNotMatch(rebuild, /\|\| 'flexible'/)
    assert.doesNotMatch(rebuild, /\|\| 'adaptive'/)
    assert.doesNotMatch(rebuild, /\|\| 'intermediate'/)
    assert.doesNotMatch(rebuild, /\?\? 4/)
    assert.doesNotMatch(rebuild, /\?\? 45/)
    assert.doesNotMatch(authoritative, /scheduleMode: builderInputs\.scheduleMode \|\| canonicalProfile\.scheduleMode \|\| 'flexible'/)
    assert.doesNotMatch(authoritative, /sessionLengthMinutes: builderInputs\.sessionLength \?\? canonicalProfile\.sessionLengthMinutes \?\? 45/)
    assert.doesNotMatch(authoritative, /experienceLevel: builderInputs\.experienceLevel \|\| canonicalProfile\.experienceLevel \|\| 'intermediate'/)
    assert.match(authoritative, /experienceLevel: canonicalProfileTyped\.experienceLevel \|\| null/)

    const canonical = readFileSync('lib/canonical-profile-service.ts', 'utf8')
    const programPage = readFileSync('app/(app)/program/page.tsx', 'utf8')
    assert.doesNotMatch(canonical, /resolvedExperienceLevel = 'intermediate'/)
    assert.doesNotMatch(canonical, /builderOverrides\?\.experienceLevel, 'intermediate'/)
    assert.doesNotMatch(programPage, /experienceLevel: effectiveInputs\.experienceLevel \|\| 'intermediate'/)
  })
})
