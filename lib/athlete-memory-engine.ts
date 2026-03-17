// Athlete Memory Engine
// Transforms history data into actionable intelligence for adaptive coaching
// Uses workout history, PR records, and program history to inform future decisions

import {
  getWorkoutHistoryForUser,
  getProgramHistoryForUser,
  getPersonalRecordHistoryForUser,
  getAllTimeBestPRs,
  getActiveProgramHistory,
} from './history-service'
import type {
  WorkoutSessionHistory,
  ProgramHistory,
  PersonalRecordHistory,
} from '@/types/history'

// =============================================================================
// TYPES - ATHLETE MEMORY PROFILE
// =============================================================================

export interface AthleteMemoryProfile {
  userId: string
  
  // Activity Status
  lastActiveDate: string | null
  inactivityDays: number
  inactivityLevel: InactivityLevel
  
  // Strength Memory
  peakStrengthMetrics: ExerciseStrengthMetrics[]
  recentStrengthMetrics: ExerciseStrengthMetrics[]
  strengthDropEstimate: StrengthDropEstimate
  
  // Training Tolerance
  volumeToleranceEstimate: VolumeToleranceEstimate
  progressionRateEstimate: ProgressionRateEstimate
  
  // Weakness Profile
  weaknessProfile: WeaknessProfile
  
  // PR Memory
  recentPRs: PersonalRecordHistory[]
  historicalBestPRs: Map<string, PersonalRecordHistory>
  totalPRsAchieved: number
  
  // Program Memory
  previousProgramCount: number
  averageProgramDuration: number
  mostRecentProgramReason: string | null
  
  // Computed Recommendations
  recommendations: MemoryBasedRecommendation[]
  
  // Metadata
  dataQuality: DataQualityLevel
  computedAt: string
}

export type InactivityLevel = 'none' | 'mild' | 'moderate' | 'significant' | 'major'

export interface ExerciseStrengthMetrics {
  exerciseKey: string
  exerciseName: string
  category: 'pull' | 'push' | 'straight_arm' | 'core' | 'legs' | 'other' | 'barbell_hinge' | 'barbell_squat' | 'barbell_press' | 'weighted_calisthenics'
  
  // Best values
  maxWeight?: number
  maxReps?: number
  maxHold?: number
  maxVolume?: number
  max1RM?: number  // Estimated 1RM for barbell/weighted work
  relativeStrength?: number  // Ratio to bodyweight
  
  // Dates
  lastPRDate: string | null
  lastTrainedDate: string | null
}

export interface StrengthDropEstimate {
  pullStrengthDrop: number // 0-100%
  pushStrengthDrop: number
  straightArmDrop: number
  coreDrop: number
  overallDrop: number
  
  // Hybrid strength drops (barbell/loaded work)
  barbellHingeDrop: number  // Deadlift variants
  barbellSquatDrop: number  // Squat variants
  weightedCalisthenicsDrop: number  // WPU, WDip
  
  // Reasoning
  explanation: string
}

export interface VolumeToleranceEstimate {
  estimatedWeeklySets: number
  confidenceLevel: 'low' | 'medium' | 'high'
  recentAverageVolume: number
  peakTolerance: number
  
  // Adjustment factor for new programs
  volumeAdjustmentFactor: number // 0.5-1.2
}

export interface ProgressionRateEstimate {
  pullProgressionRate: 'slow' | 'average' | 'fast'
  pushProgressionRate: 'slow' | 'average' | 'fast'
  skillProgressionRate: 'slow' | 'average' | 'fast'
  overallRate: 'slow' | 'average' | 'fast'
  
  // PR frequency
  averagePRsPerWeek: number
  weeksSinceLastPR: number
}

export interface WeaknessProfile {
  // Push vs Pull imbalance
  pushPullRatio: number // 1.0 = balanced, <1 = pull dominant, >1 = push dominant
  isPushWeak: boolean
  isPullWeak: boolean
  
  // Straight-arm vs Bent-arm
  straightArmLagging: boolean
  
  // Specific weak points detected
  weakPoints: WeakPoint[]
  
