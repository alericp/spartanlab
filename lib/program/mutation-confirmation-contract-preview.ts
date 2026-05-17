/**
 * ============================================================================
 * MASTER-8C.33 / AB20.4.26 — MUTATION CONFIRMATION CONTRACT PREVIEW (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only analyzer that evaluates whether a future
 * marker-only confirmation contract would be unavailable, blocked, or
 * preview-eligible. Sits after Target Session Resolution Preview in the
 * mutation pathway.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives entirely from existing read-only models already computed in Hub.
 *   6. canWriteMarker is always false. canApplyStructuralMutation is always false.
 *   7. Never claims applied marker, confirmed plan, or structural changes.
 *   8. Does NOT import or call addConfirmedPlan, saveMutationPlans, createConfirmedPlan.
 */

import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationReadinessReviewGateModel } from './mutation-readiness-review-gate'
import type { MutationPathwayReadinessMapModel } from './mutation-pathway-readiness-map'

// ─── Types ──────────────────────────────────────────────────────────────────

export type MutationConfirmationContractStatus =
  | 'unavailable'
  | 'blocked_no_future_targets'
  | 'blocked_completed_only'
  | 'blocked_by_caution'
  | 'blocked_target_unresolved'
  | 'waiting_for_review_candidate'
  | 'preview_eligible_marker_only'
  | 'future_locked'

export type MutationConfirmationContractCandidateStatus =
  | 'blocked'
  | 'target_unresolved'
  | 'completed_protected'
  | 'no_future_target'
  | 'review_only'
  | 'marker_preview_eligible'

export interface MutationConfirmationContractPreviewCandidate {
  readonly sourceCandidateId: string
  readonly title: string
  readonly category: string
  readonly status: MutationConfirmationContractCandidateStatus
  readonly targetDayNumbers: readonly number[]
  readonly targetLabels: readonly string[]
  readonly blockedReasons: readonly string[]
  readonly previewOnlySummary: string
  readonly markerWriteAllowed: false
  readonly structuralMutationAllowed: false
}

export interface MutationConfirmationContractPreviewModel {
  readonly status: MutationConfirmationContractStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: 'high' | 'medium' | 'low' | 'none'
  readonly candidateCount: number
  readonly eligibleMarkerPreviewCount: number
  readonly blockedCount: number
  readonly targetResolvedCount: number
  readonly futureTargetCount: number
  readonly completedProtectedCount: number
  readonly canShowConfirmationUi: false
  readonly canWriteMarker: false
  readonly canApplyStructuralMutation: false
  readonly canChangeProgramCards: false
  readonly canBridgeLiveWorkout: false
  readonly candidates: readonly MutationConfirmationContractPreviewCandidate[]
  readonly missingProof: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string
  // Locked flags for safety
  readonly noProgramChangesApplied: true
  readonly noMarkerSaved: true
  readonly noFutureSessionChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CANDIDATE_LOCKED_FLAGS = {
  markerWriteAllowed: false as const,
  structuralMutationAllowed: false as const,
}

const MODEL_LOCKED_FLAGS = {
  canShowConfirmationUi: false as const,
  canWriteMarker: false as const,
  canApplyStructuralMutation: false as const,
  canChangeProgramCards: false as const,
  canBridgeLiveWorkout: false as const,
  noProgramChangesApplied: true as const,
  noMarkerSaved: true as const,
  noFutureSessionChangesApplied: true as const,
  noProgramCardChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
}

const REQUIRED_PROOF = [
  'Target session resolution model',
  'Mutation-readiness review gate',
  'Future target availability',
  'No caution blockers',
  'User confirmation UI (future step)',
]

// ─── Helper: Status Labels ──────────────────────────────────────────────────

export function getConfirmationContractStatusLabel(
  status: MutationConfirmationContractStatus
): string {
  switch (status) {
    case 'unavailable':
      return 'Unavailable'
    case 'blocked_no_future_targets':
      return 'Blocked (no future targets)'
    case 'blocked_completed_only':
      return 'Blocked (all completed)'
    case 'blocked_by_caution':
      return 'Blocked (caution)'
    case 'blocked_target_unresolved':
      return 'Blocked (target unresolved)'
    case 'waiting_for_review_candidate':
      return 'Waiting for review'
    case 'preview_eligible_marker_only':
      return 'Preview eligible'
    case 'future_locked':
      return 'Future locked'
  }
}

export function getConfirmationContractStatusColor(
  status: MutationConfirmationContractStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable':
      return { bg: 'bg-[#1A1A2E]/60', text: 'text-[#6A6A7A]', border: 'border-[#2A2A35]/40' }
    case 'blocked_no_future_targets':
    case 'blocked_completed_only':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70', border: 'border-emerald-500/20' }
    case 'blocked_by_caution':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'blocked_target_unresolved':
    case 'waiting_for_review_candidate':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70', border: 'border-orange-500/20' }
    case 'preview_eligible_marker_only':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70', border: 'border-cyan-500/20' }
    case 'future_locked':
      return { bg: 'bg-[#1A1A2E]/60', text: 'text-[#8A8A9A]', border: 'border-[#2A2A35]/40' }
  }
}

