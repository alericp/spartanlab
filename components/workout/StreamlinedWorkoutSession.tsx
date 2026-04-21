'use client'

// [LIVE_LOG_CORRIDOR_LANDING_V1] Active-branch landing marker.
// If `grep -R LIVE_LOG_CORRIDOR_LANDING_V1 .` returns three matches
// (this file, ActiveWorkoutStartCorridor.tsx, live-workout-machine.ts),
// the runnable branch contains the full accumulated straight-set Log Set
// fix: strict `isTrulyGroupedExercise` gate, Layer-A/Layer-B fail-open
// COMPLETE_SET reducer, single `activeCorridorSnapshot` handoff surface,
// and stages 1-7 proof logs. Zero runtime behavior; purely a branch
// identity marker so the user can verify a pull landed the landing commit
// without chasing v0 branch hashes.

// [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Session-layer build chip. Always
// visible (not dev-only). Rendered by the authoritative corridor as the
// middle segment of its three-part fingerprint (WS-R3 | SWS-R3 | AWC-R3).
// If the user's live workout does not show this chip, the session-layer
// code on their device is stale.
export const SWS_BUILD_CHIP = 'SWS-R3'

// [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Legacy/fallback fingerprint. ONLY
// rendered by the hard-blocked legacy unit-based and Stage-1 return paths
// when they somehow paint. If the user ever sees this chip on a live
// workout screen, the authoritative single-owner contract broke and a
// legacy active surface leaked through.
export const LEGACY_ACTIVE_BUILD_CHIP = 'LEGACY-ACTIVE-R3'

// [POST-COMMIT-FREEZE-TRACE-R3] Module-level monotonic tap trace counter.
// One tap of Log Set on the authoritative corridor advances this counter
// once via allocateTapTraceId(), then emits that id through stages
// A (corridor), B-E (parent + reducer), F (parent render after commit),
// G (corridor re-render with new props). This is the canonical per-tap
// correlation id - not a per-render random id. Window-mirrored so the
// reducer/machine file can read it without importing from this module.
let __nextTapTraceId = 0
export function allocateTapTraceId(): number {
  __nextTapTraceId += 1
  if (typeof window !== 'undefined') {
    ;(window as unknown as { __spartanlabCurrentTapTraceId?: number }).__spartanlabCurrentTapTraceId = __nextTapTraceId
  }
  return __nextTapTraceId
}
export function readCurrentTapTraceId(): number | null {
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __spartanlabCurrentTapTraceId?: number }
    return typeof w.__spartanlabCurrentTapTraceId === 'number' ? w.__spartanlabCurrentTapTraceId : null
  }
  return null
}

import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
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
  Calendar,
  LayoutDashboard,
  Crown,
  Target,
  Zap,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { buildExercisePurposeLine, buildExerciseEffortReasonLine } from '@/lib/program/program-display-contract'
import type { AdaptiveSession, AdaptiveExercise } from '@/lib/adaptive-program-builder'
// [WEEK-PROGRESSION-TRUTH] Import scaled exercise type for week-aware dosage in live workout
import type { ScaledExercise } from '@/lib/week-dosage-scaling'
// [LIVE-UNIT-CONTRACT] Canonical hold-vs-reps detector - single source of truth
// for classifying an exercise as hold-based vs reps-based across the entire
// live workout corridor (active card, set logging, completed-set serialization,
// history surface). Replaces 4+ divergent inline regex variants that missed
// bare-second shorthand like "6s" and silently logged hold exercises as reps.
import { isHoldUnit } from '@/lib/workout/execution-unit-contract'
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
// [LIVE-TRUE-ISOLATION-R5] Isolated live-execution adapter. Sole owner of
// live-phase rendering - wraps ActiveWorkoutStartCorridor in its own error
// boundary and validates every snapshot field at the handoff boundary.
// Direct value import of ActiveWorkoutStartCorridor is no longer needed
// here - the surface is the only renderer. Type-only imports remain for
// SetReasonTag cross-references below.
import {
  LiveWorkoutExecutionSurface,
  markLiveBootStage,
  type LiveWorkoutSnapshot,
  type LiveWorkoutHandlers,
} from '@/components/workout/LiveWorkoutExecutionSurface'
// [LIVE-STATE-SCANNER-R1] Parent latches Stage B onto the on-screen scanner
// at the same point Stage B console instrumentation fires. No reducer
// semantics change - this is pure diagnostic surfacing.
import { recordScannerEvent as recordScannerStage } from '@/components/workout/LiveWorkoutStateScanner'
import { ExerciseOptionsMenu } from '@/components/workout/ExerciseOptionsMenu'
import {
  addOverride,
  getSessionOverrides,
  clearSessionOverrides,
  getOverrideSummary,
  type ExerciseOverride,
} from '@/lib/exercise-override-service'
import { SessionPerformanceCard } from '@/components/workout/SessionPerformanceCard'
// [COMPLETION-SCREEN-POLISH] PostWorkoutSummary component removed from completion flow
// The completion screen now renders inline with validated metrics and cleaner hierarchy
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
import { hasProAccess } from '@/lib/feature-access'
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
  type ExecutionBlock,
  type ExecutionPlan,
} from '@/lib/workout/live-workout-machine'
// [PHASE-NEXT] Execution unit contract and rest resolver
import {
  type SetReasonTag,
  SET_REASON_TAG_LABELS,
  type GroupType,
  GROUP_TYPE_LABELS,
} from '@/lib/workout/execution-unit-contract'
// [LIVE-WORKOUT-AUTHORITY] Input mode resolver and coaching signals
import {
  resolveExerciseInputMode,
  type ExerciseInputModeContract,
  type CoachingSignalTag,
  COACHING_SIGNAL_TAGS,
  COACHING_SIGNAL_LABELS,
  classifyAdaptationHorizons,
  checkRecommendationTrigger,
  type RuntimeRecommendation,
} from '@/lib/workout/live-workout-authority-contract'
  // [LIVE-WORKOUT-ACTION-PLANNER] Import coaching expression builder
  import { buildCoachingExpression } from '@/lib/workout/live-workout-action-planner'
  import { resolveRestTime, applyRestAdjustment, type RestContext } from '@/lib/workout/rest-doctrine-resolver'
  import {
    buildLiveExecutionContract,
    type LiveExecutionContract,
    type GroupedBlockContext,
  } from '@/lib/workout/live-execution-contract'

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
// EXECUTION PLAN DERIVATION
// =============================================================================

/**
 * Derives the execution plan from a flat list of exercises.
 * Groups exercises by blockId into execution blocks for supersets/circuits.
 */
function deriveExecutionPlanFromExercises(exercises: MachineExercise[]): ExecutionPlan {
  if (!exercises || exercises.length === 0) {
    return { blocks: [], hasGroupedBlocks: false, totalSets: 0 }
  }
  
  const blocks: ExecutionBlock[] = []
  let currentBlockId: string | null = null
  let currentBlockExercises: MachineExercise[] = []
  let currentBlockIndexes: number[] = []
  let blockCounter = 0
  
  const flushCurrentBlock = () => {
    if (currentBlockExercises.length === 0) return
    
    const firstEx = currentBlockExercises[0]
    const method = (firstEx.method || '').toLowerCase()
    const memberCount = currentBlockExercises.length
    
    // Determine group type
  // [GROUPED-FIX] A single-member block must NOT be classified as grouped, even if method contains cluster/superset/circuit
  // Grouped UI only makes sense for blocks with 2+ exercises done together
  // [GROUPED-CONTRACT-ALIGN] Support density_block for parity with Program screen
  let groupType: 'superset' | 'circuit' | 'cluster' | 'density_block' | null = null
  let blockLabel = firstEx.name
    
    // Only classify as grouped if there are actually multiple members in the block
    if (memberCount >= 2) {
      if (method.includes('superset') || (memberCount === 2 && currentBlockId)) {
        groupType = 'superset'
        blockCounter++
        // [GROUPED-IDENTITY-FIX] Match session card display convention
        // Session card shows just "Superset" header, not "Superset A/B"
        // The member exercises within are labeled A, B, C
        blockLabel = 'Superset'
      } else if (method.includes('circuit') || memberCount > 2) {
        groupType = 'circuit'
        blockCounter++
        // [GROUPED-IDENTITY-FIX] Match session card display convention - just "Circuit"
        blockLabel = 'Circuit'
      } else if (method.includes('cluster')) {
        groupType = 'cluster'
        blockCounter++
        // [GROUPED-IDENTITY-FIX] Match session card display convention - just "Cluster Set"
        blockLabel = 'Cluster Set'
      }
    }
    // Single-member blocks remain groupType = null (normal set-by-set execution)
    
    // For grouped blocks, targetRounds = sets of each exercise
    const targetRounds = groupType ? (firstEx.sets || 3) : 1
    
    // Rest times based on group type
    let intraBlockRest = 0
    let postRoundRest = 90
    let postBlockRest = 120
    
    if (groupType === 'superset') {
      intraBlockRest = 0 // No rest between superset members
      postRoundRest = firstEx.restSeconds || 90
    } else if (groupType === 'circuit') {
      intraBlockRest = 10 // Quick transition
      postRoundRest = firstEx.restSeconds || 60
    } else if (groupType === 'cluster') {
      intraBlockRest = 15
      postRoundRest = firstEx.restSeconds || 120
    }
    
    blocks.push({
      blockId: currentBlockId || `block-${blocks.length}`,
      groupType,
      blockLabel,
      memberExercises: [...currentBlockExercises],
      memberExerciseIndexes: [...currentBlockIndexes],
      targetRounds,
      intraBlockRestSeconds: intraBlockRest,
      postRoundRestSeconds: postRoundRest,
      postBlockRestSeconds: postBlockRest,
    })
    
    currentBlockExercises = []
    currentBlockIndexes = []
    currentBlockId = null
  }
  
  // Group exercises by blockId
  exercises.forEach((ex, index) => {
    const exBlockId = ex.blockId || null
    
    if (exBlockId && exBlockId === currentBlockId) {
      // Same block
      currentBlockExercises.push(ex)
      currentBlockIndexes.push(index)
    } else {
      // Different block - flush previous
      flushCurrentBlock()
      currentBlockId = exBlockId
      currentBlockExercises = [ex]
      currentBlockIndexes = [index]
    }
  })
  
  // Flush final block
  flushCurrentBlock()
  
  const hasGroupedBlocks = blocks.some(b => b.groupType !== null)
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0)
  
  return { blocks, hasGroupedBlocks, totalSets }
}

/**
 * Get the block containing a given exercise index
 */
function getBlockForExercise(plan: ExecutionPlan | undefined, exerciseIndex: number): { block: ExecutionBlock; memberIndex: number } | null {
  if (!plan?.blocks) return null
  for (const block of plan.blocks) {
    const memberIndex = block.memberExerciseIndexes.indexOf(exerciseIndex)
    if (memberIndex !== -1) {
      return { block, memberIndex }
    }
  }
  return null
}

// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// [WEEK-PROGRESSION-TRUTH] Helper to extract effective exercise values
// Prefers week-scaled values when available, falls back to base values
// This ensures the live workout uses the same dosage as the Program page displays
// =============================================================================
interface EffectiveExerciseValues {
  sets: number
  repsOrTime: string
  targetRPE: number
  restPeriod: number
  weekScalingApplied: boolean
}

function getEffectiveExerciseValues(exercise: AdaptiveExercise | null | undefined): EffectiveExerciseValues {
  if (!exercise) {
    return { sets: 3, repsOrTime: '8-12 reps', targetRPE: 8, restPeriod: 90, weekScalingApplied: false }
  }
  
  // Cast to ScaledExercise to access optional scaled fields
  const scaled = exercise as unknown as ScaledExercise
  
  return {
    // [WEEK-PROGRESSION-TRUTH] Prefer scaled values, fall back to base values
    sets: scaled.scaledSets ?? exercise.sets ?? 3,
    repsOrTime: scaled.scaledReps ?? exercise.repsOrTime ?? '8-12 reps',
    targetRPE: scaled.scaledTargetRPE ?? exercise.targetRPE ?? 8,
    restPeriod: scaled.scaledRestPeriod ?? exercise.restPeriod ?? 90,
    weekScalingApplied: scaled.weekScalingApplied === true,
  }
}

interface CompletedSetData {
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
  inputMode?: import('@/lib/workout/live-workout-authority-contract').ExerciseInputMode
  // Multi-band support
  selectedBands?: ResistanceBandColor[]
  multiBandSelection?: import('@/lib/workout/live-workout-authority-contract').MultiBandSelection | null
  // Weighted exercise facts
  prescribedLoad?: number
  prescribedLoadUnit?: string
  actualLoadUsed?: number
  actualLoadUnit?: string
  // Unilateral exercise facts
  isPerSide?: boolean
  // Structured coaching inputs
  structuredCoachingInputs?: import('@/lib/workout/live-workout-authority-contract').CoachingSignalTag[]
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
// [UNIFIED-HANDOFF] TRANSITION SNAPSHOT TYPE
// Used by buildUnifiedTransitionSnapshot helper for exercise transitions
// =============================================================================

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
 * Returns everything the machine needs to commit atomically.
 * 
 * NO side effects - no setters, no storage, no logging.
 */
function buildUnifiedTransitionSnapshot(
  currentState: {
    currentSetNumber: number
    repsValue: number
    holdValue: number
    bandUsed: ResistanceBandColor | 'none'
    selectedRPE: RPEValue | null
  },
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
// [PHASE-NEXT] v3 = grouped-method runtime with execution blocks, per-set notes, reason tags
const STORAGE_SCHEMA_VERSION = 'workout_session_v3_grouped_runtime'

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
  
  // [PHASE-NEXT] Helper to clear storage and log rejection
  const rejectRestore = (reason: string, details?: Record<string, unknown>) => {
    console.log('[workout-restore] REJECTED:', reason, details || {})
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    return null
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    
    // [PHASE-NEXT] Parse with explicit error handling
    let data: Record<string, unknown>
    try {
      data = JSON.parse(saved)
    } catch {
      return rejectRestore('invalid_json_parse')
    }
    
    // [PHASE-NEXT] Reject if data is not an object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return rejectRestore('invalid_data_shape', { type: typeof data })
    }
    
    // [LIVE-SESSION-FIX] CRITICAL: Validate schema version FIRST
    // If schema version is missing or doesn't match, discard entire saved state
    if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
      return rejectRestore('schema_version_mismatch', {
        savedVersion: data.schemaVersion || 'none',
        currentVersion: STORAGE_SCHEMA_VERSION,
      })
    }
    
    // [PHASE-NEXT] Strict field validation - reject if any required field is corrupt
    const status = data.status
    const currentExerciseIndex = data.currentExerciseIndex
    const currentSetNumber = data.currentSetNumber
    const completedSets = data.completedSets
    const elapsedSeconds = data.elapsedSeconds
    const savedAt = data.savedAt
    
    // Status must be a known valid value
    const validStatuses = ['ready', 'active', 'resting', 'completed']
    if (typeof status !== 'string' || !validStatuses.includes(status)) {
      return rejectRestore('invalid_status', { status })
    }
    
    // currentExerciseIndex must be finite and non-negative
    if (typeof currentExerciseIndex !== 'number' || !Number.isFinite(currentExerciseIndex) || currentExerciseIndex < 0) {
      return rejectRestore('invalid_currentExerciseIndex', { currentExerciseIndex })
    }
    
    // currentSetNumber must be finite and >= 1
    if (typeof currentSetNumber !== 'number' || !Number.isFinite(currentSetNumber) || currentSetNumber < 1) {
      return rejectRestore('invalid_currentSetNumber', { currentSetNumber })
    }
    
    // completedSets must be an array
    if (!Array.isArray(completedSets)) {
      return rejectRestore('invalid_completedSets_shape', { type: typeof completedSets })
    }
    
    // elapsedSeconds must be finite and >= 0
    if (typeof elapsedSeconds !== 'number' || !Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
      return rejectRestore('invalid_elapsedSeconds', { elapsedSeconds })
    }
    
    // savedAt must be a valid timestamp within 4 hours
    if (typeof savedAt !== 'number' || !Number.isFinite(savedAt) || Date.now() - savedAt > 4 * 60 * 60 * 1000) {
      return rejectRestore('session_expired_or_invalid_timestamp', { savedAt, age: savedAt ? Date.now() - savedAt : 'invalid' })
    }
    
    // sessionId must match
    if (data.sessionId !== sessionId) {
      return rejectRestore('session_id_mismatch', { savedSessionId: data.sessionId, currentSessionId: sessionId })
    }
    
    // [AUTHORITATIVE-HYDRATION-CONTRACT] CRITICAL: Validate structure signature match
    // This prevents restoring state from a session with same dayLabel but different exercises
    if (currentStructureSignature && data.structureSignature) {
      if (data.structureSignature !== currentStructureSignature) {
        return rejectRestore('structure_signature_mismatch', {
          savedSignature: data.structureSignature,
          currentSignature: currentStructureSignature,
        })
      }
    }
    
    // [PHASE-NEXT] exerciseOverrides must be a plain object if present
    if (data.exerciseOverrides !== undefined && data.exerciseOverrides !== null) {
      if (typeof data.exerciseOverrides !== 'object' || Array.isArray(data.exerciseOverrides)) {
        return rejectRestore('invalid_exerciseOverrides_shape', { type: typeof data.exerciseOverrides })
      }
    }
    
    // All strict guards passed - now continue with existing coercion/validation logic
    
    // [AUTHORITATIVE-HYDRATION-CONTRACT] Validate index within bounds
    let safeCurrentExerciseIndex = currentExerciseIndex as number
    if (exerciseCount !== undefined) {
      if (safeCurrentExerciseIndex >= exerciseCount) {
        console.log('[workout-restore] Clamping currentExerciseIndex to bounds', {
          savedIndex: currentExerciseIndex,
          exerciseCount,
          clampedTo: exerciseCount - 1,
        })
        safeCurrentExerciseIndex = Math.max(0, exerciseCount - 1)
      }
    }
    
