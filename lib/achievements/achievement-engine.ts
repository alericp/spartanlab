// Achievement Engine
// Evaluates achievement conditions and detects newly unlocked achievements

import { 
  ACHIEVEMENTS, 
  type Achievement, 
  type UnlockedAchievement,
  getAchievementById,
} from './achievement-definitions'
import { getWorkoutLogs } from '../workout-log-service'
import { getStrengthRecords, getPersonalRecords } from '../strength-service'
import { getSkillProgressions } from '../data-service'
import { calculateTrainingStreak } from '../progress-streak-engine'
import { getCompletedChallengeCount } from '../challenges/challenge-engine'
import { getH2HStats } from '../h2h/h2h-service'

// =============================================================================
// STORAGE
// =============================================================================

const ACHIEVEMENTS_STORAGE_KEY = 'spartanlab_achievements'
const NOTIFICATION_QUEUE_KEY = 'spartanlab_achievement_notifications'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getUnlockedAchievements(): UnlockedAchievement[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveUnlockedAchievements(achievements: UnlockedAchievement[]): void {
  if (!isBrowser()) return
  localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements))
}

export function getNotificationQueue(): string[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(NOTIFICATION_QUEUE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveNotificationQueue(queue: string[]): void {
  if (!isBrowser()) return
  localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue))
}

export function popNextNotification(): Achievement | null {
  const queue = getNotificationQueue()
  if (queue.length === 0) return null
  
  const achievementId = queue.shift()
  saveNotificationQueue(queue)
  
  if (achievementId) {
    return getAchievementById(achievementId) || null
  }
  return null
}

export function markAchievementSeen(achievementId: string): void {
  const achievements = getUnlockedAchievements()
  const updated = achievements.map(a => 
    a.achievementId === achievementId ? { ...a, seen: true } : a
  )
  saveUnlockedAchievements(updated)
}

// =============================================================================
// METRICS CALCULATION
// =============================================================================

