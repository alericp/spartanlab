/**
 * STEP 23.1 — MISSED-WORKOUT RECOMPOSITION ADVISORY CONTRACT
 *
 * =============================================================================
 * ADVISORY-FIRST MISSED-WORKOUT RECOMPOSITION DECISION LAYER
 * =============================================================================
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