    // [AUTHORITATIVE-HYDRATION-CONTRACT] Filter and validate completedSets
    let safeCompletedSets = completedSets as Array<{ exerciseIndex?: number; setNumber?: number; actualRPE?: number }>
    if (exerciseCount !== undefined) {
      const originalCount = safeCompletedSets.length
      safeCompletedSets = safeCompletedSets.filter((set) => {
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
      if (safeCompletedSets.length !== originalCount) {
        console.log('[workout-restore] Filtered invalid completedSets', {
          originalCount,
          filteredCount: safeCompletedSets.length,
          reason: 'invalid_references',
        })
      }
    }
    
    // [AUTHORITATIVE-HYDRATION-CONTRACT] Clean up exerciseOverrides - remove out-of-bounds keys
    let safeExerciseOverrides = (data.exerciseOverrides || {}) as Record<number, ExerciseOverrideState>
    if (exerciseCount !== undefined && typeof safeExerciseOverrides === 'object') {
      const cleanedOverrides: Record<number, ExerciseOverrideState> = {}
      for (const key of Object.keys(safeExerciseOverrides)) {
        const idx = parseInt(key, 10)
        if (!isNaN(idx) && idx >= 0 && idx < exerciseCount) {
          cleanedOverrides[idx] = safeExerciseOverrides[idx]
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
    
    // [PHASE-NEXT] Build explicit validated payload - only include fields from WorkoutSessionState
    const validatedPayload: WorkoutSessionState = {
      status: status as WorkoutSessionState['status'],
      currentExerciseIndex: safeCurrentExerciseIndex,
      currentSetNumber: currentSetNumber as number,
      completedSets: safeCompletedSets as WorkoutSessionState['completedSets'],
      startTime: typeof data.startTime === 'number' ? data.startTime : null,
      elapsedSeconds: elapsedSeconds as number,
      lastSetRPE: typeof data.lastSetRPE === 'number' ? data.lastSetRPE as RPEValue : null,
      workoutNotes: typeof data.workoutNotes === 'string' ? data.workoutNotes : '',
      exerciseOverrides: safeExerciseOverrides,
    }
    
    console.log('[workout-restore] ACCEPTED session with strict validation', {
      sessionId,
      safeCurrentExerciseIndex,
      currentSetNumber,
      completedSetsCount: safeCompletedSets.length,
      status,
      schemaVersion: STORAGE_SCHEMA_VERSION,
    })
    
    return validatedPayload
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
  // [LIVE-WORKOUT-AUTHORITY] Execution mode locked at workout start
  executionMode?: '30_min' | '45_min' | 'full'
  variantIndex?: number
  // [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Route-level build chip forwarded
  // from app/(app)/workout/session/page.tsx so the corridor can render
  // the full three-part fingerprint. Optional - corridor falls back to
  // '?' if absent.
  routeBuildChip?: string
}

// MERGE_LANE_REACTIVATE_V1
export function StreamlinedWorkoutSession({
  session,
  reasoningSummary,
  onComplete,
  onCancel,
  isDemo = false,
  isFirstSession = false,
  // [LIVE-WORKOUT-AUTHORITY] Default to full if not specified
  executionMode = 'full',
  variantIndex = 0,
  // [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Route-level build chip (WS-R3)
  routeBuildChip = '?',
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
      
      // [WEEK-TRUTH-CORRIDOR] Preservation-safe normalizer (not a destructive rebuild).
      // This is the FIRST losing stage that was stripping week-scaled truth from the
      // loader. We now preserve scaled dosage fields emitted by
      // lib/workout/load-authoritative-session.ts (scaledSets, scaledReps,
      // scaledHoldDuration, scaledTargetRPE, scaledRestPeriod, weekScalingApplied)
      // so that getEffectiveExerciseValues() can actually see them and prefer
      // them over base Week-1 values. NO new scaling logic is introduced here;
      // we only preserve what the loader already resolved.
      const exAny = ex as Record<string, unknown>
      return {
        // Core identity - ALWAYS strings, never undefined
        id: typeof ex.id === 'string' && ex.id ? ex.id : `exercise-${idx}`,
        name: typeof ex.name === 'string' && ex.name ? ex.name : 'Exercise',
        category: typeof ex.category === 'string' && ex.category ? ex.category : 'general',
        
        // Execution parameters - guaranteed safe (base/raw values)
        sets: typeof ex.sets === 'number' && ex.sets > 0 ? ex.sets : 3,
        repsOrTime: typeof ex.repsOrTime === 'string' && ex.repsOrTime ? ex.repsOrTime : '8-12 reps',
        note: typeof ex.note === 'string' ? ex.note : '',
        
        // [WEEK-TRUTH-CORRIDOR] Preserved scaled dosage fields from loader.
        // getEffectiveExerciseValues() at line ~371 prefers these over base values.
        scaledSets: typeof exAny.scaledSets === 'number' && (exAny.scaledSets as number) > 0 ? (exAny.scaledSets as number) : undefined,
        scaledReps: typeof exAny.scaledReps === 'string' && exAny.scaledReps ? (exAny.scaledReps as string) : undefined,
        scaledHoldDuration: typeof exAny.scaledHoldDuration === 'number' ? (exAny.scaledHoldDuration as number) : undefined,
        scaledTargetRPE: typeof exAny.scaledTargetRPE === 'number' ? (exAny.scaledTargetRPE as number) : undefined,
        scaledRestPeriod: typeof exAny.scaledRestPeriod === 'number' ? (exAny.scaledRestPeriod as number) : undefined,
        weekScalingApplied: exAny.weekScalingApplied === true,
        
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
    
    // [WEEK-TRUTH-CORRIDOR] Preserve session-level metadata the ready shell
    // and grouped-rendering path need. Previously safeWorkoutSessionContract
    // silently dropped these, which forced the ready shell into fallback
    // branches (flat rendering) and suppressed grouped identity. The
    // ready-shell grouped rendering at line ~4836, acclimation microcopy
    // gating at line ~5083, and compositionMetadata fallback at line ~6150
    // all depend on these being preserved.
    const sessionAny = session as Record<string, unknown>
    
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
      
      // Exercises - authoritative safe array (now preserves scaled dosage)
      exercises: normalizedExercises,
      
      // Warmup/cooldown (optional arrays)
      warmup: Array.isArray(session.warmup) ? session.warmup : [],
      cooldown: Array.isArray(session.cooldown) ? session.cooldown : [],
      
      // [WEEK-TRUTH-CORRIDOR] Preserve session-level grouping / audit metadata.
      // Passed through as-is; downstream readers (line ~1728 styledGroups
      // derivation, ~4836 grouped render, ~5083 acclimation microcopy,
      // ~6150 compositionMetadata fallback) use optional chaining so loose
      // typing here is safe and avoids re-declaring these complex upstream
      // shapes inside the component. The `any` cast matches the existing
      // access pattern for these optional runtime fields.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      styleMetadata: sessionAny.styleMetadata as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prescriptionPropagationAudit: sessionAny.prescriptionPropagationAudit as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      compositionMetadata: sessionAny.compositionMetadata as any,
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
    
    // Map exercises with grouped method fields
    // [WEEK-TRUTH-CORRIDOR] This is the second losing corridor stage that was
    // stripping scaled dosage from the safeSession on its way into the machine
    // contract. We now forward the scaled fields alongside base fields so the
    // machine bridge is a preservation-safe normalizer, not a collapsing one.
    // getEffectiveExerciseValues() reads from this shape via a ScaledExercise
    // cast and will now prefer scaled over base Week-1 values.
    const exercises: MachineExercise[] = safeSession.exercises.map((ex): MachineExercise => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      sets: ex.sets,
      repsOrTime: ex.repsOrTime,
      note: ex.note,
      isOverrideable: ex.isOverrideable,
      prescribedLoad: ex.prescribedLoad,
      targetRPE: ex.targetRPE,
      restSeconds: ex.restSeconds,
      executionTruth: ex.executionTruth,
      // Grouped method fields
      method: ex.method,
      methodLabel: ex.methodLabel,
      blockId: ex.blockId,
      // [WEEK-TRUTH-CORRIDOR] Forwarded scaled dosage (see interface note in
      // lib/workout/live-workout-machine.ts). No recomputation happens here.
      scaledSets: ex.scaledSets,
      scaledReps: ex.scaledReps,
      scaledHoldDuration: ex.scaledHoldDuration,
      scaledTargetRPE: ex.scaledTargetRPE,
      scaledRestPeriod: ex.scaledRestPeriod,
      weekScalingApplied: ex.weekScalingApplied,
    }))
    
    // [GROUPED-TRUTH-UNIFY] Derive execution plan from AUTHORITATIVE source
    // Priority 1: styleMetadata.styledGroups (same source as Program screen / Today's Plan)
    // Priority 2: Fallback to flat blockId-based derivation
    const styledGroups = safeSession.styleMetadata?.styledGroups
    
    let executionPlan: ExecutionPlan
    
if (styledGroups && styledGroups.length > 0) {
      // AUTHORITATIVE PATH: Convert styledGroups to ExecutionPlan
      console.log('[v0] [execution_plan_from_styled_groups]', {
        styledGroupCount: styledGroups.length,
        groups: styledGroups.map(g => ({ id: g.id, type: g.groupType, exerciseCount: g.exercises.length }))
      })
      
      // [GROUPED-IDENTITY] Track how many of each group type we've seen to assign letters (A, B, C...)
      const groupTypeCounters: Record<string, number> = {
        superset: 0,
        circuit: 0,
        cluster: 0,
        density_block: 0,
      }
      
      // Mutable accumulators for building the execution plan
      const blocks: ExecutionBlock[] = []
      let hasGroupedBlocks = false
      let totalSets = 0
      
      for (const group of styledGroups) {
        // [GROUPED-CONTRACT-ALIGN] Map ALL styledGroup.groupType values to ExecutionBlock.groupType
        // This ensures Program screen and live runtime use identical grouped identity
        const groupType: 'superset' | 'circuit' | 'cluster' | 'density_block' | null = 
          group.groupType === 'superset' ? 'superset'
          : group.groupType === 'circuit' ? 'circuit'
          : group.groupType === 'cluster' ? 'cluster'
          : group.groupType === 'density_block' ? 'density_block'
          : group.groupType === 'straight' ? null
          : null
        
        if (groupType) hasGroupedBlocks = true
        
        // Find matching exercises from the exercises array
        const memberExercises: MachineExercise[] = []
        const memberExerciseIndexes: number[] = []
        
        for (const groupEx of group.exercises) {
          // Match by ID first, then by name as fallback
          let exIndex = exercises.findIndex(e => e.id === groupEx.id)
          if (exIndex === -1) {
            exIndex = exercises.findIndex(e => e.name === groupEx.name)
          }
          if (exIndex !== -1) {
            memberExercises.push(exercises[exIndex])
            memberExerciseIndexes.push(exIndex)
            totalSets += exercises[exIndex].sets || 3
          }
        }
        
        // [GROUPED-IDENTITY] Compute block letter (A, B, C...) based on how many of this type we've seen
        let blockLetter = ''
        if (groupType && groupTypeCounters[groupType] !== undefined) {
          blockLetter = String.fromCharCode(65 + groupTypeCounters[groupType]) // A, B, C...
          groupTypeCounters[groupType]++
        }
        
        // Get label with identity letter when multiple blocks of same type exist
        const baseLabel = groupType === 'superset' ? 'Superset'
          : groupType === 'circuit' ? 'Circuit'
          : groupType === 'cluster' ? 'Cluster Set'
          : groupType === 'density_block' ? 'Density Block'
          : memberExercises[0]?.name || 'Exercise'
        
        // Include letter only if we have or will have multiple blocks of the same type
        const blockLabel = (groupType && blockLetter) ? `${baseLabel} ${blockLetter}` : baseLabel
        
        // [GROUPED-CONTRACT-ALIGN] Rest timing per group type matching Program screen expectations
        const intraBlockRest = groupType === 'superset' ? 0 
          : groupType === 'circuit' ? 10 
          : groupType === 'cluster' ? 15
          : groupType === 'density_block' ? 0  // Density blocks are timed, not rest-based
          : 15
        
        blocks.push({
          blockId: group.id,
          groupType,
          blockLabel,
          memberExercises,
          memberExerciseIndexes,
          targetRounds: memberExercises[0]?.sets || 3,
          intraBlockRestSeconds: intraBlockRest,
          postRoundRestSeconds: memberExercises[0]?.restSeconds || 90,
          postBlockRestSeconds: 120,
        })
      }
      
      executionPlan = { blocks, hasGroupedBlocks, totalSets }
    } else {
      // FALLBACK PATH: Derive from flat exercise blockId fields
      executionPlan = deriveExecutionPlanFromExercises(exercises)
    }
    
    return {
      dayLabel: safeSession.dayLabel || 'Workout',
      dayNumber: safeSession.dayNumber || 1,
      estimatedMinutes: safeSession.estimatedMinutes || 45,
      exercises,
      executionPlan,
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
  // [LIVE-WORKOUT-AUTHORITY] Initialize machine state with execution mode
  // Note: useReducer initializer is called once at mount. We capture executionMode at that time.
  const [machineState, machineDispatch] = useReducer(
    workoutMachineReducer,
    null, // Pass null as initial arg, we handle it in the initializer
    () => {
      const state = createInitialMachineState(sessionId, executionMode)
      console.log('[LIVE-WORKOUT-AUTHORITY] Machine initialized with execution mode', {
        sessionId,
        executionMode,
        targetDurationMinutes: state.targetDurationMinutes,
        variantIndex,
      })
      return state
    }
  )
  
  // [STAGED-ISOLATION-DEBUG] Log machine state immediately after reducer
  console.log('[v0] [machine_state_initialized]', {
    phase: machineState.phase,
    currentExerciseIndex: machineState.currentExerciseIndex,
    currentSetNumber: machineState.currentSetNumber,
    completedSetsCount: machineState.completedSets?.length ?? 0,
    // [LIVE-WORKOUT-AUTHORITY] Log execution mode
    executionMode: machineState.executionMode,
    targetDurationMinutes: machineState.targetDurationMinutes,
  })
  
  // [LIVE-LOG-CORRIDOR-PROOF] Stage 5: rerender consumes post-reducer state.
  // Paired with stage-4 reducer log in lib/workout/live-workout-machine.ts.
  // Fires whenever completedSets.length, currentSetNumber, currentExerciseIndex,
  // or phase changes - the four values that prove a COMPLETE_SET dispatch
  // actually landed. If stages 1-4 log but this effect never fires after
  // clicking Log Set, the reducer is not returning a new state object (or
  // React is bailing on re-render). Strict-mode safe: no deps are mutated.
  useEffect(() => {
    console.log('[v0] [log-corridor] stage5 rerender sees machine state', {
      phase: machineState.phase,
      currentExerciseIndex: machineState.currentExerciseIndex,
      currentSetNumber: machineState.currentSetNumber,
      completedSetsLength: machineState.completedSets?.length ?? 0,
      lastCompletedSet: machineState.completedSets?.length
        ? {
            exerciseIndex: machineState.completedSets[machineState.completedSets.length - 1].exerciseIndex,
            setNumber: machineState.completedSets[machineState.completedSets.length - 1].setNumber,
            actualReps: machineState.completedSets[machineState.completedSets.length - 1].actualReps,
            holdSeconds: machineState.completedSets[machineState.completedSets.length - 1].holdSeconds,
          }
        : null,
    })
  }, [
    machineState.phase,
    machineState.currentExerciseIndex,
    machineState.currentSetNumber,
    machineState.completedSets,
  ])
  
  // =========================================================================
  // [LIVE-LOG-REVERSION-DETECTOR] PHASE-TRANSITION WATCHDOG
  //
  // Purpose: prove or disprove the user-reported "flash rest then snap back
  // to active" symptom by recording every phase transition in a ref and
  // logging any transition back to `active` that did NOT come from a
  // legitimate transition action (COMPLETE_REST, ADVANCE_TO_NEXT_EXERCISE,
  // SKIP_SET, etc.). If this fires, the exact surrounding dispatch has
  // re-asserted `phase: 'active'` on stale pointers.
  //
  // The ref-pair lets us compare (priorPhase, nextPhase, priorCompletedLen,
  // nextCompletedLen) across exactly one render boundary without owning
  // any state itself.
  // =========================================================================
  const phaseHistoryRef = useRef<{
    phase: typeof machineState.phase
    completedLen: number
    currentSetNumber: number
    currentExerciseIndex: number
    timestamp: number
  } | null>(null)
  
  useEffect(() => {
    const prior = phaseHistoryRef.current
    const nextSnapshot = {
      phase: machineState.phase,
      completedLen: machineState.completedSets?.length ?? 0,
      currentSetNumber: machineState.currentSetNumber,
      currentExerciseIndex: machineState.currentExerciseIndex,
      timestamp: Date.now(),
    }
    
    if (prior) {
      // Suspicious reversion pattern: resting -> active on same exercise
      // with NO change to currentSetNumber means COMPLETE_REST-like
      // transition happened without the user's input AND without advancing
      // the set pointer (legitimate COMPLETE_REST keeps set number, but the
      // ONLY legitimate caller of COMPLETE_REST is handleRestComplete via
      // user Skip Rest click or rest-timer completion). If this fires
      // within ~500ms of a phase=resting transition, the "brief flash
      // then snap back" is real and this log pinpoints the timing.
      if (
        prior.phase === 'resting' &&
        machineState.phase === 'active' &&
        prior.currentExerciseIndex === machineState.currentExerciseIndex &&
        prior.completedLen === nextSnapshot.completedLen
      ) {
        const dwellMs = nextSnapshot.timestamp - prior.timestamp
        console.warn('[v0] [log-corridor] REVERSION_DETECTED resting->active without COMPLETE_REST advance', {
          priorPhase: prior.phase,
          nextPhase: machineState.phase,
          dwellMs,
          currentExerciseIndex: machineState.currentExerciseIndex,
          currentSetNumber: machineState.currentSetNumber,
          priorCompletedLen: prior.completedLen,
          nextCompletedLen: nextSnapshot.completedLen,
          hint: 'If dwellMs < 800 this is the user-reported flash-and-snapback; inspect the next dispatch after COMPLETE_SET in the same tap.',
        })
      }
      
      // Log every phase change for post-commit forensics
      if (prior.phase !== machineState.phase) {
        console.log('[v0] [log-corridor] phase_transition', {
          from: prior.phase,
          to: machineState.phase,
          dwellMs: nextSnapshot.timestamp - prior.timestamp,
          priorSet: prior.currentSetNumber,
          nextSet: machineState.currentSetNumber,
          priorCompletedLen: prior.completedLen,
          nextCompletedLen: nextSnapshot.completedLen,
        })
      }
    }
    
    phaseHistoryRef.current = nextSnapshot
  }, [
    machineState.phase,
    machineState.currentExerciseIndex,
    machineState.currentSetNumber,
    machineState.completedSets,
  ])
  
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
    console.error('[POST_LOG_UNEXPECTED_READY] liveSession error - falling back to ready!', error instanceof Error ? error.message : 'unknown')
    console.error('[POST_LOG_UNEXPECTED_READY] machineState was:', {
      phase: machineState.phase,
      completedSetsCount: machineState.completedSets?.length,
    })
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
      case 'SHOW_INTER_EXERCISE_REST': {
        // This is handled by COMPLETE_SET when isLastSetOfExercise=true
        const restSet = action.newCompletedSets[action.newCompletedSets.length - 1]
        if (restSet) {
          // [RPE-REST-AUTHORITY] Mirror the RPE->rest computation used by the
          // primary handler above. This adapter is invoked by a different
          // upstream corridor (the reducer wrapper), so it independently needs
          // to compute and forward the doctrine-backed rest seconds -- without
          // it, the machine would fall back to 120s on this path.
          let adapterComputedRest: number | undefined
          const exAtIdx = exercises[restSet.exerciseIndex] ?? safeCurrentExercise
          if (exAtIdx && typeof restSet.actualRPE === 'number') {
            try {
              const priorSets = normalizedCompletedSets
              const avgRPE = priorSets.length > 0
                ? priorSets.reduce((sum, s) => sum + s.actualRPE, 0) / priorSets.length
                : restSet.actualRPE
              const rec = getRestRecommendation(
                exAtIdx,
                restSet.actualRPE,
                {
                  setNumber: restSet.setNumber,
                  totalSetsCompleted: priorSets.length + 1,
                  averageRPE: avgRPE,
                }
              )
              adapterComputedRest = rec.adjustedSeconds
            } catch {
              // fallthrough - machine falls back to 120s
            }
          }
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
            interExerciseRestSeconds: adapterComputedRest,
          })
        }
        break
      }
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
      case 'HYDRATE_FROM_STORAGE': {
        // [REFRESH-DUPLICATE-SET-FIX] PHASE-SAFE POINTER ADVANCEMENT (layer 2 of 4)
        //
        // Root cause the guard below fixes:
        //   During the green between_exercise_rest screen, the machine phase
        //   is `between_exercise_rest` with:
        //     - currentExerciseIndex = the exercise that was just finished
        //     - currentSetNumber    = the FINAL set number of that exercise
        //                             (the set that was JUST completed)
        //     - completedSets       = already contains that final set
        //   liveSession flattens this to status:'resting' for autosave. On
        //   refresh, RESUME_WORKOUT forces phase:'active' and preserves
        //   currentSetNumber. That leaves the runtime pointed at an
        //   already-completed set. When the user logs it, COMPLETE_SET
        //   appends a SECOND Set N to completedSets -> the visible
        //   "two Set 2 rows" duplicate.
        //
        //   Fix: before dispatching RESUME_WORKOUT, detect the exact
        //   condition "pointer is at an already-completed set" using the
        //   authoritative session contract for the per-exercise set count.
        //   If so, advance the pointer to the next logical logging slot
        //   (next set of same exercise, or set 1 of next exercise, or
        //   clamp to end). Completed-set history is NEVER changed here;
        //   only the transient pointer is repaired. Durable truth vs
        //   transient truth is separated.
        const rawSaved = action.savedState
        const rawCompletedSets = (rawSaved.completedSets ?? []) as Array<{
          exerciseIndex: number
          setNumber: number
        }>
        if (rawCompletedSets.length > 0) {
          const exercises = machineSessionContract?.exercises ?? []
          const exerciseCount = exercises.length
          let safeIdx = typeof rawSaved.currentExerciseIndex === 'number'
            ? rawSaved.currentExerciseIndex
            : 0
          let safeSetNumber = typeof rawSaved.currentSetNumber === 'number'
            ? rawSaved.currentSetNumber
            : 1
          
          const isSetAlreadyCompleted = (exIdx: number, setNum: number) =>
            rawCompletedSets.some(
              s => s.exerciseIndex === exIdx && s.setNumber === setNum
            )
          
          if (
            exerciseCount > 0 &&
            safeIdx >= 0 &&
            safeIdx < exerciseCount &&
            isSetAlreadyCompleted(safeIdx, safeSetNumber)
          ) {
            // Pointer references an already-completed set. Advance it.
            const prescribedSets =
              typeof exercises[safeIdx]?.sets === 'number' && exercises[safeIdx].sets > 0
                ? exercises[safeIdx].sets
                : 1
            
            let advancedIdx = safeIdx
            let advancedSetNumber = safeSetNumber
            
            if (safeSetNumber < prescribedSets) {
              // Still more sets remaining in current exercise -> next set
              advancedSetNumber = safeSetNumber + 1
            } else {
              // Current exercise fully done -> jump to set 1 of next exercise
              if (safeIdx + 1 < exerciseCount) {
                advancedIdx = safeIdx + 1
                advancedSetNumber = 1
              } else {
                // Last exercise also done - clamp at the end. The machine
                // will drive to completed as appropriate on user action.
                advancedIdx = safeIdx
                advancedSetNumber = prescribedSets
              }
            }
            
            console.log('[REFRESH-DUPLICATE-SET-FIX] advanced stale pointer past already-completed set', {
              fromExerciseIndex: safeIdx,
              fromSetNumber: safeSetNumber,
              toExerciseIndex: advancedIdx,
              toSetNumber: advancedSetNumber,
              completedSetsCount: rawCompletedSets.length,
              reason: 'refresh_during_between_exercise_rest_or_equivalent',
            })
            
            safeIdx = advancedIdx
            safeSetNumber = advancedSetNumber
          }
          
          machineDispatch({
            type: 'RESUME_WORKOUT',
            startTime: rawSaved.startTime || Date.now(),
            savedState: {
              currentExerciseIndex: safeIdx,
              currentSetNumber: safeSetNumber,
              completedSets: rawSaved.completedSets as unknown as CompletedSet[],
              elapsedSeconds: rawSaved.elapsedSeconds,
              workoutNotes: rawSaved.workoutNotes,
              lastSetRPE: rawSaved.lastSetRPE,
            },
          })
        }
        break
      }
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
  // [DISCARD-INTENT-LOCK] Authoritative exit intent ref
  // ==========================================================================
  // Synchronous flag that wins against any post-discard autosave re-fire.
  //
  // The prior bug: `handleDiscardAndExit` called `clearSessionStorage()` and
  // then `onCancel()` to navigate away, but it ALSO called
  // `setShowExitConfirm(false)` which triggered one more React render cycle
  // before the navigation completed. That re-render re-ran the autosave
  // useEffect (which depends on `liveSession`), and the effect wrote the
  // current `liveSession` back to localStorage - un-doing the discard.
  //
  // A ref is the correct primitive here because:
  //   1. It's synchronous: flipping it and calling clearSessionStorage in
  //      the same tick guarantees the autosave effect sees it on the very
  //      next commit.
  //   2. It doesn't cause a re-render (state would).
  //   3. It survives the re-renders caused by `setShowExitConfirm(false)`.
  //
  // Save/Exit does NOT set this flag. Save/Exit preserves the workout.
  // Accidental close (navigation elsewhere, tab close) does NOT set this
  // flag either, so autosave is still the safety net there - only an
  // explicit Discard action wins against autosave.
  // ==========================================================================
  const discardIntentRef = useRef<boolean>(false)
  
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
  // [LIVE-OWNERSHIP-FIX] safeStatus maps ALL live phases to 'active' or 'resting'
  // so the corridor check at line 5298 catches ALL live execution phases.
  // This ensures no live phase falls through to ready shell.
  const safeStatus = useMemo(() => {
    const phase = machineState.phase
    switch (phase) {
      case 'ready': return 'ready' as const
      case 'active': return 'active' as const
      case 'resting': return 'resting' as const
      case 'between_exercise_rest': return 'resting' as const
      case 'block_round_rest': return 'resting' as const // Grouped block rest -> live execution
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
  // [PRE-START-SHELL-WEEK-PARITY] Ready-shell header total sets MUST reflect
  // the same week-scaled dosage used by active execution. Reading raw
  // `ex.sets` here was painting Week 1 base volume (e.g. 3x) even when the
  // Program card handed in Week 2/3/4 truth. getEffectiveExerciseValues()
  // is the single authoritative effective-value resolver (prefers
  // scaledSets over base sets), already used by the active runner at
  // lines 2888, 3202, etc. No parallel scaling logic is introduced here.
  const totalSets = exercises.reduce((sum, ex) => sum + getEffectiveExerciseValues(ex).sets, 0)
  
  // [START-CRASH-FIX] Get executionPlan from contract for grouped rendering in ready state
  // This was missing and causing undefined access crash when clicking Start Workout
  const executionPlan = machineSessionContract?.executionPlan ?? { blocks: [], hasGroupedBlocks: false, totalSets: 0 }
  

  
  // Machine-derived: hasValidExercises
  const hasValidExercises = exercises.length > 0
  
  // Machine-derived: safeExerciseIndex (clamped to valid range)
  const safeExerciseIndex = hasValidExercises
    ? Math.max(0, Math.min(machineState.currentExerciseIndex, exercises.length - 1))
    : 0
  
  // Machine-derived: validatedCurrentExercise
  const validatedCurrentExercise = hasValidExercises ? exercises[safeExerciseIndex] : null
  
  // Machine-derived: normalizedCompletedSets (directly from machine state)
  // [CRASH-FIX] Added null safety - machineState.completedSets should never be undefined but guard anyway
  const normalizedCompletedSets = machineState.completedSets ?? []
  
  // Machine-derived: completedSetsCount
  const completedSetsCount = normalizedCompletedSets.length
  
  // Machine-derived: normalizedExerciseOverrides
  // [CRASH-FIX] Added null safety
  const normalizedExerciseOverrides = machineState.exerciseOverrides ?? {}
  
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
  // [ACTIVE-WEEK-PARITY] ONE AUTHORITATIVE ACTIVE EFFECTIVE CONTRACT
  //
  // The pre-start shell already reads week-scaled truth via
  // getEffectiveExerciseValues(). This contract makes the ACTIVE corridor
  // read the SAME effective truth, so when the Program card handed off
  // Week 2/3/4 scaled dosage (e.g. Planche Leans 5x8s), the live session
  // no longer falls back to raw Week 1 base dosage (3x6s).
  //
  // RULES:
  //  - No new scaling logic is introduced here. This is a single read of
  //    the existing getEffectiveExerciseValues() resolver, which already
  //    prefers scaledSets / scaledReps / scaledTargetRPE / scaledRestPeriod
  //    over base fields.
  //  - All ACTIVE-corridor derivations (target text, seed parse, hold
  //    detection, set progress denominator, set label, targetRPE prop to
  //    ActiveWorkoutStartCorridor, rest-fallback for current exercise)
  //    read from this ONE object. Raw safeCurrentExercise.sets /
  //    .repsOrTime / .targetRPE / .restSeconds reads in the active
  //    corridor are replaced by these effective fields.
  //  - `effectiveRestSeconds` prefers the scaled rest period (emitted by
  //    the loader as scaledRestPeriod). When that is undefined, it falls
  //    back to the base exercise.restSeconds. The rest engine itself
  //    (getRestDuration, RPE-REST-AUTHORITY) is NOT rewritten - we only
  //    change the per-exercise base it reads when that base has been
  //    scaled for the selected week.
  // ==========================================================================
  const activeEffectiveContract = useMemo(() => {
    const eff = getEffectiveExerciseValues(safeCurrentExercise)
    // Base restSeconds falls back when no scaled rest was provided.
    const baseRestSeconds = typeof safeCurrentExercise?.restSeconds === 'number'
      ? safeCurrentExercise.restSeconds
      : undefined
    // eff.restPeriod returns either scaledRestPeriod or base exercise.restPeriod
    // or the 90s default from the resolver. We only prefer it over
    // baseRestSeconds when week scaling is actually applied, so un-scaled
    // sessions keep their existing rest behaviour bit-identical.
    const effectiveRestSeconds = eff.weekScalingApplied
      ? eff.restPeriod
      : baseRestSeconds
    return {
      effectiveSets: eff.sets,
      effectiveRepsOrTime: eff.repsOrTime,
      effectiveTargetRPE: eff.targetRPE,
      effectiveRestSeconds,
      weekScalingApplied: eff.weekScalingApplied,
    }
  }, [safeCurrentExercise])
  
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
  const ACTIVE_DERIVATION_STAGE = 1 // [SURGICAL-FIX] Bypass complex derivations to restore working start corridor
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
  // [AI-RUNTIME-CONTRACT] Now includes sessionRationale and hasGroupedBlocks
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
        sessionRationale: null,
        hasGroupedBlocks: false,
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
        sessionRationale: null,
        hasGroupedBlocks: false,
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
        sessionRationale: safeWorkoutSessionContract.rationale ?? null,
        hasGroupedBlocks: machineSessionContract?.executionPlan?.hasGroupedBlocks ?? false,
      }
    }
  }, [hasValidExercises, sessionId, safeWorkoutSessionContract, safeExerciseIndex, exercises.length, totalSets, machineSessionContract?.executionPlan?.hasGroupedBlocks])
  
  // Exercise runtime truth - derived directly, no parallel validation
  // [STAGE-GATED] Only compute full truth for stage >= 3
  // [AI-RUNTIME-CONTRACT] Now includes grouped context and passes to doctrine resolver
  const exerciseRuntimeTruth: ExerciseRuntimeTruth = useMemo(() => {
    // [AI-RUNTIME-CONTRACT] Derive grouped context for doctrine-aware rest
    const blockInfo = getBlockForExercise(machineSessionContract?.executionPlan, safeExerciseIndex)
    const groupedContext = blockInfo?.block?.groupType ? {
      groupType: blockInfo.block.groupType as 'superset' | 'circuit' | 'cluster' | 'density_block' | null,
      lastActualRPE: machineState.lastSetRPE ?? null,
    } : undefined
    
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
        restReason: 'Standard rest',
        selectionReason: null,
        coachingNote: null,
        method: null,
        blockId: null,
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
        restReason: 'Standard rest',
        selectionReason: null,
        coachingNote: null,
        method: null,
        blockId: null,
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
      // [AI-RUNTIME-CONTRACT] Pass grouped context to doctrine resolver
      return buildExerciseRuntimeTruth(
        safeCurrentExercise as AdaptiveExercise,
        safeExerciseIndex,
        overrideState ? {
          isOverridden: !!(overrideState.isReplaced || overrideState.isProgressionAdjusted || overrideState.isSkipped),
          overrideType: overrideState.isReplaced ? 'replaced' : overrideState.isProgressionAdjusted ? 'progression_adjusted' : overrideState.isSkipped ? 'skipped' : null,
          currentName: overrideState.currentName,
        } : undefined,
        groupedContext
      )
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
        restReason: 'Standard rest',
        selectionReason: (safeCurrentExercise as AdaptiveExercise).selectionReason ?? null,
        coachingNote: null,
        method: (safeCurrentExercise as AdaptiveExercise).method ?? null,
        blockId: (safeCurrentExercise as AdaptiveExercise).blockId ?? null,
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
  }, [hasValidExercises, safeCurrentExercise, safeExerciseIndex, normalizedExerciseOverrides, machineSessionContract?.executionPlan, machineState.lastSetRPE])
  
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
      // [ACTIVE-WEEK-PARITY] Even the stage-skipped fast path must report
      // effective scaled display so the active shell never flashes raw
      // Week-1 dosage mid-mount.
      targetRPE: activeEffectiveContract.effectiveTargetRPE,
      isHoldExercise: false,
      displaySets: `${activeEffectiveContract.effectiveSets} sets`,
      displayRepsTime: activeEffectiveContract.effectiveRepsOrTime,
    }
    }
    
    try {
    // [ACTIVE-WEEK-PARITY] Parse target value from EFFECTIVE prescription
    // text, not raw base text. This is the seed source for the active hold /
    // reps input default, so parsing from base "6s" would paint the live
    // session with Week-1 acclimation targets even on Week 2/3/4.
    const repsOrTime = activeEffectiveContract.effectiveRepsOrTime
    let targetValue = 8
    if (typeof repsOrTime === 'string' && repsOrTime.length > 0) {
      const match = repsOrTime.match(/(\d+)/)
      if (match) {
        targetValue = parseInt(match[1], 10)
      }
    }
    
    // Parse recommended band from note (note text is not week-scaled)
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
    
    // [LIVE-UNIT-CONTRACT] + [ACTIVE-WEEK-PARITY] Detect hold exercise via
    // canonical detector using EFFECTIVE repsOrTime. Hold detection must
    // reflect the scaled prescription (e.g. "8s") rather than the raw base
    // ("6s"), so behaviour matches pre-start for week-scaled sessions.
    const isHoldExercise = isHoldUnit({
      repsOrTime,
      name: safeCurrentExercise?.name,
      category: safeCurrentExercise?.category,
    })
    
    return {
      ok: true as const,
      failureStage: null,
      failureReason: null,
      targetValue,
      recommendedBand,
      // [ACTIVE-WEEK-PARITY] Prefer scaledTargetRPE when present
      targetRPE: activeEffectiveContract.effectiveTargetRPE,
      isHoldExercise,
      // [WEEK-PROGRESSION-TRUTH] Effective scaled values for display
      displaySets: `${activeEffectiveContract.effectiveSets} sets`,
      displayRepsTime: activeEffectiveContract.effectiveRepsOrTime,
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
    // [ACTIVE-WEEK-PARITY] Depend on the effective contract so seed parse and
    // hold detection re-run when scaled truth changes week-to-week.
  }, [safeCurrentExercise, activeEffectiveContract])

  // ==========================================================================
  // [ACTIVE-ENTRY-CONTRACT] SINGLE AUTHORITATIVE ACTIVE RENDER PAYLOAD
  // This is the ONE object that all active render units read from.
  // It consolidates all scattered derivations into a fail-closed contract.
  // If any internal step fails, returns controlled fallback - never throws.
  // ==========================================================================
  const activeEntryContract = useMemo(() => {
    console.log('[v0] [active_contract_build_start]')
    
    // Fallback contract for any failure
    const fallbackContract = {
      ok: true as const,
      stage: 'fallback' as const,
      // Exercise context
      exerciseIndex: 0,
      exerciseName: 'Exercise',
      exerciseCategory: 'general' as string,
      exerciseSets: 3,
      exerciseRepsOrTime: '8-12 reps',
      exerciseNote: '',
      // Set context
      setNumber: 1,
      isHoldExercise: false,
      targetValue: 8,
      targetRPE: 8,
      recommendedBand: undefined as ResistanceBandColor | undefined,
      // Grouped block context
      isGrouped: false,
      groupType: null as 'superset' | 'circuit' | 'cluster' | 'density_block' | null,
      blockLabel: '',
      memberIndex: 0,
      memberCount: 1,
      currentRound: 1,
      targetRounds: 1,
      memberLabel: '1',
      blockInfo: null as { block: ExecutionBlock; memberIndex: number } | null,
      // UI flags
      bandSelectable: false,
      hasLoad: false,
      loadDisplay: null as string | null,
      // Progress
      completedSetsCount: 0,
      totalSets: 3,
      totalExercises: 1,
      // Notes
      currentSetNote: '',
      currentSetReasonTags: [] as string[],
    }
    
    try {
      // STEP 1: Resolve current exercise safely
      // [WEEK-PROGRESSION-TRUTH] Use effective values which prefer scaled week dosage
      const effectiveValues = getEffectiveExerciseValues(safeCurrentExercise)
      console.log('[v0] [active_contract_current_exercise_resolved]', { 
        index: safeExerciseIndex, 
        name: safeCurrentExercise?.name,
        weekScalingApplied: effectiveValues.weekScalingApplied,
        effectiveSets: effectiveValues.sets,
      })
      const exerciseIndex = safeExerciseIndex
      const exerciseName = safeCurrentExercise?.name ?? 'Exercise'
      const exerciseCategory = safeCurrentExercise?.category ?? 'general'
      const exerciseSets = effectiveValues.sets
      const exerciseRepsOrTime = effectiveValues.repsOrTime
      const exerciseNote = safeCurrentExercise?.note ?? ''
      
      // STEP 2: Resolve grouped block context safely
      let blockInfo: { block: ExecutionBlock; memberIndex: number } | null = null
      let isGrouped = false
      let groupType: 'superset' | 'circuit' | 'cluster' | 'density_block' | null = null
      let blockLabel = ''
      let memberIndex = 0
      let memberCount = 1
      let currentRound = 1
      let targetRounds = 1
      let memberLabel = '1'
      
      try {
        blockInfo = getBlockForExercise(machineSessionContract?.executionPlan, exerciseIndex)
        if (blockInfo?.block) {
          isGrouped = blockInfo.block.groupType !== null && blockInfo.block.groupType !== undefined
          groupType = blockInfo.block.groupType
          blockLabel = blockInfo.block.blockLabel || ''
          memberIndex = blockInfo.memberIndex ?? 0
          memberCount = blockInfo.block.memberExercises?.length ?? 1
          currentRound = machineState.currentRound || 1
          targetRounds = blockInfo.block.targetRounds || 1
          memberLabel = groupType === 'superset' ? `A${memberIndex + 1}` : `${memberIndex + 1}`
        }
        console.log('[v0] [active_contract_group_context_resolved]', { isGrouped, groupType, blockLabel })
      } catch (groupErr) {
        console.error('[v0] [active_contract_group_context_failed]', groupErr instanceof Error ? groupErr.message : 'unknown')
        // Continue with defaults - don't throw
      }
      
      // STEP 3: Resolve input context safely
      const setNumber = validatedSetNumber ?? 1
      const isHoldExercise = activeEntryPreparation.isHoldExercise ?? false
      const targetValue = activeEntryPreparation.targetValue ?? 8
      const targetRPE = activeEntryPreparation.targetRPE ?? 8
      const recommendedBand = activeEntryPreparation.recommendedBand
      console.log('[v0] [active_contract_inputs_resolved]', { setNumber, isHoldExercise, targetValue })
      
      // [LIVE-WORKOUT-AUTHORITY] Resolve exercise input mode using authoritative resolver
      const inputModeContract = resolveExerciseInputMode({
        name: exerciseName,
        category: exerciseCategory,
        method: safeCurrentExercise?.method,
        executionTruth: safeCurrentExercise?.executionTruth,
        prescribedLoad: safeCurrentExercise?.prescribedLoad,
      })
      
      console.log('[LIVE-WORKOUT-AUTHORITY] Exercise input mode resolved', {
        exerciseName,
        inputMode: inputModeContract.mode,
        showBandSelector: inputModeContract.showBandSelector,
        showLoadInput: inputModeContract.showLoadInput,
        showRepsInput: inputModeContract.showRepsInput,
        showHoldInput: inputModeContract.showHoldInput,
      })
      
      // STEP 4: Resolve UI flags safely - using input mode contract
      // [LIVE-WORKOUT-AUTHORITY] Band selector visibility is owned EXCLUSIVELY by
      // the authoritative input mode contract. Secondary hints like recommendedBand,
      // notes, or preparation layer metadata MUST NOT widen it. For weighted_strength
      // and reps_per_side (weighted) modes, showBandSelector is hard-false and
      // downstream UI cannot re-enable band controls.
      const bandSelectable = inputModeContract.showBandSelector
      if (process.env.NODE_ENV === 'development' && !inputModeContract.showBandSelector && recommendedBand) {
        console.log('[v0] [band_ui_suppressed_by_contract]', {
          exerciseName,
          inputMode: inputModeContract.mode,
          recommendedBandIgnored: recommendedBand,
        })
      }
      const hasLoad = !!(safeCurrentExercise?.prescribedLoad?.load && safeCurrentExercise.prescribedLoad.load > 0)
      const loadDisplay = hasLoad 
        ? `+${safeCurrentExercise?.prescribedLoad?.load}${safeCurrentExercise?.prescribedLoad?.unit || 'lbs'}`
        : null
      
      // STEP 5: Resolve progress safely
      const completedSetsCount = machineState.completedSets?.length ?? 0
      const totalSets = exercises.reduce((sum, ex) => sum + (ex?.sets || 3), 0) || 3
      const totalExercises = exercises.length || 1
      
      // STEP 6: Resolve notes safely
      const currentSetNote = machineState.currentSetNote || ''
      const currentSetReasonTags = machineState.currentSetReasonTags || []
      
      console.log('[v0] [active_contract_build_success]')
      
      return {
        ok: true as const,
        stage: 'complete' as const,
        // Exercise context
        exerciseIndex,
        exerciseName,
        exerciseCategory,
        exerciseSets,
        exerciseRepsOrTime,
        exerciseNote,
        // Set context
        setNumber,
        isHoldExercise,
        targetValue,
        targetRPE,
        recommendedBand,
        // Grouped block context
        isGrouped,
        groupType,
        blockLabel,
        memberIndex,
        memberCount,
        currentRound,
        targetRounds,
        memberLabel,
        blockInfo,
        // UI flags
        bandSelectable,
        hasLoad,
        loadDisplay,
        // Progress
        completedSetsCount,
        totalSets,
        totalExercises,
        // Notes
        currentSetNote,
        currentSetReasonTags,
      }
    } catch (err) {
      console.error('[v0] [active_contract_build_failed]', err instanceof Error ? err.message : 'unknown')
      return fallbackContract
    }
  }, [
    safeExerciseIndex,
    safeCurrentExercise,
    validatedSetNumber,
    activeEntryPreparation,
    machineSessionContract?.executionPlan,
    machineState.currentRound,
    machineState.completedSets,
    machineState.currentSetNote,
    machineState.currentSetReasonTags,
    exercises,
  ])


  
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
  
  // ==========================================================================
  // [CANONICAL-RUNTIME-CONTRACT] Build the unified live execution contract
  // ==========================================================================
  // This is the SINGLE authoritative view for the current workout execution state.
  // All UI consumers should read from this contract instead of calling
  // getBlockForExercise() multiple times with potentially inconsistent inputs.
  const liveExecutionContract: LiveExecutionContract | null = useMemo(() => {
    // Only build contract when we have valid runtime truth
    if (!hasValidExercises || !exerciseRuntimeTruth || !sessionRuntimeTruth) {
      return null
    }
    
    try {
      return buildLiveExecutionContract({
        sessionTruth: sessionRuntimeTruth,
        exerciseTruth: exerciseRuntimeTruth,
        executionPlan: machineSessionContract?.executionPlan ?? null,
        currentExerciseIndex: safeExerciseIndex,
    currentSet: machineState.currentSet,
    currentRound: machineState.currentRound,
    // [WEEK-PROGRESSION-TRUTH] Use effective scaled sets
    targetSets: getEffectiveExerciseValues(safeCurrentExercise).sets,
    lastSetRPE: machineState.lastSetRPE ?? null,
  })
    } catch (err) {
      console.error('[v0] [live_execution_contract] Failed to build contract:', err)
      return null
    }
  }, [
    hasValidExercises,
    exerciseRuntimeTruth,
    sessionRuntimeTruth,
    machineSessionContract?.executionPlan,
    safeExerciseIndex,
    machineState.currentSet,
    machineState.currentRound,
    machineState.lastSetRPE,
    safeCurrentExercise?.sets,
  ])
  
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
  completedSetsCount: normalizedCompletedSets.length,
  hasValidExercises,
  exerciseCount: machineSessionContract?.exercises.length ?? 0,
  // [CANONICAL-RUNTIME-CONTRACT] Log canonical contract status
  liveContractBuilt: !!liveExecutionContract,
  liveContractGrouped: liveExecutionContract?.groupedContext !== null,
  liveContractMemberLabel: liveExecutionContract?.groupedContext?.memberLabel ?? null,
  })
  }
  // [CRASH-FIX] Use normalizedCompletedSets.length instead of direct machineState access
  }, [machineState.phase, machineState.currentExerciseIndex, machineState.currentSetNumber, normalizedCompletedSets.length, safeStatus, viewModel.phase, hasValidExercises, machineSessionContract, liveExecutionContract])
  
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
        // [ACTIVE-WEEK-PARITY] Use effective scaled sets/reps so Stage 1-5
        // never shows raw Week-1 dosage while mounting.
        currentExerciseSets: activeEffectiveContract.effectiveSets,
        currentExerciseRepsOrTime: activeEffectiveContract.effectiveRepsOrTime,
        currentExerciseNote: safeCurrentExercise?.note || '',
        hasNextExercise: false,
        nextExerciseName: null,
        nextExerciseCategory: null,
        isHoldType: false,
        hasLoad: false,
        isLastExercise: false,
        isLastSet: false,
        isWorkoutComplete: false,
        setDisplay: `Set ${validatedSetNumber || 1}/${activeEffectiveContract.effectiveSets}`,
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
  // [WEEK-PROGRESSION-TRUTH] Use effective values for total sets calculation
  const safeExerciseCount = exercises.length
  const safeTotalSets = exercises.reduce((sum, ex) => sum + getEffectiveExerciseValues(ex).sets, 0)
    const safeCompletedSetsCount = normalizedCompletedSets.length
    
    // Current exercise position - use centralized validation (already clamped/validated)
    const safeCurrentIndex = safeExerciseIndex
    const safeCurrentSetNumber = validatedSetNumber
    
    // Current exercise details (from safe contract)
    // [ACTIVE-WEEK-PARITY] Sets and repsOrTime come from the effective
    // contract so Week 2/3/4 scaled dosage powers the live session set
    // progress denominator and label.
    const currentExerciseName = safeCurrentExercise.name || 'Exercise'
    const currentExerciseCategory = safeCurrentExercise.category || 'general'
    const currentExerciseSets = activeEffectiveContract.effectiveSets
    const currentExerciseRepsOrTime = activeEffectiveContract.effectiveRepsOrTime
    const currentExerciseNote = safeCurrentExercise.note || ''
    
    // Next exercise info (bounded)
    const hasNextExercise = safeCurrentIndex < exercises.length - 1
    const nextExercise = hasNextExercise ? exercises[safeCurrentIndex + 1] : null
    const nextExerciseName = nextExercise?.name || null
    const nextExerciseCategory = nextExercise?.category || null
    
    // [LIVE-UNIT-CONTRACT] Unified hold detection - replaces local regex that
    // missed "6s" style hold prescriptions.
    const isHoldType = isHoldUnit({
      repsOrTime: currentExerciseRepsOrTime,
      name: safeCurrentExercise?.name,
      category: safeCurrentExercise?.category,
    })
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
    // [CRASH-FIX] Use machine-derived values instead of backward-compat liveSession to eliminate split truth
    safeExerciseIndex, 
    validatedSetNumber, 
    normalizedCompletedSets, 
    safeCurrentExercise,
    hasValidExercises,
    validatedCurrentExercise,
    // [ACTIVE-WEEK-PARITY] Effective contract powers set count + reps text
    activeEffectiveContract,
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
    // [CRASH-FIX] Use normalizedCompletedSets instead of liveSession.completedSets
    const { snapshot, isWorkoutComplete, guardError } = buildUnifiedTransitionSnapshot(
      liveSession,
      exercises,
      normalizedCompletedSets, // Use machine-derived completed sets
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
  // [UNIFIED-HANDOFF] liveSession is a computed view of machineState (see useMemo above)
  // so this save path is effectively saving machineState values
  useEffect(() => {
    // Demo sessions don't persist to storage
    if (isDemoSession) return

    // [DISCARD-INTENT-LOCK] If the user explicitly discarded this workout,
    // suppress autosave entirely until the component unmounts. Without this,
    // the re-render triggered by `setShowExitConfirm(false)` inside
    // handleDiscardAndExit caused this effect to rewrite the session to
    // storage *after* clearSessionStorage() had already cleared it -
    // silently resurrecting the workout the user just discarded.
    if (discardIntentRef.current) {
      console.log('[exit-intent] autosave suppressed: discardIntentRef is set')
      return
    }

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
    const shouldTick = (phase === 'active' || phase === 'resting' || phase === 'between_exercise_rest' || phase === 'block_round_rest') 
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
  // [LOGGED-VALUE-FIX] We need to log the DISPLAYED value, not the raw machine value
  // The user sees a seeded value (e.g., 6s from prescription) but machine holdValue might still be 30 (default)
  // So we must compute the same displayed value here to log what the user actually saw
  const handleCompleteSet = useCallback(() => {
    // [POST-COMMIT-FREEZE-TRACE-R3] STAGE B.
    // Prove the click reached the parent handler. Read (not allocate) the
    // tap trace id allocated by Stage A inside the corridor's handleLogSet
    // so the entire A -> G chain correlates on the same id. If tapTraceId
    // is null here, Stage A never fired -- meaning the click did not reach
    // the authoritative corridor button.
    const tapTraceId = readCurrentTapTraceId()
    console.log('[v0] [log-corridor] stageB handleCompleteSet entered (parent)', {
      tapTraceId,
      exerciseName: safeCurrentExercise?.name,
      exerciseIndex: safeExerciseIndex,
      setNumber: validatedSetNumber,
      priorPhase: machineState.phase,
      priorCompletedSetsLength: normalizedCompletedSets.length,
    })
    // [LIVE-STATE-SCANNER-R1] Latch parent-received onto the on-screen
    // scanner so screenshots prove the tap reached handleCompleteSet.
    // If the scanner stays on `stageA_only` after a tap, the click
    // never reached the parent handler.
    recordScannerStage('parent_received')
    
    const currentIndex = safeExerciseIndex
    
    // [LOGGED-VALUE-FIX] + [ACTIVE-WEEK-PARITY] Compute the DISPLAYED hold/reps
    // value that matches what the UI showed. The corridor seeds inputs from
    // the EFFECTIVE prescription text (see corridorRepsValue/corridorHoldValue
    // derivation below). Logging must mirror the exact same source, otherwise
    // on Week 2/3/4 a default-seed logged value would still be parsed from
    // raw Week-1 text ("6s") instead of the scaled text ("8s") the user saw.
    const exerciseRepsOrTime = activeEffectiveContract.effectiveRepsOrTime
    // [LIVE-UNIT-CONTRACT] Use the canonical hold detector. Previously this
    // path had its own independent regex variant that could disagree with the
    // activeEntryPreparation isHoldExercise value - creating a split-brain
    // where the UI showed a hold input but the log path still wrote reps.
    const isHoldExerciseForLog = isHoldUnit({
      repsOrTime: exerciseRepsOrTime,
      name: safeCurrentExercise?.name,
      category: safeCurrentExercise?.category,
    })
    const targetMatch = exerciseRepsOrTime.match(/(\d+)/)
    const prescriptionSeedValue = targetMatch ? parseInt(targetMatch[1], 10) : (isHoldExerciseForLog ? 30 : 8)
    
    // [LIVE-INPUT-SEED-FIX] Only the explicit 0 sentinel (set by the machine on
    // init, set completion, or exercise advance) triggers re-seeding from the
    // prescription. Previously the code ALSO treated safeRepsValue === 8 and
    // safeHoldValue === 30 as "default", which silently clamped truthful logs
    // back to the prescription lower bound whenever the user actually entered 8
    // or 30 as a real performance value. Never do that again.
    const machineRepsIsDefault = safeRepsValue === 0
    const machineHoldIsDefault = safeHoldValue === 0
    
    // [LIVE-UNIT-CONTRACT] Collapse activeEntryPreparation's isHoldExercise
    // with this site's isHoldExerciseForLog into one authoritative boolean so
    // upstream display truth and logging truth can never disagree. If either
    // source classifies this as a hold exercise, the log writes a hold.
    const isHoldForPersist = isHoldExercise || isHoldExerciseForLog
    
    // Log the value the user SAW (seeded from prescription if not modified, otherwise machine value)
    const loggedRepsValue = isHoldForPersist ? 0 : (machineRepsIsDefault ? prescriptionSeedValue : safeRepsValue)
    const loggedHoldValue = isHoldForPersist
      ? (machineHoldIsDefault ? prescriptionSeedValue : safeHoldValue)
      : undefined
    
    // [LIVE-LOG-CORRIDOR-SINGLE-OWNER] Compute blockInfo ONCE up front. The
    // payload builder reads it (for blockId/memberIndex) and the dispatch
    // decision reads it (for grouped vs straight). Two sites, one read -- no
    // split-brain on block identity between payload and routing.
    const blockInfo = getBlockForExercise(machineSessionContract?.executionPlan, currentIndex)

    // [LIVE-LOG-CORRIDOR-SINGLE-OWNER] Pure payload builder local to
    // handleCompleteSet. Replaces the prior inline setData literal (~50
    // lines mixed with the grouped-decision logic) so the commit corridor
    // shape is now explicit:
    //   handleCompleteSet = validate (button-disabled upstream)
    //                     + build payload  (this function, called ONCE)
    //                     + choose dispatch (grouped vs straight, below)
    //                     + dispatch       (exactly one machineDispatch)
    // Pure: reads only authoritative values captured in the enclosing
    // closure (machineState, safeCurrentExercise, corridor-seeded logged
    // values, blockInfo). Does NOT mutate state. Must not be called more
    // than once per tap -- multiple calls would only produce identical
    // payloads, but the pattern prevents any future caller from using this
    // as a second commit path.
    const buildSetDataPayload = (): CompletedSetData => {
      // [LIVE-WORKOUT-AUTHORITY] Resolve input mode for execution fact capture
      const inputMode = resolveExerciseInputMode({
        name: safeCurrentExercise?.name || '',
        category: safeCurrentExercise?.category,
        method: safeCurrentExercise?.method,
        executionTruth: safeCurrentExercise?.executionTruth,
        prescribedLoad: safeCurrentExercise?.prescribedLoad,
      })

      // [LIVE-WORKOUT-AUTHORITY] Capture structured coaching signals from reason tags
      const structuredCoachingInputs = (machineState.currentSetReasonTags || [])
        .filter((tag): tag is import('@/lib/workout/live-workout-authority-contract').CoachingSignalTag =>
          ['too_easy', 'too_hard', 'pain_discomfort', 'form_issue', 'fatigue', 'grip_limited', 'balance_issue', 'lost_focus', 'load_adjustment_used', 'mixed_band_assistance_used'].includes(tag)
        )

      return {
        exerciseIndex: currentIndex,
        setNumber: validatedSetNumber,
        actualReps: loggedRepsValue,
        holdSeconds: loggedHoldValue,
        actualRPE: safeSelectedRPE || 8,
        bandUsed: safeBandUsed,
        timestamp: Date.now(),
        // Per-set notes from machine state
        // [CRASH-FIX] Added null safety for currentSetReasonTags
        note: machineState.currentSetNote || undefined,
        reasonTags: (machineState.currentSetReasonTags?.length ?? 0) > 0 ? [...machineState.currentSetReasonTags] : undefined,
        // Grouped execution context
        blockId: blockInfo?.block.blockId,
        memberIndex: blockInfo?.memberIndex,
        round: machineState.currentRound || undefined,
        // [LIVE-WORKOUT-AUTHORITY] Extended execution facts
        inputMode: inputMode.mode,
        // Multi-band support - use selectedBands array directly, fall back to multiBandSelection for compatibility
        selectedBands: (machineState.selectedBands && machineState.selectedBands.length > 0)
          ? machineState.selectedBands
          : machineState.multiBandSelection?.bands,
        multiBandSelection: machineState.multiBandSelection,
        // Weighted exercise facts
        prescribedLoad: safeCurrentExercise?.prescribedLoad?.load,
        prescribedLoadUnit: safeCurrentExercise?.prescribedLoad?.unit,
        actualLoadUsed: machineState.actualLoadUsed ?? safeCurrentExercise?.prescribedLoad?.load,
        actualLoadUnit: machineState.actualLoadUnit || safeCurrentExercise?.prescribedLoad?.unit,
        // Unilateral exercise facts
        isPerSide: inputMode.showPerSideToggle || machineState.isPerSide,
        // Structured coaching inputs
        structuredCoachingInputs: structuredCoachingInputs.length > 0 ? structuredCoachingInputs : undefined,
      }
    }

    // Build exactly once per tap. Downstream dispatch branches reuse this.
    const setData: CompletedSetData = buildSetDataPayload()
      
      // [LIVE-LOG-CORRIDOR-FIX] Single authoritative grouped boolean.
      //
      // PREVIOUS (fragile): `blockInfo && blockInfo.block.groupType !== null`
      // That excluded only `null`, not `undefined`, and treated the mere
      // presence of a block wrapper as grouped. But getBlockForExercise()
      // (line ~343) returns a wrapper for EVERY exercise in the plan,
      // including straight single-member blocks where groupType is null
      // (by design, see flushCurrentBlock line ~252-276). If any plan
      // builder variant emitted `groupType: undefined` on a straight block
      // (the second builder at ~1807-1867 routes 'straight' -> null, but
      // any future or partially-constructed block with an unset groupType
      // would leak through `!== null`), a straight exercise like Planche
      // Leans would dispatch COMPLETE_BLOCK_SET and never advance the flat
      // set counter. The stricter authority at line ~3153 already excludes
      // both null AND undefined and treats only the known grouped types
      // as grouped. This site now matches that contract exactly.
      //
      // RULE: grouped iff blockInfo exists AND groupType is one of the four
      // canonical grouped methods. Straight exercises -> COMPLETE_SET.
      const rawGroupType = blockInfo?.block?.groupType
      const isTrulyGroupedExercise =
        blockInfo !== null &&
        rawGroupType !== null &&
        rawGroupType !== undefined &&
        (rawGroupType === 'superset' ||
          rawGroupType === 'circuit' ||
          rawGroupType === 'cluster' ||
          rawGroupType === 'density_block')
      
      // [POST-COMMIT-FREEZE-TRACE-R3] STAGE C.
      // Pre-dispatch decision. Carries the same tapTraceId captured at
      // Stage B so downstream reducer logs can correlate. Proves which
      // branch handleCompleteSet chose and why. If this prints
      // chosenDispatch: 'COMPLETE_SET' for a straight exercise, the branch
      // decision is correct and any remaining failure is downstream
      // (reducer entry/return or post-commit render).
      console.log('[v0] [log-corridor] stageC pre-dispatch decision', {
        tapTraceId,
        exerciseName: safeCurrentExercise?.name,
        exerciseIndex: currentIndex,
        effectiveRepsOrTime: activeEffectiveContract.effectiveRepsOrTime,
        effectiveSets: activeEffectiveContract.effectiveSets,
        blockInfoPresent: blockInfo !== null,
        rawGroupType,
        isTrulyGroupedExercise,
        chosenDispatch: isTrulyGroupedExercise ? 'COMPLETE_BLOCK_SET' : 'COMPLETE_SET',
      })
      
      if (isTrulyGroupedExercise && blockInfo) {
        // This is a grouped exercise - dispatch COMPLETE_BLOCK_SET instead
        console.log('[v0] [grouped] Completing set in grouped block:', {
          blockId: blockInfo.block.blockId,
          blockType: blockInfo.block.groupType,
          memberIndex: blockInfo.memberIndex,
          round: machineState.currentRound,
        })
        
        machineDispatch({
          type: 'COMPLETE_BLOCK_SET',
          completedSet: setData,
          block: blockInfo.block,
          memberIndex: blockInfo.memberIndex,
          round: machineState.currentRound || 1,
        })
        return
      }
      
      // Non-grouped set - use standard flat dispatch
      // [CRASH-FIX] Use validatedSetNumber instead of liveSession
      // [ACTIVE-WEEK-PARITY] Compare against EFFECTIVE scaled sets. Using the
      // raw .sets here caused isLastSet to fire on set 3 of 5 under Week 2
      // scaling, which triggers the inter-exercise rest transition one or
      // two sets early and advances the exercise pointer prematurely.
      const isLastSet = validatedSetNumber >= activeEffectiveContract.effectiveSets
      
      // [LIVE-WORKOUT-ADAPTIVE] Include target prescription for adaptive summary
      // [LIVE-WORKOUT-ACTION-PLANNER] Include exercise context for action planning
      // [LIVE-SESSION-FIX] Derive recommendedBand from safeCurrentExercise directly
      // This fixes the reference error where corridorRecommendedBand was defined after this callback
      const localRecommendedBand = safeCurrentExercise?.executionTruth?.recommendedBand as ResistanceBandColor | undefined
      
      // [RPE-REST-AUTHORITY] On the last set of the exercise, compute the real
      // inter-exercise rest NOW using the RPE being logged + exercise category
      // + current session fatigue. This is the SAME engine the rest card uses,
      // just seeded with the RPE of the set that just finished instead of the
      // prior lastSetRPE snapshot. The result is passed to the machine so the
      // green timer renders doctrine-backed rest -- never the legacy 120s
      // fallback -- whenever a valid RPE exists for the completed set.
      let computedInterExerciseRest: number | undefined
      if (isLastSet && typeof setData.actualRPE === 'number') {
        try {
          const priorSets = normalizedCompletedSets
          const avgRPE = priorSets.length > 0
            ? priorSets.reduce((sum, s) => sum + s.actualRPE, 0) / priorSets.length
            : setData.actualRPE
          const rec = getRestRecommendation(
            safeCurrentExercise,
            setData.actualRPE,
            {
              setNumber: validatedSetNumber,
              totalSetsCompleted: priorSets.length + 1,
              averageRPE: avgRPE,
            }
          )
          computedInterExerciseRest = rec.adjustedSeconds
          console.log('[RPE-REST-AUTHORITY] Computed inter-exercise rest', {
            exerciseName: safeCurrentExercise?.name,
            category: rec.category,
            baseSeconds: rec.baseSeconds,
            adjustedSeconds: rec.adjustedSeconds,
            justCompletedRPE: setData.actualRPE,
            adjustmentReason: rec.adjustment.reason,
            adjustmentType: rec.adjustment.type,
          })
        } catch (err) {
          console.warn('[RPE-REST-AUTHORITY] getRestRecommendation threw; machine fallback will apply', err)
        }
      }
      
      // [LIVE-LOG-CORRIDOR-PROOF] Stage 3: dispatching straight-set COMPLETE_SET.
      // Paired with stage-4 reducer log in lib/workout/live-workout-machine.ts
      // to prove the reducer ACTUALLY ran this case after dispatch.
      console.log('[v0] [log-corridor] stage3 dispatch COMPLETE_SET', {
        exerciseName: safeCurrentExercise?.name,
        exerciseIndex: currentIndex,
        setNumber: validatedSetNumber,
        isLastSet,
        effectiveSets: activeEffectiveContract.effectiveSets,
      })
      
      machineDispatch({
        type: 'COMPLETE_SET',
        completedSet: setData,
        isLastSetOfExercise: isLastSet,
        exerciseCount: exercises.length,
        // [LIVE-UNIT-CONTRACT] Use isHoldForPersist so target prescription
        // persists as hold iff the set was logged as hold.
        targetReps: isHoldForPersist ? undefined : prescriptionSeedValue,
        targetHoldSeconds: isHoldForPersist ? prescriptionSeedValue : undefined,
        // [ACTIVE-WEEK-PARITY] Persist EFFECTIVE target RPE and total
        // prescribed sets so the logged target prescription matches the
        // scaled dosage the user actually trained against (Week 2 = 5 sets
        // instead of base 3), and the adaptive summary sees the right
        // denominators for completion-rate calculations.
        targetRPE: activeEffectiveContract.effectiveTargetRPE,
        recommendedBand: localRecommendedBand,
        // Exercise context for action planning
        exerciseName: safeCurrentExercise?.name || '',
        totalPrescribedSets: activeEffectiveContract.effectiveSets,
        // [RPE-REST-AUTHORITY] Doctrine-backed rest seconds (category + RPE +
        // fatigue). Undefined when no RPE was logged; machine falls back to 120s.
        interExerciseRestSeconds: computedInterExerciseRest,
      })
    // [CRASH-FIX] Removed liveSession dep, use machine-derived values
    // [LOGGED-VALUE-FIX] Added safeCurrentExercise to deps for prescription seed derivation
    // [ACTIVE-WEEK-PARITY] activeEffectiveContract feeds the seed parse source
  // and isLastSet comparison above.
  }, [validatedSetNumber, safeRepsValue, safeHoldValue, safeSelectedRPE, safeBandUsed, safeCurrentExercise, safeExerciseIndex, isHoldExercise, exercises, machineSessionContract, machineState, machineDispatch, activeEffectiveContract])
  
  // =========================================================================
  // [LIVE-LOG-FINAL-PHASE-OWNER-SURGERY] MACHINE-DIRECT ADVANCE HELPER
  //
  // PROBLEM THIS REMOVES:
  //   Prior post-log rest-completion paths routed through executeUnifiedAdvance,
  //   which (a) read liveSession (the legacy flattener), (b) built an
  //   UnifiedTransitionSnapshot, and (c) re-dispatched through the legacy
  //   `dispatch` wrapper. That meant the live post-log transition corridor
  //   had TWO transition owners:
  //     1. the machine reducer (authoritative)
  //     2. the legacy wrapper (via executeUnifiedAdvance)
  //   Any drift in liveSession or snapshot computation could make the visible
  //   post-rest state disagree with reducer truth for one or more renders.
  //
  // WHAT THIS HELPER DOES:
  //   A single authoritative advance path that reads ONLY from:
  //     - machineState.currentExerciseIndex (authoritative exercise pointer)
  //     - exercises[] (contract exercise list)
  //     - normalizedCompletedSets (machine-derived completed-set ledger)
  //     - safeLastSetRPE (machine-derived RPE of last completed set)
  //   and dispatches ONLY through machineDispatch (never through the legacy
  //   dispatch wrapper).
  //
  //   Cleanups (clearRestTimerState, clearSessionStorage on workout-complete)
  //   and diagnostic transition traces are preserved bit-identical to the
  //   executeUnifiedAdvance behavior so no external observer sees a change
  //   in side effects.
  // =========================================================================
  const advanceToNextExerciseMachineDirect = useCallback((
    reason: 'inter_exercise_complete' | 'skip_inter_exercise'
  ) => {
    const currentIdx = machineState.currentExerciseIndex
    const nextIdx = currentIdx + 1
    const isWorkoutComplete = nextIdx >= exercises.length
    
    // Diagnostic breadcrumb (same stage names the prior executeUnifiedAdvance used)
    writeTransitionTrace({
      reason,
      transitionStage: 'requested',
      timestamp: Date.now(),
      safeIndexUsed: true,
    })
    writeTransitionTrace({
      transitionStage: 'computed',
      fromExerciseIndex: currentIdx,
      toExerciseIndex: isWorkoutComplete ? currentIdx : nextIdx,
      fromExerciseName: exercises[currentIdx]?.name ?? null,
      toExerciseName: isWorkoutComplete ? null : exercises[nextIdx]?.name ?? null,
      transitionType: isWorkoutComplete ? 'workout_complete' : 'next_exercise',
      beforeStateStatus: machineState.phase === 'between_exercise_rest' ? 'resting' : 'active',
      afterStateStatus: isWorkoutComplete ? 'completed' : 'active',
      safeExerciseCount: exercises.length,
      safeNextExerciseExists: !isWorkoutComplete && nextIdx < exercises.length,
    })
    
    console.log('[v0] [machine-direct-advance] start', {
      reason,
      fromIndex: currentIdx,
      toIndex: isWorkoutComplete ? currentIdx : nextIdx,
      isWorkoutComplete,
      phase: machineState.phase,
    })
    
    if (isWorkoutComplete) {
      // Dispatch authoritative COMPLETE_WORKOUT via machineDispatch only.
      // The reducer owns the state transition to phase:'completed' and the
      // final completedSets ledger.
      machineDispatch({
        type: 'COMPLETE_WORKOUT',
        finalCompletedSets: normalizedCompletedSets,
      })
      writeTransitionTrace({ transitionStage: 'committed' })
      clearRestTimerState()
      clearSessionStorage()
      return
    }
    
    // Parse target value from NEXT exercise's repsOrTime. Same parse the
    // reducer's ADVANCE_TO_NEXT_EXERCISE case expects in `targetValue`.
    const nextExercise = exercises[nextIdx]
    const nextRepsOrTime = nextExercise?.repsOrTime || ''
    const nextTargetMatch = nextRepsOrTime.match(/(\d+)/)
    const nextTargetValue = nextTargetMatch ? parseInt(nextTargetMatch[1], 10) : 5
    
    // Single authoritative dispatch. The reducer's ADVANCE_TO_NEXT_EXERCISE
    // case handles phase transition, set-number reset, band reset, etc.
    machineDispatch({
      type: 'ADVANCE_TO_NEXT_EXERCISE',
      nextIndex: nextIdx,
      targetValue: nextTargetValue,
    })
    
    writeTransitionTrace({ transitionStage: 'committed' })
    clearRestTimerState()
    
    console.log('[v0] [machine-direct-advance] complete', {
      toIndex: nextIdx,
      toExerciseName: nextExercise?.name,
      nextTargetValue,
    })
  }, [machineState.currentExerciseIndex, machineState.phase, exercises, normalizedCompletedSets, machineDispatch])
  
  // [UNIFIED-REST-HANDLER] Single handler for all rest completion
  // Checks machine phase to determine correct transition.
  //
  // [LIVE-LOG-FINAL-PHASE-OWNER-SURGERY] Both branches now dispatch ONLY
  // through machineDispatch. The between-exercise branch previously used
  // executeUnifiedAdvance (legacy dispatch + liveSession); it now uses
  // advanceToNextExerciseMachineDirect (machineDispatch + machineState).
  // Same-exercise rest was already machine-direct and is unchanged.
  const handleRestComplete = useCallback(() => {
    const currentPhase = machineState.phase
    
    if (currentPhase === 'resting') {
      // Same-exercise rest -> next set of same exercise
      clearRestTimerState()
      playTimerCompletionAlert()
      machineDispatch({ type: 'COMPLETE_REST' })
    } else if (currentPhase === 'between_exercise_rest') {
      // Between-exercise rest -> advance to next exercise (machine-direct)
      playTimerCompletionAlert()
      advanceToNextExerciseMachineDirect('inter_exercise_complete')
    }
  }, [machineState.phase, machineDispatch, advanceToNextExerciseMachineDirect])
  
  // [LIVE-LOG-FINAL-PHASE-OWNER-SURGERY] Legacy aliases kept for call-site
  // compatibility, but both now route through the machine-direct advance
  // helper. The legacy `dispatch` wrapper no longer participates in any
  // live post-log rest-completion path.
  const handleInterExerciseRestComplete = useCallback(() => {
    playTimerCompletionAlert()
    advanceToNextExerciseMachineDirect('inter_exercise_complete')
  }, [advanceToNextExerciseMachineDirect])
  
  const handleSkipInterExerciseRest = useCallback(() => {
    console.log('[LIVE-LOG-FINAL-PHASE-OWNER-SURGERY] handleSkipInterExerciseRest triggered (machine-direct)')
    advanceToNextExerciseMachineDirect('skip_inter_exercise')
  }, [advanceToNextExerciseMachineDirect])
  
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
  
  // [LIVE-WORKOUT-AUTHORITY] Skip current set only - advance to next set of same exercise
  const handleSkipSet = useCallback(() => {
    const exercise = exercises[safeExerciseIndex]
    const totalSets = exercise?.sets || 3
    const currentSet = machineState.currentSetNumber
    
    console.log('[LIVE-WORKOUT-AUTHORITY] handleSkipSet', {
      exerciseName: exercise?.name,
      currentSet,
      totalSets,
      remainingSets: totalSets - currentSet,
    })
    
    // Dispatch skip set action
    machineDispatch({
      type: 'SKIP_SET',
      totalSets,
      exerciseCount: exercises.length,
      reason: 'user_skipped',
    })
  }, [safeExerciseIndex, exercises, machineState.currentSetNumber, machineDispatch])
  
  // [LIVE-WORKOUT-AUTHORITY] End current exercise - skip all remaining sets and advance
  const handleEndExercise = useCallback(() => {
    const exercise = exercises[safeExerciseIndex]
    const totalSets = exercise?.sets || 3
    const currentSet = machineState.currentSetNumber
    
    console.log('[LIVE-WORKOUT-AUTHORITY] handleEndExercise', {
      exerciseName: exercise?.name,
      currentSet,
      totalSets,
      skippingSets: totalSets - currentSet + 1,
    })
    
    // Dispatch end exercise action
    machineDispatch({
      type: 'END_EXERCISE',
      totalSets,
      exerciseCount: exercises.length,
      reason: 'user_ended_exercise',
    })
  }, [safeExerciseIndex, exercises, machineState.currentSetNumber, machineDispatch])
  
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
  
  // [EXIT-INTENT-FIX] Save & Exit - preserves session for resume, then leaves
  // Does NOT clear session storage - allows user to resume later
  const handleSaveAndExit = useCallback(() => {
    // Clear only transient state (rest timers), keep workout session for resume
    clearRestTimerState()
    setShowExitConfirm(false)
    // Session storage is intentionally NOT cleared - workout can be resumed
    console.log('[exit-intent] Save & Exit: Preserving session for resume', {
      completedSets: normalizedCompletedSets.length,
      currentExerciseIndex: safeExerciseIndex,
    })
    onCancel()
  }, [normalizedCompletedSets.length, safeExerciseIndex, onCancel])
  
  // [EXIT-INTENT-FIX / DISCARD-INTENT-LOCK] Discard Workout - atomic no-resume exit.
  //
  // Execution order below is load-bearing:
  //   1. Flip `discardIntentRef` FIRST (synchronous, wins against any next
  //      autosave re-render caused by the setShowExitConfirm(false) below).
  //   2. Clear all persisted + transient state.
  //   3. Close the confirm dialog (this triggers a re-render -> autosave
  //      effect -> the ref check short-circuits it).
  //   4. Navigate away via onCancel().
  //
  // Save & Exit does NOT flip the ref (it preserves the workout).
  // Accidental close / backgrounding does NOT flip the ref either - autosave
  // remains the safety net for those.
  const handleDiscardAndExit = useCallback(() => {
    // [DISCARD-INTENT-LOCK] Step 1 - synchronous intent lock.
    discardIntentRef.current = true
    // Step 2 - purge all persistence surfaces.
    clearSessionStorage()
    clearRestTimerState()
    clearSessionOverrides()
    // Step 3 - close the confirm dialog. This causes one more render cycle
    // that re-fires the autosave useEffect. The ref check now wins.
    setShowExitConfirm(false)
    console.log('[exit-intent] Discard Workout: Cleared all session state (ref locked)')
    // Step 4 - navigate away.
    onCancel()
  }, [onCancel])
  
  // [BACK-NAVIGATION] Navigate backward through workout sets/exercises
  const handleGoBack = useCallback(() => {
    machineDispatch({ type: 'GO_BACK', exercises })
  }, [machineDispatch, exercises])
  
  // Compute whether user can go back (not at first set of first exercise)
  const canGoBack = safeExerciseIndex > 0 || validatedSetNumber > 1
  
  // ==========================================================================
  // [LIVE-WORKOUT-CORRIDOR] PHONE / SYSTEM BACK INTEGRATION
  // ==========================================================================
  // Android hardware back, iOS swipe-back, and desktop browser Back were
  // ejecting the user straight out of a live workout route -> Program page.
  // That is a corridor ownership failure: during a live session, system
  // back MUST map to the same in-app Back control the user sees on screen.
  //
  // Strategy:
  //   1. On mount (while session is live and has any progress), push a
  //      sentinel history entry so the first system-back press hits us,
  //      not the underlying /program entry.
  //   2. In popstate, route to handleGoBack when the user has progress to
  //      undo. When at the first set of the first exercise (nothing to
  //      unwind), show the exit confirm modal instead of silently leaving.
  //   3. After handling, re-push the sentinel so the NEXT system-back
  //      press is intercepted too. True exit only happens through the
  //      intentional Save & Exit / Discard paths (which call onCancel ->
  //      router navigation and do NOT pop through this interceptor).
  //   4. Cleanup removes the listener and (if we're the top entry) pops
  //      our own sentinel so we don't leak history noise.
  //
  // We use refs so the effect doesn't re-bind on every render and every
  // popstate always reads the latest canGoBack / handler.
  // ==========================================================================
  const canGoBackRef = useRef(canGoBack)
  canGoBackRef.current = canGoBack
  const handleGoBackRef = useRef(handleGoBack)
  handleGoBackRef.current = handleGoBack
  const safeStatusRef = useRef(safeStatus)
  safeStatusRef.current = safeStatus
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Only arm the interceptor while the session is interactive. If we
    // haven't reached active/resting/etc yet (ready) or we're already at
    // completed, let normal navigation happen.
    const interactiveStatuses = ['active', 'resting']
    if (!interactiveStatuses.includes(safeStatus)) return
    
    const SENTINEL = 'spartan_workout_session_sentinel'
    let sentinelArmed = false
    
    const armSentinel = () => {
      try {
        window.history.pushState({ [SENTINEL]: true }, '')
        sentinelArmed = true
      } catch {
        // no-op: some embedded browsers restrict pushState
      }
    }
    
    armSentinel()
    
    const onPopState = () => {
      console.log('[LIVE-WORKOUT-CORRIDOR] system back intercepted', {
        canGoBack: canGoBackRef.current,
        status: safeStatusRef.current,
      })
      if (canGoBackRef.current) {
        handleGoBackRef.current()
      } else {
        setShowExitConfirm(true)
      }
      // Re-arm so the next system-back press is also intercepted.
      armSentinel()
    }
    
    window.addEventListener('popstate', onPopState)
    
    return () => {
      window.removeEventListener('popstate', onPopState)
      // If we armed a sentinel and we're leaving while it's still on
      // the stack, pop it so we don't leave a phantom entry behind.
      if (sentinelArmed && typeof window.history.state === 'object' &&
          window.history.state?.[SENTINEL]) {
        try { window.history.back() } catch { /* no-op */ }
      }
    }
  }, [safeStatus])
  
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
    // [WEEK-PROGRESSION-TRUTH] Use effective scaled sets for completion check
    const isCompleted = completedSetCount >= getEffectiveExerciseValues(exercise).sets
        const bestReps = exerciseSets.length > 0 ? Math.max(...exerciseSets.map(s => s.actualReps)) : 0
        const bestHold = exerciseSets.length > 0 ? Math.max(...exerciseSets.map(s => s.holdSeconds || 0)) : 0
        const bandUsed = exerciseSets.find(s => s.bandUsed && s.bandUsed !== 'none')?.bandUsed
        
        return {
          id: exercise.id || `ex-${exerciseIndex}`,
    name: exercise.name,
    category: exercise.category as 'skill' | 'push' | 'pull' | 'core' | 'legs' | 'mobility',
    // [WEEK-PROGRESSION-TRUTH] Use effective scaled sets
    sets: getEffectiveExerciseValues(exercise).sets,
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
  
  // [JSX-STABILIZED] Precomputed render function for Today's Plan rows
  // Extracted from inline JSX to prevent ownership drift in complex ternary branches
  const renderTodayPlanRows = (): React.ReactNode => {
    // Priority 1: Authoritative styleMetadata grouped render
    if (safeSession.styleMetadata?.styledGroups && safeSession.styleMetadata.styledGroups.length > 0) {
      const previewGroupCounters: Record<string, number> = { superset: 0, circuit: 0, cluster: 0, density_block: 0 }
      
      return safeSession.styleMetadata.styledGroups.map((group, groupIdx) => {
        const isGrouped = group.groupType !== 'straight'
        
        let blockLetter = ''
        if (isGrouped && group.groupType && previewGroupCounters[group.groupType] !== undefined) {
          blockLetter = String.fromCharCode(65 + previewGroupCounters[group.groupType])
          previewGroupCounters[group.groupType]++
        }
        
        if (isGrouped) {
          const groupMethodInfo = group.groupType === 'superset' 
            ? 'Alternate between exercises with minimal rest'
            : group.groupType === 'circuit' 
            ? 'Complete all exercises in sequence, then rest'
            : group.groupType === 'cluster' 
            ? 'Short rest between reps for heavier loads'
            : 'High-intensity timed block'
          
          const baseLabel = group.groupType === 'superset' ? 'Superset'
            : group.groupType === 'circuit' ? 'Circuit'
            : group.groupType === 'cluster' ? 'Cluster Set'
            : 'Density Block'
          
          return (
            <div key={group.id} className="py-1.5 relative">
              <div className="absolute left-1 top-9 bottom-2 w-0.5 bg-gradient-to-b from-[#C1121F]/60 via-[#C1121F]/40 to-[#C1121F]/20 rounded-full" />
              <div className="flex items-center gap-2 py-1.5 mb-0.5">
                <span className="w-5 h-5 rounded bg-[#C1121F]/20 text-[#C1121F] text-[9px] flex items-center justify-center font-bold">
                  {group.groupType === 'superset' ? 'SS' : group.groupType === 'circuit' ? 'CR' : group.groupType === 'cluster' ? 'CL' : 'DB'}{blockLetter}
                </span>
                <span className="text-xs font-medium text-[#C1121F]">
                  {baseLabel}{blockLetter ? ` ${blockLetter}` : ''}
                </span>
                <span className="text-[9px] text-[#6B7280]/70 italic hidden sm:inline">{groupMethodInfo}</span>
                {group.instruction && <span className="text-[10px] text-[#6B7280] ml-auto">{group.instruction}</span>}
              </div>
              <div className="pl-3 space-y-0">
                {group.exercises.map((exInfo, memberIdx) => {
                  const fullEx = exercises.find(e => e.id === exInfo.id)
                  // [PRE-START-SHELL-WEEK-PARITY] Use effective scaled values
                  const effective = getEffectiveExerciseValues(fullEx)
                  return (
                    <div key={exInfo.id} className="flex items-center justify-between py-1.5 pl-4 border-b border-[#2B313A]/15 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-[9px] flex items-center justify-center font-semibold border border-[#C1121F]/30">
                          {exInfo.prefix || String.fromCharCode(65 + memberIdx)}
                        </span>
                        <span className="text-sm text-[#E6E9EF]">{exInfo.name}</span>
                      </div>
                      <span className="text-[11px] text-[#6B7280] tabular-nums">
                        {effective.sets}×{effective.repsOrTime}
                        {fullEx?.prescribedLoad && fullEx.prescribedLoad.load > 0 && (
                          <span className="ml-1 text-[#C1121F] font-medium">@ +{fullEx.prescribedLoad.load}{fullEx.prescribedLoad.unit}</span>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        } else {
          const exInfo = group.exercises[0]
          const fullEx = exercises.find(e => e.id === exInfo?.id)
          const globalIndex = safeSession.styleMetadata!.styledGroups
            .slice(0, groupIdx)
            .reduce((sum, g) => sum + g.exercises.length, 0) + 1
          
          if (!exInfo || !fullEx) return null
          
          // [PRE-START-SHELL-WEEK-PARITY] Use effective scaled values
          const effective = getEffectiveExerciseValues(fullEx)
          return (
            <div key={group.id} className="flex items-center justify-between py-1.5 border-b border-[#2B313A]/30 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2B313A] text-[#6B7280] text-[10px] flex items-center justify-center font-medium">{globalIndex}</span>
                <span className="text-sm text-[#E6E9EF]">{exInfo.name}</span>
              </div>
              <span className="text-[11px] text-[#6B7280] tabular-nums">
                {effective.sets}×{effective.repsOrTime}
                {fullEx.prescribedLoad && fullEx.prescribedLoad.load > 0 && (
                  <span className="ml-1 text-[#C1121F] font-medium">@ +{fullEx.prescribedLoad.load}{fullEx.prescribedLoad.unit}</span>
                )}
              </span>
            </div>
          )
        }
      })
    }
    
    // Priority 2: Fallback executionPlan grouped render
    if (executionPlan.hasGroupedBlocks) {
      return executionPlan.blocks.map((block, blockIdx) => {
        const isGrouped = block.groupType !== null
        
        if (isGrouped) {
          const groupMethodInfo = block.groupType === 'superset' 
            ? 'Alternate between exercises with minimal rest'
            : block.groupType === 'circuit' 
            ? 'Complete all exercises in sequence, then rest'
            : block.groupType === 'density_block'
            ? 'High-intensity timed block'
            : 'Short rest between reps for heavier loads'
          
          return (
            <div key={block.blockId} className="py-1.5 relative">
              <div className="absolute left-1 top-9 bottom-2 w-0.5 bg-gradient-to-b from-[#C1121F]/60 via-[#C1121F]/40 to-[#C1121F]/20 rounded-full" />
              <div className="flex items-center gap-2 py-1.5 mb-0.5">
                <span className="w-5 h-5 rounded bg-[#C1121F]/20 text-[#C1121F] text-[9px] flex items-center justify-center font-bold">
                  {block.groupType === 'superset' ? 'SS' : block.groupType === 'circuit' ? 'CR' : block.groupType === 'density_block' ? 'DB' : 'CL'}
                </span>
                <span className="text-xs font-medium text-[#C1121F]">{block.blockLabel}</span>
                <span className="text-[9px] text-[#6B7280]/70 italic hidden sm:inline">{groupMethodInfo}</span>
                <span className="text-[10px] text-[#6B7280] ml-auto">{block.targetRounds} rounds</span>
              </div>
              <div className="pl-3 space-y-0">
                {block.memberExercises.map((ex, memberIdx) => {
                  // [PRE-START-SHELL-WEEK-PARITY] Use effective scaled values
                  const effective = getEffectiveExerciseValues(ex)
                  return (
                  <div key={ex.id} className="flex items-center justify-between py-1.5 pl-4 border-b border-[#2B313A]/15 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#C1121F]/10 text-[#C1121F] text-[9px] flex items-center justify-center font-semibold border border-[#C1121F]/30">
                        {String.fromCharCode(65 + memberIdx)}
                      </span>
                      <span className="text-sm text-[#E6E9EF]">{ex.name}</span>
                    </div>
                    <span className="text-[11px] text-[#6B7280] tabular-nums">
                      {effective.sets}×{effective.repsOrTime}
                      {ex.prescribedLoad && ex.prescribedLoad.load > 0 && (
                        <span className="ml-1 text-[#C1121F] font-medium">@ +{ex.prescribedLoad.load}{ex.prescribedLoad.unit}</span>
                      )}
                    </span>
                  </div>
                  )
                })}
              </div>
            </div>
          )
        } else {
          const ex = block.memberExercises[0]
          const globalIndex = executionPlan.blocks
            .slice(0, blockIdx)
            .reduce((sum, b) => sum + b.memberExercises.length, 0) + 1
          // [PRE-START-SHELL-WEEK-PARITY] Use effective scaled values
          const effective = getEffectiveExerciseValues(ex)
          return (
            <div key={block.blockId} className="flex items-center justify-between py-1.5 border-b border-[#2B313A]/30 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#2B313A] text-[#6B7280] text-[10px] flex items-center justify-center font-medium">{globalIndex}</span>
                <span className="text-sm text-[#E6E9EF]">{ex.name}</span>
              </div>
              <span className="text-[11px] text-[#6B7280] tabular-nums">
                {effective.sets}×{effective.repsOrTime}
                {ex.prescribedLoad && ex.prescribedLoad.load > 0 && (
                  <span className="ml-1 text-[#C1121F] font-medium">@ +{ex.prescribedLoad.load}{ex.prescribedLoad.unit}</span>
                )}
              </span>
            </div>
          )
        }
      })
    }
    
    // Priority 3: Flat render - no grouped blocks
    return exercises.map((ex, i) => {
      // [PRE-START-SHELL-WEEK-PARITY] Use effective scaled values
      const effective = getEffectiveExerciseValues(ex)
      return (
      <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#2B313A]/30 last:border-0">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#2B313A] text-[#6B7280] text-[10px] flex items-center justify-center font-medium">{i + 1}</span>
          <span className="text-sm text-[#E6E9EF]">{ex.name}</span>
        </div>
        <span className="text-[11px] text-[#6B7280] tabular-nums">
          {effective.sets}×{effective.repsOrTime}
          {ex.prescribedLoad && ex.prescribedLoad.load > 0 && (
            <span className="ml-1 text-[#C1121F] font-medium">@ +{ex.prescribedLoad.load}{ex.prescribedLoad.unit}</span>
          )}
        </span>
      </div>
      )
    })
  }
  
  // [LIVE-WORKOUT-MACHINE] Use safeStatus from machine
  if (safeStatus === 'ready') {
    // [LIVE-TRUE-ISOLATION-R5] Mark that we entered the ready shell branch.
    // If the route-level boundary fires while this is the last known stage,
    // the failure happened during pre-start shell rendering, not live.
    markLiveBootStage('ready_shell_render', {
      phase: machineState.phase,
    })
    // [LIVE-PHASE-ASSERTION] Guard against ready render during live execution
    if (machineState.completedSets.length > 0 || machineState.startTime !== null) {
      console.error('[v0] [LIVE-PHASE-ASSERTION] BUG: Ready shell entered with active progress!', {
        machinePhase: machineState.phase,
        completedSetsCount: machineState.completedSets.length,
        startTime: machineState.startTime,
        currentExerciseIndex: machineState.currentExerciseIndex,
        currentSetNumber: machineState.currentSetNumber,
      })
    }
    
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
            {/* [PRE-START-SHELL-WEEK-PARITY] Acclimation / protection copy
                MUST be gated on resolved LIVE week truth, not the base
                session's adaptationPhase. Previously this branch fired
                "Week 1 — Volume conservatively managed for adaptation."
                even when the user had tapped Start Workout from a
                Week 2/3/4 Program card, because the audit object is
                built off the base session and does not downgrade when
                scaling is applied. The resolved week signal we use is
                `weekScalingApplied` on any exercise: week scaling only
                fires for week > 1 (see scaleSessionForWeek in
                lib/program/week-scaling.ts), so if ANY exercise has
                it true, we are past the acclimation week and must
                suppress the Week 1 copy. */}
            {(() => {
              const readyShellWeekScalingApplied = exercises.some(
                ex => getEffectiveExerciseValues(ex).weekScalingApplied
              )
              const baseAdaptationPhase = safeSession.prescriptionPropagationAudit?.adaptationPhase
              const showAcclimationCopy =
                baseAdaptationPhase === 'initial_acclimation' && !readyShellWeekScalingApplied
              const showRecoveryCopy =
                baseAdaptationPhase === 'recovery_constrained'
              return (
                <>
                  {showAcclimationCopy && (
                    <p className="text-[11px] text-amber-400/80 mt-2 px-4 text-center">
                      Week 1 — Volume conservatively managed for adaptation.
                    </p>
                  )}
                  {showRecoveryCopy && (
                    <p className="text-[11px] text-amber-400/80 mt-2 px-4 text-center">
                      Recovery focus — Intensity reduced this week.
                    </p>
                  )}
                </>
              )
            })()}
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
            {/* [GROUPED-PLAN-FIX] Render grouped structure in Today's Plan */}
            {/* [JSX-STABILIZED] Precomputed rows for stable JSX ownership */}
            {renderTodayPlanRows()}
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
    
    // ========================================================================
    // PRE-SAVE: Show final reflection before committing workout
    // This is NOT the completion screen - it's the final "are you ready to save" screen
    // ========================================================================
    if (!isSaved) {
      // Validate duration for display - show only if plausible (< 4 hours)
      const durationMinutes = Math.round(safeElapsedSeconds / 60)
      const isDurationValid = durationMinutes > 0 && durationMinutes < 240
      
      return (
        <div className="min-h-screen bg-[#0F1115] p-4 sm:p-6">
          <div className="max-w-lg mx-auto pt-6 space-y-5">
            {/* Pre-save Header - Clear state indication */}
            <div className="text-center mb-2">
              <div className="w-16 h-16 rounded-full bg-[#C1121F]/10 border-2 border-[#C1121F]/50 flex items-center justify-center mx-auto mb-3">
                <Dumbbell className="w-8 h-8 text-[#C1121F]" />
              </div>
              <h1 className="text-xl font-bold text-[#E6E9EF] mb-1">{safeSession.dayLabel}</h1>
              <p className="text-sm text-[#A4ACB8]">
                {stats.completedSets}/{stats.totalSets} sets
                {isDurationValid && ` • ${durationMinutes} min`}
              </p>
            </div>
            
            {/* Quick Log - Difficulty Selection */}
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
            
            {/* Optional Workout Notes */}
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
              {isSaving ? 'Saving...' : 'Save & Complete'}
            </Button>
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

    
    // ========================================================================
    // POST-SAVE: Authoritative completion screen
    // This is the ONLY completion screen - workout is saved, show the recap
    // ========================================================================
    const isPartialSession = stats.completedSets < stats.totalSets * 0.5
    
    // Validate duration - only show if plausible (< 4 hours)
    const durationMinutes = Math.round(safeElapsedSeconds / 60)
    const isDurationValid = durationMinutes > 0 && durationMinutes < 240
    const displayDuration = isDurationValid ? `${durationMinutes}m` : null
    
    return (
      <div className="min-h-screen bg-[#0F1115] p-4 sm:p-6">
        <div className="max-w-lg mx-auto space-y-4 pt-6">
          
          {/* ================================================================
              1. COMPLETION HERO - Clear end-state anchor
              ================================================================ */}
          <div className="text-center pb-2">
            <div className={`w-16 h-16 rounded-full ${isPartialSession ? 'bg-amber-500/10 border-amber-500' : 'bg-green-500/10 border-green-500'} border-2 flex items-center justify-center mx-auto mb-3`}>
              <CheckCircle2 className={`w-8 h-8 ${isPartialSession ? 'text-amber-400' : 'text-green-400'}`} />
            </div>
            <h1 className="text-xl font-bold text-[#E6E9EF] mb-1">
              {isPartialSession ? 'Session Logged' : 'Session Complete'}
            </h1>
            <p className="text-sm text-[#A4ACB8]">
              {safeSession.dayLabel}
            </p>
          </div>
          
          {/* ================================================================
              2. METRICS ROW - Compact, trustworthy stats
              ================================================================ */}
          <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
            <div className={`grid ${displayDuration ? 'grid-cols-3' : 'grid-cols-2'} gap-4 text-center`}>
              <div>
                <p className="text-lg font-bold text-[#E6E9EF]">{stats.completedSets}</p>
                <p className="text-[10px] text-[#6B7280] uppercase">Sets</p>
              </div>
              {displayDuration && (
                <div>
                  <p className="text-lg font-bold text-[#E6E9EF]">{displayDuration}</p>
                  <p className="text-[10px] text-[#6B7280] uppercase">Duration</p>
                </div>
              )}
              <div>
                <p className="text-lg font-bold text-[#E6E9EF]">
                  {stats.averageRPE ? stats.averageRPE.toFixed(1) : '-'}
                </p>
                <p className="text-[10px] text-[#6B7280] uppercase">Avg RPE</p>
              </div>
            </div>
          </Card>
          
          {/* ================================================================
              3. PRIMARY OUTCOME - Performance insight
              ================================================================ */}
          <Card className={`p-3 ${
            performance.performanceTier === 'excellent' ? 'bg-green-500/5 border-green-500/20' :
            performance.performanceTier === 'strong' ? 'bg-blue-500/5 border-blue-500/20' :
            performance.performanceTier === 'solid' ? 'bg-[#1A1F26] border-[#2B313A]' :
            'bg-orange-500/5 border-orange-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                performance.performanceTier === 'excellent' ? 'border-green-500/50 bg-green-500/10' :
                performance.performanceTier === 'strong' ? 'border-blue-500/50 bg-blue-500/10' :
                performance.performanceTier === 'solid' ? 'border-[#2B313A] bg-[#2B313A]/50' :
                'border-orange-500/50 bg-orange-500/10'
              }`}>
                <span className={`text-sm font-bold ${
                  performance.performanceTier === 'excellent' ? 'text-green-400' :
                  performance.performanceTier === 'strong' ? 'text-blue-400' :
                  performance.performanceTier === 'solid' ? 'text-[#A4ACB8]' :
                  'text-orange-400'
                }`}>
                  {performance.performanceScore}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E6E9EF]">{performance.summary}</p>
              </div>
            </div>
          </Card>
          
          {/* ================================================================
              4. SECONDARY INSIGHTS - Skill & Band progress (if relevant)
              ================================================================ */}
          {(skillSignal || bandProgressNote) && (
            <div className="flex flex-wrap gap-2">
              {skillSignal && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs text-purple-300">{skillSignal}</span>
                </div>
              )}
              {bandProgressNote && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-blue-300">{bandProgressNote}</span>
                </div>
              )}
            </div>
          )}
          
          {/* ================================================================
              5. NEXT SESSION PREVIEW
              ================================================================ */}
          {nextSessionInfo && (
            <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#4F6D8A]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#4F6D8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#6B7280] uppercase">Up Next</p>
                  <p className="text-sm font-medium text-[#E6E9EF]">{nextSessionInfo.dayLabel}</p>
                  <p className="text-xs text-[#A4ACB8]">{nextSessionInfo.focusLabel}</p>
                </div>
              </div>
            </Card>
          )}
          
          {/* ================================================================
              6. NAVIGATION ACTIONS
              ================================================================ */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={onComplete}
              className="w-full h-12 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-semibold"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
            <Link href="/program" className="block">
              <Button
                variant="outline"
                className="w-full h-10 border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#1A1F26]"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Program
              </Button>
            </Link>
          </div>
          
          {/* ================================================================
              7. MONETIZATION - Demoted below navigation, quieter styling
              ================================================================ */}
          {!hasProAccess() && (
            <Card className="bg-[#1A1F26]/50 border-[#2B313A]/50 p-3 mt-4">
              <Link href="/upgrade" className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400/70" />
                  <span className="text-xs text-[#6B7280]">Unlock deeper insights with Pro</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6B7280]" />
              </Link>
            </Card>
          )}
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
  // [ISOLATED-ACTIVE-CORRIDOR] BYPASS ENTIRE FRAGILE HOOK CHAIN
  // This returns the isolated ActiveWorkoutStartCorridor component BEFORE
  // any of the complex derivation chains (unit status, render functions, etc.)
  // execute. This is the key fix - we must return EARLY to avoid the hooks.
  //
  // [LIVE-LOG-COMMIT-SURVIVAL] GATE READS machineState.phase DIRECTLY.
  // Previously this gate read `safeStatus`, which is a backward-compat
  // mapping that collapses 4+ live execution phases into 2 values. That
  // mapping is harmless as a read, but using it as the corridor-render
  // gate meant a backward-compat layer was deciding which live screen
  // mounted. Any render-tick where `safeStatus` lagged behind
  // machineState.phase (e.g. memo recomputation order) could briefly
  // remount a different branch. Reading machineState.phase directly
  // guarantees the gate decision is bit-identical to the authoritative
  // reducer output with zero intermediate ownership.
  // ==========================================================================
  const livePhase = machineState.phase
  const isLiveExecutionPhase =
    livePhase === 'active' ||
    livePhase === 'resting' ||
    livePhase === 'between_exercise_rest' ||
    livePhase === 'block_round_rest' ||
    livePhase === 'transitioning'
  
  // =========================================================================
  // [HOOK-CONTRACT-FIX] Post-commit observability (Stage F) used to live
  // here as a `useRef` + `useEffect` pair. Those hooks were declared BELOW
  // the component-level `if (safeStatus === 'ready') { return ... }` and
  // `if (safeStatus === 'completed') { return ... }` early returns, which
  // meant the parent's hook count changed between renders whenever the
  // status transitioned across those branches - the exact shape of React
  // error #310 that the production diagnostic footer reported as
  // `ready_shell_render`. Since those hooks are strictly live-only
  // concerns, they now live inside LiveWorkoutExecutionSurface, which is
  // only mounted during live execution phases. The parent component now
  // declares NO hooks after any conditional component-level return.
  // =========================================================================

  if (isLiveExecutionPhase) {
    // [LIVE-TRUE-ISOLATION-R5] Stage marker fired the instant we enter the
    // live render branch. If this stage is set on crash, the parent hook
    // chain ran successfully and the failure is downstream (snapshot
    // build, live surface, or corridor). If this stage is NOT set on
    // crash, the failure happened up in the parent hook/effect/useMemo
    // chain BEFORE we ever reached the live branch.
    markLiveBootStage('live_branch_entered', {
      phase: machineState.phase,
      exerciseIndex: safeExerciseIndex,
    })
    
    // [LIVE-LOG-COMMIT-SURVIVAL] corridorMode is derived DIRECTLY from
    // machineState.phase. No safeStatus compatibility layer.
    const corridorMode =
      livePhase === 'block_round_rest'
        ? ('block_round_rest' as const)
        : livePhase === 'resting' || livePhase === 'between_exercise_rest'
          ? ('resting' as const)
          : ('active' as const)
    const isBlockRoundRest = livePhase === 'block_round_rest'

    // [LIVE-LOG-CORRIDOR-PROOF] stage_screen_rendered_authoritative
    // Proves which render branch is actually mounting. If this log prints
    // during a user's live workout, the authoritative ActiveWorkoutStartCorridor
    // path is live. If instead a `stage_screen_rendered_LEGACY_UNIT_contract_violation`
    // or `stage_screen_rendered_LEGACY_STAGE1_contract_violation` log prints
    // for the same render tick, the single-owner contract is broken and the
    // corridor early-return above is no longer short-circuiting the legacy
    // paths. This is the first log that must appear in any Log Set chain.
    console.log('[v0] [log-corridor] stage_screen_rendered_authoritative', {
      safeStatus,
      corridorMode,
      exerciseName: safeCurrentExercise?.name,
      exerciseIndex: safeExerciseIndex,
      currentSetNumber: validatedSetNumber,
      completedSetsCount: normalizedCompletedSets?.length ?? 0,
      phase: machineState.phase,
    })
    
    // [ISOLATED-ACTIVE-CORRIDOR] Derive simple safe values for the corridor
    // These are plain reads from machine state - no complex derivations
    
    // [DEFAULT-INPUT-SEEDING] + [ACTIVE-WEEK-PARITY] Parse target values from
    // the EFFECTIVE (scaled) prescription text. This is what paints the
    // default hold/reps input the user first sees; using raw base text would
    // seed Week-1 defaults ("6" for Planche Leans) even when Week 2/3/4
    // scaled truth calls for a different value.
    const exerciseRepsOrTime = activeEffectiveContract.effectiveRepsOrTime
    // [LIVE-UNIT-CONTRACT] Canonical hold detector replaces previous local
    // regex (`.includes('sec') || .includes('hold') || .includes('s ')`)
    // which still missed terminal-s shorthand like "6s" and could disagree
    // with activeEntryPreparation's isHoldExercise, producing the split-brain
    // where the display showed reps but logging wrote hold or vice versa.
    const isHoldExerciseForDefault = isHoldUnit({
      repsOrTime: exerciseRepsOrTime,
      name: safeCurrentExercise?.name,
      category: safeCurrentExercise?.category,
    })
    const targetMatch = exerciseRepsOrTime.match(/(\d+)/)
    const prescriptionSeedValue = targetMatch
      ? parseInt(targetMatch[1], 10)
      : (isHoldExerciseForDefault ? 30 : 8)
    
    // [DEFAULT_SEED_DECISION] Deterministic seeding rule:
    // The machine sets repsValue/holdValue to 0 on init, on COMPLETE_SET, and
    // on ADVANCE_TO_NEXT_EXERCISE as a re-seed sentinel. ONLY that explicit 0
    // value triggers display seeding from prescription truth. Previously we
    // ALSO treated 8 (reps) / 30 (hold) as "default" which silently clamped
    // legit user entries of 8 or 30 back to the prescription lower bound -
    // that was the "reps feel capped near target" bug. Never again.
    const machineRepsIsDefault = safeRepsValue === 0
    const machineHoldIsDefault = safeHoldValue === 0
    
    // Seed from prescription only if machine still holds the 0 sentinel.
    // Otherwise the user's actual entered value is authoritative.
    const corridorRepsValue = machineRepsIsDefault ? prescriptionSeedValue : safeRepsValue
    const corridorHoldValue = isHoldExerciseForDefault 
      ? (machineHoldIsDefault ? prescriptionSeedValue : safeHoldValue)
      : (safeHoldValue > 0 ? safeHoldValue : 30)
    
    const corridorCurrentSetNote = machineState.currentSetNote || ''
    const corridorCurrentSetReasonTags = (machineState.currentSetReasonTags || []) as import('./ActiveWorkoutStartCorridor').SetReasonTag[]
    const corridorRecommendedBand = safeCurrentExercise?.executionTruth?.recommendedBand as ResistanceBandColor | undefined
    
    // [LIVE-WORKOUT-AUTHORITY] Use authoritative input mode resolver for corridor
    const corridorInputMode = resolveExerciseInputMode({
      name: safeCurrentExercise?.name || '',
      category: safeCurrentExercise?.category,
      method: safeCurrentExercise?.method,
      executionTruth: safeCurrentExercise?.executionTruth,
      prescribedLoad: safeCurrentExercise?.prescribedLoad,
    })
    
    console.log('[LIVE-WORKOUT-AUTHORITY] Corridor input mode', {
      exerciseName: safeCurrentExercise?.name,
      inputMode: corridorInputMode.mode,
      showBandSelector: corridorInputMode.showBandSelector,
      showLoadInput: corridorInputMode.showLoadInput,
    })
    
    // [LIVE-WORKOUT-AUTHORITY] Band selector visibility is owned ONLY by the
    // authoritative input mode contract. A recommendedBand hint on executionTruth
    // is metadata, not UI permission - it must never re-open band controls for
    // weighted_strength or unilateral weighted modes.
    const corridorBandSelectable = corridorInputMode.showBandSelector
    if (process.env.NODE_ENV === 'development' && !corridorInputMode.showBandSelector && corridorRecommendedBand) {
      console.log('[v0] [corridor_band_ui_suppressed_by_contract]', {
        exerciseName: safeCurrentExercise?.name,
        inputMode: corridorInputMode.mode,
        recommendedBandIgnored: corridorRecommendedBand,
      })
    }
    
    // Build recent sets for ledger (last 3 completed sets)
    // [RECENT-SETS-FIX] Filter recent sets by CURRENT EXERCISE only, not global last 3
    // [REFRESH-DUPLICATE-SET-FIX] LEDGER RENDER HARDENING (layer 4 of 4)
    // Last-line safety guard: dedupe by (exerciseIndex, setNumber),
    // keep-first, so even if an upstream duplicate ever slipped through
    // all three earlier layers, the ledger never shows two identical
    // "Set 2" rows for the same exercise. This is a render-only filter
    // - the authoritative completedSets array on machineState is NEVER
    // mutated by this pass.
    const currentExerciseCompletedSetsRaw = normalizedCompletedSets.filter(
      s => s.exerciseIndex === safeExerciseIndex
    )
    const seenCorridorKeys = new Set<number>()
    const currentExerciseCompletedSets = currentExerciseCompletedSetsRaw.filter(s => {
      if (seenCorridorKeys.has(s.setNumber)) {
        console.log('[REFRESH-DUPLICATE-SET-FIX] corridor recent-sets render dropped duplicate row', {
          exerciseIndex: s.exerciseIndex,
          setNumber: s.setNumber,
        })
        return false
      }
      seenCorridorKeys.add(s.setNumber)
      return true
    })
    // [LIVE-WORKOUT-AUTHORITY] Include extended execution facts in recent sets
    const corridorRecentSets = currentExerciseCompletedSets.slice(-3).map(set => ({
      setNumber: set.setNumber,
      actualReps: set.actualReps || 0,
      holdSeconds: set.holdSeconds,
      actualRPE: set.actualRPE as RPEValue,
      bandUsed: set.bandUsed as ResistanceBandColor | 'none' | undefined,
      reasonTags: set.reasonTags as import('./ActiveWorkoutStartCorridor').SetReasonTag[] | undefined,
      // [LIVE-WORKOUT-AUTHORITY] Extended execution facts
      inputMode: set.inputMode,
      selectedBands: set.selectedBands,
      actualLoadUsed: set.actualLoadUsed,
      actualLoadUnit: set.actualLoadUnit,
    isPerSide: set.isPerSide,
    structuredCoachingInputs: set.structuredCoachingInputs,
    // [COMPLETED-SET-NOTE-SURFACE] Free-text coaching note passthrough so
    // the active and rest-screen set ledgers can show a subtle indicator
    // + preview line, closing the "did my note save?" trust gap. Does not
    // alter reducer/machine/persistence contracts - this is a display-only
    // pass-through of an already-persisted field.
    note: typeof (set as { note?: unknown }).note === 'string'
      ? ((set as { note?: string }).note as string)
      : undefined,
  }))
    

    
    // Note handlers (simple dispatches)
    const handleSetNote = (note: string) => {
      machineDispatch({ type: 'SET_CURRENT_SET_NOTE', note })
    }
    const handleToggleReasonTag = (tag: import('./ActiveWorkoutStartCorridor').SetReasonTag) => {
      machineDispatch({ type: 'TOGGLE_REASON_TAG', tag })
    }
    
    // =====================================================================
    // [LIVE-LOG-PHASE-OWNER-SURGERY] SINGLE-OWNER REST SUBTYPE DERIVATION
    //
    // PROBLEM OBSERVED (from screen recording):
    //   After Log Set on Planche Leans Set 1/5, the UI momentarily flashes
    //   through the green "Exercise Complete! Up Next Tuck Front Lever Hold"
    //   between-exercise rest card before stabilizing. The reducer can only
    //   produce phase:'between_exercise_rest' for the FINAL set of an
    //   exercise, so this flash implies a stale / re-entrant dispatch path
    //   was briefly forcing that phase even with only 1 of 5 sets completed.
    //
    // SINGLE-OWNER CONTRACT APPLIED HERE:
    //   The between-exercise rest card is allowed to render IFF both:
    //     (a) machineState.phase === 'between_exercise_rest', AND
    //     (b) the ACTUAL completed-set history proves this exercise is done
    //         (i.e. completedSets.filter(exerciseIndex === current).length
    //          is >= the effective prescribed sets for the current exercise)
    //
    //   This invariant is a render-time truth filter, NOT a parallel owner.
    //   It reads ONLY from machineState (completedSets) and the effective
    //   contract (prescribed sets). It cannot produce a false positive and
    //   cannot mutate state. If a second owner somehow flips phase to
    //   between_exercise_rest prematurely, the invariant denies the render
    //   and the user continues to see the correct same-exercise rest card.
    //
    //   Conversely, on the LEGITIMATE last-set path, completedSets already
    //   contains the just-logged final set (reducer appends before returning
    //   between_exercise_rest), so the invariant passes bit-identically to
    //   the prior behavior - zero regression for real between-exercise rest.
    // =====================================================================
    const currentExerciseCompletedCount = normalizedCompletedSets.filter(
      s => s.exerciseIndex === safeExerciseIndex
    ).length
    const currentExerciseFullyCompleted =
      currentExerciseCompletedCount >= activeEffectiveContract.effectiveSets
    const rawPhaseIsBetweenExercise = machineState.phase === 'between_exercise_rest'
    const isBetweenExerciseRest = rawPhaseIsBetweenExercise && currentExerciseFullyCompleted
    
    // Diagnostic: if the reducer produced between_exercise_rest but the
    // completed-set history disagrees, log the exact mismatch so the
    // upstream dispatch responsible for the premature phase flip becomes
    // visible in logs. The invariant above still protects the render.
    if (rawPhaseIsBetweenExercise && !currentExerciseFullyCompleted) {
      console.warn('[v0] [log-corridor] BETWEEN_EXERCISE_REST_PREMATURE_PHASE_FILTERED', {
        currentExerciseIndex: safeExerciseIndex,
        exerciseName: safeCurrentExercise?.name,
        currentExerciseCompletedCount,
        prescribedSets: activeEffectiveContract.effectiveSets,
        machinePhase: machineState.phase,
        completedSetsTotal: normalizedCompletedSets.length,
        hint: 'render filter denied Exercise-Complete rest card because current exercise has not reached its final set. Root cause upstream.',
      })
    }
    
    const restType = isBlockRoundRest ? 'block_round' as const :
                     isBetweenExerciseRest ? 'between_exercise' as const : 'same_exercise' as const
    
    // Block round rest props (for grouped methods)
    const currentBlock = getBlockForExercise(machineSessionContract?.executionPlan, machineState.currentExerciseIndex)
    const blockLabel = currentBlock?.block.blockLabel || 'Block'
    const blockGroupType = currentBlock?.block.groupType as 'superset' | 'circuit' | 'cluster' | 'emom' | undefined
    const currentRound = machineState.currentRound || 1
    const targetRounds = currentBlock?.block.targetRounds || 3
    // [GROUPED-IDENTITY-FIX] Derive member exercises from authoritative ExecutionBlock data
    // Machine's ExecutionBlock stores full memberExercises array with MachineExercise objects
const blockMemberExercises = currentBlock?.block.memberExercises?.map(ex => ({
  id: ex.id,
  name: ex.name,
  })) || []
  const blockRoundRestSeconds = machineState.blockRoundRestSeconds || 90
  // [CANONICAL-RUNTIME-CONTRACT] Use the canonical live execution contract for grouped member identity
  // This ensures all surfaces read from the same authoritative source
  const groupedMemberIndex = liveExecutionContract?.groupedContext?.memberIndex ?? null
    
    // Handler for block round rest completion
    const handleBlockRoundRestComplete = () => {
      machineDispatch({ type: 'COMPLETE_BLOCK_ROUND_REST' })
    }
    
    // Derive next exercise for between-exercise transitions
    const nextExerciseIndex = safeExerciseIndex + 1
    const nextExercise = nextExerciseIndex < exercises.length ? exercises[nextExerciseIndex] : null
    const nextExerciseName = nextExercise?.name
    
    // [REST-CORRIDOR-SINGLE-OWNER] Rest duration flows through one authoritative
    // decision path. Block-round rest is owned by the block prescription. For
    // between-exercise and same-exercise rest, priority is:
    //   1. RPE-aware computation (getRestRecommendation) when last-set RPE is known
    //   2. Exercise's own prescribed restSeconds
    //   3. Doctrine resolveRestTime as final fallback
    //
    // [RPE-AUTHORITY-OVER-PRESCRIPTION] This priority swap is the fix for the
    // "green timer uses default path" complaint. Previously prescribed
    // restSeconds won over RPE adaptation, so a last set of RPE 9.5 got the
    // same rest as a last set of RPE 7, even though the rest engine has
    // explicit RPE -> rest delta logic (rest-intelligence.ts). When the user
    // logs a real RPE, that RPE must drive rest -- prescription becomes the
    // floor only when no RPE has been logged yet.
    const getRestDuration = (): number => {
      let restSource = 'unknown'
      let restValue = 90
      const lastRPE = (safeLastSetRPE as number | null) ?? null
      
      // ---- BLOCK ROUND REST ------------------------------------------------
      if (isBlockRoundRest) {
        restSource = 'block_round_rest_prescribed'
        restValue = blockRoundRestSeconds
      }
      // ---- BETWEEN-EXERCISE REST -------------------------------------------
      else if (isBetweenExerciseRest) {
        if (lastRPE != null && safeCurrentExercise) {
          // Priority 1: RPE-aware rest for the JUST-COMPLETED exercise.
          // This respects category + RPE + fatigue, which is exactly the
          // doctrine the user expects the green timer to honor.
          try {
            const priorSets = normalizedCompletedSets
            const avgRPE = priorSets.length > 0
              ? priorSets.reduce((sum, s) => sum + s.actualRPE, 0) / priorSets.length
              : lastRPE
            const rec = getRestRecommendation(
              safeCurrentExercise,
              lastRPE,
              {
                setNumber: validatedSetNumber,
                totalSetsCompleted: priorSets.length,
                averageRPE: avgRPE,
              }
            )
            restSource = 'rpe_aware_between_exercise'
            restValue = rec.adjustedSeconds
          } catch {
            restSource = 'rpe_aware_threw_fallback'
            restValue = nextExercise?.restSeconds || machineState.interExerciseRestSeconds || 90
          }
        } else if (nextExercise?.restSeconds && nextExercise.restSeconds > 0) {
          // Priority 2: next exercise's prescribed rest
          restSource = 'next_exercise_prescribed_restSeconds'
          restValue = nextExercise.restSeconds
        } else if (nextExercise) {
          // Priority 3: doctrine-aligned derivation from next exercise truth
          const rec = resolveRestTime({
            restType: 'between_exercises',
            exerciseCategory: (safeCurrentExercise?.category || 'general'),
            exerciseName: safeCurrentExercise?.name || '',
            targetRPE: nextExercise.targetRPE || 8,
            actualRPE: lastRPE,
            isHoldBased: false,
            groupType: null,
            nextExerciseCategory: nextExercise.category,
            nextExerciseName: nextExercise.name,
          })
          restSource = 'doctrine_between_exercises'
          restValue = rec.seconds
        } else {
          // Priority 4: controlled machine fallback
          restSource = 'machine_inter_exercise_fallback'
          restValue = machineState.interExerciseRestSeconds || 90
        }
      }
      // ---- SAME-EXERCISE REST ----------------------------------------------
      else {
        if (lastRPE != null && safeCurrentExercise) {
          // Priority 1: RPE-aware rest for the ongoing exercise.
          try {
            const priorSets = normalizedCompletedSets
            const avgRPE = priorSets.length > 0
              ? priorSets.reduce((sum, s) => sum + s.actualRPE, 0) / priorSets.length
              : lastRPE
            const rec = getRestRecommendation(
              safeCurrentExercise,
              lastRPE,
              {
                setNumber: validatedSetNumber,
                totalSetsCompleted: priorSets.length,
                averageRPE: avgRPE,
              }
            )
            restSource = 'rpe_aware_same_exercise'
            restValue = rec.adjustedSeconds
          } catch {
            restSource = 'rpe_aware_threw_fallback'
            // [ACTIVE-WEEK-PARITY] Prefer scaled rest when loader scaled it
            restValue = activeEffectiveContract.effectiveRestSeconds ?? 90
          }
        } else if (activeEffectiveContract.effectiveRestSeconds && activeEffectiveContract.effectiveRestSeconds > 0) {
          // Priority 2: current exercise's prescribed rest
          // [ACTIVE-WEEK-PARITY] Use effective rest so scaledRestPeriod wins
          // when the loader applied week scaling; otherwise this falls back
          // to base restSeconds identically to before.
          restSource = 'current_exercise_prescribed_restSeconds'
          restValue = activeEffectiveContract.effectiveRestSeconds
        } else {
          // Priority 3: doctrine-aligned derivation.
          // [LIVE-UNIT-CONTRACT] + [ACTIVE-WEEK-PARITY] Use canonical hold
          // detector on EFFECTIVE repsOrTime so doctrine sees the scaled
          // prescription text for "6s"/"8s" style classification.
          const isHoldBased = isHoldUnit({
            repsOrTime: activeEffectiveContract.effectiveRepsOrTime,
            name: safeCurrentExercise?.name,
            category: safeCurrentExercise?.category,
          })
          const rec = resolveRestTime({
            restType: 'between_sets',
            exerciseCategory: (safeCurrentExercise?.category || 'general'),
            exerciseName: safeCurrentExercise?.name || '',
            // [ACTIVE-WEEK-PARITY] Prefer scaledTargetRPE when present
            targetRPE: activeEffectiveContract.effectiveTargetRPE,
            actualRPE: lastRPE,
            isHoldBased,
            groupType: null,
          })
          restSource = 'doctrine_same_exercise_no_rpe'
          restValue = rec.seconds
        }
      }
      
      // [REST-SOURCE-AUDIT] Log rest derivation for debugging
      console.log('[v0] [rest_source_audit]', {
        restType: isBlockRoundRest ? 'block_round' : isBetweenExerciseRest ? 'between_exercise' : 'same_exercise',
        restSource,
        restValue,
        exerciseName: safeCurrentExercise?.name,
        exercisePrescribedRest: safeCurrentExercise?.restSeconds,
        lastSetRPE: safeLastSetRPE,
        nextExerciseName: nextExercise?.name,
        nextExercisePrescribedRest: nextExercise?.restSeconds,
        nextExerciseTargetRPE: nextExercise?.targetRPE,
      })
      
      return restValue
    }
    
    // =====================================================================
    // [LIVE-TRUE-ISOLATION-R5] BUILD THE FLAT LIVE SNAPSHOT + HAND OFF TO
    // LiveWorkoutExecutionSurface.
    //
    // This is the ONLY live-render handoff surface. The surface is a
    // narrow adapter that renders ActiveWorkoutStartCorridor behind its
    // own error boundary and validates every field at the boundary.
    //
    // Snapshot construction is wrapped in try/catch so that a degenerate
    // value (a throw inside any of the machine-pure derivations above)
    // can be attributed to `live_snapshot_build` rather than to the
    // surface render or to the corridor render itself. The route-level
    // error footer reads this stage attribution to narrow diagnosis.
    //
    // Fields consolidated here were previously scattered inline across
    // 40+ corridor JSX props. Every source is machine-pure:
    //   - machineState
    //   - safeCurrentExercise (indexed by machineState.currentExerciseIndex)
    //   - activeEffectiveContract (week-scaled effective prescription)
    //   - corridor-scoped derivations from earlier in this block
    //     (corridorRepsValue, corridorHoldValue, corridorRecentSets,
    //      isHoldExerciseForDefault, corridorMode, corridorInputMode,
    //      corridorBandSelectable, corridorRecommendedBand, etc.)
    //
    // Explicitly NOT sourced from: liveSession, existingSession,
    // viewModel, or any safeStatus compatibility mapping.
    // =====================================================================
    markLiveBootStage('live_snapshot_build', {
      phase: machineState.phase,
      currentSetNumber: validatedSetNumber,
      completedSetsCount: normalizedCompletedSets?.length ?? 0,
    })
    
    const liveSnapshot: LiveWorkoutSnapshot = (() => {
      try {
        const snapshot: LiveWorkoutSnapshot = {
          // Mode & labels
          mode: corridorMode,
          sessionLabel: safeDisplayLabel || 'Workout',
          // [HOOK-CONTRACT-FIX] Raw machine phase handed to the live surface
          // so its post-commit observability effect (previously a parent-body
          // hook below the ready-shell conditional return - root cause of
          // React error #310) can do reversion detection without relying on
          // the lossy `mode` projection.
          machinePhase: machineState.phase,
          // Exercise identity
          exerciseName: safeCurrentExercise?.name || 'Exercise',
          exerciseCategory: safeCurrentExercise?.category || 'general',
          // Week-scaled prescription (effective contract)
          exerciseSets: activeEffectiveContract.effectiveSets,
          exerciseRepsOrTime: activeEffectiveContract.effectiveRepsOrTime,
          targetRPE: activeEffectiveContract.effectiveTargetRPE,
          // Optional prescribed weighted load
          prescribedLoad:
            safeCurrentExercise?.prescribedLoad?.load &&
            safeCurrentExercise.prescribedLoad.load > 0
              ? {
                  load: safeCurrentExercise.prescribedLoad.load,
                  unit: safeCurrentExercise.prescribedLoad.unit || 'lbs',
                  confidenceLevel: safeCurrentExercise.prescribedLoad.confidenceLevel,
                }
              : undefined,
          // Flat progression (machine-direct)
          currentSetNumber: validatedSetNumber || 1,
          currentExerciseIndex: safeExerciseIndex || 0,
          totalExercises: exercises?.length || 1,
          completedSetsCount: normalizedCompletedSets?.length || 0,
          totalSetsCount: totalSets || 3,
          elapsedSeconds: safeElapsedSeconds || 0,
          // Inputs (machine-direct via seeding helpers)
          repsValue: corridorRepsValue,
          holdValue: corridorHoldValue,
          selectedRPE: safeSelectedRPE,
          bandUsed: safeBandUsed || 'none',
          // Notes (machine-direct)
          currentSetNote: corridorCurrentSetNote,
          currentSetReasonTags: corridorCurrentSetReasonTags,
          // Ledger (machine-direct)
          recentSets: corridorRecentSets,
          // Hold primary-input contract (same isHoldUnit() as persistence)
          isHoldExercise: isHoldExerciseForDefault,
          // Commit survival (machine-direct)
          lastCommitRevision: normalizedCompletedSets.length,
          // Input mode contract
          inputMode: corridorInputMode.mode,
          showLoadInput: corridorInputMode.showLoadInput,
          showMultiBandSelector:
            corridorBandSelectable && corridorInputMode.showMultiBandSelector,
          showPerSideToggle: corridorInputMode.showPerSideToggle,
          primaryInputLabel: corridorInputMode.primaryInputLabel,
          // Band config
          bandSelectable: corridorBandSelectable,
          recommendedBand: corridorBandSelectable ? corridorRecommendedBand : undefined,
          selectedBands: corridorBandSelectable ? (machineState.selectedBands || []) : [],
          // Weighted inputs (machine-direct)
          actualLoadUsed: machineState.actualLoadUsed,
          actualLoadUnit: machineState.actualLoadUnit,
          isPerSide: machineState.isPerSide,
          // Rest
          restDurationSeconds: getRestDuration(),
          lastSetRPE: safeLastSetRPE,
          restType,
          nextExerciseName,
          // Block round rest
          blockLabel,
          blockGroupType,
          currentRound,
          targetRounds,
          blockMemberExercises,
          blockRoundRestSeconds,
          groupedMemberIndex,
          // Coaching
          coachingExpression: buildCoachingExpression(machineState.currentActionPlan),
          // Build chips (unchanged contract)
          routeBuildChip,
          parentBuildChip: SWS_BUILD_CHIP,
          // Back nav
          canGoBack,
        }
        
        // [log-corridor] Stage 6: snapshot passed to corridor. Proves the
        // parent handoff values AFTER reducer commit.
        console.log('[v0] [log-corridor] stage6 active snapshot passed to corridor', {
          mode: snapshot.mode,
          phase: machineState.phase,
          currentExerciseIndex: snapshot.currentExerciseIndex,
          currentSetNumber: snapshot.currentSetNumber,
          completedSetsCount: snapshot.completedSetsCount,
          recentSetsLength: snapshot.recentSets?.length ?? 0,
          selectedRPE: snapshot.selectedRPE,
          repsValue: snapshot.repsValue,
          holdValue: snapshot.holdValue,
          isHoldExercise: snapshot.isHoldExercise,
        })
        
        markLiveBootStage('live_snapshot_build_succeeded', {
          mode: snapshot.mode,
          currentSetNumber: snapshot.currentSetNumber,
        })
        return snapshot
      } catch (snapshotError) {
        const err = snapshotError as Error
        markLiveBootStage('live_snapshot_build_failed', {
          errorName: err?.name,
          errorMessage: err?.message?.slice(0, 200),
        })
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(
              'spartanlab_live_boot_failure',
              JSON.stringify({
                stage: 'live_snapshot_build',
                errorName: err?.name ?? 'Error',
                errorMessage: err?.message?.slice(0, 200) ?? '',
                timestamp: Date.now(),
              })
            )
          }
        } catch {}
        throw snapshotError
      }
    })()
    
    // [LIVE-TRUE-ISOLATION-R5] All handlers flattened into one plain object.
    // The surface forwards these to the corridor verbatim. No handler
    // creation or memoization happens inside the surface itself.
    const liveHandlers: LiveWorkoutHandlers = {
      onCompleteSet: handleCompleteSet,
      onSetReps: setRepsValue,
      onSetHold: setHoldValue,
      onSetRPE: setSelectedRPE,
      onSetBand: setBandUsed,
      onSetNote: handleSetNote,
      onToggleReasonTag: handleToggleReasonTag,
      onSetSelectedBands: (bands) => machineDispatch({ type: 'SET_SELECTED_BANDS', bands }),
      onSetActualLoad: (load, unit) => machineDispatch({ type: 'SET_ACTUAL_LOAD', load, unit }),
      onSetIsPerSide: (isPerSide) => machineDispatch({ type: 'SET_IS_PER_SIDE', isPerSide }),
      onExit: () => setShowExitConfirm(true),
      onSaveAndExit: handleSaveAndExit,
      onDiscardWorkout: handleDiscardAndExit,
      onSkipSet: handleSkipSet,
      onEndExercise: handleEndExercise,
      onSkip: handleSkipExercise,
      onRestComplete: handleRestComplete,
      onGoBack: handleGoBack,
      onBlockRoundRestComplete: handleBlockRoundRestComplete,
    }
    
    return <LiveWorkoutExecutionSurface snapshot={liveSnapshot} handlers={liveHandlers} />
  }

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
  // [ACTIVE-ENTRY-CONTRACT] Now reads from activeEntryContract for progress values
  const renderHeaderUnit = (): React.ReactNode => {
    // [LIVE-RENDER-SOURCE-LOCK] Belt-and-suspenders single-owner guard.
    // The isLiveExecutionPhase early-return at line ~6066 already returns
    // <ActiveWorkoutStartCorridor/> before this function can run during a
    // live workout. This hard-block prevents any future regression where
    // a legacy unit header could silently render above the authoritative
    // corridor during active/resting/transitioning phases.
    if (isLiveExecutionPhase) {
      console.warn('[v0] [log-corridor] LEGACY_UNIT_HEADER_BLOCKED_DURING_LIVE_PHASE', { livePhase })
      return null
    }
    if (!unitStatus.header.enabled) return null
    try {
      unitStatus.header.rendered = true
      
      // Read progress values from activeEntryContract
      const {
        exerciseIndex: contractExerciseIndex,
        completedSetsCount: contractCompletedSets,
        totalSets: contractTotalSets,
        totalExercises: contractTotalExercises,
      } = activeEntryContract
      
      return (
        <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
          <div className="px-4 py-2.5">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-[#E6E9EF] truncate max-w-[160px]">{safeDisplayLabel}</span>
                  <span className="text-xs text-[#6B7280]">{contractExerciseIndex + 1}/{contractTotalExercises}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280]">{contractCompletedSets}/{contractTotalSets}</span>
                  <span className="font-mono text-sm font-bold text-[#E6E9EF] tabular-nums">{formatDuration(safeElapsedSeconds)}</span>
                </div>
              </div>
              <div className="h-1 bg-[#2B313A] rounded-full overflow-hidden">
                <div className="h-full bg-[#C1121F] transition-all duration-300" style={{ width: `${(contractCompletedSets / Math.max(contractTotalSets, 1)) * 100}%` }} />
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
  
  // UNIT 2: Exercise - renders current exercise card with grouped block indicator
  // [ACTIVE-ENTRY-CONTRACT] Now reads from activeEntryContract for all values
  const renderExerciseUnit = (): React.ReactNode => {
    // [LIVE-RENDER-SOURCE-LOCK] Belt-and-suspenders single-owner guard.
    if (isLiveExecutionPhase) {
      console.warn('[v0] [log-corridor] LEGACY_UNIT_EXERCISE_BLOCKED_DURING_LIVE_PHASE', { livePhase })
      return null
    }
    if (!unitStatus.exercise.enabled) return null
    try {
      unitStatus.exercise.rendered = true
      
      // Read all values from the authoritative activeEntryContract
      const {
        exerciseName,
        exerciseCategory,
        exerciseSets,
        exerciseRepsOrTime,
        setNumber,
        targetRPE: contractTargetRPE,
        isGrouped,
        groupType,
        blockLabel,
        memberIndex,
        currentRound,
        targetRounds,
        memberLabel,
        blockInfo,
      } = activeEntryContract
      
      return (
        <>
          {/* Grouped Block Card (if in superset/circuit) */}
          {isGrouped && blockInfo && (
            <Card className="bg-amber-500/5 border-amber-500/20 p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/10 text-amber-400 border-0 text-[10px] uppercase px-2 py-0.5">
                    {groupType ? (GROUP_TYPE_LABELS[groupType] || 'Block') : 'Block'}
                  </Badge>
                  <span className="text-sm font-medium text-[#E6E9EF]">{blockLabel}</span>
                </div>
                <span className="text-xs text-[#A4ACB8]">
                  Round {currentRound}/{targetRounds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {blockInfo.block.memberExercises?.map((ex, idx) => {
                  const isCurrent = idx === memberIndex
                  const isCompleted = idx < memberIndex
                  const label = groupType === 'superset' ? `A${idx + 1}` : `${idx + 1}`
                  return (
                    <div 
                      key={ex.id} 
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
                        isCurrent 
                          ? 'bg-[#C1121F]/10 border border-[#C1121F]/30 text-[#E6E9EF]' 
                          : isCompleted
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-[#2B313A]/50 text-[#6B7280]'
                      }`}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="truncate max-w-[80px]">{ex.name}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
          
          {/* Current Exercise Card */}
          {/* [EXPLAIN-OWNER-LOCK] Extract programPrimaryGoal ONCE at card level for all explanation lines */}
          {(() => {
            // Extract programPrimaryGoal from compositionMetadata - this is the PROGRAM's skill goal
            // NOT the sessionIntent. Used by BOTH purpose line AND effort line.
            const programPrimaryGoal = (safeSession?.compositionMetadata as Record<string, unknown> | undefined)?.programPrimaryGoal as string | undefined
            const resolvedPrimaryGoal = programPrimaryGoal || safeSession?.compositionMetadata?.sessionIntent || safeSession?.styleMetadata?.primaryStyle
            
            return (
          <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
                  {exerciseCategory}
                </Badge>
                {isGrouped && (
                  <span className="text-xs font-medium text-amber-400">{memberLabel}</span>
                )}
              </div>
            </div>
            <h2 className="text-lg font-bold text-[#E6E9EF] leading-tight">{exerciseName}</h2>
            {/* [PHASE-MICROCOPY] Reason-first microcopy using authoritative buildExercisePurposeLine */}
            {(() => {
              const purposeLine = safeCurrentExercise ? buildExercisePurposeLine(
                {
                  name: safeCurrentExercise.name,
                  category: exerciseCategory,
                  selectionReason: safeCurrentExercise.selectionReason || undefined,
                  isPrimary: exerciseCategory === 'skill',
                  coachingMeta: safeCurrentExercise.coachingMeta,
                },
                {
                  sessionFocus: safeSession?.focus || safeSession?.styleMetadata?.primaryStyle,
                  // [EXPLAIN-OWNER-LOCK] Use programPrimaryGoal (the actual skill goal) for context-aware explanation
                  primaryGoal: resolvedPrimaryGoal,
                  compositionMetadata: safeSession?.compositionMetadata,
                }
              ) : null
              
              // Fallback to loadDecisionSummary or short selectionReason
              const displayText = purposeLine 
                || safeCurrentExercise?.coachingMeta?.loadDecisionSummary
                || (safeCurrentExercise?.selectionReason && safeCurrentExercise.selectionReason.length < 50 ? safeCurrentExercise.selectionReason : null)
              
              return displayText ? (
                <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{displayText}</p>
              ) : null
            })()}
            {/* Target prescription with meaningful framing */}
            <div className="flex items-center gap-2 mt-1.5 text-sm">
              <span className="text-[#A4ACB8]">Target:</span>
              <span className="text-[#E6E9EF] font-medium">{exerciseRepsOrTime}</span>
            </div>
            {/* [EFFORT-REASON-LINE] Authoritative RPE/dosage explanation */}
            <p className="text-[10px] text-[#6B7280] mt-1 leading-snug">
              {buildExerciseEffortReasonLine(
                {
                  name: safeCurrentExercise?.name,
                  category: exerciseCategory,
                  targetRPE: contractTargetRPE,
                  selectionReason: safeCurrentExercise?.selectionReason || undefined,
                  isPrimary: exerciseCategory === 'skill',
                  isProtected: (safeCurrentExercise as AdaptiveExercise)?.isProtected,
                  coachingMeta: safeCurrentExercise?.coachingMeta,
                },
                {
                  sessionFocus: safeSession?.focus || safeSession?.styleMetadata?.primaryStyle,
                  // [EXPLAIN-OWNER-LOCK] Use resolvedPrimaryGoal for goal-aware effort explanations
                  primaryGoal: resolvedPrimaryGoal,
                }
              )}
            </p>
            {/* [PHASE-MICROCOPY] Rest guidance as supporting line only when meaningful */}
            {safeCurrentExercise?.restSeconds && safeCurrentExercise.restSeconds >= 90 && (exerciseCategory === 'skill' || exerciseCategory === 'strength' || exerciseCategory === 'pull' || exerciseCategory === 'push') && (
              <p className="text-[10px] text-[#6B7280]/80 mt-1">
                {safeCurrentExercise.restSeconds >= 180 
                  ? `Rest ${Math.floor(safeCurrentExercise.restSeconds / 60)}+ min to preserve output quality`
                  : safeCurrentExercise.restSeconds >= 120
                  ? `Rest ${Math.floor(safeCurrentExercise.restSeconds / 60)} min for quality recovery`
                  : `Rest ${Math.floor(safeCurrentExercise.restSeconds / 60)}:${String(safeCurrentExercise.restSeconds % 60).padStart(2, '0')} between sets`
                }
              </p>
            )}
            {/* Set progress for grouped: shows round progress instead of linear sets */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 flex-1">
                {isGrouped ? (
                  // For grouped blocks, show round progress
                  Array.from({ length: targetRounds }).map((_, idx) => (
                    <div key={idx} className={`h-2 flex-1 rounded-full ${idx < currentRound - 1 ? 'bg-green-500' : idx === currentRound - 1 ? 'bg-[#C1121F]' : 'bg-[#2B313A]'}`} />
                  ))
                ) : (
                  // For non-grouped, show set progress
                  Array.from({ length: exerciseSets }).map((_, idx) => (
                    <div key={idx} className={`h-2 flex-1 rounded-full ${idx < setNumber - 1 ? 'bg-green-500' : idx === setNumber - 1 ? 'bg-[#C1121F]' : 'bg-[#2B313A]'}`} />
                  ))
                )}
              </div>
              <span className="text-sm font-medium text-[#E6E9EF]">
                {isGrouped 
                  ? `Round ${currentRound}/${targetRounds}`
                  : `Set ${setNumber}/${exerciseSets}`
                }
              </span>
            </div>
          </Card>
            )
          })()}
        </>
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
  // [ACTIVE-ENTRY-CONTRACT] Now reads from activeEntryContract for context values
  const [showSetNotes, setShowSetNotes] = useState(false)
  
  const handleToggleReasonTag = (tag: SetReasonTag) => {
    machineDispatch({ type: 'TOGGLE_REASON_TAG', tag })
  }
  
  const handleSetNote = (note: string) => {
    machineDispatch({ type: 'SET_CURRENT_SET_NOTE', note })
  }
  
  const renderInputsUnit = (): React.ReactNode => {
    // [LIVE-RENDER-SOURCE-LOCK] Belt-and-suspenders single-owner guard.
    if (isLiveExecutionPhase) {
      console.warn('[v0] [log-corridor] LEGACY_UNIT_INPUTS_BLOCKED_DURING_LIVE_PHASE', { livePhase })
      return null
    }
    if (!unitStatus.inputs.enabled) return null
    try {
      unitStatus.inputs.rendered = true
      
      // Read all values from the authoritative activeEntryContract
      const {
        isHoldExercise: contractIsHold,
        targetValue: contractTargetValue,
        targetRPE: contractTargetRPE,
        recommendedBand: contractRecommendedBand,
        bandSelectable,
        currentSetNote: contractSetNote,
        currentSetReasonTags: contractReasonTags,
      } = activeEntryContract
      
      return (
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3 space-y-4">
          {contractIsHold ? (
            <RepsHoldInput type="hold" value={safeHoldValue} onChange={setHoldValue} targetValue={contractTargetValue} />
          ) : (
            <RepsHoldInput type="reps" value={safeRepsValue} onChange={setRepsValue} targetValue={contractTargetValue} />
          )}
          <RPEQuickSelector value={safeSelectedRPE} onChange={setSelectedRPE} targetRPE={contractTargetRPE} />
          {bandSelectable && (
            <BandSelector value={safeBandUsed} onChange={setBandUsed} recommendedBand={contractRecommendedBand} />
          )}
          
          {/* Per-set notes section - collapsible */}
          <div className="border-t border-[#2B313A] pt-3">
            <button
              onClick={() => setShowSetNotes(!showSetNotes)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
                <MessageSquare className="w-4 h-4" />
                <span>Add note</span>
                {(contractSetNote || contractReasonTags.length > 0) && (
                  <span className="text-xs text-[#6B7280]">
                    ({contractReasonTags.length > 0 ? contractReasonTags.length + ' tags' : 'note added'})
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
                    const isSelected = contractReasonTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleReasonTag(tag)}
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
                  value={contractSetNote}
                  onChange={(e) => handleSetNote(e.target.value)}
                  className="bg-[#2B313A] border-[#3B4250] text-[#E6E9EF] placeholder:text-[#6B7280] text-sm resize-none h-16"
                />
              </div>
            )}
          </div>
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
  
  // UNIT 3.5: Execution Ledger - shows recent completed sets
  const renderLedgerUnit = (): React.ReactNode => {
    // [CRASH-FIX] Use normalizedCompletedSets with null safety
    if (normalizedCompletedSets.length === 0) return null
    try {
      // [REFRESH-DUPLICATE-SET-FIX] LEDGER RENDER HARDENING (layer 4 of 4)
      // Mirror the corridor-recent-sets dedupe here. Last-line safety:
      // drop duplicate (exerciseIndex, setNumber) rows at render time,
      // keep-first. Never mutates authoritative completedSets.
      const ledgerSeenKeys = new Set<string>()
      const dedupedCompletedSets = normalizedCompletedSets.filter(s => {
        const key = `${s.exerciseIndex}:${s.setNumber}`
        if (ledgerSeenKeys.has(key)) return false
        ledgerSeenKeys.add(key)
        return true
      })
      const recentSets = dedupedCompletedSets.slice(-3) // Show last 3 sets
      const blockInfo = getBlockForExercise(machineSessionContract?.executionPlan, safeExerciseIndex)
      
      return (
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
                  <span className={`text-[#A4ACB8]`}>RPE {set.actualRPE}</span>
                  {set.reasonTags && set.reasonTags.length > 0 && (
                    <span className="text-[#C1121F] text-[10px]">+{set.reasonTags.length}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )
    } catch (err) {
      console.error('[v0] [Unit:Ledger] FAILED', err)
      return null
    }
  }
  
  // UNIT 4: Actions - renders complete button and secondary actions
  const renderActionsUnit = (): React.ReactNode => {
    // [LIVE-RENDER-SOURCE-LOCK] Belt-and-suspenders single-owner guard.
    // Authoritative Log Set button lives in ActiveWorkoutStartCorridor. This
    // legacy Log Set surface must never render during any live execution phase.
    if (isLiveExecutionPhase) {
      console.warn('[v0] [log-corridor] LEGACY_UNIT_ACTIONS_BLOCKED_DURING_LIVE_PHASE (non-authoritative Log Set suppressed)', { livePhase })
      return null
    }
    if (!unitStatus.actions.enabled) return null
    try {
      unitStatus.actions.rendered = true
      // [LIVE-LOG-CORRIDOR-PROOF] stage_screen_rendered_LEGACY_UNIT
      // Fires ONLY if the legacy unit-based active-Actions renderer ever
      // executes during a live workout. The authoritative corridor early-
      // return at line ~5857 MUST fire first for any active/resting status,
      // which makes this renderer structurally unreachable in the commit
      // corridor. If this warn prints while safeStatus is 'active' or
      // 'resting', the single-owner contract is broken -- the user is
      // tapping a NON-AUTHORITATIVE button that will still route through
      // handleCompleteSet (so commits still work) but the UI they see is
      // the wrong render branch. Filterable with [log-corridor] prefix.
      if (safeStatus === 'active' || safeStatus === 'resting') {
        console.warn('[v0] [log-corridor] stage_screen_rendered_LEGACY_UNIT_contract_violation', {
          safeStatus,
          exerciseName: safeCurrentExercise?.name,
          explanation: 'authoritative corridor early-return at line ~5857 should have prevented this render',
        })
      }
      return (
        <>
          {/* [LIVE-LOG-CORRIDOR-SINGLE-OWNER] NON-AUTHORITATIVE. Legacy unit-
              based render Log Set button. The authoritative Log Set button
              lives in ActiveWorkoutStartCorridor.tsx and reaches this file via
              the corridor's onCompleteSet prop (wired to handleCompleteSet).
              This button is unreachable in the active-logging path because the
              'active'/'resting' status branch at line ~5835 returns the
              corridor component before this render runs. If this onClick ever
              fires in production, the dev warning below makes it visible so we
              can re-assert the single-owner contract. It still routes through
              the SAME handleCompleteSet so no silent duplicate path can form. */}
          <Button onClick={() => {
            console.warn('[v0] [log-corridor] NON-AUTHORITATIVE legacy unit-Actions Log Set click - commit corridor single-owner contract says this should be unreachable')
            handleCompleteSet()
          }} disabled={safeSelectedRPE === null} className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-base font-bold">
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
  // [LIVE-SESSION-CRASH-FIX-R4] LEGACY STAGE-1 BRANCH REMOVED.
  //
  // Root cause that tripped the Workout Session Issue boundary:
  //   This component mounts in phase 'ready' (see live-workout-machine.ts
  //   initialState). 'ready' is NOT a live execution phase, so the
  //   authoritative corridor early-return at line ~6256 does NOT fire.
  //   Control then fell into the legacy Stage-1 active render branch,
  //   whose JSX referenced `CardContent` and `Input` - neither of which
  //   is imported in this file. On first render we threw a client-side
  //   ReferenceError and the error boundary caught it before Start
  //   Workout could finish wiring.
  //
  // Surgical fix:
  //   Removed the entire Stage-1 legacy branch. The single-owner contract
  //   is now strictly:
  //     - live phases (active / resting / between_exercise_rest /
  //       block_round_rest / transitioning)
  //         -> authoritative <ActiveWorkoutStartCorridor /> at the early-
  //            return around line ~6256.
  //     - all non-live phases (ready / paused / complete / transitional
  //       boot states)
  //         -> fall through to the Stage-2+ unit-based return below,
  //            whose renderers use ONLY imports that actually exist in
  //            this file (Card, Button, Badge, RepsHoldInput, etc.).
  //
  //   No legacy active render surface remains reachable during live
  //   execution. The removed branch was the ONLY place in this file
  //   that referenced `CardContent` or `Input`, so the ReferenceError
  //   surface is eliminated entirely rather than patched around.
  // ==========================================================================

  // ==========================================================================
  // STAGE 2+: Unit-based render with containment
  // Shell stays alive, each unit renders inside with local error handling
  // This is now the SOLE non-live render path.
  // ==========================================================================
  unitStatus.shell.rendered = true
  
  return (
    <div className="min-h-screen bg-[#0F1115] flex flex-col overflow-x-hidden">
      {/* [PRODUCTION-VISIBLE-BUILD-PROOF-R3] LEGACY fingerprint for the
          unit-based Stage-2+ render path. If this chip appears during a
          live workout, the isLiveExecutionPhase gate at line ~6110 did not
          short-circuit and the unit-based legacy surface leaked through.
          Placed at the root so it is visible regardless of which unit
          renderers chose to return null. */}
      <div className="fixed top-1 right-1 z-50 pointer-events-none">
        <span
          className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40"
          aria-hidden
        >
          {LEGACY_ACTIVE_BUILD_CHIP}
        </span>
      </div>
      {/* UNIT 1: Header */}
      {renderHeaderUnit()}
      
      {/* Main content area */}
      <div className="flex-1 px-4 py-3">
        <div className="max-w-lg mx-auto space-y-3">
          {/* UNIT 2: Exercise Card */}
          {renderExerciseUnit()}
          
          {/* UNIT 3: Input Controls */}
          {renderInputsUnit()}
          
          {/* UNIT 3.5: Execution Ledger */}
          {renderLedgerUnit()}
          
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
