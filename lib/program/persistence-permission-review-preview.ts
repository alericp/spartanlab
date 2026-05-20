/**
 * Persistence Permission Review Preview
 * MASTER-8C.62 / AB20.4.55 — Prompt 57 of 77
 *
 * Pure read-only persistence permission review preview.
 * Consumes ConsentPermissionBoundaryPreviewModel and proves that:
 * - Consent permission boundary is verified
 * - Persistence permission is NOT granted
 * - No persistence activation
 * - No write authorization
 * - No durable receipt
 * - No API/DB/storage/schema
 * - No Program Cards / Start Workout / Live Workout changes
 * - Completed sessions protected
 *
 * SAFETY INVARIANTS (enforced at runtime by returning false flags):
 * - No localStorage runtime usage
 * - No sessionStorage runtime usage
 * - No fetch/API/DB/storage calls
 * - No Date.now/Math.random runtime usage
 * - No window/document runtime usage
 * - No schema changes
 * - No mutation
 * - No broad any
 * - No TypeScript suppressions
 */

import type { ConsentPermissionBoundaryPreviewModel } from './consent-permission-boundary-preview'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type PersistencePermissionReviewPreviewStatus =
  | 'unavailable_missing_consent_permission_boundary'
  | 'blocked_consent_permission_boundary_not_ready'
  | 'persistence_permission_review_ready_persistence_disabled'

export type PersistencePermissionReviewPreviewMode =
  | 'read_only_persistence_permission_review_preview'
  | 'not_ready'

export type PersistencePermissionReviewState =
  | 'persistence_permission_not_granted'

export type PersistencePermissionReviewItemStatus =
  | 'consent_permission_boundary_verified'
  | 'persistence_permission_required_but_not_granted'
  | 'persistence_grant_path_locked'
  | 'persistence_deny_path_locked'
  | 'write_authorization_still_blocked'
  | 'durable_receipt_path_disabled'
  | 'api_route_disabled'
  | 'db_storage_disabled'
  | 'schema_mutation_disabled'
  | 'program_cards_mutation_disabled'
  | 'start_workout_mutation_disabled'
  | 'live_workout_mutation_disabled'
  | 'future_session_mutation_disabled'
  | 'completed_sessions_protected'

// ============================================================================
// ITEM TYPE
// ============================================================================

export interface PersistencePermissionReviewItem {
  readonly key: string
  readonly status: PersistencePermissionReviewItemStatus
  readonly label: string
  readonly description: string
  readonly lockedNow: boolean
  readonly disabledNow: boolean
  readonly protectedNow: boolean
}

// ============================================================================
// PAYLOAD TYPE
// ============================================================================

export interface PersistencePermissionReviewPayload {
  readonly previewKind: 'persistence_permission_review_preview'
  readonly sourceStep: 'MASTER-8C.62_AB20.4.55'
  readonly sourceConsentPermissionBoundaryStatus: string
  readonly currentMode: 'persistence_permission_review_only_persistence_disabled'
  readonly currentPersistencePermissionState: 'persistence_permission_not_granted'
  // Consent flags
  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentDecisionReviewPerformed: false
  // Permission flags
  readonly consentPermissionGranted: false
  readonly consentPermissionDenied: false
  readonly persistencePermissionGranted: false
  readonly persistencePermissionDenied: false
  // Authorization flags
  readonly authorizationReviewed: false
  readonly authorizationGranted: false
  readonly authorizationDenied: false
  // Activation flags
  readonly realActivationAllowed: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false
  // Infrastructure flags
  readonly apiRouteCalled: false
  readonly dbClientUsed: false
  readonly storageUsed: false
  readonly schemaTouched: false
  // Mutation flags
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
  // Future boundary awareness
  readonly futurePersistenceWriteMustRequireExplicitPermission: true
  readonly futurePersistenceWriteMustNotInferFromReviewReadiness: true
  readonly futurePersistenceWriteMustPreserveCompletedSessions: true
}

// ============================================================================
// SUMMARY TYPE
// ============================================================================

export interface PersistencePermissionReviewSummary {
  readonly totalItems: number
  readonly consentBoundaryVerifiedItems: number
  readonly persistencePermissionRequiredItems: number
  readonly persistenceGrantPathLockedItems: number
  readonly persistenceDenyPathLockedItems: number
  readonly writeAuthorizationBlockedItems: number
  readonly durableReceiptDisabledItems: number
  readonly apiRouteDisabledItems: number
  readonly dbStorageDisabledItems: number
  readonly schemaMutationDisabledItems: number
  readonly programCardsMutationDisabledItems: number
  readonly startWorkoutMutationDisabledItems: number
  readonly liveWorkoutMutationDisabledItems: number
  readonly futureSessionMutationDisabledItems: number
  readonly completedSessionsProtectedItems: number
}

