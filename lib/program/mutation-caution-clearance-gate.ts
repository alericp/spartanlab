/**
 * ============================================================================
 * MASTER-8C.34 / AB20.4.27 — MUTATION CAUTION CLEARANCE GATE (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only gate that consolidates all upstream caution
 * signals and mutation unlock preconditions into one clearance model.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives entirely from existing read-only models already computed in Hub.
 *   6. canWriteMarker is always false. canApplyStructuralMutation is always false.
 *   7. Never claims applied marker, confirmed plan, or structural changes.
 */

import type { PlanEvidenceTrendReadinessModel } from './plan-evidence-trend-readiness'
import type { MutationReadinessReviewGateModel } from './mutation-readiness-review-gate'
import type { MutationPathwayReadinessMapModel } from './mutation-pathway-readiness-map'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MutationConfirmationContractPreviewModel } from './mutation-confirmation-contract-preview'

// ─── Types ──────────────────────────────────────────────────────────────────

export type MutationCautionClearanceGateStatus =
  | 'unavailable'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_completed_only'
  | 'clearance_waiting_for_evidence'
  | 'clearance_review_only'
  | 'clearance_preview_ready'
  | 'future_locked'

export type MutationCautionSignalSeverity = 'caution' | 'blocked' | 'watch'

export interface MutationCautionClearanceSignal {
  readonly source: string
  readonly label: string
  readonly severity: MutationCautionSignalSeverity
  readonly reason: string
  readonly blocksMutation: boolean
}

export interface MutationCautionClearanceGateModel {
  readonly status: MutationCautionClearanceGateStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: 'high' | 'medium' | 'low' | 'none'

  // Counts
  readonly activeCautionCount: number
  readonly clearedConditionCount: number
  readonly missingProofCount: number
  readonly completedSessionCount: number
  readonly futureSessionCount: number

  // Permission flags — ALL LOCKED
  readonly canProceedToPreview: false
  readonly canShowConfirmationUi: false
  readonly canWriteMarker: false
  readonly canApplyStructuralMutation: false
  readonly canChangeProgramCards: false
  readonly canBridgeLiveWorkout: false

  // Safety flags — ALL TRUE
  readonly noProgramChangesApplied: true
  readonly noMarkerSaved: true
  readonly noFutureSessionChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true