  // Volume bias recommendations
  recommendedBias: {
    pushVolumeMultiplier: number
    pullVolumeMultiplier: number
    straightArmVolumeMultiplier: number
  }
}

export interface WeakPoint {
  area: string
  severity: 'minor' | 'moderate' | 'significant'
  evidence: string
}

export interface MemoryBasedRecommendation {
  type: 'intensity' | 'volume' | 'exercise_selection' | 'progression' | 'reintroduction'
  recommendation: string
  reason: string
  adjustmentValue?: number
}

export type DataQualityLevel = 'none' | 'minimal' | 'adequate' | 'rich'

// =============================================================================
// DETRAINING THRESHOLDS
// =============================================================================

const INACTIVITY_THRESHOLDS = {
  mild: { days: 7, strengthLossPercent: 5, volumeReduction: 0.9 },
  moderate: { days: 14, strengthLossPercent: 10, volumeReduction: 0.75 },
  significant: { days: 30, strengthLossPercent: 20, volumeReduction: 0.6 },
  major: { days: 90, strengthLossPercent: 35, volumeReduction: 0.5 },
}

const REINTRODUCTION_DURATION = {
  mild: 1, // weeks
  moderate: 2,
  significant: 3,
  major: 4,
}

// =============================================================================
// MAIN FUNCTION: BUILD ATHLETE MEMORY PROFILE
// =============================================================================

export async function buildAthleteMemoryProfile(
  userId: string
): Promise<AthleteMemoryProfile> {
  // Fetch all historical data in parallel
  const [
    workoutHistory,
    programHistory,
    recentPRs,
    historicalBestPRs,
    activeProgram,
  ] = await Promise.all([
    getWorkoutHistoryForUser(userId, { limit: 100, sortOrder: 'desc' }),
    getProgramHistoryForUser(userId, { limit: 20, sortOrder: 'desc' }),
    getPersonalRecordHistoryForUser(userId, { limit: 50, sortOrder: 'desc' }),
    getAllTimeBestPRs(userId),
    getActiveProgramHistory(userId),
  ])
  
  // Calculate inactivity
  const lastActiveDate = workoutHistory[0]?.workoutDate || null
  const inactivityDays = calculateInactivityDays(lastActiveDate)
  const inactivityLevel = categorizeInactivity(inactivityDays)
  
  // Build strength metrics
  const peakStrengthMetrics = buildPeakStrengthMetrics(historicalBestPRs)
  const recentStrengthMetrics = buildRecentStrengthMetrics(recentPRs)
  
  // Estimate strength drop
  const strengthDropEstimate = estimateStrengthDrop(inactivityDays, inactivityLevel)
  
  // Estimate volume tolerance
  const volumeToleranceEstimate = estimateVolumeTolerance(workoutHistory)
  
  // Estimate progression rate
  const progressionRateEstimate = estimateProgressionRate(recentPRs, workoutHistory)
  
  // Build weakness profile
  const weaknessProfile = buildWeaknessProfile(historicalBestPRs, recentPRs)
  
  // Calculate program stats
  const completedPrograms = programHistory.filter(p => p.status !== 'active')
  const averageProgramDuration = calculateAverageProgramDuration(completedPrograms)
  
  // Assess data quality
  const dataQuality = assessDataQuality(workoutHistory.length, recentPRs.length, programHistory.length)
  
  // Generate recommendations
  const recommendations = generateMemoryBasedRecommendations(
    inactivityLevel,
    strengthDropEstimate,
    volumeToleranceEstimate,
    weaknessProfile,
    progressionRateEstimate
  )
  
  return {
    userId,
    lastActiveDate,
    inactivityDays,
    inactivityLevel,
    peakStrengthMetrics,
    recentStrengthMetrics,
    strengthDropEstimate,
    volumeToleranceEstimate,
    progressionRateEstimate,
    weaknessProfile,
    recentPRs,
    historicalBestPRs,
    totalPRsAchieved: recentPRs.length,
    previousProgramCount: completedPrograms.length,
    averageProgramDuration,
    mostRecentProgramReason: programHistory[0]?.reasonSummary || null,
    recommendations,
    dataQuality,
    computedAt: new Date().toISOString(),
  }
}

