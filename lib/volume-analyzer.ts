// Volume Analyzer service for training volume calculations
// Uses workout log data to analyze training load distribution
// Enhanced with movement-family-aware volume tracking for Performance Envelope system

import {
  getWorkoutLogs,
  type WorkoutLog,
  type ExerciseCategory,
  CATEGORY_LABELS,
} from './workout-log-service'
import { type MovementFamily } from './movement-family-registry'
import { getExerciseClassification } from './exercise-classification-registry'

export interface WeeklyVolumeSummary {
  workoutsThisWeek: number
  exercisesLogged: number
  totalSets: number
  totalTrainingMinutes: number
}

/**
 * Movement-family-aware weekly volume tracking
 * Distinguishes between prescribed, completed, and tolerated volume
 */
export interface MovementFamilyVolume {
  movementFamily: MovementFamily
  prescribedSets: number // Planned sets
  completedSets: number // Actually performed sets
  completedReps: number // Total reps across all sets
  completionRate: number // 0-1, completedSets / prescribedSets
  sessionsThisWeek: number // How many sessions included this family
  avgSetsPerSession: number
  avgDifficulty: 'easy' | 'normal' | 'hard'
  truncatedSessionCount: number // Sessions where this family was cut short
  skippedExerciseCount: number // Exercises in this family that were skipped
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

// =============================================================================
// MOVEMENT-FAMILY VOLUME TRACKING
// =============================================================================

/**
 * Calculate weekly volume by movement family
 * Uses exercise classification to map exercises to movement families
 */
export function calculateMovementFamilyVolume(
  daysBack: number = 7
): Map<MovementFamily, MovementFamilyVolume> {
  const logs = getWorkoutsLastNDays(daysBack)
  
  // Initialize tracking for each movement family
  const volumeMap = new Map<MovementFamily, {
    prescribedSets: number
    completedSets: number
    completedReps: number
    sessions: Set<string>
    difficulties: Array<'easy' | 'normal' | 'hard'>
    truncatedSessions: Set<string>
    skippedExercises: number
  }>()
  
  const allFamilies: MovementFamily[] = [
    'vertical_pull', 'horizontal_pull', 'straight_arm_pull',
    'vertical_push', 'horizontal_push', 'straight_arm_push',
    'compression_core', 'anti_extension_core', 'anti_rotation_core',
    'hip_hinge', 'squat', 'mobility', 'hypertrophy_accessory', 'joint_integrity'
  ]
  
  for (const family of allFamilies) {
    volumeMap.set(family, {
      prescribedSets: 0,
      completedSets: 0,
      completedReps: 0,
      sessions: new Set(),
      difficulties: [],
      truncatedSessions: new Set(),
      skippedExercises: 0,
    })
  }
  
  // Process each workout log
  for (const log of logs) {
    const wasTruncated = log.timeOptimization?.wasOptimized ?? false
    const sessionDifficulty = log.perceivedDifficulty ?? 'normal'
    
    for (const exercise of log.exercises) {
      // Get movement family for this exercise
      const family = getMovementFamilyForExercise(exercise.name, exercise.category)
      const familyData = volumeMap.get(family)
      
      if (familyData) {
        // Track session
        familyData.sessions.add(log.id)
        
        // Track prescribed sets (estimate if not tracked)
        const prescribedSets = exercise.sets // Assume sets field is prescribed
        familyData.prescribedSets += prescribedSets
        
        // Track completed sets/reps
        if (exercise.completed) {
          familyData.completedSets += exercise.sets
          familyData.completedReps += (exercise.reps || 1) * exercise.sets
        } else {
          familyData.skippedExercises++
        }
        
        // Track difficulty
        familyData.difficulties.push(sessionDifficulty)
        
        // Track truncation
        if (wasTruncated) {
          familyData.truncatedSessions.add(log.id)
        }
      }
    }
  }
  
  // Convert to output format
  const result = new Map<MovementFamily, MovementFamilyVolume>()
  
  for (const [family, data] of volumeMap) {
    const sessionsCount = data.sessions.size
    const completionRate = data.prescribedSets > 0 
      ? data.completedSets / data.prescribedSets 
      : 1
    
    // Calculate average difficulty
    const avgDifficulty = calculateAverageDifficulty(data.difficulties)
    
    result.set(family, {
      movementFamily: family,
      prescribedSets: data.prescribedSets,
      completedSets: data.completedSets,
      completedReps: data.completedReps,
      completionRate,
      sessionsThisWeek: sessionsCount,
      avgSetsPerSession: sessionsCount > 0 ? data.completedSets / sessionsCount : 0,
      avgDifficulty,
      truncatedSessionCount: data.truncatedSessions.size,
      skippedExerciseCount: data.skippedExercises,
    })
  }
  
  return result
}

/**
 * Get cumulative weekly volume for a specific movement family up to a date
 * Used for calculating weeklyVolumePrior in envelope signals
 */
export function getWeeklyVolumeForFamily(
  family: MovementFamily,
  beforeDate?: Date
): number {
  const cutoff = beforeDate || new Date()
  const startOfWeek = getStartOfWeek()
  const logs = getWorkoutLogs().filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfWeek && logDate < cutoff
  })
  
  let totalSets = 0
  
  for (const log of logs) {
    for (const exercise of log.exercises) {
      const exerciseFamily = getMovementFamilyForExercise(exercise.name, exercise.category)
      if (exerciseFamily === family && exercise.completed) {
        totalSets += exercise.sets
      }
    }
  }
  
  return totalSets
}

