// Leaderboard Service
// Centralized service for fetching and computing leaderboard data
// Production mode: shows only current user (real data)
// Demo mode: disabled by default, only for explicit development testing

import { 
  type LeaderboardCategory, 
  type LeaderboardEntry, 
  type LeaderboardData,
  type LeaderboardTimeScope,
  LEADERBOARD_CATEGORIES,
  SKILL_LEVEL_NAMES,
  TIME_SCOPE_CONFIGS,
} from './leaderboard-types'
import { calculateSpartanScore } from '../strength-score-engine'
import { calculateTrainingStreak } from '../progress-streak-engine'
import { getSkillProgressions, getAthleteProfile, type SkillProgression } from '../data-service'
import { getWorkoutLogs } from '../workout-log-service'
import { getUnlockedAchievements } from '../achievements/achievement-definitions'
import { getUISubscriptionStatus } from '../billing/subscription-status'

// =============================================================================
// HELPERS
// =============================================================================

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Get the start of the current week (Monday 00:00 UTC)
function getWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1 // Monday is day 1, Sunday is 0
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diff,
    0, 0, 0, 0
  ))
  return monday
}

// Get the start of the current month (1st day 00:00 UTC)
function getMonthStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    1, 0, 0, 0, 0
  ))
}

// Get the next reset date for the time scope
function getScopeResetDate(scope: LeaderboardTimeScope): string {
  const now = new Date()
  
  if (scope === 'weekly') {
    // Next Monday
    const weekStart = getWeekStart()
    const nextMonday = new Date(weekStart)
    nextMonday.setDate(nextMonday.getDate() + 7)
    return nextMonday.toISOString()
  }
  
  if (scope === 'monthly') {
    // First day of next month
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1, 0, 0, 0, 0
    )).toISOString()
  }
  
  return '' // All-time has no reset
}

// =============================================================================
// TIME-SCOPED SCORE CALCULATION
// =============================================================================

// Calculate score earned within a time scope
// For weekly/monthly: count workouts in period and estimate score contribution
// This is a fair approximation based on logged workout activity
function calculateScopedScore(
  totalScore: number,
  logs: Array<{ sessionDate: string; durationMinutes: number; perceivedDifficulty?: string }>,
  scope: LeaderboardTimeScope
): number {
  if (scope === 'all_time') {
    return totalScore
  }
  
  const scopeStart = scope === 'weekly' ? getWeekStart() : getMonthStart()
  
  // Filter logs to this scope
  const scopedLogs = logs.filter(log => {
    const logDate = new Date(log.sessionDate)
    return logDate >= scopeStart
  })
  
  // Calculate score contribution from workouts in scope
  // Base: 10 points per workout + duration bonus + difficulty bonus
  let scopedScore = 0
  
  for (const log of scopedLogs) {
    // Base workout completion
    let workoutScore = 10
    
    // Duration bonus (up to 15 points for 60+ min sessions)
    workoutScore += Math.min(15, Math.floor(log.durationMinutes / 4))
    
    // Difficulty bonus
    if (log.perceivedDifficulty === 'hard') {
      workoutScore += 5
    } else if (log.perceivedDifficulty === 'easy') {
      workoutScore += 2
    } else {
      workoutScore += 3 // normal
    }
    
    scopedScore += workoutScore
  }
  
  // Add streak maintenance bonus (5 points if any workout this period)
  if (scopedLogs.length > 0) {
    scopedScore += 5
  }
  
  // Consistency bonus: extra points for multiple workouts
  if (scopedLogs.length >= 3) {
    scopedScore += 10 // Consistent week/month bonus
  }
  if (scopedLogs.length >= 5) {
    scopedScore += 15 // Very active bonus
  }
  
  return scopedScore
}

// =============================================================================
// CURRENT USER DATA
// =============================================================================

interface CurrentUserData {
  spartanScore: number
  level: string
  streak: number
  workoutsLast30: number
  skills: Record<string, number>
  achievementCount: number
  subscriptionTier: 'free' | 'pro' | 'trial'
  // Time-scoped scores
  weeklyScore: number
  monthlyScore: number
}

function getCurrentUserData(): CurrentUserData {
  // Get Spartan Score
  const scoreData = calculateSpartanScore()
  
  // Get streak data
  const streakData = calculateTrainingStreak()
  
  // Get workout logs
  const logs = getWorkoutLogs()
  
  // Get workout count for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentLogs = logs.filter(log => new Date(log.sessionDate) >= thirtyDaysAgo)
  
  // Calculate time-scoped scores
  const weeklyScore = calculateScopedScore(scoreData.totalScore, logs, 'weekly')
  const monthlyScore = calculateScopedScore(scoreData.totalScore, logs, 'monthly')
  
  // Get skill progressions
  const progressions = getSkillProgressions()
  const skills: Record<string, number> = {}
  progressions.forEach(p => {
    skills[p.skillName] = p.currentLevel
  })
  
  // Get achievement count
  const achievements = getUnlockedAchievements()
  
  // Get actual subscription tier from subscription status
  const uiStatus = getUISubscriptionStatus()
  const subscriptionTier: 'free' | 'pro' | 'trial' = uiStatus === 'trial' ? 'trial' : uiStatus
  
  return {
    spartanScore: scoreData.totalScore,
    level: scoreData.level,
    streak: streakData.currentStreak,
    workoutsLast30: recentLogs.length,
    skills,
    achievementCount: achievements.length,
    subscriptionTier,
    weeklyScore,
    monthlyScore,
  }
}

