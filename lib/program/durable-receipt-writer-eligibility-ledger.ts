// [Prompt 45] Durable Receipt Writer Eligibility Ledger
// Pure read-only eligibility ledger for future durable receipt writer activation
// Consumes ControlledDurableMarkerReceiptWriterNoWriteHarnessModel
// Lists eligibility items with satisfied / locked_by_design / blocked / future_required statuses
// All persistence/write/API/DB/storage/schema/program/workout mutation flags remain false

import type { ControlledDurableMarkerReceiptWriterNoWriteHarnessModel } from './controlled-durable-marker-receipt-writer-no-write-harness'

// -----------------------------------------------------------------------------
// Status union
// -----------------------------------------------------------------------------
export type DurableReceiptWriterEligibilityLedgerStatus =
  | 'unavailable_missing_no_write_harness'
  | 'blocked_no_write_harness_not_ready'
  | 'eligible_for_future_activation_review_persistence_disabled'

// -----------------------------------------------------------------------------
// Mode union
// -----------------------------------------------------------------------------
export type DurableReceiptWriterEligibilityLedgerMode =
  | 'read_only_eligibility_ledger'
  | 'not_ready'

// -----------------------------------------------------------------------------
// Item status union
// -----------------------------------------------------------------------------
export type DurableReceiptWriterEligibilityItemStatus =
  | 'satisfied'
  | 'blocked'
  | 'future_required'
  | 'locked_by_design'

// -----------------------------------------------------------------------------
// Eligibility item
// -----------------------------------------------------------------------------
export interface DurableReceiptWriterEligibilityItem {
  readonly key: string
  readonly label: string
  readonly status: DurableReceiptWriterEligibilityItemStatus
  readonly requiredBeforeActivation: boolean
  readonly satisfiedNow: boolean
  readonly blocksCurrentActivation: boolean
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Eligibility summary
// -----------------------------------------------------------------------------
export interface DurableReceiptWriterEligibilitySummary {
  readonly totalItems: number
  readonly satisfiedItems: number
  readonly blockedItems: number
  readonly futureRequiredItems: number
  readonly lockedByDesignItems: number
  readonly activationEligibleForReview: boolean
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// -----------------------------------------------------------------------------
// Model
// -----------------------------------------------------------------------------
export interface DurableReceiptWriterEligibilityLedgerModel {
  readonly status: DurableReceiptWriterEligibilityLedgerStatus
  readonly mode: DurableReceiptWriterEligibilityLedgerMode
  readonly headline: string
  readonly summary: string

  readonly sourceNoWriteHarnessStatus: string
  readonly sourceDryRunCandidateCount: number
  readonly sourceWriteAttempted: false
  readonly sourceReceiptWritten: false
  readonly sourcePersistenceEnabled: false

  readonly eligibilityItems: readonly DurableReceiptWriterEligibilityItem[]
  readonly eligibilitySummary: DurableReceiptWriterEligibilitySummary
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly canProceedToFutureActivationReview: boolean
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

