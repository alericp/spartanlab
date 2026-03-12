// Daily Readiness Score Engine
// Lightweight, rule-based readiness estimation using existing SpartanLab signals
// NOT a medical assessment - training readiness estimate only

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { calculateTrainingMomentum, type TrainingMomentum } from './training-momentum-engine'
import { getFatigueIndicators, type FatigueIndicators, type RecoveryStatus } from './fatigue-engine'
import { getStoredRPESessions } from './fatigue-score-calculator'

// =============================================================================
// TYPES
// =============================================================================

export type ReadinessTier = 'low' | 'moderate' | 'high'
export type ReadinessRecommendation = 'push' | 'moderate' | 'light'

export interface DailyReadinessResult {
  readinessScore: number // 0-100
  readinessTier: ReadinessTier
  recommendation: ReadinessRecommendation
  explanation: string
  contributingSignals: string[]
  confidence: 'low' | 'medium' | 'high'
  
  // Detailed signals used in calculation
  signals: {
    fatigueScore: number | null
    recoveryStatus: RecoveryStatus | null
    momentumScore: number | null
    recentRPEAvg: number | null
    workoutsLast7Days: number
    daysSinceLastWorkout: number | null
    performanceTrend: 'improving' | 'stable' | 'declining' | null
    missedSessions: boolean
  }
  
  // Timestamp
  calculatedAt: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Score thresholds for tiers
const TIER_THRESHOLDS = {
  high: 70,
  moderate: 40,
  low: 0,
}

// Weights for different signals
const SIGNAL_WEIGHTS = {
  fatigue: 0.30,          // 30% - fatigue/recovery status
  momentum: 0.25,         // 25% - training consistency
  rpe: 0.20,              // 20% - recent RPE/effort
  recency: 0.15,          // 15% - days since last workout
  trend: 0.10,            // 10% - performance trend
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get days since last workout
 */
function getDaysSinceLastWorkout(logs: WorkoutLog[]): number | null {
  if (logs.length === 0) return null
  
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  
  const lastWorkout = new Date(sortedLogs[0].sessionDate)
  const now = new Date()
  const diffTime = now.getTime() - lastWorkout.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate recent RPE average from last 5 sessions
 */
function getRecentRPEAverage(): number | null {
  const rpeSessions = getStoredRPESessions()
  if (rpeSessions.length === 0) return null
  
  const recent = rpeSessions
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 5)
  
  const allRPEs: number[] = []
  for (const session of recent) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (set.actualRPE > 0) {
          allRPEs.push(set.actualRPE)
        }
      }
    }
  }
  
  if (allRPEs.length === 0) return null
  return allRPEs.reduce((sum, rpe) => sum + rpe, 0) / allRPEs.length
}

/**
 * Detect if sessions were likely missed based on schedule gaps
 */
function detectMissedSessions(logs: WorkoutLog[]): boolean {
  if (logs.length < 3) return false
  
  const sortedLogs = [...logs]
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 10)
  
  // Check for gaps > 5 days between sessions in the last 2 weeks
  for (let i = 0; i < sortedLogs.length - 1; i++) {
    const current = new Date(sortedLogs[i].sessionDate)
    const previous = new Date(sortedLogs[i + 1].sessionDate)
    const gapDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24))
    
    if (gapDays > 5) return true
  }
  
  return false
}

/**
 * Infer performance trend from recent workout data
 */
function inferPerformanceTrend(logs: WorkoutLog[]): 'improving' | 'stable' | 'declining' | null {
  if (logs.length < 4) return null
  
  const sortedLogs = [...logs]
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 8)
  
  // Compare completion rates between recent and older sessions
  const recent = sortedLogs.slice(0, 4)
  const older = sortedLogs.slice(4, 8)
  
  if (older.length < 2) return null
  
  const recentCompletionRate = recent.filter(l => 
    l.exercises.every(e => e.completed)
  ).length / recent.length
  
  const olderCompletionRate = older.filter(l => 
    l.exercises.every(e => e.completed)
  ).length / older.length
  
  if (recentCompletionRate > olderCompletionRate + 0.15) return 'improving'
  if (recentCompletionRate < olderCompletionRate - 0.15) return 'declining'
  return 'stable'
}

