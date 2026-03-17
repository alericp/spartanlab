// Skill Readiness Engine
// Calculates readiness decisions based on the 4 pillars:
// 1. Current Level Validation (Ownership)
// 2. Support Strength Check
// 3. Density/Consistency Check
// 4. Recovery/Trend Safety Check

import type { 
  SkillSession, 
  SkillDensityMetrics,
  ReadinessDecision,
  ReadinessStatus,
  PrimaryLimiter,
  SupportStrengthAssessment,
  SupportFactor,
  SkillAnalysis,
  NextStepGuidance,
  MicroProgression,
} from '@/types/skill-readiness'
import type { StrengthRecord } from '@/lib/strength-service'
import { 
  calculateSkillDensityMetrics, 
  getAggregateSessionStats,
  analyzeDensityTrend,
  analyzeHoldTrend,
} from './skill-density-engine'
import { 
  getSkillProgression, 
  getSkillLevel,
  getMicroProgression,
  getReadinessThresholds,
  type EnhancedSkillDefinition,
} from './skill-progression-rules'
import {
  analyzeProgression as analyzeBandProgression,
  getExerciseBandHistory,
  type ProgressionAnalysis,
  type ResistanceBandColor,
} from './band-progression-engine'

// =============================================================================
// PILLAR 1: CURRENT LEVEL VALIDATION (OWNERSHIP)
// =============================================================================

interface OwnershipAssessment {
  score: number // 0-100
  ownsCurrentLevel: boolean
  metrics: {
    bestHold: number
    averageHold: number
    cleanHoldCount: number
    totalSets: number
    successRate: number
  }
  feedback: string
}

export function calculateOwnershipScore(
  sessions: SkillSession[],
  skillKey: string,
  currentLevel: number,
  experienceLevel: string = 'intermediate'
): OwnershipAssessment {
  const thresholds = getReadinessThresholds(experienceLevel)
  const skillDef = getSkillProgression(skillKey)
  const levelDef = getSkillLevel(skillKey, currentLevel)
  
  if (!skillDef || !levelDef) {
    return {
      score: 0,
      ownsCurrentLevel: false,
      metrics: { bestHold: 0, averageHold: 0, cleanHoldCount: 0, totalSets: 0, successRate: 0 },
      feedback: 'No skill data available.',
    }
  }
  
  const stats = getAggregateSessionStats(sessions, skillKey, currentLevel)
  
  if (stats.totalSets === 0) {
    return {
      score: 0,
      ownsCurrentLevel: false,
      metrics: stats,
      feedback: 'Log your first skill session to assess ownership.',
    }
  }
  
  // Calculate ownership factors
  const minHold = levelDef.minHoldForOwnership
  const targetHold = levelDef.targetHold
  
  // Factor 1: Best hold relative to target (30%)
  const bestHoldScore = Math.min(100, (stats.bestHold / targetHold) * 100)
  
  // Factor 2: Average hold relative to minimum (30%)
  const avgHoldScore = Math.min(100, (stats.averageHold / minHold) * 100)
  
  // Factor 3: Clean hold count (25%)
  const cleanHoldScore = Math.min(100, (stats.cleanHoldCount / thresholds.minCleanHolds) * 100)
  
  // Factor 4: Success rate (15%)
  const successScore = stats.successRate
  
  // Weighted total
  const totalScore = Math.round(
    bestHoldScore * 0.30 +
    avgHoldScore * 0.30 +
    cleanHoldScore * 0.25 +
    successScore * 0.15
  )
  
  // Determine if athlete truly owns the level
  const ownsCurrentLevel = 
    stats.averageHold >= minHold &&
    stats.cleanHoldCount >= thresholds.minCleanHolds &&
    stats.successRate >= 70
  
  // Generate feedback
  let feedback = ''
  if (totalScore >= 85) {
    feedback = 'You have strong ownership of this progression.'
  } else if (totalScore >= 70) {
    feedback = 'Good progress. Continue building consistency.'
  } else if (totalScore >= 50) {
    feedback = 'Developing. Focus on clean, repeatable holds.'
  } else {
    feedback = 'Build more quality volume at this level.'
  }
  
  return {
    score: totalScore,
    ownsCurrentLevel,
    metrics: stats,
    feedback,
  }
}

