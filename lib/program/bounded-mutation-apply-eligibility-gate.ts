/**
 * MASTER-8C.40 / AB20.4.33 — Bounded Mutation Apply Eligibility Gate
 * 
 * Pure read-only gate that determines whether the dry-run writer is eligible
 * for a future apply step. This gate makes the next boundary explicit:
 * "Can the system show a confirmation/apply control yet?"
 * 
 * IMPORTANT: This step only proves apply eligibility and the next safe gate.
 * It does NOT create the actual confirm/apply UI yet. All apply controls
 * remain locked even when eligibility status is reached.
 * 
 * Invariants:
 * - Pure TypeScript, no React
 * - No fetch, DB, localStorage, sessionStorage, window, document
 * - No Date.now(), Math.random()
 * - No mutation, save, write, or apply functions
 * - No `as any`, `@ts-ignore`, `@ts-expect-error`
 * - All apply/write flags remain false even when eligible
 * - confirmationUiAllowed and applyButtonAllowed always false in this step
 */

import type { ControlledFutureSessionMutationDryRunEnvelope } from './controlled-future-session-mutation-writer-dry-run'
import type { UserConfirmationMarkerPermissionPreviewGateModel } from './user-confirmation-marker-permission-preview-gate'
import type { PreMutationLockBundleClosureModel } from './pre-mutation-lock-bundle-closure'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'

// =============================================================================
// STATUS UNION
// =============================================================================

export type BoundedMutationApplyEligibilityStatus =
  | 'unavailable_missing_upstream'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_permission_locked'
  | 'blocked_pre_mutation_lock'
  | 'blocked_dry_run_not_ready'
  | 'eligible_confirmation_preview_only'
  | 'eligible_apply_future_step_locked'

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface BoundedMutationApplyEligibilityGateModel {
  // Core status
  readonly status: BoundedMutationApplyEligibilityStatus
  readonly headline: string
  readonly summary: string
  
  // Metrics
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly activeCautionCount: number
  readonly dryRunOperationCount: number
  readonly eligibleOperationCount: number
  
  // Blocked reasons and safety
  readonly blockedReasons: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string
  
  // Confirmation/Apply UI flags - ALL LOCKED IN THIS STEP
  readonly confirmationUiAllowed: false
  readonly applyButtonAllowed: false
  readonly applyButtonDisabled: true
  
  // Write/change flags - ALL FALSE
  readonly canWriteSessions: false
  readonly canPersistProgram: false
  readonly canSaveMarker: false
  readonly canChangeProgramCards: false
  readonly canChangeStartWorkout: false
  readonly canChangeLiveWorkout: false
  
  // Safety flags - ALL TRUE
  readonly noProgramChangesApplied: true
  readonly noMarkerSaved: true
  readonly noWorkoutChangesApplied: true
  readonly completedSessionsProtected: true
  readonly futureTargetsRequired: true
}

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface BoundedMutationApplyEligibilityGateInput {
  readonly controlledFutureSessionMutationWriterDryRunModel: ControlledFutureSessionMutationDryRunEnvelope | null | undefined
  readonly userConfirmationMarkerPermissionPreviewGateModel: UserConfirmationMarkerPermissionPreviewGateModel | null | undefined
  readonly preMutationLockBundleClosureModel: PreMutationLockBundleClosureModel | null | undefined
  readonly mutationCautionClearanceGateModel: MutationCautionClearanceGateModel | null | undefined
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null | undefined
}

// =============================================================================
// LOCKED FLAGS (constant across all statuses)
// =============================================================================

const LOCKED_UI_FLAGS = {
  confirmationUiAllowed: false as const,
  applyButtonAllowed: false as const,
  applyButtonDisabled: true as const,
}

const LOCKED_WRITE_FLAGS = {
  canWriteSessions: false as const,
  canPersistProgram: false as const,
  canSaveMarker: false as const,
  canChangeProgramCards: false as const,
  canChangeStartWorkout: false as const,
  canChangeLiveWorkout: false as const,
}

