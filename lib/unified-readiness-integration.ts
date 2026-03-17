/**
 * Unified Readiness Integration
 * 
 * Bridges the canonical readiness engine to all AI training engines:
 * - Weak Point Detection Engine
 * - Adaptive Training Cycle Engine
 * - Program Builder
 * - Constraint Detection
 * - Benchmark Testing Engine
 * 
 * This ensures readiness calculations are not isolated but actively
 * feed the entire training intelligence system.
 */

import {
  calculateCanonicalReadiness,
  calculateReadinessFromProfile,
  calculateAllSkillReadiness,
  type CanonicalReadinessResult,
  type SkillType,
  type LimitingFactor,
  type ReadinessComponentScores,
  LIMITING_FACTOR_LABELS,
} from './readiness/canonical-readiness-engine'
import type { AthleteProfile } from './athlete-profile'
import type { AthleteCalibration } from './athlete-calibration'

// =============================================================================
// UNIFIED SKILL READINESS SCORE - Canonical output for all consumers
// =============================================================================

/**
 * Unified SkillReadinessScore - the canonical readiness output
 * This is the shared structure that ALL AI engines should consume
 */
export interface SkillReadinessScore {
  // Identification
  skillName: SkillType
  skillLabel: string
  
  // Core scores
  readinessScore: number // 0-100
  readinessLevel: 'Building' | 'Developing' | 'Approaching' | 'Ready' | 'Advanced'
  
  // Limiters
  primaryLimiter: LimitingFactor
  primaryLimiterLabel: string
  primaryLimiterScore: number // 0-100, lower = more limiting
  secondaryLimiter: LimitingFactor | null
  secondaryLimiterLabel: string | null
  secondaryLimiterScore: number | null
  
  // Component breakdown
  components: ReadinessComponentScores
  strongAreas: LimitingFactor[]
  
  // Data quality
  confidenceScore: number // 0-1, based on data availability
  lastEvaluated: Date
  dataQuality: 'sparse' | 'developing' | 'solid' | 'excellent'
  
  // Coaching guidance
  explanation: string
  recommendation: string
  nextProgression: string
}

/**
 * Multi-skill readiness summary for an athlete
 */
export interface AthleteReadinessSummary {
  athleteId: string
  primarySkill: SkillType | null
  primaryReadiness: SkillReadinessScore | null
  allSkillReadiness: SkillReadinessScore[]
  overallReadinessScore: number // Weighted average
  globalPrimaryLimiter: LimitingFactor
  globalSecondaryLimiter: LimitingFactor | null
  dataQuality: 'sparse' | 'developing' | 'solid' | 'excellent'
  lastEvaluated: Date
}

// =============================================================================
// CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert CanonicalReadinessResult to SkillReadinessScore
 * This bridges the canonical engine output to the unified format
 */
export function canonicalToSkillReadinessScore(
  result: CanonicalReadinessResult,
  confidenceScore: number = 0.7
): SkillReadinessScore {
  // Find lowest component score for limiter scoring
  const componentValues = Object.values(result.components)
  const lowestScore = Math.min(...componentValues)
  const secondLowestScore = componentValues
    .filter(v => v !== lowestScore)
    .sort((a, b) => a - b)[0] || lowestScore
  
  // Map level to readiness level
  const levelMap: Record<string, SkillReadinessScore['readinessLevel']> = {
    'Building': 'Building',
    'Developing': 'Developing',
    'Approaching': 'Approaching',
    'Ready': 'Ready',
    'Advanced': 'Advanced',
  }
  
  // Determine data quality from confidence
  const dataQuality: SkillReadinessScore['dataQuality'] = 
    confidenceScore >= 0.9 ? 'excellent' :
    confidenceScore >= 0.7 ? 'solid' :
    confidenceScore >= 0.4 ? 'developing' : 'sparse'
  
  const skillLabels: Record<SkillType, string> = {
    front_lever: 'Front Lever',
    back_lever: 'Back Lever',
    planche: 'Planche',
    hspu: 'Handstand Push-Up',
    muscle_up: 'Muscle-Up',
    l_sit: 'L-Sit',
    iron_cross: 'Iron Cross',
  }
  
  return {
    skillName: result.skill,
    skillLabel: skillLabels[result.skill] || result.skill,
    readinessScore: result.overallScore,
    readinessLevel: levelMap[result.level] || 'Building',
    primaryLimiter: result.primaryLimiter,
    primaryLimiterLabel: LIMITING_FACTOR_LABELS[result.primaryLimiter],
    primaryLimiterScore: lowestScore,
    secondaryLimiter: result.secondaryLimiter,
    secondaryLimiterLabel: result.secondaryLimiter 
      ? LIMITING_FACTOR_LABELS[result.secondaryLimiter] 
      : null,
    secondaryLimiterScore: result.secondaryLimiter ? secondLowestScore : null,
    components: result.components,
    strongAreas: result.strongAreas,
    confidenceScore,
    lastEvaluated: new Date(),
    dataQuality,
    explanation: result.limitingFactorExplanation,
    recommendation: result.recommendation,
    nextProgression: result.nextProgression,
  }
}

