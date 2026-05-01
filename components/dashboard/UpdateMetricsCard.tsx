'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Dumbbell, 
  Target, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  RefreshCw,
  AlertCircle,
  Info,
  X,
} from 'lucide-react'
import {
  getCurrentMetrics,
  updateMetricsAndRecalculate,
  analyzeMetricChanges,
  type MetricUpdate,
  type MetricChangeAnalysis,
} from '@/lib/metrics-update-service'
import {
  getOnboardingProfile,
  PULLUP_LABELS,
  DIP_LABELS,
  PUSHUP_LABELS,
  WALL_HSPU_LABELS,
  FRONT_LEVER_LABELS,
  PLANCHE_LABELS,
  MUSCLE_UP_LABELS,
  HSPU_LABELS,
  LSIT_HOLD_LABELS,
  VSIT_HOLD_LABELS,
  FLEXIBILITY_LEVEL_LABELS,
  type PullUpCapacity,
  type DipCapacity,
  type PushUpCapacity,
  type WallHSPUReps,
  type FrontLeverProgression,
  type PlancheProgression,
  type MuscleUpReadiness,
  type HSPUProgression,
  type LSitHoldCapacity,
  type VSitHoldCapacity,
  type FlexibilityLevel,
} from '@/lib/athlete-profile'
import { TestingGuideLink } from '@/components/testing/TestingGuideModal'
import { cn } from '@/lib/utils'
import { logProfileTruthState } from '@/lib/profile-truth-contract'

// =============================================================================
// METRIC SELECTOR COMPONENT
// =============================================================================

interface MetricSelectorProps<T extends string> {
  label: string
  value: T | null
  options: Record<T, string>
  onChange: (value: T) => void
  description?: string
  metricKey?: string  // For linking to testing guide
}

