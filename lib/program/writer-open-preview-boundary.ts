/**
 * Writer-Open Preview Boundary
 * MASTER-8C.70 / AB20.4.63 / Prompt 65
 * 
 * FEATURE STEP — NOT another redundant closed-boundary card.
 * This model moves the corridor forward from "closed-boundary loop" to "preview-open candidate."
 * 
 * Key distinction:
 * - "preview-open candidate" = the system CAN enter preview mode for next step planning
 * - "real writer opened" = still FALSE until explicit enablement
 * 
 * Consumes Prompt 64 Mutation Unlock Roadmap Decision Gate and existing blocker models.
 * Surfaces exact blockers that still prevent real persistence/write/mutation.
 */

import type { MutationUnlockRoadmapDecisionGateModel } from './mutation-unlock-roadmap-decision-gate'
import type { MarkerWriteReadinessLedgerModel } from './marker-write-readiness-ledger'

// -----------------------------------------------------------------------------
// Status
// -----------------------------------------------------------------------------

export type WriterOpenPreviewBoundaryStatus =
  | 'preview_open_candidate_ready'
  | 'preview_blocked_by_decision_gate'
  | 'preview_available_but_real_write_blocked'
  | 'source_missing_or_stale'

// -----------------------------------------------------------------------------
// Item Status
// -----------------------------------------------------------------------------

export type WriterOpenPreviewBoundaryItemStatus =
  | 'ready'
  | 'preview_open'
  | 'blocked'
  | 'disabled'
  | 'protected'

// -----------------------------------------------------------------------------
// Item
// -----------------------------------------------------------------------------

export interface WriterOpenPreviewBoundaryItem {
  readonly key: string
  readonly label: string
  readonly status: WriterOpenPreviewBoundaryItemStatus
  readonly detail: string
  readonly blocksRealWrite: boolean
}

// -----------------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------------

export interface WriterOpenPreviewBoundaryModel {
  readonly sourceStep: 'MASTER-8C.70 / AB20.4.63 / Prompt 65'
  readonly status: WriterOpenPreviewBoundaryStatus
  readonly headline: string
  readonly summary: string

  readonly prompt64DecisionReady: boolean
  readonly previewOpenCandidate: boolean
  readonly realWriterOpened: false
  readonly persistenceEnabled: false
  readonly writeAttempted: false
  readonly receiptWritten: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true

  readonly cautionPatternActive: boolean
  readonly authorizationMissing: boolean
  readonly markerReadinessBlocked: boolean

  readonly realWriteBlockedReasons: readonly string[]
  readonly previewBoundaryItems: readonly WriterOpenPreviewBoundaryItem[]
  readonly previewBoundarySummary: {
    readonly totalItems: number
    readonly readyItems: number
    readonly previewOpenItems: number
    readonly blockedItems: number
    readonly disabledItems: number
    readonly protectedItems: number
  }
  readonly nextRequiredStep: string
}

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface WriterOpenPreviewBoundaryInput {
  readonly mutationUnlockRoadmapDecisionGateModel: MutationUnlockRoadmapDecisionGateModel | null | undefined
  readonly markerWriteReadinessLedgerModel?: MarkerWriteReadinessLedgerModel | null | undefined
  // Additional blocker flags from existing models
  readonly cautionPatternActiveOverride?: boolean
  readonly authorizationMissingOverride?: boolean
}

// -----------------------------------------------------------------------------
// Not Ready Builder
// -----------------------------------------------------------------------------

