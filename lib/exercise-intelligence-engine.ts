/**
 * SpartanLab Exercise Intelligence Engine
 * 
 * Makes intelligent exercise selections based on:
 * - User profile (body type, experience, equipment)
 * - Training goals and target skills
 * - Current fatigue and recovery state
 * - Training method profiles
 * - Progression/regression needs
 * 
 * This engine sits between the Training Principles Engine and Program Builder,
 * ensuring every exercise choice is optimal for the individual athlete.
 */

import type { AthleteProfile, Sex, Equipment } from '@/types/domain'
import type { Exercise, EquipmentType, DifficultyLevel, MovementPattern } from './adaptive-exercise-pool'
import { getAllExercises, hasRequiredEquipment, getExercisesByTransfer } from './adaptive-exercise-pool'
import type { MethodProfileId, SkillType, MethodProfile } from './training-principles-engine'
import { METHOD_PROFILES } from './training-principles-engine'
import { getProgressionUp, getProgressionDown, getBestSubstitute } from './progression-ladders'

// =============================================================================
// TYPES
// =============================================================================

export interface ExerciseIntelligenceContext {
  // User profile
  athleteProfile?: AthleteProfile
  sex?: Sex
  bodyweight?: number
  height?: number
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // Equipment
  availableEquipment: EquipmentType[]
  
  // Training context
  primaryGoal: SkillType | string
  targetSkills: SkillType[]
  methodProfile?: MethodProfileId
  
  // Recovery/fatigue state
  fatigueLevel: 'low' | 'moderate' | 'high'
  readinessScore?: number // 0-100
  recentSoreness?: 'none' | 'mild' | 'moderate' | 'severe'
  
  // Session constraints
  sessionMinutes: number
  sessionFocus?: 'skill' | 'strength' | 'endurance' | 'flexibility' | 'mobility'
  
  // Preferences
  preferLowerFatigue?: boolean
  preferHighCarryover?: boolean
  avoidHighJointStress?: boolean
}

export interface ExerciseScore {
  exerciseId: string
  exercise: Exercise
  totalScore: number
  breakdown: ScoreBreakdown
  selectionReason: string
  warnings: string[]
  isRecommended: boolean
}

export interface ScoreBreakdown {
  goalMatch: number        // 0-25: How well it matches the goal
  skillCarryover: number   // 0-20: Transfer to target skills
  difficultyFit: number    // 0-20: Appropriate for level
  equipmentMatch: number   // 0-15: Equipment availability
  fatigueMatch: number     // 0-10: Appropriate for current fatigue
  methodMatch: number      // 0-10: Matches training method profile
  bodyTypeFit?: number     // 0-10: Suits body proportions (optional)
}

export interface ExerciseRecommendation {
  primary: ExerciseScore
  alternatives: ExerciseScore[]
  explanation: string
  coachingNote?: string
}

export interface IntelligentSelection {
  selectedExercises: ExerciseScore[]
  totalFatigueCost: number
  explanation: string
  adjustmentsMade: string[]
}

// =============================================================================
// BODY TYPE ANALYSIS
// =============================================================================

interface BodyTypeProfile {
  leverageType: 'short_limbed' | 'average' | 'long_limbed'
  relativeBW: 'light' | 'moderate' | 'heavy'
  strengthAdvantage?: 'push' | 'pull' | 'balanced'
  compressionChallenge: 'low' | 'moderate' | 'high'
}

