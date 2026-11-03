import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { durationFieldDisplay, goalFieldDisplay } from './builder-field-display.ts'

const labels = {
  front_lever: 'Front Lever',
  general: 'General Fitness',
}

describe('builder field display', () => {
  it('shows a listed goal and a saved goal outside the list', () => {
    assert.deepEqual(goalFieldDisplay('front_lever', labels), {
      mode: 'option',
      value: 'front_lever',
      label: 'Front Lever',
    })
    assert.deepEqual(goalFieldDisplay('general_strength', labels), {
      mode: 'saved',
      value: 'general_strength',
      label: 'general_strength',
    })
  })

  it('shows Not saved when a goal or duration is absent', () => {
    assert.equal(goalFieldDisplay('', labels).label, 'Not saved')
    assert.equal(goalFieldDisplay(null, labels).mode, 'missing')
    assert.equal(durationFieldDisplay(null).label, 'Not saved')
    assert.equal(durationFieldDisplay(undefined).mode, 'missing')
    assert.equal(durationFieldDisplay('null').mode, 'missing')
  })

  it('keeps a saved duration that is outside the builder options', () => {
    assert.deepEqual(durationFieldDisplay(45), {
      mode: 'option',
      value: '45',
      label: '45 min',
    })
    assert.deepEqual(durationFieldDisplay(20), {
      mode: 'saved',
      value: '20',
      label: '20 min',
    })
    assert.deepEqual(durationFieldDisplay('flexible'), {
      mode: 'saved',
      value: 'flexible',
      label: 'flexible',
    })

    const form = readFileSync(new URL('../../components/programs/AdaptiveProgramForm.tsx', import.meta.url), 'utf8')
    assert.match(form, /goalFieldDisplay\(inputs\.primaryGoal, GOAL_LABELS\)/)
    assert.match(form, /durationFieldDisplay\(inputs\.sessionLength\)/)
    assert.match(form, /placeholder="Not saved"/)
  })
})
