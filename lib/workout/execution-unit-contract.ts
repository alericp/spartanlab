/**
 * Execution Unit Contract
 * 
 * =============================================================================
 * PHASE NEXT - CANONICAL EXECUTION UNIT MODEL
 * =============================================================================
 * 
 * This module provides the SINGLE authoritative model for what the athlete
 * is doing RIGHT NOW in a workout session. All UI rendering, progression,
 * and state management must derive from this contract.
 * 
 * SUPPORTED UNIT TYPES:
 * - single_set: Standard straight-set exercise execution
 * - grouped_member: Member of a superset/circuit/cluster
 * - between_set_rest: Rest between sets of same exercise
 * - between_member_rest: Rest between members of grouped block
 * - between_round_rest: Rest between rounds of grouped block
 * - between_exercise_rest: Rest between exercises
 * - block_complete_transition: Transition after completing a block
 * - session_complete: Workout finished
 */

import type { ResistanceBandColor } from '@/lib/band-progression-engine'
import type { RPEValue } from '@/lib/rpe-adjustment-engine'

// =============================================================================
// REASON TAGS - For per-set notes/context
// =============================================================================

export type SetReasonTag = 
  | 'injury'
  | 'pain'
  | 'tired'
  | 'stressed'
  | 'bad_day'
  | 'rushed'
  | 'technique_issue'
  | 'easier_than_expected'
  | 'harder_than_expected'
  | 'equipment_issue'
  | 'warmup_needed'

export const SET_REASON_TAG_LABELS: Record<SetReasonTag, string> = {
  injury: 'Injury',
  pain: 'Pain',
  tired: 'Tired',
  stressed: 'Stressed',
  bad_day: 'Bad Day',
  rushed: 'Rushed',
  technique_issue: 'Technique',
  easier_than_expected: 'Too Easy',
  harder_than_expected: 'Too Hard',
  equipment_issue: 'Equipment',
  warmup_needed: 'Need Warmup',
}

// =============================================================================
// GROUP TYPES
// =============================================================================

export type GroupType = 'superset' | 'circuit' | 'cluster' | null

export const GROUP_TYPE_LABELS: Record<NonNullable<GroupType>, string> = {
  superset: 'Superset',
  circuit: 'Circuit',
  cluster: 'Cluster',
}

// =============================================================================
// EXECUTION UNIT TYPES
// =============================================================================

export type ExecutionUnitType =
  | 'single_set'
  | 'grouped_member'
  | 'between_set_rest'
  | 'between_member_rest'
  | 'between_round_rest'
  | 'between_exercise_rest'
  | 'block_complete_transition'
  | 'session_complete'
  | 'session_ready'
  | 'session_invalid'

// =============================================================================
// COMPLETED SET WITH NOTES
// =============================================================================

export interface CompletedSetWithNotes {
  exerciseIndex: number
  setNumber: number
  actualReps: number
  holdSeconds?: number
  actualRPE: RPEValue
  bandUsed: ResistanceBandColor | 'none'
  timestamp: number
  // Per-set notes and tags
  note?: string
  reasonTags?: SetReasonTag[]
  // Grouped context
  blockId?: string
  memberIndex?: number
  round?: number
}

// =============================================================================
// EXECUTION BLOCK - Groups of exercises done together
// =============================================================================

export interface ExecutionBlock {
  blockId: string
  groupType: GroupType
  blockLabel: string // e.g., "Superset A", "Circuit 1"
  memberExerciseIndexes: number[]
  memberExerciseNames: string[]
  targetRounds: number
  intraBlockRestSeconds: number // Rest between members in same round
  postRoundRestSeconds: number // Rest after completing a round
  postBlockRestSeconds: number // Rest after completing entire block
}

// =============================================================================
// EXECUTION PLAN - Derived from session exercises
// =============================================================================

export interface ExecutionPlan {
  blocks: ExecutionBlock[]
  hasGroupedBlocks: boolean
  totalSets: number
  totalRounds: number
}

// =============================================================================
// EXECUTION UNIT - The canonical "what is happening now" model
// =============================================================================

export interface ExecutionUnitBase {
  unitType: ExecutionUnitType
  sessionId: string
  timestamp: number
}

export interface SingleSetUnit extends ExecutionUnitBase {
  unitType: 'single_set'
  exerciseIndex: number
  exerciseName: string
  exerciseCategory: string
  currentSet: number
  targetSets: number
  repsTarget: number | null // null if hold-based
  holdTarget: number | null // null if rep-based
  isHoldBased: boolean
  completedSetsForExercise: CompletedSetWithNotes[]
  // Current inputs
  selectedRPE: RPEValue | null
  currentRepsValue: number
  currentHoldValue: number
  currentBandUsed: ResistanceBandColor | 'none'
  currentNote: string
  currentReasonTags: SetReasonTag[]
  // Recommendations
  recommendedBand: ResistanceBandColor | null
  recommendedRestSeconds: number
  // Navigation
  nextUnitLabel: string
  canEditPrevious: boolean
  canAddNote: boolean
  canSelectBand: boolean
}