function analyzeBodyType(profile?: AthleteProfile): BodyTypeProfile {
  if (!profile || !profile.height || !profile.bodyweight) {
    return {
      leverageType: 'average',
      relativeBW: 'moderate',
      strengthAdvantage: 'balanced',
      compressionChallenge: 'moderate',
    }
  }
  
  const heightInches = profile.heightUnit === 'cm' 
    ? profile.height / 2.54 
    : profile.height
  const weightLbs = profile.weightUnit === 'kg'
    ? profile.bodyweight * 2.205
    : profile.bodyweight
  
  // Calculate BMI-like ratio for relative bodyweight assessment
  const bmi = weightLbs / (heightInches * heightInches) * 703
  
  // Leverage analysis based on height
  const leverageType: BodyTypeProfile['leverageType'] = 
    heightInches < 66 ? 'short_limbed' :
    heightInches > 72 ? 'long_limbed' : 'average'
  
  // Relative bodyweight for calisthenics
  const relativeBW: BodyTypeProfile['relativeBW'] =
    bmi < 21 ? 'light' :
    bmi > 26 ? 'heavy' : 'moderate'
  
  // Strength advantages based on body type
  const strengthAdvantage: BodyTypeProfile['strengthAdvantage'] =
    leverageType === 'short_limbed' ? 'push' :
    leverageType === 'long_limbed' ? 'pull' : 'balanced'
  
  // Compression challenge (taller = harder compression)
  const compressionChallenge: BodyTypeProfile['compressionChallenge'] =
    heightInches > 72 ? 'high' :
    heightInches < 66 ? 'low' : 'moderate'
  
  return {
    leverageType,
    relativeBW,
    strengthAdvantage,
    compressionChallenge,
  }
}

// =============================================================================
// EXERCISE SCORING ENGINE
// =============================================================================

function scoreExerciseForContext(
  exercise: Exercise,
  context: ExerciseIntelligenceContext,
  bodyType: BodyTypeProfile
): ExerciseScore {
  const breakdown: ScoreBreakdown = {
    goalMatch: 0,
    skillCarryover: 0,
    difficultyFit: 0,
    equipmentMatch: 0,
    fatigueMatch: 0,
    methodMatch: 0,
    bodyTypeFit: 0,
  }
  const warnings: string[] = []
  
  // 1. GOAL MATCH (0-25 points)
  const goalMatchScore = calculateGoalMatchScore(exercise, context)
  breakdown.goalMatch = goalMatchScore
  
  // 2. SKILL CARRYOVER (0-20 points)
  const carryoverScore = calculateCarryoverScore(exercise, context.targetSkills)
  breakdown.skillCarryover = carryoverScore
  
  // 3. DIFFICULTY FIT (0-20 points)
  const { score: difficultyScore, warning: difficultyWarning } = 
    calculateDifficultyFitScore(exercise, context.experienceLevel)
  breakdown.difficultyFit = difficultyScore
  if (difficultyWarning) warnings.push(difficultyWarning)
  
  // 4. EQUIPMENT MATCH (0-15 points)
  const { score: equipmentScore, warning: equipmentWarning } = 
    calculateEquipmentScore(exercise, context.availableEquipment)
  breakdown.equipmentMatch = equipmentScore
  if (equipmentWarning) warnings.push(equipmentWarning)
  
  // 5. FATIGUE MATCH (0-10 points)
  const fatigueScore = calculateFatigueMatchScore(exercise, context)
  breakdown.fatigueMatch = fatigueScore
  
  // 6. METHOD PROFILE MATCH (0-10 points)
  const methodScore = calculateMethodMatchScore(exercise, context.methodProfile)
  breakdown.methodMatch = methodScore
  
  // 7. BODY TYPE FIT (0-10 points, optional bonus)
  if (context.athleteProfile) {
    const bodyTypeScore = calculateBodyTypeFitScore(exercise, bodyType)
    breakdown.bodyTypeFit = bodyTypeScore
  }
  
  // Calculate total score
  const totalScore = 
    breakdown.goalMatch +
    breakdown.skillCarryover +
    breakdown.difficultyFit +
    breakdown.equipmentMatch +
    breakdown.fatigueMatch +
    breakdown.methodMatch +
    (breakdown.bodyTypeFit || 0)
  
  // Generate selection reason
  const selectionReason = generateSelectionReason(breakdown, context)
  
  return {
    exerciseId: exercise.id,
    exercise,
    totalScore,
    breakdown,
    selectionReason,
    warnings,
    isRecommended: totalScore >= 60 && warnings.length === 0,
  }
}

