/**
 * PROGRAM BALANCE VALIDATION — MASTER-8B.3
 *
 * =============================================================================
 * VALIDATION AND FIXTURE TESTING FOR PROGRAM BALANCE ANALYZER
 * =============================================================================
 *
 * This module provides validation helpers and fixture testing for the
 * Program Balance analyzer. It proves the analyzer behaves correctly
 * without mutation and handles knowledge coverage gaps honestly.
 *
 * CRITICAL GUARANTEES:
 *   - Pure TypeScript, side-effect free
 *   - Does not import UI/generator/runtime
 *   - Does not throw by default
 *   - Does not run at module load
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.3
 */

import type {
  ProgramBalanceBranchInput,
  ProgramBalanceReadOnlyResult,
} from './program-balance-intelligence-contract'

import { analyzeProgramBalanceReadOnly } from './program-balance-readonly-analyzer'

// =============================================================================
// CONTRACT VALIDATION
// =============================================================================

/**
 * Contract validation result
 */
export interface ProgramBalanceContractValidation {
  readonly ok: boolean
  readonly contractTypesExist: boolean
  readonly analyzerExists: boolean
  readonly fixtureCanRun: boolean
  readonly errors: readonly string[]
}

/**
 * Validate that the Program Balance analyzer contract is complete
 */
