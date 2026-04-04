/**
 * [LIVE-WORKOUT-BOOT-CONTRACT] Runtime Validator for Live Workout Session
 * 
 * This module provides a single, centralized validation layer that guarantees
 * the live workout runtime can safely operate before active render paths begin.
 * 
 * PURITY GUARANTEE:
 * - This validator is pure - no component closure references
 * - All data comes from explicit function parameters
 * - All helpers are deterministic
 */

import type { RPEValue } from '@/lib/rpe-adjustment-engine'
import type { ResistanceBandColor } from '@/lib/band-progression-engine'

// =============================================================================
// TYPES
// =============================================================================

/** Minimal normalized exercise shape required for live workout runtime */
export interface NormalizedExercise {
  id?: string
  name: string
  category?: string
  sets: number
  repsOrTime: string
  note?: string
  isOverrideable?: boolean
  selectionReason?: string
  prescribedLoad?: {
    load?: number
    unit?: string
    confidenceLevel?: string
  }
  targetRPE?: number
  executionTruth?: unknown
}

/** Minimal normalized session contract shape */
export interface NormalizedSessionContract {
  dayLabel?: string
  dayNumber?: number
  exercises: NormalizedExercise[]
  estimatedMinutes?: number
  programWeek?: number
}

/** Exercise override state shape */
export interface ExerciseOverrideState {
  originalName: string
  currentName: string
  isSkipped: boolean
  isReplaced: boolean
  isProgressionAdjusted: boolean
}

/** Completed set data shape */
export interface CompletedSetData {
  exerciseIndex: number
  setNumber: number
  actualReps: number
  holdSeconds?: number
  actualRPE: RPEValue
  bandUsed: ResistanceBandColor | 'none'
  timestamp: number
}

/** Live session state from reducer */
export interface LiveSessionState {
  status: 'ready' | 'active' | 'resting' | 'completed' | 'inter_exercise_rest'
  currentExerciseIndex: number
  currentSetNumber: number
  completedSets: CompletedSetData[]
  startTime: number | null
  elapsedSeconds: number
  lastSetRPE: RPEValue | null
  workoutNotes: string
  exerciseOverrides: Record<number, ExerciseOverrideState>
  // Additional unified state fields
  selectedRPE?: RPEValue | null
  repsValue?: number
  holdValue?: number
  bandUsed?: ResistanceBandColor | 'none'
  showInterExerciseRest?: boolean
  interExerciseRestSeconds?: number
  transitionRepairIssue?: unknown
}

/** Transition repair issue shape */
export interface TransitionRepairIssue {
  type: string
  message: string
}

/** Validation result with ALL safe derived values for the complete live workout runtime */
export interface LiveWorkoutRuntimeValidation {
  // Core validity
  isValid: boolean
  reason: string | null
  invalidFields: string[]
  
  // Safe derived values (use these, not raw liveSession values)
  safeExerciseIndex: number
  safeCurrentSetNumber: number
  safeCurrentExercise: NormalizedExercise | null
  hasValidExercises: boolean
  
  // Normalized arrays (safe to use even if input was malformed)
  normalizedCompletedSets: CompletedSetData[]
  normalizedExerciseOverrides: Record<number, ExerciseOverrideState>
  
  // ==========================================================================
  // FULL SAFE RUNTIME CONTRACT - ALL values needed for active workout render
  // These are the AUTHORITATIVE safe values. Do NOT read raw liveSession.*
  // ==========================================================================
  
  // Status & timing
  safeStatus: 'ready' | 'active' | 'resting' | 'completed' | 'inter_exercise_rest'
  safeStartTime: number | null
  safeElapsedSeconds: number
  safeLastSetRPE: RPEValue | null
  
  // User input state
  safeSelectedRPE: RPEValue | null
  safeRepsValue: number
  safeHoldValue: number
  safeBandUsed: ResistanceBandColor | 'none'
  safeWorkoutNotes: string
  
  // Inter-exercise rest state
  safeShowInterExerciseRest: boolean
  safeInterExerciseRestSeconds: number
  
  // Transition repair
  safeTransitionRepairIssue: TransitionRepairIssue | null
  
  // Diagnostics
  diagnostics: {
    exerciseCount: number
    requestedIndex: number
    clampedIndex: number
    requestedSetNumber: number
    clampedSetNumber: number
    status: string
    completedSetsValid: boolean
    overridesValid: boolean
    sessionContractValid: boolean
    liveSessionValid: boolean
  }
}

// =============================================================================
// VALIDATION HELPERS (PURE)
// =============================================================================

const VALID_STATUSES = ['ready', 'active', 'resting', 'completed', 'inter_exercise_rest'] as const

