/**
 * MASTER-8C.36 / AB20.4.29 — User Confirmation / Marker Permission Preview Gate
 * 
 * A pure, deterministic, read-only gate that determines whether the app would be
 * allowed to show a future user confirmation / marker permission UI.
 * 
 * This step does NOT:
 * - Add a real confirmation button
 * - Save a marker
 * - Apply mutation
 * - Change Program Cards
 * - Touch Start Workout
 * - Touch Live Workout
 * 
 * All permission flags are locked false. All safety flags are true.
 */

import type { PlanEvidenceTrendReadinessModel } from './plan-evidence-trend-readiness'
import type { MutationReadinessReviewGateModel } from './mutation-readiness-review-gate'
import type { MutationPathwayReadinessMapModel } from './mutation-pathway-readiness-map'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationConfirmationContractPreviewModel } from './mutation-confirmation-contract-preview'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import type { StructuralMutationPreviewContractModel } from './structural-mutation-preview-contract'
import { computeSemanticBlockerSummary } from './mutation-caution-semantic-blocker'

// =============================================================================
// STATUS TYPE
// =============================================================================

export type UserConfirmationMarkerPermissionPreviewGateStatus =
  | 'unavailable_missing_upstream'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_completed_only'
  | 'blocked_structural_preview_unavailable'
  | 'blocked_structural_preview_not_ready'
  | 'blocked_confirmation_contract_unavailable'
  | 'marker_permission_preview_locked'
  | 'permission_preview_ready_read_only'
  | 'future_locked'

// =============================================================================
// PERMISSION STATE TYPE
// =============================================================================

export type UserConfirmationMarkerPermissionState =
  | 'denied_upstream_blocked'
  | 'denied_caution_active'
  | 'denied_no_targets'
  | 'denied_structural_not_ready'
  | 'preview_locked'
  | 'preview_ready_read_only'
  | 'future_locked'

// =============================================================================
// MODEL TYPE
// =============================================================================

export interface UserConfirmationMarkerPermissionPreviewGateModel {
  readonly status: UserConfirmationMarkerPermissionPreviewGateStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: 'high' | 'medium' | 'low' | 'none'
  readonly permissionState: UserConfirmationMarkerPermissionState
  readonly completedProtectedCount: number
  readonly futureTargetCount: number
  readonly activeCautionCount: number
  readonly structuralPreviewCandidateCount: number
  readonly blockedReasons: readonly string[]
  readonly missingProof: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string

  // Permission flags — ALL LOCKED FALSE in this step
  readonly canShowConfirmationUi: false
  readonly canSaveMarker: false
  readonly canWriteMarker: false
  readonly canApplyMutation: false
  readonly canChangeProgramCards: false
  readonly canBridgeStartWorkout: false
  readonly canBridgeLiveWorkout: false

  // Safety flags — ALL TRUE in this step
  readonly noConfirmationUiRendered: true
  readonly noMarkerSaved: true
  readonly noMarkerWriteAttempted: true
  readonly noProgramChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noStartWorkoutChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
}

// =============================================================================
// RESOLVER INPUT
// =============================================================================

export interface UserConfirmationMarkerPermissionPreviewGateInput {
  planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
  mutationTargetSessionResolutionPreviewModel?: MutationTargetSessionResolutionPreviewModel | null
  mutationConfirmationContractPreviewModel?: MutationConfirmationContractPreviewModel | null
  mutationCautionClearanceGateModel?: MutationCautionClearanceGateModel | null
  structuralMutationPreviewContractModel?: StructuralMutationPreviewContractModel | null
}

// =============================================================================
// RESOLVER — PURE, DETERMINISTIC, READ-ONLY
// =============================================================================

