/**
 * PROGRAM BALANCE INTELLIGENCE CONTRACT — MASTER-8B.3
 *
 * =============================================================================
 * READ-ONLY PROGRAM BALANCE ANALYSIS CONTRACT
 * =============================================================================
 *
 * This module defines the typed contract for read-only program balance analysis.
 * It can detect selected-skill expression, movement-family balance, weighted-anchor
 * presence, tissue stress accumulation, and future-session adaptation candidates.
 *
 * CRITICAL GUARANTEES:
 *   - Pure TypeScript, side-effect free, JSON-safe
 *   - No React imports, no UI imports, no generator imports
 *   - No localStorage/sessionStorage, no Date.now at module scope
 *   - No database calls, no mutation functions
 *   - Does not claim the B2 seed is the complete exercise database
 *   - Returns knowledge coverage gaps when data is missing
 *
 * SEED SCOPE CLARIFICATION:
 *   The MASTER-8B.2 exercise/skill knowledge seed is a REPRESENTATIVE
 *   schema-validation seed, NOT the complete SpartanLab exercise database.
 *   Full database expansion is deferred to MASTER-8C / MASTER-8C+.
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.3
 */

// =============================================================================
// SEVERITY AND CONFIDENCE
// =============================================================================

/**
 * Severity levels for balance findings
 */
export type ProgramBalanceSeverity =
  | 'none'
  | 'watch'
  | 'mild'
  | 'moderate'
  | 'high'
  | 'blocked'

/**
 * Confidence levels for findings
 */
export type ProgramBalanceConfidence =
  | 'low'
  | 'moderate'
  | 'high'

// =============================================================================
// FINDING TYPES
// =============================================================================

/**
 * Types of balance findings the analyzer can produce
 */
export type ProgramBalanceFindingType =
  // Skill expression
  | 'selected_skill_underexpressed'
  | 'selected_skill_overexpressed'
  | 'selected_skill_absent'
  | 'selected_skill_unknown'
  // Movement family
  | 'movement_family_overrepresented'
  | 'movement_family_underrepresented'
  | 'pull_dominance'
  | 'push_underrepresentation'
  | 'core_compression_underrepresentation'
  // Weighted anchors
  | 'weighted_pull_anchor_missing'
  | 'weighted_dip_anchor_missing'
  | 'foundational_dip_missing'
  | 'foundational_pull_missing'
  // Skill-specific
  | 'planche_underexposed'
  | 'front_lever_overloaded'
  | 'back_lever_underexposed'
  | 'hspu_token_exposure'
  | 'muscle_up_support_missing'
  | 'one_arm_pull_up_support_missing'
  | 'dragon_flag_underexpressed'
  // Spacing and repetition
  | 'poor_skill_spacing'
  | 'excessive_same_exercise_repetition'
  | 'excessive_same_family_repetition'
  // Tissue stress
  | 'high_elbow_biceps_tendon_accumulation'
  | 'high_wrist_extension_accumulation'
  | 'high_anterior_shoulder_accumulation'
  | 'high_grip_forearm_accumulation'
  // Method and capacity
  | 'method_density_conflict'
  | 'recovery_capacity_mismatch'
  | 'session_time_realism_mismatch'
  | 'warmup_need_mismatch'
  | 'cooldown_need_mismatch'
  // Future adaptation
  | 'future_session_adaptation_candidate'
  // Knowledge gaps
  | 'knowledge_coverage_gap'

// =============================================================================
// FUTURE MUTATION TYPES (READ-ONLY CLASSIFICATION)
// =============================================================================

/**
 * Types of future mutation that might address a finding (for classification only)
 */
export type FutureMutationType =
  | 'none'
  | 'skill_frequency_adjustment'
  | 'movement_family_rebalance'
  | 'weighted_anchor_restore'
  | 'volume_adjustment'
  | 'intensity_adjustment'
  | 'method_suppression'
  | 'warmup_adjustment'
  | 'cooldown_adjustment'
  | 'exercise_swap'
  | 'session_emphasis_shift'
  | 'manual_review'

