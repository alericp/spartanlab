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
// [LIVE-WORKOUT-AUTHORITY] Import execution mode and authority types
import type { 
  WorkoutExecutionMode, 
  MultiBandSelection,
  SkipDecision,
  StructuredCoachingInput,
  CoachingSignalTag,
} from '@/lib/workout/live-workout-authority-contract'
import { EXECUTION_MODE_TARGET_MINUTES } from '@/lib/workout/live-workout-authority-contract'
// [LIVE-WORKOUT-ADAPTIVE] Import adaptive signal system
import { 
  createInitialSessionReadiness,
  updateSessionReadiness,
  buildAdaptiveExecutionSummary,
  type SessionAdaptiveReadiness,
  type AdaptiveExecutionSummary,
  type TargetPrescription,
} from '@/lib/workout/live-workout-adaptive-signals'

// =============================================================================
// TYPES
// =============================================================================

export type WorkoutPhase = 
  | 'ready'
  | 'active'
  | 'resting'
  | 'between_exercise_rest'
  | 'block_round_rest'  // Rest between rounds of a grouped block (superset/circuit)
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
  // Per-set notes and tags
  note?: string
  reasonTags?: string[]
  // Grouped execution context
  blockId?: string
  memberIndex?: number
  round?: number
  // [LIVE-WORKOUT-AUTHORITY] Extended execution facts
  inputMode?: import('./live-workout-authority-contract').ExerciseInputMode
  // Multi-band support (canonical)
  selectedBands?: ResistanceBandColor[]
  multiBandSelection?: import('./live-workout-authority-contract').MultiBandSelection | null
  // Weighted exercise facts
  prescribedLoad?: number
  prescribedLoadUnit?: string
  actualLoadUsed?: number
  actualLoadUnit?: string
  // Unilateral exercise facts
  isPerSide?: boolean
  // Structured coaching inputs
  structuredCoachingInputs?: import('./live-workout-authority-contract').CoachingSignalTag[]
  // [LIVE-WORKOUT-ADAPTIVE] Canonical adaptive execution summary
  adaptiveSummary?: import('./live-workout-adaptive-signals').AdaptiveExecutionSummary
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
  
  // [LIVE-WORKOUT-AUTHORITY] Execution mode - locked at workout start
  executionMode: WorkoutExecutionMode
  targetDurationMinutes: number | null
  
  // Position (flat index - always maintained for compatibility)
  currentExerciseIndex: number
  currentSetNumber: number
  
  // Grouped execution position (used when in superset/circuit/cluster)
  currentBlockIndex: number
  currentMemberIndex: number
  currentRound: number
  
  // Completed work
  completedSets: CompletedSet[]
  exerciseOverrides: Record<number, ExerciseOverride>
  
  // [LIVE-WORKOUT-AUTHORITY] Skip tracking
  skipDecisions: SkipDecision[]
  
  // Timing
  startTime: number | null
  elapsedSeconds: number
  
  // User inputs for current set
  selectedRPE: RPEValue | null
  repsValue: number
  holdValue: number
  bandUsed: ResistanceBandColor | 'none'
  // [LIVE-WORKOUT-AUTHORITY] Multi-band support
  selectedBands: ResistanceBandColor[]
  multiBandSelection: MultiBandSelection | null
  // [LIVE-WORKOUT-AUTHORITY] Weighted exercise support
  actualLoadUsed: number | null
  actualLoadUnit: string
  // [LIVE-WORKOUT-AUTHORITY] Per-side tracking for unilateral
  isPerSide: boolean
  
  // Per-set notes and reason tags
  currentSetNote: string
  currentSetReasonTags: string[]
  
  // [LIVE-WORKOUT-AUTHORITY] Structured coaching signals
  coachingInputs: StructuredCoachingInput[]
  
  // Session notes
  workoutNotes: string
  lastSetRPE: RPEValue | null
  
  // [LIVE-WORKOUT-AUTHORITY] Performance tracking for recommendations
  consecutiveHighRPECount: number
  
  // [LIVE-WORKOUT-ADAPTIVE] Session-level adaptive readiness state
  sessionAdaptiveReadiness: import('./live-workout-adaptive-signals').SessionAdaptiveReadiness
  
  // Rest state
  interExerciseRestSeconds: number
  blockRoundRestSeconds: number
  
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
  restSeconds?: number
  executionTruth?: unknown
  // Grouped method fields
  method?: string
  methodLabel?: string
  blockId?: string
}

