/**
 * [Prompt 77] Future-Session Mutation Apply Candidate
 * MASTER-8C.82 / AB20.4.75
 *
 * Pure read-only model that determines whether a future-session mutation apply action
 * is eligible. This remains blocked unless explicit user confirmation is present and
 * all upstream gates (Prompt 74 writer readiness, Prompt 75 authorization, Prompt 76
 * draft preview) are valid.
 *
 * This prompt does NOT apply any mutation. It only proves the system can determine
 * apply eligibility while remaining blocked.
 *
 * Hard-locked invariants:
 * - previewOnly: true
 * - appliedChangeCount: 0
 * - futureSessionMutationEnabled: false
 * - futureSessionsMutated: false
 * - completedSessionsMutated: false
 * - completedSessionsProtected: true
 * - mutationWriterEnabled: false
 * - automaticMutationEnabled: false
 * - durableWriteEnabled: false
 * - durablePersistenceEnabled: false
 * - durableReceiptWritten: false
 * - storageTouched: false
 * - apiTouched: false
 * - dbTouched: false
 * - schemaTouched: false
 * - programCardsChanged: false
 * - startWorkoutChanged: false
 * - liveWorkoutChanged: false
 */

import type { FutureSessionMutationDraftPreviewModel } from './future-session-mutation-draft-preview'
import type { UserConfirmedMutationAuthorizationBoundaryModel } from './user-confirmed-mutation-authorization-boundary'
import type { Prompt74WriterReadinessBoundaryModel } from './future-session-mutation-writer-readiness-boundary'
import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'

// ============================================================================
// Status Types
// ============================================================================

export type FutureSessionMutationApplyCandidateStatus =
  | 'apply_candidate_blocked_roadmap_source_missing'
  | 'apply_candidate_blocked_draft_preview_missing'
  | 'apply_candidate_blocked_authorization_missing'
  | 'apply_candidate_blocked_writer_readiness_missing'
  | 'apply_candidate_blocked_draft_not_ready'
  | 'apply_candidate_blocked_no_draft_items'
  | 'apply_candidate_blocked_no_user_confirmation'
  | 'apply_candidate_blocked_user_not_authorized'
  | 'apply_candidate_ready_preview_only_no_apply'

// ============================================================================
// Model Interface
// ============================================================================

export interface FutureSessionMutationApplyCandidateModel {
  readonly sourceStep: 'MASTER-8C.82 / AB20.4.75 / Prompt 77'
  readonly promptNumber: 77
  readonly totalPrompts: 84
  readonly status: FutureSessionMutationApplyCandidateStatus
  readonly headline: string
  readonly summary: string

  readonly roadmapStepFound: boolean
  readonly roadmapTitle: string
  readonly roadmapVisibleProofTarget: string

  readonly prompt76Status: string
  readonly prompt76DraftPreviewReady: boolean
  readonly prompt76DraftChangeCount: number

  readonly prompt75Status: string
  readonly prompt75AuthorizationReady: boolean
  readonly prompt75UserConfirmationRequired: boolean
  readonly prompt75UserConfirmationPresent: boolean
  readonly prompt75UserAuthorizedMutation: boolean

  readonly prompt74Status: string
  readonly prompt74WriterReady: boolean

  readonly candidateId: string
  readonly targetSessionCount: number
  readonly applyCandidateReady: boolean
  readonly applyButtonEnabled: false
  readonly applyBlockedReason: string
  readonly eligibleDraftItemCount: number
  readonly protectedCompletedSessionCount: number

  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string

