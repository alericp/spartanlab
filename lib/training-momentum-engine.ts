// Training Momentum Engine
// Evaluates recent training consistency without punishing missed sessions
// Uses a positive, momentum-based approach rather than streak counting

import { getWorkoutLogs, type WorkoutLog } from './workout-log-service'

export type MomentumLevel = 'very_strong' | 'strong' | 'developing' | 'low' | 'none'

export interface TrainingMomentum {
  level: MomentumLevel
  label: string
  score: number // 0-100
  
  // Activity breakdown
  workoutsLast7Days: number
  workoutsLast14Days: number
  workoutsLast21Days: number
  
  // Trend
  trend: 'increasing' | 'stable' | 'decreasing'
  trendDescription: string
  
  // Guidance
  explanation: string
  suggestion: string
  
  // Data quality
  hasData: boolean
  daysSinceLastWorkout: number | null
}

// Momentum level definitions
const MOMENTUM_LEVELS: Record<MomentumLevel, { label: string; minScore: number; color: string }> = {
  very_strong: { label: 'Very Strong', minScore: 80, color: '#22C55E' },
  strong: { label: 'Strong', minScore: 60, color: '#C1121F' },
  developing: { label: 'Developing', minScore: 35, color: '#4F6D8A' },
  low: { label: 'Low', minScore: 10, color: '#6B7280' },
  none: { label: 'No Data', minScore: 0, color: '#2B313A' },
}

// Calculate workouts within a date range
function getWorkoutsInRange(logs: WorkoutLog[], days: number): number {
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  return logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= cutoff && logDate <= now
  }).length
}

// Get days since last workout
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

// Calculate momentum score (0-100)
function calculateMomentumScore(
  workouts7d: number,
  workouts14d: number,
  workouts21d: number,
  daysSinceLast: number | null
): number {
  if (workouts7d === 0 && workouts14d === 0 && workouts21d === 0) {
    return 0
  }
  
  // Base score from 7-day activity (most important)
  // 4+ workouts = 100, 3 = 75, 2 = 50, 1 = 25
  let baseScore = 0
  if (workouts7d >= 4) baseScore = 100
  else if (workouts7d === 3) baseScore = 75
  else if (workouts7d === 2) baseScore = 50
  else if (workouts7d === 1) baseScore = 25
  
  // Trend modifier from 14-day vs 7-day comparison
  // Good trend adds up to +10, bad trend subtracts up to -15
  const expectedSecondWeek = workouts14d - workouts7d
  let trendModifier = 0
  
  if (workouts7d > expectedSecondWeek) {
    // Current week better than last week - momentum building
    trendModifier = Math.min(10, (workouts7d - expectedSecondWeek) * 5)
  } else if (workouts7d < expectedSecondWeek) {
    // Current week slower than last week - momentum fading
    trendModifier = Math.max(-15, (workouts7d - expectedSecondWeek) * 5)
  }
  
  // Recency modifier - reward recent activity
  let recencyModifier = 0
  if (daysSinceLast !== null) {
    if (daysSinceLast <= 1) recencyModifier = 10
    else if (daysSinceLast <= 2) recencyModifier = 5
    else if (daysSinceLast <= 3) recencyModifier = 0
    else if (daysSinceLast <= 5) recencyModifier = -5
    else if (daysSinceLast <= 7) recencyModifier = -10
    else recencyModifier = -15
  }
  
  // Calculate final score
  const finalScore = Math.max(0, Math.min(100, baseScore + trendModifier + recencyModifier))
  
  return Math.round(finalScore)
}

// Get momentum level from score
function getMomentumLevel(score: number, hasData: boolean): MomentumLevel {
  if (!hasData || score === 0) return 'none'
  if (score >= MOMENTUM_LEVELS.very_strong.minScore) return 'very_strong'
  if (score >= MOMENTUM_LEVELS.strong.minScore) return 'strong'
  if (score >= MOMENTUM_LEVELS.developing.minScore) return 'developing'
  return 'low'
}

