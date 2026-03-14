// Adaptive Program Builder
// Main entry point for constraint-aware, time-adaptive program generation

import type { PrimaryGoal, ExperienceLevel, TrainingDays, SessionLength } from './program-service'
import type { EquipmentType } from './adaptive-exercise-pool'
import type { RecoveryLevel } from './recovery-engine'
import type { WeeklyStructure, DayStructure } from './program-structure-engine'
import type { ExerciseSelection, SelectedExercise } from './program-exercise-selector'

import { getAthleteProfile } from './data-service'
import { calculateRecoverySignal } from './recovery-engine'
import { getConstraintInsight } from './constraint-engine'
import { getProgramBuilderContext } from './adaptive-athlete-engine'
import { getAthleteCalibration, getProgramCalibrationAdjustments, type AthleteCalibration, type ProgramCalibrationAdjustments } from './athlete-calibration'
import { getOnboardingProfile } from './athlete-profile'
import { getUnifiedSkillIntelligence, generateTrainingAdjustments, type UnifiedSkillIntelligence } from './skill-intelligence-layer'
import { getCompressionReadiness, shouldBiasTowardCompression, type CompressionReadinessResult } from './compression-readiness'
import { selectOptimalStructure, getDayExplanation } from './program-structure-engine'
import { selectExercisesForSession } from './program-exercise-selector'
import { generateSessionVariants, type SessionVariant } from './session-compression-engine'
import { analyzeEquipmentProfile, adaptSessionForEquipment, getEquipmentRecommendations, type EquipmentProfile } from './equipment-adaptation-engine'
import { GOAL_LABELS } from './program-service'
import { getQuickFatigueDecision, type TrainingDecision, type SessionAdjustments } from './fatigue-decision-engine'
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
  type ProgressionAnalysis,
  type ProgressionInsight,
} from './adaptive-progression-engine'
import {
  validateExerciseSelection,
  type ExerciseIntelligenceContext,
} from './exercise-intelligence-engine'
import {
  getReadinessAssessment,
  getSessionAdjustments,
  getFlexibilityRecoveryStatus,
  getMobilityRecoveryStatus,
  type ReadinessAssessment,
} from './recovery-fatigue-engine'
import {
  getConsistencyStatus,
  getComebackWorkoutConfig,
  getConsistencyAdjustments,
  type ConsistencyStatus,
  type ComebackWorkoutConfig,
} from './consistency-momentum-engine'

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
  // Athlete calibration context from onboarding
  calibrationContext?: {
    isCalibrated: boolean
    message: string
    notes: string[]
    includesCompressionWork: boolean
    includesEnduranceFinisher: boolean
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
  
  // Get athlete calibration from onboarding
  const athleteCalibration = getAthleteCalibration()
  const onboardingProfile = getOnboardingProfile()
  const calibrationAdjustments = getProgramCalibrationAdjustments(
    athleteCalibration,
    onboardingProfile?.primaryGoal || null,
    sessionLength
  )
  
  // Build calibration context for UI display
// Get compression readiness for program generation
  const compressionReadiness = getCompressionReadiness(onboardingProfile, athleteCalibration)
  const biasTowardCompression = shouldBiasTowardCompression(compressionReadiness, primaryGoal)
  
  const calibrationContext = athleteCalibration.calibrationComplete ? {
    isCalibrated: true,
    message: calibrationAdjustments.calibrationMessage,
    notes: calibrationAdjustments.progressionNotes,
    includesCompressionWork: calibrationAdjustments.includeCompressionWork || biasTowardCompression,
    includesEnduranceFinisher: calibrationAdjustments.includeEnduranceFinisher,
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
    includesEnduranceFinisher: false,
  }
  
  // Get fatigue-based training decision (runs client-side only)
  let fatigueDecision: { decision: TrainingDecision; shortGuidance: string; needsAttention: boolean } | null = null
  if (typeof window !== 'undefined') {
    fatigueDecision = getQuickFatigueDecision()
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
  const selectionContext: SelectionContext = {
    primaryGoal: primaryGoal as SkillType,
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
    wantsHypertrophy: profile?.goalCategory === 'strength',
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
  
  // Generate each session
  const sessions: AdaptiveSession[] = structure.days.map(day => {
    const session = generateAdaptiveSession(
      day,
      primaryGoal,
      experienceLevel,
      equipment,
      sessionLength,
      constraintInsight.hasInsight ? constraintInsight.label : undefined
    )
    
    // Add fatigue-based adaptation notes if needed
    if (fatigueDecision && fatigueDecision.decision !== 'TRAIN_AS_PLANNED') {
      const fatigueNote = getFatigueAdaptationNote(fatigueDecision.decision)
      if (fatigueNote) {
        session.adaptationNotes = session.adaptationNotes || []
        session.adaptationNotes.push(fatigueNote)
      }
    }
    
    return session
  })
  
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
      explanation: constraintInsight.explanation,
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
    // Athlete calibration context
    calibrationContext: calibrationContext,
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
  }
}

// =============================================================================
// FATIGUE ADAPTATION HELPERS
// =============================================================================

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
      return JSON.parse(stored)
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
  
  // Determine primary goal
  let primaryGoal: PrimaryGoal = 'planche'
  if (profile.primaryGoal && ['planche', 'front_lever', 'muscle_up', 'handstand_pushup', 'weighted_strength'].includes(profile.primaryGoal)) {
    primaryGoal = profile.primaryGoal as PrimaryGoal
  }
  
  // Default equipment
  const defaultEquipment: EquipmentType[] = ['pull_bar', 'dip_bars', 'floor', 'wall']
  
  return {
    primaryGoal,
    experienceLevel: profile.experienceLevel,
    trainingDaysPerWeek: (profile.trainingDaysPerWeek as TrainingDays) || 4,
    sessionLength: 60,
    equipment: defaultEquipment,
  }
}
