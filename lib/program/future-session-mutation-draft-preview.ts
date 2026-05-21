/**
 * Future-Session Mutation Draft Preview
 * MASTER-8C.81 / AB20.4.74 / Prompt 76
 *
 * Read-only draft preview layer that shows proposed future-session changes
 * without applying any mutations. Consumes Prompt 75 authorization boundary
 * and upstream adaptive preview diff.
 *
 * CRITICAL: This is preview ONLY. No mutation, persistence, or writes.
 */

import type { UserConfirmedMutationAuthorizationBoundaryModel } from './user-confirmed-mutation-authorization-boundary'
import type { Prompt74WriterReadinessBoundaryModel } from './future-session-mutation-writer-readiness-boundary'
import type { FutureSessionAdaptivePreviewDiffModel, FutureSessionAdaptivePreviewChange } from './future-session-adaptive-preview-diff'
import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type FutureSessionMutationDraftPreviewStatus =
  | 'draft_blocked_roadmap_source_missing'
  | 'draft_blocked_authorization_boundary_missing'
  | 'draft_blocked_writer_readiness_missing'
  | 'draft_blocked_upstream_not_ready'
  | 'draft_blocked_no_preview_diff'
  | 'draft_blocked_zero_preview_changes'
  | 'draft_preview_ready_no_applied_change'

export type FutureSessionMutationDraftItemStatus =
  | 'draft_ready'
  | 'blocked'
  | 'protected'
  | 'source_missing'

export interface FutureSessionMutationDraftPreviewItem {
  readonly key: string
  readonly label: string
  readonly before: string
  readonly after: string
  readonly reason: string
  readonly source: string
  readonly confidence: 'low' | 'medium' | 'high'
  readonly status: FutureSessionMutationDraftItemStatus
  readonly applied: false
}

export interface FutureSessionMutationDraftPreviewModel {
  readonly sourceStep: 'MASTER-8C.81 / AB20.4.74 / Prompt 76'
  readonly promptNumber: 76
  readonly totalPrompts: 84
  readonly status: FutureSessionMutationDraftPreviewStatus
  readonly headline: string
  readonly summary: string

  readonly roadmapStepFound: boolean
  readonly roadmapTitle: string
  readonly roadmapVisibleProofTarget: string

  readonly prompt75Status: string
  readonly prompt75AuthorizationReady: boolean
  readonly prompt75UserConfirmationRequired: boolean
  readonly prompt75UserConfirmationPresent: boolean
  readonly prompt75UserAuthorizedMutation: boolean

  readonly prompt74Status: string
  readonly prompt74WriterReady: boolean

  readonly previewDiffStatus: string
  readonly previewDiffAvailable: boolean

  readonly targetSessionCount: number
  readonly draftChangeCount: number
  readonly highConfidenceDraftCount: number
  readonly mediumConfidenceDraftCount: number
  readonly lowConfidenceDraftCount: number
  readonly candidateId: string

  readonly draftItems: readonly FutureSessionMutationDraftPreviewItem[]
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string

  readonly previewOnly: true
  readonly appliedChangeCount: 0
  readonly futureSessionMutationEnabled: false
  readonly futureSessionsMutated: false
  readonly completedSessionsMutated: false
  readonly completedSessionsProtected: true
  readonly mutationWriterEnabled: false
  readonly automaticMutationEnabled: false
  readonly durableWriteEnabled: false
  readonly durablePersistenceEnabled: false
  readonly durableReceiptWritten: false
  readonly storageTouched: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
}

export interface FutureSessionMutationDraftPreviewInput {
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
  readonly userAuthorizationBoundaryModel: UserConfirmedMutationAuthorizationBoundaryModel | null | undefined
  readonly writerReadinessBoundaryModel: Prompt74WriterReadinessBoundaryModel | null | undefined
  readonly adaptivePreviewDiffModel: FutureSessionAdaptivePreviewDiffModel | null | undefined
}

// =============================================================================
// LOCKED INVARIANTS
// =============================================================================

const PROMPT76_LOCKED_FLAGS = {
  previewOnly: true as const,
  appliedChangeCount: 0 as const,
  futureSessionMutationEnabled: false as const,
  futureSessionsMutated: false as const,
  completedSessionsMutated: false as const,
  completedSessionsProtected: true as const,
  mutationWriterEnabled: false as const,
  automaticMutationEnabled: false as const,
  durableWriteEnabled: false as const,
  durablePersistenceEnabled: false as const,
  durableReceiptWritten: false as const,
  storageTouched: false as const,
  apiTouched: false as const,
  dbTouched: false as const,
  schemaTouched: false as const,
  programCardsChanged: false as const,
  startWorkoutChanged: false as const,
  liveWorkoutChanged: false as const,
}