function calculateGoalMatchScore(exercise: Exercise, context: ExerciseIntelligenceContext): number {
  let score = 0
  const goal = context.primaryGoal.toLowerCase()
  
  // Direct transfer to goal
  if (exercise.transferTo?.some(t => t.toLowerCase().includes(goal))) {
    score += 15
  }
  
  // Movement pattern match
  if (context.sessionFocus === 'skill' && exercise.category === 'skill') {
    score += 5
  } else if (context.sessionFocus === 'strength' && exercise.category === 'strength') {
    score += 5
  } else if (context.sessionFocus === 'flexibility' && exercise.category === 'flexibility') {
    score += 5
  }
  
  // Category bonus
  if (goal.includes('planche') && exercise.movementPattern === 'horizontal_push') {
    score += 5
  } else if (goal.includes('front_lever') && exercise.movementPattern === 'horizontal_pull') {
    score += 5
  } else if (goal.includes('muscle_up') && exercise.movementPattern === 'transition') {
    score += 5
  } else if (goal.includes('hspu') && exercise.movementPattern === 'vertical_push') {
    score += 5
  } else if ((goal.includes('l_sit') || goal.includes('v_sit')) && exercise.movementPattern === 'compression') {
    score += 5
  }
  
  return Math.min(25, score)
}

function calculateCarryoverScore(exercise: Exercise, targetSkills: SkillType[]): number {
  if (!exercise.transferTo || exercise.transferTo.length === 0) {
    return 5 // Base score for general exercises
  }
  
  let matchCount = 0
  for (const skill of targetSkills) {
    if (exercise.transferTo.some(t => t.toLowerCase().includes(skill.toLowerCase()))) {
      matchCount++
    }
  }
  
  if (matchCount === 0) return 5
  if (matchCount === 1) return 12
  if (matchCount >= 2) return 20
  
  return 5
}

function calculateDifficultyFitScore(
  exercise: Exercise,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
): { score: number; warning?: string } {
  const difficultyMap: Record<DifficultyLevel, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    elite: 4,
  }
  
  const levelMap: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  }
  
  const exerciseDifficulty = difficultyMap[exercise.difficultyLevel || 'intermediate']
  const userLevel = levelMap[experienceLevel]
  
  const diff = exerciseDifficulty - userLevel
  
  if (diff === 0) {
    return { score: 20 } // Perfect match
  } else if (diff === -1) {
    return { score: 15 } // Slightly easier, still good
  } else if (diff === 1) {
    return { score: 10, warning: 'This exercise may be challenging for your current level' }
  } else if (diff >= 2) {
    return { score: 2, warning: 'This exercise is likely too advanced' }
  } else {
    return { score: 8 } // Much easier, less optimal
  }
}

function calculateEquipmentScore(
  exercise: Exercise,
  availableEquipment: EquipmentType[]
): { score: number; warning?: string } {
  // Floor exercises always work
  if (exercise.equipment.length === 1 && exercise.equipment[0] === 'floor') {
    return { score: 15 }
  }
  
  // Check if user has required equipment
  const hasEquipment = hasRequiredEquipment(exercise, availableEquipment)
  
  if (hasEquipment) {
    return { score: 15 }
  }
  
  // Check for partial equipment match
  const matchCount = exercise.equipment.filter(e => 
    availableEquipment.includes(e) || e === 'floor'
  ).length
  
  if (matchCount > 0) {
    return { 
      score: 5, 
      warning: `Missing some equipment: ${exercise.equipment.filter(e => !availableEquipment.includes(e) && e !== 'floor').join(', ')}`
    }
  }
  
  return { score: 0, warning: 'Required equipment not available' }
}

function calculateFatigueMatchScore(exercise: Exercise, context: ExerciseIntelligenceContext): number {
  const fatigueCost = exercise.fatigueCost || 3
  
  if (context.fatigueLevel === 'high' || context.preferLowerFatigue) {
    // Prefer lower fatigue exercises
    if (fatigueCost <= 2) return 10
    if (fatigueCost === 3) return 6
    if (fatigueCost >= 4) return 2
  } else if (context.fatigueLevel === 'low') {
    // Can handle higher fatigue
    if (fatigueCost <= 2) return 6
    if (fatigueCost === 3) return 8
    if (fatigueCost >= 4) return 10
  } else {
    // Moderate fatigue - balanced
    if (fatigueCost <= 2) return 7
    if (fatigueCost === 3) return 10
    if (fatigueCost >= 4) return 5
  }
  
  return 5
}

