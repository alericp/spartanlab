/**
 * ============================================================================
 * MASTER-8C.30 / AB20.4.23 — MUTATION PATHWAY READINESS MAP (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only pathway map that answers:
 * "What exact gates must pass before SpartanLab is allowed to perform
 *  controlled future-session mutation?"
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives entirely from existing MutationReadinessReviewGateModel.
 *   6. References writer/apply contracts as locked design-only metadata.
 *   7. canMutateNow is always false. mutationAllowed is always false.
 *   8. Never claims applied adaptation, future-session changes, or auto-adjust.
 *   9. Does NOT call loadMutationPlans(), addConfirmedPlan(), or any apply fn.
 */

import type {
  MutationReadinessReviewGateModel,
  MutationReadinessGateStatus,
} from './mutation-readiness-review-gate'

// ─── Types ──────────────────────────────────────────────────────────────────

export type MutationPathwayGateId =
  | 'evidence_connected'
  | 'trend_classified'
  | 'candidate_resolution'
  | 'caution_cleared'
  | 'target_resolution'
  | 'user_confirmation_contract'
  | 'marker_only_preview'
  | 'structural_preview'
  | 'program_card_visibility'
  | 'live_workout_bridge'

export type MutationPathwayGateStatus =
  | 'ready'
  | 'blocked'
  | 'collect_evidence'
  | 'review_required'
  | 'future_locked'
  | 'not_started'

export interface MutationPathwayGate {
  readonly id: MutationPathwayGateId
  readonly label: string
  readonly status: MutationPathwayGateStatus
  readonly summary: string
  readonly blocker: string | null
  readonly nextRequiredProof: string
  readonly canMutateNow: false
}

export type MutationPathwayMapStatus =
  | 'read_only_pathway_ready'
  | 'blocked_by_caution'
  | 'collect_more_evidence'
  | 'future_writer_locked'
  | 'unavailable'

export interface MutationPathwayReadinessMapModel {
  readonly status: MutationPathwayMapStatus
  readonly headline: string
  readonly summary: string
  readonly currentGateLabel: string
  readonly nextSafeGate: string
  readonly gates: readonly MutationPathwayGate[]

  readonly readyGateCount: number
  readonly blockedGateCount: number
  readonly futureLockedGateCount: number
  readonly reviewRequiredGateCount: number
  readonly collectEvidenceGateCount: number

