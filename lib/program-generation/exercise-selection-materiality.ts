/**
 * EXERCISE SELECTION MATERIALITY ENGINE
 * 
 * PURPOSE:
 * Provides slot-aware, context-driven exercise ranking that makes selections
 * feel personalized rather than generic. Each exercise is scored based on
 * its materiality to the athlete's actual truth (goals, equipment, progression,
 * joint cautions, training history).
 * 
 * DESIGN:
 * - Single authoritative scoring path for each slot type
 * - Consumes canonical athlete truth from upstream contracts
 * - Produces deterministic, inspectable rankings with reason codes
 * - Slot-aware: different weights for different session roles
 * 
 * NON-GOALS:
 * - Does NOT replace hard eligibility filters (equipment, progression gates)
 * - Does NOT change prescription logic
 * - Does NOT modify session structure
 */

import type { Exercise, EquipmentType } from '../adaptive-exercise-pool'
import type { PrimaryGoal, ExperienceLevel } from '../program-service'
import { 
  SKILL_SUPPORT_MAPPINGS, 
  getSupportMapping, 
  getDirectSupportExercises,
  isExercisePrimarySupportFor,
} from '../doctrine/skill-support-mappings'

// =============================================================================
// TYPES
// =============================================================================

export type SlotType = 
  | 'direct_skill'           // Primary skill expression slot
  | 'main_strength'          // Primary strength/support slot
  | 'secondary_skill'        // Secondary skill or technical slot
  | 'assistance'             // Assistance/accessory slot
  | 'support_carryover'      // Support/carryover work
  | 'prehab_joint_care'      // Prehab/joint-aware slot
  | 'density_finisher'       // Optional finisher/density slot

export type MaterialityReasonCode = 
  | 'direct_primary_progression'
  | 'direct_secondary_progression'
  | 'support_for_skill_component'
  | 'carryover_strength_builder'
  | 'joint_friendly_substitution'
  | 'equipment_best_fit'
  | 'schedule_complexity_fit'
  | 'recovery_limited_choice'
  | 'recent_rotation_avoided'
  | 'weighted_integration_choice'
  | 'flexibility_support_choice'
  | 'current_progression_aligned'
  | 'prerequisite_skill_builder'
  | 'generic_fallback'

export interface MaterialityScoreBreakdown {
  primaryGoalAlignment: number      // 0-30: How directly it serves primary goal
  secondaryGoalSupport: number      // 0-15: Support for secondary goal
  currentProgressionFit: number     // 0-25: Aligned to CURRENT ability, not ceiling
  equipmentOptimality: number       // 0-15: Best use of available equipment
  jointCautionSafety: number        // 0-10: Safe for declared joint cautions
  carryoverValue: number            // 0-15: Transfer value to target skills
  recentHistoryPenalty: number      // -10-0: Penalty for over-repetition
  scheduleComplexityFit: number     // 0-10: Appropriate for weekly volume
  trainingStyleMatch: number        // 0-10: Matches hybrid/pure/weighted style
  doctrineBoost: number             // 0-15: Doctrine DB preference boost
}

export interface ExerciseMaterialityScore {
  exerciseId: string
  exerciseName: string
  totalScore: number
  breakdown: MaterialityScoreBreakdown
  primaryReasonCode: MaterialityReasonCode
  secondaryReasonCodes: MaterialityReasonCode[]
  confidenceLevel: 'high' | 'medium' | 'low'
  slotSuitability: Record<SlotType, number>  // 0-100 suitability per slot
  auditNotes: string[]
}

export interface SlotMaterialityRanking {
  slotType: SlotType
  rankedCandidates: ExerciseMaterialityScore[]
  selectedExerciseId: string | null
  selectionConfidence: 'high' | 'medium' | 'low'
  auditSummary: {
    totalCandidates: number
    top3: Array<{ id: string; score: number; reason: MaterialityReasonCode }>
    primaryReasonForSelection: MaterialityReasonCode
    equipmentInfluencedRanking: boolean
    jointCautionInfluencedRanking: boolean
    progressionInfluencedRanking: boolean
    doctrineInfluencedRanking: boolean
  }
}

export interface ExerciseMaterialityContext {
  // Athlete truth
  primaryGoal: PrimaryGoal | string
  secondaryGoal: string | null
  selectedSkills: string[]
  experienceLevel: ExperienceLevel
  equipmentAvailable: EquipmentType[]
  jointCautions: string[]
  