export function resolveUserConfirmationMarkerPermissionPreviewGate(
  input: UserConfirmationMarkerPermissionPreviewGateInput
): UserConfirmationMarkerPermissionPreviewGateModel {
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel,
    mutationCautionClearanceGateModel,
    structuralMutationPreviewContractModel,
  } = input

  // -------------------------------------------------------------------------
  // EXTRACT COUNTS FROM UPSTREAM
  // -------------------------------------------------------------------------
  const completedProtectedCount =
    structuralMutationPreviewContractModel?.completedProtectedCount ??
    mutationCautionClearanceGateModel?.completedSessionCount ??
    mutationTargetSessionResolutionPreviewModel?.completedSessionCount ??
    0

  const futureTargetCount =
    structuralMutationPreviewContractModel?.futureTargetCount ??
    mutationCautionClearanceGateModel?.futureSessionCount ??
    mutationTargetSessionResolutionPreviewModel?.futureSessionCount ??
    0

  const activeCautionCount =
    mutationCautionClearanceGateModel?.activeCautionCount ??
    structuralMutationPreviewContractModel?.activeCautionCount ??
    0

  const structuralPreviewCandidateCount =
    structuralMutationPreviewContractModel?.candidatePreviewCount ?? 0

  // -------------------------------------------------------------------------
  // COLLECT BLOCKED REASONS AND MISSING PROOF
  // -------------------------------------------------------------------------
  const blockedReasons: string[] = []
  const missingProof: string[] = []

  // Check upstream availability
  if (!structuralMutationPreviewContractModel) {
    missingProof.push('Structural mutation preview contract unavailable')
  }
  if (!mutationCautionClearanceGateModel) {
    missingProof.push('Caution clearance gate unavailable')
  }
  if (!mutationConfirmationContractPreviewModel) {
    missingProof.push('Confirmation contract preview unavailable')
  }
  if (!mutationTargetSessionResolutionPreviewModel) {
    missingProof.push('Target session resolution preview unavailable')
  }

  // [P28.1] Use shared semantic helper as single source of truth
  const semanticBlockerSummary = computeSemanticBlockerSummary(mutationCautionClearanceGateModel)
  const semanticHardBlockerCount = semanticBlockerSummary.semanticHardBlockerCount
  
  // Check semantic hard blockers only (not raw activeCautionCount)
  if (semanticBlockerSummary.hasSemanticHardBlockers) {
    blockedReasons.push(`${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} need evidence`)
  }

  // Check caution clearance status (but only for non-caution-count reasons)
  if (mutationCautionClearanceGateModel) {
    const cautionStatus = mutationCautionClearanceGateModel.status
    if (
      cautionStatus === 'blocked_no_future_targets' ||
      cautionStatus === 'blocked_completed_only'
    ) {
      blockedReasons.push(`Caution clearance gate blocked: ${cautionStatus}`)
    }
  }

  // Check structural preview status
  if (structuralMutationPreviewContractModel) {
    const structStatus = structuralMutationPreviewContractModel.status
    if (
      structStatus === 'unavailable' ||
      structStatus === 'blocked_active_caution' ||
      structStatus === 'blocked_no_future_targets' ||
      structStatus === 'blocked_completed_only' ||
      structStatus === 'blocked_target_unresolved'
    ) {
      blockedReasons.push(`Structural preview blocked: ${structStatus}`)
    }
  }

  // Check future targets
  if (futureTargetCount === 0) {
    blockedReasons.push('No future targets available for mutation')
  }

  // Check confirmation contract
  if (mutationConfirmationContractPreviewModel) {
    const ccStatus = mutationConfirmationContractPreviewModel.status
    if (
      ccStatus === 'blocked_no_future_targets' ||
      ccStatus === 'blocked_completed_only' ||
      ccStatus === 'blocked_by_caution' ||
      ccStatus === 'blocked_target_unresolved'
    ) {
      blockedReasons.push(`Confirmation contract blocked: ${ccStatus}`)
    }
  }

  // -------------------------------------------------------------------------
  // SAFETY NOTES
  // -------------------------------------------------------------------------
  const safetyNotes: string[] = [
    'Confirmation UI is not rendered',
    'No marker has been saved',
    'No marker write has been attempted',
    'No program changes have been applied',
    'No Program Card changes have been applied',
    'No Start Workout changes have been applied',
    'No Live Workout changes have been applied',
  ]

  // -------------------------------------------------------------------------
  // DETERMINE STATUS — PRIORITY ORDER
  // -------------------------------------------------------------------------
  let status: UserConfirmationMarkerPermissionPreviewGateStatus
  let permissionState: UserConfirmationMarkerPermissionState
  let headline: string
  let summary: string
  let confidence: 'high' | 'medium' | 'low' | 'none'
  let nextSafeGate: string

  // PRIORITY 1: Missing critical upstream models
  if (
    !structuralMutationPreviewContractModel ||
    !mutationCautionClearanceGateModel ||
    !mutationConfirmationContractPreviewModel
  ) {
    status = 'unavailable_missing_upstream'
    permissionState = 'denied_upstream_blocked'
    headline = 'Upstream Models Missing'
    summary = 'Cannot determine confirmation/marker permission — required upstream gates are unavailable.'
    confidence = 'none'
    nextSafeGate = 'Wait for upstream gates to initialize'
  }
  // PRIORITY 2: Semantic hard blockers only
  // [P28.1] Use shared semantic helper as single source of truth
  else if (semanticBlockerSummary.hasSemanticHardBlockers) {
    status = 'blocked_active_caution'
    permissionState = 'denied_caution_active'
    headline = 'Blocked — Evidence Required'
    summary = `${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} (blocking/waiting/unknown) must be resolved before confirmation/marker permission can be considered.`
    confidence = 'high'
    nextSafeGate = 'Resolve hard blockers first'
  }
  // PRIORITY 3: No future targets
  else if (
    futureTargetCount === 0 ||
    mutationCautionClearanceGateModel.status === 'blocked_no_future_targets'
  ) {
    status = 'blocked_no_future_targets'
    permissionState = 'denied_no_targets'
    headline = 'Blocked — No Future Targets'
    summary = 'All sessions are completed. No future targets exist for mutation confirmation.'
    confidence = 'high'
    nextSafeGate = 'Mutation not applicable — all sessions completed'
  }
  // PRIORITY 4: Completed only
  else if (mutationCautionClearanceGateModel.status === 'blocked_completed_only') {
    status = 'blocked_completed_only'
    permissionState = 'denied_no_targets'
    headline = 'Blocked — Completed Sessions Only'
    summary = 'Only completed sessions exist. Confirmation/marker permission is not applicable.'
    confidence = 'high'
    nextSafeGate = 'Mutation not applicable — completed sessions protected'
  }
  // PRIORITY 5: Structural preview unavailable
  else if (structuralMutationPreviewContractModel.status === 'unavailable') {
    status = 'blocked_structural_preview_unavailable'
    permissionState = 'denied_structural_not_ready'
    headline = 'Structural Preview Unavailable'
    summary = 'Structural mutation preview contract is unavailable. Cannot proceed to confirmation.'
    confidence = 'medium'
    nextSafeGate = 'Wait for structural preview to become available'
  }
  // PRIORITY 6: Structural preview not ready
  else if (
    structuralMutationPreviewContractModel.status === 'blocked_active_caution' ||
    structuralMutationPreviewContractModel.status === 'blocked_no_future_targets' ||
    structuralMutationPreviewContractModel.status === 'blocked_completed_only' ||
    structuralMutationPreviewContractModel.status === 'blocked_target_unresolved' ||
    structuralMutationPreviewContractModel.status === 'waiting_for_confirmation_contract' ||
    structuralMutationPreviewContractModel.status === 'future_locked'
  ) {
    status = 'blocked_structural_preview_not_ready'
    permissionState = 'denied_structural_not_ready'
    headline = 'Structural Preview Not Ready'
    summary = `Structural preview is blocked (${structuralMutationPreviewContractModel.status}). Confirmation cannot proceed.`
    confidence = 'medium'
    nextSafeGate = 'Wait for structural preview to reach ready state'
  }
  // PRIORITY 7: Confirmation contract unavailable or blocked
  else if (
    mutationConfirmationContractPreviewModel.status === 'unavailable' ||
    mutationConfirmationContractPreviewModel.status === 'blocked_no_future_targets' ||
    mutationConfirmationContractPreviewModel.status === 'blocked_completed_only' ||
    mutationConfirmationContractPreviewModel.status === 'blocked_by_caution' ||
    mutationConfirmationContractPreviewModel.status === 'blocked_target_unresolved'
  ) {
    status = 'blocked_confirmation_contract_unavailable'
    permissionState = 'preview_locked'
    headline = 'Confirmation Contract Not Ready'
    summary = `Confirmation contract is blocked (${mutationConfirmationContractPreviewModel.status}). Marker permission locked.`
    confidence = 'medium'
    nextSafeGate = 'Wait for confirmation contract to reach eligible state'
  }
  // PRIORITY 8: Marker permission preview locked (structural ready but not applied)
  else if (
    structuralMutationPreviewContractModel.status === 'preview_contract_ready_read_only' &&
    !structuralMutationPreviewContractModel.canBuildStructuralPreview
  ) {
    status = 'marker_permission_preview_locked'
    permissionState = 'preview_locked'
    headline = 'Marker Permission Preview Locked'
    summary = 'Structural preview contract is ready (read-only), but marker permission remains locked in this step.'
    confidence = 'high'
    nextSafeGate = 'Future-session mutation writer readiness boundary'
  }
  // PRIORITY 9: Permission preview ready (read-only)
  else if (structuralMutationPreviewContractModel.status === 'preview_contract_ready_read_only') {
    status = 'permission_preview_ready_read_only'
    permissionState = 'preview_ready_read_only'
    headline = 'Permission Preview Ready — Read Only'
    summary = 'All upstream gates are clear. Confirmation/marker permission preview is ready, but remains read-only in this step.'
    confidence = 'high'
    nextSafeGate = 'Future-session mutation writer readiness boundary'
  }
  // FALLBACK: Future locked
  else {
    status = 'future_locked'
    permissionState = 'future_locked'
    headline = 'Future Locked'
    summary = 'Confirmation/marker permission is future-locked. Upstream conditions are ambiguous or not fully resolved.'
    confidence = 'low'
    nextSafeGate = 'Resolve upstream gates to determine next step'
  }

  // -------------------------------------------------------------------------
  // BUILD FINAL MODEL — ALL FLAGS LOCKED
  // -------------------------------------------------------------------------
  return {
    status,
    headline,
    summary,
    confidence,
    permissionState,
    completedProtectedCount,
    futureTargetCount,
    activeCautionCount,
    structuralPreviewCandidateCount,
    blockedReasons,
    missingProof,
    safetyNotes,
    nextSafeGate,

    // Permission flags — ALL LOCKED FALSE
    canShowConfirmationUi: false,
    canSaveMarker: false,
    canWriteMarker: false,
    canApplyMutation: false,
    canChangeProgramCards: false,
    canBridgeStartWorkout: false,
    canBridgeLiveWorkout: false,

    // Safety flags — ALL TRUE
    noConfirmationUiRendered: true,
    noMarkerSaved: true,
    noMarkerWriteAttempted: true,
    noProgramChangesApplied: true,
    noProgramCardChangesApplied: true,
    noStartWorkoutChangesApplied: true,
    noLiveWorkoutChangesApplied: true,
  }
}

