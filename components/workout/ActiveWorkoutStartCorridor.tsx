'use client'

/**
 * [ACTIVE-WORKOUT-START-CORRIDOR] Isolated Active Workout UI
 * 
 * This component is intentionally isolated from the complex hook chain
 * in StreamlinedWorkoutSession.tsx. It receives only plain, already-validated props
 * and renders the full active workout UI.
 * 
 * PURPOSE:
 * - Bypass the fragile active derivation chain that was causing crashes
 * - Provide a stable, working first exercise render path
 * - Be easily removable/replaceable once the main component is fixed
 * 
 * DOES NOT:
 * - Own any complex derivations
 * - Execute grouped-method enhancement logic
 * - Execute activeEntryContract/activeWorkoutViewModel
 * - Participate in stage-lock experiments
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Check, SkipForward, X } from 'lucide-react'
import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'

// =============================================================================
// TYPES - Plain props only, no complex dependencies
// =============================================================================

export interface ActiveWorkoutCorridorProps {
  // Session identity
  sessionLabel: string
  
  // Current exercise (plain values, not computed)
  exerciseName: string
  exerciseCategory: string
  exerciseSets: number
  exerciseRepsOrTime: string
  targetRPE?: number
  
  // Progress
  currentSetNumber: number
  currentExerciseIndex: number
  totalExercises: number
  completedSetsCount: number
  totalSetsCount: number
  elapsedSeconds: number
  
  // Input values (from machine state)
  repsValue: number
  holdValue: number
  selectedRPE: RPEValue | null
  bandUsed: ResistanceBandColor | 'none'
  
  // Callbacks (passed from parent)
  onCompleteSet: () => void
  onSetReps: (value: number) => void
  onSetHold: (value: number) => void
  onSetRPE: (rpe: RPEValue | null) => void
  onSetBand: (band: ResistanceBandColor | 'none') => void
  onExit: () => void
  onSkip?: () => void
}

// =============================================================================
// HELPER FUNCTIONS - Pure, no dependencies
// =============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function safeLower(str: string | undefined | null): string {
  return (str ?? '').toLowerCase()
}

function isHoldExercise(repsOrTime: string): boolean {
  const lower = safeLower(repsOrTime)
  return lower.includes('sec') || lower.includes('hold')
}

function parseTargetValue(repsOrTime: string): number {
  const match = repsOrTime.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 8
}

// RPE Quick Options - matches original
const RPE_QUICK_OPTIONS: RPEValue[] = [6, 7, 8, 9, 10]

// =============================================================================
// COMPONENT
// =============================================================================

export function ActiveWorkoutStartCorridor({
  sessionLabel,
  exerciseName,
  exerciseCategory,
  exerciseSets,
  exerciseRepsOrTime,
  targetRPE = 8,
  currentSetNumber,
  currentExerciseIndex,
  totalExercises,
  completedSetsCount,
  totalSetsCount,
  elapsedSeconds,
  repsValue,
  holdValue,
  selectedRPE,
  onCompleteSet,
  onSetReps,
  onSetHold,
  onSetRPE,
  onExit,
  onSkip,
}: ActiveWorkoutCorridorProps) {
  const isHold = isHoldExercise(exerciseRepsOrTime)
  const targetValue = parseTargetValue(exerciseRepsOrTime)
  const progressPercent = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0
  
  // Local state for confirming exit
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* ========== STICKY HEADER ========== */}
      <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
        <div className="px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowExitConfirm(true)}
                  className="p-1 -ml-1 text-[#6B7280] hover:text-[#E6E9EF] transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-[#E6E9EF] truncate max-w-[160px]">
                  {sessionLabel}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {currentExerciseIndex + 1}/{totalExercises}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B7280]">
                  {completedSetsCount}/{totalSetsCount}
                </span>
                <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">
                  {formatDuration(elapsedSeconds)}
                </span>
              </div>
            </div>
            <div className="h-1 bg-[#2B313A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C1121F] transition-all duration-300" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 px-4 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          
          {/* ========== EXERCISE CARD ========== */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            {/* Category + Set label */}
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
                {exerciseCategory}
              </Badge>
            </div>
            
            {/* Exercise name */}
            <h2 className="text-xl font-bold text-[#E6E9EF] leading-tight mb-1">
              {exerciseName}
            </h2>
            
            {/* Target prescription */}
            <div className="flex items-center gap-2 text-sm mb-4">
              <span className="text-[#A4ACB8]">Target:</span>
              <span className="text-[#E6E9EF] font-medium">{exerciseRepsOrTime}</span>
              <span className="text-[#6B7280]">·</span>
              <span className="text-[#A4ACB8]">RPE {targetRPE}</span>
            </div>
            
            {/* Set progress dots */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                {Array.from({ length: exerciseSets }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      idx < currentSetNumber - 1 
                        ? 'bg-green-500' 
                        : idx === currentSetNumber - 1 
                          ? 'bg-[#C1121F]' 
                          : 'bg-[#2B313A]'
                    }`} 
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-[#E6E9EF]">
                Set {currentSetNumber}/{exerciseSets}
              </span>
            </div>
          </Card>
          
          {/* ========== INPUT CARD ========== */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4 space-y-5">
            
            {/* Reps/Hold Input with +/- buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#A4ACB8]">
                  {isHold ? 'Hold (sec)' : 'Actual Reps'}
                </span>
                <span className="text-xs text-[#6B7280]">Target: {targetValue}</span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => isHold 
                    ? onSetHold(Math.max(1, holdValue - 1)) 
                    : onSetReps(Math.max(1, repsValue - 1))
                  }
                  className="w-14 h-14 rounded-xl bg-[#0F1115] border border-[#2B313A] text-[#A4ACB8] text-2xl font-bold active:bg-[#2B313A] transition-colors"
                >
                  -
                </button>
                <span className="w-20 text-center text-4xl font-bold text-[#E6E9EF] tabular-nums">
                  {isHold ? holdValue : repsValue}
                </span>
                <button
                  onClick={() => isHold 
                    ? onSetHold(holdValue + 1) 
                    : onSetReps(repsValue + 1)
                  }
                  className="w-14 h-14 rounded-xl bg-[#0F1115] border border-[#2B313A] text-[#A4ACB8] text-2xl font-bold active:bg-[#2B313A] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* RPE Quick Selector - Grid style */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#A4ACB8]">RPE</span>
                <span className="text-xs text-[#6B7280]">Target: {targetRPE}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {RPE_QUICK_OPTIONS.map((rpe) => (
                  <button
                    key={rpe}
                    onClick={() => onSetRPE(rpe)}
                    className={`py-3 rounded-lg text-base font-bold transition-all ${
                      selectedRPE === rpe 
                        ? 'bg-[#C1121F] text-white scale-[1.02]' 
                        : 'bg-[#0F1115] text-[#A4ACB8] border border-[#2B313A] active:bg-[#2B313A]'
                    }`}
                  >
                    {rpe}
                  </button>
                ))}
              </div>
            </div>
          </Card>
          
          {/* ========== PRIMARY ACTION ========== */}
          <Button 
            onClick={onCompleteSet} 
            disabled={selectedRPE === null}
            className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] disabled:bg-[#C1121F]/50 disabled:cursor-not-allowed text-white text-base font-bold"
          >
            <Check className="w-5 h-5 mr-2" />
            Log Set
          </Button>
          
          {/* ========== SECONDARY ACTIONS ========== */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onSkip}
              className="text-[#6B7280] text-sm h-9 px-3 hover:text-[#A4ACB8]"
            >
              <SkipForward className="w-3.5 h-3.5 mr-1.5" />
              Skip
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowExitConfirm(true)}
              className="text-[#6B7280] text-sm h-9 px-3 hover:text-[#A4ACB8]"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              End
            </Button>
          </div>
        </div>
      </div>
      
      {/* ========== EXIT CONFIRMATION MODAL ========== */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="bg-[#1A1F26] border-[#2B313A] max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#E6E9EF]">Exit Workout?</h3>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="text-[#6B7280] hover:text-[#E6E9EF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#A4ACB8] mb-6">
              Your progress will be saved. You can resume this workout later.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#2B313A] text-[#E6E9EF] hover:bg-[#2B313A]"
                onClick={() => setShowExitConfirm(false)}
              >
                Continue
              </Button>
              <Button
                className="flex-1 bg-[#C1121F] hover:bg-[#A10F1A] text-white"
                onClick={() => {
                  setShowExitConfirm(false)
                  onExit()
                }}
              >
                Exit
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ActiveWorkoutStartCorridor
