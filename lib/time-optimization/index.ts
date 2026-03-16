// Time Optimization Module
// Export all time optimization utilities

export {
  // Types
  type TimeTier,
  type ExercisePriority,
  type TimeOptimizationRequest,
  type OptimizedSession,
  type ExerciseWithPriority,
  type TimePattern,
  type TimePreferenceHistory,
  
  // Constants
  TIME_TIERS,
  TIME_TIER_LABELS,
  TIME_TIER_DESCRIPTIONS,
  
  // Core functions
  optimizeSessionForTime,
  classifyExercisePriority,
  estimateExerciseTime,
  
  // Time tracking
  saveTimePattern,
  getTimePreferenceHistory,
  getSuggestedSessionLength,
} from './workout-time-optimizer'
