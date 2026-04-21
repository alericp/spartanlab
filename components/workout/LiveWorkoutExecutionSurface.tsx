'use client'

// =============================================================================
// [LIVE-TRUE-ISOLATION-R5] LiveWorkoutExecutionSurface
//
// Purpose:
//   Narrow adapter component that renders ActiveWorkoutStartCorridor and
//   NOTHING else. Accepts a flat, validated snapshot plus plain handler
//   callbacks. Has no derivation chain, no live-workout-machine integration,
//   no session normalization, no restore/boot ownership.
//
// Why this exists:
//   StreamlinedWorkoutSession.tsx is a ~7500-line file that runs thousands
//   of lines of hooks/effects/useMemos BEFORE its `if (isLiveExecutionPhase)`
//   early-return can fire. If any of that parent-chain work throws, the
//   user hits the route-level "Workout Session Issue" boundary even though
//   the authoritative live render path itself is healthy.
//
//   By moving the corridor behind this tiny adapter AND giving the adapter
//   its own inner error boundary, we can:
//
//     1. Validate/clamp every corridor prop at the handoff boundary so a
//        degenerate snapshot field (NaN, null, undefined, wrong type) can
//        never propagate into the corridor.
//
//     2. Tag where a live-render crash actually happened
//        (live_execution_surface_render vs active_workout_corridor_render)
//        so the route-level error footer can display narrowed diagnostics
//        instead of broad "maybe live, maybe ready, maybe build" ambiguity.
//
//     3. Prevent a corridor render failure from tearing down the parent
//        session component tree when possible. The inner boundary catches
//        a corridor render throw, tags the stage, and re-throws so the
//        outer boundary can still display the workout-issue UI - but now
//        with a precisely narrowed layer attribution.
//
// Scope:
//   - receives a plain validated snapshot
//   - renders exactly one <ActiveWorkoutStartCorridor/>
//   - does NOT render pre-start shell, completed shell, legacy unit UI
//   - does NOT own any reducer state, autosave, or normalization
// =============================================================================

import { Component, useEffect, useRef, type ReactNode, type ErrorInfo } from 'react'
import { ActiveWorkoutStartCorridor } from './ActiveWorkoutStartCorridor'
import type {
  CompletedSetInfo,
  SetReasonTag,
} from './ActiveWorkoutStartCorridor'
import type { ExerciseInputMode } from '@/lib/workout/live-workout-authority-contract'
import type { CoachingExpression } from '@/lib/workout/live-workout-action-planner'
import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'

// [PRODUCTION-VISIBLE-BUILD-PROOF] Keeps the R3 fingerprint system intact.
// If the corridor renders the WS-R3 | SWS-R3 | AWC-R3 chip, this adapter
// is live. We intentionally do NOT add a fourth segment - three is the
// agreed contract - but we mark our stage in window so the route-level
// error footer can tell us which layer was mid-render on failure.
const LIVE_EXECUTION_SURFACE_STAGE = 'live_execution_surface_render'
const ACTIVE_WORKOUT_CORRIDOR_STAGE = 'active_workout_corridor_render'

function markLiveStage(stage: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    ;(window as unknown as { __spartanlabLiveBootStage?: string }).__spartanlabLiveBootStage = stage
    console.log('[v0] [live-exec-surface] stage', { stage, ...data })
  } catch {
    // never throw from a diagnostic marker
  }
}

// =============================================================================
// FLAT LIVE SNAPSHOT CONTRACT
// Every field is a plain value. No nested business objects required.
// =============================================================================

export interface LiveWorkoutSnapshot {
  // Mode & labels
  mode: 'active' | 'resting' | 'block_round_rest'
  sessionLabel: string

  // [HOOK-CONTRACT-FIX] Raw machine phase forwarded from the parent so the
  // live-only post-commit observability effect (moved here from the parent
  // to eliminate the ready-shell hook-order violation) can detect the
  // reversion shape `resting -> active` with a regressed setNumber without
  // relying on the lossy `mode` projection.
  machinePhase: string

  // Exercise identity
  exerciseName: string
  exerciseCategory: string

  // Week-scaled effective prescription (already validated in parent)
  exerciseSets: number
  exerciseRepsOrTime: string
  targetRPE?: number

  // Optional weighted prescribed load
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

  // Inputs
  repsValue: number
  holdValue: number
  selectedRPE: RPEValue | null
  bandUsed: ResistanceBandColor | 'none'

