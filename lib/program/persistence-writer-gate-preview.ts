/**
 * Prompt 61 / MASTER-8C.66 / AB20.4.59
 * Persistence Writer Gate Preview
 * 
 * Pure read-only writer gate preview that consumes the Prompt 60 boundary review model.
 * Reviews the final gate checkpoint before any theoretical writer activation.
 * 
 * CRITICAL: This is a preview/proof step only.
 * - Writer gate is reviewed but NOT opened
 * - Persistence remains disabled
 * - No write path exists
 * - No receipt can be written
 * - No API/DB/storage/schema touched
 * - No Program Cards / Start Workout / Live Workout changes
 * - Completed sessions remain protected
 * - Future session mutation remains disabled
 */

import type { PersistenceBoundaryReviewPreviewModel } from './persistence-boundary-review-preview'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type PersistenceWriterGatePreviewStatus =
  | 'pending_boundary_review'
  | 'boundary_review_not_ready'
  | 'writer_gate_preview_ready'
  | 'writer_gate_reviewed_not_opened'
  | 'writer_gate_blocked'
  | 'persistence_disabled'

export type PersistenceWriterGateItemStatus =
  | 'boundary_review_verified'
  | 'writer_gate_reviewed'
  | 'writer_gate_not_opened'
  | 'writer_gate_blocked'
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

export interface PersistenceWriterGateItem {
  readonly key: string
  readonly label: string
  readonly status: PersistenceWriterGateItemStatus
  readonly boundaryReviewVerifiedNow: boolean
  readonly writerGateReviewedNow: boolean
  readonly blockedNow: boolean
  readonly disabledNow: boolean
  readonly protectedNow: boolean
}

export interface PersistenceWriterGateSummary {
  readonly totalItems: number
  readonly boundaryReviewVerifiedItems: number
  readonly writerGateReviewedItems: number
  readonly writerGateNotOpenedItems: number
  readonly writerDisabledItems: number
  readonly completedSessionsProtectedItems: number
}

export interface PersistenceWriterGatePreviewPayload {
  readonly previewKind: 'persistence_writer_gate_preview'
  readonly sourceBoundaryReviewStatus: string
  readonly currentMode: 'writer_gate_preview_only_persistence_disabled'
  readonly currentWriterGateState: 'reviewed_not_opened'
  readonly realWriterGateOpened: false
  readonly writerFactoryEnabled: false
  readonly persistenceEnabled: false
  readonly completedSessionsProtected: true
}

export interface PersistenceWriterGatePreviewModel {
  readonly sourceStep: 'MASTER-8C.66 / AB20.4.59 / Prompt 61'
  readonly status: PersistenceWriterGatePreviewStatus
  readonly headline: string
  readonly summary: string
  
  // Core verification flags
  readonly previousBoundaryReviewVerified: boolean
  readonly writerGateReviewed: boolean
  readonly writerGateOpened: false
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
  
  // Preview payload
  readonly previewPayload: PersistenceWriterGatePreviewPayload | null
  
  // Item list
  readonly writerGateItems: readonly PersistenceWriterGateItem[]
  
  // Summary
  readonly writerGateSummary: PersistenceWriterGateSummary
  
  // Blockers
  readonly blockerSummary: readonly string[]
  
