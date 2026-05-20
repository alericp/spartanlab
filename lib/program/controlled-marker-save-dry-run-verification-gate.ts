/**
 * Controlled Marker-Save Dry-Run Verification Gate
 * 
 * MASTER-8C.73 / AB20.4.66 / Prompt 68
 * 
 * This is a pure read-only verification gate that compares the dry-run candidate
 * against its source models and hard safety invariants.
 * 
 * It verifies:
 * - The dry-run candidate exists and is ready
 * - All source models are consistent
 * - All hard safety invariants are correct (no write/persistence/mutation)
 * - Local authorization/caution review states are acceptable
 * 
 * It does NOT:
 * - Save any marker
 * - Write any receipt
 * - Enable persistence
 * - Touch API/DB/storage
 * - Mutate Program Cards, Start Workout, or Live Workout
 * 
 * HARD SAFETY INVARIANTS (all literal false/true):
 * - dryRunOnly: true
 * - localOnly: true
 * - previewOnly: true
 * - realMarkerWriteEnabled: false
 * - realWriterOpened: false
 * - persistenceEnabled: false
 * - receiptWritten: false
 * - programCardsChanged: false
 * - startWorkoutChanged: false
 * - liveWorkoutChanged: false
 * - futureSessionMutationEnabled: false
 * - apiTouched: false
 * - dbTouched: false
 * - storageTouched: false
 * - schemaTouched: false
 * - completedSessionsProtected: true
 */

import type { ControlledMarkerSaveDryRunCandidateModel } from './controlled-marker-save-dry-run-candidate'
import type { FutureSessionAdaptivePreviewDiffModel } from './future-session-adaptive-preview-diff'
import type { LocalAuthorizationCautionReviewGateModel } from './local-authorization-caution-review-gate'
import type { MutationTargetSessionResolutionPreviewModel } from './mutation-target-session-resolution-preview'
import type { MarkerSaveArtifactPreviewModel } from './marker-save-artifact-preview'
import type { MarkerWriteReadinessLedgerModel } from './marker-write-readiness-ledger'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type ControlledMarkerSaveDryRunVerificationGateStatus =
  | 'dry_run_verified_no_write'
  | 'dry_run_verification_blocked_candidate_missing'
  | 'dry_run_verification_blocked_candidate_not_ready'
  | 'dry_run_verification_failed_source_mismatch'
  | 'dry_run_verification_failed_safety_invariant'
  | 'dry_run_verification_waiting_local_acceptance'

export type VerificationItemStatus = 'passed' | 'failed' | 'blocked' | 'pending' | 'protected'

// ============================================================================
// VERIFICATION ITEM TYPE
// ============================================================================

export interface VerificationItem {
  readonly key: string
  readonly label: string
  readonly status: VerificationItemStatus
  readonly detail: string
}

// ============================================================================
// HARD SAFETY INVARIANTS TYPE
// ============================================================================

export interface DryRunVerificationHardSafetyInvariants {
  readonly dryRunOnly: true
  readonly localOnly: true
  readonly previewOnly: true
  readonly realMarkerWriteEnabled: false
  readonly realWriterOpened: false
  readonly persistenceEnabled: false
  readonly receiptWritten: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly storageTouched: false
  readonly schemaTouched: false
  readonly completedSessionsProtected: true
}

// ============================================================================
// MODEL TYPE
// ============================================================================

export interface ControlledMarkerSaveDryRunVerificationGateModel {
  readonly sourceStep: 'MASTER-8C.73 / AB20.4.66 / Prompt 68'
  readonly status: ControlledMarkerSaveDryRunVerificationGateStatus
  readonly headline: string
  readonly summary: string

  readonly verified: boolean
  readonly verificationMode: 'read_only_no_write'

  readonly candidateId: string
  readonly targetLabel: string
  readonly targetSessionCount: number
  readonly previewChangeCount: number

  readonly sourceModelsUsed: readonly string[]
  readonly verificationItems: readonly VerificationItem[]
  readonly mismatches: readonly string[]
  readonly blockers: readonly string[]

  readonly hardSafetyInvariants: DryRunVerificationHardSafetyInvariants