// =============================================================================
// LEADERBOARD GENERATORS (Production: current user only, no fake data)
// =============================================================================

function generateGlobalSpartanScoreLeaderboard(timeScope: LeaderboardTimeScope = 'weekly'): LeaderboardData {
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  // Get score based on time scope
  let score: number
  let scopeLabel: string
  
  switch (timeScope) {
    case 'weekly':
      score = currentUser.weeklyScore
      scopeLabel = 'this week'
      break
    case 'monthly':
      score = currentUser.monthlyScore
      scopeLabel = 'this month'
      break
    case 'all_time':
    default:
      score = currentUser.spartanScore
      scopeLabel = 'total'
      break
  }
  
  // Production mode: only show current user's real data
  const allEntries: LeaderboardEntry[] = []
  
  // Add current user with their actual subscription tier
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 1,
    score: score,
    scoreLabel: `${score} pts`,
    formattedScore: `${score} pts`,
    level: currentUser.level,
    achievementCount: currentUser.achievementCount,
    subscriptionTier: currentUser.subscriptionTier === 'trial' ? 'pro' : currentUser.subscriptionTier,
    isPro: currentUser.subscriptionTier === 'pro' || currentUser.subscriptionTier === 'trial',
    isCurrentUser: true,
    streakDays: currentUser.streak,
  })
  
  const userPosition = allEntries[0]
  
  // Build metadata with scope info
  const scopedMetadata = {
    ...LEADERBOARD_CATEGORIES.global_spartan_score,
    title: timeScope === 'all_time' 
      ? 'Spartan Score' 
      : `Spartan Score (${TIME_SCOPE_CONFIGS[timeScope].label})`,
    description: timeScope === 'all_time'
      ? LEADERBOARD_CATEGORIES.global_spartan_score.description
      : `Score earned ${scopeLabel}. ${TIME_SCOPE_CONFIGS[timeScope].description}`,
  }
  
  return {
    metadata: scopedMetadata,
    entries: allEntries,
    userPosition,
    totalParticipants: 1,
    lastUpdated: new Date().toISOString(),
    // Flag to indicate this is early-stage data (no community yet)
    isEarlyAccess: true,
    timeScope,
    scopeResetDate: getScopeResetDate(timeScope),
  }
}

function generateConsistencyLeaderboard(): LeaderboardData {
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  const allEntries: LeaderboardEntry[] = []
  
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 1,
    score: currentUser.streak,
    scoreLabel: `${currentUser.streak} day streak`,
    formattedScore: `${currentUser.streak} days`,
    achievementCount: currentUser.achievementCount,
    subscriptionTier: currentUser.subscriptionTier === 'trial' ? 'pro' : currentUser.subscriptionTier,
    isPro: currentUser.subscriptionTier === 'pro' || currentUser.subscriptionTier === 'trial',
    isCurrentUser: true,
    streakDays: currentUser.streak,
  })
  
  const userPosition = allEntries[0]
  
  return {
    metadata: LEADERBOARD_CATEGORIES.consistency,
    entries: allEntries,
    userPosition,
    totalParticipants: 1,
    lastUpdated: new Date().toISOString(),
    isEarlyAccess: true,
  }
}

