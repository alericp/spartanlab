/**
 * STEP 23.1 — MISSED-WORKOUT RECOMPOSITION ADVISORY CONTRACT
 *
 * =============================================================================
 * ADVISORY-FIRST MISSED-WORKOUT RECOMPOSITION DECISION LAYER
 * =============================================================================
 */

// [STEP 23.6A] Import real AdaptiveProgram/AdaptiveSession types for helper contract
import type { AdaptiveProgram, AdaptiveSession } from '@/lib/adaptive-program-builder'

/**
 *
 * PURPOSE
 * -------
 * Provide a single authoritative typed contract that:
 *   1) Evaluates a missed/skipped workout context using available session,
 *      schedule, fatigue, and pain signals.
 *   2) Returns a truthful recommendation explaining what should happen next:
 *      proceed normally, push workout forward, reduce intensity, protect
 *      recovery spacing, avoid stacking high-fatigue sessions, or recommend
 *      controlled regeneration/restart.
 *   3) NEVER mutates the active workout or saved program automatically.
 *   4) Requires explicit user confirmation before any schedule change.
 *
 * CRITICAL INVARIANTS
 * -------------------
 *   - This contract is ADVISORY ONLY. No program mutation ever occurs.
 *   - All recommendations require user confirmation.
 *   - canAutoApplyNow is ALWAYS false.
 *   - savedProgramMutationAllowed is ALWAYS false.
 *   - liveWorkoutMutationAllowed is ALWAYS false.
 *   - Pure function — safe on server/client/build-time.
 *   - No localStorage/sessionStorage side effects.
 *   - No React hooks.
 *
 * @step 23.1 of 23.4
 */

// =============================================================================
// TYPE DEFINITIONS — MISSED WORKOUT REASONS
// =============================================================================

/**
 * Reason for missing a workout.
 */
export type MissedWorkoutReason =
  | 'user_unavailable'
  | 'fatigue'
  | 'soreness'
  | 'pain_or_discomfort'
  | 'schedule_conflict'
  | 'travel'
  | 'unknown'

/**
 * Stress level of a session.
 */
export type MissedWorkoutSessionStress =
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'
  | 'unknown'

/**
 * Training priority of a session.
 */
export type MissedWorkoutTrainingPriority =
  | 'skill'
  | 'strength'
  | 'hypertrophy'
  | 'mobility'
  | 'recovery'
  | 'mixed'
  | 'unknown'

/**
 * Recommended action for missed workout recomposition.
 */
export type MissedWorkoutRecompositionAction =
  | 'continue_as_planned'
  | 'push_session_forward'
  | 'reduce_next_session_intensity'
  | 'protect_recovery_spacing'
  | 'recommend_regeneration'
  | 'recommend_full_rest'
  | 'insufficient_context'

/**
 * Severity of the advisory recommendation.
 */
export type MissedWorkoutAdvisorySeverity = 'info' | 'caution' | 'high'

// =============================================================================
// TYPE DEFINITIONS — INPUT CONTRACT
// =============================================================================

/**
 * Input for missed workout recomposition advisory derivation.
 * All fields are optional to handle incomplete context gracefully.
 */
export interface MissedWorkoutRecompositionInput {
  /** ID of the missed session */
  sessionId?: string
  /** Title/name of the missed session */
  sessionTitle?: string
  /** Index of the session in the program (0-based) */
  sessionIndex?: number
  /** Originally scheduled date (ISO string) */
  scheduledDate?: string
  /** Date when the workout was marked as missed (ISO string) */
  missedDate?: string
  /** User-reported reason for missing */
  reason?: MissedWorkoutReason
  /** Stress level of the missed session */
  sessionStress?: MissedWorkoutSessionStress
  /** Training priority of the missed session */
  trainingPriority?: MissedWorkoutTrainingPriority
  /** Whether the user has reported pain/discomfort */
  hasPainSignal?: boolean
  /** Whether high fatigue was detected */
  hasHighFatigueSignal?: boolean
  /** Number of remaining sessions in the program */
  upcomingSessionCount?: number
  /** Stress level of the next planned session */
  nextSessionStress?: MissedWorkoutSessionStress
  /** Days until the next planned session */
  daysUntilNextPlannedSession?: number
  /** Whether the user has a fixed schedule that cannot shift */
  isFixedSchedule?: boolean
  /** Whether the user can train tomorrow */
  userCanTrainTomorrow?: boolean
  /** ID of the current program */
  currentProgramId?: string
  /** Source of the advisory request */
  source?: 'program_page' | 'live_workout' | 'future_scheduler' | 'unknown'
}

// =============================================================================
// TYPE DEFINITIONS — OUTPUT CONTRACT
// =============================================================================

/**
 * Missed workout recomposition advisory output.
 * Advisory-only — no mutation. All flags prevent automatic changes.
 */
export interface MissedWorkoutRecompositionAdvisory {
  /** Recommended action */
  action: MissedWorkoutRecompositionAction
  /** Severity of the recommendation */
  severity: MissedWorkoutAdvisorySeverity
  /** Short title for display */
  title: string
  /** Summary description */
  summary: string
  /** Detailed reasoning for the recommendation */
  reasoning: string[]
  /** User-facing recommendation text */
  userFacingRecommendation: string
  /** Whether user confirmation is required (always true for now) */
  requiresUserConfirmation: boolean
  /** Whether automatic apply is allowed (always false in Step 23.1) */
  canAutoApplyNow: false
  /** Whether saved program mutation is allowed (always false in Step 23.1) */
  savedProgramMutationAllowed: false
  /** Whether live workout mutation is allowed (always false in Step 23.1) */
  liveWorkoutMutationAllowed: false
  /** Whether a full program regeneration is recommended */
  shouldRegenerateProgram: boolean
  /** Whether this advisory blocks continuing */
  nonBlocking: boolean
  /** Evidence supporting the recommendation */
  evidence: string[]
  /** Reasons why certain actions are blocked */
  blockedBecause?: string[]
  /** Label for the next recommended action */
  nextStepLabel?: string
}

/**
 * Display-friendly info for UI consumption.
 */
export interface MissedWorkoutAdvisoryDisplayInfo {
  badgeLabel: string
  title: string
  description: string
  severity: MissedWorkoutAdvisorySeverity
  primaryActionLabel: string
  secondaryNote: string
}

// =============================================================================
// NORMALIZER FUNCTIONS
// =============================================================================

const VALID_REASONS: MissedWorkoutReason[] = [
  'user_unavailable',
  'fatigue',
  'soreness',
  'pain_or_discomfort',
  'schedule_conflict',
  'travel',
  'unknown',
]

const VALID_STRESS_LEVELS: MissedWorkoutSessionStress[] = [
  'low',
  'moderate',
  'high',
  'very_high',
  'unknown',
]

const VALID_PRIORITIES: MissedWorkoutTrainingPriority[] = [
  'skill',
  'strength',
  'hypertrophy',
  'mobility',
  'recovery',
  'mixed',
  'unknown',
]

/**
 * Normalize a missed workout reason to a valid enum value.
 */
export function normalizeMissedWorkoutReason(value: unknown): MissedWorkoutReason {
  if (typeof value === 'string' && VALID_REASONS.includes(value as MissedWorkoutReason)) {
    return value as MissedWorkoutReason
  }
  return 'unknown'
}

/**
 * Normalize a session stress level to a valid enum value.
 */
export function normalizeSessionStress(value: unknown): MissedWorkoutSessionStress {
  if (typeof value === 'string' && VALID_STRESS_LEVELS.includes(value as MissedWorkoutSessionStress)) {
    return value as MissedWorkoutSessionStress
  }
  return 'unknown'
}

/**
 * Normalize a training priority to a valid enum value.
 */
export function normalizeTrainingPriority(value: unknown): MissedWorkoutTrainingPriority {
  if (typeof value === 'string' && VALID_PRIORITIES.includes(value as MissedWorkoutTrainingPriority)) {
    return value as MissedWorkoutTrainingPriority
  }
  return 'unknown'
}

/**
 * Format a missed workout reason for display.
 * Pure function — safe to call regardless of TypeScript narrowing.
 * Must be called BEFORE control flow narrows the reason type.
 */
export function formatMissedWorkoutReasonLabel(reason: MissedWorkoutReason): string {
  switch (reason) {
    case 'user_unavailable':
      return 'user unavailable'
    case 'fatigue':
      return 'fatigue'
    case 'soreness':
      return 'soreness'
    case 'pain_or_discomfort':
      return 'pain or discomfort'
    case 'schedule_conflict':
      return 'schedule conflict'
    case 'travel':
      return 'travel'
    case 'unknown':
      return 'unknown'
  }
}

// =============================================================================
// ADVISORY BUILDER — CORE LOGIC
// =============================================================================

/**
 * Build a missed workout recomposition advisory from input context.
 * 
 * CRITICAL: This is advisory-only. No mutations occur.
 * - canAutoApplyNow: always false
 * - savedProgramMutationAllowed: always false
 * - liveWorkoutMutationAllowed: always false
 */
