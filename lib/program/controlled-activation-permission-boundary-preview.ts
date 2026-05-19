/**
 * Controlled Activation Permission Boundary Preview
 * [Prompt 51] MASTER-8C.56 / AB20.4.49
 *
 * Pure read-only permission boundary preview - no permission granted, no activation allowed.
 * Consumes ExplicitActivationAuthorizationReviewPreviewModel.
 * All persistence/write/API/DB/storage/schema/program/workout mutation disabled.
 */

import type {
  ExplicitActivationAuthorizationReviewPreviewModel,
} from './explicit-activation-authorization-review-preview'

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------

export type ControlledActivationPermissionBoundaryPreviewStatus =
  | 'unavailable_missing_authorization_review_preview'
  | 'blocked_authorization_review_preview_not_ready'
  | 'permission_boundary_preview_ready_persistence_disabled'

export type ControlledActivationPermissionBoundaryPreviewMode =
  | 'read_only_permission_boundary_preview'
  | 'not_ready'

export type ControlledActivationPermissionBoundaryStatus =
  | 'source_authorization_review_preview_verified'
  | 'future_permission_scope_boundary_required'
  | 'future_permission_grant_boundary_required'
  | 'future_permission_denial_boundary_required'
  | 'future_activation_allowed_boundary_required'
  | 'future_writer_boundary_required'
  | 'future_receipt_boundary_required'
  | 'blocked_by_design'

// -----------------------------------------------------------------------------
// Boundary Item Interface
// -----------------------------------------------------------------------------

export interface ControlledActivationPermissionBoundaryItem {
  readonly key: string
  readonly label: string
  readonly status: ControlledActivationPermissionBoundaryStatus
  readonly satisfiedForPreview: boolean
  readonly requiredBeforeRealPermission: boolean
  readonly blocksPermissionNow: boolean
  readonly blocksRealActivationNow: boolean
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Payload Interface
// -----------------------------------------------------------------------------

export interface ControlledActivationPermissionBoundaryPreviewPayload {
  readonly previewKind: 'controlled_activation_permission_boundary_preview'
  readonly sourceStep: 'MASTER-8C.56_AB20.4.49'
  readonly sourceAuthorizationReviewPreviewStatus: string
  readonly currentMode: 'permission_boundary_preview_only_persistence_disabled'

  readonly authorizationReviewPreviewVerified: boolean
  readonly permissionBoundaryPreviewReady: boolean

  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly permissionGranted: false
  readonly permissionDenied: false
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false

  readonly intendedFutureCapability: 'durable_marker_receipt_writer_activation'
  readonly futurePermissionMustBeUserScoped: true
  readonly futurePermissionMustBeProgramScoped: true
  readonly futurePermissionMustBeMarkerScoped: true
  readonly futurePermissionMustBeExplicitAndRevocable: true
  readonly futurePermissionMustHaveDeniedState: true
  readonly futurePermissionMustPreserveCompletedSessions: true
  readonly futurePermissionMustNotMutateProgramCardsInThisStep: true
}

// -----------------------------------------------------------------------------
// Summary Interface
// -----------------------------------------------------------------------------

export interface ControlledActivationPermissionBoundaryPreviewSummary {
  readonly totalBoundaries: number
  readonly sourceAuthorizationReviewVerifiedBoundaries: number
  readonly futureScopeBoundaries: number
  readonly futureGrantBoundaries: number
  readonly futureDenialBoundaries: number
  readonly futureActivationAllowedBoundaries: number
  readonly futureWriterBoundaries: number
  readonly futureReceiptBoundaries: number
  readonly blockedByDesignBoundaries: number

