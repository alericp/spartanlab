'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronUp,
  Play,
  Check,
  Trash2,
  RotateCcw,
  Dumbbell,
  Clock,
  MessageSquare,
  CheckCircle2,
  Lightbulb,
  SkipForward,
  X,
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
import { WarmUpInsight, ProgressionReasoning, OverrideProtectionInsight } from '@/components/coaching/CoachingInsights'
import { getExerciseSelectionInsight, getSkillCarryoverInsight } from '@/lib/coaching/insight-generation'

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

function loadSessionFromStorage(sessionId: string, exerciseCount?: number): WorkoutSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved)
    // Only restore if same session and less than 4 hours old
    if (data.sessionId === sessionId && Date.now() - data.savedAt < 4 * 60 * 60 * 1000) {
      // Validate the saved data has required structure
      if (
        typeof data.status === 'string' &&
        typeof data.currentExerciseIndex === 'number' &&
        data.currentExerciseIndex >= 0 && // Ensure index is non-negative
        Array.isArray(data.completedSets)
      ) {
        // If we know the exercise count, validate index is within bounds
        if (exerciseCount !== undefined && data.currentExerciseIndex >= exerciseCount) {
          // Index is out of bounds for current session - discard saved state
          try { localStorage.removeItem(STORAGE_KEY) } catch {}
          return null
        }
        
        // Ensure currentSetNumber is valid
        return {
          ...data,
          currentSetNumber: typeof data.currentSetNumber === 'number' && data.currentSetNumber > 0 
            ? data.currentSetNumber 
            : 1,
        }
      }
    }
    return null
  } catch {
    // If parsing fails, clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
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
  const quickValues = RPE_QUICK_OPTIONS
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">RPE</span>
        {targetRPE && (
          <span className="text-xs text-[#6B7280]">Target: {targetRPE}</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {quickValues.map((rpe) => (
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
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isSelected 
                  ? band === 'none'
                    ? 'bg-[#2B313A] text-[#E6E9EF] ring-1 ring-[#C1121F]'
                    : `${colors?.bg} ${colors?.text} ring-1 ring-current`
                  : band === 'none'
                    ? 'bg-[#0F1115] text-[#6B7280] border border-[#2B313A]'
                    : `${colors?.bg} ${colors?.text} opacity-50`
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

interface StreamlinedWorkoutSessionProps {
  session: AdaptiveSession
  reasoningSummary?: WorkoutReasoningSummary
  onComplete: () => void
  onCancel: () => void
  isDemo?: boolean
  isFirstSession?: boolean
}

export function StreamlinedWorkoutSession({
  session,
  reasoningSummary,
  onComplete,
  onCancel,
  isDemo = false,
  isFirstSession = false
}: StreamlinedWorkoutSessionProps) {
  // CRITICAL: Early validation - if session is completely invalid, render fallback immediately
  // This prevents any downstream code from crashing on a null/undefined session
  if (!session || typeof session !== 'object') {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-[#C1121F]" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Session Not Available</h2>
          <p className="text-[#A4ACB8] mb-6">Unable to load workout session data.</p>
          <Button onClick={onCancel} className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }
  
  // Create safe session with guaranteed defaults (extra safety layer)
  const safeSession = useMemo(() => ({
    ...session,
    dayLabel: session?.dayLabel || 'Workout',
    dayNumber: session?.dayNumber ?? 1,
    focus: session?.focus || 'general',
    focusLabel: session?.focusLabel || 'Training',
    exercises: session?.exercises ?? [],
  }), [session])
  
  // Generate unique sessionId - demo sessions use different prefix to prevent storage collisions
  const isDemoSession = safeSession.dayLabel?.startsWith('DEMO-') || safeSession.dayNumber === 0
  
  // Use useMemo to ensure stable sessionId across renders
  // Demo sessions don't persist/restore from storage, so they use a fixed demo key
  const sessionId = useMemo(() => {
    if (isDemoSession) {
      return 'demo-session-isolated' // Fixed ID, but demo won't auto-save/restore
    }
    return `session-${safeSession.dayLabel}-${safeSession.dayNumber}`
  }, [isDemoSession, safeSession.dayLabel, safeSession.dayNumber])
  
  // Check for existing session on mount
  const [existingSession, setExistingSession] = useState<SavedSessionInfo | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  
  // Try to restore from storage - demo sessions never restore
  const [state, setState] = useState<WorkoutSessionState>(() => {
    // Don't try to restore demo sessions
    if (isDemoSession) {
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
    }
    
    // Get exercise count for validation
    const exerciseCount = safeSession.exercises?.length ?? 0
    
    // Try to restore real sessions (with exercise count validation)
    const saved = loadSessionFromStorage(sessionId, exerciseCount)
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
  
  // Check for resume prompt on mount - skip for demo sessions
  useEffect(() => {
    // Demo sessions never show resume prompts
    if (isDemoSession) return
    
    const existing = getExistingSessionInfo()
    if (existing && existing.sessionId === sessionId && state.completedSets.length > 0 && state.status === 'ready') {
      // We have a saved session that matches - show resume prompt
      setExistingSession(existing)
      setShowResumePrompt(true)
    }
  }, [isDemoSession])
  
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
  
  // Exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Safety guard: ensure exercises array exists and is valid
  const exercises = safeSession.exercises
  const hasValidExercises = exercises.length > 0
  
  // Validate currentExerciseIndex is within bounds
  const safeExerciseIndex = Math.max(0, Math.min(state.currentExerciseIndex, exercises.length - 1))
  const isIndexOutOfBounds = hasValidExercises && state.currentExerciseIndex !== safeExerciseIndex
  
  // Current exercise (with safety guard for both array existence AND index bounds)
  const currentExercise = hasValidExercises ? exercises[safeExerciseIndex] ?? null : null
  const totalExercises = exercises.length
  const totalSets = exercises.reduce((sum, ex) => sum + (ex?.sets || 0), 0)
  const completedSetsCount = state.completedSets.length
  
  // Create a guaranteed-safe exercise object for rendering (avoids null checks everywhere)
  // [prescription-render] TASK 4: Include prescribedLoad for live workout display
  const safeCurrentExercise = useMemo(() => ({
    name: currentExercise?.name ?? 'Exercise',
    category: currentExercise?.category ?? 'general',
    sets: currentExercise?.sets ?? 3,
    repsOrTime: currentExercise?.repsOrTime ?? '8-12 reps',
    note: currentExercise?.note ?? '',
    id: currentExercise?.id ?? 'unknown',
    isOverrideable: currentExercise?.isOverrideable ?? true,
    selectionReason: currentExercise?.selectionReason ?? '',
    // [prescription-render] ISSUE C: Preserve prescribedLoad for live workout display
    prescribedLoad: currentExercise?.prescribedLoad,
  }), [currentExercise])
  
  // Repair index if out of bounds (happens on next render cycle)
  useEffect(() => {
    if (isIndexOutOfBounds && hasValidExercises) {
      setState(prev => ({
        ...prev,
        currentExerciseIndex: safeExerciseIndex,
        currentSetNumber: 1,
      }))
    }
  }, [isIndexOutOfBounds, safeExerciseIndex, hasValidExercises])
  
  // Determine if exercise uses holds or reps (with safety)
  const isHoldExercise = currentExercise?.repsOrTime?.toLowerCase().includes('sec') || 
                         currentExercise?.repsOrTime?.toLowerCase().includes('hold')
  
  // Parse target value (with full safety)
  const getTargetValue = useCallback((): number => {
    const repsOrTime = currentExercise?.repsOrTime
    if (!repsOrTime) return 5
    const match = repsOrTime.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 5
  }, [currentExercise])
  
  // Recommended band from exercise (if any)
  const getRecommendedBand = useCallback((): ResistanceBandColor | undefined => {
    const note = currentExercise?.note
    if (!note) return undefined
    const noteLower = note.toLowerCase()
    for (const band of ALL_BAND_COLORS) {
      if (noteLower.includes(band)) return band
    }
    return undefined
  }, [currentExercise])
  
  // Auto-save on state changes - skip for demo sessions
  useEffect(() => {
    // Demo sessions don't persist to storage
    if (isDemoSession) return
    
    if (state.status !== 'ready') {
      saveSessionToStorage(state, sessionId)
    }
  }, [state, sessionId, isDemoSession])
  
  // Initialize values when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setRepsValue(getTargetValue())
      setHoldValue(getTargetValue())
      setSelectedRPE(null)
      const recBand = getRecommendedBand()
      setBandUsed(recBand || 'none')
    }
  }, [state.currentExerciseIndex, currentExercise, getTargetValue, getRecommendedBand])
  
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
    const totalExerciseSets = currentExercise?.sets ?? 1
    const isLastSet = state.currentSetNumber >= totalExerciseSets
    const isLastExercise = state.currentExerciseIndex >= exercises.length - 1
    
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
      // [workout-progress] Increment set number but add safety bounds
      const nextSetNumber = state.currentSetNumber + 1
      const maxSets = totalExerciseSets
      
      // CRITICAL: Guard against incrementing past total sets
      if (nextSetNumber > maxSets) {
        console.log('[workout-progress] blocked invalid set increment in handleCompleteSet:', {
          currentSet: state.currentSetNumber,
          nextSet: nextSetNumber,
          maxSets,
          exerciseName: currentExercise?.name,
        })
        // This shouldn't happen, but if it does, transition to next exercise instead
        if (state.currentExerciseIndex < exercises.length - 1) {
          setState(prev => ({
            ...prev,
            status: 'active',
            completedSets: newCompletedSets,
            currentExerciseIndex: prev.currentExerciseIndex + 1,
            currentSetNumber: 1,
            lastSetRPE: lastRPE,
          }))
        } else {
          setState(prev => ({
            ...prev,
            status: 'completed',
            completedSets: newCompletedSets,
            lastSetRPE: lastRPE,
          }))
        }
        return
      }
      
      setState(prev => ({
        ...prev,
        status: 'resting',
        completedSets: newCompletedSets,
        currentSetNumber: nextSetNumber,
        lastSetRPE: lastRPE,
      }))
    }
    
    // Reset inputs for next set
    setSelectedRPE(null)
    setRepsValue(getTargetValue())
    setHoldValue(getTargetValue())
  }, [currentExercise, state, repsValue, holdValue, selectedRPE, bandUsed, isHoldExercise, exercises.length])
  
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
    const isLastExercise = state.currentExerciseIndex >= exercises.length - 1
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
  }, [state.currentExerciseIndex, exercises.length])
  
  // ==========================================================================
  // EXERCISE OVERRIDE HANDLERS
  // ==========================================================================
  
  // Handle exercise replacement
  const handleReplaceExercise = useCallback((newExercise: { id: string; name: string }) => {
    // Use clamped safe index to prevent out-of-bounds access
    const exerciseIndex = Math.max(0, Math.min(state.currentExerciseIndex, exercises.length - 1))
    if (exercises.length === 0) return
    const originalExercise = exercises[exerciseIndex]
    
    // Safety: validate exercise exists at index
    if (!originalExercise) return
    
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
  }, [sessionId, state.currentExerciseIndex, exercises])
  
  // Handle exercise skip via menu (different from skip button)
  const handleMenuSkipExercise = useCallback(() => {
    // Use clamped safe index to prevent out-of-bounds access
    const exerciseIndex = Math.max(0, Math.min(state.currentExerciseIndex, exercises.length - 1))
    if (exercises.length === 0) {
      handleSkipExercise()
      return
    }
    const originalExercise = exercises[exerciseIndex]
    
    // Safety: validate exercise exists at index
    if (!originalExercise) {
      handleSkipExercise() // Still advance even if exercise invalid
      return
    }
    
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
  }, [sessionId, state.currentExerciseIndex, exercises, handleSkipExercise])
  
  // Handle progression adjustment
  const handleProgressionChange = useCallback((newProgression: { id: string; name: string }) => {
    // Use clamped safe index to prevent out-of-bounds access
    const exerciseIndex = Math.max(0, Math.min(state.currentExerciseIndex, exercises.length - 1))
    if (exercises.length === 0) return
    const originalExercise = exercises[exerciseIndex]
    
    // Safety: validate exercise exists at index
    if (!originalExercise) return
    
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
  }, [sessionId, state.currentExerciseIndex, exercises])
  
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
    // Safety: validate index is within bounds
    if (index < 0 || index >= exercises.length) return null
    
    const baseExercise = exercises[index]
    if (!baseExercise) return null
    
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
  }, [exercises, state.exerciseOverrides])
  
  // Get current effective exercise (with fallback to safe exercise)
  const effectiveExercise = getEffectiveExercise(state.currentExerciseIndex) || safeCurrentExercise
  
  // Finish workout (moves to completed state for logging)
  const handleFinish = useCallback(() => {
    setState(prev => ({ ...prev, status: 'completed' }))
    clearSessionStorage()
    clearRestTimerState()
  }, [])
  
  // Request exit confirmation (only if there's progress)
  const handleRequestExit = useCallback(() => {
    if (state.status === 'ready' || state.completedSets.length === 0) {
      // No progress yet - just clean up and exit
      clearSessionStorage()
      clearRestTimerState()
      clearSessionOverrides()
      onCancel()
    } else {
      // Has progress - show confirmation
      setShowExitConfirm(true)
    }
  }, [state.status, state.completedSets.length, onCancel])
  
  // Discard and exit (clears all state, no logging)
  const handleDiscardAndExit = useCallback(() => {
    clearSessionStorage()
    clearRestTimerState()
    clearSessionOverrides()
    setShowExitConfirm(false)
    onCancel()
  }, [onCancel])
  
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
      exercises.forEach((exercise, exerciseIndex) => {
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
      const sessionType: SessionType = safeSession.dayLabel.toLowerCase().includes('skill') 
        ? 'skill' 
        : safeSession.dayLabel.toLowerCase().includes('strength')
          ? 'strength'
          : 'mixed'
      
      const focusArea: FocusArea = exercises.some(e => e.name.toLowerCase().includes('planche'))
        ? 'planche'
        : exercises.some(e => e.name.toLowerCase().includes('front lever'))
          ? 'front_lever'
          : exercises.some(e => e.name.toLowerCase().includes('muscle'))
            ? 'muscle_up'
            : exercises.some(e => e.name.toLowerCase().includes('hspu') || e.name.toLowerCase().includes('handstand push'))
              ? 'handstand_pushup'
              : exercises.some(e => e.name.toLowerCase().includes('weighted'))
                ? 'weighted_strength'
                : 'general'
      
      // Build exercise-level outcomes for progression engine
      const exerciseOutcomes = exercises.map((exercise, exerciseIndex) => {
        const exerciseSets = state.completedSets.filter(s => s.exerciseIndex === exerciseIndex)
        const completedSetCount = exerciseSets.length
        const isCompleted = completedSetCount >= (exercise.sets || 1)
        const bestReps = exerciseSets.length > 0 ? Math.max(...exerciseSets.map(s => s.actualReps)) : 0
        const bestHold = exerciseSets.length > 0 ? Math.max(...exerciseSets.map(s => s.holdSeconds || 0)) : 0
        const bandUsed = exerciseSets.find(s => s.bandUsed && s.bandUsed !== 'none')?.bandUsed
        
        return {
          id: exercise.id || `ex-${exerciseIndex}`,
          name: exercise.name,
          category: exercise.category as 'skill' | 'push' | 'pull' | 'core' | 'legs' | 'mobility',
          sets: exercise.sets || 1,
          reps: bestReps > 0 ? bestReps : undefined,
          holdSeconds: bestHold > 0 ? bestHold : undefined,
          completed: isCompleted,
          band: bandUsed ? { bandColor: bandUsed, assisted: true } : undefined,
        }
      })
      
      // Determine completion status
      const totalExercises = exercises.length
      const completedExercises = exerciseOutcomes.filter(e => e.completed).length
      const completionStatus: 'completed' | 'partial' | 'skipped' = 
        completedExercises >= totalExercises * 0.8 ? 'completed' :
        completedExercises > 0 ? 'partial' : 'skipped'
      
  // Quick log the workout with full feedback loop data
    // Ensure minimum 1 minute duration to prevent 0-minute sessions
    const durationMinutes = Math.max(1, Math.round(state.elapsedSeconds / 60))
    quickLogWorkout({
      sessionName: safeSession.dayLabel,
      sessionType,
      focusArea,
      durationMinutes,
        perceivedDifficulty: finalDifficulty,
        generatedWorkoutId: sessionId,
        keyPerformance,
        notes: state.workoutNotes || undefined,
        // FEEDBACK LOOP: Exercise-level outcomes for progression engine
        exercises: exerciseOutcomes,
        // FEEDBACK LOOP: Mark demo sessions to exclude from adaptive logic
        isDemo: isDemoSession || isDemo,
        completionStatus,
        sourceRoute: isFirstSession ? 'first_session' : 'workout_session',
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
  // RENDER: SAFETY FALLBACK - No Valid Exercises
  // ==========================================================================
  
  if (!hasValidExercises) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-[#C1121F]" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Session Not Available</h2>
          <p className="text-[#A4ACB8] mb-6">
            This workout session doesn&apos;t have any exercises loaded. Please try again or create a new program.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={onCancel}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
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
      <div className="min-h-screen bg-[#0F1115] p-4 sm:p-5">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Compact Header */}
          <div className="text-center pt-6 pb-2">
            <div className="w-14 h-14 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/30 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-7 h-7 text-[#C1121F]" />
            </div>
            <h1 className="text-xl font-bold text-[#E6E9EF] mb-1">
              {safeSession.dayLabel.replace('DEMO-', '')}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-[#A4ACB8]">
              <span>{exercises.length} exercises</span>
              <span className="text-[#6B7280]">·</span>
              <span>{totalSets} sets</span>
              {session.estimatedMinutes && (
                <>
                  <span className="text-[#6B7280]">·</span>
                  <span className="text-[#6B7280]">~{session.estimatedMinutes}min</span>
                </>
              )}
            </div>
          </div>
          
          {/* Session Overview Card - Compact */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">Today&apos;s Plan</p>
              {reasoningSummary ? (
                <WorkoutFocusBadge 
                  focus={reasoningSummary.workoutFocus} 
                  sessionType={reasoningSummary.sessionType}
                  size="sm"
                />
              ) : (
                <Badge variant="outline" className="text-[10px] border-[#2B313A] text-[#A4ACB8] px-2 py-0.5">
                  {safeSession.focusLabel}
                </Badge>
              )}
            </div>
            <div className="space-y-0">
              {exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#2B313A]/30 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#2B313A] text-[#6B7280] text-[10px] flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#E6E9EF]">{ex.name}</span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] tabular-nums">
                    {ex.sets}×{ex.repsOrTime}
                    {/* [weighted-prescription-truth] Show prescribed load in ready view */}
                    {ex.prescribedLoad && ex.prescribedLoad.load > 0 && (
                      <span className="ml-1 text-[#C1121F] font-medium">
                        @ +{ex.prescribedLoad.load}{ex.prescribedLoad.unit}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Why This Workout - Only for adaptive/pro users */}
          {reasoningSummary && !isDemo && (
            <WhyThisWorkout
              reasoning={reasoningSummary}
              defaultCollapsed={true}
              variant="card"
            />
          )}
          
          {/* Start Button - Primary CTA */}
          <Button
            onClick={handleStart}
            className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-base font-bold shadow-lg shadow-[#C1121F]/20"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
          
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full text-[#6B7280] text-sm h-10"
          >
            Back
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
      state.completedSets
        .filter(s => s.exerciseIndex >= 0 && s.exerciseIndex < exercises.length) // Filter invalid indexes
        .map(s => {
          // Get target for this specific exercise (with safety)
          const exercise = exercises[s.exerciseIndex]
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
      safeSession.dayLabel,
      readiness || undefined
    )
    const performance = getSessionPerformance(performanceInput)
    
    // Generate skill signal if skill exercises were performed
    const skillExercises = exercises.filter(ex => 
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
              sessionName={safeSession.dayLabel}
              onReturnToDashboard={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              onViewProgram={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              bandProgressNote={bandProgressNote}
              skillSignal={skillSignal}
              overrideSummary={getOverrideSummary(sessionId)}
              goalContext={safeSession.focusLabel ? `This ${safeSession.focusLabel.toLowerCase()} session builds toward your primary goal. Consistent training accelerates progress.` : "Workout completed. Consistent training builds skill faster."}
              nextSession={(() => {
                const program = getLatestAdaptiveProgram()
                if (!program?.sessions) return null
                const currentIdx = program.sessions.findIndex(s => s.dayNumber === safeSession.dayNumber)
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
              {safeSession.dayLabel} • {stats.completedSets}/{stats.totalSets} sets
            </p>
          </div>
          
          {/* Quick Stats Feedback */}
<Card className="bg-[#1A1F26] border-[#2B313A] p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-[#E6E9EF]">{Math.max(1, Math.round(state.elapsedSeconds / 60))}</p>
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
    
    // Determine next set info (safely handle null currentExercise)
    // [workout-progress] Clamp setNumber to valid range
    const nextSetInfo = currentExercise ? {
      exerciseName: currentExercise?.name ?? 'Exercise',
      setNumber: Math.min(state.currentSetNumber, currentExercise.sets),
      isNewExercise: false, // We skip rest between exercises now
    } : undefined
    
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col">
        {/* Sticky Session Header - Compact (same as active) */}
        <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
          <div className="px-4 py-2.5">
            <div className="max-w-lg mx-auto">
              {/* Top row: Session + Timer */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-medium text-[#E6E9EF] truncate max-w-[160px]">
                    {safeSession.dayLabel.replace('DEMO-', '')}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {state.currentExerciseIndex + 1}/{totalExercises}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280]">{completedSetsCount}/{totalSets}</span>
                  <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">
                    {formatDuration(state.elapsedSeconds)}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1 bg-[#2B313A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C1121F] transition-all duration-300"
                  style={{ width: `${(completedSetsCount / totalSets) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 px-4 py-3 sm:p-5">
        <div className="max-w-lg mx-auto space-y-3">
          
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
                    {/* [workout-progress] Safe set display - never show set > total */}
                    Set {Math.min(state.currentSetNumber, currentExercise.sets)}/{currentExercise.sets}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {currentExercise.repsOrTime}
                    {/* [weighted-prescription-truth] Show load in resting state */}
                    {currentExercise.prescribedLoad && currentExercise.prescribedLoad.load > 0 && (
                      <span className="text-[#C1121F] font-medium ml-1">
                        @ +{currentExercise.prescribedLoad.load}{currentExercise.prescribedLoad.unit}
                      </span>
                    )}
                  </p>
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
      {/* Sticky Session Header - Compact */}
      <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
        <div className="px-4 py-2.5">
          <div className="max-w-lg mx-auto">
            {/* Top row: Session + Timer */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-[#E6E9EF] truncate max-w-[160px]">
                  {safeSession.dayLabel.replace('DEMO-', '')}
                </span>
                <span className="text-xs text-[#6B7280]">
                  {state.currentExerciseIndex + 1}/{totalExercises}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B7280]">{completedSetsCount}/{totalSets}</span>
                <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">
                  {formatDuration(state.elapsedSeconds)}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1 bg-[#2B313A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C1121F] transition-all duration-300"
                style={{ width: `${(completedSetsCount / totalSets) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Tighter spacing */}
      <div className="flex-1 px-4 py-3 sm:p-5">
      <div className="max-w-lg mx-auto space-y-3">
        
        {/* Current Exercise - Compact Card */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
                {currentExercise.category}
              </Badge>
              {state.exerciseOverrides[state.currentExerciseIndex]?.isReplaced && (
                <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[10px] px-1.5 py-0">Swapped</Badge>
              )}
            </div>
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
          
          {/* Exercise Name */}
          <h2 className="text-lg font-bold text-[#E6E9EF] leading-tight">
            {effectiveExercise.name}
          </h2>
          
          {/* Prescription row */}
          <div className="flex items-center gap-2 mt-1.5 text-sm flex-wrap">
            <span className="text-[#A4ACB8]">Target:</span>
            <span className="text-[#E6E9EF] font-medium">{currentExercise.repsOrTime}</span>
            {/* [prescription-truth] ISSUE C: Display prescription mode truthfully */}
            {currentExercise.prescribedLoad && currentExercise.prescribedLoad.load > 0 ? (
              // Weighted exercise with load
              <span className="text-[#C1121F] font-semibold">
                @ +{currentExercise.prescribedLoad.load} {currentExercise.prescribedLoad.unit}
              </span>
            ) : (
              // Check if this is a weighted exercise type without load
              (() => {
                const isWeightedType = currentExercise.id?.includes('weighted_') || 
                                       currentExercise.name?.toLowerCase().includes('weighted')
                const isSkillHold = currentExercise.category === 'skill' || 
                                    currentExercise.repsOrTime?.toLowerCase().includes('sec')
                
                if (isWeightedType) {
                  // Weighted exercise type but no load prescribed
                  return <span className="text-[#6B7280] text-xs">(Bodyweight)</span>
                } else if (isSkillHold) {
                  // Skill hold - show nothing extra
                  return null
                } else {
                  // Regular bodyweight - show nothing
                  return null
                }
              })()
            )}
            <span className="text-[#6B7280]">·</span>
            <span className="text-[#A4ACB8]">RPE {targetRPE}</span>
          </div>
          {/* [prescription-truth] ISSUE C: Show confidence for non-high confidence loads */}
          {currentExercise.prescribedLoad && currentExercise.prescribedLoad.load > 0 && 
           currentExercise.prescribedLoad.confidenceLevel !== 'high' && (
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {currentExercise.prescribedLoad.confidenceLevel === 'moderate' && 'Load based on historical PR'}
              {currentExercise.prescribedLoad.confidenceLevel === 'low' && 'Estimated load - adjust as needed'}
              {currentExercise.prescribedLoad.confidenceLevel === 'none' && 'Starting load - adjust based on feel'}
            </p>
          )}
          
          {/* Set Progress - Inline */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 flex-1">
              {/* [workout-progress] Safe set index - clamp to valid range */}
              {Array.from({ length: currentExercise.sets }).map((_, idx) => {
                const safeCurrentSet = Math.min(state.currentSetNumber, currentExercise.sets)
                return (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      idx < safeCurrentSet - 1 
                        ? 'bg-green-500' 
                        : idx === safeCurrentSet - 1 
                          ? 'bg-[#C1121F]' 
                          : 'bg-[#2B313A]'
                    }`}
                  />
                )
              })}
            </div>
            <span className="text-sm font-medium text-[#E6E9EF] whitespace-nowrap">
              {/* [workout-progress] Safe set display - never show set > total */}
              Set {Math.min(state.currentSetNumber, currentExercise.sets)}/{currentExercise.sets}
            </span>
          </div>
        </Card>
        
        {/* Coaching Insight - Collapsed by default, only for pro users */}
        {!isDemo && (() => {
          const insight = getExerciseSelectionInsight(currentExercise.id || currentExercise.name)
          if (!insight) return null
          
          return (
            <div className="text-[11px] text-[#6B7280] rounded-md bg-[#1A1A1A]/50 border border-[#2B313A]/30 px-2.5 py-2 flex items-start gap-2">
              <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-[#4F6D8A]" />
              <p className="text-[#A4ACB8] leading-relaxed line-clamp-2">{insight}</p>
            </div>
          )
        })()}
        
        {/* Log This Set - Input Section */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 space-y-4">
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
        
        {/* Complete Set Button - Primary CTA */}
        <Button
          onClick={handleCompleteSet}
          disabled={selectedRPE === null}
          className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-base font-bold disabled:opacity-50"
        >
          <Check className="w-5 h-5 mr-2" />
          {state.currentSetNumber >= currentExercise.sets && state.currentExerciseIndex >= exercises.length - 1
            ? 'Finish Workout'
            : state.currentSetNumber >= currentExercise.sets
              ? 'Next Exercise'
              : 'Log Set'
          }
        </Button>
        
        {/* Secondary Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={handleSkipExercise}
            className="text-[#6B7280] hover:text-[#A4ACB8] text-sm h-9 px-3"
          >
            <SkipForward className="w-3.5 h-3.5 mr-1.5" />
            Skip
          </Button>
          <Button
            variant="ghost"
            onClick={handleRequestExit}
            className="text-[#6B7280] hover:text-[#A4ACB8] text-sm h-9 px-3"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            End Early
          </Button>
        </div>
      </div>
      </div>
      
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1A1F26] border-t sm:border border-[#2B313A] sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
            <div className="text-center mb-2">
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-1">Leave Workout?</h3>
              <p className="text-sm text-[#A4ACB8]">
                You have {state.completedSets.length} {state.completedSets.length === 1 ? 'set' : 'sets'} logged.
              </p>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => setShowExitConfirm(false)}
                className="w-full h-12 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-medium"
              >
                Resume Workout
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowExitConfirm(false)
                  handleFinish()
                }}
                className="w-full h-12 border-[#2B313A] text-[#E6E9EF] hover:bg-[#2B313A]"
              >
                <Check className="w-4 h-4 mr-2" />
                Save & Finish Early
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleDiscardAndExit}
                className="w-full h-10 text-[#6B7280] hover:text-[#A4ACB8]"
              >
                Discard & Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