function generateSkillLeaderboard(skillKey: string): LeaderboardData {
  const category = skillKey as LeaderboardCategory
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  const skillLevelNames = SKILL_LEVEL_NAMES[skillKey] || {}
  const allEntries: LeaderboardEntry[] = []
  
  const currentSkillLevel = currentUser.skills[skillKey] ?? 0
  const levelName = skillLevelNames[currentSkillLevel] || `Level ${currentSkillLevel}`
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 1,
    score: currentSkillLevel,
    scoreLabel: levelName,
    formattedScore: levelName,
    level: skillLevelNames[currentSkillLevel],
    achievementCount: currentUser.achievementCount,
    subscriptionTier: currentUser.subscriptionTier === 'trial' ? 'pro' : currentUser.subscriptionTier,
    isPro: currentUser.subscriptionTier === 'pro' || currentUser.subscriptionTier === 'trial',
    isCurrentUser: true,
  })
  
  const userPosition = allEntries[0]
  
  return {
    metadata: LEADERBOARD_CATEGORIES[category],
    entries: allEntries,
    userPosition,
    totalParticipants: 1,
    lastUpdated: new Date().toISOString(),
    isEarlyAccess: true,
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

export function getLeaderboard(
  category: LeaderboardCategory,
  timeScope: LeaderboardTimeScope = 'weekly'
): LeaderboardData {
  switch (category) {
    case 'global_spartan_score':
      return generateGlobalSpartanScoreLeaderboard(timeScope)
    case 'consistency':
      return generateConsistencyLeaderboard()
    case 'front_lever':
    case 'planche':
    case 'muscle_up':
    case 'handstand_push_up':
      return generateSkillLeaderboard(category)
    default:
      return generateGlobalSpartanScoreLeaderboard(timeScope)
  }
}

export function getAllLeaderboardCategories(): LeaderboardCategory[] {
  return Object.keys(LEADERBOARD_CATEGORIES) as LeaderboardCategory[]
}

export function getAllTimeScopes(): LeaderboardTimeScope[] {
  return ['weekly', 'monthly', 'all_time']
}

// Refresh leaderboard (recalculates scores)
export function refreshLeaderboard(
  category: LeaderboardCategory,
  timeScope: LeaderboardTimeScope = 'weekly'
): LeaderboardData {
  // Simply returns fresh data since we recalculate on each call
  return getLeaderboard(category, timeScope)
}

// Helper to get Spartan Score level name
function getScoreLevel(score: number): string {
  if (score >= 800) return 'Elite'
  if (score >= 600) return 'Advanced'
  if (score >= 400) return 'Intermediate'
  if (score >= 200) return 'Developing'
  return 'Beginner'
}

// =============================================================================
// BEST SCOPE FINDER - helps users see where they're performing best
// =============================================================================

export interface BestScopeResult {
  bestScope: LeaderboardTimeScope
  rank: number
  score: number
  message: string
}

/**
 * Find which time scope the user is performing best in
 * This helps beginners feel immediate progress
 */
export function getBestScope(): BestScopeResult {
  const weekly = getLeaderboard('global_spartan_score', 'weekly')
  const monthly = getLeaderboard('global_spartan_score', 'monthly')
  const allTime = getLeaderboard('global_spartan_score', 'all_time')
  
  const scopes: Array<{ scope: LeaderboardTimeScope; data: LeaderboardData }> = [
    { scope: 'weekly', data: weekly },
    { scope: 'monthly', data: monthly },
    { scope: 'all_time', data: allTime },
  ]
  
  // In early access, default to weekly since that's most motivating for beginners
  if (weekly.isEarlyAccess) {
    return {
      bestScope: 'weekly',
      rank: 1,
      score: weekly.userPosition?.score ?? 0,
      message: 'You\'re building your weekly ranking',
    }
  }
  
  // Find best rank
  let bestScope: LeaderboardTimeScope = 'weekly'
  let bestRank = Infinity
  let bestScore = 0
  
  for (const { scope, data } of scopes) {
    if (data.userPosition && data.userPosition.rank < bestRank) {
      bestRank = data.userPosition.rank
      bestScope = scope
      bestScore = data.userPosition.score
    }
  }
  
  const scopeLabels: Record<LeaderboardTimeScope, string> = {
    weekly: 'this week',
    monthly: 'this month',
    all_time: 'all-time',
  }
  
  return {
    bestScope,
    rank: bestRank === Infinity ? 1 : bestRank,
    score: bestScore,
    message: `Best rank: #${bestRank === Infinity ? 1 : bestRank} ${scopeLabels[bestScope]}`,
  }
}

/**
 * Get motivational message based on user's position and activity
 */
export function getMotivationalMessage(
  timeScope: LeaderboardTimeScope,
  userScore: number,
  isEarlyAccess: boolean
): string {
  if (isEarlyAccess) {
    const messages = {
      weekly: 'Keep training to climb this week\'s rankings',
      monthly: 'Stay consistent to dominate this month',
      all_time: 'Build your legacy on the all-time board',
    }
    return messages[timeScope]
  }
  
  if (userScore === 0) {
    return 'Complete a workout to start earning points'
  }
  
  const motivations = {
    weekly: [
      'Every workout this week counts toward your ranking',
      'Push harder to climb the weekly leaderboard',
      'A strong finish this week could change everything',
    ],
    monthly: [
      'Stay consistent to hold your monthly position',
      'There\'s still time to climb this month',
      'Monthly rankings reward dedication',
    ],
    all_time: [
      'Your long-term commitment is building something lasting',
      'The all-time board celebrates sustained excellence',
      'Legends are made through consistent effort',
    ],
  }
  
  const scopeMessages = motivations[timeScope]
  return scopeMessages[Math.floor(Math.random() * scopeMessages.length)]
}

// =============================================================================
// EXPORTS
// =============================================================================

export { LEADERBOARD_CATEGORIES, SKILL_LEVEL_NAMES, TIME_SCOPE_CONFIGS }
export type { BestScopeResult }
