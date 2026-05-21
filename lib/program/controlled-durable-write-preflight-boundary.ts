/**
 * Controlled Durable Write Preflight Boundary
 * MASTER-8C.78 / AB20.4.71 / Prompt 73 of 84
 * 
 * Read-only preflight boundary that consumes Prompt 72 Local Receipt Authorization
 * Readiness and previews whether the durable-write corridor is eligible for inspection.
 * 
 * IMPORTANT INVARIANTS:
 * - This is a PREFLIGHT BOUNDARY, not a writer.
 * - durableWritePreflightReady means "preflight ready for future writer design inspection."
 * - It does NOT mean durable write is enabled.
 * - It does NOT mean storage is allowed.
 * - It does NOT mean mutation is allowed.
 * - It does NOT mean a receipt has been written.
 * 
 * RULES:
 * - No React imports
 * - No browser APIs (window/document)
 * - No localStorage/sessionStorage
 * - No fetch
 * - No DB/API imports
 * - No Date.now
 * - No Math.random
 * - No side effects
 * - No mutation of inputs
 */

import type { LocalReceiptAuthorizationReadinessModel } from './local-receipt-authorization-readiness'
import type { PlanLogicMutationReadinessRoadmapStep } from './plan-logic-mutation-readiness-roadmap-source'

// ============================================================================
// STATUS TYPES
// ============================================================================

export type ControlledDurableWritePreflightStatus =
  | 'preflight_blocked_roadmap_source_missing'
  | 'preflight_blocked_local_authorization_missing'
  | 'preflight_blocked_local_authorization_not_ready'
  | 'preflight_blocked_valid_receipt_missing'
  | 'preflight_blocked_stale_receipt_present'
  | 'preflight_blocked_fingerprint_not_matched'
  | 'preflight_blocked_verification_not_passed'
  | 'preflight_blocked_no_target_sessions'
  | 'preflight_blocked_no_preview_changes'
  | 'preflight_ready_no_write'

export type DurableWritePreflightItemStatus =
  | 'passed'
  | 'blocked'
  | 'failed'
  | 'protected'
  | 'pending'

// ============================================================================
// ITEM TYPE
// ============================================================================

export interface DurableWritePreflightItem {
  readonly key: string
  readonly label: string
  readonly status: DurableWritePreflightItemStatus
  readonly detail: string
}

// ============================================================================
// MODEL TYPE
// ============================================================================

export interface ControlledDurableWritePreflightBoundaryModel {
  readonly sourceStep: 'MASTER-8C.78 / AB20.4.71 / Prompt 73'
  readonly promptNumber: 73
  readonly totalPrompts: 84
  readonly status: ControlledDurableWritePreflightStatus
  readonly headline: string
  readonly summary: string
  
  // Preflight readiness (NOT write enablement)
  readonly durableWritePreflightReady: boolean
  
  // Hard invariants - all must be false
  readonly durableWriteEnabled: false
  readonly durablePersistenceEnabled: false
  readonly durableReceiptWritten: false
  readonly storageTouched: false
  readonly apiTouched: false
  readonly dbTouched: false
  readonly schemaTouched: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly futureSessionMutationEnabled: false
  readonly completedSessionsProtected: true
  
  // Roadmap source
  readonly roadmapStepFound: boolean
  readonly roadmapTitle: string
  readonly roadmapVisibleProofTarget: string
  
  // Upstream Prompt 72 status
  readonly upstreamPrompt72Status: string
  readonly upstreamPrompt72Ready: boolean
  
  // Key checks from upstream
  readonly validLocalReceiptPresent: boolean
  readonly staleLocalReceiptPresent: boolean
  readonly sourceFingerprintMatches: boolean
  readonly verificationGateVerified: boolean
  readonly verificationGateStatus: string
  readonly verificationGateMismatchCount: number
  readonly targetSessionCount: number
  readonly previewChangeCount: number
  readonly candidateId: string
  
  // Preflight items
  readonly preflightItems: readonly DurableWritePreflightItem[]
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
}

// ============================================================================
// INPUT TYPE
// ============================================================================

export interface ControlledDurableWritePreflightBoundaryInput {
  readonly localReceiptAuthorizationReadinessModel: LocalReceiptAuthorizationReadinessModel | null | undefined
  readonly roadmapStep: PlanLogicMutationReadinessRoadmapStep | null | undefined
}

// ============================================================================
// RESOLVER
// ============================================================================

