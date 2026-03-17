'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Check, 
  Clock, 
  Dumbbell,
  SkipForward,
  CheckCircle2,
  X,
  MessageSquare,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { AdaptiveSession } from '@/lib/adaptive-program-builder'
import { 
  ResistanceBandColor, 
  ALL_BAND_COLORS, 
  BAND_SHORT_LABELS, 
  BAND_COLORS 
} from '@/lib/band-progression-engine'
import { RPE_QUICK_OPTIONS, type RPEValue } from '@/lib/rpe-adjustment-engine'
import { InlineRestTimer } from '@/components/workout/InlineRestTimer'
import { ExerciseOptionsMenu } from '@/components/workout/ExerciseOptionsMenu'
import {
  addOverride,
  getSessionOverrides,
  clearSessionOverrides,
  getOverrideSummary,
  type ExerciseOverride,
} from '@/lib/exercise-override-service'
import { SessionPerformanceCard } from '@/components/workout/SessionPerformanceCard'
import { PostWorkoutSummary } from '@/components/workout/PostWorkoutSummary'
import { getSessionPerformance, createPerformanceInputFromStats } from '@/lib/session-performance'
import { getDailyReadiness } from '@/lib/daily-readiness'
import { 
  getRestRecommendation, 
  type RestRecommendation,
  loadRestTimerState,
  clearRestTimerState,
} from '@/lib/rest-intelligence'
import {
  quickLogWorkout,
  type PerceivedDifficulty,
  type SessionType,
  type FocusArea,
} from '@/lib/workout-log-service'
import { evaluateAllChallenges } from '@/lib/challenges/challenge-engine'
import { evaluateAchievements } from '@/lib/achievements/achievement-engine'
import type { WorkoutReasoningSummary } from '@/lib/readiness/canonical-readiness-engine'
import { WhyThisWorkout, ExerciseReasonBubble, WorkoutFocusBadge } from '@/components/workout/WhyThisWorkout'

// =============================================================================
// TYPES
// =============================================================================

interface CompletedSetData {
  exerciseIndex: number
  setNumber: number
  actualReps: number
  holdSeconds?: number
  actualRPE: RPEValue
  bandUsed: ResistanceBandColor | 'none'
  timestamp: number
}

interface ExerciseOverrideState {
  originalName: string
  currentName: string
  isSkipped: boolean
  isReplaced: boolean
  isProgressionAdjusted: boolean
}

interface WorkoutSessionState {
  status: 'ready' | 'active' | 'resting' | 'completed'
  currentExerciseIndex: number
  currentSetNumber: number
  completedSets: CompletedSetData[]
  startTime: number | null
  elapsedSeconds: number
  lastSetRPE: RPEValue | null
  workoutNotes: string
  exerciseOverrides: Record<number, ExerciseOverrideState>
}

// Resume prompt state (exported for use in other components)
export interface SavedSessionInfo {
  sessionId: string
  savedAt: number
  progress: {
    exerciseIndex: number
    setNumber: number
    completedSets: number
    elapsedSeconds: number
  }
}

// Storage key for auto-save
const STORAGE_KEY = 'spartanlab_workout_session'

// =============================================================================
// AUTO-SAVE HELPERS
// =============================================================================

function saveSessionToStorage(state: WorkoutSessionState, sessionId: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ...state, 
      sessionId,
      savedAt: Date.now() 
    }))
  } catch {}
}

function loadSessionFromStorage(sessionId: string): WorkoutSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved)
    // Only restore if same session and less than 4 hours old
    if (data.sessionId === sessionId && Date.now() - data.savedAt < 4 * 60 * 60 * 1000) {
      return data
    }
    return null
  } catch {
    return null
  }
}