interface AchievementMetrics {
  workoutCount: number
  currentStreak: number
  bestStreak: number
  totalReps: number
  strengthRecords: Record<string, number> // exercise -> max weight or max reps
  skillLevels: Record<string, number> // skill -> level
  challengeCount: number // completed challenges
  weeksActive: number // weeks with at least one workout
  // H2H metrics
  h2hWins: number
  h2hBattles: number
  h2hPoolWins: number
  // Longevity metrics
  monthsActive: number // months with at least one workout
  // Balance metrics
  balancedWeeks: number // weeks with both push and pull exercises
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

function calculateMetrics(): AchievementMetrics {
  const workouts = getTrustedWorkouts()
  const strengthRecords = getStrengthRecords()
  const personalRecords = getPersonalRecords()
  const skillProgressions = getSkillProgressions()
  const streak = calculateTrainingStreak()
  
  // Count total reps
  let totalReps = 0
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.reps && exercise.sets) {
        totalReps += exercise.reps * exercise.sets
      }
    })
  })
  
  // Get max weight per exercise
  const maxWeights: Record<string, number> = {}
  strengthRecords.forEach(record => {
    const current = maxWeights[record.exercise] || 0
    if (record.weightAdded > current) {
      maxWeights[record.exercise] = record.weightAdded
    }
  })
  
  // Add personal records for max reps (pull-ups, dips)
  Object.entries(personalRecords).forEach(([exercise, record]) => {
    if (record && record.maxReps) {
      const key = `max_${exercise.replace('weighted_', '')}s`
      maxWeights[key] = record.maxReps
    }
  })
  
  // Get skill levels
  const skillLevels: Record<string, number> = {}
  skillProgressions.forEach(progression => {
    skillLevels[progression.skillName] = progression.currentLevel
  })
  
  // Get completed challenge count
  let challengeCount = 0
  try {
    challengeCount = getCompletedChallengeCount()
  } catch {
    // Challenge engine may not be initialized
  }
  
  // Calculate weeks active (weeks with at least one workout)
  const weeksWithWorkouts = new Set<string>()
  workouts.forEach(workout => {
    const date = new Date(workout.sessionDate || workout.createdAt)
    // Get ISO week number
    const yearStart = new Date(date.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7)
    weeksWithWorkouts.add(`${date.getFullYear()}-W${weekNumber}`)
  })
  
  // Get H2H stats
  let h2hWins = 0
  let h2hBattles = 0
  let h2hPoolWins = 0
  try {
    const h2hStats = getH2HStats()
    h2hWins = h2hStats.wins
    h2hBattles = h2hStats.totalChallenges
    h2hPoolWins = h2hStats.poolWins || 0
  } catch {
    // H2H service may not be initialized
  }
  
  // Calculate months active (months with at least one workout)
  const monthsWithWorkouts = new Set<string>()
  workouts.forEach(workout => {
    const date = new Date(workout.sessionDate || workout.createdAt)
    monthsWithWorkouts.add(`${date.getFullYear()}-${date.getMonth() + 1}`)
  })
  
  // Calculate balanced weeks (weeks with both push and pull exercises)
  // Push: push-ups, dips, HSPU, planche work
  // Pull: pull-ups, rows, front lever, back lever, muscle-ups
  const weeklyExerciseTypes: Map<string, { hasPush: boolean; hasPull: boolean }> = new Map()
  const pushExercises = ['push-up', 'pushup', 'dip', 'hspu', 'handstand', 'planche', 'pike', 'diamond', 'pseudo']
  const pullExercises = ['pull-up', 'pullup', 'row', 'front lever', 'back lever', 'muscle-up', 'chin-up', 'lat', 'inverted']
  
  workouts.forEach(workout => {
    const date = new Date(workout.sessionDate || workout.createdAt)
    const yearStart = new Date(date.getFullYear(), 0, 1)
    const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7)
    const weekKey = `${date.getFullYear()}-W${weekNumber}`
    
    if (!weeklyExerciseTypes.has(weekKey)) {
      weeklyExerciseTypes.set(weekKey, { hasPush: false, hasPull: false })
    }
    
    const weekData = weeklyExerciseTypes.get(weekKey)!
    workout.exercises.forEach(ex => {
      const name = ex.name.toLowerCase()
      if (pushExercises.some(p => name.includes(p))) {
        weekData.hasPush = true
      }
      if (pullExercises.some(p => name.includes(p))) {
        weekData.hasPull = true
      }
    })
  })
  
  const balancedWeeks = Array.from(weeklyExerciseTypes.values())
    .filter(w => w.hasPush && w.hasPull).length
  
  return {
    workoutCount: workouts.length,
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
    totalReps,
    strengthRecords: maxWeights,
    skillLevels,
    challengeCount,
    weeksActive: weeksWithWorkouts.size,
    h2hWins,
    h2hBattles,
    h2hPoolWins,
    monthsActive: monthsWithWorkouts.size,
    balancedWeeks,
  }
}

// =============================================================================
// ACHIEVEMENT EVALUATION
// =============================================================================

function isAchievementUnlocked(achievement: Achievement, metrics: AchievementMetrics): boolean {
  const { requirement } = achievement
  
  switch (requirement.type) {
    case 'workout_count':
      return metrics.workoutCount >= requirement.value
      
    case 'streak_days':
      return metrics.bestStreak >= requirement.value
      
    case 'total_reps':
      return metrics.totalReps >= requirement.value
      
    case 'strength_milestone':
      if (!requirement.exercise) return false
      const weight = metrics.strengthRecords[requirement.exercise] || 0
      return weight >= requirement.value
      
    case 'skill_level':
      if (!requirement.skill) return false
      const level = metrics.skillLevels[requirement.skill] || 0
      return level >= requirement.value
      
    case 'hold_time':
      // Future implementation for hold time tracking
      return false
      
    case 'challenge_count':
      return metrics.challengeCount >= requirement.value
      
    case 'weeks_active':
      return metrics.weeksActive >= requirement.value
      
    case 'h2h_wins':
      return metrics.h2hWins >= requirement.value
      
    case 'h2h_battles':
      return metrics.h2hBattles >= requirement.value
      
    case 'h2h_pool_wins':
      return metrics.h2hPoolWins >= requirement.value
      
    case 'months_active':
      return metrics.monthsActive >= requirement.value
      
    case 'balanced_weeks':
      return metrics.balancedWeeks >= requirement.value
      
    default:
      return false
  }
}