  // Notes
  currentSetNote?: string
  currentSetReasonTags?: SetReasonTag[]

  // Recent ledger
  recentSets?: CompletedSetInfo[]

  // Input mode
  inputMode?: ExerciseInputMode
  showLoadInput?: boolean
  showMultiBandSelector?: boolean
  showPerSideToggle?: boolean
  primaryInputLabel?: string

  // Band config
  bandSelectable?: boolean
  recommendedBand?: ResistanceBandColor
  selectedBands?: ResistanceBandColor[]

  // Weighted inputs
  actualLoadUsed?: number | null
  actualLoadUnit?: string
  isPerSide?: boolean

  // Rest fields
  restDurationSeconds?: number
  lastSetRPE?: RPEValue | null
  restType?: 'same_exercise' | 'between_exercise' | 'block_round'
  nextExerciseName?: string

  // Block round rest
  blockLabel?: string
  blockGroupType?: 'superset' | 'circuit' | 'cluster' | 'emom'
  currentRound?: number
  targetRounds?: number
  blockMemberExercises?: Array<{ id: string; name: string }>
  blockRoundRestSeconds?: number
  groupedMemberIndex?: number | null

  // Coaching
  coachingExpression?: CoachingExpression | null

  // Hold primary-input contract
  isHoldExercise?: boolean

  // Commit survival
  lastCommitRevision?: number

  // Build chips
  routeBuildChip?: string
  parentBuildChip?: string

  // Back nav
  canGoBack?: boolean
}

export interface LiveWorkoutHandlers {
  onCompleteSet: () => void
  onSetReps: (value: number) => void
  onSetHold: (value: number) => void
  onSetRPE: (rpe: RPEValue | null) => void
  onSetBand: (band: ResistanceBandColor | 'none') => void
  onSetNote?: (note: string) => void
  onToggleReasonTag?: (tag: SetReasonTag) => void
  onSetSelectedBands?: (bands: ResistanceBandColor[]) => void
  onSetActualLoad?: (load: number, unit?: string) => void
  onSetIsPerSide?: (isPerSide: boolean) => void
  onExit: () => void
  onSaveAndExit?: () => void
  onDiscardWorkout?: () => void
  onSkipSet?: () => void
  onEndExercise?: () => void
  onSkip?: () => void
  onRestComplete?: () => void
  onGoBack?: () => void
  onBlockRoundRestComplete?: () => void
}

// =============================================================================
// DEFENSIVE CLAMPS
// Every snapshot field is re-validated here at the handoff boundary. If the
// parent somehow sends NaN / negative / wrong-type values, we clamp them to
// a safe default rather than propagating bad data into the corridor.
// =============================================================================

function clampInt(value: unknown, fallback: number, min = 0, max = 9999): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const rounded = Math.trunc(value)
  if (rounded < min) return min
  if (rounded > max) return max
  return rounded
}

function clampString(value: unknown, fallback: string, maxLen = 200): string {
  if (typeof value !== 'string') return fallback
  if (value.length === 0) return fallback
  return value.length > maxLen ? value.slice(0, maxLen) : value
}

function clampOptional<T>(value: T | null | undefined, validator: (v: T) => boolean): T | undefined {
  if (value === null || value === undefined) return undefined
  return validator(value) ? value : undefined
}

function clampMode(value: unknown): 'active' | 'resting' | 'block_round_rest' {
  if (value === 'active' || value === 'resting' || value === 'block_round_rest') {
    return value
  }
  return 'active'
}

// =============================================================================
// INNER ERROR BOUNDARY
// Catches corridor render throws specifically. Tags the crash stage before
// re-throwing so the route-level boundary knows the failure was inside the
// corridor, not inside parent-chain hooks or snapshot construction.
// =============================================================================

interface InnerBoundaryState {
  hasError: boolean
  error: Error | null
}

class LiveCorridorErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  InnerBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): InnerBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Tag the stage so the route-level footer can show exactly which layer
    // tore down. The outer boundary does not fire again because this inner
    // boundary swallowed the throw - instead we render a tiny fallback that
    // the outer page can still surround with its Workout Session Issue UI
    // if needed.
    markLiveStage(ACTIVE_WORKOUT_CORRIDOR_STAGE, {
      phase: 'caught_by_inner_boundary',
      errorName: error.name,
      errorMessage: error.message?.slice(0, 200),
    })
    console.error('[v0] [live-exec-surface] corridor render crashed', {
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack?.split('\n').slice(0, 5).join('\n'),
    })
    // Persist for the route-level footer to read even after reload.
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          'spartanlab_live_boot_failure',
          JSON.stringify({
            stage: ACTIVE_WORKOUT_CORRIDOR_STAGE,
            errorName: error.name,
            errorMessage: error.message?.slice(0, 200) ?? '',
            timestamp: Date.now(),
          })
        )
      }
    } catch {}
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// =============================================================================
// FALLBACK UI
// Minimal non-crashing panel when the corridor itself fails. We don't
// re-render the whole route error card here - the route-level boundary
// still owns that - but we keep the user from seeing a blank screen if
// the inner boundary swallowed a corridor throw.
// =============================================================================

