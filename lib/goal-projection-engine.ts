// Goal Projection Engine
// Estimates realistic time ranges for major calisthenics goals
// Uses existing athlete data: profile, skills, strength, momentum
// Provides broad ranges, NOT exact dates - grounded projections only

import { getAthleteProfile, getSkillProgressions, type AthleteProfile, type SkillProgression } from './data-service'
import { getPersonalRecords, type ExerciseType } from './strength-service'
import { calculateTrainingMomentum, type TrainingMomentum } from './training-momentum-engine'
import { SKILL_PROGRESSIONS, type EnhancedSkillDefinition } from './skill-progression-rules'

// =============================================================================
// TYPES
// =============================================================================

export type GoalType = 'front_lever' | 'planche' | 'muscle_up' | 'handstand_pushup' | 'l_sit' | 'pancake' | 'front_splits' | 'side_splits' | 'toe_touch'
export type ConfidenceLevel = 'low' | 'moderate' | 'high'
export type ProjectionStatus = 'on_track' | 'building' | 'needs_data' | 'goal_reached'

export interface TimeRange {
  minWeeks: number
  maxWeeks: number
  label: string // e.g., "4-8 weeks", "2-4 months"
}

export interface ActionRecommendation {
  primary: string        // Main thing to focus on
  exercises: string[]    // Specific exercises to do
  reasoning: string      // Why this is the recommendation
}

export interface GoalProjection {
  goalType: GoalType
  goalName: string
  
  // Current state
  currentLevel: number
  currentLevelName: string
  isAtFinalLevel: boolean
  
  // Next milestone
  nextLevel: number | null
  nextLevelName: string | null
  
  // Time projection
  timeRange: TimeRange | null
  
  // Confidence
  confidence: ConfidenceLevel
  confidenceReason: string
  
  // Status
  status: ProjectionStatus
  
  // Explanation
  explanation: string
  
  // Actionable recommendations
  mainLimiter: string | null
  action: ActionRecommendation | null
  
  // Contributing factors (for transparency)
  factors: {
    strengthSupport: 'strong' | 'moderate' | 'weak' | 'unknown'
    trainingConsistency: 'high' | 'moderate' | 'low' | 'unknown'
    holdQuality: 'good' | 'developing' | 'early' | 'unknown'
    experienceModifier: number // 0.8 for advanced, 1.0 for intermediate, 1.2 for beginner
  }
  
  // Data availability
  hasEnoughData: boolean
}

// =============================================================================
// BASE TIMELINE ESTIMATES (in weeks)
// Baseline for intermediate athletes training 4x/week with moderate strength
// =============================================================================

const BASE_PROGRESSION_TIMELINES: Record<GoalType, number[]> = {
  // Weeks to progress FROM each level TO the next
  front_lever: [6, 10, 12, 16, 20],   // tuck→adv_tuck→one_leg→straddle→full
  planche: [8, 12, 16, 24],            // tuck→adv_tuck→straddle→full
  muscle_up: [4, 6, 10, 16],           // band→jumping→strict→weighted
  handstand_pushup: [4, 8, 10, 16],    // wall→partial→strict→freestanding
  // Compression skills
  l_sit: [3, 6, 12, 20],               // tuck→L→V→I(manna)
  // Flexibility skills (exposure-based, generally faster)
  pancake: [8, 16, 24],                // beginner→intermediate→full
  front_splits: [12, 20],              // partial→full
  side_splits: [16, 28],               // partial→full
  toe_touch: [4, 8],                   // restricted→full
}

// Strength thresholds that support each progression (% of bodyweight added)
const STRENGTH_SUPPORT_THRESHOLDS: Record<GoalType, { exercise: ExerciseType; thresholds: number[] }> = {
  front_lever: { exercise: 'weighted_pull_up', thresholds: [15, 30, 45, 55, 70] },
  planche: { exercise: 'weighted_dip', thresholds: [20, 35, 50, 65] },
  muscle_up: { exercise: 'weighted_pull_up', thresholds: [20, 35, 50, 70] },
  handstand_pushup: { exercise: 'weighted_dip', thresholds: [25, 40, 55, 75] },
}