// Check for ANY existing session (for resume prompt)
export function getExistingSessionInfo(): SavedSessionInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved)
    // Only show resume prompt if less than 4 hours old and has progress
    if (Date.now() - data.savedAt < 4 * 60 * 60 * 1000 && data.completedSets?.length > 0) {
      return {
        sessionId: data.sessionId,
        savedAt: data.savedAt,
        progress: {
          exerciseIndex: data.currentExerciseIndex || 0,
          setNumber: data.currentSetNumber || 1,
          completedSets: data.completedSets?.length || 0,
          elapsedSeconds: data.elapsedSeconds || 0,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

export function clearSessionStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// =============================================================================
// QUICK INPUT COMPONENTS
// =============================================================================

interface RPEQuickSelectorProps {
  value: RPEValue | null
  onChange: (value: RPEValue) => void
  targetRPE?: number
}

function RPEQuickSelector({ value, onChange, targetRPE }: RPEQuickSelectorProps) {
  // Use common RPE values for quick selection
  const quickValues = RPE_QUICK_OPTIONS
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">RPE</span>
        {targetRPE && (
          <span className="text-xs text-[#6B7280]">Target: {targetRPE}</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {quickValues.map((rpe) => (
          <button
            key={rpe}
            onClick={() => onChange(rpe)}
            className={`
              py-3 rounded-lg text-lg font-bold transition-all
              ${value === rpe 
                ? 'bg-[#C1121F] text-white scale-105' 
                : 'bg-[#1A1F26] text-[#A4ACB8] border border-[#2B313A] active:bg-[#2B313A]'
              }
            `}
          >
            {rpe}
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-[#6B7280] text-center">
          {value <= 6 && 'Easy - Could do many more'}
          {value === 7 && 'Moderate - 3+ reps left'}
          {value === 7.5 && 'Moderate-hard - 2-3 reps left'}
          {value === 8 && 'Hard - 2 reps left'}
          {value === 8.5 && 'Very hard - 1-2 reps left'}
          {value === 9 && 'Near max - 1 rep left'}
          {value === 9.5 && 'Almost max'}
          {value === 10 && 'Max effort - No more possible'}
        </p>
      )}
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
  const label = type === 'reps' ? 'Reps' : 'Hold (sec)'
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">{label}</span>
        <span className="text-xs text-[#6B7280]">Target: {targetValue}</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-14 h-14 rounded-xl bg-[#1A1F26] border border-[#2B313A] text-[#A4ACB8] text-2xl font-bold active:bg-[#2B313A]"
        >
          -
        </button>
        <span className="w-20 text-center text-4xl font-bold text-[#E6E9EF]">
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-14 h-14 rounded-xl bg-[#1A1F26] border border-[#2B313A] text-[#A4ACB8] text-2xl font-bold active:bg-[#2B313A]"
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">Band Used</span>
        {recommendedBand && (
          <span className="text-xs text-[#6B7280]">Rec: {BAND_SHORT_LABELS[recommendedBand]}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {bandOptions.map((band) => {
          const isSelected = value === band
          const colors = band === 'none' ? null : BAND_COLORS[band]
          
          return (
            <button
              key={band}
              onClick={() => onChange(band)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isSelected 
                  ? band === 'none'
                    ? 'bg-[#2B313A] text-[#E6E9EF] ring-2 ring-[#C1121F]'
                    : `${colors?.bg} ${colors?.text} ring-2 ring-current`
                  : band === 'none'
                    ? 'bg-[#1A1F26] text-[#6B7280] border border-[#2B313A]'
                    : `${colors?.bg} ${colors?.text} opacity-60`
                }
              `}
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

interface StreamlinedWorkoutSessionProps {
  session: AdaptiveSession
  reasoningSummary?: WorkoutReasoningSummary
  onComplete: () => void
  onCancel: () => void
}

export function StreamlinedWorkoutSession({
  session,
  reasoningSummary,
  onComplete,
  onCancel
}: StreamlinedWorkoutSessionProps) {
  const sessionId = `session-${session.dayLabel}-${session.dayNumber}`
  
  // Check for existing session on mount
  const [existingSession, setExistingSession] = useState<SavedSessionInfo | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  
  // Try to restore from storage
  const [state, setState] = useState<WorkoutSessionState>(() => {
    const saved = loadSessionFromStorage(sessionId)
    if (saved && saved.status !== 'completed') {
      return saved
    }
    return {
      status: 'ready',
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      startTime: null,
      elapsedSeconds: 0,
      lastSetRPE: null,
      workoutNotes: '',
      exerciseOverrides: {},
    }
  })
  
  // Check for resume prompt on mount
  useEffect(() => {
    const existing = getExistingSessionInfo()
    if (existing && existing.sessionId === sessionId && state.completedSets.length > 0 && state.status === 'ready') {
      // We have a saved session that matches - show resume prompt
      setExistingSession(existing)
      setShowResumePrompt(true)
    }
  }, [])
  
  // Current set input state
  const [selectedRPE, setSelectedRPE] = useState<RPEValue | null>(null)
  const [repsValue, setRepsValue] = useState<number>(0)
  const [holdValue, setHoldValue] = useState<number>(0)
  const [bandUsed, setBandUsed] = useState<ResistanceBandColor | 'none'>('none')
  
  // Save state for completed workout
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<PerceivedDifficulty | null>(null)
  const [showQuickLog, setShowQuickLog] = useState(false)
  
  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Current exercise
  const currentExercise = session.exercises[state.currentExerciseIndex]
  const totalExercises = session.exercises.length
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const completedSetsCount = state.completedSets.length
  
  // Determine if exercise uses holds or reps
  const isHoldExercise = currentExercise?.repsOrTime?.toLowerCase().includes('sec') || 
                         currentExercise?.repsOrTime?.toLowerCase().includes('hold')
  
  // Parse target value
  const getTargetValue = (): number => {
    if (!currentExercise) return 5
    const match = currentExercise.repsOrTime.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 5
  }
  
  // Recommended band from exercise (if any)
  const getRecommendedBand = (): ResistanceBandColor | undefined => {
    if (!currentExercise?.note) return undefined
    const note = currentExercise.note.toLowerCase()
    for (const band of ALL_BAND_COLORS) {
      if (note.includes(band)) return band
    }
    return undefined
  }
  
  // Auto-save on state changes
  useEffect(() => {
    if (state.status !== 'ready') {
      saveSessionToStorage(state, sessionId)
    }
  }, [state, sessionId])
  
  // Initialize values when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setRepsValue(getTargetValue())
      setHoldValue(getTargetValue())
      setSelectedRPE(null)
      const recBand = getRecommendedBand()
      setBandUsed(recBand || 'none')
    }
  }, [state.currentExerciseIndex])
  
  // Timer effect
  useEffect(() => {
    if (state.status === 'active' && state.startTime) {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000)
        }))
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state.status, state.startTime])
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start workout
  const handleStart = useCallback(() => {
    setShowResumePrompt(false)
    setState(prev => ({
      ...prev,
      status: 'active',
      startTime: prev.startTime || Date.now(),
    }))
  }, [])
  
  // Resume existing workout
  const handleResume = useCallback(() => {
    setShowResumePrompt(false)
    // State is already restored, just start the timer if needed
    setState(prev => ({
      ...prev,
      status: prev.status === 'ready' ? 'active' : prev.status,
      startTime: prev.startTime || Date.now(),
    }))
  }, [])
  
  // Start fresh workout (discard saved)
  const handleStartNew = useCallback(() => {
    clearSessionStorage()
    clearRestTimerState()
    clearSessionOverrides()
    setShowResumePrompt(false)
    setExistingSession(null)
    setState({
      status: 'active',
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      startTime: Date.now(),
      elapsedSeconds: 0,
      lastSetRPE: null,
      workoutNotes: '',
      exerciseOverrides: {},
    })
  }, [])
  
  // Complete set
  const handleCompleteSet = useCallback(() => {
    if (!currentExercise) return
    
    const setData: CompletedSetData = {
      exerciseIndex: state.currentExerciseIndex,
      setNumber: state.currentSetNumber,
      actualReps: isHoldExercise ? 0 : repsValue,
      holdSeconds: isHoldExercise ? holdValue : undefined,
      actualRPE: selectedRPE || 8,
      bandUsed,
      timestamp: Date.now(),
    }
    
    const newCompletedSets = [...state.completedSets, setData]
    const isLastSet = state.currentSetNumber >= currentExercise.sets
    const isLastExercise = state.currentExerciseIndex >= session.exercises.length - 1
    
    const lastRPE = selectedRPE || 8
    
    if (isLastSet && isLastExercise) {
      // Workout complete
      setState(prev => ({
        ...prev,
        status: 'completed',
        completedSets: newCompletedSets,
        lastSetRPE: lastRPE,
      }))
      clearSessionStorage()
      clearRestTimerState()
    } else if (isLastSet) {
      // Move to next exercise - no rest timer between exercises
      setState(prev => ({
        ...prev,
        status: 'active', // Go directly to next exercise, no rest
        completedSets: newCompletedSets,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        currentSetNumber: 1,
        lastSetRPE: lastRPE,
      }))
    } else {
      // Move to next set with rest
      setState(prev => ({
        ...prev,
        status: 'resting',
        completedSets: newCompletedSets,
        currentSetNumber: prev.currentSetNumber + 1,
        lastSetRPE: lastRPE,
      }))
    }
    
    // Reset inputs for next set
    setSelectedRPE(null)
    setRepsValue(getTargetValue())
    setHoldValue(getTargetValue())
  }, [currentExercise, state, repsValue, holdValue, selectedRPE, bandUsed, isHoldExercise, session.exercises.length])
  
  // Rest complete / skip rest
  const handleRestComplete = useCallback(() => {
    clearRestTimerState()
    setState(prev => ({
      ...prev,
      status: 'active',
    }))
  }, [])
  
  // Skip exercise
  const handleSkipExercise = useCallback(() => {
    const isLastExercise = state.currentExerciseIndex >= session.exercises.length - 1
    if (isLastExercise) {
      setState(prev => ({ ...prev, status: 'completed' }))
      clearSessionStorage()
    } else {
      setState(prev => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        currentSetNumber: 1,
      }))
    }
    setSelectedRPE(null)
  }, [state.currentExerciseIndex, session.exercises.length])
  
  // ==========================================================================
  // EXERCISE OVERRIDE HANDLERS
  // ==========================================================================
  
  // Handle exercise replacement
  const handleReplaceExercise = useCallback((newExercise: { id: string; name: string }) => {
    const exerciseIndex = state.currentExerciseIndex
    const originalExercise = session.exercises[exerciseIndex]
    
    // Record override in storage for adaptive tracking
    const override: ExerciseOverride = {
      originalExerciseId: originalExercise.id || originalExercise.name,
      originalExerciseName: originalExercise.name,
      overrideType: 'replaced',
      newExerciseId: newExercise.id,
      newExerciseName: newExercise.name,
      timestamp: Date.now(),
    }
    addOverride(sessionId, override)
    
    // Update local state
    setState(prev => ({
      ...prev,
      exerciseOverrides: {
        ...prev.exerciseOverrides,
        [exerciseIndex]: {
          originalName: originalExercise.name,
          currentName: newExercise.name,
          isSkipped: false,
          isReplaced: true,
          isProgressionAdjusted: false,
        },
      },
    }))
  }, [sessionId, state.currentExerciseIndex, session.exercises])
  
  // Handle exercise skip via menu (different from skip button)
  const handleMenuSkipExercise = useCallback(() => {
    const exerciseIndex = state.currentExerciseIndex
    const originalExercise = session.exercises[exerciseIndex]
    
    // Record skip override for adaptive tracking
    const override: ExerciseOverride = {
      originalExerciseId: originalExercise.id || originalExercise.name,
      originalExerciseName: originalExercise.name,
      overrideType: 'skipped',
      timestamp: Date.now(),
    }
    addOverride(sessionId, override)
    
    // Mark as skipped and move to next
    setState(prev => ({
      ...prev,
      exerciseOverrides: {
        ...prev.exerciseOverrides,
        [exerciseIndex]: {
          originalName: originalExercise.name,
          currentName: originalExercise.name,
          isSkipped: true,
          isReplaced: false,
          isProgressionAdjusted: false,
        },
      },
    }))
    
    // Then advance to next exercise
    handleSkipExercise()
  }, [sessionId, state.currentExerciseIndex, session.exercises, handleSkipExercise])
  
  // Handle progression adjustment
  const handleProgressionChange = useCallback((newProgression: { id: string; name: string }) => {
    const exerciseIndex = state.currentExerciseIndex
    const originalExercise = session.exercises[exerciseIndex]
    
    // Record progression adjustment for adaptive tracking
    const override: ExerciseOverride = {
      originalExerciseId: originalExercise.id || originalExercise.name,
      originalExerciseName: originalExercise.name,
      overrideType: 'progression_adjusted',
      newExerciseId: newProgression.id,
      newProgression: newProgression.name,
      timestamp: Date.now(),
    }
    addOverride(sessionId, override)
    
    // Update local state
    setState(prev => ({
      ...prev,
      exerciseOverrides: {
        ...prev.exerciseOverrides,
        [exerciseIndex]: {
          originalName: originalExercise.name,
          currentName: newProgression.name,
          isSkipped: false,
          isReplaced: false,
          isProgressionAdjusted: true,
        },
      },
    }))
  }, [sessionId, state.currentExerciseIndex, session.exercises])
  
  // Handle undo override
  const handleUndoOverride = useCallback(() => {
    const exerciseIndex = state.currentExerciseIndex
    
    // Remove from local state
    setState(prev => {
      const newOverrides = { ...prev.exerciseOverrides }
      delete newOverrides[exerciseIndex]
      return {
        ...prev,
        exerciseOverrides: newOverrides,
      }
    })
  }, [state.currentExerciseIndex])
  
  // Get effective exercise (with override applied)
  const getEffectiveExercise = useCallback((index: number) => {
    const baseExercise = session.exercises[index]
    const override = state.exerciseOverrides[index]
    
    if (!override) return baseExercise
    
    return {
      ...baseExercise,
      name: override.currentName,
      originalName: override.originalName,
      isReplaced: override.isReplaced,
      isSkipped: override.isSkipped,
      isProgressionAdjusted: override.isProgressionAdjusted,
    }
  }, [session.exercises, state.exerciseOverrides])
  
  // Get current effective exercise
  const effectiveExercise = getEffectiveExercise(state.currentExerciseIndex)
  
  // Finish workout
  const handleFinish = useCallback(() => {
    setState(prev => ({ ...prev, status: 'completed' }))
    clearSessionStorage()
    clearRestTimerState()
  }, [])
  
  // Save completed workout with full logging
  const handleSaveWorkout = useCallback(async (difficulty?: PerceivedDifficulty) => {
    setIsSaving(true)
    try {
      // Use provided difficulty or the state value
      const finalDifficulty = difficulty || perceivedDifficulty || 'normal'
      
      // Calculate key performance metrics from completed sets
      const keyPerformance: {
        pullUps?: number
        dips?: number
        pushUps?: number
        skillHoldSeconds?: number
        skillName?: string
      } = {}
      
      // Find best performance for key exercises
      session.exercises.forEach((exercise, exerciseIndex) => {
        const exerciseSets = state.completedSets.filter(s => s.exerciseIndex === exerciseIndex)
        if (exerciseSets.length === 0) return
        
        const bestReps = Math.max(...exerciseSets.map(s => s.actualReps))
        const bestHold = Math.max(...exerciseSets.map(s => s.holdSeconds || 0))
        
        const nameLower = exercise.name.toLowerCase()
        
        if (nameLower.includes('pull-up') || nameLower.includes('pull up') || nameLower.includes('pullup')) {
          keyPerformance.pullUps = Math.max(keyPerformance.pullUps || 0, bestReps)
        } else if (nameLower.includes('dip')) {
          keyPerformance.dips = Math.max(keyPerformance.dips || 0, bestReps)
        } else if (nameLower.includes('push-up') || nameLower.includes('push up') || nameLower.includes('pushup')) {
          keyPerformance.pushUps = Math.max(keyPerformance.pushUps || 0, bestReps)
        } else if (exercise.category === 'skill' && bestHold > 0) {
          // Track skill holds
          if (!keyPerformance.skillHoldSeconds || bestHold > keyPerformance.skillHoldSeconds) {
            keyPerformance.skillHoldSeconds = bestHold
            keyPerformance.skillName = exercise.name
          }
        }
      })
      
      // Determine session type and focus area
      const sessionType: SessionType = session.dayLabel.toLowerCase().includes('skill') 
        ? 'skill' 
        : session.dayLabel.toLowerCase().includes('strength')
          ? 'strength'
          : 'mixed'
      
      const focusArea: FocusArea = session.exercises.some(e => e.name.toLowerCase().includes('planche'))
        ? 'planche'
        : session.exercises.some(e => e.name.toLowerCase().includes('front lever'))
          ? 'front_lever'
          : session.exercises.some(e => e.name.toLowerCase().includes('muscle'))
            ? 'muscle_up'
            : session.exercises.some(e => e.name.toLowerCase().includes('hspu') || e.name.toLowerCase().includes('handstand push'))
              ? 'handstand_pushup'
              : session.exercises.some(e => e.name.toLowerCase().includes('weighted'))
                ? 'weighted_strength'
                : 'general'
      
      // Quick log the workout
      quickLogWorkout({
        sessionName: session.dayLabel,
        sessionType,
        focusArea,
        durationMinutes: Math.round(state.elapsedSeconds / 60),
        perceivedDifficulty: finalDifficulty,
        generatedWorkoutId: sessionId,
        keyPerformance,
        notes: state.workoutNotes || undefined,
      })
      
      // Evaluate achievements and challenges
      try {
        evaluateAchievements()
        evaluateAllChallenges()
      } catch (e) {
        console.error('Failed to evaluate achievements/challenges:', e)
      }
      
      // Clear session data
      clearSessionStorage()
      clearRestTimerState()
      clearSessionOverrides()
      setIsSaved(true)
      setShowQuickLog(false)
    } catch (error) {
      console.error('Failed to save workout:', error)
    } finally {
      setIsSaving(false)
    }
  }, [session, state, sessionId, perceivedDifficulty])
  
  // Get intelligent rest recommendation
  const getRestRecommendationForCurrentExercise = useCallback((): RestRecommendation => {
    if (!currentExercise) {
      return {
        baseSeconds: 120,
        adjustedSeconds: 120,
        adjustment: { delta: 0, reason: '', type: 'none' },
        category: 'accessory',
      }
    }
    
    const avgRPE = state.completedSets.length > 0
      ? state.completedSets.reduce((sum, s) => sum + s.actualRPE, 0) / state.completedSets.length
      : null
    
    return getRestRecommendation(
      currentExercise,
      state.lastSetRPE || undefined,
      {
        setNumber: state.currentSetNumber,
        totalSetsCompleted: state.completedSets.length,
        averageRPE: avgRPE,
      }
    )
  }, [currentExercise, state.lastSetRPE, state.currentSetNumber, state.completedSets])
  
  // Legacy getRestTime for any other usage
  const getRestTime = (): number => {
    return getRestRecommendationForCurrentExercise().adjustedSeconds
  }
  
  // Calculate session stats for performance score
  const getSessionStats = () => {
    const totalSetsCompleted = state.completedSets.length
    const avgRPE = totalSetsCompleted > 0 
      ? state.completedSets.reduce((sum, s) => sum + s.actualRPE, 0) / totalSetsCompleted 
      : null
    
    return {
      totalSets: totalSets,
      completedSets: totalSetsCompleted,
      totalExercises: totalExercises,
      completedExercises: state.currentExerciseIndex + (state.status === 'completed' ? 1 : 0),
      averageRPE: avgRPE,
      estimatedVolume: totalSetsCompleted * 10, // simplified
      elapsedSeconds: state.elapsedSeconds,
    }
  }
  
  // ==========================================================================
  // RENDER: RESUME PROMPT
  // ==========================================================================
  
  if (showResumePrompt && existingSession && state.completedSets.length > 0) {
    return (
      <div className="min-h-screen bg-[#0F1115] p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-6 pt-12">
          {/* Resume Icon */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-10 h-10 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">
              Resume Workout?
            </h1>
            <p className="text-[#A4ACB8]">
              You have an unfinished session
            </p>
          </div>
          
          {/* Session Info */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-3">Saved Progress</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-[#E6E9EF]">{existingSession.progress.completedSets}</p>
                <p className="text-xs text-[#6B7280]">Sets Done</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#E6E9EF]">
                  {existingSession.progress.exerciseIndex + 1}/{totalExercises}
                </p>
                <p className="text-xs text-[#6B7280]">Exercise</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#E6E9EF]">
                  {formatDuration(existingSession.progress.elapsedSeconds)}
                </p>
                <p className="text-xs text-[#6B7280]">Elapsed</p>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] text-center mt-3">
              Saved {Math.round((Date.now() - existingSession.savedAt) / 60000)} minutes ago
            </p>
          </Card>
          
          {/* Resume Button */}
          <Button
            onClick={handleResume}
            className="w-full h-16 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-lg font-bold"
          >
            <Play className="w-6 h-6 mr-2" />
            Resume Session
          </Button>
          
          {/* Start New Button */}
          <Button
            variant="outline"
            onClick={handleStartNew}
            className="w-full h-14 border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Start New Workout
          </Button>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-[#6B7280]"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: READY STATE
  // ==========================================================================
  
  if (state.status === 'ready') {
    return (
      <div className="min-h-screen bg-[#0F1115] p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header with Session Context */}
          <div className="text-center pt-8">
            <div className="w-20 h-20 rounded-full bg-[#C1121F]/10 border-2 border-[#C1121F]/30 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-10 h-10 text-[#C1121F]" />
            </div>
            <Badge className="bg-[#C1121F]/10 text-[#C1121F] border-0 mb-4">
              Ready to Train
            </Badge>
            <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">
              {session.dayLabel}
            </h1>
            <p className="text-[#A4ACB8]">
              {session.exercises.length} exercises • {totalSets} sets
            </p>
            {session.estimatedMinutes && (
              <p className="text-xs text-[#6B7280] mt-1">
                Est. {session.estimatedMinutes} minutes
              </p>
            )}
          </div>
          
          {/* Session Overview Card */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Today&apos;s Workout</p>
              {reasoningSummary ? (
                <WorkoutFocusBadge 
                  focus={reasoningSummary.workoutFocus} 
                  sessionType={reasoningSummary.sessionType}
                  size="sm"
                />
              ) : (
                <Badge variant="outline" className="text-xs border-[#2B313A] text-[#A4ACB8]">
                  {session.focusLabel}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {session.exercises.slice(0, 5).map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#2B313A]/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#2B313A] text-[#6B7280] text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#E6E9EF]">{ex.name}</span>
                  </div>
                  <span className="text-xs text-[#6B7280]">{ex.sets} × {ex.repsOrTime}</span>
                </div>
              ))}
              {session.exercises.length > 5 && (
                <p className="text-xs text-[#6B7280] text-center pt-2">
                  +{session.exercises.length - 5} more exercises
                </p>
              )}
            </div>
          </Card>
          
          {/* Why This Workout - Reasoning Explanation */}
          {reasoningSummary && (
            <WhyThisWorkout
              reasoning={reasoningSummary}
              defaultCollapsed={true}
              variant="card"
            />
          )}
          
          {/* What to Expect */}
          <div className="bg-[#1A1F26]/50 border border-[#2B313A]/50 rounded-lg p-4">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">When You Start</p>
            <ul className="space-y-1.5 text-sm text-[#A4ACB8]">
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                Session timer will begin
              </li>
              <li className="flex items-center gap-2">
                <Dumbbell className="w-3.5 h-3.5 text-[#6B7280]" />
                Log sets as you complete them
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6B7280]" />
                Progress auto-saves if you pause
              </li>
            </ul>
          </div>
          
          {/* Start Button - Large and Prominent */}
          <Button
            onClick={handleStart}
            className="w-full h-16 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-lg font-bold shadow-lg shadow-[#C1121F]/20"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Workout
          </Button>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-[#6B7280]"
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: COMPLETED STATE
  // ==========================================================================
  
  if (state.status === 'completed') {
    const stats = getSessionStats()
    let readiness: ReturnType<typeof getDailyReadiness> | null = null
    try {
      readiness = getDailyReadiness()
    } catch {
      // Readiness may not be available
    }
    const performanceInput = createPerformanceInputFromStats(
      {
        completedSets: stats.completedSets,
        totalSets: stats.totalSets,
        elapsedSeconds: stats.elapsedSeconds,
        averageRPE: stats.averageRPE || undefined,
      },
      state.completedSets.map(s => {
        // Get target for this specific exercise
        const exercise = session.exercises[s.exerciseIndex]
        const match = exercise?.repsOrTime?.match(/(\d+)/)
        const target = match ? parseInt(match[1], 10) : 5
        return {
          targetReps: target,
          actualReps: s.actualReps || s.holdSeconds || target,
          targetRPE: 8,
          actualRPE: s.actualRPE,
        }
      }),
      'mixed',
      session.dayLabel,
      readiness || undefined
    )
    const performance = getSessionPerformance(performanceInput)
    
    // Generate skill signal if skill exercises were performed
    const skillExercises = session.exercises.filter(ex => 
      ex.name.toLowerCase().includes('front lever') ||
      ex.name.toLowerCase().includes('planche') ||
      ex.name.toLowerCase().includes('muscle-up') ||
      ex.name.toLowerCase().includes('handstand')
    )
    let skillSignal: string | null = null
    if (skillExercises.length > 0 && performance.performanceTier !== 'low') {
      const skillName = skillExercises[0].name.split(' ')[0]
      if (performance.performanceTier === 'excellent' || performance.performanceTier === 'strong') {
        skillSignal = `${skillName} stability improving.`
      } else {
        skillSignal = `${skillName} work logged. Consistency building.`
      }
    }
    
    // Generate band progression note if bands were used
    const bandsUsed = state.completedSets
      .filter(s => s.bandUsed && s.bandUsed !== 'none')
      .map(s => s.bandUsed)
    let bandProgressNote: string | null = null
    if (bandsUsed.length > 0) {
      const uniqueBands = [...new Set(bandsUsed)]
      const primaryBand = uniqueBands[0]
      if (primaryBand) {
        const bandLabel = primaryBand.charAt(0).toUpperCase() + primaryBand.slice(1)
        if (performance.performanceTier === 'excellent' || performance.performanceTier === 'strong') {
          bandProgressNote = `${bandLabel} band is stabilizing well.`
        } else {
          bandProgressNote = `${bandLabel} band assistance logged.`
        }
      }
    }
    
    // Before saving - show Quick Log + PostWorkoutSummary
    if (!isSaved) {
      return (
        <div className="min-h-screen bg-[#0F1115] p-4 sm:p-6">
          <div className="max-w-lg mx-auto pt-6 space-y-4">
            {/* Quick Log - Difficulty Selection (Required for quality data) */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-3">How did this session feel?</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={perceivedDifficulty === 'easy' ? 'default' : 'outline'}
                  onClick={() => setPerceivedDifficulty('easy')}
                  className={`h-14 flex flex-col gap-0.5 ${
                    perceivedDifficulty === 'easy' 
                      ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                      : 'border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50'
                  }`}
                >
                  <span className="text-base font-semibold">Easy</span>
                  <span className="text-[10px] opacity-70">Could do more</span>
                </Button>
                <Button
                  variant={perceivedDifficulty === 'normal' ? 'default' : 'outline'}
                  onClick={() => setPerceivedDifficulty('normal')}
                  className={`h-14 flex flex-col gap-0.5 ${
                    perceivedDifficulty === 'normal' 
                      ? 'bg-[#C1121F] hover:bg-[#A30F1A] text-white border-[#C1121F]' 
                      : 'border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50'
                  }`}
                >
                  <span className="text-base font-semibold">Normal</span>
                  <span className="text-[10px] opacity-70">Just right</span>
                </Button>
                <Button
                  variant={perceivedDifficulty === 'hard' ? 'default' : 'outline'}
                  onClick={() => setPerceivedDifficulty('hard')}
                  className={`h-14 flex flex-col gap-0.5 ${
                    perceivedDifficulty === 'hard' 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600' 
                      : 'border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A]/50'
                  }`}
                >
                  <span className="text-base font-semibold">Hard</span>
                  <span className="text-[10px] opacity-70">Pushed limits</span>
                </Button>
              </div>
            </Card>
            
            {/* Optional Workout Notes - Compact */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-[#6B7280]" />
                <p className="text-sm font-medium text-[#A4ACB8]">Quick Note</p>
                <span className="text-xs text-[#6B7280]">(optional)</span>
              </div>
              <Textarea
                value={state.workoutNotes}
                onChange={(e) => setState(prev => ({ ...prev, workoutNotes: e.target.value }))}
                placeholder="Felt strong, wrists sore, short on time..."
                className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] placeholder:text-[#6B7280] min-h-[50px] resize-none text-sm"
              />
            </Card>
            
            {/* Complete Workout Button - Primary CTA */}
            <Button
              onClick={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              disabled={isSaving}
              className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-lg font-bold"
            >
              {isSaving ? 'Saving...' : 'Complete Workout'}
            </Button>
            
            {/* Performance Summary below - condensed */}
            <PostWorkoutSummary
              performance={performance}
              sessionStats={{
                completedSets: stats.completedSets,
                totalSets: stats.totalSets,
                completedExercises: stats.completedExercises,
                totalExercises: totalExercises,
                elapsedSeconds: state.elapsedSeconds,
                averageRPE: stats.averageRPE || undefined,
              }}
              sessionName={session.dayLabel}
              onReturnToDashboard={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              onViewProgram={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              bandProgressNote={bandProgressNote}
              skillSignal={skillSignal}
              overrideSummary={getOverrideSummary(sessionId)}
              goalContext={session.focusLabel ? `This ${session.focusLabel.toLowerCase()} session builds toward your primary goal. Consistent training accelerates progress.` : "Workout completed. Consistent training builds skill faster."}
              nextSession={(() => {
                const program = getLatestAdaptiveProgram()
                if (!program?.sessions) return null
                const currentIdx = program.sessions.findIndex(s => s.dayNumber === session.dayNumber)
                const nextIdx = (currentIdx + 1) % program.sessions.length
                const next = program.sessions[nextIdx]
                if (!next) return null
                return {
                  dayLabel: next.dayLabel || `Day ${next.dayNumber}`,
                  focusLabel: next.focusLabel || 'Strength Development',
                  estimatedMinutes: next.estimatedMinutes,
                }
              })()}
            />
          </div>
        </div>
      )
    }
    
    // After saving - show confirmation with feedback
    const isPartialSession = stats.completedSets < stats.totalSets * 0.5
    
    return (
      <div className="min-h-screen bg-[#0F1115] p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-4 pt-8">
          {/* Saved Confirmation */}
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full ${isPartialSession ? 'bg-amber-500/10 border-amber-500' : 'bg-green-500/10 border-green-500'} border-2 flex items-center justify-center mx-auto mb-4`}>
              <CheckCircle2 className={`w-10 h-10 ${isPartialSession ? 'text-amber-400' : 'text-green-400'}`} />
            </div>
            <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">
              {isPartialSession ? 'Partial Session Logged' : 'Workout Complete'}
            </h1>
            <p className="text-[#A4ACB8]">
              {session.dayLabel} • {stats.completedSets}/{stats.totalSets} sets
            </p>
          </div>
          
          {/* Quick Stats Feedback */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-[#E6E9EF]">{Math.round(state.elapsedSeconds / 60)}</p>
                <p className="text-xs text-[#6B7280]">minutes</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#E6E9EF]">{stats.completedSets}</p>
                <p className="text-xs text-[#6B7280]">sets</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#E6E9EF] capitalize">{perceivedDifficulty || 'Normal'}</p>
                <p className="text-xs text-[#6B7280]">difficulty</p>
              </div>
            </div>
          </Card>
          
          {/* Progress Signals */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">Progress recorded</span>
            </div>
            {performance.performanceTier === 'excellent' && (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">Excellent performance!</span>
              </div>
            )}
          </div>
          
          <Button
            onClick={onComplete}
            className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-lg"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: RESTING STATE
  // ==========================================================================
  
  if (state.status === 'resting') {
    const restRecommendation = getRestRecommendationForCurrentExercise()
    const savedRestState = loadRestTimerState()
    
    // Determine next set info
    const nextSetInfo = currentExercise ? {
      exerciseName: currentExercise.name,
      setNumber: state.currentSetNumber,
      isNewExercise: false, // We skip rest between exercises now
    } : undefined
    
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col">
        {/* Sticky Session Header - Consistent with Active State */}
        <div className="sticky top-0 z-10 bg-[#0F1115] border-b border-[#2B313A]">
          {/* Workout Title Bar */}
          <div className="px-4 py-2 bg-[#1A1F26]/80">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-semibold text-[#E6E9EF] truncate max-w-[180px]">
                  {session.dayLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="font-mono text-sm font-bold text-[#E6E9EF]">
                  {formatDuration(state.elapsedSeconds)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Exercise Progress Bar */}
          <div className="px-4 py-3">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#A4ACB8]">
                  Exercise {state.currentExerciseIndex + 1} of {totalExercises}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {completedSetsCount}/{totalSets} sets
                </span>
              </div>
              
              {/* Overall Progress Bar */}
              <div className="h-1.5 bg-[#2B313A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C1121F] transition-all duration-300"
                  style={{ width: `${(completedSetsCount / totalSets) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-4">
          
          {/* Last Set Summary */}
          {state.lastSetRPE && (
            <Card className="bg-[#0F1115]/50 border-[#2B313A]/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Last set RPE</span>
                <Badge className={`${
                  state.lastSetRPE >= 9 
                    ? 'bg-orange-500/10 text-orange-400 border-0' 
                    : state.lastSetRPE >= 8
                      ? 'bg-blue-500/10 text-blue-400 border-0'
                      : 'bg-green-500/10 text-green-400 border-0'
                }`}>
                  RPE {state.lastSetRPE}
                </Badge>
              </div>
            </Card>
          )}
          
          {/* Inline Rest Timer */}
          <InlineRestTimer
            recommendation={restRecommendation}
            exerciseIndex={state.currentExerciseIndex}
            setNumber={state.currentSetNumber}
            nextSetInfo={nextSetInfo}
            initialState={savedRestState}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
          
          {/* Exercise Context Card */}
          {currentExercise && (
            <Card className="bg-[#1A1F26]/50 border-[#2B313A]/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                    Current Exercise
                  </p>
                  <p className="font-semibold text-[#E6E9EF]">{currentExercise.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#A4ACB8]">
                    Set {state.currentSetNumber}/{currentExercise.sets}
                  </p>
                  <p className="text-xs text-[#6B7280]">{currentExercise.repsOrTime}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: ACTIVE STATE (Main Set Logging)
  // ==========================================================================
  
  if (!currentExercise) return null
  
  const targetRPE = 8 // Default target
  const targetValue = getTargetValue()
  const recommendedBand = getRecommendedBand()
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* Sticky Session Header */}
      <div className="sticky top-0 z-10 bg-[#0F1115] border-b border-[#2B313A]">
        {/* Workout Title Bar */}
        <div className="px-4 py-2 bg-[#1A1F26]/80">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-[#E6E9EF] truncate max-w-[180px]">
                {session.dayLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="font-mono text-sm font-bold text-[#E6E9EF]">
                {formatDuration(state.elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Exercise Progress Bar */}
        <div className="px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#A4ACB8]">
                Exercise {state.currentExerciseIndex + 1} of {totalExercises}
              </span>
              <span className="text-xs text-[#6B7280]">
                {completedSetsCount}/{totalSets} sets
              </span>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="h-1.5 bg-[#2B313A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C1121F] transition-all duration-300"
                style={{ width: `${(completedSetsCount / totalSets) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6">
      <div className="max-w-lg mx-auto space-y-4">
        
        {/* Exercise Header Card */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-xs uppercase">
                {currentExercise.category}
              </Badge>
              {currentExercise.note && (
                <Badge className="bg-amber-500/10 text-amber-400 border-0 text-xs">
                  {currentExercise.note.includes('band') ? 'Band Assisted' : 'Note'}
                </Badge>
              )}
              {/* Override indicator badges */}
              {state.exerciseOverrides[state.currentExerciseIndex]?.isReplaced && (
                <Badge className="bg-blue-500/10 text-blue-400 border-0 text-xs">
                  Replaced
                </Badge>
              )}
              {state.exerciseOverrides[state.currentExerciseIndex]?.isProgressionAdjusted && (
                <Badge className="bg-purple-500/10 text-purple-400 border-0 text-xs">
                  Adjusted
                </Badge>
              )}
            </div>
            {/* Exercise Options Menu */}
            <ExerciseOptionsMenu
              exercise={currentExercise}
              exerciseIndex={state.currentExerciseIndex}
              sessionId={sessionId}
              onReplace={handleReplaceExercise}
              onSkip={handleMenuSkipExercise}
              onProgressionChange={handleProgressionChange}
              onUndo={handleUndoOverride}
            />
          </div>
          
          <h2 className="text-xl font-bold text-[#E6E9EF] mb-1">
            {effectiveExercise.name}
          </h2>
          
          {/* Show original exercise name if changed */}
          {state.exerciseOverrides[state.currentExerciseIndex] && (
            <p className="text-xs text-[#6B7280] mb-2">
              Originally: {state.exerciseOverrides[state.currentExerciseIndex].originalName}
            </p>
          )}
          
          {/* Set Progress Dots */}
          <div className="flex items-center gap-2 mb-3">
            {Array.from({ length: currentExercise.sets }).map((_, idx) => (
              <div
                key={idx}
                className={`
                  h-2.5 flex-1 rounded-full transition-all
                  ${idx < state.currentSetNumber - 1 
                    ? 'bg-green-500' 
                    : idx === state.currentSetNumber - 1 
                      ? 'bg-[#C1121F]' 
                      : 'bg-[#2B313A]'
                  }
                `}
              />
            ))}
          </div>
          
          {/* Current Set Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#A4ACB8]">
              Set <span className="text-lg font-bold text-[#E6E9EF]">{state.currentSetNumber}</span> of {currentExercise.sets}
            </span>
            <span className="text-[#A4ACB8]">
              {isHoldExercise ? 'Hold' : 'Reps'}: <span className="text-[#E6E9EF] font-medium">{currentExercise.repsOrTime}</span>
            </span>
          </div>
        </Card>
        
        {/* Input Section */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-4 space-y-5">
          {/* Reps or Hold Input */}
          {isHoldExercise ? (
            <RepsHoldInput
              type="hold"
              value={holdValue}
              onChange={setHoldValue}
              targetValue={targetValue}
            />
          ) : (
            <RepsHoldInput
              type="reps"
              value={repsValue}
              onChange={setRepsValue}
              targetValue={targetValue}
            />
          )}
          
          {/* RPE Quick Selector */}
          <RPEQuickSelector
            value={selectedRPE}
            onChange={setSelectedRPE}
            targetRPE={targetRPE}
          />
          
          {/* Band Selector (only for exercises that support bands) */}
          {(recommendedBand || currentExercise.note?.toLowerCase().includes('band') || 
            currentExercise.name.toLowerCase().includes('assisted')) && (
            <BandSelector
              value={bandUsed}
              onChange={setBandUsed}
              recommendedBand={recommendedBand}
            />
          )}
        </Card>
        
        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Complete Set - Large Touch Target */}
          <Button
            onClick={handleCompleteSet}
            disabled={selectedRPE === null}
            className="w-full h-16 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-lg font-bold disabled:opacity-50"
          >
            <Check className="w-6 h-6 mr-2" />
            {state.currentSetNumber >= currentExercise.sets && state.currentExerciseIndex >= session.exercises.length - 1
              ? 'Finish Workout'
              : state.currentSetNumber >= currentExercise.sets
                ? 'Complete & Next Exercise'
                : 'Complete Set'
            }
          </Button>
          
          {/* Skip Exercise */}
          <Button
            variant="ghost"
            onClick={handleSkipExercise}
            className="w-full text-[#6B7280] hover:text-[#A4ACB8]"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Exercise
          </Button>
        </div>
        
        {/* End Workout Section - Clear Exit Point */}
        <div className="pt-6 mt-6 border-t border-[#2B313A]/50">
          <p className="text-xs text-[#6B7280] text-center mb-3">
            Done early or need to stop?
          </p>
          <Button
            variant="outline"
            onClick={handleFinish}
            className="w-full h-12 border-[#C1121F]/30 text-[#C1121F] hover:bg-[#C1121F]/10 hover:border-[#C1121F]/50"
          >
            <X className="w-4 h-4 mr-2" />
            End Workout
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}