/** Execution block for grouped exercises (superset/circuit/cluster/density_block) */
export interface ExecutionBlock {
  blockId: string
  groupType: 'superset' | 'circuit' | 'cluster' | 'density_block' | null
  blockLabel: string
  memberExercises: MachineExercise[]
  memberExerciseIndexes: number[]
  targetRounds: number
  intraBlockRestSeconds: number
  postRoundRestSeconds: number
  postBlockRestSeconds: number
}

/** Execution plan derived from exercises */
export interface ExecutionPlan {
  blocks: ExecutionBlock[]
  hasGroupedBlocks: boolean
  totalSets: number
}

/** Session contract for the machine */
export interface MachineSessionContract {
  dayLabel: string
  dayNumber: number
  exercises: MachineExercise[]
  estimatedMinutes: number
  // Derived execution plan (computed once at session load)
  executionPlan?: ExecutionPlan
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
  | { type: 'SET_CURRENT_SET_NOTE'; note: string }
  | { type: 'SET_CURRENT_SET_REASON_TAGS'; tags: string[] }
  | { type: 'TOGGLE_REASON_TAG'; tag: string }
  | { 
      type: 'COMPLETE_SET'
      completedSet: CompletedSet
      isLastSetOfExercise: boolean
      exerciseCount: number
      // [LIVE-WORKOUT-ADAPTIVE] Target prescription for adaptive summary
      targetReps?: number
      targetHoldSeconds?: number
      targetRPE?: number
      recommendedBand?: ResistanceBandColor
    }
  | { type: 'COMPLETE_REST' } // Between-set rest -> next active set (same exercise)
  | { type: 'COMPLETE_BLOCK_ROUND_REST' } // Block round rest -> next round
  | { type: 'START_BETWEEN_EXERCISE_REST'; seconds: number }
  | { type: 'SKIP_BETWEEN_EXERCISE_REST' }
  | { type: 'ADVANCE_TO_NEXT_EXERCISE'; nextIndex: number; targetValue: number }
  | { type: 'COMPLETE_WORKOUT'; finalCompletedSets: CompletedSet[] }
  | { type: 'ADD_OVERRIDE'; index: number; override: ExerciseOverride }
  | { type: 'SKIP_EXERCISE'; index: number; exerciseCount: number }
  | { type: 'ENTER_INVALID'; reason: string; stage: string }
  | { type: 'RETRY' }
  | { type: 'RESET_TO_READY' }
  // Edit/back navigation
  | { type: 'EDIT_PREVIOUS_SET'; setIndex: number; updatedSet: CompletedSet }
  | { type: 'ADJUST_REST'; adjustment: number }
  | { type: 'GO_BACK'; exercises: MachineExercise[] } // Navigate backward through sets/exercises
  // Grouped execution actions
  | { type: 'COMPLETE_BLOCK_SET'; completedSet: CompletedSet; block: ExecutionBlock; memberIndex: number; round: number }
  | { type: 'ADVANCE_TO_NEXT_BLOCK_MEMBER'; nextMemberIndex: number; nextExerciseIndex: number; targetValue: number }
  | { type: 'COMPLETE_BLOCK_ROUND'; restSeconds: number }
  | { type: 'ADVANCE_TO_NEXT_BLOCK'; nextBlockIndex: number; nextExerciseIndex: number; targetValue: number }
  // [LIVE-WORKOUT-AUTHORITY] New authority actions
  | { type: 'SET_MULTI_BAND'; selection: MultiBandSelection | null }
  | { type: 'SET_SELECTED_BANDS'; bands: ResistanceBandColor[] }
  | { type: 'ADD_COACHING_SIGNAL'; signals: CoachingSignalTag[]; freeText?: string }
  | { type: 'SKIP_SET'; totalSets: number; exerciseCount: number; reason?: string }
  | { type: 'END_EXERCISE'; totalSets: number; exerciseCount: number; reason?: string }
  | { type: 'SET_ACTUAL_LOAD'; load: number; unit?: string }
  | { type: 'SET_IS_PER_SIDE'; isPerSide: boolean }

// =============================================================================
// INITIAL STATE
// =============================================================================

export function createInitialMachineState(
  sessionId: string,
  executionMode: WorkoutExecutionMode = 'full'
): WorkoutMachineState {
  // Log authority state creation
  console.log('[LIVE-WORKOUT-AUTHORITY] Machine state created', {
    sessionId,
    executionMode,
    targetDurationMinutes: EXECUTION_MODE_TARGET_MINUTES[executionMode],
  })
  
  return {
    phase: 'ready',
    sessionId,
    // [LIVE-WORKOUT-AUTHORITY] Execution mode locked at creation
    executionMode,
    targetDurationMinutes: EXECUTION_MODE_TARGET_MINUTES[executionMode],
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    // Grouped execution position
    currentBlockIndex: 0,
    currentMemberIndex: 0,
    currentRound: 1,
    // Completed work
    completedSets: [],
    exerciseOverrides: {},
    // [LIVE-WORKOUT-AUTHORITY] Skip tracking
    skipDecisions: [],
    startTime: null,
    elapsedSeconds: 0,
    selectedRPE: null,
    repsValue: 8,
    holdValue: 30,
    bandUsed: 'none',
    // [LIVE-WORKOUT-AUTHORITY] Multi-band support
    selectedBands: [],
    multiBandSelection: null,
    // [LIVE-WORKOUT-AUTHORITY] Weighted exercise support
    actualLoadUsed: null,
    actualLoadUnit: 'lbs',
    // [LIVE-WORKOUT-AUTHORITY] Per-side tracking
    isPerSide: false,
    // Per-set notes
    currentSetNote: '',
    currentSetReasonTags: [],
    // [LIVE-WORKOUT-AUTHORITY] Structured coaching inputs
    coachingInputs: [],
    // Session notes
    workoutNotes: '',
    lastSetRPE: null,
    // [LIVE-WORKOUT-AUTHORITY] Performance tracking
    consecutiveHighRPECount: 0,
    // [LIVE-WORKOUT-ADAPTIVE] Session-level adaptive readiness
    sessionAdaptiveReadiness: createInitialSessionReadiness(),
    interExerciseRestSeconds: 0,
    blockRoundRestSeconds: 0,
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
      // Valid phases for timer tick
      const timerPhases: WorkoutPhase[] = ['active', 'resting', 'between_exercise_rest', 'block_round_rest']
      if (!state.startTime || !timerPhases.includes(state.phase)) {
        return state
      }
      
      const newElapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000)
      
      // Between-exercise rest: decrement the rest timer (but never below 0)
      if (state.phase === 'between_exercise_rest' && state.interExerciseRestSeconds > 0) {
        const newRestSeconds = Math.max(0, state.interExerciseRestSeconds - 1)
        if (newRestSeconds !== state.interExerciseRestSeconds) {
          console.log('[v0] [TICK] between_exercise_rest countdown:', state.interExerciseRestSeconds, '->', newRestSeconds)
        }
        return {
          ...state,
          elapsedSeconds: newElapsedSeconds,
          interExerciseRestSeconds: newRestSeconds,
        }
      }
      
      // Block round rest: decrement the block round rest timer
      if (state.phase === 'block_round_rest' && state.blockRoundRestSeconds > 0) {
        const newRestSeconds = Math.max(0, state.blockRoundRestSeconds - 1)
        console.log('[v0] [TICK] block_round_rest countdown:', state.blockRoundRestSeconds, '->', newRestSeconds)
        return {
          ...state,
          elapsedSeconds: newElapsedSeconds,
          blockRoundRestSeconds: newRestSeconds,
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
    
    // [LIVE-WORKOUT-AUTHORITY] Multi-band support
    case 'SET_MULTI_BAND':
      return { 
        ...state, 
        multiBandSelection: action.selection,
        // Also set single band for backward compatibility
        bandUsed: action.selection?.bands[0] || 'none',
      }
    
    // [LIVE-WORKOUT-AUTHORITY] Set selected bands array directly (for MultiBandSelector)
    case 'SET_SELECTED_BANDS':
      return {
        ...state,
        selectedBands: action.bands,
        // Also update legacy single band field and normalized selection
        bandUsed: action.bands[0] || 'none',
        multiBandSelection: action.bands.length > 0 ? {
          bands: action.bands,
          primaryBand: action.bands[0],
          assistanceSummary: action.bands.length === 1 
            ? `${action.bands[0]} band` 
            : `${action.bands.join(' + ')} bands combined`,
        } : null,
      }
    
    // [LIVE-WORKOUT-AUTHORITY] Add coaching signal
    case 'ADD_COACHING_SIGNAL': {
      const newInput: StructuredCoachingInput = {
        signals: action.signals,
        freeTextNote: action.freeText || null,
        timestamp: Date.now(),
        exerciseIndex: state.currentExerciseIndex,
        setNumber: state.currentSetNumber,
      }
      return {
        ...state,
        coachingInputs: [...state.coachingInputs, newInput],
        currentSetReasonTags: [...state.currentSetReasonTags, ...action.signals],
      }
    }
    
    // [LIVE-WORKOUT-AUTHORITY] Set actual load used for weighted exercises
    case 'SET_ACTUAL_LOAD':
      return {
        ...state,
        actualLoadUsed: action.load,
        actualLoadUnit: action.unit || state.actualLoadUnit,
      }
    
    // [LIVE-WORKOUT-AUTHORITY] Set per-side tracking for unilateral exercises
    case 'SET_IS_PER_SIDE':
      return {
        ...state,
        isPerSide: action.isPerSide,
      }
    
    case 'SET_NOTES':
      return { ...state, workoutNotes: action.notes }
    
    case 'SET_CURRENT_SET_NOTE':
      return { ...state, currentSetNote: action.note }
    
    case 'SET_CURRENT_SET_REASON_TAGS':
      return { ...state, currentSetReasonTags: action.tags }
    
    case 'TOGGLE_REASON_TAG': {
      const tags = state.currentSetReasonTags
      const newTags = tags.includes(action.tag)
        ? tags.filter(t => t !== action.tag)
        : [...tags, action.tag]
      return { ...state, currentSetReasonTags: newTags }
    }
    
    // =========================================================================
    // SET COMPLETION
    // =========================================================================
    
    case 'COMPLETE_SET': {
      // [LIVE-WORKOUT-AUTHORITY] Track consecutive high RPE for recommendations
      const rpeValue = action.completedSet.actualRPE as number
      const isHighRPE = rpeValue >= 9
      const newConsecutiveHighRPE = isHighRPE 
        ? state.consecutiveHighRPECount + 1 
        : 0 // Reset on normal RPE
      
      // [LIVE-WORKOUT-ADAPTIVE] Build canonical adaptive execution summary
      const targetPrescription: TargetPrescription = {
        targetReps: action.targetReps,
        targetHoldSeconds: action.targetHoldSeconds,
        targetRPE: action.targetRPE || 8,
        prescribedLoad: action.completedSet.prescribedLoad,
        prescribedLoadUnit: action.completedSet.prescribedLoadUnit,
        recommendedBand: action.recommendedBand,
      }
      
      const priorContext = {
        completedSets: state.completedSets,
        exerciseIndex: action.completedSet.exerciseIndex,
      }
      
      const adaptiveSummary = buildAdaptiveExecutionSummary(
        action.completedSet,
        targetPrescription,
        priorContext
      )
      
      // Attach summary to the completed set
      const enrichedCompletedSet: CompletedSet = {
        ...action.completedSet,
        adaptiveSummary,
      }
      
      const newCompletedSets = [...state.completedSets, enrichedCompletedSet]
      
      // Update session-level adaptive readiness
      const newSessionReadiness = updateSessionReadiness(
        state.sessionAdaptiveReadiness,
        adaptiveSummary
      )
      
      console.log('[LIVE-WORKOUT-ADAPTIVE] Set completed with summary', {
        exerciseIndex: state.currentExerciseIndex,
        setNumber: state.currentSetNumber,
        rpe: rpeValue,
        performanceOutcome: adaptiveSummary.performanceOutcome,
        intensityDirection: adaptiveSummary.intensityDirection,
        recoverySignal: adaptiveSummary.recoverySignal,
        sessionFatigue: newSessionReadiness.sessionFatigueLevel,
      })
      
      if (action.isLastSetOfExercise) {
        // Last set of exercise - will transition to between_exercise_rest or completed
        const isLastExercise = state.currentExerciseIndex >= action.exerciseCount - 1
        if (isLastExercise) {
          return {
            ...state,
            phase: 'completed',
            completedSets: newCompletedSets,
            lastSetRPE: action.completedSet.actualRPE,
            consecutiveHighRPECount: 0, // Reset at workout end
            sessionAdaptiveReadiness: newSessionReadiness,
            selectedRPE: null,
            repsValue: 0,
            holdValue: 0,
            // Clear per-set notes
            currentSetNote: '',
            currentSetReasonTags: [],
          }
        }
        // Will need to trigger between_exercise_rest via separate action
        return {
          ...state,
          phase: 'between_exercise_rest',
          completedSets: newCompletedSets,
          lastSetRPE: action.completedSet.actualRPE,
          consecutiveHighRPECount: 0, // Reset between exercises
          sessionAdaptiveReadiness: newSessionReadiness,
          selectedRPE: null,
          // Reset input values so component can re-seed from next exercise prescription
          repsValue: 0,
          holdValue: 0,
          interExerciseRestSeconds: 120,
          // Clear per-set notes for next exercise
          currentSetNote: '',
          currentSetReasonTags: [],
        }
      }
      
      // Not last set - rest then next set
      // Not last set - transition to resting for same-exercise continuation
      return {
        ...state,
        phase: 'resting' as const,
        completedSets: newCompletedSets,
        currentSetNumber: state.currentSetNumber + 1,
        lastSetRPE: action.completedSet.actualRPE,
        consecutiveHighRPECount: newConsecutiveHighRPE,
        sessionAdaptiveReadiness: newSessionReadiness,
        selectedRPE: null,
        // Reset input values so component can re-seed from prescription for next set
        repsValue: 0,
        holdValue: 0,
        // Clear per-set notes for next set
        currentSetNote: '',
        currentSetReasonTags: [],
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
    
    // [LIVE-WORKOUT-AUTHORITY] Skip current set only - advance to next set of same exercise
    case 'SKIP_SET': {
      const skipDecision: SkipDecision = {
        action: 'skip_set',
        reason: action.reason,
        completedSets: state.currentSetNumber - 1,
        skippedSets: 1,
        remainingSets: action.totalSets - state.currentSetNumber,
        timestamp: Date.now(),
      }
      
      console.log('[LIVE-WORKOUT-AUTHORITY] SKIP_SET', {
        exerciseIndex: state.currentExerciseIndex,
        setNumber: state.currentSetNumber,
        totalSets: action.totalSets,
        reason: action.reason,
      })
      
      // Check if this was the last set
      if (state.currentSetNumber >= action.totalSets) {
        // Skipping last set = end exercise
        const isLastExercise = state.currentExerciseIndex >= action.exerciseCount - 1
        return {
          ...state,
          phase: isLastExercise ? 'completed' : 'between_exercise_rest',
          skipDecisions: [...state.skipDecisions, skipDecision],
          currentSetNumber: state.currentSetNumber,
          interExerciseRestSeconds: isLastExercise ? 0 : 120,
          currentSetNote: '',
          currentSetReasonTags: [],
        }
      }
      
      // Move to next set of same exercise
      return {
        ...state,
        skipDecisions: [...state.skipDecisions, skipDecision],
        currentSetNumber: state.currentSetNumber + 1,
        selectedRPE: null,
        currentSetNote: '',
        currentSetReasonTags: [],
      }
    }
    
    // [LIVE-WORKOUT-AUTHORITY] End current exercise - skip all remaining sets
    case 'END_EXERCISE': {
      const remainingSets = action.totalSets - state.currentSetNumber + 1
      const skipDecision: SkipDecision = {
        action: 'end_exercise',
        reason: action.reason,
        completedSets: state.currentSetNumber - 1,
        skippedSets: remainingSets,
        remainingSets: 0,
        timestamp: Date.now(),
      }
      
      console.log('[LIVE-WORKOUT-AUTHORITY] END_EXERCISE', {
        exerciseIndex: state.currentExerciseIndex,
        setNumber: state.currentSetNumber,
        totalSets: action.totalSets,
        skippedSets: remainingSets,
        reason: action.reason,
      })
      
      const isLastExercise = state.currentExerciseIndex >= action.exerciseCount - 1
      
      return {
        ...state,
        phase: isLastExercise ? 'completed' : 'between_exercise_rest',
        skipDecisions: [...state.skipDecisions, skipDecision],
        interExerciseRestSeconds: isLastExercise ? 0 : 120,
        currentSetNote: '',
        currentSetReasonTags: [],
      }
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
    
    // =========================================================================
    // GROUPED EXECUTION (Supersets / Circuits)
    // =========================================================================
    
    case 'COMPLETE_BLOCK_SET': {
      const { completedSet, block, memberIndex, round } = action
      const newCompletedSets = [...state.completedSets, completedSet]
      const isLastMember = memberIndex >= block.memberExercises.length - 1
      const isLastRound = round >= block.targetRounds
      
      if (isLastMember && isLastRound) {
        // Block complete
        return {
          ...state,
          phase: 'between_exercise_rest',
          completedSets: newCompletedSets,
          lastSetRPE: completedSet.actualRPE,
          selectedRPE: null,
          interExerciseRestSeconds: block.postBlockRestSeconds,
          currentSetNote: '',
          currentSetReasonTags: [],
        }
      }
      
      if (isLastMember) {
        // Round complete but more rounds to go
        return {
          ...state,
          phase: 'block_round_rest',
          completedSets: newCompletedSets,
          currentMemberIndex: 0,
          currentRound: round + 1,
          lastSetRPE: completedSet.actualRPE,
          selectedRPE: null,
          blockRoundRestSeconds: block.postRoundRestSeconds,
          currentSetNote: '',
          currentSetReasonTags: [],
        }
      }
      
      // More members in this round
      return {
        ...state,
        phase: block.intraBlockRestSeconds > 0 ? 'resting' : 'active',
        completedSets: newCompletedSets,
        currentMemberIndex: memberIndex + 1,
        currentExerciseIndex: block.memberExerciseIndexes[memberIndex + 1] ?? state.currentExerciseIndex,
        lastSetRPE: completedSet.actualRPE,
        selectedRPE: null,
        interExerciseRestSeconds: block.intraBlockRestSeconds,
        currentSetNote: '',
        currentSetReasonTags: [],
      }
    }
    
    case 'ADVANCE_TO_NEXT_BLOCK_MEMBER':
      return {
        ...state,
        phase: 'active',
        currentMemberIndex: action.nextMemberIndex,
        currentExerciseIndex: action.nextExerciseIndex,
        repsValue: action.targetValue,
        holdValue: action.targetValue,
        bandUsed: 'none',
        interExerciseRestSeconds: 0,
        blockRoundRestSeconds: 0,
      }
    
    case 'COMPLETE_BLOCK_ROUND':
      return {
        ...state,
        phase: 'block_round_rest',
        blockRoundRestSeconds: action.restSeconds,
        currentMemberIndex: 0,
      }
    
    case 'ADVANCE_TO_NEXT_BLOCK':
      return {
        ...state,
        phase: 'active',
        currentBlockIndex: action.nextBlockIndex,
        currentExerciseIndex: action.nextExerciseIndex,
        currentMemberIndex: 0,
        currentRound: 1,
        repsValue: action.targetValue,
        holdValue: action.targetValue,
        bandUsed: 'none',
        interExerciseRestSeconds: 0,
        blockRoundRestSeconds: 0,
      }
    
    // =========================================================================
    // BLOCK ROUND REST COMPLETION
    // =========================================================================
    
    case 'COMPLETE_BLOCK_ROUND_REST': {
      if (state.phase !== 'block_round_rest') {
        console.warn('[machine] COMPLETE_BLOCK_ROUND_REST called but phase is not block_round_rest:', state.phase)
        return state
      }
      return {
        ...state,
        phase: 'active',
        currentMemberIndex: 0,
        blockRoundRestSeconds: 0,
      }
    }
    
    // =========================================================================
    // EDIT/BACK NAVIGATION
    // =========================================================================
    
    case 'EDIT_PREVIOUS_SET': {
      // Update a previously completed set without changing position
      const updatedSets = [...state.completedSets]
      if (action.setIndex >= 0 && action.setIndex < updatedSets.length) {
        updatedSets[action.setIndex] = action.updatedSet
      }
      return {
        ...state,
        completedSets: updatedSets,
      }
    }
    
    case 'ADJUST_REST': {
      // Adjust current rest timer by ±N seconds
      if (state.phase === 'between_exercise_rest') {
        return {
          ...state,
          interExerciseRestSeconds: Math.max(0, state.interExerciseRestSeconds + action.adjustment),
        }
      }
      if (state.phase === 'block_round_rest') {
        return {
          ...state,
          blockRoundRestSeconds: Math.max(0, state.blockRoundRestSeconds + action.adjustment),
        }
      }
      return state
    }
    
    case 'GO_BACK': {
      // [BACK-NAVIGATION] Navigate backward through workout sets/exercises
      // Only allowed from active or resting phases
      if (state.phase !== 'active' && state.phase !== 'resting') {
        return state
      }
      
      const exercises = action.exercises
      const currentExercise = exercises[state.currentExerciseIndex]
      
      // RULE A: If on Set N > 1, go back to Set N-1 of same exercise
      if (state.currentSetNumber > 1) {
        // Remove the last completed set for this exercise if it exists
        const lastSetForExercise = state.completedSets.findLastIndex(
          s => s.exerciseIndex === state.currentExerciseIndex && s.setNumber === state.currentSetNumber - 1
        )
        const updatedSets = lastSetForExercise >= 0 
          ? state.completedSets.filter((_, i) => i !== lastSetForExercise)
          : state.completedSets
        
        // Restore values from the removed set for re-editing
        const removedSet = lastSetForExercise >= 0 ? state.completedSets[lastSetForExercise] : null
        
        return {
          ...state,
          phase: 'active',
          currentSetNumber: state.currentSetNumber - 1,
          completedSets: updatedSets,
          // Restore editable values from the removed set
          repsValue: removedSet?.actualReps || 8,
          holdValue: removedSet?.holdSeconds || 30,
          selectedRPE: removedSet?.actualRPE || null,
          bandUsed: removedSet?.bandUsed || 'none',
          currentSetNote: removedSet?.note || '',
          currentSetReasonTags: removedSet?.reasonTags || [],
        }
      }
      
      // RULE B: If on Set 1 and there's a previous exercise, go to last set of previous exercise
      if (state.currentExerciseIndex > 0) {
        const prevExerciseIndex = state.currentExerciseIndex - 1
        const prevExercise = exercises[prevExerciseIndex]
        const prevExerciseSets = prevExercise?.sets || 3
        
        // Find and remove the last completed set for the previous exercise
        const lastSetForPrevExercise = state.completedSets.findLastIndex(
          s => s.exerciseIndex === prevExerciseIndex && s.setNumber === prevExerciseSets
        )
        const updatedSets = lastSetForPrevExercise >= 0 
          ? state.completedSets.filter((_, i) => i !== lastSetForPrevExercise)
          : state.completedSets
        
        // Restore values from the removed set
        const removedSet = lastSetForPrevExercise >= 0 ? state.completedSets[lastSetForPrevExercise] : null
        
        return {
          ...state,
          phase: 'active',
          currentExerciseIndex: prevExerciseIndex,
          currentSetNumber: prevExerciseSets,
          completedSets: updatedSets,
          // Restore editable values
          repsValue: removedSet?.actualReps || 8,
          holdValue: removedSet?.holdSeconds || 30,
          selectedRPE: removedSet?.actualRPE || null,
          bandUsed: removedSet?.bandUsed || 'none',
          currentSetNote: removedSet?.note || '',
          currentSetReasonTags: removedSet?.reasonTags || [],
        }
      }
      
      // At first set of first exercise - can't go back further
      return state
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
    // [LIVE-WORKOUT-AUTHORITY] Execution mode
    executionMode: state.executionMode,
    targetDurationMinutes: state.targetDurationMinutes,
    currentExerciseIndex: state.currentExerciseIndex,
    currentSetNumber: state.currentSetNumber,
    // Grouped execution state
    currentBlockIndex: state.currentBlockIndex,
    currentMemberIndex: state.currentMemberIndex,
    currentRound: state.currentRound,
    // Completed work
    completedSets: state.completedSets,
    exerciseOverrides: state.exerciseOverrides,
    // [LIVE-WORKOUT-AUTHORITY] Skip tracking
    skipDecisions: state.skipDecisions,
    // [LIVE-WORKOUT-AUTHORITY] Multi-band and coaching
    selectedBands: state.selectedBands,
    multiBandSelection: state.multiBandSelection,
    coachingInputs: state.coachingInputs,
    consecutiveHighRPECount: state.consecutiveHighRPECount,
    // [LIVE-WORKOUT-ADAPTIVE] Session readiness (serialized as object, Map converted)
    sessionAdaptiveReadiness: {
      ...state.sessionAdaptiveReadiness,
      exerciseSummaries: Array.from(state.sessionAdaptiveReadiness.exerciseSummaries.entries()),
    },
    // [LIVE-WORKOUT-AUTHORITY] Weighted and unilateral tracking
    actualLoadUsed: state.actualLoadUsed,
    actualLoadUnit: state.actualLoadUnit,
    isPerSide: state.isPerSide,
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
      // [LIVE-WORKOUT-AUTHORITY] Execution mode - default to 'full' for backward compatibility
      executionMode: parsed.executionMode || 'full',
      targetDurationMinutes: typeof parsed.targetDurationMinutes === 'number' ? parsed.targetDurationMinutes : null,
      currentExerciseIndex: typeof parsed.currentExerciseIndex === 'number' ? parsed.currentExerciseIndex : 0,
      currentSetNumber: typeof parsed.currentSetNumber === 'number' ? parsed.currentSetNumber : 1,
      // Grouped execution state
      currentBlockIndex: typeof parsed.currentBlockIndex === 'number' ? parsed.currentBlockIndex : 0,
      currentMemberIndex: typeof parsed.currentMemberIndex === 'number' ? parsed.currentMemberIndex : 0,
      currentRound: typeof parsed.currentRound === 'number' ? parsed.currentRound : 1,
      // Completed work
      completedSets: Array.isArray(parsed.completedSets) ? parsed.completedSets : [],
      exerciseOverrides: typeof parsed.exerciseOverrides === 'object' ? parsed.exerciseOverrides : {},
      // [LIVE-WORKOUT-AUTHORITY] Skip tracking
      skipDecisions: Array.isArray(parsed.skipDecisions) ? parsed.skipDecisions : [],
      // [LIVE-WORKOUT-AUTHORITY] Multi-band and coaching
      selectedBands: Array.isArray(parsed.selectedBands) ? parsed.selectedBands : [],
      multiBandSelection: parsed.multiBandSelection || null,
      coachingInputs: Array.isArray(parsed.coachingInputs) ? parsed.coachingInputs : [],
      consecutiveHighRPECount: typeof parsed.consecutiveHighRPECount === 'number' ? parsed.consecutiveHighRPECount : 0,
      // [LIVE-WORKOUT-ADAPTIVE] Session readiness (with Map reconstruction)
      sessionAdaptiveReadiness: parsed.sessionAdaptiveReadiness ? {
        ...parsed.sessionAdaptiveReadiness,
        exerciseSummaries: new Map(
          Array.isArray(parsed.sessionAdaptiveReadiness.exerciseSummaries)
            ? parsed.sessionAdaptiveReadiness.exerciseSummaries
            : []
        ),
      } : createInitialSessionReadiness(),
      // [LIVE-WORKOUT-AUTHORITY] Weighted and unilateral tracking
      actualLoadUsed: typeof parsed.actualLoadUsed === 'number' ? parsed.actualLoadUsed : null,
      actualLoadUnit: typeof parsed.actualLoadUnit === 'string' ? parsed.actualLoadUnit : 'lbs',
      isPerSide: typeof parsed.isPerSide === 'boolean' ? parsed.isPerSide : false,
      elapsedSeconds: typeof parsed.elapsedSeconds === 'number' ? parsed.elapsedSeconds : 0,
      workoutNotes: typeof parsed.workoutNotes === 'string' ? parsed.workoutNotes : '',
      lastSetRPE: parsed.lastSetRPE ?? null,
    }
  } catch {
    return null
  }
}
