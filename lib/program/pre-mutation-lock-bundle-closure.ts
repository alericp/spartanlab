/**
 * MASTER-8C.38 / AB20.4.31 — Pre-Mutation Lock / Bundle Closure
 * 
 * Final read-only gate that summarizes whether the entire mutation-readiness
 * chain is closed, locked, and safe to proceed to the future mutation phase.
 * 
 * This is NOT a mutation step. This is a closure/proof step only.
 * 
 * INVARIANTS:
 * - Pure and deterministic
 * - No React imports
 * - No fetch, DB, localStorage, Date.now, Math.random
 * - No side effects, mutation, or writer execution
 * - All action flags remain false
 * - All safety flags remain true
 * - No `as any`, `@ts-ignore`, `@ts-expect-error`
 */

import type { PlanEvidenceTrendReadinessModel } from './plan-evidence-trend-readiness'
import type { MutationReadinessReviewGateModel } from './mutation-readiness-review-gate'
import type { MutationPathwayReadinessMapModel } from './mutation-pathway-readiness-map'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationConfirmationContractPreviewModel } from './mutation-confirmation-contract-preview'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import type { StructuralMutationPreviewContractModel } from './structural-mutation-preview-contract'
import type { UserConfirmationMarkerPermissionPreviewGateModel } from './user-confirmation-marker-permission-preview-gate'
import type { FutureSessionMutationWriterReadinessBoundaryModel } from './future-session-mutation-writer-readiness-boundary'
import { computeSemanticBlockerSummary } from './mutation-caution-semantic-blocker'

// =============================================================================
// STATUS TYPES
// =============================================================================

export type PreMutationLockBundleClosureStatus =
  | 'unavailable_missing_upstream'
  | 'locked_active_caution'
  | 'locked_no_future_targets'
  | 'locked_permission'
  | 'locked_structural_preview'
  | 'locked_writer_boundary'
  | 'bundle_closed_future_locked'
  | 'bundle_closed_preview_ready_read_only'

// =============================================================================
// GATE SUMMARY ITEM
// =============================================================================

export interface PreMutationGateSummaryItem {
  readonly gate: string
  readonly status: string
  readonly locked: boolean
  readonly reason: string
}

// =============================================================================
// PROTECTED INVARIANT
// =============================================================================

export interface PreMutationProtectedInvariant {
  readonly invariant: string
  readonly protected: boolean
  readonly scope: 'completed_sessions' | 'future_sessions' | 'marker' | 'program_cards' | 'start_workout' | 'live_workout' | 'persistence'
}

// =============================================================================
// MODEL
// =============================================================================

export interface PreMutationLockBundleClosureModel {
  readonly status: PreMutationLockBundleClosureStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: number
  readonly completedProtectedCount: number
  readonly futureTargetCount: number
  readonly activeCautionCount: number
  readonly gateSummary: readonly PreMutationGateSummaryItem[]
  readonly blockedReasons: readonly string[]
  readonly protectedInvariants: readonly PreMutationProtectedInvariant[]
  readonly nextSafeGate: string
  
  // Hard false action flags - mutation is NOT allowed
  readonly canMutateFutureSessions: false
  readonly canSaveMarker: false
  readonly canInstantiateWriter: false
  readonly canApplyProgramChanges: false
  readonly canChangeProgramCards: false
  readonly canChangeStartWorkout: false
  readonly canChangeLiveWorkout: false
  readonly canPersistMutation: false
  
  // Hard true safety flags - everything remains protected
  readonly completedSessionsProtected: true
  readonly futureSessionsLocked: true
  readonly markerLocked: true
  readonly programCardsUnchanged: true
  readonly startWorkoutUnchanged: true
  readonly liveWorkoutUnchanged: true
  readonly persistenceUnchanged: true
}

// =============================================================================
// INPUT
// =============================================================================