const LOCKED_SAFETY_FLAGS = {
  noProgramChangesApplied: true as const,
  noMarkerSaved: true as const,
  noWorkoutChangesApplied: true as const,
  completedSessionsProtected: true as const,
  futureTargetsRequired: true as const,
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveBoundedMutationApplyEligibilityGate(
  input: BoundedMutationApplyEligibilityGateInput
): BoundedMutationApplyEligibilityGateModel {
  const {
    controlledFutureSessionMutationWriterDryRunModel,
    userConfirmationMarkerPermissionPreviewGateModel,
    preMutationLockBundleClosureModel,
    mutationCautionClearanceGateModel,
    mutationTargetSessionResolutionPreviewModel,
  } = input
  
  // -------------------------------------------------------------------------
  // BASE METRICS FROM UPSTREAM
  // -------------------------------------------------------------------------
  const completedProtectedCount = 
    mutationTargetSessionResolutionPreviewModel?.completedSessionCount ?? 0
  const futureTargetCount = 
    mutationTargetSessionResolutionPreviewModel?.futureSessionCount ?? 0
  const activeCautionCount = 
    mutationCautionClearanceGateModel?.activeCautionCount ?? 0
  const dryRunOperationCount = 
    controlledFutureSessionMutationWriterDryRunModel?.operationCount ?? 0
  
  // -------------------------------------------------------------------------
  // PRIORITY 1: Missing upstream models
  // -------------------------------------------------------------------------
  if (
    !controlledFutureSessionMutationWriterDryRunModel ||
    !userConfirmationMarkerPermissionPreviewGateModel ||
    !preMutationLockBundleClosureModel ||
    !mutationCautionClearanceGateModel ||
    !mutationTargetSessionResolutionPreviewModel
  ) {
    return {
      status: 'unavailable_missing_upstream',
      headline: 'Apply eligibility gate unavailable',
      summary: 'One or more upstream gate models are missing. Cannot determine apply eligibility.',
      targetSessionCount: 0,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount: 0,
      eligibleOperationCount: 0,
      blockedReasons: ['Missing required upstream gate models'],
      safetyNotes: [
        'Completed sessions protected',
        'No apply controls available',
        'No mutation possible without upstream gates',
      ],
      nextSafeGate: 'Resolve upstream gate dependencies first',
      ...LOCKED_UI_FLAGS,
      ...LOCKED_WRITE_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 2: Active caution (highest priority blocker)
  // -------------------------------------------------------------------------
  if (
    activeCautionCount > 0 ||
    mutationCautionClearanceGateModel.status === 'blocked_active_caution'
  ) {
    return {
      status: 'blocked_active_caution',
      headline: 'Apply gate blocked by evidence requirements',
      summary: `${activeCautionCount} root/candidate evidence blocker${activeCautionCount !== 1 ? 's' : ''} must be resolved before apply eligibility can be evaluated. Completed sessions remain protected.`,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount: 0,
      blockedReasons: [
        `${activeCautionCount} evidence blocker${activeCautionCount !== 1 ? 's' : ''} blocking apply eligibility`,
        'Evidence clearance gate not ready',
        'Apply controls remain locked until evidence is resolved',
      ],
      safetyNotes: [
        'Completed sessions protected',
        'No apply controls shown',
        'No mutation possible while evidence blockers remain',
      ],
      nextSafeGate: 'Resolve root/candidate evidence blockers before evaluating apply eligibility',
      ...LOCKED_UI_FLAGS,
      ...LOCKED_WRITE_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 3: No future targets
  // -------------------------------------------------------------------------
  if (
    futureTargetCount === 0 ||
    mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets'
  ) {
    return {
      status: 'blocked_no_future_targets',
      headline: 'Apply gate blocked — no future targets',
      summary: `No future sessions available for mutation. ${completedProtectedCount} completed session${completedProtectedCount !== 1 ? 's' : ''} remain protected. Program may be fully completed.`,
      targetSessionCount: 0,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount: 0,
      blockedReasons: [
        'No future sessions available for mutation',
        'Program may be fully completed',
        'Apply controls require at least one future target session',
      ],
      safetyNotes: [
        'Completed sessions protected',
        'No future sessions to mutate',
        'No apply controls needed',
      ],
      nextSafeGate: 'Generate new program or add future sessions before apply eligibility',
      ...LOCKED_UI_FLAGS,
      ...LOCKED_WRITE_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 4: Permission gate locked
  // -------------------------------------------------------------------------
  if (
    userConfirmationMarkerPermissionPreviewGateModel.status === 'blocked_active_caution' ||
    userConfirmationMarkerPermissionPreviewGateModel.status === 'blocked_no_future_targets' ||
    userConfirmationMarkerPermissionPreviewGateModel.status === 'blocked_completed_only' ||
    userConfirmationMarkerPermissionPreviewGateModel.status === 'marker_permission_preview_locked'
  ) {
    return {
      status: 'blocked_permission_locked',
      headline: 'Apply gate blocked by permission gate',
      summary: 'User confirmation/marker permission preview gate is locked. Cannot evaluate apply eligibility until permission gate is preview-ready.',
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount: 0,
      blockedReasons: [
        'Permission preview gate is locked',
        'Marker permission not yet available',
        'Apply controls require permission gate to be preview-ready',
      ],
      safetyNotes: [
        'Completed sessions protected',
        'Future sessions locked',
        'No apply controls shown',
      ],
      nextSafeGate: 'Resolve permission gate before apply eligibility',
      ...LOCKED_UI_FLAGS,
      ...LOCKED_WRITE_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 5: Pre-mutation lock not ready
  // -------------------------------------------------------------------------
  if (
    preMutationLockBundleClosureModel.status !== 'bundle_closed_preview_ready_read_only' &&
    preMutationLockBundleClosureModel.status !== 'bundle_closed_future_locked'
  ) {
    return {
      status: 'blocked_pre_mutation_lock',
      headline: 'Apply gate blocked by pre-mutation lock',
      summary: 'Pre-mutation lock / bundle closure is not in a closed state. Cannot evaluate apply eligibility until bundle is closed.',
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount: 0,
      blockedReasons: [
        'Pre-mutation bundle not closed',
        'Bundle closure gate not ready',
        'Apply controls require closed bundle state',
      ],
      safetyNotes: [
        'Completed sessions protected',
        'Future sessions locked',
        'No apply controls shown',
      ],
      nextSafeGate: 'Close pre-mutation bundle before apply eligibility',
      ...LOCKED_UI_FLAGS,
      ...LOCKED_WRITE_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 6: Dry-run not ready
  // -------------------------------------------------------------------------
  if (controlledFutureSessionMutationWriterDryRunModel.status !== 'dry_run_ready_preview_only') {
    return {
      status: 'blocked_dry_run_not_ready',
      headline: 'Apply gate blocked by dry-run status',
      summary: 'Controlled mutation writer dry-run is not in preview-ready state. Cannot evaluate apply eligibility until dry-run is ready.',
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount: 0,
      blockedReasons: [
        `Dry-run status: ${controlledFutureSessionMutationWriterDryRunModel.status}`,
        'Dry-run must be preview-ready for apply eligibility',
        'Apply controls require successful dry-run preview',
      ],
      safetyNotes: [
        'Completed sessions protected',
        'Future sessions locked',
        'No apply controls shown',
      ],
      nextSafeGate: 'Resolve dry-run blockers before apply eligibility',
      ...LOCKED_UI_FLAGS,
      ...LOCKED_WRITE_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 7: All gates passed — eligible for future apply step
  // -------------------------------------------------------------------------
  // Note: Even though eligibility is confirmed, this step keeps all apply
  // controls locked. The actual confirm/apply UI is added in MASTER-8C.41+.
  
  const eligibleOperationCount = dryRunOperationCount
  
  // Determine if we have operations to show confirmation for
  const hasOperations = eligibleOperationCount > 0
  
  return {
    status: hasOperations 
      ? 'eligible_confirmation_preview_only' 
      : 'eligible_apply_future_step_locked',
    headline: hasOperations
      ? 'Apply eligibility confirmed — preview only'
      : 'Apply eligibility confirmed — no operations pending',
    summary: hasOperations
      ? `${eligibleOperationCount} dry-run operation${eligibleOperationCount !== 1 ? 's' : ''} eligible for future apply step. Confirmation UI can be added in MASTER-8C.41. All apply controls remain locked in this step.`
      : `All gates passed but no operations are pending. Future apply step can add confirmation UI when operations become available.`,
    targetSessionCount: futureTargetCount,
    completedProtectedCount,
    activeCautionCount: 0,
    dryRunOperationCount,
    eligibleOperationCount,
    blockedReasons: [],
    safetyNotes: [
      'Completed sessions protected',
      'Future sessions preview-only',
      'Apply eligibility confirmed for future step',
      'No apply controls rendered in this step',
      'All mutation flags remain locked',
    ],
    nextSafeGate: 'MASTER-8C.41 can add marker-only confirmation/apply UI',
    ...LOCKED_UI_FLAGS,
    ...LOCKED_WRITE_FLAGS,
    ...LOCKED_SAFETY_FLAGS,
  }
}

// =============================================================================
// STATUS LABEL HELPER
// =============================================================================

export function getBoundedMutationApplyEligibilityStatusLabel(
  status: BoundedMutationApplyEligibilityStatus
): string {
  switch (status) {
    case 'unavailable_missing_upstream':
      return 'Unavailable'
    case 'blocked_active_caution':
      return 'Blocked: Evidence Required'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_permission_locked':
      return 'Blocked: Permission Locked'
    case 'blocked_pre_mutation_lock':
      return 'Blocked: Pre-Mutation Lock'
    case 'blocked_dry_run_not_ready':
      return 'Blocked: Dry-Run Not Ready'
    case 'eligible_confirmation_preview_only':
      return 'Eligible: Preview Only'
    case 'eligible_apply_future_step_locked':
      return 'Eligible: Future Step Locked'
    default:
      return 'Unknown'
  }
}

// =============================================================================
// STATUS COLOR HELPER
// =============================================================================

export function getBoundedMutationApplyEligibilityStatusColor(
  status: BoundedMutationApplyEligibilityStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_upstream':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_active_caution':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'blocked_no_future_targets':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_permission_locked':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
        border: 'border-rose-500/20',
      }
    case 'blocked_pre_mutation_lock':
      return {
        bg: 'bg-fuchsia-500/10',
        text: 'text-fuchsia-400/70',
        border: 'border-fuchsia-500/20',
      }
    case 'blocked_dry_run_not_ready':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    case 'eligible_confirmation_preview_only':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
    case 'eligible_apply_future_step_locked':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400/70',
        border: 'border-teal-500/20',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
  }
}
