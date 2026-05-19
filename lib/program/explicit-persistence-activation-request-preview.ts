/**
 * Explicit Persistence Activation Request Preview
 * [Prompt 47] MASTER-8C.52 / AB20.4.45
 * 
 * Pure read-only activation request preview.
 * Consumes DurableReceiptWriterActivationPreconditionsReviewModel.
 * Shows what an explicit activation request would require.
 * 
 * SAFETY: This is a PREVIEW ONLY. No activation is requested or authorized.
 * - explicitPersistenceActivationRequested: false
 * - authorizationGranted: false
 * - persistenceEnabled: false
 * - writeEnabled: false
 * - writeAttempted: false
 * - receiptWritten: false
 * - No API/DB/storage/schema/program/workout mutation
 */

import type {
  DurableReceiptWriterActivationPreconditionsReviewModel,
} from './durable-receipt-writer-activation-preconditions-review'

// ============================================================================
// STATUS UNIONS
// ============================================================================

export type ExplicitPersistenceActivationRequestPreviewStatus =
  | 'unavailable_missing_preconditions_review'
  | 'blocked_preconditions_not_ready'
  | 'request_preview_ready_persistence_disabled'

export type ExplicitPersistenceActivationRequestPreviewMode =
  | 'read_only_request_preview'
  | 'not_ready'

export type ExplicitPersistenceActivationRequestRequirementStatus =
  | 'available_from_preconditions'
  | 'requires_future_explicit_user_action'
  | 'requires_future_server_contract'
  | 'requires_future_storage_contract'
  | 'requires_future_reload_proof'
  | 'locked_by_design'

// ============================================================================
// INTERFACES
// ============================================================================

export interface ExplicitPersistenceActivationRequestRequirement {
  readonly key: string
  readonly label: string
  readonly status: ExplicitPersistenceActivationRequestRequirementStatus
  readonly satisfiedForPreview: boolean
  readonly requiredBeforeRealActivation: boolean
  readonly blocksRealActivationNow: boolean
  readonly reason: string
}

export interface ExplicitPersistenceActivationRequestPreviewPayload {
  readonly requestKind: 'explicit_persistence_activation_request_preview'
  readonly sourceStep: 'MASTER-8C.52_AB20.4.45'
  readonly requestedCapability: 'durable_marker_receipt_writer_activation'
  readonly currentMode: 'preview_only_persistence_disabled'
  readonly preconditionsReviewStatus: string
  readonly canProceedToAuthorizationPreview: boolean
  readonly realActivationRequested: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false
}

export interface ExplicitPersistenceActivationRequestPreviewSummary {
  readonly totalRequirements: number
  readonly previewAvailableRequirements: number
  readonly futureExplicitUserActionRequirements: number
  readonly futureServerContractRequirements: number
  readonly futureStorageContractRequirements: number
  readonly futureReloadProofRequirements: number
  readonly lockedByDesignRequirements: number
  readonly readyForAuthorizationLockReview: boolean
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

export interface ExplicitPersistenceActivationRequestPreviewModel {
  readonly status: ExplicitPersistenceActivationRequestPreviewStatus
  readonly mode: ExplicitPersistenceActivationRequestPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourcePreconditionsReviewStatus: string
  readonly sourceReadyForExplicitActivationRequestReview: boolean
  readonly sourceSatisfiedPreconditions: number
  readonly sourceLockedUntilActivation: number
  readonly sourceFutureStepRequired: number
  readonly sourceRealActivationAllowedNow: false

  readonly requestPreviewPayload: ExplicitPersistenceActivationRequestPreviewPayload | null
  readonly requirements: readonly ExplicitPersistenceActivationRequestRequirement[]
  readonly requestSummary: ExplicitPersistenceActivationRequestPreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly readyForAuthorizationLockReview: boolean
  readonly canPreviewExplicitPersistenceActivationRequest: boolean
  readonly canRequestExplicitPersistenceActivationNow: false
  readonly canAuthorizePersistenceNow: false
  readonly canActivatePersistenceNow: false
  readonly canCreateDurableReceiptNow: false
  readonly canPersistMarkerNow: false
  readonly canWriteReceiptNow: false
  readonly canAttemptWriteNow: false
  readonly canCallApiRouteNow: false
  readonly canUseDbClientNow: false
  readonly canUseStorageNow: false
  readonly canTouchSchemaNow: false
  readonly canMutateProgramCardsNow: false
  readonly canMutateStartWorkoutNow: false
  readonly canMutateLiveWorkoutNow: false
  readonly canMutateFutureSessionsNow: false

