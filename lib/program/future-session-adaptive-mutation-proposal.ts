/**
 * Future Session Adaptive Mutation Proposal Contract
 * MASTER-8C.87 / AB20.4.80 / Prompt 83
 *
 * Converts generic before/after text preview into a computable, source-backed
 * mutation proposal contract with explicit operation kinds and target session identity.
 *
 * CRITICAL: This is PROPOSAL ONLY. No real mutation, no persistence, no writes.
 * realMutationEnabled must remain false until Prompt 84+.
 */

import type {
  FutureSessionAdaptivePreviewDiffModel,
  FutureSessionAdaptivePreviewChange,
  AdaptiveChangeConfidence,
} from './future-session-adaptive-preview-diff'

import type {
  MutationTargetSessionResolutionPreviewModel,
  MutationTargetSessionCandidate,
} from './mutation-target-session-resolution-preview'

import type {
  ProgramCardAdaptationMarkerApplicationState,
} from './program-card-adaptation-marker-preview'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FutureSessionAdaptiveMutationProposalStatus =
  | 'proposal_ready_apply_disabled'
  | 'proposal_waiting_for_review'
  | 'blocked_no_preview_changes'
  | 'blocked_no_target_sessions'
  | 'blocked_missing_source_models'

export type FutureSessionAdaptiveMutationOperationKind =
  | 'lower_intensity_ceiling'
  | 'reduce_volume'
  | 'increase_recovery_rest'
  | 'reduce_method_density'
  | 'add_warmup_focus'
  | 'add_cooldown_focus'
  | 'regress_progression_preview'
  | 'substitute_exercise_preview'
  | 'skill_exposure_rebalance_preview'

export type FutureSessionAdaptiveMutationFieldCategory =
  | 'intensity'
  | 'volume'
  | 'rest'
  | 'method_density'
  | 'warmup'
  | 'cooldown'
  | 'progression'
  | 'exercise_selection'
  | 'skill_distribution'

export interface FutureSessionAdaptiveMutationProposalOperation {
  readonly id: string
  readonly targetSessionId: string | null
  readonly targetDayNumber: number
  readonly targetDayLabel: string
  readonly targetSessionTitle: string
  readonly operationKind: FutureSessionAdaptiveMutationOperationKind
  readonly fieldCategory: FutureSessionAdaptiveMutationFieldCategory
  readonly beforeLabel: string
  readonly afterLabel: string
  readonly reason: string
  readonly source: string
  readonly confidence: AdaptiveChangeConfidence
  readonly applyAllowedNow: false
  readonly programCardWouldChangeLater: true
  readonly startWorkoutWouldNeedBridgeLater: true
  readonly liveWorkoutWouldNeedBridgeLater: true
  readonly completedSessionProtected: true
  readonly futureSessionOnly: true
}

export interface FutureSessionAdaptiveMutationProposalModel {
  readonly sourceStep: 'MASTER-8C.87 / AB20.4.80 / Prompt 83'
  readonly status: FutureSessionAdaptiveMutationProposalStatus
  readonly headline: string
  readonly summary: string
  readonly targetSessionCount: number
  readonly operationCount: number
  readonly highConfidenceCount: number
  readonly mediumConfidenceCount: number
  readonly lowConfidenceCount: number
  readonly operations: readonly FutureSessionAdaptiveMutationProposalOperation[]
  readonly blockers: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly nextRequiredStep: string
  readonly realMutationEnabled: false
  readonly persistenceEnabled: false
  readonly workoutStructureChanged: false
  readonly programCardsChanged: false
  readonly startWorkoutChanged: false
  readonly liveWorkoutChanged: false
  readonly completedSessionsProtected: true
}

// ============================================================================
// OPERATION MAPPING
// ============================================================================

interface OperationMapping {
  readonly operationKind: FutureSessionAdaptiveMutationOperationKind
  readonly fieldCategory: FutureSessionAdaptiveMutationFieldCategory
}

