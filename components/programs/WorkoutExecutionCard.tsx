'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { AdaptiveSession, AdaptiveExercise } from '@/lib/adaptive-program-builder'
import {
  exerciseSupportsRPE,
  generateExerciseRPEConfig,
  calculateSetAdjustment,
  formatRestTime,
  formatRestChange,
  RPE_QUICK_OPTIONS,
  type RPEValue,
  type SetAdjustment,
  type ExerciseRPEConfig,
  type CompletedSet,
  type SetHistory,
  type FatigueSignal,
} from '@/lib/rpe-adjustment-engine'
import { recordRPESession, quickFatigueCheck, type StoredRPESession } from '@/lib/fatigue-engine'
import { 
  RestTimer, 
  RestIndicator, 
  AdaptiveRestSummary,
  type RestAdjustmentInfo,
  type NextSetGuidance,
} from '@/components/workout/RestTimer'
import {
  Play,
  Pause,
  Check,
  ChevronRight,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Zap,
} from 'lucide-react'

import type { UseWorkoutSessionReturn } from '@/hooks/useWorkoutSession'

interface WorkoutExecutionCardProps {
  session: AdaptiveSession
  onComplete: () => void
  onCancel: () => void
  sessionState?: UseWorkoutSessionReturn
}

interface ExerciseProgress {
  exerciseIndex: number
  currentSet: number
  completedSets: CompletedSetRecord[]
  setHistory: SetHistory[]
  lastAdjustment: SetAdjustment | null
  accumulatedFatigue: FatigueSignal | null
}

interface CompletedSetRecord {
  setNumber: number
  actualReps: number
  actualRPE: RPEValue
  prescribedRPE: RPEValue
  adjustment: SetAdjustment | null
}

