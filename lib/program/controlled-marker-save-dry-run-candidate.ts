/**
 * Controlled Marker-Save Dry-Run Candidate
 * 
 * MASTER-8C.72 / AB20.4.65 / Prompt 67
 * 
 * This is a pure read-only helper that determines whether the system can
 * simulate/review a marker-save candidate locally without:
 * - writing anything
 * - persisting anything
 * - mutating Program Cards
 * - touching Start Workout / Live Workout
 * 
 * This is the bridge from "adaptive preview exists" to "marker-save dry-run is reviewable."
 * 
 * HARD SAFETY INVARIANTS (all literal false/true):
 * - previewOnly: true
 * - dryRunOnly: true
 * - localOnly: true
 * - realMarkerWriteEnabled: false
 * - realWriterOpened: false
 * - persistenceEnabled: false
 * - receiptWritten: false
 * - programCardsChanged: false
 * - startWorkoutChanged: false
 * - liveWorkoutChanged: false
 * - futureSessionMutationEnabled: false
 * - apiTouched: false
 * - dbTouched: false
 * - storageTouched: false
 * - schemaTouched: false
 * - completedSessionsProtected: true
 */

import type { FutureSessionAdaptivePreviewDiffModel } from './future-session-adaptive-preview-diff'
import type { LocalAuthorizationCautionReviewGateModel } from './local-authorization-caution-review-gate'
import type { ControlledMarkerSaveActionBoundaryModel } from './controlled-marker-save-action-boundary'
import type { MarkerSaveArtifactPreviewModel } from './marker-save-artifact-preview'
import type { MarkerWriteReadinessLedgerModel } from './marker-write-readiness-ledger'

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------

export type ControlledMarkerSaveDryRunCandidateStatus =
  | 'dry_run_candidate_ready_no_write'
  | 'dry_run_waiting_for_local_review'
  | 'dry_run_blocked_missing_adaptive_preview'
  | 'dry_run_blocked_no_preview_changes'
  | 'dry_run_blocked_by_caution_or_authorization'
  | 'dry_run_blocked_by_marker_readiness'
  | 'dry_run_source_missing_or_stale'

// -----------------------------------------------------------------------------
// Dry-Run Checklist Item
// -----------------------------------------------------------------------------

export interface DryRunChecklistItem {
  readonly key: string
  readonly label: string
  readonly status: 'passed' | 'failed' | 'pending' | 'blocked' | 'protected'
  readonly detail: string
}

// -----------------------------------------------------------------------------
// Simulated Marker Fields (what WOULD be in a future marker, without saving)
// -----------------------------------------------------------------------------

export interface SimulatedMarkerFields {
  readonly markerKind: 'future_session_mutation_readiness_marker'
  readonly targetSessionLabel: string
  readonly previewChangeCount: number
  readonly completedSessionsProtected: true
  readonly mutationMode: 'preview_dry_run_only'
  readonly persistence: 'disabled'
  readonly programCardsChanged: 'no'
  readonly startWorkoutChanged: 'no'
  readonly liveWorkoutChanged: 'no'
  readonly source: 'Future Session Adaptive Preview Diff'
}

// -----------------------------------------------------------------------------
// Main Model Interface
// -----------------------------------------------------------------------------

export interface ControlledMarkerSaveDryRunCandidateModel {
  readonly sourceStep: 'MASTER-8C.72 / AB20.4.65 / Prompt 67'
  readonly status: ControlledMarkerSaveDryRunCandidateStatus
  readonly headline: string
  readonly summary: string

  readonly targetLabel: string
  readonly previewChangeCount: number
  readonly proposedMarkerKind: 'future_session_mutation_readiness_marker'
  readonly dryRunCandidateId: string

  // Hard safety invariants - all literal
  readonly previewOnly: true
  readonly dryRunOnly: true
  readonly localOnly: true
  readonly realMarkerWriteEnabled: false
  readonly realWriterOpened: false
  readonly persistenceEnabled: false
  readonly receiptWritten: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly storageTouched: false
  readonly schemaTouched: false
  readonly completedSessionsProtected: true

