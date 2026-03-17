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
  type MovementBiasContext,
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
  refineStyleRulesWithEnvelope,
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

// Skill Fatigue & Volume Governor
export {
  SkillVolumeGovernor,
  analyzeSessionStress,
  calculateExerciseStress,
  calculateWeeklyStress,
  wouldExceedWeeklyLimits,
  applyGovernorRecommendations,
  getFrameworkAdjustedThresholds,
  getStressBasedWarmupNeeds,
  generateGovernorCoachingMessage,
  BASE_STRESS_BY_FAMILY,
  WEEKLY_STRESS_THRESHOLDS,
  HIGH_RISK_SKILL_NODES,
  UNSAFE_STRUCTURE_COMBINATIONS,
  type SkillStress,
  type SkillStressFocus,
  type JointStressFocus,
  type TendonStressLevel,
  type FatigueRiskLevel,
  type SessionStressAnalysis,
  type WeeklyStressAccumulation,
  type GovernorRecommendation,
  type GovernorRecommendationType,
  type ExerciseStressProfile,
  type GovernorSessionInput,
  type PlannedExercise,
  type EnvelopeLimits,
} from '../skill-volume-governor-engine'

// Movement Bias Detection Engine
export {
  detectMovementBias,
  applyBiasToVolume,
  getBiasProgressionModifier,
  adjustFrameworkForBias,
  generateBiasExplanation,
  generateBiasCoachMessage,
  checkBiasReEvaluation,
  BIAS_THRESHOLDS,
  type BiasType,
  type BiasPattern,
  type BiasSeverity,
  type MovementBias,
  type BiasAdjustment,
  type BenchmarkInput,
  type SkillStateInput,
  type BiasDetectionInput,
  type BiasAdjustedVolume,
  type BiasExplanation,
  type ReEvaluationTrigger,
} from '../movement-bias-detection-engine'

// Cool-Down + Recovery Intelligence Engine
export {
  analyzeSessionForRecovery,
  selectRecoveryExercises,
  generateIntelligentCooldown,
  generateCompressedCooldown,
  getRecoveryKnowledgeBubble,
  generateCooldownExplanation,
  createCooldownLogEntry,
  RECOVERY_EXERCISE_DATABASE,
  type RecoveryRecommendationType,
  type TargetRegion,
  type RecoveryPriority,
  type RecoveryRecommendation,
  type RecoveryExercise,
  type IntelligentCoolDown,
  type RecoveryExerciseWithRationale,
  type CoolDownGenerationInput,
  type CompletedExercise,
  type CoolDownLogEntry,
} from '../cooldown-recovery-intelligence-engine'

// Coaching Framework Selection Engine
export {
  COACHING_FRAMEWORKS,
  selectFramework,
  getFrameworkProgrammingParams,
  getPersonalizedFrameworkParams,
  generateFrameworkExplanation,
  getFrameworkCoachingMessage,
  getFrameworkSelectionExplanation,
  getFrameworkDashboardSummary,
  getFrameworkComparison,
  getAllFrameworkIds,
  getFramework,
  recordFrameworkSelection,
  getFrameworkHistory,
  getCurrentFrameworkWeeks,
  type CoachingFrameworkId,
  type CoachingFramework,
  type FrameworkRules,
  type ProgressionMethod,
  type SkillTypeTarget,
  type FrameworkSelectionInput,
  type FrameworkSelectionResult,
  type FrameworkProgrammingParams,
  type PersonalizedFrameworkParams,
  type FrameworkHistory,
} from '../coaching-framework-engine'

// Training Doctrine Registry
export {
  // Types
  type DoctrineCategory,
  type TrainingStyleBias,
  type VolumeProfile,
  type IntensityProfile,
  type SkillFrequencyProfile,
  type ProgressionPhilosophy,
  type MovementBiasTendency,
  type PrimaryFocus,
  type PreferredStructure,
  type AdvancedApplicability,
  type TrainingDoctrine,
  type DoctrineQueryFilters,
  type DoctrineAttributes,
  
  // Registry
  DOCTRINE_REGISTRY,
  getAllDoctrineIds,
  doctrineExists,
  getDoctrineCount,
  
  // Service Functions
  getDoctrineById,
  getDoctrineList,
  getDoctrineAttributes,
  getAllDoctrineAttributes,
  findDoctrines,
  getDoctrinesByCategory,
  getDoctrinesByFocus,
  getDoctrinesByFramework,
  getDoctrineVolumeProfile,
  getDoctrineSkillFrequency,
  getDoctrineMovementBias,
  getDoctrineSafetyNotes,
  getDoctrineKeyPrinciples,
  isDoctrineCompatibleWithFramework,
  findBestDoctrineMatch,
  getDoctrineRecommendations,
} from '../training-doctrine-registry'