// Goal display names
const GOAL_NAMES: Record<GoalType, string> = {
  front_lever: 'Front Lever',
  planche: 'Planche',
  muscle_up: 'Muscle-Up',
  handstand_pushup: 'Handstand Push-Up',
  l_sit: 'L-Sit / V-Sit',
  pancake: 'Pancake',
  front_splits: 'Front Splits',
  side_splits: 'Side Splits',
  toe_touch: 'Toe Touch',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimeRange(minWeeks: number, maxWeeks: number): string {
  if (minWeeks <= 0 && maxWeeks <= 0) return 'Achieved'
  
  // For short ranges, show weeks
  if (maxWeeks <= 8) {
    return `${minWeeks}-${maxWeeks} weeks`
  }
  
  // For medium ranges, show weeks or months
  if (maxWeeks <= 16) {
    const minMonths = Math.round(minWeeks / 4)
    const maxMonths = Math.round(maxWeeks / 4)
    if (minMonths === maxMonths) {
      return `~${maxWeeks} weeks`
    }
    return `${minWeeks}-${maxWeeks} weeks`
  }
  
  // For longer ranges, show months
  const minMonths = Math.round(minWeeks / 4)
  const maxMonths = Math.round(maxWeeks / 4)
  return `${minMonths}-${maxMonths} months`
}

function getExperienceModifier(experienceLevel: string): number {
  switch (experienceLevel) {
    case 'advanced': return 0.8  // 20% faster
    case 'beginner': return 1.3  // 30% slower
    case 'intermediate':
    default: return 1.0
  }
}

function getFrequencyModifier(trainingDaysPerWeek: number): number {
  if (trainingDaysPerWeek >= 5) return 0.85
  if (trainingDaysPerWeek === 4) return 1.0
  if (trainingDaysPerWeek === 3) return 1.15
  if (trainingDaysPerWeek === 2) return 1.35
  return 1.5
}

function getMomentumModifier(momentum: TrainingMomentum): number {
  switch (momentum.level) {
    case 'very_strong': return 0.9
    case 'strong': return 1.0
    case 'developing': return 1.1
    case 'low': return 1.25
    case 'none': return 1.4
  }
}

function assessStrengthSupport(
  goalType: GoalType,
  currentLevel: number,
  bodyweight: number | null,
  pullUp1RM: number | null,
  dip1RM: number | null
): 'strong' | 'moderate' | 'weak' | 'unknown' {
  if (!bodyweight || bodyweight <= 0) return 'unknown'
  
  const config = STRENGTH_SUPPORT_THRESHOLDS[goalType]
  // Not all goal types have strength thresholds (e.g., flexibility goals)
  if (!config) return 'unknown'
  
  const relevantStrength = config.exercise === 'weighted_pull_up' ? pullUp1RM : dip1RM
  
  if (relevantStrength === null) return 'unknown'
  
  const percentAdded = (relevantStrength / bodyweight) * 100
  const threshold = config.thresholds[Math.min(currentLevel, config.thresholds.length - 1)] || 30
  
  if (percentAdded >= threshold * 1.2) return 'strong'
  if (percentAdded >= threshold * 0.8) return 'moderate'
  return 'weak'
}

function getConsistencyLevel(momentum: TrainingMomentum): 'high' | 'moderate' | 'low' | 'unknown' {
  if (!momentum.hasData) return 'unknown'
  if (momentum.level === 'very_strong' || momentum.level === 'strong') return 'high'
  if (momentum.level === 'developing') return 'moderate'
  return 'low'
}

// =============================================================================
// MAIN PROJECTION FUNCTION
// =============================================================================

export function calculateGoalProjection(goalType: GoalType): GoalProjection {
  // Gather all inputs
  const profile = getAthleteProfile()
  const progressions = getSkillProgressions()
  const personalRecords = getPersonalRecords()
  const momentum = calculateTrainingMomentum()
  const skillDefinition = SKILL_PROGRESSIONS[goalType]
  
  // If no skill definition exists
  if (!skillDefinition) {
    return createNeedsDataProjection(goalType, null, 0)
  }
  
  // Find existing skill progression
  const skillProgression = progressions.find(p => p.skillName === goalType) || null
  const currentLevel = skillProgression?.currentLevel ?? 0
  const maxLevel = skillDefinition.levels.length - 1
  const isAtFinalLevel = currentLevel >= maxLevel
  
  // Get strength data
  const pullUp1RM = personalRecords.weighted_pull_up?.estimatedOneRM ?? null
  const dip1RM = personalRecords.weighted_dip?.estimatedOneRM ?? null
  
  // Assess data quality
  const hasProfileData = profile.bodyweight !== null && profile.bodyweight > 0
  const hasSkillData = skillProgression !== null
  const hasStrengthData = pullUp1RM !== null || dip1RM !== null
  const hasMomentumData = momentum.hasData
  
  const dataPoints = [hasProfileData, hasSkillData, hasStrengthData, hasMomentumData].filter(Boolean).length
  
  // Get factor assessments
  const strengthSupport = assessStrengthSupport(goalType, currentLevel, profile.bodyweight, pullUp1RM, dip1RM)
  const trainingConsistency = getConsistencyLevel(momentum)
  const experienceModifier = getExperienceModifier(profile.experienceLevel)
  
  // If at final level - goal reached
  if (isAtFinalLevel) {
    return {
      goalType,
      goalName: GOAL_NAMES[goalType],
      currentLevel,
      currentLevelName: skillDefinition.levels[currentLevel].name,
      isAtFinalLevel: true,
      nextLevel: null,
      nextLevelName: null,
      timeRange: null,
      confidence: 'high',
      confidenceReason: 'Goal achieved',
      status: 'goal_reached',
      explanation: `You've achieved ${skillDefinition.levels[currentLevel].name}. Focus on hold quality and duration.`,
      mainLimiter: null,
      action: {
        primary: 'Master your current level',
        exercises: GOAL_EXERCISES[goalType].skillWork.slice(0, 2),
        reasoning: 'Focus on increasing hold duration and refining form at your achieved level.',
      },
      factors: {
        strengthSupport,
        trainingConsistency,
        holdQuality: 'good',
        experienceModifier,
      },
      hasEnoughData: true,
    }
  }
  
  // If not enough data for reliable projection
  if (dataPoints < 2) {
    return createNeedsDataProjection(goalType, skillDefinition, currentLevel)
  }
  
  // Calculate projection
  const nextLevel = currentLevel + 1
  const nextLevelName = skillDefinition.levels[nextLevel]?.name || 'Next Level'
  const currentLevelName = skillDefinition.levels[currentLevel]?.name || 'Starting'
  
  // Get base timeline for this progression step
  const baseTimelines = BASE_PROGRESSION_TIMELINES[goalType]
  const baseWeeks = baseTimelines[Math.min(currentLevel, baseTimelines.length - 1)] || 12
  
  // Apply modifiers
  const frequencyModifier = getFrequencyModifier(profile.trainingDaysPerWeek)
  const momentumModifier = getMomentumModifier(momentum)
  
  let strengthModifier = 1.0
  if (strengthSupport === 'strong') strengthModifier = 0.85
  else if (strengthSupport === 'weak') strengthModifier = 1.2
  else if (strengthSupport === 'unknown') strengthModifier = 1.1
  
  // Calculate adjusted timeline
  const totalModifier = experienceModifier * frequencyModifier * momentumModifier * strengthModifier
  const adjustedWeeks = Math.round(baseWeeks * totalModifier)
  
  // Create range (±25% for realistic variance)
  const minWeeks = Math.max(2, Math.round(adjustedWeeks * 0.75))
  const maxWeeks = Math.round(adjustedWeeks * 1.25)
  
  // Determine confidence
  let confidence: ConfidenceLevel = 'moderate'
  let confidenceReason = 'Based on available training data'
  
  if (dataPoints >= 4 && momentum.level !== 'low' && momentum.level !== 'none') {
    confidence = 'high'
    confidenceReason = 'Strong data across all factors'
  } else if (dataPoints <= 2 || strengthSupport === 'unknown') {
    confidence = 'low'
    confidenceReason = 'Limited data available'
  }
  
  // Determine status
  let status: ProjectionStatus = 'building'
  if (strengthSupport === 'strong' && (momentum.level === 'very_strong' || momentum.level === 'strong')) {
    status = 'on_track'
  }
  
  // Generate explanation
  const explanation = generateExplanation(strengthSupport, momentum, nextLevelName)
  
  // Generate action recommendation
  const holdQuality = hasSkillData ? 'developing' : 'early'
  const { mainLimiter, action } = generateActionRecommendation(
    goalType,
    strengthSupport,
    trainingConsistency,
    holdQuality
  )
  
  return {
    goalType,
    goalName: GOAL_NAMES[goalType],
    currentLevel,
    currentLevelName,
    isAtFinalLevel: false,
    nextLevel,
    nextLevelName,
    timeRange: {
      minWeeks,
      maxWeeks,
      label: formatTimeRange(minWeeks, maxWeeks),
    },
    confidence,
    confidenceReason,
    status,
    explanation,
    mainLimiter,
    action,
    factors: {
      strengthSupport,
      trainingConsistency,
      holdQuality,
      experienceModifier,
    },
    hasEnoughData: true,
  }
}

function createNeedsDataProjection(
  goalType: GoalType,
  skillDefinition: EnhancedSkillDefinition | null,
  currentLevel: number
): GoalProjection {
  const levelName = skillDefinition?.levels[currentLevel]?.name || 'Starting'
  const nextLevelName = skillDefinition?.levels[currentLevel + 1]?.name || 'First Level'
  
  return {
    goalType,
    goalName: GOAL_NAMES[goalType],
    currentLevel,
    currentLevelName: levelName,
    isAtFinalLevel: false,
    nextLevel: currentLevel + 1,
    nextLevelName,
    timeRange: null,
    confidence: 'low',
    confidenceReason: 'More training data needed',
    status: 'needs_data',
    explanation: 'Log more workouts and skill sessions for a reliable projection.',
    mainLimiter: null,
    action: {
      primary: 'Start tracking your training',
      exercises: ['Log your workouts', 'Record skill sessions', 'Track strength PRs'],
      reasoning: 'SpartanLab needs training data to provide personalized recommendations.',
    },
    factors: {
      strengthSupport: 'unknown',
      trainingConsistency: 'unknown',
      holdQuality: 'unknown',
      experienceModifier: 1.0,
    },
    hasEnoughData: false,
  }
}

function generateExplanation(
  strengthSupport: 'strong' | 'moderate' | 'weak' | 'unknown',
  momentum: TrainingMomentum,
  nextLevelName: string
): string {
  const parts: string[] = []
  
  if (strengthSupport === 'strong') {
    parts.push('your strength supports faster progression')
  } else if (strengthSupport === 'weak') {
    parts.push('building more strength will help')
  }
  
  if (momentum.level === 'very_strong' || momentum.level === 'strong') {
    parts.push('training consistency is excellent')
  } else if (momentum.level === 'developing') {
    parts.push('more consistent training would accelerate progress')
  } else if (momentum.level === 'low' || momentum.level === 'none') {
    parts.push('consistent training is key')
  }
  
  if (parts.length === 0) {
    return `Continue working toward ${nextLevelName}.`
  }
  
  if (parts.length === 1) {
    return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)}.`
  }
  
  return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)}, and ${parts[1]}.`
}