function isValidStatus(status: unknown): status is LiveSessionState['status'] {
  return typeof status === 'string' && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeExercise(exercise: unknown, index: number): NormalizedExercise | null {
  if (!isPlainObject(exercise)) return null
  
  const name = typeof exercise.name === 'string' && exercise.name.trim() 
    ? exercise.name.trim() 
    : `Exercise ${index + 1}`
  
  const sets = isFiniteNumber(exercise.sets) && exercise.sets > 0 
    ? exercise.sets 
    : 3
  
  const repsOrTime = typeof exercise.repsOrTime === 'string' && exercise.repsOrTime.trim()
    ? exercise.repsOrTime.trim()
    : '8-12 reps'
  
  return {
    id: typeof exercise.id === 'string' ? exercise.id : `exercise-${index}`,
    name,
    category: typeof exercise.category === 'string' ? exercise.category : 'general',
    sets,
    repsOrTime,
    note: typeof exercise.note === 'string' ? exercise.note : '',
    isOverrideable: typeof exercise.isOverrideable === 'boolean' ? exercise.isOverrideable : true,
    selectionReason: typeof exercise.selectionReason === 'string' ? exercise.selectionReason : '',
    prescribedLoad: isPlainObject(exercise.prescribedLoad) ? exercise.prescribedLoad as NormalizedExercise['prescribedLoad'] : undefined,
    targetRPE: isFiniteNumber(exercise.targetRPE) ? exercise.targetRPE : undefined,
    executionTruth: exercise.executionTruth,
  }
}

function normalizeCompletedSet(set: unknown): CompletedSetData | null {
  if (!isPlainObject(set)) return null
  
  if (!isFiniteNumber(set.exerciseIndex) || set.exerciseIndex < 0) return null
  if (!isFiniteNumber(set.setNumber) || set.setNumber < 1) return null
  if (!isFiniteNumber(set.actualReps) || set.actualReps < 0) return null
  if (!isFiniteNumber(set.timestamp)) return null
  
  return {
    exerciseIndex: set.exerciseIndex,
    setNumber: set.setNumber,
    actualReps: set.actualReps,
    holdSeconds: isFiniteNumber(set.holdSeconds) ? set.holdSeconds : undefined,
    actualRPE: (typeof set.actualRPE === 'number' && set.actualRPE >= 1 && set.actualRPE <= 10 
      ? set.actualRPE 
      : 5) as RPEValue,
    bandUsed: typeof set.bandUsed === 'string' ? set.bandUsed as ResistanceBandColor | 'none' : 'none',
    timestamp: set.timestamp,
  }
}

function normalizeOverride(override: unknown): ExerciseOverrideState | null {
  if (!isPlainObject(override)) return null
  
  return {
    originalName: typeof override.originalName === 'string' ? override.originalName : 'Unknown',
    currentName: typeof override.currentName === 'string' ? override.currentName : 'Unknown',
    isSkipped: typeof override.isSkipped === 'boolean' ? override.isSkipped : false,
    isReplaced: typeof override.isReplaced === 'boolean' ? override.isReplaced : false,
    isProgressionAdjusted: typeof override.isProgressionAdjusted === 'boolean' ? override.isProgressionAdjusted : false,
  }
}

// =============================================================================
// MAIN VALIDATOR
// =============================================================================

/**
 * Creates a fail-closed invalid result for when the validator itself errors.
 * This ensures the validator NEVER throws - it fails closed instead.
 */
function createValidatorExceptionResult(errorMessage: string): LiveWorkoutRuntimeValidation {
  return {
    isValid: false,
    reason: `validator_exception:${errorMessage}`,
    invalidFields: ['validator_internal_error'],
    
    safeExerciseIndex: 0,
    safeCurrentSetNumber: 1,
    safeCurrentExercise: null,
    hasValidExercises: false,
    
    normalizedCompletedSets: [],
    normalizedExerciseOverrides: {},
    
    safeStatus: 'ready',
    safeStartTime: null,
    safeElapsedSeconds: 0,
    safeLastSetRPE: null,
    safeSelectedRPE: null,
    safeRepsValue: 8,
    safeHoldValue: 30,
    safeBandUsed: 'none',
    safeWorkoutNotes: '',
    safeShowInterExerciseRest: false,
    safeInterExerciseRestSeconds: 0,
    safeTransitionRepairIssue: null,
    
    diagnostics: {
      exerciseCount: 0,
      requestedIndex: 0,
      clampedIndex: 0,
      requestedSetNumber: 1,
      clampedSetNumber: 1,
      status: 'ready',
      completedSetsValid: true,
      overridesValid: true,
      sessionContractValid: false,
      liveSessionValid: false,
    },
  }
}

/**
 * Validates the live workout runtime state and returns safe derived values.
 * 
 * This is the SINGLE source of truth for whether the live workout can safely render.
 * All active render paths should use values from this result, not raw liveSession values.
 * 
 * CRITICAL: This function NEVER throws. It fails closed with a structured invalid result.
 * 
 * @param sessionContract - The normalized session contract (safeWorkoutSessionContract)
 * @param liveSession - The reducer-owned live session state
 * @returns Validation result with safe derived values
 */
export function validateLiveWorkoutRuntime(
  sessionContract: NormalizedSessionContract | null | undefined,
  liveSession: LiveSessionState | null | undefined
): LiveWorkoutRuntimeValidation {
  try {
    return validateLiveWorkoutRuntimeInternal(sessionContract, liveSession)
  } catch (error) {
    // FAIL CLOSED: Never throw, return structured invalid result
    const errorMessage = error instanceof Error ? error.message : 'unknown_error'
    if (process.env.NODE_ENV === 'development') {
      console.error('[v0] [validator_exception]', errorMessage, error)
    }
    return createValidatorExceptionResult(errorMessage)
  }
}

/**
 * Internal implementation of runtime validation.
 * Wrapped by validateLiveWorkoutRuntime for exception safety.
 */
function validateLiveWorkoutRuntimeInternal(
  sessionContract: NormalizedSessionContract | null | undefined,
  liveSession: LiveSessionState | null | undefined
): LiveWorkoutRuntimeValidation {
  const invalidFields: string[] = []
  
  // ==========================================================================
  // SESSION CONTRACT VALIDATION
  // ==========================================================================
  
  const sessionContractValid = !!(
    sessionContract &&
    isValidArray(sessionContract.exercises)
  )
  
  if (!sessionContract) {
    invalidFields.push('sessionContract:missing')
  } else if (!isValidArray(sessionContract.exercises)) {
    invalidFields.push('sessionContract.exercises:not_array')
  }
  
  // Normalize exercises
  const rawExercises = sessionContractValid ? sessionContract!.exercises : []
  const normalizedExercises: NormalizedExercise[] = []
  
  for (let i = 0; i < rawExercises.length; i++) {
    const normalized = normalizeExercise(rawExercises[i], i)
    if (normalized) {
      normalizedExercises.push(normalized)
    }
  }
  
  const exerciseCount = normalizedExercises.length
  const hasValidExercises = exerciseCount > 0
  
  if (!hasValidExercises && sessionContractValid) {
    invalidFields.push('exercises:empty_after_normalization')
  }
  
  // ==========================================================================
  // LIVE SESSION VALIDATION
  // ==========================================================================
  
  const liveSessionExists = !!liveSession
  
  if (!liveSession) {
    invalidFields.push('liveSession:missing')
  }
  
  const statusValid = liveSessionExists && isValidStatus(liveSession?.status)
  if (liveSessionExists && !statusValid) {
    invalidFields.push('liveSession.status:invalid')
  }
  
  const indexValid = liveSessionExists && isFiniteNumber(liveSession?.currentExerciseIndex)
  if (liveSessionExists && !indexValid) {
    invalidFields.push('liveSession.currentExerciseIndex:not_finite')
  }
  
  const setNumberValid = liveSessionExists && isFiniteNumber(liveSession?.currentSetNumber)
  if (liveSessionExists && !setNumberValid) {
    invalidFields.push('liveSession.currentSetNumber:not_finite')
  }
  
  const completedSetsIsArray = liveSessionExists && isValidArray(liveSession?.completedSets)
  if (liveSessionExists && !completedSetsIsArray) {
    invalidFields.push('liveSession.completedSets:not_array')
  }
  
  const overridesIsObject = liveSessionExists && isPlainObject(liveSession?.exerciseOverrides)
  if (liveSessionExists && !overridesIsObject) {
    invalidFields.push('liveSession.exerciseOverrides:not_object')
  }
  
  const liveSessionValid = statusValid && indexValid && setNumberValid && completedSetsIsArray && overridesIsObject
  
  // ==========================================================================
  // COMPUTE SAFE DERIVED VALUES
  // ==========================================================================
  
  const requestedIndex = liveSession?.currentExerciseIndex ?? 0
  const safeExerciseIndex = hasValidExercises
    ? Math.max(0, Math.min(requestedIndex, exerciseCount - 1))
    : 0
  
  const safeCurrentExercise = hasValidExercises 
    ? normalizedExercises[safeExerciseIndex] 
    : null
  
  const currentExerciseSets = safeCurrentExercise?.sets ?? 3
  const requestedSetNumber = liveSession?.currentSetNumber ?? 1
  const safeCurrentSetNumber = Math.max(1, Math.min(requestedSetNumber, currentExerciseSets))
  
  // ==========================================================================
  // NORMALIZE COMPLETED SETS (recoverable)
  // ==========================================================================
  
  const normalizedCompletedSets: CompletedSetData[] = []
  const rawCompletedSets = completedSetsIsArray ? liveSession!.completedSets : []
  
  for (const rawSet of rawCompletedSets) {
    const normalized = normalizeCompletedSet(rawSet)
    if (normalized) {
      normalizedCompletedSets.push(normalized)
    }
  }
  
  const completedSetsValid = rawCompletedSets.length === 0 || normalizedCompletedSets.length > 0
  
  // ==========================================================================
  // NORMALIZE EXERCISE OVERRIDES (recoverable)
  // ==========================================================================
  
  const normalizedExerciseOverrides: Record<number, ExerciseOverrideState> = {}
  const rawOverrides = overridesIsObject ? liveSession!.exerciseOverrides : {}
  
  for (const key of Object.keys(rawOverrides)) {
    const index = parseInt(key, 10)
    if (isFiniteNumber(index) && index >= 0) {
      const normalized = normalizeOverride(rawOverrides[index])
      if (normalized) {
        normalizedExerciseOverrides[index] = normalized
      }
    }
  }
  
  const overridesValid = true // Overrides are always recoverable (empty = valid)
  
  // ==========================================================================
  // NORMALIZE ALL ADDITIONAL RUNTIME FIELDS (recoverable)
  // ==========================================================================
  
  // Status - default to 'ready' if invalid
  const safeStatus: LiveWorkoutRuntimeValidation['safeStatus'] = 
    statusValid ? liveSession!.status : 'ready'
  
  // Timing
  const safeStartTime = liveSessionExists && isFiniteNumber(liveSession?.startTime) 
    ? liveSession!.startTime 
    : null
  
  const safeElapsedSeconds = liveSessionExists && isFiniteNumber(liveSession?.elapsedSeconds) && liveSession!.elapsedSeconds >= 0
    ? liveSession!.elapsedSeconds
    : 0
  
  // Last set RPE (nullable, 1-10 range)
  const rawLastRPE = liveSession?.lastSetRPE
  const safeLastSetRPE: RPEValue | null = 
    typeof rawLastRPE === 'number' && rawLastRPE >= 1 && rawLastRPE <= 10
      ? rawLastRPE as RPEValue
      : null
  
  // Selected RPE (nullable, 1-10 range)
  const rawSelectedRPE = liveSession?.selectedRPE
  const safeSelectedRPE: RPEValue | null = 
    typeof rawSelectedRPE === 'number' && rawSelectedRPE >= 1 && rawSelectedRPE <= 10
      ? rawSelectedRPE as RPEValue
      : null
  
  // Reps value (default 8)
  const rawRepsValue = liveSession?.repsValue
  const safeRepsValue = isFiniteNumber(rawRepsValue) && rawRepsValue >= 0
    ? rawRepsValue
    : 8
  
  // Hold value (default 30)
  const rawHoldValue = liveSession?.holdValue
  const safeHoldValue = isFiniteNumber(rawHoldValue) && rawHoldValue >= 0
    ? rawHoldValue
    : 30
  
  // Band used (must be valid color or 'none')
  const VALID_BANDS = ['yellow', 'red', 'green', 'blue', 'black', 'silver', 'gold', 'none'] as const
  const rawBandUsed = liveSession?.bandUsed
  const safeBandUsed: ResistanceBandColor | 'none' = 
    typeof rawBandUsed === 'string' && VALID_BANDS.includes(rawBandUsed as typeof VALID_BANDS[number])
      ? rawBandUsed as ResistanceBandColor | 'none'
      : 'none'
  
  // Workout notes (default empty string)
  const safeWorkoutNotes = typeof liveSession?.workoutNotes === 'string'
    ? liveSession.workoutNotes
    : ''
  
  // Inter-exercise rest state
  const safeShowInterExerciseRest = typeof liveSession?.showInterExerciseRest === 'boolean'
    ? liveSession.showInterExerciseRest
    : false
  
  const rawRestSeconds = liveSession?.interExerciseRestSeconds
  const safeInterExerciseRestSeconds = isFiniteNumber(rawRestSeconds) && rawRestSeconds >= 0
    ? rawRestSeconds
    : 0
  
  // Transition repair issue (null or valid object)
  let safeTransitionRepairIssue: TransitionRepairIssue | null = null
  if (liveSession?.transitionRepairIssue && isPlainObject(liveSession.transitionRepairIssue)) {
    const issue = liveSession.transitionRepairIssue as Record<string, unknown>
    if (typeof issue.type === 'string' && typeof issue.message === 'string') {
      safeTransitionRepairIssue = {
        type: issue.type,
        message: issue.message,
      }
    }
  }
  
  // ==========================================================================
  // DETERMINE OVERALL VALIDITY
  // ==========================================================================
  
  // Core validity requires:
  // 1. Session contract exists with exercises array
  // 2. At least one valid exercise after normalization
  // 3. Live session exists with valid core fields
  const isValid = sessionContractValid && hasValidExercises && liveSessionValid
  
  let reason: string | null = null
  if (!isValid) {
    if (!sessionContractValid) {
      reason = 'Session contract is missing or invalid'
    } else if (!hasValidExercises) {
      reason = 'No valid exercises available for workout'
    } else if (!liveSessionValid) {
      reason = 'Live session state is malformed'
    }
  }
  
  // ==========================================================================
  // BUILD RESULT
  // ==========================================================================
  
  return {
    isValid,
    reason,
    invalidFields,
    
    safeExerciseIndex,
    safeCurrentSetNumber,
    safeCurrentExercise,
    hasValidExercises,
    
    normalizedCompletedSets,
    normalizedExerciseOverrides,
    
    // Full safe runtime contract
    safeStatus,
    safeStartTime,
    safeElapsedSeconds,
    safeLastSetRPE,
    safeSelectedRPE,
    safeRepsValue,
    safeHoldValue,
    safeBandUsed,
    safeWorkoutNotes,
    safeShowInterExerciseRest,
    safeInterExerciseRestSeconds,
    safeTransitionRepairIssue,
    
    diagnostics: {
      exerciseCount,
      requestedIndex,
      clampedIndex: safeExerciseIndex,
      requestedSetNumber,
      clampedSetNumber: safeCurrentSetNumber,
      status: safeStatus,
      completedSetsValid,
      overridesValid,
      sessionContractValid,
      liveSessionValid,
    },
  }
}

/**
 * Validates hydration data before it's applied to the reducer.
 * Returns null if the data should be rejected, or sanitized data if acceptable.
 * 
 * CRITICAL: This function NEVER throws. It returns null on any error.
 */
export function validateHydrationPayload(
  savedState: Partial<LiveSessionState> | null | undefined,
  exerciseCount: number
): Partial<LiveSessionState> | null {
  try {
    if (!savedState || !isPlainObject(savedState)) {
      return null
    }
    
    // Status must be valid and not completed (completed sessions shouldn't be restored)
    if (!isValidStatus(savedState.status) || savedState.status === 'completed') {
      return null
    }
    
    // Index must be valid and within bounds
    if (!isFiniteNumber(savedState.currentExerciseIndex) || savedState.currentExerciseIndex < 0) {
      return null
    }
    
    // Clamp index to valid range
    const safeIndex = Math.min(savedState.currentExerciseIndex, Math.max(0, exerciseCount - 1))
    
    // Set number must be valid
    if (!isFiniteNumber(savedState.currentSetNumber) || savedState.currentSetNumber < 1) {
      return null
    }
    
    // Normalize completedSets
    const normalizedSets: CompletedSetData[] = []
    if (isValidArray(savedState.completedSets)) {
      for (const rawSet of savedState.completedSets) {
        const normalized = normalizeCompletedSet(rawSet)
        if (normalized && normalized.exerciseIndex < exerciseCount) {
          normalizedSets.push(normalized)
        }
      }
    }
    
    // Normalize overrides
    const normalizedOverrides: Record<number, ExerciseOverrideState> = {}
    if (isPlainObject(savedState.exerciseOverrides)) {
      for (const key of Object.keys(savedState.exerciseOverrides as Record<string, unknown>)) {
        const index = parseInt(key, 10)
        if (isFiniteNumber(index) && index >= 0 && index < exerciseCount) {
          const normalized = normalizeOverride((savedState.exerciseOverrides as Record<number, unknown>)[index])
          if (normalized) {
            normalizedOverrides[index] = normalized
          }
        }
      }
    }
    
    return {
      ...savedState,
      currentExerciseIndex: safeIndex,
      completedSets: normalizedSets,
      exerciseOverrides: normalizedOverrides,
    }
  } catch (error) {
    // FAIL CLOSED: Never throw, return null to reject hydration
    if (process.env.NODE_ENV === 'development') {
      console.error('[v0] [hydration_validation_exception]', error)
    }
    return null
  }
}
