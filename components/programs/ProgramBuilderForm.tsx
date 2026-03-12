'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type ProgramInputs,
  type PrimaryGoal,
  type ExperienceLevel,
  type SecondaryEmphasis,
  type SessionLength,
  type TrainingDays,
  GOAL_LABELS,
  EMPHASIS_LABELS,
} from '@/lib/program-service'
import { Sparkles } from 'lucide-react'

interface ProgramBuilderFormProps {
  inputs: ProgramInputs
  onInputChange: (inputs: ProgramInputs) => void
  onGenerate: () => void
  isGenerating?: boolean
}

export function ProgramBuilderForm({
  inputs,
  onInputChange,
  onGenerate,
  isGenerating = false,
}: ProgramBuilderFormProps) {
  const updateInput = <K extends keyof ProgramInputs>(
    key: K,
    value: ProgramInputs[K]
  ) => {
    onInputChange({ ...inputs, [key]: value })
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Primary Goal */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Primary Goal</label>
            <Select
              value={inputs.primaryGoal}
              onValueChange={(v) => updateInput('primaryGoal', v as PrimaryGoal)}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                {Object.entries(GOAL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Experience Level</label>
            <Select
              value={inputs.experienceLevel}
              onValueChange={(v) => updateInput('experienceLevel', v as ExperienceLevel)}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Training Days */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Training Days/Week</label>
            <Select
              value={String(inputs.trainingDaysPerWeek)}
              onValueChange={(v) => updateInput('trainingDaysPerWeek', Number(v) as TrainingDays)}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="2">2 Days</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="4">4 Days</SelectItem>
                <SelectItem value="5">5 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Length */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Session Length</label>
            <Select
              value={String(inputs.sessionLength)}
              onValueChange={(v) => updateInput('sessionLength', Number(v) as SessionLength)}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="30">30 Minutes</SelectItem>
                <SelectItem value="45">45 Minutes</SelectItem>
                <SelectItem value="60">60 Minutes</SelectItem>
                <SelectItem value="75">75 Minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Emphasis - Full Width */}
        <div className="space-y-2">
          <label className="text-sm text-[#A5A5A5]">Secondary Emphasis (Optional)</label>
          <Select
            value={inputs.secondaryEmphasis}
            onValueChange={(v) => updateInput('secondaryEmphasis', v as SecondaryEmphasis)}
          >
            <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
              {Object.entries(EMPHASIS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-[#E63946] hover:bg-[#D62828] h-12 text-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Program'}
        </Button>
      </div>
    </Card>
  )
}