export interface PreMutationLockBundleClosureInput {
  readonly planEvidenceTrendReadinessModel: PlanEvidenceTrendReadinessModel | null
  readonly mutationReadinessReviewGateModel: MutationReadinessReviewGateModel | null
  readonly mutationPathwayReadinessMapModel: MutationPathwayReadinessMapModel | null
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null
  readonly mutationConfirmationContractPreviewModel: MutationConfirmationContractPreviewModel | null
  readonly mutationCautionClearanceGateModel: MutationCautionClearanceGateModel | null
  readonly structuralMutationPreviewContractModel: StructuralMutationPreviewContractModel | null
  readonly userConfirmationMarkerPermissionPreviewGateModel: UserConfirmationMarkerPermissionPreviewGateModel | null
  readonly futureSessionMutationWriterReadinessBoundaryModel: FutureSessionMutationWriterReadinessBoundaryModel | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const HARD_FALSE_ACTION_FLAGS = {
  canMutateFutureSessions: false as const,
  canSaveMarker: false as const,
  canInstantiateWriter: false as const,
  canApplyProgramChanges: false as const,
  canChangeProgramCards: false as const,
  canChangeStartWorkout: false as const,
  canChangeLiveWorkout: false as const,
  canPersistMutation: false as const,
}

const HARD_TRUE_SAFETY_FLAGS = {
  completedSessionsProtected: true as const,
  futureSessionsLocked: true as const,
  markerLocked: true as const,
  programCardsUnchanged: true as const,
  startWorkoutUnchanged: true as const,
  liveWorkoutUnchanged: true as const,
  persistenceUnchanged: true as const,
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolvePreMutationLockBundleClosure(
  input: PreMutationLockBundleClosureInput
): PreMutationLockBundleClosureModel {
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel,
    mutationCautionClearanceGateModel,
    structuralMutationPreviewContractModel,
    userConfirmationMarkerPermissionPreviewGateModel,
    futureSessionMutationWriterReadinessBoundaryModel,
  } = input

  // -------------------------------------------------------------------------
  // Build protected invariants (always true in this step)
  // -------------------------------------------------------------------------
  const protectedInvariants: PreMutationProtectedInvariant[] = [
    { invariant: 'Completed sessions remain unchanged', protected: true, scope: 'completed_sessions' },
    { invariant: 'Future sessions not written', protected: true, scope: 'future_sessions' },
    { invariant: 'No marker saved or applied', protected: true, scope: 'marker' },
    { invariant: 'Program Cards unchanged', protected: true, scope: 'program_cards' },
    { invariant: 'Start Workout unchanged', protected: true, scope: 'start_workout' },
    { invariant: 'Live Workout unchanged', protected: true, scope: 'live_workout' },
    { invariant: 'Persistence unchanged', protected: true, scope: 'persistence' },
  ]

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
    !userConfirmationMarkerPermissionPreviewGateModel ||
    !futureSessionMutationWriterReadinessBoundaryModel
  ) {
    const missingGates: string[] = []
    if (!planEvidenceTrendReadinessModel) missingGates.push('Plan Evidence Trend Readiness')
    if (!mutationReadinessReviewGateModel) missingGates.push('Mutation Readiness Review Gate')
    if (!mutationPathwayReadinessMapModel) missingGates.push('Mutation Pathway Readiness Map')
    if (!mutationTargetSessionResolutionPreviewModel) missingGates.push('Target Session Resolution Preview')
    if (!mutationConfirmationContractPreviewModel) missingGates.push('Confirmation Contract Preview')
    if (!mutationCautionClearanceGateModel) missingGates.push('Caution Clearance Gate')
    if (!structuralMutationPreviewContractModel) missingGates.push('Structural Mutation Preview Contract')
    if (!userConfirmationMarkerPermissionPreviewGateModel) missingGates.push('User Confirmation/Marker Permission Gate')
    if (!futureSessionMutationWriterReadinessBoundaryModel) missingGates.push('Future-session Writer Readiness Boundary')

    return {
      status: 'unavailable_missing_upstream',
      headline: 'Pre-Mutation Bundle Unavailable',
      summary: `Cannot close mutation-readiness bundle. Missing ${missingGates.length} upstream gate(s): ${missingGates.slice(0, 3).join(', ')}${missingGates.length > 3 ? ` and ${missingGates.length - 3} more` : ''}.`,
      confidence: 0,
      completedProtectedCount: 0,
      futureTargetCount: 0,
      activeCautionCount: 0,
      gateSummary: [],
      blockedReasons: missingGates.map(g => `Missing: ${g}`),
      protectedInvariants,
      nextSafeGate: 'Await upstream gate resolution',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // Extract counts from upstream models
  // -------------------------------------------------------------------------
  const completedProtectedCount = futureSessionMutationWriterReadinessBoundaryModel.completedProtectedCount
  const futureTargetCount = futureSessionMutationWriterReadinessBoundaryModel.futureTargetCount
  const activeCautionCount = futureSessionMutationWriterReadinessBoundaryModel.activeCautionCount

  // [P28.1] Use shared semantic helper as single source of truth
  const semanticBlockerSummary = computeSemanticBlockerSummary(mutationCautionClearanceGateModel)
  
  // -------------------------------------------------------------------------
  // GATE SUMMARY — Build summary of each upstream gate's status
  // -------------------------------------------------------------------------
  const gateSummary: PreMutationGateSummaryItem[] = [
    {
      gate: 'Caution Clearance',
      status: mutationCautionClearanceGateModel.status,
      locked: semanticBlockerSummary.hasSemanticHardBlockers,
      reason: semanticBlockerSummary.hasSemanticHardBlockers
        ? `${semanticBlockerSummary.semanticHardBlockerCount} hard blocker(s)`
        : semanticBlockerSummary.rootCandidateClearanceReady ? 'Cleared' : 'Pending',
    },
    {
      gate: 'Target Resolution',
      status: mutationTargetSessionResolutionPreviewModel.status,
      locked: mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets',
      reason: mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets'
        ? 'No future sessions to target'
        : `${futureTargetCount} future target(s)`,
    },
    {
      gate: 'Structural Preview',
      status: structuralMutationPreviewContractModel.status,
      locked: !structuralMutationPreviewContractModel.status.includes('preview_ready'),
      reason: structuralMutationPreviewContractModel.headline,
    },
    {
      gate: 'Permission Gate',
      status: userConfirmationMarkerPermissionPreviewGateModel.status,
      locked: !userConfirmationMarkerPermissionPreviewGateModel.status.includes('preview_ready'),
      reason: userConfirmationMarkerPermissionPreviewGateModel.headline,
    },
    {
      gate: 'Writer Boundary',
      status: futureSessionMutationWriterReadinessBoundaryModel.status,
      // [P36] writer_boundary_locked is a valid safe state, not a blocker
      locked: !futureSessionMutationWriterReadinessBoundaryModel.status.includes('preview_ready') &&
              futureSessionMutationWriterReadinessBoundaryModel.status !== 'writer_boundary_locked',
      reason: futureSessionMutationWriterReadinessBoundaryModel.headline,
    },
  ]

  const lockedGates = gateSummary.filter(g => g.locked)

  // -------------------------------------------------------------------------
  // PRIORITY 2: Blocked by semantic hard blockers only
  // [P28.1] Use shared semantic helper as single source of truth
  // -------------------------------------------------------------------------
  const semanticHardBlockerCount = semanticBlockerSummary.semanticHardBlockerCount
  const diagnosticOnlyCount = semanticBlockerSummary.diagnosticOnlyRootCandidateCount
  const clearableOnlyCount = semanticBlockerSummary.readOnlyClearableRootCandidateCount
  const cascadeOnlyCount = semanticBlockerSummary.derivedCascadeCautionCount
  
  if (semanticBlockerSummary.hasSemanticHardBlockers) {
    return {
      status: 'locked_active_caution',
      headline: 'Pre-Mutation Locked: Evidence Required',
      summary: `Bundle closure blocked by ${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} (blocking/waiting/unknown). All sessions remain protected.`,
      confidence: 0.85,
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      gateSummary,
      blockedReasons: [
        `${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} need evidence`,
        'Root/candidate clearance gate not ready',
        ...lockedGates.slice(0, 2).map(g => `${g.gate}: ${g.reason}`),
        // Non-blocking context as info only
        diagnosticOnlyCount > 0 ? `(${diagnosticOnlyCount} diagnostic-only, non-blocking)` : '',
        clearableOnlyCount > 0 ? `(${clearableOnlyCount} clearable/read-only, non-blocking)` : '',
        cascadeOnlyCount > 0 ? `(${cascadeOnlyCount} cascade echo${cascadeOnlyCount !== 1 ? 'es' : ''}, non-blocking)` : '',
      ].filter(Boolean),
      protectedInvariants,
      nextSafeGate: 'Resolve hard blockers (blocking/waiting/unknown) before mutation can proceed',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 3: Blocked by no future targets
  // -------------------------------------------------------------------------
  if (
    mutationTargetSessionResolutionPreviewModel.status === 'no_future_targets' ||
    futureTargetCount === 0
  ) {
    return {
      status: 'locked_no_future_targets',
      headline: 'Pre-Mutation Locked: No Future Targets',
      summary: `Bundle closure blocked because no future sessions exist to target. ${completedProtectedCount} completed session(s) remain protected. Mutation requires at least one future session.`,
      confidence: 0.9,
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      gateSummary,
      blockedReasons: [
        'No future sessions available for mutation',
        `${completedProtectedCount} completed session(s) are protected`,
        'Target resolution gate blocked',
      ],
      protectedInvariants,
      nextSafeGate: 'Add future sessions or generate new program phase',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 4: Blocked by permission gate
  // -------------------------------------------------------------------------
  if (
    !userConfirmationMarkerPermissionPreviewGateModel.status.includes('preview_ready')
  ) {
    return {
      status: 'locked_permission',
      headline: 'Pre-Mutation Locked: Permission Gate',
      summary: `Bundle closure blocked by permission gate. User confirmation/marker permission is not ready. ${futureTargetCount} future session(s) identified but locked.`,
      confidence: 0.85,
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      gateSummary,
      blockedReasons: [
        'Permission gate not in preview-ready state',
        `Permission status: ${userConfirmationMarkerPermissionPreviewGateModel.status}`,
        ...lockedGates.slice(0, 2).map(g => `${g.gate}: locked`),
      ],
      protectedInvariants,
      nextSafeGate: 'Await permission gate resolution',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 5: Blocked by structural preview
  // -------------------------------------------------------------------------
  if (
    !structuralMutationPreviewContractModel.status.includes('preview_ready')
  ) {
    return {
      status: 'locked_structural_preview',
      headline: 'Pre-Mutation Locked: Structural Preview',
      summary: `Bundle closure blocked by structural mutation preview contract. Structural preview is not ready. ${futureTargetCount} future session(s) identified but locked.`,
      confidence: 0.85,
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      gateSummary,
      blockedReasons: [
        'Structural preview not in ready state',
        `Structural status: ${structuralMutationPreviewContractModel.status}`,
        ...lockedGates.slice(0, 2).map(g => `${g.gate}: locked`),
      ],
      protectedInvariants,
      nextSafeGate: 'Await structural preview resolution',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 6: Blocked by writer boundary
  // [P36] Accept writer_boundary_locked as a valid safe state
  // writer_boundary_locked means upstream proof is complete, writer is just locked by design
  // -------------------------------------------------------------------------
  if (
    !futureSessionMutationWriterReadinessBoundaryModel.status.includes('preview_ready') &&
    futureSessionMutationWriterReadinessBoundaryModel.status !== 'writer_boundary_locked'
  ) {
    return {
      status: 'locked_writer_boundary',
      headline: 'Pre-Mutation Locked: Writer Boundary',
      summary: `Bundle closure blocked by writer readiness boundary. Writer is not ready. ${futureTargetCount} future session(s) identified but locked pending writer authorization.`,
      confidence: 0.85,
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      gateSummary,
      blockedReasons: [
        'Writer boundary not in preview-ready state',
        `Writer status: ${futureSessionMutationWriterReadinessBoundaryModel.status}`,
        ...lockedGates.slice(0, 1).map(g => `${g.gate}: locked`),
      ],
      protectedInvariants,
      nextSafeGate: 'Await writer boundary authorization',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 7: All gates preview-ready but still future-locked
  // -------------------------------------------------------------------------
  // Even if all upstream gates are in preview-ready state, this step
  // does NOT allow mutation. The bundle is closed but future-locked.
  
  const allGatesReady = lockedGates.length === 0

  if (allGatesReady) {
    return {
      status: 'bundle_closed_preview_ready_read_only',
      headline: 'Bundle Closed — Preview Ready (Read-Only)',
      summary: `All ${gateSummary.length} upstream gates are preview-ready. ${completedProtectedCount} completed session(s) protected. ${futureTargetCount} future session(s) identified. Mutation-readiness bundle closed. Awaiting explicit authorization for controlled mutation.`,
      confidence: 0.95,
      completedProtectedCount,
      futureTargetCount,
      activeCautionCount,
      gateSummary,
      blockedReasons: [
        'Mutation not authorized in this step',
        'Bundle closed for preview only',
        'Controlled mutation requires explicit next-step authorization',
      ],
      protectedInvariants,
      nextSafeGate: 'MASTER-8C.39 controlled mutation writer (if explicitly authorized)',
      ...HARD_FALSE_ACTION_FLAGS,
      ...HARD_TRUE_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // FALLBACK: Bundle closed but future-locked
  // -------------------------------------------------------------------------
  return {
    status: 'bundle_closed_future_locked',
    headline: 'Bundle Closed — Future Locked',
    summary: `Mutation-readiness bundle closed with ${lockedGates.length} gate(s) still locked. ${completedProtectedCount} completed session(s) protected. ${futureTargetCount} future session(s) locked. No mutation can proceed.`,
    confidence: 0.8,
    completedProtectedCount,
    futureTargetCount,
    activeCautionCount,
    gateSummary,
    blockedReasons: lockedGates.map(g => `${g.gate}: ${g.reason}`),
    protectedInvariants,
    nextSafeGate: 'Resolve locked gates before mutation can proceed',
    ...HARD_FALSE_ACTION_FLAGS,
    ...HARD_TRUE_SAFETY_FLAGS,
  }
}

// =============================================================================
// STATUS LABEL HELPER
// =============================================================================

export function getPreMutationLockBundleClosureStatusLabel(
  status: PreMutationLockBundleClosureStatus
): string {
  switch (status) {
    case 'unavailable_missing_upstream':
      return 'Unavailable'
    case 'locked_active_caution':
      return 'Locked: Active Caution'
    case 'locked_no_future_targets':
      return 'Locked: No Future Targets'
    case 'locked_permission':
      return 'Locked: Permission Gate'
    case 'locked_structural_preview':
      return 'Locked: Structural Preview'
    case 'locked_writer_boundary':
      return 'Locked: Writer Boundary'
    case 'bundle_closed_future_locked':
      return 'Bundle Closed — Future Locked'
    case 'bundle_closed_preview_ready_read_only':
      return 'Bundle Closed — Preview Ready'
    default:
      return 'Unknown'
  }
}

// =============================================================================
// STATUS COLOR HELPER
// =============================================================================

export function getPreMutationLockBundleClosureStatusColor(
  status: PreMutationLockBundleClosureStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_upstream':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'locked_active_caution':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'locked_no_future_targets':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'locked_permission':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
        border: 'border-violet-500/20',
      }
    case 'locked_structural_preview':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    case 'locked_writer_boundary':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
        border: 'border-rose-500/20',
      }
    case 'bundle_closed_future_locked':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'bundle_closed_preview_ready_read_only':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
  }
}
