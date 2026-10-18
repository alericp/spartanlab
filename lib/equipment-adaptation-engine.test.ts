import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getExerciseById } from './adaptive-exercise-pool.ts'
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
    assert.match(result.adaptationNote ?? '', /left unchanged/)
    assert.equal(result.qualityImpact, 'significant')
  })

  it('leaves an exercise unchanged when the athlete already has the equipment', () => {
    const result = adaptExerciseForEquipment(selected('pull_up'), ['pull_bar'] as EquipmentType[])
    assert.equal(result.wasAdapted, false)
    assert.equal(result.adapted.exercise.id, 'pull_up')
    assert.equal(result.qualityImpact, 'none')
  })
})