export function resolveControlledDurableWritePreflightBoundary(
  input: ControlledDurableWritePreflightBoundaryInput
): ControlledDurableWritePreflightBoundaryModel {
  const { localReceiptAuthorizationReadinessModel, roadmapStep } = input
  
  // Static invariants
  const sourceStep = 'MASTER-8C.78 / AB20.4.71 / Prompt 73' as const
  const promptNumber = 73 as const
  const totalPrompts = 84 as const
  const durableWriteEnabled = false as const
  const durablePersistenceEnabled = false as const
  const durableReceiptWritten = false as const
  const storageTouched = false as const
  const apiTouched = false as const
  const dbTouched = false as const
  const schemaTouched = false as const
  const programCardsChanged = false as const
  const startWorkoutChanged = false as const
  const liveWorkoutChanged = false as const
  const futureSessionMutationEnabled = false as const
  const completedSessionsProtected = true as const
  
  // Safety notes
  const safetyNotes: readonly string[] = [
    'This is a preflight boundary, not a durable writer.',
    'durableWritePreflightReady means preflight inspection is ready, not that write is enabled.',
    'No localStorage/sessionStorage/API/DB/schema write is performed.',
    'Program Cards, Start Workout, Live Workout remain unchanged.',
    'Future-session mutation remains disabled.',
    'Completed sessions remain protected.',
  ]
  
  // Roadmap source check
  const roadmapStepFound = roadmapStep !== null && roadmapStep !== undefined
  const roadmapTitle = roadmapStepFound ? roadmapStep.title : 'Prompt 73 roadmap entry not found'
  const roadmapVisibleProofTarget = roadmapStepFound ? roadmapStep.visibleProofTarget : 'unknown'
  
  // Upstream model check
  const hasUpstreamModel = localReceiptAuthorizationReadinessModel !== null && localReceiptAuthorizationReadinessModel !== undefined
  const upstreamPrompt72Status = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.status : 'missing'
  const upstreamPrompt72Ready = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.readyForDurableWritePreflight : false
  
  // Extract values from upstream (with safe defaults)
  const validLocalReceiptPresent = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.validLocalReceiptPresent : false
  const staleLocalReceiptPresent = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.staleLocalReceiptPresent : false
  const sourceFingerprintMatches = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.sourceFingerprintMatches : false
  const verificationGateVerified = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.verificationGateVerified : false
  const verificationGateStatus = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.verificationGateStatus : 'unknown'
  const verificationGateMismatchCount = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.verificationGateMismatchCount : -1
  const targetSessionCount = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.targetSessionCount : 0
  const previewChangeCount = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.previewChangeCount : 0
  const candidateId = hasUpstreamModel ? localReceiptAuthorizationReadinessModel.candidateId : 'none'
  
  // Build preflight items
  const preflightItems: DurableWritePreflightItem[] = []
  const blockers: string[] = []
  
  // 1. Roadmap source check
  preflightItems.push({
    key: 'roadmap_source',
    label: 'Roadmap Source',
    status: roadmapStepFound ? 'passed' : 'blocked',
    detail: roadmapStepFound ? `Found: ${roadmapTitle}` : 'Prompt 73 roadmap entry not found',
  })
  if (!roadmapStepFound) {
    blockers.push('Prompt 73 roadmap source entry not found.')
  }
  
  // 2. Upstream model exists
  preflightItems.push({
    key: 'upstream_model',
    label: 'Prompt 72 Model',
    status: hasUpstreamModel ? 'passed' : 'blocked',
    detail: hasUpstreamModel ? 'Local Receipt Authorization Readiness model present' : 'Prompt 72 model missing',
  })
  if (!hasUpstreamModel) {
    blockers.push('Prompt 72 Local Receipt Authorization Readiness model is missing.')
  }
  
  // 3. Upstream ready check
  preflightItems.push({
    key: 'upstream_ready',
    label: 'Prompt 72 Ready',
    status: upstreamPrompt72Ready ? 'passed' : 'blocked',
    detail: upstreamPrompt72Ready 
      ? 'Prompt 72 authorization is ready local-only/no-write'
      : `Prompt 72 status: ${upstreamPrompt72Status}`,
  })
  if (!upstreamPrompt72Ready) {
    blockers.push('Prompt 72 Local Receipt Authorization is not ready.')
  }
  
  // 4. Valid local receipt
  preflightItems.push({
    key: 'valid_receipt',
    label: 'Valid Local Receipt',
    status: validLocalReceiptPresent ? 'passed' : 'blocked',
    detail: validLocalReceiptPresent ? 'Valid local receipt present' : 'No valid local receipt',
  })
  if (!validLocalReceiptPresent) {
    blockers.push('Valid local receipt is missing.')
  }
  
  // 5. No stale receipt
  preflightItems.push({
    key: 'no_stale_receipt',
    label: 'No Stale Receipt',
    status: !staleLocalReceiptPresent ? 'passed' : 'blocked',
    detail: !staleLocalReceiptPresent ? 'No stale receipt present' : 'Stale local receipt blocks preflight',
  })
  if (staleLocalReceiptPresent) {
    blockers.push('Stale local receipt is present — blocks preflight.')
  }
  
  // 6. Fingerprint match
  preflightItems.push({
    key: 'fingerprint_match',
    label: 'Source Fingerprint',
    status: sourceFingerprintMatches ? 'passed' : 'blocked',
    detail: sourceFingerprintMatches ? 'Source fingerprint matches' : 'Source fingerprint mismatch',
  })
  if (!sourceFingerprintMatches) {
    blockers.push('Source fingerprint does not match.')
  }
  
  // 7. Verification gate
  preflightItems.push({
    key: 'verification_gate',
    label: 'Verification Gate',
    status: verificationGateVerified ? 'passed' : 'blocked',
    detail: verificationGateVerified 
      ? `Verified: ${verificationGateStatus}`
      : `Not verified: ${verificationGateStatus}`,
  })
  if (!verificationGateVerified) {
    blockers.push('Verification gate has not passed.')
  }
  
  // 8. No mismatches
  preflightItems.push({
    key: 'no_mismatches',
    label: 'No Mismatches',
    status: verificationGateMismatchCount === 0 ? 'passed' : 'blocked',
    detail: verificationGateMismatchCount === 0 
      ? 'Zero mismatches'
      : `${verificationGateMismatchCount} mismatch(es) found`,
  })
  if (verificationGateMismatchCount > 0) {
    blockers.push(`${verificationGateMismatchCount} verification mismatch(es) found.`)
  }
  
  // 9. Target sessions
  preflightItems.push({
    key: 'target_sessions',
    label: 'Target Sessions',
    status: targetSessionCount > 0 ? 'passed' : 'blocked',
    detail: targetSessionCount > 0 
      ? `${targetSessionCount} target session(s)`
      : 'No target sessions',
  })
  if (targetSessionCount <= 0) {
    blockers.push('No target sessions identified.')
  }
  
  // 10. Preview changes
  preflightItems.push({
    key: 'preview_changes',
    label: 'Preview Changes',
    status: previewChangeCount > 0 ? 'passed' : 'blocked',
    detail: previewChangeCount > 0 
      ? `${previewChangeCount} preview change(s)`
      : 'No preview changes',
  })
  if (previewChangeCount <= 0) {
    blockers.push('No preview changes identified.')
  }
  
  // Add protection items
  preflightItems.push({
    key: 'program_cards',
    label: 'Program Cards',
    status: 'protected',
    detail: 'Unchanged — no durable write',
  })
  preflightItems.push({
    key: 'start_workout',
    label: 'Start Workout',
    status: 'protected',
    detail: 'Unchanged — no bridge',
  })
  preflightItems.push({
    key: 'live_workout',
    label: 'Live Workout',
    status: 'protected',
    detail: 'Unchanged — no bridge',
  })
  preflightItems.push({
    key: 'completed_sessions',
    label: 'Completed Sessions',
    status: 'protected',
    detail: 'Protected — never mutated',
  })
  
  // Determine final status
  let status: ControlledDurableWritePreflightStatus
  let durableWritePreflightReady: boolean
  let headline: string
  let summary: string
  let nextRequiredStep: string
  
  if (!roadmapStepFound) {
    status = 'preflight_blocked_roadmap_source_missing'
    durableWritePreflightReady = false
    headline = 'Blocked — Roadmap Source Missing'
    summary = 'Prompt 73 roadmap entry not found in registry.'
    nextRequiredStep = 'Verify roadmap source includes Prompt 73 entry.'
  } else if (!hasUpstreamModel) {
    status = 'preflight_blocked_local_authorization_missing'
    durableWritePreflightReady = false
    headline = 'Blocked — Authorization Model Missing'
    summary = 'Prompt 72 Local Receipt Authorization Readiness model is not available.'
    nextRequiredStep = 'Ensure Prompt 72 model is built and passed to Prompt 73.'
  } else if (!upstreamPrompt72Ready) {
    status = 'preflight_blocked_local_authorization_not_ready'
    durableWritePreflightReady = false
    headline = 'Blocked — Local Authorization Not Ready'
    summary = `Prompt 72 status is "${upstreamPrompt72Status}" — not ready for durable preflight.`
    nextRequiredStep = 'Complete Prompt 72 local receipt authorization first.'
  } else if (!validLocalReceiptPresent) {
    status = 'preflight_blocked_valid_receipt_missing'
    durableWritePreflightReady = false
    headline = 'Blocked — Valid Receipt Missing'
    summary = 'No valid local receipt proof exists.'
    nextRequiredStep = 'Create valid local receipt proof via existing gate.'
  } else if (staleLocalReceiptPresent) {
    status = 'preflight_blocked_stale_receipt_present'
    durableWritePreflightReady = false
    headline = 'Blocked — Stale Receipt Present'
    summary = 'A stale local receipt is blocking durable write preflight.'
    nextRequiredStep = 'Clear stale receipt and create fresh valid receipt.'
  } else if (!sourceFingerprintMatches) {
    status = 'preflight_blocked_fingerprint_not_matched'
    durableWritePreflightReady = false
    headline = 'Blocked — Fingerprint Mismatch'
    summary = 'Source fingerprint does not match saved receipt fingerprint.'
    nextRequiredStep = 'Recreate local receipt with current source fingerprint.'
  } else if (!verificationGateVerified) {
    status = 'preflight_blocked_verification_not_passed'
    durableWritePreflightReady = false
    headline = 'Blocked — Verification Gate Not Passed'
    summary = `Verification gate status: "${verificationGateStatus}" — not verified.`
    nextRequiredStep = 'Pass verification gate before durable write preflight.'
  } else if (targetSessionCount <= 0) {
    status = 'preflight_blocked_no_target_sessions'
    durableWritePreflightReady = false
    headline = 'Blocked — No Target Sessions'
    summary = 'No future sessions are targeted for adaptation.'
    nextRequiredStep = 'Generate program with future sessions to adapt.'
  } else if (previewChangeCount <= 0) {
    status = 'preflight_blocked_no_preview_changes'
    durableWritePreflightReady = false
    headline = 'Blocked — No Preview Changes'
    summary = 'No preview changes have been identified.'
    nextRequiredStep = 'Generate adaptation preview with changes.'
  } else {
    status = 'preflight_ready_no_write'
    durableWritePreflightReady = true
    headline = 'Preflight Ready — No Write'
    summary = 'Durable write preflight boundary is ready for inspection. No actual write is performed.'
    nextRequiredStep = 'Prompt 74 — Future-Session Mutation Writer Readiness Boundary.'
  }
  
  return {
    sourceStep,
    promptNumber,
    totalPrompts,
    status,
    headline,
    summary,
    durableWritePreflightReady,
    durableWriteEnabled,
    durablePersistenceEnabled,
    durableReceiptWritten,
    storageTouched,
    apiTouched,
    dbTouched,
    schemaTouched,
    programCardsChanged,
    startWorkoutChanged,
    liveWorkoutChanged,
    futureSessionMutationEnabled,
    completedSessionsProtected,
    roadmapStepFound,
    roadmapTitle,
    roadmapVisibleProofTarget,
    upstreamPrompt72Status,
    upstreamPrompt72Ready,
    validLocalReceiptPresent,
    staleLocalReceiptPresent,
    sourceFingerprintMatches,
    verificationGateVerified,
    verificationGateStatus,
    verificationGateMismatchCount,
    targetSessionCount,
    previewChangeCount,
    candidateId,
    preflightItems,
    blockers,
    safetyNotes,
    nextRequiredStep,
  }
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

export function getControlledDurableWritePreflightStatusLabel(
  status: ControlledDurableWritePreflightStatus
): string {
  switch (status) {
    case 'preflight_blocked_roadmap_source_missing':
      return 'blocked (roadmap)'
    case 'preflight_blocked_local_authorization_missing':
      return 'blocked (auth model)'
    case 'preflight_blocked_local_authorization_not_ready':
      return 'blocked (auth not ready)'
    case 'preflight_blocked_valid_receipt_missing':
      return 'blocked (no receipt)'
    case 'preflight_blocked_stale_receipt_present':
      return 'blocked (stale)'
    case 'preflight_blocked_fingerprint_not_matched':
      return 'blocked (fingerprint)'
    case 'preflight_blocked_verification_not_passed':
      return 'blocked (verification)'
    case 'preflight_blocked_no_target_sessions':
      return 'blocked (no targets)'
    case 'preflight_blocked_no_preview_changes':
      return 'blocked (no changes)'
    case 'preflight_ready_no_write':
      return 'ready (no write)'
    default:
      return 'unknown'
  }
}

export function getControlledDurableWritePreflightStatusColor(
  status: ControlledDurableWritePreflightStatus
): 'lime' | 'amber' | 'orange' | 'red' | 'cyan' | 'zinc' | 'violet' {
  switch (status) {
    case 'preflight_ready_no_write':
      return 'lime'
    case 'preflight_blocked_roadmap_source_missing':
    case 'preflight_blocked_local_authorization_missing':
    case 'preflight_blocked_local_authorization_not_ready':
    case 'preflight_blocked_valid_receipt_missing':
    case 'preflight_blocked_fingerprint_not_matched':
    case 'preflight_blocked_verification_not_passed':
    case 'preflight_blocked_no_target_sessions':
    case 'preflight_blocked_no_preview_changes':
      return 'amber'
    case 'preflight_blocked_stale_receipt_present':
      return 'orange'
    default:
      return 'zinc'
  }
}

export function getDurableWritePreflightItemStatusColor(
  status: DurableWritePreflightItemStatus
): 'lime' | 'amber' | 'orange' | 'red' | 'cyan' | 'zinc' {
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
