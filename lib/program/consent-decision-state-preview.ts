/**
 * Consent Decision State Preview (MASTER-8C.59 / AB20.4.52)
 * 
 * Pure read-only consent decision-state preview helper.
 * Consumes ConsentAuthorizationLockPreviewModel to preview future consent decision states.
 * 
 * SAFETY INVARIANTS:
 * - This is a pure read-only preview - NO real consent decision is collected
 * - NO real grant, deny, or undecided action captured
 * - NO authorization review occurs
 * - NO authorization grant/deny occurs  
 * - NO permission grant/deny occurs
 * - NO persistence activation occurs
 * - NO write operations occur
 * - NO API/DB/storage/schema touched
 * - NO Program Cards / Start Workout / Live Workout changed
 * - Completed sessions remain protected
 */

import type {
  ConsentAuthorizationLockPreviewModel,
} from './consent-authorization-lock-preview'

// =============================================================================
// STATUS TYPES
// =============================================================================

export type ConsentDecisionStatePreviewStatus =
  | 'unavailable_missing_consent_authorization_lock'
  | 'blocked_consent_authorization_lock_not_ready'
  | 'consent_decision_state_preview_ready_persistence_disabled'

export type ConsentDecisionStatePreviewMode =
  | 'read_only_consent_decision_state_preview'
  | 'not_ready'

export type ConsentDecisionStatePreviewCurrentDecision =
  | 'no_decision_collected'

export type ConsentDecisionStatePreviewBranchStatus =
  | 'current_no_decision_blocks_persistence'
  | 'future_grant_path_locked'
  | 'future_deny_path_locked'
  | 'future_undecided_path_locked'
  | 'fallthrough_authorization_blocked'
  | 'persistence_path_disabled'
  | 'receipt_path_disabled'
  | 'program_runtime_mutation_disabled'
  | 'completed_sessions_protected'

// =============================================================================
// BRANCH INTERFACE
// =============================================================================

export interface ConsentDecisionStatePreviewBranch {
  readonly key: string
  readonly label: string
  readonly status: ConsentDecisionStatePreviewBranchStatus
  readonly currentDecision: boolean
  readonly futureDecisionPath: boolean
  readonly lockedNow: boolean
  readonly blocksPersistenceNow: boolean
  readonly blocksAuthorizationNow: boolean
  readonly requiresFutureExplicitConsent: boolean
  readonly requiresFutureAuthorizationReview: boolean
  readonly reason: string
}

// =============================================================================
// PAYLOAD INTERFACE
// =============================================================================

export interface ConsentDecisionStatePreviewPayload {
  readonly previewKind: 'consent_decision_state_preview'
  readonly sourceStep: 'MASTER-8C.59_AB20.4.52'
  readonly sourceConsentAuthorizationLockStatus: string
  readonly currentMode: 'consent_decision_state_preview_only_persistence_disabled'

  readonly consentAuthorizationLockVerified: boolean
  readonly consentDecisionStatePreviewReady: boolean
  readonly currentConsentDecision: ConsentDecisionStatePreviewCurrentDecision

  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentDecisionUndecided: true
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

  readonly futureDecisionMustRequireExplicitConsent: true
  readonly futureDecisionMustSeparateGrantAndDeny: true
  readonly futureDecisionMustBlockUndecidedState: true
  readonly futureDecisionMustPreventFallthroughAuthorization: true
  readonly futureDecisionMustPreserveCompletedSessions: true
  readonly futureDecisionMustNotMutateProgramCardsInThisStep: true
}

// =============================================================================
// SUMMARY INTERFACE
// =============================================================================

export interface ConsentDecisionStatePreviewSummary {
  readonly totalBranches: number
  readonly currentNoDecisionBlockingBranches: number
  readonly futureGrantPathLockedBranches: number
  readonly futureDenyPathLockedBranches: number
  readonly futureUndecidedPathLockedBranches: number
  readonly fallthroughBlockedBranches: number
  readonly persistenceDisabledBranches: number
  readonly receiptDisabledBranches: number
  readonly programRuntimeMutationDisabledBranches: number
  readonly completedSessionsProtectedBranches: number