function calculateMethodMatchScore(exercise: Exercise, methodProfile?: MethodProfileId): number {
  if (!methodProfile) return 5
  
  const method = METHOD_PROFILES[methodProfile]
  if (!method) return 5
  
  // Check method compatibility
  const methodCompat = exercise.methodCompatibility
  if (!methodCompat) return 5
  
  let score = 5
  
  // Match based on method type
  switch (methodProfile) {
    case 'weighted_strength':
      if (exercise.category === 'strength') score += 3
      if (exercise.fatigueCost >= 3) score += 2
      break
    case 'static_skill_density':
      if (exercise.isIsometric) score += 3
      if (exercise.category === 'skill') score += 2
      break
    case 'hypertrophy_support':
      if (methodCompat.straightSets) score += 2
      if (exercise.category === 'accessory') score += 3
      break
    case 'explosive_power':
      if (exercise.neuralDemand >= 4) score += 3
      if (exercise.movementPattern === 'transition') score += 2
      break
    case 'endurance_density':
      if (methodCompat.density) score += 3
      if (methodCompat.superset) score += 2
      break
    case 'flexibility_exposure':
      if (exercise.category === 'flexibility') score += 5
      break
    case 'mobility_strength':
      if (exercise.movementPattern === 'mobility') score += 5
      break
  }
  
  return Math.min(10, score)
}

function calculateBodyTypeFitScore(exercise: Exercise, bodyType: BodyTypeProfile): number {
  let score = 5 // Base score
  
  // Leverage advantages
  if (bodyType.leverageType === 'short_limbed') {
    if (exercise.movementPattern === 'horizontal_push') score += 2 // Easier planche
    if (exercise.movementPattern === 'compression') score += 1
  } else if (bodyType.leverageType === 'long_limbed') {
    if (exercise.movementPattern === 'horizontal_pull') score += 2 // Easier front lever
    if (exercise.movementPattern === 'vertical_pull') score += 1
  }
  
  // Bodyweight considerations
  if (bodyType.relativeBW === 'heavy') {
    // Favor lower neural demand exercises
    if ((exercise.neuralDemand || 3) <= 3) score += 2
    // Favor exercises with band assistance option
    if (exercise.supportsBandAssistance) score += 1
  } else if (bodyType.relativeBW === 'light') {
    // Can handle higher difficulty
    if (exercise.difficultyLevel === 'advanced' || exercise.difficultyLevel === 'elite') {
      score += 2
    }
  }
  
  return Math.min(10, score)
}

function generateSelectionReason(breakdown: ScoreBreakdown, context: ExerciseIntelligenceContext): string {
  const reasons: string[] = []
  
  if (breakdown.goalMatch >= 20) {
    reasons.push('excellent goal match')
  } else if (breakdown.goalMatch >= 15) {
    reasons.push('good goal alignment')
  }
  
  if (breakdown.skillCarryover >= 15) {
    reasons.push('high skill carryover')
  }
  
  if (breakdown.difficultyFit >= 15) {
    reasons.push('appropriate difficulty')
  }
  
  if (breakdown.fatigueMatch >= 8 && context.fatigueLevel === 'high') {
    reasons.push('recovery-friendly')
  }
  
  if (breakdown.bodyTypeFit && breakdown.bodyTypeFit >= 7) {
    reasons.push('suits your build')
  }
  
  if (reasons.length === 0) {
    return 'General training benefit'
  }
  
  return reasons.slice(0, 2).join(', ')
}

// =============================================================================
// MAIN INTELLIGENCE FUNCTIONS
// =============================================================================

export function selectBestExercise(
  candidates: Exercise[],
  context: ExerciseIntelligenceContext
): ExerciseRecommendation {
  const bodyType = analyzeBodyType(context.athleteProfile)
  
  // Score all candidates
  const scores: ExerciseScore[] = candidates.map(exercise => 
    scoreExerciseForContext(exercise, context, bodyType)
  )
  
  // Sort by total score
  scores.sort((a, b) => b.totalScore - a.totalScore)
  
  const primary = scores[0]
  const alternatives = scores.slice(1, 4) // Top 3 alternatives
  
  // Generate explanation
  const explanation = generateExplanation(primary, context)
  
  // Generate coaching note if relevant
  const coachingNote = generateCoachingNote(primary, bodyType, context)
  
  return {
    primary,
    alternatives,
    explanation,
    coachingNote,
  }
}

