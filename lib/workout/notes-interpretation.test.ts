import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { classifyPerformanceSignals } from '../program/performance-feedback-adaptation-contract.ts'
import {
  VOICE_LOGGING_DECISION,
  dedupeWorkoutNoteReadings,
  interpretWorkoutNote,
  noteTextMayInfluenceTraining,
  workoutNoteSummaryLine,
} from './notes-interpretation.ts'

describe('workout note readings', () => {
  it('keeps a clear grip note as the athlete’s words and cites logged reps', () => {
    const input = {
      text: 'Grip gave out on the last rep',
      selectedTags: ['grip_limited'],
      workoutLogId: 'workout-1',
      sessionLabel: 'Pull day',
      exerciseName: 'Pull-ups',
      exerciseIndex: 0,
      setNumber: 3,
      actualReps: 6,
      targetReps: 8,
    }
    const reading = interpretWorkoutNote(input)
    assert.equal(reading?.certainty, 'explicit')
    assert.equal(reading?.altersFutureWorkout, false)
    assert.match(reading?.insight ?? '', /grip limitation/i)
    assert.match(reading?.insight ?? '', /Logged 6 reps/)
    assert.match(reading?.insight ?? '', /Pull-ups, set 3/)
    assert.equal(reading?.attachment.workoutLogId, 'workout-1')
    assert.equal(input.text, 'Grip gave out on the last rep')
    assert.equal(noteTextMayInfluenceTraining(input.text), true)
  })

  it('does not turn ambiguous language into a training change', () => {
    const reading = interpretWorkoutNote({
      text: 'maybe a little pain, not sure',
      exerciseName: 'Dips',
      setNumber: 2,
    })
    assert.equal(reading?.certainty, 'uncertain')
    assert.equal(reading?.altersFutureWorkout, false)
    assert.equal(noteTextMayInfluenceTraining('maybe a little pain, not sure'), false)
    assert.match(reading?.insight ?? '', /does not change a future workout/i)
    assert.match(reading?.insight ?? '', /until this workout is saved/i)
  })

  it('leaves an irrelevant note without a coaching claim', () => {
    const reading = interpretWorkoutNote({ text: 'The gym playlist was good' })
    assert.equal(reading?.certainty, 'not_useful')
    assert.match(reading?.insight ?? '', /No training signal/)
    assert.equal(noteTextMayInfluenceTraining('The gym playlist was good'), false)
  })

  it('returns the same reading for a repeated save and drops the duplicate', () => {
    const input = { text: 'Too hard today', workoutLogId: 'workout-9', exerciseIndex: 1, setNumber: 1 }
    const first = interpretWorkoutNote(input)
    const second = interpretWorkoutNote(input)
    assert.deepEqual(first, second)
    assert.equal(dedupeWorkoutNoteReadings([first!, second!]).length, 1)
    const otherSet = interpretWorkoutNote({ ...input, setNumber: 2 })
    assert.equal(dedupeWorkoutNoteReadings([first!, otherSet!]).length, 2)
  })

  it('says nothing when the note and tags are missing', () => {
    assert.equal(interpretWorkoutNote({ text: '   ', selectedTags: [] }), null)
    assert.equal(noteTextMayInfluenceTraining(null), false)
  })

  it('summarizes a set note without repeating private details', () => {
    const privateNote = 'Email athlete@example.com. Phone 415-555-0199. Diagnosed last year.'
    const line = workoutNoteSummaryLine(privateNote)
    assert.equal(line, 'Private details stay with this set and are not shown here.')
    assert.doesNotMatch(line ?? '', /athlete@example.com/)
    assert.doesNotMatch(line ?? '', /415-555-0199/)
    assert.doesNotMatch(line ?? '', /diagnosed/i)
    assert.equal(workoutNoteSummaryLine('Grip gave out on the last rep'), 'You wrote that grip limited the set.')
    const marked = workoutNoteSummaryLine('Grip gave out SECRETTOKEN')
    assert.doesNotMatch(marked ?? '', /SECRETTOKEN/)
    assert.equal(workoutNoteSummaryLine('   '), null)
  })

  it('does not repeat private details or use them as a measurement', () => {
    const reading = interpretWorkoutNote({
      text: 'Email athlete@example.com. Diagnosed last year. Pain was 7/10.',
      workoutLogId: 'workout-private',
      exerciseName: 'Rows',
      setNumber: 1,
    })
    assert.equal(reading?.containsPrivateDetails, true)
    assert.equal(reading?.quotedStatement, null)
    assert.doesNotMatch(reading?.insight ?? '', /athlete@example.com/)
    assert.doesNotMatch(reading?.insight ?? '', /7\/10/)
    assert.doesNotMatch(reading?.insight ?? '', /diagnosed/i)
    assert.equal(noteTextMayInfluenceTraining('Email athlete@example.com and my wrist hurt'), false)
  })

  it('keeps two workout logs separate', () => {
    const first = interpretWorkoutNote({ text: 'Felt strong', workoutLogId: 'log-a', exerciseName: 'Pull-ups', setNumber: 1 })
    const second = interpretWorkoutNote({ text: 'Felt strong', workoutLogId: 'log-b', exerciseName: 'Dips', setNumber: 1 })
    assert.notEqual(first?.attachment.workoutLogId, second?.attachment.workoutLogId)
    assert.equal(first?.attachment.exerciseName, 'Pull-ups')
    assert.equal(second?.attachment.exerciseName, 'Dips')
  })

  it('lets an explicit pain note reach the existing check and keeps an unclear one out', () => {
    const explicit = classifyPerformanceSignals([
      {
        exerciseName: 'Pull-ups',
        setNumber: 1,
        note: 'Wrist pain on the last rep',
        actualReps: 5,
        prescribedReps: 8,
        trusted: true,
        completed: true,
      },
    ])
    const unclear = classifyPerformanceSignals([
      {
        exerciseName: 'Pull-ups',
        setNumber: 1,
        note: 'maybe a little pain, not sure',
        actualReps: 5,
        prescribedReps: 8,
        trusted: true,
        completed: true,
      },
    ])
    const selected = classifyPerformanceSignals([
      {
        exerciseName: 'Pull-ups',
        setNumber: 1,
        note: 'maybe a little pain, not sure',
        noteFlags: ['pain'],
        actualReps: 5,
        prescribedReps: 8,
        trusted: true,
        completed: true,
      },
    ])
    assert.equal(explicit.some((signal) => signal.signalType === 'note_pain_warning'), true)
    assert.equal(unclear.some((signal) => signal.signalType === 'note_pain_warning'), false)
    assert.equal(selected.some((signal) => signal.signalType === 'note_pain_warning'), true)
  })

  it('does not enable voice capture', () => {
    assert.equal(VOICE_LOGGING_DECISION.implemented, false)
    const corridor = readFileSync(new URL('../../components/workout/ActiveWorkoutStartCorridor.tsx', import.meta.url), 'utf8')
    const session = readFileSync(new URL('../../components/workout/StreamlinedWorkoutSession.tsx', import.meta.url), 'utf8')
    const contract = readFileSync(new URL('../program/performance-feedback-adaptation-contract.ts', import.meta.url), 'utf8')
    const normalizer = readFileSync(new URL('./live-workout-normalizers.ts', import.meta.url), 'utf8')
    assert.match(corridor, /NoteCoachingInsight/)
    assert.doesNotMatch(corridor, /SpeechRecognition|webkitSpeechRecognition/)
    assert.doesNotMatch(session, /SpeechRecognition|webkitSpeechRecognition/)
    assert.match(contract, /noteTextMayInfluenceTraining/)
    assert.match(normalizer, /noteTextMayInfluenceTraining/)
  })
})
