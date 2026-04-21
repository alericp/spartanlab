'use client'

// =============================================================================
// [LIVE-STATE-SCANNER-R1] LiveWorkoutStateScanner
//
// Compact, always-visible on-screen diagnostic strip for the authoritative
// live workout corridor. Purpose: make the exact post-Log-Set failure
// diagnosable from a SCREENSHOT ALONE.
//
// Ownership contract:
//   - Scanner truth comes from the SAME flat LiveWorkoutSnapshot the
//     authoritative ActiveWorkoutStartCorridor renders from, plus a
//     process-global event bus mirrored on window.__spartanlabScannerBus
//     that is written ONLY at existing authoritative instrumentation
//     points (Stage A in the corridor, Stage B in the parent, Stage E/G
//     inferred in the live execution surface from observed snapshot
//     deltas). No reducer semantics are changed.
//   - Scanner does NOT derive its own version of state. It displays what
//     the authoritative live surface already computed and handed to the
//     corridor.
//
// Mounting contract:
//   - Only mounted inside ActiveWorkoutStartCorridor (authoritative live
//     path) via the `scannerInput` prop.
//   - NOT mounted in legacy unit render paths - if the user ever sees
//     owner: legacy_surface_leak, the corridor snapshot was handed to the
//     wrong render surface.
//
// Visual contract:
//   - Single compact card, monospace, 2-column grid, screenshot-friendly.
//   - Sits directly under the WS-R3 | SWS-R3 | AWC-R3 build chip area.
//   - No dev panel, no modal, no push of the button rail.
// =============================================================================

import { useSyncExternalStore, useMemo } from 'react'

// -------- Scanner event bus (process-global, mirrored on window) -----------

export type LastCommitStatus =
  | 'none'
  | 'stageA_only'
  | 'parent_received'
  | 'reducer_entered'
  | 'reducer_returned_resting'
  | 'reducer_returned_between_exercise_rest'
  | 'corridor_received_post_commit'
  | 'reverted_after_commit'

interface ReversionLatch {
  status: 'suspected' | 'confirmed'
  priorPhase: string
  nextPhase: string
  priorSet: number
  nextSet: number
  priorCompleted: number
  nextCompleted: number
  dwellMs?: number
  latchedAt: number
}

interface ScannerBus {
  version: number
  lastCommit: LastCommitStatus
  lastCommitAt: number
  reversion: ReversionLatch | null
  listeners: Set<() => void>
}

function getBus(): ScannerBus {
  // SSR-safe stub. No listeners fire server-side; useSyncExternalStore's
  // getServerSnapshot returns a constant so the stub is never read during
  // render.
  if (typeof window === 'undefined') {
    return {
      version: 0,
      lastCommit: 'none',
      lastCommitAt: 0,
      reversion: null,
      listeners: new Set(),
    }
  }
  const w = window as unknown as { __spartanlabScannerBus?: ScannerBus }
  if (!w.__spartanlabScannerBus) {
    w.__spartanlabScannerBus = {
      version: 0,
      lastCommit: 'none',
      lastCommitAt: 0,
      reversion: null,
      listeners: new Set(),
    }
  }
  return w.__spartanlabScannerBus
}

function notify(bus: ScannerBus) {
  bus.version += 1
  for (const fn of Array.from(bus.listeners)) {
    try {
      fn()
    } catch {
      // never throw from a diagnostic bus
    }
  }
}

/**
 * Record a scanner lifecycle event. Called from existing Stage A/B/E/G
 * instrumentation points. Clearing policy:
 *   - stageA_only resets any prior reversion latch because a NEW tap cycle
 *     is starting; the user wants the most recent outcome on screen.
 *   - All other statuses just advance the latch.
 */
export function recordScannerEvent(status: LastCommitStatus): void {
  try {
    const bus = getBus()
    if (status === 'stageA_only') {
      bus.reversion = null
    }
    bus.lastCommit = status
    bus.lastCommitAt = Date.now()
    notify(bus)
  } catch {
    // diagnostic-only, never escalate
  }
}