  readonly readyForFutureExplicitConsentPreview: boolean
  readonly explicitUserIntentCapturedNow: false
  readonly explicitActivationRequestedNow: false
  readonly authorizationReviewedNow: false
  readonly authorizationGrantedNow: false
  readonly permissionGrantedNow: false
  readonly permissionDeniedNow: false
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// -----------------------------------------------------------------------------
// Model Interface
// -----------------------------------------------------------------------------

export interface ControlledActivationPermissionBoundaryPreviewModel {
  readonly status: ControlledActivationPermissionBoundaryPreviewStatus
  readonly mode: ControlledActivationPermissionBoundaryPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourceAuthorizationReviewPreviewStatus: string
  readonly sourceAuthorizationReviewPreviewReady: boolean
  readonly sourceReadyForFuturePermissionBoundaryPreview: boolean
  readonly sourceExplicitUserIntentCaptured: false
  readonly sourceExplicitPersistenceActivationRequested: false
  readonly sourceAuthorizationReviewed: false
  readonly sourceAuthorizationGranted: false
  readonly sourceAuthorizationDenied: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ControlledActivationPermissionBoundaryPreviewPayload | null
  readonly boundaries: readonly ControlledActivationPermissionBoundaryItem[]
  readonly previewSummary: ControlledActivationPermissionBoundaryPreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly authorizationReviewPreviewVerified: boolean
  readonly permissionBoundaryPreviewReady: boolean
  readonly readyForFutureExplicitConsentPreview: boolean

