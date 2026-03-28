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
import { DURATION_PREFERENCE_LABELS, type SessionDurationMinutes } from '@/lib/duration-contract'

interface AdaptiveProgramFormProps {
  inputs: AdaptiveProgramInputs
  onInputChange: (inputs: AdaptiveProgramInputs) => void
  onGenerate: () => void
  isGenerating?: boolean
  constraintLabel?: string
}

const EQUIPMENT_OPTIONS: { id: EquipmentType; label: string; hint?: string }[] = [
  { id: 'pull_bar', label: 'Pull-Up Bar' },
  { id: 'dip_bars', label: 'Dip Bars / Parallettes' },
  { id: 'rings', label: 'Gymnastics Rings' },
  { id: 'parallettes', label: 'Parallettes' },
  { id: 'bands', label: 'Resistance Bands' },
  { id: 'weights', label: 'Weights (for loading)', hint: 'Enables automatic weight targets' },
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
    // [PHASE 24O] CRITICAL FIX: When user selects a numeric trainingDaysPerWeek,
    // automatically flip scheduleMode to 'static' to ensure the selection registers
    // This prevents flexible schedule identity from overriding explicit day selection
    if (key === 'trainingDaysPerWeek' && typeof value === 'number') {
      console.log('[phase24o-builder-form-static-mode-fix]', {
        selectedDays: value,
        previousScheduleMode: inputs.scheduleMode,
        newScheduleMode: 'static',
        verdict: 'NUMERIC_DAY_SELECTION_FLIPS_TO_STATIC',
      })
      onInputChange({ 
        ...inputs, 
        trainingDaysPerWeek: value as TrainingDays,
        scheduleMode: 'static', // [PHASE 24O] Explicit numeric selection = static mode
      })
      return
    }
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
        {/* [limiter-truth] ISSUE B/D: Hide banner for low-history / calibration states */}
        {constraintLabel && 
         !['More Data Needed', 'Early Calibration', 'Building Consistency', 'No Primary Constraint', 'Training Balanced'].includes(constraintLabel) && (
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

          {/* Training Days - Supports both flexible and static modes */}
          {/* [PHASE 24R] CRITICAL FIX: Allow flexible users to switch to fixed days */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Training Days/Week</label>
            {/* [PHASE 24R] Always show the numeric selector - flexible users can now switch to fixed */}
            <Select
              value={inputs.scheduleMode === 'flexible' || inputs.trainingDaysPerWeek === 'flexible' 
                ? 'flexible' 
                : String(inputs.trainingDaysPerWeek)}
              onValueChange={(v) => {
                if (v === 'flexible') {
                  // User chose to keep/switch to flexible mode
                  console.log('[phase24r-schedule-mode-switch]', {
                    from: inputs.scheduleMode,
                    to: 'flexible',
                    verdict: 'USER_CHOSE_FLEXIBLE',
                  })
                  onInputChange({
                    ...inputs,
                    trainingDaysPerWeek: 'flexible',
                    scheduleMode: 'flexible',
                  })
                } else {
                  // User chose a specific day count - this triggers static mode
                  const numDays = Number(v) as TrainingDays
                  const newInputs = {
                    ...inputs,
                    trainingDaysPerWeek: numDays,
                    scheduleMode: 'static' as const,
                  }
                  console.log('[phase24t-schedule-selector-state-audit]', {
                    action: 'USER_SELECTED_FIXED_DAYS',
                    previousScheduleMode: inputs.scheduleMode,
                    previousTrainingDays: inputs.trainingDaysPerWeek,
                    newScheduleMode: newInputs.scheduleMode,
                    newTrainingDays: newInputs.trainingDaysPerWeek,
                    fullNewInputsSnapshot: {
                      scheduleMode: newInputs.scheduleMode,
                      trainingDaysPerWeek: newInputs.trainingDaysPerWeek,
                      sessionDurationMode: newInputs.sessionDurationMode,
                      primaryGoal: newInputs.primaryGoal,
                    },
                    verdict: 'STATIC_' + numDays + '_DAYS_SENT_TO_ONINPUTCHANGE',
                  })
                  onInputChange(newInputs)
                }
              }}
            >
              <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                <SelectItem value="flexible">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Flexible / Adaptive</span>
                  </div>
                </SelectItem>
                <SelectItem value="2">2 days/week</SelectItem>
                <SelectItem value="3">3 days/week</SelectItem>
                <SelectItem value="4">4 days/week</SelectItem>
                <SelectItem value="5">5 days/week</SelectItem>
                <SelectItem value="6">6 days/week</SelectItem>
                <SelectItem value="7">7 days/week</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#6A6A6A]">
              {inputs.scheduleMode === 'flexible' || inputs.trainingDaysPerWeek === 'flexible'
                ? 'Frequency adapts to your recovery - or choose fixed days above'
                : 'Fixed schedule - select Flexible above to adapt weekly'}
            </p>
          </div>

          {/* Session Length - ISSUE B FIX: Preserve duration mode + baseline separately */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Target Session Duration</label>
            {inputs.sessionDurationMode === 'adaptive' ? (
              // ISSUE B FIX: Adaptive duration user - show adaptive state with baseline selector
              <div className="space-y-2">
                <div className="bg-[#1A1A1A] border border-[#3A3A3A] rounded-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium">Adaptive Duration</span>
                  </div>
                  <p className="text-xs text-[#6A6A6A] mt-1">
                    Session length varies by day focus and recovery
                  </p>
                </div>
                <Select
                  value={String(inputs.sessionLength)}
                  onValueChange={(v) => updateInput('sessionLength', Number(v) as SessionLength)}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                    <SelectValue placeholder="Base target" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                    {([30, 45, 60, 90] as SessionDurationMinutes[]).map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        ~{DURATION_PREFERENCE_LABELS[minutes].label} base
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              // STATIC USER: Show fixed duration selector
              <Select
                value={String(inputs.sessionLength)}
                onValueChange={(v) => updateInput('sessionLength', Number(v) as SessionLength)}
              >
                <SelectTrigger className="bg-[#1A1A1A] border-[#3A3A3A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
                  {([30, 45, 60, 90] as SessionDurationMinutes[]).map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {DURATION_PREFERENCE_LABELS[minutes].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-[#6A6A6A]">
              {inputs.sessionDurationMode === 'adaptive' 
                ? 'Adaptive mode - sessions expand/contract based on day intensity'
                : 'Pre-filled from your profile. Actual sessions may vary based on day focus.'}
            </p>
          </div>
        </div>

        {/* Equipment Selection */}
        <div className="space-y-3">
          <label className="text-sm text-[#A5A5A5]">Available Equipment</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EQUIPMENT_OPTIONS.map(({ id, label, hint }) => (
              <label
                key={id}
                className={`flex items-center gap-2 p-3 bg-[#1A1A1A] rounded-lg border cursor-pointer hover:border-[#4A4A4A] transition-colors ${
                  id === 'weights' ? 'border-[#4A4A4A]' : 'border-[#3A3A3A]'
                }`}
              >
                <Checkbox
                  checked={inputs.equipment.includes(id)}
                  onCheckedChange={() => toggleEquipment(id)}
                  className="border-[#4A4A4A] data-[state=checked]:bg-[#E63946] data-[state=checked]:border-[#E63946]"
                />
                <div className="flex flex-col">
                  <span className="text-sm">{label}</span>
                  {hint && <span className="text-[10px] text-[#6A6A6A]">{hint}</span>}
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#6A6A6A]">
            Pre-filled from your profile. Floor and wall are always available.
          </p>
          {/* [loadability-truth] ISSUE F: Explain weighted prescription state */}
          {inputs.equipment.includes('weights') ? (
            <p className="text-xs text-emerald-500/80">
              Weighted loading enabled — automatic weight targets will be prescribed based on your strength data.
            </p>
          ) : (
            <p className="text-xs text-amber-500/80">
              No loadable equipment selected — weighted exercises will use bodyweight prescriptions. Add "Weights (for loading)" for automatic weight targets.
            </p>
          )}
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
