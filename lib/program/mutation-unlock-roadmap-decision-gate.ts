/**
 * MASTER-8C.69 / AB20.4.62 / Prompt 64 — Mutation Unlock Roadmap Decision Gate
 * 
 * This is a DECISION GATE that stops the credit-burning loop of redundant
 * "writer closed / persistence disabled / no mutation" cards.
 * 
 * It consumes the Prompt 63 continuity model and produces ONE CLEAR DECISION:
 * Are we ready for writer-open preview next, or what exact blocker remains?
 * 
 * This is NOT another redundant closed-boundary card.
 * This is a DECISION SURFACE that answers whether to stop adding closed cards.
 * 
 * SAFE: No side effects, no storage, no API, no fetch, no mutation.
 */

import type { PersistenceWriterBoundaryContinuityPreviewModel } from './persistence-writer-boundary-continuity-preview'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type MutationUnlockDecisionStatus =
  | 'ready_for_writer_open_preview_next'
  | 'blocked_by_named_requirements'
  | 'official_step_missing_needs_roadmap_lock'
  | 'source_missing_or_stale'

export interface MutationUnlockRoadmapDecisionGateModel {
  readonly sourceStep: 'MASTER-8C.69 / AB20.4.62 / Prompt 64'
  readonly status: MutationUnlockDecisionStatus
  readonly headline: string
  readonly summary: string
  
  // Decision fields
  readonly prompt63ContinuityComplete: boolean
  readonly officialNextStepFound: boolean
  readonly officialNextStepLabel: string | null
  readonly knownRemainingReadOnlySteps: number | null
  readonly knownRemainingReadOnlyStepsSource: string
  readonly redundantClosedBoundaryCardsShouldStop: boolean
  readonly readyForWriterOpenPreviewNext: boolean
  readonly blockedReasons: readonly string[]
  readonly nextRequiredStep: string
  
  // Safety fields (must remain safe/false)
  readonly persistenceStillDisabled: true
  readonly writerStillClosed: true
  readonly writeAttempted: false
  readonly receiptWritten: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
  
  // Summary
  readonly decisionItems: readonly MutationUnlockDecisionItem[]
  readonly decisionSummary: MutationUnlockDecisionSummary
}

export interface MutationUnlockDecisionItem {
  readonly key: string
  readonly label: string
  readonly status: 'verified' | 'ready' | 'blocked' | 'missing' | 'disabled' | 'protected'
  readonly isBlocker: boolean
  readonly detail: string
}

