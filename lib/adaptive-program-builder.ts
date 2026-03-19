// Adaptive Program Builder
// Main entry point for constraint-aware, time-adaptive program generation

import type { PrimaryGoal, ExperienceLevel, TrainingDays, SessionLength } from './program-service'
import type { EquipmentType } from './adaptive-exercise-pool'
import type { RecoveryLevel } from './recovery-engine'
import type { WeeklyStructure, DayStructure } from './program-structure-engine'
import type { ExerciseSelection, SelectedExercise } from './program-exercise-selector'
import type { ProtocolRecommendation } from './protocols/joint-integrity-protocol'
import type { ConstraintResult, ConstraintIntervention } from './constraint-detection-engine'

import { getAthleteProfile } from './data-service'
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
  weakPointToLimitingFactor,
  type WeakPointAssessment,
  type SkillTarget,
} from './weak-point-engine'
import { getUnifiedSkillIntelligence, generateTrainingAdjustments, type UnifiedSkillIntelligence } from './skill-intelligence-layer'
import { getCompressionReadiness, shouldBiasTowardCompression, type CompressionReadinessResult } from './compression-readiness'
import { selectOptimalStructure, getDayExplanation } from './program-structure-engine'
import { selectExercisesForSession } from './program-exercise-selector'
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
  analyzeSignalsForAdaptive,
  type AdaptiveSignalFeedback,
} from './override-signal-service'
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
  
// =============================================================================
// TYPES
// =============================================================================

export interface AdaptiveProgramInputs {
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  sessionLength: SessionLength
  equipment: EquipmentType[]
  todaySessionMinutes?: number // Override for today's available time
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
  // Training method information
  method?: TrainingMethod
  methodLabel?: string
  blockId?: string // Groups exercises in the same block (e.g., superset)
  // Session override tracking (runtime only, not persisted to program)
  originalName?: string // Set when exercise is replaced
  isSkipped?: boolean // Set when exercise is skipped
  isReplaced?: boolean // Set when exercise is replaced
  isProgressionAdjusted?: boolean // Set when progression is changed
}

