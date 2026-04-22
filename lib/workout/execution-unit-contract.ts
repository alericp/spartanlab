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
// METHOD TAXONOMY (AUTHORITATIVE)
// =============================================================================
// [METHOD-TAXONOMY-LOCK] Training methods divide into THREE distinct categories.
// Mixing them produced every "cluster leaked as grouped structure" symptom the
// audit documented. Treat these three types as non-overlapping.
//
//   1. GROUPED STRUCTURE METHOD   — changes SESSION structure across multiple
//      exercises. Requires >=2 members sharing a blockId. Examples: superset,
//      circuit, density block. Renders as a framed grouped block in the UI.
//
//   2. SET-EXECUTION METHOD       — changes how a SINGLE exercise's sets are
//      executed. Orthogonal to grouping. Examples: cluster, rest-pause, top
//      set, drop set. Renders as a per-exercise execution cue on a flat row,
//      never as a grouped block.
//
//   3. CONTEXTUAL TRAINING CUE    — informational only. Never creates
//      structure. Examples: strength emphasis, skill priority, primer,
//      overload. Renders as non-structural annotation.
//
// Cluster specifically belongs in category 2 (SET-EXECUTION METHOD). The
// legacy `GroupType` union below still enumerates 'cluster' for backward
// compatibility with runtime paths that predate this split, but NEW code
// must treat cluster through `SetExecutionMethod` and the `isGroupedStructure`
// predicate, not by reading `GroupType`.

/** True multi-exercise grouped structures that require >=2 members. */
export type GroupedStructureType = 'superset' | 'circuit' | 'density_block'

/** Per-exercise set-execution methods. Orthogonal to grouping. */
export type SetExecutionMethod = 'cluster' | 'rest_pause' | 'top_set' | 'drop_set'

/** Informational-only training cues. Never produces structure. */
export type ContextualCueType = 'strength_emphasis' | 'skill_priority' | 'primer' | 'overload'

export const GROUPED_STRUCTURE_LABELS: Record<GroupedStructureType, string> = {
  superset: 'Superset',
  circuit: 'Circuit',
  density_block: 'Density Block',
}

export const SET_EXECUTION_METHOD_LABELS: Record<SetExecutionMethod, string> = {
  cluster: 'Cluster',
  rest_pause: 'Rest-Pause',
  top_set: 'Top Set',
  drop_set: 'Drop Set',
}

/**
 * Type guard: is this value an authoritative grouped structure? Use this in
 * preference to comparing `GroupType === 'cluster'` or similar — the legacy
 * `GroupType` union still contains 'cluster' but cluster is NOT a grouped
 * structure; it's a set-execution method.
 */
export function isGroupedStructureType(value: unknown): value is GroupedStructureType {
  return value === 'superset' || value === 'circuit' || value === 'density_block'
}

/** Type guard for set-execution methods. */
export function isSetExecutionMethod(value: unknown): value is SetExecutionMethod {
  return value === 'cluster' || value === 'rest_pause' || value === 'top_set' || value === 'drop_set'
}

// =============================================================================
// GROUP TYPES (LEGACY — see METHOD TAXONOMY above)
// =============================================================================

// [GROUPED-CONTRACT-ALIGN] GroupType must match all values from styledGroups.groupType
// [METHOD-TAXONOMY-LOCK] 'cluster' remains in this union ONLY for backward
// compatibility with the runtime `deriveExecutionPlan()` path in this file
// and with existing display adapters that were built before the taxonomy
// split. NEW code MUST NOT emit styledGroups with `groupType: 'cluster'` and
// MUST NOT create ExecutionBlocks with `groupType: 'cluster'` unless there is
// a genuine multi-member cluster block (shared blockId, >=2 members). Single-
// exercise cluster is a SET-EXECUTION METHOD and belongs on the exercise via
// `setExecutionMethod`, not on a grouped block.
export type GroupType = 'superset' | 'circuit' | 'cluster' | 'density_block' | null

