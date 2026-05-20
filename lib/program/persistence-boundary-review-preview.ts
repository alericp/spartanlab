/**
 * Persistence Boundary Review Preview
 * MASTER-8C.65 / AB20.4.58 / Prompt 60 of 78
 * 
 * Pure read-only preview that reviews the persistence boundary after writer activation review.
 * This step confirms the activation review was completed but does NOT open the real writer boundary.
 * 
 * HARD INVARIANTS:
 * - No real writer boundary opened
 * - No writer factory enabled
 * - No persistence enabled
 * - No write enabled/attempted
 * - No receipt written
 * - No API/DB/storage/schema touched
 * - No Program Cards / Start Workout / Live Workout changes
 * - No future session mutation
 * - Completed sessions remain protected
 */

import type { PersistenceWriterActivationReviewPreviewModel } from './persistence-writer-activation-review-preview'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type PersistenceBoundaryReviewPreviewStatus =
  | 'boundary_review_ready'
  | 'boundary_review_complete'
  | 'boundary_review_blocked'
  | 'boundary_review_pending'

export type PersistenceBoundaryReviewPreviewMode =
  | 'readonly_boundary_review'
  | 'boundary_review_blocked'

export type PersistenceBoundaryReviewState =
  | 'activation_review_verified'
  | 'boundary_review_in_progress'
  | 'boundary_review_complete'
  | 'boundary_blocked'

export type PersistenceBoundaryReviewItemStatus =
  | 'activation_review_verified'
  | 'boundary_reviewed'
  | 'boundary_not_opened'
  | 'boundary_blocked'
  | 'writer_disabled'
  | 'persistence_disabled'
  | 'write_disabled'
  | 'receipt_blocked'
  | 'api_blocked'
  | 'db_blocked'
  | 'storage_blocked'
  | 'schema_protected'
  | 'program_protected'
  | 'workout_protected'
  | 'future_session_protected'
  | 'completed_session_protected'

// ============================================================================
// ITEM INTERFACE
// ============================================================================

export interface PersistenceBoundaryReviewItem {
  readonly key: string
  readonly label: string
  readonly status: PersistenceBoundaryReviewItemStatus
  readonly activationReviewVerifiedNow: boolean
  readonly boundaryReviewedNow: boolean
  readonly blockedNow: boolean
  readonly disabledNow: boolean
  readonly protectedNow: boolean
}

// ============================================================================
// PAYLOAD INTERFACE
// ============================================================================

export interface PersistenceBoundaryReviewPayload {
  readonly previewKind: 'persistence_boundary_review_preview'
  readonly sourceWriterActivationReviewStatus: string
  readonly currentMode: PersistenceBoundaryReviewPreviewMode
  readonly currentBoundaryReviewState: PersistenceBoundaryReviewState | null
  readonly previousWriterActivationReviewVerified: boolean
  readonly boundaryReviewed: boolean
  readonly realWriterBoundaryOpened: false
  readonly writerFactoryEnabled: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly completedSessionsProtected: true
}

// ============================================================================
// SUMMARY INTERFACE
// ============================================================================

export interface PersistenceBoundaryReviewSummary {
  readonly totalItems: number
  readonly activationReviewVerifiedItems: number
  readonly boundaryReviewedItems: number
  readonly boundaryNotOpenedItems: number
  readonly writerDisabledItems: number
  readonly persistenceDisabledItems: number
  readonly writeDisabledItems: number
  readonly completedSessionsProtectedItems: number
}

// ============================================================================
// MODEL INTERFACE
// ============================================================================

export interface PersistenceBoundaryReviewPreviewModel {
  readonly status: PersistenceBoundaryReviewPreviewStatus
  readonly mode: PersistenceBoundaryReviewPreviewMode
  readonly headline: string
  readonly summary: string
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string
  
  // Review flags
  readonly previousWriterActivationReviewVerified: boolean
  readonly boundaryReviewed: boolean
  readonly boundaryReviewReady: boolean
  readonly currentBoundaryReviewState: PersistenceBoundaryReviewState | null
  
  // All real action flags hard false
  readonly realWriterBoundaryOpened: false
  readonly writerFactoryEnabled: false
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
  readonly boundaryReviewItems: readonly PersistenceBoundaryReviewItem[]
  readonly boundaryReviewSummary: PersistenceBoundaryReviewSummary
  
