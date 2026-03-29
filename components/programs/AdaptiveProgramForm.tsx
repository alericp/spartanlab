'use client'

import { useState, useEffect } from 'react'
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
import { Sparkles, Info, CheckCircle2 } from 'lucide-react'
import { DURATION_PREFERENCE_LABELS, type SessionDurationMinutes } from '@/lib/duration-contract'

// ==========================================================================
// [PHASE 27C] BUILD IDENTITY FOR FORM COMPONENT
// This allows us to verify which version of the form is rendering
// ==========================================================================
const PHASE27C_FORM_BUILD_IDENTITY = {
  formBuildIdentityName: 'PHASE29A_ADAPTIVE_PROGRAM_FORM',
  formBuildIdentityVersion: '2024-PHASE29A-v1',
  hasExplicitChoiceTracking: true,
  hasAmberWarningStyle: true,
  scheduleSelectorVariant: 'PHASE29A_BASELINE_VS_ADAPTIVE_SEPARATED',
  hasScheduleTruthDebugPanel: true,
  hasVisibleTruthBar: true,
  hasLiveModifyAuditSeeding: true,
  scheduleResolutionFix: 'ATHLETE_STATIC_BEATS_ONBOARDING_FLEXIBLE',
  hasSourceNullWarning: true,
  hasRawStorageVerification: true,
  hasBaselineAdaptiveSeparation: true,
  forensicPhase: 'PHASE29A',
} as const

// [PHASE 27B] Explicit schedule choice tracking for current builder session
interface ExplicitScheduleChoice {
  madeAt: string
  scheduleMode: 'static' | 'flexible'
  trainingDaysPerWeek: TrainingDays | 'flexible'
}

// [PHASE 28B] Expanded debug audit info for VISIBLE schedule truth panel
// [PHASE 29A] Now includes adaptiveWorkloadEnabled to show separation
interface ScheduleTruthAuditInfo {
  // Source values
  onboardingScheduleMode?: 'static' | 'flexible' | string | null
  onboardingTrainingDays?: number | null
  athleteScheduleMode?: 'static' | 'flexible' | string | null
  athleteTrainingDays?: number | null
  // [PHASE 29A] Adaptive workload enabled (separate from schedule)
  adaptiveWorkloadEnabled?: boolean | null
  // Canonical resolved
  canonicalScheduleMode: 'static' | 'flexible' | string | null
  canonicalTrainingDaysPerWeek: number | null
  // Builder prefill (what form opened with)
  prefillScheduleMode?: 'static' | 'flexible' | string | null
  prefillTrainingDays?: number | null
  // Generation history
  lastGeneratedScheduleMode?: string | null
  lastGeneratedTrainingDays?: number | null
  lastReconciliationDecision?: 'kept' | 'replaced' | 'no-op' | null
}