/**
 * Evaluate all achievements and detect newly unlocked ones
 * Call this after workout completion, strength record, or skill update
 */
export function evaluateAchievements(): Achievement[] {
  const metrics = calculateMetrics()
  const currentlyUnlocked = getUnlockedAchievements()
  const unlockedIds = new Set(currentlyUnlocked.map(a => a.achievementId))
  
  const newlyUnlocked: Achievement[] = []
  const notificationQueue = getNotificationQueue()
  
  ACHIEVEMENTS.forEach(achievement => {
    // Skip if already unlocked
    if (unlockedIds.has(achievement.id)) return
    
    // Check if now unlocked
    if (isAchievementUnlocked(achievement, metrics)) {
      newlyUnlocked.push(achievement)
      
      // Add to unlocked list
      currentlyUnlocked.push({
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        seen: false,
      })
      
      // Add to notification queue
      notificationQueue.push(achievement.id)
    }
  })
  
  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(currentlyUnlocked)
    saveNotificationQueue(notificationQueue)
  }
  
  return newlyUnlocked
}

/**
 * Get all achievements with their unlock status
 */
export function getAchievementsWithStatus(): Array<Achievement & { unlocked: boolean; unlockedAt?: string }> {
  const unlocked = getUnlockedAchievements()
  const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u]))
  
  return ACHIEVEMENTS.map(achievement => {
    const status = unlockedMap.get(achievement.id)
    return {
      ...achievement,
      unlocked: !!status,
      unlockedAt: status?.unlockedAt,
    }
  })
}

/**
 * Get count of unlocked achievements by category
 */
export function getAchievementCounts(): { total: number; unlocked: number; byCategory: Record<string, { total: number; unlocked: number }> } {
  const allWithStatus = getAchievementsWithStatus()
  
  const byCategory: Record<string, { total: number; unlocked: number }> = {}
  
  allWithStatus.forEach(a => {
    if (!byCategory[a.category]) {
      byCategory[a.category] = { total: 0, unlocked: 0 }
    }
    byCategory[a.category].total++
    if (a.unlocked) {
      byCategory[a.category].unlocked++
    }
  })
  
  return {
    total: ACHIEVEMENTS.length,
    unlocked: allWithStatus.filter(a => a.unlocked).length,
    byCategory,
  }
}

/**
 * Get recent achievements (last N unlocked)
 */