function MetricSelector<T extends string>({
  label,
  value,
  options,
  onChange,
  description,
  metricKey,
}: MetricSelectorProps<T>) {
  const optionKeys = Object.keys(options).filter(k => k !== 'unknown') as T[]
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#A4ACB8]">{label}</label>
        {metricKey && <TestingGuideLink metricKey={metricKey} />}
      </div>
      {description && (
        <p className="text-xs text-[#6B7280]">{description}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {optionKeys.map((key) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "px-2.5 py-1.5 text-xs rounded-md border transition-colors",
              value === key
                ? "bg-[#C1121F] border-[#C1121F] text-white"
                : "bg-[#0F1115] border-[#2B313A] text-[#A4ACB8] hover:border-[#4B5563]"
            )}
          >
            {options[key]}
          </button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// WEIGHTED BENCHMARK INPUT
// =============================================================================

interface WeightedInputProps {
  label: string
  weight: number | null
  reps: number | null
  onWeightChange: (weight: number | null) => void
  onRepsChange: (reps: number | null) => void
  metricKey?: string
}

function WeightedInput({ label, weight, reps, onWeightChange, onRepsChange, metricKey }: WeightedInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[#A4ACB8]">{label}</label>
        {metricKey && <TestingGuideLink metricKey={metricKey} />}
      </div>
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          placeholder="Weight"
          value={weight ?? ''}
          onChange={(e) => onWeightChange(e.target.value ? parseInt(e.target.value) : null)}
          className="w-20 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
        />
        <span className="text-xs text-[#6B7280]">lbs +</span>
        <Input
          type="number"
          placeholder="Reps"
          value={reps ?? ''}
          onChange={(e) => onRepsChange(e.target.value ? parseInt(e.target.value) : null)}
          className="w-16 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
        />
        <span className="text-xs text-[#6B7280]">reps</span>
      </div>
    </div>
  )
}

// =============================================================================
// CONFIRMATION DIALOG
// =============================================================================

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: MetricChangeAnalysis
  onConfirm: (updateProgram: boolean) => void
}

function ConfirmationDialog({ open, onOpenChange, analysis, onConfirm }: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D23] border-[#2B313A] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#E6E9EF] flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#C1121F]" />
            Update Your Program?
          </DialogTitle>
          <DialogDescription className="text-[#A4ACB8]">
            Your updated metrics can improve your training program.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className={cn(
            "p-3 rounded-lg border",
            analysis.significance === 'major' 
              ? "bg-[#C1121F]/10 border-[#C1121F]/30" 
              : analysis.significance === 'moderate'
              ? "bg-[#4F6D8A]/10 border-[#4F6D8A]/30"
              : "bg-[#2B313A]/50 border-[#2B313A]"
          )}>
            <p className="text-sm text-[#E6E9EF]">{analysis.summary}</p>
          </div>
          
          {analysis.changedMetrics.length > 0 && (
            <div className="text-xs text-[#6B7280]">
              Updated: {analysis.changedMetrics.join(', ')}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onConfirm(false)}
            className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50"
          >
            Keep Current Program
          </Button>
          <Button
            onClick={() => onConfirm(true)}
            className="bg-[#C1121F] hover:bg-[#C1121F]/90 text-white"
          >
            Update Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// MAIN UPDATE METRICS CARD
// =============================================================================

interface UpdateMetricsCardProps {
  variant?: 'full' | 'compact'
  onUpdate?: () => void
}

export function UpdateMetricsCard({ variant = 'full', onUpdate }: UpdateMetricsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'strength' | 'skills' | 'flexibility'>('strength')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAnalysis, setPendingAnalysis] = useState<MetricChangeAnalysis | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<MetricUpdate | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Local state for metrics being edited
  const [strengthMetrics, setStrengthMetrics] = useState({
    pullUpMax: null as PullUpCapacity | null,
    dipMax: null as DipCapacity | null,
    pushUpMax: null as PushUpCapacity | null,
    wallHSPUReps: null as WallHSPUReps | null,
    weightedPullUpWeight: null as number | null,
    weightedPullUpReps: null as number | null,
    weightedDipWeight: null as number | null,
    weightedDipReps: null as number | null,
  })
  
  const [skillMetrics, setSkillMetrics] = useState({
    frontLeverProg: null as FrontLeverProgression | null,
    frontLeverHold: null as number | null,
    plancheProg: null as PlancheProgression | null,
    plancheHold: null as number | null,
    muscleUp: null as MuscleUpReadiness | null,
    hspuProg: null as HSPUProgression | null,
    lSitHold: null as LSitHoldCapacity | null,
    vSitHold: null as VSitHoldCapacity | null,
  })
  
  const [flexMetrics, setFlexMetrics] = useState({
    pancake: null as FlexibilityLevel | null,
    toeTouch: null as FlexibilityLevel | null,
    frontSplits: null as FlexibilityLevel | null,
    sideSplits: null as FlexibilityLevel | null,
  })

  // Load current metrics on mount
  useEffect(() => {
    const current = getCurrentMetrics()
    
    // [PRE-AB6 BUILD GREEN GATE / WEIGHTEDBENCHMARK CONTRACT]
    // The authoritative WeightedBenchmark used by metrics-update-service is
    // imported from lib/athlete-profile.ts:328 and exposes
    // { load: number | null, unit: 'lbs' | 'kg', reps?: number } — there is
    // NO `addedWeight` field. (A separate WeightedBenchmark in
    // lib/prescription-contract.ts uses `addedWeight`, but that type is
    // unrelated to getCurrentMetrics()'s return shape.) Read `load` directly.
    setStrengthMetrics({
      pullUpMax: current.strength.pullUpMax,
      dipMax: current.strength.dipMax,
      pushUpMax: current.strength.pushUpMax,
      wallHSPUReps: current.strength.wallHSPUReps,
      weightedPullUpWeight: current.strength.weightedPullUp?.load ?? null,
      weightedPullUpReps: current.strength.weightedPullUp?.reps ?? null,
      weightedDipWeight: current.strength.weightedDip?.load ?? null,
      weightedDipReps: current.strength.weightedDip?.reps ?? null,
    })
    
    setSkillMetrics({
      frontLeverProg: current.skills.frontLever?.progression as FrontLeverProgression ?? null,
      frontLeverHold: current.skills.frontLever?.holdSeconds ?? null,
      plancheProg: current.skills.planche?.progression as PlancheProgression ?? null,
      plancheHold: current.skills.planche?.holdSeconds ?? null,
      muscleUp: current.skills.muscleUp,
      hspuProg: current.skills.hspu?.progression as HSPUProgression ?? null,
      lSitHold: current.skills.lSitHold,
      vSitHold: current.skills.vSitHold,
    })
    
    setFlexMetrics({
      pancake: current.flexibility.pancake?.level as FlexibilityLevel ?? null,
      toeTouch: current.flexibility.toeTouch?.level as FlexibilityLevel ?? null,
      frontSplits: current.flexibility.frontSplits?.level as FlexibilityLevel ?? null,
      sideSplits: current.flexibility.sideSplits?.level as FlexibilityLevel ?? null,
    })
  }, [isExpanded])

  // Build update object from current state
  const buildUpdateObject = (): MetricUpdate => {
    return {
      strength: {
        pullUpMax: strengthMetrics.pullUpMax,
        dipMax: strengthMetrics.dipMax,
        pushUpMax: strengthMetrics.pushUpMax,
        wallHSPUReps: strengthMetrics.wallHSPUReps,
        // [PRE-AB6 BUILD GREEN GATE / WEIGHTEDBENCHMARK CONTRACT]
        // Same authoritative type (lib/athlete-profile.ts:328): write `load`
        // and required `unit`. The WeightedInput UI displays "lbs +" so the
        // unit is always 'lbs' in this component — no fake conversion.
        weightedPullUp: strengthMetrics.weightedPullUpWeight !== null ? {
          load: strengthMetrics.weightedPullUpWeight,
          unit: 'lbs',
          reps: strengthMetrics.weightedPullUpReps ?? 1,
        } : null,
        weightedDip: strengthMetrics.weightedDipWeight !== null ? {
          load: strengthMetrics.weightedDipWeight,
          unit: 'lbs',
          reps: strengthMetrics.weightedDipReps ?? 1,
        } : null,
      },
      skills: {
        frontLever: skillMetrics.frontLeverProg ? {
          progression: skillMetrics.frontLeverProg,
          holdSeconds: skillMetrics.frontLeverHold ?? undefined,
        } : null,
        planche: skillMetrics.plancheProg ? {
          progression: skillMetrics.plancheProg,
          holdSeconds: skillMetrics.plancheHold ?? undefined,
        } : null,
        muscleUp: skillMetrics.muscleUp,
        hspu: skillMetrics.hspuProg ? {
          progression: skillMetrics.hspuProg,
        } : null,
        lSitHold: skillMetrics.lSitHold,
        vSitHold: skillMetrics.vSitHold,
      },
      flexibility: {
        pancake: flexMetrics.pancake ? { level: flexMetrics.pancake, rangeIntent: null } : null,
        toeTouch: flexMetrics.toeTouch ? { level: flexMetrics.toeTouch, rangeIntent: null } : null,
        frontSplits: flexMetrics.frontSplits ? { level: flexMetrics.frontSplits, rangeIntent: null } : null,
        sideSplits: flexMetrics.sideSplits ? { level: flexMetrics.sideSplits, rangeIntent: null } : null,
      },
    }
  }

  // Handle save button click
  const handleSave = () => {
    const profile = getOnboardingProfile()
    if (!profile) return

    const updates = buildUpdateObject()
    const analysis = analyzeMetricChanges(profile, updates)

    if (analysis.significance === 'none') {
      // No changes, just close
      setIsExpanded(false)
      return
    }

    // Show confirmation dialog
    setPendingAnalysis(analysis)
    setPendingUpdates(updates)
    setShowConfirmDialog(true)
  }

  // Handle confirmation
  const handleConfirm = (updateProgram: boolean) => {
    if (!pendingUpdates) return

    updateMetricsAndRecalculate(pendingUpdates, updateProgram)
    
    // Log canonical profile state after metrics update for debugging
    logProfileTruthState('After UpdateMetricsCard save')
    
    setShowConfirmDialog(false)
    setPendingAnalysis(null)
    setPendingUpdates(null)
    setIsExpanded(false)
    setSaveSuccess(true)
    
    // Clear success message after delay
    setTimeout(() => setSaveSuccess(false), 3000)
    
    // Notify parent
    onUpdate?.()
  }

  // Compact variant - just a button
  if (variant === 'compact') {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        variant="outline"
        size="sm"
        className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50 gap-1.5"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Update Metrics
      </Button>
    )
  }

  return (
    <>
      <Card className="bg-[#1A1D23] border-[#2B313A] overflow-hidden">
        {/* Header - Always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#1E2229] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C1121F]/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-[#C1121F]" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-[#E6E9EF]">Update Strength & Skill Metrics</h3>
              <p className="text-xs text-[#6B7280]">
                Refine your program with updated benchmarks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#6B7280]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#6B7280]" />
            )}
          </div>
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-[#2B313A]">
            {/* Info banner */}
            <div className="px-4 py-3 bg-[#4F6D8A]/10 border-b border-[#2B313A] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#4F6D8A] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-[#A4ACB8]">
                  SpartanLab adapts to your progress. Update your metrics anytime to refine your program.
                </p>
                <a 
                  href="/guides/testing" 
                  className="text-xs text-[#4F6D8A] hover:text-[#6B8FAD] mt-1 inline-block transition-colors"
                >
                  Learn how to test your metrics properly
                </a>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-[#2B313A]">
              {[
                { id: 'strength', label: 'Strength', icon: Dumbbell },
                { id: 'skills', label: 'Skills', icon: Target },
                { id: 'flexibility', label: 'Flexibility', icon: Zap },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm transition-colors",
                    activeTab === tab.id
                      ? "text-[#C1121F] border-b-2 border-[#C1121F] bg-[#C1121F]/5"
                      : "text-[#6B7280] hover:text-[#A4ACB8]"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {activeTab === 'strength' && (
                <div className="space-y-5">
                  <MetricSelector
                    label="Max Pull-ups"
                    value={strengthMetrics.pullUpMax}
                    options={PULLUP_LABELS}
                    onChange={(v) => setStrengthMetrics(s => ({ ...s, pullUpMax: v }))}
                    description="Strict form, full range of motion"
                  />
                  
                  <MetricSelector
                    label="Max Dips"
                    value={strengthMetrics.dipMax}
                    options={DIP_LABELS}
                    onChange={(v) => setStrengthMetrics(s => ({ ...s, dipMax: v }))}
                    description="Parallel bar dips, full depth"
                  />
                  
                  <MetricSelector
                    label="Max Push-ups"
                    value={strengthMetrics.pushUpMax}
                    options={PUSHUP_LABELS}
                    onChange={(v) => setStrengthMetrics(s => ({ ...s, pushUpMax: v }))}
                    description="Full range, chest to ground"
                  />
                  
                  <MetricSelector
                    label="Wall HSPU Reps"
                    value={strengthMetrics.wallHSPUReps}
                    options={WALL_HSPU_LABELS}
                    onChange={(v) => setStrengthMetrics(s => ({ ...s, wallHSPUReps: v }))}
                  />

                  <div className="pt-2 border-t border-[#2B313A]">
                    <WeightedInput
                      label="Weighted Pull-up"
                      weight={strengthMetrics.weightedPullUpWeight}
                      reps={strengthMetrics.weightedPullUpReps}
                      onWeightChange={(v) => setStrengthMetrics(s => ({ ...s, weightedPullUpWeight: v }))}
                      onRepsChange={(v) => setStrengthMetrics(s => ({ ...s, weightedPullUpReps: v }))}
                    />
                  </div>

                  <WeightedInput
                    label="Weighted Dip"
                    weight={strengthMetrics.weightedDipWeight}
                    reps={strengthMetrics.weightedDipReps}
                    onWeightChange={(v) => setStrengthMetrics(s => ({ ...s, weightedDipWeight: v }))}
                    onRepsChange={(v) => setStrengthMetrics(s => ({ ...s, weightedDipReps: v }))}
                  />
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-5">
                  <MetricSelector
                    label="Front Lever Progression"
                    value={skillMetrics.frontLeverProg}
                    options={FRONT_LEVER_LABELS}
                    onChange={(v) => setSkillMetrics(s => ({ ...s, frontLeverProg: v }))}
                  />
                  
                  {skillMetrics.frontLeverProg && skillMetrics.frontLeverProg !== 'none' && (
                    <div className="pl-4 border-l-2 border-[#2B313A]">
                      <label className="text-xs text-[#6B7280]">Best hold (seconds)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        value={skillMetrics.frontLeverHold ?? ''}
                        onChange={(e) => setSkillMetrics(s => ({ 
                          ...s, 
                          frontLeverHold: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        className="mt-1 w-24 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
                      />
                    </div>
                  )}
                  
                  <MetricSelector
                    label="Planche Progression"
                    value={skillMetrics.plancheProg}
                    options={PLANCHE_LABELS}
                    onChange={(v) => setSkillMetrics(s => ({ ...s, plancheProg: v }))}
                  />
                  
                  {skillMetrics.plancheProg && skillMetrics.plancheProg !== 'none' && (
                    <div className="pl-4 border-l-2 border-[#2B313A]">
                      <label className="text-xs text-[#6B7280]">Best hold (seconds)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        value={skillMetrics.plancheHold ?? ''}
                        onChange={(e) => setSkillMetrics(s => ({ 
                          ...s, 
                          plancheHold: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                        className="mt-1 w-24 bg-[#0F1115] border-[#2B313A] text-[#E6E9EF]"
                      />
                    </div>
                  )}
                  
                  <MetricSelector
                    label="Muscle-Up Readiness"
                    value={skillMetrics.muscleUp}
                    options={MUSCLE_UP_LABELS}
                    onChange={(v) => setSkillMetrics(s => ({ ...s, muscleUp: v }))}
                  />
                  
                  <MetricSelector
                    label="HSPU Progression"
                    value={skillMetrics.hspuProg}
                    options={HSPU_LABELS}
                    onChange={(v) => setSkillMetrics(s => ({ ...s, hspuProg: v }))}
                  />
                  
                  <MetricSelector
                    label="L-Sit Hold"
                    value={skillMetrics.lSitHold}
                    options={LSIT_HOLD_LABELS}
                    onChange={(v) => setSkillMetrics(s => ({ ...s, lSitHold: v }))}
                  />
                  
                  <MetricSelector
                    label="V-Sit Hold"
                    value={skillMetrics.vSitHold}
                    options={VSIT_HOLD_LABELS}
                    onChange={(v) => setSkillMetrics(s => ({ ...s, vSitHold: v }))}
                  />
                </div>
              )}

              {activeTab === 'flexibility' && (
                <div className="space-y-5">
                  <MetricSelector
                    label="Pancake"
                    value={flexMetrics.pancake}
                    options={FLEXIBILITY_LEVEL_LABELS}
                    onChange={(v) => setFlexMetrics(s => ({ ...s, pancake: v }))}
                  />
                  
                  <MetricSelector
                    label="Forward Fold / Toe Touch"
                    value={flexMetrics.toeTouch}
                    options={FLEXIBILITY_LEVEL_LABELS}
                    onChange={(v) => setFlexMetrics(s => ({ ...s, toeTouch: v }))}
                  />
                  
                  <MetricSelector
                    label="Front Splits"
                    value={flexMetrics.frontSplits}
                    options={FLEXIBILITY_LEVEL_LABELS}
                    onChange={(v) => setFlexMetrics(s => ({ ...s, frontSplits: v }))}
                  />
                  
                  <MetricSelector
                    label="Side Splits"
                    value={flexMetrics.sideSplits}
                    options={FLEXIBILITY_LEVEL_LABELS}
                    onChange={(v) => setFlexMetrics(s => ({ ...s, sideSplits: v }))}
                  />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-[#2B313A] flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#C1121F] hover:bg-[#C1121F]/90 text-white gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      {pendingAnalysis && (
        <ConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          analysis={pendingAnalysis}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

// =============================================================================
// DASHBOARD INFO BANNER
// =============================================================================

export function MetricsUpdateBanner() {
  return (
    <div className="px-4 py-3 bg-[#1A1D23] border border-[#2B313A] rounded-lg flex items-start gap-3">
      <div className="p-1.5 bg-[#4F6D8A]/10 rounded-md mt-0.5">
        <Info className="w-4 h-4 text-[#4F6D8A]" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[#A4ACB8]">
          SpartanLab adapts to your progress. Update your strength and skill metrics anytime to refine your program.
        </p>
        <a 
          href="/guides/testing" 
          className="text-xs text-[#4F6D8A] hover:text-[#6B8FAD] mt-1 inline-block transition-colors"
        >
          Learn how to test your metrics
        </a>
      </div>
    </div>
  )
}
