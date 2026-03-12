// Volume Analyzer service for training volume calculations
// Uses workout log data to analyze training load distribution

import {
  getWorkoutLogs,
  type WorkoutLog,
  type ExerciseCategory,
  CATEGORY_LABELS,
} from './workout-log-service'

export interface WeeklyVolumeSummary {
  workoutsThisWeek: number
  exercisesLogged: number
  totalSets: number
  totalTrainingMinutes: number
}

export interface VolumeDistribution {
  category: ExerciseCategory
  label: string
  sets: number
  percentage: number
}

export interface MovementBalance {
  pushSets: number
  pullSets: number
  ratio: number // push:pull ratio (1.0 = balanced)
  insight: string
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
function getWorkoutsThisWeek(): WorkoutLog[] {
  const logs = getWorkoutLogs()
  const startOfWeek = getStartOfWeek()
  return logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfWeek
  })
}

// Get workouts from last N days
export function getWorkoutsLastNDays(days: number): WorkoutLog[] {
  const logs = getWorkoutLogs()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return logs.filter(log => new Date(log.sessionDate) >= cutoff)
}

// Calculate weekly volume summary
export function calculateWeeklyVolume(): WeeklyVolumeSummary {
  const weekLogs = getWorkoutsThisWeek()
  
  let exercisesLogged = 0
  let totalSets = 0
  let totalTrainingMinutes = 0
  
  for (const log of weekLogs) {
    exercisesLogged += log.exercises.length
    totalSets += log.exercises.reduce((sum, ex) => sum + ex.sets, 0)
    totalTrainingMinutes += log.durationMinutes
  }
  
  return {
    workoutsThisWeek: weekLogs.length,
    exercisesLogged,
    totalSets,
    totalTrainingMinutes,
  }
}

// Calculate volume distribution by category
export function calculateVolumeDistribution(): VolumeDistribution[] {
  const weekLogs = getWorkoutsThisWeek()
  
  const categories: ExerciseCategory[] = ['push', 'pull', 'core', 'legs', 'skill', 'mobility']
  const setCounts: Record<ExerciseCategory, number> = {
    push: 0,
    pull: 0,
    core: 0,
    legs: 0,
    skill: 0,
    mobility: 0,
  }
  
  let totalSets = 0
  
  for (const log of weekLogs) {
    for (const exercise of log.exercises) {
      setCounts[exercise.category] += exercise.sets
      totalSets += exercise.sets
    }
  }
  
  return categories.map(category => ({
    category,
    label: CATEGORY_LABELS[category],
    sets: setCounts[category],
    percentage: totalSets > 0 ? Math.round((setCounts[category] / totalSets) * 100) : 0,
  }))
}

// Calculate push/pull movement balance
export function calculateMovementBalance(): MovementBalance {
  const weekLogs = getWorkoutsThisWeek()
  
  let pushSets = 0
  let pullSets = 0
  
  for (const log of weekLogs) {
    for (const exercise of log.exercises) {
      if (exercise.category === 'push') {
        pushSets += exercise.sets
      } else if (exercise.category === 'pull') {
        pullSets += exercise.sets
      }
    }
  }
  
  // Calculate ratio (prevent division by zero)
  const ratio = pullSets > 0 ? pushSets / pullSets : pushSets > 0 ? 2.0 : 1.0
  
  // Generate insight
  let insight: string
  
  if (pushSets === 0 && pullSets === 0) {
    insight = 'Log workouts with push and pull exercises to see balance insights.'
  } else if (ratio > 1.3) {
    insight = 'High pushing volume detected. Consider adding more pulling work to protect shoulder health.'
  } else if (ratio < 0.7) {
    insight = 'Pulling volume is higher than pushing. Consider adding pushing work for balance.'
  } else {
    insight = 'Good push/pull balance. Continue with your current training distribution.'
  }
  
  return {
    pushSets,
    pullSets,
    ratio: Math.round(ratio * 100) / 100,
    insight,
  }
}

// Compare current week to previous week
export function getWeekOverWeekComparison(): { current: number; previous: number; change: number } {
  const allLogs = getWorkoutLogs()
  const startOfThisWeek = getStartOfWeek()
  const startOfLastWeek = new Date(startOfThisWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  
  const thisWeekLogs = allLogs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfThisWeek
  })
  
  const lastWeekLogs = allLogs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfLastWeek && logDate < startOfThisWeek
  })
  
  const currentSets = thisWeekLogs.reduce(
    (sum, log) => sum + log.exercises.reduce((s, ex) => s + ex.sets, 0),
    0
  )
  
  const previousSets = lastWeekLogs.reduce(
    (sum, log) => sum + log.exercises.reduce((s, ex) => s + ex.sets, 0),
    0
  )
  
  const change = previousSets > 0
    ? Math.round(((currentSets - previousSets) / previousSets) * 100)
    : currentSets > 0 ? 100 : 0
  
  return { current: currentSets, previous: previousSets, change }
}
