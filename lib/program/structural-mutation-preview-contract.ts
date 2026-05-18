/**
 * MASTER-8C.35 / AB20.4.28 — Structural Mutation Preview Contract
 * 
 * Pure, deterministic, read-only contract that determines whether
 * the system would be allowed to build a structural mutation preview
 * in a future step. This does NOT perform mutation — it only creates
 * preview-readiness proof.
 * 
 * Sits after: evidence → target resolution → caution clearing
 * Before: user confirmation → future-session mutation → Program Card proof
 * 
 * CONSTRAINTS:
 * - Pure function, no side effects
 * - No Date.now(), Math.random(), localStorage, fetch, DB, React
 * - Never mutates program/session/exercise/set/rep data
 * - Never saves markers
 * - Never claims actual structural mutation happened
 */

import type { PlanEvidenceTrendReadinessModel } from './plan-evidence-trend-readiness'
import type { MutationReadinessReviewGateModel } from './mutation-readiness-review-gate'
import type { MutationPathwayReadinessMapModel } from './mutation-pathway-readiness-map'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationConfirmationContractPreviewModel } from './mutation-confirmation-contract-preview'
import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'
import { computeSemanticBlockerSummary } from './mutation-caution-semantic-blocker'

// =============================================================================
// STATUS TYPES
// =============================================================================

export type StructuralMutationPreviewContractStatus =
  | 'unavailable'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_completed_only'
  | 'blocked_target_unresolved'
  | 'waiting_for_confirmation_contract'
  | 'preview_contract_ready_read_only'
  | 'future_locked'

export type StructuralPreviewCandidateStatus =
  | 'blocked'
  | 'caution_blocked'
  | 'target_unresolved'
  | 'completed_protected'
  | 'no_future_target'
  | 'waiting_confirmation'
  | 'preview_ready_read_only'

// =============================================================================
// CANDIDATE PREVIEW TYPE
// =============================================================================

export interface StructuralPreviewCandidate {
  readonly sourceCandidateId: string
  readonly title: string
  readonly category: string
  readonly status: StructuralPreviewCandidateStatus
  readonly targetDayNumbers: readonly number[]
  readonly targetLabels: readonly string[]
  readonly blockedReasons: readonly string[]
  readonly previewOnlySummary: string
  readonly conceptualProposedPreviewSummary: string
  readonly beforeAfterAvailable: false
  readonly structuralMutationAllowed: false
  readonly markerWriteAllowed: false
  readonly programCardChangeAllowed: false
  readonly liveWorkoutBridgeAllowed: false
}

// =============================================================================
// MODEL TYPE
// =============================================================================

export interface StructuralMutationPreviewContractModel {
  readonly status: StructuralMutationPreviewContractStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: 'high' | 'medium' | 'low' | 'none'
  readonly candidatePreviewCount: number
  readonly blockedPreviewCount: number
  readonly futureTargetCount: number
  readonly completedProtectedCount: number
  readonly activeCautionCount: number
  readonly previewCandidates: readonly StructuralPreviewCandidate[]
  readonly blockedReasons: readonly string[]
  readonly missingProof: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string

  // All permission flags locked false in this step
  readonly canBuildStructuralPreview: false
  readonly canShowConfirmationUi: false
  readonly canWriteMarker: false
  readonly canApplyStructuralMutation: false
  readonly canChangeProgramCards: false
  readonly canBridgeLiveWorkout: false

  // All safety flags locked true
  readonly noProgramChangesApplied: true
  readonly noMarkerSaved: true
  readonly noFutureSessionChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
}

// =============================================================================
// RESOLVER INPUT
// =============================================================================

export interface StructuralMutationPreviewContractInput {
  readonly planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  readonly mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  readonly mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
  readonly mutationTargetSessionResolutionPreviewModel?: MutationTargetSessionResolutionPreviewModel | null
  readonly mutationConfirmationContractPreviewModel?: MutationConfirmationContractPreviewModel | null
  readonly mutationCautionClearanceGateModel?: MutationCautionClearanceGateModel | null
}