  // Progression truth
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
  }> | null
  
  // Training style truth
  trainingStyle: 'pure_skill' | 'hybrid' | 'weighted_integrated' | 'minimalist'
  hasWeightedEquipment: boolean
  
  // Schedule truth
  weeklySessionCount: number
  sessionComplexityBudget: 'low' | 'medium' | 'high'
  
  // History truth (if available)
  recentExerciseHistory?: string[]  // Exercise IDs used in last 1-2 weeks
  
  // Doctrine truth
  doctrinePreferredExercises?: string[]
  doctrineAvoidExercises?: string[]
  doctrineCarryoverRules?: Array<{
    sourceSkill: string
    targetSkill: string
    carryoverType: 'direct' | 'indirect' | 'prerequisite'
    preferredExercises: string[]
  }>
}

// =============================================================================
// SLOT WEIGHT CONFIGURATIONS
// =============================================================================

const SLOT_WEIGHT_PROFILES: Record<SlotType, Partial<Record<keyof MaterialityScoreBreakdown, number>>> = {
  direct_skill: {
    primaryGoalAlignment: 1.5,      // Most important for skill slots
    currentProgressionFit: 1.3,     // Must match current ability
    carryoverValue: 0.8,
    equipmentOptimality: 1.0,
  },
  main_strength: {
    primaryGoalAlignment: 1.2,
    carryoverValue: 1.4,            // Strength should transfer well
    equipmentOptimality: 1.3,       // Important to use available equipment well
    trainingStyleMatch: 1.2,
  },
  secondary_skill: {
    secondaryGoalSupport: 1.5,      // Secondary goal matters most here
    currentProgressionFit: 1.2,
    carryoverValue: 1.0,
  },
  assistance: {
    carryoverValue: 1.3,
    jointCautionSafety: 1.2,        // Should be safe
    scheduleComplexityFit: 1.2,     // Should not bloat session
  },
  support_carryover: {
    carryoverValue: 1.5,            // Carryover is the point
    primaryGoalAlignment: 1.2,
    jointCautionSafety: 1.1,
  },
  prehab_joint_care: {
    jointCautionSafety: 2.0,        // Safety is paramount
    carryoverValue: 0.8,
    scheduleComplexityFit: 1.0,
  },
  density_finisher: {
    scheduleComplexityFit: 1.3,
    recentHistoryPenalty: 1.5,      // Should rotate more
    jointCautionSafety: 1.2,
  },
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Score an exercise candidate for materiality in the given context.
 * Returns a comprehensive score breakdown with reason codes.
 */
export function scoreExerciseMateriality(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): ExerciseMaterialityScore {
  const breakdown: MaterialityScoreBreakdown = {
    primaryGoalAlignment: 0,
    secondaryGoalSupport: 0,
    currentProgressionFit: 0,
    equipmentOptimality: 0,
    jointCautionSafety: 0,
    carryoverValue: 0,
    recentHistoryPenalty: 0,
    scheduleComplexityFit: 0,
    trainingStyleMatch: 0,
    doctrineBoost: 0,
  }
  
  const auditNotes: string[] = []
  const reasonCodes: MaterialityReasonCode[] = []
  
  // =========================================================================
  // 1. PRIMARY GOAL ALIGNMENT (0-30)
  // =========================================================================
  const primaryGoalNorm = normalizeSkillKey(context.primaryGoal)
  const exerciseTransfers = exercise.transferTo || []
  const exerciseCategory = exercise.category || 'accessory'
  
  // Direct skill match
  if (exerciseTransfers.some(t => normalizeSkillKey(t) === primaryGoalNorm)) {
    breakdown.primaryGoalAlignment = 30
    reasonCodes.push('direct_primary_progression')
    auditNotes.push(`Direct transfer to ${context.primaryGoal}`)
  } 
  // Same category as primary goal
  else if (exerciseCategory === 'skill' && context.primaryGoal) {
    const skillMatch = checkSkillCategoryMatch(exercise, context.primaryGoal)
    breakdown.primaryGoalAlignment = skillMatch ? 22 : 10
    if (skillMatch) {
      auditNotes.push(`Category match for ${context.primaryGoal}`)
    }
  }
  // Support mapping match
  else if (isExercisePrimarySupportFor(exercise.id, context.primaryGoal)) {
    breakdown.primaryGoalAlignment = 25
    reasonCodes.push('support_for_skill_component')
    auditNotes.push(`Primary support exercise for ${context.primaryGoal}`)
  }
  // General strength carryover
  else if (exerciseCategory === 'strength' && hasStrengthCarryover(exercise, context.primaryGoal)) {
    breakdown.primaryGoalAlignment = 18
    reasonCodes.push('carryover_strength_builder')
    auditNotes.push('Strength carryover to primary goal')
  }
  // Generic baseline
  else {
    breakdown.primaryGoalAlignment = 5
  }
  
  // =========================================================================
  // 2. SECONDARY GOAL SUPPORT (0-15)
  // =========================================================================
  if (context.secondaryGoal) {
    const secondaryNorm = normalizeSkillKey(context.secondaryGoal)
    if (exerciseTransfers.some(t => normalizeSkillKey(t) === secondaryNorm)) {
      breakdown.secondaryGoalSupport = 15
      reasonCodes.push('direct_secondary_progression')
      auditNotes.push(`Direct transfer to secondary goal ${context.secondaryGoal}`)
    } else if (isExercisePrimarySupportFor(exercise.id, context.secondaryGoal)) {
      breakdown.secondaryGoalSupport = 12
      auditNotes.push(`Support for secondary goal ${context.secondaryGoal}`)
    } else if (hasIndirectCarryover(exercise, context.secondaryGoal)) {
      breakdown.secondaryGoalSupport = 8
    }
  }
  
  // =========================================================================
  // 3. CURRENT PROGRESSION FIT (0-25)
  // =========================================================================
  // This is CRITICAL: we must prefer exercises at CURRENT working level,
  // NOT historical ceiling.
  const progressionFit = scoreProgressionFit(exercise, context)
  breakdown.currentProgressionFit = progressionFit.score
  if (progressionFit.notes.length > 0) {
    auditNotes.push(...progressionFit.notes)
  }
  if (progressionFit.score >= 20) {
    reasonCodes.push('current_progression_aligned')
  }
  
  // =========================================================================
  // 4. EQUIPMENT OPTIMALITY (0-15)
  // =========================================================================
  const equipmentScore = scoreEquipmentFit(exercise, context)
  breakdown.equipmentOptimality = equipmentScore.score
  if (equipmentScore.notes.length > 0) {
    auditNotes.push(...equipmentScore.notes)
  }
  if (equipmentScore.isBestFit) {
    reasonCodes.push('equipment_best_fit')
  }
  
  // =========================================================================
  // 5. JOINT CAUTION SAFETY (0-10)
  // =========================================================================
  const jointSafetyScore = scoreJointSafety(exercise, context.jointCautions)
  breakdown.jointCautionSafety = jointSafetyScore.score
  if (jointSafetyScore.notes.length > 0) {
    auditNotes.push(...jointSafetyScore.notes)
  }
  if (jointSafetyScore.isSubstitute) {
    reasonCodes.push('joint_friendly_substitution')
  }
  
  // =========================================================================
  // 6. CARRYOVER VALUE (0-15)
  // =========================================================================
  const carryoverScore = scoreCarryoverValue(exercise, context)
  breakdown.carryoverValue = carryoverScore.score
  if (carryoverScore.notes.length > 0) {
    auditNotes.push(...carryoverScore.notes)
  }
  
  // =========================================================================
  // 7. RECENT HISTORY PENALTY (-10-0)
  // =========================================================================
  if (context.recentExerciseHistory && context.recentExerciseHistory.length > 0) {
    const recentCount = context.recentExerciseHistory.filter(id => id === exercise.id).length
    if (recentCount >= 3) {
      breakdown.recentHistoryPenalty = -10
      auditNotes.push('Over-repeated in recent history (-10)')
      reasonCodes.push('recent_rotation_avoided')
    } else if (recentCount >= 2) {
      breakdown.recentHistoryPenalty = -5
      auditNotes.push('Repeated recently (-5)')
    }
  }
  
  // =========================================================================
  // 8. SCHEDULE COMPLEXITY FIT (0-10)
  // =========================================================================
  const complexityScore = scoreScheduleComplexity(exercise, context)
  breakdown.scheduleComplexityFit = complexityScore.score
  if (complexityScore.notes.length > 0) {
    auditNotes.push(...complexityScore.notes)
  }
  if (complexityScore.isGoodFit) {
    reasonCodes.push('schedule_complexity_fit')
  }
  
  // =========================================================================
  // 9. TRAINING STYLE MATCH (0-10)
  // =========================================================================
  const styleScore = scoreTrainingStyleMatch(exercise, context)
  breakdown.trainingStyleMatch = styleScore.score
  if (styleScore.notes.length > 0) {
    auditNotes.push(...styleScore.notes)
  }
  if (styleScore.isWeightedMatch) {
    reasonCodes.push('weighted_integration_choice')
  }
  
  // =========================================================================
  // 10. DOCTRINE BOOST (0-15)
  // =========================================================================
  const doctrineScore = scoreDoctrinePreference(exercise, context)
  breakdown.doctrineBoost = doctrineScore.score
  if (doctrineScore.notes.length > 0) {
    auditNotes.push(...doctrineScore.notes)
  }
  
  // =========================================================================
  // CALCULATE TOTAL SCORE
  // =========================================================================
  const totalScore = 
    breakdown.primaryGoalAlignment +
    breakdown.secondaryGoalSupport +
    breakdown.currentProgressionFit +
    breakdown.equipmentOptimality +
    breakdown.jointCautionSafety +
    breakdown.carryoverValue +
    breakdown.recentHistoryPenalty +
    breakdown.scheduleComplexityFit +
    breakdown.trainingStyleMatch +
    breakdown.doctrineBoost
  
  // Determine primary reason code
  const primaryReasonCode = reasonCodes.length > 0 ? reasonCodes[0] : 'generic_fallback'
  
  // Calculate slot suitability scores
  const slotSuitability = calculateSlotSuitability(breakdown)
  
  // Determine confidence level
  const confidenceLevel = 
    totalScore >= 70 ? 'high' :
    totalScore >= 45 ? 'medium' : 'low'
  
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    totalScore,
    breakdown,
    primaryReasonCode,
    secondaryReasonCodes: reasonCodes.slice(1),
    confidenceLevel,
    slotSuitability,
    auditNotes,
  }
}