/**
 * Calculate unified skill readiness from profile
 */
export function calculateUnifiedSkillReadiness(
  skill: SkillType,
  profile: AthleteProfile,
  calibration?: AthleteCalibration | null
): SkillReadinessScore {
  const canonicalResult = calculateReadinessFromProfile(skill, profile)
  
  // Calculate confidence based on available data
  let confidence = 0.5 // Base confidence
  
  // Add confidence for strength data
  if (profile.maxPullUps && profile.maxPullUps > 0) confidence += 0.1
  if (profile.maxDips && profile.maxDips > 0) confidence += 0.1
  if (profile.weightedPullUp) confidence += 0.1
  if (profile.weightedDip) confidence += 0.05
  if (profile.hollowHold && profile.hollowHold > 0) confidence += 0.05
  
  // Add confidence for calibration data
  if (calibration) {
    if (calibration.skillLevels && Object.keys(calibration.skillLevels).length > 0) {
      confidence += 0.1
    }
  }
  
  confidence = Math.min(1, confidence)
  
  return canonicalToSkillReadinessScore(canonicalResult, confidence)
}

/**
 * Calculate all skill readiness scores for an athlete
 */
export function calculateAllUnifiedSkillReadiness(
  profile: AthleteProfile,
  calibration?: AthleteCalibration | null
): SkillReadinessScore[] {
  const skills: SkillType[] = ['front_lever', 'planche', 'muscle_up', 'hspu', 'l_sit', 'back_lever', 'iron_cross']
  
  return skills.map(skill => calculateUnifiedSkillReadiness(skill, profile, calibration))
}

/**
 * Generate complete athlete readiness summary
 */
export function generateAthleteReadinessSummary(
  athleteId: string,
  profile: AthleteProfile,
  primaryGoal?: string,
  calibration?: AthleteCalibration | null
): AthleteReadinessSummary {
  const allReadiness = calculateAllUnifiedSkillReadiness(profile, calibration)
  
  // Find primary skill readiness
  const primarySkill = primaryGoal as SkillType | undefined
  const primaryReadiness = primarySkill 
    ? allReadiness.find(r => r.skillName === primarySkill) || null
    : null
  
  // Calculate overall readiness (weighted toward primary skill if set)
  let overallScore = 0
  if (primaryReadiness) {
    // Weight primary skill at 50%, others split remaining
    overallScore = primaryReadiness.readinessScore * 0.5 +
      allReadiness.reduce((sum, r) => sum + r.readinessScore, 0) / allReadiness.length * 0.5
  } else {
    overallScore = allReadiness.reduce((sum, r) => sum + r.readinessScore, 0) / allReadiness.length
  }
  
  // Find global limiters by counting occurrences
  const limiterCounts = new Map<LimitingFactor, number>()
  allReadiness.forEach(r => {
    const current = limiterCounts.get(r.primaryLimiter) || 0
    limiterCounts.set(r.primaryLimiter, current + 1)
  })
  
  const sortedLimiters = [...limiterCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([limiter]) => limiter)
  
  const globalPrimaryLimiter = sortedLimiters[0] || 'none'
  const globalSecondaryLimiter = sortedLimiters[1] || null
  
  // Determine overall data quality
  const avgConfidence = allReadiness.reduce((sum, r) => sum + r.confidenceScore, 0) / allReadiness.length
  const dataQuality: AthleteReadinessSummary['dataQuality'] = 
    avgConfidence >= 0.9 ? 'excellent' :
    avgConfidence >= 0.7 ? 'solid' :
    avgConfidence >= 0.4 ? 'developing' : 'sparse'
  
  return {
    athleteId,
    primarySkill: primarySkill || null,
    primaryReadiness,
    allSkillReadiness: allReadiness,
    overallReadinessScore: Math.round(overallScore),
    globalPrimaryLimiter,
    globalSecondaryLimiter,
    dataQuality,
    lastEvaluated: new Date(),
  }
}