export function selectExercisesForCategory(
  movementPattern: MovementPattern,
  context: ExerciseIntelligenceContext,
  count: number = 2
): IntelligentSelection {
  const allExercises = getAllExercises()
  const bodyType = analyzeBodyType(context.athleteProfile)
  
  // Filter by movement pattern and equipment
  const candidates = allExercises.filter(ex => 
    ex.movementPattern === movementPattern &&
    hasRequiredEquipment(ex, context.availableEquipment)
  )
  
  // Score all candidates
  const scores = candidates.map(exercise => 
    scoreExerciseForContext(exercise, context, bodyType)
  )
  
  // Sort and take top N
  scores.sort((a, b) => b.totalScore - a.totalScore)
  const selected = scores.slice(0, count)
  
  // Calculate total fatigue
  const totalFatigueCost = selected.reduce((sum, s) => sum + (s.exercise.fatigueCost || 3), 0)
  
  // Track adjustments
  const adjustmentsMade: string[] = []
  
  // Check for fatigue adjustments
  if (context.fatigueLevel === 'high' && totalFatigueCost > count * 3) {
    adjustmentsMade.push('Selected lower-fatigue variations due to recovery needs')
  }
  
  // Check for equipment adjustments
  const hasEquipmentLimits = candidates.length < allExercises.filter(ex => 
    ex.movementPattern === movementPattern
  ).length
  
  if (hasEquipmentLimits) {
    adjustmentsMade.push('Exercise selection adapted to available equipment')
  }
  
  return {
    selectedExercises: selected,
    totalFatigueCost,
    explanation: generateCategoryExplanation(selected, context),
    adjustmentsMade,
  }
}

export function findBestReplacement(
  originalExercise: Exercise,
  context: ExerciseIntelligenceContext,
  reason: 'too_hard' | 'too_easy' | 'fatigue' | 'equipment' | 'injury'
): ExerciseScore | null {
  const allExercises = getAllExercises()
  const bodyType = analyzeBodyType(context.athleteProfile)
  
  // Get candidates based on reason
  let candidates: Exercise[] = []
  
  switch (reason) {
    case 'too_hard':
      // Look for regressions
      if (originalExercise.progressionDown) {
        const regression = allExercises.find(ex => ex.id === originalExercise.progressionDown)
        if (regression) candidates.push(regression)
      }
      // Also check substitution options
      if (originalExercise.substitutionOptions) {
        const subs = allExercises.filter(ex => 
          originalExercise.substitutionOptions?.includes(ex.id)
        )
        candidates.push(...subs)
      }
      break
      
    case 'too_easy':
      // Look for progressions
      if (originalExercise.progressionUp) {
        const progression = allExercises.find(ex => ex.id === originalExercise.progressionUp)
        if (progression) candidates.push(progression)
      }
      break
      
    case 'fatigue':
      // Find lower-fatigue alternatives
      candidates = allExercises.filter(ex =>
        ex.movementPattern === originalExercise.movementPattern &&
        (ex.fatigueCost || 3) < (originalExercise.fatigueCost || 3) &&
        hasRequiredEquipment(ex, context.availableEquipment)
      )
      break
      
    case 'equipment':
      // Find alternatives with available equipment
      candidates = allExercises.filter(ex =>
        ex.movementPattern === originalExercise.movementPattern &&
        hasRequiredEquipment(ex, context.availableEquipment) &&
        ex.id !== originalExercise.id
      )
      break
      
    case 'injury':
      // Find low joint stress alternatives
      candidates = allExercises.filter(ex =>
        ex.movementPattern === originalExercise.movementPattern &&
        (ex.fatigueCost || 3) <= 2 &&
        hasRequiredEquipment(ex, context.availableEquipment)
      )
      break
  }
  
  if (candidates.length === 0) return null
  
  // Score candidates
  const scores = candidates.map(ex => scoreExerciseForContext(ex, context, bodyType))
  scores.sort((a, b) => b.totalScore - a.totalScore)
  
  return scores[0] || null
}

