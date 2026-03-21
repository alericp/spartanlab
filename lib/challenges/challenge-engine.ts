// Challenge Engine
// Evaluates challenge progress and detects completions

import {
  type Challenge,
  type ChallengeProgress,
  type ChallengeReward,
  getActiveChallenges,
  getChallengeById,
  markTierCompleted,
  getPeriodKeyForChallenge,
} from './challenge-definitions'
import { getWorkoutLogs } from '../workout-log-service'
import { getSkillSessions } from '../skill-session-service'
import { calculateTrainingStreak } from '../progress-streak-engine'
import { getStrengthRecords } from '../strength-service'
import { getSkillProgressions } from '../data-service'
// [baseline-vs-earned] ISSUE A: Import earned progress helpers
import { 
  getEarnedStrengthRecords, 
  getTrustedWorkoutLogs,
  isStrengthMilestoneEarned,
  shouldChallengeUseBaseline,
  getBaselineVsEarnedSummary,
} from '../baseline-earned-truth'

// =============================================================================
// SKILL & TIMED RESULTS STORAGE
// =============================================================================
// For manually logged skill achievements and timed challenge results

const SKILL_ACHIEVEMENTS_KEY = 'spartanlab_skill_achievements'
const TIMED_RESULTS_KEY = 'spartanlab_timed_results'
const PR_RECORDS_KEY = 'spartanlab_pr_records'

interface SkillAchievement {
  skillType: string
  holdTime?: number
  reps?: number
  achievedAt: string
}

interface TimedResult {
  challengeType: string
  reps: number
  timeLimit: number
  achievedAt: string
}

interface PRRecord {
  exercise: string
  maxReps: number
  achievedAt: string
}

function getSkillAchievements(): SkillAchievement[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(SKILL_ACHIEVEMENTS_KEY)
  if (stored) { try { return JSON.parse(stored) } catch { return [] } }
  return []
}

export function saveSkillAchievement(achievement: Omit<SkillAchievement, 'achievedAt'>): void {
  if (typeof window === 'undefined') return
  const achievements = getSkillAchievements()
  achievements.push({ ...achievement, achievedAt: new Date().toISOString() })
  localStorage.setItem(SKILL_ACHIEVEMENTS_KEY, JSON.stringify(achievements))
}

function getTimedResults(): TimedResult[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TIMED_RESULTS_KEY)
  if (stored) { try { return JSON.parse(stored) } catch { return [] } }
  return []
}

export function saveTimedResult(result: Omit<TimedResult, 'achievedAt'>): void {
  if (typeof window === 'undefined') return
  const results = getTimedResults()
  results.push({ ...result, achievedAt: new Date().toISOString() })
  localStorage.setItem(TIMED_RESULTS_KEY, JSON.stringify(results))
}

function getPRRecords(): PRRecord[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(PR_RECORDS_KEY)
  if (stored) { try { return JSON.parse(stored) } catch { return [] } }
  return []
}

export function savePRRecord(exercise: string, maxReps: number): void {
  if (typeof window === 'undefined') return
  const records = getPRRecords()
  const existing = records.find(r => r.exercise === exercise)
  if (existing) {
    if (maxReps > existing.maxReps) {
      existing.maxReps = maxReps
      existing.achievedAt = new Date().toISOString()
    }
  } else {
    records.push({ exercise, maxReps, achievedAt: new Date().toISOString() })
  }
  localStorage.setItem(PR_RECORDS_KEY, JSON.stringify(records))
}

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
  // Strength metrics
  maxPullUps: number
  maxDips: number
  maxPushUps: number
  weightedPullUp: number // max weight added
  weightedDip: number
  // Skill hold times (from skill sessions)
  skillHoldTimes: Record<string, number> // skill_type -> max hold seconds
  // Skill levels
  skillLevels: Record<string, number> // skill_type -> level
  // Timed challenge results
  timedResults: Record<string, number> // challenge_type -> best result
}