  readonly readyForFutureConsentDecisionReviewLock: boolean
  readonly consentAuthorizationLockVerifiedNow: boolean
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

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface ConsentDecisionStatePreviewModel {
  readonly status: ConsentDecisionStatePreviewStatus
  readonly mode: ConsentDecisionStatePreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceConsentAuthorizationLockStatus: string
  readonly sourceConsentAuthorizationLockReady: boolean
  readonly sourceReadyForFutureConsentDecisionStatePreview: boolean

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

  readonly previewPayload: ConsentDecisionStatePreviewPayload | null
  readonly decisionBranches: readonly ConsentDecisionStatePreviewBranch[]
  readonly decisionSummary: ConsentDecisionStatePreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly consentAuthorizationLockVerified: boolean
  readonly consentDecisionStatePreviewReady: boolean
  readonly readyForFutureConsentDecisionReviewLock: boolean

  readonly currentConsentDecision: ConsentDecisionStatePreviewCurrentDecision

  readonly canShowConsentDecisionStatePreview: boolean
  readonly canDisplayDecisionBranches: boolean

  readonly canCaptureExplicitUserConsentNow: false
  readonly canCaptureExplicitUserIntentNow: false
  readonly canCollectConsentDecisionNow: false
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

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface ConsentDecisionStatePreviewInput {
  readonly consentAuthorizationLockPreviewModel:
    | ConsentAuthorizationLockPreviewModel
    | null
    | undefined
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getConsentDecisionStatePreviewStatusLabel(
  status: ConsentDecisionStatePreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_consent_authorization_lock':
      return 'consent auth lock missing'
    case 'blocked_consent_authorization_lock_not_ready':
      return 'consent auth lock blocked'
    case 'consent_decision_state_preview_ready_persistence_disabled':
      return 'consent decision preview ready / persistence disabled'
  }
}

export function getConsentDecisionStatePreviewStatusColor(
  status: ConsentDecisionStatePreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_consent_authorization_lock':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_consent_authorization_lock_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'consent_decision_state_preview_ready_persistence_disabled':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
  }
}

export function getConsentDecisionStatePreviewBranchStatusLabel(
  status: ConsentDecisionStatePreviewBranchStatus
): string {
  switch (status) {
    case 'current_no_decision_blocks_persistence':
      return 'no decision blocks persistence'
    case 'future_grant_path_locked':
      return 'grant path locked'
    case 'future_deny_path_locked':
      return 'deny path locked'
    case 'future_undecided_path_locked':
      return 'undecided locked'
    case 'fallthrough_authorization_blocked':
      return 'fallthrough blocked'
    case 'persistence_path_disabled':
      return 'persistence disabled'
    case 'receipt_path_disabled':
      return 'receipt disabled'
    case 'program_runtime_mutation_disabled':
      return 'runtime mutation disabled'
    case 'completed_sessions_protected':
      return 'completed protected'
  }
}

export function getConsentDecisionStatePreviewBranchStatusColor(
  status: ConsentDecisionStatePreviewBranchStatus
): { bg: string; text: string } {
  switch (status) {
    case 'current_no_decision_blocks_persistence':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'future_grant_path_locked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'future_deny_path_locked':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70' }
    case 'future_undecided_path_locked':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400/70' }
    case 'fallthrough_authorization_blocked':
      return { bg: 'bg-red-500/10', text: 'text-red-400/70' }
    case 'persistence_path_disabled':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
    case 'receipt_path_disabled':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400/70' }
    case 'program_runtime_mutation_disabled':
      return { bg: 'bg-neutral-500/10', text: 'text-neutral-400/70' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70' }
  }
}

// =============================================================================
// BRANCH BUILDERS
// =============================================================================

function buildPassBranches(): readonly ConsentDecisionStatePreviewBranch[] {
  return [
    {
      key: 'current_no_decision_blocks_persistence',
      label: 'Current no-decision state blocks persistence',
      status: 'current_no_decision_blocks_persistence',
      currentDecision: true,
      futureDecisionPath: false,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: true,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'No consent decision has been collected, so persistence cannot be authorized.',
    },
    {
      key: 'future_grant_path_locked',
      label: 'Future grant path locked',
      status: 'future_grant_path_locked',
      currentDecision: false,
      futureDecisionPath: true,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: true,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'A future grant path must require explicit consent capture and authorization review; this preview cannot grant anything.',
    },
    {
      key: 'future_deny_path_locked',
      label: 'Future deny path locked',
      status: 'future_deny_path_locked',
      currentDecision: false,
      futureDecisionPath: true,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: true,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'A future denial path must explicitly keep persistence blocked and cannot fall through to activation.',
    },
    {
      key: 'future_undecided_path_locked',
      label: 'Future undecided path locked',
      status: 'future_undecided_path_locked',
      currentDecision: false,
      futureDecisionPath: true,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: true,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'Missing or undecided consent must remain a hard block for persistence activation.',
    },
    {
      key: 'fallthrough_authorization_blocked',
      label: 'Fallthrough authorization blocked',
      status: 'fallthrough_authorization_blocked',
      currentDecision: false,
      futureDecisionPath: false,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: true,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'No default path may convert preview readiness into authorization, permission, or persistence.',
    },
    {
      key: 'persistence_path_disabled',
      label: 'Persistence path disabled',
      status: 'persistence_path_disabled',
      currentDecision: false,
      futureDecisionPath: false,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: false,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'Persistence/write/API/DB/storage remain disabled in this step.',
    },
    {
      key: 'receipt_path_disabled',
      label: 'Receipt path disabled',
      status: 'receipt_path_disabled',
      currentDecision: false,
      futureDecisionPath: false,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: false,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'No durable receipt can be written while consent decision state is only previewed.',
    },
    {
      key: 'program_runtime_mutation_disabled',
      label: 'Program and workout mutation disabled',
      status: 'program_runtime_mutation_disabled',
      currentDecision: false,
      futureDecisionPath: false,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: false,
      requiresFutureExplicitConsent: false,
      requiresFutureAuthorizationReview: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain unchanged.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'completed_sessions_protected',
      currentDecision: false,
      futureDecisionPath: false,
      lockedNow: true,
      blocksPersistenceNow: true,
      blocksAuthorizationNow: false,
      requiresFutureExplicitConsent: true,
      requiresFutureAuthorizationReview: true,
      reason: 'Consent decision preview cannot rewrite completed sessions or logged history.',
    },
  ]
}

function buildEmptyBranches(): readonly ConsentDecisionStatePreviewBranch[] {
  return []
}

// =============================================================================
// SUMMARY BUILDER
// =============================================================================

function buildSummary(
  branches: readonly ConsentDecisionStatePreviewBranch[],
  consentAuthorizationLockVerified: boolean,
  ready: boolean
): ConsentDecisionStatePreviewSummary {
  return {
    totalBranches: branches.length,
    currentNoDecisionBlockingBranches: branches.filter(
      (b) => b.status === 'current_no_decision_blocks_persistence'
    ).length,
    futureGrantPathLockedBranches: branches.filter(
      (b) => b.status === 'future_grant_path_locked'
    ).length,
    futureDenyPathLockedBranches: branches.filter(
      (b) => b.status === 'future_deny_path_locked'
    ).length,
    futureUndecidedPathLockedBranches: branches.filter(
      (b) => b.status === 'future_undecided_path_locked'
    ).length,
    fallthroughBlockedBranches: branches.filter(
      (b) => b.status === 'fallthrough_authorization_blocked'
    ).length,
    persistenceDisabledBranches: branches.filter(
      (b) => b.status === 'persistence_path_disabled'
    ).length,
    receiptDisabledBranches: branches.filter(
      (b) => b.status === 'receipt_path_disabled'
    ).length,
    programRuntimeMutationDisabledBranches: branches.filter(
      (b) => b.status === 'program_runtime_mutation_disabled'
    ).length,
    completedSessionsProtectedBranches: branches.filter(
      (b) => b.status === 'completed_sessions_protected'
    ).length,

    readyForFutureConsentDecisionReviewLock: ready,
    consentAuthorizationLockVerifiedNow: consentAuthorizationLockVerified,
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

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveConsentDecisionStatePreview(
  input: ConsentDecisionStatePreviewInput
): ConsentDecisionStatePreviewModel {
  const { consentAuthorizationLockPreviewModel } = input

  // ---------------------------------------------------------------------------
  // CASE 1: No consent authorization lock model
  // ---------------------------------------------------------------------------
  if (!consentAuthorizationLockPreviewModel) {
    const emptyBranches = buildEmptyBranches()
    return {
      status: 'unavailable_missing_consent_authorization_lock',
      mode: 'not_ready',
      headline: 'Consent Decision State Preview Unavailable',
      summary:
        'No consent authorization lock preview model is available. Cannot preview consent decision states.',

      sourceConsentAuthorizationLockStatus: 'missing',
      sourceConsentAuthorizationLockReady: false,
      sourceReadyForFutureConsentDecisionStatePreview: false,

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
      decisionBranches: emptyBranches,
      decisionSummary: buildSummary(emptyBranches, false, false),
      blockerSummary: ['No consent authorization lock preview model available.'],
      nextRequiredStep:
        'Provide consent authorization lock preview model before consent decision state preview.',

      consentAuthorizationLockVerified: false,
      consentDecisionStatePreviewReady: false,
      readyForFutureConsentDecisionReviewLock: false,

      currentConsentDecision: 'no_decision_collected',

      canShowConsentDecisionStatePreview: false,
      canDisplayDecisionBranches: false,

      canCaptureExplicitUserConsentNow: false,
      canCaptureExplicitUserIntentNow: false,
      canCollectConsentDecisionNow: false,
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

  // ---------------------------------------------------------------------------
  // CASE 2: Consent authorization lock not ready
  // ---------------------------------------------------------------------------
  if (
    consentAuthorizationLockPreviewModel.status !==
    'consent_authorization_locked_persistence_disabled'
  ) {
    const emptyBranches = buildEmptyBranches()
    return {
      status: 'blocked_consent_authorization_lock_not_ready',
      mode: 'not_ready',
      headline: 'Consent Decision State Preview Blocked',
      summary: `Consent authorization lock is not ready (current status: ${consentAuthorizationLockPreviewModel.status}). Cannot preview consent decision states until the authorization lock is ready.`,

      sourceConsentAuthorizationLockStatus: consentAuthorizationLockPreviewModel.status,
      sourceConsentAuthorizationLockReady: false,
      sourceReadyForFutureConsentDecisionStatePreview: false,

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
      decisionBranches: emptyBranches,
      decisionSummary: buildSummary(emptyBranches, false, false),
      blockerSummary: [
        `Consent authorization lock status is ${consentAuthorizationLockPreviewModel.status}, not consent_authorization_locked_persistence_disabled.`,
      ],
      nextRequiredStep:
        'Wait for consent authorization lock to be ready before consent decision state preview.',

      consentAuthorizationLockVerified: false,
      consentDecisionStatePreviewReady: false,
      readyForFutureConsentDecisionReviewLock: false,

      currentConsentDecision: 'no_decision_collected',

      canShowConsentDecisionStatePreview: false,
      canDisplayDecisionBranches: false,

      canCaptureExplicitUserConsentNow: false,
      canCaptureExplicitUserIntentNow: false,
      canCollectConsentDecisionNow: false,
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

  // ---------------------------------------------------------------------------
  // CASE 3: Consent authorization lock ready - PASS state
  // ---------------------------------------------------------------------------
  const branches = buildPassBranches()
  const payload: ConsentDecisionStatePreviewPayload = {
    previewKind: 'consent_decision_state_preview',
    sourceStep: 'MASTER-8C.59_AB20.4.52',
    sourceConsentAuthorizationLockStatus: consentAuthorizationLockPreviewModel.status,
    currentMode: 'consent_decision_state_preview_only_persistence_disabled',

    consentAuthorizationLockVerified: true,
    consentDecisionStatePreviewReady: true,
    currentConsentDecision: 'no_decision_collected',

    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionUndecided: true,
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

    futureDecisionMustRequireExplicitConsent: true,
    futureDecisionMustSeparateGrantAndDeny: true,
    futureDecisionMustBlockUndecidedState: true,
    futureDecisionMustPreventFallthroughAuthorization: true,
    futureDecisionMustPreserveCompletedSessions: true,
    futureDecisionMustNotMutateProgramCardsInThisStep: true,
  }

  return {
    status: 'consent_decision_state_preview_ready_persistence_disabled',
    mode: 'read_only_consent_decision_state_preview',
    headline: 'Consent Decision State Preview Ready',
    summary:
      'The consent authorization lock is verified, so the system can preview future consent decision states. No real consent decision has been collected. Grant, deny, undecided, and fallthrough paths remain locked. Persistence/write/receipt/API/DB/storage/schema/program/workout mutation remain disabled.',

    sourceConsentAuthorizationLockStatus: consentAuthorizationLockPreviewModel.status,
    sourceConsentAuthorizationLockReady: true,
    sourceReadyForFutureConsentDecisionStatePreview:
      consentAuthorizationLockPreviewModel.readyForFutureConsentDecisionStatePreview,

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

    previewPayload: payload,
    decisionBranches: branches,
    decisionSummary: buildSummary(branches, true, true),
    blockerSummary: [],
    nextRequiredStep:
      'Next gate should lock consent decision review before any real authorization, permission, persistence, or write path can exist.',

    consentAuthorizationLockVerified: true,
    consentDecisionStatePreviewReady: true,
    readyForFutureConsentDecisionReviewLock: true,

    currentConsentDecision: 'no_decision_collected',

    canShowConsentDecisionStatePreview: true,
    canDisplayDecisionBranches: true,

    canCaptureExplicitUserConsentNow: false,
    canCaptureExplicitUserIntentNow: false,
    canCollectConsentDecisionNow: false,
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
