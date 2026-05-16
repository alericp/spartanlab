/**
 * EXERCISE KNOWLEDGE COVERAGE READ-ONLY ANALYZER — MASTER-8C.20
 *
 * =============================================================================
 * THIN ADAPTER: Wraps existing ExerciseIdentityCoverageSummary into a
 * Foundation Map-ready read-only model for Plan Logic → Foundation Map display.
 * =============================================================================
 *
 * REUSES existing infrastructure:
 *   - program-balance-exercise-identity-coverage.ts (the real resolver)
 *   - exercise-skill-knowledge-seed.ts (the real science seed)
 *   - exercise-skill-knowledge-validation.ts (validation/lookup helpers)
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No React imports, no UI imports, no generator imports
 *   - No localStorage, no Date.now, no Math.random
 *   - No database calls, no route calls, no fetch
 *   - No mutation of program/session/exercise data
 *   - Deterministic output for same input
 *   - No `as any`, no `@ts-ignore`, no `@ts-expect-error`
 *
 * Created: MASTER-8C.20 / AB20.4.13
 */

import {
  summarizeExerciseIdentityCoverage,
  type ExerciseIdentityCoverageSummary,
} from './program-balance-exercise-identity-coverage'

// =============================================================================
// FOUNDATION MAP-READY MODEL
// =============================================================================

export type ExerciseKnowledgeCoverageStatus =
  | 'read_only_active'
  | 'partial'
  | 'needs_more_data'
  | 'unavailable'

export interface ExerciseKnowledgeCoverageReadonlyModel {
  readonly status: ExerciseKnowledgeCoverageStatus
  readonly mutationStatus: 'mutation_locked'
  readonly totalExerciseCount: number
  readonly fullScienceKnownCount: number
  readonly basicIdentityKnownCount: number
  readonly enhancedPartialKnownCount: number
  readonly aliasResolvedCount: number
  readonly trulyUnknownCount: number
  readonly coverageRatio: number
  readonly headline: string
  readonly summary: string
  readonly topFullScienceExercises: readonly string[]
  readonly topPartialOrBasicExercises: readonly string[]
  readonly topUnknownExercises: readonly string[]
  readonly sourceBasis: readonly string[]
  readonly missingSources: readonly string[]
  readonly nextSafeAction: string
  /** Raw summary from identity coverage resolver for downstream consumers */
  readonly rawSummary: ExerciseIdentityCoverageSummary
}

// =============================================================================
// INPUT SHAPE
// =============================================================================

export interface ExerciseKnowledgeCoverageInput {
  /** Unique exercises extracted from program sessions (deduplicated) */
  readonly exercises: readonly { id: string; name: string }[]
}

// =============================================================================
// HELPERS
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Derive a human-readable headline from coverage counts
 */
function deriveHeadline(summary: ExerciseIdentityCoverageSummary): string {
  const fullAndAlias = summary.fullScienceKnownCount + summary.aliasResolvedCount
  if (summary.totalExerciseCount === 0) {
    return 'No exercises to scan'
  }
  if (summary.fullScienceCoverageComplete) {
    return `Full science coverage (${fullAndAlias}/${summary.totalExerciseCount})`
  }
  if (summary.trulyUnknownCount === 0) {
    return `${fullAndAlias}/${summary.totalExerciseCount} full science, all identified`
  }
  return `${fullAndAlias}/${summary.totalExerciseCount} full science`
}

/**
 * Derive a descriptive summary line from coverage counts
 */
function deriveSummary(summary: ExerciseIdentityCoverageSummary): string {
  const parts: string[] = []
  const fullAndAlias = summary.fullScienceKnownCount + summary.aliasResolvedCount
  parts.push(`${fullAndAlias} full science`)
  if (summary.basicIdentityKnownCount > 0) {
    parts.push(`${summary.basicIdentityKnownCount} basic identity`)
  }
  if (summary.enhancedPartialKnownCount > 0) {
    parts.push(`${summary.enhancedPartialKnownCount} enhanced partial`)
  }
  if (summary.trulyUnknownCount > 0) {
    parts.push(`${summary.trulyUnknownCount} unknown`)
  }
  return `Coverage: ${parts.join(', ')} of ${summary.totalExerciseCount} exercises`
}

/**
 * Derive the Foundation Map-ready status from coverage summary
 */
function deriveStatus(summary: ExerciseIdentityCoverageSummary): ExerciseKnowledgeCoverageStatus {
  if (summary.totalExerciseCount === 0) return 'unavailable'
  if (summary.fullScienceCoverageComplete) return 'read_only_active'
  if (summary.basicIdentityCoverageComplete) return 'partial'
  return 'needs_more_data'
}

/**
 * Build source basis list
 */
