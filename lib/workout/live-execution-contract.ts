/**
 * Live Execution Contract
 * 
 * =============================================================================
 * CANONICAL RUNTIME CONTRACT FOR LIVE WORKOUT EXECUTION
 * =============================================================================
 * 
 * This module provides ONE authoritative normalized view for the current workout
 * execution state. It reads from existing truth providers and exposes a stable
 * contract that all live workout UI consumers can safely read from.
 * 
 * DESIGN PRINCIPLES:
 * - ADDITIVE: Does not replace existing truth providers, only normalizes them
 * - SINGLE SOURCE: All live workout surfaces read from this contract
 * - DETERMINISTIC: No hidden fallbacks that mask upstream issues
 * - EXTENSIBLE: Future AI features can plug into this contract
 * 
 * TRUTH PROVIDERS (UPSTREAM - NOT MODIFIED):
 * - SessionRuntimeTruth (session identity, adaptation state)
 * - ExerciseRuntimeTruth (exercise identity, rest doctrine, AI context)
 * - ExecutionPlan (grouped blocks, member indexes)
 * - MachineState (current exercise, set, round, rest timers)
 * 
 * WHAT THIS CONTRACT PREVENTS:
 * - Different surfaces parsing grouped blocks differently
 * - Timer displays using stale exercise context
 * - Member labels drifting between screens
 * - Fallback values masking real data issues
 */

import type { SessionRuntimeTruth, ExerciseRuntimeTruth } from '@/lib/workout-execution-truth'
import type { GroupType } from './execution-unit-contract'
import type { ExecutionBlock, ExecutionPlan } from './live-workout-machine'

// =============================================================================
// LIVE EXECUTION CONTRACT TYPES
// =============================================================================

/**
 * Normalized grouped block context for the current exercise.
 * Null if the current exercise is not in a grouped block.
 */
export interface GroupedBlockContext {
  // Block identity
  blockId: string
  groupType: NonNullable<GroupType>
  blockLabel: string
  
  // Member position
  memberIndex: number      // 0-based index within block
  memberLabel: string      // "A", "B", "C" for superset, "1", "2", "3" for circuit
  memberCount: number
  isFirstMember: boolean
  isLastMember: boolean
  
  // Round tracking
  currentRound: number
  targetRounds: number
  isLastRound: boolean
  
  // Other members (for display)
  allMemberNames: string[]
  allMemberLabels: string[]
  
  // Rest timing (from doctrine)
  intraBlockRestSeconds: number   // Rest between members in same round
  postRoundRestSeconds: number    // Rest after completing a round
  postBlockRestSeconds: number    // Rest after completing entire block
}

/**
 * Normalized timer context for the current state.
 */
export interface TimerContext {
  timerType: 'between_sets' | 'between_members' | 'between_rounds' | 'between_exercises' | 'none'
  baseSeconds: number
  reason: string
  isExtended: boolean
  
  // Source exercise context
  exerciseName: string
  exerciseCategory: string
  targetRPE: number
  actualRPE: number | null
  
  // Grouped context (if applicable)
  groupType: GroupType
  isGroupedRest: boolean
}

/**
 * The canonical live execution contract.
 * This is the single authoritative view for the current workout execution state.
 */
export interface LiveExecutionContract {
  // ==========================================================================
  // SESSION IDENTITY
  // ==========================================================================
  sessionId: string
  programId: string | null
  dayNumber: number
  dayLabel: string
  sessionFocus: string
  estimatedDurationMinutes: number
  sessionRationale: string | null
  
  // ==========================================================================
  // EXERCISE IDENTITY
  // ==========================================================================
  exerciseIndex: number
  exerciseId: string
  exerciseName: string
  exerciseCategory: string
  
  // ==========================================================================
  // PRESCRIPTION CONTRACT
  // ==========================================================================
  currentSet: number
  targetSets: number
  targetReps: number
  targetUnit: string
  targetRPE: number
  isHoldBased: boolean
  
  // ==========================================================================
  // PROGRESSION CONTEXT
  // ==========================================================================
  progressionFamily: string | null
  progressionMode: string
  canAdjustProgression: boolean
  isFixedPrescription: boolean
  fixedPrescriptionReason: string | null
  
  // ==========================================================================
  // GROUPED BLOCK CONTRACT (null if not in grouped block)
  // ==========================================================================
  groupedContext: GroupedBlockContext | null
  hasGroupedBlocks: boolean  // Session-level: any grouped blocks exist
  
  // ==========================================================================
  // TIMER CONTRACT
  // ==========================================================================
  restSecondsIntraSet: number
  restSecondsInterExercise: number
  restReason: string
  
  // ==========================================================================
  // AI CONTEXT CONTRACT
  // ==========================================================================
  selectionReason: string | null
  coachingNote: string | null
  method: string | null
  blockId: string | null
  
