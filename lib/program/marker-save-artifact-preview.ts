/**
 * Marker Save Artifact Preview
 * 
 * [Prompt 21 of 77] Pure read-only artifact preview model for marker-save corridor.
 * Shows exactly what would be saved as a marker receipt, WITHOUT saving anything.
 * 
 * This helper is PURE:
 * - No React
 * - No fetch/DB/localStorage/sessionStorage
 * - No window/document
 * - No Date.now/Math.random
 * - No write/save/apply functions
 * - No mutation side effects
 */

import type { MarkerOnlyConfirmationBoundaryModel } from './marker-only-confirmation-boundary-preview'
import type { MarkerSaveAuthorizationPreflightBoundaryModel } from './marker-save-authorization-preflight-boundary'
import type { ControlledMarkerSaveActionBoundaryModel } from './controlled-marker-save-action-boundary'

// -----------------------------------------------------------------------------
// Status Union
// -----------------------------------------------------------------------------

export type MarkerSaveArtifactPreviewStatus =
  | 'unavailable_missing_boundary_models'
  | 'blocked_cautions_not_cleared'
  | 'blocked_no_future_targets'
  | 'blocked_authorization_missing'
  | 'blocked_action_not_ready'
  | 'preview_ready_no_write'
  | 'local_marker_saved_no_persistence' // [P39] After local marker save

// -----------------------------------------------------------------------------
// Model Interface
// -----------------------------------------------------------------------------

export interface MarkerSaveArtifactPreviewModel {
  readonly status: MarkerSaveArtifactPreviewStatus
  readonly headline: string
  readonly summary: string

  readonly markerArtifactPreviewId: string | null
  readonly markerKind: 'future_session_mutation_readiness_marker'
  readonly markerMode: 'preview_only' | 'local_saved_proof' // [P39] Allow local saved proof mode
  readonly markerSavedCount: number // [P39] Dynamic, not hardcoded 0

  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly rootCandidateBlockingCount: number
  readonly rootCandidateWaitingCount: number
  readonly rootCandidateNeedsEvidenceCount: number
  readonly cascadeEchoCount: number
  readonly rawCautionCount: number
  // [Prompt 25] Semantic root/candidate fields from Prompt 24
  readonly hardBlockingRootCandidateCount: number
  readonly unknownStatusRootCandidateCount: number
  readonly readOnlyClearableRootCandidateCount: number
  readonly diagnosticOnlyRootCandidateCount: number

  readonly sourceModelsUsed: readonly string[]
  readonly blockedReasons: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly previewFields: readonly { label: string; value: string }[]

  readonly canPreviewMarkerArtifact: boolean
  readonly canSaveMarker: false
  readonly canWriteMarker: false
  readonly canPersistMarker: false
  readonly canMutateProgramCards: false
  readonly canMutateStartWorkout: false
  readonly canMutateLiveWorkout: false
  readonly canMutateStructure: false

  readonly completedSessionsProtected: true
  readonly noMarkerSaved: boolean // [P39] Dynamic based on markerSavedCount
  readonly noMarkerWriteAttempted: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
}

// -----------------------------------------------------------------------------
// Input Interface
// -----------------------------------------------------------------------------