// =============================================================================
// WEAK POINT ENGINE INTEGRATION
// =============================================================================

/**
 * Convert readiness score to weak point input format
 */
export interface WeakPointFromReadiness {
  limiter: LimitingFactor
  limiterLabel: string
  severity: number // 0-100, higher = more severe
  confidence: number
  affectedSkills: SkillType[]
  recommendation: string
}

export function extractWeakPointsFromReadiness(
  readinessSummary: AthleteReadinessSummary
): WeakPointFromReadiness[] {
  const weakPoints: WeakPointFromReadiness[] = []
  
  // Group skills by their primary limiter
  const limiterToSkills = new Map<LimitingFactor, SkillType[]>()
  const limiterSeverities = new Map<LimitingFactor, number[]>()
  
  readinessSummary.allSkillReadiness.forEach(r => {
    if (r.primaryLimiter !== 'none') {
      const skills = limiterToSkills.get(r.primaryLimiter) || []
      skills.push(r.skillName)
      limiterToSkills.set(r.primaryLimiter, skills)
      
      const severities = limiterSeverities.get(r.primaryLimiter) || []
      severities.push(100 - r.primaryLimiterScore) // Invert to severity
      limiterSeverities.set(r.primaryLimiter, severities)
    }
  })
  
  // Create weak point entries
  limiterToSkills.forEach((skills, limiter) => {
    const severities = limiterSeverities.get(limiter) || []
    const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length
    
    weakPoints.push({
      limiter,
      limiterLabel: LIMITING_FACTOR_LABELS[limiter],
      severity: Math.round(avgSeverity),
      confidence: readinessSummary.dataQuality === 'excellent' ? 0.9 :
                  readinessSummary.dataQuality === 'solid' ? 0.7 :
                  readinessSummary.dataQuality === 'developing' ? 0.5 : 0.3,
      affectedSkills: skills,
      recommendation: generateLimiterRecommendation(limiter),
    })
  })
  
  // Sort by severity
  return weakPoints.sort((a, b) => b.severity - a.severity)
}

function generateLimiterRecommendation(limiter: LimitingFactor): string {
  const recommendations: Partial<Record<LimitingFactor, string>> = {
    pull_strength: 'Prioritize weighted pull-up work and vertical pulling volume.',
    straight_arm_pull_strength: 'Focus on front lever progressions and straight-arm pulling drills.',
    straight_arm_push_strength: 'Build planche lean volume and straight-arm pushing strength.',
    compression_strength: 'Add compression drills like L-sit holds and hanging leg raises.',
    scapular_control: 'Include scapular pull-ups and active hangs in your warm-up.',
    shoulder_stability: 'Build shoulder stability with ring support holds and controlled transitions.',
    explosive_pull_power: 'Train explosive high pulls and chest-to-bar pull-ups.',
    transition_strength: 'Practice muscle-up transitions and dip negatives.',
    wrist_tolerance: 'Gradually increase wrist loading with controlled progressions.',
    tendon_tolerance: 'Follow conservative progression and include tendon conditioning work.',
    push_strength: 'Build pushing base with dips and push-up variations.',
    vertical_push_strength: 'Progress pike push-ups and wall HSPU work.',
    core_control: 'Practice hollow body holds and anti-rotation exercises.',
    mobility: 'Address mobility limitations with dedicated stretching.',
    balance_control: 'Include balance work and proprioceptive training.',
  }
  
  return recommendations[limiter] || 'Focus on building strength in this area.'
}

// =============================================================================
// TRAINING CYCLE ENGINE INTEGRATION
// =============================================================================

/**
 * Readiness signals for cycle phase decisions
 */
export interface ReadinessSignalsForCycle {
  overallReadiness: number // 0-100
  primaryLimiter: LimitingFactor
  limiterSeverity: number // 0-100
  progressPotential: 'high' | 'moderate' | 'low'
  suggestedEmphasis: 'accumulation' | 'intensification' | 'skill_focus' | 'recovery'
  dataConfidence: number
}

