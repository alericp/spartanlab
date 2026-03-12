// Training Load Analyzer
// Analyzes training load patterns for fatigue intelligence

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'
import { getWorkoutsLastNDays } from './volume-analyzer'
import { getStoredRPESessions, type StoredRPESession } from './fatigue-score-calculator'

// =============================================================================
// TYPES
// =============================================================================

export interface DailyLoad {
  date: string
  sets: number
  minutes: number
  exerciseCount: number
  avgRPE: number | null
  loadScore: number // Composite load score for the day
}

export interface TrainingLoadSummary {
  acuteLoad: number // Last 7 days average daily load
  chronicLoad: number // Last 28 days average daily load
  acuteChronicRatio: number // ACWR - key fatigue/injury risk indicator
  loadTrend: 'decreasing' | 'stable' | 'increasing' | 'spiking'
  weeklyLoads: number[] // Last 4 weeks of total load
}

export interface SessionIntensity {
  sessionId: string
  date: string
  intensity: 'low' | 'moderate' | 'high' | 'very_high'
  intensityScore: number // 0-100
  factors: {
    volumeContribution: number
    rpeContribution: number
    durationContribution: number
  }
}

// =============================================================================
// LOAD CALCULATION
// =============================================================================

/**
 * Calculate daily load score for a workout
 * Combines volume, RPE, and duration into a single metric
 */
export function calculateSessionLoadScore(
  workout: WorkoutLog,
  rpeSession?: StoredRPESession
): number {
  // Base volume load (sets * approximate reps)
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const avgRepsPerSet = 8 // Approximation
  const volumeLoad = totalSets * avgRepsPerSet
  
  // Duration factor (longer sessions = more load)
  const durationFactor = Math.min(1.5, workout.durationMinutes / 45) // Normalize to 45min
  
  // RPE factor (if available)
  let rpeFactor = 1.0
  if (rpeSession && rpeSession.exercises.length > 0) {
    let totalRPE = 0
    let setCount = 0
    for (const exercise of rpeSession.exercises) {
      for (const set of exercise.sets) {
        totalRPE += set.actualRPE
        setCount++
      }
    }
    if (setCount > 0) {
      const avgRPE = totalRPE / setCount
      // RPE 6 = 0.8x, RPE 8 = 1.0x, RPE 9 = 1.15x, RPE 10 = 1.3x
      rpeFactor = 0.5 + (avgRPE / 10) * 0.8
    }
  }
  
  // Final load score
  return Math.round(volumeLoad * durationFactor * rpeFactor)
}

/**
 * Get daily loads for the past N days
 */
export function getDailyLoads(days: number): DailyLoad[] {
  const workouts = getWorkoutsLastNDays(days)
  const rpeSessions = getStoredRPESessions()
  
  // Group workouts by date
  const byDate: Record<string, WorkoutLog[]> = {}
  for (const workout of workouts) {
    const dateKey = workout.sessionDate.split('T')[0]
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(workout)
  }
  
  // Calculate daily loads
  const dailyLoads: DailyLoad[] = []
  
  for (const [date, dayWorkouts] of Object.entries(byDate)) {
    let totalSets = 0
    let totalMinutes = 0
    let exerciseCount = 0
    let totalRPE = 0
    let rpeSetCount = 0
    let totalLoadScore = 0
    
    for (const workout of dayWorkouts) {
      totalSets += workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)
      totalMinutes += workout.durationMinutes
      exerciseCount += workout.exercises.length
      
      // Find matching RPE session
      const rpeSession = rpeSessions.find(s => s.sessionId === workout.id)
      totalLoadScore += calculateSessionLoadScore(workout, rpeSession)
      
      if (rpeSession) {
        for (const exercise of rpeSession.exercises) {
          for (const set of exercise.sets) {
            totalRPE += set.actualRPE
            rpeSetCount++
          }
        }
      }
    }
    
    dailyLoads.push({
      date,
      sets: totalSets,
      minutes: totalMinutes,
      exerciseCount,
      avgRPE: rpeSetCount > 0 ? Math.round((totalRPE / rpeSetCount) * 10) / 10 : null,
      loadScore: totalLoadScore,
    })
  }
  
  // Sort by date descending
  return dailyLoads.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Calculate training load summary with ACWR
 */
