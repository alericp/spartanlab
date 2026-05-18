/**
 * ============================================================================
 * [Prompt 23 of 77] ROOT/CANDIDATE CLEARANCE EVIDENCE DETAIL (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only helper that extracts and explains each active
 * root/candidate clearance item with source evidence, clearance status, blocking
 * status, and next required evidence.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No caution clearing — only explains evidence status.
 *   5. canClearCautions, canSaveMarker, canWriteMarker always false.
 *   6. Derives entirely from existing read-only models.
 */

import type {
  MutationCautionClearanceGateModel,
  MutationRootCandidateClearanceItem,
  MutationCautionClearanceReadinessStatus,
} from './mutation-caution-clearance-gate'
import type { MarkerSaveArtifactPreviewModel } from './marker-save-artifact-preview'
import type { MarkerWriteReadinessLedgerModel } from './marker-write-readiness-ledger'

// ─── Types ──────────────────────────────────────────────────────────────────

export type RootCandidateEvidenceDetailStatus =
  | 'unavailable'
  | 'blocked_missing_evidence'
  | 'blocked_true_root'
  | 'blocked_candidate_unresolved'
  | 'watch_only_diagnostic'
  | 'clearable_read_only'
  | 'cleared_by_existing_evidence_read_only'

export interface RootCandidateEvidenceDetailItem {
  readonly id: string
  readonly label: string
  readonly category: 'root' | 'candidate' | 'cascade' | 'diagnostic'
  readonly status: RootCandidateEvidenceDetailStatus
  readonly blocksMarkerReadiness: boolean
  readonly evidenceSource: string
  readonly evidenceSummary: string
  readonly missingEvidence: readonly string[]
  readonly nextRequiredAction: string
}

export interface RootCandidateClearanceEvidenceDetailModel {
  readonly status:
    | 'unavailable'
    | 'blocked'
    | 'partially_explained'
    | 'all_items_explained_read_only'
    | 'all_clearable_read_only'

  readonly mode: 'read_only_clearance_evidence_detail'
  readonly headline: string
  readonly summary: string

  readonly items: readonly RootCandidateEvidenceDetailItem[]
  readonly blockingCount: number
  readonly clearableReadOnlyCount: number
  readonly diagnosticOnlyCount: number
  readonly missingEvidenceCount: number

  readonly blockerSummary: readonly string[]
  readonly sourceModelsUsed: readonly string[]
  readonly nextRequiredStep: string

  readonly canClearCautions: false
  readonly canSaveMarker: false
  readonly canWriteMarker: false
  readonly canPersistMarker: false
  readonly canMutateProgramCards: false
  readonly canMutateStartWorkout: false
  readonly canMutateLiveWorkout: false
  readonly canMutateStructure: false

  readonly noMarkerSaved: true
  readonly noMarkerWriteAttempted: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
}