  readonly sourceModelsUsed: readonly string[]
  readonly blockers: readonly string[]
  readonly dryRunChecklist: readonly DryRunChecklistItem[]
  readonly simulatedMarkerFields: SimulatedMarkerFields
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

// -----------------------------------------------------------------------------
// Input Interface
// -----------------------------------------------------------------------------

export interface ControlledMarkerSaveDryRunCandidateInput {
  readonly futureSessionAdaptivePreviewDiffModel: FutureSessionAdaptivePreviewDiffModel | null | undefined
  readonly localAuthorizationCautionReviewGateModel: LocalAuthorizationCautionReviewGateModel | null | undefined
  readonly controlledMarkerSaveActionBoundaryModel?: ControlledMarkerSaveActionBoundaryModel | null | undefined
  readonly markerSaveArtifactPreviewModel?: MarkerSaveArtifactPreviewModel | null | undefined
  readonly markerWriteReadinessLedgerModel?: MarkerWriteReadinessLedgerModel | null | undefined
}

// -----------------------------------------------------------------------------
// Resolver Function
// -----------------------------------------------------------------------------

export function resolveControlledMarkerSaveDryRunCandidate(
  input: ControlledMarkerSaveDryRunCandidateInput
): ControlledMarkerSaveDryRunCandidateModel {
  const {
    futureSessionAdaptivePreviewDiffModel,
    localAuthorizationCautionReviewGateModel,
    controlledMarkerSaveActionBoundaryModel,
    markerSaveArtifactPreviewModel,
    markerWriteReadinessLedgerModel,
  } = input

  // Track which source models are present
  const sourceModelsUsed: string[] = []
  if (futureSessionAdaptivePreviewDiffModel) sourceModelsUsed.push('FutureSessionAdaptivePreviewDiff')
  if (localAuthorizationCautionReviewGateModel) sourceModelsUsed.push('LocalAuthorizationCautionReviewGate')
  if (controlledMarkerSaveActionBoundaryModel) sourceModelsUsed.push('ControlledMarkerSaveActionBoundary')
  if (markerSaveArtifactPreviewModel) sourceModelsUsed.push('MarkerSaveArtifactPreview')
  if (markerWriteReadinessLedgerModel) sourceModelsUsed.push('MarkerWriteReadinessLedger')

  // Derive values from adaptive preview
  const adaptivePreviewExists = !!futureSessionAdaptivePreviewDiffModel
  const adaptivePreviewChanges = futureSessionAdaptivePreviewDiffModel?.changes ?? []
  const adaptivePreviewChangeCount = adaptivePreviewChanges.length
  const targetLabel = futureSessionAdaptivePreviewDiffModel?.targetLabel ?? 'Target unavailable'
  const targetSessionCount = futureSessionAdaptivePreviewDiffModel?.targetSessionCount ?? 0

  // Derive values from local authorization/caution gate
  const localGateExists = !!localAuthorizationCautionReviewGateModel
  const localDryRunGateReady = localAuthorizationCautionReviewGateModel?.localDryRunGateReady ?? false
  const cautionPatternActive = localAuthorizationCautionReviewGateModel?.cautionPatternActive ?? false
  const localCautionReviewAccepted = localAuthorizationCautionReviewGateModel?.localCautionReviewAccepted ?? false
  const localAuthorizationAccepted = localAuthorizationCautionReviewGateModel?.localAuthorizationAccepted ?? false

  // Build blockers list
  const blockers: string[] = []

  // Check: adaptive preview must exist
  if (!adaptivePreviewExists) {
    blockers.push('Future Session Adaptive Preview Diff is missing')
  }

  // Check: adaptive preview must have changes
  if (adaptivePreviewExists && adaptivePreviewChangeCount === 0) {
    blockers.push('Adaptive preview has no proposed changes')
  }

  // Check: local gate must exist
  if (!localGateExists) {
    blockers.push('Local Authorization + Caution Review Gate is missing')
  }

  // Check: caution review if needed
  if (cautionPatternActive && !localCautionReviewAccepted) {
    blockers.push('Caution pattern is active but local caution review not accepted')
  }

  // Check: local authorization
  if (!localAuthorizationAccepted) {
    blockers.push('Local authorization preview not accepted')
  }

  // Determine status based on blockers and state
  let status: ControlledMarkerSaveDryRunCandidateStatus
  let headline: string
  let summary: string

  if (!adaptivePreviewExists) {
    status = 'dry_run_blocked_missing_adaptive_preview'
    headline = 'Dry-run candidate blocked: missing adaptive preview'
    summary = 'The Future Session Adaptive Preview Diff must be present before a marker-save dry-run candidate can be reviewed.'
  } else if (adaptivePreviewChangeCount === 0) {
    status = 'dry_run_blocked_no_preview_changes'
    headline = 'Dry-run candidate blocked: no preview changes'
    summary = 'The adaptive preview exists but has no proposed changes. Cannot create a meaningful dry-run candidate.'
  } else if (!localGateExists) {
    status = 'dry_run_source_missing_or_stale'
    headline = 'Dry-run candidate blocked: source model missing'
    summary = 'The Local Authorization + Caution Review Gate must be present to evaluate dry-run readiness.'
  } else if (cautionPatternActive && !localCautionReviewAccepted) {
    status = 'dry_run_blocked_by_caution_or_authorization'
    headline = 'Dry-run candidate blocked: caution review required'
    summary = 'An active caution pattern requires local review before the dry-run candidate can proceed.'
  } else if (!localAuthorizationAccepted) {
    status = 'dry_run_waiting_for_local_review'
    headline = 'Dry-run candidate waiting: local authorization required'
    summary = 'The adaptive preview is ready, but local authorization must be accepted before dry-run review.'
  } else if (localDryRunGateReady) {
    status = 'dry_run_candidate_ready_no_write'
    headline = 'Dry-run candidate ready for review'
    summary = 'The marker-save dry-run candidate is reviewable. No marker saved. No persistence. No Program Cards / Start Workout / Live Workout changes.'
  } else {
    status = 'dry_run_blocked_by_marker_readiness'
    headline = 'Dry-run candidate blocked: marker readiness'
    summary = 'The adaptive preview exists but marker readiness requirements are not met for dry-run review.'
  }

  // Generate deterministic dry-run candidate ID (no randomness)
  const dryRunCandidateId = `dry-run-${targetLabel.replace(/\s+/g, '-').toLowerCase()}-${adaptivePreviewChangeCount}-${status}`

  // Build dry-run checklist
  const dryRunChecklist: DryRunChecklistItem[] = [
    {
      key: 'adaptive_preview_exists',
      label: 'Adaptive preview exists',
      status: adaptivePreviewExists ? 'passed' : 'failed',
      detail: adaptivePreviewExists 
        ? `Found: ${adaptivePreviewChangeCount} proposed changes` 
        : 'Missing: Future Session Adaptive Preview Diff not found',
    },
    {
      key: 'before_after_changes_present',
      label: 'Before/after changes present',
      status: adaptivePreviewChangeCount > 0 ? 'passed' : 'failed',
      detail: adaptivePreviewChangeCount > 0 
        ? `${adaptivePreviewChangeCount} change(s) with before/after values` 
        : 'No proposed changes in adaptive preview',
    },
    {
      key: 'target_future_session_resolved',
      label: 'Target future session resolved',
      status: targetSessionCount > 0 ? 'passed' : 'pending',
      detail: targetSessionCount > 0 
        ? `Target: ${targetLabel} (${targetSessionCount} session(s))` 
        : 'Target session not yet resolved',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'protected',
      detail: 'Completed sessions are always protected — never mutated by dry-run or preview',
    },
    {
      key: 'local_caution_review_state',
      label: 'Local caution review state',
      status: cautionPatternActive 
        ? (localCautionReviewAccepted ? 'passed' : 'pending') 
        : 'passed',
      detail: cautionPatternActive 
        ? (localCautionReviewAccepted ? 'Caution pattern reviewed locally' : 'Caution pattern active — review required') 
        : 'No active caution pattern',
    },
    {
      key: 'local_authorization_state',
      label: 'Local authorization state',
      status: localAuthorizationAccepted ? 'passed' : 'pending',
      detail: localAuthorizationAccepted 
        ? 'Local authorization preview accepted' 
        : 'Local authorization preview not yet accepted',
    },
    {
      key: 'marker_write_disabled',
      label: 'Marker write remains disabled',
      status: 'passed',
      detail: 'Real marker write is disabled — dry-run only',
    },
    {
      key: 'persistence_disabled',
      label: 'Persistence remains disabled',
      status: 'passed',
      detail: 'Persistence is disabled — no DB/API/storage writes',
    },
    {
      key: 'program_cards_unchanged',
      label: 'Program Cards remain unchanged',
      status: 'passed',
      detail: 'Program Cards are not mutated by dry-run review',
    },
    {
      key: 'start_workout_unchanged',
      label: 'Start Workout remains unchanged',
      status: 'passed',
      detail: 'Start Workout flow is not modified by dry-run review',
    },
    {
      key: 'live_workout_unchanged',
      label: 'Live Workout remains unchanged',
      status: 'passed',
      detail: 'Live Workout runtime is not modified by dry-run review',
    },
  ]

  // Build simulated marker fields (what WOULD be saved, without saving)
  const simulatedMarkerFields: SimulatedMarkerFields = {
    markerKind: 'future_session_mutation_readiness_marker',
    targetSessionLabel: targetLabel,
    previewChangeCount: adaptivePreviewChangeCount,
    completedSessionsProtected: true,
    mutationMode: 'preview_dry_run_only',
    persistence: 'disabled',
    programCardsChanged: 'no',
    startWorkoutChanged: 'no',
    liveWorkoutChanged: 'no',
    source: 'Future Session Adaptive Preview Diff',
  }

  // Safety notes
  const safetyNotes: string[] = [
    'This is a dry-run candidate review only — nothing is saved.',
    'Real marker persistence requires explicit future authorization.',
    'Program Cards, Start Workout, and Live Workout are never modified by dry-run.',
    'Completed sessions are always protected.',
    'No API, DB, or storage calls are made during dry-run review.',
  ]

  // Next required step
  let nextRequiredStep: string
  if (status === 'dry_run_candidate_ready_no_write') {
    nextRequiredStep = 'Prompt 68 / MASTER-8C.73 / AB20.4.66 — marker-save dry-run verification gate; real persistence still disabled'
  } else if (status === 'dry_run_waiting_for_local_review') {
    nextRequiredStep = 'Accept local authorization preview to proceed with dry-run candidate review'
  } else if (status === 'dry_run_blocked_by_caution_or_authorization') {
    nextRequiredStep = 'Review and accept local caution pattern before dry-run candidate can proceed'
  } else {
    nextRequiredStep = 'Resolve blockers to enable dry-run candidate review'
  }

  return {
    sourceStep: 'MASTER-8C.72 / AB20.4.65 / Prompt 67',
    status,
    headline,
    summary,

    targetLabel,
    previewChangeCount: adaptivePreviewChangeCount,
    proposedMarkerKind: 'future_session_mutation_readiness_marker',
    dryRunCandidateId,

    // Hard safety invariants - all literal
    previewOnly: true,
    dryRunOnly: true,
    localOnly: true,
    realMarkerWriteEnabled: false,
    realWriterOpened: false,
    persistenceEnabled: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    apiTouched: false,
    dbTouched: false,
    storageTouched: false,
    schemaTouched: false,
    completedSessionsProtected: true,

    sourceModelsUsed,
    blockers,
    dryRunChecklist,
    simulatedMarkerFields,
    safetyNotes,
    nextRequiredStep,
  }
}

// -----------------------------------------------------------------------------
// UI Helper Functions
// -----------------------------------------------------------------------------

export function getDryRunCandidateStatusLabel(status: ControlledMarkerSaveDryRunCandidateStatus): string {
  switch (status) {
    case 'dry_run_candidate_ready_no_write':
      return 'Dry-Run Ready'
    case 'dry_run_waiting_for_local_review':
      return 'Waiting for Review'
    case 'dry_run_blocked_missing_adaptive_preview':
      return 'Missing Preview'
    case 'dry_run_blocked_no_preview_changes':
      return 'No Changes'
    case 'dry_run_blocked_by_caution_or_authorization':
      return 'Review Required'
    case 'dry_run_blocked_by_marker_readiness':
      return 'Readiness Blocked'
    case 'dry_run_source_missing_or_stale':
      return 'Source Missing'
  }
}

export function getDryRunCandidateStatusColor(status: ControlledMarkerSaveDryRunCandidateStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'dry_run_candidate_ready_no_write':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/90', border: 'border-emerald-500/30' }
    case 'dry_run_waiting_for_local_review':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/90', border: 'border-amber-500/30' }
    case 'dry_run_blocked_missing_adaptive_preview':
    case 'dry_run_blocked_no_preview_changes':
    case 'dry_run_source_missing_or_stale':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/90', border: 'border-rose-500/30' }
    case 'dry_run_blocked_by_caution_or_authorization':
    case 'dry_run_blocked_by_marker_readiness':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/90', border: 'border-amber-500/30' }
  }
}

export function getDryRunChecklistItemStatusLabel(status: DryRunChecklistItem['status']): string {
  switch (status) {
    case 'passed':
      return 'PASS'
    case 'failed':
      return 'FAIL'
    case 'pending':
      return 'PENDING'
    case 'blocked':
      return 'BLOCKED'
    case 'protected':
      return 'PROTECTED'
  }
}

export function getDryRunChecklistItemStatusColor(status: DryRunChecklistItem['status']): {
  bg: string
  text: string
} {
  switch (status) {
    case 'passed':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400/90' }
    case 'failed':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400/90' }
    case 'pending':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400/90' }
    case 'blocked':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400/90' }
    case 'protected':
      return { bg: 'bg-violet-500/20', text: 'text-violet-400/90' }
  }
}
