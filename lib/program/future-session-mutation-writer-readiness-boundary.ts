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
import { computeSemanticBlockerSummary } from './mutation-caution-semantic-blocker'

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
  // PRIORITY 2: Blocked by semantic hard blockers only
  // [P28.1] Use shared semantic helper as single source of truth
  // -------------------------------------------------------------------------
  const semanticBlockerSummary = computeSemanticBlockerSummary(mutationCautionClearanceGateModel)
  const semanticHardBlockerCount = semanticBlockerSummary.semanticHardBlockerCount
  const diagnosticOnlyCount = semanticBlockerSummary.diagnosticOnlyRootCandidateCount
  const clearableOnlyCount = semanticBlockerSummary.readOnlyClearableRootCandidateCount
  const cascadeOnlyCount = semanticBlockerSummary.derivedCascadeCautionCount
  
  if (semanticBlockerSummary.hasSemanticHardBlockers) {
    return {
      status: 'blocked_active_caution',
      headline: 'Writer readiness blocked by evidence requirements',
      summary: `${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} (blocking/waiting/unknown) must be resolved before writer boundary can proceed.`,
      confidence: 0.1,
      writerReadinessState: 'blocked_by_caution',
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      structuralPreviewCandidateCount,
      confirmationPermissionState,
      blockedReasons: [
        `${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} need evidence`,
        'Root/candidate clearance gate not ready',
        'Writer instantiation blocked by evidence requirements',
      ],
      missingProof: ['Evidence clearance'],
      protectedInvariants,
      safetyNotes: [
        'Hard blockers prevent writer boundary activation',
        diagnosticOnlyCount > 0 ? `${diagnosticOnlyCount} diagnostic-only (non-blocking)` : null,
        clearableOnlyCount > 0 ? `${clearableOnlyCount} clearable/read-only (non-blocking)` : null,
        cascadeOnlyCount > 0 ? `${cascadeOnlyCount} cascade echo${cascadeOnlyCount !== 1 ? 'es' : ''} (non-blocking)` : null,
      ].filter(Boolean) as string[],
      nextSafeGate: 'Resolve hard blockers (blocking/waiting/unknown) first',
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

// =============================================================================
// [PROMPT 74] FUTURE-SESSION MUTATION WRITER READINESS BOUNDARY
// MASTER-8C.79 / AB20.4.72 / Step 4 of 14
// Consumes Prompt 73 Controlled Durable Write Preflight Boundary
// Preview-only / no mutation / no write
// =============================================================================

import type { ControlledDurableWritePreflightBoundaryModel } from './controlled-durable-write-preflight-boundary'
import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'

/**
 * Prompt 74 status — writer readiness boundary consuming Prompt 73 preflight
 */
export type Prompt74WriterReadinessStatus =
  | 'writer_readiness_blocked_roadmap_source_missing'
  | 'writer_readiness_blocked_preflight_missing'
  | 'writer_readiness_blocked_preflight_not_ready'
  | 'writer_readiness_blocked_no_target_sessions'
  | 'writer_readiness_blocked_no_preview_changes'
  | 'writer_readiness_blocked_completed_session_protection_missing'
  | 'writer_readiness_blocked_write_invariant_violation'
  | 'writer_readiness_ready_preview_only'

/**
 * Prompt 74 item status
 */
export type Prompt74WriterReadinessItemStatus =
  | 'passed'
  | 'blocked'
  | 'failed'
  | 'protected'
  | 'pending'

/**
 * Prompt 74 readiness item
 */
export interface Prompt74WriterReadinessItem {
  readonly key: string
  readonly label: string
  readonly status: Prompt74WriterReadinessItemStatus
  readonly detail: string
}

/**
 * Prompt 74 Model — Future-Session Mutation Writer Readiness Boundary
 */
export interface Prompt74WriterReadinessBoundaryModel {
  readonly sourceStep: 'MASTER-8C.79 / AB20.4.72 / Prompt 74'
  readonly promptNumber: 74
  readonly totalPrompts: 84
  readonly status: Prompt74WriterReadinessStatus
  readonly headline: string
  readonly summary: string
  readonly writerReadinessPreviewReady: boolean
  readonly mutationWriterEnabled: false
  readonly futureSessionMutationEnabled: false
  readonly futureSessionsMutated: false
  readonly completedSessionsMutated: false
  readonly completedSessionsProtected: true
  readonly durableWriteEnabled: false
  readonly durablePersistenceEnabled: false
  readonly durableReceiptWritten: false
  readonly storageTouched: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly roadmapStepFound: boolean
  readonly roadmapTitle: string
  readonly roadmapVisibleProofTarget: string
  readonly upstreamPrompt73Status: string
  readonly upstreamPrompt73Ready: boolean
  readonly upstreamPrompt73Headline: string
  readonly targetSessionCount: number
  readonly previewChangeCount: number
  readonly candidateId: string
  readonly preflightValid: boolean
  readonly completedSessionProtectionValid: boolean
  readonly writeInvariantsValid: boolean
  readonly readinessItems: readonly Prompt74WriterReadinessItem[]
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

/**
 * Prompt 74 resolver input
 */
export interface Prompt74WriterReadinessBoundaryInput {
  readonly durableWritePreflightBoundaryModel: ControlledDurableWritePreflightBoundaryModel | null | undefined
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
}

// Locked flags for Prompt 74
const PROMPT74_LOCKED_FLAGS = {
  mutationWriterEnabled: false as const,
  futureSessionMutationEnabled: false as const,
  futureSessionsMutated: false as const,
  completedSessionsMutated: false as const,
  completedSessionsProtected: true as const,
  durableWriteEnabled: false as const,
  durablePersistenceEnabled: false as const,
  durableReceiptWritten: false as const,
  storageTouched: false as const,
  apiTouched: false as const,
  dbTouched: false as const,
  schemaTouched: false as const,
  programCardsChanged: false as const,
  startWorkoutChanged: false as const,
  liveWorkoutChanged: false as const,
}

// Safety notes for Prompt 74
const PROMPT74_SAFETY_NOTES: readonly string[] = [
  'Prompt 74 is preview-only; no future session mutation is performed.',
  'Completed sessions remain protected.',
  'Program Cards remain unchanged.',
  'Start Workout remains unchanged.',
  'Live Workout remains unchanged.',
  'No storage/API/DB/schema write is performed.',
  'Writer readiness preview may be ready only after Prompt 73 preflight is ready.',
]

/**
 * Resolve Prompt 74 Future-Session Mutation Writer Readiness Boundary
 */
export function resolvePrompt74WriterReadinessBoundary(
  input: Prompt74WriterReadinessBoundaryInput
): Prompt74WriterReadinessBoundaryModel {
  const { durableWritePreflightBoundaryModel, roadmapStep } = input

  // Base fields
  const baseFields = {
    sourceStep: 'MASTER-8C.79 / AB20.4.72 / Prompt 74' as const,
    promptNumber: 74 as const,
    totalPrompts: 84 as const,
    ...PROMPT74_LOCKED_FLAGS,
    safetyNotes: PROMPT74_SAFETY_NOTES,
  }

  // -------------------------------------------------------------------------
  // BLOCK: Roadmap source missing
  // -------------------------------------------------------------------------
  if (!roadmapStep) {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_roadmap_source_missing',
      headline: 'Writer readiness blocked — roadmap source missing',
      summary: 'Prompt 74 roadmap entry not found. Cannot verify writer readiness boundary.',
      writerReadinessPreviewReady: false,
      roadmapStepFound: false,
      roadmapTitle: '',
      roadmapVisibleProofTarget: '',
      upstreamPrompt73Status: 'unknown',
      upstreamPrompt73Ready: false,
      upstreamPrompt73Headline: '',
      targetSessionCount: 0,
      previewChangeCount: 0,
      candidateId: '',
      preflightValid: false,
      completedSessionProtectionValid: false,
      writeInvariantsValid: false,
      readinessItems: [],
      blockers: ['Prompt 74 roadmap source entry not found'],
      nextRequiredStep: 'Add Prompt 74 to roadmap source registry',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: Preflight model missing
  // -------------------------------------------------------------------------
  if (!durableWritePreflightBoundaryModel) {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_preflight_missing',
      headline: 'Writer readiness blocked — preflight missing',
      summary: 'Prompt 73 durable write preflight boundary model not available.',
      writerReadinessPreviewReady: false,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt73Status: 'missing',
      upstreamPrompt73Ready: false,
      upstreamPrompt73Headline: '',
      targetSessionCount: 0,
      previewChangeCount: 0,
      candidateId: '',
      preflightValid: false,
      completedSessionProtectionValid: false,
      writeInvariantsValid: false,
      readinessItems: [],
      blockers: ['Prompt 73 durable write preflight boundary model missing'],
      nextRequiredStep: 'Ensure Prompt 73 preflight model is computed',
    }
  }

  // Extract upstream values
  const {
    status: p73Status,
    headline: p73Headline,
    durableWritePreflightReady: p73Ready,
    targetSessionCount,
    previewChangeCount,
    candidateId,
    completedSessionsProtected: p73CompletedProtected,
    durableWriteEnabled: p73DurableWrite,
    durablePersistenceEnabled: p73DurablePersist,
    durableReceiptWritten: p73DurableReceipt,
    storageTouched: p73Storage,
    apiTouched: p73Api,
    dbTouched: p73Db,
    schemaTouched: p73Schema,
    programCardsChanged: p73ProgramCards,
    startWorkoutChanged: p73StartWorkout,
    liveWorkoutChanged: p73LiveWorkout,
  } = durableWritePreflightBoundaryModel

  // Check write invariants
  const writeInvariantsValid = (
    p73DurableWrite === false &&
    p73DurablePersist === false &&
    p73DurableReceipt === false &&
    p73Storage === false &&
    p73Api === false &&
    p73Db === false &&
    p73Schema === false &&
    p73ProgramCards === false &&
    p73StartWorkout === false &&
    p73LiveWorkout === false
  )

  // Build readiness items
  const readinessItems: Prompt74WriterReadinessItem[] = [
    {
      key: 'roadmap_source',
      label: 'Roadmap Source',
      status: 'passed',
      detail: 'Prompt 74 roadmap entry found',
    },
    {
      key: 'preflight_model',
      label: 'Preflight Model',
      status: 'passed',
      detail: 'Prompt 73 model available',
    },
    {
      key: 'preflight_ready',
      label: 'Preflight Ready',
      status: p73Ready ? 'passed' : 'blocked',
      detail: p73Ready ? 'Prompt 73 preflight ready' : `Prompt 73 status: ${p73Status}`,
    },
    {
      key: 'target_sessions',
      label: 'Target Sessions',
      status: targetSessionCount > 0 ? 'passed' : 'blocked',
      detail: `${targetSessionCount} target session(s)`,
    },
    {
      key: 'preview_changes',
      label: 'Preview Changes',
      status: previewChangeCount > 0 ? 'passed' : 'blocked',
      detail: `${previewChangeCount} preview change(s)`,
    },
    {
      key: 'completed_protection',
      label: 'Completed Protection',
      status: p73CompletedProtected ? 'passed' : 'blocked',
      detail: p73CompletedProtected ? 'Completed sessions protected' : 'Protection missing',
    },
    {
      key: 'write_invariants',
      label: 'Write Invariants',
      status: writeInvariantsValid ? 'passed' : 'blocked',
      detail: writeInvariantsValid ? 'All no-write invariants valid' : 'Write invariant violation',
    },
  ]

  // -------------------------------------------------------------------------
  // BLOCK: Preflight not ready
  // -------------------------------------------------------------------------
  if (!p73Ready || p73Status !== 'preflight_ready_no_write') {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_preflight_not_ready',
      headline: 'Writer readiness blocked — preflight not ready',
      summary: `Prompt 73 durable write preflight is not ready. Status: ${p73Status}`,
      writerReadinessPreviewReady: false,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt73Status: p73Status,
      upstreamPrompt73Ready: false,
      upstreamPrompt73Headline: p73Headline,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      preflightValid: false,
      completedSessionProtectionValid: p73CompletedProtected,
      writeInvariantsValid,
      readinessItems,
      blockers: [
        'Prompt 73 durable write preflight is not ready',
        `Upstream status: ${p73Status}`,
      ],
      nextRequiredStep: 'Complete Prompt 73 preflight requirements first',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: No target sessions
  // -------------------------------------------------------------------------
  if (targetSessionCount <= 0) {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_no_target_sessions',
      headline: 'Writer readiness blocked — no target sessions',
      summary: 'No future sessions identified for mutation. Writer readiness requires target sessions.',
      writerReadinessPreviewReady: false,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt73Status: p73Status,
      upstreamPrompt73Ready: true,
      upstreamPrompt73Headline: p73Headline,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      preflightValid: true,
      completedSessionProtectionValid: p73CompletedProtected,
      writeInvariantsValid,
      readinessItems,
      blockers: ['No target sessions identified'],
      nextRequiredStep: 'Identify future sessions for mutation',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: No preview changes
  // -------------------------------------------------------------------------
  if (previewChangeCount <= 0) {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_no_preview_changes',
      headline: 'Writer readiness blocked — no preview changes',
      summary: 'No preview changes computed. Writer readiness requires preview changes.',
      writerReadinessPreviewReady: false,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt73Status: p73Status,
      upstreamPrompt73Ready: true,
      upstreamPrompt73Headline: p73Headline,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      preflightValid: true,
      completedSessionProtectionValid: p73CompletedProtected,
      writeInvariantsValid,
      readinessItems,
      blockers: ['No preview changes computed'],
      nextRequiredStep: 'Compute preview changes before writer readiness',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: Completed session protection missing
  // -------------------------------------------------------------------------
  if (!p73CompletedProtected) {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_completed_session_protection_missing',
      headline: 'Writer readiness blocked — completed session protection missing',
      summary: 'Completed session protection is not confirmed. Writer readiness requires protection proof.',
      writerReadinessPreviewReady: false,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt73Status: p73Status,
      upstreamPrompt73Ready: true,
      upstreamPrompt73Headline: p73Headline,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      preflightValid: true,
      completedSessionProtectionValid: false,
      writeInvariantsValid,
      readinessItems,
      blockers: ['Completed session protection not confirmed'],
      nextRequiredStep: 'Confirm completed session protection',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: Write invariant violation
  // -------------------------------------------------------------------------
  if (!writeInvariantsValid) {
    return {
      ...baseFields,
      status: 'writer_readiness_blocked_write_invariant_violation',
      headline: 'Writer readiness blocked — write invariant violation',
      summary: 'One or more no-write invariants are violated. Writer readiness requires all invariants valid.',
      writerReadinessPreviewReady: false,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt73Status: p73Status,
      upstreamPrompt73Ready: true,
      upstreamPrompt73Headline: p73Headline,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      preflightValid: true,
      completedSessionProtectionValid: true,
      writeInvariantsValid: false,
      readinessItems,
      blockers: ['Write invariant violation detected'],
      nextRequiredStep: 'Fix write invariant violations',
    }
  }

  // -------------------------------------------------------------------------
  // READY: Preview-only
  // -------------------------------------------------------------------------
  return {
    ...baseFields,
    status: 'writer_readiness_ready_preview_only',
    headline: 'Writer readiness boundary ready — preview only',
    summary: `All Prompt 73 preflight checks passed. ${targetSessionCount} target session(s), ${previewChangeCount} preview change(s). Writer is NOT enabled — preview-only boundary.`,
    writerReadinessPreviewReady: true,
    roadmapStepFound: true,
    roadmapTitle: roadmapStep.title,
    roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
    upstreamPrompt73Status: p73Status,
    upstreamPrompt73Ready: true,
    upstreamPrompt73Headline: p73Headline,
    targetSessionCount,
    previewChangeCount,
    candidateId,
    preflightValid: true,
    completedSessionProtectionValid: true,
    writeInvariantsValid: true,
    readinessItems,
    blockers: [],
    nextRequiredStep: 'Prompt 75 — User-Confirmed Mutation Authorization Boundary',
  }
}

// =============================================================================
// [PROMPT 74] UI HELPERS
// =============================================================================

export function getPrompt74WriterReadinessStatusLabel(
  status: Prompt74WriterReadinessStatus
): string {
  switch (status) {
    case 'writer_readiness_blocked_roadmap_source_missing':
      return 'Blocked: Roadmap Missing'
    case 'writer_readiness_blocked_preflight_missing':
      return 'Blocked: Preflight Missing'
    case 'writer_readiness_blocked_preflight_not_ready':
      return 'Blocked: Preflight Not Ready'
    case 'writer_readiness_blocked_no_target_sessions':
      return 'Blocked: No Targets'
    case 'writer_readiness_blocked_no_preview_changes':
      return 'Blocked: No Changes'
    case 'writer_readiness_blocked_completed_session_protection_missing':
      return 'Blocked: Protection Missing'
    case 'writer_readiness_blocked_write_invariant_violation':
      return 'Blocked: Invariant Violation'
    case 'writer_readiness_ready_preview_only':
      return 'Ready: Preview Only'
    default:
      return 'Unknown'
  }
}

export function getPrompt74WriterReadinessStatusColor(
  status: Prompt74WriterReadinessStatus
): string {
  switch (status) {
    case 'writer_readiness_ready_preview_only':
      return 'lime'
    case 'writer_readiness_blocked_roadmap_source_missing':
    case 'writer_readiness_blocked_preflight_missing':
      return 'zinc'
    case 'writer_readiness_blocked_preflight_not_ready':
    case 'writer_readiness_blocked_no_target_sessions':
    case 'writer_readiness_blocked_no_preview_changes':
    case 'writer_readiness_blocked_completed_session_protection_missing':
      return 'amber'
    case 'writer_readiness_blocked_write_invariant_violation':
      return 'orange'
    default:
      return 'zinc'
  }
}

export function getPrompt74WriterReadinessItemStatusColor(
  status: Prompt74WriterReadinessItemStatus
): string {
  switch (status) {
    case 'passed':
      return 'lime'
    case 'blocked':
      return 'amber'
    case 'failed':
      return 'red'
    case 'protected':
      return 'cyan'
    case 'pending':
      return 'zinc'
    default:
      return 'zinc'
  }
}