// =============================================================================
// LABEL HELPER
// =============================================================================

export function getUserConfirmationMarkerPermissionStatusLabel(
  status: UserConfirmationMarkerPermissionPreviewGateStatus
): string {
  switch (status) {
    case 'unavailable_missing_upstream':
      return 'Unavailable'
    case 'blocked_active_caution':
      return 'Blocked: Evidence Required'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_completed_only':
      return 'Blocked: Completed Only'
    case 'blocked_structural_preview_unavailable':
      return 'Structural Preview Locked'
    case 'blocked_structural_preview_not_ready':
      return 'Structural Not Ready'
    case 'blocked_confirmation_contract_unavailable':
      return 'Confirmation Locked'
    case 'marker_permission_preview_locked':
      return 'Marker Permission Locked'
    case 'permission_preview_ready_read_only':
      return 'Preview Ready — Read Only'
    case 'future_locked':
      return 'Future Locked'
    default:
      return 'Unknown'
  }
}

// =============================================================================
// COLOR HELPER
// =============================================================================

export function getUserConfirmationMarkerPermissionStatusColor(
  status: UserConfirmationMarkerPermissionPreviewGateStatus
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
    case 'blocked_completed_only':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_structural_preview_unavailable':
    case 'blocked_structural_preview_not_ready':
    case 'blocked_confirmation_contract_unavailable':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'marker_permission_preview_locked':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400/70',
        border: 'border-indigo-500/20',
      }
    case 'permission_preview_ready_read_only':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400/70',
        border: 'border-teal-500/20',
      }
    case 'future_locked':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
  }
}
