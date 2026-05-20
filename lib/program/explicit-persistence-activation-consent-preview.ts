// [Prompt 52] Explicit Persistence Activation Consent Preview
// Pure read-only consent preview - no consent captured, no activation, no persistence
// This file defines the future consent requirements while capturing no real consent.
// All dangerous flags remain false. No buttons, handlers, state, or write paths.

import type {
  ControlledActivationPermissionBoundaryPreviewModel,
} from './controlled-activation-permission-boundary-preview'

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------

export type ExplicitPersistenceActivationConsentPreviewStatus =
  | 'unavailable_missing_permission_boundary_preview'
  | 'blocked_permission_boundary_preview_not_ready'
  | 'consent_preview_ready_persistence_disabled'

export type ExplicitPersistenceActivationConsentPreviewMode =
  | 'read_only_consent_preview'
  | 'not_ready'

export type ExplicitPersistenceActivationConsentRequirementStatus =
  | 'source_permission_boundary_verified'
  | 'future_explicit_consent_required'
  | 'future_consent_scope_required'
  | 'future_consent_revocation_required'
  | 'future_consent_denial_required'
  | 'future_activation_request_required'
  | 'future_persistence_writer_required'
  | 'future_durable_receipt_required'
  | 'blocked_by_design'

// -----------------------------------------------------------------------------
// Requirement Item
// -----------------------------------------------------------------------------

export interface ExplicitPersistenceActivationConsentRequirement {
  readonly key: string
  readonly label: string
  readonly status: ExplicitPersistenceActivationConsentRequirementStatus
  readonly satisfiedForPreview: boolean
  readonly requiredBeforeRealConsent: boolean
  readonly blocksConsentNow: boolean
  readonly blocksActivationNow: boolean
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Preview Payload
// -----------------------------------------------------------------------------

export interface ExplicitPersistenceActivationConsentPreviewPayload {
  readonly previewKind: 'explicit_persistence_activation_consent_preview'
  readonly sourceStep: 'MASTER-8C.57_AB20.4.50'
  readonly sourcePermissionBoundaryPreviewStatus: string
  readonly currentMode: 'consent_preview_only_persistence_disabled'

  readonly permissionBoundaryPreviewVerified: boolean
  readonly consentPreviewReady: boolean

  readonly explicitUserConsentCaptured: false
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

  readonly intendedFutureCapability: 'explicit_user_consent_for_durable_marker_receipt_writer_activation'
  readonly futureConsentMustBeExplicit: true
  readonly futureConsentMustBeUserScoped: true
  readonly futureConsentMustBeProgramScoped: true
  readonly futureConsentMustBeMarkerScoped: true
  readonly futureConsentMustBeRevocable: true
  readonly futureConsentMustHaveDeniedState: true
  readonly futureConsentMustPreserveCompletedSessions: true
  readonly futureConsentMustNotMutateProgramCardsInThisStep: true
}

// -----------------------------------------------------------------------------
// Preview Summary
// -----------------------------------------------------------------------------

export interface ExplicitPersistenceActivationConsentPreviewSummary {
  readonly totalRequirements: number
  readonly sourcePermissionBoundaryVerifiedRequirements: number
  readonly futureExplicitConsentRequirements: number
  readonly futureConsentScopeRequirements: number
  readonly futureConsentRevocationRequirements: number
  readonly futureConsentDenialRequirements: number
  readonly futureActivationRequestRequirements: number
  readonly futurePersistenceWriterRequirements: number
  readonly futureDurableReceiptRequirements: number
  readonly blockedByDesignRequirements: number

  readonly readyForFutureConsentAuthorizationLock: boolean
  readonly explicitUserConsentCapturedNow: false
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
// Main Model
// -----------------------------------------------------------------------------

export interface ExplicitPersistenceActivationConsentPreviewModel {
  readonly status: ExplicitPersistenceActivationConsentPreviewStatus
  readonly mode: ExplicitPersistenceActivationConsentPreviewMode
  readonly headline: string
  readonly summary: string

  readonly sourcePermissionBoundaryPreviewStatus: string
  readonly sourcePermissionBoundaryPreviewReady: boolean
  readonly sourceReadyForFutureExplicitConsentPreview: boolean
  readonly sourcePermissionGranted: false
  readonly sourcePermissionDenied: false
  readonly sourceRealActivationAllowed: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  readonly previewPayload: ExplicitPersistenceActivationConsentPreviewPayload | null
  readonly requirements: readonly ExplicitPersistenceActivationConsentRequirement[]
  readonly previewSummary: ExplicitPersistenceActivationConsentPreviewSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly permissionBoundaryPreviewVerified: boolean
  readonly consentPreviewReady: boolean
  readonly readyForFutureConsentAuthorizationLock: boolean

