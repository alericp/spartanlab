// Program Exercise Selector
// Selects optimal exercises based on goal, structure, equipment, and constraints

import type { PrimaryGoal, ExperienceLevel, SessionLength } from './program-service'
import type { DayFocus, DayStructure } from './program-structure-engine'
import {
  type Exercise,
  type EquipmentType,
  type DifficultyLevel,
  SKILL_EXERCISES,
  STRENGTH_EXERCISES,
  ACCESSORY_EXERCISES,
  CORE_EXERCISES_POOL,
  WARMUP_EXERCISES,
  COOLDOWN_EXERCISES,
  FLEXIBILITY_EXERCISES,
  getExercisesByTransfer,
  hasRequiredEquipment,
  getAllExercises,
} from './adaptive-exercise-pool'
import { FLEXIBILITY_SEQUENCES, generateFlexibilitySession } from './flexibility-sequences'
import {
  type RangeTrainingMode,
  type RangeSkill,
  MOBILITY_EXERCISES,
  generateRangeSession,
  determineRangeTrainingMode,
  getSessionExplanation,
  getPlanRationale,
} from './range-training-system'
import {
  type MethodProfile,
  type MethodProfileId,
  type SkillType,
  METHOD_PROFILES,
  selectMethodProfiles,
  getExerciseMethodCompatibility,
  type SelectionContext,
  type SelectedMethods,
} from './training-principles-engine'
import {
  getAdaptedExercise,
  getProgressionUp,
  getProgressionDown,
  getBestSubstitute,
  getExerciseLadder,
  getFatigueRegression,
  type SubstituteOption,
} from './progression-ladders'
import {
  evaluateExerciseProgression,
  type ProgressionDecision,
  type ProgressionEvaluation,
} from './progression-decision-engine'
import {
  generateWarmUp,
  type GeneratedWarmUp,
  type WarmUpGenerationContext,
} from './warmup-engine'
import {
  generateCoolDown,
  type GeneratedCoolDown,
  type CoolDownGenerationContext,
  type FlexibilityPathway,
} from './cooldown-engine'
import {
  selectBestExercise,
  selectExercisesForCategory,
  findBestReplacement,
  validateExerciseSelection,
  getSkillExerciseRecommendations,
  selectRangeExercises,
  getShortExplanation,
  type ExerciseIntelligenceContext,
  type ExerciseScore,
  type IntelligentSelection,
} from './exercise-intelligence-engine'
import type { PerformanceEnvelope } from './performance-envelope-engine'
import type { MovementFamily, ArmType, TrunkDemand, ScapularDemand, SkillCarryover, StressLevel } from './movement-family-registry'
import {
  normalizeToMovementIntelligent,
  analyzeSessionPatterns,
  validateSessionCoherence,
  selectSupportForSkill,
  selectSupportForLimiter,
  getMovementIntelligentExercise,
  filterMovementIntelligent,
  LIMITER_MOVEMENT_REQUIREMENTS,
  type MovementIntelligentExercise,
  type SessionPatternAnalysis,
  type CoherenceCheckResult,
} from './movement-intelligence'
import {
  checkExercisePrerequisite,
  buildPrerequisiteContext,
  isGatedExercise,
  getExerciseKnowledgeBubble,
  type AthletePrerequisiteContext,
  type GateCheckResult,
} from './prerequisite-gate-engine'
import {
  buildExerciseLoadMetadata,
  calculateSessionLoad,
  determineSessionStyle,
  getSessionLoadBudget,
  validateSessionAntiBloat,
  generateSessionLoadRationale,
  type ExerciseLoadMetadata,
  type DeliveryStyle,
  type TrainingSessionStyle,
  type SessionLoadSummary,
} from './session-load-intelligence'

export interface SelectedExercise {
  exercise: Exercise
  sets: number
  repsOrTime: string
  note?: string
  isOverrideable: boolean
  selectionReason: string
  // Prerequisite Gate fields
  gateCheckResult?: GateCheckResult
  knowledgeBubble?: string
  wasSubstituted?: boolean
  originalExerciseId?: string
  // Session Load Intelligence fields
  loadMetadata?: ExerciseLoadMetadata
  deliveryStyle?: DeliveryStyle
}

// =============================================================================
// PREREQUISITE GATE CHECK WRAPPER
// =============================================================================

/**
 * Apply prerequisite gate checks to an exercise selection
 * Returns the exercise (or safe substitute) with gate metadata
 */
function applyPrerequisiteGate(
  exercise: Exercise,
  context: AthletePrerequisiteContext | undefined,
  experienceLevel: ExperienceLevel
): { exercise: Exercise; gateResult: GateCheckResult; wasSubstituted: boolean; originalId?: string } {
  // Build context if not provided
  const prerequisiteContext = context || buildPrerequisiteContext({
    experienceLevel,
  })
  
  // Check if this exercise passes the gate
  const gateResult = checkExercisePrerequisite(exercise.id, prerequisiteContext)
  
  if (gateResult.allowed) {
    return { exercise, gateResult, wasSubstituted: false }
  }
  
  // Exercise not allowed - find substitute
  if (gateResult.recommendedSubstitute) {
    const allExercises = getAllExercises()
    const substitute = allExercises.find(e => 
      e.id === gateResult.recommendedSubstitute!.exerciseId ||
      e.name.toLowerCase().replace(/\s+/g, '_') === gateResult.recommendedSubstitute!.exerciseId
    )
    
    if (substitute) {
      return {
        exercise: substitute,
        gateResult,
        wasSubstituted: true,
        originalId: exercise.id,
      }
    }
  }
  
  // No substitute found - return original with warning
  return { exercise, gateResult, wasSubstituted: false }
}

export interface ExerciseSelection {
  warmup: SelectedExercise[]
  main: SelectedExercise[]
  cooldown: SelectedExercise[]
  totalEstimatedTime: number
  // Session Load Intelligence fields
  sessionLoadSummary?: SessionLoadSummary
  sessionStyle?: TrainingSessionStyle
  loadRationale?: string[]
  antiBloatValidation?: {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }
}

interface ExerciseSelectionInputs {
  day: DayStructure
  primaryGoal: PrimaryGoal
  experienceLevel: ExperienceLevel
  equipment: EquipmentType[]
  sessionMinutes: number
  constraintType?: string
  currentProgressionLevel?: number
  // New progression-aware fields
  fatigueLevel?: 'low' | 'moderate' | 'high'
  athleteDifficultyLevel?: DifficultyLevel
  // Training principles engine integration
  selectedMethods?: SelectedMethods
  rangeTrainingMode?: RangeTrainingMode
  // Exercise Intelligence Engine integration
  athleteProfile?: import('@/types/domain').AthleteProfile
  targetSkills?: SkillType[]
  // Performance Envelope integration
  envelopes?: PerformanceEnvelope[]
  // Prerequisite Gate Engine integration
  prerequisiteContext?: AthletePrerequisiteContext
  jointCautions?: string[]
}

// =============================================================================
// MAIN SELECTION FUNCTION
// =============================================================================

