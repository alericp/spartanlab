'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  MoreVertical, 
  RefreshCw, 
  SkipForward, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Clock,
  Dumbbell,
  Ban,
  CheckCircle2,
} from 'lucide-react'
import { getProgressionOptions, type ProgressionOption } from '@/lib/exercise-override-service'
import { 
  recordSkipSignal, 
  recordProgressionSignal,
  type SkipReason 
} from '@/lib/override-signal-service'
import type { AdaptiveExercise } from '@/lib/adaptive-program-builder'

interface ExerciseActionMenuProps {
  exercise: AdaptiveExercise
  sessionId: string
  onReplace: (exerciseId: string, exerciseName: string) => void
  onSkip: (exerciseId: string, exerciseName: string) => void
  onProgressionAdjust: (exerciseId: string, newProgression: string, direction: 'up' | 'down') => void
}

const SKIP_REASONS: { value: SkipReason; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'equipment', label: 'Missing equipment', icon: Dumbbell },
  { value: 'discomfort', label: 'Causes discomfort', icon: AlertTriangle },
  { value: 'too_hard', label: 'Too difficult today', icon: TrendingDown },
  { value: 'fatigue', label: 'Too fatigued', icon: Clock },
  { value: 'time', label: 'Short on time', icon: Clock },
  { value: 'preference', label: 'Not today', icon: Ban },
]

export function ExerciseActionMenu({
  exercise,
  sessionId,
  onReplace,
  onSkip,
  onProgressionAdjust,
}: ExerciseActionMenuProps) {
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [showProgressionDialog, setShowProgressionDialog] = useState(false)
  const [progressionOptions, setProgressionOptions] = useState<ProgressionOption[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const handleSkipClick = () => {
    setShowSkipDialog(true)
  }

  const handleSkipConfirm = (reason: SkipReason) => {
    // Record the skip signal
    recordSkipSignal(
      sessionId,
      exercise.id,
      exercise.name,
      exercise.category,
      reason
    )
    
    // Trigger skip action
    onSkip(exercise.id, exercise.name)
    
    setShowSkipDialog(false)
    showFeedback('Exercise skipped')
  }

  const handleProgressionClick = () => {
    // Get available progression options
    const options = getProgressionOptions(exercise)
    setProgressionOptions(options)
    setShowProgressionDialog(true)
  }

  const handleProgressionSelect = (option: ProgressionOption) => {
    // Record the progression signal
    recordProgressionSignal(
      sessionId,
      exercise.id,
      exercise.name,
      exercise.category,
      option.direction,
      option.name
    )
    
    // Trigger progression adjust
    onProgressionAdjust(exercise.id, option.name, option.direction)
    
    setShowProgressionDialog(false)
    showFeedback(`Progression ${option.direction === 'up' ? 'increased' : 'decreased'}`)
  }

  const showFeedback = (message: string) => {
    setFeedbackMessage(message)
    setTimeout(() => setFeedbackMessage(null), 2000)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-[#6A6A6A] hover:text-[#A5A5A5] hover:bg-[#2A2A2A]"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Exercise actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-[#1A1A1A] border-[#3A3A3A]"
        >
          <DropdownMenuItem
            onClick={() => onReplace(exercise.id, exercise.name)}
            className="text-[#E6E9EF] focus:bg-[#2A2A2A] focus:text-[#E6E9EF] cursor-pointer"
          >
            <RefreshCw className="mr-2 h-4 w-4 text-[#A5A5A5]" />
            Replace Exercise
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handleSkipClick}
            className="text-[#E6E9EF] focus:bg-[#2A2A2A] focus:text-[#E6E9EF] cursor-pointer"
          >
            <SkipForward className="mr-2 h-4 w-4 text-[#A5A5A5]" />
            Skip Exercise
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-[#3A3A3A]" />
          
          <DropdownMenuItem
            onClick={handleProgressionClick}
            className="text-[#E6E9EF] focus:bg-[#2A2A2A] focus:text-[#E6E9EF] cursor-pointer"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-[#A5A5A5]" />
            Adjust Progression
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-sm text-[#E6E9EF]">{feedbackMessage}</span>
          </div>
        </div>
      )}

      {/* Skip Dialog */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF]">Skip Exercise</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Why are you skipping <span className="text-[#A4ACB8]">{exercise.name}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 pt-2">
            {SKIP_REASONS.map((reason) => {
              const Icon = reason.icon
              return (
                <button
                  key={reason.value}
                  onClick={() => handleSkipConfirm(reason.value)}
                  className="w-full flex items-center gap-3 p-3 bg-[#0F1115] rounded-lg border border-[#2B313A]/50 hover:border-[#C1121F]/30 transition-colors text-left"
                >
                  <Icon className="h-4 w-4 text-[#6B7280]" />
                  <span className="text-sm text-[#E6E9EF]">{reason.label}</span>
                </button>
              )
            })}
          </div>
          
          <p className="text-xs text-[#6B7280] mt-2">
            This helps SpartanLab learn your preferences for future workouts.
          </p>
        </DialogContent>
      </Dialog>

      {/* Progression Dialog */}
      <Dialog open={showProgressionDialog} onOpenChange={setShowProgressionDialog}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF]">Adjust Progression</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Choose a different difficulty level for <span className="text-[#A4ACB8]">{exercise.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 pt-2">
            {progressionOptions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[#6B7280]">
                  No progression options available for this exercise.
                </p>
                <p className="text-xs text-[#4A4A4A] mt-2">
                  Try replacing the exercise instead.
                </p>
              </div>
            ) : (
              progressionOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleProgressionSelect(option)}
                  className="w-full flex items-center gap-3 p-4 bg-[#0F1115] rounded-lg border border-[#2B313A]/50 hover:border-[#C1121F]/30 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    option.direction === 'easier' 
                      ? 'bg-[#4F6D8A]/20' 
                      : 'bg-[#C1121F]/20'
                  }`}>
                    {option.direction === 'easier' ? (
                      <TrendingDown className="h-4 w-4 text-[#4F6D8A]" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-[#C1121F]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-[#E6E9EF]">{option.name}</h4>
                    <p className="text-xs text-[#6B7280] capitalize">
                      {option.direction === 'easier' ? 'Regression' : 'Progression'} - {option.difficultyLevel}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {progressionOptions.length > 0 && (
            <p className="text-xs text-[#6B7280] mt-2">
              This adjustment applies to today's workout only.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
