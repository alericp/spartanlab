/**
 * FUTURE SESSION MUTATION APPLY CONTRACT — MASTER-8B.7.1
 *
 * =============================================================================
 * USER-CONFIRMED MUTATION PLAN APPLY CORRIDOR
 * =============================================================================
 *
 * This module defines typed contracts for the first user-confirmed mutation
 * apply corridor. In MASTER-8B.7.1, this corridor:
 *
 * - Allows users to preview and confirm a Future Candidate mutation plan
 * - Saves a marker-only artifact (no structural workout changes)
 * - Shows visible proof on Program Cards when a plan is confirmed
 * - Protects completed sessions absolutely
 * - Does NOT change exercise lists, sets, reps, RPE, methods, etc.
 * - Does NOT modify Start Workout payload
 * - Does NOT modify Live Workout runtime
 *
 * CRITICAL GUARANTEES:
 *   - Pure TypeScript, side-effect free contracts
 *   - Storage helpers are isolated and clearly scoped
 *   - No structural workout mutation in this gate
 *   - User confirmation required before any save
 *   - Completed sessions never touched
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.7.1 Apply Gate
 */

// =============================================================================
// PLAN STATUS
// =============================================================================

/**
 * Status of a confirmed mutation plan.
 */
export type ConfirmedMutationPlanStatus =
  | 'confirmed_marker_only'
  | 'queued_target_unresolved'
  | 'blocked_completed_session'
  | 'blocked_missing_target'
  | 'blocked_needs_full_db'
  | 'failed_to_save'

// =============================================================================
// STRUCTURAL ELIGIBILITY STATUS — MASTER-8B.7.2
// =============================================================================

/**
 * Structural mutation eligibility status.
 * Determines whether a confirmed plan can proceed to actual workout changes.
 *
 * IMPORTANT: In MASTER-8B.7.2, no plan can actually apply structural mutation.
 * This gate determines eligibility/readiness, not execution.
 */
export type FutureSessionMutationEligibilityStatus =
  | 'eligible_marker_only'
  | 'eligible_for_bounded_structural_preview'
  | 'blocked_needs_full_db'
  | 'blocked_target_unresolved'
  | 'blocked_completed_session'
  | 'blocked_no_confirmed_plan'
  | 'blocked_invalid_plan'
  | 'blocked_structural_writer_not_enabled'

/**
 * Next required gate for a plan to proceed.
 */
export type FutureSessionMutationNextGate =
  | 'MASTER_8B_7_2_TARGET_RESOLUTION'
  | 'MASTER_8C_FULL_EXERCISE_DB'
  | 'MASTER_8B_7_3_STRUCTURAL_PREVIEW'
  | 'MASTER_8B_8_LIVE_BRIDGE'

/**
 * Eligibility result for structural mutation.
 *
 * CRITICAL: canApplyStructuralMutation is ALWAYS false in MASTER-8B.7.2.
 * This gate determines eligibility/readiness, not execution.
 */
export interface FutureSessionMutationEligibilityResult {
  readonly sourceCandidateId: string
  readonly status: FutureSessionMutationEligibilityStatus
  readonly canShowProgramCardMarker: boolean
  readonly canPreviewStructuralMutation: boolean
  /** ALWAYS false in MASTER-8B.7.2 - structural writer not yet enabled */
  readonly canApplyStructuralMutation: false
  readonly targetResolved: boolean
  readonly targetDayNumbers: readonly number[]
  readonly blockedReasons: readonly string[]
  readonly safetyGuarantees: readonly string[]
  readonly userFacingSummary: string
  readonly nextRequiredGate: FutureSessionMutationNextGate
}

// =============================================================================
// APPLY MODE
// =============================================================================

/**
 * Apply mode for the mutation writer.
 */
export type FutureSessionMutationApplyMode =
  | 'marker_only'
  | 'structural_pending'
  | 'disabled'

// =============================================================================
// CONFIRMED PLAN
// =============================================================================

/**
 * A user-confirmed future session mutation plan.
 * In MASTER-8B.7.1, this is a marker-only artifact.
 */
export interface ConfirmedFutureSessionMutationPlan {
  /** Unique ID for this confirmed plan */
  readonly id: string
  /** Source step identifier */
  readonly sourceStep: 'MASTER_8B_7_1'
  /** Source candidate ID */
  readonly sourceCandidateId: string
  /** Source candidate headline */
  readonly sourceCandidateHeadline: string
  /** Action type from the candidate */
  readonly actionType: string
  /** Problem that was detected */
  readonly problemDetected: string
  /** Proposed future action */
  readonly proposedFutureAction: string
  /** Target scope description */
  readonly targetScope: 'future_uncompleted_sessions_only'
  /** Target day numbers (if resolved) */
  readonly targetDayNumbers: readonly number[]
  /** Whether target days are resolved */
  readonly targetResolved: boolean
  
