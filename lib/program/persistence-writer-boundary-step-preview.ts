/**
 * PERSISTENCE WRITER BOUNDARY STEP PREVIEW
 * =========================================
 * MASTER-8C.67 / AB20.4.60 / Prompt 62 of 78
 * 
 * Read-only boundary step that reviews the writer/persistence boundary
 * after the writer gate preview. This step verifies that the gate was
 * reviewed correctly but does NOT open the writer or enable persistence.
 * 
 * CRITICAL SAFETY RULES:
 * - Pure read-only / display only
 * - Consumes Prompt 61 (persistence-writer-gate-preview) model
 * - Does NOT enable persistence
 * - Does NOT open writer
 * - Does NOT attempt writes
 * - Does NOT write receipts
 * - Does NOT touch API/DB/storage/schema
 * - Does NOT change Program Cards / Start Workout / Live Workout
 * - Does NOT enable future session mutation
 * - Completed sessions remain protected
 * 
 * Chain:
 * Prompt 60 (Persistence Boundary Review Preview)
 *   → Prompt 61 (Persistence Writer Gate Preview)
 *     → Prompt 62 (Persistence Writer Boundary Step Preview) ← THIS FILE
 */

import type { PersistenceWriterGatePreviewModel } from './persistence-writer-gate-preview'

// ============================================================================
// TYPES
// ============================================================================

export type PersistenceWriterBoundaryStepPreviewStatus =
  | 'boundary_step_complete'
  | 'boundary_step_ready'
  | 'writer_gate_not_ready'
  | 'source_missing'
  | 'blocked'

export type PersistenceWriterBoundaryStepItemStatus =
  | 'step_verified'
  | 'step_reviewed'
  | 'gate_verified'
  | 'blocked'
  | 'disabled'
  | 'protected'

export interface PersistenceWriterBoundaryStepItem {
  readonly key: string
  readonly label: string
  readonly status: PersistenceWriterBoundaryStepItemStatus
  readonly writerGateVerifiedNow: boolean
  readonly boundaryStepReviewedNow: boolean
  readonly blockedNow: boolean
  readonly disabledNow: boolean
  readonly protectedNow: boolean
}

export interface PersistenceWriterBoundaryStepSummary {
  readonly totalItems: number
  readonly writerGateVerifiedItems: number
  readonly boundaryStepReviewedItems: number
  readonly blockedItems: number
  readonly disabledItems: number
  readonly protectedItems: number
}

export interface PersistenceWriterBoundaryStepPreviewPayload {
  readonly previewKind: 'writer_boundary_step_preview'
  readonly sourceWriterGateStatus: string
  readonly currentMode: 'read_only' | 'disabled'
  readonly currentBoundaryStepState: 'reviewed_not_opened' | 'pending' | 'blocked'
  readonly realWriterOpened: false
  readonly writerFactoryEnabled: false
  readonly persistenceEnabled: false
  readonly completedSessionsProtected: true
}

export interface PersistenceWriterBoundaryStepPreviewModel {
  readonly sourceStep: 'MASTER-8C.67 / AB20.4.60 / Prompt 62'
  readonly status: PersistenceWriterBoundaryStepPreviewStatus
  readonly headline: string
  readonly summary: string
  
  // Previous step verification
  readonly previousWriterGateVerified: boolean
  
  // Current step state
  readonly currentBoundaryStepReviewed: boolean
  
  // Safety flags - all must remain safe
  readonly persistenceStillDisabled: true
  readonly writerStillClosed: true
  readonly writeStillDisabled: true
  readonly writeAttempted: false
  readonly receiptWritten: false
  readonly apiDbStorageTouched: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
  
  // Details
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string
  readonly previewPayload: PersistenceWriterBoundaryStepPreviewPayload | null
  readonly boundaryStepItems: readonly PersistenceWriterBoundaryStepItem[]
  readonly boundaryStepSummary: PersistenceWriterBoundaryStepSummary
}

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface PersistenceWriterBoundaryStepPreviewInput {
  readonly persistenceWriterGatePreviewModel: PersistenceWriterGatePreviewModel | null | undefined
}

