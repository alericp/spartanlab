/**
 * ============================================================================
 * MASTER-8C.34 / AB20.4.27 — MUTATION CAUTION CLEARANCE GATE (READ-ONLY)
 * [MASTER-8C.45] Extended with caution provenance and deduplication
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
 *
 * [MASTER-8C.45] Caution Provenance:
 *   - Root caution: Direct evidence of pain/tension/injury from workout data
 *   - Candidate-specific caution: Individual method/target candidate safety concern
 *   - Derived cascade: Downstream gate echoes that reflect upstream caution
 *   - Only root + candidate cautions count as independent blockers
 *   - Derived cascade signals are diagnostic only
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

// [MASTER-8C.45] Caution provenance classification
export type MutationCautionProvenance = 'root' | 'candidate_specific' | 'derived_cascade'

// [MASTER-8C.45] Clearance mode based on caution provenance
export type MutationCautionClearanceMode =
  | 'blocked_by_root_caution'
  | 'blocked_by_candidate_caution'
  | 'derived_cascade_only'
  | 'clearance_preview_ready'
  | 'waiting_for_evidence'
  | 'no_future_targets'
  | 'future_locked'

// [MASTER-8C.46] Clearance readiness status for individual root/candidate cautions
export type MutationCautionClearanceReadinessStatus =
  | 'blocking'
  | 'clearable_by_current_evidence'
  | 'waiting_for_more_evidence'
  | 'monitor_only'
  | 'stale_or_misclassified'
  | 'unknown'

// [MASTER-8C.46] Clearance requirement type
export type MutationCautionClearanceRequirement =
  | 'pain_tension_must_resolve'
  | 'injury_signal_must_resolve'
  | 'performance_trend_must_stabilize'
  | 'readiness_evidence_required'
  | 'progression_readiness_required'
  | 'target_candidate_must_resolve'
  | 'manual_review_required'
  | 'not_action_blocking'

// [MASTER-8C.46] Individual clearance item for root/candidate cautions
export interface MutationRootCandidateClearanceItem {
  readonly source: string
  readonly label: string
  readonly reason: string
  readonly provenance: MutationCautionProvenance
  readonly severity: MutationCautionSignalSeverity
  readonly dedupeKey: string
  readonly status: MutationCautionClearanceReadinessStatus
  readonly requirement: MutationCautionClearanceRequirement
  readonly clearanceExplanation: string
  readonly visibleEvidence: string
  readonly blocksMarkerReadiness: boolean
}

export interface MutationCautionClearanceSignal {
  readonly source: string
  readonly label: string
  readonly severity: MutationCautionSignalSeverity
  readonly reason: string
  readonly blocksMutation: boolean
  // [MASTER-8C.45] Provenance fields
  readonly provenance: MutationCautionProvenance
  readonly dedupeKey: string
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

  // [MASTER-8C.45] Provenance-aware caution counts
  readonly rootCautionSignals: readonly MutationCautionClearanceSignal[]
  readonly candidateSpecificCautionSignals: readonly MutationCautionClearanceSignal[]
  readonly derivedCascadeCautionSignals: readonly MutationCautionClearanceSignal[]
  readonly dedupedActiveCautionSignals: readonly MutationCautionClearanceSignal[]
  readonly rootActiveCautionCount: number
  readonly candidateSpecificCautionCount: number
  readonly derivedCascadeCautionCount: number
  readonly allRawCautionSignalCount: number
  readonly cautionProvenanceSummary: string
  readonly cautionClearanceMode: MutationCautionClearanceMode

  // [MASTER-8C.46] Root/Candidate clearance readiness fields
  readonly rootCandidateClearanceItems: readonly MutationRootCandidateClearanceItem[]
  readonly blockingRootCandidateCount: number
  readonly clearableRootCandidateCount: number
  readonly waitingRootCandidateCount: number
  readonly monitorOnlyRootCandidateCount: number
  readonly staleOrMisclassifiedCount: number
  readonly rootCandidateClearanceSummary: string
  readonly rootCandidateClearanceReady: boolean
  // [Prompt 24] Refined semantic counts for decision semantics
  readonly hardBlockingRootCandidateCount: number
  readonly unknownStatusRootCandidateCount: number
  readonly readOnlyClearableRootCandidateCount: number
  readonly diagnosticOnlyRootCandidateCount: number

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

// ─── Caution Classification Helper ──────────────────────────────────────────

/**
 * [MASTER-8C.45] Classify a caution signal by provenance and generate dedupe key.
 * 
 * Root caution: Direct evidence from workout data (pain, tension, injury signals)
 * Candidate-specific: Individual method/target candidate safety concern
 * Derived cascade: Downstream gate echoes reflecting upstream caution
 */