export function validateExerciseSelection(
  exercises: Exercise[],
  context: ExerciseIntelligenceContext
): { isValid: boolean; issues: string[]; suggestions: string[] } {
  const issues: string[] = []
  const suggestions: string[] = []
  
  for (const exercise of exercises) {
    // Check equipment
    if (!hasRequiredEquipment(exercise, context.availableEquipment)) {
      issues.push(`${exercise.name} requires unavailable equipment`)
    }
    
    // Check difficulty
    const levelMap: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }
    const diffMap: Record<DifficultyLevel, number> = { beginner: 1, intermediate: 2, advanced: 3, elite: 4 }
    
    const userLevel = levelMap[context.experienceLevel]
    const exerciseDiff = diffMap[exercise.difficultyLevel || 'intermediate']
    
    if (exerciseDiff > userLevel + 1) {
      issues.push(`${exercise.name} may be too advanced`)
      suggestions.push(`Consider ${exercise.progressionDown || 'an easier variation'}`)
    }
  }
  
  // Check total fatigue
  const totalFatigue = exercises.reduce((sum, ex) => sum + (ex.fatigueCost || 3), 0)
  const maxFatigue = context.fatigueLevel === 'high' ? 12 : context.fatigueLevel === 'moderate' ? 18 : 25
  
  if (totalFatigue > maxFatigue) {
    issues.push('Total workout fatigue may be too high')
    suggestions.push('Consider removing or replacing high-fatigue exercises')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  }
}

// =============================================================================
// EXPLANATION GENERATORS
// =============================================================================

function generateExplanation(score: ExerciseScore, context: ExerciseIntelligenceContext): string {
  const exercise = score.exercise
  
  if (score.totalScore >= 80) {
    return `${exercise.name} is an excellent choice for your ${context.primaryGoal} training.`
  } else if (score.totalScore >= 60) {
    return `${exercise.name} provides good carryover to your goals.`
  } else if (score.totalScore >= 40) {
    return `${exercise.name} is a reasonable option with some limitations.`
  } else {
    return `${exercise.name} may not be optimal for your current situation.`
  }
}

function generateCategoryExplanation(scores: ExerciseScore[], context: ExerciseIntelligenceContext): string {
  const count = scores.length
  const avgScore = scores.reduce((sum, s) => sum + s.totalScore, 0) / count
  
  if (avgScore >= 70) {
    return 'These exercises are well-suited to your goals and current state.'
  } else if (avgScore >= 50) {
    return 'A balanced selection adapted to your available equipment and recovery.'
  } else {
    return 'Limited options available - consider expanding equipment or adjusting goals.'
  }
}

function generateCoachingNote(
  score: ExerciseScore,
  bodyType: BodyTypeProfile,
  context: ExerciseIntelligenceContext
): string | undefined {
  // Only generate notes for significant insights
  const notes: string[] = []
  
  if (bodyType.leverageType === 'long_limbed' && 
      score.exercise.movementPattern === 'horizontal_push') {
    notes.push('Your longer limbs may make this more challenging - focus on lean angle.')
  }
  
  if (bodyType.relativeBW === 'heavy' && 
      score.exercise.supportsBandAssistance) {
    notes.push('Consider band assistance to manage load as you build strength.')
  }
  
  if (context.fatigueLevel === 'high' && (score.exercise.fatigueCost || 3) >= 4) {
    notes.push('Monitor fatigue closely - consider shorter holds or fewer sets.')
  }
  
  return notes.length > 0 ? notes[0] : undefined
}

// =============================================================================
// SKILL-SPECIFIC RECOMMENDATIONS
// =============================================================================

export function getSkillExerciseRecommendations(
  skill: SkillType,
  context: ExerciseIntelligenceContext
): IntelligentSelection {
  const allExercises = getAllExercises()
  const bodyType = analyzeBodyType(context.athleteProfile)
  
  // Get exercises that transfer to this skill
  const skillExercises = allExercises.filter(ex =>
    ex.transferTo?.some(t => t.toLowerCase().includes(skill.toLowerCase())) &&
    hasRequiredEquipment(ex, context.availableEquipment)
  )
  
  if (skillExercises.length === 0) {
    return {
      selectedExercises: [],
      totalFatigueCost: 0,
      explanation: 'No exercises available for this skill with your current equipment.',
      adjustmentsMade: ['Equipment limitation'],
    }
  }
  
  // Score and sort
  const scores = skillExercises.map(ex => 
    scoreExerciseForContext(ex, context, bodyType)
  )
  scores.sort((a, b) => b.totalScore - a.totalScore)
  
  // Select based on session focus
  const count = context.sessionMinutes <= 45 ? 2 : context.sessionMinutes <= 60 ? 3 : 4
  const selected = scores.slice(0, count)
  
  return {
    selectedExercises: selected,
    totalFatigueCost: selected.reduce((sum, s) => sum + (s.exercise.fatigueCost || 3), 0),
    explanation: `Selected ${selected.length} exercises for ${skill} progression.`,
    adjustmentsMade: [],
  }
}

