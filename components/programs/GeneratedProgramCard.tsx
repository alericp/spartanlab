'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProgramDayCard } from './ProgramDayCard'
import {
  type GeneratedProgram,
  GOAL_LABELS,
  EMPHASIS_LABELS,
} from '@/lib/program-service'
import { Save, Info } from 'lucide-react'

interface GeneratedProgramCardProps {
  program: GeneratedProgram
  onSave: () => void
  isSaved?: boolean
}

export function GeneratedProgramCard({
  program,
  onSave,
  isSaved = false,
}: GeneratedProgramCardProps) {
  return (
    <div className="space-y-6">
      {/* Program Summary */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">
              {GOAL_LABELS[program.primaryGoal]} Program
            </h3>
            <div className="flex flex-wrap gap-3 text-sm text-[#A5A5A5]">
              <span className="bg-[#1A1A1A] px-3 py-1 rounded capitalize">
                {program.experienceLevel}
              </span>
              <span className="bg-[#1A1A1A] px-3 py-1 rounded">
                {program.trainingDaysPerWeek} days/week
              </span>
              <span className="bg-[#1A1A1A] px-3 py-1 rounded">
                {program.sessionLength} min
              </span>
              {program.secondaryEmphasis !== 'none' && (
                <span className="bg-[#1A1A1A] px-3 py-1 rounded">
                  + {EMPHASIS_LABELS[program.secondaryEmphasis]}
                </span>
              )}
            </div>
          </div>
          
          {!isSaved && (
            <Button
              onClick={onSave}
              className="bg-[#E63946] hover:bg-[#D62828]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Program
            </Button>
          )}
          
          {isSaved && (
            <span className="text-sm text-[#E63946] bg-[#E63946]/10 px-3 py-2 rounded">
              Saved
            </span>
          )}
        </div>

        {/* Strength Note */}
        {program.strengthNote && (
          <div className="mt-4 p-3 bg-[#1A1A1A] rounded-lg flex items-start gap-3">
            <Info className="w-4 h-4 text-[#E63946] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#A5A5A5]">{program.strengthNote}</p>
          </div>
        )}
      </Card>

      {/* Training Days Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {program.generatedDays.map((day, idx) => (
          <ProgramDayCard key={idx} day={day} />
        ))}
      </div>
    </div>
  )
}