function deriveSourceBasis(summary: ExerciseIdentityCoverageSummary): string[] {
  const sources: string[] = []
  if (summary.fullScienceKnownCount > 0 || summary.aliasResolvedCount > 0) {
    sources.push('exercise-skill seed')
  }
  if (summary.basicIdentityKnownCount > 0) {
    sources.push('adaptive pool')
  }
  if (summary.aliasResolvedCount > 0) {
    sources.push('alias resolver')
  }
  if (summary.enhancedPartialKnownCount > 0) {
    sources.push('enhanced profiles')
  }
  if (sources.length === 0) {
    sources.push('no sources resolved')
  }
  return sources
}

/**
 * Build missing sources list
 */
function deriveMissingSources(summary: ExerciseIdentityCoverageSummary): string[] {
  const missing: string[] = []
  if (summary.trulyUnknownCount > 0) {
    missing.push(`${summary.trulyUnknownCount} exercises not in any source`)
  }
  if (summary.basicIdentityKnownCount > 0) {
    missing.push(`${summary.basicIdentityKnownCount} exercises lack full science entries`)
  }
  if (summary.enhancedPartialKnownCount > 0) {
    missing.push(`${summary.enhancedPartialKnownCount} exercises only partially profiled`)
  }
  return missing
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

/**
 * Resolve exercise knowledge coverage for a set of program exercises.
 * 
 * This is a thin adapter that wraps the existing `summarizeExerciseIdentityCoverage()`
 * resolver into a Foundation Map-ready model.
 * 
 * Pure function. No side effects. Deterministic for same input.
 */
export function resolveExerciseKnowledgeCoverage(
  input: ExerciseKnowledgeCoverageInput
): ExerciseKnowledgeCoverageReadonlyModel {
  if (!input.exercises.length) {
    return {
      status: 'unavailable',
      mutationStatus: 'mutation_locked',
      totalExerciseCount: 0,
      fullScienceKnownCount: 0,
      basicIdentityKnownCount: 0,
      enhancedPartialKnownCount: 0,
      aliasResolvedCount: 0,
      trulyUnknownCount: 0,
      coverageRatio: 0,
      headline: 'No exercises to scan',
      summary: 'No program exercises available for coverage analysis',
      topFullScienceExercises: [],
      topPartialOrBasicExercises: [],
      topUnknownExercises: [],
      sourceBasis: [],
      missingSources: ['no program exercises provided'],
      nextSafeAction: 'Generate a program first',
      rawSummary: {
        totalExerciseCount: 0,
        fullScienceKnownCount: 0,
        basicIdentityKnownCount: 0,
        enhancedPartialKnownCount: 0,
        aliasResolvedCount: 0,
        trulyUnknownCount: 0,
        fullScienceKnownIds: [],
        basicIdentityKnownIds: [],
        enhancedPartialKnownIds: [],
        aliasResolvedIds: [],
        trulyUnknownIds: [],
        trulyUnknownNames: [],
        fullScienceCoverageComplete: false,
        basicIdentityCoverageComplete: false,
        sourceCounts: { fullScienceSeedTotal: 0, adaptivePoolTotal: 0 },
      },
    }
  }

  // Delegate to the real resolver
  const summary = summarizeExerciseIdentityCoverage(input.exercises)

  const fullAndAlias = summary.fullScienceKnownCount + summary.aliasResolvedCount
  const coverageRatio = summary.totalExerciseCount > 0
    ? fullAndAlias / summary.totalExerciseCount
    : 0

  return {
    status: deriveStatus(summary),
    mutationStatus: 'mutation_locked',
    totalExerciseCount: summary.totalExerciseCount,
    fullScienceKnownCount: summary.fullScienceKnownCount,
    basicIdentityKnownCount: summary.basicIdentityKnownCount,
    enhancedPartialKnownCount: summary.enhancedPartialKnownCount,
    aliasResolvedCount: summary.aliasResolvedCount,
    trulyUnknownCount: summary.trulyUnknownCount,
    coverageRatio: Math.round(coverageRatio * 100) / 100,
    headline: deriveHeadline(summary),
    summary: deriveSummary(summary),
    topFullScienceExercises: [...summary.fullScienceKnownIds.slice(0, 5)],
    topPartialOrBasicExercises: [
      ...summary.basicIdentityKnownIds.slice(0, 3),
      ...summary.enhancedPartialKnownIds.slice(0, 2),
    ],
    topUnknownExercises: [...summary.trulyUnknownNames.slice(0, 3)],
    sourceBasis: deriveSourceBasis(summary),
    missingSources: deriveMissingSources(summary),
    nextSafeAction: summary.fullScienceCoverageComplete
      ? 'Full current-program coverage achieved; generator mutation deferred'
      : 'Expand current-program science coverage; generator mutation deferred',
    rawSummary: summary,
  }
}
