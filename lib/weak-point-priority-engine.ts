/**
 * Weak Point Priority Engine
 * 
 * Analyzes user profile factors to identify weak points and prioritize
 * appropriate progressions, support exercises, and training modifications.
 * 
 * This engine helps the coaching system make intelligent decisions about:
 * - What progression level to assign
 * - Which support exercises matter most
 * - When to reduce complexity or increase frequency
 * - When to insert mobility/prep/tendon work
 * - When to avoid advanced work entirely
 */

import type { PrimaryTrainingOutcome, SkillGoal } from './athlete-profile'
import type { ExperienceLevel, PrimaryGoal } from './program-service'

// =============================================================================
// WEAK POINT CATEGORIES
// =============================================================================

export type WeakPointCategory =
  | 'pulling_strength'
  | 'pushing_strength'
  | 'core_strength'
  | 'grip_strength'
  | 'scapular_control'
  | 'straight_arm_tolerance'
  | 'shoulder_mobility'
  | 'hip_mobility'
  | 'compression_strength'
  | 'tendon_conditioning'
  | 'ring_stability'
  | 'balance_control'
  | 'endurance_capacity'
  | 'work_capacity'
  | 'recovery_capacity'

export interface WeakPointAssessment {
  category: WeakPointCategory
  score: number // 0-100
  severity: 'none' | 'minor' | 'moderate' | 'significant' | 'critical'
  recommendations: string[]
  affectsGoals: (PrimaryGoal | SkillGoal)[]
  priorityExercises: string[]
}

export interface UserProfileFactors {
  experienceLevel: ExperienceLevel
  primaryOutcome: PrimaryTrainingOutcome
  skillGoals?: SkillGoal[]
  trainingDaysPerWeek: number
  sessionLengthMinutes: number
  // Strength benchmarks
  pullUpMax?: number
  pushUpMax?: number
  dipMax?: number
  lSitHoldSeconds?: number
  plankHoldSeconds?: number
  // Skill achievements
  currentPlancheLevel?: string
  currentFrontLeverLevel?: string
  currentMuscleUpCapable?: boolean
  // Equipment
  hasRings?: boolean
  hasWeights?: boolean
  hasPullUpBar?: boolean
  // Recovery indicators
  reportedFatigue?: 'low' | 'moderate' | 'high'
  sleepQuality?: 'poor' | 'average' | 'good'
  recoveryCapacity?: 'low' | 'average' | 'high'
  // Injury/limitation history
  hasShoulderIssues?: boolean
  hasElbowIssues?: boolean
  hasWristIssues?: boolean
}

// =============================================================================
// WEAK POINT DETECTION THRESHOLDS
// =============================================================================

const PULLING_STRENGTH_THRESHOLDS = {
  beginner: { weak: 3, adequate: 8, strong: 12 },
  intermediate: { weak: 8, adequate: 15, strong: 20 },
  advanced: { weak: 15, adequate: 20, strong: 25 },
}

const PUSHING_STRENGTH_THRESHOLDS = {
  beginner: { weak: 10, adequate: 25, strong: 40 },
  intermediate: { weak: 25, adequate: 40, strong: 60 },
  advanced: { weak: 40, adequate: 60, strong: 80 },
}

const CORE_STRENGTH_THRESHOLDS = {
  lSitSeconds: { weak: 5, adequate: 15, strong: 30 },
  plankSeconds: { weak: 30, adequate: 60, strong: 120 },
}

// =============================================================================
// WEAK POINT ANALYSIS ENGINE
// =============================================================================

/**
 * Analyze pulling strength weakness
 */
