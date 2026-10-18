import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  bucketExplicitMinutes,
  classifyEquipment,
  classifySessionDuration,
  classifyTrainingDays,
} from './input-reliability.ts'

describe('flexible weekly availability', () => {
  it('keeps flexible availability from becoming four days', () => {
    const fromToken = classifyTrainingDays({ days: 'flexible' })
    assert.equal(fromToken.kind, 'flexible')
    assert.equal(fromToken.days, null)
    assert.equal(fromToken.scheduleMode, 'flexible')

    const storedBesideMode = classifyTrainingDays({ days: 4, scheduleMode: 'flexible' })
    assert.equal(storedBesideMode.kind, 'flexible')
    assert.equal(storedBesideMode.days, null)
  })
})

describe('explicit training days', () => {
  it('keeps a selected day count', () => {
    const selected = classifyTrainingDays({ days: 6, scheduleMode: 'static' })
    assert.equal(selected.kind, 'explicit')
    assert.equal(selected.days, 6)
    assert.equal(selected.scheduleMode, 'static')

    const implicit = classifyTrainingDays({ days: '3' })
    assert.equal(implicit.kind, 'explicit')
    assert.equal(implicit.days, 3)
  })
})

describe('unknown session duration', () => {
  it('does not turn a missing duration into 45 or 60 minutes', () => {
    for (const minutes of [null, undefined, 0, '']) {
      const selection = classifySessionDuration({ minutes })
      assert.equal(selection.kind, 'unknown')
      assert.equal(selection.minutes, null)
      assert.equal(selection.durationMode, null)
    }
  })

  it('keeps an adaptive duration distinct from an explicit 45 minute session', () => {
    const adaptive = classifySessionDuration({ minutes: 'flexible' })
    assert.equal(adaptive.kind, 'flexible')
    assert.equal(adaptive.minutes, null)
    assert.equal(adaptive.durationMode, 'adaptive')

    const explicit = classifySessionDuration({ minutes: 45, durationMode: 'static' })
    assert.equal(explicit.kind, 'explicit')
    assert.equal(explicit.minutes, 45)
    assert.equal(bucketExplicitMinutes(45), 45)
    assert.equal(bucketExplicitMinutes(75), 90)
  })
})

describe('equipment selections', () => {
  it('leaves unspecified equipment empty', () => {
    assert.deepEqual(classifyEquipment(undefined), { kind: 'unknown', equipment: [] })
    assert.deepEqual(classifyEquipment([]), { kind: 'unknown', equipment: [] })
    assert.deepEqual(classifyEquipment(null), { kind: 'unknown', equipment: [] })
  })

  it('keeps minimal equipment and a fully equipped list', () => {
    assert.deepEqual(classifyEquipment(['floor']), { kind: 'explicit', equipment: ['floor'] })
    const full = ['pullup_bar', 'dip_bars', 'rings', 'weights', 'bench_box']
    assert.deepEqual(classifyEquipment(full), { kind: 'explicit', equipment: full })
  })
})

describe('existing athlete with saved profile data', () => {
  it('keeps an explicit saved day count, duration, and equipment list', () => {
    const savedDays = classifyTrainingDays({ days: 4, scheduleMode: 'static' })
    assert.equal(savedDays.kind, 'explicit')
    assert.equal(savedDays.days, 4)

    const savedDuration = classifySessionDuration({ minutes: 45, durationMode: 'static' })
    assert.equal(savedDuration.kind, 'explicit')
    assert.equal(savedDuration.minutes, 45)

    const savedEquipment = classifyEquipment(['floor', 'rings'])
    assert.deepEqual(savedEquipment.equipment, ['floor', 'rings'])
  })
})

describe('refresh and resume', () => {
  it('maps a saved flexible schedule and adaptive duration back to the onboarding form', () => {
    const onboarding = readFileSync('components/onboarding/AthleteOnboarding.tsx', 'utf8')
    assert.match(onboarding, /effectiveScheduleMode === 'flexible'/)
    assert.match(onboarding, /reconciled\.trainingDaysPerWeek = 'flexible'/)
    assert.match(onboarding, /reconciled\.sessionLengthMinutes = 'flexible'/)
  })
})

describe('existing profile wiring', () => {
  it('does not coerce flexible days, missing minutes, or empty equipment in the profile writers', () => {
    const onboarding = readFileSync('components/onboarding/AthleteOnboarding.tsx', 'utf8')
    assert.equal(onboarding.includes('? 4'), false)
    assert.equal(onboarding.includes(': 60,'), false)
    assert.match(onboarding, /classifyTrainingDays/)
    assert.match(onboarding, /classifySessionDuration/)

    const canonical = readFileSync('lib/canonical-profile-service.ts', 'utf8')
    assert.match(canonical, /classifySessionDuration/)
    assert.doesNotMatch(canonical, /const raw = onb \?\? ath \?\? 45/)
    assert.doesNotMatch(canonical, /resolvedTrainingDays = 4/)
    assert.doesNotMatch(canonical, /resolvedEquipment\.push\('pull_bar', 'dip_bars'\)/)
    assert.doesNotMatch(canonical, /trainingDaysPerWeek: 4/)
    assert.doesNotMatch(canonical, /sessionLengthMinutes: 60/)

    const materiality = readFileSync('lib/canonical-materiality-contract.ts', 'utf8')
    assert.doesNotMatch(materiality, /equipmentAvailable: profile\.equipmentAvailable \|\| \['floor'\]/)
    assert.doesNotMatch(materiality, /sessionDurationMinutes: profile\.sessionLengthMinutes \|\| 60/)

    const setup = readFileSync('components/onboarding/TrainingSetup.tsx', 'utf8')
    assert.doesNotMatch(setup, /sessionDurationMode === 'adaptive' && !formData\.sessionLengthMinutes\s*\?\s*45/)

    const summary = readFileSync('lib/onboarding-service.ts', 'utf8')
    assert.doesNotMatch(summary, /trainingDaysPerWeek = 4/)
    assert.doesNotMatch(summary, /sessionLengthMinutes = 45/)
    assert.doesNotMatch(summary, /\['floor'\]/)

    const sync = readFileSync('lib/profile-sync-service.ts', 'utf8')
    assert.match(sync, /classifyTrainingDays/)
    assert.doesNotMatch(sync, /: 4,/)
    assert.doesNotMatch(sync, /: 60,/)

    const builder = readFileSync('lib/adaptive-program-builder.ts', 'utf8')
    assert.doesNotMatch(builder, /mappedEquipment\.push\('pull_bar', 'dip_bars'\)/)
    assert.doesNotMatch(builder, /: 4 {2}\/\/ Only for truly new users/)
    assert.doesNotMatch(setup, /sessionLengthMinutes: prev\.sessionLengthMinutes \|\| 45/)
  })
})