export function buildMissedWorkoutRecompositionAdvisory(
  input: MissedWorkoutRecompositionInput
): MissedWorkoutRecompositionAdvisory {
  const reason = normalizeMissedWorkoutReason(input.reason)
  const sessionStress = normalizeSessionStress(input.sessionStress)
  const nextSessionStress = normalizeSessionStress(input.nextSessionStress)
  const trainingPriority = normalizeTrainingPriority(input.trainingPriority)
  
  const hasPain = input.hasPainSignal === true || reason === 'pain_or_discomfort'
  const hasHighFatigue = input.hasHighFatigueSignal === true || reason === 'fatigue'
  const hasSoreness = reason === 'soreness'
  const isScheduleConflict = reason === 'schedule_conflict' || reason === 'travel' || reason === 'user_unavailable'
  const canTrainTomorrow = input.userCanTrainTomorrow === true
  const isFixedSchedule = input.isFixedSchedule === true
  const isHighStressSession = sessionStress === 'high' || sessionStress === 'very_high'
  const isNextSessionHighStress = nextSessionStress === 'high' || nextSessionStress === 'very_high'
  const isSkillOrStrength = trainingPriority === 'skill' || trainingPriority === 'strength' || trainingPriority === 'mixed'
  
  // Check for insufficient context
  const hasMinimalContext = !!(
    input.sessionId ||
    input.sessionTitle ||
    input.sessionIndex !== undefined ||
    reason !== 'unknown'
  )
  
  const evidence: string[] = []
  const reasoning: string[] = []
  const blockedBecause: string[] = []
  
  // Always block automatic mutation in Step 23.1
  blockedBecause.push('Step 23.1 advisory-only — no automatic mutations allowed')
  blockedBecause.push('User confirmation required before any schedule change')
  
  // ==========================================================================
  // CASE 1: PAIN / DISCOMFORT — highest priority
  // ==========================================================================
  if (hasPain) {
    evidence.push('Pain or discomfort signal detected')
    if (input.reason === 'pain_or_discomfort') {
      evidence.push('User explicitly reported pain as reason for missing')
    }
    if (input.hasPainSignal) {
      evidence.push('Pain signal flag is active')
    }
    
    reasoning.push('Pain signals indicate potential injury risk')
    reasoning.push('Forcing a reschedule before addressing pain could worsen the situation')
    reasoning.push('Recovery should take priority over maintaining schedule')
    
    return {
      action: 'recommend_full_rest',
      severity: 'high',
      title: 'Rest recommended due to pain',
      summary: 'Pain was reported. SpartanLab recommends prioritizing recovery before rescheduling.',
      reasoning,
      userFacingRecommendation: 'Because pain was reported, SpartanLab should not automatically move this workout forward without review. Take the time your body needs, then reassess when you feel ready.',
      requiresUserConfirmation: true,
      canAutoApplyNow: false,
      savedProgramMutationAllowed: false,
      liveWorkoutMutationAllowed: false,
      shouldRegenerateProgram: false,
      nonBlocking: false,
      evidence,
      blockedBecause,
      nextStepLabel: 'Review when ready',
    }
  }
  
  // ==========================================================================
  // CASE 2: HIGH FATIGUE — especially before high-stress next session
  // ==========================================================================
  if (hasHighFatigue) {
    evidence.push('High fatigue signal detected')
    if (input.reason === 'fatigue') {
      evidence.push('User explicitly reported fatigue as reason for missing')
    }
    if (input.hasHighFatigueSignal) {
      evidence.push('High fatigue flag is active')
    }
    
    reasoning.push('High fatigue increases injury risk and reduces training quality')
    
    if (isNextSessionHighStress) {
      evidence.push(`Next session is ${nextSessionStress} stress`)
      reasoning.push('Stacking a high-fatigue day with a high-stress session is not advisable')
      reasoning.push('Protecting recovery spacing is more important than maintaining strict schedule')
      
      return {
        action: 'protect_recovery_spacing',
        severity: 'high',
        title: 'Protect recovery spacing',
        summary: 'High fatigue detected before a demanding session. Consider additional recovery time.',
        reasoning,
        userFacingRecommendation: 'You are fatigued and your next planned session is demanding. Do not stack this session directly before another high-stress day. Consider an extra rest day or reducing intensity.',
        requiresUserConfirmation: true,
        canAutoApplyNow: false,
        savedProgramMutationAllowed: false,
        liveWorkoutMutationAllowed: false,
        shouldRegenerateProgram: false,
        nonBlocking: false,
        evidence,
        blockedBecause,
        nextStepLabel: 'Review recovery spacing',
      }
    }
    
    // High fatigue but next session is manageable
    reasoning.push('Reducing intensity on the next session may help manage accumulated fatigue')
    
    return {
      action: 'reduce_next_session_intensity',
      severity: 'caution',
      title: 'Consider reduced intensity',
      summary: 'Fatigue detected. The next session could be performed at reduced intensity.',
      reasoning,
      userFacingRecommendation: 'Fatigue is elevated. If you train tomorrow, consider reducing the intensity or volume. This is advisory-only — your plan has not been changed.',
      requiresUserConfirmation: true,
      canAutoApplyNow: false,
      savedProgramMutationAllowed: false,
      liveWorkoutMutationAllowed: false,
      shouldRegenerateProgram: false,
      nonBlocking: true,
      evidence,
      blockedBecause,
      nextStepLabel: 'Continue with caution',
    }
  }
  
  // ==========================================================================
  // CASE 3: SORENESS — moderate caution
  // ==========================================================================
  if (hasSoreness) {
    evidence.push('Soreness reported as reason for missing')
    reasoning.push('Soreness is normal but may warrant a lighter session')
    reasoning.push('Pushing through excessive soreness can impair recovery')
    
    return {
      action: 'reduce_next_session_intensity',
      severity: 'caution',
      title: 'Soreness noted',
      summary: 'Soreness was reported. A lighter session may be appropriate when you return.',
      reasoning,
      userFacingRecommendation: 'You reported soreness. When you return to training, consider starting with reduced intensity. This is advisory-only until you confirm.',
      requiresUserConfirmation: true,
      canAutoApplyNow: false,
      savedProgramMutationAllowed: false,
      liveWorkoutMutationAllowed: false,
      shouldRegenerateProgram: false,
      nonBlocking: true,
      evidence,
      blockedBecause,
      nextStepLabel: 'Resume with care',
    }
  }
  
  // ==========================================================================
  // CASE 4: SCHEDULE CONFLICT / TRAVEL / USER UNAVAILABLE
  // ==========================================================================
  // Precompute label before narrowing (reason is still full union here)
  const scheduleConflictReasonLabel = formatMissedWorkoutReasonLabel(reason)
  if (isScheduleConflict) {
    evidence.push(`Reason: ${scheduleConflictReasonLabel}`)
    
    // Check for fixed schedule constraint
    if (isFixedSchedule) {
      evidence.push('User has a fixed schedule that cannot shift')
      reasoning.push('Fixed schedule prevents automatic workout shifting')
      reasoning.push('Manual review is needed to determine if this session can be rescheduled')
      reasoning.push('Skipping may be preferable to disrupting the entire week')
      
      return {
        action: 'continue_as_planned',
        severity: 'caution',
        title: 'Fixed schedule — review required',
        summary: 'Your schedule is fixed. SpartanLab cannot automatically shift workouts.',
        reasoning,
        userFacingRecommendation: 'Because your schedule is fixed, blindly pushing this session forward could disrupt your entire week. Review whether to skip this session or manually adjust.',
        requiresUserConfirmation: true,
        canAutoApplyNow: false,
        savedProgramMutationAllowed: false,
        liveWorkoutMutationAllowed: false,
        shouldRegenerateProgram: false,
        nonBlocking: true,
        evidence,
        blockedBecause,
        nextStepLabel: 'Manual review',
      }
    }
    
    // Can train tomorrow — simple push forward
    if (canTrainTomorrow) {
      evidence.push('User can train tomorrow')
      reasoning.push('Schedule conflict with available next-day training window')
      reasoning.push('A one-day push is probably safe if recovery spacing remains intact')
      
      // Check if pushing creates a high-stress stack
      if (isNextSessionHighStress && isHighStressSession) {
        reasoning.push('However, this would stack two high-stress sessions')
        reasoning.push('Consider whether recovery is adequate')
        
        return {
          action: 'push_session_forward',
          severity: 'caution',
          title: 'Push forward — watch spacing',
          summary: 'You can train tomorrow, but watch for high-stress stacking.',
          reasoning,
          userFacingRecommendation: 'A one-day push is probably safe, but this may create back-to-back demanding sessions. Confirm only if you feel recovered. This is advisory-only until you confirm.',
          requiresUserConfirmation: true,
          canAutoApplyNow: false,
          savedProgramMutationAllowed: false,
          liveWorkoutMutationAllowed: false,
          shouldRegenerateProgram: false,
          nonBlocking: true,
          evidence,
          blockedBecause,
          nextStepLabel: 'Confirm one-day push',
        }
      }
      
      return {
        action: 'push_session_forward',
        severity: 'info',
        title: 'Push forward one day',
        summary: 'You can train tomorrow. A simple one-day shift should work.',
        reasoning,
        userFacingRecommendation: 'A one-day push looks safe. Confirm when you are ready to reschedule. This is advisory-only until you confirm.',
        requiresUserConfirmation: true,
        canAutoApplyNow: false,
        savedProgramMutationAllowed: false,
        liveWorkoutMutationAllowed: false,
        shouldRegenerateProgram: false,
        nonBlocking: true,
        evidence,
        blockedBecause,
        nextStepLabel: 'Confirm push',
      }
    }
    
    // Cannot train tomorrow — need to evaluate further
    evidence.push('User cannot train tomorrow')
    reasoning.push('No immediate next-day training window available')
    
    if ((input.upcomingSessionCount ?? 0) <= 1) {
      reasoning.push('Few sessions remaining — consider a controlled regeneration')
      
      return {
        action: 'recommend_regeneration',
        severity: 'caution',
        title: 'Consider program adjustment',
        summary: 'With limited upcoming sessions, a program adjustment may be needed.',
        reasoning,
        userFacingRecommendation: 'You cannot train soon and few sessions remain. Consider whether a controlled regeneration or program adjustment would better serve your goals.',
        requiresUserConfirmation: true,
        canAutoApplyNow: false,
        savedProgramMutationAllowed: false,
        liveWorkoutMutationAllowed: false,
        shouldRegenerateProgram: true,
        nonBlocking: true,
        evidence,
        blockedBecause,
        nextStepLabel: 'Review options',
      }
    }
    
    reasoning.push('Multiple sessions remain — the schedule can likely absorb this')
    
    return {
      action: 'continue_as_planned',
      severity: 'info',
      title: 'Continue when available',
      summary: 'Resume your program when your schedule allows.',
      reasoning,
      userFacingRecommendation: 'Your program can likely absorb this missed session. Continue when your schedule allows. This is advisory-only.',
      requiresUserConfirmation: true,
      canAutoApplyNow: false,
      savedProgramMutationAllowed: false,
      liveWorkoutMutationAllowed: false,
      shouldRegenerateProgram: false,
      nonBlocking: true,
      evidence,
      blockedBecause,
      nextStepLabel: 'Resume when ready',
    }
  }
  
  // ==========================================================================
  // CASE 5: HIGH-STRESS SKILL/STRENGTH SESSION — special spacing consideration
  // ==========================================================================
  if (isHighStressSession && isSkillOrStrength) {
    evidence.push(`Session stress: ${sessionStress}`)
    evidence.push(`Training priority: ${trainingPriority}`)
    reasoning.push('High-stress skill/strength sessions require adequate recovery')
    reasoning.push('Stacking such sessions reduces training quality and increases injury risk')
    
    if (isNextSessionHighStress) {
      evidence.push(`Next session is also ${nextSessionStress} stress`)
      reasoning.push('Back-to-back high-stress sessions are not recommended')
      
      return {
        action: 'protect_recovery_spacing',
        severity: 'caution',
        title: 'Protect skill session spacing',
        summary: 'This high-stress session should not be stacked with another demanding day.',
        reasoning,
        userFacingRecommendation: 'Avoid stacking this session next to another high-stress day. Recovery spacing is important for skill and strength gains.',
        requiresUserConfirmation: true,
        canAutoApplyNow: false,
        savedProgramMutationAllowed: false,
        liveWorkoutMutationAllowed: false,
        shouldRegenerateProgram: false,
        nonBlocking: true,
        evidence,
        blockedBecause,
        nextStepLabel: 'Review spacing',
      }
    }
  }
  
  // ==========================================================================
  // CASE 6: INSUFFICIENT CONTEXT
  // ==========================================================================
  if (!hasMinimalContext) {
    evidence.push('No session identity or schedule context provided')
    reasoning.push('SpartanLab needs the scheduled session and next-session context before applying a safe shift')
    reasoning.push('Without context, any recommendation would be guesswork')
    
    return {
      action: 'insufficient_context',
      severity: 'info',
      title: 'More context needed',
      summary: 'SpartanLab needs more information to provide a safe recommendation.',
      reasoning,
      userFacingRecommendation: 'Provide the session details and schedule context so SpartanLab can give you a grounded recommendation.',
      requiresUserConfirmation: true,
      canAutoApplyNow: false,
      savedProgramMutationAllowed: false,
      liveWorkoutMutationAllowed: false,
      shouldRegenerateProgram: false,
      nonBlocking: true,
      evidence,
      blockedBecause,
      nextStepLabel: 'Add context',
    }
  }
  
  // ==========================================================================
  // DEFAULT: CONTINUE AS PLANNED
  // At this point, all non-unknown reason cases have returned above.
  // TypeScript correctly narrows reason to 'unknown' here.
  // ==========================================================================
  evidence.push('No critical signals detected')
  if (input.sessionTitle) evidence.push(`Session: ${input.sessionTitle}`)
  // Note: reason is 'unknown' at this point (all other cases returned above)
  
  reasoning.push('No pain, fatigue, or critical scheduling conflicts detected')
  reasoning.push('The program can likely continue as planned')
  
  return {
    action: 'continue_as_planned',
    severity: 'info',
    title: 'Continue as planned',
    summary: 'No critical issues detected. You can resume your program normally.',
    reasoning,
    userFacingRecommendation: 'Your program appears on track. Resume when you are ready. This is advisory-only.',
    requiresUserConfirmation: true,
    canAutoApplyNow: false,
    savedProgramMutationAllowed: false,
    liveWorkoutMutationAllowed: false,
    shouldRegenerateProgram: false,
    nonBlocking: true,
    evidence,
    blockedBecause,
    nextStepLabel: 'Continue',
  }
}

