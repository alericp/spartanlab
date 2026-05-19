/**
 * Explicit Activation Request Intent Capture Preview
 * MASTER-8C.54 / AB20.4.47 — Prompt 49 of 77
 *
 * Pure read-only intent capture preview. Authorization lock verified but no user intent
 * captured. Previews future intent-capture requirements. No activation requested,
 * no authorization granted, persistence/write/receipt/API/DB/storage/schema/program/
 * workout mutation remain disabled.
 *
 * SAFETY:
 * - Explicit user intent captured: false
 * - Explicit persistence activation requested: false
 * - Authorization granted: false
 * - Persistence enabled: false
 * - Write enabled: false
 * - Write attempted: false
 * - Receipt written: false
 * - No API route called
 * - No DB client used
 * - No storage used
 * - No schema touched
 * - No Program Cards changed
 * - No Start Workout changed
 * - No Live Workout changed
 */

import type {
  ActivationRequestAuthorizationLockModel,
} from './activation-request-authorization-lock'

// -----------------------------------------------------------------------------
// Status Union
// -----------------------------------------------------------------------------

export type ExplicitActivationRequestIntentCapturePreviewStatus =
  | 'unavailable_missing_authorization_lock'
  | 'blocked_authorization_lock_not_ready'
  | 'intent_capture_preview_ready_persistence_disabled'

// -----------------------------------------------------------------------------
// Mode Union
// -----------------------------------------------------------------------------

export type ExplicitActivationRequestIntentCapturePreviewMode =
  | 'read_only_intent_capture_preview'
  | 'not_ready'

// -----------------------------------------------------------------------------
// Requirement Status Union
// -----------------------------------------------------------------------------

export type ExplicitActivationRequestIntentCaptureRequirementStatus =
  | 'source_authorization_lock_verified'
  | 'future_user_intent_required'
  | 'future_unambiguous_confirmation_required'
  | 'future_scope_review_required'
  | 'future_reversal_review_required'
  | 'blocked_by_design'

// -----------------------------------------------------------------------------
// Requirement Interface
// -----------------------------------------------------------------------------

export interface ExplicitActivationRequestIntentCaptureRequirement {
  readonly key: string
  readonly label: string
  readonly status: ExplicitActivationRequestIntentCaptureRequirementStatus
  readonly satisfiedForPreview: boolean
  readonly requiredBeforeRealActivation: boolean
  readonly blocksRealActivationNow: boolean
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Preview Payload
// -----------------------------------------------------------------------------

export interface ExplicitActivationRequestIntentCapturePreviewPayload {
  readonly previewKind: 'explicit_activation_request_intent_capture_preview'
  readonly sourceStep: 'MASTER-8C.54_AB20.4.47'
  readonly sourceAuthorizationLockStatus: string
  readonly currentMode: 'intent_capture_preview_only_persistence_disabled'
  readonly authorizationLockVerified: boolean
  readonly intentCapturePreviewReady: boolean

  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly authorizationGranted: false
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false

  readonly intendedFutureCapability: 'durable_marker_receipt_writer_activation'
  readonly futureIntentMustBeUserVisible: true
  readonly futureIntentMustBeProgramScoped: true
  readonly futureIntentMustPreserveCompletedSessions: true
  readonly futureIntentMustNotMutateProgramCardsInThisStep: true
}

// -----------------------------------------------------------------------------
// Preview Summary
// -----------------------------------------------------------------------------

export interface ExplicitActivationRequestIntentCapturePreviewSummary {
  readonly totalRequirements: number
  readonly sourceLockVerifiedRequirements: number
  readonly futureUserIntentRequirements: number
  readonly futureConfirmationRequirements: number
  readonly futureScopeReviewRequirements: number
  readonly futureReversalReviewRequirements: number
  readonly blockedByDesignRequirements: number

