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
  | 'local_receipt_stale_source_changed' // [Prompt 69.1]
  | 'local_receipt_stale_verification_invalid' // [Prompt 69.1]

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
  // [Prompt 69.1] Fingerprint and stale detection fields
  readonly currentSourceFingerprint: string
  readonly savedSourceFingerprint: string
  readonly sourceFingerprintMatches: boolean
  readonly staleLocalReceiptPresent: boolean
  readonly validLocalReceiptPresent: boolean
  readonly canClearStaleLocalReceipt: boolean
  readonly validLocalReceiptCount: number
  readonly staleLocalReceiptCount: number
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
    case 'local_receipt_stale_source_changed':
      return 'STALE'
    case 'local_receipt_stale_verification_invalid':
      return 'STALE'
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
    case 'local_receipt_stale_source_changed':
    case 'local_receipt_stale_verification_invalid':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' }
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
  // [Prompt 69.1] Saved artifact source fingerprint for stale detection
  readonly savedSourceFingerprint?: string | null
  readonly hasSavedLocalReceipt?: boolean
}

// ============================================================================
// FINGERPRINT BUILDER
// ============================================================================

/**
 * [Prompt 69.1] Build deterministic source fingerprint from verification gate fields.
 * Pure function - no Date.now, Math.random, window/document/localStorage.
 */
