/**
 * Consent Authorization Lock Preview
 * MASTER-8C.58 / AB20.4.51 - Prompt 53 of 77
 *
 * Pure read-only consent authorization lock preview helper.
 * Consumes ExplicitPersistenceActivationConsentPreviewModel.
 * Locks future consent authorization boundary while still:
 * - Capturing no consent
 * - Capturing no user intent
 * - Requesting no activation
 * - Reviewing no authorization
 * - Granting no authorization
 * - Denying no authorization
 * - Granting no permission
 * - Denying no permission
 * - Allowing no real activation
 * - Enabling no persistence
 * - Enabling no write
 * - Writing no receipt
 * - Calling no API
 * - Using no DB
 * - Using no storage
 * - Touching no schema
 * - Changing no Program Cards
 * - Changing no Start Workout
 * - Changing no Live Workout
 * - Mutating no future sessions
 * - Protecting completed sessions
 *
 * NO React. NO API. NO DB. NO storage. NO Date.now. NO Math.random.
 */

import type {
  ExplicitPersistenceActivationConsentPreviewModel,
} from './explicit-persistence-activation-consent-preview'

// ─────────────────────────────────────────────────────────────────────────────
// Status Union
// ─────────────────────────────────────────────────────────────────────────────

export type ConsentAuthorizationLockPreviewStatus =
  | 'unavailable_missing_consent_preview'
  | 'blocked_consent_preview_not_ready'
  | 'consent_authorization_locked_persistence_disabled'

// ─────────────────────────────────────────────────────────────────────────────
// Mode Union
// ─────────────────────────────────────────────────────────────────────────────

export type ConsentAuthorizationLockPreviewMode =
  | 'read_only_consent_authorization_lock'
  | 'not_ready'

// ─────────────────────────────────────────────────────────────────────────────
// Lock Item Status
// ─────────────────────────────────────────────────────────────────────────────

export type ConsentAuthorizationLockItemStatus =
  | 'source_consent_preview_verified'
  | 'authorization_locked_until_real_consent'
  | 'consent_capture_still_missing'
  | 'authorization_review_still_missing'
  | 'grant_path_locked'
  | 'deny_path_locked'
  | 'permission_path_locked'
  | 'activation_path_locked'
  | 'persistence_path_locked'
  | 'receipt_path_locked'
  | 'program_runtime_mutation_locked'
  | 'completed_sessions_protected'