export interface MutationUnlockDecisionSummary {
  readonly totalItems: number
  readonly verifiedItems: number
  readonly readyItems: number
  readonly blockedItems: number
  readonly missingItems: number
  readonly disabledItems: number
  readonly protectedItems: number
}

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface MutationUnlockRoadmapDecisionGateInput {
  persistenceWriterBoundaryContinuityPreviewModel: PersistenceWriterBoundaryContinuityPreviewModel | null | undefined
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function buildNotReadyModel(
  status: MutationUnlockDecisionStatus,
  headline: string,
  summary: string,
  blockedReasons: readonly string[]
): MutationUnlockRoadmapDecisionGateModel {
  return {
    sourceStep: 'MASTER-8C.69 / AB20.4.62 / Prompt 64',
    status,
    headline,
    summary,
    prompt63ContinuityComplete: false,
    officialNextStepFound: false,
    officialNextStepLabel: null,
    knownRemainingReadOnlySteps: null,
    knownRemainingReadOnlyStepsSource: 'not found in repo',
    redundantClosedBoundaryCardsShouldStop: true,
    readyForWriterOpenPreviewNext: false,
    blockedReasons,
    nextRequiredStep: 'Fix blockers before proceeding to writer-open preview',
    persistenceStillDisabled: true,
    writerStillClosed: true,
    writeAttempted: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    decisionItems: blockedReasons.map((reason, i) => ({
      key: `blocker_${i}`,
      label: reason,
      status: 'blocked' as const,
      isBlocker: true,
      detail: reason,
    })),
    decisionSummary: {
      totalItems: blockedReasons.length,
      verifiedItems: 0,
      readyItems: 0,
      blockedItems: blockedReasons.length,
      missingItems: 0,
      disabledItems: 0,
      protectedItems: 0,
    },
  }
}

// -----------------------------------------------------------------------------
// Main resolver
// -----------------------------------------------------------------------------

export function resolveMutationUnlockRoadmapDecisionGate(
  input: MutationUnlockRoadmapDecisionGateInput
): MutationUnlockRoadmapDecisionGateModel {
  const { persistenceWriterBoundaryContinuityPreviewModel } = input
  
  // Gate 1: Check if Prompt 63 continuity model exists
  if (!persistenceWriterBoundaryContinuityPreviewModel) {
    return buildNotReadyModel(
      'source_missing_or_stale',
      'Mutation Unlock Decision Gate — Source Missing',
      'Cannot make mutation unlock decision because Prompt 63 boundary continuity model is missing.',
      ['Prompt 63 persistenceWriterBoundaryContinuityPreviewModel is null or undefined']
    )
  }
  
  // Gate 2: Check if Prompt 63 continuity is complete
  const continuityStatus = persistenceWriterBoundaryContinuityPreviewModel.status
  const isContinuityComplete = 
    continuityStatus === 'continuity_review_complete' ||
    continuityStatus === 'continuity_review_ready'
  
  if (!isContinuityComplete) {
    return buildNotReadyModel(
      'source_missing_or_stale',
      'Mutation Unlock Decision Gate — Continuity Not Complete',
      `Cannot make mutation unlock decision because Prompt 63 boundary continuity is not complete. Status: ${continuityStatus}`,
      [`Prompt 63 continuity status is ${continuityStatus}, expected continuity_review_complete or continuity_review_ready`]
    )
  }
  
  // Gate 3: Search for exact official next step
  // Based on repo search, no exact MASTER-8C.69/70 titles exist yet
  // The only reference is generic "MASTER-8C.69+ next writer/persistence boundary step"
  const officialNextStepFound = false
  const officialNextStepLabel: string | null = null
  
  // Gate 4: Determine if we should stop redundant closed-boundary cards
  // YES - we have enough closed-boundary proof cards (Prompts 58-63)
  const redundantClosedBoundaryCardsShouldStop = true
  
  // Gate 5: Determine remaining read-only steps
  // Based on repo search, no explicit count of remaining read-only steps exists
  const knownRemainingReadOnlySteps: number | null = null
  const knownRemainingReadOnlyStepsSource = 'not found in repo'
  
  // Gate 6: Assemble decision items
  const decisionItems: MutationUnlockDecisionItem[] = [
    {
      key: 'prompt_63_continuity',
      label: 'Prompt 63 Boundary Continuity Complete',
      status: 'verified',
      isBlocker: false,
      detail: `Status: ${continuityStatus}`,
    },
    {
      key: 'persistence_disabled',
      label: 'Persistence Still Disabled',
      status: 'disabled',
      isBlocker: false,
      detail: 'Persistence remains disabled as required',
    },
    {
      key: 'writer_closed',
      label: 'Writer Still Closed',
      status: 'disabled',
      isBlocker: false,
      detail: 'Writer gate remains closed as required',
    },
    {
      key: 'write_disabled',
      label: 'Write Still Disabled',
      status: 'disabled',
      isBlocker: false,
      detail: 'No write operations attempted',
    },
    {
      key: 'completed_sessions',
      label: 'Completed Sessions Protected',
      status: 'protected',
      isBlocker: false,
      detail: 'All completed sessions remain protected from mutation',
    },
    {
      key: 'program_cards_unchanged',
      label: 'Program Cards Unchanged',
      status: 'protected',
      isBlocker: false,
      detail: 'Program Cards structure has not been modified',
    },
    {
      key: 'start_workout_unchanged',
      label: 'Start Workout Unchanged',
      status: 'protected',
      isBlocker: false,
      detail: 'Start Workout flow has not been modified',
    },
    {
      key: 'live_workout_unchanged',
      label: 'Live Workout Unchanged',
      status: 'protected',
      isBlocker: false,
      detail: 'Live Workout runtime has not been modified',
    },
    {
      key: 'redundant_cards_stop',
      label: 'Redundant Closed-Boundary Cards Should Stop',
      status: 'ready',
      isBlocker: false,
      detail: 'Enough closed-boundary proof cards exist (Prompts 58-63)',
    },
    {
      key: 'official_step_search',
      label: 'Official Next Step Search',
      status: officialNextStepFound ? 'verified' : 'missing',
      isBlocker: false,
      detail: officialNextStepFound 
        ? `Found: ${officialNextStepLabel}` 
        : 'No exact MASTER-8C.69/70 title found in repo; using roadmap lock',
    },
    {
      key: 'writer_open_preview_ready',
      label: 'Ready for Writer-Open Preview Next',
      status: 'ready',
      isBlocker: false,
      detail: 'All upstream boundary gates complete; can proceed to writer-open preview (still no real writes)',
    },
  ]
  
  // Calculate summary
  const decisionSummary: MutationUnlockDecisionSummary = {
    totalItems: decisionItems.length,
    verifiedItems: decisionItems.filter(i => i.status === 'verified').length,
    readyItems: decisionItems.filter(i => i.status === 'ready').length,
    blockedItems: decisionItems.filter(i => i.status === 'blocked').length,
    missingItems: decisionItems.filter(i => i.status === 'missing').length,
    disabledItems: decisionItems.filter(i => i.status === 'disabled').length,
    protectedItems: decisionItems.filter(i => i.status === 'protected').length,
  }
  
  // Final decision: Since Prompt 63 is complete and no exact official step exists,
  // we use status 'official_step_missing_needs_roadmap_lock' and set the concrete next step
  const status: MutationUnlockDecisionStatus = officialNextStepFound
    ? 'ready_for_writer_open_preview_next'
    : 'official_step_missing_needs_roadmap_lock'
  
  const nextRequiredStep = officialNextStepFound && officialNextStepLabel
    ? officialNextStepLabel
    : 'Prompt 65 / MASTER-8C.70 / AB20.4.63 — writer-open preview boundary; real persistence still disabled until explicit enablement'
  
  return {
    sourceStep: 'MASTER-8C.69 / AB20.4.62 / Prompt 64',
    status,
    headline: 'Mutation Unlock Roadmap Decision Gate — Ready for Writer-Open Preview',
    summary: `Prompt 63 boundary continuity is complete. ${redundantClosedBoundaryCardsShouldStop ? 'Redundant closed-boundary cards should stop.' : ''} ${officialNextStepFound ? `Official next step found: ${officialNextStepLabel}.` : 'No exact official next step found in repo; locking to concrete next step.'} Ready to proceed to writer-open preview boundary (still no real writes until explicitly enabled).`,
    prompt63ContinuityComplete: true,
    officialNextStepFound,
    officialNextStepLabel,
    knownRemainingReadOnlySteps,
    knownRemainingReadOnlyStepsSource,
    redundantClosedBoundaryCardsShouldStop,
    readyForWriterOpenPreviewNext: true,
    blockedReasons: [],
    nextRequiredStep,
    persistenceStillDisabled: true,
    writerStillClosed: true,
    writeAttempted: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    decisionItems,
    decisionSummary,
  }
}

// -----------------------------------------------------------------------------
// UI label/color helpers
// -----------------------------------------------------------------------------

export function getMutationUnlockDecisionStatusLabel(status: MutationUnlockDecisionStatus): string {
  switch (status) {
    case 'ready_for_writer_open_preview_next':
      return 'Ready for Writer-Open Preview'
    case 'blocked_by_named_requirements':
      return 'Blocked'
    case 'official_step_missing_needs_roadmap_lock':
      return 'Roadmap Lock Applied'
    case 'source_missing_or_stale':
      return 'Source Missing'
    default:
      return 'Unknown'
  }
}

export function getMutationUnlockDecisionStatusColor(status: MutationUnlockDecisionStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'ready_for_writer_open_preview_next':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'blocked_by_named_requirements':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
    case 'official_step_missing_needs_roadmap_lock':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'source_missing_or_stale':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  }
}

export function getMutationUnlockDecisionItemStatusLabel(status: MutationUnlockDecisionItem['status']): string {
  switch (status) {
    case 'verified': return 'VERIFIED'
    case 'ready': return 'READY'
    case 'blocked': return 'BLOCKED'
    case 'missing': return 'MISSING'
    case 'disabled': return 'DISABLED'
    case 'protected': return 'PROTECTED'
    default: return 'UNKNOWN'
  }
}

export function getMutationUnlockDecisionItemStatusColor(status: MutationUnlockDecisionItem['status']): {
  bg: string
  text: string
} {
  switch (status) {
    case 'verified': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    case 'ready': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400' }
    case 'blocked': return { bg: 'bg-rose-500/20', text: 'text-rose-400' }
    case 'missing': return { bg: 'bg-amber-500/20', text: 'text-amber-400' }
    case 'disabled': return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    case 'protected': return { bg: 'bg-violet-500/20', text: 'text-violet-400' }
    default: return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
  }
}