/**
 * Rank exercise candidates for a specific slot type.
 * Applies slot-specific weight adjustments and returns ordered results.
 */
export function rankCandidatesForSlot(
  candidates: Exercise[],
  slotType: SlotType,
  context: ExerciseMaterialityContext,
  maxResults: number = 10
): SlotMaterialityRanking {
  const weightProfile = SLOT_WEIGHT_PROFILES[slotType]
  
  // Score all candidates
  const scoredCandidates = candidates.map(exercise => {
    const baseScore = scoreExerciseMateriality(exercise, context)
    
    // Apply slot-specific weight adjustments
    let adjustedScore = 0
    for (const [key, value] of Object.entries(baseScore.breakdown)) {
      const weight = weightProfile[key as keyof MaterialityScoreBreakdown] || 1.0
      adjustedScore += value * weight
    }
    
    return {
      ...baseScore,
      totalScore: adjustedScore,
    }
  })
  
  // Sort by adjusted score
  scoredCandidates.sort((a, b) => b.totalScore - a.totalScore)
  
  // Take top results
  const rankedCandidates = scoredCandidates.slice(0, maxResults)
  
  // Build audit summary
  const selectedExerciseId = rankedCandidates.length > 0 ? rankedCandidates[0].exerciseId : null
  const top3 = rankedCandidates.slice(0, 3).map(c => ({
    id: c.exerciseId,
    score: Math.round(c.totalScore),
    reason: c.primaryReasonCode,
  }))
  
  // Determine what influenced the ranking
  const equipmentInfluenced = rankedCandidates.some(c => c.breakdown.equipmentOptimality >= 12)
  const jointCautionInfluenced = rankedCandidates.some(c => 
    c.secondaryReasonCodes.includes('joint_friendly_substitution'))
  const progressionInfluenced = rankedCandidates.some(c => 
    c.secondaryReasonCodes.includes('current_progression_aligned'))
  const doctrineInfluenced = rankedCandidates.some(c => c.breakdown.doctrineBoost >= 8)
  
  const selectionConfidence = 
    rankedCandidates.length > 0 && rankedCandidates[0].totalScore >= 50 ? 'high' :
    rankedCandidates.length > 0 && rankedCandidates[0].totalScore >= 30 ? 'medium' : 'low'
  
  return {
    slotType,
    rankedCandidates,
    selectedExerciseId,
    selectionConfidence,
    auditSummary: {
      totalCandidates: candidates.length,
      top3,
      primaryReasonForSelection: rankedCandidates[0]?.primaryReasonCode || 'generic_fallback',
      equipmentInfluencedRanking: equipmentInfluenced,
      jointCautionInfluencedRanking: jointCautionInfluenced,
      progressionInfluencedRanking: progressionInfluenced,
      doctrineInfluencedRanking: doctrineInfluenced,
    },
  }
}

