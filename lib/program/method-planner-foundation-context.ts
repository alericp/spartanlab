/**
 * METHOD PLANNER FOUNDATION CONTEXT — MASTER-8B.5
 *
 * =============================================================================
 * PURE READ-ONLY CONTEXT DERIVATION FOR METHOD PLANNER
 * =============================================================================
 *
 * This helper derives a compact read-only foundation context from Program Balance
 * results for display in the Method Planner sheet. It does NOT make mutation
 * decisions or change Method Planner eligibility.
 *
 * GUARANTEES:
 *   - Pure TypeScript, side-effect free
 *   - No React imports, no UI components
 *   - No generator imports, no live workout runtime
 *   - No mutation of input objects
 *   - No storage access (localStorage/sessionStorage)
 *   - Returns mutationAllowedNow: false always
 *   - Does not alter Method Planner counts or behavior
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.5
 */

import type { ProgramBalanceReadOnlyResult } from './program-balance-intelligence-contract'

// =============================================================================
// CONTRACT
// =============================================================================

/**
 * Read-only foundation context for Method Planner display
 */
export interface MethodPlannerFoundationContext {
  /** Connection status */
  readonly status: 'linked' | 'partial' | 'unavailable'
  /** Short headline for the context panel */
  readonly headline: string
  /** Compact chips to display */
  readonly chips: readonly string[]
  /** Warning notes if any (high/moderate findings) */
  readonly warnings: readonly string[]
  /** Proof lines for transparency */
  readonly proofLines: readonly string[]
  /** Always false in MASTER-8B.5 - no mutation allowed yet */
  readonly mutationAllowedNow: false
  /** Source attribution */
  readonly source: 'program_balance_readonly'
  /** Balance finding counts for display */
  readonly findingCounts: {
    readonly high: number
    readonly moderate: number
    readonly watch: number
    readonly total: number
  }
  /** Future candidate count (not applied) */
  readonly futureCandidateCount: number
  /** Whether representative seed limitation applies */
  readonly isRepresentativeSeedOnly: boolean
}

// =============================================================================
// BUILDER
// =============================================================================

/**
 * Builds a read-only foundation context from Program Balance result
 *
 * This function derives display-only context for Method Planner without
 * changing any Method Planner behavior, counts, or eligibility.
 */
export function buildMethodPlannerFoundationContext(
  result: ProgramBalanceReadOnlyResult | null | undefined
): MethodPlannerFoundationContext {
  // Handle null/undefined result
  if (!result) {
    return {
      status: 'unavailable',
      headline: 'Foundation context unavailable',
      chips: ['No balance context'],
      warnings: [],
      proofLines: ['Program Balance result not available'],
      mutationAllowedNow: false,
      source: 'program_balance_readonly',
      findingCounts: { high: 0, moderate: 0, watch: 0, total: 0 },
      futureCandidateCount: 0,
      isRepresentativeSeedOnly: false,
    }
  }

  // Handle unavailable status
  if (result.status === 'unavailable') {
    return {
      status: 'unavailable',
      headline: 'Foundation context unavailable',
      chips: ['No balance context', 'Needs program'],
      warnings: [],
      proofLines: [
        'Program Balance status: unavailable',
        result.missingData?.[0] ?? 'No program data',
      ],
      mutationAllowedNow: false,
      source: 'program_balance_readonly',
      findingCounts: { high: 0, moderate: 0, watch: 0, total: 0 },
      futureCandidateCount: 0,
      isRepresentativeSeedOnly: false,
    }
  }

  // Count findings by severity
  const highCount = result.findings.filter(f => f.severity === 'high').length
  const moderateCount = result.findings.filter(f => f.severity === 'moderate').length
  const watchCount = result.findings.filter(f => f.severity === 'watch' || f.severity === 'mild').length
  const totalFindings = result.findings.length

  // Check representative seed limitation
  const isRepresentativeSeedOnly = result.proof.consumedRepresentativeSeedOnly === true

  // Build chips
  const chips: string[] = ['Program Balance linked', 'Read-only']
  if (isRepresentativeSeedOnly) {
    chips.push('Representative seed')
  }
  chips.push('No method changes')

  // Build warnings
  const warnings: string[] = []
  if (highCount > 0) {
    warnings.push(`${highCount} high balance finding${highCount > 1 ? 's' : ''} detected`)
  }
  if (moderateCount > 0) {
    warnings.push(`${moderateCount} moderate balance finding${moderateCount > 1 ? 's' : ''} detected`)
  }
  if (result.futureSessionCandidates.length > 0) {
    warnings.push(`${result.futureSessionCandidates.length} future candidate${result.futureSessionCandidates.length > 1 ? 's' : ''} not applied`)
  }

  // Build proof lines
  const proofLines: string[] = [
    `Analyzed ${result.analyzedSessionCount} session${result.analyzedSessionCount !== 1 ? 's' : ''} / ${result.analyzedExerciseCount} exercise${result.analyzedExerciseCount !== 1 ? 's' : ''}`,
    `Known: ${result.knowledgeMatchedExerciseCount} / Unknown: ${result.knowledgeMissingExerciseCount}`,
    'Mutation allowed now: false',
  ]
  if (isRepresentativeSeedOnly) {
    proofLines.push('Full DB deferred to MASTER-8C+')
  }

  // Determine status
  const status: 'linked' | 'partial' = result.status === 'partial' ? 'partial' : 'linked'

  // Build headline
  let headline = 'Foundation context linked'
  if (status === 'partial') {
    headline = 'Foundation context partial'
  }
  if (highCount > 0 || moderateCount > 0) {
    headline = `Foundation linked — ${highCount + moderateCount} balance note${highCount + moderateCount > 1 ? 's' : ''}`
  }

  return {
    status,
    headline,
    chips,
    warnings,
    proofLines,
    mutationAllowedNow: false,
    source: 'program_balance_readonly',
    findingCounts: {
      high: highCount,
      moderate: moderateCount,
      watch: watchCount,
      total: totalFindings,
    },
    futureCandidateCount: result.futureSessionCandidates.length,
    isRepresentativeSeedOnly,
  }
}
