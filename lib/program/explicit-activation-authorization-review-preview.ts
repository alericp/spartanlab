/**
 * Explicit Activation Authorization Review Preview (MASTER-8C.55 / AB20.4.48)
 * 
 * Pure read-only helper that previews authorization review requirements.
 * - Consumes ExplicitActivationRequestIntentCapturePreviewModel
 * - Proves intent capture preview is ready
 * - Previews future authorization review requirements
 * - Does NOT capture user intent
 * - Does NOT request activation
 * - Does NOT review authorization
 * - Does NOT grant or deny authorization
 * - Does NOT enable persistence
 * - Does NOT write anything
 * - Does NOT call API/DB/storage
 * - Does NOT touch schema
 * - Does NOT mutate Program Cards / Start Workout / Live Workout
 */

import type {
  ExplicitActivationRequestIntentCapturePreviewModel,
} from './explicit-activation-request-intent-capture-preview'

// ============================================================================
// Status Types
// ============================================================================

export type ExplicitActivationAuthorizationReviewPreviewStatus =
  | 'unavailable_missing_intent_capture_preview'
  | 'blocked_intent_capture_preview_not_ready'
  | 'authorization_review_preview_ready_persistence_disabled'

export type ExplicitActivationAuthorizationReviewPreviewMode =
  | 'read_only_authorization_review_preview'
  | 'not_ready'

export type ExplicitActivationAuthorizationReviewRequirementStatus =
  | 'source_intent_capture_preview_verified'
  | 'future_authorization_scope_required'
  | 'future_authorization_grant_boundary_required'
  | 'future_authorization_denial_path_required'
  | 'future_revocation_review_required'
  | 'future_audit_receipt_review_required'
  | 'blocked_by_design'

// ============================================================================
// Requirement Interface
// ============================================================================

export interface ExplicitActivationAuthorizationReviewRequirement {
  readonly key: string
  readonly label: string
  readonly status: ExplicitActivationAuthorizationReviewRequirementStatus
  readonly satisfiedForPreview: boolean
  readonly requiredBeforeRealAuthorization: boolean
  readonly blocksRealAuthorizationNow: boolean
  readonly reason: string
}

// ============================================================================
// Payload Interface
// ============================================================================

export interface ExplicitActivationAuthorizationReviewPreviewPayload {
  readonly previewKind: 'explicit_activation_authorization_review_preview'
  readonly sourceStep: 'MASTER-8C.55_AB20.4.48'
  readonly sourceIntentCapturePreviewStatus: string
  readonly currentMode: 'authorization_review_preview_only_persistence_disabled'

  readonly intentCapturePreviewVerified: boolean
  readonly authorizationReviewPreviewReady: boolean

  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false

  readonly intendedFutureCapability: 'durable_marker_receipt_writer_activation'
  readonly futureAuthorizationMustBeUserScoped: true
  readonly futureAuthorizationMustBeProgramScoped: true
  readonly futureAuthorizationMustBeExplicitAndRevocable: true
  readonly futureAuthorizationMustPreserveCompletedSessions: true
  readonly futureAuthorizationMustNotMutateProgramCardsInThisStep: true
}

// ============================================================================
// Summary Interface
// ============================================================================

export interface ExplicitActivationAuthorizationReviewPreviewSummary {
  readonly totalRequirements: number
  readonly sourceIntentPreviewVerifiedRequirements: number
  readonly futureScopeRequirements: number
  readonly futureGrantBoundaryRequirements: number
  readonly futureDenialPathRequirements: number
  readonly futureRevocationReviewRequirements: number
  readonly futureAuditReceiptReviewRequirements: number
  readonly blockedByDesignRequirements: number