export function selectExercisesForSession(inputs: ExerciseSelectionInputs): ExerciseSelection {
  console.log('[exercise-resolver] selectExercisesForSession called:', {
    dayFocus: inputs.day.focus,
    primaryGoal: inputs.primaryGoal,
    sessionMinutes: inputs.sessionMinutes,
  })
  
  const {
    day,
    primaryGoal,
    experienceLevel,
    equipment,
    sessionMinutes,
    constraintType,
    selectedMethods,
    fatigueLevel,
    athleteProfile,
    targetSkills,
    rangeTrainingMode,
    prerequisiteContext: inputContext,
    jointCautions,
  } = inputs
  
  // Build prerequisite context for gate checks
  const prerequisiteContext = inputContext || buildPrerequisiteContext({
    experienceLevel,
    jointCautions: jointCautions as ('shoulder' | 'elbow' | 'wrist' | 'lower_back' | 'hip' | 'knee' | 'ankle')[],
  })
  
  // Calculate exercise budget based on session time
  const budget = calculateExerciseBudget(sessionMinutes)
  
  // Get principle rules if methods are selected
  const primaryMethod = selectedMethods?.primary
  const principleRules = primaryMethod?.rules
  
  // Build Exercise Intelligence Context for smarter selection
  const intelligenceContext: ExerciseIntelligenceContext = {
    athleteProfile,
    experienceLevel,
    availableEquipment: equipment,
    primaryGoal: primaryGoal as SkillType,
    targetSkills: targetSkills || [primaryGoal as SkillType],
    methodProfile: selectedMethods?.primary?.id,
    fatigueLevel: fatigueLevel || 'moderate',
    sessionMinutes,
    sessionFocus: day.focus === 'skill' ? 'skill' : 
                  day.focus === 'strength' ? 'strength' : 
                  day.focus === 'flexibility' ? 'flexibility' : undefined,
    preferLowerFatigue: fatigueLevel === 'high',
    preferHighCarryover: true,
  }
  
  // Get skill-specific exercises - ALL from DB
  const goalExercises = getExercisesByTransfer(primaryGoal)
  
  // Filter by equipment - ALL candidates from exercise database (adaptive-exercise-pool.ts)
  const availableSkills = SKILL_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableStrength = STRENGTH_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableAccessory = ACCESSORY_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableCore = CORE_EXERCISES_POOL.filter(e => hasRequiredEquipment(e, equipment))
  
  // DATABASE ENFORCEMENT: Log candidate counts from DB
  console.log('[exercise-resolver] DB candidates available:', {
    skills: availableSkills.length,
    strength: availableStrength.length,
    accessory: availableAccessory.length,
    core: availableCore.length,
    goalSpecific: goalExercises.length,
  })
  
  // Select main exercises based on day focus with prerequisite gate checks
  const main = selectMainExercises(
    day,
    primaryGoal,
    experienceLevel,
    goalExercises,
    availableSkills,
    availableStrength,
    availableAccessory,
    availableCore,
    budget.mainExercises,
    constraintType,
    prerequisiteContext
  )
  
  // Generate intelligent warmup based on main exercises
  const warmup = selectIntelligentWarmup(
    main,
    primaryGoal,
    sessionMinutes,
    equipment
  )
  
  // Generate intelligent cooldown based on main exercises
  const cooldown = selectIntelligentCooldown(
    main,
    primaryGoal,
    sessionMinutes,
    equipment
  )
  
  // Calculate total time
  const totalEstimatedTime = calculateTotalTime(warmup, main, cooldown)
  
  // =========================================================================
  // SESSION LOAD INTELLIGENCE
  // =========================================================================
  
  // Determine session style based on context
  const primaryFocus = day.focus === 'skill' || day.focus === 'push_skill' || day.focus === 'pull_skill' 
    ? 'skill' as const
    : day.focus === 'push_strength' || day.focus === 'pull_strength'
      ? 'strength' as const
      : day.focus === 'support_recovery'
        ? 'recovery' as const
        : 'mixed' as const
  
  const sessionStyle = determineSessionStyle(
    sessionMinutes,
    primaryFocus,
    undefined, // structureType - could be passed from context
    undefined  // fatigueProfile
  )
  
  // Build load metadata for main exercises
  const mainLoadMetadata: ExerciseLoadMetadata[] = main.map(ex => {
    const metadata = buildExerciseLoadMetadata(
      {
        category: ex.exercise.category,
        neuralDemand: ex.exercise.neuralDemand,
        fatigueCost: ex.exercise.fatigueCost,
        movementPattern: ex.exercise.movementPattern,
        isIsometric: ex.exercise.isIsometric,
      },
      ex.deliveryStyle || 'standalone'
    )
    // Attach metadata to exercise for downstream use
    ex.loadMetadata = metadata
    return metadata
  })
  
  // Calculate session load and validate
  const loadBudget = getSessionLoadBudget(sessionStyle)
  const sessionLoadSummary = calculateSessionLoad(mainLoadMetadata, loadBudget)
  const antiBloatResult = validateSessionAntiBloat(mainLoadMetadata, sessionStyle)
  const loadRationale = generateSessionLoadRationale(sessionLoadSummary, sessionStyle)
  
  return {
    warmup,
    main,
    cooldown,
    totalEstimatedTime,
    sessionLoadSummary,
    sessionStyle,
    loadRationale,
    antiBloatValidation: {
      isValid: antiBloatResult.isValid,
      issues: antiBloatResult.issues,
      suggestions: antiBloatResult.suggestions,
    },
  }
}

// =============================================================================
// EXERCISE BUDGET
// =============================================================================

interface ExerciseBudget {
  mainExercises: number
  warmupMinutes: number
  cooldownMinutes: number
}

function calculateExerciseBudget(sessionMinutes: number): ExerciseBudget {
  if (sessionMinutes <= 30) {
    return { mainExercises: 4, warmupMinutes: 5, cooldownMinutes: 3 }
  }
  if (sessionMinutes <= 45) {
    return { mainExercises: 5, warmupMinutes: 7, cooldownMinutes: 5 }
  }
  if (sessionMinutes <= 60) {
    return { mainExercises: 6, warmupMinutes: 10, cooldownMinutes: 5 }
  }
  // 75+ minutes
  return { mainExercises: 7, warmupMinutes: 10, cooldownMinutes: 8 }
}

// =============================================================================
// MAIN EXERCISE SELECTION
// =============================================================================

