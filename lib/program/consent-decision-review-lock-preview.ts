/**
 * Consent Decision Review Lock Preview
 * MASTER-8C.60 / AB20.4.53
 * 
 * Pure read-only consent decision review lock preview.
 * Proves review is required but not performed before any grant/deny/authorization/permission/persistence can exist.
 * 
 * SAFETY INVARIANTS:
 * - Consent decision-state preview verified? yes only when source is ready
 * - Review lock ready? yes only as preview
 * - Current review state: review_not_performed
 * - Review performed? no
 * - Grant review approved? no
 * - Deny review approved? no
 * - All consent/authorization/permission/activation/persistence/write flags: false
 * - Completed sessions protected: true
 * - No API/DB/storage/schema touched
 * - No Program Cards/Start Workout/Live Workout changed
 */

import type {
  ConsentDecisionStatePreviewModel,
} from './consent-decision-state-preview'

// ============================================================================
// Status Types
// ============================================================================

export type ConsentDecisionReviewLockPreviewStatus =
  | 'unavailable_missing_consent_decision_state_preview'
  | 'blocked_consent_decision_state_preview_not_ready'
  | 'consent_decision_review_locked_persistence_disabled'

export type ConsentDecisionReviewLockPreviewMode =
  | 'read_only_consent_decision_review_lock'
  | 'not_ready'

export type ConsentDecisionReviewLockState =
  | 'review_not_performed'

export type ConsentDecisionReviewLockItemStatus =
  | 'source_decision_state_preview_verified'
  | 'review_required_but_not_performed'
  | 'grant_review_path_locked'
  | 'deny_review_path_locked'
  | 'undecided_review_path_locked'
  | 'fallthrough_review_authorization_blocked'
  | 'authorization_path_locked'
  | 'permission_path_locked'
  | 'persistence_path_disabled'
  | 'receipt_path_disabled'
  | 'program_runtime_mutation_disabled'
  | 'completed_sessions_protected'

// ============================================================================
// Lock Item Interface
// ============================================================================

export interface ConsentDecisionReviewLockItem {
  readonly key: string
  readonly label: string
  readonly status: ConsentDecisionReviewLockItemStatus
  readonly sourceVerified: boolean
  readonly reviewRequired: boolean
  readonly reviewPerformedNow: false
  readonly lockedNow: boolean
  readonly blocksAuthorizationNow: boolean
  readonly blocksPermissionNow: boolean
  readonly blocksPersistenceNow: boolean
  readonly protectsCompletedSessions: boolean
  readonly reason: string
}

// ============================================================================
// Payload Interface
// ============================================================================

export interface ConsentDecisionReviewLockPreviewPayload {
  readonly previewKind: 'consent_decision_review_lock_preview'
  readonly sourceStep: 'MASTER-8C.60_AB20.4.53'
  readonly sourceConsentDecisionStatePreviewStatus: string
  readonly currentMode: 'consent_decision_review_lock_only_persistence_disabled'

  readonly consentDecisionStatePreviewVerified: boolean
  readonly consentDecisionReviewLockReady: boolean
  readonly currentReviewState: ConsentDecisionReviewLockState

  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentDecisionUndecided: true
  readonly consentDecisionReviewPerformed: false
  readonly consentDecisionReviewApprovedGrant: false
  readonly consentDecisionReviewApprovedDeny: false
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
  readonly permissionGranted: false
  readonly permissionDenied: false
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false

  readonly futureReviewMustRequireExplicitConsentDecision: true
  readonly futureReviewMustSeparateGrantAndDenyReview: true
  readonly futureReviewMustBlockUndecidedState: true
  readonly futureReviewMustPreventFallthroughAuthorization: true
  readonly futureReviewMustPreserveCompletedSessions: true
  readonly futureReviewMustNotMutateProgramCardsInThisStep: true
}

// ============================================================================
// Summary Interface
// ============================================================================

