// Challenge Engine
// Evaluates challenge progress and detects completions

import {
  type Challenge,
  type ChallengeProgress,
  type ChallengeReward,
  getActiveChallenges,
  getChallengeById,
} from './challenge-definitions'
import { getWorkoutLogs } from '../workout-log-service'
import { getSkillSessions } from '../skill-session-service'
import { calculateTrainingStreak } from '../progress-streak-engine'

// =============================================================================
// STORAGE
// =============================================================================

const CHALLENGE_PROGRESS_KEY = 'spartanlab_challenge_progress'
const CHALLENGE_NOTIFICATIONS_KEY = 'spartanlab_challenge_notifications'
const CHALLENGE_REWARDS_KEY = 'spartanlab_challenge_rewards'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getChallengeProgress(): ChallengeProgress[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(CHALLENGE_PROGRESS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveChallengeProgress(progress: ChallengeProgress[]): void {
  if (!isBrowser()) return
  localStorage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify(progress))
}

export function getCompletedRewards(): ChallengeReward[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(CHALLENGE_REWARDS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveCompletedRewards(rewards: ChallengeReward[]): void {
  if (!isBrowser()) return
  localStorage.setItem(CHALLENGE_REWARDS_KEY, JSON.stringify(rewards))
}

// Notification queue for completed challenges
export function getChallengeNotificationQueue(): string[] {
  if (!isBrowser()) return []
  
  const stored = localStorage.getItem(CHALLENGE_NOTIFICATIONS_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveChallengeNotificationQueue(queue: string[]): void {
  if (!isBrowser()) return
  localStorage.setItem(CHALLENGE_NOTIFICATIONS_KEY, JSON.stringify(queue))
}

export function popNextChallengeNotification(): Challenge | null {
  const queue = getChallengeNotificationQueue()
  if (queue.length === 0) return null
  
  const challengeId = queue.shift()
  saveChallengeNotificationQueue(queue)
  
  if (challengeId) {
    return getChallengeById(challengeId) || null
  }
  return null
}

// =============================================================================
// METRICS CALCULATION
// =============================================================================

interface ChallengeMetrics {
  workoutsInPeriod: Record<string, number> // key: "startDate_endDate", value: count
  repsInPeriod: Record<string, number>
  currentStreak: number
  skillSessionsInPeriod: Record<string, number>
  trainingMinutesInPeriod: Record<string, number>
}

function getPeriodKey(startDate: string, endDate: string): string {
  return `${startDate}_${endDate}`
}

function isDateInPeriod(date: string, startDate: string, endDate: string): boolean {
  const d = date.split('T')[0]
  return d >= startDate && d <= endDate
}

function calculateMetrics(): ChallengeMetrics {
  const workouts = getWorkoutLogs()
  const skillSessions = getSkillSessions()
  const streakData = calculateTrainingStreak()
  
  const metrics: ChallengeMetrics = {
    workoutsInPeriod: {},
    repsInPeriod: {},
    currentStreak: streakData.currentStreak,
    skillSessionsInPeriod: {},
    trainingMinutesInPeriod: {},
  }
  
  // Get all active challenges to determine which periods to track
  const challenges = getActiveChallenges()
  const periods = new Set<string>()
  
  challenges.forEach(c => {
    periods.add(getPeriodKey(c.startDate, c.endDate))
  })
  
  // Initialize counters for each period
  periods.forEach(period => {
    metrics.workoutsInPeriod[period] = 0
    metrics.repsInPeriod[period] = 0
    metrics.skillSessionsInPeriod[period] = 0
    metrics.trainingMinutesInPeriod[period] = 0
  })
  
  // Count workouts and reps per period
  workouts.forEach(workout => {
    periods.forEach(period => {
      const [start, end] = period.split('_')
      if (isDateInPeriod(workout.sessionDate || workout.createdAt, start, end)) {
        metrics.workoutsInPeriod[period]++
        metrics.trainingMinutesInPeriod[period] += workout.durationMinutes || 0
        
        // Count reps
        workout.exercises.forEach(ex => {
          if (ex.completed && ex.reps) {
            metrics.repsInPeriod[period] += (ex.sets || 1) * (ex.reps || 0)
          }
        })
      }
    })
  })
  
  // Count skill sessions per period
  skillSessions.forEach(session => {
    periods.forEach(period => {
      const [start, end] = period.split('_')
      if (isDateInPeriod(session.sessionDate, start, end)) {
        metrics.skillSessionsInPeriod[period]++
      }
    })
  })
  
  return metrics
}

// =============================================================================
// CHALLENGE EVALUATION
// =============================================================================

export function evaluateChallengeProgress(challenge: Challenge): number {
  const metrics = calculateMetrics()
  const periodKey = getPeriodKey(challenge.startDate, challenge.endDate)
  
  switch (challenge.goalType) {
    case 'workout_count':
      return metrics.workoutsInPeriod[periodKey] || 0
    case 'rep_total':
      return metrics.repsInPeriod[periodKey] || 0
    case 'streak_days':
      return metrics.currentStreak
    case 'skill_sessions':
      return metrics.skillSessionsInPeriod[periodKey] || 0
    case 'training_minutes':
      return metrics.trainingMinutesInPeriod[periodKey] || 0
    case 'exercise_count':
      // For exercise count, sum all exercises across workouts
      const workouts = getWorkoutLogs()
      let exerciseCount = 0
      workouts.forEach(workout => {
        const [start, end] = periodKey.split('_')
        if (isDateInPeriod(workout.sessionDate || workout.createdAt, start, end)) {
          exerciseCount += workout.exercises.filter(e => e.completed).length
        }
      })
      return exerciseCount
    default:
      return 0
  }
}

// Evaluate all challenges and update progress
export function evaluateAllChallenges(): {
  progress: ChallengeProgress[]
  newCompletions: Challenge[]
} {
  const challenges = getActiveChallenges()
  const existingProgress = getChallengeProgress()
  const existingCompletions = new Set(
    existingProgress.filter(p => p.completed).map(p => p.challengeId)
  )
  
  const newCompletions: Challenge[] = []
  const updatedProgress: ChallengeProgress[] = []
  
  challenges.forEach(challenge => {
    const currentValue = evaluateChallengeProgress(challenge)
    const isComplete = currentValue >= challenge.goalValue
    const wasComplete = existingCompletions.has(challenge.id)
    
    // Find existing progress or create new
    const existing = existingProgress.find(p => p.challengeId === challenge.id)
    
    const progress: ChallengeProgress = {
      challengeId: challenge.id,
      currentValue,
      completed: isComplete,
      completedAt: isComplete && !wasComplete 
        ? new Date().toISOString() 
        : existing?.completedAt,
      startedAt: existing?.startedAt || new Date().toISOString(),
    }
    
    updatedProgress.push(progress)
    
    // Track new completions
    if (isComplete && !wasComplete) {
      newCompletions.push(challenge)
    }
  })
  
  // Save updated progress
  saveChallengeProgress(updatedProgress)
  
  // Queue notifications for new completions
  if (newCompletions.length > 0) {
    const queue = getChallengeNotificationQueue()
    newCompletions.forEach(c => {
      if (!queue.includes(c.id)) {
        queue.push(c.id)
      }
    })
    saveChallengeNotificationQueue(queue)
    
    // Save rewards
    const rewards = getCompletedRewards()
    newCompletions.forEach(c => {
      rewards.push(c.reward)
    })
    saveCompletedRewards(rewards)
  }
  
  return { progress: updatedProgress, newCompletions }
}

// Get progress for a specific challenge
export function getChallengeProgressById(challengeId: string): ChallengeProgress | null {
  const progress = getChallengeProgress()
  return progress.find(p => p.challengeId === challengeId) || null
}

// Get all active challenges with their current progress
export function getActiveChallengesWithProgress(): Array<{
  challenge: Challenge
  progress: ChallengeProgress
  percentComplete: number
}> {
  // First evaluate to update progress
  evaluateAllChallenges()
  
  const challenges = getActiveChallenges()
  const progress = getChallengeProgress()
  
  return challenges.map(challenge => {
    const prog = progress.find(p => p.challengeId === challenge.id) || {
      challengeId: challenge.id,
      currentValue: 0,
      completed: false,
      startedAt: new Date().toISOString(),
    }
    
    const percentComplete = Math.min(100, Math.round((prog.currentValue / challenge.goalValue) * 100))
    
    return {
      challenge,
      progress: prog,
      percentComplete,
    }
  })
}

// Check if any challenges are close to expiring (within 24 hours)
export function getExpiringChallenges(): Challenge[] {
  const challenges = getActiveChallenges()
  const now = new Date()
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  
  return challenges.filter(c => {
    const endDate = new Date(c.endDate + 'T23:59:59')
    return endDate <= oneDayFromNow && endDate > now
  })
}

// Get total score boost from completed challenges
export function getTotalScoreBoost(): number {
  const rewards = getCompletedRewards()
  return rewards
    .filter(r => r.type === 'score_boost')
    .reduce((sum, r) => sum + r.value, 0)
}

// Get count of completed challenges
export function getCompletedChallengeCount(): number {
  const progress = getChallengeProgress()
  return progress.filter(p => p.completed).length
}

// Check for unseen challenge completions
export function hasUnseenChallengeCompletions(): boolean {
  return getChallengeNotificationQueue().length > 0
}