// =============================================================================
// FLEXIBILITY VS MOBILITY INTELLIGENCE
// =============================================================================

export function selectRangeExercises(
  skill: 'pancake' | 'toe_touch' | 'front_splits' | 'side_splits',
  mode: 'flexibility' | 'mobility' | 'hybrid',
  context: ExerciseIntelligenceContext
): IntelligentSelection {
  const allExercises = getAllExercises()
  const bodyType = analyzeBodyType(context.athleteProfile)
  
  // Filter based on mode
  let candidates = allExercises.filter(ex => {
    const isFlexibility = ex.category === 'flexibility'
    const isMobility = ex.movementPattern === 'mobility'
    const matchesSkill = ex.transferTo?.some(t => 
      t.toLowerCase().includes(skill.toLowerCase())
    )
    
    if (!matchesSkill) return false
    
    if (mode === 'flexibility') return isFlexibility
    if (mode === 'mobility') return isMobility
    return isFlexibility || isMobility // hybrid
  })
  
  if (candidates.length === 0) {
    // Fallback to any matching exercises
    candidates = allExercises.filter(ex =>
      ex.transferTo?.some(t => t.toLowerCase().includes(skill.toLowerCase()))
    )
  }
  
  const scores = candidates.map(ex => scoreExerciseForContext(ex, context, bodyType))
  scores.sort((a, b) => b.totalScore - a.totalScore)
  
  const selected = scores.slice(0, mode === 'flexibility' ? 4 : 3)
  
  const modeExplanation = mode === 'flexibility'
    ? 'Using short 15-second holds with multiple angles for low-soreness exposure.'
    : mode === 'mobility'
    ? 'Building strength and control in deep positions with loaded work.'
    : 'Combining flexibility exposure with mobility strength work.'
  
  return {
    selectedExercises: selected,
    totalFatigueCost: selected.reduce((sum, s) => sum + (s.exercise.fatigueCost || 2), 0),
    explanation: modeExplanation,
    adjustmentsMade: [],
  }
}

// =============================================================================
// USER-FACING EXPLANATIONS
// =============================================================================

export function getExerciseExplanation(
  exercise: Exercise,
  score: ExerciseScore
): string {
  const { breakdown } = score
  
  // Prioritize the most relevant explanation
  if (breakdown.goalMatch >= 20) {
    return 'This exercise directly supports your primary goal.'
  }
  if (breakdown.skillCarryover >= 15) {
    return 'High carryover to your target skills.'
  }
  if (breakdown.fatigueMatch >= 8 && score.exercise.fatigueCost <= 2) {
    return 'A lower-fatigue option chosen to support recovery.'
  }
  if (breakdown.bodyTypeFit && breakdown.bodyTypeFit >= 7) {
    return 'This variation suits your body proportions.'
  }
  if (breakdown.difficultyFit >= 18) {
    return 'Well-matched to your current strength level.'
  }
  
  return score.selectionReason || 'Good general training benefit.'
}

export function getShortExplanation(score: ExerciseScore): string {
  const reason = score.selectionReason
  
  // Keep it simple and coach-like
  if (reason.includes('excellent goal')) return 'Perfect for your goal.'
  if (reason.includes('skill carryover')) return 'Great skill transfer.'
  if (reason.includes('recovery-friendly')) return 'Easy on recovery.'
  if (reason.includes('suits your build')) return 'Fits your body type.'
  if (reason.includes('appropriate')) return 'Good difficulty match.'
  
  return 'Solid exercise choice.'
}