// =============================================================================
// PILLAR 2: SUPPORT STRENGTH CHECK
// =============================================================================

export function calculateSupportStrengthScore(
  skillKey: string,
  currentLevel: number,
  strengthRecords: StrengthRecord[],
  bodyweight: number | null
): SupportStrengthAssessment {
  const skillDef = getSkillProgression(skillKey)
  
  if (!skillDef) {
    return {
      score: 0,
      hasData: false,
      factors: [],
      missingData: ['Skill not found'],
    }
  }
  
  const { supportStrengthRequirements } = skillDef
  const missingData: string[] = []
  const factors: SupportFactor[] = []
  
  // Check if we have bodyweight
  if (!bodyweight) {
    missingData.push('Bodyweight not set in profile')
  }
  
  // Get the primary exercise records
  const primaryExerciseRecords = strengthRecords.filter(
    r => r.exercise === supportStrengthRequirements.primaryExercise
  )
  
  if (primaryExerciseRecords.length === 0) {
    missingData.push(`No ${supportStrengthRequirements.primaryExercise.replace(/_/g, ' ')} records`)
    
    return {
      score: 50, // Default middle score when no data
      hasData: false,
      factors: [{
        name: 'Primary Support Strength',
        status: 'unknown',
        note: `Add ${supportStrengthRequirements.primaryExercise.replace(/_/g, ' ')} records to improve recommendations`,
      }],
      missingData,
    }
  }
  
  // Get best 1RM
  const bestRecord = primaryExerciseRecords.reduce((best, current) => 
    current.estimatedOneRM > (best?.estimatedOneRM ?? 0) ? current : best
  , primaryExerciseRecords[0])
  
  // Calculate required 1RM for current level
  const requiredPercent = supportStrengthRequirements.minOneRMPercent[currentLevel] ?? 30
  const requiredWeight = bodyweight ? (bodyweight * requiredPercent / 100) : 0
  
  // Calculate score
  let primaryScore = 0
  if (bodyweight && requiredWeight > 0) {
    primaryScore = Math.min(100, (bestRecord.estimatedOneRM / requiredWeight) * 100)
  } else {
    primaryScore = 60 // Default when can't calculate
  }
  
  // Determine status
  let status: 'sufficient' | 'developing' | 'insufficient' | 'unknown' = 'unknown'
  if (primaryScore >= 90) status = 'sufficient'
  else if (primaryScore >= 70) status = 'developing'
  else if (primaryScore > 0) status = 'insufficient'
  
  factors.push({
    name: 'Primary Support Strength',
    status,
    currentValue: bestRecord.estimatedOneRM,
    targetValue: Math.round(requiredWeight),
    unit: 'lbs added',
    note: status === 'sufficient' 
      ? 'Support strength meets requirements' 
      : `Target: +${Math.round(requiredWeight)} lbs for this level`,
  })
  
  // Add additional factors as informational
  supportStrengthRequirements.additionalFactors.forEach(factor => {
    factors.push({
      name: factor,
      status: 'unknown',
      note: 'Not yet tracked',
    })
  })
  
  return {
    score: Math.round(primaryScore),
    hasData: true,
    factors,
    missingData,
  }
}

// =============================================================================
// PILLAR 3: DENSITY/CONSISTENCY CHECK
// =============================================================================

interface DensityAssessment {
  score: number
  meetsRequirements: boolean
  metrics: SkillDensityMetrics
  feedback: string
}

