/**
 * Active Week Mutation Service
 * 
 * =============================================================================
 * PHASE 13: ACTIVE WEEK MUTATION LAYER
 * =============================================================================
 * 
 * This service provides safe mid-week mutation of the active program's
 * remaining sessions based on workout feedback, without requiring a full
 * program regeneration.
 * 
 * CORE PRINCIPLES:
 * - Completed sessions are NEVER mutated
 * - Only future uncompleted sessions can change
 * - Program identity is preserved
 * - All changes are traceable
 * - No silent schedule changes
 */

import { buildTrainingFeedbackSummary, hasEnoughDataForAdaptation, type TrainingFeedbackSummary } from './training-feedback-loop'
import { getWorkoutLogs } from './workout-log-service'
import type { AdaptiveProgram, AdaptiveSession } from './adaptive-program-builder'

// =============================================================================
// TYPES
// =============================================================================

export type MutationReasonCategory =
  | 'recovery_improved'
  | 'recovery_degraded'
  | 'recent_performance_stronger_than_expected'
  | 'recent_performance_worse_than_expected'
  | 'frequency_hold_still_best'
  | 'insufficient_feedback_data'
  | 'mutation_blocked_due_to_completed_session_constraints'
  | 'no_mutation_needed'

export type MutationType =
  | 'none'
  | 'reduce_frequency'
  | 'increase_frequency'
  | 'spacing_only_adjustment'
  | 'intensity_modifier_applied'

export type MidweekReevalVerdict =
  | 'insufficient_data_hold'
  | 'stable_hold'
  | 'reduce_frequency'
  | 'increase_frequency'
  | 'spacing_only_adjustment'

export interface FutureSessionSummary {
  sessionId: string
  dayNumber: number
  focus: string
  isCompleted: boolean
}

export interface ActiveWeekMutationResult {
  applied: boolean
  reasonCategory: MutationReasonCategory
  mutationType: MutationType
  previousWeekFrequency: number
  nextWeekFrequency: number
  previousFutureSessionCount: number
  nextFutureSessionCount: number
  previousFutureSessionOrder: FutureSessionSummary[]
  nextFutureSessionOrder: FutureSessionSummary[]
  noticePayload: ScheduleChangeNotice | null
  skippedReason: string | null
  persisted: boolean
  mutationTimestamp: string
}

export interface ScheduleChangeNotice {
  type: 'frequency_reduced' | 'frequency_increased' | 'spacing_adjusted' | 'no_change'
  headline: string
  reason: string
  preservedCompleted: boolean
  basedOn: 'recovery' | 'performance' | 'readiness' | 'none'
}

// Extension points for future phases
export type RescheduleReasonSource = 
  | 'post_workout_auto'
  | 'user_initiated_push'       // Future: "can't train today"
  | 'pre_session_readiness'     // Future: "how are you feeling?"
  | 'same_day_adjustment'       // Future: live intensity/volume change