  // Next step
  readonly nextRequiredStep: string
}

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface PersistenceWriterGatePreviewInput {
  readonly persistenceBoundaryReviewPreviewModel: PersistenceBoundaryReviewPreviewModel | null
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolvePersistenceWriterGatePreview(
  input: PersistenceWriterGatePreviewInput
): PersistenceWriterGatePreviewModel {
  const { persistenceBoundaryReviewPreviewModel } = input
  
  // Gate: source model must exist
  if (!persistenceBoundaryReviewPreviewModel) {
    return buildNotReadyModel(
      'pending_boundary_review',
      'Persistence Writer Gate Preview — Awaiting Boundary Review',
      'Cannot evaluate writer gate because boundary review preview is not available.',
      ['Boundary review preview model is not available']
    )
  }
  
  // Gate: source must be in a ready state
  const sourceStatus = persistenceBoundaryReviewPreviewModel.status
  const isSourceReady = 
    sourceStatus === 'boundary_review_complete' ||
    sourceStatus === 'boundary_review_ready'
  
  if (!isSourceReady) {
    return buildNotReadyModel(
      'boundary_review_not_ready',
      'Persistence Writer Gate Preview — Boundary Review Not Ready',
      `Cannot preview writer gate because boundary review is not ready. Current source status: ${sourceStatus}.`,
      [`Boundary review status is ${sourceStatus}, expected boundary_review_complete or boundary_review_ready`]
    )
  }
  
  // Build the writer gate items
  const writerGateItems = buildWriterGateItems(persistenceBoundaryReviewPreviewModel)
  
  // Build summary
  const writerGateSummary = buildWriterGateSummary(writerGateItems)
  
  // Build preview payload
  const previewPayload: PersistenceWriterGatePreviewPayload = {
    previewKind: 'persistence_writer_gate_preview',
    sourceBoundaryReviewStatus: sourceStatus,
    currentMode: 'writer_gate_preview_only_persistence_disabled',
    currentWriterGateState: 'reviewed_not_opened',
    realWriterGateOpened: false,
    writerFactoryEnabled: false,
    persistenceEnabled: false,
    completedSessionsProtected: true,
  }
  
  return {
    sourceStep: 'MASTER-8C.66 / AB20.4.59 / Prompt 61',
    status: 'writer_gate_reviewed_not_opened',
    headline: 'Persistence Writer Gate Preview — Gate Reviewed, Not Opened',
    summary: 'The persistence writer gate has been reviewed. The boundary review is verified. The writer gate remains closed. Persistence, write, receipt, API/DB/storage/schema, Program Cards, Start Workout, Live Workout, and future-session mutation remain disabled. Completed sessions are protected.',
    
    previousBoundaryReviewVerified: true,
    writerGateReviewed: true,
    writerGateOpened: false,
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
    
    previewPayload,
    writerGateItems,
    writerGateSummary,
    blockerSummary: [],
    nextRequiredStep: 'MASTER-8C.67+ next persistence/writer boundary step / persistence still disabled unless official checklist explicitly enables writes',
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function buildNotReadyModel(
  status: PersistenceWriterGatePreviewStatus,
  headline: string,
  summary: string,
  blockers: readonly string[]
): PersistenceWriterGatePreviewModel {
  return {
    sourceStep: 'MASTER-8C.66 / AB20.4.59 / Prompt 61',
    status,
    headline,
    summary,
    
    previousBoundaryReviewVerified: false,
    writerGateReviewed: false,
    writerGateOpened: false,
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
    
    previewPayload: null,
    writerGateItems: [],
    writerGateSummary: {
      totalItems: 0,
      boundaryReviewVerifiedItems: 0,
      writerGateReviewedItems: 0,
      writerGateNotOpenedItems: 0,
      writerDisabledItems: 0,
      completedSessionsProtectedItems: 0,
    },
    blockerSummary: blockers,
    nextRequiredStep: 'Fix boundary review before writer gate preview can proceed',
  }
}

function buildWriterGateItems(
  sourceModel: PersistenceBoundaryReviewPreviewModel
): readonly PersistenceWriterGateItem[] {
  const items: PersistenceWriterGateItem[] = []
  
  // 1. Boundary review verification
  items.push({
    key: 'boundary_review_source',
    label: 'Boundary review verified from previous step',
    status: 'boundary_review_verified',
    boundaryReviewVerifiedNow: true,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 2. Writer gate reviewed
  items.push({
    key: 'writer_gate_reviewed',
    label: 'Writer gate reviewed',
    status: 'writer_gate_reviewed',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: true,
    blockedNow: false,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 3. Writer gate not opened
  items.push({
    key: 'writer_gate_not_opened',
    label: 'Writer gate not opened (review only)',
    status: 'writer_gate_not_opened',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 4. Writer factory disabled
  items.push({
    key: 'writer_factory_disabled',
    label: 'Writer factory disabled',
    status: 'writer_disabled',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // 5. Persistence disabled
  items.push({
    key: 'persistence_disabled',
    label: 'Persistence disabled',
    status: 'persistence_disabled',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // 6. Write disabled
  items.push({
    key: 'write_disabled',
    label: 'Write disabled',
    status: 'write_disabled',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: true,
    protectedNow: false,
  })
  
  // 7. Receipt blocked
  items.push({
    key: 'receipt_blocked',
    label: 'Receipt writing blocked',
    status: 'receipt_blocked',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 8. API blocked
  items.push({
    key: 'api_blocked',
    label: 'API route blocked',
    status: 'api_blocked',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 9. DB blocked
  items.push({
    key: 'db_blocked',
    label: 'DB client blocked',
    status: 'db_blocked',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 10. Storage blocked
  items.push({
    key: 'storage_blocked',
    label: 'Storage blocked',
    status: 'storage_blocked',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: true,
    disabledNow: false,
    protectedNow: false,
  })
  
  // 11. Schema protected
  items.push({
    key: 'schema_protected',
    label: 'Schema protected',
    status: 'schema_protected',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // 12. Program Cards protected
  items.push({
    key: 'program_cards_protected',
    label: 'Program Cards protected',
    status: 'program_protected',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // 13. Start Workout protected
  items.push({
    key: 'start_workout_protected',
    label: 'Start Workout protected',
    status: 'workout_protected',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // 14. Live Workout protected
  items.push({
    key: 'live_workout_protected',
    label: 'Live Workout protected',
    status: 'workout_protected',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // 15. Future session mutation disabled
  items.push({
    key: 'future_session_disabled',
    label: 'Future session mutation disabled',
    status: 'future_session_protected',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  // 16. Completed sessions protected
  items.push({
    key: 'completed_sessions_protected',
    label: 'Completed sessions protected',
    status: 'completed_session_protected',
    boundaryReviewVerifiedNow: false,
    writerGateReviewedNow: false,
    blockedNow: false,
    disabledNow: false,
    protectedNow: true,
  })
  
  return items
}

function buildWriterGateSummary(
  items: readonly PersistenceWriterGateItem[]
): PersistenceWriterGateSummary {
  return {
    totalItems: items.length,
    boundaryReviewVerifiedItems: items.filter(i => i.boundaryReviewVerifiedNow).length,
    writerGateReviewedItems: items.filter(i => i.writerGateReviewedNow).length,
    writerGateNotOpenedItems: items.filter(i => i.status === 'writer_gate_not_opened').length,
    writerDisabledItems: items.filter(i => i.disabledNow).length,
    completedSessionsProtectedItems: items.filter(i => i.status === 'completed_session_protected').length,
  }
}

// -----------------------------------------------------------------------------
// Label/Color helpers
// -----------------------------------------------------------------------------

export function getPersistenceWriterGatePreviewStatusLabel(
  status: PersistenceWriterGatePreviewStatus
): string {
  switch (status) {
    case 'pending_boundary_review': return 'pending boundary review'
    case 'boundary_review_not_ready': return 'boundary review not ready'
    case 'writer_gate_preview_ready': return 'writer gate preview ready'
    case 'writer_gate_reviewed_not_opened': return 'writer gate reviewed / not opened'
    case 'writer_gate_blocked': return 'writer gate blocked'
    case 'persistence_disabled': return 'persistence disabled'
  }
}

export function getPersistenceWriterGatePreviewStatusColor(
  status: PersistenceWriterGatePreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'pending_boundary_review':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'boundary_review_not_ready':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70', border: 'border-rose-500/20' }
    case 'writer_gate_preview_ready':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70', border: 'border-cyan-500/20' }
    case 'writer_gate_reviewed_not_opened':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70', border: 'border-cyan-500/20' }
    case 'writer_gate_blocked':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70', border: 'border-rose-500/20' }
    case 'persistence_disabled':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
  }
}

export function getPersistenceWriterGateItemStatusLabel(
  status: PersistenceWriterGateItemStatus
): string {
  switch (status) {
    case 'boundary_review_verified': return 'verified'
    case 'writer_gate_reviewed': return 'reviewed'
    case 'writer_gate_not_opened': return 'not opened'
    case 'writer_gate_blocked': return 'blocked'
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

export function getPersistenceWriterGateItemStatusColor(
  status: PersistenceWriterGateItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'boundary_review_verified':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400/70' }
    case 'writer_gate_reviewed':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70' }
    case 'writer_gate_not_opened':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70' }
    case 'writer_gate_blocked':
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
