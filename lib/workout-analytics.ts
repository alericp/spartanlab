// Workout analytics service for preview mode
// Provides lightweight analytics from workout log data

import {
  getWorkoutLogs,
  getLatestWorkout,
  type WorkoutLog,
  type FocusArea,
  FOCUS_AREA_LABELS,
} from './workout-log-service'

export interface WorkoutAnalytics {
  workoutsThisWeek: number
  exercisesThisWeek: number
  mostCommonFocus: FocusArea | null
  mostCommonFocusLabel: string
  lastWorkoutDate: string | null
  lastWorkoutName: string | null
  averageSessionDuration: number | null
  totalWorkouts: number
}

// Get start of current week (Monday)
function getStartOfWeek(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Get workouts from current week
function getWorkoutsThisWeek(logs: WorkoutLog[]): WorkoutLog[] {
  const startOfWeek = getStartOfWeek()
  return logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfWeek
  })
}

// Calculate most common focus area from recent workouts
function getMostCommonFocus(logs: WorkoutLog[]): FocusArea | null {
  if (logs.length === 0) return null
  
  const focusCounts: Record<string, number> = {}
  
  for (const log of logs) {
    focusCounts[log.focusArea] = (focusCounts[log.focusArea] || 0) + 1
  }
  
  let maxCount = 0
  let mostCommon: FocusArea | null = null
  
  for (const [focus, count] of Object.entries(focusCounts)) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = focus as FocusArea
    }
  }
  
  return mostCommon
}

// Get complete workout analytics
export function getWorkoutAnalytics(): WorkoutAnalytics {
  const allLogs = getWorkoutLogs()
  const weekLogs = getWorkoutsThisWeek(allLogs)
  const latestWorkout = getLatestWorkout()
  
  // Count exercises this week
  const exercisesThisWeek = weekLogs.reduce(
    (total, log) => total + log.exercises.length,
    0
  )
  
  // Calculate most common focus from last 10 workouts
  const recentLogs = allLogs
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .slice(0, 10)
  const mostCommonFocus = getMostCommonFocus(recentLogs)
  
  // Calculate average duration from recent workouts
  let averageSessionDuration: number | null = null
  if (recentLogs.length > 0) {
    const totalDuration = recentLogs.reduce((sum, log) => sum + log.durationMinutes, 0)
    averageSessionDuration = Math.round(totalDuration / recentLogs.length)
  }
  
  return {
    workoutsThisWeek: weekLogs.length,
    exercisesThisWeek,
    mostCommonFocus,
    mostCommonFocusLabel: mostCommonFocus ? FOCUS_AREA_LABELS[mostCommonFocus] : 'None yet',
    lastWorkoutDate: latestWorkout?.sessionDate || null,
    lastWorkoutName: latestWorkout?.sessionName || null,
    averageSessionDuration,
    totalWorkouts: allLogs.length,
  }
}

// Format date for display
export function formatWorkoutDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