// =============================================================================
// DISPLAY INFO HELPER
// =============================================================================

/**
 * Get display-friendly info for UI consumption.
 * Does not build UI — provides the contract for UI components.
 */
export function getMissedWorkoutAdvisoryDisplayInfo(
  advisory: MissedWorkoutRecompositionAdvisory
): MissedWorkoutAdvisoryDisplayInfo {
  const actionLabels: Record<MissedWorkoutRecompositionAction, string> = {
    continue_as_planned: 'Continue',
    push_session_forward: 'Push Forward',
    reduce_next_session_intensity: 'Reduce Intensity',
    protect_recovery_spacing: 'Protect Spacing',
    recommend_regeneration: 'Review Options',
    recommend_full_rest: 'Rest First',
    insufficient_context: 'Add Details',
  }
  
  const badgeLabels: Record<MissedWorkoutRecompositionAction, string> = {
    continue_as_planned: 'On Track',
    push_session_forward: 'Reschedule',
    reduce_next_session_intensity: 'Adjust',
    protect_recovery_spacing: 'Recovery',
    recommend_regeneration: 'Review',
    recommend_full_rest: 'Rest',
    insufficient_context: 'Info Needed',
  }
  
  return {
    badgeLabel: badgeLabels[advisory.action],
    title: advisory.title,
    description: advisory.summary,
    severity: advisory.severity,
    primaryActionLabel: actionLabels[advisory.action],
    secondaryNote: advisory.nonBlocking 
      ? 'This is advisory-only. Your plan has not been changed.'
      : 'Review recommended before continuing.',
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if an advisory has actionable recommendations.
 */
export function hasActionableMissedWorkoutAdvisory(
  advisory: MissedWorkoutRecompositionAdvisory
): boolean {
  return (
    advisory.action !== 'continue_as_planned' &&
    advisory.action !== 'insufficient_context'
  )
}

/**
 * Check if an advisory requires immediate attention.
 */
export function isUrgentMissedWorkoutAdvisory(
  advisory: MissedWorkoutRecompositionAdvisory
): boolean {
  return advisory.severity === 'high' && !advisory.nonBlocking
}

// =============================================================================
// STEP 23.6 — PUSH SESSION FORWARD MUTATION HELPER
// =============================================================================

/**
 * Result status for push session forward operation.
 */
export type PushSessionForwardStatus = 'success' | 'blocked' | 'no_change'

/**
 * Result of a push session forward operation.
 * Pure typed output — no side effects.
 * [STEP 23.6A] Uses real AdaptiveProgram type, not pseudo-structural type.
 */
export interface PushSessionForwardResult {
  status: PushSessionForwardStatus
  /** Updated program (only on success) — real AdaptiveProgram type */
  updatedProgram?: AdaptiveProgram
  /** Title of the moved session (on success) */
  movedSessionTitle?: string
  /** Original index of the moved session (0-based) */
  fromIndex?: number
  /** New index of the moved session (0-based) */
  toIndex?: number
  /** Human-readable summary */
  visibleSummary: string
  /** Machine-readable evidence for audit */
  evidence: string[]
  /** Reason code when blocked */
  reasonCode?: string
}

/**
 * Input for push session forward operation.
 * [STEP 23.6A] Uses real AdaptiveProgram type, not pseudo-structural type.
 */
export interface PushSessionForwardInput {
  /** Current program — real AdaptiveProgram type */
  program: AdaptiveProgram
  /** Index of the missed session (0-based) */
  missedSessionIndex: number
  /** Advisory that recommended this action */
  advisory: MissedWorkoutRecompositionAdvisory
}

/**
 * Pure helper to push a missed workout session forward one position.
 * 
 * CRITICAL INVARIANTS:
 * - Pure function — no side effects, no storage, no hooks
 * - Does NOT mutate the original program object
 * - Returns a cloned program with sessions reordered
 * - Only allows push_session_forward action
 * - Preserves all session fields and content
 * - Minimal reorder: swaps missed session with next session only
 * - Re-numbers dayNumber sequentially after swap
 * 
 * @step 23.6
 */
export function pushMissedWorkoutSessionForward(
  input: PushSessionForwardInput
): PushSessionForwardResult {
  const { program, missedSessionIndex, advisory } = input
  const evidence: string[] = []
  
  // ==========================================================================
  // GUARD 1: Advisory action must be push_session_forward
  // ==========================================================================
  if (advisory.action !== 'push_session_forward') {
    evidence.push(`Advisory action is "${advisory.action}", not "push_session_forward"`)
    return {
      status: 'blocked',
      visibleSummary: 'This action is only available for push-forward recommendations.',
      evidence,
      reasonCode: 'action_mismatch',
    }
  }
  evidence.push('Advisory action is push_session_forward')
  
  // ==========================================================================
  // GUARD 2: Program must exist with sessions
  // ==========================================================================
  if (!program || !Array.isArray(program.sessions)) {
    evidence.push('Program or sessions array is missing')
    return {
      status: 'blocked',
      visibleSummary: 'No program available to modify.',
      evidence,
      reasonCode: 'program_missing',
    }
  }
  
  const sessions = program.sessions
  evidence.push(`Program has ${sessions.length} sessions`)
  
  // ==========================================================================
  // GUARD 3: Must have at least 2 sessions to swap
  // ==========================================================================
  if (sessions.length < 2) {
    evidence.push('Program has fewer than 2 sessions — cannot swap')
    return {
      status: 'blocked',
      visibleSummary: 'Your program needs at least 2 sessions to reschedule.',
      evidence,
      reasonCode: 'insufficient_sessions',
    }
  }
  
  // ==========================================================================
  // GUARD 4: Missed session index must be valid
  // ==========================================================================
  if (missedSessionIndex < 0 || missedSessionIndex >= sessions.length) {
    evidence.push(`Invalid session index: ${missedSessionIndex}`)
    return {
      status: 'blocked',
      visibleSummary: 'Could not identify the session to move.',
      evidence,
      reasonCode: 'invalid_session_index',
    }
  }
  evidence.push(`Missed session index: ${missedSessionIndex}`)
  
  // ==========================================================================
  // GUARD 5: Cannot push last session forward (no session after it)
  // ==========================================================================
  if (missedSessionIndex >= sessions.length - 1) {
    evidence.push('Missed session is already the last session — cannot push forward')
    return {
      status: 'blocked',
      visibleSummary: 'This is already the last session in your program.',
      evidence,
      reasonCode: 'already_last_session',
    }
  }
  
  // ==========================================================================
  // PERFORM SWAP: Move missed session one position forward
  // ==========================================================================
  const missedSession = sessions[missedSessionIndex]
  const nextSession = sessions[missedSessionIndex + 1]
  
  const missedSessionTitle = missedSession.dayLabel || missedSession.focusLabel || `Day ${missedSession.dayNumber}`
  const nextSessionTitle = nextSession.dayLabel || nextSession.focusLabel || `Day ${nextSession.dayNumber}`
  
  evidence.push(`Moving "${missedSessionTitle}" from position ${missedSessionIndex + 1} to ${missedSessionIndex + 2}`)
  evidence.push(`Swapping with "${nextSessionTitle}"`)
  
  // Deep clone the program to avoid mutation
  // [STEP 23.6A] Cast to AdaptiveProgram since JSON.parse returns unknown
  const updatedProgram: AdaptiveProgram = JSON.parse(JSON.stringify(program))
  const updatedSessions = updatedProgram.sessions
  
  // Swap the two sessions
  const temp = updatedSessions[missedSessionIndex]
  updatedSessions[missedSessionIndex] = updatedSessions[missedSessionIndex + 1]
  updatedSessions[missedSessionIndex + 1] = temp
  
  // Re-number dayNumber sequentially to maintain consistency
  updatedSessions.forEach((session, idx) => {
    session.dayNumber = idx + 1
  })
  evidence.push('Re-numbered dayNumber fields sequentially')
  
  // ==========================================================================
  // SUCCESS: Return updated program
  // ==========================================================================
  return {
    status: 'success',
    updatedProgram,
    movedSessionTitle: missedSessionTitle,
    fromIndex: missedSessionIndex,
    toIndex: missedSessionIndex + 1,
    visibleSummary: `Moved "${missedSessionTitle}" from Day ${missedSessionIndex + 1} to Day ${missedSessionIndex + 2}.`,
    evidence,
  }
}

// =============================================================================
// STEP 24.1 — MULTI-MISSED-WORKOUT CONTEXT ADVISORY FOUNDATION
// =============================================================================

/**
 * Confidence level for multi-missed detection.
 */
export type MultiMissedConfidence = 'none' | 'low' | 'moderate' | 'high'

/**
 * Severity level for multi-missed context.
 */
export type MultiMissedSeverity = 'none' | 'watch' | 'moderate' | 'high'

/**
 * Recommended next action based on multi-missed context.
 */
export type MultiMissedRecommendedAction =
  | 'continue_single_session_flow'
  | 'review_before_mutation'
  | 'recommend_regeneration_review'
  | 'insufficient_context'

/**
 * Source of the multi-missed context detection.
 */
export type MultiMissedSource =
  | 'program_sessions'
  | 'existing_advisory'
  | 'mixed'
  | 'insufficient_context'

/**
 * Input for multi-missed workout context advisory derivation.
 * Uses existing available context without requiring schema changes.
 */
export interface MultiMissedWorkoutContextInput {
  /** Existing single-session missed workout advisory (from Step 23) */
  existingAdvisory?: MissedWorkoutRecompositionAdvisory
  /** Total number of sessions in the program */
  totalSessionCount?: number
  /** Index of the currently identified missed session (0-based) */
  currentMissedSessionIndex?: number
  /** Known indices of missed sessions if multiple are detected (0-based) */
  missedSessionIndices?: number[]
  /** Whether this is a repeated advisory (user dismissed before and issue recurs) */
  isRepeatedAdvisory?: boolean
  /** Days since the program started */
  daysSinceProgramStart?: number
  /** Number of sessions that should have been completed by now */
  expectedCompletedSessions?: number
  /** Number of sessions actually completed */
  actualCompletedSessions?: number
}

/**
 * Multi-missed workout context advisory output.
 * Advisory-only — no mutation. All flags prevent automatic changes.
 *
 * @step 24.1
 */
export interface MultiMissedWorkoutContextAdvisory {
  /** Whether multi-missed context was detected */
  hasMultiMissedContext: boolean
  /** Number of missed sessions detected (0 if none or insufficient context) */
  missedSessionCount: number
  /** Confidence in the multi-missed detection */
  confidence: MultiMissedConfidence
  /** Severity of the multi-missed situation */
  severity: MultiMissedSeverity
  /** Short title for display */
  title: string
  /** Summary description */
  summary: string
  /** Detailed reasoning for the detection */
  reasoning: string[]
  /** Recommended next action */
  recommendedNextAction: MultiMissedRecommendedAction
  /** Whether mutation is allowed now (always false in Step 24.1) */
  mutationAllowedNow: false
  /** Source of the detection */
  source: MultiMissedSource
  /** Step identifier */
  step: '24.1'
}

/**
 * Build a multi-missed workout context advisory from available inputs.
 *
 * PURE FUNCTION — no side effects, no storage, no mutation.
 *
 * This helper detects multi-missed patterns from:
 * 1. Existing single-session advisory (Step 23) if it suggests broader issues
 * 2. Explicitly provided missed session indices
 * 3. Comparison of expected vs actual completed sessions
 * 4. Repeated advisory patterns
 *
 * Returns neutral advisory when insufficient context exists.
 *
 * @step 24.1
 */
export function buildMultiMissedWorkoutContextAdvisory(
  input: MultiMissedWorkoutContextInput
): MultiMissedWorkoutContextAdvisory {
  const {
    existingAdvisory,
    totalSessionCount,
    currentMissedSessionIndex,
    missedSessionIndices,
    isRepeatedAdvisory,
    daysSinceProgramStart,
    expectedCompletedSessions,
    actualCompletedSessions,
  } = input

  const reasoning: string[] = []
  let missedCount = 0
  let confidence: MultiMissedConfidence = 'none'
  let severity: MultiMissedSeverity = 'none'
  let source: MultiMissedSource = 'insufficient_context'

  // ==========================================================================
  // DETECTION PATH 1: Explicit missed session indices
  // ==========================================================================
  if (missedSessionIndices && missedSessionIndices.length > 1) {
    missedCount = missedSessionIndices.length
    confidence = 'high'
    source = 'program_sessions'
    reasoning.push(`${missedCount} missed sessions explicitly identified at indices: ${missedSessionIndices.join(', ')}`)
  }

  // ==========================================================================
  // DETECTION PATH 2: Expected vs actual completed sessions
  // ==========================================================================
  if (
    missedCount === 0 &&
    typeof expectedCompletedSessions === 'number' &&
    typeof actualCompletedSessions === 'number' &&
    expectedCompletedSessions > 0
  ) {
    const gap = expectedCompletedSessions - actualCompletedSessions
    if (gap > 1) {
      missedCount = gap
      confidence = 'moderate'
      source = 'program_sessions'
      reasoning.push(`Expected ${expectedCompletedSessions} completed sessions, found ${actualCompletedSessions} (gap: ${gap})`)
    }
  }

  // ==========================================================================
  // DETECTION PATH 3: Existing advisory suggests broader pattern
  // ==========================================================================
  if (missedCount <= 1 && existingAdvisory) {
    // Check if the existing advisory suggests a pattern beyond single session
    const advisorySuggestsBroaderPattern =
      existingAdvisory.action === 'recommend_regeneration' ||
      existingAdvisory.action === 'recommend_full_rest' ||
      existingAdvisory.severity === 'high'

    if (advisorySuggestsBroaderPattern && isRepeatedAdvisory) {
      // Repeated high-severity advisory suggests accumulating missed pattern
      missedCount = Math.max(missedCount, 2) // At least 2 if repeated high-severity
      confidence = confidence === 'none' ? 'low' : confidence
      source = source === 'insufficient_context' ? 'existing_advisory' : 'mixed'
      reasoning.push('Repeated high-severity advisory suggests accumulating missed workout pattern')
    } else if (advisorySuggestsBroaderPattern) {
      // Single high-severity advisory — watch but don't claim multi-missed yet
      confidence = confidence === 'none' ? 'low' : confidence
      source = source === 'insufficient_context' ? 'existing_advisory' : 'mixed'
      reasoning.push('Current advisory severity suggests potential for broader adjustment needs')
    }
  }

  // ==========================================================================
  // DETECTION PATH 4: Program progression context
  // ==========================================================================
  if (
    missedCount <= 1 &&
    typeof daysSinceProgramStart === 'number' &&
    typeof totalSessionCount === 'number' &&
    typeof currentMissedSessionIndex === 'number'
  ) {
    // If user is early in program but already hitting missed-workout scenarios,
    // this is a watch signal but not necessarily multi-missed
    const progressRatio = currentMissedSessionIndex / totalSessionCount
    const earlyProgramThreshold = 0.2 // First 20% of program

    if (progressRatio < earlyProgramThreshold && daysSinceProgramStart > 7) {
      confidence = confidence === 'none' ? 'low' : confidence
      reasoning.push('Early program stage with missed workout — monitor for pattern development')
    }
  }

  // ==========================================================================
  // SEVERITY CLASSIFICATION
  // ==========================================================================
  if (missedCount >= 3) {
    severity = 'high'
  } else if (missedCount === 2) {
    severity = 'moderate'
  } else if (missedCount === 1 && isRepeatedAdvisory) {
    severity = 'watch'
  } else if (confidence !== 'none') {
    severity = 'watch'
  }

  // ==========================================================================
  // RECOMMENDED ACTION
  // ==========================================================================
  let recommendedNextAction: MultiMissedRecommendedAction
  if (missedCount === 0 && confidence === 'none') {
    recommendedNextAction = 'insufficient_context'
  } else if (missedCount >= 3 || severity === 'high') {
    recommendedNextAction = 'recommend_regeneration_review'
  } else if (missedCount >= 2 || severity === 'moderate') {
    recommendedNextAction = 'review_before_mutation'
  } else {
    recommendedNextAction = 'continue_single_session_flow'
  }

  // ==========================================================================
  // OUTPUT GENERATION
  // ==========================================================================
  const hasMultiMissedContext = missedCount > 1 || (missedCount === 1 && severity !== 'none')

  let title: string
  let summary: string

  if (missedCount >= 3) {
    title = 'Multiple missed sessions detected'
    summary = `${missedCount} sessions appear to have been missed. Consider reviewing or regenerating your program to better match your current schedule.`
  } else if (missedCount === 2) {
    title = 'Two missed sessions detected'
    summary = 'This may need a broader adjustment than pushing one session forward. Review the plan before applying more schedule changes.'
  } else if (hasMultiMissedContext) {
    title = 'Potential schedule pattern issue'
    summary = 'Monitor your schedule — if missed workouts continue, a broader adjustment may help.'
  } else {
    title = 'Single session context'
    summary = 'No multi-missed pattern detected. Continue with single-session flow.'
  }

  return {
    hasMultiMissedContext,
    missedSessionCount: missedCount,
    confidence,
    severity,
    title,
    summary,
    reasoning: reasoning.length > 0 ? reasoning : ['No multi-missed indicators found'],
    recommendedNextAction,
    mutationAllowedNow: false,
    source,
    step: '24.1',
  }
}

// =============================================================================
// STEP 24 / V.V3 — PROTECT RECOVERY SPACING PREVIEW
// =============================================================================

/**
 * Preview model for protect_recovery_spacing advisory action.
 * Pure, read-only, no-mutation.
 * 
 * @step 24.3 (V.V3)
 */
export interface RecoverySpacingPreview {
  /** Whether this preview should be shown */
  shouldShow: boolean
  /** Preview title */
  title: string
  /** Summary of why recovery spacing matters */
  summary: string
  /** Bullet points for the preview */
  previewBullets: string[]
  /** Why recovery spacing is important in this case */
  whyThisMatters: string[]
  /** What may need to change (general guidance, not exact sessions) */
  suggestedActions: string[]
  /** Labels of affected sessions if known; empty if exact sessions unknown */
  affectedSessionLabels: string[]
  /** Reason if exact session preview is unavailable */
  unavailableReason?: string
  /** Mutation status flags — all must be false */
  canAutoApplyNow: false
  savedProgramMutationAllowed: false
  liveWorkoutMutationAllowed: false
  /** Preview-only marker */
  previewOnly: true
  /** Step identifier */
  step: '24.3'
}

/**
 * Build a preview for protect_recovery_spacing advisory action.
 * 
 * CRITICAL INVARIANTS:
 * - Pure function — no side effects, no storage, no hooks
 * - Does NOT mutate any state
 * - Derives all content from advisory truth
 * - Does NOT invent session names or dates
 * - Does NOT claim changes have been applied
 * - All mutation flags remain false
 * 
 * @step 24.3 (V.V3)
 */
export function buildRecoverySpacingPreview(
  advisory: MissedWorkoutRecompositionAdvisory
): RecoverySpacingPreview {
  // Only show for protect_recovery_spacing action
  if (advisory.action !== 'protect_recovery_spacing') {
    return {
      shouldShow: false,
      title: '',
      summary: '',
      previewBullets: [],
      whyThisMatters: [],
      suggestedActions: [],
      affectedSessionLabels: [],
      canAutoApplyNow: false,
      savedProgramMutationAllowed: false,
      liveWorkoutMutationAllowed: false,
      previewOnly: true,
      step: '24.3',
    }
  }

  // Build preview from advisory truth
  const previewBullets: string[] = []
  const whyThisMatters: string[] = []
  const suggestedActions: string[] = []

  // Extract reasoning as "why this matters"
  for (const reason of advisory.reasoning) {
    whyThisMatters.push(reason)
  }

  // Extract evidence as preview bullets
  for (const ev of advisory.evidence) {
    previewBullets.push(ev)
  }

  // Build suggested actions based on advisory content
  if (advisory.severity === 'high') {
    suggestedActions.push('Add an extra rest day before your next demanding session')
    suggestedActions.push('Avoid stacking high-stress sessions back-to-back')
  }
  suggestedActions.push('Review your weekly schedule for recovery windows')
  if (advisory.userFacingRecommendation) {
    // Extract actionable parts from recommendation
    if (advisory.userFacingRecommendation.toLowerCase().includes('intensity')) {
      suggestedActions.push('Consider reducing intensity if spacing cannot be protected')
    }
  }

  // Note: We cannot identify exact affected sessions without program context
  // V.V5 will add the saved-program mutation corridor that enables exact session identification
  const affectedSessionLabels: string[] = []
  const unavailableReason = 
    'Exact session-shift preview requires the V.V5 saved-program mutation corridor. ' +
    'This preview shows general guidance based on advisory evidence.'

  return {
    shouldShow: true,
    title: advisory.title || 'Protect Recovery Spacing',
    summary: advisory.summary || 'Recovery spacing protection is recommended based on current fatigue and session stress.',
    previewBullets,
    whyThisMatters,
    suggestedActions,
    affectedSessionLabels,
    unavailableReason,
    canAutoApplyNow: false,
    savedProgramMutationAllowed: false,
    liveWorkoutMutationAllowed: false,
    previewOnly: true,
    step: '24.3',
  }
}

// =============================================================================
// STEP 24 / V.V4 — REDUCE INTENSITY MUTATION CORRIDOR
// =============================================================================

/**
 * Provenance marker for V.V4 intensity reduction.
 * Attached to sessions that have been modified by this mutation corridor.
 * 
 * @step 24.4 (V.V4)
 */
export interface IntensityReductionProvenance {
  /** Source of the mutation */
  source: 'missed_workout_recomposition'
  /** Action that triggered this mutation */
  action: 'reduce_next_session_intensity'
  /** Step identifier */
  step: '24.V.V4'
  /** ISO timestamp when reduction was applied */
  appliedAt: string
  /** Target session index */
  targetSessionIndex: number
  /** Session title/label at time of reduction */
  targetSessionLabel: string
  /** User confirmed this mutation */
  userConfirmed: true
  /** Not a preview — actual mutation */
  previewOnly: false
  /** Advisory reasoning that led to this */
  reason: string[]
  /** Fields that were modified */
  modifiedFields: Array<{
    exerciseIndex: number
    exerciseName: string
    field: 'sets' | 'repsOrTime' | 'prescribedLoad' | 'note'
    previousValue: string | number | null
    newValue: string | number
  }>
}

/**
 * Result of reduce-intensity mutation attempt.
 * 
 * @step 24.4 (V.V4)
 */
export interface ReduceIntensityResult {
  /** Mutation status */
  status: 'success' | 'blocked' | 'no_change' | 'already_reduced'
  /** User-visible summary of what happened */
  visibleSummary: string
  /** Evidence trail for debugging */
  evidence: string[]
  /** Machine-readable reason code */
  reasonCode: string
  /** Updated program if mutation succeeded */
  updatedProgram?: import('../adaptive-program-builder').AdaptiveProgram
  /** Provenance marker if mutation succeeded */
  provenance?: IntensityReductionProvenance
}

/**
 * Input for reduce-intensity mutation.
 * 
 * @step 24.4 (V.V4)
 */
export interface ReduceIntensityInput {
  /** Current program state */
  program: import('../adaptive-program-builder').AdaptiveProgram
  /** Target session index (0-based) */
  targetSessionIndex: number
  /** Advisory that triggered this */
  advisory: MissedWorkoutRecompositionAdvisory
}

/**
 * Reduce intensity on a target session.
 * 
 * CRITICAL INVARIANTS:
 * - Pure function — no side effects, no storage, no hooks
 * - Does NOT persist anything — caller must save
 * - Only modifies intensity-safe fields (sets, repsOrTime, prescribedLoad)
 * - Preserves exercise identity, skill representation, session structure
 * - Returns new program object; does not mutate input
 * - Adds provenance marker to modified session
 * - Blocks if already reduced by V.V4 (duplicate-apply guard)
 * 
 * @step 24.4 (V.V4)
 */
export function reduceSessionIntensity(input: ReduceIntensityInput): ReduceIntensityResult {
  const { program, targetSessionIndex, advisory } = input
  
  // Validate program exists
  if (!program || !program.sessions) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      evidence: ['program is null or undefined'],
      reasonCode: 'no_program',
    }
  }
  
  // Validate target session index
  if (targetSessionIndex < 0 || targetSessionIndex >= program.sessions.length) {
    return {
      status: 'blocked',
      visibleSummary: 'Target session not found.',
      evidence: [`targetSessionIndex ${targetSessionIndex} out of range [0, ${program.sessions.length - 1}]`],
      reasonCode: 'invalid_target_index',
    }
  }
  
  const targetSession = program.sessions[targetSessionIndex]
  
  // Check for duplicate-apply guard using adaptationNotes marker
  // V.V4 provenance is stored as "[V.V4:timestamp]" prefix in adaptationNotes
  const hasV4Marker = (targetSession.adaptationNotes || []).some(
    note => note.startsWith('[V.V4:')
  )
  if (hasV4Marker) {
    return {
      status: 'already_reduced',
      visibleSummary: `Intensity was already reduced on "${targetSession.dayLabel}".`,
      evidence: [
        'Session already has V.V4 provenance marker in adaptationNotes',
        'Duplicate reduction blocked to prevent stacking',
      ],
      reasonCode: 'already_reduced',
    }
  }
  
  // Validate session has exercises to reduce
  if (!targetSession.exercises || targetSession.exercises.length === 0) {
    return {
      status: 'no_change',
      visibleSummary: 'Session has no exercises to modify.',
      evidence: ['targetSession.exercises is empty or undefined'],
      reasonCode: 'no_exercises',
    }
  }
  
  // Build modified exercises with reduced intensity
  const modifiedFields: IntensityReductionProvenance['modifiedFields'] = []
  const modifiedExercises = targetSession.exercises.map((exercise, exIdx) => {
    // Create a copy of the exercise
    const modified = { ...exercise }
    
    // Reduction strategy:
    // 1. Reduce sets by 1 (minimum 2)
    // 2. Add coaching note about intensity reduction
    
    // Reduce sets conservatively (minimum 2)
    if (modified.sets > 2) {
      const previousSets = modified.sets
      modified.sets = Math.max(2, modified.sets - 1)
      modifiedFields.push({
        exerciseIndex: exIdx,
        exerciseName: exercise.name,
        field: 'sets',
        previousValue: previousSets,
        newValue: modified.sets,
      })
    }
    
    // Add coaching note (append to existing or create new)
    const reductionNote = '[Reduced intensity — fatigue advisory]'
    if (!modified.note?.includes(reductionNote)) {
      const previousNote = modified.note ?? null
      modified.note = modified.note 
        ? `${modified.note} ${reductionNote}`
        : reductionNote
      modifiedFields.push({
        exerciseIndex: exIdx,
        exerciseName: exercise.name,
        field: 'note',
        previousValue: previousNote,
        newValue: modified.note,
      })
    }
    
    return modified
  })
  
  // If no fields were modified, return no_change
  if (modifiedFields.length === 0) {
    return {
      status: 'no_change',
      visibleSummary: 'No exercises required intensity reduction.',
      evidence: ['All exercises already at minimum intensity or already have reduction note'],
      reasonCode: 'no_reduction_needed',
    }
  }
  
  // Build provenance marker
  const provenance: IntensityReductionProvenance = {
    source: 'missed_workout_recomposition',
    action: 'reduce_next_session_intensity',
    step: '24.V.V4',
    appliedAt: new Date().toISOString(),
    targetSessionIndex,
    targetSessionLabel: targetSession.dayLabel || `Day ${targetSession.dayNumber}`,
    userConfirmed: true,
    previewOnly: false,
    reason: advisory.reasoning,
    modifiedFields,
  }
  
  // Build modified session with provenance stored in adaptationNotes
  // Note: intensityReductionProvenance is not a typed field on AdaptiveSession,
  // so we encode V.V4 provenance within adaptationNotes for duplicate-apply detection.
  const provenanceMarker = `[V.V4:${provenance.appliedAt}]`
  const modifiedSession = {
    ...targetSession,
    exercises: modifiedExercises,
    // Store provenance in adaptationNotes (typed field on AdaptiveSession)
    adaptationNotes: [
      ...(targetSession.adaptationNotes || []),
      `${provenanceMarker} Intensity reduced due to fatigue advisory (${modifiedFields.filter(f => f.field === 'sets').length} exercises had sets reduced)`,
    ],
  }
  
  // Build updated program with modified session
  const updatedSessions = program.sessions.map((s, idx) =>
    idx === targetSessionIndex ? modifiedSession : s
  )
  
  // Note: AdaptiveProgram does not have a root-level lastModified field.
  // Provenance timestamp is stored in the session's adaptationNotes instead.
  const updatedProgram: import('../adaptive-program-builder').AdaptiveProgram = {
    ...program,
    sessions: updatedSessions,
  }
  
  // Count exercises modified
  const setsReducedCount = modifiedFields.filter(f => f.field === 'sets').length
  
  return {
    status: 'success',
    visibleSummary: `Reduced intensity on "${targetSession.dayLabel}": ${setsReducedCount} exercise${setsReducedCount !== 1 ? 's' : ''} had sets reduced.`,
    evidence: [
      `Target session: ${targetSession.dayLabel} (index ${targetSessionIndex})`,
      `Exercises modified: ${modifiedFields.length}`,
      `Sets reduced: ${setsReducedCount}`,
      'Provenance marker attached',
      'No exercise identity changed',
      'No skill representation changed',
      'No schedule changed',
    ],
    reasonCode: 'intensity_reduced',
    updatedProgram,
    provenance,
  }
}