  // Details
  readonly cautionSignals: readonly MutationCautionClearanceSignal[]
  readonly clearedSignals: readonly string[]
  readonly missingProof: readonly string[]
  readonly blockedReasons: readonly string[]
  readonly nextSafeGate: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCKED_PERMISSION_FLAGS = {
  canProceedToPreview: false as const,
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

// ─── Helper Functions ───────────────────────────────────────────────────────

function extractCautionSignals(input: {
  planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
  mutationTargetSessionResolutionPreviewModel?: MutationTargetSessionResolutionPreviewModel | null
  mutationConfirmationContractPreviewModel?: MutationConfirmationContractPreviewModel | null
}): MutationCautionClearanceSignal[] {
  const signals: MutationCautionClearanceSignal[] = []
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel,
  } = input

  // Check evidence trend for caution pattern
  if (planEvidenceTrendReadinessModel) {
    if (planEvidenceTrendReadinessModel.classification === 'caution_pattern_detected') {
      signals.push({
        source: 'plan_evidence_trend',
        label: 'Caution pattern detected',
        severity: 'caution',
        reason: 'Evidence trend analysis indicates caution-level signals in workout history',
        blocksMutation: true,
      })
    }
    if (planEvidenceTrendReadinessModel.readinessPosture === 'caution_review') {
      signals.push({
        source: 'plan_evidence_trend',
        label: 'Caution review required',
        severity: 'watch',
        reason: 'Readiness posture recommends caution review before proceeding',
        blocksMutation: true,
      })
    }
  }

  // Check mutation readiness review gate
  if (mutationReadinessReviewGateModel) {
    if (mutationReadinessReviewGateModel.status === 'blocked_by_caution') {
      signals.push({
        source: 'mutation_readiness_review',
        label: 'Mutation blocked by caution',
        severity: 'blocked',
        reason: 'Mutation readiness review gate detected blocking caution signals',
        blocksMutation: true,
      })
    }
    // Check individual candidates for caution blocks
    for (const candidate of mutationReadinessReviewGateModel.candidates) {
      if (candidate.resolution === 'blocked_caution') {
        signals.push({
          source: 'review_candidate',
          label: `Candidate blocked: ${candidate.title}`,
          severity: 'caution',
          reason: candidate.blockers.join(', ') || 'Caution-level blocker on candidate',
          blocksMutation: true,
        })
      }
    }
  }

  // Check mutation pathway readiness map
  if (mutationPathwayReadinessMapModel) {
    if (mutationPathwayReadinessMapModel.status === 'blocked_by_caution') {
      signals.push({
        source: 'mutation_pathway',
        label: 'Pathway blocked by caution',
        severity: 'blocked',
        reason: 'Mutation pathway map indicates caution-level gate block',
        blocksMutation: true,
      })
    }
    // Check caution_cleared gate
    const cautionGate = mutationPathwayReadinessMapModel.gates.find(g => g.id === 'caution_cleared')
    if (cautionGate && cautionGate.status === 'blocked') {
      signals.push({
        source: 'pathway_gate',
        label: 'Caution clearance gate blocked',
        severity: 'blocked',
        reason: cautionGate.blocker || 'Caution gate not cleared',
        blocksMutation: true,
      })
    }
  }

  // Check target session resolution
  if (mutationTargetSessionResolutionPreviewModel) {
    if (mutationTargetSessionResolutionPreviewModel.status === 'blocked_by_caution') {
      signals.push({
        source: 'target_resolution',
        label: 'Target resolution blocked by caution',
        severity: 'blocked',
        reason: 'Target session resolution preview blocked by caution signals',
        blocksMutation: true,
      })
    }
    // Check for blocked candidates with caution reasons
    for (const cr of mutationTargetSessionResolutionPreviewModel.candidateResolutions) {
      if (cr.status === 'blocked' && cr.blockedReasons.some(r => r.toLowerCase().includes('caution'))) {
        signals.push({
          source: 'target_candidate',
          label: `Target candidate blocked: ${cr.title}`,
          severity: 'caution',
          reason: cr.blockedReasons.join(', ') || 'Caution blocker on target candidate',
          blocksMutation: true,
        })
      }
    }
  }

  // Check confirmation contract
  if (mutationConfirmationContractPreviewModel) {
    if (mutationConfirmationContractPreviewModel.status === 'blocked_by_caution') {
      signals.push({
        source: 'confirmation_contract',
        label: 'Confirmation blocked by caution',
        severity: 'blocked',
        reason: 'Confirmation contract preview blocked by caution signals',
        blocksMutation: true,
      })
    }
  }

  return signals
}

function extractClearedConditions(input: {
  planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
}): string[] {
  const cleared: string[] = []
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
  } = input

  // Evidence connected
  if (planEvidenceTrendReadinessModel?.status === 'classified_read_only') {
    cleared.push('Evidence trend classified')
  }

  // Candidates available
  if ((mutationReadinessReviewGateModel?.reviewCandidateCount ?? 0) > 0) {
    cleared.push('Review candidates available')
  }

  // Gates ready
  if (mutationPathwayReadinessMapModel) {
    for (const gate of mutationPathwayReadinessMapModel.gates) {
      if (gate.status === 'ready') {
        cleared.push(`Gate ready: ${gate.label}`)
      }
    }
  }

  return cleared
}

function extractMissingProof(input: {
  planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  mutationConfirmationContractPreviewModel?: MutationConfirmationContractPreviewModel | null
}): string[] {
  const missing: string[] = []
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationConfirmationContractPreviewModel,
  } = input

  if (!planEvidenceTrendReadinessModel || planEvidenceTrendReadinessModel.status === 'unavailable') {
    missing.push('Evidence trend model unavailable')
  } else if (planEvidenceTrendReadinessModel.status === 'insufficient') {
    missing.push('Insufficient workout evidence')
  }

  if (!mutationReadinessReviewGateModel || mutationReadinessReviewGateModel.status === 'unavailable') {
    missing.push('Mutation readiness review unavailable')
  }

  if (mutationConfirmationContractPreviewModel) {
    missing.push(...mutationConfirmationContractPreviewModel.missingProof)
  }

  return [...new Set(missing)]
}