export function calculateDensityScore(
  sessions: SkillSession[],
  skillKey: string,
  currentLevel: number,
  experienceLevel: string = 'intermediate'
): DensityAssessment {
  const thresholds = getReadinessThresholds(experienceLevel)
  const metrics = calculateSkillDensityMetrics(sessions, skillKey, currentLevel)
  
  if (metrics.totalSessions === 0) {
    return {
      score: 0,
      meetsRequirements: false,
      metrics,
      feedback: 'Log skill sessions to track training density.',
    }
  }
  
  // Factor 1: Weekly density (40%)
  const weeklyScore = Math.min(100, (metrics.weeklyDensity / thresholds.minWeeklyDensitySeconds) * 100)
  
  // Factor 2: Session density (30%)
  const sessionScore = Math.min(100, (metrics.sessionDensity / thresholds.minSessionDensitySeconds) * 100)
  
  // Factor 3: Consistency - sessions this week (30%)
  const consistencyScore = Math.min(100, (metrics.sessionsThisWeek / 2) * 100) // Target 2+ sessions/week
  
  const totalScore = Math.round(
    weeklyScore * 0.40 +
    sessionScore * 0.30 +
    consistencyScore * 0.30
  )
  
  const meetsRequirements = 
    metrics.weeklyDensity >= thresholds.minWeeklyDensitySeconds &&
    metrics.sessionsThisWeek >= 1
  
  let feedback = ''
  if (totalScore >= 80) {
    feedback = 'Training density is excellent for progression.'
  } else if (totalScore >= 60) {
    feedback = 'Density is adequate. Consider adding more hold time.'
  } else if (totalScore >= 40) {
    feedback = 'Increase training frequency to build readiness.'
  } else {
    feedback = 'Density is low. More consistent training needed.'
  }
  
  return {
    score: totalScore,
    meetsRequirements,
    metrics,
    feedback,
  }
}

// =============================================================================
// PILLAR 4: TREND/RECOVERY CHECK
// =============================================================================

interface TrendAssessment {
  score: number
  isStable: boolean
  densityTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  holdTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data'
  feedback: string
}

export function calculateTrendScore(
  sessions: SkillSession[],
  skillKey: string,
  currentLevel: number
): TrendAssessment {
  const densityTrend = analyzeDensityTrend(sessions, skillKey, currentLevel)
  const holdTrend = analyzeHoldTrend(sessions, skillKey, currentLevel)
  
  if (densityTrend === 'insufficient_data' && holdTrend === 'insufficient_data') {
    return {
      score: 50, // Neutral
      isStable: true, // Assume stable when no data
      densityTrend,
      holdTrend,
      feedback: 'More sessions needed for trend analysis.',
    }
  }
  
  // Score based on trends
  let score = 70 // Base score
  
  // Adjust for density trend
  if (densityTrend === 'improving') score += 15
  else if (densityTrend === 'declining') score -= 20
  
  // Adjust for hold trend
  if (holdTrend === 'improving') score += 15
  else if (holdTrend === 'declining') score -= 20
  
  score = Math.max(0, Math.min(100, score))
  
  const isStable = densityTrend !== 'declining' && holdTrend !== 'declining'
  
  let feedback = ''
  if (holdTrend === 'improving' && densityTrend === 'improving') {
    feedback = 'Strong upward trend - great momentum.'
  } else if (isStable) {
    feedback = 'Performance is stable and consistent.'
  } else if (holdTrend === 'declining' || densityTrend === 'declining') {
    feedback = 'Recent decline detected. Consider a deload.'
  } else {
    feedback = 'Continue building consistent performance.'
  }
  
  return {
    score,
    isStable,
    densityTrend,
    holdTrend,
    feedback,
  }
}

// =============================================================================
// READINESS DECISION ENGINE
// =============================================================================