// ─────────────────────────────────────────────────────────────────────────────
// Lock Item
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsentAuthorizationLockItem {
  readonly key: string
  readonly label: string
  readonly status: ConsentAuthorizationLockItemStatus
  readonly lockedNow: boolean
  readonly verifiedForPreview: boolean
  readonly requiredBeforeRealAuthorization: boolean
  readonly blocksAuthorizationNow: boolean
  readonly blocksPersistenceNow: boolean
  readonly reason: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsentAuthorizationLockPreviewPayload {
  readonly previewKind: 'consent_authorization_lock_preview'
  readonly sourceStep: 'MASTER-8C.58_AB20.4.51'
  readonly sourceConsentPreviewStatus: string
  readonly currentMode: 'consent_authorization_lock_only_persistence_disabled'

  readonly consentPreviewVerified: boolean
  readonly consentAuthorizationLockReady: boolean

  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
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

  readonly futureConsentAuthorizationMustRequireRealConsent: true
  readonly futureConsentAuthorizationMustHaveGrantPath: true
  readonly futureConsentAuthorizationMustHaveDenyPath: true
  readonly futureConsentAuthorizationMustPreventFallthrough: true
  readonly futureConsentAuthorizationMustPreserveCompletedSessions: true
  readonly futureConsentAuthorizationMustNotMutateProgramCardsInThisStep: true
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsentAuthorizationLockPreviewSummary {
  readonly totalLockItems: number
  readonly sourceConsentPreviewVerifiedItems: number
  readonly authorizationLockedItems: number
  readonly missingConsentCaptureItems: number
  readonly missingAuthorizationReviewItems: number
  readonly grantPathLockedItems: number
  readonly denyPathLockedItems: number
  readonly permissionPathLockedItems: number
  readonly activationPathLockedItems: number
  readonly persistencePathLockedItems: number
  readonly receiptPathLockedItems: number
  readonly programRuntimeMutationLockedItems: number
  readonly completedSessionsProtectedItems: number

  readonly readyForFutureConsentDecisionStatePreview: boolean
  readonly explicitUserConsentCapturedNow: false
  readonly explicitUserIntentCapturedNow: false
  readonly explicitActivationRequestedNow: false
  readonly authorizationReviewedNow: false
  readonly authorizationGrantedNow: false
  readonly authorizationDeniedNow: false
  readonly permissionGrantedNow: false
  readonly permissionDeniedNow: false
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsentAuthorizationLockPreviewModel {
  readonly status: ConsentAuthorizationLockPreviewStatus
  readonly mode: ConsentAuthorizationLockPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceConsentPreviewStatus: string
  readonly sourceConsentPreviewReady: boolean
  readonly sourceReadyForFutureConsentAuthorizationLock: boolean
  readonly sourceExplicitUserConsentCaptured: false
  readonly sourceExplicitUserIntentCaptured: false
  readonly sourceExplicitActivationRequested: false
  readonly sourceAuthorizationReviewed: false
  readonly sourceAuthorizationGranted: false
  readonly sourceAuthorizationDenied: false
  readonly sourcePermissionGranted: false
  readonly sourcePermissionDenied: false
  readonly sourceRealActivationAllowed: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ConsentAuthorizationLockPreviewPayload | null
  readonly lockItems: readonly ConsentAuthorizationLockItem[]
  readonly lockSummary: ConsentAuthorizationLockPreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly consentPreviewVerified: boolean
  readonly consentAuthorizationLockReady: boolean
  readonly readyForFutureConsentDecisionStatePreview: boolean

  readonly canShowConsentAuthorizationLock: boolean
  readonly canDisplayAuthorizationLockItems: boolean
  readonly canCaptureExplicitUserConsentNow: false
  readonly canCaptureExplicitUserIntentNow: false
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

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsentAuthorizationLockPreviewInput {
  readonly explicitPersistenceActivationConsentPreviewModel:
    | ExplicitPersistenceActivationConsentPreviewModel
    | null
    | undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Summary
// ─────────────────────────────────────────────────────────────────────────────

function createDefaultSummary(
  readyForFutureConsentDecisionStatePreview: boolean
): ConsentAuthorizationLockPreviewSummary {
  return {
    totalLockItems: 0,
    sourceConsentPreviewVerifiedItems: 0,
    authorizationLockedItems: 0,
    missingConsentCaptureItems: 0,
    missingAuthorizationReviewItems: 0,
    grantPathLockedItems: 0,
    denyPathLockedItems: 0,
    permissionPathLockedItems: 0,
    activationPathLockedItems: 0,
    persistencePathLockedItems: 0,
    receiptPathLockedItems: 0,
    programRuntimeMutationLockedItems: 0,
    completedSessionsProtectedItems: 0,

    readyForFutureConsentDecisionStatePreview,
    explicitUserConsentCapturedNow: false,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
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

// ─────────────────────────────────────────────────────────────────────────────
// Resolver
// ─────────────────────────────────────────────────────────────────────────────

export function resolveConsentAuthorizationLockPreview(
  input: ConsentAuthorizationLockPreviewInput
): ConsentAuthorizationLockPreviewModel {
  const { explicitPersistenceActivationConsentPreviewModel } = input

  // ─── Case 1: No consent preview model ───────────────────────────────────────
  if (!explicitPersistenceActivationConsentPreviewModel) {
    return {
      status: 'unavailable_missing_consent_preview',
      mode: 'not_ready',
      headline: 'Consent Authorization Lock Unavailable',
      summary:
        'The explicit persistence activation consent preview model is not available, so the consent authorization lock cannot be prepared.',

      sourceConsentPreviewStatus: 'missing',
      sourceConsentPreviewReady: false,
      sourceReadyForFutureConsentAuthorizationLock: false,
      sourceExplicitUserConsentCaptured: false,
      sourceExplicitUserIntentCaptured: false,
      sourceExplicitActivationRequested: false,
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
      lockItems: [],
      lockSummary: createDefaultSummary(false),
      blockerSummary: [
        'Explicit persistence activation consent preview model is missing.',
      ],
      nextRequiredStep:
        'Provide the explicit persistence activation consent preview model first.',

      consentPreviewVerified: false,
      consentAuthorizationLockReady: false,
      readyForFutureConsentDecisionStatePreview: false,

      canShowConsentAuthorizationLock: false,
      canDisplayAuthorizationLockItems: false,
      canCaptureExplicitUserConsentNow: false,
      canCaptureExplicitUserIntentNow: false,
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

  const sourceStatus = explicitPersistenceActivationConsentPreviewModel.status
  const sourceReady =
    sourceStatus === 'consent_preview_ready_persistence_disabled'

  // ─── Case 2: Consent preview not ready ──────────────────────────────────────
  if (!sourceReady) {
    return {
      status: 'blocked_consent_preview_not_ready',
      mode: 'not_ready',
      headline: 'Consent Authorization Lock Blocked',
      summary: `The explicit persistence activation consent preview is not ready (status: ${sourceStatus}). The consent authorization lock cannot proceed until the consent preview is ready.`,

      sourceConsentPreviewStatus: sourceStatus,
      sourceConsentPreviewReady: false,
      sourceReadyForFutureConsentAuthorizationLock: false,
      sourceExplicitUserConsentCaptured: false,
      sourceExplicitUserIntentCaptured: false,
      sourceExplicitActivationRequested: false,
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
      lockItems: [],
      lockSummary: createDefaultSummary(false),
      blockerSummary: [
        `Consent preview status is "${sourceStatus}", not "consent_preview_ready_persistence_disabled".`,
        'The consent authorization lock requires the consent preview to be ready first.',
      ],
      nextRequiredStep:
        'Ensure the explicit persistence activation consent preview is ready.',

      consentPreviewVerified: false,
      consentAuthorizationLockReady: false,
      readyForFutureConsentDecisionStatePreview: false,

      canShowConsentAuthorizationLock: false,
      canDisplayAuthorizationLockItems: false,
      canCaptureExplicitUserConsentNow: false,
      canCaptureExplicitUserIntentNow: false,
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

  // ─── Case 3: Consent preview ready - lock authorization ─────────────────────
  const lockItems: ConsentAuthorizationLockItem[] = [
    {
      key: 'source_consent_preview_verified',
      label: 'Source consent preview verified',
      status: 'source_consent_preview_verified',
      lockedNow: false,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      reason:
        'The explicit persistence activation consent preview is ready while persistence remains disabled.',
    },
    {
      key: 'authorization_locked_until_real_consent',
      label: 'Authorization locked until real consent exists',
      status: 'authorization_locked_until_real_consent',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'Authorization cannot be reviewed, granted, or denied until a future real explicit consent capture exists.',
    },
    {
      key: 'consent_capture_still_missing',
      label: 'Consent capture still missing',
      status: 'consent_capture_still_missing',
      lockedNow: true,
      verifiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'This step does not capture consent and therefore cannot authorize persistence.',
    },
    {
      key: 'authorization_review_still_missing',
      label: 'Authorization review still missing',
      status: 'authorization_review_still_missing',
      lockedNow: true,
      verifiedForPreview: false,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'No future consent authorization review has occurred in this read-only step.',
    },
    {
      key: 'grant_path_locked',
      label: 'Grant path locked',
      status: 'grant_path_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'A future grant path must be explicitly implemented and cannot be assumed from consent preview readiness.',
    },
    {
      key: 'deny_path_locked',
      label: 'Deny path locked',
      status: 'deny_path_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'A future denial path must be explicit and must block persistence fallthrough.',
    },
    {
      key: 'permission_path_locked',
      label: 'Permission path locked',
      status: 'permission_path_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'Consent authorization lock cannot grant permission in this step.',
    },
    {
      key: 'activation_path_locked',
      label: 'Activation path locked',
      status: 'activation_path_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'Consent authorization lock cannot activate persistence or real marker save behavior.',
    },
    {
      key: 'persistence_path_locked',
      label: 'Persistence path locked',
      status: 'persistence_path_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'Persistence/write/API/DB/storage remain disabled and unreachable.',
    },
    {
      key: 'receipt_path_locked',
      label: 'Receipt path locked',
      status: 'receipt_path_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      reason:
        'No durable receipt can be written during consent authorization lock preview.',
    },
    {
      key: 'program_runtime_mutation_locked',
      label: 'Program and workout mutation locked',
      status: 'program_runtime_mutation_locked',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: false,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      reason:
        'Program Cards, Start Workout, Live Workout, and future sessions remain unchanged.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'completed_sessions_protected',
      lockedNow: true,
      verifiedForPreview: true,
      requiredBeforeRealAuthorization: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      reason:
        'Consent authorization lock preview cannot rewrite completed sessions or logged history.',
    },
  ]

  const lockSummary: ConsentAuthorizationLockPreviewSummary = {
    totalLockItems: lockItems.length,
    sourceConsentPreviewVerifiedItems: lockItems.filter(
      (i) => i.status === 'source_consent_preview_verified'
    ).length,
    authorizationLockedItems: lockItems.filter(
      (i) => i.status === 'authorization_locked_until_real_consent'
    ).length,
    missingConsentCaptureItems: lockItems.filter(
      (i) => i.status === 'consent_capture_still_missing'
    ).length,
    missingAuthorizationReviewItems: lockItems.filter(
      (i) => i.status === 'authorization_review_still_missing'
    ).length,
    grantPathLockedItems: lockItems.filter(
      (i) => i.status === 'grant_path_locked'
    ).length,
    denyPathLockedItems: lockItems.filter(
      (i) => i.status === 'deny_path_locked'
    ).length,
    permissionPathLockedItems: lockItems.filter(
      (i) => i.status === 'permission_path_locked'
    ).length,
    activationPathLockedItems: lockItems.filter(
      (i) => i.status === 'activation_path_locked'
    ).length,
    persistencePathLockedItems: lockItems.filter(
      (i) => i.status === 'persistence_path_locked'
    ).length,
    receiptPathLockedItems: lockItems.filter(
      (i) => i.status === 'receipt_path_locked'
    ).length,
    programRuntimeMutationLockedItems: lockItems.filter(
      (i) => i.status === 'program_runtime_mutation_locked'
    ).length,
    completedSessionsProtectedItems: lockItems.filter(
      (i) => i.status === 'completed_sessions_protected'
    ).length,

    readyForFutureConsentDecisionStatePreview: true,
    explicitUserConsentCapturedNow: false,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    authorizationReviewedNow: false,
    authorizationGrantedNow: false,
    authorizationDeniedNow: false,
    permissionGrantedNow: false,
    permissionDeniedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }

  const previewPayload: ConsentAuthorizationLockPreviewPayload = {
    previewKind: 'consent_authorization_lock_preview',
    sourceStep: 'MASTER-8C.58_AB20.4.51',
    sourceConsentPreviewStatus: sourceStatus,
    currentMode: 'consent_authorization_lock_only_persistence_disabled',

    consentPreviewVerified: true,
    consentAuthorizationLockReady: true,

    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
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

    futureConsentAuthorizationMustRequireRealConsent: true,
    futureConsentAuthorizationMustHaveGrantPath: true,
    futureConsentAuthorizationMustHaveDenyPath: true,
    futureConsentAuthorizationMustPreventFallthrough: true,
    futureConsentAuthorizationMustPreserveCompletedSessions: true,
    futureConsentAuthorizationMustNotMutateProgramCardsInThisStep: true,
  }

  return {
    status: 'consent_authorization_locked_persistence_disabled',
    mode: 'read_only_consent_authorization_lock',
    headline: 'Consent Authorization Lock Ready',
    summary:
      'The explicit consent preview is verified, so the system can lock the future consent authorization boundary. No consent has been captured, no user intent has been captured, no activation has been requested, no authorization has been reviewed/granted/denied, no permission has been granted/denied, and persistence/write/receipt/API/DB/storage/schema/program/workout mutation remain disabled.',

    sourceConsentPreviewStatus: sourceStatus,
    sourceConsentPreviewReady: true,
    sourceReadyForFutureConsentAuthorizationLock:
      explicitPersistenceActivationConsentPreviewModel.readyForFutureConsentAuthorizationLock,
    sourceExplicitUserConsentCaptured: false,
    sourceExplicitUserIntentCaptured: false,
    sourceExplicitActivationRequested: false,
    sourceAuthorizationReviewed: false,
    sourceAuthorizationGranted: false,
    sourceAuthorizationDenied: false,
    sourcePermissionGranted: false,
    sourcePermissionDenied: false,
    sourceRealActivationAllowed: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload,
    lockItems,
    lockSummary,
    blockerSummary: [],
    nextRequiredStep:
      'Next gate should preview explicit consent decision state while persistence remains disabled.',

    consentPreviewVerified: true,
    consentAuthorizationLockReady: true,
    readyForFutureConsentDecisionStatePreview: true,

    canShowConsentAuthorizationLock: true,
    canDisplayAuthorizationLockItems: true,
    canCaptureExplicitUserConsentNow: false,
    canCaptureExplicitUserIntentNow: false,
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

// ─────────────────────────────────────────────────────────────────────────────
// Status Label Helper
// ─────────────────────────────────────────────────────────────────────────────

export function getConsentAuthorizationLockPreviewStatusLabel(
  status: ConsentAuthorizationLockPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_consent_preview':
      return 'consent preview missing'
    case 'blocked_consent_preview_not_ready':
      return 'consent preview blocked'
    case 'consent_authorization_locked_persistence_disabled':
      return 'consent authorization locked / persistence disabled'
    default:
      return 'unknown'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Color Helper
// ─────────────────────────────────────────────────────────────────────────────

export function getConsentAuthorizationLockPreviewStatusColor(
  status: ConsentAuthorizationLockPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_consent_preview':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_consent_preview_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'consent_authorization_locked_persistence_disabled':
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

// ─────────────────────────────────────────────────────────────────────────────
// Lock Item Status Label Helper
// ─────────────────────────────────────────────────────────────────────────────

export function getConsentAuthorizationLockItemStatusLabel(
  status: ConsentAuthorizationLockItemStatus
): string {
  switch (status) {
    case 'source_consent_preview_verified':
      return 'consent preview verified'
    case 'authorization_locked_until_real_consent':
      return 'authorization locked'
    case 'consent_capture_still_missing':
      return 'consent missing'
    case 'authorization_review_still_missing':
      return 'review missing'
    case 'grant_path_locked':
      return 'grant path locked'
    case 'deny_path_locked':
      return 'deny path locked'
    case 'permission_path_locked':
      return 'permission locked'
    case 'activation_path_locked':
      return 'activation locked'
    case 'persistence_path_locked':
      return 'persistence locked'
    case 'receipt_path_locked':
      return 'receipt locked'
    case 'program_runtime_mutation_locked':
      return 'runtime locked'
    case 'completed_sessions_protected':
      return 'completed protected'
    default:
      return 'unknown'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lock Item Status Color Helper
// ─────────────────────────────────────────────────────────────────────────────

export function getConsentAuthorizationLockItemStatusColor(
  status: ConsentAuthorizationLockItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_consent_preview_verified':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70' }
    case 'authorization_locked_until_real_consent':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'consent_capture_still_missing':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'authorization_review_still_missing':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70' }
    case 'grant_path_locked':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70' }
    case 'deny_path_locked':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70' }
    case 'permission_path_locked':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400/70' }
    case 'activation_path_locked':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400/70' }
    case 'persistence_path_locked':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
    case 'receipt_path_locked':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400/70' }
    case 'program_runtime_mutation_locked':
      return { bg: 'bg-neutral-500/10', text: 'text-neutral-400/70' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
  }
}