// =============================================================================
// BRANCH INPUT
// =============================================================================

/**
 * A single exercise in the program for analysis
 */
export interface ProgramBalanceExerciseInput {
  readonly id: string
  readonly name: string
  readonly sets?: number
  readonly repsOrTime?: string | number
  readonly category?: string
  readonly methodTags?: readonly string[]
  readonly targetRpe?: number
  readonly isWarmup?: boolean
  readonly isCooldown?: boolean
}

/**
 * A single session/day in the program for analysis
 */
export interface ProgramBalanceSessionInput {
  readonly dayIndex: number
  readonly title?: string
  readonly name?: string
  readonly completed?: boolean
  readonly exercises: readonly ProgramBalanceExerciseInput[]
}

/**
 * Read-only input for the Program Balance analyzer
 */
export interface ProgramBalanceBranchInput {
  readonly programId?: string
  readonly weekNumber?: number
  readonly selectedSkillIds: readonly string[]
  readonly sessions: readonly ProgramBalanceSessionInput[]
  readonly existingMethodSummary?: unknown
  readonly adaptiveFoundationSummary?: unknown
  readonly recoveryReadinessSummary?: unknown
  readonly evidenceWorkoutHistorySummary?: unknown
  readonly currentPhase?: string
  readonly timeBudgetMinutes?: number
}

// =============================================================================
// EXERCISE RESOLUTION
// =============================================================================

/**
 * Result of resolving an exercise against the knowledge seed
 */
export interface ProgramBalanceExerciseResolution {
  readonly originalExerciseId: string
  readonly originalExerciseName: string
  readonly resolvedKnowledgeId: string | null
  readonly resolvedCanonicalName: string | null
  readonly knowledgeFound: boolean
  readonly prescriptionUnit: string | null
  readonly movementFamilies: readonly string[]
  readonly trainingPurposes: readonly string[]
  readonly skillTransfers: readonly { skillId: string; transferStrength: string }[]
  readonly tissueStressRegions: readonly string[]
  readonly weightedStrengthAnchor: boolean
  readonly methodCompatibilitySummary: string | null
  readonly taxonomyWarnings: readonly string[]
  readonly unknownReason: string | null
  readonly seedCoverageOnly: boolean
}

// =============================================================================
// KNOWLEDGE COVERAGE SUMMARY
// =============================================================================

/**
 * Summary of knowledge coverage for the analyzed program
 *
 * CRITICAL: B2 seed is representative only, not complete
 */
export interface ProgramBalanceKnowledgeCoverageSummary {
  /** Always true - B2 is a representative seed */
  readonly seedIsRepresentativeOnly: true
  readonly knownExerciseCount: number
  readonly unknownExerciseCount: number
  readonly knownExerciseIds: readonly string[]
  readonly unknownExerciseIds: readonly string[]
  readonly knownExerciseNames: readonly string[]
  readonly unknownExerciseNames: readonly string[]
  readonly missingCoverageWarnings: readonly string[]
  /** Full database deferred to this step */
  readonly fullDatabaseDeferredTo: 'MASTER_8C'
  /** May underestimate issues due to incomplete seed */
  readonly mayUnderestimateBalanceIssues: boolean
  readonly mayUnderestimateAnchorSupport: boolean
  readonly mayUnderestimateWarmupCooldownNeeds: boolean
}

// =============================================================================
// SKILL EXPRESSION
// =============================================================================

/**
 * Expression status for a selected skill
 */
export type SkillExpressionStatus =
  | 'direct_primary'
  | 'direct_secondary'
  | 'support_only'
  | 'maintenance_only'
  | 'underexpressed'
  | 'absent'
  | 'unknown'

/**
 * Skill expression analysis for a single selected skill
 */
export interface ProgramBalanceSkillExpression {
  readonly skillId: string
  readonly skillName: string
  readonly expressionStatus: SkillExpressionStatus
  readonly directExposureCount: number
  readonly supportExposureCount: number
  readonly maintenanceExposureCount: number
  readonly dayIndexes: readonly number[]
  readonly longestGapDays: number
  readonly clusteredExposure: boolean
  readonly severity: ProgramBalanceSeverity
  readonly rationale: string
  readonly recommendedReadOnlyNextStep: string | null
  readonly confidence: ProgramBalanceConfidence
  readonly missingKnowledgeCoverage: boolean
}

