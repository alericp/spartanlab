/**
 * Production Safety Assertion Layer
 * 
 * FINAL PHASE: Provides critical boundary checks for production readiness.
 * 
 * This module enforces:
 * - State coherence before save/render
 * - No demo/debug leakage in production paths
 * - Canonical path enforcement
 * - Controlled degradation on invalid state
 * 
 * DO NOT DRIFT: This is the canonical production safety layer.
 * All critical boundaries should use these assertions.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SafetyCheckResult {
  ok: boolean
  reason?: string
  shouldDegrade: boolean
  degradeTarget?: 'pre-program' | 'safe-default' | 'error-boundary'
}

export type SafetyContext = 
  | 'program_save'
  | 'state_render'
  | 'dashboard_render'
  | 'workout_render'
  | 'profile_read'

// =============================================================================
// PRODUCTION GUARDS
// =============================================================================

/**
 * GUARD: Ensures no demo/seed data is treated as real user data.
 * Call this before trusting any user state.
 */
export function assertNotDemoData(data: {
  userId?: string
  source?: string
  createdAt?: string
}): SafetyCheckResult {
  const suspiciousSources = ['demo', 'seed', 'mock', 'test', 'preview']
  const suspiciousUserIds = ['preview-user', 'demo-user', 'test-user', 'seed-user']
  
  // Check for demo user IDs
  if (data.userId && suspiciousUserIds.some(id => data.userId?.includes(id))) {
    console.warn('[production-safety] Demo user ID detected:', data.userId)
    return {
      ok: false,
      reason: 'demo_user_detected',
      shouldDegrade: true,
      degradeTarget: 'safe-default',
    }
  }
  
  // Check for demo sources
  if (data.source && suspiciousSources.some(s => data.source?.toLowerCase().includes(s))) {
    console.warn('[production-safety] Demo source detected:', data.source)
    return {
      ok: false,
      reason: 'demo_source_detected',
      shouldDegrade: true,
      degradeTarget: 'safe-default',
    }
  }
  
  return { ok: true, shouldDegrade: false }
}

/**
 * GUARD: Validates program state before marking usable.
 * Prevents malformed or contradictory state from reaching UI.
 */
export function assertProgramStateUsable(state: {
  hasProgram: boolean
  hasUsableWorkoutProgram: boolean
  sessionCount: number
  adaptiveProgram: unknown
}): SafetyCheckResult {
  // Contradiction: claims usable but no sessions
  if (state.hasUsableWorkoutProgram && state.sessionCount === 0) {
    console.warn('[production-safety] Contradiction: usable program but no sessions')
    return {
      ok: false,
      reason: 'usable_but_no_sessions',
      shouldDegrade: true,
      degradeTarget: 'pre-program',
    }
  }
  
  // Contradiction: claims has program but no program object
  if (state.hasProgram && !state.adaptiveProgram) {
    console.warn('[production-safety] Contradiction: hasProgram but no program object')
    return {
      ok: false,
      reason: 'has_program_but_null',
      shouldDegrade: true,
      degradeTarget: 'pre-program',
    }
  }
  
  // Valid: no program claimed and consistent
  if (!state.hasProgram && !state.hasUsableWorkoutProgram && state.sessionCount === 0) {
    return { ok: true, shouldDegrade: false }
  }
  
  // Valid: has program with sessions
  if (state.hasProgram && state.hasUsableWorkoutProgram && state.sessionCount > 0) {
    return { ok: true, shouldDegrade: false }
  }
  
  // Ambiguous state - degrade safely
  console.warn('[production-safety] Ambiguous program state, degrading')
  return {
    ok: false,
    reason: 'ambiguous_state',
    shouldDegrade: true,
    degradeTarget: 'pre-program',
  }
}

/**
 * GUARD: Validates dashboard truth-state before rendering mature widgets.
 * Prevents fake metrics from contaminating real user experience.
 */
