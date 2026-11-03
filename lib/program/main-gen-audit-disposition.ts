/**
 * Display decision for the main-build diagnostic.
 * This does not generate, save, or replace a program.
 */

export type MainGenDisplayVerdict =
  | 'MAIN_FULL_SUCCESS_6'
  | 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED'
  | 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE'
  | 'MAIN_TARGET_LOST_IN_RESOLUTION'
  | 'MAIN_TARGET_LOST_IN_STRUCTURE_BUILD'
  | 'MAIN_TARGET_LOST_DURING_SAVE'

export type MainGenDisplayDecision =
  | { action: 'skip' }
  | { action: 'retire' }
  | {
      action: 'update'
      overwriteDetected: boolean
      overwriteSource: 'program_id_mismatch' | 'session_count_mismatch_same_id' | null
      finalVerdict: MainGenDisplayVerdict | null
      failedStage: 'rehydration' | 'resolution' | 'structure_build' | 'save' | null
      expectedSessionCount: number | null
      resolvedSessionCount: number | null
    }

export interface MainGenDisplayInput {
  programLoaded: boolean
  displayedProgramId: string | null
  displayedSessionCount: number | null
  displayedCreatedAt: string | null
  savedProgramId: string | null
  savedSessionCount: number | null
  auditStartedAt: string | null
  expectedSessionCount: number | null
  submittedTrainingDays: number | 'flexible' | null
  resolvedSessionCount: number | null
  builtSessionCount: number | null
  savedProgramTrainingDays: number | null
  savedProgramDeleted: boolean
  withinAttemptLock: boolean
}

export function observedSessionCount(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return value
}

export function firstObservedSessionCount(values: unknown[]): number | null {
  for (const value of values) {
    const observed = observedSessionCount(value)
    if (observed != null) return observed
  }
  return null
}

function timestampMs(value: string | null): number | null {
  if (typeof value !== 'string' || value.length === 0) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function resolveMainGenDisplayAudit(input: MainGenDisplayInput): MainGenDisplayDecision {
  if (!input.programLoaded || !input.savedProgramId) return { action: 'skip' }

  const expectedSessionCount = firstObservedSessionCount([
    input.expectedSessionCount,
    input.submittedTrainingDays,
  ])
  const resolvedSessionCount = firstObservedSessionCount([
    input.resolvedSessionCount,
    input.savedProgramTrainingDays,
  ])

  if (input.displayedProgramId !== input.savedProgramId) {
    const displayedAt = timestampMs(input.displayedCreatedAt)
    const attemptAt = timestampMs(input.auditStartedAt)
    const laterIndependentProgram = displayedAt != null && attemptAt != null && displayedAt > attemptAt
    if (!input.withinAttemptLock && (input.savedProgramDeleted || laterIndependentProgram)) {
      return { action: 'retire' }
    }
    return {
      action: 'update',
      overwriteDetected: true,
      overwriteSource: 'program_id_mismatch',
      finalVerdict: 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE',
      failedStage: 'rehydration',
      expectedSessionCount,
      resolvedSessionCount,
    }
  }

  if (
    input.savedSessionCount != null
    && input.displayedSessionCount != null
    && input.displayedSessionCount !== input.savedSessionCount
  ) {
    return {
      action: 'update',
      overwriteDetected: true,
      overwriteSource: 'session_count_mismatch_same_id',
      finalVerdict: 'MAIN_TARGET_LOST_BY_POST_BUILD_OVERWRITE',
      failedStage: 'rehydration',
      expectedSessionCount,
      resolvedSessionCount,
    }
  }

  if (
    expectedSessionCount != null
    && input.displayedSessionCount != null
    && input.displayedSessionCount < expectedSessionCount
  ) {
    if (resolvedSessionCount != null && resolvedSessionCount < expectedSessionCount) {
      return {
        action: 'update',
        overwriteDetected: false,
        overwriteSource: null,
        finalVerdict: 'MAIN_TARGET_LOST_IN_RESOLUTION',
        failedStage: 'resolution',
        expectedSessionCount,
        resolvedSessionCount,
      }
    }
    if (input.builtSessionCount != null && input.builtSessionCount < expectedSessionCount) {
      return {
        action: 'update',
        overwriteDetected: false,
        overwriteSource: null,
        finalVerdict: 'MAIN_TARGET_LOST_IN_STRUCTURE_BUILD',
        failedStage: 'structure_build',
        expectedSessionCount,
        resolvedSessionCount,
      }
    }
    if (input.savedSessionCount != null && input.savedSessionCount < expectedSessionCount) {
      return {
        action: 'update',
        overwriteDetected: false,
        overwriteSource: null,
        finalVerdict: 'MAIN_TARGET_LOST_DURING_SAVE',
        failedStage: 'save',
        expectedSessionCount,
        resolvedSessionCount,
      }
    }
    return {
      action: 'update',
      overwriteDetected: false,
      overwriteSource: null,
      finalVerdict: null,
      failedStage: null,
      expectedSessionCount,
      resolvedSessionCount,
    }
  }

  return {
    action: 'update',
    overwriteDetected: false,
    overwriteSource: null,
    finalVerdict: expectedSessionCount === 6
      ? 'MAIN_FULL_SUCCESS_6'
      : 'MAIN_FULL_SUCCESS_MATCHED_EXPECTED',
    failedStage: null,
    expectedSessionCount,
    resolvedSessionCount,
  }
}