  readonly readyForFutureAuthorizationReviewPreview: boolean
  readonly explicitUserIntentCapturedNow: false
  readonly explicitActivationRequestedNow: false
  readonly authorizationGrantedNow: false
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// -----------------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------------

export interface ExplicitActivationRequestIntentCapturePreviewModel {
  readonly status: ExplicitActivationRequestIntentCapturePreviewStatus
  readonly mode: ExplicitActivationRequestIntentCapturePreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceAuthorizationLockStatus: string
  readonly sourceAuthorizationLockEngaged: boolean
  readonly sourceRequestPreviewVerified: boolean
  readonly sourceReadyForFutureIntentCapturePreview: boolean
  readonly sourceExplicitPersistenceActivationRequested: false
  readonly sourceAuthorizationGranted: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ExplicitActivationRequestIntentCapturePreviewPayload | null
  readonly requirements: readonly ExplicitActivationRequestIntentCaptureRequirement[]
  readonly previewSummary: ExplicitActivationRequestIntentCapturePreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly authorizationLockVerified: boolean
  readonly intentCapturePreviewReady: boolean
  readonly readyForFutureAuthorizationReviewPreview: boolean

  readonly canShowIntentCapturePreview: boolean
  readonly canDisplayFutureIntentRequirements: boolean
  readonly canCaptureExplicitUserIntentNow: false
  readonly canRequestExplicitPersistenceActivationNow: false
  readonly canGrantAuthorizationNow: false
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

