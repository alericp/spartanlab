/**
 * Adaptive Program Builder
 * 
 * =============================================================================
 * REGRESSION GUARD: THIS IS THE CANONICAL PROGRAM GENERATOR
 * =============================================================================
 * 
 * DO NOT DRIFT: This is the CANONICAL PROGRAM GENERATOR.
 * All program generation MUST flow through generateAdaptiveProgram().
 * Do NOT create parallel generators or bypass this path.
 * 
 * REGRESSION PREVENTION RULES:
 * 1. All generation MUST use getCanonicalProfile() from canonical-profile-service.ts
 * 2. Generation MUST call validateProfileForGeneration() before proceeding
 * 3. DO NOT add fallback/default data that bypasses canonical profile
 * 4. DO NOT silently succeed when profile validation fails
 * 5. DO NOT read from active program snapshot for generation inputs
 * 
 * GENERATION INTEGRITY CHECKS (enforced in generateAdaptiveProgram):
 * - primaryGoal must exist (throws error if missing)
 * - onboardingComplete must be true (throws error if false)
 * - At least one of: selectedSkills, selectedFlexibility, or selectedStrength must exist
 * - equipmentAvailable must not be empty
 * 
 * These checks ensure we never generate garbage programs from incomplete data.
 * 
 * =============================================================================
 * OBSERVABILITY & DEBUGGING NOTES (TASK 8)
 * =============================================================================
 * 
 * LOG PREFIX: [program-generate]
 * - Use this prefix in Vercel Runtime Logs or browser console to filter generation logs
 * - Stages logged: initializing → profile_validation → structure_selection → 
 *                  session_assembly → validation_complete
 * 
 * ERROR CODES (GenerationErrorCode type):
 * - input_resolution_failed: Inputs couldn't be resolved from form/profile
 * - profile_validation_failed: Profile incomplete or missing required fields
 * - structure_selection_failed: Weekly structure couldn't be determined
 * - session_assembly_failed: Individual sessions couldn't be built
 * - warmup_generation_failed: Warmup exercise selection failed
 * - validation_failed: Post-generation validation failed
 * - snapshot_normalization_failed: Program couldn't be normalized for display
 * - snapshot_save_failed: Program couldn't be saved to storage
 * - unknown_generation_failure: Unclassified error (check stack trace)
 * 
 * WHERE TO FIND LOGS:
 * - Client-side: Browser DevTools Console (filter: "[program-generate]")
 * - Note: This code runs CLIENT-SIDE, not in Vercel serverless functions
 * - For true server-side observability, generation would need to move to an API route
 */

import type { PrimaryGoal, ExperienceLevel, TrainingDays, SessionLength } from './program-service'
import type { EquipmentType } from './adaptive-exercise-pool'
import type { RecoveryLevel } from './recovery-engine'
import type { WeeklyStructure, DayStructure } from './program-structure-engine'
import type { ExerciseSelection, SelectedExercise } from './program-exercise-selector'
import type { WeightedBenchmark, WeightedPRBenchmark } from './prescription-contract'
import type { ProtocolRecommendation } from './protocols/joint-integrity-protocol'
import type { ConstraintResult, ConstraintIntervention } from './constraint-detection-engine'

import { getAthleteProfile } from './data-service'
import { 
  getCanonicalProfile, 
  logCanonicalProfileState, 
  validateProfileForGeneration, 
  getValidatedCanonicalProfile,
  // [profile-completeness] ISSUE E: Engine field consumption verification
  getEngineFieldConsumption,
  verifyEngineFieldWiring,
  getProfileSignature,
  hasLoadableEquipment,
} from './canonical-profile-service'
import { buildGenerationInput, getSystemStateFlags, type GenerationMode, type ProfileSnapshot } from './program-state-contract'
import { normalizeProfile, computeLimiter, dedupeExercises, type NormalizedProfile } from './profile-normalizer'
import { calculateRecoverySignal } from './recovery-engine'
import { getConstraintInsight } from './constraint-engine'
import { getConstraintIntervention } from './constraint-detection-engine'
import { recordConstraintHistory, getLatestConstraint, calculateConstraintImprovement } from './constraint-history-service'
import { getProgramBuilderContext } from './adaptive-athlete-engine'
import { getAthleteCalibration, getProgramCalibrationAdjustments, type AthleteCalibration, type ProgramCalibrationAdjustments } from './athlete-calibration'
import { getOnboardingProfile, type PrimaryTrainingOutcome, type TrainingPathType, type WorkoutDurationPreference, type PrimaryLimitation, type WeakestArea, type JointCaution } from './athlete-profile'
import { detectWeakPoints, getVolumeDistribution, type WeakPointSummary } from './weak-point-detection'
import {
  detectWeakPoints as detectUnifiedWeakPoints,
  type WeakPointAssessment as UnifiedWeakPointAssessment,
  type WeakPointType,
  WEAK_POINT_LABELS,
  getWeakPointAccessories,
  shouldReduceVolumeForWeakPoint,
  getVolumeModifierForWeakPoint,
  detectWeakPointsForProfile,
  type DetectedWeakPoints,
  // TASK 7: Limiter-driven program shaping
  getLimiterDrivenProgramMods,
  logLimiterDrivenMods,
  type LimiterDrivenProgramMods,
} from './weak-point-engine'
import { getUnifiedSkillIntelligence, generateTrainingAdjustments, type UnifiedSkillIntelligence } from './skill-intelligence-layer'
import { getCompressionReadiness, shouldBiasTowardCompression, type CompressionReadinessResult } from './compression-readiness'
import { selectOptimalStructure, getDayExplanation } from './program-structure-engine'
import { selectExercisesForSession, evaluateSessionProgressions, getSmartProgressionExercise } from './program-exercise-selector'
// [exercise-trace] TASK 8: Import comparison utilities for build-to-build traceability
import {
  type ProgramSelectionTrace,
  type SessionSelectionTrace,
  compareExerciseSelectionTraces,
  logExerciseComparison,
} from './engine-quality-contract'
import { evaluateExerciseProgression, type ProgressionDecision as SimpleProgressionDecision } from './progression-decision-engine'
import { generateSessionVariants, type SessionVariant } from './session-compression-engine'
import { analyzeEquipmentProfile, adaptSessionForEquipment, getEquipmentRecommendations, type EquipmentProfile } from './equipment-adaptation-engine'
import { GOAL_LABELS } from './program-service'
import { getQuickFatigueDecision, getEnhancedFatigueDecision, type TrainingDecision, type SessionAdjustments } from './fatigue-decision-engine'
import { getDeloadRecommendation, type FatigueSignalSummary } from './fatigue/deload-system'
import { 
  selectMethodProfiles, 
  getCoachingMessage, 
  getWeeklyEmphasisInsight,
  METHOD_PROFILES,
  SKILL_METHOD_MATRIX,
  type SelectedMethods,
  type MethodProfile,
  type SelectionContext,
  type SkillType,
} from './training-principles-engine'
import { 
  type TrainingMethod, 
  type TrainingBlock,
  type GeneratedFinisher,
  type EnduranceBlockType,
  type FailureBudget,
  type FormattedTrainingBlock,
  selectTrainingMethod,
  getDefaultMethodCompatibility,
  generateTrainingBlock,
  getMethodLabel,
  safeSelectMethod,
  selectEnduranceBlock,
  generateFinisher,
  fitEnduranceToSession,
  adjustBlockForFatigue,
  calculateFailureBudget,
  getDefaultFailureRisk,
  selectMethodWithBudget,
  evaluateSupersetPairing,
  evaluateDropSet,
  formatTrainingBlock,
  TRAINING_METHODS,
  ENDURANCE_BLOCK_TEMPLATES,
} from './training-methods'
import {
  analyzeExerciseProgression,
  getProgressionInsights,
  getReadyToProgress,
  evaluateTrainingBehavior,
  getAdaptiveVolumeModifier,
  getAdaptiveTrainingDays,
  type ProgressionAnalysis,
  type ProgressionInsight,
  type TrainingBehaviorResult,
} from './adaptive-progression-engine'
import { 
  optimizeSessionForTime, 
  saveTimePattern,
  type OptimizedSession,
} from './time-optimization'
import {
  validateExerciseSelection,
  type ExerciseIntelligenceContext,
} from './exercise-intelligence-engine'
import {
  optimizeSessionLoad,
  buildSessionMetadata,
  determineSessionStyle,
  calculateSessionLoad,
  getSessionLoadBudget,
  TARGET_LOAD,
  type SessionLoadSummary,
  type TrainingSessionStyle,
  type ExerciseWithMetadata,
} from './session-load-intelligence'
import {
  analyzeSignalsForAdaptive,
  type AdaptiveSignalFeedback,
} from './override-signal-service'
import {
  buildProgramExplanation,
  type ExplanationContext,
  type SessionContext,
} from './explanation-resolver'
import type { ProgramExplanationMetadata } from './explanation-types'
import {
  getReadinessAssessment,
  getSessionAdjustments,
  getFlexibilityRecoveryStatus,
  getMobilityRecoveryStatus,
  type ReadinessAssessment,
} from './recovery-fatigue-engine'
import {
  computeFatigueStateFromFeedback,
  getVolumeModifierFromFeedback,
  getIntensityModifierFromFeedback,
  type FatigueStateFromFeedback,
} from './session-feedback'
import {
  buildTrainingFeedbackSummary,
  getFlexibleScheduleInput,
  hasEnoughDataForAdaptation,
  type TrainingFeedbackSummary,
  type AdjustmentReasonCode,
} from './training-feedback-loop'
import {
  getConsistencyStatus,
  getComebackWorkoutConfig,
  getConsistencyAdjustments,
  type ConsistencyStatus,
  type ComebackWorkoutConfig,
} from './consistency-momentum-engine'
import {
  getApplicableCoachingPrinciples,
  shouldIncludeRunning,
  shouldIncludeHandstandStrength,
  checkIronCrossReadiness,
  HANDSTAND_TRAINING_CONFIG,
  IRON_CROSS_SAFETY_WARNING,
  getSessionStructure,
  type CoachingPrinciple,
} from './training-session-config'
import {
  getConstraintContextForProgram,
  type ProgramConstraintContext,
  type ConstraintCategory,
} from './constraint-integration'
import {
  getOrCreateEnvelope,
  getAthleteEnvelopes,
  getEnvelopeBasedRecommendations,
  type PerformanceEnvelope,
} from './performance-envelope-service'
import {
  buildUnifiedContext,
  type UnifiedEngineContext,
  type TrainingStyleMode,
} from './unified-coaching-engine'
import {
  generateWeeklySessionIntents,
  detectDuplicateSession,
  generateRepetitionJustifications,
  getExerciseVariants,
  type SessionIntent,
  type RepetitionJustification,
  type SessionSignature,
} from './session-variety-engine'
import {
  buildWorkoutReasoningSummary,
  calculateReadinessFromProfile,
  type WorkoutReasoningSummary,
  type CanonicalReadinessResult,
  type LimitingFactor,
} from './readiness/canonical-readiness-engine'
import {
  analyzeConstraints,
  formatBuilderReasoning,
  type ConstraintAwareInput,
  type ConstraintAnalysis,
  type FormattedBuilderReasoning,
} from './constraint-aware-assembly-engine'
import {
  initializeAdaptiveCycleState,
  type AdaptiveCycleState,
  type CycleBuilderModifications,
  type AdaptiveCyclePhase,
} from './adaptive-training-cycle-engine'
import {
  determineGraphPosition,
  getSkillGraph,
  getGraphNode,
  type SkillGraphId,
  type AthleteGraphPosition,
  type ProgressionNode,
} from './skill-progression-graph-engine'
import {
  generateWhyThisExercise,
  getExercisesForWeakPoint,
  getExercisesForProgressionNode,
  checkContraindications,
  type WhyThisExerciseExplanation,
  type AthleteExerciseContext,
} from './enhanced-exercise-intelligence'
import {
  selectSessionStructure,
  adjustStructureForEnvelope,
  integrateWeakPointIntoStructure,
  checkStructureOveruse,
  type SessionStructure,
  type SessionStructureType,
  type StructureSelectionResult,
} from './session-structure-engine'
import {
  SkillVolumeGovernor,
  type SessionStressAnalysis,
  type GovernorSessionInput,
  type PlannedExercise,
  type SkillStressFocus,
} from './skill-volume-governor-engine'
import {
  validateProgramFromDatabase,
  validateAndLogProgram,
} from './program-validation'
import {
  validateProgramAgainstProfile,
  type ProgramProfileValidationResult,
} from './program-profile-validator'
import {
  verifyExerciseInDatabase,
} from './exercise-database-resolver'
import {
  resolveFlexibleFrequency,
  normalizeScheduleMode,
  getEffectiveFrequency,
  type ScheduleMode,
  type FlexibleWeekStructure,
  type DayStressLevel,
} from './flexible-schedule-engine'
import {
  validateSession,
  validateWarmupForSkill,
} from './session-assembly-validation'
import {
  resolveSessionBudget,
  type SessionBudget,
} from './duration-contract'
import {
  calculateGoalHierarchyWeights,
  calculateSessionDistribution,
  getDurationVolumeConfig,
  rankBottlenecks,
  logEngineDiagnostics,
  // TASK 1: Expanded athlete context for deep planner
  calculateWeightedSkillAllocation,
  calculateIntensityDistribution,
  planFlexibilityInsertions,
  // [advanced-skill-expression] ISSUE A: Advanced skill helpers
  isAdvancedSkill,
  getAdvancedSkillFamily,
  ADVANCED_SKILL_FAMILIES,
  // TASK 4: Weekly progression logic
  getWeeklyProgressionRecommendation,
  determineProgressionPhase,
  // TASK 7: Support work mapping
  mapSupportToGoalsAndLimiters,
  logSupportWorkMapping,
  // TASK 6: Weekly load balancing
  analyzeWeekLoadBalance,
  type GoalHierarchyWeights,
  type SessionDistribution,
  type RankedBottleneck,
  type EngineDiagnostics,
  type ExpandedAthleteContext,
  type WeightedSkillAllocation,
  type WeeklyIntensityDistribution,
  type FlexibilityInsertion,
  // TASK 4: Progression types
  type ProgressionPhase,
  type WeeklyProgressionRecommendation,
  type WeeklyProgressionContext,
  // TASK 7: Support mapping types
  type SupportWorkMapping,
  // TASK 6: Load balancing types
  type DayLoadProfile,
  type WeekLoadBalance,
} from './engine-quality-contract'

// Re-export schedule types for consumers
export type { ScheduleMode, DayStressLevel } from './flexible-schedule-engine'
export type { GenerationMode, ProfileSnapshot } from './program-state-contract'
// [program-profile-validate] Re-export validation types
export type { 
  ProgramProfileValidationResult, 
  ValidationCheck, 
  SkillExpressionCheck,
  ScheduleDurationCheck,
  WeightedPrescriptionCheck,
  DisplayedStateDrift,
  WeeklySkillExposureSummary,
  ValidationSeverity,
  PlannerInputTruth,
  PlannerInputValidation,
  ComprehensiveValidationReport,
  ProfileSummary,
  ProgramSummary,
} from './program-profile-validator'
export { 
  validateProgramAgainstProfile, 
  getValidationSummary,
  validateProgramWithDisplayState,
  checkDisplayedStateDrift,
  getWeeklySkillExposureSummary,
  revalidateExistingProgram,
  getValidationMismatches,
  getUnexpressedSkills,
  isSkillExpressed,
  validatePlannerInputAlignment,
  runComprehensiveValidation,
} from './program-profile-validator'
  
// =============================================================================
// TYPES
// =============================================================================

// Context for explicit dependency passing to session generation (fixes scope bug)
type AdaptiveSessionContext = {
  athleteCalibration: ReturnType<typeof getAthleteCalibration>
  onboardingProfile: ReturnType<typeof getOnboardingProfile>
  recoverySignal: ReturnType<typeof calculateRecoverySignal>
  // WEIGHTED LOAD PR: Pass weighted benchmarks for load prescription
  weightedBenchmarks?: {
    weightedPullUp?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
    weightedDip?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  }
  // SKILL EXPRESSION FIX: Pass selected skills and allocation for session-level expression
  selectedSkills?: string[]
  weightedSkillAllocation?: WeightedSkillAllocation[]
  sessionIndex?: number  // Current session index for rotation logic
  totalSessions?: number // Total sessions this week for allocation math
}

export interface AdaptiveProgramInputs {
  primaryGoal: PrimaryGoal
  secondaryGoal?: PrimaryGoal // TASK 3: Secondary goal from canonical profile
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays | 'flexible'  // Can be numeric or 'flexible'
  sessionLength: SessionLength
  equipment: EquipmentType[]
  todaySessionMinutes?: number // Override for today's available time
  // Flexible scheduling support
  scheduleMode?: ScheduleMode  // 'static' or 'flexible'
  // TASK 7: Pass selected skills for multi-goal generation awareness
  selectedSkills?: string[]
  // STATE CONTRACT: Generation mode for fresh vs regenerate distinction
  regenerationMode?: GenerationMode
  // STATE CONTRACT: Optional reason for regeneration (for logging/debugging)
  regenerationReason?: string
}

export interface AdaptiveSession {
  dayNumber: number
  dayLabel: string
  focus: string
  focusLabel: string
  isPrimary: boolean
  rationale: string
  exercises: AdaptiveExercise[]
  warmup: AdaptiveExercise[]
  cooldown: AdaptiveExercise[]
  estimatedMinutes: number
  variants?: SessionVariant[]
  adaptationNotes?: string[]
  // Training blocks for method-aware display
  trainingBlocks?: TrainingBlock[]
  // Endurance finisher (if applicable)
  finisher?: GeneratedFinisher
  finisherIncluded: boolean
  finisherRationale?: string
  // Joint Integrity Protocol recommendations
  protocols?: ProtocolRecommendation[]
  protocolExplanations?: string[]
  // Time optimization context
  timeOptimization?: {
    wasOptimized: boolean
    originalMinutes: number
    targetMinutes: number
    coachingMessage: string
    removedExercises: string[]
    reducedExercises: string[]
  }
  // Session variety tracking
  sessionIntent?: SessionIntent
  varietyInfo?: {
    exerciseVariant: 'A' | 'B' | 'C'
    supportVariant: 'primary' | 'secondary' | 'tertiary'
    isIntentionalRepetition: boolean
    repetitionReason?: string
  }
  // Weak point-based accessories added to session
  weakPointAccessories?: string[]
  // Session load summary (for UI display)
  loadSummary?: {
    weightedLoad: number
    isOptimal: boolean
    removed: string[]
  }
}

export interface AdaptiveExercise {
  id: string
  name: string
  category: string
  sets: number
  repsOrTime: string
  note?: string
  isOverrideable: boolean
  selectionReason: string
  wasAdapted?: boolean
  // Database enforcement: marks exercise as DB-backed
  source?: 'database'
  // Training method information
  method?: TrainingMethod
  methodLabel?: string
  blockId?: string // Groups exercises in the same block (e.g., superset)
  // Session override tracking (runtime only, not persisted to program)
  originalName?: string // Set when exercise is replaced
  isSkipped?: boolean // Set when exercise is skipped
  isReplaced?: boolean // Set when exercise is replaced
  isProgressionAdjusted?: boolean // Set when progression is changed
  // Performance-based progression decision
  progressionDecision?: {
    decision: SimpleProgressionDecision
    confidence: number
    reason: string
  }
  // WEIGHTED LOAD PR: Prescribed load for weighted exercises
  // Stores actual weight to use based on user's benchmark data
  prescribedLoad?: {
    load: number              // Actual weight to add (e.g., 20 for +20 lbs)
    unit: 'lbs' | 'kg'        // Weight unit
    basis: 'current_benchmark' | 'pr_reference' | 'estimated' | 'no_data'
    confidenceLevel: 'high' | 'moderate' | 'low' | 'none'
    estimated1RM?: number     // Estimated 1RM for reference
    targetReps?: number       // Target reps for this prescription
    intensityBand?: 'strength' | 'support_volume' | 'hypertrophy'
    notes?: string[]          // Context/coaching notes
  }
}