  readonly canShowConsentPreview: boolean
  readonly canDisplayFutureConsentRequirements: boolean
  readonly canCaptureExplicitUserConsentNow: false
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

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ExplicitPersistenceActivationConsentPreviewInput {
  readonly controlledActivationPermissionBoundaryPreviewModel:
    | ControlledActivationPermissionBoundaryPreviewModel
    | null
    | undefined
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function buildRequirements(
  permissionBoundaryReady: boolean
): readonly ExplicitPersistenceActivationConsentRequirement[] {
  return [
    {
      key: 'permission_boundary_preview_verified',
      label: 'Permission boundary preview verified',
      status: 'source_permission_boundary_verified',
      satisfiedForPreview: permissionBoundaryReady,
      requiredBeforeRealConsent: true,
      blocksConsentNow: !permissionBoundaryReady,
      blocksActivationNow: !permissionBoundaryReady,
      reason: permissionBoundaryReady
        ? 'The prior permission-boundary preview is ready while persistence remains disabled.'
        : 'Permission-boundary preview must be ready before consent preview can proceed.',
    },
    {
      key: 'future_explicit_user_consent_required',
      label: 'Future explicit user consent required',
      status: 'future_explicit_consent_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'A future step must capture explicit user consent before persistence activation can be considered.',
    },
    {
      key: 'future_consent_scope_required',
      label: 'Future consent scope required',
      status: 'future_consent_scope_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'Future consent must be scoped to the exact user, current program, marker, and durable receipt writer capability.',
    },
    {
      key: 'future_consent_revocation_required',
      label: 'Future consent revocation required',
      status: 'future_consent_revocation_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'Future consent must be revocable or safely resettable before any persistent writer is enabled.',
    },
    {
      key: 'future_consent_denial_required',
      label: 'Future consent denial state required',
      status: 'future_consent_denial_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'A future real consent flow must have a denied/blocked state that cannot fall through to activation.',
    },
    {
      key: 'future_activation_request_required',
      label: 'Future activation request still required',
      status: 'future_activation_request_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'Consent preview readiness cannot become an activation request. A later step must explicitly request activation.',
    },
    {
      key: 'future_persistence_writer_required',
      label: 'Future persistence writer boundary required',
      status: 'future_persistence_writer_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'A future writer boundary must prove no persistence can execute unless consent, permission, activation, and receipt rules are satisfied.',
    },
    {
      key: 'future_durable_receipt_required',
      label: 'Future durable receipt required',
      status: 'future_durable_receipt_required',
      satisfiedForPreview: false,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'A future receipt boundary must define durable audit proof before marker persistence can be enabled.',
    },
    {
      key: 'persistence_blocked_by_design',
      label: 'Persistence blocked by design',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealConsent: true,
      blocksConsentNow: true,
      blocksActivationNow: true,
      reason: 'This step previews consent requirements only. Persistence/write/receipt/API/DB/storage/schema remain disabled.',
    },
    {
      key: 'program_runtime_mutation_blocked',
      label: 'Program and workout mutation blocked',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealConsent: false,
      blocksConsentNow: false,
      blocksActivationNow: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain untouched during consent preview.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'blocked_by_design',
      satisfiedForPreview: true,
      requiredBeforeRealConsent: true,
      blocksConsentNow: false,
      blocksActivationNow: false,
      reason: 'Consent preview cannot rewrite completed sessions or logged history.',
    },
  ]
}

function buildSummary(
  requirements: readonly ExplicitPersistenceActivationConsentRequirement[],
  permissionBoundaryReady: boolean
): ExplicitPersistenceActivationConsentPreviewSummary {
  let sourcePermissionBoundaryVerifiedRequirements = 0
  let futureExplicitConsentRequirements = 0
  let futureConsentScopeRequirements = 0
  let futureConsentRevocationRequirements = 0
  let futureConsentDenialRequirements = 0
  let futureActivationRequestRequirements = 0
  let futurePersistenceWriterRequirements = 0
  let futureDurableReceiptRequirements = 0
  let blockedByDesignRequirements = 0

  for (const r of requirements) {
    switch (r.status) {
      case 'source_permission_boundary_verified':
        sourcePermissionBoundaryVerifiedRequirements++
        break
      case 'future_explicit_consent_required':
        futureExplicitConsentRequirements++
        break
      case 'future_consent_scope_required':
        futureConsentScopeRequirements++
        break
      case 'future_consent_revocation_required':
        futureConsentRevocationRequirements++
        break
      case 'future_consent_denial_required':
        futureConsentDenialRequirements++
        break
      case 'future_activation_request_required':
        futureActivationRequestRequirements++
        break
      case 'future_persistence_writer_required':
        futurePersistenceWriterRequirements++
        break
      case 'future_durable_receipt_required':
        futureDurableReceiptRequirements++
        break
      case 'blocked_by_design':
        blockedByDesignRequirements++
        break
    }
  }

  return {
    totalRequirements: requirements.length,
    sourcePermissionBoundaryVerifiedRequirements,
    futureExplicitConsentRequirements,
    futureConsentScopeRequirements,
    futureConsentRevocationRequirements,
    futureConsentDenialRequirements,
    futureActivationRequestRequirements,
    futurePersistenceWriterRequirements,
    futureDurableReceiptRequirements,
    blockedByDesignRequirements,

    readyForFutureConsentAuthorizationLock: permissionBoundaryReady,
    explicitUserConsentCapturedNow: false,
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

export function resolveExplicitPersistenceActivationConsentPreview(
  input: ExplicitPersistenceActivationConsentPreviewInput
): ExplicitPersistenceActivationConsentPreviewModel {
  const { controlledActivationPermissionBoundaryPreviewModel } = input

  // Shared dangerous flags - all false
  const dangerousFlags = {
    explicitUserConsentCaptured: false as const,
    explicitUserIntentCaptured: false as const,
    explicitPersistenceActivationRequested: false as const,
    authorizationReviewed: false as const,
    authorizationGranted: false as const,
    authorizationDenied: false as const,
    permissionGranted: false as const,
    permissionDenied: false as const,
    realActivationAllowed: false as const,
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

  const cannotFlags = {
    canCaptureExplicitUserConsentNow: false as const,
    canCaptureExplicitUserIntentNow: false as const,
    canRequestExplicitPersistenceActivationNow: false as const,
    canReviewAuthorizationNow: false as const,
    canGrantAuthorizationNow: false as const,
    canGrantPermissionNow: false as const,
    canDenyPermissionNow: false as const,
    canAllowRealActivationNow: false as const,
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
  }

  const sourceFlags = {
    sourcePermissionGranted: false as const,
    sourcePermissionDenied: false as const,
    sourceRealActivationAllowed: false as const,
    sourcePersistenceEnabled: false as const,
    sourceWriteEnabled: false as const,
    sourceReceiptWritten: false as const,
  }

  // Case 1: No permission-boundary preview model
  if (!controlledActivationPermissionBoundaryPreviewModel) {
    const requirements = buildRequirements(false)
    const previewSummary = buildSummary(requirements, false)

    return {
      status: 'unavailable_missing_permission_boundary_preview',
      mode: 'not_ready',
      headline: 'Consent Preview Unavailable',
      summary: 'The permission-boundary preview model is not available. Consent preview cannot proceed.',

      sourcePermissionBoundaryPreviewStatus: 'missing',
      sourcePermissionBoundaryPreviewReady: false,
      sourceReadyForFutureExplicitConsentPreview: false,
      ...sourceFlags,

      previewPayload: null,
      requirements,
      previewSummary,
      blockerSummary: ['Permission-boundary preview model is missing.'],
      nextRequiredStep: 'Provide permission-boundary preview model before consent preview can proceed.',

      permissionBoundaryPreviewVerified: false,
      consentPreviewReady: false,
      readyForFutureConsentAuthorizationLock: false,

      canShowConsentPreview: false,
      canDisplayFutureConsentRequirements: false,
      ...cannotFlags,
      ...dangerousFlags,
    }
  }

  const sourceStatus = controlledActivationPermissionBoundaryPreviewModel.status
  const isReady = sourceStatus === 'permission_boundary_preview_ready_persistence_disabled'

  // Case 2: Permission-boundary preview not ready
  if (!isReady) {
    const requirements = buildRequirements(false)
    const previewSummary = buildSummary(requirements, false)

    return {
      status: 'blocked_permission_boundary_preview_not_ready',
      mode: 'not_ready',
      headline: 'Consent Preview Blocked',
      summary: `The permission-boundary preview is not ready (status: ${sourceStatus}). Consent preview cannot proceed until permission-boundary preview is ready while persistence remains disabled.`,

      sourcePermissionBoundaryPreviewStatus: sourceStatus,
      sourcePermissionBoundaryPreviewReady: false,
      sourceReadyForFutureExplicitConsentPreview: controlledActivationPermissionBoundaryPreviewModel.readyForFutureExplicitConsentPreview,
      ...sourceFlags,

      previewPayload: null,
      requirements,
      previewSummary,
      blockerSummary: [
        `Permission-boundary preview status is "${sourceStatus}" instead of "permission_boundary_preview_ready_persistence_disabled".`,
        'Consent preview requires permission-boundary preview to be ready first.',
      ],
      nextRequiredStep: 'Complete permission-boundary preview before consent preview can proceed.',

      permissionBoundaryPreviewVerified: false,
      consentPreviewReady: false,
      readyForFutureConsentAuthorizationLock: false,

      canShowConsentPreview: false,
      canDisplayFutureConsentRequirements: false,
      ...cannotFlags,
      ...dangerousFlags,
    }
  }

  // Case 3: Permission-boundary preview is ready - PASS state
  const requirements = buildRequirements(true)
  const previewSummary = buildSummary(requirements, true)

  const previewPayload: ExplicitPersistenceActivationConsentPreviewPayload = {
    previewKind: 'explicit_persistence_activation_consent_preview',
    sourceStep: 'MASTER-8C.57_AB20.4.50',
    sourcePermissionBoundaryPreviewStatus: sourceStatus,
    currentMode: 'consent_preview_only_persistence_disabled',

    permissionBoundaryPreviewVerified: true,
    consentPreviewReady: true,

    explicitUserConsentCaptured: false,
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

    intendedFutureCapability: 'explicit_user_consent_for_durable_marker_receipt_writer_activation',
    futureConsentMustBeExplicit: true,
    futureConsentMustBeUserScoped: true,
    futureConsentMustBeProgramScoped: true,
    futureConsentMustBeMarkerScoped: true,
    futureConsentMustBeRevocable: true,
    futureConsentMustHaveDeniedState: true,
    futureConsentMustPreserveCompletedSessions: true,
    futureConsentMustNotMutateProgramCardsInThisStep: true,
  }

  return {
    status: 'consent_preview_ready_persistence_disabled',
    mode: 'read_only_consent_preview',
    headline: 'Explicit Persistence Activation Consent Preview Ready',
    summary: 'The permission-boundary preview is verified, so the system can preview future explicit consent requirements. No consent has been captured, no user intent has been captured, no activation has been requested, no authorization has been reviewed or granted, no permission has been granted or denied, and persistence/write/receipt/API/DB/storage/schema/program/workout mutation remain disabled.',

    sourcePermissionBoundaryPreviewStatus: sourceStatus,
    sourcePermissionBoundaryPreviewReady: true,
    sourceReadyForFutureExplicitConsentPreview: true,
    ...sourceFlags,

    previewPayload,
    requirements,
    previewSummary,
    blockerSummary: [],
    nextRequiredStep: 'Next gate should lock consent authorization while persistence remains disabled.',

    permissionBoundaryPreviewVerified: true,
    consentPreviewReady: true,
    readyForFutureConsentAuthorizationLock: true,

    canShowConsentPreview: true,
    canDisplayFutureConsentRequirements: true,
    ...cannotFlags,
    ...dangerousFlags,
  }
}

// -----------------------------------------------------------------------------
// Label Helpers
// -----------------------------------------------------------------------------

export function getExplicitPersistenceActivationConsentPreviewStatusLabel(
  status: ExplicitPersistenceActivationConsentPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_permission_boundary_preview':
      return 'permission boundary missing'
    case 'blocked_permission_boundary_preview_not_ready':
      return 'permission boundary blocked'
    case 'consent_preview_ready_persistence_disabled':
      return 'consent preview ready / persistence disabled'
  }
}

export function getExplicitPersistenceActivationConsentPreviewStatusColor(
  status: ExplicitPersistenceActivationConsentPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_permission_boundary_preview':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_permission_boundary_preview_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'consent_preview_ready_persistence_disabled':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400/70',
        border: 'border-green-500/20',
      }
  }
}

export function getExplicitPersistenceActivationConsentRequirementStatusLabel(
  status: ExplicitPersistenceActivationConsentRequirementStatus
): string {
  switch (status) {
    case 'source_permission_boundary_verified':
      return 'permission boundary verified'
    case 'future_explicit_consent_required':
      return 'future explicit consent'
    case 'future_consent_scope_required':
      return 'future consent scope'
    case 'future_consent_revocation_required':
      return 'future revocation'
    case 'future_consent_denial_required':
      return 'future denial state'
    case 'future_activation_request_required':
      return 'future activation request'
    case 'future_persistence_writer_required':
      return 'future writer boundary'
    case 'future_durable_receipt_required':
      return 'future receipt boundary'
    case 'blocked_by_design':
      return 'blocked by design'
  }
}

export function getExplicitPersistenceActivationConsentRequirementStatusColor(
  status: ExplicitPersistenceActivationConsentRequirementStatus
): { bg: string; text: string } {
  switch (status) {
    case 'source_permission_boundary_verified':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70' }
    case 'future_explicit_consent_required':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400/70' }
    case 'future_consent_scope_required':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70' }
    case 'future_consent_revocation_required':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70' }
    case 'future_consent_denial_required':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400/70' }
    case 'future_activation_request_required':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'future_persistence_writer_required':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70' }
    case 'future_durable_receipt_required':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'blocked_by_design':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
  }
}