/**
 * Select the best exercise for a slot, returning full audit trail.
 */
export function selectBestExerciseForSlot(
  candidates: Exercise[],
  slotType: SlotType,
  context: ExerciseMaterialityContext,
  usedIds: Set<string> = new Set()
): {
  selected: Exercise | null
  score: ExerciseMaterialityScore | null
  ranking: SlotMaterialityRanking
} {
  // Filter out already-used exercises
  const availableCandidates = candidates.filter(c => !usedIds.has(c.id))
  
  const ranking = rankCandidatesForSlot(availableCandidates, slotType, context, 20)
  
  if (ranking.rankedCandidates.length === 0) {
    return { selected: null, score: null, ranking }
  }
  
  const topScore = ranking.rankedCandidates[0]
  const selected = availableCandidates.find(c => c.id === topScore.exerciseId) || null
  
  return {
    selected,
    score: topScore,
    ranking,
  }
}

// =============================================================================
// HELPER SCORING FUNCTIONS
// =============================================================================

function normalizeSkillKey(skill: string): string {
  return skill.toLowerCase().replace(/_/g, '').replace(/-/g, '').replace(/\s+/g, '')
}

function checkSkillCategoryMatch(exercise: Exercise, primaryGoal: string): boolean {
  const goalNorm = normalizeSkillKey(primaryGoal)
  const exerciseIdNorm = normalizeSkillKey(exercise.id)
  const exerciseNameNorm = normalizeSkillKey(exercise.name)
  
  // Check if exercise name/id contains goal keywords
  return exerciseIdNorm.includes(goalNorm) || exerciseNameNorm.includes(goalNorm)
}