/**
 * Latch a REVERTED_AFTER_COMMIT badge with compact context fields. The
 * latch persists until the next explicit stageA_only event (new Log Set
 * tap) so the user has time to screenshot.
 */
export function recordScannerReversion(args: {
  confirmed: boolean
  priorPhase: string
  nextPhase: string
  priorSet: number
  nextSet: number
  priorCompleted: number
  nextCompleted: number
  dwellMs?: number
}): void {
  try {
    const bus = getBus()
    bus.reversion = {
      status: args.confirmed ? 'confirmed' : 'suspected',
      priorPhase: args.priorPhase,
      nextPhase: args.nextPhase,
      priorSet: args.priorSet,
      nextSet: args.nextSet,
      priorCompleted: args.priorCompleted,
      nextCompleted: args.nextCompleted,
      dwellMs: args.dwellMs,
      latchedAt: Date.now(),
    }
    bus.lastCommit = 'reverted_after_commit'
    bus.lastCommitAt = Date.now()
    notify(bus)
  } catch {
    // diagnostic-only, never escalate
  }
}

function subscribe(listener: () => void): () => void {
  const bus = getBus()
  bus.listeners.add(listener)
  return () => {
    bus.listeners.delete(listener)
  }
}

function getClientSnapshot(): number {
  return getBus().version
}

function getServerSnapshot(): number {
  return 0
}

// -------- Scanner input contract (decoupled from any other file) ----------

export type ScannerOwner =
  | 'authoritative_active_corridor'
  | 'non_live_surface'
  | 'workout_session_issue_fallback'
  | 'legacy_surface_leak'

/**
 * Plain, self-contained shape the corridor hands to the scanner. Defined
 * here (not imported from the surface) to avoid a circular import between
 * ActiveWorkoutStartCorridor and LiveWorkoutExecutionSurface.
 */
export interface ScannerInput {
  // Build fingerprint segments already on the corridor
  routeBuildChip: string
  parentBuildChip: string
  awcBuildChip: string

  // Authoritative truth forwarded by the live surface
  rawPhase: string
  mode: 'active' | 'resting' | 'block_round_rest'
  exerciseName: string
  currentExerciseIndex: number
  totalExercises: number
  currentSetNumber: number
  exerciseSets: number
  completedSetsCount: number
  totalSetsCount: number
  lastCommitRevision: number

  // Inputs
  repsValue: number
  holdValue: number
  isHoldExercise: boolean
  selectedRPE: number | null

  // Ledger
  recentSetsLength: number

  // Rest
  restType: 'same_exercise' | 'between_exercise' | 'block_round' | 'none'

  // Owner override (e.g. legacy_surface_leak, workout_session_issue_fallback).
  // When absent, scanner derives owner from rawPhase.
  ownerOverride?: ScannerOwner
}

// -------- Component ---------------------------------------------------------

export interface LiveWorkoutStateScannerProps {
  input: ScannerInput
}

