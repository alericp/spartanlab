import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { getExerciseById, hasRequiredEquipment } from './adaptive-exercise-pool.ts'
import { adaptExerciseForEquipment } from './equipment-adaptation-engine.ts'
import type { EquipmentType, Exercise } from './adaptive-exercise-pool.ts'
import type { SelectedExercise } from './program-exercise-selector.ts'

function selected(id: string): SelectedExercise {
  const exercise = getExerciseById(id)
  assert.ok(exercise, id)
  return {
    exercise: exercise as Exercise,
    sets: exercise?.defaultSets ?? 3,
    repsOrTime: exercise?.defaultRepsOrTime ?? '8-12',
    isOverrideable: true,
    selectionReason: 'test',
  }
}

describe('equipment substitutions from the exercise pool', () => {
  it('replaces ring rows with a bar row when rings are missing and a bar is available', () => {
    const result = adaptExerciseForEquipment(selected('ring_row'), ['pull_bar'] as EquipmentType[], {
      primaryGoal: 'front_lever',
    })
    assert.equal(result.wasAdapted, true)
    assert.equal(result.adapted.exercise.id, 'bodyweight_row')
    assert.equal(result.adapted.exercise.movementPattern, 'horizontal_pull')
    assert.match(result.adaptationNote ?? '', /row/i)
    assert.equal(result.adapted.sets, selected('ring_row').sets)
  })

  it('uses a goal-matching push substitute for dips when dip bars are missing', () => {
    const result = adaptExerciseForEquipment(selected('dip'), ['floor'] as EquipmentType[], {
      primaryGoal: 'planche',
    })
    assert.equal(result.wasAdapted, true)
    assert.equal(result.adapted.exercise.id, 'push_up')
    assert.equal(result.adapted.exercise.movementCategory, 'push')
    assert.ok(result.adapted.exercise.transferTo.includes('planche'))
    assert.notEqual(result.adapted.exercise.movementCategory, 'pull')
  })

  it('does not replace a pull with a push when no appropriate substitute exists', () => {
    const result = adaptExerciseForEquipment(selected('scap_pull_up'), [] as EquipmentType[], {
      primaryGoal: 'front_lever',
    })
    assert.equal(result.wasAdapted, false)
    assert.equal(result.adapted.exercise.id, 'scap_pull_up')
    assert.notEqual(result.adapted.exercise.id, 'scap_pushup')
    assert.match(result.adaptationNote ?? '', /not prescribed/)
    assert.match(result.adapted.equipmentBlocked ?? '', /not prescribed/)
    assert.equal(result.qualityImpact, 'significant')
  })

  it('does not treat a dip belt alone as enough for weighted work', () => {
    const weightedDip = selected('weighted_dip').exercise
    const weightedPull = selected('weighted_pull_up').exercise
    assert.equal(hasRequiredEquipment(weightedDip, ['dip_belt']), false)
    assert.equal(hasRequiredEquipment(weightedPull, ['dip_belt']), false)
    assert.equal(hasRequiredEquipment(weightedDip, ['dip_bars', 'dip_belt']), true)
    assert.equal(hasRequiredEquipment(weightedPull, ['pull_bar']), false)
    assert.equal(hasRequiredEquipment(selected('pull_up').exercise, ['pull_bar']), true)
    assert.equal(hasRequiredEquipment(selected('bodyweight_row').exercise, ['pull_bar']), true)

    const beltOnly = adaptExerciseForEquipment(selected('weighted_pull_up'), ['dip_belt'])
    assert.equal(beltOnly.wasAdapted, false)
    assert.equal(beltOnly.adapted.exercise.id, 'weighted_pull_up')
    assert.match(beltOnly.adapted.equipmentBlocked ?? '', /not prescribed/)
    assert.match(beltOnly.adapted.selectionReason, /not prescribed/)

    const barsOnly = adaptExerciseForEquipment(selected('weighted_dip'), ['dip_bars'])
    assert.equal(barsOnly.wasAdapted, true)
    assert.notEqual(barsOnly.adapted.exercise.id, 'weighted_dip')
    assert.equal(barsOnly.adapted.equipmentBlocked, undefined)
    assert.equal(hasRequiredEquipment(barsOnly.adapted.exercise, ['dip_bars']), true)
  })

  it('shows the limitation on the program card instead of a working dose', () => {
    const card = readFileSync('components/programs/AdaptiveSessionCard.tsx', 'utf8')
    const contract = readFileSync('lib/program/program-display-contract.ts', 'utf8')
    assert.match(card, /equipmentBlocked: exercise\.equipmentBlocked/)
    assert.match(contract, /prescriptionLine: 'Not prescribed'/)
  })

  it('leaves an exercise unchanged when the athlete already has the equipment', () => {
    const result = adaptExerciseForEquipment(selected('pull_up'), ['pull_bar'] as EquipmentType[])
    assert.equal(result.wasAdapted, false)
    assert.equal(result.adapted.exercise.id, 'pull_up')
    assert.equal(result.qualityImpact, 'none')
  })
})
