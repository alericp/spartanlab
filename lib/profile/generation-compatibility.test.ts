import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { before, beforeEach, describe, it } from 'node:test'
import { settingsDurationWrite, settingsScheduleWrite } from './input-reliability.ts'

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

type CanonicalModule = typeof import('../canonical-profile-service.ts')
let buildCanonicalGenerationEntry: CanonicalModule['buildCanonicalGenerationEntry']
let validateProfileForGeneration: CanonicalModule['validateProfileForGeneration']
let getCanonicalProfile: CanonicalModule['getCanonicalProfile']

function seed(onboarding: Record<string, unknown> | null, athlete: Record<string, unknown> | null) {
  store.clear()
  if (onboarding) store.set('spartanlab_onboarding_profile', JSON.stringify(onboarding))
  if (athlete) store.set('spartanlab_profile', JSON.stringify(athlete))
}

function completedOnboarding(extra: Record<string, unknown>) {
  return {
    onboardingComplete: true,
    primaryGoal: 'front_lever',
    selectedSkills: ['front_lever'],
    equipment: ['pullup_bar'],
    trainingExperience: 'intermediate',
    ...extra,
  }
}

function savedAthlete(extra: Record<string, unknown>) {
  return {
    id: 'athlete-return',
    userId: 'athlete-return',
    experienceLevel: 'intermediate',
    onboardingComplete: true,
    primaryGoal: 'front_lever',
    selectedSkills: ['front_lever'],
    equipmentAvailable: ['pullup_bar'],
    sex: null,
    ...extra,
  }
}

describe('generation compatibility', () => {
  before(async () => {
    const canonical = await import('../canonical-profile-service.ts')
    buildCanonicalGenerationEntry = canonical.buildCanonicalGenerationEntry
    validateProfileForGeneration = canonical.validateProfileForGeneration
    getCanonicalProfile = canonical.getCanonicalProfile
  })

  beforeEach(() => {
    store.clear()
  })

  it('generates from flexible training days without inventing a weekly count', () => {
    seed(completedOnboarding({
      trainingDaysPerWeek: 'flexible',
      scheduleMode: 'flexible',
      sessionLengthMinutes: 45,
      sessionDurationMode: 'static',
    }), null)

    const profile = getCanonicalProfile()
    const result = buildCanonicalGenerationEntry('flexible-days')

    assert.equal(profile.scheduleMode, 'flexible')
    assert.equal(profile.trainingDaysPerWeek, null)
    assert.equal(result.success, true)
    assert.equal(result.entry?.trainingDaysPerWeek, 'flexible')
    assert.equal(result.entry?.scheduleMode, 'flexible')
    assert.equal(result.entry?.sessionLength, 45)
    assert.equal(result.entry?.sessionDurationMode, 'static')
    assert.equal(validateProfileForGeneration(profile).isValid, true)
  })

  it('generates when workout duration was never specified and does not store a minute count', () => {
    seed(completedOnboarding({
      trainingDaysPerWeek: 'flexible',
      scheduleMode: 'flexible',
      sessionLengthMinutes: null,
    }), {
      ...savedAthlete({}),
      sessionDurationMode: 'static',
      sessionLengthMinutes: null,
      scheduleMode: 'static',
      trainingDaysPerWeek: null,
    })

    const profile = getCanonicalProfile()
    const result = buildCanonicalGenerationEntry('unspecified-duration')

    assert.equal(profile.sessionDurationMode, null)
    assert.equal(profile.sessionLengthMinutes, null)
    assert.equal(result.success, true)
    assert.equal(result.entry?.sessionLength, null)
    assert.equal(result.entry?.sessionDurationMode, null)
    assert.equal(result.entry?.trainingDaysPerWeek, 'flexible')
    assert.equal(store.get('spartanlab_profile')?.includes('"sessionLengthMinutes":60'), false)
  })

  it('asks for a minute count only when a fixed duration was explicitly chosen', () => {
    seed(null, savedAthlete({
      scheduleMode: 'static',
      trainingDaysPerWeek: 4,
      sessionDurationMode: 'static',
      sessionLengthMinutes: null,
    }))

    const result = buildCanonicalGenerationEntry('static-duration-without-minutes')

    assert.equal(result.success, false)
    assert.deepEqual(result.error?.missingFields, ['sessionLength'])
    assert.match(result.error?.message ?? '', /Choose a session duration/)
  })

  it('generates with no equipment selected and does not add floor equipment', () => {
    seed(completedOnboarding({
      equipment: [],
      trainingDaysPerWeek: 4,
      scheduleMode: 'static',
      sessionLengthMinutes: 45,
      sessionDurationMode: 'static',
    }), null)

    const profile = getCanonicalProfile()
    const validation = validateProfileForGeneration(profile)
    const result = buildCanonicalGenerationEntry('no-equipment')

    assert.deepEqual(profile.equipmentAvailable, [])
    assert.equal(validation.isValid, true)
    assert.equal(validation.missingFields.includes('equipmentAvailable'), false)
    assert.match(validation.warnings.join(' '), /No equipment selected/)
    assert.equal(result.success, true)
    assert.deepEqual(result.entry?.equipment, [])
  })

  it('keeps explicit static days and duration', () => {
    seed(completedOnboarding({
      trainingDaysPerWeek: 5,
      scheduleMode: 'static',
      sessionLengthMinutes: 45,
      sessionDurationMode: 'static',
      equipment: ['rings', 'pullup_bar'],
    }), null)

    const result = buildCanonicalGenerationEntry('explicit-static')

    assert.equal(result.success, true)
    assert.equal(result.entry?.scheduleMode, 'static')
    assert.equal(result.entry?.trainingDaysPerWeek, 5)
    assert.equal(result.entry?.sessionDurationMode, 'static')
    assert.equal(result.entry?.sessionLength, 45)
    assert.deepEqual([...(result.entry?.equipment ?? [])].sort(), ['pull_bar', 'rings'])
  })

  it('generates again from a saved athlete profile', () => {
    seed(null, savedAthlete({
      scheduleMode: 'static',
      trainingDaysPerWeek: 4,
      sessionDurationMode: 'static',
      sessionLengthMinutes: 60,
      equipmentAvailable: ['dip_bars'],
    }))

    const explicit = buildCanonicalGenerationEntry('returning-explicit')
    assert.equal(explicit.success, true)
    assert.equal(explicit.entry?.trainingDaysPerWeek, 4)
    assert.equal(explicit.entry?.sessionLength, 60)
    assert.equal(explicit.entry?.scheduleMode, 'static')

    seed(null, savedAthlete({
      scheduleMode: null,
      trainingDaysPerWeek: null,
      sessionDurationMode: null,
      sessionLengthMinutes: null,
      equipmentAvailable: [],
    }))

    const profile = getCanonicalProfile()
    const unspecified = buildCanonicalGenerationEntry('returning-unspecified')
    assert.equal(profile.scheduleMode, 'flexible')
    assert.equal(profile.sessionDurationMode, null)
    assert.equal(profile.trainingDaysPerWeek, null)
    assert.equal(profile.sessionLengthMinutes, null)
    assert.deepEqual(profile.equipmentAvailable, [])
    assert.equal(unspecified.success, true)
    assert.equal(unspecified.entry?.trainingDaysPerWeek, 'flexible')
    assert.equal(unspecified.entry?.sessionLength, null)
    assert.equal(unspecified.entry?.sessionDurationMode, null)
    assert.equal(validateProfileForGeneration(profile).isValid, true)
  })

  it('builds the first-program entry from a completed onboarding profile', () => {
    seed(completedOnboarding({
      onboardingComplete: true,
      trainingDaysPerWeek: 'flexible',
      scheduleMode: 'flexible',
      sessionLengthMinutes: 'flexible',
      sessionDurationMode: 'adaptive',
      equipment: ['parallettes'],
    }), null)

    const result = buildCanonicalGenerationEntry('generateFirstProgram')
    const profile = getCanonicalProfile()

    assert.equal(profile.onboardingComplete, true)
    assert.equal(result.success, true)
    assert.equal(result.entry?.trainingDaysPerWeek, 'flexible')
    assert.equal(result.entry?.sessionDurationMode, 'adaptive')
    assert.equal(result.entry?.sessionLength, null)
    assert.deepEqual(result.entry?.equipment, ['parallettes'])
    assert.equal(validateProfileForGeneration(profile).isValid, true)
  })
})

