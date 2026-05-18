/**
 * MASTER-8C.37 / AB20.4.30 — Future-session Mutation Writer Readiness Boundary
 * 
 * This module provides a read-only readiness boundary that proves whether a future
 * mutation writer could safely exist later. It does NOT perform any mutation,
 * save markers, write sessions, alter Program Cards, Start Workout, Live Workout,
 * persistence, logs, schema, or generator output.
 * 
 * INVARIANTS:
 * - Pure and deterministic (no Date.now, no Math.random, no fetch, no DB, no localStorage)
 * - No React dependencies
 * - No mutation of any program/session/exercise/set/rep data
 * - No marker writing
 * - No confirmation UI rendering
 * - No writer instantiation
 * - No `as any`, no @ts-ignore, no @ts-expect-error
 * 
 * This is a readiness-boundary proof step only.
 */

import type { PlanEvidenceTrendReadinessModel } from './plan-evidence-trend-readiness'
import type { MutationReadinessReviewGateModel } from './mutation-readiness-review-gate'
import type { MutationPathwayReadinessMapModel } from './mutation-pathway-readiness-map'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationConfirmationContractPreviewModel } from './mutation-confirmation-contract-preview'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import type { StructuralMutationPreviewContractModel } from './structural-mutation-preview-contract'
import type { UserConfirmationMarkerPermissionPreviewGateModel } from './user-confirmation-marker-permission-preview-gate'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Writer readiness boundary status - deterministic priority order
 */
export type FutureSessionMutationWriterReadinessStatus =
  | 'unavailable_missing_upstream'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_completed_only'
  | 'blocked_confirmation_permission_locked'
  | 'blocked_structural_preview_not_ready'
  | 'blocked_writer_not_authorized'
  | 'writer_boundary_locked'
  | 'writer_boundary_preview_ready_read_only'
  | 'future_locked'

/**
 * Writer readiness state for display
 */
export type WriterReadinessState =
  | 'not_initialized'
  | 'blocked_by_upstream'
  | 'blocked_by_caution'
  | 'blocked_by_permission'
  | 'blocked_by_structural'
  | 'boundary_locked'
  | 'preview_ready'

/**
 * Protected invariant proof
 */
export interface ProtectedInvariantProof {
  readonly invariant: string
  readonly protected: boolean
  readonly reason: string
}

/**
 * Future-session Mutation Writer Readiness Boundary Model
 */
