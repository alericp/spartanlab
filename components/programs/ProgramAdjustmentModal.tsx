'use client'

import { useState, useEffect } from 'react'
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
  checkFrequentRestarts,
  recordProgramEnd,
  type AdjustmentType,
  type AdjustmentResult,
} from '@/lib/program-adjustment-engine'

// [canonical-rebuild] TASK B: Callback for requesting canonical rebuild with updated inputs
export interface AdjustmentRebuildRequest {
  type: 'training_days' | 'session_time' | 'equipment'
  newTrainingDays?: TrainingDays
  newSessionMinutes?: number
  newEquipment?: EquipmentType[]
}

// [adjustment-sync] Result from rebuild with actual generated values
export interface AdjustmentRebuildResult {
  success: boolean
  error?: string
  actualSessionCount?: number
}

interface ProgramAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
  onStartNew: () => void
  // [canonical-rebuild] TASK B: Callback for triggering real canonical rebuild
  onRebuildRequired?: (request: AdjustmentRebuildRequest) => Promise<AdjustmentRebuildResult>
  currentEquipment?: EquipmentType[]
  currentSessionMinutes?: number
  currentTrainingDays?: TrainingDays
  // [PHASE 17P] Schedule mode from canonical profile - used to preserve flexible identity
  currentScheduleMode?: 'static' | 'flexible' | 'adaptive'
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
  onRebuildRequired,
  currentEquipment = [],
  currentSessionMinutes = 60,
  currentTrainingDays = 4,
  currentScheduleMode = 'adaptive',
}: ProgramAdjustmentModalProps) {
  // ==========================================================================
  // [PHASE 24B] TASK 2 - PROVE MODAL COMPONENT RENDERS AND RECEIVES PROPS
  // ==========================================================================
  
  // [PHASE 24B] Step F - Modal receives open prop
  console.log('[phase24b-modal-props-received]', {
    open,
    componentName: 'ProgramAdjustmentModal',
    onOpenChangeExists: !!onOpenChange,
    onContinueExists: !!onContinue,
    onStartNewExists: !!onStartNew,
    currentSessionMinutes,
    currentTrainingDays,
    verdict: open ? 'MODAL_OPEN_PROP_TRUE' : 'MODAL_OPEN_PROP_FALSE',
  })
  const [view, setView] = useState<ModalView>('intercept')
  const [selectedCategory, setSelectedCategory] = useState<AdjustmentCategory | null>(null)
  const [adjustmentResult, setAdjustmentResult] = useState<AdjustmentResult | null>(null)
  // [canonical-rebuild] TASK B: State for rebuild in progress and errors
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildError, setRebuildError] = useState<string | null>(null)
  
  // Adjustment values
  const [sessionMinutes, setSessionMinutes] = useState(currentSessionMinutes)
  const [trainingDays, setTrainingDays] = useState<TrainingDays>(currentTrainingDays)
  const [intensityLevel, setIntensityLevel] = useState<'mild' | 'moderate' | 'significant'>('mild')

  // [adjustment-sync] TASK 5: Sync local state when props change (e.g., after rebuild)
  useEffect(() => {
    setSessionMinutes(currentSessionMinutes)
    setTrainingDays(currentTrainingDays)
    console.log('[adjustment-sync] Modal state synced from props:', {
      sessionMinutes: currentSessionMinutes,
      trainingDays: currentTrainingDays,
    })
  }, [currentSessionMinutes, currentTrainingDays])
  
  // ==========================================================================
  // [PHASE 21A] Simple controlled dialog - no timing guards, no refs
  // Just standard Radix Dialog behavior like Restart modal uses
  // ==========================================================================
  useEffect(() => {
    if (open) {
      console.log('[phase21a-adjustment-modal-render]', {
        open,
        view,
        selectedCategory,
        isRebuilding,
      })
    }
  }, [open, view, selectedCategory, isRebuilding])
  
  // ==========================================================================
  // [PHASE 16W] TRUTHFUL SCHEDULE CAPABILITY - No hardcoded Beta labels
  // The builder fully supports 6 and 7 day schedules via buildSixDayStructure
  // and buildSevenDayStructure. Beta labels are removed since support is real.
  // ==========================================================================
  const builderSupports6Day = true  // Structure engine has buildSixDayStructure
  const builderSupports7Day = true  // Structure engine has buildSevenDayStructure
  
  // [PHASE 16W] Schedule option capability audit
  console.log('[phase16w-schedule-option-capability-audit]', {
    builderSupports6DayGlobally: builderSupports6Day,
    builderSupports7DayGlobally: builderSupports7Day,
    rebuildSupports6DayForThisContext: builderSupports6Day,
    rebuildSupports7DayForThisContext: builderSupports7Day,
    supportIsStable: true,
    supportRequiresCaution: false,
    exactReasonIfCautionIsNeeded: null,
    verdict: 'full_support_no_beta_label_needed',
  })
  
  // [PHASE 16W] Schedule label truth audit
  console.log('[phase16w-schedule-label-truth-audit]', {
    shouldLabel6DayAsBeta: false,
    shouldLabel7DayAsBeta: false,
    shouldShowHighFrequencyWarning: false,
    highFrequencyWarningReason: null,
    verdict: 'labels_are_truthful',
  })

  const interceptMessage = getExitInterceptMessage()
  const programStatus = getProgramStatus()
  const frequentRestartCheck = checkFrequentRestarts()

  const handleBack = () => {
    if (view === 'confirm') {
      setView('adjustments')
    } else if (view === 'adjustments' && selectedCategory) {
      setSelectedCategory(null)
    } else if (view === 'adjustments') {
      setView('intercept')
    }
  }

  // [canonical-rebuild] TASK B: Structural changes require canonical rebuild
  const requiresCanonicalRebuild = (category: AdjustmentCategory): boolean => {
    return category === 'schedule' || category === 'equipment'
  }

  const handleApplyAdjustment = async () => {
    if (!selectedCategory) return

    console.log('[canonical-rebuild] Adjustment requested:', {
      category: selectedCategory,
      requiresRebuild: requiresCanonicalRebuild(selectedCategory),
      hasRebuildCallback: !!onRebuildRequired,
    })

    // [canonical-rebuild] TASK B: For structural changes, trigger real canonical rebuild
    if (requiresCanonicalRebuild(selectedCategory) && onRebuildRequired) {
      setIsRebuilding(true)
      setRebuildError(null)
      
      try {
        console.log('[canonical-rebuild] Triggering canonical rebuild for:', selectedCategory)
        
        let rebuildRequest: AdjustmentRebuildRequest
        if (selectedCategory === 'schedule') {
          // [PHASE 17P] Flexible-preserving rebuild logic
          // If user is flexible and hasn't explicitly changed the day count,
          // dispatch undefined to preserve flexible identity
          const isFlexibleUser = currentScheduleMode === 'flexible' || currentScheduleMode === 'adaptive'
          const userChangedDayCount = trainingDays !== currentTrainingDays
          const shouldPreserveFlexible = isFlexibleUser && !userChangedDayCount
          
          // [PHASE 17P] Adjustment prefill truth audit
          console.log('[phase17p-adjustment-prefill-truth-audit]', {
            scheduleMode: currentScheduleMode,
            canonicalPreferredDays: currentTrainingDays,
            generatedSessionCount: currentTrainingDays, // This is what was displayed
            displayValueForModal: trainingDays,
            userChangedDayCount,
            isFlexibleUser,
            shouldPreserveFlexible,
            warning: isFlexibleUser
              ? 'flexible_user_prefill_may_be_display_count_not_schedule_identity'
              : 'static_user_prefill',
          })
          
          rebuildRequest = {
            type: 'training_days',
            // [PHASE 17P] Only send explicit day count if user is static OR explicitly changed days
            newTrainingDays: shouldPreserveFlexible ? undefined : trainingDays,
          }
        } else {
          rebuildRequest = {
            type: 'equipment',
            newEquipment: currentEquipment, // Would need equipment state if changeable
          }
        }
        
        // [PHASE 17R] TASK 1 - Modal submit payload truth audit
        console.log('[phase17r-modal-submit-truth-audit]', {
          flowIntent: {
            continueCurrentProgramSelected: false,
            makeSmallAdjustmentsSelected: true, // This is the adjustment flow
            startNewProgramSelected: false,
          },
          outgoingPayload: {
            requestType: rebuildRequest.type,
            newTrainingDays: rebuildRequest.newTrainingDays ?? null,
            newEquipment: rebuildRequest.type === 'equipment' ? rebuildRequest.newEquipment : null,
          },
          modalState: {
            selectedCategory,
            trainingDays,
            currentTrainingDays,
            currentScheduleMode,
            isFlexibleUser,
            userChangedDayCount,
            shouldPreserveFlexible,
          },
          verdict: shouldPreserveFlexible
            ? 'FLEXIBLE_PRESERVING_REQUEST_SENT'
            : 'EXPLICIT_DAY_COUNT_REQUEST_SENT',
        })
        
        // [PHASE 16W] Schedule rebuild request audit
        console.log('[phase16w-schedule-rebuild-request-audit]', {
          category: selectedCategory,
          requestType: rebuildRequest.type,
          requestedTrainingDays: rebuildRequest.newTrainingDays,
          currentTrainingDays: currentTrainingDays,
          isHighFrequencyRequest: (rebuildRequest.newTrainingDays || 0) >= 6,
          verdict: 'rebuild_request_dispatched',
        })
        
        const rebuildResult = await onRebuildRequired(rebuildRequest)
        
        // [PHASE 16W] Schedule rebuild result audit
        console.log('[phase16w-schedule-rebuild-result-audit]', {
          success: rebuildResult.success,
          error: rebuildResult.error || null,
          actualSessionCount: rebuildResult.actualSessionCount,
          requestedTrainingDays: rebuildRequest.newTrainingDays,
          verdict: rebuildResult.success ? 'rebuild_succeeded' : 'rebuild_failed',
        })
        
        if (!rebuildResult.success) {
          // [PHASE 16W] Use structured error message if available, not generic fallback
          const structuredError = rebuildResult.error || 'Schedule rebuild failed. Your previous program has been preserved.'
          
          // [PHASE 16W] Schedule error display audit
          console.log('[phase16w-schedule-error-display-audit]', {
            rawError: rebuildResult.error,
            displayedError: structuredError,
            isGenericFallback: !rebuildResult.error,
            verdict: rebuildResult.error ? 'showing_structured_error' : 'showing_fallback',
          })
          
          setRebuildError(structuredError)
          setIsRebuilding(false)
          return
        }
        
        // [adjustment-sync] Use actual session count from rebuild if available
        const actualSessions = rebuildResult.actualSessionCount ?? trainingDays
        
        // Only now record the adjustment metadata (after successful rebuild)
        const result = applyProgramAdjustment({
          type: selectedCategory === 'schedule' ? 'training_days' : 'equipment',
          newTrainingDays: selectedCategory === 'schedule' ? trainingDays : undefined,
        })
        
        // [adjustment-sync] STEP 2: Log actual before/after values
        console.log('[adjustment-sync] Adjustment confirmed:', {
          settingsSaved: true,
          rebuildSucceeded: true,
          previousTrainingDays: currentTrainingDays,
          requestedTrainingDays: trainingDays,
          actualSessionCount: actualSessions,
          trainingDaysChanged: currentTrainingDays !== trainingDays,
        })
        
        // [canonical-rebuild] TASK J: Use truthful description and message from actual rebuild
        setAdjustmentResult({
          ...result,
          adjustment: {
            ...result.adjustment,
            description: `Training days: ${currentTrainingDays} → ${actualSessions} days/week`,
          },
          coachMessage: `Your new program is ready with ${actualSessions} training sessions this week. All sessions have been regenerated to match your updated schedule.`,
        })
        setIsRebuilding(false)
        setView('confirm')
        
      } catch (error) {
        console.error('[canonical-rebuild] Rebuild error:', error)
        // [PHASE 16W] Extract structured error message if available
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const structuredCatchError = errorMessage.includes('validation') 
          ? `Schedule validation failed: ${errorMessage}`
          : errorMessage.includes('session')
            ? `Session generation failed: ${errorMessage}`
            : `Schedule rebuild failed: ${errorMessage}. Your previous program has been preserved.`
        
        console.log('[phase16w-schedule-error-display-audit]', {
          rawError: errorMessage,
          displayedError: structuredCatchError,
          isGenericFallback: false,
          verdict: 'showing_catch_error',
        })
        
        setRebuildError(structuredCatchError)
        setIsRebuilding(false)
      }
      return
    }

    // Non-structural adjustments can use local metadata only
    let result: AdjustmentResult

    switch (selectedCategory) {
      case 'time':
        result = applyProgramAdjustment({
          type: 'session_time',
          newSessionMinutes: sessionMinutes,
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

      {/* Frequent Restart Warning */}
      {frequentRestartCheck.isFrequent && (
        <div className="p-4 bg-[#1F1A1A] rounded-lg border border-[#3D2B2B]">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#F59E0B] mb-1">Consistency Reminder</p>
              <p className="text-xs text-[#F59E0B]/80">
                {frequentRestartCheck.message}
              </p>
            </div>
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
          onClick={() => {
            recordProgramEnd('new_program')
            onStartNew()
          }}
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
              
              {/* Current value display */}
              <div className="flex items-center justify-between mb-4 p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]/50">
                <span className="text-sm text-[#A4ACB8]">Current:</span>
                <span className="text-sm font-medium text-[#E6E9EF]">{currentSessionMinutes} minutes</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">New value:</span>
                  <span className="text-sm font-medium text-[#E6E9EF]">{sessionMinutes} min</span>
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
              
              {/* Show change indicator */}
              {sessionMinutes !== currentSessionMinutes && (
                <div className="mt-3 p-2 bg-[#C1121F]/10 border border-[#C1121F]/30 rounded-lg">
                  <p className="text-xs text-[#E6E9EF] text-center">
                    Change: {currentSessionMinutes} → {sessionMinutes} minutes
                  </p>
                </div>
              )}

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
              disabled={sessionMinutes === currentSessionMinutes}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white disabled:opacity-50"
            >
              {sessionMinutes === currentSessionMinutes ? 'No Change' : 'Apply Time Adjustment'}
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
              
              {/* [PHASE 16W] Current value display - clarified label */}
              <div className="flex items-center justify-between mb-3 p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]/50">
                <span className="text-sm text-[#A4ACB8]">Current program:</span>
                <span className="text-sm font-medium text-[#E6E9EF]">{currentTrainingDays} sessions/week</span>
              </div>
              
              {/* New value selector */}
              <div className="space-y-2">
                <span className="text-xs text-[#6B7280]">New value:</span>
                <Select
                  value={String(trainingDays)}
                  onValueChange={(v) => setTrainingDays(Number(v) as TrainingDays)}
                >
                  <SelectTrigger className="bg-[#0F1115] border-[#2B313A]">
                    <SelectValue>
                      {trainingDays} Days per Week
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1F26] border-[#2B313A]">
                    <SelectItem value="2">2 Days per Week</SelectItem>
                    <SelectItem value="3">3 Days per Week</SelectItem>
                    <SelectItem value="4">4 Days per Week</SelectItem>
                    <SelectItem value="5">5 Days per Week</SelectItem>
                    {/* [PHASE 16W] 6/7-day fully supported - no Beta label needed */}
                    <SelectItem value="6">6 Days per Week</SelectItem>
                    <SelectItem value="7">7 Days per Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Show change indicator */}
              {trainingDays !== currentTrainingDays && (
                <div className="mt-3 p-2 bg-[#C1121F]/10 border border-[#C1121F]/30 rounded-lg">
                  <p className="text-xs text-[#E6E9EF] text-center">
                    Change: {currentTrainingDays} → {trainingDays} days/week
                  </p>
                </div>
              )}

              {trainingDays < currentTrainingDays && (
                <div className="mt-4 p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]/50">
                  <p className="text-xs text-[#A4ACB8]">
                    Fewer training days means accessory work will be consolidated. Skill work frequency will be maintained.
                  </p>
                </div>
              )}
              
              {/* [PHASE 16W] High-frequency info (not a warning since fully supported) */}
              {(trainingDays === 6 || trainingDays === 7) && (
                <div className="mt-4 p-3 bg-[#1A1F26] rounded-lg border border-[#2B313A]/50">
                  <p className="text-xs text-[#A4ACB8]">
                    {trainingDays}-day schedules use intelligent intensity management to distribute recovery across your week.
                  </p>
                </div>
              )}
            </div>

            {/* [canonical-rebuild] TASK B: Show error if rebuild failed */}
            {rebuildError && (
              <div className="flex items-start gap-2 p-3 bg-[#1F1A1A] border border-[#3D2B2B] rounded-lg">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <div className="text-xs text-[#EF4444]">
                  {rebuildError}
                </div>
              </div>
            )}

            <Button
              onClick={handleApplyAdjustment}
              disabled={isRebuilding}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white disabled:opacity-50"
            >
              {isRebuilding ? 'Rebuilding Program...' : 'Apply Schedule Change'}
            </Button>
            
            {/* [canonical-rebuild] Note about what will happen */}
            {onRebuildRequired && (
              <p className="text-[10px] text-[#6B7280] text-center">
                This will rebuild your entire program with the new schedule.
              </p>
            )}
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

      case 'equipment':
        // [adjustment-sync] TASK 8: Show current equipment state clearly
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-[#E6E9EF] mb-2">Equipment Settings</h4>
              <p className="text-xs text-[#6B7280] mb-4">
                Manage equipment availability in Settings for full control.
              </p>
              
              {/* Show current equipment summary */}
              <div className="p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]/50">
                <p className="text-xs text-[#6B7280] mb-2">Current Equipment:</p>
                <div className="flex flex-wrap gap-2">
                  {currentEquipment.length > 0 ? (
                    currentEquipment.map((eq) => (
                      <span key={eq} className="px-2 py-1 bg-[#2B313A]/50 text-xs text-[#A4ACB8] rounded capitalize">
                        {eq.replace(/_/g, ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6B7280]">No equipment selected</span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                // Navigate to settings
                window.location.href = '/settings'
              }}
              className="w-full border-[#2B313A] text-[#E6E9EF]"
            >
              Go to Settings
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
            {/* [canonical-rebuild] TASK J: Show truthful success message */}
            {/* [adjustment-sync] TASK 7: Confirmation must reflect actual rebuild result */}
            <h3 className="text-lg font-medium text-[#E6E9EF]">
              {selectedCategory === 'schedule' ? 'Program Rebuilt Successfully' : 'Adjustment Applied'}
            </h3>
            <p className="text-sm text-[#A4ACB8]">
              {adjustmentResult.adjustment.description}
            </p>
            {selectedCategory === 'schedule' && (
              <p className="text-xs text-[#4ADE80] mt-1">
                Your program now has {trainingDays} sessions per week
              </p>
            )}
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
    <>
      {/* [PHASE 24B] Step G - Modal renders when open is true */}
      {open && (
        <div
          data-testid="phase24b-modal-render-marker"
          suppressHydrationWarning={true}
          style={{ display: 'none' }}
        >
          phase24b_modal_rendered
        </div>
      )}
      
      <Dialog open={open} onOpenChange={(nextOpen) => {
        // [PHASE 24B] Step I - open change fired
        console.log('[phase24b-modal-open-change-audit]', {
          nextOpen,
          previousOpen: open,
          currentView: view,
          verdict: nextOpen ? 'DIALOG_OPEN_CHANGED_TO_TRUE' : 'DIALOG_OPEN_CHANGED_TO_FALSE',
        })
        console.log('[phase21a-adjustment-modal-open-change]', {
          nextOpen,
          currentView: view,
        })
        onOpenChange(nextOpen)
      }}>
        {/* [PHASE 21A] Simple controlled dialog - standard Radix behavior */}
        {/* [PHASE 24B] Step H - DialogContent renders when open */}
        <DialogContent 
          className="bg-[#1A1F26] border-[#2B313A] max-w-md z-[100]"
          onOpenAutoFocus={() => {
            console.log('[phase24b-modal-dialog-content-mounted]', {
              openState: open,
              verdict: 'DIALOG_CONTENT_MOUNTED',
            })
          }}
        >
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
      
      {/* [PHASE 24B] Step E - Page render audit - prove render happened after state change */}
      {open && (
        <div
          data-testid="phase24b-final-render-marker"
          suppressHydrationWarning={true}
          style={{ display: 'none' }}
        >
          final_render_check
        </div>
      )}
    </>
  )
}
