// Fatigue Score Calculator
// Calculates individual fatigue signal components from training data

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { calculateWeeklyVolume, getWeekOverWeekComparison, getWorkoutsLastNDays } from './volume-analyzer'

// =============================================================================
// TYPES
// =============================================================================

export interface RPESessionData {
  sessionId: string
  sessionDate: string
  averageRPE: number
  maxRPE: number
  targetRPE: number
  rpeDelta: number // actual - target
  setsAboveTarget: number
  totalSets: number
}

export interface RepPerformanceData {
  sessionId: string
  sessionDate: string
  repCompletionRate: number // 0-100, percentage of target reps achieved
  holdTimeCompletionRate: number // 0-100, for static holds
  dropOffSets: number // sets where performance dropped vs previous set
}

export interface SessionStressData {
  sessionId: string
  sessionDate: string
  stressScore: number // 0-100
  durationMinutes: number
  exerciseCount: number
  totalVolume: number // sets * reps approximation
}

export interface FatigueSignals {
  rpeEscalation: number // 0-100, how much RPE is trending up
  repDropOff: number // 0-100, how much rep performance is declining
  volumeStress: number // 0-100, based on weekly volume load
  frequencyStress: number // 0-100, based on training density
  recoveryGap: number // 0-100, insufficient rest between sessions
  consistencyDrop: number // 0-100, missed sessions indicator
}

// =============================================================================
// RPE SESSION STORAGE (localStorage for preview mode)
// =============================================================================

const RPE_SESSION_STORAGE_KEY = 'spartanlab_rpe_sessions'

export interface StoredRPESession {
  sessionId: string
  sessionDate: string
  exercises: Array<{
    exerciseName: string
    sets: Array<{
      setNumber: number
      targetRPE: number
      actualRPE: number
      targetReps: number
      actualReps: number
    }>
  }>
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getStoredRPESessions(): StoredRPESession[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(RPE_SESSION_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

export function saveRPESession(session: StoredRPESession): void {
  if (!isBrowser()) return
  const sessions = getStoredRPESessions()
  
  // Replace existing or add new
  const existingIndex = sessions.findIndex(s => s.sessionId === session.sessionId)
  if (existingIndex >= 0) {
    sessions[existingIndex] = session
  } else {
    sessions.push(session)
  }
  
  // Keep only last 30 sessions
  const trimmed = sessions
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 30)
  
  localStorage.setItem(RPE_SESSION_STORAGE_KEY, JSON.stringify(trimmed))
}

// =============================================================================
// SIGNAL CALCULATORS
// =============================================================================

/**
 * Calculate RPE escalation signal
 * Higher score = more RPE creep across recent sessions
 */
export function calculateRPEEscalation(): number {
  const sessions = getStoredRPESessions()
  if (sessions.length < 2) return 0
  
  // Get last 5 sessions
  const recentSessions = sessions.slice(0, 5)
  
  let totalDelta = 0
  let setsAboveTarget = 0
  let totalSets = 0
  
  for (const session of recentSessions) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        const delta = set.actualRPE - set.targetRPE
        totalDelta += delta
        if (delta > 0.5) setsAboveTarget++
        totalSets++
      }
    }
  }
  
  if (totalSets === 0) return 0
  
  const avgDelta = totalDelta / totalSets
  const aboveTargetRate = setsAboveTarget / totalSets
  
  // Score: combination of average delta and rate of sets above target
  // avgDelta of 1.5+ = concerning, aboveTargetRate of 50%+ = concerning
  const deltaScore = Math.min(100, Math.max(0, avgDelta * 40))
  const rateScore = aboveTargetRate * 100
  
  return Math.round((deltaScore * 0.6) + (rateScore * 0.4))
}

/**
 * Calculate rep drop-off signal
 * Higher score = more performance decline within and across sessions
 */
export function calculateRepDropOff(): number {
  const sessions = getStoredRPESessions()
  if (sessions.length === 0) return 0
  
  // Get last 3 sessions
  const recentSessions = sessions.slice(0, 3)
  
  let totalTargetReps = 0
  let totalActualReps = 0
  let dropOffSets = 0
  let totalSets = 0
  
  for (const session of recentSessions) {
    for (const exercise of session.exercises) {
      let prevReps = 0
      for (const set of exercise.sets) {
        totalTargetReps += set.targetReps
        totalActualReps += set.actualReps
        
        // Check for drop-off from previous set
        if (prevReps > 0 && set.actualReps < prevReps - 1) {
          dropOffSets++
        }
        prevReps = set.actualReps
        totalSets++
      }
    }
  }
  
  if (totalTargetReps === 0 || totalSets === 0) return 0
  
  const completionRate = totalActualReps / totalTargetReps
  const dropOffRate = dropOffSets / totalSets
  
  // Score: lower completion rate and higher drop-off rate = higher fatigue
  const completionScore = Math.max(0, (1 - completionRate) * 100)
  const dropOffScore = dropOffRate * 150 // Weight drop-offs more heavily
  
  return Math.round(Math.min(100, (completionScore * 0.5) + (dropOffScore * 0.5)))
}

