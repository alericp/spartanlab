/**
 * Local Authorization + Caution Review Gate
 * Source: MASTER-8C.71 / AB20.4.64 / Prompt 66 of 78
 * 
 * PURPOSE:
 * This helper creates a local-only review gate that explicitly answers:
 * "Has the user locally reviewed the caution pattern and authorization boundary
 * enough to proceed to a marker-save dry-run candidate, while still keeping
 * real persistence and real writes disabled?"
 * 
 * THIS IS NOT A WRITER.
 * THIS IS NOT PERSISTENCE.
 * THIS IS NOT MUTATION.
 * This is a local review gate only.
 * 
 * HARD CONSTRAINTS:
 * - No real marker write enabled
 * - No real writer opened
 * - No persistence enabled
 * - No receipt written
 * - No Program Cards changed
 * - No Start Workout changed
 * - No Live Workout changed
 * - No future session mutation enabled
 * - Completed sessions always protected
 * 
 * CONSUMPTION:
 * - WriterOpenPreviewBoundaryModel (Prompt 65)
 * - MarkerWriteReadinessLedgerModel
 * - Caution pattern active boolean
 * - Local caution review accepted boolean (React state only)
 * - Local authorization accepted boolean (React state only)
 */

import type { WriterOpenPreviewBoundaryModel } from './writer-open-preview-boundary'
import type { MarkerWriteReadinessLedgerModel } from './marker-write-readiness-ledger'

// -----------------------------------------------------------------------------
// STATUS TYPES
// -----------------------------------------------------------------------------

export type LocalAuthorizationCautionReviewGateStatus =
  | 'local_review_ready_for_dry_run'
  | 'blocked_by_writer_open_preview'
  | 'blocked_by_caution_review'
  | 'blocked_by_local_authorization'
  | 'blocked_by_marker_readiness'
  | 'blocked_by_multiple_requirements'
  | 'source_missing_or_stale'

// -----------------------------------------------------------------------------
// ITEM TYPES
// -----------------------------------------------------------------------------

export type LocalAuthorizationCautionReviewGateItemStatus =
  | 'ready'
  | 'blocked'
  | 'review_required'
  | 'local_only'
  | 'disabled'
  | 'protected'

export interface LocalAuthorizationCautionReviewGateItem {
  readonly key: string
  readonly label: string
  readonly status: LocalAuthorizationCautionReviewGateItemStatus
  readonly detail: string
  readonly blocksDryRun: boolean
  readonly blocksRealWrite: boolean
}

// -----------------------------------------------------------------------------
// SUMMARY TYPE
// -----------------------------------------------------------------------------

export interface LocalAuthorizationCautionReviewGateSummary {
  readonly totalItems: number
  readonly readyItems: number
  readonly blockedItems: number
  readonly reviewRequiredItems: number
  readonly localOnlyItems: number
  readonly disabledItems: number
  readonly protectedItems: number
}

// -----------------------------------------------------------------------------
// MODEL TYPE
// -----------------------------------------------------------------------------

export interface LocalAuthorizationCautionReviewGateModel {
  readonly sourceStep: 'MASTER-8C.71 / AB20.4.64 / Prompt 66'
  readonly status: LocalAuthorizationCautionReviewGateStatus
  readonly headline: string
  readonly summary: string

  // Preview boundary state
  readonly writerOpenPreviewCandidate: boolean

  // Caution state
  readonly cautionPatternActive: boolean
  readonly cautionReviewRequired: boolean
  readonly localCautionReviewAccepted: boolean

  // Authorization state
  readonly localAuthorizationAccepted: boolean
  readonly localAuthorizationMissing: boolean

  // Marker readiness state
  readonly markerReadinessBlocked: boolean

  // Gate readiness (for next dry-run step only)
  readonly localDryRunGateReady: boolean
  readonly canProceedToMarkerSaveDryRunPreview: boolean

  // HARD CONSTRAINTS - all permanently false/true
  readonly realMarkerWriteEnabled: false
  readonly realWriterOpened: false
  readonly persistenceEnabled: false
  readonly receiptWritten: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true

