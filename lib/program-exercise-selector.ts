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
import {
  detectPrescriptionMode,
  resolvePrescription,
  formatPrescription,
  getAdvancedSkillPrescription,
  getWeeklyProgressionRecommendation,
  determineProgressionPhase,
  mapSupportToGoalsAndLimiters,
  logSupportWorkMapping,
  logPrescriptionDiagnostics,
  estimateWeightedLoadPrescription,
  determineWeightedPrescriptionMode,
  formatWeightedLoadDisplay,
  logWeightedLoadEstimation,
  type PrescriptionMode,
  type PrescriptionContract,
  type AthleteContext as PrescriptionAthleteContext,
  type AdvancedSkillPrescription,
  type WeeklyProgressionContext,
  type WeeklyProgressionRecommendation,
  type ProgressionPhase,
  type SupportWorkMapping,
  type WeightedBenchmark,
  type WeightedPRBenchmark,
  type WeightedLoadPrescription,
  type WeightedPrescriptionMode,
} from './prescription-contract'
import {
  SKILL_SUPPORT_MAPPINGS,
  getSupportMapping,
  getDirectSupportExercises,
  type SkillSupportMapping,
  getAdvancedSkillSupport,
  isExercisePrimarySupportFor,
  getAllSupportExercisesFor,
  ADVANCED_SKILL_SUPPORT_PATTERNS,
} from './doctrine/skill-support-mappings'
// [PHASE 4] Doctrine DB exercise scoring integration
import {
  scoreExercisesWithDoctrine,
  applyDoctrineScoringToRankedCandidates,
  getDoctrineInfluenceSummary,
  // Synchronous scoring with pre-cached rules
  prefetchDoctrineRules,
  getCachedDoctrineRules,
  scoreExercisesWithDoctrineSync,
  applyDoctrineScoringSyncAndSort,
  type DoctrineScoreContext,
  type DoctrineScoreResult,
  type DoctrineScoringAudit,
  type CachedDoctrineRules,
} from './doctrine-exercise-scorer'
import {
  // Runtime exports
  getSkillPrescriptionRules,
  getWeightedStrengthCarryover,
  isAdvancedSkill,
  getAdvancedSkillFamily,
  ADVANCED_SKILL_FAMILIES,
  createMinimalTrace,
  logExerciseTrace,
  logSessionTrace,
  // Type exports
  type SkillPrescriptionRules,
  type WeightedStrengthCarryover,
  type ExerciseSelectionTrace,
  type ExerciseSelectionReason,
  type TraceExpressionMode,
  type TraceSessionRole,
  type WeightedDecisionTrace,
  type WeightedBlockerReason,
  type RejectedAlternative,
  type RejectionReason,
  type DoctrineSourceTrace,
  type SessionSelectionTrace,
  type SkillExpressionMode,
} from './engine-quality-contract'
import {
  hasLoadableEquipment,
  checkWeightedPrescriptionEligibility,
} from './canonical-profile-service'

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
  // Weighted Load Prescription fields (TASK 3 of Weighted Load PR)
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
  targetRPE?: number          // Target RPE (7-9 typical for strength, 5-7 for mobility)
  restSeconds?: number        // Recommended rest in seconds
  // [weighted-truth] TASK F: No-load reason contract for explicit fallback tracking
  noLoadReason?: 'no_loadable_equipment' | 'missing_strength_inputs' | 'exercise_not_load_eligible' | 
                 'low_confidence_estimate_blocked' | 'doctrine_prefers_bodyweight' | 'skill_day_non_loaded_variant' |
                 'support_day_volume_bias' | 'assisted_variant_selected' | 'recovery_session_role' | 
                 'fallback_after_validation' | null
  // [exercise-trace] TASK 2: Full selection traceability
  selectionTrace?: ExerciseSelectionTrace
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
  // [exercise-trace] TASK 5: Session-level trace summary
  sessionTrace?: {
    sessionRole: 'primary_focus' | 'secondary_focus' | 'mixed' | 'support_heavy' | 'recovery'
    primarySkillExpressed: string | null
    secondarySkillExpressed: string | null
    exerciseCount: number
    weightedExerciseCount: number
    doctrineHitCount: number
    rejectedAlternativeCount: number
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
  // WEIGHTED LOAD PR: Weighted exercise benchmarks for load prescription
  weightedBenchmarks?: {
  weightedPullUp?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  weightedDip?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  }
  // SKILL EXPRESSION FIX: Selected skills and per-session allocation
  selectedSkills?: string[]
  skillsForSession?: Array<{
  skill: string
  expressionMode: 'primary' | 'technical' | 'support' | 'warmup'
  weight: number
  }>
  // [PHASE-MATERIALITY] Current working progressions for authoritative prescription
  currentWorkingProgressions?: Record<string, {
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  truthSource: string
  isConservative: boolean
  }> | null
  // [PHASE-MATERIALITY] Material skill intent from contract
  materialSkillIntent?: Array<{
  skill: string
  role: 'primary_spine' | 'secondary_anchor' | 'support' | 'deferred'
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  }>
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
  // WEIGHTED LOAD PR: Extract weighted benchmarks for load prescription
  weightedBenchmarks,
  // SKILL EXPRESSION FIX: Extract skill allocation for session expression
  selectedSkills,
  skillsForSession,
  // [PHASE-MATERIALITY] Extract current working progressions
  currentWorkingProgressions,
  // [PHASE-MATERIALITY] Extract material skill intent
  materialSkillIntent,
  } = inputs
  
  // SKILL EXPRESSION FIX: Log skill allocation for this session
  if (skillsForSession && skillsForSession.length > 0) {
    const sessionSkillLabels = skillsForSession.map(function(s) {
      return s.skill + '(' + s.expressionMode + ')';
    });
    console.log('[skill-expression] Exercise selector received skills for session:', {
      dayFocus: day.focus,
      skillsForSession: sessionSkillLabels,
      selectedSkillsCount: selectedSkills?.length || 0,
    });
  }
  
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
  
  // [PHASE 3] Equipment collapse truth audit
  const equipmentCollapsedSkills = SKILL_EXERCISES.length - availableSkills.length
  const equipmentCollapsedStrength = STRENGTH_EXERCISES.length - availableStrength.length
  const totalCandidatesBeforeEquipment = SKILL_EXERCISES.length + STRENGTH_EXERCISES.length + ACCESSORY_EXERCISES.length + CORE_EXERCISES_POOL.length
  const totalCandidatesAfterEquipment = availableSkills.length + availableStrength.length + availableAccessory.length + availableCore.length
  
  console.log('[equipment-collapse-truth]', {
    equipmentProvided: equipment,
    totalCandidatesBeforeFiltering: totalCandidatesBeforeEquipment,
    totalCandidatesAfterEquipmentFiltering: totalCandidatesAfterEquipment,
    collapsedByEquipment: totalCandidatesBeforeEquipment - totalCandidatesAfterEquipment,
    skillsCollapsed: equipmentCollapsedSkills,
    strengthCollapsed: equipmentCollapsedStrength,
    remainingSkillPool: availableSkills.length,
    remainingStrengthPool: availableStrength.length,
    verdict: totalCandidatesAfterEquipment === 0 
      ? 'equipment_filtered_all_candidates' 
      : totalCandidatesAfterEquipment < 10 
        ? 'equipment_severely_limited_pool'
        : 'equipment_filtering_acceptable',
  })
  
  // [exercise-expression] ISSUE A: Pass skillsForSession to enable multi-skill expression
  // TASK 1-B: Pass weightedBenchmarks to fix ReferenceError in selectMainExercises
  // [PHASE 4 HOTFIX] Pass jointCautions for doctrine context
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
  prerequisiteContext,
  skillsForSession,  // TASK 2: Skill allocations for expression-aware selection
  selectedSkills,    // Full selected skills list for reference
  equipment,         // Equipment for doctrine lookups
  weightedBenchmarks, // TASK 1-B: Weighted benchmark data for load prescription
  jointCautions,     // [PHASE 4 HOTFIX] Joint cautions for doctrine scoring
  currentWorkingProgressions, // [PHASE-MATERIALITY] Current working progressions
  materialSkillIntent // [PHASE-MATERIALITY] Material skill intent
  )
  
  // [session-assembly] ISSUE C: Validate main exercises before proceeding
  if (main.length === 0) {
    console.error('[session-assembly] CRITICAL: selectMainExercises returned empty array', {
      dayFocus: day.focus,
      primaryGoal,
      experienceLevel,
      sessionMinutes,
    })
    // Don't throw here - let the session assembly validation catch it
    // But log extensively for diagnosis
  }
  
  console.log('[session-assembly] Main exercise selection complete:', {
    exerciseCount: main.length,
    dayFocus: day.focus,
    primaryGoal,
  })
  
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
  
  // [prescription] TASK 7: Log weighted exercises with prescriptions for debugging
  var weightedWithLoads = main.filter(function(e) { return e.prescribedLoad && e.prescribedLoad.load > 0; });
  if (weightedWithLoads.length > 0) {
    var weightedLogItems = [];
    for (var i = 0; i < weightedWithLoads.length; i++) {
      var we = weightedWithLoads[i];
      weightedLogItems.push({
        id: we.exercise.id,
        load: '+' + (we.prescribedLoad?.load || 0) + ' ' + (we.prescribedLoad?.unit || ''),
        basis: we.prescribedLoad?.basis,
        confidence: we.prescribedLoad?.confidenceLevel,
      });
    }
    var skillsList = [];
    if (skillsForSession) {
      for (var j = 0; j < skillsForSession.length; j++) {
        skillsList.push(skillsForSession[j].skill);
      }
    }
    console.log('[prescription] Session weighted exercise prescriptions:', {
      dayFocus: day.focus,
      exercises: weightedLogItems,
      skillsExpressed: skillsList,
    });
  }
  
  var weightedExerciseCount = 0;
  var doctrineHitCount = 0;
  var rejectedCount = 0;
  for (var wi = 0; wi < main.length; wi++) {
    if (main[wi].prescribedLoad && main[wi].prescribedLoad.load > 0) {
      weightedExerciseCount++;
    }
    if (main[wi].selectionTrace && main[wi].selectionTrace.doctrineSource !== null) {
      doctrineHitCount++;
    }
    if (main[wi].selectionTrace && main[wi].selectionTrace.rejectedAlternatives) {
      rejectedCount = rejectedCount + main[wi].selectionTrace.rejectedAlternatives.length;
    }
  }

  var sessionRole: 'primary_focus' | 'recovery' | 'mixed' | 'support_heavy' = 'support_heavy';
  if (day.focus === 'skill' || day.focus === 'push_skill' || day.focus === 'pull_skill') {
    sessionRole = 'primary_focus';
  } else if (day.focus === 'support_recovery') {
    sessionRole = 'recovery';
  } else if (day.focus === 'mixed_upper') {
    sessionRole = 'mixed';
  }

  var primarySkillExpressed = primaryGoal;
  var secondarySkillExpressed: string | null = null;
  if (skillsForSession) {
    for (var si = 0; si < skillsForSession.length; si++) {
      if (skillsForSession[si].expressionMode === 'primary') {
        primarySkillExpressed = skillsForSession[si].skill;
      }
      if (skillsForSession[si].expressionMode === 'technical') {
        secondarySkillExpressed = skillsForSession[si].skill;
      }
    }
  }

  var sessionTraceResult = {
    sessionRole: sessionRole,
    primarySkillExpressed: primarySkillExpressed,
    secondarySkillExpressed: secondarySkillExpressed,
    exerciseCount: main.length,
    weightedExerciseCount: weightedExerciseCount,
    doctrineHitCount: doctrineHitCount,
    rejectedAlternativeCount: rejectedCount,
  };
  
  var directExpressionNames = [];
  var technicalExpressionNames = [];
  var supportExpressionNames = [];
  var weightedExpressionNames = [];
  for (var idx = 0; idx < main.length; idx++) {
    var ex = main[idx];
    var trace = ex.selectionTrace;
    if (trace) {
      if (trace.expressionMode === 'direct_intensity' || trace.sessionRole === 'skill_primary') {
        directExpressionNames.push(ex.name);
      }
      if (trace.expressionMode === 'technical_focus' || trace.sessionRole === 'skill_secondary') {
        technicalExpressionNames.push(ex.name);
      }
      if (trace.expressionMode === 'strength_support' || trace.sessionRole === 'strength_support') {
        supportExpressionNames.push(ex.name);
      }
    }
    if (ex.prescribedLoad && ex.prescribedLoad.load) {
      weightedExpressionNames.push(ex.name + '@' + ex.prescribedLoad.load + (ex.prescribedLoad.unit || ''));
    }
  }
  var skillExpressionSummary = {
    directExpressions: directExpressionNames,
    technicalExpressions: technicalExpressionNames,
    supportExpressions: supportExpressionNames,
    weightedExpressions: weightedExpressionNames,
  };
  console.log('[selected-skill-exposure] Session skill expression summary:', {
    dayFocus: day.focus,
    primarySkill: sessionTraceResult.primarySkillExpressed,
    secondarySkill: sessionTraceResult.secondarySkillExpressed,
    directExpressions: skillExpressionSummary.directExpressions,
    technicalExpressions: skillExpressionSummary.technicalExpressions,
    supportExpressions: skillExpressionSummary.supportExpressions,
    weightedExpressions: skillExpressionSummary.weightedExpressions,
  });

  var doctrineBackedCount = 0;
  var skillAlignedCount = 0;
  for (var k = 0; k < main.length; k++) {
    if (main[k].selectionTrace && main[k].selectionTrace.doctrineSource !== null) {
      doctrineBackedCount++;
    }
    if (main[k].selectionTrace && main[k].selectionTrace.influencingSkills && main[k].selectionTrace.influencingSkills.length > 0) {
      skillAlignedCount++;
    }
  }
  
  if (doctrineBackedCount === 0 && skillAlignedCount < 2 && main.length >= 4) {
    var exerciseNameList = [];
    for (var m = 0; m < Math.min(main.length, 5); m++) {
      exerciseNameList.push(main[m].name);
    }
    console.warn('[generic-shell-detect] WARNING: Session may be too generic - no doctrine hits, few skill alignments', {
      dayFocus: day.focus,
      exerciseCount: main.length,
      doctrineBackedCount: doctrineBackedCount,
      skillAlignedCount: skillAlignedCount,
      exercises: exerciseNameList,
    });
  }

  var skillsExpressedLabel = primaryGoal;
  if (skillsForSession && skillsForSession.length > 0) {
    var labelParts = [];
    for (var n = 0; n < skillsForSession.length; n++) {
      labelParts.push(skillsForSession[n].skill + '(' + skillsForSession[n].expressionMode + ')');
    }
    skillsExpressedLabel = labelParts.join(', ');
  }
  console.log('[exercise-trace] SESSION COMPLETE:', {
    dayFocus: day.focus,
    exerciseCount: main.length,
    weightedCount: weightedExerciseCount,
    doctrineHits: doctrineHitCount,
    rejected: rejectedCount,
    skillsExpressed: skillsExpressedLabel,
  });
  
  // ==========================================================================
  // [session-assembly-truth] TASK 6: EXERCISE RANKING BIAS AUDIT
  // Detects if ranking crushes tertiary selected skills
  // ==========================================================================
  var selectedSkillsInSession = selectedSkills || [];
  var topRankedSkillsFromExercises = [];
  var droppedSelectedSkills = [];
  var supportSlotsAvailable = main.filter(function(e) {
    return e.selectionTrace && (
      e.selectionTrace.sessionRole === 'strength_support' ||
      e.selectionTrace.sessionRole === 'accessory' ||
      e.selectionTrace.expressionMode === 'strength_support'
    );
  }).length;
  var supportSlotsUsedForSelectedSkills = 0;
  
  // Identify which selected skills got exercises
  for (var ri = 0; ri < main.length; ri++) {
    var exTrace = main[ri].selectionTrace;
    if (exTrace && exTrace.influencingSkills && exTrace.influencingSkills.length > 0) {
      for (var rj = 0; rj < exTrace.influencingSkills.length; rj++) {
        var influencingSkill = exTrace.influencingSkills[rj].skillId;
        if (topRankedSkillsFromExercises.indexOf(influencingSkill) === -1) {
          topRankedSkillsFromExercises.push(influencingSkill);
        }
        if (selectedSkillsInSession.indexOf(influencingSkill) !== -1 &&
            (exTrace.sessionRole === 'strength_support' || exTrace.sessionRole === 'accessory')) {
          supportSlotsUsedForSelectedSkills++;
        }
      }
    }
  }
  
  // Identify dropped selected skills
  for (var rk = 0; rk < selectedSkillsInSession.length; rk++) {
    var selSkill = selectedSkillsInSession[rk];
    if (topRankedSkillsFromExercises.indexOf(selSkill) === -1) {
      droppedSelectedSkills.push(selSkill);
    }
  }
  
  var rankingBiasDetected = droppedSelectedSkills.length > Math.ceil(selectedSkillsInSession.length / 2);
  
  console.log('[exercise-ranking-bias-audit]', {
    dayFocus: day.focus,
    selectedSkillCount: selectedSkillsInSession.length,
    topRankedSkills: topRankedSkillsFromExercises,
    droppedSelectedSkills: droppedSelectedSkills,
    rankingBiasDetected: rankingBiasDetected,
    supportSlotsAvailable: supportSlotsAvailable,
    supportSlotsUsedForSelectedSkills: supportSlotsUsedForSelectedSkills,
    finalVerdict: droppedSelectedSkills.length === 0
      ? 'all_selected_skills_represented'
      : droppedSelectedSkills.length <= 1
        ? 'minor_skill_gap_acceptable'
        : rankingBiasDetected
          ? 'ranking_bias_crushing_tertiary_skills'
          : 'moderate_skill_gap_for_capacity',
  });
  
  // BUILD-HOTFIX: balanced module structure and restored valid EOF closure
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
    // [exercise-trace] TASK 5: Attach session trace
    sessionTrace: sessionTraceResult,
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
// [advanced-skill-expression] ISSUE A/D: ADVANCED SKILL EXPRESSION HELPERS
// =============================================================================