/**
 * Calculate volume stress signal
 * Higher score = training volume is elevated
 */
export function calculateVolumeStress(): number {
  const weeklyVolume = calculateWeeklyVolume()
  const comparison = getWeekOverWeekComparison()
  
  // Base volume thresholds (sets per week)
  // <30 = low, 30-50 = moderate, 50-70 = high, >70 = very high
  let volumeScore = 0
  
  if (weeklyVolume.totalSets < 30) {
    volumeScore = 10
  } else if (weeklyVolume.totalSets < 50) {
    volumeScore = 30
  } else if (weeklyVolume.totalSets < 70) {
    volumeScore = 50
  } else if (weeklyVolume.totalSets < 90) {
    volumeScore = 70
  } else {
    volumeScore = 90
  }
  
  // Add spike penalty if volume increased significantly week-over-week
  if (comparison.change > 30) {
    volumeScore += 15
  } else if (comparison.change > 50) {
    volumeScore += 25
  }
  
  return Math.min(100, volumeScore)
}

/**
 * Calculate frequency stress signal
 * Higher score = training too frequently without rest
 */
export function calculateFrequencyStress(): number {
  const last7Days = getWorkoutsLastNDays(7)
  const last3Days = getWorkoutsLastNDays(3)
  
  // Training frequency thresholds
  const weeklyCount = last7Days.length
  const recentCount = last3Days.length
  
  let frequencyScore = 0
  
  // Weekly frequency
  if (weeklyCount <= 3) {
    frequencyScore = 10
  } else if (weeklyCount <= 4) {
    frequencyScore = 25
  } else if (weeklyCount <= 5) {
    frequencyScore = 45
  } else if (weeklyCount <= 6) {
    frequencyScore = 65
  } else {
    frequencyScore = 85 // Training every day
  }
  
  // Recent density penalty (3+ workouts in 3 days = high density)
  if (recentCount >= 3) {
    frequencyScore += 20
  } else if (recentCount >= 2) {
    frequencyScore += 10
  }
  
  return Math.min(100, frequencyScore)
}

/**
 * Calculate recovery gap signal
 * Higher score = insufficient rest between sessions
 */
export function calculateRecoveryGap(): number {
  const workouts = getWorkoutsLastNDays(14)
  if (workouts.length < 2) return 0
  
  // Sort by date
  const sorted = workouts.sort(
    (a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  
  // Calculate gaps between consecutive sessions
  const gaps: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i].sessionDate)
    const next = new Date(sorted[i + 1].sessionDate)
    const gapDays = Math.abs(current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    gaps.push(gapDays)
  }
  
  if (gaps.length === 0) return 0
  
  // Count short gaps (< 1 day between sessions)
  const shortGaps = gaps.filter(g => g < 1).length
  const veryShortGaps = gaps.filter(g => g < 0.5).length
  
  // Average gap
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  
  let recoveryScore = 0
  
  // Penalize very short average gap
  if (avgGap < 1) {
    recoveryScore = 70
  } else if (avgGap < 1.5) {
    recoveryScore = 45
  } else if (avgGap < 2) {
    recoveryScore = 25
  } else {
    recoveryScore = 10
  }
  
  // Add penalties for short gaps
  recoveryScore += shortGaps * 5
  recoveryScore += veryShortGaps * 10
  
  return Math.min(100, recoveryScore)
}

/**
 * Calculate consistency drop signal
 * Higher score = missed expected training sessions
 */
export function calculateConsistencyDrop(): number {
  const last14Days = getWorkoutsLastNDays(14)
  const last7Days = getWorkoutsLastNDays(7)
  const previous7Days = last14Days.filter(w => !last7Days.includes(w))
  
  // If we don't have enough history, assume consistent
  if (previous7Days.length === 0) return 0
  
  // Compare this week to last week
  const thisWeekCount = last7Days.length
  const lastWeekCount = previous7Days.length
  
  // If training dropped significantly, that's a fatigue signal (body forcing rest)
  if (lastWeekCount > 0 && thisWeekCount < lastWeekCount) {
    const dropRate = (lastWeekCount - thisWeekCount) / lastWeekCount
    return Math.round(dropRate * 80)
  }
  
  return 0
}

/**
 * Get all fatigue signals as a structured object
 */
export function calculateAllFatigueSignals(): FatigueSignals {
  return {
    rpeEscalation: calculateRPEEscalation(),
    repDropOff: calculateRepDropOff(),
    volumeStress: calculateVolumeStress(),
    frequencyStress: calculateFrequencyStress(),
    recoveryGap: calculateRecoveryGap(),
    consistencyDrop: calculateConsistencyDrop(),
  }
}
