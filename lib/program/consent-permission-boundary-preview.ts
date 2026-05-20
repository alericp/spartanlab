/**
 * Consent Permission Boundary Preview
 * ====================================
 * MASTER-8C.61 / AB20.4.54 — Prompt 56 of 77
 * 
 * Pure read-only consent permission boundary preview.
 * Consumes ConsentDecisionReviewLockPreviewModel and proves that
 * consent permission is still not granted after the review-lock stage.
 * 
 * SAFETY INVARIANTS:
 * - Pure/read-only only
 * - No localStorage/sessionStorage
 * - No fetch/API/DB/storage calls
 * - No Date.now/Math.random
 * - No window/document
 * - No schema changes
 * - No mutation
 * - No broad any
 * - No TypeScript suppressions
 * - No Program Cards changed
 * - No Start Workout changed
 * - No Live Workout changed
 * - Completed sessions protected: true
 */

import type {
  ConsentDecisionReviewLockPreviewModel,
} from './consent-decision-review-lock-preview'

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------

export type ConsentPermissionBoundaryPreviewStatus =
  | 'unavailable_missing_consent_decision_review_lock'
  | 'blocked_consent_decision_review_lock_not_ready'
  | 'consent_permission_boundary_ready_persistence_disabled'

export type ConsentPermissionBoundaryPreviewMode =
  | 'read_only_consent_permission_boundary_preview'
  | 'not_ready'

export type ConsentPermissionBoundaryState =
  | 'permission_not_granted'

export type ConsentPermissionBoundaryItemStatus =
  | 'source_review_lock_verified'
  | 'permission_required_but_not_granted'
  | 'permission_grant_path_locked'
  | 'permission_deny_path_locked'
  | 'undecided_permission_path_locked'
  | 'authorization_still_blocked'
  | 'persistence_path_disabled'
  | 'write_path_disabled'
  | 'receipt_path_disabled'
  | 'program_runtime_mutation_disabled'
  | 'completed_sessions_protected'

// -----------------------------------------------------------------------------
// Permission Boundary Item
// -----------------------------------------------------------------------------

export interface ConsentPermissionBoundaryItem {
  readonly key: string
  readonly label: string
  readonly status: ConsentPermissionBoundaryItemStatus
  readonly sourceVerified: boolean
  readonly permissionRequired: boolean
  readonly permissionGrantedNow: false
  readonly lockedNow: boolean
  readonly blocksAuthorizationNow: boolean
  readonly blocksPersistenceNow: boolean
  readonly protectsCompletedSessions: boolean
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Preview Payload
// -----------------------------------------------------------------------------

export interface ConsentPermissionBoundaryPreviewPayload {
  readonly previewKind: 'consent_permission_boundary_preview'
  readonly sourceStep: 'MASTER-8C.61_AB20.4.54'
  readonly sourceConsentDecisionReviewLockStatus: string
  readonly currentMode: 'consent_permission_boundary_only_persistence_disabled'

  readonly consentDecisionReviewLockVerified: boolean
  readonly consentPermissionBoundaryReady: boolean
  readonly currentPermissionState: ConsentPermissionBoundaryState

  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentDecisionUndecided: true
  readonly consentDecisionReviewPerformed: false
  readonly permissionGranted: false
  readonly permissionDenied: false
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false

  readonly futurePermissionMustRequireExplicitReviewedDecision: true
  readonly futurePermissionMustNotInferFromReadiness: true
  readonly futurePermissionMustPreserveCompletedSessions: true
  readonly futurePermissionMustNotMutateProgramCardsInThisStep: true
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------

export interface ConsentPermissionBoundarySummary {
  readonly totalItems: number
  readonly sourceVerifiedItems: number
  readonly permissionRequiredNotGrantedItems: number
  readonly permissionGrantPathLockedItems: number
  readonly permissionDenyPathLockedItems: number
  readonly undecidedPermissionPathLockedItems: number
  readonly authorizationBlockedItems: number
  readonly persistenceDisabledItems: number
  readonly writeDisabledItems: number
  readonly receiptDisabledItems: number
  readonly programRuntimeMutationDisabledItems: number
  readonly completedSessionsProtectedItems: number