export function buildLocalReceiptSourceFingerprint(
  verificationStatus: string,
  verified: boolean,
  candidateId: string,
  targetSessionCount: number,
  previewChangeCount: number,
  mismatchCount: number
): string {
  return `${verificationStatus}:${verified}:${candidateId}:${targetSessionCount}:${previewChangeCount}:${mismatchCount}`
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
    savedSourceFingerprint = null,
    hasSavedLocalReceipt = localReceiptCount > 0,
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
    // [Prompt 69.1] If stale receipt exists without valid gate, mark as stale
    if (hasSavedLocalReceipt) {
      return {
        ...hardInvariants,
        sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
        status: 'local_receipt_stale_verification_invalid',
        headline: 'Local Receipt Stale: Verification Gate Missing',
        summary: 'A local receipt exists but the verification gate is missing. The receipt is stale and cannot authorize future steps. Clear it and re-create after verification is valid.',
        canShowLocalReceiptControl: true,
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
        blockers: ['Verification gate model is missing', 'Stale local receipt cannot authorize next steps'],
        safetyNotes,
        verificationGateStatus: 'unknown',
        verificationGateVerified: false,
        verificationGateMismatchCount: 0,
        currentSourceFingerprint: '',
        savedSourceFingerprint: savedSourceFingerprint ?? '',
        sourceFingerprintMatches: false,
        staleLocalReceiptPresent: true,
        validLocalReceiptPresent: false,
        canClearStaleLocalReceipt: true,
        validLocalReceiptCount: 0,
        staleLocalReceiptCount: 1,
      }
    }
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
      currentSourceFingerprint: '',
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: false,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: false,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 0,
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

  // [Prompt 69.1] Build current source fingerprint
  const currentSourceFingerprint = buildLocalReceiptSourceFingerprint(
    verificationStatus,
    verified,
    candidateId,
    targetSessionCount,
    previewChangeCount,
    mismatches.length
  )

  // Build receipt items
  receiptItems.push(
    { key: 'verification_status', label: 'Verification Gate Status', value: verificationStatus },
    { key: 'verification_verified', label: 'Verification Passed', value: verified },
    { key: 'target_sessions', label: 'Target Sessions', value: targetSessionCount },
    { key: 'preview_changes', label: 'Preview Changes', value: previewChangeCount },
    { key: 'mismatch_count', label: 'Source Mismatches', value: mismatches.length },
    { key: 'candidate_id', label: 'Candidate ID', value: candidateId },
    { key: 'local_receipt_count', label: 'Local Receipt Count', value: localReceiptCount },
    { key: 'current_fingerprint', label: 'Current Source Fingerprint', value: currentSourceFingerprint },
    { key: 'saved_fingerprint', label: 'Saved Source Fingerprint', value: savedSourceFingerprint ?? 'none' },
  )

  // -------------------------------------------------------------------------
  // [Prompt 69.1] GATE 2: Validation BEFORE duplicate check
  // Check if current verification source is valid first
  // -------------------------------------------------------------------------
  const currentSourceValid = 
    verified === true &&
    verificationStatus === 'dry_run_verified_no_write' &&
    targetSessionCount > 0 &&
    previewChangeCount > 0 &&
    mismatches.length === 0

  // -------------------------------------------------------------------------
  // [Prompt 69.1] GATE 3: If saved receipt exists but current source invalid
  // -------------------------------------------------------------------------
  if (hasSavedLocalReceipt && !currentSourceValid) {
    const invalidReasons: string[] = []
    if (!verified) invalidReasons.push('verification gate not verified')
    if (verificationStatus !== 'dry_run_verified_no_write') invalidReasons.push(`status=${verificationStatus}`)
    if (targetSessionCount <= 0) invalidReasons.push(`targetSessionCount=${targetSessionCount}`)
    if (previewChangeCount <= 0) invalidReasons.push(`previewChangeCount=${previewChangeCount}`)
    if (mismatches.length > 0) invalidReasons.push(`mismatches=${mismatches.length}`)

    return {
      ...hardInvariants,
      sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
      status: 'local_receipt_stale_verification_invalid',
      headline: 'Local Receipt Stale: Verification Now Invalid',
      summary: `A local receipt exists but the verification source is now invalid (${invalidReasons.join(', ')}). Clear the stale receipt and re-create after verification passes.`,
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
      blockers: ['Verification source now invalid', 'Stale local receipt cannot authorize next steps', ...invalidReasons],
      safetyNotes,
      verificationGateStatus: verificationStatus,
      verificationGateVerified: verified,
      verificationGateMismatchCount: mismatches.length,
      currentSourceFingerprint,
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: true,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: true,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 1,
    }
  }

  // -------------------------------------------------------------------------
  // [Prompt 69.1] GATE 4: If saved receipt exists AND current source valid
  // Check fingerprint match
  // -------------------------------------------------------------------------
  if (hasSavedLocalReceipt && currentSourceValid) {
    const fingerprintMatches = savedSourceFingerprint === currentSourceFingerprint

    if (fingerprintMatches) {
      // Valid duplicate lock — receipt is valid and source matched
      return {
        ...hardInvariants,
        sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
        status: 'local_receipt_locked_duplicate',
        headline: 'Local Receipt Proof Created (Duplicate Locked)',
        summary: `A local receipt proof exists and source fingerprint matches. Duplicate save is locked. No program/workout changes occurred.`,
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
        currentSourceFingerprint,
        savedSourceFingerprint: savedSourceFingerprint ?? '',
        sourceFingerprintMatches: true,
        staleLocalReceiptPresent: false,
        validLocalReceiptPresent: true,
        canClearStaleLocalReceipt: false,
        validLocalReceiptCount: 1,
        staleLocalReceiptCount: 0,
      }
    } else {
      // Fingerprint mismatch — source changed, receipt is stale
      return {
        ...hardInvariants,
        sourceStep: 'MASTER-8C.74 / AB20.4.67 / Prompt 69',
        status: 'local_receipt_stale_source_changed',
        headline: 'Local Receipt Stale: Source Changed',
        summary: `A local receipt exists but the verification source fingerprint changed. The prior receipt is stale and cannot authorize next steps. Clear it and re-create proof.`,
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
        blockers: ['Source fingerprint changed', 'Stale local receipt cannot authorize next steps'],
        safetyNotes,
        verificationGateStatus: verificationStatus,
        verificationGateVerified: verified,
        verificationGateMismatchCount: mismatches.length,
        currentSourceFingerprint,
        savedSourceFingerprint: savedSourceFingerprint ?? '',
        sourceFingerprintMatches: false,
        staleLocalReceiptPresent: true,
        validLocalReceiptPresent: false,
        canClearStaleLocalReceipt: true,
        validLocalReceiptCount: 0,
        staleLocalReceiptCount: 1,
      }
    }
  }

  // -------------------------------------------------------------------------
  // GATE 5: No saved receipt — validate current source for ready state
  // Verification must be verified === true
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
      currentSourceFingerprint,
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: false,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: false,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 0,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 6: Verification status must be 'dry_run_verified_no_write'
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
      currentSourceFingerprint,
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: false,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: false,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 0,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 7: targetSessionCount must be > 0
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
      currentSourceFingerprint,
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: false,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: false,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 0,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 8: previewChangeCount must be > 0
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
      currentSourceFingerprint,
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: false,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: false,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 0,
    }
  }

  // -------------------------------------------------------------------------
  // GATE 9: mismatches must be empty
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
      currentSourceFingerprint,
      savedSourceFingerprint: savedSourceFingerprint ?? '',
      sourceFingerprintMatches: false,
      staleLocalReceiptPresent: false,
      validLocalReceiptPresent: false,
      canClearStaleLocalReceipt: false,
      validLocalReceiptCount: 0,
      staleLocalReceiptCount: 0,
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
    currentSourceFingerprint,
    savedSourceFingerprint: savedSourceFingerprint ?? '',
    sourceFingerprintMatches: false,
    staleLocalReceiptPresent: false,
    validLocalReceiptPresent: false,
    canClearStaleLocalReceipt: false,
    validLocalReceiptCount: 0,
    staleLocalReceiptCount: 0,
  }
}
