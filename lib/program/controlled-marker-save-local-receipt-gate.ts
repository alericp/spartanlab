/**
 * Controlled Marker-Save Local Receipt Gate
 * 
 * MASTER-8C.74 / AB20.4.67 / Prompt 69
 * 
 * PURPOSE:
 * A pure read-only/control model that decides whether a local marker-save receipt/proof
 * may be created from the verified Prompt 68 dry-run gate.
 * 
 * AUTHORITY:
 * The new required authority is the Prompt 68 verification gate:
 * - controlledMarkerSaveDryRunVerificationGateModel.verified === true
 * - controlledMarkerSaveDryRunVerificationGateModel.status === 'dry_run_verified_no_write'
 * - controlledMarkerSaveDryRunVerificationGateModel.targetSessionCount > 0
 * - controlledMarkerSaveDryRunVerificationGateModel.previewChangeCount > 0
 * - controlledMarkerSaveDryRunVerificationGateModel.mismatches.length === 0
 * 
 * SAFETY INVARIANTS:
 * This helper must NOT:
 * - import React
 * - access window/document/localStorage/sessionStorage
 * - call fetch/API/DB
 * - use Date.now/Math.random inside the helper
 * - write anything
 * - mutate program/workout/session data
 */

import type { ControlledMarkerSaveDryRunVerificationGateModel } from './controlled-marker-save-dry-run-verification-gate'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type ControlledMarkerSaveLocalReceiptGateStatus =
  | 'local_receipt_blocked_verification_missing'
  | 'local_receipt_blocked_verification_not_passed'
  | 'local_receipt_blocked_target_source'
  | 'local_receipt_blocked_preview_changes'
  | 'local_receipt_blocked_source_mismatch'
  | 'local_receipt_ready_local_only'
  | 'local_receipt_saved_local_only'
  | 'local_receipt_locked_duplicate'

// ============================================================================
// RECEIPT ITEM TYPE
// ============================================================================

export interface LocalReceiptItem {
  readonly key: string
  readonly label: string
  readonly value: string | number | boolean
}

// ============================================================================
// HARD SAFETY INVARIANTS TYPE
// ============================================================================

export interface LocalReceiptHardSafetyInvariants {
  readonly realMarkerWriteEnabled: false
  readonly durablePersistenceEnabled: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly storageTouched: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
}

// ============================================================================
// MODEL TYPE
// ============================================================================