  readonly explicitPersistenceActivationRequested: false
  readonly authorizationGranted: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false
  readonly apiRouteCalled: false
  readonly dbClientUsed: false
  readonly storageUsed: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
}

export interface ExplicitPersistenceActivationRequestPreviewInput {
  readonly activationPreconditionsReviewModel: DurableReceiptWriterActivationPreconditionsReviewModel | null | undefined
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolveExplicitPersistenceActivationRequestPreview(
  input: ExplicitPersistenceActivationRequestPreviewInput
): ExplicitPersistenceActivationRequestPreviewModel {
  const { activationPreconditionsReviewModel } = input

  // Base dangerous flags - all false always
  const baseDangerousFlags = {
    canRequestExplicitPersistenceActivationNow: false as const,
    canAuthorizePersistenceNow: false as const,
    canActivatePersistenceNow: false as const,
    canCreateDurableReceiptNow: false as const,
    canPersistMarkerNow: false as const,
    canWriteReceiptNow: false as const,
    canAttemptWriteNow: false as const,
    canCallApiRouteNow: false as const,
    canUseDbClientNow: false as const,
    canUseStorageNow: false as const,
    canTouchSchemaNow: false as const,
    canMutateProgramCardsNow: false as const,
    canMutateStartWorkoutNow: false as const,
    canMutateLiveWorkoutNow: false as const,
    canMutateFutureSessionsNow: false as const,
    explicitPersistenceActivationRequested: false as const,
    authorizationGranted: false as const,
    persistenceEnabled: false as const,
    writeEnabled: false as const,
    writeAttempted: false as const,
    receiptWritten: false as const,
    apiRouteCalled: false as const,
    dbClientUsed: false as const,
    storageUsed: false as const,
    schemaTouched: false as const,
    programCardsChanged: false as const,
    startWorkoutChanged: false as const,
    liveWorkoutChanged: false as const,
    futureSessionMutationEnabled: false as const,
    completedSessionsProtected: true as const,
  }

  // Case 1: No preconditions review model
  if (!activationPreconditionsReviewModel) {
    const emptyRequirements: ExplicitPersistenceActivationRequestRequirement[] = []
    const emptySummary: ExplicitPersistenceActivationRequestPreviewSummary = {
      totalRequirements: 0,
      previewAvailableRequirements: 0,
      futureExplicitUserActionRequirements: 0,
      futureServerContractRequirements: 0,
      futureStorageContractRequirements: 0,
      futureReloadProofRequirements: 0,
      lockedByDesignRequirements: 0,
      readyForAuthorizationLockReview: false,
      realActivationAllowedNow: false,
      persistenceStillDisabled: true,
      writeStillDisabled: true,
    }

    return {
      status: 'unavailable_missing_preconditions_review',
      mode: 'not_ready',
      headline: 'Explicit Activation Request Preview Unavailable',
      summary: 'Cannot preview activation request: activation preconditions review model is missing.',

      sourcePreconditionsReviewStatus: 'missing',
      sourceReadyForExplicitActivationRequestReview: false,
      sourceSatisfiedPreconditions: 0,
      sourceLockedUntilActivation: 0,
      sourceFutureStepRequired: 0,
      sourceRealActivationAllowedNow: false,

      requestPreviewPayload: null,
      requirements: emptyRequirements,
      requestSummary: emptySummary,
      blockerSummary: ['Activation preconditions review model is missing'],
      nextRequiredStep: 'Provide activation preconditions review model first.',

      readyForAuthorizationLockReview: false,
      canPreviewExplicitPersistenceActivationRequest: false,
      ...baseDangerousFlags,
    }
  }

  // Case 2: Preconditions review not ready
  if (activationPreconditionsReviewModel.status !== 'ready_for_explicit_activation_request_review_persistence_disabled') {
    const emptyRequirements: ExplicitPersistenceActivationRequestRequirement[] = []
    const emptySummary: ExplicitPersistenceActivationRequestPreviewSummary = {
      totalRequirements: 0,
      previewAvailableRequirements: 0,
      futureExplicitUserActionRequirements: 0,
      futureServerContractRequirements: 0,
      futureStorageContractRequirements: 0,
      futureReloadProofRequirements: 0,
      lockedByDesignRequirements: 0,
      readyForAuthorizationLockReview: false,
      realActivationAllowedNow: false,
      persistenceStillDisabled: true,
      writeStillDisabled: true,
    }

    return {
      status: 'blocked_preconditions_not_ready',
      mode: 'not_ready',
      headline: 'Explicit Activation Request Preview Blocked',
      summary: `Cannot preview activation request: preconditions review status is "${activationPreconditionsReviewModel.status}" instead of ready.`,

      sourcePreconditionsReviewStatus: activationPreconditionsReviewModel.status,
      sourceReadyForExplicitActivationRequestReview: activationPreconditionsReviewModel.readyForExplicitActivationRequestReview,
      sourceSatisfiedPreconditions: activationPreconditionsReviewModel.preconditionsSummary.satisfiedPreconditions,
      sourceLockedUntilActivation: activationPreconditionsReviewModel.preconditionsSummary.lockedUntilExplicitActivation,
      sourceFutureStepRequired: activationPreconditionsReviewModel.preconditionsSummary.futureStepRequiredPreconditions,
      sourceRealActivationAllowedNow: false,

      requestPreviewPayload: null,
      requirements: emptyRequirements,
      requestSummary: emptySummary,
      blockerSummary: [
        `Preconditions review status: ${activationPreconditionsReviewModel.status}`,
        'Preconditions must be ready before request preview is available',
      ],
      nextRequiredStep: 'Complete activation preconditions review first.',

      readyForAuthorizationLockReview: false,
      canPreviewExplicitPersistenceActivationRequest: false,
      ...baseDangerousFlags,
    }
  }

  // Case 3: PASS - Preconditions review is ready
  const requirements: ExplicitPersistenceActivationRequestRequirement[] = [
    {
      key: 'preconditions_review_ready',
      label: 'Activation preconditions review ready',
      status: 'available_from_preconditions',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'The prior preconditions review is ready for request preview.',
    },
    {
      key: 'request_payload_preview_available',
      label: 'Request payload preview available',
      status: 'available_from_preconditions',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'The app can preview the activation request shape without submitting it.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'available_from_preconditions',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'This request preview does not rewrite completed sessions or logged history.',
    },
    {
      key: 'explicit_user_activation_action_required',
      label: 'Explicit user activation action required later',
      status: 'requires_future_explicit_user_action',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A later step must require an explicit user action before persistence can be authorized.',
    },
    {
      key: 'authorization_lock_required',
      label: 'Authorization lock required next',
      status: 'locked_by_design',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'The next gate must add a lock that prevents accidental activation from preview state.',
    },
    {
      key: 'server_api_contract_required',
      label: 'Server/API contract required later',
      status: 'requires_future_server_contract',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'No API route may be called or created during this preview step.',
    },
    {
      key: 'db_storage_schema_contract_required',
      label: 'DB/storage/schema contract required later',
      status: 'requires_future_storage_contract',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'No DB, storage, or schema contract is authorized during this preview step.',
    },
    {
      key: 'receipt_writer_required_later',
      label: 'Receipt writer required later',
      status: 'locked_by_design',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'The real durable writer remains locked until explicit authorization and server/storage contracts exist.',
    },
    {
      key: 'reload_persistence_proof_required_later',
      label: 'Reload persistence proof required later',
      status: 'requires_future_reload_proof',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A later step must prove durable receipts survive reload before runtime can consume them.',
    },
    {
      key: 'program_card_runtime_bridges_deferred',
      label: 'Program Card / Start Workout / Live Workout bridges deferred',
      status: 'locked_by_design',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: false,
      blocksRealActivationNow: false,
      reason: 'Program and workout mutation bridges remain off until durable receipt persistence is actually proven.',
    },
  ]

  // Count requirements by status
  const previewAvailableRequirements = requirements.filter(r => r.status === 'available_from_preconditions').length
  const futureExplicitUserActionRequirements = requirements.filter(r => r.status === 'requires_future_explicit_user_action').length
  const futureServerContractRequirements = requirements.filter(r => r.status === 'requires_future_server_contract').length
  const futureStorageContractRequirements = requirements.filter(r => r.status === 'requires_future_storage_contract').length
  const futureReloadProofRequirements = requirements.filter(r => r.status === 'requires_future_reload_proof').length
  const lockedByDesignRequirements = requirements.filter(r => r.status === 'locked_by_design').length

  const requestSummary: ExplicitPersistenceActivationRequestPreviewSummary = {
    totalRequirements: requirements.length,
    previewAvailableRequirements,
    futureExplicitUserActionRequirements,
    futureServerContractRequirements,
    futureStorageContractRequirements,
    futureReloadProofRequirements,
    lockedByDesignRequirements,
    readyForAuthorizationLockReview: true,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }

  const requestPreviewPayload: ExplicitPersistenceActivationRequestPreviewPayload = {
    requestKind: 'explicit_persistence_activation_request_preview',
    sourceStep: 'MASTER-8C.52_AB20.4.45',
    requestedCapability: 'durable_marker_receipt_writer_activation',
    currentMode: 'preview_only_persistence_disabled',
    preconditionsReviewStatus: activationPreconditionsReviewModel.status,
    canProceedToAuthorizationPreview: true,
    realActivationRequested: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
  }

  return {
    status: 'request_preview_ready_persistence_disabled',
    mode: 'read_only_request_preview',
    headline: 'Explicit Persistence Activation Request Preview Ready',
    summary: 'The system can preview the explicit persistence activation request shape, but no activation has been requested or authorized. Persistence remains disabled, no writer exists, no receipt is written, and no API/DB/storage/schema/program/workout mutation is enabled.',

    sourcePreconditionsReviewStatus: activationPreconditionsReviewModel.status,
    sourceReadyForExplicitActivationRequestReview: activationPreconditionsReviewModel.readyForExplicitActivationRequestReview,
    sourceSatisfiedPreconditions: activationPreconditionsReviewModel.preconditionsSummary.satisfiedPreconditions,
    sourceLockedUntilActivation: activationPreconditionsReviewModel.preconditionsSummary.lockedUntilExplicitActivation,
    sourceFutureStepRequired: activationPreconditionsReviewModel.preconditionsSummary.futureStepRequiredPreconditions,
    sourceRealActivationAllowedNow: false,

    requestPreviewPayload,
    requirements,
    requestSummary,
    blockerSummary: [],
    nextRequiredStep: 'Next gate should add an authorization lock for an explicit activation request while persistence still remains disabled.',

    readyForAuthorizationLockReview: true,
    canPreviewExplicitPersistenceActivationRequest: true,
    ...baseDangerousFlags,
  }
}

// ============================================================================
// LABEL HELPERS
// ============================================================================

export function getExplicitPersistenceActivationRequestPreviewStatusLabel(
  status: ExplicitPersistenceActivationRequestPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_preconditions_review':
      return 'preconditions missing'
    case 'blocked_preconditions_not_ready':
      return 'preconditions blocked'
    case 'request_preview_ready_persistence_disabled':
      return 'request preview ready / persistence disabled'
    default:
      return 'unknown'
  }
}

export function getExplicitPersistenceActivationRequestPreviewStatusColor(
  status: ExplicitPersistenceActivationRequestPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_preconditions_review':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
    case 'blocked_preconditions_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'request_preview_ready_persistence_disabled':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70', border: 'border-cyan-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
  }
}

