'use client'

import { interpretWorkoutNote, type WorkoutNoteInput } from '@/lib/workout/notes-interpretation'

export function NoteCoachingInsight(input: WorkoutNoteInput) {
  const reading = interpretWorkoutNote(input)
  if (!reading) return null
  return (
    <p className="text-xs text-[#A4ACB8] leading-relaxed" data-note-certainty={reading.certainty}>
      {reading.insight}
    </p>
  )
}