export interface RootCandidateClearanceEvidenceDetailInput {
  readonly mutationCautionClearanceGateModel: MutationCautionClearanceGateModel | null | undefined
  readonly markerSaveArtifactPreviewModel: MarkerSaveArtifactPreviewModel | null | undefined
  readonly markerWriteReadinessLedgerModel: MarkerWriteReadinessLedgerModel | null | undefined
  readonly targetSessionCount: number
  readonly completedSessionCount: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCKED_FLAGS = {
  canClearCautions: false as const,
  canSaveMarker: false as const,
  canWriteMarker: false as const,
  canPersistMarker: false as const,
  canMutateProgramCards: false as const,
  canMutateStartWorkout: false as const,
  canMutateLiveWorkout: false as const,
  canMutateStructure: false as const,
}

const SAFETY_FLAGS = {
  noMarkerSaved: true as const,
  noMarkerWriteAttempted: true as const,
  noProgramChangesApplied: true as const,
  noWorkoutChangesApplied: true as const,
}

// ─── Resolver ───────────────────────────────────────────────────────────────

function mapClearanceStatusToDetailStatus(
  clearanceStatus: MutationCautionClearanceReadinessStatus,
  blocksMarkerReadiness: boolean
): RootCandidateEvidenceDetailStatus {
  switch (clearanceStatus) {
    case 'blocking':
      return blocksMarkerReadiness ? 'blocked_true_root' : 'blocked_candidate_unresolved'
    case 'clearable_by_current_evidence':
      return 'clearable_read_only'
    case 'waiting_for_more_evidence':
      return 'blocked_missing_evidence'
    case 'monitor_only':
      return 'watch_only_diagnostic'
    case 'stale_or_misclassified':
      return 'watch_only_diagnostic'
    case 'unknown':
    default:
      return 'blocked_missing_evidence'
  }
}

function mapProvenanceToCategory(
  provenance: 'root' | 'candidate_specific' | 'derived_cascade'
): 'root' | 'candidate' | 'cascade' | 'diagnostic' {
  switch (provenance) {
    case 'root':
      return 'root'
    case 'candidate_specific':
      return 'candidate'
    case 'derived_cascade':
      return 'cascade'
    default:
      return 'diagnostic'
  }
}

function mapClearanceItemToDetailItem(
  item: MutationRootCandidateClearanceItem,
  index: number
): RootCandidateEvidenceDetailItem {
  const category = mapProvenanceToCategory(item.provenance)
  const status = mapClearanceStatusToDetailStatus(item.status, item.blocksMarkerReadiness)

  const missingEvidence: string[] = []
  if (item.status === 'waiting_for_more_evidence') {
    missingEvidence.push(item.requirement.replace(/_/g, ' '))
  }
  if (item.status === 'unknown') {
    missingEvidence.push('Source evidence not yet available')
  }

  let nextRequiredAction = 'Monitor and reassess'
  if (item.status === 'blocking') {
    nextRequiredAction = item.requirement.replace(/_/g, ' ')
  } else if (item.status === 'clearable_by_current_evidence') {
    nextRequiredAction = 'Can be cleared based on current evidence (read-only preview)'
  } else if (item.status === 'waiting_for_more_evidence') {
    nextRequiredAction = `Waiting: ${item.requirement.replace(/_/g, ' ')}`
  } else if (item.status === 'monitor_only') {
    nextRequiredAction = 'Watch only — does not block marker readiness'
  }

  return {
    id: `${item.dedupeKey}-${index}`,
    label: item.label,
    category,
    status,
    blocksMarkerReadiness: item.blocksMarkerReadiness,
    evidenceSource: item.source,
    evidenceSummary: item.visibleEvidence || item.clearanceExplanation || item.reason,
    missingEvidence,
    nextRequiredAction,
  }
}

export function resolveRootCandidateClearanceEvidenceDetail(
  input: RootCandidateClearanceEvidenceDetailInput
): RootCandidateClearanceEvidenceDetailModel {
  const {
    mutationCautionClearanceGateModel,
    markerSaveArtifactPreviewModel,
    markerWriteReadinessLedgerModel,
    targetSessionCount,
    completedSessionCount,
  } = input

  const sourceModelsUsed: string[] = []

  // Gate 1: No source models available
  if (!mutationCautionClearanceGateModel) {
    return {
      status: 'unavailable',
      mode: 'read_only_clearance_evidence_detail',
      headline: 'Clearance Evidence Unavailable',
      summary: 'No caution clearance gate model available to extract evidence details.',
      items: [],
      blockingCount: 0,
      clearableReadOnlyCount: 0,
      diagnosticOnlyCount: 0,
      missingEvidenceCount: 1,
      blockerSummary: ['No caution clearance gate model'],
      sourceModelsUsed: [],
      nextRequiredStep: 'Ensure caution clearance gate model is computed upstream.',
      ...LOCKED_FLAGS,
      ...SAFETY_FLAGS,
    }
  }

  sourceModelsUsed.push('mutationCautionClearanceGateModel')
  if (markerSaveArtifactPreviewModel) sourceModelsUsed.push('markerSaveArtifactPreviewModel')
  if (markerWriteReadinessLedgerModel) sourceModelsUsed.push('markerWriteReadinessLedgerModel')

  // Extract item-level details from existing model
  const rootCandidateItems = mutationCautionClearanceGateModel.rootCandidateClearanceItems

  let items: RootCandidateEvidenceDetailItem[]

  if (rootCandidateItems.length === 0) {
    // No item-level details — create summary fallback
    const hasRootCautions = mutationCautionClearanceGateModel.rootActiveCautionCount > 0
    const hasCandidateCautions = mutationCautionClearanceGateModel.candidateSpecificCautionCount > 0
    const hasDerivedCascade = mutationCautionClearanceGateModel.derivedCascadeCautionCount > 0

    items = []

    if (hasRootCautions) {
      items.push({
        id: 'summary-root-cautions',
        label: `${mutationCautionClearanceGateModel.rootActiveCautionCount} root caution(s) active`,
        category: 'root',
        status: 'blocked_true_root',
        blocksMarkerReadiness: true,
        evidenceSource: 'mutation-caution-clearance-gate summary',
        evidenceSummary: mutationCautionClearanceGateModel.rootCautionSignals.map(s => s.reason).join('; ') || 'Root cautions present',
        missingEvidence: ['item-level root evidence details'],
        nextRequiredAction: 'Resolve root cautions before proceeding',
      })
    }

    if (hasCandidateCautions) {
      items.push({
        id: 'summary-candidate-cautions',
        label: `${mutationCautionClearanceGateModel.candidateSpecificCautionCount} candidate caution(s) active`,
        category: 'candidate',
        status: 'blocked_candidate_unresolved',
        blocksMarkerReadiness: true,
        evidenceSource: 'mutation-caution-clearance-gate summary',
        evidenceSummary: mutationCautionClearanceGateModel.candidateSpecificCautionSignals.map(s => s.reason).join('; ') || 'Candidate cautions present',
        missingEvidence: ['item-level candidate evidence details'],
        nextRequiredAction: 'Resolve candidate cautions before proceeding',
      })
    }

    if (hasDerivedCascade) {
      items.push({
        id: 'summary-cascade-signals',
        label: `${mutationCautionClearanceGateModel.derivedCascadeCautionCount} cascade signal(s)`,
        category: 'cascade',
        status: 'watch_only_diagnostic',
        blocksMarkerReadiness: false,
        evidenceSource: 'mutation-caution-clearance-gate summary',
        evidenceSummary: 'Downstream echoes from root/candidate cautions — diagnostic only',
        missingEvidence: [],
        nextRequiredAction: 'Watch only — resolves when upstream cautions clear',
      })
    }

    if (items.length === 0) {
      // No cautions at all
      items.push({
        id: 'no-cautions-detected',
        label: 'No active root/candidate cautions',
        category: 'diagnostic',
        status: 'cleared_by_existing_evidence_read_only',
        blocksMarkerReadiness: false,
        evidenceSource: 'mutation-caution-clearance-gate summary',
        evidenceSummary: 'All caution signals resolved or none active',
        missingEvidence: [],
        nextRequiredAction: 'Proceed to marker readiness verification',
      })
    }
  } else {
    // Map item-level details
    items = rootCandidateItems.map((item, i) => mapClearanceItemToDetailItem(item, i))
  }

  // Calculate counts
  const blockingCount = items.filter(i => i.blocksMarkerReadiness).length
  const clearableReadOnlyCount = items.filter(i => i.status === 'clearable_read_only').length
  const diagnosticOnlyCount = items.filter(i =>
    i.status === 'watch_only_diagnostic' || i.category === 'cascade' || i.category === 'diagnostic'
  ).length
  const missingEvidenceCount = items.filter(i =>
    i.status === 'blocked_missing_evidence' || i.missingEvidence.length > 0
  ).length

  // Build blocker summary
  const blockerSummary: string[] = []
  for (const item of items) {
    if (item.blocksMarkerReadiness) {
      blockerSummary.push(`${item.label}: ${item.nextRequiredAction}`)
    }
  }

  // Determine overall status
  let status: RootCandidateClearanceEvidenceDetailModel['status']
  let headline: string
  let summary: string
  let nextRequiredStep: string

  if (blockingCount > 0 && missingEvidenceCount > 0) {
    status = 'blocked'
    headline = `${blockingCount} Blocking Item(s), ${missingEvidenceCount} Missing Evidence`
    summary = `Root/candidate clearance blocked. ${blockingCount} item(s) actively block marker readiness. ${missingEvidenceCount} item(s) have missing or incomplete evidence.`
    nextRequiredStep = 'Resolve blocking root/candidate cautions and provide missing evidence before marker preview can proceed.'
  } else if (blockingCount > 0) {
    status = 'blocked'
    headline = `${blockingCount} Blocking Item(s)`
    summary = `Root/candidate clearance blocked by ${blockingCount} active caution(s). Evidence is explained but cautions must resolve before marker readiness.`
    nextRequiredStep = 'Wait for blocking cautions to resolve based on future workout evidence.'
  } else if (missingEvidenceCount > 0) {
    status = 'partially_explained'
    headline = `${missingEvidenceCount} Item(s) Missing Evidence`
    summary = `No active blockers, but ${missingEvidenceCount} item(s) need additional evidence to confirm clearance.`
    nextRequiredStep = 'Gather additional evidence to fully explain all clearance items.'
  } else if (clearableReadOnlyCount > 0) {
    status = 'all_clearable_read_only'
    headline = `${clearableReadOnlyCount} Item(s) Clearable (Read-Only)`
    summary = `All items have sufficient evidence. ${clearableReadOnlyCount} item(s) marked as clearable based on current evidence. This is a read-only preview — no cautions actually cleared.`
    nextRequiredStep = 'Clearance evidence complete. Future prompt may enable controlled clearing.'
  } else {
    status = 'all_items_explained_read_only'
    headline = 'All Items Explained'
    summary = `${items.length} item(s) fully explained. ${diagnosticOnlyCount} diagnostic/watch-only. No active blockers. Read-only evidence detail.`
    nextRequiredStep = 'Evidence detail complete. Marker readiness may proceed if all other gates pass.'
  }

  return {
    status,
    mode: 'read_only_clearance_evidence_detail',
    headline,
    summary,
    items,
    blockingCount,
    clearableReadOnlyCount,
    diagnosticOnlyCount,
    missingEvidenceCount,
    blockerSummary,
    sourceModelsUsed,
    nextRequiredStep,
    ...LOCKED_FLAGS,
    ...SAFETY_FLAGS,
  }
}

// ─── Label/Color Helpers ────────────────────────────────────────────────────

export function getRootCandidateClearanceEvidenceDetailStatusLabel(
  status: RootCandidateClearanceEvidenceDetailModel['status']
): string {
  switch (status) {
    case 'unavailable':
      return 'Unavailable'
    case 'blocked':
      return 'Blocked'
    case 'partially_explained':
      return 'Partial'
    case 'all_items_explained_read_only':
      return 'Explained'
    case 'all_clearable_read_only':
      return 'Clearable (RO)'
    default:
      return 'Unknown'
  }
}

export function getRootCandidateClearanceEvidenceDetailStatusColor(
  status: RootCandidateClearanceEvidenceDetailModel['status']
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
    case 'blocked':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
    case 'partially_explained':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' }
    case 'all_items_explained_read_only':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' }
    case 'all_clearable_read_only':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
  }
}