// Doctrine → Engine Integration Layer
export {
  // Types
  type InfluenceType,
  type TargetSystem,
  type DoctrineInfluence,
  type AthleteDoctrineContext,
  type DoctrineSelectionResult,
  type FrameworkInfluenceRecommendation,
  type WeakPointInfluenceRecommendation,
  type ProgressionInfluenceRecommendation,
  type ExerciseInfluenceRecommendation,
  type ProgramBuilderInfluenceRecommendation,
  type MovementBiasInfluenceRecommendation,
  type EnvelopeInfluenceRecommendation,
  type DoctrineInfluenceResult,
  
  // Core Functions
  selectDoctrinesForAthlete,
  applyDoctrineInfluence,
  getDoctrineInfluenceForSystem,
  shouldReEvaluateDoctrine,
  
  // Influence Functions
  getFrameworkInfluence,
  getWeakPointInfluence,
  getProgressionInfluence,
  getExerciseInfluence,
  getProgramBuilderInfluence,
  getMovementBiasInfluence,
  getEnvelopeInfluence,
  
  // Constants
  DOCTRINE_STABILITY_PERIOD_DAYS,
  DOCTRINE_REEVAL_TRIGGERS,
} from '../doctrine-integration-layer'

// Skill Readiness Calculator Engine
export {
  // Service Functions
  calculateSkillReadiness,
  calculateAllSkillReadiness,
  analyzeSkillProfile,
  getSkillPrerequisites,
  getSupportedSkills,
  interpretReadinessScore,
  getRecommendedFocus,
  SKILL_PREREQUISITES,
  
  // Engine API
  SkillReadinessEngine,
  quickReadinessCheck,
  getPrimaryLimiter,
  meetsBaselineRequirements,
  getTrainingRecommendations,
  
  // Prerequisite Data
  SKILL_PREREQUISITE_PROFILES,
  getPrerequisiteProfile,
  getAllPrerequisiteProfiles,
  getSkillsByDifficulty,
  getCoachingNotes,
  getInjuryPreventionTips,
  
  // Validation
  validateCalculatorInput,
  
  // Types
  type SkillReadinessInput,
  type SkillReadinessResult,
  type ReadinessClassification,
  type ProgressionStage,
  type LimitingFactorDetail,
  type ComponentBreakdown,
  type SkillPrerequisites as SkillPrerequisitesType,
  type PrerequisiteCategory,
  type PrerequisiteMetric,
  type SkillPrerequisiteProfile,
  type ValidationResult,
  type ValidationError,
  type CalculatorPageConfig,
  type InputFieldConfig,
  type CalculatorState,
  type SkillReadinessAPIRequest,
  type SkillReadinessAPIResponse,
} from '../skill-readiness'

// Program History Versioning
export {
  createProgramVersion as createProgramHistoryVersion,
  createInitialProgramHistoryEntry,
  createProgramVersionOnSettingsChange,
  getFullProgramHistory,
  generateProgramReasonSummary,
  archiveCurrentProgramToHistory,
  buildAthleteInputsSnapshot,
  buildGoalsSnapshot,
  buildProgramStructureSnapshot,
  type ProgramHistoryContext,
  type ProgramVersionResult,
} from '../program-history-versioning'

// Program History Helpers
export {
  startNewProgram,
  getProgramHistoryStats,
  compareProgramVersions,
  getVersionComparisons,
  type ResetReason,
  type ProgramHistoryStats,
  type ProgramComparison,
} from '../program-history-helpers'

// Hybrid Strength Engine (Deadlift / Streetlifting Support)
export {
  buildHybridProgrammingContext,
  checkDeadliftConflict,
  getDeadliftDayExclusions,
  getDeadliftDayReductions,
  recommendDeadliftPlacement,
  checkStreetliftingConflicts,
  generateDeadliftExplanation,
  DEADLIFT_CONFLICT_MAP,
  DEADLIFT_EXERCISE_DEFINITIONS,
  type HybridProgrammingContext,
  type FatigueConflict,
  type DeadliftPlacement,
  type HybridExplanation,
} from '../hybrid-strength-engine'

// Hybrid Strength Integration (Session-level hooks)
export {
  getHybridSessionDecision,
  planHybridWeek,
  filterExercisesForHybridSession,
  getHybridVolumeReduction,
  generateHybridExplanations,
  getHybridContextFromProfile,
  hasHybridFeatures,
  shouldProtectSkillSession,
  getMaxHybridExercisesForSession,
  type HybridSessionDecision,
  type HybridWeeklyPlan,
  type HybridProgramExplanation,
} from '../hybrid-strength-integration'
