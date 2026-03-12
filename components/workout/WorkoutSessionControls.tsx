'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  Square,
  Clock,
  Dumbbell,
  Target,
  AlertCircle,
} from 'lucide-react'
import type { SessionStatus, SessionStats } from '@/hooks/useWorkoutSession'

// =============================================================================
// SESSION HEADER - Shows during active workout
// =============================================================================

interface SessionHeaderProps {
  status: SessionStatus
  formattedDuration: string
  stats: SessionStats
  onPause: () => void
  onResume: () => void
  onFinish: () => void
}

export function SessionHeader({
  status,
  formattedDuration,
  stats,
  onPause,
  onResume,
  onFinish,
}: SessionHeaderProps) {
  const isActive = status === 'active'
  const isPaused = status === 'paused'

  return (
    <div className="bg-[#0F1115] border-b border-[#2B313A] px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Timer & Stats */}
        <div className="flex items-center gap-4">
          {/* Live Timer */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-[#6B7280]'}`} />
            <Clock className="w-4 h-4 text-[#A4ACB8]" />
            <span className="font-mono text-lg font-bold text-[#E6E9EF]">
              {formattedDuration}
            </span>
            {isPaused && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                Paused
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-[#A4ACB8]">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>
                {stats.completedSets}/{stats.totalSets} sets
              </span>
            </div>
            {stats.averageRPE !== null && (
              <div className="flex items-center gap-1 text-[#A4ACB8]">
                <Target className="w-3.5 h-3.5" />
                <span>RPE {stats.averageRPE.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={onPause}
            >
              <Pause className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Pause</span>
            </Button>
          ) : isPaused ? (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onResume}
            >
              <Play className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Resume</span>
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            className="border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10"
            onClick={onFinish}
          >
            <Square className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Finish</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// START WORKOUT PANEL - Shows before workout begins
// =============================================================================

interface StartWorkoutPanelProps {
  sessionName: string
  exerciseCount: number
  estimatedMinutes: number
  rpeExerciseCount: number
  onStart: () => void
}

export function StartWorkoutPanel({
  sessionName,
  exerciseCount,
  estimatedMinutes,
  rpeExerciseCount,
  onStart,
}: StartWorkoutPanelProps) {
  return (
    <div className="bg-gradient-to-r from-[#C1121F]/10 to-[#1A1F26] border border-[#C1121F]/20 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[#E6E9EF] mb-1">{sessionName}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#A4ACB8]">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              {exerciseCount} exercises
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{estimatedMinutes} min
            </span>
            {rpeExerciseCount > 0 && (
              <span className="flex items-center gap-1 text-[#C1121F]">
                <Target className="w-4 h-4" />
                {rpeExerciseCount} with RPE tracking
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={onStart}
          size="lg"
          className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 w-full sm:w-auto"
        >
          <Play className="w-5 h-5" />
          Start Workout
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// PAUSED OVERLAY - Shows when workout is paused
// =============================================================================

interface PausedOverlayProps {
  formattedDuration: string
  stats: SessionStats
  onResume: () => void
  onFinish: () => void
}

export function PausedOverlay({
  formattedDuration,
  stats,
  onResume,
  onFinish,
}: PausedOverlayProps) {
  return (
    <div className="fixed inset-0 bg-[#0F1115]/95 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <Pause className="w-8 h-8 text-amber-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-[#E6E9EF] mb-2">Workout Paused</h2>
        <p className="text-[#A4ACB8] mb-6">Take a break. Your progress is saved.</p>

        {/* Current Progress */}
        <div className="bg-[#0F1115] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-mono font-bold text-[#E6E9EF]">{formattedDuration}</p>
              <p className="text-xs text-[#6B7280]">Duration</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6E9EF]">{stats.completedSets}</p>
              <p className="text-xs text-[#6B7280]">Sets Done</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#E6E9EF]">{stats.averageRPE?.toFixed(1) || '-'}</p>
              <p className="text-xs text-[#6B7280]">Avg RPE</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={onResume}
          >
            <Play className="w-5 h-5 mr-2" />
            Resume Workout
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10"
            onClick={onFinish}
          >
            <Square className="w-5 h-5 mr-2" />
            End Workout Early
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// FINISH CONFIRMATION - Modal to confirm ending workout
// =============================================================================

interface FinishConfirmationProps {
  stats: SessionStats
  onConfirm: () => void
  onCancel: () => void
}

export function FinishConfirmation({
  stats,
  onConfirm,
  onCancel,
}: FinishConfirmationProps) {
  const hasUnfinishedWork = stats.completedSets < stats.totalSets

  return (
    <div className="fixed inset-0 bg-[#0F1115]/95 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1F26] border border-[#2B313A] rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-[#E6E9EF] mb-2">Finish Workout?</h3>
        
        {hasUnfinishedWork && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-400">
              You have {stats.totalSets - stats.completedSets} sets remaining. 
              Are you sure you want to finish early?
            </p>
          </div>
        )}

        <p className="text-[#A4ACB8] mb-6">
          {hasUnfinishedWork 
            ? 'Your completed sets will still be saved.'
            : 'Great job! Ready to see your summary?'}
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#2B313A]"
            onClick={onCancel}
          >
            Continue Training
          </Button>
          <Button
            className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            onClick={onConfirm}
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  )
}