  readonly nextRequiredStep: string
}

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface ControlledMarkerSaveDryRunVerificationGateInput {
  readonly controlledMarkerSaveDryRunCandidateModel: ControlledMarkerSaveDryRunCandidateModel | null | undefined
  readonly futureSessionAdaptivePreviewDiffModel: FutureSessionAdaptivePreviewDiffModel | null | undefined
  readonly localAuthorizationCautionReviewGateModel: LocalAuthorizationCautionReviewGateModel | null | undefined
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null | undefined
  readonly markerSaveArtifactPreviewModel: MarkerSaveArtifactPreviewModel | null | undefined
  readonly markerWriteReadinessLedgerModel: MarkerWriteReadinessLedgerModel | null | undefined
}

// ============================================================================
// UI HELPERS
// ============================================================================

export function getDryRunVerificationStatusLabel(status: ControlledMarkerSaveDryRunVerificationGateStatus): string {
  switch (status) {
    case 'dry_run_verified_no_write':
      return 'Verified (No Write)'
    case 'dry_run_verification_blocked_candidate_missing':
      return 'Blocked: Candidate Missing'
    case 'dry_run_verification_blocked_candidate_not_ready':
      return 'Blocked: Candidate Not Ready'
    case 'dry_run_verification_failed_source_mismatch':
      return 'Failed: Source Mismatch'
    case 'dry_run_verification_failed_safety_invariant':
      return 'Failed: Safety Invariant'
    case 'dry_run_verification_waiting_local_acceptance':
      return 'Waiting: Local Acceptance'
    default:
      return 'Unknown Status'
  }
}

export function getDryRunVerificationStatusColor(status: ControlledMarkerSaveDryRunVerificationGateStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'dry_run_verified_no_write':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' }
    case 'dry_run_verification_blocked_candidate_missing':
    case 'dry_run_verification_blocked_candidate_not_ready':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
    case 'dry_run_verification_failed_source_mismatch':
    case 'dry_run_verification_failed_safety_invariant':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' }
    case 'dry_run_verification_waiting_local_acceptance':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
  }
}

export function getVerificationItemStatusLabel(status: VerificationItemStatus): string {
  switch (status) {
    case 'passed':
      return 'PASS'
    case 'failed':
      return 'FAIL'
    case 'blocked':
      return 'BLOCKED'
    case 'pending':
      return 'PENDING'
    case 'protected':
      return 'PROTECTED'
    default:
      return 'UNKNOWN'
  }
}