// =============================================================================
// LOCKED FLAGS (constant)
// =============================================================================

const LOCKED_PERMISSION_FLAGS = {
  canBuildStructuralPreview: false as const,
  canShowConfirmationUi: false as const,
  canWriteMarker: false as const,
  canApplyStructuralMutation: false as const,
  canChangeProgramCards: false as const,
  canBridgeLiveWorkout: false as const,
}

const LOCKED_SAFETY_FLAGS = {
  noProgramChangesApplied: true as const,
  noMarkerSaved: true as const,
  noFutureSessionChangesApplied: true as const,
  noProgramCardChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

export function resolveStructuralMutationPreviewContract(
  input: StructuralMutationPreviewContractInput
): StructuralMutationPreviewContractModel {
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel,
    mutationCautionClearanceGateModel,
  } = input

  // -------------------------------------------------------------------------
  // PRIORITY 1: Unavailable if critical upstream models missing
  // -------------------------------------------------------------------------
  if (
    !mutationTargetSessionResolutionPreviewModel ||
    !mutationConfirmationContractPreviewModel ||
    !mutationCautionClearanceGateModel
  ) {
    return {
      status: 'unavailable',
      headline: 'Structural preview unavailable',
      summary: 'Required upstream models (target resolution, confirmation contract, or caution clearance) are not available. Cannot determine structural mutation preview eligibility.',
      confidence: 'none',
      candidatePreviewCount: 0,
      blockedPreviewCount: 0,
      futureTargetCount: 0,
      completedProtectedCount: 0,
      activeCautionCount: 0,
      previewCandidates: [],
      blockedReasons: ['Missing required upstream models'],
      missingProof: [
        !mutationTargetSessionResolutionPreviewModel ? 'Target session resolution preview' : null,
        !mutationConfirmationContractPreviewModel ? 'Confirmation contract preview' : null,
        !mutationCautionClearanceGateModel ? 'Caution clearance gate' : null,
      ].filter((x): x is string => x !== null),
      safetyNotes: ['No structural preview possible without upstream proof'],
      nextSafeGate: 'Await upstream model availability',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // Extract counts from upstream
  const completedProtectedCount = mutationTargetSessionResolutionPreviewModel.completedSessionCount
  const futureTargetCount = mutationTargetSessionResolutionPreviewModel.futureSessionCount
  const activeCautionCount = mutationCautionClearanceGateModel.activeCautionCount

  // [P28.1] Use shared semantic helper as single source of truth
  const semanticBlockerSummary = computeSemanticBlockerSummary(mutationCautionClearanceGateModel)
  const semanticHardBlockerCount = semanticBlockerSummary.semanticHardBlockerCount
  const diagnosticOnlyCount = semanticBlockerSummary.diagnosticOnlyRootCandidateCount
  const clearableOnlyCount = semanticBlockerSummary.readOnlyClearableRootCandidateCount
  const cascadeOnlyCount = semanticBlockerSummary.derivedCascadeCautionCount

  // -------------------------------------------------------------------------
  // PRIORITY 2: Blocked by semantic hard blockers only
  // [P28.1] Do NOT block merely because raw activeCautionCount > 0
  // -------------------------------------------------------------------------
  if (semanticBlockerSummary.hasSemanticHardBlockers) {
    const candidates = buildBlockedCandidates(
      mutationTargetSessionResolutionPreviewModel,
      'caution_blocked',
      'Blocked by evidence requirements'
    )
    return {
      status: 'blocked_active_caution',
      headline: 'Structural preview blocked: evidence required',
      summary: `${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} (blocking/waiting/unknown) must be resolved before structural preview can proceed.`,
      confidence: 'high',
      candidatePreviewCount: 0,
      blockedPreviewCount: candidates.length,
      futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      previewCandidates: candidates,
      blockedReasons: [
        `${semanticHardBlockerCount} hard blocker${semanticHardBlockerCount !== 1 ? 's' : ''} need evidence`,
        'Root/candidate clearance gate not ready',
      ],
      missingProof: ['Evidence clearance'],
      safetyNotes: [
        'Hard blockers must be resolved before structural preview',
        diagnosticOnlyCount > 0 ? `${diagnosticOnlyCount} diagnostic-only (non-blocking)` : null,
        clearableOnlyCount > 0 ? `${clearableOnlyCount} clearable/read-only (non-blocking)` : null,
        cascadeOnlyCount > 0 ? `${cascadeOnlyCount} cascade echo${cascadeOnlyCount !== 1 ? 'es' : ''} (non-blocking)` : null,
      ].filter(Boolean) as string[],
      nextSafeGate: 'Resolve hard blockers (blocking/waiting/unknown) first',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 3: Blocked by no future targets
  // -------------------------------------------------------------------------
  if (
    futureTargetCount === 0 ||
    mutationCautionClearanceGateModel.status === 'blocked_no_future_targets'
  ) {
    const candidates = buildBlockedCandidates(
      mutationTargetSessionResolutionPreviewModel,
      'no_future_target',
      'No future sessions available as mutation targets'
    )
    return {
      status: 'blocked_no_future_targets',
      headline: 'Structural preview blocked: no future targets',
      summary: `No future sessions exist to apply structural mutations. All ${completedProtectedCount} session(s) are completed and protected.`,
      confidence: 'high',
      candidatePreviewCount: 0,
      blockedPreviewCount: candidates.length,
      futureTargetCount: 0,
      completedProtectedCount,
      activeCautionCount,
      previewCandidates: candidates,
      blockedReasons: [
        'No future sessions available',
        'All sessions are completed/protected',
      ],
      missingProof: ['Future session targets'],
      safetyNotes: ['Completed sessions are protected from mutation'],
      nextSafeGate: 'Future sessions must exist before structural preview',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 4: Blocked completed-only
  // -------------------------------------------------------------------------
  if (mutationCautionClearanceGateModel.status === 'blocked_completed_only') {
    const candidates = buildBlockedCandidates(
      mutationTargetSessionResolutionPreviewModel,
      'completed_protected',
      'All sessions completed and protected'
    )
    return {
      status: 'blocked_completed_only',
      headline: 'Structural preview blocked: completed only',
      summary: `All ${completedProtectedCount} session(s) are completed. No future sessions exist to target for structural mutation preview.`,
      confidence: 'high',
      candidatePreviewCount: 0,
      blockedPreviewCount: candidates.length,
      futureTargetCount: 0,
      completedProtectedCount,
      activeCautionCount,
      previewCandidates: candidates,
      blockedReasons: ['All sessions completed', 'No future sessions to mutate'],
      missingProof: ['Future session availability'],
      safetyNotes: ['Completed sessions remain protected'],
      nextSafeGate: 'Program must have future sessions',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 5: Blocked target unresolved
  // -------------------------------------------------------------------------
  if (
    mutationTargetSessionResolutionPreviewModel.status === 'targets_unresolved' ||
    mutationTargetSessionResolutionPreviewModel.status === 'blocked_by_caution'
  ) {
    const candidates = buildBlockedCandidates(
      mutationTargetSessionResolutionPreviewModel,
      'target_unresolved',
      'Target session resolution incomplete'
    )
    return {
      status: 'blocked_target_unresolved',
      headline: 'Structural preview blocked: targets unresolved',
      summary: 'Target session resolution has not completed successfully. Cannot determine which sessions would receive structural mutations.',
      confidence: 'medium',
      candidatePreviewCount: 0,
      blockedPreviewCount: candidates.length,
      futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      previewCandidates: candidates,
      blockedReasons: ['Target session resolution incomplete'],
      missingProof: ['Resolved target sessions'],
      safetyNotes: ['Target resolution must complete before structural preview'],
      nextSafeGate: 'Target session resolution must resolve successfully',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 6: Waiting for confirmation contract
  // -------------------------------------------------------------------------
  if (
    mutationConfirmationContractPreviewModel.status !== 'preview_eligible_marker_only'
  ) {
    const candidates = buildBlockedCandidates(
      mutationTargetSessionResolutionPreviewModel,
      'waiting_confirmation',
      'Waiting for confirmation contract to become preview-eligible'
    )
    return {
      status: 'waiting_for_confirmation_contract',
      headline: 'Structural preview waiting: confirmation contract',
      summary: `Confirmation contract status is "${mutationConfirmationContractPreviewModel.status}". Structural mutation preview requires confirmation contract to reach preview-eligible state.`,
      confidence: 'medium',
      candidatePreviewCount: 0,
      blockedPreviewCount: candidates.length,
      futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      previewCandidates: candidates,
      blockedReasons: [`Confirmation contract status: ${mutationConfirmationContractPreviewModel.status}`],
      missingProof: ['Confirmation contract preview eligibility'],
      safetyNotes: ['Confirmation contract must be preview-eligible first'],
      nextSafeGate: 'Confirmation contract must reach preview_eligible_marker_only',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 7: Preview contract ready (read-only)
  // -------------------------------------------------------------------------
  // All upstream gates passed — we can say structural preview is conceptually ready
  // BUT we still do NOT allow actual mutation in this step
  
  const previewCandidates = buildPreviewReadyCandidates(
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel
  )
  
  const candidatePreviewCount = previewCandidates.filter(
    c => c.status === 'preview_ready_read_only'
  ).length
  const blockedPreviewCount = previewCandidates.filter(
    c => c.status !== 'preview_ready_read_only'
  ).length

  if (candidatePreviewCount > 0) {
    return {
      status: 'preview_contract_ready_read_only',
      headline: 'Structural preview contract ready (read-only)',
      summary: `${candidatePreviewCount} candidate(s) have passed upstream gates and are conceptually ready for structural preview. Actual mutation writer is not connected yet.`,
      confidence: 'high',
      candidatePreviewCount,
      blockedPreviewCount,
      futureTargetCount,
      completedProtectedCount,
      activeCautionCount,
      previewCandidates,
      blockedReasons: blockedPreviewCount > 0 ? [`${blockedPreviewCount} candidate(s) still blocked`] : [],
      missingProof: ['Structural mutation writer (future step)'],
      safetyNotes: [
        'Read-only preview contract only',
        'No actual structural diff generated yet',
        'Mutation writer not connected',
      ],
      nextSafeGate: 'User confirmation / marker permission preview gate (MASTER-8C.36)',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // -------------------------------------------------------------------------
  // FALLBACK: Future locked
  // -------------------------------------------------------------------------
  return {
    status: 'future_locked',
    headline: 'Structural preview future-locked',
    summary: 'Structural mutation preview is locked until future implementation steps are completed.',
    confidence: 'low',
    candidatePreviewCount: 0,
    blockedPreviewCount: previewCandidates.length,
    futureTargetCount,
    completedProtectedCount,
    activeCautionCount,
    previewCandidates,
    blockedReasons: ['Future implementation required'],
    missingProof: ['Future gate implementation'],
    safetyNotes: ['Structural preview remains locked'],
    nextSafeGate: 'Future implementation step',
    ...LOCKED_PERMISSION_FLAGS,
    ...LOCKED_SAFETY_FLAGS,
  }
}

// =============================================================================
// HELPER: Build blocked candidates
// =============================================================================

function buildBlockedCandidates(
  targetModel: MutationTargetSessionResolutionPreviewModel,
  status: StructuralPreviewCandidateStatus,
  reason: string
): readonly StructuralPreviewCandidate[] {
  return targetModel.candidateResolutions.map(cr => ({
    sourceCandidateId: cr.sourceCandidateId,
    title: cr.title,
    category: cr.category,
    status,
    targetDayNumbers: cr.targetDayNumbers,
    targetLabels: cr.targetSessions.map(s => s.sessionTitle),
    blockedReasons: [reason, ...cr.blockedReasons],
    previewOnlySummary: `Blocked: ${reason}`,
    conceptualProposedPreviewSummary: 'Structural before/after diff not generated yet — writer not connected.',
    beforeAfterAvailable: false as const,
    structuralMutationAllowed: false as const,
    markerWriteAllowed: false as const,
    programCardChangeAllowed: false as const,
    liveWorkoutBridgeAllowed: false as const,
  }))
}

// =============================================================================
// HELPER: Build preview-ready candidates
// =============================================================================

function buildPreviewReadyCandidates(
  targetModel: MutationTargetSessionResolutionPreviewModel,
  confirmationModel: MutationConfirmationContractPreviewModel
): readonly StructuralPreviewCandidate[] {
  return targetModel.candidateResolutions.map(cr => {
    // Check if this candidate is preview-eligible in confirmation contract
    const confirmationCandidate = confirmationModel.candidates.find(
      cc => cc.sourceCandidateId === cr.sourceCandidateId
    )
    
    const isPreviewEligible = 
      cr.status === 'resolved_read_only' &&
      confirmationCandidate?.status === 'marker_preview_eligible'

    if (isPreviewEligible) {
      return {
        sourceCandidateId: cr.sourceCandidateId,
        title: cr.title,
        category: cr.category,
        status: 'preview_ready_read_only' as const,
        targetDayNumbers: cr.targetDayNumbers,
        targetLabels: cr.targetSessions.map(s => s.sessionTitle),
        blockedReasons: [],
        previewOnlySummary: 'Preview-ready (read-only contract)',
        conceptualProposedPreviewSummary: 'Structural before/after diff not generated yet — writer not connected.',
        beforeAfterAvailable: false as const,
        structuralMutationAllowed: false as const,
        markerWriteAllowed: false as const,
        programCardChangeAllowed: false as const,
        liveWorkoutBridgeAllowed: false as const,
      }
    }

    // Not preview-eligible yet
    return {
      sourceCandidateId: cr.sourceCandidateId,
      title: cr.title,
      category: cr.category,
      status: cr.status === 'blocked' ? 'blocked' as const : 'waiting_confirmation' as const,
      targetDayNumbers: cr.targetDayNumbers,
      targetLabels: cr.targetSessions.map(s => s.sessionTitle),
      blockedReasons: cr.blockedReasons.length > 0 ? cr.blockedReasons : ['Not preview-eligible yet'],
      previewOnlySummary: `Status: ${cr.status}`,
      conceptualProposedPreviewSummary: 'Structural before/after diff not generated yet — writer not connected.',
      beforeAfterAvailable: false as const,
      structuralMutationAllowed: false as const,
      markerWriteAllowed: false as const,
      programCardChangeAllowed: false as const,
      liveWorkoutBridgeAllowed: false as const,
    }
  })
}

// =============================================================================
// LABEL HELPER
// =============================================================================

export function getStructuralPreviewContractStatusLabel(
  status: StructuralMutationPreviewContractStatus
): string {
  switch (status) {
    case 'unavailable':
      return 'Unavailable'
    case 'blocked_active_caution':
      return 'Blocked: Evidence Required'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_completed_only':
      return 'Blocked: All Completed'
    case 'blocked_target_unresolved':
      return 'Blocked: Targets Unresolved'
    case 'waiting_for_confirmation_contract':
      return 'Waiting: Confirmation'
    case 'preview_contract_ready_read_only':
      return 'Preview Ready (Read-Only)'
    case 'future_locked':
      return 'Future Locked'
    default:
      return 'Unknown'
  }
}

// =============================================================================
// COLOR HELPER
// =============================================================================

export function getStructuralPreviewContractStatusColor(
  status: StructuralMutationPreviewContractStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable':
      return {
        bg: 'bg-[#1A1A2E]/60',
        text: 'text-[#8A8A9A]',
        border: 'border-[#2A2A35]/40',
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
    case 'blocked_target_unresolved':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'waiting_for_confirmation_contract':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
        border: 'border-violet-500/20',
      }
    case 'preview_contract_ready_read_only':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
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