function selectMainExercises(
  day: DayStructure,
  primaryGoal: PrimaryGoal,
  experienceLevel: ExperienceLevel,
  goalExercises: Exercise[],
  availableSkills: Exercise[],
  availableStrength: Exercise[],
  availableAccessory: Exercise[],
  availableCore: Exercise[],
  maxExercises: number,
  constraintType?: string,
  prerequisiteContext?: AthletePrerequisiteContext
): SelectedExercise[] {
  const selected: SelectedExercise[] = []
  const usedIds = new Set<string>()
  
  // =========================================================================
  // SESSION LOAD TRACKING FOR ANTI-BLOAT
  // =========================================================================
  let currentWeightedLoad = 0
  let highFatigueCount = 0
  let straightArmCount = 0
  let primaryCount = 0
  
  // =========================================================================
  // MOVEMENT INTELLIGENCE TRACKING
  // =========================================================================
  const movementIntelligentExercises: MovementIntelligentExercise[] = []
  const jointStressAccumulator = {
    shoulder: 0,
    elbow: 0,
    wrist: 0,
    lowerBack: 0,
  }
  let compressionCoreCount = 0
  let antiExtensionCoreCount = 0
  let verticalPushCount = 0
  let horizontalPushCount = 0
  let verticalPullCount = 0
  let horizontalPullCount = 0
  
  // Session load limits based on typical skill/strength session
  const WEIGHTED_LOAD_LIMIT = 5.5  // Typical max for skill_strength_dominant
  const HIGH_FATIGUE_LIMIT = 3
  const STRAIGHT_ARM_LIMIT = 2
  const PRIMARY_LIMIT = 3
  
  // Joint stress limits (scaled from StressLevel: low=1, moderate=2, high=3, very_high=4)
  const JOINT_STRESS_LIMITS = {
    shoulder: 10,  // Allow up to moderate stress * 5 exercises
    elbow: 8,
    wrist: 8,
    lowerBack: 8,
  }
  
  const stressToNumber = (stress: StressLevel): number => {
    return stress === 'low' ? 1 : stress === 'moderate' ? 2 : stress === 'high' ? 3 : 4
  }
  
  // Helper to check if we can add more based on load and movement intelligence
  const canAddMore = (exercise: Exercise, deliveryStyle: DeliveryStyle = 'standalone'): boolean => {
    const metadata = buildExerciseLoadMetadata(
      {
        category: exercise.category,
        neuralDemand: exercise.neuralDemand,
        fatigueCost: exercise.fatigueCost,
        movementPattern: exercise.movementPattern,
        isIsometric: exercise.isIsometric,
      },
      deliveryStyle
    )
    
    // Get movement intelligence for this exercise
    const movementIntel = normalizeToMovementIntelligent(exercise)
    
    // Check if adding this exercise would exceed limits
    const newWeightedLoad = currentWeightedLoad + metadata.sessionCountWeight
    const newHighFatigue = highFatigueCount + (metadata.fatigueWeight === 'high' ? 1 : 0)
    const newStraightArm = straightArmCount + (movementIntel.armType === 'straight_arm' ? 1 : 0)
    const newPrimary = primaryCount + (metadata.role === 'skill_primary' || metadata.role === 'strength_primary' ? 1 : 0)
    
    // For accessory/rehab/core, be more lenient with raw exercise count
    const isLowImpact = metadata.role === 'accessory' || metadata.role === 'rehab_prep' || metadata.role === 'core'
    
    // Critical limits that should never be exceeded
    if (newHighFatigue > HIGH_FATIGUE_LIMIT + 1) return false
    if (newStraightArm > STRAIGHT_ARM_LIMIT + 1) return false
    if (newPrimary > PRIMARY_LIMIT + 1) return false
    
    // Weighted load check (more lenient for low-impact exercises)
    if (!isLowImpact && newWeightedLoad > WEIGHTED_LOAD_LIMIT + 1) return false
    
    // =========================================================================
    // MOVEMENT INTELLIGENCE CHECKS
    // =========================================================================
    
    // Check joint stress accumulation
    const newShoulderStress = jointStressAccumulator.shoulder + stressToNumber(movementIntel.jointStress.shoulder)
    const newElbowStress = jointStressAccumulator.elbow + stressToNumber(movementIntel.jointStress.elbow)
    const newWristStress = jointStressAccumulator.wrist + stressToNumber(movementIntel.jointStress.wrist)
    const newLowerBackStress = jointStressAccumulator.lowerBack + stressToNumber(movementIntel.jointStress.lowerBack)
    
    // Reject if any joint is overloaded
    if (newShoulderStress > JOINT_STRESS_LIMITS.shoulder) {
      console.log('[movement-intel] Rejecting exercise due to shoulder stress:', exercise.id)
      return false
    }
    if (newWristStress > JOINT_STRESS_LIMITS.wrist) {
      console.log('[movement-intel] Rejecting exercise due to wrist stress:', exercise.id)
      return false
    }
    if (newElbowStress > JOINT_STRESS_LIMITS.elbow) {
      console.log('[movement-intel] Rejecting exercise due to elbow stress:', exercise.id)
      return false
    }
    
    return true
  }
  
  // Helper to add exercise with prerequisite gate check and load tracking
  const addExercise = (
    exercise: Exercise,
    reason: string,
    setsOverride?: number,
    repsOverride?: string,
    noteOverride?: string,
    deliveryStyle: DeliveryStyle = 'standalone'
  ) => {
    if (usedIds.has(exercise.id)) return false
    if (selected.length >= maxExercises) return false
    
    // Check load limits before adding
    if (!canAddMore(exercise, deliveryStyle)) return false
    
    // Apply prerequisite gate check
    const { exercise: finalExercise, gateResult, wasSubstituted, originalId } = 
      applyPrerequisiteGate(exercise, prerequisiteContext, experienceLevel)
    
    usedIds.add(finalExercise.id)
    if (originalId) usedIds.add(originalId)
    
    // Get knowledge bubble for educational context
    const knowledgeBubble = getExerciseKnowledgeBubble(exercise.id)
    
    // Build load metadata
    const loadMetadata = buildExerciseLoadMetadata(
      {
        category: finalExercise.category,
        neuralDemand: finalExercise.neuralDemand,
        fatigueCost: finalExercise.fatigueCost,
        movementPattern: finalExercise.movementPattern,
        isIsometric: finalExercise.isIsometric,
      },
      deliveryStyle
    )
    
    // Update running totals
    currentWeightedLoad += loadMetadata.sessionCountWeight
    if (loadMetadata.fatigueWeight === 'high') highFatigueCount++
    if (loadMetadata.jointStressCategory === 'straight_arm') straightArmCount++
    if (loadMetadata.role === 'skill_primary' || loadMetadata.role === 'strength_primary') primaryCount++
    
    // =========================================================================
    // UPDATE MOVEMENT INTELLIGENCE TRACKING
    // =========================================================================
    const movementIntel = normalizeToMovementIntelligent(finalExercise)
    movementIntelligentExercises.push(movementIntel)
    
    // Update joint stress accumulator
    jointStressAccumulator.shoulder += stressToNumber(movementIntel.jointStress.shoulder)
    jointStressAccumulator.elbow += stressToNumber(movementIntel.jointStress.elbow)
    jointStressAccumulator.wrist += stressToNumber(movementIntel.jointStress.wrist)
    jointStressAccumulator.lowerBack += stressToNumber(movementIntel.jointStress.lowerBack)
    
    // Track pattern counts using movement intelligence
    if (movementIntel.armType === 'straight_arm') straightArmCount++
    if (movementIntel.primaryPattern === 'compression_core') compressionCoreCount++
    if (movementIntel.primaryPattern === 'anti_extension_core') antiExtensionCoreCount++
    if (movementIntel.primaryPattern === 'vertical_push') verticalPushCount++
    if (movementIntel.primaryPattern === 'horizontal_push') horizontalPushCount++
    if (movementIntel.primaryPattern === 'vertical_pull') verticalPullCount++
    if (movementIntel.primaryPattern === 'horizontal_pull') horizontalPullCount++
    
    console.log('[movement-intel] Added exercise:', {
      id: finalExercise.id,
      pattern: movementIntel.primaryPattern,
      armType: movementIntel.armType,
      trunkDemand: movementIntel.trunkDemand,
      jointStress: movementIntel.jointStress,
    })
    
    selected.push({
      exercise: finalExercise,
      sets: setsOverride ?? adjustSetsForLevel(finalExercise.defaultSets, experienceLevel),
      repsOrTime: repsOverride ?? adjustRepsForLevel(finalExercise.defaultRepsOrTime, experienceLevel),
      note: wasSubstituted 
        ? `Substituted from ${exercise.name} - ${gateResult.recommendedSubstitute?.reason || 'Prerequisites not met'}`
        : noteOverride ?? finalExercise.notes,
      isOverrideable: finalExercise.category !== 'skill', // Skills are harder to replace
      selectionReason: wasSubstituted 
        ? `${reason} (safe progression substitute)`
        : reason,
      gateCheckResult: isGatedExercise(exercise.id) ? gateResult : undefined,
      knowledgeBubble: knowledgeBubble || undefined,
      wasSubstituted,
      originalExerciseId: originalId,
      loadMetadata,
      deliveryStyle,
    })
    return true
  }
  
  // ==========================================================================
  // Selection based on day focus
  // ==========================================================================
  
  // 1. SKILL DAYS - Lead with skill work
  if (day.focus === 'push_skill' || day.focus === 'pull_skill' || day.focus === 'skill_density') {
    // Add primary skill exercise(s)
    const skills = goalExercises.filter(e => e.category === 'skill')
    const primarySkill = selectByLevel(skills, experienceLevel)
    
    if (primarySkill) {
      addExercise(primarySkill, `Primary ${primaryGoal} skill work`)
    }
    
    // Add secondary skill for density days
    if (day.focus === 'skill_density' && skills.length > 1) {
      const secondarySkill = skills.find(s => s.id !== primarySkill?.id)
      if (secondarySkill) {
        addExercise(secondarySkill, 'Additional skill density', undefined, undefined, 'Moderate intensity')
      }
    }
    
    // Add primary strength work that supports skill
    const primaryStrength = goalExercises.filter(e => e.category === 'strength')
    const strengthPick = selectByLevel(primaryStrength, experienceLevel) ||
      availableStrength.find(e => e.transferTo.includes(primaryGoal))
    
    if (strengthPick) {
      addExercise(strengthPick, `Supports ${primaryGoal} development`)
    }
  }
  
  // 2. STRENGTH DAYS
  if (day.focus === 'push_strength' || day.focus === 'pull_strength') {
    const isPush = day.focus === 'push_strength'
    
    // Primary weighted movement
    const primaryWeighted = isPush
      ? availableStrength.find(e => e.id === 'weighted_dip')
      : availableStrength.find(e => e.id === 'weighted_pull_up')
    
    if (primaryWeighted) {
      const isHeavyDay = day.targetIntensity === 'high'
      addExercise(
        primaryWeighted,
        isHeavyDay ? 'Primary strength builder (heavy)' : 'Primary strength builder (volume)',
        isHeavyDay ? 4 : 3,
        isHeavyDay ? '3-5' : '6-8'
      )
    }
    
    // Goal-specific strength if different from weighted movement
    const goalStrength = goalExercises.filter(e => 
      e.category === 'strength' && e.id !== primaryWeighted?.id
    )
    const strengthPick = selectByLevel(goalStrength, experienceLevel)
    if (strengthPick) {
      addExercise(strengthPick, `Skill-specific ${isPush ? 'push' : 'pull'} strength`)
    }
    
    // Add skill exposure if this is a primary day
    if (day.isPrimary) {
      const skills = goalExercises.filter(e => e.category === 'skill')
      const skillPick = selectByLevel(skills, experienceLevel)
      if (skillPick) {
        addExercise(skillPick, 'Skill exposure alongside strength work')
      }
    }
  }
  
  // 3. MIXED/SUPPORT DAYS
  if (day.focus === 'mixed_upper' || day.focus === 'support_recovery') {
    const isLightDay = day.focus === 'support_recovery' || day.targetIntensity === 'low'
    
    // Balanced selection - some push, some pull
    const pushAccessory = availableAccessory.filter(e => e.movementPattern.includes('push'))
    const pullAccessory = availableAccessory.filter(e => e.movementPattern.includes('pull'))
    
    // Add moderate push work
    if (pushAccessory.length > 0) {
      const pick = pushAccessory.find(e => e.fatigueCost <= (isLightDay ? 2 : 3)) || pushAccessory[0]
      addExercise(pick, 'Balanced push work', isLightDay ? 3 : 4)
    }
    
    // Add moderate pull work
    if (pullAccessory.length > 0) {
      const pick = pullAccessory.find(e => e.fatigueCost <= (isLightDay ? 2 : 3)) || pullAccessory[0]
      addExercise(pick, 'Balanced pull work', isLightDay ? 3 : 4)
    }
    
    // Add skill exposure at reduced intensity
    const skills = goalExercises.filter(e => e.category === 'skill')
    const skillPick = selectByLevel(skills, experienceLevel)
    if (skillPick && !isLightDay) {
      addExercise(skillPick, 'Skill maintenance', 3, undefined, 'Moderate intensity')
    }
  }
  
  // 4. TRANSITION DAYS (for muscle-up goals)
  if (day.focus === 'transition_work') {
    const transitionExercises = [...availableSkills, ...availableStrength].filter(
      e => e.movementPattern === 'transition' || e.transferTo.includes('muscle_up')
    )
    
    transitionExercises.slice(0, 2).forEach(e => {
      addExercise(e, 'Transition pattern development')
    })
  }
  
  // 5. RANGE-BASED TRAINING (Flexibility vs Mobility)
  // SpartanLab distinguishes two training modes:
  // 
  // FLEXIBILITY MODE (default):
  //   - 15 second holds, 3 rounds, low soreness
  //   - Trainable daily, recovery-friendly
  // 
  // MOBILITY MODE (if rangeTrainingMode === 'mobility'):
  //   - Loaded stretches, RPE-based, strength-style recovery
  //   - Treated like strength training
  // 
  // HYBRID MODE: Combines both approaches
  const rangeSkills = ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'flexibility']
  if (rangeSkills.includes(primaryGoal) || day.focus === 'flexibility_focus') {
    // Determine range training mode (default to flexibility)
    const rangeTrainingMode: RangeTrainingMode = (context as { rangeTrainingMode?: RangeTrainingMode })?.rangeTrainingMode || 'flexibility'
    const isRangeSkill = ['pancake', 'toe_touch', 'front_splits', 'side_splits'].includes(primaryGoal)
    const rangeSkill = isRangeSkill ? primaryGoal as RangeSkill : 'toe_touch'
    
    if (rangeTrainingMode === 'flexibility' || rangeTrainingMode === 'hybrid') {
      // FLEXIBILITY MODE: 15s holds, 3 rounds, low fatigue
      const availableFlexibility = FLEXIBILITY_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
      const goalFlexibility = availableFlexibility.filter(e => 
        e.transferTo.includes(primaryGoal) || e.progressionLadder === primaryGoal
      )
      
      const flexPool = primaryGoal === 'flexibility' 
        ? availableFlexibility 
        : goalFlexibility.length > 0 ? goalFlexibility : availableFlexibility
      
      const sortedFlexExercises = flexPool.sort((a, b) => {
        const aTransfer = a.transferTo.includes(primaryGoal) ? 1 : 0
        const bTransfer = b.transferTo.includes(primaryGoal) ? 1 : 0
        if (aTransfer !== bTransfer) return bTransfer - aTransfer
        const aLadder = a.progressionLadder === primaryGoal ? 1 : 0
        const bLadder = b.progressionLadder === primaryGoal ? 1 : 0
        return bLadder - aLadder
      })
      
      // Flexibility: 15s holds, 3 rounds
      const flexCount = rangeTrainingMode === 'hybrid' ? 2 : Math.min(4, maxExercises - 1)
      sortedFlexExercises.slice(0, flexCount).forEach((exercise) => {
        addExercise(
          exercise,
          `${primaryGoal} flexibility flow`,
          3,
          '15s',
          '15s exposure, multiple angles, breathe steadily'
        )
      })
    }
    
    if (rangeTrainingMode === 'mobility' || rangeTrainingMode === 'hybrid') {
      // MOBILITY MODE: Loaded work, RPE-based, strength-style recovery
      const mobilityExercises = MOBILITY_EXERCISES[rangeSkill] || []
      const mobilityCount = rangeTrainingMode === 'hybrid' ? 2 : Math.min(3, maxExercises - selected.length)
      
      mobilityExercises.slice(0, mobilityCount).forEach((mobEx) => {
        // Find matching exercise in pool or create reference
        const matchingExercise = FLEXIBILITY_EXERCISES.find(e => e.id === mobEx.id) || {
          id: mobEx.id,
          name: mobEx.name,
          category: 'flexibility' as const,
          movementPattern: 'mobility',
          primaryMuscles: ['hip_flexors'],
          equipment: ['floor'] as EquipmentType[],
          neuralDemand: 2,
          fatigueCost: 2,
          transferTo: [rangeSkill],
          defaultSets: mobEx.sets,
          defaultRepsOrTime: mobEx.repsOrHold,
          difficultyLevel: 'intermediate' as DifficultyLevel,
          movementCategory: 'flexibility',
        }
        
        addExercise(
          matchingExercise,
          `${primaryGoal} mobility work (RPE ${mobEx.targetRPE})`,
          mobEx.sets,
          mobEx.repsOrHold,
          mobEx.cues.join(', ')
        )
      })
    }
    
    // Add light core/compression if room
    if (selected.length < maxExercises) {
      const compressionCore = availableCore.find(e => 
        e.movementPattern === 'compression' || e.transferTo.includes('l_sit')
      )
      if (compressionCore && !usedIds.has(compressionCore.id)) {
        addExercise(compressionCore, 'Active compression support', 3, '15s')
      }
    }
  }
  
  // ==========================================================================
  // Fill remaining slots with support and core work
  // ==========================================================================
  
  // Add constraint-responsive exercise if applicable
  if (constraintType && selected.length < maxExercises) {
    const constraintExercise = getConstraintTargetedExercise(
      constraintType,
      availableStrength,
      availableAccessory,
      usedIds
    )
    if (constraintExercise) {
      addExercise(constraintExercise, `Targets your current limiter: ${constraintType}`)
    }
  }
  
  // Add accessory work
  if (selected.length < maxExercises - 1) {
    // Add movement-appropriate accessory
    const accessoryPool = day.movementEmphasis === 'push'
      ? availableAccessory.filter(e => e.movementPattern.includes('push'))
      : day.movementEmphasis === 'pull'
        ? availableAccessory.filter(e => e.movementPattern.includes('pull'))
        : availableAccessory
    
    const unusedAccessory = accessoryPool.filter(e => !usedIds.has(e.id))
    if (unusedAccessory.length > 0) {
      const pick = unusedAccessory.find(e => e.fatigueCost <= 2) || unusedAccessory[0]
      addExercise(pick, 'Support volume')
    }
  }
  
  // =========================================================================
  // MOVEMENT-INTELLIGENT CORE SELECTION
  // =========================================================================
  
  // Always try to include core work using movement intelligence
  if (selected.length < maxExercises) {
    // Use movement intelligence to select appropriate core type
    const needsCompression = compressionCoreCount === 0 && (
      primaryGoal === 'l_sit' || primaryGoal === 'v_sit' || 
      primaryGoal === 'front_lever' || primaryGoal === 'planche'
    )
    const needsAntiExtension = antiExtensionCoreCount === 0 && (
      primaryGoal === 'front_lever' || primaryGoal === 'dragon_flag' ||
      primaryGoal === 'planche' || primaryGoal === 'muscle_up'
    )
    
    let corePick: Exercise | undefined
    let coreReason = ''
    
    if (needsCompression) {
      // Select compression core using movement intelligence
      corePick = availableCore.find(e => {
        if (usedIds.has(e.id)) return false
        const intel = normalizeToMovementIntelligent(e)
        return intel.primaryPattern === 'compression_core' || intel.trunkDemand === 'compression'
      })
      coreReason = 'Compression strength for skill transfer'
    } else if (needsAntiExtension) {
      // Select anti-extension core - prefer dragon flag progressions when appropriate
      corePick = availableCore.find(e => {
        if (usedIds.has(e.id)) return false
        const intel = normalizeToMovementIntelligent(e)
        
        // Prefer dragon flag progressions for advanced goals
        if (experienceLevel !== 'beginner' && (
          e.id === 'dragon_flag' || e.id === 'dragon_flag_neg' || 
          e.id === 'dragon_flag_tuck' || e.id === 'dragon_flag_assisted'
        )) {
          return true
        }
        
        return intel.primaryPattern === 'anti_extension_core' || intel.trunkDemand === 'anti_extension'
      })
      coreReason = 'Anti-extension strength for body position control'
    } else {
      // Default: find core that transfers to goal
      corePick = availableCore.find(e => 
        !usedIds.has(e.id) && e.transferTo.includes(primaryGoal)
      ) || availableCore.find(e => !usedIds.has(e.id))
      coreReason = `Core work supporting ${primaryGoal}`
    }
    
    if (corePick) {
      console.log('[movement-intel] Selected core exercise:', corePick.id, coreReason)
      addExercise(corePick, coreReason)
    }
  }
  
  // =========================================================================
  // SESSION COHERENCE VALIDATION
  // =========================================================================
  
  if (movementIntelligentExercises.length > 0) {
    const coherenceResult = validateSessionCoherence(movementIntelligentExercises)
    if (!coherenceResult.passed) {
      console.log('[movement-intel] Session coherence warnings:', coherenceResult.warnings)
    }
    
    const patternAnalysis = analyzeSessionPatterns(movementIntelligentExercises)
    console.log('[movement-intel] Session pattern analysis:', {
      straightArmCount: patternAnalysis.straightArmCount,
      pushCount: patternAnalysis.pushCount,
      pullCount: patternAnalysis.pullCount,
      compressionCount: patternAnalysis.compressionCount,
      antiExtensionCount: patternAnalysis.antiExtensionCount,
      totalJointStress: patternAnalysis.totalJointStress,
    })
  }
  
  // TASK 6: Final deduplication pass to remove any duplicate exercises
  const deduplicatedSelected = dedupeSelectedExercises(selected)
  if (deduplicatedSelected.length !== selected.length) {
    console.log('[exercise-selector] TASK 6: Removed', selected.length - deduplicatedSelected.length, 'duplicate exercises')
  }
  
  // Sort by neural demand (highest first)
  return deduplicatedSelected.sort((a, b) => b.exercise.neuralDemand - a.exercise.neuralDemand)
}