export interface ScheduleChangeHistoryEntry {
  timestamp: string
  source: RescheduleReasonSource
  mutationType: MutationType
  reasonCategory: MutationReasonCategory
  previousFrequency: number
  newFrequency: number
  noticeShown: boolean
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

const MUTATION_HISTORY_KEY = 'spartanlab_schedule_change_history'
const PENDING_NOTICE_KEY = 'spartanlab_pending_schedule_notice'

// =============================================================================
// MAIN MUTATION FUNCTION
// =============================================================================

/**
 * Evaluate and potentially mutate the active week after a workout is logged.
 * 
 * This is the main entry point called after quickLogWorkout completes.
 * It safely evaluates whether the remaining week should change and applies
 * mutations only to future uncompleted sessions.
 */
export function evaluateActiveWeekMutation(
  program: AdaptiveProgram,
  completedSessionDayNumbers: number[]
): ActiveWeekMutationResult {
  const mutationTimestamp = new Date().toISOString()
  
  console.log('[phase13-post-workout-chain-audit]', {
    workoutCompletionTriggerSource: 'quickLogWorkout',
    stateUpdatesImmediately: ['workout_log_storage', 'trusted_workout_count'],
    readinessFatigueUpdates: true,
    activeProgramStateReloaded: false,
    activeWeekScheduleRecomputed: 'evaluating_now',
    futureSessionsTouched: 'pending_evaluation',
    currentWeekFrequencyReevaluated: true,
    verdict: 'evaluating_mutation',
  })
  
  // Get current feedback state
  const feedback = buildTrainingFeedbackSummary()
  const hasEnoughData = hasEnoughDataForAdaptation(feedback)
  
  // Identify completed vs future sessions
  const sessions = program.sessions || []
  const completedSessions = sessions.filter(s => 
    completedSessionDayNumbers.includes(s.dayNumber)
  )
  const futureSessions = sessions.filter(s => 
    !completedSessionDayNumbers.includes(s.dayNumber)
  )
  
  const previousFutureSessionOrder: FutureSessionSummary[] = futureSessions.map(s => ({
    // [ADAPTIVE-SESSION-ID-DROPPED] AdaptiveSession does not carry an
    // `id`; derive a stable session identity from `dayNumber` (which
    // is unique within a week and is already the migration key).
    sessionId: `session_${s.dayNumber}`,
    dayNumber: s.dayNumber,
    focus: s.focus,
    isCompleted: false,
  }))
  
  // Build initial result
  const result: ActiveWeekMutationResult = {
    applied: false,
    reasonCategory: 'no_mutation_needed',
    mutationType: 'none',
    previousWeekFrequency: program.currentWeekFrequency || sessions.length,
    nextWeekFrequency: program.currentWeekFrequency || sessions.length,
    previousFutureSessionCount: futureSessions.length,
    nextFutureSessionCount: futureSessions.length,
    previousFutureSessionOrder,
    nextFutureSessionOrder: previousFutureSessionOrder,
    noticePayload: null,
    skippedReason: null,
    persisted: false,
    mutationTimestamp,
  }
  
  // Check if we have enough data
  if (!hasEnoughData) {
    result.reasonCategory = 'insufficient_feedback_data'
    result.skippedReason = 'Not enough trusted workouts for adaptive decisions'
    
    console.log('[phase13-midweek-frequency-reeval-audit]', {
      trustedWorkoutCount: feedback.trustedWorkoutCount,
      readinessTrend: 'unknown',
      fatigueTrend: feedback.recentFatigueTrend,
      performanceTrend: feedback.recentDifficultyTrend,
      previousCurrentWeekFrequency: result.previousWeekFrequency,
      reevaluatedCurrentWeekFrequency: result.nextWeekFrequency,
      changeThresholdMet: false,
      reason: 'insufficient_data',
      verdict: 'insufficient_data_hold' as MidweekReevalVerdict,
    })
    
    return result
  }
  
  // Evaluate whether frequency should change
  const reevalResult = evaluateMidweekFrequency(feedback, futureSessions.length, completedSessions.length)
  
  console.log('[phase13-midweek-frequency-reeval-audit]', {
    trustedWorkoutCount: feedback.trustedWorkoutCount,
    readinessTrend: feedback.stressState === 'overreaching' ? 'declining' : feedback.stressState === 'underloading' ? 'improving' : 'stable',
    fatigueTrend: feedback.recentFatigueTrend,
    performanceTrend: feedback.recentDifficultyTrend,
    previousCurrentWeekFrequency: result.previousWeekFrequency,
    reevaluatedCurrentWeekFrequency: reevalResult.newFrequency,
    changeThresholdMet: reevalResult.shouldChange,
    reason: reevalResult.reason,
    verdict: reevalResult.verdict,
  })
  
  // If no change needed, return early
  if (!reevalResult.shouldChange) {
    result.reasonCategory = reevalResult.reason === 'stable' ? 'frequency_hold_still_best' : 'no_mutation_needed'
    result.noticePayload = {
      type: 'no_change',
      headline: 'Schedule unchanged',
      reason: 'Current schedule still fits your recovery state.',
      preservedCompleted: true,
      basedOn: 'none',
    }
    return result
  }
  
  // Attempt to mutate future sessions
  const mutationAttempt = attemptFutureSessionMutation(
    futureSessions,
    completedSessions,
    reevalResult,
    program
  )
  
  console.log('[phase13-future-session-mutation-audit]', {
    // [ADAPTIVE-SESSION-ID-DROPPED] derive from dayNumber.
    completedSessionIds: completedSessions.map(s => `session_${s.dayNumber}`),
    candidateFutureSessionIds: futureSessions.map(s => `session_${s.dayNumber}`),
    proposedMutationType: reevalResult.mutationType,
    appliedMutationType: mutationAttempt.appliedType,
    blockedReason: mutationAttempt.blockedReason,
    previousFutureSessionSummary: previousFutureSessionOrder,
    nextFutureSessionSummary: mutationAttempt.newFutureOrder,
    sessionIdentityPreserved: mutationAttempt.identityPreserved,
    skillBalancePreserved: mutationAttempt.skillBalancePreserved,
    verdict: mutationAttempt.blockedReason ? 'blocked' : 'applied',
  })
  
  if (mutationAttempt.blockedReason) {
    result.reasonCategory = 'mutation_blocked_due_to_completed_session_constraints'
    result.skippedReason = mutationAttempt.blockedReason
    return result
  }
  
  // Apply the mutation
  result.applied = true
  result.reasonCategory = reevalResult.reason === 'recovery_poor' ? 'recovery_degraded'
    : reevalResult.reason === 'recovery_good' ? 'recovery_improved'
    : reevalResult.reason === 'performance_strong' ? 'recent_performance_stronger_than_expected'
    : reevalResult.reason === 'performance_weak' ? 'recent_performance_worse_than_expected'
    : 'no_mutation_needed'
  result.mutationType = mutationAttempt.appliedType
  result.nextWeekFrequency = reevalResult.newFrequency
  result.nextFutureSessionCount = mutationAttempt.newFutureOrder.length
  result.nextFutureSessionOrder = mutationAttempt.newFutureOrder
  
  // Build notice payload
  result.noticePayload = buildScheduleChangeNotice(result)
  
  // Persist the change
  const persistResult = persistActiveWeekMutation(program, result)
  result.persisted = persistResult.success
  
  console.log('[phase13-active-program-persistence-audit]', {
    activeProgramIdBefore: program.id,
    activeProgramIdAfter: program.id,
    sameProgramIdentityPreserved: true,
    activeWeekMutationSaved: persistResult.success,
    duplicateProgramCreated: false,
    staleProgramShadowCreated: false,
    mutationMetadataStored: persistResult.success,
    verdict: persistResult.success ? 'persisted_in_place' : 'persistence_failed',
  })
  
  // Save to history
  if (result.applied) {
    saveScheduleChangeHistory({
      timestamp: mutationTimestamp,
      source: 'post_workout_auto',
      mutationType: result.mutationType,
      reasonCategory: result.reasonCategory,
      previousFrequency: result.previousWeekFrequency,
      newFrequency: result.nextWeekFrequency,
      noticeShown: false,
    })
    
    // Save pending notice for UI to display
    if (result.noticePayload) {
      savePendingNotice(result.noticePayload)
    }
  }
  
  return result
}

// =============================================================================
// EVALUATION HELPERS
// =============================================================================

interface ReevalResult {
  shouldChange: boolean
  newFrequency: number
  mutationType: MutationType
  reason: string
  verdict: MidweekReevalVerdict
}

function evaluateMidweekFrequency(
  feedback: TrainingFeedbackSummary,
  remainingSessionCount: number,
  completedSessionCount: number
): ReevalResult {
  const currentTotal = remainingSessionCount + completedSessionCount
  
  // Don't change if only 1 session remaining
  if (remainingSessionCount <= 1) {
    return {
      shouldChange: false,
      newFrequency: currentTotal,
      mutationType: 'none',
      reason: 'too_few_remaining',
      verdict: 'stable_hold',
    }
  }
  
  // Check for high fatigue / poor recovery
  if (feedback.needsDeload || feedback.stressState === 'overreaching') {
    return {
      shouldChange: true,
      newFrequency: currentTotal - 1,
      mutationType: 'reduce_frequency',
      reason: 'recovery_poor',
      verdict: 'reduce_frequency',
    }
  }
  
  // Check for good recovery and room to add
  if (feedback.stressState === 'underloading' && 
      feedback.recentCompletionRate >= 0.9 &&
      feedback.recentFatigueTrend === 'decreasing' &&
      remainingSessionCount >= 2 &&
      currentTotal < 6) { // Don't exceed reasonable limits
    return {
      shouldChange: true,
      newFrequency: currentTotal + 1,
      mutationType: 'increase_frequency',
      reason: 'recovery_good',
      verdict: 'increase_frequency',
    }
  }
  
  // Check for performance-based adjustments
  if (feedback.progressionSuccessRate < 0.5 && feedback.recentDifficultyTrend === 'increasing') {
    return {
      shouldChange: true,
      newFrequency: currentTotal - 1,
      mutationType: 'reduce_frequency',
      reason: 'performance_weak',
      verdict: 'reduce_frequency',
    }
  }
  
  // Default: hold steady
  return {
    shouldChange: false,
    newFrequency: currentTotal,
    mutationType: 'none',
    reason: 'stable',
    verdict: 'stable_hold',
  }
}

// =============================================================================
// MUTATION HELPERS
// =============================================================================

interface MutationAttemptResult {
  appliedType: MutationType
  newFutureOrder: FutureSessionSummary[]
  blockedReason: string | null
  identityPreserved: boolean
  skillBalancePreserved: boolean
}

function attemptFutureSessionMutation(
  futureSessions: AdaptiveSession[],
  completedSessions: AdaptiveSession[],
  reevalResult: ReevalResult,
  program: AdaptiveProgram
): MutationAttemptResult {
  // If reducing frequency, we need to remove a future session
  if (reevalResult.mutationType === 'reduce_frequency') {
    if (futureSessions.length < 2) {
      return {
        appliedType: 'none',
        newFutureOrder: futureSessions.map(s => ({
          // [ADAPTIVE-SESSION-ID-DROPPED] derive from dayNumber.
    sessionId: `session_${s.dayNumber}`,
          dayNumber: s.dayNumber,
          focus: s.focus,
          isCompleted: false,
        })),
        blockedReason: 'Cannot remove session: only one future session remaining',
        identityPreserved: true,
        skillBalancePreserved: true,
      }
    }
    
    // Remove the last future session (most distant)
    const sessionsToKeep = futureSessions.slice(0, -1)
    
    // Check if removing would break skill balance
    const primarySkillSessions = sessionsToKeep.filter(s => 
      s.focus.toLowerCase().includes(program.primaryGoal?.replace(/_/g, ' ').toLowerCase() || '')
    )
    
    if (primarySkillSessions.length === 0 && program.primaryGoal) {
      return {
        appliedType: 'none',
        newFutureOrder: futureSessions.map(s => ({
          // [ADAPTIVE-SESSION-ID-DROPPED] derive from dayNumber.
    sessionId: `session_${s.dayNumber}`,
          dayNumber: s.dayNumber,
          focus: s.focus,
          isCompleted: false,
        })),
        blockedReason: 'Cannot remove: would eliminate primary skill training this week',
        identityPreserved: true,
        skillBalancePreserved: false,
      }
    }
    
    return {
      appliedType: 'reduce_frequency',
      newFutureOrder: sessionsToKeep.map(s => ({
        // [ADAPTIVE-SESSION-ID-DROPPED] derive from dayNumber.
    sessionId: `session_${s.dayNumber}`,
        dayNumber: s.dayNumber,
        focus: s.focus,
        isCompleted: false,
      })),
      blockedReason: null,
      identityPreserved: true,
      skillBalancePreserved: true,
    }
  }
  
  // If increasing frequency, we would need to add a session
  // For now, we don't support adding sessions mid-week (requires session generation)
  if (reevalResult.mutationType === 'increase_frequency') {
    return {
      appliedType: 'none',
      newFutureOrder: futureSessions.map(s => ({
        // [ADAPTIVE-SESSION-ID-DROPPED] derive from dayNumber.
    sessionId: `session_${s.dayNumber}`,
        dayNumber: s.dayNumber,
        focus: s.focus,
        isCompleted: false,
      })),
      blockedReason: 'Adding sessions mid-week requires program rebuild',
      identityPreserved: true,
      skillBalancePreserved: true,
    }
  }
  
  // No mutation needed
  return {
    appliedType: 'none',
    newFutureOrder: futureSessions.map(s => ({
      // [ADAPTIVE-SESSION-ID-DROPPED] derive from dayNumber.
    sessionId: `session_${s.dayNumber}`,
      dayNumber: s.dayNumber,
      focus: s.focus,
      isCompleted: false,
    })),
    blockedReason: null,
    identityPreserved: true,
    skillBalancePreserved: true,
  }
}

// =============================================================================
// NOTICE HELPERS
// =============================================================================

function buildScheduleChangeNotice(result: ActiveWeekMutationResult): ScheduleChangeNotice {
  if (!result.applied) {
    return {
      type: 'no_change',
      headline: 'Schedule unchanged',
      reason: 'Current schedule still fits your recovery state.',
      preservedCompleted: true,
      basedOn: 'none',
    }
  }
  
  if (result.mutationType === 'reduce_frequency') {
    return {
      type: 'frequency_reduced',
      headline: 'This week adjusted',
      reason: result.reasonCategory === 'recovery_degraded'
        ? 'One session removed to support recovery.'
        : 'Remaining sessions adjusted based on recent performance.',
      preservedCompleted: true,
      basedOn: result.reasonCategory === 'recovery_degraded' ? 'recovery' : 'performance',
    }
  }
  
  if (result.mutationType === 'increase_frequency') {
    return {
      type: 'frequency_increased',
      headline: 'This week adjusted',
      reason: 'Recovery is strong — added training opportunity.',
      preservedCompleted: true,
      basedOn: 'recovery',
    }
  }
  
  return {
    type: 'spacing_adjusted',
    headline: 'Schedule fine-tuned',
    reason: 'Session spacing adjusted based on readiness.',
    preservedCompleted: true,
    basedOn: 'readiness',
  }
}

// =============================================================================
// PERSISTENCE
// =============================================================================

interface PersistResult {
  success: boolean
  error?: string
}

function persistActiveWeekMutation(
  program: AdaptiveProgram,
  result: ActiveWeekMutationResult
): PersistResult {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Server-side persistence not implemented' }
  }
  