/**
 * Build preview metadata for reduce-intensity confirmation UI.
 * Shows what WOULD change before user confirms.
 * 
 * @step 24.4 (V.V4)
 */
export interface ReduceIntensityPreview {
  /** Whether this preview should be shown */
  canShow: boolean
  /** Target session label */
  targetSessionLabel: string
  /** Target session index */
  targetSessionIndex: number
  /** What will change */
  whatWillChange: string[]
  /** What will NOT change */
  whatWillNotChange: string[]
  /** Already reduced? */
  alreadyReduced: boolean
  /** Reason if cannot show */
  blockedReason?: string
}

/**
 * Build a preview of what reduce-intensity would change.
 * Does NOT mutate anything — pure preview.
 * 
 * @step 24.4 (V.V4)
 */
export function buildReduceIntensityPreview(
  program: import('../adaptive-program-builder').AdaptiveProgram | null,
  targetSessionIndex: number
): ReduceIntensityPreview {
  if (!program || !program.sessions) {
    return {
      canShow: false,
      targetSessionLabel: '',
      targetSessionIndex: -1,
      whatWillChange: [],
      whatWillNotChange: [],
      alreadyReduced: false,
      blockedReason: 'No program available.',
    }
  }
  
  if (targetSessionIndex < 0 || targetSessionIndex >= program.sessions.length) {
    return {
      canShow: false,
      targetSessionLabel: '',
      targetSessionIndex: -1,
      whatWillChange: [],
      whatWillNotChange: [],
      alreadyReduced: false,
      blockedReason: 'Target session not found.',
    }
  }
  
  const targetSession = program.sessions[targetSessionIndex]
  
  // Check if already reduced using adaptationNotes marker
  // V.V4 provenance is stored as "[V.V4:timestamp]" prefix in adaptationNotes
  const v4MarkerNote = (targetSession.adaptationNotes || []).find(
    note => note.startsWith('[V.V4:')
  )
  if (v4MarkerNote) {
    // Extract timestamp from marker: "[V.V4:2024-01-01T00:00:00.000Z]"
    const timestampMatch = v4MarkerNote.match(/\[V\.V4:([^\]]+)\]/)
    const appliedDate = timestampMatch?.[1] 
      ? new Date(timestampMatch[1]).toLocaleDateString() 
      : 'previously'
    return {
      canShow: true,
      targetSessionLabel: targetSession.dayLabel || `Day ${targetSession.dayNumber}`,
      targetSessionIndex,
      whatWillChange: [],
      whatWillNotChange: [],
      alreadyReduced: true,
      blockedReason: `Already reduced on ${appliedDate}`,
    }
  }
  
  // Count exercises that would have sets reduced
  const exercisesWithReducibleSets = (targetSession.exercises || [])
    .filter(e => e.sets > 2)
    .length
  
  const whatWillChange: string[] = []
  if (exercisesWithReducibleSets > 0) {
    whatWillChange.push(`${exercisesWithReducibleSets} exercise${exercisesWithReducibleSets !== 1 ? 's' : ''} will have sets reduced by 1`)
  }
  whatWillChange.push('A coaching note will be added to each exercise')
  whatWillChange.push('This session will be marked as intensity-reduced')
  
  const whatWillNotChange: string[] = [
    'Exercise selection stays the same',
    'Skill representation is preserved',
    'Schedule and session order unchanged',
    'Your live workout (if in progress) is not affected',
  ]
  
  return {
    canShow: true,
    targetSessionLabel: targetSession.dayLabel || `Day ${targetSession.dayNumber}`,
    targetSessionIndex,
    whatWillChange,
    whatWillNotChange,
    alreadyReduced: false,
  }
}