function analyzePullingStrength(factors: UserProfileFactors): WeakPointAssessment {
  const thresholds = PULLING_STRENGTH_THRESHOLDS[factors.experienceLevel]
  const pullUps = factors.pullUpMax ?? 0
  
  let score = 50
  let severity: WeakPointAssessment['severity'] = 'none'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (pullUps < thresholds.weak) {
    score = Math.max(10, (pullUps / thresholds.weak) * 40)
    severity = 'significant'
    recommendations.push('Focus on pull-up progressions before advanced skills')
    recommendations.push('Include assisted pull-ups and negatives')
    priorityExercises.push('assisted_pull_up', 'pull_up_negative', 'active_hang', 'scapular_pull')
  } else if (pullUps < thresholds.adequate) {
    score = 40 + ((pullUps - thresholds.weak) / (thresholds.adequate - thresholds.weak)) * 30
    severity = 'moderate'
    recommendations.push('Build pull-up volume before attempting front lever')
    priorityExercises.push('pull_up', 'chin_up', 'inverted_row')
  } else if (pullUps < thresholds.strong) {
    score = 70 + ((pullUps - thresholds.adequate) / (thresholds.strong - thresholds.adequate)) * 20
    severity = 'minor'
    recommendations.push('Continue building pulling strength to support skill work')
    priorityExercises.push('weighted_pull_up', 'archer_pull_up')
  } else {
    score = 90 + Math.min(10, (pullUps - thresholds.strong) * 0.5)
    severity = 'none'
  }
  
  return {
    category: 'pulling_strength',
    score: Math.round(score),
    severity,
    recommendations,
    affectsGoals: ['front_lever', 'muscle_up'],
    priorityExercises,
  }
}

/**
 * Analyze pushing strength weakness
 */
function analyzePushingStrength(factors: UserProfileFactors): WeakPointAssessment {
  const thresholds = PUSHING_STRENGTH_THRESHOLDS[factors.experienceLevel]
  const pushUps = factors.pushUpMax ?? 0
  const dips = factors.dipMax ?? 0
  
  // Use combination of push-ups and dips
  const pushScore = Math.max(pushUps, dips * 2) // Weight dips higher
  
  let score = 50
  let severity: WeakPointAssessment['severity'] = 'none'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (pushScore < thresholds.weak) {
    score = Math.max(10, (pushScore / thresholds.weak) * 40)
    severity = 'significant'
    recommendations.push('Build foundational pushing strength before planche work')
    priorityExercises.push('push_up', 'dip_negative', 'incline_push_up')
  } else if (pushScore < thresholds.adequate) {
    score = 40 + ((pushScore - thresholds.weak) / (thresholds.adequate - thresholds.weak)) * 30
    severity = 'moderate'
    recommendations.push('Continue developing dip strength for planche support')
    priorityExercises.push('dip', 'diamond_push_up', 'pseudo_planche_push_up')
  } else if (pushScore < thresholds.strong) {
    score = 70 + ((pushScore - thresholds.adequate) / (thresholds.strong - thresholds.adequate)) * 20
    severity = 'minor'
    priorityExercises.push('weighted_dip', 'ring_dip', 'planche_lean')
  } else {
    score = 90 + Math.min(10, (pushScore - thresholds.strong) * 0.2)
    severity = 'none'
  }
  
  return {
    category: 'pushing_strength',
    score: Math.round(score),
    severity,
    recommendations,
    affectsGoals: ['planche', 'handstand_pushup'],
    priorityExercises,
  }
}

/**
 * Analyze core strength weakness
 */
function analyzeCoreStrength(factors: UserProfileFactors): WeakPointAssessment {
  const lSit = factors.lSitHoldSeconds ?? 0
  const plank = factors.plankHoldSeconds ?? 30
  
  let score = 50
  let severity: WeakPointAssessment['severity'] = 'none'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  // L-sit is primary indicator for skill work
  if (lSit < CORE_STRENGTH_THRESHOLDS.lSitSeconds.weak) {
    score = Math.max(20, 30 + (lSit / CORE_STRENGTH_THRESHOLDS.lSitSeconds.weak) * 20)
    severity = 'moderate'
    recommendations.push('Build L-sit capacity for compression skills')
    priorityExercises.push('tucked_l_sit', 'leg_raise', 'hollow_body_hold')
  } else if (lSit < CORE_STRENGTH_THRESHOLDS.lSitSeconds.adequate) {
    score = 50 + ((lSit - CORE_STRENGTH_THRESHOLDS.lSitSeconds.weak) / 
      (CORE_STRENGTH_THRESHOLDS.lSitSeconds.adequate - CORE_STRENGTH_THRESHOLDS.lSitSeconds.weak)) * 25
    severity = 'minor'
    recommendations.push('Progress L-sit hold duration')
    priorityExercises.push('l_sit', 'compression_work')
  } else {
    score = 75 + Math.min(25, (lSit - CORE_STRENGTH_THRESHOLDS.lSitSeconds.adequate) * 1.5)
    severity = 'none'
  }
  
  return {
    category: 'core_strength',
    score: Math.round(score),
    severity,
    recommendations,
    affectsGoals: ['front_lever', 'planche', 'l_sit', 'v_sit'],
    priorityExercises,
  }
}

