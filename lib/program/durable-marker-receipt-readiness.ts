/**
 * Durable Marker Receipt Readiness
 * [Prompt 41] Pure read-only model that evaluates whether a locally saved marker proof
 * is eligible to become a durable persisted receipt in a future step.
 * 
 * This is a persistence-readiness EVALUATION only — no actual writes occur.
 * All persistence/mutation flags remain false.
 */

import type { MarkerSaveArtifactPreviewModel } from './marker-save-artifact-preview'
import type { MarkerWriteReadinessLedgerModel } from './marker-write-readiness-ledger'
import type { ControlledMarkerSaveActionBoundaryModel } from './controlled-marker-save-action-boundary'
import type { MarkerSaveAuthorizationPreflightBoundaryModel } from './marker-save-authorization-preflight-boundary'
import type { MarkerOnlyConfirmationBoundaryModel } from './marker-only-confirmation-boundary-preview'

// -----------------------------------------------------------------------------
// Status Union
// -----------------------------------------------------------------------------
export type DurableMarkerReceiptReadinessStatus =
  | 'unavailable_missing_models'
  | 'blocked_no_local_marker'
  | 'blocked_artifact_not_local_saved'
  | 'blocked_ledger_not_local_saved'
  | 'blocked_future_targets_missing'
  | 'blocked_completed_protection_missing'
  | 'blocked_structural_mutation_not_locked'
  | 'persistence_candidate_ready_no_write'

// -----------------------------------------------------------------------------
// Receipt Mode
// -----------------------------------------------------------------------------
export type DurableMarkerReceiptMode =
  | 'read_only_receipt_candidate'
  | 'not_ready'

// -----------------------------------------------------------------------------
// Readiness Item
// -----------------------------------------------------------------------------
export interface DurableMarkerReceiptReadinessItem {
  readonly key: string
  readonly label: string
  readonly status: 'ready' | 'blocked'
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Model Interface
// -----------------------------------------------------------------------------
export interface DurableMarkerReceiptReadinessModel {
  readonly status: DurableMarkerReceiptReadinessStatus
  readonly receiptMode: DurableMarkerReceiptMode
  readonly headline: string
  readonly summary: string

  readonly localMarkerSavedCount: number
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly receiptCandidateCount: number

  readonly items: readonly DurableMarkerReceiptReadinessItem[]
  readonly readyCount: number
  readonly blockedCount: number
  readonly blockerSummary: readonly string[]
  readonly sourceModelsUsed: readonly string[]
  readonly nextRequiredStep: string

  readonly receiptFields: readonly { label: string; value: string }[]

  readonly canPreviewDurableReceipt: boolean
  readonly canCreateDurableReceipt: false
  readonly canPersistMarker: false
  readonly canWriteMarker: false
  readonly canMutateProgramCards: false
  readonly canMutateStartWorkout: false
  readonly canMutateLiveWorkout: false
  readonly canMutateStructure: false