  readonly canMutateNow: false
  readonly mutationAllowed: false
  readonly requiresExplicitUserApprovalBeforeAnyFutureMutation: true
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly noMethodPlannerChangesApplied: true
  readonly mutationStatus: 'read_only_pathway_map'
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export function getPathwayMapStatusLabel(status: MutationPathwayMapStatus): string {
  switch (status) {
    case 'read_only_pathway_ready': return 'Pathway mapped'
    case 'blocked_by_caution': return 'Blocked by caution'
    case 'collect_more_evidence': return 'Collecting evidence'
    case 'future_writer_locked': return 'Writer locked'
    case 'unavailable': return 'Unavailable'
  }
}

export function getGateStatusLabel(status: MutationPathwayGateStatus): string {
  switch (status) {
    case 'ready': return 'Ready'
    case 'blocked': return 'Blocked'
    case 'collect_evidence': return 'Collect evidence'
    case 'review_required': return 'Review required'
    case 'future_locked': return 'Future locked'
    case 'not_started': return 'Not started'
  }
}

// ─── Gate Color CSS Helper ──────────────────────────────────────────────────

export function getGateStatusColor(status: MutationPathwayGateStatus): {
  bg: string; text: string; border: string
} {
  switch (status) {
    case 'ready':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'blocked':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' }
    case 'collect_evidence':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'review_required':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
    case 'future_locked':
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#6A6A7A]', border: 'border-[#2A2A35]' }
    case 'not_started':
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#5A5A6A]', border: 'border-[#2A2A35]/50' }
  }
}

// ─── Lock Constants ─────────────────────────────────────────────────────────

const PATHWAY_LOCKS = {
  canMutateNow: false as const,
  mutationAllowed: false as const,
  requiresExplicitUserApprovalBeforeAnyFutureMutation: true as const,
  noProgramChangesApplied: true as const,
  noFutureSessionChangesApplied: true as const,
  noProgramCardChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
  noMethodPlannerChangesApplied: true as const,
  mutationStatus: 'read_only_pathway_map' as const,
}

const GATE_LOCK = { canMutateNow: false as const }

// ─── Unavailable Fallback ───────────────────────────────────────────────────

function buildUnavailableModel(): MutationPathwayReadinessMapModel {
  return {
    status: 'unavailable',
    headline: 'Mutation pathway map unavailable',
    summary: 'Review gate model is not available. Pathway gates cannot be resolved.',
    currentGateLabel: 'Unavailable',
    nextSafeGate: 'Provide review gate model',
    gates: [],
    readyGateCount: 0,
    blockedGateCount: 0,
    futureLockedGateCount: 0,
    reviewRequiredGateCount: 0,
    collectEvidenceGateCount: 0,
    ...PATHWAY_LOCKS,
  }
}

// ─── Gate Builders ──────────────────────────────────────────────────────────

function resolveEvidenceConnectedGate(
  reviewGateStatus: MutationReadinessGateStatus,
): MutationPathwayGate {
  const hasEvidence = reviewGateStatus !== 'unavailable'
  const needsMore = reviewGateStatus === 'collect_evidence'

  if (!hasEvidence) {
    return {
      id: 'evidence_connected',
      label: 'Evidence Connected',
      status: 'not_started',
      summary: 'Workout evidence bridge is not connected.',
      blocker: 'No evidence source available',
      nextRequiredProof: 'Connect workout evidence bridge to Coach Recs',
      ...GATE_LOCK,
    }
  }

  if (needsMore) {
    return {
      id: 'evidence_connected',
      label: 'Evidence Connected',
      status: 'collect_evidence',
      summary: 'Evidence bridge is connected but insufficient trusted sessions for analysis.',
      blocker: null,
      nextRequiredProof: 'Log more trusted workout sessions',
      ...GATE_LOCK,
    }
  }

  return {
    id: 'evidence_connected',
    label: 'Evidence Connected',
    status: 'ready',
    summary: 'Workout evidence is connected to the Coach Recs pipeline.',
    blocker: null,
    nextRequiredProof: 'Maintain evidence connection',
    ...GATE_LOCK,
  }
}

function resolveTrendClassifiedGate(
  reviewGateStatus: MutationReadinessGateStatus,
): MutationPathwayGate {
  if (reviewGateStatus === 'unavailable' || reviewGateStatus === 'collect_evidence') {
    return {
      id: 'trend_classified',
      label: 'Trend Classified',
      status: reviewGateStatus === 'unavailable' ? 'not_started' : 'collect_evidence',
      summary: reviewGateStatus === 'unavailable'
        ? 'Trend classification unavailable without evidence.'
        : 'Insufficient evidence for trend classification.',
      blocker: reviewGateStatus === 'unavailable' ? 'No evidence source' : null,
      nextRequiredProof: 'Provide sufficient trusted workout evidence for trend analysis',
      ...GATE_LOCK,
    }
  }

  if (reviewGateStatus === 'blocked_by_caution') {
    return {
      id: 'trend_classified',
      label: 'Trend Classified',
      status: 'blocked',
      summary: 'Trend is classified but indicates a caution pattern that blocks progression.',
      blocker: 'Caution pattern active in trend classification',
      nextRequiredProof: 'Resolve caution signals before safe progression',
      ...GATE_LOCK,
    }
  }

  return {
    id: 'trend_classified',
    label: 'Trend Classified',
    status: 'ready',
    summary: 'Evidence trends are classified and available for review.',
    blocker: null,
    nextRequiredProof: 'Continue monitoring trend evolution',
    ...GATE_LOCK,
  }
}

function resolveCandidateResolutionGate(
  reviewGateStatus: MutationReadinessGateStatus,
  hasReviewCandidates: boolean,
  hasCandidates: boolean,
): MutationPathwayGate {
  if (reviewGateStatus === 'unavailable') {
    return {
      id: 'candidate_resolution',
      label: 'Candidate Resolution',
      status: 'not_started',
      summary: 'No candidates resolved without review gate.',
      blocker: 'Review gate unavailable',
      nextRequiredProof: 'Establish review gate with evidence',
      ...GATE_LOCK,
    }
  }

  if (!hasCandidates) {
    return {
      id: 'candidate_resolution',
      label: 'Candidate Resolution',
      status: 'collect_evidence',
      summary: 'No candidates available for resolution.',
      blocker: null,
      nextRequiredProof: 'Generate Coach Recs candidates from evidence',
      ...GATE_LOCK,
    }
  }

  if (hasReviewCandidates) {
    return {
      id: 'candidate_resolution',
      label: 'Candidate Resolution',
      status: 'ready',
      summary: 'Candidates are resolved into review buckets.',
      blocker: null,
      nextRequiredProof: 'Maintain candidate quality for target mapping',
      ...GATE_LOCK,
    }
  }

  return {
    id: 'candidate_resolution',
    label: 'Candidate Resolution',
    status: 'review_required',
    summary: 'Candidates exist but none have reached review-ready resolution.',
    blocker: null,
    nextRequiredProof: 'Collect more evidence to promote candidates to review-ready',
    ...GATE_LOCK,
  }
}

function resolveCautionClearedGate(
  reviewGateStatus: MutationReadinessGateStatus,
  blockedCount: number,
): MutationPathwayGate {
  if (reviewGateStatus === 'blocked_by_caution' || blockedCount > 0) {
    return {
      id: 'caution_cleared',
      label: 'Caution Cleared',
      status: 'blocked',
      summary: `Caution pattern detected. ${blockedCount} candidate${blockedCount !== 1 ? 's' : ''} blocked by caution.`,
      blocker: 'Active caution pattern must be resolved before mutation is safe',
      nextRequiredProof: 'Address caution signals (pain, tension, RPE anomaly) before progression',
      ...GATE_LOCK,
    }
  }

  if (reviewGateStatus === 'unavailable' || reviewGateStatus === 'collect_evidence') {
    return {
      id: 'caution_cleared',
      label: 'Caution Cleared',
      status: reviewGateStatus === 'unavailable' ? 'not_started' : 'collect_evidence',
      summary: 'Cannot verify caution clearance without sufficient evidence.',
      blocker: reviewGateStatus === 'unavailable' ? 'No evidence source' : null,
      nextRequiredProof: 'Establish evidence base to verify no active caution patterns',
      ...GATE_LOCK,
    }
  }

  return {
    id: 'caution_cleared',
    label: 'Caution Cleared',
    status: 'ready',
    summary: 'No active caution patterns detected. Safe for review progression.',
    blocker: null,
    nextRequiredProof: 'Continue monitoring for caution emergence',
    ...GATE_LOCK,
  }
}

function buildFutureLockedGate(
  id: MutationPathwayGateId,
  label: string,
  summary: string,
  nextRequiredProof: string,
): MutationPathwayGate {
  return {
    id,
    label,
    status: 'future_locked',
    summary,
    blocker: null,
    nextRequiredProof,
    ...GATE_LOCK,
  }
}

// ─── Main Resolver ──────────────────────────────────────────────────────────

export function resolveMutationPathwayReadinessMap(input: {
  readonly mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
}): MutationPathwayReadinessMapModel {
  const reviewGate = input.mutationReadinessReviewGateModel

  // ── Unavailable fallback ───────────────────────────────────────────────
  if (!reviewGate || reviewGate.status === 'unavailable') {
    return buildUnavailableModel()
  }

  // ── Resolve each gate ──────────────────────────────────────────────────
  const gateStatus = reviewGate.status
  const hasReviewCandidates = reviewGate.reviewCandidateCount > 0
  const hasCandidates = reviewGate.candidates.length > 0
  const blockedCount = reviewGate.blockedCandidateCount

  const gates: MutationPathwayGate[] = [
    resolveEvidenceConnectedGate(gateStatus),
    resolveTrendClassifiedGate(gateStatus),
    resolveCandidateResolutionGate(gateStatus, hasReviewCandidates, hasCandidates),
    resolveCautionClearedGate(gateStatus, blockedCount),
    buildFutureLockedGate(
      'target_resolution',
      'Target Resolution',
      'Future step: map review-ready candidates to specific uncompleted session targets.',
      'Resolve target/session mapping after caution clearance and candidate review',
    ),
    buildFutureLockedGate(
      'user_confirmation_contract',
      'User Confirmation',
      'Future step: explicit user confirmation required before any mutation is applied.',
      'Implement confirmation contract with preview before apply',
    ),
    buildFutureLockedGate(
      'marker_only_preview',
      'Marker Preview',
      'Future step: marker-only preview artifact before structural changes.',
      'Build marker-only save with visible proof on Program Cards',
    ),
    buildFutureLockedGate(
      'structural_preview',
      'Structural Preview',
      'Future step: full structural mutation preview requiring DB/target safety proof.',
      'Implement structural mutation writer with safety verification',
    ),
    buildFutureLockedGate(
      'program_card_visibility',
      'Program Card Visibility',
      'Future step: adapted sessions must be visible on Program Cards.',
      'Surface mutation markers and adapted prescriptions on day cards',
    ),
    buildFutureLockedGate(
      'live_workout_bridge',
      'Live Workout Bridge',
      'Future step: adapted sessions must launch correctly in Live Workout.',
      'Bridge adapted session payloads to Start Workout launcher',
    ),
  ]

  // ── Count gate statuses ────────────────────────────────────────────────
  let readyCount = 0
  let blockedGateCount = 0
  let futureLockedCount = 0
  let reviewRequiredCount = 0
  let collectEvidenceCount = 0

  for (const gate of gates) {
    switch (gate.status) {
      case 'ready': readyCount++; break
      case 'blocked': blockedGateCount++; break
      case 'future_locked': futureLockedCount++; break
      case 'review_required': reviewRequiredCount++; break
      case 'collect_evidence': collectEvidenceCount++; break
      case 'not_started': collectEvidenceCount++; break
    }
  }

  // ── Determine overall status ───────────────────────────────────────────
  let status: MutationPathwayMapStatus
  if (blockedGateCount > 0) {
    status = 'blocked_by_caution'
  } else if (collectEvidenceCount > 0 && readyCount < 4) {
    status = 'collect_more_evidence'
  } else if (futureLockedCount > 0) {
    status = 'future_writer_locked'
  } else {
    status = 'read_only_pathway_ready'
  }

  // ── Determine current gate (first non-ready gate) ──────────────────────
  const firstNonReady = gates.find(g => g.status !== 'ready')
  const currentGateLabel = firstNonReady
    ? firstNonReady.label
    : 'All active gates ready'

  // ── Determine next safe gate ───────────────────────────────────────────
  let nextSafeGate: string
  if (blockedGateCount > 0) {
    const blockedGate = gates.find(g => g.status === 'blocked')
    nextSafeGate = blockedGate
      ? `Resolve: ${blockedGate.label}`
      : 'Resolve blocked gates'
  } else if (collectEvidenceCount > 0) {
    const collectGate = gates.find(g => g.status === 'collect_evidence' || g.status === 'not_started')
    nextSafeGate = collectGate
      ? `Collect: ${collectGate.label}`
      : 'Collect more evidence'
  } else if (reviewRequiredCount > 0) {
    const reviewGateItem = gates.find(g => g.status === 'review_required')
    nextSafeGate = reviewGateItem
      ? `Review: ${reviewGateItem.label}`
      : 'Review required gates'
  } else {
    nextSafeGate = 'Target Resolution (future locked)'
  }

  // ── Build headline/summary ─────────────────────────────────────────────
  const headline = buildHeadline(status, readyCount, gates.length)
  const summary = buildSummary(status, readyCount, blockedGateCount, futureLockedCount, reviewRequiredCount, collectEvidenceCount)

  return {
    status,
    headline,
    summary,
    currentGateLabel,
    nextSafeGate,
    gates,
    readyGateCount: readyCount,
    blockedGateCount,
    futureLockedGateCount: futureLockedCount,
    reviewRequiredGateCount: reviewRequiredCount,
    collectEvidenceGateCount: collectEvidenceCount,
    ...PATHWAY_LOCKS,
  }
}

// ─── Copy Builders ──────────────────────────────────────────────────────────

function buildHeadline(status: MutationPathwayMapStatus, readyCount: number, totalCount: number): string {
  switch (status) {
    case 'blocked_by_caution':
      return 'Mutation pathway blocked by active caution pattern'
    case 'collect_more_evidence':
      return `Mutation pathway requires more evidence (${readyCount}/${totalCount} gates ready)`
    case 'future_writer_locked':
      return `Active gates cleared — controlled writer remains locked (${readyCount}/${totalCount} gates ready)`
    case 'read_only_pathway_ready':
      return `All active gates ready — future writer still locked (${readyCount}/${totalCount})`
    case 'unavailable':
      return 'Mutation pathway unavailable'
  }
}

function buildSummary(
  status: MutationPathwayMapStatus,
  readyCount: number,
  blockedCount: number,
  futureLockedCount: number,
  reviewCount: number,
  collectCount: number,
): string {
  const parts: string[] = []

  if (readyCount > 0) parts.push(`${readyCount} ready`)
  if (blockedCount > 0) parts.push(`${blockedCount} blocked`)
  if (reviewCount > 0) parts.push(`${reviewCount} review required`)
  if (collectCount > 0) parts.push(`${collectCount} collecting evidence`)
  if (futureLockedCount > 0) parts.push(`${futureLockedCount} future locked`)

  const countSummary = parts.length > 0 ? parts.join(', ') + '.' : 'No gates resolved.'

  switch (status) {
    case 'blocked_by_caution':
      return `${countSummary} Caution pattern must be resolved before any future controlled adaptation.`
    case 'collect_more_evidence':
      return `${countSummary} More trusted workout sessions needed to advance pathway gates.`
    case 'future_writer_locked':
      return `${countSummary} Remaining gates require future implementation steps (target mapping, user confirmation, structural preview).`
    case 'read_only_pathway_ready':
      return `${countSummary} All active analysis gates are ready. Controlled writer remains locked pending future implementation.`
    case 'unavailable':
      return 'Review gate data not available.'
  }
}
