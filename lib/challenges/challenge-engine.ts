/**
 * SpartanLab Challenge Engine
 * 
 * Tracks user progress toward active challenges,
 * detects completions, and triggers reward events.
 */

import {
  getActiveChallenges,
  getChallengeById,
  getChallengeStatus,
  type ChallengeDefinition,
  type UserChallengeProgress,
  type ChallengeGoalType,
} from './challenge-definitions'

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_challenge_progress'
const COMPLETED_KEY = 'spartanlab_completed_challenges'

/**
 * Get all challenge progress from storage
 */
export function getChallengeProgress(): UserChallengeProgress[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as UserChallengeProgress[]
  } catch {
    return []
  }
}

/**
 * Save challenge progress
 */
function saveChallengeProgress(progress: UserChallengeProgress[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

/**
 * Get completed challenge IDs
 */
export function getCompletedChallengeIds(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(COMPLETED_KEY)
    if (!stored) return []
    return JSON.parse(stored) as string[]
  } catch {
    return []
  }
}

/**
 * Mark challenge as completed
 */
function markChallengeCompleted(challengeId: string): void {
  if (typeof window === 'undefined') return
  
  const completed = getCompletedChallengeIds()
  if (!completed.includes(challengeId)) {
    completed.push(challengeId)
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed))
  }
}

/**
 * Check if a challenge is already completed
 */
export function isChallengeCompleted(challengeId: string): boolean {
  return getCompletedChallengeIds().includes(challengeId)
}

// =============================================================================
// METRIC GATHERING
// =============================================================================

interface ChallengeMetrics {
  workoutCountThisWeek: number
  workoutCountThisMonth: number
  repsThisWeek: number
  repsThisMonth: number
  skillSessionsThisWeek: number
  currentStreak: number
}

/**
 * Gather current metrics for challenge evaluation
 */
function gatherChallengeMetrics(): ChallengeMetrics {
  if (typeof window === 'undefined') {
    return getDefaultMetrics()
  }
  
  try {
    // Get workout logs
    const workoutsStr = localStorage.getItem('spartanlab_workout_logs')
    const workouts = workoutsStr ? JSON.parse(workoutsStr) : []
    
    // Get skill sessions
    const skillSessionsStr = localStorage.getItem('spartanlab_skill_sessions')
    const skillSessions = skillSessionsStr ? JSON.parse(skillSessionsStr) : []
    
    // Get streak data
    const progressStr = localStorage.getItem('spartanlab_progress')
    const progress = progressStr ? JSON.parse(progressStr) : null
    
    // Calculate week boundaries
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Calculate month boundaries
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Filter workouts for this week/month
    const workoutsThisWeek = workouts.filter((w: any) => {
      const date = new Date(w.sessionDate || w.createdAt)
      return date >= startOfWeek
    })
    
    const workoutsThisMonth = workouts.filter((w: any) => {
      const date = new Date(w.sessionDate || w.createdAt)
      return date >= startOfMonth
    })
    
    // Calculate reps
    const calculateReps = (workoutList: any[]): number => {
      return workoutList.reduce((total, workout) => {
        if (!workout.exercises || !Array.isArray(workout.exercises)) return total
        return total + workout.exercises.reduce((sum: number, ex: any) => {
          const sets = ex.sets || 1
          const reps = ex.reps || 0
          return sum + (sets * reps)
        }, 0)
      }, 0)
    }
    
    // Filter skill sessions for this week
    const skillSessionsThisWeek = skillSessions.filter((s: any) => {
      const date = new Date(s.sessionDate || s.createdAt)
      return date >= startOfWeek
    })
    
    return {
      workoutCountThisWeek: workoutsThisWeek.length,
      workoutCountThisMonth: workoutsThisMonth.length,
      repsThisWeek: calculateReps(workoutsThisWeek),
      repsThisMonth: calculateReps(workoutsThisMonth),
      skillSessionsThisWeek: skillSessionsThisWeek.length,
      currentStreak: progress?.currentStreak || 0,
    }
  } catch (e) {
    console.error('[Challenges] Error gathering metrics:', e)
    return getDefaultMetrics()
  }
}

function getDefaultMetrics(): ChallengeMetrics {
  return {
    workoutCountThisWeek: 0,
    workoutCountThisMonth: 0,
    repsThisWeek: 0,
    repsThisMonth: 0,
    skillSessionsThisWeek: 0,
    currentStreak: 0,
  }
}

// =============================================================================
// PROGRESS EVALUATION
// =============================================================================

/**
 * Get current value for a challenge goal type
 */
function getCurrentValueForGoal(
  goalType: ChallengeGoalType,
  period: 'weekly' | 'monthly' | 'seasonal',
  metrics: ChallengeMetrics
): number {
  switch (goalType) {
    case 'workout_count':
      return period === 'weekly' ? metrics.workoutCountThisWeek : metrics.workoutCountThisMonth
    
    case 'rep_total':
      return period === 'weekly' ? metrics.repsThisWeek : metrics.repsThisMonth
    
    case 'skill_sessions':
      return metrics.skillSessionsThisWeek
    
    case 'streak_days':
      return metrics.currentStreak
    
    case 'exercise_volume':
      // For exercise-specific volume, would need target exercise
      return period === 'weekly' ? metrics.repsThisWeek : metrics.repsThisMonth
    
    default:
      return 0
  }
}

