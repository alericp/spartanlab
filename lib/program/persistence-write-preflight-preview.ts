/**
 * Persistence Write Preflight Preview
 * MASTER-8C.63 / AB20.4.56 — Prompt 58 of 77
 *
 * Purpose:
 * Pure read-only model that consumes PersistencePermissionReviewPreviewModel and proves
 * that persistence write preflight is reviewed but still blocked/disabled because
 * persistence permission is not granted.
 *
 * Safety invariants:
 * - Pure/read-only only
 * - No localStorage/sessionStorage runtime usage
 * - No fetch/API/DB/storage calls
 * - No Date.now/Math.random runtime usage
 * - No window/document runtime usage
 * - No schema changes
 * - No mutation
 * - No broad any
 * - No TypeScript suppressions
 * - No Program Cards changed
 * - No Start Workout changed
 * - No Live Workout changed
 * - Completed sessions protected: true
 */

import type { PersistencePermissionReviewPreviewModel } from './persistence-permission-review-preview'

// -----------------------------------------------------------------------------
// Status Types
// -----------------------------------------------------------------------------

export type PersistenceWritePreflightPreviewStatus =
  | 'unavailable_missing_persistence_permission_review'
  | 'blocked_persistence_permission_review_not_ready'
  | 'persistence_write_preflight_ready_but_blocked_persistence_disabled'

export type PersistenceWritePreflightPreviewMode =
  | 'read_only_persistence_write_preflight_preview'
  | 'not_ready'

export type PersistenceWritePreflightState =
  | 'write_preflight_blocked_permission_not_granted'

export type PersistenceWritePreflightItemStatus =
  | 'permission_review_verified'
  | 'persistence_permission_not_granted'
  | 'write_preflight_blocked'
  | 'write_authorization_not_granted'
  | 'writer_factory_disabled'
  | 'durable_receipt_writer_disabled'
  | 'api_route_disabled'
  | 'db_storage_disabled'
  | 'schema_mutation_disabled'
  | 'program_cards_mutation_disabled'
  | 'start_workout_mutation_disabled'
  | 'live_workout_mutation_disabled'
  | 'future_session_mutation_disabled'
  | 'completed_sessions_protected'

// -----------------------------------------------------------------------------
// Item Type
// -----------------------------------------------------------------------------

export interface PersistenceWritePreflightItem {
  readonly key: string
  readonly status: PersistenceWritePreflightItemStatus
  readonly label: string
  readonly description: string
  readonly blockedNow: boolean
  readonly disabledNow: boolean
  readonly protectedNow: boolean
}

// -----------------------------------------------------------------------------
// Payload Type
// -----------------------------------------------------------------------------

export interface PersistenceWritePreflightPayload {
  readonly previewKind: 'persistence_write_preflight_preview'
  readonly sourceStep: 'MASTER-8C.63_AB20.4.56'
  readonly sourcePersistencePermissionReviewStatus: string
  readonly currentMode: 'persistence_write_preflight_only_persistence_disabled'
  readonly currentPersistenceWritePreflightState: 'write_preflight_blocked_permission_not_granted'
  // All real permission/write/mutation flags hard false
  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentPermissionGranted: false
  readonly consentPermissionDenied: false
  readonly persistencePermissionGranted: false
  readonly persistencePermissionDenied: false
  readonly writeAuthorizationReviewed: false
  readonly writeAuthorizationGranted: false
  readonly writeAuthorizationDenied: false
  readonly writerActivationAllowed: false
  readonly writerFactoryEnabled: false
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
  // Future constraints
  readonly futureWriterMustRequireExplicitPermission: true
  readonly futureWriterMustNotInferFromPreflightReadiness: true
  readonly futureWriterMustPreserveCompletedSessions: true
}

// -----------------------------------------------------------------------------
// Summary Type
// -----------------------------------------------------------------------------

