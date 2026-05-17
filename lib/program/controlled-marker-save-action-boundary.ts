/**
 * MASTER-8C.43 / AB20.4.36 — Controlled Marker-Save Action Boundary
 * 
 * This is the FINAL action boundary before marker-only save.
 * It intentionally remains locked while active cautions or no future targets exist.
 * Structural workout mutation is NOT enabled in this step.
 * 
 * Pure TypeScript helper — no React, no fetch, no DB, no localStorage,
 * no sessionStorage, no window/document, no Date.now, no Math.random,
 * no write/save/apply functions, no `as any`, no @ts-ignore.
 * 
 * Hard invariants:
 * - canMutateProgramCards: false (always in this step)
 * - canMutateStartWorkout: false (always in this step)
 * - canMutateLiveWorkout: false (always in this step)
 * - Structural mutation: not available
 * - With 7 cautions and 0 targets: canExecuteMarkerSave = false, canWriteMarker = false
 */

import type { MarkerSaveAuthorizationPreflightBoundaryModel } from './marker-save-authorization-preflight-boundary'

// =============================================================================
// STATUS UNION
// =============================================================================

export type ControlledMarkerSaveActionStatus =
  | 'unavailable_missing_preflight'
  | 'blocked_active_caution'
  | 'blocked_no_future_targets'
  | 'blocked_authorization_missing'
  | 'blocked_marker_save_not_enabled'
  | 'marker_save_action_ready'

// =============================================================================
// MODEL INTERFACE
// =============================================================================

export interface ControlledMarkerSaveActionBoundaryModel {
  readonly status: ControlledMarkerSaveActionStatus
  
  // Action capabilities - all locked in current step except marker-only save when ready
  readonly canShowAuthorizationControl: boolean
  readonly canExecuteMarkerSave: boolean
  readonly canWriteMarker: boolean
  
  // Structural mutation capabilities - always false in this step
  readonly canMutateProgramCards: false
  readonly canMutateStartWorkout: false
  readonly canMutateLiveWorkout: false
  readonly canMutateStructure: false
  
  // Counts
  readonly activeCautionCount: number
  readonly targetSessionCount: number
  readonly completedProtectedCount: number
  readonly markerSavedCount: number
  
  // Display
  readonly headline: string
  readonly summary: string
  readonly blockedReasons: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextSafeGate: string
  
  // Safety invariants
  readonly noStructuralMutationEnabled: true
  readonly programCardsProtected: true
  readonly startWorkoutProtected: true
  readonly liveWorkoutProtected: true
  readonly completedSessionsProtected: true
}

// =============================================================================
// INPUT INTERFACE
// =============================================================================

export interface ControlledMarkerSaveActionBoundaryInput {
  readonly markerSaveAuthorizationPreflightBoundaryModel: MarkerSaveAuthorizationPreflightBoundaryModel | null | undefined
  readonly explicitUserAuthorization?: boolean
  readonly markerSavedCount?: number
}

// =============================================================================
// RESOLVER FUNCTION
// =============================================================================