// Get trend from activity comparison
function getTrend(
  workouts7d: number, 
  workouts14d: number
): { trend: 'increasing' | 'stable' | 'decreasing'; description: string } {
  const lastWeek = workouts14d - workouts7d
  
  if (workouts7d > lastWeek) {
    return { 
      trend: 'increasing', 
      description: 'Your training frequency is increasing' 
    }
  } else if (workouts7d < lastWeek) {
    return { 
      trend: 'decreasing', 
      description: 'Your training frequency is lower than last week' 
    }
  }
  return { 
    trend: 'stable', 
    description: 'Your training frequency is consistent' 
  }
}

// Generate explanation based on momentum level
function getExplanation(level: MomentumLevel, workouts7d: number, daysSinceLast: number | null): string {
  switch (level) {
    case 'very_strong':
      return 'Excellent consistency. Your training momentum is at peak levels, supporting optimal adaptation.'
    case 'strong':
      return 'Your recent training consistency supports steady strength development and skill progression.'
    case 'developing':
      return 'Building momentum. Adding one more session this week would significantly improve your consistency.'
    case 'low':
      return 'Your momentum is building. Consistent training will help maintain progress and prevent skill fade.'
    case 'none':
    default:
      return 'Log workouts to start building training momentum.'
  }
}

// Generate suggestion based on momentum level
function getSuggestion(level: MomentumLevel, workouts7d: number, daysSinceLast: number | null): string {
  switch (level) {
    case 'very_strong':
      return 'Maintain this rhythm while respecting recovery signals.'
    case 'strong':
      return 'Stay consistent to keep your momentum building.'
    case 'developing':
      if (workouts7d === 2) return 'One more session this week elevates you to Strong momentum.'
      return 'Aim for 3 sessions this week to build stronger momentum.'
    case 'low':
      if (daysSinceLast !== null && daysSinceLast > 5) {
        return 'A session today would help rebuild your training rhythm.'
      }
      return 'Consistent training over the next week will build momentum.'
    case 'none':
    default:
      return 'Log your first workout to start tracking your training momentum.'
  }
}

// Filter to only trusted workouts - excludes demo/seed/untrusted data
function getTrustedWorkouts() {
  return getWorkoutLogs().filter(log => {
    // Reject demo workouts
    if (log.sourceRoute === 'demo' || (log as any).isDemo === true) return false
    // Only include explicitly trusted logs or logs without the flag (legacy data)
    return log.trusted !== false
  })
}

// Main function: Calculate Training Momentum
export function calculateTrainingMomentum(): TrainingMomentum {
  const logs = getTrustedWorkouts()
  
  const workouts7d = getWorkoutsInRange(logs, 7)
  const workouts14d = getWorkoutsInRange(logs, 14)
  const workouts21d = getWorkoutsInRange(logs, 21)
  const daysSinceLast = getDaysSinceLastWorkout(logs)
  
  const hasData = logs.length > 0
  const score = calculateMomentumScore(workouts7d, workouts14d, workouts21d, daysSinceLast)
  const level = getMomentumLevel(score, hasData)
  const { trend, description } = getTrend(workouts7d, workouts14d)
  
  return {
    level,
    label: MOMENTUM_LEVELS[level].label,
    score,
    workoutsLast7Days: workouts7d,
    workoutsLast14Days: workouts14d,
    workoutsLast21Days: workouts21d,
    trend,
    trendDescription: description,
    explanation: getExplanation(level, workouts7d, daysSinceLast),
    suggestion: getSuggestion(level, workouts7d, daysSinceLast),
    hasData,
    daysSinceLastWorkout: daysSinceLast,
  }
}

// Get momentum level color
export function getMomentumColor(level: MomentumLevel): string {
  return MOMENTUM_LEVELS[level].color
}

// Export for use in other components
export { MOMENTUM_LEVELS }