// =============================================================================
// MOVEMENT FAMILY SUMMARY
// =============================================================================

/**
 * Movement family exposure summary
 */
export interface ProgramBalanceMovementFamilySummary {
  readonly family: string
  readonly exposureCount: number
  readonly hardExposureCount: number
  readonly dayIndexes: readonly number[]
  readonly consecutiveDayStreak: number
  readonly severity: ProgramBalanceSeverity
  readonly rationale: string
  readonly confidence: ProgramBalanceConfidence
  readonly missingKnowledgeCoverage: boolean
}

// =============================================================================
// WEIGHTED ANCHOR SUMMARY
// =============================================================================

/**
 * Anchor presence status
 */
export type AnchorStatus =
  | 'present'
  | 'missing_acceptable'
  | 'missing_caution'
  | 'missing_high_priority'
  | 'unknown_ability'
  | 'unknown_coverage'

/**
 * Weighted anchor summary
 */
export interface ProgramBalanceWeightedAnchorSummary {
  readonly weightedPullUpPresent: boolean
  readonly weightedDipPresent: boolean
  readonly pullAnchorStatus: AnchorStatus
  readonly dipAnchorStatus: AnchorStatus
  readonly missingReason: string | null
  readonly severity: ProgramBalanceSeverity
  readonly rationale: string
  readonly confidence: ProgramBalanceConfidence
  readonly missingKnowledgeCoverage: boolean
}

// =============================================================================
// TISSUE STRESS SUMMARY
// =============================================================================

/**
 * Tissue stress summary for a region
 */
export interface ProgramBalanceTissueStressSummary {
  readonly region: string
  readonly exposureCount: number
  readonly highStressExposureCount: number
  readonly consecutiveExposureDays: number
  readonly severity: ProgramBalanceSeverity
  readonly rationale: string
  readonly futureSafeguardNeed: string | null
  readonly confidence: ProgramBalanceConfidence
  readonly missingKnowledgeCoverage: boolean
}

// =============================================================================
// FINDING
// =============================================================================

/**
 * A single balance finding
 */
export interface ProgramBalanceFinding {
  readonly id: string
  readonly type: ProgramBalanceFindingType
  readonly severity: ProgramBalanceSeverity
  readonly title: string
  readonly summary: string
  readonly affectedSkillIds: readonly string[]
  readonly affectedExerciseIds: readonly string[]
  readonly affectedDayIndexes: readonly number[]
  readonly evidence: readonly string[]
  readonly missingData: readonly string[]
  readonly readOnlyRecommendation: string | null
  readonly futureMutationCandidate: boolean
  readonly futureMutationType: FutureMutationType
  /** Mutation is NOT allowed in MASTER-8B.3 */
  readonly mutationAllowedNow: false
  readonly confidence: ProgramBalanceConfidence
  readonly seedCoverageLimited: boolean
}

// =============================================================================
// FUTURE SESSION CANDIDATE
// =============================================================================

/**
 * MASTER-8B.6: Planning status for future session candidates
 */
export type FutureSessionPlanStatus =
  | 'read_only_candidate'
  | 'blocked_needs_full_db'
  | 'blocked_no_writer'
  | 'blocked_needs_user_confirmation'
  | 'blocked_needs_more_evidence'

/**
 * MASTER-8B.6: Scope of the future session plan
 */
export type FutureSessionPlanScope =
  | 'single_future_day'
  | 'multiple_future_days'
  | 'remaining_week'
  | 'next_similar_session'
  | 'unknown_future_scope'

/**
 * MASTER-8B.6: Types of actions a future plan might propose
 */
export type FutureSessionPlanAction =
  | 'increase_skill_exposure'
  | 'restore_missing_skill_support'
  | 'rebalance_movement_family'
  | 'protect_tissue_stress'
  | 'restore_weighted_anchor'
  | 'reduce_density_or_method_stress'
  | 'adjust_volume_or_intensity'
  | 'add_preparation_or_recovery_bias'
  | 'needs_full_knowledge_review'

