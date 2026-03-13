'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Settings2, 
  Clock, 
  Dumbbell, 
  Calendar,
  Zap,
  Wrench,
  ChevronRight,
  Check,
  AlertCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react'
import type { TrainingDays } from '@/lib/program-service'
import type { EquipmentType } from '@/lib/adaptive-exercise-pool'
import {
  getExitInterceptMessage,
  applyProgramAdjustment,
  getProgramStatus,
  type AdjustmentType,
  type AdjustmentResult,
} from '@/lib/program-adjustment-engine'

interface ProgramAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
  onStartNew: () => void
  currentEquipment?: EquipmentType[]
  currentSessionMinutes?: number
  currentTrainingDays?: TrainingDays
}

type ModalView = 'intercept' | 'adjustments' | 'confirm'
type AdjustmentCategory = 'time' | 'exercise' | 'schedule' | 'intensity' | 'equipment'

const ADJUSTMENT_OPTIONS: {
  category: AdjustmentCategory
  icon: typeof Clock
  label: string
  description: string
  adjustmentType: AdjustmentType
}[] = [
  {
    category: 'time',
    icon: Clock,
    label: 'Session Time',
    description: 'Reduce or increase workout duration',
    adjustmentType: 'session_time',
  },
  {
    category: 'exercise',
    icon: Dumbbell,
    label: 'Swap Exercise',
    description: 'Replace exercises you dislike or cannot perform',
    adjustmentType: 'exercise_swap',
  },
  {
    category: 'schedule',
    icon: Calendar,
    label: 'Training Days',
    description: 'Change weekly training frequency',
    adjustmentType: 'training_days',
  },
  {
    category: 'intensity',
    icon: Zap,
    label: 'Reduce Intensity',
    description: 'Lower training load for recovery',
    adjustmentType: 'intensity',
  },
  {
    category: 'equipment',
    icon: Wrench,
    label: 'Equipment',
    description: 'Update available equipment',
    adjustmentType: 'equipment',
  },
]