// ============================================================================
// RESOLVER
// ============================================================================

function buildNotReadyModel(
  status: PersistenceWriterBoundaryStepPreviewStatus,
  headline: string,
  summary: string,
  blockers: readonly string[]
): PersistenceWriterBoundaryStepPreviewModel {
  return {
    sourceStep: 'MASTER-8C.67 / AB20.4.60 / Prompt 62',
    status,
    headline,
    summary,
    previousWriterGateVerified: false,
    currentBoundaryStepReviewed: false,
    persistenceStillDisabled: true,
    writerStillClosed: true,
    writeStillDisabled: true,
    writeAttempted: false,
    receiptWritten: false,
    apiDbStorageTouched: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    blockerSummary: blockers,
    nextRequiredStep: 'Fix writer gate preview before boundary step can proceed',
    previewPayload: null,
    boundaryStepItems: [],
    boundaryStepSummary: {
      totalItems: 0,
      writerGateVerifiedItems: 0,
      boundaryStepReviewedItems: 0,
      blockedItems: 0,
      disabledItems: 0,
      protectedItems: 0,
    },
  }
}

export function resolvePersistenceWriterBoundaryStepPreview(
  input: PersistenceWriterBoundaryStepPreviewInput
): PersistenceWriterBoundaryStepPreviewModel {
  const { persistenceWriterGatePreviewModel } = input
  
  // Gate: source model must exist
  if (!persistenceWriterGatePreviewModel) {
    return buildNotReadyModel(
      'source_missing',
      'Persistence Writer Boundary Step Preview — Source Missing',
      'Cannot preview boundary step because writer gate preview model is not available.',
      ['Writer gate preview model is null or undefined']
    )
  }
  
  // Gate: source must be in a ready state
  const sourceStatus = persistenceWriterGatePreviewModel.status
  const isSourceReady = 
    sourceStatus === 'writer_gate_reviewed_not_opened' ||
    sourceStatus === 'writer_gate_preview_ready'
  
  if (!isSourceReady) {
    return buildNotReadyModel(
      'writer_gate_not_ready',
      'Persistence Writer Boundary Step Preview — Writer Gate Not Ready',
      `Cannot preview boundary step because writer gate is not ready. Current source status: ${sourceStatus}.`,
      [`Writer gate status is ${sourceStatus}, expected writer_gate_reviewed_not_opened or writer_gate_preview_ready`]
    )
  }
  
  // Build boundary step items from the source
  const boundaryStepItems: PersistenceWriterBoundaryStepItem[] = [
    {
      key: 'writer_gate_verified',
      label: 'Writer gate review verified from Prompt 61',
      status: 'gate_verified',
      writerGateVerifiedNow: true,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'boundary_step_reviewed',
      label: 'Boundary step review generated (read-only)',
      status: 'step_reviewed',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: true,
      blockedNow: false,
      disabledNow: false,
      protectedNow: false,
    },
    {
      key: 'persistence_disabled',
      label: 'Persistence remains disabled',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'writer_closed',
      label: 'Writer remains closed (not opened)',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'write_disabled',
      label: 'Write remains disabled',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'api_db_storage_untouched',
      label: 'API/DB/storage untouched',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'schema_untouched',
      label: 'Schema untouched',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'program_cards_unchanged',
      label: 'Program Cards unchanged',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'start_workout_unchanged',
      label: 'Start Workout unchanged',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'live_workout_unchanged',
      label: 'Live Workout unchanged',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'future_mutation_disabled',
      label: 'Future session mutation disabled',
      status: 'disabled',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: true,
      protectedNow: false,
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'protected',
      writerGateVerifiedNow: false,
      boundaryStepReviewedNow: false,
      blockedNow: false,
      disabledNow: false,
      protectedNow: true,
    },
  ]
  
  // Build summary
  const boundaryStepSummary: PersistenceWriterBoundaryStepSummary = {
    totalItems: boundaryStepItems.length,
    writerGateVerifiedItems: boundaryStepItems.filter(i => i.writerGateVerifiedNow).length,
    boundaryStepReviewedItems: boundaryStepItems.filter(i => i.boundaryStepReviewedNow).length,
    blockedItems: boundaryStepItems.filter(i => i.blockedNow).length,
    disabledItems: boundaryStepItems.filter(i => i.disabledNow).length,
    protectedItems: boundaryStepItems.filter(i => i.protectedNow).length,
  }
  
  // Build preview payload
  const previewPayload: PersistenceWriterBoundaryStepPreviewPayload = {
    previewKind: 'writer_boundary_step_preview',
    sourceWriterGateStatus: sourceStatus,
    currentMode: 'read_only',
    currentBoundaryStepState: 'reviewed_not_opened',
    realWriterOpened: false,
    writerFactoryEnabled: false,
    persistenceEnabled: false,
    completedSessionsProtected: true,
  }
  
  return {
    sourceStep: 'MASTER-8C.67 / AB20.4.60 / Prompt 62',
    status: 'boundary_step_complete',
    headline: 'Persistence Writer Boundary Step Preview — Step Reviewed, Writer Still Closed',
    summary: 'Read-only boundary step review generated from verified writer gate. The writer boundary has been reviewed but the writer itself remains closed. Persistence, write, and mutation all remain disabled. Completed sessions remain protected.',
    previousWriterGateVerified: true,
    currentBoundaryStepReviewed: true,
    persistenceStillDisabled: true,
    writerStillClosed: true,
    writeStillDisabled: true,
    writeAttempted: false,
    receiptWritten: false,
    apiDbStorageTouched: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    blockerSummary: [],
    nextRequiredStep: 'MASTER-8C.68+ next persistence/writer boundary step / persistence still disabled unless official checklist explicitly enables writes',
    previewPayload,
    boundaryStepItems,
    boundaryStepSummary,
  }
}

