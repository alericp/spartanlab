/**
 * [PROMPT 75] USER-CONFIRMED MUTATION AUTHORIZATION BOUNDARY
 * MASTER-8C.80 / AB20.4.73 / Step 5 of mutation-readiness roadmap
 *
 * This is a read-only/preview-only authorization boundary.
 * It consumes Prompt 74 writer readiness and proves whether
 * explicit user confirmation is present before any mutation.
 *
 * INVARIANTS:
 * - NO automatic mutation
 * - NO future-session mutation
 * - NO completed-session mutation
 * - NO durable write/persistence
 * - NO storage/API/DB/schema write
 * - NO Program Card changes
 * - NO Start Workout changes
 * - NO Live Workout changes
 * - Completed sessions always protected
 * - User confirmation required but not present (Prompt 75 cannot create confirmation)
 */

import type { Prompt74WriterReadinessBoundaryModel } from './future-session-mutation-writer-readiness-boundary'
import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'

// =============================================================================
// STATUS TYPES
// =============================================================================

export type UserConfirmedMutationAuthorizationStatus =
  | 'authorization_blocked_roadmap_source_missing'
  | 'authorization_blocked_writer_readiness_missing'
  | 'authorization_blocked_writer_not_ready'
  | 'authorization_blocked_no_user_confirmation'
  | 'authorization_ready_local_only_no_mutation'

export type UserConfirmedMutationAuthorizationItemStatus =
  | 'passed'
  | 'blocked'
  | 'protected'
  | 'pending'
  | 'failed'

// =============================================================================
// ITEM INTERFACE
// =============================================================================

