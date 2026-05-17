// =============================================================================
// MASTER-8C.42 / AB20.4.35 — Marker-Save Authorization Preflight Boundary
// =============================================================================
// Pure, deterministic helper that answers:
// "Is the system allowed to proceed toward a marker-only saved permission artifact?"
//
// This is a PREFLIGHT gate only. It does NOT:
// - Save a marker
// - Write to localStorage/sessionStorage/DB
// - Persist anything
// - Mutate sessions
// - Change Program Cards
// - Change Start Workout
// - Change Live Workout
//
// Current expected state (7 cautions, 0 targets) must resolve to: blocked_active_caution
// =============================================================================

import type { MarkerOnlyConfirmationBoundaryModel } from './marker-only-confirmation-boundary-preview'

// =============================================================================
// STATUS UNION
// =============================================================================

export type MarkerSaveAuthorizationPreflightStatus =
  | 'unavailable_missing_marker_boundary'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_marker_boundary_not_ready'
  | 'blocked_user_authorization_missing'
  | 'marker_save_preflight_locked'
  | 'marker_save_preflight_ready_future_step'

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface MarkerSaveAuthorizationPreflightBoundaryModel {
  readonly status: MarkerSaveAuthorizationPreflightStatus
  readonly headline: string
  readonly summary: string
  readonly activeCautionCount: number
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly markerCandidateCount: number
  
  // [MASTER-8C.47] Root/candidate clearance metrics (deduped from cascade)
  readonly rootCandidateBlockingCount: number
  readonly rootCandidateWaitingCount: number
  readonly rootCandidateNeedsEvidenceCount: number
  readonly cascadeEchoCount: number
  readonly rawCautionCount: number
  
  readonly blockedReasons: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string

  // All action/write/change flags MUST remain locked false in this step
  readonly canShowMarkerSaveControl: false
  readonly canEnableMarkerSaveControl: false
  readonly canSaveMarker: false
  readonly canWriteMarker: false
  readonly canPersistMarker: false
  readonly canApplyMutation: false
  readonly canChangeProgramCards: false
  readonly canChangeStartWorkout: false
  readonly canChangeLiveWorkout: false

  // Safety invariants - all must be true
  readonly completedSessionsProtected: true
  readonly noMarkerSaved: true
  readonly noMarkerWriteAttempted: true
  readonly noProgramChangesApplied: true
  readonly noWorkoutChangesApplied: true
  readonly userAuthorizationRequired: true
  readonly futureTargetsRequired: true
  readonly cautionsMustBeCleared: true
}

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface MarkerSaveAuthorizationPreflightInput {
  readonly markerOnlyConfirmationBoundaryModel: MarkerOnlyConfirmationBoundaryModel | null | undefined
  readonly explicitUserAuthorization?: boolean
}

// =============================================================================
// RESOLVER
// =============================================================================