/**
 * MASTER-8B.6: Detailed planning information for a future session candidate
 * This is a read-only planning contract - NO mutation is allowed
 */
export interface FutureSessionPlanningDetail {
  readonly status: FutureSessionPlanStatus
  readonly scope: FutureSessionPlanScope
  readonly proposedAction: FutureSessionPlanAction
  readonly coachTitle: string
  readonly triggerSummary: string
  readonly proposedChangeSummary: string
  readonly preserveSummary: string
  readonly blockedReason: string
  readonly dataNeeded: readonly string[]
  readonly affectedFutureDayIndexes: readonly number[]
  readonly beforeIntentSummary: string | null
  readonly afterIntentSummary: string | null
  readonly userConfirmationRequired: boolean
  /** Always false in MASTER-8B.6 - no mutation allowed */
  readonly mutationAllowedNow: false
}

/**
 * A future session adaptation candidate (read-only classification)
 */
export interface FutureSessionCandidate {
  readonly candidateType: FutureMutationType
  readonly targetDayIndexes: readonly number[]
  readonly rationale: string
  readonly priority: ProgramBalanceSeverity
  readonly confidence: ProgramBalanceConfidence
  readonly requiresFullKnowledgeBase: boolean
  /** MASTER-8B.6: Detailed planning information (read-only) */
  readonly planningDetail?: FutureSessionPlanningDetail
}

// =============================================================================
// PROOF
// =============================================================================

/**
 * Proof that the analyzer behaved correctly
 */
export interface ProgramBalanceProof {
  readonly consumedKnowledgeSeed: boolean
  /** Always true - B2 seed is representative only */
  readonly consumedRepresentativeSeedOnly: true
  /** Always false until MASTER-8C */
  readonly fullKnowledgeBaseComplete: false
  readonly fullKnowledgeBaseDeferredTo: 'MASTER_8C'
  readonly consumedSelectedSkills: boolean
  readonly consumedProgramSessions: boolean
  readonly consumedCompletionState: boolean
  readonly consumedMethodSummary: boolean
  readonly consumedAdaptiveFoundation: boolean
  /** Always true - no mutation in MASTER-8B.3 */
  readonly noMutationPerformed: true
  readonly noGeneratorChange: true
  readonly safeForUiReadOnlyConsumption: boolean
}

// =============================================================================
// RESULT STATUS
// =============================================================================

/**
 * Result status
 */
export type ProgramBalanceResultStatus =
  | 'unavailable'
  | 'partial'
  | 'ready'

// =============================================================================
// MAIN RESULT
// =============================================================================

/**
 * The complete read-only result from the Program Balance analyzer
 */
export interface ProgramBalanceReadOnlyResult {
  readonly status: ProgramBalanceResultStatus
  /** Always false in MASTER-8B.6 */
  readonly mutationAllowedNow: false
  readonly sourceStep: 'MASTER_8B_3' | 'MASTER_8B_6'
  readonly analyzedSessionCount: number
  readonly analyzedExerciseCount: number
  readonly knowledgeMatchedExerciseCount: number
  readonly knowledgeMissingExerciseCount: number
  readonly selectedSkillCount: number
  readonly knowledgeCoverageSummary: ProgramBalanceKnowledgeCoverageSummary
  readonly findings: readonly ProgramBalanceFinding[]
  readonly skillExpression: readonly ProgramBalanceSkillExpression[]
  readonly movementFamilySummary: readonly ProgramBalanceMovementFamilySummary[]
  readonly weightedAnchorSummary: ProgramBalanceWeightedAnchorSummary
  readonly tissueStressSummary: readonly ProgramBalanceTissueStressSummary[]
  readonly futureSessionCandidates: readonly FutureSessionCandidate[]
  readonly missingData: readonly string[]
  readonly proof: ProgramBalanceProof
  readonly nextAllowedStep: 'MASTER_8B_4' | 'MASTER_8B_7'
}