  readonly canShowPermissionBoundaryPreview: boolean
  readonly canDisplayFuturePermissionBoundaries: boolean
  readonly canCaptureExplicitUserIntentNow: false
  readonly canRequestExplicitPersistenceActivationNow: false
  readonly canReviewAuthorizationNow: false
  readonly canGrantAuthorizationNow: false
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

// -----------------------------------------------------------------------------
// Input Interface
// -----------------------------------------------------------------------------

export interface ControlledActivationPermissionBoundaryPreviewInput {
  readonly explicitActivationAuthorizationReviewPreviewModel:
    | ExplicitActivationAuthorizationReviewPreviewModel
    | null
    | undefined
}

// -----------------------------------------------------------------------------
// Build Boundaries Helper
// -----------------------------------------------------------------------------

function buildPassBoundaries(): readonly ControlledActivationPermissionBoundaryItem[] {
  return [
    {
      key: 'authorization_review_preview_verified',
      label: 'Authorization review preview verified',
      status: 'source_authorization_review_preview_verified',
      satisfiedForPreview: true,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: false,
      blocksRealActivationNow: false,
      reason: 'The prior authorization-review preview is ready while persistence remains disabled.',
    },
    {
      key: 'future_permission_scope_boundary_required',
      label: 'Future permission scope boundary required',
      status: 'future_permission_scope_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'A future permission step must define exact user/program/marker scope before activation can exist.',
    },
    {
      key: 'future_permission_grant_boundary_required',
      label: 'Future permission grant boundary required',
      status: 'future_permission_grant_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'Permission preview readiness cannot become a granted permission. A later step must define the grant boundary explicitly.',
    },
    {
      key: 'future_permission_denial_boundary_required',
      label: 'Future permission denial boundary required',
      status: 'future_permission_denial_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'A future real permission flow must have a denied/blocked state that cannot fall through to activation.',
    },
    {
      key: 'future_activation_allowed_boundary_required',
      label: 'Future activation-allowed boundary required',
      status: 'future_activation_allowed_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'Real activation must remain impossible until explicit permission and all writer gates are satisfied.',
    },
    {
      key: 'future_writer_boundary_required',
      label: 'Future writer boundary required',
      status: 'future_writer_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'A future writer boundary must prove no write can execute unless permission, activation, and receipt rules are satisfied.',
    },
    {
      key: 'future_receipt_boundary_required',
      label: 'Future receipt boundary required',
      status: 'future_receipt_boundary_required',
      satisfiedForPreview: false,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'A future receipt boundary must define durable audit proof before marker persistence can be enabled.',
    },
    {
      key: 'persistence_blocked_by_design',
      label: 'Persistence blocked by design',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: true,
      blocksRealActivationNow: true,
      reason: 'This step previews permission boundaries only. Persistence/write/receipt/API/DB/storage/schema remain disabled.',
    },
    {
      key: 'program_runtime_mutation_blocked',
      label: 'Program and workout mutation blocked',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealPermission: false,
      blocksPermissionNow: false,
      blocksRealActivationNow: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain untouched during permission boundary preview.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealPermission: true,
      blocksPermissionNow: false,
      blocksRealActivationNow: false,
      reason: 'Permission boundary preview cannot rewrite completed sessions or logged history.',
    },
  ]
}

// -----------------------------------------------------------------------------
// Build Summary Helper
// -----------------------------------------------------------------------------

function buildSummary(
  boundaries: readonly ControlledActivationPermissionBoundaryItem[],
  readyForFutureExplicitConsentPreview: boolean
): ControlledActivationPermissionBoundaryPreviewSummary {
  let sourceAuthorizationReviewVerifiedBoundaries = 0
  let futureScopeBoundaries = 0
  let futureGrantBoundaries = 0
  let futureDenialBoundaries = 0
  let futureActivationAllowedBoundaries = 0
  let futureWriterBoundaries = 0
  let futureReceiptBoundaries = 0
  let blockedByDesignBoundaries = 0

  for (const b of boundaries) {
    switch (b.status) {
      case 'source_authorization_review_preview_verified':
        sourceAuthorizationReviewVerifiedBoundaries++
        break
      case 'future_permission_scope_boundary_required':
        futureScopeBoundaries++
        break
      case 'future_permission_grant_boundary_required':
        futureGrantBoundaries++
        break
      case 'future_permission_denial_boundary_required':
        futureDenialBoundaries++
        break
      case 'future_activation_allowed_boundary_required':
        futureActivationAllowedBoundaries++
        break
      case 'future_writer_boundary_required':
        futureWriterBoundaries++
        break
      case 'future_receipt_boundary_required':
        futureReceiptBoundaries++
        break
      case 'blocked_by_design':
        blockedByDesignBoundaries++
        break
    }
  }

  return {
    totalBoundaries: boundaries.length,
    sourceAuthorizationReviewVerifiedBoundaries,
    futureScopeBoundaries,
    futureGrantBoundaries,
    futureDenialBoundaries,
    futureActivationAllowedBoundaries,
    futureWriterBoundaries,
    futureReceiptBoundaries,
    blockedByDesignBoundaries,
    readyForFutureExplicitConsentPreview,
    explicitUserIntentCapturedNow: false,
    explicitActivationRequestedNow: false,
    authorizationReviewedNow: false,
    authorizationGrantedNow: false,
    permissionGrantedNow: false,
    permissionDeniedNow: false,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolveControlledActivationPermissionBoundaryPreview(
  input: ControlledActivationPermissionBoundaryPreviewInput
): ControlledActivationPermissionBoundaryPreviewModel {
  const { explicitActivationAuthorizationReviewPreviewModel } = input

  // Case 1: No authorization-review preview model
  if (!explicitActivationAuthorizationReviewPreviewModel) {
    const emptyBoundaries: readonly ControlledActivationPermissionBoundaryItem[] = []
    return {
      status: 'unavailable_missing_authorization_review_preview',
      mode: 'not_ready',
      headline: 'Permission Boundary Preview Unavailable',
      summary: 'No authorization-review preview model is available. The permission boundary preview cannot proceed.',

      sourceAuthorizationReviewPreviewStatus: 'missing',
      sourceAuthorizationReviewPreviewReady: false,
      sourceReadyForFuturePermissionBoundaryPreview: false,
      sourceExplicitUserIntentCaptured: false,
      sourceExplicitPersistenceActivationRequested: false,
      sourceAuthorizationReviewed: false,
      sourceAuthorizationGranted: false,
      sourceAuthorizationDenied: false,
      sourcePersistenceEnabled: false,
      sourceWriteEnabled: false,
      sourceReceiptWritten: false,

      previewPayload: null,
      boundaries: emptyBoundaries,
      previewSummary: buildSummary(emptyBoundaries, false),
      blockerSummary: ['Authorization-review preview model is missing'],
      nextRequiredStep: 'Ensure authorization-review preview is available before proceeding.',

      authorizationReviewPreviewVerified: false,
      permissionBoundaryPreviewReady: false,
      readyForFutureExplicitConsentPreview: false,

      canShowPermissionBoundaryPreview: false,
      canDisplayFuturePermissionBoundaries: false,
      canCaptureExplicitUserIntentNow: false,
      canRequestExplicitPersistenceActivationNow: false,
      canReviewAuthorizationNow: false,
      canGrantAuthorizationNow: false,
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

  const sourceStatus = explicitActivationAuthorizationReviewPreviewModel.status

  // Case 2: Authorization-review preview not ready
  if (sourceStatus !== 'authorization_review_preview_ready_persistence_disabled') {
    const emptyBoundaries: readonly ControlledActivationPermissionBoundaryItem[] = []
    return {
      status: 'blocked_authorization_review_preview_not_ready',
      mode: 'not_ready',
      headline: 'Permission Boundary Preview Blocked',
      summary: `The authorization-review preview is not ready (current status: ${sourceStatus}). The permission boundary preview cannot proceed until the authorization-review preview reaches the ready state.`,

      sourceAuthorizationReviewPreviewStatus: sourceStatus,
      sourceAuthorizationReviewPreviewReady: false,
      sourceReadyForFuturePermissionBoundaryPreview: explicitActivationAuthorizationReviewPreviewModel.readyForFuturePermissionBoundaryPreview,
      sourceExplicitUserIntentCaptured: false,
      sourceExplicitPersistenceActivationRequested: false,
      sourceAuthorizationReviewed: false,
      sourceAuthorizationGranted: false,
      sourceAuthorizationDenied: false,
      sourcePersistenceEnabled: false,
      sourceWriteEnabled: false,
      sourceReceiptWritten: false,

      previewPayload: null,
      boundaries: emptyBoundaries,
      previewSummary: buildSummary(emptyBoundaries, false),
      blockerSummary: [
        `Authorization-review preview status is "${sourceStatus}" instead of "authorization_review_preview_ready_persistence_disabled"`,
      ],
      nextRequiredStep: 'Wait for authorization-review preview to reach ready state.',

      authorizationReviewPreviewVerified: false,
      permissionBoundaryPreviewReady: false,
      readyForFutureExplicitConsentPreview: false,

      canShowPermissionBoundaryPreview: false,
      canDisplayFuturePermissionBoundaries: false,
      canCaptureExplicitUserIntentNow: false,
      canRequestExplicitPersistenceActivationNow: false,
      canReviewAuthorizationNow: false,
      canGrantAuthorizationNow: false,
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

  // Case 3: Authorization-review preview is ready - build PASS state
  const boundaries = buildPassBoundaries()

  const payload: ControlledActivationPermissionBoundaryPreviewPayload = {
    previewKind: 'controlled_activation_permission_boundary_preview',
    sourceStep: 'MASTER-8C.56_AB20.4.49',
    sourceAuthorizationReviewPreviewStatus: sourceStatus,
    currentMode: 'permission_boundary_preview_only_persistence_disabled',

    authorizationReviewPreviewVerified: true,
    permissionBoundaryPreviewReady: true,

    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    authorizationReviewed: false,
    authorizationGranted: false,
    permissionGranted: false,
    permissionDenied: false,
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,

    intendedFutureCapability: 'durable_marker_receipt_writer_activation',
    futurePermissionMustBeUserScoped: true,
    futurePermissionMustBeProgramScoped: true,
    futurePermissionMustBeMarkerScoped: true,
    futurePermissionMustBeExplicitAndRevocable: true,
    futurePermissionMustHaveDeniedState: true,
    futurePermissionMustPreserveCompletedSessions: true,
    futurePermissionMustNotMutateProgramCardsInThisStep: true,
  }

  return {
    status: 'permission_boundary_preview_ready_persistence_disabled',
    mode: 'read_only_permission_boundary_preview',
    headline: 'Controlled Activation Permission Boundary Preview Ready',
    summary: 'The authorization-review preview is verified, so the system can preview the future controlled permission boundary. No permission has been granted or denied, no user intent has been captured, no activation has been requested, no authorization has been reviewed or granted, and persistence/write/receipt/API/DB/storage/schema/program/workout mutation remain disabled.',

    sourceAuthorizationReviewPreviewStatus: sourceStatus,
    sourceAuthorizationReviewPreviewReady: true,
    sourceReadyForFuturePermissionBoundaryPreview: true,
    sourceExplicitUserIntentCaptured: false,
    sourceExplicitPersistenceActivationRequested: false,
    sourceAuthorizationReviewed: false,
    sourceAuthorizationGranted: false,
    sourceAuthorizationDenied: false,
    sourcePersistenceEnabled: false,
    sourceWriteEnabled: false,
    sourceReceiptWritten: false,

    previewPayload: payload,
    boundaries,
    previewSummary: buildSummary(boundaries, true),
    blockerSummary: [],
    nextRequiredStep: 'Next gate should preview explicit activation consent while persistence remains disabled.',

    authorizationReviewPreviewVerified: true,
    permissionBoundaryPreviewReady: true,
    readyForFutureExplicitConsentPreview: true,

    canShowPermissionBoundaryPreview: true,
    canDisplayFuturePermissionBoundaries: true,
    canCaptureExplicitUserIntentNow: false,
    canRequestExplicitPersistenceActivationNow: false,
    canReviewAuthorizationNow: false,
    canGrantAuthorizationNow: false,
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

// -----------------------------------------------------------------------------
// Label Helpers
// -----------------------------------------------------------------------------

export function getControlledActivationPermissionBoundaryPreviewStatusLabel(
  status: ControlledActivationPermissionBoundaryPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_authorization_review_preview':
      return 'auth review missing'
    case 'blocked_authorization_review_preview_not_ready':
      return 'auth review blocked'
    case 'permission_boundary_preview_ready_persistence_disabled':
      return 'permission boundary ready / persistence disabled'
  }
}

export function getControlledActivationPermissionBoundaryPreviewStatusColor(
  status: ControlledActivationPermissionBoundaryPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_authorization_review_preview':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
    case 'blocked_authorization_review_preview_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'permission_boundary_preview_ready_persistence_disabled':
      return { bg: 'bg-lime-500/10', text: 'text-lime-400/70', border: 'border-lime-500/20' }
  }
}

export function getControlledActivationPermissionBoundaryStatusLabel(
  status: ControlledActivationPermissionBoundaryStatus
): string {
  switch (status) {
    case 'source_authorization_review_preview_verified':
      return 'auth review verified'
    case 'future_permission_scope_boundary_required':
      return 'future permission scope'
    case 'future_permission_grant_boundary_required':
      return 'future grant boundary'
    case 'future_permission_denial_boundary_required':
      return 'future denial boundary'
    case 'future_activation_allowed_boundary_required':
      return 'future activation boundary'
    case 'future_writer_boundary_required':
      return 'future writer boundary'
    case 'future_receipt_boundary_required':
      return 'future receipt boundary'
    case 'blocked_by_design':
      return 'blocked by design'
  }
}

export function getControlledActivationPermissionBoundaryStatusColor(
  status: ControlledActivationPermissionBoundaryStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_authorization_review_preview_verified':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70' }
    case 'future_permission_scope_boundary_required':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400/70' }
    case 'future_permission_grant_boundary_required':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70' }
    case 'future_permission_denial_boundary_required':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70' }
    case 'future_activation_allowed_boundary_required':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400/70' }
    case 'future_writer_boundary_required':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'future_receipt_boundary_required':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'blocked_by_design':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
  }
}
