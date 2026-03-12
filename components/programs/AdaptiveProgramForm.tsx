'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type PrimaryGoal,
  type ExperienceLevel,
  type TrainingDays,
  type SessionLength,
  GOAL_LABELS,
} from '@/lib/program-service'
import type { AdaptiveProgramInputs } from '@/lib/adaptive-program-builder'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'
import { Sparkles, Info } from 'lucide-react'

interface AdaptiveProgramFormProps {
  inputs: AdaptiveProgramInputs
  onInputChange: (inputs: AdaptiveProgramInputs) => void
  onGenerate: () => void
  isGenerating?: boolean
  constraintLabel?: string
}

const EQUIPMENT_OPTIONS: { id: EquipmentType; label: string }[] = [
  { id: 'pull_bar', label: 'Pull-Up Bar' },
  { id: 'dip_bars', label: 'Dip Bars / Parallettes' },
  { id: 'rings', label: 'Gymnastics Rings' },
  { id: 'parallettes', label: 'Parallettes' },
  { id: 'bands', label: 'Resistance Bands' },
]

export function AdaptiveProgramForm({
  inputs,
  onInputChange,
  onGenerate,
  isGenerating = false,
  constraintLabel,
}: AdaptiveProgramFormProps) {
  const updateInput = <K extends keyof AdaptiveProgramInputs>(
    key: K,
    value: AdaptiveProgramInputs[K]
  ) => {
    onInputChange({ ...inputs, [key]: value })
  }

  const toggleEquipment = (eq: EquipmentType) => {
    const current = inputs.equipment
    const updated = current.includes(eq)
      ? current.filter(e => e !== eq)
      : [...current, eq]
    updateInput('equipment', updated)
  }

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
      <div className="space-y-6">
        {/* Constraint Insight Banner */}
        {constraintLabel && constraintLabel !== 'More Data Needed' && (
          <div className="flex items-start gap-3 p-3 bg-[#1A1A1A] rounded-lg border border-[#3A3A3A]">
            <Info className="w-4 h-4 text-[#E63946] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-[#A5A5A5]">Program will adapt to your current limiter</p>
              <p className="text-sm font-medium text-[#E63946]">{constraintLabel}</p>
            </div>
          </div>
        )}

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

        {/* Equipment Selection */}
        <div className="space-y-3">
          <label className="text-sm text-[#A5A5A5]">Available Equipment</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EQUIPMENT_OPTIONS.map(({ id, label }) => (
              <label
                key={id}
                className="flex items-center gap-2 p-3 bg-[#1A1A1A] rounded-lg border border-[#3A3A3A] cursor-pointer hover:border-[#4A4A4A] transition-colors"
              >
                <Checkbox
                  checked={inputs.equipment.includes(id)}
                  onCheckedChange={() => toggleEquipment(id)}
                  className="border-[#4A4A4A] data-[state=checked]:bg-[#E63946] data-[state=checked]:border-[#E63946]"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#6A6A6A]">
            Floor and wall are always available
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-[#E63946] hover:bg-[#D62828] h-12 text-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {isGenerating ? 'Building Program...' : 'Build Adaptive Program'}
        </Button>

        <p className="text-xs text-[#6A6A6A] text-center">
          Program adapts to your goals, recovery state, and current training constraints
        </p>
      </div>
    </Card>
  )
}