// ============================================================================
// MODEL TYPE
// ============================================================================

export interface PersistencePermissionReviewPreviewModel {
  readonly status: PersistencePermissionReviewPreviewStatus
  readonly mode: PersistencePermissionReviewPreviewMode
  readonly headline: string
  readonly summary: string
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string
  // Source verification
  readonly consentPermissionBoundaryVerified: boolean
  readonly persistencePermissionReviewReady: boolean
  readonly readyForFuturePersistenceWritePreflight: boolean
  readonly currentPersistencePermissionState: PersistencePermissionReviewState | 'unknown'
  // Consent flags
  readonly explicitUserConsentCaptured: boolean
  readonly explicitUserIntentCaptured: boolean
  readonly explicitPersistenceActivationRequested: boolean
  readonly consentDecisionCollected: boolean
  readonly consentDecisionGranted: boolean
  readonly consentDecisionDenied: boolean
  readonly consentDecisionReviewPerformed: boolean
  // Permission flags
  readonly consentPermissionGranted: boolean
  readonly consentPermissionDenied: boolean
  readonly persistencePermissionGranted: boolean
  readonly persistencePermissionDenied: boolean
  // Authorization flags
  readonly authorizationReviewed: boolean
  readonly authorizationGranted: boolean
  readonly authorizationDenied: boolean
  // Activation flags
  readonly realActivationAllowed: boolean
  readonly persistenceEnabled: boolean
  readonly writeEnabled: boolean
  readonly writeAttempted: boolean
  readonly receiptWritten: boolean
  // Infrastructure flags
  readonly apiRouteCalled: boolean
  readonly dbClientUsed: boolean
  readonly storageUsed: boolean
  readonly schemaTouched: boolean
  // Mutation flags
  readonly programCardsChanged: boolean
  readonly startWorkoutChanged: boolean
  readonly liveWorkoutChanged: boolean
  readonly futureSessionMutationEnabled: boolean
  readonly completedSessionsProtected: boolean
  // Items and payload
  readonly persistencePermissionReviewItems: readonly PersistencePermissionReviewItem[]
  readonly persistencePermissionReviewSummary: PersistencePermissionReviewSummary
  readonly previewPayload: PersistencePermissionReviewPayload | null
}

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface PersistencePermissionReviewPreviewInput {
  readonly consentPermissionBoundaryPreviewModel?: ConsentPermissionBoundaryPreviewModel | null
}

// ============================================================================
// ITEM BUILDER
// ============================================================================

function buildPersistencePermissionReviewItems(): readonly PersistencePermissionReviewItem[] {
  return [
    {
      key: 'consent_boundary_verified',
      status: 'consent_permission_boundary_verified',
      label: 'Consent permission boundary verified',
      description: 'The consent permission boundary stage is complete and verified.',
      lockedNow: false,
      disabledNow: false,
      protectedNow: true,
    },
    {
      key: 'persistence_permission_required',
      status: 'persistence_permission_required_but_not_granted',
      label: 'Persistence permission required but not granted',
      description: 'Persistence permission is required before any write can occur, but has not been granted.',
      lockedNow: true,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'persistence_grant_locked',
      status: 'persistence_grant_path_locked',
      label: 'Persistence grant path locked',
      description: 'The path to grant persistence permission is locked until explicit approval.',
      lockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'persistence_deny_locked',
      status: 'persistence_deny_path_locked',
      label: 'Persistence deny path locked',
      description: 'The path to deny persistence permission is locked pending review.',
      lockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'write_authorization_blocked',
      status: 'write_authorization_still_blocked',
      label: 'Write authorization still blocked',
      description: 'Write authorization remains blocked until persistence permission is granted.',
      lockedNow: true,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'durable_receipt_disabled',
      status: 'durable_receipt_path_disabled',
      label: 'Durable receipt path disabled',
      description: 'Durable receipt writing is disabled until persistence is activated.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'api_route_disabled',
      status: 'api_route_disabled',
      label: 'API route disabled',
      description: 'No API routes will be called until persistence permission is granted.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'db_storage_disabled',
      status: 'db_storage_disabled',
      label: 'DB/storage disabled',
      description: 'Database and storage operations are disabled until persistence permission is granted.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'schema_mutation_disabled',
      status: 'schema_mutation_disabled',
      label: 'Schema mutation disabled',
      description: 'Schema mutations are disabled in this preview.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'program_cards_mutation_disabled',
      status: 'program_cards_mutation_disabled',
      label: 'Program Cards mutation disabled',
      description: 'Program Cards cannot be mutated until full persistence permission is granted.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: true,
    },
    {
      key: 'start_workout_mutation_disabled',
      status: 'start_workout_mutation_disabled',
      label: 'Start Workout mutation disabled',
      description: 'Start Workout cannot be mutated until full persistence permission is granted.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: true,
    },
    {
      key: 'live_workout_mutation_disabled',
      status: 'live_workout_mutation_disabled',
      label: 'Live Workout mutation disabled',
      description: 'Live Workout cannot be mutated until full persistence permission is granted.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: true,
    },
    {
      key: 'future_session_mutation_disabled',
      status: 'future_session_mutation_disabled',
      label: 'Future session mutation disabled',
      description: 'Future session mutation is disabled until persistence permission is granted.',
      lockedNow: false,
      disabledNow: true,
      protectedNow: true,
    },
    {
      key: 'completed_sessions_protected',
      status: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      description: 'Completed sessions remain protected and cannot be modified.',
      lockedNow: false,
      disabledNow: false,
      protectedNow: true,
    },
  ] as const
}