function mapChangeKeyToOperation(change: FutureSessionAdaptivePreviewChange): OperationMapping {
  const key = change.key.toLowerCase()
  const reason = (change.reason || '').toLowerCase()
  
  // Direct key mappings
  if (key.includes('intensity_ceiling') || key.includes('intensity')) {
    return { operationKind: 'lower_intensity_ceiling', fieldCategory: 'intensity' }
  }
  if (key.includes('volume_adjustment') || key.includes('volume')) {
    return { operationKind: 'reduce_volume', fieldCategory: 'volume' }
  }
  if (key.includes('recovery_allocation') || key.includes('recovery') || key.includes('rest')) {
    return { operationKind: 'increase_recovery_rest', fieldCategory: 'rest' }
  }
  if (key.includes('method_density') || key.includes('density')) {
    return { operationKind: 'reduce_method_density', fieldCategory: 'method_density' }
  }
  if (key.includes('warmup_focus') || key.includes('warmup')) {
    return { operationKind: 'add_warmup_focus', fieldCategory: 'warmup' }
  }
  if (key.includes('cooldown_focus') || key.includes('cooldown')) {
    return { operationKind: 'add_cooldown_focus', fieldCategory: 'cooldown' }
  }
  
  // Caution-based mappings
  if (key.includes('caution')) {
    // Check reason for pain/tension/joint/tendon mentions
    if (reason.includes('pain') || reason.includes('tension') || reason.includes('joint') || reason.includes('tendon')) {
      return { operationKind: 'regress_progression_preview', fieldCategory: 'progression' }
    }
    // Default caution to intensity reduction
    return { operationKind: 'lower_intensity_ceiling', fieldCategory: 'intensity' }
  }
  
  // Progression-related
  if (key.includes('progression') || key.includes('regress')) {
    return { operationKind: 'regress_progression_preview', fieldCategory: 'progression' }
  }
  
  // Exercise-related
  if (key.includes('exercise') || key.includes('substitute')) {
    return { operationKind: 'substitute_exercise_preview', fieldCategory: 'exercise_selection' }
  }
  
  // Skill-related
  if (key.includes('skill') || key.includes('exposure') || key.includes('balance')) {
    return { operationKind: 'skill_exposure_rebalance_preview', fieldCategory: 'skill_distribution' }
  }
  
  // Default fallback - intensity is safest
  return { operationKind: 'lower_intensity_ceiling', fieldCategory: 'intensity' }
}

// ============================================================================
// RESOLVER
// ============================================================================

export interface ResolveFutureSessionAdaptiveMutationProposalInput {
  readonly futureSessionAdaptivePreviewDiffModel: FutureSessionAdaptivePreviewDiffModel | null
  readonly mutationTargetSessionResolutionPreviewModel: MutationTargetSessionResolutionPreviewModel | null
  readonly persistedMarkerState: ProgramCardAdaptationMarkerApplicationState | null
}