/**
 * Analyze straight-arm tolerance
 */
function analyzeStraightArmTolerance(factors: UserProfileFactors): WeakPointAssessment {
  let score = 50
  let severity: WeakPointAssessment['severity'] = 'moderate'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  // Check if user has straight-arm skill experience
  const hasPlanche = factors.currentPlancheLevel && factors.currentPlancheLevel !== 'none'
  const hasFrontLever = factors.currentFrontLeverLevel && factors.currentFrontLeverLevel !== 'none'
  
  if (!hasPlanche && !hasFrontLever) {
    score = 30
    severity = 'significant'
    recommendations.push('Begin with foundational straight-arm conditioning')
    recommendations.push('Start planche leans and front lever progressions')
    priorityExercises.push('planche_lean', 'scapular_depression_holds', 'support_holds')
  } else if (hasPlanche || hasFrontLever) {
    score = 60
    severity = 'minor'
    recommendations.push('Continue building straight-arm tolerance progressively')
    priorityExercises.push('tuck_planche', 'tuck_front_lever')
  }
  
  if (factors.hasElbowIssues) {
    score = Math.max(20, score - 20)
    severity = 'significant'
    recommendations.push('Proceed cautiously with straight-arm work due to elbow concerns')
    recommendations.push('Focus on tendon conditioning exercises')
  }
  
  return {
    category: 'straight_arm_tolerance',
    score: Math.round(score),
    severity,
    recommendations,
    affectsGoals: ['planche', 'front_lever', 'iron_cross'],
    priorityExercises,
  }
}

/**
 * Analyze tendon conditioning status
 */
function analyzeTendonConditioning(factors: UserProfileFactors): WeakPointAssessment {
  let score = 50
  let severity: WeakPointAssessment['severity'] = 'moderate'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  // Beginners have less tendon conditioning
  if (factors.experienceLevel === 'beginner') {
    score = 30
    severity = 'significant'
    recommendations.push('Tendons adapt slower than muscles - be patient with progressions')
    recommendations.push('Include isometric holds to build connective tissue')
    priorityExercises.push('dead_hang', 'support_hold', 'plank_variations')
  } else if (factors.experienceLevel === 'intermediate') {
    score = 60
    severity = 'minor'
    recommendations.push('Continue gradual exposure to straight-arm stress')
    priorityExercises.push('planche_lean', 'front_lever_negatives')
  } else {
    score = 80
    severity = 'none'
  }
  
  // Injury history significantly impacts tendon readiness
  if (factors.hasElbowIssues || factors.hasShoulderIssues) {
    score = Math.max(20, score - 25)
    severity = 'significant'
    recommendations.push('Prioritize tendon health and recovery')
    recommendations.push('Avoid aggressive progression on straight-arm skills')
  }
  
  return {
    category: 'tendon_conditioning',
    score: Math.round(score),
    severity,
    recommendations,
    affectsGoals: ['planche', 'front_lever', 'iron_cross'],
    priorityExercises,
  }
}

/**
 * Analyze ring stability
 */
