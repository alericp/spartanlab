/**
 * Persistence Writer Activation Lock Gate
 * MASTER-8C.48 / AB20.4.41 — Prompt 43/77
 *
 * Pure read-only explicit persistence activation lock gate between
 * controlled durable writer preview and any future durable write path.
 *
 * This model proves:
 * - The explicit persistence activation lock is engaged
 * - No persistence/write/API/DB/storage capability is enabled
 * - No Program Cards / Start Workout / Live Workout mutation is allowed
 * - Future durable persistence requires a separate explicit activation step
 *
 * SAFETY:
 * - No persistence enabled
 * - No receipt written
 * - No DB/API/storage touched
 * - No Program Cards changed
 * - No Start Workout changed
 * - No Live Workout changed
 * - No future sessions mutated
 * - No completed sessions rewritten
 */

import type { ControlledDurableMarkerReceiptWriterPreviewModel } from './controlled-durable-marker-receipt-writer-preview'

// -----------------------------------------------------------------------------
// Status Union
// -----------------------------------------------------------------------------

export type PersistenceWriterActivationLockGateStatus =
  | 'unavailable_missing_writer_preview'
  | 'blocked_writer_contract_not_ready'
  | 'explicit_persistence_lock_engaged_no_write'

// -----------------------------------------------------------------------------
// Mode Union
// -----------------------------------------------------------------------------

export type PersistenceWriterActivationLockGateMode =
  | 'read_only_activation_lock_gate'
  | 'not_ready'

// -----------------------------------------------------------------------------
// Lock Item
// -----------------------------------------------------------------------------

export interface PersistenceWriterActivationLockItem {
  readonly key: string
  readonly label: string
  readonly status: 'locked' | 'ready' | 'blocked'
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Activation Requirement
// -----------------------------------------------------------------------------

export interface PersistenceWriterActivationRequirement {
  readonly key: string
  readonly label: string
  readonly satisfiedNow: boolean
  readonly requiredBeforeFutureWrite: boolean
  readonly reason: string
}

// -----------------------------------------------------------------------------
// Preview Envelope
// -----------------------------------------------------------------------------

export interface PersistenceWriterActivationLockEnvelope {
  readonly gateKind: 'durable_receipt_persistence_activation_lock'
  readonly gateVersion: 'v1_read_only'
  readonly sourceWriterPreviewStatus: string
  readonly writerPreviewCandidateCount: number
  readonly explicitPersistenceActivationRequested: false
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly receiptWriteEnabled: false
  readonly apiRouteEnabled: false
  readonly dbClientEnabled: false
  readonly storageEnabled: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly schemaChangeRequiredHere: false
}

// -----------------------------------------------------------------------------
// Model Interface
// -----------------------------------------------------------------------------

export interface PersistenceWriterActivationLockGateModel {
  readonly status: PersistenceWriterActivationLockGateStatus
  readonly mode: PersistenceWriterActivationLockGateMode
  readonly headline: string
  readonly summary: string

  readonly writerPreviewCandidateCount: number
  readonly activationCandidateCount: number
  readonly lockItemCount: number
  readonly requirementCount: number
  readonly satisfiedRequirementCount: number
  readonly unsatisfiedRequirementCount: number

  readonly lockItems: readonly PersistenceWriterActivationLockItem[]
  readonly activationRequirements: readonly PersistenceWriterActivationRequirement[]
  readonly previewEnvelope: PersistenceWriterActivationLockEnvelope | null
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly canPreviewActivationBoundary: boolean
  readonly canActivatePersistence: false
  readonly canCreateDurableReceipt: false
  readonly canPersistMarker: false
  readonly canWriteMarker: false
  readonly canWriteReceipt: false
  readonly canCallApiRoute: false
  readonly canUseDbClient: false
  readonly canUseStorage: false
  readonly canMutateProgramCards: false
  readonly canMutateStartWorkout: false
  readonly canMutateLiveWorkout: false
  readonly canMutateStructure: false
  readonly canMutateFutureSessions: false

