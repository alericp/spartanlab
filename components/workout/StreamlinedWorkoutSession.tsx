'use client'

import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react'
import dynamic from 'next/dynamic'
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
import type { AdaptiveSession, AdaptiveExercise } from '@/lib/adaptive-program-builder'
// [LIVE-WORKOUT-CORRIDOR-FIX] getLatestAdaptiveProgram loaded dynamically - post-completion only
// The adaptive-program-builder is a MASSIVE file (18,000+ lines) that can crash module evaluation
// We only need it for the "next session" preview in PostWorkoutSummary
import { 
  ResistanceBandColor, 
  ALL_BAND_COLORS, 
  BAND_SHORT_LABELS, 
  BAND_COLORS 
} from '@/lib/band-progression-engine'
// [LIVE-EXECUTION-TRUTH] Adaptive performance evaluator for post-set recommendations
import {
  evaluateSetPerformance,
  shouldShowRecommendation,
  formatAdaptiveCoachingMessage,
  type AdaptiveRecommendationResult,
  type SetPerformanceData,
} from '@/lib/adaptive-performance-evaluator'
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
// [LIVE-WORKOUT-CORRIDOR-FIX] PostWorkoutSummary loaded dynamically - completion-only
// This component is ONLY shown after workout completion, so deferring its load prevents
// module-level crashes from blocking the initial workout render
const PostWorkoutSummary = dynamic(
  () => import('@/components/workout/PostWorkoutSummary').then(mod => mod.PostWorkoutSummary),
  { 
    loading: () => (
      <div className="p-4 text-center text-[#6B7280]">Loading summary...</div>
    ),
    ssr: false // Client-only component
  }
)
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
// [LIVE-WORKOUT-CORRIDOR-FIX] Challenge/achievement engines loaded dynamically
// These are POST-COMPLETION-ONLY and have heavy cascading imports that can crash module evaluation
// Moving to dynamic import prevents route death if these modules have any initialization issues
import type { WorkoutReasoningSummary } from '@/lib/readiness/canonical-readiness-engine'
import type { WorkoutReasoningDisplayContract } from '@/lib/workout-reasoning-display-contract'
import { WhyThisWorkout, ExerciseReasonBubble, WorkoutFocusBadge } from '@/components/workout/WhyThisWorkout'
import { WarmUpInsight, ProgressionReasoning, OverrideProtectionInsight } from '@/components/coaching/CoachingInsights'
import { getExerciseSelectionInsight, getSkillCarryoverInsight } from '@/lib/coaching/insight-generation'
// [EXECUTION-TRUTH-FIX] Authoritative runtime contract
import {
  buildSessionRuntimeTruth,
  buildExerciseRuntimeTruth,
  getCalibrationMessage,
  playTimerCompletionAlert,
  createEmptySessionNotes,
  updateExerciseNote,
  generateAdaptiveCoachingNote,
  type SessionRuntimeTruth,
  type ExerciseRuntimeTruth,
  type SessionNotes,
  type ExerciseContextFlag,
  AVAILABLE_CONTEXT_FLAGS,
} from '@/lib/workout-execution-truth'
// [LIVE-WORKOUT-MACHINE] Hydration validation and types
import {
  validateHydrationPayload,
  type NormalizedExercise,
} from '@/lib/workout/validate-live-session-runtime'
// [LIVE-WORKOUT-MACHINE] Authoritative runtime state machine for workout execution
import {
  createInitialMachineState,
  workoutMachineReducer,
  validateActiveEntry,
  deriveViewModel,
  serializeForStorage,
  deserializeFromStorage,
  type WorkoutMachineState,
  type WorkoutMachineAction,
  type MachineSessionContract,
  type MachineExercise,
  type WorkoutPhase,
  type CompletedSet,
} from '@/lib/workout/live-workout-machine'

// =============================================================================
// SAFE STRING HELPER - PREVENTS toLowerCase CRASHES
// =============================================================================

/**
 * Safe lowercase string helper that never crashes.
 * Returns empty string if input is null, undefined, or not a string.
 */
function safeLower(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase()
  return ''
}

// =============================================================================
// [LIVE-SESSION-FIX] SAFE OPTIONAL SUBTREE WRAPPER
// =============================================================================
// This component catches render errors in OPTIONAL UI blocks (WhyThisWorkout,
// insight bubbles, etc.) so that the core workout functionality continues
// even if an optional enhancement fails to render.

import React from 'react'

interface SafeOptionalSubtreeProps {
  /** Label for logging which subtree failed */
  label: string
  /** Children to render */
  children: React.ReactNode
  /** Optional fallback to show on error (default: nothing) */
  fallback?: React.ReactNode
}

interface SafeOptionalSubtreeState {
  hasError: boolean
}

class SafeOptionalSubtree extends React.Component<SafeOptionalSubtreeProps, SafeOptionalSubtreeState> {
  constructor(props: SafeOptionalSubtreeProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): SafeOptionalSubtreeState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the optional subtree failure - this helps identify issues without crashing workout
    console.warn(`[WORKOUT-OPTIONAL-BLOCK] ${this.props.label} failed to render:`, {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 3).join('\n'),
    })
  }

  render() {
    if (this.state.hasError) {
      // Return fallback or nothing - don't crash the workout
      return this.props.fallback || null
    }
    return this.props.children
  }
}

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

// =============================================================================
// [UNIFIED-HANDOFF] UNIFIED LIVE SESSION STATE
// All transition-sensitive state under ONE owner to eliminate split-state bugs
// =============================================================================

interface UnifiedLiveSessionState {
  // Core workout state
  status: 'ready' | 'active' | 'resting' | 'completed'
  currentExerciseIndex: number
  currentSetNumber: number
  completedSets: CompletedSetData[]
  startTime: number | null
  elapsedSeconds: number
  lastSetRPE: RPEValue | null
  workoutNotes: string
  exerciseOverrides: Record<number, ExerciseOverrideState>
  
  // Input state (previously separate useState hooks)
  selectedRPE: RPEValue | null
  repsValue: number
  holdValue: number
  bandUsed: ResistanceBandColor | 'none'
  
  // Inter-exercise rest state
  showInterExerciseRest: boolean
  interExerciseRestSeconds: number
  
  // Controlled local error state for invalid transitions
  transitionRepairIssue: { type: 'next_exercise_invalid'; message: string } | null
}

type LiveSessionAction =
  // Workout lifecycle
  | { type: 'START_WORKOUT_ACTIVE'; startTime: number }
  | { type: 'RESUME_WORKOUT'; startTime: number }
  | { type: 'START_FRESH_WORKOUT'; startTime: number }
  | { type: 'FINISH_WORKOUT' }
  | { type: 'RESET_TO_READY' }
  | { type: 'SET_STATUS'; status: 'active' | 'resting' }
  | { type: 'TICK_TIMER' }
  // Input state
  | { type: 'SET_RPE'; rpe: RPEValue | null }
  | { type: 'SET_REPS'; value: number }
  | { type: 'SET_HOLD'; value: number }
  | { type: 'SET_BAND'; band: ResistanceBandColor | 'none' }
  | { type: 'SET_WORKOUT_NOTES'; notes: string } // Use this for notes, not SET_NOTES
  // Index repair
  | { type: 'REPAIR_INDEX'; safeIndex: number }
  // Exercise overrides
  | { type: 'ADD_EXERCISE_OVERRIDE'; index: number; override: ExerciseOverrideState }
  | { type: 'MARK_EXERCISE_SKIPPED'; index: number; override: ExerciseOverrideState }
  | { type: 'ADJUST_PROGRESSION'; index: number; override: ExerciseOverrideState }
  | { type: 'UNDO_OVERRIDE'; index: number }
  // Set completion & transitions
  | { type: 'COMPLETE_SET_SAME_EXERCISE'; newCompletedSets: CompletedSetData[]; nextSetNumber: number; targetValue: number }
  | { type: 'ADVANCE_TO_NEXT_EXERCISE'; snapshot: UnifiedTransitionSnapshot }
  | { type: 'SHOW_INTER_EXERCISE_REST'; seconds: number; newCompletedSets: CompletedSetData[]; lastRPE: RPEValue }
  | { type: 'COMPLETE_INTER_EXERCISE_REST'; snapshot: UnifiedTransitionSnapshot }
  | { type: 'SKIP_INTER_EXERCISE_REST'; snapshot: UnifiedTransitionSnapshot }
  | { type: 'SKIP_EXERCISE'; snapshot: UnifiedTransitionSnapshot }
  | { type: 'COMPLETE_WORKOUT'; newCompletedSets: CompletedSetData[]; lastRPE: RPEValue }
  // Hydration (ONLY for restore from storage - NOT for runtime mutations)
  | { type: 'HYDRATE_FROM_STORAGE'; savedState: Partial<UnifiedLiveSessionState> }
  // Error handling
  | { type: 'SET_TRANSITION_ERROR'; error: { type: 'next_exercise_invalid'; message: string } }
  | { type: 'CLEAR_TRANSITION_ERROR' }
  | { type: 'GO_BACK_EXERCISE'; prevIndex: number; targetValue: number; recommendedBand: ResistanceBandColor | 'none' }

/**
 * [UNIFIED-HANDOFF] Snapshot for transitions to new exercises
 * Contains ALL values needed to render the next exercise immediately
 */
interface UnifiedTransitionSnapshot {
  nextExerciseIndex: number
  nextSetNumber: number
  nextStatus: 'active' | 'resting'
  nextSelectedRPE: RPEValue | null
  nextRepsValue: number
  nextHoldValue: number
  nextBandUsed: ResistanceBandColor | 'none'
  newCompletedSets: CompletedSetData[]
  lastSetRPE: RPEValue | null
  showInterExerciseRest: boolean
  interExerciseRestSeconds: number
}

function createInitialLiveSessionState(): UnifiedLiveSessionState {
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
    selectedRPE: null,
    repsValue: 0,
    holdValue: 0,
    bandUsed: 'none',
    showInterExerciseRest: false,
    interExerciseRestSeconds: 60,
    transitionRepairIssue: null,
  }
}

/**
 * [UNIFIED-HANDOFF] Single reducer for ALL transition-sensitive state
 * Every transition commits atomically - no split state, no effects needed
 * 
 * REDUCER PURITY GUARDRAIL:
 * - This reducer MUST remain pure
 * - NO component closure variables may be referenced inside (no liveSession, session, exercises, etc.)
 * - ALL data must come from `state` parameter or `action` payload
 * - Helper functions must be pure and not depend on component state
 */
function liveSessionReducer(state: UnifiedLiveSessionState, action: LiveSessionAction): UnifiedLiveSessionState {
  switch (action.type) {
    // =========================================================================
    // WORKOUT LIFECYCLE ACTIONS
    // =========================================================================
    case 'START_WORKOUT_ACTIVE':
      return {
        ...state,
        status: 'active',
        startTime: state.startTime || action.startTime,
        transitionRepairIssue: null,
      }
    
    case 'RESUME_WORKOUT':
      return {
        ...state,
        status: state.status === 'ready' ? 'active' : state.status,
        startTime: state.startTime || action.startTime,
        transitionRepairIssue: null,
      }
    
    case 'START_FRESH_WORKOUT':
      return {
        ...createInitialLiveSessionState(),
        status: 'active',
        startTime: action.startTime,
      }
    
    case 'FINISH_WORKOUT':
      return {
        ...state,
        status: 'completed',
      }
    
    case 'RESET_TO_READY':
      return {
        ...state,
        status: 'ready',
      }
    
    case 'SET_STATUS':
      return {
        ...state,
        status: action.status,
      }
    
    case 'TICK_TIMER':
      if (!state.startTime) return state
      return {
        ...state,
        elapsedSeconds: Math.floor((Date.now() - state.startTime) / 1000),
      }
    
    // =========================================================================
    // INPUT STATE ACTIONS
    // =========================================================================
    case 'SET_RPE':
      return { ...state, selectedRPE: action.rpe }
    
    case 'SET_REPS':
      return { ...state, repsValue: action.value }
    
    case 'SET_HOLD':
      return { ...state, holdValue: action.value }
    
    case 'SET_BAND':
      return { ...state, bandUsed: action.band }
    
    case 'SET_WORKOUT_NOTES':
      return { ...state, workoutNotes: action.notes }
    
    // =========================================================================
    // INDEX REPAIR
    // =========================================================================
    case 'REPAIR_INDEX':
      return {
        ...state,
        currentExerciseIndex: action.safeIndex,
        currentSetNumber: 1,
      }
    
    // =========================================================================
    // EXERCISE OVERRIDE ACTIONS
    // =========================================================================
    case 'ADD_EXERCISE_OVERRIDE':
    case 'MARK_EXERCISE_SKIPPED':
    case 'ADJUST_PROGRESSION':
      return {
        ...state,
        exerciseOverrides: {
          ...state.exerciseOverrides,
          [action.index]: action.override,
        },
      }
    
    case 'UNDO_OVERRIDE': {
      const newOverrides = { ...state.exerciseOverrides }
      delete newOverrides[action.index]
      return {
        ...state,
        exerciseOverrides: newOverrides,
      }
    }
    
    case 'COMPLETE_SET_SAME_EXERCISE':
      // Same exercise, move to next set with rest - all in ONE commit
      return {
        ...state,
        status: 'resting',
        completedSets: action.newCompletedSets,
        currentSetNumber: action.nextSetNumber,
        lastSetRPE: state.selectedRPE || 8,
        // Reset inputs for same exercise
        selectedRPE: null,
        repsValue: action.targetValue,
        holdValue: action.targetValue,
        transitionRepairIssue: null,
      }
    
    case 'ADVANCE_TO_NEXT_EXERCISE':
      // Atomic advance - snapshot contains EVERYTHING needed
      return {
        ...state,
        status: action.snapshot.nextStatus,
        currentExerciseIndex: action.snapshot.nextExerciseIndex,
        currentSetNumber: action.snapshot.nextSetNumber,
        completedSets: action.snapshot.newCompletedSets,
        lastSetRPE: action.snapshot.lastSetRPE,
        selectedRPE: action.snapshot.nextSelectedRPE,
        repsValue: action.snapshot.nextRepsValue,
        holdValue: action.snapshot.nextHoldValue,
        bandUsed: action.snapshot.nextBandUsed,
        showInterExerciseRest: action.snapshot.showInterExerciseRest,
        interExerciseRestSeconds: action.snapshot.interExerciseRestSeconds,
        transitionRepairIssue: null,
      }
    
    case 'SHOW_INTER_EXERCISE_REST':
      // Show rest modal - keep current exercise, just update completed sets
      return {
        ...state,
        completedSets: action.newCompletedSets,
        lastSetRPE: action.lastRPE,
        showInterExerciseRest: true,
        interExerciseRestSeconds: action.seconds,
        selectedRPE: null,
        transitionRepairIssue: null,
      }
    
    case 'COMPLETE_INTER_EXERCISE_REST':
    case 'SKIP_INTER_EXERCISE_REST':
    case 'SKIP_EXERCISE':
      // All use the same snapshot-based atomic advance
      return {
        ...state,
        status: action.snapshot.nextStatus,
        currentExerciseIndex: action.snapshot.nextExerciseIndex,
        currentSetNumber: action.snapshot.nextSetNumber,
        completedSets: action.snapshot.newCompletedSets,
        lastSetRPE: action.snapshot.lastSetRPE,
        selectedRPE: action.snapshot.nextSelectedRPE,
        repsValue: action.snapshot.nextRepsValue,
        holdValue: action.snapshot.nextHoldValue,
        bandUsed: action.snapshot.nextBandUsed,
        showInterExerciseRest: false,
        interExerciseRestSeconds: 0,
        transitionRepairIssue: null,
      }
    
    case 'COMPLETE_WORKOUT':
      return {
        ...state,
        status: 'completed',
        completedSets: action.newCompletedSets,
        lastSetRPE: action.lastRPE,
        showInterExerciseRest: false,
        transitionRepairIssue: null,
      }
    
    // =========================================================================
    // HYDRATION (ONLY for restore from saved storage - NOT runtime mutations)
    // =========================================================================
    case 'HYDRATE_FROM_STORAGE':
      // This action is ONLY for initial hydration from saved session data
      // Do NOT use this for ordinary runtime state changes
      return {
        ...state,
        ...action.savedState,
        transitionRepairIssue: null,
      }
    
    case 'SET_TRANSITION_ERROR':
      return {
        ...state,
        transitionRepairIssue: action.error,
      }
    
    case 'CLEAR_TRANSITION_ERROR':
      return {
        ...state,
        transitionRepairIssue: null,
      }
    
    case 'GO_BACK_EXERCISE':
      return {
        ...state,
        currentExerciseIndex: action.prevIndex,
        currentSetNumber: 1,
        status: 'active',
        selectedRPE: null,
        repsValue: action.targetValue,
        holdValue: action.targetValue,
        bandUsed: action.recommendedBand,
        showInterExerciseRest: false,
        transitionRepairIssue: null,
      }
    
    default:
      return state
  }
}

// =============================================================================
// [ATOMIC-HANDOFF] TRANSITION TRACE SYSTEM
// Provides precise breadcrumb logging for exercise transitions
// =============================================================================

type TransitionReason = 
  | 'complete_set' 
  | 'inter_exercise_complete' 
  | 'skip_inter_exercise' 
  | 'skip_exercise'

type TransitionType =
  | 'same_exercise_next_set'
  | 'next_exercise'
  | 'workout_complete'
  | 'inter_exercise_rest_wait'

type TransitionStage = 
  | 'requested'
  | 'computed'
  | 'committed'
  | 'inputs_applied'
  | 'render_verified'

interface TransitionTrace {
  sessionId: string
  fromExerciseIndex: number
  toExerciseIndex: number | null
  fromExerciseName: string
  toExerciseName: string | null
  reason: TransitionReason
  transitionType: TransitionType
  transitionStage: TransitionStage
  beforeStateStatus: string
  afterStateStatus: string
  safeExerciseCount: number
  safeIndexUsed: boolean
  safeNextExerciseExists: boolean
  guardFallbackReason: string | null
  lastSuccessfulRenderExerciseIndex: number
  lastSuccessfulRenderExerciseName: string
  timestamp: number
}

/**
 * [ATOMIC-HANDOFF] Complete atomic transition plan
 * Contains everything needed to execute a transition in ONE commit
 */
interface AtomicTransitionPlan {
  /** The complete next workout state to commit */
  nextWorkoutState: WorkoutSessionState
  /** Input state to apply immediately after commit */
  nextInputState: {
    selectedRPE: RPEValue | null
    repsValue: number
    holdValue: number
    bandUsed: ResistanceBandColor | 'none'
  }
  /** UI flags to set */
  uiFlags: {
    showInterExerciseRest: boolean
    interExerciseRestSeconds: number
  }
  /** Metadata about the transition */
  meta: {
    fromIndex: number
    toIndex: number | null
    fromExerciseName: string
    toExerciseName: string | null
    transitionType: TransitionType
    isWorkoutComplete: boolean
  }
  /** Cleanup actions */
  cleanup: {
    clearRestTimer: boolean
    clearStorage: boolean
    playCompletionAlert: boolean
  }
  /** Guard info if next exercise is invalid */
  guard: {
    fallbackReason: string | null
  }
}

/**
 * [ATOMIC-HANDOFF] Write transition trace to sessionStorage and window for crash diagnosis
 * MUST only be called OUTSIDE setState updaters - never inside a state callback
 */