function buildNotReadyModel(
  status: WriterOpenPreviewBoundaryStatus,
  headline: string,
  summary: string,
  blockedReasons: readonly string[]
): WriterOpenPreviewBoundaryModel {
  return {
    sourceStep: 'MASTER-8C.70 / AB20.4.63 / Prompt 65',
    status,
    headline,
    summary,
    prompt64DecisionReady: false,
    previewOpenCandidate: false,
    realWriterOpened: false,
    persistenceEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    cautionPatternActive: false,
    authorizationMissing: true,
    markerReadinessBlocked: true,
    realWriteBlockedReasons: blockedReasons,
    previewBoundaryItems: [
      {
        key: 'source_check',
        label: 'Source Model Check',
        status: 'blocked',
        detail: blockedReasons[0] || 'Source missing or stale',
        blocksRealWrite: true,
      },
    ],
    previewBoundarySummary: {
      totalItems: 1,
      readyItems: 0,
      previewOpenItems: 0,
      blockedItems: 1,
      disabledItems: 0,
      protectedItems: 0,
    },
    nextRequiredStep: 'Repair source models before writer-open preview boundary.',
  }
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolveWriterOpenPreviewBoundary(
  input: WriterOpenPreviewBoundaryInput
): WriterOpenPreviewBoundaryModel {
  const {
    mutationUnlockRoadmapDecisionGateModel,
    markerWriteReadinessLedgerModel,
    cautionPatternActiveOverride,
    authorizationMissingOverride,
  } = input

  // Gate 1: Check if Prompt 64 model is present
  if (!mutationUnlockRoadmapDecisionGateModel) {
    return buildNotReadyModel(
      'source_missing_or_stale',
      'Writer-Open Preview Boundary — Prompt 64 Missing',
      'Cannot evaluate writer-open preview boundary because Prompt 64 Mutation Unlock Roadmap Decision Gate model is missing.',
      ['Prompt 64 Mutation Unlock Roadmap Decision Gate model is null or undefined']
    )
  }

  // Gate 2: Check if Prompt 64 says ready for writer-open preview
  const prompt64DecisionReady = mutationUnlockRoadmapDecisionGateModel.readyForWriterOpenPreviewNext === true

  if (!prompt64DecisionReady) {
    return buildNotReadyModel(
      'preview_blocked_by_decision_gate',
      'Writer-Open Preview Boundary — Decision Gate Not Ready',
      `Cannot enter writer-open preview because Prompt 64 decision gate is not ready. Status: ${mutationUnlockRoadmapDecisionGateModel.status}`,
      [`Prompt 64 readyForWriterOpenPreviewNext is false (status: ${mutationUnlockRoadmapDecisionGateModel.status})`]
    )
  }

  // Prompt 64 is ready — now check for real-write blockers
  // Derive blocker states from existing models

  // Caution pattern: check from override (derived from caution clearance gate in Hub)
  // Default to true if no override provided (safe assumption)
  const cautionPatternActive = cautionPatternActiveOverride ?? true

  // Authorization missing: check from override (derived from marker save artifact preview in Hub)
  // Default to true if no override provided (safe assumption)
  const authorizationMissing = authorizationMissingOverride ?? true

  // Marker readiness blocked: check if ledger is not in ready state
  const markerReadinessBlocked = markerWriteReadinessLedgerModel
    ? markerWriteReadinessLedgerModel.canPersistMarker !== false || 
      markerWriteReadinessLedgerModel.canMutateProgramCards !== false ||
      markerWriteReadinessLedgerModel.canMutateStartWorkout !== false ||
      markerWriteReadinessLedgerModel.canMutateLiveWorkout !== false
    : true // If no ledger, assume blocked

  // Build blocked reasons
  const realWriteBlockedReasons: string[] = []

  if (cautionPatternActive) {
    realWriteBlockedReasons.push('Active caution pattern requires review before real write')
  }

  if (authorizationMissing) {
    realWriteBlockedReasons.push('Local authorization preview has not been accepted')
  }

  if (markerReadinessBlocked) {
    realWriteBlockedReasons.push('Marker readiness ledger is blocked or incomplete')
  }

  // Always add these fundamental blockers for this step
  realWriteBlockedReasons.push('Real persistence activation has not been explicitly enabled')
  realWriteBlockedReasons.push('Writer-open preview is available but real writer remains closed')

  // Build preview boundary items
  const previewBoundaryItems: WriterOpenPreviewBoundaryItem[] = [
    {
      key: 'prompt64_decision',
      label: 'Prompt 64 Decision Gate',
      status: 'ready',
      detail: 'Mutation unlock decision gate passed — redundant closed-boundary cards stopped',
      blocksRealWrite: false,
    },
    {
      key: 'preview_open_candidate',
      label: 'Preview-Open Candidate',
      status: 'preview_open',
      detail: 'Writer-open preview mode is now available as candidate',
      blocksRealWrite: false,
    },
    {
      key: 'caution_pattern',
      label: 'Caution Pattern Review',
      status: cautionPatternActive ? 'blocked' : 'ready',
      detail: cautionPatternActive 
        ? 'Caution pattern is active — must be reviewed before real write'
        : 'Caution pattern cleared or not active',
      blocksRealWrite: cautionPatternActive,
    },
    {
      key: 'authorization_status',
      label: 'Local Authorization',
      status: authorizationMissing ? 'blocked' : 'ready',
      detail: authorizationMissing
        ? 'Authorization preview has not been accepted'
        : 'Authorization preview accepted',
      blocksRealWrite: authorizationMissing,
    },
    {
      key: 'marker_readiness',
      label: 'Marker Write Readiness',
      status: markerReadinessBlocked ? 'blocked' : 'ready',
      detail: markerReadinessBlocked
        ? 'Marker readiness ledger is blocked or incomplete'
        : 'Marker readiness ledger is ready',
      blocksRealWrite: markerReadinessBlocked,
    },
    {
      key: 'real_writer',
      label: 'Real Writer State',
      status: 'disabled',
      detail: 'Real writer remains closed — preview only',
      blocksRealWrite: true,
    },
    {
      key: 'persistence',
      label: 'Persistence State',
      status: 'disabled',
      detail: 'Real persistence remains disabled until explicit enablement',
      blocksRealWrite: true,
    },
    {
      key: 'program_cards',
      label: 'Program Cards',
      status: 'protected',
      detail: 'Program Cards unchanged — preview does not mutate',
      blocksRealWrite: false,
    },
    {
      key: 'start_workout',
      label: 'Start Workout',
      status: 'protected',
      detail: 'Start Workout unchanged — preview does not affect',
      blocksRealWrite: false,
    },
    {
      key: 'live_workout',
      label: 'Live Workout',
      status: 'protected',
      detail: 'Live Workout unchanged — preview does not affect',
      blocksRealWrite: false,
    },
    {
      key: 'completed_sessions',
      label: 'Completed Sessions',
      status: 'protected',
      detail: 'Completed sessions remain protected',
      blocksRealWrite: false,
    },
  ]

  // Compute summary
  const previewBoundarySummary = {
    totalItems: previewBoundaryItems.length,
    readyItems: previewBoundaryItems.filter(i => i.status === 'ready').length,
    previewOpenItems: previewBoundaryItems.filter(i => i.status === 'preview_open').length,
    blockedItems: previewBoundaryItems.filter(i => i.status === 'blocked').length,
    disabledItems: previewBoundaryItems.filter(i => i.status === 'disabled').length,
    protectedItems: previewBoundaryItems.filter(i => i.status === 'protected').length,
  }

  // Determine if any controllable blockers exist (caution/auth/marker — not the fundamental ones)
  const controllableBlockersExist = cautionPatternActive || authorizationMissing || markerReadinessBlocked

  // Determine status and next step
  let status: WriterOpenPreviewBoundaryStatus
  let headline: string
  let summary: string
  let nextRequiredStep: string

  if (controllableBlockersExist) {
    status = 'preview_available_but_real_write_blocked'
    headline = 'Writer-Open Preview Boundary — Preview Available, Real Write Blocked'
    
    const blockerNames: string[] = []
    if (cautionPatternActive) blockerNames.push('caution pattern')
    if (authorizationMissing) blockerNames.push('authorization')
    if (markerReadinessBlocked) blockerNames.push('marker readiness')
    
    summary = `Preview-open candidate is available. The closed-boundary card loop has ended. However, real write is still blocked by: ${blockerNames.join(', ')}. Real persistence remains disabled until explicit enablement.`
    nextRequiredStep = 'Prompt 66 / MASTER-8C.71 / AB20.4.64 — local authorization + caution review gate before any marker write'
  } else {
    status = 'preview_open_candidate_ready'
    headline = 'Writer-Open Preview Boundary — Preview Candidate Ready'
    summary = 'Preview-open candidate is ready. The closed-boundary card loop has ended. No controllable blockers detected. Real persistence remains disabled until explicit enablement.'
    nextRequiredStep = 'Prompt 66 / MASTER-8C.71 / AB20.4.64 — controlled marker-write dry-run authorization; real persistence still disabled'
  }

  return {
    sourceStep: 'MASTER-8C.70 / AB20.4.63 / Prompt 65',
    status,
    headline,
    summary,
    prompt64DecisionReady: true,
    previewOpenCandidate: true,
    realWriterOpened: false,
    persistenceEnabled: false,
    writeAttempted: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    cautionPatternActive,
    authorizationMissing,
    markerReadinessBlocked,
    realWriteBlockedReasons,
    previewBoundaryItems,
    previewBoundarySummary,
    nextRequiredStep,
  }
}

// -----------------------------------------------------------------------------
// Label Helpers
// -----------------------------------------------------------------------------

export function getWriterOpenPreviewBoundaryStatusLabel(
  status: WriterOpenPreviewBoundaryStatus
): string {
  switch (status) {
    case 'preview_open_candidate_ready':
      return 'Preview Candidate Ready'
    case 'preview_blocked_by_decision_gate':
      return 'Preview Blocked by Decision Gate'
    case 'preview_available_but_real_write_blocked':
      return 'Preview Available / Real Write Blocked'
    case 'source_missing_or_stale':
      return 'Source Missing'
    default:
      return 'Unknown'
  }
}

export function getWriterOpenPreviewBoundaryStatusColor(
  status: WriterOpenPreviewBoundaryStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'preview_open_candidate_ready':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'preview_blocked_by_decision_gate':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
    case 'preview_available_but_real_write_blocked':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'source_missing_or_stale':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  }
}

export function getWriterOpenPreviewBoundaryItemStatusLabel(
  status: WriterOpenPreviewBoundaryItemStatus
): string {
  switch (status) {
    case 'ready':
      return 'Ready'
    case 'preview_open':
      return 'Preview Open'
    case 'blocked':
      return 'Blocked'
    case 'disabled':
      return 'Disabled'
    case 'protected':
      return 'Protected'
    default:
      return 'Unknown'
  }
}

export function getWriterOpenPreviewBoundaryItemStatusColor(
  status: WriterOpenPreviewBoundaryItemStatus
): { bg: string; text: string } {
  switch (status) {
    case 'ready':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    case 'preview_open':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-400' }
    case 'blocked':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400' }
    case 'disabled':
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    case 'protected':
      return { bg: 'bg-violet-500/20', text: 'text-violet-400' }
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
  }
}