export interface ControlledMarkerSaveLocalReceiptGateModel extends LocalReceiptHardSafetyInvariants {
  readonly sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69'
  readonly status: ControlledMarkerSaveLocalReceiptGateStatus
  readonly headline: string
  readonly summary: string
  readonly canShowLocalReceiptControl: boolean
  readonly canCreateLocalReceipt: boolean
  readonly localReceiptCreated: boolean
  readonly localReceiptCount: number
  readonly targetSessionCount: number
  readonly previewChangeCount: number
  readonly candidateId: string
  readonly receiptMode: 'local_react_state_only'
  readonly receiptPersistence: 'not_durable_not_browser_storage'
  readonly sourceModelsUsed: readonly string[]
  readonly receiptItems: readonly LocalReceiptItem[]
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly verificationGateStatus: string
  readonly verificationGateVerified: boolean
  readonly verificationGateMismatchCount: number
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

export function getLocalReceiptGateStatusLabel(status: ControlledMarkerSaveLocalReceiptGateStatus): string {
  switch (status) {
    case 'local_receipt_blocked_verification_missing':
      return 'BLOCKED'
    case 'local_receipt_blocked_verification_not_passed':
      return 'BLOCKED'
    case 'local_receipt_blocked_target_source':
      return 'BLOCKED'
    case 'local_receipt_blocked_preview_changes':
      return 'BLOCKED'
    case 'local_receipt_blocked_source_mismatch':
      return 'BLOCKED'
    case 'local_receipt_ready_local_only':
      return 'READY'
    case 'local_receipt_saved_local_only':
      return 'SAVED'
    case 'local_receipt_locked_duplicate':
      return 'LOCKED'
    default:
      return 'UNKNOWN'
  }
}

export function getLocalReceiptGateStatusColor(status: ControlledMarkerSaveLocalReceiptGateStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'local_receipt_blocked_verification_missing':
    case 'local_receipt_blocked_verification_not_passed':
    case 'local_receipt_blocked_target_source':
    case 'local_receipt_blocked_preview_changes':
    case 'local_receipt_blocked_source_mismatch':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
    case 'local_receipt_ready_local_only':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' }
    case 'local_receipt_saved_local_only':
      return { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/30' }
    case 'local_receipt_locked_duplicate':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' }
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' }
  }
}

// ============================================================================
// BUILDER PARAMETERS
// ============================================================================

export interface BuildControlledMarkerSaveLocalReceiptGateParams {
  readonly controlledMarkerSaveDryRunVerificationGateModel: ControlledMarkerSaveDryRunVerificationGateModel | null
  readonly localReceiptCount?: number
}

// ============================================================================
// BUILDER FUNCTION
// ============================================================================

export function buildControlledMarkerSaveLocalReceiptGateModel(
  params: BuildControlledMarkerSaveLocalReceiptGateParams
): ControlledMarkerSaveLocalReceiptGateModel {
  const {
    controlledMarkerSaveDryRunVerificationGateModel,
    localReceiptCount = 0,
  } = params

  // Hard safety invariants - always false/true, never enable mutation
  const hardInvariants: LocalReceiptHardSafetyInvariants = {
    realMarkerWriteEnabled: false,
    durablePersistenceEnabled: false,
    apiTouched: false,
    dbTouched: false,
    storageTouched: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
  }

  const sourceModelsUsed: string[] = []
  const blockers: string[] = []
  const safetyNotes: string[] = [
    'Local React state only — resets on refresh',
    'No durable persistence',
    'No DB/API/storage/schema changes',
    'Program Cards unchanged',
    'Start Workout unchanged',
    'Live Workout unchanged',
    'Completed sessions protected',
  ]
  const receiptItems: LocalReceiptItem[] = []

  // -------------------------------------------------------------------------
  // GATE 1: Verification gate model must exist
  // -------------------------------------------------------------------------
  if (!controlledMarkerSaveDryRunVerificationGateModel) {
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_blocked_verification_missing',
      headline: 'Local Receipt Blocked: Verification Gate Missing',
      summary: 'The Prompt 68 Marker-Save Dry-Run Verification Gate model is not available. Cannot proceed to local receipt creation.',
      canShowLocalReceiptControl: false,
      canCreateLocalReceipt: false,
      localReceiptCreated: false,
      localReceiptCount: 0,
      targetSessionCount: 0,
      previewChangeCount: 0,
      candidateId: '',
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed: ['controlledMarkerSaveDryRunVerificationGateModel (missing)'],
      receiptItems: [],
      blockers: ['Verification gate model is missing'],
      safetyNotes,
      verificationGateStatus: 'unknown',
      verificationGateVerified: false,
      verificationGateMismatchCount: 0,
    }
  }

  sourceModelsUsed.push('controlledMarkerSaveDryRunVerificationGateModel')

  // Extract values from verification gate
  const {
    status: verificationStatus,
    verified,
    targetSessionCount,
    previewChangeCount,
    candidateId,
    mismatches,
  } = controlledMarkerSaveDryRunVerificationGateModel

  // Build receipt items
  receiptItems.push(
    { key: 'verification_status', label: 'Verification Gate Status', value: verificationStatus },
    { key: 'verification_verified', label: 'Verification Passed', value: verified },
    { key: 'target_sessions', label: 'Target Sessions', value: targetSessionCount },
    { key: 'preview_changes', label: 'Preview Changes', value: previewChangeCount },
    { key: 'mismatch_count', label: 'Source Mismatches', value: mismatches.length },
    { key: 'candidate_id', label: 'Candidate ID', value: candidateId },
    { key: 'local_receipt_count', label: 'Local Receipt Count', value: localReceiptCount },
  )