// =============================================================================
// SCORE COMPONENTS
// =============================================================================

/**
 * Calculate fatigue component (higher = more recovered = better readiness)
 */
function calculateFatigueComponent(fatigue: FatigueIndicators | null): { score: number; signal: string | null } {
  if (!fatigue) {
    return { score: 60, signal: null } // Neutral default
  }
  
  // Invert fatigue score (low fatigue = high readiness)
  const fatigueValue = fatigue.fatigueScore.value
  let score: number
  
  if (fatigueValue <= 25) {
    score = 95 // Very low fatigue = high readiness
  } else if (fatigueValue <= 40) {
    score = 80
  } else if (fatigueValue <= 55) {
    score = 65
  } else if (fatigueValue <= 70) {
    score = 45
  } else {
    score = 25 // High fatigue = low readiness
  }
  
  // Adjust based on recovery status
  switch (fatigue.recoveryStatus) {
    case 'recovered':
      score = Math.min(100, score + 10)
      break
    case 'recovering':
      // Keep as is
      break
    case 'fatigued':
      score = Math.max(0, score - 10)
      break
    case 'overtrained':
      score = Math.max(0, score - 25)
      break
  }
  
  // Generate signal description
  let signal: string | null = null
  if (fatigue.recoveryStatus === 'recovered' || fatigueValue <= 30) {
    signal = 'Well recovered'
  } else if (fatigue.recoveryStatus === 'fatigued' || fatigueValue >= 60) {
    signal = 'Elevated fatigue'
  }
  
  return { score, signal }
}

/**
 * Calculate momentum component (consistency rewards readiness)
 */
function calculateMomentumComponent(momentum: TrainingMomentum | null): { score: number; signal: string | null } {
  if (!momentum || !momentum.hasData) {
    return { score: 50, signal: null } // Neutral default
  }
  
  let signal: string | null = null
  
  // Use momentum score directly but cap extremes
  let score = momentum.score
  
  // Strong momentum is good, but very high shouldn't push readiness too high
  // (might indicate overtraining risk)
  if (score >= 90 && momentum.workoutsLast7Days >= 5) {
    score = 85 // Cap slightly - very high volume week
    signal = 'High training volume'
  } else if (score >= 70) {
    signal = 'Strong consistency'
  } else if (score <= 30 && momentum.workoutsLast7Days <= 1) {
    score = 45 // Low momentum doesn't mean high readiness
    signal = 'Low recent activity'
  }
  
  return { score, signal }
}

/**
 * Calculate RPE component (lower recent RPE = more capacity available)
 */
function calculateRPEComponent(avgRPE: number | null): { score: number; signal: string | null } {
  if (avgRPE === null) {
    return { score: 60, signal: null } // Neutral default
  }
  
  let score: number
  let signal: string | null = null
  
  if (avgRPE <= 6) {
    score = 90
    signal = 'Training felt manageable'
  } else if (avgRPE <= 7) {
    score = 75
  } else if (avgRPE <= 8) {
    score = 60
    signal = 'Moderate effort recently'
  } else if (avgRPE <= 8.5) {
    score = 45
    signal = 'High effort recent sessions'
  } else {
    score = 30
    signal = 'Very demanding recent training'
  }
  
  return { score, signal }
}

/**
 * Calculate recency component (optimal is 1-2 days since last workout)
 */
function calculateRecencyComponent(daysSince: number | null): { score: number; signal: string | null } {
  if (daysSince === null) {
    return { score: 50, signal: 'No workout history' }
  }
  
  let score: number
  let signal: string | null = null
  
  if (daysSince === 0) {
    score = 50 // Just trained today - might need recovery
    signal = 'Trained today'
  } else if (daysSince === 1) {
    score = 80 // Optimal recovery window
    signal = 'Good recovery window'
  } else if (daysSince === 2) {
    score = 90 // Fully recovered
  } else if (daysSince === 3) {
    score = 85
  } else if (daysSince <= 5) {
    score = 70
    signal = 'Extended rest period'
  } else {
    score = 55 // Long gap - preparedness may be lower
    signal = 'Long break from training'
  }
  
  return { score, signal }
}