/**
 * TASK 6: Deduplicate selected exercises by exercise ID.
 */
function dedupeSelectedExercises(exercises: SelectedExercise[]): SelectedExercise[] {
  const seen = new Set<string>()
  return exercises.filter(ex => {
    const key = ex.exercise.id.toLowerCase()
    if (seen.has(key)) {
      console.log('[exercise-selector] TASK 6: Removing duplicate:', ex.exercise.name)
      return false
    }
    seen.add(key)
    return true
  })
}

// =============================================================================
// INTELLIGENT WARMUP SELECTION (Using Warm-Up Engine)
// =============================================================================

function selectIntelligentWarmup(
  mainExercises: SelectedExercise[],
  primaryGoal: PrimaryGoal,
  sessionMinutes: number,
  equipment: EquipmentType[]
): SelectedExercise[] {
  // Convert session minutes to SessionLength
  const sessionLength: SessionLength = 
    sessionMinutes <= 20 ? '10-20' as SessionLength :
    sessionMinutes <= 30 ? '20-30' as SessionLength :
    sessionMinutes <= 45 ? '30-45' as SessionLength :
    sessionMinutes <= 60 ? '45-60' as SessionLength :
    '60+' as SessionLength

  // TASK 4: Detect first main skill for progression-aware warm-up
  const firstSkillProgression = detectFirstSkillProgression(mainExercises, primaryGoal)

  // Build context for warm-up engine
  const warmupContext: WarmUpGenerationContext = {
    mainExercises: mainExercises.map(e => ({
      id: e.exercise.id,
      name: e.exercise.name,
      category: e.exercise.category,
      movementPattern: e.exercise.movementPattern,
      primaryMuscles: e.exercise.primaryMuscles,
      neuralDemand: e.exercise.neuralDemand,
    })),
    primaryGoal,
    sessionLength,
    equipment,
    // TASK 4: Pass first skill progression for warm-up ramping
    firstSkillProgression,
  }

  // Generate intelligent warm-up
  const generatedWarmup = generateWarmUp(warmupContext)

  // Convert to SelectedExercise format
  const selected: SelectedExercise[] = generatedWarmup.block.exercises.map(ex => {
    // Find matching exercise in pool or create a minimal exercise object
    const poolExercise = WARMUP_EXERCISES.find(e => e.id === ex.id)
    
    const exercise: Exercise = poolExercise || {
      id: ex.id,
      name: ex.name,
      category: 'warmup',
      movementPattern: ex.targetPattern[0] || 'skill',
      primaryMuscles: ex.targetMuscles,
      equipment: ex.equipment,
      neuralDemand: 1,
      fatigueCost: 1,
      transferTo: [],
      defaultSets: 1,
      defaultRepsOrTime: ex.reps,
    }

    return {
      exercise,
      sets: 1,
      repsOrTime: ex.reps,
      note: ex.notes,
      isOverrideable: true,
      selectionReason: generatedWarmup.block.rationale,
    }
  })

  return selected
}

