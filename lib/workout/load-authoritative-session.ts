/**
 * Authoritative Session Loader
 * 
 * =============================================================================
 * PHASE X+1 - AUTHORITY CORRIDOR FIX
 * =============================================================================
 * 
 * This module is the SINGLE ENTRY POINT for loading workout sessions.
 * It GUARANTEES a valid session is always returned - no null, no undefined.
 * 
 * GUARANTEES:
 * 1. NEVER returns null - always returns a valid session or fallback
 * 2. NEVER throws - all errors are caught and recovered
 * 3. ALL sessions have complete metadata
 * 4. Empty sessions auto-replaced with fallback
 * 5. Full diagnostic logging for debugging
 */

import type { AdaptiveSession, AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { 
  normalizeWorkoutSession, 
  normalizeAndValidateSession,
  createFallbackSession,
} from '@/lib/workout/normalize-workout-session'
import { getSessionDiagnostic } from '@/lib/workout/validate-session'
import type { WorkoutSessionContract } from '@/lib/contracts/workout-session-contract'

// =============================================================================
// SESSION METADATA - TRACKS SOURCE AND VALIDATION STATUS
// =============================================================================

export interface SessionMeta {
  /** Where the session data came from */
  source: 'DB' | 'PROGRAM_STATE' | 'FALLBACK' | 'RECOVERY' | 'DEMO'
  /** Whether the session passed validation */
  validationPassed: boolean
  /** Whether the session was recovered from a failure */
  recovered: boolean
  /** Reason for fallback if applicable */
  fallbackReason?: string
  /** Original exercise count before any filtering */
  originalExerciseCount?: number
  /** Timestamp of when session was loaded */
  loadedAt: string
}

export interface AuthoritativeSessionResult {
  /** The guaranteed valid session */
  session: AdaptiveSession
  /** Metadata about the session source and validation */
  meta: SessionMeta
  /** The reasoning summary if available */
  reasoningSummary?: unknown
}

// =============================================================================
// LOGGING
// =============================================================================

function logSessionLoad(stage: string, data: Record<string, unknown>) {
  console.log(`[PHASE-X+1] [${stage}]`, {
    timestamp: new Date().toISOString(),
    ...data,
  })
}

// =============================================================================
// LOCAL SESSION NORMALIZER
// =============================================================================

/**
 * Normalize raw session to AdaptiveSession shape.
 * Preserves all metadata and coerces fields to safe values.
 */
function normalizeToAdaptiveSession(raw: unknown, index: number): AdaptiveSession | null {
  if (!raw || typeof raw !== 'object') return null
  
  const session = raw as Record<string, unknown>
  
  // Normalize exercises array
  const rawExercises = Array.isArray(session.exercises) ? session.exercises : []
  const normalizedExercises = rawExercises
    .map((ex, idx) => {
      if (!ex || typeof ex !== 'object') return null
      const e = ex as Record<string, unknown>
      
      return {
        id: typeof e.id === 'string' && e.id ? e.id : `exercise-${idx}`,
        name: typeof e.name === 'string' && e.name ? e.name : 'Exercise',
        category: typeof e.category === 'string' ? e.category : 'general',
        sets: typeof e.sets === 'number' && e.sets > 0 ? e.sets : 3,
        repsOrTime: typeof e.repsOrTime === 'string' && e.repsOrTime ? e.repsOrTime : '8-12 reps',
        note: typeof e.note === 'string' ? e.note : '',
        isOverrideable: e.isOverrideable !== false,
        selectionReason: typeof e.selectionReason === 'string' ? e.selectionReason : '',
        prescribedLoad: e.prescribedLoad,
        targetRPE: e.targetRPE,
        restSeconds: e.restSeconds,
        method: e.method,
        methodLabel: e.methodLabel,
        blockId: e.blockId,
        wasAdapted: e.wasAdapted,
        source: e.source,
        progressionDecision: e.progressionDecision,
        coachingMeta: e.coachingMeta,
        executionTruth: e.executionTruth,
      }
    })
    .filter((ex): ex is NonNullable<typeof ex> => ex !== null)
  
  return {
    dayNumber: typeof session.dayNumber === 'number' ? session.dayNumber : index + 1,
    dayLabel: typeof session.dayLabel === 'string' && session.dayLabel ? session.dayLabel : `Day ${index + 1}`,
    focus: typeof session.focus === 'string' ? session.focus : 'general',
    focusLabel: typeof session.focusLabel === 'string' ? session.focusLabel : 'Training',
    rationale: typeof session.rationale === 'string' ? session.rationale : '',
    exercises: normalizedExercises,
    warmup: Array.isArray(session.warmup) ? session.warmup : [],
    cooldown: Array.isArray(session.cooldown) ? session.cooldown : [],
    estimatedMinutes: typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 45,
    isPrimary: session.isPrimary !== false,
    finisherIncluded: session.finisherIncluded === true,
  } as AdaptiveSession
}

// =============================================================================
// FALLBACK SESSION CREATOR
// =============================================================================

/**
 * Create a guaranteed valid fallback session.
 */
function createGuaranteedFallback(reason: string): AdaptiveSession {
  logSessionLoad('FALLBACK_CREATED', { reason })
  
  return {
    dayNumber: 1,
    dayLabel: 'Workout',
    focus: 'general',
    focusLabel: 'General Training',
    isPrimary: true,
    rationale: 'This workout was loaded with safe defaults.',
    exercises: [
      {
        id: 'fallback-1',
        name: 'Push-Ups',
        category: 'push',
        sets: 3,
        repsOrTime: '10-15 reps',
        note: 'Focus on controlled form.',
        isOverrideable: false,
        selectionReason: 'Fallback exercise',
      },
      {
        id: 'fallback-2',
        name: 'Bodyweight Squats',
        category: 'legs',
        sets: 3,
        repsOrTime: '15-20 reps',
        note: 'Full range of motion.',
        isOverrideable: false,
        selectionReason: 'Fallback exercise',
      },
      {
        id: 'fallback-3',
        name: 'Plank Hold',
        category: 'core',
        sets: 3,
        repsOrTime: '30-45 seconds',
        note: 'Maintain neutral spine.',
        isOverrideable: false,
        selectionReason: 'Fallback exercise',
      },
    ],
    warmup: [],
    cooldown: [],
    estimatedMinutes: 25,
    finisherIncluded: false,
  } as AdaptiveSession
}

// =============================================================================
// MAIN LOADER FUNCTION
// =============================================================================

/**
 * Load session from program state with GUARANTEED valid result.
 * 
 * This function NEVER returns null and NEVER throws.
 * It always returns a valid session, using fallbacks if necessary.
 */
export async function loadAuthoritativeSession(
  sessionIndex: number,
  options?: {
    isDemo?: boolean
    isFirstSession?: boolean
  }
): Promise<AuthoritativeSessionResult> {
  logSessionLoad('SESSION_LOAD_START', { sessionIndex, options })
  
  const loadedAt = new Date().toISOString()
  
  // Handle demo mode separately
  if (options?.isDemo) {
    logSessionLoad('DEMO_MODE', { sessionIndex })
    const demoSession = createGuaranteedFallback('DEMO_SESSION')
    demoSession.dayLabel = 'DEMO-Workout'
    demoSession.dayNumber = 0
    
    return {
      session: demoSession,
      meta: {
        source: 'DEMO',
        validationPassed: true,
        recovered: false,
        loadedAt,
      },
    }
  }
  
  try {
    // Dynamically import program state to avoid module-level crashes
    logSessionLoad('FETCHING_PROGRAM_STATE', {})
    const { getProgramState } = await import('@/lib/program-state')
    const programState = getProgramState()
    
    logSessionLoad('SESSION_FETCH_RESULT', {
      hasUsableProgram: programState.hasUsableWorkoutProgram,
      hasAdaptiveProgram: !!programState.adaptiveProgram,
      sessionCount: programState.adaptiveProgram?.sessions?.length ?? 0,
    })
    
    // Check if we have a usable program
    if (!programState.hasUsableWorkoutProgram || !programState.adaptiveProgram) {
      logSessionLoad('NO_PROGRAM_FALLBACK', { reason: 'no_usable_program' })
      return {
        session: createGuaranteedFallback('NO_PROGRAM'),
        meta: {
          source: 'FALLBACK',
          validationPassed: true,
          recovered: true,
          fallbackReason: 'No active program found',
          loadedAt,
        },
      }
    }
    
    const adaptiveProgram = programState.adaptiveProgram as AdaptiveProgram
    
    // Check if sessions array exists
    if (!Array.isArray(adaptiveProgram.sessions) || adaptiveProgram.sessions.length === 0) {
      logSessionLoad('EMPTY_SESSIONS_FALLBACK', { reason: 'no_sessions' })
      return {
        session: createGuaranteedFallback('EMPTY_SESSIONS'),
        meta: {
          source: 'FALLBACK',
          validationPassed: true,
          recovered: true,
          fallbackReason: 'No workout sessions in program',
          loadedAt,
        },
      }
    }
    
    // Clamp session index to valid range
    const clampedIndex = Math.max(0, Math.min(sessionIndex, adaptiveProgram.sessions.length - 1))
    const rawSession = adaptiveProgram.sessions[clampedIndex]
    
    // Log raw session diagnostic
    const diagnostic = getSessionDiagnostic(rawSession)
    logSessionLoad('RAW_SESSION_DIAGNOSTIC', {
      sessionIndex: clampedIndex,
      ...diagnostic,
    })
    
    // Check for null/undefined raw session
    if (!rawSession) {
      logSessionLoad('NULL_SESSION_FALLBACK', { sessionIndex: clampedIndex })
      return {
        session: createGuaranteedFallback('NULL_SESSION'),
        meta: {
          source: 'FALLBACK',
          validationPassed: true,
          recovered: true,
          fallbackReason: 'Session data was null',
          loadedAt,
        },
      }
    }
    
    // Normalize the session
    const normalizedSession = normalizeToAdaptiveSession(rawSession, clampedIndex)
    
    if (!normalizedSession) {
      logSessionLoad('NORMALIZATION_FAILED_FALLBACK', { sessionIndex: clampedIndex })
      return {
        session: createGuaranteedFallback('NORMALIZATION_FAILED'),
        meta: {
          source: 'RECOVERY',
          validationPassed: true,
          recovered: true,
          fallbackReason: 'Session normalization failed',
          originalExerciseCount: diagnostic.exerciseCount,
          loadedAt,
        },
      }
    }
    
    logSessionLoad('SESSION_NORMALIZED', {
      dayLabel: normalizedSession.dayLabel,
      exerciseCount: normalizedSession.exercises.length,
    })
    
    // CRITICAL: Check for empty exercises (STEP 8)
    if (!normalizedSession.exercises || normalizedSession.exercises.length === 0) {
      logSessionLoad('EMPTY_EXERCISES_PROTECTION', { sessionIndex: clampedIndex })
      return {
        session: createGuaranteedFallback('EMPTY_EXERCISES'),
        meta: {
          source: 'RECOVERY',
          validationPassed: true,
          recovered: true,
          fallbackReason: 'Session had no exercises',
          originalExerciseCount: diagnostic.exerciseCount,
          loadedAt,
        },
      }
    }
    
    // Validate the normalized session using contract validator
    const contractResult = normalizeAndValidateSession(normalizedSession)
    
    logSessionLoad('SESSION_VALIDATION_RESULT', {
      isValid: contractResult.validation.isValid,
      safeExerciseCount: contractResult.validation.safeExerciseCount,
      reasons: contractResult.validation.reasons,
    })
    
    if (!contractResult.validation.isValid) {
      logSessionLoad('VALIDATION_FAILED_FALLBACK', {
        reasons: contractResult.validation.reasons,
      })
      return {
        session: createGuaranteedFallback('VALIDATION_FAILED'),
        meta: {
          source: 'RECOVERY',
          validationPassed: false,
          recovered: true,
          fallbackReason: `Validation failed: ${contractResult.validation.reasons.join(', ')}`,
          originalExerciseCount: diagnostic.exerciseCount,
          loadedAt,
        },
      }
    }
    
    // SUCCESS - Return the valid session
    logSessionLoad('SESSION_LOAD_SUCCESS', {
      dayLabel: normalizedSession.dayLabel,
      dayNumber: normalizedSession.dayNumber,
      exerciseCount: normalizedSession.exercises.length,
      source: 'PROGRAM_STATE',
    })
    
    return {
      session: normalizedSession,
      meta: {
        source: 'PROGRAM_STATE',
        validationPassed: true,
        recovered: false,
        originalExerciseCount: diagnostic.exerciseCount,
        loadedAt,
      },
      reasoningSummary: adaptiveProgram.workoutReasoningSummary,
    }
    
  } catch (error) {
    // Catch-all error handler - NEVER throw
    logSessionLoad('FATAL_ERROR_RECOVERY', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
    })
    
    return {
      session: createGuaranteedFallback('FATAL_ERROR'),
      meta: {
        source: 'RECOVERY',
        validationPassed: true,
        recovered: true,
        fallbackReason: error instanceof Error ? error.message : 'Unknown fatal error',
        loadedAt,
      },
    }
  }
}

/**
 * Calculate the appropriate session index based on parameters.
 */
export function calculateSessionIndex(
  dayParam: string | null,
  isFirstSession: boolean,
  totalSessions: number
): number {
  if (isFirstSession || dayParam === '1') {
    return 0
  }
  
  if (dayParam) {
    const parsed = parseInt(dayParam, 10)
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(parsed - 1, totalSessions - 1))
    }
  }
  
  // Default to day of week mapping
  const today = new Date().getDay() // 0=Sunday through 6=Saturday
  const dayIndex = today === 0 ? 6 : today - 1
  return Math.min(dayIndex, totalSessions - 1)
}