// =============================================================================
// ACTION RECOMMENDATION GENERATOR
// =============================================================================

const GOAL_EXERCISES: Record<GoalType, {
  strengthWork: string[]
  skillWork: string[]
  supportWork: string[]
}> = {
  front_lever: {
    strengthWork: ['Weighted Pull-Ups', 'Front Lever Rows', 'Barbell Rows'],
    skillWork: ['Front Lever Holds', 'Ice Cream Makers', 'Negatives'],
    supportWork: ['Scapula Pulls', 'Straight Arm Work', 'Band Pulls'],
  },
  planche: {
    strengthWork: ['Weighted Dips', 'Pseudo Planche Push-Ups', 'Pike Push-Ups'],
    skillWork: ['Planche Leans', 'Tuck Planche Holds', 'Planche Negatives'],
    supportWork: ['Wrist Prep', 'Shoulder Flexibility', 'Straight Arm Pressing'],
  },
  muscle_up: {
    strengthWork: ['Weighted Pull-Ups', 'Explosive Pull-Ups', 'Chest-to-Bar'],
    skillWork: ['Muscle-Up Transition Drills', 'Swing Practice', 'Band Muscle-Ups'],
    supportWork: ['False Grip Training', 'Dips', 'L-Sits'],
  },
  handstand_pushup: {
    strengthWork: ['Weighted Dips', 'Pike Push-Ups', 'Overhead Press'],
    skillWork: ['Wall HSPU', 'Negatives', 'Partial ROM Work'],
    supportWork: ['Handstand Holds', 'Shoulder Mobility', 'Wrist Prep'],
  },
  l_sit: {
    strengthWork: ['Compression Lifts', 'Pike Compression', 'Weighted Hollow Body'],
    skillWork: ['L-Sit Holds', 'V-Sit Progressions', 'Straddle Lifts'],
    supportWork: ['Hip Flexor Strengthening', 'Pancake Flexibility', 'Core Work'],
  },
  pancake: {
    strengthWork: ['Loaded Pancake Good Morning', 'Jefferson Curls', 'Pike Compression'],
    skillWork: ['Seated Pancake Folds', 'Frog Stretch', 'Straddle Rotations'],
    supportWork: ['Hip Circles', 'Adductor Work', 'Hamstring Exposure'],
  },
  front_splits: {
    strengthWork: ['Loaded Split Stretch', 'Bulgarian Split Squats', 'Hip Flexor Lifts'],
    skillWork: ['Half Split Holds', 'Runner Lunge Sequence', 'Pigeon Pose'],
    supportWork: ['Hamstring Exposure', 'Quad Stretch', 'Hip Flexor Work'],
  },
  side_splits: {
    strengthWork: ['Cossack Squats', 'Horse Stance', 'Loaded Straddle'],
    skillWork: ['Frog Stretch', 'Pancake Work', 'Wall Straddle'],
    supportWork: ['Adductor Slides', 'Butterfly Stretch', 'Hip Circles'],
  },
  toe_touch: {
    strengthWork: ['Jefferson Curls', 'Romanian Deadlifts', 'Good Mornings'],
    skillWork: ['Standing Pike Fold', 'Seated Forward Fold', 'Elephant Walk'],
    supportWork: ['Hamstring Exposure', 'Calf Stretch', 'Hip Hinge Drills'],
  },
}