export interface MarkerSaveArtifactPreviewInput {
  readonly markerOnlyConfirmationBoundaryModel: MarkerOnlyConfirmationBoundaryModel | null | undefined
  readonly markerSaveAuthorizationPreflightBoundaryModel: MarkerSaveAuthorizationPreflightBoundaryModel | null | undefined
  readonly controlledMarkerSaveActionBoundaryModel: ControlledMarkerSaveActionBoundaryModel | null | undefined
  readonly authorizationPreviewAccepted: boolean
  readonly markerSavedCount?: number // [P39] Local marker saved count from UI state
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolveMarkerSaveArtifactPreview(
  input: MarkerSaveArtifactPreviewInput
): MarkerSaveArtifactPreviewModel {
  const {
    markerOnlyConfirmationBoundaryModel,
    markerSaveAuthorizationPreflightBoundaryModel,
    controlledMarkerSaveActionBoundaryModel,
    authorizationPreviewAccepted,
    markerSavedCount = 0, // [P39] Default to 0 if not provided
  } = input

  // Extract counts from marker-only boundary if available
  const targetSessionCount = markerOnlyConfirmationBoundaryModel?.targetSessionCount ?? 0
  const completedProtectedCount = markerOnlyConfirmationBoundaryModel?.completedProtectedCount ?? 0
  const rootCandidateBlockingCount = markerOnlyConfirmationBoundaryModel?.rootCandidateBlockingCount ?? 0
  const rootCandidateWaitingCount = markerOnlyConfirmationBoundaryModel?.rootCandidateWaitingCount ?? 0
  const rootCandidateNeedsEvidenceCount = markerOnlyConfirmationBoundaryModel?.rootCandidateNeedsEvidenceCount ?? 0
  const cascadeEchoCount = markerOnlyConfirmationBoundaryModel?.cascadeEchoCount ?? 0
  const rawCautionCount = markerOnlyConfirmationBoundaryModel?.rawCautionCount ?? 0
  // [Prompt 25] Semantic root/candidate fields from marker-only boundary
  const hardBlockingRootCandidateCount = markerOnlyConfirmationBoundaryModel?.hardBlockingRootCandidateCount ?? 0
  const unknownStatusRootCandidateCount = markerOnlyConfirmationBoundaryModel?.unknownStatusRootCandidateCount ?? 0
  const readOnlyClearableRootCandidateCount = markerOnlyConfirmationBoundaryModel?.readOnlyClearableRootCandidateCount ?? 0
  const diagnosticOnlyRootCandidateCount = markerOnlyConfirmationBoundaryModel?.diagnosticOnlyRootCandidateCount ?? 0

  // Track source models used
  const sourceModelsUsed: string[] = []
  if (markerOnlyConfirmationBoundaryModel) sourceModelsUsed.push('markerOnlyConfirmationBoundary')
  if (markerSaveAuthorizationPreflightBoundaryModel) sourceModelsUsed.push('markerSaveAuthorizationPreflight')
  if (controlledMarkerSaveActionBoundaryModel) sourceModelsUsed.push('controlledMarkerSaveAction')

  // Track blocked reasons
  const blockedReasons: string[] = []

  // Safety notes - [P39] dynamic based on marker saved state
  const safetyNotes: string[] = markerSavedCount > 0 
    ? [
        `${markerSavedCount} marker saved locally`,
        'Local proof only — persistence not enabled',
        'No Program Card changes',
        'No Start Workout changes',
        'No Live Workout changes',
        'Completed sessions protected',
      ]
    : [
        'Preview only — no marker saved',
        'No writes to storage',
        'No Program Card changes',
        'No Start Workout changes',
        'No Live Workout changes',
        'Completed sessions protected',
      ]

  // Check gate conditions in order
  // [P39] Default status depends on whether marker already saved
  let status: MarkerSaveArtifactPreviewStatus = markerSavedCount > 0 
    ? 'local_marker_saved_no_persistence' 
    : 'preview_ready_no_write'

  // Gate 1: Missing boundary models
  if (!markerOnlyConfirmationBoundaryModel || !markerSaveAuthorizationPreflightBoundaryModel || !controlledMarkerSaveActionBoundaryModel) {
    status = 'unavailable_missing_boundary_models'
    if (!markerOnlyConfirmationBoundaryModel) blockedReasons.push('Missing marker-only confirmation boundary model')
    if (!markerSaveAuthorizationPreflightBoundaryModel) blockedReasons.push('Missing marker-save authorization preflight model')
    if (!controlledMarkerSaveActionBoundaryModel) blockedReasons.push('Missing controlled marker-save action model')
  }
  // Gate 2: Cautions not cleared (semantic hard blockers need evidence)
  // [Prompt 25] Use hardBlockingRootCandidateCount as primary semantic blocker
  else if (rootCandidateNeedsEvidenceCount > 0 || hardBlockingRootCandidateCount > 0) {
    status = 'blocked_cautions_not_cleared'
    // Build semantic blocker message
    const blockerParts: string[] = []
    if (rootCandidateBlockingCount > 0) blockerParts.push(`${rootCandidateBlockingCount} blocking`)
    if (rootCandidateWaitingCount > 0) blockerParts.push(`${rootCandidateWaitingCount} waiting`)
    if (unknownStatusRootCandidateCount > 0) blockerParts.push(`${unknownStatusRootCandidateCount} unknown`)
    blockedReasons.push(`${hardBlockingRootCandidateCount} hard blocker(s): ${blockerParts.join(', ')}`)
    // Note diagnostic items that don't block
    if (readOnlyClearableRootCandidateCount > 0 || diagnosticOnlyRootCandidateCount > 0 || cascadeEchoCount > 0) {
      const diagParts: string[] = []
      if (readOnlyClearableRootCandidateCount > 0) diagParts.push(`${readOnlyClearableRootCandidateCount} clearable read-only`)
      if (diagnosticOnlyRootCandidateCount > 0) diagParts.push(`${diagnosticOnlyRootCandidateCount} diagnostic-only`)
      if (cascadeEchoCount > 0) diagParts.push(`${cascadeEchoCount} cascade echoes`)
      blockedReasons.push(`Non-blocking: ${diagParts.join(', ')}`)
    }
  }
  // Gate 3: No future targets
  else if (targetSessionCount === 0) {
    status = 'blocked_no_future_targets'
    blockedReasons.push('No future target sessions available')
  }
  // Gate 4: Authorization not accepted
  else if (!authorizationPreviewAccepted) {
    status = 'blocked_authorization_missing'
    blockedReasons.push('Local authorization preview not accepted')
  }
  // Gate 5: Action boundary not reviewable (use canReviewMarkerSaveAction, not canExecuteMarkerSave)
  // [P31] Reviewability is separate from execution - preview can be ready without writer enabled
  else if (!controlledMarkerSaveActionBoundaryModel.canReviewMarkerSaveAction) {
    status = 'blocked_action_not_ready'
    blockedReasons.push('Controlled marker-save action boundary not reviewable')
    blockedReasons.push('Action boundary requires local authorization to be reviewable')
  }

  // Generate deterministic artifact preview ID (no randomness)
  const markerArtifactPreviewId = status === 'preview_ready_no_write'
    ? `marker-preview:${targetSessionCount}:${rootCandidateBlockingCount}:${rootCandidateWaitingCount}:${authorizationPreviewAccepted ? 'auth' : 'noauth'}`
    : null

  // Generate headline and summary
  const headline = getHeadlineForStatus(status, targetSessionCount, rootCandidateNeedsEvidenceCount)
  const summary = getSummaryForStatus(status, blockedReasons)

  // [P40] Compute markerMode once for both return and previewFields
  const markerMode = markerSavedCount > 0 ? 'local_saved_proof' : 'preview_only'
  
  // Build preview fields - [P40] Now uses dynamic markerMode and markerSavedCount
  const previewFields: { label: string; value: string }[] = [
    { label: 'Marker Mode', value: markerMode },
    { label: 'Marker Saved Count', value: String(markerSavedCount) },
    { label: 'Target Sessions', value: String(targetSessionCount) },
    { label: 'Completed Protected', value: String(completedProtectedCount) },
    { label: 'Root/Candidate Blocking', value: String(rootCandidateBlockingCount) },
    { label: 'Root/Candidate Waiting', value: String(rootCandidateWaitingCount) },
    { label: 'Hard Evidence Blockers', value: String(rootCandidateNeedsEvidenceCount) },
    { label: 'Cascade Echoes', value: String(cascadeEchoCount) },
    { label: 'Raw Caution Count', value: String(rawCautionCount) },
    // [Prompt 25] Semantic root/candidate fields
    { label: 'Hard Blocking', value: String(hardBlockingRootCandidateCount) },
    { label: 'Unknown Status', value: String(unknownStatusRootCandidateCount) },
    { label: 'Clearable Read-Only', value: String(readOnlyClearableRootCandidateCount) },
    { label: 'Diagnostic-Only', value: String(diagnosticOnlyRootCandidateCount) },
  ]

  if (markerArtifactPreviewId) {
    previewFields.unshift({ label: 'Artifact Preview ID', value: markerArtifactPreviewId })
  }

  return {
    status,
    headline,
    summary,

    markerArtifactPreviewId,
    markerKind: 'future_session_mutation_readiness_marker',
    markerMode, // [P40] Uses computed variable
    markerSavedCount, // [P39] Dynamic from input

    targetSessionCount,
    completedProtectedCount,
    rootCandidateBlockingCount,
    rootCandidateWaitingCount,
    rootCandidateNeedsEvidenceCount,
    cascadeEchoCount,
    rawCautionCount,
    // [Prompt 25] Semantic root/candidate fields
    hardBlockingRootCandidateCount,
    unknownStatusRootCandidateCount,
    readOnlyClearableRootCandidateCount,
    diagnosticOnlyRootCandidateCount,

    sourceModelsUsed,
    blockedReasons,
    safetyNotes,
    previewFields,

    canPreviewMarkerArtifact: status === 'preview_ready_no_write' || status === 'local_marker_saved_no_persistence',
    canSaveMarker: false,
    canWriteMarker: false,
    canPersistMarker: false,
    canMutateProgramCards: false,
    canMutateStartWorkout: false,
    canMutateLiveWorkout: false,
    canMutateStructure: false,

    completedSessionsProtected: true,
    noMarkerSaved: markerSavedCount === 0, // [P39] Dynamic based on saved count
    noMarkerWriteAttempted: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getHeadlineForStatus(
  status: MarkerSaveArtifactPreviewStatus,
  targetSessionCount: number,
  rootCandidateNeedsEvidenceCount: number
): string {
  switch (status) {
    case 'unavailable_missing_boundary_models':
      return 'Artifact Preview Unavailable'
    case 'blocked_cautions_not_cleared':
      // [P35] Use hard blocker wording instead of stale "cautions" language
      return `Blocked: ${rootCandidateNeedsEvidenceCount} Hard Root/Candidate Evidence Blocker(s)`
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Target Sessions'
    case 'blocked_authorization_missing':
      return 'Blocked: Authorization Preview Not Accepted'
    case 'blocked_action_not_ready':
      return 'Blocked: Action Boundary Not Ready'
    case 'preview_ready_no_write':
      return `Preview Ready: ${targetSessionCount} Target Session(s) — No Write`
    case 'local_marker_saved_no_persistence':
      return `Local Marker Saved: ${targetSessionCount} Target Session(s) — Persistence Not Enabled`
    default:
      return 'Artifact Preview Status Unknown'
  }
}

function getSummaryForStatus(
  status: MarkerSaveArtifactPreviewStatus,
  blockedReasons: readonly string[]
): string {
  if (status === 'preview_ready_no_write') {
    return 'Marker artifact preview is ready. No marker will be saved until writer is enabled in a future step.'
  }
  if (status === 'local_marker_saved_no_persistence') {
    return 'Local marker saved successfully. Persistence not enabled yet. No program/workout changes applied.'
  }
  if (blockedReasons.length > 0) {
    return blockedReasons.slice(0, 2).join('. ') + '.'
  }
  return 'Artifact preview blocked.'
}

// -----------------------------------------------------------------------------
// Label/Color Helpers
// -----------------------------------------------------------------------------

export function getMarkerSaveArtifactPreviewStatusLabel(
  status: MarkerSaveArtifactPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_boundary_models':
      return 'unavailable'
    case 'blocked_cautions_not_cleared':
      return 'hard evidence required'
    case 'blocked_no_future_targets':
      return 'no targets'
    case 'blocked_authorization_missing':
      return 'auth missing'
    case 'blocked_action_not_ready':
      return 'action not ready'
    case 'preview_ready_no_write':
      return 'preview ready'
    case 'local_marker_saved_no_persistence':
      return 'local marker saved'
    default:
      return 'unknown'
  }
}

export function getMarkerSaveArtifactPreviewStatusColor(
  status: MarkerSaveArtifactPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_boundary_models':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    case 'blocked_cautions_not_cleared':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'blocked_no_future_targets':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' }
    case 'blocked_authorization_missing':
      return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' }
    case 'blocked_action_not_ready':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
    case 'preview_ready_no_write':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'local_marker_saved_no_persistence':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  }
}