  readonly readyForFuturePermissionBoundaryPreview: boolean
  readonly explicitUserIntentCapturedNow: false
  readonly explicitActivationRequestedNow: false
  readonly authorizationReviewedNow: false
  readonly authorizationGrantedNow: false
  readonly authorizationDeniedNow: false
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// ============================================================================
// Model Interface
// ============================================================================

export interface ExplicitActivationAuthorizationReviewPreviewModel {
  readonly status: ExplicitActivationAuthorizationReviewPreviewStatus
  readonly mode: ExplicitActivationAuthorizationReviewPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceIntentCapturePreviewStatus: string
  readonly sourceAuthorizationLockVerified: boolean
  readonly sourceIntentCapturePreviewReady: boolean
  readonly sourceReadyForFutureAuthorizationReviewPreview: boolean
  readonly sourceExplicitUserIntentCaptured: false
  readonly sourceExplicitPersistenceActivationRequested: false
  readonly sourceAuthorizationGranted: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ExplicitActivationAuthorizationReviewPreviewPayload | null
  readonly requirements: readonly ExplicitActivationAuthorizationReviewRequirement[]
  readonly previewSummary: ExplicitActivationAuthorizationReviewPreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly intentCapturePreviewVerified: boolean
  readonly authorizationReviewPreviewReady: boolean
  readonly readyForFuturePermissionBoundaryPreview: boolean