function generateActionRecommendation(
  goalType: GoalType,
  strengthSupport: 'strong' | 'moderate' | 'weak' | 'unknown',
  consistency: 'high' | 'moderate' | 'low' | 'unknown',
  holdQuality: 'good' | 'developing' | 'early' | 'unknown'
): { mainLimiter: string; action: ActionRecommendation } {
  const exercises = GOAL_EXERCISES[goalType]
  
  // Determine main limiter and recommendation based on weakest factor
  if (strengthSupport === 'weak') {
    return {
      mainLimiter: 'Strength Support',
      action: {
        primary: 'Build strength foundation',
        exercises: exercises.strengthWork.slice(0, 2),
        reasoning: 'Your current strength is the main factor limiting faster progression. Prioritize strength work.',
      },
    }
  }
  
  if (consistency === 'low' || consistency === 'unknown') {
    return {
      mainLimiter: 'Training Consistency',
      action: {
        primary: 'Increase training frequency',
        exercises: ['2-3 skill sessions per week', ...exercises.skillWork.slice(0, 1)],
        reasoning: 'Consistent exposure is key for skill development. Aim for regular practice.',
      },
    }
  }
  
  if (holdQuality === 'early' || holdQuality === 'unknown') {
    return {
      mainLimiter: 'Skill Density',
      action: {
        primary: 'Improve hold duration',
        exercises: exercises.skillWork.slice(0, 2),
        reasoning: 'Focus on accumulating quality time in position. Build density at your current level.',
      },
    }
  }
  
  if (strengthSupport === 'moderate') {
    return {
      mainLimiter: 'Horizontal Pulling',
      action: {
        primary: 'Continue building strength',
        exercises: [exercises.strengthWork[0], exercises.supportWork[0]],
        reasoning: 'Strength is developing but not yet optimal. Keep building while practicing skill.',
      },
    }
  }
  
  // Default: progressing well, focus on skill work
  return {
    mainLimiter: 'None - On Track',
    action: {
      primary: 'Maintain current approach',
      exercises: [exercises.skillWork[0], exercises.supportWork[0]],
      reasoning: 'You are progressing well. Continue current training with slight increases in difficulty.',
    },
  }
}

