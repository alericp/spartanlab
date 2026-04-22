'use client'

// [LIVE_LOG_CORRIDOR_LANDING_V1] Active-branch landing marker. See
// StreamlinedWorkoutSession.tsx for the marker contract. This file's
// carried-fix surface: stage-7 render-time log, `isHoldExercise` prop
// consumed as `isHoldExerciseProp` with `isHoldExerciseFallback` defensive
// detector only, no local state masking Set X/Y / recent sets / inputs.

// [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Active-corridor build chip. Always
// visible (not dev-only). The corridor renders this as the last segment
// of the three-part fingerprint (WS-R3 | SWS-R3 | AWC-R3) at the top of
// the main content area. If this chip does not reach the user's live
// screen, the corridor file bundled on the device is stale.
export const AWC_BUILD_CHIP = 'AWC-R3'

// [UI-CLEANUP-R1] Off-by-default gate for the top-of-screen diagnostic
// surfaces (emerald build chip + LiveWorkoutStateScanner). The underlying
// event bus, props, and instrumentation remain active so flipping this
// to true re-mounts the full diagnostic strip with no other code change.
const SHOW_DIAGNOSTIC_HEADER = false

// =============================================================================
// [GROUP-SCANNER-R1] Off-by-default grouped-method scanner header.
//
// When true, renders a compact read-only diagnostic chip strip that exposes
// the authoritative grouped-method state for the CURRENT live slice - block
// type, position, next member, phase, owner branch. When false, renders
// NOTHING (no layout hole).
//
// This is a diagnostic-visibility tool only. It does NOT:
//   - compute grouped membership itself
//   - mutate state
//   - register any event handlers
//   - alter workout flow in any way
//
// It reads ONLY from props already destructured by the corridor, which are
// themselves derived upstream by StreamlinedWorkoutSession from the
// authoritative sources:
//   - currentBlock.block.groupType            -> blockGroupType
//   - liveExecutionContract.groupedContext    -> groupedMemberIndex
//   - currentBlock.block.label                -> blockLabel
//   - session round/target state               -> currentRound / targetRounds
//   - currentBlock.block.members               -> blockMemberExercises
//   - rest dispatcher                          -> restType
//   - local branch selection                   -> mode (active|resting|block_round_rest)
//
// Flip to true to debug grouped-method truth flow; flip to false to ship.
// =============================================================================
const SHOW_GROUP_SCANNER = false

// Pure read-only diagnostic strip. No state, no effects, no handlers.
type GroupScannerOwner = 'ACTIVE_SURFACE' | 'REST_SURFACE' | 'GROUP_TRANSITION'
interface GroupScannerProps {
  owner: GroupScannerOwner
  // All fields below are pass-through of already-resolved corridor props.
  exerciseName: string
  blockLabel?: string
  blockGroupType?: 'superset' | 'circuit' | 'cluster' | 'emom'
  groupedMemberIndex: number | null
  blockMemberExercises: Array<{ id: string; name: string }>
  currentRound: number
  targetRounds: number
  mode: 'active' | 'resting' | 'block_round_rest'
  restType?: 'same_exercise' | 'between_exercise' | 'block_round'
}
function GroupedMethodScannerStrip({
  owner,
  exerciseName,
  blockLabel,
  blockGroupType,
  groupedMemberIndex,
  blockMemberExercises,
  currentRound,
  targetRounds,
  mode,
  restType,
}: GroupScannerProps) {
  if (!SHOW_GROUP_SCANNER) return null

  // GROUP - upper-cased canonical group type or NONE. We do not invent group
  // types not already produced upstream; cluster and emom are surfaced
  // verbatim because the corridor prop type already admits them.
  const group = blockGroupType ? blockGroupType.toUpperCase() : 'NONE'

  // BLOCK - stable label (e.g. "A1") if upstream supplied one, else "?".
  const block = blockLabel || (blockGroupType ? '?' : '-')

  // POS - 1-based member index within block, formatted as "n/total".
  const memberTotal = blockMemberExercises.length
  const pos =
    groupedMemberIndex !== null && groupedMemberIndex >= 0 && memberTotal > 0
      ? `${groupedMemberIndex + 1}/${memberTotal}`
      : '-'

  // STEP - current member short token. For supersets we prefer the A/B
  // letter already used by the corridor's grouped-identity badge; for
  // circuit/cluster/emom the 1-based index is the canonical display.
  const step =
    groupedMemberIndex !== null && groupedMemberIndex >= 0
      ? blockGroupType === 'superset'
        ? String.fromCharCode(65 + groupedMemberIndex)
        : String(groupedMemberIndex + 1)
      : '-'

  // NEXT - next grouped member's short label (A/B or 1/2). If the current
  // member is the last one in the block, next wraps to the first member
  // for grouped types that cycle (superset/circuit), matching the round-
  // based iteration the session engine uses. For non-grouped, "-".
  let next = '-'
  if (
    groupedMemberIndex !== null &&
    groupedMemberIndex >= 0 &&
    memberTotal > 1 &&
    blockGroupType
  ) {
    const nextIdx = (groupedMemberIndex + 1) % memberTotal
    next =
      blockGroupType === 'superset'
        ? String.fromCharCode(65 + nextIdx)
        : String(nextIdx + 1)
  }

  // PHASE - derived from the corridor's own branch selector plus restType.
  // We only use values already represented in the live corridor; we do
  // NOT introduce BETWEEN_MEMBERS / BETWEEN_ROUNDS unless the underlying
  // truth is present (restType === 'between_exercise' / 'block_round').
  let phase: string
  if (mode === 'active') {
    phase = 'ACTIVE'
  } else if (mode === 'block_round_rest') {
    phase = 'BETWEEN_ROUNDS'
  } else if (restType === 'between_exercise') {
    phase = 'BETWEEN_MEMBERS'
  } else {
    phase = 'REST'
  }

  const round =
    blockGroupType && targetRounds > 0 ? `${currentRound}/${targetRounds}` : null

  return (
    <div
      role="note"
      aria-label="Grouped method scanner (debug)"
      className="font-mono text-[10px] leading-tight text-[#A4ACB8] bg-[#0F1115] border border-[#2B313A] rounded px-2 py-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"
    >
      <span>GROUP:<span className="text-[#E6E9EF]">{group}</span></span>
      <span>BLOCK:<span className="text-[#E6E9EF]">{block}</span></span>
      <span>POS:<span className="text-[#E6E9EF]">{pos}</span></span>
      <span>STEP:<span className="text-[#E6E9EF]">{step}</span></span>
      <span>NEXT:<span className="text-[#E6E9EF]">{next}</span></span>
      <span>PHASE:<span className="text-[#E6E9EF]">{phase}</span></span>
      {round && (
        <span>ROUND:<span className="text-[#E6E9EF]">{round}</span></span>
      )}
      <span>OWNER:<span className="text-[#E6E9EF]">{owner}</span></span>
      <span className="text-[#6B7280] truncate">· {exerciseName}</span>
    </div>
  )
}

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

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronDown, ChevronUp, ChevronRight, Check, SkipForward, X, MessageSquare, Play } from 'lucide-react'
import { MethodInfoBubble } from '@/components/coaching'
import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'
// [LIVE-WORKOUT-NORMALIZERS] Import canonical coaching signal types
import { 
  COACHING_SIGNAL_LABELS,
  type CoachingSignalTag,
} from '@/lib/workout/live-workout-authority-contract'
// [LIVE-STATE-SCANNER-R1] Production-visible diagnostic strip mounted only
// inside this authoritative corridor. See LiveWorkoutStateScanner.tsx for
// contract. Scanner truth is forwarded by the live execution surface via
// the scannerInput prop - corridor does not derive scanner state itself.
import {
  LiveWorkoutStateScanner,
  recordScannerEvent,
  type ScannerInput,
} from './LiveWorkoutStateScanner'

// =============================================================================
// TYPES - Plain props only, no complex dependencies
// =============================================================================

// [LIVE-WORKOUT-NORMALIZERS] Re-export canonical type for backwards compatibility
export type SetReasonTag = CoachingSignalTag

// [LIVE-WORKOUT-NORMALIZERS] Use canonical labels with local fallback for backwards compat
export const SET_REASON_TAG_LABELS: Record<SetReasonTag, string> = COACHING_SIGNAL_LABELS

// [LIVE-WORKOUT-SIGNAL-CHIPS] Flatten + dedupe the coaching signals present on a
// completed set so they can be rendered as visible chips in the live ledgers.
// Reads only what is truly on the set (no fabrication); maps reason-tag enum
// keys through SET_REASON_TAG_LABELS and passes structuredCoachingInputs
// through the same map when they happen to be enum keys, otherwise falls back
// to the raw string. Pure function — safe to call during render.
function collectSetSignalLabels(set: {
  reasonTags?: SetReasonTag[]
  structuredCoachingInputs?: string[]
}): string[] {
  const collected: string[] = []
  if (set.reasonTags && set.reasonTags.length > 0) {
    for (const tag of set.reasonTags) {
      const label = SET_REASON_TAG_LABELS[tag]
      if (label) collected.push(label)
    }
  }
  if (set.structuredCoachingInputs && set.structuredCoachingInputs.length > 0) {
    for (const input of set.structuredCoachingInputs) {
      if (typeof input !== 'string' || input.length === 0) continue
      const mapped = SET_REASON_TAG_LABELS[input as SetReasonTag]
      collected.push(mapped || input)
    }
  }
  if (collected.length === 0) return collected
  // Dedupe preserving first-seen order
  const seen = new Set<string>()
  const out: string[] = []
  for (const label of collected) {
    if (seen.has(label)) continue
    seen.add(label)
    out.push(label)
  }
  return out
}