export interface AdaptiveProgram {
  id: string
  createdAt: string
  primaryGoal: PrimaryGoal
  secondaryGoal?: PrimaryGoal // TASK 3: Secondary goal from canonical profile
  goalLabel: string
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  sessionLength: SessionLength
  // TASK E: Session duration mode - 'static' = fixed target, 'adaptive' = engine adapts per day
  sessionDurationMode?: 'static' | 'adaptive'
  // FLEXIBLE SCHEDULING: Preserve user's schedule mode and current week resolution
  scheduleMode?: ScheduleMode
  currentWeekFrequency?: number  // Actual days for this generated week
  recommendedFrequencyRange?: { min: number; max: number }
  flexibleWeekRationale?: string  // Why engine chose this frequency
  dayStressPattern?: DayStressLevel[]  // Stress distribution for the week
  weekNumber?: number  // For tracking week-over-week adaptation
  structure: WeeklyStructure
  sessions: AdaptiveSession[]
  equipmentProfile: EquipmentProfile
  constraintInsight: {
    hasInsight: boolean
    label: string
    focus: string[]
    explanation: string
    // Enhanced constraint detection
    primaryConstraint?: ConstraintCategory
    secondaryConstraint?: ConstraintCategory | null
    strongQualities?: ConstraintCategory[]
    volumeAdjustments?: {
      increasePriority: string[]
      maintainPriority: string[]
      decreasePriority: string[]
    }
  }
  recoveryLevel: RecoveryLevel
  programRationale: string
  // Adaptive Athlete Engine context
  engineContext?: {
    plateauStatus: string
    strengthSupportLevel: string
    fatigueState: string
    recommendations: string[]
  }
  // Fatigue decision for UI
  fatigueDecision?: {
  decision: TrainingDecision
  guidance: string
  needsAttention: boolean
  }
  // Session feedback state (user-reported difficulty/soreness)
  sessionFeedbackState?: {
    fatigueScore: number
    trend: 'improving' | 'stable' | 'worsening'
    needsDeload: boolean
    volumeModifier: number
    intensityModifier: number
    summary: string
    confidence: 'medium' | 'high'
  }
  // Training feedback loop - why the plan adapted based on real workouts
  trainingFeedbackLoop?: {
    adjustmentReasons: AdjustmentReasonCode[]
    adjustmentSummary: string
    recentCompletionRate: number
    difficultyTrend: 'increasing' | 'stable' | 'decreasing'
    fatigueTrend: 'increasing' | 'stable' | 'decreasing'
    adherenceQuality: 'excellent' | 'good' | 'moderate' | 'poor' | 'insufficient_data'
    trustedWorkoutCount: number
    dataConfidence: 'none' | 'low' | 'medium' | 'high'
    progressionSuccessRate: number
    daysSinceLastWorkout: number | null
  }
  // Deload recommendation for UI
  deloadRecommendation?: {
    shouldDeload: boolean
    deloadType: string
  }
  // Session variety tracking
  varietyAnalysis?: {
    sessionIntents: SessionIntent[]
    repetitionJustifications: RepetitionJustification[]
    varietyScore: number // 0-1, higher = more varied
    fatigueLevel: string
    coachingMessage: string
    volumeReductionPercent: number
    recommendedProtocols: string[]
  }
  // TASK 4: Weekly progression context
  weeklyProgressionContext?: {
    phase: ProgressionPhase
    phaseRationale: string
    skillVolumeModifier: number
    strengthVolumeModifier: number
    intensityModifier: number
    shouldProgressSkill: boolean
    shouldProgressStrength: boolean
    guidance: string[]
  }
  // TASK 6: Weekly load balance summary
  weeklyLoadBalance?: {
    totalNeuralLoad: number
    straightArmDays: number
    hasRecoveryDay: boolean
    balanceIssues: string[]
    suggestions: string[]
  }
  // [prescription] ISSUE F: Weighted strength prescription summary
  weightedStrengthPrescription?: {
    hasWeightedData: boolean
    pullUpPrescribed: boolean
    dipPrescribed: boolean
    pullUpLoad?: string  // e.g., "+25 lbs" or "BW"
    dipLoad?: string
    prescriptionMode?: string  // e.g., "strength_primary", "strength_support"
    dataSource: 'current_benchmark' | 'pr_reference' | 'no_data'
    summary: string
  }
  // Athlete calibration context from onboarding
  calibrationContext?: {
  isCalibrated: boolean
  message: string
  notes: string[]
  includesCompressionWork: boolean
  includesEnduranceFinisher: boolean
  includesDensityBlocks?: boolean
  trainingOutcome?: PrimaryTrainingOutcome
  trainingPath?: TrainingPathType
  prioritizesSkills?: boolean
  prioritizesStrength?: boolean
  workoutDuration?: WorkoutDurationPreference
  durationConfig?: DurationConfig
  compressionReadiness?: {
  currentLevel: string
  nextMilestone: string
  readinessScore: number
  limiter: string
  }
  }
  // Training Principles Engine - methodology emphasis
  trainingEmphasis?: {
    primaryMethod: string // publicLabel from MethodProfile
    secondaryMethod?: string
    explanation: string
    coachingTip: string
  }
  // Unified Skill Intelligence Layer - per-skill confidence and weak points
  skillIntelligence?: {
    prioritization: {
      primaryEmphasis: string | null
      secondaryEmphasis: string | null
      exposureOnly: string[]
      shouldAvoid: string[]
    }
    globalLimiters: {
      primaryPattern: string | null
      affectedSkills: string[]
      recommendation: string
    }
    dataQuality: 'insufficient' | 'partial' | 'good' | 'excellent'
    adjustments: Array<{
      type: string
      target: string
      reason: string
      priority: 'high' | 'medium' | 'low'
    }>
  }
  // Adaptive Progression Engine - progression recommendations
  progressionInsights?: ProgressionInsight[]
  exercisesReadyToProgress?: string[]
  // Weak Point Detection - automatic focus area detection
  weakPointDetection?: {
    primaryFocus: string
    primaryFocusLabel: string
    primaryFocusReason: string
    secondaryFocus: string | null
    mobilityEmphasis: string
    volumeModifier: number
    confidenceLevel: string
  }
  // Recovery & Fatigue Engine - readiness assessment
  readinessAssessment?: {
    state: 'ready_to_push' | 'train_normally' | 'keep_controlled' | 'recovery_focused'
    score: number
    coachMessage: string
    shouldProgress: boolean
    shouldDeload: boolean
  }
  // Consistency & Momentum Engine
  consistencyStatus?: {
    state: 'strong' | 'building' | 'rebuilding' | 'starting'
    coachMessage: string
    isComeback: boolean
    volumeModifier: number
    intensityModifier: number
  }
  // Skill Safety Context - iron cross and other advanced skills
  skillSafetyContext?: {
    ironCrossReadiness?: {
      isReady: boolean
      missingRequirements: string[]
      recommendation: string
      safetyWarning?: string
    }
    handstandConfig?: {
      maxBalanceDuration: number
      placementInSession: string
      includeStrengthWork: boolean
    }
    activeCoachingPrinciples?: string[] // Internal principle IDs being applied
  }
  // Running inclusion decision
  runningConfig?: {
    shouldInclude: boolean
    frequency: 'none' | 'occasional' | 'regular' | 'primary'
    rationale: string
  }
  // Adaptive Progression Engine - training behavior analysis
  trainingBehaviorAnalysis?: {
    adaptationNeeded: boolean
    adaptationSummary: string
    coachMessages: string[]
    scheduleAdaptation: 'maintain' | 'reduce' | 'increase'
    recommendedDays: number
    volumeAdjustment: 'reduce' | 'maintain' | 'increase'
    volumeModifier: number
    progressTrend: 'improving' | 'stable' | 'declining'
    trendSummary: string
    dataQuality: 'insufficient' | 'limited' | 'good' | 'excellent'
  }
  // Override Signal Feedback - user override behavior patterns
  overrideSignalFeedback?: {
    hasSignificantPatterns: boolean
    patterns: Array<{
      type: 'frequent_skip' | 'frequent_replace' | 'difficulty_mismatch' | 'equipment_issue'
      exerciseName?: string
      movementCategory?: string
      severity: 'low' | 'moderate' | 'high'
      description: string
      recommendation: string
    }>
    coachRecommendations: string[]
  }
  // Unified Workout Reasoning Summary - explains WHY this workout was generated
  workoutReasoningSummary?: WorkoutReasoningSummary
  // Unified Weak Point Assessment - detailed limiter analysis
  weakPointAssessment?: WeakPointAssessment
  // Constraint-aware assembly analysis - explains all builder decisions
  constraintAnalysis?: ConstraintAnalysis
  // Formatted builder reasoning - coach-style explanations
  builderReasoning?: FormattedBuilderReasoning
  // Adaptive Training Cycle context - current phase and modifications
  cycleContext?: {
    currentPhase: AdaptiveCyclePhase
    phaseName: string
    phaseDescription: string
    volumeModifier: number
    intensityModifier: number
    progressionAggressiveness: 'conservative' | 'moderate' | 'aggressive'
    cycleExplanation: {
      headline: string
      description: string
      rationale: string
      nextSteps: string
    }
  }
  // Skill Progression Graph position - current node in progression graph
  skillGraphPosition?: {
    skillId: string
    currentNodeId: string
    currentNodeName: string
    nextNodeId: string | null
    nextNodeName: string | null
    isBlocked: boolean
    blockingReasons: string[]
    progressPercentage: number
    knowledgeTip: string
  }
  // Exercise intelligence explanations - "why this exercise" for each main movement
exerciseExplanations?: {
  exerciseId: string
  exerciseName: string
  headline: string
  rationale: string
  skillBenefit: string
  coachTip: string
  confidenceLevel: 'high' | 'medium' | 'low'
  }[]
  // Session Structure - EMOM, ladder, pyramid, density block, etc.
  sessionStructure?: {
    structureType: SessionStructureType
    structureName: string
    structureDescription: string
    totalDurationMinutes: number
    cycleCount: number
    densityLevel: 'low' | 'moderate' | 'high' | 'very_high'
    coachingExplanation: string
    adjustments: string[]
  }
  // Skill Volume Governor - stress analysis and recommendations
  volumeGovernor?: {
    totalSessionStress: number
    fatigueRiskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical'
    tendonRiskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme'
    highRiskElements: string[]
    recommendationsApplied: string[]
    coachingExplanation: string
    additionalWarmupNeeded: boolean
    warmupIntensityLevel: 'minimal' | 'moderate' | 'thorough'
  }
  // Hybrid Strength Bias - Phase 2 integration
  hybridStrengthBias?: 'calisthenics_only' | 'weighted_calisthenics' | 'hybrid_light' | 'streetlifting_biased'
  // Hybrid Strength Context - deadlift, barbell work integration
  hybridStrengthContext?: {
    includesDeadlift: boolean
    deadliftFrequency: 'none' | 'once_weekly' | 'twice_weekly'
    deadliftVariant: 'conventional' | 'sumo' | 'trap_bar' | 'romanian'
    deadliftRationale?: string
    barbellIntegrationLevel: 'none' | 'minimal' | 'moderate' | 'significant'
    preservesCalisthenicsRecovery: boolean
    streetliftingOriented: boolean
  }
  // Secondary Emphasis - for hybrid programs
  secondaryEmphasis?: string
  // Canonical Explanation Metadata - grounded explanations for "Why This Workout"
  explanationMetadata?: ProgramExplanationMetadata
  // STATE CONTRACT: Profile snapshot taken at generation time (for debugging and traceability)
  profileSnapshot?: ProfileSnapshot
  // STATE CONTRACT: Generation mode used ('fresh', 'regenerate', or 'continue')
  generationMode?: GenerationMode
  // [program-profile-validate] Validation result from profile-vs-program comparison
  profileValidation?: {
    isValid: boolean
    overallScore: number
    passCount: number
    warningCount: number
    mismatchCount: number
    criticalCount: number
    passed: string[]
    warnings: string[]
    failures: string[]
  }
  // [program-alignment] TASK 5: Profile signature at generation time for drift detection
  profileSignature?: {
    primaryGoal: string | null
    secondaryGoal: string | null
    scheduleMode: string | null
    trainingDaysPerWeek: number | null
    sessionLengthMinutes: number | null
    equipmentHash: string
    hasLoadableEquipment: boolean
    experienceLevel: string | null
    createdAt: string
  }
}

// =============================================================================
// TRAINING OUTCOME STYLE MAPPING
// =============================================================================

interface OutcomeTrainingStyle {
  preferHighReps: boolean        // Favor higher rep ranges (8-15+)
  preferLowReps: boolean         // Favor lower rep ranges (3-6)
  includeDensityBlocks: boolean  // Include timed density/circuit work
  includeEnduranceWork: boolean  // Include conditioning finishers
  skillFocused: boolean          // Prioritize skill progressions
  useWeightedProgressions: boolean // Prefer weighted over bodyweight
  preferDropSets: boolean        // Use mechanical/strength drop sets
  restModifier: number           // Multiplier for rest periods (0.7 = shorter, 1.3 = longer)
  includeRunning: boolean        // Include running/cardio work
  runningFrequency: 'none' | 'occasional' | 'regular' | 'primary'
}

/**
 * Maps the user's primary training outcome to specific training style adjustments.
 * This influences exercise selection, rep ranges, and training block structure.
 */
function getTrainingStyleFromOutcome(outcome: PrimaryTrainingOutcome): OutcomeTrainingStyle {
  switch (outcome) {
    case 'strength':
      // Build raw strength - lower reps, longer rest, weighted work
      return {
        preferHighReps: false,
        preferLowReps: true,
        includeDensityBlocks: false,
        includeEnduranceWork: false,
        skillFocused: false,
        useWeightedProgressions: true,
        preferDropSets: false,
        restModifier: 1.3,
        includeRunning: false,
        runningFrequency: 'none',
      }
    case 'max_reps':
      // Maximize bodyweight reps - density, drop sets, moderate rest
      return {
        preferHighReps: true,
        preferLowReps: false,
        includeDensityBlocks: true,
        includeEnduranceWork: true,
        skillFocused: false,
        useWeightedProgressions: false,
        preferDropSets: true,
        restModifier: 0.85,
        includeRunning: false,
        runningFrequency: 'occasional',
      }
    case 'military':
      // PT test prep - high reps, circuits, conditioning, running
      return {
        preferHighReps: true,
        preferLowReps: false,
        includeDensityBlocks: true,
        includeEnduranceWork: true,
        skillFocused: false,
        useWeightedProgressions: false,
        preferDropSets: true,
        restModifier: 0.7,
        includeRunning: true,
        runningFrequency: 'primary',
      }
case 'skills':
  // Skill progression - skill-focused, moderate intensity, support work
  return {
  preferHighReps: false,
  preferLowReps: false,
  includeDensityBlocks: false,
  includeEnduranceWork: false,
  skillFocused: true,
  useWeightedProgressions: true,
  preferDropSets: false,
  restModifier: 1.2,
  includeRunning: false,
  runningFrequency: 'none',
  }
case 'endurance':
  // Conditioning focus - circuits, density, minimal rest, running
  return {
  preferHighReps: true,
  preferLowReps: false,
  includeDensityBlocks: true,
  includeEnduranceWork: true,
  skillFocused: false,
  useWeightedProgressions: false,
  preferDropSets: true,
  restModifier: 0.6,
  includeRunning: true,
  runningFrequency: 'regular',
  }
case 'general_fitness':
  default:
  // Balanced approach
  return {
  preferHighReps: false,
  preferLowReps: false,
  includeDensityBlocks: true,
  includeEnduranceWork: true,
  skillFocused: false,
  useWeightedProgressions: true,
  preferDropSets: false,
  restModifier: 1.0,
  includeRunning: false,
  runningFrequency: 'occasional',
  }
  }
  }

// =============================================================================
// WORKOUT DURATION CONFIGURATION
// =============================================================================

interface DurationConfig {
  minExercises: number
  maxExercises: number
  includeAccessories: boolean
  useSupersetsOrDensity: boolean
  skillBlockReduction: number  // 0 = full, 0.5 = half, 1 = minimal
  restModifier: number         // Multiplier for rest periods
}

/**
 * Maps workout duration preference to exercise count and structure parameters.
 * This ensures programs fit within the user's available training time.
 */
function getDurationConfig(duration: WorkoutDurationPreference): DurationConfig {
  switch (duration) {
    case 'short':
      // 20-30 minutes: minimal, efficient
      return {
        minExercises: 4,
        maxExercises: 5,
        includeAccessories: false,
        useSupersetsOrDensity: true,
        skillBlockReduction: 0.5,
        restModifier: 0.7,
      }
    case 'medium':
      // 30-45 minutes: balanced
      return {
        minExercises: 5,
        maxExercises: 7,
        includeAccessories: true,
        useSupersetsOrDensity: true,
        skillBlockReduction: 0.25,
        restModifier: 0.85,
      }
    case 'long':
      // 45-60 minutes: full structure
      return {
        minExercises: 6,
        maxExercises: 8,
        includeAccessories: true,
        useSupersetsOrDensity: false,
        skillBlockReduction: 0,
        restModifier: 1.0,
      }
    case 'extended':
      // 60-90 minutes: complete programming
      return {
        minExercises: 7,
        maxExercises: 9,
        includeAccessories: true,
        useSupersetsOrDensity: false,
        skillBlockReduction: 0,
        restModifier: 1.1,
      }
    case 'flexible':
    default:
      // Default to medium-long structure
      return {
        minExercises: 5,
        maxExercises: 7,
        includeAccessories: true,
        useSupersetsOrDensity: false,
        skillBlockReduction: 0.1,
        restModifier: 1.0,
      }
  }
}

// =============================================================================
// MAIN GENERATION FUNCTION
// =============================================================================

// =============================================================================
// ISSUE A & B: Generation Error Classification
// These codes allow precise diagnosis when generation fails
// =============================================================================
export type GenerationErrorCode = 
  | 'input_resolution_failed'
  | 'profile_validation_failed'
  | 'structure_selection_failed'
  | 'session_assembly_failed'
  | 'warmup_generation_failed'
  | 'validation_failed'
  | 'snapshot_normalization_failed'
  | 'snapshot_save_failed'
  | 'unknown_generation_failure'

export class GenerationError extends Error {
  code: GenerationErrorCode
  stage: string
  context?: Record<string, unknown>
  
  constructor(code: GenerationErrorCode, stage: string, message: string, context?: Record<string, unknown>) {
    super(message)
    this.name = 'GenerationError'
    this.code = code
    this.stage = stage
    this.context = context
    // ISSUE A: Structured logging for Vercel function logs
    console.error(`[program-generate] ERROR [${code}] at stage "${stage}": ${message}`, context || {})
  }
}

