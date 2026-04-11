/**
 * Workout Session Contract
 * 
 * =============================================================================
 * AUTHORITATIVE SESSION DATA CONTRACT - PHASE X
 * =============================================================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for workout session data structure.
 * All session hydration, storage, and display MUST conform to this contract.
 * 
 * CRITICAL: This contract guarantees:
 * 1. Every session has a valid id, dayIndex/dayNumber, and title/dayLabel
 * 2. Every session has a valid exercises array (never undefined)
 * 3. Every exercise has id and name as strings (never undefined)
 * 4. All optional fields have documented safe defaults
 * 
 * DO NOT:
 * - Access session data without normalizing through this contract
 * - Add new fields without updating the normalizer
 * - Assume any field is present without checking the contract
 */

// =============================================================================
// CORE CONTRACTS
// =============================================================================

/**
 * The authoritative workout session contract.
 * This is the shape that MUST reach the UI after normalization.
 */
export interface WorkoutSessionContract {
  /** Unique session identifier - ALWAYS a string */
  id: string
  /** Day number in the program (1-indexed typically) */
  dayNumber: number
  /** Display label for the day (e.g., "Push Day", "Day 1") */
  dayLabel: string
  /** Session focus type */
  focus: string
  /** Human-readable focus label */
  focusLabel: string
  /** Coach rationale for this session */
  rationale: string
  /** Estimated duration in minutes */
  estimatedMinutes: number
  /** Whether this is a primary training day */
  isPrimary: boolean
  /** Whether a finisher was included */
  finisherIncluded: boolean
  /** The exercises in this session - ALWAYS an array, never undefined */
  exercises: WorkoutExerciseContract[]
  /** Optional warmup exercises */
  warmup: WorkoutExerciseContract[]
  /** Optional cooldown exercises */
  cooldown: WorkoutExerciseContract[]
}

/**
 * The authoritative workout exercise contract.
 * Every exercise in a session MUST conform to this shape.
 */
export interface WorkoutExerciseContract {
  /** Unique exercise identifier - ALWAYS a string */
  id: string
  /** Exercise name - ALWAYS a string, never empty */
  name: string
  /** Exercise category (push, pull, skill, etc.) */
  category: string
  /** Number of sets - ALWAYS a positive number */
  sets: number
  /** Reps or time prescription (e.g., "8-12 reps", "30 seconds") */
  repsOrTime: string
  /** Optional coaching note */
  note: string
  /** Whether this exercise can be overridden */
  isOverrideable: boolean
  /** Reason for selecting this exercise */
  selectionReason: string
  /** Optional prescribed load data */
  prescribedLoad?: PrescribedLoadContract
  /** Target RPE for this exercise */
  targetRPE?: number
  /** Rest time in seconds */
  restSeconds?: number
  /** Training method (standard, cluster, myo-reps, etc.) */
  method?: string
  /** Human-readable method label */
  methodLabel?: string
  /** Block ID if part of a block */
  blockId?: string
  /** Whether exercise was adapted from original */
  wasAdapted?: boolean
  /** Source of this exercise selection */
  source?: string
  /** Progression decision metadata */
  progressionDecision?: ProgressionDecisionContract
  /** Coaching metadata */
  coachingMeta?: CoachingMetaContract
  /** Execution truth for band recommendations */
  executionTruth?: ExerciseExecutionTruthContract
}

/**
 * Prescribed load contract
 */
export interface PrescribedLoadContract {
  load: number
  unit: 'lbs' | 'kg' | 'bodyweight' | '%1RM'
  basis: 'current_benchmark' | 'estimated' | 'progression' | 'user_input'
  confidenceLevel: 'high' | 'moderate' | 'low'
  targetReps?: number
  intensityBand?: 'strength' | 'hypertrophy' | 'endurance' | 'skill'
}

/**
 * Progression decision contract
 */
export interface ProgressionDecisionContract {
  decision: string
  reason: string
  confidence?: string
}

/**
* Coaching metadata contract
* [EXPLAIN-OWNER-LOCK] roleInSession is critical for explanation engine
*/
export interface CoachingMetaContract {
  expressionMode?: string
  loadDecisionSummary?: string
  adaptationNote?: string
  /** Role of this exercise in the session (primary, secondary, finisher, etc.) */
  roleInSession?: string
  /** Progression intent for this exercise (maintain, push, deload, etc.) */
  progressionIntent?: string
}

/**
 * Exercise execution truth contract
 */
export interface ExerciseExecutionTruthContract {
  recommendedBand?: string
  bandReason?: string
  calibrationNeeded?: boolean
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validation result for a session
 */
export interface SessionValidationResult {
  isValid: boolean
  reasons: string[]
  safeExerciseCount: number
  droppedExerciseIndexes: number[]
  fieldCoercions: string[]
}

/**
 * Validate a normalized workout session.
 * Returns detailed validation result.
 */
export function validateWorkoutSessionContract(
  session: WorkoutSessionContract | null
): SessionValidationResult {
  const reasons: string[] = []
  const droppedExerciseIndexes: number[] = []
  const fieldCoercions: string[] = []
  
  if (!session) {
    return { 
      isValid: false, 
      reasons: ['session_null'], 
      safeExerciseCount: 0, 
      droppedExerciseIndexes: [], 
      fieldCoercions: [] 
    }
  }
  
  // Validate required string fields
  if (!session.id || typeof session.id !== 'string') {
    reasons.push('session_invalid_id')
  }
  if (!session.dayLabel || typeof session.dayLabel !== 'string') {
    reasons.push('session_invalid_dayLabel')
  }
  
  // Validate exercises array
  if (!Array.isArray(session.exercises)) {
    return { 
      isValid: false, 
      reasons: ['exercises_not_array'], 
      safeExerciseCount: 0, 
      droppedExerciseIndexes: [], 
      fieldCoercions: [] 
    }
  }
  
  // Validate each exercise
  let validCount = 0
  session.exercises.forEach((ex, idx) => {
    if (!ex) {
      reasons.push(`exercise_${idx}_null`)
      droppedExerciseIndexes.push(idx)
      return
    }
    if (typeof ex.name !== 'string' || ex.name.trim() === '' || ex.name === 'Exercise') {
      reasons.push(`exercise_${idx}_invalid_name`)
    }
    if (typeof ex.sets !== 'number' || ex.sets <= 0) {
      reasons.push(`exercise_${idx}_invalid_sets`)
    }
    if (typeof ex.repsOrTime !== 'string' || ex.repsOrTime.trim() === '') {
      reasons.push(`exercise_${idx}_invalid_repsOrTime`)
    }
    // Count as valid if has usable name and sets
    if (typeof ex.name === 'string' && ex.name.trim() !== '' && ex.name !== 'Exercise' && typeof ex.sets === 'number' && ex.sets > 0) {
      validCount++
    }
  })
  
  // Session is valid if it has at least 1 valid exercise
  const isValid = validCount > 0
  
  if (!isValid && reasons.length === 0) {
    reasons.push('no_valid_exercises')
  }
  
  return {
    isValid,
    reasons,
    safeExerciseCount: validCount,
    droppedExerciseIndexes,
    fieldCoercions,
  }
}

/**
 * Quick check if a session is runnable (has valid exercises)
 */
export function isRunnableSessionContract(session: WorkoutSessionContract | null): boolean {
  const validation = validateWorkoutSessionContract(session)
  return validation.isValid
}