  readonly explicitPersistenceActivationRequested: false
  readonly persistenceLockEngaged: true
  readonly noPersistenceAttempted: true
  readonly noReceiptWritten: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
  readonly completedSessionsProtected: true
}

// -----------------------------------------------------------------------------
// Input Interface
// -----------------------------------------------------------------------------

export interface PersistenceWriterActivationLockGateInput {
  readonly controlledDurableMarkerReceiptWriterPreviewModel: ControlledDurableMarkerReceiptWriterPreviewModel | null | undefined
}

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export function resolvePersistenceWriterActivationLockGate(
  input: PersistenceWriterActivationLockGateInput
): PersistenceWriterActivationLockGateModel {
  const { controlledDurableMarkerReceiptWriterPreviewModel } = input

  // Check if writer preview model exists
  if (!controlledDurableMarkerReceiptWriterPreviewModel) {
    return buildUnavailableModel('unavailable_missing_writer_preview', [
      'Controlled durable marker receipt writer preview model is not available',
    ])
  }

  // Check if writer preview is ready
  if (controlledDurableMarkerReceiptWriterPreviewModel.status !== 'writer_contract_preview_ready_no_write') {
    return buildBlockedModel(
      'blocked_writer_contract_not_ready',
      controlledDurableMarkerReceiptWriterPreviewModel.writerPreviewCandidateCount,
      [
        `Writer contract preview status is "${controlledDurableMarkerReceiptWriterPreviewModel.status}" instead of "writer_contract_preview_ready_no_write"`,
      ]
    )
  }

  // Writer preview is ready - build the engaged lock gate model
  return buildEngagedLockGateModel(controlledDurableMarkerReceiptWriterPreviewModel)
}

// -----------------------------------------------------------------------------
// Helper: Build Unavailable Model
// -----------------------------------------------------------------------------

function buildUnavailableModel(
  status: 'unavailable_missing_writer_preview',
  blockerSummary: readonly string[]
): PersistenceWriterActivationLockGateModel {
  const lockItems = buildLockItems(false)
  const activationRequirements = buildActivationRequirements(false)

  return {
    status,
    mode: 'not_ready',
    headline: 'Persistence Activation Lock Unavailable',
    summary: 'Writer preview model is missing. Persistence activation boundary cannot be evaluated. No persistence, receipt write, or workout mutation has been enabled.',

    writerPreviewCandidateCount: 0,
    activationCandidateCount: 0,
    lockItemCount: lockItems.length,
    requirementCount: activationRequirements.length,
    satisfiedRequirementCount: activationRequirements.filter(r => r.satisfiedNow).length,
    unsatisfiedRequirementCount: activationRequirements.filter(r => !r.satisfiedNow).length,

    lockItems,
    activationRequirements,
    previewEnvelope: null,
    blockerSummary,
    nextRequiredStep: 'Writer contract preview must be ready before persistence activation boundary can be evaluated.',

    canPreviewActivationBoundary: false,
    canActivatePersistence: false,
    canCreateDurableReceipt: false,
    canPersistMarker: false,
    canWriteMarker: false,
    canWriteReceipt: false,
    canCallApiRoute: false,
    canUseDbClient: false,
    canUseStorage: false,
    canMutateProgramCards: false,
    canMutateStartWorkout: false,
    canMutateLiveWorkout: false,
    canMutateStructure: false,
    canMutateFutureSessions: false,

    explicitPersistenceActivationRequested: false,
    persistenceLockEngaged: true,
    noPersistenceAttempted: true,
    noReceiptWritten: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
    completedSessionsProtected: true,
  }
}

// -----------------------------------------------------------------------------
// Helper: Build Blocked Model
// -----------------------------------------------------------------------------

function buildBlockedModel(
  status: 'blocked_writer_contract_not_ready',
  writerPreviewCandidateCount: number,
  blockerSummary: readonly string[]
): PersistenceWriterActivationLockGateModel {
  const lockItems = buildLockItems(false)
  const activationRequirements = buildActivationRequirements(false)

  return {
    status,
    mode: 'not_ready',
    headline: 'Persistence Activation Lock Blocked',
    summary: 'Writer contract preview is not ready. Persistence activation boundary is blocked. No persistence, receipt write, or workout mutation has been enabled.',

    writerPreviewCandidateCount,
    activationCandidateCount: 0,
    lockItemCount: lockItems.length,
    requirementCount: activationRequirements.length,
    satisfiedRequirementCount: activationRequirements.filter(r => r.satisfiedNow).length,
    unsatisfiedRequirementCount: activationRequirements.filter(r => !r.satisfiedNow).length,

    lockItems,
    activationRequirements,
    previewEnvelope: null,
    blockerSummary,
    nextRequiredStep: 'Writer contract preview must be ready before persistence activation boundary can be evaluated.',

    canPreviewActivationBoundary: false,
    canActivatePersistence: false,
    canCreateDurableReceipt: false,
    canPersistMarker: false,
    canWriteMarker: false,
    canWriteReceipt: false,
    canCallApiRoute: false,
    canUseDbClient: false,
    canUseStorage: false,
    canMutateProgramCards: false,
    canMutateStartWorkout: false,
    canMutateLiveWorkout: false,
    canMutateStructure: false,
    canMutateFutureSessions: false,

    explicitPersistenceActivationRequested: false,
    persistenceLockEngaged: true,
    noPersistenceAttempted: true,
    noReceiptWritten: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
    completedSessionsProtected: true,
  }
}

// -----------------------------------------------------------------------------
// Helper: Build Engaged Lock Gate Model
// -----------------------------------------------------------------------------

function buildEngagedLockGateModel(
  writerPreviewModel: ControlledDurableMarkerReceiptWriterPreviewModel
): PersistenceWriterActivationLockGateModel {
  const lockItems = buildLockItems(true)
  const activationRequirements = buildActivationRequirements(true)

  const previewEnvelope: PersistenceWriterActivationLockEnvelope = {
    gateKind: 'durable_receipt_persistence_activation_lock',
    gateVersion: 'v1_read_only',
    sourceWriterPreviewStatus: writerPreviewModel.status,
    writerPreviewCandidateCount: writerPreviewModel.writerPreviewCandidateCount,
    explicitPersistenceActivationRequested: false,
    persistenceEnabled: false,
    writeEnabled: false,
    receiptWriteEnabled: false,
    apiRouteEnabled: false,
    dbClientEnabled: false,
    storageEnabled: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    schemaChangeRequiredHere: false,
  }

  return {
    status: 'explicit_persistence_lock_engaged_no_write',
    mode: 'read_only_activation_lock_gate',
    headline: 'Persistence Activation Lock Engaged',
    summary: 'Durable writer contract is preview-ready, but explicit persistence activation remains locked. No receipt write, API route, DB client, storage, or workout mutation has been enabled.',

    writerPreviewCandidateCount: writerPreviewModel.writerPreviewCandidateCount,
    activationCandidateCount: 1,
    lockItemCount: lockItems.length,
    requirementCount: activationRequirements.length,
    satisfiedRequirementCount: activationRequirements.filter(r => r.satisfiedNow).length,
    unsatisfiedRequirementCount: activationRequirements.filter(r => !r.satisfiedNow).length,

    lockItems,
    activationRequirements,
    previewEnvelope,
    blockerSummary: [],
    nextRequiredStep: 'Next step may add a controlled no-write durable writer harness behind this lock. Persistence must remain disabled until a later explicit activation gate.',

    canPreviewActivationBoundary: true,
    canActivatePersistence: false,
    canCreateDurableReceipt: false,
    canPersistMarker: false,
    canWriteMarker: false,
    canWriteReceipt: false,
    canCallApiRoute: false,
    canUseDbClient: false,
    canUseStorage: false,
    canMutateProgramCards: false,
    canMutateStartWorkout: false,
    canMutateLiveWorkout: false,
    canMutateStructure: false,
    canMutateFutureSessions: false,

    explicitPersistenceActivationRequested: false,
    persistenceLockEngaged: true,
    noPersistenceAttempted: true,
    noReceiptWritten: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
    completedSessionsProtected: true,
  }
}

// -----------------------------------------------------------------------------
// Helper: Build Lock Items
// -----------------------------------------------------------------------------

function buildLockItems(writerPreviewReady: boolean): readonly PersistenceWriterActivationLockItem[] {
  return [
    {
      key: 'writer_contract_preview_ready',
      label: 'Writer Contract Preview Ready',
      status: writerPreviewReady ? 'ready' : 'blocked',
      reason: writerPreviewReady
        ? 'Controlled durable receipt writer contract is preview-ready'
        : 'Writer contract preview is not ready',
    },
    {
      key: 'explicit_persistence_activation_required',
      label: 'Explicit Activation Required',
      status: 'locked',
      reason: 'Persistence requires explicit activation in a future step',
    },
    {
      key: 'persistence_locked',
      label: 'Persistence Locked',
      status: 'locked',
      reason: 'No persistence capability is enabled',
    },
    {
      key: 'receipt_write_locked',
      label: 'Receipt Write Locked',
      status: 'locked',
      reason: 'No durable receipt can be written',
    },
    {
      key: 'api_route_locked',
      label: 'API Route Locked',
      status: 'locked',
      reason: 'No API route calls are enabled',
    },
    {
      key: 'db_client_locked',
      label: 'DB Client Locked',
      status: 'locked',
      reason: 'No database client access is enabled',
    },
    {
      key: 'storage_locked',
      label: 'Storage Locked',
      status: 'locked',
      reason: 'No storage access is enabled',
    },
    {
      key: 'program_cards_locked',
      label: 'Program Cards Locked',
      status: 'locked',
      reason: 'No Program Cards mutation is allowed',
    },
    {
      key: 'start_workout_locked',
      label: 'Start Workout Locked',
      status: 'locked',
      reason: 'No Start Workout mutation is allowed',
    },
    {
      key: 'live_workout_locked',
      label: 'Live Workout Locked',
      status: 'locked',
      reason: 'No Live Workout mutation is allowed',
    },
    {
      key: 'future_session_mutation_locked',
      label: 'Future Session Mutation Locked',
      status: 'locked',
      reason: 'No future session mutation is allowed',
    },
    {
      key: 'completed_sessions_protected',
      label: 'Completed Sessions Protected',
      status: 'locked',
      reason: 'Completed sessions cannot be rewritten',
    },
  ]
}

// -----------------------------------------------------------------------------
// Helper: Build Activation Requirements
// -----------------------------------------------------------------------------

function buildActivationRequirements(writerPreviewReady: boolean): readonly PersistenceWriterActivationRequirement[] {
  return [
    {
      key: 'writer_contract_preview_ready',
      label: 'Writer Contract Preview Ready',
      satisfiedNow: writerPreviewReady,
      requiredBeforeFutureWrite: true,
      reason: writerPreviewReady
        ? 'Writer contract preview is ready'
        : 'Writer contract preview must be ready',
    },
    {
      key: 'explicit_user_or_system_activation',
      label: 'Explicit User/System Activation',
      satisfiedNow: false,
      requiredBeforeFutureWrite: true,
      reason: 'Requires explicit activation request from user or system',
    },
    {
      key: 'durable_write_path_design',
      label: 'Durable Write Path Design',
      satisfiedNow: false,
      requiredBeforeFutureWrite: true,
      reason: 'Write path must be designed and implemented',
    },
    {
      key: 'persistence_target_defined',
      label: 'Persistence Target Defined',
      satisfiedNow: false,
      requiredBeforeFutureWrite: true,
      reason: 'Target storage or database must be defined',
    },
    {
      key: 'receipt_identity_contract_finalized',
      label: 'Receipt Identity Contract Finalized',
      satisfiedNow: false,
      requiredBeforeFutureWrite: true,
      reason: 'Receipt identity and contract shape must be finalized',
    },
    {
      key: 'rollback_or_recovery_plan_defined',
      label: 'Rollback/Recovery Plan Defined',
      satisfiedNow: false,
      requiredBeforeFutureWrite: true,
      reason: 'Rollback or recovery strategy must be defined',
    },
    {
      key: 'reload_proof_plan_defined',
      label: 'Reload Proof Plan Defined',
      satisfiedNow: false,
      requiredBeforeFutureWrite: true,
      reason: 'Plan for verifying reload persistence must be defined',
    },
    {
      key: 'program_card_bridge_deferred',
      label: 'Program Card Bridge Deferred',
      satisfiedNow: true,
      requiredBeforeFutureWrite: false,
      reason: 'Program Card bridge is correctly deferred/locked',
    },
    {
      key: 'start_workout_bridge_deferred',
      label: 'Start Workout Bridge Deferred',
      satisfiedNow: true,
      requiredBeforeFutureWrite: false,
      reason: 'Start Workout bridge is correctly deferred/locked',
    },
    {
      key: 'live_workout_bridge_deferred',
      label: 'Live Workout Bridge Deferred',
      satisfiedNow: true,
      requiredBeforeFutureWrite: false,
      reason: 'Live Workout bridge is correctly deferred/locked',
    },
  ]
}

// -----------------------------------------------------------------------------
// Status Label Helper
// -----------------------------------------------------------------------------

export function getPersistenceWriterActivationLockGateStatusLabel(
  status: PersistenceWriterActivationLockGateStatus
): string {
  switch (status) {
    case 'unavailable_missing_writer_preview':
      return 'unavailable'
    case 'blocked_writer_contract_not_ready':
      return 'writer preview blocked'
    case 'explicit_persistence_lock_engaged_no_write':
      return 'persistence lock engaged'
    default: {
      const _exhaustive: never = status
      return String(_exhaustive)
    }
  }
}

// -----------------------------------------------------------------------------
// Status Color Helper
// -----------------------------------------------------------------------------

export function getPersistenceWriterActivationLockGateStatusColor(
  status: PersistenceWriterActivationLockGateStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_writer_preview':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
      }
    case 'blocked_writer_contract_not_ready':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
      }
    case 'explicit_persistence_lock_engaged_no_write':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
      }
    default: {
      const _exhaustive: never = status
      void _exhaustive
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
      }
    }
  }
}
