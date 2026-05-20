/**
 * Persistence Writer Activation Review Preview
 * MASTER-8C.64 / AB20.4.57
 * 
 * Pure read-only model that consumes the Prompt 58 PersistenceWritePreflightPreviewModel
 * and proves that persistence writer activation has been reviewed but is NOT allowed.
 * 
 * CRITICAL DISTINCTION:
 * - Preflight reviewed ≠ writer activation allowed
 * - Writer activation review ready ≠ persistence enabled
 * - No write path exists in this step
 * 
 * SAFETY INVARIANTS:
 * - Pure/read-only only
 * - No localStorage/sessionStorage runtime usage
 * - No fetch/API/DB/storage calls
 * - No Date.now/Math.random runtime usage
 * - No window/document runtime usage
 * - No schema changes
 * - No mutation
 * - No broad any
 * - No TypeScript suppressions
 * - writerActivationAllowed: false (always)
 * - writerFactoryEnabled: false (always)
 * - persistenceEnabled: false (always)
 * - writeEnabled: false (always)
 * - writeAttempted: false (always)
 * - receiptWritten: false (always)
 * - apiRouteCalled: false (always)
 * - dbClientUsed: false (always)
 * - storageUsed: false (always)
 * - schemaTouched: false (always)
 * - programCardsChanged: false (always)
 * - startWorkoutChanged: false (always)
 * - liveWorkoutChanged: false (always)
 * - futureSessionMutationEnabled: false (always)
 * - completedSessionsProtected: true (always)
 */

import type { PersistenceWritePreflightPreviewModel } from './persistence-write-preflight-preview'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type PersistenceWriterActivationReviewPreviewStatus =
  | 'unavailable_missing_persistence_write_preflight'
  | 'blocked_persistence_write_preflight_not_ready'
  | 'persistence_writer_activation_review_ready_persistence_disabled'

export type PersistenceWriterActivationReviewPreviewMode =
  | 'read_only_writer_activation_review_preview'
  | 'not_ready'

export type PersistenceWriterActivationReviewState =
  | 'writer_activation_reviewed_but_not_allowed'

export type PersistenceWriterActivationReviewItemStatus =
  | 'preflight_verified'
  | 'persistence_permission_not_granted'
  | 'write_authorization_not_granted'
  | 'writer_activation_reviewed'
  | 'writer_activation_not_allowed'
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

// ============================================================================
// ITEM TYPE
// ============================================================================

export interface PersistenceWriterActivationReviewItem {
  readonly key: string
  readonly status: PersistenceWriterActivationReviewItemStatus
  readonly label: string
  readonly reviewedNow: boolean
  readonly blockedNow: boolean
  readonly disabledNow: boolean
  readonly protectedNow: boolean
}

// ============================================================================
// PAYLOAD TYPE
// ============================================================================

export interface PersistenceWriterActivationReviewPayload {
  readonly previewKind: 'persistence_writer_activation_review_preview'
  readonly sourceStep: 'MASTER-8C.64_AB20.4.57'
  readonly sourcePersistenceWritePreflightStatus: string
  readonly currentMode: 'writer_activation_review_only_persistence_disabled'
  readonly currentWriterActivationReviewState: 'writer_activation_reviewed_but_not_allowed'
  
  // All real permission/activation/write/mutation flags false
  readonly persistencePermissionGranted: false
  readonly persistencePermissionDenied: false
  readonly writeAuthorizationGranted: false
  readonly writeAuthorizationDenied: false
  readonly writerActivationReviewed: boolean
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
  
  // Future safety invariants
  readonly futureWriterMustRequireExplicitActivationPermission: true
  readonly futureWriterMustNotInferActivationFromPreflight: true
  readonly futureWriterMustPreserveCompletedSessions: true
  readonly futureWriterMustWriteReceiptBeforeAnyRealMutation: true
}

// ============================================================================
// SUMMARY TYPE
// ============================================================================

