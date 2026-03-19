/**
 * Training Feedback Loop
 * 
 * Canonical module for summarizing recent training outcomes and feeding
 * them into the adaptive engine. This creates the real feedback loop
 * between completed workouts and future programming decisions.
 * 
 * This module:
 * - Summarizes recent workout outcomes
 * - Computes adherence quality
 * - Tracks progression success/failure
 * - Identifies stress patterns
 * - Generates adjustment reason codes
 */

import { getWorkoutLogs, type WorkoutLog, type PerceivedDifficulty } from './workout-log-service'
import { getRecentSessionFeedback, type SessionFeedback, computeFatigueStateFromFeedback } from './session-feedback'
import { getStrengthRecords, type StrengthRecord } from './strength-service'
import { getSkillSessions, type SkillSession } from './skill-session-service'

// =============================================================================
// TYPES
// =============================================================================

export type AdjustmentReasonCode =
  | 'fatigue_high'
  | 'fatigue_moderate'
  | 'progression_advance'
  | 'progression_hold'
  | 'progression_regress'
  | 'missed_sessions'
  | 'high_compliance'
  | 'limiter_shifted'
  | 'flexible_frequency_contract'
  | 'flexible_frequency_expand'
  | 'difficulty_trending_up'
  | 'difficulty_trending_down'
  | 'recovery_needed'
  | 'stable_performance'
  | 'insufficient_data'

export type AdherenceQuality = 'excellent' | 'good' | 'moderate' | 'poor' | 'insufficient_data'
export type StressState = 'overreaching' | 'stable' | 'underloading' | 'unknown'

export interface ExerciseOutcomeSummary {
  exerciseId: string
  exerciseName: string
  completionRate: number // 0-1
  averageRPE: number | null
  targetsMet: number
  targetsMissed: number
  progressionPotential: 'ready' | 'hold' | 'regress' | 'insufficient_data'
}

export interface MovementPatternStress {
  pattern: 'push' | 'pull' | 'core' | 'skill' | 'legs'
  volumeLoad: number // Relative volume in last 7 days
  recentDifficulty: PerceivedDifficulty | null
  isOverstressed: boolean
}

export interface TrainingFeedbackSummary {
  // Core metrics
  recentCompletionRate: number // 0-1, sessions completed / sessions planned
  recentDifficultyTrend: 'increasing' | 'stable' | 'decreasing'
  recentFatigueTrend: 'increasing' | 'stable' | 'decreasing'
  progressionSuccessRate: number // 0-1, targets met / targets attempted
  
  // Adherence
  adherenceQuality: AdherenceQuality
  totalSessionsLast7Days: number
  totalSessionsLast14Days: number
  missedSessionsLast7Days: number
  
  // Stress analysis
  stressState: StressState
  mostStressedPatterns: MovementPatternStress[]
  
  // Progression tracking
  exerciseOutcomes: ExerciseOutcomeSummary[]
  
  // Adjustment signals
  adjustmentReasons: AdjustmentReasonCode[]
  adjustmentSummary: string
  
  // Confidence
  dataConfidence: 'none' | 'low' | 'medium' | 'high'
  
  // Raw counts for downstream use
  trustedWorkoutCount: number
  lastWorkoutDate: string | null
  daysSinceLastWorkout: number | null
  