const PROMPT76_SAFETY_NOTES: readonly string[] = [
  'Prompt 76 is draft preview only — no applied change.',
  'No future sessions have been mutated.',
  'Completed sessions remain protected.',
  'Program Cards remain unchanged.',
  'Start Workout remains unchanged.',
  'Live Workout remains unchanged.',
  'No storage/API/DB/schema write is performed.',
  'Draft cannot apply until authorization and upstream gates pass.',
]

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveFutureSessionMutationDraftPreview(
  input: FutureSessionMutationDraftPreviewInput
): FutureSessionMutationDraftPreviewModel {
  const {
    roadmapStep,
    userAuthorizationBoundaryModel,
    writerReadinessBoundaryModel,
    adaptivePreviewDiffModel,
  } = input

  const baseFields = {
    sourceStep: 'MASTER-8C.81 / AB20.4.74 / Prompt 76' as const,
    promptNumber: 76 as const,
    totalPrompts: 84 as const,
    ...PROMPT76_LOCKED_FLAGS,
    safetyNotes: PROMPT76_SAFETY_NOTES,
  }

  // -------------------------------------------------------------------------
  // BLOCK A: Roadmap source missing
  // -------------------------------------------------------------------------
  if (!roadmapStep) {
    return {
      ...baseFields,
      status: 'draft_blocked_roadmap_source_missing',
      headline: 'Draft preview blocked — roadmap source missing',
      summary: 'Prompt 76 roadmap entry not found. Cannot build draft preview.',
      roadmapStepFound: false,
      roadmapTitle: '',
      roadmapVisibleProofTarget: '',
      prompt75Status: 'unknown',
      prompt75AuthorizationReady: false,
      prompt75UserConfirmationRequired: true,
      prompt75UserConfirmationPresent: false,
      prompt75UserAuthorizedMutation: false,
      prompt74Status: 'unknown',
      prompt74WriterReady: false,
      previewDiffStatus: 'unknown',
      previewDiffAvailable: false,
      targetSessionCount: 0,
      draftChangeCount: 0,
      highConfidenceDraftCount: 0,
      mediumConfidenceDraftCount: 0,
      lowConfidenceDraftCount: 0,
      candidateId: '',
      draftItems: [],
      blockers: ['Prompt 76 roadmap source entry not found'],
      nextRequiredStep: 'Add Prompt 76 to roadmap source registry',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK B: Authorization boundary missing
  // -------------------------------------------------------------------------
  if (!userAuthorizationBoundaryModel) {
    return {
      ...baseFields,
      status: 'draft_blocked_authorization_boundary_missing',
      headline: 'Draft preview blocked — authorization boundary missing',
      summary: 'Prompt 75 user authorization boundary model not available.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt75Status: 'missing',
      prompt75AuthorizationReady: false,
      prompt75UserConfirmationRequired: true,
      prompt75UserConfirmationPresent: false,
      prompt75UserAuthorizedMutation: false,
      prompt74Status: 'unknown',
      prompt74WriterReady: false,
      previewDiffStatus: 'unknown',
      previewDiffAvailable: false,
      targetSessionCount: 0,
      draftChangeCount: 0,
      highConfidenceDraftCount: 0,
      mediumConfidenceDraftCount: 0,
      lowConfidenceDraftCount: 0,
      candidateId: '',
      draftItems: [],
      blockers: ['Prompt 75 authorization boundary missing'],
      nextRequiredStep: 'Ensure Prompt 75 authorization model is computed',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK C: Writer readiness missing
  // -------------------------------------------------------------------------
  if (!writerReadinessBoundaryModel) {
    return {
      ...baseFields,
      status: 'draft_blocked_writer_readiness_missing',
      headline: 'Draft preview blocked — writer readiness missing',
      summary: 'Prompt 74 writer readiness boundary model not available.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt75Status: userAuthorizationBoundaryModel.status,
      prompt75AuthorizationReady: userAuthorizationBoundaryModel.mutationAuthorizationBoundaryReady,
      prompt75UserConfirmationRequired: userAuthorizationBoundaryModel.userConfirmationRequired,
      prompt75UserConfirmationPresent: userAuthorizationBoundaryModel.userConfirmationPresent,
      prompt75UserAuthorizedMutation: userAuthorizationBoundaryModel.userAuthorizedMutation,
      prompt74Status: 'missing',
      prompt74WriterReady: false,
      previewDiffStatus: 'unknown',
      previewDiffAvailable: false,
      targetSessionCount: 0,
      draftChangeCount: 0,
      highConfidenceDraftCount: 0,
      mediumConfidenceDraftCount: 0,
      lowConfidenceDraftCount: 0,
      candidateId: '',
      draftItems: [],
      blockers: ['Prompt 74 writer readiness boundary missing'],
      nextRequiredStep: 'Ensure Prompt 74 writer readiness model is computed',
    }
  }

  // Extract Prompt 74/75 values
  const p75Status = userAuthorizationBoundaryModel.status
  const p75AuthReady = userAuthorizationBoundaryModel.mutationAuthorizationBoundaryReady
  const p75ConfirmRequired = userAuthorizationBoundaryModel.userConfirmationRequired
  const p75ConfirmPresent = userAuthorizationBoundaryModel.userConfirmationPresent
  const p75AuthMutation = userAuthorizationBoundaryModel.userAuthorizedMutation

  const p74Status = writerReadinessBoundaryModel.status
  const p74Ready = writerReadinessBoundaryModel.writerReadinessPreviewReady
  const candidateId = writerReadinessBoundaryModel.candidateId

  // -------------------------------------------------------------------------
  // BLOCK D: Upstream not ready (Prompt 74 writer readiness not ready)
  // -------------------------------------------------------------------------
  if (!p74Ready) {
    return {
      ...baseFields,
      status: 'draft_blocked_upstream_not_ready',
      headline: 'Draft preview blocked — upstream not ready',
      summary: `Draft preview cannot be trusted until Prompt 74 writer readiness is ready. Status: ${p74Status}`,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt75Status: p75Status,
      prompt75AuthorizationReady: p75AuthReady,
      prompt75UserConfirmationRequired: p75ConfirmRequired,
      prompt75UserConfirmationPresent: p75ConfirmPresent,
      prompt75UserAuthorizedMutation: p75AuthMutation,
      prompt74Status: p74Status,
      prompt74WriterReady: false,
      previewDiffStatus: adaptivePreviewDiffModel?.status ?? 'unknown',
      previewDiffAvailable: false,
      targetSessionCount: writerReadinessBoundaryModel.targetSessionCount,
      draftChangeCount: 0,
      highConfidenceDraftCount: 0,
      mediumConfidenceDraftCount: 0,
      lowConfidenceDraftCount: 0,
      candidateId,
      draftItems: [],
      blockers: [
        'Prompt 74 writer readiness not ready',
        `Upstream status: ${p74Status}`,
      ],
      nextRequiredStep: 'Complete Prompt 74 writer readiness first',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK E: No preview diff model
  // -------------------------------------------------------------------------
  if (!adaptivePreviewDiffModel) {
    return {
      ...baseFields,
      status: 'draft_blocked_no_preview_diff',
      headline: 'Draft preview blocked — no preview diff available',
      summary: 'Adaptive preview diff model missing. Cannot build draft items.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt75Status: p75Status,
      prompt75AuthorizationReady: p75AuthReady,
      prompt75UserConfirmationRequired: p75ConfirmRequired,
      prompt75UserConfirmationPresent: p75ConfirmPresent,
      prompt75UserAuthorizedMutation: p75AuthMutation,
      prompt74Status: p74Status,
      prompt74WriterReady: true,
      previewDiffStatus: 'missing',
      previewDiffAvailable: false,
      targetSessionCount: writerReadinessBoundaryModel.targetSessionCount,
      draftChangeCount: 0,
      highConfidenceDraftCount: 0,
      mediumConfidenceDraftCount: 0,
      lowConfidenceDraftCount: 0,
      candidateId,
      draftItems: [],
      blockers: ['Adaptive preview diff model missing'],
      nextRequiredStep: 'Ensure adaptive preview diff is computed',
    }
  }

  // Extract preview diff values
  const diffStatus = adaptivePreviewDiffModel.status
  const diffChanges = adaptivePreviewDiffModel.changes
  const targetSessionCount = adaptivePreviewDiffModel.targetSessionCount

  // -------------------------------------------------------------------------
  // BLOCK F: Zero preview changes
  // -------------------------------------------------------------------------
  if (diffChanges.length === 0) {
    return {
      ...baseFields,
      status: 'draft_blocked_zero_preview_changes',
      headline: 'Draft preview blocked — zero preview changes',
      summary: 'No draft can be built until upstream preview produces concrete before/after change candidates.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt75Status: p75Status,
      prompt75AuthorizationReady: p75AuthReady,
      prompt75UserConfirmationRequired: p75ConfirmRequired,
      prompt75UserConfirmationPresent: p75ConfirmPresent,
      prompt75UserAuthorizedMutation: p75AuthMutation,
      prompt74Status: p74Status,
      prompt74WriterReady: true,
      previewDiffStatus: diffStatus,
      previewDiffAvailable: true,
      targetSessionCount,
      draftChangeCount: 0,
      highConfidenceDraftCount: 0,
      mediumConfidenceDraftCount: 0,
      lowConfidenceDraftCount: 0,
      candidateId,
      draftItems: [],
      blockers: ['Adaptive preview has zero before/after changes'],
      nextRequiredStep: 'Generate concrete preview changes from upstream evidence',
    }
  }

  // -------------------------------------------------------------------------
  // READY: Build draft items from preview changes
  // -------------------------------------------------------------------------
  const draftItems: FutureSessionMutationDraftPreviewItem[] = diffChanges.map(
    (change: FutureSessionAdaptivePreviewChange) => ({
      key: change.key,
      label: change.label,
      before: change.before,
      after: change.after,
      reason: change.reason,
      source: change.source,
      confidence: change.confidence,
      status: 'draft_ready' as const,
      applied: false as const,
    })
  )

  const highConfidenceDraftCount = draftItems.filter(d => d.confidence === 'high').length
  const mediumConfidenceDraftCount = draftItems.filter(d => d.confidence === 'medium').length
  const lowConfidenceDraftCount = draftItems.filter(d => d.confidence === 'low').length

  // Build appropriate summary based on authorization state
  const authorizationNote = p75AuthMutation
    ? 'User has authorized mutation (draft only, not applied).'
    : 'Not authorized to apply — draft preview only.'

  return {
    ...baseFields,
    status: 'draft_preview_ready_no_applied_change',
    headline: 'Draft preview ready — no applied change',
    summary: `${draftItems.length} draft change(s) from ${targetSessionCount} target session(s). ${authorizationNote} Applied: 0.`,
    roadmapStepFound: true,
    roadmapTitle: roadmapStep.title,
    roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
    prompt75Status: p75Status,
    prompt75AuthorizationReady: p75AuthReady,
    prompt75UserConfirmationRequired: p75ConfirmRequired,
    prompt75UserConfirmationPresent: p75ConfirmPresent,
    prompt75UserAuthorizedMutation: p75AuthMutation,
    prompt74Status: p74Status,
    prompt74WriterReady: true,
    previewDiffStatus: diffStatus,
    previewDiffAvailable: true,
    targetSessionCount,
    draftChangeCount: draftItems.length,
    highConfidenceDraftCount,
    mediumConfidenceDraftCount,
    lowConfidenceDraftCount,
    candidateId,
    draftItems,
    blockers: [],
    nextRequiredStep: 'Prompt 77 — Mutation Apply Contract / Preview-Only',
  }
}

// =============================================================================
// UI HELPERS
// =============================================================================

export function getFutureSessionMutationDraftPreviewStatusLabel(
  status: FutureSessionMutationDraftPreviewStatus
): string {
  switch (status) {
    case 'draft_blocked_roadmap_source_missing':
      return 'Blocked: Roadmap Missing'
    case 'draft_blocked_authorization_boundary_missing':
      return 'Blocked: Auth Missing'
    case 'draft_blocked_writer_readiness_missing':
      return 'Blocked: Writer Missing'
    case 'draft_blocked_upstream_not_ready':
      return 'Blocked: Upstream Not Ready'
    case 'draft_blocked_no_preview_diff':
      return 'Blocked: No Preview Diff'
    case 'draft_blocked_zero_preview_changes':
      return 'Blocked: Zero Changes'
    case 'draft_preview_ready_no_applied_change':
      return 'Ready: Preview Only'
    default:
      return 'Unknown'
  }
}

export function getFutureSessionMutationDraftPreviewStatusColor(
  status: FutureSessionMutationDraftPreviewStatus
): string {
  switch (status) {
    case 'draft_preview_ready_no_applied_change':
      return 'lime'
    case 'draft_blocked_roadmap_source_missing':
    case 'draft_blocked_authorization_boundary_missing':
    case 'draft_blocked_writer_readiness_missing':
      return 'zinc'
    case 'draft_blocked_upstream_not_ready':
    case 'draft_blocked_no_preview_diff':
    case 'draft_blocked_zero_preview_changes':
      return 'amber'
    default:
      return 'zinc'
  }
}

export function getFutureSessionMutationDraftItemStatusLabel(
  status: FutureSessionMutationDraftItemStatus
): string {
  switch (status) {
    case 'draft_ready':
      return 'Draft Ready'
    case 'blocked':
      return 'Blocked'
    case 'protected':
      return 'Protected'
    case 'source_missing':
      return 'Source Missing'
    default:
      return 'Unknown'
  }
}

export function getFutureSessionMutationDraftItemStatusColor(
  status: FutureSessionMutationDraftItemStatus
): string {
  switch (status) {
    case 'draft_ready':
      return 'lime'
    case 'blocked':
      return 'amber'
    case 'protected':
      return 'cyan'
    case 'source_missing':
      return 'zinc'
    default:
      return 'zinc'
  }
}