export interface ConsentDecisionReviewLockSummary {
  readonly totalItems: number
  readonly sourceVerifiedItems: number
  readonly reviewRequiredNotPerformedItems: number
  readonly grantReviewLockedItems: number
  readonly denyReviewLockedItems: number
  readonly undecidedReviewLockedItems: number
  readonly fallthroughBlockedItems: number
  readonly authorizationLockedItems: number
  readonly permissionLockedItems: number
  readonly persistenceDisabledItems: number
  readonly receiptDisabledItems: number
  readonly programRuntimeMutationDisabledItems: number
  readonly completedSessionsProtectedItems: number

  readonly readyForFutureConsentPermissionBoundaryPreview: boolean
  readonly consentDecisionStatePreviewVerifiedNow: boolean
  readonly consentDecisionReviewPerformedNow: false
  readonly explicitUserConsentCapturedNow: false
  readonly explicitUserIntentCapturedNow: false
  readonly explicitActivationRequestedNow: false
  readonly consentDecisionCollectedNow: false
  readonly consentDecisionGrantedNow: false
  readonly consentDecisionDeniedNow: false
  readonly consentDecisionUndecidedNow: true
  readonly authorizationReviewedNow: false
  readonly authorizationGrantedNow: false
  readonly authorizationDeniedNow: false
  readonly permissionGrantedNow: false
  readonly permissionDeniedNow: false
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// ============================================================================
// Model Interface
// ============================================================================

export interface ConsentDecisionReviewLockPreviewModel {
  readonly status: ConsentDecisionReviewLockPreviewStatus
  readonly mode: ConsentDecisionReviewLockPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceConsentDecisionStatePreviewStatus: string
  readonly sourceConsentDecisionStatePreviewReady: boolean
  readonly sourceReadyForFutureConsentDecisionReviewLock: boolean

  readonly sourceExplicitUserConsentCaptured: false
  readonly sourceExplicitUserIntentCaptured: false
  readonly sourceExplicitActivationRequested: false
  readonly sourceConsentDecisionCollected: false
  readonly sourceConsentDecisionGranted: false
  readonly sourceConsentDecisionDenied: false
  readonly sourceConsentDecisionUndecided: true
  readonly sourceAuthorizationReviewed: false
  readonly sourceAuthorizationGranted: false
  readonly sourceAuthorizationDenied: false
  readonly sourcePermissionGranted: false
  readonly sourcePermissionDenied: false
  readonly sourceRealActivationAllowed: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ConsentDecisionReviewLockPreviewPayload | null
  readonly reviewLockItems: readonly ConsentDecisionReviewLockItem[]
  readonly reviewLockSummary: ConsentDecisionReviewLockSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly consentDecisionStatePreviewVerified: boolean
  readonly consentDecisionReviewLockReady: boolean
  readonly readyForFutureConsentPermissionBoundaryPreview: boolean

  readonly currentReviewState: ConsentDecisionReviewLockState

  readonly canShowConsentDecisionReviewLock: boolean
  readonly canDisplayReviewLockItems: boolean