export function ProgramAdjustmentModal({
  open,
  onOpenChange,
  onContinue,
  onStartNew,
  currentEquipment = [],
  currentSessionMinutes = 60,
  currentTrainingDays = 3,
}: ProgramAdjustmentModalProps) {
  const [view, setView] = useState<ModalView>('intercept')
  const [selectedCategory, setSelectedCategory] = useState<AdjustmentCategory | null>(null)
  const [adjustmentResult, setAdjustmentResult] = useState<AdjustmentResult | null>(null)
  
  // Adjustment values
  const [sessionMinutes, setSessionMinutes] = useState(currentSessionMinutes)
  const [trainingDays, setTrainingDays] = useState<TrainingDays>(currentTrainingDays)
  const [intensityLevel, setIntensityLevel] = useState<'mild' | 'moderate' | 'significant'>('mild')

  const interceptMessage = getExitInterceptMessage()
  const programStatus = getProgramStatus()

  const handleBack = () => {
    if (view === 'confirm') {
      setView('adjustments')
    } else if (view === 'adjustments' && selectedCategory) {
      setSelectedCategory(null)
    } else if (view === 'adjustments') {
      setView('intercept')
    }
  }

  const handleApplyAdjustment = () => {
    if (!selectedCategory) return

    let result: AdjustmentResult

    switch (selectedCategory) {
      case 'time':
        result = applyProgramAdjustment({
          type: 'session_time',
          newSessionMinutes: sessionMinutes,
        })
        break
      case 'schedule':
        result = applyProgramAdjustment({
          type: 'training_days',
          newTrainingDays: trainingDays,
        })
        break
      case 'intensity':
        result = applyProgramAdjustment({
          type: 'intensity',
          intensityReduction: intensityLevel,
        })
        break
      default:
        return
    }

    setAdjustmentResult(result)
    setView('confirm')
  }

  const handleConfirm = () => {
    onOpenChange(false)
    // Reset state
    setView('intercept')
    setSelectedCategory(null)
    setAdjustmentResult(null)
  }

  const renderInterceptView = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-[#A4ACB8] leading-relaxed whitespace-pre-line">
          {interceptMessage.body.replace(/\*\*/g, '')}
        </p>
        <p className="text-sm text-[#6B7280]">
          {interceptMessage.recommendation}
        </p>
      </div>

      {programStatus && (
        <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#6B7280]">Program Progress</span>
            <span className="text-xs font-medium text-[#E6E9EF]">
              Week {programStatus.currentWeek} of {programStatus.totalWeeks}
            </span>
          </div>
          <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#C1121F] transition-all duration-300"
              style={{ width: `${programStatus.completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-4">
        <Button
          onClick={onContinue}
          className="bg-[#C1121F] hover:bg-[#A30F1A] text-white"
        >
          Continue Current Program
        </Button>
        <Button
          variant="outline"
          onClick={() => setView('adjustments')}
          className="border-[#2B313A] text-[#E6E9EF] hover:bg-[#2B313A]"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Make Small Adjustments
        </Button>
        <Button
          variant="ghost"
          onClick={onStartNew}
          className="text-[#6B7280] hover:text-[#A4ACB8]"
        >
          Start New Program
        </Button>
      </div>
    </div>
  )

  const renderAdjustmentsView = () => {
    if (selectedCategory) {
      return renderAdjustmentDetail()
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-[#A4ACB8]">
          Select what you would like to adjust. Your progression data will be preserved.
        </p>

        <div className="space-y-2">
          {ADJUSTMENT_OPTIONS.map((option) => (
            <button
              key={option.category}
              onClick={() => setSelectedCategory(option.category)}
              className="w-full flex items-center gap-4 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]/50 hover:border-[#C1121F]/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[#2B313A]/50 flex items-center justify-center shrink-0">
                <option.icon className="w-5 h-5 text-[#A4ACB8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#E6E9EF]">{option.label}</h4>
                <p className="text-xs text-[#6B7280]">{option.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6B7280] shrink-0" />
            </button>
          ))}
        </div>

        {/* Preserved data indicator */}
        <div className="flex items-center gap-2 p-3 bg-[#1A2F1A]/30 border border-[#2D5A2D]/30 rounded-lg">
          <Shield className="w-4 h-4 text-[#4ADE80]" />
          <span className="text-xs text-[#4ADE80]">
            All adjustments preserve your progression and recovery data
          </span>
        </div>
      </div>
    )
  }

  const renderAdjustmentDetail = () => {
    switch (selectedCategory) {
      case 'time':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-[#E6E9EF] mb-2">Session Duration</h4>
              <p className="text-xs text-[#6B7280] mb-4">
                Adjust your target workout time. Skill work will be prioritized.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#A4ACB8]">Current: {currentSessionMinutes} min</span>
                  <span className="text-sm font-medium text-[#E6E9EF]">New: {sessionMinutes} min</span>
                </div>
                
                <Slider
                  value={[sessionMinutes]}
                  onValueChange={(v) => setSessionMinutes(v[0])}
                  min={30}
                  max={90}
                  step={15}
                  className="w-full"
                />
                
                <div className="flex justify-between text-xs text-[#6B7280]">
                  <span>30 min</span>
                  <span>60 min</span>
                  <span>90 min</span>
                </div>
              </div>

              {sessionMinutes < currentSessionMinutes && (
                <div className="mt-4 p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]/50">
                  <p className="text-xs text-[#A4ACB8]">
                    With less time, accessory and finisher work will be reduced while skill work remains priority.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleApplyAdjustment}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              Apply Time Adjustment
            </Button>
          </div>
        )

      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-[#E6E9EF] mb-2">Weekly Training Days</h4>
              <p className="text-xs text-[#6B7280] mb-4">
                Adjust how many days per week you can train.
              </p>
              
              <Select
                value={String(trainingDays)}
                onValueChange={(v) => setTrainingDays(Number(v) as TrainingDays)}
              >
                <SelectTrigger className="bg-[#0F1115] border-[#2B313A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1F26] border-[#2B313A]">
                  <SelectItem value="2">2 Days per Week</SelectItem>
                  <SelectItem value="3">3 Days per Week</SelectItem>
                  <SelectItem value="4">4 Days per Week</SelectItem>
                  <SelectItem value="5">5 Days per Week</SelectItem>
                </SelectContent>
              </Select>

              {trainingDays < currentTrainingDays && (
                <div className="mt-4 p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]/50">
                  <p className="text-xs text-[#A4ACB8]">
                    Fewer training days means accessory work will be consolidated. Skill work frequency will be maintained.
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleApplyAdjustment}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              Apply Schedule Change
            </Button>
          </div>
        )

      case 'intensity':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-[#E6E9EF] mb-2">Intensity Reduction</h4>
              <p className="text-xs text-[#6B7280] mb-4">
                Reduce training load to support recovery without stopping completely.
              </p>
              
              <div className="space-y-2">
                {(['mild', 'moderate', 'significant'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensityLevel(level)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                      intensityLevel === level
                        ? 'bg-[#C1121F]/10 border-[#C1121F]/50'
                        : 'bg-[#0F1115] border-[#2B313A]/50 hover:border-[#2B313A]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      intensityLevel === level ? 'border-[#C1121F]' : 'border-[#6B7280]'
                    }`}>
                      {intensityLevel === level && (
                        <div className="w-2 h-2 rounded-full bg-[#C1121F]" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-[#E6E9EF] capitalize">{level}</h5>
                      <p className="text-xs text-[#6B7280]">
                        {level === 'mild' && 'Slight RPE reduction, volume maintained'}
                        {level === 'moderate' && 'Lower RPE and volume, progression paused'}
                        {level === 'significant' && 'Recovery focus, half volume'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleApplyAdjustment}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              Apply Intensity Reduction
            </Button>
          </div>
        )

      default:
        return (
          <div className="py-8 text-center">
            <p className="text-sm text-[#6B7280]">
              This adjustment type is coming soon.
            </p>
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className="mt-4"
            >
              Back to Options
            </Button>
          </div>
        )
    }
  }

  const renderConfirmView = () => (
    <div className="space-y-6">
      {adjustmentResult?.success ? (
        <>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#1A2F1A] flex items-center justify-center">
              <Check className="w-8 h-8 text-[#4ADE80]" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-[#E6E9EF]">
              Adjustment Applied
            </h3>
            <p className="text-sm text-[#A4ACB8]">
              {adjustmentResult.adjustment.description}
            </p>
          </div>

          <Card className="bg-[#0F1115] border-[#2B313A]/50 p-4">
            <p className="text-sm text-[#A4ACB8] leading-relaxed">
              {adjustmentResult.coachMessage.split('\n\n')[0]}
            </p>
          </Card>

          {adjustmentResult.warnings.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-[#1F1A1A] border border-[#3D2B2B] rounded-lg">
              <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="text-xs text-[#F59E0B]">
                {adjustmentResult.warnings.join(' | ')}
              </div>
            </div>
          )}

          {/* Preserved data confirmation */}
          <div className="p-4 bg-[#1A2F1A]/30 border border-[#2D5A2D]/30 rounded-lg">
            <h4 className="text-xs font-medium text-[#4ADE80] mb-2">Preserved Data</h4>
            <div className="flex flex-wrap gap-2">
              {adjustmentResult.preservedItems.progressionHistory && (
                <span className="px-2 py-1 bg-[#2D5A2D]/30 text-xs text-[#4ADE80] rounded">
                  Progression History
                </span>
              )}
              {adjustmentResult.preservedItems.momentumScore && (
                <span className="px-2 py-1 bg-[#2D5A2D]/30 text-xs text-[#4ADE80] rounded">
                  Momentum Score
                </span>
              )}
              {adjustmentResult.preservedItems.recoveryTrends && (
                <span className="px-2 py-1 bg-[#2D5A2D]/30 text-xs text-[#4ADE80] rounded">
                  Recovery Trends
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
          >
            Continue Training
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#2F1A1A] flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-[#EF4444]" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium text-[#E6E9EF]">
              Adjustment Failed
            </h3>
            <p className="text-sm text-[#A4ACB8]">
              {adjustmentResult?.coachMessage || 'Unable to apply adjustment. Please try again.'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setView('adjustments')}
            className="w-full border-[#2B313A] text-[#E6E9EF]"
          >
            Back to Adjustments
          </Button>
        </>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {(view !== 'intercept') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="w-8 h-8 -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-[#E6E9EF]">
              {view === 'intercept' && interceptMessage.title}
              {view === 'adjustments' && (selectedCategory 
                ? ADJUSTMENT_OPTIONS.find(o => o.category === selectedCategory)?.label 
                : 'Quick Adjustments')}
              {view === 'confirm' && 'Confirmation'}
            </DialogTitle>
          </div>
          {view === 'intercept' && (
            <DialogDescription className="text-[#6B7280]">
              Your progress matters
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="pt-2">
          {view === 'intercept' && renderInterceptView()}
          {view === 'adjustments' && renderAdjustmentsView()}
          {view === 'confirm' && renderConfirmView()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
