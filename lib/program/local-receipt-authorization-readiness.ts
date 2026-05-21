/**
 * [Prompt 72] Local Receipt Authorization Readiness
 * MASTER-8C.77 / AB20.4.70
 * 
 * Pure read-only verification boundary that consumes the Prompt 69/69.1/69.2
 * local receipt gate and determines whether the authorization chain is ready
 * for durable write preflight inspection.
 * 
 * This does NOT enable durable persistence.
 * This does NOT enable storage.
 * This does NOT mutate future sessions.
 * This does NOT change Program Cards.
 * This does NOT change Start Workout.
 * This does NOT change Live Workout.
 * This does NOT touch completed sessions.
 */

import type { ControlledMarkerSaveLocalReceiptGateModel } from './controlled-marker-save-local-receipt-gate'
import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'

// ============================================================================
// Status Types
// ============================================================================

export type LocalReceiptAuthorizationStatus =
  | 'authorization_blocked_roadmap_source_missing'
  | 'authorization_blocked_local_receipt_gate_missing'
  | 'authorization_blocked_no_valid_local_receipt'
  | 'authorization_blocked_stale_local_receipt'
  | 'authorization_blocked_source_fingerprint_mismatch'
  | 'authorization_blocked_verification_not_passed'
  | 'authorization_blocked_no_target_sessions'
  | 'authorization_blocked_no_preview_changes'
  | 'authorization_blocked_mismatch_count_nonzero'
  | 'authorization_ready_local_only_no_write'

export type ReadinessItemStatus =
  | 'passed'
  | 'blocked'
  | 'failed'
  | 'protected'
  | 'pending'

export interface ReadinessItem {
  readonly key: string
  readonly label: string
  readonly status: ReadinessItemStatus
  readonly detail: string
}

// ============================================================================
// Model Type
// ============================================================================