// =============================================================================
// TASK 4: PROGRESSION-AWARE WARM-UP HELPERS
// =============================================================================

/**
 * Detect first skill progression from main exercises for warm-up ramping
 * TASK 4: Analyzes the first skill exercise to determine appropriate warm-up ramp
 */
function detectFirstSkillProgression(
  mainExercises: SelectedExercise[],
  primaryGoal: PrimaryGoal
): WarmUpGenerationContext['firstSkillProgression'] {
  // Find the first skill exercise (highest neural demand typically)
  const firstSkill = mainExercises.find(e => 
    e.exercise.category === 'skill' || e.exercise.neuralDemand >= 4
  )
  
  if (!firstSkill) {
    // No skill exercise, derive from primary goal
    const goalSkillMap: Record<string, WarmUpGenerationContext['firstSkillProgression']> = {
      'planche': { skillType: 'planche', progressionLevel: 'unknown', isAdvanced: false },
      'front_lever': { skillType: 'front_lever', progressionLevel: 'unknown', isAdvanced: false },
      'handstand_pushup': { skillType: 'hspu', progressionLevel: 'unknown', isAdvanced: false },
      'muscle_up': { skillType: 'muscle_up', progressionLevel: 'unknown', isAdvanced: false },
    }
    return goalSkillMap[primaryGoal] || undefined
  }
  
  const exerciseName = firstSkill.exercise.name.toLowerCase()
  const exerciseId = firstSkill.exercise.id.toLowerCase()
  
  // Detect skill type
  let skillType: 'planche' | 'front_lever' | 'hspu' | 'muscle_up' | 'handstand' | 'back_lever' | 'l_sit' | 'v_sit' | 'other' = 'other'
  
  if (exerciseName.includes('planche') || exerciseId.includes('planche')) {
    skillType = 'planche'
  } else if (exerciseName.includes('front lever') || exerciseId.includes('front_lever') || exerciseId.includes('fl_')) {
    skillType = 'front_lever'
  } else if (exerciseName.includes('hspu') || exerciseName.includes('handstand push') || exerciseId.includes('hspu')) {
    skillType = 'hspu'
  } else if (exerciseName.includes('muscle up') || exerciseId.includes('muscle_up')) {
    skillType = 'muscle_up'
  } else if (exerciseName.includes('handstand') || exerciseId.includes('handstand')) {
    skillType = 'handstand'
  } else if (exerciseName.includes('back lever') || exerciseId.includes('back_lever') || exerciseId.includes('bl_')) {
    skillType = 'back_lever'
  } else if (exerciseName.includes('l-sit') || exerciseName.includes('l sit') || exerciseId.includes('l_sit')) {
    skillType = 'l_sit'
  } else if (exerciseName.includes('v-sit') || exerciseName.includes('v sit') || exerciseId.includes('v_sit')) {
    skillType = 'v_sit'
  }
  
  // Detect if advanced progression
  const isAdvanced = 
    exerciseName.includes('straddle') ||
    exerciseName.includes('full') ||
    exerciseName.includes('one leg') ||
    exerciseName.includes('half lay') ||
    exerciseName.includes('advanced') ||
    (exerciseName.includes('tuck') && !exerciseName.includes('advanced tuck')) === false
  
  return {
    skillType,
    progressionLevel: exerciseName,
    isAdvanced,
  }
}