function hasStrengthCarryover(exercise: Exercise, primaryGoal: string): boolean {
  // Map strength exercises to skills they support
  const strengthSkillMap: Record<string, string[]> = {
    push: ['planche', 'hspu', 'handstand'],
    pull: ['front_lever', 'back_lever', 'muscle_up'],
    core: ['l_sit', 'v_sit', 'manna', 'planche', 'front_lever'],
    shoulder: ['hspu', 'handstand', 'planche'],
    back: ['front_lever', 'back_lever', 'muscle_up'],
  }
  
  const goalNorm = normalizeSkillKey(primaryGoal)
  const exercisePattern = exercise.movementPattern?.toLowerCase() || ''
  
  for (const [pattern, skills] of Object.entries(strengthSkillMap)) {
    if (exercisePattern.includes(pattern)) {
      return skills.some(s => normalizeSkillKey(s) === goalNorm)
    }
  }
  
  return false
}

function hasIndirectCarryover(exercise: Exercise, skill: string): boolean {
  const supportMapping = getSupportMapping(skill as any)
  if (!supportMapping) return false
  
  const allSupport = [
    ...supportMapping.directSupport,
    ...supportMapping.secondarySupport,
    ...(supportMapping.coreSupport || []),
    ...(supportMapping.mobilitySupport || []),
  ]
  
  return allSupport.some(s => 
    exercise.id.toLowerCase().includes(s.toLowerCase()) ||
    exercise.name.toLowerCase().includes(s.toLowerCase())
  )
}

function scoreProgressionFit(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): { score: number; notes: string[] } {
  const notes: string[] = []
  let score = 10 // Base score
  
  if (!context.currentWorkingProgressions) {
    return { score: 15, notes: ['No progression data - using neutral score'] }
  }
  
  // Check if exercise matches current progression for any selected skill
  for (const skill of context.selectedSkills) {
    const progression = context.currentWorkingProgressions[skill] || 
                       context.currentWorkingProgressions[normalizeSkillKey(skill)]
    
    if (!progression) continue
    
    const currentLevel = progression.currentWorkingProgression
    const historicalLevel = progression.historicalCeiling
    
    if (!currentLevel) continue
    
    // Check if exercise matches current working level
    const exerciseIdNorm = normalizeSkillKey(exercise.id)
    const currentLevelNorm = normalizeSkillKey(currentLevel)
    
    if (exerciseIdNorm.includes(currentLevelNorm)) {
      score = 25
      notes.push(`Matches current progression: ${currentLevel}`)
    } 
    // Check if we're being conservative (current != historical)
    else if (historicalLevel && currentLevel !== historicalLevel) {
      const historicalNorm = normalizeSkillKey(historicalLevel)
      if (exerciseIdNorm.includes(historicalNorm)) {
        // Exercise is at historical level but we should be at current
        score = 8
        notes.push(`At historical (${historicalLevel}) not current (${currentLevel}) - penalized`)
      }
    }
  }
  
  return { score, notes }
}

