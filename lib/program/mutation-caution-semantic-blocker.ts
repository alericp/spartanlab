/**
 * mutation-caution-semantic-blocker.ts
 * 
 * Pure helper to compute semantic hard-blocker status from MutationCautionClearanceGateModel.
 * 
 * [P28] This helper centralizes the semantic blocker logic so downstream gates
 * stop re-implementing raw activeCautionCount blocking.
 * 
 * Hard blockers: blocking, waiting_for_more_evidence, unknown status root candidates
 * Non-blocking context: clearable/read-only, diagnostic-only, cascade echoes
 */

import type { MutationCautionClearanceGateModel } from './mutation-caution-clearance-gate'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MutationCautionSemanticBlockerSummary = {
  readonly hasSemanticHardBlockers: boolean
  readonly semanticHardBlockerCount: number
  readonly blockingRootCandidateCount: number
  readonly waitingRootCandidateCount: number
  readonly unknownStatusRootCandidateCount: number
  readonly readOnlyClearableRootCandidateCount: number
  readonly diagnosticOnlyRootCandidateCount: number
  readonly derivedCascadeCautionCount: number
  readonly rawActiveCautionCount: number
  readonly rootCandidateClearanceReady: boolean
  readonly blocksBecause: readonly string[]
  readonly nonBlockingContext: readonly string[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes semantic hard-blocker summary from a MutationCautionClearanceGateModel.
 * 
 * This is a pure function with no side effects.
 * 
 * @param model - The mutation caution clearance gate model (may be null/undefined)
 * @returns A read-only summary of semantic blockers and non-blocking context
 */
export function computeSemanticBlockerSummary(
  model: MutationCautionClearanceGateModel | null | undefined
): MutationCautionSemanticBlockerSummary {
  // Handle null/undefined model conservatively
  if (!model) {
    return {
      hasSemanticHardBlockers: true,
      semanticHardBlockerCount: 0,
      blockingRootCandidateCount: 0,
      waitingRootCandidateCount: 0,
      unknownStatusRootCandidateCount: 0,
      readOnlyClearableRootCandidateCount: 0,
      diagnosticOnlyRootCandidateCount: 0,
      derivedCascadeCautionCount: 0,
      rawActiveCautionCount: 0,
      rootCandidateClearanceReady: false,
      blocksBecause: ['Caution clearance model unavailable'],
      nonBlockingContext: [],
    }
  }

  // Extract semantic fields from the model
  const blockingRootCandidateCount = model.blockingRootCandidateCount ?? 0
  const waitingRootCandidateCount = model.waitingRootCandidateCount ?? 0
  const unknownStatusRootCandidateCount = model.unknownStatusRootCandidateCount ?? 0
  const readOnlyClearableRootCandidateCount = model.readOnlyClearableRootCandidateCount ?? 0
  const diagnosticOnlyRootCandidateCount = model.diagnosticOnlyRootCandidateCount ?? 0
  const derivedCascadeCautionCount = model.derivedCascadeCautionCount ?? 0
  const rawActiveCautionCount = model.activeCautionCount ?? 0
  const rootCandidateClearanceReady = model.rootCandidateClearanceReady ?? false

  // Compute semantic hard blocker count
  // Use hardBlockingRootCandidateCount if available, otherwise compute from components
  const semanticHardBlockerCount = 
    model.hardBlockingRootCandidateCount ?? 
    (blockingRootCandidateCount + waitingRootCandidateCount + unknownStatusRootCandidateCount)

  const hasSemanticHardBlockers = semanticHardBlockerCount > 0

  // [P28.1] Normalize rootCandidateClearanceReady: cannot be true while hard blockers exist
  const semanticRootCandidateClearanceReady = rootCandidateClearanceReady && !hasSemanticHardBlockers

  // Build blocker reasons
  const blocksBecause: string[] = []
  if (blockingRootCandidateCount > 0) {
    blocksBecause.push(`${blockingRootCandidateCount} blocking root/candidate item${blockingRootCandidateCount !== 1 ? 's' : ''}`)
  }
  if (waitingRootCandidateCount > 0) {
    blocksBecause.push(`${waitingRootCandidateCount} waiting for evidence`)
  }
  if (unknownStatusRootCandidateCount > 0) {
    blocksBecause.push(`${unknownStatusRootCandidateCount} unknown status`)
  }

  // Build non-blocking context
  const nonBlockingContext: string[] = []
  if (readOnlyClearableRootCandidateCount > 0) {
    nonBlockingContext.push(`${readOnlyClearableRootCandidateCount} clearable/read-only (non-blocking)`)
  }
  if (diagnosticOnlyRootCandidateCount > 0) {
    nonBlockingContext.push(`${diagnosticOnlyRootCandidateCount} diagnostic-only (non-blocking)`)
  }
  if (derivedCascadeCautionCount > 0) {
    nonBlockingContext.push(`${derivedCascadeCautionCount} cascade echo${derivedCascadeCautionCount !== 1 ? 'es' : ''} (non-blocking)`)
  }

  return {
    hasSemanticHardBlockers,
    semanticHardBlockerCount,
    blockingRootCandidateCount,
    waitingRootCandidateCount,
    unknownStatusRootCandidateCount,
    readOnlyClearableRootCandidateCount,
    diagnosticOnlyRootCandidateCount,
    derivedCascadeCautionCount,
    rawActiveCautionCount,
    rootCandidateClearanceReady: semanticRootCandidateClearanceReady,
    blocksBecause,
    nonBlockingContext,
  }
}