export function calculateReadinessDecision(
  sessions: SkillSession[],
  skillKey: string,
  currentLevel: number,
  targetLevel: number,
  strengthRecords: StrengthRecord[],
  bodyweight: number | null,
  experienceLevel: string = 'intermediate'
): ReadinessDecision {
  const thresholds = getReadinessThresholds(experienceLevel)
  const skillDef = getSkillProgression(skillKey)
  
  // Calculate all pillar scores
  const ownership = calculateOwnershipScore(sessions, skillKey, currentLevel, experienceLevel)
  const support = calculateSupportStrengthScore(skillKey, currentLevel, strengthRecords, bodyweight)
  const density = calculateDensityScore(sessions, skillKey, currentLevel, experienceLevel)
  const trend = calculateTrendScore(sessions, skillKey, currentLevel)
  
  // No data case
  if (ownership.metrics.totalSets === 0) {
    return {
      status: 'stay_current',
      confidence: 0,
      primaryLimiter: 'no_data',
      explanation: 'Log your first skill session to receive personalized readiness analysis.',
      detailedFactors: {
        ownershipScore: 0,
        supportStrengthScore: support.score,
        densityScore: 0,
        trendScore: 50,
      },
    }
  }
  
  // Determine primary limiter
  let primaryLimiter: PrimaryLimiter = 'none'
  const limiters: { limiter: PrimaryLimiter; score: number }[] = [
    { limiter: 'insufficient_ownership', score: ownership.score },
    { limiter: 'insufficient_support_strength', score: support.score },
    { limiter: 'insufficient_density', score: density.score },
    { limiter: 'unstable_trend', score: trend.score },
  ]
  
  // Find the weakest factor
  const weakest = limiters.reduce((min, curr) => curr.score < min.score ? curr : min)
  if (weakest.score < 70) {
    primaryLimiter = weakest.limiter
  }
  
  // Check for fatigue/instability first
  if (!trend.isStable && trend.score < 50) {
    return {
      status: 'stabilize',
      confidence: Math.round((100 - trend.score) * 0.8),
      primaryLimiter: trend.holdTrend === 'declining' ? 'recent_fatigue' : 'unstable_trend',
      explanation: 'Recent performance decline suggests accumulated fatigue. Take a deload week or reduce intensity before pushing progression.',
      detailedFactors: {
        ownershipScore: ownership.score,
        supportStrengthScore: support.score,
        densityScore: density.score,
        trendScore: trend.score,
      },
    }
  }
  
  // Already at max level
  if (currentLevel >= (skillDef?.levels.length ?? 0) - 1) {
    return {
      status: 'stay_current',
      confidence: 85,
      primaryLimiter: 'none',
      explanation: 'You are at the highest progression level. Focus on increasing hold times and adding volume.',
      detailedFactors: {
        ownershipScore: ownership.score,
        supportStrengthScore: support.score,
        densityScore: density.score,
        trendScore: trend.score,
      },
    }
  }
  
  // Check for full progression readiness
  const allFactorsStrong = 
    ownership.ownsCurrentLevel &&
    support.score >= thresholds.minSupportStrengthScore &&
    density.meetsRequirements &&
    trend.isStable
  
  if (allFactorsStrong && ownership.score >= 80) {
    return {
      status: 'progress_now',
      confidence: Math.round((ownership.score + support.score + density.score + trend.score) / 4),
      primaryLimiter: 'none',
      explanation: 'You demonstrate strong ownership of your current level with adequate support strength and training density. You are ready to attempt the next progression.',
      detailedFactors: {
        ownershipScore: ownership.score,
        supportStrengthScore: support.score,
        densityScore: density.score,
        trendScore: trend.score,
      },
    }
  }
  
  // Check for micro-progression readiness
  const readyForMicro = 
    ownership.score >= 65 &&
    (support.score >= 50 || !support.hasData) &&
    density.score >= 50 &&
    trend.isStable
  
  if (readyForMicro) {
    const microProg = getMicroProgression(skillKey, currentLevel)
    const explanation = microProg
      ? `You are outperforming your current level but not yet fully ready for the next progression. ${microProg.name} is a good intermediate step.`
      : 'You are ready for an intermediate challenge. Focus on increasing lever length or reducing assistance slightly.'
    
    return {
      status: 'micro_progress',
      confidence: Math.round((ownership.score + density.score) / 2),
      primaryLimiter,
      explanation,
      detailedFactors: {
        ownershipScore: ownership.score,
        supportStrengthScore: support.score,
        densityScore: density.score,
        trendScore: trend.score,
      },
    }
  }
  
  // Default: Stay at current level
  let explanation = 'Continue building at your current progression. '
  if (primaryLimiter === 'insufficient_density') {
    explanation += 'Focus on increasing training frequency and total hold time.'
  } else if (primaryLimiter === 'insufficient_ownership') {
    explanation += 'Build more clean, repeatable holds before advancing.'
  } else if (primaryLimiter === 'insufficient_support_strength') {
    explanation += 'Your weighted strength could use more development to support the next level.'
  } else {
    explanation += 'Consistent training will build the foundation for progression.'
  }
  
  return {
    status: 'stay_current',
    confidence: Math.round((100 - ownership.score) * 0.5 + 50),
    primaryLimiter,
    explanation,
    detailedFactors: {
      ownershipScore: ownership.score,
      supportStrengthScore: support.score,
      densityScore: density.score,
      trendScore: trend.score,
    },
  }
}