  // Payload
  readonly previewPayload: PersistenceBoundaryReviewPayload | null
}

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface PersistenceBoundaryReviewPreviewInput {
  readonly persistenceWriterActivationReviewPreviewModel: PersistenceWriterActivationReviewPreviewModel | null | undefined
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createBoundaryReviewItems(
  activationReviewVerified: boolean,
): readonly PersistenceBoundaryReviewItem[] {
  const items: PersistenceBoundaryReviewItem[] = []
  
  // Activation review verification
  items.push({
    key: 'activation_review_verified',
    label: 'Previous writer activation review verified',
    status: activationReviewVerified ? 'activation_review_verified' : 'boundary_blocked',
    activationReviewVerifiedNow: activationReviewVerified,
    boundaryReviewedNow: false,
    blockedNow: !activationReviewVerified,
    disabledNow: false,
    protectedNow: false,
  })
  
  // Boundary review status
  items.push({
    key: 'boundary_reviewed',
    label: 'Persistence boundary reviewed',
    status: activationReviewVerified ? 'boundary_reviewed' : 'boundary_blocked',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: activationReviewVerified,
    blockedNow: !activationReviewVerified,
    disabledNow: false,
    protectedNow: false,
  })
  
  // Real boundary not opened
  items.push({
    key: 'real_boundary_not_opened',
    label: 'Real writer boundary opened',
    status: 'boundary_not_opened',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // Writer factory disabled
  items.push({
    key: 'writer_factory_disabled',
    label: 'Writer factory enabled',
    status: 'writer_disabled',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // Persistence disabled
  items.push({
    key: 'persistence_disabled',
    label: 'Persistence enabled',
    status: 'persistence_disabled',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // Write disabled
  items.push({
    key: 'write_disabled',
    label: 'Write enabled',
    status: 'write_disabled',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // Write attempted
  items.push({
    key: 'write_attempted',
    label: 'Write attempted',
    status: 'write_disabled',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // Receipt blocked
  items.push({
    key: 'receipt_blocked',
    label: 'Receipt written',
    status: 'receipt_blocked',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // API blocked
  items.push({
    key: 'api_blocked',
    label: 'API route called',
    status: 'api_blocked',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // DB blocked
  items.push({
    key: 'db_blocked',
    label: 'DB client used',
    status: 'db_blocked',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // Storage blocked
  items.push({
    key: 'storage_blocked',
    label: 'Storage used',
    status: 'storage_blocked',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // Schema protected
  items.push({
    key: 'schema_protected',
    label: 'Schema touched',
    status: 'schema_protected',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // Program Cards protected
  items.push({
    key: 'program_cards_protected',
    label: 'Program Cards changed',
    status: 'program_protected',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // Start Workout protected
  items.push({
    key: 'start_workout_protected',
    label: 'Start Workout changed',
    status: 'workout_protected',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // Live Workout protected
  items.push({
    key: 'live_workout_protected',
    label: 'Live Workout changed',
    status: 'workout_protected',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // Future session mutation protected
  items.push({
    key: 'future_session_protected',
    label: 'Future session mutation enabled',
    status: 'future_session_protected',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // Completed sessions protected
  items.push({
    key: 'completed_sessions_protected',
    label: 'Completed sessions protected',
    status: 'completed_session_protected',
    activationReviewVerifiedNow: false,
    boundaryReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  return items
}

function createBoundaryReviewSummary(
  items: readonly PersistenceBoundaryReviewItem[],
): PersistenceBoundaryReviewSummary {
  return {
    totalItems: items.length,
    activationReviewVerifiedItems: items.filter(i => i.activationReviewVerifiedNow).length,
    boundaryReviewedItems: items.filter(i => i.boundaryReviewedNow).length,
    boundaryNotOpenedItems: items.filter(i => i.status === 'boundary_not_opened').length,
    writerDisabledItems: items.filter(i => i.status === 'writer_disabled').length,
    persistenceDisabledItems: items.filter(i => i.status === 'persistence_disabled').length,
    writeDisabledItems: items.filter(i => i.status === 'write_disabled').length,
    completedSessionsProtectedItems: items.filter(i => i.status === 'completed_session_protected').length,
  }
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

export function resolvePersistenceBoundaryReviewPreview(
  input: PersistenceBoundaryReviewPreviewInput,
): PersistenceBoundaryReviewPreviewModel {
  const { persistenceWriterActivationReviewPreviewModel } = input
  
  // Check if previous step is ready
  const activationReviewReady = persistenceWriterActivationReviewPreviewModel != null &&
    persistenceWriterActivationReviewPreviewModel.writerActivationReviewed === true &&
    persistenceWriterActivationReviewPreviewModel.writerActivationReviewReady === true
  
  const activationReviewVerified = activationReviewReady
  const boundaryReviewed = activationReviewVerified
  const boundaryReviewReady = boundaryReviewed
  
  // Determine status
  const status: PersistenceBoundaryReviewPreviewStatus = !activationReviewVerified
    ? 'boundary_review_blocked'
    : boundaryReviewed
      ? 'boundary_review_complete'
      : 'boundary_review_ready'
  
  // Determine mode
  const mode: PersistenceBoundaryReviewPreviewMode = !activationReviewVerified
    ? 'boundary_review_blocked'
    : 'readonly_boundary_review'
  
  // Determine state
  const currentBoundaryReviewState: PersistenceBoundaryReviewState | null = !activationReviewVerified
    ? 'boundary_blocked'
    : boundaryReviewed
      ? 'boundary_review_complete'
      : 'boundary_review_in_progress'
  
  // Create items and summary
  const boundaryReviewItems = createBoundaryReviewItems(activationReviewVerified)
  const boundaryReviewSummary = createBoundaryReviewSummary(boundaryReviewItems)
  
  // Blockers
  const blockerSummary: string[] = []
  if (!activationReviewVerified) {
    blockerSummary.push('Writer activation review not verified — boundary review blocked')
  }
  blockerSummary.push('Real writer boundary not opened — read-only preview only')
  blockerSummary.push('Writer factory remains disabled — no writer execution')
  blockerSummary.push('Persistence remains disabled — no storage writes')
  blockerSummary.push('All mutation paths remain blocked — Program Cards, Start Workout, Live Workout unchanged')
  
  // Headline
  const headline = !activationReviewVerified
    ? 'Boundary Review Blocked — Writer Activation Review Not Verified'
    : 'Persistence Boundary Reviewed — Writer Boundary Not Opened'
  
  // Summary
  const summary = !activationReviewVerified
    ? 'The persistence boundary review cannot proceed because the previous writer activation review was not verified. All persistence, write, and mutation paths remain blocked.'
    : 'The persistence boundary has been reviewed following writer activation review verification. The real writer boundary remains closed. No persistence, no write, no receipt, no API/DB/storage/schema, and no Program Cards / Start Workout / Live Workout changes.'
  
  // Payload
  const previewPayload: PersistenceBoundaryReviewPayload = {
    previewKind: 'persistence_boundary_review_preview',
    sourceWriterActivationReviewStatus: persistenceWriterActivationReviewPreviewModel?.status ?? 'unknown',
    currentMode: mode,
    currentBoundaryReviewState,
    previousWriterActivationReviewVerified: activationReviewVerified,
    boundaryReviewed,
    realWriterBoundaryOpened: false,
    writerFactoryEnabled: false,
    persistenceEnabled: false,
    writeEnabled: false,
    completedSessionsProtected: true,
  }
  
  return {
    status,
    mode,
    headline,
    summary,
    blockerSummary,
    nextRequiredStep: 'MASTER-8C.66+ next persistence/writer boundary step / persistence still disabled unless official checklist explicitly enables writes',
    
    // Review flags
    previousWriterActivationReviewVerified: activationReviewVerified,
    boundaryReviewed,
    boundaryReviewReady,
    currentBoundaryReviewState,
    
    // All real action flags hard false
    realWriterBoundaryOpened: false,
    writerFactoryEnabled: false,
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
    
    // Items and summary
    boundaryReviewItems,
    boundaryReviewSummary,
    
    // Payload
    previewPayload,
  }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function getPersistenceBoundaryReviewPreviewStatusLabel(
  status: PersistenceBoundaryReviewPreviewStatus,
): string {
  switch (status) {
    case 'boundary_review_ready': return 'Boundary Review Ready'
    case 'boundary_review_complete': return 'Boundary Review Complete'
    case 'boundary_review_blocked': return 'Boundary Review Blocked'
    case 'boundary_review_pending': return 'Boundary Review Pending'
  }
}

export function getPersistenceBoundaryReviewPreviewStatusColor(
  status: PersistenceBoundaryReviewPreviewStatus,
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'boundary_review_ready':
    case 'boundary_review_complete':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70', border: 'border-indigo-500/20' }
    case 'boundary_review_blocked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'boundary_review_pending':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
  }
}

export function getPersistenceBoundaryReviewItemStatusLabel(
  status: PersistenceBoundaryReviewItemStatus,
): string {
  switch (status) {
    case 'activation_review_verified': return 'verified'
    case 'boundary_reviewed': return 'reviewed'
    case 'boundary_not_opened': return 'not opened'
    case 'boundary_blocked': return 'blocked'
    case 'writer_disabled': return 'disabled'
    case 'persistence_disabled': return 'disabled'
    case 'write_disabled': return 'disabled'
    case 'receipt_blocked': return 'blocked'
    case 'api_blocked': return 'blocked'
    case 'db_blocked': return 'blocked'
    case 'storage_blocked': return 'blocked'
    case 'schema_protected': return 'protected'
    case 'program_protected': return 'protected'
    case 'workout_protected': return 'protected'
    case 'future_session_protected': return 'protected'
    case 'completed_session_protected': return 'protected'
  }
}

export function getPersistenceBoundaryReviewItemStatusColor(
  status: PersistenceBoundaryReviewItemStatus,
): { bg: string; text: string } {
  switch (status) {
    case 'activation_review_verified':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400/70' }
    case 'boundary_reviewed':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70' }
    case 'boundary_not_opened':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'boundary_blocked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'writer_disabled':
    case 'persistence_disabled':
    case 'write_disabled':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70' }
    case 'receipt_blocked':
    case 'api_blocked':
    case 'db_blocked':
    case 'storage_blocked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70' }
    case 'schema_protected':
    case 'program_protected':
    case 'workout_protected':
    case 'future_session_protected':
    case 'completed_session_protected':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/70' }
  }
}
