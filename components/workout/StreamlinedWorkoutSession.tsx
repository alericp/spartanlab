'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
// [PHASE LW4] TRANSITION TRACE SYSTEM
// Provides precise breadcrumb logging for exercise transitions
// =============================================================================

type TransitionReason = 
  | 'complete_set' 
  | 'inter_exercise_complete' 
  | 'skip_inter_exercise' 
  | 'skip_exercise'

interface TransitionTrace {
  sessionId: string
  fromExerciseIndex: number
  toExerciseIndex: number | null
  fromExerciseName: string
  toExerciseName: string | null
  reason: TransitionReason
  beforeStateStatus: string
  afterStateStatus: string
  safeExerciseCount: number
  transitionCommitted: boolean
  postCommitInputsApplied: boolean
  lastSuccessfulRenderExerciseIndex: number
  lastSuccessfulRenderExerciseName: string
  timestamp: number
}

interface ExerciseTransitionResult {
  /** The computed next workout state */
  nextState: WorkoutSessionState
  /** Input values to apply after state commit */
  nextInputs: {
    repsValue: number
    holdValue: number
    bandUsed: ResistanceBandColor | 'none'
  } | null
  /** Metadata about the transition */
  meta: {
    fromIndex: number
    toIndex: number | null
    fromExerciseName: string
    toExerciseName: string | null
    isWorkoutComplete: boolean
  }
  /** Cleanup actions to perform */
  cleanup: {
    clearRestTimer: boolean
    clearStorage: boolean
    hideInterExerciseRest: boolean
  }
}

/**
 * [PHASE LW4] Write transition trace to sessionStorage and window for crash diagnosis
 * This is effect-safe and never throws.
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
      beforeStateStatus: trace.beforeStateStatus ?? existing?.beforeStateStatus ?? 'unknown',
      afterStateStatus: trace.afterStateStatus ?? existing?.afterStateStatus ?? 'unknown',
      safeExerciseCount: trace.safeExerciseCount ?? existing?.safeExerciseCount ?? 0,
      transitionCommitted: trace.transitionCommitted ?? existing?.transitionCommitted ?? false,
      postCommitInputsApplied: trace.postCommitInputsApplied ?? existing?.postCommitInputsApplied ?? false,
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
 * [PHASE LW4] Read transition trace for crash diagnosis
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
 * [PHASE LW4] AUTHORITATIVE PURE EXERCISE TRANSITION HELPER
 * 
 * This is the SINGLE source of truth for all forward exercise transitions.
 * It computes the next state WITHOUT any side effects - pure math/selection only.
 * 
 * ALL forward transitions must use this helper:
 * - After last set of current exercise
 * - After inter-exercise rest timer complete
 * - After skip inter-exercise rest
 * - After skip exercise
 */
