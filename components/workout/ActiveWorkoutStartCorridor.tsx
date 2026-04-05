'use client'

/**
 * [ACTIVE-WORKOUT-START-CORRIDOR] Isolated Active Workout UI
 * 
 * This component is intentionally "dumb" and isolated from the complex hook chain
 * in StreamlinedWorkoutSession.tsx. It receives only plain, already-validated props
 * and renders a minimal active workout UI.
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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, X } from 'lucide-react'
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

// =============================================================================
// COMPONENT
// =============================================================================

export function ActiveWorkoutStartCorridor({
  sessionLabel,
  exerciseName,
  exerciseCategory,
  exerciseSets,
  exerciseRepsOrTime,
  currentSetNumber,
  currentExerciseIndex,
  totalExercises,
  completedSetsCount,
  totalSetsCount,
  elapsedSeconds,
  repsValue,
  holdValue,
  selectedRPE,
  bandUsed,
  onCompleteSet,
  onSetReps,
  onSetHold,
  onSetRPE,
  onSetBand,
  onExit,
}: ActiveWorkoutCorridorProps) {
  console.log('[v0] [active_start_corridor_render_begin]', {
    exerciseName,
    currentSetNumber,
    exerciseSets,
  })
  
  const isHold = isHoldExercise(exerciseRepsOrTime)
  const targetValue = parseTargetValue(exerciseRepsOrTime)
  const progressPercent = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0
  
  // Local state for confirming exit
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  console.log('[v0] [active_start_corridor_render_success]')
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
        <div className="px-4 py-2.5">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowExitConfirm(true)}
                  className="p-1 -ml-1 text-[#6B7280] hover:text-[#E6E9EF] transition-colors"
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
      
      {/* Main content */}
      <div className="flex-1 px-4 py-3">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Exercise Card */}
          <Card className="bg-[#1A1F26] border-[#2B313A]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#C1121F]/10 text-[#C1121F] border-0 text-[10px] uppercase px-2 py-0.5">
                    {exerciseCategory}
                  </Badge>
                  <span className="text-xs text-[#6B7280]">
                    Set {currentSetNumber}/{exerciseSets}
                  </span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-[#E6E9EF] mb-1">{exerciseName}</h2>
              <p className="text-sm text-[#A4ACB8]">{exerciseRepsOrTime}</p>
            </CardContent>
          </Card>
          
          {/* Input Controls */}
          <Card className="bg-[#1A1F26] border-[#2B313A]">
            <CardContent className="p-4 space-y-4">
              {isHold ? (
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5">Hold Time (seconds)</label>
                  <Input
                    type="number"
                    value={holdValue}
                    onChange={(e) => onSetHold(parseInt(e.target.value) || 0)}
                    className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] text-lg font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1.5">Reps Completed</label>
                  <Input
                    type="number"
                    value={repsValue}
                    onChange={(e) => onSetReps(parseInt(e.target.value) || 0)}
                    className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] text-lg font-bold"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs text-[#6B7280] mb-1.5">RPE (Effort)</label>
                <div className="flex gap-1">
                  {([6, 7, 8, 9, 10] as RPEValue[]).map(rpe => (
                    <Button
                      key={rpe}
                      variant={selectedRPE === rpe ? 'default' : 'outline'}
                      size="sm"
                      className={selectedRPE === rpe 
                        ? 'bg-[#C1121F] border-[#C1121F] hover:bg-[#A10F1A]' 
                        : 'border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50'}
                      onClick={() => onSetRPE(rpe)}
                    >
                      {rpe}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Button */}
          <Button
            className="w-full h-14 text-lg font-bold bg-[#C1121F] hover:bg-[#A10F1A] text-white"
            onClick={onCompleteSet}
          >
            Complete Set
          </Button>
        </div>
      </div>
      
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="bg-[#1A1F26] border-[#2B313A] max-w-sm w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#E6E9EF]">Exit Workout?</h3>
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="text-[#6B7280] hover:text-[#E6E9EF]"
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
                  className="flex-1 border-[#2B313A] text-[#E6E9EF]"
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ActiveWorkoutStartCorridor