// Legacy warmup function (kept for backward compatibility)
function selectWarmupLegacy(
  emphasis: 'push' | 'pull' | 'mixed',
  equipment: EquipmentType[],
  minutes: number
): SelectedExercise[] {
  const available = WARMUP_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const selected: SelectedExercise[] = []
  
  // Always include wrist prep
  const wristWork = available.find(e => e.id === 'wrist_circles')
  if (wristWork) {
    selected.push({
      exercise: wristWork,
      sets: 1,
      repsOrTime: '10 each direction',
      isOverrideable: true,
      selectionReason: 'Wrist preparation',
    })
  }
  
  // Arm circles / general mobility
  const armCircles = available.find(e => e.id === 'arm_circles')
  if (armCircles) {
    selected.push({
      exercise: armCircles,
      sets: 1,
      repsOrTime: '10 each direction',
      isOverrideable: true,
      selectionReason: 'Shoulder mobility',
    })
  }
  
  // Movement-specific prep
  if (emphasis === 'pull' || emphasis === 'mixed') {
    const deadHang = available.find(e => e.id === 'dead_hang')
    const activeHang = available.find(e => e.id === 'active_hang')
    if (deadHang && minutes >= 7) {
      selected.push({
        exercise: deadHang,
        sets: 1,
        repsOrTime: '30s',
        isOverrideable: true,
        selectionReason: 'Grip and lat activation',
      })
    }
    if (activeHang && minutes >= 10) {
      selected.push({
        exercise: activeHang,
        sets: 2,
        repsOrTime: '15s',
        isOverrideable: true,
        selectionReason: 'Scap activation',
      })
    }
  }
  
  if (emphasis === 'push' || emphasis === 'mixed') {
    const scapPush = available.find(e => e.id === 'scap_pushup_warmup')
    if (scapPush && minutes >= 7) {
      selected.push({
        exercise: scapPush,
        sets: 2,
        repsOrTime: '10',
        isOverrideable: true,
        selectionReason: 'Serratus activation',
      })
    }
    
    const bandPull = available.find(e => e.id === 'band_pull_apart')
    if (bandPull && equipment.includes('bands') && minutes >= 10) {
      selected.push({
        exercise: bandPull,
        sets: 2,
        repsOrTime: '15',
        isOverrideable: true,
        selectionReason: 'Shoulder health prep',
      })
    }
  }
  
  return selected
}

// =============================================================================
// INTELLIGENT COOLDOWN SELECTION (Using Cool-Down Engine)
// =============================================================================

function selectIntelligentCooldown(
  mainExercises: SelectedExercise[],
  primaryGoal: PrimaryGoal,
  sessionMinutes: number,
  equipment: EquipmentType[],
  flexibilityGoals?: FlexibilityPathway[]
): SelectedExercise[] {
  // Convert session minutes to SessionLength
  const sessionLength: SessionLength = 
    sessionMinutes <= 20 ? '10-20' as SessionLength :
    sessionMinutes <= 30 ? '20-30' as SessionLength :
    sessionMinutes <= 45 ? '30-45' as SessionLength :
    sessionMinutes <= 60 ? '45-60' as SessionLength :
    '60+' as SessionLength

  // Build context for cool-down engine
  const cooldownContext: CoolDownGenerationContext = {
    mainExercises: mainExercises.map(e => ({
      id: e.exercise.id,
      name: e.exercise.name,
      category: e.exercise.category,
      movementPattern: e.exercise.movementPattern,
      primaryMuscles: e.exercise.primaryMuscles,
      neuralDemand: e.exercise.neuralDemand,
    })),
    primaryGoal,
    sessionLength,
    equipment,
    flexibilityGoals,
  }

  // Generate intelligent cool-down
  const generatedCooldown = generateCoolDown(cooldownContext)

  // Convert to SelectedExercise format
  const selected: SelectedExercise[] = []

  // Add cool-down exercises
  generatedCooldown.block.exercises.forEach(ex => {
    // Find matching exercise in pool or create a minimal exercise object
    const poolExercise = COOLDOWN_EXERCISES.find(e => e.id === ex.id)
    
    const exercise: Exercise = poolExercise || {
      id: ex.id,
      name: ex.name,
      category: 'cooldown',
      movementPattern: ex.targetPattern[0] || 'skill',
      primaryMuscles: ex.targetMuscles,
      equipment: ex.equipment,
      neuralDemand: 1,
      fatigueCost: 1,
      transferTo: [],
      defaultSets: 1,
      defaultRepsOrTime: ex.duration,
    }

    selected.push({
      exercise,
      sets: 1,
      repsOrTime: ex.duration,
      note: ex.notes,
      isOverrideable: true,
      selectionReason: generatedCooldown.block.rationale,
    })
  })

  // Add flexibility exercises if included
  if (generatedCooldown.flexibilityBlock) {
    generatedCooldown.flexibilityBlock.exercises.forEach(ex => {
      const poolExercise = COOLDOWN_EXERCISES.find(e => e.id === ex.id)
      
      const exercise: Exercise = poolExercise || {
        id: ex.id,
        name: ex.name,
        category: 'cooldown',
        movementPattern: ex.targetPattern[0] || 'compression',
        primaryMuscles: ex.targetMuscles,
        equipment: ex.equipment,
        neuralDemand: 1,
        fatigueCost: 1,
        transferTo: [],
        defaultSets: 1,
        defaultRepsOrTime: ex.duration,
      }

      selected.push({
        exercise,
        sets: 1,
        repsOrTime: ex.duration,
        note: ex.notes,
        isOverrideable: true,
        selectionReason: generatedCooldown.flexibilityBlock?.rationale || 'Flexibility exposure',
      })
    })
  }

  return selected
}

// Legacy cooldown function (kept for backward compatibility)
function selectCooldownLegacy(minutes: number): SelectedExercise[] {
  const selected: SelectedExercise[] = []
  
  // Always include shoulder stretch
  selected.push({
    exercise: COOLDOWN_EXERCISES.find(e => e.id === 'shoulder_stretch')!,
    sets: 1,
    repsOrTime: '30s each',
    isOverrideable: true,
    selectionReason: 'Shoulder recovery',
  })
  
  // Wrist stretches
  if (minutes >= 5) {
    selected.push({
      exercise: COOLDOWN_EXERCISES.find(e => e.id === 'wrist_stretches')!,
      sets: 1,
      repsOrTime: '30s each position',
      isOverrideable: true,
      selectionReason: 'Wrist care for calisthenics',
    })
  }
  
  // Additional stretches for longer cooldowns
  if (minutes >= 8) {
    selected.push({
      exercise: COOLDOWN_EXERCISES.find(e => e.id === 'lat_stretch')!,
      sets: 1,
      repsOrTime: '30s each',
      isOverrideable: true,
      selectionReason: 'Lat recovery',
    })
    
    selected.push({
      exercise: COOLDOWN_EXERCISES.find(e => e.id === 'chest_stretch')!,
      sets: 1,
      repsOrTime: '30s each',
      isOverrideable: true,
      selectionReason: 'Chest/front delt recovery',
    })
  }
  
  return selected
}