function LiveCorridorFallback() {
  return (
    <div className="min-h-[100dvh] bg-[#0F1115] flex flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center space-y-2">
        <h2 className="text-lg font-semibold text-[#E6E9EF]">Live workout display error</h2>
        <p className="text-sm text-[#A4ACB8]">
          The active workout UI hit an error. Your progress is saved. Reload to continue.
        </p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] pt-2">
          layer: live_execution_surface
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// SURFACE COMPONENT
// Thin adapter: validate snapshot fields at the boundary, render one
// corridor, nothing else.
// =============================================================================

export interface LiveWorkoutExecutionSurfaceProps {
  snapshot: LiveWorkoutSnapshot
  handlers: LiveWorkoutHandlers
}

export function LiveWorkoutExecutionSurface({
  snapshot,
  handlers,
}: LiveWorkoutExecutionSurfaceProps) {
  // =========================================================================
  // [HOOK-CONTRACT-FIX] POST-COMMIT OBSERVABILITY (Stage F)
  //
  // These two hooks (useRef + useEffect) previously lived in
  // StreamlinedWorkoutSession BELOW the `if (safeStatus === 'ready')` and
  // `if (safeStatus === 'completed')` component-level early returns. That
  // produced React error #310 (rendered fewer hooks than expected) the
  // instant `safeStatus` transitioned between 'ready' and any live phase,
  // because the parent's hook count changed between renders.
  //
  // They are live-only concerns (post Log-Set commit reversion detection)
  // so they belong here: this surface is ONLY mounted during live execution
  // phases (active / resting / block_round_rest). Moving them here makes
  // the hook contract in the parent uniform across every render path.
  //
  // Diagnostic-only. No dispatch. No mutation. Read-only.
  // =========================================================================
  const postCommitObservationRef = useRef<{
    phase: string
    currentExerciseIndex: number
    currentSetNumber: number
    completedSetsLength: number
    lastSeenTapTraceId: number | null
  }>({
    phase: snapshot.machinePhase,
    currentExerciseIndex: snapshot.currentExerciseIndex,
    currentSetNumber: snapshot.currentSetNumber,
    completedSetsLength: snapshot.completedSetsCount,
    lastSeenTapTraceId: null,
  })

  useEffect(() => {
    const prev = postCommitObservationRef.current
    const curr = {
      phase: snapshot.machinePhase,
      currentExerciseIndex: snapshot.currentExerciseIndex,
      currentSetNumber: snapshot.currentSetNumber,
      completedSetsLength: snapshot.completedSetsCount,
    }
    // Read tap-trace id defensively - never throw from diagnostic code.
    let tapTraceId: number | null = null
    try {
      if (typeof window !== 'undefined') {
        const w = window as unknown as { __spartanlabCurrentTapTraceId?: number }
        tapTraceId = typeof w.__spartanlabCurrentTapTraceId === 'number' ? w.__spartanlabCurrentTapTraceId : null
      }
    } catch {
      tapTraceId = null
    }

    const something_changed =
      prev.phase !== curr.phase ||
      prev.currentExerciseIndex !== curr.currentExerciseIndex ||
      prev.currentSetNumber !== curr.currentSetNumber ||
      prev.completedSetsLength !== curr.completedSetsLength

    if (something_changed) {
      const surface =
        curr.phase === 'active' ||
        curr.phase === 'resting' ||
        curr.phase === 'between_exercise_rest' ||
        curr.phase === 'block_round_rest' ||
        curr.phase === 'transitioning'
          ? 'authoritative_active_corridor'
          : 'non_live_surface'

      console.log('[v0] [log-corridor] stageF post-commit render observed', {
        tapTraceId,
        priorPhase: prev.phase,
        currPhase: curr.phase,
        priorExerciseIndex: prev.currentExerciseIndex,
        currExerciseIndex: curr.currentExerciseIndex,
        priorSetNumber: prev.currentSetNumber,
        currSetNumber: curr.currentSetNumber,
        priorCompletedLength: prev.completedSetsLength,
        currCompletedLength: curr.completedSetsLength,
        renderSurface: surface,
      })

      const revertedToActive =
        prev.phase === 'resting' &&
        curr.phase === 'active' &&
        prev.currentExerciseIndex === curr.currentExerciseIndex &&
        curr.currentSetNumber < prev.currentSetNumber

      if (revertedToActive) {
        console.error('[v0] [log-corridor] POST_COMMIT_REVERSION_CONFIRMED', {
          tapTraceId,
          priorPhase: prev.phase,
          nextPhase: curr.phase,
          exerciseIndex: curr.currentExerciseIndex,
          priorSetNumber: prev.currentSetNumber,
          currentSetNumber: curr.currentSetNumber,
          priorCompletedSetsLength: prev.completedSetsLength,
          currentCompletedSetsLength: curr.completedSetsLength,
          renderSurface: surface,
          hint: 'Phase reverted resting -> active at same exercise with DECREASED currentSetNumber. A second owner is overwriting reducer output.',
        })
      }

      if (curr.completedSetsLength < prev.completedSetsLength) {
        console.error('[v0] [log-corridor] POST_COMMIT_REVERSION_CONFIRMED', {
          tapTraceId,
          reason: 'completedSets_length_decreased',
          priorCompletedSetsLength: prev.completedSetsLength,
          currentCompletedSetsLength: curr.completedSetsLength,
          priorPhase: prev.phase,
          nextPhase: curr.phase,
          renderSurface: surface,
          hint: 'completedSets ledger shrank after a commit - a second owner replaced machineState with a stale snapshot.',
        })
      }
    }

    postCommitObservationRef.current = {
      ...curr,
      lastSeenTapTraceId: tapTraceId,
    }
  }, [
    snapshot.machinePhase,
    snapshot.currentExerciseIndex,
    snapshot.currentSetNumber,
    snapshot.completedSetsCount,
  ])

  // Stage marker fires on every render of the surface - proves the adapter
  // itself mounted successfully even if the corridor fails below.
  markLiveStage(LIVE_EXECUTION_SURFACE_STAGE, {
    mode: snapshot?.mode,
    currentSetNumber: snapshot?.currentSetNumber,
    completedSetsCount: snapshot?.completedSetsCount,
  })
  
  // Clear any stale live-boot-failure record so the route-level
  // diagnostic footer never shows a ghost bucket from a prior HMR /
  // reload cycle. Only the NEW failure (if any) will be displayed.
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('spartanlab_live_boot_failure')
    }
  } catch {}

  // Defensive validation at the handoff boundary. These clamps prevent a
  // degenerate snapshot from propagating into the corridor and causing a
  // downstream render throw.
  const safeMode = clampMode(snapshot.mode)
  const safeSessionLabel = clampString(snapshot.sessionLabel, 'Workout', 120)
  const safeExerciseName = clampString(snapshot.exerciseName, 'Exercise', 120)
  const safeExerciseCategory = clampString(snapshot.exerciseCategory, 'general', 60)
  const safeExerciseSets = clampInt(snapshot.exerciseSets, 3, 1, 20)
  const safeExerciseRepsOrTime = clampString(snapshot.exerciseRepsOrTime, '8-12 reps', 80)
  const safeCurrentSetNumber = clampInt(snapshot.currentSetNumber, 1, 1, 99)
  const safeCurrentExerciseIndex = clampInt(snapshot.currentExerciseIndex, 0, 0, 99)
  const safeTotalExercises = clampInt(snapshot.totalExercises, 1, 1, 99)
  const safeCompletedSetsCount = clampInt(snapshot.completedSetsCount, 0, 0, 999)
  const safeTotalSetsCount = clampInt(snapshot.totalSetsCount, safeExerciseSets, 1, 999)
  const safeElapsedSeconds = clampInt(snapshot.elapsedSeconds, 0, 0, 999999)
  const safeRepsValue = clampInt(snapshot.repsValue, 0, 0, 9999)
  const safeHoldValue = clampInt(snapshot.holdValue, 0, 0, 99999)
  const safeRecentSets = Array.isArray(snapshot.recentSets) ? snapshot.recentSets : []

  return (
    <LiveCorridorErrorBoundary fallback={<LiveCorridorFallback />}>
      <ActiveWorkoutStartCorridor
        // Build proof (unchanged chip contract)
        routeBuildChip={snapshot.routeBuildChip}
        parentBuildChip={snapshot.parentBuildChip}
        // Mode + identity
        mode={safeMode}
        sessionLabel={safeSessionLabel}
        exerciseName={safeExerciseName}
        exerciseCategory={safeExerciseCategory}
        exerciseSets={safeExerciseSets}
        exerciseRepsOrTime={safeExerciseRepsOrTime}
        targetRPE={clampOptional(snapshot.targetRPE, (v): v is number => typeof v === 'number' && v >= 1 && v <= 10)}
        prescribedLoad={snapshot.prescribedLoad}
        // Progress
        currentSetNumber={safeCurrentSetNumber}
        currentExerciseIndex={safeCurrentExerciseIndex}
        totalExercises={safeTotalExercises}
        completedSetsCount={safeCompletedSetsCount}
        totalSetsCount={safeTotalSetsCount}
        elapsedSeconds={safeElapsedSeconds}
        // Inputs
        repsValue={safeRepsValue}
        holdValue={safeHoldValue}
        selectedRPE={snapshot.selectedRPE ?? null}
        bandUsed={snapshot.bandUsed || 'none'}
        // Hold contract
        isHoldExercise={snapshot.isHoldExercise}
        // Commit survival
        lastCommitRevision={snapshot.lastCommitRevision}
        // Notes
        currentSetNote={snapshot.currentSetNote}
        currentSetReasonTags={snapshot.currentSetReasonTags}
        recentSets={safeRecentSets}
        // Input mode
        inputMode={snapshot.inputMode}
        showLoadInput={snapshot.showLoadInput}
        showMultiBandSelector={snapshot.showMultiBandSelector}
        showPerSideToggle={snapshot.showPerSideToggle}
        primaryInputLabel={snapshot.primaryInputLabel}
        // Band config
        bandSelectable={snapshot.bandSelectable}
        recommendedBand={snapshot.recommendedBand}
        selectedBands={snapshot.selectedBands}
        onSetSelectedBands={handlers.onSetSelectedBands}
        // Weighted
        actualLoadUsed={snapshot.actualLoadUsed}
        actualLoadUnit={snapshot.actualLoadUnit}
        onSetActualLoad={handlers.onSetActualLoad}
        isPerSide={snapshot.isPerSide}
        onSetIsPerSide={handlers.onSetIsPerSide}
        // Rest
        restDurationSeconds={snapshot.restDurationSeconds}
        lastSetRPE={snapshot.lastSetRPE}
        restType={snapshot.restType}
        nextExerciseName={snapshot.nextExerciseName}
        // Block round rest
        blockLabel={snapshot.blockLabel}
        blockGroupType={snapshot.blockGroupType}
        currentRound={snapshot.currentRound}
        targetRounds={snapshot.targetRounds}
        blockMemberExercises={snapshot.blockMemberExercises}
        blockRoundRestSeconds={snapshot.blockRoundRestSeconds}
        onBlockRoundRestComplete={handlers.onBlockRoundRestComplete}
        groupedMemberIndex={snapshot.groupedMemberIndex}
        // Coaching
        coachingExpression={snapshot.coachingExpression}
        // Handlers
        onCompleteSet={handlers.onCompleteSet}
        onSetReps={handlers.onSetReps}
        onSetHold={handlers.onSetHold}
        onSetRPE={handlers.onSetRPE}
        onSetBand={handlers.onSetBand}
        onSetNote={handlers.onSetNote}
        onToggleReasonTag={handlers.onToggleReasonTag}
        onExit={handlers.onExit}
        onSaveAndExit={handlers.onSaveAndExit}
        onDiscardWorkout={handlers.onDiscardWorkout}
        onSkipSet={handlers.onSkipSet}
        onEndExercise={handlers.onEndExercise}
        onSkip={handlers.onSkip}
        onRestComplete={handlers.onRestComplete}
        onGoBack={handlers.onGoBack}
        canGoBack={snapshot.canGoBack}
      />
    </LiveCorridorErrorBoundary>
  )
}

// Re-export the stage marker helper so the parent can narrate its
// pre-handoff stages with the same variable name.
export function markLiveBootStage(stage: string, data?: Record<string, unknown>): void {
  markLiveStage(stage, data)
}

export { LIVE_EXECUTION_SURFACE_STAGE, ACTIVE_WORKOUT_CORRIDOR_STAGE }