function writeTransitionTrace(trace: Partial<TransitionTrace>): void {
  try {
    if (typeof window === 'undefined') return
    const existing = (window as unknown as { __spartanlabTransitionTrace?: TransitionTrace }).__spartanlabTransitionTrace
    const merged: TransitionTrace = {
      sessionId: trace.sessionId ?? existing?.sessionId ?? 'unknown',
      fromExerciseIndex: trace.fromExerciseIndex ?? existing?.fromExerciseIndex ?? -1,
      toExerciseIndex: trace.toExerciseIndex ?? existing?.toExerciseIndex ?? null,
      fromExerciseName: trace.fromExerciseName ?? existing?.fromExerciseName ?? 'unknown',
      toExerciseName: trace.toExerciseName ?? existing?.toExerciseName ?? null,
      reason: trace.reason ?? existing?.reason ?? 'complete_set',
      transitionType: trace.transitionType ?? existing?.transitionType ?? 'next_exercise',
      transitionStage: trace.transitionStage ?? existing?.transitionStage ?? 'requested',
      beforeStateStatus: trace.beforeStateStatus ?? existing?.beforeStateStatus ?? 'unknown',
      afterStateStatus: trace.afterStateStatus ?? existing?.afterStateStatus ?? 'unknown',
      safeExerciseCount: trace.safeExerciseCount ?? existing?.safeExerciseCount ?? 0,
      safeIndexUsed: trace.safeIndexUsed ?? existing?.safeIndexUsed ?? false,
      safeNextExerciseExists: trace.safeNextExerciseExists ?? existing?.safeNextExerciseExists ?? false,
      guardFallbackReason: trace.guardFallbackReason ?? existing?.guardFallbackReason ?? null,
      lastSuccessfulRenderExerciseIndex: trace.lastSuccessfulRenderExerciseIndex ?? existing?.lastSuccessfulRenderExerciseIndex ?? -1,
      lastSuccessfulRenderExerciseName: trace.lastSuccessfulRenderExerciseName ?? existing?.lastSuccessfulRenderExerciseName ?? 'unknown',
      timestamp: trace.timestamp ?? Date.now(),
    }
    ;(window as unknown as { __spartanlabTransitionTrace?: TransitionTrace }).__spartanlabTransitionTrace = merged
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('spartanlab_transition_trace', JSON.stringify(merged))
    }
  } catch {
    // Silently absorb - trace is diagnostic only
  }
}

/**
 * [ATOMIC-HANDOFF] Read transition trace for crash diagnosis
 */
function readTransitionTrace(): TransitionTrace | null {
  try {
    if (typeof window === 'undefined') return null
    return (window as unknown as { __spartanlabTransitionTrace?: TransitionTrace }).__spartanlabTransitionTrace ?? null
  } catch {
    return null
  }
}

/**
 * [ATOMIC-HANDOFF] BUILD COMPLETE ATOMIC TRANSITION PLAN
 * 
 * This is the SINGLE pure helper for ALL exercise transitions.
 * It builds the COMPLETE next state in ONE pass with NO side effects.
 * 
 * NEVER call setState, setters, writeTransitionTrace, or any cleanup from here.
 * 
 * @param currentState - Current workout session state
 * @param exercises - Authoritative normalized exercises array
 * @param safeCurrentIndex - The clamped safe current exercise index
 * @param currentExercise - Current exercise from safe contract
 * @param currentInputs - Current input values
 * @param newCompletedSets - Already-computed completed sets array (if applicable)
 * @param reason - Why the transition is happening
 * @param exerciseRuntimeTruth - Runtime truth for current exercise
 * @param sessionRuntimeTruth - Runtime truth for session
 */
function buildAtomicExerciseAdvancePlan(
  currentState: WorkoutSessionState,
  exercises: Array<{
    id?: string
    name: string
    category: string
    sets: number
    repsOrTime: string
    note?: string
    executionTruth?: {
      recommendedBandColor?: ResistanceBandColor
    }
  }>,
  safeCurrentIndex: number,
  currentExercise: { name: string; sets: number; repsOrTime: string },
  currentInputs: {
    selectedRPE: RPEValue | null
    repsValue: number
    holdValue: number
    bandUsed: ResistanceBandColor | 'none'
  },
  newCompletedSets: CompletedSetData[] | null,
  reason: TransitionReason,
  exerciseRuntimeTruth?: { category: string; restSecondsInterExercise: number },
  sessionRuntimeTruth?: { supportsBetweenExerciseRest: boolean }
): AtomicTransitionPlan {
  const fromIndex = safeCurrentIndex
  const fromExerciseName = currentExercise?.name ?? 'Unknown'
  
  const nextIndex = fromIndex + 1
  const isWorkoutComplete = nextIndex >= exercises.length
  const nextExercise = !isWorkoutComplete ? exercises[nextIndex] : null
  const safeNextExerciseExists = nextExercise !== null && typeof nextExercise?.name === 'string'
  
  // Check if next exercise data is valid
  let guardFallbackReason: string | null = null
  if (!isWorkoutComplete && !safeNextExerciseExists) {
    guardFallbackReason = `Next exercise at index ${nextIndex} is missing or malformed`
  }
  
  // WORKOUT COMPLETE
  if (isWorkoutComplete) {
    return {
      nextWorkoutState: {
        ...currentState,
        status: 'completed',
        completedSets: newCompletedSets ?? currentState.completedSets,
        lastSetRPE: currentInputs.selectedRPE ?? currentState.lastSetRPE,
      },
      nextInputState: {
        selectedRPE: null,
        repsValue: currentInputs.repsValue,
        holdValue: currentInputs.holdValue,
        bandUsed: currentInputs.bandUsed,
      },
      uiFlags: {
        showInterExerciseRest: false,
        interExerciseRestSeconds: 0,
      },
      meta: {
        fromIndex,
        toIndex: null,
        fromExerciseName,
        toExerciseName: null,
        transitionType: 'workout_complete',
        isWorkoutComplete: true,
      },
      cleanup: {
        clearRestTimer: true,
        clearStorage: true,
        playCompletionAlert: false,
      },
      guard: { fallbackReason: null },
    }
  }
  
  // Parse target value from NEXT exercise
  const nextRepsOrTime = nextExercise?.repsOrTime || ''
  const nextTargetMatch = nextRepsOrTime.match(/(\d+)/)
  const nextTargetValue = nextTargetMatch ? parseInt(nextTargetMatch[1], 10) : 5
  
  // Determine recommended band for NEXT exercise
  let nextBand: ResistanceBandColor | 'none' = 'none'
  const nextNote = nextExercise?.note || ''
  const nextNoteLower = safeLower(nextNote)
  for (const band of ALL_BAND_COLORS) {
    if (nextNoteLower.includes(band)) {
      nextBand = band
      break
    }
  }
  // Prefer executionTruth band if available
  const truthBand = nextExercise?.executionTruth?.recommendedBandColor
  if (truthBand) {
    nextBand = truthBand
  }
  
  const toExerciseName = nextExercise?.name ?? 'Exercise'
  
  // Check for inter-exercise rest (only if reason is 'complete_set' and runtime truth available)
  const shouldCheckInterRest = reason === 'complete_set' && exerciseRuntimeTruth && sessionRuntimeTruth
  const interRestSeconds = exerciseRuntimeTruth?.restSecondsInterExercise ?? 0
  const shouldShowInterRest = shouldCheckInterRest && 
    sessionRuntimeTruth?.supportsBetweenExerciseRest && 
    exerciseRuntimeTruth?.category !== 'warmup' && 
    exerciseRuntimeTruth?.category !== 'mobility' &&
    interRestSeconds >= 30
  
  // INTER-EXERCISE REST REQUIRED
  if (shouldShowInterRest) {
    return {
      nextWorkoutState: {
        ...currentState,
        completedSets: newCompletedSets ?? currentState.completedSets,
        lastSetRPE: currentInputs.selectedRPE ?? currentState.lastSetRPE,
        // Keep current exercise index - don't advance yet
      },
      nextInputState: {
        selectedRPE: null,
        repsValue: currentInputs.repsValue,
        holdValue: currentInputs.holdValue,
        bandUsed: currentInputs.bandUsed,
      },
      uiFlags: {
        showInterExerciseRest: true,
        interExerciseRestSeconds: interRestSeconds,
      },
      meta: {
        fromIndex,
        toIndex: nextIndex, // Target for after rest
        fromExerciseName,
        toExerciseName,
        transitionType: 'inter_exercise_rest_wait',
        isWorkoutComplete: false,
      },
      cleanup: {
        clearRestTimer: false,
        clearStorage: false,
        playCompletionAlert: false,
      },
      guard: { fallbackReason: guardFallbackReason },
    }
  }
  
  // IMMEDIATE ADVANCE TO NEXT EXERCISE
  return {
    nextWorkoutState: {
      ...currentState,
      status: 'active',
      currentExerciseIndex: nextIndex,
      currentSetNumber: 1,
      completedSets: newCompletedSets ?? currentState.completedSets,
      lastSetRPE: currentInputs.selectedRPE ?? currentState.lastSetRPE,
    },
    nextInputState: {
      selectedRPE: null,
      repsValue: nextTargetValue,
      holdValue: nextTargetValue,
      bandUsed: nextBand,
    },
    uiFlags: {
      showInterExerciseRest: false,
      interExerciseRestSeconds: 0,
    },
    meta: {
      fromIndex,
      toIndex: nextIndex,
      fromExerciseName,
      toExerciseName,
      transitionType: 'next_exercise',
      isWorkoutComplete: false,
    },
    cleanup: {
      clearRestTimer: false,
      clearStorage: false,
      playCompletionAlert: false,
    },
    guard: { fallbackReason: guardFallbackReason },
  }
}

/**
 * [UNIFIED-HANDOFF] BUILD UNIFIED TRANSITION SNAPSHOT
 * 
 * Pure helper that builds a complete snapshot for advancing to the next exercise.
 * Returns everything the reducer needs to commit atomically.
 * 
 * NO side effects - no setters, no storage, no logging.
 */
function buildUnifiedTransitionSnapshot(
  currentState: UnifiedLiveSessionState,
  exercises: Array<{
    id?: string
    name: string
    category: string
    sets: number
    repsOrTime: string
    note?: string
    executionTruth?: {
      recommendedBandColor?: ResistanceBandColor
    }
  }>,
  newCompletedSets: CompletedSetData[],
  safeCurrentIndex: number
): { snapshot: UnifiedTransitionSnapshot; isWorkoutComplete: boolean; guardError: string | null } {
  const nextIndex = safeCurrentIndex + 1
  const isWorkoutComplete = nextIndex >= exercises.length
  
  if (isWorkoutComplete) {
    return {
      snapshot: {
        nextExerciseIndex: safeCurrentIndex, // Stay at current
        nextSetNumber: currentState.currentSetNumber,
        nextStatus: 'active',
        nextSelectedRPE: null,
        nextRepsValue: currentState.repsValue,
        nextHoldValue: currentState.holdValue,
        nextBandUsed: currentState.bandUsed,
        newCompletedSets,
        lastSetRPE: currentState.selectedRPE || 8,
        showInterExerciseRest: false,
        interExerciseRestSeconds: 0,
      },
      isWorkoutComplete: true,
      guardError: null,
    }
  }
  
  const nextExercise = exercises[nextIndex]
  
  // Guard: check if next exercise is valid
  if (!nextExercise || typeof nextExercise.name !== 'string') {
    return {
      snapshot: {
        nextExerciseIndex: safeCurrentIndex,
        nextSetNumber: currentState.currentSetNumber,
        nextStatus: 'active',
        nextSelectedRPE: null,
        nextRepsValue: currentState.repsValue,
        nextHoldValue: currentState.holdValue,
        nextBandUsed: currentState.bandUsed,
        newCompletedSets,
        lastSetRPE: currentState.selectedRPE || 8,
        showInterExerciseRest: false,
        interExerciseRestSeconds: 0,
      },
      isWorkoutComplete: false,
      guardError: `Next exercise at index ${nextIndex} is missing or malformed`,
    }
  }
  
  // Parse target value from NEXT exercise
  const nextRepsOrTime = nextExercise.repsOrTime || ''
  const nextTargetMatch = nextRepsOrTime.match(/(\d+)/)
  const nextTargetValue = nextTargetMatch ? parseInt(nextTargetMatch[1], 10) : 5
  
  // Determine recommended band for NEXT exercise
  let nextBand: ResistanceBandColor | 'none' = 'none'
  const nextNote = nextExercise.note || ''
  const nextNoteLower = safeLower(nextNote)
  for (const band of ALL_BAND_COLORS) {
    if (nextNoteLower.includes(band)) {
      nextBand = band
      break
    }
  }
  // Prefer executionTruth band if available
  const truthBand = nextExercise.executionTruth?.recommendedBandColor
  if (truthBand) {
    nextBand = truthBand
  }
  
  return {
    snapshot: {
      nextExerciseIndex: nextIndex,
      nextSetNumber: 1,
      nextStatus: 'active',
      nextSelectedRPE: null,
      nextRepsValue: nextTargetValue,
      nextHoldValue: nextTargetValue,
      nextBandUsed: nextBand,
      newCompletedSets,
      lastSetRPE: currentState.selectedRPE || 8,
      showInterExerciseRest: false,
      interExerciseRestSeconds: 0,
    },
    isWorkoutComplete: false,
    guardError: null,
  }
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

// [LIVE-SESSION-FIX] Storage schema version - increment when state shape changes
// Old saved state with different version will be discarded to prevent restore poisoning
const STORAGE_SCHEMA_VERSION = 'workout_session_v2'

// [PHASE-X+1] Version stamp for execution proof
const STREAMLINED_WORKOUT_VERSION = 'phase_lw2_boot_safe_v1'

// =============================================================================
// [PHASE LW2] AUTHORITATIVE BOOT LEDGER
// Tracks every boot stage with deterministic markers for crash recovery analysis
// =============================================================================

const BOOT_STAGES = [
  'module_loaded',
  'component_enter',
  'session_validation',
  'safe_session_build_start',
  'safe_session_build_done',
  'restore_state_check_start',
  'restore_state_check_done',
  'state_initialized',
  'exercises_derived',
  'current_exercise_resolved',
  'session_runtime_truth_build_start',
  'session_runtime_truth_build_done',
  'exercise_runtime_truth_build_start',
  'exercise_runtime_truth_build_done',
  'calibration_message_built',
  'render_entry_start',
  // Active state specific stages
  'active_viewmodel_build_start',
  'active_viewmodel_build_done',
  'active_state_entry',
  'core_header_render_start',
  'core_execution_card_render_start',
  'input_block_render_start',
  'action_buttons_render_start',
  'core_boot_complete',
  'optional_blocks_mount_start',
  'optional_blocks_mount_done',
  'active_state_render_complete',
  'live_workout_ready',
] as const

type BootStage = typeof BOOT_STAGES[number]

interface BootLedgerState {
  routeVersion: string
  componentVersion: string
  currentStage: BootStage
  stages: Record<BootStage, number | null>
  sessionId: string | null
  dayLabel: string | null
  dayNumber: number | null
  exerciseCount: number | null
  currentExerciseIndex: number | null
  firstExerciseName: string | null
  restoreWasAttempted: boolean
  restoreWasAccepted: boolean
  restoreRejectReason: string | null
  coreBootComplete: boolean
  optionalBlocksMounted: boolean
  errors: Array<{ stage: BootStage; error: string; timestamp: number }>
}

function createEmptyBootLedger(): BootLedgerState {
  const stages: Record<BootStage, number | null> = {} as Record<BootStage, number | null>
  for (const stage of BOOT_STAGES) {
    stages[stage] = null
  }
  return {
    routeVersion: 'unknown',
    componentVersion: STREAMLINED_WORKOUT_VERSION,
    currentStage: 'module_loaded',
    stages,
    sessionId: null,
    dayLabel: null,
    dayNumber: null,
    exerciseCount: null,
    currentExerciseIndex: null,
    firstExerciseName: null,
    restoreWasAttempted: false,
    restoreWasAccepted: false,
    restoreRejectReason: null,
    coreBootComplete: false,
    optionalBlocksMounted: false,
    errors: [],
  }
}

  function getBootLedger(): BootLedgerState {
  // [PHASE LW2-FIX] Full try-catch - accessed during render
  try {
    if (typeof window === 'undefined') return createEmptyBootLedger()
    return (window as unknown as { __spartanlabBootLedger?: BootLedgerState }).__spartanlabBootLedger || createEmptyBootLedger()
  } catch {
    return createEmptyBootLedger()
  }
  }

  function setBootLedger(ledger: BootLedgerState): void {
  // [PHASE LW2-FIX] Full try-catch wrapper - this is called during render via useState initializer
  try {
    if (typeof window === 'undefined') return
    ;(window as unknown as { __spartanlabBootLedger?: BootLedgerState }).__spartanlabBootLedger = ledger
    // Also persist to sessionStorage for crash recovery
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('spartanlab_boot_ledger', JSON.stringify(ledger))
    }
  } catch {
    // Silently absorb - ledger persistence is non-critical
  }
  }

  function markBootStage(stage: BootStage, data?: Partial<BootLedgerState>): void {
  // [PHASE LW2-FIX] CRITICAL: Wrap entire function in try-catch
  // This function is called in useState initializers which MUST NOT throw
  // Any exception here would crash the entire component render
  try {
    if (typeof window === 'undefined') return // SSR safe
    
    const ledger = getBootLedger()
    ledger.currentStage = stage
    ledger.stages[stage] = Date.now()
    if (data) {
      Object.assign(ledger, data)
    }
    // Update window marker for error boundary
    (window as unknown as { __spartanlabWorkoutStage?: string }).__spartanlabWorkoutStage = stage
    setBootLedger(ledger)
    console.log(`[BOOT-LEDGER] ${stage}`, {
      ...data,
      timestamp: Date.now(),
    })
  } catch (error) {
    // Silently absorb errors - boot ledger is diagnostic only, not critical
    console.warn('[BOOT-LEDGER] Failed to mark stage:', stage, error)
  }
  }

  function recordBootError(stage: BootStage, error: Error | string): void {
  // [PHASE LW2-FIX] CRITICAL: Wrap in try-catch - this can be called during render
  try {
    if (typeof window === 'undefined') return // SSR safe
    
    const ledger = getBootLedger()
    ledger.errors.push({
      stage,
      error: typeof error === 'string' ? error : error.message,
      timestamp: Date.now(),
    })
    setBootLedger(ledger)
    console.error(`[BOOT-LEDGER] ERROR at ${stage}:`, error)
  } catch (err) {
    // Silently absorb - error recording is diagnostic only
    console.warn('[BOOT-LEDGER] Failed to record error:', stage, err)
  }
  }

// [PHASE LW3] Module-scope boot ledger call REMOVED
// Boot ledger initialization now happens in the component's hydration effect
// This ensures no browser storage writes during module evaluation (SSR-safe, render-pure)

// [LW-1 DIAGNOSTIC] Log module load success (pure console log - no storage writes)
console.log('[LW-3] StreamlinedWorkoutSession module loaded', {
  version: STREAMLINED_WORKOUT_VERSION,
  timestamp: Date.now(),
})

// =============================================================================
// SESSION STRUCTURE SIGNATURE - PREVENTS STALE RESTORE POISONING
// =============================================================================

/**
 * Generates a deterministic signature for session structure.
 * Used to detect when saved state belongs to a structurally different session.
 */
function generateSessionStructureSignature(session: { 
  dayNumber?: number
  dayLabel?: string
  exercises?: Array<{ id?: string; name?: string; sets?: number }>
}): string {
  const dayNumber = session.dayNumber ?? 0
  const dayLabel = session.dayLabel ?? ''
  const exerciseCount = session.exercises?.length ?? 0
  
  // Build ordered exercise identity string
  const exerciseIdentity = (session.exercises ?? [])
    .map((ex, idx) => `${idx}:${ex.id || ex.name || 'unknown'}:${ex.sets ?? 0}`)
    .join('|')
  
  // Create deterministic signature
  return `${dayNumber}:${dayLabel}:${exerciseCount}:${exerciseIdentity}`
}

// =============================================================================
// AUTO-SAVE HELPERS
// =============================================================================

function saveSessionToStorage(state: WorkoutSessionState, sessionId: string, structureSignature?: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      ...state, 
      sessionId,
      structureSignature, // [LIVE-SESSION-LOCK] Include structure signature
      schemaVersion: STORAGE_SCHEMA_VERSION, // [LIVE-SESSION-FIX] Include schema version for restore validation
      savedAt: Date.now() 
    }))
  } catch {}
}

