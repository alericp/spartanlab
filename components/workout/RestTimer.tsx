'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRestTimer, formatRestTimeDisplay, type TimerStatus } from '@/hooks/useRestTimer'
import { Play, Pause, RotateCcw, SkipForward, Clock, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================

export interface RestAdjustmentInfo {
  reason: string
  type: 'increase' | 'decrease' | 'none'
  delta: number // seconds changed
}

export interface NextSetGuidance {
  message: string
  repTarget?: string
  loadSuggestion?: string
  emphasis?: 'caution' | 'maintain' | 'good'
}

interface RestTimerProps {
  prescribedSeconds: number
  adjustedSeconds?: number
  adjustmentInfo?: RestAdjustmentInfo
  nextSetGuidance?: NextSetGuidance
  onComplete?: () => void
  onSkip?: () => void
  onReady?: () => void
  showProgress?: boolean
  compact?: boolean
  autoStart?: boolean
  sessionPaused?: boolean // Pause timer when workout session is paused
}

// =============================================================================
// MAIN REST TIMER COMPONENT
// =============================================================================

export function RestTimer({
  prescribedSeconds,
  adjustedSeconds,
  adjustmentInfo,
  nextSetGuidance,
  onComplete,
  onSkip,
  onReady,
  showProgress = true,
  compact = false,
  autoStart = false,
  sessionPaused = false,
}: RestTimerProps) {
  const effectiveSeconds = adjustedSeconds ?? prescribedSeconds
  const hasAdjustment = adjustedSeconds !== undefined && adjustedSeconds !== prescribedSeconds
  const timer = useRestTimer(effectiveSeconds)

  // Handle auto-start
  useEffect(() => {
    if (autoStart && effectiveSeconds > 0) {
      timer.setTime(effectiveSeconds)
      timer.start()
    }
  }, []) // Only on mount

  // Update timer when adjusted time changes (before timer starts)
  useEffect(() => {
    timer.applyNewTime(effectiveSeconds)
  }, [effectiveSeconds])

  // Pause/resume timer based on session state
  useEffect(() => {
    if (sessionPaused && timer.status === 'running') {
      timer.pause()
    } else if (!sessionPaused && timer.status === 'paused') {
      timer.resume()
    }
  }, [sessionPaused, timer.status])

  // Notify on complete
  useEffect(() => {
    if (timer.isComplete) {
      onComplete?.()
    }
  }, [timer.isComplete, onComplete])

  const handleSkip = () => {
    timer.skip()
    onSkip?.()
  }

  const handlePlayPause = () => {
    if (timer.status === 'running') {
      timer.pause()
    } else if (timer.status === 'paused') {
      timer.resume()
    } else {
      timer.start()
    }
  }

  // Compact timer for inline display
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6B7280]" />
          <span className={`font-mono text-lg font-bold tabular-nums ${
            timer.status === 'complete' ? 'text-green-400' : 'text-[#E6E9EF]'
          }`}>
            {timer.formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#2B313A]"
            onClick={handlePlayPause}
          >
            {timer.status === 'running' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#2B313A]"
            onClick={timer.reset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  // =============================================================================
  // FULL TIMER DISPLAY WITH INTEGRATED GUIDANCE
  // =============================================================================

  return (
    <div className="space-y-5">
      {/* Timer Display Section */}
      <div className="text-center">
        {/* Status Label */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {timer.status === 'complete' ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-400 uppercase tracking-wider">
                Rest Complete
              </span>
            </>
          ) : hasAdjustment ? (
            <>
              <TrendingUp className={`w-4 h-4 ${adjustmentInfo?.type === 'increase' ? 'text-blue-400' : 'text-green-400'}`} />
              <span className="text-xs text-[#6B7280] uppercase tracking-wider">
                Rest Adjusted
              </span>
            </>
          ) : (
            <span className="text-xs text-[#6B7280] uppercase tracking-wider">
              Rest Timer
            </span>
          )}
        </div>

        {/* Main Timer Display */}
        <p className={`text-6xl font-bold tabular-nums leading-none ${
          timer.status === 'complete'
            ? 'text-green-400'
            : timer.status === 'running'
            ? 'text-[#E6E9EF]'
            : 'text-[#A4ACB8]'
        }`}>
          {timer.formattedTime}
        </p>
        
        {/* Adjustment Indicator */}
        {hasAdjustment && timer.status !== 'complete' && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs text-[#6B7280] line-through">
              {formatRestTimeDisplay(prescribedSeconds)}
            </span>
            <span className="text-xs text-[#6B7280]">→</span>
            <span className={`text-xs font-medium ${
              adjustmentInfo?.type === 'increase' ? 'text-blue-400' : 'text-green-400'
            }`}>
              {formatRestTimeDisplay(effectiveSeconds)}
              {adjustmentInfo?.delta && (
                <span className="ml-1">
                  ({adjustmentInfo.delta > 0 ? '+' : ''}{adjustmentInfo.delta}s)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Adjustment Reason */}
        {hasAdjustment && adjustmentInfo?.reason && timer.status === 'idle' && (
          <p className="mt-2 text-xs text-[#A4ACB8] max-w-xs mx-auto">
            {adjustmentInfo.reason}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full h-2 bg-[#2B313A] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              timer.status === 'complete' 
                ? 'bg-green-500' 
                : timer.status === 'idle'
                ? 'bg-[#3B4149]'
                : 'bg-[#C1121F]'
            }`}
            style={{ width: `${timer.status === 'idle' ? 0 : timer.progress}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Play/Pause Button */}
        <Button
          size="lg"
          className={`min-w-[120px] ${
            timer.status === 'running'
              ? 'bg-[#2B313A] hover:bg-[#3B4149] text-[#E6E9EF]'
              : timer.status === 'complete'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
          }`}
          onClick={timer.status === 'complete' && onReady ? onReady : handlePlayPause}
        >
          {timer.status === 'running' ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </>
          ) : timer.status === 'paused' ? (
            <>
              <Play className="w-5 h-5 mr-2" />
              Resume
            </>
          ) : timer.status === 'complete' ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Ready
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start
            </>
          )}
        </Button>

        {/* Reset Button */}
        <Button
          size="lg"
          variant="outline"
          className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:border-[#3B4149]"
          onClick={timer.reset}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        {/* Skip Button */}
        {onSkip && timer.status !== 'complete' && (
          <Button
            size="lg"
            variant="ghost"
            className="text-[#6B7280] hover:text-[#A4ACB8]"
            onClick={handleSkip}
          >
            <SkipForward className="w-5 h-5 mr-2" />
            Skip
          </Button>
        )}
      </div>

      {/* Status/Guidance Text */}
      {timer.status === 'idle' && !nextSetGuidance && (
        <p className="text-center text-sm text-[#6B7280]">
          Tap Start when ready to begin rest
        </p>
      )}

      {/* Ready State with Next Set Guidance */}
      {timer.status === 'complete' && (
        <ReadyStatePanel guidance={nextSetGuidance} />
      )}
    </div>
  )
}

// =============================================================================
// READY STATE PANEL
// Shows when timer completes with next-set guidance
// =============================================================================

interface ReadyStatePanelProps {
  guidance?: NextSetGuidance
}

function ReadyStatePanel({ guidance }: ReadyStatePanelProps) {
  return (
    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 text-center">
      <p className="text-sm font-medium text-green-400 mb-1">
        Ready for Next Set
      </p>
      {guidance ? (
        <div className="space-y-1">
          <p className="text-sm text-[#A4ACB8]">{guidance.message}</p>
          {(guidance.repTarget || guidance.loadSuggestion) && (
            <div className="flex items-center justify-center gap-3 mt-2 text-xs">
              {guidance.repTarget && (
                <span className={`px-2 py-1 rounded ${
                  guidance.emphasis === 'caution' 
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-[#2B313A] text-[#A4ACB8]'
                }`}>
                  {guidance.repTarget}
                </span>
              )}
              {guidance.loadSuggestion && (
                <span className="px-2 py-1 rounded bg-[#2B313A] text-[#A4ACB8]">
                  {guidance.loadSuggestion}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#6B7280]">Continue with your planned set</p>
      )}
    </div>
  )
}

// =============================================================================
// INLINE REST INDICATOR
// A minimal rest time display for the set details area
// =============================================================================

interface RestIndicatorProps {
  prescribedSeconds: number
  adjustedSeconds?: number
  adjustmentReason?: string
}

export function RestIndicator({ prescribedSeconds, adjustedSeconds, adjustmentReason }: RestIndicatorProps) {
  const showAdjusted = adjustedSeconds && adjustedSeconds !== prescribedSeconds

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-[#6B7280]" />
        <span className="text-[#6B7280]">Rest:</span>
        {showAdjusted ? (
          <>
            <span className="line-through text-[#6B7280]">
              {formatRestTimeDisplay(prescribedSeconds)}
            </span>
            <span className={adjustedSeconds! > prescribedSeconds ? 'text-blue-400 font-medium' : 'text-green-400 font-medium'}>
              {formatRestTimeDisplay(adjustedSeconds!)}
            </span>
          </>
        ) : (
          <span className="text-[#A4ACB8] font-medium">
            {formatRestTimeDisplay(prescribedSeconds)}
          </span>
        )}
      </div>
      {showAdjusted && adjustmentReason && (
        <p className="text-xs text-[#6B7280] pl-6">{adjustmentReason}</p>
      )}
    </div>
  )
}

// =============================================================================
// ADAPTIVE REST SUMMARY CARD
// Shows rest update with reason when RPE triggers adjustment
// =============================================================================

interface AdaptiveRestSummaryProps {
  prescribedSeconds: number
  adjustedSeconds: number
  reason: string
  guidanceType?: 'caution' | 'increase_rest' | 'decrease_rest' | 'maintain'
}

export function AdaptiveRestSummary({ 
  prescribedSeconds, 
  adjustedSeconds, 
  reason,
  guidanceType = 'maintain'
}: AdaptiveRestSummaryProps) {
  const delta = adjustedSeconds - prescribedSeconds
  const isIncrease = delta > 0

  const bgColor = guidanceType === 'caution' 
    ? 'bg-amber-500/10 border-amber-500/20'
    : isIncrease 
    ? 'bg-blue-500/10 border-blue-500/20' 
    : 'bg-green-500/10 border-green-500/20'

  const textColor = guidanceType === 'caution'
    ? 'text-amber-400'
    : isIncrease
    ? 'text-blue-400'
    : 'text-green-400'

  const Icon = guidanceType === 'caution' ? AlertTriangle : TrendingUp

  return (
    <div className={`rounded-lg border p-3 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${textColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${textColor}`}>
              Rest Updated
            </span>
            <span className="text-xs text-[#6B7280]">
              {formatRestTimeDisplay(prescribedSeconds)} → {formatRestTimeDisplay(adjustedSeconds)}
              <span className={`ml-1 ${textColor}`}>
                ({delta > 0 ? '+' : ''}{delta}s)
              </span>
            </span>
          </div>
          <p className="text-xs text-[#A4ACB8]">{reason}</p>
        </div>
      </div>
    </div>
  )
}