interface AdaptiveProgramFormProps {
  inputs: AdaptiveProgramInputs
  onInputChange: (inputs: AdaptiveProgramInputs) => void
  onGenerate: () => void
  isGenerating?: boolean
  constraintLabel?: string
  // [PHASE 28A] Optional debug audit info
  scheduleTruthAudit?: ScheduleTruthAuditInfo | null
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
  scheduleTruthAudit,
}: AdaptiveProgramFormProps) {
  // ==========================================================================
  // [PHASE 27B] EXPLICIT SCHEDULE CHOICE TRACKING
  // Tracks whether user explicitly interacted with Training Days/Week selector
  // This prevents confusion about whether a static/flexible choice was made
  // ==========================================================================
  const [explicitScheduleChoice, setExplicitScheduleChoice] = useState<ExplicitScheduleChoice | null>(null)
  
  // Reset explicit choice tracking when inputs change externally (new builder session)
  const inputsKey = `${inputs.scheduleMode}-${inputs.trainingDaysPerWeek}`
  useEffect(() => {
    // Only reset if this is a new builder session (inputs changed from outside)
    console.log('[phase27b-explicit-choice-tracker]', {
      event: 'INPUTS_CHANGED_EXTERNALLY',
      inputsKey,
      currentExplicitChoice: explicitScheduleChoice,
    })
    
    // ==========================================================================
    // [PHASE 29B] FORM INITIAL STATE VS PREFILL - Task 5
    // Proves form state matches prefill values
    // ==========================================================================
    console.log('[phase29b-form-initial-state-vs-prefill]', {
      // Prefill (from scheduleTruthAudit)
      'prefill.scheduleMode': scheduleTruthAudit?.prefillScheduleMode ?? null,
      'prefill.trainingDays': scheduleTruthAudit?.prefillTrainingDays ?? null,
      // Form initial state (what form is showing)
      'form.scheduleMode': inputs.scheduleMode,
      'form.trainingDays': inputs.trainingDaysPerWeek,
      'form.adaptiveWorkload': scheduleTruthAudit?.adaptiveWorkloadEnabled ?? true,
      // Match detection
      scheduleModeMatches: scheduleTruthAudit?.prefillScheduleMode === inputs.scheduleMode,
      trainingDaysMatches: scheduleTruthAudit?.prefillTrainingDays == inputs.trainingDaysPerWeek,
      // Verdict
      verdict: (() => {
        const prefillStatic6 = scheduleTruthAudit?.prefillScheduleMode === 'static' && scheduleTruthAudit?.prefillTrainingDays === 6
        const formStatic6 = inputs.scheduleMode === 'static' && inputs.trainingDaysPerWeek === 6
        if (prefillStatic6 && formStatic6) return 'FORM_MATCHES_PREFILL_STATIC_6'
        if (prefillStatic6 && !formStatic6) return 'BUG_FORM_REWROTE_PREFILL'
        if (!prefillStatic6 && inputs.scheduleMode === 'flexible') return 'FORM_MATCHES_PREFILL_FLEXIBLE'
        return 'FORM_STATE_SET'
      })(),
    })
    
    // ==========================================================================
    // [PHASE 29D] FORM INITIAL STATE - proves form received correct initial values
    // ==========================================================================
    console.log('[phase29d-form-initial-state]', {
      initialScheduleMode: inputs.scheduleMode,
      initialTrainingDays: inputs.trainingDaysPerWeek,
      verdict: inputs.scheduleMode === 'static' && inputs.trainingDaysPerWeek === 6
        ? 'STATIC_6_FORM_OPENED'
        : inputs.scheduleMode === 'static'
          ? `STATIC_${inputs.trainingDaysPerWeek}_FORM_OPENED`
          : 'FLEXIBLE_FORM_OPENED',
    })
  }, [inputsKey]) // eslint-disable-line react-hooks/exhaustive-deps
  
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

  // ==========================================================================
  // [PHASE 28E.5] PREFILL LOCK LOG - Form Render
  // Proves whether form inputs match what canonical/prefill intended
  // ==========================================================================
  const selectorValue = inputs.scheduleMode === 'flexible' || inputs.trainingDaysPerWeek === 'flexible' 
    ? 'flexible' 
    : String(inputs.trainingDaysPerWeek)
  const selectorOptionsPresent = ['flexible', '2', '3', '4', '5', '6', '7'] // Expected options
  
  // Check if prefill matches what form is rendering
  const prefillMatchesForm = scheduleTruthAudit 
    ? scheduleTruthAudit.prefillScheduleMode === inputs.scheduleMode
    : true // No audit = assume match
  
  console.log('[phase28e5-live-modify-prefill-lock]', {
    checkpoint: 'FORM_RENDER',
    // Builder session inputs (what should be used)
    builderSessionScheduleMode: inputs.scheduleMode,
    builderSessionTrainingDays: inputs.trainingDaysPerWeek,
    // Selector rendered value
    selectorRenderedValue: selectorValue,
    // Audit info if available
    auditPrefillScheduleMode: scheduleTruthAudit?.prefillScheduleMode ?? null,
    auditPrefillTrainingDays: scheduleTruthAudit?.prefillTrainingDays ?? null,
    auditCanonicalScheduleMode: scheduleTruthAudit?.canonicalScheduleMode ?? null,
    // Explicit choice present
    explicitChoicePresent: inputs.scheduleMode !== undefined,
    // Verdicts
    prefillMatchesForm,
    verdict: prefillMatchesForm 
      ? 'PREFILL_LOCK_MATCH' 
      : 'PREFILL_MASKED_AFTER_OPEN',
    formBuildIdentity: PHASE27C_FORM_BUILD_IDENTITY.formBuildIdentityName,
  })
  
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

          {/* Training Days/Week - PHASE 26H: Re-added after accidental removal */}
          <div className="space-y-2">
            <label className="text-sm text-[#A5A5A5]">Training Days/Week</label>
            <Select
              value={inputs.scheduleMode === 'flexible' || inputs.trainingDaysPerWeek === 'flexible' 
                ? 'flexible' 
                : String(inputs.trainingDaysPerWeek)}
              onValueChange={(v) => {
                const timestamp = new Date().toISOString()
                if (v === 'flexible') {
                  // [PHASE 27B] Record explicit flexible choice
                  const choice: ExplicitScheduleChoice = {
                    madeAt: timestamp,
                    scheduleMode: 'flexible',
                    trainingDaysPerWeek: 'flexible',
                  }
                  setExplicitScheduleChoice(choice)
                  console.log('[phase27b-explicit-schedule-choice]', {
                    action: 'USER_EXPLICITLY_SELECTED_FLEXIBLE',
                    choice,
                    previousScheduleMode: inputs.scheduleMode,
                    previousTrainingDays: inputs.trainingDaysPerWeek,
                    verdict: 'EXPLICIT_FLEXIBLE_CHOICE_RECORDED',
                  })
                  onInputChange({
                    ...inputs,
                    trainingDaysPerWeek: 'flexible',
                    scheduleMode: 'flexible',
                  })
                } else {
                  const numDays = Number(v) as TrainingDays
                  // [PHASE 27B] Record explicit static choice
                  const choice: ExplicitScheduleChoice = {
                    madeAt: timestamp,
                    scheduleMode: 'static',
                    trainingDaysPerWeek: numDays,
                  }
                  setExplicitScheduleChoice(choice)
                  console.log('[phase27b-explicit-schedule-choice]', {
                    action: 'USER_EXPLICITLY_SELECTED_FIXED_DAYS',
                    choice,
                    selectedDays: numDays,
                    previousScheduleMode: inputs.scheduleMode,
                    previousTrainingDays: inputs.trainingDaysPerWeek,
                    verdict: `EXPLICIT_STATIC_${numDays}_DAYS_CHOICE_RECORDED`,
                  })
                  onInputChange({
                    ...inputs,
                    trainingDaysPerWeek: numDays,
                    scheduleMode: 'static',
                  })
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
            {/* [PHASE 27A] HIGH-CLARITY STATE BAR - impossible to miss */}
            <div className={`mt-2 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              inputs.scheduleMode === 'static' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                inputs.scheduleMode === 'static' ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse'
              }`} />
              {inputs.scheduleMode === 'static' 
                ? `FIXED: ${inputs.trainingDaysPerWeek} days/week`
                : 'ADAPTIVE: frequency varies by week'}
            </div>
          </div>
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

        {/* ==========================================================================
           [PHASE 27A/27B] PRE-SUBMIT TRUTH SNAPSHOT WITH EXPLICIT CHOICE TRACKING
           Shows EXACTLY what will be submitted - impossible to misread
           Also shows whether user made an explicit choice this session
           ========================================================================== */}
        <div className={`rounded-lg p-4 space-y-3 border-2 ${
          inputs.scheduleMode === 'static'
            ? 'bg-blue-500/10 border-blue-500/40'
            : 'bg-emerald-500/10 border-emerald-500/40'
        }`}>
          <div className="text-xs text-[#A5A5A5] uppercase tracking-wider font-medium">
            Submitting Program With:
          </div>
          
          {/* [PHASE 29A] Schedule Mode - Shows baseline + adaptive workload status */}
          <div className={`px-4 py-3 rounded-md flex flex-col gap-1 ${
            inputs.scheduleMode === 'static' 
              ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' 
              : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
          }`}>
            <div className="flex items-center gap-3 text-base font-bold">
              <div className={`w-3 h-3 rounded-full ${
                inputs.scheduleMode === 'static' ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse'
              }`} />
              {inputs.scheduleMode === 'static' 
                ? `Baseline: Fixed ${inputs.trainingDaysPerWeek} days/week`
                : 'Baseline: Flexible frequency'}
            </div>
            {/* [PHASE 29A] Show adaptive workload status separately */}
            <div className="flex items-center gap-2 text-xs text-purple-400 pl-6">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              Adaptive workload: enabled
            </div>
          </div>
          
          {/* [PHASE 27B] Explicit Choice Confirmation */}
          {explicitScheduleChoice ? (
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                Explicit choice this session: {explicitScheduleChoice.scheduleMode === 'static' 
                  ? `Fixed ${explicitScheduleChoice.trainingDaysPerWeek} days/week`
                  : 'Adaptive frequency'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-amber-400/80 bg-amber-500/10 px-3 py-2 rounded border border-amber-500/30">
              Currently using your saved schedule preference. To change, select a different option in Training Days/Week above.
            </div>
          )}
          
          {/* Secondary Details */}
          <div className="flex flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-md text-sm font-medium bg-[#2A2A2A] text-[#A5A5A5] border border-[#3A3A3A]">
              {inputs.sessionDurationMode === 'adaptive'
                ? `~${inputs.sessionLength}min adaptive`
                : `${inputs.sessionLength}min sessions`}
            </div>
            <div className="px-3 py-1.5 rounded-md text-sm font-medium bg-[#2A2A2A] text-[#A5A5A5] border border-[#3A3A3A]">
              {GOAL_LABELS[inputs.primaryGoal] || inputs.primaryGoal}
            </div>
          </div>
          
          {/* [PHASE 29A] Submit contract log - shows baseline vs adaptive separation */}
          {(() => {
            // Determine adaptive workload status from audit or default to true
            const adaptiveWorkload = scheduleTruthAudit?.adaptiveWorkloadEnabled ?? true
            console.log('[phase29a-modify-submit-contract]', {
              // Baseline schedule identity (what will be submitted)
              baselineScheduleMode: inputs.scheduleMode,
              baselineTrainingDaysPerWeek: inputs.trainingDaysPerWeek,
              // Adaptive workload (separate concept!)
              adaptiveWorkloadEnabled: adaptiveWorkload,
              // Session config
              sessionDurationMode: inputs.sessionDurationMode,
              sessionLength: inputs.sessionLength,
              primaryGoal: inputs.primaryGoal,
              // Verdict
              verdict: (() => {
                if (inputs.scheduleMode === 'static' && adaptiveWorkload) {
                  return `SUBMITTING_STATIC_${inputs.trainingDaysPerWeek}_BASELINE_WITH_ADAPTIVE_WORKLOAD`
                }
                if (inputs.scheduleMode === 'static' && !adaptiveWorkload) {
                  return `SUBMITTING_STATIC_${inputs.trainingDaysPerWeek}_BASELINE_NO_ADAPTATION`
                }
                return 'SUBMITTING_FLEXIBLE_BASELINE'
              })(),
            })
            return null
          })()}
          {/* [PHASE 27A/27B] Forensic log on every render */}
          {(() => {
            console.log('[phase27a-submit-snapshot]', {
              scheduleMode: inputs.scheduleMode,
              trainingDaysPerWeek: inputs.trainingDaysPerWeek,
              sessionDurationMode: inputs.sessionDurationMode,
              sessionLength: inputs.sessionLength,
              primaryGoal: inputs.primaryGoal,
              explicitChoiceMade: !!explicitScheduleChoice,
              explicitChoiceDetails: explicitScheduleChoice,
              verdict: inputs.scheduleMode === 'static' 
                ? `SNAPSHOT_SHOWS_STATIC_${inputs.trainingDaysPerWeek}_DAYS`
                : 'SNAPSHOT_SHOWS_ADAPTIVE',
            })
            return null
          })()}
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
        
        {/* ==========================================================================
           [PHASE 28B] SCHEDULE TRUTH NOW - PERMANENT VISIBLE DEBUG BAR
           This is ALWAYS visible and shows exactly where schedule truth comes from
           ========================================================================== */}
        {scheduleTruthAudit && (
          <div className="mt-4 p-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg">
            <div className="text-[11px] text-[#A5A5A5] font-semibold uppercase tracking-wider mb-3 pb-2 border-b border-[#2A2A2A]">
              SCHEDULE TRUTH NOW
            </div>
            
            {/* Source rows with badges */}
            <div className="space-y-2 text-[11px] font-mono">
              {/* Onboarding source */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[9px] font-bold">ONBOARD</span>
                  <span className="text-[#666]">scheduleMode:</span>
                </div>
                <span className={scheduleTruthAudit.onboardingScheduleMode === 'static' ? 'text-blue-400' : scheduleTruthAudit.onboardingScheduleMode === 'flexible' ? 'text-emerald-400' : 'text-[#555]'}>
                  {scheduleTruthAudit.onboardingScheduleMode || 'null'}
                  {scheduleTruthAudit.onboardingScheduleMode === 'static' && scheduleTruthAudit.onboardingTrainingDays ? ` (${scheduleTruthAudit.onboardingTrainingDays}d)` : ''}
                </span>
              </div>
              
              {/* Athlete/settings source */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[9px] font-bold">ATHLETE</span>
                  <span className="text-[#666]">scheduleMode:</span>
                </div>
                <span className={scheduleTruthAudit.athleteScheduleMode === 'static' ? 'text-blue-400' : scheduleTruthAudit.athleteScheduleMode === 'flexible' ? 'text-emerald-400' : 'text-[#555]'}>
                  {scheduleTruthAudit.athleteScheduleMode || 'null'}
                  {scheduleTruthAudit.athleteScheduleMode === 'static' && scheduleTruthAudit.athleteTrainingDays ? ` (${scheduleTruthAudit.athleteTrainingDays}d)` : ''}
                </span>
              </div>
              
              {/* Canonical resolved - highlighted */}
              <div className="flex items-center justify-between py-1 px-2 -mx-2 bg-[#252525] rounded">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-cyan-500/30 text-cyan-400 rounded text-[9px] font-bold">CANON</span>
                  <span className="text-[#888] font-semibold">baseline:</span>
                </div>
                <span className={`font-bold ${scheduleTruthAudit.canonicalScheduleMode === 'static' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {scheduleTruthAudit.canonicalScheduleMode === 'flexible' 
                    ? 'FLEXIBLE' 
                    : `STATIC ${scheduleTruthAudit.canonicalTrainingDaysPerWeek}d/wk`}
                </span>
              </div>
              
              {/* [PHASE 29A] Adaptive workload enabled - SEPARATE from schedule */}
              <div className="flex items-center justify-between py-1 px-2 -mx-2 bg-[#1A1A1A] rounded border border-[#333]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-400 rounded text-[9px] font-bold">ADAPT</span>
                  <span className="text-[#888] font-semibold">workload:</span>
                </div>
                <span className={`font-bold ${scheduleTruthAudit.adaptiveWorkloadEnabled ? 'text-purple-400' : 'text-gray-400'}`}>
                  {scheduleTruthAudit.adaptiveWorkloadEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              
              {/* Prefill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[9px] font-bold">PREFILL</span>
                  <span className="text-[#666]">builder opened:</span>
                </div>
                <span className={scheduleTruthAudit.prefillScheduleMode === 'static' ? 'text-blue-400' : 'text-emerald-400'}>
                  {scheduleTruthAudit.prefillScheduleMode === 'flexible' 
                    ? 'flexible' 
                    : `static ${scheduleTruthAudit.prefillTrainingDays}d`}
                </span>
              </div>
              
              {/* Current form selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] font-bold">FORM</span>
                  <span className="text-[#666]">current:</span>
                </div>
                <span className={inputs.scheduleMode === 'static' ? 'text-blue-400' : 'text-emerald-400'}>
                  {inputs.scheduleMode === 'flexible' 
                    ? 'flexible' 
                    : `static ${inputs.trainingDaysPerWeek}d`}
                </span>
              </div>
              
              {/* Submit will send - highlighted */}
              <div className="flex items-center justify-between py-1 px-2 -mx-2 bg-[#252525] rounded">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-red-500/30 text-red-400 rounded text-[9px] font-bold">SUBMIT</span>
                  <span className="text-[#888] font-semibold">will send:</span>
                </div>
                <span className={`font-bold ${inputs.scheduleMode === 'static' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {inputs.scheduleMode === 'flexible' 
                    ? 'FLEXIBLE' 
                    : `STATIC ${inputs.trainingDaysPerWeek}d/wk`}
                </span>
              </div>
            </div>
            
            {/* Large verdict line */}
            <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
              <div className="text-[10px] text-[#666] mb-1">Canonical Verdict:</div>
              {(() => {
                // Determine verdict
                const canonicalIsFlexible = scheduleTruthAudit.canonicalScheduleMode === 'flexible'
                const canonicalIsStatic6 = scheduleTruthAudit.canonicalScheduleMode === 'static' && scheduleTruthAudit.canonicalTrainingDaysPerWeek === 6
                const prefillMatchesCanonical = scheduleTruthAudit.prefillScheduleMode === scheduleTruthAudit.canonicalScheduleMode
                const formMatchesPrefill = inputs.scheduleMode === scheduleTruthAudit.prefillScheduleMode
                const sourceConflict = scheduleTruthAudit.onboardingScheduleMode !== null && 
                  scheduleTruthAudit.athleteScheduleMode !== null && 
                  scheduleTruthAudit.onboardingScheduleMode !== scheduleTruthAudit.athleteScheduleMode
                
                let verdict = ''
                let color = ''
                
                if (sourceConflict) {
                  verdict = 'CANONICAL_SOURCE_CONFLICT'
                  color = 'text-red-400'
                } else if (!prefillMatchesCanonical) {
                  verdict = 'PREFILL_DOES_NOT_MATCH_CANONICAL'
                  color = 'text-red-400'
                } else if (!formMatchesPrefill) {
                  verdict = 'FORM_DOES_NOT_MATCH_PREFILL'
                  color = 'text-amber-400'
                } else if (canonicalIsStatic6) {
                  verdict = 'CANONICAL_CURRENTLY_STATIC_6'
                  color = 'text-blue-400'
                } else if (canonicalIsFlexible) {
                  verdict = 'CANONICAL_CURRENTLY_FLEXIBLE'
                  color = 'text-emerald-400'
                } else {
                  verdict = `CANONICAL_STATIC_${scheduleTruthAudit.canonicalTrainingDaysPerWeek}`
                  color = 'text-blue-400'
                }
                
                return (
                  <div className={`text-sm font-bold ${color}`}>
                    {verdict}
                  </div>
                )
              })()}
            </div>
            
            {/* [PHASE 28L] Form vs Canonical match verdict */}
            <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
              <div className="text-[10px] text-[#666] mb-1">Form Match Verdict:</div>
              {(() => {
                const formIsStatic6 = inputs.scheduleMode === 'static' && inputs.trainingDaysPerWeek === 6
                const canonIsStatic6 = scheduleTruthAudit.canonicalScheduleMode === 'static' && scheduleTruthAudit.canonicalTrainingDaysPerWeek === 6
                const formMatchesCanon = inputs.scheduleMode === scheduleTruthAudit.canonicalScheduleMode
                const formIsFlexible = inputs.scheduleMode === 'flexible'
                const canonIsFlexible = scheduleTruthAudit.canonicalScheduleMode === 'flexible'
                
                if (formIsStatic6 && canonIsStatic6) {
                  return <div className="text-xs font-bold text-blue-400">FORM_MATCHES_CANONICAL_STATIC_6</div>
                }
                if (formMatchesCanon && formIsFlexible && canonIsFlexible) {
                  return <div className="text-xs font-bold text-emerald-400">FORM_IS_FLEXIBLE_BECAUSE_CANONICAL_IS_FLEXIBLE</div>
                }
                if (!formMatchesCanon) {
                  return <div className="text-xs font-bold text-amber-400">FORM_DOES_NOT_MATCH_CANONICAL</div>
                }
                return <div className="text-xs font-bold text-[#888]">FORM_MATCHES_CANONICAL_{inputs.scheduleMode?.toUpperCase()}</div>
              })()}
            </div>
            
            {/* [PHASE 29D] Final display log */}
            {(() => {
              console.log('[phase29d-display-final]', {
                displayedScheduleMode: inputs.scheduleMode,
                displayedTrainingDays: inputs.trainingDaysPerWeek,
                adaptiveWorkloadEnabled: scheduleTruthAudit.adaptiveWorkloadEnabled,
                verdict: inputs.scheduleMode === 'static' && inputs.trainingDaysPerWeek === 6
                  ? 'DISPLAYING_STATIC_6'
                  : inputs.scheduleMode === 'static'
                    ? `DISPLAYING_STATIC_${inputs.trainingDaysPerWeek}`
                    : 'DISPLAYING_FLEXIBLE',
              })
              return null
            })()}
            
            {/* [PHASE 28J] Source null warning - both sources have null scheduleMode */}
            {scheduleTruthAudit.onboardingScheduleMode === null && 
             scheduleTruthAudit.athleteScheduleMode === null && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded">
                <div className="text-[10px] text-red-400 font-semibold">
                  BOTH SOURCES ARE NULL
                </div>
                <div className="text-[9px] text-red-400/80 mt-1">
                  Neither onboarding nor athlete profile has a saved scheduleMode.
                  This is why canonical falls back to flexible.
                  Fix: Settings save must persist scheduleMode to athlete profile.
                </div>
              </div>
            )}
            
            {/* Build variant chip */}
            <div className="mt-2 pt-2 border-t border-[#2A2A2A]">
              <div className="text-[9px] text-[#4A4A4A] font-mono text-center">
                Builder: PHASE28KL_ROOT_CAUSE_FIX
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