export function generateReadinessSignalsForCycle(
  readinessSummary: AthleteReadinessSummary
): ReadinessSignalsForCycle {
  const overall = readinessSummary.overallReadinessScore
  const primaryLimiter = readinessSummary.globalPrimaryLimiter
  
  // Find severity of primary limiter
  const primaryReadiness = readinessSummary.primaryReadiness
  const limiterSeverity = primaryReadiness 
    ? 100 - (primaryReadiness.primaryLimiterScore || 50)
    : 50
  
  // Determine progress potential
  let progressPotential: ReadinessSignalsForCycle['progressPotential']
  if (overall >= 70 && limiterSeverity < 40) {
    progressPotential = 'high'
  } else if (overall >= 50 || limiterSeverity < 60) {
    progressPotential = 'moderate'
  } else {
    progressPotential = 'low'
  }
  
  // Suggest cycle emphasis based on readiness
  let suggestedEmphasis: ReadinessSignalsForCycle['suggestedEmphasis']
  if (overall < 40) {
    suggestedEmphasis = 'accumulation' // Build base
  } else if (overall < 60 && limiterSeverity > 50) {
    suggestedEmphasis = 'accumulation' // Address weakness
  } else if (overall >= 75) {
    suggestedEmphasis = 'skill_focus' // Ready for skill work
  } else if (overall >= 60 && limiterSeverity < 40) {
    suggestedEmphasis = 'intensification' // Push harder
  } else {
    suggestedEmphasis = 'accumulation' // Default to building
  }
  
  // Data confidence
  const dataConfidence = readinessSummary.dataQuality === 'excellent' ? 0.9 :
                         readinessSummary.dataQuality === 'solid' ? 0.7 :
                         readinessSummary.dataQuality === 'developing' ? 0.5 : 0.3
  
  return {
    overallReadiness: overall,
    primaryLimiter,
    limiterSeverity,
    progressPotential,
    suggestedEmphasis,
    dataConfidence,
  }
}

// =============================================================================
// PROGRAM BUILDER INTEGRATION
// =============================================================================

/**
 * Readiness-driven program adjustments
 */
export interface ReadinessForProgramBuilder {
  // Core readiness
  primarySkillReadiness: number
  
  // Progression guidance
  suggestedProgressionLevel: 'conservative' | 'moderate' | 'aggressive'
  
  // Volume adjustments
  skillVolumeModifier: number // 0.5 to 1.5
  supportVolumeModifier: number
  
  // Exercise selection hints
  priorityMovementFamilies: string[]
  avoidMovementFamilies: string[]
  
  // Limiter-driven additions
  limiterExercises: Array<{
    exerciseType: string
    reason: string
  }>
}

export function generateReadinessForProgramBuilder(
  readinessSummary: AthleteReadinessSummary
): ReadinessForProgramBuilder {
  const primaryReadiness = readinessSummary.primaryReadiness
  const score = primaryReadiness?.readinessScore || 50
  const limiter = readinessSummary.globalPrimaryLimiter
  
  // Progression level based on readiness
  let suggestedProgressionLevel: ReadinessForProgramBuilder['suggestedProgressionLevel']
  if (score >= 75) {
    suggestedProgressionLevel = 'aggressive'
  } else if (score >= 50) {
    suggestedProgressionLevel = 'moderate'
  } else {
    suggestedProgressionLevel = 'conservative'
  }
  
  // Volume modifiers
  const skillVolumeModifier = score >= 70 ? 1.2 : score >= 50 ? 1.0 : 0.8
  const supportVolumeModifier = score < 50 ? 1.3 : score < 70 ? 1.1 : 1.0
  
  // Movement family priorities based on limiter
  const limiterToPriority: Partial<Record<LimitingFactor, string[]>> = {
    pull_strength: ['vertical_pull', 'horizontal_pull'],
    straight_arm_pull_strength: ['horizontal_pull', 'straight_arm'],
    straight_arm_push_strength: ['horizontal_push', 'straight_arm'],
    compression_strength: ['compression', 'core'],
    scapular_control: ['scapular', 'vertical_pull'],
    shoulder_stability: ['shoulder_stability', 'ring_support'],
    explosive_pull_power: ['explosive_pull', 'vertical_pull'],
    push_strength: ['vertical_push', 'horizontal_push'],
  }
  
  const priorityMovementFamilies = limiterToPriority[limiter] || []
  
  // Limiter exercises
  const limiterExercises: ReadinessForProgramBuilder['limiterExercises'] = []
  
  if (limiter === 'pull_strength') {
    limiterExercises.push({ exerciseType: 'weighted_pull_up', reason: 'Build pulling strength base' })
  } else if (limiter === 'compression_strength') {
    limiterExercises.push({ exerciseType: 'l_sit_hold', reason: 'Develop compression capacity' })
    limiterExercises.push({ exerciseType: 'hanging_leg_raise', reason: 'Build compression strength' })
  } else if (limiter === 'scapular_control') {
    limiterExercises.push({ exerciseType: 'scapular_pull_up', reason: 'Improve scapular control' })
  } else if (limiter === 'shoulder_stability') {
    limiterExercises.push({ exerciseType: 'ring_support_hold', reason: 'Build shoulder stability' })
  } else if (limiter === 'explosive_pull_power') {
    limiterExercises.push({ exerciseType: 'chest_to_bar_pull_up', reason: 'Develop explosive pull' })
  }
  
  return {
    primarySkillReadiness: score,
    suggestedProgressionLevel,
    skillVolumeModifier,
    supportVolumeModifier,
    priorityMovementFamilies,
    avoidMovementFamilies: [], // Could be populated based on injury/stress flags
    limiterExercises,
  }
}