// =============================================================================
// BATCH PROJECTIONS
// =============================================================================

export function calculateAllProjections(): GoalProjection[] {
  const goalTypes: GoalType[] = ['front_lever', 'planche', 'muscle_up', 'handstand_pushup']
  return goalTypes.map(goalType => calculateGoalProjection(goalType))
}

export function calculateProjectionForPrimaryGoal(): GoalProjection | null {
  const profile = getAthleteProfile()
  
  if (!profile.primaryGoal) return null
  
  const goalMap: Record<string, GoalType> = {
    'front_lever': 'front_lever',
    'planche': 'planche',
    'muscle_up': 'muscle_up',
    'handstand_pushup': 'handstand_pushup',
    'Front Lever': 'front_lever',
    'Planche': 'planche',
    'Muscle-Up': 'muscle_up',
    'Handstand Push-Up': 'handstand_pushup',
  }
  
  const goalType = goalMap[profile.primaryGoal]
  return goalType ? calculateGoalProjection(goalType) : null
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export const SUPPORTED_GOALS: { type: GoalType; name: string; category: 'skill' | 'compression' | 'flexibility' }[] = [
  { type: 'front_lever', name: 'Front Lever', category: 'skill' },
  { type: 'planche', name: 'Planche', category: 'skill' },
  { type: 'muscle_up', name: 'Muscle-Up', category: 'skill' },
  { type: 'handstand_pushup', name: 'Handstand Push-Up', category: 'skill' },
  { type: 'l_sit', name: 'L-Sit / V-Sit', category: 'compression' },
  { type: 'pancake', name: 'Pancake', category: 'flexibility' },
  { type: 'front_splits', name: 'Front Splits', category: 'flexibility' },
  { type: 'side_splits', name: 'Side Splits', category: 'flexibility' },
  { type: 'toe_touch', name: 'Toe Touch', category: 'flexibility' },
]

export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high': return '#22C55E'
    case 'moderate': return '#C1121F'
    case 'low': return '#6B7280'
  }
}

export function getStatusColor(status: ProjectionStatus): string {
  switch (status) {
    case 'on_track': return '#22C55E'
    case 'building': return '#C1121F'
    case 'goal_reached': return '#FFD700'
    case 'needs_data': return '#6B7280'
  }
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high': return 'High'
    case 'moderate': return 'Moderate'
    case 'low': return 'Low'
  }
}