// =============================================================================
// NEXT STEP GUIDANCE
// =============================================================================

export function generateNextStepGuidance(
  skillKey: string,
  readiness: ReadinessDecision,
  currentLevel: number
): NextStepGuidance {
  const skillDef = getSkillProgression(skillKey)
  const levelDef = getSkillLevel(skillKey, currentLevel)
  
  if (!skillDef || !levelDef) {
    return {
      priorities: ['Log skill sessions to unlock guidance'],
      exercises: [],
      focusAreas: [],
    }
  }
  
  const priorities: string[] = []
  const exercises: { name: string; purpose: string; setsReps?: string }[] = []
  const focusAreas: string[] = []
  
  // Based on readiness status and limiter
  switch (readiness.status) {
    case 'progress_now':
      priorities.push('Attempt next progression')
      priorities.push('Maintain current level density')
      focusAreas.push('Progressive overload')
      focusAreas.push('Technique refinement')
      break
      
    case 'micro_progress':
      const micro = getMicroProgression(skillKey, currentLevel)
      if (micro) {
        priorities.push(micro.name)
        priorities.push('Current level density work')
        exercises.push({
          name: micro.name,
          purpose: micro.description,
          setsReps: '3-4 sets, max quality holds',
        })
      }
      focusAreas.push('Bridge the gap')
      focusAreas.push('Build confidence')
      break
      
    case 'stay_current':
      priorities.push(`${levelDef.name} density work`)
      
      if (readiness.primaryLimiter === 'insufficient_density') {
        priorities.push('Increase training frequency')
        exercises.push({
          name: `${levelDef.name} holds`,
          purpose: 'Build time under tension',
          setsReps: '4-6 sets, 6-10s holds',
        })
      } else if (readiness.primaryLimiter === 'insufficient_support_strength') {
        const supportEx = skillDef.supportStrengthRequirements.primaryExercise.replace(/_/g, ' ')
        priorities.push(`Develop ${supportEx}`)
        exercises.push({
          name: supportEx.charAt(0).toUpperCase() + supportEx.slice(1),
          purpose: 'Build foundation strength',
          setsReps: '3-5 sets, 3-6 reps',
        })
      } else {
        priorities.push('Quality over quantity')
        exercises.push({
          name: `${levelDef.name} holds`,
          purpose: 'Repeatable clean holds',
          setsReps: '4-5 sets, focus on form',
        })
      }
      
      focusAreas.push('Consistency')
      focusAreas.push('Movement quality')
      break
      
    case 'stabilize':
      priorities.push('Active recovery')
      priorities.push('Reduce skill intensity')
      exercises.push({
        name: 'Light skill practice',
        purpose: 'Maintain pattern without fatigue',
        setsReps: '2-3 easy sets',
      })
      focusAreas.push('Recovery')
      focusAreas.push('Fatigue management')
      break
  }
  
  // Add support strength exercises if relevant
  if (skillDef.supportStrengthRequirements.additionalFactors.length > 0 && 
      readiness.primaryLimiter !== 'insufficient_density') {
    const factor = skillDef.supportStrengthRequirements.additionalFactors[0]
    focusAreas.push(factor)
  }
  
  return {
    priorities: priorities.slice(0, 3),
    exercises: exercises.slice(0, 3),
    focusAreas: focusAreas.slice(0, 3),
  }
}

// =============================================================================
// COMPLETE SKILL ANALYSIS
// =============================================================================