// =============================================================================
// HELPERS
// =============================================================================

function selectByLevel(exercises: Exercise[], level: ExperienceLevel): Exercise | undefined {
  // Sort by neural demand
  const sorted = [...exercises].sort((a, b) => a.neuralDemand - b.neuralDemand)
  
  if (level === 'beginner') {
    return sorted[0] // Easiest
  }
  if (level === 'intermediate') {
    return sorted[Math.floor(sorted.length / 2)] // Middle
  }
  // Advanced - hardest
  return sorted[sorted.length - 1]
}

function adjustSetsForLevel(defaultSets: number, level: ExperienceLevel): number {
  if (level === 'beginner') return Math.max(2, defaultSets - 1)
  if (level === 'advanced') return Math.min(5, defaultSets + 1)
  return defaultSets
}
  
function adjustRepsForLevel(defaultReps: string, level: ExperienceLevel): string {
  // Keep reps as-is for now, could be refined
  return defaultReps
}

/**
 * Envelope-aware set adjustment
 * Uses performance envelope data to personalize set count
 */
function adjustSetsWithEnvelope(
  defaultSets: number, 
  level: ExperienceLevel,
  envelope: PerformanceEnvelope | undefined,
  movementFamily: MovementFamily | undefined
): number {
  // Start with level-based adjustment
  let sets = adjustSetsForLevel(defaultSets, level)
  
  // If no envelope or low confidence, use default
  if (!envelope || envelope.confidenceScore < 0.3) {
    return sets
  }
  
  // Check if this envelope matches the movement family
  if (movementFamily && envelope.movementFamily !== movementFamily) {
    return sets
  }
  
  // High confidence envelope - use learned preferences
  if (envelope.confidenceScore >= 0.5) {
    // Use the envelope's preferred set range
    const envelopeMin = envelope.preferredSetRangeMin
    const envelopeMax = envelope.preferredSetRangeMax
    
    // Clamp to envelope range, respecting reasonable bounds
    sets = Math.max(envelopeMin, Math.min(envelopeMax, sets))
  }
  
  // Moderate confidence - blend toward envelope preference
  else if (envelope.confidenceScore >= 0.3) {
    const envelopeMidpoint = (envelope.preferredSetRangeMin + envelope.preferredSetRangeMax) / 2
    // Blend 40% toward envelope preference
    sets = Math.round(sets * 0.6 + envelopeMidpoint * 0.4)
  }
  
  return Math.max(2, Math.min(6, sets))
}

/**
 * Envelope-aware rep adjustment
 * Uses performance envelope data to personalize rep ranges
 */
function adjustRepsWithEnvelope(
  defaultReps: string, 
  level: ExperienceLevel,
  envelope: PerformanceEnvelope | undefined,
  movementFamily: MovementFamily | undefined,
  goalType: 'strength' | 'skill' | 'hypertrophy' | 'endurance' = 'strength'
): string {
  // If no envelope or low confidence, use default
  if (!envelope || envelope.confidenceScore < 0.3) {
    return adjustRepsForLevel(defaultReps, level)
  }
  
  // Check if this envelope matches the movement family and goal
  if (movementFamily && envelope.movementFamily !== movementFamily) {
    return adjustRepsForLevel(defaultReps, level)
  }
  if (envelope.goalType !== goalType) {
    return adjustRepsForLevel(defaultReps, level)
  }
  
  // High confidence envelope - use learned rep range
  if (envelope.confidenceScore >= 0.5) {
    const repMin = envelope.preferredRepRangeMin
    const repMax = envelope.preferredRepRangeMax
    
    // Return envelope-based rep range
    return `${repMin}-${repMax}`
  }
  
  // Moderate confidence - keep original but note envelope suggestion
  return adjustRepsForLevel(defaultReps, level)
}

/**
 * Find matching envelope for a movement pattern
 */
function findEnvelopeForMovement(
  envelopes: PerformanceEnvelope[] | undefined,
  movementPattern: string | undefined,
  goalType: 'strength' | 'skill' | 'hypertrophy' | 'endurance' = 'strength'
): PerformanceEnvelope | undefined {
  if (!envelopes || !movementPattern) return undefined
  
  // Map movement pattern to movement family
  const patternToFamily: Record<string, MovementFamily> = {
    'vertical_pull': 'vertical_pull',
    'horizontal_pull': 'horizontal_pull',
    'vertical_push': 'vertical_push',
    'horizontal_push': 'horizontal_push',
    'straight_arm_pull': 'straight_arm_pull',
    'straight_arm_push': 'straight_arm_push',
    'core': 'compression_core',
    'hip_hinge': 'hip_hinge',
    'squat': 'squat',
  }
  
  const family = patternToFamily[movementPattern]
  if (!family) return undefined
  
  // Find envelope matching family and goal type
  return envelopes.find(e => 
    e.movementFamily === family && 
    e.goalType === goalType &&
    e.confidenceScore >= 0.3
  )
}

function getConstraintTargetedExercise(
  constraintType: string,
  strength: Exercise[],
  accessory: Exercise[],
  usedIds: Set<string>
): Exercise | undefined {
  const all = [...strength, ...accessory].filter(e => !usedIds.has(e.id))
  
  if (constraintType.includes('pull') || constraintType.includes('horizontal')) {
    return all.find(e => e.movementPattern === 'horizontal_pull') ||
           all.find(e => e.movementPattern === 'vertical_pull')
  }
  
  if (constraintType.includes('push')) {
    return all.find(e => e.movementPattern === 'horizontal_push') ||
           all.find(e => e.movementPattern === 'vertical_push')
  }
  
  return undefined
}

function calculateTotalTime(
  warmup: SelectedExercise[],
  main: SelectedExercise[],
  cooldown: SelectedExercise[]
): number {
  // Rough estimate: warmup ~5-10 min, main ~3-5 min per exercise, cooldown ~5 min
  const warmupTime = warmup.length * 2
  const mainTime = main.reduce((sum, e) => {
    // Skill work takes longer (rest between attempts)
    if (e.exercise.category === 'skill') return sum + 6
    // Strength work
    if (e.exercise.category === 'strength') return sum + 5
    // Accessory/core
    return sum + 4
  }, 0)
  const cooldownTime = cooldown.length * 1.5
  
  return Math.round(warmupTime + mainTime + cooldownTime)
}

// =============================================================================
// PROGRESSION-AWARE EXERCISE ADAPTATION
// =============================================================================

/**
 * Adapt an exercise based on athlete level and fatigue
 * Returns the adapted exercise or the original if no adaptation needed
 */
export function adaptExerciseForAthlete(
  exercise: Exercise,
  athleteLevel: DifficultyLevel = 'intermediate',
  fatigueLevel: 'low' | 'moderate' | 'high' = 'moderate',
  equipment: EquipmentType[]
): { exercise: Exercise; wasAdapted: boolean; adaptationReason?: string } {
  const allExercises = getAllExercises()
  
  // Get the adapted exercise ID
  const adaptedId = getAdaptedExercise(exercise.id, athleteLevel, fatigueLevel)
  
  // If no change, return original
  if (adaptedId === exercise.id) {
    return { exercise, wasAdapted: false }
  }
  
  // Find the adapted exercise
  const adaptedExercise = allExercises.find(e => e.id === adaptedId)
  
  // Verify equipment is available
  if (adaptedExercise && hasRequiredEquipment(adaptedExercise, equipment)) {
    const reason = fatigueLevel === 'high' 
      ? 'Regressed due to high fatigue'
      : adaptedId === getProgressionUp(exercise.id)
        ? 'Progressed based on athlete level'
        : 'Adjusted for athlete level'
    
    return { 
      exercise: adaptedExercise, 
      wasAdapted: true,
      adaptationReason: reason
    }
  }
  
  return { exercise, wasAdapted: false }
}

