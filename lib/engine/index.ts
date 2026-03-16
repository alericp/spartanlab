// Unified Coaching Engine Exports
// Central entry point for the Adaptive Athlete Engine

// Core Engine
export {
  buildUnifiedContext,
  getQuickCoachingSummary,
  shouldRegenerateProgram,
  getTodaySessionAdjustments,
  getSessionProtocols,
  type UnifiedEngineContext,
  type AthleteContext,
  type SkillContext,
  type ReadinessBreakdown,
  type ConstraintContext,
  type EnvelopeContext,
  type FatigueContext,
  type ProtocolContext,
  type ProgramDecision,
  type CoachingSummary,
  type TrainingStyleMode,
  type AdaptationLevel,
  type EngineConfidence,
  type RegenerationReason,
  type SessionAdjustments,
} from '../unified-coaching-engine'

// Program Generation
export {
  generateUnifiedProgram,
  type UnifiedSessionPlan,
  type UnifiedProgramOutput,
  type WeeklyStructure,
  type ProgramBlock,
  type ProgramExercise,
} from '../unified-program-generation'

// Workout Feedback
export {
  processWorkoutFeedback,
  processWorkoutBatch,
  analyzeWorkoutPatterns,
  type WorkoutLogData,
  type ExerciseLogData,
  type SetLogData,
  type WorkoutFeedbackResult,
} from '../workout-feedback-integration'

// Performance Envelopes
export {
  getOrCreateEnvelope,
  getAthleteEnvelopes,
  recordSignal,
  updateEnvelopeFromSignals,
  type PerformanceEnvelope,
  type TrainingResponseSignal,
} from '../performance-envelope-service'

// Skill State
export {
  getAthleteSkillStates,
  getSkillState,
  saveSkillState as updateSkillState,
  recordSkillTraining,
  getSkillStateHistory,
  determineCoachingContext,
  type SkillState,
  type SkillKey,
  type SkillStateInput,
} from '../skill-state-service'

// Constraints
export {
  getConstraintContextForProgram,
  type ProgramConstraintContext,
  type ConstraintCategory,
} from '../constraint-integration'

// Movement Family System
export {
  getExerciseClassification,
  getExercisesByFamily,
  getExercisesByIntent,
  getValidSubstitutions,
} from '../exercise-classification-registry'

export {
  getSmartSubstitutions,
  getBestSubstitution,
  getExercisesForSkillGoal,
  getAccessoriesForSkill,
  prioritizeForSession,
  mapEquipmentArray,
  type SmartSubstitution,
} from '../exercise-family-integration'

export {
  type MovementFamily,
  type TrainingIntent,
  type SkillCarryover,
  type EquipmentTag,
  MOVEMENT_FAMILY_METADATA,
  TRAINING_INTENT_METADATA,
} from '../movement-family-registry'

// Training Style Service
export {
  getTrainingStyleProfile,
  saveTrainingStyleProfile,
  inferStyleFromOnboarding,
  getStyleProgrammingRules,
  getStylePriorities,
  shouldRegenerateForStyleChange,
  getRecommendedSkillExposures,
  getRecommendedStrengthSets,
  getRecommendedAccessoryVolume,
  getRepRangeForStyle,
  getRestPeriodForStyle,
  getAvailableComboMethods,
  getComboBlocksForSkill,
  getStyleEquipmentExercises,
  refineStyleWithEnvelope,
  getStyleCoachingSummary,
  STYLE_MODE_DEFINITIONS,
  type TrainingStyleMode,
  type TrainingStyleProfile,
  type StylePriorities,
  type StyleProgrammingRules,
  type ComboMethod,
  type ComboBlock,
  type StyleEquipmentRecommendation,
} from '../training-style-service'

// Program Version Service
export {
  getActiveProgramVersion,
  getProgramVersionHistory,
  createProgramVersion,
  createInputSnapshot,
  getInputSnapshot,
  checkRegenerationTriggers,
  isSessionLevelChange,
  createInitialProgramVersion,
  regenerateProgramIfNeeded,
  getRegenerationExplanation,
  getVersionChangeMessage,
  compareVersions,
  type ProgramVersion,
  type ProgramVersionStatus,
  type GenerationReason,
  type ProgramSummary,
  type ProgramInputSnapshot,
  type RegenerationTrigger,
} from '../program-version-service'