/**
 * Identifies exercises that should be included based on advanced skill expression.
 * [advanced-skill-expression] ISSUE A: Ensures advanced skills get direct expression.
 */
function getAdvancedSkillExercises(
  skillsForSession: Array<{ skill: string; expressionMode: string; weight: number }> | undefined,
  availableSkills: Exercise[],
  availableStrength: Exercise[],
  dayFocus: string
): { exerciseId: string; reason: string; priority: number }[] {
  if (!skillsForSession || skillsForSession.length === 0) {
    return []
  }

  const recommendations: { exerciseId: string; reason: string; priority: number }[] = []
  
  for (const allocation of skillsForSession) {
    const { skill, expressionMode, weight } = allocation
    
    if (!isAdvancedSkill(skill)) continue
    
    const advancedFamily = getAdvancedSkillFamily(skill)
    if (!advancedFamily) continue
    
    // [advanced-skill-expression] ISSUE B: HSPU special handling
    if (skill === 'hspu') {
      // HSPU should influence vertical push selection
      if (dayFocus.includes('push') || dayFocus.includes('skill') || dayFocus.includes('vertical')) {
        const hspuProgressions = advancedFamily.directProgressions
        for (const exId of hspuProgressions) {
          const found = [...availableSkills, ...availableStrength].find(
            e => e.id.toLowerCase() === exId.toLowerCase()
          )
          if (found) {
            recommendations.push({
              exerciseId: found.id,
              reason: `[HSPU progression] ${advancedFamily.displayName} direct expression`,
              priority: expressionMode === 'primary' ? 3 : expressionMode === 'technical' ? 2 : 1,
            })
            break
          }
        }
      }
    }
    
    // [advanced-skill-expression] ISSUE C: Other advanced skills
    if (skill === 'back_lever' || skill === 'dragon_flag' || skill === 'planche_pushup' ||
        skill === 'one_arm_pull_up' || skill === 'one_arm_chin_up' || skill === 'one_arm_push_up') {
      const progressions = advancedFamily.directProgressions
      for (const exId of progressions) {
        const found = [...availableSkills, ...availableStrength].find(
          e => e.id.toLowerCase() === exId.toLowerCase()
        )
        if (found) {
          recommendations.push({
            exerciseId: found.id,
            reason: `[Advanced] ${advancedFamily.displayName} ${expressionMode} expression`,
            priority: expressionMode === 'primary' ? 3 : expressionMode === 'technical' ? 2 : 1,
          })
          break
        }
      }
    }
    
    // [advanced-skill-expression] Log detected advanced skill for session
    console.log('[advanced-skill-expression] Skill exercise recommendation:', {
      skill,
      displayName: advancedFamily.displayName,
      expressionMode,
      dayFocus,
      recommendationsCount: recommendations.length,
    })
  }
  
  return recommendations
}

/**
 * Gets intentional support exercises for advanced skills in this session.
 * [advanced-skill-expression] ISSUE D: Support work should look intentional.
 */
function getAdvancedSkillSupportExercises(
  skillsForSession: Array<{ skill: string; expressionMode: string; weight: number }> | undefined,
  availableAccessory: Exercise[],
  availableCore: Exercise[]
): { exerciseId: string; reason: string; supportType: 'primary' | 'secondary' | 'trunk' }[] {
  if (!skillsForSession || skillsForSession.length === 0) {
    return []
  }

  const supportRecommendations: { exerciseId: string; reason: string; supportType: 'primary' | 'secondary' | 'trunk' }[] = []
  const allAvailable = [...availableAccessory, ...availableCore]
  
  for (const allocation of skillsForSession) {
    const { skill, expressionMode } = allocation
    
    if (!isAdvancedSkill(skill)) continue
    
    const supportPattern = ADVANCED_SKILL_SUPPORT_PATTERNS[skill]
    if (!supportPattern) continue
    
    // Primary support work
    if (expressionMode === 'primary' || expressionMode === 'technical') {
      for (const primary of supportPattern.primarySupport) {
        for (const exId of primary.exerciseIds) {
          const found = allAvailable.find(e => e.id.toLowerCase() === exId.toLowerCase())
          if (found) {
            supportRecommendations.push({
              exerciseId: found.id,
              reason: `[${supportPattern.displayName}] ${primary.purpose}`,
              supportType: 'primary',
            })
            break
          }
        }
      }
    }
    
    // Trunk support for all expression modes
    const trunkSupport = supportPattern.trunkSupport
    for (const exId of trunkSupport.exerciseIds) {
      const found = allAvailable.find(e => e.id.toLowerCase() === exId.toLowerCase())
      if (found) {
        supportRecommendations.push({
          exerciseId: found.id,
          reason: `[${supportPattern.displayName} trunk] ${trunkSupport.purpose}`,
          supportType: 'trunk',
        })
        break
      }
    }
    
    // [advanced-skill-expression] Log support recommendations
    console.log('[advanced-skill-expression] Support work recommendation:', {
      skill,
      displayName: supportPattern.displayName,
      expressionMode,
      primarySupportCount: supportRecommendations.filter(s => s.supportType === 'primary').length,
      trunkSupportCount: supportRecommendations.filter(s => s.supportType === 'trunk').length,
    })
  }
  
  return supportRecommendations
}

// =============================================================================
// MAIN EXERCISE SELECTION
// =============================================================================