export interface UserConfirmedMutationAuthorizationItem {
  readonly key: string
  readonly label: string
  readonly status: UserConfirmedMutationAuthorizationItemStatus
  readonly detail: string
}

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface UserConfirmedMutationAuthorizationBoundaryModel {
  readonly sourceStep: 'MASTER-8C.80 / AB20.4.73 / Prompt 75'
  readonly promptNumber: 75
  readonly totalPrompts: 84
  readonly status: UserConfirmedMutationAuthorizationStatus
  readonly headline: string
  readonly summary: string

  readonly roadmapStepFound: boolean
  readonly roadmapTitle: string
  readonly roadmapVisibleProofTarget: string

  readonly upstreamPrompt74Status: string
  readonly upstreamPrompt74Ready: boolean
  readonly upstreamPrompt74Headline: string

  readonly userConfirmationRequired: true
  readonly userConfirmationPresent: false
  readonly userAuthorizedMutation: false

  readonly mutationAuthorizationBoundaryReady: boolean
  readonly automaticMutationEnabled: false
  readonly mutationWriterEnabled: false
  readonly futureSessionMutationEnabled: false
  readonly futureSessionsMutated: false
  readonly completedSessionsMutated: false
  readonly completedSessionsProtected: true

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

  readonly targetSessionCount: number
  readonly previewChangeCount: number
  readonly candidateId: string

  readonly authorizationItems: readonly UserConfirmedMutationAuthorizationItem[]
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface UserConfirmedMutationAuthorizationBoundaryInput {
  readonly writerReadinessBoundaryModel: Prompt74WriterReadinessBoundaryModel | null | undefined
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
}

// =============================================================================
// LOCKED FLAGS — All mutation/write flags hardcoded false
// =============================================================================

const PROMPT75_LOCKED_FLAGS = {
  userConfirmationRequired: true as const,
  userConfirmationPresent: false as const,
  userAuthorizedMutation: false as const,
  automaticMutationEnabled: false as const,
  mutationWriterEnabled: false as const,
  futureSessionMutationEnabled: false as const,
  futureSessionsMutated: false as const,
  completedSessionsMutated: false as const,
  completedSessionsProtected: true as const,
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

// =============================================================================
// SAFETY NOTES
// =============================================================================

const PROMPT75_SAFETY_NOTES: readonly string[] = [
  'Prompt 75 is preview-only; no mutation is performed.',
  'Explicit user confirmation is required before any mutation draft/apply can proceed.',
  'No automatic mutation is enabled.',
  'Completed sessions remain protected.',
  'Program Cards remain unchanged.',
  'Start Workout remains unchanged.',
  'Live Workout remains unchanged.',
  'No storage/API/DB/schema write is performed.',
  'User confirmation is not present; mutation authorization boundary is blocking.',
]

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveUserConfirmedMutationAuthorizationBoundary(
  input: UserConfirmedMutationAuthorizationBoundaryInput
): UserConfirmedMutationAuthorizationBoundaryModel {
  const { writerReadinessBoundaryModel, roadmapStep } = input

  // Base fields
  const baseFields = {
    sourceStep: 'MASTER-8C.80 / AB20.4.73 / Prompt 75' as const,
    promptNumber: 75 as const,
    totalPrompts: 84 as const,
    ...PROMPT75_LOCKED_FLAGS,
    safetyNotes: PROMPT75_SAFETY_NOTES,
  }

  // -------------------------------------------------------------------------
  // BLOCK: Roadmap source missing
  // -------------------------------------------------------------------------
  if (!roadmapStep) {
    return {
      ...baseFields,
      status: 'authorization_blocked_roadmap_source_missing',
      headline: 'Authorization blocked — roadmap source missing',
      summary: 'Prompt 75 roadmap entry not found. Cannot verify user-confirmed mutation authorization boundary.',
      roadmapStepFound: false,
      roadmapTitle: '',
      roadmapVisibleProofTarget: '',
      upstreamPrompt74Status: 'unknown',
      upstreamPrompt74Ready: false,
      upstreamPrompt74Headline: '',
      mutationAuthorizationBoundaryReady: false,
      targetSessionCount: 0,
      previewChangeCount: 0,
      candidateId: '',
      authorizationItems: [],
      blockers: ['Prompt 75 roadmap source entry not found'],
      nextRequiredStep: 'Add Prompt 75 to roadmap source registry',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: Writer readiness model missing
  // -------------------------------------------------------------------------
  if (!writerReadinessBoundaryModel) {
    return {
      ...baseFields,
      status: 'authorization_blocked_writer_readiness_missing',
      headline: 'Authorization blocked — writer readiness missing',
      summary: 'Prompt 74 writer readiness boundary model not available. Cannot verify authorization.',
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt74Status: 'missing',
      upstreamPrompt74Ready: false,
      upstreamPrompt74Headline: '',
      mutationAuthorizationBoundaryReady: false,
      targetSessionCount: 0,
      previewChangeCount: 0,
      candidateId: '',
      authorizationItems: [],
      blockers: ['Prompt 74 writer readiness boundary model missing'],
      nextRequiredStep: 'Ensure Prompt 74 writer readiness model is computed',
    }
  }

  // Extract upstream values
  const {
    status: p74Status,
    headline: p74Headline,
    writerReadinessPreviewReady: p74Ready,
    targetSessionCount,
    previewChangeCount,
    candidateId,
  } = writerReadinessBoundaryModel

  // Build authorization items
  const authorizationItems: UserConfirmedMutationAuthorizationItem[] = [
    {
      key: 'roadmap_source',
      label: 'Roadmap Source',
      status: 'passed',
      detail: 'Prompt 75 roadmap entry found',
    },
    {
      key: 'writer_readiness_model',
      label: 'Writer Readiness Model',
      status: 'passed',
      detail: 'Prompt 74 model available',
    },
    {
      key: 'writer_readiness_ready',
      label: 'Writer Readiness Ready',
      status: p74Ready ? 'passed' : 'blocked',
      detail: p74Ready ? 'Prompt 74 writer readiness ready' : `Prompt 74 status: ${p74Status}`,
    },
    {
      key: 'user_confirmation',
      label: 'User Confirmation',
      status: 'blocked',
      detail: 'Explicit user confirmation required but not present',
    },
    {
      key: 'automatic_mutation',
      label: 'Automatic Mutation',
      status: 'protected',
      detail: 'Automatic mutation disabled',
    },
    {
      key: 'completed_sessions',
      label: 'Completed Sessions',
      status: 'protected',
      detail: 'Completed sessions protected',
    },
  ]

  // -------------------------------------------------------------------------
  // BLOCK: Writer readiness not ready
  // -------------------------------------------------------------------------
  if (!p74Ready || p74Status !== 'writer_readiness_ready_preview_only') {
    return {
      ...baseFields,
      status: 'authorization_blocked_writer_not_ready',
      headline: 'Authorization blocked — writer readiness not ready',
      summary: `Prompt 74 writer readiness is not ready. Status: ${p74Status}. User authorization cannot proceed until writer readiness boundary is ready.`,
      roadmapStepFound: true,
      roadmapTitle: roadmapStep.title,
      roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
      upstreamPrompt74Status: p74Status,
      upstreamPrompt74Ready: false,
      upstreamPrompt74Headline: p74Headline,
      mutationAuthorizationBoundaryReady: false,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      authorizationItems,
      blockers: [
        'Prompt 74 writer readiness is not ready',
        `Upstream status: ${p74Status}`,
      ],
      nextRequiredStep: 'Complete writer readiness before user authorization can proceed',
    }
  }

  // -------------------------------------------------------------------------
  // BLOCK: No user confirmation (this is the expected normal state for P75)
  // Prompt 75 cannot create confirmation — it only proves the gate exists
  // -------------------------------------------------------------------------
  return {
    ...baseFields,
    status: 'authorization_blocked_no_user_confirmation',
    headline: 'Authorization blocked — explicit user confirmation required',
    summary: `Prompt 74 writer readiness is ready. ${targetSessionCount} target session(s), ${previewChangeCount} preview change(s). However, explicit user confirmation is required before any mutation draft/apply can proceed. No automatic mutation is allowed.`,
    roadmapStepFound: true,
    roadmapTitle: roadmapStep.title,
    roadmapVisibleProofTarget: roadmapStep.visibleProofTarget,
    upstreamPrompt74Status: p74Status,
    upstreamPrompt74Ready: true,
    upstreamPrompt74Headline: p74Headline,
    mutationAuthorizationBoundaryReady: false,
    targetSessionCount,
    previewChangeCount,
    candidateId,
    authorizationItems,
    blockers: [
      'Explicit user confirmation required',
      'User confirmation not present',
      'No automatic mutation allowed',
    ],
    nextRequiredStep: 'Prompt 76 — Future-Session Mutation Draft Preview / No Applied Change',
  }
}

// =============================================================================
// UI HELPER FUNCTIONS
// =============================================================================

export function getUserMutationAuthorizationStatusLabel(
  status: UserConfirmedMutationAuthorizationStatus
): string {
  switch (status) {
    case 'authorization_blocked_roadmap_source_missing':
      return 'Blocked: Roadmap Missing'
    case 'authorization_blocked_writer_readiness_missing':
      return 'Blocked: Writer Missing'
    case 'authorization_blocked_writer_not_ready':
      return 'Blocked: Writer Not Ready'
    case 'authorization_blocked_no_user_confirmation':
      return 'Blocked: Confirmation Required'
    case 'authorization_ready_local_only_no_mutation':
      return 'Ready: Local Only / No Mutation'
    default:
      return 'Unknown'
  }
}

export function getUserMutationAuthorizationStatusColor(
  status: UserConfirmedMutationAuthorizationStatus
): string {
  switch (status) {
    case 'authorization_ready_local_only_no_mutation':
      return 'lime'
    case 'authorization_blocked_roadmap_source_missing':
    case 'authorization_blocked_writer_readiness_missing':
      return 'zinc'
    case 'authorization_blocked_writer_not_ready':
      return 'amber'
    case 'authorization_blocked_no_user_confirmation':
      return 'orange'
    default:
      return 'zinc'
  }
}

export function getUserMutationAuthorizationItemStatusLabel(
  status: UserConfirmedMutationAuthorizationItemStatus
): string {
  switch (status) {
    case 'passed':
      return 'Passed'
    case 'blocked':
      return 'Blocked'
    case 'protected':
      return 'Protected'
    case 'pending':
      return 'Pending'
    case 'failed':
      return 'Failed'
    default:
      return 'Unknown'
  }
}

export function getUserMutationAuthorizationItemStatusColor(
  status: UserConfirmedMutationAuthorizationItemStatus
): string {
  switch (status) {
    case 'passed':
      return 'lime'
    case 'blocked':
      return 'amber'
    case 'protected':
      return 'cyan'
    case 'pending':
      return 'zinc'
    case 'failed':
      return 'red'
    default:
      return 'zinc'
  }
}