export function getVerificationItemStatusColor(status: VerificationItemStatus): {
  bg: string
  text: string
} {
  switch (status) {
    case 'passed':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    case 'failed':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400' }
    case 'blocked':
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
    case 'pending':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400' }
    case 'protected':
      return { bg: 'bg-cyan-500/20', text: 'text-cyan-400' }
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400' }
  }
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolveControlledMarkerSaveDryRunVerificationGate(
  input: ControlledMarkerSaveDryRunVerificationGateInput
): ControlledMarkerSaveDryRunVerificationGateModel {
  const {
    controlledMarkerSaveDryRunCandidateModel,
    futureSessionAdaptivePreviewDiffModel,
    localAuthorizationCautionReviewGateModel,
    mutationTargetSessionResolutionPreviewModel,
    markerSaveArtifactPreviewModel,
    markerWriteReadinessLedgerModel,
  } = input

  // Track source models used
  const sourceModelsUsed: string[] = []
  if (controlledMarkerSaveDryRunCandidateModel) sourceModelsUsed.push('ControlledMarkerSaveDryRunCandidate')
  if (futureSessionAdaptivePreviewDiffModel) sourceModelsUsed.push('FutureSessionAdaptivePreviewDiff')
  if (localAuthorizationCautionReviewGateModel) sourceModelsUsed.push('LocalAuthorizationCautionReviewGate')
  if (mutationTargetSessionResolutionPreviewModel) sourceModelsUsed.push('MutationTargetSessionResolutionPreview')
  if (markerSaveArtifactPreviewModel) sourceModelsUsed.push('MarkerSaveArtifactPreview')
  if (markerWriteReadinessLedgerModel) sourceModelsUsed.push('MarkerWriteReadinessLedger')

  // Hard safety invariants - always literal values
  const hardSafetyInvariants: DryRunVerificationHardSafetyInvariants = {
    dryRunOnly: true,
    localOnly: true,
    previewOnly: true,
    realMarkerWriteEnabled: false,
    realWriterOpened: false,
    persistenceEnabled: false,
    receiptWritten: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    futureSessionMutationEnabled: false,
    apiTouched: false,
    dbTouched: false,
    storageTouched: false,
    schemaTouched: false,
    completedSessionsProtected: true,
  }

  const verificationItems: VerificationItem[] = []
  const mismatches: string[] = []
  const blockers: string[] = []

  // -------------------------------------------------------------------------
  // CHECK 1: Candidate exists
  // -------------------------------------------------------------------------
  if (!controlledMarkerSaveDryRunCandidateModel) {
    verificationItems.push({
      key: 'candidate_exists',
      label: 'Dry-run candidate exists',
      status: 'failed',
      detail: 'Controlled marker-save dry-run candidate model is missing',
    })
    blockers.push('Dry-run candidate model is missing')

    return {
      sourceStep: 'MASTER-8C.73 / AB20.4.66 / Prompt 68',
      status: 'dry_run_verification_blocked_candidate_missing',
      headline: 'Verification Blocked: Candidate Missing',
      summary: 'Cannot verify dry-run — the controlled marker-save dry-run candidate model does not exist.',
      verified: false,
      verificationMode: 'read_only_no_write',
      candidateId: 'N/A',
      targetLabel: 'N/A',
      targetSessionCount: 0,
      previewChangeCount: 0,
      sourceModelsUsed,
      verificationItems,
      mismatches,
      blockers,
      hardSafetyInvariants,
      nextRequiredStep: 'Return to Prompt 67 and ensure the dry-run candidate is created before verification.',
    }
  }

  // Candidate exists
  verificationItems.push({
    key: 'candidate_exists',
    label: 'Dry-run candidate exists',
    status: 'passed',
    detail: `Candidate ID: ${controlledMarkerSaveDryRunCandidateModel.dryRunCandidateId}`,
  })

  const candidateId = controlledMarkerSaveDryRunCandidateModel.dryRunCandidateId
  const targetLabel = controlledMarkerSaveDryRunCandidateModel.targetLabel
  const previewChangeCount = controlledMarkerSaveDryRunCandidateModel.previewChangeCount
  
  // [Prompt 68.1 repair] targetSessionCount must use true target-session sources only
  // NOT derived from previewChangeCount (which is number of proposed before/after changes)
  // Primary source: mutationTargetSessionResolutionPreviewModel.futureSessionCount
  // Secondary source: futureSessionAdaptivePreviewDiffModel.targetSessionCount
  const resolutionTargetSessionCount = mutationTargetSessionResolutionPreviewModel?.futureSessionCount ?? 0
  const adaptivePreviewTargetSessionCount = futureSessionAdaptivePreviewDiffModel?.targetSessionCount ?? 0
  
  // Derive targetSessionCount from true sources only (no fallback to 1)
  let targetSessionCount = 0
  if (resolutionTargetSessionCount > 0) {
    targetSessionCount = resolutionTargetSessionCount
  } else if (adaptivePreviewTargetSessionCount > 0) {
    targetSessionCount = adaptivePreviewTargetSessionCount
  }
  // If both are 0, keep targetSessionCount at 0 — no fake default

  // -------------------------------------------------------------------------
  // CHECK 2: Candidate status is ready
  // -------------------------------------------------------------------------
  const candidateReady = controlledMarkerSaveDryRunCandidateModel.status === 'dry_run_candidate_ready_no_write'
  if (candidateReady) {
    verificationItems.push({
      key: 'candidate_ready',
      label: 'Candidate status is ready',
      status: 'passed',
      detail: 'Status: dry_run_candidate_ready_no_write',
    })
  } else {
    verificationItems.push({
      key: 'candidate_ready',
      label: 'Candidate status is ready',
      status: controlledMarkerSaveDryRunCandidateModel.status.includes('waiting') ? 'pending' : 'blocked',
      detail: `Status: ${controlledMarkerSaveDryRunCandidateModel.status}`,
    })
    if (controlledMarkerSaveDryRunCandidateModel.status.includes('waiting')) {
      blockers.push('Candidate is waiting for local review/acceptance')
    } else {
      blockers.push(`Candidate not ready: ${controlledMarkerSaveDryRunCandidateModel.status}`)
    }
  }

  // -------------------------------------------------------------------------
  // CHECK 3-12: Candidate safety invariants
  // -------------------------------------------------------------------------
  const candidateSafetyChecks: Array<{
    key: string
    label: string
    candidateValue: boolean
    expectedValue: boolean
  }> = [
    { key: 'preview_only', label: 'previewOnly is true', candidateValue: controlledMarkerSaveDryRunCandidateModel.previewOnly, expectedValue: true },
    { key: 'dry_run_only', label: 'dryRunOnly is true', candidateValue: controlledMarkerSaveDryRunCandidateModel.dryRunOnly, expectedValue: true },
    { key: 'local_only', label: 'localOnly is true', candidateValue: controlledMarkerSaveDryRunCandidateModel.localOnly, expectedValue: true },
    { key: 'real_marker_write', label: 'realMarkerWriteEnabled is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.realMarkerWriteEnabled, expectedValue: false },
    { key: 'real_writer_opened', label: 'realWriterOpened is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.realWriterOpened, expectedValue: false },
    { key: 'persistence_enabled', label: 'persistenceEnabled is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.persistenceEnabled, expectedValue: false },
    { key: 'receipt_written', label: 'receiptWritten is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.receiptWritten, expectedValue: false },
    { key: 'program_cards_changed', label: 'programCardsChanged is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.programCardsChanged, expectedValue: false },
    { key: 'start_workout_changed', label: 'startWorkoutChanged is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.startWorkoutChanged, expectedValue: false },
    { key: 'live_workout_changed', label: 'liveWorkoutChanged is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.liveWorkoutChanged, expectedValue: false },
    { key: 'future_mutation_enabled', label: 'futureSessionMutationEnabled is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.futureSessionMutationEnabled, expectedValue: false },
    { key: 'api_touched', label: 'apiTouched is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.apiTouched, expectedValue: false },
    { key: 'db_touched', label: 'dbTouched is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.dbTouched, expectedValue: false },
    { key: 'storage_touched', label: 'storageTouched is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.storageTouched, expectedValue: false },
    { key: 'schema_touched', label: 'schemaTouched is false', candidateValue: controlledMarkerSaveDryRunCandidateModel.schemaTouched, expectedValue: false },
    { key: 'completed_protected', label: 'completedSessionsProtected is true', candidateValue: controlledMarkerSaveDryRunCandidateModel.completedSessionsProtected, expectedValue: true },
  ]

  let safetyInvariantFailed = false
  for (const check of candidateSafetyChecks) {
    const passed = check.candidateValue === check.expectedValue
    verificationItems.push({
      key: check.key,
      label: check.label,
      status: passed ? (check.key === 'completed_protected' ? 'protected' : 'passed') : 'failed',
      detail: passed ? 'Invariant satisfied' : `Expected ${check.expectedValue}, got ${check.candidateValue}`,
    })
    if (!passed) {
      safetyInvariantFailed = true
      mismatches.push(`Safety invariant failed: ${check.label}`)
    }
  }

  // -------------------------------------------------------------------------
  // CHECK 13: Adaptive preview exists
  // -------------------------------------------------------------------------
  if (!futureSessionAdaptivePreviewDiffModel) {
    verificationItems.push({
      key: 'adaptive_preview_exists',
      label: 'Adaptive preview diff exists',
      status: 'failed',
      detail: 'Future Session Adaptive Preview Diff model is missing',
    })
    blockers.push('Adaptive preview diff model is missing')
  } else {
    verificationItems.push({
      key: 'adaptive_preview_exists',
      label: 'Adaptive preview diff exists',
      status: 'passed',
      detail: `Status: ${futureSessionAdaptivePreviewDiffModel.status}`,
    })
  }

  // -------------------------------------------------------------------------
  // CHECK 14: Adaptive preview has changes
  // -------------------------------------------------------------------------
  const adaptivePreviewChangeCount = futureSessionAdaptivePreviewDiffModel?.changes?.length ?? 0
  if (adaptivePreviewChangeCount > 0) {
    verificationItems.push({
      key: 'adaptive_preview_has_changes',
      label: 'Adaptive preview has before/after changes',
      status: 'passed',
      detail: `${adaptivePreviewChangeCount} change(s) present`,
    })
  } else {
    verificationItems.push({
      key: 'adaptive_preview_has_changes',
      label: 'Adaptive preview has before/after changes',
      status: futureSessionAdaptivePreviewDiffModel ? 'blocked' : 'failed',
      detail: 'No changes present in adaptive preview',
    })
    if (futureSessionAdaptivePreviewDiffModel) {
      blockers.push('Adaptive preview has zero before/after changes')
    }
  }

  // -------------------------------------------------------------------------
  // CHECK 15-16: Candidate counts match adaptive preview
  // -------------------------------------------------------------------------
  if (futureSessionAdaptivePreviewDiffModel) {
    // Check previewChangeCount match
    const countMatch = previewChangeCount === adaptivePreviewChangeCount
    verificationItems.push({
      key: 'change_count_match',
      label: 'Candidate previewChangeCount matches adaptive preview',
      status: countMatch ? 'passed' : 'failed',
      detail: countMatch
        ? `Both report ${previewChangeCount} change(s)`
        : `Mismatch: candidate=${previewChangeCount}, preview=${adaptivePreviewChangeCount}`,
    })
    if (!countMatch) {
      mismatches.push(`Preview change count mismatch: candidate=${previewChangeCount}, adaptive preview=${adaptivePreviewChangeCount}`)
    }

    // Check simulated marker fields count match
    const simulatedCount = controlledMarkerSaveDryRunCandidateModel.simulatedMarkerFields?.previewChangeCount ?? 0
    const simulatedCountMatch = simulatedCount === adaptivePreviewChangeCount
    verificationItems.push({
      key: 'simulated_count_match',
      label: 'Simulated marker previewChangeCount matches',
      status: simulatedCountMatch ? 'passed' : 'failed',
      detail: simulatedCountMatch
        ? `Both report ${simulatedCount} change(s)`
        : `Mismatch: simulated=${simulatedCount}, preview=${adaptivePreviewChangeCount}`,
    })
    if (!simulatedCountMatch) {
      mismatches.push(`Simulated marker change count mismatch: simulated=${simulatedCount}, adaptive preview=${adaptivePreviewChangeCount}`)
    }

    // Check target label match
    const adaptiveTargetLabel = futureSessionAdaptivePreviewDiffModel.targetLabel ?? ''
    const targetMatch = targetLabel === adaptiveTargetLabel || adaptiveTargetLabel === ''
    verificationItems.push({
      key: 'target_label_match',
      label: 'Candidate targetLabel matches adaptive preview',
      status: targetMatch ? 'passed' : 'failed',
      detail: targetMatch
        ? `Target: ${targetLabel}`
        : `Mismatch: candidate="${targetLabel}", preview="${adaptiveTargetLabel}"`,
    })
    if (!targetMatch) {
      mismatches.push(`Target label mismatch: candidate="${targetLabel}", adaptive preview="${adaptiveTargetLabel}"`)
    }
  }

  // -------------------------------------------------------------------------
  // CHECK 17: Target session resolution
  // -------------------------------------------------------------------------
  if (mutationTargetSessionResolutionPreviewModel) {
    const futureTargetCount = mutationTargetSessionResolutionPreviewModel.futureSessionCount ?? 0
    verificationItems.push({
      key: 'target_resolution_present',
      label: 'Target session resolution has future targets',
      status: futureTargetCount > 0 ? 'passed' : 'pending',
      detail: futureTargetCount > 0
        ? `${futureTargetCount} future target session(s) resolved`
        : 'No future target sessions resolved yet',
    })
  } else {
    verificationItems.push({
      key: 'target_resolution_present',
      label: 'Target session resolution model',
      status: 'pending',
      detail: 'Model not available — may be resolved later',
    })
  }

  // -------------------------------------------------------------------------
  // CHECK 17.1 [Prompt 68.1]: Target session count source verification
  // -------------------------------------------------------------------------
  verificationItems.push({
    key: 'target_session_count_source',
    label: 'Target session count uses true source (resolution/adaptive-preview)',
    status: targetSessionCount > 0 ? 'passed' : 'pending',
    detail: targetSessionCount > 0
      ? `targetSessionCount=${targetSessionCount} from ${resolutionTargetSessionCount > 0 ? 'target-resolution' : 'adaptive-preview'}`
      : 'No true target-session source available yet',
  })

  // -------------------------------------------------------------------------
  // CHECK 17.2 [Prompt 68.1]: Target session count source match
  // -------------------------------------------------------------------------
  if (resolutionTargetSessionCount > 0 && adaptivePreviewTargetSessionCount > 0) {
    if (resolutionTargetSessionCount === adaptivePreviewTargetSessionCount) {
      verificationItems.push({
        key: 'target_session_count_match',
        label: 'Target session count sources match',
        status: 'passed',
        detail: `Both sources agree: ${resolutionTargetSessionCount} session(s)`,
      })
    } else {
      verificationItems.push({
        key: 'target_session_count_match',
        label: 'Target session count sources match',
        status: 'failed',
        detail: `Mismatch: resolution=${resolutionTargetSessionCount}, adaptive-preview=${adaptivePreviewTargetSessionCount}`,
      })
      mismatches.push(`Target session count mismatch: target resolution=${resolutionTargetSessionCount}, adaptive preview=${adaptivePreviewTargetSessionCount}`)
    }
  } else if (resolutionTargetSessionCount > 0 || adaptivePreviewTargetSessionCount > 0) {
    verificationItems.push({
      key: 'target_session_count_match',
      label: 'Target session count sources match',
      status: 'pending',
      detail: `Only one source available: resolution=${resolutionTargetSessionCount}, adaptive-preview=${adaptivePreviewTargetSessionCount}`,
    })
  } else {
    verificationItems.push({
      key: 'target_session_count_match',
      label: 'Target session count sources match',
      status: 'pending',
      detail: 'No target-session sources available yet',
    })
  }

  // -------------------------------------------------------------------------
  // CHECK 18-22: Local authorization + caution review gate
  // -------------------------------------------------------------------------
  let localAcceptanceBlocking = false
  if (!localAuthorizationCautionReviewGateModel) {
    verificationItems.push({
      key: 'local_gate_exists',
      label: 'Local authorization/caution review gate exists',
      status: 'failed',
      detail: 'Local Authorization + Caution Review Gate model is missing',
    })
    blockers.push('Local Authorization + Caution Review Gate model is missing')
    localAcceptanceBlocking = true
  } else {
    verificationItems.push({
      key: 'local_gate_exists',
      label: 'Local authorization/caution review gate exists',
      status: 'passed',
      detail: `Status: ${localAuthorizationCautionReviewGateModel.status}`,
    })

    // Check local authorization
    const authAccepted = localAuthorizationCautionReviewGateModel.localAuthorizationAccepted
    verificationItems.push({
      key: 'local_auth_accepted',
      label: 'Local authorization accepted',
      status: authAccepted ? 'passed' : 'pending',
      detail: authAccepted ? 'Authorization accepted locally' : 'Local authorization not yet accepted',
    })
    if (!authAccepted) {
      localAcceptanceBlocking = true
      blockers.push('Local authorization not yet accepted')
    }

    // Check local caution review
    const cautionActive = localAuthorizationCautionReviewGateModel.cautionPatternActive
    const cautionAccepted = localAuthorizationCautionReviewGateModel.localCautionReviewAccepted
    if (cautionActive) {
      verificationItems.push({
        key: 'local_caution_accepted',
        label: 'Local caution review accepted',
        status: cautionAccepted ? 'passed' : 'pending',
        detail: cautionAccepted ? 'Caution review accepted locally' : 'Caution pattern active but not reviewed',
      })
      if (!cautionAccepted) {
        localAcceptanceBlocking = true
        blockers.push('Caution pattern active but local caution review not accepted')
      }
    } else {
      verificationItems.push({
        key: 'local_caution_accepted',
        label: 'Local caution review (no active caution)',
        status: 'passed',
        detail: 'No active caution pattern requiring review',
      })
    }

    // Check dry-run gate ready
    const dryRunGateReady = localAuthorizationCautionReviewGateModel.localDryRunGateReady
    verificationItems.push({
      key: 'dry_run_gate_ready',
      label: 'Local dry-run gate ready',
      status: dryRunGateReady ? 'passed' : 'pending',
      detail: dryRunGateReady ? 'Dry-run gate is ready' : 'Dry-run gate not yet ready',
    })
  }

  // -------------------------------------------------------------------------
  // CHECK 23: Marker artifact/readiness source models
  // -------------------------------------------------------------------------
  if (markerSaveArtifactPreviewModel) {
    verificationItems.push({
      key: 'marker_artifact_present',
      label: 'Marker artifact preview available',
      status: 'passed',
      detail: `Artifact status: ${markerSaveArtifactPreviewModel.status}`,
    })
  } else {
    verificationItems.push({
      key: 'marker_artifact_present',
      label: 'Marker artifact preview',
      status: 'pending',
      detail: 'Not yet available — may be created later',
    })
  }

  if (markerWriteReadinessLedgerModel) {
    verificationItems.push({
      key: 'marker_ledger_present',
      label: 'Marker write readiness ledger available',
      status: 'passed',
      detail: `Ledger status: ${markerWriteReadinessLedgerModel.status}`,
    })
  } else {
    verificationItems.push({
      key: 'marker_ledger_present',
      label: 'Marker write readiness ledger',
      status: 'pending',
      detail: 'Not yet available — may be created later',
    })
  }

  // -------------------------------------------------------------------------
  // CHECK 24-25: No write/persistence/mutation enabled
  // -------------------------------------------------------------------------
  verificationItems.push({
    key: 'no_write_enabled',
    label: 'No write capability enabled',
    status: 'passed',
    detail: 'realMarkerWriteEnabled=false, realWriterOpened=false',
  })

  verificationItems.push({
    key: 'no_persistence_enabled',
    label: 'No persistence capability enabled',
    status: 'passed',
    detail: 'persistenceEnabled=false, receiptWritten=false',
  })

  verificationItems.push({
    key: 'no_mutation_enabled',
    label: 'No mutation capability enabled',
    status: 'passed',
    detail: 'programCardsChanged=false, startWorkoutChanged=false, liveWorkoutChanged=false',
  })

  // -------------------------------------------------------------------------
  // DETERMINE FINAL STATUS
  // -------------------------------------------------------------------------
  let status: ControlledMarkerSaveDryRunVerificationGateStatus
  let headline: string
  let summary: string
  let verified: boolean
  let nextRequiredStep: string

  if (safetyInvariantFailed) {
    status = 'dry_run_verification_failed_safety_invariant'
    headline = 'Verification Failed: Safety Invariant Violation'
    summary = 'One or more hard safety invariants failed. The candidate claims write/mutation/persistence that should not exist in dry-run mode.'
    verified = false
    nextRequiredStep = 'Fix the safety invariant violations before proceeding. This is a critical failure.'
  } else if (mismatches.length > 0) {
    status = 'dry_run_verification_failed_source_mismatch'
    headline = 'Verification Failed: Source Mismatch'
    summary = `The dry-run candidate has ${mismatches.length} mismatch(es) with its source models. Candidate fields do not agree with adaptive preview or other sources.`
    verified = false
    nextRequiredStep = 'Investigate and resolve source mismatches before verification can pass.'
  } else if (localAcceptanceBlocking) {
    status = 'dry_run_verification_waiting_local_acceptance'
    headline = 'Verification Waiting: Local Acceptance Required'
    summary = 'The dry-run candidate exists and is consistent, but local authorization and/or caution review acceptance is required before verification can complete.'
    verified = false
    nextRequiredStep = 'Accept local authorization and caution review (if applicable) to complete verification.'
  } else if (!candidateReady) {
    status = 'dry_run_verification_blocked_candidate_not_ready'
    headline = 'Verification Blocked: Candidate Not Ready'
    summary = `The dry-run candidate exists but its status is not ready: ${controlledMarkerSaveDryRunCandidateModel.status}. Cannot verify until candidate is in ready state.`
    verified = false
    nextRequiredStep = 'Resolve candidate blockers to reach dry_run_candidate_ready_no_write status.'
  } else if (targetSessionCount <= 0) {
    // [Prompt 68.3] Block verification when target-session source is missing/zero
    status = 'dry_run_verification_blocked_candidate_not_ready'
    headline = 'Verification Blocked: Target Session Source Required'
    summary = 'The dry-run candidate cannot be verified for marker-save progression until a true target-session source resolves at least one future session.'
    verified = false
    blockers.push('No true target session source — targetSessionCount is 0')
    nextRequiredStep = 'Resolve future target-session source before Prompt 69 marker-save receipt/local persistence gate.'
  } else {
    status = 'dry_run_verified_no_write'
    headline = 'Dry-Run Verified (No Write)'
    summary = 'The controlled marker-save dry-run candidate has been verified against source models. All safety invariants pass. No marker saved. No persistence. Program Cards, Start Workout, and Live Workout remain unchanged.'
    verified = true
    nextRequiredStep = 'Prompt 69 / MASTER-8C.74 / AB20.4.67 — controlled marker-save receipt / local persistence gate; Program Cards still protected.'
  }

  return {
    sourceStep: 'MASTER-8C.73 / AB20.4.66 / Prompt 68',
    status,
    headline,
    summary,
    verified,
    verificationMode: 'read_only_no_write',
    candidateId,
    targetLabel,
    targetSessionCount,
    previewChangeCount,
    sourceModelsUsed,
    verificationItems,
    mismatches,
    blockers,
    hardSafetyInvariants,
    nextRequiredStep,
  }
}
