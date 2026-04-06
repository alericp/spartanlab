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
 * - Match the original polished workout session UI using plain props
 * 
 * DOES NOT:
 * - Own any complex derivations
 * - Execute grouped-method enhancement logic
 * - Execute activeEntryContract/activeWorkoutViewModel
 * - Participate in stage-lock experiments
 */

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronDown, ChevronUp, Check, SkipForward, X, MessageSquare, Play } from 'lucide-react'
import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'

// =============================================================================
// TYPES - Plain props only, no complex dependencies
// =============================================================================

export type SetReasonTag = 'form_issue' | 'fatigue' | 'too_easy' | 'too_hard' | 'pain' | 'grip' | 'balance' | 'focus'

export const SET_REASON_TAG_LABELS: Record<SetReasonTag, string> = {
  form_issue: 'Form Issue',
  fatigue: 'Fatigued',
  too_easy: 'Too Easy',
  too_hard: 'Too Hard',
  pain: 'Pain/Discomfort',
  grip: 'Grip Limited',
  balance: 'Balance Issue',
  focus: 'Lost Focus',
}

export interface CompletedSetInfo {
  setNumber: number
  actualReps: number
  holdSeconds?: number
  actualRPE: RPEValue
  bandUsed?: ResistanceBandColor | 'none'
  reasonTags?: SetReasonTag[]
}

export interface ActiveWorkoutCorridorProps {
  // Corridor mode - determines which UI to show
  // active = logging sets, resting = same-exercise rest or between-exercise rest
  // block_round_rest = rest between rounds of grouped block (superset/circuit)
  mode: 'active' | 'resting' | 'block_round_rest'
  
  // Session identity
  sessionLabel: string
  
  // Current exercise (plain values, not computed)
  exerciseName: string
  exerciseCategory: string
  exerciseSets: number
  exerciseRepsOrTime: string
  targetRPE?: number
  
  // Prescribed load for weighted exercises
  prescribedLoad?: {
    load: number
    unit: string
    confidenceLevel?: 'high' | 'medium' | 'low'
  }
  
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
  
  // Notes state
  currentSetNote?: string
  currentSetReasonTags?: SetReasonTag[]
  
  // Recent sets for ledger
  recentSets?: CompletedSetInfo[]
  
  // Band configuration
  bandSelectable?: boolean
  recommendedBand?: ResistanceBandColor
  
  // Rest mode props
  restDurationSeconds?: number
  lastSetRPE?: RPEValue | null
  restType?: 'same_exercise' | 'between_exercise' | 'block_round' // Type of rest period
  nextExerciseName?: string // For between-exercise rest, name of next exercise
  
  // Block round rest props (for grouped methods - superset/circuit)
  blockLabel?: string
  blockGroupType?: 'superset' | 'circuit' | 'cluster' | 'emom'
  currentRound?: number
  targetRounds?: number
  blockMemberExercises?: Array<{ id: string; name: string }>
  blockRoundRestSeconds?: number
  onBlockRoundRestComplete?: () => void
  
  // Callbacks (passed from parent)
  onCompleteSet: () => void
  onSetReps: (value: number) => void
  onSetHold: (value: number) => void
  onSetRPE: (rpe: RPEValue | null) => void
  onSetBand: (band: ResistanceBandColor | 'none') => void
  onSetNote?: (note: string) => void
  onToggleReasonTag?: (tag: SetReasonTag) => void
  onExit: () => void
  onSkip?: () => void
  onRestComplete?: () => void
}

// =============================================================================
// CONSTANTS
// =============================================================================

const RPE_QUICK_OPTIONS: RPEValue[] = [6, 7, 8, 9, 10]

const ALL_BAND_COLORS: ResistanceBandColor[] = ['yellow', 'red', 'green', 'blue', 'black', 'purple']