/**
 * Calculate trend component
 */
function calculateTrendComponent(trend: 'improving' | 'stable' | 'declining' | null): { score: number; signal: string | null } {
  if (trend === null) {
    return { score: 60, signal: null }
  }
  
  switch (trend) {
    case 'improving':
      return { score: 85, signal: 'Performance improving' }
    case 'stable':
      return { score: 65, signal: null }
    case 'declining':
      return { score: 40, signal: 'Performance declining' }
  }
}

// =============================================================================
// MAIN CALCULATION
// =============================================================================

/**
 * Calculate the Daily Readiness Score
 */
export function getDailyReadiness(): DailyReadinessResult {
  // Gather all input signals
  const logs = getWorkoutLogs()
  let momentum: TrainingMomentum | null = null
  let fatigue: FatigueIndicators | null = null
  
  try {
    momentum = calculateTrainingMomentum()
  } catch {
    // Momentum engine may not have data
  }
  
  try {
    fatigue = getFatigueIndicators()
  } catch {
    // Fatigue engine may not have data
  }
  
  const daysSince = getDaysSinceLastWorkout(logs)
  const recentRPE = getRecentRPEAverage()
  const performanceTrend = inferPerformanceTrend(logs)
  const missedSessions = detectMissedSessions(logs)
  const workoutsLast7Days = momentum?.workoutsLast7Days ?? 0
  
  // Calculate each component
  const fatigueComp = calculateFatigueComponent(fatigue)
  const momentumComp = calculateMomentumComponent(momentum)
  const rpeComp = calculateRPEComponent(recentRPE)
  const recencyComp = calculateRecencyComponent(daysSince)
  const trendComp = calculateTrendComponent(performanceTrend)
  
  // Collect contributing signals
  const contributingSignals: string[] = []
  if (fatigueComp.signal) contributingSignals.push(fatigueComp.signal)
  if (momentumComp.signal) contributingSignals.push(momentumComp.signal)
  if (rpeComp.signal) contributingSignals.push(rpeComp.signal)
  if (recencyComp.signal) contributingSignals.push(recencyComp.signal)
  if (trendComp.signal) contributingSignals.push(trendComp.signal)
  
  // Apply missed sessions penalty
  let missedPenalty = 0
  if (missedSessions) {
    missedPenalty = -5
    contributingSignals.push('Irregular training pattern')
  }
  
  // Calculate weighted score
  let readinessScore = 
    (fatigueComp.score * SIGNAL_WEIGHTS.fatigue) +
    (momentumComp.score * SIGNAL_WEIGHTS.momentum) +
    (rpeComp.score * SIGNAL_WEIGHTS.rpe) +
    (recencyComp.score * SIGNAL_WEIGHTS.recency) +
    (trendComp.score * SIGNAL_WEIGHTS.trend) +
    missedPenalty
  
  // Clamp score
  readinessScore = Math.max(0, Math.min(100, Math.round(readinessScore)))
  
  // Determine tier
  let readinessTier: ReadinessTier
  if (readinessScore >= TIER_THRESHOLDS.high) {
    readinessTier = 'high'
  } else if (readinessScore >= TIER_THRESHOLDS.moderate) {
    readinessTier = 'moderate'
  } else {
    readinessTier = 'low'
  }
  
  // Determine recommendation
  let recommendation: ReadinessRecommendation
  if (readinessScore >= 75) {
    recommendation = 'push'
  } else if (readinessScore >= 45) {
    recommendation = 'moderate'
  } else {
    recommendation = 'light'
  }
  
  // Generate explanation
  const explanation = generateExplanation(readinessTier, recommendation, contributingSignals, logs.length)
  
  // Determine confidence based on data availability
  let confidence: 'low' | 'medium' | 'high'
  const dataPoints = [
    fatigue !== null,
    momentum?.hasData ?? false,
    recentRPE !== null,
    logs.length >= 3,
    performanceTrend !== null,
  ].filter(Boolean).length
  
  if (dataPoints >= 4) {
    confidence = 'high'
  } else if (dataPoints >= 2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }
  
  return {
    readinessScore,
    readinessTier,
    recommendation,
    explanation,
    contributingSignals,
    confidence,
    signals: {
      fatigueScore: fatigue?.fatigueScore.value ?? null,
      recoveryStatus: fatigue?.recoveryStatus ?? null,
      momentumScore: momentum?.score ?? null,
      recentRPEAvg: recentRPE,
      workoutsLast7Days,
      daysSinceLastWorkout: daysSince,
      performanceTrend,
      missedSessions,
    },
    calculatedAt: new Date().toISOString(),
  }
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(
  tier: ReadinessTier,
  recommendation: ReadinessRecommendation,
  signals: string[],
  totalWorkouts: number
): string {
  // Not enough data
  if (totalWorkouts < 3) {
    return 'Log more workouts to improve readiness accuracy. Starting with a moderate session is recommended.'
  }
  
  // High readiness
  if (tier === 'high') {
    if (signals.includes('Well recovered') || signals.includes('Good recovery window')) {
      return 'Your recent training trend supports a stronger session today. Push yourself if you feel ready.'
    }
    if (signals.includes('Strong consistency')) {
      return 'Consistent training and good recovery suggest you can handle a challenging session.'
    }
    return 'Conditions look favorable for a productive training session today.'
  }
  
  // Moderate readiness
  if (tier === 'moderate') {
    if (signals.includes('Elevated fatigue') || signals.includes('High effort recent sessions')) {
      return 'Moderate fatigue is present. A controlled, moderate session is recommended.'
    }
    if (signals.includes('Low recent activity') || signals.includes('Long break from training')) {
      return 'Ease back in with a moderate session to rebuild momentum safely.'
    }
    if (signals.includes('Trained today')) {
      return 'If this is your second session today, keep it lighter. Otherwise, a moderate effort is appropriate.'
    }
    return 'A balanced, moderate effort session fits your current state well.'
  }
  
  // Low readiness
  if (signals.includes('Very demanding recent training') || signals.includes('Performance declining')) {
    return 'Recent high-effort sessions suggest keeping today lighter to support recovery.'
  }
  if (signals.includes('Elevated fatigue')) {
    return 'Fatigue signals indicate a lighter session or active recovery would be beneficial.'
  }
  return 'Consider a lighter session or rest day to maintain training quality.'
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get tier label for display
 */
export function getReadinessTierLabel(tier: ReadinessTier): string {
  switch (tier) {
    case 'high': return 'High Readiness'
    case 'moderate': return 'Moderate Readiness'
    case 'low': return 'Low Readiness'
  }
}

/**
 * Get recommendation label for display
 */
export function getRecommendationLabel(rec: ReadinessRecommendation): string {
  switch (rec) {
    case 'push': return 'Push'
    case 'moderate': return 'Moderate'
    case 'light': return 'Light'
  }
}

/**
 * Get tier color
 */
export function getReadinessTierColor(tier: ReadinessTier): string {
  switch (tier) {
    case 'high': return '#22C55E' // Green
    case 'moderate': return '#EAB308' // Yellow
    case 'low': return '#EF4444' // Red
  }
}

/**
 * Get recommendation color
 */
export function getRecommendationColor(rec: ReadinessRecommendation): string {
  switch (rec) {
    case 'push': return '#22C55E' // Green
    case 'moderate': return '#4F6D8A' // Steel blue
    case 'light': return '#F59E0B' // Amber
  }
}

/**
 * Check if readiness data is stale (> 1 day old)
 */
export function isReadinessStale(result: DailyReadinessResult): boolean {
  const calculated = new Date(result.calculatedAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - calculated.getTime()) / (1000 * 60 * 60)
  return hoursDiff > 24
}