  readonly readyForFuturePersistencePermissionReview: boolean
  readonly consentDecisionReviewLockVerifiedNow: boolean
  readonly permissionGrantedNow: false
  readonly permissionDeniedNow: false
  readonly explicitUserConsentCapturedNow: false
  readonly explicitUserIntentCapturedNow: false
  readonly explicitActivationRequestedNow: false
  readonly consentDecisionCollectedNow: false
  readonly consentDecisionReviewPerformedNow: false
  readonly authorizationReviewedNow: false
  readonly authorizationGrantedNow: false
  readonly authorizationDeniedNow: false
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// -----------------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------------

export interface ConsentPermissionBoundaryPreviewModel {
  readonly status: ConsentPermissionBoundaryPreviewStatus
  readonly mode: ConsentPermissionBoundaryPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceConsentDecisionReviewLockStatus: string
  readonly sourceConsentDecisionReviewLockReady: boolean
  readonly sourceReadyForFutureConsentPermissionBoundary: boolean

  readonly sourceExplicitUserConsentCaptured: false
  readonly sourceExplicitUserIntentCaptured: false
  readonly sourceExplicitActivationRequested: false
  readonly sourceConsentDecisionCollected: false
  readonly sourceConsentDecisionGranted: false
  readonly sourceConsentDecisionDenied: false
  readonly sourceConsentDecisionUndecided: true
  readonly sourceConsentDecisionReviewPerformed: false
  readonly sourceAuthorizationReviewed: false
  readonly sourceAuthorizationGranted: false
  readonly sourceAuthorizationDenied: false
  readonly sourcePermissionGranted: false
  readonly sourcePermissionDenied: false
  readonly sourceRealActivationAllowed: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ConsentPermissionBoundaryPreviewPayload | null
  readonly permissionBoundaryItems: readonly ConsentPermissionBoundaryItem[]
  readonly permissionBoundarySummary: ConsentPermissionBoundarySummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly consentDecisionReviewLockVerified: boolean
  readonly consentPermissionBoundaryReady: boolean
  readonly readyForFuturePersistencePermissionReview: boolean

  readonly currentPermissionState: ConsentPermissionBoundaryState

  readonly canShowConsentPermissionBoundary: boolean
  readonly canDisplayPermissionBoundaryItems: boolean