  // Fatigue modifiers from session feedback
  intensityModifier: number
  volumeModifier: number
  needsDeload: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LOOKBACK_DAYS_SHORT = 7
const LOOKBACK_DAYS_MEDIUM = 14
const MIN_SESSIONS_FOR_TREND = 3
const MIN_SESSIONS_FOR_HIGH_CONFIDENCE = 5
const COMPLETION_RATE_EXCELLENT = 0.9
const COMPLETION_RATE_GOOD = 0.75
const COMPLETION_RATE_MODERATE = 0.5

// =============================================================================
// TRUSTED DATA FILTER
// =============================================================================

/**
 * Check if a workout log is trusted (real user data, not demo/debug)
 * 
 * FEEDBACK LOOP: This is the canonical filter for trusted data.
 * Only trusted logs affect adaptive decisions.
 */
function isTrustedWorkoutLog(log: WorkoutLog): boolean {
  try {
    // Basic structure validation
    if (!log.id || !log.sessionDate || !log.createdAt) return false
    
    // Explicit trusted field takes precedence (set by quickLogWorkout)
    if (log.trusted === false) return false
    
    // Demo sources are never trusted
    if (log.sourceRoute === 'demo') return false
    
    // Validate date sanity
    const sessionDate = new Date(log.sessionDate)
    const now = new Date()
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    
    if (sessionDate > now || sessionDate < oneYearAgo) return false
    if (!Array.isArray(log.exercises)) return false
    if (log.durationMinutes && (log.durationMinutes < 1 || log.durationMinutes > 300)) return false
    
    // If trusted field is explicitly set, use it
    if (log.trusted === true) return true
    
    // Legacy logs without trusted field: assume trusted if they pass other checks
    return true
  } catch {
    return false
  }
}

// =============================================================================
// MAIN SUMMARY FUNCTION
// =============================================================================

/**
 * Build a comprehensive training feedback summary from recent workout data.
 * This is the canonical source for all adaptive engine decisions.
 */
export function buildTrainingFeedbackSummary(): TrainingFeedbackSummary {
  console.log('[feedback-summary] Building training feedback summary')
  
  const now = Date.now()
  const sevenDaysAgo = now - (LOOKBACK_DAYS_SHORT * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = now - (LOOKBACK_DAYS_MEDIUM * 24 * 60 * 60 * 1000)
  
  // Get and filter trusted workout logs
  const allLogs = getWorkoutLogs()
  const trustedLogs = allLogs.filter(isTrustedWorkoutLog)
  
  const recentLogs7d = trustedLogs.filter(log => 
    new Date(log.sessionDate).getTime() >= sevenDaysAgo
  )
  const recentLogs14d = trustedLogs.filter(log => 
    new Date(log.sessionDate).getTime() >= fourteenDaysAgo
  )
  
  // Get session feedback for fatigue analysis
  const feedbackEntries = getRecentSessionFeedback(15)
  const fatigueState = computeFatigueStateFromFeedback(feedbackEntries)
  
  // Calculate completion rate (simplified - based on sessions logged vs expected)
  // For now, we assume 3-5 sessions per week is typical
  const expectedSessions7d = 4
  const completionRate = Math.min(1, recentLogs7d.length / expectedSessions7d)
  
  // Calculate difficulty trend from recent logs
  const difficultyTrend = calculateDifficultyTrend(recentLogs7d)
  
  // Map fatigue trend from session feedback
  const fatigueTrend = fatigueState.trend === 'worsening' ? 'increasing' 
    : fatigueState.trend === 'improving' ? 'decreasing' 
    : 'stable'
  
  // Calculate progression success from exercise data
  const exerciseOutcomes = analyzeExerciseOutcomes(recentLogs14d)
  const progressionSuccessRate = calculateProgressionSuccessRate(exerciseOutcomes)
  
  // Determine adherence quality
  const adherenceQuality = determineAdherenceQuality(completionRate, trustedLogs.length)
  
  // Analyze movement pattern stress
  const mostStressedPatterns = analyzeMovementPatternStress(recentLogs7d)
  
  // Determine stress state
  const stressState = determineStressState(fatigueState, completionRate, difficultyTrend)
  
  // Build adjustment reasons
  const adjustmentReasons = buildAdjustmentReasons({
    fatigueState,
    completionRate,
    difficultyTrend,
    progressionSuccessRate,
    recentSessionCount: recentLogs7d.length,
  })
  
  // Generate adjustment summary
  const adjustmentSummary = generateAdjustmentSummary(adjustmentReasons)
  
  // Determine data confidence
  const dataConfidence = determineDataConfidence(trustedLogs.length, recentLogs7d.length)
  
  // Calculate last workout info
  const sortedLogs = [...trustedLogs].sort((a, b) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  const lastWorkoutDate = sortedLogs[0]?.sessionDate || null
  const daysSinceLastWorkout = lastWorkoutDate 
    ? Math.floor((now - new Date(lastWorkoutDate).getTime()) / (24 * 60 * 60 * 1000))
    : null
  
  const summary: TrainingFeedbackSummary = {
    recentCompletionRate: completionRate,
    recentDifficultyTrend: difficultyTrend,
    recentFatigueTrend: fatigueTrend,
    progressionSuccessRate,
    adherenceQuality,
    totalSessionsLast7Days: recentLogs7d.length,
    totalSessionsLast14Days: recentLogs14d.length,
    missedSessionsLast7Days: Math.max(0, expectedSessions7d - recentLogs7d.length),
    stressState,
    mostStressedPatterns,
    exerciseOutcomes,
    adjustmentReasons,
    adjustmentSummary,
    dataConfidence,
    trustedWorkoutCount: trustedLogs.length,
    lastWorkoutDate,
    daysSinceLastWorkout,
    intensityModifier: fatigueState.intensityModifier,
    volumeModifier: fatigueState.volumeModifier,
    needsDeload: fatigueState.needsDeload,
  }
  
  console.log('[feedback-summary] Summary built:', {
    trustedWorkouts: trustedLogs.length,
    completionRate: completionRate.toFixed(2),
    difficultyTrend,
    fatigueTrend,
    adjustmentReasons,
    dataConfidence,
  })
  
  return summary
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateDifficultyTrend(
  logs: WorkoutLog[]
): 'increasing' | 'stable' | 'decreasing' {
  if (logs.length < MIN_SESSIONS_FOR_TREND) return 'stable'
  
  const difficulties = logs
    .filter(l => l.perceivedDifficulty)
    .map(l => l.perceivedDifficulty === 'hard' ? 3 : l.perceivedDifficulty === 'normal' ? 2 : 1)
  
  if (difficulties.length < 2) return 'stable'
  
  // Compare first half to second half
  const midpoint = Math.floor(difficulties.length / 2)
  const olderAvg = difficulties.slice(midpoint).reduce((a, b) => a + b, 0) / (difficulties.length - midpoint)
  const newerAvg = difficulties.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint
  
  if (newerAvg > olderAvg + 0.3) return 'increasing'
  if (newerAvg < olderAvg - 0.3) return 'decreasing'
  return 'stable'
}

function analyzeExerciseOutcomes(logs: WorkoutLog[]): ExerciseOutcomeSummary[] {
  const exerciseMap = new Map<string, {
    completed: number
    total: number
    rpeSum: number
    rpeCount: number
    targetsMet: number
    targetsMissed: number
  }>()
  
  for (const log of logs) {
    for (const exercise of log.exercises) {
      const key = exercise.name.toLowerCase()
      const existing = exerciseMap.get(key) || {
        completed: 0,
        total: 0,
        rpeSum: 0,
        rpeCount: 0,
        targetsMet: 0,
        targetsMissed: 0,
      }
      
      existing.total++
      if (exercise.completed) {
        existing.completed++
        existing.targetsMet++
      } else {
        existing.targetsMissed++
      }
      
      exerciseMap.set(key, existing)
    }
  }
  
  return Array.from(exerciseMap.entries()).map(([name, data]) => ({
    exerciseId: name,
    exerciseName: name,
    completionRate: data.total > 0 ? data.completed / data.total : 0,
    averageRPE: data.rpeCount > 0 ? data.rpeSum / data.rpeCount : null,
    targetsMet: data.targetsMet,
    targetsMissed: data.targetsMissed,
    progressionPotential: data.total < 2 ? 'insufficient_data' 
      : data.completionRate >= 0.9 ? 'ready'
      : data.completionRate >= 0.5 ? 'hold'
      : 'regress',
  }))
}

function calculateProgressionSuccessRate(outcomes: ExerciseOutcomeSummary[]): number {
  const totalTargets = outcomes.reduce((sum, o) => sum + o.targetsMet + o.targetsMissed, 0)
  const metTargets = outcomes.reduce((sum, o) => sum + o.targetsMet, 0)
  
  return totalTargets > 0 ? metTargets / totalTargets : 0
}

function determineAdherenceQuality(
  completionRate: number, 
  totalWorkouts: number
): AdherenceQuality {
  if (totalWorkouts < 3) return 'insufficient_data'
  if (completionRate >= COMPLETION_RATE_EXCELLENT) return 'excellent'
  if (completionRate >= COMPLETION_RATE_GOOD) return 'good'
  if (completionRate >= COMPLETION_RATE_MODERATE) return 'moderate'
  return 'poor'
}

function analyzeMovementPatternStress(logs: WorkoutLog[]): MovementPatternStress[] {
  const patternCounts: Record<string, { count: number; difficulties: PerceivedDifficulty[] }> = {
    push: { count: 0, difficulties: [] },
    pull: { count: 0, difficulties: [] },
    core: { count: 0, difficulties: [] },
    skill: { count: 0, difficulties: [] },
    legs: { count: 0, difficulties: [] },
  }
  
  for (const log of logs) {
    for (const exercise of log.exercises) {
      const category = exercise.category || 'skill'
      if (patternCounts[category]) {
        patternCounts[category].count++
        if (log.perceivedDifficulty) {
          patternCounts[category].difficulties.push(log.perceivedDifficulty)
        }
      }
    }
  }
  
  const maxCount = Math.max(...Object.values(patternCounts).map(p => p.count), 1)
  
  return Object.entries(patternCounts)
    .map(([pattern, data]) => {
      const avgDiff = data.difficulties.length > 0
        ? data.difficulties.filter(d => d === 'hard').length / data.difficulties.length
        : 0
      
      return {
        pattern: pattern as MovementPatternStress['pattern'],
        volumeLoad: data.count / maxCount,
        recentDifficulty: data.difficulties[0] || null,
        isOverstressed: data.count > maxCount * 0.8 && avgDiff > 0.5,
      }
    })
    .sort((a, b) => b.volumeLoad - a.volumeLoad)
}

function determineStressState(
  fatigueState: ReturnType<typeof computeFatigueStateFromFeedback>,
  completionRate: number,
  difficultyTrend: 'increasing' | 'stable' | 'decreasing'
): StressState {
  if (fatigueState.needsDeload) return 'overreaching'
  if (fatigueState.fatigueScore >= 7 && difficultyTrend === 'increasing') return 'overreaching'
  if (completionRate < 0.5 && difficultyTrend === 'increasing') return 'overreaching'
  if (fatigueState.fatigueScore <= 3 && completionRate >= 0.95 && difficultyTrend === 'decreasing') return 'underloading'
  if (fatigueState.confidence === 'low') return 'unknown'
  return 'stable'
}

function buildAdjustmentReasons(params: {
  fatigueState: ReturnType<typeof computeFatigueStateFromFeedback>
  completionRate: number
  difficultyTrend: 'increasing' | 'stable' | 'decreasing'
  progressionSuccessRate: number
  recentSessionCount: number
}): AdjustmentReasonCode[] {
  const reasons: AdjustmentReasonCode[] = []
  
  // Fatigue-based
  if (params.fatigueState.needsDeload) {
    reasons.push('fatigue_high')
  } else if (params.fatigueState.fatigueScore >= 6) {
    reasons.push('fatigue_moderate')
  }
  
  // Completion-based
  if (params.completionRate >= 0.9) {
    reasons.push('high_compliance')
  } else if (params.completionRate < 0.6) {
    reasons.push('missed_sessions')
  }
  
  // Difficulty trend
  if (params.difficultyTrend === 'increasing') {
    reasons.push('difficulty_trending_up')
  } else if (params.difficultyTrend === 'decreasing') {
    reasons.push('difficulty_trending_down')
  }
  
  // Progression
  if (params.progressionSuccessRate >= 0.85) {
    reasons.push('progression_advance')
  } else if (params.progressionSuccessRate >= 0.6) {
    reasons.push('progression_hold')
  } else if (params.progressionSuccessRate < 0.5 && params.recentSessionCount >= 3) {
    reasons.push('progression_regress')
  }
  
  // Recovery
  if (params.fatigueState.needsDeload) {
    reasons.push('recovery_needed')
  }
  
  // Stability
  if (reasons.length === 0 || 
      (params.fatigueState.fatigueScore < 6 && 
       params.completionRate >= 0.7 && 
       params.difficultyTrend === 'stable')) {
    reasons.push('stable_performance')
  }
  
  // Insufficient data
  if (params.recentSessionCount < 2) {
    reasons.push('insufficient_data')
  }
  
  return reasons
}

function generateAdjustmentSummary(reasons: AdjustmentReasonCode[]): string {
  if (reasons.includes('insufficient_data')) {
    return 'Not enough recent data to make adjustments. Continue building consistency.'
  }
  
  if (reasons.includes('fatigue_high') || reasons.includes('recovery_needed')) {
    return 'High fatigue detected. Reducing intensity and volume this week for recovery.'
  }
  
  if (reasons.includes('missed_sessions')) {
    return 'Recent sessions missed. Consider reducing weekly frequency temporarily.'
  }
  
  if (reasons.includes('progression_advance') && reasons.includes('high_compliance')) {
    return 'Excellent progress. Ready to advance difficulty on key exercises.'
  }
  
  if (reasons.includes('difficulty_trending_up') && reasons.includes('fatigue_moderate')) {
    return 'Sessions feeling harder. Maintaining current level while monitoring recovery.'
  }
  
  if (reasons.includes('stable_performance')) {
    return 'Training is progressing well. Maintaining current approach.'
  }
  
  return 'Adapting program based on recent performance.'
}

function determineDataConfidence(
  totalWorkouts: number,
  recentWorkouts: number
): 'none' | 'low' | 'medium' | 'high' {
  if (totalWorkouts === 0) return 'none'
  if (totalWorkouts < 3 || recentWorkouts < 2) return 'low'
  if (totalWorkouts >= MIN_SESSIONS_FOR_HIGH_CONFIDENCE && recentWorkouts >= 3) return 'high'
  return 'medium'
}

// =============================================================================
// EXPORTS FOR ENGINE CONSUMPTION
// =============================================================================

/**
 * Get flexible schedule adjustment input from training feedback
 */
export function getFlexibleScheduleInput(summary: TrainingFeedbackSummary): {
  completionRate: number
  fatigueTrend: 'increasing' | 'stable' | 'decreasing'
  readinessTrend: 'improving' | 'stable' | 'declining'
  progressionStable: boolean
} {
  return {
    completionRate: summary.recentCompletionRate,
    fatigueTrend: summary.recentFatigueTrend,
    readinessTrend: summary.stressState === 'overreaching' ? 'declining'
      : summary.stressState === 'underloading' ? 'improving'
      : 'stable',
    progressionStable: summary.progressionSuccessRate >= 0.6,
  }
}

/**
 * Get progression engine input from training feedback
 */
export function getProgressionEngineInput(summary: TrainingFeedbackSummary, exerciseName: string): {
  fatigueNeedsDeload: boolean
  fatigueScore: number
  recentPerformance: ExerciseOutcomeSummary | null
} {
  const exerciseOutcome = summary.exerciseOutcomes.find(
    e => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  ) || null
  
  return {
    fatigueNeedsDeload: summary.needsDeload,
    fatigueScore: summary.intensityModifier < 0.9 ? 80 : summary.intensityModifier < 0.95 ? 60 : 40,
    recentPerformance: exerciseOutcome,
  }
}

/**
 * Check if we have enough data to make adaptive decisions
 */
export function hasEnoughDataForAdaptation(summary: TrainingFeedbackSummary): boolean {
  return summary.dataConfidence !== 'none' && summary.trustedWorkoutCount >= 2
}

/**
 * Diagnostic function to verify the feedback loop is working.
 * Call this during development to trace the full loop.
 */
export function diagnoseFeedbackLoop(): {
  status: 'no_data' | 'partial_data' | 'operational'
  workoutLogCount: number
  trustedWorkoutCount: number
  feedbackCount: number
  completionRate: number
  fatigueTrend: string
  adjustmentReasons: AdjustmentReasonCode[]
  lastWorkoutDaysAgo: number | null
  issues: string[]
} {
  const summary = buildTrainingFeedbackSummary()
  const allLogs = getWorkoutLogs()
  const trustedLogs = allLogs.filter(isTrustedWorkoutLog)
  const feedbackEntries = getRecentSessionFeedback(10)
  
  const issues: string[] = []
  
  if (allLogs.length === 0) {
    issues.push('No workout logs found')
  }
  
  if (trustedLogs.length === 0 && allLogs.length > 0) {
    issues.push('Workout logs exist but none are trusted')
  }
  
  if (feedbackEntries.length === 0) {
    issues.push('No session feedback entries')
  }
  
  if (summary.daysSinceLastWorkout !== null && summary.daysSinceLastWorkout > 7) {
    issues.push('Last workout was over 7 days ago')
  }
  
  let status: 'no_data' | 'partial_data' | 'operational' = 'no_data'
  if (summary.trustedWorkoutCount >= 3 && feedbackEntries.length >= 2) {
    status = 'operational'
  } else if (summary.trustedWorkoutCount > 0 || feedbackEntries.length > 0) {
    status = 'partial_data'
  }
  
  console.log('[feedback-loop] Diagnostic:', {
    status,
    totalLogs: allLogs.length,
    trustedLogs: trustedLogs.length,
    feedbackEntries: feedbackEntries.length,
    completionRate: summary.recentCompletionRate,
    adjustmentReasons: summary.adjustmentReasons,
    issues,
  })
  
  return {
    status,
    workoutLogCount: allLogs.length,
    trustedWorkoutCount: trustedLogs.length,
    feedbackCount: feedbackEntries.length,
    completionRate: summary.recentCompletionRate,
    fatigueTrend: summary.recentFatigueTrend,
    adjustmentReasons: summary.adjustmentReasons,
    lastWorkoutDaysAgo: summary.daysSinceLastWorkout,
    issues,
  }
}