  // Hard-locked invariants - all must remain exactly as specified
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

// ============================================================================
// Input Interface
// ============================================================================

export interface FutureSessionMutationApplyCandidateInput {
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
  readonly draftPreviewModel: FutureSessionMutationDraftPreviewModel | null | undefined
  readonly userAuthorizationBoundaryModel: UserConfirmedMutationAuthorizationBoundaryModel | null | undefined
  readonly writerReadinessBoundaryModel: Prompt74WriterReadinessBoundaryModel | null | undefined
}

// ============================================================================
// Hard-locked base fields
// ============================================================================

const HARD_LOCKED_FIELDS = {
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

// ============================================================================
// Resolver
// ============================================================================

export function resolveFutureSessionMutationApplyCandidate(
  input: FutureSessionMutationApplyCandidateInput
): FutureSessionMutationApplyCandidateModel {
  const { roadmapStep, draftPreviewModel, userAuthorizationBoundaryModel, writerReadinessBoundaryModel } = input

  const baseFields = {
    sourceStep: 'MASTER-8C.82 / AB20.4.75 / Prompt 77' as const,
    promptNumber: 77 as const,
    totalPrompts: 84 as const,
    applyButtonEnabled: false as const,
    ...HARD_LOCKED_FIELDS,
  }

  // Step 1: Missing roadmap
  if (!roadmapStep) {
    return {
      ...baseFields,
      status: 'apply_candidate_blocked_roadmap_source_missing',
      headline: 'Apply candidate blocked — roadmap source missing',
      summary: 'Prompt 77 roadmap source entry not found. Cannot determine apply candidate eligibility without roadmap source.',
      roadmapStepFound: false,
      roadmapTitle: '',
      roadmapVisibleProofTarget: '',
      prompt76Status: 'unknown',
      prompt76DraftPreviewReady: false,
      prompt76DraftChangeCount: 0,
      prompt75Status: 'unknown',
      prompt75AuthorizationReady: false,
      prompt75UserConfirmationRequired: true,
      prompt75UserConfirmationPresent: false,
      prompt75UserAuthorizedMutation: false,
      prompt74Status: 'unknown',
      prompt74WriterReady: false,
      candidateId: '',
      targetSessionCount: 0,
      applyCandidateReady: false,
      applyBlockedReason: 'Roadmap source missing',
      eligibleDraftItemCount: 0,
      protectedCompletedSessionCount: 0,
      blockers: ['Prompt 77 roadmap source entry not found'],
      safetyNotes: ['No mutation can occur without roadmap source validation'],
      nextRequiredStep: 'Add Prompt 77 to roadmap source registry',
    }
  }

  // Step 2: Missing draft preview
  if (!draftPreviewModel) {
    return {
      ...baseFields,
      status: 'apply_candidate_blocked_draft_preview_missing',
      headline: 'Apply candidate blocked — draft preview missing',
      summary: 'Prompt 76 draft preview model is not available. Cannot determine apply candidate eligibility without draft preview.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt76Status: 'missing',
      prompt76DraftPreviewReady: false,
      prompt76DraftChangeCount: 0,
      prompt75Status: 'unknown',
      prompt75AuthorizationReady: false,
      prompt75UserConfirmationRequired: true,
      prompt75UserConfirmationPresent: false,
      prompt75UserAuthorizedMutation: false,
      prompt74Status: 'unknown',
      prompt74WriterReady: false,
      candidateId: '',
      targetSessionCount: 0,
      applyCandidateReady: false,
      applyBlockedReason: 'Draft preview model missing',
      eligibleDraftItemCount: 0,
      protectedCompletedSessionCount: 0,
      blockers: ['Prompt 76 draft preview model missing'],
      safetyNotes: ['Apply candidate requires valid draft preview from Prompt 76'],
      nextRequiredStep: 'Ensure Prompt 76 draft preview model is computed',
    }
  }

  // Step 3: Missing authorization boundary
  if (!userAuthorizationBoundaryModel) {
    return {
      ...baseFields,
      status: 'apply_candidate_blocked_authorization_missing',
      headline: 'Apply candidate blocked — authorization boundary missing',
      summary: 'Prompt 75 user authorization boundary model is not available. Cannot determine apply candidate eligibility without authorization.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt76Status: draftPreviewModel.status,
      prompt76DraftPreviewReady: draftPreviewModel.status === 'draft_preview_ready_no_applied_change',
      prompt76DraftChangeCount: draftPreviewModel.draftChangeCount,
      prompt75Status: 'missing',
      prompt75AuthorizationReady: false,
      prompt75UserConfirmationRequired: true,
      prompt75UserConfirmationPresent: false,
      prompt75UserAuthorizedMutation: false,
      prompt74Status: 'unknown',
      prompt74WriterReady: false,
      candidateId: draftPreviewModel.candidateId,
      targetSessionCount: draftPreviewModel.targetSessionCount,
      applyCandidateReady: false,
      applyBlockedReason: 'Authorization boundary missing',
      eligibleDraftItemCount: 0,
      protectedCompletedSessionCount: 0,
      blockers: ['Prompt 75 user authorization boundary model missing'],
      safetyNotes: ['Apply candidate requires valid authorization from Prompt 75'],
      nextRequiredStep: 'Ensure Prompt 75 authorization boundary model is computed',
    }
  }

  // Step 4: Missing writer readiness
  if (!writerReadinessBoundaryModel) {
    return {
      ...baseFields,
      status: 'apply_candidate_blocked_writer_readiness_missing',
      headline: 'Apply candidate blocked — writer readiness missing',
      summary: 'Prompt 74 writer readiness boundary model is not available. Cannot determine apply candidate eligibility without writer readiness.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      prompt76Status: draftPreviewModel.status,
      prompt76DraftPreviewReady: draftPreviewModel.status === 'draft_preview_ready_no_applied_change',
      prompt76DraftChangeCount: draftPreviewModel.draftChangeCount,
      prompt75Status: userAuthorizationBoundaryModel.status,
      prompt75AuthorizationReady: userAuthorizationBoundaryModel.mutationAuthorizationBoundaryReady,
      prompt75UserConfirmationRequired: userAuthorizationBoundaryModel.userConfirmationRequired,
      prompt75UserConfirmationPresent: userAuthorizationBoundaryModel.userConfirmationPresent,
      prompt75UserAuthorizedMutation: userAuthorizationBoundaryModel.userAuthorizedMutation,
      prompt74Status: 'missing',
      prompt74WriterReady: false,
      candidateId: draftPreviewModel.candidateId,
      targetSessionCount: draftPreviewModel.targetSessionCount,
      applyCandidateReady: false,
      applyBlockedReason: 'Writer readiness boundary missing',
      eligibleDraftItemCount: 0,
      protectedCompletedSessionCount: 0,
      blockers: ['Prompt 74 writer readiness boundary model missing'],
      safetyNotes: ['Apply candidate requires valid writer readiness from Prompt 74'],
      nextRequiredStep: 'Ensure Prompt 74 writer readiness boundary model is computed',
    }
  }

  // Common fields for remaining checks
  const commonFields = {
    roadmapStepFound: true,
    roadmapTitle: roadmapStep.title,
    roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
    prompt76Status: draftPreviewModel.status,
    prompt76DraftPreviewReady: draftPreviewModel.status === 'draft_preview_ready_no_applied_change',
    prompt76DraftChangeCount: draftPreviewModel.draftChangeCount,
    prompt75Status: userAuthorizationBoundaryModel.status,
    prompt75AuthorizationReady: userAuthorizationBoundaryModel.mutationAuthorizationBoundaryReady,
    prompt75UserConfirmationRequired: userAuthorizationBoundaryModel.userConfirmationRequired,
    prompt75UserConfirmationPresent: userAuthorizationBoundaryModel.userConfirmationPresent,
    prompt75UserAuthorizedMutation: userAuthorizationBoundaryModel.userAuthorizedMutation,
    prompt74Status: writerReadinessBoundaryModel.status,
    prompt74WriterReady: writerReadinessBoundaryModel.writerReadinessPreviewReady,
    candidateId: draftPreviewModel.candidateId,
    targetSessionCount: draftPreviewModel.targetSessionCount,
    protectedCompletedSessionCount: 0,
  }

  // Step 5: Draft preview not ready
  if (draftPreviewModel.status !== 'draft_preview_ready_no_applied_change') {
    return {
      ...baseFields,
      ...commonFields,
      status: 'apply_candidate_blocked_draft_not_ready',
      headline: 'Apply candidate blocked — draft preview not ready',
      summary: `Prompt 76 draft preview is not ready (${draftPreviewModel.status}). Apply candidate cannot proceed until draft preview reaches ready state.`,
      applyCandidateReady: false,
      applyBlockedReason: `Draft preview not ready: ${draftPreviewModel.status}`,
      eligibleDraftItemCount: 0,
      blockers: [`Prompt 76 draft preview not ready: ${draftPreviewModel.status}`],
      safetyNotes: ['Apply candidate requires draft preview to be in ready state'],
      nextRequiredStep: 'Complete upstream gates so draft preview can reach ready state',
    }
  }

  // Step 6: No draft items
  if (draftPreviewModel.draftItems.length === 0) {
    return {
      ...baseFields,
      ...commonFields,
      status: 'apply_candidate_blocked_no_draft_items',
      headline: 'Apply candidate blocked — no draft items',
      summary: 'Prompt 76 draft preview has zero draft items. Apply candidate cannot proceed without concrete draft changes to apply.',
      applyCandidateReady: false,
      applyBlockedReason: 'No draft items available',
      eligibleDraftItemCount: 0,
      blockers: ['Prompt 76 draft preview has zero draft items'],
      safetyNotes: ['Apply candidate requires at least one draft item from upstream preview'],
      nextRequiredStep: 'Upstream adaptive preview must produce concrete before/after changes',
    }
  }

  // Step 7: No user confirmation
  if (userAuthorizationBoundaryModel.userConfirmationRequired && !userAuthorizationBoundaryModel.userConfirmationPresent) {
    return {
      ...baseFields,
      ...commonFields,
      status: 'apply_candidate_blocked_no_user_confirmation',
      headline: 'Apply candidate blocked — explicit user confirmation required',
      summary: 'Apply action requires explicit user confirmation which has not been provided. Mutation cannot proceed until the user explicitly confirms.',
      applyCandidateReady: false,
      applyBlockedReason: 'Explicit user confirmation has not been accepted',
      eligibleDraftItemCount: draftPreviewModel.draftItems.length,
      blockers: ['Explicit user confirmation required but not present'],
      safetyNotes: [
        'This is the expected current state',
        'Apply will remain blocked until user explicitly confirms mutation',
        'No automatic mutation is permitted',
      ],
      nextRequiredStep: 'User must provide explicit confirmation before apply can proceed',
    }
  }

  // Step 8: User not authorized
  if (!userAuthorizationBoundaryModel.userAuthorizedMutation) {
    return {
      ...baseFields,
      ...commonFields,
      status: 'apply_candidate_blocked_user_not_authorized',
      headline: 'Apply candidate blocked — user has not authorized mutation',
      summary: 'User authorization for mutation is false. Apply action cannot proceed until user explicitly authorizes the mutation.',
      applyCandidateReady: false,
      applyBlockedReason: 'User has not authorized mutation',
      eligibleDraftItemCount: draftPreviewModel.draftItems.length,
      blockers: ['User has not authorized mutation'],
      safetyNotes: ['Apply requires userAuthorizedMutation to be true'],
      nextRequiredStep: 'User must authorize mutation before apply can proceed',
    }
  }

  // Step 9: Ready preview-only (all gates pass but this step still does not apply)
  return {
    ...baseFields,
    ...commonFields,
    status: 'apply_candidate_ready_preview_only_no_apply',
    headline: 'Apply candidate ready — preview only, no apply in this step',
    summary: 'All upstream gates have passed and user has confirmed. Apply candidate is ready but this step remains preview-only. No mutation is applied.',
    applyCandidateReady: true,
    applyBlockedReason: 'Preview-only step — apply deferred to future prompt',
    eligibleDraftItemCount: draftPreviewModel.draftItems.length,
    blockers: [],
    safetyNotes: [
      'Apply candidate is ready but this Prompt 77 step does not apply mutation',
      'Actual apply will occur in a future prompt when explicitly implemented',
      'Program Cards, Start Workout, and Live Workout remain unchanged',
    ],
    nextRequiredStep: 'Prompt 78 or later will implement actual apply logic if roadmap permits',
  }
}

// ============================================================================
// UI Helper Functions
// ============================================================================

export function getFutureSessionMutationApplyCandidateStatusLabel(
  status: FutureSessionMutationApplyCandidateStatus
): string {
  switch (status) {
    case 'apply_candidate_blocked_roadmap_source_missing':
      return 'Blocked: Roadmap Missing'
    case 'apply_candidate_blocked_draft_preview_missing':
      return 'Blocked: Draft Preview Missing'
    case 'apply_candidate_blocked_authorization_missing':
      return 'Blocked: Authorization Missing'
    case 'apply_candidate_blocked_writer_readiness_missing':
      return 'Blocked: Writer Missing'
    case 'apply_candidate_blocked_draft_not_ready':
      return 'Blocked: Draft Not Ready'
    case 'apply_candidate_blocked_no_draft_items':
      return 'Blocked: No Draft Items'
    case 'apply_candidate_blocked_no_user_confirmation':
      return 'Blocked: Confirmation Required'
    case 'apply_candidate_blocked_user_not_authorized':
      return 'Blocked: Not Authorized'
    case 'apply_candidate_ready_preview_only_no_apply':
      return 'Ready (Preview Only)'
    default:
      return 'Unknown'
  }
}

export function getFutureSessionMutationApplyCandidateStatusColor(
  status: FutureSessionMutationApplyCandidateStatus
): 'red' | 'amber' | 'lime' | 'sky' {
  switch (status) {
    case 'apply_candidate_blocked_roadmap_source_missing':
    case 'apply_candidate_blocked_draft_preview_missing':
    case 'apply_candidate_blocked_authorization_missing':
    case 'apply_candidate_blocked_writer_readiness_missing':
      return 'red'
    case 'apply_candidate_blocked_draft_not_ready':
    case 'apply_candidate_blocked_no_draft_items':
    case 'apply_candidate_blocked_no_user_confirmation':
    case 'apply_candidate_blocked_user_not_authorized':
      return 'amber'
    case 'apply_candidate_ready_preview_only_no_apply':
      return 'lime'
    default:
      return 'sky'
  }
}