/**
 * Get weekly session count for a movement family
 */
export function getWeeklySessionCountForFamily(
  family: MovementFamily,
  beforeDate?: Date
): number {
  const cutoff = beforeDate || new Date()
  const startOfWeek = getStartOfWeek()
  const logs = getWorkoutLogs().filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= startOfWeek && logDate < cutoff
  })
  
  const sessions = new Set<string>()
  
  for (const log of logs) {
    for (const exercise of log.exercises) {
      const exerciseFamily = getMovementFamilyForExercise(exercise.name, exercise.category)
      if (exerciseFamily === family) {
        sessions.add(log.id)
        break
      }
    }
  }
  
  return sessions.size
}

/**
 * Map exercise to movement family using classification registry
 * Falls back to category-based inference if not found
 */
function getMovementFamilyForExercise(
  exerciseName: string,
  category: ExerciseCategory
): MovementFamily {
  // Try to get from classification registry first
  const classification = getExerciseClassification(exerciseName)
  if (classification?.primaryFamily) {
    return classification.primaryFamily
  }
  
  // Fall back to category-based inference
  return inferMovementFamilyFromCategory(exerciseName, category)
}

/**
 * Infer movement family from exercise name and category
 */
function inferMovementFamilyFromCategory(
  exerciseName: string,
  category: ExerciseCategory
): MovementFamily {
  const lowerName = exerciseName.toLowerCase()
  
  // Pull exercises
  if (category === 'pull') {
    if (lowerName.includes('row') || lowerName.includes('horizontal')) {
      return 'horizontal_pull'
    }
    if (lowerName.includes('front lever') || lowerName.includes('back lever') || 
        lowerName.includes('straight arm') || lowerName.includes('planche lean')) {
      return 'straight_arm_pull'
    }
    return 'vertical_pull' // Default for pulls
  }
  
  // Push exercises
  if (category === 'push') {
    if (lowerName.includes('push-up') || lowerName.includes('pushup') || 
        lowerName.includes('bench') || lowerName.includes('horizontal')) {
      return 'horizontal_push'
    }
    if (lowerName.includes('planche') || lowerName.includes('straight arm') ||
        lowerName.includes('maltese') || lowerName.includes('iron cross')) {
      return 'straight_arm_push'
    }
    return 'vertical_push' // Default for pushes (dips, HSPU, etc.)
  }
  
  // Core exercises
  if (category === 'core') {
    if (lowerName.includes('l-sit') || lowerName.includes('v-sit') || 
        lowerName.includes('compression') || lowerName.includes('pike')) {
      return 'compression_core'
    }
    if (lowerName.includes('pallof') || lowerName.includes('rotation')) {
      return 'anti_rotation_core'
    }
    return 'anti_extension_core' // Default for core
  }
  
  // Legs
  if (category === 'legs') {
    if (lowerName.includes('deadlift') || lowerName.includes('hinge') || 
        lowerName.includes('rdl') || lowerName.includes('good morning')) {
      return 'hip_hinge'
    }
    return 'squat'
  }
  
  // Skill exercises - determine by name
  if (category === 'skill') {
    if (lowerName.includes('pull') || lowerName.includes('lever') || 
        lowerName.includes('muscle up')) {
      if (lowerName.includes('front lever') || lowerName.includes('back lever')) {
        return 'straight_arm_pull'
      }
      return 'vertical_pull'
    }
    if (lowerName.includes('planche') || lowerName.includes('handstand') ||
        lowerName.includes('dip')) {
      if (lowerName.includes('planche') && !lowerName.includes('push')) {
        return 'straight_arm_push'
      }
      return 'vertical_push'
    }
    if (lowerName.includes('l-sit') || lowerName.includes('v-sit')) {
      return 'compression_core'
    }
  }
  
  // Mobility
  if (category === 'mobility') {
    return 'mobility'
  }
  
  // Default fallback
  return 'hypertrophy_accessory'
}