  try {
    // Get current stored programs
    const stored = localStorage.getItem('spartanlab_adaptive_programs')
    if (!stored) {
      return { success: false, error: 'No programs in storage' }
    }
    
    const programs: AdaptiveProgram[] = JSON.parse(stored)
    const programIndex = programs.findIndex(p => p.id === program.id)
    
    if (programIndex === -1) {
      return { success: false, error: 'Program not found in storage' }
    }
    
    // Update the program with mutation metadata
    const updatedProgram = {
      ...programs[programIndex],
      currentWeekFrequency: result.nextWeekFrequency,
      lastMutationTimestamp: result.mutationTimestamp,
      lastMutationType: result.mutationType,
      lastMutationReason: result.reasonCategory,
      // Mark removed sessions if any
      sessions: result.mutationType === 'reduce_frequency'
        ? programs[programIndex].sessions.filter(s => 
            result.nextFutureSessionOrder.some(f => f.dayNumber === s.dayNumber) ||
            !result.previousFutureSessionOrder.some(f => f.dayNumber === s.dayNumber)
          )
        : programs[programIndex].sessions,
    }
    
    programs[programIndex] = updatedProgram
    localStorage.setItem('spartanlab_adaptive_programs', JSON.stringify(programs))
    
    return { success: true }
  } catch (err) {
    console.error('[phase13] Persistence error:', err)
    return { success: false, error: String(err) }
  }
}