export function resolveControlledMarkerSaveActionBoundary(
  input: ControlledMarkerSaveActionBoundaryInput
): ControlledMarkerSaveActionBoundaryModel {
  const {
    markerSaveAuthorizationPreflightBoundaryModel,
    explicitUserAuthorization = false,
    markerSavedCount = 0,
  } = input

  // Safety invariants that never change in this step
  const safetyInvariants = {
    canMutateProgramCards: false as const,
    canMutateStartWorkout: false as const,
    canMutateLiveWorkout: false as const,
    canMutateStructure: false as const,
    noStructuralMutationEnabled: true as const,
    programCardsProtected: true as const,
    startWorkoutProtected: true as const,
    liveWorkoutProtected: true as const,
    completedSessionsProtected: true as const,
  }

  // Base safety notes that always apply
  const baseSafetyNotes: string[] = [
    'Structural mutation not enabled in this step',
    'Program Cards remain protected',
    'Start Workout remains protected',
    'Live Workout remains protected',
    'Completed sessions remain protected',
  ]

  // -----------------------------------
  // Priority 1: Missing preflight model
  // -----------------------------------
  if (!markerSaveAuthorizationPreflightBoundaryModel) {
    return {
      status: 'unavailable_missing_preflight',
      canShowAuthorizationControl: false,
      canExecuteMarkerSave: false,
      canWriteMarker: false,
      ...safetyInvariants,
      activeCautionCount: 0,
      targetSessionCount: 0,
      completedProtectedCount: 0,
      markerSavedCount: 0,
      headline: 'Action Boundary Unavailable',
      summary: 'Marker save action boundary cannot be evaluated because the authorization preflight model is missing.',
      blockedReasons: [
        'Missing marker save authorization preflight model',
        'Upstream gates not evaluated',
      ],
      safetyNotes: baseSafetyNotes,
      nextSafeGate: 'Resolve marker save authorization preflight first',
    }
  }

  // Extract counts from preflight model
  const activeCautionCount = markerSaveAuthorizationPreflightBoundaryModel.activeCautionCount
  const targetSessionCount = markerSaveAuthorizationPreflightBoundaryModel.targetSessionCount
  const completedProtectedCount = markerSaveAuthorizationPreflightBoundaryModel.completedProtectedCount

  // -----------------------------------
  // Priority 2: Active cautions block action
  // -----------------------------------
  if (activeCautionCount > 0) {
    return {
      status: 'blocked_active_caution',
      canShowAuthorizationControl: false,
      canExecuteMarkerSave: false,
      canWriteMarker: false,
      ...safetyInvariants,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerSavedCount,
      headline: 'Action Boundary Blocked: Active Caution',
      summary: `Marker save action is blocked because ${activeCautionCount} active caution(s) exist. Clear all cautions before marker save can proceed.`,
      blockedReasons: [
        `${activeCautionCount} active caution(s) must be cleared`,
        'Marker save action not available while cautions exist',
        'No authorization control shown while blocked',
      ],
      safetyNotes: [
        ...baseSafetyNotes,
        'No marker will be saved in blocked state',
        'No writes attempted while cautions exist',
      ],
      nextSafeGate: 'Clear all active cautions',
    }
  }

  // -----------------------------------
  // Priority 3: No future targets block action
  // -----------------------------------
  if (targetSessionCount === 0) {
    return {
      status: 'blocked_no_future_targets',
      canShowAuthorizationControl: false,
      canExecuteMarkerSave: false,
      canWriteMarker: false,
      ...safetyInvariants,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerSavedCount,
      headline: 'Action Boundary Blocked: No Future Targets',
      summary: 'Marker save action is blocked because there are no future target sessions. At least one future session must be available for marker save.',
      blockedReasons: [
        'No future target sessions available',
        'Marker save requires at least one future session',
        'No authorization control shown with 0 targets',
      ],
      safetyNotes: [
        ...baseSafetyNotes,
        'No marker will be saved with 0 targets',
        'No writes attempted without target sessions',
      ],
      nextSafeGate: 'Wait for future sessions to become available',
    }
  }

  // -----------------------------------
  // Priority 4: Authorization missing
  // -----------------------------------
  if (!explicitUserAuthorization) {
    return {
      status: 'blocked_authorization_missing',
      canShowAuthorizationControl: true, // Can show control when gates pass but auth missing
      canExecuteMarkerSave: false,
      canWriteMarker: false,
      ...safetyInvariants,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerSavedCount,
      headline: 'Action Boundary: Authorization Required',
      summary: `Marker save action requires explicit user authorization. ${targetSessionCount} future target session(s) available and all cautions cleared.`,
      blockedReasons: [
        'Explicit user authorization not provided',
        'Marker save requires confirmation before execution',
      ],
      safetyNotes: [
        ...baseSafetyNotes,
        'Authorization control may be shown',
        'No marker written until authorization granted',
        `${targetSessionCount} future session(s) ready for marker`,
      ],
      nextSafeGate: 'Provide explicit user authorization',
    }
  }

  // -----------------------------------
  // Priority 5: Preflight not enabled
  // -----------------------------------
  if (!markerSaveAuthorizationPreflightBoundaryModel.canShowMarkerSaveControl) {
    return {
      status: 'blocked_marker_save_not_enabled',
      canShowAuthorizationControl: false,
      canExecuteMarkerSave: false,
      canWriteMarker: false,
      ...safetyInvariants,
      activeCautionCount,
      targetSessionCount,
      completedProtectedCount,
      markerSavedCount,
      headline: 'Action Boundary: Preflight Not Enabled',
      summary: 'Marker save action is blocked because the authorization preflight has not enabled marker save control.',
      blockedReasons: [
        'Marker save control not enabled by preflight',
        'Upstream preflight gate must pass first',
      ],
      safetyNotes: [
        ...baseSafetyNotes,
        'Preflight must enable marker save first',
      ],
      nextSafeGate: 'Wait for preflight to enable marker save',
    }
  }

  // -----------------------------------
  // Priority 6: Marker save action ready
  // -----------------------------------
  return {
    status: 'marker_save_action_ready',
    canShowAuthorizationControl: true,
    canExecuteMarkerSave: true,
    canWriteMarker: true,
    ...safetyInvariants,
    activeCautionCount,
    targetSessionCount,
    completedProtectedCount,
    markerSavedCount,
    headline: 'Action Boundary: Marker Save Ready',
    summary: `Marker save action is ready. ${targetSessionCount} future target session(s) available, all cautions cleared, and authorization granted. Marker-only save may proceed. Structural mutation remains disabled.`,
    blockedReasons: [],
    safetyNotes: [
      ...baseSafetyNotes,
      'Marker-only save is available',
      'Structural mutation still disabled',
      `${targetSessionCount} future session(s) may receive marker`,
      `${completedProtectedCount} completed session(s) remain protected`,
    ],
    nextSafeGate: 'Execute marker-only save (structural mutation in future step)',
  }
}

// =============================================================================
// STATUS LABEL HELPER
// =============================================================================

export function getControlledMarkerSaveActionStatusLabel(
  status: ControlledMarkerSaveActionStatus
): string {
  switch (status) {
    case 'unavailable_missing_preflight':
      return 'Unavailable: Missing Preflight'
    case 'blocked_active_caution':
      return 'Blocked: Active Caution'
    case 'blocked_no_future_targets':
      return 'Blocked: No Future Targets'
    case 'blocked_authorization_missing':
      return 'Blocked: Authorization Missing'
    case 'blocked_marker_save_not_enabled':
      return 'Blocked: Save Not Enabled'
    case 'marker_save_action_ready':
      return 'Marker Save Ready'
  }
}

// =============================================================================
// STATUS COLOR HELPER
// =============================================================================

export function getControlledMarkerSaveActionStatusColor(
  status: ControlledMarkerSaveActionStatus
): { bg: string; text: string; border: string } {
  switch (status) {
    case 'unavailable_missing_preflight':
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
        bg: 'bg-orange-500/10',
        text: 'text-orange-400/70',
        border: 'border-orange-500/20',
      }
    case 'blocked_authorization_missing':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400/70',
        border: 'border-yellow-500/20',
      }
    case 'blocked_marker_save_not_enabled':
      return {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400/70',
        border: 'border-violet-500/20',
      }
    case 'marker_save_action_ready':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400/70',
        border: 'border-emerald-500/20',
      }
  }
}