export function calculateTrainingLoadSummary(): TrainingLoadSummary {
  const dailyLoads = getDailyLoads(28)
  
  // Split into acute (7 days) and chronic (28 days) periods
  const acuteLoads = dailyLoads.slice(0, 7)
  const chronicLoads = dailyLoads
  
  // Calculate totals (include rest days as 0)
  const acuteTotal = acuteLoads.reduce((sum, d) => sum + d.loadScore, 0)
  const chronicTotal = chronicLoads.reduce((sum, d) => sum + d.loadScore, 0)
  
  // Average daily loads (divide by actual days, not just training days)
  const acuteLoad = acuteLoads.length > 0 ? Math.round(acuteTotal / 7) : 0
  const chronicLoad = chronicLoads.length > 0 ? Math.round(chronicTotal / 28) : 0
  
  // ACWR - Acute:Chronic Workload Ratio
  // Optimal range is typically 0.8 - 1.3
  // Below 0.8 = undertraining, Above 1.5 = injury/fatigue risk
  const acuteChronicRatio = chronicLoad > 0 
    ? Math.round((acuteLoad / chronicLoad) * 100) / 100 
    : acuteLoad > 0 ? 1.5 : 1.0
  
  // Calculate weekly loads for trend analysis
  const weeklyLoads: number[] = []
  for (let week = 0; week < 4; week++) {
    const weekStart = week * 7
    const weekEnd = weekStart + 7
    const weekDays = dailyLoads.slice(weekStart, weekEnd)
    const weekTotal = weekDays.reduce((sum, d) => sum + d.loadScore, 0)
    weeklyLoads.push(weekTotal)
  }
  
  // Determine load trend
  let loadTrend: TrainingLoadSummary['loadTrend'] = 'stable'
  if (weeklyLoads.length >= 2) {
    const thisWeek = weeklyLoads[0]
    const lastWeek = weeklyLoads[1]
    
    if (lastWeek > 0) {
      const changePercent = ((thisWeek - lastWeek) / lastWeek) * 100
      
      if (changePercent > 30) {
        loadTrend = 'spiking'
      } else if (changePercent > 10) {
        loadTrend = 'increasing'
      } else if (changePercent < -20) {
        loadTrend = 'decreasing'
      }
    }
  }
  
  return {
    acuteLoad,
    chronicLoad,
    acuteChronicRatio,
    loadTrend,
    weeklyLoads,
  }
}

/**
 * Classify session intensity
 */
export function classifySessionIntensity(
  workout: WorkoutLog,
  rpeSession?: StoredRPESession
): SessionIntensity {
  const loadScore = calculateSessionLoadScore(workout, rpeSession)
  
  // Calculate contribution factors
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const volumeContribution = Math.min(100, totalSets * 3) // 33 sets = max
  const durationContribution = Math.min(100, (workout.durationMinutes / 90) * 100)
  
  let rpeContribution = 50 // Default moderate
  if (rpeSession && rpeSession.exercises.length > 0) {
    let totalRPE = 0
    let setCount = 0
    for (const exercise of rpeSession.exercises) {
      for (const set of exercise.sets) {
        totalRPE += set.actualRPE
        setCount++
      }
    }
    if (setCount > 0) {
      const avgRPE = totalRPE / setCount
      rpeContribution = Math.min(100, (avgRPE / 10) * 100)
    }
  }
  
  // Weighted intensity score
  const intensityScore = Math.round(
    (volumeContribution * 0.4) + (rpeContribution * 0.4) + (durationContribution * 0.2)
  )
  
  // Classify intensity
  let intensity: SessionIntensity['intensity']
  if (intensityScore >= 80) {
    intensity = 'very_high'
  } else if (intensityScore >= 60) {
    intensity = 'high'
  } else if (intensityScore >= 35) {
    intensity = 'moderate'
  } else {
    intensity = 'low'
  }
  
  return {
    sessionId: workout.id,
    date: workout.sessionDate,
    intensity,
    intensityScore,
    factors: {
      volumeContribution,
      rpeContribution,
      durationContribution,
    },
  }
}

/**
 * Get ACWR risk assessment
 */
export function getACWRRiskLevel(ratio: number): {
  level: 'low' | 'moderate' | 'elevated' | 'high'
  message: string
} {
  if (ratio < 0.8) {
    return {
      level: 'low',
      message: 'Training load is low relative to your baseline. Consider increasing volume gradually.',
    }
  } else if (ratio <= 1.3) {
    return {
      level: 'low',
      message: 'Training load is in the optimal range for adaptation and performance.',
    }
  } else if (ratio <= 1.5) {
    return {
      level: 'moderate',
      message: 'Training load is elevated. Monitor fatigue and recovery closely.',
    }
  } else if (ratio <= 1.8) {
    return {
      level: 'elevated',
      message: 'Training load spike detected. Consider reducing intensity to prevent overtraining.',
    }
  } else {
    return {
      level: 'high',
      message: 'Significant load spike. High risk of fatigue or injury. Reduce training load.',
    }
  }
}