  readonly canShowAuthorizationReviewPreview: boolean
  readonly canDisplayFutureAuthorizationRequirements: boolean
  readonly canCaptureExplicitUserIntentNow: false
  readonly canRequestExplicitPersistenceActivationNow: false
  readonly canReviewAuthorizationNow: false
  readonly canGrantAuthorizationNow: false
  readonly canDenyAuthorizationNow: false
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
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
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

// ============================================================================
// Input Interface
// ============================================================================

export interface ExplicitActivationAuthorizationReviewPreviewInput {
  readonly explicitActivationRequestIntentCapturePreviewModel:
    | ExplicitActivationRequestIntentCapturePreviewModel
    | null
    | undefined
}

// ============================================================================
// Resolver
// ============================================================================

export function resolveExplicitActivationAuthorizationReviewPreview(
  input: ExplicitActivationAuthorizationReviewPreviewInput
): ExplicitActivationAuthorizationReviewPreviewModel {
  const { explicitActivationRequestIntentCapturePreviewModel } = input

  // Hard-coded false flags - never enabled in this preview
  const hardFalseFlags = {
    sourceExplicitUserIntentCaptured: false as const,
    sourceExplicitPersistenceActivationRequested: false as const,
    sourceAuthorizationGranted: false as const,
    sourcePersistenceEnabled: false as const,
    sourceWriteEnabled: false as const,
    sourceReceiptWritten: false as const,
    canCaptureExplicitUserIntentNow: false as const,
    canRequestExplicitPersistenceActivationNow: false as const,
    canReviewAuthorizationNow: false as const,
    canGrantAuthorizationNow: false as const,
    canDenyAuthorizationNow: false as const,
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
    explicitUserIntentCaptured: false as const,
    explicitPersistenceActivationRequested: false as const,
    authorizationReviewed: false as const,
    authorizationGranted: false as const,
    authorizationDenied: false as const,
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

  // Case 1: No intent capture preview model
  if (!explicitActivationRequestIntentCapturePreviewModel) {
    const blockedSummary = createBlockedSummary(
      0,
      'Intent capture preview model is missing'
    )
    return {
      status: 'unavailable_missing_intent_capture_preview',
      mode: 'not_ready',
      headline: 'Authorization Review Preview Unavailable',
      summary: 'Cannot preview authorization review requirements because the intent capture preview model is missing.',
      sourceIntentCapturePreviewStatus: 'missing',
      sourceAuthorizationLockVerified: false,
      sourceIntentCapturePreviewReady: false,
      sourceReadyForFutureAuthorizationReviewPreview: false,
      previewPayload: null,
      requirements: createBlockedRequirements(),
      previewSummary: blockedSummary,
      blockerSummary: ['Intent capture preview model is missing'],
      nextRequiredStep: 'Provide intent capture preview model to continue',
      intentCapturePreviewVerified: false,
      authorizationReviewPreviewReady: false,
      readyForFuturePermissionBoundaryPreview: false,
      canShowAuthorizationReviewPreview: false,
      canDisplayFutureAuthorizationRequirements: false,
      ...hardFalseFlags,
    }
  }

  // Case 2: Intent capture preview not ready
  if (explicitActivationRequestIntentCapturePreviewModel.status !== 'intent_capture_preview_ready_persistence_disabled') {
    const blockedSummary = createBlockedSummary(
      0,
      `Intent capture preview status is ${explicitActivationRequestIntentCapturePreviewModel.status}`
    )
    return {
      status: 'blocked_intent_capture_preview_not_ready',
      mode: 'not_ready',
      headline: 'Authorization Review Preview Blocked',
      summary: `Cannot preview authorization review requirements because the intent capture preview is not ready. Current status: ${explicitActivationRequestIntentCapturePreviewModel.status}`,
      sourceIntentCapturePreviewStatus: explicitActivationRequestIntentCapturePreviewModel.status,
      sourceAuthorizationLockVerified: explicitActivationRequestIntentCapturePreviewModel.authorizationLockVerified,
      sourceIntentCapturePreviewReady: false,
      sourceReadyForFutureAuthorizationReviewPreview: false,
      previewPayload: null,
      requirements: createBlockedRequirements(),
      previewSummary: blockedSummary,
      blockerSummary: [
        `Intent capture preview status is ${explicitActivationRequestIntentCapturePreviewModel.status}`,
        'Intent capture preview must be ready before authorization review preview can proceed',
      ],
      nextRequiredStep: 'Wait for intent capture preview to become ready',
      intentCapturePreviewVerified: false,
      authorizationReviewPreviewReady: false,
      readyForFuturePermissionBoundaryPreview: false,
      canShowAuthorizationReviewPreview: false,
      canDisplayFutureAuthorizationRequirements: false,
      ...hardFalseFlags,
    }
  }

  // Case 3: Intent capture preview is ready - create authorization review preview
  const requirements = createReadyRequirements()
  const previewSummary = createReadySummary(requirements)
  const previewPayload = createReadyPayload(
    explicitActivationRequestIntentCapturePreviewModel.status
  )

  return {
    status: 'authorization_review_preview_ready_persistence_disabled',
    mode: 'read_only_authorization_review_preview',
    headline: 'Explicit Activation Authorization Review Preview Ready',
    summary: 'The intent-capture preview is verified, so the system can preview future authorization-review requirements. No user intent has been captured, no activation has been requested, no authorization has been reviewed or granted, and persistence/write/receipt/API/DB/storage/schema/program/workout mutation remain disabled.',
    sourceIntentCapturePreviewStatus: explicitActivationRequestIntentCapturePreviewModel.status,
    sourceAuthorizationLockVerified: explicitActivationRequestIntentCapturePreviewModel.authorizationLockVerified,
    sourceIntentCapturePreviewReady: true,
    sourceReadyForFutureAuthorizationReviewPreview: explicitActivationRequestIntentCapturePreviewModel.readyForFutureAuthorizationReviewPreview,
    previewPayload,
    requirements,
    previewSummary,
    blockerSummary: [],
    nextRequiredStep: 'Next gate should preview the controlled activation permission boundary while persistence remains disabled.',
    intentCapturePreviewVerified: true,
    authorizationReviewPreviewReady: true,
    readyForFuturePermissionBoundaryPreview: true,
    canShowAuthorizationReviewPreview: true,
    canDisplayFutureAuthorizationRequirements: true,
    ...hardFalseFlags,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function createBlockedRequirements(): readonly ExplicitActivationAuthorizationReviewRequirement[] {
  return [
    {
      key: 'intent_capture_preview_verified',
      label: 'Intent capture preview verified',
      status: 'source_intent_capture_preview_verified',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'Intent capture preview must be verified before authorization review can proceed.',
    },
    {
      key: 'future_authorization_scope_required',
      label: 'Future authorization scope required',
      status: 'future_authorization_scope_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future authorization step must define exactly which program/session/marker scope is allowed before any write can exist.',
    },
    {
      key: 'future_authorization_grant_boundary_required',
      label: 'Future grant boundary required',
      status: 'future_authorization_grant_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'Preview readiness cannot become authorization. A later step must explicitly define the grant boundary before persistence activation.',
    },
    {
      key: 'future_authorization_denial_path_required',
      label: 'Future denial path required',
      status: 'future_authorization_denial_path_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future real authorization flow must be able to remain denied/blocked without falling through to activation.',
    },
    {
      key: 'future_revocation_review_required',
      label: 'Future revocation review required',
      status: 'future_revocation_review_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future permission system must define how authorization can be reviewed, revoked, or disabled.',
    },
    {
      key: 'future_audit_receipt_review_required',
      label: 'Future audit/receipt review required',
      status: 'future_audit_receipt_review_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future writer must define receipt/audit expectations before writes are allowed.',
    },
    {
      key: 'writer_persistence_blocked_by_design',
      label: 'Writer and persistence blocked by design',
      status: 'blocked_by_design',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'This step previews authorization review only. Writer, receipt, persistence, API, DB, storage, and schema remain disabled.',
    },
    {
      key: 'program_runtime_mutation_blocked',
      label: 'Program and workout mutation blocked',
      status: 'blocked_by_design',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: false,
      blocksRealAuthorizationNow: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain untouched during authorization review preview.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'blocked_by_design',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: false,
      reason: 'Authorization review preview cannot rewrite completed sessions or logged history.',
    },
  ]
}

function createReadyRequirements(): readonly ExplicitActivationAuthorizationReviewRequirement[] {
  return [
    {
      key: 'intent_capture_preview_verified',
      label: 'Intent capture preview verified',
      status: 'source_intent_capture_preview_verified',
      satisfiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: false,
      reason: 'The prior intent-capture preview is ready while persistence remains disabled.',
    },
    {
      key: 'future_authorization_scope_required',
      label: 'Future authorization scope required',
      status: 'future_authorization_scope_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future authorization step must define exactly which program/session/marker scope is allowed before any write can exist.',
    },
    {
      key: 'future_authorization_grant_boundary_required',
      label: 'Future grant boundary required',
      status: 'future_authorization_grant_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'Preview readiness cannot become authorization. A later step must explicitly define the grant boundary before persistence activation.',
    },
    {
      key: 'future_authorization_denial_path_required',
      label: 'Future denial path required',
      status: 'future_authorization_denial_path_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future real authorization flow must be able to remain denied/blocked without falling through to activation.',
    },
    {
      key: 'future_revocation_review_required',
      label: 'Future revocation review required',
      status: 'future_revocation_review_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future permission system must define how authorization can be reviewed, revoked, or disabled.',
    },
    {
      key: 'future_audit_receipt_review_required',
      label: 'Future audit/receipt review required',
      status: 'future_audit_receipt_review_required',
      satisfiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'A future writer must define receipt/audit expectations before writes are allowed.',
    },
    {
      key: 'writer_persistence_blocked_by_design',
      label: 'Writer and persistence blocked by design',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: true,
      reason: 'This step previews authorization review only. Writer, receipt, persistence, API, DB, storage, and schema remain disabled.',
    },
    {
      key: 'program_runtime_mutation_blocked',
      label: 'Program and workout mutation blocked',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealAuthorization: false,
      blocksRealAuthorizationNow: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain untouched during authorization review preview.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksRealAuthorizationNow: false,
      reason: 'Authorization review preview cannot rewrite completed sessions or logged history.',
    },
  ]
}

function createBlockedSummary(
  _sourceVerified: number,
  _reason: string
): ExplicitActivationAuthorizationReviewPreviewSummary {
  return {
    totalRequirements: 9,
    sourceIntentPreviewVerifiedRequirements: 0,
    futureScopeRequirements: 1,
    futureGrantBoundaryRequirements: 1,
    futureDenialPathRequirements: 1,
    futureRevocationReviewRequirements: 1,
    futureAuditReceiptReviewRequirements: 1,
    blockedByDesignRequirements: 3,
    readyForFuturePermissionBoundaryPreview: false,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    authorizationReviewedNow: false,
    authorizationGrantedNow: false,
    authorizationDeniedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }
}

function createReadySummary(
  requirements: readonly ExplicitActivationAuthorizationReviewRequirement[]
): ExplicitActivationAuthorizationReviewPreviewSummary {
  const sourceIntentPreviewVerifiedRequirements = requirements.filter(
    r => r.status === 'source_intent_capture_preview_verified'
  ).length
  const futureScopeRequirements = requirements.filter(
    r => r.status === 'future_authorization_scope_required'
  ).length
  const futureGrantBoundaryRequirements = requirements.filter(
    r => r.status === 'future_authorization_grant_boundary_required'
  ).length
  const futureDenialPathRequirements = requirements.filter(
    r => r.status === 'future_authorization_denial_path_required'
  ).length
  const futureRevocationReviewRequirements = requirements.filter(
    r => r.status === 'future_revocation_review_required'
  ).length
  const futureAuditReceiptReviewRequirements = requirements.filter(
    r => r.status === 'future_audit_receipt_review_required'
  ).length
  const blockedByDesignRequirements = requirements.filter(
    r => r.status === 'blocked_by_design'
  ).length

  return {
    totalRequirements: requirements.length,
    sourceIntentPreviewVerifiedRequirements,
    futureScopeRequirements,
    futureGrantBoundaryRequirements,
    futureDenialPathRequirements,
    futureRevocationReviewRequirements,
    futureAuditReceiptReviewRequirements,
    blockedByDesignRequirements,
    readyForFuturePermissionBoundaryPreview: true,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    authorizationReviewedNow: false,
    authorizationGrantedNow: false,
    authorizationDeniedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }
}

function createReadyPayload(
  sourceIntentCapturePreviewStatus: string
): ExplicitActivationAuthorizationReviewPreviewPayload {
  return {
    previewKind: 'explicit_activation_authorization_review_preview',
    sourceStep: 'MASTER-8C.55_AB20.4.48',
    sourceIntentCapturePreviewStatus,
    currentMode: 'authorization_review_preview_only_persistence_disabled',
    intentCapturePreviewVerified: true,
    authorizationReviewPreviewReady: true,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    intendedFutureCapability: 'durable_marker_receipt_writer_activation',
    futureAuthorizationMustBeUserScoped: true,
    futureAuthorizationMustBeProgramScoped: true,
    futureAuthorizationMustBeExplicitAndRevocable: true,
    futureAuthorizationMustPreserveCompletedSessions: true,
    futureAuthorizationMustNotMutateProgramCardsInThisStep: true,
  }
}

// ============================================================================
// Status Label Helpers
// ============================================================================

export function getExplicitActivationAuthorizationReviewPreviewStatusLabel(
  status: ExplicitActivationAuthorizationReviewPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_intent_capture_preview':
      return 'intent preview missing'
    case 'blocked_intent_capture_preview_not_ready':
      return 'intent preview blocked'
    case 'authorization_review_preview_ready_persistence_disabled':
      return 'authorization review ready / persistence disabled'
    default:
      return 'unknown'
  }
}

export function getExplicitActivationAuthorizationReviewPreviewStatusColor(
  status: ExplicitActivationAuthorizationReviewPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_intent_capture_preview':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_intent_capture_preview_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'authorization_review_preview_ready_persistence_disabled':
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

export function getExplicitActivationAuthorizationReviewRequirementStatusLabel(
  status: ExplicitActivationAuthorizationReviewRequirementStatus
): string {
  switch (status) {
    case 'source_intent_capture_preview_verified':
      return 'intent preview verified'
    case 'future_authorization_scope_required':
      return 'future authorization scope'
    case 'future_authorization_grant_boundary_required':
      return 'future grant boundary'
    case 'future_authorization_denial_path_required':
      return 'future denial path'
    case 'future_revocation_review_required':
      return 'future revocation review'
    case 'future_audit_receipt_review_required':
      return 'future audit/receipt review'
    case 'blocked_by_design':
      return 'blocked by design'
    default:
      return 'unknown'
  }
}

export function getExplicitActivationAuthorizationReviewRequirementStatusColor(
  status: ExplicitActivationAuthorizationReviewRequirementStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_intent_capture_preview_verified':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
      }
    case 'future_authorization_scope_required':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400/70',
      }
    case 'future_authorization_grant_boundary_required':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400/70',
      }
    case 'future_authorization_denial_path_required':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
      }
    case 'future_revocation_review_required':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
      }
    case 'future_audit_receipt_review_required':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
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