export const GROUP_TYPE_LABELS: Record<NonNullable<GroupType>, string> = {
  superset: 'Superset',
  circuit: 'Circuit',
  cluster: 'Cluster',
  density_block: 'Density Block',
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

// [GROUPED-CONTRACT-ALIGN] ExecutionBlock supports all group types for runtime consistency
export interface ExecutionBlock {
  blockId: string
  groupType: GroupType  // Now includes 'density_block'
  blockLabel: string // e.g., "Superset", "Circuit", "Density Block"
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
  // [METHOD-TAXONOMY-LOCK] Set-execution method for THIS single exercise.
  // Orthogonal to `blockId`-based grouping. Populated only when a set-
  // execution method (cluster / rest-pause / top set / drop set) applies to
  // this one exercise. Does NOT imply a grouped block — a single-exercise
  // cluster row has `setExecutionMethod: 'cluster'` but no blockId.
  setExecutionMethod?: SetExecutionMethod
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
  const isHold = isHoldUnit(repsOrTime)
  const match = repsOrTime.match(/(\d+)/)
  // [LIVE-UNIT-CONTRACT] If the exercise is hold-based, unknown seed defaults
  // to 30s. Reps-based defaults to 8. This removes the former silent reps
  // default of 8 being applied to hold exercises when the numeric parse
  // failed.
  const value = match ? parseInt(match[1], 10) : (isHold ? 30 : 8)
  
  return {
    reps: isHold ? null : value,
    hold: isHold ? value : null,
    isHold,
  }
}

// =============================================================================
// [LIVE-UNIT-CONTRACT] CANONICAL HOLD-VS-REPS UNIT DETECTOR
// =============================================================================
// Single authoritative function that classifies an exercise as hold-based or
// reps-based for the ENTIRE live workout corridor (active card, set logging,
// completed-set serialization, recap). All per-file inline `includes('sec')`
// regex variants have been consolidated here.
//
// Returns true when the exercise is a pure hold exercise. Returns false when
// it is reps-based. Mixed/variant exercises still resolve to one primary
// unit - hold takes precedence when the prescription explicitly signals a
// timed quantity OR when the exercise name matches a well-known isometric
// skill.
//
// Why the old checks were broken:
//   - Prior sites used `repsOrTime.includes('sec') || includes('hold')` only.
//   - That FAILED for bare second shorthand like "6s", "20s", "30s", which
//     is the canonical compact form for hold prescriptions.
//   - A Planche Lean prescribed as "6s" was silently classified as 6 REPS,
//     producing the "8 reps" logging bug for hold exercises.
//
// This helper now additionally matches:
//   1. `\d+\s*s` (short form: 6s, 30 s)
//   2. `second`/`seconds`/`sec`/`hold`/`hang`/`iso` (word forms)
//   3. Known hold-skill names (planche, lever, lean, l-sit, support, flag)
// =============================================================================

export interface HoldUnitContext {
  repsOrTime?: string | null
  name?: string | null
  category?: string | null
  // Optional explicit signal from authoritative contracts upstream
  isTimedHold?: boolean | null
}

export function isHoldUnit(input: string | HoldUnitContext | null | undefined): boolean {
  if (!input) return false

  let repsOrTime: string
  let name: string
  let category: string
  let explicit: boolean | null | undefined

  if (typeof input === 'string') {
    repsOrTime = input
    name = ''
    category = ''
    explicit = null
  } else {
    repsOrTime = String(input.repsOrTime ?? '')
    name = String(input.name ?? '')
    category = String(input.category ?? '')
    explicit = input.isTimedHold
  }

  // 1. Explicit upstream authority wins.
  if (explicit === true) return true

  const rotLower = repsOrTime.toLowerCase()

  // 2. Word-form prescription signals.
  if (/\b(hold|holds|hang|hangs|iso|isom|second|seconds|sec|secs)\b/.test(rotLower)) {
    return true
  }

  // 3. Short-form second shorthand: "6s", "20s", "30 s", "45s hold".
  //    Guard against matching things like "8-12 reps" (no digit-adjacent s).
  if (/(^|[^a-z])\d+\s*s(?![a-rt-z])/.test(rotLower)) {
    return true
  }

  // 4. Known hold-skill name patterns. Category 'skill' is not sufficient on
  //    its own because some skill work is reps-based (pseudo planche push-ups).
  const nameLower = name.toLowerCase()
  const categoryLower = category.toLowerCase()
  if (
    /(planche lean|planche hold|tuck planche|adv tuck|straddle planche|full planche)/.test(nameLower) ||
    /(front lever|back lever|side lever|tuck lever|advanced tuck lever|straddle lever)/.test(nameLower) ||
    /(l-sit|l sit|v-sit|v sit|manna|straddle l)/.test(nameLower) ||
    /(handstand hold|handstand against wall|wall handstand)/.test(nameLower) ||
    /(support hold|dip support|ring support|ring hold)/.test(nameLower) ||
    /(human flag|flag hold|scapular hold|dead hang|active hang|bar hang)/.test(nameLower) ||
    /(hollow hold|arch hold|plank hold|copenhagen hold|wall sit)/.test(nameLower)
  ) {
    return true
  }
  // Explicit hold-named category (e.g. 'isometric').
  if (/isometric/.test(categoryLower)) {
    return true
  }

  return false
}
