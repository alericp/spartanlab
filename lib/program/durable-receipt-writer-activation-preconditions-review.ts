/**
 * Durable Receipt Writer Activation Preconditions Review
 * 
 * MASTER-8C.51 / AB20.4.44 — Prompt 46 of 77
 * 
 * Pure read-only activation preconditions review that consumes the eligibility ledger
 * and summarizes which preconditions are satisfied now vs still locked until explicit activation.
 * 
 * SAFETY GUARANTEES:
 * - This helper is PURE and DETERMINISTIC
 * - NO localStorage/sessionStorage/fetch/Date.now/Math.random
 * - NO database clients or API routes
 * - NO persistence of any kind
 * - NO real activation happens
 * - Real activation is NOT allowed from this review
 * - All write/persistence/API/DB/storage/schema/program/workout mutation flags remain false
 */

import type {
  DurableReceiptWriterEligibilityLedgerModel,
} from './durable-receipt-writer-eligibility-ledger'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type DurableReceiptWriterActivationPreconditionsReviewStatus =
  | 'unavailable_missing_eligibility_ledger'
  | 'blocked_eligibility_ledger_not_ready'
  | 'ready_for_explicit_activation_request_review_persistence_disabled'

export type DurableReceiptWriterActivationPreconditionsReviewMode =
  | 'read_only_activation_preconditions_review'
  | 'not_ready'

export type DurableReceiptWriterActivationPreconditionStatus =
  | 'satisfied'
  | 'locked_until_explicit_activation'
  | 'blocked'
  | 'future_step_required'

// ============================================================================
// PRECONDITION INTERFACES
// ============================================================================

export interface DurableReceiptWriterActivationPrecondition {
  readonly key: string
  readonly label: string
  readonly status: DurableReceiptWriterActivationPreconditionStatus
  readonly satisfiedNow: boolean
  readonly requiredBeforeRealActivation: boolean
  readonly blocksRealActivationNow: boolean
  readonly reason: string
}

export interface DurableReceiptWriterActivationPreconditionsSummary {
  readonly totalPreconditions: number
  readonly satisfiedPreconditions: number
  readonly lockedUntilExplicitActivation: number
  readonly blockedPreconditions: number
  readonly futureStepRequiredPreconditions: number
  readonly readyForExplicitActivationRequestReview: boolean
  readonly realActivationAllowedNow: false
  readonly persistenceStillDisabled: true
  readonly writeStillDisabled: true
}

// ============================================================================
// MODEL INTERFACE
// ============================================================================

export interface DurableReceiptWriterActivationPreconditionsReviewModel {
  readonly status: DurableReceiptWriterActivationPreconditionsReviewStatus
  readonly mode: DurableReceiptWriterActivationPreconditionsReviewMode
  readonly headline: string
  readonly summary: string

  // Source tracking
  readonly sourceEligibilityLedgerStatus: string
  readonly sourceCanProceedToFutureActivationReview: boolean
  readonly sourceSatisfiedEligibilityItems: number
  readonly sourceLockedByDesignItems: number
  readonly sourceDryRunCandidateCount: number

  // Preconditions
  readonly preconditions: readonly DurableReceiptWriterActivationPrecondition[]
  readonly preconditionsSummary: DurableReceiptWriterActivationPreconditionsSummary
  readonly satisfiedSourceItems: readonly string[]
  readonly lockedSourceItems: readonly string[]
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  // Capability flags - review ready but activation still disabled
  readonly readyForExplicitActivationRequestReview: boolean
  readonly canRequestExplicitPersistenceActivationNow: false
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