describe('database mode reads', () => {
  it('does not turn a null schedule or duration mode into static', () => {
    const onboardingRoute = readFileSync('app/api/onboarding/profile/route.ts', 'utf8')
    const settingsRoute = readFileSync('app/api/settings/route.ts', 'utf8')
    for (const source of [onboardingRoute, settingsRoute]) {
      assert.equal(source.includes("COALESCE(schedule_mode, 'static')"), false)
      assert.equal(source.includes("COALESCE(session_duration_mode, 'static')"), false)
    }
    const builder = readFileSync('lib/adaptive-program-builder.ts', 'utf8')
    assert.match(builder, /readSessionDurationMode\(inputs\) === 'static'/)
    assert.doesNotMatch(builder, /readSessionDurationMode\(inputs\) !== 'adaptive'/)
  })
})

describe('settings save of unanswered inputs', () => {
  it('omits an untouched unanswered schedule and duration', () => {
    assert.deepEqual(settingsScheduleWrite({
      loadedMode: null,
      loadedDays: null,
      edited: false,
      formMode: 'static',
      formDays: '',
    }), {})
    assert.deepEqual(settingsDurationWrite({
      loadedMode: null,
      loadedMinutes: null,
      edited: false,
      formMode: 'static',
      formMinutes: '',
    }), {})
  })

  it('writes a schedule or duration the athlete edits', () => {
    assert.deepEqual(settingsScheduleWrite({
      loadedMode: null,
      loadedDays: null,
      edited: true,
      formMode: 'flexible',
      formDays: '',
    }), { scheduleMode: 'flexible', trainingDaysPerWeek: null })
    assert.deepEqual(settingsDurationWrite({
      loadedMode: null,
      loadedMinutes: null,
      edited: true,
      formMode: 'adaptive',
      formMinutes: '',
    }), { sessionDurationMode: 'adaptive', sessionLengthMinutes: null })
  })

  it('keeps an already explicit static choice', () => {
    assert.deepEqual(settingsScheduleWrite({
      loadedMode: 'static',
      loadedDays: 5,
      edited: false,
      formMode: 'static',
      formDays: '5',
    }), { scheduleMode: 'static', trainingDaysPerWeek: 5 })
    assert.deepEqual(settingsDurationWrite({
      loadedMode: 'static',
      loadedMinutes: 45,
      edited: false,
      formMode: 'static',
      formMinutes: '45',
    }), { sessionDurationMode: 'static', sessionLengthMinutes: 45 })
  })
})