  // ==========================================================================
  // ADAPTATION STATE
  // ==========================================================================
  adaptationConfidence: 'low' | 'medium' | 'high'
  firstWorkoutsCalibrationMode: boolean
  workoutsCompletedInProgram: number
  
  // ==========================================================================
  // FEATURE FLAGS
  // ==========================================================================
  supportsBackNavigation: boolean
  supportsBetweenExerciseRest: boolean
  supportsNotesCapture: boolean
  supportsTimerAlerts: boolean
  supportsBandAdjustment: boolean
  
  // ==========================================================================
  // PROVENANCE (for debugging only)
  // ==========================================================================
  _provenance: {
    sessionTruthSource: 'buildSessionRuntimeTruth' | 'fallback'
    exerciseTruthSource: 'buildExerciseRuntimeTruth' | 'fallback'
    groupedBlockSource: 'executionPlan' | 'none'
    restDoctrineSource: 'resolveRestTime' | 'fallback'
    contractVersion: string
  }
}

// =============================================================================
// CONTRACT BUILDER
// =============================================================================

export interface LiveExecutionContractInputs {
  sessionTruth: SessionRuntimeTruth
  exerciseTruth: ExerciseRuntimeTruth
  executionPlan: ExecutionPlan | null
  currentExerciseIndex: number
  currentSet: number
  currentRound: number
  targetSets: number
  lastSetRPE: number | null
}

/**
 * Build the canonical live execution contract from existing truth providers.
 * This is the ONLY function that should be used to create a LiveExecutionContract.
 */
export function buildLiveExecutionContract(
  inputs: LiveExecutionContractInputs
): LiveExecutionContract {
  const {
    sessionTruth,
    exerciseTruth,
    executionPlan,
    currentExerciseIndex,
    currentSet,
    currentRound,
    targetSets,
    lastSetRPE,
  } = inputs
  
  // ==========================================================================
  // DERIVE GROUPED BLOCK CONTEXT
  // ==========================================================================
  let groupedContext: GroupedBlockContext | null = null
  
  if (executionPlan?.blocks) {
    for (const block of executionPlan.blocks) {
      const memberIndex = block.memberExerciseIndexes.indexOf(currentExerciseIndex)
      if (memberIndex !== -1 && block.groupType) {
        const memberCount = block.memberExerciseIndexes.length
        const memberLabels = generateMemberLabels(block.groupType, memberCount)
        
        groupedContext = {
          blockId: block.blockId,
          groupType: block.groupType,
          blockLabel: block.blockLabel,
          memberIndex,
          memberLabel: memberLabels[memberIndex] || String(memberIndex + 1),
          memberCount,
          isFirstMember: memberIndex === 0,
          isLastMember: memberIndex === memberCount - 1,
          currentRound,
          targetRounds: block.targetRounds,
          isLastRound: currentRound >= block.targetRounds,
          // Extract member names from memberExercises array
          allMemberNames: block.memberExercises?.map(ex => ex.name) || [],
          allMemberLabels: memberLabels,
          intraBlockRestSeconds: block.intraBlockRestSeconds,
          postRoundRestSeconds: block.postRoundRestSeconds,
          postBlockRestSeconds: block.postBlockRestSeconds,
        }
        break
      }
    }
  }
  
  // ==========================================================================
  // BUILD CONTRACT
  // ==========================================================================
  return {
    // Session identity
    sessionId: sessionTruth.sessionId,
    programId: sessionTruth.programId,
    dayNumber: sessionTruth.dayNumber,
    dayLabel: sessionTruth.dayLabel,
    sessionFocus: sessionTruth.sessionFocus,
    estimatedDurationMinutes: sessionTruth.estimatedDurationMinutes,
    sessionRationale: sessionTruth.sessionRationale,
    
    // Exercise identity
    exerciseIndex: currentExerciseIndex,
    exerciseId: exerciseTruth.exerciseId,
    exerciseName: exerciseTruth.exerciseName,
    exerciseCategory: exerciseTruth.category,
    
    // Prescription
    currentSet,
    targetSets,
    targetReps: exerciseTruth.targetValue,
    targetUnit: exerciseTruth.targetUnit,
    targetRPE: exerciseTruth.targetRPE,
    isHoldBased: exerciseTruth.displayType === 'hold',
    
    // Progression
    progressionFamily: exerciseTruth.progressionFamily,
    progressionMode: exerciseTruth.progressionMode,
    canAdjustProgression: exerciseTruth.canAdjustProgression,
    isFixedPrescription: exerciseTruth.isFixedPrescription,
    fixedPrescriptionReason: exerciseTruth.fixedPrescriptionReason,
    
    // Grouped block
    groupedContext,
    hasGroupedBlocks: executionPlan?.hasGroupedBlocks ?? sessionTruth.hasGroupedBlocks,
    
    // Timer
    restSecondsIntraSet: exerciseTruth.restSecondsIntraSet,
    restSecondsInterExercise: exerciseTruth.restSecondsInterExercise,
    restReason: exerciseTruth.restReason,
    
    // AI context
    selectionReason: exerciseTruth.selectionReason,
    coachingNote: exerciseTruth.coachingNote,
    method: exerciseTruth.method,
    blockId: exerciseTruth.blockId,
    
    // Adaptation
    adaptationConfidence: sessionTruth.adaptationConfidence,
    firstWorkoutsCalibrationMode: sessionTruth.firstWorkoutsCalibrationMode,
    workoutsCompletedInProgram: sessionTruth.workoutsCompletedInProgram,
    
    // Features
    supportsBackNavigation: sessionTruth.supportsBackNavigation,
    supportsBetweenExerciseRest: sessionTruth.supportsBetweenExerciseRest,
    supportsNotesCapture: sessionTruth.supportsNotesCapture,
    supportsTimerAlerts: sessionTruth.supportsTimerAlerts,
    supportsBandAdjustment: exerciseTruth.supportsBandAdjustment,
    
    // Provenance
    _provenance: {
      sessionTruthSource: 'buildSessionRuntimeTruth',
      exerciseTruthSource: 'buildExerciseRuntimeTruth',
      groupedBlockSource: executionPlan?.blocks ? 'executionPlan' : 'none',
      restDoctrineSource: 'resolveRestTime',
      contractVersion: '1.0.0',
    },
  }
}