  // Safety guarantees
  /** Completed sessions are protected */
  readonly completedSessionsProtected: true
  /** Only future sessions are targeted */
  readonly futureSessionsOnly: true
  /** No structural workout mutation applied */
  readonly structuralWorkoutMutationApplied: false
  /** Program Card marker applied */
  readonly programCardMarkerApplied: boolean
  /** Live Workout bridge not applied */
  readonly liveWorkoutBridgeApplied: false
  /** User confirmation required */
  readonly requiresUserConfirmation: true
  /** User has confirmed */
  readonly userConfirmed: true
  /** Timestamp when confirmed */
  readonly confirmedAt: string
  /** Plan status */
  readonly status: ConfirmedMutationPlanStatus
  /** Honest user-facing label */
  readonly honestUserLabel: string
  /** Next gate after this */
  readonly nextGate: 'MASTER_8B_7_2' | 'MASTER_8B_8'
}

// =============================================================================
// PLAN BUNDLE
// =============================================================================

/**
 * Bundle of all confirmed mutation plans for a program.
 */
export interface FutureSessionMutationPlanBundle {
  /** Program identifier (if available) */
  readonly programId?: string
  /** Source step */
  readonly sourceStep: 'MASTER_8B_7_1'
  /** All confirmed plans */
  readonly confirmedPlans: readonly ConfirmedFutureSessionMutationPlan[]
  /** Total count */
  readonly totalConfirmed: number
  /** Plans by target day */
  readonly plansByTargetDay: Record<number, ConfirmedFutureSessionMutationPlan | undefined>
  /** Any plan exists */
  readonly hasConfirmedPlans: boolean
  /** Global status summary */
  readonly statusSummary: string
}

// =============================================================================
// STORAGE KEY
// =============================================================================

/** localStorage key for mutation plans */
export const MUTATION_PLANS_STORAGE_KEY = 'spartanlab_future_session_mutation_plans_v1'

// =============================================================================
// CREATE CONFIRMED PLAN
// =============================================================================

/**
 * Create a confirmed mutation plan from a candidate selection.
 */
export function createConfirmedPlan(
  candidateId: string,
  candidateHeadline: string,
  actionType: string,
  problemDetected: string,
  proposedFutureAction: string,
  targetDayNumbers: readonly number[],
  targetResolved: boolean,
  requiresFullDb: boolean
): ConfirmedFutureSessionMutationPlan {
  // Determine status
  let status: ConfirmedMutationPlanStatus = 'confirmed_marker_only'
  let honestLabel = 'Mutation plan confirmed — marker only'
  
  if (requiresFullDb) {
    status = 'blocked_needs_full_db'
    honestLabel = 'Plan queued — needs full exercise DB'
  } else if (!targetResolved || targetDayNumbers.length === 0) {
    status = 'queued_target_unresolved'
    honestLabel = 'Plan queued — target session not resolved'
  }
  
  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceStep: 'MASTER_8B_7_1',
    sourceCandidateId: candidateId,
    sourceCandidateHeadline: candidateHeadline,
    actionType,
    problemDetected,
    proposedFutureAction,
    targetScope: 'future_uncompleted_sessions_only',
    targetDayNumbers,
    targetResolved,
    completedSessionsProtected: true,
    futureSessionsOnly: true,
    structuralWorkoutMutationApplied: false,
    programCardMarkerApplied: status === 'confirmed_marker_only' && targetResolved,
    liveWorkoutBridgeApplied: false,
    requiresUserConfirmation: true,
    userConfirmed: true,
    confirmedAt: new Date().toISOString(),
    status,
    honestUserLabel: honestLabel,
    nextGate: 'MASTER_8B_7_2',
  }
}

// =============================================================================
// STORAGE HELPERS
// =============================================================================

/**
 * Load mutation plans from localStorage.
 * Returns empty bundle if not found or invalid.
 */
export function loadMutationPlans(programId?: string): FutureSessionMutationPlanBundle {
  if (typeof window === 'undefined') {
    return createEmptyBundle(programId)
  }
  
  try {
    const raw = localStorage.getItem(MUTATION_PLANS_STORAGE_KEY)
    if (!raw) {
      return createEmptyBundle(programId)
    }
    
    const parsed = JSON.parse(raw) as FutureSessionMutationPlanBundle
    
    // Validate structure
    if (!parsed.confirmedPlans || !Array.isArray(parsed.confirmedPlans)) {
      return createEmptyBundle(programId)
    }
    
    // If programId is provided, filter to matching plans only
    if (programId && parsed.programId !== programId) {
      return createEmptyBundle(programId)
    }
    
    return parsed
  } catch {
    return createEmptyBundle(programId)
  }
}