/**
 * Calculate average difficulty from array of ratings
 */
function calculateAverageDifficulty(
  difficulties: Array<'easy' | 'normal' | 'hard'>
): 'easy' | 'normal' | 'hard' {
  if (difficulties.length === 0) return 'normal'
  
  const scores = difficulties.map(d => 
    d === 'easy' ? 1 : d === 'normal' ? 2 : 3
  )
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  
  if (avg < 1.5) return 'easy'
  if (avg > 2.5) return 'hard'
  return 'normal'
}

/**
 * Check if current weekly volume for a family exceeds threshold
 */
export function isVolumeExcessive(
  family: MovementFamily,
  threshold: number
): { exceeded: boolean; current: number; threshold: number } {
  const current = getWeeklyVolumeForFamily(family)
  return {
    exceeded: current > threshold,
    current,
    threshold,
  }
}

/**
 * Get volume status relative to envelope recommendations
 */
export function getVolumeStatus(
  family: MovementFamily,
  envelope: {
    preferredWeeklyVolumeMin: number
    preferredWeeklyVolumeMax: number
    toleratedWeeklyVolumeMax: number
    excessiveVolumeThreshold: number
  }
): {
  status: 'under' | 'optimal' | 'approaching_limit' | 'at_limit' | 'excessive'
  current: number
  recommendation: string
} {
  const current = getWeeklyVolumeForFamily(family)
  
  if (current < envelope.preferredWeeklyVolumeMin) {
    return {
      status: 'under',
      current,
      recommendation: `Consider adding ${envelope.preferredWeeklyVolumeMin - current} more sets this week.`,
    }
  }
  
  if (current <= envelope.preferredWeeklyVolumeMax) {
    return {
      status: 'optimal',
      current,
      recommendation: 'Volume is in optimal range.',
    }
  }
  
  if (current <= envelope.toleratedWeeklyVolumeMax) {
    return {
      status: 'approaching_limit',
      current,
      recommendation: 'Approaching volume tolerance. Monitor fatigue.',
    }
  }
  
  if (current <= envelope.excessiveVolumeThreshold) {
    return {
      status: 'at_limit',
      current,
      recommendation: 'At volume limit. Consider no additional work in this family.',
    }
  }
  
  return {
    status: 'excessive',
    current,
    recommendation: 'Volume excessive. Risk of overreaching. Reduce next week.',
  }
}