  readonly canCaptureExplicitUserConsentNow: false
  readonly canCaptureExplicitUserIntentNow: false
  readonly canCollectConsentDecisionNow: false
  readonly canPerformConsentDecisionReviewNow: false
  readonly canGrantPermissionNow: false
  readonly canDenyPermissionNow: false
  readonly canRequestExplicitPersistenceActivationNow: false
  readonly canReviewAuthorizationNow: false
  readonly canGrantAuthorizationNow: false
  readonly canDenyAuthorizationNow: false
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
  readonly permissionGranted: false
  readonly permissionDenied: false
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
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

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ConsentPermissionBoundaryPreviewInput {
  readonly consentDecisionReviewLockPreviewModel:
    | ConsentDecisionReviewLockPreviewModel
    | null
    | undefined
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

function buildPermissionBoundaryItems(
  sourceVerified: boolean
): ConsentPermissionBoundaryItem[] {
  if (!sourceVerified) {
    return []
  }

  return [
    {
      key: 'source_review_lock_verified',
      label: 'Source review lock verified',
      status: 'source_review_lock_verified',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Consent decision review lock is ready, but permission has not been granted.',
    },
    {
      key: 'permission_required_but_not_granted',
      label: 'Permission required but not granted',
      status: 'permission_required_but_not_granted',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'A future permission grant must pass explicit reviewed decision, not infer from readiness.',
    },
    {
      key: 'permission_grant_path_locked',
      label: 'Permission grant path locked',
      status: 'permission_grant_path_locked',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'A future permission grant cannot occur until a reviewed consent decision explicitly enables it.',
    },
    {
      key: 'permission_deny_path_locked',
      label: 'Permission deny path locked',
      status: 'permission_deny_path_locked',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'A future permission denial must remain a hard block and cannot fall through to any enabled state.',
    },
    {
      key: 'undecided_permission_path_locked',
      label: 'Undecided permission path locked',
      status: 'undecided_permission_path_locked',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Undecided or missing consent decision state must block all permission paths.',
    },
    {
      key: 'authorization_still_blocked',
      label: 'Authorization still blocked',
      status: 'authorization_still_blocked',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: true,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Authorization review/grant/deny remain unavailable in this read-only step.',
    },
    {
      key: 'persistence_path_disabled',
      label: 'Persistence path disabled',
      status: 'persistence_path_disabled',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Persistence/API/DB/storage remain disabled in this step.',
    },
    {
      key: 'write_path_disabled',
      label: 'Write path disabled',
      status: 'write_path_disabled',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'No write/mutation can occur while permission boundary is only previewed.',
    },
    {
      key: 'receipt_path_disabled',
      label: 'Receipt path disabled',
      status: 'receipt_path_disabled',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'No durable receipt can be written while permission boundary is only previewed.',
    },
    {
      key: 'program_runtime_mutation_disabled',
      label: 'Program and workout mutation disabled',
      status: 'program_runtime_mutation_disabled',
      sourceVerified: true,
      permissionRequired: false,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain unchanged.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'completed_sessions_protected',
      sourceVerified: true,
      permissionRequired: true,
      permissionGrantedNow: false,
      lockedNow: true,
      blocksAuthorizationNow: false,
      blocksPersistenceNow: true,
      protectsCompletedSessions: true,
      reason: 'Consent permission boundary cannot rewrite completed sessions or logged history.',
    },
  ]
}

function buildSummary(
  items: readonly ConsentPermissionBoundaryItem[],
  reviewLockVerified: boolean
): ConsentPermissionBoundarySummary {
  return {
    totalItems: items.length,
    sourceVerifiedItems: items.filter(i => i.status === 'source_review_lock_verified').length,
    permissionRequiredNotGrantedItems: items.filter(i => i.status === 'permission_required_but_not_granted').length,
    permissionGrantPathLockedItems: items.filter(i => i.status === 'permission_grant_path_locked').length,
    permissionDenyPathLockedItems: items.filter(i => i.status === 'permission_deny_path_locked').length,
    undecidedPermissionPathLockedItems: items.filter(i => i.status === 'undecided_permission_path_locked').length,
    authorizationBlockedItems: items.filter(i => i.status === 'authorization_still_blocked').length,
    persistenceDisabledItems: items.filter(i => i.status === 'persistence_path_disabled').length,
    writeDisabledItems: items.filter(i => i.status === 'write_path_disabled').length,
    receiptDisabledItems: items.filter(i => i.status === 'receipt_path_disabled').length,
    programRuntimeMutationDisabledItems: items.filter(i => i.status === 'program_runtime_mutation_disabled').length,
    completedSessionsProtectedItems: items.filter(i => i.status === 'completed_sessions_protected').length,

    readyForFuturePersistencePermissionReview: reviewLockVerified,
    consentDecisionReviewLockVerifiedNow: reviewLockVerified,
    permissionGrantedNow: false,
    permissionDeniedNow: false,
    explicitUserConsentCapturedNow: false,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    consentDecisionCollectedNow: false,
    consentDecisionReviewPerformedNow: false,
    authorizationReviewedNow: false,
    authorizationGrantedNow: false,
    authorizationDeniedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }
}

export function resolveConsentPermissionBoundaryPreview(
  input: ConsentPermissionBoundaryPreviewInput
): ConsentPermissionBoundaryPreviewModel {
  const { consentDecisionReviewLockPreviewModel } = input

  // Case 1: Missing consent decision review lock preview model
  if (!consentDecisionReviewLockPreviewModel) {
    const items: ConsentPermissionBoundaryItem[] = []
    return {
      status: 'unavailable_missing_consent_decision_review_lock',
      mode: 'not_ready',
      headline: 'Consent Permission Boundary Unavailable',
      summary: 'Cannot evaluate consent permission boundary because consent decision review lock preview is not available.',

      sourceConsentDecisionReviewLockStatus: 'missing',
      sourceConsentDecisionReviewLockReady: false,
      sourceReadyForFutureConsentPermissionBoundary: false,

      sourceExplicitUserConsentCaptured: false,
      sourceExplicitUserIntentCaptured: false,
      sourceExplicitActivationRequested: false,
      sourceConsentDecisionCollected: false,
      sourceConsentDecisionGranted: false,
      sourceConsentDecisionDenied: false,
      sourceConsentDecisionUndecided: true,
      sourceConsentDecisionReviewPerformed: false,
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
      permissionBoundaryItems: items,
      permissionBoundarySummary: buildSummary(items, false),
      blockerSummary: ['Consent decision review lock preview model is missing.'],
      nextRequiredStep: 'Provide consent decision review lock preview model first.',

      consentDecisionReviewLockVerified: false,
      consentPermissionBoundaryReady: false,
      readyForFuturePersistencePermissionReview: false,

      currentPermissionState: 'permission_not_granted',

      canShowConsentPermissionBoundary: false,
      canDisplayPermissionBoundaryItems: false,

      canCaptureExplicitUserConsentNow: false,
      canCaptureExplicitUserIntentNow: false,
      canCollectConsentDecisionNow: false,
      canPerformConsentDecisionReviewNow: false,
      canGrantPermissionNow: false,
      canDenyPermissionNow: false,
      canRequestExplicitPersistenceActivationNow: false,
      canReviewAuthorizationNow: false,
      canGrantAuthorizationNow: false,
      canDenyAuthorizationNow: false,
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
      permissionGranted: false,
      permissionDenied: false,
      authorizationReviewed: false,
      authorizationGranted: false,
      authorizationDenied: false,
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

  const sourceStatus = consentDecisionReviewLockPreviewModel.status

  // Case 2: Source review lock not ready
  if (sourceStatus !== 'consent_decision_review_locked_persistence_disabled') {
    const items: ConsentPermissionBoundaryItem[] = []
    return {
      status: 'blocked_consent_decision_review_lock_not_ready',
      mode: 'not_ready',
      headline: 'Consent Permission Boundary Blocked',
      summary: `Cannot preview consent permission boundary because consent decision review lock is not ready. Current source status: ${sourceStatus}.`,

      sourceConsentDecisionReviewLockStatus: sourceStatus,
      sourceConsentDecisionReviewLockReady: false,
      sourceReadyForFutureConsentPermissionBoundary: false,

      sourceExplicitUserConsentCaptured: false,
      sourceExplicitUserIntentCaptured: false,
      sourceExplicitActivationRequested: false,
      sourceConsentDecisionCollected: false,
      sourceConsentDecisionGranted: false,
      sourceConsentDecisionDenied: false,
      sourceConsentDecisionUndecided: true,
      sourceConsentDecisionReviewPerformed: false,
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
      permissionBoundaryItems: items,
      permissionBoundarySummary: buildSummary(items, false),
      blockerSummary: [`Source consent decision review lock status is ${sourceStatus}, not consent_decision_review_locked_persistence_disabled.`],
      nextRequiredStep: 'Resolve consent decision review lock first.',

      consentDecisionReviewLockVerified: false,
      consentPermissionBoundaryReady: false,
      readyForFuturePersistencePermissionReview: false,

      currentPermissionState: 'permission_not_granted',

      canShowConsentPermissionBoundary: false,
      canDisplayPermissionBoundaryItems: false,

      canCaptureExplicitUserConsentNow: false,
      canCaptureExplicitUserIntentNow: false,
      canCollectConsentDecisionNow: false,
      canPerformConsentDecisionReviewNow: false,
      canGrantPermissionNow: false,
      canDenyPermissionNow: false,
      canRequestExplicitPersistenceActivationNow: false,
      canReviewAuthorizationNow: false,
      canGrantAuthorizationNow: false,
      canDenyAuthorizationNow: false,
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
      permissionGranted: false,
      permissionDenied: false,
      authorizationReviewed: false,
      authorizationGranted: false,
      authorizationDenied: false,
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

  // Case 3: PASS - Source review lock is ready
  const items = buildPermissionBoundaryItems(true)
  const summary = buildSummary(items, true)

  const payload: ConsentPermissionBoundaryPreviewPayload = {
    previewKind: 'consent_permission_boundary_preview',
    sourceStep: 'MASTER-8C.61_AB20.4.54',
    sourceConsentDecisionReviewLockStatus: sourceStatus,
    currentMode: 'consent_permission_boundary_only_persistence_disabled',

    consentDecisionReviewLockVerified: true,
    consentPermissionBoundaryReady: true,
    currentPermissionState: 'permission_not_granted',

    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionUndecided: true,
    consentDecisionReviewPerformed: false,
    permissionGranted: false,
    permissionDenied: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,

    futurePermissionMustRequireExplicitReviewedDecision: true,
    futurePermissionMustNotInferFromReadiness: true,
    futurePermissionMustPreserveCompletedSessions: true,
    futurePermissionMustNotMutateProgramCardsInThisStep: true,
  }

  return {
    status: 'consent_permission_boundary_ready_persistence_disabled',
    mode: 'read_only_consent_permission_boundary_preview',
    headline: 'Consent Permission Boundary Ready',
    summary: 'Consent decision review lock is verified, but permission has not been granted or denied. Persistence, write, and mutation remain disabled. Any future real permission must require an explicit reviewed decision and cannot be inferred from prior readiness cards.',

    sourceConsentDecisionReviewLockStatus: sourceStatus,
    sourceConsentDecisionReviewLockReady: true,
    sourceReadyForFutureConsentPermissionBoundary: true,

    sourceExplicitUserConsentCaptured: false,
    sourceExplicitUserIntentCaptured: false,
    sourceExplicitActivationRequested: false,
    sourceConsentDecisionCollected: false,
    sourceConsentDecisionGranted: false,
    sourceConsentDecisionDenied: false,
    sourceConsentDecisionUndecided: true,
    sourceConsentDecisionReviewPerformed: false,
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
    permissionBoundaryItems: items,
    permissionBoundarySummary: summary,
    blockerSummary: [
      'Permission has not been granted.',
      'Any future real permission must require an explicit reviewed decision.',
      'Permission cannot be inferred from review-lock readiness alone.',
    ],
    nextRequiredStep: 'Next step is still read-only persistence permission review / persistence still disabled unless official checklist explicitly enables writes.',

    consentDecisionReviewLockVerified: true,
    consentPermissionBoundaryReady: true,
    readyForFuturePersistencePermissionReview: true,

    currentPermissionState: 'permission_not_granted',

    canShowConsentPermissionBoundary: true,
    canDisplayPermissionBoundaryItems: true,

    canCaptureExplicitUserConsentNow: false,
    canCaptureExplicitUserIntentNow: false,
    canCollectConsentDecisionNow: false,
    canPerformConsentDecisionReviewNow: false,
    canGrantPermissionNow: false,
    canDenyPermissionNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canReviewAuthorizationNow: false,
    canGrantAuthorizationNow: false,
    canDenyAuthorizationNow: false,
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
    permissionGranted: false,
    permissionDenied: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
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

// -----------------------------------------------------------------------------
// Label Helpers
// -----------------------------------------------------------------------------

export function getConsentPermissionBoundaryPreviewStatusLabel(
  status: ConsentPermissionBoundaryPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_consent_decision_review_lock':
      return 'review lock missing'
    case 'blocked_consent_decision_review_lock_not_ready':
      return 'review lock blocked'
    case 'consent_permission_boundary_ready_persistence_disabled':
      return 'permission boundary ready / persistence disabled'
  }
}

export function getConsentPermissionBoundaryPreviewStatusColor(
  status: ConsentPermissionBoundaryPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_consent_decision_review_lock':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
    case 'blocked_consent_decision_review_lock_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'consent_permission_boundary_ready_persistence_disabled':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70', border: 'border-indigo-500/20' }
  }
}

export function getConsentPermissionBoundaryItemStatusLabel(
  status: ConsentPermissionBoundaryItemStatus
): string {
  switch (status) {
    case 'source_review_lock_verified':
      return 'source verified'
    case 'permission_required_but_not_granted':
      return 'permission required'
    case 'permission_grant_path_locked':
      return 'grant locked'
    case 'permission_deny_path_locked':
      return 'deny locked'
    case 'undecided_permission_path_locked':
      return 'undecided locked'
    case 'authorization_still_blocked':
      return 'authorization blocked'
    case 'persistence_path_disabled':
      return 'persistence disabled'
    case 'write_path_disabled':
      return 'write disabled'
    case 'receipt_path_disabled':
      return 'receipt disabled'
    case 'program_runtime_mutation_disabled':
      return 'runtime disabled'
    case 'completed_sessions_protected':
      return 'completed protected'
  }
}

export function getConsentPermissionBoundaryItemStatusColor(
  status: ConsentPermissionBoundaryItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_review_lock_verified':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70' }
    case 'permission_required_but_not_granted':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'permission_grant_path_locked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'permission_deny_path_locked':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70' }
    case 'undecided_permission_path_locked':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400/70' }
    case 'authorization_still_blocked':
      return { bg: 'bg-pink-500/10', text: 'text-pink-400/70' }
    case 'persistence_path_disabled':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
    case 'write_path_disabled':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400/70' }
    case 'receipt_path_disabled':
      return { bg: 'bg-neutral-500/10', text: 'text-neutral-400/70' }
    case 'program_runtime_mutation_disabled':
      return { bg: 'bg-gray-500/10', text: 'text-gray-400/70' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70' }
  }
}
