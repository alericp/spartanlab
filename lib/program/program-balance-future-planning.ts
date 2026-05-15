/**
 * PROGRAM BALANCE FUTURE PLANNING — MASTER-8B.6
 *
 * =============================================================================
 * READ-ONLY FUTURE SESSION PLANNING BUILDER
 * =============================================================================
 *
 * This module creates detailed planning information for future session candidates
 * without performing any mutation. It converts shallow findings into structured
 * adaptation plans that explain:
 *   - What problem triggered the candidate
 *   - What kind of change might eventually be considered
 *   - What should be preserved
 *   - Why mutation is blocked now
 *   - What data would be needed before mutation
 *
 * CRITICAL GUARANTEES:
 *   - Pure TypeScript, side-effect free, JSON-safe
 *   - No React imports, no UI imports, no generator imports
 *   - No localStorage/sessionStorage, no Date.now at module scope
 *   - No database calls, no mutation functions
 *   - Returns mutationAllowedNow: false always
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.6
 */

import type {
  ProgramBalanceFinding,
  ProgramBalanceSkillExpression,
  ProgramBalanceMovementFamilySummary,
  ProgramBalanceWeightedAnchorSummary,
  ProgramBalanceTissueStressSummary,
  ProgramBalanceKnowledgeCoverageSummary,
  FutureSessionPlanningDetail,
  FutureSessionPlanStatus,
  FutureSessionPlanScope,
  FutureSessionPlanAction,
  FutureMutationType,
} from './program-balance-intelligence-contract'

// =============================================================================
// PLANNING CONTEXT
// =============================================================================

export interface FuturePlanningContext {
  readonly skillExpression: readonly ProgramBalanceSkillExpression[]
  readonly movementFamilySummary: readonly ProgramBalanceMovementFamilySummary[]
  readonly weightedAnchorSummary: ProgramBalanceWeightedAnchorSummary
  readonly tissueStressSummary: readonly ProgramBalanceTissueStressSummary[]
  readonly knowledgeCoverage: ProgramBalanceKnowledgeCoverageSummary
  readonly sessionCount: number
  readonly completedDayIndexes?: readonly number[]
}

// =============================================================================
// HELPER: DERIVE STATUS
// =============================================================================

function derivePlanStatus(
  finding: ProgramBalanceFinding,
  knowledgeCoverage: ProgramBalanceKnowledgeCoverageSummary
): FutureSessionPlanStatus {
  // Always blocked_no_writer in MASTER-8B.6 - but add more specific blockers
  if (finding.seedCoverageLimited || knowledgeCoverage.unknownExerciseCount > knowledgeCoverage.knownExerciseCount) {
    return 'blocked_needs_full_db'
  }
  if (finding.confidence === 'low') {
    return 'blocked_needs_more_evidence'
  }
  // Default: blocked because writer not ready
  return 'blocked_no_writer'
}

// =============================================================================
// HELPER: DERIVE SCOPE
// =============================================================================

function derivePlanScope(
  finding: ProgramBalanceFinding,
  completedDayIndexes?: readonly number[]
): FutureSessionPlanScope {
  const affectedDays = finding.affectedDayIndexes
  
  if (!affectedDays || affectedDays.length === 0) {
    return 'unknown_future_scope'
  }
  
  // Filter to only uncompleted days if we have completion data
  const futureDays = completedDayIndexes
    ? affectedDays.filter(d => !completedDayIndexes.includes(d))
    : affectedDays
  
  if (futureDays.length === 0) {
    return 'unknown_future_scope'
  }
  if (futureDays.length === 1) {
    return 'single_future_day'
  }
  if (futureDays.length <= 3) {
    return 'multiple_future_days'
  }
  return 'remaining_week'
}

// =============================================================================
// HELPER: DERIVE ACTION
// =============================================================================