  readonly canCaptureExplicitUserConsentNow: false
  readonly canCaptureExplicitUserIntentNow: false
  readonly canCollectConsentDecisionNow: false
  readonly canPerformConsentDecisionReviewNow: false
  readonly canApproveGrantReviewNow: false
  readonly canApproveDenyReviewNow: false
  readonly canGrantConsentDecisionNow: false
  readonly canDenyConsentDecisionNow: false
  readonly canRequestExplicitPersistenceActivationNow: false
  readonly canReviewAuthorizationNow: false
  readonly canGrantAuthorizationNow: false
  readonly canDenyAuthorizationNow: false
  readonly canGrantPermissionNow: false
  readonly canDenyPermissionNow: false
  readonly canAllowRealActivationNow: false
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

  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentDecisionUndecided: true
  readonly consentDecisionReviewPerformed: false
  readonly consentDecisionReviewApprovedGrant: false
  readonly consentDecisionReviewApprovedDeny: false
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
  readonly permissionGranted: false
  readonly permissionDenied: false
  readonly realActivationAllowed: false
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

export interface ConsentDecisionReviewLockPreviewInput {
  readonly consentDecisionStatePreviewModel:
    | ConsentDecisionStatePreviewModel
    | null
    | undefined
}

// ============================================================================
// Lock Items Builder
// ============================================================================

function buildReviewLockItems(): readonly ConsentDecisionReviewLockItem[] {
  return [
    {
      key: 'source_decision_state_preview_verified',
      label: 'Source decision-state preview verified',
      status: 'source_decision_state_preview_verified',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Consent decision-state preview is ready, but no review has been performed.',
    },
    {
      key: 'review_required_but_not_performed',
      label: 'Review required but not performed',
      status: 'review_required_but_not_performed',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'A future consent decision must pass a review gate before authorization or persistence can exist.',
    },
    {
      key: 'grant_review_path_locked',
      label: 'Grant review path locked',
      status: 'grant_review_path_locked',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'A future grant cannot authorize persistence unless review explicitly approves the grant path.',
    },
    {
      key: 'deny_review_path_locked',
      label: 'Deny review path locked',
      status: 'deny_review_path_locked',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'A future denial must remain a hard block and cannot fall through to activation.',
    },
    {
      key: 'undecided_review_path_locked',
      label: 'Undecided review path locked',
      status: 'undecided_review_path_locked',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Undecided or missing consent decision state must block review, authorization, permission, and persistence.',
    },
    {
      key: 'fallthrough_review_authorization_blocked',
      label: 'Fallthrough review authorization blocked',
      status: 'fallthrough_review_authorization_blocked',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'No default review path may convert preview readiness into authorization, permission, or persistence.',
    },
    {
      key: 'authorization_path_locked',
      label: 'Authorization path locked',
      status: 'authorization_path_locked',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Authorization review/grant/deny remain unavailable in this read-only step.',
    },
    {
      key: 'permission_path_locked',
      label: 'Permission path locked',
      status: 'permission_path_locked',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPermissionNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Permission grant/deny cannot exist before a future reviewed consent decision.',
    },
    {
      key: 'persistence_path_disabled',
      label: 'Persistence path disabled',
      status: 'persistence_path_disabled',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPermissionNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Persistence/write/API/DB/storage remain disabled in this step.',
    },
    {
      key: 'receipt_path_disabled',
      label: 'Receipt path disabled',
      status: 'receipt_path_disabled',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPermissionNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'No durable receipt can be written while review is only locked in preview.',
    },
    {
      key: 'program_runtime_mutation_disabled',
      label: 'Program and workout mutation disabled',
      status: 'program_runtime_mutation_disabled',
      sourceVerified: true,
      reviewRequired: false,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPermissionNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain unchanged.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'completed_sessions_protected',
      sourceVerified: true,
      reviewRequired: true,
      reviewPerformedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPermissionNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Consent decision review lock cannot rewrite completed sessions or logged history.',
    },
  ]
}

// ============================================================================
// Summary Builder
// ============================================================================

function buildReviewLockSummary(
  items: readonly ConsentDecisionReviewLockItem[],
  sourceVerified: boolean
): ConsentDecisionReviewLockSummary {
  return {
    totalItems: items.length,
    sourceVerifiedItems: items.filter(i => i.status === 'source_decision_state_preview_verified').length,
    reviewRequiredNotPerformedItems: items.filter(i => i.status === 'review_required_but_not_performed').length,
    grantReviewLockedItems: items.filter(i => i.status === 'grant_review_path_locked').length,
    denyReviewLockedItems: items.filter(i => i.status === 'deny_review_path_locked').length,
    undecidedReviewLockedItems: items.filter(i => i.status === 'undecided_review_path_locked').length,
    fallthroughBlockedItems: items.filter(i => i.status === 'fallthrough_review_authorization_blocked').length,
    authorizationLockedItems: items.filter(i => i.status === 'authorization_path_locked').length,
    permissionLockedItems: items.filter(i => i.status === 'permission_path_locked').length,
    persistenceDisabledItems: items.filter(i => i.status === 'persistence_path_disabled').length,
    receiptDisabledItems: items.filter(i => i.status === 'receipt_path_disabled').length,
    programRuntimeMutationDisabledItems: items.filter(i => i.status === 'program_runtime_mutation_disabled').length,
    completedSessionsProtectedItems: items.filter(i => i.status === 'completed_sessions_protected').length,

    readyForFutureConsentPermissionBoundaryPreview: sourceVerified,
    consentDecisionStatePreviewVerifiedNow: sourceVerified,
    consentDecisionReviewPerformedNow: false,
    explicitUserConsentCapturedNow: false,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    consentDecisionCollectedNow: false,
    consentDecisionGrantedNow: false,
    consentDecisionDeniedNow: false,
    consentDecisionUndecidedNow: true,
    authorizationReviewedNow: false,
    authorizationGrantedNow: false,
    authorizationDeniedNow: false,
    permissionGrantedNow: false,
    permissionDeniedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }
}

// ============================================================================
// Not Ready Model Builder
// ============================================================================

function buildNotReadyModel(
  status: ConsentDecisionReviewLockPreviewStatus,
  headline: string,
  summary: string,
  sourceStatus: string,
  blockers: readonly string[]
): ConsentDecisionReviewLockPreviewModel {
  const emptyItems: readonly ConsentDecisionReviewLockItem[] = []
  return {
    status,
    mode: 'not_ready',
    headline,
    summary,

    sourceConsentDecisionStatePreviewStatus: sourceStatus,
    sourceConsentDecisionStatePreviewReady: false,
    sourceReadyForFutureConsentDecisionReviewLock: false,

    sourceExplicitUserConsentCaptured: false,
    sourceExplicitUserIntentCaptured: false,
    sourceExplicitActivationRequested: false,
    sourceConsentDecisionCollected: false,
    sourceConsentDecisionGranted: false,
    sourceConsentDecisionDenied: false,
    sourceConsentDecisionUndecided: true,
    sourceAuthorizationReviewed: false,
    sourceAuthorizationGranted: false,
    sourceAuthorizationDenied: false,
    sourcePermissionGranted: false,
    sourcePermissionDenied: false,
    sourceRealActivationAllowed: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload: null,
    reviewLockItems: emptyItems,
    reviewLockSummary: buildReviewLockSummary(emptyItems, false),
    blockerSummary: blockers,
    nextRequiredStep: 'Resolve blockers before consent decision review lock can be ready.',

    consentDecisionStatePreviewVerified: false,
    consentDecisionReviewLockReady: false,
    readyForFutureConsentPermissionBoundaryPreview: false,

    currentReviewState: 'review_not_performed',

    canShowConsentDecisionReviewLock: false,
    canDisplayReviewLockItems: false,

    canCaptureExplicitUserConsentNow: false,
    canCaptureExplicitUserIntentNow: false,
    canCollectConsentDecisionNow: false,
    canPerformConsentDecisionReviewNow: false,
    canApproveGrantReviewNow: false,
    canApproveDenyReviewNow: false,
    canGrantConsentDecisionNow: false,
    canDenyConsentDecisionNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canReviewAuthorizationNow: false,
    canGrantAuthorizationNow: false,
    canDenyAuthorizationNow: false,
    canGrantPermissionNow: false,
    canDenyPermissionNow: false,
    canAllowRealActivationNow: false,
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

    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionUndecided: true,
    consentDecisionReviewPerformed: false,
    consentDecisionReviewApprovedGrant: false,
    consentDecisionReviewApprovedDeny: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
    permissionGranted: false,
    permissionDenied: false,
    realActivationAllowed: false,
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

// ============================================================================
// Resolver
// ============================================================================

export function resolveConsentDecisionReviewLockPreview(
  input: ConsentDecisionReviewLockPreviewInput
): ConsentDecisionReviewLockPreviewModel {
  const { consentDecisionStatePreviewModel } = input

  // Case 1: No consent decision-state preview model
  if (!consentDecisionStatePreviewModel) {
    return buildNotReadyModel(
      'unavailable_missing_consent_decision_state_preview',
      'Consent Decision Review Lock Unavailable',
      'Cannot lock consent decision review without a consent decision-state preview model.',
      'missing',
      ['Consent decision-state preview model is missing or undefined.']
    )
  }

  // Case 2: Source not ready
  if (consentDecisionStatePreviewModel.status !== 'consent_decision_state_preview_ready_persistence_disabled') {
    return buildNotReadyModel(
      'blocked_consent_decision_state_preview_not_ready',
      'Consent Decision Review Lock Blocked',
      `Consent decision-state preview is not ready. Current status: ${consentDecisionStatePreviewModel.status}`,
      consentDecisionStatePreviewModel.status,
      [`Source consent decision-state preview status is "${consentDecisionStatePreviewModel.status}", not "consent_decision_state_preview_ready_persistence_disabled".`]
    )
  }

  // Case 3: Source is ready - build full model
  const reviewLockItems = buildReviewLockItems()
  const reviewLockSummary = buildReviewLockSummary(reviewLockItems, true)

  const payload: ConsentDecisionReviewLockPreviewPayload = {
    previewKind: 'consent_decision_review_lock_preview',
    sourceStep: 'MASTER-8C.60_AB20.4.53',
    sourceConsentDecisionStatePreviewStatus: consentDecisionStatePreviewModel.status,
    currentMode: 'consent_decision_review_lock_only_persistence_disabled',

    consentDecisionStatePreviewVerified: true,
    consentDecisionReviewLockReady: true,
    currentReviewState: 'review_not_performed',

    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionUndecided: true,
    consentDecisionReviewPerformed: false,
    consentDecisionReviewApprovedGrant: false,
    consentDecisionReviewApprovedDeny: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
    permissionGranted: false,
    permissionDenied: false,
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,

    futureReviewMustRequireExplicitConsentDecision: true,
    futureReviewMustSeparateGrantAndDenyReview: true,
    futureReviewMustBlockUndecidedState: true,
    futureReviewMustPreventFallthroughAuthorization: true,
    futureReviewMustPreserveCompletedSessions: true,
    futureReviewMustNotMutateProgramCardsInThisStep: true,
  }

  return {
    status: 'consent_decision_review_locked_persistence_disabled',
    mode: 'read_only_consent_decision_review_lock',
    headline: 'Consent Decision Review Lock Ready',
    summary: 'Consent decision-state preview is verified, so the system can lock the future review gate. No consent decision review has been performed. Grant, deny, undecided, authorization, permission, persistence, receipt, and fallthrough paths remain locked or disabled.',

    sourceConsentDecisionStatePreviewStatus: consentDecisionStatePreviewModel.status,
    sourceConsentDecisionStatePreviewReady: true,
    sourceReadyForFutureConsentDecisionReviewLock: consentDecisionStatePreviewModel.readyForFutureConsentDecisionReviewLock,

    sourceExplicitUserConsentCaptured: false,
    sourceExplicitUserIntentCaptured: false,
    sourceExplicitActivationRequested: false,
    sourceConsentDecisionCollected: false,
    sourceConsentDecisionGranted: false,
    sourceConsentDecisionDenied: false,
    sourceConsentDecisionUndecided: true,
    sourceAuthorizationReviewed: false,
    sourceAuthorizationGranted: false,
    sourceAuthorizationDenied: false,
    sourcePermissionGranted: false,
    sourcePermissionDenied: false,
    sourceRealActivationAllowed: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload: payload,
    reviewLockItems,
    reviewLockSummary,
    blockerSummary: [],
    nextRequiredStep: 'Next gate should preview the consent permission boundary while persistence remains disabled and no real authorization, permission, receipt, or write path exists.',

    consentDecisionStatePreviewVerified: true,
    consentDecisionReviewLockReady: true,
    readyForFutureConsentPermissionBoundaryPreview: true,

    currentReviewState: 'review_not_performed',

    canShowConsentDecisionReviewLock: true,
    canDisplayReviewLockItems: true,

    canCaptureExplicitUserConsentNow: false,
    canCaptureExplicitUserIntentNow: false,
    canCollectConsentDecisionNow: false,
    canPerformConsentDecisionReviewNow: false,
    canApproveGrantReviewNow: false,
    canApproveDenyReviewNow: false,
    canGrantConsentDecisionNow: false,
    canDenyConsentDecisionNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canReviewAuthorizationNow: false,
    canGrantAuthorizationNow: false,
    canDenyAuthorizationNow: false,
    canGrantPermissionNow: false,
    canDenyPermissionNow: false,
    canAllowRealActivationNow: false,
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

    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionUndecided: true,
    consentDecisionReviewPerformed: false,
    consentDecisionReviewApprovedGrant: false,
    consentDecisionReviewApprovedDeny: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
    permissionGranted: false,
    permissionDenied: false,
    realActivationAllowed: false,
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

// ============================================================================
// Helper Functions
// ============================================================================

export function getConsentDecisionReviewLockPreviewStatusLabel(
  status: ConsentDecisionReviewLockPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_consent_decision_state_preview':
      return 'decision-state preview missing'
    case 'blocked_consent_decision_state_preview_not_ready':
      return 'decision-state preview blocked'
    case 'consent_decision_review_locked_persistence_disabled':
      return 'decision review locked / persistence disabled'
    default:
      return 'unknown'
  }
}

export function getConsentDecisionReviewLockPreviewStatusColor(
  status: ConsentDecisionReviewLockPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_consent_decision_state_preview':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
    case 'blocked_consent_decision_state_preview_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'consent_decision_review_locked_persistence_disabled':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70', border: 'border-violet-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
  }
}

export function getConsentDecisionReviewLockItemStatusLabel(
  status: ConsentDecisionReviewLockItemStatus
): string {
  switch (status) {
    case 'source_decision_state_preview_verified':
      return 'source verified'
    case 'review_required_but_not_performed':
      return 'review required'
    case 'grant_review_path_locked':
      return 'grant review locked'
    case 'deny_review_path_locked':
      return 'deny review locked'
    case 'undecided_review_path_locked':
      return 'undecided review locked'
    case 'fallthrough_review_authorization_blocked':
      return 'fallthrough blocked'
    case 'authorization_path_locked':
      return 'authorization locked'
    case 'permission_path_locked':
      return 'permission locked'
    case 'persistence_path_disabled':
      return 'persistence disabled'
    case 'receipt_path_disabled':
      return 'receipt disabled'
    case 'program_runtime_mutation_disabled':
      return 'runtime mutation disabled'
    case 'completed_sessions_protected':
      return 'completed protected'
    default:
      return 'unknown'
  }
}

export function getConsentDecisionReviewLockItemStatusColor(
  status: ConsentDecisionReviewLockItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_decision_state_preview_verified':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70' }
    case 'review_required_but_not_performed':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'grant_review_path_locked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'deny_review_path_locked':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70' }
    case 'undecided_review_path_locked':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400/70' }
    case 'fallthrough_review_authorization_blocked':
      return { bg: 'bg-red-500/10', text: 'text-red-400/70' }
    case 'authorization_path_locked':
      return { bg: 'bg-pink-500/10', text: 'text-pink-400/70' }
    case 'permission_path_locked':
      return { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400/70' }
    case 'persistence_path_disabled':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
    case 'receipt_path_disabled':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400/70' }
    case 'program_runtime_mutation_disabled':
      return { bg: 'bg-neutral-500/10', text: 'text-neutral-400/70' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
  }
}