export function resolveFutureSessionAdaptiveMutationProposal(
  input: ResolveFutureSessionAdaptiveMutationProposalInput
): FutureSessionAdaptiveMutationProposalModel {
  const {
    futureSessionAdaptivePreviewDiffModel,
    mutationTargetSessionResolutionPreviewModel,
    // persistedMarkerState is available but not used for blocking in this step
  } = input
  
  const sourceStep = 'MASTER-8C.87 / AB20.4.80 / Prompt 83' as const
  
  // Blocked: missing source models
  if (!futureSessionAdaptivePreviewDiffModel || !mutationTargetSessionResolutionPreviewModel) {
    return {
      sourceStep,
      status: 'blocked_missing_source_models',
      headline: 'Proposal Unavailable',
      summary: 'Missing required source models for mutation proposal.',
      targetSessionCount: 0,
      operationCount: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      operations: [],
      blockers: ['Missing futureSessionAdaptivePreviewDiffModel or mutationTargetSessionResolutionPreviewModel'],
      safetyNotes: [],
      nextRequiredStep: 'Ensure source models are available',
      realMutationEnabled: false,
      persistenceEnabled: false,
      workoutStructureChanged: false,
      programCardsChanged: false,
      startWorkoutChanged: false,
      liveWorkoutChanged: false,
      completedSessionsProtected: true,
    }
  }
  
  // Blocked: no preview changes
  const changes = futureSessionAdaptivePreviewDiffModel.changes
  if (changes.length === 0) {
    return {
      sourceStep,
      status: 'blocked_no_preview_changes',
      headline: 'No Proposed Changes',
      summary: 'No adaptive changes available to propose.',
      targetSessionCount: 0,
      operationCount: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      operations: [],
      blockers: ['No changes in futureSessionAdaptivePreviewDiffModel'],
      safetyNotes: [],
      nextRequiredStep: 'Wait for adaptive analysis to produce changes',
      realMutationEnabled: false,
      persistenceEnabled: false,
      workoutStructureChanged: false,
      programCardsChanged: false,
      startWorkoutChanged: false,
      liveWorkoutChanged: false,
      completedSessionsProtected: true,
    }
  }
  
  // Get valid future session targets - use futureSessionCandidates directly
  const futureCandidates: MutationTargetSessionCandidate[] = (
    mutationTargetSessionResolutionPreviewModel.futureSessionCandidates || []
  ).filter(c => c.isFutureSession && !c.isCompleted && c.eligibleForFutureMutationPreview)
  
  // Blocked: no target sessions
  if (futureCandidates.length === 0) {
    return {
      sourceStep,
      status: 'blocked_no_target_sessions',
      headline: 'No Target Sessions',
      summary: 'No eligible future sessions available for mutation proposal.',
      targetSessionCount: 0,
      operationCount: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      operations: [],
      blockers: ['No eligible future session candidates'],
      safetyNotes: [],
      nextRequiredStep: 'Wait for future sessions to become available',
      realMutationEnabled: false,
      persistenceEnabled: false,
      workoutStructureChanged: false,
      programCardsChanged: false,
      startWorkoutChanged: false,
      liveWorkoutChanged: false,
      completedSessionsProtected: true,
    }
  }
  
  // Build operations: map changes to target sessions
  // Strategy: attach each change to the first eligible future session (compact proposal)
  // Cap operations to avoid explosion
  const MAX_OPERATIONS = 6
  const safetyNotes: string[] = []
  
  const operations: FutureSessionAdaptiveMutationProposalOperation[] = []
  let operationIndex = 0
  
  for (const change of changes) {
    if (operations.length >= MAX_OPERATIONS) {
      safetyNotes.push(`Operations capped at ${MAX_OPERATIONS} for safety. ${changes.length - MAX_OPERATIONS} additional changes not included.`)
      break
    }
    
    // Get target session - spread across available candidates if multiple
    const targetIndex = operationIndex % futureCandidates.length
    const target = futureCandidates[targetIndex]
    
    const mapping = mapChangeKeyToOperation(change)
    
    const operation: FutureSessionAdaptiveMutationProposalOperation = {
      id: `proposal-op-${operationIndex}-${change.key}`,
      targetSessionId: target.sessionId,
      targetDayNumber: target.dayNumber,
      targetDayLabel: `Day ${target.dayNumber}`,
      targetSessionTitle: target.sessionTitle || `Session ${target.dayNumber}`,
      operationKind: mapping.operationKind,
      fieldCategory: mapping.fieldCategory,
      beforeLabel: change.before,
      afterLabel: change.after,
      reason: change.reason,
      source: change.source,
      confidence: change.confidence,
      applyAllowedNow: false,
      programCardWouldChangeLater: true,
      startWorkoutWouldNeedBridgeLater: true,
      liveWorkoutWouldNeedBridgeLater: true,
      completedSessionProtected: true,
      futureSessionOnly: true,
    }
    
    operations.push(operation)
    operationIndex++
  }
  
  // Count by confidence
  let highConfidenceCount = 0
  let mediumConfidenceCount = 0
  let lowConfidenceCount = 0
  
  for (const op of operations) {
    if (op.confidence === 'high') highConfidenceCount++
    else if (op.confidence === 'medium') mediumConfidenceCount++
    else lowConfidenceCount++
  }
  
  // Get unique target day numbers
  const targetDayNumbers = [...new Set(operations.map(op => op.targetDayNumber))].sort((a, b) => a - b)
  
  // Build headline and summary
  const headline = `${operations.length} Proposed Operation${operations.length !== 1 ? 's' : ''} Ready`
  const summary = `Targeting ${targetDayNumbers.length} future session${targetDayNumbers.length !== 1 ? 's' : ''} (Day ${targetDayNumbers.join(', Day ')}). Real mutation disabled — proposal only.`
  
  return {
    sourceStep,
    status: 'proposal_ready_apply_disabled',
    headline,
    summary,
    targetSessionCount: targetDayNumbers.length,
    operationCount: operations.length,
    highConfidenceCount,
    mediumConfidenceCount,
    lowConfidenceCount,
    operations,
    blockers: [],
    safetyNotes,
    nextRequiredStep: 'Prompt 84: Enable controlled future-session mutation apply',
    realMutationEnabled: false,
    persistenceEnabled: false,
    workoutStructureChanged: false,
    programCardsChanged: false,
    startWorkoutChanged: false,
    liveWorkoutChanged: false,
    completedSessionsProtected: true,
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR UI
// ============================================================================

export function getOperationKindLabel(kind: FutureSessionAdaptiveMutationOperationKind): string {
  switch (kind) {
    case 'lower_intensity_ceiling': return 'Lower Intensity'
    case 'reduce_volume': return 'Reduce Volume'
    case 'increase_recovery_rest': return 'Increase Rest'
    case 'reduce_method_density': return 'Reduce Density'
    case 'add_warmup_focus': return 'Add Warmup'
    case 'add_cooldown_focus': return 'Add Cooldown'
    case 'regress_progression_preview': return 'Regress Progression'
    case 'substitute_exercise_preview': return 'Substitute Exercise'
    case 'skill_exposure_rebalance_preview': return 'Rebalance Skills'
    default: return kind
  }
}

export function getFieldCategoryLabel(category: FutureSessionAdaptiveMutationFieldCategory): string {
  switch (category) {
    case 'intensity': return 'intensity'
    case 'volume': return 'volume'
    case 'rest': return 'rest'
    case 'method_density': return 'density'
    case 'warmup': return 'warmup'
    case 'cooldown': return 'cooldown'
    case 'progression': return 'progression'
    case 'exercise_selection': return 'exercise'
    case 'skill_distribution': return 'skill'
    default: return category
  }
}

export function getProposalStatusLabel(status: FutureSessionAdaptiveMutationProposalStatus): string {
  switch (status) {
    case 'proposal_ready_apply_disabled': return 'Proposal Ready'
    case 'proposal_waiting_for_review': return 'Awaiting Review'
    case 'blocked_no_preview_changes': return 'No Changes'
    case 'blocked_no_target_sessions': return 'No Targets'
    case 'blocked_missing_source_models': return 'Unavailable'
    default: return status
  }
}

export function getProposalStatusColor(status: FutureSessionAdaptiveMutationProposalStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'proposal_ready_apply_disabled':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400/80', border: 'border-cyan-500/20' }
    case 'proposal_waiting_for_review':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400/80', border: 'border-amber-500/20' }
    case 'blocked_no_preview_changes':
    case 'blocked_no_target_sessions':
    case 'blocked_missing_source_models':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/60', border: 'border-slate-500/20' }
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400/60', border: 'border-slate-500/20' }
  }
}