  // -------------------------------------------------------------------------
  // GATE 2: Check if local receipt already exists (duplicate lock)
  // -------------------------------------------------------------------------
  if (localReceiptCount > 0) {
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_locked_duplicate',
      headline: 'Local Receipt Proof Created (Duplicate Locked)',
      summary: `A local receipt proof already exists (${localReceiptCount} receipt). Duplicate save is locked. No program/workout changes occurred.`,
      canShowLocalReceiptControl: true,
      canCreateLocalReceipt: false,
      localReceiptCreated: true,
      localReceiptCount,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed,
      receiptItems,
      blockers: [],
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 3: Verification must be verified === true
  // -------------------------------------------------------------------------
  if (!verified) {
    blockers.push(`Verification gate not verified: verified=${verified}`)
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_blocked_verification_not_passed',
      headline: 'Local Receipt Blocked: Verification Not Passed',
      summary: `The Prompt 68 verification gate has not verified the dry-run candidate. Status: ${verificationStatus}`,
      canShowLocalReceiptControl: true,
      canCreateLocalReceipt: false,
      localReceiptCreated: false,
      localReceiptCount: 0,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed,
      receiptItems,
      blockers,
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 4: Verification status must be 'dry_run_verified_no_write'
  // -------------------------------------------------------------------------
  if (verificationStatus !== 'dry_run_verified_no_write') {
    blockers.push(`Verification status is not dry_run_verified_no_write: ${verificationStatus}`)
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_blocked_verification_not_passed',
      headline: 'Local Receipt Blocked: Wrong Verification Status',
      summary: `The verification gate status is ${verificationStatus}, not dry_run_verified_no_write.`,
      canShowLocalReceiptControl: true,
      canCreateLocalReceipt: false,
      localReceiptCreated: false,
      localReceiptCount: 0,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed,
      receiptItems,
      blockers,
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 5: targetSessionCount must be > 0
  // -------------------------------------------------------------------------
  if (targetSessionCount <= 0) {
    blockers.push(`Target session count is ${targetSessionCount}, must be > 0`)
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_blocked_target_source',
      headline: 'Local Receipt Blocked: No Target Sessions',
      summary: `Cannot create local receipt without true target sessions. Current: ${targetSessionCount}`,
      canShowLocalReceiptControl: true,
      canCreateLocalReceipt: false,
      localReceiptCreated: false,
      localReceiptCount: 0,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed,
      receiptItems,
      blockers,
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 6: previewChangeCount must be > 0
  // -------------------------------------------------------------------------
  if (previewChangeCount <= 0) {
    blockers.push(`Preview change count is ${previewChangeCount}, must be > 0`)
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_blocked_preview_changes',
      headline: 'Local Receipt Blocked: No Preview Changes',
      summary: `Cannot create local receipt without preview changes. Current: ${previewChangeCount}`,
      canShowLocalReceiptControl: true,
      canCreateLocalReceipt: false,
      localReceiptCreated: false,
      localReceiptCount: 0,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed,
      receiptItems,
      blockers,
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 7: mismatches must be empty
  // -------------------------------------------------------------------------
  if (mismatches.length > 0) {
    blockers.push(`Source mismatches exist: ${mismatches.length} mismatch(es)`)
    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_blocked_source_mismatch',
      headline: 'Local Receipt Blocked: Source Mismatches',
      summary: `Cannot create local receipt when source mismatches exist. Mismatches: ${mismatches.join('; ')}`,
      canShowLocalReceiptControl: true,
      canCreateLocalReceipt: false,
      localReceiptCreated: false,
      localReceiptCount: 0,
      targetSessionCount,
      previewChangeCount,
      candidateId,
      receiptMode: 'local_react_state_only',
      receiptPersistence: 'not_durable_not_browser_storage',
      sourceModelsUsed,
      receiptItems,
      blockers,
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
    }
  }

  // -------------------------------------------------------------------------
  // ALL GATES PASSED: Ready for local receipt creation
  // -------------------------------------------------------------------------
  return {
    ...hardInvariants,
    sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
    status: 'local_receipt_ready_local_only',
    headline: 'Local Receipt Gate Ready (Verification-Gated)',
    summary: `The Prompt 68 verification gate has verified the dry-run candidate. Local receipt proof can now be created. No durable persistence. No program/workout changes.`,
    canShowLocalReceiptControl: true,
    canCreateLocalReceipt: true,
    localReceiptCreated: false,
    localReceiptCount: 0,
    targetSessionCount,
    previewChangeCount,
    candidateId,
    receiptMode: 'local_react_state_only',
    receiptPersistence: 'not_durable_not_browser_storage',
    sourceModelsUsed,
    receiptItems,
    blockers: [],
    safetyNotes,
    verificationGateStatus: verificationStatus,
    verificationGateVerified: verified,
    verificationGateMismatchCount: mismatches.length,
  }
}
