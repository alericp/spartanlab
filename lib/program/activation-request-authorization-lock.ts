/**
 * Activation Request Authorization Lock
 * ======================================
 * MASTER-8C.53 / AB20.4.46 — Prompt 48 of 77
 * 
 * Pure read-only authorization lock that proves:
 * 1. Request preview is verified and ready
 * 2. Authorization lock is engaged
 * 3. No activation has been requested
 * 4. No authorization has been granted
 * 5. Persistence remains disabled
 * 6. No writer, receipt, API, DB, storage, schema, program, or workout mutation
 * 
 * This gate prevents a future step from confusing "request preview ready"
 * with "user requested activation" or "authorization granted."
 * 
 * SAFETY: This helper is pure, deterministic, and read-only.
 * It does NOT use Date.now, Math.random, fetch, localStorage, sessionStorage,
 * or any side effects.
 */

import type {
  ExplicitPersistenceActivationRequestPreviewModel,
} from './explicit-persistence-activation-request-preview'

// =============================================================================
// STATUS TYPES
// =============================================================================

export type ActivationRequestAuthorizationLockStatus =
  | 'unavailable_missing_request_preview'
  | 'blocked_request_preview_not_ready'
  | 'authorization_lock_engaged_persistence_disabled'

export type ActivationRequestAuthorizationLockMode =
  | 'read_only_authorization_lock'
  | 'not_ready'

export type ActivationRequestAuthorizationLockRequirementStatus =
  | 'lock_engaged'
  | 'preview_source_verified'
  | 'future_explicit_user_authorization_required'
  | 'future_server_authorization_required'
  | 'future_persistence_contract_required'
  | 'blocked_by_design'

// =============================================================================
// REQUIREMENT INTERFACE
// =============================================================================

export interface ActivationRequestAuthorizationLockRequirement {
  readonly key: string
  readonly label: string
  readonly status: ActivationRequestAuthorizationLockRequirementStatus
  readonly satisfiedForLock: boolean
  readonly requiredBeforeRealActivation: boolean
  readonly blocksRealActivationNow: boolean
  readonly reason: string
}

// =============================================================================
// LOCK PAYLOAD
// =============================================================================

export interface ActivationRequestAuthorizationLockPayload {
  readonly lockKind: 'activation_request_authorization_lock'
  readonly sourceStep: 'MASTER-8C.53_AB20.4.46'
  readonly lockedCapability: 'durable_marker_receipt_writer_activation'
  readonly sourceRequestPreviewStatus: string
  readonly currentMode: 'authorization_lock_only_persistence_disabled'
  readonly authorizationLockEngaged: true
  readonly requestPreviewVerified: boolean
  readonly explicitPersistenceActivationRequested: false
  readonly authorizationGranted: false
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false
}

// =============================================================================
// LOCK SUMMARY
// =============================================================================

export interface ActivationRequestAuthorizationLockSummary {
  readonly totalRequirements: number
  readonly lockEngagedRequirements: number
  readonly previewVerifiedRequirements: number
  readonly futureExplicitUserAuthorizationRequirements: number
  readonly futureServerAuthorizationRequirements: number
  readonly futurePersistenceContractRequirements: number
  readonly blockedByDesignRequirements: number
  readonly readyForFutureIntentCapturePreview: boolean
  readonly authorizationStillLocked: true
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// =============================================================================
// MODEL
// =============================================================================

export interface ActivationRequestAuthorizationLockModel {
  readonly status: ActivationRequestAuthorizationLockStatus
  readonly mode: ActivationRequestAuthorizationLockMode
  readonly headline: string
  readonly summary: string

  // Source data from request preview
  readonly sourceRequestPreviewStatus: string
  readonly sourceCanPreviewExplicitPersistenceActivationRequest: boolean
  readonly sourceReadyForAuthorizationLockReview: boolean
  readonly sourceExplicitPersistenceActivationRequested: false
  readonly sourceAuthorizationGranted: false
  readonly sourcePersistenceEnabled: false
  readonly sourceWriteEnabled: false
  readonly sourceReceiptWritten: false

  // Lock payload
  readonly lockPayload: ActivationRequestAuthorizationLockPayload | null
  readonly requirements: readonly ActivationRequestAuthorizationLockRequirement[]
  readonly lockSummary: ActivationRequestAuthorizationLockSummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  // Lock state
  readonly authorizationLockEngaged: boolean
  readonly requestPreviewVerified: boolean
  readonly readyForFutureIntentCapturePreview: boolean