// =============================================================================
// BENCHMARK INTEGRATION
// =============================================================================

/**
 * Readiness adjustments from benchmark changes
 */
export interface ReadinessFromBenchmark {
  benchmarkType: string
  previousValue: number
  newValue: number
  improvement: number // percentage
  affectedSkills: SkillType[]
  readinessImpact: number // estimated score change
}

export function estimateReadinessImpactFromBenchmark(
  benchmarkType: string,
  previousValue: number,
  newValue: number
): ReadinessFromBenchmark {
  const improvement = previousValue > 0 
    ? ((newValue - previousValue) / previousValue) * 100 
    : 0
  
  // Map benchmarks to affected skills
  const benchmarkToSkills: Record<string, SkillType[]> = {
    'max_pull_ups': ['front_lever', 'muscle_up', 'back_lever'],
    'weighted_pull_up': ['front_lever', 'muscle_up', 'iron_cross'],
    'max_dips': ['planche', 'muscle_up', 'hspu'],
    'weighted_dip': ['planche', 'muscle_up', 'hspu'],
    'hollow_hold': ['front_lever', 'planche', 'l_sit'],
    'l_sit_hold': ['l_sit', 'front_lever', 'planche'],
    'pike_push_up': ['hspu'],
    'ring_support': ['iron_cross', 'muscle_up', 'planche'],
  }
  
  const affectedSkills = benchmarkToSkills[benchmarkType] || []
  
  // Estimate readiness impact (roughly 0.5 point per 1% improvement, capped)
  const readinessImpact = Math.min(10, Math.max(-10, improvement * 0.5))
  
  return {
    benchmarkType,
    previousValue,
    newValue,
    improvement: Math.round(improvement * 10) / 10,
    affectedSkills,
    readinessImpact: Math.round(readinessImpact * 10) / 10,
  }
}

// =============================================================================
// EXPLANATION GENERATION
// =============================================================================

/**
 * Generate concise coach-style readiness explanation
 */
export function generateReadinessExplanation(
  readinessScore: SkillReadinessScore
): string {
  const skill = readinessScore.skillLabel
  const score = readinessScore.readinessScore
  const limiter = readinessScore.primaryLimiterLabel
  
  if (score >= 80) {
    return `Strong ${skill} readiness. Continue skill practice for refinement.`
  } else if (score >= 65) {
    return `Good ${skill} progress. ${limiter} is your current focus area.`
  } else if (score >= 50) {
    return `Building toward ${skill}. ${limiter} is currently limiting your progress.`
  } else if (score >= 35) {
    return `Developing ${skill} foundations. Prioritize ${limiter.toLowerCase()} development.`
  } else {
    return `Building base strength for ${skill}. Focus on ${limiter.toLowerCase()}.`
  }
}

/**
 * Generate multi-skill summary explanation
 */
export function generateOverallReadinessExplanation(
  summary: AthleteReadinessSummary
): string {
  const overall = summary.overallReadinessScore
  const limiter = LIMITING_FACTOR_LABELS[summary.globalPrimaryLimiter]
  
  if (overall >= 70) {
    return `Strong overall readiness. ${limiter} can be refined for continued progress.`
  } else if (overall >= 50) {
    return `Developing well across skills. ${limiter} is your primary focus area.`
  } else {
    return `Building foundations. Prioritize ${limiter.toLowerCase()} to unlock skill progress.`
  }
}
