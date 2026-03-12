'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Trash2, Clock, Dumbbell } from 'lucide-react'
import {
  type WorkoutLog,
  SESSION_TYPE_LABELS,
  FOCUS_AREA_LABELS,
  deleteWorkoutLog,
} from '@/lib/workout-log-service'
import { formatWorkoutDate } from '@/lib/workout-analytics'

interface RecentWorkoutsListProps {
  workouts: WorkoutLog[]
  onDelete: (id: string) => void
}

export function RecentWorkoutsList({ workouts, onDelete }: RecentWorkoutsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      deleteWorkoutLog(id)
      onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (workouts.length === 0) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1A1A1A] flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-[#4A4A4A]" />
        </div>
        <p className="text-[#A5A5A5]">No workouts logged yet</p>
        <p className="text-sm text-[#4A4A4A] mt-1">
          Start your first session to build training history
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => {
        const isExpanded = expandedId === workout.id
        const isDeleting = deletingId === workout.id

        return (
          <Card
            key={workout.id}
            className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden"
          >
            {/* Header - always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : workout.id)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-[#323232] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium truncate">{workout.sessionName}</h4>
                  <span className="text-xs px-2 py-0.5 bg-[#1A1A1A] rounded text-[#A5A5A5]">
                    {SESSION_TYPE_LABELS[workout.sessionType]}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#A5A5A5]">
                  <span>{formatWorkoutDate(workout.sessionDate)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {workout.durationMinutes}m
                  </span>
                  <span>{workout.exercises.length} exercises</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs px-2 py-1 bg-[#E63946]/10 text-[#E63946] rounded">
                  {FOCUS_AREA_LABELS[workout.focusArea]}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#A5A5A5]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#A5A5A5]" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-[#3A3A3A] p-4 bg-[#1A1A1A]">
                {/* Exercise list */}
                <div className="space-y-2 mb-4">
                  {workout.exercises.map((exercise, index) => (
                    <div
                      key={exercise.id || index}
                      className="flex items-center justify-between py-2 px-3 bg-[#2A2A2A] rounded"
                    >
                      <span className="font-medium text-sm">{exercise.name}</span>
                      <div className="flex items-center gap-3 text-sm text-[#A5A5A5]">
                        <span>{exercise.sets} sets</span>
                        {exercise.reps && <span>{exercise.reps} reps</span>}
                        {exercise.load && <span>+{exercise.load}lbs</span>}
                        {exercise.holdSeconds && <span>{exercise.holdSeconds}s</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes if present */}
                {workout.notes && (
                  <div className="mb-4 p-3 bg-[#2A2A2A] rounded">
                    <p className="text-xs text-[#A5A5A5] mb-1">Notes</p>
                    <p className="text-sm">{workout.notes}</p>
                  </div>
                )}

                {/* Delete action */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(workout.id)}
                    disabled={isDeleting}
                    className="text-[#A5A5A5] hover:text-[#E63946] hover:bg-[#E63946]/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