function analyzeRingStability(factors: UserProfileFactors): WeakPointAssessment {
  let score = 50
  let severity: WeakPointAssessment['severity'] = 'moderate'
  const recommendations: string[] = []
  const priorityExercises: string[] = []
  
  if (!factors.hasRings) {
    score = 30
    severity = 'moderate'
    recommendations.push('Ring training requires access to rings')
    return {
      category: 'ring_stability',
      score,
      severity,
      recommendations,
      affectsGoals: ['muscle_up', 'iron_cross'],
      priorityExercises: [],
    }
  }
  
  if (factors.experienceLevel === 'beginner') {
    score = 25
    severity = 'significant'
    recommendations.push('Start with ring support holds before dynamic movements')
    priorityExercises.push('ring_support_hold', 'ring_rows', 'ring_push_up')
  } else if (factors.experienceLevel === 'intermediate') {
    score = 55
    severity = 'minor'
    recommendations.push('Progress ring dips and muscle-up transitions')
    priorityExercises.push('ring_dip', 'ring_muscle_up_negative', 'ring_support_turn_out')
  } else {
    score = 75
    severity = 'none'
    priorityExercises.push('ring_muscle_up', 'ring_l_sit')
  }
  
  return {
    category: 'ring_stability',
    score: Math.round(score),
    severity,
    recommendations,
    affectsGoals: ['muscle_up', 'iron_cross'],
    priorityExercises,
  }
}

/**
 * Analyze recovery capacity
 */
