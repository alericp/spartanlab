/**
 * Explanation Layer - Public API
 * 
 * This is the canonical entry point for the explanation system.
 * Import from this file when working with program explanations.
 */

// Types
export type {
  ProgramExplanation,
  ProgramReasonCode,
  DayExplanation,
  ExerciseExplanation,
  WeekStructureExplanation,
  ChangeExplanation,
  SummaryExplanation,
} from './types'

export {
  REASON_CODE_LABELS,
  isValidReasonCode,
  getReasonLabel,
  validateExplanation,
} from './types'

// Resolver
export {
  resolveSummaryExplanation,
  resolveWeekStructureExplanation,
  resolveDayExplanation,
  resolveExerciseExplanation,
  resolveChangeExplanation,
  buildProgramExplanation,
  getCompactSummary,
  getCompactDaySummary,
  hasSubstantiveExplanation,
  type ExplanationContext,
} from './explanation-resolver'

// Generator
export {
  createExplanationAccumulator,
  recordReasonCode,
  recordFlexibleScheduleDecision,
  recordProgressionDecision,
  recordFatigueDecision,
  recordDayStress,
  recordExerciseSelection,
  recordFeedbackContext,
  recordPriorProgramComparison,
  finalizeExplanation,
  type ExplanationAccumulator,
} from './explanation-generator'
