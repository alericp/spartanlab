import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, it } from 'node:test'
import { allowUnboundLegacyLocalStorage, readAthleteItem, writeAthleteItem } from '../athlete-local-scope.ts'
import { getOnboardingProfile } from '../athlete-profile.ts'
import { deleteStoredAdaptiveProgram, readLatestStoredAdaptiveProgram, selectStoredProgram } from './active-program-record.ts'

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

function program(id: string, createdAt: string) {
  return {
    id,
    createdAt,
    sessions: [{ dayNumber: 1, exercises: [{ name: 'Push-up' }] }],
    primaryGoal: 'front_lever',
  }
}

function savePrograms(activeId: string | null, history: ReturnType<typeof program>[]) {
  allowUnboundLegacyLocalStorage()
  if (activeId) {
    const active = history.find((item) => item.id === activeId) ?? program(activeId, '2026-01-01T00:00:00.000Z')
    writeAthleteItem('spartanlab_active_program', JSON.stringify(active))
  }
  writeAthleteItem('spartanlab_adaptive_programs', JSON.stringify(history))
}

describe('active program deletion', () => {
  beforeEach(() => {
    store.clear()
    allowUnboundLegacyLocalStorage()
  })

  it('returns nothing when no program is saved', () => {
    assert.equal(readLatestStoredAdaptiveProgram(), null)
    assert.equal(deleteStoredAdaptiveProgram('missing-program'), false)
  })

  it('returns a valid saved program', () => {
    savePrograms('program-a', [program('program-a', '2026-02-01T00:00:00.000Z')])
    assert.equal(readLatestStoredAdaptiveProgram()?.id, 'program-a')
  })

  it('does not restore a deleted active program from the active key or history', () => {
    const older = program('program-old', '2026-01-01T00:00:00.000Z')
    const current = program('program-current', '2026-03-01T00:00:00.000Z')
    savePrograms('program-current', [older, current])

    assert.equal(deleteStoredAdaptiveProgram('program-current'), true)
    assert.equal(readAthleteItem('spartanlab_active_program'), null)

    const latest = readLatestStoredAdaptiveProgram()
    assert.equal(latest?.id, 'program-old')
    assert.notEqual(latest?.id, 'program-current')
    assert.equal(readAthleteItem('spartanlab_active_program'), null)
    assert.doesNotMatch(readAthleteItem('spartanlab_adaptive_programs') ?? '', /program-current/)
  })

  it('clears the active key when that program is not in history', () => {
    allowUnboundLegacyLocalStorage()
    writeAthleteItem('spartanlab_active_program', JSON.stringify(program('program-only-active', '2026-04-01T00:00:00.000Z')))
    writeAthleteItem('spartanlab_adaptive_programs', JSON.stringify([]))

    assert.equal(deleteStoredAdaptiveProgram('program-only-active'), true)
    assert.equal(readLatestStoredAdaptiveProgram(), null)
    assert.equal(readAthleteItem('spartanlab_active_program'), null)
  })

  it('keeps the completed onboarding profile when a program is deleted', () => {
    savePrograms('program-a', [program('program-a', '2026-02-01T00:00:00.000Z')])
    writeAthleteItem('spartanlab_onboarding_profile', JSON.stringify({
      onboardingComplete: true,
      primaryGoal: 'planche',
      selectedSkills: ['planche'],
    }))

    assert.equal(deleteStoredAdaptiveProgram('program-a'), true)

    const profile = getOnboardingProfile()
    assert.equal(profile?.onboardingComplete, true)
    assert.equal(profile?.primaryGoal, 'planche')
    assert.deepEqual(profile?.selectedSkills, ['planche'])
    assert.match(readAthleteItem('spartanlab_onboarding_profile') ?? '', /planche/)
  })

  it('keeps a different saved program and does not rewrite the deleted id', () => {
    const older = program('program-old', '2026-01-01T00:00:00.000Z')
    const current = program('program-current', '2026-03-01T00:00:00.000Z')
    savePrograms('program-current', [older, current])

    assert.equal(deleteStoredAdaptiveProgram('program-current'), true)
    const selection = selectStoredProgram(null, [older])
    assert.equal(selection.source, 'history_array_sorted')
    assert.equal(selection.program?.id, 'program-old')
    assert.equal(readLatestStoredAdaptiveProgram()?.id, 'program-old')
    assert.equal(readAthleteItem('spartanlab_active_program'), null)

    const builder = readFileSync(new URL('../adaptive-program-builder.ts', import.meta.url), 'utf8')
    const page = readFileSync(new URL('../../app/(app)/program/page.tsx', import.meta.url), 'utf8')
    assert.match(builder, /selectionSource === 'canonical_active_key'/)
    assert.match(page, /programModules\.deleteAdaptiveProgram\(program\.id\)/)
    assert.match(page, /no_current_program/)
  })
})
