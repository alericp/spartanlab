/**
 * Controlled Durable Marker Receipt Writer Preview
 * 
 * [Prompt 42/77] MASTER-8C.47 / AB20.4.40
 * 
 * Pure read-only preview of the future controlled durable receipt writer contract.
 * This step creates a typed contract preview ONLY - no actual persistence, receipt write,
 * or workout mutation occurs.
 * 
 * Purpose:
 * - Preview what the future durable receipt writer would write
 * - Define required contract fields for future persistence
 * - Verify all safety locks remain engaged
 * - Prove no persistence/write/mutation has been enabled
 * 
 * Safety guarantees:
 * - No persistence attempted
 * - No receipt written
 * - No DB/API/storage touched
 * - No Program Cards changed
 * - No Start Workout changed
 * - No Live Workout changed
 * - No completed sessions rewritten
 * - No future sessions mutated
 */

import type { DurableMarkerReceiptReadinessModel } from './durable-marker-receipt-readiness'

// ============================================================================
// STATUS UNION
// ============================================================================

export type ControlledDurableMarkerReceiptWriterPreviewStatus =
  | 'unavailable_missing_receipt_readiness'
  | 'blocked_receipt_candidate_not_ready'
  | 'writer_contract_preview_ready_no_write'

// ============================================================================
// MODE UNION
// ============================================================================

export type ControlledDurableMarkerReceiptWriterPreviewMode =
  | 'read_only_writer_contract_preview'
  | 'not_ready'

// ============================================================================
// CONTRACT FIELD TYPE
// ============================================================================

export interface ControlledDurableReceiptContractField {
  readonly key: string
  readonly label: string
  readonly value: string
  readonly requiredForFutureWrite: boolean
}

// ============================================================================
// SAFETY ITEM TYPE
// ============================================================================

export interface ControlledDurableReceiptWriterSafetyItem {
  readonly key: string
  readonly label: string
  readonly status: 'ready' | 'blocked'
  readonly reason: string
}

// ============================================================================
// PREVIEW ENVELOPE
// ============================================================================

export interface ControlledDurableReceiptPreviewEnvelope {
  readonly receiptKind: 'local_marker_to_durable_receipt'
  readonly receiptVersion: 'v1_preview'
  readonly receiptIdentityMode: 'future_writer_assigned'
  readonly sourceCandidateStatus: string
  readonly localMarkerSavedCount: number
  readonly receiptCandidateCount: number
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly persistenceEnabled: false
  readonly writeEnabled: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly schemaChangeRequiredHere: false
}

// ============================================================================
// MODEL INTERFACE
// ============================================================================

export interface ControlledDurableMarkerReceiptWriterPreviewModel {
  readonly status: ControlledDurableMarkerReceiptWriterPreviewStatus
  readonly mode: ControlledDurableMarkerReceiptWriterPreviewMode
  readonly headline: string
  readonly summary: string

  readonly localMarkerSavedCount: number
  readonly receiptCandidateCount: number
  readonly writerPreviewCandidateCount: number
  readonly targetSessionCount: number
  readonly completedProtectedCount: number

  readonly contractFields: readonly ControlledDurableReceiptContractField[]
  readonly safetyItems: readonly ControlledDurableReceiptWriterSafetyItem[]
  readonly previewEnvelope: ControlledDurableReceiptPreviewEnvelope | null

  readonly readyCount: number
  readonly blockedCount: number
  readonly blockerSummary: readonly string[]
  readonly nextRequiredStep: string

  readonly canPreviewWriterContract: boolean
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