  // Hard safety flags - all must remain false/true as specified
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

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface DurableReceiptWriterActivationPreconditionsReviewInput {
  readonly eligibilityLedgerModel: DurableReceiptWriterEligibilityLedgerModel | null | undefined
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolveDurableReceiptWriterActivationPreconditionsReview(
  input: DurableReceiptWriterActivationPreconditionsReviewInput
): DurableReceiptWriterActivationPreconditionsReviewModel {
  const { eligibilityLedgerModel } = input

  // Hard safety flags that never change
  const hardSafetyFlags = {
    canRequestExplicitPersistenceActivationNow: false as const,
    canActivatePersistenceNow: false as const,
    canCreateDurableReceiptNow: false as const,
    canPersistMarkerNow: false as const,
    canWriteReceiptNow: false as const,
    canAttemptWriteNow: false as const,
    canCallApiRouteNow: false as const,
    canUseDbClientNow: false as const,
    canUseStorageNow: false as const,
    canTouchSchemaNow: false as const,
    canMutateProgramCardsNow: false as const,
    canMutateStartWorkoutNow: false as const,
    canMutateLiveWorkoutNow: false as const,
    canMutateFutureSessionsNow: false as const,
    explicitPersistenceActivationRequested: false as const,
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

  // Case 1: Missing eligibility ledger model
  if (!eligibilityLedgerModel) {
    const blockedSummary: DurableReceiptWriterActivationPreconditionsSummary = {
      totalPreconditions: 0,
      satisfiedPreconditions: 0,
      lockedUntilExplicitActivation: 0,
      blockedPreconditions: 0,
      futureStepRequiredPreconditions: 0,
      readyForExplicitActivationRequestReview: false,
      realActivationAllowedNow: false,
      persistenceStillDisabled: true,
      writeStillDisabled: true,
    }

    return {
      status: 'unavailable_missing_eligibility_ledger',
      mode: 'not_ready',
      headline: 'Activation Preconditions Review Unavailable',
      summary: 'Cannot review activation preconditions because the eligibility ledger is not available.',
      sourceEligibilityLedgerStatus: 'missing',
      sourceCanProceedToFutureActivationReview: false,
      sourceSatisfiedEligibilityItems: 0,
      sourceLockedByDesignItems: 0,
      sourceDryRunCandidateCount: 0,
      preconditions: [],
      preconditionsSummary: blockedSummary,
      satisfiedSourceItems: [],
      lockedSourceItems: [],
      blockerSummary: ['Eligibility ledger model is missing or not yet computed.'],
      nextRequiredStep: 'Ensure eligibility ledger is ready before reviewing activation preconditions.',
      readyForExplicitActivationRequestReview: false,
      ...hardSafetyFlags,
    }
  }

  // Case 2: Eligibility ledger not ready
  if (eligibilityLedgerModel.status !== 'eligible_for_future_activation_review_persistence_disabled') {
    const blockedSummary: DurableReceiptWriterActivationPreconditionsSummary = {
      totalPreconditions: 0,
      satisfiedPreconditions: 0,
      lockedUntilExplicitActivation: 0,
      blockedPreconditions: 0,
      futureStepRequiredPreconditions: 0,
      readyForExplicitActivationRequestReview: false,
      realActivationAllowedNow: false,
      persistenceStillDisabled: true,
      writeStillDisabled: true,
    }

    return {
      status: 'blocked_eligibility_ledger_not_ready',
      mode: 'not_ready',
      headline: 'Activation Preconditions Review Blocked',
      summary: `Cannot review activation preconditions because the eligibility ledger is not ready. Current status: ${eligibilityLedgerModel.status}.`,
      sourceEligibilityLedgerStatus: eligibilityLedgerModel.status,
      sourceCanProceedToFutureActivationReview: eligibilityLedgerModel.canProceedToFutureActivationReview,
      sourceSatisfiedEligibilityItems: eligibilityLedgerModel.eligibilitySummary.satisfiedItems,
      sourceLockedByDesignItems: eligibilityLedgerModel.eligibilitySummary.lockedByDesignItems,
      sourceDryRunCandidateCount: eligibilityLedgerModel.sourceDryRunCandidateCount,
      preconditions: [],
      preconditionsSummary: blockedSummary,
      satisfiedSourceItems: [],
      lockedSourceItems: [],
      blockerSummary: [`Eligibility ledger status is ${eligibilityLedgerModel.status}, not eligible_for_future_activation_review_persistence_disabled.`],
      nextRequiredStep: 'Resolve eligibility ledger blockers before reviewing activation preconditions.',
      readyForExplicitActivationRequestReview: false,
      ...hardSafetyFlags,
    }
  }

  // Case 3: PASS - Eligibility ledger is ready for future activation review
  const sourceDryRunCandidateCount = eligibilityLedgerModel.sourceDryRunCandidateCount
  const hasDryRunCandidate = sourceDryRunCandidateCount > 0

  // Build preconditions list
  const preconditions: DurableReceiptWriterActivationPrecondition[] = [
    // Satisfied now
    {
      key: 'eligibility_ledger_ready',
      label: 'Eligibility ledger ready',
      status: 'satisfied',
      satisfiedNow: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'The eligibility ledger is ready for future activation review.',
    },
    {
      key: 'dry_run_candidate_available',
      label: 'Dry-run candidate available',
      status: hasDryRunCandidate ? 'satisfied' : 'blocked',
      satisfiedNow: hasDryRunCandidate,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: !hasDryRunCandidate,
      reason: hasDryRunCandidate
        ? 'The no-write chain has a candidate receipt payload to review.'
        : 'No dry-run candidate is available from the no-write chain.',
    },
    {
      key: 'no_write_harness_verified',
      label: 'No-write harness verified',
      status: 'satisfied',
      satisfiedNow: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'The current chain proves the future writer shape without attempting a write.',
    },
    {
      key: 'persistence_lock_confirmed',
      label: 'Persistence lock confirmed',
      status: 'satisfied',
      satisfiedNow: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'Persistence remains locked during precondition review.',
    },
    // Locked until explicit activation
    {
      key: 'explicit_activation_request_required',
      label: 'Explicit activation request required',
      status: 'locked_until_explicit_activation',
      satisfiedNow: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A later step must explicitly request persistence activation before any real writer can exist.',
    },
    {
      key: 'api_route_contract_required',
      label: 'API route contract required',
      status: 'locked_until_explicit_activation',
      satisfiedNow: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A future step must define the API contract before any server write path is allowed.',
    },
    {
      key: 'db_schema_contract_required',
      label: 'DB/schema contract required',
      status: 'locked_until_explicit_activation',
      satisfiedNow: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A future step must explicitly authorize schema/storage structure before persistence can activate.',
    },
    {
      key: 'server_writer_authorization_required',
      label: 'Server writer authorization required',
      status: 'locked_until_explicit_activation',
      satisfiedNow: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A future server-side writer gate must be created before any receipt write can be attempted.',
    },
    // Future step required
    {
      key: 'reload_persistence_proof_required',
      label: 'Reload persistence proof required',
      status: 'future_step_required',
      satisfiedNow: false,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: true,
      reason: 'A later step must prove persisted receipts survive refresh before they can affect runtime behavior.',
    },
    {
      key: 'program_card_proof_required',
      label: 'Program Card proof required later',
      status: 'future_step_required',
      satisfiedNow: false,
      requiredBeforeRealActivation: false,
      blocksRealActivationNow: false,
      reason: 'Program Cards remain untouched until later mutation/display proof gates.',
    },
    {
      key: 'start_workout_proof_required',
      label: 'Start Workout proof required later',
      status: 'future_step_required',
      satisfiedNow: false,
      requiredBeforeRealActivation: false,
      blocksRealActivationNow: false,
      reason: 'Start Workout remains untouched until later live bridge proof gates.',
    },
    {
      key: 'live_workout_proof_required',
      label: 'Live Workout proof required later',
      status: 'future_step_required',
      satisfiedNow: false,
      requiredBeforeRealActivation: false,
      blocksRealActivationNow: false,
      reason: 'Live Workout remains untouched until later runtime bridge proof gates.',
    },
    // Completed sessions protected - satisfied
    {
      key: 'completed_sessions_protected',
      label: 'Completed sessions protected',
      status: 'satisfied',
      satisfiedNow: true,
      requiredBeforeRealActivation: true,
      blocksRealActivationNow: false,
      reason: 'This preconditions review does not mutate completed sessions or historical logs.',
    },
  ]

  // Compute summary counts
  const satisfiedCount = preconditions.filter(p => p.status === 'satisfied').length
  const lockedCount = preconditions.filter(p => p.status === 'locked_until_explicit_activation').length
  const blockedCount = preconditions.filter(p => p.status === 'blocked').length
  const futureStepCount = preconditions.filter(p => p.status === 'future_step_required').length

  const preconditionsSummary: DurableReceiptWriterActivationPreconditionsSummary = {
    totalPreconditions: preconditions.length,
    satisfiedPreconditions: satisfiedCount,
    lockedUntilExplicitActivation: lockedCount,
    blockedPreconditions: blockedCount,
    futureStepRequiredPreconditions: futureStepCount,
    readyForExplicitActivationRequestReview: hasDryRunCandidate,
    realActivationAllowedNow: false,
    persistenceStillDisabled: true,
    writeStillDisabled: true,
  }

  // Extract satisfied/locked source items from eligibility ledger
  const satisfiedSourceItems = eligibilityLedgerModel.eligibilityItems
    .filter(item => item.status === 'satisfied')
    .map(item => item.label)
  
  const lockedSourceItems = eligibilityLedgerModel.eligibilityItems
    .filter(item => item.status === 'locked_by_design')
    .map(item => item.label)

  return {
    status: 'ready_for_explicit_activation_request_review_persistence_disabled',
    mode: 'read_only_activation_preconditions_review',
    headline: 'Activation Preconditions Review Ready',
    summary: 'The durable receipt writer chain is ready for a later explicit activation request review. Real persistence is still disabled: no write path, API route, DB client, storage layer, schema change, Program Card mutation, Start Workout change, Live Workout change, or future-session mutation is enabled.',
    sourceEligibilityLedgerStatus: eligibilityLedgerModel.status,
    sourceCanProceedToFutureActivationReview: eligibilityLedgerModel.canProceedToFutureActivationReview,
    sourceSatisfiedEligibilityItems: eligibilityLedgerModel.eligibilitySummary.satisfiedItems,
    sourceLockedByDesignItems: eligibilityLedgerModel.eligibilitySummary.lockedByDesignItems,
    sourceDryRunCandidateCount,
    preconditions,
    preconditionsSummary,
    satisfiedSourceItems,
    lockedSourceItems,
    blockerSummary: [],
    nextRequiredStep: 'Next step may preview an explicit persistence activation request while still keeping all writes disabled.',
    readyForExplicitActivationRequestReview: hasDryRunCandidate,
    ...hardSafetyFlags,
  }
}

// ============================================================================
// LABEL HELPERS
// ============================================================================

export function getDurableReceiptWriterActivationPreconditionsReviewStatusLabel(
  status: DurableReceiptWriterActivationPreconditionsReviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_eligibility_ledger':
      return 'eligibility ledger missing'
    case 'blocked_eligibility_ledger_not_ready':
      return 'eligibility ledger blocked'
    case 'ready_for_explicit_activation_request_review_persistence_disabled':
      return 'preconditions ready / persistence disabled'
    default:
      return 'unknown'
  }
}

export function getDurableReceiptWriterActivationPreconditionsReviewStatusColor(
  status: DurableReceiptWriterActivationPreconditionsReviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_eligibility_ledger':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    case 'blocked_eligibility_ledger_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'ready_for_explicit_activation_request_review_persistence_disabled':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
  }
}

export function getDurableReceiptWriterActivationPreconditionStatusLabel(
  status: DurableReceiptWriterActivationPreconditionStatus
): string {
  switch (status) {
    case 'satisfied':
      return 'satisfied'
    case 'locked_until_explicit_activation':
      return 'locked until activation'
    case 'blocked':
      return 'blocked'
    case 'future_step_required':
      return 'future step'
    default:
      return 'unknown'
  }
}

export function getDurableReceiptWriterActivationPreconditionStatusColor(
  status: DurableReceiptWriterActivationPreconditionStatus
): { bg: string; text: string } {
  switch (status) {
    case 'satisfied':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' }
    case 'locked_until_explicit_activation':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400' }
    case 'blocked':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400' }
    case 'future_step_required':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400' }
  }
}