function scoreEquipmentFit(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): { score: number; notes: string[]; isBestFit: boolean } {
  const notes: string[] = []
  let score = 8 // Base score for exercises with no specific equipment needs
  let isBestFit = false
  
  const requiredEquipment = exercise.equipment || []
  
  // No equipment needed - good for minimalist
  if (requiredEquipment.length === 0 || requiredEquipment.includes('none')) {
    if (context.trainingStyle === 'minimalist') {
      score = 15
      notes.push('Bodyweight-only matches minimalist style')
      isBestFit = true
    } else {
      score = 10
    }
    return { score, notes, isBestFit }
  }
  
  // Check if we have the required equipment
  const hasRequired = requiredEquipment.every(eq => 
    context.equipmentAvailable.includes(eq as EquipmentType)
  )
  
  if (!hasRequired) {
    score = 0
    notes.push('Missing required equipment')
    return { score, notes, isBestFit }
  }
  
  // Bonus for using premium equipment effectively
  const premiumEquipment = ['rings', 'parallettes', 'weighted_belt', 'pull_up_bar']
  const usesPremium = requiredEquipment.some(eq => premiumEquipment.includes(eq))
  const hasPremium = premiumEquipment.some(eq => context.equipmentAvailable.includes(eq as EquipmentType))
  
  if (usesPremium && hasPremium) {
    score = 15
    notes.push('Effectively uses available premium equipment')
    isBestFit = true
  } else if (context.hasWeightedEquipment && exercise.id.includes('weighted')) {
    score = 14
    notes.push('Uses available weighted equipment')
    isBestFit = true
  }
  
  return { score, notes, isBestFit }
}

function scoreJointSafety(
  exercise: Exercise,
  jointCautions: string[]
): { score: number; notes: string[]; isSubstitute: boolean } {
  const notes: string[] = []
  let score = 10 // Default safe score
  let isSubstitute = false
  
  if (jointCautions.length === 0) {
    return { score, notes, isSubstitute }
  }
  
  // Map exercise patterns to joint stress
  const jointStressMap: Record<string, string[]> = {
    wrist: ['planche', 'handstand', 'l_sit', 'pseudo_planche_push'],
    shoulder: ['planche', 'front_lever', 'back_lever', 'overhead', 'dip'],
    elbow: ['planche', 'straight_arm', 'ring', 'muscle_up'],
    lower_back: ['l_sit', 'v_sit', 'compression', 'front_lever'],
  }
  
  const exerciseIdNorm = normalizeSkillKey(exercise.id)
  const exerciseNameNorm = normalizeSkillKey(exercise.name)
  
  for (const caution of jointCautions) {
    const cautionNorm = normalizeSkillKey(caution)
    const stressfulPatterns = jointStressMap[cautionNorm] || []
    
    const isStressful = stressfulPatterns.some(pattern => 
      exerciseIdNorm.includes(pattern) || exerciseNameNorm.includes(pattern)
    )
    
    if (isStressful) {
      score = 3
      notes.push(`May stress ${caution} - consider alternative`)
      isSubstitute = false
    } else if (exercise.id.includes('band') || exercise.id.includes('assisted') || 
               exercise.id.includes('eccentric') || exercise.id.includes('regression')) {
      // Assisted/regression variants are safer
      score = 10
      notes.push(`Joint-friendly variant for ${caution} concerns`)
      isSubstitute = true
    }
  }
  
  return { score, notes, isSubstitute }
}