export interface PersistenceWritePreflightSummary {
  readonly totalItems: number
  readonly permissionReviewVerifiedItems: number
  readonly persistencePermissionNotGrantedItems: number
  readonly writePreflightBlockedItems: number
  readonly writeAuthorizationNotGrantedItems: number
  readonly writerFactoryDisabledItems: number
  readonly durableReceiptDisabledItems: number
  readonly apiRouteDisabledItems: number
  readonly dbStorageDisabledItems: number
  readonly schemaDisabledItems: number
  readonly programCardsDisabledItems: number
  readonly startWorkoutDisabledItems: number
  readonly liveWorkoutDisabledItems: number
  readonly futureSessionDisabledItems: number
  readonly completedSessionsProtectedItems: number
}

// -----------------------------------------------------------------------------
// Model Type
// -----------------------------------------------------------------------------

export interface PersistenceWritePreflightPreviewModel {
  readonly status: PersistenceWritePreflightPreviewStatus
  readonly mode: PersistenceWritePreflightPreviewMode
  readonly headline: string
  readonly summary: string
  readonly persistencePermissionReviewVerified: boolean
  readonly persistenceWritePreflightReady: boolean
  readonly readyForFutureWriterActivationReview: boolean
  readonly currentPersistenceWritePreflightState: PersistenceWritePreflightState | null
  // All real flags hard false
  readonly explicitUserConsentCaptured: false
  readonly explicitUserIntentCaptured: false
  readonly explicitPersistenceActivationRequested: false
  readonly consentDecisionCollected: false
  readonly consentDecisionGranted: false
  readonly consentDecisionDenied: false
  readonly consentPermissionGranted: false
  readonly consentPermissionDenied: false
  readonly persistencePermissionGranted: false
  readonly persistencePermissionDenied: false
  readonly writeAuthorizationReviewed: false
  readonly writeAuthorizationGranted: false
  readonly writeAuthorizationDenied: false
  readonly writerActivationAllowed: false
  readonly writerFactoryEnabled: false
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
  // Items and summary
  readonly persistenceWritePreflightItems: readonly PersistenceWritePreflightItem[]
  readonly persistenceWritePreflightSummary: PersistenceWritePreflightSummary
  readonly previewPayload: PersistenceWritePreflightPayload | null
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string
}

// -----------------------------------------------------------------------------
// Input Type
// -----------------------------------------------------------------------------