// ─── Main Resolver ──────────────────────────────────────────────────────────

export function resolveMutationCautionClearanceGate(input: {
  planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
  mutationTargetSessionResolutionPreviewModel?: MutationTargetSessionResolutionPreviewModel | null
  mutationConfirmationContractPreviewModel?: MutationConfirmationContractPreviewModel | null
}): MutationCautionClearanceGateModel {
  const {
    planEvidenceTrendReadinessModel,
    mutationReadinessReviewGateModel,
    mutationPathwayReadinessMapModel,
    mutationTargetSessionResolutionPreviewModel,
    mutationConfirmationContractPreviewModel,
  } = input

  // ── Unavailable if no upstream models ─────────────────────────────────────
  if (!planEvidenceTrendReadinessModel && !mutationReadinessReviewGateModel) {
    return {
      status: 'unavailable',
      headline: 'Caution clearance gate: unavailable',
      summary: 'No upstream readiness models available to evaluate caution clearance.',
      confidence: 'none',
      activeCautionCount: 0,
      clearedConditionCount: 0,
      missingProofCount: 2,
      completedSessionCount: 0,
      futureSessionCount: 0,
      cautionSignals: [],
      clearedSignals: [],
      missingProof: ['Evidence trend model required', 'Mutation readiness review required'],
      blockedReasons: ['No upstream models available'],
      nextSafeGate: 'Connect evidence models',
      ...LOCKED_PERMISSION_FLAGS,
      ...LOCKED_SAFETY_FLAGS,
    }
  }

  // ── Extract caution signals from all upstream models ──────────────────────
  const cautionSignals = extractCautionSignals(input)
  const clearedSignals = extractClearedConditions(input)
  const missingProof = extractMissingProof(input)

  // ── Extract session counts ────────────────────────────────────────────────
  const completedSessionCount = mutationTargetSessionResolutionPreviewModel?.completedSessionCount ?? 0
  const futureSessionCount = mutationTargetSessionResolutionPreviewModel?.futureSessionCount ?? 0

  // ── Derive blocked reasons ────────────────────────────────────────────────
  const blockedReasons: string[] = []

  // Check for active caution signals
  const activeCautionCount = cautionSignals.filter(s => s.blocksMutation).length
  if (activeCautionCount > 0) {
    blockedReasons.push(`${activeCautionCount} active caution signal${activeCautionCount !== 1 ? 's' : ''} detected`)
  }

  // Check for no future targets
  if (futureSessionCount === 0 && completedSessionCount > 0) {
    blockedReasons.push('All sessions completed — no future targets available')
  }

  // Check confirmation contract status
  const confirmationStatus = mutationConfirmationContractPreviewModel?.status
  if (confirmationStatus === 'blocked_no_future_targets') {
    blockedReasons.push('Confirmation blocked: no future targets')
  } else if (confirmationStatus === 'blocked_completed_only') {
    blockedReasons.push('Confirmation blocked: completed sessions only')
  } else if (confirmationStatus === 'blocked_by_caution') {
    blockedReasons.push('Confirmation blocked: active caution')
  }

  // ── Determine status ──────────────────────────────────────────────────────
  let status: MutationCautionClearanceGateStatus
  let headline: string
  let summary: string
  let confidence: 'high' | 'medium' | 'low' | 'none'
  let nextSafeGate: string

  // Priority 1: Active caution blocks everything
  if (activeCautionCount > 0) {
    status = 'blocked_active_caution'
    headline = 'Caution clearance blocked'
    summary = `${activeCautionCount} active caution signal${activeCautionCount !== 1 ? 's' : ''} must be addressed before mutation can be considered.`
    confidence = 'high'
    nextSafeGate = 'Clear caution signals through evidence review'
  }
  // Priority 2: No future sessions (all completed)
  else if (futureSessionCount === 0 && completedSessionCount > 0) {
    status = 'blocked_completed_only'
    headline = 'Clearance blocked: all sessions completed'
    summary = `All ${completedSessionCount} program session${completedSessionCount !== 1 ? 's are' : ' is'} completed. No future sessions available for mutation.`
    confidence = 'high'
    nextSafeGate = 'Generate new program with future sessions'
  }
  // Priority 3: No future targets at all
  else if (futureSessionCount === 0) {
    status = 'blocked_no_future_targets'
    headline = 'Clearance blocked: no future targets'
    summary = 'No future session targets available. Mutation cannot proceed without future sessions.'
    confidence = 'high'
    nextSafeGate = 'Generate program with future sessions'
  }
  // Priority 4: Evidence insufficient
  else if (
    planEvidenceTrendReadinessModel?.status === 'insufficient' ||
    planEvidenceTrendReadinessModel?.status === 'unavailable'
  ) {
    status = 'clearance_waiting_for_evidence'
    headline = 'Clearance waiting for evidence'
    summary = 'Insufficient workout evidence to evaluate caution clearance. Complete more workouts to build evidence.'
    confidence = 'low'
    nextSafeGate = 'Collect sufficient workout evidence'
  }
  // Priority 5: Confirmation contract preview eligible
  else if (confirmationStatus === 'preview_eligible_marker_only') {
    status = 'clearance_preview_ready'
    headline = 'Caution clearance: preview ready'
    summary = 'No active caution signals. Future targets exist. Marker-only confirmation preview may proceed in future step.'
    confidence = 'medium'
    nextSafeGate = 'Structural mutation preview gate (future step)'
  }
  // Priority 6: Review only state
  else if (
    mutationReadinessReviewGateModel?.status === 'review_candidates_read_only' ||
    (mutationReadinessReviewGateModel?.reviewCandidateCount ?? 0) > 0
  ) {
    status = 'clearance_review_only'
    headline = 'Caution clearance: review only'
    summary = 'Caution signals appear clear. Review candidates exist. Mutation remains locked until confirmation gate.'
    confidence = 'medium'
    nextSafeGate = 'User confirmation UI gate (future step)'
  }
  // Fallback: Future locked
  else {
    status = 'future_locked'
    headline = 'Caution clearance: future locked'
    summary = 'Caution clearance status is indeterminate. Mutation remains locked pending further gate progression.'
    confidence = 'low'
    nextSafeGate = 'Progress through upstream gates'
  }

  return {
    status,
    headline,
    summary,
    confidence,
    activeCautionCount,
    clearedConditionCount: clearedSignals.length,
    missingProofCount: missingProof.length,
    completedSessionCount,
    futureSessionCount,
    cautionSignals,
    clearedSignals,
    missingProof,
    blockedReasons,
    nextSafeGate,
    ...LOCKED_PERMISSION_FLAGS,
    ...LOCKED_SAFETY_FLAGS,
  }
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export function getMutationCautionClearanceStatusLabel(
  status: MutationCautionClearanceGateStatus
): string {
  switch (status) {
    case 'unavailable':
      return 'Unavailable'
    case 'blocked_active_caution':
      return 'Blocked: Active Caution'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_completed_only':
      return 'Blocked: All Completed'
    case 'clearance_waiting_for_evidence':
      return 'Waiting for Evidence'
    case 'clearance_review_only':
      return 'Clear: Review Only'
    case 'clearance_preview_ready':
      return 'Clear: Preview Ready'
    case 'future_locked':
      return 'Future Locked'
  }
}

export function getMutationCautionClearanceStatusColor(
  status: MutationCautionClearanceGateStatus
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
        text: 'text-amber-400/80',
        border: 'border-amber-500/20',
      }
    case 'blocked_no_future_targets':
    case 'blocked_completed_only':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
        border: 'border-rose-500/20',
      }
    case 'clearance_waiting_for_evidence':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400/70',
        border: 'border-sky-500/20',
      }
    case 'clearance_review_only':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400/70',
        border: 'border-teal-500/20',
      }
    case 'clearance_preview_ready':
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
  }
}