  // Blocked reasons
  readonly blockedReasons: readonly string[]

  // Review items
  readonly reviewItems: readonly LocalAuthorizationCautionReviewGateItem[]
  readonly reviewSummary: LocalAuthorizationCautionReviewGateSummary

  // Next step
  readonly nextRequiredStep: string
}

// -----------------------------------------------------------------------------
// INPUT TYPE
// -----------------------------------------------------------------------------

export interface LocalAuthorizationCautionReviewGateInput {
  readonly writerOpenPreviewBoundaryModel: WriterOpenPreviewBoundaryModel | null | undefined
  readonly markerWriteReadinessLedgerModel: MarkerWriteReadinessLedgerModel | null | undefined
  readonly cautionPatternActive: boolean
  readonly localCautionReviewAccepted: boolean
  readonly localAuthorizationAccepted: boolean
}

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const SOURCE_STEP = 'MASTER-8C.71 / AB20.4.64 / Prompt 66' as const

// -----------------------------------------------------------------------------
// HELPER BUILDERS
// -----------------------------------------------------------------------------

function buildSourceMissingModel(
  missingReason: string
): LocalAuthorizationCautionReviewGateModel {
  return {
    sourceStep: SOURCE_STEP,
    status: 'source_missing_or_stale',
    headline: 'Local Authorization + Caution Review Gate — Source Missing',
    summary: `Cannot evaluate local review gate because: ${missingReason}`,

    writerOpenPreviewCandidate: false,
    cautionPatternActive: false,
    cautionReviewRequired: false,
    localCautionReviewAccepted: false,
    localAuthorizationAccepted: false,
    localAuthorizationMissing: true,
    markerReadinessBlocked: true,

    localDryRunGateReady: false,
    canProceedToMarkerSaveDryRunPreview: false,

    realMarkerWriteEnabled: false,
    realWriterOpened: false,
    persistenceEnabled: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,

    blockedReasons: [missingReason],
    reviewItems: [],
    reviewSummary: {
      totalItems: 0,
      readyItems: 0,
      blockedItems: 0,
      reviewRequiredItems: 0,
      localOnlyItems: 0,
      disabledItems: 0,
      protectedItems: 0,
    },
    nextRequiredStep: `Repair: ${missingReason}`,
  }
}

function computeSummary(
  items: readonly LocalAuthorizationCautionReviewGateItem[]
): LocalAuthorizationCautionReviewGateSummary {
  let readyItems = 0
  let blockedItems = 0
  let reviewRequiredItems = 0
  let localOnlyItems = 0
  let disabledItems = 0
  let protectedItems = 0

  for (const item of items) {
    switch (item.status) {
      case 'ready':
        readyItems++
        break
      case 'blocked':
        blockedItems++
        break
      case 'review_required':
        reviewRequiredItems++
        break
      case 'local_only':
        localOnlyItems++
        break
      case 'disabled':
        disabledItems++
        break
      case 'protected':
        protectedItems++
        break
    }
  }

  return {
    totalItems: items.length,
    readyItems,
    blockedItems,
    reviewRequiredItems,
    localOnlyItems,
    disabledItems,
    protectedItems,
  }
}

// -----------------------------------------------------------------------------
// RESOLVER
// -----------------------------------------------------------------------------

