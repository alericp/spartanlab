/**
 * MASTER-8C.39 / AB20.4.32: Controlled Future-Session Mutation Writer Dry-Run
 * 
 * This is the first real controlled mutation-writer corridor step. It produces
 * a JSON-safe "would mutate" envelope only when upstream gates allow it.
 * 
 * CRITICAL INVARIANTS:
 * - Pure TypeScript, no React
 * - No fetch/DB/localStorage/sessionStorage/window/document
 * - No Date.now() or Math.random()
 * - No save/write/apply functions
 * - Dry-run only - produces preview envelope, never mutates
 * - All apply/write flags permanently false
 * - All safety flags permanently true
 */

import type { PreMutationLockBundleClosureModel } from './pre-mutation-lock-bundle-closure'
import type { FutureSessionMutationWriterReadinessBoundaryModel } from './future-session-mutation-writer-readiness-boundary'
import type { StructuralMutationPreviewContractModel } from './structural-mutation-preview-contract'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import type { UserConfirmationMarkerPermissionPreviewGateModel } from './user-confirmation-marker-permission-preview-gate'

// =============================================================================
// STATUS TYPES
// =============================================================================

export type ControlledFutureSessionMutationWriterDryRunStatus =
  | 'unavailable_missing_upstream'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_permission_locked'
  | 'blocked_pre_mutation_lock'
  | 'blocked_writer_boundary'
  | 'dry_run_ready_preview_only'
  | 'dry_run_empty_preview_only'

// =============================================================================
// OPERATION TYPES
// =============================================================================

export type DryRunOperationKind =
  | 'add_exercise'
  | 'remove_exercise'
  | 'modify_sets'
  | 'modify_reps'
  | 'modify_weight'
  | 'modify_rest'
  | 'swap_exercise'
  | 'reorder_exercise'
  | 'modify_intensity'
  | 'structural_change'
  | 'unknown'

export type DryRunSafetyClassification =
  | 'safe_preview'
  | 'requires_confirmation'
  | 'blocked_by_caution'
  | 'blocked_by_permission'
  | 'blocked_by_lock'

export interface ControlledFutureSessionMutationDryRunOperation {
  readonly operationId: string
  readonly sourceCandidateId: string
  readonly title: string
  readonly actionType: string
  readonly targetDayNumbers: readonly number[]
  readonly targetLabels: readonly string[]
  readonly operationKind: DryRunOperationKind
  readonly beforeSummary: string
  readonly afterSummary: string
  readonly reason: string
  readonly blockedReason: string | null
  readonly safetyClassification: DryRunSafetyClassification
  readonly willApplyNow: false
}

// =============================================================================
// ENVELOPE MODEL
// =============================================================================

export interface ControlledFutureSessionMutationDryRunEnvelope {
  readonly status: ControlledFutureSessionMutationWriterDryRunStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: number
  
  // Target metrics
  readonly targetDayNumbers: readonly number[]
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly activeCautionCount: number
  
  // Operations
  readonly operationCount: number
  readonly operations: readonly ControlledFutureSessionMutationDryRunOperation[]
  
  // Blocking/safety
  readonly blockedReasons: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string
  
  // Hard false flags - NEVER true in this step
  readonly canWriteSessions: false
  readonly canPersistProgram: false
  readonly canSaveMarker: false
  readonly canChangeProgramCards: false
  readonly canChangeStartWorkout: false
  readonly canChangeLiveWorkout: false
  readonly canApplyStructuralMutation: false
  
  // Hard true flags - ALWAYS true in this step
  readonly dryRunOnly: true
  readonly completedSessionsProtected: true
  readonly futureSessionsPreviewOnly: true
  readonly noProgramChangesApplied: true
  readonly noMarkerSaved: true
  readonly noLiveWorkoutChangesApplied: true
}

// =============================================================================
// INPUT TYPE
// =============================================================================

export interface ControlledFutureSessionMutationWriterDryRunInput {
  readonly preMutationLockBundleClosureModel: PreMutationLockBundleClosureModel | null
  readonly futureSessionMutationWriterReadinessBoundaryModel: FutureSessionMutationWriterReadinessBoundaryModel | null
  readonly structuralMutationPreviewContractModel: StructuralMutationPreviewContractModel | null
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null
  readonly mutationCautionClearanceGateModel: MutationCautionClearanceGateModel | null
  readonly userConfirmationMarkerPermissionPreviewGateModel: UserConfirmationMarkerPermissionPreviewGateModel | null
}

