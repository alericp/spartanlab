/**
 * MASTER-8C.41 / AB20.4.34 — Marker-Only Confirmation Boundary Preview
 * 
 * Pure, deterministic marker-only confirmation boundary preview that answers:
 * "Would the app be allowed to show a marker-only confirmation control in a future step?"
 * 
 * INVARIANTS:
 * - Pure TypeScript, no React
 * - No fetch/DB/window/document/localStorage/sessionStorage
 * - No Date.now() or Math.random()
 * - No mutation/save/write/apply functions
 * - No marker persistence
 * - No `as any`, `@ts-ignore`, `@ts-expect-error`
 * 
 * This step is ONLY the marker-only confirmation boundary preview.
 * It does NOT save or apply anything.
 */

import type { BoundedMutationApplyEligibilityGateModel } from './bounded-mutation-apply-eligibility-gate'
import type { ControlledFutureSessionMutationDryRunEnvelope } from './controlled-future-session-mutation-writer-dry-run'
import type { UserConfirmationMarkerPermissionPreviewGateModel } from './user-confirmation-marker-permission-preview-gate'
import type { PreMutationLockBundleClosureModel } from './pre-mutation-lock-bundle-closure'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'

// =============================================================================
// STATUS TYPE
// =============================================================================

export type MarkerOnlyConfirmationBoundaryStatus =
  | 'unavailable_missing_upstream'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_apply_gate_locked'
  | 'blocked_dry_run_not_ready'
  | 'blocked_permission_gate_locked'
  | 'marker_preview_locked'
  | 'marker_preview_ready_future_step'
  | 'future_marker_save_step_locked'

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface MarkerOnlyConfirmationBoundaryModel {
  // Core status
  readonly status: MarkerOnlyConfirmationBoundaryStatus
  readonly headline: string
  readonly summary: string
  
  // Session metrics
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly activeCautionCount: number
  readonly dryRunOperationCount: number
  readonly eligibleOperationCount: number
  readonly markerCandidateCount: number
  
  // Blockers and notes
  readonly blockedReasons: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string
  
  // Preview flags
  readonly canRenderMarkerConfirmationPreview: boolean
  
  // All control/action flags LOCKED FALSE in this step
  readonly canEnableMarkerConfirmationControl: false
  readonly canSaveMarker: false
  readonly canWriteMarker: false
  readonly canApplyMutation: false
  readonly canWriteSessions: false
  readonly canPersistProgram: false
  readonly canChangeProgramCards: false
  readonly canChangeStartWorkout: false
  readonly canChangeLiveWorkout: false
  
  // Safety invariants LOCKED TRUE
  readonly noMarkerSaved: true
  readonly noMarkerWriteAttempted: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
  readonly completedSessionsProtected: true
  readonly futureTargetsRequired: true
}

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface MarkerOnlyConfirmationBoundaryInput {
  readonly boundedMutationApplyEligibilityGateModel: BoundedMutationApplyEligibilityGateModel | null | undefined
  readonly controlledFutureSessionMutationWriterDryRunModel: ControlledFutureSessionMutationDryRunEnvelope | null | undefined
  readonly userConfirmationMarkerPermissionPreviewGateModel: UserConfirmationMarkerPermissionPreviewGateModel | null | undefined
  readonly preMutationLockBundleClosureModel: PreMutationLockBundleClosureModel | null | undefined
  readonly mutationCautionClearanceGateModel: MutationCautionClearanceGateModel | null | undefined
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null | undefined
}

// =============================================================================
// LOCKED FLAGS CONSTANT
// =============================================================================

