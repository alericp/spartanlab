/**
 * Marker Write Readiness Ledger
 * 
 * [Prompt 22 of 77] Pure read-only ledger summarizing all pre-writer conditions.
 * Shows whether the system has every required condition for a future marker-only writer.
 * 
 * This is the final pre-writer contract preview.
 * It does NOT save, write, or persist anything.
 * 
 * @pure no React, no fetch, no storage, no Date.now, no Math.random
 */

import type { MarkerOnlyConfirmationBoundaryModel } from './marker-only-confirmation-boundary-preview'
import type { MarkerSaveAuthorizationPreflightBoundaryModel } from './marker-save-authorization-preflight-boundary'
import type { ControlledMarkerSaveActionBoundaryModel } from './controlled-marker-save-action-boundary'
import type { MarkerSaveArtifactPreviewModel } from './marker-save-artifact-preview'

// =============================================================================
// STATUS TYPE
// =============================================================================

export type MarkerWriteReadinessLedgerStatus =
  | 'unavailable_missing_models'
  | 'blocked_cautions_not_cleared'
  | 'blocked_no_future_targets'
  | 'blocked_authorization_missing'
  | 'blocked_artifact_not_ready'
  | 'blocked_writer_not_enabled'
  | 'ready_for_future_writer_no_write'

// =============================================================================
// LEDGER ITEM TYPE
// =============================================================================