/**
 * Get a substitute exercise when the primary cannot be performed
 */
export function getSubstituteExercise(
  exercise: Exercise,
  reason: 'fatigue' | 'equipment' | 'difficulty',
  equipment: EquipmentType[],
  usedIds: Set<string>
): { exercise: Exercise; reason: string } | null {
  const allExercises = getAllExercises()
  
  // Determine preferred fatigue adjustment based on reason
  const preferredFatigue = reason === 'fatigue' ? 'easier' : 'similar'
  
  // First try substitution mapping
  const substitute = getBestSubstitute(exercise.id, preferredFatigue)
  if (substitute) {
    const subExercise = allExercises.find(e => e.id === substitute.exerciseId)
    if (subExercise && 
        hasRequiredEquipment(subExercise, equipment) && 
        !usedIds.has(subExercise.id)) {
      return { 
        exercise: subExercise, 
        reason: substitute.reason 
      }
    }
  }
  
  // Try progression regression
  if (reason === 'difficulty' || reason === 'fatigue') {
    const regression = getProgressionDown(exercise.id)
    if (regression) {
      const regExercise = allExercises.find(e => e.id === regression)
      if (regExercise && 
          hasRequiredEquipment(regExercise, equipment) && 
          !usedIds.has(regExercise.id)) {
        return { 
          exercise: regExercise, 
          reason: 'Ladder regression' 
        }
      }
    }
  }
  
  // Fall back to same movement pattern
  const patternMatch = allExercises.find(e => 
    e.movementPattern === exercise.movementPattern &&
    e.id !== exercise.id &&
    hasRequiredEquipment(e, equipment) &&
    !usedIds.has(e.id) &&
    (e.fatigueCost || 3) <= (exercise.fatigueCost || 3)
  )
  
  if (patternMatch) {
    return { 
      exercise: patternMatch, 
      reason: 'Same movement pattern' 
    }
  }
  
  return null
}

/**
 * Upgrade an exercise when athlete is ready to progress
 */
export function getProgressionExercise(
  exercise: Exercise,
  equipment: EquipmentType[]
): { exercise: Exercise; reason: string } | null {
  const allExercises = getAllExercises()
  const progressionId = getProgressionUp(exercise.id)
  
  if (progressionId) {
    const progressionExercise = allExercises.find(e => e.id === progressionId)
    if (progressionExercise && hasRequiredEquipment(progressionExercise, equipment)) {
      const ladder = getExerciseLadder(exercise.id)
      return { 
        exercise: progressionExercise, 
        reason: ladder ? `Progress in ${ladder.ladderName}` : 'Progression' 
      }
    }
  }
  
  return null
}

/**
 * Smart progression exercise selection based on performance data.
 * Uses the Progression Decision Engine to determine if exercise should
 * progress, maintain, or regress based on actual performance.
 * 
 * This is the performance-based entry point that respects:
 * - Recent rep/hold performance
 * - RPE data
 * - Fatigue state
 * - Consistency requirements (2-3 successful sessions)
 */
export function getSmartProgressionExercise(
  exercise: Exercise,
  equipment: EquipmentType[],
  targetRange?: { min: number; max: number }
): { 
  exercise: Exercise
  reason: string
  decision: ProgressionDecision
  confidence: number 
} | null {
  const allExercises = getAllExercises()
  
  // Evaluate progression decision based on performance data
  const isIsometric = exercise.category === 'skill' && 
    (exercise.defaultRepsOrTime?.includes('s') || 
     exercise.id.includes('hold') ||
     exercise.id.includes('lever') ||
     exercise.id.includes('planche') ||
     exercise.id.includes('l_sit'))
  
  const evaluation = evaluateExerciseProgression(
    exercise.id,
    exercise.name,
    targetRange,
    isIsometric
  )
  
  // Handle based on decision
  switch (evaluation.decision) {
    case 'progress': {
      const progressionId = getProgressionUp(exercise.id)
      if (progressionId) {
        const progressionExercise = allExercises.find(e => e.id === progressionId)
        if (progressionExercise && hasRequiredEquipment(progressionExercise, equipment)) {
          const ladder = getExerciseLadder(exercise.id)
          return {
            exercise: progressionExercise,
            reason: evaluation.reasoning || (ladder ? `Progress in ${ladder.ladderName}` : 'Ready to progress'),
            decision: 'progress',
            confidence: evaluation.confidence,
          }
        }
      }
      // If no progression available, maintain
      return {
        exercise,
        reason: 'At top of progression - maintaining current level',
        decision: 'maintain',
        confidence: evaluation.confidence,
      }
    }
    
    case 'regress': {
      const regressionId = getProgressionDown(exercise.id)
      if (regressionId) {
        const regressionExercise = allExercises.find(e => e.id === regressionId)
        if (regressionExercise && hasRequiredEquipment(regressionExercise, equipment)) {
          return {
            exercise: regressionExercise,
            reason: evaluation.reasoning || 'Stepping back to build strength',
            decision: 'regress',
            confidence: evaluation.confidence,
          }
        }
      }
      // If no regression available, maintain with note
      return {
        exercise,
        reason: 'Consider adding band assistance or reducing volume',
        decision: 'maintain',
        confidence: evaluation.confidence,
      }
    }
    
    case 'maintain':
    default:
      return {
        exercise,
        reason: evaluation.reasoning || 'Building consistency at current level',
        decision: 'maintain',
        confidence: evaluation.confidence,
      }
  }
}

/**
 * Batch evaluate progressions for a list of exercises.
 * Returns exercises with their progression recommendations.
 */
export function evaluateSessionProgressions(
  exercises: SelectedExercise[],
  equipment: EquipmentType[]
): Array<{
  original: SelectedExercise
  recommended: Exercise
  decision: ProgressionDecision
  reason: string
  confidence: number
}> {
  const results: Array<{
    original: SelectedExercise
    recommended: Exercise
    decision: ProgressionDecision
    reason: string
    confidence: number
  }> = []
  
  for (const selected of exercises) {
    // Only evaluate skill and strength exercises
    if (selected.exercise.category !== 'skill' && 
        selected.exercise.category !== 'strength') {
      results.push({
        original: selected,
        recommended: selected.exercise,
        decision: 'maintain',
        reason: 'Non-progression exercise',
        confidence: 1,
      })
      continue
    }
    
    const smartResult = getSmartProgressionExercise(selected.exercise, equipment)
    
    if (smartResult) {
      results.push({
        original: selected,
        recommended: smartResult.exercise,
        decision: smartResult.decision,
        reason: smartResult.reason,
        confidence: smartResult.confidence,
      })
    } else {
      results.push({
        original: selected,
        recommended: selected.exercise,
        decision: 'maintain',
        reason: 'No progression data available',
        confidence: 0.5,
      })
    }
  }
  
  return results
}

/**
 * Adapt a full session's exercises based on fatigue
 */
export function adaptSessionForFatigue(
  exercises: SelectedExercise[],
  fatigueLevel: 'low' | 'moderate' | 'high',
  equipment: EquipmentType[]
): SelectedExercise[] {
  if (fatigueLevel === 'low') return exercises
  
  const usedIds = new Set<string>()
  
  return exercises.map(selected => {
    usedIds.add(selected.exercise.id)
    
    // Only adapt skill and strength exercises when fatigued
    if (fatigueLevel === 'high' && 
        (selected.exercise.category === 'skill' || selected.exercise.category === 'strength')) {
      const substitute = getSubstituteExercise(
        selected.exercise,
        'fatigue',
        equipment,
        usedIds
      )
      
      if (substitute) {
        usedIds.add(substitute.exercise.id)
        return {
          ...selected,
          exercise: substitute.exercise,
          selectionReason: `${selected.selectionReason} (adapted: ${substitute.reason})`,
          note: selected.note ? `${selected.note} - Fatigue adaptation` : 'Fatigue adaptation',
        }
      }
    }
    
    // For moderate fatigue, just reduce intensity
    if (fatigueLevel === 'moderate' && selected.exercise.category === 'skill') {
      return {
        ...selected,
        sets: Math.max(2, selected.sets - 1),
        note: selected.note ? `${selected.note} - Reduced volume` : 'Reduced volume for recovery',
      }
    }
    
    return selected
  })
}