export function getExplicitPersistenceActivationRequestRequirementStatusLabel(
  status: ExplicitPersistenceActivationRequestRequirementStatus
): string {
  switch (status) {
    case 'available_from_preconditions':
      return 'preview available'
    case 'requires_future_explicit_user_action':
      return 'future user action'
    case 'requires_future_server_contract':
      return 'future server contract'
    case 'requires_future_storage_contract':
      return 'future storage contract'
    case 'requires_future_reload_proof':
      return 'future reload proof'
    case 'locked_by_design':
      return 'locked by design'
    default:
      return 'unknown'
  }
}

export function getExplicitPersistenceActivationRequestRequirementStatusColor(
  status: ExplicitPersistenceActivationRequestRequirementStatus
): { bg: string; text: string } {
  switch (status) {
    case 'available_from_preconditions':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400/80' }
    case 'requires_future_explicit_user_action':
      return { bg: 'bg-violet-500/20', text: 'text-violet-400/80' }
    case 'requires_future_server_contract':
      return { bg: 'bg-sky-500/20', text: 'text-sky-400/80' }
    case 'requires_future_storage_contract':
      return { bg: 'bg-indigo-500/20', text: 'text-indigo-400/80' }
    case 'requires_future_reload_proof':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400/80' }
    case 'locked_by_design':
      return { bg: 'bg-slate-500/20', text: 'text-slate-400/80' }
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400/80' }
  }
}