export function generateSkillAnalysis(
  sessions: SkillSession[],
  skillKey: string,
  currentLevel: number,
  targetLevel: number,
  strengthRecords: StrengthRecord[],
  bodyweight: number | null,
  experienceLevel: string = 'intermediate'
): SkillAnalysis {
  const stats = getAggregateSessionStats(sessions, skillKey, currentLevel)
  const density = calculateSkillDensityMetrics(sessions, skillKey, currentLevel)
  const readiness = calculateReadinessDecision(
    sessions, skillKey, currentLevel, targetLevel,
    strengthRecords, bodyweight, experienceLevel
  )
  const support = calculateSupportStrengthScore(skillKey, currentLevel, strengthRecords, bodyweight)
  const nextSteps = generateNextStepGuidance(skillKey, readiness, currentLevel)
  const micro = getMicroProgression(skillKey, currentLevel)
  
  // Determine recent trend
  const holdTrend = analyzeHoldTrend(sessions, skillKey, currentLevel)
  
  return {
    skillName: skillKey,
    currentLevel,
    targetLevel,
    bestHold: stats.bestHold,
    averageHold: stats.averageHold,
    density,
    readiness,
    supportStrength: support,
    microProgression: readiness.status === 'micro_progress' ? micro : null,
    nextSteps,
    recentSessions: density.totalSessions,
    recentTrend: holdTrend,
  }
}

// =============================================================================
// =============================================================================
// BAND ASSISTANCE ASSESSMENT (PILLAR 5)
// =============================================================================

interface BandAssistanceAssessment {
  score: number // 0-100
  currentBand: ResistanceBandColor | null
  recommendedBand: ResistanceBandColor | null
  status: 'no_history' | 'using_assistance' | 'reducing_assistance' | 'unassisted' | 'ready_to_reduce'
  bandProgressionAnalysis: ProgressionAnalysis | null
  readinessAdjustment: number // Negative = need more assistance, Positive = ready to reduce
  feedback: string
}

/**
 * Assess band assistance status and its impact on skill readiness
 * This factors into progression recommendations
 */
export function assessBandAssistance(
  skillKey: string,
  currentLevel: number
): BandAssistanceAssessment {
  // Map skill + level to exercise ID
  const exerciseId = getExerciseIdForSkillLevel(skillKey, currentLevel)
  
  if (!exerciseId) {
    return {
      score: 100,
      currentBand: null,
      recommendedBand: null,
      status: 'unassisted',
      bandProgressionAnalysis: null,
      readinessAdjustment: 0,
      feedback: 'Exercise does not track band assistance.',
    }
  }
  
  // Get band progression analysis
  const analysis = analyzeBandProgression(exerciseId, exerciseId)
  
  if (analysis.status === 'new') {
    return {
      score: 50,
      currentBand: null,
      recommendedBand: analysis.recommendedBand,
      status: 'no_history',
      bandProgressionAnalysis: analysis,
      readinessAdjustment: 0,
      feedback: analysis.recommendation,
    }
  }
  
  // Calculate readiness adjustment based on band status
  let readinessAdjustment = 0
  let status: BandAssistanceAssessment['status'] = 'using_assistance'
  
  if (!analysis.currentBand) {
    // Training unassisted
    status = 'unassisted'
    readinessAdjustment = 10 // Bonus for unassisted work
  } else if (analysis.status === 'ready_to_reduce') {
    status = 'ready_to_reduce'
    readinessAdjustment = 5 // Ready to progress assistance
  } else if (analysis.status === 'progressing') {
    status = 'reducing_assistance'
    readinessAdjustment = 2 // On track
  } else if (analysis.status === 'regressing') {
    readinessAdjustment = -10 // May need more assistance
  } else if (analysis.status === 'stagnating') {
    readinessAdjustment = -5 // Stuck at current band
  }
  
  // Score based on band position (lighter = better)
  const bandScores: Record<ResistanceBandColor, number> = {
    yellow: 95, // Almost unassisted
    red: 85,
    black: 70,
    purple: 55,
    green: 40,
    blue: 25, // Heavy assistance
  }
  
  const baseScore = analysis.currentBand ? bandScores[analysis.currentBand] : 100
  
  // Adjust score based on progression status
  const statusBonus = {
    progressing: 10,
    ready_to_reduce: 15,
    maintaining: 0,
    stagnating: -10,
    regressing: -15,
    new: 0,
  }
  
  const finalScore = Math.max(0, Math.min(100, baseScore + statusBonus[analysis.status]))
  
  // Generate feedback
  let feedback = ''
  if (status === 'unassisted') {
    feedback = 'Training unassisted - great for building true strength.'
  } else if (status === 'ready_to_reduce') {
    feedback = `Ready to reduce assistance from ${analysis.currentBand} to ${analysis.recommendedBand || 'unassisted'}.`
  } else if (status === 'reducing_assistance') {
    feedback = 'Making good progress with band assistance reduction.'
  } else if (analysis.status === 'stagnating') {
    feedback = analysis.reason || 'Consider accessory work to break through plateau.'
  } else if (analysis.status === 'regressing') {
    feedback = 'Performance declining - maintain current band level until recovered.'
  } else {
    feedback = 'Continue building strength at current assistance level.'
  }
  
  return {
    score: finalScore,
    currentBand: analysis.currentBand,
    recommendedBand: analysis.recommendedBand,
    status,
    bandProgressionAnalysis: analysis,
    readinessAdjustment,
    feedback,
  }
}