  readonly explicitUserIntentCaptured: false
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

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ExplicitActivationRequestIntentCapturePreviewInput {
  readonly activationRequestAuthorizationLockModel: ActivationRequestAuthorizationLockModel | null | undefined
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolveExplicitActivationRequestIntentCapturePreview(
  input: ExplicitActivationRequestIntentCapturePreviewInput
): ExplicitActivationRequestIntentCapturePreviewModel {
  const { activationRequestAuthorizationLockModel } = input

  // Case 1: No authorization lock model
  if (!activationRequestAuthorizationLockModel) {
    return buildUnavailableModel(
      'unavailable_missing_authorization_lock',
      'Authorization lock model not available',
      'Cannot preview intent capture requirements without authorization lock context.',
      ['Authorization lock model is missing or undefined.'],
      'Provide authorization lock model to preview intent capture requirements.',
    )
  }

  // Case 2: Authorization lock not engaged
  if (activationRequestAuthorizationLockModel.status !== 'authorization_lock_engaged_persistence_disabled') {
    return buildBlockedModel(
      activationRequestAuthorizationLockModel.status,
      activationRequestAuthorizationLockModel.authorizationLockEngaged,
      activationRequestAuthorizationLockModel.requestPreviewVerified,
      activationRequestAuthorizationLockModel.readyForFutureIntentCapturePreview,
      `Authorization lock status is "${activationRequestAuthorizationLockModel.status}" — not engaged yet.`,
    )
  }

  // Case 3: Authorization lock engaged — intent capture preview ready
  return buildReadyModel(activationRequestAuthorizationLockModel)
}

// -----------------------------------------------------------------------------
// Internal Builders
// -----------------------------------------------------------------------------

function buildUnavailableModel(
  status: ExplicitActivationRequestIntentCapturePreviewStatus,
  headline: string,
  summary: string,
  blockerSummary: readonly string[],
  nextRequiredStep: string,
): ExplicitActivationRequestIntentCapturePreviewModel {
  const emptyRequirements: readonly ExplicitActivationRequestIntentCaptureRequirement[] = []

  return {
    status,
    mode: 'not_ready',
    headline,
    summary,

    sourceAuthorizationLockStatus: 'unknown',
    sourceAuthorizationLockEngaged: false,
    sourceRequestPreviewVerified: false,
    sourceReadyForFutureIntentCapturePreview: false,
    sourceExplicitPersistenceActivationRequested: false,
    sourceAuthorizationGranted: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload: null,
    requirements: emptyRequirements,
    previewSummary: {
      totalRequirements: 0,
      sourceLockVerifiedRequirements: 0,
      futureUserIntentRequirements: 0,
      futureConfirmationRequirements: 0,
      futureScopeReviewRequirements: 0,
      futureReversalReviewRequirements: 0,
      blockedByDesignRequirements: 0,
      readyForFutureAuthorizationReviewPreview: false,
      explicitUserIntentCapturedNow: false,
      explicitActivationRequestedNow: false,
      authorizationGrantedNow: false,
      realActivationAllowedNow: false,
      persistenceStillDisabled: true,
      writeStillDisabled: true,
    },
    blockerSummary,
    nextRequiredStep,

    authorizationLockVerified: false,
    intentCapturePreviewReady: false,
    readyForFutureAuthorizationReviewPreview: false,

    canShowIntentCapturePreview: false,
    canDisplayFutureIntentRequirements: false,
    canCaptureExplicitUserIntentNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canGrantAuthorizationNow: false,
    canAuthorizePersistenceNow: false,
    canActivatePersistenceNow: false,
    canCreateDurableReceiptNow: false,
    canPersistMarkerNow: false,
    canWriteReceiptNow: false,
    canAttemptWriteNow: false,
    canCallApiRouteNow: false,
    canUseDbClientNow: false,
    canUseStorageNow: false,
    canTouchSchemaNow: false,
    canMutateProgramCardsNow: false,
    canMutateStartWorkoutNow: false,
    canMutateLiveWorkoutNow: false,
    canMutateFutureSessionsNow: false,

    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    authorizationGranted: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    apiRouteCalled: false,
    dbClientUsed: false,
    storageUsed: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
  }
}

function buildBlockedModel(
  sourceStatus: string,
  sourceAuthorizationLockEngaged: boolean,
  sourceRequestPreviewVerified: boolean,
  sourceReadyForFutureIntentCapturePreview: boolean,
  blockerMessage: string,
): ExplicitActivationRequestIntentCapturePreviewModel {
  const emptyRequirements: readonly ExplicitActivationRequestIntentCaptureRequirement[] = []

  return {
    status: 'blocked_authorization_lock_not_ready',
    mode: 'not_ready',
    headline: 'Intent Capture Preview Blocked',
    summary: `Cannot preview intent capture requirements: ${blockerMessage}`,

    sourceAuthorizationLockStatus: sourceStatus,
    sourceAuthorizationLockEngaged,
    sourceRequestPreviewVerified,
    sourceReadyForFutureIntentCapturePreview,
    sourceExplicitPersistenceActivationRequested: false,
    sourceAuthorizationGranted: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload: null,
    requirements: emptyRequirements,
    previewSummary: {
      totalRequirements: 0,
      sourceLockVerifiedRequirements: 0,
      futureUserIntentRequirements: 0,
      futureConfirmationRequirements: 0,
      futureScopeReviewRequirements: 0,
      futureReversalReviewRequirements: 0,
      blockedByDesignRequirements: 0,
      readyForFutureAuthorizationReviewPreview: false,
      explicitUserIntentCapturedNow: false,
      explicitActivationRequestedNow: false,
      authorizationGrantedNow: false,
      realActivationAllowedNow: false,
      persistenceStillDisabled: true,
      writeStillDisabled: true,
    },
    blockerSummary: [blockerMessage],
    nextRequiredStep: 'Resolve authorization lock blockers before previewing intent capture requirements.',

    authorizationLockVerified: false,
    intentCapturePreviewReady: false,
    readyForFutureAuthorizationReviewPreview: false,

    canShowIntentCapturePreview: false,
    canDisplayFutureIntentRequirements: false,
    canCaptureExplicitUserIntentNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canGrantAuthorizationNow: false,
    canAuthorizePersistenceNow: false,
    canActivatePersistenceNow: false,
    canCreateDurableReceiptNow: false,
    canPersistMarkerNow: false,
    canWriteReceiptNow: false,
    canAttemptWriteNow: false,
    canCallApiRouteNow: false,
    canUseDbClientNow: false,
    canUseStorageNow: false,
    canTouchSchemaNow: false,
    canMutateProgramCardsNow: false,
    canMutateStartWorkoutNow: false,
    canMutateLiveWorkoutNow: false,
    canMutateFutureSessionsNow: false,

    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    authorizationGranted: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    apiRouteCalled: false,
    dbClientUsed: false,
    storageUsed: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
  }
}

function buildReadyModel(
  authLockModel: ActivationRequestAuthorizationLockModel,
): ExplicitActivationRequestIntentCapturePreviewModel {
  const requirements: readonly ExplicitActivationRequestIntentCaptureRequirement[] = [
    {
      key: 'authorization_lock_verified',
      label: 'Authorization lock verified',
      status: 'source_authorization_lock_verified',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'The prior authorization lock is engaged and still persistence-disabled.',
    },
    {
      key: 'future_user_intent_required',
      label: 'Explicit user intent required later',
      status: 'future_user_intent_required',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A future step must capture a clear user request before activation can be requested.',
    },
    {
      key: 'future_unambiguous_confirmation_required',
      label: 'Unambiguous confirmation required later',
      status: 'future_unambiguous_confirmation_required',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'Activation cannot proceed from preview readiness; the user must explicitly confirm the exact capability later.',
    },
    {
      key: 'future_scope_review_required',
      label: 'Program-scoped activation review required later',
      status: 'future_scope_review_required',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A later authorization step must define the exact program/session scope before any persistence is allowed.',
    },
    {
      key: 'future_reversal_review_required',
      label: 'Reversal/revocation review required later',
      status: 'future_reversal_review_required',
      satisfiedForPreview: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A future real activation path must define how authorization can be reviewed, revoked, or blocked before writes exist.',
    },
    {
      key: 'writer_receipt_blocked_by_design',
      label: 'Writer and receipt blocked by design',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'This step previews intent capture only. Writer, receipt, persistence, API, DB, storage, and schema remain disabled.',
    },
    {
      key: 'program_runtime_mutation_blocked',
      label: 'Program and workout mutation blocked',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: false,
      blocksRealActivationNow: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain untouched during intent capture preview.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'Intent capture preview cannot rewrite completed sessions or logged history.',
    },
  ]

  // Count by status
  let sourceLockVerifiedRequirements = 0
  let futureUserIntentRequirements = 0
  let futureConfirmationRequirements = 0
  let futureScopeReviewRequirements = 0
  let futureReversalReviewRequirements = 0
  let blockedByDesignRequirements = 0

  for (const req of requirements) {
    switch (req.status) {
      case 'source_authorization_lock_verified':
        sourceLockVerifiedRequirements++
        break
      case 'future_user_intent_required':
        futureUserIntentRequirements++
        break
      case 'future_unambiguous_confirmation_required':
        futureConfirmationRequirements++
        break
      case 'future_scope_review_required':
        futureScopeReviewRequirements++
        break
      case 'future_reversal_review_required':
        futureReversalReviewRequirements++
        break
      case 'blocked_by_design':
        blockedByDesignRequirements++
        break
    }
  }

  const previewPayload: ExplicitActivationRequestIntentCapturePreviewPayload = {
    previewKind: 'explicit_activation_request_intent_capture_preview',
    sourceStep: 'MASTER-8C.54_AB20.4.47',
    sourceAuthorizationLockStatus: authLockModel.status,
    currentMode: 'intent_capture_preview_only_persistence_disabled',
    authorizationLockVerified: true,
    intentCapturePreviewReady: true,

    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    authorizationGranted: false,
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,

    intendedFutureCapability: 'durable_marker_receipt_writer_activation',
    futureIntentMustBeUserVisible: true,
    futureIntentMustBeProgramScoped: true,
    futureIntentMustPreserveCompletedSessions: true,
    futureIntentMustNotMutateProgramCardsInThisStep: true,
  }

  const previewSummary: ExplicitActivationRequestIntentCapturePreviewSummary = {
    totalRequirements: requirements.length,
    sourceLockVerifiedRequirements,
    futureUserIntentRequirements,
    futureConfirmationRequirements,
    futureScopeReviewRequirements,
    futureReversalReviewRequirements,
    blockedByDesignRequirements,
    readyForFutureAuthorizationReviewPreview: true,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    authorizationGrantedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }

  return {
    status: 'intent_capture_preview_ready_persistence_disabled',
    mode: 'read_only_intent_capture_preview',
    headline: 'Explicit Activation Request Intent Capture Preview Ready',
    summary: 'The authorization lock is verified, so the system can preview the future explicit user-intent requirements. No user intent has been captured, no activation has been requested, no authorization has been granted, and persistence/write/receipt/API/DB/storage/schema/program/workout mutation remain disabled.',

    sourceAuthorizationLockStatus: authLockModel.status,
    sourceAuthorizationLockEngaged: authLockModel.authorizationLockEngaged,
    sourceRequestPreviewVerified: authLockModel.requestPreviewVerified,
    sourceReadyForFutureIntentCapturePreview: authLockModel.readyForFutureIntentCapturePreview,
    sourceExplicitPersistenceActivationRequested: false,
    sourceAuthorizationGranted: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload,
    requirements,
    previewSummary,
    blockerSummary: [],
    nextRequiredStep: 'Next gate should preview authorization review requirements while persistence remains disabled.',

    authorizationLockVerified: true,
    intentCapturePreviewReady: true,
    readyForFutureAuthorizationReviewPreview: true,

    canShowIntentCapturePreview: true,
    canDisplayFutureIntentRequirements: true,
    canCaptureExplicitUserIntentNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canGrantAuthorizationNow: false,
    canAuthorizePersistenceNow: false,
    canActivatePersistenceNow: false,
    canCreateDurableReceiptNow: false,
    canPersistMarkerNow: false,
    canWriteReceiptNow: false,
    canAttemptWriteNow: false,
    canCallApiRouteNow: false,
    canUseDbClientNow: false,
    canUseStorageNow: false,
    canTouchSchemaNow: false,
    canMutateProgramCardsNow: false,
    canMutateStartWorkoutNow: false,
    canMutateLiveWorkoutNow: false,
    canMutateFutureSessionsNow: false,

    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    authorizationGranted: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    apiRouteCalled: false,
    dbClientUsed: false,
    storageUsed: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
  }
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

export function getExplicitActivationRequestIntentCapturePreviewStatusLabel(
  status: ExplicitActivationRequestIntentCapturePreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_authorization_lock':
      return 'authorization lock missing'
    case 'blocked_authorization_lock_not_ready':
      return 'authorization lock blocked'
    case 'intent_capture_preview_ready_persistence_disabled':
      return 'intent preview ready / persistence disabled'
    default:
      return 'unknown'
  }
}

export function getExplicitActivationRequestIntentCapturePreviewStatusColor(
  status: ExplicitActivationRequestIntentCapturePreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_authorization_lock':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_authorization_lock_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'intent_capture_preview_ready_persistence_disabled':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400/70',
        border: 'border-teal-500/20',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
  }
}

export function getExplicitActivationRequestIntentCaptureRequirementStatusLabel(
  status: ExplicitActivationRequestIntentCaptureRequirementStatus
): string {
  switch (status) {
    case 'source_authorization_lock_verified':
      return 'authorization lock verified'
    case 'future_user_intent_required':
      return 'future user intent'
    case 'future_unambiguous_confirmation_required':
      return 'future confirmation'
    case 'future_scope_review_required':
      return 'future scope review'
    case 'future_reversal_review_required':
      return 'future reversal review'
    case 'blocked_by_design':
      return 'blocked by design'
    default:
      return 'unknown'
  }
}

export function getExplicitActivationRequestIntentCaptureRequirementStatusColor(
  status: ExplicitActivationRequestIntentCaptureRequirementStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_authorization_lock_verified':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
      }
    case 'future_user_intent_required':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400/70',
      }
    case 'future_unambiguous_confirmation_required':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400/70',
      }
    case 'future_scope_review_required':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
      }
    case 'future_reversal_review_required':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
      }
    case 'blocked_by_design':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
      }
  }
}