// [LIVE-WORKOUT-NORMALIZERS] Primary signals shown in quick-tag UI (keep UI clean)
// Full signal list available via COACHING_SIGNAL_TAGS for advanced use
export const PRIMARY_SIGNAL_TAGS: CoachingSignalTag[] = [
  'too_easy',
  'too_hard',
  'pain',
  'fatigue',
  'form_issue',
  'grip_limited',
  'balance_issue',
  'focus_lost',
  'straight_arm_fatigue',
  'support_mismatch',
  'load_mismatch',
]

export interface CompletedSetInfo {
  setNumber: number
  actualReps: number
  holdSeconds?: number
  actualRPE: RPEValue
  bandUsed?: ResistanceBandColor | 'none'
  reasonTags?: SetReasonTag[]
  // [LIVE-WORKOUT-AUTHORITY] Extended execution facts
  inputMode?: import('@/lib/workout/live-workout-authority-contract').ExerciseInputMode
  selectedBands?: ResistanceBandColor[]
  actualLoadUsed?: number
  actualLoadUnit?: string
  isPerSide?: boolean
  structuredCoachingInputs?: string[]
  // [COMPLETED-SET-NOTE-SURFACE] Optional free-text coaching note captured
  // during this set. Display-only field; persistence/reducer contracts are
  // unchanged. Renders as a subtle MessageSquare indicator + one-line
  // truncated preview in the Recent Sets and rest-screen Completed Sets
  // ledgers so the user can immediately verify feedback was captured.
  note?: string
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
  
  // [LIVE-WORKOUT-AUTHORITY] Input mode contract - drives visible controls
  inputMode?: import('@/lib/workout/live-workout-authority-contract').ExerciseInputMode
  showLoadInput?: boolean
  showMultiBandSelector?: boolean
  showPerSideToggle?: boolean
  primaryInputLabel?: string
  
  // Band configuration
  bandSelectable?: boolean
  recommendedBand?: ResistanceBandColor
  // [LIVE-WORKOUT-AUTHORITY] Multi-band selection
  selectedBands?: ResistanceBandColor[]
  onSetSelectedBands?: (bands: ResistanceBandColor[]) => void
  
  // [LIVE-WORKOUT-AUTHORITY] Weighted exercise inputs
  actualLoadUsed?: number | null
  actualLoadUnit?: string
  onSetActualLoad?: (load: number, unit?: string) => void
  
  // [LIVE-WORKOUT-AUTHORITY] Per-side tracking
  isPerSide?: boolean
  onSetIsPerSide?: (isPerSide: boolean) => void
  
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
  // [GROUPED-IDENTITY-FIX] Current exercise position within grouped block
  groupedMemberIndex?: number | null  // 0 = A, 1 = B, etc. null = not in grouped block
  
  // [LIVE-WORKOUT-ACTION-PLANNER] Adaptive coaching expression from planner
  coachingExpression?: import('@/lib/workout/live-workout-action-planner').CoachingExpression | null
  
  // [ACTIVE-SET-SAVE-PARITY] Authoritative primary input kind from parent.
  // The corridor MUST render its primary input from this prop rather than
  // re-inferring hold-vs-reps from raw prescription text. Parent derives
  // this via the canonical isHoldUnit() detector (lib/workout/execution-unit-contract.ts)
  // - the SAME detector handleCompleteSet uses to decide whether to persist
  // a hold or a rep. When this prop is omitted, the corridor falls back to a
  // defensive local check that now also recognizes "8s"/"6s" shorthand.
  isHoldExercise?: boolean
  
  // [LIVE-LOG-COMMIT-SURVIVAL] Parent-owned authoritative commit revision.
  // This is the ONLY proof of a successful committed set. Increments once
  // per real reducer commit (normalizedCompletedSets.length in the parent).
  // The corridor never invents its own "was the commit successful?" state;
  // it derives a brief visual pulse from this prop transitioning upward.
  // If this prop does not change after a Log Set tap, no set was committed
  // and no local state here can mask that fact into a fake success.
  lastCommitRevision?: number
  
  // [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Always-visible (NOT dev-only) build
  // fingerprint segments. Rendered together as a small muted chip at the
  // top of the corridor main content area:
  //   routeBuildChip | parentBuildChip | AWC_BUILD_CHIP
  // Missing chip on a live workout screen === the phone is running a stale
  // compiled bundle (or a non-authoritative legacy surface is rendering).
  routeBuildChip?: string
  parentBuildChip?: string

  // [LIVE-STATE-SCANNER-R1] Compact production scanner input. When present,
  // the corridor renders a small monospace diagnostic strip directly below
  // the build chip. Input is derived by LiveWorkoutExecutionSurface from
  // the same flat snapshot the corridor renders from - single-owner truth.
  scannerInput?: ScannerInput

  // Callbacks (passed from parent)
  onCompleteSet: () => void
  onSetReps: (value: number) => void
  onSetHold: (value: number) => void
  onSetRPE: (rpe: RPEValue | null) => void
  onSetBand: (band: ResistanceBandColor | 'none') => void
  onSetNote?: (note: string) => void
  onToggleReasonTag?: (tag: SetReasonTag) => void
  
  // Exit intent handlers - three distinct user actions
  onExit: () => void // Legacy/fallback - opens modal
  onSaveAndExit?: () => void // Save progress for resume, then leave
  onDiscardWorkout?: () => void // Clear resumable state, then leave
  
  // [LIVE-WORKOUT-AUTHORITY] Distinct skip actions
  onSkipSet?: () => void      // Skip current set only, continue to next set of same exercise
  onEndExercise?: () => void  // Skip all remaining sets of current exercise, advance to next
  onSkip?: () => void         // Legacy fallback - if neither above is provided, use this
  onRestComplete?: () => void
  
