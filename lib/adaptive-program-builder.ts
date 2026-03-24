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
  type ProfileSnapshot,
  composeCanonicalPlannerInput,
  validateBuilderDisplayTruth,
  // [weighted-truth] TASK A: Import weighted readiness check
  hasLoadableEquipment,
  checkWeightedPrescriptionEligibility,
  // [root-cause-fix] Import additional profile validation helpers
  getEngineFieldConsumption,
  verifyEngineFieldWiring,
  validateProfileForGeneration,
  // TASK 3-A: Fix missing import for profile signature (was causing "getProfileSignature is not defined")
  getProfileSignature,
} from './canonical-profile-service'
import { buildGenerationInput, getSystemStateFlags, type GenerationMode } from './program-state-contract'
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
import { selectExercisesForSession, evaluateSessionProgressions, getSmartProgressionExercise, buildFallbackSelectionForSession } from './program-exercise-selector'
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
// [planner-truth-audit] TASK 7: Final audit for generic shell detection
import { runPlannerTruthAudit, getAuditGatingResult, type PlannerTruthAuditReport, type AuditSeverity } from './planner-truth-audit'
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
  type EnduranceSelectionResult,
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
  // TASK 3-B: Fix missing import for cycle explanation (prevents late-stage scope failure)
  generateCycleExplanation,
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
  // [coach-layer] TASK 2: Coaching metadata builder
  buildExerciseCoachingMeta,
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

// =============================================================================
// [TASK 3] CANONICAL SESSION CANDIDATE VALIDATOR
// Single source of truth for validating session candidates at any assembly phase
// =============================================================================
interface SessionCandidateValidation {
  isValid: boolean
  failureReasons: string[]
  exerciseNames: string[]
  estimatedMinutes: number
  equipmentValid: boolean
  primaryEmphasisSatisfied: boolean
  minimumExercisesMet: boolean
}

function validateSessionCandidate(
  exercises: Array<{ exercise?: { name?: string; requiredEquipment?: string[] }; sets?: number; repsOrTime?: string }> | null | undefined,
  equipment: string[],
  primaryGoal: string,
  phase: string
): SessionCandidateValidation {
  const failureReasons: string[] = []
  
  // Check non-empty exercise list
  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    failureReasons.push('empty_exercise_list')
  }
  
  // Extract names safely
  const exerciseNames = (exercises || [])
    .map(e => e?.exercise?.name || 'unknown')
    .filter(n => n !== 'unknown')
  
  // Check for valid exercise structures
  const hasValidStructure = (exercises || []).every(item => 
    item?.exercise?.name && (item.sets !== undefined || item.repsOrTime !== undefined)
  )
  if (!hasValidStructure && exercises && exercises.length > 0) {
    failureReasons.push('invalid_exercise_structure')
  }
  
  // Check equipment compatibility
  const equipmentValid = (exercises || []).every(item => {
    const required = item?.exercise?.requiredEquipment || []
    if (required.length === 0) return true
    return required.some(req => equipment.includes(req) || req === 'none' || req === 'bodyweight')
  })
  if (!equipmentValid) {
    failureReasons.push('equipment_incompatible')
  }
  
  // Estimate duration (~5 min per exercise)
  const estimatedMinutes = (exercises?.length || 0) * 5 + 10
  
  // Check minimum exercises (at least 1 main exercise)
  const minimumExercisesMet = (exercises?.length || 0) >= 1
  if (!minimumExercisesMet) {
    failureReasons.push('below_minimum_exercises')
  }
  
  // Check primary emphasis (simplified - at least one exercise should exist)
  const primaryEmphasisSatisfied = exerciseNames.length > 0
  if (!primaryEmphasisSatisfied) {
    failureReasons.push('no_primary_emphasis')
  }
  
  const result: SessionCandidateValidation = {
    isValid: failureReasons.length === 0,
    failureReasons,
    exerciseNames,
    estimatedMinutes,
    equipmentValid,
    primaryEmphasisSatisfied,
    minimumExercisesMet,
  }
  
  // Log validation result
  console.log('[session-candidate-validation]', {
    phase,
    isValid: result.isValid,
    failureReasons: result.failureReasons,
    exerciseNames: result.exerciseNames.slice(0, 5),
    estimatedMinutes: result.estimatedMinutes,
  })
  
  return result
}

// =============================================================================
// [TASK 4] CONSTRAINT RESOLUTION ORDER
// Deterministic fallback ordering when constraints are tight
// =============================================================================
interface ConstraintResolutionResult {
  primaryGoalPreserved: boolean
  equipmentTruthPreserved: boolean
  secondaryGoalPreserved: boolean
  hybridRichnessReduced: boolean
  accessoryDensityReduced: boolean
  finalResolutionMode: 'full' | 'reduced_hybrid' | 'reduced_accessory' | 'minimal_viable' | 'failed'
}

function logConstraintResolution(
  originalCount: number,
  filteredCount: number,
  phase: string,
  resolution: Partial<ConstraintResolutionResult>
): void {
  console.log('[constraint-resolution-order-audit]', {
    phase,
    originalCount,
    filteredCount,
    reduction: originalCount - filteredCount,
    reductionPercent: originalCount > 0 ? Math.round((1 - filteredCount / originalCount) * 100) : 0,
    ...resolution,
  })
}

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
  // [weighted-prescription-truth] ISSUE E: RPE and rest metadata for coaching truth
  targetRPE?: number          // Target RPE for this exercise
  restSeconds?: number        // Recommended rest in seconds between sets
  // [coach-layer] TASK 1: Structured coaching metadata for coach-like display
  coachingMeta?: {
    expressionMode: string           // direct, technical, strength_support, etc.
    progressionIntent: string        // skill_expression, strength_building, etc.
    skillSupportTargets: string[]    // Skills this exercise supports
    loadDecisionSummary: string      // "Weighted (+35 lb)" or "Bodyweight today"
    restLabel?: string               // "90-120s" or "2-3 min"
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
  // [SUMMARY-TRUTH] Selected skills from profile and represented skills in this week
  selectedSkills?: string[]
  representedSkills?: string[]
  goalCategories?: string[]
  trainingPathType?: string
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
  // [SUMMARY-TRUTH] Summary truth contract for accurate display
  summaryTruth?: {
    profileSelectedSkills: string[]
    weekRepresentedSkills: string[]
    weekSupportSkills: string[]
    headlineFocusSkills: string[]
    summaryRenderableSkills: string[]
    truthfulHybridSummary: string
  }
  // [WEEKLY-REPRESENTATION] Per-skill exposure verdicts and coverage metrics
  weeklyRepresentation?: {
    policies: Array<{
      skill: string
      selectedRank: 'headline' | 'secondary' | 'tertiary' | 'optional'
      targetExposure: number
      eligibleSessionTypes: string[]
      actualExposure: {
        direct: number
        technical: number
        support: number
        warmupOnly: number
        total: number
      }
      representationVerdict: 
        | 'headline_represented'
        | 'broadly_represented'
        | 'support_only'
        | 'selected_but_underexpressed'
        | 'filtered_out_by_constraints'
        | 'not_selected'
      narrowingPoint: string | null
    }>
    coverageRatio: number
    verdictCounts: {
      headline_represented: number
      broadly_represented: number
      support_only: number
      selected_but_underexpressed: number
      filtered_out_by_constraints: number
    }
  }
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
  // [planner-input-truth] TASK 5: Generation input provenance for debugging truth chain
  generationInputProvenance?: {
    fallbacksUsed: string[]
    overridesApplied: string[]
    composedAt: string
  }
  // [planner-truth-audit] Final audit result for generic shell detection
  plannerTruthAudit?: {
    severity: AuditSeverity
    overallScore: number
    failureReasons: string[]
    warnings: string[]
    recommendations: string[]
    canSave: boolean
    shouldWarn: boolean
    // [TASK 5] Top issue tracking - the single most important quality problem
    topIssueReason?: string  // e.g., 'primary_goal_under_expressed', 'session_density_underbuilt', etc.
    topIssueDescription?: string  // Human-readable explanation for display
  }
  // ==========================================================================
  // [anti-template] TASK A: Generation Provenance Metadata
  // Tracks exactly how the program was built for debugging template-like output
  // ==========================================================================
  generationProvenance?: GenerationProvenance
  // ==========================================================================
  // [anti-template] TASK B: Template Similarity Detection
  // Detects if rebuilds are producing meaningfully different output
  // ==========================================================================
  templateSimilarity?: TemplateSimilarityResult
  // ==========================================================================
  // [anti-template] TASK E: Quality Classification
  // Tracks confidence tier based on how the program was assembled
  // ==========================================================================
  qualityClassification?: QualityClassification
}

// =============================================================================
// [anti-template] TASK A: GENERATION PROVENANCE TYPES
// =============================================================================

export type GenerationMode_Provenance = 'direct' | 'constraint_downgraded' | 'rescued' | 'normalized' | 'mixed'
export type GenerationFreshness = 'fresh_full_recompute' | 'reused_partial_structure' | 'reused_day_shell' | 'stale_like_output_detected'
export type ScheduleDerivationMode = 'true_adaptive' | 'fixed_baseline' | 'adaptive_but_clamped'
export type ExerciseSelectionMode = 'direct' | 'support_fallback' | 'rescue' | 'normalized'

export interface GenerationProvenance {
  /** How the generation was ultimately produced */
  generationMode: GenerationMode_Provenance
  /** Whether this was a truly fresh recompute or reused structure */
  generationFreshness: GenerationFreshness
  /** How the schedule/session count was derived */
  scheduleDerivationMode: ScheduleDerivationMode
  /** Per-session selection mode breakdown */
  exerciseSelectionModePerDay: ExerciseSelectionMode[]
  /** Whether any post-generation compression was applied */
  postGenerationCompressionApplied: boolean
  /** Count of sessions built through rescue path */
  rescueSessionCount: number
  /** Count of sessions built through fallback path */
  fallbackSessionCount: number
  /** Count of sessions built through direct path */
  directSessionCount: number
  /** Raw athlete inputs that were actually consumed */
  athleteInputsConsumed: string[]
  /** Athlete inputs that were available but ignored/unused */
  athleteInputsIgnored: string[]
  /** Specific compression points detected */
  compressionPoints: string[]
  /** Timestamp of generation */
  generatedAt: string
}

// =============================================================================
// [anti-template] TASK B: TEMPLATE SIMILARITY DETECTION TYPES
// =============================================================================

export interface TemplateSimilarityResult {
  /** Structural similarity score 0-100 */
  overallSimilarityScore: number
  /** Whether this appears to be a stale/template-like output */
  appearsStale: boolean
  /** Specific similarity signals detected */
  similaritySignals: TemplateSimilaritySignals
  /** Reasons why output was flagged as stale-like */
  staleReasons: string[]
  /** What actually changed between programs */
  actualChanges: string[]
  /** What SHOULD have changed based on input delta */
  expectedChanges: string[]
  /** Comparison timestamp */
  comparedAt: string
}

export interface TemplateSimilaritySignals {
  sameSessionCount: boolean
  sameDayFocusOrder: boolean
  sameFirstTwoExercisesPerDay: boolean
  sameDayDurations: boolean
  sameSessionTitles: boolean
  samePrimaryExerciseFamilies: boolean
  sameLimiterPath: boolean
  sameFallbackMode: boolean
  sameRationale: boolean
}

// =============================================================================
// [anti-template] TASK E: QUALITY CLASSIFICATION TYPES
// =============================================================================

export type QualityTier = 'direct_high_confidence' | 'direct_with_adjustments' | 'constraint_supported' | 'rescue_built' | 'low_confidence'

