'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  SkipForward, 
  Plus, 
  Minus,
  Clock,
  CheckCircle2,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { 
  type RestRecommendation, 
  formatRestDuration,
  REST_CATEGORY_LABELS,
  saveRestTimerState,
  clearRestTimerState,
  type RestTimerState,
} from '@/lib/rest-intelligence'
// [EXECUTION-TRUTH-FIX] Timer alert for completion
import { playTimerCompletionAlert } from '@/lib/workout-execution-truth'

// =============================================================================
// TYPES
// =============================================================================

interface InlineRestTimerProps {
  recommendation: RestRecommendation
  exerciseIndex: number
  setNumber: number
  nextSetInfo?: {
    exerciseName: string
    setNumber: number
    isNewExercise: boolean
  }
  initialState?: RestTimerState | null
  onComplete: () => void
  onSkip: () => void
}

// =============================================================================
// INLINE REST TIMER COMPONENT
// =============================================================================

export function InlineRestTimer({
  recommendation,
  exerciseIndex,
  setNumber,
  nextSetInfo,
  initialState,
  onComplete,
  onSkip,
}: InlineRestTimerProps) {
  // Calculate initial time, accounting for restored state
  const getInitialTime = useCallback(() => {
    if (initialState && 
        initialState.exerciseIndex === exerciseIndex && 
        initialState.setNumber === setNumber) {
      // Restore from saved state
      if (initialState.isPaused) {
        return initialState.remainingSeconds
      }
      // Calculate remaining based on elapsed time
      const elapsedSinceStart = Math.floor((Date.now() - initialState.startedAt) / 1000)
      return Math.max(0, initialState.remainingSeconds - elapsedSinceStart)
    }
    return recommendation.adjustedSeconds
  }, [initialState, exerciseIndex, setNumber, recommendation.adjustedSeconds])

  const [timeRemaining, setTimeRemaining] = useState(getInitialTime)
  const [totalTime, setTotalTime] = useState(recommendation.adjustedSeconds)
  const [isRunning, setIsRunning] = useState(!initialState?.isPaused)
  const [isComplete, setIsComplete] = useState(false)
  const startedAtRef = useRef<number>(initialState?.startedAt || Date.now())
  const lastTickRef = useRef<number>(Date.now())

  // Auto-start on mount (unless restoring paused state)
  useEffect(() => {
    if (!initialState?.isPaused) {
      setIsRunning(true)
      startedAtRef.current = Date.now()
    }
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning || isComplete) return

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - lastTickRef.current) / 1000)
      
      if (elapsed >= 1) {
        lastTickRef.current = now
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - elapsed)
          if (newTime === 0) {
            setIsComplete(true)
            setIsRunning(false)
            clearRestTimerState()
            // [EXECUTION-TRUTH-FIX] Play timer completion alert
            playTimerCompletionAlert()
          }
          return newTime
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning, isComplete])

  // Save state on changes for session continuity
  useEffect(() => {
    if (isComplete) return
    
    const state: RestTimerState = {
      remainingSeconds: timeRemaining,
      totalSeconds: totalTime,
      startedAt: startedAtRef.current,
      isPaused: !isRunning,
      exerciseIndex,
      setNumber,
    }
    saveRestTimerState(state)
  }, [timeRemaining, totalTime, isRunning, exerciseIndex, setNumber, isComplete])

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

  // Handle pause/resume
  const handlePlayPause = () => {
    if (isRunning) {
      setIsRunning(false)
    } else {
      lastTickRef.current = Date.now()
      setIsRunning(true)
    }
  }

  // Handle skip
  const handleSkip = () => {
    clearRestTimerState()
    onSkip()
  }

  // Handle ready (when timer completes)
  const handleReady = () => {
    clearRestTimerState()
    onComplete()
  }

  // Adjust time
  const adjustTime = (delta: number) => {
    setTimeRemaining(prev => Math.max(0, prev + delta))
    setTotalTime(prev => Math.max(30, prev + delta))
  }

  // Determine display state
  const hasAdjustment = recommendation.adjustment.delta !== 0

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2B313A]/50 bg-[#1A1F26]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B7280]" />
            <span className="text-sm font-medium text-[#A4ACB8]">
              {isComplete ? 'Rest Complete' : 'Rest Timer'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs text-[#6B7280] border-[#3A4553]">
            {REST_CATEGORY_LABELS[recommendation.category]}
          </Badge>
        </div>
      </div>

      {/* Timer Display */}
      <div className="p-6 text-center">
        {/* Main Timer */}
        <div className={`text-5xl sm:text-6xl font-bold tabular-nums mb-2 ${
          isComplete 
            ? 'text-green-400' 
            : isRunning 
              ? 'text-[#E6E9EF]' 
              : 'text-[#A4ACB8]'
        }`}>
          {formatTime(timeRemaining)}
        </div>

        {/* Adjustment Info */}
        {hasAdjustment && !isComplete && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className={`w-3.5 h-3.5 ${
              recommendation.adjustment.type === 'increase' ? 'text-blue-400' : 'text-green-400'
            }`} />
            <span className="text-xs text-[#6B7280]">
              {formatRestDuration(recommendation.baseSeconds)} 
              <span className="mx-1">→</span>
              <span className={recommendation.adjustment.type === 'increase' ? 'text-blue-400' : 'text-green-400'}>
                {formatRestDuration(recommendation.adjustedSeconds)}
              </span>
            </span>
          </div>
        )}

        {/* Adjustment Reason (only before timer completes) */}
        {hasAdjustment && recommendation.adjustment.reason && !isComplete && !isRunning && (
          <p className="text-xs text-[#6B7280] mb-4 max-w-xs mx-auto">
            {recommendation.adjustment.reason}
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#2B313A] rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              isComplete 
                ? 'bg-green-500' 
                : 'bg-[#C1121F]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        {!isComplete ? (
          <div className="space-y-4">
            {/* Time Adjustment Row */}
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => adjustTime(-30)}
                className="h-12 w-12 p-0 border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:border-[#3A4553]"
              >
                <Minus className="w-5 h-5" />
              </Button>
              
              <Button
                size="lg"
                onClick={handlePlayPause}
                className={`h-14 min-w-[140px] ${
                  isRunning
                    ? 'bg-[#2B313A] hover:bg-[#3B4149] text-[#E6E9EF]'
                    : 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => adjustTime(30)}
                className="h-12 w-12 p-0 border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:border-[#3A4553]"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Skip Button */}
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-[#6B7280] hover:text-[#A4ACB8] w-full"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip Rest
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ready State */}
            <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Ready for next set</span>
            </div>
            
            {/* Next Set Info */}
            {nextSetInfo && (
              <div className="bg-[#0F1115]/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  {nextSetInfo.isNewExercise ? 'Next Exercise' : 'Next Set'}
                </p>
                <p className="text-sm text-[#E6E9EF] font-medium">
                  {nextSetInfo.isNewExercise ? nextSetInfo.exerciseName : `Set ${nextSetInfo.setNumber}`}
                </p>
              </div>
            )}
            
            {/* Continue Button - Large Touch Target */}
            <Button
              size="lg"
              onClick={handleReady}
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-white text-lg font-bold"
            >
              <Zap className="w-6 h-6 mr-2" />
              {nextSetInfo?.isNewExercise ? 'Start Next Exercise' : `Start Set ${nextSetInfo?.setNumber || ''}`}
            </Button>
          </div>
        )}
      </div>

      {/* Time adjustment labels */}
      {!isComplete && (
        <div className="px-4 pb-3 flex items-center justify-center gap-8 text-xs text-[#6B7280]">
          <span>-30s</span>
          <span className="text-[#4B5563]">|</span>
          <span>+30s</span>
        </div>
      )}
    </Card>
  )
}