function getPeriodKey(startDate: string, endDate: string): string {
  return `${startDate}_${endDate}`
}

function isDateInPeriod(date: string, startDate: string, endDate: string): boolean {
  const d = date.split('T')[0]
  return d >= startDate && d <= endDate
}

// Filter to only trusted workouts - excludes demo/seed/untrusted data
// PHASE 5: Stricter filtering - require explicit trust OR known good sourceRoute
function getTrustedWorkouts() {
  return getWorkoutLogs().filter(log => {
    // Reject demo workouts
    if (log.sourceRoute === 'demo' || (log as any).isDemo === true) return false
    // Reject explicitly untrusted
    if (log.trusted === false) return false
    // PHASE 5: Require explicit trust OR known good sourceRoute
    const hasValidSource = log.sourceRoute === 'workout_session' || 
                          log.sourceRoute === 'first_session' || 
                          log.sourceRoute === 'quick_log'
    const hasExplicitTrust = log.trusted === true
    return hasValidSource || hasExplicitTrust
  })
}

function calculateMetrics(): ChallengeMetrics {
  const workouts = getTrustedWorkouts()
  const skillSessions = getSkillSessions()
  const streakData = calculateTrainingStreak()
  // [baseline-vs-earned] ISSUE B: Use earned-only strength records for challenges
  const strengthRecords = getEarnedStrengthRecords()
  const skillProgressions = getSkillProgressions()
  const skillAchievements = getSkillAchievements()
  const timedResults = getTimedResults()
  const prRecords = getPRRecords()
  
  // [baseline-vs-earned] Get baseline vs earned summary for logging
  const truthSummary = getBaselineVsEarnedSummary()
  console.log('[baseline-vs-earned] Challenge metrics using earned-only data:', {
    earnedWorkouts: workouts.length,
    earnedStrengthRecords: strengthRecords.length,
    baselinePullUp: truthSummary.baseline.pullUpMax,
    earnedPullUp: truthSummary.earned.earnedPullUpMax,
  })
  
  const metrics: ChallengeMetrics = {
    workoutsInPeriod: {},
    repsInPeriod: {},
    currentStreak: streakData.currentStreak,
    skillSessionsInPeriod: {},
    trainingMinutesInPeriod: {},
    // Strength metrics
    maxPullUps: 0,
    maxDips: 0,
    maxPushUps: 0,
    weightedPullUp: 0,
    weightedDip: 0,
    // Skill metrics
    skillHoldTimes: {},
    skillLevels: {},
    timedResults: {},
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
  
  // Count skill sessions per period and extract best hold times
  skillSessions.forEach(session => {
    periods.forEach(period => {
      const [start, end] = period.split('_')
      if (isDateInPeriod(session.sessionDate, start, end)) {
        metrics.skillSessionsInPeriod[period]++
      }
    })
    
    // Track best session density (total hold time) per skill from sets
    if (session.skillName && session.sets) {
      const totalHoldTime = session.sets.reduce((sum, set) => sum + (set.holdSeconds || 0), 0)
      const bestSet = Math.max(...session.sets.map(s => s.holdSeconds || 0))
      const current = metrics.skillHoldTimes[session.skillName] || 0
      if (bestSet > current) {
        metrics.skillHoldTimes[session.skillName] = bestSet
      }
    }
  })
  
  // Extract skill achievements (manually logged holds)
  skillAchievements.forEach(achievement => {
    if (achievement.holdTime) {
      const current = metrics.skillHoldTimes[achievement.skillType] || 0
      if (achievement.holdTime > current) {
        metrics.skillHoldTimes[achievement.skillType] = achievement.holdTime
      }
    }
    if (achievement.reps) {
      // For skill milestones like muscle-ups, HSPU
      const current = metrics.skillLevels[achievement.skillType] || 0
      if (achievement.reps > current) {
        metrics.skillLevels[achievement.skillType] = achievement.reps
      }
    }
  })
  
  // Extract timed challenge results
  timedResults.forEach(result => {
    const current = metrics.timedResults[result.challengeType] || 0
    if (result.reps > current) {
      metrics.timedResults[result.challengeType] = result.reps
    }
  })
  
  // Extract strength records
  strengthRecords.forEach(record => {
    if (record.exercise === 'weighted_pull_up' && record.weightAdded > metrics.weightedPullUp) {
      metrics.weightedPullUp = record.weightAdded
    }
    if (record.exercise === 'weighted_dip' && record.weightAdded > metrics.weightedDip) {
      metrics.weightedDip = record.weightAdded
    }
  })
  
  // Extract PR records for max reps
  prRecords.forEach(record => {
    if (record.exercise === 'pull_ups') {
      metrics.maxPullUps = Math.max(metrics.maxPullUps, record.maxReps)
    }
    if (record.exercise === 'dips') {
      metrics.maxDips = Math.max(metrics.maxDips, record.maxReps)
    }
    if (record.exercise === 'push_ups') {
      metrics.maxPushUps = Math.max(metrics.maxPushUps, record.maxReps)
    }
  })
  
  // Extract skill levels from progressions
  skillProgressions.forEach(progression => {
    metrics.skillLevels[progression.skillName] = progression.currentLevel
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
      // For exercise count, sum all exercises across trusted workouts
      const workouts = getTrustedWorkouts()
      let exerciseCount = 0
      workouts.forEach(workout => {
        const [start, end] = periodKey.split('_')
        if (isDateInPeriod(workout.sessionDate || workout.createdAt, start, end)) {
          exerciseCount += workout.exercises.filter(e => e.completed).length
        }
      })
      return exerciseCount
    
    // Strength rep challenges
    case 'strength_reps':
      if (challenge.exerciseType === 'pull_ups') return metrics.maxPullUps
      if (challenge.exerciseType === 'dips') return metrics.maxDips
      if (challenge.exerciseType === 'push_ups') return metrics.maxPushUps
      // For HSPU/skill-based strength reps
      if (challenge.skillType && metrics.skillLevels[challenge.skillType]) {
        return metrics.skillLevels[challenge.skillType]
      }
      return 0
    
    // Weighted strength challenges
    case 'weighted_strength':
      if (challenge.exerciseType === 'weighted_pull_up') return metrics.weightedPullUp
      if (challenge.exerciseType === 'weighted_dip') return metrics.weightedDip
      return 0
    
    // Hold time challenges
    case 'hold_time':
      if (challenge.skillType) {
        return metrics.skillHoldTimes[challenge.skillType] || 0
      }
      // Generic holds like L-sit use baseId as key
      if (challenge.baseId) {
        return metrics.skillHoldTimes[challenge.baseId] || 0
      }
      return 0
    
    // Timed max rep challenges
    case 'timed_max_reps':
      if (challenge.baseId) {
        return metrics.timedResults[challenge.baseId] || 0
      }
      return 0
    
    // Skill milestone challenges
    case 'skill_milestone':
      if (challenge.skillType) {
        return metrics.skillLevels[challenge.skillType] || 0
      }
      return 0
    
    // H2H challenges are evaluated separately
    case 'h2h_challenge':
      return 0
    
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
    
    // Track new completions and update tier progress
    if (isComplete && !wasComplete) {
      newCompletions.push(challenge)
      
      // Mark tier as completed for tiered challenges
      if (challenge.baseId && challenge.tier) {
        const periodKey = getPeriodKeyForChallenge(challenge)
        markTierCompleted(challenge.baseId, periodKey, challenge.tier)
      }
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

// =============================================================================
// CHALLENGE TYPES FOR PANEL COMPONENTS
// =============================================================================

export interface ChallengeWithProgress {
  id: string
  name: string
  description: string
  category: string
  period: 'weekly' | 'monthly' | 'seasonal' | 'skill' | 'strength' | 'time'
  goalValue: number
  currentValue: number
  percentComplete: number
  completed: boolean
  endDate: string
  reward: ChallengeReward
  icon?: string
  tier?: number
  maxTier?: number
  timeRemaining?: {
    days: number
    hours: number
    minutes: number
    expired: boolean
  }
  isCompleted?: boolean
  progressPercent?: number
  // [baseline-vs-earned] ISSUE E: Track progress source for UI labeling
  progressSource?: 'earned' | 'baseline' | 'mixed'
  baselineValue?: number // What user started with (if applicable)
  earnedValue?: number   // What user earned in-app (if applicable)
}

export interface ChallengeSummary {
  totalActive: number
  completedThisPeriod: number
  completedThisMonth: number // alias for panel compatibility
  scoreBoost: number
  totalPointsEarned: number // alias for panel compatibility
  streakDays: number
}

/**
 * Get challenges by period with progress info for panel display
 */
export function getChallengesByPeriodWithProgress(period: 'weekly' | 'monthly'): ChallengeWithProgress[] {
  const all = getActiveChallengesWithProgress()
  return all
    .filter(item => item.challenge.category === period)
    .map(item => ({
      id: item.challenge.id,
      name: item.challenge.name,
      description: item.challenge.description,
      category: item.challenge.category,
      period: item.challenge.category as 'weekly' | 'monthly' | 'seasonal',
      goalValue: item.challenge.goalValue,
      currentValue: item.progress.currentValue,
      percentComplete: item.percentComplete,
      completed: item.progress.completed,
      endDate: item.challenge.endDate,
      reward: item.challenge.reward,
    }))
}

/**
  * Get all active challenges as ChallengeWithProgress[] for panel display
  */
  export function getAllChallengesWithProgress(): ChallengeWithProgress[] {
  const all = getActiveChallengesWithProgress()
  return all.map(item => {
  const now = new Date()
  const end = new Date(item.challenge.endDate + 'T23:59:59')
  const diff = end.getTime() - now.getTime()
  const expired = diff <= 0
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)))
  
  return {
    id: item.challenge.id,
    name: item.challenge.name,
    description: item.challenge.description,
    category: item.challenge.category,
    period: item.challenge.category as 'weekly' | 'monthly' | 'seasonal' | 'skill' | 'strength' | 'time',
    goalValue: item.challenge.goalValue,
    currentValue: item.progress.currentValue,
    percentComplete: item.percentComplete,
    completed: item.progress.completed,
    endDate: item.challenge.endDate,
    reward: item.challenge.reward,
    icon: item.challenge.icon,
    tier: item.challenge.tier,
    maxTier: item.challenge.maxTier,
    timeRemaining: { days, hours, minutes, expired },
    isCompleted: item.progress.completed,
    progressPercent: item.percentComplete,
  }
  })
  }

/**
 * Get challenge summary stats for dashboard
 */
export function getChallengeSummary(): ChallengeSummary {
  const progress = getChallengeProgress()
  const completedCount = progress.filter(p => p.completed).length
  const scoreBoost = getTotalScoreBoost()
  
  return {
    totalActive: getActiveChallenges().length,
    completedThisPeriod: completedCount,
    completedThisMonth: completedCount, // alias for panel compatibility
    scoreBoost,
    totalPointsEarned: scoreBoost, // alias for panel compatibility
    streakDays: 0, // Could track actual streak later
  }
}

// =============================================================================
// TRAINING EVENT HOOK FOR CHALLENGES
// =============================================================================

/**
 * Called after training events to evaluate challenges
 * Returns array of newly completed challenge IDs
 */
export function onTrainingEventForChallenges(): string[] {
  const { newCompletions } = evaluateAllChallenges()
  return newCompletions.map(c => c.id)
}
