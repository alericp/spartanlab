/**
 * PROGRAM BALANCE MUTATION WRITER DESIGN — MASTER-8B.7
 *
 * =============================================================================
 * READ-ONLY DESIGN ADAPTER FROM PROGRAM BALANCE CANDIDATES
 * =============================================================================
 *
 * This module converts Program Balance Future Candidates into MASTER-8B.7
 * mutation design previews. It does NOT perform any mutation - it only
 * creates read-only design metadata showing what COULD happen if the user
 * confirms in a future gate.
 *
 * CRITICAL GUARANTEES:
 *   - Pure TypeScript, side-effect free, JSON-safe
 *   - No React imports, no UI imports, no generator imports
 *   - No localStorage/sessionStorage, no window access
 *   - No database calls, no mutation functions
 *   - Never calls legacy active-week-mutation-service
 *   - Never imports live workout runtime
 *   - Returns read-only design previews only
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.7 Design Gate
 */

import type { FutureSessionCandidate } from './program-balance-intelligence-contract'
import type {
  FutureSessionMutationActionType,
  FutureSessionMutationDesignPreview,
  FutureSessionMutationDesignBundle,
} from './future-session-mutation-writer-contract'
import {
  MASTER_8B_7_SAFETY_INVARIANT,
  createEmptyDesignBundle,
} from './future-session-mutation-writer-contract'

// =============================================================================
// ACTION TYPE MAPPING
// =============================================================================

/**
 * Map Program Balance candidate type to mutation action type.
 */
function mapCandidateToActionType(
  candidateType: string,
  proposedAction?: string
): FutureSessionMutationActionType {
  // Check proposed action first for more specific mapping
  if (proposedAction) {
    if (proposedAction.includes('increase_skill_exposure') || proposedAction.includes('restore_missing_skill')) {
      return 'skill_frequency_adjustment'
    }
    if (proposedAction.includes('rebalance_movement_family')) {
      return 'movement_family_rebalance'
    }
    if (proposedAction.includes('protect_tissue_stress')) {
      return 'tissue_protection'
    }
    if (proposedAction.includes('restore_weighted_anchor')) {
      return 'weighted_anchor_restore'
    }
    if (proposedAction.includes('reduce_density') || proposedAction.includes('method_stress')) {
      return 'method_density_adjustment'
    }
    if (proposedAction.includes('adjust_volume') || proposedAction.includes('intensity')) {
      return 'volume_adjustment'
    }
    if (proposedAction.includes('preparation') || proposedAction.includes('recovery_bias')) {
      return 'warmup_cooldown_adjustment'
    }
  }
  
  // Fall back to candidate type mapping
  switch (candidateType) {
    case 'skill_frequency_adjustment':
      return 'skill_frequency_adjustment'
    case 'movement_family_rebalance':
      return 'movement_family_rebalance'
    case 'volume_adjustment':
      return 'volume_adjustment'
    case 'tissue_protection':
      return 'tissue_protection'
    case 'weighted_anchor_restore':
      return 'weighted_anchor_restore'
    case 'method_density_adjustment':
      return 'method_density_adjustment'
    case 'warmup_cooldown_adjustment':
      return 'warmup_cooldown_adjustment'
    default:
      return 'watch_only'
  }
}

// =============================================================================
// DESIGN PREVIEW BUILDER
// =============================================================================

/**
 * Convert a single Program Balance Future Candidate into a mutation design preview.
 */
export function buildDesignPreviewFromCandidate(
  candidate: FutureSessionCandidate,
  index: number
): FutureSessionMutationDesignPreview {
  const plan = candidate.planningDetail
  const actionType = mapCandidateToActionType(
    candidate.candidateType,
    plan?.proposedAction
  )
  
  // Build headline from planning detail or candidate type
  const headline = plan?.coachTitle || 
    candidate.candidateType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  // Build problem description
  const problemDetected = plan?.triggerSummary || candidate.rationale || 
    'Balance finding detected requiring future consideration'
  
  // Build proposed action description
  const proposedFutureAction = plan?.proposedChangeSummary || 
    `Future sessions may ${candidate.candidateType.replace(/_/g, ' ')}`
  
  // Build preservation guardrails
  const preservationGuardrails = plan?.preserveSummary || 
    'Completed sessions protected. Existing applied methods preserved.'
  
  // Build blocked reason
  const blockedReason = plan?.blockedReason || 
    'MASTER-8B.7 design gate — user-confirmed writer not yet active'
  
  // Build data needed
  const dataNeeded: string[] = [
    ...(plan?.dataNeeded || []),
    ...(candidate.requiresFullKnowledgeBase ? ['Full exercise knowledge base'] : []),
    'User confirmation required',
  ]
  
  // Map confidence
  const confidenceLabel = candidate.confidence === 'high' ? 'high'
    : candidate.confidence === 'moderate' ? 'moderate'
    : candidate.confidence === 'low' ? 'low'
    : 'needs_more_data'
  
  return {
    id: `design_preview_${index}`,
    sourceCandidateId: `candidate_${index}`,
    actionType,
    headline,
    problemDetected,
    proposedFutureAction,
    targetScope: 'future_uncompleted_sessions_only',
    confidenceLabel,
    blockedReason,
    dataNeeded,
    preservationGuardrails,
    safetyInvariant: MASTER_8B_7_SAFETY_INVARIANT,
    mutationAllowedNow: false,
    requiresUserConfirmation: true,
    writerStatus: 'design_gate',
  }
}

// =============================================================================
// BUNDLE BUILDER
// =============================================================================

/**
 * Convert all Program Balance Future Candidates into a mutation design bundle.
 * This is the main entry point for the MASTER-8B.7 design adapter.
 */
export function buildMutationDesignBundle(
  candidates: readonly FutureSessionCandidate[]
): FutureSessionMutationDesignBundle {
  if (!candidates || candidates.length === 0) {
    return createEmptyDesignBundle()
  }
  
  // Build all previews
  const previews = candidates.map((candidate, index) => 
    buildDesignPreviewFromCandidate(candidate, index)
  )
  
  // Count by action type
  const byActionType: Partial<Record<FutureSessionMutationActionType, number>> = {}
  for (const preview of previews) {
    byActionType[preview.actionType] = (byActionType[preview.actionType] || 0) + 1
  }
  
  // Build visible summary
  const visibleSummary = previews.length === 1
    ? `MASTER-8B.7 design gate — 1 candidate preview (user confirmation required)`
    : `MASTER-8B.7 design gate — ${previews.length} candidate previews (user confirmation required)`
  
  return {
    sourceStep: 'MASTER_8B_7',
    mode: 'design_only',
    previews,
    counts: {
      total: previews.length,
      byActionType,
    },
    safetyInvariant: MASTER_8B_7_SAFETY_INVARIANT,
    nextAllowedStep: 'MASTER_8B_7_apply_gate',
    visibleSummary,
    mutationAllowedNow: false,
  }
}