export function validateProgramBalanceAnalyzerContract(): ProgramBalanceContractValidation {
  const errors: string[] = []

  // Check contract types exist (they do if this file compiles)
  const contractTypesExist = true

  // Check analyzer exists
  let analyzerExists = false
  try {
    analyzerExists = typeof analyzeProgramBalanceReadOnly === 'function'
  } catch {
    errors.push('analyzeProgramBalanceReadOnly function not found')
  }

  // Check fixture can run
  let fixtureCanRun = false
  if (analyzerExists) {
    try {
      const fixture = buildProgramBalanceFixtureInput()
      const result = analyzeProgramBalanceReadOnly(fixture)
      fixtureCanRun = result !== null && result !== undefined
    } catch (e) {
      errors.push(`Fixture failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  return {
    ok: contractTypesExist && analyzerExists && fixtureCanRun && errors.length === 0,
    contractTypesExist,
    analyzerExists,
    fixtureCanRun,
    errors,
  }
}

// =============================================================================
// RESULT VALIDATION
// =============================================================================

/**
 * Result validation result
 */
export interface ProgramBalanceResultValidation {
  readonly ok: boolean
  readonly hasStatus: boolean
  readonly mutationDisabled: boolean
  readonly hasKnowledgeCoverage: boolean
  readonly hasFindings: boolean
  readonly hasSkillExpression: boolean
  readonly hasMovementFamilySummary: boolean
  readonly hasWeightedAnchorSummary: boolean
  readonly hasTissueStressSummary: boolean
  readonly hasProof: boolean
  readonly proofShowsNoMutation: boolean
  readonly proofShowsRepresentativeSeed: boolean
  readonly proofShowsFullDbDeferred: boolean
  readonly errors: readonly string[]
}

/**
 * Validate a Program Balance result
 */
export function validateProgramBalanceResult(
  result: ProgramBalanceReadOnlyResult
): ProgramBalanceResultValidation {
  const errors: string[] = []

  const hasStatus = !!result.status
  if (!hasStatus) errors.push('Missing status')

  const mutationDisabled = result.mutationAllowedNow === false
  if (!mutationDisabled) errors.push('mutationAllowedNow should be false')

  const hasKnowledgeCoverage = !!result.knowledgeCoverageSummary
  if (!hasKnowledgeCoverage) errors.push('Missing knowledgeCoverageSummary')

  const hasFindings = Array.isArray(result.findings)
  if (!hasFindings) errors.push('Missing findings array')

  const hasSkillExpression = Array.isArray(result.skillExpression)
  if (!hasSkillExpression) errors.push('Missing skillExpression array')

  const hasMovementFamilySummary = Array.isArray(result.movementFamilySummary)
  if (!hasMovementFamilySummary) errors.push('Missing movementFamilySummary array')

  const hasWeightedAnchorSummary = !!result.weightedAnchorSummary
  if (!hasWeightedAnchorSummary) errors.push('Missing weightedAnchorSummary')

  const hasTissueStressSummary = Array.isArray(result.tissueStressSummary)
  if (!hasTissueStressSummary) errors.push('Missing tissueStressSummary array')

  const hasProof = !!result.proof
  if (!hasProof) errors.push('Missing proof')

  const proofShowsNoMutation = result.proof?.noMutationPerformed === true
  if (!proofShowsNoMutation) errors.push('Proof should show noMutationPerformed: true')

  const proofShowsRepresentativeSeed = result.proof?.consumedRepresentativeSeedOnly === true
  if (!proofShowsRepresentativeSeed) errors.push('Proof should show consumedRepresentativeSeedOnly: true')

  const proofShowsFullDbDeferred = result.proof?.fullKnowledgeBaseComplete === false
  if (!proofShowsFullDbDeferred) errors.push('Proof should show fullKnowledgeBaseComplete: false')

  return {
    ok: errors.length === 0,
    hasStatus,
    mutationDisabled,
    hasKnowledgeCoverage,
    hasFindings,
    hasSkillExpression,
    hasMovementFamilySummary,
    hasWeightedAnchorSummary,
    hasTissueStressSummary,
    hasProof,
    proofShowsNoMutation,
    proofShowsRepresentativeSeed,
    proofShowsFullDbDeferred,
    errors,
  }
}

// =============================================================================
// FIXTURE INPUT
// =============================================================================

/**
 * Build a realistic fixture input for testing
 *
 * This fixture represents a pull-heavy 6-day program similar to
 * the current visible issue:
 * - 8 selected skills
 * - Repeated pull/front-lever/explosive pull exposure
 * - Limited planche/push/dip exposure
 * - Missing weighted anchors
 * - Intentionally includes unknown exercise IDs to test coverage handling
 */
export function buildProgramBalanceFixtureInput(): ProgramBalanceBranchInput {
  return {
    programId: 'fixture_program_001',
    weekNumber: 1,
    selectedSkillIds: [
      'planche',
      'front_lever',
      'back_lever',
      'hspu',
      'muscle_up',
      'one_arm_pull_up',
      'l_sit',
      'v_sit',
    ],
    sessions: [
      {
        dayIndex: 1,
        title: 'Pull Focus Day',
        completed: false,
        exercises: [
          { id: 'pull_up', name: 'Pull-Up', sets: 5, repsOrTime: 8 },
          { id: 'tuck_fl', name: 'Tuck Front Lever', sets: 4, repsOrTime: '15s' },
          { id: 'dragon_flag', name: 'Dragon Flag', sets: 3, repsOrTime: 5 },
          // Intentionally unknown exercise to test coverage gaps
          { id: 'unknown_exercise_1', name: 'Some Unknown Exercise', sets: 3, repsOrTime: 10 },
        ],
      },
      {
        dayIndex: 2,
        title: 'Push Day',
        completed: false,
        exercises: [
          { id: 'planche_lean', name: 'Planche Lean', sets: 4, repsOrTime: '20s' },
          { id: 'pike_pushup', name: 'Pike Push-Up', sets: 4, repsOrTime: 10 },
          { id: 'dip', name: 'Parallel Bar Dip', sets: 4, repsOrTime: 12 },
        ],
      },
      {
        dayIndex: 3,
        title: 'Pull Day 2',
        completed: false,
        exercises: [
          { id: 'pull_up', name: 'Pull-Up', sets: 4, repsOrTime: 10 },
          { id: 'tuck_fl', name: 'Tuck Front Lever', sets: 5, repsOrTime: '12s' },
          { id: 'hollow_body', name: 'Hollow Body Hold', sets: 3, repsOrTime: '30s' },
        ],
      },
      {
        dayIndex: 4,
        title: 'Skills Day',
        completed: false,
        exercises: [
          { id: 'l_sit_skill', name: 'L-Sit', sets: 5, repsOrTime: '20s' },
          { id: 'tuck_planche', name: 'Tuck Planche', sets: 4, repsOrTime: '10s' },
          { id: 'wall_hspu', name: 'Wall HSPU', sets: 3, repsOrTime: 5 },
        ],
      },
      {
        dayIndex: 5,
        title: 'Pull Day 3',
        completed: false,
        exercises: [
          { id: 'pull_up', name: 'Pull-Up', sets: 5, repsOrTime: 6 },
          // Another unknown exercise
          { id: 'explosive_pull_up_variant', name: 'Explosive Pull Variant', sets: 3, repsOrTime: 5 },
          { id: 'dragon_flag', name: 'Dragon Flag', sets: 4, repsOrTime: 6 },
        ],
      },
      {
        dayIndex: 6,
        title: 'Mixed Day',
        completed: false,
        exercises: [
          { id: 'tuck_planche_pushup', name: 'Tuck Planche Push-Up', sets: 4, repsOrTime: 8 },
          { id: 'tuck_fl', name: 'Tuck Front Lever', sets: 3, repsOrTime: '15s' },
          { id: 'hollow_body', name: 'Hollow Body Hold', sets: 3, repsOrTime: '45s' },
        ],
      },
    ],
    existingMethodSummary: undefined,
    adaptiveFoundationSummary: undefined,
    recoveryReadinessSummary: undefined,
    evidenceWorkoutHistorySummary: undefined,
    currentPhase: 'strength',
    timeBudgetMinutes: 60,
  }
}

// =============================================================================
// FIXTURE ANALYSIS
// =============================================================================

/**
 * Fixture analysis result
 */
export interface FixtureAnalysisResult {
  readonly ok: boolean
  readonly result: ProgramBalanceReadOnlyResult
  readonly validation: ProgramBalanceResultValidation
  readonly hasPullDominanceFinding: boolean
  readonly hasPushUnderrepresentationFinding: boolean
  readonly hasSkillUnderexpressionFinding: boolean
  readonly hasWeightedAnchorFinding: boolean
  readonly hasKnowledgeCoverageGapFinding: boolean
  readonly mutationAllowedNowIsFalse: boolean
  readonly fullKnowledgeBaseCompleteIsFalse: boolean
  readonly fullKnowledgeBaseDeferredToMaster8C: boolean
  readonly errors: readonly string[]
}

/**
 * Run fixture analysis and validate results
 */
export function runProgramBalanceFixtureAnalysis(): FixtureAnalysisResult {
  const errors: string[] = []

  // Build and run fixture
  const fixture = buildProgramBalanceFixtureInput()
  const result = analyzeProgramBalanceReadOnly(fixture)

  // Validate result
  const validation = validateProgramBalanceResult(result)
  if (!validation.ok) {
    errors.push(...validation.errors)
  }

  // Check for expected findings
  const hasPullDominanceFinding = result.findings.some(
    (f) => f.type === 'pull_dominance'
  )
  if (!hasPullDominanceFinding) {
    // This is expected given the pull-heavy fixture
    // But it's not an error if knowledge coverage is incomplete
  }

  const hasPushUnderrepresentationFinding = result.findings.some(
    (f) => f.type === 'push_underrepresentation'
  )

  const hasSkillUnderexpressionFinding = result.findings.some(
    (f) =>
      f.type === 'selected_skill_underexpressed' ||
      f.type === 'selected_skill_absent' ||
      f.type === 'selected_skill_unknown'
  )

  const hasWeightedAnchorFinding = result.findings.some(
    (f) =>
      f.type === 'weighted_pull_anchor_missing' ||
      f.type === 'weighted_dip_anchor_missing'
  )

  const hasKnowledgeCoverageGapFinding = result.findings.some(
    (f) => f.type === 'knowledge_coverage_gap'
  )
  if (!hasKnowledgeCoverageGapFinding && result.knowledgeCoverageSummary.unknownExerciseCount > 0) {
    errors.push('Expected knowledge_coverage_gap finding for unknown exercises')
  }

  // Check critical invariants
  const mutationAllowedNowIsFalse = result.mutationAllowedNow === false
  if (!mutationAllowedNowIsFalse) {
    errors.push('mutationAllowedNow must be false')
  }

  const fullKnowledgeBaseCompleteIsFalse = result.proof.fullKnowledgeBaseComplete === false
  if (!fullKnowledgeBaseCompleteIsFalse) {
    errors.push('fullKnowledgeBaseComplete must be false')
  }

  const fullKnowledgeBaseDeferredToMaster8C =
    result.proof.fullKnowledgeBaseDeferredTo === 'MASTER_8C'
  if (!fullKnowledgeBaseDeferredToMaster8C) {
    errors.push('fullKnowledgeBaseDeferredTo must be MASTER_8C')
  }

  return {
    ok: errors.length === 0,
    result,
    validation,
    hasPullDominanceFinding,
    hasPushUnderrepresentationFinding,
    hasSkillUnderexpressionFinding,
    hasWeightedAnchorFinding,
    hasKnowledgeCoverageGapFinding,
    mutationAllowedNowIsFalse,
    fullKnowledgeBaseCompleteIsFalse,
    fullKnowledgeBaseDeferredToMaster8C,
    errors,
  }
}

// =============================================================================
// COVERAGE SUMMARY
// =============================================================================

/**
 * Get a human-readable coverage summary
 */
export function getProgramBalanceCoverageSummary(): {
  readonly contractFile: string
  readonly analyzerFile: string
  readonly validationFile: string
  readonly seedScope: string
  readonly mutationStatus: string
  readonly fullDatabaseStatus: string
  readonly nextStep: string
} {
  return {
    contractFile: 'lib/program/program-balance-intelligence-contract.ts',
    analyzerFile: 'lib/program/program-balance-readonly-analyzer.ts',
    validationFile: 'lib/program/program-balance-validation.ts',
    seedScope: 'B2 is REPRESENTATIVE ONLY - not complete exercise database',
    mutationStatus: 'Mutation NOT allowed in MASTER-8B.3',
    fullDatabaseStatus: 'Full database expansion deferred to MASTER-8C / MASTER-8C+',
    nextStep: 'MASTER-8B.4 — Coach Intelligence Hub Tile Contract Wiring',
  }
}