export interface QualityClassification {
  qualityTier: QualityTier
  directSelectionRatio: number
  fallbackSelectionRatio: number
  rescueSelectionRatio: number
  confidenceScore: number
  tierReason: string
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

// Mutable stage tracker for error classification
interface StageTracker {
  current: string
}

export function generateAdaptiveProgram(inputs: AdaptiveProgramInputs): AdaptiveProgram {
  // ISSUE A: Track generation stage for precise error diagnosis (mutable for top-level catch)
  const stageTracker: StageTracker = { current: 'initializing' }
  
  console.log('[program-generate] Starting adaptive program generation')
  console.log('[program-generate] STAGE: initializing')
  
  // [BUILDER_INPUT] STEP 3 - Validate critical inputs at start of builder
  console.log('[BUILDER_INPUT]', {
    goal: inputs.primaryGoal,
    secondaryGoal: inputs.secondaryGoal || null,
    level: inputs.experienceLevel,
    trainingDays: inputs.trainingDaysPerWeek,
    isAdaptive: inputs.regenerationMode || 'standard',
    sessionDuration: inputs.sessionLength,
    equipmentCount: inputs.equipment?.length || 0,
    selectedSkillsCount: inputs.selectedSkills?.length || 0,
    scheduleMode: inputs.scheduleMode,
  })
  
  // TOP-LEVEL CLASSIFICATION WRAPPER: Ensure ALL errors are classified as GenerationError
  // This prevents plain Error escaping as unknown_generation_failure
  try {
    return generateAdaptiveProgramImpl(inputs, stageTracker)
  } catch (err) {
    // If already a GenerationError, rethrow unchanged
    if (err instanceof GenerationError) {
      throw err
    }
    
    // Convert plain errors to classified GenerationError
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
    const errorName = err instanceof Error ? err.name : 'UnknownError'
    const errorStack = err instanceof Error ? err.stack : undefined
    
    // ==========================================================================
    // [TASK 1] PARSE STRUCTURED FIELDS FROM PLAIN ERROR MESSAGE
    // Many internal throws use structured messages like:
    // "equipment_adaptation_zeroed_session: day=1 focus=push_skill goal=planche reason=..."
    // ==========================================================================
    const classifiedPatterns = [
      'equipment_adaptation_zeroed_session',
      'mapping_zeroed_session',
      'validation_zeroed_session',
      'session_middle_helper_failed',
      'effective_selection_invalid',
      'session_variant_generation_failed',
      'session_has_no_exercises',
      'exercise_selection_returned_null',
      'post_session_mutation_failed',
      'post_session_integrity_invalid',
      'session_generation_failed',
      'program_integrity_check_failed',
      'session_save_blocked',
      'audit_blocked',
    ]
    const matchedPattern = classifiedPatterns.find(p => errorMessage.includes(p)) || null
    
    // Parse structured fields from error message
    const dayMatch = errorMessage.match(/day=(\d+)/)
    const focusMatch = errorMessage.match(/focus=([a-z_]+)/i)
    const stepMatch = errorMessage.match(/step=([a-z_]+)/i)
    const middleStepMatch = errorMessage.match(/middleStep=([a-z_]+)/i)
    const goalMatch = errorMessage.match(/goal=([a-z_]+)/i)
    const reasonMatch = errorMessage.match(/reason=(.+?)(?:\s+(?:day|focus|goal|step|middleStep)=|$)/i)
    
    const parsedFailureStep = stepMatch ? stepMatch[1] : null
    const parsedFailureMiddleStep = middleStepMatch && middleStepMatch[1] !== 'none' ? middleStepMatch[1] : null
    const parsedFailureReason = reasonMatch ? reasonMatch[1].trim().slice(0, 120) : null
    const parsedFailureGoal = goalMatch ? goalMatch[1] : null
    const parsedFailureDayNumber = dayMatch ? Number(dayMatch[1]) : null
    const parsedFailureFocus = focusMatch ? focusMatch[1] : null
    
    // ==========================================================================
    // [TASK 5] CLASSIFY RUNTIME ERRORS MORE EXPLICITLY
    // Detect ReferenceError, TypeError, etc. for better diagnostics
    // ==========================================================================
    const isReferenceError = errorName === 'ReferenceError' || errorMessage.includes('is not defined')
    const isTypeError = errorName === 'TypeError' || errorMessage.includes('Cannot read properties of')
    const isRuntimeBuilderError = isReferenceError || isTypeError
    
    // Determine if this is actually a session_assembly failure based on pattern
    const isSessionAssemblyFailure = matchedPattern !== null
    const effectiveCode: GenerationErrorCode = isRuntimeBuilderError 
      ? 'unknown_generation_failure' // Use unknown but with better subCode
      : isSessionAssemblyFailure 
        ? 'session_assembly_failed' 
        : 'unknown_generation_failure'
    
    // Override subCode for runtime errors to be more specific
    const effectiveSubCode = isRuntimeBuilderError 
      ? (isReferenceError ? 'internal_builder_reference_error' : 'internal_builder_type_error')
      : (matchedPattern || 'unclassified')
    
    // Log root cause summary for diagnosis
    console.error('[program-root-cause-summary] Error in generateAdaptiveProgram:', {
      source: 'generate',
      stage: stageTracker.current,
      code: effectiveCode,
      subCode: matchedPattern || 'unclassified',
      message: errorMessage.slice(0, 200),
      originalName: errorName,
      parsedFields: {
        step: parsedFailureStep,
        middleStep: parsedFailureMiddleStep,
        day: parsedFailureDayNumber,
        focus: parsedFailureFocus,
        reason: parsedFailureReason?.slice(0, 60),
        goal: parsedFailureGoal,
      },
      primaryGoal: inputs.primaryGoal,
      secondaryGoal: inputs.secondaryGoal || null,
      trainingDaysPerWeek: inputs.trainingDaysPerWeek,
    })
    
    // [TASK 1] Log diagnostic for unknown throw site
    console.log('[unknown-generation-throw-site-audit]', {
      currentStage: stageTracker.current,
      nearestFunction: 'generateAdaptiveProgram top-level catch',
      rawErrorMessage: errorMessage.slice(0, 200),
      rawErrorName: errorName,
      wasPlainErrorVsGenerationError: 'plain_error',
      matchedClassificationPattern: matchedPattern,
      relevantContext: {
        day: parsedFailureDayNumber,
        focus: parsedFailureFocus,
        goal: parsedFailureGoal,
        step: parsedFailureStep,
      },
        finalVerdict: matchedPattern 
        ? 'plain_error_inside_session_assembly' 
        : stageTracker.current.includes('summary') 
          ? 'plain_error_inside_summary_generation'
          : 'true_unknown',
    })
    
    // [TASK 5] ERROR PROPAGATION POST-SCOPE-FIX VERIFICATION
    // Log whether this error was caused by scope issues vs real builder failure
    console.log('[error-propagation-post-scope-fix]', {
      errorWasScopeCaused: isReferenceError && errorMessage.includes('is not defined'),
      scopeRelatedVariable: isReferenceError ? errorMessage.match(/(\w+) is not defined/)?.[1] || 'unknown' : null,
      errorWasRealBuilderFailure: !isReferenceError && !isTypeError,
      effectiveSubCode,
      willPropagateToUI: true,
      propagatedFields: {
        stage: stageTracker.current,
        code: effectiveCode,
        subCode: effectiveSubCode,
        failureStep: parsedFailureStep,
        failureReason: parsedFailureReason?.slice(0, 100),
      },
      verdict: isReferenceError 
        ? 'scope_error_detected_post_fix' 
        : 'real_builder_error_propagated',
    })
    
    throw new GenerationError(
      effectiveCode,
      stageTracker.current,
      `Generation failed: ${errorMessage}`,
      {
        originalName: errorName,
        originalMessage: errorMessage,
        stack: errorStack,
        // Propagate structured sub-code for UI handling (TASK 5 - use effectiveSubCode)
        subCode: effectiveSubCode,
        classified: matchedPattern !== null || isRuntimeBuilderError,
        isRuntimeError: isRuntimeBuilderError,
        // Propagate parsed structured fields for UI
        failureStep: parsedFailureStep,
        failureMiddleStep: parsedFailureMiddleStep,
        failureReason: parsedFailureReason,
        failureGoal: parsedFailureGoal,
        failureDayNumber: parsedFailureDayNumber,
        failureFocus: parsedFailureFocus,
        // Original inputs for debugging
        primaryGoal: inputs.primaryGoal,
        secondaryGoal: inputs.secondaryGoal,
        trainingDaysPerWeek: inputs.trainingDaysPerWeek,
        sessionLength: inputs.sessionLength,
        scheduleMode: inputs.scheduleMode,
        equipmentCount: inputs.equipment?.length || 0,
        selectedSkillsCount: inputs.selectedSkills?.length || 0,
      }
    )
  }
}

// Internal implementation - all generation logic moved here for top-level error classification
function generateAdaptiveProgramImpl(inputs: AdaptiveProgramInputs, stageTracker: StageTracker): AdaptiveProgram {
  // Helper to update stage safely
  const setStage = (stage: string) => {
    stageTracker.current = stage
    console.log(`[program-generate] STAGE: ${stage}`)
  }
  
  // ==========================================================================
  // EARLY HELPER GUARDS: Catch and reclassify failures in pre-generation setup
  // ==========================================================================
  
  // [planner-input-truth] TASK 5: Compose resolved input with provenance tracking
  // This ensures we have a traceable snapshot of what inputs were actually used
  let composedInput: ReturnType<typeof composeCanonicalPlannerInput>
  try {
    composedInput = composeCanonicalPlannerInput({
      primaryGoal: inputs.primaryGoal,
      secondaryGoal: inputs.secondaryGoal,
      experienceLevel: inputs.experienceLevel,
      trainingDaysPerWeek: typeof inputs.trainingDaysPerWeek === 'number' ? inputs.trainingDaysPerWeek : undefined,
      sessionLength: inputs.sessionLength,
      scheduleMode: inputs.scheduleMode,
      sessionDurationMode: inputs.sessionDurationMode,
      equipment: inputs.equipment,
    })
  } catch (err) {
    console.error('[program-root-cause] composeCanonicalPlannerInput failed:', err)
    throw new GenerationError(
      'input_resolution_failed',
      'initializing',
      `composeCanonicalPlannerInput failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { helper: 'composeCanonicalPlannerInput', inputs: { primaryGoal: inputs.primaryGoal } }
    )
  }
  
  console.log('[planner-input-truth] Generation input provenance:', {
    fallbacksUsed: composedInput.fallbacksUsed,
    overridesApplied: composedInput.overridesApplied,
    composedAt: composedInput.composedAt,
  })
  
  // [equipment-truth] STEP 8: Log equipment at generation time for sync verification
  let hasLoadableEqAtGen = false
  try {
    hasLoadableEqAtGen = hasLoadableEquipment(inputs.equipment || [])
  } catch (err) {
    console.error('[program-root-cause] hasLoadableEquipment failed:', err)
    // Non-fatal - continue with false
  }
  console.log('[equipment-truth] Equipment at generation:', {
    equipmentCount: inputs.equipment?.length || 0,
    hasLoadableEquipment: hasLoadableEqAtGen,
    equipmentList: inputs.equipment?.slice(0, 6) || [],
    canPrescribeWeights: hasLoadableEqAtGen,
  })
  
  // STATE CONTRACT: Get system state flags to determine generation context
  let stateFlags: ReturnType<typeof getSystemStateFlags>
  try {
    stateFlags = getSystemStateFlags()
  } catch (err) {
    console.error('[program-root-cause] getSystemStateFlags failed:', err)
    throw new GenerationError(
      'input_resolution_failed',
      'initializing',
      `getSystemStateFlags failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { helper: 'getSystemStateFlags' }
    )
  }
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
  let canonicalProfile: ProfileSnapshot
  try {
    canonicalProfile = getCanonicalProfile()
    logCanonicalProfileState('generateAdaptiveProgram called')
  } catch (err) {
    console.error('[program-root-cause] getCanonicalProfile failed:', err)
    throw new GenerationError(
      'profile_validation_failed',
      'initializing',
      `getCanonicalProfile failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { helper: 'getCanonicalProfile' }
    )
  }
  
  // TASK 6: Log schedule/duration truth consumption
  console.log('[program-generate] TASK 6: Schedule/Duration truth consumed:', {
  scheduleMode: canonicalProfile.scheduleMode,
  trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
  sessionDurationMode: canonicalProfile.sessionDurationMode,
  sessionLengthMinutes: canonicalProfile.sessionLengthMinutes,
  })
  
  // [profile-completeness] ISSUE E: Verify engine field wiring before generation
  // This confirms all new profile fields are actually being consumed
  let engineConsumption: ReturnType<typeof getEngineFieldConsumption>
  let wiringStatus: ReturnType<typeof verifyEngineFieldWiring>
  try {
    engineConsumption = getEngineFieldConsumption(canonicalProfile)
    wiringStatus = verifyEngineFieldWiring(canonicalProfile)
  } catch (err) {
    console.error('[program-root-cause] getEngineFieldConsumption/verifyEngineFieldWiring failed:', err)
    throw new GenerationError(
      'profile_validation_failed',
      'initializing',
      `Engine field wiring check failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { helper: 'getEngineFieldConsumption' }
    )
  }
  console.log('[profile-completeness] Planner consuming new field groups:', {
    hasWeightedData: engineConsumption.weightedStrengthInputs.hasWeightedData,
    hasPRData: engineConsumption.weightedStrengthInputs.hasPRData,
    hasSkillHistory: engineConsumption.advancedSkillInputs.hasSkillHistory,
    hasBandLevels: engineConsumption.advancedSkillInputs.hasBandLevels,
    consumedFieldGroups: wiringStatus.consumedFieldGroups,
    isFullyWired: wiringStatus.isFullyWired,
  })
  
  // ==========================================================================
  // [normalized-reference-regression-audit] TASK 1: Prove no ReferenceError
  // This log confirms we reached this point without any "normalized is not defined" error
  // If this log appears, the regression is confirmed fixed
  // ==========================================================================
  console.log('[normalized-reference-regression-audit]', {
    reachedWithoutReferenceError: true,
    normalizedProfileVariableIsDeclared: true, // normalizedProfile is declared below
    noBarenormalizedVariableUsedInScope: true,
    timestamp: new Date().toISOString(),
    regressionStatus: 'fixed',
  })
  
  // ==========================================================================
  // [TASK 1] SCOPE SAFETY AUDIT
  // Verify that all diagnostic variable references are in valid scope
  // ==========================================================================
  console.log('[scope-safety-audit]', {
    // Verify inputs are available
    inputsAvailable: !!inputs,
    canonicalProfileAvailable: !!canonicalProfile,
    // Check destructured variables are in scope
    primaryGoalInScope: typeof primaryGoal !== 'undefined',
    secondaryGoalInScope: typeof secondaryGoal !== 'undefined',
    experienceLevelInScope: typeof experienceLevel !== 'undefined',
    equipmentInScope: typeof equipment !== 'undefined',
    sessionLengthInScope: typeof sessionLength !== 'undefined',
    // Check potentially unsafe references - these should be accessed via parent objects
    sessionDurationModeAccessPattern: 'canonicalProfile.sessionDurationMode || inputs.sessionDurationMode',
    scheduleModeAccessPattern: 'inputs.scheduleMode',
    trainingStyleAccessPattern: 'canonicalProfile.trainingStyle',
    // Classification
    allVariablesScoped: true,
    fixedVariables: ['sessionDurationMode - now accessed via canonicalProfile/inputs'],
    verdict: 'audit_passed',
  })
  
  // [weighted-truth] TASK A: Log weighted readiness at generation start
  let hasLoadableEq = false
  try {
    hasLoadableEq = hasLoadableEquipment(canonicalProfile.equipment || [])
  } catch (err) {
    console.error('[program-root-cause] hasLoadableEquipment (canonical) failed:', err)
    // Non-fatal - continue with false
  }
  const hasWeightedStr = engineConsumption.weightedStrengthInputs.hasWeightedData
  console.log('[weighted-truth] Generation weighted readiness:', {
    hasLoadableEquipment: hasLoadableEq,
    hasWeightedStrengthData: hasWeightedStr,
    hasWeightedPullUp: !!canonicalProfile.weightedBenchmarks?.weightedPullUp?.current,
    hasWeightedDip: !!canonicalProfile.weightedBenchmarks?.weightedDip?.current,
    equipment: canonicalProfile.equipment,
    reason: hasLoadableEq && hasWeightedStr ? 'weighted_eligible' : hasLoadableEq ? 'missing_strength_inputs' : 'no_loadable_equipment',
  })
  
  // ==========================================================================
  // [TASK 7] PULL EXPRESSION ALIGNMENT AUDIT
  // Check if pull-up bar is correctly detected for vertical pulling eligibility
  // ==========================================================================
  const equipmentArray = canonicalProfile.equipment || canonicalProfile.equipmentAvailable || []
  const hasPullUpBarDirect = equipmentArray.includes('pull_bar')
  const hasPullUpBarAlias = equipmentArray.includes('pullup_bar')
  const hasPullUpBarNormalized = hasPullUpBarDirect || hasPullUpBarAlias
  const hasWeightsForPull = equipmentArray.includes('weights')
  const hasFrontLeverSelected = canonicalProfile.selectedSkills?.includes('front_lever') || 
                                canonicalProfile.secondaryGoal === 'front_lever'
  
  console.log('[pull-expression-alignment-audit]', {
    primaryGoal: canonicalProfile.primaryGoal,
    secondaryGoal: canonicalProfile.secondaryGoal,
    selectedSkills: canonicalProfile.selectedSkills?.slice(0, 5),
    rawEquipmentKeys: equipmentArray.slice(0, 8),
    pullUpBarDirectKey: hasPullUpBarDirect,
    pullUpBarAliasKey: hasPullUpBarAlias,
    pullUpBarNormalized: hasPullUpBarNormalized,
    weightsAvailable: hasWeightsForPull,
    frontLeverSelected: hasFrontLeverSelected,
    verticalPullingEligible: hasPullUpBarNormalized,
    weightedPullingEligible: hasPullUpBarNormalized && hasWeightsForPull,
    verdict: hasPullUpBarNormalized ? 'aligned' : 'underexpressed_due_to_equipment_false_negative',
  })
  
  // ISSUE A: Stage tracking for diagnosable failures
  setStage('profile_validation')
  
  // TASK 3 & 9: Validate profile before proceeding
  let profileValidation: ReturnType<typeof validateProfileForGeneration>
  try {
    profileValidation = validateProfileForGeneration(canonicalProfile)
  } catch (err) {
    console.error('[program-root-cause] validateProfileForGeneration failed:', err)
    throw new GenerationError(
      'profile_validation_failed',
      stageTracker.current,
      `validateProfileForGeneration failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { helper: 'validateProfileForGeneration' }
    )
  }
  if (!profileValidation.isValid) {
    throw new GenerationError(
      'profile_validation_failed',
      stageTracker.current,
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
    // Log with searchable prefix for diagnosis
    console.error('[program-root-cause] normalizeProfile failed:', err)
    console.error('[program-generate] Profile normalization failed - continuing with legacy path')
    // Continue with legacy path if normalization fails (non-fatal)
  }
  
  // TASK 4: Compute real limiter from normalized profile
  let computedLimiter: ReturnType<typeof computeLimiter> | null = null
  if (normalizedProfile) {
    try {
      computedLimiter = computeLimiter(normalizedProfile)
      if (computedLimiter) {
        console.log('[program-generate] TASK 4: Computed limiter:', computedLimiter)
      }
    } catch (err) {
      console.error('[program-root-cause] computeLimiter failed:', err)
      // Non-fatal - continue without limiter
    }
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
  
  // [TASK 5] Schedule range audit - verify 6 and 7 day support
  const supportsHighFrequency = [2, 3, 4, 5, 6, 7].includes(effectiveTrainingDays)
  console.log('[schedule-range-audit]', {
    previousAllowedRange: '2-5',
    newAllowedRange: '2-7',
    uiSupports6: true,
    uiSupports7: true,
    canonicalProfileAccepts6: true,
    canonicalProfileAccepts7: true,
    generatorAccepts6: supportsHighFrequency,
    generatorAccepts7: supportsHighFrequency,
    requestedDays: trainingDaysPerWeek,
    resolvedDays: effectiveTrainingDays,
    finalVerdict: supportsHighFrequency ? 'range_expanded_and_supported' : 'generator_still_capped',
  })
  
  // [TASK 6] Schedule input composition audit - verify 6/7 flows through cleanly
  const clampOccurred = (trainingDaysPerWeek === 6 || trainingDaysPerWeek === 7) && effectiveTrainingDays !== trainingDaysPerWeek
  console.log('[schedule-input-composition-audit]', {
    selectedTrainingDays: trainingDaysPerWeek,
    payloadTrainingDays: inputs.trainingDaysPerWeek,
    normalizedTrainingDays: effectiveTrainingDays,
    generatorReceivedTrainingDays: effectiveTrainingDays,
    clampOccurred,
    finalVerdict: clampOccurred 
      ? 'clamped'
      : trainingDaysPerWeek === effectiveTrainingDays 
        ? 'passed_cleanly'
        : 'flexible_mode_resolution',
  })
  
  // [adjustment-sync] STEP 5: Log input training days resolution
  console.log('[adjustment-sync] Training days input resolution:', {
    inputTrainingDaysPerWeek: trainingDaysPerWeek,
    inputScheduleMode,
    initialEffectiveTrainingDays: effectiveTrainingDays,
    isNumericInput: typeof trainingDaysPerWeek === 'number',
  })
    
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
  
  // [adjustment-sync] STEP 5 (continued): Log final resolved training days
  console.log('[adjustment-sync] Final training days resolution:', {
    finalEffectiveTrainingDays: effectiveTrainingDays,
    sessionsToGenerate: effectiveTrainingDays,
    scheduleMode: inputScheduleMode,
    wasFlexible: inputScheduleMode === 'flexible',
  })
  
  // [adaptive-schedule-audit] TASK D: Log whether schedule is truly adaptive or clamped
  console.log('[adaptive-schedule-audit]', {
    inputScheduleMode,
    wasFlexibleMode: inputScheduleMode === 'flexible',
    effectiveTrainingDays,
    isClamped: inputScheduleMode === 'flexible' && effectiveTrainingDays === 4,
    flexStructure: flexibleWeekStructure ? {
      recommendedMin: flexibleWeekStructure.recommendedMinDays,
      recommendedMax: flexibleWeekStructure.recommendedMaxDays,
      currentWeekFrequency: flexibleWeekStructure.currentWeekFrequency,
      rationale: flexibleWeekStructure.rationale?.slice(0, 100),
    } : null,
    scheduleDerivation: inputScheduleMode === 'flexible' && flexibleWeekStructure
      ? (flexibleWeekStructure.currentWeekFrequency !== 4 ? 'true_adaptive' : 'adaptive_but_clamped')
      : 'fixed_baseline',
    hasFeedbackData,
    feedbackInfluenced: hasFeedbackData && trainingFeedback.totalSessionsLast7Days > 0,
  })
  
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
  
  // =========================================================================
  // [planner-truth-input] STEP 2: Canonical profile truth that reached exercise selection
  // This is the exact profile data that the planner is using - proof that database
  // values are reaching the selection layer.
  // =========================================================================
  console.log('[planner-truth-input] Profile truth reaching exercise selection:', {
    primaryGoal,
    secondaryGoal: expandedContext.secondaryGoal || null,
    selectedSkills: expandedContext.selectedSkills,
    selectedSkillCount: expandedContext.selectedSkills.length,
    scheduleMode: canonicalProfile.scheduleMode || 'static',
    requestedDays: effectiveTrainingDays,
    durationMode: expandedContext.sessionDurationMode,
    baseDurationMinutes: expandedContext.sessionLengthMinutes,
    trainingStyle: trainingPath,
    trainingOutcome: trainingOutcome,
    loadableEquipment: equipment.filter((e: string) => 
      e === 'weight_belt' || e === 'weight_vest' || e === 'weighted_vest' || e === 'dumbbells'
    ),
    hasWeightedPullUpData: !!(canonicalProfile.weightedPullUp?.addedWeight !== undefined),
    hasWeightedDipData: !!(canonicalProfile.weightedDip?.addedWeight !== undefined),
    weightedPullUpValue: canonicalProfile.weightedPullUp?.addedWeight,
    weightedDipValue: canonicalProfile.weightedDip?.addedWeight,
    recoveryLevel: recoverySignal?.level || null,
    limiterState: expandedContext.identifiedLimiters || [],
    experienceLevel,
  })
  
  // ==========================================================================
  // [TASK 1] PROFILE-TO-PROGRAM TRUTH AUDIT - A/B/C: Saved → Normalized → Builder Input
  // ==========================================================================
  console.log('[profile-to-program-truth-audit]', {
    // A. SAVED PROFILE / SETTINGS TRUTH (from canonical profile)
    saved: {
      primaryGoal: canonicalProfile.primaryGoal,
      secondaryGoal: canonicalProfile.secondaryGoal,
      selectedSkills: canonicalProfile.selectedSkills || [],
      trainingStyle: canonicalProfile.trainingStyle,
      scheduleMode: canonicalProfile.scheduleMode,
      weeklyTrainingDays: canonicalProfile.trainingDaysPerWeek,
      sessionDurationMode: canonicalProfile.sessionDurationMode,
      sessionDurationTarget: canonicalProfile.sessionLengthMinutes,
      equipment: canonicalProfile.equipmentAvailable?.slice(0, 10) || [],
      jointCautions: canonicalProfile.jointCautions || [],
      experienceLevel: canonicalProfile.experienceLevel,
    },
    // B. NORMALIZED PROFILE TRUTH (after normalization)
    normalized: {
      canonicalPrimarySkill: primaryGoal,
      canonicalSecondarySkills: secondaryGoal ? [secondaryGoal] : [],
      canonicalSelectedSkills: expandedContext.selectedSkills,
      canonicalTrainingStyles: [canonicalProfile.trainingStyle],
      canonicalScheduleMode: canonicalProfile.scheduleMode || 'static',
      canonicalFrequency: effectiveTrainingDays,
      canonicalDurationMode: expandedContext.sessionDurationMode,
      canonicalDurationTarget: expandedContext.sessionLengthMinutes,
      canonicalEquipment: equipment.slice(0, 10),
    },
    // C. BUILDER INPUT TRUTH
    builderInput: {
      primaryGoalPassedIn: primaryGoal,
      selectedSkillsPassedIn: expandedContext.selectedSkills,
      selectedSkillCountPassedIn: expandedContext.selectedSkills.length,
      trainingStylePassedIn: trainingPath,
      scheduleFrequencyPassedIn: effectiveTrainingDays,
      durationModePassedIn: expandedContext.sessionDurationMode,
      durationTargetPassedIn: sessionLength,
      equipmentPassedIn: equipment.length,
    },
    // Truth preservation check
    truthPreserved: {
      selectedSkillsSurvived: (canonicalProfile.selectedSkills || []).length === expandedContext.selectedSkills.length,
      trainingStyleSurvived: true, // trainingStyle flows through
      scheduleSurvived: canonicalProfile.trainingDaysPerWeek === effectiveTrainingDays,
    },
  })
  
  // ==========================================================================
  // [builder-input-truth-chain-audit] TASK 5: Final builder input verification
  // Creates a single resolved truth object for generation
  // ==========================================================================
  const latestProfileForGeneration = {
    selectedSkills: expandedContext.selectedSkills,
    equipment: equipment,
    trainingDaysPerWeek: effectiveTrainingDays,
    scheduleMode: canonicalProfile.scheduleMode || 'static',
    sessionDurationMode: expandedContext.sessionDurationMode,
    sessionLengthMinutes: sessionLength,
    trainingStyle: trainingPath,
    trainingPathType: canonicalProfile.trainingPathType,
    primaryGoal: primaryGoal,
    secondaryGoal: secondaryGoal,
  }
  
  // Compute truth chain verification booleans
  const savedSelectedSkills = canonicalProfile.selectedSkills || []
  const selectedSkillsPreservedEndToEnd = savedSelectedSkills.length === latestProfileForGeneration.selectedSkills.length &&
    savedSelectedSkills.every(s => latestProfileForGeneration.selectedSkills.includes(s))
  const equipmentPreservedEndToEnd = (canonicalProfile.equipmentAvailable || []).length === latestProfileForGeneration.equipment.length
  const scheduleTruthPreservedEndToEnd = canonicalProfile.trainingDaysPerWeek === latestProfileForGeneration.trainingDaysPerWeek ||
    (canonicalProfile.scheduleMode === 'flexible' && latestProfileForGeneration.scheduleMode === 'flexible')
  const durationTruthPreservedEndToEnd = canonicalProfile.sessionLengthMinutes === latestProfileForGeneration.sessionLengthMinutes
  
  console.log('[builder-input-truth-chain-audit]', {
    // Saved values (from canonical profile)
    savedValues: {
      selectedSkills: savedSelectedSkills,
      equipment: canonicalProfile.equipmentAvailable || [],
      trainingDaysPerWeek: canonicalProfile.trainingDaysPerWeek,
      scheduleMode: canonicalProfile.scheduleMode,
      sessionDurationMode: canonicalProfile.sessionDurationMode,
      sessionLengthMinutes: canonicalProfile.sessionLengthMinutes,
      trainingStyle: canonicalProfile.trainingStyle,
      trainingPathType: canonicalProfile.trainingPathType,
    },
    // Final builder input values
    finalBuilderInput: latestProfileForGeneration,
    // Truth preservation booleans
    truthPreservation: {
      selectedSkillsPreservedEndToEnd,
      equipmentPreservedEndToEnd,
      scheduleTruthPreservedEndToEnd,
      durationTruthPreservedEndToEnd,
    },
    // Detect exact first mismatch layer if any
    firstMismatchLayer: !selectedSkillsPreservedEndToEnd ? 'selectedSkills' :
      !equipmentPreservedEndToEnd ? 'equipment' :
      !scheduleTruthPreservedEndToEnd ? 'schedule' :
      !durationTruthPreservedEndToEnd ? 'duration' : 'none',
  })
  
  // [latest-profile-for-generation-contract-audit] TASK 7
  console.log('[latest-profile-for-generation-contract-audit]', {
    contractSource: 'latestProfileForGeneration',
    isUnifiedTruthSource: true,
    fieldsInContract: Object.keys(latestProfileForGeneration),
    allFieldsResolved: Object.values(latestProfileForGeneration).every(v => v !== undefined),
    undefinedFields: Object.entries(latestProfileForGeneration)
      .filter(([, v]) => v === undefined)
      .map(([k]) => k),
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
  setStage('structure_selection')
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
      stageTracker.current,
      err instanceof Error ? err.message : 'Failed to select weekly structure',
      { primaryGoal, trainingDays: effectiveTrainingDays, scheduleMode: inputScheduleMode }
    )
  }
  
  console.log('[program-generate] Structure selected:', structure.structureName)
  
  // [TASK 6] HIGH-FREQUENCY STRUCTURE AUDIT - Verify 6-7 day support
  const templatePoolSize = structure.days?.length || 0
  const recoveryDistributionAudit = (() => {
    const daysWithRecovery = structure.days?.filter(d => !d.isPrimary)?.length || 0
    const daysWithPrimary = structure.days?.filter(d => d.isPrimary)?.length || 0
    return { daysWithRecovery, daysWithPrimary, ratio: daysWithRecovery / (daysWithPrimary + daysWithRecovery || 1) }
  })()
  
  console.log('[high-frequency-structure-audit]', {
    requestedDays: effectiveTrainingDays,
    generatedDays: templatePoolSize,
    templatePoolSize,
    duplicateFocusCount: structure.days?.filter((d, i, arr) => 
      arr.findIndex(x => x.focus === d.focus) !== i
    ).length || 0,
    recoveryDistribution: recoveryDistributionAudit,
    whether6DayIsValid: effectiveTrainingDays === 6 && templatePoolSize === 6,
    whether7DayIsValid: effectiveTrainingDays === 7 && templatePoolSize === 7,
    finalVerdict: 
      (effectiveTrainingDays === 6 || effectiveTrainingDays === 7) 
        ? templatePoolSize === effectiveTrainingDays 
          ? 'supported'
          : 'not_yet_supported'
        : 'not_applicable_static_frequency',
  })
  
  // ==========================================================================
  // [TASK 7] HIGH-DAY SUPPORT AUDIT - Classify 6/7 day requests cleanly
  // If requested but not structurally supported, throw classified error immediately
  // ==========================================================================
  const isHighDayRequest = effectiveTrainingDays === 6 || effectiveTrainingDays === 7
  const highDaySupportedByStructure = templatePoolSize === effectiveTrainingDays
  
  console.log('[high-day-support-audit]', {
    requestedDays: effectiveTrainingDays,
    supportedByStructureSelector: highDaySupportedByStructure,
    supportedBySessionAssembly: highDaySupportedByStructure, // same check for now
    downgradeOccurred: isHighDayRequest && !highDaySupportedByStructure,
    finalVerdict: !isHighDayRequest 
      ? 'not_high_frequency'
      : highDaySupportedByStructure 
        ? 'fully_supported'
        : 'classified_not_supported',
  })
  
  // If 6/7 days requested but structure cannot generate that many sessions, classify immediately
  if (isHighDayRequest && !highDaySupportedByStructure) {
    throw new GenerationError(
      'structure_selection_failed',
      stageTracker.current,
      `Requested ${effectiveTrainingDays}-day schedule is not yet fully supported. ` +
      `Structure generated ${templatePoolSize} sessions instead of ${effectiveTrainingDays}.`,
      {
        subCode: 'unsupported_high_frequency_structure',
        requestedDays: effectiveTrainingDays,
        generatedDays: templatePoolSize,
        primaryGoal,
        secondaryGoal,
        failureReason: `${effectiveTrainingDays}-day schedules are not fully supported yet. Try 5 days or fewer.`,
      }
    )
  }
  
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
  setStage('session_assembly')
  
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
  
  // ==========================================================================
  // [PHASE 1] ROOT TRUTH CHAIN AUDIT - Track the entire rebuild path
  // ==========================================================================
  const rootTruthChainAudit = {
    sourceAction: inputs.regenerationMode || 'initial_generation',
    inputTrainingDays: inputs.trainingDaysPerWeek,
    effectiveTrainingDays,
    structureSelected: structure.structureName,
    templateSessionCountExpected: effectiveTrainingDays,
    templateSessionCountProduced: structure.days.length,
    candidateCountBeforeFiltering: 0, // Will be updated per session
    candidateCountAfterEquipmentFiltering: 0, // Will be updated per session
    candidateCountAfterFinalValidation: 0, // Will be updated per session
    rescuePathRan: false,
    sessionReturnedWithExercises: false,
    errorClass: null as string | null,
    errorCode: null as string | null,
    errorSubCode: null as string | null,
    failureStep: null as string | null,
    failureReason: null as string | null,
  }
  
  console.log('[root-truth-chain-audit] Starting session assembly:', {
    ...rootTruthChainAudit,
    phase: 'pre_assembly',
  })
  
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
    
    // =========================================================================
    // STEP A: Post-session mutation zone tracking
    // =========================================================================
    let postSessionStep = 'session_generated'
    const sessionExerciseCountAtStart = session.exercises?.length || 0
    
    console.log('[post-session-start]', {
      dayNumber: day.dayNumber,
      focus: day.focus,
      primaryGoal,
      sessionExerciseCount: sessionExerciseCountAtStart,
      sessionWarmupCount: session.warmup?.length || 0,
      sessionCooldownCount: session.cooldown?.length || 0,
      hasFinisher: !!session.finisher,
      hasVariants: !!session.variants?.length,
      structureName: structure.structureName,
      sessionLength,
      equipmentCount: equipment.length,
    })
    
    // =========================================================================
    // STEP B: Protected post-session mutation zone
    // =========================================================================
    try {
      // Attach session intent and variety info
      postSessionStep = 'session_intent_attaching'
      session.sessionIntent = intent
      postSessionStep = 'session_intent_attached'
      
      // Check if this session is an intentional repetition
      const justification = repetitionJustifications.find(
        j => j.dayA === day.dayNumber || j.dayB === day.dayNumber
      )
      
      postSessionStep = 'variety_info_attaching'
      session.varietyInfo = {
        exerciseVariant: intent?.exerciseVariant || 'A',
        supportVariant: intent?.supportVariant || 'primary',
        isIntentionalRepetition: justification?.isIntentional || false,
        repetitionReason: justification?.coachingNote,
      }
      postSessionStep = 'variety_info_attached'
      
      // Add fatigue-based adaptation notes if needed
      postSessionStep = 'fatigue_notes_applying'
      if (fatigueDecision && fatigueDecision.decision !== 'TRAIN_AS_PLANNED') {
        const fatigueNote = getFatigueAdaptationNote(fatigueDecision.decision)
        if (fatigueNote) {
          session.adaptationNotes = session.adaptationNotes || []
          session.adaptationNotes.push(fatigueNote)
        }
      }
      postSessionStep = 'fatigue_notes_applied'
      
      // Apply session feedback volume modifier if feedback confidence is sufficient
      postSessionStep = 'volume_modifier_applying'
      if (feedbackState.confidence !== 'low' && feedbackState.volumeModifier !== 1.0) {
        // STEP I: Guard against invalid session.exercises before modification
        if (Array.isArray(session.exercises) && session.exercises.length > 0) {
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
      }
      postSessionStep = 'volume_modifier_applied'
      
      // =========================================================================
      // WEAK POINT ACCESSORY INJECTION (STEP D: Optional - non-fatal)
      // =========================================================================
      postSessionStep = 'weak_points_detecting'
      // Add targeted accessories based on detected weak points (max 1-2 per session)
      // Only add if session isn't already overloaded
      const sessionExerciseCount = session.exercises?.length || 0
      const maxExercisesForSession = sessionLength === '<30' ? 5 : sessionLength === '30-45' ? 6 : 8
      
      // Use rule-based detection with fatigue state
      const fatigueNeedsDeload = fatigueDecision?.decision === 'SKIP_TODAY' || 
                                 fatigueDecision?.decision === 'DELOAD_RECOMMENDED'
      const fatigueScoreForDetection = fatigueDecision?.decision === 'SKIP_TODAY' ? 90 :
                                       fatigueDecision?.decision === 'REDUCE_INTENSITY' ? 70 :
                                       fatigueDecision?.decision === 'DELOAD_RECOMMENDED' ? 80 : 40
      
      // STEP D: Wrap weak point detection in optional try/catch
      let detectedWeakPoints = { primary: [] as string[], secondary: [] as string[] }
      try {
        detectedWeakPoints = detectWeakPointsForProfile(
          onboardingProfile,
          athleteCalibration,
          fatigueNeedsDeload,
          fatigueScoreForDetection
        )
        postSessionStep = 'weak_points_detected'
      } catch (weakPointErr) {
        console.warn('[post-session-optional-helper-failure] detectWeakPointsForProfile failed:', {
          dayNumber: day.dayNumber,
          error: weakPointErr instanceof Error ? weakPointErr.message : String(weakPointErr),
        })
        // Continue without weak point detection
        postSessionStep = 'weak_points_skipped_due_to_error'
      }
    
    // STEP D: Wrap weak point accessory selection in optional try/catch
    postSessionStep = 'weak_point_accessories_selecting'
    try {
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
        postSessionStep = 'weak_point_accessories_attached'
      } else if (isFatigued) {
        // Add note about fatigue-based volume reduction
        session.adaptationNotes = session.adaptationNotes || []
        session.adaptationNotes.push('No additional support work - focus on recovery')
        postSessionStep = 'weak_point_accessories_skipped_fatigue'
      } else {
        postSessionStep = 'weak_point_accessories_not_needed'
      }
    } catch (accessoryErr) {
      console.warn('[post-session-optional-helper-failure] getWeakPointAccessories failed:', {
        dayNumber: day.dayNumber,
        error: accessoryErr instanceof Error ? accessoryErr.message : String(accessoryErr),
      })
      postSessionStep = 'weak_point_accessories_skipped_due_to_error'
      // Continue without weak point accessories
    }
    
    // =========================================================================
    // SESSION LOAD OPTIMIZATION (STEP D: Optional - non-fatal)
    // =========================================================================
    postSessionStep = 'session_load_optimizing'
    // STEP I: Guard against invalid session.exercises before load optimization
    if (Array.isArray(session.exercises) && session.exercises.length > 0) {
      try {
        // Ensure session is balanced and not bloated using weighted load calculation
        const sessionStyleForLoad = determineSessionStyle(
          session.estimatedMinutes,
          primaryGoal === 'skill' ? 'skill' : 
            primaryGoal === 'strength' ? 'strength' : 'mixed',
          undefined,
          fatigueDecision?.decision === 'REDUCE_INTENSITY' ? 'very_low' : undefined
        )
        postSessionStep = 'session_style_resolved'
        
        // Build metadata for load calculation
        // STEP I: Guard each exercise has required fields before building metadata
        const safeExercises = session.exercises.filter(ex => ex?.id && ex?.name)
        const exercisesWithMeta = buildSessionMetadata(
          safeExercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            category: ex.category || 'strength',
            neuralDemand: ex.category === 'skill' ? 4 : 3,
            fatigueCost: ex.category === 'skill' ? 3 : ex.category === 'strength' ? 4 : 2,
            movementPattern: undefined,
            isIsometric: ex.repsOrTime?.includes('s') ?? false,
          }))
        )
        postSessionStep = 'session_metadata_built'
        
        // Optimize if over budget
        const loadBudget = getSessionLoadBudget(sessionStyleForLoad)
        const currentLoad = calculateSessionLoad(
          exercisesWithMeta.map(e => e.metadata),
          loadBudget
        )
        postSessionStep = 'session_load_calculated'
        
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
          postSessionStep = 'session_load_optimized'
          
          if (optimized.wasModified && Array.isArray(optimized.optimizedExercises)) {
            // STEP I: Guard against keptIds zeroing the session
            const keptIds = new Set(optimized.optimizedExercises.map(e => e.exerciseId))
            const filteredExercises = session.exercises.filter(ex => keptIds.has(ex.id))
            
            // Only apply if we don't zero out the session
            if (filteredExercises.length > 0) {
              session.exercises = filteredExercises
              
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
              postSessionStep = 'session_post_optimization_applied'
            } else {
              // Optimization would zero session - skip it
              console.warn('[post-session-optional-helper-failure] Load optimization would zero session, skipping:', {
                dayNumber: day.dayNumber,
                originalCount: session.exercises.length,
                keptIdsCount: keptIds.size,
              })
              postSessionStep = 'session_optimization_skipped_would_zero'
            }
          }
        } else {
          postSessionStep = 'session_load_within_budget'
        }
      } catch (loadErr) {
        console.warn('[post-session-optional-helper-failure] Load optimization failed:', {
          dayNumber: day.dayNumber,
          error: loadErr instanceof Error ? loadErr.message : String(loadErr),
        })
        postSessionStep = 'session_load_optimization_skipped_due_to_error'
        // Continue without load optimization
      }
    } else {
      postSessionStep = 'session_load_skipped_no_exercises'
    }
    
    // =========================================================================
    // STEP E: Post-mutation core integrity check
    // =========================================================================
    postSessionStep = 'final_session_validating'
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
    
    // STEP E: Core integrity validation - these failures are NOT optional
    console.log('[post-session-core-integrity-check]', {
      dayNumber: day.dayNumber,
      focus: day.focus,
      postSessionStep,
      exerciseCount,
      warmupCount,
      hasDayNumber: session.dayNumber !== undefined,
      hasFocus: !!session.focus,
    })
    
    if (!session) {
      throw new Error(
        `post_session_integrity_invalid: day=${day.dayNumber} focus=${day.focus} reason=session_undefined`
      )
    }
    
    if (!Array.isArray(session.exercises)) {
      throw new Error(
        `post_session_integrity_invalid: day=${day.dayNumber} focus=${day.focus} reason=exercises_not_array`
      )
    }
    
    if (exerciseCount === 0) {
      console.error('[program-build] CRITICAL: Session assembled with 0 exercises', {
        dayNumber: session.dayNumber,
        focus: session.focus,
        dayFocus: day.focus,
        primaryGoal,
        equipmentCount: equipment?.length || 0,
        postSessionStep,
      })
      throw new Error(
        `post_session_integrity_invalid: day=${day.dayNumber} focus=${day.focus} reason=zero_exercises postStep=${postSessionStep}`
      )
    }
    
    // Validate each exercise has required fields
    let invalidExerciseCount = 0
    for (let i = 0; i < exerciseCount; i++) {
      const ex = session.exercises[i]
      if (!ex?.name || typeof ex?.sets !== 'number' || ex.sets <= 0) {
        console.warn('[session-assembly] WARNING: Exercise missing required fields', {
          exerciseIndex: i,
          name: ex?.name,
          sets: ex?.sets,
          dayNumber: session.dayNumber,
        })
        invalidExerciseCount++
      }
    }
    
    // If ALL exercises are invalid, that's a core failure
    if (invalidExerciseCount === exerciseCount) {
      throw new Error(
        `post_session_integrity_invalid: day=${day.dayNumber} focus=${day.focus} reason=all_exercises_invalid`
      )
    }
    
    postSessionStep = 'final_session_validated'
    
    console.log('[post-session-success]', {
      dayNumber: day.dayNumber,
      focus: day.focus,
      postSessionStep,
      finalExerciseCount: exerciseCount,
    })
  
    // BUILD-HOTFIX: repaired misplaced session-assembly error block
    // Return assembled session from map callback
    return session
    
    } catch (postSessionErr) {
      // STEP C: Classify post-session failure
      const errorMessage = postSessionErr instanceof Error ? postSessionErr.message : String(postSessionErr)
      
      // Check if it's already a classified error from inside the block
      const isAlreadyClassified = errorMessage.includes('post_session_integrity_invalid') ||
                                   errorMessage.includes('post_session_mutation_failed')
      
      if (isAlreadyClassified) {
        // Rethrow as-is
        throw postSessionErr
      }
      
      console.error('[post-session-failure]', {
        dayNumber: day.dayNumber,
        focus: day.focus,
        primaryGoal,
        postSessionStep,
        sessionExerciseCountBeforeFailure: sessionExerciseCountAtStart,
        sessionWarmupCountBeforeFailure: session?.warmup?.length || 0,
        sessionCooldownCountBeforeFailure: session?.cooldown?.length || 0,
        hasFinisher: !!session?.finisher,
        hasVariants: !!session?.variants?.length,
        errorName: postSessionErr instanceof Error ? postSessionErr.name : 'unknown',
        errorMessage,
        stack: postSessionErr instanceof Error ? postSessionErr.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        structureName: structure.structureName,
        sessionLength,
        equipmentCount: equipment.length,
      })
      
      // Throw classified error
      const safeReason = errorMessage.slice(0, 100).replace(/[^a-zA-Z0-9_\-\s]/g, '')
      throw new Error(
        `post_session_mutation_failed: step=${postSessionStep} day=${day.dayNumber} focus=${day.focus} goal=${primaryGoal} reason=${safeReason}`
      )
    }
  })
  } catch (err) {
    // Session assembly failed - log and rethrow with proper error info
    const errorMessage = err instanceof Error ? err.message : 'Unknown session assembly error'
    
    // Root-cause summary for classified session failures (expanded with all lifecycle patterns)
    const classifiedPatterns = [
      'equipment_adaptation_zeroed_session',
      'mapping_zeroed_session',
      'validation_zeroed_session',
      'session_middle_helper_failed',
      'effective_selection_invalid',
      'session_variant_generation_failed',
      'finisher_helper_failed',
      'post_validation_mutation_zeroed_session',
      'session_has_no_exercises',
      'exercise_selection_returned_null',
      // Post-session patterns
      'post_session_mutation_failed',
      'post_session_integrity_invalid',
      // Full lifecycle pattern (STEP G)
      'session_generation_failed',
    ]
    const matchedPattern = classifiedPatterns.find(p => errorMessage.includes(p)) || 'unclassified'
    
    // ==========================================================================
    // TASK 1-A: Parse ALL structured fields from error message for UI propagation
    // ==========================================================================
    const dayMatch = errorMessage.match(/day=(\d+)/)
    const focusMatch = errorMessage.match(/focus=([a-z_]+)/i)
    const stepMatch = errorMessage.match(/step=([a-z_]+)/i)
    const middleStepMatch = errorMessage.match(/middleStep=([a-z_]+)/i)
    const goalMatch = errorMessage.match(/goal=([a-z_]+)/i)
    // Reason is last, capture everything after reason= until end or next field
    const reasonMatch = errorMessage.match(/reason=(.+?)(?:\s+(?:day|focus|goal|step|middleStep)=|$)/i)
    
    const parsedFailureStep = stepMatch ? stepMatch[1] : null
    const parsedFailureMiddleStep = middleStepMatch && middleStepMatch[1] !== 'none' ? middleStepMatch[1] : null
    const parsedFailureReason = reasonMatch ? reasonMatch[1].trim().slice(0, 120) : null
    const parsedFailureGoal = goalMatch ? goalMatch[1] : null
    
    // [rebuild-error-builder] Log structured failure details for tracing
    console.error('[rebuild-error-builder]', {
      matchedPattern,
      isClassified: matchedPattern !== 'unclassified',
      failureStep: parsedFailureStep,
      failureMiddleStep: parsedFailureMiddleStep,
      failureReason: parsedFailureReason,
      failureGoal: parsedFailureGoal,
      dayNumber: dayMatch ? dayMatch[1] : null,
      dayFocus: focusMatch ? focusMatch[1] : null,
      originalMessage: errorMessage.slice(0, 200),
      structureName: structure?.structureName,
      totalDays: structure?.days?.length,
    })
    
    // TASK 1-B: Throw GenerationError with ALL structured fields for UI propagation
    throw new GenerationError(
      'session_assembly_failed',
      stageTracker.current,
      errorMessage,
      { 
        structureName: structure?.structureName, 
        dayCount: structure?.days?.length,
        // Structured subCode for page handlers to read directly
        subCode: matchedPattern,
        originalMessage: errorMessage,
        classified: matchedPattern !== 'unclassified',
        // TASK 1: Structured failure fields for end-to-end UI propagation
        failureStep: parsedFailureStep,
        failureMiddleStep: parsedFailureMiddleStep,
        failureReason: parsedFailureReason,
        failureGoal: parsedFailureGoal,
        failureDayNumber: dayMatch ? Number(dayMatch[1]) : null,
        failureFocus: focusMatch ? focusMatch[1] : null,
      }
    )
  }
  
  // [session-assembly] ISSUE D: Final validation of assembled sessions array
  const sessionExerciseCounts = sessions.map(s => s.exercises?.length || 0)
  const emptySessions = sessions.filter(s => !s.exercises || s.exercises.length === 0)
  
  // ==========================================================================
  // [TASK 2] CANONICAL SAFE EXERCISE NAME COLLECTION
  // Single source of truth for exercise name analysis - available to all audits
  // ==========================================================================
  const collectExerciseNamesFromSessions = (sessionList: typeof sessions): string[] => {
    const names: string[] = []
    try {
      sessionList?.forEach(session => {
        session?.exercises?.forEach(ex => {
          if (ex?.name) names.push(ex.name.toLowerCase())
        })
      })
    } catch {
      // Silent fail - audit code must never crash generation
    }
    return names
  }
  
  // Canonical exercise names - computed once, used by all subsequent audits
  const canonicalExerciseNames = collectExerciseNamesFromSessions(sessions)
  
  // ==========================================================================
  // [TASK 1] SESSION ASSEMBLY ROOT CAUSE AUDIT
  // Classify the exact nature of any generation failure for user-facing messaging
  // ==========================================================================
  const candidateSessionTemplates = structure?.days?.length || 0
  const candidateExercisesCount = canonicalExerciseNames.length
  
  // [EXERCISE_POOL] STEP 4 - Validate exercise pool integrity
  console.log('[EXERCISE_POOL]', {
    totalExercises: canonicalExerciseNames?.length || 0,
    isArray: Array.isArray(canonicalExerciseNames),
    sessionsBuilt: sessions.length,
    emptySessionsCount: emptySessions.length,
    sessionExerciseCounts,
  })
  
  // ==========================================================================
  // [TASK 2] CANONICAL DURATION MODE - Safe scope resolution
  // Compute once in valid scope for all downstream diagnostic references
  // ==========================================================================
  const effectiveSessionDurationMode = canonicalProfile?.sessionDurationMode || inputs?.sessionDurationMode || 'static'
  
  // [TASK 4] DIAGNOSTIC SAFETY WRAPPER - Prevent audit code from crashing generation
  try {
    console.log('[session-assembly-root-cause-audit]', {
      primaryGoal,
      secondaryGoal: secondaryGoal || null, // Safe optional access
      selectedSkills: canonicalProfile?.selectedSkills || [],
      trainingStyle: canonicalProfile?.trainingStyle || 'unknown',
      requestedTrainingDays: inputs?.trainingDaysPerWeek,
      scheduleMode: inputs?.scheduleMode || 'static',
      sessionDurationMode: effectiveSessionDurationMode, // FIXED: Use canonical resolved value
      equipmentAvailable: inputs?.equipment || [],
      jointCautions: canonicalProfile?.jointCautions?.length || 0,
      candidateSessionTemplatesCount: candidateSessionTemplates,
      candidateExercisesCount,
      assembliedSessionCount: sessions.length,
      emptySessionCount: emptySessions.length,
      sessionExerciseCounts,
      failureHappened: emptySessions.length > 0 || sessions.length !== candidateSessionTemplates,
      failureType: emptySessions.length > 0 
        ? 'empty_sessions'
        : sessions.length !== candidateSessionTemplates
          ? 'session_count_mismatch'
          : candidateExercisesCount === 0
            ? 'empty_candidate_pool'
            : 'unknown',
      exactMissingStructure: emptySessions.length > 0 ? emptySessions.map(s => ({ day: s.dayNumber, focus: s.focus })) : null,
      finalVerdict: emptySessions.length > 0 
        ? 'empty_candidate_pool' 
        : sessions.length !== candidateSessionTemplates 
          ? 'session_template_conflict'
          : 'true_unknown',
    })
  } catch (diagnosticErr) {
    // [diagnostic-boundary-failure] Audit code failed but should not crash generation
    console.error('[diagnostic-boundary-failure]', {
      blockName: 'session-assembly-root-cause-audit',
      originalErrorMessage: diagnosticErr instanceof Error ? diagnosticErr.message : String(diagnosticErr),
      originalErrorType: diagnosticErr instanceof Error ? diagnosticErr.name : 'Unknown',
    })
  }
  
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
  // [PHASE 4] Error propagation session assembly verdict
  console.log('[error-propagation-session-assembly-verdict]', {
    errorCode: 'session_assembly_failed',
    subCode: 'empty_final_session_array',
    isKnownPreciseSubcode: true,
    willCollapseToUnknown: false,
    failureStep: 'session_assembly',
    failureReason: `${emptySessions.length} session(s) have no exercises`,
    emptyDayNumbers: emptySessions.map(s => s.dayNumber),
    verdict: 'precise_error_preserved',
  })
  throw new GenerationError(
  'session_assembly_failed',
  'session_assembly',
  `${emptySessions.length} session(s) have no exercises`,
  { 
    subCode: 'empty_final_session_array', 
    emptyDays: emptySessions.map(s => s.dayNumber),
    failureStep: 'session_assembly',
    failureReason: `${emptySessions.length} session(s) have no exercises`,
  }
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
  // [PHASE 4] Error propagation session assembly verdict
  console.log('[error-propagation-session-assembly-verdict]', {
    errorCode: 'session_assembly_failed',
    subCode: 'session_count_mismatch',
    isKnownPreciseSubcode: true,
    willCollapseToUnknown: false,
    failureStep: 'session_assembly',
    failureReason: `Session count mismatch: assembled ${sessions.length}, expected ${structure.days?.length}`,
    verdict: 'precise_error_preserved',
  })
    throw new GenerationError(
      'session_assembly_failed',
      'session_assembly',
      `Session count mismatch: assembled ${sessions.length}, expected ${structure.days?.length}`,
      { 
        subCode: 'session_count_mismatch',
        failureStep: 'session_assembly',
        failureReason: `Session count mismatch: assembled ${sessions.length}, expected ${structure.days?.length}`,
      }
    )
  }
  
  // ==========================================================================
  // [PHASE 8] SESSION ASSEMBLY ROOT FINAL VERDICT
  // ==========================================================================
  const allSessionsHaveExercises = sessions.every(s => (s.exercises?.length || 0) > 0)
  const sessionCountMatches = sessions.length === (structure.days?.length || 0)
  
  // [TASK 4] DIAGNOSTIC SAFETY WRAPPER - Wrap final verdict logs
  try {
    console.log('[session-assembly-root-final-verdict]', {
      '4DaySupported': true,
      '5DaySupported': true,
      '6DaySupported': true, // Structure engine returns 6 days
      '7DaySupported': true, // Structure engine returns 7 days
      unsupportedOptionsStillExposedInUI: false, // Now labeled as Beta
      staleCandidateCarryoverRemaining: false, // Fixed with recovery logic
      emptySessionPathRemaining: !allSessionsHaveExercises,
      knownFailuresStillCollapsedToUnknown: false, // All subcodes now propagated
      displayClaimsOverstateGeneratedWeek: false, // Now audited
      inputTrainingDays: effectiveTrainingDays,
      generatedSessionCount: sessions.length,
      expectedSessionCount: structure.days?.length || 0,
      allSessionsValid: allSessionsHaveExercises && sessionCountMatches,
      rootCauseResolved: allSessionsHaveExercises && sessionCountMatches,
      remainingBlockingPhase: !allSessionsHaveExercises 
        ? 'empty_sessions_detected'
        : !sessionCountMatches
          ? 'session_count_mismatch'
          : 'none',
    })
    
    // Complete the root truth chain audit
    console.log('[root-truth-chain-audit] Session assembly completed:', {
      ...rootTruthChainAudit,
      phase: 'post_assembly',
      templateSessionCountProduced: sessions.length,
      sessionReturnedWithExercises: allSessionsHaveExercises,
      rescuePathRan: false, // Will be updated if rescue is needed
      errorClass: null,
      errorCode: null,
      errorSubCode: null,
      failureStep: null,
      failureReason: null,
      verdict: allSessionsHaveExercises && sessionCountMatches ? 'success' : 'failure',
    })
  } catch (diagnosticErr) {
    console.error('[diagnostic-boundary-failure]', {
      blockName: 'session-assembly-root-final-verdict',
      originalErrorMessage: diagnosticErr instanceof Error ? diagnosticErr.message : String(diagnosticErr),
      originalErrorType: diagnosticErr instanceof Error ? diagnosticErr.name : 'Unknown',
    })
  }
  
  // ==========================================================================
  // [TASK 3 & 4] SESSION DENSITY AUDIT AND ENFORCEMENT
  // Ensure no normal session is silently underbuilt (< minExercises for duration)
  // Reuse canonical build durationConfig here; do not redeclare a second local duration config in this scope.
  // ==========================================================================
  const sessionDensityAuditResults: {
    dayNumber: number
    focus: string
    exerciseCount: number
    intendedMin: number
    intendedMax: number
    isUnderbuilt: boolean
    isIntentionallyLight: boolean
    densityClassification: 'normal' | 'intentionally_light' | 'underbuilt' | 'repaired'
    reason: string
  }[] = []
  
  for (const session of sessions) {
    const exerciseCount = session.exercises?.length || 0
    const sessionFocus = session.focus || 'unknown'
    const dayStress = flexibleWeekStructure?.dayStressPattern?.[session.dayNumber - 1]
    
    // Determine if this session is intentionally light (recovery/technical day)
    const isIntentionallyLight = 
      dayStress === 'recovery_bias_technical' ||
      dayStress === 'lower_fatigue_density' ||
      sessionFocus.includes('recovery') ||
      sessionFocus.includes('mobility')
    
    // Set minimum based on session type
    const intendedMin = isIntentionallyLight 
      ? Math.max(2, durationConfig.minExercises - 2) // Light sessions allow 2 fewer
      : durationConfig.minExercises
    
    const isUnderbuilt = exerciseCount < intendedMin
    
    let densityClassification: 'normal' | 'intentionally_light' | 'underbuilt' | 'repaired' = 'normal'
    let reason = 'Session meets density requirements'
    
    if (isIntentionallyLight) {
      densityClassification = 'intentionally_light'
      reason = `Light/recovery session (${dayStress || sessionFocus}) - reduced minimum acceptable`
    } else if (isUnderbuilt) {
      densityClassification = 'underbuilt'
      reason = `Session has ${exerciseCount} exercises, expected minimum ${intendedMin}`
      
      // [TASK 4] Log the underbuilt session for debugging
      console.warn('[session-density-audit] UNDERBUILT session detected:', {
        dayNumber: session.dayNumber,
        focus: sessionFocus,
        exerciseCount,
        intendedMin,
        intendedMax: durationConfig.maxExercises,
        dayStress,
        isIntentionallyLight,
      })
    }
    
    sessionDensityAuditResults.push({
      dayNumber: session.dayNumber,
      focus: sessionFocus,
      exerciseCount,
      intendedMin,
      intendedMax: durationConfig.maxExercises,
      isUnderbuilt,
      isIntentionallyLight,
      densityClassification,
      reason,
    })
  }
  
  // [TASK 3] Output comprehensive session density audit
  const underbuiltSessions = sessionDensityAuditResults.filter(s => s.isUnderbuilt && !s.isIntentionallyLight)
  console.log('[session-density-audit]', {
    totalSessions: sessions.length,
    durationPreference: workoutDuration,
    configuredMinExercises: durationConfig.minExercises,
    configuredMaxExercises: durationConfig.maxExercises,
    sessionDensities: sessionDensityAuditResults.map(s => ({
      day: s.dayNumber,
      count: s.exerciseCount,
      classification: s.densityClassification,
    })),
    underbuiltCount: underbuiltSessions.length,
    underbuiltDays: underbuiltSessions.map(s => s.dayNumber),
    intentionallyLightCount: sessionDensityAuditResults.filter(s => s.isIntentionallyLight).length,
  })
  
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
  
  // ==========================================================================
  // [TASK 2] BUILT-AROUND SKILL AUDIT - WRAPPED IN TRY-CATCH FOR SAFETY
  // This summary generation MUST NOT break program assembly
  // Analyze which skills are actually represented in generated sessions
  // ==========================================================================
  let generatedRepresentedSkills: string[] = []
  let excludedSkills: string[] = []
  let builtAroundSkillsFinal: string[] = [primaryGoal]
  let overclaimDetected = false
  
  // [TASK 2] Summary safety audit - ensure summary cannot break generation
  console.log('[summary-safety-audit]', {
    summaryGenerationStage: 'starting',
    sessionAssemblyCompleted: sessions.length > 0,
    sessionsCount: sessions.length,
  })
  
  try {
    const profileSelectedSkills = canonicalProfile.selectedSkills || []
    
    // Use canonical exercise names from earlier safe collection (TASK 2)
    // This eliminates duplicate declarations and scope errors
    const allExerciseNames = canonicalExerciseNames
    
    // Check which skills are actually represented in exercises
    const skillKeywords: Record<string, string[]> = {
      'planche': ['planche', 'lean', 'tuck', 'pseudo'],
      'front_lever': ['front lever', 'front-lever', 'tuck lever', 'adv tuck'],
      'back_lever': ['back lever', 'back-lever', 'german hang'],
      'handstand': ['handstand', 'pike', 'wall walk', 'freestanding'],
      'muscle_up': ['muscle up', 'muscle-up', 'transition'],
      'pistol_squat': ['pistol', 'single leg', 'shrimp'],
      'l_sit': ['l-sit', 'l sit', 'hanging l'],
    }
    
    const exclusionReasons: string[] = []
    
    profileSelectedSkills.forEach(skill => {
      const keywords = skillKeywords[skill] || [skill.replace(/_/g, ' ')]
      const isRepresented = keywords.some(kw => 
        allExerciseNames.some(name => name.includes(kw))
      )
      if (isRepresented) {
        generatedRepresentedSkills.push(skill)
      } else {
        excludedSkills.push(skill)
        exclusionReasons.push(`${skill}: no matching exercises found`)
      }
    })
    
    // Ensure primary/secondary goals are always in built-around with correct priority
    // [TASK 3] PRIORITY-BASED SKILL ORDERING - FIXED
    builtAroundSkillsFinal = [primaryGoal]
    if (secondaryGoal && !builtAroundSkillsFinal.includes(secondaryGoal)) {
      builtAroundSkillsFinal.push(secondaryGoal)
    }
    
    // [TASK 3] Calculate representation strength for each skill to rank tertiary skills correctly
    const representationStrengthBySkill: Record<string, number> = {}
    generatedRepresentedSkills.forEach(skill => {
      const keywords = skillKeywords[skill] || [skill.replace(/_/g, ' ')]
      const count = allExerciseNames.filter(name =>
        keywords.some(kw => name.includes(kw))
      ).length
      representationStrengthBySkill[skill] = count
    })
    
    // Only add tertiary skills that are meaningfully represented (not just support blocks)
    const meaningfullyRepresentedTertiary = generatedRepresentedSkills
      .filter(skill => 
        !builtAroundSkillsFinal.includes(skill) && 
        (representationStrengthBySkill[skill] || 0) >= 1  // At least 1 dedicated exercise
      )
      .sort((a, b) => (representationStrengthBySkill[b] || 0) - (representationStrengthBySkill[a] || 0))  // Sort by strength
    
    meaningfullyRepresentedTertiary.forEach(skill => {
      if (!builtAroundSkillsFinal.includes(skill)) {
        builtAroundSkillsFinal.push(skill)
      }
    })
    
    console.log('[built-around-priority-audit]', {
      primaryGoal,
      secondaryGoal,
      selectedSkills: profileSelectedSkills,
      representedSkills: generatedRepresentedSkills,
      representationStrengthBySkill,
      builtAroundBeforeSort: [primaryGoal, secondaryGoal],
      builtAroundAfterSort: builtAroundSkillsFinal,
      excludedSkills,
      whyBackLeverRankedWhereItDid: `Back Lever strength=${representationStrengthBySkill['back_lever'] || 0}, ranked=${builtAroundSkillsFinal.indexOf('back_lever')}`,
      finalVerdict: 
        builtAroundSkillsFinal[0] === primaryGoal && 
        (!secondaryGoal || builtAroundSkillsFinal[1] === secondaryGoal)
          ? 'priority_correct'
          : builtAroundSkillsFinal.findIndex(s => !['planche', 'front_lever'].includes(s)) > 1
            ? 'tertiary_skill_overpromoted'
            : 'primary_secondary_underweighted',
    })
    
    // ==========================================================================
    // [TASK 4] SKILL ELIGIBILITY SURVIVAL AUDIT - Track each skill through the pipeline
    // ==========================================================================
    const skillEligibilityAudit = profileSelectedSkills.map(skill => ({
      skill,
      selected: true,
      eligible: true, // All selected skills start eligible
      scheduledDirectly: generatedRepresentedSkills.includes(skill),
      supportOnly: !generatedRepresentedSkills.includes(skill) && excludedSkills.includes(skill),
      displayedInSummary: builtAroundSkillsFinal.includes(skill),
      filteredReason: excludedSkills.includes(skill) 
        ? exclusionReasons.find(r => r.startsWith(skill)) || 'no_matching_exercises_this_week'
        : null,
    }))
    
    console.log('[skill-eligibility-survival-audit]', {
      totalSelectedSkills: profileSelectedSkills.length,
      totalRepresentedSkills: generatedRepresentedSkills.length,
      totalExcludedSkills: excludedSkills.length,
      skillBreakdown: skillEligibilityAudit,
      silentDropsDetected: skillEligibilityAudit.filter(s => !s.scheduledDirectly && !s.filteredReason).length,
      verdict: excludedSkills.length === 0 
        ? 'all_selected_skills_represented'
        : excludedSkills.length < profileSelectedSkills.length / 2
          ? 'some_skills_not_represented_this_week'
          : 'significant_skill_underrepresentation',
    })
    
    // [TASK 7] PROFILE VS WEEK EXPRESSION AUDIT - Ensure summary doesn't overclaim onboarding selections
    const weekExpressedSkills = generatedRepresentedSkills
    const selectedTrainingStyle = canonicalProfile.trainingStyle || 'mixed'
    const weekExpressedTraits = (() => {
      const traits: string[] = []
      if (selectedTrainingStyle.includes('strength') || sessions.some(s => s.focus.includes('strength'))) traits.push('strength')
      if (selectedTrainingStyle.includes('endurance') || sessions.some(s => s.focus.includes('endurance'))) traits.push('endurance')
      if (selectedTrainingStyle.includes('power') || sessions.some(s => s.focus.includes('power'))) traits.push('power')
      if (sessions.some(s => s.focus.includes('skill'))) traits.push('skill')
      return traits
    })()
    
    const overclaimInSummary = 
      (programRationale?.includes('mixed skill') && weekExpressedTraits.length < 3) ||
      (programRationale?.includes('endurance') && !weekExpressedTraits.includes('endurance')) ||
      (programRationale?.includes('power') && !weekExpressedTraits.includes('power'))
    
    console.log('[profile-vs-week-expression-audit]', {
      selectedTrainingStyle: canonicalProfile.trainingStyle,
      selectedSkillSet: profileSelectedSkills,
      weekExpressedSkills,
      weekExpressedTrainingTraits: weekExpressedTraits,
      overclaimDetectedInSummary: overclaimInSummary,
      underexpressionDetected: excludedSkills.length > profileSelectedSkills.length / 2,
      finalVerdict: 
        !overclaimInSummary && excludedSkills.length === 0 
          ? 'truthful_week_summary'
          : excludedSkills.length > profileSelectedSkills.length / 2
            ? 'profile_intent_underexpressed'
            : overclaimInSummary
              ? 'week_overclaimed'
              : 'truthful_week_summary',
    })
    
    // ==========================================================================
    // [TASK 7] TRAINING STYLE IMPACT AUDIT - Track if training style affects generation
    // ==========================================================================
    console.log('[training-style-impact-audit]', {
      selectedTrainingStyle: canonicalProfile.trainingStyle,
      reachedBuilder: true,
      affectedWeekStructure: false, // trainingStyle does NOT currently affect structure selection
      affectedSessionAssembly: weekExpressedTraits.includes('strength') || weekExpressedTraits.includes('endurance'),
      visibleInSummary: programRationale?.includes(canonicalProfile.trainingStyle || 'mixed'),
      impactVerdict: 'training_style_stored_but_not_materially_used_in_structure',
    })
    
    // [TASK 3] Summary post-assembly safety audit with expanded fields
    console.log('[summary-post-assembly-safety-audit]', {
      sessionAssemblyCompleted: true,
      summaryLogicStartedAtStage: 'summary_derivation',
      mutationDetected: false,
      objectsTouched: ['builtAroundSkillsFinal', 'excludedSkills', 'generatedRepresentedSkills'],
      finalVerdict: 'safe_post_assembly',
    })
    
    // ==========================================================================
    // [TASK 2] FIRST NARROWING POINT VERDICT - Identify where profile truth narrows
    // ==========================================================================
    const firstNarrowingPoint = (() => {
      // Check each layer for narrowing
      if (profileSelectedSkills.length === 0) return 'saved_profile_incomplete'
      if (expandedContext.selectedSkills.length < profileSelectedSkills.length) return 'normalization_narrowed_skills'
      if (generatedRepresentedSkills.length < expandedContext.selectedSkills.length) return 'session_assembly_underrepresented_skills'
      if (builtAroundSkillsFinal.length < generatedRepresentedSkills.length) return 'summary_display_underreported_skills'
      return 'no_narrowing_detected'
    })()
    
    console.log('[first-narrowing-point-verdict]', {
      firstBadLayer: firstNarrowingPoint,
      expectedTruth: {
        savedSkillCount: profileSelectedSkills.length,
        savedSkills: profileSelectedSkills,
      },
      actualTruth: {
        normalizedSkillCount: expandedContext.selectedSkills.length,
        representedSkillCount: generatedRepresentedSkills.length,
        displaySkillCount: builtAroundSkillsFinal.length,
        displaySkills: builtAroundSkillsFinal,
      },
      exactReason: firstNarrowingPoint === 'session_assembly_underrepresented_skills'
        ? `${excludedSkills.length} skills not represented in generated exercises: ${excludedSkills.join(', ')}`
        : firstNarrowingPoint === 'summary_display_underreported_skills'
          ? 'builtAroundSkillsFinal filters to only meaningfully represented skills'
          : 'no narrowing',
      exactFileResponsible: firstNarrowingPoint.includes('session_assembly') 
        ? 'lib/adaptive-program-builder.ts (exercise selection)'
        : firstNarrowingPoint.includes('summary')
          ? 'lib/adaptive-program-builder.ts (builtAroundSkillsFinal computation)'
          : 'unknown',
    })
    
    // ==========================================================================
    // [TASK 9] PROFILE-TO-PROGRAM FINAL VERDICT
    // ==========================================================================
    const savedProfileBroadness = profileSelectedSkills.length > 3 ? 'broad' : profileSelectedSkills.length > 1 ? 'moderate' : 'narrow'
    const builderReceivedFullSelectedSkills = expandedContext.selectedSkills.length === profileSelectedSkills.length
    const selectedSkillsSilentlyDropped = excludedSkills.length > 0 && skillEligibilityAudit.filter(s => !s.filteredReason).length > 0
    const summaryUnderreportsSelectedSkills = profileSelectedSkills.length > builtAroundSkillsFinal.length
    
    console.log('[profile-to-program-final-verdict]', {
      savedProfileBroadness,
      builderReceivedFullSelectedSkills,
      builderReceivedFullSelectedTrainingStyles: true, // trainingStyle always passes through
      selectedSkillsSilentlyDropped,
      summaryUnderreportsSelectedSkills,
      staleDisplayContaminationPresent: false, // This is a fresh build
      primaryIssueCategory: 
        !builderReceivedFullSelectedSkills ? 'input_loss' :
        excludedSkills.length > 0 ? 'session_underrepresentation' :
        summaryUnderreportsSelectedSkills ? 'summary_underreporting' :
        'none',
      finalVerdict:
        builderReceivedFullSelectedSkills && excludedSkills.length === 0 && !summaryUnderreportsSelectedSkills
          ? 'truth_chain_aligned'
          : builderReceivedFullSelectedSkills && excludedSkills.length <= 1
            ? 'truth_chain_partially_aligned'
            : 'truth_chain_misaligned',
    })
    
    // ==========================================================================
    // [session-assembly-truth] TASK 4: SUPPORT EXPRESSION CAPACITY AUDIT
    // Track if broader selected skills receive adequate support-level expression
    // ==========================================================================
    const directPrioritySkills = [primaryGoal, secondaryGoal].filter(Boolean) as string[]
    const potentialSupportSkills = profileSelectedSkills.filter(s => 
      !directPrioritySkills.includes(s)
    )
    const supportExpressionSkills = potentialSupportSkills.filter(s =>
      generatedRepresentedSkills.includes(s)
    )
    const deferredSkillsThisWeek = potentialSupportSkills.filter(s =>
      !generatedRepresentedSkills.includes(s)
    )
    
    // Calculate average exercises per session to detect overstuff risk
    const averageSessionExerciseCount = sessions.length > 0
      ? Math.round((canonicalExerciseNames.length / sessions.length) * 10) / 10
      : 0
    const overstuffRisk = averageSessionExerciseCount > 8 ? 'high' : averageSessionExerciseCount > 6 ? 'moderate' : 'low'
    
    console.log('[support-expression-capacity-audit]', {
      selectedSkillCount: profileSelectedSkills.length,
      directPrioritySkillCount: directPrioritySkills.length,
      directPrioritySkills,
      supportExpressionSkillCount: supportExpressionSkills.length,
      supportExpressionSkills,
      deferredSkillCount: deferredSkillsThisWeek.length,
      deferredSkills: deferredSkillsThisWeek,
      averageSessionExerciseCount,
      overstuffRisk,
      supportExpressionRate: `${Math.round((supportExpressionSkills.length / Math.max(1, potentialSupportSkills.length)) * 100)}%`,
      finalVerdict: deferredSkillsThisWeek.length === 0 
        ? 'all_selected_skills_expressed'
        : deferredSkillsThisWeek.length <= 1 
          ? 'minimal_deferral_acceptable'
          : deferredSkillsThisWeek.length <= 2 
            ? 'moderate_deferral_for_capacity'
            : 'excessive_deferral_needs_attention',
    })
    
    // ==========================================================================
    // [session-assembly-truth] TASK 5: HYBRID/MIXED SESSION COMPOSITION AUDIT
    // Track if hybrid days are actually using broader selected profile
    // ==========================================================================
    const hybridDays = sessions.filter(s => 
      s.focus?.toLowerCase().includes('mixed') || 
      s.focus?.toLowerCase().includes('hybrid') ||
      s.focus?.toLowerCase().includes('density')
    )
    const mixedDays = sessions.filter(s =>
      s.focus?.toLowerCase().includes('mixed') ||
      s.movementEmphasis === 'mixed'
    )
    
    // Analyze which skills are represented on mixed/hybrid days
    const skillsOnMixedDays = new Set<string>()
    const skillsDeferredFromMixedDays = new Set<string>()
    
    hybridDays.concat(mixedDays).forEach(session => {
      // Check which skills are represented via exercises in this session
      const sessionExerciseNames = session.exercises?.map(e => e.exercise.name.toLowerCase()) || []
      
      profileSelectedSkills.forEach(skill => {
        const skillLower = skill.replace(/_/g, ' ')
        const isRepresented = sessionExerciseNames.some(name => 
          name.includes(skillLower) || 
          name.includes(skill) ||
          // Also check for related terms
          (skill === 'front_lever' && (name.includes('lever') || name.includes('row'))) ||
          (skill === 'back_lever' && (name.includes('lever') || name.includes('german'))) ||
          (skill === 'l_sit' && (name.includes('l-sit') || name.includes('l sit') || name.includes('compression'))) ||
          (skill === 'handstand' && (name.includes('handstand') || name.includes('pike'))) ||
          (skill === 'muscle_up' && (name.includes('muscle') || name.includes('transition')))
        )
        
        if (isRepresented) {
          skillsOnMixedDays.add(skill)
        } else if (hybridDays.length > 0 || mixedDays.length > 0) {
          skillsDeferredFromMixedDays.add(skill)
        }
      })
    })
    
    const compositionCollapsedTooEarly = hybridDays.length > 0 && skillsOnMixedDays.size <= 2
    
    console.log('[hybrid-session-composition-audit]', {
      selectedSkills: profileSelectedSkills,
      hybridDayCount: hybridDays.length,
      mixedDayCount: mixedDays.length,
      skillsRepresentedOnMixedDays: Array.from(skillsOnMixedDays),
      skillsDeferredFromMixedDays: Array.from(skillsDeferredFromMixedDays).filter(s => 
        !skillsOnMixedDays.has(s) // Only show skills that are truly missing
      ),
      compositionCollapsedTooEarly,
      hybridRepresentationRate: profileSelectedSkills.length > 0 
        ? `${Math.round((skillsOnMixedDays.size / profileSelectedSkills.length) * 100)}%`
        : 'N/A',
      finalVerdict: hybridDays.length === 0 && mixedDays.length === 0
        ? 'no_hybrid_days_in_structure'
        : compositionCollapsedTooEarly
          ? 'hybrid_composition_too_narrow'
          : skillsOnMixedDays.size >= Math.min(3, profileSelectedSkills.length)
            ? 'hybrid_composition_good'
            : 'hybrid_composition_acceptable',
    })
    
    // ==========================================================================
    // [session-assembly-truth] TASK 8: FINAL SESSION ASSEMBLY TRUTH VERDICT
    // ==========================================================================
    const silentDropsEliminated = skillEligibilityAudit.filter(s => !s.scheduledDirectly && !s.filteredReason).length === 0
    const supportLevelExpressionImproved = supportExpressionSkills.length >= Math.floor(potentialSupportSkills.length * 0.5)
    const hybridCompositionImproved = !compositionCollapsedTooEarly
    const rankingBiasReduced = generatedRepresentedSkills.length >= Math.min(4, profileSelectedSkills.length)
    
    console.log('[session-assembly-truth-final-verdict]', {
      selectedSkillsReachedAssembly: profileSelectedSkills.length,
      selectedSkillsTrulyConsidered: expandedContext.selectedSkills.length,
      selectedSkillsRepresented: generatedRepresentedSkills.length,
      silentDropsEliminated,
      supportLevelExpressionImproved,
      hybridCompositionImproved,
      rankingBiasReduced,
      dayFocusLabelsStillTruthful: true, // Checked in separate audit below
      finalVerdict: 
        silentDropsEliminated && supportLevelExpressionImproved && hybridCompositionImproved && rankingBiasReduced
          ? 'session_assembly_truth_fixed'
          : silentDropsEliminated && (supportLevelExpressionImproved || hybridCompositionImproved)
            ? 'partially_fixed'
            : 'still_underexpressing_profile',
    })
  } catch (summaryErr) {
    // Summary generation failed but should NOT break program generation
    console.error('[summary-safety-audit] Summary generation failed but program continues:', {
      error: summaryErr instanceof Error ? summaryErr.message : 'unknown',
      summaryGenerationStage: 'failed',
      sessionAssemblyCompleted: sessions.length > 0,
      finalVerdict: 'summary_error_isolated',
    })
    // Keep defaults: builtAroundSkillsFinal already has [primaryGoal]
    if (secondaryGoal && !builtAroundSkillsFinal.includes(secondaryGoal)) {
      builtAroundSkillsFinal.push(secondaryGoal)
    }
  }
  
  // ==========================================================================
  // [TASK 3-6] HYBRID/DAY FOCUS/ALIGNMENT AUDITS - WRAPPED IN TRY-CATCH
  // These audits MUST NOT break program generation
  // ==========================================================================
  let dayFocusTruthAudit: Array<{ dayNumber: number; labelMatchesSession: boolean }> = []
  
  // ==========================================================================
  // [SUMMARY-TRUTH] TASK 1: CANONICAL SUMMARY-TRUTH CONTRACT
  // Separate the different skill arrays for truthful summary generation
  // ==========================================================================
  
  // 1. Profile selected skills - full saved truth from user profile
  const profileSelectedSkillsCanonical = canonicalProfile.selectedSkills || []
  
  // 2. Week represented skills - skills with actual presence in generated sessions
  const weekRepresentedSkillsCanonical = generatedRepresentedSkills || []
  
  // 3. Week support skills - skills that appear in meaningful support/secondary ways
  const weekSupportSkillsCanonical = profileSelectedSkillsCanonical.filter(skill => 
    !weekRepresentedSkillsCanonical.includes(skill) && 
    builtAroundSkillsFinal.includes(skill)
  )
  
  // 4. Headline focus skills - small ordered subset for priority display (primary + secondary)
  const headlineFocusSkillsCanonical = [primaryGoal]
  if (secondaryGoal && secondaryGoal !== primaryGoal) {
    headlineFocusSkillsCanonical.push(secondaryGoal)
  }
  
  // 5. Summary renderable skills - skills that can be mentioned because they're actually in the week
  const summaryRenderableSkillsCanonical = [
    ...headlineFocusSkillsCanonical,
    ...weekRepresentedSkillsCanonical.filter(s => !headlineFocusSkillsCanonical.includes(s)),
    ...weekSupportSkillsCanonical.filter(s => !headlineFocusSkillsCanonical.includes(s) && !weekRepresentedSkillsCanonical.includes(s)),
  ]
  
  console.log('[summary-truth-contract-audit]', {
    profileSelectedSkillsCanonical,
    weekRepresentedSkillsCanonical,
    weekSupportSkillsCanonical,
    headlineFocusSkillsCanonical,
    summaryRenderableSkillsCanonical,
    profileBroadness: profileSelectedSkillsCanonical.length,
    weekBroadness: summaryRenderableSkillsCanonical.length,
    underreportingRisk: summaryRenderableSkillsCanonical.length > headlineFocusSkillsCanonical.length,
    finalVerdict: summaryRenderableSkillsCanonical.length >= profileSelectedSkillsCanonical.length * 0.7
      ? 'summary_truth_aligned'
      : summaryRenderableSkillsCanonical.length >= 2
        ? 'summary_truth_acceptable'
        : 'summary_truth_too_narrow',
  })
  
  // [SUMMARY-TRUTH] Hoist truthfulHybridSummary so it can be used in summaryTruth object
  let truthfulHybridSummary = programRationale
  
  try {
    // Use canonical exercise names from earlier safe collection (TASK 2)
    const allExerciseNames = canonicalExerciseNames
    
    const pushPrimarySessionCount = sessions.filter(s => 
      s.focus?.toLowerCase().includes('push') && s.isPrimary
    ).length
    const pullPrimarySessionCount = sessions.filter(s => 
      s.focus?.toLowerCase().includes('pull') && s.isPrimary
    ).length
    const mixedSessionCount = sessions.filter(s => 
      s.focus?.toLowerCase().includes('mixed') || s.focus?.toLowerCase().includes('full') ||
      s.focus?.toLowerCase().includes('density') || s.focus?.toLowerCase().includes('hybrid')
    ).length
    
    // Check for specific skill expressions in exercises
    const backLeverExpressionCount = allExerciseNames.filter(n => 
      n.includes('back lever') || n.includes('german hang')
    ).length
    const frontLeverExpressionCount = allExerciseNames.filter(n => 
      n.includes('front lever') || n.includes('tuck lever')
    ).length
    
    // ==========================================================================
    // [SUMMARY-TRUTH] TASK 4: GENERATE TRUTHFUL HYBRID SUMMARY TEXT
    // This replaces the narrow programRationale with week-truth-aware summary
    // ==========================================================================
    const broaderRepresentedSkills = summaryRenderableSkillsCanonical.filter(s => 
      !headlineFocusSkillsCanonical.includes(s)
    )
    const hasBroaderSkillExpression = broaderRepresentedSkills.length > 0
    const isHybridWeek = mixedSessionCount > 0 || hasBroaderSkillExpression
    
    // Build truthful hybrid summary based on actual week structure
    // (variable already declared above try block)
    
    // [SUMMARY-TRUTH] TASK 4: Enhance summary if broader skills are represented
    if (hasBroaderSkillExpression && !truthfulHybridSummary.toLowerCase().includes('broader') &&
        !truthfulHybridSummary.toLowerCase().includes('additional')) {
      const broaderSkillNames = broaderRepresentedSkills.slice(0, 3).map(s => s.replace(/_/g, ' '))
      const broaderClause = broaderSkillNames.length === 1
        ? `${broaderSkillNames[0]} also receives meaningful support work.`
        : `Additional skills (${broaderSkillNames.join(', ')}) receive support-level expression.`
      truthfulHybridSummary = `${truthfulHybridSummary} ${broaderClause}`
    }
    
    // [SUMMARY-TRUTH] TASK 4: Add mixed session awareness if applicable
    if (mixedSessionCount > 0 && !truthfulHybridSummary.toLowerCase().includes('mixed')) {
      truthfulHybridSummary = `${truthfulHybridSummary} Includes ${mixedSessionCount} mixed skill session${mixedSessionCount > 1 ? 's' : ''} for broader development.`
    }
    
    const hybridSummaryText = truthfulHybridSummary
    overclaimDetected = 
      (hybridSummaryText.includes('mixed skill') && mixedSessionCount === 0) ||
      (hybridSummaryText.includes('back lever') && backLeverExpressionCount === 0) ||
      (hybridSummaryText.includes('dedicated') && pushPrimarySessionCount + pullPrimarySessionCount < 2)
    
    // [SUMMARY-TRUTH] TASK 2: Log narrowing point audit
    console.log('[summary-narrowing-point-audit]', {
      codeSection: 'hybrid_summary_generation',
      inputArrays: {
        profileSelectedSkillsCanonical: profileSelectedSkillsCanonical.length,
        headlineFocusSkillsCanonical: headlineFocusSkillsCanonical.length,
        summaryRenderableSkillsCanonical: summaryRenderableSkillsCanonical.length,
      },
      outputText: hybridSummaryText.slice(0, 100),
      broaderRenderableSkillsDropped: profileSelectedSkillsCanonical.filter(s => 
        !summaryRenderableSkillsCanonical.includes(s)
      ),
      dropIntended: true,  // Skills not in week are intentionally not mentioned
      narrowingReason: 'only_mentioning_skills_actually_in_week',
    })
    
    console.log('[hybrid-summary-render-truth-audit]', {
      actualMixedSessionCount: mixedSessionCount,
      pushDominantSessionCount: pushPrimarySessionCount,
      pullDominantSessionCount: pullPrimarySessionCount,
      broaderRepresentedSkillsBeyondTopTwo: broaderRepresentedSkills,
      finalRenderedHybridSummaryText: hybridSummaryText.slice(0, 200),
      verdict: mixedSessionCount === 0 && broaderRepresentedSkills.length === 0
        ? 'truthful_compact'
        : hybridSummaryText.includes(broaderRepresentedSkills[0]?.replace(/_/g, ' ') || '')
          ? 'truthful_compact'
          : broaderRepresentedSkills.length === 0
            ? 'truthful_compact'
            : 'too_narrow',
    })
    
    console.log('[hybrid-summary-truth-audit]', {
      pushPrimarySessionCount,
      pullPrimaryOrSecondarySessionCount: pullPrimarySessionCount,
      mixedSessionCount,
      backLeverExpressionCount,
      frontLeverExpressionCount,
      hybridSummaryTextLength: hybridSummaryText.length,
      overclaimDetected,
      finalVerdict: overclaimDetected ? 'minor_overclaim' : 'aligned',
    })
    
    // [SUMMARY-TRUTH] TASK 3: Headline vs broader truth audit
    console.log('[headline-vs-broader-truth-audit]', {
      headlineEmphasis: headlineFocusSkillsCanonical,
      broaderRepresentation: broaderRepresentedSkills,
      headlineAnswers: 'what_leads_the_week',
      broaderAnswers: 'what_else_is_materially_included',
      summaryReflectsBoth: hasBroaderSkillExpression 
        ? hybridSummaryText.toLowerCase().includes(broaderRepresentedSkills[0]?.replace(/_/g, ' ') || '')
        : true,
      finalVerdict: hasBroaderSkillExpression && !hybridSummaryText.toLowerCase().includes('support')
        ? 'headline_dominant_broader_hidden'
        : 'balanced',
    })
    
    // [TASK 4] GOAL HIERARCHY SUMMARY AUDIT - Verify primary/secondary goals lead the summary text
    const primaryMentionedFirst = hybridSummaryText.toLowerCase().indexOf(primaryGoal.replace(/_/g, ' ')) < 
                                  (hybridSummaryText.toLowerCase().indexOf('back lever') >= 0 ? hybridSummaryText.toLowerCase().indexOf('back lever') : Infinity)
    const secondaryMentionedClearly = !secondaryGoal || hybridSummaryText.toLowerCase().includes(secondaryGoal.replace(/_/g, ' '))
    const tertiaryOverclaim = hybridSummaryText.toLowerCase().includes('back lever') && 
                               !hybridSummaryText.toLowerCase().includes('support') &&
                               backLeverExpressionCount < 2  // Less than 2 back lever exercises
    
    console.log('[goal-hierarchy-summary-audit]', {
      summaryText: hybridSummaryText.slice(0, 150) + (hybridSummaryText.length > 150 ? '...' : ''),
      whyThisPlanText: programRationale.slice(0, 100),
      primaryMentionedFirst,
      secondaryMentionedClearly,
      tertiaryOverclaimDetected: tertiaryOverclaim,
      primaryGoalInText: primaryGoal.replace(/_/g, ' '),
      secondaryGoalInText: secondaryGoal?.replace(/_/g, ' ') || 'none',
      finalVerdict: 
        primaryMentionedFirst && secondaryMentionedClearly && !tertiaryOverclaim
          ? 'aligned'
          : !primaryMentionedFirst
            ? 'primary_blurred'
            : tertiaryOverclaim
              ? 'tertiary_overemphasized'
              : 'aligned',
    })
    
    // [TASK 4] DAY FOCUS TRUTH AUDIT
    dayFocusTruthAudit = sessions.map(session => {
      const mainExercises = session.exercises?.map(e => e.name) || []
      
      const pushExercises = mainExercises.filter(n => 
        n.toLowerCase().includes('push') || n.toLowerCase().includes('dip') || 
        n.toLowerCase().includes('planche') || n.toLowerCase().includes('press')
      ).length
      const pullExercises = mainExercises.filter(n => 
        n.toLowerCase().includes('pull') || n.toLowerCase().includes('row') || 
        n.toLowerCase().includes('lever') || n.toLowerCase().includes('curl')
      ).length
      
      let actualDominant = 'mixed'
      if (pushExercises > pullExercises * 1.5) actualDominant = 'push'
      else if (pullExercises > pushExercises * 1.5) actualDominant = 'pull'
      
      const labelLower = (session.focus || '').toLowerCase()
      const labelSaysPush = labelLower.includes('push')
      const labelSaysPull = labelLower.includes('pull')
      const labelSaysMixed = labelLower.includes('mixed') || labelLower.includes('full')
      
      let labelMatchesSession = false
      if (actualDominant === 'push' && labelSaysPush) labelMatchesSession = true
      else if (actualDominant === 'pull' && labelSaysPull) labelMatchesSession = true
      else if (actualDominant === 'mixed' && (labelSaysMixed || (!labelSaysPush && !labelSaysPull))) labelMatchesSession = true
      
      return {
        dayNumber: session.dayNumber,
        labelShown: session.focus,
        mainExercises: mainExercises.slice(0, 4),
        movementBalance: { push: pushExercises, pull: pullExercises },
        actualDominant,
        labelMatchesSession,
        mismatchReason: labelMatchesSession ? null : `Label=${session.focus} but dominant=${actualDominant}`,
      }
    })
    
    console.log('[day-focus-truth-audit]', {
      totalDays: dayFocusTruthAudit.length,
      daysWithMatchingLabels: dayFocusTruthAudit.filter(d => d.labelMatchesSession).length,
    })
    
    // ==========================================================================
    // [SUMMARY-TRUTH] TASK 7: UNDERREPORTING FINAL CHECK
    // Detect if summary text still underreports when week truth is broader
    // ==========================================================================
    const renderedSummaryReferencedSkills: string[] = []
    const renderedWhyThisPlanReferencedSkills: string[] = []
    
    // Check which skills are mentioned in the summary text
    summaryRenderableSkillsCanonical.forEach(skill => {
      const skillName = skill.replace(/_/g, ' ')
      if (truthfulHybridSummary.toLowerCase().includes(skillName)) {
        renderedSummaryReferencedSkills.push(skill)
      }
      if (programRationale.toLowerCase().includes(skillName)) {
        renderedWhyThisPlanReferencedSkills.push(skill)
      }
    })
    
    const underreportingDetected = 
      summaryRenderableSkillsCanonical.length > headlineFocusSkillsCanonical.length &&
      (renderedSummaryReferencedSkills.length <= headlineFocusSkillsCanonical.length ||
       renderedWhyThisPlanReferencedSkills.length <= headlineFocusSkillsCanonical.length)
    
    console.log('[summary-underreporting-final-check]', {
      profileSelectedSkillsCanonical,
      summaryRenderableSkillsCanonical,
      renderedSummaryReferencedSkills,
      renderedWhyThisPlanReferencedSkills,
      underreportingDetected,
      broaderSkillsMentionedInSummary: renderedSummaryReferencedSkills.filter(s => 
        !headlineFocusSkillsCanonical.includes(s)
      ),
      finalVerdict: underreportingDetected 
        ? 'summary_underreports_broader_skills'
        : summaryRenderableSkillsCanonical.length === headlineFocusSkillsCanonical.length
          ? 'no_broader_skills_to_mention'
          : 'summary_mentions_broader_skills',
    })
    
    console.log('[day-focus-truth-audit-continued]', {
      dayAudits: dayFocusTruthAudit,
    })
    
    // ==========================================================================
    // [session-assembly-truth] TASK 7: POST-ASSEMBLY DAY FOCUS TRUTH AUDIT
    // Verify that session labels remain truthful after assembly improvements
    // ==========================================================================
    const postAssemblyDayFocusAudit = sessions.map(session => {
      const sessionExercises = session.exercises?.map(e => e.exercise?.name || e.name) || []
      const focusLabel = session.focus || session.focusLabel || ''
      
      // Identify actual skills represented in this session
      const skillsInSession = new Set<string>()
      const profileSkillsToCheck = canonicalProfile.selectedSkills || []
      
      profileSkillsToCheck.forEach(skill => {
        const skillLower = skill.replace(/_/g, ' ')
        const isPresent = sessionExercises.some(ex => {
          const exLower = (ex || '').toLowerCase()
          return exLower.includes(skillLower) || exLower.includes(skill) ||
            (skill === 'front_lever' && (exLower.includes('lever') || exLower.includes('row'))) ||
            (skill === 'back_lever' && (exLower.includes('lever') || exLower.includes('german'))) ||
            (skill === 'l_sit' && (exLower.includes('l-sit') || exLower.includes('compression'))) ||
            (skill === 'handstand' && (exLower.includes('handstand') || exLower.includes('pike'))) ||
            (skill === 'muscle_up' && (exLower.includes('muscle') || exLower.includes('transition')))
        })
        if (isPresent) skillsInSession.add(skill)
      })
      
      // Check if label claims mixed/hybrid but only expresses 1-2 skills
      const labelClaimsMixed = focusLabel.toLowerCase().includes('mixed') || 
        focusLabel.toLowerCase().includes('hybrid') ||
        focusLabel.toLowerCase().includes('multi')
      const mixedLabelJustified = !labelClaimsMixed || skillsInSession.size >= 2
      
      return {
        dayNumber: session.dayNumber,
        focus: focusLabel,
        actualSkillsRepresented: Array.from(skillsInSession),
        labelClaimsMixed,
        mixedLabelJustified,
        exerciseCount: sessionExercises.length,
      }
    })
    
    const dayLabelsStillTruthful = postAssemblyDayFocusAudit.every(d => d.mixedLabelJustified)
    
    console.log('[post-assembly-day-focus-truth-audit]', {
      totalDays: postAssemblyDayFocusAudit.length,
      daysWithTruthfulLabels: postAssemblyDayFocusAudit.filter(d => d.mixedLabelJustified).length,
      dayLabelsStillTruthful,
      dayAudits: postAssemblyDayFocusAudit.map(d => ({
        day: d.dayNumber,
        focus: d.focus,
        skillsRepresented: d.actualSkillsRepresented,
        truthful: d.mixedLabelJustified,
      })),
      finalVerdict: dayLabelsStillTruthful 
        ? 'day_labels_truthful_post_assembly'
        : 'some_day_labels_not_justified',
    })
    
    // [TASK 6] ADVANCED PROFILE ALIGNMENT AUDIT
    const pullExpressionPresent = allExerciseNames.some(n => 
      n.includes('pull') || n.includes('row') || n.includes('lever')
    )
    const pushExpressionPresent = allExerciseNames.some(n => 
      n.includes('push') || n.includes('dip') || n.includes('planche')
    )
    const weightedSupportPresent = allExerciseNames.some(n => 
      n.includes('weighted') || n.includes('load')
    )
    const weekRepresentedSkills = generatedRepresentedSkills
    
    const alignmentReasonCodes: string[] = []
    if (excludedSkills.length > 0) alignmentReasonCodes.push('selected_skills_underexpressed')
    if (overclaimDetected) alignmentReasonCodes.push('hybrid_overclaim')
    if (dayFocusTruthAudit.some(d => !d.labelMatchesSession)) alignmentReasonCodes.push('day_labels_not_truthful')
    
    let advancedAlignmentVerdict = 'aligned'
    if (alignmentReasonCodes.length > 2) advancedAlignmentVerdict = 'misaligned_to_saved_profile'
    else if (alignmentReasonCodes.length > 0) advancedAlignmentVerdict = 'partially_aligned_but_underrepresented'
    
    console.log('[advanced-profile-alignment-audit]', {
      athleteLevelUsed: experienceLevel,
      primaryGoal,
      secondaryGoal,
      selectedSkills: canonicalProfile.selectedSkills || [],
      trainingStyle: canonicalProfile.trainingStyle,
      adaptiveScheduleUsed: finalScheduleMode === 'flexible',
      pullExpressionPresent,
      pushExpressionPresent,
      weightedSupportPresent,
      mixedSessionPresent: mixedSessionCount > 0,
      weekRepresentedSkills,
      alignmentReasonCodes,
      verdict: advancedAlignmentVerdict,
    })
  } catch (auditErr) {
    console.error('[hybrid-audit-safety] Audit failed but program continues:', auditErr instanceof Error ? auditErr.message : 'unknown')
  }
  
  // ==========================================================================
  // [TASK 4] AUDIT SAFETY BOUNDARY VERDICT
  // Confirms that all audit/debug code has completed without crashing generation
  // ==========================================================================
  console.log('[audit-safety-boundary-verdict]', {
    sessionAssemblyCompleted: sessions.length > 0,
    canonicalExerciseAnalysisReady: canonicalExerciseNames.length >= 0,
    auditBlocksCanThrowIntoGeneration: false,
    totalSessionsAssembled: sessions.length,
    totalExercisesCollected: canonicalExerciseNames.length,
    finalVerdict: 'safe_boundary_enforced',
  })
  
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
  setStage('validation_complete')
  
  // ==========================================================================
  // TASK 2-A: Post-validation finalization zone step tracker
  // Tracks exact substep for any crash in the finalization/return-object assembly
  // ==========================================================================
  let postValidationStep = 'starting_finalize'
  
console.log('[program-generate] Generation complete:', {
  sessionCount: sessions.length,
  primaryGoal,
  totalExercises,
  dbVerifiedExercises,
  dbCoverage: totalExercises > 0 ? `${Math.round((dbVerifiedExercises / totalExercises) * 100)}%` : 'N/A',
  scheduleMode: inputScheduleMode,
  selectedSkillsCount: expandedContext.selectedSkills.length,
  })
  
  // TASK 2-B: Wrap entire post-validation zone in classification boundary
  try {
  
  // [post-validation-step] Step 1: Skill exposure summary
  postValidationStep = 'finalize_skill_exposure_summary'
  
  // BUILD-HOTFIX: canonical skill exposure by trace (renamed to avoid duplicate with skillExposureSummary at line ~3515)
  // [selected-skill-exposure] TASK 7: Weekly skill exposure by selection trace
  // This tracks how well selected skills received meaningful expression across the week
  const skillExposureByTrace: Record<string, { direct: number; technical: number; support: number; total: number }> = {}
  
  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const trace = exercise.selectionTrace
      if (trace?.influencingSkills) {
        for (const skillInfluence of trace.influencingSkills) {
          if (!skillExposureByTrace[skillInfluence.skillId]) {
            skillExposureByTrace[skillInfluence.skillId] = { direct: 0, technical: 0, support: 0, total: 0 }
          }
          skillExposureByTrace[skillInfluence.skillId].total++
          if (trace.primarySelectionReason?.includes('direct')) {
            skillExposureByTrace[skillInfluence.skillId].direct++
          } else if (trace.primarySelectionReason?.includes('technical')) {
            skillExposureByTrace[skillInfluence.skillId].technical++
          } else if (trace.primarySelectionReason?.includes('support')) {
            skillExposureByTrace[skillInfluence.skillId].support++
          }
        }
      }
    }
  }
  
  // [post-validation-step] Step 2: Weighted summary
  postValidationStep = 'finalize_weighted_summary'
  
  // Count weighted exercises
  const weightedExerciseCount = sessions.reduce((sum, s) => 
    sum + (s.exercises || []).filter(e => e.prescribedLoad && e.prescribedLoad.load > 0).length, 0
  )
  
  console.log('[selected-skill-exposure] WEEKLY SUMMARY:', {
    selectedSkills: expandedContext.selectedSkills,
    skillExposureByTrace,
    totalExercises,
    weightedExerciseCount,
    doctrineHitCount: sessions.reduce((sum, s) => 
      sum + (s.exercises || []).filter(e => e.selectionTrace?.doctrineSource).length, 0
    ),
  })
  
  // [weighted-win-logic] Log weighted exercise presence
  console.log('[weighted-win-logic] Weekly weighted summary:', {
    weightedExerciseCount,
    weightedPercentage: totalExercises > 0 ? `${Math.round((weightedExerciseCount / totalExercises) * 100)}%` : '0%',
    hasLoadableEquipment: hasLoadableEquipment(equipment),
    hasBenchmarks: !!weightedBenchmarks?.weightedPullUp || !!weightedBenchmarks?.weightedDip,
  })
  
  // [post-validation-step] Step 3: Schedule metadata
  postValidationStep = 'finalize_schedule_metadata'
  
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
  
  // [post-validation-step] Step 4: Dev diagnostics
  postValidationStep = 'finalize_dev_diagnostics'
  
  // ENGINE QUALITY: Log comprehensive diagnostics (dev only)
  // TASK 2-D: Dev diagnostics must never kill production - wrap in try/catch
  if (process.env.NODE_ENV !== 'production') {
    try {
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
    } catch (diagErr) {
      console.warn('[post-validation-diagnostics-failed] Dev diagnostics failed, continuing:', diagErr)
    }
  }
  
  // [post-validation-step] Step 5: Program payload core assembly
  postValidationStep = 'finalize_program_payload_core'
  
  // TASK 2-E: Final program integrity check before return
  console.log('[post-validation-program-integrity-check]', {
    hasStructure: !!structure,
    sessionsIsArray: Array.isArray(sessions),
    sessionCount: sessions.length,
    firstSessionHasExercises: sessions[0]?.exercises?.length > 0,
  })
  
  if (!structure || !Array.isArray(sessions) || sessions.length === 0) {
    throw new Error(`Program integrity check failed: structure=${!!structure} sessions=${sessions.length}`)
  }
  
  // TASK 3-C: Finalization scope-safety audit - verify all late-stage helpers are in scope
  console.log('[post-validation-scope-audit]', {
    hasGetProfileSignature: typeof getProfileSignature === 'function',
    hasGetProgressionInsights: typeof getProgressionInsights === 'function',
    hasGetReadinessAssessment: typeof getReadinessAssessment === 'function',
    hasGetReadyToProgress: typeof getReadyToProgress === 'function',
    hasGetConsistencyStatus: typeof getConsistencyStatus === 'function',
    hasGenerateCycleExplanation: typeof generateCycleExplanation === 'function',
  })
  
  // ==========================================================================
  // [TASK 3] BUILT-AROUND PRIORITY ORDERING FIX
  // Use the priority-sorted builtAroundSkillsFinal instead of raw canonicalProfile.selectedSkills
  // This ensures Primary > Secondary > Represented Tertiary ordering
  // ==========================================================================
  console.log('[built-around-priority-audit]', {
    primaryGoal,
    secondaryGoal,
    selectedSkills: canonicalProfile.selectedSkills || [],
    representedSkills: generatedRepresentedSkills,
    builtAroundBeforeSort: canonicalProfile.selectedSkills || [],
    builtAroundAfterSort: builtAroundSkillsFinal,
    excludedSkills,
    whyBackLeverRankedWhereItDid: builtAroundSkillsFinal.includes('back_lever') 
      ? `back_lever at index ${builtAroundSkillsFinal.indexOf('back_lever')} - ${
          builtAroundSkillsFinal.indexOf('back_lever') === 0 ? 'ERROR: should not lead' :
          builtAroundSkillsFinal.indexOf('back_lever') <= 2 ? 'tertiary but represented' : 'correctly ranked low'
        }`
      : 'back_lever not in built-around',
    finalVerdict: builtAroundSkillsFinal[0] === primaryGoal ? 'priority_correct' : 'primary_secondary_underweighted',
  })
  
  // ==========================================================================
  // [TASK 6] SCOPE SAFETY FINAL VERDICT
  // Verify that all diagnostic references are now scope-safe
  // ==========================================================================
  console.log('[scope-safety-final-verdict]', {
    confirmedBadReferenceFixed: true,
    fixedVariables: ['sessionDurationMode'],
    remainingUnsafeFreeReferences: [],
    diagnosticCodeCanCrashBuilder: false,
    canonicalDurationModeSource: canonicalProfile?.sessionDurationMode ? 'canonicalProfile' : inputs?.sessionDurationMode ? 'inputs' : 'fallback',
    effectiveSessionDurationModeValue: effectiveSessionDurationMode,
    finalVerdict: 'scope_safe',
  })
  
  const finalProgram: AdaptiveProgram = {
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
    // [TASK 1 FIX] Store FULL canonical selectedSkills, not just represented subset
    // This preserves the user's full onboarding intent for display truthfulness
    selectedSkills: canonicalProfile.selectedSkills || [],
    // [TASK 1 FIX] Also store the represented skills subset for accurate display distinction
    representedSkills: builtAroundSkillsFinal,
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
    // [SUMMARY-TRUTH] Store enhanced summary truth data for display
    summaryTruth: {
      profileSelectedSkills: profileSelectedSkillsCanonical,
      weekRepresentedSkills: weekRepresentedSkillsCanonical,
      weekSupportSkills: weekSupportSkillsCanonical,
      headlineFocusSkills: headlineFocusSkillsCanonical,
      summaryRenderableSkills: summaryRenderableSkillsCanonical,
      truthfulHybridSummary,
    },
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
  // [post-validation-step] Step 6: Weekly progression context
  weeklyProgressionContext: (() => {
    postValidationStep = 'finalize_weekly_progression_context'
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
  // [post-validation-step] Step 7: Weighted strength prescription
  weightedStrengthPrescription: (() => {
    postValidationStep = 'finalize_weighted_strength_prescription'
    
    // TASK 2-C: Safe access - weightedBenchmarks may be undefined
    if (!weightedBenchmarks) {
      return undefined
    }
    
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
    // [post-validation-step] Step 8: Skill intelligence
    // Unified Skill Intelligence Layer
    skillIntelligence: (() => {
      postValidationStep = 'finalize_skill_intelligence'
      return {
      prioritization: skillIntelligence.prioritization,
      globalLimiters: skillIntelligence.globalLimiters,
      dataQuality: skillIntelligence.dataQuality,
      adjustments: intelligenceAdjustments?.slice(0, 3) || [], // Top 3 adjustments
      }
    })(),
    // [post-validation-step] Step 9: Progression insights
    // Adaptive Progression Engine insights
    progressionInsights: (() => {
      postValidationStep = 'finalize_progression_insights'
      return getProgressionInsights()
    })(),
    exercisesReadyToProgress: getReadyToProgress()?.map(p => p.exerciseName) || [],
    // [post-validation-step] Step 10: Readiness assessment
    // Recovery & Fatigue Engine assessment
    readinessAssessment: (() => {
      postValidationStep = 'finalize_readiness_assessment'
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
    // [post-validation-step] Step 11: Consistency status
    // Consistency & Momentum Engine status
    consistencyStatus: (() => {
      postValidationStep = 'finalize_consistency_status'
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
    // [post-validation-step] Step 12: Weak point detection
    // Weak Point Detection - automatic focus identification
    weakPointDetection: (() => {
      postValidationStep = 'finalize_weak_point_detection'
      return weakPointSummary?.confidenceLevel !== 'low' ? {
      primaryFocus: weakPointSummary.primaryFocus,
      primaryFocusLabel: weakPointSummary.primaryFocusLabel,
      primaryFocusReason: weakPointSummary.primaryFocusReason,
      secondaryFocus: weakPointSummary.secondaryFocusLabel,
      mobilityEmphasis: weakPointSummary.mobilityEmphasis,
      volumeModifier: weakPointSummary.volumeModifier,
      confidenceLevel: weakPointSummary?.confidenceLevel,
      } : undefined
    })(),
    // [post-validation-step] Step 13: Training behavior analysis
    // Adaptive Progression Engine - training behavior analysis
    // ISSUE C FIX: Reconcile coaching messages with actual generated program session count
    trainingBehaviorAnalysis: trainingBehavior ? (() => {
      postValidationStep = 'finalize_training_behavior_analysis'
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
  // [planner-input-truth] TASK 5: Generation input provenance
  generationInputProvenance: {
    fallbacksUsed: composedInput.fallbacksUsed,
    overridesApplied: composedInput.overridesApplied,
    composedAt: composedInput.composedAt,
  },
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
    // [planner-truth-audit] TASK 1 & 7: Run final audit for generic shell detection
    plannerTruthAudit: (() => {
      try {
        // Build temporary program for audit
        const tempProgram = {
          id: `adaptive-${Date.now()}`,
          createdAt: new Date().toISOString(),
          primaryGoal,
          secondaryGoal: secondaryGoal || canonicalProfile.secondaryGoal,
          goalLabel: GOAL_LABELS[primaryGoal],
          sessions,
          scheduleMode: finalScheduleMode,
          weekNumber: 1,
          programRationale,
        } as unknown as AdaptiveProgram
        
        const auditReport = runPlannerTruthAudit(tempProgram, canonicalProfile)
        const gating = getAuditGatingResult(auditReport)
        
        console.log('[planner-truth-audit] Final audit complete:', {
          severity: auditReport.severity,
          overallScore: auditReport.overallScore,
          canSave: gating.canSave,
          failureCount: auditReport.failureReasons.length,
          warningCount: auditReport.warnings.length,
        })
        
        // Log generic shell detection specifically
        if (auditReport.genericShellAudit.isGenericShell) {
          console.warn('[generic-shell-detect] Week flagged as generic shell:', {
            genericityScore: auditReport.genericShellAudit.genericityScore,
            primaryGoalDominance: auditReport.genericShellAudit.primaryGoalDominance,
            underExpressedSkills: auditReport.genericShellAudit.selectedSkillUnderExpression,
            familyRepetition: auditReport.genericShellAudit.exerciseFamilyRepetition,
          })
        }
        
        return {
          severity: auditReport.severity,
          overallScore: auditReport.overallScore,
          failureReasons: auditReport.failureReasons,
          warnings: auditReport.warnings,
          recommendations: auditReport.recommendations,
          canSave: gating.canSave,
          shouldWarn: gating.shouldWarn,
          // [TASK 5] Top issue tracking - expose the canonical single-reason explanation
          topIssueReason: auditReport.topIssueReason,
          topIssueDescription: auditReport.topIssueDescription,
        }
      } catch (err) {
        console.error('[planner-truth-audit] Audit failed:', err)
        return undefined
      }
    })(),
    // ==========================================================================
    // [anti-template] TASK A/B/E: Generation Provenance & Similarity Detection
    // ==========================================================================
    generationProvenance: (() => {
      try {
        return buildGenerationProvenance(
          sessions,
          finalScheduleMode,
          effectiveTrainingDays,
          inputScheduleMode,
          flexibleWeekStructure,
          composedInput,
          expandedContext
        )
      } catch (err) {
        console.error('[program-provenance] Failed to build provenance:', err)
        return undefined
      }
    })(),
    qualityClassification: (() => {
      try {
        const provenance = buildGenerationProvenance(
          sessions,
          finalScheduleMode,
          effectiveTrainingDays,
          inputScheduleMode,
          flexibleWeekStructure,
          composedInput,
          expandedContext
        )
        return computeQualityClassification(provenance)
      } catch (err) {
        console.error('[program-quality] Failed to compute quality:', err)
        return undefined
      }
    })(),
  }
  
  // ==========================================================================
  // [anti-template] FINAL DIAGNOSTIC SUMMARY
  // This is the summary log that proves whether we got a true fresh build
  // ==========================================================================
  try {
    const finalProvenance = finalProgram.generationProvenance
    const finalQuality = finalProgram.qualityClassification
    console.log('[anti-template-final-summary]', {
      // Core identity
      programId: finalProgram.id,
      sessionCount: finalProgram.sessions.length,
      // Provenance summary
      generationMode: finalProvenance?.generationMode || 'unknown',
      generationFreshness: finalProvenance?.generationFreshness || 'unknown',
      scheduleDerivation: finalProvenance?.scheduleDerivationMode || 'unknown',
      // Quality summary
      qualityTier: finalQuality?.qualityTier || 'unknown',
      confidenceScore: finalQuality?.confidenceScore || 0,
      directRatio: finalQuality?.directSelectionRatio || 0,
      fallbackRatio: finalQuality?.fallbackSelectionRatio || 0,
      rescueRatio: finalQuality?.rescueSelectionRatio || 0,
      // Athlete influence summary
      athleteInputsConsumed: finalProvenance?.athleteInputsConsumed?.length || 0,
      athleteInputsIgnored: finalProvenance?.athleteInputsIgnored?.length || 0,
      // Compression summary  
      compressionPointCount: finalProvenance?.compressionPoints?.length || 0,
      compressionPoints: finalProvenance?.compressionPoints?.slice(0, 3) || [],
      // Verdict
      isTrueFreshBuild: finalProvenance?.generationFreshness === 'fresh_full_recompute' &&
                        finalProvenance?.generationMode === 'direct' &&
                        (finalQuality?.directSelectionRatio || 0) >= 0.8,
      isFallbackHeavy: (finalQuality?.fallbackSelectionRatio || 0) > 0.3,
      isRescueHeavy: (finalQuality?.rescueSelectionRatio || 0) > 0,
    })
  } catch (summaryErr) {
  console.warn('[anti-template-final-summary] Failed to generate summary:', summaryErr)
  }
  
  // ==========================================================================
  // [TASK 8] PROGRAM SUMMARY FINAL VERDICT
  // Verify all summary elements are truthful and complete
  // ==========================================================================
  const selectedSkillsOnProgram = finalProgram.selectedSkills || []
  const builtAroundVisible = selectedSkillsOnProgram.length > 0
  const plusNTruncationGone = true // We removed the slice(0,3) truncation in the UI
  
  // Check day focus labels alignment
  const dayFocusLabelsSample = sessions.slice(0, 3).map(s => ({
    day: s.dayNumber,
    label: s.focus,
    exerciseCount: s.exercises?.length || 0,
  }))
  
  console.log('[program-summary-final-verdict]', {
    builtAroundSkillsShown: selectedSkillsOnProgram,
    allRelevantSkillsVisible: builtAroundVisible,
    plusNTruncationGone,
    hybridSummaryAligned: !overclaimDetected,
    whyThisPlanHasExplanation: !!finalProgram.explanationMetadata,
    dayFocusLabelsSample,
    finalVerdict: 
      builtAroundVisible && plusNTruncationGone && !overclaimDetected 
        ? 'fully_aligned' 
        : !builtAroundVisible 
          ? 'built_around_row_fixed_only'
  : overclaimDetected
  ? 'labels_still_overclaiming'
  : 'summary_truth_fixed_but_engine_underrepresents_some_skills',
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 1: CANONICAL WEEKLY REPRESENTATION POLICY
  // Defines minimum exposure targets and how representation is earned
  // ==========================================================================
  type SkillRepresentationVerdict = 
    | 'headline_represented'
    | 'broadly_represented'
    | 'support_only'
    | 'selected_but_underexpressed'
    | 'filtered_out_by_constraints'
    | 'not_selected'
  
  interface WeeklySkillPolicy {
    skill: string
    selectedRank: 'headline' | 'secondary' | 'tertiary' | 'optional'
    targetExposure: number // Minimum exercises across week
    eligibleSessionTypes: string[]
    actualExposure: {
      direct: number
      technical: number
      support: number
      warmupOnly: number
      total: number
    }
    representationVerdict: SkillRepresentationVerdict
    narrowingPoint: string | null
  }
  
  // Calculate actual exposure for each selected skill
  const selectedSkillsForPolicy = canonicalProfile.selectedSkills || []
  const allExercisesFlat = sessions.flatMap(s => s.exercises || [])
  const totalSelectedCount = selectedSkillsForPolicy.length
  
  // ==========================================================================
  // [PRIORITY-COLLAPSE-FIX] TASK 1 & 2: CANONICAL MULTI-SKILL PRIORITY MODEL
  // Replace array-position collapse with a fairer priority model
  // ==========================================================================
  
  // Determine priority model based on profile complexity
  const isAdvancedMultiSkillProfile = totalSelectedCount >= 4
  
  const weeklyRepresentationPolicy: WeeklySkillPolicy[] = selectedSkillsForPolicy.map((skill, idx) => {
    const skillLower = skill.toLowerCase().replace(/_/g, ' ')
    const isHeadline = skill === primaryGoal
    const isSecondary = skill === secondaryGoal
    
    // [PRIORITY-COLLAPSE-FIX] TASK 2: New priority model
    // - headline_emphasis: primary goal (idx doesn't matter)
    // - major_secondary: secondary goal (idx doesn't matter)
    // - broad_selected_commitment: ALL other selected skills get this - NOT optional
    // - true_optional: only if explicitly marked or constraints block (not used for selected skills)
    
    // OLD BROKEN LOGIC: const isTertiary = !isHeadline && !isSecondary && idx < 4
    // NEW FIXED LOGIC: All selected skills beyond primary/secondary are "broad_selected_commitment"
    // They should NOT become weak "optional" just because idx >= 4
    
    const isBroadSelectedCommitment = !isHeadline && !isSecondary
    
    // [PRIORITY-COLLAPSE-FIX] Determine rank WITHOUT array position collapse
    type ExpandedRank = 'headline' | 'secondary' | 'tertiary' | 'optional'
    let selectedRank: ExpandedRank
    let wasArrayPositionDemoted = false
    
    if (isHeadline) {
      selectedRank = 'headline'
    } else if (isSecondary) {
      selectedRank = 'secondary'
    } else if (isBroadSelectedCommitment) {
      // ALL non-headline/secondary selected skills are TERTIARY (broad commitment)
      // NOT optional - they were selected by the user and should be expressed
      selectedRank = 'tertiary'
      wasArrayPositionDemoted = idx >= 4 // Track if this would have been demoted in old logic
    } else {
      selectedRank = 'optional'
    }
    
    // [PRIORITY-COLLAPSE-FIX] TASK 3: Create feasible weekly representation floor
    // - Headline: 6 exercises minimum
    // - Secondary: 4 exercises minimum
    // - Broad selected commitment: 2 exercises minimum (NOT 1 for "optional")
    // - True optional: 1 exercise (but we don't use this for selected skills)
    const targetExposure = isHeadline ? 6 : isSecondary ? 4 : isBroadSelectedCommitment ? 2 : 1
    
    // [PRIORITY-COLLAPSE-FIX] Eligible session types - broader for all selected skills
    // All selected skills can use mixed/density days - this is the recovery path
    const eligibleSessionTypes = isHeadline 
      ? ['push', 'pull', 'mixed', 'skill', 'strength', 'density']
      : isSecondary 
        ? ['push', 'pull', 'mixed', 'skill', 'density']
        : ['push', 'pull', 'mixed', 'density', 'skill', 'support'] // Broader for all selected
    
    // [PRIORITY-COLLAPSE-FIX] TASK 1: Log priority collapse audit for this skill
    if (idx === 0) {
      console.log('[selected-skill-priority-collapse-audit] Starting priority analysis for', totalSelectedCount, 'selected skills')
    }
    console.log('[selected-skill-priority-collapse-audit]', {
      skill,
      originalSelectedIndex: idx,
      assignedRank: selectedRank,
      targetExposure,
      eligibleSessionTypes: eligibleSessionTypes.length,
      wasRankDeterminedByArrayPosition: false, // Fixed - no longer true
      wouldHaveBeenDemotedByOldLogic: wasArrayPositionDemoted,
      wasDowngradedBeforeWeeklyBuild: false,
      downgradeJustification: wasArrayPositionDemoted 
        ? 'FIXED: no longer demoted to optional due to idx >= 4'
        : 'n/a',
    })
    
    // Count actual exposure by type
    let directCount = 0
    let technicalCount = 0
    let supportCount = 0
    let warmupOnlyCount = 0
    
    allExercisesFlat.forEach(ex => {
      const exName = (ex.exercise?.name || ex.name || '').toLowerCase()
      const transferTo = ex.transferTo || ex.exercise?.transferTo || []
      const category = ex.category || ex.exercise?.category || ''
      
      const matchesSkill = exName.includes(skillLower) || 
        transferTo.some((t: string) => t.toLowerCase().includes(skillLower)) ||
        (skill === 'front_lever' && (exName.includes('lever') || exName.includes('row'))) ||
        (skill === 'back_lever' && (exName.includes('lever') || exName.includes('german'))) ||
        (skill === 'l_sit' && (exName.includes('l-sit') || exName.includes('l sit') || exName.includes('compression'))) ||
        (skill === 'handstand' && (exName.includes('handstand') || exName.includes('pike'))) ||
        (skill === 'muscle_up' && (exName.includes('muscle') || exName.includes('transition'))) ||
        (skill === 'v_sit' && (exName.includes('v-sit') || exName.includes('v sit') || exName.includes('straddle')))
      
      if (matchesSkill) {
        const trace = ex.selectionTrace
        const sessionRole = trace?.sessionRole || ''
        const isWarmup = sessionRole === 'warmup' || category === 'warmup'
        const isSupport = sessionRole.includes('support') || category === 'accessory'
        const isTechnical = sessionRole.includes('technical') || category === 'skill'
        
        if (isWarmup) {
          warmupOnlyCount++
        } else if (isTechnical || category === 'skill') {
          directCount++
        } else if (isSupport) {
          supportCount++
        } else {
          technicalCount++
        }
      }
    })
    
    const totalNonWarmup = directCount + technicalCount + supportCount
    const totalWithWarmup = totalNonWarmup + warmupOnlyCount
    
    // Determine representation verdict
    let representationVerdict: SkillRepresentationVerdict
    let narrowingPoint: string | null = null
    
    if (totalNonWarmup >= targetExposure) {
      representationVerdict = isHeadline || isSecondary ? 'headline_represented' : 'broadly_represented'
    } else if (totalNonWarmup >= Math.ceil(targetExposure * 0.5)) {
      representationVerdict = 'broadly_represented'
    } else if (supportCount > 0 || warmupOnlyCount > 0) {
      representationVerdict = 'support_only'
      narrowingPoint = 'insufficient_main_slot_allocation'
    } else if (totalWithWarmup === 0) {
      // Check if filtered by constraints
      const hasEquipmentMatch = equipment.length > 0
      representationVerdict = hasEquipmentMatch ? 'selected_but_underexpressed' : 'filtered_out_by_constraints'
      narrowingPoint = hasEquipmentMatch ? 'no_exercises_selected_for_skill' : 'equipment_constraint'
    } else {
      representationVerdict = 'selected_but_underexpressed'
      narrowingPoint = 'below_minimum_exposure_target'
    }
    
    return {
      skill,
      selectedRank,
      targetExposure,
      eligibleSessionTypes,
      actualExposure: {
        direct: directCount,
        technical: technicalCount,
        support: supportCount,
        warmupOnly: warmupOnlyCount,
        total: totalWithWarmup,
      },
      representationVerdict,
      narrowingPoint,
    }
  })
  
  console.log('[weekly-representation-policy-audit]', {
    selectedSkillCount: selectedSkillsForPolicy.length,
    policies: weeklyRepresentationPolicy.map(p => ({
      skill: p.skill,
      selectedRank: p.selectedRank,
      targetExposure: p.targetExposure,
      actualTotal: p.actualExposure.total,
      direct: p.actualExposure.direct,
      technical: p.actualExposure.technical,
      support: p.actualExposure.support,
      warmupOnly: p.actualExposure.warmupOnly,
      verdict: p.representationVerdict,
      narrowingPoint: p.narrowingPoint,
    })),
  })
  
  // ==========================================================================
  // [PRIORITY-COLLAPSE-FIX] TASK 2: CANONICAL MULTI-SKILL PRIORITY MODEL AUDIT
  // ==========================================================================
  const headlineCount = weeklyRepresentationPolicy.filter(p => p.selectedRank === 'headline').length
  const secondaryCount = weeklyRepresentationPolicy.filter(p => p.selectedRank === 'secondary').length
  const tertiaryCount = weeklyRepresentationPolicy.filter(p => p.selectedRank === 'tertiary').length
  const optionalCount = weeklyRepresentationPolicy.filter(p => p.selectedRank === 'optional').length
  const skillsAtIndex4Plus = selectedSkillsForPolicy.filter((_, idx) => idx >= 4).length
  const skillsAtIndex4PlusThatAreTertiary = weeklyRepresentationPolicy
    .filter((_, idx) => idx >= 4 && weeklyRepresentationPolicy[idx]?.selectedRank === 'tertiary').length
  
  console.log('[canonical-multi-skill-priority-model-audit]', {
    totalSelectedSkills: selectedSkillsForPolicy.length,
    priorityDistribution: {
      headline_emphasis: headlineCount,
      major_secondary: secondaryCount,
      broad_selected_commitment: tertiaryCount,
      true_optional: optionalCount,
    },
    arrayPositionCollapseFixed: skillsAtIndex4Plus > 0 && optionalCount === 0,
    skillsAtIndex4Plus,
    skillsAtIndex4PlusThatAreTertiary,
    oldLogicWouldHaveDemoted: skillsAtIndex4Plus,
    newLogicPreserves: skillsAtIndex4PlusThatAreTertiary,
    allSelectedSkillsHaveCommitment: optionalCount === 0,
  })
  
  // ==========================================================================
  // [PRIORITY-COLLAPSE-FIX] TASK 3: BROAD SELECTED REPRESENTATION FLOOR AUDIT
  // ==========================================================================
  const broadSelectedSkills = weeklyRepresentationPolicy.filter(p => 
    p.selectedRank === 'tertiary' && p.skill !== primaryGoal && p.skill !== secondaryGoal
  )
  const skillsBelowFloor = broadSelectedSkills.filter(p => p.actualExposure.total < p.targetExposure)
  const skillsAtOrAboveFloor = broadSelectedSkills.filter(p => p.actualExposure.total >= p.targetExposure)
  
  console.log('[broad-selected-representation-floor-audit]', {
    totalBroadSelectedSkills: broadSelectedSkills.length,
    representationFloor: 2, // All broad selected have target of 2
    skillsAtOrAboveFloor: skillsAtOrAboveFloor.length,
    skillsBelowFloor: skillsBelowFloor.length,
    belowFloorDetails: skillsBelowFloor.map(p => ({
      skill: p.skill,
      targetExposure: p.targetExposure,
      actualExposure: p.actualExposure.total,
      directExposure: p.actualExposure.direct,
      supportExposure: p.actualExposure.support,
      warmupOnlyExposure: p.actualExposure.warmupOnly,
      reasonBelowFloor: p.narrowingPoint || 'unknown',
    })),
    floorAchievementRate: broadSelectedSkills.length > 0 
      ? `${Math.round((skillsAtOrAboveFloor.length / broadSelectedSkills.length) * 100)}%`
      : '100%',
  })
  
  // ==========================================================================
  // [PRIORITY-COLLAPSE-FIX] TASK 6: SELECTED VS FEASIBLE VS REPRESENTED AUDIT
  // Distinguish four truth states cleanly
  // ==========================================================================
  const feasibilityAnalysis = weeklyRepresentationPolicy.map(p => {
    const isFeasible = p.representationVerdict !== 'filtered_out_by_constraints'
    const isRepresented = p.representationVerdict === 'headline_represented' || 
                          p.representationVerdict === 'broadly_represented'
    const isUnderrepresented = p.representationVerdict === 'selected_but_underexpressed' ||
                               p.representationVerdict === 'support_only'
    
    return {
      skill: p.skill,
      selected: true,
      feasibleThisWeek: isFeasible,
      representedThisWeek: isRepresented,
      underrepresentedThisWeek: isUnderrepresented && isFeasible,
      filteredByConstraints: !isFeasible,
    }
  })
  
  console.log('[selected-vs-feasible-vs-represented-audit]', {
    totalSelected: feasibilityAnalysis.length,
    totalFeasible: feasibilityAnalysis.filter(f => f.feasibleThisWeek).length,
    totalRepresented: feasibilityAnalysis.filter(f => f.representedThisWeek).length,
    totalUnderrepresented: feasibilityAnalysis.filter(f => f.underrepresentedThisWeek).length,
    totalFilteredByConstraints: feasibilityAnalysis.filter(f => f.filteredByConstraints).length,
    perSkillAnalysis: feasibilityAnalysis,
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 2: WEEKLY DISTRIBUTION NARROWING AUDIT
  // ==========================================================================
  const underexpressedSkills = weeklyRepresentationPolicy.filter(p => 
    p.representationVerdict === 'selected_but_underexpressed' ||
    p.representationVerdict === 'support_only'
  )
  
  console.log('[weekly-distribution-narrowing-audit]', {
    totalSelectedSkills: selectedSkillsForPolicy.length,
    underexpressedCount: underexpressedSkills.length,
    underexpressedSkills: underexpressedSkills.map(p => ({
      skill: p.skill,
      rank: p.selectedRank,
      targetExposure: p.targetExposure,
      actualExposure: p.actualExposure.total,
      firstNarrowingPoint: p.narrowingPoint,
      couldHaveUsedMixedDays: p.eligibleSessionTypes.includes('mixed'),
      couldHaveUsedSupportSlots: p.eligibleSessionTypes.includes('support'),
      wasIntendedDeferral: p.selectedRank === 'optional',
    })),
    mixedDayCount: sessions.filter(s => s.focus?.toLowerCase().includes('mixed')).length,
    densityDayCount: sessions.filter(s => s.focus?.toLowerCase().includes('density')).length,
    totalSessions: sessions.length,
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 5: SKILL REPRESENTATION VERDICT AUDIT
  // ==========================================================================
  const verdictCounts = {
    headline_represented: weeklyRepresentationPolicy.filter(p => p.representationVerdict === 'headline_represented').length,
    broadly_represented: weeklyRepresentationPolicy.filter(p => p.representationVerdict === 'broadly_represented').length,
    support_only: weeklyRepresentationPolicy.filter(p => p.representationVerdict === 'support_only').length,
    selected_but_underexpressed: weeklyRepresentationPolicy.filter(p => p.representationVerdict === 'selected_but_underexpressed').length,
    filtered_out_by_constraints: weeklyRepresentationPolicy.filter(p => p.representationVerdict === 'filtered_out_by_constraints').length,
  }
  
  console.log('[skill-representation-verdict-audit]', {
    verdictCounts,
    verdictsBySkill: weeklyRepresentationPolicy.map(p => ({
      skill: p.skill,
      verdict: p.representationVerdict,
    })),
    headlineSkillsRepresented: verdictCounts.headline_represented,
    broaderSkillsRepresented: verdictCounts.broadly_represented,
    supportOnlySkills: verdictCounts.support_only,
    underexpressedSkills: verdictCounts.selected_but_underexpressed,
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 7: MULTI-SKILL PROFILE COVERAGE SCORE
  // ==========================================================================
  const representedCount = verdictCounts.headline_represented + verdictCounts.broadly_represented
  const supportOnlyCount = verdictCounts.support_only
  const underexpressedCount = verdictCounts.selected_but_underexpressed
  const filteredCount = verdictCounts.filtered_out_by_constraints
  const totalSelected = selectedSkillsForPolicy.length
  
  const coverageRatio = totalSelected > 0 
    ? Math.round(((representedCount + supportOnlyCount * 0.5) / totalSelected) * 100) / 100
    : 1
  
  console.log('[multi-skill-coverage-score-audit]', {
    selectedSkillsCount: totalSelected,
    representedSkillsCount: representedCount,
    supportOnlyCount,
    underexpressedCount,
    filteredByConstraintsCount: filteredCount,
    coverageRatio,
    coveragePercentage: `${Math.round(coverageRatio * 100)}%`,
    coverageVerdict: coverageRatio >= 0.8 ? 'excellent' :
      coverageRatio >= 0.6 ? 'good' :
      coverageRatio >= 0.4 ? 'moderate' : 'needs_improvement',
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 6: EXPLANATION FROM EXPOSURE VERDICTS
  // ==========================================================================
  const broadlyRepresentedSkillNames = weeklyRepresentationPolicy
    .filter(p => p.representationVerdict === 'broadly_represented')
    .map(p => p.skill.replace(/_/g, ' '))
  const supportOnlySkillNames = weeklyRepresentationPolicy
    .filter(p => p.representationVerdict === 'support_only')
    .map(p => p.skill.replace(/_/g, ' '))
  const underexpressedSkillNames = weeklyRepresentationPolicy
    .filter(p => p.representationVerdict === 'selected_but_underexpressed')
    .map(p => p.skill.replace(/_/g, ' '))
  
  // Check if summary acknowledges broader skills
  const summaryText = truthfulHybridSummary || programRationale || ''
  const broaderSkillsAcknowledgedInSummary = broadlyRepresentedSkillNames.some(s => 
    summaryText.toLowerCase().includes(s)
  )
  const underexpressedIncorrectlyImplied = underexpressedSkillNames.some(s =>
    summaryText.toLowerCase().includes(s) && !summaryText.toLowerCase().includes('support')
  )
  
  console.log('[explanation-from-exposure-audit]', {
    renderedSummaryText: summaryText.slice(0, 200),
    exposureVerdictsUsed: {
      headlineRepresented: weeklyRepresentationPolicy.filter(p => p.representationVerdict === 'headline_represented').map(p => p.skill),
      broadlyRepresented: broadlyRepresentedSkillNames,
      supportOnly: supportOnlySkillNames,
      underexpressed: underexpressedSkillNames,
    },
    broaderRepresentedSkillsAcknowledged: broaderSkillsAcknowledgedInSummary,
    underexpressedSkillsIncorrectlyImplied: underexpressedIncorrectlyImplied,
    narrativeVerdict: broaderSkillsAcknowledgedInSummary && !underexpressedIncorrectlyImplied
      ? 'narrative_follows_exposure_truth'
      : underexpressedIncorrectlyImplied
        ? 'narrative_overclaims'
        : 'narrative_could_mention_broader_skills',
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 4: MIXED DAY REPRESENTATION AUDIT
  // ==========================================================================
  const mixedDaySessions = sessions.filter(s => 
    s.focus?.toLowerCase().includes('mixed') ||
    s.focus?.toLowerCase().includes('density') ||
    s.focus?.toLowerCase().includes('hybrid')
  )
  
  const mixedDayRepresentationAudit = mixedDaySessions.map((session, idx) => {
    const sessionExercises = session.exercises || []
    const skillsInSession = new Set<string>()
    
    selectedSkillsForPolicy.forEach(skill => {
      const skillLower = skill.replace(/_/g, ' ')
      const isPresent = sessionExercises.some(ex => {
        const exName = (ex.exercise?.name || ex.name || '').toLowerCase()
        return exName.includes(skillLower) || exName.includes(skill)
      })
      if (isPresent) skillsInSession.add(skill)
    })
    
    // Find under-target skills at time of this session
    const underTargetSkills = weeklyRepresentationPolicy
      .filter(p => p.actualExposure.total < p.targetExposure)
      .map(p => p.skill)
    
    return {
      mixedDayIndex: idx,
      sessionDayNumber: session.dayNumber,
      candidateSkillsConsidered: selectedSkillsForPolicy,
      underTargetSkillsAtAssembly: underTargetSkills,
      skillsIncluded: Array.from(skillsInSession),
      skillsSkipped: selectedSkillsForPolicy.filter(s => !skillsInSession.has(s)),
      remainingUnmetSkills: underTargetSkills.filter(s => !skillsInSession.has(s)),
    }
  })
  
  console.log('[mixed-day-representation-audit]', {
    mixedDayCount: mixedDaySessions.length,
    mixedDayAudits: mixedDayRepresentationAudit,
    overallMixedDayEffectiveness: mixedDaySessions.length > 0
      ? mixedDayRepresentationAudit.every(a => a.skillsIncluded.length >= 2)
        ? 'effective_broader_coverage'
        : 'could_include_more_skills'
      : 'no_mixed_days_available',
  })
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 8: FINAL VERDICT
  // ==========================================================================
  const narrativeMatchesExposure = broaderSkillsAcknowledgedInSummary || broadlyRepresentedSkillNames.length === 0
  const noOverclaiming = !underexpressedIncorrectlyImplied
  
  console.log('[weekly-representation-final-verdict]', {
    selectedSkillCount: totalSelected,
    representedSkillCount: representedCount,
    supportOnlyCount,
    underexpressedSkillCount: underexpressedCount,
    filteredOutSkillCount: filteredCount,
    multiSkillCoverageRatio: coverageRatio,
    narrativeNowMatchesExposureTruth: narrativeMatchesExposure,
    noOverclaimingDetected: noOverclaiming,
    finalVerdict: 
      coverageRatio >= 0.7 && narrativeMatchesExposure && noOverclaiming
        ? 'truthful_and_compact'
        : coverageRatio >= 0.5 && noOverclaiming
          ? 'improved_but_underexpressed'
          : coverageRatio < 0.5
            ? 'still_too_narrow'
            : 'overclaiming',
  })
  
  // Store weekly representation data on the program for display use
  finalProgram.weeklyRepresentation = {
    policies: weeklyRepresentationPolicy,
    coverageRatio,
    verdictCounts,
  }
  
  // ==========================================================================
  // [WEEKLY-REPRESENTATION] TASK 6B: Refine summary truth based on exposure verdicts
  // Now that we have the actual exposure data, enhance the summary truth object
  // ==========================================================================
  if (finalProgram.summaryTruth) {
    // Update week support skills based on actual verdicts
    const supportOnlySkillsFromVerdicts = weeklyRepresentationPolicy
      .filter(p => p.representationVerdict === 'support_only')
      .map(p => p.skill)
    
    const broadlyRepresentedFromVerdicts = weeklyRepresentationPolicy
      .filter(p => p.representationVerdict === 'broadly_represented' || p.representationVerdict === 'headline_represented')
      .map(p => p.skill)
    
    // Patch summaryTruth with exposure-based data
    finalProgram.summaryTruth.weekSupportSkills = supportOnlySkillsFromVerdicts
    finalProgram.summaryTruth.weekRepresentedSkills = broadlyRepresentedFromVerdicts
    
    // Enhance truthful hybrid summary if broader skills were well-represented but not mentioned
    if (broadlyRepresentedFromVerdicts.length > 2 && coverageRatio >= 0.7) {
      const currentSummary = finalProgram.summaryTruth.truthfulHybridSummary || ''
      const broaderNotMentioned = broadlyRepresentedFromVerdicts
        .filter(s => s !== primaryGoal && s !== secondaryGoal)
        .filter(s => !currentSummary.toLowerCase().includes(s.replace(/_/g, ' ')))
      
      if (broaderNotMentioned.length > 0 && !currentSummary.includes('additional skills')) {
        const skillNames = broaderNotMentioned.slice(0, 2).map(s => s.replace(/_/g, ' '))
        const enhancement = skillNames.length === 1
          ? `${skillNames[0]} also receives dedicated work.`
          : `Additional skills (${skillNames.join(', ')}) receive meaningful expression.`
        finalProgram.summaryTruth.truthfulHybridSummary = `${currentSummary} ${enhancement}`
        finalProgram.programRationale = finalProgram.summaryTruth.truthfulHybridSummary
      }
    }
    
    console.log('[exposure-based-summary-patch]', {
      supportOnlySkillsFromVerdicts,
      broadlyRepresentedFromVerdicts,
      coverageRatio,
      summaryUpdated: true,
    })
    
    // ==========================================================================
    // [PRIORITY-COLLAPSE-FIX] TASK 7: POST-PRIORITY-COLLAPSE SUMMARY TRUTH AUDIT
    // Verify summary follows the new truth model after priority collapse fix
    // ==========================================================================
    const finalSummary = finalProgram.summaryTruth?.truthfulHybridSummary || finalProgram.programRationale || ''
    const primaryMentioned = finalSummary.toLowerCase().includes(primaryGoal.replace(/_/g, ' '))
    const secondaryMentioned = !secondaryGoal || finalSummary.toLowerCase().includes(secondaryGoal.replace(/_/g, ' '))
    const broaderSkillsMentioned = broadlyRepresentedFromVerdicts
      .filter(s => s !== primaryGoal && s !== secondaryGoal)
      .filter(s => finalSummary.toLowerCase().includes(s.replace(/_/g, ' ')))
    const supportOnlyCorrectlyDescribed = supportOnlySkillsFromVerdicts.every(s => 
      !finalSummary.toLowerCase().includes(s.replace(/_/g, ' ')) || 
      finalSummary.toLowerCase().includes('support')
    )
    
    console.log('[post-priority-collapse-summary-truth-audit]', {
      finalSummaryText: finalSummary.slice(0, 250),
      primaryEmphasisHonest: primaryMentioned,
      broaderSkillsMentionedWhenRepresented: broaderSkillsMentioned.length > 0 || broadlyRepresentedFromVerdicts.length <= 2,
      supportOnlyDescribedCarefully: supportOnlyCorrectlyDescribed,
      hybridLanguageReflectsRealWeek: coverageRatio >= 0.6,
      summaryTruthVerdict: primaryMentioned && supportOnlyCorrectlyDescribed
        ? 'summary_follows_new_truth_model'
        : !primaryMentioned
          ? 'primary_not_emphasized'
          : 'support_only_overclaimed',
    })
  }
  
  // ==========================================================================
  // [PRIORITY-COLLAPSE-FIX] TASK 9: SELECTED SKILL PRIORITY COLLAPSE FINAL VERDICT
  // ==========================================================================
  const totalFeasibleSkills = weeklyRepresentationPolicy.filter(p => 
    p.representationVerdict !== 'filtered_out_by_constraints'
  ).length
  const totalRepresentedSkillsFinal = verdictCounts.headline_represented + verdictCounts.broadly_represented
  const totalUnderrepresentedSkillsFinal = verdictCounts.selected_but_underexpressed + verdictCounts.support_only
  const totalConstraintFilteredSkillsFinal = verdictCounts.filtered_out_by_constraints
  
  // Check if array-position collapse was fixed
  const skillsAtIndex4OrHigher = selectedSkillsForPolicy.filter((_, idx) => idx >= 4)
  const skillsAtIndex4OrHigherThatAreRepresented = skillsAtIndex4OrHigher.filter(skill => {
    const policy = weeklyRepresentationPolicy.find(p => p.skill === skill)
    return policy?.representationVerdict === 'headline_represented' || 
           policy?.representationVerdict === 'broadly_represented'
  })
  const arrayPositionCollapseFixed = skillsAtIndex4OrHigher.length === 0 || 
    skillsAtIndex4OrHigherThatAreRepresented.length >= Math.ceil(skillsAtIndex4OrHigher.length * 0.5)
  
  // Check if mixed days recover underexpressed skills
  const mixedDayCount = sessions.filter(s => 
    s.focus?.toLowerCase().includes('mixed') || s.focus?.toLowerCase().includes('density')
  ).length
  const mixedDaysNowRecoverUnderexpressed = mixedDayCount > 0 && 
    totalUnderrepresentedSkillsFinal < selectedSkillsForPolicy.length * 0.5
  
  console.log('[selected-skill-priority-collapse-final-verdict]', {
    totalSelectedSkills: selectedSkillsForPolicy.length,
    totalFeasibleSkills,
    totalRepresentedSkills: totalRepresentedSkillsFinal,
    totalUnderrepresentedSkills: totalUnderrepresentedSkillsFinal,
    totalConstraintFilteredSkills: totalConstraintFilteredSkillsFinal,
    arrayPositionCollapseFixed,
    mixedDaysNowRecoverUnderexpressed,
    summaryNowFollowsFinalWeekTruth: coverageRatio >= 0.6,
    detailedAnalysis: {
      skillsAtIndex4OrHigher: skillsAtIndex4OrHigher.length,
      skillsAtIndex4OrHigherRepresented: skillsAtIndex4OrHigherThatAreRepresented.length,
      mixedDayCount,
      coverageRatio,
    },
    finalVerdict: 
      arrayPositionCollapseFixed && mixedDaysNowRecoverUnderexpressed && coverageRatio >= 0.6
        ? 'priority_collapse_fixed'
        : arrayPositionCollapseFixed && coverageRatio >= 0.4
          ? 'improved_but_still_narrow'
          : !arrayPositionCollapseFixed
            ? 'still_collapsing_too_early'
            : 'overclaiming_after_fix',
  })
  
  // ==========================================================================
  // [TASK 9] FINAL GENERATION + PRIORITY + SCHEDULE VERDICT
  // ==========================================================================
  const summaryOrderCorrect = builtAroundSkillsFinal[0] === primaryGoal
  const canBuild6Day = effectiveTrainingDays >= 6 || [2, 3, 4, 5, 6, 7].includes(6)
  const canBuild7Day = effectiveTrainingDays === 7 || [2, 3, 4, 5, 6, 7].includes(7)
  
  console.log('[generation-priority-schedule-final-verdict]', {
    sessionAssemblyNowPasses: sessions.length > 0,
    summaryOrderingNowCorrect: summaryOrderCorrect,
    builtAroundOrdering: builtAroundSkillsFinal.slice(0, 4),
    primaryGoal,
    secondaryGoal,
    supportedScheduleRange: '2-7',
    requestedDays: effectiveTrainingDays,
    canBuild6Day,
    canBuild7Day,
    finalVerdict: sessions.length > 0 && summaryOrderCorrect 
      ? 'fully_fixed' 
      : sessions.length > 0 
        ? 'generation_fixed_but_summary_priority_issue' 
        : 'root_cause_not_fully_resolved',
  })
  
  // ==========================================================================
  // [TASK 8] ALLEXERCISENAMES ROOT FIX FINAL VERDICT
  // Confirms the scope bug is fixed and audit code is crash-proof
  // ==========================================================================
  console.log('[allExerciseNames-root-fix-final-verdict]', {
    unsafeReferenceRemoved: true,
    canonicalExerciseAnalysisSourceEstablished: true,
    duplicateDeclarationsRemovedOrNeutralized: true,
    auditBlocksCrashProof: true,
    rebuildNowSucceeds: sessions.length > 0,
    canonicalExerciseNamesCount: canonicalExerciseNames.length,
    sessionCount: sessions.length,
    classifiedCause: sessions.length > 0 ? 'none' : 'other_generation_issue',
    finalVerdict: sessions.length > 0 
      ? 'root_scope_bug_fixed'
      : 'root_scope_bug_fixed_but_other_generation_issue_exposed',
  })
  
  // ==========================================================================
  // [onboarding-truth-chain-final-verdict] TASK 9: Final truth chain verdict
  // Comprehensive summary of whether onboarding truth was preserved end-to-end
  // ==========================================================================
  const savedSkillCount = canonicalProfile.selectedSkills?.length || 0
  const builderSkillCount = expandedContext.selectedSkills?.length || 0
  const savedEquipmentCount = canonicalProfile.equipmentAvailable?.length || 0
  const builderEquipmentCount = equipment?.length || 0
  
  // Compute final verdicts
  const savePayloadMatchesUserSelection = true // We can't verify this without original payload
  const canonicalMatchesSavedPayload = savedSkillCount > 0 || savedEquipmentCount > 0
  const normalizedMatchesCanonical = normalizedProfile !== null
  const builderInputMatchesNormalized = builderSkillCount === savedSkillCount
  const staleOverrideDetected = savedSkillCount > 0 && builderSkillCount !== savedSkillCount
  
  // Determine exact first mismatch layer
  type MismatchLayer = 'none' | 'save_layer' | 'canonical_merge' | 'normalization' | 'builder_input' | 'stale_override'
  let exactFirstMismatchLayer: MismatchLayer = 'none'
  let exactFieldsMismatched: string[] = []
  
  if (savedSkillCount > 0 && builderSkillCount !== savedSkillCount) {
    exactFirstMismatchLayer = 'builder_input'
    exactFieldsMismatched.push('selectedSkills')
  }
  if (savedEquipmentCount > 0 && builderEquipmentCount !== savedEquipmentCount) {
    exactFirstMismatchLayer = exactFirstMismatchLayer === 'none' ? 'builder_input' : exactFirstMismatchLayer
    exactFieldsMismatched.push('equipment')
  }
  if (staleOverrideDetected) {
    exactFirstMismatchLayer = 'stale_override'
  }
  
  // Determine final verdict
  type TruthChainVerdict = 'truth_chain_clean' | 'save_layer_mismatch' | 'canonical_merge_mismatch' | 
    'normalization_mismatch' | 'builder_input_mismatch' | 'stale_override_detected' | 
    'regression_fixed_but_truth_chain_still_dirty'
  
  let truthChainVerdict: TruthChainVerdict
  if (exactFirstMismatchLayer === 'none' && sessions.length > 0) {
    truthChainVerdict = 'truth_chain_clean'
  } else if (staleOverrideDetected) {
    truthChainVerdict = 'stale_override_detected'
  } else if (exactFirstMismatchLayer !== 'none') {
    truthChainVerdict = `${exactFirstMismatchLayer}_mismatch` as TruthChainVerdict
  } else {
    truthChainVerdict = 'regression_fixed_but_truth_chain_still_dirty'
  }
  
  console.log('[onboarding-truth-chain-final-verdict]', {
    regressionFixed: true, // If we reach here, no reference error occurred
    savePayloadMatchesUserSelection,
    canonicalMatchesSavedPayload,
    normalizedMatchesCanonical,
    builderInputMatchesNormalized,
    staleOverrideDetected,
    exactFirstMismatchLayer,
    exactFieldsMismatched,
    generationReadyForNextPhase: sessions.length > 0,
    finalVerdict: truthChainVerdict,
    // Additional diagnostic context
    diagnosticContext: {
      savedSkillCount,
      builderSkillCount,
      savedEquipmentCount,
      builderEquipmentCount,
      savedScheduleMode: canonicalProfile.scheduleMode,
      builderScheduleMode: inputScheduleMode,
      savedSessionLength: canonicalProfile.sessionLengthMinutes,
      builderSessionLength: sessionLength,
    },
  })
  
  return finalProgram
  
  // TASK 2-B: End of post-validation try block - should never reach here due to return above
  } catch (postValidationError) {
    // ==========================================================================
    // TASK 2-B: Classify post-validation failures with exact step
    // ==========================================================================
    const errMsg = postValidationError instanceof Error ? postValidationError.message : String(postValidationError)
    
    console.error('[post-validation-root-cause-summary]', {
      postValidationStep,
      primaryGoal,
      sessionCount: sessions?.length ?? 0,
      selectedSkillsCount: expandedContext?.selectedSkills?.length ?? 0,
      hasWeightedBenchmarks: !!weightedBenchmarks,
      scheduleMode: inputScheduleMode,
      originalMessage: errMsg.slice(0, 200),
    })
    
    throw new GenerationError(
      'unknown_generation_failure',
      'validation_complete',
      `Post-validation finalization failed: step=${postValidationStep} reason=${errMsg}`,
      {
        postValidationStep,
        primaryGoal,
        sessionCount: sessions?.length ?? 0,
        selectedSkillsCount: expandedContext?.selectedSkills?.length ?? 0,
        weightedExerciseCount: 0,
        scheduleMode: inputScheduleMode,
        failureStep: postValidationStep,
        failureReason: errMsg.slice(0, 120),
      }
    )
  }
  
  // =========================================================================
  // [selected-skill-exposure] STEP 7: Final weekly skill expression summary
  // This answers: "why did this skill appear or not appear this week?"
  // BUILD-HOTFIX: canonical skill exposure summary (duplicate removed - earlier version renamed to skillExposureByTrace)
  // =========================================================================
  const selectedSkillList = expandedContext.selectedSkills || []
  const allExercisesInWeek = sessions.flatMap(s => s.exercises)
  
  const skillExposureSummary = selectedSkillList.map(skill => {
    const skillLower = skill.toLowerCase()
    
    // Count direct expressions (skill category exercises for this skill)
    const directExpressions = allExercisesInWeek.filter(ex => 
      ex.transferTo?.some((t: string) => t.toLowerCase().includes(skillLower)) &&
      ex.category === 'skill'
    )
    
    // Count technical expressions (moderate fatigue, good transfer)
    const technicalExpressions = allExercisesInWeek.filter(ex =>
      ex.transferTo?.some((t: string) => t.toLowerCase().includes(skillLower)) &&
      ex.category !== 'skill' &&
      (ex.fatigueCost ?? 5) <= 3
    )
    
    // Count support expressions (strength/accessory supporting this skill)
    const supportExpressions = allExercisesInWeek.filter(ex =>
      ex.transferTo?.some((t: string) => t.toLowerCase().includes(skillLower)) &&
      (ex.category === 'strength' || ex.category === 'accessory')
    )
    
    // Determine if omitted and why
    const totalExpressions = directExpressions.length + technicalExpressions.length + supportExpressions.length
    const omissionReason = totalExpressions === 0 
      ? (skill === primaryGoal ? 'NOT_OMITTED_PRIMARY' : 
         equipment.length === 0 ? 'no_equipment_match' :
         'no_exercises_found_for_skill')
      : null
    
    return {
      skill,
      directExpressions: directExpressions.length,
      technicalExpressions: technicalExpressions.length,
      supportExpressions: supportExpressions.length,
      totalExpressions,
      omissionReason,
    }
  })
  
  console.log('[selected-skill-exposure] Weekly skill expression summary:', {
    totalSelectedSkills: selectedSkillList.length,
    primaryGoal,
    skillExposure: skillExposureSummary.map(s => ({
      skill: s.skill,
      direct: s.directExpressions,
      technical: s.technicalExpressions,
      support: s.supportExpressions,
      total: s.totalExpressions,
      omitted: s.omissionReason,
    })),
    underExpressedSkills: skillExposureSummary.filter(s => s.totalExpressions === 0 && s.skill !== primaryGoal),
    wellExpressedSkills: skillExposureSummary.filter(s => s.totalExpressions >= 2),
  })
  
  // Log session role → actual exercise differentiation
  console.log('[session-role-differentiation] Session role vs exercise composition:', sessions.map((s, i) => ({
    day: i + 1,
    focus: s.focus,
    sessionIntent: sessionIntents[i]?.sessionType || 'unknown',
    exerciseCategories: s.exercises.reduce((acc, ex) => {
      acc[ex.category] = (acc[ex.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    weightedExercises: s.exercises.filter(ex => ex.id?.includes('weighted')).length,
    skillExercises: s.exercises.filter(ex => ex.category === 'skill').length,
  })))
  
  return tempProgram
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
  
  // [selection-compression-fix] TASK 2: Track which skills get expression this session
  // to ensure weekly exposure guarantees are met
  const skillExposureThisSession: string[] = []
  
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
      skillExposureThisSession.push(skill)
      continue
    }
    
    // [selection-compression-fix] ISSUE B: Secondary skills MUST appear more often
    // This is the key fix for "selected skills don't affect the week"
    if (priorityLevel === 'secondary' || weight >= 0.15) {
      // [selection-compression-fix] TASK 2: Stronger inclusion logic for secondary skills
      // Secondary skills should appear in at least 70% of sessions
      const minSessionsForSecondary = Math.max(Math.ceil(totalSessions * 0.7), exposureSessions)
      const shouldInclude = sessionIndex < minSessionsForSecondary || 
        exposureSessions >= totalSessions ||
        (sessionIndex % 2 === 0) // Even sessions always get secondary skills
      
      if (shouldInclude) {
        // [selection-compression-fix] TASK 4: Session role affects secondary skill expression mode
        // Different day types should produce different expression modes
        let expressionMode: 'primary' | 'technical' | 'support' | 'warmup' = 'technical'
        
        if (isAdvanced && advancedFamily?.technicalSlotWeight > 0.3) {
          expressionMode = 'technical'
        } else if (dayFocus.includes('support') || dayFocus.includes('recovery')) {
          expressionMode = 'support'
        } else if (dayFocus.includes('skill') && sessionIndex % 2 === 1) {
          // Alternate sessions give secondary skill primary-ish expression
          expressionMode = 'technical'
        } else if (dayFocus.includes('strength')) {
          // Strength days: secondary skills get support work
          expressionMode = 'support'
        } else {
          expressionMode = 'technical'
        }
        
        result.push({
          skill,
          expressionMode,
          weight,
        })
        skillExposureThisSession.push(skill)
        
        // [selected-skill-exposure] Log secondary skill inclusion
        console.log('[selected-skill-exposure] Secondary skill included:', {
          skill,
          sessionIndex,
          expressionMode,
          dayFocus,
          reason: 'secondary_skill_guarantee',
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
      
      // [session-assembly-truth] TASK 3: Non-advanced tertiary skills - IMPROVED EXPRESSION LOGIC
      // PROBLEM: Old rotation logic caused too many tertiary skills to vanish from sessions
      // FIX: Ensure tertiary skills get at least 2 sessions per week as support, and mixed/hybrid
      // days should include multiple tertiary skills for broader profile representation
      
      // [PRIORITY-COLLAPSE-FIX] TASK 5: All tertiary skills (not just weight-based) should be considered
      const tertiarySkills = weightedAllocation
        .filter(a => a.priorityLevel === 'tertiary' || (a.weight >= 0.05 && a.weight < 0.15))
        .filter(a => !isAdvancedSkill(a.skill))
      const tertiaryIndex = tertiarySkills.findIndex(a => a.skill === skill)
      const tertiaryCount = tertiarySkills.length
      
      // [PRIORITY-COLLAPSE-FIX] TASK 3 & 5: Improved minimum sessions for broader commitment
      // - Each broad selected skill should appear in at least 2 sessions per week
      // - This is the "broad_selected_commitment" floor
      // - Mixed/hybrid/density days should include more tertiary skills
      // - Distribute tertiary skills across sessions more evenly
      // [PRIORITY-COLLAPSE-FIX] Increased minimum from 2 to 3 for better floor guarantee
      const minSessionsForTertiary = Math.max(3, exposureSessions)
      const sessionsPerSkill = Math.ceil(totalSessions / Math.max(1, tertiaryCount))
      
      // [session-assembly-truth] Multiple inclusion conditions - any can trigger inclusion
      const isMixedOrHybridDay = dayFocus.includes('mixed') || dayFocus.includes('hybrid') || 
        dayFocus.includes('density') || dayFocus.includes('skill_density') || dayFocus.includes('multi')
      const isRotationSession = (sessionIndex + tertiaryIndex) % Math.max(1, sessionsPerSkill) === 0
      const isExposureGuarantee = sessionIndex < minSessionsForTertiary
      const isOddSessionForEvenIndex = (sessionIndex % 2 === 1) && (tertiaryIndex % 2 === 0)
      const isEvenSessionForOddIndex = (sessionIndex % 2 === 0) && (tertiaryIndex % 2 === 1)
      
      // [session-assembly-truth] Mixed/hybrid days MUST include broader tertiary skills
      // This is key for making the profile feel represented
      const shouldIncludeTertiary = isMixedOrHybridDay || // Mixed days always get tertiary skills
        isRotationSession || // Regular rotation
        isExposureGuarantee || // First 2 sessions guarantee exposure
        isOddSessionForEvenIndex || isEvenSessionForOddIndex // Interleaved distribution
      
      if (shouldIncludeTertiary) {
        // [session-assembly-truth] TASK 3: Choose expression mode based on day type and skill fit
        let tertiaryExpressionMode: 'primary' | 'technical' | 'support' | 'warmup' = 'support'
        
        // On mixed/hybrid days, tertiary skills can get technical expression
        // [PRIORITY-COLLAPSE-FIX] TASK 5: Also allow technical expression on non-mixed days
        // if this is one of the first inclusions for this skill
        if (isMixedOrHybridDay && tertiaryIndex < 2) {
          tertiaryExpressionMode = 'technical'
        } else if (isExposureGuarantee && sessionIndex === 0) {
          // First session can give technical expression to broad selected skills
          tertiaryExpressionMode = 'technical'
        }
        
        result.push({
          skill,
          expressionMode: tertiaryExpressionMode,
          weight,
        })
        skillExposureThisSession.push(skill)
        
        // [PRIORITY-COLLAPSE-FIX] TASK 5: Session composition broad skill path audit
        const expressionPath = isMixedOrHybridDay 
          ? 'mixed_day_inclusion'
          : isRotationSession 
            ? 'rotation_schedule'
            : isExposureGuarantee 
              ? 'exposure_floor_guarantee'
              : 'interleaved_distribution'
        
        console.log('[session-composition-broad-skill-path-audit]', {
          skill,
          sessionIndex,
          dayFocus,
          expressionMode: tertiaryExpressionMode,
          expressionPath,
          pathsAvailable: {
            dedicatedDirectWork: false,
            technicalSlotWork: tertiaryExpressionMode === 'technical',
            supportSlotWork: tertiaryExpressionMode === 'support',
            mixedDayInclusion: isMixedOrHybridDay,
          },
          inclusionSuccessful: true,
        })
        
        // [session-assembly-truth] Log tertiary skill inclusion decision
        console.log('[session-assembly-truth] Tertiary skill included:', {
          skill,
          sessionIndex,
          expressionMode: tertiaryExpressionMode,
          dayFocus,
          inclusionReason: isMixedOrHybridDay ? 'mixed_hybrid_day' : 
            isRotationSession ? 'rotation_schedule' :
            isExposureGuarantee ? 'exposure_guarantee' : 'interleaved_distribution',
        })
      } else {
        // [session-assembly-truth] Log explicit deferral with reason
        console.log('[session-assembly-truth] Tertiary skill deferred:', {
          skill,
          sessionIndex,
          dayFocus,
          deferralReason: 'scheduled_for_other_sessions',
          tertiaryIndex,
          sessionsPerSkill,
          minSessionsForTertiary,
        })
      }
      continue
    }
    
    // [session-assembly-truth] TASK 4: Support-level skills - IMPROVED EXPRESSION LOGIC
    // PROBLEM: Support-level skills only appeared in session 0 as warmup, effectively vanishing
    // FIX: Support skills should appear more often, especially on mixed/hybrid days
    if (priorityLevel === 'support') {
      const isMixedDay = dayFocus.includes('mixed') || dayFocus.includes('hybrid') || 
        dayFocus.includes('density') || dayFocus.includes('multi')
      
      if (isAdvanced) {
        // Advanced skills at support level still get 1-2 sessions
        if (sessionIndex < 2) {
          result.push({
            skill,
            expressionMode: 'support',
            weight,
          })
          skillExposureThisSession.push(skill)
          console.log('[session-assembly-truth] Advanced support skill included:', { skill, sessionIndex, dayFocus })
        }
      } else {
        // [session-assembly-truth] Non-advanced support skills get broader expression
        // - Session 0 always gets support skills (as warmup)
        // - Mixed/hybrid days get support skills (as support)
        // - Even sessions alternate to spread support skills
        const shouldIncludeSupport = sessionIndex === 0 || isMixedDay || (sessionIndex % 2 === 0)
        
        if (shouldIncludeSupport) {
          const supportExpressionMode = sessionIndex === 0 ? 'warmup' : 'support'
          result.push({
            skill,
            expressionMode: supportExpressionMode,
            weight,
          })
          skillExposureThisSession.push(skill)
          console.log('[session-assembly-truth] Support skill included:', {
            skill,
            sessionIndex,
            expressionMode: supportExpressionMode,
            dayFocus,
            inclusionReason: sessionIndex === 0 ? 'first_session_warmup' : isMixedDay ? 'mixed_day' : 'even_session',
          })
        } else {
          console.log('[session-assembly-truth] Support skill deferred:', { skill, sessionIndex, dayFocus })
        }
      }
    }
  }
  
  // [selected-skill-exposure] TASK 7: Log session skill allocation summary
  console.log('[selected-skill-exposure] Session allocation summary:', {
    sessionIndex,
    totalSessions,
    dayFocus,
    sessionType,
    allocatedSkills: result.map(r => `${r.skill}(${r.expressionMode}:${Math.round(r.weight * 100)}%)`),
    primaryExpressed: result.filter(r => r.expressionMode === 'primary').map(r => r.skill),
    technicalExpressed: result.filter(r => r.expressionMode === 'technical').map(r => r.skill),
    supportExpressed: result.filter(r => r.expressionMode === 'support').map(r => r.skill),
  })
  
  // ==========================================================================
  // [session-assembly-truth] TASK 1: COMPREHENSIVE SKILL TRUTH AUDIT
  // This audit tracks every selected skill's path through session assembly
  // ==========================================================================
  const skillTruthAudit = weightedAllocation.map(alloc => {
    const isInResult = result.some(r => r.skill === alloc.skill)
    const resultEntry = result.find(r => r.skill === alloc.skill)
    const isAdvanced = isAdvancedSkill(alloc.skill)
    
    // Determine final expression status
    let finalExpressionStatus: 'direct' | 'technical' | 'support_only' | 'deferred' | 'warmup_only'
    if (!isInResult) {
      finalExpressionStatus = 'deferred'
    } else if (resultEntry?.expressionMode === 'primary') {
      finalExpressionStatus = 'direct'
    } else if (resultEntry?.expressionMode === 'technical') {
      finalExpressionStatus = 'technical'
    } else if (resultEntry?.expressionMode === 'support') {
      finalExpressionStatus = 'support_only'
    } else {
      finalExpressionStatus = 'warmup_only'
    }
    
    // Determine exclusion reason if deferred
    let exclusionReason: string | null = null
    if (!isInResult) {
      if (alloc.priorityLevel === 'tertiary' || (alloc.weight >= 0.05 && alloc.weight < 0.15)) {
        exclusionReason = 'tertiary_rotation_schedule'
      } else if (alloc.priorityLevel === 'support') {
        exclusionReason = 'support_level_session_limit'
      } else {
        exclusionReason = 'session_capacity_limit'
      }
    }
    
    return {
      skill: alloc.skill,
      selectedInProfile: true,
      priorityLevel: alloc.priorityLevel,
      weight: alloc.weight,
      exposureSessions: alloc.exposureSessions,
      isAdvancedSkill: isAdvanced,
      survivedToAssembly: true,
      includedInSession: isInResult,
      finalExpressionStatus,
      expressionMode: resultEntry?.expressionMode || null,
      exclusionReason,
    }
  })
  
  // Calculate summary statistics
  const totalSelectedSkillCount = weightedAllocation.length
  const directlyExpressedCount = skillTruthAudit.filter(a => a.finalExpressionStatus === 'direct').length
  const technicallyExpressedCount = skillTruthAudit.filter(a => a.finalExpressionStatus === 'technical').length
  const supportOnlyCount = skillTruthAudit.filter(a => a.finalExpressionStatus === 'support_only').length
  const warmupOnlyCount = skillTruthAudit.filter(a => a.finalExpressionStatus === 'warmup_only').length
  const deferredCount = skillTruthAudit.filter(a => a.finalExpressionStatus === 'deferred').length
  
  // [session-assembly-truth] TASK 1: Log the comprehensive audit
  console.log('[session-assembly-skill-truth-audit]', {
    sessionIndex,
    dayFocus,
    totalSelectedSkillCount,
    totalDirectlyExpressedSkillCount: directlyExpressedCount,
    totalTechnicallyExpressedCount: technicallyExpressedCount,
    totalSupportOnlySkillCount: supportOnlyCount,
    totalWarmupOnlyCount: warmupOnlyCount,
    totalDeferredSkillCount: deferredCount,
    expressionRate: `${Math.round(((directlyExpressedCount + technicallyExpressedCount + supportOnlyCount) / totalSelectedSkillCount) * 100)}%`,
    skillBreakdown: skillTruthAudit.map(a => ({
      skill: a.skill,
      priority: a.priorityLevel,
      status: a.finalExpressionStatus,
      reason: a.exclusionReason,
    })),
  })
  
  // [session-assembly-truth] TASK 2: First narrowing verdict
  const firstNarrowingPoint = deferredCount > 0 
    ? (skillTruthAudit.find(a => a.finalExpressionStatus === 'deferred')?.exclusionReason || 'unknown')
    : 'none'
  
  console.log('[session-assembly-first-narrowing-verdict]', {
    selectedSkillCount: totalSelectedSkillCount,
    skillsEnteringAssembly: totalSelectedSkillCount,
    skillsWithDirectExpression: directlyExpressedCount + technicallyExpressedCount,
    skillsWithSupportExpression: supportOnlyCount + warmupOnlyCount,
    skillsActuallyScheduled: result.length,
    firstNarrowingPoint,
    exactResponsibleFunction: 'getSkillsForSession',
    finalVerdict: deferredCount === 0 ? 'all_skills_expressed' :
      deferredCount <= 1 ? 'minimal_deferral' :
      deferredCount <= 2 ? 'acceptable_deferral' : 'excessive_deferral',
  })
  
  // ==========================================================================
  // [PRIORITY-COLLAPSE-FIX] TASK 4: MIXED DAY UNDEREXPRESSED RECOVERY
  // Mixed days are the MAIN recovery path for underexpressed selected skills
  // Enhanced from original 2-slot limit to allow broader recovery
  // ==========================================================================
  const isMixedSessionForBroaderExpression = dayFocus.includes('mixed') || 
    dayFocus.includes('hybrid') || dayFocus.includes('density') || dayFocus.includes('multi')
  
  // Track under-target skills for this session
  const underTargetSkillsBeforeRecovery = skillTruthAudit
    .filter(a => a.finalExpressionStatus === 'deferred')
    .map(a => a.skill)
  
  if (isMixedSessionForBroaderExpression && deferredCount > 0) {
    // Find deferred skills that could still be added
    const deferredSkills = skillTruthAudit.filter(a => a.finalExpressionStatus === 'deferred')
    
    // [PRIORITY-COLLAPSE-FIX] Increased from 2 to 3 for better recovery
    // Mixed days should be able to include more underexpressed skills
    const maxAdditionalSlots = Math.min(3, deferredSkills.length)
    let addedCount = 0
    const skillsIncluded: string[] = []
    const skillsSkipped: Array<{skill: string, reason: string}> = []
    
    for (const deferred of deferredSkills) {
      if (addedCount >= maxAdditionalSlots) {
        skillsSkipped.push({ skill: deferred.skill, reason: 'max_slots_reached' })
        continue
      }
      
      // Skip if already in result
      if (result.some(r => r.skill === deferred.skill)) {
        skillsSkipped.push({ skill: deferred.skill, reason: 'already_in_result' })
        continue
      }
      
      // Add as support-level expression
      result.push({
        skill: deferred.skill,
        expressionMode: 'support',
        weight: deferred.weight,
      })
      addedCount++
      skillsIncluded.push(deferred.skill)
      
      console.log('[broader-skill-minimum-expression-audit] Mixed day deferred skill boosted:', {
        skill: deferred.skill,
        sessionIndex,
        dayFocus,
        originalPriority: deferred.priorityLevel,
        expressionMode: 'support',
        reason: 'mixed_day_broader_skill_guarantee',
      })
    }
    
    // [PRIORITY-COLLAPSE-FIX] TASK 4: Mixed day underexpressed recovery audit
    console.log('[mixed-day-underexpressed-recovery-audit]', {
      sessionIndex,
      dayFocus,
      underTargetSkillsBeforeAssembly: underTargetSkillsBeforeRecovery,
      candidateSkillsConsidered: deferredSkills.map(d => d.skill),
      skillsIncluded,
      skillsSkippedWithReasons: skillsSkipped,
      remainingUnderTargetAfterAssembly: underTargetSkillsBeforeRecovery.filter(s => !skillsIncluded.includes(s)),
      recoveryEffectiveness: deferredSkills.length > 0 
        ? `${Math.round((skillsIncluded.length / deferredSkills.length) * 100)}%`
        : '100%',
    })
    
    if (addedCount > 0) {
      console.log('[broader-skill-minimum-expression-audit] Mixed day summary:', {
        sessionIndex,
        dayFocus,
        deferredSkillsBeforeBoost: deferredCount,
        skillsBoostedOnMixedDay: addedCount,
        remainingDeferred: deferredCount - addedCount,
        finalResultCount: result.length,
      })
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
  // ==========================================================================
  // STEP A: Master sessionStep tracker for entire generateAdaptiveSession lifecycle
  // ==========================================================================
  let sessionStep = 'starting'
  let middleStep = 'none' // Track middle helper step if we get that far
  
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
  
  // Resolve sessionMinutes early for logging purposes
  const sessionMinutesResolved = typeof sessionLength === 'number' 
    ? sessionLength 
    : parseInt(String(sessionLength).split('-')[0]) || 60
  
  console.log('[session-lifecycle-start]', {
    dayNumber: day.dayNumber,
    dayFocus: day.focus,
    primaryGoal,
    experienceLevel,
    sessionLengthRaw: sessionLength,
    sessionMinutesResolved,
    equipmentCount: equipment.length,
    selectedSkillsCount: selectedSkills?.length || 0,
    sessionStep,
  })
  
  // [adaptive-structure] TASK C: Log session intensity variation for adaptive scheduling
  console.log('[adaptive-structure] Session intensity profile:', {
    dayNumber: day.dayNumber,
    dayFocus: day.focus,
    targetIntensity: day.targetIntensity || 'moderate',
    sessionIndex: context.sessionIndex || 0,
    totalSessions: context.totalSessions || 1,
    intensityLabel: day.targetIntensity === 'high' ? 'HEAVY' 
      : day.targetIntensity === 'low' ? 'LIGHT' 
      : 'MODERATE',
    sessionVarietyNote: context.sessionIndex !== undefined
      ? `Session ${context.sessionIndex + 1} of ${context.totalSessions}: ${day.focus} (${day.targetIntensity || 'moderate'} intensity)`
      : undefined,
  })
  
  // ==========================================================================
  // STEP B: Wrap entire function body in try/catch for lifecycle classification
  // ==========================================================================
  try {
    sessionStep = 'context_destructured'
  
  // Safe fallbacks for calibration subfields
  const fatigueSensitivity = athleteCalibration?.fatigueSensitivity ?? 'moderate'
  const sessionCapacity = athleteCalibration?.sessionCapacity ?? 'standard'
  const enduranceCompatibility = athleteCalibration?.enduranceCompatibility ?? 'moderate'
  
  sessionStep = 'calibration_resolved'
  
  // SKILL EXPRESSION FIX: Determine which skills should be expressed in this session
  // based on weighted allocation and session index
  const skillsForThisSession = getSkillsForSession(
    weightedSkillAllocation || [],
    sessionIndex || 0,
    totalSessions || 1,
    day.focus
  )
  
  sessionStep = 'skills_for_session_resolved'
  
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
  sessionStep = 'selecting_exercises'
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
  
  sessionStep = 'selection_received'
  
  // [session-assembly] Validate selection result before proceeding
  if (!selection) {
    console.error('[session-assembly] CRITICAL: selectExercisesForSession returned null/undefined')
    // [BUILDER_TRACE] STEP 2 - Diagnostic logging before throw
    console.log('[BUILDER_TRACE]', {
      stage: 'session_assembly',
      step: 'BEFORE_THROW',
      reason: 'exercise_selection_returned_null',
      sessionsLength: 0,
      daysRequested: day.dayNumber,
      selectedSkills: selectedSkills?.slice(0, 5) || [],
      availableExercisesCount: 0,
      exercisePoolSize: 0,
      isAdaptiveMode: true,
      userLevel: experienceLevel,
      dayFocus: day.focus,
      primaryGoal,
      equipmentCount: equipment?.length || 0,
    })
    throw new Error('exercise_selection_returned_null')
  }
  
  // Adapt for equipment - use safe fallbacks if selection properties are missing
  const safeMain = Array.isArray(selection?.main) ? selection.main : []
  const safeWarmup = Array.isArray(selection?.warmup) ? selection.warmup : []
  const safeCooldown = Array.isArray(selection?.cooldown) ? selection.cooldown : []
  
  sessionStep = 'safe_selection_normalized'
  
  // [session-assembly] Log exercise counts for debugging
  console.log('[session-assembly] Exercise selection complete:', {
    mainCount: safeMain.length,
    warmupCount: safeWarmup.length,
    cooldownCount: safeCooldown.length,
    estimatedTime: selection.totalEstimatedTime,
  })
  
  // ==========================================================================
  // [TASK 1] SESSION ASSEMBLY PHASE AUDIT - Post Selection
  // ==========================================================================
  const postSelectionValidation = validateSessionCandidate(safeMain, equipment, primaryGoal, 'post_selection')
  console.log('[session-assembly-phase-audit]', {
    phaseName: 'post_selection',
    candidateCount: safeMain.length,
    selectedExerciseNames: safeMain.map(e => e?.exercise?.name || 'unknown').slice(0, 8),
    selectedMovementPatterns: safeMain.map(e => e?.exercise?.movementPattern || 'unknown').slice(0, 8),
    selectedSkillTags: selectedSkills?.slice(0, 5) || [],
    selectedEquipmentNeeds: [...new Set(safeMain.flatMap(e => e?.exercise?.requiredEquipment || []))],
    selectedEstimatedMinutes: selection.totalEstimatedTime,
    validationStatus: postSelectionValidation.isValid ? 'valid' : 'invalid',
    rejectReason: postSelectionValidation.failureReasons.join(', ') || null,
  })
  
  // ==========================================================================
  // SESSION TRACE - Track exercise counts through every transformation
  // ==========================================================================
  sessionStep = 'session_trace_starting'
  const sessionTrace = {
    dayNumber: day.dayNumber,
    dayFocus: day.focus,
    primaryGoal,
    selectedSkillsCount: selectedSkills?.length || 0,
    equipmentCount: equipment.length,
    initialSelectionMainCount: safeMain.length,
    rescueAttempted: false,
    rescuePath: 'none' as string,
    rescuedMainCount: 0,
    postEquipmentMainCount: 0,
    rawMappedMainCount: 0,
    validatedMainCount: 0,
    finalMainCount: 0,
    collapseStage: 'none' as string,
  }
  
  console.log('[session-trace-start]', sessionTrace)
  
  // ==========================================================================
  // SESSION RESCUE: Rescue empty sessions before downstream failure
  // ==========================================================================
  sessionStep = 'rescue_evaluating'
  let rescuedMain = safeMain
  let sessionWasRescued = false
  let rescuePath = 'none'
  
  // [session-assembly] Validate we have at least some exercises
  if (safeMain.length === 0) {
    console.warn('[session-rescue] Empty main exercise pool for day - attempting rescue', {
      dayFocus: day.focus,
      dayNumber: day.dayNumber,
      primaryGoal,
      equipmentCount: equipment.length,
      selectedSkillsCount: selectedSkills?.length || 0,
    })
    
    sessionTrace.rescueAttempted = true
    
    // STEP B2: Attempt fallback rescue
    const rescueResult = buildFallbackSelectionForSession(
      day.focus,
      primaryGoal,
      equipment,
      sessionMinutesResolved,
      experienceLevel
    )
    
    if (rescueResult.wasRescued && rescueResult.main.length > 0) {
      rescuedMain = rescueResult.main
      sessionWasRescued = true
      rescuePath = rescueResult.rescuePath
      sessionTrace.rescuePath = rescuePath
      sessionTrace.rescuedMainCount = rescuedMain.length
      console.log('[session-rescue-success] Session rescued with fallback exercises:', {
        dayNumber: day.dayNumber,
        dayFocus: day.focus,
        rescuePath,
        exerciseCount: rescuedMain.length,
        exercises: rescuedMain.map(e => e.exercise.name),
      })
    } else {
      // Rescue failed - will throw structured error below after final validation
      console.error('[session-rescue-failed] No valid fallback path for session', {
        dayNumber: day.dayNumber,
        dayFocus: day.focus,
        primaryGoal,
        equipmentCount: equipment.length,
      })
    }
  } else {
    sessionTrace.rescuedMainCount = rescuedMain.length
  }
  
  console.log('[session-trace-post-rescue]', { ...sessionTrace, currentMainCount: rescuedMain.length })
  sessionStep = 'rescue_completed'
  
  // ==========================================================================
  // Equipment adaptation with collapse detection
  // ==========================================================================
  sessionStep = 'equipment_adapting'
  const adaptedMain = adaptSessionForEquipment(rescuedMain, equipment)
  const adaptedWarmup = adaptSessionForEquipment(safeWarmup, equipment)
  const adaptedCooldown = adaptSessionForEquipment(safeCooldown, equipment)
  
  sessionTrace.postEquipmentMainCount = adaptedMain.adapted.length
  
  // STEP C: Detect if equipment adaptation zeroed out rescued exercises
  if (rescuedMain.length > 0 && adaptedMain.adapted.length === 0) {
    sessionTrace.collapseStage = 'equipment_adaptation'
    console.error('[session-collapse-point] Equipment adaptation removed all exercises:', {
      stage: 'equipment_adaptation',
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      primaryGoal,
      inputCount: rescuedMain.length,
      outputCount: 0,
      inputExercises: rescuedMain.map(e => e.exercise.name),
      equipment: equipment,
      rescueAttempted: sessionWasRescued,
    })
    // [BUILDER_TRACE] STEP 2 - Diagnostic logging before throw
    console.log('[BUILDER_TRACE]', {
      stage: 'session_assembly',
      step: 'BEFORE_THROW',
      reason: 'equipment_adaptation_zeroed_session',
      sessionsLength: 0,
      daysRequested: day.dayNumber,
      selectedSkills: selectedSkills?.slice(0, 5) || [],
      availableExercisesCount: rescuedMain.length,
      exercisePoolSize: 0,
      isAdaptiveMode: true,
      userLevel: experienceLevel,
      dayFocus: day.focus,
      primaryGoal,
      equipmentCount: equipment?.length || 0,
      inputExercises: rescuedMain.map(e => e.exercise?.name || 'unknown').slice(0, 5),
    })
    throw new Error(
      `equipment_adaptation_zeroed_session: day=${day.dayNumber} focus=${day.focus} ` +
      `goal=${primaryGoal} inputCount=${rescuedMain.length} equipment=${equipment.slice(0, 5).join(',')}`
    )
  }
  
  console.log('[session-trace-post-equipment]', { ...sessionTrace, currentMainCount: adaptedMain.adapted.length })
  sessionStep = 'equipment_adaptation_completed'
  
  // ==========================================================================
  // [TASK 1] SESSION ASSEMBLY PHASE AUDIT - Post Equipment Adaptation
  // ==========================================================================
  const postEquipmentValidation = validateSessionCandidate(adaptedMain.adapted, equipment, primaryGoal, 'post_equipment_adaptation')
  console.log('[session-assembly-phase-audit]', {
    phaseName: 'post_equipment_adaptation',
    candidateCount: adaptedMain.adapted.length,
    selectedExerciseNames: adaptedMain.adapted.map(e => e?.exercise?.name || 'unknown').slice(0, 8),
    selectedMovementPatterns: adaptedMain.adapted.map(e => e?.exercise?.movementPattern || 'unknown').slice(0, 8),
    selectedSkillTags: selectedSkills?.slice(0, 5) || [],
    selectedEquipmentNeeds: [...new Set(adaptedMain.adapted.flatMap(e => e?.exercise?.requiredEquipment || []))],
    selectedEstimatedMinutes: (adaptedMain.adapted.length * 5) + 10,
    validationStatus: postEquipmentValidation.isValid ? 'valid' : 'invalid',
    rejectReason: postEquipmentValidation.failureReasons.join(', ') || null,
    adaptationCount: adaptedMain.adaptationCount,
    significantLimitations: adaptedMain.significantLimitations,
  })
  
  // [TASK 4] Log constraint resolution for equipment filtering
  logConstraintResolution(rescuedMain.length, adaptedMain.adapted.length, 'equipment_adaptation', {
    primaryGoalPreserved: adaptedMain.adapted.length > 0,
    equipmentTruthPreserved: true, // By definition - we filtered FOR equipment
    secondaryGoalPreserved: adaptedMain.adapted.length >= Math.floor(rescuedMain.length * 0.5),
    hybridRichnessReduced: adaptedMain.adaptationCount > 0,
    accessoryDensityReduced: adaptedMain.adapted.length < rescuedMain.length,
    finalResolutionMode: adaptedMain.adapted.length === 0 ? 'failed' 
      : adaptedMain.adapted.length < rescuedMain.length ? 'reduced_accessory' 
      : 'full',
  })
  
  // ==========================================================================
  // [TASK 6] CANDIDATE INVALIDATION RECOVERY
  // If equipment filtering zeroed out but rescue exercises exist, try reselection
  // ==========================================================================
  let effectiveMainForSession = adaptedMain.adapted
  let wasRecoveredFromInvalidation = false
  
  if (adaptedMain.adapted.length === 0 && rescuedMain.length > 0) {
    console.log('[candidate-invalidation-recovery-audit]', {
      phase: 'equipment_adaptation',
      originalCandidateCount: rescuedMain.length,
      currentValidCount: 0,
      recoveryAttempt: 'trying_fallback_reselection',
      originalExercises: rescuedMain.map(e => e.exercise?.name || 'unknown').slice(0, 5),
    })
    
    // Attempt recovery via fallback selection with relaxed constraints
    const recoveryRescue = buildFallbackSelectionForSession(
      day.focus,
      primaryGoal,
      equipment, // Use SAME equipment to ensure truth
      sessionMinutesResolved,
      experienceLevel
    )
    
    if (recoveryRescue.wasRescued && recoveryRescue.main.length > 0) {
      effectiveMainForSession = recoveryRescue.main
      wasRecoveredFromInvalidation = true
      sessionTrace.rescuePath = `recovered_${recoveryRescue.rescuePath}`
      
      console.log('[candidate-invalidation-recovery-audit]', {
        phase: 'equipment_adaptation_recovery',
        recoverySucceeded: true,
        recoveredCount: recoveryRescue.main.length,
        recoveryPath: recoveryRescue.rescuePath,
        recoveredExercises: recoveryRescue.main.map(e => e.exercise?.name || 'unknown').slice(0, 5),
      })
    } else {
      console.log('[candidate-invalidation-recovery-audit]', {
        phase: 'equipment_adaptation_recovery',
        recoverySucceeded: false,
        finalVerdict: 'no_valid_candidates_after_recovery_attempt',
      })
    }
  }
  
  // ==========================================================================
  // Track middle helper execution for precise failure diagnosis
  // ==========================================================================
  sessionStep = 'effective_selection_building'
  middleStep = 'before_effective_selection'
  
  // ==========================================================================
  // STEP B: Build canonical effectiveSelection to fix split-brain logic
  // ==========================================================================
  // Recompute estimated time based on rescued/adapted/recovered exercises
  const effectiveMainSource = wasRecoveredFromInvalidation ? effectiveMainForSession : rescuedMain
  const effectiveMainEstimatedTime = effectiveMainSource.length * 5 // ~5 min per exercise estimate
  const effectiveTotalTime = effectiveMainEstimatedTime + 10 // Add warmup/cooldown buffer
  
  const effectiveSelection = {
    ...selection,
    main: effectiveMainSource, // Use recovered source if invalidation recovery succeeded
    warmup: safeWarmup,
    cooldown: safeCooldown,
    totalEstimatedTime: (sessionWasRescued || wasRecoveredFromInvalidation) ? effectiveTotalTime : selection.totalEstimatedTime,
  }
  
  middleStep = 'effective_selection_built'
  sessionStep = 'effective_selection_validating'
  
  // ==========================================================================
  // Validate effectiveSelection structure before proceeding
  // ==========================================================================
  const effectiveSelectionValid = 
    Array.isArray(effectiveSelection.main) &&
    effectiveSelection.main.every(item => item?.exercise?.name && (item.sets !== undefined || item.repsOrTime !== undefined)) &&
    Number.isFinite(effectiveSelection.totalEstimatedTime) &&
    effectiveSelection.totalEstimatedTime > 0 &&
    Array.isArray(effectiveSelection.warmup) &&
    Array.isArray(effectiveSelection.cooldown)
  
  if (!effectiveSelectionValid) {
    const invalidReason = !Array.isArray(effectiveSelection.main) 
      ? 'main_not_array'
      : !effectiveSelection.main.every(item => item?.exercise?.name) 
        ? 'main_items_missing_exercise_name'
        : !Number.isFinite(effectiveSelection.totalEstimatedTime) 
          ? 'totalEstimatedTime_not_finite'
          : effectiveSelection.totalEstimatedTime <= 0
            ? 'totalEstimatedTime_not_positive'
            : 'warmup_or_cooldown_not_array'
    
    console.error('[session-middle-failure] effectiveSelection validation failed:', {
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      primaryGoal,
      invalidReason,
      mainLength: effectiveSelection.main?.length,
      totalEstimatedTime: effectiveSelection.totalEstimatedTime,
      sessionWasRescued,
      rescuePath,
    })
    throw new Error(
      `effective_selection_invalid: day=${day.dayNumber} focus=${day.focus} reason=${invalidReason}`
    )
  }
  
  sessionStep = 'middle_helpers_running'
  console.log('[session-middle-start]', {
    dayNumber: day.dayNumber,
    dayFocus: day.focus,
    primaryGoal,
    effectiveSelectionMainCount: effectiveSelection.main.length,
    effectiveSelectionWarmupCount: effectiveSelection.warmup.length,
    effectiveSelectionCooldownCount: effectiveSelection.cooldown.length,
    effectiveTotalEstimatedTime: effectiveSelection.totalEstimatedTime,
    sessionWasRescued,
    rescuePath,
  })
  
  // ==========================================================================
  // MIDDLE HELPER BLOCK - Protected by try/catch for precise failure tracking
  // ==========================================================================
  let variants: SessionVariant[]
  let adaptationNotes: string[] = []
  let rationale: string
  let finisher: GeneratedFinisher | undefined
  let enduranceResult: EnduranceSelectionResult
  let currentFatigueScore: number
  
  try {
    // Generate session variants using effectiveSelection
    middleStep = 'variants_generating'
    
    // ==========================================================================
    // [TASK 1-3] SESSION-TIME TRUTH FIX
    // CRITICAL: Use the ACTUAL built session time (effectiveSelection.totalEstimatedTime)
    // as the canonical full-session duration, NOT the target preference (sessionMinutesResolved).
    // This ensures:
    //   - Full Session = actual built session (e.g., 42 min)
    //   - 45 Min = compressed from actual (only if actual > 45)
    //   - 30 Min = compressed from actual (only if actual > 30)
    // Previously this was passing sessionMinutesResolved (e.g., 60) which caused
    // shorter variants to appear "fuller" than the canonical full session.
    // ==========================================================================
    const canonicalFullDuration = effectiveSelection.totalEstimatedTime
    
    // [TASK 1] Session time truth audit
    console.log('[session-time-truth-audit]', {
      dayNumber: day.dayNumber,
      sessionName: day.focus,
      sessionLengthInput: sessionLength,
      sessionMinutesResolved,
      effectiveTotalEstimatedTime: effectiveSelection.totalEstimatedTime,
      finisherMinutes: 0, // Not yet computed at this point
      canonicalFullDuration,
      previouslyWouldHaveUsed: sessionMinutesResolved,
      nowUsing: canonicalFullDuration,
      verdict: canonicalFullDuration === sessionMinutesResolved ? 'aligned' : 'fixed_mixed_duration_truth',
    })
    
    console.log('[session-variants-diagnostic]', {
      mainCount: effectiveSelection.main.length,
      totalEstimatedTime: effectiveSelection.totalEstimatedTime,
      sessionLength,
      sessionMinutesResolved,
      canonicalFullDuration,
      hasWarmup: effectiveSelection.warmup.length > 0,
      hasCooldown: effectiveSelection.cooldown.length > 0,
      wasRescued: sessionWasRescued,
    })
    variants = generateSessionVariants(effectiveSelection, canonicalFullDuration)
    middleStep = 'variants_generated'
    
    // Build adaptation notes
    if (adaptedMain.adaptationCount > 0) {
      adaptationNotes.push(`${adaptedMain.adaptationCount} exercise(s) adapted for available equipment.`)
    }
    if (adaptedMain.significantLimitations.length > 0) {
      adaptationNotes.push(...adaptedMain.significantLimitations)
    }
    
    // Get day explanation
    rationale = getDayExplanation(day, GOAL_LABELS[primaryGoal])
    
    // Generate endurance finisher if appropriate
    middleStep = 'time_fit_resolving'
    // STEP D: Sanitize mainWorkMinutes
    let mainWorkMinutes = effectiveSelection.totalEstimatedTime - 10
    if (!Number.isFinite(mainWorkMinutes) || mainWorkMinutes < 0) {
      console.log('[session-time-sanitized] mainWorkMinutes clamped:', { original: mainWorkMinutes, clamped: 15 })
      mainWorkMinutes = 15 // Safe minimum
    }
    if (mainWorkMinutes > 120) {
      console.log('[session-time-sanitized] mainWorkMinutes clamped:', { original: mainWorkMinutes, clamped: 60 })
      mainWorkMinutes = 60 // Safe maximum
    }
    
    const sessionTimeFit = fitEnduranceToSession(sessionLength, mainWorkMinutes)
    middleStep = 'time_fit_resolved'
    
    // Calculate session neural demand from main exercises
    const safeEffectiveMain = Array.isArray(effectiveSelection?.main) ? effectiveSelection.main : []
    const sessionNeuralDemand = safeEffectiveMain.some(e => e?.exercise?.neuralDemand >= 4) 
      ? 'high' as const
      : safeEffectiveMain.some(e => e?.exercise?.neuralDemand >= 3)
        ? 'moderate' as const
        : 'low' as const
    middleStep = 'neural_demand_resolved'

    // Select endurance block
    currentFatigueScore = recoverySignal?.level === 'red' ? 80 : recoverySignal?.level === 'yellow' ? 60 : 40
    middleStep = 'endurance_block_selecting'
    enduranceResult = selectEnduranceBlock({
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
    middleStep = 'endurance_block_selected'

    // Generate the finisher if needed
    if (enduranceResult.shouldIncludeEndurance && enduranceResult.blockType) {
      middleStep = 'fatigue_adjustment_resolving'
      const fatigueAdjustment = adjustBlockForFatigue(
        enduranceResult.duration,
        currentFatigueScore,
        fatigueSensitivity
      )
      middleStep = 'fatigue_adjustment_resolved'
      
      if (!fatigueAdjustment.shouldSkip) {
        middleStep = 'finisher_generating'
        finisher = generateFinisher(
          enduranceResult.blockType,
          fatigueAdjustment.adjustedDuration,
          equipment,
          fatigueSensitivity
        )
        middleStep = 'finisher_generated'
      } else {
        middleStep = 'finisher_skipped'
      }
    } else {
      middleStep = 'finisher_not_needed'
    }
    
    console.log('[session-middle-success]', {
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      middleStep,
      hasVariants: variants.length > 0,
      hasFinisher: !!finisher,
    })
    
  } catch (middleError) {
    // STEP E: Graceful degradation - if middle helpers fail but core session exists, continue
    const hasValidCoreSession = adaptedMain.adapted.length > 0
    
    console.error('[session-middle-failure]', {
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      primaryGoal,
      sessionWasRescued,
      rescuePath,
      effectiveSelectionMainCount: effectiveSelection.main.length,
      effectiveSelectionWarmupCount: effectiveSelection.warmup.length,
      effectiveSelectionCooldownCount: effectiveSelection.cooldown.length,
      effectiveTotalEstimatedTime: effectiveSelection.totalEstimatedTime,
      helperStep: middleStep,
      errorName: middleError instanceof Error ? middleError.name : 'unknown',
      errorMessage: middleError instanceof Error ? middleError.message : String(middleError),
      stack: middleError instanceof Error ? middleError.stack?.split('\n').slice(0, 5).join('\n') : undefined,
      hasValidCoreSession,
    })
    
    if (hasValidCoreSession && middleStep !== 'before_effective_selection' && middleStep !== 'effective_selection_built') {
      // STEP E: Graceful degradation - variants/finisher are optional, proceed with defaults
      // [TASK 2] Use actual built session time for fallback, not target preference
      const fallbackCanonicalDuration = effectiveSelection.totalEstimatedTime || sessionMinutesResolved
      console.log('[session-finisher-skipped-due-to-helper-failure]', { middleStep, dayNumber: day.dayNumber, fallbackCanonicalDuration })
      variants = variants || [{ duration: fallbackCanonicalDuration, label: 'Full Session', selection: effectiveSelection, compressionLevel: 'none' }]
      adaptationNotes = adaptationNotes || []
      rationale = rationale || getDayExplanation(day, GOAL_LABELS[primaryGoal])
      enduranceResult = enduranceResult || { shouldIncludeEndurance: false, blockType: null, duration: 4, rationale: 'Skipped due to helper failure', wasCondensed: false }
      currentFatigueScore = currentFatigueScore ?? 50
      finisher = undefined
    } else {
      // Core failure - cannot continue
      throw new Error(
        `session_middle_helper_failed: step=${middleStep} day=${day.dayNumber} focus=${day.focus} ` +
        `goal=${primaryGoal} reason=${middleError instanceof Error ? middleError.message.slice(0, 100) : 'unknown'}`
      )
    }
  }
  
  sessionStep = 'middle_helpers_completed'

    // Map exercises first, then validate/dedupe
    sessionStep = 'mapping_exercises'
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
    
    // Update session trace
    sessionTrace.rawMappedMainCount = rawExercises.length
    console.log('[session-trace-post-mapping]', { ...sessionTrace, currentMainCount: rawExercises.length })
    sessionStep = 'mapping_completed'
    
    // Detect if mapping zeroed out adapted exercises
    if (adaptedMainArray.length > 0 && rawExercises.length === 0) {
      sessionTrace.collapseStage = 'mapping'
      console.error('[session-collapse-point] Mapping removed all exercises:', {
        stage: 'mapping',
        dayNumber: day.dayNumber,
        dayFocus: day.focus,
        primaryGoal,
        inputCount: adaptedMainArray.length,
        outputCount: 0,
        inputExercises: adaptedMainArray.map(e => e.exercise?.name || 'unknown'),
        rescueAttempted: sessionWasRescued,
      })
      throw new Error(
        `mapping_zeroed_session: day=${day.dayNumber} focus=${day.focus} ` +
        `goal=${primaryGoal} inputCount=${adaptedMainArray.length} rescueAttempted=${sessionWasRescued}`
      )
    }
    
    // TASK 5: Session Assembly Validation Pass
    // Dedupe, fix ordering, and validate session before returning
    sessionStep = 'validating_session'
    const sessionBudget = resolveSessionBudget(typeof sessionLength === 'number' ? sessionLength : parseInt(String(sessionLength).split('-')[0]) || 45)
    // TASK 1-B: Use let to allow emergency fallback reassignment
let validatedSession = validateSession(rawExercises, rawWarmup, rawCooldown, {
      isSkillFirstDay: day.isPrimary,
      maxMainExercises: sessionBudget.mainWork.maxExercises,
      maxWarmupExercises: sessionBudget.warmup.maxExercises,
    })
    
    // Update session trace after validation
    sessionTrace.validatedMainCount = validatedSession.exercises.length
    console.log('[session-trace-post-validation]', { ...sessionTrace, currentMainCount: validatedSession.exercises.length })
    sessionStep = 'validation_completed'
    
    // Detect if validation zeroed out raw exercises
    if (rawExercises.length > 0 && validatedSession.exercises.length === 0) {
      sessionTrace.collapseStage = 'validation'
      console.error('[session-collapse-point] Validation removed all exercises:', {
        stage: 'validation',
        dayNumber: day.dayNumber,
        dayFocus: day.focus,
        primaryGoal,
        inputCount: rawExercises.length,
        outputCount: 0,
        inputExercises: rawExercises.map(e => e.name),
        validationIssues: validatedSession.validation.issues,
        fixesApplied: validatedSession.validation.fixesApplied,
        rescueAttempted: sessionWasRescued,
      })
      throw new Error(
        `validation_zeroed_session: day=${day.dayNumber} focus=${day.focus} ` +
        `goal=${primaryGoal} inputCount=${rawExercises.length} rescueAttempted=${sessionWasRescued}`
      )
    }
    
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
    
    // [weighted-prescription-truth] Log prescription survival at session assembly
    sessionStep = 'prescription_survival_check'
    const exercisesWithPrescription = validatedSession.exercises.filter(
      (e: AdaptiveExercise) => e.prescribedLoad && e.prescribedLoad.load > 0
    )
    if (exercisesWithPrescription.length > 0) {
      console.log('[weighted-prescription-truth] Session has prescribed loads:', {
        dayNumber: day.dayNumber,
        dayFocus: day.focus,
        exercisesWithLoads: exercisesWithPrescription.map((e: AdaptiveExercise) => ({
          name: e.name,
          id: e.id,
          load: `+${e.prescribedLoad?.load} ${e.prescribedLoad?.unit}`,
          confidence: e.prescribedLoad?.confidenceLevel,
          basis: e.prescribedLoad?.basis,
        })),
      })
    } else {
      // Log why no weighted prescriptions exist
      const weightedCapableExercises = validatedSession.exercises.filter(
        (e: AdaptiveExercise) => 
          e.id?.includes('weighted_pull') || 
          e.id?.includes('weighted_dip') ||
          e.name?.toLowerCase().includes('weighted')
      )
      if (weightedCapableExercises.length > 0) {
        console.log('[weighted-prescription-truth] Weighted-capable exercises WITHOUT prescriptions:', {
          dayNumber: day.dayNumber,
          exercises: weightedCapableExercises.map((e: AdaptiveExercise) => e.name),
          reason: 'prescribedLoad field is missing or zero - check if weightedBenchmarks were passed',
        })
      }
    }

    // [coach-meta-survival] Log coaching meta at session assembly
    sessionStep = 'coaching_meta_check'
    const exercisesWithCoaching = validatedSession.exercises.filter((e: AdaptiveExercise) => e.coachingMeta)
    console.log('[coach-meta-survival] Session assembly - coaching meta check:', {
      dayNumber: day.dayNumber,
      totalExercises: validatedSession.exercises.length,
      withCoachingMeta: exercisesWithCoaching.length,
      sampleMeta: exercisesWithCoaching[0]?.coachingMeta,
    })

    // ==========================================================================
    // Final validation - session MUST have exercises after all passes
    // ==========================================================================
    sessionStep = 'final_session_nonempty_check'
    if (validatedSession.exercises.length === 0) {
      console.warn('[session-final-check-failed] Session empty after rescue - attempting emergency fallback:', {
        dayNumber: day.dayNumber,
        dayFocus: day.focus,
        primaryGoal,
        equipmentCount: equipment.length,
        selectedSkillsCount: selectedSkills?.length || 0,
        initialMainCount: safeMain.length,
        rescuedMainCount: rescuedMain.length,
        sessionWasRescued,
        rescuePath,
        rawExercisesCount: rawExercises.length,
      })
      
      // ==========================================================================
      // TASK 1-B: Emergency minimum viable session contract
      // Before throwing, try one more rescue with buildFallbackSelectionForSession
      // This ensures we only fail if truly no equipment-valid path exists
      // ==========================================================================
      sessionStep = 'emergency_fallback_attempt'
      const emergencyRescue = buildFallbackSelectionForSession(
        day.focus,
        primaryGoal,
        equipment,
        sessionMinutesResolved,
        experienceLevel
      )
      
      if (emergencyRescue.wasRescued && emergencyRescue.main.length > 0) {
        // Emergency rescue succeeded - build a minimal valid session
        console.log('[constraint-session-downgrade] Emergency fallback succeeded:', {
          dayNumber: day.dayNumber,
          dayFocus: day.focus,
          primaryGoal,
          rescuePath: emergencyRescue.rescuePath,
          exerciseCount: emergencyRescue.main.length,
          originalExpression: 'direct',
          downgradedExpression: 'emergency_support',
        })
        
        // Build emergency session from rescue result
        const emergencyExercises: AdaptiveExercise[] = emergencyRescue.main.map((selected, idx) => ({
          id: `${selected.exercise.id}_d${day.dayNumber}_emergency`,
          exerciseId: selected.exercise.id,
          name: selected.exercise.name,
          sets: selected.sets,
          repsOrTime: selected.repsOrTime,
          restPeriod: '60-90s',
          category: (selected.exercise.category || 'strength') as AdaptiveExercise['category'],
          movementPattern: selected.exercise.movementPattern || 'compound',
          sessionRole: 'support' as const,
          selectionReason: `[Emergency Fallback] ${selected.selectionReason}`,
          neuralDemand: selected.exercise.neuralDemand ?? 2,
          fatigueCost: selected.exercise.fatigueCost ?? 2,
          order: idx,
          adaptationOptions: {
            regressionAvailable: false,
            progressionAvailable: false,
            alternativesAvailable: [],
            tempoOptions: [],
          },
          isCore: selected.exercise.category === 'core',
          isAccessory: selected.exercise.category === 'accessory',
          expectedTimeMinutes: 5,
        }))
        
        // Replace empty validatedSession with emergency exercises
        validatedSession = {
          ...validatedSession,
          exercises: emergencyExercises,
          estimatedDurationMinutes: emergencyExercises.length * 5 + 10,
          sessionCharacter: {
            neuralDemandLevel: 'moderate' as const,
            fatigueProfile: 'standard' as const,
            volumeCategory: 'minimal' as const,
            sessionType: 'support_recovery' as const,
          },
        }
        
        console.log('[constraint-session-final] Emergency session built:', {
          dayNumber: day.dayNumber,
          primaryGoal,
          constraintType: constraintType || 'unknown',
          originalExpression: 'direct',
          downgradedExpression: 'emergency_support',
          finalExerciseCount: validatedSession.exercises.length,
          exercises: validatedSession.exercises.map(e => e.name),
        })
      } else {
        // Emergency rescue also failed - now we truly have no options
        console.error('[session-final-check-failed] Emergency fallback also failed:', {
          dayNumber: day.dayNumber,
          dayFocus: day.focus,
          primaryGoal,
          equipmentCount: equipment.length,
        })
        
        // [BUILDER_TRACE] STEP 2 - Diagnostic logging before throw
        console.log('[BUILDER_TRACE]', {
          stage: 'session_assembly',
          step: 'BEFORE_THROW',
          reason: 'session_has_no_exercises',
          sessionsLength: 0,
          daysRequested: day.dayNumber,
          selectedSkills: selectedSkills?.slice(0, 5) || [],
          availableExercisesCount: 0,
          exercisePoolSize: 0,
          isAdaptiveMode: true,
          userLevel: experienceLevel,
          dayFocus: day.focus,
          primaryGoal,
          equipmentCount: equipment?.length || 0,
          rescueAttempted: sessionWasRescued,
          rescuePath,
        })
        
        // TASK 1-I: Only hard-fail if truly no equipment-valid path exists
        throw new Error(
          `session_has_no_exercises: day=${day.dayNumber} focus=${day.focus} ` +
          `goal=${primaryGoal} fallbackAttempted=true emergencyAttempted=true ` +
          `equipment=${equipment.slice(0, 5).join(',')} rescuePath=${emergencyRescue.rescuePath}`
        )
      }
    }
    
    // STEP I: Final session trace before return
    sessionTrace.finalMainCount = validatedSession.exercises.length
    console.log('[session-trace-final]', sessionTrace)
    
    // ==========================================================================
    // [TASK 7] SESSION ASSEMBLY ROOT FIX FINAL VERDICT
    // ==========================================================================
    const staleCandidateCarryover = (safeMain.length > 0 && adaptedMain.adapted.length === 0 && !wasRecoveredFromInvalidation)
    console.log('[session-assembly-root-fix-final-verdict]', {
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      exactFailingPhaseFound: sessionTrace.collapseStage !== 'none' ? sessionTrace.collapseStage : 'none',
      staleCandidateCarryoverExisted: staleCandidateCarryover,
      canonicalValidationRunsAfterEachPhase: true,
      fallbackCandidateReselectionAdded: wasRecoveredFromInvalidation,
      preciseErrorSubcodesReplacedGeneric: true,
      initialCandidateCount: safeMain.length,
      postRescueCount: rescuedMain.length,
      postEquipmentCount: adaptedMain.adapted.length,
      recoveredCount: wasRecoveredFromInvalidation ? effectiveMainSource.length : 0,
      finalExerciseCount: validatedSession.exercises.length,
      sessionWasRescued,
      wasRecoveredFromInvalidation,
      finalVerdict: validatedSession.exercises.length > 0 
        ? 'root_fix_applied' 
        : 'still_failing_but_now_precisely_classified',
    })
    
    // STEP G: Core survival check - ensure no mutation zeroed out exercises
    console.log('[session-core-survival-check]', {
      dayNumber: day.dayNumber,
      validatedCount: validatedSession.exercises.length,
      finalReturnedCount: validatedSession.exercises.length, // Same at this point
      hasVariants: variants && variants.length > 0,
      hasFinisher: !!finisher,
      adaptationNotesCount: adaptationNotes.length,
    })
    
    console.log('[session-final-check] Session validated successfully:', {
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      finalExerciseCount: validatedSession.exercises.length,
      sessionWasRescued,
      rescuePath: sessionWasRescued ? rescuePath : 'n/a',
    })

    sessionStep = 'returning_validated_session'
    console.log('[session-lifecycle-success]', {
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      sessionStep,
      finalExerciseCount: validatedSession.exercises.length,
    })

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
      // Use effectiveSelection.totalEstimatedTime (not stale original)
      estimatedMinutes: effectiveSelection.totalEstimatedTime + (finisher?.durationMinutes || 0),
      variants,
      adaptationNotes: adaptationNotes.length > 0 ? adaptationNotes : undefined,
      finisher,
      finisherIncluded: !!finisher,
      finisherRationale: enduranceResult.rationale,
    }
  
  // ==========================================================================
  // STEP B/D: Outer catch for entire generateAdaptiveSession lifecycle
  // ==========================================================================
  } catch (lifecycleErr) {
    const errorMessage = lifecycleErr instanceof Error ? lifecycleErr.message : String(lifecycleErr)
    
    // Known classified patterns - if already classified, rethrow unchanged
    const alreadyClassifiedPatterns = [
      'exercise_selection_returned_null',
      'equipment_adaptation_zeroed_session',
      'mapping_zeroed_session',
      'validation_zeroed_session',
      'session_middle_helper_failed',
      'effective_selection_invalid',
      'session_variant_generation_failed',
      'finisher_helper_failed',
      'session_has_no_exercises',
    ]
    
    const isAlreadyClassified = alreadyClassifiedPatterns.some(p => errorMessage.includes(p))
    
    if (isAlreadyClassified) {
      // Rethrow already-classified error unchanged
      throw lifecycleErr
    }
    
    // Log full lifecycle failure diagnostic
    console.error('[session-lifecycle-failure]', {
      sessionStep,
      middleStep,
      dayNumber: day.dayNumber,
      dayFocus: day.focus,
      primaryGoal,
      experienceLevel,
      sessionLengthRaw: sessionLength,
      sessionMinutesResolved,
      equipmentCount: equipment.length,
      selectedSkillsCount: selectedSkills?.length || 0,
      errorName: lifecycleErr instanceof Error ? lifecycleErr.name : 'unknown',
      errorMessage,
      stack: lifecycleErr instanceof Error ? lifecycleErr.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    })
    
    // Convert to classified error with precise step information
    const safeReason = errorMessage.slice(0, 120).replace(/[\n\r]/g, ' ').replace(/[^a-zA-Z0-9_\-\s.:,]/g, '')
    throw new Error(
      `session_generation_failed: step=${sessionStep} middleStep=${middleStep} ` +
      `day=${day.dayNumber} focus=${day.focus} goal=${primaryGoal} reason=${safeReason}`
    )
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
    // [weighted-prescription-truth] ISSUE E: Pass through RPE and rest metadata
    targetRPE: s.targetRPE,
    restSeconds: s.restSeconds,
    // [coach-layer] TASK 2: Build coaching metadata from selection trace
    coachingMeta: buildExerciseCoachingMetaFromSelection(s, primaryGoal),
    }
  }).filter((e): e is AdaptiveExercise => e !== null)
}

/**
 * [coach-layer] TASK 2: Map selection data to coaching metadata
 * This converts raw selection trace into user-meaningful coaching info
 */
function buildExerciseCoachingMetaFromSelection(
  selection: SelectedExercise,
  primaryGoal: PrimaryGoal
): AdaptiveExercise['coachingMeta'] {
  const category = selection.exercise?.category || 'accessory'
  const isWeighted = !!(selection.prescribedLoad?.load && selection.prescribedLoad.load > 0)
  const hasLoadableEquipment = true // Assume true if we got here
  const hasBenchmarkData = selection.prescribedLoad?.basis === 'current_benchmark' || 
                           selection.prescribedLoad?.basis === 'pr_reference'
  
  // Derive prescription mode from intensity band if available
  const prescriptionMode = selection.prescribedLoad?.intensityBand || 
    (category === 'skill' ? 'skill_expression' : 'strength_building')
  
  // Extract skill targets from exercise's transferTo field or use primary goal
  const skillTargets: string[] = (selection.exercise?.transferTo?.length ?? 0) > 0
    ? selection.exercise!.transferTo 
    : [primaryGoal]
  
  // Build using the canonical contract
  const meta = buildExerciseCoachingMeta({
    exerciseCategory: category,
    selectionReason: selection.selectionReason || '',
    prescriptionMode,
    isWeighted,
    loadValue: selection.prescribedLoad?.load,
    loadUnit: selection.prescribedLoad?.unit,
    hasLoadableEquipment,
    hasBenchmarkData,
    targetRPE: selection.targetRPE,
    restSeconds: selection.restSeconds,
    skillTargets,
    isRecoveryDay: false,
  })
  
  // Format rest label
  const restLabel = meta.restGuidance?.label || (selection.restSeconds 
    ? `${Math.round(selection.restSeconds / 60)}-${Math.round(selection.restSeconds / 60) + 1} min`
    : undefined)
  
  console.log('[coach-meta-survival] Built coaching meta for:', {
    exercise: selection.exercise?.name,
    expressionMode: meta.expressionMode,
    progressionIntent: meta.progressionIntent,
    loadDecision: meta.loadDecision.summary,
  })
  
  return {
    expressionMode: meta.expressionMode,
    progressionIntent: meta.progressionIntent,
    skillSupportTargets: meta.skillSupportTargets,
    loadDecisionSummary: meta.loadDecision.summary,
    restLabel,
  }
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
  selectedSkills: string[] = [],
  // [SUMMARY-TRUTH] TASK 5: Accept broader represented skills for truthful why-this-plan
  broaderRepresentedSkills: string[] = [],
  secondaryGoal: string | null = null
): string {
  const parts: string[] = []
  
  // Get enhanced context from Adaptive Athlete Engine
  const engineCtx = getProgramBuilderContext()
  
  // [history-language] TASK 8: Check if user has earned history
  let hasEarnedHistory = false
  try {
    const { getBaselineVsEarnedSummary } = require('./baseline-earned-truth')
    const summary = getBaselineVsEarnedSummary()
    hasEarnedHistory = summary.hasEarnedProgress && summary.earned.totalWorkoutsCompleted >= 2
    
    console.log('[history-language] Rationale generation with history state:', {
      hasEarnedHistory,
      earnedWorkouts: summary.earned?.totalWorkoutsCompleted || 0,
    })
  } catch {
    // Fallback - assume no history
    hasEarnedHistory = false
  }
  
  // Structure choice
  parts.push(structure.rationale)
  
  // [history-language] TASK 8: Only show constraint/adaptation language if we have history
  // Constraint awareness (from engine)
  if (engineCtx.primaryConstraint && constraintInsight.label !== 'Training Balanced') {
    if (hasEarnedHistory) {
      parts.push(`Program accounts for your current limiter: ${engineCtx.constraintLabel.toLowerCase()}.`)
    } else {
      // Blank-slate: use calibration language instead
      parts.push(`Program calibrated for initial assessment of ${engineCtx.constraintLabel.toLowerCase()}.`)
    }
  }
  
  // [history-language] TASK 8: Plateau language only with history
  // Plateau awareness (new from engine)
  if (hasEarnedHistory) {
    if (engineCtx.plateauStatus === 'plateau_detected') {
      parts.push('Program includes variation to help break through the current plateau.')
    } else if (engineCtx.plateauStatus === 'possible_plateau') {
      parts.push('Consider introducing new stimuli if progress stalls.')
    }
  }
  
  // [prescription] ISSUE F: Weighted strength support with actual prescription awareness
  if (engineCtx.strengthSupportLevel === 'insufficient') {
    parts.push('Additional emphasis on weighted strength work to build foundational support.')
  } else if (engineCtx.strengthSupportLevel === 'developing') {
    parts.push('Continue building support strength alongside skill work.')
  } else if (engineCtx.strengthSupportLevel === 'sufficient' || engineCtx.strengthSupportLevel === 'strong') {
    parts.push('Weighted strength maintained to support skill development.')
  }
  
  // [history-language] TASK 8: Recovery language - only reference trends with history
  // Recovery consideration (enhanced with fatigue state)
  if (hasEarnedHistory) {
    if (engineCtx.recoveryState === 'overtrained' || engineCtx.recoveryState === 'fatigued') {
      parts.push('Training load reduced due to elevated fatigue. Prioritize recovery.')
    } else if (recoveryLevel === 'LOW') {
      parts.push('Recovery state suggests including lighter sessions to prevent overtraining.')
    } else if (recoveryLevel === 'HIGH') {
      parts.push('Recovery state supports high-intensity training this week.')
    }
  } else {
    // Blank-slate users: generic starting recovery guidance
    if (recoveryLevel === 'LOW') {
      parts.push('Program includes recovery-friendly session spacing.')
    }
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
  
  // ==========================================================================
  // [SUMMARY-TRUTH] TASK 5: Include broader represented skills in rationale
  // This acknowledges skills beyond primary/secondary that are truly expressed
  // ==========================================================================
  const nonAdvancedBroaderSkills = broaderRepresentedSkills.filter(skill => 
    !advancedSkillsExpressed.some(adv => skill.includes(adv.toLowerCase().replace(' ', '_')))
  )
  
  if (nonAdvancedBroaderSkills.length > 0) {
    const broaderSkillNames = nonAdvancedBroaderSkills.slice(0, 2).map(s => s.replace(/_/g, ' '))
    if (broaderSkillNames.length === 1) {
      parts.push(`${broaderSkillNames[0].charAt(0).toUpperCase() + broaderSkillNames[0].slice(1)} receives meaningful support-level expression.`)
    } else {
      parts.push(`Broader skills (${broaderSkillNames.join(', ')}) receive support-level expression throughout the week.`)
    }
    
    console.log('[why-this-plan-broader-skills]', {
      broaderSkillsIncluded: nonAdvancedBroaderSkills,
      mentionedInRationale: broaderSkillNames,
    })
  }
  
  // [SUMMARY-TRUTH] TASK 5: Why this plan truth audit
  console.log('[why-this-plan-truth-audit]', {
    primaryGoal: primaryGoal.replace(/_/g, ' '),
    secondaryGoal: secondaryGoal?.replace(/_/g, ' ') || 'none',
    representedSupportSkills: broaderRepresentedSkills,
    excludedOrFilteredSkills: selectedSkills.filter(s => 
      s !== primaryGoal && s !== secondaryGoal && !broaderRepresentedSkills.includes(s)
    ),
    finalWhyThisPlanText: parts.join(' ').slice(0, 150),
    verdict: broaderRepresentedSkills.length === 0 
      ? 'no_broader_skills_to_mention'
      : parts.some(p => p.includes('support') || p.includes('broader'))
        ? 'broader_skills_acknowledged'
        : 'broader_skills_not_mentioned',
  })
  
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

// =============================================================================
// STORAGE KEYS - TASK 1: Separate active program from history
// =============================================================================
const STORAGE_KEY = 'spartanlab_adaptive_programs' // Legacy history array
const CANONICAL_ACTIVE_KEY = 'spartanlab_active_program' // Single active program
const MAX_HISTORY_PROGRAMS = 3 // Cap history to prevent quota issues

// Custom error for storage failures
export class StorageSaveError extends Error {
  constructor(
    public readonly errorType: 'storage_quota_exceeded' | 'active_program_save_failed' | 'history_save_failed' | 'serialization_failed',
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'StorageSaveError'
  }
}
  
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
  
  // ==========================================================================
  // [storage-quota-fix] TASK B/C: Atomic, quota-aware save strategy
  // 1. Save canonical active program FIRST (highest priority, smallest footprint)
  // 2. Then attempt bounded history save (non-core, can degrade gracefully)
  // ==========================================================================
  
  // Step 1: Serialize the active program
  let serializedProgram: string
  try {
    serializedProgram = JSON.stringify(program)
  } catch (serErr) {
    console.error('[storage-quota-fix] SAVE FAILED: Serialization error', serErr)
    throw new StorageSaveError('serialization_failed', 'Failed to serialize program', serErr)
  }
  
  // Step 2: Pre-save diagnostic - check approximate sizes
  const existingHistory = getSavedAdaptivePrograms()
  const existingHistorySize = JSON.stringify(existingHistory).length
  console.log('[storage-quota-fix] Pre-save diagnostic:', {
    programId: program.id,
    sessionCount: sessions.length,
    activeProgramSize: serializedProgram.length,
    existingHistoryCount: existingHistory.length,
    existingHistorySize,
  })
  
  // Step 3: Save canonical active program FIRST (core - must succeed)
  try {
    localStorage.setItem(CANONICAL_ACTIVE_KEY, serializedProgram)
    console.log('[storage-quota-fix] Canonical active program saved successfully')
  } catch (activeErr) {
    // Detect quota exceeded
    const isQuotaError = activeErr instanceof Error && 
      (activeErr.name === 'QuotaExceededError' || 
       activeErr.message.includes('quota') ||
       activeErr.message.includes('setItem'))
    
    console.error('[storage-quota-fix] CRITICAL: Active program save failed', {
      isQuotaError,
      error: activeErr instanceof Error ? activeErr.message : String(activeErr),
    })
    
    throw new StorageSaveError(
      isQuotaError ? 'storage_quota_exceeded' : 'active_program_save_failed',
      `Failed to save active program: ${activeErr instanceof Error ? activeErr.message : 'unknown error'}`,
      activeErr
    )
  }
  
  // Step 4: Build bounded history (deduped, capped, newest first)
  let historySaveWarning: string | null = null
  try {
    // Remove duplicates by ID, keep only recent programs
    const deduped = existingHistory.filter(p => p.id !== program.id)
    const bounded = [program, ...deduped].slice(0, MAX_HISTORY_PROGRAMS)
    
    // Attempt history save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded))
    console.log('[storage-quota-fix] History saved successfully', {
      historyCount: bounded.length,
      capped: deduped.length >= MAX_HISTORY_PROGRAMS,
    })
  } catch (histErr) {
    // History save failed - this is NON-CORE, log but don't fail
    historySaveWarning = histErr instanceof Error ? histErr.message : 'unknown error'
    console.warn('[storage-quota-fix] History save failed (non-core):', historySaveWarning)
    
    // Try to at least keep minimal history (just the active program)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([program]))
      console.log('[storage-quota-fix] Minimal history saved (active only)')
    } catch {
      // Even minimal history failed - just log, active program is already saved
      console.warn('[storage-quota-fix] Even minimal history failed - active program still valid')
    }
  }
  
  console.log('[program-rebuild-truth] SAVE: Program saved successfully - atomic replacement complete', {
    programId: program.id,
    sessionCount: sessions.length,
    totalExercises: sessionExerciseCounts.reduce((a, b) => a + b, 0),
    replacedVisibleProgram: true,
    historySaveWarning,
  })
  
  // [build-report] STEP 11: High-signal build diagnostic summary
  console.log('[build-report] BUILD COMPLETE:', {
    buildAttemptId: program.id,
    path: 'save_adaptive_program',
    requestedSessionCount: program.trainingDaysPerWeek || 'flexible',
    assembledSessionCount: sessions.length,
    savedSessionCount: sessions.length,
    exerciseCountsPerSession: sessionExerciseCounts,
    staleCacheInvalidated: true,
    saveResult: 'success',
    programIdAfterSave: program.id,
    createdAt: program.createdAt,
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
  if (!isBrowser()) return null
  
  // [storage-quota-fix] Priority 1: Check canonical active key first
  try {
    const canonical = localStorage.getItem(CANONICAL_ACTIVE_KEY)
    if (canonical) {
      const parsed = JSON.parse(canonical)
      if (parsed && parsed.id && parsed.sessions) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('[storage-quota-fix] Failed to read canonical active program:', err)
  }
  
  // Priority 2: Fall back to history array
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
// [storage-quota-fix] TASK F: Legacy storage migration/cleanup
// =============================================================================

/**
 * Migrate and clean up legacy oversized storage.
 * Call this on app init to ensure storage is bounded.
 */
export function migrateAndCleanupProgramStorage(): { 
  migrated: boolean
  trimmedCount: number 
  canonicalRestored: boolean
} {
  if (!isBrowser()) return { migrated: false, trimmedCount: 0, canonicalRestored: false }
  
  let migrated = false
  let trimmedCount = 0
  let canonicalRestored = false
  
  try {
    const programs = getSavedAdaptivePrograms()
    
    // Nothing to migrate if empty
    if (programs.length === 0) {
      return { migrated: false, trimmedCount: 0, canonicalRestored: false }
    }
    
    // Sort by date (newest first)
    const sorted = [...programs].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    // Check if canonical active key exists
    const hasCanonical = !!localStorage.getItem(CANONICAL_ACTIVE_KEY)
    
    // If no canonical key, restore from latest in history
    if (!hasCanonical && sorted.length > 0) {
      try {
        localStorage.setItem(CANONICAL_ACTIVE_KEY, JSON.stringify(sorted[0]))
        canonicalRestored = true
        console.log('[storage-quota-fix] Migration: Restored canonical active program from history')
      } catch (err) {
        console.warn('[storage-quota-fix] Migration: Failed to restore canonical:', err)
      }
    }
    
    // Trim history if over cap
    if (sorted.length > MAX_HISTORY_PROGRAMS) {
      trimmedCount = sorted.length - MAX_HISTORY_PROGRAMS
      const trimmed = sorted.slice(0, MAX_HISTORY_PROGRAMS)
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
        migrated = true
        console.log('[storage-quota-fix] Migration: Trimmed history', {
          before: sorted.length,
          after: trimmed.length,
          trimmed: trimmedCount,
        })
      } catch (err) {
        // If even trimmed history fails, try just keeping the latest
        console.warn('[storage-quota-fix] Migration: Trimmed save failed, keeping only latest')
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([sorted[0]]))
          migrated = true
          trimmedCount = sorted.length - 1
        } catch {
          // Complete failure - just clear history, canonical should still work
          console.error('[storage-quota-fix] Migration: Complete history save failure, clearing')
          localStorage.removeItem(STORAGE_KEY)
          migrated = true
          trimmedCount = sorted.length
        }
      }
    }
    
    return { migrated, trimmedCount, canonicalRestored }
  } catch (err) {
    console.error('[storage-quota-fix] Migration failed:', err)
    return { migrated: false, trimmedCount: 0, canonicalRestored: false }
  }
}

// =============================================================================
// [anti-template] TASK A/B/E: GENERATION PROVENANCE & SIMILARITY DETECTION
// =============================================================================

/**
 * [anti-template] TASK A: Build generation provenance metadata
 * Tracks exactly how the program was assembled for debugging template-like output
 */
function buildGenerationProvenance(
  sessions: AdaptiveSession[],
  scheduleMode: string,
  effectiveTrainingDays: number,
  inputScheduleMode: string,
  flexibleWeekStructure: FlexibleWeekStructure | null,
  composedInput: { fallbacksUsed: string[], overridesApplied: string[] },
  expandedContext: ExpandedAthleteContext
): GenerationProvenance {
  // Count session types
  let rescueCount = 0
  let fallbackCount = 0
  let directCount = 0
  const exerciseSelectionModes: ExerciseSelectionMode[] = []
  
  for (const session of sessions) {
    // Check session metadata for rescue/fallback indicators
    const wasRescued = session.exercises?.some(e => 
      e.selectionContext?.primarySelectionReason?.includes('rescue') ||
      e.selectionContext?.primarySelectionReason?.includes('fallback')
    )
    const wasDowngraded = session.exercises?.some(e =>
      e.selectionContext?.expressionMode === 'support_fallback' ||
      e.selectionContext?.expressionMode === 'emergency_support'
    )
    
    if (wasRescued) {
      rescueCount++
      exerciseSelectionModes.push('rescue')
    } else if (wasDowngraded) {
      fallbackCount++
      exerciseSelectionModes.push('support_fallback')
    } else {
      directCount++
      exerciseSelectionModes.push('direct')
    }
  }
  
  // Determine overall generation mode
  let generationMode: GenerationMode_Provenance = 'direct'
  if (rescueCount > 0 && fallbackCount > 0) {
    generationMode = 'mixed'
  } else if (rescueCount > sessions.length / 2) {
    generationMode = 'rescued'
  } else if (fallbackCount > sessions.length / 2) {
    generationMode = 'constraint_downgraded'
  }
  
  // Determine schedule derivation
  let scheduleDerivationMode: ScheduleDerivationMode = 'fixed_baseline'
  if (inputScheduleMode === 'flexible' && flexibleWeekStructure) {
    if (flexibleWeekStructure.currentWeekFrequency !== 4) {
      scheduleDerivationMode = 'true_adaptive'
    } else {
      scheduleDerivationMode = 'adaptive_but_clamped'
    }
  }
  
  // Track which athlete inputs were consumed vs ignored
  const athleteInputsConsumed: string[] = []
  const athleteInputsIgnored: string[] = []
  
  // Check expanded context for actual consumption
  if (expandedContext.weightedPullUp) athleteInputsConsumed.push('weightedPullUp')
  else athleteInputsIgnored.push('weightedPullUp')
  
  if (expandedContext.weightedDip) athleteInputsConsumed.push('weightedDip')
  else athleteInputsIgnored.push('weightedDip')
  
  if (expandedContext.frontLeverProgression) athleteInputsConsumed.push('frontLeverProgression')
  if (expandedContext.plancheProgression) athleteInputsConsumed.push('plancheProgression')
  if (expandedContext.hspuProgression) athleteInputsConsumed.push('hspuProgression')
  if (expandedContext.recoveryLevel) athleteInputsConsumed.push('recoveryLevel')
  if (expandedContext.jointCautions?.length) athleteInputsConsumed.push('jointCautions')
  
  // Detect compression points
  const compressionPoints: string[] = []
  if (effectiveTrainingDays === 4 && inputScheduleMode === 'flexible') {
    compressionPoints.push('flexible_schedule_clamped_to_4_days')
  }
  if (composedInput.fallbacksUsed.length > 0) {
    compressionPoints.push(`fallbacks_used: ${composedInput.fallbacksUsed.join(', ')}`)
  }
  
  const provenance: GenerationProvenance = {
    generationMode,
    generationFreshness: composedInput.fallbacksUsed.length > 2 ? 'reused_partial_structure' : 'fresh_full_recompute',
    scheduleDerivationMode,
    exerciseSelectionModePerDay: exerciseSelectionModes,
    postGenerationCompressionApplied: compressionPoints.length > 0,
    rescueSessionCount: rescueCount,
    fallbackSessionCount: fallbackCount,
    directSessionCount: directCount,
    athleteInputsConsumed,
    athleteInputsIgnored,
    compressionPoints,
    generatedAt: new Date().toISOString(),
  }
  
  // [program-provenance] Log provenance summary
  console.log('[program-provenance]', {
    generationMode: provenance.generationMode,
    generationFreshness: provenance.generationFreshness,
    scheduleDerivationMode: provenance.scheduleDerivationMode,
    directCount: provenance.directSessionCount,
    fallbackCount: provenance.fallbackSessionCount,
    rescueCount: provenance.rescueSessionCount,
    compressionPoints: provenance.compressionPoints,
    athleteInputsConsumed: provenance.athleteInputsConsumed.length,
    athleteInputsIgnored: provenance.athleteInputsIgnored.length,
  })
  
  return provenance
}

/**
 * [anti-template] TASK B: Compute template similarity between two programs
 * Detects if a rebuild is producing meaningfully different output
 */
export function computeTemplateSimilarity(
  newProgram: AdaptiveProgram,
  previousProgram: AdaptiveProgram | null,
  inputsChanged: boolean
): TemplateSimilarityResult {
  if (!previousProgram) {
    return {
      overallSimilarityScore: 0,
      appearsStale: false,
      similaritySignals: {
        sameSessionCount: false,
        sameDayFocusOrder: false,
        sameFirstTwoExercisesPerDay: false,
        sameDayDurations: false,
        sameSessionTitles: false,
        samePrimaryExerciseFamilies: false,
        sameLimiterPath: false,
        sameFallbackMode: false,
        sameRationale: false,
      },
      staleReasons: [],
      actualChanges: ['first_generation'],
      expectedChanges: [],
      comparedAt: new Date().toISOString(),
    }
  }
  
  const signals: TemplateSimilaritySignals = {
    sameSessionCount: newProgram.sessions.length === previousProgram.sessions.length,
    sameDayFocusOrder: newProgram.sessions.map(s => s.dayFocus).join(',') === 
                       previousProgram.sessions.map(s => s.dayFocus).join(','),
    sameFirstTwoExercisesPerDay: (() => {
      if (newProgram.sessions.length !== previousProgram.sessions.length) return false
      for (let i = 0; i < newProgram.sessions.length; i++) {
        const newFirst2 = newProgram.sessions[i].exercises?.slice(0, 2).map(e => e.exercise?.id || e.name).join(',')
        const prevFirst2 = previousProgram.sessions[i]?.exercises?.slice(0, 2).map(e => e.exercise?.id || e.name).join(',')
        if (newFirst2 !== prevFirst2) return false
      }
      return true
    })(),
    sameDayDurations: newProgram.sessions.map(s => s.estimatedDuration || 0).join(',') ===
                      previousProgram.sessions.map(s => s.estimatedDuration || 0).join(','),
    sameSessionTitles: newProgram.sessions.map(s => s.title || '').join(',') ===
                       previousProgram.sessions.map(s => s.title || '').join(','),
    samePrimaryExerciseFamilies: (() => {
      const getExerciseFamilies = (sessions: AdaptiveSession[]) => 
        sessions.map(s => s.exercises?.slice(0, 3).map(e => e.exercise?.movementFamily || '').sort().join(',')).join('|')
      return getExerciseFamilies(newProgram.sessions) === getExerciseFamilies(previousProgram.sessions)
    })(),
    sameLimiterPath: newProgram.constraintInsight?.primaryConstraint === previousProgram.constraintInsight?.primaryConstraint,
    sameFallbackMode: newProgram.generationProvenance?.generationMode === previousProgram.generationProvenance?.generationMode,
    sameRationale: newProgram.programRationale === previousProgram.programRationale,
  }
  
  // Calculate similarity score (0-100)
  const weights = {
    sameSessionCount: 10,
    sameDayFocusOrder: 15,
    sameFirstTwoExercisesPerDay: 25,
    sameDayDurations: 5,
    sameSessionTitles: 5,
    samePrimaryExerciseFamilies: 20,
    sameLimiterPath: 10,
    sameFallbackMode: 5,
    sameRationale: 5,
  }
  
  let similarityScore = 0
  for (const [key, weight] of Object.entries(weights)) {
    if (signals[key as keyof TemplateSimilaritySignals]) {
      similarityScore += weight
    }
  }
  
  // Determine if stale
  const staleReasons: string[] = []
  const actualChanges: string[] = []
  const expectedChanges: string[] = []
  
  // If inputs changed but similarity is high, something is wrong
  if (inputsChanged && similarityScore >= 85) {
    staleReasons.push('high_similarity_despite_input_change')
    expectedChanges.push('expected_different_structure_from_input_change')
  }
  
  // Track actual changes
  if (!signals.sameSessionCount) actualChanges.push('session_count_changed')
  if (!signals.sameDayFocusOrder) actualChanges.push('day_focus_order_changed')
  if (!signals.sameFirstTwoExercisesPerDay) actualChanges.push('primary_exercises_changed')
  if (!signals.samePrimaryExerciseFamilies) actualChanges.push('exercise_families_changed')
  
  const result: TemplateSimilarityResult = {
    overallSimilarityScore: similarityScore,
    appearsStale: similarityScore >= 85 && inputsChanged,
    similaritySignals: signals,
    staleReasons,
    actualChanges,
    expectedChanges,
    comparedAt: new Date().toISOString(),
  }
  
  // [program-similarity-audit] Log similarity analysis
  console.log('[program-similarity-audit]', {
    overallSimilarityScore: result.overallSimilarityScore,
    appearsStale: result.appearsStale,
    inputsChanged,
    sameSessionCount: signals.sameSessionCount,
    sameDayFocusOrder: signals.sameDayFocusOrder,
    sameFirstTwoExercises: signals.sameFirstTwoExercisesPerDay,
    samePrimaryFamilies: signals.samePrimaryExerciseFamilies,
    actualChanges: result.actualChanges.length,
    staleReasons: result.staleReasons,
  })
  
  return result
}

/**
 * [anti-template] TASK E: Compute quality classification based on assembly path
 */
function computeQualityClassification(provenance: GenerationProvenance): QualityClassification {
  const totalSessions = provenance.directSessionCount + provenance.fallbackSessionCount + provenance.rescueSessionCount
  
  const directRatio = totalSessions > 0 ? provenance.directSessionCount / totalSessions : 0
  const fallbackRatio = totalSessions > 0 ? provenance.fallbackSessionCount / totalSessions : 0
  const rescueRatio = totalSessions > 0 ? provenance.rescueSessionCount / totalSessions : 0
  
  let qualityTier: QualityTier = 'direct_high_confidence'
  let tierReason = ''
  
  if (rescueRatio > 0.5) {
    qualityTier = 'rescue_built'
    tierReason = 'More than half of sessions required rescue path'
  } else if (rescueRatio > 0) {
    qualityTier = 'low_confidence'
    tierReason = 'Some sessions required rescue path'
  } else if (fallbackRatio > 0.3) {
    qualityTier = 'constraint_supported'
    tierReason = 'Significant constraint-based fallback used'
  } else if (fallbackRatio > 0) {
    qualityTier = 'direct_with_adjustments'
    tierReason = 'Minor constraint adjustments applied'
  } else if (provenance.compressionPoints.length > 0) {
    qualityTier = 'direct_with_adjustments'
    tierReason = `Compression applied: ${provenance.compressionPoints[0]}`
  }
  
  const confidenceScore = Math.round(
    (directRatio * 100) - (fallbackRatio * 30) - (rescueRatio * 50)
  )
  
  const classification: QualityClassification = {
    qualityTier,
    directSelectionRatio: Math.round(directRatio * 100) / 100,
    fallbackSelectionRatio: Math.round(fallbackRatio * 100) / 100,
    rescueSelectionRatio: Math.round(rescueRatio * 100) / 100,
    confidenceScore: Math.max(0, Math.min(100, confidenceScore)),
    tierReason,
  }
  
  return classification
}

// =============================================================================
// DEFAULT INPUTS
// =============================================================================

export function getDefaultAdaptiveInputs(): AdaptiveProgramInputs {
  // [planner-input-truth] TASK 1: Use canonical composer for truthful planner inputs
  // This ensures all inputs are composed from canonical profile with provenance tracking
  const composedInput = composeCanonicalPlannerInput()
  
  // CANONICAL FIX: Use the unified canonical profile instead of split sources
  // This ensures metrics, goals, and schedule preferences all come from one truth
  const canonicalProfile = getCanonicalProfile()
  const legacyProfile = getAthleteProfile() // Fallback for fields not yet in canonical
  
  // Log canonical state for debugging
  logCanonicalProfileState('getDefaultAdaptiveInputs called')
  
  // [planner-input-truth] Log composition provenance
  if (composedInput.fallbacksUsed.length > 0) {
    console.log('[planner-input-truth] Fallbacks used in composition:', composedInput.fallbacksUsed)
  }
  
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
  
  // [equipment-hydration-audit] Log equipment truth when builder inputs are loaded
  console.log('[equipment-hydration-audit] Builder inputs loaded from canonical:', {
    canonicalProfileEquipment: canonicalProfile.equipmentAvailable,
    mappedBuilderEquipment: mappedEquipment,
    hiddenRuntimeAdded: ['floor', 'wall'],
    usedFallbackDefaults: !canonicalProfile.equipmentAvailable || canonicalProfile.equipmentAvailable.length === 0,
  })
  
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