export interface MarkerWriteReadinessLedgerItem {
  readonly key: string
  readonly label: string
  readonly status: 'ready' | 'blocked' | 'not_applicable'
  readonly reason: string
}

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface MarkerWriteReadinessLedgerModel {
  readonly status: MarkerWriteReadinessLedgerStatus
  readonly headline: string
  readonly summary: string

  readonly ledgerMode: 'read_only_writer_contract_preview'
  readonly markerSavedCount: 0

  readonly items: readonly MarkerWriteReadinessLedgerItem[]
  readonly readyCount: number
  readonly blockedCount: number

  readonly blockerSummary: readonly string[]
  readonly sourceModelsUsed: readonly string[]
  readonly nextRequiredStep: string

  readonly canShowFutureWriterButton: false
  readonly canEnableFutureWriterButton: false
  readonly canSaveMarker: false
  readonly canWriteMarker: false
  readonly canPersistMarker: false
  readonly canMutateProgramCards: false
  readonly canMutateStartWorkout: false
  readonly canMutateLiveWorkout: false
  readonly canMutateStructure: false

  readonly completedSessionsProtected: true
  readonly noMarkerSaved: true
  readonly noMarkerWriteAttempted: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
}

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface MarkerWriteReadinessLedgerInput {
  readonly markerOnlyConfirmationBoundaryModel: MarkerOnlyConfirmationBoundaryModel | null | undefined
  readonly markerSaveAuthorizationPreflightBoundaryModel: MarkerSaveAuthorizationPreflightBoundaryModel | null | undefined
  readonly controlledMarkerSaveActionBoundaryModel: ControlledMarkerSaveActionBoundaryModel | null | undefined
  readonly markerSaveArtifactPreviewModel: MarkerSaveArtifactPreviewModel | null | undefined
  readonly authorizationPreviewAccepted: boolean
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveMarkerWriteReadinessLedger(
  input: MarkerWriteReadinessLedgerInput
): MarkerWriteReadinessLedgerModel {
  const {
    markerOnlyConfirmationBoundaryModel,
    markerSaveAuthorizationPreflightBoundaryModel,
    controlledMarkerSaveActionBoundaryModel,
    markerSaveArtifactPreviewModel,
    authorizationPreviewAccepted,
  } = input

  const items: MarkerWriteReadinessLedgerItem[] = []
  const blockerSummary: string[] = []
  const sourceModelsUsed: string[] = []

  // Track which models are available
  const hasBoundaryModel = !!markerOnlyConfirmationBoundaryModel
  const hasPreflightModel = !!markerSaveAuthorizationPreflightBoundaryModel
  const hasActionModel = !!controlledMarkerSaveActionBoundaryModel
  const hasArtifactModel = !!markerSaveArtifactPreviewModel

  if (hasBoundaryModel) sourceModelsUsed.push('marker-boundary')
  if (hasPreflightModel) sourceModelsUsed.push('auth-preflight')
  if (hasActionModel) sourceModelsUsed.push('action-boundary')
  if (hasArtifactModel) sourceModelsUsed.push('artifact-preview')

  // Item 1: boundary_models_present
  const allModelsPresent = hasBoundaryModel && hasPreflightModel && hasActionModel && hasArtifactModel
  items.push({
    key: 'boundary_models_present',
    label: 'Boundary Models Present',
    status: allModelsPresent ? 'ready' : 'blocked',
    reason: allModelsPresent 
      ? 'All required boundary models are available'
      : `Missing: ${[
          !hasBoundaryModel && 'marker-boundary',
          !hasPreflightModel && 'auth-preflight',
          !hasActionModel && 'action-boundary',
          !hasArtifactModel && 'artifact-preview',
        ].filter(Boolean).join(', ')}`,
  })
  if (!allModelsPresent) {
    blockerSummary.push('Required boundary models are missing')
  }

  // Item 2: future_targets_available
  const targetSessionCount = markerOnlyConfirmationBoundaryModel?.targetSessionCount ?? 0
  const hasFutureTargets = targetSessionCount > 0
  items.push({
    key: 'future_targets_available',
    label: 'Future Targets Available',
    status: hasFutureTargets ? 'ready' : 'blocked',
    reason: hasFutureTargets 
      ? `${targetSessionCount} future session(s) targeted`
      : 'No future sessions available for marker targeting',
  })
  if (!hasFutureTargets) {
    blockerSummary.push('No future targets available')
  }

  // Item 3: completed_sessions_protected
  const completedProtected = markerOnlyConfirmationBoundaryModel?.completedSessionsProtected ?? true
  items.push({
    key: 'completed_sessions_protected',
    label: 'Completed Sessions Protected',
    status: completedProtected ? 'ready' : 'blocked',
    reason: completedProtected 
      ? 'Completed sessions are explicitly protected'
      : 'Completed session protection not confirmed',
  })

  // Item 4: root_candidate_clearance
  // [Prompt 25.1] Use semantic hard blocker counts instead of raw active caution
  const hardBlockingRootCandidateCount = 
    markerSaveArtifactPreviewModel?.hardBlockingRootCandidateCount ??
    markerOnlyConfirmationBoundaryModel?.hardBlockingRootCandidateCount ?? 0
  const unknownStatusRootCandidateCount =
    markerSaveArtifactPreviewModel?.unknownStatusRootCandidateCount ??
    markerOnlyConfirmationBoundaryModel?.unknownStatusRootCandidateCount ?? 0
  const readOnlyClearableRootCandidateCount =
    markerSaveArtifactPreviewModel?.readOnlyClearableRootCandidateCount ??
    markerOnlyConfirmationBoundaryModel?.readOnlyClearableRootCandidateCount ?? 0
  const diagnosticOnlyRootCandidateCount =
    markerSaveArtifactPreviewModel?.diagnosticOnlyRootCandidateCount ??
    markerOnlyConfirmationBoundaryModel?.diagnosticOnlyRootCandidateCount ?? 0
  const cascadeEchoCount = markerSaveArtifactPreviewModel?.cascadeEchoCount ?? 
    markerOnlyConfirmationBoundaryModel?.cascadeEchoCount ?? 0
  
  // Semantic clearance: no hard blockers = cleared
  const semanticRootCandidateEvidenceCleared = hardBlockingRootCandidateCount === 0
  
  // Build diagnostic suffix for non-blocking items
  const diagnosticParts: string[] = []
  if (readOnlyClearableRootCandidateCount > 0) diagnosticParts.push(`${readOnlyClearableRootCandidateCount} clearable read-only`)
  if (diagnosticOnlyRootCandidateCount > 0) diagnosticParts.push(`${diagnosticOnlyRootCandidateCount} diagnostic-only`)
  if (cascadeEchoCount > 0) diagnosticParts.push(`${cascadeEchoCount} cascade echo(es)`)
  const diagnosticSuffix = diagnosticParts.length > 0
    ? ` Non-blocking: ${diagnosticParts.join(', ')}.`
    : ''
  
  items.push({
    key: 'root_candidate_clearance',
    label: 'Root/Candidate Evidence Clearance',
    status: semanticRootCandidateEvidenceCleared ? 'ready' : 'blocked',
    reason: semanticRootCandidateEvidenceCleared 
      ? `No semantic hard/waiting/unknown root-candidate evidence blockers remain.${diagnosticSuffix}`
      : `${hardBlockingRootCandidateCount} semantic root/candidate blocker(s) need evidence/resolution.${diagnosticSuffix}`,
  })
  if (!semanticRootCandidateEvidenceCleared) {
    blockerSummary.push('Root/candidate evidence blockers remain')
  }

  // Item 5: authorization_preview_accepted
  items.push({
    key: 'authorization_preview_accepted',
    label: 'Authorization Preview Accepted',
    status: authorizationPreviewAccepted ? 'ready' : 'blocked',
    reason: authorizationPreviewAccepted 
      ? 'Local authorization preview has been accepted'
      : 'Local authorization preview not yet accepted',
  })
  if (!authorizationPreviewAccepted) {
    blockerSummary.push('Authorization preview not accepted')
  }

  // Item 6: artifact_preview_ready
  const artifactReady = markerSaveArtifactPreviewModel?.status === 'preview_ready_no_write'
  items.push({
    key: 'artifact_preview_ready',
    label: 'Artifact Preview Ready',
    status: artifactReady ? 'ready' : 'blocked',
    reason: artifactReady 
      ? 'Marker artifact preview is ready for review'
      : `Artifact status: ${markerSaveArtifactPreviewModel?.status ?? 'unavailable'}`,
  })
  if (!artifactReady) {
    blockerSummary.push('Artifact preview not ready')
  }

  // Item 7: action_boundary_reviewable
  // [P31] Use canReviewMarkerSaveAction, not canShowAuthorizationControl
  const actionReviewable = controlledMarkerSaveActionBoundaryModel?.canReviewMarkerSaveAction ?? false
  items.push({
    key: 'action_boundary_reviewable',
    label: 'Action Boundary Reviewable',
    status: actionReviewable ? 'ready' : 'blocked',
    reason: actionReviewable 
      ? 'Action boundary is reviewable (writer execution separate)'
      : 'Action boundary not yet reviewable — requires local authorization',
  })

  // Item 8: writer_enabled (always blocked in Prompt 22)
  items.push({
    key: 'writer_enabled',
    label: 'Writer Enabled',
    status: 'blocked',
    reason: 'Writer intentionally not enabled in Prompt 22',
  })
  blockerSummary.push('Writer intentionally disabled')

  // Item 9: persistence_enabled (always blocked in Prompt 22)
  items.push({
    key: 'persistence_enabled',
    label: 'Persistence Enabled',
    status: 'blocked',
    reason: 'Persistence intentionally disabled in Prompt 22',
  })
  blockerSummary.push('Persistence intentionally disabled')

  // Item 10: structural_mutation_disabled
  const noStructuralMutation = 
    (markerSaveArtifactPreviewModel?.canMutateProgramCards === false) &&
    (markerSaveArtifactPreviewModel?.canMutateStartWorkout === false) &&
    (markerSaveArtifactPreviewModel?.canMutateLiveWorkout === false)
  items.push({
    key: 'structural_mutation_disabled',
    label: 'Structural Mutation Disabled',
    status: noStructuralMutation ? 'ready' : 'blocked',
    reason: noStructuralMutation 
      ? 'Program Cards, Start Workout, Live Workout mutation flags are false'
      : 'Structural mutation flags not confirmed false',
  })

  // Count ready/blocked
  const readyCount = items.filter(i => i.status === 'ready').length
  const blockedCount = items.filter(i => i.status === 'blocked').length

  // Determine overall status
  let status: MarkerWriteReadinessLedgerStatus
  let headline: string
  let summary: string
  let nextRequiredStep: string

  if (!allModelsPresent) {
    status = 'unavailable_missing_models'
    headline = 'Ledger Unavailable — Missing Models'
    summary = 'Required boundary models are not available. Cannot compute write readiness.'
    nextRequiredStep = 'Wait for all boundary models to become available'
  } else if (!semanticRootCandidateEvidenceCleared) {
    // [Prompt 25.1] Use semantic hard blocker clearance
    status = 'blocked_cautions_not_cleared'
    headline = 'Ledger Blocked — Root/Candidate Evidence Required'
    summary = `Semantic root/candidate evidence blockers still prevent marker readiness. Clearable read-only and diagnostic-only items do not independently block. No marker saved.`
    nextRequiredStep = 'Resolve hard/waiting/unknown root-candidate evidence before marker write readiness can proceed'
  } else if (!hasFutureTargets) {
    status = 'blocked_no_future_targets'
    headline = 'Ledger Blocked — No Future Targets'
    summary = 'No future sessions are available to target for marker save.'
    nextRequiredStep = 'Ensure future workout sessions exist'
  } else if (!authorizationPreviewAccepted) {
    status = 'blocked_authorization_missing'
    headline = 'Ledger Blocked — Authorization Missing'
    summary = 'Local authorization preview has not been accepted.'
    nextRequiredStep = 'Accept local authorization preview'
  } else if (!artifactReady) {
    status = 'blocked_artifact_not_ready'
    headline = 'Ledger Blocked — Artifact Not Ready'
    summary = 'Marker artifact preview is not in ready state.'
    nextRequiredStep = 'Resolve artifact preview blockers'
  } else {
    // All preview gates are ready, but writer is intentionally disabled
    status = 'blocked_writer_not_enabled'
    headline = 'Ledger Ready — Writer Not Enabled'
    summary = `All ${readyCount - 2} preview gates are ready. Writer and persistence intentionally disabled in Prompt 22.`
    nextRequiredStep = 'Future prompt will enable controlled marker writer'
  }

  return {
    status,
    headline,
    summary,

    ledgerMode: 'read_only_writer_contract_preview',
    markerSavedCount: 0,

    items,
    readyCount,
    blockedCount,

    blockerSummary,
    sourceModelsUsed,
    nextRequiredStep,

    canShowFutureWriterButton: false,
    canEnableFutureWriterButton: false,
    canSaveMarker: false,
    canWriteMarker: false,
    canPersistMarker: false,
    canMutateProgramCards: false,
    canMutateStartWorkout: false,
    canMutateLiveWorkout: false,
    canMutateStructure: false,

    completedSessionsProtected: true,
    noMarkerSaved: true,
    noMarkerWriteAttempted: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
  }
}

// =============================================================================
// LABEL/COLOR HELPERS
// =============================================================================

export function getMarkerWriteReadinessLedgerStatusLabel(
  status: MarkerWriteReadinessLedgerStatus
): string {
  switch (status) {
    case 'unavailable_missing_models':
      return 'unavailable'
    case 'blocked_cautions_not_cleared':
      return 'hard evidence required'
    case 'blocked_no_future_targets':
      return 'no targets'
    case 'blocked_authorization_missing':
      return 'no auth'
    case 'blocked_artifact_not_ready':
      return 'artifact blocked'
    case 'blocked_writer_not_enabled':
      return 'writer disabled'
    case 'ready_for_future_writer_no_write':
      return 'ready (no write)'
    default:
      return 'unknown'
  }
}

export function getMarkerWriteReadinessLedgerStatusColor(
  status: MarkerWriteReadinessLedgerStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_models':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_cautions_not_cleared':
    case 'blocked_no_future_targets':
    case 'blocked_authorization_missing':
    case 'blocked_artifact_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'blocked_writer_not_enabled':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    case 'ready_for_future_writer_no_write':
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

export function getMarkerWriteReadinessItemStatusColor(
  status: 'ready' | 'blocked' | 'not_applicable'
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'ready':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
    case 'blocked':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'not_applicable':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
  }
}