function computeNextExerciseTransition(
  prevState: WorkoutSessionState,
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
  reason: TransitionReason
): ExerciseTransitionResult {
  const fromIndex = prevState.currentExerciseIndex
  const fromExercise = exercises[fromIndex]
  const fromExerciseName = fromExercise?.name ?? 'Unknown'
  
  const nextIndex = fromIndex + 1
  const isWorkoutComplete = nextIndex >= exercises.length
  
  if (isWorkoutComplete) {
    // Workout complete - no next exercise
    return {
      nextState: {
        ...prevState,
        status: 'completed',
      },
      nextInputs: null,
      meta: {
        fromIndex,
        toIndex: null,
        fromExerciseName,
        toExerciseName: null,
        isWorkoutComplete: true,
      },
      cleanup: {
        clearRestTimer: true,
        clearStorage: true,
        hideInterExerciseRest: true,
      },
    }
  }
  
  // Get the NEXT exercise to compute correct initial values
  const nextExercise = exercises[nextIndex]
  const toExerciseName = nextExercise?.name ?? 'Exercise'
  
  // Parse target value from next exercise's repsOrTime
  const nextRepsOrTime = nextExercise?.repsOrTime || ''
  const nextTargetMatch = nextRepsOrTime.match(/(\d+)/)
  const nextTargetValue = nextTargetMatch ? parseInt(nextTargetMatch[1], 10) : 5
  
  // Determine recommended band for next exercise
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
  
  return {
    nextState: {
      ...prevState,
      status: 'active',
      currentExerciseIndex: nextIndex,
      currentSetNumber: 1,
    },
    nextInputs: {
      repsValue: nextTargetValue,
      holdValue: nextTargetValue,
      bandUsed: nextBand,
    },
    meta: {
      fromIndex,
      toIndex: nextIndex,
      fromExerciseName,
      toExerciseName,
      isWorkoutComplete: false,
    },
    cleanup: {
      clearRestTimer: false,
      clearStorage: false,
      hideInterExerciseRest: true,
    },
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
  
  // [PHASE LW3] PURE DEFAULT STATE - No side effects during render
  // Restore/hydration happens in a dedicated useEffect below
  const [state, setState] = useState<WorkoutSessionState>({
    status: 'ready',
    currentExerciseIndex: 0,
    currentSetNumber: 1,
    completedSets: [],
    startTime: null,
    elapsedSeconds: 0,
    lastSetRPE: null,
    workoutNotes: '',
    exerciseOverrides: {},
  })
  
  // [PHASE LW3] Hydration gate - prevents half-hydrated first render
  const [bootHydrationReady, setBootHydrationReady] = useState(false)
  
  // [PHASE LW3] Track if hydration effect has run to prevent double-apply in StrictMode
  const hydrationAppliedRef = useRef<string | null>(null)
  
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
  const [showInterExerciseRest, setShowInterExerciseRest] = useState(false)
  const [interExerciseRestSeconds, setInterExerciseRestSeconds] = useState(60)
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
    
    // Real sessions: attempt restore
    markBootStage('restore_state_check_start', {
      restoreWasAttempted: true,
    })
    
    const exerciseCount = safeWorkoutSessionContract.exercises?.length ?? 0
    const saved = loadSessionFromStorage(sessionId, exerciseCount, sessionStructureSignature)
    
    if (saved && saved.status !== 'completed') {
      // Restore accepted
      markBootStage('restore_state_check_done', {
        restoreWasAccepted: true,
        restoreRejectReason: null,
        currentExerciseIndex: saved.currentExerciseIndex,
      })
      console.log('[workout-restore] Restored saved state with signature validation', {
        sessionId,
        structureSignature: sessionStructureSignature,
        restoredExerciseIndex: saved.currentExerciseIndex,
        restoredSetNumber: saved.currentSetNumber,
        completedSetsCount: saved.completedSets?.length ?? 0,
      })
      setState(saved)
      markBootStage('state_initialized', {
        currentExerciseIndex: saved.currentExerciseIndex,
        status: saved.status,
      })
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
  // [AUTHORITATIVE-HYDRATION-CONTRACT] EXERCISE DERIVATION
  // All exercise access MUST go through this chain, never raw session
  // [PHASE LW3] All boot ledger calls moved to effects - render is now pure
  // ==========================================================================
  
  // Get exercises from authoritative contract ONLY
  const exercises = safeWorkoutSessionContract.exercises
  const hasValidExercises = exercises.length > 0
  
  // Clamp currentExerciseIndex to valid bounds
  const safeExerciseIndex = hasValidExercises 
    ? Math.max(0, Math.min(state.currentExerciseIndex, exercises.length - 1))
    : 0
  const isIndexOutOfBounds = hasValidExercises && state.currentExerciseIndex !== safeExerciseIndex
  
  // Derive current exercise from authoritative contract (already normalized/safe)
  const currentExercise = hasValidExercises ? exercises[safeExerciseIndex] : null
  const totalExercises = exercises.length
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const completedSetsCount = state.completedSets.length
  
  // ==========================================================================
  // [AUTHORITATIVE-HYDRATION-CONTRACT] SAFE CURRENT EXERCISE
  // Derived from authoritative contract, guaranteed safe even if array is empty
  // ==========================================================================
  const safeCurrentExercise = useMemo(() => {
    // If we have a valid exercise from the contract, use it directly
    // (It's already normalized and safe from safeWorkoutSessionContract)
    if (currentExercise) {
      return currentExercise
    }
    
    // Fallback for empty/invalid exercise arrays - guaranteed safe defaults
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
    }
  }, [currentExercise])
  
  // ==========================================================================
  // [AUTHORITATIVE-HYDRATION-CONTRACT] STAGE CONTEXT PERSISTENCE
  // Store context in sessionStorage for crash recovery diagnostics
  // ==========================================================================
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('spartanlab_workout_stage_context', JSON.stringify({
          sessionId,
          dayLabel: safeWorkoutSessionContract.dayLabel,
          dayNumber: safeWorkoutSessionContract.dayNumber,
          isDemo: isDemoSession,
          exerciseCount: exercises.length,
          currentExerciseIndex: state.currentExerciseIndex,
        }))
      } catch {}
    }
  }, [sessionId, safeWorkoutSessionContract.dayLabel, safeWorkoutSessionContract.dayNumber, isDemoSession, exercises.length, state.currentExerciseIndex])
  
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
  // [AUTHORITATIVE-HYDRATION-CONTRACT] RUNTIME TRUTH BUILDERS
  // Build from authoritative contracts ONLY
  // [PHASE LW3] All stage logging moved to effects - useMemo is now pure
  // ==========================================================================
  
  const sessionRuntimeTruth = useMemo<SessionRuntimeTruth>(() => {
    return buildSessionRuntimeTruth(safeWorkoutSessionContract as AdaptiveSession, {
      programId: null,
      workoutsCompleted: 0,
      sessionIndex: 0,
    })
  }, [safeWorkoutSessionContract])
  
  const exerciseRuntimeTruth = useMemo<ExerciseRuntimeTruth>(() => {
    const overrideState = state.exerciseOverrides[safeExerciseIndex]
    return buildExerciseRuntimeTruth(safeCurrentExercise as AdaptiveExercise, safeExerciseIndex, overrideState ? {
      isOverridden: !!(overrideState.isReplaced || overrideState.isProgressionAdjusted || overrideState.isSkipped),
      overrideType: overrideState.isReplaced ? 'replaced' : overrideState.isProgressionAdjusted ? 'progression_adjusted' : overrideState.isSkipped ? 'skipped' : null,
      currentName: overrideState.currentName,
    } : undefined)
  }, [safeCurrentExercise, safeExerciseIndex, state.exerciseOverrides])
  
  const calibrationMessage = useMemo(() => {
    return getCalibrationMessage(sessionRuntimeTruth)
  }, [sessionRuntimeTruth])
  
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
  
  // ==========================================================================
  // [PHASE LW2] ACTIVE WORKOUT VIEW MODEL
  // Single authoritative model for all active render values.
  // [PHASE LW3] Now pure - no boot ledger writes during render
  // ==========================================================================
  const activeWorkoutViewModel = useMemo(() => {
    // Core session identity
    const safeSessionId = sessionId || 'unknown-session'
    const safeDayLabel = safeWorkoutSessionContract.dayLabel || 'Workout'
    const safeDayNumber = safeWorkoutSessionContract.dayNumber || 1
    
    // Exercise counts
    const safeExerciseCount = exercises.length
    const safeTotalSets = exercises.reduce((sum, ex) => sum + (ex?.sets ?? 3), 0)
    const safeCompletedSetsCount = state.completedSets?.length ?? 0
    
    // Current exercise position (bounded)
    const safeCurrentIndex = Math.max(0, Math.min(state.currentExerciseIndex, Math.max(0, exercises.length - 1)))
    const safeCurrentSetNumber = Math.max(1, Math.min(state.currentSetNumber, safeCurrentExercise.sets || 3))
    
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
    
    // Load display
    const loadDisplay = hasLoad 
      ? `@ +${safeCurrentExercise.prescribedLoad!.load} ${safeCurrentExercise.prescribedLoad!.unit}`
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
      
      // Validation flag
      isValid: safeExerciseCount > 0 && currentExerciseName !== 'Exercise',
    }
  }, [
    sessionId, 
    safeWorkoutSessionContract.dayLabel, 
    safeWorkoutSessionContract.dayNumber, 
    exercises, 
    state.currentExerciseIndex, 
    state.currentSetNumber, 
    state.completedSets, 
    safeCurrentExercise
  ])
  
  // [LIVE-WORKOUT-CORRIDOR] Determine if exercise uses holds or reps
  // Uses safeCurrentExercise for guaranteed-safe values
  const isHoldExercise = safeLower(safeCurrentExercise.repsOrTime).includes('sec') || 
                         safeLower(safeCurrentExercise.repsOrTime).includes('hold')
  
  // [LIVE-WORKOUT-CORRIDOR] Parse target value - uses safeCurrentExercise
  const getTargetValue = useCallback((): number => {
    const match = safeCurrentExercise.repsOrTime.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 5
  }, [safeCurrentExercise])
  
  // [LIVE-WORKOUT-CORRIDOR] Recommended band from exercise - uses safeCurrentExercise
  const getRecommendedBand = useCallback((): ResistanceBandColor | undefined => {
    if (!safeCurrentExercise.note) return undefined
    const noteLower = safeLower(safeCurrentExercise.note)
    for (const band of ALL_BAND_COLORS) {
      if (noteLower.includes(band)) return band
    }
    return undefined
  }, [safeCurrentExercise])
  
  // ==========================================================================
  // [LIVE-WORKOUT-CORRIDOR] UNIFIED ADVANCEMENT SYSTEM
  // All transition paths MUST use this single function to avoid stale closures
  // ==========================================================================
  
  // [PHASE LW4] Ref to store pending transition result for post-commit application
  const pendingTransitionRef = useRef<ExerciseTransitionResult | null>(null)
  
  /**
   * [PHASE LW4] UNIFIED ADVANCEMENT FUNCTION
   * Uses the pure computeNextExerciseTransition helper.
   * NO side effects inside setState - all cleanup happens in controlled post-commit sequence.
   */
  const advanceToNextExercise = useCallback((reason: TransitionReason) => {
    // [PHASE LW4] Write transition_requested breadcrumb BEFORE attempting transition
    writeTransitionTrace({
      reason,
      timestamp: Date.now(),
      transitionCommitted: false,
      postCommitInputsApplied: false,
    })
    
    // Use functional update to get FRESH state values, avoiding stale closures
    setState(prev => {
      // [PHASE LW4] Compute transition using PURE helper - no side effects
      const transitionResult = computeNextExerciseTransition(prev, exercises, reason)
      
      console.log('[PHASE LW4] advanceToNextExercise - transition computed', {
        reason,
        fromIndex: transitionResult.meta.fromIndex,
        toIndex: transitionResult.meta.toIndex,
        fromExerciseName: transitionResult.meta.fromExerciseName,
        toExerciseName: transitionResult.meta.toExerciseName,
        isWorkoutComplete: transitionResult.meta.isWorkoutComplete,
        totalExercises: exercises.length,
      })
      
      // [PHASE LW4] Write transition_computed breadcrumb
      writeTransitionTrace({
        fromExerciseIndex: transitionResult.meta.fromIndex,
        toExerciseIndex: transitionResult.meta.toIndex,
        fromExerciseName: transitionResult.meta.fromExerciseName,
        toExerciseName: transitionResult.meta.toExerciseName,
        beforeStateStatus: prev.status,
        afterStateStatus: transitionResult.nextState.status,
        safeExerciseCount: exercises.length,
      })
      
      // Store transition result for post-commit application
      // This is a ref assignment, not a side effect that affects rendering
      pendingTransitionRef.current = transitionResult
      
      // Return ONLY the next state - no side effects
      return transitionResult.nextState
    })
  }, [exercises]) // Only depends on exercises array, not state
  
  // [PHASE LW4] Effect to apply post-commit actions when state changes due to transition
  useEffect(() => {
    const pending = pendingTransitionRef.current
    if (!pending) return
    
    // Clear the pending ref first to prevent re-execution
    pendingTransitionRef.current = null
    
    // [PHASE LW4] Write transition_committed breadcrumb
    writeTransitionTrace({
      transitionCommitted: true,
    })
    
    // Apply cleanup actions
    if (pending.cleanup.clearRestTimer) {
      clearRestTimerState()
    }
    if (pending.cleanup.clearStorage) {
      clearSessionStorage()
    }
    if (pending.cleanup.hideInterExerciseRest) {
      setShowInterExerciseRest(false)
    }
    
    // Apply input resets for next exercise
    if (pending.nextInputs) {
      setSelectedRPE(null)
      setRepsValue(pending.nextInputs.repsValue)
      setHoldValue(pending.nextInputs.holdValue)
      setBandUsed(pending.nextInputs.bandUsed)
    }
    
    // [PHASE LW4] Write post_commit_inputs_applied breadcrumb
    writeTransitionTrace({
      postCommitInputsApplied: true,
    })
    
    console.log('[PHASE LW4] Post-commit actions applied', {
      toIndex: pending.meta.toIndex,
      toExerciseName: pending.meta.toExerciseName,
      isWorkoutComplete: pending.meta.isWorkoutComplete,
    })
  }, [state.currentExerciseIndex, state.status]) // Triggered when state changes
  
  // [LIVE-WORKOUT-CORRIDOR-FIX] Load next session info when workout completes
  // This uses dynamic import to avoid loading the heavy adaptive-program-builder at module load
  useEffect(() => {
    if (state.status === 'completed' && !nextSessionInfo) {
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
  }, [state.status, nextSessionInfo, safeSession.dayNumber])
  
  // Auto-save on state changes - skip for demo sessions
  // [LIVE-SESSION-LOCK] Include structure signature in saved state
  useEffect(() => {
    // Demo sessions don't persist to storage
    if (isDemoSession) return
    
    if (state.status !== 'ready') {
      saveSessionToStorage(state, sessionId, sessionStructureSignature)
    }
  }, [state, sessionId, isDemoSession, sessionStructureSignature])
  
  // [LIVE-WORKOUT-CORRIDOR] Initialize values when exercise changes - uses safeCurrentExercise
  useEffect(() => {
    setRepsValue(getTargetValue())
    setHoldValue(getTargetValue())
    setSelectedRPE(null)
    // Prefer authoritative executionTruth, fall back to legacy heuristic
    const recommendedBandFromTruth = safeCurrentExercise.executionTruth?.recommendedBandColor
    const legacyRecommendedBand = getRecommendedBand()
    const effectiveRecommendedBand = recommendedBandFromTruth ?? legacyRecommendedBand
    setBandUsed(effectiveRecommendedBand || 'none')
  }, [state.currentExerciseIndex, safeCurrentExercise, getTargetValue, getRecommendedBand])
  
  // [PHASE LW4] Write transition_render_verified breadcrumb on successful active render
  useEffect(() => {
    if (state.status === 'active') {
      writeTransitionTrace({
        lastSuccessfulRenderExerciseIndex: safeExerciseIndex,
        lastSuccessfulRenderExerciseName: safeCurrentExercise.name,
      })
    }
  }, [state.status, safeExerciseIndex, safeCurrentExercise.name])
  
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
  // [PHASE LW2] Validates active state requirements before transition
  const handleStart = useCallback(() => {
  // [PHASE LW2] Validate before transitioning to active
  if (!hasValidExercises) {
    console.error('[WORKOUT-START] Cannot start - no valid exercises')
    recordBootError('active_state_entry', new Error('No valid exercises'))
    return
  }
  
  if (!activeWorkoutViewModel.isValid) {
    console.error('[WORKOUT-START] Cannot start - view model invalid')
    recordBootError('active_state_entry', new Error('Active view model invalid'))
    return
  }
  
  markBootStage('active_state_entry', {
    sessionId: activeWorkoutViewModel.sessionId,
    exerciseCount: activeWorkoutViewModel.totalExercises,
    currentExerciseIndex: activeWorkoutViewModel.currentExerciseIndex,
  })
  
  setShowResumePrompt(false)
  setState(prev => ({
  ...prev,
  status: 'active',
  startTime: prev.startTime || Date.now(),
  }))
  }, [hasValidExercises, activeWorkoutViewModel])
  
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
  
  // [PHASE LW4] Complete set - uses unified transition helper for exercise advancement
  const handleCompleteSet = useCallback(() => {
    // [PHASE LW4] Use safeExerciseIndex for reads, safeCurrentExercise for exercise data
    const currentIndex = safeExerciseIndex
    
    console.log('[PHASE LW4] handleCompleteSet triggered', {
      exerciseIndex: currentIndex,
      setNumber: state.currentSetNumber,
      exerciseName: safeCurrentExercise.name,
      totalSets: safeCurrentExercise.sets,
      totalExercises: exercises.length,
    })
    
    const setData: CompletedSetData = {
      exerciseIndex: currentIndex,
      setNumber: state.currentSetNumber,
      actualReps: isHoldExercise ? 0 : repsValue,
      holdSeconds: isHoldExercise ? holdValue : undefined,
      actualRPE: selectedRPE || 8,
      bandUsed,
      timestamp: Date.now(),
    }
    
    const newCompletedSets = [...state.completedSets, setData]
    const totalExerciseSets = safeCurrentExercise.sets
    const isLastSet = state.currentSetNumber >= totalExerciseSets
    const isLastExercise = currentIndex >= exercises.length - 1
    
    const lastRPE = selectedRPE || 8
    
    // [LIVE-WORKOUT-CORRIDOR] Evaluate set performance - uses safeCurrentExercise
    if (safeCurrentExercise.executionTruth) {
      const targetValue = getTargetValue()
      const setsForThisExercise = newCompletedSets.filter(s => s.exerciseIndex === currentIndex)
      
      const performanceData: SetPerformanceData = {
        setNumber: state.currentSetNumber,
        targetReps: isHoldExercise ? 0 : targetValue,
        actualReps: isHoldExercise ? 0 : repsValue,
        targetHoldSeconds: isHoldExercise ? targetValue : undefined,
        actualHoldSeconds: isHoldExercise ? holdValue : undefined,
        targetRPE: 8,
        actualRPE: selectedRPE || 8,
        bandUsed,
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
      
      // Show recommendation if warranted
      if (shouldShowRecommendation(recommendation) && !isLastSet && !isLastExercise) {
        setAdaptiveRecommendation(recommendation)
        setShowAdaptiveModal(true)
      }
    }
    
    if (isLastSet && isLastExercise) {
      // [PHASE LW4] Workout complete - use state update then cleanup
      setState(prev => ({
        ...prev,
        status: 'completed',
        completedSets: newCompletedSets,
        lastSetRPE: lastRPE,
      }))
      // Cleanup happens outside setState - no side effects in updater
      clearSessionStorage()
      clearRestTimerState()
      
    } else if (isLastSet) {
      // [PHASE LW4] Move to next exercise - check for inter-exercise rest
      const interRestSeconds = exerciseRuntimeTruth.restSecondsInterExercise
      
      // Show inter-exercise rest if enabled and not warmup/mobility
      const shouldShowInterRest = sessionRuntimeTruth.supportsBetweenExerciseRest && 
        exerciseRuntimeTruth.category !== 'warmup' && 
        exerciseRuntimeTruth.category !== 'mobility' &&
        interRestSeconds >= 30
      
      if (shouldShowInterRest) {
        // Show inter-exercise rest - actual advancement happens after rest completes
        console.log('[PHASE LW4] showing inter-exercise rest', {
          interRestSeconds,
          currentIndex,
          nextIndex: currentIndex + 1,
        })
        setInterExerciseRestSeconds(interRestSeconds)
        setShowInterExerciseRest(true)
        setState(prev => ({
          ...prev,
          completedSets: newCompletedSets,
          lastSetRPE: lastRPE,
        }))
      } else {
        // [PHASE LW4] Immediate advance using UNIFIED transition helper
        // First update completed sets, then advance via unified function
        setState(prev => ({
          ...prev,
          completedSets: newCompletedSets,
          lastSetRPE: lastRPE,
        }))
        // Use unified advancement - this handles all input resets correctly
        advanceToNextExercise('complete_set')
      }
    } else {
      // Move to next set with rest
      const nextSetNumber = state.currentSetNumber + 1
      const maxSets = totalExerciseSets
      
      // Guard against incrementing past total sets
      if (nextSetNumber > maxSets) {
        console.warn('[PHASE LW4] blocked invalid set increment:', {
          currentSet: state.currentSetNumber,
          nextSet: nextSetNumber,
          maxSets,
          exerciseName: safeCurrentExercise.name,
        })
        // Failsafe: advance to next exercise if possible
        if (currentIndex < exercises.length - 1) {
          setState(prev => ({
            ...prev,
            completedSets: newCompletedSets,
            lastSetRPE: lastRPE,
          }))
          advanceToNextExercise('complete_set')
        } else {
          setState(prev => ({
            ...prev,
            status: 'completed',
            completedSets: newCompletedSets,
            lastSetRPE: lastRPE,
          }))
          clearSessionStorage()
          clearRestTimerState()
        }
        return
      }
      
      // Normal next set flow
      setState(prev => ({
        ...prev,
        status: 'resting',
        completedSets: newCompletedSets,
        currentSetNumber: nextSetNumber,
        lastSetRPE: lastRPE,
      }))
      
      // Reset inputs for next set of SAME exercise
      setSelectedRPE(null)
      setRepsValue(getTargetValue())
      setHoldValue(getTargetValue())
    }
  }, [safeCurrentExercise, safeExerciseIndex, state, repsValue, holdValue, selectedRPE, bandUsed, isHoldExercise, exercises, exerciseRuntimeTruth, sessionRuntimeTruth, getTargetValue, advanceToNextExercise])
  
  // Rest complete / skip rest (between sets of SAME exercise)
  const handleRestComplete = useCallback(() => {
    console.log('[LIVE-WORKOUT-CORRIDOR] handleRestComplete triggered (same exercise, next set)')
    clearRestTimerState()
    playTimerCompletionAlert()
    setState(prev => ({
      ...prev,
      status: 'active',
    }))
  }, [])
  
  // [LIVE-WORKOUT-CORRIDOR] Handle inter-exercise rest completion
  // Uses unified advanceToNextExercise to prevent stale closure bugs
  const handleInterExerciseRestComplete = useCallback(() => {
    console.log('[LIVE-WORKOUT-CORRIDOR] handleInterExerciseRestComplete triggered')
    playTimerCompletionAlert()
    advanceToNextExercise('inter_exercise_complete')
  }, [advanceToNextExercise])
  
  // [LIVE-WORKOUT-CORRIDOR] Handle skip inter-exercise rest
  // Uses unified advanceToNextExercise to prevent stale closure bugs
  const handleSkipInterExerciseRest = useCallback(() => {
    console.log('[LIVE-WORKOUT-CORRIDOR] handleSkipInterExerciseRest triggered')
    advanceToNextExercise('skip_inter_exercise')
  }, [advanceToNextExercise])
  
  // [EXECUTION-TRUTH-FIX] Back navigation - review previous exercise
  const handleReviewPreviousExercise = useCallback(() => {
    if (state.currentExerciseIndex <= 0) return
    const prevIndex = state.currentExerciseIndex - 1
    setReviewingExerciseIndex(prevIndex)
    setIsReviewingPreviousExercise(true)
  }, [state.currentExerciseIndex])
  
  // [EXECUTION-TRUTH-FIX] Close review and return to current exercise
  const handleCloseReview = useCallback(() => {
    setIsReviewingPreviousExercise(false)
    setReviewingExerciseIndex(null)
  }, [])
  
  // [EXECUTION-TRUTH-FIX] Get completed sets for a specific exercise
  const getCompletedSetsForExercise = useCallback((exerciseIndex: number) => {
    return state.completedSets.filter(s => s.exerciseIndex === exerciseIndex)
  }, [state.completedSets])
  
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
  
  // [LIVE-WORKOUT-CORRIDOR] Skip exercise - uses unified advancement
  const handleSkipExercise = useCallback(() => {
    console.log('[LIVE-WORKOUT-CORRIDOR] handleSkipExercise triggered')
    advanceToNextExercise('skip_exercise')
  }, [advanceToNextExercise])
  
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
  }, [session, state, sessionId, perceivedDifficulty])
  
  // [LIVE-WORKOUT-CORRIDOR] Rest recommendation - uses safeCurrentExercise for crash safety
  const getRestRecommendationForCurrentExercise = useCallback((): RestRecommendation => {
    const avgRPE = state.completedSets.length > 0
      ? state.completedSets.reduce((sum, s) => sum + s.actualRPE, 0) / state.completedSets.length
      : null
    
    return getRestRecommendation(
      safeCurrentExercise,
      state.lastSetRPE || undefined,
      {
        setNumber: state.currentSetNumber,
        totalSetsCompleted: state.completedSets.length,
        averageRPE: avgRPE,
      }
    )
  }, [safeCurrentExercise, state.lastSetRPE, state.currentSetNumber, state.completedSets])
  
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
  // [PHASE LW3] RENDER ENTRY - Boot ledger calls moved to effects (render-pure)
  // ==========================================================================
  
  useEffect(() => {
    if (!bootHydrationReady) return
    // [PHASE LW2] Mark live_workout_ready - render completed successfully
    // [PHASE LW2] Mark active state render complete if in active state
    if (state.status === 'active') {
      markBootStage('active_state_render_complete', {
        sessionId,
        currentExerciseIndex: safeExerciseIndex,
        currentSetNumber: state.currentSetNumber,
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
      status: state.status,
      currentSetNumber: state.currentSetNumber,
      sessionId,
    })
  }, [hasValidExercises, safeExerciseIndex, safeCurrentExercise, state.status, state.currentSetNumber, sessionId, logStage, safeWorkoutSessionContract.dayLabel, exercises.length])
  
  // [LIVE-SESSION-FIX] Internal verification: Log all critical contract values for proof
  // [PHASE LW2-FIX] CRITICAL: This useEffect MUST be declared BEFORE any early returns
  // to comply with React's rules of hooks (same hook count/order on every render)
  useEffect(() => {
    // Only log if we have valid exercises to avoid noise from fallback states
    if (hasValidExercises) {
      console.log('[LIVE-SESSION-PROOF] Runtime contract verification:', {
        componentVersion: STREAMLINED_WORKOUT_VERSION,
        sessionId,
        exerciseCount: exercises.length,
        currentExerciseIndex: safeExerciseIndex,
        safeCurrentExerciseName: safeCurrentExercise.name,
        sessionRuntimeTruthBuilt: !!sessionRuntimeTruth,
        sessionRuntimeDayLabel: sessionRuntimeTruth.dayLabel,
        exerciseRuntimeTruthBuilt: !!exerciseRuntimeTruth,
        exerciseRuntimeName: exerciseRuntimeTruth.exerciseName,
        isDemoSession,
        estimatedMinutes: safeSession.estimatedMinutes,
        restoreUsed: state.completedSets.length > 0 && state.status !== 'ready',
      })
    }
  }, [sessionId, exercises.length, safeExerciseIndex, safeCurrentExercise.name, sessionRuntimeTruth, exerciseRuntimeTruth, isDemoSession, safeSession.estimatedMinutes, state.completedSets.length, state.status, hasValidExercises])
  
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
  // [PHASE LW3] Boot stage calls moved to effects - render is pure
  // ==========================================================================
  
  if (state.status === 'ready') {
    
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
    const bandsUsed = state.completedSets
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
    
    // [LIVE-WORKOUT-CORRIDOR] Use safeCurrentExercise for guaranteed-safe rendering
    const nextSetInfo = {
      exerciseName: safeCurrentExercise.name,
      setNumber: Math.min(state.currentSetNumber, safeCurrentExercise.sets),
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
                  Set {Math.min(state.currentSetNumber, safeCurrentExercise.sets)}/{safeCurrentExercise.sets}
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
  
  // [PHASE LW2] ACTIVE STATE VALIDATION - Controlled local fallback instead of crash
  if (!activeWorkoutViewModel.isValid || !activeWorkoutViewModel.hasValidExercises) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#1A1F26] border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#E6E9EF] mb-2">Session Data Issue</h2>
          <p className="text-[#A4ACB8] mb-6 text-sm">
            The workout session loaded but the exercise data needs repair. This can happen with older programs.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => setState(prev => ({ ...prev, status: 'ready' }))}
              className="w-full bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry Session
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full border-[#2B313A] text-[#A4ACB8] hover:bg-[#1A1F26]"
            >
              Return to Dashboard
            </Button>
            {isDemo !== true && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/workout/session?demo=true'
                  }
                }}
                className="w-full text-[#6B7280] hover:text-[#A4ACB8]"
              >
                Try Demo Workout
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // [PHASE LW3] Boot stage calls moved to effects - render is pure
  
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
                  {safeDisplayLabel}
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
        
        {/* [EXECUTION-TRUTH-FIX] Calibration Banner for first workouts */}
        {calibrationMessage.show && (
          <div className="bg-[#4F6D8A]/10 border border-[#4F6D8A]/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#4F6D8A] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#4F6D8A] mb-0.5">{calibrationMessage.title}</p>
                <p className="text-[11px] text-[#A4ACB8] leading-relaxed">
                  {calibrationMessage.description}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* [LIVE-WORKOUT-CORRIDOR] Current Exercise - uses safeCurrentExercise for crash safety */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
                {safeCurrentExercise.category}
              </Badge>
              {state.exerciseOverrides[state.currentExerciseIndex]?.isReplaced && (
                <Badge className="bg-blue-500/10 text-blue-400 border-0 text-[10px] px-1.5 py-0">Swapped</Badge>
              )}
            </div>
            <SafeOptionalSubtree label="ExerciseOptionsMenu">
              <ExerciseOptionsMenu
                exercise={safeCurrentExercise}
                exerciseIndex={state.currentExerciseIndex}
                sessionId={sessionId}
                onReplace={handleReplaceExercise}
                onSkip={handleMenuSkipExercise}
                onProgressionChange={handleProgressionChange}
                onUndo={handleUndoOverride}
              />
            </SafeOptionalSubtree>
          </div>
          
          {/* Exercise Name */}
          <h2 className="text-lg font-bold text-[#E6E9EF] leading-tight">
            {effectiveExercise.name}
          </h2>
          
          {/* [LIVE-WORKOUT-CORRIDOR] Prescription row - uses safeCurrentExercise */}
          <div className="flex items-center gap-2 mt-1.5 text-sm flex-wrap">
            <span className="text-[#A4ACB8]">Target:</span>
            <span className="text-[#E6E9EF] font-medium">{safeCurrentExercise.repsOrTime}</span>
            {/* [prescription-truth] ISSUE C: Display prescription mode truthfully */}
            {safeCurrentExercise.prescribedLoad && safeCurrentExercise.prescribedLoad.load > 0 ? (
              // Weighted exercise with load
              <span className="text-[#C1121F] font-semibold">
                @ +{safeCurrentExercise.prescribedLoad.load} {safeCurrentExercise.prescribedLoad.unit}
              </span>
            ) : (
              // [prescription-render] STEP 4: Check if this is a weighted exercise type without load
              (() => {
                const isWeightedType = (safeCurrentExercise.id ?? '').includes('weighted_') || 
                                       safeLower(safeCurrentExercise.name).includes('weighted')
                const isSkillHold = safeCurrentExercise.category === 'skill' || 
                                    safeLower(safeCurrentExercise.repsOrTime).includes('sec')
                const noLoadReason = (safeCurrentExercise as { noLoadReason?: string }).noLoadReason
                
                // [prescription-render] Log why load isn't shown for weighted-capable exercises
                if (isWeightedType) {
                  console.log('[prescription-render] Weighted exercise without load:', {
                    exerciseName: safeCurrentExercise.name,
                    reason: noLoadReason || 'no_reason_recorded',
                  })
                }
                
                if (isWeightedType && noLoadReason) {
                  // Show specific reason for missing load
                  const reasonText = noLoadReason === 'no_loadable_equipment' ? 'No weights' :
                                     noLoadReason === 'missing_strength_inputs' ? 'No data' :
                                     noLoadReason === 'doctrine_prefers_bodyweight' ? 'BW focus' :
                                     'BW'
                  return <span className="text-[#6B7280] text-xs">({reasonText})</span>
                } else if (isWeightedType) {
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
          {/* [LIVE-WORKOUT-CORRIDOR] Show confidence for non-high confidence loads */}
          {safeCurrentExercise.prescribedLoad && safeCurrentExercise.prescribedLoad.load > 0 && 
           safeCurrentExercise.prescribedLoad.confidenceLevel !== 'high' && (
            <p className="text-[10px] text-[#6B7280] mt-0.5">
              {safeCurrentExercise.prescribedLoad.confidenceLevel === 'moderate' && 'Load based on historical PR'}
              {safeCurrentExercise.prescribedLoad.confidenceLevel === 'low' && 'Estimated load - adjust as needed'}
              {safeCurrentExercise.prescribedLoad.confidenceLevel === 'none' && 'Starting load - adjust based on feel'}
            </p>
          )}
          
          {/* [LIVE-WORKOUT-CORRIDOR] Set Progress - uses safeCurrentExercise */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 flex-1">
              {Array.from({ length: safeCurrentExercise.sets }).map((_, idx) => {
                const safeCurrentSet = Math.min(state.currentSetNumber, safeCurrentExercise.sets)
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
              {/* [LIVE-WORKOUT-CORRIDOR] Safe set display - uses safeCurrentExercise */}
              Set {Math.min(state.currentSetNumber, safeCurrentExercise.sets)}/{safeCurrentExercise.sets}
            </span>
          </div>
        </Card>
        
        {/* [PHASE LW2] Coaching Insight - wrapped in try-catch for safety */}
        {!isDemo && (() => {
          try {
            const insight = getExerciseSelectionInsight(safeCurrentExercise.id || safeCurrentExercise.name)
            if (!insight) return null
            
            return (
              <div className="text-[11px] text-[#6B7280] rounded-md bg-[#1A1A1A]/50 border border-[#2B313A]/30 px-2.5 py-2 flex items-start gap-2">
                <Lightbulb className="w-3 h-3 shrink-0 mt-0.5 text-[#4F6D8A]" />
                <p className="text-[#A4ACB8] leading-relaxed line-clamp-2">{insight}</p>
              </div>
            )
          } catch (e) {
            console.warn('[WORKOUT-OPTIONAL-BLOCK] Coaching insight failed:', e)
            return null
          }
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
          
          {/* [LIVE-WORKOUT-CORRIDOR] Band Selector - uses safeCurrentExercise */}
          {(
            // Authoritative path: Use executionTruth from program generation
            safeCurrentExercise.executionTruth?.bandSelectable === true ||
            safeCurrentExercise.executionTruth?.assistedRecommended === true ||
            safeCurrentExercise.executionTruth?.bandRecommended === true ||
            // Legacy fallback for older programs: heuristic detection
            (!safeCurrentExercise.executionTruth && (
              recommendedBand || 
              safeLower(safeCurrentExercise.note).includes('band') || 
              safeLower(safeCurrentExercise.name).includes('assisted')
            ))
          ) && (
            <BandSelector
              value={bandUsed}
              onChange={setBandUsed}
              recommendedBand={safeCurrentExercise.executionTruth?.recommendedBandColor ?? recommendedBand}
            />
          )}
        </Card>
        
        {/* [LIVE-WORKOUT-CORRIDOR] Complete Set Button - uses safeCurrentExercise */}
        <Button
          onClick={handleCompleteSet}
          disabled={selectedRPE === null}
          className="w-full h-14 bg-[#C1121F] hover:bg-[#A30F1A] text-white text-base font-bold disabled:opacity-50"
        >
          <Check className="w-5 h-5 mr-2" />
          {state.currentSetNumber >= safeCurrentExercise.sets && state.currentExerciseIndex >= exercises.length - 1
            ? 'Finish Workout'
            : state.currentSetNumber >= safeCurrentExercise.sets
              ? 'Next Exercise'
              : 'Log Set'
          }
        </Button>
        
        {/* Secondary Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            {/* [EXECUTION-TRUTH-FIX] Back navigation button */}
            {sessionRuntimeTruth.supportsBackNavigation && state.currentExerciseIndex > 0 && (
              <Button
                variant="ghost"
                onClick={handleReviewPreviousExercise}
                className="text-[#6B7280] hover:text-[#A4ACB8] text-sm h-9 px-3"
              >
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleSkipExercise}
              className="text-[#6B7280] hover:text-[#A4ACB8] text-sm h-9 px-3"
            >
              <SkipForward className="w-3.5 h-3.5 mr-1.5" />
              Skip
            </Button>
          </div>
          <div className="flex items-center gap-1">
            {/* [EXECUTION-TRUTH-FIX] Notes capture button */}
            {sessionRuntimeTruth.supportsNotesCapture && (
              <Button
                variant="ghost"
                onClick={handleOpenNotesModal}
                className={`text-sm h-9 px-3 ${
                  sessionNotes.exerciseNotes[safeExerciseIndex]
                    ? 'text-[#4F6D8A] hover:text-[#6B8CAE]'
                    : 'text-[#6B7280] hover:text-[#A4ACB8]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Note
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleRequestExit}
              className="text-[#6B7280] hover:text-[#A4ACB8] text-sm h-9 px-3"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              End
            </Button>
          </div>
        </div>
      </div>
      </div>
      
      {/* [LIVE-EXECUTION-TRUTH] Adaptive Recommendation Modal */}
      <SafeOptionalSubtree label="AdaptiveRecommendationModal">
      {showAdaptiveModal && adaptiveRecommendation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1A1F26] border-t sm:border border-[#2B313A] sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
            <div className="flex items-start gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#4F6D8A]/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-[#4F6D8A]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#E6E9EF] mb-1">Adaptive Suggestion</h3>
                <p className="text-sm text-[#A4ACB8]">
                  {formatAdaptiveCoachingMessage(adaptiveRecommendation)}
                </p>
              </div>
            </div>
            
            {/* Trigger indicators */}
            <div className="flex flex-wrap gap-1.5">
              {adaptiveRecommendation.triggerInputs.rpeTooHigh && (
                <Badge className="bg-[#C1121F]/10 text-[#C1121F] border-0 text-[10px]">High RPE</Badge>
              )}
              {adaptiveRecommendation.triggerInputs.targetMissedSignificantly && (
                <Badge className="bg-yellow-500/10 text-yellow-500 border-0 text-[10px]">Target Missed</Badge>
              )}
              {adaptiveRecommendation.triggerInputs.repeatedFailures && (
                <Badge className="bg-orange-500/10 text-orange-500 border-0 text-[10px]">Multiple Fails</Badge>
              )}
            </div>
            
            <div className="space-y-2">
              {/* Apply recommendation button */}
              <Button
                onClick={() => {
                  // Apply the recommendation
                  const { suggestedAction } = adaptiveRecommendation
                  if (suggestedAction.type === 'add_band' || suggestedAction.type === 'change_band') {
                    if (suggestedAction.targetBandColor) {
                      setBandUsed(suggestedAction.targetBandColor)
                    }
                  } else if (suggestedAction.type === 'remove_band') {
                    setBandUsed('none')
                  }
                  // Note: switch_exercise would require more integration with the override system
                  setShowAdaptiveModal(false)
                  setAdaptiveRecommendation(null)
                }}
                className="w-full h-12 bg-[#4F6D8A] hover:bg-[#3D5A75] text-white font-medium"
              >
                Apply Suggestion
              </Button>
              
              {/* Keep current button */}
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdaptiveModal(false)
                  setAdaptiveRecommendation(null)
                }}
                className="w-full h-12 border-[#2B313A] text-[#E6E9EF] hover:bg-[#2B313A]"
              >
                Keep Current
              </Button>
            </div>
            
            <p className="text-xs text-center text-[#6B7280]">
              Based on your performance this set
            </p>
          </div>
        </div>
      )}
      </SafeOptionalSubtree>
      
      {/* [EXECUTION-TRUTH-FIX] Inter-Exercise Rest Modal */}
      <SafeOptionalSubtree label="InterExerciseRestModal">
      {showInterExerciseRest && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1A1F26] border-t sm:border border-[#2B313A] sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
            <div className="text-center">
              <Badge className="bg-[#4F6D8A]/20 text-[#4F6D8A] border-0 mb-3">
                Rest Before Next Exercise
              </Badge>
              <h3 className="text-lg font-semibold text-[#E6E9EF] mb-1">
                {exercises[state.currentExerciseIndex + 1]?.name || 'Next Exercise'}
              </h3>
              <p className="text-sm text-[#A4ACB8]">
                {Math.floor(interExerciseRestSeconds / 60)}:{(interExerciseRestSeconds % 60).toString().padStart(2, '0')} rest before starting
              </p>
            </div>
            
            {/* Simple countdown display */}
            <div className="py-4">
              <InterExerciseRestCountdown
                initialSeconds={interExerciseRestSeconds}
                onComplete={handleInterExerciseRestComplete}
              />
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleInterExerciseRestComplete}
                className="w-full h-12 bg-[#C1121F] hover:bg-[#A30F1A] text-white font-medium"
              >
                Ready - Start Next Exercise
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSkipInterExerciseRest}
                className="w-full h-10 text-[#6B7280] hover:text-[#A4ACB8]"
              >
                Skip Rest
              </Button>
            </div>
          </div>
        </div>
      )}
      </SafeOptionalSubtree>
      
      {/* [EXECUTION-TRUTH-FIX] Notes Capture Modal */}
      <SafeOptionalSubtree label="NotesCaptureModal">
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1A1F26] border-t sm:border border-[#2B313A] sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-[#E6E9EF]">Add Note</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotesModal(false)}
                className="h-8 w-8 text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick flags */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Quick Flags</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CONTEXT_FLAGS.map(flag => (
                  <button
                    key={flag.type}
                    onClick={() => handleToggleNoteFlag(flag.type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      currentNoteFlags.includes(flag.type)
                        ? 'bg-[#C1121F] text-white'
                        : 'bg-[#2B313A] text-[#A4ACB8] hover:bg-[#3A4553]'
                    }`}
                  >
                    {flag.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Free text note */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Note (optional)</p>
              <Textarea
                value={currentNoteText}
                onChange={(e) => setCurrentNoteText(e.target.value)}
                placeholder="Add any additional notes..."
                className="bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] resize-none h-20"
              />
            </div>
            
            <Button
              onClick={handleSaveNote}
              className="w-full h-12 bg-[#4F6D8A] hover:bg-[#3D5A75] text-white font-medium"
            >
              Save Note
            </Button>
          </div>
        </div>
      )}
      
      {/* [EXECUTION-TRUTH-FIX] Previous Exercise Review Modal */}
      {isReviewingPreviousExercise && reviewingExerciseIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1A1F26] border-t sm:border border-[#2B313A] sm:rounded-xl p-5 space-y-4 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-[#E6E9EF]">
                Review: {exercises[reviewingExerciseIndex]?.name || 'Previous Exercise'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseReview}
                className="h-8 w-8 text-[#6B7280]"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Completed sets summary */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Completed Sets</p>
              {getCompletedSetsForExercise(reviewingExerciseIndex).length > 0 ? (
                <div className="space-y-2">
                  {getCompletedSetsForExercise(reviewingExerciseIndex).map((set, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#0F1115] rounded-lg p-3">
                      <span className="text-[#A4ACB8] text-sm">Set {set.setNumber}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#E6E9EF] font-medium">
                          {set.holdSeconds ? `${set.holdSeconds}s` : `${set.actualReps} reps`}
                        </span>
                        <Badge variant="outline" className="text-[10px] border-[#3A4553]">
                          RPE {set.actualRPE}
                        </Badge>
                        {set.bandUsed && set.bandUsed !== 'none' && (
                          <Badge className="text-[10px] bg-[#4F6D8A]/20 text-[#4F6D8A] border-0">
                            {set.bandUsed}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#6B7280] text-sm py-4 text-center">No sets logged yet</p>
              )}
            </div>
            
            {/* Notes for this exercise */}
            {sessionNotes.exerciseNotes[reviewingExerciseIndex] && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Notes</p>
                <div className="bg-[#0F1115] rounded-lg p-3">
                  {sessionNotes.exerciseNotes[reviewingExerciseIndex].flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sessionNotes.exerciseNotes[reviewingExerciseIndex].flags.map(flag => (
                        <Badge key={flag} className="text-[10px] bg-[#C1121F]/20 text-[#C1121F] border-0">
                          {AVAILABLE_CONTEXT_FLAGS.find(f => f.type === flag)?.label || flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {sessionNotes.exerciseNotes[reviewingExerciseIndex].freeText && (
                    <p className="text-[#A4ACB8] text-sm">
                      {sessionNotes.exerciseNotes[reviewingExerciseIndex].freeText}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <Button
              onClick={handleCloseReview}
              className="w-full h-12 bg-[#2B313A] hover:bg-[#3A4553] text-[#E6E9EF] font-medium"
            >
              Return to Current Exercise
            </Button>
          </div>
        </div>
      )}
      </SafeOptionalSubtree>
      
      {/* Exit Confirmation Modal */}
      <SafeOptionalSubtree label="ExitConfirmModal">
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
      </SafeOptionalSubtree>
    </div>
  )
}