// =============================================================================
// ENGINE FUNCTIONS
// =============================================================================

export interface ChallengeWithProgress extends ChallengeDefinition {
  currentValue: number
  progressPercent: number
  isCompleted: boolean
  completedAt?: string
  timeRemaining: {
    days: number
    hours: number
    minutes: number
    expired: boolean
  }
}

/**
 * Get all active challenges with progress
 */
export function getActiveChallengesWithProgress(): ChallengeWithProgress[] {
  const challenges = getActiveChallenges()
  const metrics = gatherChallengeMetrics()
  const completedIds = getCompletedChallengeIds()
  const progress = getChallengeProgress()
  
  return challenges
    .filter(c => getChallengeStatus(c) === 'active')
    .map(challenge => {
      const isCompleted = completedIds.includes(challenge.id)
      const currentValue = getCurrentValueForGoal(challenge.goalType, challenge.period, metrics)
      const progressPercent = Math.min(100, Math.round((currentValue / challenge.goalValue) * 100))
      
      // Get time remaining
      const now = new Date().getTime()
      const end = new Date(challenge.endDate).getTime()
      const diff = Math.max(0, end - now)
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      // Check saved progress for completion date
      const savedProgress = progress.find(p => p.challengeId === challenge.id)
      
      return {
        ...challenge,
        currentValue,
        progressPercent,
        isCompleted,
        completedAt: savedProgress?.completedAt,
        timeRemaining: {
          days,
          hours,
          minutes,
          expired: diff <= 0,
        },
      }
    })
}

/**
 * Check for newly completed challenges
 */
export function checkChallengeCompletions(): ChallengeDefinition[] {
  const challenges = getActiveChallenges()
  const metrics = gatherChallengeMetrics()
  const completedIds = getCompletedChallengeIds()
  const newlyCompleted: ChallengeDefinition[] = []
  
  for (const challenge of challenges) {
    // Skip if already completed or not active
    if (completedIds.includes(challenge.id)) continue
    if (getChallengeStatus(challenge) !== 'active') continue
    
    const currentValue = getCurrentValueForGoal(challenge.goalType, challenge.period, metrics)
    
    if (currentValue >= challenge.goalValue) {
      // Challenge completed!
      markChallengeCompleted(challenge.id)
      newlyCompleted.push(challenge)
      
      // Update progress with completion timestamp
      updateChallengeProgress(challenge.id, currentValue, challenge.goalValue, true)
    }
  }
  
  return newlyCompleted
}

/**
 * Update progress for a specific challenge
 */
function updateChallengeProgress(
  challengeId: string,
  currentValue: number,
  goalValue: number,
  completed: boolean
): void {
  const progress = getChallengeProgress()
  const now = new Date().toISOString()
  
  const existingIndex = progress.findIndex(p => p.challengeId === challengeId)
  
  const newProgress: UserChallengeProgress = {
    challengeId,
    userId: 'local', // For localStorage, no actual user ID needed
    currentValue,
    goalValue,
    startedAt: existingIndex >= 0 ? progress[existingIndex].startedAt : now,
    completedAt: completed ? now : undefined,
    lastUpdated: now,
  }
  
  if (existingIndex >= 0) {
    progress[existingIndex] = newProgress
  } else {
    progress.push(newProgress)
  }
  
  saveChallengeProgress(progress)
}

/**
 * Get challenge summary statistics
 */
export interface ChallengeSummary {
  activeChallenges: number
  completedThisWeek: number
  completedThisMonth: number
  totalPointsEarned: number
  currentSeason?: string
}

export function getChallengeSummary(): ChallengeSummary {
  const challenges = getActiveChallenges()
  const completedIds = getCompletedChallengeIds()
  const activeChallenges = challenges.filter(c => getChallengeStatus(c) === 'active')
  
  // Count completions by period
  const completedThisWeek = activeChallenges
    .filter(c => c.period === 'weekly' && completedIds.includes(c.id))
    .length
  
  const completedThisMonth = activeChallenges
    .filter(c => (c.period === 'weekly' || c.period === 'monthly') && completedIds.includes(c.id))
    .length
  
  // Calculate total points from completed challenges
  const totalPointsEarned = challenges
    .filter(c => completedIds.includes(c.id))
    .reduce((sum, c) => sum + c.reward.pointBonus, 0)
  
  return {
    activeChallenges: activeChallenges.length,
    completedThisWeek,
    completedThisMonth,
    totalPointsEarned,
    currentSeason: 'Season 1',
  }
}

/**
 * Trigger challenge check on training events
 * Call this after workout completion, session logging, etc.
 */
export function onTrainingEventForChallenges(): ChallengeDefinition[] {
  return checkChallengeCompletions()
}

/**
 * Get challenges by period with progress
 */
export function getChallengesByPeriodWithProgress(
  period: 'weekly' | 'monthly' | 'seasonal'
): ChallengeWithProgress[] {
  return getActiveChallengesWithProgress().filter(c => c.period === period)
}