export function resolveMarkerSaveAuthorizationPreflightBoundary(
  input: MarkerSaveAuthorizationPreflightInput
): MarkerSaveAuthorizationPreflightBoundaryModel {
  const { markerOnlyConfirmationBoundaryModel, explicitUserAuthorization = false } = input

  // Locked action/write/change flags - NEVER true in this step
  const lockedFlags = {
    canShowMarkerSaveControl: false as const,
    canEnableMarkerSaveControl: false as const,
    canSaveMarker: false as const,
    canWriteMarker: false as const,
    canPersistMarker: false as const,
    canApplyMutation: false as const,
    canChangeProgramCards: false as const,
    canChangeStartWorkout: false as const,
    canChangeLiveWorkout: false as const,
  }

  // Safety invariants - ALWAYS true
  const safetyInvariants = {
    completedSessionsProtected: true as const,
    noMarkerSaved: true as const,
    noMarkerWriteAttempted: true as const,
    noProgramChangesApplied: true as const,
    noWorkoutChangesApplied: true as const,
    userAuthorizationRequired: true as const,
    futureTargetsRequired: true as const,
    cautionsMustBeCleared: true as const,
  }

  // -------------------------------------------------------------------------
  // PRIORITY 1: Missing marker boundary model
  // -------------------------------------------------------------------------
  if (!markerOnlyConfirmationBoundaryModel) {
    return {
      status: 'unavailable_missing_marker_boundary',
      headline: 'Marker-Save Authorization Unavailable',
      summary: 'Cannot evaluate marker-save authorization without upstream marker boundary model.',
      activeCautionCount: 0,
      targetSessionCount: 0,
      completedProtectedCount: 0,
      markerCandidateCount: 0,
      // [MASTER-8C.47] Root/candidate clearance metrics
      rootCandidateBlockingCount: 0,
      rootCandidateWaitingCount: 0,
      rootCandidateNeedsEvidenceCount: 0,
      cascadeEchoCount: 0,
      rawCautionCount: 0,
      blockedReasons: ['Missing marker-only confirmation boundary model'],
      safetyNotes: [
        'No marker saved',
        'No marker write attempted',
        'No Program Cards changed',
        'No Start Workout changed',
        'No Live Workout changed',
        'Completed sessions protected',
      ],
      nextSafeGate: 'Resolve upstream marker boundary first',
      ...lockedFlags,
      ...safetyInvariants,
    }
  }

  // Extract counts from upstream marker boundary
  const activeCautionCount = markerOnlyConfirmationBoundaryModel.activeCautionCount
  const targetSessionCount = markerOnlyConfirmationBoundaryModel.targetSessionCount
  const completedProtectedCount = markerOnlyConfirmationBoundaryModel.completedProtectedCount
  const markerCandidateCount = markerOnlyConfirmationBoundaryModel.markerCandidateCount
  
  // [MASTER-8C.47] Root/candidate clearance metrics (deduped from cascade)
  const rootCandidateBlockingCount = markerOnlyConfirmationBoundaryModel.rootCandidateBlockingCount ?? 0
  const rootCandidateWaitingCount = markerOnlyConfirmationBoundaryModel.rootCandidateWaitingCount ?? 0
  const rootCandidateNeedsEvidenceCount = rootCandidateBlockingCount + rootCandidateWaitingCount
  const cascadeEchoCount = markerOnlyConfirmationBoundaryModel.cascadeEchoCount ?? 0
  const rawCautionCount = markerOnlyConfirmationBoundaryModel.rawCautionCount ?? activeCautionCount

  // -------------------------------------------------------------------------
  // PRIORITY 2: Active cautions — now uses root/candidate clearance (8C47)
  // Cascade echoes are diagnostic only and do not block marker-save auth
  // -------------------------------------------------------------------------
  if (rootCandidateNeedsEvidenceCount > 0) {
    const blockerLabel = rootCandidateBlockingCount > 0 
      ? `${rootCandidateBlockingCount} blocking root/candidate caution(s)`
      : `${rootCandidateWaitingCount} root/candidate caution(s) waiting for evidence`
    
    return {
      status: 'blocked_active_caution',
      headline: 'Marker-Save Authorization Blocked — Root/Candidate Evidence Required',
      summary: `${rootCandidateNeedsEvidenceCount} root/candidate clearance item(s) need resolution. ${cascadeEchoCount} cascade echo(es) are diagnostic only and do not independently block.`,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerCandidateCount,
      rootCandidateBlockingCount,
      rootCandidateWaitingCount,
      rootCandidateNeedsEvidenceCount,
      cascadeEchoCount,
      rawCautionCount,
      blockedReasons: [
        blockerLabel,
        `${cascadeEchoCount} cascade echo(es) diagnostic only`,
        'Root/candidate evidence must resolve before marker-save authorization',
      ],
      safetyNotes: [
        'No marker saved',
        'No marker write attempted',
        'No Program Cards changed',
        'No Start Workout changed',
        'No Live Workout changed',
        `${completedProtectedCount} completed session(s) protected`,
        'Cascade echoes do not multiply the root blocker',
      ],
      nextSafeGate: 'Clear root/candidate evidence, then re-evaluate marker-save authorization',
      ...lockedFlags,
      ...safetyInvariants,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 3: No future target sessions
  // -------------------------------------------------------------------------
  if (targetSessionCount === 0) {
    return {
      status: 'blocked_no_future_targets',
      headline: 'Marker-Save Authorization Blocked by No Future Targets',
      summary: 'Zero future target sessions available. Marker-save authorization requires at least one future session to be identified as a mutation target.',
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerCandidateCount,
      rootCandidateBlockingCount,
      rootCandidateWaitingCount,
      rootCandidateNeedsEvidenceCount,
      cascadeEchoCount,
      rawCautionCount,
      blockedReasons: [
        'No future target sessions available',
        'Marker-save authorization requires future targets',
        'Current program may be fully completed',
      ],
      safetyNotes: [
        'No marker saved',
        'No marker write attempted',
        'No Program Cards changed',
        'No Start Workout changed',
        'No Live Workout changed',
        `${completedProtectedCount} completed session(s) protected`,
      ],
      nextSafeGate: 'Generate a new program with future sessions or wait for schedule progression',
      ...lockedFlags,
      ...safetyInvariants,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 4: Marker boundary not ready
  // -------------------------------------------------------------------------
  const markerBoundaryReady =
    markerOnlyConfirmationBoundaryModel.status === 'marker_preview_ready_future_step' ||
    markerOnlyConfirmationBoundaryModel.canRenderMarkerConfirmationPreview

  if (!markerBoundaryReady) {
    return {
      status: 'blocked_marker_boundary_not_ready',
      headline: 'Marker-Save Authorization Blocked by Upstream Boundary',
      summary: `Marker-only confirmation boundary is not ready (status: ${markerOnlyConfirmationBoundaryModel.status}). Cannot proceed with marker-save authorization preflight.`,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerCandidateCount,
      rootCandidateBlockingCount,
      rootCandidateWaitingCount,
      rootCandidateNeedsEvidenceCount,
      cascadeEchoCount,
      rawCautionCount,
      blockedReasons: [
        `Marker boundary status: ${markerOnlyConfirmationBoundaryModel.status}`,
        'Upstream boundary must reach preview-ready state',
        'All prerequisite gates must pass first',
      ],
      safetyNotes: [
        'No marker saved',
        'No marker write attempted',
        'No Program Cards changed',
        'No Start Workout changed',
        'No Live Workout changed',
        `${completedProtectedCount} completed session(s) protected`,
      ],
      nextSafeGate: 'Resolve upstream marker boundary status first',
      ...lockedFlags,
      ...safetyInvariants,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 5: Explicit user authorization missing
  // -------------------------------------------------------------------------
  if (!explicitUserAuthorization) {
    return {
      status: 'blocked_user_authorization_missing',
      headline: 'Marker-Save Authorization Awaiting User Permission',
      summary: `All prerequisite gates have passed. ${targetSessionCount} future target session(s) identified. Explicit user authorization is required before marker-save can proceed.`,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerCandidateCount,
      rootCandidateBlockingCount,
      rootCandidateWaitingCount,
      rootCandidateNeedsEvidenceCount,
      cascadeEchoCount,
      rawCautionCount,
      blockedReasons: [
        'Explicit user authorization not yet granted',
        'User must confirm intention to save marker',
        'Authorization control will be enabled in future step',
      ],
      safetyNotes: [
        'No marker saved',
        'No marker write attempted',
        'No Program Cards changed',
        'No Start Workout changed',
        'No Live Workout changed',
        `${completedProtectedCount} completed session(s) protected`,
        `${targetSessionCount} future target(s) identified but not mutated`,
      ],
      nextSafeGate: 'MASTER-8C.43 may add user authorization control if explicitly authorized',
      ...lockedFlags,
      ...safetyInvariants,
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 6: Preflight locked (authorization granted but step locked)
  // -------------------------------------------------------------------------
  // This step keeps marker save locked even if authorization is granted
  // because the actual save mechanism is not implemented yet
  return {
    status: 'marker_save_preflight_locked',
    headline: 'Marker-Save Preflight Passed — Save Locked for Future Step',
    summary: `All prerequisite gates passed. User authorization granted. ${targetSessionCount} future target session(s) ready. Actual marker-save mechanism will be enabled in future step.`,
    activeCautionCount,
    targetSessionCount,
    completedProtectedCount,
    markerCandidateCount,
    rootCandidateBlockingCount,
    rootCandidateWaitingCount,
    rootCandidateNeedsEvidenceCount,
    cascadeEchoCount,
    rawCautionCount,
    blockedReasons: [
      'Marker-save mechanism not yet implemented',
      'This step is preflight only',
      'Actual save will be enabled in MASTER-8C.43+',
    ],
    safetyNotes: [
      'No marker saved',
      'No marker write attempted',
      'No Program Cards changed',
      'No Start Workout changed',
      'No Live Workout changed',
      `${completedProtectedCount} completed session(s) protected`,
      `${targetSessionCount} future target(s) identified but not mutated`,
      'Authorization granted but save locked',
    ],
    nextSafeGate: 'MASTER-8C.43 may implement actual marker-save if explicitly authorized',
    ...lockedFlags,
    ...safetyInvariants,
  }
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export function getMarkerSaveAuthorizationPreflightStatusLabel(
  status: MarkerSaveAuthorizationPreflightStatus
): string {
  switch (status) {
    case 'unavailable_missing_marker_boundary':
      return 'Unavailable: Missing Boundary'
    case 'blocked_active_caution':
      return 'Blocked: Active Caution'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_marker_boundary_not_ready':
      return 'Blocked: Boundary Not Ready'
    case 'blocked_user_authorization_missing':
      return 'Blocked: Authorization Missing'
    case 'marker_save_preflight_locked':
      return 'Save Preflight Locked'
    case 'marker_save_preflight_ready_future_step':
      return 'Ready Future Step'
    default:
      return 'Unknown Status'
  }
}

export function getMarkerSaveAuthorizationPreflightStatusColor(
  status: MarkerSaveAuthorizationPreflightStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_marker_boundary':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400/70',
        border: 'border-slate-500/20',
      }
    case 'blocked_active_caution':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400/70',
        border: 'border-amber-500/20',
      }
    case 'blocked_no_future_targets':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400/70',
        border: 'border-rose-500/20',
      }
    case 'blocked_marker_boundary_not_ready':
      return {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'blocked_user_authorization_missing':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400/70',
        border: 'border-indigo-500/20',
      }
    case 'marker_save_preflight_locked':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400/70',
        border: 'border-cyan-500/20',
      }
    case 'marker_save_preflight_ready_future_step':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
    default:
      return {
        bg: 'bg-[#1A1A2E]/60',
        text: 'text-[#8A8A9A]',
        border: 'border-[#2A2A35]/40',
      }
  }
}