  // Capability flags - all false
  readonly canShowAuthorizationIntentPreviewLater: boolean
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

  // Hard false dangerous flags
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

// =============================================================================
// INPUT
// =============================================================================

export interface ActivationRequestAuthorizationLockInput {
  readonly explicitPersistenceActivationRequestPreviewModel: ExplicitPersistenceActivationRequestPreviewModel | null | undefined
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveActivationRequestAuthorizationLock(
  input: ActivationRequestAuthorizationLockInput
): ActivationRequestAuthorizationLockModel {
  const { explicitPersistenceActivationRequestPreviewModel } = input

  // Base dangerous flags - always false
  const baseDangerousFlags = {
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

  // Base capability flags - always false for dangerous operations
  const baseCapabilityFlags = {
    canRequestExplicitPersistenceActivationNow: false as const,
    canGrantAuthorizationNow: false as const,
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

  // Base source flags - always false
  const baseSourceFlags = {
    sourceExplicitPersistenceActivationRequested: false as const,
    sourceAuthorizationGranted: false as const,
    sourcePersistenceEnabled: false as const,
    sourceWriteEnabled: false as const,
    sourceReceiptWritten: false as const,
  }

  // Base lock summary flags - always the safe values
  const baseLockSummaryFlags = {
    authorizationStillLocked: true as const,
    realActivationAllowedNow: false as const,
    persistenceStillDisabled: true as const,
    writeStillDisabled: true as const,
  }

  // -------------------------------------------------------------------------
  // CASE 1: No request preview model
  // -------------------------------------------------------------------------
  if (!explicitPersistenceActivationRequestPreviewModel) {
    const emptyRequirements: ActivationRequestAuthorizationLockRequirement[] = []
    const emptySummary: ActivationRequestAuthorizationLockSummary = {
      totalRequirements: 0,
      lockEngagedRequirements: 0,
      previewVerifiedRequirements: 0,
      futureExplicitUserAuthorizationRequirements: 0,
      futureServerAuthorizationRequirements: 0,
      futurePersistenceContractRequirements: 0,
      blockedByDesignRequirements: 0,
      readyForFutureIntentCapturePreview: false,
      ...baseLockSummaryFlags,
    }

    return {
      status: 'unavailable_missing_request_preview',
      mode: 'not_ready',
      headline: 'Authorization Lock Unavailable',
      summary: 'Cannot engage authorization lock without explicit persistence activation request preview model.',

      sourceRequestPreviewStatus: 'missing',
      sourceCanPreviewExplicitPersistenceActivationRequest: false,
      sourceReadyForAuthorizationLockReview: false,
      ...baseSourceFlags,

      lockPayload: null,
      requirements: emptyRequirements,
      lockSummary: emptySummary,
      blockerSummary: ['Explicit persistence activation request preview model is missing.'],
      nextRequiredStep: 'Provide explicit persistence activation request preview model before authorization lock can engage.',

      authorizationLockEngaged: false,
      requestPreviewVerified: false,
      readyForFutureIntentCapturePreview: false,

      canShowAuthorizationIntentPreviewLater: false,
      ...baseCapabilityFlags,
      ...baseDangerousFlags,
    }
  }

  // -------------------------------------------------------------------------
  // CASE 2: Request preview not ready
  // -------------------------------------------------------------------------
  if (explicitPersistenceActivationRequestPreviewModel.status !== 'request_preview_ready_persistence_disabled') {
    const blockedRequirements: ActivationRequestAuthorizationLockRequirement[] = [
      {
        key: 'request_preview_not_ready',
        label: 'Request preview not ready',
        status: 'blocked_by_design',
        satisfiedForLock: false,
        requiredBeforeRealActivation: true,
        blocksRealActivationNow: true,
        reason: `Request preview status is '${explicitPersistenceActivationRequestPreviewModel.status}', not 'request_preview_ready_persistence_disabled'.`,
      },
    ]

    const blockedSummary: ActivationRequestAuthorizationLockSummary = {
      totalRequirements: 1,
      lockEngagedRequirements: 0,
      previewVerifiedRequirements: 0,
      futureExplicitUserAuthorizationRequirements: 0,
      futureServerAuthorizationRequirements: 0,
      futurePersistenceContractRequirements: 0,
      blockedByDesignRequirements: 1,
      readyForFutureIntentCapturePreview: false,
      ...baseLockSummaryFlags,
    }

    return {
      status: 'blocked_request_preview_not_ready',
      mode: 'not_ready',
      headline: 'Authorization Lock Blocked',
      summary: `Cannot engage authorization lock because request preview status is '${explicitPersistenceActivationRequestPreviewModel.status}'.`,

      sourceRequestPreviewStatus: explicitPersistenceActivationRequestPreviewModel.status,
      sourceCanPreviewExplicitPersistenceActivationRequest: explicitPersistenceActivationRequestPreviewModel.canPreviewExplicitPersistenceActivationRequest,
      sourceReadyForAuthorizationLockReview: explicitPersistenceActivationRequestPreviewModel.readyForAuthorizationLockReview,
      ...baseSourceFlags,

      lockPayload: null,
      requirements: blockedRequirements,
      lockSummary: blockedSummary,
      blockerSummary: [
        `Request preview status is '${explicitPersistenceActivationRequestPreviewModel.status}', expected 'request_preview_ready_persistence_disabled'.`,
        'Authorization lock cannot engage until request preview is ready.',
      ],
      nextRequiredStep: 'Complete prior request preview steps before authorization lock can engage.',

      authorizationLockEngaged: false,
      requestPreviewVerified: false,
      readyForFutureIntentCapturePreview: false,

      canShowAuthorizationIntentPreviewLater: false,
      ...baseCapabilityFlags,
      ...baseDangerousFlags,
    }
  }

  // -------------------------------------------------------------------------
  // CASE 3: Request preview ready - engage authorization lock
  // -------------------------------------------------------------------------
  const requirements: ActivationRequestAuthorizationLockRequirement[] = [
    {
      key: 'request_preview_verified',
      label: 'Explicit persistence request preview verified',
      status: 'preview_source_verified',
      satisfiedForLock: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'The prior request preview is ready and still persistence-disabled.',
    },
    {
      key: 'authorization_lock_engaged',
      label: 'Authorization lock engaged',
      status: 'lock_engaged',
      satisfiedForLock: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'Preview readiness cannot become authorization without a later explicit user-intent gate.',
    },
    {
      key: 'explicit_user_authorization_required_later',
      label: 'Explicit user authorization required later',
      status: 'future_explicit_user_authorization_required',
      satisfiedForLock: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A future step must capture explicit user intent before authorization can be granted.',
    },
    {
      key: 'server_authorization_required_later',
      label: 'Server authorization contract required later',
      status: 'future_server_authorization_required',
      satisfiedForLock: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'No server/API authorization contract exists in this lock step.',
    },
    {
      key: 'persistence_contract_required_later',
      label: 'Persistence contract required later',
      status: 'future_persistence_contract_required',
      satisfiedForLock: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'No DB/storage/schema persistence contract is authorized in this lock step.',
    },
    {
      key: 'writer_receipt_blocked_by_design',
      label: 'Writer and receipt blocked by design',
      status: 'blocked_by_design',
      satisfiedForLock: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'The writer and durable receipt remain disabled until authorization and persistence contracts exist.',
    },
    {
      key: 'program_runtime_mutation_blocked',
      label: 'Program and workout mutation blocked',
      status: 'blocked_by_design',
      satisfiedForLock: true,
      requiredBeforeRealActivation: false,
      blocksRealActivationNow: false,
      reason: 'Program Cards, Start Workout, Live Workout, and future sessions remain untouched during authorization lock.',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'lock_engaged',
      satisfiedForLock: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'This authorization lock cannot rewrite completed sessions or logged history.',
    },
  ]

  // Calculate summary counts
  let lockEngagedCount = 0
  let previewVerifiedCount = 0
  let futureUserAuthCount = 0
  let futureServerAuthCount = 0
  let futurePersistenceCount = 0
  let blockedByDesignCount = 0

  for (const req of requirements) {
    switch (req.status) {
      case 'lock_engaged':
        lockEngagedCount++
        break
      case 'preview_source_verified':
        previewVerifiedCount++
        break
      case 'future_explicit_user_authorization_required':
        futureUserAuthCount++
        break
      case 'future_server_authorization_required':
        futureServerAuthCount++
        break
      case 'future_persistence_contract_required':
        futurePersistenceCount++
        break
      case 'blocked_by_design':
        blockedByDesignCount++
        break
    }
  }

  const lockSummary: ActivationRequestAuthorizationLockSummary = {
    totalRequirements: requirements.length,
    lockEngagedRequirements: lockEngagedCount,
    previewVerifiedRequirements: previewVerifiedCount,
    futureExplicitUserAuthorizationRequirements: futureUserAuthCount,
    futureServerAuthorizationRequirements: futureServerAuthCount,
    futurePersistenceContractRequirements: futurePersistenceCount,
    blockedByDesignRequirements: blockedByDesignCount,
    readyForFutureIntentCapturePreview: true,
    ...baseLockSummaryFlags,
  }

  const lockPayload: ActivationRequestAuthorizationLockPayload = {
    lockKind: 'activation_request_authorization_lock',
    sourceStep: 'MASTER-8C.53_AB20.4.46',
    lockedCapability: 'durable_marker_receipt_writer_activation',
    sourceRequestPreviewStatus: explicitPersistenceActivationRequestPreviewModel.status,
    currentMode: 'authorization_lock_only_persistence_disabled',
    authorizationLockEngaged: true,
    requestPreviewVerified: true,
    explicitPersistenceActivationRequested: false,
    authorizationGranted: false,
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
  }

  return {
    status: 'authorization_lock_engaged_persistence_disabled',
    mode: 'read_only_authorization_lock',
    headline: 'Activation Request Authorization Lock Engaged',
    summary: 'The explicit persistence activation request preview is verified, but authorization remains locked. No activation has been requested or granted. Persistence, writer, receipt, API/DB/storage/schema, Program Cards, Start Workout, Live Workout, and future-session mutation remain disabled.',

    sourceRequestPreviewStatus: explicitPersistenceActivationRequestPreviewModel.status,
    sourceCanPreviewExplicitPersistenceActivationRequest: explicitPersistenceActivationRequestPreviewModel.canPreviewExplicitPersistenceActivationRequest,
    sourceReadyForAuthorizationLockReview: explicitPersistenceActivationRequestPreviewModel.readyForAuthorizationLockReview,
    ...baseSourceFlags,

    lockPayload,
    requirements,
    lockSummary,
    blockerSummary: [],
    nextRequiredStep: 'Next gate should preview explicit user activation intent while persistence remains disabled.',

    authorizationLockEngaged: true,
    requestPreviewVerified: true,
    readyForFutureIntentCapturePreview: true,

    canShowAuthorizationIntentPreviewLater: true,
    ...baseCapabilityFlags,
    ...baseDangerousFlags,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getActivationRequestAuthorizationLockStatusLabel(
  status: ActivationRequestAuthorizationLockStatus
): string {
  switch (status) {
    case 'unavailable_missing_request_preview':
      return 'request preview missing'
    case 'blocked_request_preview_not_ready':
      return 'request preview blocked'
    case 'authorization_lock_engaged_persistence_disabled':
      return 'authorization locked / persistence disabled'
  }
}

export function getActivationRequestAuthorizationLockStatusColor(
  status: ActivationRequestAuthorizationLockStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_request_preview':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
      }
    case 'blocked_request_preview_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
      }
    case 'authorization_lock_engaged_persistence_disabled':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400',
        border: 'border-violet-500/20',
      }
  }
}

export function getActivationRequestAuthorizationLockRequirementStatusLabel(
  status: ActivationRequestAuthorizationLockRequirementStatus
): string {
  switch (status) {
    case 'lock_engaged':
      return 'lock engaged'
    case 'preview_source_verified':
      return 'preview verified'
    case 'future_explicit_user_authorization_required':
      return 'future user authorization'
    case 'future_server_authorization_required':
      return 'future server authorization'
    case 'future_persistence_contract_required':
      return 'future persistence contract'
    case 'blocked_by_design':
      return 'blocked by design'
  }
}

export function getActivationRequestAuthorizationLockRequirementStatusColor(
  status: ActivationRequestAuthorizationLockRequirementStatus
): { bg: string; text: string } {
  switch (status) {
    case 'lock_engaged':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400',
      }
    case 'preview_source_verified':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
      }
    case 'future_explicit_user_authorization_required':
      return {
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
      }
    case 'future_server_authorization_required':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
      }
    case 'future_persistence_contract_required':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
      }
    case 'blocked_by_design':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
      }
  }
}