// =============================================================================
// STEP 24 / V.V5 — PROTECT RECOVERY SPACING MUTATION CORRIDOR
// =============================================================================

/**
 * Result of protect recovery spacing mutation attempt.
 * 
 * @step 24.5 (V.V5)
 */
export interface ProtectRecoverySpacingResult {
  /** Mutation status */
  status: 'success' | 'blocked' | 'no_change' | 'already_protected'
  /** User-visible summary of what happened */
  visibleSummary: string
  /** Evidence trail for debugging */
  evidence: string[]
  /** Machine-readable reason code */
  reasonCode: string
  /** Updated program if mutation succeeded */
  updatedProgram?: import('../adaptive-program-builder').AdaptiveProgram
  /** Sessions that were affected */
  affectedSessionIndices?: number[]
  /** Session labels that were affected */
  affectedSessionLabels?: string[]
}

/**
 * Input for protect recovery spacing mutation.
 * 
 * @step 24.5 (V.V5)
 */
export interface ProtectRecoverySpacingInput {
  /** Current program state */
  program: import('../adaptive-program-builder').AdaptiveProgram
  /** Advisory that triggered this */
  advisory: MissedWorkoutRecompositionAdvisory
  /** Target session index to protect (0-based) */
  targetSessionIndex: number
}