// =============================================================================
// HELPER: Create deterministic operation ID
// =============================================================================

function createDeterministicOperationId(
  sourceCandidateId: string,
  targetDayNumbers: readonly number[],
  index: number
): string {
  const dayPart = targetDayNumbers.slice().sort((a, b) => a - b).join('-')
  return `dry-run-op-${sourceCandidateId}-days-${dayPart}-idx-${index}`
}

// =============================================================================
// HELPER: Map operation kind from candidate
// =============================================================================

function mapOperationKind(candidateType: string): DryRunOperationKind {
  const typeNormalized = candidateType.toLowerCase()
  if (typeNormalized.includes('add')) return 'add_exercise'
  if (typeNormalized.includes('remove')) return 'remove_exercise'
  if (typeNormalized.includes('set')) return 'modify_sets'
  if (typeNormalized.includes('rep')) return 'modify_reps'
  if (typeNormalized.includes('weight') || typeNormalized.includes('load')) return 'modify_weight'
  if (typeNormalized.includes('rest')) return 'modify_rest'
  if (typeNormalized.includes('swap') || typeNormalized.includes('replace')) return 'swap_exercise'
  if (typeNormalized.includes('reorder') || typeNormalized.includes('move')) return 'reorder_exercise'
  if (typeNormalized.includes('intensity') || typeNormalized.includes('volume')) return 'modify_intensity'
  if (typeNormalized.includes('structural')) return 'structural_change'
  return 'unknown'
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveControlledFutureSessionMutationWriterDryRun(
  input: ControlledFutureSessionMutationWriterDryRunInput
): ControlledFutureSessionMutationDryRunEnvelope {
  const {
    preMutationLockBundleClosureModel,
    futureSessionMutationWriterReadinessBoundaryModel,
    structuralMutationPreviewContractModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationCautionClearanceGateModel,
    userConfirmationMarkerPermissionPreviewGateModel,
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
  
  // Get target day numbers from future session candidates
  const targetDayNumbers: number[] = 
    mutationTargetSessionResolutionPreviewModel?.futureSessionCandidates
      ?.map(c => c.dayNumber)
      ?.filter((d): d is number => typeof d === 'number') ?? []
  
  // Hard false flags - NEVER change
  const hardFalseFlags = {
    canWriteSessions: false as const,
    canPersistProgram: false as const,
    canSaveMarker: false as const,
    canChangeProgramCards: false as const,
    canChangeStartWorkout: false as const,
    canChangeLiveWorkout: false as const,
    canApplyStructuralMutation: false as const,
  }
  
  // Hard true flags - NEVER change
  const hardTrueFlags = {
    dryRunOnly: true as const,
    completedSessionsProtected: true as const,
    futureSessionsPreviewOnly: true as const,
    noProgramChangesApplied: true as const,
    noMarkerSaved: true as const,
    noLiveWorkoutChangesApplied: true as const,
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 1: Missing upstream models
  // -------------------------------------------------------------------------
  if (
    !preMutationLockBundleClosureModel ||
    !futureSessionMutationWriterReadinessBoundaryModel ||
    !structuralMutationPreviewContractModel ||
    !mutationTargetSessionResolutionPreviewModel ||
    !mutationCautionClearanceGateModel ||
    !userConfirmationMarkerPermissionPreviewGateModel
  ) {
    return {
      status: 'unavailable_missing_upstream',
      headline: 'Dry-Run Writer Unavailable',
      summary: 'One or more upstream gate models are missing. The dry-run writer cannot produce an envelope without complete upstream proof.',
      confidence: 0,
      targetDayNumbers,
      targetSessionCount: 0,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: ['Missing upstream gate models'],
      safetyNotes: ['All mutation capabilities locked', 'Completed sessions protected'],
      nextSafeGate: 'Ensure all Plan Logic gates are populated',
      ...hardFalseFlags,
      ...hardTrueFlags,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 2: Active caution blocks dry-run
  // -------------------------------------------------------------------------
  if (
    mutationCautionClearanceGateModel.status === 'blocked_active_caution' ||
    activeCautionCount > 0
  ) {
    return {
      status: 'blocked_active_caution',
      headline: 'Dry-Run Blocked — Evidence Required',
      summary: `${activeCautionCount} evidence item(s) detected. The dry-run writer is blocked until evidence conditions are resolved.`,
      confidence: 0.2,
      targetDayNumbers,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: [
        `${activeCautionCount} active caution(s) blocking dry-run`,
        'Caution clearance gate not passed',
        'Dry-run writer requires caution resolution',
      ],
      safetyNotes: [
        'Completed sessions protected',
        'Future sessions preview-only',
        'No mutation allowed while caution active',
      ],
      nextSafeGate: 'Resolve or acknowledge active cautions',
      ...hardFalseFlags,
      ...hardTrueFlags,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 3: No future targets
  // -------------------------------------------------------------------------
  if (
    mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets' ||
    futureTargetCount === 0
  ) {
    return {
      status: 'blocked_no_future_targets',
      headline: 'Dry-Run Blocked — No Future Targets',
      summary: 'No future sessions are available for mutation. The program may be complete or all sessions are already logged.',
      confidence: 0.3,
      targetDayNumbers: [],
      targetSessionCount: 0,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: [
        'No future sessions available',
        `${completedProtectedCount} completed sessions are protected`,
        'Dry-run writer has no valid targets',
      ],
      safetyNotes: [
        'Completed sessions protected from modification',
        'No future sessions to preview',
        'Program state preserved',
      ],
      nextSafeGate: 'Wait for new program or future sessions',
      ...hardFalseFlags,
      ...hardTrueFlags,
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
      headline: 'Dry-Run Blocked by Permission Gate',
      summary: 'The user confirmation / marker permission gate is not in preview-ready state. Dry-run writer cannot proceed without permission readiness.',
      confidence: 0.25,
      targetDayNumbers,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: [
        'Permission gate not preview-ready',
        `Permission status: ${userConfirmationMarkerPermissionPreviewGateModel.status}`,
        'No confirmation UI available',
      ],
      safetyNotes: [
        'No marker can be saved',
        'Completed sessions protected',
        'Future sessions preview-only',
      ],
      nextSafeGate: 'Resolve permission gate blockers',
      ...hardFalseFlags,
      ...hardTrueFlags,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 5: Pre-mutation lock not ready
  // -------------------------------------------------------------------------
  if (preMutationLockBundleClosureModel.status !== 'bundle_closed_preview_ready_read_only') {
    return {
      status: 'blocked_pre_mutation_lock',
      headline: 'Dry-Run Blocked by Pre-Mutation Lock',
      summary: `Pre-mutation lock status is "${preMutationLockBundleClosureModel.status}". The bundle must be in preview-ready state for dry-run operations.`,
      confidence: 0.3,
      targetDayNumbers,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: [
        `Pre-mutation lock status: ${preMutationLockBundleClosureModel.status}`,
        'Bundle not in preview-ready state',
        'Dry-run writer requires bundle closure',
      ],
      safetyNotes: [
        'All mutation capabilities locked',
        'Completed sessions protected',
        'Future sessions preview-only',
      ],
      nextSafeGate: 'Resolve pre-mutation lock blockers',
      ...hardFalseFlags,
      ...hardTrueFlags,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 6: Writer boundary not ready
  // -------------------------------------------------------------------------
  if (
    futureSessionMutationWriterReadinessBoundaryModel.status !== 'writer_boundary_preview_ready_read_only'
  ) {
    return {
      status: 'blocked_writer_boundary',
      headline: 'Dry-Run Blocked by Writer Boundary',
      summary: `Writer boundary status is "${futureSessionMutationWriterReadinessBoundaryModel.status}". The boundary must be in preview-ready state for dry-run operations.`,
      confidence: 0.35,
      targetDayNumbers,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: [
        `Writer boundary status: ${futureSessionMutationWriterReadinessBoundaryModel.status}`,
        'Writer boundary not in preview-ready state',
        'Dry-run writer requires writer boundary readiness',
      ],
      safetyNotes: [
        'No writer instantiated',
        'Completed sessions protected',
        'Future sessions preview-only',
      ],
      nextSafeGate: 'Resolve writer boundary blockers',
      ...hardFalseFlags,
      ...hardTrueFlags,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 7: Check for preview-ready candidates
  // -------------------------------------------------------------------------
  const previewCandidates = structuralMutationPreviewContractModel.previewCandidates ?? []
  const previewReadyCandidates = previewCandidates.filter(
    c => c.status === 'preview_ready_read_only'
  )
  
  if (previewReadyCandidates.length === 0) {
    return {
      status: 'dry_run_empty_preview_only',
      headline: 'Dry-Run Ready — No Preview Candidates',
      summary: 'All upstream gates are preview-ready, but no structural mutation preview candidates are available. The dry-run envelope is empty.',
      confidence: 0.7,
      targetDayNumbers,
      targetSessionCount: futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      operationCount: 0,
      operations: [],
      blockedReasons: [],
      safetyNotes: [
        'All gates preview-ready',
        'No mutation candidates available',
        'Completed sessions protected',
        'Future sessions preview-only',
      ],
      nextSafeGate: 'Wait for coach recommendation candidates or user-initiated mutation request',
      ...hardFalseFlags,
      ...hardTrueFlags,
    }
  }
  
  // -------------------------------------------------------------------------
  // PRIORITY 8: Build dry-run operations from preview candidates
  // -------------------------------------------------------------------------
  const operations: ControlledFutureSessionMutationDryRunOperation[] = []
  
  previewReadyCandidates.forEach((candidate, index) => {
    const candidateTargetDays = candidate.targetDayNumbers ?? targetDayNumbers
    const operationId = createDeterministicOperationId(
      candidate.sourceCandidateId,
      candidateTargetDays,
      index
    )
    
    operations.push({
      operationId,
      sourceCandidateId: candidate.sourceCandidateId,
      title: candidate.title ?? `Mutation Candidate ${index + 1}`,
      actionType: candidate.category ?? 'structural_change',
      targetDayNumbers: candidateTargetDays,
      targetLabels: candidate.targetLabels ?? candidateTargetDays.map(d => `Day ${d}`),
      operationKind: mapOperationKind(candidate.category ?? 'structural_change'),
      beforeSummary: candidate.previewOnlySummary ?? 'Current session state',
      afterSummary: candidate.conceptualProposedPreviewSummary ?? 'Proposed session state',
      reason: 'Coach recommendation or user preference',
      blockedReason: null,
      safetyClassification: 'safe_preview',
      willApplyNow: false,
    })
  })
  
  // Collect unique target day numbers from operations
  const allTargetDays = new Set<number>()
  operations.forEach(op => op.targetDayNumbers.forEach(d => allTargetDays.add(d)))
  const uniqueTargetDays = Array.from(allTargetDays).sort((a, b) => a - b)
  
  return {
    status: 'dry_run_ready_preview_only',
    headline: 'Dry-Run Ready — Preview Operations Available',
    summary: `${operations.length} dry-run operation(s) prepared for ${uniqueTargetDays.length} future session(s). All operations are preview-only. No mutation will occur until explicitly authorized.`,
    confidence: 0.85,
    targetDayNumbers: uniqueTargetDays,
    targetSessionCount: uniqueTargetDays.length,
    completedProtectedCount,
    activeCautionCount,
    operationCount: operations.length,
    operations,
    blockedReasons: [],
    safetyNotes: [
      'Dry-run only — no sessions written',
      'All operations preview-only',
      'Completed sessions protected',
      'Future sessions preview-only',
      'No marker saved',
      'No Program Cards changed',
      'No Start Workout changes',
      'No Live Workout changes',
    ],
    nextSafeGate: 'MASTER-8C.40 user confirmation or bounded mutation apply gate',
    ...hardFalseFlags,
    ...hardTrueFlags,
  }
}

// =============================================================================
// STATUS LABEL HELPER
// =============================================================================

export function getControlledFutureSessionMutationWriterDryRunStatusLabel(
  status: ControlledFutureSessionMutationWriterDryRunStatus
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
    case 'blocked_writer_boundary':
      return 'Blocked: Writer Boundary'
    case 'dry_run_ready_preview_only':
      return 'Dry Run Ready'
    case 'dry_run_empty_preview_only':
      return 'Dry Run Empty'
    default:
      return 'Unknown'
  }
}

// =============================================================================
// STATUS COLOR HELPER
// =============================================================================

export function getControlledFutureSessionMutationWriterDryRunStatusColor(
  status: ControlledFutureSessionMutationWriterDryRunStatus
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
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'blocked_permission_locked':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
        border: 'border-violet-500/20',
      }
    case 'blocked_pre_mutation_lock':
      return {
        bg: 'bg-fuchsia-500/10',
        text: 'text-fuchsia-400/70',
        border: 'border-fuchsia-500/20',
      }
    case 'blocked_writer_boundary':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
        border: 'border-rose-500/20',
      }
    case 'dry_run_ready_preview_only':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    case 'dry_run_empty_preview_only':
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