// ============================================================================
// SUMMARY BUILDER
// ============================================================================

function buildPersistencePermissionReviewSummary(
  items: readonly PersistencePermissionReviewItem[]
): PersistencePermissionReviewSummary {
  return {
    totalItems: items.length,
    consentBoundaryVerifiedItems: items.filter(i => i.status === 'consent_permission_boundary_verified').length,
    persistencePermissionRequiredItems: items.filter(i => i.status === 'persistence_permission_required_but_not_granted').length,
    persistenceGrantPathLockedItems: items.filter(i => i.status === 'persistence_grant_path_locked').length,
    persistenceDenyPathLockedItems: items.filter(i => i.status === 'persistence_deny_path_locked').length,
    writeAuthorizationBlockedItems: items.filter(i => i.status === 'write_authorization_still_blocked').length,
    durableReceiptDisabledItems: items.filter(i => i.status === 'durable_receipt_path_disabled').length,
    apiRouteDisabledItems: items.filter(i => i.status === 'api_route_disabled').length,
    dbStorageDisabledItems: items.filter(i => i.status === 'db_storage_disabled').length,
    schemaMutationDisabledItems: items.filter(i => i.status === 'schema_mutation_disabled').length,
    programCardsMutationDisabledItems: items.filter(i => i.status === 'program_cards_mutation_disabled').length,
    startWorkoutMutationDisabledItems: items.filter(i => i.status === 'start_workout_mutation_disabled').length,
    liveWorkoutMutationDisabledItems: items.filter(i => i.status === 'live_workout_mutation_disabled').length,
    futureSessionMutationDisabledItems: items.filter(i => i.status === 'future_session_mutation_disabled').length,
    completedSessionsProtectedItems: items.filter(i => i.status === 'completed_sessions_protected').length,
  }
}

// ============================================================================
// PAYLOAD BUILDER
// ============================================================================

