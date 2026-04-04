/**
 * Workout Session Validator
 * 
 * =============================================================================
 * AUTHORITATIVE SESSION VALIDATION - PHASE X
 * =============================================================================
 * 
 * This module provides session validation utilities.
 * Use before render to ensure session data is safe.
 */

import type { WorkoutSessionContract } from '@/lib/contracts/workout-session-contract'
import { validateWorkoutSessionContract, isRunnableSessionContract } from '@/lib/contracts/workout-session-contract'

// Re-export the contract validators for convenience
export { validateWorkoutSessionContract, isRunnableSessionContract }

/**
 * Check if a session is valid and log diagnostics if not.
 */
export function isValidSession(session: WorkoutSessionContract | null): boolean {
  if (!session) {
    console.error('[session-validator] Session is null/undefined')
    return false
  }
  
  if (!session.id) {
    console.error('[session-validator] Session missing id')
    return false
  }
  
  if (!Array.isArray(session.exercises)) {
    console.error('[session-validator] Session exercises is not an array')
    return false
  }
  
  if (session.exercises.length === 0) {
    console.error('[session-validator] Session has no exercises')
    return false
  }
  
  // Check each exercise has minimum required fields
  const invalidExercises = session.exercises.filter(
    ex => !ex || !ex.id || !ex.name || typeof ex.sets !== 'number'
  )
  
  if (invalidExercises.length > 0) {
    console.error('[session-validator] Session has invalid exercises:', invalidExercises.length)
    return false
  }
  
  return true
}

/**
 * Get detailed session diagnostic info for debugging
 */
export function getSessionDiagnostic(session: unknown): {
  isObject: boolean
  hasId: boolean
  hasDayLabel: boolean
  hasExercises: boolean
  exerciseCount: number
  validExerciseCount: number
  keys: string[]
} {
  const isObject = !!session && typeof session === 'object'
  
  if (!isObject) {
    return {
      isObject: false,
      hasId: false,
      hasDayLabel: false,
      hasExercises: false,
      exerciseCount: 0,
      validExerciseCount: 0,
      keys: [],
    }
  }
  
  const s = session as Record<string, unknown>
  const exercises = Array.isArray(s.exercises) ? s.exercises : []
  const validExercises = exercises.filter(
    ex => ex && typeof ex === 'object' && typeof (ex as Record<string, unknown>).name === 'string'
  )
  
  return {
    isObject: true,
    hasId: typeof s.id === 'string' && s.id !== '',
    hasDayLabel: typeof s.dayLabel === 'string' && s.dayLabel !== '',
    hasExercises: Array.isArray(s.exercises),
    exerciseCount: exercises.length,
    validExerciseCount: validExercises.length,
    keys: Object.keys(s),
  }
}

/**
 * Assert that a session is valid for workout execution.
 * Throws a descriptive error if not.
 */
export function assertValidSession(session: WorkoutSessionContract | null, context: string): asserts session is WorkoutSessionContract {
  const validation = validateWorkoutSessionContract(session)
  
  if (!validation.isValid) {
    const diagnostic = getSessionDiagnostic(session)
    console.error(`[session-validator] Invalid session in ${context}:`, {
      reasons: validation.reasons,
      diagnostic,
    })
    throw new Error(`Invalid session in ${context}: ${validation.reasons.join(', ')}`)
  }
}