/**
 * Map skill key + level to exercise ID for band tracking
 */
function getExerciseIdForSkillLevel(skillKey: string, level: number): string | null {
  const exerciseMapping: Record<string, string[]> = {
    front_lever: ['front_lever_tuck', 'front_lever_adv_tuck', 'front_lever_straddle', 'front_lever_half_lay', 'front_lever_full'],
    planche: ['tuck_planche', 'adv_tuck_planche', 'straddle_planche', 'full_planche'],
    muscle_up: ['muscle_up_negative', 'muscle_up_transition', 'muscle_up'],
    back_lever: ['back_lever_tuck', 'back_lever_adv_tuck', 'back_lever_straddle', 'back_lever_full'],
    iron_cross: ['ring_support_hold', 'rto_support_hold', 'assisted_cross_hold', 'cross_negatives', 'partial_cross_hold', 'full_iron_cross'],
    hspu: ['pike_pushup', 'wall_hspu', 'hspu'],
  }
  
  const exercises = exerciseMapping[skillKey]
  if (!exercises || level < 0 || level >= exercises.length) {
    return null
  }
  
  return exercises[level]
}

/**
 * Get band progression insight message for display
 */
export function getBandProgressionInsightMessage(
  assessment: BandAssistanceAssessment
): string | null {
  if (!assessment.bandProgressionAnalysis || assessment.status === 'unassisted') {
    return null
  }
  
  if (assessment.status === 'ready_to_reduce') {
    return `Band assistance reduced based on recent performance. Moving from ${assessment.currentBand} to ${assessment.recommendedBand || 'unassisted'}.`
  }
  
  if (assessment.status === 'reducing_assistance') {
    return `Assistance maintained to preserve form quality while building strength.`
  }
  
  if (assessment.bandProgressionAnalysis.fatigueWarning) {
    return assessment.bandProgressionAnalysis.fatigueReason || null
  }
  
  return null
}

// ENGINE-AWARE READINESS CHECK
// =============================================================================

/**
 * Get readiness with Adaptive Athlete Engine context applied
 * This function modifies the base readiness decision based on engine signals
 */
export function getEngineAwareReadiness(
  baseReadiness: ReadinessDecision,
  engineContext: {
    shouldDelayProgression: boolean
    delayReason: string | null
    readinessBoost: boolean
    boostReason: string | null
  }
): ReadinessDecision {
  // If engine says delay, override to stabilize
  if (engineContext.shouldDelayProgression && 
      (baseReadiness.status === 'progress_now' || baseReadiness.status === 'micro_progress')) {
    return {
      ...baseReadiness,
      status: 'stabilize',
      explanation: engineContext.delayReason || 'Engine recommends focusing on recovery before progression.',
    }
  }
  
  // If engine says boost and borderline, upgrade confidence
  if (engineContext.readinessBoost && baseReadiness.status === 'micro_progress') {
    return {
      ...baseReadiness,
      status: 'progress_now',
      confidence: Math.min(95, baseReadiness.confidence + 10),
      explanation: `${baseReadiness.explanation} ${engineContext.boostReason || ''}`.trim(),
    }
  }
  
  return baseReadiness
}