// ============================================================================
// STATUS LABEL / COLOR HELPERS
// ============================================================================

export function getPersistenceWriterBoundaryStepPreviewStatusLabel(
  status: PersistenceWriterBoundaryStepPreviewStatus
): string {
  switch (status) {
    case 'boundary_step_complete':
      return 'Step Complete'
    case 'boundary_step_ready':
      return 'Step Ready'
    case 'writer_gate_not_ready':
      return 'Gate Not Ready'
    case 'source_missing':
      return 'Source Missing'
    case 'blocked':
      return 'Blocked'
    default:
      return 'Unknown'
  }
}

export function getPersistenceWriterBoundaryStepPreviewStatusColor(
  status: PersistenceWriterBoundaryStepPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'boundary_step_complete':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400/70', border: 'border-teal-500/20' }
    case 'boundary_step_ready':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/70', border: 'border-cyan-500/20' }
    case 'writer_gate_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/70', border: 'border-amber-500/20' }
    case 'source_missing':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70', border: 'border-rose-500/20' }
    case 'blocked':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/70', border: 'border-rose-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/70', border: 'border-slate-500/20' }
  }
}

export function getPersistenceWriterBoundaryStepItemStatusLabel(
  status: PersistenceWriterBoundaryStepItemStatus
): string {
  switch (status) {
    case 'step_verified':
      return 'verified'
    case 'step_reviewed':
      return 'reviewed'
    case 'gate_verified':
      return 'gate ok'
    case 'blocked':
      return 'blocked'
    case 'disabled':
      return 'disabled'
    case 'protected':
      return 'protected'
    default:
      return 'unknown'
  }
}

export function getPersistenceWriterBoundaryStepItemStatusColor(
  status: PersistenceWriterBoundaryStepItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'step_verified':
      return { bg: 'bg-indigo-500/15', text: 'text-indigo-400/70' }
    case 'step_reviewed':
      return { bg: 'bg-teal-500/15', text: 'text-teal-400/70' }
    case 'gate_verified':
      return { bg: 'bg-cyan-500/15', text: 'text-cyan-400/70' }
    case 'blocked':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400/70' }
    case 'disabled':
      return { bg: 'bg-slate-500/15', text: 'text-slate-400/70' }
    case 'protected':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400/70' }
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400/70' }
  }
}