/**
 * Preview model for protect recovery spacing mutation.
 * Shows what WOULD change before user confirms.
 * 
 * @step 24.5 (V.V5)
 */
export interface ProtectRecoverySpacingMutationPreview {
  /** Whether this preview can be shown */
  canShow: boolean
  /** Target session label */
  targetSessionLabel: string
  /** Target session index */
  targetSessionIndex: number
  /** What will change */
  whatWillChange: string[]
  /** What will NOT change */
  whatWillNotChange: string[]
  /** Already protected? */
  alreadyProtected: boolean
  /** Reason if cannot show */
  blockedReason?: string
  /** Proposed action summary */
  proposedAction: string
}

/**
 * Build a preview of what protect-recovery-spacing would change.
 * Does NOT mutate anything — pure preview for confirmation UI.
 * 
 * @step 24.5 (V.V5)
 */
export function buildProtectRecoverySpacingMutationPreview(
  program: import('../adaptive-program-builder').AdaptiveProgram | null,
  targetSessionIndex: number,
  advisory: MissedWorkoutRecompositionAdvisory | null
): ProtectRecoverySpacingMutationPreview {
  if (!program || !program.sessions) {
    return {
      canShow: false,
      targetSessionLabel: '',
      targetSessionIndex: -1,
      whatWillChange: [],
      whatWillNotChange: [],
      alreadyProtected: false,
      blockedReason: 'No program available.',
      proposedAction: '',
    }
  }
  
  if (targetSessionIndex < 0 || targetSessionIndex >= program.sessions.length) {
    return {
      canShow: false,
      targetSessionLabel: '',
      targetSessionIndex: -1,
      whatWillChange: [],
      whatWillNotChange: [],
      alreadyProtected: false,
      blockedReason: 'Target session not found.',
      proposedAction: '',
    }
  }
  
  const targetSession = program.sessions[targetSessionIndex]
  
  // Check if already protected using adaptationNotes marker
  // V.V5 provenance is stored as "[V.V5:protect_recovery_spacing:timestamp]" prefix
  const v5MarkerNote = (targetSession.adaptationNotes || []).find(
    note => note.startsWith('[V.V5:protect_recovery_spacing:')
  )
  if (v5MarkerNote) {
    const timestampMatch = v5MarkerNote.match(/\[V\.V5:protect_recovery_spacing:([^\]]+)\]/)
    const appliedDate = timestampMatch?.[1] 
      ? new Date(timestampMatch[1]).toLocaleDateString() 
      : 'previously'
    return {
      canShow: true,
      targetSessionLabel: targetSession.dayLabel || `Day ${targetSession.dayNumber}`,
      targetSessionIndex,
      whatWillChange: [],
      whatWillNotChange: [],
      alreadyProtected: true,
      blockedReason: `Recovery spacing already protected on ${appliedDate}`,
      proposedAction: '',
    }
  }
  
  // Build preview of what will change
  const whatWillChange: string[] = [
    'A recovery spacing note will be added to this session',
    'This session will be marked as recovery-protected',
    'Your saved program will be updated',
  ]
  
  const whatWillNotChange: string[] = [
    'Exercise selection stays the same',
    'Sets, reps, and intensity are preserved',
    'Skill representation is preserved',
    'Your live workout (if in progress) is not affected',
    'Session order remains unchanged',
  ]
  
  const proposedAction = advisory?.userFacingRecommendation || 
    'Mark this session for recovery spacing protection to prevent fatigue stacking.'
  
  return {
    canShow: true,
    targetSessionLabel: targetSession.dayLabel || `Day ${targetSession.dayNumber}`,
    targetSessionIndex,
    whatWillChange,
    whatWillNotChange,
    alreadyProtected: false,
    proposedAction,
  }
}