export function getRecentAchievements(limit: number = 5): Array<Achievement & { unlockedAt: string }> {
  const unlocked = getUnlockedAchievements()
  
  // Sort by unlock date descending
  const sorted = [...unlocked].sort(
    (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
  )
  
  return sorted.slice(0, limit).map(u => {
    const achievement = getAchievementById(u.achievementId)!
    return {
      ...achievement,
      unlockedAt: u.unlockedAt,
    }
  }).filter(Boolean)
}

/**
 * Check for unseen achievements
 */
export function hasUnseenAchievements(): boolean {
  return getNotificationQueue().length > 0
}

// =============================================================================
// ACHIEVEMENT PROGRESS & SUMMARY (for achievements-panel)
// =============================================================================

export interface AchievementWithProgress extends Achievement {
  unlocked: boolean
  unlockedAt?: string
  progress: number // 0-100
  progressPercent: number // alias for progress
  currentValue: number // actual current value
}

export interface AchievementSummary {
  totalAchievements: number
  total: number // alias
  unlockedCount: number
  unlocked: number // alias
  percentComplete: number
  percentage: number // alias
  recentUnlocks: number
  byCategory: Record<string, { total: number; unlocked: number }>
  // Point system
  earnedPoints: number
  totalPoints: number
  pointsPercentage: number
}

/**
 * Get all achievements with their progress
 */
export function getAchievementsWithProgress(): AchievementWithProgress[] {
  const unlocked = getUnlockedAchievements()
  const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u]))
  const metrics = calculateMetrics()
  
  return ACHIEVEMENTS.map(achievement => {
    const status = unlockedMap.get(achievement.id)
    const isUnlocked = !!status
    
    // Calculate progress for non-unlocked achievements
    let progress = isUnlocked ? 100 : 0
    let currentValue = 0
    
    if (!isUnlocked) {
      const { requirement } = achievement
      switch (requirement.type) {
        case 'workout_count':
          currentValue = metrics.workoutCount
          progress = Math.min(100, (currentValue / requirement.value) * 100)
          break
        case 'streak_days':
          currentValue = metrics.bestStreak
          progress = Math.min(100, (currentValue / requirement.value) * 100)
          break
        case 'total_reps':
          currentValue = metrics.totalReps
          progress = Math.min(100, (currentValue / requirement.value) * 100)
          break
        case 'strength_milestone':
          if (requirement.exercise) {
            currentValue = metrics.strengthRecords[requirement.exercise] || 0
            progress = Math.min(100, (currentValue / requirement.value) * 100)
          }
          break
        case 'skill_level':
          if (requirement.skill) {
            currentValue = metrics.skillLevels[requirement.skill] || 0
            progress = Math.min(100, (currentValue / requirement.value) * 100)
          }
          break
        case 'challenge_count':
          currentValue = metrics.challengeCount
          progress = Math.min(100, (currentValue / requirement.value) * 100)
          break
        case 'weeks_active':
          currentValue = metrics.weeksActive
          progress = Math.min(100, (currentValue / requirement.value) * 100)
          break
      }
    } else {
      currentValue = achievement.requirement.value
    }
    
    return {
      ...achievement,
      unlocked: isUnlocked,
      unlockedAt: status?.unlockedAt,
      progress: Math.round(progress),
      progressPercent: Math.round(progress),
      currentValue,
    }
  })
}

/**
 * Get achievement summary statistics
 */
export function getAchievementSummary(): AchievementSummary {
  const unlocked = getUnlockedAchievements()
  const counts = getAchievementCounts()
  
  // Count recent unlocks (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentUnlocks = unlocked.filter(u => 
    new Date(u.unlockedAt).getTime() > weekAgo
  ).length
  
  // Calculate point totals
  let earnedPoints = 0
  let totalPoints = 0
  
  ACHIEVEMENTS.forEach(achievement => {
    totalPoints += achievement.pointValue
    if (unlocked.some(u => u.achievementId === achievement.id)) {
      earnedPoints += achievement.pointValue
    }
  })
  
  const percentComplete = counts.total > 0 ? Math.round((counts.unlocked / counts.total) * 100) : 0
  const pointsPercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  
  return {
    totalAchievements: counts.total,
    total: counts.total,
    unlockedCount: counts.unlocked,
    unlocked: counts.unlocked,
    percentComplete,
    percentage: percentComplete,
    recentUnlocks,
    byCategory: counts.byCategory,
    earnedPoints,
    totalPoints,
    pointsPercentage,
  }
}

// =============================================================================
// TRAINING EVENT HOOK
// =============================================================================

export type TrainingEventType = 'workout_complete' | 'strength_record' | 'skill_progress'

/**
 * Called after training events to evaluate achievements
 * Use this as the main entry point for achievement evaluation
 */
export function onTrainingEvent(eventType: TrainingEventType): Achievement[] {
  // Evaluate all achievements and return newly unlocked ones
  return evaluateAchievements()
}