export interface LocalReceiptAuthorizationReadinessModel {
  readonly sourceStep: 'MASTER-8C.77 / AB20.4.70 / Prompt 72'
  readonly promptNumber: 72
  readonly totalPrompts: 84
  readonly status: LocalReceiptAuthorizationStatus
  readonly headline: string
  readonly summary: string
  readonly readyForDurableWritePreflight: boolean
  readonly authorizationMode: 'local_receipt_authorization_readiness_only'
  readonly receiptMode: 'local_react_state_only'
  readonly durablePersistenceEnabled: false
  readonly storageTouched: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
  readonly roadmapStepFound: boolean
  readonly roadmapTitle: string
  readonly roadmapVisibleProofTarget: string
  readonly validLocalReceiptPresent: boolean
  readonly staleLocalReceiptPresent: boolean
  readonly validLocalReceiptCount: number
  readonly staleLocalReceiptCount: number
  readonly sourceFingerprintMatches: boolean
  readonly verificationGateStatus: string
  readonly verificationGateVerified: boolean
  readonly verificationGateMismatchCount: number
  readonly candidateId: string
  readonly targetSessionCount: number
  readonly previewChangeCount: number
  readonly blockers: readonly string[]
  readonly readinessItems: readonly ReadinessItem[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

// ============================================================================
// Resolver Input
// ============================================================================

export interface LocalReceiptAuthorizationReadinessInput {
  readonly localReceiptGateModel: ControlledMarkerSaveLocalReceiptGateModel | null | undefined
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
}

// ============================================================================
// Resolver
// ============================================================================

const VERIFIED_STATUS = 'dry_run_verified_no_write'

export function resolveLocalReceiptAuthorizationReadiness(
  input: LocalReceiptAuthorizationReadinessInput
): LocalReceiptAuthorizationReadinessModel {
  const { localReceiptGateModel, roadmapStep } = input

  const blockers: string[] = []
  const readinessItems: ReadinessItem[] = []
  const safetyNotes: string[] = [
    'Durable persistence remains disabled.',
    'No localStorage/sessionStorage touched.',
    'No DB/API/schema writes.',
    'Program Cards unchanged.',
    'Start Workout unchanged.',
    'Live Workout unchanged.',
    'Completed sessions protected.',
  ]

  // Extract roadmap info
  const roadmapStepFound = roadmapStep !== null && roadmapStep !== undefined
  const roadmapTitle = roadmapStep?.title ?? 'Roadmap step not found'
  const roadmapVisibleProofTarget = roadmapStep?.visibleProofTarget ?? 'N/A'

  // Extract gate info with safe defaults
  const validLocalReceiptPresent = localReceiptGateModel?.validLocalReceiptPresent ?? false
  const staleLocalReceiptPresent = localReceiptGateModel?.staleLocalReceiptPresent ?? false
  const validLocalReceiptCount = localReceiptGateModel?.validLocalReceiptCount ?? 0
  const staleLocalReceiptCount = localReceiptGateModel?.staleLocalReceiptCount ?? 0
  const sourceFingerprintMatches = localReceiptGateModel?.sourceFingerprintMatches ?? false
  const verificationGateStatus = localReceiptGateModel?.verificationGateStatus ?? 'unknown'
  const verificationGateVerified = localReceiptGateModel?.verificationGateVerified ?? false
  const verificationGateMismatchCount = localReceiptGateModel?.verificationGateMismatchCount ?? -1
  const candidateId = localReceiptGateModel?.candidateId ?? 'none'
  const targetSessionCount = localReceiptGateModel?.targetSessionCount ?? 0
  const previewChangeCount = localReceiptGateModel?.previewChangeCount ?? 0

  // ========================================================================
  // Check 1: Roadmap source
  // ========================================================================
  if (!roadmapStepFound) {
    blockers.push('Roadmap source for Prompt 72 not found.')
    readinessItems.push({
      key: 'roadmap_source',
      label: 'Roadmap Source',
      status: 'failed',
      detail: 'Prompt 72 entry missing from roadmap registry.',
    })
  } else {
    readinessItems.push({
      key: 'roadmap_source',
      label: 'Roadmap Source',
      status: 'passed',
      detail: roadmapTitle,
    })
  }

  // ========================================================================
  // Check 2: Local receipt gate exists
  // ========================================================================
  if (!localReceiptGateModel) {
    blockers.push('Local receipt gate model not available.')
    readinessItems.push({
      key: 'local_receipt_gate',
      label: 'Local Receipt Gate',
      status: 'failed',
      detail: 'Gate model is null or undefined.',
    })
  } else {
    readinessItems.push({
      key: 'local_receipt_gate',
      label: 'Local Receipt Gate',
      status: 'passed',
      detail: 'Gate model available.',
    })
  }

  // ========================================================================
  // Check 3: Verification gate passed
  // ========================================================================
  if (!verificationGateVerified || verificationGateStatus !== VERIFIED_STATUS) {
    blockers.push('Verification gate has not passed.')
    readinessItems.push({
      key: 'verification_gate',
      label: 'Verification Gate',
      status: 'blocked',
      detail: `Status: ${verificationGateStatus}, Verified: ${verificationGateVerified}`,
    })
  } else {
    readinessItems.push({
      key: 'verification_gate',
      label: 'Verification Gate',
      status: 'passed',
      detail: 'Dry-run verification passed (no write).',
    })
  }

  // ========================================================================
  // Check 4: Mismatch count
  // ========================================================================
  if (verificationGateMismatchCount > 0) {
    blockers.push(`Verification gate has ${verificationGateMismatchCount} mismatch(es).`)
    readinessItems.push({
      key: 'mismatch_count',
      label: 'Mismatch Count',
      status: 'failed',
      detail: `${verificationGateMismatchCount} mismatch(es) detected.`,
    })
  } else if (verificationGateMismatchCount === 0) {
    readinessItems.push({
      key: 'mismatch_count',
      label: 'Mismatch Count',
      status: 'passed',
      detail: 'No mismatches.',
    })
  } else {
    readinessItems.push({
      key: 'mismatch_count',
      label: 'Mismatch Count',
      status: 'pending',
      detail: 'Unknown (gate not available).',
    })
  }

  // ========================================================================
  // Check 5: No stale local receipt
  // ========================================================================
  if (staleLocalReceiptPresent) {
    blockers.push('Stale local receipt blocks authorization.')
    readinessItems.push({
      key: 'stale_receipt',
      label: 'Stale Receipt',
      status: 'blocked',
      detail: 'A stale local receipt exists and must be cleared.',
    })
  } else {
    readinessItems.push({
      key: 'stale_receipt',
      label: 'Stale Receipt',
      status: 'passed',
      detail: 'No stale receipt present.',
    })
  }

  // ========================================================================
  // Check 6: Source fingerprint matches
  // ========================================================================
  if (!sourceFingerprintMatches && validLocalReceiptPresent) {
    blockers.push('Source fingerprint does not match saved receipt.')
    readinessItems.push({
      key: 'source_fingerprint',
      label: 'Source Fingerprint',
      status: 'failed',
      detail: 'Fingerprint mismatch between current source and saved receipt.',
    })
  } else if (sourceFingerprintMatches) {
    readinessItems.push({
      key: 'source_fingerprint',
      label: 'Source Fingerprint',
      status: 'passed',
      detail: 'Fingerprint matches.',
    })
  } else {
    readinessItems.push({
      key: 'source_fingerprint',
      label: 'Source Fingerprint',
      status: 'pending',
      detail: 'No valid receipt to compare.',
    })
  }

  // ========================================================================
  // Check 7: Valid local receipt present
  // ========================================================================
  if (!validLocalReceiptPresent) {
    blockers.push('Valid local receipt proof required.')
    readinessItems.push({
      key: 'valid_receipt',
      label: 'Valid Local Receipt',
      status: 'blocked',
      detail: 'No valid local receipt exists.',
    })
  } else {
    readinessItems.push({
      key: 'valid_receipt',
      label: 'Valid Local Receipt',
      status: 'passed',
      detail: `${validLocalReceiptCount} valid receipt(s) present.`,
    })
  }

  // ========================================================================
  // Check 8: Target sessions
  // ========================================================================
  if (targetSessionCount <= 0) {
    blockers.push('No target sessions available.')
    readinessItems.push({
      key: 'target_sessions',
      label: 'Target Sessions',
      status: 'blocked',
      detail: 'Zero target sessions.',
    })
  } else {
    readinessItems.push({
      key: 'target_sessions',
      label: 'Target Sessions',
      status: 'passed',
      detail: `${targetSessionCount} session(s) targeted.`,
    })
  }

  // ========================================================================
  // Check 9: Preview changes
  // ========================================================================
  if (previewChangeCount <= 0) {
    blockers.push('No preview changes available.')
    readinessItems.push({
      key: 'preview_changes',
      label: 'Preview Changes',
      status: 'blocked',
      detail: 'Zero preview changes.',
    })
  } else {
    readinessItems.push({
      key: 'preview_changes',
      label: 'Preview Changes',
      status: 'passed',
      detail: `${previewChangeCount} change(s) previewed.`,
    })
  }

  // ========================================================================
  // Add protected corridor items
  // ========================================================================
  readinessItems.push({
    key: 'program_cards',
    label: 'Program Cards',
    status: 'protected',
    detail: 'Unchanged — no mutation.',
  })
  readinessItems.push({
    key: 'start_workout',
    label: 'Start Workout',
    status: 'protected',
    detail: 'Unchanged — no bridge.',
  })
  readinessItems.push({
    key: 'live_workout',
    label: 'Live Workout',
    status: 'protected',
    detail: 'Unchanged — no bridge.',
  })
  readinessItems.push({
    key: 'completed_sessions',
    label: 'Completed Sessions',
    status: 'protected',
    detail: 'Protected — never mutated.',
  })

  // ========================================================================
  // Determine final status
  // ========================================================================
  let status: LocalReceiptAuthorizationStatus
  let headline: string
  let summary: string
  let readyForDurableWritePreflight: boolean
  let nextRequiredStep: string

  if (!roadmapStepFound) {
    status = 'authorization_blocked_roadmap_source_missing'
    headline = 'Blocked — Roadmap Source Missing'
    summary = 'Cannot verify authorization without roadmap source entry.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Provide roadmap source for Prompt 72.'
  } else if (!localReceiptGateModel) {
    status = 'authorization_blocked_local_receipt_gate_missing'
    headline = 'Blocked — Local Receipt Gate Missing'
    summary = 'The local receipt gate model is not available.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Ensure local receipt gate is rendered.'
  } else if (!verificationGateVerified || verificationGateStatus !== VERIFIED_STATUS) {
    status = 'authorization_blocked_verification_not_passed'
    headline = 'Blocked — Verification Gate Not Passed'
    summary = 'The dry-run verification gate has not confirmed no-write status.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Complete dry-run verification gate.'
  } else if (verificationGateMismatchCount > 0) {
    status = 'authorization_blocked_mismatch_count_nonzero'
    headline = 'Blocked — Verification Mismatches'
    summary = `${verificationGateMismatchCount} mismatch(es) must be resolved.`
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Resolve verification mismatches.'
  } else if (staleLocalReceiptPresent) {
    status = 'authorization_blocked_stale_local_receipt'
    headline = 'Blocked — Stale Local Receipt'
    summary = 'A stale local receipt exists and cannot be used as authorization proof.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Clear stale local receipt.'
  } else if (!sourceFingerprintMatches && validLocalReceiptPresent) {
    status = 'authorization_blocked_source_fingerprint_mismatch'
    headline = 'Blocked — Source Fingerprint Mismatch'
    summary = 'The saved receipt fingerprint does not match current source.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Clear and recreate local receipt.'
  } else if (!validLocalReceiptPresent) {
    status = 'authorization_blocked_no_valid_local_receipt'
    headline = 'Blocked — Valid Local Receipt Required'
    summary = 'No valid local receipt proof exists.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Create local receipt proof via the marker-save gate.'
  } else if (targetSessionCount <= 0) {
    status = 'authorization_blocked_no_target_sessions'
    headline = 'Blocked — No Target Sessions'
    summary = 'Cannot authorize without target sessions.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Ensure target sessions are available.'
  } else if (previewChangeCount <= 0) {
    status = 'authorization_blocked_no_preview_changes'
    headline = 'Blocked — No Preview Changes'
    summary = 'Cannot authorize without preview changes.'
    readyForDurableWritePreflight = false
    nextRequiredStep = 'Ensure preview changes are available.'
  } else {
    status = 'authorization_ready_local_only_no_write'
    headline = 'Ready — Local Only / No Write'
    summary = 'Local receipt authorization is ready for durable write preflight inspection. Durable write remains disabled.'
    readyForDurableWritePreflight = true
    nextRequiredStep = 'Prompt 73 — Controlled Durable Write Preflight Boundary.'
  }

  return {
    sourceStep: 'MASTER-8C.77 / AB20.4.70 / Prompt 72',
    promptNumber: 72,
    totalPrompts: 84,
    status,
    headline,
    summary,
    readyForDurableWritePreflight,
    authorizationMode: 'local_receipt_authorization_readiness_only',
    receiptMode: 'local_react_state_only',
    durablePersistenceEnabled: false,
    storageTouched: false,
    apiTouched: false,
    dbTouched: false,
    schemaTouched: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    completedSessionsProtected: true,
    roadmapStepFound,
    roadmapTitle,
    roadmapVisibleProofTarget,
    validLocalReceiptPresent,
    staleLocalReceiptPresent,
    validLocalReceiptCount,
    staleLocalReceiptCount,
    sourceFingerprintMatches,
    verificationGateStatus,
    verificationGateVerified,
    verificationGateMismatchCount,
    candidateId,
    targetSessionCount,
    previewChangeCount,
    blockers,
    readinessItems,
    safetyNotes,
    nextRequiredStep,
  }
}

// ============================================================================
// UI Helpers
// ============================================================================

export function getLocalReceiptAuthorizationStatusLabel(status: LocalReceiptAuthorizationStatus): string {
  switch (status) {
    case 'authorization_blocked_roadmap_source_missing':
      return 'Roadmap Missing'
    case 'authorization_blocked_local_receipt_gate_missing':
      return 'Gate Missing'
    case 'authorization_blocked_no_valid_local_receipt':
      return 'Receipt Required'
    case 'authorization_blocked_stale_local_receipt':
      return 'Stale Receipt'
    case 'authorization_blocked_source_fingerprint_mismatch':
      return 'Fingerprint Mismatch'
    case 'authorization_blocked_verification_not_passed':
      return 'Verification Pending'
    case 'authorization_blocked_no_target_sessions':
      return 'No Sessions'
    case 'authorization_blocked_no_preview_changes':
      return 'No Changes'
    case 'authorization_blocked_mismatch_count_nonzero':
      return 'Mismatches'
    case 'authorization_ready_local_only_no_write':
      return 'Ready (Local Only)'
    default:
      return 'Unknown'
  }
}

export function getLocalReceiptAuthorizationStatusColor(status: LocalReceiptAuthorizationStatus): string {
  switch (status) {
    case 'authorization_ready_local_only_no_write':
      return 'lime'
    case 'authorization_blocked_stale_local_receipt':
    case 'authorization_blocked_source_fingerprint_mismatch':
    case 'authorization_blocked_mismatch_count_nonzero':
      return 'orange'
    case 'authorization_blocked_roadmap_source_missing':
    case 'authorization_blocked_local_receipt_gate_missing':
      return 'red'
    default:
      return 'amber'
  }
}

export function getReadinessItemStatusColor(status: ReadinessItemStatus): string {
  switch (status) {
    case 'passed':
      return 'lime'
    case 'blocked':
      return 'amber'
    case 'failed':
      return 'red'
    case 'protected':
      return 'cyan'
    case 'pending':
      return 'zinc'
    default:
      return 'zinc'
  }
}