function scoreCarryoverValue(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): { score: number; notes: string[] } {
  const notes: string[] = []
  let score = 5 // Base carryover
  
  // Check skill support mappings
  for (const skill of context.selectedSkills) {
    const directSupport = getDirectSupportExercises(skill as any)
    if (directSupport.some(s => exercise.id.toLowerCase().includes(s.toLowerCase()))) {
      score = 15
      notes.push(`Direct support for ${skill}`)
      return { score, notes }
    }
  }
  
  // Check doctrine carryover rules if available
  if (context.doctrineCarryoverRules) {
    for (const rule of context.doctrineCarryoverRules) {
      if (rule.preferredExercises.includes(exercise.id)) {
        const boost = rule.carryoverType === 'direct' ? 15 : 
                      rule.carryoverType === 'prerequisite' ? 12 : 8
        score = Math.max(score, boost)
        notes.push(`Doctrine carryover: ${rule.sourceSkill} → ${rule.targetSkill}`)
      }
    }
  }
  
  // Check transferTo
  if (exercise.transferTo) {
    const matchingTransfers = exercise.transferTo.filter(t => 
      context.selectedSkills.some(s => normalizeSkillKey(s) === normalizeSkillKey(t))
    )
    if (matchingTransfers.length > 0) {
      score = Math.max(score, 10 + matchingTransfers.length * 2)
      notes.push(`Transfers to: ${matchingTransfers.join(', ')}`)
    }
  }
  
  return { score, notes }
}

function scoreScheduleComplexity(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): { score: number; notes: string[]; isGoodFit: boolean } {
  const notes: string[] = []
  let score = 5
  let isGoodFit = false
  
  const fatigueCost = exercise.fatigueCost || 'moderate'
  const neuralDemand = exercise.neuralDemand || 'moderate'
  
  // Match complexity to session budget
  if (context.sessionComplexityBudget === 'low') {
    if (fatigueCost === 'low' && neuralDemand === 'low') {
      score = 10
      notes.push('Low complexity matches recovery-focused session')
      isGoodFit = true
    } else if (fatigueCost === 'high' || neuralDemand === 'very_high') {
      score = 2
      notes.push('Too demanding for current session budget')
    }
  } else if (context.sessionComplexityBudget === 'high') {
    if (fatigueCost === 'high' || neuralDemand === 'high') {
      score = 10
      notes.push('High complexity appropriate for intensive session')
      isGoodFit = true
    }
  } else {
    // Medium budget - balanced scoring
    score = 7
    isGoodFit = true
  }
  
  // Adjust for weekly session count
  if (context.weeklySessionCount >= 5 && fatigueCost === 'high') {
    score = Math.max(score - 2, 0)
    notes.push('High frequency week - prefer lower fatigue')
  }
  
  return { score, notes, isGoodFit }
}

function scoreTrainingStyleMatch(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): { score: number; notes: string[]; isWeightedMatch: boolean } {
  const notes: string[] = []
  let score = 5
  let isWeightedMatch = false
  
  const isWeightedExercise = exercise.id.includes('weighted') || 
                             exercise.equipment?.includes('weighted_belt' as any)
  
  if (context.trainingStyle === 'weighted_integrated') {
    if (isWeightedExercise && context.hasWeightedEquipment) {
      score = 10
      notes.push('Weighted exercise matches integrated style')
      isWeightedMatch = true
    }
  } else if (context.trainingStyle === 'pure_skill') {
    if (!isWeightedExercise && exercise.category === 'skill') {
      score = 10
      notes.push('Pure skill exercise matches style')
    }
  } else if (context.trainingStyle === 'minimalist') {
    if (!exercise.equipment || exercise.equipment.length === 0 || 
        exercise.equipment.includes('none' as any)) {
      score = 10
      notes.push('Bodyweight-only matches minimalist style')
    }
  } else {
    // Hybrid - balanced
    score = 7
  }
  
  return { score, notes, isWeightedMatch }
}

function scoreDoctrinePreference(
  exercise: Exercise,
  context: ExerciseMaterialityContext
): { score: number; notes: string[] } {
  const notes: string[] = []
  let score = 0
  
  // Check preferred exercises
  if (context.doctrinePreferredExercises?.includes(exercise.id)) {
    score = 15
    notes.push('Doctrine preferred exercise')
  }
  
  // Check avoid list
  if (context.doctrineAvoidExercises?.includes(exercise.id)) {
    score = -10
    notes.push('Doctrine recommends avoiding')
  }
  
  return { score, notes }
}