const LOCKED_FLAGS = {
  canEnableMarkerConfirmationControl: false as const,
  canSaveMarker: false as const,
  canWriteMarker: false as const,
  canApplyMutation: false as const,
  canWriteSessions: false as const,
  canPersistProgram: false as const,
  canChangeProgramCards: false as const,
  canChangeStartWorkout: false as const,
  canChangeLiveWorkout: false as const,
  noMarkerSaved: true as const,
  noMarkerWriteAttempted: true as const,
  noProgramChangesApplied: true as const,
  noWorkoutChangesApplied: true as const,
  completedSessionsProtected: true as const,
  futureTargetsRequired: true as const,
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveMarkerOnlyConfirmationBoundaryPreview(
  input: MarkerOnlyConfirmationBoundaryInput
): MarkerOnlyConfirmationBoundaryModel {
  const {
    boundedMutationApplyEligibilityGateModel,
    controlledFutureSessionMutationWriterDryRunModel,
    userConfirmationMarkerPermissionPreviewGateModel,
    preMutationLockBundleClosureModel,
    mutationCautionClearanceGateModel,
    mutationTargetSessionResolutionPreviewModel,
  } = input
  
  // -------------------------------------------------------------------------
  // PRIORITY A: Missing upstream models
  // -------------------------------------------------------------------------
  if (
    !boundedMutationApplyEligibilityGateModel ||
    !controlledFutureSessionMutationWriterDryRunModel ||
    !userConfirmationMarkerPermissionPreviewGateModel ||
    !preMutationLockBundleClosureModel ||
    !mutationCautionClearanceGateModel ||
    !mutationTargetSessionResolutionPreviewModel
  ) {
    return {
      status: 'unavailable_missing_upstream',
      headline: 'Marker Boundary Unavailable',
      summary: 'Required upstream gate models are missing. Cannot determine marker confirmation boundary.',
      targetSessionCount: 0,
      completedProtectedCount: 0,
      activeCautionCount: 0,
      dryRunOperationCount: 0,
      eligibleOperationCount: 0,
      markerCandidateCount: 0,
      blockedReasons: ['Missing required upstream gate models'],
      safetyNotes: ['No marker confirmation possible without upstream gates'],
      nextSafeGate: 'Resolve upstream gate availability',
      canRenderMarkerConfirmationPreview: false,
      ...LOCKED_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // BASE METRICS FROM UPSTREAM
  // -------------------------------------------------------------------------
  const completedProtectedCount = 
    mutationTargetSessionResolutionPreviewModel.completedSessionCount ?? 0
  const futureTargetCount = 
    mutationTargetSessionResolutionPreviewModel.futureSessionCount ?? 0
  const activeCautionCount = 
    mutationCautionClearanceGateModel.activeCautionCount ?? 0
  const dryRunOperationCount = 
    controlledFutureSessionMutationWriterDryRunModel.operationCount ?? 0
  const eligibleOperationCount = 
    boundedMutationApplyEligibilityGateModel.eligibleOperationCount ?? 0
  
  // Marker candidates = future targets with dry-run operations available
  const markerCandidateCount = 
    futureTargetCount > 0 && dryRunOperationCount > 0 ? dryRunOperationCount : 0
  
  // -------------------------------------------------------------------------
  // PRIORITY B: Active caution
  // -------------------------------------------------------------------------
  if (
    activeCautionCount > 0 ||
    mutationCautionClearanceGateModel.status === 'blocked_active_caution' ||
    mutationCautionClearanceGateModel.status === 'clearance_waiting_for_evidence'
  ) {
    return {
      status: 'blocked_active_caution',
      headline: 'Marker Boundary Blocked — Active Caution',
      summary: `${activeCautionCount} active caution(s) prevent marker confirmation boundary from becoming ready. All cautions must be resolved before marker confirmation can proceed.`,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount,
      markerCandidateCount: 0,
      blockedReasons: [
        `${activeCautionCount} active caution(s) must be cleared`,
        'Marker confirmation blocked until cautions resolved',
        'Coach Intelligence caution flags require attention',
      ],
      safetyNotes: [
        'Completed sessions remain protected',
        'No marker save attempted',
        'No program changes applied',
      ],
      nextSafeGate: 'Clear all active cautions, then re-check marker boundary',
      canRenderMarkerConfirmationPreview: false,
      ...LOCKED_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY C: No future targets
  // -------------------------------------------------------------------------
  if (
    futureTargetCount === 0 ||
    mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets'
  ) {
    return {
      status: 'blocked_no_future_targets',
      headline: 'Marker Boundary Blocked — No Future Targets',
      summary: 'No future target sessions exist. Marker confirmation requires at least one future session to target.',
      targetSessionCount: 0,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount,
      markerCandidateCount: 0,
      blockedReasons: [
        'No future target sessions available',
        'Marker confirmation requires future sessions',
        'Current program has only completed sessions',
      ],
      safetyNotes: [
        `${completedProtectedCount} completed session(s) protected`,
        'No marker save attempted',
        'No program changes applied',
      ],
      nextSafeGate: 'Generate or load a program with future sessions',
      canRenderMarkerConfirmationPreview: false,
      ...LOCKED_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY D: Apply gate locked
  // -------------------------------------------------------------------------
  const applyGateEligible = 
    boundedMutationApplyEligibilityGateModel.status === 'eligible_confirmation_preview_only' ||
    boundedMutationApplyEligibilityGateModel.status === 'eligible_apply_future_step_locked'
  
  if (!applyGateEligible) {
    return {
      status: 'blocked_apply_gate_locked',
      headline: 'Marker Boundary Blocked — Apply Gate Locked',
      summary: 'Bounded mutation apply eligibility gate is not in an eligible state. Marker confirmation boundary requires apply gate to be eligible.',
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount,
      markerCandidateCount: 0,
      blockedReasons: [
        `Apply gate status: ${boundedMutationApplyEligibilityGateModel.status}`,
        'Apply gate must reach eligible state',
        'Marker boundary depends on apply eligibility',
      ],
      safetyNotes: [
        'Completed sessions remain protected',
        'No marker save attempted',
        'No program changes applied',
      ],
      nextSafeGate: 'Resolve apply gate blockers, then re-check marker boundary',
      canRenderMarkerConfirmationPreview: false,
      ...LOCKED_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY E: Dry-run not ready
  // -------------------------------------------------------------------------
  if (controlledFutureSessionMutationWriterDryRunModel.status !== 'dry_run_ready_preview_only') {
    return {
      status: 'blocked_dry_run_not_ready',
      headline: 'Marker Boundary Blocked — Dry Run Not Ready',
      summary: 'Controlled dry-run writer is not in preview-ready state. Marker confirmation boundary requires dry-run to be ready.',
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount,
      markerCandidateCount: 0,
      blockedReasons: [
        `Dry-run status: ${controlledFutureSessionMutationWriterDryRunModel.status}`,
        'Dry-run must reach preview-ready state',
        'Marker boundary depends on dry-run readiness',
      ],
      safetyNotes: [
        'Completed sessions remain protected',
        'No marker save attempted',
        'No program changes applied',
      ],
      nextSafeGate: 'Resolve dry-run blockers, then re-check marker boundary',
      canRenderMarkerConfirmationPreview: false,
      ...LOCKED_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY F: Permission gate locked
  // -------------------------------------------------------------------------
  const permissionGateReady = 
    userConfirmationMarkerPermissionPreviewGateModel.status === 'permission_preview_ready_read_only' ||
    userConfirmationMarkerPermissionPreviewGateModel.status === 'marker_permission_preview_locked'
  
  if (!permissionGateReady) {
    return {
      status: 'blocked_permission_gate_locked',
      headline: 'Marker Boundary Blocked — Permission Gate Locked',
      summary: 'User confirmation/marker permission preview gate is not in preview-ready state. Marker confirmation boundary requires permission gate readiness.',
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      dryRunOperationCount,
      eligibleOperationCount,
      markerCandidateCount: 0,
      blockedReasons: [
        `Permission gate status: ${userConfirmationMarkerPermissionPreviewGateModel.status}`,
        'Permission gate must reach preview-ready state',
        'Marker boundary depends on permission readiness',
      ],
      safetyNotes: [
        'Completed sessions remain protected',
        'No marker save attempted',
        'No program changes applied',
      ],
      nextSafeGate: 'Resolve permission gate blockers, then re-check marker boundary',
      canRenderMarkerConfirmationPreview: false,
      ...LOCKED_FLAGS,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY G: All gates ready — marker preview ready for future step
  // -------------------------------------------------------------------------
  return {
    status: 'marker_preview_ready_future_step',
    headline: 'Marker Boundary Preview Ready',
    summary: `All upstream gates are ready. ${markerCandidateCount} marker candidate(s) identified across ${futureTargetCount} future session(s). Marker confirmation control can be enabled in a future step (MASTER-8C.42).`,
    targetSessionCount: futureTargetCount,
    completedProtectedCount,
    activeCautionCount,
    dryRunOperationCount,
    eligibleOperationCount,
    markerCandidateCount,
    blockedReasons: [],
    safetyNotes: [
      `${completedProtectedCount} completed session(s) protected`,
      `${futureTargetCount} future session(s) identified as targets`,
      `${markerCandidateCount} marker candidate(s) ready for future confirmation`,
      'No marker save in this step',
      'No program changes in this step',
    ],
    nextSafeGate: 'MASTER-8C.42 can add marker-only saved permission artifact if explicitly authorized',
    canRenderMarkerConfirmationPreview: true,
    ...LOCKED_FLAGS,
  }
}

// =============================================================================
// STATUS LABEL HELPER
// =============================================================================

export function getMarkerOnlyConfirmationBoundaryStatusLabel(
  status: MarkerOnlyConfirmationBoundaryStatus
): string {
  switch (status) {
    case 'unavailable_missing_upstream':
      return 'Unavailable'
    case 'blocked_active_caution':
      return 'Blocked: Active Caution'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_apply_gate_locked':
      return 'Blocked: Apply Gate'
    case 'blocked_dry_run_not_ready':
      return 'Blocked: Dry Run'
    case 'blocked_permission_gate_locked':
      return 'Blocked: Permission Gate'
    case 'marker_preview_locked':
      return 'Marker Preview Locked'
    case 'marker_preview_ready_future_step':
      return 'Preview Ready (Future Step)'
    case 'future_marker_save_step_locked':
      return 'Future Save Locked'
    default:
      return 'Unknown'
  }
}

// =============================================================================
// STATUS COLOR HELPER
// =============================================================================

export function getMarkerOnlyConfirmationBoundaryStatusColor(
  status: MarkerOnlyConfirmationBoundaryStatus
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
    case 'blocked_apply_gate_locked':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
        border: 'border-violet-500/20',
      }
    case 'blocked_dry_run_not_ready':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    case 'blocked_permission_gate_locked':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
        border: 'border-rose-500/20',
      }
    case 'marker_preview_locked':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'marker_preview_ready_future_step':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
    case 'future_marker_save_step_locked':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400/70',
        border: 'border-teal-500/20',
      }
    default:
      return {
        bg: 'bg-[#1A1A2E]/60',
        text: 'text-[#8A8A9A]',
        border: 'border-[#2A2A35]/40',
      }
  }
}