/**
 * Save mutation plans to localStorage.
 * Returns true if successful, false otherwise.
 */
export function saveMutationPlans(bundle: FutureSessionMutationPlanBundle): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    localStorage.setItem(MUTATION_PLANS_STORAGE_KEY, JSON.stringify(bundle))
    return true
  } catch {
    return false
  }
}

/**
 * Add a confirmed plan to the bundle and save.
 */
export function addConfirmedPlan(
  plan: ConfirmedFutureSessionMutationPlan,
  programId?: string
): { success: boolean; bundle: FutureSessionMutationPlanBundle } {
  const existing = loadMutationPlans(programId)
  
  // Check if this candidate already has a confirmed plan
  const existingPlanIndex = existing.confirmedPlans.findIndex(
    p => p.sourceCandidateId === plan.sourceCandidateId
  )
  
  let updatedPlans: ConfirmedFutureSessionMutationPlan[]
  if (existingPlanIndex >= 0) {
    // Replace existing plan for this candidate
    updatedPlans = [...existing.confirmedPlans]
    updatedPlans[existingPlanIndex] = plan
  } else {
    // Add new plan
    updatedPlans = [...existing.confirmedPlans, plan]
  }
  
  // Build plans by target day
  const plansByTargetDay: Record<number, ConfirmedFutureSessionMutationPlan | undefined> = {}
  for (const p of updatedPlans) {
    if (p.targetResolved && p.targetDayNumbers.length > 0) {
      for (const day of p.targetDayNumbers) {
        plansByTargetDay[day] = p
      }
    }
  }
  
  const bundle: FutureSessionMutationPlanBundle = {
    programId,
    sourceStep: 'MASTER_8B_7_1',
    confirmedPlans: updatedPlans,
    totalConfirmed: updatedPlans.length,
    plansByTargetDay,
    hasConfirmedPlans: updatedPlans.length > 0,
    statusSummary: updatedPlans.length === 1
      ? '1 mutation plan confirmed (marker only)'
      : `${updatedPlans.length} mutation plans confirmed (marker only)`,
  }
  
  const success = saveMutationPlans(bundle)
  return { success, bundle }
}

/**
 * Create an empty bundle.
 */
export function createEmptyBundle(programId?: string): FutureSessionMutationPlanBundle {
  return {
    programId,
    sourceStep: 'MASTER_8B_7_1',
    confirmedPlans: [],
    totalConfirmed: 0,
    plansByTargetDay: {},
    hasConfirmedPlans: false,
    statusSummary: 'No mutation plans confirmed',
  }
}

/**
 * Clear all mutation plans.
 */
