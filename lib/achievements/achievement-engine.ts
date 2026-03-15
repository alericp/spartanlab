// Achievement Engine
// Evaluates achievement conditions and detects newly unlocked achievements

import { 
  ACHIEVEMENTS, 
  type Achievement, 
  type UnlockedAchievement,
  getAchievementById,
} from './achievement-definitions'
import { getWorkoutLogs } from '../workout-log-service'
import { getStrengthRecords } from '../strength-service'
import { getSkillProgressions } from '../data-service'
import { calculateTrainingStreak } from '../progress-streak-engine'

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
  strengthRecords: Record<string, number> // exercise -> max weight
  skillLevels: Record<string, number> // skill -> level
}

function calculateMetrics(): AchievementMetrics {
  const workouts = getWorkoutLogs()
  const strengthRecords = getStrengthRecords()
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
  
  // Get skill levels
  const skillLevels: Record<string, number> = {}
  skillProgressions.forEach(progression => {
    skillLevels[progression.skillName] = progression.currentLevel
  })
  
  return {
    workoutCount: workouts.length,
    currentStreak: streak.currentStreak,
    bestStreak: streak.bestStreak,
    totalReps,
    strengthRecords: maxWeights,
    skillLevels,
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