/**
 * Protect recovery spacing on a target session.
 * 
 * CRITICAL INVARIANTS:
 * - Pure function — no side effects, no storage, no hooks
 * - Does NOT persist anything — caller must save
 * - Does NOT change exercises, sets, reps, intensity, or skill representation
 * - Only adds recovery spacing protection note/marker to adaptationNotes
 * - Returns new program object; does not mutate input
 * - Blocks if already protected (duplicate-apply guard)
 * 
 * The mutation is intentionally conservative:
 * - We do NOT reorder sessions (that would change schedule semantics)
 * - We DO mark the session as recovery-protected so the user knows it's flagged
 * - Future features could use this marker for scheduling guidance
 * 
 * @step 24.5 (V.V5)
 */
export function protectRecoverySpacing(input: ProtectRecoverySpacingInput): ProtectRecoverySpacingResult {
  const { program, targetSessionIndex, advisory } = input
  
  // Validate program exists
  if (!program || !program.sessions) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      evidence: ['program is null or undefined'],
      reasonCode: 'no_program',
    }
  }
  
  // Validate target session index
  if (targetSessionIndex < 0 || targetSessionIndex >= program.sessions.length) {
    return {
      status: 'blocked',
      visibleSummary: 'Target session not found.',
      evidence: [`targetSessionIndex ${targetSessionIndex} out of range [0, ${program.sessions.length - 1}]`],
      reasonCode: 'invalid_target_index',
    }
  }
  
  const targetSession = program.sessions[targetSessionIndex]
  
  // Check for duplicate-apply guard using adaptationNotes marker
  // V.V5 provenance is stored as "[V.V5:protect_recovery_spacing:timestamp]" prefix
  const hasV5Marker = (targetSession.adaptationNotes || []).some(
    note => note.startsWith('[V.V5:protect_recovery_spacing:')
  )
  if (hasV5Marker) {
    return {
      status: 'already_protected',
      visibleSummary: `Recovery spacing was already protected on "${targetSession.dayLabel}".`,
      evidence: [
        'Session already has V.V5 protect_recovery_spacing marker in adaptationNotes',
        'Duplicate protection blocked to prevent stacking',
      ],
      reasonCode: 'already_protected',
    }
  }
  
  // Build provenance marker
  const timestamp = new Date().toISOString()
  const provenanceMarker = `[V.V5:protect_recovery_spacing:${timestamp}]`
  
  // Build modified session with recovery spacing protection
  // Note: We do NOT change exercises, sets, reps, or intensity
  // We only add a protection marker to adaptationNotes (typed field)
  const modifiedSession = {
    ...targetSession,
    adaptationNotes: [
      ...(targetSession.adaptationNotes || []),
      `${provenanceMarker} Recovery spacing protected — ${advisory.title || 'fatigue advisory'}`,
    ],
  }
  
  // Build updated program with modified session
  const updatedSessions = program.sessions.map((s, idx) =>
    idx === targetSessionIndex ? modifiedSession : s
  )
  
  const updatedProgram: import('../adaptive-program-builder').AdaptiveProgram = {
    ...program,
    sessions: updatedSessions,
  }
  
  return {
    status: 'success',
    visibleSummary: `Recovery spacing protected on "${targetSession.dayLabel}".`,
    evidence: [
      `Target session: ${targetSession.dayLabel} (index ${targetSessionIndex})`,
      'Provenance marker added to adaptationNotes',
      'No exercise changes',
      'No sets/reps/intensity changes',
      'No skill representation changes',
      'No session order changes',
      'No live workout mutation',
    ],
    reasonCode: 'recovery_spacing_protected',
    updatedProgram,
    affectedSessionIndices: [targetSessionIndex],
    affectedSessionLabels: [targetSession.dayLabel || `Day ${targetSession.dayNumber}`],
  }
}

// =============================================================================
// STEP 24 / V.V6 — MULTI-SESSION PUSH-FORWARD MUTATION GUARDRAIL
// =============================================================================

/**
 * Result of multi-session push-forward mutation attempt.
 * 
 * V.V6 extends single-session push to handle multiple consecutive missed workouts
 * where multiple future sessions need push-forward protection markers.
 * 
 * @step 24.6 (V.V6)
 */
export interface MultiSessionPushForwardResult {
  /** Mutation status */
  status: 'success' | 'blocked' | 'no_change' | 'already_applied' | 'partial_already_applied'
  /** User-visible summary of what happened */
  visibleSummary: string
  /** Evidence trail for debugging */
  evidence: string[]
  /** Machine-readable reason code */
  reasonCode: string
  /** Updated program if mutation succeeded */
  updatedProgram?: import('../adaptive-program-builder').AdaptiveProgram
  /** Count of sessions that were marked */
  changedSessionCount: number
  /** Session labels that were affected */
  targetSessionLabels: string[]
  /** Whether mutation was applied */
  mutationApplied: boolean
  /** Whether live workout mutation is allowed — always false */
  liveWorkoutMutationAllowed: false
  /** Whether saved program mutation is allowed */
  savedProgramMutationAllowed: boolean
}

/**
 * Input for multi-session push-forward mutation.
 * 
 * @step 24.6 (V.V6)
 */
export interface MultiSessionPushForwardInput {
  /** Current program state */
  program: import('../adaptive-program-builder').AdaptiveProgram
  /** Advisory that triggered this */
  advisory: MissedWorkoutRecompositionAdvisory
  /** Target session indices to mark for push-forward (0-based) */
  targetSessionIndices: number[]
}

/**
 * Preview model for multi-session push-forward mutation.
 * Shows what WOULD change before user confirms.
 * 
 * @step 24.6 (V.V6)
 */
export interface MultiSessionPushForwardMutationPreview {
  /** Whether this preview can be shown */
  canShow: boolean
  /** Title for the preview */
  title: string
  /** Summary text */
  summary: string
  /** Why this matters */
  whyThisMatters: string[]
  /** Target sessions */
  targetSessions: Array<{
    index: number
    label: string
    alreadyMarked: boolean
  }>
  /** What will change */
  whatWillChange: string[]
  /** What will NOT change */
  whatWillNotChange: string[]
  /** Safety notes */
  safetyNotes: string[]
  /** Reason if cannot show */
  unavailableReason?: string
  /** Whether user can confirm this action */
  canConfirm: boolean
  /** Step marker */
  step: '24.6'
}