function derivePlanAction(
  finding: ProgramBalanceFinding,
  mutationType: FutureMutationType
): FutureSessionPlanAction {
  // Map finding type to action
  switch (finding.type) {
    case 'selected_skill_underexpressed':
    case 'selected_skill_absent':
    case 'planche_underexposed':
    case 'back_lever_underexposed':
    case 'dragon_flag_underexpressed':
      return 'increase_skill_exposure'
    
    case 'muscle_up_support_missing':
    case 'one_arm_pull_up_support_missing':
    case 'hspu_token_exposure':
      return 'restore_missing_skill_support'
    
    case 'movement_family_overrepresented':
    case 'movement_family_underrepresented':
    case 'pull_dominance':
    case 'push_underrepresentation':
    case 'core_compression_underrepresentation':
      return 'rebalance_movement_family'
    
    case 'weighted_pull_anchor_missing':
    case 'weighted_dip_anchor_missing':
    case 'foundational_dip_missing':
    case 'foundational_pull_missing':
      return 'restore_weighted_anchor'
    
    case 'high_elbow_biceps_tendon_accumulation':
    case 'high_wrist_extension_accumulation':
    case 'high_anterior_shoulder_accumulation':
    case 'high_grip_forearm_accumulation':
      return 'protect_tissue_stress'
    
    case 'method_density_conflict':
    case 'excessive_same_exercise_repetition':
    case 'excessive_same_family_repetition':
      return 'reduce_density_or_method_stress'
    
    case 'recovery_capacity_mismatch':
    case 'session_time_realism_mismatch':
    case 'warmup_need_mismatch':
    case 'cooldown_need_mismatch':
      return 'add_preparation_or_recovery_bias'
    
    case 'knowledge_coverage_gap':
      return 'needs_full_knowledge_review'
    
    default:
      // Use mutation type as fallback
      switch (mutationType) {
        case 'skill_frequency_adjustment':
          return 'increase_skill_exposure'
        case 'movement_family_rebalance':
          return 'rebalance_movement_family'
        case 'weighted_anchor_restore':
          return 'restore_weighted_anchor'
        case 'volume_adjustment':
        case 'intensity_adjustment':
          return 'adjust_volume_or_intensity'
        case 'method_suppression':
          return 'reduce_density_or_method_stress'
        case 'warmup_adjustment':
        case 'cooldown_adjustment':
          return 'add_preparation_or_recovery_bias'
        default:
          return 'needs_full_knowledge_review'
      }
  }
}

// =============================================================================
// HELPER: DERIVE COACH TITLE
// =============================================================================

function deriveCoachTitle(
  finding: ProgramBalanceFinding,
  action: FutureSessionPlanAction
): string {
  // Try to use skill name if available
  if (finding.affectedSkillIds.length > 0) {
    const skillId = finding.affectedSkillIds[0]
    const skillName = skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    switch (action) {
      case 'increase_skill_exposure':
        return `${skillName} exposure candidate`
      case 'restore_missing_skill_support':
        return `${skillName} support candidate`
      default:
        return `${skillName} balance candidate`
    }
  }
  
  // Use action-based title
  switch (action) {
    case 'increase_skill_exposure':
      return 'Skill exposure candidate'
    case 'restore_missing_skill_support':
      return 'Skill support candidate'
    case 'rebalance_movement_family':
      return 'Movement family balance candidate'
    case 'protect_tissue_stress':
      return 'Tissue protection candidate'
    case 'restore_weighted_anchor':
      return 'Weighted anchor candidate'
    case 'reduce_density_or_method_stress':
      return 'Density adjustment candidate'
    case 'adjust_volume_or_intensity':
      return 'Volume/intensity candidate'
    case 'add_preparation_or_recovery_bias':
      return 'Recovery bias candidate'
    case 'needs_full_knowledge_review':
      return 'Knowledge review candidate'
    default:
      return 'Future session candidate'
  }
}

// =============================================================================
// HELPER: DERIVE TRIGGER SUMMARY
// =============================================================================

function deriveTriggerSummary(finding: ProgramBalanceFinding): string {
  // Use finding title or summary as trigger
  if (finding.title && finding.title !== finding.type.replace(/_/g, ' ')) {
    return finding.title
  }
  return finding.summary || finding.type.replace(/_/g, ' ')
}

// =============================================================================
// HELPER: DERIVE PROPOSED CHANGE SUMMARY
// =============================================================================

function deriveProposedChangeSummary(
  action: FutureSessionPlanAction,
  scope: FutureSessionPlanScope
): string {
  const scopeText = scope === 'single_future_day' 
    ? 'a future uncompleted session'
    : scope === 'multiple_future_days'
    ? 'future uncompleted sessions'
    : scope === 'remaining_week'
    ? 'remaining week sessions'
    : 'future sessions (scope TBD)'
  
  switch (action) {
    case 'increase_skill_exposure':
      return `Future plan may add or restore skill exposure in ${scopeText} without rewriting completed days`
    case 'restore_missing_skill_support':
      return `Future plan may add support/progression exercises in ${scopeText}`
    case 'rebalance_movement_family':
      return `Future plan may adjust movement family distribution in ${scopeText}`
    case 'protect_tissue_stress':
      return `Future plan may reduce stress accumulation or add recovery bias in ${scopeText}`
    case 'restore_weighted_anchor':
      return `Future plan may consider adding weighted anchor exercise when equipment confirmed`
    case 'reduce_density_or_method_stress':
      return `Future plan may reduce method density or adjust placement in ${scopeText}`
    case 'adjust_volume_or_intensity':
      return `Future plan may adjust volume or intensity targets in ${scopeText}`
    case 'add_preparation_or_recovery_bias':
      return `Future plan may add warmup, cooldown, or recovery emphasis in ${scopeText}`
    case 'needs_full_knowledge_review':
      return `Future plan requires full knowledge base review before specific changes`
    default:
      return `Future plan may make adjustments in ${scopeText}`
  }
}