function loadSessionFromStorage(
  sessionId: string, 
  exerciseCount?: number,
  currentStructureSignature?: string
): WorkoutSessionState | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const data = JSON.parse(saved)
    
    // [LIVE-SESSION-FIX] CRITICAL: Validate schema version FIRST
    // If schema version is missing or doesn't match, discard entire saved state
    if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
      console.log('[workout-restore] Discarding saved state: schema version mismatch', {
        savedVersion: data.schemaVersion || 'none',
        currentVersion: STORAGE_SCHEMA_VERSION,
        reason: 'schema_version_mismatch',
      })
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      return null
    }
    
    // Only restore if same session and less than 4 hours old
    if (data.sessionId === sessionId && Date.now() - data.savedAt < 4 * 60 * 60 * 1000) {
      
      // [AUTHORITATIVE-HYDRATION-CONTRACT] CRITICAL: Validate structure signature match
      // This prevents restoring state from a session with same dayLabel but different exercises
      if (currentStructureSignature && data.structureSignature) {
        if (data.structureSignature !== currentStructureSignature) {
          console.log('[workout-restore] Discarding saved state: structure signature mismatch', {
            savedSignature: data.structureSignature,
            currentSignature: currentStructureSignature,
            reason: 'session_structure_changed',
          })
          try { localStorage.removeItem(STORAGE_KEY) } catch {}
          return null
        }
      }
      
      // Validate the saved data has required structure
      if (
        typeof data.status === 'string' &&
        typeof data.currentExerciseIndex === 'number' &&
        data.currentExerciseIndex >= 0 && // Ensure index is non-negative
        Array.isArray(data.completedSets)
      ) {
        // [AUTHORITATIVE-HYDRATION-CONTRACT] Validate index within bounds
        let safeCurrentExerciseIndex = data.currentExerciseIndex
        if (exerciseCount !== undefined) {
          if (safeCurrentExerciseIndex >= exerciseCount) {
            console.log('[workout-restore] Clamping currentExerciseIndex to bounds', {
              savedIndex: data.currentExerciseIndex,
              exerciseCount,
              clampedTo: exerciseCount - 1,
            })
            safeCurrentExerciseIndex = Math.max(0, exerciseCount - 1)
          }
        }
        
        // [AUTHORITATIVE-HYDRATION-CONTRACT] Filter and validate completedSets
        let completedSets = data.completedSets
        if (exerciseCount !== undefined) {
          const originalCount = completedSets.length
          completedSets = completedSets.filter((set: { exerciseIndex?: number; setNumber?: number; actualRPE?: number }) => {
            // Validate exerciseIndex is in bounds
            if (typeof set.exerciseIndex !== 'number' || set.exerciseIndex < 0 || set.exerciseIndex >= exerciseCount) {
              return false
            }
            // Validate setNumber is positive
            if (typeof set.setNumber !== 'number' || set.setNumber < 1) {
              return false
            }
            // Validate actualRPE is reasonable
            if (typeof set.actualRPE !== 'number' || set.actualRPE < 1 || set.actualRPE > 10) {
              return false
            }
            return true
          })
          if (completedSets.length !== originalCount) {
            console.log('[workout-restore] Filtered invalid completedSets', {
              originalCount,
              filteredCount: completedSets.length,
              reason: 'invalid_references',
            })
          }
        }
        
        // [AUTHORITATIVE-HYDRATION-CONTRACT] Validate and coerce status
        const validStatuses = ['ready', 'active', 'resting', 'completed']
        const safeStatus = validStatuses.includes(data.status) ? data.status : 'ready'
        
        // [AUTHORITATIVE-HYDRATION-CONTRACT] Clean up exerciseOverrides - remove out-of-bounds keys
        let safeExerciseOverrides = data.exerciseOverrides || {}
        if (exerciseCount !== undefined && typeof safeExerciseOverrides === 'object') {
          const cleanedOverrides: Record<number, ExerciseOverrideState> = {}
          for (const key of Object.keys(safeExerciseOverrides)) {
            const idx = parseInt(key, 10)
            if (!isNaN(idx) && idx >= 0 && idx < exerciseCount) {
              cleanedOverrides[idx] = safeExerciseOverrides[key]
            }
          }
          if (Object.keys(cleanedOverrides).length !== Object.keys(safeExerciseOverrides).length) {
            console.log('[workout-restore] Cleaned out-of-bounds exerciseOverrides', {
              originalCount: Object.keys(safeExerciseOverrides).length,
              cleanedCount: Object.keys(cleanedOverrides).length,
            })
          }
          safeExerciseOverrides = cleanedOverrides
        }
        
        // Ensure currentSetNumber is valid (will be clamped against exercise sets in render)
        const safeCurrentSetNumber = typeof data.currentSetNumber === 'number' && data.currentSetNumber > 0 
          ? data.currentSetNumber 
          : 1
        
        console.log('[workout-restore] Restored session with validation', {
          sessionId,
          safeCurrentExerciseIndex,
          safeCurrentSetNumber,
          completedSetsCount: completedSets.length,
          status: safeStatus,
        })
        
        return {
          ...data,
          status: safeStatus,
          currentExerciseIndex: safeCurrentExerciseIndex,
          currentSetNumber: safeCurrentSetNumber,
          completedSets,
          exerciseOverrides: safeExerciseOverrides,
        }
      }
    }
    return null
  } catch {
    // If parsing fails, clear corrupted data
    console.log('[workout-restore] Clearing corrupted saved session data')
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
    
    // [LIVE-SESSION-FIX] Don't show resume prompt for old schema versions
    if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
      return null
    }
    
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
  // [DISPLAY-CONTRACT] Accept safe display contract - prevents nested field crashes
  reasoningSummary?: WorkoutReasoningDisplayContract | WorkoutReasoningSummary
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
  // [PHASE LW2-FIX] DO NOT CALL markBootStage() BEFORE HOOKS
  // React rules of hooks require all hooks to be called unconditionally and in the same order
  // Boot ledger calls are moved to AFTER all hooks are declared via useEffect
  
  // Simple console log for immediate debugging (no browser API calls)
  console.log('[LW-2] StreamlinedWorkoutSession function entered', {
    sessionProvided: !!session,
    sessionType: typeof session,
    sessionDayLabel: session?.dayLabel ?? 'undefined',
    reasoningSummaryProvided: !!reasoningSummary,
  })
  
  // ==========================================================================
  // [PHASE LW2-FIX] BOOT LEDGER STAGE LOGGING HELPER
  // Uses authoritative boot ledger for deterministic crash recovery
  // FIX: All browser API calls are now deferred to useEffect to comply with React hook rules
  // ==========================================================================
  const logStage = useCallback((stage: string, data?: Record<string, unknown>) => {
    // Map old stage names to boot ledger stages where applicable
    const stageMap: Record<string, BootStage> = {
      'component_entry': 'component_enter',
      'safe_session_building': 'safe_session_build_start',
      'safe_session_built': 'safe_session_build_done',
      'state_initialized': 'state_initialized',
      'current_exercise_resolved': 'current_exercise_resolved',
      'session_runtime_truth_building': 'session_runtime_truth_build_start',
      'session_runtime_truth_built': 'session_runtime_truth_build_done',
      'exercise_runtime_truth_building': 'exercise_runtime_truth_build_start',
      'exercise_runtime_truth_built': 'exercise_runtime_truth_build_done',
      'calibration_message_building': 'calibration_message_built',
      'calibration_message_built': 'calibration_message_built',
    }
    
    const bootStage = stageMap[stage]
    if (bootStage) {
      markBootStage(bootStage, data as Partial<BootLedgerState>)
    } else {
      // Legacy logging for unmapped stages
      if (typeof window !== 'undefined') {
        (window as unknown as { __spartanlabWorkoutStage?: string }).__spartanlabWorkoutStage = stage
      }
      console.log(`[WORKOUT-STAGE] ${stage}`, {
        componentVersion: STREAMLINED_WORKOUT_VERSION,
        timestamp: Date.now(),
        ...data,
      })
    }
  }, [])
  
  // [PHASE LW2-FIX] Boot ledger calls moved to useEffect below to comply with React hook rules
  // DO NOT call markBootStage() here - it must be called AFTER all hooks are declared
  
  // [PHASE LW2-FIX] CRITICAL: Track session validity WITHOUT early return
  // React rules of hooks REQUIRE all hooks to be called in the same order on every render.
  // We CANNOT return early here - we must declare all hooks first, then return the fallback UI at the end.
  const sessionIsValid = session && typeof session === 'object'
  
  // ==========================================================================
  // [AUTHORITATIVE-HYDRATION-CONTRACT] ONE SAFE SESSION CONTRACT
  // This is the ONLY session object used throughout the component
  // All downstream code reads from this, NEVER from raw session
  // [PHASE LW3] Now pure - no logStage or recordBootError during render
  // ==========================================================================
  const safeWorkoutSessionContract = useMemo(() => {
    // [PHASE LW2-FIX] Handle invalid session by returning a minimal fallback contract
    // This allows all hooks to be called, then we show the error UI in the render section
    if (!sessionIsValid) {
      return {
        dayNumber: 0,
        dayLabel: '__INVALID_SESSION__',
        focus: 'general',
        focusLabel: 'Training',
        rationale: '',
        estimatedMinutes: 45,
        isPrimary: true,
        finisherIncluded: false,
        exercises: [],
        warmup: [],
        cooldown: [],
      }
    }
    
    // Normalize exercises with full safety - drop malformed entries
    const rawExercises = Array.isArray(session?.exercises) ? session.exercises : []
    const normalizedExercises = rawExercises.map((ex, idx) => {
      // Skip completely invalid entries
      if (!ex || typeof ex !== 'object') {
        return null
      }
      
      // Build guaranteed-safe exercise object with ALL fields used anywhere in render
      return {
        // Core identity - ALWAYS strings, never undefined
        id: typeof ex.id === 'string' && ex.id ? ex.id : `exercise-${idx}`,
        name: typeof ex.name === 'string' && ex.name ? ex.name : 'Exercise',
        category: typeof ex.category === 'string' && ex.category ? ex.category : 'general',
        
        // Execution parameters - guaranteed safe
        sets: typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 3,
        repsOrTime: typeof ex.repsOrTime === 'string' && ex.repsOrTime ? ex.repsOrTime : '8-12 reps',
        note: typeof ex.note === 'string' ? ex.note : '',
        
        // Override/selection
        isOverrideable: ex.isOverrideable !== false,
        selectionReason: typeof ex.selectionReason === 'string' ? ex.selectionReason : '',
        
        // Prescription data (preserve structure)
        prescribedLoad: ex.prescribedLoad || undefined,
        targetRPE: typeof ex.targetRPE === 'number' ? ex.targetRPE : undefined,
        restSeconds: typeof ex.restSeconds === 'number' ? ex.restSeconds : undefined,
        
        // Method/block context
        method: typeof ex.method === 'string' ? ex.method : undefined,
        methodLabel: typeof ex.methodLabel === 'string' ? ex.methodLabel : undefined,
        blockId: typeof ex.blockId === 'string' ? ex.blockId : undefined,
        
        // Source tracking
        source: typeof ex.source === 'string' ? ex.source : undefined,
        wasAdapted: typeof ex.wasAdapted === 'boolean' ? ex.wasAdapted : undefined,
        progressionDecision: ex.progressionDecision || undefined,
        
        // Coaching/truth metadata
        coachingMeta: ex.coachingMeta || undefined,
        executionTruth: ex.executionTruth || undefined,
      }
    }).filter((ex): ex is NonNullable<typeof ex> => ex !== null)
    
    // Build the authoritative contract
    return {
      // Session identity
      dayNumber: typeof session.dayNumber === 'number' ? session.dayNumber : 1,
      dayLabel: typeof session.dayLabel === 'string' && session.dayLabel ? session.dayLabel : 'Workout',
      focus: typeof session.focus === 'string' && session.focus ? session.focus : 'general',
      focusLabel: typeof session.focusLabel === 'string' && session.focusLabel ? session.focusLabel : 'Training',
      rationale: typeof session.rationale === 'string' ? session.rationale : '',
      
      // Duration
      estimatedMinutes: typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 45,
      
      // Session type flags
      isPrimary: session.isPrimary !== false,
      finisherIncluded: session.finisherIncluded === true,
      
      // Exercises - authoritative safe array
      exercises: normalizedExercises,
      
      // Warmup/cooldown (optional arrays)
      warmup: Array.isArray(session.warmup) ? session.warmup : [],
      cooldown: Array.isArray(session.cooldown) ? session.cooldown : [],
    }
  }, [session, sessionIsValid])
  
  // ALIAS: For backward compatibility, also expose as safeSession
  const safeSession = safeWorkoutSessionContract
  
  // Generate unique sessionId - demo sessions use different prefix to prevent storage collisions
  const isDemoSession = safeSession.dayLabel?.startsWith('DEMO-') || safeSession.dayNumber === 0
  
  // [LIVE-SESSION-LOCK] Safe display label - guaranteed string with DEMO- prefix removed
  const safeDisplayLabel = useMemo(() => {
    const label = safeSession.dayLabel || 'Workout'
    return label.replace('DEMO-', '')
  }, [safeSession.dayLabel])
  
  // Use useMemo to ensure stable sessionId across renders
  // Demo sessions don't persist/restore from storage, so they use a fixed demo key
  const sessionId = useMemo(() => {
    if (isDemoSession) {
      return 'demo-session-isolated' // Fixed ID, but demo won't auto-save/restore
    }
    return `session-${safeSession.dayLabel}-${safeSession.dayNumber}`
  }, [isDemoSession, safeSession.dayLabel, safeSession.dayNumber])
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] Convert safeWorkoutSessionContract to MachineSessionContract
  // This is the bridge between the normalized session and the state machine
  // ==========================================================================
  const machineSessionContract = useMemo<MachineSessionContract | null>(() => {
    if (!sessionIsValid || safeSession.dayLabel === '__INVALID_SESSION__') {
      return null
    }
    return {
      dayLabel: safeSession.dayLabel || 'Workout',
      dayNumber: safeSession.dayNumber || 1,
      estimatedMinutes: safeSession.estimatedMinutes || 45,
      exercises: safeSession.exercises.map((ex): MachineExercise => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        sets: ex.sets,
        repsOrTime: ex.repsOrTime,
        note: ex.note,
        isOverrideable: ex.isOverrideable,
        prescribedLoad: ex.prescribedLoad,
        targetRPE: ex.targetRPE,
        executionTruth: ex.executionTruth,
      })),
    }
  }, [sessionIsValid, safeSession])
  
  // [LIVE-SESSION-LOCK] Generate structure signature for restore validation
  const sessionStructureSignature = useMemo(() => {
    return generateSessionStructureSignature(safeSession)
  }, [safeSession])
  
  // [LIVE-SESSION-LOCK] Log component render proof
  useEffect(() => {
    console.log('[workout-route-proof] StreamlinedWorkoutSession render', {
      componentVersion: STREAMLINED_WORKOUT_VERSION,
      sessionId,
      structureSignature: sessionStructureSignature,
      dayLabel: safeSession.dayLabel,
      dayNumber: safeSession.dayNumber,
      exerciseCount: safeSession.exercises?.length ?? 0,
      isDemoSession,
      timestamp: new Date().toISOString(),
    })
  }, [sessionId, sessionStructureSignature, safeSession.dayLabel, safeSession.dayNumber, safeSession.exercises?.length, isDemoSession])
  
  // Check for existing session on mount
  const [existingSession, setExistingSession] = useState<SavedSessionInfo | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  
  // ==========================================================================
  // [ACTIVE-CORRIDOR-CONTAINMENT] COMPONENT-LEVEL ERROR STATE
  // This catches any runtime errors during active render and shows local fallback
  // instead of escalating to route-level error boundary
  // ==========================================================================
  const [componentError, setComponentError] = useState<Error | null>(null)
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] AUTHORITATIVE STATE MACHINE
  // The machine is the SINGLE SOURCE OF TRUTH for workout execution
  // All transitions go through the machine reducer - no parallel state systems
  // ==========================================================================
  const [machineState, machineDispatch] = useReducer(
    workoutMachineReducer,
    sessionId,
    createInitialMachineState
  )
  
  // [STAGED-ISOLATION-DEBUG] Log machine state immediately after reducer
  console.log('[v0] [machine_state_initialized]', {
    phase: machineState.phase,
    currentExerciseIndex: machineState.currentExerciseIndex,
    currentSetNumber: machineState.currentSetNumber,
    completedSetsCount: machineState.completedSets?.length ?? 0,
  })
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] Derive view model from machine state
  // This is the ONLY source for render values - no scattered ad hoc derivations
  // ==========================================================================
  const viewModel = useMemo(() => {
    return deriveViewModel(machineState, machineSessionContract, existingSession ? { completedSets: existingSession.completedSets } : null)
  }, [machineState, machineSessionContract, existingSession])
  
  // ==========================================================================
  // [BACKWARD-COMPAT] Alias machine state fields to old names for gradual migration
  // These will be removed once all code is migrated to use viewModel
  // [ACTIVE-CORRIDOR-CONTAINMENT] Wrapped in try-catch to prevent escape
  // ==========================================================================
  const liveSession = useMemo(() => {
  try {
  return {
  status: machineState.phase === 'between_exercise_rest' ? 'resting' as const : 
          machineState.phase === 'transitioning' ? 'active' as const :
          machineState.phase === 'invalid' ? 'ready' as const :
          machineState.phase as 'ready' | 'active' | 'resting' | 'completed',
  currentExerciseIndex: machineState.currentExerciseIndex,
  currentSetNumber: machineState.currentSetNumber,
  completedSets: (machineState.completedSets ?? []).map(s => ({
  exerciseIndex: s.exerciseIndex,
  setNumber: s.setNumber,
  actualReps: s.actualReps,
  holdSeconds: s.holdSeconds,
  actualRPE: s.actualRPE,
  bandUsed: s.bandUsed,
  timestamp: s.timestamp,
  })),
  startTime: machineState.startTime,
  elapsedSeconds: machineState.elapsedSeconds,
  lastSetRPE: machineState.lastSetRPE,
  workoutNotes: machineState.workoutNotes,
  exerciseOverrides: machineState.exerciseOverrides,
  selectedRPE: machineState.selectedRPE,
  repsValue: machineState.repsValue,
  holdValue: machineState.holdValue,
  bandUsed: machineState.bandUsed,
  showInterExerciseRest: machineState.phase === 'between_exercise_rest',
  interExerciseRestSeconds: machineState.interExerciseRestSeconds,
  transitionRepairIssue: machineState.phase === 'invalid' ? { type: 'next_exercise_invalid' as const, message: machineState.invalidReason || 'Unknown error' } : null,
  }
  } catch (error) {
    console.error('[v0] [liveSession_error]', error instanceof Error ? error.message : 'unknown')
    return {
      status: 'ready' as const,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      completedSets: [],
      startTime: null,
      elapsedSeconds: 0,
      lastSetRPE: null,
      workoutNotes: '',
      exerciseOverrides: {},
      selectedRPE: 8,
      repsValue: 8,
      holdValue: 30,
      bandUsed: 'none' as const,
      showInterExerciseRest: false,
      interExerciseRestSeconds: 0,
      transitionRepairIssue: null,
    }
  }
  }, [machineState])
  
  // Wrapper dispatch that maps old action types to machine actions
  const dispatch = useCallback((action: LiveSessionAction) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[v0] [legacy_dispatch]', action.type)
    }
    switch (action.type) {
      case 'START_WORKOUT_ACTIVE':
        machineDispatch({ type: 'START_WORKOUT', startTime: action.startTime })
        break
      case 'RESUME_WORKOUT':
        // Resume needs to restore saved state
        const savedState = existingSession ? {
          currentExerciseIndex: existingSession.currentExerciseIndex,
          currentSetNumber: existingSession.currentSetNumber,
          completedSets: existingSession.completedSets as unknown as CompletedSet[],
          elapsedSeconds: existingSession.elapsedSeconds,
          workoutNotes: existingSession.notes || '',
        } : {}
        machineDispatch({ type: 'RESUME_WORKOUT', startTime: action.startTime, savedState })
        break
      case 'START_FRESH_WORKOUT':
        machineDispatch({ type: 'START_FRESH', startTime: action.startTime })
        break
      case 'FINISH_WORKOUT':
        machineDispatch({ type: 'COMPLETE_WORKOUT', finalCompletedSets: machineState.completedSets })
        break
      case 'RESET_TO_READY':
        machineDispatch({ type: 'RESET_TO_READY' })
        break
      case 'SET_STATUS':
        // Status changes happen through other actions in the machine
        break
      case 'TICK_TIMER':
        machineDispatch({ type: 'TICK_TIMER' })
        break
      case 'SET_RPE':
        if (action.rpe !== null) {
          machineDispatch({ type: 'SET_RPE', rpe: action.rpe })
        }
        break
      case 'SET_REPS':
        machineDispatch({ type: 'SET_REPS', value: action.value })
        break
      case 'SET_HOLD':
        machineDispatch({ type: 'SET_HOLD', value: action.value })
        break
      case 'SET_BAND':
        machineDispatch({ type: 'SET_BAND', band: action.band })
        break
      case 'SET_WORKOUT_NOTES':
        machineDispatch({ type: 'SET_NOTES', notes: action.notes })
        break
      case 'COMPLETE_SET_SAME_EXERCISE':
        // For same exercise, dispatch COMPLETE_SET with isLastSetOfExercise=false
        const lastSet = action.newCompletedSets[action.newCompletedSets.length - 1]
        if (lastSet) {
          machineDispatch({
            type: 'COMPLETE_SET',
            completedSet: {
              exerciseIndex: lastSet.exerciseIndex,
              setNumber: lastSet.setNumber,
              actualReps: lastSet.actualReps,
              holdSeconds: lastSet.holdSeconds,
              actualRPE: lastSet.actualRPE,
              bandUsed: lastSet.bandUsed,
              timestamp: lastSet.timestamp,
            },
            isLastSetOfExercise: false,
            exerciseCount: machineSessionContract?.exercises.length ?? 1,
          })
        }
        break
      case 'SHOW_INTER_EXERCISE_REST':
        // This is handled by COMPLETE_SET when isLastSetOfExercise=true
        const restSet = action.newCompletedSets[action.newCompletedSets.length - 1]
        if (restSet) {
          machineDispatch({
            type: 'COMPLETE_SET',
            completedSet: {
              exerciseIndex: restSet.exerciseIndex,
              setNumber: restSet.setNumber,
              actualReps: restSet.actualReps,
              holdSeconds: restSet.holdSeconds,
              actualRPE: restSet.actualRPE,
              bandUsed: restSet.bandUsed,
              timestamp: restSet.timestamp,
            },
            isLastSetOfExercise: true,
            exerciseCount: machineSessionContract?.exercises.length ?? 1,
          })
        }
        break
      case 'COMPLETE_INTER_EXERCISE_REST':
      case 'SKIP_INTER_EXERCISE_REST':
        machineDispatch({
          type: 'ADVANCE_TO_NEXT_EXERCISE',
          nextIndex: action.snapshot.nextExerciseIndex,
          targetValue: action.snapshot.nextRepsValue,
        })
        break
      case 'SKIP_EXERCISE':
        machineDispatch({
          type: 'SKIP_EXERCISE',
          index: machineState.currentExerciseIndex,
          exerciseCount: machineSessionContract?.exercises.length ?? 1,
        })
        break
      case 'ADVANCE_TO_NEXT_EXERCISE':
        machineDispatch({
          type: 'ADVANCE_TO_NEXT_EXERCISE',
          nextIndex: action.snapshot.nextExerciseIndex,
          targetValue: action.snapshot.nextRepsValue,
        })
        break
      case 'COMPLETE_WORKOUT':
        const cwSet = action.newCompletedSets[action.newCompletedSets.length - 1]
        if (cwSet) {
          machineDispatch({
            type: 'COMPLETE_SET',
            completedSet: {
              exerciseIndex: cwSet.exerciseIndex,
              setNumber: cwSet.setNumber,
              actualReps: cwSet.actualReps,
              holdSeconds: cwSet.holdSeconds,
              actualRPE: cwSet.actualRPE,
              bandUsed: cwSet.bandUsed,
              timestamp: cwSet.timestamp,
            },
            isLastSetOfExercise: true,
            exerciseCount: machineSessionContract?.exercises.length ?? 1,
          })
        }
        break
      case 'HYDRATE_FROM_STORAGE':
        // Handle hydration by dispatching RESUME_WORKOUT
        if (action.savedState.completedSets && action.savedState.completedSets.length > 0) {
          machineDispatch({
            type: 'RESUME_WORKOUT',
            startTime: action.savedState.startTime || Date.now(),
            savedState: {
              currentExerciseIndex: action.savedState.currentExerciseIndex,
              currentSetNumber: action.savedState.currentSetNumber,
              completedSets: action.savedState.completedSets as unknown as CompletedSet[],
              elapsedSeconds: action.savedState.elapsedSeconds,
              workoutNotes: action.savedState.workoutNotes,
              lastSetRPE: action.savedState.lastSetRPE,
            },
          })
        }
        break
      case 'SET_TRANSITION_ERROR':
        machineDispatch({ type: 'ENTER_INVALID', reason: action.error.message, stage: action.error.type })
        break
      case 'CLEAR_TRANSITION_ERROR':
        machineDispatch({ type: 'RETRY' })
        break
      default:
        // Handle remaining actions that don't have machine equivalents
        if (process.env.NODE_ENV === 'development') {
          console.log('[v0] [unmapped_action]', (action as { type: string }).type)
        }
    }
  }, [machineDispatch, machineState, machineSessionContract, existingSession])
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] INPUT STATE ALIASES
  // For mutation handlers that dispatch to reducer, we still need access to raw liveSession
  // For display/UI, use the safe* values from machine state
  // ==========================================================================
  // NOTE: These are kept for reducer dispatch handlers that need current values
  // Display code should use safeSelectedRPE, safeRepsValue, etc. from machine state
  
  // [PHASE LW3] Hydration gate - prevents half-hydrated first render
  const [bootHydrationReady, setBootHydrationReady] = useState(false)
  
  // [PHASE LW3] Track if hydration effect has run to prevent double-apply in StrictMode
  const hydrationAppliedRef = useRef<string | null>(null)
  
  // Check for resume prompt on mount - skip for demo sessions
  useEffect(() => {
    // Demo sessions never show resume prompts
    if (isDemoSession) return
    
    const existing = getExistingSessionInfo()
    if (existing && existing.sessionId === sessionId && (liveSession.completedSets?.length ?? 0) > 0 && liveSession.status === 'ready') {
      // We have a saved session that matches - show resume prompt
      setExistingSession(existing)
      setShowResumePrompt(true)
    }
  }, [isDemoSession])
  
  // [UNIFIED-HANDOFF] Dispatch helpers for input state changes
  // These wrap dispatch calls for API compatibility
  const setSelectedRPE = useCallback((rpe: RPEValue | null) => dispatch({ type: 'SET_RPE', rpe }), [])
  const setRepsValue = useCallback((value: number) => dispatch({ type: 'SET_REPS', value }), [])
  const setHoldValue = useCallback((value: number) => dispatch({ type: 'SET_HOLD', value }), [])
  const setBandUsed = useCallback((band: ResistanceBandColor | 'none') => dispatch({ type: 'SET_BAND', band }), [])
  
  // Save state for completed workout
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<PerceivedDifficulty | null>(null)
  const [showQuickLog, setShowQuickLog] = useState(false)
  
  // Exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  // [LIVE-EXECUTION-TRUTH] Adaptive recommendation state
  const [adaptiveRecommendation, setAdaptiveRecommendation] = useState<AdaptiveRecommendationResult | null>(null)
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false)
  
  // [EXECUTION-TRUTH-FIX] New state for enhanced workout experience
  const [sessionNotes, setSessionNotes] = useState<SessionNotes>(createEmptySessionNotes())
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [currentNoteFlags, setCurrentNoteFlags] = useState<ExerciseContextFlag['type'][]>([])
  const [currentNoteText, setCurrentNoteText] = useState('')
  const [isReviewingPreviousExercise, setIsReviewingPreviousExercise] = useState(false)
  const [reviewingExerciseIndex, setReviewingExerciseIndex] = useState<number | null>(null)
  // [UNIFIED-HANDOFF] showInterExerciseRest and interExerciseRestSeconds now come from liveSession
  // No longer separate useState - they're part of the unified reducer
  const [coachingNote, setCoachingNote] = useState<string | null>(null)
  
  // [LIVE-WORKOUT-CORRIDOR-FIX] Next session info - loaded dynamically when workout completes
  // This prevents the heavy adaptive-program-builder from being imported at module load
  const [nextSessionInfo, setNextSessionInfo] = useState<{ dayLabel: string; focusLabel: string; estimatedMinutes?: number } | null>(null)
  
  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // ==========================================================================
  // [PHASE LW3] AUTHORITATIVE SESSION HYDRATION EFFECT
  // This is the ONLY place where restore from storage happens.
  // All boot ledger writes happen here - never during render.
  // ==========================================================================
  useEffect(() => {
    // Generate hydration key to prevent double-apply in StrictMode
    const hydrationKey = `${sessionId}::${sessionStructureSignature}`
    
    // Skip if already applied for this exact session
    if (hydrationAppliedRef.current === hydrationKey) {
      return
    }
    
    // Mark boot stage: component entered
    markBootStage('component_enter', {
      sessionId,
      dayLabel: safeWorkoutSessionContract.dayLabel,
      dayNumber: safeWorkoutSessionContract.dayNumber,
      exerciseCount: safeWorkoutSessionContract.exercises.length,
    })
    
    markBootStage('session_validation', {
      exerciseCount: safeWorkoutSessionContract.exercises.length,
    })
    
    markBootStage('safe_session_build_done', {
      dayLabel: safeWorkoutSessionContract.dayLabel,
      exerciseCount: safeWorkoutSessionContract.exercises.length,
    })
    
    // Demo sessions: skip restore entirely
    if (isDemoSession) {
      markBootStage('restore_state_check_done', {
        restoreWasAttempted: false,
        restoreWasAccepted: false,
        restoreRejectReason: 'demo_mode',
      })
      markBootStage('state_initialized', {
        currentExerciseIndex: 0,
        status: 'ready',
      })
      markBootStage('core_boot_complete', { coreBootComplete: true })
      hydrationAppliedRef.current = hydrationKey
      setBootHydrationReady(true)
      return
    }
    
    // Real sessions: attempt restore with validation
    markBootStage('restore_state_check_start', {
      restoreWasAttempted: true,
    })
    
    const exerciseCount = safeWorkoutSessionContract.exercises?.length ?? 0
    const saved = loadSessionFromStorage(sessionId, exerciseCount, sessionStructureSignature)
    
    if (saved && saved.status !== 'completed') {
      // [LIVE-WORKOUT-MACHINE] Validate hydration payload before accepting
      const validatedPayload = validateHydrationPayload(saved, exerciseCount)
      
      if (validatedPayload) {
        // Restore accepted with validated/sanitized payload
        markBootStage('restore_state_check_done', {
          restoreWasAccepted: true,
          restoreRejectReason: null,
          currentExerciseIndex: validatedPayload.currentExerciseIndex,
        })
        console.log('[workout-restore] Restored saved state with validation', {
          sessionId,
          structureSignature: sessionStructureSignature,
          restoredExerciseIndex: validatedPayload.currentExerciseIndex,
          restoredSetNumber: validatedPayload.currentSetNumber,
          completedSetsCount: validatedPayload.completedSets?.length ?? 0,
        })
        // [UNIFIED-HANDOFF] True hydration from storage - the ONLY valid use of HYDRATE_FROM_STORAGE
        dispatch({ type: 'HYDRATE_FROM_STORAGE', savedState: validatedPayload })
        markBootStage('state_initialized', {
          currentExerciseIndex: validatedPayload.currentExerciseIndex,
          status: validatedPayload.status,
        })
      } else {
        // Restore rejected - validation failed
        console.warn('[workout-restore] Hydration payload validation failed, starting fresh', {
          sessionId,
          reason: 'payload_validation_failed',
        })
        markBootStage('restore_state_check_done', {
          restoreWasAccepted: false,
          restoreRejectReason: 'payload_validation_failed',
        })
        markBootStage('state_initialized', {
          currentExerciseIndex: 0,
          status: 'ready',
        })
      }
    } else {
      // Restore rejected or no saved state
      markBootStage('restore_state_check_done', {
        restoreWasAccepted: false,
        restoreRejectReason: saved ? 'completed_session' : 'no_saved_state',
      })
      markBootStage('state_initialized', {
        currentExerciseIndex: 0,
        status: 'ready',
      })
    }
    
    markBootStage('core_boot_complete', { coreBootComplete: true })
    hydrationAppliedRef.current = hydrationKey
    setBootHydrationReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sessionStructureSignature, isDemoSession])
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] TIMING VALUES FROM MACHINE STATE
  // These are the AUTHORITATIVE values for timing, derived from machine state.
  // ==========================================================================
  const safeStartTime = machineState.startTime
  const safeElapsedSeconds = machineState.elapsedSeconds
  const safeLastSetRPE = machineState.lastSetRPE
  const safeWorkoutNotes = machineState.workoutNotes
  
  // User input values from machine state
  const safeSelectedRPE = machineState.selectedRPE
  const safeRepsValue = machineState.repsValue
  const safeHoldValue = machineState.holdValue
  const safeBandUsed = machineState.bandUsed
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] MACHINE PHASE IS AUTHORITATIVE
  // Map machine phases to UI status for backward compatibility
  // ==========================================================================
  const safeStatus = useMemo(() => {
    const phase = machineState.phase
    switch (phase) {
      case 'ready': return 'ready' as const
      case 'active': return 'active' as const
      case 'resting': return 'resting' as const
      case 'between_exercise_rest': return 'resting' as const
      case 'transitioning': return 'active' as const
      case 'completed': return 'completed' as const
      case 'invalid': return 'ready' as const // Show ready UI with error fallback
      default: return 'ready' as const
    }
  }, [machineState.phase])
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] MACHINE-DERIVED VALUES - REPLACE OLD VALIDATION
  // These are the AUTHORITATIVE values for render, derived from machine state.
  // ==========================================================================
  
  // Get exercises array from contract (for iteration, length checks)
  const exercises = machineSessionContract?.exercises ?? []
  const totalExercises = exercises.length
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0)
  
  // [STAGED-ISOLATION-DEBUG] Log exercises derivation
  console.log('[v0] [exercises_derived]', {
    exerciseCount: exercises.length,
    totalSets,
    machineSessionContractExists: !!machineSessionContract,
  })
  
  // Machine-derived: hasValidExercises
  const hasValidExercises = exercises.length > 0
  
  // Machine-derived: safeExerciseIndex (clamped to valid range)
  const safeExerciseIndex = hasValidExercises
    ? Math.max(0, Math.min(machineState.currentExerciseIndex, exercises.length - 1))
    : 0
  
  // Machine-derived: validatedCurrentExercise
  const validatedCurrentExercise = hasValidExercises ? exercises[safeExerciseIndex] : null
  
  // Machine-derived: normalizedCompletedSets (directly from machine state)
  const normalizedCompletedSets = machineState.completedSets
  
  // Machine-derived: completedSetsCount
  const completedSetsCount = normalizedCompletedSets.length
  
  // Machine-derived: normalizedExerciseOverrides
  const normalizedExerciseOverrides = machineState.exerciseOverrides
  
  // Machine-derived: validatedSetNumber
  const validatedSetNumber = machineState.currentSetNumber
  
  // Machine handles index clamping - no separate check needed
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] SAFE CURRENT EXERCISE
  // Derived from machine state - guaranteed safe even if array is empty
  // ==========================================================================
  const safeCurrentExercise = useMemo(() => {
    // Use validated exercise from machine-derived value
    if (validatedCurrentExercise) {
      return validatedCurrentExercise as NormalizedExercise
    }
    
    // Fallback for invalid runtime - guaranteed safe defaults
    return {
      id: 'fallback-exercise',
      name: 'Exercise',
      category: 'general',
      sets: 3,
      repsOrTime: '8-12 reps',
      note: '',
      isOverrideable: true,
      selectionReason: '',
      prescribedLoad: undefined,
      targetRPE: undefined,
      restSeconds: undefined,
      method: undefined,
      methodLabel: undefined,
      blockId: undefined,
      executionTruth: undefined,
      coachingMeta: undefined,
    } as NormalizedExercise
  }, [validatedCurrentExercise])
  
  // ==========================================================================
  // [AUTHORITATIVE-HYDRATION-CONTRACT] STAGE CONTEXT PERSISTENCE
  // Store context in sessionStorage for crash recovery diagnostics
  // ==========================================================================
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      try {
        // [LIVE-WORKOUT-MACHINE] Use safe index from machine
        sessionStorage.setItem('spartanlab_workout_stage_context', JSON.stringify({
          sessionId,
          dayLabel: safeWorkoutSessionContract.dayLabel,
          dayNumber: safeWorkoutSessionContract.dayNumber,
          isDemo: isDemoSession,
          exerciseCount: exercises.length,
          currentExerciseIndex: safeExerciseIndex,
        }))
      } catch {}
    }
  }, [sessionId, safeWorkoutSessionContract.dayLabel, safeWorkoutSessionContract.dayNumber, isDemoSession, exercises.length, safeExerciseIndex])
  
  // [weighted-truth] TASK H: Log workout session loading with prescribed load
  useEffect(() => {
    if (safeCurrentExercise.prescribedLoad?.load) {
      console.log('[weighted-truth] Workout session loaded with prescribed load:', {
        exerciseName: safeCurrentExercise.name,
        load: safeCurrentExercise.prescribedLoad.load,
        unit: safeCurrentExercise.prescribedLoad.unit,
        confidence: safeCurrentExercise.prescribedLoad.confidenceLevel,
      })
    }
  }, [safeCurrentExercise])
  
  // ==========================================================================
  // [EARLY-STAGE-GATE] DERIVATION STAGE CONTROLLER
  // This gate determines which active-only derivations are allowed to run.
  // Stage 1 = minimal shell only - NO active-only derivations
  // Stage 2+ = progressively allow more derivations
  // ==========================================================================
  // [ACTIVE-DERIVATION-MAP]
  // ALWAYS SAFE (run unconditionally):
  //   - safeWorkoutSessionContract, safeDisplayLabel, sessionId
  //   - machineState (reducer), safeStatus, safeCurrentExercise
  //   - validatedSetNumber, safeExerciseIndex, safeElapsedSeconds
  //
  // ACTIVE-ONLY (require stage >= 2):
  //   - sessionRuntimeTruth (stage 2+)
  //   - exerciseRuntimeTruth (stage 3+)
  //   - calibrationMessage (stage 3+)
  //   - activeEntryPreparation (stage 4+)
  //   - activeWorkoutViewModel (stage 6 only)
  // ==========================================================================
  const ACTIVE_DERIVATION_STAGE = 6 // Controls which derivations run (1-6) - FULL RENDER
  const isActivePhase = safeStatus === 'active' || safeStatus === 'resting'
  const shouldSkipFullDerivations = isActivePhase && ACTIVE_DERIVATION_STAGE === 1
  
  console.log('[v0] [early_stage_gate]', {
    ACTIVE_DERIVATION_STAGE,
    safeStatus,
    isActivePhase,
    shouldSkipFullDerivations,
  })
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] UNIFIED BOOT PREPARATION GUARD
  // This is a LOCAL containment layer for all post-validation boot derivations.
  // If ANY boot-critical derivation throws, we capture it here instead of crashing.
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] DERIVED RUNTIME TRUTH VALUES
  // These are helper values for UI display, derived from machine state.
  // They do NOT act as execution owners - machine is the only owner.
  // ==========================================================================
  
  // Session runtime truth - derived directly, no parallel validation
  // [STAGE-GATED] Only compute full truth for stage >= 2
  const sessionRuntimeTruth: SessionRuntimeTruth = useMemo(() => {
    // STAGE 1: Skip full derivation, return minimal safe values
    if (shouldSkipFullDerivations) {
      console.log('[v0] [sessionRuntimeTruth] SKIPPED - stage 1 mode')
      return {
        sessionId: sessionId,
        programId: null,
        dayNumber: 1,
        dayLabel: safeDisplayLabel || 'Workout',
        currentExerciseCount: 1,
        totalExerciseCount: exercises.length || 1,
        totalSetCount: totalSets || 3,
        adaptationConfidence: 'low' as const,
        firstWorkoutsCalibrationMode: true,
        workoutsCompletedInProgram: 0,
        supportsBackNavigation: false,
        supportsBetweenExerciseRest: false,
        supportsNotesCapture: false,
        supportsTimerAlerts: false,
        sessionFocus: 'general',
        estimatedDurationMinutes: 30,
      }
    }
    
    if (!hasValidExercises) {
      return {
        sessionId: sessionId,
        programId: null,
        dayNumber: 1,
        dayLabel: 'Workout',
        currentExerciseCount: 1,
        totalExerciseCount: 0,
        totalSetCount: 0,
        adaptationConfidence: 'low' as const,
        firstWorkoutsCalibrationMode: true,
        workoutsCompletedInProgram: 0,
        supportsBackNavigation: true,
        supportsBetweenExerciseRest: true,
        supportsNotesCapture: true,
        supportsTimerAlerts: false,
        sessionFocus: 'general',
        estimatedDurationMinutes: 30,
      }
    }
    
    try {
      return buildSessionRuntimeTruth(safeWorkoutSessionContract as AdaptiveSession, {
        programId: null,
        workoutsCompleted: 0,
        sessionIndex: 0,
      })
    } catch {
      // Fallback on error - machine will transition to invalid if truly broken
      return {
        sessionId: sessionId,
        programId: null,
        dayNumber: safeWorkoutSessionContract.dayNumber ?? 1,
        dayLabel: safeWorkoutSessionContract.dayLabel || 'Workout',
        currentExerciseCount: safeExerciseIndex + 1,
        totalExerciseCount: exercises.length,
        totalSetCount: totalSets,
        adaptationConfidence: 'low' as const,
        firstWorkoutsCalibrationMode: true,
        workoutsCompletedInProgram: 0,
        supportsBackNavigation: true,
        supportsBetweenExerciseRest: true,
        supportsNotesCapture: true,
        supportsTimerAlerts: false,
        sessionFocus: 'general',
        estimatedDurationMinutes: safeWorkoutSessionContract.estimatedMinutes ?? 30,
      }
    }
  }, [hasValidExercises, sessionId, safeWorkoutSessionContract, safeExerciseIndex, exercises.length, totalSets])
  
  // Exercise runtime truth - derived directly, no parallel validation
  // [STAGE-GATED] Only compute full truth for stage >= 3
  const exerciseRuntimeTruth: ExerciseRuntimeTruth = useMemo(() => {
    // STAGE 1-2: Skip full derivation, return minimal safe values
    if (shouldSkipFullDerivations || (isActivePhase && ACTIVE_DERIVATION_STAGE < 3)) {
      console.log('[v0] [exerciseRuntimeTruth] SKIPPED - stage < 3 mode')
      return {
        exerciseId: safeCurrentExercise?.id || 'fallback',
        exerciseName: safeCurrentExercise?.name || 'Exercise',
        originalName: safeCurrentExercise?.name || 'Exercise',
        category: safeCurrentExercise?.category || 'general',
        displayType: 'reps' as const,
        targetValue: 10,
        targetUnit: 'reps',
        targetRPE: 7,
        restSecondsIntraSet: 90,
        restSecondsInterExercise: 120,
        progressionFamily: null,
        progressionMode: 'fixed' as const,
        canAdjustProgression: false,
        progressionFallbacks: [],
        supportsBandAdjustment: false,
        recommendedBandColor: null,
        supportsNotes: true,
        supportsPainFlag: true,
        supportsFatigueFlag: true,
        availableContextFlags: [],
        isFixedPrescription: false,
        calibrationState: 'needs_calibration' as const,
        setHistory: [],
        lastSessionPerformance: null,
      }
    }
    
    if (!hasValidExercises || !safeCurrentExercise) {
      return {
        exerciseId: 'fallback',
        exerciseName: 'Exercise',
        originalName: 'Exercise',
        category: 'general',
        displayType: 'reps' as const,
        targetValue: 10,
        targetUnit: 'reps',
        targetRPE: 7,
        restSecondsIntraSet: 90,
        restSecondsInterExercise: 120,
        progressionFamily: null,
        progressionMode: 'fixed' as const,
        canAdjustProgression: false,
        progressionFallbacks: [],
        supportsBandAdjustment: false,
        recommendedBandColor: null,
        supportsNotes: true,
        supportsPainFlag: true,
        supportsFatigueFlag: true,
        availableContextFlags: [],
        isFixedPrescription: false,
        fixedPrescriptionReason: null,
        isOverridden: false,
        overrideType: null,
      }
    }
    
    try {
      const overrideState = normalizedExerciseOverrides[safeExerciseIndex]
      return buildExerciseRuntimeTruth(safeCurrentExercise as AdaptiveExercise, safeExerciseIndex, overrideState ? {
        isOverridden: !!(overrideState.isReplaced || overrideState.isProgressionAdjusted || overrideState.isSkipped),
        overrideType: overrideState.isReplaced ? 'replaced' : overrideState.isProgressionAdjusted ? 'progression_adjusted' : overrideState.isSkipped ? 'skipped' : null,
        currentName: overrideState.currentName,
      } : undefined)
    } catch {
      // Fallback on error
      return {
        exerciseId: safeCurrentExercise.id || `exercise-${safeExerciseIndex}`,
        exerciseName: safeCurrentExercise.name,
        originalName: safeCurrentExercise.name,
        category: safeCurrentExercise.category || 'general',
        displayType: 'reps' as const,
        targetValue: 10,
        targetUnit: 'reps',
        targetRPE: 7,
        restSecondsIntraSet: 90,
        restSecondsInterExercise: 120,
        progressionFamily: null,
        progressionMode: 'fixed' as const,
        canAdjustProgression: false,
        progressionFallbacks: [],
        supportsBandAdjustment: false,
        recommendedBandColor: null,
        supportsNotes: true,
        supportsPainFlag: true,
        supportsFatigueFlag: true,
        availableContextFlags: [],
        isFixedPrescription: false,
        fixedPrescriptionReason: null,
        isOverridden: false,
        overrideType: null,
      }
    }
  }, [hasValidExercises, safeCurrentExercise, safeExerciseIndex, normalizedExerciseOverrides])
  
  // Calibration message - derived directly
  const calibrationMessage = useMemo(() => {
    try {
      return getCalibrationMessage(sessionRuntimeTruth)
    } catch {
      return { show: false, title: '', description: '' }
    }
  }, [sessionRuntimeTruth])
  
  // Next exercise - derived directly
  const safeNextExercise = useMemo(() => {
    const nextIndex = safeExerciseIndex + 1
    if (nextIndex < exercises.length && exercises[nextIndex]) {
      return exercises[nextIndex] as NormalizedExercise
    }
    return null
  }, [safeExerciseIndex, exercises])
  
  // Legacy bootPreparation.ok compatibility - always true since machine handles failures
  const bootPreparation = { ok: true, failureStage: null, failureReason: null }
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] DERIVED ACTIVE ENTRY VALUES
  // These are helper values for active UI display, derived from machine state.
  // [ACTIVE-CORRIDOR-CONTAINMENT] Wrapped in try-catch to prevent escape
  // [STAGE-GATED] Only compute full values for stage >= 4
  // ==========================================================================
  const activeEntryPreparation = useMemo(() => {
    // STAGE 1-3: Skip full derivation, return minimal safe values
    if (shouldSkipFullDerivations || (isActivePhase && ACTIVE_DERIVATION_STAGE < 4)) {
      console.log('[v0] [activeEntryPreparation] SKIPPED - stage < 4 mode')
      return {
        ok: true as const,
        failureStage: null,
        failureReason: null,
        targetValue: 8,
        recommendedBand: undefined,
        targetRPE: 8,
        isHoldExercise: false,
        displaySets: `${safeCurrentExercise?.sets ?? 3} sets`,
        displayRepsTime: safeCurrentExercise?.repsOrTime ?? '8-12 reps',
      }
    }
    
    try {
    // Parse target value from current exercise
    let targetValue = 8
    const repsOrTime = safeCurrentExercise?.repsOrTime ?? ''
    if (typeof repsOrTime === 'string' && repsOrTime.length > 0) {
      const match = repsOrTime.match(/(\d+)/)
      if (match) {
        targetValue = parseInt(match[1], 10)
      }
    }
    
    // Parse recommended band from note
    let recommendedBand: ResistanceBandColor | undefined
    const note = safeCurrentExercise?.note ?? ''
    if (typeof note === 'string' && note.length > 0) {
      const noteLower = note.toLowerCase()
      for (const band of ALL_BAND_COLORS) {
        if (noteLower.includes(band)) {
          recommendedBand = band
          break
        }
      }
    }
    
    // Detect hold exercise
    const isHoldExercise = typeof repsOrTime === 'string' && 
      (repsOrTime.toLowerCase().includes('sec') || repsOrTime.toLowerCase().includes('hold'))
    
    return {
      ok: true as const,
      failureStage: null,
      failureReason: null,
      targetValue,
      recommendedBand,
      targetRPE: 8,
      isHoldExercise,
      displaySets: `${safeCurrentExercise?.sets ?? 3} sets`,
      displayRepsTime: safeCurrentExercise?.repsOrTime ?? '8-12 reps',
    }
    } catch (error) {
      console.error('[v0] [activeEntryPreparation_error]', error instanceof Error ? error.message : 'unknown')
      return {
        ok: true as const,
        failureStage: null,
        failureReason: null,
        targetValue: 8,
        recommendedBand: undefined,
        targetRPE: 8,
        isHoldExercise: false,
        displaySets: '3 sets',
        displayRepsTime: '8-12 reps',
      }
    }
  }, [safeCurrentExercise])


  
  // [PHASE LW3] Effect-based boot diagnostics - runs after derivations are computed
  useEffect(() => {
    if (!bootHydrationReady) return
    
    markBootStage('exercises_derived', {
      exerciseCount: exercises.length,
      firstExerciseName: exercises[0]?.name ?? null,
    })
    markBootStage('session_runtime_truth_build_done', { 
      sessionId: sessionRuntimeTruth.sessionId, 
      totalExerciseCount: sessionRuntimeTruth.totalExerciseCount 
    })
    markBootStage('exercise_runtime_truth_build_done', { 
      exerciseId: exerciseRuntimeTruth.exerciseId, 
      exerciseName: exerciseRuntimeTruth.exerciseName 
    })
    markBootStage('calibration_message_built', { hasMessage: !!calibrationMessage })
  }, [bootHydrationReady, exercises, sessionRuntimeTruth, exerciseRuntimeTruth, calibrationMessage])
  
  // [MACHINE-PHASE-DIAGNOSTIC] Log phase transitions for debugging
  // [LIVE-WORKOUT-MACHINE] Machine phase diagnostic effect
  useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
  console.log('[v0] [machine_phase_diagnostic]', {
  machinePhase: machineState.phase,
  safeStatus,
  viewModelPhase: viewModel.phase,
  currentExerciseIndex: machineState.currentExerciseIndex,
  currentSetNumber: machineState.currentSetNumber,
  completedSetsCount: machineState.completedSets.length,
  hasValidExercises,
  exerciseCount: machineSessionContract?.exercises.length ?? 0,
  })
  }
  }, [machineState.phase, machineState.currentExerciseIndex, machineState.currentSetNumber, machineState.completedSets.length, safeStatus, viewModel.phase, hasValidExercises, machineSessionContract])
  
  // ==========================================================================
  // [PHASE LW2] ACTIVE WORKOUT VIEW MODEL
  // Single authoritative model for all active render values.
  // [PHASE LW3] Now pure - no boot ledger writes during render
  // [ACTIVE-CORRIDOR-CONTAINMENT] Wrapped in try-catch to prevent escape
  // [STAGE-GATED] Only compute full view model for stage 6
  // ==========================================================================
  const activeWorkoutViewModel = useMemo(() => {
    // STAGE 1-5: Skip full derivation, return minimal safe view model
    if (shouldSkipFullDerivations || (isActivePhase && ACTIVE_DERIVATION_STAGE < 6)) {
      console.log('[v0] [activeWorkoutViewModel] SKIPPED - stage < 6 mode')
      return {
        sessionId: sessionId || 'unknown-session',
        dayLabel: safeDisplayLabel || 'Workout',
        dayNumber: 1,
        totalExercises: exercises.length || 1,
        totalSets: totalSets || 3,
        completedSetsCount: completedSetsCount || 0,
        currentExerciseIndex: safeExerciseIndex || 0,
        currentSetNumber: validatedSetNumber || 1,
        currentExerciseName: safeCurrentExercise?.name || 'Exercise',
        currentExerciseCategory: safeCurrentExercise?.category || 'general',
        currentExerciseSets: safeCurrentExercise?.sets || 3,
        currentExerciseRepsOrTime: safeCurrentExercise?.repsOrTime || '8-12 reps',
        currentExerciseNote: safeCurrentExercise?.note || '',
        hasNextExercise: false,
        nextExerciseName: null,
        nextExerciseCategory: null,
        isHoldType: false,
        hasLoad: false,
        isLastExercise: false,
        isLastSet: false,
        isWorkoutComplete: false,
        setDisplay: `Set ${validatedSetNumber || 1}/${safeCurrentExercise?.sets || 3}`,
        exerciseProgress: `1/${exercises.length || 1}`,
        setsProgress: `0/${totalSets || 3}`,
        loadDisplay: null,
        isValid: hasValidExercises && !!safeCurrentExercise,
      }
    }
    
    try {
    // Core session identity
    const safeSessionId = sessionId || 'unknown-session'
    const safeDayLabel = safeWorkoutSessionContract.dayLabel || 'Workout'
    const safeDayNumber = safeWorkoutSessionContract.dayNumber || 1
    
    // Exercise counts - use centralized validation
    const safeExerciseCount = exercises.length
    const safeTotalSets = exercises.reduce((sum, ex) => sum + (ex?.sets ?? 3), 0)
    const safeCompletedSetsCount = normalizedCompletedSets.length
    
    // Current exercise position - use centralized validation (already clamped/validated)
    const safeCurrentIndex = safeExerciseIndex
    const safeCurrentSetNumber = validatedSetNumber
    
    // Current exercise details (from safe contract)
    const currentExerciseName = safeCurrentExercise.name || 'Exercise'
    const currentExerciseCategory = safeCurrentExercise.category || 'general'
    const currentExerciseSets = safeCurrentExercise.sets || 3
    const currentExerciseRepsOrTime = safeCurrentExercise.repsOrTime || '8-12 reps'
    const currentExerciseNote = safeCurrentExercise.note || ''
    
    // Next exercise info (bounded)
    const hasNextExercise = safeCurrentIndex < exercises.length - 1
    const nextExercise = hasNextExercise ? exercises[safeCurrentIndex + 1] : null
    const nextExerciseName = nextExercise?.name || null
    const nextExerciseCategory = nextExercise?.category || null
    
    // Derived booleans
    const isHoldType = safeLower(currentExerciseRepsOrTime).includes('sec') || 
                       safeLower(currentExerciseRepsOrTime).includes('hold')
    const hasLoad = !!(safeCurrentExercise.prescribedLoad?.load && safeCurrentExercise.prescribedLoad.load > 0)
    const isLastExercise = safeCurrentIndex >= exercises.length - 1
    const isLastSet = safeCurrentSetNumber >= currentExerciseSets
    const isWorkoutComplete = isLastExercise && isLastSet
    
    // Safe display strings
    const setDisplay = `Set ${safeCurrentSetNumber}/${currentExerciseSets}`
    const exerciseProgress = `${safeCurrentIndex + 1}/${safeExerciseCount}`
    const setsProgress = `${safeCompletedSetsCount}/${safeTotalSets}`
    
    // Load display - use optional chaining to avoid potential throw
    const loadDisplay = hasLoad && safeCurrentExercise.prescribedLoad
      ? `@ +${safeCurrentExercise.prescribedLoad.load} ${safeCurrentExercise.prescribedLoad.unit}`
      : null
    
    return {
      // Identity
      sessionId: safeSessionId,
      dayLabel: safeDayLabel,
      dayNumber: safeDayNumber,
      
      // Exercise counts
      totalExercises: safeExerciseCount,
      totalSets: safeTotalSets,
      completedSetsCount: safeCompletedSetsCount,
      
      // Current position
      currentExerciseIndex: safeCurrentIndex,
      currentSetNumber: safeCurrentSetNumber,
      
      // Current exercise
      currentExerciseName,
      currentExerciseCategory,
      currentExerciseSets,
      currentExerciseRepsOrTime,
      currentExerciseNote,
      
      // Next exercise
      hasNextExercise,
      nextExerciseName,
      nextExerciseCategory,
      
      // Derived booleans
      isHoldExercise: isHoldType,
      hasLoad,
      isLastExercise,
      isLastSet,
      isWorkoutComplete,
      hasValidExercises: safeExerciseCount > 0,
      
      // Display strings
      setDisplay,
      exerciseProgress,
      setsProgress,
      loadDisplay,
      
      // Validation flag - use runtime validation's hasValidExercises and validatedCurrentExercise
      // instead of checking fallback name which causes false negatives
      isValid: hasValidExercises && !!validatedCurrentExercise,
    }
    } catch (error) {
      // [ACTIVE-CORRIDOR-CONTAINMENT] Catch any error and return safe fallback
      console.error('[v0] [activeWorkoutViewModel_error]', error instanceof Error ? error.message : 'unknown')
      return {
        sessionId: sessionId || 'unknown-session',
        dayLabel: 'Workout',
        dayNumber: 1,
        totalExercises: 0,
        totalSets: 0,
        completedSetsCount: 0,
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        currentExerciseName: 'Exercise',
        currentExerciseCategory: 'general',
        currentExerciseSets: 3,
        currentExerciseRepsOrTime: '8-12 reps',
        currentExerciseNote: '',
        hasNextExercise: false,
        nextExerciseName: null,
        nextExerciseCategory: null,
        isHoldExercise: false,
        hasLoad: false,
        isLastExercise: true,
        isLastSet: false,
        isWorkoutComplete: false,
        hasValidExercises: false,
        setDisplay: 'Set 1/3',
        exerciseProgress: '1/1',
        setsProgress: '0/0',
        loadDisplay: null,
        isValid: false, // Mark as invalid to trigger local fallback
      }
    }
  }, [
    sessionId, 
    safeWorkoutSessionContract.dayLabel, 
    safeWorkoutSessionContract.dayNumber, 
    exercises, 
    liveSession.currentExerciseIndex, 
    liveSession.currentSetNumber, 
    liveSession.completedSets, 
    safeCurrentExercise,
    hasValidExercises,
    validatedCurrentExercise
  ])
  
  // [LIVE-WORKOUT-MACHINE] Use machine-derived isHoldExercise
  const isHoldExercise = activeEntryPreparation.isHoldExercise
  
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] AUTHORITATIVE ACTIVE-STATE VALUES
  // This is the SINGLE source for active render values in this component.
  // Do NOT redeclare these variables elsewhere in the render corridor.
  // ==========================================================================
  const targetValue = activeEntryPreparation.targetValue
  const targetRPE = activeEntryPreparation.targetRPE
  const recommendedBand = activeEntryPreparation.recommendedBand
  
  // Legacy getTargetValue kept for backward compat in some places
  const getTargetValue = useCallback((): number => targetValue, [targetValue])
  
  // Legacy getRecommendedBand kept for backward compat
  const getRecommendedBand = useCallback((): ResistanceBandColor | undefined => recommendedBand, [recommendedBand])
  
  // ==========================================================================
  // [UNIFIED-HANDOFF] UNIFIED REDUCER-BASED ADVANCEMENT SYSTEM
  // ALL transitions go through ONE dispatch - no split state, no effects needed
  // ==========================================================================
  
  /**
   * [UNIFIED-HANDOFF] Execute unified transition to next exercise
   * Uses the pure buildUnifiedTransitionSnapshot helper + single dispatch
   */
  const executeUnifiedAdvance = useCallback((reason: TransitionReason) => {
    // Write transition_requested breadcrumb
    writeTransitionTrace({
      reason,
      transitionStage: 'requested',
      timestamp: Date.now(),
      safeIndexUsed: true,
    })
    
    // Build snapshot using PURE helper - no side effects
    const { snapshot, isWorkoutComplete, guardError } = buildUnifiedTransitionSnapshot(
      liveSession,
      exercises,
      liveSession.completedSets, // Use current completed sets for skip paths
      safeExerciseIndex
    )
    
    // Write transition_computed breadcrumb
    writeTransitionTrace({
      transitionStage: 'computed',
      fromExerciseIndex: safeExerciseIndex,
      toExerciseIndex: snapshot.nextExerciseIndex,
      fromExerciseName: safeCurrentExercise.name,
      toExerciseName: exercises[snapshot.nextExerciseIndex]?.name ?? null,
      transitionType: isWorkoutComplete ? 'workout_complete' : 'next_exercise',
      beforeStateStatus: liveSession.status,
      afterStateStatus: isWorkoutComplete ? 'completed' : 'active',
      safeExerciseCount: exercises.length,
      safeNextExerciseExists: !isWorkoutComplete && snapshot.nextExerciseIndex < exercises.length,
      guardFallbackReason: guardError,
    })
    
    console.log('[UNIFIED-HANDOFF] executeUnifiedAdvance', {
      reason,
      fromIndex: safeExerciseIndex,
      toIndex: snapshot.nextExerciseIndex,
      isWorkoutComplete,
      guardError,
    })
    
    // Handle guard error - show controlled local fallback
    if (guardError) {
      dispatch({ type: 'SET_TRANSITION_ERROR', error: { type: 'next_exercise_invalid', message: guardError } })
      writeTransitionTrace({ transitionStage: 'committed', guardFallbackReason: guardError })
      return
    }
    
    // Handle workout complete
    if (isWorkoutComplete) {
      dispatch({ 
        type: 'COMPLETE_WORKOUT', 
        newCompletedSets: snapshot.newCompletedSets,
        lastRPE: snapshot.lastSetRPE || 8
      })
      writeTransitionTrace({ transitionStage: 'committed' })
      clearRestTimerState()
      clearSessionStorage()
      return
    }
    
    // ONE dispatch for the entire transition - inputs included
    dispatch({ type: 'ADVANCE_TO_NEXT_EXERCISE', snapshot })
    
    // Write committed breadcrumb
    writeTransitionTrace({ transitionStage: 'committed' })
    
    // Cleanup outside reducer (external side effects only)
    clearRestTimerState()
    
    console.log('[UNIFIED-HANDOFF] Transition complete', {
      toIndex: snapshot.nextExerciseIndex,
    })
  }, [liveSession, exercises, safeExerciseIndex, safeCurrentExercise.name])
  
  // [LIVE-WORKOUT-CORRIDOR-FIX] Load next session info when workout completes
  // This uses dynamic import to avoid loading the heavy adaptive-program-builder at module load
  useEffect(() => {
    if (safeStatus === 'completed' && !nextSessionInfo) {
      (async () => {
        try {
          const { getLatestAdaptiveProgram } = await import('@/lib/adaptive-program-builder')
          const program = getLatestAdaptiveProgram()
          if (!program?.sessions) return
          const currentIdx = program.sessions.findIndex(s => s.dayNumber === safeSession.dayNumber)
          const nextIdx = (currentIdx + 1) % program.sessions.length
          const next = program.sessions[nextIdx]
          if (next) {
            setNextSessionInfo({
              dayLabel: next.dayLabel || `Day ${next.dayNumber}`,
              focusLabel: next.focusLabel || 'Strength Development',
              estimatedMinutes: next.estimatedMinutes,
            })
            console.log('[LIVE-WORKOUT-CORRIDOR] Next session info loaded dynamically')
          }
        } catch (e) {
          // Non-fatal: next session preview just won't show
          console.warn('[LIVE-WORKOUT-CORRIDOR] Failed to load next session info (non-fatal):', e)
        }
      })()
    }
  }, [safeStatus, nextSessionInfo, safeSession.dayNumber])
  
  // Auto-save on state changes - skip for demo sessions
  // [UNIFIED-HANDOFF] Now saves from liveSession - the single authoritative owner
  useEffect(() => {
    // Demo sessions don't persist to storage
    if (isDemoSession) return
    
    if (liveSession.status !== 'ready') {
      // Save the core workout state from the unified liveSession
      saveSessionToStorage({
        status: liveSession.status,
        currentExerciseIndex: liveSession.currentExerciseIndex,
        currentSetNumber: liveSession.currentSetNumber,
        completedSets: liveSession.completedSets,
        startTime: liveSession.startTime,
        elapsedSeconds: liveSession.elapsedSeconds,
        lastSetRPE: liveSession.lastSetRPE,
        workoutNotes: liveSession.workoutNotes,
        exerciseOverrides: liveSession.exerciseOverrides,
      }, sessionId, sessionStructureSignature)
    }
  }, [liveSession, sessionId, isDemoSession, sessionStructureSignature])
  
  // [UNIFIED-HANDOFF] REMOVED: Exercise-change reset effect
  // This was a secondary transition system that caused race conditions.
  // Input values are now set atomically within the reducer dispatch.
  // The unified liveSession state already contains correct input values
  // for each exercise immediately after transition.
  
  // [ATOMIC-HANDOFF] Write render_verified breadcrumb on successful active render
  // [ACTIVE-ENTRY-GUARD] Only run if active entry preparation succeeded
  useEffect(() => {
    if (safeStatus === 'active' && activeEntryPreparation.ok) {
      writeTransitionTrace({
        transitionStage: 'render_verified',
        lastSuccessfulRenderExerciseIndex: safeExerciseIndex,
        lastSuccessfulRenderExerciseName: safeCurrentExercise.name,
        safeIndexUsed: true,
      })
    }
  }, [safeStatus, safeExerciseIndex, safeCurrentExercise.name, activeEntryPreparation.ok])
  
  // Timer effect - [LIVE-WORKOUT-MACHINE] Driven by machine phase
  // Timer runs in active, resting, and between_exercise_rest phases
  useEffect(() => {
    const phase = machineState.phase
    const shouldTick = (phase === 'active' || phase === 'resting' || phase === 'between_exercise_rest') 
      && machineState.startTime !== null
    
    if (shouldTick) {
      timerRef.current = setInterval(() => {
        machineDispatch({ type: 'TICK_TIMER' })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [machineState.phase, machineState.startTime, machineDispatch])
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Start workout
  // [LIVE-WORKOUT-MACHINE] Validates active state requirements via machine validation
  const handleStart = useCallback(() => {
  console.log('[v0] [handleStart] Start Workout clicked', {
  machinePhase: machineState.phase,
  hasSessionContract: !!machineSessionContract,
  exerciseCount: machineSessionContract?.exercises?.length ?? 0,
  currentExerciseIndex: machineState.currentExerciseIndex,
  })
  
  // [LIVE-WORKOUT-MACHINE] Validate via machine before transitioning to active
  const validation = validateActiveEntry(machineState, machineSessionContract)
  if (!validation.isValid) {
  console.error('[WORKOUT-START] Machine validation failed:', validation.reason)
  recordBootError('active_state_entry', new Error(validation.reason || 'Machine validation failed'))
  machineDispatch({
  type: 'ENTER_INVALID',
  reason: validation.reason || 'Unable to start workout',
  stage: validation.stage || 'active_entry_validation'
  })
  return
  }
  
  markBootStage('active_state_entry', {
  sessionId: sessionId,
  exerciseCount: machineSessionContract?.exercises.length ?? 0,
  currentExerciseIndex: machineState.currentExerciseIndex,
  })
  
  setShowResumePrompt(false)
  dispatch({ type: 'START_WORKOUT_ACTIVE', startTime: Date.now() })
  }, [machineState, machineSessionContract, machineDispatch, sessionId])
  
  // Resume existing workout
  const handleResume = useCallback(() => {
    setShowResumePrompt(false)
    // State is already restored via HYDRATE_FROM_STORAGE, just activate
    dispatch({ type: 'RESUME_WORKOUT', startTime: Date.now() })
  }, [])
  
  // Start fresh workout (discard saved)
  const handleStartNew = useCallback(() => {
    clearSessionStorage()
    clearRestTimerState()
    clearSessionOverrides()
    setShowResumePrompt(false)
    setExistingSession(null)
    dispatch({ type: 'START_FRESH_WORKOUT', startTime: Date.now() })
  }, [])
  
  // [UNIFIED-HANDOFF] Complete set - ALL transitions go through single dispatch
  const handleCompleteSet = useCallback(() => {
    const currentIndex = safeExerciseIndex
    
    console.log('[UNIFIED-HANDOFF] handleCompleteSet triggered', {
      exerciseIndex: currentIndex,
      setNumber: liveSession.currentSetNumber,
      exerciseName: safeCurrentExercise.name,
      totalSets: safeCurrentExercise.sets,
      totalExercises: exercises.length,
    })
    
    // Build completed set data
    const setData: CompletedSetData = {
      exerciseIndex: currentIndex,
      setNumber: liveSession.currentSetNumber,
      actualReps: isHoldExercise ? 0 : liveSession.repsValue,
      holdSeconds: isHoldExercise ? liveSession.holdValue : undefined,
      actualRPE: liveSession.selectedRPE || 8,
      bandUsed: liveSession.bandUsed,
      timestamp: Date.now(),
    }
    
    const newCompletedSets = [...liveSession.completedSets, setData]
    const totalExerciseSets = safeCurrentExercise.sets
    const isLastSet = liveSession.currentSetNumber >= totalExerciseSets
    const isLastExercise = currentIndex >= exercises.length - 1
    
    // Evaluate adaptive performance (optional - doesn't affect transition)
    if (safeCurrentExercise.executionTruth) {
      // [ACTIVE-ENTRY-GUARD] Use guarded target value with fallback
      const targetValue = activeEntryPreparation.ok ? activeEntryPreparation.targetValue : 8
      const setsForThisExercise = newCompletedSets.filter(s => s.exerciseIndex === currentIndex)
      
      const performanceData: SetPerformanceData = {
        setNumber: liveSession.currentSetNumber,
        targetReps: isHoldExercise ? 0 : targetValue,
        actualReps: isHoldExercise ? 0 : liveSession.repsValue,
        targetHoldSeconds: isHoldExercise ? targetValue : undefined,
        actualHoldSeconds: isHoldExercise ? liveSession.holdValue : undefined,
        targetRPE: 8,
        actualRPE: liveSession.selectedRPE || 8,
        bandUsed: liveSession.bandUsed,
      }
      
      const recommendation = evaluateSetPerformance(performanceData, {
        completedSets: setsForThisExercise.map(s => ({
          setNumber: s.setNumber,
          targetReps: targetValue,
          actualReps: s.actualReps,
          targetHoldSeconds: isHoldExercise ? targetValue : undefined,
          actualHoldSeconds: s.holdSeconds,
          targetRPE: 8,
          actualRPE: s.actualRPE,
          bandUsed: s.bandUsed,
        })),
        exerciseIndex: currentIndex,
        executionTruth: safeCurrentExercise.executionTruth,
        isHoldExercise,
        exerciseName: safeCurrentExercise.name,
      })
      
      if (shouldShowRecommendation(recommendation) && !isLastSet && !isLastExercise) {
        setAdaptiveRecommendation(recommendation)
        setShowAdaptiveModal(true)
      }
    }
    
    // ==========================================================================
    // [UNIFIED-HANDOFF] ALL TRANSITIONS GO THROUGH SINGLE DISPATCH
    // ==========================================================================
    
    if (isLastSet && isLastExercise) {
      // WORKOUT COMPLETE
      writeTransitionTrace({
        reason: 'complete_set',
        transitionStage: 'requested',
        transitionType: 'workout_complete',
        timestamp: Date.now(),
        safeIndexUsed: true,
      })
      
      dispatch({
        type: 'COMPLETE_WORKOUT',
        newCompletedSets,
        lastRPE: liveSession.selectedRPE || 8,
      })
      
      writeTransitionTrace({ transitionStage: 'committed' })
      clearRestTimerState()
      clearSessionStorage()
      
    } else if (isLastSet) {
      // ADVANCE TO NEXT EXERCISE (with or without inter-exercise rest)
      writeTransitionTrace({
        reason: 'complete_set',
        transitionStage: 'requested',
        timestamp: Date.now(),
        safeIndexUsed: true,
      })
      
      // Check for inter-exercise rest
      const interRestSeconds = exerciseRuntimeTruth.restSecondsInterExercise
      const shouldShowInterRest = sessionRuntimeTruth.supportsBetweenExerciseRest && 
        exerciseRuntimeTruth.category !== 'warmup' && 
        exerciseRuntimeTruth.category !== 'mobility' &&
        interRestSeconds >= 30
      
      if (shouldShowInterRest) {
        // Show inter-exercise rest - keep on current exercise
        dispatch({
          type: 'SHOW_INTER_EXERCISE_REST',
          seconds: interRestSeconds,
          newCompletedSets,
          lastRPE: liveSession.selectedRPE || 8,
        })
        writeTransitionTrace({ 
          transitionStage: 'committed',
          transitionType: 'inter_exercise_rest_wait',
        })
      } else {
        // Immediate advance to next exercise
        const { snapshot, guardError } = buildUnifiedTransitionSnapshot(
          { ...liveSession, completedSets: newCompletedSets },
          exercises,
          newCompletedSets,
          currentIndex
        )
        
        writeTransitionTrace({
          transitionStage: 'computed',
          fromExerciseIndex: currentIndex,
          toExerciseIndex: snapshot.nextExerciseIndex,
          transitionType: 'next_exercise',
          guardFallbackReason: guardError,
        })
        
        if (guardError) {
          dispatch({ type: 'SET_TRANSITION_ERROR', error: { type: 'next_exercise_invalid', message: guardError } })
        } else {
          dispatch({ type: 'ADVANCE_TO_NEXT_EXERCISE', snapshot })
        }
        
        writeTransitionTrace({ transitionStage: 'committed' })
        clearRestTimerState()
      }
      
    } else {
      // SAME EXERCISE, NEXT SET - single dispatch
      const nextSetNumber = liveSession.currentSetNumber + 1
      // [ACTIVE-ENTRY-GUARD] Use guarded target value with fallback
      const targetValue = activeEntryPreparation.ok ? activeEntryPreparation.targetValue : 8
      
      // Guard against invalid increment
      if (nextSetNumber > totalExerciseSets) {
        console.warn('[UNIFIED-HANDOFF] blocked invalid set increment')
        executeUnifiedAdvance('complete_set')
        return
      }
      
      // ONE dispatch for same-exercise next set
      dispatch({
        type: 'COMPLETE_SET_SAME_EXERCISE',
        newCompletedSets,
        nextSetNumber,
        targetValue,
      })
    }
  }, [liveSession, safeCurrentExercise, safeExerciseIndex, isHoldExercise, exercises, exerciseRuntimeTruth, sessionRuntimeTruth, activeEntryPreparation, executeUnifiedAdvance])
  
  // Rest complete / skip rest (between sets of SAME exercise)
  const handleRestComplete = useCallback(() => {
    console.log('[UNIFIED-HANDOFF] handleRestComplete triggered (same exercise, next set)')
    clearRestTimerState()
    playTimerCompletionAlert()
    dispatch({ type: 'SET_STATUS', status: 'active' })
  }, [])
  
  // [UNIFIED-HANDOFF] Handle inter-exercise rest completion
  const handleInterExerciseRestComplete = useCallback(() => {
    console.log('[UNIFIED-HANDOFF] handleInterExerciseRestComplete triggered')
    playTimerCompletionAlert()
    executeUnifiedAdvance('inter_exercise_complete')
  }, [executeUnifiedAdvance])
  
  // [UNIFIED-HANDOFF] Skip inter-exercise rest
  const handleSkipInterExerciseRest = useCallback(() => {
    console.log('[UNIFIED-HANDOFF] handleSkipInterExerciseRest triggered')
    executeUnifiedAdvance('skip_inter_exercise')
  }, [executeUnifiedAdvance])
  
  // [EXECUTION-TRUTH-FIX] Back navigation - review previous exercise
  // [LIVE-WORKOUT-MACHINE] Use safeExerciseIndex from machine
  const handleReviewPreviousExercise = useCallback(() => {
    if (safeExerciseIndex <= 0) return
    const prevIndex = safeExerciseIndex - 1
    setReviewingExerciseIndex(prevIndex)
    setIsReviewingPreviousExercise(true)
  }, [safeExerciseIndex])
  
  // [EXECUTION-TRUTH-FIX] Close review and return to current exercise
  const handleCloseReview = useCallback(() => {
    setIsReviewingPreviousExercise(false)
    setReviewingExerciseIndex(null)
  }, [])
  
  // [EXECUTION-TRUTH-FIX] Get completed sets for a specific exercise
  // [LIVE-WORKOUT-MACHINE] Use normalizedCompletedSets from machine
  const getCompletedSetsForExercise = useCallback((exerciseIndex: number) => {
    return normalizedCompletedSets.filter(s => s.exerciseIndex === exerciseIndex)
  }, [normalizedCompletedSets])
  
  // [EXECUTION-TRUTH-FIX] Notes capture handlers
  const handleOpenNotesModal = useCallback(() => {
    // Load existing notes for current exercise
    const existingNote = sessionNotes.exerciseNotes[safeExerciseIndex]
    if (existingNote) {
      setCurrentNoteFlags(existingNote.flags)
      setCurrentNoteText(existingNote.freeText)
    } else {
      setCurrentNoteFlags([])
      setCurrentNoteText('')
    }
    setShowNotesModal(true)
  }, [sessionNotes.exerciseNotes, safeExerciseIndex])
  
  const handleSaveNote = useCallback(() => {
    setSessionNotes(prev => updateExerciseNote(prev, safeExerciseIndex, currentNoteFlags, currentNoteText))
    setShowNotesModal(false)
  }, [safeExerciseIndex, currentNoteFlags, currentNoteText])
  
  const handleToggleNoteFlag = useCallback((flag: ExerciseContextFlag['type']) => {
    setCurrentNoteFlags(prev => 
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    )
  }, [])
  
  // [UNIFIED-HANDOFF] Skip exercise - uses unified advancement
  const handleSkipExercise = useCallback(() => {
    console.log('[UNIFIED-HANDOFF] handleSkipExercise triggered')
    executeUnifiedAdvance('skip_exercise')
  }, [executeUnifiedAdvance])
  
  // ==========================================================================
  // EXERCISE OVERRIDE HANDLERS
  // ==========================================================================
  
  // Handle exercise replacement
  // [LIVE-WORKOUT-MACHINE] Use safeExerciseIndex from machine
  const handleReplaceExercise = useCallback((newExercise: { id: string; name: string }) => {
    if (exercises.length === 0) return
    const originalExercise = exercises[safeExerciseIndex]
    
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
    
    // Update local state via dispatch
    dispatch({
      type: 'ADD_EXERCISE_OVERRIDE',
      index: safeExerciseIndex,
      override: {
        originalName: originalExercise.name,
        currentName: newExercise.name,
        isSkipped: false,
        isReplaced: true,
        isProgressionAdjusted: false,
      },
    })
  }, [sessionId, safeExerciseIndex, exercises])
  
  // Handle exercise skip via menu (different from skip button)
  // [LIVE-WORKOUT-MACHINE] Use safeExerciseIndex from machine
  const handleMenuSkipExercise = useCallback(() => {
    if (exercises.length === 0) {
      handleSkipExercise()
      return
    }
    const originalExercise = exercises[safeExerciseIndex]
    
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
    
    // Mark as skipped via dispatch
    dispatch({
      type: 'MARK_EXERCISE_SKIPPED',
      index: safeExerciseIndex,
      override: {
        originalName: originalExercise.name,
        currentName: originalExercise.name,
        isSkipped: true,
        isReplaced: false,
        isProgressionAdjusted: false,
      },
    })
    
    // Then advance to next exercise
    handleSkipExercise()
  }, [sessionId, safeExerciseIndex, exercises, handleSkipExercise])
  
  // Handle progression adjustment
  // [LIVE-WORKOUT-MACHINE] Use safeExerciseIndex from machine
  const handleProgressionChange = useCallback((newProgression: { id: string; name: string }) => {
    if (exercises.length === 0) return
    const originalExercise = exercises[safeExerciseIndex]
    
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
    
    // Update local state via dispatch
    dispatch({
      type: 'ADJUST_PROGRESSION',
      index: safeExerciseIndex,
      override: {
        originalName: originalExercise.name,
        currentName: newProgression.name,
        isSkipped: false,
        isReplaced: false,
        isProgressionAdjusted: true,
      },
    })
  }, [sessionId, safeExerciseIndex, exercises])
  
  // Handle undo override
  // [LIVE-WORKOUT-MACHINE] Use safeExerciseIndex from machine
  const handleUndoOverride = useCallback(() => {
    dispatch({ type: 'UNDO_OVERRIDE', index: safeExerciseIndex })
  }, [safeExerciseIndex])
  
  // Get effective exercise (with override applied)
  // [LIVE-WORKOUT-MACHINE] Use normalizedExerciseOverrides from machine
  const getEffectiveExercise = useCallback((index: number) => {
    // Safety: validate index is within bounds
    if (index < 0 || index >= exercises.length) return null
    
    const baseExercise = exercises[index]
    if (!baseExercise) return null
    
    const override = normalizedExerciseOverrides[index]
    
    if (!override) return baseExercise
    
    return {
      ...baseExercise,
      name: override.currentName,
      originalName: override.originalName,
      isReplaced: override.isReplaced,
      isSkipped: override.isSkipped,
      isProgressionAdjusted: override.isProgressionAdjusted,
    }
  }, [exercises, normalizedExerciseOverrides])
  
  // Get current effective exercise (with fallback to safe exercise)
  // [ATOMIC-HANDOFF] Use safeExerciseIndex for all render-time lookups
  const effectiveExercise = getEffectiveExercise(safeExerciseIndex) || safeCurrentExercise
  
  // Finish workout (moves to completed state for logging)
  const handleFinish = useCallback(() => {
    dispatch({ type: 'FINISH_WORKOUT' })
    clearSessionStorage()
    clearRestTimerState()
  }, [])
  
  // Request exit confirmation (only if there's progress)
  // [LIVE-WORKOUT-MACHINE] Use safeStatus from machine
  const handleRequestExit = useCallback(() => {
    if (safeStatus === 'ready' || normalizedCompletedSets.length === 0) {
      // No progress yet - just clean up and exit
      clearSessionStorage()
      clearRestTimerState()
      clearSessionOverrides()
      onCancel()
    } else {
      // Has progress - show confirmation
      setShowExitConfirm(true)
    }
  }, [safeStatus, normalizedCompletedSets.length, onCancel])
  
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
      // [LIVE-WORKOUT-MACHINE] Use normalizedCompletedSets from machine
      exercises.forEach((exercise, exerciseIndex) => {
        const exerciseSets = normalizedCompletedSets.filter(s => s.exerciseIndex === exerciseIndex)
        if (exerciseSets.length === 0) return
        
        const bestReps = Math.max(...exerciseSets.map(s => s.actualReps))
        const bestHold = Math.max(...exerciseSets.map(s => s.holdSeconds || 0))
        
        // [LIVE-WORKOUT-CRASH-FIX] Use safeLower to prevent undefined.toLowerCase() crash
        const nameLower = safeLower(exercise.name)
        
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
      // [LIVE-WORKOUT-CRASH-FIX] Use safeLower for session type detection
      const sessionType: SessionType = safeLower(safeSession.dayLabel).includes('skill') 
        ? 'skill' 
        : safeLower(safeSession.dayLabel).includes('strength')
          ? 'strength'
          : 'mixed'
      
      // [LIVE-WORKOUT-CRASH-FIX] Use safeLower to prevent undefined.toLowerCase() crash
      const focusArea: FocusArea = exercises.some(e => safeLower(e.name).includes('planche'))
        ? 'planche'
        : exercises.some(e => safeLower(e.name).includes('front lever'))
          ? 'front_lever'
          : exercises.some(e => safeLower(e.name).includes('muscle'))
            ? 'muscle_up'
            : exercises.some(e => safeLower(e.name).includes('hspu') || safeLower(e.name).includes('handstand push'))
              ? 'handstand_pushup'
              : exercises.some(e => safeLower(e.name).includes('weighted'))
                ? 'weighted_strength'
                : 'general'
      
      // Build exercise-level outcomes for progression engine
      // [LIVE-WORKOUT-MACHINE] Use normalizedCompletedSets from machine
      const exerciseOutcomes = exercises.map((exercise, exerciseIndex) => {
        const exerciseSets = normalizedCompletedSets.filter(s => s.exerciseIndex === exerciseIndex)
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
    // [LIVE-WORKOUT-MACHINE] Use safe values from machine
    const durationMinutes = Math.max(1, Math.round(safeElapsedSeconds / 60))
    quickLogWorkout({
      sessionName: safeSession.dayLabel,
      sessionType,
      focusArea,
      durationMinutes,
        perceivedDifficulty: finalDifficulty,
        generatedWorkoutId: sessionId,
        keyPerformance,
        notes: safeWorkoutNotes || undefined,
        // [EXECUTION-TRUTH-FIX] Include exercise-level notes and flags
        exerciseNotes: Object.entries(sessionNotes.exerciseNotes).map(([idx, note]) => ({
          exerciseIndex: parseInt(idx),
          exerciseName: exercises[parseInt(idx)]?.name || 'Unknown',
          flags: note.flags,
          freeText: note.freeText,
        })),
        // FEEDBACK LOOP: Exercise-level outcomes for progression engine
        exercises: exerciseOutcomes,
        // FEEDBACK LOOP: Mark demo sessions to exclude from adaptive logic
        isDemo: isDemoSession || isDemo,
        completionStatus,
        sourceRoute: isFirstSession ? 'first_session' : 'workout_session',
      })
      
      // [LIVE-WORKOUT-CORRIDOR-FIX] Evaluate achievements and challenges with DYNAMIC import
      // These engines have heavy cascading imports - loading them eagerly can crash module evaluation
      // Using dynamic import ensures the workout route doesn't die if these modules fail
      try {
        const [{ evaluateAchievements }, { evaluateAllChallenges }] = await Promise.all([
          import('@/lib/achievements/achievement-engine'),
          import('@/lib/challenges/challenge-engine'),
        ])
        evaluateAchievements()
        evaluateAllChallenges()
        console.log('[LIVE-WORKOUT-CORRIDOR] Challenge/achievement evaluation completed')
      } catch (e) {
        // Non-fatal: workout was still logged, achievements/challenges just won't update
        console.error('[LIVE-WORKOUT-CORRIDOR] Failed to evaluate achievements/challenges (non-fatal):', e)
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
  }, [session, liveSession, sessionId, perceivedDifficulty])
  
  // [LIVE-WORKOUT-CORRIDOR] Rest recommendation - uses safeCurrentExercise for crash safety
  // [LIVE-WORKOUT-MACHINE] Use normalized values from machine
  const getRestRecommendationForCurrentExercise = useCallback((): RestRecommendation => {
    const avgRPE = normalizedCompletedSets.length > 0
      ? normalizedCompletedSets.reduce((sum, s) => sum + s.actualRPE, 0) / normalizedCompletedSets.length
      : null
    
    return getRestRecommendation(
      safeCurrentExercise,
      safeLastSetRPE || undefined,
      {
        setNumber: validatedSetNumber,
        totalSetsCompleted: normalizedCompletedSets.length,
        averageRPE: avgRPE,
      }
    )
  }, [safeCurrentExercise, safeLastSetRPE, validatedSetNumber, normalizedCompletedSets])
  
  // Legacy getRestTime for any other usage
  const getRestTime = (): number => {
    return getRestRecommendationForCurrentExercise().adjustedSeconds
  }
  
  // Calculate session stats for performance score
  // [LIVE-WORKOUT-MACHINE] Use normalized values from machine
  const getSessionStats = () => {
    const totalSetsCompleted = normalizedCompletedSets.length
    const avgRPE = totalSetsCompleted > 0 
      ? normalizedCompletedSets.reduce((sum, s) => sum + s.actualRPE, 0) / totalSetsCompleted 
      : null
    
    return {
      totalSets: totalSets,
      completedSets: totalSetsCompleted,
      totalExercises: totalExercises,
      completedExercises: safeExerciseIndex + (safeStatus === 'completed' ? 1 : 0),
      averageRPE: avgRPE,
      estimatedVolume: totalSetsCompleted * 10, // simplified
      elapsedSeconds: safeElapsedSeconds,
    }
  }
  
  // ==========================================================================
  // [PHASE LW3] RENDER ENTRY - Boot ledger calls moved to effects (render-pure)
  // ==========================================================================
  
  useEffect(() => {
    if (!bootHydrationReady) return
    // [PHASE LW2] Mark live_workout_ready - render completed successfully
    // [PHASE LW2] Mark active state render complete if in active state
    // [LIVE-WORKOUT-MACHINE] Use safe values from machine
    // [ACTIVE-ENTRY-GUARD] Only mark active render complete if entry succeeded
    if (safeStatus === 'active' && activeEntryPreparation.ok) {
      markBootStage('active_state_render_complete', {
        sessionId,
        currentExerciseIndex: safeExerciseIndex,
        currentSetNumber: validatedSetNumber,
      })
    }
    
    markBootStage('live_workout_ready', {
      sessionId,
      dayLabel: safeWorkoutSessionContract.dayLabel,
      exerciseCount: exercises.length,
      currentExerciseIndex: safeExerciseIndex,
      firstExerciseName: safeCurrentExercise.name,
      coreBootComplete: true,
      optionalBlocksMounted: true, // Optional blocks have mounted if we got here
    })
    
    // STAGE: render_contract_verified (effect runs after successful render)
    logStage('render_contract_verified', {
      hasValidExercises,
      safeExerciseIndex,
      exerciseName: safeCurrentExercise.name,
      exerciseSets: safeCurrentExercise.sets,
      status: safeStatus,
      currentSetNumber: validatedSetNumber,
      sessionId,
    })
  }, [hasValidExercises, safeExerciseIndex, safeCurrentExercise, safeStatus, validatedSetNumber, sessionId, logStage, safeWorkoutSessionContract.dayLabel, exercises.length])
  
  // [LIVE-WORKOUT-MACHINE] Runtime validation proof diagnostic
  // [PHASE LW2-FIX] CRITICAL: This useEffect MUST be declared BEFORE any early returns
  // to comply with React's rules of hooks (same hook count/order on every render)
  useEffect(() => {
    // [LIVE-WORKOUT-MACHINE] Log machine-owned validation state
    console.log('[LIVE-WORKOUT-MACHINE] Runtime state:', {
      componentVersion: STREAMLINED_WORKOUT_VERSION,
      sessionId,
      machinePhase: machineState.phase,
      hasValidExercises,
      exerciseCount: exercises.length,
    })
    
    // Additional proof log if valid
    if (machineState.phase !== 'invalid' && hasValidExercises) {
      console.log('[LIVE-WORKOUT-MACHINE] Active workout runtime verified:', {
        exerciseCount: exercises.length,
        currentExerciseIndex: safeExerciseIndex,
        currentSetNumber: validatedSetNumber,
        safeCurrentExerciseName: safeCurrentExercise.name,
        sessionRuntimeTruthBuilt: !!sessionRuntimeTruth,
        exerciseRuntimeTruthBuilt: !!exerciseRuntimeTruth,
        isDemoSession,
        normalizedCompletedSets: normalizedCompletedSets.length,
        normalizedOverrides: Object.keys(normalizedExerciseOverrides).length,
      })
    }
  }, [sessionId, machineState.phase, exercises.length, safeExerciseIndex, validatedSetNumber, safeCurrentExercise.name, sessionRuntimeTruth, exerciseRuntimeTruth, isDemoSession, hasValidExercises, normalizedCompletedSets.length, normalizedExerciseOverrides])
  
  // ==========================================================================
  // [PHASE LW3] HYDRATION GATE - Wait for hydration before showing UI
  // This prevents half-hydrated first render from racing restore logic
  // ==========================================================================
  
  if (!bootHydrationReady) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Dumbbell className="w-6 h-6 text-[#C1121F]" />
          </div>
          <p className="text-[#A4ACB8]">Preparing workout...</p>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: SAFETY FALLBACK - Invalid Session (Route should have caught this)
  // [PHASE LW3] recordBootError moved to useEffect - render is pure
  // ==========================================================================
  
  // ==========================================================================
  // [ACTIVE-CORRIDOR-CONTAINMENT] COMPONENT-LEVEL ERROR FALLBACK
  // If any error was caught during render/derivation, show local fallback
  // ==========================================================================
  if (componentError) {
    console.error('[v0] [component_error_fallback]', {
      errorMessage: componentError.message,
      errorStack: componentError.stack?.split('\n').slice(0, 5).join('\n'),
    })
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Session Error</h2>
          <p className="text-[#A4ACB8] mb-4 text-sm">
            An error occurred in the workout session. Your progress may be saved.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-[#1A1F26] rounded-lg p-3 mb-4 text-xs font-mono overflow-auto max-h-32">
              <p className="text-[#6B7280] mb-1">Error:</p>
              <p className="text-[#A4ACB8]">{componentError.message}</p>
            </div>
          )}
          <div className="space-y-2">
            <Button
              onClick={() => {
                setComponentError(null)
                machineDispatch({ type: 'RESET' })
              }}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  if (!sessionIsValid) {
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

  // ==========================================================================
  // RENDER: CONTROLLED LOCAL FALLBACK - Validation, Boot Prep, OR Active Entry Failed
  // [LIVE-WORKOUT-MACHINE] This catches invalid runtime state, boot prep failures,
  // AND active entry failures BEFORE crashing the route boundary.
  // ==========================================================================
  
  // Check for active entry failure only when transitioning to active state
  // ==========================================================================
  // [LIVE-WORKOUT-MACHINE] LOCAL FALLBACK - MACHINE IS ONLY AUTHORITY
  // The machine invalid phase is the ONLY trigger for local fallback.
  // Old pre-machine validation/boot/active-entry checks are REMOVED.
  // ==========================================================================
  const shouldShowLocalFallback = bootHydrationReady && machineState.phase === 'invalid'
  const fallbackReason = machineState.invalidReason || 'Unable to prepare workout session'
  const fallbackStage = machineState.invalidStage || 'machine_invalid'
  
if (shouldShowLocalFallback) {
  // [LIVE-WORKOUT-MACHINE] Log machine-owned fallback diagnostics
  if (process.env.NODE_ENV === 'development') {
  console.warn('[v0] [machine_local_fallback_rendered]', {
  machinePhase: machineState.phase,
  machineInvalidReason: machineState.invalidReason,
  machineInvalidStage: machineState.invalidStage,
  sessionId: machineState.sessionId,
  currentExerciseIndex: machineState.currentExerciseIndex,
  })
  }
    
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-[#2B313A] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Workout Setup Issue</h2>
          <p className="text-[#A4ACB8] mb-4">
            {fallbackReason || 'Unable to prepare workout session.'}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-[#1A1F26] rounded-lg p-3 mb-4 text-xs font-mono">
              <p className="text-[#6B7280] mb-1">Machine Diagnostics:</p>
              <p className="text-[#A4ACB8]">Stage: {fallbackStage || 'unknown'}</p>
              <p className="text-[#A4ACB8]">Machine Phase: {machineState.phase}</p>
              <p className="text-[#A4ACB8]">Exercise Count: {exercises.length}</p>
              <p className="text-[#A4ACB8]">Current Index: {machineState.currentExerciseIndex}</p>
              <p className="text-[#A4ACB8]">Has Valid Exercises: {String(hasValidExercises)}</p>
              <p className="text-[#A4ACB8]">Session ID: {sessionId}</p>
            </div>
          )}
          <div className="space-y-3">
            <Button 
              onClick={() => dispatch({ type: 'START_FRESH_WORKOUT', startTime: Date.now() })}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              Start Fresh
            </Button>
            <Button 
              onClick={onCancel}
              variant="outline"
              className="w-full border-[#2B313A] text-[#E6E9EF]"
            >
              Go Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: SAFETY FALLBACK - No Valid Exercises (Controlled Route-Level Failure)
  // [PHASE LW3] logStage removed - render is pure
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
  
  if (showResumePrompt && existingSession && normalizedCompletedSets.length > 0) {
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
  // [PHASE LW3] Boot stage calls moved to effects - render is pure
  // ==========================================================================
  
  // [LIVE-WORKOUT-MACHINE] Use safeStatus from machine
  if (safeStatus === 'ready') {
    
    console.log('[ready-state-entry]', {
      componentVersion: STREAMLINED_WORKOUT_VERSION,
      hasReasoningSummary: !!reasoningSummary,
      willRenderWhyThisWorkout: !!reasoningSummary && !isDemo,
      dayLabel: safeSession.dayLabel,
      exerciseCount: exercises.length,
    })
    return (
      <div className="min-h-screen bg-[#0F1115] p-4 sm:p-5">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Compact Header */}
          <div className="text-center pt-6 pb-2">
            <div className="w-14 h-14 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/30 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-7 h-7 text-[#C1121F]" />
            </div>
            <h1 className="text-xl font-bold text-[#E6E9EF] mb-1">
              {safeDisplayLabel}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-[#A4ACB8]">
              <span>{exercises.length} exercises</span>
              <span className="text-[#6B7280]">·</span>
              <span>{totalSets} sets</span>
                {safeSession.estimatedMinutes && (
                  <>
                    <span className="text-[#6B7280]">·</span>
                    <span className="text-[#6B7280]">~{safeSession.estimatedMinutes}min</span>
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
                  focus={(reasoningSummary as { workoutFocus?: string }).workoutFocus || 'Adaptive'} 
                  sessionType={(reasoningSummary as { sessionType?: string }).sessionType || 'mixed'}
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
          {/* [LIVE-SESSION-FIX] Wrapped in SafeOptionalSubtree to prevent crashes from optional enhancement */}
          {reasoningSummary && !isDemo && (
            <SafeOptionalSubtree label="WhyThisWorkout">
              <WhyThisWorkout
                reasoning={reasoningSummary}
                defaultCollapsed={true}
                variant="card"
              />
            </SafeOptionalSubtree>
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
  
  // [LIVE-WORKOUT-MACHINE] Use safeStatus from machine
  if (safeStatus === 'completed') {
    const stats = getSessionStats()
    let readiness: ReturnType<typeof getDailyReadiness> | null = null
    try {
      readiness = getDailyReadiness()
    } catch {
      // Readiness may not be available
    }
    // [LIVE-WORKOUT-MACHINE] Use normalizedCompletedSets from machine
    const performanceInput = createPerformanceInputFromStats(
      {
        completedSets: stats.completedSets,
        totalSets: stats.totalSets,
        elapsedSeconds: stats.elapsedSeconds,
        averageRPE: stats.averageRPE || undefined,
      },
      normalizedCompletedSets
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
    // [LIVE-SESSION-LOCK] Safe skill exercise detection with full null guards
    const skillExercises = exercises.filter(ex => 
      ex && ex.name && (
        safeLower(ex.name).includes('front lever') ||
        safeLower(ex.name).includes('planche') ||
        safeLower(ex.name).includes('muscle-up') ||
        safeLower(ex.name).includes('handstand')
      )
    )
    let skillSignal: string | null = null
    if (skillExercises.length > 0 && performance.performanceTier !== 'low') {
      // [LIVE-SESSION-LOCK] Safe split with fallback
      const firstSkillName = skillExercises[0]?.name || ''
      const skillName = firstSkillName.includes(' ') ? firstSkillName.split(' ')[0] : firstSkillName
      if (skillName && (performance.performanceTier === 'excellent' || performance.performanceTier === 'strong')) {
        skillSignal = `${skillName} stability improving.`
      } else if (skillName) {
        skillSignal = `${skillName} work logged. Consistency building.`
      }
    }
    
    // Generate band progression note if bands were used
    // [LIVE-SESSION-LOCK] Safe band label generation with null guards
    // [LIVE-WORKOUT-MACHINE] Use normalizedCompletedSets from machine
    const bandsUsed = normalizedCompletedSets
      .filter(s => s.bandUsed && s.bandUsed !== 'none')
      .map(s => s.bandUsed)
    let bandProgressNote: string | null = null
    if (bandsUsed.length > 0) {
      const uniqueBands = [...new Set(bandsUsed)]
      const primaryBand = uniqueBands[0]
      // [LIVE-SESSION-LOCK] Safe charAt with length check
      if (primaryBand && primaryBand.length > 0) {
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
                value={safeWorkoutNotes}
                onChange={(e) => dispatch({ type: 'SET_WORKOUT_NOTES', notes: e.target.value })}
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
                elapsedSeconds: safeElapsedSeconds,
                averageRPE: stats.averageRPE || undefined,
              }}
              sessionName={safeSession.dayLabel}
              onReturnToDashboard={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              onViewProgram={() => handleSaveWorkout(perceivedDifficulty || 'normal')}
              bandProgressNote={bandProgressNote}
              skillSignal={skillSignal}
              overrideSummary={getOverrideSummary(sessionId)}
              goalContext={safeSession.focusLabel ? `This ${safeLower(safeSession.focusLabel)} session builds toward your primary goal. Consistent training accelerates progress.` : "Workout completed. Consistent training builds skill faster."}
              nextSession={nextSessionInfo}
            />
          </div>
    </div>
  )
}

// =============================================================================
// [EXECUTION-TRUTH-FIX] INTER-EXERCISE REST COUNTDOWN COMPONENT
// =============================================================================

function InterExerciseRestCountdown({ 
  initialSeconds, 
  onComplete 
}: { 
  initialSeconds: number
  onComplete: () => void 
}) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
  const [isComplete, setIsComplete] = useState(false)
  
  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsComplete(true)
      onComplete()
      return
    }
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsComplete(true)
          // Call onComplete on next tick to avoid state update during render
          setTimeout(onComplete, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [initialSeconds]) // Only depend on initialSeconds, not onComplete
  
  const progress = ((initialSeconds - timeRemaining) / initialSeconds) * 100
  
  return (
    <div className="text-center">
      {/* Circular progress indicator */}
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="#2B313A"
            strokeWidth="6"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke={isComplete ? '#22c55e' : '#4F6D8A'}
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold tabular-nums ${
            isComplete ? 'text-green-500' : 'text-[#E6E9EF]'
          }`}>
            {isComplete ? '✓' : `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>
      
      {isComplete && (
        <p className="text-sm text-green-500 font-medium">Ready!</p>
      )}
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
                  <p className="text-xl font-bold text-[#E6E9EF]">{Math.max(1, Math.round(safeElapsedSeconds / 60))}</p>
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
  // RENDER: BETWEEN-EXERCISE REST STATE (machine phase)
  // ==========================================================================
  
  if (machineState.phase === 'between_exercise_rest') {
    // Derive next exercise info from machine view model
    const betweenRestVM = viewModel.phase === 'between_exercise_rest' ? viewModel : null
    const nextExName = betweenRestVM?.nextExerciseName ?? 'Next Exercise'
    const nextExCategory = betweenRestVM?.nextExerciseCategory ?? 'general'
    
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col">
        {/* Sticky Session Header */}
        <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
          <div className="px-4 py-2.5">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-[#E6E9EF] truncate max-w-[160px]">
                    {safeDisplayLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280]">{completedSetsCount}/{totalSets}</span>
                  <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">
                    {formatDuration(safeElapsedSeconds)}
                  </span>
                </div>
              </div>
              <div className="h-1 bg-[#2B313A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(completedSetsCount / totalSets) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Between Exercise Rest Content */}
        <div className="flex-1 px-4 py-6 sm:p-8">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Exercise Completed Message */}
            <Card className="bg-green-500/10 border-green-500/30 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-lg font-bold text-[#E6E9EF]">Exercise Complete!</p>
                  <p className="text-sm text-[#A4ACB8]">{safeCurrentExercise.name} finished</p>
                </div>
              </div>
            </Card>
            
            {/* Next Exercise Preview */}
            <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Up Next</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/30 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-[#C1121F]" />
                </div>
                <div>
                  <p className="font-semibold text-[#E6E9EF]">{nextExName}</p>
                  <p className="text-xs text-[#6B7280] capitalize">{nextExCategory}</p>
                </div>
              </div>
            </Card>
            
            {/* Rest Timer */}
            <div className="text-center py-4">
              <p className="text-sm text-[#6B7280] mb-2">Rest Time</p>
              <p className="text-4xl font-mono font-bold text-[#E6E9EF]">
                {Math.floor(machineState.interExerciseRestSeconds / 60)}:{String(machineState.interExerciseRestSeconds % 60).padStart(2, '0')}
              </p>
            </div>
            
            {/* Primary Action */}
            <Button
              onClick={() => {
                const nextIndex = machineState.currentExerciseIndex + 1
                const nextEx = machineSessionContract?.exercises[nextIndex]
                const nextTarget = nextEx?.repsOrTime?.match(/(\d+)/)?.[1]
                machineDispatch({
                  type: 'ADVANCE_TO_NEXT_EXERCISE',
                  nextIndex,
                  targetValue: nextTarget ? parseInt(nextTarget, 10) : 8,
                })
              }}
              className="w-full h-16 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-lg font-bold"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              Start Next Exercise
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: RESTING STATE (between sets of same exercise)
  // ==========================================================================
  
  // [LIVE-WORKOUT-MACHINE] Use safeStatus from machine
  if (safeStatus === 'resting') {
    const restRecommendation = getRestRecommendationForCurrentExercise()
    const savedRestState = loadRestTimerState()
    
    // [LIVE-WORKOUT-CORRIDOR] Use safeCurrentExercise for guaranteed-safe rendering
    // [LIVE-WORKOUT-MACHINE] Use validatedSetNumber from machine
    const nextSetInfo = {
      exerciseName: safeCurrentExercise.name,
      setNumber: Math.min(validatedSetNumber, safeCurrentExercise.sets),
      isNewExercise: false,
    }
    
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
                    {safeDisplayLabel}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    {safeExerciseIndex + 1}/{totalExercises}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280]">{completedSetsCount}/{totalSets}</span>
                  <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">
                    {formatDuration(safeElapsedSeconds)}
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
          {/* [LIVE-WORKOUT-MACHINE] Use safeLastSetRPE from machine */}
          {safeLastSetRPE && (
            <Card className="bg-[#0F1115]/50 border-[#2B313A]/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Last set RPE</span>
                <Badge className={`${
                  safeLastSetRPE >= 9 
                    ? 'bg-orange-500/10 text-orange-400 border-0' 
                    : safeLastSetRPE >= 8
                      ? 'bg-blue-500/10 text-blue-400 border-0'
                      : 'bg-green-500/10 text-green-400 border-0'
                }`}>
                  RPE {safeLastSetRPE}
                </Badge>
              </div>
            </Card>
          )}
          
          {/* Inline Rest Timer */}
          {/* [LIVE-WORKOUT-MACHINE] Use validatedSetNumber from machine */}
          <InlineRestTimer
            recommendation={restRecommendation}
            exerciseIndex={safeExerciseIndex}
            setNumber={validatedSetNumber}
            nextSetInfo={nextSetInfo}
            initialState={savedRestState}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
          
          {/* [LIVE-WORKOUT-CORRIDOR] Exercise Context Card - uses safeCurrentExercise */}
          <Card className="bg-[#1A1F26]/50 border-[#2B313A]/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  Current Exercise
                </p>
                <p className="font-semibold text-[#E6E9EF]">{safeCurrentExercise.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#A4ACB8]">
                  Set {Math.min(validatedSetNumber, safeCurrentExercise.sets)}/{safeCurrentExercise.sets}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {safeCurrentExercise.repsOrTime}
                  {safeCurrentExercise.prescribedLoad && safeCurrentExercise.prescribedLoad.load > 0 && (
                    <span className="text-[#C1121F] font-medium ml-1">
                      @ +{safeCurrentExercise.prescribedLoad.load}{safeCurrentExercise.prescribedLoad.unit}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
        </div>
      </div>
    )
  }
  
  // ==========================================================================
  // RENDER: ACTIVE STATE (Main Set Logging)
  // [LIVE-WORKOUT-CORRIDOR] Use safeCurrentExercise for ALL render paths - never null check currentExercise
  // safeCurrentExercise always has valid fallback values, so no null guard needed
  // [PHASE LW3] recordBootError removed - render is pure
  // ==========================================================================
  
  // ==========================================================================
  // [UNIT-BASED-ACTIVE-CONTAINMENT] NAMED UNIT RENDER SYSTEM
  // Each unit has:
  //   - Named ownership
  //   - Stage-gated derivations
  //   - Local containment (catches errors, shows inline diagnostic)
  //   - Independent testability
  //
  // UNIT MAP:
  //   Unit 0 (Shell)       = Always renders - minimal safe shell wrapper
  //   Unit 1 (Header)      = Progress bar, timer, workout label
  //   Unit 2 (Exercise)    = Current exercise card, set progress
  //   Unit 3 (Inputs)      = RepsHoldInput, RPEQuickSelector, BandSelector
  //   Unit 4 (Actions)     = Complete set button, skip/end actions
  //   Unit 5 (Optional)    = Modals, menus, optional UI elements
  //
  // DERIVATION OWNERSHIP:
  //   - sessionRuntimeTruth    -> Unit 1 (Header)
  //   - exerciseRuntimeTruth   -> Unit 2 (Exercise)
  //   - activeEntryPreparation -> Unit 3 (Inputs)
  //   - activeWorkoutViewModel -> Unit 5 (Optional)
  // ==========================================================================
  
  // Unit status tracking for diagnostic panel
  const unitStatus = {
    shell: { enabled: true, rendered: false, error: null as string | null },
    header: { enabled: ACTIVE_DERIVATION_STAGE >= 2, rendered: false, error: null as string | null },
    exercise: { enabled: ACTIVE_DERIVATION_STAGE >= 3, rendered: false, error: null as string | null },
    inputs: { enabled: ACTIVE_DERIVATION_STAGE >= 4, rendered: false, error: null as string | null },
    actions: { enabled: ACTIVE_DERIVATION_STAGE >= 5, rendered: false, error: null as string | null },
    optional: { enabled: ACTIVE_DERIVATION_STAGE >= 6, rendered: false, error: null as string | null },
  }
  
  // ==========================================================================
  // UNIT RENDER FUNCTIONS - Each has local containment
  // ==========================================================================
  
  // UNIT 1: Header - renders progress bar, timer, workout label
  const renderHeaderUnit = (): React.ReactNode => {
    if (!unitStatus.header.enabled) return null
    try {
      unitStatus.header.rendered = true
      return (
        <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
          <div className="px-4 py-2.5">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-[#E6E9EF] truncate max-w-[160px]">{safeDisplayLabel}</span>
                  <span className="text-xs text-[#6B7280]">{safeExerciseIndex + 1}/{totalExercises}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280]">{completedSetsCount}/{totalSets}</span>
                  <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">{formatDuration(safeElapsedSeconds)}</span>
                </div>
              </div>
              <div className="h-1 bg-[#2B313A] rounded-full overflow-hidden">
                <div className="h-full bg-[#C1121F] transition-all duration-300" style={{ width: `${(completedSetsCount / Math.max(totalSets, 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] [Unit:Header] FAILED', err)
      unitStatus.header.error = msg
      // In production, fail silently; in dev, show error panel
      if (process.env.NODE_ENV !== 'development') return null
      return (
        <div className="bg-red-900/20 border border-red-500/30 p-3 m-2 rounded-lg">
          <p className="text-red-400 text-sm font-medium">DEV: Unit:Header FAILED</p>
          <p className="text-red-300 text-xs mt-1">{msg}</p>
        </div>
      )
    }
  }
  
  // UNIT 2: Exercise - renders current exercise card
  const renderExerciseUnit = (): React.ReactNode => {
    if (!unitStatus.exercise.enabled) return null
    try {
      unitStatus.exercise.rendered = true
      return (
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
              {safeCurrentExercise.category}
            </Badge>
          </div>
          <h2 className="text-lg font-bold text-[#E6E9EF] leading-tight">{safeCurrentExercise.name}</h2>
          <div className="flex items-center gap-2 mt-1.5 text-sm">
            <span className="text-[#A4ACB8]">Target:</span>
            <span className="text-[#E6E9EF] font-medium">{safeCurrentExercise.repsOrTime}</span>
            <span className="text-[#6B7280]">·</span>
            <span className="text-[#A4ACB8]">RPE {targetRPE}</span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 flex-1">
              {Array.from({ length: safeCurrentExercise.sets || 3 }).map((_, idx) => (
                <div key={idx} className={`h-2 flex-1 rounded-full ${idx < validatedSetNumber - 1 ? 'bg-green-500' : idx === validatedSetNumber - 1 ? 'bg-[#C1121F]' : 'bg-[#2B313A]'}`} />
              ))}
            </div>
            <span className="text-sm font-medium text-[#E6E9EF]">Set {validatedSetNumber}/{safeCurrentExercise.sets || 3}</span>
          </div>
        </Card>
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] [Unit:Exercise] FAILED', err)
      unitStatus.exercise.error = msg
      // In production, fail silently; in dev, show error panel
      if (process.env.NODE_ENV !== 'development') return null
      return (
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
          <p className="text-red-400 text-sm font-medium">DEV: Unit:Exercise FAILED</p>
          <p className="text-red-300 text-xs mt-1">{msg}</p>
        </div>
      )
    }
  }
  
  // UNIT 3: Inputs - renders input controls
  // SINGLE SOURCE OF TRUTH: All input values come from machine state (safeHoldValue, safeRepsValue, safeSelectedRPE, safeBandUsed)
  // Setters dispatch into machine state (setHoldValue, setRepsValue, setSelectedRPE, setBandUsed)
  const renderInputsUnit = (): React.ReactNode => {
    if (!unitStatus.inputs.enabled) return null
    try {
      unitStatus.inputs.rendered = true
      return (
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 space-y-4">
          {isHoldExercise ? (
            <RepsHoldInput type="hold" value={safeHoldValue} onChange={setHoldValue} targetValue={targetValue} />
          ) : (
            <RepsHoldInput type="reps" value={safeRepsValue} onChange={setRepsValue} targetValue={targetValue} />
          )}
          <RPEQuickSelector value={safeSelectedRPE} onChange={setSelectedRPE} targetRPE={targetRPE} />
          {(safeCurrentExercise.executionTruth?.bandSelectable === true || recommendedBand) && (
            <BandSelector value={safeBandUsed} onChange={setBandUsed} recommendedBand={recommendedBand} />
          )}
        </Card>
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] [Unit:Inputs] FAILED', err)
      unitStatus.inputs.error = msg
      // In production, fail silently; in dev, show error panel
      if (process.env.NODE_ENV !== 'development') return null
      return (
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
          <p className="text-red-400 text-sm font-medium">DEV: Unit:Inputs FAILED</p>
          <p className="text-red-300 text-xs mt-1">{msg}</p>
        </div>
      )
    }
  }
  
  // UNIT 4: Actions - renders complete button and secondary actions
  const renderActionsUnit = (): React.ReactNode => {
    if (!unitStatus.actions.enabled) return null
    try {
      unitStatus.actions.rendered = true
      return (
        <>
          <Button onClick={handleCompleteSet} disabled={safeSelectedRPE === null} className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-base font-bold">
            <Check className="w-5 h-5 mr-2" />Log Set
          </Button>
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" onClick={handleSkipExercise} className="text-[#6B7280] text-sm h-9 px-3">
              <SkipForward className="w-3.5 h-3.5 mr-1.5" />Skip
            </Button>
            <Button variant="ghost" onClick={handleRequestExit} className="text-[#6B7280] text-sm h-9 px-3">
              <X className="w-3.5 h-3.5 mr-1.5" />End
            </Button>
          </div>
        </>
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] [Unit:Actions] FAILED', err)
      unitStatus.actions.error = msg
      // In production, fail silently; in dev, show error panel
      if (process.env.NODE_ENV !== 'development') return null
      return (
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
          <p className="text-red-400 text-sm font-medium">DEV: Unit:Actions FAILED</p>
          <p className="text-red-300 text-xs mt-1">{msg}</p>
        </div>
      )
    }
  }
  
  // DIAGNOSTIC PANEL - DEV ONLY - Shows which units succeeded/failed
  // Hidden in production to avoid debug UI appearing in live workout
  const renderDiagnosticPanel = (): React.ReactNode => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') return null
    
    const firstFailingUnit = Object.entries(unitStatus).find(([, s]) => s.enabled && s.error)?.[0] || null
    return (
      <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-[#1A1F26] border border-[#2B313A] rounded-lg p-3 text-xs z-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#A4ACB8] font-medium">Unit Diagnostic (DEV)</span>
          <span className="text-[#6B7280]">Stage: {ACTIVE_DERIVATION_STAGE}</span>
        </div>
        <div className="space-y-1">
          {Object.entries(unitStatus).map(([name, status]) => (
            <div key={name} className="flex items-center justify-between">
              <span className="text-[#6B7280]">{name}</span>
              <span className={status.error ? 'text-red-400' : status.rendered ? 'text-green-400' : status.enabled ? 'text-yellow-400' : 'text-[#3B4250]'}>
                {status.error ? 'FAILED' : status.rendered ? 'OK' : status.enabled ? 'pending' : 'disabled'}
              </span>
            </div>
          ))}
        </div>
        {firstFailingUnit && (
          <div className="mt-2 pt-2 border-t border-[#2B313A]">
            <p className="text-red-400">First failing: <span className="font-medium">{firstFailingUnit}</span></p>
          </div>
        )}
      </div>
    )
  }
  
  // ==========================================================================
  // STAGE 1 ONLY: Minimal shell with diagnostic info (DEV ONLY)
  // In production with stage 1, we still show the full UI to avoid confusing users
  // ==========================================================================
  if (ACTIVE_DERIVATION_STAGE === 1 && process.env.NODE_ENV === 'development') {
    console.log('[v0] [Unit:Shell] Stage 1 - Minimal shell only (DEV)')
    unitStatus.shell.rendered = true
    const elapsed = safeElapsedSeconds || 0
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-500/50 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">DEV: Stage 1 Shell</h2>
          <div className="bg-[#1A1F26] rounded-lg p-4 text-left text-sm space-y-2">
            <p className="text-[#6B7280]">Session: <span className="text-[#E6E9EF]">{safeDisplayLabel || 'Workout'}</span></p>
            <p className="text-[#6B7280]">Exercise: <span className="text-[#E6E9EF]">{safeCurrentExercise?.name || 'Exercise'}</span></p>
            <p className="text-[#6B7280]">Set: <span className="text-[#E6E9EF]">{validatedSetNumber || 1}/{safeCurrentExercise?.sets || 3}</span></p>
            <p className="text-[#6B7280]">Time: <span className="text-[#E6E9EF]">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</span></p>
          </div>
          <p className="text-xs text-green-500 mt-4">Stage 1 passed. Increase ACTIVE_DERIVATION_STAGE to test units.</p>
        </div>
        {renderDiagnosticPanel()}
      </div>
    )
  }
  
  // ==========================================================================
  // STAGE 2+: Unit-based render with containment
  // Shell stays alive, each unit renders inside with local error handling
  // ==========================================================================
  unitStatus.shell.rendered = true
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col">
      {/* UNIT 1: Header */}
      {renderHeaderUnit()}
      
      {/* Main content area */}
      <div className="flex-1 px-4 py-3">
        <div className="max-w-lg mx-auto space-y-3">
          {/* UNIT 2: Exercise Card */}
          {renderExerciseUnit()}
          
          {/* UNIT 3: Input Controls */}
          {renderInputsUnit()}
          
          {/* UNIT 4: Action Buttons */}
          {renderActionsUnit()}
          
          {/* Stage indicator - DEV ONLY */}
          {process.env.NODE_ENV === 'development' && ACTIVE_DERIVATION_STAGE < 6 && (
            <p className="text-green-500 text-sm text-center mt-4">
              DEV: Stage {ACTIVE_DERIVATION_STAGE} active.
            </p>
          )}
        </div>
      </div>
      
      {/* Diagnostic Panel - DEV ONLY */}
      {renderDiagnosticPanel()}
    </div>
  )
  
  // ==========================================================================
  // NOTE: The old stage 6 full active UI is now replaced by the unit-based system above.
  // All active rendering goes through the unit functions with local containment.
  // The return statement above handles all active state rendering via units.
  // ==========================================================================
}