export function LiveWorkoutStateScanner({ input }: LiveWorkoutStateScannerProps) {
  // Re-render on every bus event (stage A/B/E/G, reversion latch, clear).
  useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
  const bus = getBus()

  const owner: ScannerOwner = useMemo(() => {
    if (input.ownerOverride) return input.ownerOverride
    const live =
      input.rawPhase === 'active' ||
      input.rawPhase === 'resting' ||
      input.rawPhase === 'between_exercise_rest' ||
      input.rawPhase === 'block_round_rest' ||
      input.rawPhase === 'transitioning'
    return live ? 'authoritative_active_corridor' : 'non_live_surface'
  }, [input.ownerOverride, input.rawPhase])

  // Read tap trace id defensively each render - never throw.
  let tapTraceId: number | null = null
  try {
    if (typeof window !== 'undefined') {
      const w = window as unknown as { __spartanlabCurrentTapTraceId?: number }
      tapTraceId = typeof w.__spartanlabCurrentTapTraceId === 'number' ? w.__spartanlabCurrentTapTraceId : null
    }
  } catch {
    tapTraceId = null
  }

  const buildLine = `${input.routeBuildChip} | ${input.parentBuildChip} | ${input.awcBuildChip}`
  const exLabel = `${input.currentExerciseIndex + 1}/${input.totalExercises} ${truncate(input.exerciseName, 18)}`
  const setLabel = `${input.currentSetNumber}/${input.exerciseSets}`
  const completedLabel = `${input.completedSetsCount}/${input.totalSetsCount}`
  const repsLabel = input.isHoldExercise ? '-' : String(input.repsValue)
  const holdLabel = input.isHoldExercise ? String(input.holdValue) : '-'
  const rpeLabel = input.selectedRPE == null ? 'null' : String(input.selectedRPE)
  const tapLabel = tapTraceId == null ? 'null' : String(tapTraceId)
  const reversionStatus = bus.reversion ? bus.reversion.status : 'clean'
  const lastCommitIsDanger = bus.lastCommit === 'reverted_after_commit'
  const ownerIsDanger = owner === 'legacy_surface_leak'

  return (
    <div
      className="max-w-lg mx-auto mb-1.5 px-2 py-1.5 rounded border border-[#2B313A] bg-[#0B0E13]/80 text-[10px] font-mono text-[#A4ACB8] select-none"
      aria-hidden="true"
      data-scanner="live-workout-state"
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <ScannerLine k="build" v={buildLine} />
        <ScannerLine k="owner" v={owner} danger={ownerIsDanger} />
        <ScannerLine k="rawPhase" v={input.rawPhase} />
        <ScannerLine k="mode" v={input.mode} />
        <ScannerLine k="ex" v={exLabel} />
        <ScannerLine k="set" v={setLabel} />
        <ScannerLine k="completed" v={completedLabel} />
        <ScannerLine k="commitRev" v={String(input.lastCommitRevision)} />
        <ScannerLine k="tap" v={tapLabel} />
        <ScannerLine k="recent" v={String(input.recentSetsLength)} />
        <ScannerLine k="reps" v={repsLabel} />
        <ScannerLine k="hold" v={holdLabel} />
        <ScannerLine k="rpe" v={rpeLabel} />
        <ScannerLine k="restType" v={input.restType} />
        <ScannerLine k="lastCommit" v={bus.lastCommit} danger={lastCommitIsDanger} />
        <ScannerLine k="reversion" v={reversionStatus} danger={reversionStatus !== 'clean'} />
      </div>

      {bus.reversion && (
        <div className="mt-1 pt-1 border-t border-[#2B313A]/60">
          <div className="text-amber-400 font-semibold tracking-wider">
            REVERTED_AFTER_COMMIT
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-0.5">
            <ScannerLine k="from" v={bus.reversion.priorPhase} />
            <ScannerLine k="to" v={bus.reversion.nextPhase} />
            <ScannerLine k="priorSet" v={String(bus.reversion.priorSet)} />
            <ScannerLine k="nextSet" v={String(bus.reversion.nextSet)} />
            <ScannerLine k="priorCompleted" v={String(bus.reversion.priorCompleted)} />
            <ScannerLine k="nextCompleted" v={String(bus.reversion.nextCompleted)} />
            {bus.reversion.dwellMs !== undefined && (
              <ScannerLine k="dwellMs" v={String(bus.reversion.dwellMs)} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ScannerLine({ k, v, danger }: { k: string; v: string; danger?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 min-w-0">
      <span className="text-[#4B5563] uppercase tracking-wider shrink-0">{k}</span>
      <span className={`truncate ${danger ? 'text-amber-400' : 'text-[#E6E9EF]'}`}>{v}</span>
    </div>
  )
}

function truncate(value: string, maxLen: number): string {
  if (typeof value !== 'string' || value.length === 0) return 'Exercise'
  return value.length > maxLen ? value.slice(0, maxLen - 1) + '…' : value
}