function buildPersistencePermissionReviewPayload(
  sourceStatus: string
): PersistencePermissionReviewPayload {
  return {
    previewKind: 'persistence_permission_review_preview',
    sourceStep: 'MASTER-8C.62_AB20.4.55',
    sourceConsentPermissionBoundaryStatus: sourceStatus,
    currentMode: 'persistence_permission_review_only_persistence_disabled',
    currentPersistencePermissionState: 'persistence_permission_not_granted',
    // Consent flags - all false
    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionReviewPerformed: false,
    // Permission flags - all false
    consentPermissionGranted: false,
    consentPermissionDenied: false,
    persistencePermissionGranted: false,
    persistencePermissionDenied: false,
    // Authorization flags - all false
    authorizationReviewed: false,
    authorizationGranted: false,
    authorizationDenied: false,
    // Activation flags - all false
    realActivationAllowed: false,
    persistenceEnabled: false,
    writeEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    // Infrastructure flags - all false
    apiRouteCalled: false,
    dbClientUsed: false,
    storageUsed: false,
    schemaTouched: false,
    // Mutation flags - all false except completedSessionsProtected
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    // Future boundary awareness
    futurePersistenceWriteMustRequireExplicitPermission: true,
    futurePersistenceWriteMustNotInferFromReviewReadiness: true,
    futurePersistenceWriteMustPreserveCompletedSessions: true,
  }
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolvePersistencePermissionReviewPreview(
  input: PersistencePermissionReviewPreviewInput
): PersistencePermissionReviewPreviewModel {
  const { consentPermissionBoundaryPreviewModel } = input

  // Case 1: Missing consent permission boundary model
  if (!consentPermissionBoundaryPreviewModel) {
    return {
      status: 'unavailable_missing_consent_permission_boundary',
      mode: 'not_ready',
      headline: 'Persistence Permission Review Unavailable',
      summary: 'Cannot evaluate persistence permission review because consent permission boundary model is missing.',
      blockerSummary: ['Consent permission boundary model is required but not provided.'],
      nextRequiredStep: 'Provide consent permission boundary model first.',
      consentPermissionBoundaryVerified: false,
      persistencePermissionReviewReady: false,
      readyForFuturePersistenceWritePreflight: false,
      currentPersistencePermissionState: 'unknown',
      explicitUserConsentCaptured: false,
      explicitUserIntentCaptured: false,
      explicitPersistenceActivationRequested: false,
      consentDecisionCollected: false,
      consentDecisionGranted: false,
      consentDecisionDenied: false,
      consentDecisionReviewPerformed: false,
      consentPermissionGranted: false,
      consentPermissionDenied: false,
      persistencePermissionGranted: false,
      persistencePermissionDenied: false,
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
      persistencePermissionReviewItems: [],
      persistencePermissionReviewSummary: {
        totalItems: 0,
        consentBoundaryVerifiedItems: 0,
        persistencePermissionRequiredItems: 0,
        persistenceGrantPathLockedItems: 0,
        persistenceDenyPathLockedItems: 0,
        writeAuthorizationBlockedItems: 0,
        durableReceiptDisabledItems: 0,
        apiRouteDisabledItems: 0,
        dbStorageDisabledItems: 0,
        schemaMutationDisabledItems: 0,
        programCardsMutationDisabledItems: 0,
        startWorkoutMutationDisabledItems: 0,
        liveWorkoutMutationDisabledItems: 0,
        futureSessionMutationDisabledItems: 0,
        completedSessionsProtectedItems: 0,
      },
      previewPayload: null,
    }
  }

  // Case 2: Consent permission boundary not ready
  if (consentPermissionBoundaryPreviewModel.status !== 'consent_permission_boundary_ready_persistence_disabled') {
    return {
      status: 'blocked_consent_permission_boundary_not_ready',
      mode: 'not_ready',
      headline: 'Persistence Permission Review Blocked',
      summary: `Cannot proceed with persistence permission review because consent permission boundary is not ready. Current status: ${consentPermissionBoundaryPreviewModel.status}`,
      blockerSummary: [
        'Consent permission boundary must be ready before persistence permission review.',
        `Current consent permission boundary status: ${consentPermissionBoundaryPreviewModel.status}`,
      ],
      nextRequiredStep: 'Complete consent permission boundary stage first.',
      consentPermissionBoundaryVerified: false,
      persistencePermissionReviewReady: false,
      readyForFuturePersistenceWritePreflight: false,
      currentPersistencePermissionState: 'unknown',
      explicitUserConsentCaptured: false,
      explicitUserIntentCaptured: false,
      explicitPersistenceActivationRequested: false,
      consentDecisionCollected: false,
      consentDecisionGranted: false,
      consentDecisionDenied: false,
      consentDecisionReviewPerformed: false,
      consentPermissionGranted: false,
      consentPermissionDenied: false,
      persistencePermissionGranted: false,
      persistencePermissionDenied: false,
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
      persistencePermissionReviewItems: [],
      persistencePermissionReviewSummary: {
        totalItems: 0,
        consentBoundaryVerifiedItems: 0,
        persistencePermissionRequiredItems: 0,
        persistenceGrantPathLockedItems: 0,
        persistenceDenyPathLockedItems: 0,
        writeAuthorizationBlockedItems: 0,
        durableReceiptDisabledItems: 0,
        apiRouteDisabledItems: 0,
        dbStorageDisabledItems: 0,
        schemaMutationDisabledItems: 0,
        programCardsMutationDisabledItems: 0,
        startWorkoutMutationDisabledItems: 0,
        liveWorkoutMutationDisabledItems: 0,
        futureSessionMutationDisabledItems: 0,
        completedSessionsProtectedItems: 0,
      },
      previewPayload: null,
    }
  }

  // Case 3: Consent permission boundary is ready - build full review
  const items = buildPersistencePermissionReviewItems()
  const summary = buildPersistencePermissionReviewSummary(items)
  const payload = buildPersistencePermissionReviewPayload(consentPermissionBoundaryPreviewModel.status)

  return {
    status: 'persistence_permission_review_ready_persistence_disabled',
    mode: 'read_only_persistence_permission_review_preview',
    headline: 'Persistence Permission Review Ready',
    summary: 'Consent permission boundary is verified. Persistence permission review is ready but persistence permission has NOT been granted. All persistence, write, and mutation operations remain disabled. No API/DB/storage/schema calls. No Program Cards / Start Workout / Live Workout changes. Completed sessions protected.',
    blockerSummary: [
      'No future persistence write may run from review readiness alone.',
      'Explicit persistence permission grant is required before any write operation.',
      'Any future persistence write must require explicit permission and preserve completed sessions.',
    ],
    nextRequiredStep: 'MASTER-8C.63+ persistence write preflight / persistence still disabled unless official checklist explicitly enables writes.',
    consentPermissionBoundaryVerified: true,
    persistencePermissionReviewReady: true,
    readyForFuturePersistenceWritePreflight: true,
    currentPersistencePermissionState: 'persistence_permission_not_granted',
    // All consent/permission/activation flags remain false
    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentDecisionReviewPerformed: false,
    consentPermissionGranted: false,
    consentPermissionDenied: false,
    persistencePermissionGranted: false,
    persistencePermissionDenied: false,
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
    persistencePermissionReviewItems: items,
    persistencePermissionReviewSummary: summary,
    previewPayload: payload,
  }
}

// ============================================================================
// STATUS LABEL HELPERS
// ============================================================================

export function getPersistencePermissionReviewPreviewStatusLabel(
  status: PersistencePermissionReviewPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_consent_permission_boundary':
      return 'Unavailable - Missing Consent Permission Boundary'
    case 'blocked_consent_permission_boundary_not_ready':
      return 'Blocked - Consent Permission Boundary Not Ready'
    case 'persistence_permission_review_ready_persistence_disabled':
      return 'Persistence Permission Review Ready / Persistence Disabled'
  }
}

