'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProgramDayCard } from './ProgramDayCard'
import {
  type GeneratedProgram,
  GOAL_LABELS,
  deleteProgram,
} from '@/lib/program-service'
import { ChevronDown, ChevronUp, Trash2, Calendar } from 'lucide-react'

interface SavedProgramsListProps {
  programs: GeneratedProgram[]
  onDelete: (id: string) => void
}

export function SavedProgramsList({ programs, onDelete }: SavedProgramsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    deleteProgram(id)
    onDelete(id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (programs.length === 0) {
    return null
  }

  // Sort by newest first
  const sortedPrograms = [...programs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Saved Programs</h3>
      
      <div className="space-y-4">
        {sortedPrograms.map((program) => (
          <Card
            key={program.id}
            className="bg-[#2A2A2A] border-[#3A3A3A] overflow-hidden"
          >
            {/* Program Header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#3A3A3A]/30 transition-colors"
              onClick={() =>
                setExpandedId(expandedId === program.id ? null : program.id)
              }
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#E63946]" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {GOAL_LABELS[program.primaryGoal]} Program
                  </h4>
                  <p className="text-sm text-[#A5A5A5]">
                    {program.trainingDaysPerWeek} days/week • {program.sessionLength} min •{' '}
                    {formatDate(program.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(program.id)
                  }}
                  className="text-[#A5A5A5] hover:text-[#E63946] hover:bg-[#E63946]/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedId === program.id ? (
                  <ChevronUp className="w-5 h-5 text-[#A5A5A5]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#A5A5A5]" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === program.id && (
              <div className="p-4 pt-0 border-t border-[#3A3A3A]">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {program.generatedDays.map((day, idx) => (
                    <ProgramDayCard key={idx} day={day} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