// =============================================================================
// INACTIVITY DETECTION
// =============================================================================

function calculateInactivityDays(lastActiveDate: string | null): number {
  if (!lastActiveDate) return 365 // No history = treat as new user
  
  const last = new Date(lastActiveDate)
  const now = new Date()
  const diffMs = now.getTime() - last.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function categorizeInactivity(days: number): InactivityLevel {
  if (days < INACTIVITY_THRESHOLDS.mild.days) return 'none'
  if (days < INACTIVITY_THRESHOLDS.moderate.days) return 'mild'
  if (days < INACTIVITY_THRESHOLDS.significant.days) return 'moderate'
  if (days < INACTIVITY_THRESHOLDS.major.days) return 'significant'
  return 'major'
}

// =============================================================================
// STRENGTH DROP ESTIMATION
// =============================================================================

function estimateStrengthDrop(
  inactivityDays: number,
  level: InactivityLevel
): StrengthDropEstimate {
  // Base drop percentages per category
  const threshold = level === 'none' 
    ? { strengthLossPercent: 0 }
    : INACTIVITY_THRESHOLDS[level]
  
  const baseDrop = threshold.strengthLossPercent
  
  // Different muscle groups detrain at different rates
  // Pull strength tends to be more resilient
  // Straight-arm work detrains faster (neural component)
  // Barbell strength detrains slower than bodyweight (more CNS-dependent)
  const pullDrop = Math.round(baseDrop * 0.8)
  const pushDrop = Math.round(baseDrop * 1.0)
  const straightArmDrop = Math.round(baseDrop * 1.2)
  const coreDrop = Math.round(baseDrop * 0.9)
  
  // Hybrid/barbell detraining rates
  // Deadlift and squats retain better due to lower neural complexity vs skills
  // Weighted calisthenics falls between pure bodyweight and barbell
  const barbellHingeDrop = Math.round(baseDrop * 0.7)  // Deadlift retains well
  const barbellSquatDrop = Math.round(baseDrop * 0.75) // Squat slightly more
  const weightedCalisthenicsDrop = Math.round(baseDrop * 0.85) // Between barbell and BW
  
  const overallDrop = Math.round((pullDrop + pushDrop + straightArmDrop + coreDrop) / 4)
  
  let explanation = ''
  if (level === 'none') {
    explanation = 'Training consistent - no significant detraining detected.'
  } else if (level === 'mild') {
    explanation = `${inactivityDays} days since last session. Minor strength reduction expected, quick recovery likely.`
  } else if (level === 'moderate') {
    explanation = `${inactivityDays} days off. Moderate detraining - recommend 2 weeks of reintroduction.`
  } else if (level === 'significant') {
    explanation = `${inactivityDays} days off. Significant detraining - reduce intensity 20% and rebuild over 3 weeks.`
  } else {
    explanation = `${inactivityDays}+ days off. Major reset required - treat as returning athlete, not beginner.`
  }
  
  return {
    pullStrengthDrop: pullDrop,
    pushStrengthDrop: pushDrop,
    straightArmDrop,
    coreDrop,
    overallDrop,
    
    // Hybrid strength drops
    barbellHingeDrop,
    barbellSquatDrop,
    weightedCalisthenicsDrop,
    
    explanation,
  }
}

// =============================================================================
// VOLUME TOLERANCE ESTIMATION
// =============================================================================

function estimateVolumeTolerance(
  workoutHistory: WorkoutSessionHistory[]
): VolumeToleranceEstimate {
  if (workoutHistory.length === 0) {
    return {
      estimatedWeeklySets: 12,
      confidenceLevel: 'low',
      recentAverageVolume: 0,
      peakTolerance: 12,
      volumeAdjustmentFactor: 0.8, // Conservative for new users
    }
  }
  
  // Calculate average volume from recent sessions
  const recentSessions = workoutHistory.slice(0, 20)
  const volumes = recentSessions
    .map(s => s.totalVolume || 0)
    .filter(v => v > 0)
  
  const recentAverageVolume = volumes.length > 0
    ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
    : 0
  
  const peakTolerance = volumes.length > 0
    ? Math.max(...volumes)
    : 12
  
  // Estimate weekly sets based on training frequency
  const uniqueDates = new Set(recentSessions.map(s => s.workoutDate.split('T')[0]))
  const weeksOfData = Math.max(1, Math.ceil(uniqueDates.size / 3)) // Assume ~3 sessions/week
  const estimatedWeeklySets = Math.round(recentAverageVolume * (uniqueDates.size / weeksOfData))
  
  // Confidence based on data quantity
  const confidenceLevel: 'low' | 'medium' | 'high' = 
    workoutHistory.length < 5 ? 'low' :
    workoutHistory.length < 15 ? 'medium' : 'high'
  
  // Adjustment factor based on consistency
  const volumeAdjustmentFactor = 
    confidenceLevel === 'high' ? 1.0 :
    confidenceLevel === 'medium' ? 0.9 : 0.8
  
  return {
    estimatedWeeklySets,
    confidenceLevel,
    recentAverageVolume,
    peakTolerance,
    volumeAdjustmentFactor,
  }
}

// =============================================================================
// PROGRESSION RATE ESTIMATION
// =============================================================================

function estimateProgressionRate(
  prs: PersonalRecordHistory[],
  workoutHistory: WorkoutSessionHistory[]
): ProgressionRateEstimate {
  if (prs.length === 0) {
    return {
      pullProgressionRate: 'average',
      pushProgressionRate: 'average',
      skillProgressionRate: 'average',
      overallRate: 'average',
      averagePRsPerWeek: 0,
      weeksSinceLastPR: 999,
    }
  }
  
  // Calculate weeks since last PR
  const lastPRDate = prs[0]?.achievedAt
  const weeksSinceLastPR = lastPRDate
    ? Math.floor((Date.now() - new Date(lastPRDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 999
  
  // Calculate average PRs per week
  const oldestPR = prs[prs.length - 1]
  const newestPR = prs[0]
  
  if (!oldestPR || !newestPR) {
    return {
      pullProgressionRate: 'average',
      pushProgressionRate: 'average',
      skillProgressionRate: 'average',
      overallRate: 'average',
      averagePRsPerWeek: 0,
      weeksSinceLastPR,
    }
  }
  
  const prSpanWeeks = Math.max(1, Math.ceil(
    (new Date(newestPR.achievedAt).getTime() - new Date(oldestPR.achievedAt).getTime()) 
    / (7 * 24 * 60 * 60 * 1000)
  ))
  const averagePRsPerWeek = prs.length / prSpanWeeks
  
  // Categorize by exercise category
  const pullPRs = prs.filter(p => isPullExercise(p.exerciseKey))
  const pushPRs = prs.filter(p => isPushExercise(p.exerciseKey))
  const skillPRs = prs.filter(p => isSkillExercise(p.exerciseKey))
  
  const categorizeRate = (count: number, weeks: number): 'slow' | 'average' | 'fast' => {
    const rate = count / Math.max(1, weeks)
    if (rate < 0.3) return 'slow'
    if (rate > 0.8) return 'fast'
    return 'average'
  }
  
  const pullProgressionRate = categorizeRate(pullPRs.length, prSpanWeeks)
  const pushProgressionRate = categorizeRate(pushPRs.length, prSpanWeeks)
  const skillProgressionRate = categorizeRate(skillPRs.length, prSpanWeeks)
  
  // Overall rate
  const overallRate = averagePRsPerWeek < 0.5 ? 'slow' : averagePRsPerWeek > 1.5 ? 'fast' : 'average'
  
  return {
    pullProgressionRate,
    pushProgressionRate,
    skillProgressionRate,
    overallRate,
    averagePRsPerWeek: Math.round(averagePRsPerWeek * 100) / 100,
    weeksSinceLastPR,
  }
}

// =============================================================================
// WEAKNESS PROFILE
// =============================================================================

function buildWeaknessProfile(
  historicalBestPRs: Map<string, PersonalRecordHistory>,
  recentPRs: PersonalRecordHistory[]
): WeaknessProfile {
  // Count PRs by category
  let pullPRCount = 0
  let pushPRCount = 0
  let straightArmPRCount = 0
  
  for (const pr of recentPRs) {
    if (isPullExercise(pr.exerciseKey)) pullPRCount++
    else if (isPushExercise(pr.exerciseKey)) pushPRCount++
    else if (isStraightArmExercise(pr.exerciseKey)) straightArmPRCount++
  }
  
  // Calculate push/pull ratio (1.0 = balanced)
  const total = pullPRCount + pushPRCount || 1
  const pushPullRatio = pushPRCount / Math.max(1, pullPRCount)
  
  // Detect imbalances
  const isPushWeak = pushPullRatio < 0.7
  const isPullWeak = pushPullRatio > 1.4
  
  // Detect straight-arm lagging
  const totalBentArm = pullPRCount + pushPRCount
  const straightArmLagging = straightArmPRCount < totalBentArm * 0.2
  
  // Build weak points list
  const weakPoints: WeakPoint[] = []
  
  if (isPushWeak) {
    weakPoints.push({
      area: 'Pushing Strength',
      severity: pushPullRatio < 0.5 ? 'significant' : 'moderate',
      evidence: `Push/Pull PR ratio: ${pushPullRatio.toFixed(2)}`,
    })
  }
  
  if (isPullWeak) {
    weakPoints.push({
      area: 'Pulling Strength',
      severity: pushPullRatio > 2.0 ? 'significant' : 'moderate',
      evidence: `Push/Pull PR ratio: ${pushPullRatio.toFixed(2)}`,
    })
  }
  
  if (straightArmLagging) {
    weakPoints.push({
      area: 'Straight-Arm Strength',
      severity: 'moderate',
      evidence: 'Limited straight-arm PRs compared to bent-arm work',
    })
  }
  
  // Calculate volume multipliers to address imbalances
  const recommendedBias = {
    pushVolumeMultiplier: isPushWeak ? 1.15 : 1.0,
    pullVolumeMultiplier: isPullWeak ? 1.15 : 1.0,
    straightArmVolumeMultiplier: straightArmLagging ? 1.2 : 1.0,
  }
  
  return {
    pushPullRatio,
    isPushWeak,
    isPullWeak,
    straightArmLagging,
    weakPoints,
    recommendedBias,
  }
}

// =============================================================================
// PEAK STRENGTH METRICS
// =============================================================================

function buildPeakStrengthMetrics(
  historicalBestPRs: Map<string, PersonalRecordHistory>
): ExerciseStrengthMetrics[] {
  const metricsMap = new Map<string, ExerciseStrengthMetrics>()
  
  for (const [key, pr] of historicalBestPRs) {
    const exerciseKey = pr.exerciseKey
    
    if (!metricsMap.has(exerciseKey)) {
      metricsMap.set(exerciseKey, {
        exerciseKey,
        exerciseName: pr.exerciseName,
        category: categorizeExercise(exerciseKey),
        lastPRDate: pr.achievedAt,
        lastTrainedDate: pr.achievedAt,
      })
    }
    
    const metrics = metricsMap.get(exerciseKey)!
    
    // Update based on PR type
    if (pr.prType === 'max_weight' || pr.prType === 'weighted') {
      metrics.maxWeight = Math.max(metrics.maxWeight || 0, pr.valuePrimary)
    } else if (pr.prType === 'max_reps' || pr.prType === 'reps') {
      metrics.maxReps = Math.max(metrics.maxReps || 0, pr.valuePrimary)
    } else if (pr.prType === 'max_hold' || pr.prType === 'hold') {
      metrics.maxHold = Math.max(metrics.maxHold || 0, pr.valuePrimary)
    } else if (pr.prType === 'volume') {
      metrics.maxVolume = Math.max(metrics.maxVolume || 0, pr.valuePrimary)
    }
    
    // Update dates
    if (new Date(pr.achievedAt) > new Date(metrics.lastPRDate || 0)) {
      metrics.lastPRDate = pr.achievedAt
    }
  }
  
  return Array.from(metricsMap.values())
}

function buildRecentStrengthMetrics(
  recentPRs: PersonalRecordHistory[]
): ExerciseStrengthMetrics[] {
  // Similar to peak but only from recent PRs
  const metricsMap = new Map<string, ExerciseStrengthMetrics>()
  
  for (const pr of recentPRs.slice(0, 20)) {
    const exerciseKey = pr.exerciseKey
    
    if (!metricsMap.has(exerciseKey)) {
      metricsMap.set(exerciseKey, {
        exerciseKey,
        exerciseName: pr.exerciseName,
        category: categorizeExercise(exerciseKey),
        lastPRDate: pr.achievedAt,
        lastTrainedDate: pr.achievedAt,
      })
    }
    
    const metrics = metricsMap.get(exerciseKey)!
    
    if (pr.prType === 'max_weight' || pr.prType === 'weighted') {
      metrics.maxWeight = Math.max(metrics.maxWeight || 0, pr.valuePrimary)
    } else if (pr.prType === 'max_reps' || pr.prType === 'reps') {
      metrics.maxReps = Math.max(metrics.maxReps || 0, pr.valuePrimary)
    } else if (pr.prType === 'max_hold' || pr.prType === 'hold') {
      metrics.maxHold = Math.max(metrics.maxHold || 0, pr.valuePrimary)
    }
  }
  
  return Array.from(metricsMap.values())
}

// =============================================================================
// RECOMMENDATIONS
// =============================================================================

function generateMemoryBasedRecommendations(
  inactivityLevel: InactivityLevel,
  strengthDrop: StrengthDropEstimate,
  volumeTolerance: VolumeToleranceEstimate,
  weakness: WeaknessProfile,
  progression: ProgressionRateEstimate
): MemoryBasedRecommendation[] {
  const recommendations: MemoryBasedRecommendation[] = []
  
  // Inactivity-based recommendations
  if (inactivityLevel !== 'none') {
    const reintroWeeks = REINTRODUCTION_DURATION[inactivityLevel]
    const volumeReduction = INACTIVITY_THRESHOLDS[inactivityLevel].volumeReduction
    
    recommendations.push({
      type: 'intensity',
      recommendation: `Reduce starting intensity by ${strengthDrop.overallDrop}%`,
      reason: `${strengthDrop.explanation}`,
      adjustmentValue: 1 - (strengthDrop.overallDrop / 100),
    })
    
    recommendations.push({
      type: 'volume',
      recommendation: `Start with ${Math.round(volumeReduction * 100)}% of previous volume`,
      reason: `Rebuild capacity over ${reintroWeeks} weeks`,
      adjustmentValue: volumeReduction,
    })
    
    recommendations.push({
      type: 'reintroduction',
      recommendation: `Allow ${reintroWeeks} weeks to rebuild baseline`,
      reason: 'Progressive return to previous training levels',
      adjustmentValue: reintroWeeks,
    })
  }
  
  // Volume tolerance recommendations
  if (volumeTolerance.confidenceLevel === 'high') {
    recommendations.push({
      type: 'volume',
      recommendation: `Target ~${volumeTolerance.estimatedWeeklySets} weekly sets`,
      reason: 'Based on historical training tolerance',
      adjustmentValue: volumeTolerance.estimatedWeeklySets,
    })
  }
  
  // Weakness recommendations
  if (weakness.isPushWeak) {
    recommendations.push({
      type: 'exercise_selection',
      recommendation: 'Increase pushing volume by 15%',
      reason: `Push/Pull ratio (${weakness.pushPullRatio.toFixed(2)}) indicates push deficit`,
      adjustmentValue: 1.15,
    })
  }
  
  if (weakness.isPullWeak) {
    recommendations.push({
      type: 'exercise_selection',
      recommendation: 'Increase pulling volume by 15%',
      reason: `Push/Pull ratio (${weakness.pushPullRatio.toFixed(2)}) indicates pull deficit`,
      adjustmentValue: 1.15,
    })
  }
  
  if (weakness.straightArmLagging) {
    recommendations.push({
      type: 'exercise_selection',
      recommendation: 'Prioritize straight-arm work in program',
      reason: 'Historical data shows limited straight-arm progression',
      adjustmentValue: 1.2,
    })
  }
  
  // Progression recommendations
  if (progression.weeksSinceLastPR > 4 && progression.overallRate !== 'slow') {
    recommendations.push({
      type: 'progression',
      recommendation: 'Consider intensity deload to break plateau',
      reason: `${progression.weeksSinceLastPR} weeks since last PR`,
    })
  }
  
  return recommendations
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateAverageProgramDuration(programs: ProgramHistory[]): number {
  if (programs.length === 0) return 0
  
  const durations = programs
    .filter(p => p.archivedAt)
    .map(p => {
      const start = new Date(p.createdAt)
      const end = new Date(p.archivedAt!)
      return Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
    })
  
  if (durations.length === 0) return 0
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
}

function assessDataQuality(
  workoutCount: number,
  prCount: number,
  programCount: number
): DataQualityLevel {
  const total = workoutCount + prCount + programCount
  
  if (total === 0) return 'none'
  if (total < 10) return 'minimal'
  if (total < 30) return 'adequate'
  return 'rich'
}

function categorizeExercise(exerciseKey: string): 'pull' | 'push' | 'straight_arm' | 'core' | 'legs' | 'other' | 'barbell_hinge' | 'barbell_squat' | 'barbell_press' | 'weighted_calisthenics' {
  const key = exerciseKey.toLowerCase()
  
  // Hybrid/barbell categories first (more specific)
  if (key.includes('deadlift') || key.includes('rdl') || key.includes('romanian')) return 'barbell_hinge'
  if (key.includes('back_squat') || key.includes('front_squat') || key.includes('barbell_squat')) return 'barbell_squat'
  if (key.includes('bench_press') || key.includes('overhead_press') || key.includes('barbell_press')) return 'barbell_press'
  if (key.includes('weighted_pull') || key.includes('weighted_dip') || key.includes('weighted_muscle')) return 'weighted_calisthenics'
  
  // Traditional calisthenics categories
  if (key.includes('pull') || key.includes('row') || key.includes('curl')) return 'pull'
  if (key.includes('push') || key.includes('dip') || key.includes('press')) return 'push'
  if (key.includes('lever') || key.includes('planche') || key.includes('support')) return 'straight_arm'
  if (key.includes('core') || key.includes('hollow') || key.includes('l-sit')) return 'core'
  if (key.includes('squat') || key.includes('lunge')) return 'legs'
  return 'other'
  }

function isPullExercise(key: string): boolean {
  return categorizeExercise(key) === 'pull'
}

function isPushExercise(key: string): boolean {
  return categorizeExercise(key) === 'push'
}

function isStraightArmExercise(key: string): boolean {
  return categorizeExercise(key) === 'straight_arm'
}

function isSkillExercise(key: string): boolean {
  const k = key.toLowerCase()
  return k.includes('lever') || k.includes('planche') || k.includes('muscle_up') || k.includes('handstand')
  }

function isBarbellExercise(key: string): boolean {
  const category = categorizeExercise(key)
  return ['barbell_hinge', 'barbell_squat', 'barbell_press'].includes(category)
  }

function isDeadliftExercise(key: string): boolean {
  return categorizeExercise(key) === 'barbell_hinge'
  }

function isWeightedCalisthenicsExercise(key: string): boolean {
  return categorizeExercise(key) === 'weighted_calisthenics'
  }

function isHybridExercise(key: string): boolean {
  return isBarbellExercise(key) || isWeightedCalisthenicsExercise(key)
  }
  
  // =============================================================================
// PROGRAM GENERATION ADJUSTMENTS
// =============================================================================

export interface ProgramAdjustments {
  intensityMultiplier: number // 0.5-1.0
  volumeMultiplier: number // 0.5-1.2
  pushVolumeMultiplier: number
  pullVolumeMultiplier: number
  straightArmVolumeMultiplier: number
  reintroductionWeeks: number
  useHistoricalBaselines: boolean
  prBasedTargets: Map<string, number> // exerciseKey -> target value
  explanations: string[]
}

/**
 * Generate program adjustments based on athlete memory
 * This is injected into program generation
 */
export function getProgramAdjustments(
  memory: AthleteMemoryProfile
): ProgramAdjustments {
  const explanations: string[] = []
  
  // Base multipliers
  let intensityMultiplier = 1.0
  let volumeMultiplier = 1.0
  let reintroductionWeeks = 0
  
  // Apply inactivity adjustments
  if (memory.inactivityLevel !== 'none') {
    const threshold = INACTIVITY_THRESHOLDS[memory.inactivityLevel]
    intensityMultiplier = 1 - (threshold.strengthLossPercent / 100)
    volumeMultiplier = threshold.volumeReduction
    reintroductionWeeks = REINTRODUCTION_DURATION[memory.inactivityLevel]
    
    explanations.push(memory.strengthDropEstimate.explanation)
  }
  
  // Apply volume tolerance (if we have good data)
  if (memory.volumeToleranceEstimate.confidenceLevel !== 'low') {
    volumeMultiplier *= memory.volumeToleranceEstimate.volumeAdjustmentFactor
    explanations.push(`Volume adjusted based on ${memory.volumeToleranceEstimate.confidenceLevel} confidence historical data`)
  }
  
  // Get weakness-based multipliers
  const { pushVolumeMultiplier, pullVolumeMultiplier, straightArmVolumeMultiplier } = 
    memory.weaknessProfile.recommendedBias
  
  if (memory.weaknessProfile.weakPoints.length > 0) {
    const weakAreas = memory.weaknessProfile.weakPoints.map(w => w.area).join(', ')
    explanations.push(`Volume biased to address: ${weakAreas}`)
  }
  
  // Build PR-based targets
  const prBasedTargets = new Map<string, number>()
  for (const metrics of memory.peakStrengthMetrics) {
    if (metrics.maxWeight) {
      // Target 85-95% of historical max based on detraining
      const target = Math.round(metrics.maxWeight * intensityMultiplier)
      prBasedTargets.set(`${metrics.exerciseKey}:weight`, target)
    }
    if (metrics.maxReps) {
      const target = Math.round(metrics.maxReps * intensityMultiplier)
      prBasedTargets.set(`${metrics.exerciseKey}:reps`, target)
    }
  }
  
  if (prBasedTargets.size > 0) {
    explanations.push('Working weights derived from PR history')
  }
  
  return {
    intensityMultiplier,
    volumeMultiplier,
    pushVolumeMultiplier,
    pullVolumeMultiplier,
    straightArmVolumeMultiplier,
    reintroductionWeeks,
    useHistoricalBaselines: memory.dataQuality !== 'none',
    prBasedTargets,
    explanations,
  }
}

/**
 * Get session-level adjustments for returning users on same program
 */
export function getSessionContinuationAdjustments(
  memory: AthleteMemoryProfile
): {
  reduceIntensity: boolean
  intensityReduction: number
  addReAcclimation: boolean
  acclimationSets: number
  explanation: string
} {
  // For same-program continuation after a gap
  if (memory.inactivityLevel === 'none' || memory.inactivityLevel === 'mild') {
    return {
      reduceIntensity: false,
      intensityReduction: 0,
      addReAcclimation: false,
      acclimationSets: 0,
      explanation: 'Training consistent - no adjustments needed',
    }
  }
  
  const reduction = INACTIVITY_THRESHOLDS[memory.inactivityLevel].strengthLossPercent
  
  return {
    reduceIntensity: true,
    intensityReduction: reduction,
    addReAcclimation: memory.inactivityLevel !== 'mild',
    acclimationSets: memory.inactivityLevel === 'moderate' ? 1 : 
                     memory.inactivityLevel === 'significant' ? 2 : 3,
    explanation: `After ${memory.inactivityDays} days off: intensity -${reduction}%, add ${memory.inactivityLevel === 'moderate' ? 1 : memory.inactivityLevel === 'significant' ? 2 : 3} warm-up sets`,
  }
}