export function clearMutationPlans(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(MUTATION_PLANS_STORAGE_KEY)
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// STRUCTURAL ELIGIBILITY RESOLVER — MASTER-8B.7.2
// =============================================================================

/**
 * Options for eligibility resolution.
 */
export interface EligibilityResolverOptions {
  /** Whether full exercise DB coverage is complete (MASTER-8C) */
  readonly knownExerciseCoverageComplete?: boolean
  /** Whether structural writer is enabled (always false in 8B.7.2) */
  readonly structuralWriterEnabled?: boolean
}

/**
 * Resolve structural mutation eligibility for a confirmed plan.
 *
 * MASTER-8B.7.2 GATE BEHAVIOR:
 * - canApplyStructuralMutation is ALWAYS false
 * - This determines eligibility/readiness, not execution
 * - Actual structural mutation requires future gates (8B.7.3+)
 *
 * @param plan - The confirmed plan to check, or null/undefined
 * @param options - Resolver options
 * @returns Eligibility result with detailed status
 */
export function resolveFutureSessionMutationEligibility(
  plan: ConfirmedFutureSessionMutationPlan | null | undefined,
  options?: EligibilityResolverOptions
): FutureSessionMutationEligibilityResult {
  const knownExerciseCoverageComplete = options?.knownExerciseCoverageComplete ?? false
  const structuralWriterEnabled = options?.structuralWriterEnabled ?? false
  
  // Safety guarantees that always apply
  const safetyGuarantees: string[] = [
    'Completed sessions protected',
    'Future sessions only',
    'User confirmation required',
  ]
  
  // No confirmed plan
  if (!plan) {
    return {
      sourceCandidateId: 'none',
      status: 'blocked_no_confirmed_plan',
      canShowProgramCardMarker: false,
      canPreviewStructuralMutation: false,
      canApplyStructuralMutation: false,
      targetResolved: false,
      targetDayNumbers: [],
      blockedReasons: ['No confirmed plan exists'],
      safetyGuarantees,
      userFacingSummary: 'No mutation plan confirmed yet',
      nextRequiredGate: 'MASTER_8B_7_2_TARGET_RESOLUTION',
    }
  }
  
  const blockedReasons: string[] = []
  
  // Check for full DB requirement
  const needsFullDb = plan.status === 'blocked_needs_full_db' || !knownExerciseCoverageComplete
  if (needsFullDb) {
    blockedReasons.push('Full exercise DB required (MASTER-8C)')
  }
  
  // Check for target resolution
  const targetUnresolved = !plan.targetResolved || plan.targetDayNumbers.length === 0
  if (targetUnresolved) {
    blockedReasons.push('Target future session not resolved')
  }
  
  // Check for structural writer (always disabled in 8B.7.2)
  if (!structuralWriterEnabled) {
    blockedReasons.push('Structural writer not enabled (MASTER-8B.7.3+)')
  }
  
  // Determine status
  let status: FutureSessionMutationEligibilityStatus
  let nextRequiredGate: FutureSessionMutationNextGate
  let userFacingSummary: string
  
  if (needsFullDb) {
    status = 'blocked_needs_full_db'
    nextRequiredGate = 'MASTER_8C_FULL_EXERCISE_DB'
    userFacingSummary = 'Blocked: Full exercise DB required before structural changes'
  } else if (targetUnresolved) {
    status = 'blocked_target_unresolved'
    nextRequiredGate = 'MASTER_8B_7_2_TARGET_RESOLUTION'
    userFacingSummary = 'Blocked: Target future session must be resolved'
  } else if (!structuralWriterEnabled) {
    status = 'blocked_structural_writer_not_enabled'
    nextRequiredGate = 'MASTER_8B_7_3_STRUCTURAL_PREVIEW'
    userFacingSummary = 'Marker confirmed — structural preview pending (8B.7.3)'
  } else {
    // This branch won't be reached in 8B.7.2 since structuralWriterEnabled is always false
    status = 'eligible_for_bounded_structural_preview'
    nextRequiredGate = 'MASTER_8B_8_LIVE_BRIDGE'
    userFacingSummary = 'Eligible for bounded structural preview'
  }
  
  // Can show Program Card marker only if target is resolved and plan is safe
  const canShowProgramCardMarker = plan.targetResolved && 
    plan.targetDayNumbers.length > 0 && 
    plan.status !== 'blocked_needs_full_db'
  
  // Can preview structural mutation only if DB is complete and target is resolved
  // (but actual application is still blocked by writer gate)
  const canPreviewStructuralMutation = !needsFullDb && !targetUnresolved
  
  return {
    sourceCandidateId: plan.sourceCandidateId,
    status,
    canShowProgramCardMarker,
    canPreviewStructuralMutation,
    canApplyStructuralMutation: false, // ALWAYS false in MASTER-8B.7.2
    targetResolved: plan.targetResolved,
    targetDayNumbers: plan.targetDayNumbers,
    blockedReasons,
    safetyGuarantees,
    userFacingSummary,
    nextRequiredGate,
  }
}

/**
 * Get a count summary of eligibility across all confirmed plans.
 */
export function getEligibilitySummary(
  bundle: FutureSessionMutationPlanBundle,
  options?: EligibilityResolverOptions
): {
  total: number
  queued: number
  previewEligible: number
  blockedByDb: number
  blockedByTarget: number
  summaryText: string
} {
  if (!bundle.hasConfirmedPlans) {
    return {
      total: 0,
      queued: 0,
      previewEligible: 0,
      blockedByDb: 0,
      blockedByTarget: 0,
      summaryText: 'No confirmed plans',
    }
  }
  
  let previewEligible = 0
  let blockedByDb = 0
  let blockedByTarget = 0
  
  for (const plan of bundle.confirmedPlans) {
    const eligibility = resolveFutureSessionMutationEligibility(plan, options)
    
    if (eligibility.canPreviewStructuralMutation) {
      previewEligible++
    }
    if (eligibility.status === 'blocked_needs_full_db') {
      blockedByDb++
    }
    if (eligibility.status === 'blocked_target_unresolved') {
      blockedByTarget++
    }
  }
  
  const parts: string[] = []
  parts.push(`${bundle.totalConfirmed} queued`)
  if (previewEligible > 0) {
    parts.push(`${previewEligible} preview eligible`)
  } else {
    parts.push('0 structurally eligible')
  }
  if (blockedByDb > 0) {
    parts.push('full DB gate pending')
  }
  if (blockedByTarget > 0) {
    parts.push('target resolver pending')
  }
  
  return {
    total: bundle.totalConfirmed,
    queued: bundle.totalConfirmed,
    previewEligible,
    blockedByDb,
    blockedByTarget,
    summaryText: parts.join(' · '),
  }
}
