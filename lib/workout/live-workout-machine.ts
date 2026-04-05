/**
 * [LIVE-WORKOUT-MACHINE] Explicit Runtime State Machine for Live Workout Execution
 * 
 * This module provides a coherent, explicit state machine for the live workout corridor.
 * All phase transitions are explicit, validated, and contained within this machine.
 * 
 * PHASES:
 * - ready: Workout loaded, not started
 * - active: Current exercise is active, user can input and complete sets
 * - resting: Between sets of same exercise
 * - between_exercise_rest: Completed exercise, resting before next
 * - transitioning: Short internal handoff to next exercise
 * - completed: Workout finished
 * - invalid: Controlled fallback state for runtime failures
 */

import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'
import { ALL_BAND_COLORS } from '@/lib/band-progression-engine'

// =============================================================================
// TYPES
// =============================================================================

export type WorkoutPhase = 
  | 'ready'
  | 'active'
  | 'resting'
  | 'between_exercise_rest'
  | 'transitioning'
  | 'completed'
  | 'invalid'

export interface CompletedSet {
  exerciseIndex: number
  setNumber: number
  actualReps: number
  holdSeconds?: number
  actualRPE: RPEValue
  bandUsed: ResistanceBandColor | 'none'
  timestamp: number
}

export interface ExerciseOverride {
  originalName: string
  currentName: string
  isSkipped: boolean
  isReplaced: boolean
  isProgressionAdjusted: boolean
}

/** The authoritative state shape for the live workout machine */
export interface WorkoutMachineState {
  // Phase
  phase: WorkoutPhase
  
  // Session identity
  sessionId: string
  
  // Position
  currentExerciseIndex: number
  currentSetNumber: number
  
  // Completed work
  completedSets: CompletedSet[]
  exerciseOverrides: Record<number, ExerciseOverride>
  
  // Timing
  startTime: number | null
  elapsedSeconds: number
  
  // User inputs for current set
  selectedRPE: RPEValue | null
  repsValue: number
  holdValue: number
  bandUsed: ResistanceBandColor | 'none'
  
  // Session notes
  workoutNotes: string
  lastSetRPE: RPEValue | null
  
  // Rest state
  interExerciseRestSeconds: number
  
  // Invalid state info
  invalidReason: string | null
  invalidStage: string | null
}

/** Normalized exercise shape for the machine */
export interface MachineExercise {
  id: string
  name: string
  category: string
  sets: number
  repsOrTime: string
  note: string
  isOverrideable: boolean
  prescribedLoad?: {
    load?: number
    unit?: string
    confidenceLevel?: string
  }
  targetRPE?: number
  executionTruth?: unknown
}

/** Session contract for the machine */
export interface MachineSessionContract {
  dayLabel: string
  dayNumber: number
  exercises: MachineExercise[]
  estimatedMinutes: number
}

// =============================================================================
// ACTIONS
// =============================================================================