const BAND_COLORS: Record<ResistanceBandColor, { bg: string; text: string; border: string }> = {
  yellow: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  black: { bg: 'bg-gray-700/40', text: 'text-gray-300', border: 'border-gray-500/50' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
}

const BAND_SHORT_LABELS: Record<ResistanceBandColor, string> = {
  yellow: 'YLW',
  red: 'RED',
  green: 'GRN',
  blue: 'BLU',
  black: 'BLK',
  purple: 'PUR',
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
// PURE SUB-COMPONENTS (extracted from original, no activeEntryContract dependency)
// =============================================================================

interface RPEQuickSelectorProps {
  value: RPEValue | null
  onChange: (value: RPEValue) => void
  targetRPE?: number
}

function RPEQuickSelector({ value, onChange, targetRPE }: RPEQuickSelectorProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">RPE</span>
        {targetRPE && (
          <span className="text-xs text-[#6B7280]">Target: {targetRPE}</span>
        )}
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {RPE_QUICK_OPTIONS.map((rpe) => (
          <button
            key={rpe}
            onClick={() => onChange(rpe)}
            className={`py-2.5 rounded-lg text-base font-bold transition-all ${
              value === rpe 
                ? 'bg-[#C1121F] text-white scale-[1.02]' 
                : 'bg-[#0F1115] text-[#A4ACB8] border border-[#2B313A] active:bg-[#2B313A]'
            }`}
          >
            {rpe}
          </button>
        ))}
      </div>
    </div>
  )
}

interface RepsHoldInputProps {
  type: 'reps' | 'hold'
  value: number
  onChange: (value: number) => void
  targetValue: number
}

function RepsHoldInput({ type, value, onChange, targetValue }: RepsHoldInputProps) {
  const label = type === 'reps' ? 'Actual Reps' : 'Hold (sec)'
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">{label}</span>
        <span className="text-xs text-[#6B7280]">Target: {targetValue}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-12 h-12 rounded-lg bg-[#0F1115] border border-[#2B313A] text-[#A4ACB8] text-xl font-bold active:bg-[#2B313A]"
        >
          -
        </button>
        <span className="w-16 text-center text-3xl font-bold text-[#E6E9EF] tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-12 h-12 rounded-lg bg-[#0F1115] border border-[#2B313A] text-[#A4ACB8] text-xl font-bold active:bg-[#2B313A]"
        >
          +
        </button>
      </div>
    </div>
  )
}

interface BandSelectorProps {
  value: ResistanceBandColor | 'none'
  onChange: (value: ResistanceBandColor | 'none') => void
  recommendedBand?: ResistanceBandColor
}

function BandSelector({ value, onChange, recommendedBand }: BandSelectorProps) {
  const bandOptions: (ResistanceBandColor | 'none')[] = ['none', ...ALL_BAND_COLORS]
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">Band</span>
        {recommendedBand && (
          <span className="text-xs text-[#6B7280]">Rec: {BAND_SHORT_LABELS[recommendedBand]}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {bandOptions.map((band) => {
          const isSelected = value === band
          const colors = band === 'none' ? null : BAND_COLORS[band]
          
          return (
            <button
              key={band}
              onClick={() => onChange(band)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? colors
                    ? `${colors.bg} ${colors.text} ${colors.border} border`
                    : 'bg-[#2B313A] text-[#E6E9EF] border border-[#3B4250]'
                  : colors
                    ? `bg-transparent ${colors.text} border ${colors.border} opacity-60 hover:opacity-100`
                    : 'bg-transparent text-[#6B7280] border border-[#2B313A] hover:border-[#3B4250]'
              }`}
            >
              {band === 'none' ? 'None' : BAND_SHORT_LABELS[band]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ActiveWorkoutStartCorridor({
  sessionLabel,
  exerciseName,
  mode,
  exerciseCategory,
  exerciseSets,
  exerciseRepsOrTime,
  targetRPE = 8,
  prescribedLoad,
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
  currentSetNote = '',
  currentSetReasonTags = [],
  recentSets = [],
  bandSelectable = false,
  recommendedBand,
  restDurationSeconds = 90,
  lastSetRPE,
  restType = 'same_exercise',
  nextExerciseName,
  // Block round rest props
  blockLabel,
  blockGroupType,
  currentRound = 1,
  targetRounds = 3,
  blockMemberExercises = [],
  blockRoundRestSeconds = 90,
  onBlockRoundRestComplete,
  onCompleteSet,
  onSetReps,
  onSetHold,
  onSetRPE,
  onSetBand,
  onSetNote,
  onToggleReasonTag,
  onExit,
  onSkip,
  onRestComplete,
}: ActiveWorkoutCorridorProps) {

  const isHold = isHoldExercise(exerciseRepsOrTime)
  const targetValue = parseTargetValue(exerciseRepsOrTime)
  const progressPercent = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0
  
  // Local UI state
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSetNotes, setShowSetNotes] = useState(false)
  
  // Rest timer state (for resting mode)
  const [restTimeRemaining, setRestTimeRemaining] = useState(restDurationSeconds)
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Reset rest timer when entering resting or block_round_rest mode
  useEffect(() => {
    if (mode === 'resting' || mode === 'block_round_rest') {
      const duration = mode === 'block_round_rest' ? blockRoundRestSeconds : restDurationSeconds
      setRestTimeRemaining(duration)
      restTimerRef.current = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            if (restTimerRef.current) clearInterval(restTimerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
    }
  }, [mode, restDurationSeconds, blockRoundRestSeconds])
  
  const handleRestSkip = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current)
    if (mode === 'block_round_rest') {
      onBlockRoundRestComplete?.()
    } else {
      onRestComplete?.()
    }
  }
  
  // Indicator color based on mode
  const indicatorColor = mode === 'block_round_rest' ? 'bg-amber-500' : mode === 'resting' ? 'bg-blue-500' : 'bg-green-500'
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* ========== STICKY HEADER ========== */}
      <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
        <div className="px-4 py-2.5">
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
                <div className={`w-1.5 h-1.5 rounded-full ${indicatorColor} animate-pulse`} />
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
      <div className="flex-1 px-4 py-3">
        <div className="max-w-lg mx-auto space-y-3">
          
          {/* ========== RESTING MODE UI ========== */}
          {mode === 'resting' && (
            <>
              {/* Last Set RPE Summary */}
              {lastSetRPE && (
                <Card className="bg-[#0F1115]/50 border-[#2B313A]/50 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6B7280]">Last set RPE</span>
                    <Badge className={`${
                      lastSetRPE >= 9 
                        ? 'bg-orange-500/10 text-orange-400 border-0' 
                        : lastSetRPE >= 8
                          ? 'bg-blue-500/10 text-blue-400 border-0'
                          : 'bg-green-500/10 text-green-400 border-0'
                    }`}>
                      RPE {lastSetRPE}
                    </Badge>
                  </div>
                </Card>
              )}
              
              {/* Rest Timer Card */}
              <Card className={`bg-gradient-to-br ${restType === 'between_exercise' ? 'from-[#1A2326] to-[#1A2326]/80 border-green-500/30' : 'from-[#1A1F26] to-[#1A1F26]/80 border-[#2B313A]'} p-6`}>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${restType === 'between_exercise' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                    <span className={`text-sm font-medium ${restType === 'between_exercise' ? 'text-green-400' : 'text-blue-400'} uppercase tracking-wider`}>
                      {restType === 'between_exercise' ? 'Exercise Complete!' : `Rest Before Set ${currentSetNumber}`}
                    </span>
                  </div>
                  
                  {/* Large Timer Display */}
                  <div className="text-6xl font-mono font-bold text-[#E6E9EF] tabular-nums">
                    {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  
                  {/* Timer Progress Bar */}
                  <div className="h-2 bg-[#2B313A] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${restType === 'between_exercise' ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-1000`}
                      style={{ width: `${(restTimeRemaining / restDurationSeconds) * 100}%` }}
                    />
                  </div>
                  
                  {/* Up Next Info */}
                  <div className="pt-2 border-t border-[#2B313A]/50">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">Up Next</p>
                    {restType === 'between_exercise' ? (
                      <>
                        <p className="text-sm font-medium text-[#E6E9EF]">{nextExerciseName || 'Next Exercise'}</p>
                        <p className="text-xs text-[#A4ACB8]">Exercise {currentExerciseIndex + 2} of {totalExercises}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-[#E6E9EF]">{exerciseName}</p>
                        <p className="text-xs text-[#A4ACB8]">Set {currentSetNumber} of {exerciseSets} · {exerciseRepsOrTime}</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Recent Sets Ledger (during rest) */}
              {recentSets.length > 0 && (
                <Card className="bg-[#1A1F26]/50 border-[#2B313A]/50 p-3">
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Completed Sets</p>
                  <div className="space-y-1.5">
                    {recentSets.map((set, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-[#A4ACB8]">Set {set.setNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#E6E9EF]">
                            {set.holdSeconds ? `${set.holdSeconds}s` : `${set.actualReps} reps`}
                          </span>
                          {set.actualRPE && (
                            <Badge variant="outline" className="text-[10px] border-[#2B313A] text-[#A4ACB8]">
                              RPE {set.actualRPE}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              
              {/* Skip Rest / Start Next Button */}
              <Button
                onClick={handleRestSkip}
                className={`w-full h-14 text-lg font-bold ${
                  restTimeRemaining === 0 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
                }`}
              >
                {restTimeRemaining === 0 ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {restType === 'between_exercise' ? 'Start Next Exercise' : `Start Set ${currentSetNumber}`}
                  </>
                ) : (
                  <>
                    <SkipForward className="w-5 h-5 mr-2" />
                    {restType === 'between_exercise' ? 'Skip — Next Exercise' : `Skip Rest — Start Set ${currentSetNumber}`}
                  </>
                )}
              </Button>
            </>
          )}
          
          {/* ========== BLOCK ROUND REST MODE UI (grouped methods) ========== */}
          {mode === 'block_round_rest' && (
            <>
              {/* Round Completed Message */}
              <Card className={`p-4 ${restTimeRemaining === 0 ? 'bg-amber-500/15 border-amber-500/40' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <div className="flex items-center gap-3">
                  <Check className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-lg font-bold text-[#E6E9EF]">
                      {restTimeRemaining === 0 ? 'Ready for Next Round' : 'Round Complete!'}
                    </p>
                    <p className="text-sm text-[#A4ACB8]">
                      {blockLabel || 'Block'} - Round {currentRound - 1} of {targetRounds} finished
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Grouped Block Info */}
              <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs uppercase px-2 py-0.5">
                    {blockGroupType === 'superset' ? 'Superset' : 
                     blockGroupType === 'circuit' ? 'Circuit' : 
                     blockGroupType === 'cluster' ? 'Cluster' : 
                     blockGroupType === 'emom' ? 'EMOM' : 'Block'}
                  </Badge>
                  <span className="text-sm text-[#A4ACB8]">Round {currentRound} of {targetRounds}</span>
                </div>
                <div className="space-y-2">
                  {blockMemberExercises.map((ex, idx) => (
                    <div key={ex.id} className="flex items-center gap-3 py-1">
                      <span className="w-6 h-6 rounded-full bg-[#2B313A] text-[#A4ACB8] text-xs flex items-center justify-center font-medium">
                        {blockGroupType === 'superset' ? `A${idx + 1}` : idx + 1}
                      </span>
                      <span className="text-sm text-[#E6E9EF]">{ex.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Rest Timer */}
              <div className="text-center py-4">
                <p className="text-sm text-[#6B7280] mb-2">
                  {restTimeRemaining === 0 ? 'Rest Complete' : 'Round Rest'}
                </p>
                <p className={`text-4xl font-mono font-bold tabular-nums ${restTimeRemaining === 0 ? 'text-amber-400' : 'text-[#E6E9EF]'}`}>
                  {Math.floor(restTimeRemaining / 60)}:{(restTimeRemaining % 60).toString().padStart(2, '0')}
                </p>
              </div>
              
              {/* Primary Action */}
              <Button
                onClick={handleRestSkip}
                className={`w-full h-16 text-lg font-bold ${
                  restTimeRemaining === 0 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-[#C1121F] hover:bg-[#A30F1A] text-white'
                }`}
              >
                {restTimeRemaining === 0 ? (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Round {currentRound}
                  </>
                ) : (
                  <>
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip Rest - Start Round {currentRound}
                  </>
                )}
              </Button>
            </>
          )}
          
          {/* ========== ACTIVE MODE UI (original) ========== */}
          {mode === 'active' && (
            <>
          {/* ========== EXERCISE CARD ========== */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
            {/* Category badge */}
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
                {exerciseCategory}
              </Badge>
            </div>
            
            {/* Exercise name */}
            <h2 className="text-lg font-bold text-[#E6E9EF] leading-tight">
              {exerciseName}
            </h2>
            
            {/* Target prescription */}
            <div className="flex items-center gap-2 mt-1.5 text-sm flex-wrap">
              <span className="text-[#A4ACB8]">Target:</span>
              <span className="text-[#E6E9EF] font-medium">{exerciseRepsOrTime}</span>
              <span className="text-[#6B7280]">·</span>
              <span className="text-[#A4ACB8]">RPE {targetRPE}</span>
              {prescribedLoad && prescribedLoad.load > 0 && (
                <>
                  <span className="text-[#6B7280]">·</span>
                  <span className="text-amber-400 font-medium">+{prescribedLoad.load}{prescribedLoad.unit}</span>
                </>
              )}
            </div>
            
            {/* Set progress dots */}
            <div className="flex items-center gap-3 mt-3">
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
          <Card className="bg-[#1A1F26] border-[#2B313A] p-3 space-y-4">
            {/* Reps/Hold Input */}
            {isHold ? (
              <RepsHoldInput type="hold" value={holdValue} onChange={onSetHold} targetValue={targetValue} />
            ) : (
              <RepsHoldInput type="reps" value={repsValue} onChange={onSetReps} targetValue={targetValue} />
            )}
            
            {/* RPE Selector */}
            <RPEQuickSelector value={selectedRPE} onChange={onSetRPE} targetRPE={targetRPE} />
            
            {/* Band Selector (if enabled) */}
            {bandSelectable && (
              <BandSelector value={bandUsed} onChange={onSetBand} recommendedBand={recommendedBand} />
            )}
            
            {/* Per-set notes section - collapsible */}
            {onSetNote && onToggleReasonTag && (
              <div className="border-t border-[#2B313A] pt-3">
                <button
                  onClick={() => setShowSetNotes(!showSetNotes)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
                    <MessageSquare className="w-4 h-4" />
                    <span>Add note</span>
                    {(currentSetNote || currentSetReasonTags.length > 0) && (
                      <span className="text-xs text-[#6B7280]">
                        ({currentSetReasonTags.length > 0 ? currentSetReasonTags.length + ' tags' : 'note added'})
                      </span>
                    )}
                  </div>
                  {showSetNotes ? (
                    <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                  )}
                </button>
                
                {showSetNotes && (
                  <div className="mt-3 space-y-3">
                    {/* Reason tags - quick tap selection */}
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(SET_REASON_TAG_LABELS) as [SetReasonTag, string][]).map(([tag, label]) => {
                        const isSelected = currentSetReasonTags.includes(tag)
                        return (
                          <button
                            key={tag}
                            onClick={() => onToggleReasonTag(tag)}
                            className={`px-2 py-1 rounded-md text-xs transition-colors ${
                              isSelected
                                ? 'bg-[#C1121F]/20 text-[#C1121F] border border-[#C1121F]/30'
                                : 'bg-[#2B313A] text-[#A4ACB8] border border-transparent hover:border-[#3B4250]'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Free text note */}
                    <Textarea
                      placeholder="Optional note for this set..."
                      value={currentSetNote}
                      onChange={(e) => onSetNote(e.target.value)}
                      className="bg-[#2B313A] border-[#3B4250] text-[#E6E9EF] placeholder:text-[#6B7280] text-sm resize-none h-16"
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* ========== RECENT SETS LEDGER ========== */}
          {recentSets.length > 0 && (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
              <div className="text-xs font-medium text-[#A4ACB8] mb-2">Recent Sets</div>
              <div className="space-y-1 text-xs">
                {recentSets.map((set, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1.5 bg-[#2B313A]/50 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[#6B7280] w-12">Set {set.setNumber}</span>
                      <span className="text-[#E6E9EF] font-medium">
                        {set.actualReps > 0 ? `${set.actualReps}` : set.holdSeconds ? `${set.holdSeconds}s` : '—'}
                      </span>
                      {set.bandUsed && set.bandUsed !== 'none' && (
                        <span className="text-[#C1121F]">{set.bandUsed}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#A4ACB8]">RPE {set.actualRPE}</span>
                      {set.reasonTags && set.reasonTags.length > 0 && (
                        <span className="text-[#C1121F] text-[10px]">+{set.reasonTags.length}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
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
          <div className="flex items-center justify-between pt-2">
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
            </>
          )}
          {/* ========== END MODE CONDITIONAL ========== */}
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