// [exercise-expression] Session skill allocation type for multi-skill expression
type SessionSkillAllocation = {
  skill: string
  expressionMode: 'primary' | 'technical' | 'support' | 'warmup'
  weight: number
}

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
  prerequisiteContext?: AthletePrerequisiteContext,
  skillsForSession?: SessionSkillAllocation[],
  selectedSkills?: string[],
  equipment?: EquipmentType[],
  // TASK 1-A: Thread weightedBenchmarks explicitly to fix ReferenceError
  weightedBenchmarks?: {
  weightedPullUp?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  weightedDip?: { current?: WeightedBenchmark; pr?: WeightedPRBenchmark }
  },
  // [PHASE 4 HOTFIX] Thread jointCautions for doctrine context
  jointCautions?: string[],
  // [PHASE-MATERIALITY] TASK 3: Current working progressions for authoritative prescription
  currentWorkingProgressions?: Record<string, {
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  truthSource: string
  isConservative: boolean
  }> | null,
  // [PHASE-MATERIALITY] Material skill intent from contract
  materialSkillIntent?: Array<{
  skill: string
  role: 'primary_spine' | 'secondary_anchor' | 'support' | 'deferred'
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  }>
  ): SelectedExercise[] {
  // [selection-contract] TASK 1-F: Verify weighted benchmarks threading
  console.log('[selection-contract]', {
  dayFocus: day.focus,
  primaryGoal,
  hasWeightedBenchmarks: !!weightedBenchmarks,
  hasPullUpBenchmark: !!weightedBenchmarks?.weightedPullUp?.current,
  hasDipBenchmark: !!weightedBenchmarks?.weightedDip?.current,
  })
  
  // ==========================================================================
  // [PHASE-MATERIALITY] TASK 3: LOG CURRENT WORKING PROGRESSIONS VS HISTORICAL
  // ==========================================================================
  if (currentWorkingProgressions) {
  const progressionAudit: Array<{skill: string, current: string | null, historical: string | null, isConservative: boolean}> = []
  for (const [skill, data] of Object.entries(currentWorkingProgressions)) {
    if (data.currentWorkingProgression || data.historicalCeiling) {
    progressionAudit.push({
      skill,
      current: data.currentWorkingProgression,
      historical: data.historicalCeiling,
      isConservative: data.isConservative,
    })
    }
  }
  if (progressionAudit.length > 0) {
    console.log('[phase-materiality-current-progression-audit]', {
    dayFocus: day.focus,
    primaryGoal,
    progressionData: progressionAudit,
    verdict: progressionAudit.some(p => p.isConservative) 
      ? 'CONSERVATIVE_PROGRESSIONS_ACTIVE' 
      : 'PROGRESSIONS_AT_HISTORICAL_CEILING',
    })
  }
  }
  
  // [PHASE-MATERIALITY] TASK 2: Log material skill intent for this session
  if (materialSkillIntent && materialSkillIntent.length > 0) {
  console.log('[phase-materiality-skill-allocation]', {
    dayFocus: day.focus,
    primarySkill: materialSkillIntent.find(s => s.role === 'primary_spine')?.skill || primaryGoal,
    secondarySkill: materialSkillIntent.find(s => s.role === 'secondary_anchor')?.skill || null,
    supportSkills: materialSkillIntent.filter(s => s.role === 'support').map(s => s.skill),
    deferredSkills: materialSkillIntent.filter(s => s.role === 'deferred').map(s => s.skill),
    skillsWithCurrentProgression: materialSkillIntent.filter(s => s.currentWorkingProgression).length,
  })
  }
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
  
  // [exercise-trace] Track rejected alternatives for traceability (moved before canAddMore)
  const sessionRejectedAlternatives: RejectedAlternative[] = []
  
  // Helper to track a rejected alternative
  const trackRejection = (
    exerciseId: string,
    exerciseName: string,
    rejectionReason: RejectionReason,
    details?: string
  ) => {
    // Keep only top 20 most recent rejects per session
    if (sessionRejectedAlternatives.length >= 20) {
      sessionRejectedAlternatives.shift()
    }
    sessionRejectedAlternatives.push({ exerciseId, exerciseName, rejectionReason, details })
    console.log('[exercise-trace] REJECTED:', { exerciseId, reason: rejectionReason, details })
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
    
    // Critical limits that should never be exceeded - [exercise-trace] TASK 4: Track rejections
    if (newHighFatigue > HIGH_FATIGUE_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'fatigue_limit', 'High fatigue limit exceeded')
      return false
    }
    if (newStraightArm > STRAIGHT_ARM_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'straight_arm_limit', 'Straight arm limit exceeded')
      return false
    }
    if (newPrimary > PRIMARY_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'fatigue_limit', 'Primary exercise limit exceeded')
      return false
    }
    
    // Weighted load check (more lenient for low-impact exercises)
    if (!isLowImpact && newWeightedLoad > WEIGHTED_LOAD_LIMIT + 1) {
      trackRejection(exercise.id, exercise.name, 'fatigue_limit', 'Weighted load limit exceeded')
      return false
    }
    
    // =========================================================================
    // MOVEMENT INTELLIGENCE CHECKS - [exercise-trace] TASK 4: Track joint stress rejections
    // =========================================================================
    
    // Check joint stress accumulation
    const newShoulderStress = jointStressAccumulator.shoulder + stressToNumber(movementIntel.jointStress.shoulder)
    const newElbowStress = jointStressAccumulator.elbow + stressToNumber(movementIntel.jointStress.elbow)
    const newWristStress = jointStressAccumulator.wrist + stressToNumber(movementIntel.jointStress.wrist)
    const newLowerBackStress = jointStressAccumulator.lowerBack + stressToNumber(movementIntel.jointStress.lowerBack)
    
    // Reject if any joint is overloaded
    if (newShoulderStress > JOINT_STRESS_LIMITS.shoulder) {
      trackRejection(exercise.id, exercise.name, 'joint_stress_exceeded', 'Shoulder stress limit exceeded')
      return false
    }
    if (newWristStress > JOINT_STRESS_LIMITS.wrist) {
      trackRejection(exercise.id, exercise.name, 'joint_stress_exceeded', 'Wrist stress limit exceeded')
      return false
    }
    if (newElbowStress > JOINT_STRESS_LIMITS.elbow) {
      trackRejection(exercise.id, exercise.name, 'joint_stress_exceeded', 'Elbow stress limit exceeded')
      return false
    }
    
    return true
  }
  
  // [exercise-trace] TASK 2: Enhanced addExercise with full traceability
  // Helper to add exercise with prerequisite gate check, load tracking, and trace
  const addExercise = (
    exercise: Exercise,
    reason: string,
    setsOverride?: number,
    repsOverride?: string,
    noteOverride?: string,
    deliveryStyle: DeliveryStyle = 'standalone',
    // [exercise-trace] TASK 2: Trace context parameters
    traceContext?: {
      primarySelectionReason: ExerciseSelectionReason
      sessionRole: TraceSessionRole
      expressionMode: TraceExpressionMode
      influencingSkills?: Array<{
        skillId: string
        influence: 'primary' | 'secondary' | 'selected' | 'limiter_related'
        expressionMode: SkillExpressionMode
      }>
      doctrineSource?: DoctrineSourceTrace
      exerciseFamily?: string
      candidatePoolSize?: number
      weightedConsidered?: boolean
      weightedEligible?: boolean
      weightedBlockerReason?: WeightedBlockerReason
      limiterInfluence?: string
      recoveryInfluence?: string
    }
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
    
    // =========================================================================
    // PRESCRIPTION-AWARE SETS/REPS/NOTES (TASK 1, 2)
    // Use prescription contract for intelligent programming instead of generic defaults
    // =========================================================================
    let finalSets = setsOverride
    let finalRepsOrTime = repsOverride
    let finalNote = noteOverride
    
    // Only apply prescription logic if no override provided
    if (finalSets === undefined || finalRepsOrTime === undefined) {
      const prescriptionResult = getPrescriptionAwarePrescription(
        finalExercise,
        experienceLevel,
        primaryGoal,
        undefined, // currentProgression - could be passed from context
        undefined, // fatigueState - could be passed from context
        undefined  // recentPerformance - could be passed from context
      )
      
      if (finalSets === undefined) {
        finalSets = prescriptionResult.sets
      }
      if (finalRepsOrTime === undefined) {
        finalRepsOrTime = prescriptionResult.repsOrTime
      }
      if (finalNote === undefined && prescriptionResult.note) {
        finalNote = prescriptionResult.note
      }
      
      // Log prescription decision in dev mode
      if (process.env.NODE_ENV !== 'production') {
        logPrescriptionDiagnostics({
          exerciseId: finalExercise.id,
          detectedMode: prescriptionResult.prescriptionMode,
          resolvedPrescription: {
            sets: prescriptionResult.sets.toString(),
            volume: prescriptionResult.repsOrTime,
            rest: 'default',
            intensity: prescriptionResult.note || 'standard',
          },
          athleteAdjustments: [`Level: ${experienceLevel}`],
        })
      }
    }
    
    // =========================================================================
    // WEIGHTED LOAD PR: Calculate prescribed load for weighted exercises
    // =========================================================================
    let prescribedLoad: SelectedExercise['prescribedLoad'] = undefined
    const isWeightedExercise = finalExercise.id.includes('weighted_pull') || 
                               finalExercise.id.includes('weighted_dip') ||
                               finalExercise.id.includes('weighted_push') ||
                               finalExercise.id.includes('weighted_row')
    
    // [weighted-truth] TASK F: Track no-load reason for weighted-eligible exercises
    let noLoadReason: SelectedExercise['noLoadReason'] = null
    
    // [weighted-prescription-truth] TASK 8: Log weighted exercise eligibility
    if (isWeightedExercise) {
      console.log('[weighted-truth] Weighted exercise detected:', {
        exerciseId: finalExercise.id,
        exerciseName: finalExercise.name,
        hasWeightedEquipment,
        hasWeightedBenchmarks: !!weightedBenchmarks,
        hasPullUpBenchmark: !!weightedBenchmarks?.weightedPullUp?.current,
        hasDipBenchmark: !!weightedBenchmarks?.weightedDip?.current,
      })
      
      // [weighted-truth] TASK F: Determine and log no-load reason
      if (!hasWeightedEquipment) {
        noLoadReason = 'no_loadable_equipment'
        console.log('[weighted-truth] No load prescribed - reason:', noLoadReason)
      } else if (!weightedBenchmarks) {
        noLoadReason = 'missing_strength_inputs'
        console.log('[weighted-truth] No load prescribed - reason:', noLoadReason)
      }
    }
    
    if (isWeightedExercise && weightedBenchmarks) {
      // Determine exercise type and get appropriate benchmarks
      const exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row' =
        finalExercise.id.includes('weighted_pull') ? 'weighted_pull_up' :
        finalExercise.id.includes('weighted_dip') ? 'weighted_dip' :
        finalExercise.id.includes('weighted_push') ? 'weighted_push_up' : 'weighted_row'
      
      const benchmarkData = exerciseType === 'weighted_pull_up' ? weightedBenchmarks.weightedPullUp
        : exerciseType === 'weighted_dip' ? weightedBenchmarks.weightedDip
        : null
      
      if (benchmarkData) {
        // [prescription] ISSUE D: Session role affects prescription mode
        // Both rep target AND day focus influence the prescription
        const repsStr = finalRepsOrTime || '5'
        const repTarget = parseInt(repsStr.split('-')[0]) || 5
        
        // Determine if this is a heavier strength day based on focus
        const isHeavyStrengthDay = day.focus === 'push_strength' || day.focus === 'pull_strength'
        const isSupportDay = day.focus === 'support_recovery' || day.focus === 'support_conditioning'
        const isSkillDay = day.focus === 'skill' || day.focus === 'push_skill' || day.focus === 'pull_skill'
        
        // [prescription] Session role modifies prescription mode
        let prescriptionMode: WeightedPrescriptionMode
        if (isHeavyStrengthDay) {
          // Heavy strength days: bias toward heavier loads regardless of rep scheme
          prescriptionMode = repTarget <= 6 ? 'strength_primary' : 'strength_support'
        } else if (isSupportDay) {
          // Support days: bias toward volume/hypertrophy
          prescriptionMode = repTarget <= 8 ? 'volume_support' : 'hypertrophy'
        } else if (isSkillDay) {
          // Skill days: weighted work is support - moderate intensity
          prescriptionMode = repTarget <= 5 ? 'strength_support' : 'volume_support'
        } else {
          // Mixed/default: use rep-based logic
          prescriptionMode = 
            repTarget <= 5 ? 'strength_primary' :
            repTarget <= 6 ? 'strength_support' :
            repTarget <= 10 ? 'volume_support' : 'hypertrophy'
        }
        
        // [prescription] Log how session role influences load
        console.log('[prescription] Session role → prescription mode:', {
          exerciseId: finalExercise.id,
          dayFocus: day.focus,
          repTarget,
          prescriptionMode,
          hasBenchmark: !!benchmarkData.current,
          hasPR: !!benchmarkData.pr,
        })
        
        const loadPrescription = estimateWeightedLoadPrescription(
          exerciseType,
          prescriptionMode,
          benchmarkData.current,
          benchmarkData.pr
        )
        
        // Log the estimation
        logWeightedLoadEstimation(exerciseType, prescriptionMode, loadPrescription)
        
        // Build prescribed load object if we have data
        if (loadPrescription.loadBasis !== 'no_data') {
          prescribedLoad = {
            load: loadPrescription.prescribedLoad,
            unit: loadPrescription.loadUnit,
            basis: loadPrescription.loadBasis,
            confidenceLevel: loadPrescription.confidenceLevel,
            estimated1RM: loadPrescription.estimated1RM ?? undefined,
            targetReps: loadPrescription.targetReps,
            intensityBand: loadPrescription.intensityBand,
            notes: loadPrescription.notes.length > 0 ? loadPrescription.notes : undefined,
          }
          
          // [weighted-truth] Log successful prescription
          console.log('[weighted-truth] Prescribed load generated:', {
            exerciseId: finalExercise.id,
            load: prescribedLoad.load,
            unit: prescribedLoad.unit,
            confidence: prescribedLoad.confidenceLevel,
          })
          
          // Update note with load prescription
          if (loadPrescription.prescribedLoad > 0) {
            const loadDisplay = formatWeightedLoadDisplay(loadPrescription)
            finalNote = finalNote 
              ? `${loadDisplay}. ${finalNote}`
              : `${loadDisplay}`
          }
        } else {
          // [weighted-truth] TASK F: Track no-data as a reason
          noLoadReason = 'missing_strength_inputs'
          console.log('[weighted-truth] No load - benchmark data returned no_data')
        }
      } else {
        // [weighted-truth] TASK F: No benchmark for this specific exercise type
        if (isWeightedExercise && !noLoadReason) {
          noLoadReason = 'missing_strength_inputs'
          console.log('[weighted-truth] No benchmark data for this exercise type')
        }
      }
    }
    
    // =========================================================================
    // [exercise-trace] TASK 2: Build selection trace
    // =========================================================================
    const isWeightedCapable = finalExercise.id.includes('pull_up') || 
                               finalExercise.id.includes('dip') ||
                               finalExercise.id.includes('push_up') ||
                               finalExercise.id.includes('row')
    
    // Build weighted decision trace for weighted-capable exercises
    let equipmentDecision: WeightedDecisionTrace | null = null
    if (isWeightedCapable) {
      const weightedChosen = isWeightedExercise && prescribedLoad !== undefined
      equipmentDecision = {
        weightedConsidered: traceContext?.weightedConsidered ?? isWeightedCapable,
        weightedEligible: traceContext?.weightedEligible ?? (weightedBenchmarks !== undefined),
        weightedChosen,
        weightedBlockerReason: weightedChosen ? null : (
          traceContext?.weightedBlockerReason ?? 
          (!weightedBenchmarks ? 'no_benchmark_confidence' : 
           !equipment?.includes('weight_belt') && !equipment?.includes('weight_vest') ? 'no_loadable_equipment' : 
           null)
        ),
        prescribedLoad: weightedChosen && prescribedLoad ? {
          load: prescribedLoad.load,
          unit: prescribedLoad.unit,
          basis: prescribedLoad.basis,
        } : undefined,
      }
    }

    // Determine selection reason from reason string if not provided
    const inferredReason = inferSelectionReason(reason, finalExercise, primaryGoal)
    
    // Build the trace object
    const selectionTrace: ExerciseSelectionTrace = {
      exerciseId: finalExercise.id,
      exerciseName: finalExercise.name,
      slotType: 'main',
      sessionRole: traceContext?.sessionRole ?? inferSessionRole(loadMetadata?.role),
      expressionMode: traceContext?.expressionMode ?? 'strength_support',
      primarySelectionReason: traceContext?.primarySelectionReason ?? inferredReason,
      secondaryInfluences: [],
      influencingSkills: traceContext?.influencingSkills ?? [],
      doctrineSource: traceContext?.doctrineSource ?? null,
      exerciseFamily: traceContext?.exerciseFamily ?? movementIntel.primaryPattern ?? null,
      candidatePoolSummary: {
        totalCandidates: traceContext?.candidatePoolSize ?? 0,
        filteredByEquipment: 0,
        filteredBySessionRole: 0,
        filteredBySkillWeight: 0,
        finalRankedCandidates: traceContext?.candidatePoolSize ?? 1,
      },
      rejectedAlternatives: sessionRejectedAlternatives.slice(-5), // Last 5 rejects
      equipmentDecision,
      loadabilityInfluence: prescribedLoad ? `Load: +${prescribedLoad.load}${prescribedLoad.unit}` : null,
      limiterInfluence: traceContext?.limiterInfluence ?? null,
      recoveryInfluence: traceContext?.recoveryInfluence ?? null,
      confidence: traceContext ? 0.8 : 0.5,
      traceQuality: traceContext ? 'partial' : 'minimal',
    }
    
    // [exercise-trace] TASK 7: Log the trace
    logExerciseTrace(selectionTrace)

    selected.push({
      exercise: finalExercise,
      sets: finalSets ?? adjustSetsForLevel(finalExercise.defaultSets, experienceLevel),
      repsOrTime: finalRepsOrTime ?? adjustRepsForLevel(finalExercise.defaultRepsOrTime, experienceLevel),
      note: wasSubstituted 
        ? `Substituted from ${exercise.name} - ${gateResult.recommendedSubstitute?.reason || 'Prerequisites not met'}`
        : finalNote ?? finalExercise.notes,
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
    // WEIGHTED LOAD PR: Include prescribed load if available
    prescribedLoad,
    // [weighted-truth] TASK F: Include no-load reason for transparency
    noLoadReason,
    // [exercise-trace] TASK 2: Attach the trace
    selectionTrace,
    })
    return true
  }
  
  // =========================================================================
  // [exercise-trace] HELPER FUNCTIONS FOR TRACE INFERENCE
  // =========================================================================
  
  /** Infer selection reason from reason string */
  function inferSelectionReason(reason: string, exercise: Exercise, goal: string): ExerciseSelectionReason {
    const r = reason.toLowerCase()
    if (r.includes('primary') && r.includes('skill')) return 'primary_skill_direct'
    if (r.includes('secondary') && r.includes('skill')) return 'secondary_skill_direct'
    if (r.includes('technical')) return 'primary_skill_technical'
    if (r.includes('support') && r.includes('skill')) return 'selected_skill_support'
    if (r.includes('limiter') || r.includes('weak point')) return 'limiter_correction'
    if (r.includes('core') || r.includes('trunk') || r.includes('compression')) return 'trunk_core_support'
    if (r.includes('mobility') || r.includes('flexibility')) return 'mobility_enabling'
    if (r.includes('rotation') || r.includes('recovery')) return 'recovery_rotation'
    if (r.includes('strength') || r.includes('foundation')) return 'strength_foundation'
    if (r.includes('doctrine')) return 'doctrine_recommended'
    if (r.includes('equipment') || r.includes('fallback')) return 'equipment_fallback'
    if (r.includes('prerequisite')) return 'prerequisite_building'
    return 'session_role_fill'
  }
  
  /** Infer session role from load metadata role */
  function inferSessionRole(loadRole: string | undefined): TraceSessionRole {
    if (!loadRole) return 'accessory'
    if (loadRole === 'skill_primary') return 'skill_primary'
    if (loadRole === 'skill_secondary') return 'skill_secondary'
    if (loadRole === 'strength_primary') return 'strength_primary'
    if (loadRole === 'strength_support') return 'strength_support'
    if (loadRole === 'core') return 'core'
    if (loadRole === 'accessory') return 'accessory'
    return 'accessory'
  }
  
  // ==========================================================================
  // [selection-compression-fix] ISSUE A/B: SKILL-WEIGHTED RANKING SYSTEM
  // ==========================================================================
  // This reduces primary goal compression by creating scoring that respects
  // selected skills, session roles, and weighted-capable movement preferences.
  
  /**
   * Score an exercise based on skill alignment, session role, and weighted capability.
   * [selection-compression-fix] TASK 3: Rebalanced ranking weights.
   */
  function scoreExerciseForSession(
    exercise: Exercise,
    sessionSkills: SessionSkillAllocation[],
    dayFocus: string,
    hasWeightedEquipment: boolean
  ): number {
    let score = 0
    
    // Base score: general quality
    score += exercise.fatigueCost ? (5 - exercise.fatigueCost) * 2 : 5
    
  // [selection-compression-fix] ISSUE B: Selected skill alignment (increased boost for non-primary)
  // STEP 3: Reduce primary goal compression by increasing secondary/technical weights
  for (const skillAlloc of sessionSkills) {
  const skillLower = skillAlloc.skill.toLowerCase()
  const transfersToSkill = exercise.transferTo?.some(t => t.toLowerCase().includes(skillLower))
  const exerciseNameMatch = exercise.id.toLowerCase().includes(skillLower) || 
                            exercise.name.toLowerCase().includes(skillLower)
  
  if (transfersToSkill || exerciseNameMatch) {
  // Direct skill transfer gets biggest boost
  if (skillAlloc.expressionMode === 'primary') {
  score += 30 // Primary skill gets major boost (increased from 25)
  } else if (skillAlloc.expressionMode === 'technical') {
  score += 24 // Technical gets strong boost (increased from 18 to reduce compression)
  } else if (skillAlloc.expressionMode === 'support') {
  score += 18 // Support gets solid boost (increased from 12)
  } else if (skillAlloc.expressionMode === 'warmup') {
  score += 8 // Warmup gets small boost
  }
  
  // [selected-skill-exposure] Track which skill influenced this exercise
  console.log('[selected-skill-exposure] Skill influence on exercise:', {
    exerciseId: exercise.id,
    skillId: skillAlloc.skill,
    expressionMode: skillAlloc.expressionMode,
    transferMatch: transfersToSkill,
    nameMatch: exerciseNameMatch,
    scoreBoost: skillAlloc.expressionMode === 'primary' ? 30 : 
                skillAlloc.expressionMode === 'technical' ? 24 : 
                skillAlloc.expressionMode === 'support' ? 18 : 8,
  })
  }
  }
    
  // [selection-compression-fix] ISSUE C: Session role differentiation (STEP 4 - strengthened)
  const isStrengthFocus = dayFocus.includes('strength') || dayFocus.includes('support_heavy')
  const isSkillFocus = dayFocus.includes('skill')
  const isTechnicalFocus = dayFocus.includes('technical') || dayFocus.includes('density')
  const isMixedFocus = dayFocus.includes('mixed')
  const isRecoveryFocus = dayFocus.includes('recovery') || dayFocus.includes('light')
  
  // STEP 4: Make session roles actually change exercise composition
  if (isStrengthFocus) {
  if (exercise.category === 'strength') {
    score += 20 // Strength exercises strongly favored on strength days (increased from 15)
  }
  // Penalize skill work on strength-focused days
  if (exercise.category === 'skill' && exercise.fatigueCost && exercise.fatigueCost >= 4) {
    score -= 10
  }
  } else if (isSkillFocus) {
  if (exercise.category === 'skill') {
    score += 20 // Skill exercises strongly favored (increased from 15)
  }
  // Penalize heavy strength work on skill days
  if (exercise.category === 'strength' && exercise.fatigueCost && exercise.fatigueCost >= 4) {
    score -= 8
  }
  } else if (isTechnicalFocus) {
  // Technical days: favor lower fatigue, higher rep work
  if (exercise.fatigueCost && exercise.fatigueCost <= 2) {
    score += 15
  }
  if (exercise.category === 'skill') {
    score += 10
  }
  } else if (isRecoveryFocus) {
  // Recovery: strongly favor low fatigue
  if (exercise.fatigueCost && exercise.fatigueCost <= 2) {
    score += 18
  } else if (exercise.fatigueCost && exercise.fatigueCost >= 4) {
    score -= 15 // Strong penalty for high fatigue on recovery days
  }
  } else if (isMixedFocus) {
  // [session-assembly-truth] TASK 6: Mixed days favor moderate fatigue AND broader skill expression
  // This is key to making hybrid profiles feel represented
  if (exercise.fatigueCost && exercise.fatigueCost <= 3) {
    score += 12 // Slightly increased from 10
  }
  
  // [session-assembly-truth] TASK 6: Boost exercises that support ANY selected skill (not just primary)
  // This reduces the ranking bias that crushes tertiary skills on mixed days
  const supportsMixedDayVariety = sessionSkills.some(s => {
    const skillLower = s.skill.toLowerCase()
    const transfersToSkill = exercise.transferTo?.some(t => t.toLowerCase().includes(skillLower))
    const nameMatchesSkill = exercise.id.toLowerCase().includes(skillLower) ||
                              exercise.name.toLowerCase().includes(skillLower)
    return transfersToSkill || nameMatchesSkill
  })
  
  if (supportsMixedDayVariety) {
    // Boost for exercises that support ANY selected skill on mixed days
    // This helps tertiary skills get represented
    score += 8
    console.log('[session-assembly-truth] Mixed day variety boost:', {
      exerciseId: exercise.id,
      boost: 8,
      reason: 'supports_selected_skill_on_mixed_day',
    })
  }
  }
  
  // [exercise-expression] Log session role influence
  console.log('[exercise-expression] Session role scoring:', {
  exerciseId: exercise.id,
  dayFocus,
  category: exercise.category,
  fatigueCost: exercise.fatigueCost,
  roleType: isStrengthFocus ? 'strength' : isSkillFocus ? 'skill' : isTechnicalFocus ? 'technical' : isRecoveryFocus ? 'recovery' : 'mixed',
  })
    
  // [selection-compression-fix] ISSUE D/E: Weighted-capable boost when equipment supports it
  // STEP 5: Fix weighted-capable movement win conditions
  const isWeightedCapable = exercise.id.includes('weighted_') ||
  exercise.id === 'pull_up' ||
  exercise.id === 'dip' ||
  exercise.id === 'push_up' ||
  exercise.id.includes('row') ||
  exercise.id.includes('chin_up')
  
  // Weighted exercises get boost on strength AND mixed days when equipment supports
  if (hasWeightedEquipment && isWeightedCapable) {
  if (isStrengthFocus) {
    score += 18 // Strong boost for weighted on strength days (increased from 12)
    console.log('[weighted-win-logic] Weighted exercise scored high on strength day:', {
    exerciseId: exercise.id,
    boost: 18,
    reason: 'strength_day_weighted_priority',
    })
  } else if (isMixedFocus) {
    score += 10 // Moderate boost on mixed days
    console.log('[weighted-win-logic] Weighted exercise scored moderate on mixed day:', {
    exerciseId: exercise.id,
    boost: 10,
    reason: 'mixed_day_weighted_support',
    })
  }
  }
  
  // [selection-competition] STEP 8: Track score for rejected alternative analysis
  console.log('[selection-competition] Final exercise score:', {
  exerciseId: exercise.id,
  finalScore: score,
  hasWeightedEquipment,
  isWeightedCapable,
  dayFocus,
  })
  
  return score
  }