export function getRootCandidateEvidenceItemStatusColor(
  status: RootCandidateEvidenceDetailStatus
): { bg: string; text: string } {
  switch (status) {
    case 'unavailable':
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    case 'blocked_missing_evidence':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400' }
    case 'blocked_true_root':
      return { bg: 'bg-red-500/20', text: 'text-red-400' }
    case 'blocked_candidate_unresolved':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400' }
    case 'watch_only_diagnostic':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400' }
    case 'clearable_read_only':
      return { bg: 'bg-teal-500/20', text: 'text-teal-400' }
    case 'cleared_by_existing_evidence_read_only':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
  }
}

export function getRootCandidateEvidenceItemStatusLabel(
  status: RootCandidateEvidenceDetailStatus
): string {
  switch (status) {
    case 'unavailable':
      return 'unavailable'
    case 'blocked_missing_evidence':
      return 'missing evidence'
    case 'blocked_true_root':
      return 'root blocker'
    case 'blocked_candidate_unresolved':
      return 'candidate unresolved'
    case 'watch_only_diagnostic':
      return 'watch only'
    case 'clearable_read_only':
      return 'clearable (RO)'
    case 'cleared_by_existing_evidence_read_only':
      return 'cleared (RO)'
    default:
      return 'unknown'
  }
}