export function resolveLocalAuthorizationCautionReviewGate(
  input: LocalAuthorizationCautionReviewGateInput
): LocalAuthorizationCautionReviewGateModel {
  const {
    writerOpenPreviewBoundaryModel,
    markerWriteReadinessLedgerModel,
    cautionPatternActive,
    localCautionReviewAccepted,
    localAuthorizationAccepted,
  } = input

  // Gate 1: Check Writer-Open Preview Boundary
  if (!writerOpenPreviewBoundaryModel) {
    return buildSourceMissingModel('Writer-Open Preview Boundary model is missing')
  }

  if (!writerOpenPreviewBoundaryModel.previewOpenCandidate) {
    return {
      sourceStep: SOURCE_STEP,
      status: 'blocked_by_writer_open_preview',
      headline: 'Local Authorization + Caution Review Gate — Writer Preview Not Ready',
      summary: 'Cannot proceed to local review gate because writer-open preview candidate is not ready.',

      writerOpenPreviewCandidate: false,
      cautionPatternActive,
      cautionReviewRequired: cautionPatternActive,
      localCautionReviewAccepted,
      localAuthorizationAccepted,
      localAuthorizationMissing: !localAuthorizationAccepted,
      markerReadinessBlocked: true,

      localDryRunGateReady: false,
      canProceedToMarkerSaveDryRunPreview: false,

      realMarkerWriteEnabled: false,
      realWriterOpened: false,
      persistenceEnabled: false,
      receiptWritten: false,
      programCardsChanged: false,
      startWorkoutChanged: false,
      liveWorkoutChanged: false,
      futureSessionMutationEnabled: false,
      completedSessionsProtected: true,

      blockedReasons: ['Writer-open preview candidate is not ready'],
      reviewItems: [],
      reviewSummary: {
        totalItems: 0,
        readyItems: 0,
        blockedItems: 0,
        reviewRequiredItems: 0,
        localOnlyItems: 0,
        disabledItems: 0,
        protectedItems: 0,
      },
      nextRequiredStep: 'Resolve writer-open preview boundary before local review gate',
    }
  }

  // Derive marker readiness from ledger
  // Note: "ready" statuses are 'ready_for_future_writer_no_write' or 'local_marker_saved_no_persistence'
  const markerReadinessBlocked = markerWriteReadinessLedgerModel
    ? (markerWriteReadinessLedgerModel.status !== 'ready_for_future_writer_no_write' &&
       markerWriteReadinessLedgerModel.status !== 'local_marker_saved_no_persistence') ||
      markerWriteReadinessLedgerModel.blockedCount > 0
    : true

  // Compute blocker state
  const cautionReviewRequired = cautionPatternActive
  const localAuthorizationMissing = !localAuthorizationAccepted

  // Determine what's blocking
  const blockedReasons: string[] = []
  
  if (cautionReviewRequired && !localCautionReviewAccepted) {
    blockedReasons.push('Active caution pattern requires local review before marker dry-run preview')
  }
  
  if (localAuthorizationMissing) {
    blockedReasons.push('Local authorization preview has not been accepted')
  }
  
  if (markerReadinessBlocked) {
    blockedReasons.push('Marker readiness ledger is blocked or incomplete')
  }

  // Build review items
  const reviewItems: LocalAuthorizationCautionReviewGateItem[] = [
    // Writer-open preview
    {
      key: 'writer_open_preview',
      label: 'Writer-Open Preview Candidate',
      status: 'ready',
      detail: 'Preview boundary is ready — Prompt 65 complete',
      blocksDryRun: false,
      blocksRealWrite: false,
    },
    // Caution pattern
    {
      key: 'caution_pattern',
      label: 'Caution Pattern Status',
      status: cautionPatternActive
        ? (localCautionReviewAccepted ? 'local_only' : 'review_required')
        : 'ready',
      detail: cautionPatternActive
        ? (localCautionReviewAccepted
            ? 'Caution pattern active — local review accepted for preview'
            : 'Caution pattern active — local review required')
        : 'No active caution pattern',
      blocksDryRun: cautionPatternActive && !localCautionReviewAccepted,
      blocksRealWrite: true, // Always blocks real write
    },
    // Local authorization
    {
      key: 'local_authorization',
      label: 'Local Authorization Preview',
      status: localAuthorizationAccepted ? 'local_only' : 'blocked',
      detail: localAuthorizationAccepted
        ? 'Local authorization accepted for preview only'
        : 'Local authorization not accepted',
      blocksDryRun: !localAuthorizationAccepted,
      blocksRealWrite: true, // Always blocks real write
    },
    // Marker readiness
    {
      key: 'marker_readiness',
      label: 'Marker Readiness Ledger',
      status: markerReadinessBlocked ? 'blocked' : 'ready',
      detail: markerReadinessBlocked
        ? `Ledger status: ${markerWriteReadinessLedgerModel?.status ?? 'unavailable'}`
        : 'Marker readiness ledger is ready',
      blocksDryRun: markerReadinessBlocked,
      blocksRealWrite: true,
    },
    // Real marker write — always disabled
    {
      key: 'real_marker_write',
      label: 'Real Marker Write',
      status: 'disabled',
      detail: 'Real marker write is disabled — this is a local review gate only',
      blocksDryRun: false,
      blocksRealWrite: false, // N/A — it's disabled
    },
    // Persistence — always disabled
    {
      key: 'persistence',
      label: 'Persistence',
      status: 'disabled',
      detail: 'Persistence is disabled — no writes to DB/API/storage',
      blocksDryRun: false,
      blocksRealWrite: false, // N/A — it's disabled
    },
    // Program Cards — unchanged
    {
      key: 'program_cards',
      label: 'Program Cards',
      status: 'protected',
      detail: 'Program Cards unchanged — local review does not mutate',
      blocksDryRun: false,
      blocksRealWrite: false,
    },
    // Start Workout — unchanged
    {
      key: 'start_workout',
      label: 'Start Workout',
      status: 'protected',
      detail: 'Start Workout unchanged — local review does not mutate',
      blocksDryRun: false,
      blocksRealWrite: false,
    },
    // Live Workout — unchanged
    {
      key: 'live_workout',
      label: 'Live Workout',
      status: 'protected',
      detail: 'Live Workout unchanged — local review does not mutate',
      blocksDryRun: false,
      blocksRealWrite: false,
    },
    // Future sessions — protected
    {
      key: 'future_sessions',
      label: 'Future Sessions',
      status: 'protected',
      detail: 'Future sessions are not mutated — this is preview review only',
      blocksDryRun: false,
      blocksRealWrite: false,
    },
    // Completed sessions — always protected
    {
      key: 'completed_sessions',
      label: 'Completed Sessions',
      status: 'protected',
      detail: 'Completed sessions are always protected',
      blocksDryRun: false,
      blocksRealWrite: false,
    },
  ]

  const reviewSummary = computeSummary(reviewItems)

  // Determine gate readiness
  // Gate is ready for dry-run preview if:
  // 1. Writer-open preview is ready (already checked)
  // 2. Local authorization is accepted
  // 3. If caution is active, local caution review is accepted
  // 4. Note: marker readiness ledger blocking is still considered for dry-run
  //    but we allow dry-run preview even if marker readiness is blocked,
  //    because the dry-run itself will show the blockers
  const cautionGateClear = !cautionPatternActive || localCautionReviewAccepted
  const authorizationGateClear = localAuthorizationAccepted
  
  // For dry-run gate: we require auth and caution cleared, but we don't require
  // marker readiness for the dry-run preview itself (dry-run shows what's blocked)
  const localDryRunGateReady = cautionGateClear && authorizationGateClear
  const canProceedToMarkerSaveDryRunPreview = localDryRunGateReady

  // Determine status
  let status: LocalAuthorizationCautionReviewGateStatus

  if (localDryRunGateReady) {
    status = 'local_review_ready_for_dry_run'
  } else {
    // Count what's blocking
    const blockingCount = [
      !cautionGateClear,
      !authorizationGateClear,
    ].filter(Boolean).length

    if (blockingCount > 1) {
      status = 'blocked_by_multiple_requirements'
    } else if (!cautionGateClear) {
      status = 'blocked_by_caution_review'
    } else if (!authorizationGateClear) {
      status = 'blocked_by_local_authorization'
    } else {
      status = 'blocked_by_marker_readiness'
    }
  }

  // Build headline and summary
  let headline: string
  let summary: string
  let nextRequiredStep: string

  if (status === 'local_review_ready_for_dry_run') {
    headline = 'Local Authorization + Caution Review Gate — Ready for Dry-Run Preview'
    summary = 'Local review gate is clear for the next dry-run preview only. Real persistence and real writes remain disabled.'
    nextRequiredStep = 'Prompt 67 / MASTER-8C.72 / AB20.4.65 — controlled marker-save dry-run candidate; real persistence still disabled'
  } else {
    headline = 'Local Authorization + Caution Review Gate — Review Required'
    summary = 'Local review is required before the marker dry-run preview can proceed. No real marker write, persistence, or workout mutation is enabled.'
    
    // Point to most immediate blocker
    if (!cautionGateClear) {
      nextRequiredStep = 'Accept local caution review for preview before marker dry-run'
    } else if (!authorizationGateClear) {
      nextRequiredStep = 'Accept local authorization preview before marker dry-run'
    } else {
      nextRequiredStep = 'Resolve marker readiness blockers before marker dry-run'
    }
  }

  return {
    sourceStep: SOURCE_STEP,
    status,
    headline,
    summary,

    writerOpenPreviewCandidate: true,
    cautionPatternActive,
    cautionReviewRequired,
    localCautionReviewAccepted,
    localAuthorizationAccepted,
    localAuthorizationMissing,
    markerReadinessBlocked,

    localDryRunGateReady,
    canProceedToMarkerSaveDryRunPreview,

    realMarkerWriteEnabled: false,
    realWriterOpened: false,
    persistenceEnabled: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,

    blockedReasons,
    reviewItems,
    reviewSummary,
    nextRequiredStep,
  }
}