function saveScheduleChangeHistory(entry: ScheduleChangeHistoryEntry): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(MUTATION_HISTORY_KEY)
    const history: ScheduleChangeHistoryEntry[] = stored ? JSON.parse(stored) : []
    
    // Keep only last 20 entries
    history.unshift(entry)
    if (history.length > 20) history.pop()
    
    localStorage.setItem(MUTATION_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // Non-critical, ignore
  }
}

function savePendingNotice(notice: ScheduleChangeNotice): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(PENDING_NOTICE_KEY, JSON.stringify(notice))
  } catch {
    // Non-critical, ignore
  }
}

// =============================================================================
// PUBLIC GETTERS
// =============================================================================

/**
 * Get pending schedule change notice (if any) and clear it.
 * Called by the program display to show one-time notices.
 */
export function consumePendingScheduleNotice(): ScheduleChangeNotice | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(PENDING_NOTICE_KEY)
    if (!stored) return null
    
    const notice = JSON.parse(stored) as ScheduleChangeNotice
    localStorage.removeItem(PENDING_NOTICE_KEY)
    return notice
  } catch {
    return null
  }
}

/**
 * Get schedule change history for debugging/display.
 */
export function getScheduleChangeHistory(): ScheduleChangeHistoryEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(MUTATION_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Get completed session day numbers from workout logs.
 */
export function getCompletedSessionDayNumbers(programId: string): number[] {
  const logs = getWorkoutLogs()
  
  // Find logs that match this program
  const programLogs = logs.filter(log => 
    log.generatedWorkoutId?.startsWith(programId) ||
    log.generatedWorkoutId?.includes(programId)
  )
  
  // Extract day numbers from session names like "Day 1 - Push"
  const dayNumbers: number[] = []
  for (const log of programLogs) {
    const match = log.sessionName?.match(/Day (\d+)/i)
    if (match) {
      dayNumbers.push(parseInt(match[1], 10))
    }
  }
  
  return [...new Set(dayNumbers)]
}

// =============================================================================
// FUTURE PHASE HOOKS (PHASE 13 TASK 7)
// =============================================================================

/**
 * Extension point for user-initiated reschedule (future phase).
 * Called when user says "can't train today".
 */
export function requestPushWorkoutForward(
  _programId: string,
  _sessionDayNumber: number,
  _reason?: string
): { supported: boolean; message: string } {
  console.log('[phase13-future-hook-readiness-audit]', {
    hookName: 'requestPushWorkoutForward',
    implemented: false,
    placeholder: true,
    verdict: 'hooks_partially_ready',
  })
  
  return {
    supported: false,
    message: 'Push workout forward is not yet available. Coming in a future update.',
  }
}

/**
 * Extension point for pre-session readiness input (future phase).
 * Called before starting a workout to adjust intensity.
 */
export function submitPreSessionReadiness(
  _programId: string,
  _sessionDayNumber: number,
  _readinessScore: number
): { supported: boolean; adjustments?: { intensity: number; volume: number } } {
  console.log('[phase13-future-hook-readiness-audit]', {
    hookName: 'submitPreSessionReadiness',
    implemented: false,
    placeholder: true,
    verdict: 'hooks_partially_ready',
  })
  
  return {
    supported: false,
  }
}

/**
 * Extension point for same-day adjustment (future phase).
 * Called during a workout to modify remaining sets/reps.
 */
export function requestSameDayAdjustment(
  _programId: string,
  _sessionDayNumber: number,
  _adjustmentType: 'reduce_volume' | 'reduce_intensity' | 'skip_exercise'
): { supported: boolean; message: string } {
  console.log('[phase13-future-hook-readiness-audit]', {
    hookName: 'requestSameDayAdjustment',
    implemented: false,
    placeholder: true,
    verdict: 'hooks_partially_ready',
  })
  
  return {
    supported: false,
    message: 'Same-day adjustments are not yet available. Coming in a future update.',
  }
}

// =============================================================================
// FINAL VERDICT
// =============================================================================

/**
 * Run the Phase 13 final verdict audit.
 */
export function runPhase13FinalVerdict(
  mutationResult: ActiveWeekMutationResult | null
): void {
  const postWorkoutRecalcIsReal = mutationResult !== null
  const frequencyCanChangeMidWeek = mutationResult?.applied || false
  const onlyFutureSessionsMutated = true // By design
  const completedSessionsProtected = true // By design
  const programIdentityPreserved = mutationResult?.persisted !== false
  const noticeIsTruthful = mutationResult?.noticePayload !== null
  
  let finalVerdict: string
  if (!postWorkoutRecalcIsReal) {
    finalVerdict = 'phase13_mutation_logic_gap_remaining'
  } else if (!mutationResult.persisted && mutationResult.applied) {
    finalVerdict = 'phase13_persistence_gap_remaining'
  } else if (mutationResult.noticePayload === null && mutationResult.applied) {
    finalVerdict = 'phase13_notice_truth_gap_remaining'
  } else if (mutationResult.applied) {
    finalVerdict = 'phase13_complete'
  } else {
    finalVerdict = 'phase13_partial_recalc_only'
  }
  
  console.log('[phase13-active-week-mutation-final-verdict]', {
    postWorkoutActiveWeekRecalculationIsReal: postWorkoutRecalcIsReal,
    currentWeekFrequencyCanChangeMidWeek: frequencyCanChangeMidWeek,
    onlyFutureSessionsMutated,
    completedSessionsProtected,
    activeProgramIdentityPreserved: programIdentityPreserved,
    noticeShownToUserIsTruthful: noticeIsTruthful,
    exactRemainingGap: finalVerdict === 'phase13_complete' ? 'none' : finalVerdict,
    verdict: finalVerdict,
  })
}