function calculateSlotSuitability(
  breakdown: MaterialityScoreBreakdown
): Record<SlotType, number> {
  const suitability: Record<SlotType, number> = {
    direct_skill: 0,
    main_strength: 0,
    secondary_skill: 0,
    assistance: 0,
    support_carryover: 0,
    prehab_joint_care: 0,
    density_finisher: 0,
  }
  
  for (const slotType of Object.keys(suitability) as SlotType[]) {
    const weights = SLOT_WEIGHT_PROFILES[slotType]
    let score = 0
    let maxPossible = 0
    
    for (const [key, value] of Object.entries(breakdown)) {
      const weight = weights[key as keyof MaterialityScoreBreakdown] || 1.0
      score += value * weight
      // Estimate max possible for this component
      const maxForKey = key === 'recentHistoryPenalty' ? 0 : 
                        key === 'primaryGoalAlignment' ? 30 :
                        key === 'currentProgressionFit' ? 25 :
                        key === 'secondaryGoalSupport' ? 15 :
                        key === 'equipmentOptimality' ? 15 :
                        key === 'carryoverValue' ? 15 :
                        key === 'doctrineBoost' ? 15 : 10
      maxPossible += maxForKey * weight
    }
    
    suitability[slotType] = Math.round((score / maxPossible) * 100)
  }
  
  return suitability
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Build a complete materiality context from available upstream contracts.
 */
export function buildExerciseSelectionMaterialityContext(
  primaryGoal: PrimaryGoal | string,
  secondaryGoal: string | null,
  selectedSkills: string[],
  experienceLevel: ExperienceLevel,
  equipmentAvailable: EquipmentType[],
  jointCautions: string[],
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
  }> | null,
  weeklySessionCount: number,
  sessionComplexityBudget: 'low' | 'medium' | 'high',
  trainingStyle?: 'pure_skill' | 'hybrid' | 'weighted_integrated' | 'minimalist',
  recentExerciseHistory?: string[],
  doctrineContext?: {
    preferredExercises?: string[]
    avoidExercises?: string[]
    carryoverRules?: Array<{
      sourceSkill: string
      targetSkill: string
      carryoverType: 'direct' | 'indirect' | 'prerequisite'
      preferredExercises: string[]
    }>
  }
): ExerciseMaterialityContext {
  // Detect training style from equipment if not provided
  const hasWeightedEquipment = equipmentAvailable.includes('weighted_belt') ||
                               equipmentAvailable.includes('dumbbells' as EquipmentType) ||
                               equipmentAvailable.includes('weight_plates' as EquipmentType)
  
  const detectedStyle = trainingStyle || (
    !hasWeightedEquipment && equipmentAvailable.length <= 2 ? 'minimalist' :
    hasWeightedEquipment ? 'hybrid' : 'pure_skill'
  )
  
  return {
    primaryGoal,
    secondaryGoal,
    selectedSkills,
    experienceLevel,
    equipmentAvailable,
    jointCautions,
    currentWorkingProgressions,
    trainingStyle: detectedStyle,
    hasWeightedEquipment,
    weeklySessionCount,
    sessionComplexityBudget,
    recentExerciseHistory,
    doctrinePreferredExercises: doctrineContext?.preferredExercises,
    doctrineAvoidExercises: doctrineContext?.avoidExercises,
    doctrineCarryoverRules: doctrineContext?.carryoverRules,
  }
}

/**
 * Log materiality ranking audit for debugging.
 */
export function logMaterialityRankingAudit(
  ranking: SlotMaterialityRanking,
  context: ExerciseMaterialityContext
): void {
  console.log('[EXERCISE-SELECTION-MATERIALITY]', {
    slotType: ranking.slotType,
    totalCandidates: ranking.auditSummary.totalCandidates,
    selectedExercise: ranking.selectedExerciseId,
    selectionConfidence: ranking.selectionConfidence,
    top3: ranking.auditSummary.top3,
    primaryReason: ranking.auditSummary.primaryReasonForSelection,
    influencers: {
      equipment: ranking.auditSummary.equipmentInfluencedRanking,
      jointCaution: ranking.auditSummary.jointCautionInfluencedRanking,
      progression: ranking.auditSummary.progressionInfluencedRanking,
      doctrine: ranking.auditSummary.doctrineInfluencedRanking,
    },
    athleteContext: {
      primaryGoal: context.primaryGoal,
      secondaryGoal: context.secondaryGoal,
      trainingStyle: context.trainingStyle,
      jointCautions: context.jointCautions.length > 0,
      hasProgressionData: !!context.currentWorkingProgressions,
    },
  })
}