  // Back navigation
  onGoBack?: () => void
  canGoBack?: boolean // True if user can navigate backward (not at first set of first exercise)
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

// [ACTIVE-SET-SAVE-PARITY] Defensive fallback ONLY. The corridor consumes the
// authoritative `isHoldExercise` prop from the parent, which uses the
// canonical isHoldUnit() detector (same one handleCompleteSet uses for
// persistence). This local detector runs ONLY when the prop is undefined
// and is now hardened to also recognize terminal "s" shorthand like "8s"
// and "6s" - previously it only matched "sec"/"hold", which caused Planche
// Leans on Week 2 (effectiveRepsOrTime = "8s") to render the reps input
// while persistence took the hold branch (split-brain).
function isHoldExerciseFallback(repsOrTime: string): boolean {
  const lower = safeLower(repsOrTime)
  if (lower.includes('sec') || lower.includes('hold')) return true
  // Match "8s", "10s", "3 s" - a pure number (with optional decimal) followed
  // by terminal "s" and no further numeric content. Guards against "3x8-12 reps"
  // which should remain a reps prescription.
  if (/^\s*\d+(?:\.\d+)?\s*s\s*$/.test(lower)) return true
  return false
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
  // [UI-DENSITY-R4] space-y 1.5 -> 1 and button py 2.5 -> 2. The buttons
  // remain >=40px tall (py-2 + text-base line-height), safely above the
  // 44px Apple / 48dp Material tap-target guideline once the 1.5 row gap
  // is included.
  return (
    <div className="space-y-1">
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
            className={`py-2 rounded-lg text-base font-bold transition-all ${
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
  
  // [LIVE-WORKOUT-CORRIDOR] Press-and-hold auto-repeat.
  //
  // Contract:
  //   - Tap (pointer down then up quickly)     -> single step, as before.
  //   - Press-and-hold past ~350ms             -> auto-step begins.
  //   - Continuing to hold                     -> steps accelerate
  //                                              (250ms -> 100ms -> 50ms).
  //   - Pointer up / pointer leave / cancel
  //     / unmount / user lifts finger          -> all timers cleared,
  //                                              no leaked intervals.
  //
  // We keep the current value in a ref so the repeating tick always reads
  // the latest value (closures captured at pointer-down go stale as
  // soon as we onChange once).
  const valueRef = useRef(value)
  valueRef.current = value
  
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  
  // Timers for both the initial delay and the repeating tick. Kept as
  // refs so the cleanup-on-release helper sees the current set, not a
  // stale closure.
  const holdDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const stopRepeat = useCallback(() => {
    if (holdDelayRef.current) {
      clearTimeout(holdDelayRef.current)
      holdDelayRef.current = null
    }
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current)
      repeatIntervalRef.current = null
    }
  }, [])
  
  const stepValue = useCallback((direction: 1 | -1) => {
    const current = valueRef.current
    const next = direction === 1 ? current + 1 : Math.max(1, current - 1)
    if (next !== current) {
      onChangeRef.current(next)
    }
  }, [])
  
  const startRepeat = useCallback((direction: 1 | -1) => {
    // Immediate single step on tap.
    stepValue(direction)
    // If we're already repeating (shouldn't happen, but be defensive),
    // clear first.
    stopRepeat()
    // After an initial hold window, begin auto-repeat.
    holdDelayRef.current = setTimeout(() => {
      let tickCount = 0
      // Start at a comfortable 250ms cadence; after a few ticks we speed
      // up so long holds don't feel stuck.
      let currentInterval = 250
      const scheduleNext = () => {
        repeatIntervalRef.current = setInterval(() => {
          stepValue(direction)
          tickCount += 1
          // Accelerate at 8 and 16 ticks.
          if (tickCount === 8 || tickCount === 16) {
            currentInterval = tickCount === 8 ? 100 : 50
            if (repeatIntervalRef.current) {
              clearInterval(repeatIntervalRef.current)
              repeatIntervalRef.current = null
            }
            scheduleNext()
          }
        }, currentInterval)
      }
      scheduleNext()
    }, 350)
  }, [stepValue, stopRepeat])
  
  // Hard-stop any pending timers when the component unmounts, even if
  // the pointer-up/leave handlers somehow never fired.
  useEffect(() => {
    return () => {
      stopRepeat()
    }
  }, [stopRepeat])
  
  const buttonClass =
    'w-12 h-12 rounded-lg bg-[#0F1115] border border-[#2B313A] text-[#A4ACB8] text-xl font-bold active:bg-[#2B313A] select-none touch-none'
  
  // [UI-DENSITY-R4] space-y 1.5 -> 1 and center readout text-3xl -> text-2xl.
  // The +/- buttons keep their 48x48px hitboxes so touch accuracy is
  // unaffected.
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">{label}</span>
        <span className="text-xs text-[#6B7280]">Target: {targetValue}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onPointerDown={(e) => {
            e.preventDefault()
            startRepeat(-1)
          }}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onContextMenu={(e) => e.preventDefault()}
          className={buttonClass}
        >
          -
        </button>
        <span className="w-16 text-center text-2xl font-bold text-[#E6E9EF] tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onPointerDown={(e) => {
            e.preventDefault()
            startRepeat(1)
          }}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          onContextMenu={(e) => e.preventDefault()}
          className={buttonClass}
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

/**
 * [LIVE-WORKOUT-AUTHORITY] Multi-Band Selector
 * Allows selecting multiple assistance bands simultaneously.
 * When bands are selected, removing one keeps the others.
 */
interface MultiBandSelectorProps {
  selectedBands: ResistanceBandColor[]
  onChange: (bands: ResistanceBandColor[]) => void
  recommendedBand?: ResistanceBandColor
}

function MultiBandSelector({ selectedBands, onChange, recommendedBand }: MultiBandSelectorProps) {
  const hasNoBands = selectedBands.length === 0
  
  const toggleBand = (band: ResistanceBandColor) => {
    if (selectedBands.includes(band)) {
      // Remove the band
      onChange(selectedBands.filter(b => b !== band))
    } else {
      // Add the band
      onChange([...selectedBands, band])
    }
  }
  
  const clearAll = () => {
    onChange([])
  }
  
  // Sort selected bands for consistent display
  const sortedSelectedBands = [...selectedBands].sort((a, b) => 
    ALL_BAND_COLORS.indexOf(a) - ALL_BAND_COLORS.indexOf(b)
  )
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#A4ACB8]">Assistance Band(s)</span>
        {recommendedBand && (
          <span className="text-xs text-[#6B7280]">Rec: {BAND_SHORT_LABELS[recommendedBand]}</span>
        )}
      </div>
      
      {/* Selected bands summary */}
      {selectedBands.length > 0 && (
        <div className="flex items-center gap-2 pb-1">
          <span className="text-xs text-[#6B7280]">Selected:</span>
          <div className="flex gap-1">
            {sortedSelectedBands.map(band => {
              const colors = BAND_COLORS[band]
              return (
                <span 
                  key={band}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}
                >
                  {BAND_SHORT_LABELS[band]}
                </span>
              )
            })}
          </div>
          <button 
            onClick={clearAll}
            className="text-xs text-[#6B7280] hover:text-[#A4ACB8] ml-auto"
          >
            Clear
          </button>
        </div>
      )}
      
      {/* Band selection grid */}
      <div className="flex flex-wrap gap-1.5">
        {/* None option */}
        <button
          onClick={clearAll}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            hasNoBands
              ? 'bg-[#2B313A] text-[#E6E9EF] border border-[#3B4250]'
              : 'bg-transparent text-[#6B7280] border border-[#2B313A] hover:border-[#3B4250]'
          }`}
        >
          None
        </button>
        
        {/* Band options - multi-select */}
        {ALL_BAND_COLORS.map((band) => {
          const isSelected = selectedBands.includes(band)
          const colors = BAND_COLORS[band]
          
          return (
            <button
              key={band}
              onClick={() => toggleBand(band)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.text} ${colors.border} border ring-1 ring-offset-1 ring-offset-[#0F1115] ring-current`
                  : `bg-transparent ${colors.text} border ${colors.border} opacity-60 hover:opacity-100`
              }`}
            >
              {BAND_SHORT_LABELS[band]}
            </button>
          )
        })}
      </div>
      
      {/* Adaptive hint */}
      <div className="text-[10px] text-[#6B7280] text-center">
        Tap multiple bands to combine assistance
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
  // [LIVE-WORKOUT-AUTHORITY] Input mode contract. The prop is still
  // accepted on the props interface for forward compatibility but is no
  // longer destructured here because [UI-DENSITY-R4] removed the
  // dedicated Input Mode header row from the Input card; the same
  // information is conveyed by the category badge beside the exercise
  // name and by the Reps/Hold + Per-Side labels already present.
  showLoadInput = false,
  showMultiBandSelector = false,
  showPerSideToggle = false,
  primaryInputLabel,
  bandSelectable = false,
  recommendedBand,
  // [LIVE-WORKOUT-AUTHORITY] Multi-band selection
  selectedBands = [],
  onSetSelectedBands,
  // [LIVE-WORKOUT-AUTHORITY] Weighted exercise inputs
  actualLoadUsed,
  actualLoadUnit = 'lbs',
  onSetActualLoad,
  // [LIVE-WORKOUT-AUTHORITY] Per-side tracking
  isPerSide = false,
  onSetIsPerSide,
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
  groupedMemberIndex = null,
  // [LIVE-WORKOUT-ACTION-PLANNER] Adaptive coaching expression
  coachingExpression,
  // [ACTIVE-SET-SAVE-PARITY] Authoritative primary-input kind from parent
  isHoldExercise: isHoldExerciseProp,
  // [LIVE-LOG-COMMIT-SURVIVAL] Authoritative commit revision from parent
  lastCommitRevision,
  // [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Build chips (always visible)
  routeBuildChip = '?',
  parentBuildChip = '?',
  // [LIVE-STATE-SCANNER-R1] Optional production scanner input
  scannerInput,
  onCompleteSet,
  onSetReps,
  onSetHold,
  onSetRPE,
  onSetBand,
  onSetNote,
  onToggleReasonTag,
  onExit,
  onSaveAndExit,
  onDiscardWorkout,
  // [LIVE-WORKOUT-AUTHORITY] Distinct skip actions
  onSkipSet,
  onEndExercise,
  onSkip, // Legacy fallback
  onRestComplete,
  onGoBack,
  canGoBack = false,
}: ActiveWorkoutCorridorProps) {

  // [ACTIVE-SET-SAVE-PARITY] Prefer authoritative parent-owned truth. The
  // parent derives this via the canonical isHoldUnit() detector from
  // lib/workout/execution-unit-contract.ts - the SAME detector
  // handleCompleteSet uses when persisting the logged set, which is what
  // guarantees edit-path and save-path use the same classification. The
  // local fallback only runs when the prop is undefined and is hardened
  // to recognize "8s"/"6s" shorthand so even legacy callers without the
  // prop render correctly.
  const isHold = typeof isHoldExerciseProp === 'boolean'
    ? isHoldExerciseProp
    : isHoldExerciseFallback(exerciseRepsOrTime)
  const targetValue = parseTargetValue(exerciseRepsOrTime)
  const progressPercent = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0
  
  // ---------------------------------------------------------------------
  // [LOAD-PRESS-AND-HOLD] Weighted load +/- auto-repeat
  //
  // Mirrors the RepsHoldInput press-and-hold pattern already in this file
  // (see the `stopRepeat` / `startRepeat` helpers around line 343 that back
  // the reps/hold stepper). The refs below track the LATEST load value,
  // step, unit, and callback so auto-repeat ticks read live values instead
  // of stale closure captures - identical technique to valueRef /
  // onChangeRef in RepsHoldInput. Nothing touches actualLoadUsed ownership:
  // the parent remains source of truth; we only call onSetActualLoad more
  // often while the button is held.
  // ---------------------------------------------------------------------
  const loadValueRef = useRef<number>(0)
  const loadStepRef = useRef<number>(2.5)
  const loadUnitRef = useRef<string | undefined>(actualLoadUnit)
  const loadOnChangeRef = useRef<typeof onSetActualLoad>(onSetActualLoad)
  const loadHoldDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadRepeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // Keep callback ref fresh. Load value + step + unit refs are synced in
  // the weighted-load IIFE below (where currentLoad / loadStep are derived)
  // so every tick uses the post-commit parent value.
  loadOnChangeRef.current = onSetActualLoad
  
  const stopLoadRepeat = useCallback(() => {
    if (loadHoldDelayRef.current) {
      clearTimeout(loadHoldDelayRef.current)
      loadHoldDelayRef.current = null
    }
    if (loadRepeatIntervalRef.current) {
      clearInterval(loadRepeatIntervalRef.current)
      loadRepeatIntervalRef.current = null
    }
  }, [])
  
  const stepLoad = useCallback((direction: 1 | -1) => {
    const current = loadValueRef.current
    const step = loadStepRef.current
    const next = direction === 1 ? current + step : Math.max(0, current - step)
    if (next !== current) {
      loadOnChangeRef.current?.(next, loadUnitRef.current)
    }
  }, [])
  
  const startLoadRepeat = useCallback((direction: 1 | -1) => {
    // Immediate single step on tap - matches RepsHoldInput behavior.
    stepLoad(direction)
    stopLoadRepeat()
    loadHoldDelayRef.current = setTimeout(() => {
      let tickCount = 0
      let currentInterval = 250
      const scheduleNext = () => {
        loadRepeatIntervalRef.current = setInterval(() => {
          stepLoad(direction)
          tickCount += 1
          if (tickCount === 8 || tickCount === 16) {
            currentInterval = tickCount === 8 ? 100 : 50
            if (loadRepeatIntervalRef.current) {
              clearInterval(loadRepeatIntervalRef.current)
              loadRepeatIntervalRef.current = null
            }
            scheduleNext()
          }
        }, currentInterval)
      }
      scheduleNext()
    }, 350)
  }, [stepLoad, stopLoadRepeat])
  
  // Hard-stop any pending load timers on unmount, even if pointer
  // up/leave/cancel never fired (e.g. exercise transition, rest screen).
  useEffect(() => {
    return () => {
      stopLoadRepeat()
    }
  }, [stopLoadRepeat])
  
  // [log-corridor] Stage 7: corridor received these props THIS render. Paired
  // with stage 6 in StreamlinedWorkoutSession.tsx - if stage 6 shows fresh
  // post-commit values but stage 7 shows stale, the bug is inside the
  // corridor component (impossible right now: the corridor has zero local
  // state that masks set-number/recent-sets/inputs, and all of those render
  // directly from props). If stage 7 matches stage 6 but the UI still shows
  // Set 1/5, the bug is in the JSX below this line - either an early return
  // in a rest-mode branch or a derived display value shadowing the prop.
  console.log('[v0] [log-corridor] stage7 corridor render values', {
    mode,
    currentSetNumber,
    exerciseSets,
    recentSetsLength: recentSets.length,
    selectedRPE,
    repsValue,
    holdValue,
    isHold,
    completedSetsCount,
  })
  
  // Local UI state
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSetNotes, setShowSetNotes] = useState(false)
  // [UI-DENSITY-R4] Recent Sets is collapsed by default during the active
  // moment so the Log Set CTA and secondary rail remain in the first
  // viewport on 640-720px-tall Android screens. User can expand with one
  // tap to see the full ledger. No functionality is removed.
  const [showRecentSets, setShowRecentSets] = useState(false)
  
  // =========================================================================
  // [LIVE-LOG-COMMIT-SURVIVAL] PARENT-OWNED COMMIT AUTHORITY
  //
  // The corridor has ZERO local ownership of "did the set commit?" state.
  // The previous local `isSaving` flag + 800ms safety timeout + signature
  // ref formed a parallel mini-state machine around commit success that
  // could mask, delay, or drop a healthy commit (e.g. by swallowing the
  // next tap because isSaving was still true after a commit that did
  // advance state but whose signature change the effect hadn't observed
  // yet in render order).
  //
  // NEW RULE (single owner):
  //   - The parent's machine reducer is the ONLY owner of commit success.
  //   - The parent increments `lastCommitRevision` once per real commit
  //     (it's `normalizedCompletedSets.length`, which only changes when
  //     the reducer actually appended a set).
  //   - The corridor button is gated ONLY by hard-invalid input (no RPE).
  //   - A brief visual "just logged" pulse is DERIVED from the revision
  //     transitioning upward - it's feedback, not an owner of truth.
  //
  // If the parent does not advance the revision after a Log Set tap,
  // NOTHING in the corridor can invent a fake success state. That is the
  // exact guarantee the surgery is enforcing.
  // =========================================================================
  const [justLoggedPulse, setJustLoggedPulse] = useState(false)
  const lastSeenRevisionRef = useRef<number>(
    typeof lastCommitRevision === 'number' ? lastCommitRevision : completedSetsCount
  )
  
  // Derive the pulse from authoritative parent revision transitioning upward.
  // This fires exactly once per real commit (reducer-backed), never on stale
  // renders and never as a synthetic local signal.
  useEffect(() => {
    const currentRevision =
      typeof lastCommitRevision === 'number' ? lastCommitRevision : completedSetsCount
    if (currentRevision > lastSeenRevisionRef.current) {
      console.log('[v0] [log-corridor] authoritative commit revision advanced', {
        priorRevision: lastSeenRevisionRef.current,
        nextRevision: currentRevision,
        currentSetNumber,
        completedSetsCount,
      })
      lastSeenRevisionRef.current = currentRevision
      setJustLoggedPulse(true)
    }
  }, [lastCommitRevision, completedSetsCount, currentSetNumber])
  
  // Visual pulse is purely cosmetic feedback - 500ms window then clears.
  useEffect(() => {
    if (!justLoggedPulse) return
    const t = setTimeout(() => setJustLoggedPulse(false), 500)
    return () => clearTimeout(t)
  }, [justLoggedPulse])
  
  const handleLogSet = useCallback(() => {
    // [LIVE-LOG-COMMIT-SURVIVAL] Corridor tap handler. Validates ONLY hard-
    // invalid input (no RPE selected). No local in-flight gate - the parent
    // authoritative commit path is the only arbiter of success.
    //
    // [POST-COMMIT-FREEZE-TRACE-R3] STAGE A.
    // Allocate a fresh monotonic tap trace id once per real (RPE-present)
    // tap. Window-mirrored so stages B-G can read the same id without
    // threading it through props. The id is bumped BEFORE onCompleteSet
    // fires so the entire downstream commit chain sees the new id.
    console.log('[v0] [log-corridor] stageA corridor handleLogSet entered', {
      selectedRPE,
      willReturnEarly: selectedRPE === null,
      currentSetNumber,
      completedSetsCount,
    })
    if (selectedRPE === null) {
      console.log('[v0] [log-corridor] stageA corridor handleLogSet returned early: no_rpe_selected')
      return
    }
    // Allocate the tap trace id now. readCurrentTapTraceId() is called
    // lazily to avoid an import cycle with StreamlinedWorkoutSession.
    let tapTraceId: number | null = null
    if (typeof window !== 'undefined') {
      const w = window as unknown as { __spartanlabCurrentTapTraceId?: number }
      tapTraceId = typeof w.__spartanlabCurrentTapTraceId === 'number' ? w.__spartanlabCurrentTapTraceId + 1 : 1
      w.__spartanlabCurrentTapTraceId = tapTraceId
    }
    console.log('[v0] [log-corridor] stageA tap trace allocated', {
      tapTraceId,
      currentSetNumber,
      completedSetsCount,
      priorLastCommitRevision: lastCommitRevision,
    })
    // [LIVE-STATE-SCANNER-R1] Latch stage A onto the on-screen scanner so
    // a screenshot taken immediately after the tap proves the corridor
    // handler fired. Clears any prior reversion latch so the scanner
    // reflects the NEW tap cycle, not the previous one.
    recordScannerEvent('stageA_only')
    console.log('[v0] [log-corridor] stageA corridor forwarded to parent onCompleteSet', { tapTraceId })
    onCompleteSet()
  }, [selectedRPE, onCompleteSet, currentSetNumber, completedSetsCount, lastCommitRevision])
  
  // [POST-COMMIT-FREEZE-TRACE-R3] STAGE G.
  // Observe when the corridor re-renders after a successful commit. The
  // authoritative proof of a commit landing at this surface is
  // lastCommitRevision advancing. When it does, we log the current tap
  // trace id + the new (mode, currentSetNumber, completedSetsCount) the
  // corridor received from its parent so Stage G can be correlated with
  // stages A-F upstream.
  const stageGLastObservedRevisionRef = useRef<number | undefined>(lastCommitRevision)
  useEffect(() => {
    const prior = stageGLastObservedRevisionRef.current
    if (prior !== lastCommitRevision) {
      const tapTraceId = typeof window !== 'undefined'
        ? ((window as unknown as { __spartanlabCurrentTapTraceId?: number }).__spartanlabCurrentTapTraceId ?? null)
        : null
      console.log('[v0] [log-corridor] stageG corridor re-render observed new props after commit', {
        tapTraceId,
        priorLastCommitRevision: prior,
        newLastCommitRevision: lastCommitRevision,
        mode,
        currentSetNumber,
        currentExerciseIndex,
        completedSetsCount,
        renderSurface: 'authoritative_active_corridor',
      })
      stageGLastObservedRevisionRef.current = lastCommitRevision
    }
  }, [lastCommitRevision, mode, currentSetNumber, currentExerciseIndex, completedSetsCount])
  
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
    /* [UI-DENSITY-R3] Switch min-h-screen -> min-h-[100dvh] so the live
       workout corridor uses the dynamic viewport height (accounts for
       browser UI chrome retraction on mobile). This materially reduces
       the "everything pushed below the fold" feel. */
    <div className="min-h-[100dvh] bg-[#0F1115] flex flex-col overflow-x-hidden">
      {/* ========== STICKY HEADER ========== */}
      {/* [UI-DENSITY-R3] Header vertical padding 2.5 -> 2 */}
      <div className="sticky top-0 z-10 bg-[#0F1115]/95 backdrop-blur-sm border-b border-[#2B313A]">
        <div className="px-4 py-2">
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
      {/* [UI-DENSITY] Third pass: top padding dropped to py-1.5 and section
          gap to space-y-1.5 so the exercise card, input card, coaching row,
          Log Set, and bottom rail all fit closer to one common-Android
          screen height without hiding any control. */}
      <div className="flex-1 px-4 py-1.5">
        {/* [PRODUCTION-VISIBLE-BUILD-PROOF-R3] Always-visible three-segment
            authoritative build fingerprint. NOT dev-only. Shown in BOTH
            preview and production so the user's screenshots can decisively
            prove whether the phone is running the latest bundle.
            
            Surface contract:
              - Only this authoritative ActiveWorkoutStartCorridor renders
                the emerald WS-R3 | SWS-R3 | AWC-R3 chip.
              - Legacy unit-based / Stage-1 render paths in
                StreamlinedWorkoutSession render a rose LEGACY-ACTIVE-R3
                chip instead (see StreamlinedWorkoutSession.tsx).
              - If the user sees the rose chip during a live workout,
                isLiveExecutionPhase gate leaked and a legacy surface
                is rendering.
              - If the user sees NO chip at all, the phone is running a
                stale compiled bundle from before this commit. */}
        {/* [UI-CLEANUP-R1] The emerald build chip row and the compact
            LiveWorkoutStateScanner strip are now suppressed from the normal
            production live workout UI. All underlying wiring (props,
            scanner event bus, Stage A/B/E/F instrumentation calls,
            post-commit rewind fix, corridor ownership) is intentionally
            left fully intact - only the visible JSX is gated off. Flip
            SHOW_DIAGNOSTIC_HEADER to true to re-mount both surfaces
            without any other code change. */}
        {SHOW_DIAGNOSTIC_HEADER && (
          <>
            <div className="max-w-lg mx-auto mb-1 flex justify-end">
              <span
                className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 select-none"
                aria-hidden
              >
                {routeBuildChip} | {parentBuildChip} | {AWC_BUILD_CHIP}
              </span>
            </div>
            {scannerInput && <LiveWorkoutStateScanner input={scannerInput} />}
          </>
        )}
        <div className="max-w-lg mx-auto space-y-1.5">
          
          {/* ========== RESTING MODE UI ========== */}
          {mode === 'resting' && (
            <>
              {/* [GROUP-SCANNER-R1] Scanner in rest branch. Reports
                  OWNER:REST_SURFACE and surfaces restType-derived PHASE
                  (BETWEEN_MEMBERS vs plain REST) so we can see whether
                  grouped rest is correctly entering a between-member
                  phase rather than a same-exercise phase. */}
              <GroupedMethodScannerStrip
                owner="REST_SURFACE"
                exerciseName={exerciseName}
                blockLabel={blockLabel}
                blockGroupType={blockGroupType}
                groupedMemberIndex={groupedMemberIndex}
                blockMemberExercises={blockMemberExercises}
                currentRound={currentRound}
                targetRounds={targetRounds}
                mode="resting"
                restType={restType}
              />

              {/* Last Set RPE Summary */}
              {/* [BAND-TRUTH-R6] Rest-mode "Last set RPE" card now also
                  carries a compact used-band chip when the just-logged
                  set had bands selected. Without this, band truth
                  disappeared at exactly the moment the user wants to
                  confirm what they just did - the fuller Last Set
                  Snapshot card below covers the long-form view, but
                  this top summary is the at-a-glance artifact that
                  should not drop band truth. */}
              {lastSetRPE && (() => {
                const lastLogged = recentSets[recentSets.length - 1]
                const hasMultiBand =
                  lastLogged?.selectedBands && lastLogged.selectedBands.length > 0
                const hasSingleBand =
                  lastLogged?.bandUsed && lastLogged.bandUsed !== 'none'
                const bandLabel = hasMultiBand
                  ? lastLogged!.selectedBands!.map(b => BAND_SHORT_LABELS[b]).join('+')
                  : hasSingleBand
                    ? BAND_SHORT_LABELS[lastLogged!.bandUsed as ResistanceBandColor]
                    : null
                return (
                  <Card className="bg-[#0F1115]/50 border-[#2B313A]/50 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Last set RPE</span>
                      <div className="flex items-center gap-1.5">
                        {bandLabel && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-[#C1121F]/40 text-[#C1121F] bg-[#C1121F]/10"
                          >
                            {bandLabel}
                          </Badge>
                        )}
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
                    </div>
                  </Card>
                )
              })()}
              
              {/* [LIVE-WORKOUT-ACTION-PLANNER] Adaptive Coaching Panel */}
              {coachingExpression?.shouldShow && (
                <Card className={`bg-gradient-to-br p-3 ${
                  coachingExpression.severity === 'critical' 
                    ? 'from-red-900/30 to-red-900/10 border-red-500/40'
                    : coachingExpression.severity === 'warning'
                      ? 'from-orange-900/30 to-orange-900/10 border-orange-500/40'
                      : coachingExpression.severity === 'caution'
                        ? 'from-amber-900/20 to-amber-900/10 border-amber-500/30'
                        : 'from-blue-900/20 to-blue-900/10 border-blue-500/30'
                }`}>
                  <div className="space-y-2">
                    {/* Focus + Scope Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {coachingExpression.focusLabel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          coachingExpression.severity === 'critical'
                            ? 'bg-red-500/20 text-red-300'
                            : coachingExpression.severity === 'warning'
                              ? 'bg-orange-500/20 text-orange-300'
                              : coachingExpression.severity === 'caution'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {coachingExpression.focusLabel}
                        </span>
                      )}
                      {coachingExpression.scopeLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2B313A]/50 text-[#8A919C]">
                          {coachingExpression.scopeLabel}
                        </span>
                      )}
                      {coachingExpression.isProtective && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#2B313A]/50 text-[#8A919C]">
                          Protective
                        </span>
                      )}
                    </div>
                    
                    {/* Primary Text */}
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        coachingExpression.severity === 'critical' 
                          ? 'bg-red-500'
                          : coachingExpression.severity === 'warning'
                            ? 'bg-orange-500'
                            : coachingExpression.severity === 'caution'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          coachingExpression.severity === 'critical' 
                            ? 'text-red-300'
                            : coachingExpression.severity === 'warning'
                              ? 'text-orange-300'
                              : coachingExpression.severity === 'caution'
                                ? 'text-amber-300'
                                : 'text-blue-300'
                        }`}>
                          {coachingExpression.primaryText}
                        </p>
                        {/* Rationale Text */}
                        {coachingExpression.rationaleText && (
                          <p className="text-xs text-[#8A919C] mt-0.5">
                            {coachingExpression.rationaleText}
                          </p>
                        )}
                      </div>
                    </div>
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
                  
                  {/* [UI-CLEANUP-FIX] Timer Adjustment Controls: -30s / +30s */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A] hover:text-[#E6E9EF] px-4"
                      onClick={() => setRestTimeRemaining(prev => Math.max(0, prev - 30))}
                      disabled={restTimeRemaining <= 0}
                    >
                      -30s
                    </Button>
                    <span className="text-xs text-[#6B7280]">Adjust</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A] hover:text-[#E6E9EF] px-4"
                      onClick={() => setRestTimeRemaining(prev => prev + 30)}
                    >
                      +30s
                    </Button>
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
              
              {/* Last Set Snapshot - immediate coaching-oriented summary of the just-finished set */}
              {mode === 'resting' && recentSets.length > 0 && (() => {
                const latestSet = recentSets[recentSets.length - 1]
                const trimmedLatestNote = typeof latestSet.note === 'string' ? latestSet.note.trim() : ''
                const hasLatestNote = trimmedLatestNote.length > 0
                const actualLabel = latestSet.holdSeconds
                  ? `${latestSet.holdSeconds}s`
                  : `${latestSet.actualReps}${latestSet.isPerSide ? '/side' : ''} reps`
                const latestRPE = latestSet.actualRPE
                // Outcome classification vs target RPE. Lower RPE than target = easier than
                // intended (below target); higher = harder than intended (above target).
                let outcomeLabel: string | null = null
                let outcomeClasses = ''
                if (typeof latestRPE === 'number') {
                  if (latestRPE < targetRPE) {
                    outcomeLabel = 'Below target'
                    outcomeClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  } else if (latestRPE === targetRPE) {
                    outcomeLabel = 'On target'
                    outcomeClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  } else {
                    outcomeLabel = 'Above target'
                    outcomeClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }
                }
                return (
                  <Card className="bg-[#1A1F26]/50 border-[#2B313A]/50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#6B7280] uppercase tracking-wide">Last Set Snapshot</p>
                      {outcomeLabel && (
                        <Badge variant="outline" className={`text-[10px] ${outcomeClasses}`}>
                          {outcomeLabel}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Actual</span>
                        <span className="text-[#E6E9EF] font-medium tabular-nums">{actualLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Target</span>
                        <span className="text-[#A4ACB8] truncate ml-2" title={exerciseRepsOrTime}>{exerciseRepsOrTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">RPE</span>
                        <span className="text-[#E6E9EF] font-medium tabular-nums">
                          {typeof latestRPE === 'number' ? latestRPE : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">Target RPE</span>
                        <span className="text-[#A4ACB8] tabular-nums">{targetRPE}</span>
                      </div>
                    </div>
                    {(latestSet.actualLoadUsed !== undefined && latestSet.actualLoadUsed > 0) ||
                     (latestSet.selectedBands && latestSet.selectedBands.length > 0) ||
                     (latestSet.bandUsed && latestSet.bandUsed !== 'none') ? (
                      <div className="flex items-center flex-wrap gap-1.5 mt-2 pt-2 border-t border-[#2B313A]/50">
                        {latestSet.actualLoadUsed !== undefined && latestSet.actualLoadUsed > 0 && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                            +{latestSet.actualLoadUsed}{latestSet.actualLoadUnit || 'lbs'}
                          </Badge>
                        )}
                        {latestSet.selectedBands && latestSet.selectedBands.length > 0 ? (
                          <Badge variant="outline" className="text-[10px] border-[#C1121F]/40 text-[#C1121F] bg-[#C1121F]/10">
                            {latestSet.selectedBands.map(b => BAND_SHORT_LABELS[b]).join('+')}
                          </Badge>
                        ) : latestSet.bandUsed && latestSet.bandUsed !== 'none' ? (
                          <Badge variant="outline" className="text-[10px] border-[#C1121F]/40 text-[#C1121F] bg-[#C1121F]/10">
                            {BAND_SHORT_LABELS[latestSet.bandUsed]}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                    {/* [LIVE-WORKOUT-SIGNAL-CHIPS] Actual coaching signal labels for the latest set */}
                    {(() => {
                      const latestSignals = collectSetSignalLabels(latestSet)
                      if (latestSignals.length === 0) return null
                      return (
                        <div className="flex items-center flex-wrap gap-1 mt-2 pt-2 border-t border-[#2B313A]/50">
                          {latestSignals.map((label) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )
                    })()}
                    {hasLatestNote && (
                      <p
                        className="text-xs text-[#6B7280] truncate mt-2 pt-2 border-t border-[#2B313A]/50"
                        title={trimmedLatestNote}
                      >
                        {trimmedLatestNote}
                      </p>
                    )}
                  </Card>
                )
              })()}
              
              {/* Recent Sets Ledger (during rest) */}
              {recentSets.length > 0 && (
                <Card className="bg-[#1A1F26]/50 border-[#2B313A]/50 p-3">
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Completed Sets</p>
                  <div className="space-y-1.5">
                    {recentSets.map((set, idx) => {
                      const trimmedNote = typeof set.note === 'string' ? set.note.trim() : ''
                      const hasNote = trimmedNote.length > 0
                      const signalLabels = collectSetSignalLabels(set)
                      return (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center justify-between">
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
                              {hasNote && (
                                <MessageSquare
                                  className="w-3 h-3 text-[#6B7280]"
                                  aria-label="Has coaching note"
                                />
                              )}
                            </div>
                          </div>
                          {/* [LIVE-WORKOUT-SIGNAL-CHIPS] Actual coaching signal labels for this logged set */}
                          {signalLabels.length > 0 && (
                            <div className="flex items-center flex-wrap gap-1 mt-1">
                              {signalLabels.map((label) => (
                                <Badge
                                  key={label}
                                  variant="outline"
                                  className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10"
                                >
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {hasNote && (
                            <p className="text-xs text-[#6B7280] truncate mt-0.5" title={trimmedNote}>
                              {trimmedNote}
                            </p>
                          )}
                        </div>
                      )
                    })}
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
              
              {/* ============================================================
                  [LIVE-WORKOUT-CORRIDOR] REST SCREEN CONTROL PARITY
                  
                  The rest / exercise-complete green screen used to trap the
                  user into only "Skip Rest". That broke parity with the
                  active set screen, which owns Back | Skip | Next | End.
                  We now render the SAME bottom rail on rest screens, wired
                  to the SAME single-owner handlers the active screen uses
                  (onGoBack, onSkipSet, onEndExercise, exit modal). No
                  business logic is duplicated here - this is purely a UI
                  surface that reuses the authoritative handlers.
                  ============================================================ */}
              {/* [UI-BOTTOM-BAR-R5] Rest-screen action rail mirrors the
                  active-screen toolbar exactly (grid grid-cols-4,
                  deterministic equal-width slots, always-rendered Back
                  slot). Keeping both rails in lockstep preserves the
                  "rest/active parity" contract called out above. */}
              <div className="grid grid-cols-4 gap-0.5 pt-2">
                <Button
                  variant="ghost"
                  onClick={onGoBack}
                  disabled={!canGoBack || !onGoBack}
                  className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#6B7280] rounded-md"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    console.log('[LIVE-WORKOUT-CORRIDOR] Rest Skip Set clicked', {
                      restType,
                      exerciseName,
                      currentSetNumber,
                    })
                    if (onSkipSet) onSkipSet()
                    else if (onSkip) onSkip()
                  }}
                  className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26] rounded-md"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    console.log('[LIVE-WORKOUT-CORRIDOR] Rest End Exercise clicked', {
                      restType,
                      exerciseName,
                      currentSetNumber,
                      remainingSets: exerciseSets - currentSetNumber + 1,
                    })
                    if (onEndExercise) onEndExercise()
                    else setShowExitConfirm(true)
                  }}
                  className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/5 rounded-md"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Next
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowExitConfirm(true)}
                  className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26] rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                  End
                </Button>
              </div>
            </>
          )}
          
          {/* ========== BLOCK ROUND REST MODE UI (grouped methods) ========== */}
          {mode === 'block_round_rest' && (
            <>
              {/* [GROUP-SCANNER-R1] Scanner in block-round-rest branch.
                  Reports OWNER:GROUP_TRANSITION and PHASE:BETWEEN_ROUNDS
                  so it's immediately obvious when the corridor has
                  selected the transition surface instead of the regular
                  rest surface - the single most common grouped-method
                  confusion point. */}
              <GroupedMethodScannerStrip
                owner="GROUP_TRANSITION"
                exerciseName={exerciseName}
                blockLabel={blockLabel}
                blockGroupType={blockGroupType}
                groupedMemberIndex={groupedMemberIndex}
                blockMemberExercises={blockMemberExercises}
                currentRound={currentRound}
                targetRounds={targetRounds}
                mode="block_round_rest"
                restType={restType}
              />

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
                {/* [EDUCATIONAL] Method info bubble - explains what this training method is */}
                {blockGroupType && (
                  <MethodInfoBubble 
                    methodType={blockGroupType as 'superset' | 'circuit' | 'cluster' | 'emom'}
                  />
                )}
                  <span className="text-sm text-[#A4ACB8]">Round {currentRound} of {targetRounds}</span>
                </div>
                <div className="space-y-2">
                  {blockMemberExercises.map((ex, idx) => (
                    <div key={ex.id} className="flex items-center gap-3 py-1">
                      <span className="w-6 h-6 rounded-full bg-[#2B313A] text-[#A4ACB8] text-xs flex items-center justify-center font-medium">
                        {/* [GROUPED-IDENTITY-FIX] Use A, B, C for superset members to match session card display */}
                        {blockGroupType === 'superset' ? String.fromCharCode(65 + idx) : idx + 1}
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
              {/* [UI-DENSITY] Card and internal spacing trimmed to reduce
                  dead vertical space above the primary input controls.
                  [UI-DENSITY-R3] Third pass: vertical padding py-2 -> py-1.5
                  since the category badge + exercise name + target line +
                  progress dots already total ~88px; an extra 4px of chrome
                  per card compounds to make the bottom rail fall below
                  the fold on 640px-tall Android viewports. */}
              {/* [UI-DENSITY-R4] Exercise card consolidation.
                  - Category badge + optional grouped-member badge moved
                    inline with the h2 row (they occupied a full dedicated
                    row with mb-1 before, ~22px).
                  - mt-1.5 above the progress dots -> mt-1.
                  - Progress dot height h-1.5 -> h-1.
                  Net reclaim ~24-28px for this card alone. */}
              <Card className="bg-[#1A1F26] border-[#2B313A] px-3 py-1.5">
                {/* Exercise name + inline badges */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-[#E6E9EF] leading-tight min-w-0 flex-1 truncate">
                    {exerciseName}
                  </h2>
                  <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                    <Badge variant="outline" className="text-[#C1121F] border-[#C1121F]/30 text-[10px] uppercase px-1.5 py-0">
                      {exerciseCategory}
                    </Badge>
                    {/* [GROUPED-IDENTITY-FIX] Show grouped member identity when in grouped block */}
                    {groupedMemberIndex !== null && blockGroupType && (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] uppercase px-1.5 py-0">
                        {blockGroupType === 'superset' ? 'Superset' : blockGroupType === 'circuit' ? 'Circuit' : blockGroupType}{' '}
                        {String.fromCharCode(65 + groupedMemberIndex)}
                      </Badge>
                    )}
                  </div>
                </div>

            {/* Target prescription */}
            {/* [BAND-TRUTH-R6] When the authoritative contract marks this
                exercise as bandSelectable and a recommendedBand is present,
                surface it inline as a compact prescription chip here so
                the user sees the prescribed band BEFORE they scroll to
                the band selector. Matches the existing load-prescription
                pattern; does NOT imply the band was used, because the
                `Rec:` prefix keeps it clearly labeled as recommendation,
                distinct from the used-band badges rendered in the
                Last Set Snapshot / Recent Sets surfaces. */}
            <div className="flex items-center gap-2 mt-1 text-sm flex-wrap">
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
              {bandSelectable && recommendedBand && (
                <>
                  <span className="text-[#6B7280]">·</span>
                  <span className="text-[#C1121F] font-medium">Rec: {BAND_SHORT_LABELS[recommendedBand]}</span>
                </>
              )}
            </div>

            {/* Set progress dots */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 flex-1">
                {Array.from({ length: exerciseSets }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 flex-1 rounded-full transition-colors ${
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

          {/* [GROUP-SCANNER-R1] Grouped-method scanner (debug-gated).
              Placed directly under the Exercise card and above the
              Input card per the diagnostic-visibility contract. Renders
              nothing when SHOW_GROUP_SCANNER is false. */}
          <GroupedMethodScannerStrip
            owner="ACTIVE_SURFACE"
            exerciseName={exerciseName}
            blockLabel={blockLabel}
            blockGroupType={blockGroupType}
            groupedMemberIndex={groupedMemberIndex}
            blockMemberExercises={blockMemberExercises}
            currentRound={currentRound}
            targetRounds={targetRounds}
            mode="active"
          />

          {/* [LIVE-WORKOUT-ACTION-PLANNER] Compact Inline Coaching Hint (active mode) */}
          {coachingExpression?.shouldShow && coachingExpression.isProtective && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              coachingExpression.severity === 'critical'
                ? 'bg-red-900/20 border border-red-500/30'
                : coachingExpression.severity === 'warning'
                  ? 'bg-orange-900/20 border border-orange-500/30'
                  : coachingExpression.severity === 'caution'
                    ? 'bg-amber-900/15 border border-amber-500/20'
                    : 'bg-blue-900/15 border border-blue-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                coachingExpression.severity === 'critical'
                  ? 'bg-red-500'
                  : coachingExpression.severity === 'warning'
                    ? 'bg-orange-500'
                    : coachingExpression.severity === 'caution'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
              }`} />
              <span className={`text-xs ${
                coachingExpression.severity === 'critical'
                  ? 'text-red-300'
                  : coachingExpression.severity === 'warning'
                    ? 'text-orange-300'
                    : coachingExpression.severity === 'caution'
                      ? 'text-amber-300'
                      : 'text-blue-300'
              }`}>
                {coachingExpression.primaryText}
              </span>
              {coachingExpression.focusLabel && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${
                  coachingExpression.severity === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : coachingExpression.severity === 'warning'
                      ? 'bg-orange-500/20 text-orange-400'
                      : coachingExpression.severity === 'caution'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {coachingExpression.focusLabel}
                </span>
              )}
            </div>
          )}
          
          {/* ========== INPUT CARD ========== */}
          {/* [LIVE-WORKOUT-AUTHORITY] Authoritative execution-fact inputs driven by inputMode */}
          {/* [UI-DENSITY-R4] py-2 -> py-1.5 and space-y-2 -> space-y-1.5.
              The standalone "Input mode" label row (Band-Assisted / Weighted /
              Bodyweight / Timed Hold / Unilateral / Density Block) has been
              removed from this card: the category badge next to the h2 in
              the Exercise card above already tells the user what kind of
              exercise they are performing, and the Reps/Hold readout +
              optional Per-Side label below carry the same meaning. The
              Per-Side indicator is preserved inline on the reps input
              below so unilateral exercises still read correctly. */}
          <Card className="bg-[#1A1F26] border-[#2B313A] px-3 py-1.5 space-y-1.5">
            
            {/* [LIVE-WORKOUT-AUTHORITY] Actual Load Input - for weighted exercises
                [WEIGHTED-INCREMENT-LOCK] Fine-grained loading steps that match real plates:
                  - lbs: 2.5 lb step (smallest microplate pair, standard US gym)
                  - kg:  1.0 kg step (smallest standard plate pair)
                The same step drives storage (onSetActualLoad), the numeric display,
                and the disabled gate so storage/display/live-tap logic all agree. */}
            {showLoadInput && prescribedLoad && (() => {
              const unit = (actualLoadUnit || prescribedLoad.unit || 'lbs').toLowerCase()
              const loadStep = unit === 'kg' ? 1 : 2.5
              const formatNum = (n: number) =>
                Number.isInteger(n) ? String(n) : n.toFixed(loadStep === 2.5 ? 1 : 1).replace(/\.0$/, '')
              const stepLabel = formatNum(loadStep)
              const currentLoad = actualLoadUsed ?? prescribedLoad.load
              // [LOAD-PRESS-AND-HOLD] Sync refs every render so the auto-repeat
              // ticks scheduled by startLoadRepeat see the latest parent-owned
              // value/step/unit instead of a stale capture from the initial tap.
              // This is the same valueRef pattern RepsHoldInput uses above.
              loadValueRef.current = currentLoad
              loadStepRef.current = loadStep
              loadUnitRef.current = actualLoadUnit
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#A4ACB8]">Load Used</span>
                    <span className="text-xs text-[#6B7280]">
                      Prescribed: +{formatNum(prescribedLoad.load)}{prescribedLoad.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A] h-10 px-3 select-none touch-none"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        startLoadRepeat(-1)
                      }}
                      onPointerUp={stopLoadRepeat}
                      onPointerLeave={stopLoadRepeat}
                      onPointerCancel={stopLoadRepeat}
                      onContextMenu={(e) => e.preventDefault()}
                      disabled={currentLoad <= 0}
                      aria-label={`Decrease load by ${stepLabel} ${unit}`}
                    >
                      -{stepLabel}
                    </Button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold text-amber-400 tabular-nums">
                        +{formatNum(currentLoad)}
                      </span>
                      <span className="text-sm text-[#A4ACB8] ml-1">{actualLoadUnit || prescribedLoad.unit}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2B313A] text-[#A4ACB8] hover:bg-[#2B313A] h-10 px-3 select-none touch-none"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        startLoadRepeat(1)
                      }}
                      onPointerUp={stopLoadRepeat}
                      onPointerLeave={stopLoadRepeat}
                      onPointerCancel={stopLoadRepeat}
                      onContextMenu={(e) => e.preventDefault()}
                      aria-label={`Increase load by ${stepLabel} ${unit}`}
                    >
                      +{stepLabel}
                    </Button>
                  </div>
                </div>
              )
            })()}
            
            {/* Reps/Hold Input - with per-side label when applicable */}
            {isHold ? (
              <RepsHoldInput type="hold" value={holdValue} onChange={onSetHold} targetValue={targetValue} />
            ) : (
              <div className="space-y-2">
                {showPerSideToggle && (
                  <div className="text-center text-xs text-amber-400 font-medium">
                    Reps per Side
                  </div>
                )}
                <RepsHoldInput 
                  type="reps" 
                  value={repsValue} 
                  onChange={onSetReps} 
                  targetValue={targetValue}
                />
              </div>
            )}
            
            {/* RPE Selector */}
            <RPEQuickSelector value={selectedRPE} onChange={onSetRPE} targetRPE={targetRPE} />
            
            {/* [LIVE-WORKOUT-AUTHORITY] Band Selector - only for band-assisted exercises */}
            {bandSelectable && (
              showMultiBandSelector && onSetSelectedBands ? (
                // True multi-band selector for band-assisted exercises
                <MultiBandSelector 
                  selectedBands={selectedBands} 
                  onChange={onSetSelectedBands} 
                  recommendedBand={recommendedBand} 
                />
              ) : (
                // Legacy single-band selector fallback
                <BandSelector value={bandUsed} onChange={onSetBand} recommendedBand={recommendedBand} />
              )
            )}
            
            {/* [LIVE-WORKOUT-AUTHORITY] Adaptive Input Section - coaching signals that drive adaptation */}
            {/* [UI-DENSITY] pt-3 -> pt-2 so the collapsed Coaching Feedback
                row hugs the band selector above rather than adding another
                bar-and-a-half of empty space. Expanded panel keeps mt-3. */}
            {onSetNote && onToggleReasonTag && (
              <div className="border-t border-[#2B313A] pt-2">
                <button
                  onClick={() => setShowSetNotes(!showSetNotes)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
                    <MessageSquare className="w-4 h-4" />
                    <span>Coaching Feedback</span>
                    {(currentSetNote || currentSetReasonTags.length > 0) && (
                      <span className="text-xs text-amber-400/80">
                        {currentSetReasonTags.length > 0 
                          ? `${currentSetReasonTags.length} signal${currentSetReasonTags.length > 1 ? 's' : ''}`
                          : 'note added'}
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
                    {/* [LIVE-WORKOUT-NORMALIZERS] Structured coaching signals - drive adaptive control */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-[#6B7280]">
                        Quick tags (feeds adaptive coaching)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PRIMARY_SIGNAL_TAGS.map((tag) => {
                          const isSelected = currentSetReasonTags.includes(tag)
                          const label = SET_REASON_TAG_LABELS[tag]
                          return (
                            <button
                              key={tag}
                              onClick={() => onToggleReasonTag(tag)}
                              className={`px-2 py-1 rounded-md text-xs transition-colors ${
                                isSelected
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-[#2B313A] text-[#A4ACB8] border border-transparent hover:border-[#3B4250]'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Free text note */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-[#6B7280]">
                        Notes
                      </div>
                      <Textarea
                        placeholder="Any details for your coach AI..."
                        value={currentSetNote}
                        onChange={(e) => onSetNote(e.target.value)}
                        className="bg-[#2B313A] border-[#3B4250] text-[#E6E9EF] placeholder:text-[#6B7280] text-sm resize-none h-16"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* ========== RECENT SETS LEDGER ========== */}
          {/* [UI-DENSITY-R4] Collapsed by default. The header row shows
              "Recent Sets (N)" plus a compact one-line summary of the
              most recent set (e.g. "Set 1 · 8 · RPE 8") so the user
              retains at-a-glance confirmation without the full ledger
              card consuming ~100px during the core logging moment.
              Tapping the header reveals the full scroll ledger. This
              preserves functionality while reclaiming the single
              largest remaining source of below-the-fold pressure. */}
          {recentSets.length > 0 && (() => {
            const latest = recentSets[recentSets.length - 1]
            const latestValue =
              latest.actualReps > 0
                ? `${latest.actualReps}${latest.isPerSide ? '/side' : ''}`
                : latest.holdSeconds
                  ? `${latest.holdSeconds}s`
                  : '—'
            return (
              <Card className="bg-[#1A1F26] border-[#2B313A] px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setShowRecentSets(!showRecentSets)}
                  className="flex items-center justify-between w-full text-left"
                  aria-expanded={showRecentSets}
                  aria-label={showRecentSets ? 'Hide recent sets' : 'Show recent sets'}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-medium text-[#A4ACB8] flex-shrink-0">
                      Recent Sets ({recentSets.length})
                    </span>
                    {!showRecentSets && (
                      <span className="text-xs text-[#6B7280] truncate">
                        Last: Set {latest.setNumber} · {latestValue} · RPE {latest.actualRPE}
                      </span>
                    )}
                  </div>
                  {showRecentSets ? (
                    <ChevronUp className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
                  )}
                </button>
                {showRecentSets && (
                  <div className="space-y-1 text-xs max-h-32 overflow-y-auto mt-2">
                    {recentSets.map((set, idx) => {
                  const trimmedNote = typeof set.note === 'string' ? set.note.trim() : ''
                  const hasNote = trimmedNote.length > 0
                  const signalLabels = collectSetSignalLabels(set)
                  return (
                    <div key={idx} className="px-2 py-1.5 bg-[#2B313A]/50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[#6B7280] w-12 flex-shrink-0">Set {set.setNumber}</span>
                          <span className="text-[#E6E9EF] font-medium">
                            {set.actualReps > 0 
                              ? `${set.actualReps}${set.isPerSide ? '/side' : ''}` 
                              : set.holdSeconds 
                                ? `${set.holdSeconds}s` 
                                : '—'}
                          </span>
                          {/* Load used - for weighted exercises */}
                          {set.actualLoadUsed !== undefined && set.actualLoadUsed > 0 && (
                            <span className="text-amber-400 text-[10px]">+{set.actualLoadUsed}{set.actualLoadUnit || 'lbs'}</span>
                          )}
                          {/* [BAND-TRUTH-R6] Band truth for each logged set.
                              Upgraded from bare red text to a styled Badge
                              matching the Last Set Snapshot and the rest
                              "Last set RPE" surfaces, so band readouts
                              render identically across all three consumer
                              surfaces. Multi-band renders combined
                              (e.g. YLW+RED); single-band renders as a
                              single chip; no band selected renders nothing. */}
                          {set.selectedBands && set.selectedBands.length > 0 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-[#C1121F]/40 text-[#C1121F] bg-[#C1121F]/10 px-1.5 py-0 h-4 leading-none truncate max-w-[80px]"
                            >
                              {set.selectedBands.map(b => BAND_SHORT_LABELS[b]).join('+')}
                            </Badge>
                          ) : set.bandUsed && set.bandUsed !== 'none' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-[#C1121F]/40 text-[#C1121F] bg-[#C1121F]/10 px-1.5 py-0 h-4 leading-none"
                            >
                              {BAND_SHORT_LABELS[set.bandUsed]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[#A4ACB8]">RPE {set.actualRPE}</span>
                          {/* Free-text note indicator */}
                          {hasNote && (
                            <MessageSquare
                              className="w-3 h-3 text-[#6B7280]"
                              aria-label="Has coaching note"
                            />
                          )}
                        </div>
                      </div>
                      {/* [LIVE-WORKOUT-SIGNAL-CHIPS] Actual coaching signal labels replace the previous +N count */}
                      {signalLabels.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 mt-1 pl-14">
                          {signalLabels.map((label) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10 px-1.5 py-0 h-4 leading-none"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* One-line muted note preview */}
                      {hasNote && (
                        <p className="text-[10px] text-[#6B7280] truncate mt-0.5 pl-14" title={trimmedNote}>
                          {trimmedNote}
                        </p>
                      )}
                    </div>
                  )
                })}
                  </div>
                )}
              </Card>
            )
          })()}
          
          {/* ========== ACTION RAIL ========== */}
          {/* [MOBILE-FIX] Sticky action rail that stays accessible on mobile */}
          {/* [OVERFLOW-FIX] Removed -mx-4 negative margin that caused horizontal overflow */}
          {/* 
            [LIVE-SESSION-CONTROL-CONTRACT] 
            This action rail MUST contain these 5 controls in ALL states:
            1. Log Set (primary) - Logs current set with RPE
            2. Back - Returns to previous set/exercise (conditional on canGoBack)
            3. Skip - Skips current set
            4. Next - Advances to next exercise  
            5. End - Opens exit confirmation modal
            
            DO NOT remove any control without explicit product decision.
            DO NOT hide controls via overflow - use responsive sizing instead.
            See: handleGoBack, handleSkipSet, handleEndExercise, handleDiscardAndExit
          */}
          {/* [UI-DENSITY] pt-3 -> pt-2 above the sticky Log Set button so
              the entire bottom control rail pulls up closer to the content
              and the four secondary controls (Back / Skip / Next / End)
              remain visible without a hidden scroll pocket.
              [UI-DENSITY-R3] Further reduced pt-2 -> pt-1.5 and pb-2 ->
              pb-1.5 so the bottom rail hugs the ledger more tightly. */}
          <div className="sticky bottom-0 bg-[#0F1115] pt-1.5 pb-1.5 pb-safe border-t border-[#2B313A]/50">
            {/* Primary Action: Log Set
                [LIVE-LOG-COMMIT-SURVIVAL] Disabled only by hard-invalid input
                (no RPE selected). No local in-flight gate. Brief green flash
                on `justLoggedPulse` is derived from authoritative parent
                commit revision - pure visual feedback, not a commit owner. */}
            <Button 
              onClick={handleLogSet} 
              disabled={selectedRPE === null}
              className={`w-full h-12 disabled:bg-[#C1121F]/50 disabled:cursor-not-allowed text-white text-base font-bold transition-colors ${
                justLoggedPulse
                  ? 'bg-green-600 hover:bg-green-600'
                  : 'bg-[#C1121F] hover:bg-[#A30F1A]'
              }`}
            >
              <Check className="w-5 h-5 mr-2" />
              {/* [UI-DENSITY-R4] Production-clean CTA label. The "• R3"
                  diagnostic suffix has been removed now that the live
                  corridor ownership is proven. Revert only if ownership
                  becomes ambiguous again. */}
              {justLoggedPulse ? 'Logged' : 'Log Set'}
            </Button>
            
            {/* Secondary Actions: Back | Skip | Next | End
                [UI-BOTTOM-BAR-R5] Converted from a loose
                `flex justify-between flex-wrap + w-12 spacer` row into a
                deterministic `grid grid-cols-4` toolbar so the four
                utility controls occupy stable equal-width slots under
                the primary CTA. Benefits:
                  - Back no longer needs a phantom `<div className="w-12" />`
                    spacer when unavailable; its slot is always present
                    and simply renders a disabled button instead.
                  - Every cell has identical width so Skip, Next, and End
                    stop shifting horizontally as the available-width
                    changes (e.g. when the Back control conditionally
                    renders).
                  - The row now reads as a single intentional toolbar,
                    visually anchored by the shared sticky wrapper, and
                    stays clearly subordinate to the primary red CTA
                    above it.
                Height kept minimal: h-9 buttons inside a pt-1.5 wrapper
                yields ~42px total, only 4px taller than the previous
                h-8 row, in exchange for a comfortable ~80x36 tap area
                per cell. */}
            <div className="grid grid-cols-4 gap-0.5 pt-1.5">
              {/* Slot 1: Back (always rendered, disabled when unavailable) */}
              <Button
                variant="ghost"
                onClick={onGoBack}
                disabled={!canGoBack || !onGoBack}
                className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#6B7280] rounded-md"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>

              {/* Slot 2: Skip Set - skip only current set, continue same exercise */}
              <Button
                variant="ghost"
                onClick={() => {
                  console.log('[LIVE-WORKOUT-AUTHORITY] Skip Set clicked', {
                    exerciseName,
                    currentSetNumber,
                    exerciseSets,
                  })
                  if (onSkipSet) onSkipSet()
                  else if (onSkip) onSkip()
                }}
                className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26] rounded-md"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip
              </Button>

              {/* Slot 3: End Exercise - skip remaining sets, advance to next exercise.
                  Keeps the amber accent because Next is semantically the
                  forward-advance action and needs to be differentiable
                  from a passive Skip. */}
              <Button
                variant="ghost"
                onClick={() => {
                  console.log('[LIVE-WORKOUT-AUTHORITY] End Exercise clicked', {
                    exerciseName,
                    currentSetNumber,
                    exerciseSets,
                    remainingSets: exerciseSets - currentSetNumber + 1,
                  })
                  if (onEndExercise) onEndExercise()
                  else setShowExitConfirm(true)
                }}
                className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/5 rounded-md"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Next
              </Button>

              {/* Slot 4: End Workout - opens exit confirm modal */}
              <Button
                variant="ghost"
                onClick={() => setShowExitConfirm(true)}
                className="h-9 w-full px-1 text-xs font-medium flex items-center justify-center gap-1 text-[#6B7280] hover:text-[#A4ACB8] hover:bg-[#1A1F26] rounded-md"
              >
                <X className="w-3.5 h-3.5" />
                End
              </Button>
            </div>
          </div>
            </>
          )}
          {/* ========== END MODE CONDITIONAL ========== */}
        </div>
      </div>
      
      {/* ========== EXIT CONFIRMATION MODAL ========== */}
      {/* [UI-CLEANUP-FIX] Clean single-owner modal with inline explanations, no duplicate surfaces */}
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
            
            <p className="text-sm text-[#A4ACB8] mb-4">
              Choose how you want to exit this workout session.
            </p>
            
            {/* Progress summary panel - lets the user see exactly what is at stake */}
            <div className="mb-4 rounded-md border border-[#2B313A] bg-[#0F1317] p-3">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
                Current progress
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#A4ACB8]">Session</span>
                  <span className="text-[#E6E9EF] font-medium truncate max-w-[55%] text-right" title={sessionLabel}>
                    {sessionLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#A4ACB8]">Exercise</span>
                  <span className="text-[#E6E9EF] font-medium truncate max-w-[55%] text-right" title={exerciseName}>
                    {exerciseName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#A4ACB8]">Position</span>
                  <span className="text-[#E6E9EF] tabular-nums">
                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                    <span className="text-[#6B7280]"> · </span>
                    Set {currentSetNumber} of {exerciseSets}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#A4ACB8]">Logged</span>
                  <span className="text-[#E6E9EF] tabular-nums">
                    {completedSetsCount} / {totalSetsCount} sets
                  </span>
                </div>
              </div>
            </div>
            
            {/* Outcome clarity rows - subtle, not a long explanation block */}
            <div className="mb-4 space-y-1.5 text-xs text-[#6B7280]">
              <p>
                <span className="text-[#E6E9EF] font-medium">Save &amp; Exit</span>
                {' · Keeps this workout resumable from your current progress'}
              </p>
              <p>
                <span className="text-[#E6E9EF] font-medium">Discard Workout</span>
                {' · Clears this workout session and removes resumable progress'}
              </p>
            </div>
            
            {/* Single clean button stack with inline explanations */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-auto py-3 border-[#2B313A] text-[#E6E9EF] hover:bg-[#2B313A] flex flex-col items-center"
                onClick={() => setShowExitConfirm(false)}
              >
                <span className="font-medium">Continue Workout</span>
              </Button>
              
              <Button
                className="w-full h-auto py-3 bg-[#C1121F] hover:bg-[#A10F1A] text-white flex flex-col items-center"
                onClick={() => {
                  setShowExitConfirm(false)
                  if (onSaveAndExit) {
                    onSaveAndExit()
                  } else {
                    onExit()
                  }
                }}
              >
                <span className="font-medium">Save & Exit</span>
                <span className="text-xs opacity-80 mt-0.5">Resume anytime</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-auto py-3 text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 flex flex-col items-center"
                onClick={() => {
                  setShowExitConfirm(false)
                  if (onDiscardWorkout) {
                    onDiscardWorkout()
                  } else {
                    onExit()
                  }
                }}
              >
                <span className="font-medium">Discard Workout</span>
                <span className="text-xs opacity-80 mt-0.5">Progress will be lost</span>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ActiveWorkoutStartCorridor