export interface GroupedMemberUnit extends ExecutionUnitBase {
  unitType: 'grouped_member'
  // Exercise info
  exerciseIndex: number
  exerciseName: string
  exerciseCategory: string
  // Grouped context
  groupType: NonNullable<GroupType>
  blockId: string
  blockLabel: string
  memberIndex: number
  memberCount: number
  currentRound: number
  targetRounds: number
  // Targets
  repsTarget: number | null
  holdTarget: number | null
  isHoldBased: boolean
  // Block members (for display)
  memberNames: string[]
  memberLabels: string[] // ["A1", "A2"] for superset, ["1", "2", "3"] for circuit
  currentMemberLabel: string
  // Completed work
  completedSetsInBlock: CompletedSetWithNotes[]
  completedSetsForCurrentMember: CompletedSetWithNotes[]
  // Current inputs
  selectedRPE: RPEValue | null
  currentRepsValue: number
  currentHoldValue: number
  currentBandUsed: ResistanceBandColor | 'none'
  currentNote: string
  currentReasonTags: SetReasonTag[]
  // Recommendations
  recommendedBand: ResistanceBandColor | null
  recommendedRestSeconds: number
  // Navigation
  nextMemberName: string | null
  nextUnitLabel: string
  isLastMemberInRound: boolean
  isLastRound: boolean
  canEditPrevious: boolean
  canAddNote: boolean
  canSelectBand: boolean
}

export interface RestUnit extends ExecutionUnitBase {
  unitType: 'between_set_rest' | 'between_member_rest' | 'between_round_rest' | 'between_exercise_rest'
  restSeconds: number
  restSecondsRemaining: number
  restReason: string
  // Context
  completedExerciseName: string
  completedSetNumber?: number
  completedRound?: number
  // Next
  nextExerciseName: string
  nextExerciseCategory: string
  nextSetNumber?: number
  nextRound?: number
  // For grouped rest
  groupType?: GroupType
  blockLabel?: string
  memberNames?: string[]
}

export interface TransitionUnit extends ExecutionUnitBase {
  unitType: 'block_complete_transition'
  completedBlockLabel: string
  completedBlockType: GroupType
  nextBlockLabel: string | null
  nextBlockType: GroupType
}

export interface CompleteUnit extends ExecutionUnitBase {
  unitType: 'session_complete'
  completedSets: CompletedSetWithNotes[]
  totalExercises: number
  totalSetsCompleted: number
  elapsedSeconds: number
  workoutNotes: string
  averageRPE: number | null
}

export interface ReadyUnit extends ExecutionUnitBase {
  unitType: 'session_ready'
  dayLabel: string
  dayNumber: number
  exerciseCount: number
  totalSets: number
  estimatedMinutes: number
  hasSavedProgress: boolean
  savedProgressSets: number
  hasGroupedBlocks: boolean
  blockCount: number
}

export interface InvalidUnit extends ExecutionUnitBase {
  unitType: 'session_invalid'
  reason: string
  stage: string
}

export type ExecutionUnit =
  | SingleSetUnit
  | GroupedMemberUnit
  | RestUnit
  | TransitionUnit
  | CompleteUnit
  | ReadyUnit
  | InvalidUnit

// =============================================================================
// HELPER: Derive execution plan from exercises
// =============================================================================

export interface ExerciseWithMeta {
  id: string
  name: string
  category: string
  sets: number
  repsOrTime: string
  note?: string
  method?: string
  methodLabel?: string
  blockId?: string
  restSeconds?: number
}

/**
 * Derives the execution plan from a flat list of exercises.
 * Groups exercises by blockId into execution blocks.
 */
export function deriveExecutionPlan(exercises: ExerciseWithMeta[]): ExecutionPlan {
  if (!exercises || exercises.length === 0) {
    return { blocks: [], hasGroupedBlocks: false, totalSets: 0, totalRounds: 0 }
  }
  
  const blocks: ExecutionBlock[] = []
  let currentBlockId: string | null = null
  let currentBlockExercises: ExerciseWithMeta[] = []
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
    let groupType: GroupType = null
    let blockLabel = firstEx.name
    
    // Only classify as grouped if there are actually multiple members in the block
    if (memberCount >= 2) {
      if (method.includes('superset') || (memberCount === 2 && currentBlockId)) {
        groupType = 'superset'
        blockCounter++
        // [GROUPED-IDENTITY-FIX] Match session card display convention - just "Superset"
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
      memberExerciseIndexes: [...currentBlockIndexes],
      memberExerciseNames: currentBlockExercises.map(e => e.name),
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
  const totalRounds = blocks.reduce((sum, b) => {
    if (b.groupType) {
      return sum + b.targetRounds
    }
    // For non-grouped, each exercise's sets count as rounds
    return sum + b.memberExerciseIndexes.reduce((s, idx) => s + (exercises[idx]?.sets || 3), 0)
  }, 0)
  
  return { blocks, hasGroupedBlocks, totalSets, totalRounds }
}

// =============================================================================
// HELPER: Get block for exercise index
// =============================================================================

export function getBlockForExerciseIndex(
  plan: ExecutionPlan,
  exerciseIndex: number
): { block: ExecutionBlock; memberIndex: number } | null {
  for (const block of plan.blocks) {
    const memberIndex = block.memberExerciseIndexes.indexOf(exerciseIndex)
    if (memberIndex !== -1) {
      return { block, memberIndex }
    }
  }
  return null
}

// =============================================================================
// HELPER: Generate member labels
// =============================================================================

export function generateMemberLabels(groupType: GroupType, count: number): string[] {
  if (!groupType) return []
  
  // [GROUPED-IDENTITY-FIX] Use A, B, C for superset members to match session card display
  if (groupType === 'superset') {
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)) // A, B, C...
  }
  return Array.from({ length: count }, (_, i) => `${i + 1}`)
}

// =============================================================================
// HELPER: Parse target from repsOrTime
// =============================================================================

export function parseTarget(repsOrTime: string): { reps: number | null; hold: number | null; isHold: boolean } {
  const lower = repsOrTime.toLowerCase()
  const isHold = lower.includes('sec') || lower.includes('hold')
  const match = repsOrTime.match(/(\d+)/)
  const value = match ? parseInt(match[1], 10) : 8
  
  return {
    reps: isHold ? null : value,
    hold: isHold ? value : null,
    isHold,
  }
}