export type WorkoutMachineAction =
  | { type: 'START_WORKOUT'; startTime: number }
  | { type: 'RESUME_WORKOUT'; startTime: number; savedState: Partial<WorkoutMachineState> }
  | { type: 'START_FRESH'; startTime: number }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_RPE'; rpe: RPEValue }
  | { type: 'SET_REPS'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_BAND'; band: ResistanceBandColor | 'none' }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'COMPLETE_SET'; completedSet: CompletedSet; isLastSetOfExercise: boolean; exerciseCount: number }
  | { type: 'COMPLETE_REST' } // Between-set rest -> next active set (same exercise)
  | { type: 'START_BETWEEN_EXERCISE_REST'; seconds: number }
  | { type: 'SKIP_BETWEEN_EXERCISE_REST' }
  | { type: 'ADVANCE_TO_NEXT_EXERCISE'; nextIndex: number; targetValue: number }
  | { type: 'COMPLETE_WORKOUT'; finalCompletedSets: CompletedSet[] }
  | { type: 'ADD_OVERRIDE'; index: number; override: ExerciseOverride }
  | { type: 'SKIP_EXERCISE'; index: number; exerciseCount: number }
  | { type: 'ENTER_INVALID'; reason: string; stage: string }
  | { type: 'RETRY' }
  | { type: 'RESET_TO_READY' }

// =============================================================================
// INITIAL STATE
// =============================================================================

export function createInitialMachineState(sessionId: string): WorkoutMachineState {
  return {
    phase: 'ready',
    sessionId,
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    completedSets: [],
    exerciseOverrides: {},
    startTime: null,
    elapsedSeconds: 0,
    selectedRPE: null,
    repsValue: 8,
    holdValue: 30,
    bandUsed: 'none',
    workoutNotes: '',
    lastSetRPE: null,
    interExerciseRestSeconds: 0,
    invalidReason: null,
    invalidStage: null,
  }
}

// =============================================================================
// PURE REDUCER
// =============================================================================

export function workoutMachineReducer(
  state: WorkoutMachineState,
  action: WorkoutMachineAction
): WorkoutMachineState {
  if (process.env.NODE_ENV === 'development') {
    console.log('[v0] [machine_action]', action.type, { phase: state.phase })
  }
  
  switch (action.type) {
    // =========================================================================
    // LIFECYCLE TRANSITIONS
    // =========================================================================
    
    case 'START_WORKOUT':
      if (state.phase !== 'ready') return state
      return {
        ...state,
        phase: 'active',
        startTime: action.startTime,
      }
    
    case 'RESUME_WORKOUT': {
      if (state.phase !== 'ready') return state
      const saved = action.savedState
      return {
        ...state,
        phase: 'active',
        startTime: action.startTime,
        currentExerciseIndex: saved.currentExerciseIndex ?? state.currentExerciseIndex,
        currentSetNumber: saved.currentSetNumber ?? state.currentSetNumber,
        completedSets: saved.completedSets ?? state.completedSets,
        exerciseOverrides: saved.exerciseOverrides ?? state.exerciseOverrides,
        elapsedSeconds: saved.elapsedSeconds ?? state.elapsedSeconds,
        workoutNotes: saved.workoutNotes ?? state.workoutNotes,
        lastSetRPE: saved.lastSetRPE ?? state.lastSetRPE,
      }
    }
    
    case 'START_FRESH':
      return {
        ...createInitialMachineState(state.sessionId),
        phase: 'active',
        startTime: action.startTime,
      }
    
    case 'TICK_TIMER': {
      if (!state.startTime || (state.phase !== 'active' && state.phase !== 'resting' && state.phase !== 'between_exercise_rest')) {
        return state
      }
      
      const newElapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000)
      
      // Between-exercise rest: decrement the rest timer (but never below 0)
      if (state.phase === 'between_exercise_rest' && state.interExerciseRestSeconds > 0) {
        const newRestSeconds = Math.max(0, state.interExerciseRestSeconds - 1)
        if (newRestSeconds !== state.interExerciseRestSeconds) {
          console.log('[v0] [TICK] between_exercise_rest countdown:', state.interExerciseRestSeconds, '->', newRestSeconds)
        }
        if (newRestSeconds === 0) {
          console.log('[v0] [TICK] between_exercise_rest reached zero - waiting for user to start next exercise')
        }
        return {
          ...state,
          elapsedSeconds: newElapsedSeconds,
          interExerciseRestSeconds: newRestSeconds,
        }
      }
      
      return {
        ...state,
        elapsedSeconds: newElapsedSeconds,
      }
    }
    
    // =========================================================================
    // INPUT UPDATES
    // =========================================================================
    
    case 'SET_RPE':
      return { ...state, selectedRPE: action.rpe }
    
    case 'SET_REPS':
      return { ...state, repsValue: action.value }
    
    case 'SET_HOLD':
      return { ...state, holdValue: action.value }
    
    case 'SET_BAND':
      return { ...state, bandUsed: action.band }
    
    case 'SET_NOTES':
      return { ...state, workoutNotes: action.notes }
    
    // =========================================================================
    // SET COMPLETION
    // =========================================================================
    
    case 'COMPLETE_SET': {
      const newCompletedSets = [...state.completedSets, action.completedSet]
      
      if (action.isLastSetOfExercise) {
        // Last set of exercise - will transition to between_exercise_rest or completed
        const isLastExercise = state.currentExerciseIndex >= action.exerciseCount - 1
        if (isLastExercise) {
          return {
            ...state,
            phase: 'completed',
            completedSets: newCompletedSets,
            lastSetRPE: action.completedSet.actualRPE,
          }
        }
        // Will need to trigger between_exercise_rest via separate action
        return {
          ...state,
          phase: 'between_exercise_rest',
          completedSets: newCompletedSets,
          lastSetRPE: action.completedSet.actualRPE,
          selectedRPE: null,
          interExerciseRestSeconds: 120,
        }
      }
      
      // Not last set - rest then next set
      return {
        ...state,
        phase: 'resting',
        completedSets: newCompletedSets,
        currentSetNumber: state.currentSetNumber + 1,
        lastSetRPE: action.completedSet.actualRPE,
        selectedRPE: null,
      }
    }
    
    // COMPLETE_REST: Between-set rest -> next active set (same exercise)
    // Called when rest timer completes or user skips rest
    case 'COMPLETE_REST': {
      if (state.phase !== 'resting') {
        console.warn('[machine] COMPLETE_REST called but phase is not resting:', state.phase)
        return state
      }
      return {
        ...state,
        phase: 'active',
      }
    }
    
    case 'START_BETWEEN_EXERCISE_REST':
      return {
        ...state,
        phase: 'between_exercise_rest',
        interExerciseRestSeconds: action.seconds,
      }
    
    case 'SKIP_BETWEEN_EXERCISE_REST':
      // Will need to trigger advance via separate action
      return {
        ...state,
        phase: 'transitioning',
        interExerciseRestSeconds: 0,
      }
    
    case 'ADVANCE_TO_NEXT_EXERCISE':
      return {
        ...state,
        phase: 'active',
        currentExerciseIndex: action.nextIndex,
        currentSetNumber: 1,
        selectedRPE: null,
        repsValue: action.targetValue,
        holdValue: action.targetValue,
        bandUsed: 'none',
        interExerciseRestSeconds: 0,
      }
    
    case 'COMPLETE_WORKOUT':
      return {
        ...state,
        phase: 'completed',
        completedSets: action.finalCompletedSets,
      }
    
    // =========================================================================
    // OVERRIDES
    // =========================================================================
    
    case 'ADD_OVERRIDE':
      return {
        ...state,
        exerciseOverrides: {
          ...state.exerciseOverrides,
          [action.index]: action.override,
        },
      }
    
    case 'SKIP_EXERCISE': {
      const nextIndex = action.index + 1
      const isLastExercise = nextIndex >= action.exerciseCount
      
      return {
        ...state,
        phase: isLastExercise ? 'completed' : 'active',
        currentExerciseIndex: isLastExercise ? action.index : nextIndex,
        currentSetNumber: 1,
        exerciseOverrides: {
          ...state.exerciseOverrides,
          [action.index]: {
            originalName: '',
            currentName: '',
            isSkipped: true,
            isReplaced: false,
            isProgressionAdjusted: false,
          },
        },
      }
    }
    
    // =========================================================================
    // ERROR HANDLING
    // =========================================================================
    
    case 'ENTER_INVALID':
      return {
        ...state,
        phase: 'invalid',
        invalidReason: action.reason,
        invalidStage: action.stage,
      }
    
    case 'RETRY':
      if (state.phase !== 'invalid') return state
      return {
        ...state,
        phase: 'ready',
        invalidReason: null,
        invalidStage: null,
      }
    
    case 'RESET_TO_READY':
      return {
        ...state,
        phase: 'ready',
      }
    
    default:
      return state
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export interface ValidationResult {
  isValid: boolean
  reason: string | null
  stage: string | null
}

/**
 * Validates that the machine can safely enter active state
 */
export function validateActiveEntry(
  state: WorkoutMachineState,
  session: MachineSessionContract | null
): ValidationResult {
  try {
    if (!session) {
      return { isValid: false, reason: 'No session contract', stage: 'session_check' }
    }
    
    if (!Array.isArray(session.exercises) || session.exercises.length === 0) {
      return { isValid: false, reason: 'No exercises in session', stage: 'exercise_check' }
    }
    
    if (state.currentExerciseIndex < 0 || state.currentExerciseIndex >= session.exercises.length) {
      return { isValid: false, reason: 'Exercise index out of bounds', stage: 'index_check' }
    }
    
    const exercise = session.exercises[state.currentExerciseIndex]
    if (!exercise || typeof exercise.name !== 'string') {
      return { isValid: false, reason: 'Invalid exercise at current index', stage: 'exercise_shape_check' }
    }
    
    return { isValid: true, reason: null, stage: null }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown'
    return { isValid: false, reason: `Validation error: ${msg}`, stage: 'validation_exception' }
  }
}

// =============================================================================
// VIEW MODEL DERIVATION
// =============================================================================

export interface ReadyViewModel {
  phase: 'ready'
  sessionId: string
  dayLabel: string
  dayNumber: number
  exerciseCount: number
  totalSets: number
  estimatedMinutes: number
  hasSavedProgress: boolean
  savedProgressSets: number
}

export interface ActiveViewModel {
  phase: 'active' | 'resting'
  sessionId: string
  
  // Current exercise
  currentExerciseIndex: number
  currentExerciseName: string
  currentExerciseCategory: string
  currentExerciseSets: number
  currentExerciseRepsOrTime: string
  currentExerciseNote: string
  
  // Current set
  currentSetNumber: number
  isLastSetOfExercise: boolean
  
  // Progress
  totalExercises: number
  completedSetsCount: number
  totalSets: number
  
  // Derived values
  targetValue: number
  recommendedBand: ResistanceBandColor | undefined
  isHoldExercise: boolean
  
  // User inputs
  selectedRPE: RPEValue | null
  repsValue: number
  holdValue: number
  bandUsed: ResistanceBandColor | 'none'
  
  // Timing
  elapsedSeconds: number
  
  // Next exercise
  hasNextExercise: boolean
  nextExerciseName: string | null
}

export interface BetweenExerciseRestViewModel {
  phase: 'between_exercise_rest'
  restSeconds: number
  completedExerciseName: string
  nextExerciseName: string
  nextExerciseCategory: string
  completedSetsCount: number
}

export interface CompletedViewModel {
  phase: 'completed'
  completedSets: CompletedSet[]
  totalExercises: number
  elapsedSeconds: number
  workoutNotes: string
}

export interface InvalidViewModel {
  phase: 'invalid'
  reason: string
  stage: string
}

export type WorkoutViewModel =
  | ReadyViewModel
  | ActiveViewModel
  | BetweenExerciseRestViewModel
  | CompletedViewModel
  | InvalidViewModel

/**
 * Derives the appropriate view model for the current phase.
 * This is a PURE function that never throws - it fails closed into invalid state.
 */
export function deriveViewModel(
  state: WorkoutMachineState,
  session: MachineSessionContract | null,
  savedProgress?: { completedSets: number } | null
): WorkoutViewModel {
  try {
    // Invalid phase
    if (state.phase === 'invalid') {
      return {
        phase: 'invalid',
        reason: state.invalidReason || 'Unknown error',
        stage: state.invalidStage || 'unknown',
      }
    }
    
    // No session - invalid
    if (!session || !Array.isArray(session.exercises)) {
      return {
        phase: 'invalid',
        reason: 'No valid session',
        stage: 'session_check',
      }
    }
    
    const exercises = session.exercises
    const totalSets = exercises.reduce((sum, ex) => sum + (ex?.sets ?? 3), 0)
    
    // Ready phase
    if (state.phase === 'ready') {
      return {
        phase: 'ready',
        sessionId: state.sessionId,
        dayLabel: session.dayLabel || 'Workout',
        dayNumber: session.dayNumber || 1,
        exerciseCount: exercises.length,
        totalSets,
        estimatedMinutes: session.estimatedMinutes || 30,
        hasSavedProgress: (savedProgress?.completedSets ?? 0) > 0,
        savedProgressSets: savedProgress?.completedSets ?? 0,
      }
    
    }
    
    // Completed phase
    if (state.phase === 'completed') {
      return {
        phase: 'completed',
        completedSets: state.completedSets,
        totalExercises: exercises.length,
        elapsedSeconds: state.elapsedSeconds,
        workoutNotes: state.workoutNotes,
      }
    }
    
    // Get current exercise safely
    const safeIndex = Math.max(0, Math.min(state.currentExerciseIndex, exercises.length - 1))
    const currentExercise = exercises[safeIndex]
    
    if (!currentExercise) {
      return {
        phase: 'invalid',
        reason: 'No exercise at current index',
        stage: 'exercise_lookup',
      }
    }
    
    // Between exercise rest phase
    if (state.phase === 'between_exercise_rest' || state.phase === 'transitioning') {
      const nextIndex = safeIndex + 1
      const nextExercise = nextIndex < exercises.length ? exercises[nextIndex] : null
      
      return {
        phase: 'between_exercise_rest',
        restSeconds: state.interExerciseRestSeconds,
        completedExerciseName: currentExercise.name,
        nextExerciseName: nextExercise?.name ?? 'Next Exercise',
        nextExerciseCategory: nextExercise?.category ?? 'general',
        completedSetsCount: state.completedSets.length,
      }
    }
    
    // Active / Resting phase - derive full active view model
    const repsOrTime = currentExercise.repsOrTime || '8-12 reps'
    const isHoldExercise = repsOrTime.toLowerCase().includes('sec') || repsOrTime.toLowerCase().includes('hold')
    
    // Parse target value
    let targetValue = 8
    const match = repsOrTime.match(/(\d+)/)
    if (match) {
      targetValue = parseInt(match[1], 10)
    }
    
    // Parse recommended band from note
    let recommendedBand: ResistanceBandColor | undefined
    const note = currentExercise.note || ''
    if (note) {
      const noteLower = note.toLowerCase()
      for (const band of ALL_BAND_COLORS) {
        if (noteLower.includes(band)) {
          recommendedBand = band
          break
        }
      }
    }
    
    const nextIndex = safeIndex + 1
    const hasNextExercise = nextIndex < exercises.length
    const nextExercise = hasNextExercise ? exercises[nextIndex] : null
    
    return {
      phase: state.phase === 'resting' ? 'resting' : 'active',
      sessionId: state.sessionId,
      currentExerciseIndex: safeIndex,
      currentExerciseName: currentExercise.name,
      currentExerciseCategory: currentExercise.category || 'general',
      currentExerciseSets: currentExercise.sets || 3,
      currentExerciseRepsOrTime: repsOrTime,
      currentExerciseNote: note,
      currentSetNumber: state.currentSetNumber,
      isLastSetOfExercise: state.currentSetNumber >= (currentExercise.sets || 3),
      totalExercises: exercises.length,
      completedSetsCount: state.completedSets.length,
      totalSets,
      targetValue,
      recommendedBand,
      isHoldExercise,
      selectedRPE: state.selectedRPE,
      repsValue: state.repsValue,
      holdValue: state.holdValue,
      bandUsed: state.bandUsed,
      elapsedSeconds: state.elapsedSeconds,
      hasNextExercise,
      nextExerciseName: nextExercise?.name ?? null,
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown'
    if (process.env.NODE_ENV === 'development') {
      console.error('[v0] [derive_view_model_error]', msg)
    }
    return {
      phase: 'invalid',
      reason: `View model derivation failed: ${msg}`,
      stage: 'view_model_derivation',
    }
  }
}

// =============================================================================
// SERIALIZATION FOR PERSISTENCE
// =============================================================================

export function serializeForStorage(state: WorkoutMachineState): string {
  return JSON.stringify({
    phase: state.phase,
    sessionId: state.sessionId,
    currentExerciseIndex: state.currentExerciseIndex,
    currentSetNumber: state.currentSetNumber,
    completedSets: state.completedSets,
    exerciseOverrides: state.exerciseOverrides,
    elapsedSeconds: state.elapsedSeconds,
    workoutNotes: state.workoutNotes,
    lastSetRPE: state.lastSetRPE,
  })
}

export function deserializeFromStorage(
  json: string,
  sessionId: string
): Partial<WorkoutMachineState> | null {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) return null
    
    return {
      currentExerciseIndex: typeof parsed.currentExerciseIndex === 'number' ? parsed.currentExerciseIndex : 0,
      currentSetNumber: typeof parsed.currentSetNumber === 'number' ? parsed.currentSetNumber : 1,
      completedSets: Array.isArray(parsed.completedSets) ? parsed.completedSets : [],
      exerciseOverrides: typeof parsed.exerciseOverrides === 'object' ? parsed.exerciseOverrides : {},
      elapsedSeconds: typeof parsed.elapsedSeconds === 'number' ? parsed.elapsedSeconds : 0,
      workoutNotes: typeof parsed.workoutNotes === 'string' ? parsed.workoutNotes : '',
      lastSetRPE: parsed.lastSetRPE ?? null,
    }
  } catch {
    return null
  }
}