export function WorkoutExecutionCard({ session, onComplete, onCancel, sessionState }: WorkoutExecutionCardProps) {
  const [progress, setProgress] = useState<ExerciseProgress>({
    exerciseIndex: 0,
    currentSet: 1,
    completedSets: [],
    setHistory: [],
    lastAdjustment: null,
    accumulatedFatigue: null,
  })
  const [isResting, setIsResting] = useState(false)
  const [currentRestSeconds, setCurrentRestSeconds] = useState(0)
  const [adjustedRestSeconds, setAdjustedRestSeconds] = useState<number | undefined>(undefined)
  const [restAdjustmentInfo, setRestAdjustmentInfo] = useState<RestAdjustmentInfo | undefined>(undefined)
  const [selectedRPE, setSelectedRPE] = useState<RPEValue | null>(null)
  const [actualReps, setActualReps] = useState<number | null>(null)
  const [showSetComplete, setShowSetComplete] = useState(false)
  
  // Track all RPE data for fatigue engine
  const [sessionRPEData, setSessionRPEData] = useState<StoredRPESession['exercises']>([])
  
  // Session-level fatigue check (runs once at workout start)
  const [sessionFatigueCheck] = useState(() => {
    if (typeof window !== 'undefined') {
      return quickFatigueCheck()
    }
    return null
  })

  const currentExercise = session.exercises[progress.exerciseIndex]
  const rpeConfig = currentExercise
    ? generateExerciseRPEConfig(
        currentExercise.id,
        currentExercise.name,
        currentExercise.category,
        currentExercise.sets,
        currentExercise.repsOrTime
      )
    : null

  const currentPrescribedSet = rpeConfig?.sets[progress.currentSet - 1]
  const supportsRPE = rpeConfig !== null

  // Parse target reps from exercise
  const getTargetReps = (): number => {
    if (!currentExercise) return 5
    const match = currentExercise.repsOrTime.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 5
  }

  // Handle rest timer completion
  const handleRestComplete = useCallback(() => {
    // Timer finished - user can proceed when ready
  }, [])

  // Skip rest and proceed immediately
  const handleSkipRest = useCallback(() => {
    setIsResting(false)
    setShowSetComplete(false)
    setProgress((prev) => ({
      ...prev,
      currentSet: prev.currentSet + 1,
    }))
  }, [])

  const handleSetComplete = () => {
    if (!currentExercise) return

    let adjustment: SetAdjustment | null = null
    const prescribedRPE = currentPrescribedSet?.prescribedRPE ?? 8

    // Calculate adjustment if RPE is supported and entered
    if (supportsRPE && selectedRPE !== null && currentPrescribedSet) {
      const completedSet: CompletedSet = {
        setNumber: progress.currentSet,
        actualReps: actualReps ?? getTargetReps(),
        actualRPE: selectedRPE,
        prescribedRPE: currentPrescribedSet.prescribedRPE,
        prescribedRestSeconds: currentPrescribedSet.prescribedRestSeconds,
      }
      // Pass set history for fatigue detection
      adjustment = calculateSetAdjustment(completedSet, progress.setHistory)
    }

    // Build new set history entry
    const newSetHistory: SetHistory[] = supportsRPE && selectedRPE !== null
      ? [
          ...progress.setHistory,
          {
            setNumber: progress.currentSet,
            actualRPE: selectedRPE,
            prescribedRPE: prescribedRPE as RPEValue,
            rpeDelta: selectedRPE - prescribedRPE,
          },
        ]
      : progress.setHistory

    // Record completed set
    const newCompletedSets: CompletedSetRecord[] = [
      ...progress.completedSets,
      {
        setNumber: progress.currentSet,
        actualReps: actualReps ?? getTargetReps(),
        actualRPE: selectedRPE ?? 8,
        prescribedRPE: prescribedRPE as RPEValue,
        adjustment,
      },
    ]
    
    // Record to session state if available (for session lifecycle tracking)
    if (sessionState) {
      sessionState.recordSet({
        targetReps: getTargetReps(),
        actualReps: actualReps ?? getTargetReps(),
        targetRPE: prescribedRPE,
        actualRPE: selectedRPE ?? 8,
        restSeconds: currentPrescribedSet?.prescribedRestSeconds ?? 120,
      })
    }
    
    // Track RPE data for fatigue engine
    if (supportsRPE && selectedRPE !== null) {
      setSessionRPEData((prev) => {
        // Find or create exercise entry
        const existingIndex = prev.findIndex((e) => e.exerciseName === currentExercise.name)
        const setData = {
          setNumber: progress.currentSet,
          targetRPE: prescribedRPE,
          actualRPE: selectedRPE,
          targetReps: getTargetReps(),
          actualReps: actualReps ?? getTargetReps(),
        }
        
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            sets: [...updated[existingIndex].sets, setData],
          }
          return updated
        } else {
          return [
            ...prev,
            {
              exerciseName: currentExercise.name,
              sets: [setData],
            },
          ]
        }
      })
    }

    // Check if this was the last set of the exercise
    const isLastSet = progress.currentSet >= currentExercise.sets

    if (isLastSet) {
      // Move to next exercise
      const isLastExercise = progress.exerciseIndex >= session.exercises.length - 1

      if (isLastExercise) {
        // Workout complete - record session data for fatigue engine
        const sessionId = `session-${Date.now()}`
        const finalSessionData = supportsRPE && selectedRPE !== null
          ? [...sessionRPEData, {
              exerciseName: currentExercise.name,
              sets: [...(sessionRPEData.find(e => e.exerciseName === currentExercise.name)?.sets ?? []), {
                setNumber: progress.currentSet,
                targetRPE: prescribedRPE,
                actualRPE: selectedRPE,
                targetReps: getTargetReps(),
                actualReps: actualReps ?? getTargetReps(),
              }].filter((s, i, arr) => arr.findIndex(x => x.setNumber === s.setNumber) === i),
            }].filter((e, i, arr) => arr.findIndex(x => x.exerciseName === e.exerciseName) === i)
          : sessionRPEData
          
        if (finalSessionData.length > 0) {
          recordRPESession({
            sessionId,
            sessionDate: new Date().toISOString(),
            exercises: finalSessionData,
          })
        }
        
        onComplete()
        return
      }

      // Show set complete feedback briefly, then move to next exercise
      setShowSetComplete(true)
      setProgress((prev) => ({
        ...prev,
        lastAdjustment: adjustment,
        accumulatedFatigue: adjustment?.fatigueSignal ?? null,
      }))

      setTimeout(() => {
        setProgress({
          exerciseIndex: progress.exerciseIndex + 1,
          currentSet: 1,
          completedSets: [],
          setHistory: [], // Reset history for new exercise
          lastAdjustment: null,
          accumulatedFatigue: null,
        })
        setShowSetComplete(false)
        setSelectedRPE(null)
        setActualReps(null)
      }, 1500)
    } else {
      // Start rest period
      const prescribedRest = currentPrescribedSet?.prescribedRestSeconds ?? 120
      const adjustedRest = adjustment?.adjustedRestSeconds
      setCurrentRestSeconds(prescribedRest)
      setAdjustedRestSeconds(adjustedRest !== prescribedRest ? adjustedRest : undefined)
      
      // Build adjustment info for display
      if (adjustment && adjustedRest !== prescribedRest) {
        const delta = (adjustedRest ?? prescribedRest) - prescribedRest
        setRestAdjustmentInfo({
          reason: adjustment.explanation,
          type: delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'none',
          delta,
        })
      } else {
        setRestAdjustmentInfo(undefined)
      }
      
      setIsResting(true)
      setShowSetComplete(true)

      setProgress((prev) => ({
        ...prev,
        completedSets: newCompletedSets,
        setHistory: newSetHistory,
        lastAdjustment: adjustment,
        accumulatedFatigue: adjustment?.fatigueSignal ?? null,
      }))

      // Reset inputs for next set
      setSelectedRPE(null)
      setActualReps(null)

      // After rest complete message shown, advance to next set
      setTimeout(() => {
        setShowSetComplete(false)
        setProgress((prev) => ({
          ...prev,
          currentSet: prev.currentSet + 1,
        }))
      }, 2000)
    }
  }

  const proceedToNextSet = () => {
    setIsResting(false)
    setShowSetComplete(false)
    setProgress((prev) => ({
      ...prev,
      currentSet: prev.currentSet + 1,
    }))
  }

  const skipExercise = () => {
    const isLastExercise = progress.exerciseIndex >= session.exercises.length - 1
    if (isLastExercise) {
      onComplete()
    } else {
      setProgress({
        exerciseIndex: progress.exerciseIndex + 1,
        currentSet: 1,
        completedSets: [],
        setHistory: [],
        lastAdjustment: null,
        accumulatedFatigue: null,
      })
      setSelectedRPE(null)
      setActualReps(null)
      setIsResting(false)
    }
  }

  if (!currentExercise) {
    return null
  }

  // Build next-set guidance for timer
  const buildNextSetGuidance = (): NextSetGuidance | undefined => {
    if (!progress.lastAdjustment) return undefined

    const repTarget = progress.lastAdjustment.repAdjustment?.suggestChange
      ? `${progress.lastAdjustment.repAdjustment.repRange} reps`
      : `${getTargetReps()} reps`

    const loadSuggestion = progress.lastAdjustment.loadAdjustment?.suggestChange
      ? progress.lastAdjustment.loadAdjustment.suggestion
      : undefined

    return {
      message: progress.lastAdjustment.guidance,
      repTarget,
      loadSuggestion,
      emphasis: progress.lastAdjustment.guidanceType === 'caution' ? 'caution' : 'maintain',
    }
  }

  // Show rest screen
  if (isResting) {
    const nextSetGuidance = buildNextSetGuidance()

    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-6">
        <div className="space-y-5">
          {/* Rest Timer with Integrated Guidance */}
<RestTimer
  prescribedSeconds={currentRestSeconds}
  adjustedSeconds={adjustedRestSeconds}
  adjustmentInfo={restAdjustmentInfo}
  nextSetGuidance={nextSetGuidance}
  onComplete={handleRestComplete}
  onSkip={handleSkipRest}
  onReady={proceedToNextSet}
  showProgress={true}
  autoStart={false}
  sessionPaused={sessionState?.isPaused}
  />

          {/* Fatigue Warning - only show if severe */}
          {progress.lastAdjustment?.fatigueSignal?.warning && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">
                  {progress.lastAdjustment.fatigueSignal.warning}
                </p>
              </div>
            </div>
          )}

          {/* Compact Next Set Preview */}
          <div className="bg-[#0F1115] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] mb-0.5">Up Next</p>
                <p className="font-medium text-[#E6E9EF]">
                  Set {progress.currentSet + 1} of {currentExercise.sets}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#A4ACB8]">
                  {progress.lastAdjustment?.repAdjustment?.suggestChange ? (
                    <span className="text-amber-400">{progress.lastAdjustment.repAdjustment.repRange}</span>
                  ) : (
                    <span>{getTargetReps()}</span>
                  )}
                  {' reps'}
                </p>
                <p className="text-xs text-[#6B7280]">
                  RPE {rpeConfig?.sets[progress.currentSet]?.prescribedRPE ?? 8}
                </p>
              </div>
            </div>
            {/* Load guidance reminder */}
            {progress.lastAdjustment?.loadAdjustment && (
              <div className="mt-2 pt-2 border-t border-[#2B313A]">
                <div className="flex items-center gap-2 text-xs">
                  <Target className="w-3 h-3 text-[#6B7280]" />
                  <span className="text-[#A4ACB8]">
                    {progress.lastAdjustment.loadAdjustment.suggestion}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Proceed Button */}
          <Button
            className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            onClick={proceedToNextSet}
          >
            Ready for Next Set
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden relative">
      {/* Session-level Fatigue Guidance Banner */}
      {sessionFatigueCheck?.needsAttention && progress.exerciseIndex === 0 && progress.currentSet === 1 && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-400">
              {sessionFatigueCheck.score >= 60 
                ? 'Fatigue signals elevated. Focus on quality over volume today.'
                : 'Fatigue trending upward. Monitor effort levels.'}
            </p>
          </div>
        </div>
      )}
      
      {/* Exercise Header */}
      <div className="p-4 border-b border-[#2B313A]">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-xs uppercase">
            {currentExercise.category}
          </Badge>
          <span className="text-xs text-[#6B7280]">
            Exercise {progress.exerciseIndex + 1} of {session.exercises.length}
          </span>
        </div>
        <h3 className="text-xl font-bold text-[#E6E9EF]">{currentExercise.name}</h3>
        {currentExercise.note && (
          <p className="text-sm text-[#A4ACB8] mt-1">{currentExercise.note}</p>
        )}
      </div>

      {/* Current Set Info */}
      <div className="p-4 space-y-4">
        {/* Set Progress Indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: currentExercise.sets }).map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-colors ${
                idx < progress.currentSet - 1
                  ? 'bg-green-500'
                  : idx === progress.currentSet - 1
                  ? 'bg-[#C1121F]'
                  : 'bg-[#2B313A]'
              }`}
            />
          ))}
        </div>
        
        {/* Fatigue Indicator */}
        {progress.accumulatedFatigue && progress.accumulatedFatigue.level !== 'none' && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            progress.accumulatedFatigue.level === 'high'
              ? 'bg-red-500/10 text-red-400'
              : progress.accumulatedFatigue.level === 'moderate'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              {progress.accumulatedFatigue.level === 'high' && 'High fatigue - preserve quality'}
              {progress.accumulatedFatigue.level === 'moderate' && 'Fatigue accumulating'}
              {progress.accumulatedFatigue.level === 'mild' && 'Slight fatigue detected'}
            </span>
          </div>
        )}

        {/* Set Details */}
        <div className="bg-[#0F1115] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-[#E6E9EF]">
              Set {progress.currentSet} of {currentExercise.sets}
            </span>
            {supportsRPE && (
              <Badge className="bg-[#C1121F]/10 text-[#C1121F] border-0">
                <Zap className="w-3 h-3 mr-1" />
                RPE Tracked
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Target Reps</p>
              <p className="text-2xl font-bold text-[#E6E9EF]">{currentExercise.repsOrTime}</p>
            </div>
            {supportsRPE && currentPrescribedSet && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Prescribed RPE</p>
                <p className="text-2xl font-bold text-[#C1121F]">{currentPrescribedSet.prescribedRPE}</p>
              </div>
            )}
          </div>
          
          {/* Planned Rest Indicator */}
          {currentPrescribedSet && (
            <div className="mt-3 pt-3 border-t border-[#2B313A]">
              <RestIndicator prescribedSeconds={currentPrescribedSet.prescribedRestSeconds} />
            </div>
          )}
        </div>

        {/* RPE Input Section */}
        {supportsRPE && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#E6E9EF]">After completing the set, enter your actual RPE:</p>
            
            {/* RPE Quick Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {RPE_QUICK_OPTIONS.map((rpe) => (
                <Button
                  key={rpe}
                  variant={selectedRPE === rpe ? 'default' : 'outline'}
                  className={
                    selectedRPE === rpe
                      ? 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
                      : 'border-[#2B313A] text-[#A4ACB8] hover:border-[#C1121F] hover:text-[#E6E9EF]'
                  }
                  onClick={() => setSelectedRPE(rpe)}
                >
                  {rpe}
                </Button>
              ))}
            </div>

            {/* RPE Description */}
            {selectedRPE && (
              <p className="text-xs text-[#6B7280] text-center">
                {selectedRPE <= 6 && 'Easy - Could do many more reps'}
                {selectedRPE === 6.5 && 'Moderate-easy effort'}
                {selectedRPE === 7 && 'Moderate - 3+ reps in reserve'}
                {selectedRPE === 7.5 && 'Moderate-hard - 2-3 reps in reserve'}
                {selectedRPE === 8 && 'Hard - 2 reps in reserve'}
                {selectedRPE === 8.5 && 'Very hard - 1-2 reps in reserve'}
                {selectedRPE === 9 && 'Near max - 1 rep in reserve'}
                {selectedRPE === 9.5 && 'Almost max - Possibly 1 more'}
                {selectedRPE === 10 && 'Max effort - No more reps possible'}
              </p>
            )}

            {/* Actual Reps Input (optional) */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#6B7280]">Actual reps:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#2B313A] w-8 h-8 p-0"
                  onClick={() => setActualReps((prev) => Math.max(1, (prev ?? getTargetReps()) - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium text-[#E6E9EF]">
                  {actualReps ?? getTargetReps()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#2B313A] w-8 h-8 p-0"
                  onClick={() => setActualReps((prev) => (prev ?? getTargetReps()) + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Set Button */}
        <Button
          className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white py-6 text-lg"
          onClick={handleSetComplete}
          disabled={supportsRPE && selectedRPE === null}
        >
          <Check className="w-5 h-5 mr-2" />
          Complete Set {progress.currentSet}
        </Button>

        {/* Skip Exercise */}
        <Button
          variant="ghost"
          className="w-full text-[#6B7280] hover:text-[#A4ACB8]"
          onClick={skipExercise}
        >
          Skip Exercise
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Set Complete Feedback Overlay */}
      {showSetComplete && (
        <div className="absolute inset-0 bg-[#0F1115]/95 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-xl font-bold text-[#E6E9EF]">Set Complete!</p>
            {progress.lastAdjustment && (
              <p className="text-sm text-[#A4ACB8] mt-2">
                {progress.lastAdjustment.guidance}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// =============================================================================
// WORKOUT START BUTTON
// =============================================================================

interface StartWorkoutButtonProps {
  session: AdaptiveSession
  onStart: () => void
}

export function StartWorkoutButton({ session, onStart }: StartWorkoutButtonProps) {
  const rpeExerciseCount = session.exercises.filter((e) =>
    exerciseSupportsRPE(e.name)
  ).length

  return (
    <div className="bg-gradient-to-r from-[#C1121F]/10 to-[#1A1F26] border border-[#C1121F]/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-[#E6E9EF]">Start Workout</p>
          <p className="text-sm text-[#A4ACB8]">
            {session.exercises.length} exercises
            {rpeExerciseCount > 0 && ` • ${rpeExerciseCount} with RPE tracking`}
          </p>
        </div>
        <Button
          onClick={onStart}
          className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2"
        >
          <Play className="w-4 h-4" />
          Start
        </Button>
      </div>
    </div>
  )
}