export function generateAdaptiveProgram(inputs: AdaptiveProgramInputs): AdaptiveProgram {
  // ISSUE A: Track generation stage for precise error diagnosis
  let currentStage = 'initializing'
  
  console.log('[program-generate] Starting adaptive program generation')
  console.log('[program-generate] STAGE: initializing')
  
  // STATE CONTRACT: Get system state flags to determine generation context
  const stateFlags = getSystemStateFlags()
  const generationMode: GenerationMode = inputs.regenerationMode || stateFlags.recommendedMode
  
  console.log('[program-generate] STATE CONTRACT:', {
    hasProfile: stateFlags.hasProfile,
    hasHistory: stateFlags.hasHistory,
    hasProgram: stateFlags.hasProgram,
    profileChanged: stateFlags.profileChanged,
    generationMode,
  })
  
  // TASK 7: Log ALL canonical profile fields consumed by generation
  console.log('[program-generate] Inputs:', {
    primaryGoal: inputs.primaryGoal,
    secondaryGoal: inputs.secondaryGoal || 'none', // TASK 3
    experienceLevel: inputs.experienceLevel,
    trainingDaysPerWeek: inputs.trainingDaysPerWeek,
    sessionLength: inputs.sessionLength,
    equipmentCount: inputs.equipment?.length || 0,
    scheduleMode: inputs.scheduleMode || 'static',
    selectedSkills: inputs.selectedSkills || [],
    generationMode,
  })
  
  const {
    primaryGoal,
    secondaryGoal, // TASK 3: Now destructured for use
    experienceLevel,
    trainingDaysPerWeek,
    sessionLength,
    equipment,
  } = inputs
  
  // Gather context - CANONICAL FIX: Use unified canonical profile
  // CRITICAL: This is the ONLY source of truth for generation
  const canonicalProfile = getCanonicalProfile()
  logCanonicalProfileState('generateAdaptiveProgram called')
  
  // TASK 6: Log schedule/duration truth consumption
  console.log('[program-generate] TASK 6: Schedule/Duration truth consumed:', {
  scheduleMode: canonicalProfile.scheduleMode,
  trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
  sessionDurationMode: canonicalProfile.sessionDurationMode,
  sessionLengthMinutes: canonicalProfile.sessionLengthMinutes,
  })
  
  // [profile-completeness] ISSUE E: Verify engine field wiring before generation
  // This confirms all new profile fields are actually being consumed
  const engineConsumption = getEngineFieldConsumption(canonicalProfile)
  const wiringStatus = verifyEngineFieldWiring(canonicalProfile)
  console.log('[profile-completeness] Planner consuming new field groups:', {
    hasWeightedData: engineConsumption.weightedStrengthInputs.hasWeightedData,
    hasPRData: engineConsumption.weightedStrengthInputs.hasPRData,
    hasSkillHistory: engineConsumption.advancedSkillInputs.hasSkillHistory,
    hasBandLevels: engineConsumption.advancedSkillInputs.hasBandLevels,
    consumedFieldGroups: wiringStatus.consumedFieldGroups,
    isFullyWired: wiringStatus.isFullyWired,
  })
  
  // ISSUE A: Stage tracking for diagnosable failures
  currentStage = 'profile_validation'
  console.log('[program-generate] STAGE: profile_validation')
  
  // TASK 3 & 9: Validate profile before proceeding
  const profileValidation = validateProfileForGeneration(canonicalProfile)
  if (!profileValidation.isValid) {
    throw new GenerationError(
      'profile_validation_failed',
      currentStage,
      `Incomplete profile data: ${profileValidation.missingFields.join(', ')}. Please complete onboarding.`,
      { missingFields: profileValidation.missingFields }
    )
  }
  
  // TASK 2B: Normalize profile for engine consumption
  let normalizedProfile: NormalizedProfile | null = null
  try {
    normalizedProfile = normalizeProfile(canonicalProfile)
    console.log('[program-generate] TASK 2B: Profile normalized successfully')
  } catch (err) {
    console.error('[program-generate] Profile normalization failed:', err)
    // Continue with legacy path if normalization fails
  }
  
  // TASK 4: Compute real limiter from normalized profile
  const computedLimiter = normalizedProfile ? computeLimiter(normalizedProfile) : null
  if (computedLimiter) {
    console.log('[program-generate] TASK 4: Computed limiter:', computedLimiter)
  }
  
  // ENGINE QUALITY: Calculate goal hierarchy weighting for session distribution
  const goalHierarchyWeights = calculateGoalHierarchyWeights(
    primaryGoal,
    secondaryGoal || canonicalProfile.secondaryGoal || null,
    canonicalProfile.trainingPathType || 'hybrid'
  )
  console.log('[program-generate] Goal hierarchy weights:', goalHierarchyWeights)
  
  // ENGINE QUALITY: Rank bottlenecks from profile data
  const rankedBottlenecks = normalizedProfile ? rankBottlenecks(
    primaryGoal,
    secondaryGoal || canonicalProfile.secondaryGoal || null,
    normalizedProfile.strength,
    normalizedProfile.skillProgressions,
    normalizedProfile.equipment,
    normalizedProfile.joints,
    null // recovery level
  ) : []
  if (rankedBottlenecks.length > 0) {
    console.log('[program-generate] Ranked bottlenecks:', rankedBottlenecks.map(b => ({
      type: b.type,
      severity: b.severityScore,
      suggestedFocus: b.suggestedFocus,
    })))
  }
  
  // TASK 7: Get limiter-driven program modifications
  // This shapes the actual program structure based on the detected limiter
  const primaryBottleneck = rankedBottlenecks[0]
  const limiterDrivenMods: LimiterDrivenProgramMods | null = primaryBottleneck
    ? getLimiterDrivenProgramMods(
        primaryBottleneck.type as WeakPointType,
        rankedBottlenecks[1]?.type as WeakPointType || null,
        primaryBottleneck.severityScore
      )
    : null
  
  if (limiterDrivenMods && process.env.NODE_ENV !== 'production') {
    logLimiterDrivenMods(primaryBottleneck.type as WeakPointType, limiterDrivenMods)
  }
  
  // ENGINE QUALITY: Get duration-based volume config
  const durationVolumeConfig = getDurationVolumeConfig(
    typeof sessionLength === 'number' ? sessionLength : parseInt(String(sessionLength)) || 60
  )
  
  const profile = getAthleteProfile() // Legacy fallback
  const recoverySignal = calculateRecoverySignal()
  const constraintInsight = getConstraintInsight()
  const equipmentProfile = analyzeEquipmentProfile(equipment)
  const engineContext = getProgramBuilderContext()
  
  // Get session feedback state for volume/intensity adjustments
  const feedbackState = computeFatigueStateFromFeedback()
  
  // Get enhanced constraint context for program generation
  const constraintContext = getConstraintContextForProgram(primaryGoal)
  
  // Get athlete calibration from onboarding
  const athleteCalibration = getAthleteCalibration()
  const onboardingProfile = getOnboardingProfile() // Legacy fallback for benchmark details
  
  // Resolve athlete ID for optional side effects (constraint history, analytics)
  // This is best-effort - program generation must succeed even without a valid ID
  // NOTE: Uses `profile` already declared above at function start
  const resolvedAthleteId: string | null = profile?.userId || onboardingProfile?.userId || null
  console.log('[program-generate] resolvedAthleteId:', resolvedAthleteId ? 'present' : 'null')
  
  // CANONICAL FIX: Use canonical training style, fallback to onboarding profile
  const trainingOutcome = (canonicalProfile.trainingStyle as PrimaryTrainingOutcome) || onboardingProfile?.primaryTrainingOutcome || 'general_fitness'
  const trainingPath = onboardingProfile?.trainingPathType || 'hybrid'
  const workoutDuration = onboardingProfile?.workoutDurationPreference || 'medium'
  
  // CANONICAL FIX: Log consumed canonical fields for generation
  console.log('[program-generate] Using canonical profile:', {
    primaryGoal: canonicalProfile.primaryGoal,
    secondaryGoal: canonicalProfile.secondaryGoal,
    scheduleMode: canonicalProfile.scheduleMode,
    sessionLength: canonicalProfile.sessionLengthMinutes,
    equipmentCount: canonicalProfile.equipmentAvailable?.length || 0,
    jointCautions: canonicalProfile.jointCautions?.length || 0,
  })
  
  // FLEXIBLE SCHEDULING: Resolve schedule mode and week structure
  const inputScheduleMode = inputs.scheduleMode || normalizeScheduleMode(trainingDaysPerWeek)
  console.log('[schedule-mode] Detected mode:', inputScheduleMode)
  
  // BUILD TRAINING FEEDBACK SUMMARY - canonical source for adaptive decisions
  const trainingFeedback = buildTrainingFeedbackSummary()
  const hasFeedbackData = hasEnoughDataForAdaptation(trainingFeedback)
  console.log('[feedback-loop] Training feedback summary:', {
    trustedWorkouts: trainingFeedback.trustedWorkoutCount,
    completionRate: trainingFeedback.recentCompletionRate.toFixed(2),
    fatigueTrend: trainingFeedback.recentFatigueTrend,
    adjustmentReasons: trainingFeedback.adjustmentReasons,
    hasSufficientData: hasFeedbackData,
  })
  
  // Resolve flexible frequency if applicable
  let flexibleWeekStructure: FlexibleWeekStructure | null = null
  let effectiveTrainingDays: TrainingDays = typeof trainingDaysPerWeek === 'number' 
    ? trainingDaysPerWeek as TrainingDays 
    : 4 // Default fallback
    
  if (inputScheduleMode === 'flexible') {
    flexibleWeekStructure = resolveFlexibleFrequency({
      scheduleMode: 'flexible',
      primaryGoal,
      experienceLevel,
      jointCautions: profile?.jointCautions,
      recoveryProfile: profile?.recoveryProfile,
      trainingStyle: (profile as AthleteProfile & { trainingStyle?: string })?.trainingStyle,
      // Feed real workout data into frequency resolution
      recentWorkoutCount: trainingFeedback.totalSessionsLast7Days,
    })
    
    // Apply feedback-based weekly adaptation if we have enough data
    if (hasFeedbackData && trainingFeedback.totalSessionsLast7Days > 0) {
      const flexInput = getFlexibleScheduleInput(trainingFeedback)
      console.log('[flex-loop] Applying real workout feedback to schedule:', flexInput)
      
      // Conservative adjustment based on recent performance
      let adjustedFrequency = flexibleWeekStructure.currentWeekFrequency
      
      if (flexInput.completionRate < 0.6 && adjustedFrequency > flexibleWeekStructure.recommendedMinDays) {
        // Low completion - consider reducing
        adjustedFrequency = Math.max(flexibleWeekStructure.recommendedMinDays, adjustedFrequency - 1)
        console.log('[flex-loop] Reducing frequency due to low completion:', adjustedFrequency)
      } else if (
        flexInput.completionRate >= 0.95 && 
        flexInput.fatigueTrend !== 'increasing' &&
        flexInput.progressionStable &&
        adjustedFrequency < flexibleWeekStructure.recommendedMaxDays
      ) {
        // Excellent compliance, stable progression - careful expansion
        adjustedFrequency = Math.min(flexibleWeekStructure.recommendedMaxDays, adjustedFrequency + 1)
        console.log('[flex-loop] Expanding frequency due to high compliance:', adjustedFrequency)
      }
      
      flexibleWeekStructure = {
        ...flexibleWeekStructure,
        currentWeekFrequency: adjustedFrequency,
        suggestedNextWeekAdjustment: flexInput.completionRate >= 0.9 && flexInput.fatigueTrend !== 'increasing'
          ? 'maintain' : flexInput.completionRate < 0.6 ? 'decrease' : 'maintain',
        adjustmentReason: trainingFeedback.adjustmentSummary,
      }
    }
    
    effectiveTrainingDays = flexibleWeekStructure.currentWeekFrequency as TrainingDays
    console.log('[flex-frequency] Resolved week:', {
      frequency: effectiveTrainingDays,
      range: `${flexibleWeekStructure.recommendedMinDays}-${flexibleWeekStructure.recommendedMaxDays}`,
      distribution: flexibleWeekStructure.intensityDistribution,
      adjustmentReason: flexibleWeekStructure.adjustmentReason || 'none',
    })
  } else {
    effectiveTrainingDays = getEffectiveFrequency(trainingDaysPerWeek) as TrainingDays
    console.log('[schedule-mode] Static mode, using:', effectiveTrainingDays, 'days')
  }
  
  // ENGINE QUALITY: Calculate session distribution based on goal hierarchy
  const sessionDistribution = calculateSessionDistribution(
    effectiveTrainingDays,
    primaryGoal,
    secondaryGoal || canonicalProfile.secondaryGoal || null,
    canonicalProfile.trainingPathType || 'hybrid'
  )
  console.log('[program-generate] Session distribution:', sessionDistribution)
  
  // ==========================================================================
  // TASK 1-4: EXPANDED ATHLETE CONTEXT FOR DEEP PLANNER CONSUMPTION
  // ==========================================================================
  
  // Build expanded athlete context for weighted allocation
  const expandedContext: ExpandedAthleteContext = {
    primaryGoal,
    secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal || null,
    selectedSkills: canonicalProfile.selectedSkills || inputs.selectedSkills || [],
    goalCategories: canonicalProfile.goalCategories || inputs.goalCategories || [],
    trainingPathType: (canonicalProfile.trainingPathType || 'hybrid') as 'hybrid' | 'skill_progression' | 'strength_endurance' | 'balanced',
    scheduleMode: (canonicalProfile.scheduleMode || 'static') as 'static' | 'flexible',
    trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
    sessionDurationMode: (canonicalProfile.sessionDurationMode || 'static') as 'static' | 'adaptive',
    sessionLengthMinutes: canonicalProfile.sessionLengthMinutes || sessionLength,
    selectedFlexibility: canonicalProfile.selectedFlexibility || inputs.selectedFlexibility || [],
    pullUpMax: canonicalProfile.pullUpMax || null,
    dipMax: canonicalProfile.dipMax || null,
    weightedPullUp: canonicalProfile.weightedPullUpWeight ? { weight: canonicalProfile.weightedPullUpWeight, reps: 1 } : null,
    weightedDip: canonicalProfile.weightedDipWeight ? { weight: canonicalProfile.weightedDipWeight, reps: 1 } : null,
    frontLeverProgression: canonicalProfile.frontLeverProgression || null,
    plancheProgression: canonicalProfile.plancheProgression || null,
    hspuProgression: canonicalProfile.hspuProgression || null,
    jointCautions: canonicalProfile.jointCautions || [],
    recoveryLevel: recoverySignal.level || null,
    experienceLevel: canonicalProfile.experienceLevel || 'intermediate',
  }
  
  // TASK 2: Calculate weighted skill allocation
  const weightedSkillAllocation = calculateWeightedSkillAllocation(
    expandedContext,
    effectiveTrainingDays
  )
  
  // TASK F: Calculate intensity distribution based on recovery and adaptive scheduling
  const intensityDistribution = calculateIntensityDistribution(
    effectiveTrainingDays,
    expandedContext.recoveryLevel,
    expandedContext.sessionDurationMode,
    expandedContext.trainingPathType
  )
  
  // TASK 4: Plan flexibility insertions
  const flexibilityInsertions = planFlexibilityInsertions(
    expandedContext.selectedFlexibility,
    effectiveTrainingDays,
    expandedContext.sessionDurationMode,
    expandedContext.sessionLengthMinutes
  )
  
  // TASK 9: Log expanded planner consumption
  console.log('[program-generate] TASK 1-4: Expanded planner context consumed:', {
    selectedSkillsCount: expandedContext.selectedSkills.length,
    goalCategoriesCount: expandedContext.goalCategories.length,
    trainingPathType: expandedContext.trainingPathType,
    sessionDurationMode: expandedContext.sessionDurationMode,
    flexibilityTargetsCount: expandedContext.selectedFlexibility.length,
    weightedAllocationSummary: weightedSkillAllocation.map(a => `${a.skill}:${Math.round(a.weight * 100)}%`).join(', '),
    intensityPattern: intensityDistribution.suggestedPattern.join('-'),
    flexibilityInsertionsCount: flexibilityInsertions.length,
  })
  
  // Get duration-based configuration for exercise count and structure
  const durationConfig = getDurationConfig(workoutDuration)
  
  // Determine if skills should be prioritized based on training path
  const shouldPrioritizeSkills = trainingPath === 'skill_progression' || 
    (trainingPath === 'hybrid' && trainingOutcome === 'skills')
  const shouldPrioritizeStrength = trainingPath === 'strength_endurance' ||
    trainingOutcome === 'strength' || trainingOutcome === 'max_reps' || trainingOutcome === 'military'
    
  const calibrationAdjustments = getProgramCalibrationAdjustments(
    athleteCalibration,
    onboardingProfile?.primaryGoal || null,
    sessionLength
  )
  
  // Determine training style adjustments based on training outcome
  // This affects rep ranges, rest periods, and exercise selection
  const outcomeTrainingStyle = getTrainingStyleFromOutcome(trainingOutcome)
  
  // Build calibration context for UI display
// Get compression readiness for program generation
  const compressionReadiness = getCompressionReadiness(onboardingProfile, athleteCalibration)
  const biasTowardCompression = shouldBiasTowardCompression(compressionReadiness, primaryGoal)
  
  // Apply training outcome overrides to calibration
  const shouldIncludeEndurance = outcomeTrainingStyle.includeEnduranceWork || 
    calibrationAdjustments.includeEnduranceFinisher
  const shouldIncludeDensity = outcomeTrainingStyle.includeDensityBlocks
  
  // Extract skill calibration insights for programming
  const skillCalibration = athleteCalibration.skillCalibration
  const hasAssistedHolds = !!(
    skillCalibration?.front_lever?.isAssisted || 
    skillCalibration?.planche?.isAssisted ||
    skillCalibration?.hspu?.isAssisted
  )
  const hasHistoricalCeiling = !!(
    skillCalibration?.front_lever?.hasHistoricalCeiling ||
    skillCalibration?.planche?.hasHistoricalCeiling ||
    skillCalibration?.hspu?.hasHistoricalCeiling
  )
  const needsConservativeStart = !!(
    skillCalibration?.front_lever?.useConservativeStart ||
    skillCalibration?.planche?.useConservativeStart ||
    skillCalibration?.hspu?.useConservativeStart
  )
  const needsSupportWork = !!(
    skillCalibration?.front_lever?.needsSupportWork ||
    skillCalibration?.planche?.needsSupportWork ||
    skillCalibration?.hspu?.needsSupportWork
  )
  
  // Build skill calibration notes for program reasoning
  const skillCalibrationNotes: string[] = []
  if (hasAssistedHolds) {
    skillCalibrationNotes.push('Current holds are band-assisted — program includes extra support strength work')
  }
  if (hasHistoricalCeiling) {
    skillCalibrationNotes.push('Prior higher-level experience detected — using reacquisition strategy')
  }
  if (needsConservativeStart) {
    skillCalibrationNotes.push('Conservative progression start for measured re-entry')
  }
  
  const calibrationContext = athleteCalibration.calibrationComplete ? {
  isCalibrated: true,
  message: calibrationAdjustments.calibrationMessage,
  notes: [...calibrationAdjustments.progressionNotes, ...skillCalibrationNotes],
  includesCompressionWork: calibrationAdjustments.includeCompressionWork || biasTowardCompression,
  includesEnduranceFinisher: shouldIncludeEndurance,
  includesDensityBlocks: shouldIncludeDensity,
  trainingOutcome: trainingOutcome,
  trainingPath: trainingPath,
  prioritizesSkills: shouldPrioritizeSkills,
  prioritizesStrength: shouldPrioritizeStrength,
  workoutDuration: workoutDuration,
  durationConfig: durationConfig,
  // Skill calibration flags for exercise selection
  hasAssistedHolds,
  hasHistoricalCeiling,
  needsConservativeStart,
  needsSupportWork,
  skillCalibration: skillCalibration,
  compressionReadiness: {
  currentLevel: compressionReadiness.currentLevelLabel,
  nextMilestone: compressionReadiness.nextMilestoneLabel,
  readinessScore: compressionReadiness.readinessScore,
  limiter: compressionReadiness.primaryLimiter,
  },
  } : {
  isCalibrated: false,
  message: 'Complete onboarding for personalized calibration',
  notes: [],
  includesCompressionWork: false,
  includesEnduranceFinisher: shouldIncludeEndurance,
  includesDensityBlocks: shouldIncludeDensity,
  trainingOutcome: trainingOutcome,
  trainingPath: trainingPath,
  prioritizesSkills: shouldPrioritizeSkills,
  prioritizesStrength: shouldPrioritizeStrength,
  workoutDuration: workoutDuration,
  durationConfig: durationConfig,
  hasAssistedHolds: false,
  hasHistoricalCeiling: false,
  needsConservativeStart: false,
  needsSupportWork: false,
  skillCalibration: null,
  }
  
  // Get fatigue-based training decision (runs client-side only)
  let fatigueDecision: { decision: TrainingDecision; shortGuidance: string; needsAttention: boolean } | null = null
  let deloadRecommendation: {
    shouldDeload: boolean
    deloadType: string
    fatigueLevel: string
    coachingMessage: string
    volumeReductionPercent: number
    recommendedProtocols: string[]
  } | undefined = undefined
  
  if (typeof window !== 'undefined') {
    fatigueDecision = getQuickFatigueDecision()
    
    // Get enhanced decision with joint protocol integration
    const jointCautions = onboardingProfile?.jointCautions || []
    const jointDiscomforts = jointCautions.map(caution => {
      // Map JointCaution to JointDiscomfortFlag
      const cautionMap: Record<string, string> = {
        'shoulders': 'shoulder_instability',
        'elbows': 'elbow_tendon_pain',
        'wrists': 'wrist_irritation',
        'lower_back': 'hip_tightness',
        'knees': 'knee_discomfort',
      }
      return cautionMap[caution] || null
    }).filter(Boolean) as import('./athlete-profile').JointDiscomfortFlag[]
    
    const enhancedDecision = getEnhancedFatigueDecision(jointDiscomforts)
    
    if (enhancedDecision.deloadSystemRecommendation) {
      const rec = enhancedDecision.deloadSystemRecommendation
      deloadRecommendation = {
        shouldDeload: rec.shouldDeload,
        deloadType: rec.deloadType,
        fatigueLevel: rec.fatigueLevel,
        coachingMessage: rec.coachingMessage,
        volumeReductionPercent: rec.adjustments.volumeReductionPercent,
        recommendedProtocols: rec.jointProtocols,
      }
    }
  }
  
  // Weak point detection for automatic focus area identification
  const weakPointSummary = detectWeakPoints()
  const volumeDistribution = getVolumeDistribution(weakPointSummary)
  
  // Get training behavior analysis for adaptive adjustments
  let trainingBehavior: TrainingBehaviorResult | null = null
  let adaptiveVolumeModifier = 1.0
  try {
    if (typeof window !== 'undefined') {
      trainingBehavior = evaluateTrainingBehavior()
      adaptiveVolumeModifier = trainingBehavior.volumeAnalysis.recommendedVolumeModifier
    }
  } catch {
    // Training behavior analysis may fail with no workout logs
  }
  
  // Get unified skill intelligence for program prioritization
  // This aggregates readiness, support strength, tendon adaptation, and calibration
  const skillIntelligence = getUnifiedSkillIntelligence(
    [], // Sessions loaded separately if needed
    [], // Strength records loaded separately
    profile?.bodyweight || null,
    (onboardingProfile?.selectedSkills || []) as Parameters<typeof getUnifiedSkillIntelligence>[3]
  )
  
  // Get training adjustments based on skill intelligence weak points
  const intelligenceAdjustments = generateTrainingAdjustments(skillIntelligence)
  
  // Use skill intelligence to potentially refine emphasis
  // If the primary goal has a critical limiter, consider adjusting approach
  const primarySkillIntel = skillIntelligence.skills[primaryGoal as keyof typeof skillIntelligence.skills]
  const hasSkillLimiter = primarySkillIntel?.weakPoints.hasCriticalLimiter ?? false
  
  // Get tendon adaptation for the primary goal skill (from intelligence or calibration)
  const tendonAdaptationForGoal = primarySkillIntel?.confidence.components.tendonAdaptationScore 
    ? (primarySkillIntel.confidence.components.tendonAdaptationScore >= 75 ? 'high' :
       primarySkillIntel.confidence.components.tendonAdaptationScore >= 55 ? 'moderate_high' :
       primarySkillIntel.confidence.components.tendonAdaptationScore >= 40 ? 'moderate' :
       primarySkillIntel.confidence.components.tendonAdaptationScore >= 25 ? 'low_moderate' : 'low')
    : (athleteCalibration.tendonAdaptation?.[primaryGoal as keyof typeof athleteCalibration.tendonAdaptation] ?? 'low')

  // Select training method profiles via Principles Engine
  // Adjust goal type based on training outcome for non-skill focused users
  const effectiveGoalType = outcomeTrainingStyle.skillFocused 
    ? primaryGoal as SkillType 
    : (trainingOutcome === 'strength' ? 'general_strength' : 
       trainingOutcome === 'max_reps' ? 'work_capacity' :
       trainingOutcome === 'military' ? 'work_capacity' :
       trainingOutcome === 'endurance' ? 'work_capacity' : primaryGoal) as SkillType
  
  const selectionContext: SelectionContext = {
    primaryGoal: effectiveGoalType,
    experienceLevel,
    recoveryCapacity: recoverySignal.level === 'optimal' ? 'moderate' : 
                      recoverySignal.level === 'good' ? 'moderate' :
                      recoverySignal.level === 'suboptimal' ? 'light' : 'minimal',
    sorenessToleranceHigh: false,
    sessionMinutes: typeof sessionLength === 'number' ? sessionLength : 60,
    trainingDaysPerWeek,
    currentFatigueLevel: fatigueDecision?.decision === 'SKIP_TODAY' ? 'high' :
                         fatigueDecision?.decision === 'REDUCE_INTENSITY' ? 'moderate' : 'low',
    recentSorenessLevel: 'mild',
    rangeTrainingMode: profile?.rangeTrainingMode || undefined,
    wantsHypertrophy: trainingOutcome === 'strength' || profile?.goalCategory === 'strength',
    tendonAdaptationLevel: tendonAdaptationForGoal as 'low' | 'low_moderate' | 'moderate' | 'moderate_high' | 'high',
  }
  const selectedMethods = selectMethodProfiles(selectionContext)
  
  // Build training emphasis for UI
  const trainingEmphasis = {
    primaryMethod: selectedMethods.primary.publicLabel,
    secondaryMethod: selectedMethods.secondary?.publicLabel,
    explanation: selectedMethods.explanation,
    coachingTip: getCoachingMessage(selectedMethods),
  }
  
  // TASK 2: Determine if secondary goal is pull or push dominant
  // This influences weekly structure to give credible secondary goal representation
  const isPullSecondary = secondaryGoal === 'front_lever' || secondaryGoal === 'muscle_up'
  const isPushSecondary = secondaryGoal === 'planche' || secondaryGoal === 'handstand_pushup'
  
  console.log('[program-generate] Secondary goal influence:', {
    secondaryGoal,
    isPullSecondary,
    isPushSecondary,
    selectedSkills: canonicalProfile.selectedSkills,
  })
  
  // Select optimal weekly structure - USE effectiveTrainingDays for flexible support
  // TASK 2: Pass secondary goal flags so structure can adapt
  // TASK 3: Pass hybrid path and multi-skill flags for expanded structure awareness
  // ISSUE A: Stage tracking for structure selection
  currentStage = 'structure_selection'
  console.log('[program-generate] STAGE: structure_selection')
  console.log('[program-generate] Selected skills passed to structure:', {
    selectedSkills: expandedContext.selectedSkills,
    secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal || null,
    trainingPathType: expandedContext.trainingPathType,
  })
  
  let structure: WeeklyStructure
  try {
    structure = selectOptimalStructure({
    primaryGoal,
    trainingDays: effectiveTrainingDays,  // Uses resolved flexible frequency
    recoveryLevel: recoverySignal.level,
    constraintType: constraintInsight.hasInsight ? constraintInsight.label : undefined,
    hasSecondaryPull: isPullSecondary,  // TASK 2: Secondary goal influence
    hasSecondaryPush: isPushSecondary,  // TASK 2: Secondary goal influence
    // TASK 3: Hybrid path and multi-skill awareness
    trainingPathType: expandedContext.trainingPathType,
    selectedSkillsCount: expandedContext.selectedSkills.length,
    hasFlexibilityTargets: expandedContext.selectedFlexibility.length > 0,
    // ISSUE A FIX: Pass actual skill identities for smarter structure allocation
    selectedSkills: expandedContext.selectedSkills,
    secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal || null,
  })
  } catch (err) {
    throw new GenerationError(
      'structure_selection_failed',
      currentStage,
      err instanceof Error ? err.message : 'Failed to select weekly structure',
      { primaryGoal, trainingDays: effectiveTrainingDays, scheduleMode: inputScheduleMode }
    )
  }
  
  console.log('[program-generate] Structure selected:', structure.structureName)
  
  // Generate session intents for variety
  const skillType = primaryGoal as 'front_lever' | 'planche' | 'muscle_up' | 'hspu' | 'back_lever' | 'iron_cross' | 'l_sit' | 'weighted_strength' | 'general'
  const trainingStyleMode = (['strength', 'skill', 'endurance', 'mixed'].includes(onboardingProfile?.primaryOutcome || '') 
    ? onboardingProfile?.primaryOutcome 
    : 'mixed') as TrainingStyleMode
  
  const sessionIntents = generateWeeklySessionIntents({
    skill: skillType,
    trainingStyle: trainingStyleMode,
    primaryConstraint: constraintInsight.hasInsight ? constraintInsight.label : null,
    experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
    weeklyDays: effectiveTrainingDays,  // Uses resolved flexible frequency
    existingIntents: [],
  })
  
  // Generate repetition justifications
  const repetitionJustifications = generateRepetitionJustifications(sessionIntents)
  
  // Generate each session with variety info
  // Build context object for session generation (explicit dependency passing)
  
  // WEIGHTED LOAD PR: Extract weighted benchmarks from canonical profile for load prescription
  const weightedBenchmarks: AdaptiveSessionContext['weightedBenchmarks'] = {
    weightedPullUp: canonicalProfile?.weightedPullUp ? {
      current: canonicalProfile.weightedPullUp.addedWeight !== undefined ? {
        addedWeight: canonicalProfile.weightedPullUp.addedWeight,
        reps: canonicalProfile.weightedPullUp.reps,
        unit: canonicalProfile.weightedPullUp.unit,
      } : undefined,
      pr: canonicalProfile?.allTimePRPullUp?.load ? {
        load: canonicalProfile.allTimePRPullUp.load,
        reps: canonicalProfile.allTimePRPullUp.reps || 1,
        unit: canonicalProfile.allTimePRPullUp.unit || 'lbs',
      } : undefined,
    } : undefined,
    weightedDip: canonicalProfile?.weightedDip ? {
      current: canonicalProfile.weightedDip.addedWeight !== undefined ? {
        addedWeight: canonicalProfile.weightedDip.addedWeight,
        reps: canonicalProfile.weightedDip.reps,
        unit: canonicalProfile.weightedDip.unit,
      } : undefined,
      pr: canonicalProfile?.allTimePRDip?.load ? {
        load: canonicalProfile.allTimePRDip.load,
        reps: canonicalProfile.allTimePRDip.reps || 1,
        unit: canonicalProfile.allTimePRDip.unit || 'lbs',
      } : undefined,
    } : undefined,
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WeightedLoad] Extracted benchmarks for session generation:', {
      pullUp: weightedBenchmarks.weightedPullUp,
      dip: weightedBenchmarks.weightedDip,
    })
  }
  
  // SKILL EXPRESSION FIX: Log skill allocation being passed to session construction
  console.log('[skill-expression] Weighted skill allocation for session construction:', {
    allocations: weightedSkillAllocation.map(a => ({
      skill: a.skill,
      weight: Math.round(a.weight * 100) + '%',
      exposureSessions: a.exposureSessions,
      priority: a.priorityLevel,
    })),
    selectedSkills: canonicalProfile.selectedSkills,
    totalSessions: effectiveTrainingDays,
  })
  
  // [advanced-skill-expression] TASK 7: Log advanced skill detection and allocation
  const advancedSkillsSelected = (canonicalProfile.selectedSkills || []).filter(s => isAdvancedSkill(s))
  if (advancedSkillsSelected.length > 0) {
    console.log('[advanced-skill-expression] Advanced skills detected in selection:', {
      advancedSkills: advancedSkillsSelected.map(s => {
        const family = getAdvancedSkillFamily(s)
        return {
          skillId: s,
          displayName: family?.displayName || s,
          category: family?.category,
          minFrequency: family?.minFrequencyPerWeek,
          tendonSensitive: family?.tendonSensitive,
        }
      }),
      totalSelectedSkills: canonicalProfile.selectedSkills?.length || 0,
      advancedSkillCount: advancedSkillsSelected.length,
    })
    
    // Log which advanced skills got how many exposure sessions
    const advancedAllocations = weightedSkillAllocation.filter(a => isAdvancedSkill(a.skill))
    console.log('[advanced-skill-expression] Advanced skill weekly allocations:', {
      allocations: advancedAllocations.map(a => ({
        skill: a.skill,
        displayName: getAdvancedSkillFamily(a.skill)?.displayName || a.skill,
        exposureSessions: a.exposureSessions,
        priority: a.priorityLevel,
        meetsMinFrequency: a.exposureSessions >= (getAdvancedSkillFamily(a.skill)?.minFrequencyPerWeek || 2),
      })),
    })
  }
  
  // ISSUE A: Stage tracking for session assembly
  currentStage = 'session_assembly'
  console.log('[program-generate] STAGE: session_assembly')
  
  // [session-assembly] Log structure received for assembly
  console.log('[session-assembly] Weekly structure received:', {
    structureName: structure.structureName,
    dayCount: structure.days?.length || 0,
    dayRoles: structure.days?.map(d => d.focus) || [],
  })
  
  // [session-assembly] Validate structure before assembly
  if (!structure.days || structure.days.length === 0) {
    throw new GenerationError(
      'session_assembly_failed',
      'session_assembly',
      'Weekly structure has no days defined',
      { structureName: structure.structureName, subCode: 'empty_structure_days' }
    )
  }
  
  let sessions: AdaptiveSession[]
  try {
    sessions = structure.days.map((day, index) => {
    // [session-assembly] Log each day's assembly start
    console.log('[session-assembly] Assembling day:', {
      dayNumber: day.dayNumber,
      focus: day.focus,
      isPrimary: day.isPrimary,
      sessionIndex: index,
    })
    
    const intent = sessionIntents[index]
    
    // SKILL EXPRESSION FIX: Create per-session context with skill allocation
    const sessionContext: AdaptiveSessionContext = {
      athleteCalibration,
      onboardingProfile,
      recoverySignal,
      weightedBenchmarks,
      // Pass skill data for session-level expression
      selectedSkills: canonicalProfile.selectedSkills || [],
      weightedSkillAllocation,
      sessionIndex: index,
      totalSessions: effectiveTrainingDays,
    }
    
    const session = generateAdaptiveSession(
      day,
      primaryGoal,
      experienceLevel,
      equipment,
      sessionLength,
      constraintInsight.hasInsight ? constraintInsight.label : undefined,
      sessionContext
    )
    
    // Attach session intent and variety info
    session.sessionIntent = intent
    
    // Check if this session is an intentional repetition
    const justification = repetitionJustifications.find(
      j => j.dayA === day.dayNumber || j.dayB === day.dayNumber
    )
    
    session.varietyInfo = {
      exerciseVariant: intent?.exerciseVariant || 'A',
      supportVariant: intent?.supportVariant || 'primary',
      isIntentionalRepetition: justification?.isIntentional || false,
      repetitionReason: justification?.coachingNote,
    }
    
    // Add fatigue-based adaptation notes if needed
    if (fatigueDecision && fatigueDecision.decision !== 'TRAIN_AS_PLANNED') {
      const fatigueNote = getFatigueAdaptationNote(fatigueDecision.decision)
      if (fatigueNote) {
        session.adaptationNotes = session.adaptationNotes || []
        session.adaptationNotes.push(fatigueNote)
      }
    }
    
    // Apply session feedback volume modifier if feedback confidence is sufficient
    if (feedbackState.confidence !== 'low' && feedbackState.volumeModifier !== 1.0) {
      session.exercises = applyVolumeModifier(session.exercises, feedbackState.volumeModifier)
      session.adaptationNotes = session.adaptationNotes || []
      // [trust-polish] ISSUE D: Calmer, less mechanical language
      if (feedbackState.needsDeload) {
        session.adaptationNotes.push('Volume adjusted down — focus on recovery this week')
      } else if (feedbackState.volumeModifier < 1.0) {
        session.adaptationNotes.push('Volume adjusted slightly based on your recent workouts')
      } else {
        session.adaptationNotes.push('Volume increased — your recovery is strong')
      }
    }
    
    // =========================================================================
    // WEAK POINT ACCESSORY INJECTION
    // =========================================================================
    // Add targeted accessories based on detected weak points (max 1-2 per session)
    // Only add if session isn't already overloaded
    const sessionExerciseCount = session.exercises.length
    const maxExercisesForSession = sessionLength === '<30' ? 5 : sessionLength === '30-45' ? 6 : 8
    
    // Use rule-based detection with fatigue state
    const fatigueNeedsDeload = fatigueDecision?.decision === 'SKIP_TODAY' || 
                               fatigueDecision?.decision === 'DELOAD_RECOMMENDED'
    const fatigueScoreForDetection = fatigueDecision?.decision === 'SKIP_TODAY' ? 90 :
                                     fatigueDecision?.decision === 'REDUCE_INTENSITY' ? 70 :
                                     fatigueDecision?.decision === 'DELOAD_RECOMMENDED' ? 80 : 40
    
    const detectedWeakPoints = detectWeakPointsForProfile(
      onboardingProfile,
      athleteCalibration,
      fatigueNeedsDeload,
      fatigueScoreForDetection
    )
    
    // Check if fatigue is the primary weak point - skip accessories if so
    const isFatigued = detectedWeakPoints.primary.includes('general_fatigue')
    
    if (!isFatigued && sessionExerciseCount < maxExercisesForSession - 1 && 
        (detectedWeakPoints.primary.length > 0 || detectedWeakPoints.secondary.length > 0)) {
      // Combine primary and secondary weak points, primary first
      const allWeakPoints = [...detectedWeakPoints.primary, ...detectedWeakPoints.secondary]
      
      // Get recommended accessories (max 2)
      const maxAccessories = Math.min(2, maxExercisesForSession - sessionExerciseCount)
      const recommendedAccessories = getWeakPointAccessories(allWeakPoints, maxAccessories)
      
      // Add accessories to session if found
      if (recommendedAccessories.length > 0) {
        session.adaptationNotes = session.adaptationNotes || []
        
        // Build coaching note based on detected weak points
        const primaryLabel = detectedWeakPoints.primary[0] 
          ? WEAK_POINT_LABELS[detectedWeakPoints.primary[0]] 
          : null
        
        if (primaryLabel) {
          session.adaptationNotes.push(
            `Support work added for ${primaryLabel.toLowerCase()}`
          )
        }
        
        // Mark session as having weak-point-based additions
        session.weakPointAccessories = recommendedAccessories
      }
    } else if (isFatigued) {
      // Add note about fatigue-based volume reduction
      session.adaptationNotes = session.adaptationNotes || []
      session.adaptationNotes.push('No additional support work - focus on recovery')
    }
    
    // =========================================================================
    // SESSION LOAD OPTIMIZATION
    // =========================================================================
    // Ensure session is balanced and not bloated using weighted load calculation
    const sessionStyleForLoad = determineSessionStyle(
      session.estimatedMinutes,
      primaryGoal === 'skill' ? 'skill' : 
        primaryGoal === 'strength' ? 'strength' : 'mixed',
      undefined,
      fatigueDecision?.decision === 'REDUCE_INTENSITY' ? 'very_low' : undefined
    )
    
    // Build metadata for load calculation
    const exercisesWithMeta = buildSessionMetadata(
      session.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        neuralDemand: ex.category === 'skill' ? 4 : 3,
        fatigueCost: ex.category === 'skill' ? 3 : ex.category === 'strength' ? 4 : 2,
        movementPattern: undefined,
        isIsometric: ex.repsOrTime?.includes('s') ?? false,
      }))
    )
    
    // Optimize if over budget
    const loadBudget = getSessionLoadBudget(sessionStyleForLoad)
    const currentLoad = calculateSessionLoad(
      exercisesWithMeta.map(e => e.metadata),
      loadBudget
    )
    
    if (!currentLoad.isWithinBudget || currentLoad.weightedExerciseCount > TARGET_LOAD.max) {
      // Run optimization
      const optimized = optimizeSessionLoad(
        exercisesWithMeta,
        sessionStyleForLoad,
        {
          maxRemovals: 2,
          preserveIds: session.exercises
            .filter(e => e.category === 'skill' || e.selectionReason?.includes('primary'))
            .map(e => e.id),
        }
      )
      
      if (optimized.wasModified) {
        // Filter exercises to keep only those that weren't removed
        const keptIds = new Set(optimized.optimizedExercises.map(e => e.exerciseId))
        session.exercises = session.exercises.filter(ex => keptIds.has(ex.id))
        
        // Add adaptation notes
        session.adaptationNotes = session.adaptationNotes || []
        session.adaptationNotes.push(
          `Session balanced: ${optimized.modifications[0] || 'Load optimized for quality'}`
        )
        
        // Store load summary for UI
        session.loadSummary = {
          weightedLoad: optimized.optimizedLoad.weightedExerciseCount,
          isOptimal: optimized.optimizedLoad.isWithinBudget,
          removed: optimized.removed.map(r => r.name),
        }
      }
    }
    
    // [program-build] Validate assembled session before returning
    const exerciseCount = session.exercises?.length || 0
    const warmupCount = session.warmup?.length || 0
    
    console.log('[program-build] Session assembled:', {
      dayNumber: session.dayNumber,
      exerciseCount,
      warmupCount,
      cooldownCount: session.cooldown?.length || 0,
      hasFinisher: !!session.finisher,
      focus: session.focus,
    })
    
    // [program-build] ISSUE D: Validate session has valid exercise structure
    if (exerciseCount === 0) {
      console.error('[program-build] CRITICAL: Session assembled with 0 exercises', {
        dayNumber: session.dayNumber,
        focus: session.focus,
        dayFocus: day.focus,
        primaryGoal,
        equipmentCount: equipment?.length || 0,
      })
      // This will cause save to be blocked later - log for diagnosis
    }
    
    // Validate each exercise has required fields
    for (let i = 0; i < (session.exercises?.length || 0); i++) {
      const ex = session.exercises?.[i]
      if (!ex?.name || typeof ex?.sets !== 'number' || ex.sets <= 0) {
        console.warn('[session-assembly] WARNING: Exercise missing required fields', {
          exerciseIndex: i,
          name: ex?.name,
          sets: ex?.sets,
          dayNumber: session.dayNumber,
        })
      }
    }
    
    return session
  })
  } catch (err) {
    // ISSUE A: If error is already a GenerationError, re-throw as-is
    if (err instanceof GenerationError) throw err
    
    // [session-assembly] Sub-classify assembly failures for better diagnosis
    const errorMessage = err instanceof Error ? err.message : 'Failed to assemble sessions'
    let subCode = 'assembly_unknown_failure'
    
    if (errorMessage.includes('exercise_selection_returned_null')) {
      subCode = 'empty_exercise_pool'
    } else if (errorMessage.includes('warmup') || errorMessage.includes('Warmup')) {
      subCode = 'invalid_warmup_block'
    } else if (errorMessage.includes('cooldown') || errorMessage.includes('Cooldown')) {
      subCode = 'invalid_cooldown_block'
    } else if (errorMessage.includes('main') || errorMessage.includes('exercise')) {
      subCode = 'invalid_main_block'
    } else if (errorMessage.includes('validation')) {
      subCode = 'session_validation_failed'
    }
    
  // [program-rebuild-error] TASK 7: Use searchable prefix for failures
  console.error('[program-rebuild-error] Session assembly failure:', {
    stage: 'session_assembly',
    errorCode: 'session_assembly_failed',
    subCode,
    errorMessage,
    structureName: structure?.structureName,
    dayCount: structure?.days?.length,
    currentStage,
  })
    
    throw new GenerationError(
      'session_assembly_failed',
      currentStage,
      errorMessage,
      { 
        structureName: structure?.structureName, 
        dayCount: structure?.days?.length,
        subCode, // Include sub-classification for diagnosis
      }
    )
  }
  
  console.log('[program-generate] Sessions assembled:', sessions.length)
  
  // [session-assembly] ISSUE D: Final validation of assembled sessions array
  const sessionExerciseCounts = sessions.map(s => s.exercises?.length || 0)
  const emptySessions = sessions.filter(s => !s.exercises || s.exercises.length === 0)
  
  console.log('[session-assembly] Final session validation:', {
    totalSessions: sessions.length,
    expectedSessions: structure.days?.length || 0,
    exerciseCountsPerSession: sessionExerciseCounts,
    emptySessionCount: emptySessions.length,
  })
  
  // [session-assembly] Throw if we have critically empty sessions
  // [program-rebuild-error] TASK 7: Use searchable prefix for failures
  if (emptySessions.length > 0) {
  console.error('[program-rebuild-error] Empty sessions detected:', {
    stage: 'session_assembly',
    errorCode: 'session_assembly_failed',
    subCode: 'empty_final_session_array',
    emptyDays: emptySessions.map(s => s.dayNumber),
  })
  throw new GenerationError(
  'session_assembly_failed',
  'session_assembly',
  `${emptySessions.length} session(s) have no exercises`,
  { subCode: 'empty_final_session_array', emptyDays: emptySessions.map(s => s.dayNumber) }
  )
  }
  
  // [session-assembly] Throw if session count doesn't match structure
  // [program-rebuild-error] TASK 7: Use searchable prefix for failures
  if (sessions.length !== (structure.days?.length || 0)) {
  console.error('[program-rebuild-error] Session count mismatch:', {
    stage: 'session_assembly',
    errorCode: 'session_assembly_failed',
    subCode: 'session_count_mismatch',
    assembled: sessions.length,
    expected: structure.days?.length,
  })
    throw new GenerationError(
      'session_assembly_failed',
      'session_assembly',
      `Session count mismatch: assembled ${sessions.length}, expected ${structure.days?.length}`,
      { subCode: 'session_count_mismatch' }
    )
  }
  
  // Calculate variety score (0-1, higher = more varied)
  const varietyScore = calculateVarietyScore(sessionIntents)
  
  // ==========================================================================
  // TASK 6: WEEKLY LOAD BALANCING ANALYSIS
  // Analyze fatigue distribution across the week
  // ==========================================================================
  const dayLoadProfiles: DayLoadProfile[] = sessions.map((session, index) => {
    const hasSkillWork = session.exercises.some(e => e.category === 'skill')
    const hasHeavyStrength = session.exercises.some(e => 
      e.category === 'strength' && e.name.toLowerCase().includes('weighted')
    )
    const isStraightArmFocused = session.focus?.includes('skill') && 
      ['planche', 'front_lever', 'back_lever'].some(s => primaryGoal.includes(s))
    
    // Determine neural load
    let neuralLoad: 'high' | 'moderate' | 'low' = 'moderate'
    if (hasSkillWork && hasHeavyStrength) {
      neuralLoad = 'high'
    } else if (hasSkillWork || hasHeavyStrength) {
      neuralLoad = session.isPrimary ? 'high' : 'moderate'
    } else if (session.focus === 'support_recovery') {
      neuralLoad = 'low'
    }
    
    // Determine straight-arm stress
    let straightArmStress: 'high' | 'moderate' | 'low' | 'none' = 'none'
    if (isStraightArmFocused) {
      straightArmStress = session.isPrimary ? 'high' : 'moderate'
    }
    
    // Determine focus type
    let focusType: DayLoadProfile['focus'] = 'mixed'
    if (session.focus?.includes('push') && session.focus.includes('skill')) {
      focusType = 'push_skill'
    } else if (session.focus?.includes('pull') && session.focus.includes('skill')) {
      focusType = 'pull_skill'
    } else if (session.focus?.includes('push') && session.focus.includes('strength')) {
      focusType = 'push_strength'
    } else if (session.focus?.includes('pull') && session.focus.includes('strength')) {
      focusType = 'pull_strength'
    } else if (session.focus === 'support_recovery') {
      focusType = 'recovery'
    }
    
    return {
      dayNumber: index + 1,
      neuralLoad,
      straightArmStress,
      muscularFatigue: neuralLoad === 'high' ? 'high' : neuralLoad === 'moderate' ? 'moderate' : 'low',
      focus: focusType,
    }
  })
  
  // Analyze weekly balance
  const weeklyLoadBalance = analyzeWeekLoadBalance(dayLoadProfiles)
  
  // Log balance issues in dev mode
  if (process.env.NODE_ENV !== 'production' && weeklyLoadBalance.balanceIssues.length > 0) {
    console.log('[program-generate] TASK 6: Weekly load balance issues detected:', {
      issues: weeklyLoadBalance.balanceIssues,
      suggestions: weeklyLoadBalance.suggestions,
      straightArmDays: weeklyLoadBalance.straightArmDays,
      hasRecoveryDay: weeklyLoadBalance.hasRecoveryDay,
    })
  }
  
  // Add balance notes to program if issues exist
  if (weeklyLoadBalance.balanceIssues.length > 0) {
    // Mark sessions that could use adjustment
    sessions.forEach((session, index) => {
      if (dayLoadProfiles[index].neuralLoad === 'high' && 
          weeklyLoadBalance.balanceIssues.some(i => i.includes('consecutive'))) {
        session.adaptationNotes = session.adaptationNotes || []
            session.adaptationNotes.push('This session focuses on skill work — prioritize quality and rest')
      }
    })
  }
  
  // Get constraint interventions for primary constraint
  let constraintInterventions: ConstraintIntervention[] = []
  if (constraintInsight.hasInsight && constraintInsight.focus) {
    const intervention = getConstraintIntervention(constraintInsight.focus, 65) // Mid-range severity
    constraintInterventions = [intervention]
  }
  
  // Record constraint detection in history (async, non-blocking, best-effort)
  // Uses resolvedAthleteId - skipped if no valid athlete ID exists
  if (resolvedAthleteId && constraintInsight.hasInsight) {
    console.log('[program-generate] recording constraint history for athlete')
    recordConstraintHistory(
      resolvedAthleteId,
      primaryGoal,
      {
        category: constraintInsight.focus || 'none',
        score: 65,
        indicatorMetrics: [],
        isPrimaryLimiter: true,
      } as any
    ).catch(err => console.error('[program-generate] Failed to record constraint history:', err))
  } else if (!resolvedAthleteId) {
    console.log('[program-generate] skipping constraint history - no athlete ID')
  }
  
  // Fetch constraint improvement history for display (async, best-effort)
  let constraintImprovementData: any = undefined
  if (resolvedAthleteId) {
    calculateConstraintImprovement(resolvedAthleteId, primaryGoal, 6)
      .then(improvements => {
        constraintImprovementData = {
          improvingConstraints: improvements.filter(c => c.trend === 'improving'),
          stableConstraints: improvements.filter(c => c.trend === 'stable'),
        }
      })
      .catch(err => console.error('[program-generate] Failed to fetch constraint improvements:', err))
  } else {
    console.log('[program-generate] skipping constraint improvement lookup - no athlete ID')
  }
  
  // Generate program rationale
  // [advanced-skill-expression] ISSUE F: Pass selected skills for rationale truthfulness
  const programRationale = generateProgramRationale(
    primaryGoal,
    structure,
    constraintInsight,
    recoverySignal.level,
    equipmentProfile,
    canonicalProfile.selectedSkills || []
  )
  
  // DATABASE ENFORCEMENT: Log exercise verification stats
  let totalExercises = 0
  let dbVerifiedExercises = 0
  for (const session of sessions) {
    const exerciseList = session.exercises || []
    for (const ex of exerciseList) {
      totalExercises++
      if (ex.id && verifyExerciseInDatabase(ex.id)) {
        dbVerifiedExercises++
      }
    }
  }
  
  // ISSUE A: Stage tracking for validation complete
  currentStage = 'validation_complete'
  console.log('[program-generate] STAGE: validation_complete')
  console.log('[program-generate] Generation complete:', { 
    sessionCount: sessions.length, 
    primaryGoal,
    totalExercises,
    dbVerifiedExercises,
    dbCoverage: totalExercises > 0 ? `${Math.round((dbVerifiedExercises / totalExercises) * 100)}%` : 'N/A',
    scheduleMode: inputScheduleMode,
    selectedSkillsCount: expandedContext.selectedSkills.length,
  })
  
  // FLEXIBLE SCHEDULING: Use resolved schedule data
  const finalScheduleMode = inputScheduleMode
  const finalFrequencyRange = flexibleWeekStructure 
    ? { min: flexibleWeekStructure.recommendedMinDays, max: flexibleWeekStructure.recommendedMaxDays }
    : { min: effectiveTrainingDays, max: effectiveTrainingDays }
  
  console.log('[week-structure] Final program metadata:', {
    scheduleMode: finalScheduleMode,
    currentWeekFrequency: effectiveTrainingDays,
    range: `${finalFrequencyRange.min}-${finalFrequencyRange.max}`,
    hasFlexibleStructure: !!flexibleWeekStructure,
  })
  
  // ENGINE QUALITY: Log comprehensive diagnostics (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const warmupComponents = sessions.flatMap(s => (s.warmup || []).map(w => w.name))
    const diagnostics: EngineDiagnostics = {
      normalizedInputSummary: {
        primaryGoal,
        secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal || null,
        experienceLevel,
        // REGRESSION GUARD: This || 60 is for diagnostics display only
        sessionDuration: typeof sessionLength === 'number' ? sessionLength : parseInt(String(sessionLength)) || 60,
        scheduleMode: finalScheduleMode,
        strengthBenchmarks: normalizedProfile?.strength || {},
        skillProgressions: normalizedProfile?.skillProgressions || {},
      },
      rankedBottlenecks,
      sessionDistribution,
      durationVolumeConfig,
      warmupComponentsChosen: [...new Set(warmupComponents)],
      warmupDedupeEvents: [], // Logged separately in warmup engine
      goalWeighting: goalHierarchyWeights,
      // TASK 10: Enhanced diagnostics
      topLimiterRanking: rankedBottlenecks.slice(0, 3).map(b => ({
        type: b.type,
        severity: b.severityScore,
        affectsGoals: b.affectsGoals,
      })),
      weeklyLoadBalance: limiterDrivenMods ? {
        totalNeuralLoad: sessions.filter(s => s.isPrimary).length * 3 + sessions.filter(s => !s.isPrimary).length * 2,
        straightArmDays: sessions.filter(s => s.focus?.includes('skill')).length,
        hasRecoveryDay: limiterDrivenMods.suggestRecoveryDay || sessions.some(s => s.focus === 'support_recovery'),
        balanceIssues: limiterDrivenMods.volumeModifier < 1 ? ['Volume reduced for recovery'] : [],
      } : undefined,
      weightedStrengthDecisions: limiterDrivenMods?.prioritizeExerciseTypes.filter(t => t.includes('weighted')).map(t => ({
        exercise: t,
        primaryTarget: primaryGoal,
        included: true,
        rationale: limiterDrivenMods.rationale,
      })),
    }
    logEngineDiagnostics(diagnostics)
  }
  
  return {
    id: `adaptive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    primaryGoal,
    secondaryGoal, // TASK 3: Store canonical secondary goal
    goalLabel: GOAL_LABELS[primaryGoal],
    experienceLevel,
    trainingDaysPerWeek: effectiveTrainingDays,  // Store actual generated days
    sessionLength,
    // TASK 3C: Store training path and selected skills for summary display
    trainingPathType: canonicalProfile.trainingPathType || 'balanced',
    selectedSkills: canonicalProfile.selectedSkills || [],
    goalCategories: canonicalProfile.goalCategories || [],
    // TASK 5: Session duration mode - preserve adaptive time identity
    sessionDurationMode: canonicalProfile.sessionDurationMode || 'static',
    // TASK 1-4: Store expanded planner context for display and traceability
    weightedSkillAllocation: weightedSkillAllocation.map(a => ({
      skill: a.skill,
      weight: a.weight,
      sessions: a.exposureSessions,
      priority: a.priorityLevel,
    })),
    intensityDistribution: {
      highDays: intensityDistribution.highIntensityDays,
      moderateDays: intensityDistribution.moderateIntensityDays,
      lightDays: intensityDistribution.lightIntensityDays,
      pattern: intensityDistribution.suggestedPattern,
      rationale: intensityDistribution.rationale,
    },
    flexibilityInsertions: flexibilityInsertions.map(f => ({
      point: f.insertionPoint,
      targets: f.targetedMuscles,
      frequency: f.frequency,
    })),
    // FLEXIBLE SCHEDULING: Full schedule mode semantics
    scheduleMode: finalScheduleMode,
    currentWeekFrequency: effectiveTrainingDays,
    recommendedFrequencyRange: finalFrequencyRange,
    flexibleWeekRationale: flexibleWeekStructure?.rationale,
    dayStressPattern: flexibleWeekStructure?.dayStressPattern,
    weekNumber: 1,  // First generated week
    structure,
    sessions,
    equipmentProfile,
    constraintInsight: {
      hasInsight: constraintInsight.hasInsight,
      label: constraintInsight.label,
      focus: constraintInsight.focus,
      explanation: constraintContext.explanation || constraintInsight.explanation,
      // Enhanced constraint detection data
      primaryConstraint: constraintContext.primaryConstraint,
      secondaryConstraint: constraintContext.secondaryConstraint,
      strongQualities: constraintContext.strongQualities,
      volumeAdjustments: constraintContext.volumeAdjustments,
    },
    recoveryLevel: recoverySignal.level,
    programRationale,
    engineContext: {
      plateauStatus: engineContext.plateauStatus,
      strengthSupportLevel: engineContext.strengthSupportLevel,
      fatigueState: engineContext.recoveryState,
      recommendations: engineContext.recommendations,
    },
    // Include fatigue decision for UI display
fatigueDecision: fatigueDecision ? {
  decision: fatigueDecision.decision,
  guidance: fatigueDecision.shortGuidance,
  needsAttention: fatigueDecision.needsAttention,
  } : undefined,
  // Session feedback state (user-reported difficulty/soreness)
  sessionFeedbackState: feedbackState.confidence !== 'low' ? {
    fatigueScore: feedbackState.fatigueScore,
    trend: feedbackState.trend,
    needsDeload: feedbackState.needsDeload,
    volumeModifier: feedbackState.volumeModifier,
    intensityModifier: feedbackState.intensityModifier,
    summary: feedbackState.summary,
    confidence: feedbackState.confidence,
  } : undefined,
  // Training feedback loop - actual workout outcomes feeding into adaptation
  trainingFeedbackLoop: hasFeedbackData ? {
    adjustmentReasons: trainingFeedback.adjustmentReasons,
    adjustmentSummary: trainingFeedback.adjustmentSummary,
    recentCompletionRate: trainingFeedback.recentCompletionRate,
    difficultyTrend: trainingFeedback.recentDifficultyTrend,
    fatigueTrend: trainingFeedback.recentFatigueTrend,
    adherenceQuality: trainingFeedback.adherenceQuality,
    trustedWorkoutCount: trainingFeedback.trustedWorkoutCount,
    dataConfidence: trainingFeedback.dataConfidence,
    progressionSuccessRate: trainingFeedback.progressionSuccessRate,
    daysSinceLastWorkout: trainingFeedback.daysSinceLastWorkout,
  } : undefined,
  // Deload recommendation
  deloadRecommendation,
  // Session variety analysis
  varietyAnalysis: {
    sessionIntents,
    repetitionJustifications,
    varietyScore,
  },
  // TASK 4 & 6: Weekly progression and load balancing
  weeklyProgressionContext: (() => {
    try {
      // Determine current phase based on week number
      const weekNumber = 1 // First generated week
      const cycleLength = 4 // Standard 4-week mesocycle
      const phase = determineProgressionPhase(weekNumber, cycleLength, deloadRecommendation?.shouldDeload)
      
      // Build progression context
      const progressionContext: WeeklyProgressionContext = {
        weekNumber,
        totalWeeksInCycle: cycleLength,
        phase,
        primaryGoal,
        experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite',
        recentPerformance: hasFeedbackData ? {
          skillHoldTrend: trainingFeedback.recentFatigueTrend === 'increasing' ? 'declining' : 
            trainingFeedback.progressionSuccessRate > 0.8 ? 'improving' : 'stable',
          strengthTrend: trainingFeedback.progressionSuccessRate > 0.7 ? 'improving' : 'stable',
          completionRate: trainingFeedback.recentCompletionRate * 100,
          avgRPE: 7, // Default RPE estimate
        } : undefined,
      }
      
      const recommendation = getWeeklyProgressionRecommendation(progressionContext)
      
      return {
        phase,
        phaseRationale: recommendation.phaseRationale,
        skillVolumeModifier: recommendation.skillVolumeModifier,
        strengthVolumeModifier: recommendation.strengthVolumeModifier,
        intensityModifier: recommendation.intensityModifier,
        shouldProgressSkill: recommendation.shouldProgressSkill,
        shouldProgressStrength: recommendation.shouldProgressStrength,
        guidance: recommendation.progressionGuidance,
      }
    } catch {
      return undefined
    }
  })(),
  // TASK 6: Weekly load balance summary
  weeklyLoadBalance: weeklyLoadBalance ? {
    totalNeuralLoad: weeklyLoadBalance.totalNeuralLoad,
    straightArmDays: weeklyLoadBalance.straightArmDays,
    hasRecoveryDay: weeklyLoadBalance.hasRecoveryDay,
    balanceIssues: weeklyLoadBalance.balanceIssues.slice(0, 2), // Top 2 issues
    suggestions: weeklyLoadBalance.suggestions.slice(0, 2),
  } : undefined,
  // [prescription] ISSUE F: Weighted strength prescription summary
  weightedStrengthPrescription: (() => {
    const pullUp = weightedBenchmarks.weightedPullUp
    const dip = weightedBenchmarks.weightedDip
    const hasPullUpData = !!(pullUp?.current?.addedWeight || pullUp?.pr?.load)
    const hasDipData = !!(dip?.current?.addedWeight || dip?.pr?.load)
    const hasAnyData = hasPullUpData || hasDipData
    
    // Determine data source based on what's available
    const dataSource: 'current_benchmark' | 'pr_reference' | 'no_data' = 
      pullUp?.current?.addedWeight || dip?.current?.addedWeight ? 'current_benchmark' :
      pullUp?.pr?.load || dip?.pr?.load ? 'pr_reference' : 'no_data'
    
    // Build summary string
    const summaryParts: string[] = []
    if (hasPullUpData) {
      const load = pullUp?.current?.addedWeight ?? 
        (pullUp?.pr?.load ? Math.round(pullUp.pr.load * 0.7) : 0)
      const unit = pullUp?.current?.unit || pullUp?.pr?.unit || 'lbs'
      summaryParts.push(`Weighted pull-up: +${load}${unit}`)
    }
    if (hasDipData) {
      const load = dip?.current?.addedWeight ?? 
        (dip?.pr?.load ? Math.round(dip.pr.load * 0.7) : 0)
      const unit = dip?.current?.unit || dip?.pr?.unit || 'lbs'
      summaryParts.push(`Weighted dip: +${load}${unit}`)
    }
    
    console.log('[prescription] Weighted strength summary for program:', {
      hasWeightedData: hasAnyData,
      dataSource,
      pullUpPrescribed: hasPullUpData,
      dipPrescribed: hasDipData,
    })
    
    return hasAnyData ? {
      hasWeightedData: hasAnyData,
      pullUpPrescribed: hasPullUpData,
      dipPrescribed: hasDipData,
      pullUpLoad: hasPullUpData ? 
        `+${pullUp?.current?.addedWeight ?? Math.round((pullUp?.pr?.load ?? 0) * 0.7)} ${pullUp?.current?.unit || pullUp?.pr?.unit || 'lbs'}` : undefined,
      dipLoad: hasDipData ?
        `+${dip?.current?.addedWeight ?? Math.round((dip?.pr?.load ?? 0) * 0.7)} ${dip?.current?.unit || dip?.pr?.unit || 'lbs'}` : undefined,
      dataSource,
      summary: summaryParts.length > 0 ? summaryParts.join('; ') : 'No weighted benchmark data',
    } : undefined
  })(),
  // Constraint improvement tracking (populated async - may be undefined initially)
  constraintImprovementData,
    // Training Principles Engine emphasis
    trainingEmphasis,
    // Unified Skill Intelligence Layer
    skillIntelligence: {
      prioritization: skillIntelligence.prioritization,
      globalLimiters: skillIntelligence.globalLimiters,
      dataQuality: skillIntelligence.dataQuality,
      adjustments: intelligenceAdjustments.slice(0, 3), // Top 3 adjustments
    },
    // Adaptive Progression Engine insights
    progressionInsights: getProgressionInsights(),
    exercisesReadyToProgress: getReadyToProgress().map(p => p.exerciseName),
    // Recovery & Fatigue Engine assessment
    readinessAssessment: (() => {
      try {
        const assessment = getReadinessAssessment()
        return {
          state: assessment.state,
          score: assessment.score,
          coachMessage: assessment.coachMessage,
          shouldProgress: assessment.shouldProgress,
          shouldDeload: assessment.shouldDeload,
        }
      } catch {
        return undefined
      }
    })(),
    // Consistency & Momentum Engine status
    consistencyStatus: (() => {
      try {
        const consistency = getConsistencyStatus()
        return {
          state: consistency.state,
          coachMessage: consistency.coachMessage,
          isComeback: consistency.comebackConfig.isComeback,
          volumeModifier: consistency.adjustment.volumeModifier,
          intensityModifier: consistency.adjustment.intensityModifier,
        }
      } catch {
        return undefined
      }
    })(),
    // Weak Point Detection - automatic focus identification
    weakPointDetection: weakPointSummary.confidenceLevel !== 'low' ? {
      primaryFocus: weakPointSummary.primaryFocus,
      primaryFocusLabel: weakPointSummary.primaryFocusLabel,
      primaryFocusReason: weakPointSummary.primaryFocusReason,
      secondaryFocus: weakPointSummary.secondaryFocusLabel,
      mobilityEmphasis: weakPointSummary.mobilityEmphasis,
      volumeModifier: weakPointSummary.volumeModifier,
      confidenceLevel: weakPointSummary.confidenceLevel,
    } : undefined,
    // Adaptive Progression Engine - training behavior analysis
    // ISSUE C FIX: Reconcile coaching messages with actual generated program session count
    trainingBehaviorAnalysis: trainingBehavior ? (() => {
      const actualSessionCount = sessions.length
      const recommendedDays = trainingBehavior.scheduleAnalysis.recommendedDays
      
      // Filter out schedule-related coaching messages that contradict the actual program
      // Only show schedule messages if they match the actual program or are clearly labeled as history
      let reconciledMessages = trainingBehavior.coachMessages.filter(msg => {
        // Filter out messages that mention a different session count than what was generated
        const mentionsDifferentCount = (
          msg.includes('resolves to') && 
          !msg.includes(`${actualSessionCount} session`) &&
          (msg.includes('2 session') || msg.includes('3 session') || msg.includes('4 session') || msg.includes('5 session'))
        )
        
        if (mentionsDifferentCount) {
          console.log('[program-generate] ISSUE C: Filtering contradictory coaching message:', {
            message: msg,
            actualSessionCount,
            recommendedDays,
          })
          return false
        }
        return true
      })
      
      // If schedule adaptation was triggered but actual program has different session count,
      // adjust the adaptation status to not show misleading "reduce" recommendation
      const scheduleAdaptation = recommendedDays !== actualSessionCount && 
        trainingBehavior.scheduleAnalysis.adaptation !== 'maintain'
        ? 'maintain' // Override to maintain if we're not following the recommendation
        : trainingBehavior.scheduleAnalysis.adaptation
      
      // Add clarifying message if we have sufficient history but generated different from recommendation
      if (trainingBehavior.scheduleAnalysis.historyConfidence === 'sufficient' && 
          recommendedDays !== actualSessionCount &&
          trainingBehavior.scheduleAnalysis.wordingSource === 'observed_history') {
        reconciledMessages = reconciledMessages.filter(m => !m.includes('Based on your recent'))
        reconciledMessages.push(`Your ${actualSessionCount}-session week is built to match your current program structure.`)
      }
      
      console.log('[program-generate] ISSUE C: Reconciled coaching messages:', {
        actualSessionCount,
        recommendedDays,
        originalMessageCount: trainingBehavior.coachMessages.length,
        reconciledMessageCount: reconciledMessages.length,
        scheduleAdaptation,
      })
      
      return {
        adaptationNeeded: trainingBehavior.adaptationNeeded,
        adaptationSummary: trainingBehavior.adaptationSummary,
        coachMessages: reconciledMessages,
        scheduleAdaptation,
        recommendedDays: actualSessionCount, // Use actual session count, not historical recommendation
        volumeAdjustment: trainingBehavior.volumeAnalysis.volumeAdjustment,
        volumeModifier: trainingBehavior.volumeAnalysis.recommendedVolumeModifier,
        progressTrend: trainingBehavior.progressTrend.overallTrend,
        trendSummary: trainingBehavior.progressTrend.trendSummary,
        dataQuality: trainingBehavior.dataQuality,
      }
    })() : undefined,
    // Override Signal Feedback - patterns from user exercise overrides
    overrideSignalFeedback: getOverrideSignalFeedback(),
    // Constraint Detection - AI engine identifying limiting factors
    constraintDetection: {
      primaryConstraint: constraintInsight.hasInsight ? {
        category: constraintInsight.focus || 'none',
        score: 65,
        indicatorMetrics: [],
        isPrimaryLimiter: true,
      } : null,
      secondaryConstraints: [],
      interventions: constraintInterventions,
      coachingNote: constraintInsight.hasInsight
        ? `${constraintInsight.label} is currently limiting your ${GOAL_LABELS[primaryGoal]} progress. SpartanLab is adjusting your program to prioritize this area.`
        : 'No significant constraints detected. Continue your current approach.',
    },
    // Constraint Improvement Tracking - showing progress over time
    constraintImprovement: constraintImprovementData || undefined,
    // Unified Workout Reasoning Summary - explains WHY this workout was generated
    workoutReasoningSummary: (() => {
      try {
        // Calculate skill readiness for primary goal
        const skillType = primaryGoal === 'front_lever' ? 'front_lever'
          : primaryGoal === 'planche' ? 'planche'
          : primaryGoal === 'muscle_up' ? 'muscle_up'
          : primaryGoal === 'hspu' ? 'hspu'
          : primaryGoal === 'back_lever' ? 'back_lever'
          : primaryGoal === 'l_sit' ? 'l_sit'
          : null

        let readinessResult: CanonicalReadinessResult | null = null
        if (skillType && profile) {
          readinessResult = calculateReadinessFromProfile(skillType, profile)
        }

        // Determine session type based on goal and calibration
        const sessionType: WorkoutReasoningSummary['sessionType'] = 
          deloadRecommendation?.shouldDeload ? 'deload'
          : fatigueDecision?.decision === 'DELOAD_RECOMMENDED' ? 'recovery'
          : shouldPrioritizeSkills ? 'skill'
          : shouldPrioritizeStrength ? 'strength'
          : 'mixed'

        // Get first session exercises for exercise reasons
        const firstSessionExercises = sessions[0]?.exercises?.slice(0, 5).map(e => ({
          id: e.exercise?.id || '',
          name: e.exercise?.name || '',
        })) || []

        return buildWorkoutReasoningSummary(
          readinessResult,
          constraintInsight.hasInsight ? {
            primaryConstraint: constraintInsight.label,
            secondaryConstraint: constraintContext.secondaryConstraint || null,
            protocolsAdded: deloadRecommendation?.recommendedProtocols || [],
          } : null,
          trainingEmphasis ? {
            frameworkId: trainingEmphasis.primaryMethod,
            frameworkName: trainingEmphasis.primaryMethod,
          } : null,
          skillIntelligence.dataQuality !== 'insufficient' ? {
            confidence: skillIntelligence.dataQuality === 'excellent' ? 0.9
              : skillIntelligence.dataQuality === 'good' ? 0.7
              : 0.4,
            adaptations: intelligenceAdjustments.slice(0, 3).map(a => a.reason),
          } : null,
          sessionType,
          firstSessionExercises
        )
      } catch {
        return undefined
      }
    })(),
    // Unified Weak Point Assessment - detailed limiter analysis
    weakPointAssessment: (() => {
      try {
        // Map primary goal to skill target
        const skillTargetMap: Record<string, SkillTarget> = {
          front_lever: 'front_lever',
          planche: 'planche',
          muscle_up: 'muscle_up',
          hspu: 'hspu',
          back_lever: 'back_lever',
          l_sit: 'l_sit',
          iron_cross: 'iron_cross',
          one_arm_pull_up: 'one_arm_pull_up',
          handstand: 'handstand',
        }
        
        const skillTarget = skillTargetMap[primaryGoal]
        if (!skillTarget || !profile) return undefined
        
        return detectUnifiedWeakPoints(
          skillTarget,
          profile,
          calibration || null,
          null, // SkillState - would need to be passed in
          null  // PerformanceEnvelope - would need to be passed in
        )
      } catch {
        return undefined
      }
    })(),
    // Adaptive Training Cycle context - current phase and modifications
    cycleContext: (() => {
      try {
        // Initialize a cycle state for this athlete (in production, this would be persisted)
        const cycleState = initializeAdaptiveCycleState(
          'current_athlete',
          primaryGoal,
          experienceLevel,
          trainingEmphasis?.primaryMethod,
          trainingEmphasis?.primaryMethod
        )
        
        // Get builder modifications based on cycle state
        const modifications = getCycleBuilderModifications(
          cycleState,
          null // WeakPointAssessment would be passed here
        )
        
        // Generate explanation
        const explanation = generateCycleExplanation(cycleState)
        
        return {
          currentPhase: cycleState.currentPhase,
          phaseName: explanation.headline,
          phaseDescription: explanation.description,
          volumeModifier: modifications.volumeModifier,
          intensityModifier: modifications.intensityModifier,
          progressionAggressiveness: modifications.progressionAggressiveness,
          cycleExplanation: explanation,
        }
      } catch {
        return undefined
      }
    })(),
    // Constraint-Aware Assembly Analysis - explains all constraint decisions
    constraintAnalysis: (() => {
      try {
        // Build constraint input from available data
        const constraintInput: ConstraintAwareInput = {
          targetMinutes: sessionLength === 'short' ? 30 : sessionLength === 'medium' ? 45 : 60,
          preferredMinutes: sessionLength === 'short' ? 30 : sessionLength === 'medium' ? 45 : 60,
          fatigueLevel: fatigueDecision?.overallDecision === 'reduce' ? 'fatigued' : 
                        fatigueDecision?.overallDecision === 'deload' ? 'overtrained' : 'normal',
          straightArmFatigue: fatigueDecision?.straightArmFatigue || 0,
          overallFatigue: fatigueDecision?.overallFatigue || 0,
          fatigueDecision: fatigueDecision || null,
          jointCautions: profile?.jointCautions || [],
          tendonStress: {
            wrist: profile?.jointCautions?.includes('wrist') ? 70 : 30,
            shoulder: profile?.jointCautions?.includes('shoulder') ? 70 : 30,
            elbow: profile?.jointCautions?.includes('elbow') ? 70 : 30,
          },
          activeInjuries: [],
          discomfortFlags: profile?.jointCautions || [],
          primaryLimiter: profile?.weakestArea as LimitingFactor || null,
          secondaryLimiter: null,
          limiterSeverity: profile?.weakestArea ? 60 : 0,
          frameworkId: trainingEmphasis?.primaryMethod || null,
          frameworkRules: trainingEmphasis?.primaryMethod ? {
            volumeMultiplier: 1.0,
            restMultiplier: trainingEmphasis.primaryMethod === 'barseagle_strength' ? 1.5 : 1.0,
            intensityBias: trainingEmphasis.primaryMethod === 'barseagle_strength' ? 'high' : 'moderate',
            preferredDensity: trainingEmphasis.primaryMethod === 'density_endurance' ? 'high' : 'moderate',
          } : null,
          envelopeConfidence: 0.5,
          envelopeLimits: null,
          styleEnabled: false,
          styleRules: null,
          availableEquipment: equipment,
          requiredEquipment: [],
        }
        
        return analyzeConstraints(constraintInput)
      } catch {
        return undefined
      }
    })(),
    // Formatted Builder Reasoning - coach-style explanations
    builderReasoning: (() => {
      try {
        const constraintInput: ConstraintAwareInput = {
          targetMinutes: sessionLength === 'short' ? 30 : sessionLength === 'medium' ? 45 : 60,
          preferredMinutes: sessionLength === 'short' ? 30 : sessionLength === 'medium' ? 45 : 60,
          fatigueLevel: fatigueDecision?.overallDecision === 'reduce' ? 'fatigued' : 
                        fatigueDecision?.overallDecision === 'deload' ? 'overtrained' : 'normal',
          straightArmFatigue: fatigueDecision?.straightArmFatigue || 0,
          overallFatigue: fatigueDecision?.overallFatigue || 0,
          fatigueDecision: fatigueDecision || null,
          jointCautions: profile?.jointCautions || [],
          tendonStress: {
            wrist: profile?.jointCautions?.includes('wrist') ? 70 : 30,
            shoulder: profile?.jointCautions?.includes('shoulder') ? 70 : 30,
            elbow: profile?.jointCautions?.includes('elbow') ? 70 : 30,
          },
          activeInjuries: [],
          discomfortFlags: profile?.jointCautions || [],
          primaryLimiter: profile?.weakestArea as LimitingFactor || null,
          secondaryLimiter: null,
          limiterSeverity: profile?.weakestArea ? 60 : 0,
          frameworkId: trainingEmphasis?.primaryMethod || null,
          frameworkRules: null,
          envelopeConfidence: 0.5,
          envelopeLimits: null,
          styleEnabled: false,
          styleRules: null,
          availableEquipment: equipment,
          requiredEquipment: [],
        }
        
    const analysis = analyzeConstraints(constraintInput)
    return formatBuilderReasoning(analysis, primaryGoal)
    } catch {
    return undefined
    }
    })(),
    // Skill Progression Graph position - current node in progression graph
    skillGraphPosition: (() => {
      try {
        // Map primary goal to skill graph ID
        const skillGraphMap: Record<string, SkillGraphId> = {
          front_lever: 'front_lever',
          planche: 'planche',
          muscle_up: 'muscle_up',
          hspu: 'hspu',
          back_lever: 'back_lever',
          l_sit: 'l_sit',
          v_sit: 'v_sit',
          iron_cross: 'iron_cross',
          handstand: 'handstand',
          one_arm_pull_up: 'one_arm_pull_up',
        }
        
        const skillId = skillGraphMap[primaryGoal]
        if (!skillId || !profile) return undefined
        
        // Build benchmarks from profile
        const benchmarks: Record<string, number> = {
          pull_ups: profile.pullUpMax || 0,
          dips: profile.dipMax || 0,
          weighted_pull: profile.weightedPullUp?.load || 0,
          weighted_dip: profile.weightedDip?.load || 0,
          compression: profile.lSitHold || 0,
          hold_time: 0,
        }
        
        // Get readiness score (use 50 as default if not available)
        const readinessScore = canonicalReadiness?.readinessScore ?? 50
        
        // Determine graph position
        const position = determineGraphPosition(
          skillId,
          benchmarks,
          readinessScore
        )
        
        if (!position) return undefined
        
        return {
          skillId,
          currentNodeId: position.currentNodeId,
          currentNodeName: position.currentNode.displayName,
          nextNodeId: position.nextRecommendedNodeId,
          nextNodeName: position.nextRecommendedNode?.displayName || null,
          isBlocked: position.isBlocked,
          blockingReasons: position.blockingReasons.map(r => r.description),
          progressPercentage: position.currentNodeProgress.percentToNextNode,
  knowledgeTip: position.currentNode.knowledgeBubble.shortTip,
  }
  } catch {
  return undefined
  }
  })(),
    // Exercise intelligence explanations - "why this exercise" for main movements
    exerciseExplanations: (() => {
      try {
        const explanations: WhyThisExerciseExplanation[] = []
        const targetSkill = primaryGoal as SkillTarget
        const primaryLimiter = profile?.weakestArea as string | undefined
        
        // Generate explanations for key exercise types
        const keyExercises = [
          'weighted_pull_up',
          'ring_dip',
          'ring_push_up',
          'l_sit_hold',
          'hanging_leg_raise',
          'scap_pull_up',
          'planche_lean',
          'straight_bar_dip',
        ]
        
        for (const exerciseId of keyExercises) {
          const explanation = generateWhyThisExercise(
            exerciseId,
            targetSkill as any,
            primaryLimiter as any
          )
          if (explanation) {
            explanations.push(explanation)
          }
        }
        
return explanations.length > 0 ? explanations : undefined
  } catch {
  return undefined
  }
  })(),
    // Session Structure - intelligent workout format selection
    sessionStructure: (() => {
      try {
        const availableMinutes = sessionLength === 'short' ? 30 : sessionLength === 'medium' ? 45 : 60
        const trainingStyle = trainingEmphasis?.styleMode || 'skill_focused'
        const frameworkId = trainingEmphasis?.primaryMethod || undefined
        
        // Determine if we should use a structured format
        const shouldUseStructure = 
          availableMinutes <= 30 || // Time-constrained
          trainingStyle === 'endurance_focused' || // Density preference
          (trainingEmphasis?.styleRules?.densityPreference === 'high') // High density preference
        
        if (!shouldUseStructure) {
          return undefined // Use standard structure
        }
        
        const structureInput = {
          availableMinutes,
          trainingStyle: trainingStyle as any,
          frameworkId: frameworkId as any,
          primaryGoal,
          primaryWeakPoint: profile?.weakestArea as any,
          fatigueLevel: fatigueDecision?.overallDecision === 'reduce' ? 'fatigued' : 
                        fatigueDecision?.overallDecision === 'deload' ? 'fatigued' : 'normal',
          experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced',
          preferDensityTraining: trainingEmphasis?.styleRules?.densityPreference === 'high',
          isDeloadWeek: fatigueDecision?.overallDecision === 'deload',
        }
        
        const result = selectSessionStructure(structureInput as any)
        
        // Apply envelope adjustments if needed
        let adjustments: string[] = []
        if (result.selectedStructure.structureType !== 'standard') {
          const envelopeAdjusted = adjustStructureForEnvelope(
            result.selectedStructure,
            {
              straightArmPull: fatigueDecision?.straightArmFatigue ? 100 - fatigueDecision.straightArmFatigue : 70,
              straightArmPush: 70,
              verticalPull: 80,
            }
          )
          adjustments = envelopeAdjusted.adjustments
        }
        
        return {
          structureType: result.selectedStructure.structureType,
          structureName: result.selectedStructure.structureName,
          structureDescription: result.selectedStructure.structureDescription,
          totalDurationMinutes: result.selectedStructure.totalDurationMinutes,
          cycleCount: result.selectedStructure.cycleCount,
          densityLevel: result.selectedStructure.densityLevel,
          coachingExplanation: result.coachingExplanation,
          adjustments,
        }
      } catch {
        return undefined
      }
    })(),
    // Skill Volume Governor - stress analysis and recommendations
    volumeGovernor: (() => {
      try {
        // Build planned exercises from the session
        const plannedExercises: PlannedExercise[] = (exercises?.skills || []).map(ex => ({
          exerciseId: ex.name.toLowerCase().replace(/\s+/g, '_'),
          exerciseName: ex.name,
          sets: ex.sets || 3,
          reps: ex.reps || 5,
          holdSeconds: ex.holdSeconds,
          isWeighted: false,
          tempoControlled: false,
          progressionLevel: 'intermediate' as const,
          movementFamily: (ex.movementFamily || 'vertical_pull') as SkillStressFocus,
          isRingBased: ex.name.toLowerCase().includes('ring'),
          isAdvancedSkillNode: ['planche', 'front lever', 'back lever', 'iron cross', 'maltese']
            .some(skill => ex.name.toLowerCase().includes(skill)),
        }))
        
        // Add strength exercises
        for (const ex of exercises?.strength || []) {
          plannedExercises.push({
            exerciseId: ex.name.toLowerCase().replace(/\s+/g, '_'),
            exerciseName: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || 5,
            isWeighted: ex.name.toLowerCase().includes('weighted'),
            tempoControlled: false,
            progressionLevel: 'intermediate' as const,
            movementFamily: (ex.movementFamily || 'vertical_pull') as SkillStressFocus,
            isRingBased: ex.name.toLowerCase().includes('ring'),
            isAdvancedSkillNode: false,
          })
        }
        
        if (plannedExercises.length === 0) {
          return undefined
        }
        
        const governorInput: GovernorSessionInput = {
          athleteId: 'current',
          plannedExercises,
          sessionStructureType: 'standard',
          sessionDurationMinutes: sessionLength === 'short' ? 30 : sessionLength === 'medium' ? 45 : 60,
          isDeloadWeek: fatigueDecision?.overallDecision === 'deload',
          currentFramework: trainingEmphasis?.primaryMethod,
          trainingStyle: trainingEmphasis?.styleMode,
        }
        
        const analysis = SkillVolumeGovernor.analyzeSessionStress(governorInput)
        const warmupNeeds = SkillVolumeGovernor.getStressBasedWarmupNeeds(analysis)
        
        // Apply recommendations if needed
        const recommendationsApplied: string[] = []
        for (const rec of analysis.governorRecommendations) {
          if (rec.priority === 'critical' || rec.priority === 'high') {
            recommendationsApplied.push(SkillVolumeGovernor.generateGovernorCoachingMessage(rec))
          }
        }
        
        return {
          totalSessionStress: analysis.totalSessionStress,
          fatigueRiskLevel: analysis.fatigueRiskLevel,
          tendonRiskLevel: analysis.tendonRiskLevel,
          highRiskElements: analysis.highRiskElements,
          recommendationsApplied,
          coachingExplanation: analysis.coachingExplanation,
          additionalWarmupNeeded: warmupNeeds.warmupIntensityLevel !== 'minimal',
          warmupIntensityLevel: warmupNeeds.warmupIntensityLevel,
        }
      } catch {
        return undefined
      }
    })(),
    // Canonical Explanation Metadata - grounded explanations for "Why This Workout"
    explanationMetadata: (() => {
      try {
        // Build explanation context from available data
        // TASK 6: Include secondary goal in explanation context
        const explanationContext: ExplanationContext = {
          primaryGoal,
          secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal,  // TASK 6
          goalLabel: GOAL_LABELS[primaryGoal] || primaryGoal,
          secondaryGoalLabel: secondaryGoal ? (GOAL_LABELS[secondaryGoal as PrimaryGoal] || secondaryGoal) : undefined,  // TASK 6
          scheduleMode: inputScheduleMode,
          currentWeekFrequency: effectiveTrainingDays,
          previousWeekFrequency: undefined, // Would come from previous program comparison
          experienceLevel,
          fatigueState: feedbackState.needsDeload ? 'high' : 
                       feedbackState.fatigueScore >= 70 ? 'moderate' : 'low',
          dataConfidence: trainingFeedback.dataConfidence,
          trustedWorkoutCount: trainingFeedback.trustedWorkoutCount,
          adjustmentReasons: trainingFeedback.adjustmentReasons,
          isFirstProgram: trainingFeedback.trustedWorkoutCount === 0,
  limiters: profile?.weakestArea ? [profile.weakestArea] : undefined,
  weakPoints: constraintContext?.weakPoints?.map(wp => wp.type),
  // TASK 6: Pass engine-grounded session distribution for truthful explanation
  sessionDistribution,
  durationLabel: resolveSessionBudget(
    typeof sessionLength === 'number' ? sessionLength : parseInt(String(sessionLength).split('-')[0]) || 45
  ).label,
  }
        
        // Build session contexts from generated sessions
        const sessionContexts: SessionContext[] = sessions.map((session, idx) => ({
          dayNumber: idx + 1,
          sessionTitle: session.dayLabel || `Day ${idx + 1}`,
          primaryIntent: session.focusLabel || session.focus || 'Mixed',
          isLowerFatigue: session.rationale?.toLowerCase().includes('recovery') || 
                         session.rationale?.toLowerCase().includes('lighter'),
          isRecoveryBias: session.focusLabel?.toLowerCase().includes('recovery'),
          exercises: (session.exercises || []).map(ex => ({
            exerciseId: ex.id,
            displayName: ex.name,
            role: ex.category || 'unknown',
            coachingReason: ex.selectionReason,
            movementPattern: undefined, // Would need lookup
            skillTransfer: undefined, // Would need lookup
          })),
        }))
        
        console.log('[explanation] Building explanation metadata for', sessionContexts.length, 'sessions')
        
        return buildProgramExplanation(explanationContext, sessionContexts)
      } catch (err) {
        console.error('[explanation] Failed to build explanation metadata:', err)
        return undefined
      }
    })(),
    // TASK 9: Final engine diagnostics (dev-safe logging)
    engineDiagnostics: (() => {
      // Only log in development
      if (process.env.NODE_ENV === 'production') return undefined
      
      const diagnostics = {
        primaryGoal,
        secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal || 'none',
        sessionDurationBudget: resolveSessionBudget(
          typeof sessionLength === 'number' ? sessionLength : parseInt(String(sessionLength).split('-')[0]) || 45
        ),
        scheduleMode: inputs.scheduleMode || 'static',
        effectiveTrainingDays,
        goalHierarchyWeights,
        sessionDistribution,
        rankedBottlenecks: rankedBottlenecks.map(b => ({ type: b.type, severity: b.severityScore })),
        warmupPatternType: sessions[0]?.warmup?.length > 0 ? 'skill-aware' : 'default',
        weeklySplitTemplate: sessions.map(s => s.focus).join(' / '),
        keyMetricsDetected: {
          pullUpMax: canonicalProfile.pullUpMax,
          dipMax: canonicalProfile.dipMax,
          weightedPullUp: canonicalProfile.weightedPullUp,
          weightedDip: canonicalProfile.weightedDip,
          frontLeverProgression: canonicalProfile.frontLeverProgression,
          plancheProgression: canonicalProfile.plancheProgression,
        },
      }
      
      console.log('[EngineDiagnostics] === GENERATION COMPLETE ===')
      console.log('[EngineDiagnostics]', JSON.stringify(diagnostics, null, 2))
      
      return diagnostics
    })(),
    // STATE CONTRACT: Profile snapshot taken at generation time (for debugging and traceability)
    profileSnapshot: {
      snapshotId: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      primaryGoal: canonicalProfile.primaryGoal,
      secondaryGoal: canonicalProfile.secondaryGoal,
      experienceLevel: canonicalProfile.experienceLevel,
      trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
      sessionLengthMinutes: canonicalProfile.sessionLengthMinutes,
      sessionDurationMode: canonicalProfile.sessionDurationMode,
      scheduleMode: canonicalProfile.scheduleMode,
      equipmentAvailable: canonicalProfile.equipmentAvailable || [],
      jointCautions: canonicalProfile.jointCautions || [],
      selectedSkills: canonicalProfile.selectedSkills || [],
      // TASK 3C: Include training path and goal categories in snapshot
      trainingPathType: canonicalProfile.trainingPathType || 'balanced',
      goalCategories: canonicalProfile.goalCategories || [],
      selectedFlexibility: canonicalProfile.selectedFlexibility || [],
      strengthBenchmarks: {
        pullUpMax: canonicalProfile.pullUpMax,
        dipMax: canonicalProfile.dipMax,
        pushUpMax: canonicalProfile.pushUpMax,
        weightedPullUp: canonicalProfile.weightedPullUp,
        weightedDip: canonicalProfile.weightedDip,
      },
      skillProgressions: {
        frontLever: canonicalProfile.frontLeverProgression,
        planche: canonicalProfile.plancheProgression,
        hspu: canonicalProfile.hspuProgression,
      },
    },
    // STATE CONTRACT: Generation mode used
    generationMode,
    // [program-alignment] TASK 5: Profile signature for drift detection
    profileSignature: getProfileSignature(),
    // [program-profile-validate] TASK 6: Run validation after generation
    profileValidation: (() => {
      try {
        // Build a temporary program object for validation
        const tempProgram = {
          id: `adaptive-${Date.now()}`,
          createdAt: new Date().toISOString(),
          primaryGoal,
          secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal,
          goalLabel: GOAL_LABELS[primaryGoal],
          sessions,
          scheduleMode: finalScheduleMode,
          currentWeekFrequency: effectiveTrainingDays,
          trainingDaysPerWeek: effectiveTrainingDays,
          sessionLength,
          recoveryLevel: recoverySignal.level,
          programRationale,
          deloadRecommendation,
          weightedStrengthPrescription: undefined, // Will be set after return
        } as unknown as AdaptiveProgram
        
        const validationResult = validateProgramAgainstProfile(canonicalProfile, tempProgram)
        
        console.log('[program-profile-validate] TASK 6: Validation hooked into generation:', {
          isValid: validationResult.isValid,
          overallScore: validationResult.overallScore,
          failures: validationResult.failures,
          warnings: validationResult.warnings,
        })
        
        return {
          isValid: validationResult.isValid,
          overallScore: validationResult.overallScore,
          passCount: validationResult.passCount,
          warningCount: validationResult.warningCount,
          mismatchCount: validationResult.mismatchCount,
          criticalCount: validationResult.criticalCount,
          passed: validationResult.passed,
          warnings: validationResult.warnings,
          failures: validationResult.failures,
        }
      } catch (err) {
        console.error('[program-profile-validate] Validation failed:', err)
        return undefined
      }
    })(),
  }
}

/**
 * Get override signal feedback for program generation
 */
function getOverrideSignalFeedback() {
  const signalFeedback = analyzeSignalsForAdaptive(14) // Last 14 days
  
  if (!signalFeedback.hasSignificantPatterns) {
    return undefined
  }
  
  return {
    hasSignificantPatterns: signalFeedback.hasSignificantPatterns,
    patterns: signalFeedback.patterns,
    coachRecommendations: signalFeedback.coachRecommendations,
  }
}

// =============================================================================
// FATIGUE ADAPTATION HELPERS
// =============================================================================

/**
 * Calculate variety score for session intents (0-1, higher = more varied)
 */
function calculateVarietyScore(intents: SessionIntent[]): number {
  if (intents.length <= 1) return 1 // Single session is inherently varied
  
  let totalSimilarity = 0
  let comparisons = 0
  
  for (let i = 0; i < intents.length; i++) {
    for (let j = i + 1; j < intents.length; j++) {
      const a = intents[i]
      const b = intents[j]
      
      let similarity = 0
      
      // Session type similarity (weight: 0.3)
      if (a.sessionType === b.sessionType) similarity += 0.3
      
      // Exercise variant similarity (weight: 0.3)
      if (a.exerciseVariant === b.exerciseVariant) similarity += 0.3
      
      // Support variant similarity (weight: 0.2)
      if (a.supportVariant === b.supportVariant) similarity += 0.2
      
      // Fatigue profile similarity (weight: 0.2)
      if (a.fatigueProfile === b.fatigueProfile) similarity += 0.2
      
      totalSimilarity += similarity
      comparisons++
    }
  }
  
  const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0
  return Math.max(0, Math.min(1, 1 - avgSimilarity))
}

function getFatigueAdaptationNote(decision: TrainingDecision): string | null {
  switch (decision) {
    case 'PRESERVE_QUALITY':
      return 'Fatigue signals suggest maintaining core work while reducing lower-priority volume.'
    case 'LIGHTEN_SESSION':
      return 'Elevated fatigue detected. Session adjusted to preserve strength quality.'
    case 'COMPRESS_WEEKLY_LOAD':
      return 'Weekly load compressed due to accumulated fatigue. Focus on goal-relevant work.'
    case 'DELOAD_RECOMMENDED':
      return 'Recovery signals indicate a deload period may benefit long-term progress.'
    default:
      return null
  }
}

// =============================================================================
// SKILL EXPRESSION HELPERS
// =============================================================================

/**
 * TASK 4: Session type based on position in the week.
 * This creates variety in how skills are expressed across sessions.
 */
type WeeklySessionType = 
  | 'direct_intensity'   // Max effort skill work (1-2 per week)
  | 'technical_focus'    // Movement quality emphasis
  | 'strength_support'   // Weighted work prioritized, skill maintenance
  | 'mixed_balanced'     // Balanced skill + strength
  | 'rotation_light'     // Lighter skill exposure, recovery emphasis

/**
 * TASK 4: Determine session type based on position in week.
 * Front-loads intensity, back-loads recovery.
 */
function getSessionTypeForPosition(sessionIndex: number, totalSessions: number): WeeklySessionType {
  const weekPosition = sessionIndex / totalSessions
  
  // First 40% of week: direct intensity / heavy work
  if (weekPosition < 0.4) {
    // First session is always direct intensity
    if (sessionIndex === 0) return 'direct_intensity'
    // Second session is technical focus
    if (sessionIndex === 1) return 'technical_focus'
    return 'direct_intensity'
  }
  
  // Middle 30%: technical and mixed
  if (weekPosition < 0.7) {
    // Alternate between technical and strength support
    return sessionIndex % 2 === 0 ? 'technical_focus' : 'strength_support'
  }
  
  // Last 30%: lighter work for recovery
  if (sessionIndex === totalSessions - 1) {
    return 'rotation_light'
  }
  return 'mixed_balanced'
}

/**
 * TASK 4: Get expression mode for primary skill based on session type.
 * This ensures not every session is "max effort" for the primary skill.
 */
function getPrimarySkillExpressionForSessionType(
  sessionType: WeeklySessionType,
  sessionIndex: number
): 'primary' | 'technical' | 'support' | 'warmup' {
  switch (sessionType) {
    case 'direct_intensity':
      // Max effort skill work
      return 'primary'
    case 'technical_focus':
      // Quality focus, lower intensity
      return 'technical'
    case 'strength_support':
      // Skill as secondary, strength prioritized
      return 'support'
    case 'mixed_balanced':
      // Alternate between primary and technical
      return sessionIndex % 2 === 0 ? 'primary' : 'technical'
    case 'rotation_light':
      // Light maintenance only
      return 'warmup'
    default:
      return 'primary'
  }
}

/**
 * SKILL EXPRESSION FIX: Determines which skills should be expressed in a given session
 * based on weighted allocation, session index, and day focus.
 * 
 * Rules:
 * - Primary skills (weight >= 0.3) appear in most sessions with VARIED expression modes
 * - Secondary skills (weight >= 0.15) appear in ~50-75% of sessions  
 * - Tertiary skills (weight >= 0.05) rotate across the week
 * - Skills below threshold may appear as warm-up/technical emphasis only
 */
type SessionSkillAllocation = {
  skill: string
  expressionMode: 'primary' | 'technical' | 'support' | 'warmup'
  weight: number
}

function getSkillsForSession(
  weightedAllocation: WeightedSkillAllocation[],
  sessionIndex: number,
  totalSessions: number,
  dayFocus: string
): SessionSkillAllocation[] {
  if (!weightedAllocation || weightedAllocation.length === 0) {
    return []
  }
  
  const result: SessionSkillAllocation[] = []
  
  // [advanced-skill-expression] ISSUE B: Track which advanced skills need expression this session
  const advancedSkillsInAllocation = weightedAllocation.filter(a => isAdvancedSkill(a.skill))
  
  // TASK 4: Calculate session type based on position in week
  // This creates variety across sessions - not every session is max effort
  const sessionType = getSessionTypeForPosition(sessionIndex, totalSessions)
  
  for (const allocation of weightedAllocation) {
    const { skill, weight, exposureSessions, priorityLevel } = allocation
    
    // [advanced-skill-expression] Check if this is an advanced skill
    const isAdvanced = isAdvancedSkill(skill)
    const advancedFamily = isAdvanced ? getAdvancedSkillFamily(skill) : null
    
    // TASK 4: Primary skills get varied expression modes based on session type
    // This reduces "sameness" - not every session is direct/max effort
    if (priorityLevel === 'primary' || weight >= 0.3) {
      const expressionMode = getPrimarySkillExpressionForSessionType(sessionType, sessionIndex)
      result.push({
        skill,
        expressionMode,
        weight,
      })
      continue
    }
    
    // Secondary skills appear in most sessions as technical or support
    if (priorityLevel === 'secondary' || weight >= 0.15) {
      // Check if this session should include this secondary skill
      // Based on exposureSessions vs totalSessions ratio
      const shouldInclude = exposureSessions >= totalSessions || 
        sessionIndex < exposureSessions ||
        (sessionIndex % 2 === 0) // Even sessions get secondary skills
      
      if (shouldInclude) {
        // [advanced-skill-expression] ISSUE B: Advanced secondary skills can have technical slot
        const expressionMode = isAdvanced && advancedFamily?.technicalSlotWeight > 0.3
          ? 'technical'
          : (dayFocus.includes('support') ? 'support' : 'technical')
        
        result.push({
          skill,
          expressionMode,
          weight,
        })
      }
      continue
    }
    
    // [advanced-skill-expression] ISSUE A: Advanced tertiary skills need better rotation
    if (priorityLevel === 'tertiary' || weight >= 0.05) {
      // [advanced-skill-expression] Advanced skills get priority scheduling
      if (isAdvanced) {
        // Advanced skills should appear in more sessions based on minFrequencyPerWeek
        const minFreq = advancedFamily?.minFrequencyPerWeek || 2
        const targetSessions = Math.min(minFreq, totalSessions)
        
        // Distribute across sessions more evenly
        const interval = Math.floor(totalSessions / targetSessions)
        const shouldInclude = (sessionIndex % interval) === 0 || sessionIndex < targetSessions
        
        if (shouldInclude) {
          // [advanced-skill-expression] ISSUE D: Choose expression mode based on skill type
          let expressionMode: 'primary' | 'technical' | 'support' | 'warmup' = 'support'
          
          // Match day focus to skill category
          if (advancedFamily?.category === 'push' && dayFocus.includes('push')) {
            expressionMode = 'technical'
          } else if (advancedFamily?.category === 'pull' && dayFocus.includes('pull')) {
            expressionMode = 'technical'
          } else if (advancedFamily?.category === 'core' && (dayFocus.includes('core') || dayFocus.includes('compression'))) {
            expressionMode = 'technical'
          } else if (advancedFamily?.subcategory === 'vertical' && dayFocus.includes('skill')) {
            // HSPU on skill days gets technical slot
            expressionMode = 'technical'
          }
          
          result.push({
            skill,
            expressionMode,
            weight,
          })
          
          // [advanced-skill-expression] Log advanced skill session assignment
          console.log('[advanced-skill-expression] Advanced skill assigned to session:', {
            skill,
            displayName: advancedFamily?.displayName,
            sessionIndex,
            expressionMode,
            dayFocus,
            targetSessions,
          })
        }
        continue
      }
      
      // Non-advanced tertiary skills: original rotation logic
      const tertiaryIndex = weightedAllocation
        .filter(a => a.priorityLevel === 'tertiary' || (a.weight >= 0.05 && a.weight < 0.15))
        .filter(a => !isAdvancedSkill(a.skill)) // Don't count advanced skills in rotation
        .findIndex(a => a.skill === skill)
      
      // Each tertiary skill gets specific sessions based on its index
      const sessionForThisSkill = tertiaryIndex % totalSessions
      const shouldInclude = sessionIndex === sessionForThisSkill || 
        exposureSessions > 1 && (sessionIndex + 1) % Math.ceil(totalSessions / exposureSessions) === 0
      
      if (shouldInclude) {
        result.push({
          skill,
          expressionMode: 'support',
          weight,
        })
      }
      continue
    }
    
    // Support-level skills appear only as warm-up emphasis on specific days
    // [advanced-skill-expression] Even support-level advanced skills should get some expression
    if (priorityLevel === 'support') {
      if (isAdvanced) {
        // Advanced skills at support level still get 1-2 sessions
        if (sessionIndex < 2) {
          result.push({
            skill,
            expressionMode: 'support',
            weight,
          })
        }
      } else if (sessionIndex === 0) {
        result.push({
          skill,
          expressionMode: 'warmup',
          weight,
        })
      }
    }
  }
  
  return result
}

// =============================================================================
// SESSION GENERATION
// =============================================================================

function generateAdaptiveSession(
  day: DayStructure,
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  equipment: EquipmentType[],
  sessionLength: SessionLength,
  constraintType: string | undefined,
  context: AdaptiveSessionContext
): AdaptiveSession {
  // Destructure context to get explicit dependencies (scope fix)
  const { 
    athleteCalibration, 
    recoverySignal, 
    weightedBenchmarks,
    // SKILL EXPRESSION FIX: Extract skill allocation data
    selectedSkills,
    weightedSkillAllocation,
    sessionIndex,
    totalSessions,
  } = context
  
  // Safe fallbacks for calibration subfields
  const fatigueSensitivity = athleteCalibration?.fatigueSensitivity ?? 'moderate'
  const sessionCapacity = athleteCalibration?.sessionCapacity ?? 'standard'
  const enduranceCompatibility = athleteCalibration?.enduranceCompatibility ?? 'moderate'
  
  // SKILL EXPRESSION FIX: Determine which skills should be expressed in this session
  // based on weighted allocation and session index
  const skillsForThisSession = getSkillsForSession(
    weightedSkillAllocation || [],
    sessionIndex || 0,
    totalSessions || 1,
    day.focus
  )
  
  // TASK 4: Log session type for debugging session variety
  const sessionType = getSessionTypeForPosition(sessionIndex || 0, totalSessions || 1)
  console.log('[skill-expression] Skills for session:', {
    sessionIndex,
    sessionType, // TASK 4: Shows what type of session this is
    dayFocus: day.focus,
    skillsForThisSession: skillsForThisSession.map(s => ({ 
      skill: s.skill, 
      mode: s.expressionMode // TASK 4: Now shows varied modes
    })),
    primaryGoal,
  })
  
  // Select exercises
  // [session-assembly] Convert sessionLength to number for exercise selection
  const sessionMinutesResolved = typeof sessionLength === 'number' 
    ? sessionLength 
    : parseInt(String(sessionLength).split('-')[0]) || 60
    
  console.log('[session-assembly] Exercise selection starting:', {
    dayFocus: day.focus,
    dayNumber: day.dayNumber,
    sessionMinutes: sessionMinutesResolved,
    selectedSkillsCount: selectedSkills?.length || 0,
    skillsForSessionCount: skillsForThisSession?.length || 0,
  })
  
  const selection = selectExercisesForSession({
    day,
    primaryGoal,
    experienceLevel,
    equipment,
    sessionMinutes: sessionMinutesResolved, // FIXED: Pass resolved number, not SessionLength type
    constraintType,
    // WEIGHTED LOAD PR: Pass weighted benchmarks for load prescription
    weightedBenchmarks,
    // SKILL EXPRESSION FIX: Pass selected skills and allocation for exercise variety
    selectedSkills: selectedSkills || [],
    skillsForSession: skillsForThisSession,
  })
  
  // [session-assembly] Validate selection result before proceeding
  if (!selection) {
    console.error('[session-assembly] CRITICAL: selectExercisesForSession returned null/undefined')
    throw new Error('exercise_selection_returned_null')
  }
  
  // Adapt for equipment - use safe fallbacks if selection properties are missing
  const safeMain = Array.isArray(selection?.main) ? selection.main : []
  const safeWarmup = Array.isArray(selection?.warmup) ? selection.warmup : []
  const safeCooldown = Array.isArray(selection?.cooldown) ? selection.cooldown : []
  
  // [session-assembly] Log exercise counts for debugging
  console.log('[session-assembly] Exercise selection complete:', {
    mainCount: safeMain.length,
    warmupCount: safeWarmup.length,
    cooldownCount: safeCooldown.length,
    estimatedTime: selection.totalEstimatedTime,
  })
  
  // [session-assembly] Validate we have at least some exercises
  if (safeMain.length === 0) {
    console.warn('[session-assembly] WARNING: Empty main exercise pool for day', {
      dayFocus: day.focus,
      dayNumber: day.dayNumber,
      primaryGoal,
    })
    // Don't throw - let validation handle it downstream, but log for diagnosis
  }
  
  const adaptedMain = adaptSessionForEquipment(safeMain, equipment)
  const adaptedWarmup = adaptSessionForEquipment(safeWarmup, equipment)
  const adaptedCooldown = adaptSessionForEquipment(safeCooldown, equipment)
  
  // Generate session variants (30, 45, full)
  const variants = generateSessionVariants(selection, sessionLength)
  
  // Build adaptation notes
  const adaptationNotes: string[] = []
  if (adaptedMain.adaptationCount > 0) {
    adaptationNotes.push(`${adaptedMain.adaptationCount} exercise(s) adapted for available equipment.`)
  }
  if (adaptedMain.significantLimitations.length > 0) {
    adaptationNotes.push(...adaptedMain.significantLimitations)
  }
  
  // Get day explanation
  const rationale = getDayExplanation(day, GOAL_LABELS[primaryGoal])
  
// Generate endurance finisher if appropriate
    const mainWorkMinutes = selection.totalEstimatedTime - 10 // Subtract warmup/cooldown estimate
    const sessionTimeFit = fitEnduranceToSession(sessionLength, mainWorkMinutes)
    
    // [session-assembly] FIX: Use selection.main (not selection.exercises which doesn't exist)
    // ExerciseSelection interface has: { warmup, main, cooldown, totalEstimatedTime }
    const safeSelectionMain = Array.isArray(selection?.main) ? selection.main : []
    
    // Calculate session neural demand from main exercises
    const sessionNeuralDemand = safeSelectionMain.some(e => e?.exercise?.neuralDemand >= 4) 
      ? 'high' as const
      : safeSelectionMain.some(e => e?.exercise?.neuralDemand >= 3)
        ? 'moderate' as const
        : 'low' as const

    // Select endurance block (using local safe variables)
    const currentFatigueScore = recoverySignal?.level === 'red' ? 80 : recoverySignal?.level === 'yellow' ? 60 : 40
    const enduranceResult = selectEnduranceBlock({
      primaryGoal,
      sessionLength,
      sessionCapacity,
      enduranceCompatibility,
      fatigueSensitivity,
      currentFatigueScore,
      sessionNeuralDemand,
      timeRemainingMinutes: sessionTimeFit.recommendedDuration,
      availableEquipment: equipment,
    })

    // Generate the finisher if needed (using local safe variables)
    let finisher: GeneratedFinisher | undefined
    if (enduranceResult.shouldIncludeEndurance && enduranceResult.blockType) {
      // Adjust for fatigue
      const fatigueAdjustment = adjustBlockForFatigue(
        enduranceResult.duration,
        currentFatigueScore,
        fatigueSensitivity
      )
      
      if (!fatigueAdjustment.shouldSkip) {
        finisher = generateFinisher(
          enduranceResult.blockType,
          fatigueAdjustment.adjustedDuration,
          equipment,
          fatigueSensitivity
        )
      }
    }

    // TASK 5: Map exercises first, then validate/dedupe
    // [program-build] Log inputs to mapToAdaptiveExercises for diagnosis
    const adaptedMainArray = Array.isArray(adaptedMain?.adapted) ? adaptedMain.adapted : []
    console.log('[program-build] Mapping exercises for session', {
      dayNumber: day.dayNumber,
      adaptedMainLength: adaptedMainArray.length,
      adaptedWarmupLength: Array.isArray(adaptedWarmup?.adapted) ? adaptedWarmup.adapted.length : 0,
      adaptedCooldownLength: Array.isArray(adaptedCooldown?.adapted) ? adaptedCooldown.adapted.length : 0,
    })
    
    const rawExercises = mapToAdaptiveExercises(
      adaptedMainArray, 
      primaryGoal, 
      sessionLength, 
      fatigueSensitivity,
      currentFatigueScore
    )
    const rawWarmup = mapToAdaptiveExercises(Array.isArray(adaptedWarmup?.adapted) ? adaptedWarmup.adapted : [], primaryGoal, sessionLength)
    const rawCooldown = mapToAdaptiveExercises(Array.isArray(adaptedCooldown?.adapted) ? adaptedCooldown.adapted : [], primaryGoal, sessionLength)
    
    // [program-build] Log mapping results
    console.log('[program-build] Exercise mapping complete', {
      dayNumber: day.dayNumber,
      rawExercisesLength: rawExercises.length,
      rawWarmupLength: rawWarmup.length,
      rawCooldownLength: rawCooldown.length,
    })
    
    // TASK 5: Session Assembly Validation Pass
    // Dedupe, fix ordering, and validate session before returning
    const sessionBudget = resolveSessionBudget(typeof sessionLength === 'number' ? sessionLength : parseInt(String(sessionLength).split('-')[0]) || 45)
    const validatedSession = validateSession(rawExercises, rawWarmup, rawCooldown, {
      isSkillFirstDay: day.isPrimary,
      maxMainExercises: sessionBudget.mainWork.maxExercises,
      maxWarmupExercises: sessionBudget.warmup.maxExercises,
    })
    
    // ISSUE D FIX: Filter validation fixes - only surface user-meaningful fixes, not internal cleanup
    // "Removed duplicate" messages are internal plumbing noise - keep as dev logs only
    if (validatedSession.validation.fixesApplied.length > 0) {
      const userFacingFixes = validatedSession.validation.fixesApplied.filter(fix => 
        // Skip internal duplicate cleanup messages - these are expected and not user-relevant
        !fix.toLowerCase().includes('removed') || !fix.toLowerCase().includes('duplicate')
      )
      if (userFacingFixes.length > 0) {
        adaptationNotes.push(...userFacingFixes)
      }
      // Log all fixes for debugging but don't surface to users
      if (process.env.NODE_ENV !== 'production') {
        console.log('[program-generate] Validation fixes (internal):', validatedSession.validation.fixesApplied)
      }
    }
    
    return {
      dayNumber: day.dayNumber,
      dayLabel: `Day ${day.dayNumber}`,
      focus: day.focus,
      focusLabel: day.focusLabel,
      isPrimary: day.isPrimary,
      rationale,
      // Use validated (deduped, reordered) exercises
      exercises: validatedSession.exercises,
      warmup: validatedSession.warmup,
      cooldown: validatedSession.cooldown,
      estimatedMinutes: selection.totalEstimatedTime + (finisher?.durationMinutes || 0),
      variants,
      adaptationNotes: adaptationNotes.length > 0 ? adaptationNotes : undefined,
      finisher,
      finisherIncluded: !!finisher,
      finisherRationale: enduranceResult.rationale,
    }
  }

function mapToAdaptiveExercises(
  selected: SelectedExercise[],
  primaryGoal: PrimaryGoal = 'general',
  sessionLength: SessionLength = '45-60',
  fatigueSensitivity: 'high' | 'moderate' | 'low' = 'moderate',
  currentFatigueScore: number = 50
): AdaptiveExercise[] {
  // SAFETY: Ensure selected is a valid array before any array operations
  const safeSelected = Array.isArray(selected) ? selected : []
  
  // Early return if no exercises to map
  if (safeSelected.length === 0) {
    return []
  }
  
  let fatigueBudgetRemaining = 100
  
  // Calculate session type for failure budget
  const sessionType = primaryGoal === 'skill' ? 'skill' as const
    : primaryGoal === 'endurance' ? 'endurance' as const
    : primaryGoal === 'strength' ? 'strength' as const
    : 'mixed' as const
  
  // Determine session neural demand (using safe array)
  const sessionNeuralDemand = safeSelected.some(s => s?.exercise?.neuralDemand >= 4) 
    ? 'high' as const
    : safeSelected.some(s => s?.exercise?.neuralDemand >= 3)
      ? 'moderate' as const
      : 'low' as const
  
  // Calculate failure budget for the session
  const failureBudget = calculateFailureBudget({
    sessionType,
    primaryGoal,
    fatigueSensitivity,
    currentFatigueScore,
    sessionNeuralDemand,
  })
  
  return safeSelected.map((s, index) => {
    // SAFETY: Skip malformed entries
    if (!s?.exercise) {
      console.log('[mapToAdaptiveExercises] Skipping malformed entry at index', index)
      return null
    }
    
    // Get method compatibility for exercise
    const compatibility = s.exercise.methodCompatibility || 
      getDefaultMethodCompatibility(s.exercise.category, s.exercise.movementPattern, s.exercise.neuralDemand)
    
    // Get failure risk for this exercise
    const failureRisk = s.exercise.failureRisk || 
      getDefaultFailureRisk(s.exercise.category, s.exercise.neuralDemand, s.exercise.movementPattern)
    
    // Determine if this is near end of session
    const isEndOfSession = index >= safeSelected.length - 2
    
    // Check for potential superset partner
    const nextExercise = selected[index + 1]
    let hasMatchingExerciseForSuperset = false
    let supersetCandidate = undefined
    
    if (nextExercise && compatibility.superset) {
      const nextFailureRisk = nextExercise.exercise.failureRisk ||
        getDefaultFailureRisk(nextExercise.exercise.category, nextExercise.exercise.neuralDemand, nextExercise.exercise.movementPattern)
      
      supersetCandidate = {
        exercise1: {
          id: s.exercise.id,
          name: s.exercise.name,
          movementPattern: s.exercise.movementPattern,
          category: s.exercise.category,
          neuralDemand: s.exercise.neuralDemand,
          failureRisk,
        },
        exercise2: {
          id: nextExercise.exercise.id,
          name: nextExercise.exercise.name,
          movementPattern: nextExercise.exercise.movementPattern,
          category: nextExercise.exercise.category,
          neuralDemand: nextExercise.exercise.neuralDemand,
          failureRisk: nextFailureRisk,
        },
      }
      
      const supersetResult = evaluateSupersetPairing(supersetCandidate)
      hasMatchingExerciseForSuperset = supersetResult.canSuperset
    }
    
    // Use improved method selection with failure budget awareness
    const methodResult = selectMethodWithBudget({
      primaryGoal,
      sessionLength,
      exerciseCategory: s.exercise.category,
      movementPattern: s.exercise.movementPattern,
      neuralDemand: s.exercise.neuralDemand,
      fatigueBudgetRemaining,
      isEndOfSession,
      athleteFatigueSensitivity: fatigueSensitivity,
      failureBudget,
      exerciseFailureRisk: failureRisk,
      hasMatchingExerciseForSuperset,
      supersetCandidate,
    }, compatibility)
    
    const method = methodResult.recommendedMethod
    
    // Update fatigue budget
    const methodDef = TRAINING_METHODS[method]
    fatigueBudgetRemaining -= s.exercise.fatigueCost * 5 * (methodDef?.fatigueCostMultiplier || 1)
    
    // Update failure budget tracking
    if (method === 'drop_set' || method === 'rest_pause') {
      failureBudget.currentNearFailureSets += 2
    } else if (method === 'density_block') {
      failureBudget.currentNearFailureSets += 1
    }
    
    // Evaluate progression decision for skill and strength exercises
    let progressionDecision: AdaptiveExercise['progressionDecision'] = undefined
    if (s.exercise.category === 'skill' || s.exercise.category === 'strength') {
      try {
        const isIsometric = s.exercise.category === 'skill' && 
          (s.exercise.defaultRepsOrTime?.includes('s') || 
           s.exercise.id.includes('hold') ||
           s.exercise.id.includes('lever') ||
           s.exercise.id.includes('planche') ||
           s.exercise.id.includes('l_sit'))
        
        const evaluation = evaluateExerciseProgression(
          s.exercise.id,
          s.exercise.name,
          undefined, // Use default target range
          isIsometric
        )
        
        progressionDecision = {
          decision: evaluation.decision,
          confidence: evaluation.confidence,
          reason: evaluation.reasoning,
        }
      } catch {
        // Non-blocking - continue without progression decision
      }
    }
    
    return {
      id: s.exercise.id,
      name: s.exercise.name,
      category: s.exercise.category,
      sets: s.sets,
      repsOrTime: s.repsOrTime,
      note: s.note,
      isOverrideable: s.isOverrideable,
      selectionReason: s.selectionReason,
      source: 'database' as const, // DB enforcement: all exercises sourced from adaptive-exercise-pool
      method,
      methodLabel: getMethodLabel(method),
      progressionDecision,
      // WEIGHTED LOAD PR: Include prescribed load if available from exercise selection
      prescribedLoad: s.prescribedLoad,
    }
  }).filter((e): e is AdaptiveExercise => e !== null)
  
  // [prescription-render] TASK 6: Log prescription data in builder output
  const exercisesWithLoads = exercises.filter(e => e.prescribedLoad && e.prescribedLoad.load > 0)
  if (exercisesWithLoads.length > 0) {
    console.log('[prescription-render] Builder output exercises with prescribedLoad:', {
      sessionDay: day,
      count: exercisesWithLoads.length,
      exercises: exercisesWithLoads.map(e => ({
        name: e.name,
        load: e.prescribedLoad?.load,
        unit: e.prescribedLoad?.unit,
        confidence: e.prescribedLoad?.confidenceLevel,
      })),
    })
  }
  
  return exercises
}

// =============================================================================
// PROGRAM RATIONALE
// =============================================================================

function generateProgramRationale(
  primaryGoal: PrimaryGoal,
  structure: WeeklyStructure,
  constraintInsight: ReturnType<typeof getConstraintInsight>,
  recoveryLevel: RecoveryLevel,
  equipmentProfile: EquipmentProfile,
  // [advanced-skill-expression] ISSUE F: Accept selected skills for rationale
  selectedSkills: string[] = []
): string {
  const parts: string[] = []
  
  // Get enhanced context from Adaptive Athlete Engine
  const engineCtx = getProgramBuilderContext()
  
  // Structure choice
  parts.push(structure.rationale)
  
  // Constraint awareness (from engine)
  if (engineCtx.primaryConstraint && constraintInsight.label !== 'Training Balanced') {
    parts.push(`Program accounts for your current limiter: ${engineCtx.constraintLabel.toLowerCase()}.`)
  }
  
  // Plateau awareness (new from engine)
  if (engineCtx.plateauStatus === 'plateau_detected') {
    parts.push('Program includes variation to help break through the current plateau.')
  } else if (engineCtx.plateauStatus === 'possible_plateau') {
    parts.push('Consider introducing new stimuli if progress stalls.')
  }
  
  // [prescription] ISSUE F: Weighted strength support with actual prescription awareness
  if (engineCtx.strengthSupportLevel === 'insufficient') {
    parts.push('Additional emphasis on weighted strength work to build foundational support.')
  } else if (engineCtx.strengthSupportLevel === 'developing') {
    parts.push('Continue building support strength alongside skill work.')
  } else if (engineCtx.strengthSupportLevel === 'sufficient' || engineCtx.strengthSupportLevel === 'strong') {
    parts.push('Weighted strength maintained to support skill development.')
  }
  
  // Recovery consideration (enhanced with fatigue state)
  if (engineCtx.recoveryState === 'overtrained' || engineCtx.recoveryState === 'fatigued') {
    parts.push('Training load reduced due to elevated fatigue. Prioritize recovery.')
  } else if (recoveryLevel === 'LOW') {
    parts.push('Recovery state suggests including lighter sessions to prevent overtraining.')
  } else if (recoveryLevel === 'HIGH') {
    parts.push('Recovery state supports high-intensity training this week.')
  }
  
  // Equipment notes
  if (!equipmentProfile.hasFullSetup) {
  parts.push('Some exercises adapted for available equipment.')
  }
  
  // [advanced-skill-expression] ISSUE F: Include advanced skill expression in rationale
  // Check if any advanced skills are in the selected skills
  const advancedSkillsExpressed: string[] = []
  
  for (const skill of selectedSkills) {
    if (isAdvancedSkill(skill)) {
      const family = getAdvancedSkillFamily(skill)
      if (family) {
        advancedSkillsExpressed.push(family.displayName)
      }
    }
  }
  
  if (advancedSkillsExpressed.length > 0) {
    if (advancedSkillsExpressed.length === 1) {
      parts.push(`${advancedSkillsExpressed[0]} receives dedicated progression and support work.`)
    } else {
      const skillList = advancedSkillsExpressed.slice(0, 2).join(' and ')
      parts.push(`Advanced skills (${skillList}) receive structured progression and support.`)
    }
    
    // [advanced-skill-expression] Log rationale inclusion
    console.log('[advanced-skill-expression] Rationale includes advanced skills:', {
      advancedSkillsExpressed,
      selectedSkillsCount: selectedSkills.length,
    })
  }
  
  return parts.join(' ')
}

// =============================================================================
// SESSION FEEDBACK VOLUME MODIFIER
// =============================================================================

/**
 * Apply volume modifier to exercises based on session feedback fatigue state.
 * Reduces or increases sets while preserving exercise selection.
 */
function applyVolumeModifier(exercises: AdaptiveExercise[], modifier: number): AdaptiveExercise[] {
  if (modifier === 1.0) return exercises
  
  return exercises.map(exercise => {
    // Calculate adjusted sets
    let adjustedSets = Math.round(exercise.sets * modifier)
    
    // Ensure minimum of 1 set, maximum of original + 1
    adjustedSets = Math.max(1, Math.min(exercise.sets + 1, adjustedSets))
    
    // If sets changed, mark as adapted
    if (adjustedSets !== exercise.sets) {
      return {
        ...exercise,
        sets: adjustedSets,
        wasAdapted: true,
        note: exercise.note 
          ? `${exercise.note} (volume adjusted)`
          : 'Volume adjusted based on recovery feedback',
      }
    }
    
    return exercise
  })
}

// =============================================================================
// EXERCISE OVERRIDE
// =============================================================================

export interface OverrideWarning {
  originalExercise: string
  replacementExercise: string
  warning: string
  impactLevel: 'low' | 'medium' | 'high'
}

export function evaluateExerciseOverride(
  original: AdaptiveExercise,
  replacementId: string
): OverrideWarning {
  // Determine impact based on exercise category
  let impactLevel: 'low' | 'medium' | 'high' = 'low'
  let warning = ''
  
  if (original.category === 'skill') {
    impactLevel = 'high'
    warning = `${original.name} was selected as your primary skill work. Replacing it may reduce skill progression.`
  } else if (original.category === 'strength') {
    impactLevel = 'medium'
    warning = `${original.name} was selected to build supporting strength. Ensure replacement targets similar patterns.`
  } else {
    impactLevel = 'low'
    warning = `${original.name} is accessory work. Replacement will have minimal impact on primary goals.`
  }
  
  return {
    originalExercise: original.name,
    replacementExercise: replacementId,
    warning,
    impactLevel,
  }
}

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_adaptive_programs'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function saveAdaptiveProgram(program: AdaptiveProgram): AdaptiveProgram {
  if (!isBrowser()) return program
  
  // [program-build] SAVE: Pre-save critical validation
  // Reject programs with fundamentally broken session structure
  console.log('[program-build] SAVE: Starting pre-save validation...', {
    programId: program?.id,
    sessionCount: program?.sessions?.length || 0,
  })
  
  const sessions = program.sessions || []
  const criticalIssues: string[] = []
  
  // Check 1: Must have at least one session
  if (sessions.length === 0) {
    criticalIssues.push('empty_session_array')
  }
  
  // Check 2: Each session must have exercises
  const sessionExerciseCounts: number[] = []
  sessions.forEach((session, idx) => {
    const exerciseCount = session?.exercises?.length || 0
    sessionExerciseCounts.push(exerciseCount)
    
    if (!session.exercises || session.exercises.length === 0) {
      criticalIssues.push(`session_${idx + 1}_no_exercises`)
    }
    
    // Check 3: Each exercise must have valid sets
    const exercises = session.exercises || []
    exercises.forEach((ex, exIdx) => {
      if (typeof ex.sets !== 'number' || ex.sets <= 0) {
        criticalIssues.push(`session_${idx + 1}_exercise_${exIdx + 1}_invalid_sets`)
      }
    })
  })
  
  // [program-build] Log session exercise counts for diagnosis
  console.log('[program-build] SAVE: Session exercise counts:', sessionExerciseCounts)
  
  // [program-rebuild-truth] SAVE: If critical issues found, DO NOT save - preserve last good program
  // TASK 4: Atomic replacement guard - reject malformed programs to preserve last good
  if (criticalIssues.length > 0) {
    console.error('[program-rebuild-error] SAVE BLOCKED: Program has invalid structure:', {
      issues: criticalIssues,
      sessionCount: sessions.length,
      sessionExerciseCounts,
      programId: program?.id,
      preservedLastGoodProgram: true,
    })
    // [program-rebuild-fallback] This preserves the last good program in storage
    console.log('[program-rebuild-fallback] Last good program preserved - malformed program rejected')
    throw new Error(`session_save_blocked: ${criticalIssues.join(', ')}`)
  }
  
  // DATABASE ENFORCEMENT: Validate program before save
  console.log('[program-build] SAVE: Running database validation...')
  const validation = validateProgramFromDatabase(program)
  
  if (!validation.isValid) {
    console.warn('[program-build] SAVE: Database validation issues (non-blocking):', validation.diagnostics)
    // Log specific issues but don't block save - allow graceful degradation
    if (validation.exerciseValidation.missingDbSource.length > 0) {
      console.warn('[program-build] SAVE: Exercises missing DB source:', 
        validation.exerciseValidation.missingDbSource.slice(0, 5))
    }
  } else {
    console.log('[program-build] SAVE: Database validation passed')
  }
  
  // [program-rebuild-truth] SAVE: Actually persist to localStorage
  // TASK 4: Atomic replacement - this is the final commit step
  const programs = getSavedAdaptivePrograms()
  programs.push(program)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
  
  console.log('[program-rebuild-truth] SAVE: Program saved successfully - atomic replacement complete', {
    programId: program.id,
    sessionCount: sessions.length,
    totalExercises: sessionExerciseCounts.reduce((a, b) => a + b, 0),
    replacedVisibleProgram: true,
  })
  return program
}

export function getSavedAdaptivePrograms(): AdaptiveProgram[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // CRITICAL: Validate parsed data is actually an array before returning
      // Malformed localStorage could contain non-array data which would crash .sort() and .length
      if (!Array.isArray(parsed)) {
        console.warn('[AdaptiveProgramBuilder] getSavedAdaptivePrograms: stored data is not an array, returning empty')
        return []
      }
      return parsed
    } catch {
      return []
    }
  }
  return []
}

export function getLatestAdaptiveProgram(): AdaptiveProgram | null {
  const programs = getSavedAdaptivePrograms()
  if (programs.length === 0) return null
  
  return programs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
}

export function deleteAdaptiveProgram(id: string): boolean {
  if (!isBrowser()) return false
  
  const programs = getSavedAdaptivePrograms()
  const filtered = programs.filter(p => p.id !== id)
  
  if (filtered.length === programs.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

// =============================================================================
// DEFAULT INPUTS
// =============================================================================

export function getDefaultAdaptiveInputs(): AdaptiveProgramInputs {
  // CANONICAL FIX: Use the unified canonical profile instead of split sources
  // This ensures metrics, goals, and schedule preferences all come from one truth
  const canonicalProfile = getCanonicalProfile()
  const legacyProfile = getAthleteProfile() // Fallback for fields not yet in canonical
  
  // Log canonical state for debugging
  logCanonicalProfileState('getDefaultAdaptiveInputs called')
  
  // TASK 4: Read canonical goals from saved profile, not stale program state
  // Determine primary goal from CanonicalProfile
  let primaryGoal: PrimaryGoal = 'planche'
  if (canonicalProfile.primaryGoal && ['planche', 'front_lever', 'muscle_up', 'handstand_pushup', 'weighted_strength'].includes(canonicalProfile.primaryGoal)) {
    primaryGoal = canonicalProfile.primaryGoal as PrimaryGoal
  }
  
  // TASK 3: Read secondaryGoal from canonical profile if persisted
  let secondaryGoal: PrimaryGoal | undefined = undefined
  if (canonicalProfile.secondaryGoal && ['planche', 'front_lever', 'muscle_up', 'handstand_pushup', 'weighted_strength'].includes(canonicalProfile.secondaryGoal)) {
    secondaryGoal = canonicalProfile.secondaryGoal as PrimaryGoal
  }
  
  // Map equipment to EquipmentType
  // AthleteProfile uses: 'pullup_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'resistance_bands' | 'weights'
  // AdaptiveProgramInputs uses: 'pull_bar' | 'dip_bars' | 'rings' | 'parallettes' | 'bands' | 'weights' | 'floor' | 'wall'
  // [loadability-truth] ISSUE B: Include 'weights' mapping to preserve loadable equipment truth from Settings
  const equipmentMap: Record<string, EquipmentType> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'parallettes': 'parallettes',
    'rings': 'rings',
    'resistance_bands': 'bands',
    'weights': 'weights',
  }
  
  // Start with floor and wall (always available)
  const mappedEquipment: EquipmentType[] = ['floor', 'wall']
  
  // Add equipment from canonical profile
  if (canonicalProfile.equipmentAvailable && canonicalProfile.equipmentAvailable.length > 0) {
    for (const eq of canonicalProfile.equipmentAvailable) {
      const mapped = equipmentMap[eq]
      if (mapped && !mappedEquipment.includes(mapped)) {
        mappedEquipment.push(mapped)
      }
    }
  } else {
    // Fallback to sensible defaults if no equipment saved
    mappedEquipment.push('pull_bar', 'dip_bars')
  }
  
  // TASK 6: Unified duration contract - use canonical 30/45/60/90 minutes
  // DO NOT map 90 to 75 - this caused label drift between settings and builder
  let sessionLength: SessionLength = 60
  const profileSessionLength = canonicalProfile.sessionLengthMinutes
  if (profileSessionLength === 30) sessionLength = 30
  else if (profileSessionLength === 45) sessionLength = 45
  else if (profileSessionLength === 60) sessionLength = 60
  else if (profileSessionLength === 75) sessionLength = 75 // Legacy support - normalize to 90 in display
  else if (profileSessionLength === 90) sessionLength = 90 as SessionLength // Cast to handle type constraint
  
  // FLEXIBLE SCHEDULE FIX: Preserve schedule identity from canonical profile
  // Do NOT collapse flexible users into a fake fixed numeric value
  const isFlexibleUser = canonicalProfile.scheduleMode === 'flexible' || canonicalProfile.trainingDaysPerWeek === null
  const scheduleMode: ScheduleMode = isFlexibleUser ? 'flexible' : 'static'
  
  // For flexible users: trainingDaysPerWeek = 'flexible' (identity)
  // For static users: trainingDaysPerWeek = numeric value from canonical profile
  // ISSUE A FIX: Only fallback to 4 if canonical field is truly null/undefined (new user)
  // Use explicit null check to avoid treating 0 or other falsy values as missing
  const canonicalDays = canonicalProfile.trainingDaysPerWeek
  const trainingDaysPerWeek: TrainingDays | 'flexible' = isFlexibleUser 
    ? 'flexible' 
    : canonicalDays !== null && canonicalDays !== undefined 
      ? (canonicalDays as TrainingDays)
      : 4  // Only for truly new users with no saved value
  
  // TASK 7: Track whether fallbacks were used for debugging seed/default dominance
  const fallbacksUsed = {
    trainingDaysPerWeek: canonicalDays === null || canonicalDays === undefined,
    sessionLength: !canonicalProfile.sessionLengthMinutes,
    primaryGoal: !canonicalProfile.primaryGoal,
  }
  
  // CANONICAL FIX: Log which canonical profile fields were consumed for debugging
  console.log('[AdaptiveBuilder] getDefaultAdaptiveInputs consumed from CANONICAL:', {
    primaryGoal,
    secondaryGoal: secondaryGoal || 'none',
    scheduleMode,
    trainingDaysPerWeek,
    sessionLength,
    sessionDurationMode: canonicalProfile.sessionDurationMode || 'static',
    equipmentCount: mappedEquipment.length,
    experienceLevel: canonicalProfile.experienceLevel,
    // TASK 3C: Log expanded context for hybrid/multi-goal awareness
    trainingPathType: canonicalProfile.trainingPathType || 'balanced',
    goalCategoriesCount: canonicalProfile.goalCategories?.length || 0,
    selectedSkillsCount: canonicalProfile.selectedSkills?.length || 0,
    selectedFlexibilityCount: canonicalProfile.selectedFlexibility?.length || 0,
    benchmarksPresent: {
      pullUp: !!canonicalProfile.pullUpMax,
      dip: !!canonicalProfile.dipMax,
      frontLever: !!canonicalProfile.frontLeverProgression,
      planche: !!canonicalProfile.plancheProgression,
    },
    // TASK 7: Fallback usage tracking
    fallbacksUsed,
  })
  
  return {
    primaryGoal,
    secondaryGoal, // TASK 3: Now included in generation inputs
    experienceLevel: canonicalProfile.experienceLevel,
    trainingDaysPerWeek,
    sessionLength,
    equipment: mappedEquipment,
    scheduleMode,
    // TASK 7: Pass selected skills array for multi-goal awareness
    selectedSkills: canonicalProfile.selectedSkills || [],
    // TASK 3C: Pass training path and goal categories for richer planner context
    trainingPathType: canonicalProfile.trainingPathType || 'balanced',
    goalCategories: canonicalProfile.goalCategories || [],
    // TASK 3C: Pass session duration mode for adaptive time awareness
    sessionDurationMode: canonicalProfile.sessionDurationMode || 'static',
    // TASK 3C: Pass flexibility targets when selected
    selectedFlexibility: canonicalProfile.selectedFlexibility || [],
  }
}

// =============================================================================
// TIME OPTIMIZATION
// =============================================================================

/**
 * Optimize a session for a specific target duration
 * Use when user indicates they have less/more time than default
 */
export function optimizeSessionForDuration(
  session: AdaptiveSession,
  targetMinutes: number,
  options?: {
    preserveSkillWork?: boolean
    preserveMainStrength?: boolean
  }
): AdaptiveSession {
  const { preserveSkillWork = true, preserveMainStrength = true } = options || {}
  
  const result = optimizeSessionForTime({
    session,
    targetMinutes,
    preserveSkillWork,
    preserveMainStrength,
  })
  
  // Track time pattern for adaptive learning
  saveTimePattern({
    date: new Date().toISOString().split('T')[0],
    requestedMinutes: targetMinutes,
    actualMinutes: result.actualMinutes,
    wasCompressed: result.optimizationType === 'compressed',
    wasExpanded: result.optimizationType === 'expanded',
  })
  
  // Add optimization context to session
  const optimizedSession: AdaptiveSession = {
    ...result.session,
    timeOptimization: {
      wasOptimized: result.wasOptimized,
      originalMinutes: result.originalMinutes,
      targetMinutes: result.targetMinutes,
      coachingMessage: result.coachingMessage,
      removedExercises: result.removedExercises,
      reducedExercises: result.reducedExercises,
    },
  }
  
  return optimizedSession
}

/**
 * Get time optimization info for display
 */
export function getTimeOptimizationInfo(session: AdaptiveSession): {
  isOptimized: boolean
  message: string
  details: string
} {
  if (!session.timeOptimization?.wasOptimized) {
    return {
      isOptimized: false,
      message: '',
      details: '',
    }
  }
  
  const opt = session.timeOptimization
  return {
    isOptimized: true,
    message: opt.coachingMessage,
    details: `${opt.removedExercises.length} exercise(s) removed, ${opt.reducedExercises.length} reduced`,
  }
}

// =============================================================================
// [exercise-trace] TASK 8: BUILD-TO-BUILD COMPARISON
// =============================================================================

/**
 * Build a ProgramSelectionTrace from an AdaptiveProgram.
 * [exercise-trace] TASK 8: Creates trace structure for comparison.
 */
export function buildProgramSelectionTrace(program: AdaptiveProgram): ProgramSelectionTrace {
  const sessionTraces: SessionSelectionTrace[] = program.sessions.map((session, index) => {
    const exerciseTraces = session.exercises.map(ex => {
      // Use existing selection trace if available, otherwise create minimal
      if (ex.selectionTrace) {
        return ex.selectionTrace
      }
      // Fallback: create minimal trace for older programs
      return {
        exerciseId: ex.exercise.id,
        exerciseName: ex.exercise.name,
        slotType: 'main' as const,
        sessionRole: 'accessory' as const,
        expressionMode: 'strength_support' as const,
        primarySelectionReason: 'unknown' as const,
        secondaryInfluences: [],
        influencingSkills: [],
        doctrineSource: null,
        exerciseFamily: ex.exercise.movementPattern || null,
        candidatePoolSummary: {
          totalCandidates: 0,
          filteredByEquipment: 0,
          filteredBySessionRole: 0,
          filteredBySkillWeight: 0,
          finalRankedCandidates: 0,
        },
        rejectedAlternatives: [],
        equipmentDecision: null,
        loadabilityInfluence: null,
        limiterInfluence: null,
        recoveryInfluence: null,
        confidence: 0.3,
        traceQuality: 'minimal' as const,
      }
    })

    return {
      sessionIndex: index,
      dayLabel: session.dayLabel || `Day ${index + 1}`,
      sessionRole: session.dayType?.includes('skill') ? 'primary_focus' as const :
                   session.dayType?.includes('support') ? 'recovery' as const :
                   'mixed' as const,
      primarySkillExpressed: program.primaryGoal,
      secondarySkillExpressed: program.secondaryGoal || null,
      exerciseTraces,
      unexpressedSkills: [],
      sessionRationale: session.explanation || '',
    }
  })

  const aggregateStats = {
    totalExercises: program.sessions.reduce((sum, s) => sum + s.exercises.length, 0),
    skillDirectExercises: sessionTraces.flatMap(s => s.exerciseTraces)
      .filter(e => e.primarySelectionReason === 'primary_skill_direct' || e.primarySelectionReason === 'secondary_skill_direct')
      .length,
    strengthSupportExercises: sessionTraces.flatMap(s => s.exerciseTraces)
      .filter(e => e.primarySelectionReason === 'strength_foundation' || e.primarySelectionReason === 'selected_skill_support')
      .length,
    weightedExercises: sessionTraces.flatMap(s => s.exerciseTraces)
      .filter(e => e.equipmentDecision?.weightedChosen === true)
      .length,
    bodyweightExercises: sessionTraces.flatMap(s => s.exerciseTraces)
      .filter(e => e.equipmentDecision?.weightedChosen === false || !e.equipmentDecision)
      .length,
    doctrineHitCount: sessionTraces.flatMap(s => s.exerciseTraces)
      .filter(e => e.doctrineSource !== null)
      .length,
    rejectedAlternativeCount: sessionTraces.flatMap(s => s.exerciseTraces)
      .reduce((sum, e) => sum + (e.rejectedAlternatives?.length || 0), 0),
  }

  return {
    programId: program.id,
    generatedAt: program.createdAt,
    profileSignature: program.profileSignature || '',
    sessionTraces,
    aggregateStats,
  }
}

/**
 * Compare current program with previous one and log differences.
 * [exercise-trace] TASK 8: Explains why plans are similar or different.
 */
export function logProgramComparison(
  previousProgram: AdaptiveProgram | null,
  newProgram: AdaptiveProgram
): void {
  const prevTrace = previousProgram ? buildProgramSelectionTrace(previousProgram) : null
  const newTrace = buildProgramSelectionTrace(newProgram)
  
  const comparison = compareExerciseSelectionTraces(prevTrace, newTrace)
  logExerciseComparison(comparison)
  
  // [exercise-trace] Additional logging for debugging
  console.log('[exercise-trace-compare] PROGRAM COMPARISON DETAILS:', {
    previousId: previousProgram?.id || 'none',
    newId: newProgram.id,
    profileChanged: previousProgram?.profileSignature !== newProgram.profileSignature,
    exercisesUnchanged: comparison.unchangedExercises.length,
    exercisesAdded: comparison.addedExercises.length,
    exercisesRemoved: comparison.removedExercises.length,
    weightedInPrev: prevTrace?.aggregateStats.weightedExercises || 0,
    weightedInNew: newTrace.aggregateStats.weightedExercises,
    doctrineHitsInNew: newTrace.aggregateStats.doctrineHitCount,
  })
}
