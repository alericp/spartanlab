'use client'

import { Card } from '@/components/ui/card'
import { type DayTemplate } from '@/lib/program-templates'

interface ProgramDayCardProps {
  day: DayTemplate
}

export function ProgramDayCard({ day }: ProgramDayCardProps) {
  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <div className="space-y-4">
        {/* Day Header */}
        <div className="border-b border-[#3A3A3A] pb-3">
          <h4 className="text-lg font-bold">{day.dayLabel}</h4>
          <p className="text-sm text-[#E63946]">{day.emphasis}</p>
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          {day.exercises.map((exercise, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between py-2 border-b border-[#1A1A1A] last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium">{exercise.name}</p>
                {exercise.note && (
                  <p className="text-xs text-[#A5A5A5] mt-0.5">{exercise.note}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-[#A5A5A5]">
                  {exercise.sets} x {exercise.repsOrTime}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Exercise Count */}
        <div className="pt-2 text-xs text-[#A5A5A5]">
          {day.exercises.length} exercises
        </div>
      </div>
    </Card>
  )
}