export interface AdaptiveProgram {
  id: string
  createdAt: string
  primaryGoal: PrimaryGoal
  goalLabel: string
  experienceLevel: ExperienceLevel
  trainingDaysPerWeek: TrainingDays
  sessionLength: SessionLength
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

export function generateAdaptiveProgram(inputs: AdaptiveProgramInputs): AdaptiveProgram {
  const {
    primaryGoal,
    experienceLevel,
    trainingDaysPerWeek,
    sessionLength,
    equipment,
  } = inputs
  
  // Gather context
  const profile = getAthleteProfile()
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
  const onboardingProfile = getOnboardingProfile()
  const trainingOutcome = onboardingProfile?.primaryTrainingOutcome || 'general_fitness'
  const trainingPath = onboardingProfile?.trainingPathType || 'hybrid'
  const workoutDuration = onboardingProfile?.workoutDurationPreference || 'medium'
  
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
  
  // Select optimal weekly structure
  const structure = selectOptimalStructure({
    primaryGoal,
    trainingDays: trainingDaysPerWeek,
    recoveryLevel: recoverySignal.level,
    constraintType: constraintInsight.hasInsight ? constraintInsight.label : undefined,
  })
  
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
    weeklyDays: trainingDaysPerWeek,
    existingIntents: [],
  })
  
  // Generate repetition justifications
  const repetitionJustifications = generateRepetitionJustifications(sessionIntents)
  
  // Generate each session with variety info
  const sessions: AdaptiveSession[] = structure.days.map((day, index) => {
    const intent = sessionIntents[index]
    const session = generateAdaptiveSession(
      day,
      primaryGoal,
      experienceLevel,
      equipment,
      sessionLength,
      constraintInsight.hasInsight ? constraintInsight.label : undefined
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
      if (feedbackState.needsDeload) {
        session.adaptationNotes.push('Volume reduced based on recent session feedback (deload recommended)')
      } else if (feedbackState.volumeModifier < 1.0) {
        session.adaptationNotes.push('Volume slightly adjusted based on recent session feedback')
      } else {
        session.adaptationNotes.push('Ready to push - volume increased based on recovery feedback')
      }
    }
    
    return session
  })
  
  // Calculate variety score (0-1, higher = more varied)
  const varietyScore = calculateVarietyScore(sessionIntents)
  
  // Get constraint interventions for primary constraint
  let constraintInterventions: ConstraintIntervention[] = []
  if (constraintInsight.hasInsight && constraintInsight.focus) {
    const intervention = getConstraintIntervention(constraintInsight.focus, 65) // Mid-range severity
    constraintInterventions = [intervention]
  }
  
  // Record constraint detection in history (async, non-blocking)
  if (athleteId && constraintInsight.hasInsight) {
    recordConstraintHistory(
      athleteId,
      primaryGoal,
      {
        category: constraintInsight.focus || 'none',
        score: 65,
        indicatorMetrics: [],
        isPrimaryLimiter: true,
      } as any
    ).catch(err => console.error('Failed to record constraint history:', err))
  }
  
  // Fetch constraint improvement history for display (async)
  let constraintImprovementData: any = undefined
  if (athleteId) {
    calculateConstraintImprovement(athleteId, primaryGoal, 6)
      .then(improvements => {
        constraintImprovementData = {
          improvingConstraints: improvements.filter(c => c.trend === 'improving'),
          stableConstraints: improvements.filter(c => c.trend === 'stable'),
        }
      })
      .catch(err => console.error('Failed to fetch constraint improvements:', err))
  }
  
  // Generate program rationale
  const programRationale = generateProgramRationale(
    primaryGoal,
    structure,
    constraintInsight,
    recoverySignal.level,
    equipmentProfile
  )
  
  return {
    id: `adaptive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    primaryGoal,
    goalLabel: GOAL_LABELS[primaryGoal],
    experienceLevel,
    trainingDaysPerWeek,
    sessionLength,
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
  // Deload recommendation
  deloadRecommendation,
  // Session variety analysis
  varietyAnalysis: {
    sessionIntents,
    repetitionJustifications,
    varietyScore,
  },
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
    trainingBehaviorAnalysis: trainingBehavior ? {
      adaptationNeeded: trainingBehavior.adaptationNeeded,
      adaptationSummary: trainingBehavior.adaptationSummary,
      coachMessages: trainingBehavior.coachMessages,
      scheduleAdaptation: trainingBehavior.scheduleAnalysis.adaptation,
      recommendedDays: trainingBehavior.scheduleAnalysis.recommendedDays,
      volumeAdjustment: trainingBehavior.volumeAnalysis.volumeAdjustment,
      volumeModifier: trainingBehavior.volumeAnalysis.recommendedVolumeModifier,
      progressTrend: trainingBehavior.progressTrend.overallTrend,
      trendSummary: trainingBehavior.progressTrend.trendSummary,
      dataQuality: trainingBehavior.dataQuality,
    } : undefined,
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
// SESSION GENERATION
// =============================================================================

function generateAdaptiveSession(
  day: DayStructure,
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  equipment: EquipmentType[],
  sessionLength: SessionLength,
  constraintType?: string
): AdaptiveSession {
  // Select exercises
  const selection = selectExercisesForSession({
    day,
    primaryGoal,
    experienceLevel,
    equipment,
    sessionMinutes: sessionLength,
    constraintType,
  })
  
  // Adapt for equipment
  const adaptedMain = adaptSessionForEquipment(selection.main, equipment)
  const adaptedWarmup = adaptSessionForEquipment(selection.warmup, equipment)
  const adaptedCooldown = adaptSessionForEquipment(selection.cooldown, equipment)
  
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
    
    // Calculate session neural demand
    const sessionNeuralDemand = selection.exercises.some(e => e.exercise.neuralDemand >= 4) 
      ? 'high' as const
      : selection.exercises.some(e => e.exercise.neuralDemand >= 3)
        ? 'moderate' as const
        : 'low' as const

    // Select endurance block
    const enduranceResult = selectEnduranceBlock({
      primaryGoal,
      sessionLength,
      sessionCapacity: athleteCalibration.sessionCapacity,
      enduranceCompatibility: athleteCalibration.enduranceCompatibility,
      fatigueSensitivity: athleteCalibration.fatigueSensitivity,
      currentFatigueScore: recoverySignal.level === 'red' ? 80 : recoverySignal.level === 'yellow' ? 60 : 40,
      sessionNeuralDemand,
      timeRemainingMinutes: sessionTimeFit.recommendedDuration,
      availableEquipment: equipment,
    })

    // Generate the finisher if needed
    let finisher: GeneratedFinisher | undefined
    if (enduranceResult.shouldIncludeEndurance && enduranceResult.blockType) {
      // Adjust for fatigue
      const fatigueAdjustment = adjustBlockForFatigue(
        enduranceResult.duration,
        recoverySignal.level === 'red' ? 80 : recoverySignal.level === 'yellow' ? 60 : 40,
        athleteCalibration.fatigueSensitivity
      )
      
      if (!fatigueAdjustment.shouldSkip) {
        finisher = generateFinisher(
          enduranceResult.blockType,
          fatigueAdjustment.adjustedDuration,
          equipment,
          athleteCalibration.fatigueSensitivity
        )
      }
    }

    return {
      dayNumber: day.dayNumber,
      dayLabel: `Day ${day.dayNumber}`,
      focus: day.focus,
      focusLabel: day.focusLabel,
      isPrimary: day.isPrimary,
      rationale,
exercises: mapToAdaptiveExercises(
      adaptedMain.adapted, 
      primaryGoal, 
      sessionLength, 
      athleteCalibration.fatigueSensitivity,
      recoverySignal.level === 'red' ? 80 : recoverySignal.level === 'yellow' ? 60 : 40
    ),
    warmup: mapToAdaptiveExercises(adaptedWarmup.adapted, primaryGoal, sessionLength),
    cooldown: mapToAdaptiveExercises(adaptedCooldown.adapted, primaryGoal, sessionLength),
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
  let fatigueBudgetRemaining = 100
  
  // Calculate session type for failure budget
  const sessionType = primaryGoal === 'skill' ? 'skill' as const
    : primaryGoal === 'endurance' ? 'endurance' as const
    : primaryGoal === 'strength' ? 'strength' as const
    : 'mixed' as const
  
  // Determine session neural demand
  const sessionNeuralDemand = selected.some(s => s.exercise.neuralDemand >= 4) 
    ? 'high' as const
    : selected.some(s => s.exercise.neuralDemand >= 3)
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
  
  return selected.map((s, index) => {
    // Get method compatibility for exercise
    const compatibility = s.exercise.methodCompatibility || 
      getDefaultMethodCompatibility(s.exercise.category, s.exercise.movementPattern, s.exercise.neuralDemand)
    
    // Get failure risk for this exercise
    const failureRisk = s.exercise.failureRisk || 
      getDefaultFailureRisk(s.exercise.category, s.exercise.neuralDemand, s.exercise.movementPattern)
    
    // Determine if this is near end of session
    const isEndOfSession = index >= selected.length - 2
    
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
    
    return {
      id: s.exercise.id,
      name: s.exercise.name,
      category: s.exercise.category,
      sets: s.sets,
      repsOrTime: s.repsOrTime,
      note: s.note,
      isOverrideable: s.isOverrideable,
      selectionReason: s.selectionReason,
      method,
      methodLabel: getMethodLabel(method),
    }
  })
}

// =============================================================================
// PROGRAM RATIONALE
// =============================================================================

function generateProgramRationale(
  primaryGoal: PrimaryGoal,
  structure: WeeklyStructure,
  constraintInsight: ReturnType<typeof getConstraintInsight>,
  recoveryLevel: RecoveryLevel,
  equipmentProfile: EquipmentProfile
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
  
  // Strength support awareness (new from engine)
  if (engineCtx.strengthSupportLevel === 'insufficient') {
    parts.push('Additional emphasis on weighted strength work to build foundational support.')
  } else if (engineCtx.strengthSupportLevel === 'developing') {
    parts.push('Continue building support strength alongside skill work.')
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
  
  const programs = getSavedAdaptivePrograms()
  programs.push(program)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
  
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
  const profile = getAthleteProfile()
  
  // Determine primary goal from AthleteProfile
  let primaryGoal: PrimaryGoal = 'planche'
  if (profile.primaryGoal && ['planche', 'front_lever', 'muscle_up', 'handstand_pushup', 'weighted_strength'].includes(profile.primaryGoal)) {
    primaryGoal = profile.primaryGoal as PrimaryGoal
  }
  
  // Map AthleteProfile equipment to EquipmentType
  // AthleteProfile uses: 'pullup_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'resistance_bands'
  // AdaptiveProgramInputs uses: 'pull_bar' | 'dip_bars' | 'rings' | 'parallettes' | 'bands' | 'floor' | 'wall'
  const equipmentMap: Record<string, EquipmentType> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'parallettes': 'parallettes',
    'rings': 'rings',
    'resistance_bands': 'bands',
  }
  
  // Start with floor and wall (always available)
  const mappedEquipment: EquipmentType[] = ['floor', 'wall']
  
  // Add equipment from profile
  if (profile.equipmentAvailable && profile.equipmentAvailable.length > 0) {
    for (const eq of profile.equipmentAvailable) {
      const mapped = equipmentMap[eq]
      if (mapped && !mappedEquipment.includes(mapped)) {
        mappedEquipment.push(mapped)
      }
    }
  } else {
    // Fallback to sensible defaults if no equipment saved
    mappedEquipment.push('pull_bar', 'dip_bars')
  }
  
  // Map session length from profile (30, 45, 60, 90) to SessionLength (30, 45, 60, 75)
  let sessionLength: SessionLength = 60
  const profileSessionLength = profile.sessionLengthMinutes
  if (profileSessionLength === 30) sessionLength = 30
  else if (profileSessionLength === 45) sessionLength = 45
  else if (profileSessionLength === 60) sessionLength = 60
  else if (profileSessionLength === 90) sessionLength = 75 // Map 90 to 75 (closest match)
  
  return {
    primaryGoal,
    experienceLevel: profile.experienceLevel,
    trainingDaysPerWeek: (profile.trainingDaysPerWeek as TrainingDays) || 4,
    sessionLength,
    equipment: mappedEquipment,
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