function analyzeRecoveryCapacity(factors: UserProfileFactors): WeakPointAssessment {
  let score = 70
  let severity: WeakPointAssessment['severity'] = 'none'
  const recommendations: string[] = []
  
  // Fatigue impacts recovery score
  if (factors.reportedFatigue === 'high') {
    score -= 30
    severity = 'significant'
    recommendations.push('Consider a deload or reduced volume week')
    recommendations.push('Prioritize recovery and sleep')
  } else if (factors.reportedFatigue === 'moderate') {
    score -= 15
    severity = 'moderate'
    recommendations.push('Monitor fatigue levels and adjust volume if needed')
  }
  
  // Sleep quality affects recovery
  if (factors.sleepQuality === 'poor') {
    score -= 20
    severity = severity === 'none' ? 'moderate' : severity
    recommendations.push('Improve sleep quality for better recovery')
  }
  
  // Training frequency impacts recovery demands
  if (factors.trainingDaysPerWeek > 5 && factors.recoveryCapacity !== 'high') {
    score -= 15
    severity = severity === 'none' ? 'minor' : severity
    recommendations.push('Consider reducing training frequency for better recovery')
  }
  
  return {
    category: 'recovery_capacity',
    score: Math.max(20, Math.round(score)),
    severity,
    recommendations,
    affectsGoals: [],
    priorityExercises: [],
  }
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

export interface WeakPointAnalysisResult {
  overallReadiness: number
  weakPointsByPriority: WeakPointAssessment[]
  topRecommendations: string[]
  exercisePriorities: string[]
  progressionRecommendation: 'conservative' | 'moderate' | 'aggressive'
  frequencyRecommendation: number
  volumeRecommendation: 'minimal' | 'low' | 'moderate' | 'high'
  safetyWarnings: string[]
}

/**
 * Comprehensive weak point analysis
 */
export function analyzeWeakPoints(factors: UserProfileFactors): WeakPointAnalysisResult {
  // Run all assessments
  const assessments: WeakPointAssessment[] = [
    analyzePullingStrength(factors),
    analyzePushingStrength(factors),
    analyzeCoreStrength(factors),
    analyzeStraightArmTolerance(factors),
    analyzeTendonConditioning(factors),
    analyzeRingStability(factors),
    analyzeRecoveryCapacity(factors),
  ]
  
  // Sort by severity (worst first)
  const severityOrder = { critical: 0, significant: 1, moderate: 2, minor: 3, none: 4 }
  const sortedAssessments = [...assessments].sort((a, b) => 
    severityOrder[a.severity] - severityOrder[b.severity]
  )
  
  // Calculate overall readiness
  const avgScore = assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length
  
  // Collect top recommendations (from worst weak points)
  const topRecommendations: string[] = []
  const exercisePriorities: string[] = []
  const safetyWarnings: string[] = []
  
  for (const assessment of sortedAssessments.slice(0, 3)) {
    topRecommendations.push(...assessment.recommendations.slice(0, 2))
    exercisePriorities.push(...assessment.priorityExercises.slice(0, 3))
    
    if (assessment.severity === 'critical' || assessment.severity === 'significant') {
      if (assessment.category === 'tendon_conditioning') {
        safetyWarnings.push('Tendon conditioning needs attention before advanced progressions')
      }
      if (assessment.category === 'straight_arm_tolerance') {
        safetyWarnings.push('Build straight-arm foundation before attempting static holds')
      }
    }
  }
  
  // Determine progression aggressiveness
  let progressionRecommendation: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  if (avgScore < 40 || sortedAssessments[0].severity === 'critical') {
    progressionRecommendation = 'conservative'
  } else if (avgScore > 75 && sortedAssessments[0].severity === 'none') {
    progressionRecommendation = 'aggressive'
  }
  
  // Determine frequency based on recovery capacity
  const recoveryAssessment = assessments.find(a => a.category === 'recovery_capacity')!
  let frequencyRecommendation = factors.trainingDaysPerWeek
  if (recoveryAssessment.score < 50) {
    frequencyRecommendation = Math.max(2, frequencyRecommendation - 1)
  }
  
  // Determine volume recommendation
  let volumeRecommendation: 'minimal' | 'low' | 'moderate' | 'high' = 'moderate'
  if (avgScore < 40 || factors.reportedFatigue === 'high') {
    volumeRecommendation = 'low'
  } else if (factors.experienceLevel === 'beginner') {
    volumeRecommendation = 'low'
  } else if (avgScore > 75 && factors.recoveryCapacity === 'high') {
    volumeRecommendation = 'high'
  }
  
  return {
    overallReadiness: Math.round(avgScore),
    weakPointsByPriority: sortedAssessments,
    topRecommendations: [...new Set(topRecommendations)].slice(0, 5),
    exercisePriorities: [...new Set(exercisePriorities)].slice(0, 8),
    progressionRecommendation,
    frequencyRecommendation,
    volumeRecommendation,
    safetyWarnings,
  }
}

/**
 * Get specific recommendations for a skill goal
 */
export function getSkillSpecificRecommendations(
  skillGoal: SkillGoal,
  analysis: WeakPointAnalysisResult
): {
  supportExercises: string[]
  focusAreas: string[]
  timelineEstimate: string
  readinessLevel: 'not_ready' | 'foundation' | 'progressing' | 'ready'
} {
  const supportExercises: string[] = []
  const focusAreas: string[] = []
  
  // Find relevant weak points for this skill
  const relevantWeakPoints = analysis.weakPointsByPriority.filter(wp =>
    wp.affectsGoals.includes(skillGoal)
  )
  
  for (const wp of relevantWeakPoints) {
    supportExercises.push(...wp.priorityExercises)
    focusAreas.push(wp.category.replace(/_/g, ' '))
  }
  
  // Determine readiness level
  let readinessLevel: 'not_ready' | 'foundation' | 'progressing' | 'ready' = 'progressing'
  const criticalWeakPoints = relevantWeakPoints.filter(wp => 
    wp.severity === 'critical' || wp.severity === 'significant'
  )
  
  if (criticalWeakPoints.length >= 2) {
    readinessLevel = 'not_ready'
  } else if (criticalWeakPoints.length === 1) {
    readinessLevel = 'foundation'
  } else if (relevantWeakPoints.every(wp => wp.severity === 'none')) {
    readinessLevel = 'ready'
  }
  
  // Estimate timeline
  let timelineEstimate = '2-4 months'
  if (readinessLevel === 'not_ready') {
    timelineEstimate = '6-12 months of foundation work'
  } else if (readinessLevel === 'foundation') {
    timelineEstimate = '3-6 months with focused training'
  } else if (readinessLevel === 'ready') {
    timelineEstimate = '1-3 months for progression'
  }
  
  return {
    supportExercises: [...new Set(supportExercises)].slice(0, 6),
    focusAreas: [...new Set(focusAreas)],
    timelineEstimate,
    readinessLevel,
  }
}