/**
 * Build a preview of what multi-session push-forward would change.
 * Does NOT mutate anything — pure preview for confirmation UI.
 * 
 * Conservative approach: V.V6 adds typed adaptationNotes markers to future sessions
 * to indicate they are affected by push-forward spacing. This preserves session
 * identity and order while providing visible recovery spacing guidance.
 * 
 * @step 24.6 (V.V6)
 */
export function buildMultiSessionPushForwardMutationPreview(
  program: import('../adaptive-program-builder').AdaptiveProgram | null,
  advisory: MissedWorkoutRecompositionAdvisory | null
): MultiSessionPushForwardMutationPreview {
  const emptyPreview: MultiSessionPushForwardMutationPreview = {
    canShow: false,
    title: 'Multi-Session Push Forward',
    summary: '',
    whyThisMatters: [],
    targetSessions: [],
    whatWillChange: [],
    whatWillNotChange: [],
    safetyNotes: [],
    unavailableReason: 'No program or advisory available.',
    canConfirm: false,
    step: '24.6',
  }
  
  if (!program || !program.sessions || !advisory) {
    return emptyPreview
  }
  
  // V.V6 is for multi-session scenarios — need at least 2 future sessions
  const futureSessionIndices: number[] = []
  for (let i = 0; i < program.sessions.length; i++) {
    const session = program.sessions[i]
    // Consider a session "future" if it's incomplete (no completedAt or similar marker)
    // For conservative safety, we target all sessions after index 0
    if (i > 0) {
      futureSessionIndices.push(i)
    }
  }
  
  if (futureSessionIndices.length < 2) {
    return {
      ...emptyPreview,
      unavailableReason: 'Multi-session push-forward requires at least 2 future sessions. Use single-session push for fewer targets.',
      canShow: true,
      canConfirm: false,
    }
  }
  
  // Limit to first 3 future sessions to keep mutation bounded
  const targetIndices = futureSessionIndices.slice(0, 3)
  
  // Check existing markers
  const targetSessions = targetIndices.map(idx => {
    const session = program.sessions[idx]
    const alreadyMarked = (session.adaptationNotes || []).some(
      note => note.startsWith('[V.V6:multi_session_push_forward:')
    )
    return {
      index: idx,
      label: session.dayLabel || `Day ${session.dayNumber}`,
      alreadyMarked,
    }
  })
  
  const allMarked = targetSessions.every(t => t.alreadyMarked)
  
  if (allMarked) {
    return {
      canShow: true,
      title: 'Multi-Session Push Forward',
      summary: 'All target sessions already have push-forward protection.',
      whyThisMatters: [],
      targetSessions,
      whatWillChange: [],
      whatWillNotChange: [],
      safetyNotes: [],
      unavailableReason: 'All target sessions are already marked.',
      canConfirm: false,
      step: '24.6',
    }
  }
  
  const unmarkedCount = targetSessions.filter(t => !t.alreadyMarked).length
  
  return {
    canShow: true,
    title: 'Multi-Session Push Forward',
    summary: `Mark ${unmarkedCount} future session${unmarkedCount > 1 ? 's' : ''} for recovery spacing protection after multiple missed workouts.`,
    whyThisMatters: [
      'Multiple missed workouts can create accumulated recovery debt',
      'Push-forward markers help track which sessions need spacing awareness',
      'This allows conservative scheduling without losing your training structure',
    ],
    targetSessions,
    whatWillChange: [
      `${unmarkedCount} session${unmarkedCount > 1 ? 's' : ''} will receive a push-forward recovery marker`,
      'Your saved program will be updated',
      'Markers are visible in session notes for transparency',
    ],
    whatWillNotChange: [
      'Exercise selection stays the same',
      'Sets, reps, and intensity are preserved',
      'Skill representation is preserved',
      'Session order remains unchanged',
      'Your live workout (if in progress) is not affected',
      'Completed workout history is not changed',
    ],
    safetyNotes: [
      'This is a conservative approach that marks sessions for awareness without reordering',
      'You can proceed with training at your own pace using these markers as guidance',
      'The markers help SpartanLab track recovery spacing context for future adaptations',
    ],
    canConfirm: true,
    step: '24.6',
  }
}

/**
 * Apply multi-session push-forward markers to target sessions.
 * 
 * CRITICAL INVARIANTS:
 * - Pure function — no side effects, no storage, no hooks
 * - Does NOT persist anything — caller must save
 * - Does NOT change exercises, sets, reps, intensity, or skill representation
 * - Does NOT reorder sessions (conservative approach)
 * - Only adds push-forward marker to adaptationNotes (typed field)
 * - Returns new program object; does not mutate input
 * - Blocks if all targets already marked (duplicate-apply guard)
 * 
 * @step 24.6 (V.V6)
 */
export function pushForwardMultiSessionSchedule(
  input: MultiSessionPushForwardInput
): MultiSessionPushForwardResult {
  const { program, advisory, targetSessionIndices } = input
  
  // Validate program exists
  if (!program || !program.sessions) {
    return {
      status: 'blocked',
      visibleSummary: 'No program available.',
      evidence: ['program is null or undefined'],
      reasonCode: 'no_program',
      changedSessionCount: 0,
      targetSessionLabels: [],
      mutationApplied: false,
      liveWorkoutMutationAllowed: false,
      savedProgramMutationAllowed: false,
    }
  }
  
  // Validate we have at least 2 targets (this is multi-session, not single)
  if (targetSessionIndices.length < 2) {
    return {
      status: 'blocked',
      visibleSummary: 'Multi-session push-forward requires at least 2 target sessions.',
      evidence: [`Only ${targetSessionIndices.length} target(s) provided`],
      reasonCode: 'insufficient_targets',
      changedSessionCount: 0,
      targetSessionLabels: [],
      mutationApplied: false,
      liveWorkoutMutationAllowed: false,
      savedProgramMutationAllowed: false,
    }
  }
  
  // Validate all indices are in range
  const validIndices = targetSessionIndices.filter(
    idx => idx >= 0 && idx < program.sessions.length
  )
  if (validIndices.length !== targetSessionIndices.length) {
    return {
      status: 'blocked',
      visibleSummary: 'Some target session indices are invalid.',
      evidence: [`Requested: ${targetSessionIndices.join(', ')}, Valid range: 0-${program.sessions.length - 1}`],
      reasonCode: 'invalid_indices',
      changedSessionCount: 0,
      targetSessionLabels: [],
      mutationApplied: false,
      liveWorkoutMutationAllowed: false,
      savedProgramMutationAllowed: false,
    }
  }
  
  // Check which sessions already have V.V6 markers
  const markerStatus = validIndices.map(idx => {
    const session = program.sessions[idx]
    const hasMarker = (session.adaptationNotes || []).some(
      note => note.startsWith('[V.V6:multi_session_push_forward:')
    )
    return { idx, hasMarker, label: session.dayLabel || `Day ${session.dayNumber}` }
  })
  
  const alreadyMarked = markerStatus.filter(s => s.hasMarker)
  const needsMarking = markerStatus.filter(s => !s.hasMarker)
  
  // All already marked — duplicate apply
  if (needsMarking.length === 0) {
    return {
      status: 'already_applied',
      visibleSummary: `All ${alreadyMarked.length} target sessions already have push-forward protection.`,
      evidence: alreadyMarked.map(s => `Session "${s.label}" already has V.V6 marker`),
      reasonCode: 'all_already_marked',
      changedSessionCount: 0,
      targetSessionLabels: alreadyMarked.map(s => s.label),
      mutationApplied: false,
      liveWorkoutMutationAllowed: false,
      savedProgramMutationAllowed: true,
    }
  }
  
  // Build provenance marker
  const timestamp = new Date().toISOString()
  const provenanceMarker = `[V.V6:multi_session_push_forward:${timestamp}]`
  
  // Build updated sessions
  const updatedSessions = program.sessions.map((session, idx) => {
    const shouldMark = needsMarking.some(s => s.idx === idx)
    if (!shouldMark) return session
    
    return {
      ...session,
      adaptationNotes: [
        ...(session.adaptationNotes || []),
        `${provenanceMarker} Push-forward recovery spacing marked — ${advisory.title || 'missed workout recovery'}. Exercise identity, skill representation, and completed history preserved.`,
      ],
    }
  })
  
  const updatedProgram: import('../adaptive-program-builder').AdaptiveProgram = {
    ...program,
    sessions: updatedSessions,
  }
  
  const evidence = [
    `Marked ${needsMarking.length} session(s) for push-forward recovery`,
    ...needsMarking.map(s => `Target session: ${s.label} (index ${s.idx})`),
    'Provenance marker added to adaptationNotes',
    'No exercise changes',
    'No sets/reps/intensity changes',
    'No skill representation changes',
    'No session reordering (conservative approach)',
    'No live workout mutation',
  ]
  
  if (alreadyMarked.length > 0) {
    evidence.push(`${alreadyMarked.length} session(s) were already marked and skipped`)
  }
  
  return {
    status: needsMarking.length < validIndices.length ? 'partial_already_applied' : 'success',
    visibleSummary: `Push-forward recovery protection applied to ${needsMarking.length} session${needsMarking.length > 1 ? 's' : ''}.`,
    evidence,
    reasonCode: needsMarking.length < validIndices.length ? 'partial_success' : 'multi_session_push_forward_applied',
    updatedProgram,
    changedSessionCount: needsMarking.length,
    targetSessionLabels: needsMarking.map(s => s.label),
    mutationApplied: true,
    liveWorkoutMutationAllowed: false,
    savedProgramMutationAllowed: true,
  }
}