export interface PersistenceWriterActivationReviewSummary {
  readonly totalItems: number
  readonly preflightVerifiedItems: number
  readonly writerActivationReviewedItems: number
  readonly writerActivationNotAllowedItems: number
  readonly writerFactoryDisabledItems: number
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

export interface PersistenceWriterActivationReviewPreviewModel {
  readonly status: PersistenceWriterActivationReviewPreviewStatus
  readonly mode: PersistenceWriterActivationReviewPreviewMode
  readonly headline: string
  readonly summary: string
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string
  
  // Review flags
  readonly persistenceWritePreflightVerified: boolean
  readonly writerActivationReviewed: boolean
  readonly writerActivationReviewReady: boolean
  readonly readyForFutureWriterActivationPermission: boolean
  readonly currentWriterActivationReviewState: PersistenceWriterActivationReviewState | null
  
  // All real action flags hard false
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
  readonly writerActivationReviewItems: readonly PersistenceWriterActivationReviewItem[]
  readonly writerActivationReviewSummary: PersistenceWriterActivationReviewSummary
  
  // Payload
  readonly previewPayload: PersistenceWriterActivationReviewPayload | null
}

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface PersistenceWriterActivationReviewPreviewInput {
  readonly persistenceWritePreflightPreviewModel: PersistenceWritePreflightPreviewModel | null | undefined
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createWriterActivationReviewItems(
  preflightVerified: boolean,
  activationReviewed: boolean
): PersistenceWriterActivationReviewItem[] {
  return [
    {
      key: 'preflight_verified',
      status: 'preflight_verified',
      label: 'Persistence write preflight verified',
      reviewedNow: preflightVerified,
      blockedNow: false,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'persistence_permission_not_granted',
      status: 'persistence_permission_not_granted',
      label: 'Persistence permission not granted',
      reviewedNow: false,
      blockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'write_authorization_not_granted',
      status: 'write_authorization_not_granted',
      label: 'Write authorization not granted',
      reviewedNow: false,
      blockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'writer_activation_reviewed',
      status: 'writer_activation_reviewed',
      label: 'Writer activation has been reviewed',
      reviewedNow: activationReviewed,
      blockedNow: false,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'writer_activation_not_allowed',
      status: 'writer_activation_not_allowed',
      label: 'Writer activation not allowed',
      reviewedNow: false,
      blockedNow: true,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'writer_factory_disabled',
      status: 'writer_factory_disabled',
      label: 'Writer factory disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'durable_receipt_writer_disabled',
      status: 'durable_receipt_writer_disabled',
      label: 'Durable receipt writer disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'api_route_disabled',
      status: 'api_route_disabled',
      label: 'API route disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'db_storage_disabled',
      status: 'db_storage_disabled',
      label: 'DB/storage disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'schema_mutation_disabled',
      status: 'schema_mutation_disabled',
      label: 'Schema mutation disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'program_cards_mutation_disabled',
      status: 'program_cards_mutation_disabled',
      label: 'Program cards mutation disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'start_workout_mutation_disabled',
      status: 'start_workout_mutation_disabled',
      label: 'Start workout mutation disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'live_workout_mutation_disabled',
      status: 'live_workout_mutation_disabled',
      label: 'Live workout mutation disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'future_session_mutation_disabled',
      status: 'future_session_mutation_disabled',
      label: 'Future session mutation disabled',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'completed_sessions_protected',
      status: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      reviewedNow: false,
      blockedNow: false,
      disabledNow: false,
      protectedNow: true,
    },
  ]
}

function computeWriterActivationReviewSummary(
  items: readonly PersistenceWriterActivationReviewItem[]
): PersistenceWriterActivationReviewSummary {
  return {
    totalItems: items.length,
    preflightVerifiedItems: items.filter(i => i.status === 'preflight_verified').length,
    writerActivationReviewedItems: items.filter(i => i.status === 'writer_activation_reviewed').length,
    writerActivationNotAllowedItems: items.filter(i => i.status === 'writer_activation_not_allowed').length,
    writerFactoryDisabledItems: items.filter(i => i.status === 'writer_factory_disabled').length,
    durableReceiptDisabledItems: items.filter(i => i.status === 'durable_receipt_writer_disabled').length,
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
// RESOLVER
// ============================================================================

export function resolvePersistenceWriterActivationReviewPreview(
  input: PersistenceWriterActivationReviewPreviewInput
): PersistenceWriterActivationReviewPreviewModel {
  const { persistenceWritePreflightPreviewModel } = input
  
  // Case 1: Missing persistence write preflight model
  if (!persistenceWritePreflightPreviewModel) {
    const items = createWriterActivationReviewItems(false, false)
    return {
      status: 'unavailable_missing_persistence_write_preflight',
      mode: 'not_ready',
      headline: 'Writer Activation Review Unavailable',
      summary: 'Cannot review writer activation because persistence write preflight model is missing.',
      blockerSummary: ['Persistence write preflight model is required but missing'],
      nextRequiredStep: 'Provide persistence write preflight model first',
      
      persistenceWritePreflightVerified: false,
      writerActivationReviewed: false,
      writerActivationReviewReady: false,
      readyForFutureWriterActivationPermission: false,
      currentWriterActivationReviewState: null,
      
      // All real action flags hard false
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
      
      writerActivationReviewItems: items,
      writerActivationReviewSummary: computeWriterActivationReviewSummary(items),
      previewPayload: null,
    }
  }
  
  // Case 2: Preflight not in the expected ready-but-blocked state
  if (persistenceWritePreflightPreviewModel.status !== 'persistence_write_preflight_ready_but_blocked_persistence_disabled') {
    const items = createWriterActivationReviewItems(false, false)
    return {
      status: 'blocked_persistence_write_preflight_not_ready',
      mode: 'not_ready',
      headline: 'Writer Activation Review Blocked',
      summary: `Cannot proceed with writer activation review because persistence write preflight is not ready. Current preflight status: ${persistenceWritePreflightPreviewModel.status}`,
      blockerSummary: [
        'Persistence write preflight must be in ready-but-blocked state',
        `Current preflight status: ${persistenceWritePreflightPreviewModel.status}`,
      ],
      nextRequiredStep: 'Complete persistence write preflight review first',
      
      persistenceWritePreflightVerified: false,
      writerActivationReviewed: false,
      writerActivationReviewReady: false,
      readyForFutureWriterActivationPermission: false,
      currentWriterActivationReviewState: null,
      
      // All real action flags hard false
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
      
      writerActivationReviewItems: items,
      writerActivationReviewSummary: computeWriterActivationReviewSummary(items),
      previewPayload: null,
    }
  }
  
  // Case 3: Preflight is ready and blocked - writer activation review is ready but disabled
  const items = createWriterActivationReviewItems(true, true)
  const summary = computeWriterActivationReviewSummary(items)
  
  return {
    status: 'persistence_writer_activation_review_ready_persistence_disabled',
    mode: 'read_only_writer_activation_review_preview',
    headline: 'Persistence Writer Activation Review Ready / Disabled',
    summary: 'Persistence write preflight has been reviewed, but writer activation remains disabled because no explicit writer activation permission has been granted. No persistence, receipt, API, DB, storage, schema, Program Card, Start Workout, Live Workout, or future-session mutation is enabled.',
    blockerSummary: [
      'Writer activation review is complete but activation is not allowed',
      'No explicit writer activation permission has been granted',
      'Preflight readiness does not imply activation permission',
      'No writer factory may be enabled from this state',
    ],
    nextRequiredStep: 'MASTER-8C.65+ next writer/persistence boundary / persistence still disabled unless official checklist explicitly enables writes',
    
    persistenceWritePreflightVerified: true,
    writerActivationReviewed: true,
    writerActivationReviewReady: true,
    readyForFutureWriterActivationPermission: true,
    currentWriterActivationReviewState: 'writer_activation_reviewed_but_not_allowed',
    
    // All real action flags hard false
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
    
    writerActivationReviewItems: items,
    writerActivationReviewSummary: summary,
    previewPayload: {
      previewKind: 'persistence_writer_activation_review_preview',
      sourceStep: 'MASTER-8C.64_AB20.4.57',
      sourcePersistenceWritePreflightStatus: persistenceWritePreflightPreviewModel.status,
      currentMode: 'writer_activation_review_only_persistence_disabled',
      currentWriterActivationReviewState: 'writer_activation_reviewed_but_not_allowed',
      
      persistencePermissionGranted: false,
      persistencePermissionDenied: false,
      writeAuthorizationGranted: false,
      writeAuthorizationDenied: false,
      writerActivationReviewed: true,
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
      
      futureWriterMustRequireExplicitActivationPermission: true,
      futureWriterMustNotInferActivationFromPreflight: true,
      futureWriterMustPreserveCompletedSessions: true,
      futureWriterMustWriteReceiptBeforeAnyRealMutation: true,
    },
  }
}

// ============================================================================
// LABEL HELPERS
// ============================================================================

export function getPersistenceWriterActivationReviewPreviewStatusLabel(
  status: PersistenceWriterActivationReviewPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_persistence_write_preflight':
      return 'Unavailable - Missing Preflight'
    case 'blocked_persistence_write_preflight_not_ready':
      return 'Blocked - Preflight Not Ready'
    case 'persistence_writer_activation_review_ready_persistence_disabled':
      return 'Activation Review Ready / Persistence Disabled'
  }
}

export function getPersistenceWriterActivationReviewPreviewStatusColor(
  status: PersistenceWriterActivationReviewPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_persistence_write_preflight':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
    case 'blocked_persistence_write_preflight_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'persistence_writer_activation_review_ready_persistence_disabled':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70', border: 'border-violet-500/20' }
  }
}

export function getPersistenceWriterActivationReviewItemStatusLabel(
  status: PersistenceWriterActivationReviewItemStatus
): string {
  switch (status) {
    case 'preflight_verified':
      return 'preflight verified'
    case 'persistence_permission_not_granted':
      return 'permission not granted'
    case 'write_authorization_not_granted':
      return 'auth not granted'
    case 'writer_activation_reviewed':
      return 'activation reviewed'
    case 'writer_activation_not_allowed':
      return 'activation not allowed'
    case 'writer_factory_disabled':
      return 'factory disabled'
    case 'durable_receipt_writer_disabled':
      return 'receipt disabled'
    case 'api_route_disabled':
      return 'api disabled'
    case 'db_storage_disabled':
      return 'db disabled'
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

export function getPersistenceWriterActivationReviewItemStatusColor(
  status: PersistenceWriterActivationReviewItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'preflight_verified':
      return { bg: 'bg-violet-500/20', text: 'text-violet-300/80' }
    case 'persistence_permission_not_granted':
      return { bg: 'bg-rose-500/20', text: 'text-rose-300/80' }
    case 'write_authorization_not_granted':
      return { bg: 'bg-orange-500/20', text: 'text-orange-300/80' }
    case 'writer_activation_reviewed':
      return { bg: 'bg-violet-500/20', text: 'text-violet-300/80' }
    case 'writer_activation_not_allowed':
      return { bg: 'bg-rose-500/20', text: 'text-rose-300/80' }
    case 'writer_factory_disabled':
      return { bg: 'bg-pink-500/20', text: 'text-pink-300/80' }
    case 'durable_receipt_writer_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'api_route_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'db_storage_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'schema_mutation_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'program_cards_mutation_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'start_workout_mutation_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'live_workout_mutation_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'future_session_mutation_disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-300/80' }
    case 'completed_sessions_protected':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300/80' }
  }
}