// ─── Main Resolver ──────────────────────────────────────────────────────────

export function resolveMutationConfirmationContractPreview(input: {
  readonly mutationTargetSessionResolutionPreviewModel?: MutationTargetSessionResolutionPreviewModel | null
  readonly mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  readonly mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
}): MutationConfirmationContractPreviewModel {
  const {
    mutationTargetSessionResolutionPreviewModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
  } = input

  // ── Case 1: No target resolution model → unavailable ────────────────────
  if (!mutationTargetSessionResolutionPreviewModel) {
    return {
      status: 'unavailable',
      headline: 'Confirmation contract: unavailable',
      summary: 'Target session resolution required before confirmation contract analysis.',
      confidence: 'none',
      candidateCount: 0,
      eligibleMarkerPreviewCount: 0,
      blockedCount: 0,
      targetResolvedCount: 0,
      futureTargetCount: 0,
      completedProtectedCount: 0,
      candidates: [],
      missingProof: [...REQUIRED_PROOF],
      safetyNotes: ['Target resolution model required'],
      nextSafeGate: 'Target session resolution',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Case 2: Target resolution unavailable → unavailable ─────────────────
  if (mutationTargetSessionResolutionPreviewModel.status === 'unavailable') {
    return {
      status: 'unavailable',
      headline: 'Confirmation contract: unavailable',
      summary: 'Target session resolution is unavailable.',
      confidence: 'none',
      candidateCount: 0,
      eligibleMarkerPreviewCount: 0,
      blockedCount: 0,
      targetResolvedCount: 0,
      futureTargetCount: mutationTargetSessionResolutionPreviewModel.futureSessionCount,
      completedProtectedCount: mutationTargetSessionResolutionPreviewModel.completedSessionCount,
      candidates: [],
      missingProof: [...REQUIRED_PROOF],
      safetyNotes: ['Target resolution unavailable'],
      nextSafeGate: 'Target session resolution',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Extract counts ──────────────────────────────────────────────────────
  const futureTargetCount = mutationTargetSessionResolutionPreviewModel.futureSessionCount
  const completedProtectedCount = mutationTargetSessionResolutionPreviewModel.completedSessionCount
  const candidateResolutions = mutationTargetSessionResolutionPreviewModel.candidateResolutions

  // ── Case 3: No future targets (all completed) → blocked_completed_only ──
  if (futureTargetCount === 0) {
    return {
      status: completedProtectedCount > 0 ? 'blocked_completed_only' : 'blocked_no_future_targets',
      headline: completedProtectedCount > 0
        ? 'Confirmation blocked: all sessions completed'
        : 'Confirmation blocked: no future targets',
      summary: completedProtectedCount > 0
        ? `All ${completedProtectedCount} completed session${completedProtectedCount !== 1 ? 's are' : ' is'} protected. No future sessions available for marker confirmation.`
        : 'No future sessions exist for marker confirmation.',
      confidence: 'high',
      candidateCount: candidateResolutions.length,
      eligibleMarkerPreviewCount: 0,
      blockedCount: candidateResolutions.length,
      targetResolvedCount: 0,
      futureTargetCount: 0,
      completedProtectedCount,
      candidates: candidateResolutions.map(cr => ({
        sourceCandidateId: cr.sourceCandidateId,
        title: cr.title,
        category: cr.category,
        status: 'no_future_target' as const,
        targetDayNumbers: [],
        targetLabels: [],
        blockedReasons: ['No future sessions available'],
        previewOnlySummary: 'No future target — completed sessions protected',
        ...CANDIDATE_LOCKED_FLAGS,
      })),
      missingProof: ['Future session targets required for marker confirmation'],
      safetyNotes: [
        'All completed sessions are permanently protected',
        'No marker confirmation is available without future targets',
      ],
      nextSafeGate: 'Next program generation cycle',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Case 4: Blocked by caution in upstream models ───────────────────────
  const isBlockedByCaution =
    mutationTargetSessionResolutionPreviewModel.status === 'blocked_by_caution' ||
    mutationReadinessReviewGateModel?.status === 'blocked_by_caution' ||
    mutationPathwayReadinessMapModel?.status === 'blocked_by_caution'

  if (isBlockedByCaution) {
    return {
      status: 'blocked_by_caution',
      headline: 'Confirmation blocked: caution required',
      summary: 'Caution-level blockers must clear before marker confirmation can be considered.',
      confidence: 'medium',
      candidateCount: candidateResolutions.length,
      eligibleMarkerPreviewCount: 0,
      blockedCount: candidateResolutions.length,
      targetResolvedCount: mutationTargetSessionResolutionPreviewModel.resolvedReadOnlyCandidateCount,
      futureTargetCount,
      completedProtectedCount,
      candidates: candidateResolutions.map(cr => ({
        sourceCandidateId: cr.sourceCandidateId,
        title: cr.title,
        category: cr.category,
        status: 'blocked' as const,
        targetDayNumbers: cr.targetDayNumbers,
        targetLabels: cr.targetSessions.map(s => s.sessionTitle),
        blockedReasons: ['Caution-level blocker active'],
        previewOnlySummary: 'Blocked by caution',
        ...CANDIDATE_LOCKED_FLAGS,
      })),
      missingProof: ['Caution blockers must clear'],
      safetyNotes: [
        'Caution-level review required before marker confirmation',
        'Future sessions listed for transparency only',
      ],
      nextSafeGate: 'Clear caution blockers',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Case 5: Targets unresolved ──────────────────────────────────────────
  const hasUnresolvedTargets = mutationTargetSessionResolutionPreviewModel.status === 'targets_unresolved'
  if (hasUnresolvedTargets) {
    return {
      status: 'blocked_target_unresolved',
      headline: 'Confirmation blocked: targets unresolved',
      summary: 'Target session mapping must resolve before marker confirmation can be considered.',
      confidence: 'low',
      candidateCount: candidateResolutions.length,
      eligibleMarkerPreviewCount: 0,
      blockedCount: candidateResolutions.length,
      targetResolvedCount: mutationTargetSessionResolutionPreviewModel.resolvedReadOnlyCandidateCount,
      futureTargetCount,
      completedProtectedCount,
      candidates: candidateResolutions.map(cr => ({
        sourceCandidateId: cr.sourceCandidateId,
        title: cr.title,
        category: cr.category,
        status: 'target_unresolved' as const,
        targetDayNumbers: cr.targetDayNumbers,
        targetLabels: cr.targetSessions.map(s => s.sessionTitle),
        blockedReasons: ['Target session mapping unresolved'],
        previewOnlySummary: 'Target unresolved',
        ...CANDIDATE_LOCKED_FLAGS,
      })),
      missingProof: ['Target session mapping resolution'],
      safetyNotes: ['Target resolution must complete before confirmation preview'],
      nextSafeGate: 'Target session resolution',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Case 6: No review candidates ────────────────────────────────────────
  if (candidateResolutions.length === 0) {
    return {
      status: 'waiting_for_review_candidate',
      headline: 'Confirmation waiting: no candidates',
      summary: 'No mutation-readiness candidates exist for marker confirmation.',
      confidence: 'medium',
      candidateCount: 0,
      eligibleMarkerPreviewCount: 0,
      blockedCount: 0,
      targetResolvedCount: 0,
      futureTargetCount,
      completedProtectedCount,
      candidates: [],
      missingProof: ['Mutation-readiness review candidates'],
      safetyNotes: ['Future sessions exist but no candidates for marker preview'],
      nextSafeGate: 'Mutation-readiness review with candidates',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Case 7: Candidates exist with resolved targets → preview_eligible ───
  const resolvedCandidates = candidateResolutions.filter(
    cr => cr.status === 'resolved_read_only' || cr.targetDayNumbers.length > 0
  )

  if (resolvedCandidates.length > 0) {
    const previewCandidates: MutationConfirmationContractPreviewCandidate[] = candidateResolutions.map(cr => {
      const hasTargets = cr.targetDayNumbers.length > 0
      const isResolved = cr.status === 'resolved_read_only'
      
      return {
        sourceCandidateId: cr.sourceCandidateId,
        title: cr.title,
        category: cr.category,
        status: (hasTargets || isResolved) ? 'marker_preview_eligible' as const : 'review_only' as const,
        targetDayNumbers: cr.targetDayNumbers,
        targetLabels: cr.targetSessions.map(s => s.sessionTitle),
        blockedReasons: hasTargets ? [] : ['No specific target session'],
        previewOnlySummary: hasTargets
          ? `Preview eligible for Day ${cr.targetDayNumbers.join(', ')}`
          : 'Review only — no target mapped',
        ...CANDIDATE_LOCKED_FLAGS,
      }
    })

    const eligibleCount = previewCandidates.filter(c => c.status === 'marker_preview_eligible').length
    const blockedCount = previewCandidates.filter(c => c.status !== 'marker_preview_eligible').length

    return {
      status: 'preview_eligible_marker_only',
      headline: 'Marker-only confirmation preview eligible',
      summary: `${eligibleCount} candidate${eligibleCount !== 1 ? 's' : ''} could receive marker-only confirmation in a future gate. No confirmation UI yet. No marker saved. No structural changes.`,
      confidence: 'medium',
      candidateCount: candidateResolutions.length,
      eligibleMarkerPreviewCount: eligibleCount,
      blockedCount,
      targetResolvedCount: mutationTargetSessionResolutionPreviewModel.resolvedReadOnlyCandidateCount,
      futureTargetCount,
      completedProtectedCount,
      candidates: previewCandidates,
      missingProof: ['User confirmation UI (future step)'],
      safetyNotes: [
        'Marker-only confirmation preview only — no actual confirmation',
        'Confirmation UI will be added in a future gate',
        'No marker saved. No program changes applied.',
      ],
      nextSafeGate: 'User confirmation UI gate',
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Fallback: future_locked ─────────────────────────────────────────────
  return {
    status: 'future_locked',
    headline: 'Confirmation contract: future locked',
    summary: 'Confirmation contract analysis is locked pending upstream resolution.',
    confidence: 'low',
    candidateCount: candidateResolutions.length,
    eligibleMarkerPreviewCount: 0,
    blockedCount: candidateResolutions.length,
    targetResolvedCount: mutationTargetSessionResolutionPreviewModel.resolvedReadOnlyCandidateCount,
    futureTargetCount,
    completedProtectedCount,
    candidates: candidateResolutions.map(cr => ({
      sourceCandidateId: cr.sourceCandidateId,
      title: cr.title,
      category: cr.category,
      status: 'blocked' as const,
      targetDayNumbers: cr.targetDayNumbers,
      targetLabels: cr.targetSessions.map(s => s.sessionTitle),
      blockedReasons: ['Upstream resolution required'],
      previewOnlySummary: 'Future locked',
      ...CANDIDATE_LOCKED_FLAGS,
    })),
    missingProof: [...REQUIRED_PROOF],
    safetyNotes: ['Confirmation contract analysis pending'],
    nextSafeGate: 'Upstream model resolution',
    ...MODEL_LOCKED_FLAGS,
  }
}