export function assertDashboardTruthful(state: {
  stateLabel: string
  dataConfidence: string
  workoutCount: number
  isMatureTrainingState: boolean
}): SafetyCheckResult {
  // Contradiction: mature state with no workouts
  if (state.isMatureTrainingState && state.workoutCount === 0) {
    console.warn('[production-safety] Contradiction: mature state but no workouts')
    return {
      ok: false,
      reason: 'mature_but_no_workouts',
      shouldDegrade: true,
      degradeTarget: 'safe-default',
    }
  }
  
  // Contradiction: high confidence with no data
  if (state.dataConfidence === 'high' && state.workoutCount < 3) {
    console.warn('[production-safety] Contradiction: high confidence but insufficient data')
    return {
      ok: false,
      reason: 'high_confidence_insufficient_data',
      shouldDegrade: true,
      degradeTarget: 'safe-default',
    }
  }
  
  return { ok: true, shouldDegrade: false }
}

/**
 * GUARD: Validates flexible schedule semantics are preserved.
 * Prevents flexible mode from collapsing into static numeric values.
 */
export function assertFlexibleModeIntact(state: {
  scheduleMode?: 'static' | 'flexible'
  trainingDaysPerWeek?: number | 'flexible'
  currentWeekFrequency?: number
}): SafetyCheckResult {
  // If mode is flexible, trainingDaysPerWeek should be 'flexible' or a number with currentWeekFrequency
  if (state.scheduleMode === 'flexible') {
    // Check that we're not silently converting to static
    if (typeof state.trainingDaysPerWeek === 'number' && !state.currentWeekFrequency) {
      console.warn('[production-safety] Flexible mode may be flattened to static')
      // This is a warning, not a failure - allow but log
    }
    return { ok: true, shouldDegrade: false }
  }
  
  // If mode is static, should have numeric days
  if (state.scheduleMode === 'static') {
    if (typeof state.trainingDaysPerWeek !== 'number') {
      console.warn('[production-safety] Static mode without numeric days')
      return {
        ok: false,
        reason: 'static_without_numeric_days',
        shouldDegrade: false, // Not fatal, just log
      }
    }
    return { ok: true, shouldDegrade: false }
  }
  
  // No mode set - default behavior
  return { ok: true, shouldDegrade: false }
}

/**
 * GUARD: Validates exercise source before including in program.
 * Prevents non-DB exercises from contaminating output.
 */
export function assertExerciseSourceValid(exercise: {
  id?: string
  source?: string
  name?: string
}): SafetyCheckResult {
  // Must have ID
  if (!exercise.id) {
    console.warn('[production-safety] Exercise without ID:', exercise.name)
    return {
      ok: false,
      reason: 'no_exercise_id',
      shouldDegrade: false,
    }
  }
  
  // Source should be 'database' if present
  if (exercise.source && exercise.source !== 'database') {
    console.warn('[production-safety] Non-DB exercise source:', exercise.source)
    return {
      ok: false,
      reason: 'non_db_source',
      shouldDegrade: false,
    }
  }
  
  return { ok: true, shouldDegrade: false }
}

// =============================================================================
// BOUNDARY ASSERTIONS
// =============================================================================

/**
 * Run safety check at a critical boundary.
 * Returns whether to proceed or degrade.
 */
export function runBoundarySafetyCheck(
  context: SafetyContext,
  checks: SafetyCheckResult[]
): { proceed: boolean; degradeTarget?: string; reasons: string[] } {
  const failures = checks.filter(c => !c.ok)
  const shouldDegrade = checks.some(c => c.shouldDegrade)
  const reasons = failures.map(f => f.reason).filter(Boolean) as string[]
  
  if (failures.length > 0) {
    console.log(`[production-safety] ${context}: ${failures.length} check(s) failed`, reasons)
  }
  
  if (shouldDegrade) {
    const degradeTarget = checks.find(c => c.degradeTarget)?.degradeTarget
    return { proceed: false, degradeTarget, reasons }
  }
  
  return { proceed: true, reasons }
}

// =============================================================================
// CANONICAL PATH MARKERS
// =============================================================================

/**
 * Log that a canonical path is being used.
 * For traceability without spam.
 */
export function markCanonicalPathUsed(path: 
  | 'program_generation'
  | 'program_save'
  | 'program_read'
  | 'truth_state'
  | 'workout_logging'
  | 'settings_profile'
  | 'explanation_render'
  | 'qa_validation'
): void {
  console.log(`[canonical-path] ${path}`)
}

/**
 * Log a production safety event for diagnostics.
 */
export function logSafetyEvent(event: string, details?: Record<string, unknown>): void {
  console.log(`[production-safety] ${event}`, details ? JSON.stringify(details).slice(0, 100) : '')
}
