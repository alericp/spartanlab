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