/**
 * [PHASE-MATERIALITY] TASK 4: Enhanced exercise scoring with progression truth
 * This applies additional scoring adjustments based on:
 * 1. Current working progression compatibility
 * 2. Material skill role fit (primary/secondary/support/deferred)
 * 3. Doctrine influence when available
 */
function applyMaterialityScoreAdjustments(
  exercise: Exercise,
  baseScore: number,
  materialSkillIntent: Array<{
  skill: string
  role: 'primary_spine' | 'secondary_anchor' | 'support' | 'deferred'
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  }> | undefined,
  currentWorkingProgressions: Record<string, {
  currentWorkingProgression: string | null
  historicalCeiling: string | null
  truthSource: string
  isConservative: boolean
  }> | null | undefined,
  primaryGoal: string
): { adjustedScore: number; adjustmentReason: string | null } {
  let adjustedScore = baseScore
  let adjustmentReason: string | null = null
  
  if (!materialSkillIntent || materialSkillIntent.length === 0) {
  return { adjustedScore, adjustmentReason }
  }
  
  // Check if exercise aligns with material skill intent
  const exerciseSkillMatch = materialSkillIntent.find(intent => {
  const skillLower = intent.skill.toLowerCase().replace(/_/g, '')
  const exerciseIdLower = exercise.id.toLowerCase()
  const exerciseNameLower = exercise.name.toLowerCase()
  return exerciseIdLower.includes(skillLower) || 
       exerciseNameLower.includes(skillLower) ||
       exercise.transferTo?.some(t => t.toLowerCase().includes(skillLower))
  })
  
  if (exerciseSkillMatch) {
  // Apply role-based scoring
  switch (exerciseSkillMatch.role) {
    case 'primary_spine':
    adjustedScore += 15 // Strong boost for primary spine exercises
    adjustmentReason = 'primary_spine_alignment'
    break
    case 'secondary_anchor':
    adjustedScore += 10 // Solid boost for secondary anchor
    adjustmentReason = 'secondary_anchor_alignment'
    break
    case 'support':
    adjustedScore += 5 // Modest boost for support skills
    adjustmentReason = 'support_skill_alignment'
    break
    case 'deferred':
    adjustedScore -= 5 // Slight penalty for deferred skills (don't clutter session)
    adjustmentReason = 'deferred_skill_deprioritized'
    break
  }
  
  // [PHASE-MATERIALITY] TASK 3: Progression compatibility check
  // If we have current working progression, prefer exercises that match that level
  if (exerciseSkillMatch.currentWorkingProgression && currentWorkingProgressions) {
    const progressionKey = exerciseSkillMatch.skill.replace(/_/g, '')
    const progressionData = currentWorkingProgressions[progressionKey] || 
                          currentWorkingProgressions[exerciseSkillMatch.skill]
    
    if (progressionData && progressionData.isConservative) {
    // User is working conservatively - slightly favor lower progression variants
    const exerciseDifficulty = exercise.difficulty
    if (exerciseDifficulty === 'beginner' || exerciseDifficulty === 'intermediate') {
      adjustedScore += 3
      adjustmentReason = (adjustmentReason || '') + '+conservative_progression_fit'
    } else if (exerciseDifficulty === 'advanced') {
      adjustedScore -= 2 // Slight penalty for advanced when being conservative
      adjustmentReason = (adjustmentReason || '') + '+conservative_downgrades_advanced'
    }
    
    console.log('[phase-materiality-exercise-ranking]', {
      exerciseId: exercise.id,
      skill: exerciseSkillMatch.skill,
      role: exerciseSkillMatch.role,
      currentProgression: progressionData.currentWorkingProgression,
      historicalCeiling: progressionData.historicalCeiling,
      isConservative: progressionData.isConservative,
      exerciseDifficulty,
      scoreAdjustment: adjustedScore - baseScore,
    })
    }
  }
  }
  
  return { adjustedScore, adjustmentReason }
  }
  
  /**
  * Get exercises that support a specific skill via doctrine mappings.
  * [selection-compression-fix] ISSUE F: Prefer doctrine-backed support.
   */
  function getDoctrineBackedExercisesForSkill(
    skill: string,
    availableExercises: Exercise[]
  ): { exercise: Exercise; doctrineSource: string }[] {
    const mapping = getSupportMapping(skill as SkillCarryover)
    if (!mapping) return []
    
    const results: { exercise: Exercise; doctrineSource: string }[] = []
    
    for (const exId of mapping.directSupportExercises) {
      const found = availableExercises.find(e => e.id.toLowerCase() === exId.toLowerCase())
      if (found) {
        results.push({ exercise: found, doctrineSource: `skill-support-mapping:${skill}:direct` })
      }
    }
    
    for (const exId of mapping.accessorySupportExercises) {
      const found = availableExercises.find(e => e.id.toLowerCase() === exId.toLowerCase())
      if (found) {
        results.push({ exercise: found, doctrineSource: `skill-support-mapping:${skill}:accessory` })
      }
    }
    
    return results
  }
  
  // ==========================================================================
  // [PHASE 4] DOCTRINE DB EXERCISE SCORING INTEGRATION
  // ==========================================================================
  // This layer applies doctrine DB rules to re-rank already-valid candidates.
  // It cannot resurrect excluded exercises or bypass safety gates.
  // Uses pre-cached rules for synchronous scoring during selection.
  // ==========================================================================
  
  // [PHASE 4 HOTFIX] DEFENSIVE NORMALIZATION - prevent undefined reference errors
  const normalizedJointCautions: string[] = Array.isArray(jointCautions) ? jointCautions : []
  const normalizedEquipment: EquipmentType[] = Array.isArray(equipment) ? equipment : []
  const normalizedSelectedSkills: string[] = Array.isArray(selectedSkills) ? selectedSkills : [primaryGoal]
  
  // Lightweight runtime guardrail log
  console.log('[PHASE4-SELECTION-GUARDRAIL]', {
    focus: day.focus,
    primaryGoal,
    jointCautionsCount: normalizedJointCautions.length,
    selectedSkillsCount: normalizedSelectedSkills.length,
    doctrineRulesCached: !!getCachedDoctrineRules(),
  })
  
  // Track doctrine scoring audit for this session
  let sessionDoctrineAudit: DoctrineScoringAudit | null = null
  
  // Get cached doctrine rules (prefetched at start of generation)
  const cachedDoctrineRules = getCachedDoctrineRules()
  
  // Build doctrine context for this session
  // Note: secondaryGoal is derived from skillsForSession if available
  const secondarySkillFromSession = skillsForSession?.find(s => 
    s.expressionMode === 'technical' || s.expressionMode === 'support'
  )?.skill
  
  // [PHASE 4 HOTFIX] Use normalized values only - never raw possibly-undefined
  const doctrineContext: DoctrineScoreContext = {
    primaryGoal,
    secondaryGoal: secondarySkillFromSession || null,
    selectedSkills: normalizedSelectedSkills,
    experienceLevel,
    jointCautions: normalizedJointCautions,
    equipment: normalizedEquipment as string[],
    sessionFocus: day.focus,
    hasWeightedEquipment: hasLoadableEquipment(normalizedEquipment),
  }
  
  /**
   * Apply doctrine scoring synchronously to candidate pool.
   * Returns re-sorted candidates with doctrine adjustments.
   * [PHASE 4] Bounded doctrine integration - scoring layer only.
   * [PHASE 4 HOTFIX] Fully guarded with try/catch - doctrine CANNOT crash generation.
   */
  function applyDoctrineToPool<T extends { exercise: Exercise; score: number }>(
    candidates: T[],
    sessionFocus: string
  ): T[] {
    // Always have a fallback sorted list
    const baseSorted = [...candidates].sort((a, b) => b.score - a.score)
    
    if (!cachedDoctrineRules) {
      // No cached rules, return base sorted
      return baseSorted
    }
    
    // [PHASE 4 HOTFIX] Wrap doctrine scoring in try/catch - never crash generation
    try {
      // Update context for this specific pool
      const poolContext: DoctrineScoreContext = {
        ...doctrineContext,
        sessionFocus,
      }
      
      // Apply doctrine scoring synchronously
      const { sorted, audit } = applyDoctrineScoringSyncAndSort(
        candidates,
        poolContext,
        cachedDoctrineRules
      )
      
      // Accumulate audit results
      if (audit.doctrineApplied && !sessionDoctrineAudit) {
        sessionDoctrineAudit = audit
      } else if (audit.doctrineApplied && sessionDoctrineAudit) {
        // Merge audit results
        sessionDoctrineAudit.candidatesAffected += audit.candidatesAffected
        sessionDoctrineAudit.rulesMatched.selectionRules += audit.rulesMatched.selectionRules
        sessionDoctrineAudit.rulesMatched.contraindicationRules += audit.rulesMatched.contraindicationRules
        sessionDoctrineAudit.rulesMatched.carryoverRules += audit.rulesMatched.carryoverRules
        if (audit.topCandidateChanged) sessionDoctrineAudit.topCandidateChanged = true
        if (audit.top3Changed) sessionDoctrineAudit.top3Changed = true
      }
      
      // Log if doctrine made a material change
      if (audit.doctrineApplied && (audit.topCandidateChanged || audit.top3Changed)) {
        console.log('[PHASE4-DOCTRINE-LIVE-INTEGRATION]', {
          sessionFocus,
          primaryGoal,
          candidatesAffected: audit.candidatesAffected,
          topCandidateChanged: audit.topCandidateChanged,
          preDoctrineWinner: audit.preDoctrineTop3[0],
          postDoctrineWinner: audit.postDoctrineTop3[0],
          verdict: 'DOCTRINE_EXERCISE_SCORING_LIVE',
        })
      }
      
      return sorted
    } catch (error) {
      // [PHASE 4 HOTFIX] Doctrine scoring failed - gracefully fall back to base ranking
      console.log('[PHASE4-DOCTRINE-FALLBACK]', {
        doctrineApplied: false,
        fallbackReason: 'phase4_scoring_error',
        errorMessage: String(error),
        sessionFocus,
        primaryGoal,
      })
      return baseSorted
    }
  }
  
  // [weighted-truth] TASK A: Use canonical loadable equipment check
  const hasWeightedEquipment = hasLoadableEquipment(equipment)
  
  // [planner-truth-input] STEP 2: Log the EXACT profile truth reaching selection
  const skillsForSessionLabels = skillsForSession
    ? skillsForSession.map(function(s) { return s.skill + '(' + s.expressionMode + ':' + s.weight + ')'; })
    : undefined;
  console.log('[planner-truth-input] Exercise selection receiving:', {
    primaryGoal,
    dayFocus: day.focus,
    selectedSkillsCount: selectedSkills?.length || 0,
    selectedSkills: selectedSkills?.slice(0, 5) || [],
    skillsForSessionCount: skillsForSession?.length || 0,
    skillsForSession: skillsForSessionLabels,
    hasWeightedEquipment,
    hasBenchmarks: !!weightedBenchmarks,
    experienceLevel,
    equipmentCount: equipment?.length || 0,
    constraintType,
  });
  
  // [weighted-truth] TASK A: Log weighted readiness at session selection
  console.log('[weighted-truth] Session weighted readiness:', {
  dayFocus: day.focus,
  hasWeightedEquipment,
  hasBenchmarks: !!weightedBenchmarks,
  pullUpBenchmark: !!weightedBenchmarks?.weightedPullUp?.current,
  dipBenchmark: !!weightedBenchmarks?.weightedDip?.current,
  })
  
  // [selection-compression-fix] TASK 7: Log compression fix context
  const compressionSkillLabels = skillsForSession
    ? skillsForSession.map(function(s) { return s.skill + '(' + s.expressionMode + ')'; })
    : undefined;
  console.log('[selection-compression-fix] Session selection context:', {
    dayFocus: day.focus,
    skillsForSession: compressionSkillLabels,
    hasWeightedEquipment,
    selectedSkillsCount: selectedSkills?.length || 0,
    primaryGoal,
  });
  
  // ==========================================================================
  // [constraint-balance] TASK A/B: REBALANCED constraint-aware selection
  // Constraints should NOT suppress skill work - they should restructure it safely
  // ==========================================================================
  
  // Check if we can actually find viable direct skill exercises for this goal
  // [exercise-selection] TASK B: Expanded pool search - include strength exercises with transfer
  const potentialDirectSkillPool = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
    .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(primaryGoal.toLowerCase())))
    .filter(e => hasRequiredEquipment(e, equipment || []))
  
  // [exercise-selection] TASK B: Also check strength exercises that transfer to goal
  const potentialStrengthSupport = availableStrength
    .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(primaryGoal.toLowerCase())))
    .filter(e => hasRequiredEquipment(e, equipment || []))
  
  // [constraint-balance] TASK A: CHANGED BEHAVIOR
  // skill_density_deficit should NOT trigger downgrade - it means "increase frequency"
  // Only TRULY limiting constraints should cause downgrade (e.g., injury, recovery)
  const isTrulyLimitingConstraint = constraintType && (
    constraintType.includes('recovery') ||
    constraintType.includes('fatigue') ||
    constraintType.includes('injury')
  )
  
  // [constraint-balance] TASK A: Only downgrade if BOTH:
  // 1. There's a true limiting constraint (not just low exposure)
  // 2. AND there are zero viable skill exercises
  const mustDowngradeToSupport = isTrulyLimitingConstraint && 
    potentialDirectSkillPool.length === 0 && 
    potentialStrengthSupport.length === 0
  
  // [exercise-selection] TASK B: Log exercise tier analysis
  console.log('[exercise-selection] Exercise pool analysis:', {
    primaryGoal,
    dayFocus: day.focus,
    constraintType: constraintType || 'none',
    tier1_directSkill: potentialDirectSkillPool.length,
    tier2_strengthSupport: potentialStrengthSupport.length,
    tier3_generalAvailable: availableStrength.length,
    isTrulyLimiting: isTrulyLimitingConstraint,
    mustDowngrade: mustDowngradeToSupport,
  })
  
  if (mustDowngradeToSupport) {
    console.log('[constraint-session-downgrade] Detected truly constrained session:', {
      constraintType,
      primaryGoal,
      dayFocus: day.focus,
      directSkillPoolSize: potentialDirectSkillPool.length,
      strengthSupportPoolSize: potentialStrengthSupport.length,
      reason: 'true_limiting_constraint_with_empty_pools',
    })
  }
  
  // ==========================================================================
  // [selection-influence-audit] TASK F: Log athlete data influence on selection
  // ==========================================================================
  console.log('[selection-influence-audit]', {
    dayNumber: day.dayNumber,
    dayFocus: day.focus,
    primaryGoal,
    // Input influence tracking
    hasSkillsForSession: !!(skillsForSession && skillsForSession.length > 0),
    skillsForSessionCount: skillsForSession?.length || 0,
    skillsToExpress: skillsForSession?.map(s => s.skill).slice(0, 3) || [],
    experienceLevel,
    // Pool analysis
    tier1_skillPoolSize: potentialDirectSkillPool.length,
    tier2_strengthSupportSize: potentialStrengthSupport.length,
    availableSkillsTotal: availableSkills.length,
    availableStrengthTotal: availableStrength.length,
    // Constraint influence
    hasConstraint: !!constraintType,
    constraintType: constraintType || 'none',
    mustDowngrade: mustDowngradeToSupport,
    // Equipment influence
    equipmentCount: equipment.length,
    hasWeightedEquipment,
  })
  
  // ==========================================================================
  // Selection based on day focus
  // ==========================================================================
  
  // 1. SKILL DAYS - Lead with skill work (unless constrained)
  // [exercise-trace] TASK 2/5: Thread trace context through selection
  // [selection-compression-fix] ISSUE A/B: Now uses skillsForSession for ranking
  // TASK 1-D: If mustDowngradeToSupport, convert to support session path
  if ((day.focus === 'push_skill' || day.focus === 'pull_skill' || day.focus === 'skill_density') && !mustDowngradeToSupport) {
    
    // [selection-compression-fix] ISSUE B: Find exercises for ALL skills in session allocation
    const sessionSkillsToExpress = skillsForSession && skillsForSession.length > 0
      ? skillsForSession
      : [{ skill: primaryGoal, expressionMode: 'primary' as const, weight: 1 }]
    
    // Primary skill exercise from session allocation
    const primarySkillAlloc = sessionSkillsToExpress.find(s => s.expressionMode === 'primary')
    if (primarySkillAlloc) {
      // Find skill exercises that transfer to the allocated primary skill
      const skillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
        .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(primarySkillAlloc.skill.toLowerCase())))
      
      // Score and rank candidates, then apply doctrine scoring
      // [PHASE 4] Doctrine integration - applies DB-backed scoring modifiers
      const baseScoredCandidates = skillCandidates.map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsToExpress, day.focus, hasWeightedEquipment)
      }))
      const scoredCandidates = applyDoctrineToPool(baseScoredCandidates, day.focus)
      
      const primarySkill = scoredCandidates[0]?.exercise || selectByLevel(goalExercises.filter(e => e.category === 'skill'), experienceLevel)
      
      if (primarySkill) {
        addExercise(primarySkill, `Primary ${primarySkillAlloc.skill} skill work`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'primary_skill_direct',
          sessionRole: 'skill_primary',
          expressionMode: 'direct_intensity',
          influencingSkills: [{ skillId: primarySkillAlloc.skill, influence: 'primary', expressionMode: 'direct' }],
          candidatePoolSize: skillCandidates.length,
        })
        
        // Track rejected alternatives
        scoredCandidates.slice(1, 4).forEach(c => {
          trackRejection(c.exercise.id, c.exercise.name, 'lower_score', `Score: ${c.score}`)
        })
      }
    }
    
    // [selection-compression-fix] ISSUE B: Technical/secondary skill expression
    const technicalSkillAlloc = sessionSkillsToExpress.find(s => s.expressionMode === 'technical')
    if (technicalSkillAlloc && technicalSkillAlloc.skill !== primarySkillAlloc?.skill) {
      // Find exercises for the technical skill (may be different from primary!)
      const techSkillCandidates = [...availableSkills, ...availableStrength]
        .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(technicalSkillAlloc.skill.toLowerCase())))
        .filter(e => !usedIds.has(e.id))
      
      // [PHASE 4] Doctrine integration for technical skill
      const baseScoredTech = techSkillCandidates.map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsToExpress, day.focus, hasWeightedEquipment)
      }))
      const scoredTech = applyDoctrineToPool(baseScoredTech, day.focus)
      
      if (scoredTech[0]) {
        addExercise(scoredTech[0].exercise, `Technical work for ${technicalSkillAlloc.skill}`, undefined, undefined, 'Moderate intensity', 'standalone', {
          primarySelectionReason: 'secondary_skill_technical',
          sessionRole: 'skill_secondary',
          expressionMode: 'technical_focus',
          influencingSkills: [{ skillId: technicalSkillAlloc.skill, influence: 'secondary', expressionMode: 'technical' }],
          candidatePoolSize: techSkillCandidates.length,
        })
        console.log('[selected-skill-exposure] Technical skill expressed:', technicalSkillAlloc.skill)
      }
    } else if (day.focus === 'skill_density') {
      // Fallback for density days - add secondary skill from same goal
      const skills = goalExercises.filter(e => e.category === 'skill' && !usedIds.has(e.id))
      if (skills.length > 0) {
        const secondarySkill = selectByLevel(skills, experienceLevel)
        if (secondarySkill) {
          addExercise(secondarySkill, 'Additional skill density', undefined, undefined, 'Moderate intensity', 'standalone', {
            primarySelectionReason: 'primary_skill_technical',
            sessionRole: 'skill_secondary',
            expressionMode: 'technical_focus',
            influencingSkills: [{ skillId: primaryGoal, influence: 'secondary', expressionMode: 'technical' }],
            candidatePoolSize: skills.length,
          })
        }
      }
    }
    
    // [selection-compression-fix] ISSUE F: Doctrine-backed strength support
    // Prefer support that specifically helps the session's allocated skills
    const allSessionSkills = sessionSkillsToExpress.map(s => s.skill)
    let strengthPicked = false
    
    for (const skill of allSessionSkills) {
      if (strengthPicked) break
      const doctrineExercises = getDoctrineBackedExercisesForSkill(skill, availableStrength)
      for (const { exercise, doctrineSource } of doctrineExercises) {
        if (!usedIds.has(exercise.id) && canAddMore(exercise, 'standalone')) {
          addExercise(exercise, `Doctrine-backed support for ${skill}`, undefined, undefined, undefined, 'standalone', {
            primarySelectionReason: 'doctrine_recommended',
            sessionRole: 'strength_support',
            expressionMode: 'strength_support',
            influencingSkills: [{ skillId: skill, influence: 'selected', expressionMode: 'support' }],
            doctrineSource: { doctrineSource, triggeringSkill: skill, doctrineType: 'support' },
            candidatePoolSize: doctrineExercises.length,
          })
          strengthPicked = true
          console.log('[selection-compression-fix] Doctrine-backed support won over generic:', exercise.id)
          break
        }
      }
    }
    
    // Fallback to generic goal-based strength if no doctrine match
    if (!strengthPicked) {
      const primaryStrength = goalExercises.filter(e => e.category === 'strength')
      const strengthPick = selectByLevel(primaryStrength, experienceLevel) ||
        availableStrength.find(e => e.transferTo?.includes(primaryGoal))
      
      if (strengthPick) {
        addExercise(strengthPick, `Supports ${primaryGoal} development`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'selected_skill_support',
          sessionRole: 'strength_support',
          expressionMode: 'strength_support',
          influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
          candidatePoolSize: primaryStrength.length,
        })
      }
    }
  }
  
  // 2. STRENGTH DAYS
  // [exercise-trace] TASK 2/3: Thread weighted decision trace
  // [selection-compression-fix] ISSUE D/E: Improved weighted movement win conditions
  if (day.focus === 'push_strength' || day.focus === 'pull_strength') {
    const isPush = day.focus === 'push_strength'
    const isHeavyDay = day.targetIntensity === 'high'
    
    // [weighted-win-logic] ISSUE D: Check all conditions for weighted to win
    const hasBenchmarks = weightedBenchmarks && (isPush ? weightedBenchmarks.weightedDip : weightedBenchmarks.weightedPullUp)
    const hasLoadableEquipment = hasWeightedEquipment
    const sessionRoleSupportsWeighted = true // Strength days always support weighted
    const recoveryAllowsWeighted = day.targetIntensity !== 'low' // Not a recovery day
    
    // [weighted-win-logic] Calculate if weighted should win
    const weightedShouldWin = hasLoadableEquipment && (hasBenchmarks || hasLoadableEquipment) && 
                              sessionRoleSupportsWeighted && recoveryAllowsWeighted
    
    console.log('[weighted-win-logic] Strength day decision:', {
      isPush,
      isHeavyDay,
      hasBenchmarks: !!hasBenchmarks,
      hasLoadableEquipment,
      weightedShouldWin,
      targetIntensity: day.targetIntensity,
    })
    
    // Primary movement - prefer weighted when conditions met
    let primaryAdded = false
    
    if (weightedShouldWin) {
      // [weighted-win-logic] ISSUE E: Weighted wins - use weighted variant
      const primaryWeighted = isPush
        ? availableStrength.find(e => e.id === 'weighted_dip')
        : availableStrength.find(e => e.id === 'weighted_pull_up')
      
      if (primaryWeighted) {
        addExercise(
          primaryWeighted,
          isHeavyDay ? 'Primary strength builder (heavy)' : 'Primary strength builder (volume)',
          isHeavyDay ? 4 : 3,
          isHeavyDay ? '3-5' : '6-8',
          undefined,
          'standalone',
          {
            primarySelectionReason: 'strength_foundation',
            sessionRole: 'strength_primary',
            expressionMode: isHeavyDay ? 'direct_intensity' : 'volume_accumulation',
            influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
            candidatePoolSize: availableStrength.length,
            weightedConsidered: true,
            weightedEligible: true,
            weightedBlockerReason: undefined,
          }
        )
        primaryAdded = true
        console.log('[weighted-win-logic] Weighted movement WON:', primaryWeighted.id)
      }
    }
    
    // Fallback to bodyweight if weighted didn't win
    if (!primaryAdded) {
      const bodyweightPrimary = isPush
        ? availableStrength.find(e => e.id === 'dip' || e.id === 'push_up')
        : availableStrength.find(e => e.id === 'pull_up')
      
      if (bodyweightPrimary) {
        const blockerReason: WeightedBlockerReason | undefined = !hasLoadableEquipment 
          ? 'no_loadable_equipment' 
          : !hasBenchmarks 
            ? 'no_benchmark_confidence'
            : !recoveryAllowsWeighted
              ? 'limiter_recovery_favored_unloaded'
              : undefined
        
        addExercise(
          bodyweightPrimary,
          isHeavyDay ? 'Primary strength builder (bodyweight)' : 'Bodyweight strength volume',
          isHeavyDay ? 4 : 3,
          isHeavyDay ? '5-8' : '8-12',
          undefined,
          'standalone',
          {
            primarySelectionReason: 'strength_foundation',
            sessionRole: 'strength_primary',
            expressionMode: isHeavyDay ? 'direct_intensity' : 'volume_accumulation',
            influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
            candidatePoolSize: availableStrength.length,
            weightedConsidered: true,
            weightedEligible: !!hasBenchmarks,
            weightedBlockerReason: blockerReason,
          }
        )
        primaryAdded = true
        console.log('[weighted-win-logic] Bodyweight movement won, blocker:', blockerReason)
      }
    }
    
    // [selection-compression-fix] ISSUE B: Secondary strength for session skills
    const sessionSkillsToSupport = skillsForSession && skillsForSession.length > 0
      ? skillsForSession
      : [{ skill: primaryGoal, expressionMode: 'primary' as const, weight: 1 }]
    
    // Try to add doctrine-backed strength support for each skill
    for (const skillAlloc of sessionSkillsToSupport) {
      if (selected.length >= maxExercises - 2) break // Leave room for skill exposure
      
      const doctrineExercises = getDoctrineBackedExercisesForSkill(skillAlloc.skill, availableStrength)
      for (const { exercise, doctrineSource } of doctrineExercises) {
        if (!usedIds.has(exercise.id) && canAddMore(exercise, 'standalone')) {
          addExercise(exercise, `Strength support for ${skillAlloc.skill}`, undefined, undefined, undefined, 'standalone', {
            primarySelectionReason: 'doctrine_recommended',
            sessionRole: 'strength_support',
            expressionMode: 'strength_support',
            influencingSkills: [{ skillId: skillAlloc.skill, influence: 'selected', expressionMode: 'support' }],
            doctrineSource: { doctrineSource, triggeringSkill: skillAlloc.skill, doctrineType: 'support' },
            candidatePoolSize: doctrineExercises.length,
          })
          console.log('[selected-skill-exposure] Strength support for selected skill:', skillAlloc.skill)
          break
        }
      }
    }
    
    // Fallback: Goal-specific strength if no doctrine match found
    const goalStrength = goalExercises.filter(e => 
      e.category === 'strength' && !usedIds.has(e.id)
    )
    if (goalStrength.length > 0 && selected.length < maxExercises - 1) {
      const strengthPick = selectByLevel(goalStrength, experienceLevel)
      if (strengthPick) {
        addExercise(strengthPick, `Skill-specific ${isPush ? 'push' : 'pull'} strength`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'selected_skill_support',
          sessionRole: 'strength_support',
          expressionMode: 'strength_support',
          influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
          candidatePoolSize: goalStrength.length,
        })
      }
    }
    
    // Add skill exposure if this is a primary day - use session allocation
    if (day.isPrimary) {
      const primarySkillAlloc = sessionSkillsToSupport.find(s => s.expressionMode === 'primary') || sessionSkillsToSupport[0]
      const skillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
        .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(primarySkillAlloc?.skill.toLowerCase() || primaryGoal.toLowerCase())))
        .filter(e => !usedIds.has(e.id))
      
      if (skillCandidates.length > 0) {
        const skillPick = selectByLevel(skillCandidates, experienceLevel) || skillCandidates[0]
        addExercise(skillPick, 'Skill exposure alongside strength work', undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'primary_skill_technical',
          sessionRole: 'skill_secondary',
          expressionMode: 'technical_focus',
          influencingSkills: [{ skillId: primarySkillAlloc?.skill || primaryGoal, influence: 'primary', expressionMode: 'rotation' }],
          candidatePoolSize: skillCandidates.length,
        })
      }
    }
  }
  
  // 3. MIXED/SUPPORT DAYS
  // [selection-compression-fix] ISSUE C: Make session roles create real differences
  if (day.focus === 'mixed_upper' || day.focus === 'support_recovery') {
    const isLightDay = day.focus === 'support_recovery' || day.targetIntensity === 'low'
    
    // [selection-compression-fix] Use session skill allocation for variety
    const sessionSkillsForMixed = skillsForSession && skillsForSession.length > 0
      ? skillsForSession
      : [{ skill: primaryGoal, expressionMode: 'support' as const, weight: 1 }]
    
    const mixedDaySkillLabels = sessionSkillsForMixed.map(function(s) {
      return s.skill + '(' + s.expressionMode + ')';
    });
    console.log('[selection-compression-fix] Mixed day selection:', {
      isLightDay,
      sessionSkills: mixedDaySkillLabels,
    });
    
    // [selection-compression-fix] ISSUE F: Prefer skill-specific accessories over generic
    // First, try to find push/pull work that supports session skills
    const allAccessory = [...availableAccessory, ...availableStrength.filter(e => e.fatigueCost <= 3)]
    
    // Find push work that aligns with session skills
    const pushCandidates = allAccessory
      .filter(e => e.movementPattern?.includes('push') || e.movementPattern === 'horizontal_push' || e.movementPattern === 'vertical_push')
      .map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsForMixed, day.focus, hasWeightedEquipment),
        skillAligned: sessionSkillsForMixed.some(s => e.transferTo?.some(t => t.toLowerCase().includes(s.skill.toLowerCase())))
      }))
      .sort((a, b) => {
        // Prefer skill-aligned exercises
        if (a.skillAligned && !b.skillAligned) return -1
        if (!a.skillAligned && b.skillAligned) return 1
        return b.score - a.score
      })
    
    if (pushCandidates.length > 0) {
      const pick = isLightDay 
        ? pushCandidates.find(c => c.exercise.fatigueCost <= 2) || pushCandidates[0]
        : pushCandidates[0]
      
      const influencingSkill = sessionSkillsForMixed.find(s => 
        pick.exercise.transferTo?.some(t => t.toLowerCase().includes(s.skill.toLowerCase()))
      )
      
      addExercise(pick.exercise, pick.skillAligned ? `Push work supporting ${influencingSkill?.skill || 'skills'}` : 'Balanced push work', isLightDay ? 3 : 4, undefined, undefined, 'standalone', {
        primarySelectionReason: pick.skillAligned ? 'selected_skill_support' : 'session_role_fill',
        sessionRole: 'accessory',
        expressionMode: isLightDay ? 'rotation_light' : 'strength_support',
        influencingSkills: influencingSkill ? [{ skillId: influencingSkill.skill, influence: 'selected', expressionMode: 'support' }] : [],
        candidatePoolSize: pushCandidates.length,
      })
      
      if (pick.skillAligned) {
        console.log('[selected-skill-exposure] Mixed day push aligned to skill:', influencingSkill?.skill)
      }
    }
    
    // Find pull work that aligns with session skills
    const pullCandidates = allAccessory
      .filter(e => e.movementPattern?.includes('pull') || e.movementPattern === 'horizontal_pull' || e.movementPattern === 'vertical_pull')
      .filter(e => !usedIds.has(e.id))
      .map(e => ({
        exercise: e,
        score: scoreExerciseForSession(e, sessionSkillsForMixed, day.focus, hasWeightedEquipment),
        skillAligned: sessionSkillsForMixed.some(s => e.transferTo?.some(t => t.toLowerCase().includes(s.skill.toLowerCase())))
      }))
      .sort((a, b) => {
        if (a.skillAligned && !b.skillAligned) return -1
        if (!a.skillAligned && b.skillAligned) return 1
        return b.score - a.score
      })
    
    if (pullCandidates.length > 0) {
      const pick = isLightDay 
        ? pullCandidates.find(c => c.exercise.fatigueCost <= 2) || pullCandidates[0]
        : pullCandidates[0]
      
      const influencingSkill = sessionSkillsForMixed.find(s => 
        pick.exercise.transferTo?.some(t => t.toLowerCase().includes(s.skill.toLowerCase()))
      )
      
      addExercise(pick.exercise, pick.skillAligned ? `Pull work supporting ${influencingSkill?.skill || 'skills'}` : 'Balanced pull work', isLightDay ? 3 : 4, undefined, undefined, 'standalone', {
        primarySelectionReason: pick.skillAligned ? 'selected_skill_support' : 'session_role_fill',
        sessionRole: 'accessory',
        expressionMode: isLightDay ? 'rotation_light' : 'strength_support',
        influencingSkills: influencingSkill ? [{ skillId: influencingSkill.skill, influence: 'selected', expressionMode: 'support' }] : [],
        candidatePoolSize: pullCandidates.length,
      })
      
      if (pick.skillAligned) {
        console.log('[selected-skill-exposure] Mixed day pull aligned to skill:', influencingSkill?.skill)
      }
    }
    
    // Add skill exposure at reduced intensity - use session skill allocation
    if (!isLightDay) {
      const primarySkillAlloc = sessionSkillsForMixed.find(s => s.expressionMode === 'primary' || s.expressionMode === 'support')
      const skillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
        .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(primarySkillAlloc?.skill.toLowerCase() || primaryGoal.toLowerCase())))
        .filter(e => !usedIds.has(e.id))
      
      if (skillCandidates.length > 0) {
        const skillPick = selectByLevel(skillCandidates, experienceLevel) || skillCandidates[0]
        addExercise(skillPick, 'Skill maintenance', 3, undefined, 'Moderate intensity', 'standalone', {
          primarySelectionReason: 'recovery_rotation',
          sessionRole: 'skill_secondary',
          expressionMode: 'rotation_light',
          influencingSkills: [{ skillId: primarySkillAlloc?.skill || primaryGoal, influence: 'selected', expressionMode: 'rotation' }],
          candidatePoolSize: skillCandidates.length,
        })
      }
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
  
  // =========================================================================
  // [exercise-expression] TASK 2/3/4: MULTI-SKILL EXPRESSION FROM DOCTRINE
  // This is where selected skills beyond the primary goal get expressed
  // =========================================================================
  
  if (skillsForSession && skillsForSession.length > 0 && selected.length < maxExercises) {
    const allocationLabels = skillsForSession.map(function(s) {
      return s.skill + '(' + s.expressionMode + ')';
    });
    console.log('[exercise-expression] Processing skill allocations:', {
      dayFocus: day.focus,
      allocations: allocationLabels,
      currentExerciseCount: selected.length,
      maxExercises,
    });
    
    // Track which skills we've already expressed via primary goal
    const expressedSkillIds = new Set<string>([primaryGoal])
    
    // Process each skill allocation by expression mode
    for (const allocation of skillsForSession) {
      if (selected.length >= maxExercises) break
      if (expressedSkillIds.has(allocation.skill)) continue
      
      // Get doctrine support mapping for this skill
      const supportMapping = getSupportMapping(allocation.skill as SkillCarryover)
      
      console.log('[exercise-expression] Processing skill allocation:', {
        skill: allocation.skill,
        expressionMode: allocation.expressionMode,
        weight: allocation.weight,
        hasDoctrine: !!supportMapping,
        directExercises: supportMapping?.directSupportExercises?.slice(0, 3) || [],
      })
      
      // Find exercises for this skill based on expression mode
      let skillExercise: Exercise | undefined
      let exerciseReason = ''
      
      if (allocation.expressionMode === 'primary' || allocation.expressionMode === 'technical') {
        // Direct or technical expression: use direct support exercises from doctrine
        if (supportMapping) {
          for (const exerciseId of supportMapping.directSupportExercises) {
            if (usedIds.has(exerciseId)) continue
            skillExercise = [...availableSkills, ...availableStrength].find(e => e.id === exerciseId)
            if (skillExercise && canAddMore(skillExercise)) {
              exerciseReason = allocation.expressionMode === 'primary'
                ? `Direct ${supportMapping.displayName} work`
                : `Technical ${supportMapping.displayName} practice`
              break
            }
          }
        }
        
        // Fallback to transfer-based lookup
        if (!skillExercise) {
          skillExercise = [...availableSkills, ...availableStrength].find(e => 
            !usedIds.has(e.id) && 
            e.transferTo.includes(allocation.skill) &&
            canAddMore(e)
          )
          if (skillExercise) {
            exerciseReason = `${allocation.skill} skill development`
          }
        }
      } else if (allocation.expressionMode === 'support') {
        // Support expression: use accessory support exercises from doctrine
        if (supportMapping) {
          for (const exerciseId of supportMapping.accessorySupportExercises) {
            if (usedIds.has(exerciseId)) continue
            skillExercise = [...availableAccessory, ...availableStrength].find(e => e.id === exerciseId)
            if (skillExercise && canAddMore(skillExercise)) {
              exerciseReason = `Support work for ${supportMapping.displayName}`
              break
            }
          }
          
          // Also try limiter-based support
          if (!skillExercise && supportMapping.commonLimiters.length > 0) {
            const limiter = supportMapping.commonLimiters[0]
            for (const exerciseId of limiter.exerciseIds) {
              if (usedIds.has(exerciseId)) continue
              skillExercise = [...availableAccessory, ...availableStrength, ...availableCore].find(e => e.id === exerciseId)
              if (skillExercise && canAddMore(skillExercise)) {
                exerciseReason = `${limiter.description} (${supportMapping.displayName} prerequisite)`
                break
              }
            }
          }
        }
        
        // Fallback to transfer-based lookup for accessories
        if (!skillExercise) {
          skillExercise = availableAccessory.find(e => 
            !usedIds.has(e.id) && 
            e.transferTo.includes(allocation.skill) &&
            canAddMore(e)
          )
          if (skillExercise) {
            exerciseReason = `${allocation.skill} support work`
          }
        }
      } else if (allocation.expressionMode === 'warmup') {
        // Warmup expression: handled in warm-up generation, skip here
        continue
      }
      
      // Add the selected exercise if found
      if (skillExercise) {
        const added = addExercise(skillExercise, exerciseReason)
        if (added) {
          expressedSkillIds.add(allocation.skill)
          console.log('[exercise-expression] Added skill exercise:', {
            skill: allocation.skill,
            exerciseId: skillExercise.id,
            expressionMode: allocation.expressionMode,
            reason: exerciseReason,
          })
        }
      } else {
        console.log('[exercise-expression] Could not find exercise for skill:', {
          skill: allocation.skill,
          expressionMode: allocation.expressionMode,
          searched: supportMapping?.directSupportExercises?.length || 0,
        })
      }
    }
    
    // Log final expression summary
    console.log('[exercise-expression] Session skill expression summary:', {
      dayFocus: day.focus,
      allocatedSkills: skillsForSession.length,
      expressedSkills: expressedSkillIds.size,
      unexpressedSkills: skillsForSession
        .filter(s => !expressedSkillIds.has(s.skill))
        .map(s => s.skill),
      exerciseCount: selected.length,
    })
  }
  
  // ==========================================================================
  // TASK 1-B/C: Constraint-safe fallback for empty sessions
  // If we reach here with no exercises AND were supposed to downgrade, build support session
  // ==========================================================================
  if (selected.length === 0 && mustDowngradeToSupport) {
    console.log('[constraint-session-fallback] Building constraint-safe support session:', {
      primaryGoal,
      dayFocus: day.focus,
      constraintType,
    })
    
    // Deterministic fallback chain for constrained Planche/skill sessions
    // TASK 1-C: Priority order - support strength > limiter correction > core > general
    
    // Step 1: Goal-relevant support strength
    const goalSupportExercises = availableStrength.filter(e => 
      e.transferTo?.some(t => t.toLowerCase().includes(primaryGoal.toLowerCase())) ||
      (primaryGoal === 'planche' && (e.movementFamily === 'push' || e.tags?.includes('straight_arm'))) ||
      (primaryGoal === 'front_lever' && (e.movementFamily === 'pull' || e.tags?.includes('straight_arm'))) ||
      (primaryGoal === 'muscle_up' && (e.movementFamily === 'pull' || e.movementFamily === 'push'))
    )
    
    for (const ex of goalSupportExercises.slice(0, 2)) {
      if (selected.length >= maxExercises - 1) break
      const added = addExercise(ex, `[Constrained] ${primaryGoal} support strength`, undefined, undefined, undefined, 'standalone', {
        primarySelectionReason: 'constraint_fallback_support',
        sessionRole: 'strength_support',
        expressionMode: 'strength_support',
        influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'support' }],
        limiterInfluence: constraintType || undefined,
      })
      if (added) {
        console.log('[constraint-session-fallback] Added support exercise:', ex.id)
      }
    }
    
    // Step 2: If still empty, add limiter-correction exercises
    if (selected.length === 0) {
      const limiterExercises = availableAccessory.filter(e => 
        e.tags?.includes('prehab') || 
        e.tags?.includes('mobility') ||
        e.transferTo?.some(t => t.toLowerCase().includes(primaryGoal.toLowerCase()))
      )
      
      for (const ex of limiterExercises.slice(0, 2)) {
        if (selected.length >= maxExercises - 1) break
        addExercise(ex, `[Constrained] Limiter correction for ${primaryGoal}`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_limiter',
          sessionRole: 'support_volume',
          expressionMode: 'prehab_focus',
          limiterInfluence: constraintType || undefined,
        })
      }
    }
    
    // Step 3: If still empty, add goal-relevant core
    if (selected.length === 0) {
      const coreForGoal = availableCore.filter(e => 
        e.transferTo?.some(t => t.toLowerCase().includes(primaryGoal.toLowerCase())) ||
        (primaryGoal === 'planche' && e.tags?.includes('compression')) ||
        (primaryGoal === 'front_lever' && e.tags?.includes('anti_extension'))
      )
      
      for (const ex of coreForGoal.slice(0, 2)) {
        if (selected.length >= maxExercises - 1) break
        addExercise(ex, `[Constrained] Core for ${primaryGoal}`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_core',
          sessionRole: 'core',
          expressionMode: 'core_focus',
        })
      }
    }
    
    // Step 4: Final fallback - any goal-compatible strength
    if (selected.length === 0 && availableStrength.length > 0) {
      const fallbackStrength = availableStrength
        .sort((a, b) => (b.carryover || 0) - (a.carryover || 0))
        .slice(0, 3)
      
      for (const ex of fallbackStrength) {
        if (selected.length >= maxExercises - 1) break
        addExercise(ex, `[Constrained] General strength fallback`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_general',
          sessionRole: 'strength_support',
          expressionMode: 'strength_support',
        })
      }
    }
    
    console.log('[constraint-session-final]', {
      primaryGoal,
      dayFocus: day.focus,
      constraintType,
      originalExpression: 'direct',
      downgradedExpression: 'support',
      finalExerciseCount: selected.length,
      exercises: selected.map(e => e.exercise.id),
    })
  }
  
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
  
  // ==========================================================================
  // TASK 1-B: Last resort minimum viable session before return
  // If we somehow still have no exercises, build minimal support session
  // ==========================================================================
  if (selected.length === 0) {
    console.log('[constraint-session-fallback] Final fallback - building minimum viable session:', {
      primaryGoal,
      dayFocus: day.focus,
      constraintType: constraintType || 'none',
      mustDowngradeToSupport,
    })
    
    // Try to add any available strength exercises
    const lastResortStrength = availableStrength
      .filter(e => !usedIds.has(e.id))
      .sort((a, b) => (b.carryover || 0) - (a.carryover || 0))
      .slice(0, 3)
    
    for (const ex of lastResortStrength) {
      if (selected.length >= maxExercises) break
      addExercise(ex, `[Last Resort] General strength`, undefined, undefined, undefined, 'standalone', {
        primarySelectionReason: 'constraint_fallback_general',
        sessionRole: 'strength_support',
        expressionMode: 'strength_support',
      })
    }
    
    // If still empty, add any core exercises
    if (selected.length === 0) {
      const lastResortCore = availableCore
        .filter(e => !usedIds.has(e.id))
        .slice(0, 2)
      
      for (const ex of lastResortCore) {
        if (selected.length >= maxExercises) break
        addExercise(ex, `[Last Resort] Core work`, undefined, undefined, undefined, 'standalone', {
          primarySelectionReason: 'constraint_fallback_core',
          sessionRole: 'core',
          expressionMode: 'core_focus',
        })
      }
    }
    
    console.log('[constraint-session-final] Last resort session built:', {
      primaryGoal,
      constraintType: constraintType || 'none',
      finalExerciseCount: selected.length,
      exercises: selected.map(e => e.exercise.id),
    })
  }
  
  // TASK 6: Final deduplication pass to remove any duplicate exercises
  const deduplicatedSelected = dedupeSelectedExercises(selected)
  if (deduplicatedSelected.length !== selected.length) {
    console.log('[exercise-selector] TASK 6: Removed', selected.length - deduplicatedSelected.length, 'duplicate exercises')
  }
  
  // ==========================================================================
  // [skill-exposure-check] TASK A/B: Minimum skill floor enforcement
  // Even under constraints, skill sessions MUST include direct skill work
  // ==========================================================================
  const isSkillFocusedDay = day.focus === 'push_skill' || day.focus === 'pull_skill' || day.focus === 'skill_density'
  const directSkillExercises = deduplicatedSelected.filter(e => 
    e.exercise.category === 'skill' || 
    e.selectionContext?.sessionRole === 'skill_primary' ||
    e.selectionContext?.sessionRole === 'skill_secondary'
  )
  const progressionExercises = deduplicatedSelected.filter(e =>
    e.exercise.progressionLevel !== undefined ||
    e.selectionContext?.expressionMode === 'direct_intensity' ||
    e.selectionContext?.expressionMode === 'technical_focus'
  )
  
  console.log('[skill-exposure-check] Session skill analysis:', {
    dayFocus: day.focus,
    primaryGoal,
    totalExercises: deduplicatedSelected.length,
    directSkillCount: directSkillExercises.length,
    progressionCount: progressionExercises.length,
    isSkillFocusedDay,
    constraintType: constraintType || 'none',
    meetsMinimumSkillFloor: !isSkillFocusedDay || directSkillExercises.length >= 2,
    recommendation: directSkillExercises.length < 2 && isSkillFocusedDay 
      ? 'NEEDS_MORE_SKILL_WORK' 
      : 'ADEQUATE',
  })
  
  // [skill-exposure-check] TASK A: Enforce minimum 2 skill exercises on skill days
  if (isSkillFocusedDay && directSkillExercises.length < 2 && !mustDowngradeToSupport) {
    console.log('[skill-exposure-check] Enforcing minimum skill floor - attempting to add skill exercises')
    
    // Find unused skill exercises that transfer to goal
    const unusedSkillCandidates = [...availableSkills, ...goalExercises.filter(e => e.category === 'skill')]
      .filter(e => !usedIds.has(e.id))
      .filter(e => e.transferTo?.some(t => t.toLowerCase().includes(primaryGoal.toLowerCase())))
      .slice(0, 2 - directSkillExercises.length)
    
    for (const candidate of unusedSkillCandidates) {
      if (deduplicatedSelected.length >= maxExercises) break
      addExercise(candidate, `[Skill Floor] Direct ${primaryGoal} work`, undefined, undefined, undefined, 'standalone', {
        primarySelectionReason: 'skill_floor_enforcement',
        sessionRole: 'skill_secondary',
        expressionMode: 'technical_focus',
        influencingSkills: [{ skillId: primaryGoal, influence: 'primary', expressionMode: 'direct' }],
      })
      console.log('[skill-exposure-check] Added skill floor exercise:', candidate.id)
    }
  }
  
  // [session-assembly] ISSUE C: Log warning if exercise pool is too thin
  if (deduplicatedSelected.length === 0) {
    console.warn('[session-assembly] WARNING: selectMainExercises returned 0 exercises after all fallbacks', {
      dayFocus: day.focus,
      primaryGoal,
      availableSkillsCount: availableSkills.length,
      availableStrengthCount: availableStrength.length,
      goalExercisesCount: goalExercises.length,
      maxExercises,
      constraintType: constraintType || 'none',
    })
  } else if (deduplicatedSelected.length < Math.min(3, maxExercises)) {
    console.log('[session-assembly] Note: Session has fewer exercises than typical', {
      selected: deduplicatedSelected.length,
      expected: Math.min(3, maxExercises),
      dayFocus: day.focus,
      primaryGoal,
    })
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
// SESSION RESCUE: FALLBACK EXERCISE SELECTION
// =============================================================================

/**
 * STEP B/C: Deterministic fallback when primary selection returns empty.
 * This function attempts to build a minimal valid session backbone using
 * progressively relaxed criteria while respecting equipment and day focus.
 */
export function buildFallbackSelectionForSession(
  dayFocus: DayFocus,
  primaryGoal: PrimaryGoal,
  equipment: EquipmentType[],
  sessionMinutes: number,
  experienceLevel: ExperienceLevel
): { main: SelectedExercise[]; rescuePath: string; wasRescued: boolean } {
  console.log('[session-rescue] Starting fallback resolution:', {
    dayFocus,
    primaryGoal,
    equipmentCount: equipment.length,
    sessionMinutes,
    experienceLevel,
  })
  
  const rescueResult: SelectedExercise[] = []
  let rescuePath = 'none'
  
  // Get all available exercises filtered by equipment
  const availableStrength = STRENGTH_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableAccessory = ACCESSORY_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  const availableCore = CORE_EXERCISES_POOL.filter(e => hasRequiredEquipment(e, equipment))
  const availableSkills = SKILL_EXERCISES.filter(e => hasRequiredEquipment(e, equipment))
  
  console.log('[session-rescue] Available exercise pools:', {
    strength: availableStrength.length,
    accessory: availableAccessory.length,
    core: availableCore.length,
    skills: availableSkills.length,
  })
  
  // STEP H: Helper to convert Exercise to SelectedExercise with ALL required fields
  // This ensures rescued exercises have complete metadata for downstream mapping/validation
  const toSelectedExercise = (ex: Exercise, reason: string): SelectedExercise => {
    // Compute safe defaults based on exercise category
    const category = ex.category?.toLowerCase() || 'strength'
    let defaultSets = 3
    let defaultRepsOrTime = '8-12'
    
    // Category-specific defaults for proper prescriptions
    if (category === 'skill' || category === 'hold') {
      defaultSets = 3
      defaultRepsOrTime = ex.time || '10-20s'
    } else if (category === 'core' || category === 'compression') {
      defaultSets = 3
      defaultRepsOrTime = ex.time || ex.reps || '30s'
    } else if (category === 'mobility' || category === 'flexibility') {
      defaultSets = 2
      defaultRepsOrTime = ex.time || '30-60s'
    } else if (category === 'strength' || category === 'push' || category === 'pull') {
      defaultSets = ex.defaultSets || 3
      defaultRepsOrTime = ex.defaultRepsOrTime || ex.reps || '6-10'
    } else if (category === 'accessory') {
      defaultSets = 3
      defaultRepsOrTime = ex.defaultRepsOrTime || ex.reps || '10-15'
    }
    
    return {
      exercise: {
        ...ex,
        // Ensure all required exercise fields have safe defaults
        id: ex.id || `rescue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: ex.name || 'Unknown Exercise',
        category: ex.category || 'strength',
        movementPattern: ex.movementPattern || 'compound',
        primaryMuscles: ex.primaryMuscles || ['general'],
        equipment: ex.equipment || ['floor'],
        neuralDemand: ex.neuralDemand ?? 2,
        fatigueCost: ex.fatigueCost ?? 2,
        transferTo: ex.transferTo || [],
        defaultSets: ex.defaultSets || defaultSets,
        defaultRepsOrTime: ex.defaultRepsOrTime || defaultRepsOrTime,
      },
      sets: ex.sets || ex.defaultSets || defaultSets,
      repsOrTime: ex.reps || ex.time || ex.defaultRepsOrTime || defaultRepsOrTime,
      isOverrideable: true,
      selectionReason: `[Rescue] ${reason}`,
      selectionTrace: {
        exerciseId: ex.id,
        exerciseName: ex.name,
        reason: 'fallback_rescue' as const,
        expressionMode: 'support',
        sessionRole: 'support_heavy',
        source: { type: 'doctrine', ruleName: 'session_rescue' },
      }
    }
  }
  
  // RESCUE PATH 1: Goal-specific support work for the day focus
  const goalFocusMap: Record<PrimaryGoal, string[]> = {
    planche: ['straight_arm', 'push', 'shoulder'],
    front_lever: ['pull', 'scapular', 'lat'],
    handstand_pushup: ['vertical_push', 'shoulder', 'push'],
    muscle_up: ['pull', 'push', 'transition'],
    back_lever: ['pull', 'straight_arm', 'scapular'],
    iron_cross: ['rings', 'straight_arm', 'shoulder'],
    v_sit: ['core', 'compression', 'hip_flexor'],
    manna: ['compression', 'shoulder', 'core'],
    human_flag: ['oblique', 'shoulder', 'lat'],
    full_rom_hspu: ['vertical_push', 'shoulder', 'mobility'],
    one_arm_pull_up: ['pull', 'grip', 'lat'],
    one_arm_push_up: ['push', 'core', 'horizontal_push'],
    pistol_squat: ['leg', 'mobility', 'balance'],
    nordic_curl: ['hamstring', 'eccentric', 'leg'],
    reverse_nordic: ['quad', 'mobility', 'leg'],
    general: ['compound', 'strength', 'core'],
    strength: ['compound', 'strength', 'core'],
    endurance: ['conditioning', 'core', 'compound'],
    skill: ['skill', 'strength', 'core'],
  }
  
  const targetTags = goalFocusMap[primaryGoal] || ['compound', 'strength', 'core']
  
  // Try to find exercises matching goal focus
  const goalMatchingExercises = [...availableStrength, ...availableAccessory].filter(ex => {
    const exTags = [
      ex.category?.toLowerCase(),
      ex.movementFamily?.toLowerCase(),
      ...(ex.tags || []).map(t => t.toLowerCase())
    ].filter(Boolean)
    return targetTags.some(tag => exTags.some(et => et.includes(tag)))
  })
  
  if (goalMatchingExercises.length >= 2) {
    rescuePath = 'goal_support'
    const selected = goalMatchingExercises.slice(0, Math.min(4, goalMatchingExercises.length))
    rescueResult.push(...selected.map(ex => toSelectedExercise(ex, `Goal-aligned ${primaryGoal} support`)))
    console.log('[session-rescue-success] Found goal-matching exercises:', {
      count: rescueResult.length,
      exercises: rescueResult.map(e => e.exercise.name),
    })
  }
  
  // RESCUE PATH 2: Day focus compatible work
  if (rescueResult.length < 2) {
    const focusCompatible = availableStrength.filter(ex => {
      if (dayFocus.includes('push')) return ex.category === 'push' || ex.movementFamily === 'push'
      if (dayFocus.includes('pull')) return ex.category === 'pull' || ex.movementFamily === 'pull'
      if (dayFocus.includes('skill')) return true // Any strength work supports skill days
      if (dayFocus === 'support_recovery') return ex.intensity !== 'high'
      return true
    })
    
    if (focusCompatible.length >= 2) {
      rescuePath = 'focus_compatible'
      const additional = focusCompatible
        .filter(ex => !rescueResult.some(r => r.exercise.id === ex.id))
        .slice(0, Math.max(0, 4 - rescueResult.length))
      rescueResult.push(...additional.map(ex => toSelectedExercise(ex, `Focus-compatible ${dayFocus}`)))
    }
  }
  
  // RESCUE PATH 3: General strength/accessory fallback
  if (rescueResult.length < 2) {
    rescuePath = 'general_strength'
    const generalExercises = [...availableStrength, ...availableAccessory]
      .filter(ex => !rescueResult.some(r => r.exercise.id === ex.id))
      .sort((a, b) => (b.carryover || 0) - (a.carryover || 0))
      .slice(0, Math.max(0, 4 - rescueResult.length))
    
    rescueResult.push(...generalExercises.map(ex => toSelectedExercise(ex, 'General strength fallback')))
  }
  
  // RESCUE PATH 4: Core work as minimum viable session
  if (rescueResult.length < 2 && availableCore.length > 0) {
    rescuePath = 'core_minimum'
    const coreExercises = availableCore
      .filter(ex => !rescueResult.some(r => r.exercise.id === ex.id))
      .slice(0, Math.max(0, 3 - rescueResult.length))
    
    rescueResult.push(...coreExercises.map(ex => toSelectedExercise(ex, 'Core fallback')))
  }
  
  const wasRescued = rescueResult.length > 0
  
  // ==========================================================================
  // TASK 1-F: Pre-return structural validator for fallback-built items
  // Ensure all rescued exercises have required fields for mapping/validation
  // ==========================================================================
  const validatedResult = rescueResult.filter((item, idx) => {
    const ex = item.exercise
    const hasRequiredFields = 
      ex.id && typeof ex.id === 'string' && ex.id.length > 0 &&
      ex.name && typeof ex.name === 'string' && ex.name.length > 0 &&
      ex.category && typeof ex.category === 'string' &&
      typeof item.sets === 'number' && item.sets > 0 &&
      item.repsOrTime && typeof item.repsOrTime === 'string'
    
    if (!hasRequiredFields) {
      console.warn('[session-rescue-item-repair] Malformed rescue item at index', idx, {
        hasId: !!ex.id,
        hasName: !!ex.name,
        hasCategory: !!ex.category,
        hasSets: typeof item.sets === 'number' && item.sets > 0,
        hasReps: !!item.repsOrTime,
      })
      
      // Attempt repair rather than drop
      if (!ex.id) item.exercise.id = `rescue_repaired_${Date.now()}_${idx}`
      if (!ex.name) item.exercise.name = 'Rescue Exercise'
      if (!ex.category) item.exercise.category = 'strength'
      if (typeof item.sets !== 'number' || item.sets <= 0) item.sets = 3
      if (!item.repsOrTime) item.repsOrTime = '8-12'
      
      console.log('[session-rescue-item-repaired]', {
        index: idx,
        repairedId: item.exercise.id,
        repairedName: item.exercise.name,
      })
    }
    
    return true // Keep all items after repair
  })
  
  console.log(wasRescued ? '[session-rescue-success]' : '[session-rescue-failed]', {
    dayFocus,
    primaryGoal,
    rescuePath,
    finalMainCount: validatedResult.length,
    equipmentCount: equipment.length,
    exercises: validatedResult.map(e => e.exercise.name),
  })
  
  return { main: validatedResult, rescuePath, wasRescued }
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

function selectCooldownLegacy(minutes: number): SelectedExercise[] {
  var selected: SelectedExercise[] = [];
  var shoulderStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'shoulder_stretch'; });
  if (shoulderStretch) {
    selected.push({
      exercise: shoulderStretch,
      sets: 1,
      repsOrTime: '30s each',
      isOverrideable: true,
      selectionReason: 'Shoulder recovery',
    });
  }
  if (minutes >= 5) {
    var wristStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'wrist_stretches'; });
    if (wristStretch) {
      selected.push({
        exercise: wristStretch,
        sets: 1,
        repsOrTime: '30s each position',
        isOverrideable: true,
        selectionReason: 'Wrist care for calisthenics',
      });
    }
  }
  if (minutes >= 8) {
    var latStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'lat_stretch'; });
    if (latStretch) {
      selected.push({
        exercise: latStretch,
        sets: 1,
        repsOrTime: '30s each',
        isOverrideable: true,
        selectionReason: 'Lat recovery',
      });
    }
    var chestStretch = COOLDOWN_EXERCISES.find(function(e) { return e.id === 'chest_stretch'; });
    if (chestStretch) {
      selected.push({
        exercise: chestStretch,
        sets: 1,
        repsOrTime: '30s each',
        isOverrideable: true,
        selectionReason: 'Chest/front delt recovery',
      });
    }
  }
  return selected;
}

// =============================================================================
// [PHASE 9] PROGRESSION-AWARE EXERCISE SELECTION
// Current ability MUST outrank historical/identity level for exercise selection
// =============================================================================

/**
 * Maps canonical progression values to max allowed difficulty levels
 * This ensures exercises match CURRENT ability, not historical/identity level
 */
const PROGRESSION_TO_MAX_DIFFICULTY: Record<string, DifficultyLevel[]> = {
  // Planche progressions - current ability determines ceiling
  'none': ['beginner'],
  'lean': ['beginner', 'intermediate'],
  'tuck': ['beginner', 'intermediate'],
  'tuck_planche': ['beginner', 'intermediate'],
  'advanced_tuck': ['beginner', 'intermediate', 'advanced'],
  'adv_tuck_planche': ['beginner', 'intermediate', 'advanced'],
  'straddle': ['beginner', 'intermediate', 'advanced', 'elite'],
  'straddle_planche': ['beginner', 'intermediate', 'advanced', 'elite'],
  'half_lay': ['beginner', 'intermediate', 'advanced', 'elite'],
  'full': ['beginner', 'intermediate', 'advanced', 'elite'],
  'full_planche': ['beginner', 'intermediate', 'advanced', 'elite'],
  
  // Front lever progressions
  'tuck_fl': ['beginner', 'intermediate'],
  'tuck_front_lever': ['beginner', 'intermediate'],
  'advanced_tuck_fl': ['beginner', 'intermediate', 'advanced'],
  'adv_tuck_fl': ['beginner', 'intermediate', 'advanced'],
  'straddle_fl': ['beginner', 'intermediate', 'advanced', 'elite'],
  'straddle_front_lever': ['beginner', 'intermediate', 'advanced', 'elite'],
  'half_lay_fl': ['beginner', 'intermediate', 'advanced', 'elite'],
  'full_front_lever': ['beginner', 'intermediate', 'advanced', 'elite'],
}

/**
 * Filter exercises to only those appropriate for the current progression level
 * [PHASE 9] Current ability beats historical/identity level
 */
function filterByCurrentProgression(
  exercises: Exercise[],
  currentProgression: string | null | undefined,
  skillId: string
): Exercise[] {
  if (!currentProgression || currentProgression === 'unknown') {
    // No current progression data - fall back to intermediate max
    console.log('[phase9-progression-filter] No current progression, using intermediate max', { skillId })
    return exercises.filter(e => 
      e.difficultyLevel === 'beginner' || e.difficultyLevel === 'intermediate'
    )
  }
  
  const allowedDifficulties = PROGRESSION_TO_MAX_DIFFICULTY[currentProgression.toLowerCase()] || 
    ['beginner', 'intermediate'] // Conservative default
  
  const filtered = exercises.filter(e => allowedDifficulties.includes(e.difficultyLevel))
  
  console.log('[phase9-progression-filter]', {
    skillId,
    currentProgression,
    allowedDifficulties,
    totalCandidates: exercises.length,
    filteredCandidates: filtered.length,
    filteredOut: exercises.filter(e => !allowedDifficulties.includes(e.difficultyLevel)).map(e => e.id),
  })
  
  // If filtering removed all options, allow at least intermediate
  if (filtered.length === 0) {
    console.log('[phase9-progression-filter] Filter too aggressive, allowing intermediate', { skillId })
    return exercises.filter(e => 
      e.difficultyLevel === 'beginner' || e.difficultyLevel === 'intermediate'
    )
  }
  
  return filtered
}

/**
 * [PHASE 9] Select exercise by CURRENT progression level, not broad experience
 * Current ability outranks historical training age / experience level
 */
function selectByLevel(exercises: Exercise[], level: ExperienceLevel, currentProgression?: string | null): Exercise | undefined {
  // [PHASE 9] If we have current progression, filter first by current ability
  let filteredExercises = exercises
  if (currentProgression && currentProgression !== 'unknown' && currentProgression !== 'none') {
    // Determine skill from exercise pool
    const skillIds = exercises.flatMap(e => e.transferTo || [])
    const primarySkill = skillIds[0] || 'unknown'
    filteredExercises = filterByCurrentProgression(exercises, currentProgression, primarySkill)
  }
  
  // Sort by neural demand (lower = easier)
  const sorted = filteredExercises.slice().sort((a, b) => a.neuralDemand - b.neuralDemand)
  
  // [PHASE 9] Experience level now affects WHICH exercise within the filtered pool
  // Not which tier of exercise is allowed - that's determined by current progression
  if (level === 'beginner') {
    return sorted[0]
  }
  if (level === 'intermediate') {
    return sorted[Math.floor(sorted.length / 2)]
  }
  // Advanced users get highest within their current progression tier
  return sorted[sorted.length - 1]
}

function adjustSetsForLevel(defaultSets: number, level: ExperienceLevel): number {
  if (level === 'beginner') {
    return Math.max(2, defaultSets - 1);
  }
  if (level === 'advanced') {
    return Math.min(5, defaultSets + 1);
  }
  return defaultSets;
}

function adjustRepsForLevel(defaultReps: string, level: ExperienceLevel): string {
  return defaultReps;
}

export function getPrescriptionAwarePrescription(
  exercise: Exercise,
  experienceLevel: ExperienceLevel,
  primaryGoal: string,
  currentProgression?: string,
  fatigueState?: 'fresh' | 'moderate' | 'fatigued',
  recentPerformance?: { avgRPE?: number; completionRate?: number; improving?: boolean }
): { sets: number; repsOrTime: string; note?: string; prescriptionMode: PrescriptionMode; supportsWeightedLoad?: boolean } {
  // Detect prescription mode
  const isWeighted = exercise.id.includes('weighted') || exercise.name.toLowerCase().includes('weighted');
  const prescriptionMode = detectPrescriptionMode(
    exercise.category,
    exercise.isIsometric ?? false,
    exercise.neuralDemand,
    exercise.fatigueCost,
    isWeighted,
    exercise.id
  )
  
  // Build athlete context
  const athleteContext: PrescriptionAthleteContext = {
    experienceLevel: experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite',
    currentProgression,
    recentPerformance,
    fatigueState,
  }
  
  // For skill work, use advanced skill prescription rules (TASK 2)
  if (prescriptionMode === 'skill_hold' || prescriptionMode === 'skill_cluster') {
    const skillRules = getSkillPrescriptionRules(
      primaryGoal,
      experienceLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite',
      currentProgression
    )
    
    // Calculate sets in recommended range
    const [minSets, maxSets] = skillRules.setsRange
    let sets = Math.round((minSets + maxSets) / 2)
    if (experienceLevel === 'beginner') sets = minSets
    if (experienceLevel === 'advanced') sets = maxSets
    if (fatigueState === 'fatigued') sets = Math.max(minSets, sets - 1)
    
    // Calculate hold time in recommended range
    const [minHold, maxHold] = skillRules.holdSecondsRange
    let holdSeconds = Math.round((minHold + maxHold) / 2)
    if (experienceLevel === 'beginner') holdSeconds = minHold
    if (experienceLevel === 'advanced') holdSeconds = maxHold
    
    // Build coaching note from rules
    const note = skillRules.intensityNotes[0] || 'Quality over quantity'
    
    return {
      sets,
      repsOrTime: `${holdSeconds}s hold`,
      note,
      prescriptionMode,
    }
  }
  
  // For weighted strength, use carryover-aware prescription (TASK 3)
  // WEIGHTED LOAD PR: Now includes actual prescribed load
  if (prescriptionMode === 'weighted_strength') {
    const prescription = resolvePrescription(prescriptionMode, athleteContext)
    const formatted = formatPrescription(prescription)
    
    // Determine the weighted exercise type
    const exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row' | null = 
      exercise.id.includes('weighted_pull') ? 'weighted_pull_up' :
      exercise.id.includes('weighted_dip') ? 'weighted_dip' :
      exercise.id.includes('weighted_push') ? 'weighted_push_up' :
      exercise.id.includes('weighted_row') ? 'weighted_row' : null
    
    // If this is a recognized weighted exercise, calculate load
    // Note: This function doesn't have direct access to benchmarks - that happens at session assembly level
    // The prescribedLoad field will be populated by getWeightedStrengthPrescriptionForSkill when called with benchmarks
    
    return {
      sets: formatted.sets,
      repsOrTime: formatted.repsOrTime,
      note: formatted.note,
      prescriptionMode,
      // Signal that this exercise supports weighted load prescription
      supportsWeightedLoad: exerciseType !== null,
    }
  }
  
  // For other modes, use base prescription contract
  const prescription = resolvePrescription(prescriptionMode, athleteContext)
  const formatted = formatPrescription(prescription)
  
  return {
    sets: formatted.sets,
    repsOrTime: formatted.repsOrTime,
    note: formatted.note,
    prescriptionMode,
  }
}

/**
 * Adjust weighted strength prescription for skill carryover (TASK 3).
 * 
 * WEIGHTED LOAD PR UPDATE: Now includes actual prescribed load based on benchmarks.
 */
export function getWeightedStrengthPrescriptionForSkill(
  exercise: Exercise,
  primarySkill: string,
  experienceLevel: ExperienceLevel,
  currentWeightedPull?: { load: number; reps: number; unit?: 'lbs' | 'kg' },
  currentWeightedDip?: { load: number; reps: number; unit?: 'lbs' | 'kg' },
  prWeightedPull?: { load: number; reps: number; unit?: 'lbs' | 'kg' },
  prWeightedDip?: { load: number; reps: number; unit?: 'lbs' | 'kg' }
): { 
  sets: number
  repsOrTime: string
  note: string
  prescribedLoad?: SelectedExercise['prescribedLoad']
} | null {
  // Get carryover recommendations
  const carryovers = getWeightedStrengthCarryover(
    primarySkill,
    currentWeightedPull,
    currentWeightedDip,
    prWeightedPull,
    prWeightedDip
  )
  
  // Find matching carryover for this exercise
  const exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row' | null = 
    exercise.id.includes('weighted_pull') ? 'weighted_pull_up' :
    exercise.id.includes('weighted_dip') ? 'weighted_dip' :
    exercise.id.includes('weighted_push') ? 'weighted_push_up' :
    exercise.id.includes('weighted_row') ? 'weighted_row' : null
  
  if (!exerciseType) return null
  
  const carryover = carryovers.find(c => c.exercise === exerciseType)
  if (!carryover || !carryover.shouldInclude) return null
  
  const adj = carryover.prescriptionAdjustments
  const baseSets = experienceLevel === 'beginner' ? 3 : 4
  
  // WEIGHTED LOAD PR: Calculate actual prescribed load
  const currentBenchmark: WeightedBenchmark | null = 
    exerciseType === 'weighted_pull_up' && currentWeightedPull 
      ? { addedWeight: currentWeightedPull.load, reps: currentWeightedPull.reps, unit: currentWeightedPull.unit } 
      : exerciseType === 'weighted_dip' && currentWeightedDip
        ? { addedWeight: currentWeightedDip.load, reps: currentWeightedDip.reps, unit: currentWeightedDip.unit }
        : null
  
  const prBenchmark: WeightedPRBenchmark | null =
    exerciseType === 'weighted_pull_up' && prWeightedPull
      ? { load: prWeightedPull.load, reps: prWeightedPull.reps, unit: prWeightedPull.unit || 'lbs' }
      : exerciseType === 'weighted_dip' && prWeightedDip
        ? { load: prWeightedDip.load, reps: prWeightedDip.reps, unit: prWeightedDip.unit || 'lbs' }
        : null
  
  // Determine prescription mode based on rep range target
  const avgTargetReps = Math.round((adj.repsRange[0] + adj.repsRange[1]) / 2)
  const prescriptionMode: WeightedPrescriptionMode = 
    avgTargetReps <= 5 ? 'strength_primary' :
    avgTargetReps <= 6 ? 'strength_support' :
    avgTargetReps <= 10 ? 'volume_support' : 'hypertrophy'
  
  // Estimate the actual load to use
  const loadPrescription = estimateWeightedLoadPrescription(
    exerciseType,
    prescriptionMode,
    currentBenchmark,
    prBenchmark
  )
  
  // Log the estimation in dev mode
  logWeightedLoadEstimation(exerciseType, prescriptionMode, loadPrescription)
  
  // Build the note with load info if available
  let note = `RPE ${adj.intensityTarget}. ${carryover.carryoverRationale.split('.')[0]}.`
  if (loadPrescription.loadBasis !== 'no_data' && loadPrescription.prescribedLoad > 0) {
    const loadDisplay = formatWeightedLoadDisplay(loadPrescription)
    note = `${loadDisplay} @ RPE ${adj.intensityTarget}. ${carryover.carryoverRationale.split('.')[0]}.`
  }
  
  return {
    sets: baseSets + adj.setsModifier,
    repsOrTime: `${adj.repsRange[0]}-${adj.repsRange[1]} reps`,
    note,
    prescribedLoad: loadPrescription.loadBasis !== 'no_data' ? {
      load: loadPrescription.prescribedLoad,
      unit: loadPrescription.loadUnit,
      basis: loadPrescription.loadBasis,
      confidenceLevel: loadPrescription.confidenceLevel,
      estimated1RM: loadPrescription.estimated1RM ?? undefined,
      targetReps: loadPrescription.targetReps,
      intensityBand: loadPrescription.intensityBand,
      notes: loadPrescription.notes.length > 0 ? loadPrescription.notes : undefined,
    } : undefined,
  }
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