function classifyCautionSignal(
  source: string,
  label: string,
  reason: string
): { provenance: MutationCautionProvenance; dedupeKey: string } {
  // Root/source caution - direct evidence from workout analysis
  if (source === 'plan_evidence_trend') {
    return {
      provenance: 'root',
      dedupeKey: `root:plan_evidence_trend:${label.toLowerCase().replace(/\s+/g, '_')}`,
    }
  }

  // Candidate-specific caution - individual candidate safety concern
  if (source === 'review_candidate') {
    return {
      provenance: 'candidate_specific',
      dedupeKey: `candidate:${label}:${reason.slice(0, 50)}`,
    }
  }

  // Candidate-specific for target candidates with non-generic reasons
  if (source === 'target_candidate') {
    const isGenericCascade = reason.toLowerCase().includes('global caution') ||
      reason.toLowerCase().includes('must clear') ||
      reason.toLowerCase().includes('upstream')
    if (!isGenericCascade) {
      return {
        provenance: 'candidate_specific',
        dedupeKey: `candidate:target:${label}:${reason.slice(0, 50)}`,
      }
    }
  }

  // Derived cascade - downstream gate echoes
  // These sources just reflect that an upstream caution exists
  const cascadeSources = [
    'mutation_readiness_review',
    'mutation_pathway',
    'pathway_gate',
    'target_resolution',
    'confirmation_contract',
  ]
  if (cascadeSources.includes(source)) {
    return {
      provenance: 'derived_cascade',
      dedupeKey: `derived:${source}:${label.toLowerCase().replace(/\s+/g, '_')}`,
    }
  }

  // Target candidate with generic cascade reason
  if (source === 'target_candidate') {
    return {
      provenance: 'derived_cascade',
      dedupeKey: `derived:target_candidate:${label}`,
    }
  }

  // Default to derived cascade for unknown sources
  return {
    provenance: 'derived_cascade',
    dedupeKey: `derived:unknown:${source}:${label}`,
  }
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

  // Check evidence trend for caution pattern (ROOT)
  if (planEvidenceTrendReadinessModel) {
    if (planEvidenceTrendReadinessModel.classification === 'caution_pattern_detected') {
      const { provenance, dedupeKey } = classifyCautionSignal(
        'plan_evidence_trend',
        'Caution pattern detected',
        'Evidence trend analysis indicates caution-level signals'
      )
      signals.push({
        source: 'plan_evidence_trend',
        label: 'Caution pattern detected',
        severity: 'caution',
        reason: 'Evidence trend analysis indicates caution-level signals in workout history',
        blocksMutation: true,
        provenance,
        dedupeKey,
      })
    }
    if (planEvidenceTrendReadinessModel.readinessPosture === 'caution_review') {
      const { provenance, dedupeKey } = classifyCautionSignal(
        'plan_evidence_trend',
        'Caution review required',
        'Readiness posture recommends caution review'
      )
      signals.push({
        source: 'plan_evidence_trend',
        label: 'Caution review required',
        severity: 'watch',
        reason: 'Readiness posture recommends caution review before proceeding',
        blocksMutation: true,
        provenance,
        dedupeKey,
      })
    }
  }

  // Check mutation readiness review gate (DERIVED CASCADE)
  if (mutationReadinessReviewGateModel) {
    if (mutationReadinessReviewGateModel.status === 'blocked_by_caution') {
      const { provenance, dedupeKey } = classifyCautionSignal(
        'mutation_readiness_review',
        'Mutation blocked by caution',
        'Mutation readiness review gate detected blocking caution signals'
      )
      signals.push({
        source: 'mutation_readiness_review',
        label: 'Mutation blocked by caution',
        severity: 'blocked',
        reason: 'Mutation readiness review gate detected blocking caution signals',
        blocksMutation: true,
        provenance,
        dedupeKey,
      })
    }
    // Check individual candidates for caution blocks (CANDIDATE-SPECIFIC)
    for (const candidate of mutationReadinessReviewGateModel.candidates) {
      if (candidate.resolution === 'blocked_caution') {
        const reason = candidate.blockers.join(', ') || 'Caution-level blocker on candidate'
        const { provenance, dedupeKey } = classifyCautionSignal(
          'review_candidate',
          `Candidate blocked: ${candidate.title}`,
          reason
        )
        signals.push({
          source: 'review_candidate',
          label: `Candidate blocked: ${candidate.title}`,
          severity: 'caution',
          reason,
          blocksMutation: true,
          provenance,
          dedupeKey,
        })
      }
    }
  }

  // Check mutation pathway readiness map (DERIVED CASCADE)
  if (mutationPathwayReadinessMapModel) {
    if (mutationPathwayReadinessMapModel.status === 'blocked_by_caution') {
      const { provenance, dedupeKey } = classifyCautionSignal(
        'mutation_pathway',
        'Pathway blocked by caution',
        'Mutation pathway map indicates caution-level gate block'
      )
      signals.push({
        source: 'mutation_pathway',
        label: 'Pathway blocked by caution',
        severity: 'blocked',
        reason: 'Mutation pathway map indicates caution-level gate block',
        blocksMutation: true,
        provenance,
        dedupeKey,
      })
    }
    // Check caution_cleared gate (DERIVED CASCADE)
    const cautionGate = mutationPathwayReadinessMapModel.gates.find(g => g.id === 'caution_cleared')
    if (cautionGate && cautionGate.status === 'blocked') {
      const reason = cautionGate.blocker || 'Caution gate not cleared'
      const { provenance, dedupeKey } = classifyCautionSignal(
        'pathway_gate',
        'Caution clearance gate blocked',
        reason
      )
      signals.push({
        source: 'pathway_gate',
        label: 'Caution clearance gate blocked',
        severity: 'blocked',
        reason,
        blocksMutation: true,
        provenance,
        dedupeKey,
      })
    }
  }

  // Check target session resolution (DERIVED CASCADE or CANDIDATE-SPECIFIC)
  if (mutationTargetSessionResolutionPreviewModel) {
    if (mutationTargetSessionResolutionPreviewModel.status === 'blocked_by_caution') {
      const { provenance, dedupeKey } = classifyCautionSignal(
        'target_resolution',
        'Target resolution blocked by caution',
        'Target session resolution preview blocked by caution signals'
      )
      signals.push({
        source: 'target_resolution',
        label: 'Target resolution blocked by caution',
        severity: 'blocked',
        reason: 'Target session resolution preview blocked by caution signals',
        blocksMutation: true,
        provenance,
        dedupeKey,
      })
    }
    // Check for blocked candidates with caution reasons
    for (const cr of mutationTargetSessionResolutionPreviewModel.candidateResolutions) {
      if (cr.status === 'blocked' && cr.blockedReasons.some(r => r.toLowerCase().includes('caution'))) {
        const reason = cr.blockedReasons.join(', ') || 'Caution blocker on target candidate'
        const { provenance, dedupeKey } = classifyCautionSignal(
          'target_candidate',
          `Target candidate blocked: ${cr.title}`,
          reason
        )
        signals.push({
          source: 'target_candidate',
          label: `Target candidate blocked: ${cr.title}`,
          severity: 'caution',
          reason,
          blocksMutation: true,
          provenance,
          dedupeKey,
        })
      }
    }
  }

  // Check confirmation contract (DERIVED CASCADE)
  if (mutationConfirmationContractPreviewModel) {
    if (mutationConfirmationContractPreviewModel.status === 'blocked_by_caution') {
      const { provenance, dedupeKey } = classifyCautionSignal(
        'confirmation_contract',
        'Confirmation blocked by caution',
        'Confirmation contract preview blocked by caution signals'
      )
      signals.push({
        source: 'confirmation_contract',
        label: 'Confirmation blocked by caution',
        severity: 'blocked',
        reason: 'Confirmation contract preview blocked by caution signals',
        blocksMutation: true,
        provenance,
        dedupeKey,
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

/**
 * [MASTER-8C.45] Dedupe caution signals by stable root key.
 * Returns only unique signals based on dedupeKey.
 */
function dedupeCautionSignals(
  signals: MutationCautionClearanceSignal[]
): MutationCautionClearanceSignal[] {
  const seen = new Set<string>()
  const deduped: MutationCautionClearanceSignal[] = []
  
  for (const signal of signals) {
    if (!seen.has(signal.dedupeKey)) {
      seen.add(signal.dedupeKey)
      deduped.push(signal)
    }
  }
  
  return deduped
}

/**
 * [MASTER-8C.45] Generate provenance summary text.
 */
function generateProvenanceSummary(
  rootCount: number,
  candidateCount: number,
  cascadeCount: number,
  rawCount: number
): string {
  const parts: string[] = []
  
  if (rootCount > 0) {
    parts.push(`${rootCount} root caution${rootCount !== 1 ? 's' : ''} active`)
  }
  if (candidateCount > 0) {
    parts.push(`${candidateCount} candidate-specific caution${candidateCount !== 1 ? 's' : ''}`)
  }
  if (cascadeCount > 0) {
    parts.push(`${cascadeCount} downstream echo${cascadeCount !== 1 ? 'es' : ''} suppressed`)
  }
  
  if (parts.length === 0) {
    return 'No active caution signals'
  }
  
  const summary = parts.join('; ')
  if (rawCount > rootCount + candidateCount) {
    return `${summary} (${rawCount} raw signals total)`
  }
  return summary
}

/**
 * [MASTER-8C.46] Evaluate clearance readiness for a root/candidate caution signal.
 */
function evaluateRootCandidateClearanceItem(
  signal: MutationCautionClearanceSignal,
  context: {
    planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
  }
): MutationRootCandidateClearanceItem {
  const { planEvidenceTrendReadinessModel } = context
  const labelLower = signal.label.toLowerCase()
  const reasonLower = signal.reason.toLowerCase()
  
  const hasPainIndicator = labelLower.includes('pain') || reasonLower.includes('pain')
  const hasInjuryIndicator = labelLower.includes('injury') || reasonLower.includes('injury')
  const hasTensionIndicator = labelLower.includes('tension') || reasonLower.includes('tension')
  const hasTendonIndicator = labelLower.includes('tendon') || reasonLower.includes('tendon')
  const hasJointIndicator = labelLower.includes('joint') || reasonLower.includes('joint')
  const hasProgressionIndicator = reasonLower.includes('progression') || reasonLower.includes('not ready')
  
  let status: MutationCautionClearanceReadinessStatus
  let requirement: MutationCautionClearanceRequirement
  let clearanceExplanation: string
  let visibleEvidence: string
  let blocksMarkerReadiness: boolean
  
  if (signal.source === 'plan_evidence_trend') {
    if (hasPainIndicator || hasTensionIndicator) {
      status = 'blocking'
      requirement = 'pain_tension_must_resolve'
      clearanceExplanation = 'Pain or tension signals detected. Must resolve before proceeding.'
      visibleEvidence = 'Workout evidence shows pain/tension patterns'
      blocksMarkerReadiness = true
    } else if (hasInjuryIndicator || hasTendonIndicator || hasJointIndicator) {
      status = 'blocking'
      requirement = 'injury_signal_must_resolve'
      clearanceExplanation = 'Injury or joint/tendon risk signals detected.'
      visibleEvidence = 'Workout evidence indicates injury/joint/tendon concern'
      blocksMarkerReadiness = true
    } else if (planEvidenceTrendReadinessModel?.readinessPosture === 'caution_review') {
      if (planEvidenceTrendReadinessModel.classification === 'monitoring_pattern' ||
          planEvidenceTrendReadinessModel.classification === 'evidence_connected') {
        status = 'stale_or_misclassified'
        requirement = 'manual_review_required'
        clearanceExplanation = 'Evidence shows stable pattern, but caution signal remains.'
        visibleEvidence = 'Evidence model shows stable status'
        blocksMarkerReadiness = false
      } else {
        status = 'waiting_for_more_evidence'
        requirement = 'readiness_evidence_required'
        clearanceExplanation = 'Caution posture exists. More workout evidence needed.'
        visibleEvidence = 'Current evidence is insufficient for clearance'
        blocksMarkerReadiness = true
      }
    } else {
      status = 'waiting_for_more_evidence'
      requirement = 'readiness_evidence_required'
      clearanceExplanation = 'Caution pattern detected. Additional evidence required.'
      visibleEvidence = 'Caution classification from workout analysis'
      blocksMarkerReadiness = true
    }
  } else if (signal.provenance === 'candidate_specific') {
    if (hasPainIndicator || hasInjuryIndicator || hasTendonIndicator || hasJointIndicator) {
      status = 'blocking'
      requirement = signal.source === 'review_candidate' 
        ? 'pain_tension_must_resolve' 
        : 'target_candidate_must_resolve'
      clearanceExplanation = 'Candidate has safety concern related to pain/injury risk.'
      visibleEvidence = `${signal.label}: ${signal.reason.slice(0, 80)}`
      blocksMarkerReadiness = true
    } else if (hasProgressionIndicator) {
      status = 'waiting_for_more_evidence'
      requirement = 'progression_readiness_required'
      clearanceExplanation = 'Progression readiness not confirmed.'
      visibleEvidence = `Progression status: ${signal.reason.slice(0, 60)}`
      blocksMarkerReadiness = true
    } else {
      const isGenericCaution = reasonLower.includes('caution') && 
        !hasPainIndicator && !hasInjuryIndicator && !hasTendonIndicator
      if (isGenericCaution) {
        status = 'monitor_only'
        requirement = 'not_action_blocking'
        clearanceExplanation = 'Candidate has generic caution flag but no direct safety concern.'
        visibleEvidence = `Review candidate: ${signal.label}`
        blocksMarkerReadiness = false
      } else {
        status = 'waiting_for_more_evidence'
        requirement = 'target_candidate_must_resolve'
        clearanceExplanation = 'Candidate requires additional review before clearance.'
        visibleEvidence = `${signal.source}: ${signal.label}`
        blocksMarkerReadiness = true
      }
    }
  } else {
    status = 'unknown'
    requirement = 'manual_review_required'
    clearanceExplanation = 'Signal source unrecognized. Manual review recommended.'
    visibleEvidence = `Unknown: ${signal.label}`
    blocksMarkerReadiness = true
  }
  
  return {
    source: signal.source,
    label: signal.label,
    reason: signal.reason,
    provenance: signal.provenance,
    severity: signal.severity,
    dedupeKey: signal.dedupeKey,
    status,
    requirement,
    clearanceExplanation,
    visibleEvidence,
    blocksMarkerReadiness,
  }
}

/**
 * [MASTER-8C.46] Generate clearance summary text.
 */
function generateRootCandidateClearanceSummary(
  blockingCount: number,
  clearableCount: number,
  waitingCount: number,
  monitorOnlyCount: number,
  staleCount: number
): string {
  const parts: string[] = []
  if (blockingCount > 0) parts.push(`${blockingCount} blocking`)
  if (clearableCount > 0) parts.push(`${clearableCount} clearable`)
  if (waitingCount > 0) parts.push(`${waitingCount} waiting`)
  if (monitorOnlyCount > 0) parts.push(`${monitorOnlyCount} monitor-only`)
  if (staleCount > 0) parts.push(`${staleCount} stale/misclassified`)
  if (parts.length === 0) return 'No root/candidate cautions to evaluate'
  return parts.join(', ')
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
      // [MASTER-8C.45] Provenance fields
      rootCautionSignals: [],
      candidateSpecificCautionSignals: [],
      derivedCascadeCautionSignals: [],
      dedupedActiveCautionSignals: [],
      rootActiveCautionCount: 0,
      candidateSpecificCautionCount: 0,
      derivedCascadeCautionCount: 0,
      allRawCautionSignalCount: 0,
      cautionProvenanceSummary: 'No models available',
      cautionClearanceMode: 'waiting_for_evidence',
      // [MASTER-8C.46] Clearance readiness fields
      rootCandidateClearanceItems: [],
      blockingRootCandidateCount: 0,
      clearableRootCandidateCount: 0,
      waitingRootCandidateCount: 0,
      monitorOnlyRootCandidateCount: 0,
      staleOrMisclassifiedCount: 0,
      rootCandidateClearanceSummary: 'No models available',
      rootCandidateClearanceReady: false,
      // [Prompt 24] Refined semantic counts
      hardBlockingRootCandidateCount: 0,
      unknownStatusRootCandidateCount: 0,
      readOnlyClearableRootCandidateCount: 0,
      diagnosticOnlyRootCandidateCount: 0,
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
  const allCautionSignals = extractCautionSignals(input)
  const clearedSignals = extractClearedConditions(input)
  const missingProof = extractMissingProof(input)

  // [MASTER-8C.45] Classify signals by provenance
  const rootCautionSignals = allCautionSignals.filter(s => s.provenance === 'root')
  const candidateSpecificCautionSignals = allCautionSignals.filter(s => s.provenance === 'candidate_specific')
  const derivedCascadeCautionSignals = allCautionSignals.filter(s => s.provenance === 'derived_cascade')

  // [MASTER-8C.45] Dedupe - only root + candidate count as active blockers
  const activeSignals = [...rootCautionSignals, ...candidateSpecificCautionSignals]
  const dedupedActiveCautionSignals = dedupeCautionSignals(activeSignals)

  const rootActiveCautionCount = dedupeCautionSignals(rootCautionSignals).length
  const candidateSpecificCautionCount = dedupeCautionSignals(candidateSpecificCautionSignals).length
  const derivedCascadeCautionCount = dedupeCautionSignals(derivedCascadeCautionSignals).length
  const allRawCautionSignalCount = allCautionSignals.length

  // [MASTER-8C.45] Active caution count = root + candidate only (deduped)
  const activeCautionCount = dedupedActiveCautionSignals.length

  // [MASTER-8C.45] Generate provenance summary
  const cautionProvenanceSummary = generateProvenanceSummary(
    rootActiveCautionCount,
    candidateSpecificCautionCount,
    derivedCascadeCautionCount,
    allRawCautionSignalCount
  )

  // [MASTER-8C.46] Evaluate clearance readiness for each root/candidate caution
  const clearanceContext = { planEvidenceTrendReadinessModel }
  const rootCandidateClearanceItems = dedupedActiveCautionSignals.map(signal =>
    evaluateRootCandidateClearanceItem(signal, clearanceContext)
  )
  
  const blockingRootCandidateCount = rootCandidateClearanceItems.filter(i => i.status === 'blocking').length
  const clearableRootCandidateCount = rootCandidateClearanceItems.filter(i => i.status === 'clearable_by_current_evidence').length
  const waitingRootCandidateCount = rootCandidateClearanceItems.filter(i => i.status === 'waiting_for_more_evidence').length
  const monitorOnlyRootCandidateCount = rootCandidateClearanceItems.filter(i => i.status === 'monitor_only').length
  const staleOrMisclassifiedCount = rootCandidateClearanceItems.filter(i => i.status === 'stale_or_misclassified').length
  const unknownStatusRootCandidateCount = rootCandidateClearanceItems.filter(i => i.status === 'unknown').length
  
  // [Prompt 24] Refined semantic groupings for decision logic
  // Hard blockers: items that truly block marker readiness
  const hardBlockingRootCandidateCount = blockingRootCandidateCount + waitingRootCandidateCount + unknownStatusRootCandidateCount
  // Read-only clearable: items with sufficient evidence but not actually cleared yet
  const readOnlyClearableRootCandidateCount = clearableRootCandidateCount
  // Diagnostic only: items that should not hard-block (monitor/stale/misclassified)
  const diagnosticOnlyRootCandidateCount = monitorOnlyRootCandidateCount + staleOrMisclassifiedCount
  
  const rootCandidateClearanceSummary = generateRootCandidateClearanceSummary(
    blockingRootCandidateCount,
    clearableRootCandidateCount,
    waitingRootCandidateCount,
    monitorOnlyRootCandidateCount,
    staleOrMisclassifiedCount
  )
  
  // Clearance is ready only if no blocking/waiting items remain
  const rootCandidateClearanceReady = blockingRootCandidateCount === 0 && waitingRootCandidateCount === 0

  // ── Extract session counts ────────────────────────────────────────────────
  const completedSessionCount = mutationTargetSessionResolutionPreviewModel?.completedSessionCount ?? 0
  const futureSessionCount = mutationTargetSessionResolutionPreviewModel?.futureSessionCount ?? 0

  // ── Derive blocked reasons ────────────────────────────────────────────────
  const blockedReasons: string[] = []

  // [Prompt 24] Semantic blocked reasons - only true hard blockers
  if (blockingRootCandidateCount > 0) {
    blockedReasons.push(`${blockingRootCandidateCount} blocking root/candidate item${blockingRootCandidateCount !== 1 ? 's' : ''}`)
  }
  if (waitingRootCandidateCount > 0) {
    blockedReasons.push(`${waitingRootCandidateCount} item${waitingRootCandidateCount !== 1 ? 's' : ''} waiting for more evidence`)
  }
  if (unknownStatusRootCandidateCount > 0) {
    blockedReasons.push(`${unknownStatusRootCandidateCount} item${unknownStatusRootCandidateCount !== 1 ? 's' : ''} with unknown status`)
  }
  // Clearable/diagnostic items are NOT listed as blockers (they don't hard-block)

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
  }

  // ── Determine clearance mode ──────────────────────────────────────────────
  // [Prompt 24] Semantic clearance mode based on item-level status
  let cautionClearanceMode: MutationCautionClearanceMode

  if (futureSessionCount === 0) {
    cautionClearanceMode = 'no_future_targets'
  } else if (
    planEvidenceTrendReadinessModel?.status === 'insufficient' ||
    planEvidenceTrendReadinessModel?.status === 'unavailable'
  ) {
    cautionClearanceMode = 'waiting_for_evidence'
  } else if (hardBlockingRootCandidateCount > 0) {
    // True hard blockers: blocking, waiting, or unknown items
    cautionClearanceMode = blockingRootCandidateCount > 0 ? 'blocked_by_root_caution' : 'blocked_by_candidate_caution'
  } else if (readOnlyClearableRootCandidateCount > 0) {
    // Clearable items don't hard-block, move to review mode
    cautionClearanceMode = 'clearance_preview_ready'
  } else if (diagnosticOnlyRootCandidateCount > 0 || derivedCascadeCautionCount > 0) {
    // Diagnostic/cascade only - doesn't hard-block
    cautionClearanceMode = 'derived_cascade_only'
  } else if (confirmationStatus === 'preview_eligible_marker_only') {
    cautionClearanceMode = 'clearance_preview_ready'
  } else {
    cautionClearanceMode = 'future_locked'
  }

  // ── Determine status ──────────────────────────────────────────────────────
  let status: MutationCautionClearanceGateStatus
  let headline: string
  let summary: string
  let confidence: 'high' | 'medium' | 'low' | 'none'
  let nextSafeGate: string

  // [Prompt 24] Refined semantic decision order
  // Priority 1: No future sessions (all completed)
  if (futureSessionCount === 0 && completedSessionCount > 0) {
    status = 'blocked_completed_only'
    headline = 'Clearance blocked: all sessions completed'
    summary = `All ${completedSessionCount} program session${completedSessionCount !== 1 ? 's are' : ' is'} completed. No future sessions available for mutation.`
    confidence = 'high'
    nextSafeGate = 'Generate new program with future sessions'
  }
  // Priority 2: No future targets at all
  else if (futureSessionCount === 0) {
    status = 'blocked_no_future_targets'
    headline = 'Clearance blocked: no future targets'
    summary = 'No future session targets available. Mutation cannot proceed without future sessions.'
    confidence = 'high'
    nextSafeGate = 'Generate program with future sessions'
  }
  // Priority 3: Hard-blocking root/candidate items (blocking, waiting, or unknown status)
  else if (hardBlockingRootCandidateCount > 0) {
    status = 'blocked_active_caution'
    const parts: string[] = []
    if (blockingRootCandidateCount > 0) {
      parts.push(`${blockingRootCandidateCount} blocking`)
    }
    if (waitingRootCandidateCount > 0) {
      parts.push(`${waitingRootCandidateCount} waiting for evidence`)
    }
    if (unknownStatusRootCandidateCount > 0) {
      parts.push(`${unknownStatusRootCandidateCount} unknown`)
    }
    headline = `Blocked: ${hardBlockingRootCandidateCount} hard blocker${hardBlockingRootCandidateCount !== 1 ? 's' : ''} (${parts.join(', ')})`
    const extraParts: string[] = []
    if (readOnlyClearableRootCandidateCount > 0) {
      extraParts.push(`${readOnlyClearableRootCandidateCount} clearable read-only`)
    }
    if (diagnosticOnlyRootCandidateCount > 0) {
      extraParts.push(`${diagnosticOnlyRootCandidateCount} diagnostic-only`)
    }
    if (derivedCascadeCautionCount > 0) {
      extraParts.push(`${derivedCascadeCautionCount} cascade echo${derivedCascadeCautionCount !== 1 ? 'es' : ''}`)
    }
    summary = `Hard blockers must resolve before marker/mutation can proceed.${extraParts.length > 0 ? ` Also present: ${extraParts.join(', ')}.` : ''}`
    confidence = 'high'
    nextSafeGate = 'Resolve hard-blocking root/candidate items'
  }
  // Priority 4: Evidence insufficient for evaluation
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
  // Priority 5: All items are clearable read-only (no hard blockers)
  else if (readOnlyClearableRootCandidateCount > 0 && hardBlockingRootCandidateCount === 0) {
    status = 'clearance_review_only'
    const extraParts: string[] = []
    if (diagnosticOnlyRootCandidateCount > 0) {
      extraParts.push(`${diagnosticOnlyRootCandidateCount} diagnostic-only`)
    }
    if (derivedCascadeCautionCount > 0) {
      extraParts.push(`${derivedCascadeCautionCount} cascade echo${derivedCascadeCautionCount !== 1 ? 'es' : ''}`)
    }
    headline = `Review only: ${readOnlyClearableRootCandidateCount} item${readOnlyClearableRootCandidateCount !== 1 ? 's' : ''} clearable by current evidence`
    summary = `Root/candidate items are clearable by current evidence, but no cautions are actually cleared in this step. Read-only preview.${extraParts.length > 0 ? ` Also present: ${extraParts.join(', ')}.` : ''}`
    confidence = 'medium'
    nextSafeGate = 'Proceed to marker-only preview gate'
  }
  // Priority 6: Only diagnostic/cascade items (no hard blockers, no clearable)
  else if (diagnosticOnlyRootCandidateCount > 0 || derivedCascadeCautionCount > 0) {
    status = 'clearance_review_only'
    const parts: string[] = []
    if (diagnosticOnlyRootCandidateCount > 0) {
      parts.push(`${diagnosticOnlyRootCandidateCount} diagnostic-only`)
    }
    if (derivedCascadeCautionCount > 0) {
      parts.push(`${derivedCascadeCautionCount} cascade echo${derivedCascadeCautionCount !== 1 ? 'es' : ''}`)
    }
    headline = 'Clear: diagnostic items only'
    summary = `No hard blockers or clearable items. Present: ${parts.join(', ')}. These do not block marker readiness.`
    confidence = 'medium'
    nextSafeGate = 'Proceed to marker-only preview gate'
  }
  // Priority 7: Confirmation contract preview eligible
  else if (confirmationStatus === 'preview_eligible_marker_only') {
    status = 'clearance_preview_ready'
    headline = 'Caution clearance: preview ready'
    summary = 'No active caution signals. Future targets exist. Marker-only confirmation preview may proceed in future step.'
    confidence = 'medium'
    nextSafeGate = 'Marker-only preview gate (future step)'
  }
  // Priority 8: Review candidates exist
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
    // [MASTER-8C.45] Provenance fields
    rootCautionSignals,
    candidateSpecificCautionSignals,
    derivedCascadeCautionSignals,
    dedupedActiveCautionSignals,
    rootActiveCautionCount,
    candidateSpecificCautionCount,
    derivedCascadeCautionCount,
    allRawCautionSignalCount,
    cautionProvenanceSummary,
    cautionClearanceMode,
    // [MASTER-8C.46] Clearance readiness fields
    rootCandidateClearanceItems,
    blockingRootCandidateCount,
    clearableRootCandidateCount,
    waitingRootCandidateCount,
    monitorOnlyRootCandidateCount,
    staleOrMisclassifiedCount,
    rootCandidateClearanceSummary,
    rootCandidateClearanceReady,
    // [Prompt 24] Refined semantic counts for decision semantics
    hardBlockingRootCandidateCount,
    unknownStatusRootCandidateCount,
    readOnlyClearableRootCandidateCount,
    diagnosticOnlyRootCandidateCount,
    // Visible caution signals = deduped active + cascade for diagnostics
    cautionSignals: [...dedupedActiveCautionSignals, ...dedupeCautionSignals(derivedCascadeCautionSignals)],
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
      return 'Blocked: Evidence Required'
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

// [MASTER-8C.45] Clearance mode label helper
export function getMutationCautionClearanceModeLabel(
  mode: MutationCautionClearanceMode
): string {
  switch (mode) {
    case 'blocked_by_root_caution':
      return 'Blocked: Root Caution'
    case 'blocked_by_candidate_caution':
      return 'Blocked: Candidate Caution'
    case 'derived_cascade_only':
      return 'Cascade Only'
    case 'clearance_preview_ready':
      return 'Preview Ready'
    case 'waiting_for_evidence':
      return 'Waiting for Evidence'
    case 'no_future_targets':
      return 'No Future Targets'
    case 'future_locked':
      return 'Future Locked'
  }
}