export function getPersistencePermissionReviewPreviewStatusColor(
  status: PersistencePermissionReviewPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_consent_permission_boundary':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_consent_permission_boundary_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'persistence_permission_review_ready_persistence_disabled':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
  }
}

// ============================================================================
// ITEM STATUS LABEL HELPERS
// ============================================================================

export function getPersistencePermissionReviewItemStatusLabel(
  status: PersistencePermissionReviewItemStatus
): string {
  switch (status) {
    case 'consent_permission_boundary_verified':
      return 'boundary verified'
    case 'persistence_permission_required_but_not_granted':
      return 'permission required'
    case 'persistence_grant_path_locked':
      return 'grant locked'
    case 'persistence_deny_path_locked':
      return 'deny locked'
    case 'write_authorization_still_blocked':
      return 'write blocked'
    case 'durable_receipt_path_disabled':
      return 'receipt disabled'
    case 'api_route_disabled':
      return 'API disabled'
    case 'db_storage_disabled':
      return 'DB disabled'
    case 'schema_mutation_disabled':
      return 'schema disabled'
    case 'program_cards_mutation_disabled':
      return 'cards disabled'
    case 'start_workout_mutation_disabled':
      return 'start disabled'
    case 'live_workout_mutation_disabled':
      return 'live disabled'
    case 'future_session_mutation_disabled':
      return 'future disabled'
    case 'completed_sessions_protected':
      return 'completed protected'
  }
}

export function getPersistencePermissionReviewItemStatusColor(
  status: PersistencePermissionReviewItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'consent_permission_boundary_verified':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-300' }
    case 'persistence_permission_required_but_not_granted':
      return { bg: 'bg-rose-500/20', text: 'text-rose-300' }
    case 'persistence_grant_path_locked':
      return { bg: 'bg-amber-500/20', text: 'text-amber-300' }
    case 'persistence_deny_path_locked':
      return { bg: 'bg-orange-500/20', text: 'text-orange-300' }
    case 'write_authorization_still_blocked':
      return { bg: 'bg-pink-500/20', text: 'text-pink-300' }
    case 'durable_receipt_path_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300' }
    case 'api_route_disabled':
      return { bg: 'bg-zinc-500/20', text: 'text-zinc-300' }
    case 'db_storage_disabled':
      return { bg: 'bg-neutral-500/20', text: 'text-neutral-300' }
    case 'schema_mutation_disabled':
      return { bg: 'bg-gray-500/20', text: 'text-gray-300' }
    case 'program_cards_mutation_disabled':
      return { bg: 'bg-stone-500/20', text: 'text-stone-300' }
    case 'start_workout_mutation_disabled':
      return { bg: 'bg-red-500/20', text: 'text-red-300' }
    case 'live_workout_mutation_disabled':
      return { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-300' }
    case 'future_session_mutation_disabled':
      return { bg: 'bg-purple-500/20', text: 'text-purple-300' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300' }
  }
}