// =============================================================================
// HELPER: DERIVE PRESERVE SUMMARY
// =============================================================================

function derivePreserveSummary(
  action: FutureSessionPlanAction,
  finding: ProgramBalanceFinding
): string {
  const basePreserve = 'Preserve completed sessions, existing method applications, and weekly recovery cap'
  
  switch (action) {
    case 'increase_skill_exposure':
    case 'restore_missing_skill_support':
      return `${basePreserve}. Do not increase tendon stress blindly.`
    case 'protect_tissue_stress':
      return `${basePreserve}. Do not remove skill progress; preserve technique quality.`
    case 'restore_weighted_anchor':
      return `${basePreserve}. Requires equipment and ability confirmation.`
    case 'reduce_density_or_method_stress':
      return `${basePreserve}. Preserve user-applied method preferences.`
    case 'rebalance_movement_family':
      return `${basePreserve}. Maintain skill priority hierarchy.`
    default:
      return basePreserve
  }
}

// =============================================================================
// HELPER: DERIVE BLOCKED REASON
// =============================================================================

function deriveBlockedReason(
  status: FutureSessionPlanStatus,
  knowledgeCoverage: ProgramBalanceKnowledgeCoverageSummary
): string {
  switch (status) {
    case 'blocked_needs_full_db':
      return `Mutation blocked: ${knowledgeCoverage.unknownExerciseCount} exercises not in knowledge seed. Full database required (MASTER-8C).`
    case 'blocked_needs_more_evidence':
      return 'Mutation blocked: Low confidence finding. More workout evidence needed.'
    case 'blocked_needs_user_confirmation':
      return 'Mutation blocked: Requires explicit user confirmation before applying.'
    case 'blocked_no_writer':
      return 'Mutation blocked: Future-session writer not enabled in MASTER-8B.6. Read-only planning only.'
    case 'read_only_candidate':
      return 'Read-only candidate: No mutation writer available yet.'
    default:
      return 'Mutation blocked in current step.'
  }
}

// =============================================================================
// HELPER: DERIVE DATA NEEDED
// =============================================================================

function deriveDataNeeded(
  status: FutureSessionPlanStatus,
  finding: ProgramBalanceFinding,
  knowledgeCoverage: ProgramBalanceKnowledgeCoverageSummary
): readonly string[] {
  const needed: string[] = []
  
  if (status === 'blocked_needs_full_db' || finding.seedCoverageLimited) {
    needed.push('Complete exercise knowledge database (MASTER-8C)')
  }
  
  if (finding.missingData.length > 0) {
    needed.push(...finding.missingData.slice(0, 2))
  }
  
  if (status === 'blocked_needs_more_evidence') {
    needed.push('Additional workout history evidence')
  }
  
  // Always need writer
  needed.push('Future-session mutation writer (MASTER-8B.7+)')
  
  return needed.slice(0, 4)
}

// =============================================================================
// MAIN BUILDER FUNCTION
// =============================================================================

/**
 * Builds detailed planning information for a future session candidate.
 * This is a pure function that returns read-only planning data.
 * NO MUTATION IS PERFORMED.
 */
export function buildFutureSessionPlanningDetail(
  finding: ProgramBalanceFinding,
  mutationType: FutureMutationType,
  context: FuturePlanningContext
): FutureSessionPlanningDetail {
  const status = derivePlanStatus(finding, context.knowledgeCoverage)
  const scope = derivePlanScope(finding, context.completedDayIndexes)
  const action = derivePlanAction(finding, mutationType)
  const coachTitle = deriveCoachTitle(finding, action)
  const triggerSummary = deriveTriggerSummary(finding)
  const proposedChangeSummary = deriveProposedChangeSummary(action, scope)
  const preserveSummary = derivePreserveSummary(action, finding)
  const blockedReason = deriveBlockedReason(status, context.knowledgeCoverage)
  const dataNeeded = deriveDataNeeded(status, finding, context.knowledgeCoverage)
  
  // Filter affected days to uncompleted only
  const affectedFutureDayIndexes = context.completedDayIndexes
    ? finding.affectedDayIndexes.filter(d => !context.completedDayIndexes!.includes(d))
    : finding.affectedDayIndexes
  
  return {
    status,
    scope,
    proposedAction: action,
    coachTitle,
    triggerSummary,
    proposedChangeSummary,
    preserveSummary,
    blockedReason,
    dataNeeded,
    affectedFutureDayIndexes,
    beforeIntentSummary: null, // Not available until mutation writer exists
    afterIntentSummary: null,  // Not available until mutation writer exists
    userConfirmationRequired: true, // Always true - no automatic mutation
    mutationAllowedNow: false, // CRITICAL: Always false in MASTER-8B.6
  }
}