// -----------------------------------------------------------------------------
// UI HELPER FUNCTIONS
// -----------------------------------------------------------------------------

export function getLocalAuthCautionReviewGateStatusLabel(
  status: LocalAuthorizationCautionReviewGateStatus
): string {
  switch (status) {
    case 'local_review_ready_for_dry_run':
      return 'Ready for Dry-Run'
    case 'blocked_by_writer_open_preview':
      return 'Writer Preview Blocked'
    case 'blocked_by_caution_review':
      return 'Caution Review Required'
    case 'blocked_by_local_authorization':
      return 'Authorization Missing'
    case 'blocked_by_marker_readiness':
      return 'Marker Readiness Blocked'
    case 'blocked_by_multiple_requirements':
      return 'Multiple Reviews Required'
    case 'source_missing_or_stale':
      return 'Source Missing'
    default:
      return 'Unknown'
  }
}

export function getLocalAuthCautionReviewGateStatusColor(
  status: LocalAuthorizationCautionReviewGateStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'local_review_ready_for_dry_run':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400/80', border: 'border-emerald-500/20' }
    case 'blocked_by_writer_open_preview':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400/80', border: 'border-rose-500/20' }
    case 'blocked_by_caution_review':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/80', border: 'border-amber-500/20' }
    case 'blocked_by_local_authorization':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/80', border: 'border-amber-500/20' }
    case 'blocked_by_marker_readiness':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/80', border: 'border-amber-500/20' }
    case 'blocked_by_multiple_requirements':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/80', border: 'border-amber-500/20' }
    case 'source_missing_or_stale':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/80', border: 'border-slate-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/80', border: 'border-slate-500/20' }
  }
}

export function getLocalAuthCautionReviewGateItemStatusLabel(
  status: LocalAuthorizationCautionReviewGateItemStatus
): string {
  switch (status) {
    case 'ready':
      return 'READY'
    case 'blocked':
      return 'BLOCKED'
    case 'review_required':
      return 'REVIEW'
    case 'local_only':
      return 'LOCAL'
    case 'disabled':
      return 'DISABLED'
    case 'protected':
      return 'PROTECTED'
    default:
      return 'UNKNOWN'
  }
}

export function getLocalAuthCautionReviewGateItemStatusColor(
  status: LocalAuthorizationCautionReviewGateItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'ready':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    case 'blocked':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400' }
    case 'review_required':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400' }
    case 'local_only':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-400' }
    case 'disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    case 'protected':
      return { bg: 'bg-violet-500/20', text: 'text-violet-400' }
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
  }
}