// =============================================================================
// HELPER: Generate member labels
// =============================================================================

function generateMemberLabels(groupType: GroupType, count: number): string[] {
  if (!groupType) return []
  
  // Use A, B, C for superset members to match session card display
  if (groupType === 'superset') {
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)) // A, B, C...
  }
  // Use 1, 2, 3 for circuit members
  return Array.from({ length: count }, (_, i) => `${i + 1}`)
}

// =============================================================================
// HELPER: Build timer context from contract
// =============================================================================

export function buildTimerContext(
  contract: LiveExecutionContract,
  timerType: TimerContext['timerType'],
  actualRPE: number | null = null
): TimerContext {
  let baseSeconds = 0
  let reason = 'Standard rest'
  let isExtended = false
  let isGroupedRest = false
  
  switch (timerType) {
    case 'between_sets':
      baseSeconds = contract.restSecondsIntraSet
      reason = contract.restReason
      break
      
    case 'between_members':
      if (contract.groupedContext) {
        baseSeconds = contract.groupedContext.intraBlockRestSeconds
        reason = `${contract.groupedContext.blockLabel} transition`
        isGroupedRest = true
      }
      break
      
    case 'between_rounds':
      if (contract.groupedContext) {
        baseSeconds = contract.groupedContext.postRoundRestSeconds
        reason = `${contract.groupedContext.blockLabel} round recovery`
        isGroupedRest = true
      }
      break
      
    case 'between_exercises':
      baseSeconds = contract.restSecondsInterExercise
      reason = 'Exercise transition'
      break
      
    case 'none':
    default:
      baseSeconds = 0
      reason = 'No rest'
      break
  }
  
  // Extend rest if actual RPE was very high
  if (actualRPE !== null && actualRPE >= 10) {
    baseSeconds = Math.round(baseSeconds * 1.3)
    reason = 'Extended - maximal effort'
    isExtended = true
  }
  
  return {
    timerType,
    baseSeconds,
    reason,
    isExtended,
    exerciseName: contract.exerciseName,
    exerciseCategory: contract.exerciseCategory,
    targetRPE: contract.targetRPE,
    actualRPE,
    groupType: contract.groupedContext?.groupType ?? null,
    isGroupedRest,
  }
}

// =============================================================================
// QUICK ACCESS HELPERS
// =============================================================================

/**
 * Check if the current exercise is in a grouped block.
 */
export function isInGroupedBlock(contract: LiveExecutionContract): boolean {
  return contract.groupedContext !== null
}

/**
 * Get the formatted member label (e.g., "Superset A", "Circuit 2").
 */
export function getFormattedMemberLabel(contract: LiveExecutionContract): string | null {
  if (!contract.groupedContext) return null
  return `${contract.groupedContext.blockLabel} ${contract.groupedContext.memberLabel}`
}

/**
 * Check if we're at the last member of a grouped round.
 */
export function isLastMemberInRound(contract: LiveExecutionContract): boolean {
  return contract.groupedContext?.isLastMember ?? false
}

/**
 * Check if we're on the last round of a grouped block.
 */
export function isLastRound(contract: LiveExecutionContract): boolean {
  return contract.groupedContext?.isLastRound ?? false
}