  readonly completedSessionsProtected: true
  readonly noPersistenceAttempted: true
  readonly noReceiptWritten: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
}

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface ControlledDurableMarkerReceiptWriterPreviewInput {
  readonly durableMarkerReceiptReadinessModel: DurableMarkerReceiptReadinessModel | null | undefined
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolveControlledDurableMarkerReceiptWriterPreview(
  input: ControlledDurableMarkerReceiptWriterPreviewInput
): ControlledDurableMarkerReceiptWriterPreviewModel {
  const { durableMarkerReceiptReadinessModel } = input

  // ---------------------------------------------------------------------------
  // CASE 1: Missing durable receipt readiness model
  // ---------------------------------------------------------------------------
  if (!durableMarkerReceiptReadinessModel) {
    const blockerSummary = ['Durable marker receipt readiness model is not available']
    
    const safetyItems: ControlledDurableReceiptWriterSafetyItem[] = [
      { key: 'durable_receipt_candidate_ready', label: 'Durable Receipt Candidate', status: 'blocked', reason: 'Model not available' },
      { key: 'local_marker_saved_count_available', label: 'Local Marker Saved Count', status: 'blocked', reason: 'Source model missing' },
      { key: 'future_targets_available', label: 'Future Targets Available', status: 'blocked', reason: 'Cannot verify without model' },
      { key: 'completed_sessions_protected', label: 'Completed Sessions Protected', status: 'blocked', reason: 'Cannot verify without model' },
      { key: 'persistence_disabled', label: 'Persistence Disabled', status: 'ready', reason: 'No persistence path exists' },
      { key: 'write_disabled', label: 'Write Disabled', status: 'ready', reason: 'No write path exists' },
      { key: 'structural_mutation_locked', label: 'Structural Mutation Locked', status: 'ready', reason: 'No mutation path exists' },
      { key: 'runtime_unchanged', label: 'Runtime Unchanged', status: 'ready', reason: 'No runtime changes made' },
    ]

    const contractFields: ControlledDurableReceiptContractField[] = [
      { key: 'receiptKind', label: 'Receipt Kind', value: 'unavailable', requiredForFutureWrite: true },
      { key: 'receiptVersion', label: 'Receipt Version', value: 'unavailable', requiredForFutureWrite: true },
      { key: 'receiptIdentityMode', label: 'Receipt Identity Mode', value: 'unavailable', requiredForFutureWrite: true },
      { key: 'sourceCandidateStatus', label: 'Source Candidate Status', value: 'unavailable', requiredForFutureWrite: true },
      { key: 'localMarkerSavedCount', label: 'Local Marker Saved', value: '0', requiredForFutureWrite: true },
      { key: 'receiptCandidateCount', label: 'Receipt Candidates', value: '0', requiredForFutureWrite: true },
      { key: 'targetSessionCount', label: 'Target Sessions', value: '0', requiredForFutureWrite: true },
      { key: 'completedProtectedCount', label: 'Completed Protected', value: '0', requiredForFutureWrite: true },
      { key: 'persistenceEnabled', label: 'Persistence Enabled', value: 'false', requiredForFutureWrite: false },
      { key: 'writeEnabled', label: 'Write Enabled', value: 'false', requiredForFutureWrite: false },
      { key: 'programCardsChanged', label: 'Program Cards Changed', value: 'false', requiredForFutureWrite: false },
      { key: 'startWorkoutChanged', label: 'Start Workout Changed', value: 'false', requiredForFutureWrite: false },
      { key: 'liveWorkoutChanged', label: 'Live Workout Changed', value: 'false', requiredForFutureWrite: false },
      { key: 'schemaChangeRequiredHere', label: 'Schema Change Required', value: 'false', requiredForFutureWrite: false },
    ]

    const readyCount = safetyItems.filter(i => i.status === 'ready').length
    const blockedCount = safetyItems.filter(i => i.status === 'blocked').length

    return {
      status: 'unavailable_missing_receipt_readiness',
      mode: 'not_ready',
      headline: 'Writer Preview Unavailable',
      summary: 'Durable marker receipt readiness model is not available. No persistence, receipt write, or workout mutation has been enabled.',

      localMarkerSavedCount: 0,
      receiptCandidateCount: 0,
      writerPreviewCandidateCount: 0,
      targetSessionCount: 0,
      completedProtectedCount: 0,

      contractFields,
      safetyItems,
      previewEnvelope: null,

      readyCount,
      blockedCount,
      blockerSummary,
      nextRequiredStep: 'Durable marker receipt readiness model must be available before writer preview can be generated.',

      canPreviewWriterContract: false,
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

      completedSessionsProtected: true,
      noPersistenceAttempted: true,
      noReceiptWritten: true,
      noProgramChangesApplied: true,
      noWorkoutChangesApplied: true,
    }
  }

  // ---------------------------------------------------------------------------
  // Extract values from durable receipt readiness model
  // ---------------------------------------------------------------------------
  const localMarkerSavedCount = durableMarkerReceiptReadinessModel.localMarkerSavedCount
  const receiptCandidateCount = durableMarkerReceiptReadinessModel.receiptCandidateCount
  const targetSessionCount = durableMarkerReceiptReadinessModel.targetSessionCount
  const completedProtectedCount = durableMarkerReceiptReadinessModel.completedProtectedCount
  const durableStatus = durableMarkerReceiptReadinessModel.status

  // ---------------------------------------------------------------------------
  // CASE 2: Receipt candidate not ready
  // ---------------------------------------------------------------------------
  if (durableStatus !== 'persistence_candidate_ready_no_write') {
    const blockerSummary = [
      `Durable receipt readiness status is "${durableStatus}" instead of "persistence_candidate_ready_no_write"`,
    ]

    const safetyItems: ControlledDurableReceiptWriterSafetyItem[] = [
      { key: 'durable_receipt_candidate_ready', label: 'Durable Receipt Candidate', status: 'blocked', reason: `Status: ${durableStatus}` },
      { key: 'local_marker_saved_count_available', label: 'Local Marker Saved Count', status: localMarkerSavedCount > 0 ? 'ready' : 'blocked', reason: localMarkerSavedCount > 0 ? `Count: ${localMarkerSavedCount}` : 'No local marker saved' },
      { key: 'future_targets_available', label: 'Future Targets Available', status: targetSessionCount > 0 ? 'ready' : 'blocked', reason: targetSessionCount > 0 ? `Targets: ${targetSessionCount}` : 'No targets identified' },
      { key: 'completed_sessions_protected', label: 'Completed Sessions Protected', status: 'ready', reason: `Protected: ${completedProtectedCount}` },
      { key: 'persistence_disabled', label: 'Persistence Disabled', status: 'ready', reason: 'No persistence path exists' },
      { key: 'write_disabled', label: 'Write Disabled', status: 'ready', reason: 'No write path exists' },
      { key: 'structural_mutation_locked', label: 'Structural Mutation Locked', status: 'ready', reason: 'No mutation path exists' },
      { key: 'runtime_unchanged', label: 'Runtime Unchanged', status: 'ready', reason: 'No runtime changes made' },
    ]

    const contractFields: ControlledDurableReceiptContractField[] = [
      { key: 'receiptKind', label: 'Receipt Kind', value: 'blocked', requiredForFutureWrite: true },
      { key: 'receiptVersion', label: 'Receipt Version', value: 'blocked', requiredForFutureWrite: true },
      { key: 'receiptIdentityMode', label: 'Receipt Identity Mode', value: 'blocked', requiredForFutureWrite: true },
      { key: 'sourceCandidateStatus', label: 'Source Candidate Status', value: durableStatus, requiredForFutureWrite: true },
      { key: 'localMarkerSavedCount', label: 'Local Marker Saved', value: String(localMarkerSavedCount), requiredForFutureWrite: true },
      { key: 'receiptCandidateCount', label: 'Receipt Candidates', value: String(receiptCandidateCount), requiredForFutureWrite: true },
      { key: 'targetSessionCount', label: 'Target Sessions', value: String(targetSessionCount), requiredForFutureWrite: true },
      { key: 'completedProtectedCount', label: 'Completed Protected', value: String(completedProtectedCount), requiredForFutureWrite: true },
      { key: 'persistenceEnabled', label: 'Persistence Enabled', value: 'false', requiredForFutureWrite: false },
      { key: 'writeEnabled', label: 'Write Enabled', value: 'false', requiredForFutureWrite: false },
      { key: 'programCardsChanged', label: 'Program Cards Changed', value: 'false', requiredForFutureWrite: false },
      { key: 'startWorkoutChanged', label: 'Start Workout Changed', value: 'false', requiredForFutureWrite: false },
      { key: 'liveWorkoutChanged', label: 'Live Workout Changed', value: 'false', requiredForFutureWrite: false },
      { key: 'schemaChangeRequiredHere', label: 'Schema Change Required', value: 'false', requiredForFutureWrite: false },
    ]

    const readyCount = safetyItems.filter(i => i.status === 'ready').length
    const blockedCount = safetyItems.filter(i => i.status === 'blocked').length

    return {
      status: 'blocked_receipt_candidate_not_ready',
      mode: 'not_ready',
      headline: 'Writer Preview Blocked',
      summary: `Durable receipt readiness status is "${durableStatus}". Writer contract preview requires persistence_candidate_ready_no_write status. No persistence, receipt write, or workout mutation has been enabled.`,

      localMarkerSavedCount,
      receiptCandidateCount,
      writerPreviewCandidateCount: 0,
      targetSessionCount,
      completedProtectedCount,

      contractFields,
      safetyItems,
      previewEnvelope: null,

      readyCount,
      blockedCount,
      blockerSummary,
      nextRequiredStep: 'Durable marker receipt readiness must reach persistence_candidate_ready_no_write status before writer preview.',

      canPreviewWriterContract: false,
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

      completedSessionsProtected: true,
      noPersistenceAttempted: true,
      noReceiptWritten: true,
      noProgramChangesApplied: true,
      noWorkoutChangesApplied: true,
    }
  }

  // ---------------------------------------------------------------------------
  // CASE 3: Receipt candidate ready - generate writer contract preview
  // ---------------------------------------------------------------------------
  const safetyItems: ControlledDurableReceiptWriterSafetyItem[] = [
    { key: 'durable_receipt_candidate_ready', label: 'Durable Receipt Candidate', status: 'ready', reason: 'Status: persistence_candidate_ready_no_write' },
    { key: 'local_marker_saved_count_available', label: 'Local Marker Saved Count', status: 'ready', reason: `Count: ${localMarkerSavedCount}` },
    { key: 'future_targets_available', label: 'Future Targets Available', status: 'ready', reason: `Targets: ${targetSessionCount}` },
    { key: 'completed_sessions_protected', label: 'Completed Sessions Protected', status: 'ready', reason: `Protected: ${completedProtectedCount}` },
    { key: 'persistence_disabled', label: 'Persistence Disabled', status: 'ready', reason: 'No persistence path exists - correct for preview' },
    { key: 'write_disabled', label: 'Write Disabled', status: 'ready', reason: 'No write path exists - correct for preview' },
    { key: 'structural_mutation_locked', label: 'Structural Mutation Locked', status: 'ready', reason: 'All mutation locks engaged' },
    { key: 'runtime_unchanged', label: 'Runtime Unchanged', status: 'ready', reason: 'No runtime changes made' },
  ]

  const previewEnvelope: ControlledDurableReceiptPreviewEnvelope = {
    receiptKind: 'local_marker_to_durable_receipt',
    receiptVersion: 'v1_preview',
    receiptIdentityMode: 'future_writer_assigned',
    sourceCandidateStatus: durableStatus,
    localMarkerSavedCount,
    receiptCandidateCount,
    targetSessionCount,
    completedProtectedCount,
    persistenceEnabled: false,
    writeEnabled: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    schemaChangeRequiredHere: false,
  }

  const contractFields: ControlledDurableReceiptContractField[] = [
    { key: 'receiptKind', label: 'Receipt Kind', value: previewEnvelope.receiptKind, requiredForFutureWrite: true },
    { key: 'receiptVersion', label: 'Receipt Version', value: previewEnvelope.receiptVersion, requiredForFutureWrite: true },
    { key: 'receiptIdentityMode', label: 'Receipt Identity Mode', value: previewEnvelope.receiptIdentityMode, requiredForFutureWrite: true },
    { key: 'sourceCandidateStatus', label: 'Source Candidate Status', value: previewEnvelope.sourceCandidateStatus, requiredForFutureWrite: true },
    { key: 'localMarkerSavedCount', label: 'Local Marker Saved', value: String(previewEnvelope.localMarkerSavedCount), requiredForFutureWrite: true },
    { key: 'receiptCandidateCount', label: 'Receipt Candidates', value: String(previewEnvelope.receiptCandidateCount), requiredForFutureWrite: true },
    { key: 'targetSessionCount', label: 'Target Sessions', value: String(previewEnvelope.targetSessionCount), requiredForFutureWrite: true },
    { key: 'completedProtectedCount', label: 'Completed Protected', value: String(previewEnvelope.completedProtectedCount), requiredForFutureWrite: true },
    { key: 'persistenceEnabled', label: 'Persistence Enabled', value: 'false', requiredForFutureWrite: false },
    { key: 'writeEnabled', label: 'Write Enabled', value: 'false', requiredForFutureWrite: false },
    { key: 'programCardsChanged', label: 'Program Cards Changed', value: 'false', requiredForFutureWrite: false },
    { key: 'startWorkoutChanged', label: 'Start Workout Changed', value: 'false', requiredForFutureWrite: false },
    { key: 'liveWorkoutChanged', label: 'Live Workout Changed', value: 'false', requiredForFutureWrite: false },
    { key: 'schemaChangeRequiredHere', label: 'Schema Change Required', value: 'false', requiredForFutureWrite: false },
  ]

  const readyCount = safetyItems.filter(i => i.status === 'ready').length
  const blockedCount = safetyItems.filter(i => i.status === 'blocked').length

  return {
    status: 'writer_contract_preview_ready_no_write',
    mode: 'read_only_writer_contract_preview',
    headline: 'Controlled Durable Writer Contract Ready',
    summary: 'Future durable receipt writer contract is previewable. No persistence, receipt write, or workout mutation has been enabled.',

    localMarkerSavedCount,
    receiptCandidateCount,
    writerPreviewCandidateCount: 1,
    targetSessionCount,
    completedProtectedCount,

    contractFields,
    safetyItems,
    previewEnvelope,

    readyCount,
    blockedCount,
    blockerSummary: [],
    nextRequiredStep: 'Next step may introduce the controlled durable receipt writer behind explicit persistence locks.',

    canPreviewWriterContract: true,
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

    completedSessionsProtected: true,
    noPersistenceAttempted: true,
    noReceiptWritten: true,
    noProgramChangesApplied: true,
    noWorkoutChangesApplied: true,
  }
}

// ============================================================================
// STATUS LABEL HELPER
// ============================================================================

export function getControlledDurableMarkerReceiptWriterPreviewStatusLabel(
  status: ControlledDurableMarkerReceiptWriterPreviewStatus
): string {
  switch (status) {
    case 'unavailable_missing_receipt_readiness':
      return 'unavailable'
    case 'blocked_receipt_candidate_not_ready':
      return 'receipt candidate blocked'
    case 'writer_contract_preview_ready_no_write':
      return 'writer contract ready'
    default: {
      const _exhaustive: never = status
      return String(_exhaustive)
    }
  }
}

// ============================================================================
// STATUS COLOR HELPER
// ============================================================================

export function getControlledDurableMarkerReceiptWriterPreviewStatusColor(
  status: ControlledDurableMarkerReceiptWriterPreviewStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_receipt_readiness':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    case 'blocked_receipt_candidate_not_ready':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'writer_contract_preview_ready_no_write':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    default: {
      const _exhaustive: never = status
      void _exhaustive
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
    }
  }
}
