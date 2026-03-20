'use client'

import { useState } from 'react'
import { ChevronRight, Dumbbell, Clock, Target, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  type PreviewGoal,
  type ExperienceLevel,
  type SessionDuration,
  type EquipmentLevel,
  type PreviewInput,
  PREVIEW_GOAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
} from '@/lib/preview/preview-engine'

interface ProgramPreviewFormProps {
  onGenerate: (input: PreviewInput) => void
  isGenerating?: boolean
  initialGoal?: PreviewGoal
}

export function ProgramPreviewForm({
  onGenerate,
  isGenerating = false,
  initialGoal,
}: ProgramPreviewFormProps) {
  const [primaryGoal, setPrimaryGoal] = useState<PreviewGoal>(initialGoal || 'planche')
  const [secondaryGoal, setSecondaryGoal] = useState<PreviewGoal | undefined>(undefined)
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate')
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(45)
  const [equipment, setEquipment] = useState<EquipmentLevel>('weighted')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate({
      primaryGoal,
      secondaryGoal: secondaryGoal !== primaryGoal ? secondaryGoal : undefined,
      experienceLevel,
      sessionDuration,
      equipment,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Primary Goal */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#E6E9EF]">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#C1121F]" />
            Primary Goal
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PREVIEW_GOAL_OPTIONS.slice(0, 8).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPrimaryGoal(option.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                primaryGoal === option.value
                  ? 'border-[#C1121F] bg-[#C1121F]/10 text-[#E6E9EF]'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A5A5A5] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Goal (Optional) */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#E6E9EF]">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#4F6D8A]" />
            Secondary Goal <span className="text-[#6B7280]">(optional)</span>
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PREVIEW_GOAL_OPTIONS.filter(o => o.value !== primaryGoal).slice(0, 4).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSecondaryGoal(secondaryGoal === option.value ? undefined : option.value)}
              className={`p-2 rounded-lg border text-left transition-all ${
                secondaryGoal === option.value
                  ? 'border-[#4F6D8A] bg-[#4F6D8A]/10 text-[#E6E9EF]'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A5A5A5] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="text-sm">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#E6E9EF]">
          Experience Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setExperienceLevel(option.value)}
              className={`p-3 rounded-lg border text-center transition-all ${
                experienceLevel === option.value
                  ? 'border-[#C1121F] bg-[#C1121F]/10 text-[#E6E9EF]'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A5A5A5] hover:border-[#3A3A3A]'
              }`}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Duration & Equipment - Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Duration */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#E6E9EF]">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#6B7280]" />
              Session Time
            </span>
          </label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSessionDuration(option.value)}
                className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all ${
                  sessionDuration === option.value
                    ? 'border-[#C1121F] bg-[#C1121F]/10 text-[#E6E9EF]'
                    : 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A5A5A5] hover:border-[#3A3A3A]'
                }`}
              >
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#E6E9EF]">
            <span className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#6B7280]" />
              Equipment
            </span>
          </label>
          <div className="flex gap-2">
            {EQUIPMENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEquipment(option.value)}
                className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all ${
                  equipment === option.value
                    ? 'border-[#C1121F] bg-[#C1121F]/10 text-[#E6E9EF]'
                    : 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A5A5A5] hover:border-[#3A3A3A]'
                }`}
              >
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <Card className="p-4 bg-gradient-to-r from-[#C1121F]/10 to-[#4F6D8A]/10 border-[#2A2A2A]">
        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-[#C1121F] hover:bg-[#A10E1A] text-white font-medium py-3"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Preview...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Generate My Program Preview
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </Button>
        <p className="text-xs text-center text-[#6B7280] mt-2">
          See exactly what your personalized program looks like
        </p>
      </Card>
    </form>
  )
}