  readonly explicitPersistenceActivationRequested: false
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

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------
export interface DurableReceiptWriterEligibilityLedgerInput {
  readonly noWriteHarnessModel: ControlledDurableMarkerReceiptWriterNoWriteHarnessModel | null | undefined
}

// -----------------------------------------------------------------------------
// Build eligibility items for PASS state
// -----------------------------------------------------------------------------
function buildEligibilityItemsForReadyState(
  noWriteHarnessModel: ControlledDurableMarkerReceiptWriterNoWriteHarnessModel
): readonly DurableReceiptWriterEligibilityItem[] {
  const items: DurableReceiptWriterEligibilityItem[] = []

  // Satisfied items
  items.push({
    key: 'local_marker_saved',
    label: 'Local marker saved',
    status: 'satisfied',
    requiredBeforeActivation: true,
    satisfiedNow: true,
    blocksCurrentActivation: false,
    reason: 'No-write harness has a dry-run candidate derived from the local marker chain.',
  })

  items.push({
    key: 'durable_receipt_candidate_available',
    label: 'Durable receipt candidate available',
    status: noWriteHarnessModel.dryRunCandidateCount > 0 ? 'satisfied' : 'blocked',
    requiredBeforeActivation: true,
    satisfiedNow: noWriteHarnessModel.dryRunCandidateCount > 0,
    blocksCurrentActivation: noWriteHarnessModel.dryRunCandidateCount === 0,
    reason: noWriteHarnessModel.dryRunCandidateCount > 0
      ? 'Dry-run candidate count is greater than zero.'
      : 'Dry-run candidate count is zero.',
  })

  items.push({
    key: 'writer_contract_preview_ready',
    label: 'Writer contract preview ready',
    status: 'satisfied',
    requiredBeforeActivation: true,
    satisfiedNow: true,
    blocksCurrentActivation: false,
    reason: 'No-write harness can preview the future receipt payload shape.',
  })

  items.push({
    key: 'persistence_activation_lock_engaged',
    label: 'Persistence activation lock engaged',
    status: 'satisfied',
    requiredBeforeActivation: true,
    satisfiedNow: true,
    blocksCurrentActivation: false,
    reason: 'Persistence remains locked while the future activation path is reviewed.',
  })

  // Locked by design items
  items.push({
    key: 'explicit_activation_request_missing',
    label: 'Explicit activation request missing',
    status: 'locked_by_design',
    requiredBeforeActivation: true,
    satisfiedNow: false,
    blocksCurrentActivation: true,
    reason: 'Real persistence cannot activate until a later explicit activation step requests it.',
  })

  items.push({
    key: 'api_route_not_enabled',
    label: 'API route not enabled',
    status: 'locked_by_design',
    requiredBeforeActivation: true,
    satisfiedNow: false,
    blocksCurrentActivation: true,
    reason: 'No API route is allowed in this step.',
  })

  items.push({
    key: 'db_client_not_enabled',
    label: 'DB client not enabled',
    status: 'locked_by_design',
    requiredBeforeActivation: true,
    satisfiedNow: false,
    blocksCurrentActivation: true,
    reason: 'No DB client is allowed in this step.',
  })

  items.push({
    key: 'storage_not_enabled',
    label: 'Storage not enabled',
    status: 'locked_by_design',
    requiredBeforeActivation: true,
    satisfiedNow: false,
    blocksCurrentActivation: true,
    reason: 'No storage write is allowed in this step.',
  })

  items.push({
    key: 'schema_not_authorized',
    label: 'Schema not authorized',
    status: 'locked_by_design',
    requiredBeforeActivation: true,
    satisfiedNow: false,
    blocksCurrentActivation: true,
    reason: 'Schema/migrations are not part of this step.',
  })

  items.push({
    key: 'program_card_mutation_not_authorized',
    label: 'Program Card mutation not authorized',
    status: 'locked_by_design',
    requiredBeforeActivation: false,
    satisfiedNow: false,
    blocksCurrentActivation: false,
    reason: 'Program Cards must not change until a later mutation/display proof step.',
  })

  items.push({
    key: 'start_workout_mutation_not_authorized',
    label: 'Start Workout mutation not authorized',
    status: 'locked_by_design',
    requiredBeforeActivation: false,
    satisfiedNow: false,
    blocksCurrentActivation: false,
    reason: 'Start Workout must remain unchanged in this read-only ledger step.',
  })

  items.push({
    key: 'live_workout_mutation_not_authorized',
    label: 'Live Workout mutation not authorized',
    status: 'locked_by_design',
    requiredBeforeActivation: false,
    satisfiedNow: false,
    blocksCurrentActivation: false,
    reason: 'Live Workout must remain unchanged in this read-only ledger step.',
  })

  items.push({
    key: 'future_session_mutation_not_authorized',
    label: 'Future session mutation not authorized',
    status: 'locked_by_design',
    requiredBeforeActivation: false,
    satisfiedNow: false,
    blocksCurrentActivation: false,
    reason: 'Future session mutation must remain disabled in this read-only ledger step.',
  })

  items.push({
    key: 'completed_sessions_protected',
    label: 'Completed sessions protected',
    status: 'satisfied',
    requiredBeforeActivation: true,
    satisfiedNow: true,
    blocksCurrentActivation: false,
    reason: 'This ledger does not mutate completed sessions or historical logs.',
  })

  return items
}

// -----------------------------------------------------------------------------
// Compute summary from items
// -----------------------------------------------------------------------------
function computeEligibilitySummary(
  items: readonly DurableReceiptWriterEligibilityItem[],
  activationEligibleForReview: boolean
): DurableReceiptWriterEligibilitySummary {
  let satisfiedItems = 0
  let blockedItems = 0
  let futureRequiredItems = 0
  let lockedByDesignItems = 0

  for (const item of items) {
    switch (item.status) {
      case 'satisfied':
        satisfiedItems++
        break
      case 'blocked':
        blockedItems++
        break
      case 'future_required':
        futureRequiredItems++
        break
      case 'locked_by_design':
        lockedByDesignItems++
        break
    }
  }

  return {
    totalItems: items.length,
    satisfiedItems,
    blockedItems,
    futureRequiredItems,
    lockedByDesignItems,
    activationEligibleForReview,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }
}

// -----------------------------------------------------------------------------
// Build unavailable model
// -----------------------------------------------------------------------------
function buildUnavailableModel(reason: string): DurableReceiptWriterEligibilityLedgerModel {
  const emptyItems: readonly DurableReceiptWriterEligibilityItem[] = []
  const emptySummary: DurableReceiptWriterEligibilitySummary = {
    totalItems: 0,
    satisfiedItems: 0,
    blockedItems: 0,
    futureRequiredItems: 0,
    lockedByDesignItems: 0,
    activationEligibleForReview: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }

  return {
    status: 'unavailable_missing_no_write_harness',
    mode: 'not_ready',
    headline: 'Eligibility Ledger Unavailable',
    summary: 'Cannot evaluate eligibility without a no-write harness model.',

    sourceNoWriteHarnessStatus: 'missing',
    sourceDryRunCandidateCount: 0,
    sourceWriteAttempted: false,
    sourceReceiptWritten: false,
    sourcePersistenceEnabled: false,

    eligibilityItems: emptyItems,
    eligibilitySummary: emptySummary,
    blockerSummary: [reason],
    nextRequiredStep: 'Provide a valid no-write harness model before eligibility can be evaluated.',

    canProceedToFutureActivationReview: false,
    canActivatePersistenceNow: false,
    canCreateDurableReceiptNow: false,
    canPersistMarkerNow: false,
    canWriteReceiptNow: false,
    canAttemptWriteNow: false,
    canCallApiRouteNow: false,
    canUseDbClientNow: false,
    canUseStorageNow: false,
    canTouchSchemaNow: false,
    canMutateProgramCardsNow: false,
    canMutateStartWorkoutNow: false,
    canMutateLiveWorkoutNow: false,
    canMutateFutureSessionsNow: false,

    explicitPersistenceActivationRequested: false,
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
  }
}

// -----------------------------------------------------------------------------
// Build blocked model
// -----------------------------------------------------------------------------
function buildBlockedModel(
  sourceStatus: string,
  sourceDryRunCandidateCount: number
): DurableReceiptWriterEligibilityLedgerModel {
  const emptyItems: readonly DurableReceiptWriterEligibilityItem[] = []
  const emptySummary: DurableReceiptWriterEligibilitySummary = {
    totalItems: 0,
    satisfiedItems: 0,
    blockedItems: 0,
    futureRequiredItems: 0,
    lockedByDesignItems: 0,
    activationEligibleForReview: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }

  return {
    status: 'blocked_no_write_harness_not_ready',
    mode: 'not_ready',
    headline: 'Eligibility Ledger Blocked',
    summary: `No-write harness is not ready (status: ${sourceStatus}). Eligibility cannot be evaluated.`,

    sourceNoWriteHarnessStatus: sourceStatus,
    sourceDryRunCandidateCount,
    sourceWriteAttempted: false,
    sourceReceiptWritten: false,
    sourcePersistenceEnabled: false,

    eligibilityItems: emptyItems,
    eligibilitySummary: emptySummary,
    blockerSummary: [`No-write harness status is ${sourceStatus}, not dry_run_ready_persistence_disabled.`],
    nextRequiredStep: 'No-write harness must be ready before eligibility can be evaluated.',

    canProceedToFutureActivationReview: false,
    canActivatePersistenceNow: false,
    canCreateDurableReceiptNow: false,
    canPersistMarkerNow: false,
    canWriteReceiptNow: false,
    canAttemptWriteNow: false,
    canCallApiRouteNow: false,
    canUseDbClientNow: false,
    canUseStorageNow: false,
    canTouchSchemaNow: false,
    canMutateProgramCardsNow: false,
    canMutateStartWorkoutNow: false,
    canMutateLiveWorkoutNow: false,
    canMutateFutureSessionsNow: false,

    explicitPersistenceActivationRequested: false,
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
  }
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------
export function resolveDurableReceiptWriterEligibilityLedger(
  input: DurableReceiptWriterEligibilityLedgerInput
): DurableReceiptWriterEligibilityLedgerModel {
  const { noWriteHarnessModel } = input

  // Case 1: Missing no-write harness model
  if (!noWriteHarnessModel) {
    return buildUnavailableModel('No-write harness model is missing or undefined.')
  }

  // Case 2: No-write harness not ready
  if (noWriteHarnessModel.status !== 'dry_run_ready_persistence_disabled') {
    return buildBlockedModel(
      noWriteHarnessModel.status,
      noWriteHarnessModel.dryRunCandidateCount
    )
  }

  // Case 3: PASS state - no-write harness is ready
  const eligibilityItems = buildEligibilityItemsForReadyState(noWriteHarnessModel)
  const activationEligibleForReview = noWriteHarnessModel.dryRunCandidateCount > 0
  const eligibilitySummary = computeEligibilitySummary(eligibilityItems, activationEligibleForReview)

  return {
    status: 'eligible_for_future_activation_review_persistence_disabled',
    mode: 'read_only_eligibility_ledger',
    headline: 'Durable Receipt Writer Eligibility Ledger Ready',
    summary: 'Future writer activation requirements are now listed in a read-only ledger. The dry-run candidate can proceed to a later activation review, but persistence, writes, API routes, DB clients, storage, schema changes, Program Cards, Start Workout, Live Workout, and future-session mutation remain disabled.',

    sourceNoWriteHarnessStatus: noWriteHarnessModel.status,
    sourceDryRunCandidateCount: noWriteHarnessModel.dryRunCandidateCount,
    sourceWriteAttempted: false,
    sourceReceiptWritten: false,
    sourcePersistenceEnabled: false,

    eligibilityItems,
    eligibilitySummary,
    blockerSummary: [],
    nextRequiredStep: 'Next step may review activation preconditions while persistence remains disabled. Do not enable durable receipt writes until a later explicit activation step.',

    canProceedToFutureActivationReview: true,
    canActivatePersistenceNow: false,
    canCreateDurableReceiptNow: false,
    canPersistMarkerNow: false,
    canWriteReceiptNow: false,
    canAttemptWriteNow: false,
    canCallApiRouteNow: false,
    canUseDbClientNow: false,
    canUseStorageNow: false,
    canTouchSchemaNow: false,
    canMutateProgramCardsNow: false,
    canMutateStartWorkoutNow: false,
    canMutateLiveWorkoutNow: false,
    canMutateFutureSessionsNow: false,

    explicitPersistenceActivationRequested: false,
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
  }
}

// -----------------------------------------------------------------------------
// Status label helper
// -----------------------------------------------------------------------------
export function getDurableReceiptWriterEligibilityLedgerStatusLabel(
  status: DurableReceiptWriterEligibilityLedgerStatus
): string {
  switch (status) {
    case 'unavailable_missing_no_write_harness':
      return 'no-write harness missing'
    case 'blocked_no_write_harness_not_ready':
      return 'no-write harness blocked'
    case 'eligible_for_future_activation_review_persistence_disabled':
      return 'eligible for review / persistence disabled'
  }
}

// -----------------------------------------------------------------------------
// Status color helper
// -----------------------------------------------------------------------------
export function getDurableReceiptWriterEligibilityLedgerStatusColor(
  status: DurableReceiptWriterEligibilityLedgerStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_no_write_harness':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
      }
    case 'blocked_no_write_harness_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      }
    case 'eligible_for_future_activation_review_persistence_disabled':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      }
  }
}

// -----------------------------------------------------------------------------
// Item status label helper
// -----------------------------------------------------------------------------
export function getDurableReceiptWriterEligibilityItemStatusLabel(
  status: DurableReceiptWriterEligibilityItemStatus
): string {
  switch (status) {
    case 'satisfied':
      return 'satisfied'
    case 'blocked':
      return 'blocked'
    case 'future_required':
      return 'future required'
    case 'locked_by_design':
      return 'locked by design'
  }
}

// -----------------------------------------------------------------------------
// Item status color helper
// -----------------------------------------------------------------------------
export function getDurableReceiptWriterEligibilityItemStatusColor(
  status: DurableReceiptWriterEligibilityItemStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'satisfied':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      }
    case 'blocked':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
      }
    case 'future_required':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      }
    case 'locked_by_design':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
      }
  }
}