  readonly completedSessionsProtected: true
  readonly noPersistenceAttempted: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
}

// -----------------------------------------------------------------------------
// Input Interface
// -----------------------------------------------------------------------------
export interface DurableMarkerReceiptReadinessInput {
  readonly markerOnlyConfirmationBoundaryModel: MarkerOnlyConfirmationBoundaryModel | null | undefined
  readonly markerSaveAuthorizationPreflightBoundaryModel: MarkerSaveAuthorizationPreflightBoundaryModel | null | undefined
  readonly controlledMarkerSaveActionBoundaryModel: ControlledMarkerSaveActionBoundaryModel | null | undefined
  readonly markerSaveArtifactPreviewModel: MarkerSaveArtifactPreviewModel | null | undefined
  readonly markerWriteReadinessLedgerModel: MarkerWriteReadinessLedgerModel | null | undefined
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------
export function resolveDurableMarkerReceiptReadiness(
  input: DurableMarkerReceiptReadinessInput
): DurableMarkerReceiptReadinessModel {
  const {
    markerOnlyConfirmationBoundaryModel,
    markerSaveAuthorizationPreflightBoundaryModel,
    controlledMarkerSaveActionBoundaryModel,
    markerSaveArtifactPreviewModel,
    markerWriteReadinessLedgerModel,
  } = input

  // Track source models used
  const sourceModelsUsed: string[] = []
  if (markerOnlyConfirmationBoundaryModel) sourceModelsUsed.push('markerOnlyConfirmationBoundaryModel')
  if (markerSaveAuthorizationPreflightBoundaryModel) sourceModelsUsed.push('markerSaveAuthorizationPreflightBoundaryModel')
  if (controlledMarkerSaveActionBoundaryModel) sourceModelsUsed.push('controlledMarkerSaveActionBoundaryModel')
  if (markerSaveArtifactPreviewModel) sourceModelsUsed.push('markerSaveArtifactPreviewModel')
  if (markerWriteReadinessLedgerModel) sourceModelsUsed.push('markerWriteReadinessLedgerModel')

  // Check if required models exist
  const hasRequiredModels = Boolean(
    markerOnlyConfirmationBoundaryModel &&
    markerSaveAuthorizationPreflightBoundaryModel &&
    controlledMarkerSaveActionBoundaryModel &&
    markerSaveArtifactPreviewModel &&
    markerWriteReadinessLedgerModel
  )

  // Extract values from models
  const localMarkerSavedCount = 
    markerWriteReadinessLedgerModel?.markerSavedCount ?? 
    markerSaveArtifactPreviewModel?.markerSavedCount ?? 
    0

  const targetSessionCount = markerOnlyConfirmationBoundaryModel?.targetSessionCount ?? 0
  const completedProtectedCount = markerOnlyConfirmationBoundaryModel?.completedProtectedCount ?? 0

  // Check artifact local proof readiness
  const artifactLocalProof = Boolean(
    markerSaveArtifactPreviewModel?.status === 'local_marker_saved_no_persistence' &&
    markerSaveArtifactPreviewModel?.markerMode === 'local_saved_proof' &&
    markerSaveArtifactPreviewModel?.markerSavedCount > 0
  )

  // Check ledger local proof readiness
  const ledgerLocalProof = Boolean(
    markerWriteReadinessLedgerModel?.status === 'local_marker_saved_no_persistence' &&
    markerWriteReadinessLedgerModel?.ledgerMode === 'local_marker_saved_proof' &&
    markerWriteReadinessLedgerModel?.markerSavedCount > 0
  )

  // Check completed sessions protection
  const completedProtection = Boolean(
    markerSaveArtifactPreviewModel?.completedSessionsProtected === true &&
    markerWriteReadinessLedgerModel?.completedSessionsProtected === true &&
    markerOnlyConfirmationBoundaryModel?.completedSessionsProtected === true
  )

  // Check structural mutation locks
  const structuralMutationLocked = Boolean(
    markerSaveArtifactPreviewModel?.canMutateProgramCards === false &&
    markerSaveArtifactPreviewModel?.canMutateStartWorkout === false &&
    markerSaveArtifactPreviewModel?.canMutateLiveWorkout === false &&
    markerSaveArtifactPreviewModel?.canMutateStructure === false &&
    markerWriteReadinessLedgerModel?.canMutateProgramCards === false &&
    markerWriteReadinessLedgerModel?.canMutateStartWorkout === false &&
    markerWriteReadinessLedgerModel?.canMutateLiveWorkout === false &&
    markerWriteReadinessLedgerModel?.canMutateStructure === false
  )

  // Check persistence is disabled (this is GOOD - proves candidate-readiness only)
  const persistenceDisabled = Boolean(
    markerSaveArtifactPreviewModel?.canPersistMarker === false &&
    markerWriteReadinessLedgerModel?.canPersistMarker === false
  )

  // Build readiness items
  const items: DurableMarkerReceiptReadinessItem[] = []
  const blockerSummary: string[] = []

  // Item 1: required_models_present
  items.push({
    key: 'required_models_present',
    label: 'Required Models Present',
    status: hasRequiredModels ? 'ready' : 'blocked',
    reason: hasRequiredModels
      ? `${sourceModelsUsed.length} source models available`
      : 'One or more required models missing',
  })
  if (!hasRequiredModels) {
    blockerSummary.push('Missing required models')
  }

  // Item 2: local_marker_saved
  items.push({
    key: 'local_marker_saved',
    label: 'Local Marker Saved',
    status: localMarkerSavedCount > 0 ? 'ready' : 'blocked',
    reason: localMarkerSavedCount > 0
      ? `${localMarkerSavedCount} local marker(s) saved`
      : 'No local marker saved yet',
  })
  if (localMarkerSavedCount <= 0) {
    blockerSummary.push('No local marker saved')
  }

  // Item 3: artifact_local_saved_proof
  items.push({
    key: 'artifact_local_saved_proof',
    label: 'Artifact Local Saved Proof',
    status: artifactLocalProof ? 'ready' : 'blocked',
    reason: artifactLocalProof
      ? 'Artifact confirms local_saved_proof mode'
      : 'Artifact not in local_saved_proof state',
  })
  if (!artifactLocalProof) {
    blockerSummary.push('Artifact not in local saved proof state')
  }

  // Item 4: ledger_local_saved_proof
  items.push({
    key: 'ledger_local_saved_proof',
    label: 'Ledger Local Saved Proof',
    status: ledgerLocalProof ? 'ready' : 'blocked',
    reason: ledgerLocalProof
      ? 'Ledger confirms local_marker_saved_proof mode'
      : 'Ledger not in local_marker_saved_proof state',
  })
  if (!ledgerLocalProof) {
    blockerSummary.push('Ledger not in local saved proof state')
  }

  // Item 5: future_targets_available
  items.push({
    key: 'future_targets_available',
    label: 'Future Targets Available',
    status: targetSessionCount > 0 ? 'ready' : 'blocked',
    reason: targetSessionCount > 0
      ? `${targetSessionCount} future target session(s) identified`
      : 'No future target sessions available',
  })
  if (targetSessionCount <= 0) {
    blockerSummary.push('No future target sessions')
  }

  // Item 6: completed_sessions_protected
  items.push({
    key: 'completed_sessions_protected',
    label: 'Completed Sessions Protected',
    status: completedProtection ? 'ready' : 'blocked',
    reason: completedProtection
      ? `${completedProtectedCount} completed session(s) remain protected`
      : 'Completed session protection not confirmed',
  })
  if (!completedProtection) {
    blockerSummary.push('Completed session protection not confirmed')
  }

  // Item 7: structural_mutation_locked
  items.push({
    key: 'structural_mutation_locked',
    label: 'Structural Mutation Locked',
    status: structuralMutationLocked ? 'ready' : 'blocked',
    reason: structuralMutationLocked
      ? 'All structural mutation flags are false'
      : 'One or more mutation flags not locked',
  })
  if (!structuralMutationLocked) {
    blockerSummary.push('Structural mutation not locked')
  }

  // Item 8: persistence_still_disabled (READY when disabled - this is correct behavior)
  items.push({
    key: 'persistence_still_disabled',
    label: 'Persistence Still Disabled',
    status: persistenceDisabled ? 'ready' : 'blocked',
    reason: persistenceDisabled
      ? 'Persistence correctly disabled for candidate-readiness evaluation'
      : 'Persistence flags unexpectedly enabled',
  })
  if (!persistenceDisabled) {
    blockerSummary.push('Persistence flags unexpectedly enabled')
  }

  // Calculate counts
  const readyCount = items.filter(i => i.status === 'ready').length
  const blockedCount = items.filter(i => i.status === 'blocked').length

  // Determine status
  let status: DurableMarkerReceiptReadinessStatus
  let headline: string
  let summary: string
  let nextRequiredStep: string

  if (!hasRequiredModels) {
    status = 'unavailable_missing_models'
    headline = 'Durable Receipt Unavailable — Missing Models'
    summary = 'One or more required source models are not available. No persistence or workout changes applied.'
    nextRequiredStep = 'Ensure all marker proof models are available'
  } else if (localMarkerSavedCount <= 0) {
    status = 'blocked_no_local_marker'
    headline = 'Durable Receipt Blocked — No Local Marker'
    summary = 'No local marker has been saved yet. Save a local marker first. No persistence or workout changes applied.'
    nextRequiredStep = 'Save a local marker to proceed'
  } else if (!artifactLocalProof) {
    status = 'blocked_artifact_not_local_saved'
    headline = 'Durable Receipt Blocked — Artifact Not Local Saved'
    summary = 'Marker artifact preview is not in local_saved_proof state. No persistence or workout changes applied.'
    nextRequiredStep = 'Artifact must confirm local saved proof'
  } else if (!ledgerLocalProof) {
    status = 'blocked_ledger_not_local_saved'
    headline = 'Durable Receipt Blocked — Ledger Not Local Saved'
    summary = 'Marker write readiness ledger is not in local_marker_saved_proof state. No persistence or workout changes applied.'
    nextRequiredStep = 'Ledger must confirm local saved proof'
  } else if (targetSessionCount <= 0) {
    status = 'blocked_future_targets_missing'
    headline = 'Durable Receipt Blocked — No Future Targets'
    summary = 'No future target sessions are available for the marker. No persistence or workout changes applied.'
    nextRequiredStep = 'Future target sessions must be identified'
  } else if (!completedProtection) {
    status = 'blocked_completed_protection_missing'
    headline = 'Durable Receipt Blocked — Protection Missing'
    summary = 'Completed session protection is not confirmed. No persistence or workout changes applied.'
    nextRequiredStep = 'Completed session protection must be confirmed'
  } else if (!structuralMutationLocked) {
    status = 'blocked_structural_mutation_not_locked'
    headline = 'Durable Receipt Blocked — Mutation Lock Missing'
    summary = 'Structural mutation flags are not all locked. No persistence or workout changes applied.'
    nextRequiredStep = 'All mutation flags must be locked'
  } else {
    status = 'persistence_candidate_ready_no_write'
    headline = 'Durable Receipt Candidate Ready'
    summary = 'Local marker proof is eligible for a future durable receipt. No persistence or workout mutation has been enabled.'
    nextRequiredStep = 'Future step may introduce a controlled durable receipt writer; persistence remains disabled here.'
  }

  // Determine receipt mode and candidate count
  const receiptMode: DurableMarkerReceiptMode = status === 'persistence_candidate_ready_no_write'
    ? 'read_only_receipt_candidate'
    : 'not_ready'
  const receiptCandidateCount = status === 'persistence_candidate_ready_no_write' ? 1 : 0
  const canPreviewDurableReceipt = status === 'persistence_candidate_ready_no_write'

  // Build receipt fields
  const receiptFields: { label: string; value: string }[] = [
    { label: 'Receipt Mode', value: receiptMode },
    { label: 'Local Marker Saved Count', value: String(localMarkerSavedCount) },
    { label: 'Receipt Candidate Count', value: String(receiptCandidateCount) },
    { label: 'Target Sessions', value: String(targetSessionCount) },
    { label: 'Completed Protected', value: String(completedProtectedCount) },
    { label: 'Persistence Enabled', value: 'false' },
    { label: 'Program Cards Changed', value: 'false' },
    { label: 'Start Workout Changed', value: 'false' },
    { label: 'Live Workout Changed', value: 'false' },
  ]

  return {
    status,
    receiptMode,
    headline,
    summary,

    localMarkerSavedCount,
    targetSessionCount,
    completedProtectedCount,
    receiptCandidateCount,

    items,
    readyCount,
    blockedCount,
    blockerSummary,
    sourceModelsUsed,
    nextRequiredStep,

    receiptFields,

    canPreviewDurableReceipt,
    canCreateDurableReceipt: false,
    canPersistMarker: false,
    canWriteMarker: false,
    canMutateProgramCards: false,
    canMutateStartWorkout: false,
    canMutateLiveWorkout: false,
    canMutateStructure: false,

    completedSessionsProtected: true,
    noPersistenceAttempted: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
  }
}

// -----------------------------------------------------------------------------
// Status Label Helper
// -----------------------------------------------------------------------------
export function getDurableMarkerReceiptReadinessStatusLabel(
  status: DurableMarkerReceiptReadinessStatus
): string {
  switch (status) {
    case 'unavailable_missing_models':
      return 'unavailable'
    case 'blocked_no_local_marker':
      return 'no local marker'
    case 'blocked_artifact_not_local_saved':
      return 'artifact not saved'
    case 'blocked_ledger_not_local_saved':
      return 'ledger not saved'
    case 'blocked_future_targets_missing':
      return 'no targets'
    case 'blocked_completed_protection_missing':
      return 'protection missing'
    case 'blocked_structural_mutation_not_locked':
      return 'mutation lock missing'
    case 'persistence_candidate_ready_no_write':
      return 'receipt candidate ready'
    default:
      return 'unknown'
  }
}

// -----------------------------------------------------------------------------
// Status Color Helper
// -----------------------------------------------------------------------------
export function getDurableMarkerReceiptReadinessStatusColor(
  status: DurableMarkerReceiptReadinessStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_models':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_no_local_marker':
    case 'blocked_artifact_not_local_saved':
    case 'blocked_ledger_not_local_saved':
    case 'blocked_future_targets_missing':
    case 'blocked_completed_protection_missing':
    case 'blocked_structural_mutation_not_locked':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'persistence_candidate_ready_no_write':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
  }
}