export interface PersistenceWritePreflightPreviewInput {
  readonly persistencePermissionReviewPreviewModel: PersistencePermissionReviewPreviewModel | null | undefined
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolvePersistenceWritePreflightPreview(
  input: PersistenceWritePreflightPreviewInput
): PersistenceWritePreflightPreviewModel {
  const { persistencePermissionReviewPreviewModel } = input

  // Base safe flags - all false except completedSessionsProtected
  const baseSafeFlags = {
    explicitUserConsentCaptured: false as const,
    explicitUserIntentCaptured: false as const,
    explicitPersistenceActivationRequested: false as const,
    consentDecisionCollected: false as const,
    consentDecisionGranted: false as const,
    consentDecisionDenied: false as const,
    consentPermissionGranted: false as const,
    consentPermissionDenied: false as const,
    persistencePermissionGranted: false as const,
    persistencePermissionDenied: false as const,
    writeAuthorizationReviewed: false as const,
    writeAuthorizationGranted: false as const,
    writeAuthorizationDenied: false as const,
    writerActivationAllowed: false as const,
    writerFactoryEnabled: false as const,
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

  // Empty summary
  const emptySummary: PersistenceWritePreflightSummary = {
    totalItems: 0,
    permissionReviewVerifiedItems: 0,
    persistencePermissionNotGrantedItems: 0,
    writePreflightBlockedItems: 0,
    writeAuthorizationNotGrantedItems: 0,
    writerFactoryDisabledItems: 0,
    durableReceiptDisabledItems: 0,
    apiRouteDisabledItems: 0,
    dbStorageDisabledItems: 0,
    schemaDisabledItems: 0,
    programCardsDisabledItems: 0,
    startWorkoutDisabledItems: 0,
    liveWorkoutDisabledItems: 0,
    futureSessionDisabledItems: 0,
    completedSessionsProtectedItems: 0,
  }

  // Case 1: Missing persistence permission review model
  if (!persistencePermissionReviewPreviewModel) {
    return {
      status: 'unavailable_missing_persistence_permission_review',
      mode: 'not_ready',
      headline: 'Persistence Write Preflight Unavailable',
      summary: 'Cannot evaluate persistence write preflight because persistence permission review model is not available.',
      persistencePermissionReviewVerified: false,
      persistenceWritePreflightReady: false,
      readyForFutureWriterActivationReview: false,
      currentPersistenceWritePreflightState: null,
      ...baseSafeFlags,
      persistenceWritePreflightItems: [],
      persistenceWritePreflightSummary: emptySummary,
      previewPayload: null,
      blockerSummary: ['Persistence permission review model is missing or not initialized.'],
      nextRequiredStep: 'Initialize persistence permission review model first.',
    }
  }

  // Case 2: Source not ready
  if (persistencePermissionReviewPreviewModel.status !== 'persistence_permission_review_ready_persistence_disabled') {
    return {
      status: 'blocked_persistence_permission_review_not_ready',
      mode: 'not_ready',
      headline: 'Persistence Write Preflight Blocked',
      summary: 'Cannot evaluate persistence write preflight because persistence permission review is not ready.',
      persistencePermissionReviewVerified: false,
      persistenceWritePreflightReady: false,
      readyForFutureWriterActivationReview: false,
      currentPersistenceWritePreflightState: null,
      ...baseSafeFlags,
      persistenceWritePreflightItems: [],
      persistenceWritePreflightSummary: emptySummary,
      previewPayload: null,
      blockerSummary: [
        'Persistence permission review is not ready.',
        `Current persistence permission review status: ${persistencePermissionReviewPreviewModel.status}`,
      ],
      nextRequiredStep: 'Complete persistence permission review first.',
    }
  }

  // Case 3: Source is ready - create full preflight preview
  const items: PersistenceWritePreflightItem[] = [
    {
      key: 'permission_review_verified',
      status: 'permission_review_verified',
      label: 'Permission review verified',
      description: 'Persistence permission review has been verified and is ready.',
      blockedNow: false,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'persistence_permission_not_granted',
      status: 'persistence_permission_not_granted',
      label: 'Persistence permission not granted',
      description: 'Persistence permission has not been granted. No persistence is allowed.',
      blockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'write_preflight_blocked',
      status: 'write_preflight_blocked',
      label: 'Write preflight blocked',
      description: 'Write preflight remains blocked because persistence permission is not granted.',
      blockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'write_authorization_not_granted',
      status: 'write_authorization_not_granted',
      label: 'Write authorization not granted',
      description: 'Write authorization has not been granted. No write operations are allowed.',
      blockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'writer_factory_disabled',
      status: 'writer_factory_disabled',
      label: 'Writer factory disabled',
      description: 'Writer factory is disabled. No writer instances can be created.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'durable_receipt_writer_disabled',
      status: 'durable_receipt_writer_disabled',
      label: 'Durable receipt writer disabled',
      description: 'Durable receipt writer is disabled. No receipts can be written.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'api_route_disabled',
      status: 'api_route_disabled',
      label: 'API route disabled',
      description: 'API route is disabled. No API calls can be made.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'db_storage_disabled',
      status: 'db_storage_disabled',
      label: 'DB/storage disabled',
      description: 'Database and storage operations are disabled.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'schema_mutation_disabled',
      status: 'schema_mutation_disabled',
      label: 'Schema mutation disabled',
      description: 'Schema mutations are disabled. No schema changes can be made.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'program_cards_mutation_disabled',
      status: 'program_cards_mutation_disabled',
      label: 'Program Cards mutation disabled',
      description: 'Program Cards mutations are disabled. No Program Card changes.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'start_workout_mutation_disabled',
      status: 'start_workout_mutation_disabled',
      label: 'Start Workout mutation disabled',
      description: 'Start Workout mutations are disabled. No Start Workout changes.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'live_workout_mutation_disabled',
      status: 'live_workout_mutation_disabled',
      label: 'Live Workout mutation disabled',
      description: 'Live Workout mutations are disabled. No Live Workout changes.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'future_session_mutation_disabled',
      status: 'future_session_mutation_disabled',
      label: 'Future session mutation disabled',
      description: 'Future session mutations are disabled. No future session changes.',
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'completed_sessions_protected',
      status: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      description: 'Completed sessions remain protected and immutable.',
      blockedNow: false,
      disabledNow: false,
      protectedNow: true,
    },
  ]

  // Build summary from items
  const summary: PersistenceWritePreflightSummary = {
    totalItems: items.length,
    permissionReviewVerifiedItems: items.filter(i => i.status === 'permission_review_verified').length,
    persistencePermissionNotGrantedItems: items.filter(i => i.status === 'persistence_permission_not_granted').length,
    writePreflightBlockedItems: items.filter(i => i.status === 'write_preflight_blocked').length,
    writeAuthorizationNotGrantedItems: items.filter(i => i.status === 'write_authorization_not_granted').length,
    writerFactoryDisabledItems: items.filter(i => i.status === 'writer_factory_disabled').length,
    durableReceiptDisabledItems: items.filter(i => i.status === 'durable_receipt_writer_disabled').length,
    apiRouteDisabledItems: items.filter(i => i.status === 'api_route_disabled').length,
    dbStorageDisabledItems: items.filter(i => i.status === 'db_storage_disabled').length,
    schemaDisabledItems: items.filter(i => i.status === 'schema_mutation_disabled').length,
    programCardsDisabledItems: items.filter(i => i.status === 'program_cards_mutation_disabled').length,
    startWorkoutDisabledItems: items.filter(i => i.status === 'start_workout_mutation_disabled').length,
    liveWorkoutDisabledItems: items.filter(i => i.status === 'live_workout_mutation_disabled').length,
    futureSessionDisabledItems: items.filter(i => i.status === 'future_session_mutation_disabled').length,
    completedSessionsProtectedItems: items.filter(i => i.status === 'completed_sessions_protected').length,
  }

  // Build payload
  const payload: PersistenceWritePreflightPayload = {
    previewKind: 'persistence_write_preflight_preview',
    sourceStep: 'MASTER-8C.63_AB20.4.56',
    sourcePersistencePermissionReviewStatus: persistencePermissionReviewPreviewModel.status,
    currentMode: 'persistence_write_preflight_only_persistence_disabled',
    currentPersistenceWritePreflightState: 'write_preflight_blocked_permission_not_granted',
    explicitUserConsentCaptured: false,
    explicitUserIntentCaptured: false,
    explicitPersistenceActivationRequested: false,
    consentDecisionCollected: false,
    consentDecisionGranted: false,
    consentDecisionDenied: false,
    consentPermissionGranted: false,
    consentPermissionDenied: false,
    persistencePermissionGranted: false,
    persistencePermissionDenied: false,
    writeAuthorizationReviewed: false,
    writeAuthorizationGranted: false,
    writeAuthorizationDenied: false,
    writerActivationAllowed: false,
    writerFactoryEnabled: false,
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
    futureWriterMustRequireExplicitPermission: true,
    futureWriterMustNotInferFromPreflightReadiness: true,
    futureWriterMustPreserveCompletedSessions: true,
  }

  return {
    status: 'persistence_write_preflight_ready_but_blocked_persistence_disabled',
    mode: 'read_only_persistence_write_preflight_preview',
    headline: 'Persistence Write Preflight Ready / Blocked',
    summary: 'Persistence permission review is verified, but write preflight remains blocked because persistence permission is not granted. No writer can activate, no receipt can be written, and no Program Cards / Start Workout / Live Workout can mutate.',
    persistencePermissionReviewVerified: true,
    persistenceWritePreflightReady: true,
    readyForFutureWriterActivationReview: true,
    currentPersistenceWritePreflightState: 'write_preflight_blocked_permission_not_granted',
    ...baseSafeFlags,
    persistenceWritePreflightItems: items,
    persistenceWritePreflightSummary: summary,
    previewPayload: payload,
    blockerSummary: [
      'Persistence permission is not granted.',
      'Write authorization is not granted.',
      'Writer factory remains disabled.',
      'No writer may activate from preflight readiness alone.',
    ],
    nextRequiredStep: 'MASTER-8C.64+ writer activation review / persistence still disabled unless official checklist explicitly enables writes.',
  }
}

// -----------------------------------------------------------------------------
// Label Helpers
// -----------------------------------------------------------------------------

export function getPersistenceWritePreflightPreviewStatusLabel(
  status: PersistenceWritePreflightPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_persistence_permission_review':
      return 'Unavailable — Missing Permission Review'
    case 'blocked_persistence_permission_review_not_ready':
      return 'Blocked — Permission Review Not Ready'
    case 'persistence_write_preflight_ready_but_blocked_persistence_disabled':
      return 'Write Preflight Ready / Blocked — Persistence Disabled'
  }
}

export function getPersistenceWritePreflightItemStatusLabel(
  status: PersistenceWritePreflightItemStatus
): string {
  switch (status) {
    case 'permission_review_verified':
      return 'Review Verified'
    case 'persistence_permission_not_granted':
      return 'Permission Not Granted'
    case 'write_preflight_blocked':
      return 'Preflight Blocked'
    case 'write_authorization_not_granted':
      return 'Auth Not Granted'
    case 'writer_factory_disabled':
      return 'Factory Disabled'
    case 'durable_receipt_writer_disabled':
      return 'Receipt Disabled'
    case 'api_route_disabled':
      return 'API Disabled'
    case 'db_storage_disabled':
      return 'DB Disabled'
    case 'schema_mutation_disabled':
      return 'Schema Disabled'
    case 'program_cards_mutation_disabled':
      return 'Cards Disabled'
    case 'start_workout_mutation_disabled':
      return 'Start Disabled'
    case 'live_workout_mutation_disabled':
      return 'Live Disabled'
    case 'future_session_mutation_disabled':
      return 'Future Disabled'
    case 'completed_sessions_protected':
      return 'Protected'
  }
}

// -----------------------------------------------------------------------------
// Color Helpers
// -----------------------------------------------------------------------------

export function getPersistenceWritePreflightPreviewStatusColor(
  status: PersistenceWritePreflightPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_persistence_permission_review':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_persistence_permission_review_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'persistence_write_preflight_ready_but_blocked_persistence_disabled':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400/70',
        border: 'border-teal-500/20',
      }
  }
}

export function getPersistenceWritePreflightItemStatusColor(
  status: PersistenceWritePreflightItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'permission_review_verified':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400/70' }
    case 'persistence_permission_not_granted':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'write_preflight_blocked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'write_authorization_not_granted':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400/70' }
    case 'writer_factory_disabled':
      return { bg: 'bg-pink-500/10', text: 'text-pink-400/70' }
    case 'durable_receipt_writer_disabled':
      return { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400/70' }
    case 'api_route_disabled':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400/70' }
    case 'db_storage_disabled':
      return { bg: 'bg-neutral-500/10', text: 'text-neutral-400/70' }
    case 'schema_mutation_disabled':
      return { bg: 'bg-stone-500/10', text: 'text-stone-400/70' }
    case 'program_cards_mutation_disabled':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
    case 'start_workout_mutation_disabled':
      return { bg: 'bg-gray-500/10', text: 'text-gray-400/70' }
    case 'live_workout_mutation_disabled':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400/70' }
    case 'future_session_mutation_disabled':
      return { bg: 'bg-neutral-500/10', text: 'text-neutral-400/70' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70' }
  }
}