export interface FutureSessionMutationWriterReadinessBoundaryModel {
  readonly status: FutureSessionMutationWriterReadinessStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: number
  readonly writerReadinessState: WriterReadinessState
  readonly completedProtectedCount: number
  readonly futureTargetCount: number
  readonly activeCautionCount: number
  readonly structuralPreviewCandidateCount: number
  readonly confirmationPermissionState: string
  readonly blockedReasons: readonly string[]
  readonly missingProof: readonly string[]
  readonly protectedInvariants: readonly ProtectedInvariantProof[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string

  // All action flags locked false in this step
  readonly canInstantiateWriter: false
  readonly canWriteFutureSessions: false
  readonly canSaveMutationMarker: false
  readonly canApplyMutation: false
  readonly canChangeCompletedSessions: false
  readonly canChangeProgramCards: false
  readonly canChangeStartWorkout: false
  readonly canChangeLiveWorkout: false
  readonly canPersistMutation: false

  // All safety/protection flags true in this step
  readonly completedSessionsProtected: true
  readonly futureSessionsNotWritten: true
  readonly noMarkerSaved: true
  readonly noProgramChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noStartWorkoutChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly noPersistenceChangesApplied: true
}

/**
 * Input for resolving the writer readiness boundary
 */
export interface FutureSessionMutationWriterReadinessBoundaryInput {
  readonly planEvidenceTrendReadinessModel: PlanEvidenceTrendReadinessModel | null
  readonly mutationReadinessReviewGateModel: MutationReadinessReviewGateModel | null
  readonly mutationPathwayReadinessMapModel: MutationPathwayReadinessMapModel | null
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null
  readonly mutationConfirmationContractPreviewModel: MutationConfirmationContractPreviewModel | null
  readonly mutationCautionClearanceGateModel: MutationCautionClearanceGateModel | null
  readonly structuralMutationPreviewContractModel: StructuralMutationPreviewContractModel | null
  readonly userConfirmationMarkerPermissionPreviewGateModel: UserConfirmationMarkerPermissionPreviewGateModel | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LOCKED_ACTION_FLAGS = {
  canInstantiateWriter: false as const,
  canWriteFutureSessions: false as const,
  canSaveMutationMarker: false as const,
  canApplyMutation: false as const,
  canChangeCompletedSessions: false as const,
  canChangeProgramCards: false as const,
  canChangeStartWorkout: false as const,
  canChangeLiveWorkout: false as const,
  canPersistMutation: false as const,
}

const TRUE_SAFETY_FLAGS = {
  completedSessionsProtected: true as const,
  futureSessionsNotWritten: true as const,
  noMarkerSaved: true as const,
  noProgramChangesApplied: true as const,
  noProgramCardChangesApplied: true as const,
  noStartWorkoutChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
  noPersistenceChangesApplied: true as const,
}

// =============================================================================
// HELPER: Build protected invariants
// =============================================================================

function buildProtectedInvariants(): readonly ProtectedInvariantProof[] {
  return [
    {
      invariant: 'Completed sessions are protected',
      protected: true,
      reason: 'No writer instantiated; completed sessions remain read-only',
    },
    {
      invariant: 'Future sessions are not written',
      protected: true,
      reason: 'Writer boundary locked; no future session writes in this step',
    },
    {
      invariant: 'No marker is saved',
      protected: true,
      reason: 'Marker write not authorized; permission gate locked',
    },
    {
      invariant: 'No program changes are applied',
      protected: true,
      reason: 'Mutation writer not instantiated; program remains unchanged',
    },
    {
      invariant: 'No Program Card changes are applied',
      protected: true,
      reason: 'Program Card adaptation not triggered; cards remain static',
    },
    {
      invariant: 'No Start Workout changes are applied',
      protected: true,
      reason: 'Start Workout bridge not activated; flow unchanged',
    },
    {
      invariant: 'No Live Workout changes are applied',
      protected: true,
      reason: 'Live Workout bridge not activated; runtime unchanged',
    },
    {
      invariant: 'No persistence changes are applied',
      protected: true,
      reason: 'No save/load mutation; persistence layer untouched',
    },
  ]
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveFutureSessionMutationWriterReadinessBoundary(
  input: FutureSessionMutationWriterReadinessBoundaryInput
): FutureSessionMutationWriterReadinessBoundaryModel {
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel,
    mutationCautionClearanceGateModel,
    structuralMutationPreviewContractModel,
    userConfirmationMarkerPermissionPreviewGateModel,
  } = input

  const protectedInvariants = buildProtectedInvariants()

  // -------------------------------------------------------------------------
  // PRIORITY 1: Missing upstream models
  // -------------------------------------------------------------------------
  if (
    !planEvidenceTrendReadinessModel ||
    !mutationReadinessReviewGateModel ||
    !mutationPathwayReadinessMapModel ||
    !mutationTargetSessionResolutionPreviewModel ||
    !mutationConfirmationContractPreviewModel ||
    !mutationCautionClearanceGateModel ||
    !structuralMutationPreviewContractModel ||
    !userConfirmationMarkerPermissionPreviewGateModel
  ) {
    const missing: string[] = []
    if (!planEvidenceTrendReadinessModel) missing.push('Plan evidence trend readiness model')
    if (!mutationReadinessReviewGateModel) missing.push('Mutation readiness review gate model')
    if (!mutationPathwayReadinessMapModel) missing.push('Mutation pathway readiness map model')
    if (!mutationTargetSessionResolutionPreviewModel) missing.push('Mutation target session resolution preview model')
    if (!mutationConfirmationContractPreviewModel) missing.push('Mutation confirmation contract preview model')
    if (!mutationCautionClearanceGateModel) missing.push('Mutation caution clearance gate model')
    if (!structuralMutationPreviewContractModel) missing.push('Structural mutation preview contract model')
    if (!userConfirmationMarkerPermissionPreviewGateModel) missing.push('User confirmation marker permission preview gate model')

    return {
      status: 'unavailable_missing_upstream',
      headline: 'Writer readiness boundary unavailable',
      summary: 'Cannot evaluate writer readiness without complete upstream proof chain.',
      confidence: 0,
      writerReadinessState: 'not_initialized',
      completedProtectedCount: 0,
      futureTargetCount: 0,
      activeCautionCount: 0,
      structuralPreviewCandidateCount: 0,
      confirmationPermissionState: 'unknown',
      blockedReasons: ['Missing upstream models'],
      missingProof: missing,
      protectedInvariants,
      safetyNotes: ['All invariants protected by default when upstream unavailable'],
      nextSafeGate: 'Provide complete upstream proof chain',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // Extract counts from upstream models
  const completedProtectedCount = mutationTargetSessionResolutionPreviewModel.completedSessionCount
  const futureTargetCount = mutationTargetSessionResolutionPreviewModel.futureSessionCount
  const activeCautionCount = mutationCautionClearanceGateModel.activeCautionCount
  const structuralPreviewCandidateCount = structuralMutationPreviewContractModel.candidatePreviewCount

  // Derive confirmation permission state
  const confirmationPermissionState = userConfirmationMarkerPermissionPreviewGateModel.status === 'permission_preview_ready_read_only'
    ? 'preview_ready'
    : userConfirmationMarkerPermissionPreviewGateModel.status === 'marker_permission_preview_locked'
    ? 'locked'
    : 'blocked'

  // -------------------------------------------------------------------------
  // PRIORITY 2: Blocked by active caution
  // -------------------------------------------------------------------------
  if (
    mutationCautionClearanceGateModel.status === 'blocked_active_caution' ||
    activeCautionCount > 0
  ) {
    return {
      status: 'blocked_active_caution',
      headline: 'Writer readiness blocked by active caution',
      summary: `${activeCautionCount} active caution signal(s) prevent writer boundary from proceeding. Clear all caution conditions first.`,
      confidence: 0.1,
      writerReadinessState: 'blocked_by_caution',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        `${activeCautionCount} active caution signal(s)`,
        'Caution clearance gate not cleared',
        'Writer instantiation blocked by caution',
      ],
      missingProof: ['Caution clearance'],
      protectedInvariants,
      safetyNotes: ['Active caution prevents writer boundary activation'],
      nextSafeGate: 'Clear all caution signals before proceeding',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 3: Blocked by no future targets
  // -------------------------------------------------------------------------
  if (futureTargetCount === 0) {
    return {
      status: 'blocked_no_future_targets',
      headline: 'Writer readiness blocked — no future targets',
      summary: 'No future sessions available for mutation. Writer boundary cannot proceed without targets.',
      confidence: 0.15,
      writerReadinessState: 'blocked_by_upstream',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        'No future sessions available',
        'Writer has no targets to operate on',
        'All sessions are completed or protected',
      ],
      missingProof: ['Future target sessions'],
      protectedInvariants,
      safetyNotes: ['Completed sessions remain protected', 'No targets means no mutation possible'],
      nextSafeGate: 'Generate or schedule future sessions',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 4: Blocked completed only
  // -------------------------------------------------------------------------
  if (
    mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets' ||
    (completedProtectedCount > 0 && futureTargetCount === 0)
  ) {
    return {
      status: 'blocked_completed_only',
      headline: 'Writer readiness blocked — completed sessions only',
      summary: `All ${completedProtectedCount} session(s) are completed and protected. No future sessions to target.`,
      confidence: 0.15,
      writerReadinessState: 'blocked_by_upstream',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        'All sessions are completed',
        'Completed sessions are protected from mutation',
        'No future sessions available for writer',
      ],
      missingProof: ['Future target sessions'],
      protectedInvariants,
      safetyNotes: ['Completed sessions permanently protected'],
      nextSafeGate: 'Schedule new future sessions',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 5: Blocked by confirmation permission locked
  // -------------------------------------------------------------------------
  if (
    userConfirmationMarkerPermissionPreviewGateModel.status !== 'permission_preview_ready_read_only' &&
    userConfirmationMarkerPermissionPreviewGateModel.status !== 'marker_permission_preview_locked'
  ) {
    return {
      status: 'blocked_confirmation_permission_locked',
      headline: 'Writer readiness blocked by permission gate',
      summary: 'User confirmation / marker permission gate is blocked. Writer boundary cannot proceed without permission proof.',
      confidence: 0.2,
      writerReadinessState: 'blocked_by_permission',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        'Confirmation permission gate blocked',
        `Permission state: ${userConfirmationMarkerPermissionPreviewGateModel.status}`,
        'Writer requires permission preview to be ready',
      ],
      missingProof: ['Permission preview readiness'],
      protectedInvariants,
      safetyNotes: ['Permission gate blocks writer boundary'],
      nextSafeGate: 'Clear permission gate blockers',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 6: Blocked by structural preview not ready
  // -------------------------------------------------------------------------
  if (
    structuralMutationPreviewContractModel.status !== 'preview_contract_ready_read_only'
  ) {
    return {
      status: 'blocked_structural_preview_not_ready',
      headline: 'Writer readiness blocked by structural preview',
      summary: 'Structural mutation preview contract is not ready. Writer boundary requires structural preview proof.',
      confidence: 0.25,
      writerReadinessState: 'blocked_by_structural',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        'Structural preview contract not ready',
        `Structural status: ${structuralMutationPreviewContractModel.status}`,
        'Writer requires structural preview to be ready',
      ],
      missingProof: ['Structural preview readiness'],
      protectedInvariants,
      safetyNotes: ['Structural preview blocks writer boundary'],
      nextSafeGate: 'Clear structural preview blockers',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 7: Blocked writer not authorized
  // -------------------------------------------------------------------------
  // Even if upstream is ready, writer is not authorized in this step
  if (
    mutationReadinessReviewGateModel.status !== 'review_candidates_read_only'
  ) {
    return {
      status: 'blocked_writer_not_authorized',
      headline: 'Writer not authorized',
      summary: 'Mutation readiness review gate does not authorize writer instantiation. Writer boundary remains locked.',
      confidence: 0.3,
      writerReadinessState: 'blocked_by_upstream',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        'Mutation readiness gate not ready',
        `Review gate status: ${mutationReadinessReviewGateModel.status}`,
        'Writer authorization requires readiness gate approval',
      ],
      missingProof: ['Mutation readiness gate approval'],
      protectedInvariants,
      safetyNotes: ['Writer authorization blocked by readiness gate'],
      nextSafeGate: 'Clear mutation readiness review gate',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 8: Writer boundary locked (default safe state)
  // -------------------------------------------------------------------------
  // All upstream gates are ready for preview, but writer is locked in this step
  // This is the expected "good" state where upstream proof is complete but
  // writer instantiation is explicitly deferred to a future step
  
  const isPermissionPreviewReady = userConfirmationMarkerPermissionPreviewGateModel.status === 'permission_preview_ready_read_only'
  
  if (!isPermissionPreviewReady) {
    return {
      status: 'writer_boundary_locked',
      headline: 'Writer boundary locked',
      summary: `Writer readiness proof available but boundary is locked. ${completedProtectedCount} completed session(s) protected, ${futureTargetCount} future target(s) identified.`,
      confidence: 0.6,
      writerReadinessState: 'boundary_locked',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        'Writer instantiation locked in this step',
        'Marker permission not yet preview-ready',
        'Mutation deferred to future step',
      ],
      missingProof: ['Writer authorization (deferred)'],
      protectedInvariants,
      safetyNotes: [
        'Writer boundary locked by design',
        'All invariants protected',
        'Future step may unlock writer',
      ],
      nextSafeGate: 'MASTER-8C.38 pre-mutation lock',
      ...LOCKED_ACTION_FLAGS,
      ...TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 9: Writer boundary preview ready — read only
  // -------------------------------------------------------------------------
  // All upstream gates are ready and permission preview is ready
  // Writer boundary is conceptually ready but still locked for this step
  return {
    status: 'writer_boundary_preview_ready_read_only',
    headline: 'Writer boundary preview ready — read only',
    summary: `All upstream proof complete. Writer boundary conceptually ready for ${futureTargetCount} future target(s). ${completedProtectedCount} completed session(s) remain protected. No writer instantiated in this step.`,
    confidence: 0.8,
    writerReadinessState: 'preview_ready',
    completedProtectedCount,
    futureTargetCount,
    activeCautionCount,
    structuralPreviewCandidateCount,
    confirmationPermissionState: 'preview_ready',
    blockedReasons: [],
    missingProof: [],
    protectedInvariants,
    safetyNotes: [
      'Writer boundary preview ready',
      'All invariants protected',
      'Writer instantiation deferred to future step',
      'Read-only proof only — no mutation',
    ],
    nextSafeGate: 'MASTER-8C.38 pre-mutation lock / bundle closure',
    ...LOCKED_ACTION_FLAGS,
    ...TRUE_SAFETY_FLAGS,
  }
}

// =============================================================================
// LABEL HELPER
// =============================================================================

export function getFutureSessionMutationWriterReadinessStatusLabel(
  status: FutureSessionMutationWriterReadinessStatus
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
    case 'blocked_confirmation_permission_locked':
      return 'Permission Locked'
    case 'blocked_structural_preview_not_ready':
      return 'Structural Preview Locked'
    case 'blocked_writer_not_authorized':
      return 'Writer Not Authorized'
    case 'writer_boundary_locked':
      return 'Writer Boundary Locked'
    case 'writer_boundary_preview_ready_read_only':
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

export function getFutureSessionMutationWriterReadinessStatusColor(
  status: FutureSessionMutationWriterReadinessStatus
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
    case 'blocked_confirmation_permission_locked':
    case 'blocked_structural_preview_not_ready':
    case 'blocked_writer_not_authorized':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'writer_boundary_locked':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
        border: 'border-violet-500/20',
      }
    case 'writer_boundary_preview_ready_read_only':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
    case 'future_locked':
      return {
        bg: 'bg-[#1A1A2E]/60',
        text: 'text-[#8A8A9A]',
        border: 'border-[#2A2A35]/40',
      }
    default:
      return {
        bg: 'bg-[#1A1A2E]/60',
        text: 'text-[#8A8A9A]',
        border: 'border-[#2A2A35]/40',
      }
  }
}
