// Strength Guidance Engine
// Generates comprehensive strength analysis and insights

import type { ExerciseType, StrengthRecord } from './strength-service'
import type { AthleteProfile } from './data-service'
import {
  calculateRelativeStrengthMetrics,
  type RelativeStrengthMetrics,
  type RelativeStrengthTier,
  getNextTierInfo,
  EXERCISE_RELATIVE_INFO,
} from './relative-strength-engine'
import {
  assessAllSkillSupport,
  calculatePushPullBalance,
  identifyWeakPoint,
  type SkillSupportAssessment,
  type PushPullBalance,
  type StrengthWeakPoint,
  type SkillName,
} from './strength-support-rules'
import {
  calculateStrengthTrend,
  getRecentPerformance,
  calculateAllTrends,
  getOverallMomentum,
  type StrengthTrend,
  type RecentPerformance,
} from './strength-trend-engine'

// =============================================================================
// TYPES
// =============================================================================

export interface ExerciseAnalysis {
  exercise: ExerciseType
  exerciseName: string
  // Performance data
  recentPerformance: RecentPerformance
  relativeMetrics: RelativeStrengthMetrics | null
  trend: StrengthTrend
  // Skill support
  supportedSkills: string[]
  // Insights
  primaryInsight: string
  explanation: string
  nextTierInfo: { nextTier: string | null; gapWeight: number | null } | null
}

export interface StrengthAnalysisSummary {
  // Overall status
  hasData: boolean
  hasBodyweight: boolean
  bodyweight: number | null
  // Exercise analyses
  exercises: Record<ExerciseType, ExerciseAnalysis | null>
  // Aggregated insights
  skillSupport: SkillSupportAssessment[]
  pushPullBalance: PushPullBalance
  weakPoint: StrengthWeakPoint
  overallMomentum: { status: string; explanation: string }
  // Guidance
  primaryRecommendation: string
  secondaryRecommendations: string[]
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze a single exercise comprehensively
 */
export function analyzeExercise(
  records: StrengthRecord[],
  exercise: ExerciseType,
  bodyweight: number | null
): ExerciseAnalysis | null {
  const exerciseRecords = records.filter(r => r.exercise === exercise)
  
  if (exerciseRecords.length === 0) {
    return null
  }
  
  const recentPerformance = getRecentPerformance(records, exercise)
  const trend = calculateStrengthTrend(records, exercise)
  
  // Get relative metrics from best recent or best all-time
  const bestRecord = recentPerformance.bestRecent || recentPerformance.bestAllTime
  const relativeMetrics = bestRecord
    ? calculateRelativeStrengthMetrics(bestRecord, bodyweight)
    : null
  
  // Get next tier info
  let nextTierInfo: { nextTier: string | null; gapWeight: number | null } | null = null
  if (relativeMetrics && relativeMetrics.tier && relativeMetrics.oneRMRatio !== null) {
    const info = getNextTierInfo(
      exercise,
      relativeMetrics.tier,
      relativeMetrics.oneRMRatio,
      bodyweight
    )
    if (info.nextTier) {
      nextTierInfo = {
        nextTier: info.nextTier.charAt(0).toUpperCase() + info.nextTier.slice(1),
        gapWeight: info.gapWeight,
      }
    }
  }
  
  // Generate primary insight
  const primaryInsight = generatePrimaryInsight(relativeMetrics, trend, recentPerformance)
  
  // Generate explanation
  const explanation = generateExerciseExplanation(exercise, relativeMetrics, trend)
  
  return {
    exercise,
    exerciseName: EXERCISE_RELATIVE_INFO[exercise].name,
    recentPerformance,
    relativeMetrics,
    trend,
    supportedSkills: EXERCISE_RELATIVE_INFO[exercise].supportedSkills,
    primaryInsight,
    explanation,
    nextTierInfo,
  }
}

/**
 * Generate primary insight for an exercise
 */
function generatePrimaryInsight(
  metrics: RelativeStrengthMetrics | null,
  trend: StrengthTrend,
  performance: RecentPerformance
): string {
  if (!metrics || !metrics.hasBodyweight) {
    if (performance.bestRecent) {
      return `Latest: +${performance.bestRecent.weightAdded} x ${performance.bestRecent.reps}. Add bodyweight for relative analysis.`
    }
    return 'Log records with bodyweight for complete analysis.'
  }
  
  const tierLabel = metrics.tierLabel
  const trendLabel = trend.label.toLowerCase()
  
  if (trend.direction === 'improving') {
    return `${tierLabel} tier and ${trendLabel}. Great momentum—keep building.`
  }
  
  if (trend.direction === 'regressing') {
    return `${tierLabel} tier but ${trendLabel}. Check recovery and training load.`
  }
  
  if (trend.direction === 'stable') {
    return `${tierLabel} tier and holding steady. Consider progressive overload.`
  }
  
  return `${tierLabel} tier. Log more sessions to track progress.`
}

/**
 * Generate detailed explanation for an exercise
 */
function generateExerciseExplanation(
  exercise: ExerciseType,
  metrics: RelativeStrengthMetrics | null,
  trend: StrengthTrend
): string {
  const info = EXERCISE_RELATIVE_INFO[exercise]
  
  if (!metrics || !metrics.hasBodyweight) {
    return `${info.name} supports ${info.supportedSkills.join(' and ')}. Add bodyweight to see relative strength.`
  }
  
  const ratio = metrics.oneRMRatio !== null 
    ? `${(metrics.oneRMRatio * 100).toFixed(0)}% of bodyweight` 
    : 'unknown'
  
  return `Your 1RM of +${metrics.estimatedOneRM}lbs is ${ratio}. ${info.tipForImprovement}`
}

/**
 * Generate full strength analysis summary
 */
export function generateStrengthAnalysis(
  records: StrengthRecord[],
  profile: AthleteProfile | null
): StrengthAnalysisSummary {
  const bodyweight = profile?.bodyweight || null
  const hasBodyweight = bodyweight !== null && bodyweight > 0
  const hasData = records.length > 0
  
  // Analyze each exercise
  const exercises: Record<ExerciseType, ExerciseAnalysis | null> = {
    weighted_pull_up: analyzeExercise(records, 'weighted_pull_up', bodyweight),
    weighted_dip: analyzeExercise(records, 'weighted_dip', bodyweight),
    weighted_muscle_up: analyzeExercise(records, 'weighted_muscle_up', bodyweight),
  }
  
  // Get relative strength ratios for skill support assessment
  const pullMetrics = exercises.weighted_pull_up?.relativeMetrics
  const pushMetrics = exercises.weighted_dip?.relativeMetrics
  
  const pullRatio = pullMetrics?.oneRMRatio || null
  const pushRatio = pushMetrics?.oneRMRatio || null
  const pullTier = pullMetrics?.tier || null
  const pushTier = pushMetrics?.tier || null
  
  // Assess skill support
  const skillSupport = assessAllSkillSupport(pullRatio, pushRatio)
  
  // Calculate push/pull balance
  const pushPullBalance = calculatePushPullBalance(pullTier, pushTier)
  
  // Identify weak point
  const weakPoint = identifyWeakPoint(skillSupport, pushPullBalance)
  
  // Calculate overall momentum
  const trends = calculateAllTrends(records)
  const overallMomentum = getOverallMomentum(trends)
  
  // Generate recommendations
  const { primaryRecommendation, secondaryRecommendations } = generateRecommendations(
    exercises,
    skillSupport,
    weakPoint,
    hasBodyweight
  )
  
  return {
    hasData,
    hasBodyweight,
    bodyweight,
    exercises,
    skillSupport,
    pushPullBalance,
    weakPoint,
    overallMomentum,
    primaryRecommendation,
    secondaryRecommendations,
  }
}

/**
 * Generate strength recommendations
 */
function generateRecommendations(
  exercises: Record<ExerciseType, ExerciseAnalysis | null>,
  skillSupport: SkillSupportAssessment[],
  weakPoint: StrengthWeakPoint,
  hasBodyweight: boolean
): { primaryRecommendation: string; secondaryRecommendations: string[] } {
  const secondaryRecommendations: string[] = []
  
  // Primary recommendation based on weak point and data availability
  let primaryRecommendation = ''
  
  if (!hasBodyweight) {
    primaryRecommendation = 'Add your bodyweight in profile for accurate relative strength analysis.'
    secondaryRecommendations.push('Log strength records to build trend data.')
    return { primaryRecommendation, secondaryRecommendations }
  }
  
  const pullAnalysis = exercises.weighted_pull_up
  const pushAnalysis = exercises.weighted_dip
  
  if (!pullAnalysis && !pushAnalysis) {
    primaryRecommendation = 'Log your first weighted strength record to unlock analysis.'
    return { primaryRecommendation, secondaryRecommendations }
  }
  
  // Based on weak point
  switch (weakPoint.type) {
    case 'pulling':
      primaryRecommendation = 'Focus on building pulling strength to support skill goals.'
      secondaryRecommendations.push('Add weighted pull-up volume.')
      if (pullAnalysis?.trend.direction === 'stable') {
        secondaryRecommendations.push('Consider micro-loading or rep schemes to break plateau.')
      }
      break
    case 'pushing':
      primaryRecommendation = 'Focus on building pushing strength to support skill goals.'
      secondaryRecommendations.push('Add weighted dip volume.')
      if (pushAnalysis?.trend.direction === 'stable') {
        secondaryRecommendations.push('Consider micro-loading or rep schemes to break plateau.')
      }
      break
    case 'balanced':
      primaryRecommendation = 'Your strength foundation is solid. Continue building all patterns.'
      // Check for any improving trends to reinforce
      if (pullAnalysis?.trend.direction === 'improving') {
        secondaryRecommendations.push('Maintain pull-up momentum.')
      }
      if (pushAnalysis?.trend.direction === 'improving') {
        secondaryRecommendations.push('Maintain dip momentum.')
      }
      break
    default:
      primaryRecommendation = 'Build both push and pull strength for balanced skill support.'
      secondaryRecommendations.push('Alternate focus between weighted pulls and dips.')
  }
  
  // Add next tier recommendations if close
  if (pullAnalysis?.nextTierInfo?.gapWeight && pullAnalysis.nextTierInfo.gapWeight <= 15) {
    secondaryRecommendations.push(
      `+${pullAnalysis.nextTierInfo.gapWeight}lbs to reach ${pullAnalysis.nextTierInfo.nextTier} pull tier.`
    )
  }
  
  if (pushAnalysis?.nextTierInfo?.gapWeight && pushAnalysis.nextTierInfo.gapWeight <= 15) {
    secondaryRecommendations.push(
      `+${pushAnalysis.nextTierInfo.gapWeight}lbs to reach ${pushAnalysis.nextTierInfo.nextTier} dip tier.`
    )
  }
  
  return {
    primaryRecommendation,
    secondaryRecommendations: secondaryRecommendations.slice(0, 3), // Max 3
  }
}

/**
 * Get support status color class
 */
export function getSupportStatusColor(supportLevel: string): string {
  switch (supportLevel) {
    case 'strong_support':
      return 'text-green-400'
    case 'adequate_support':
      return 'text-blue-400'
    case 'borderline_support':
      return 'text-yellow-400'
    case 'likely_limiter':
      return 'text-orange-400'
    default:
      return 'text-[#6A6A6A]'
  }
}

/**
 * Get trend status color class
 */
export function getTrendStatusColor(direction: string): string {
  switch (direction) {
    case 'improving':
      return 'text-green-400'
    case 'stable':
      return 'text-blue-400'
    case 'regressing':
      return 'text-orange-400'
    default:
      return 'text-[#6A6A6A]'
  }
}

/**
 * Get tier color class
 */
export function getTierColor(tier: RelativeStrengthTier | null): string {
  switch (tier) {
    case 'elite':
      return 'text-purple-400'
    case 'advanced':
      return 'text-green-400'
    case 'strong':
      return 'text-blue-400'
    case 'developing':
      return 'text-yellow-400'
    case 'novice':
      return 'text-[#A5A5A5]'
    default:
      return 'text-[#6A6A6A]'
  }
}
