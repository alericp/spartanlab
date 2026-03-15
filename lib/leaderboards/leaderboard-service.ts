// Leaderboard Service
// Centralized service for fetching and computing leaderboard data
// Production mode: shows only current user (real data)
// Demo mode: disabled by default, only for explicit development testing

import { 
  type LeaderboardCategory, 
  type LeaderboardEntry, 
  type LeaderboardData,
  LEADERBOARD_CATEGORIES,
  SKILL_LEVEL_NAMES,
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
}

function getCurrentUserData(): CurrentUserData {
  // Get Spartan Score
  const scoreData = calculateSpartanScore()
  
  // Get streak data
  const streakData = calculateTrainingStreak()
  
  // Get workout count for last 30 days
  const logs = getWorkoutLogs()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentLogs = logs.filter(log => new Date(log.sessionDate) >= thirtyDaysAgo)
  
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
  }
}

// =============================================================================
// LEADERBOARD GENERATORS (Production: current user only, no fake data)
// =============================================================================

function generateGlobalSpartanScoreLeaderboard(): LeaderboardData {
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  // Production mode: only show current user's real data
  const allEntries: LeaderboardEntry[] = []
  
  // Add current user with their actual subscription tier
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 1,
    score: currentUser.spartanScore,
    scoreLabel: `${currentUser.spartanScore} pts`,
    level: currentUser.level,
    achievementCount: currentUser.achievementCount,
    subscriptionTier: currentUser.subscriptionTier === 'trial' ? 'pro' : currentUser.subscriptionTier,
    isCurrentUser: true,
  })
  
  const userPosition = allEntries[0]
  
  return {
    metadata: LEADERBOARD_CATEGORIES.global_spartan_score,
    entries: allEntries,
    userPosition,
    totalParticipants: 1,
    lastUpdated: new Date().toISOString(),
    // Flag to indicate this is early-stage data (no community yet)
    isEarlyAccess: true,
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
    achievementCount: currentUser.achievementCount,
    subscriptionTier: currentUser.subscriptionTier === 'trial' ? 'pro' : currentUser.subscriptionTier,
    isCurrentUser: true,
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
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 1,
    score: currentSkillLevel,
    scoreLabel: skillLevelNames[currentSkillLevel] || `Level ${currentSkillLevel}`,
    level: skillLevelNames[currentSkillLevel],
    achievementCount: currentUser.achievementCount,
    subscriptionTier: currentUser.subscriptionTier === 'trial' ? 'pro' : currentUser.subscriptionTier,
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

export function getLeaderboard(category: LeaderboardCategory): LeaderboardData {
  switch (category) {
    case 'global_spartan_score':
      return generateGlobalSpartanScoreLeaderboard()
    case 'consistency':
      return generateConsistencyLeaderboard()
    case 'front_lever':
    case 'planche':
    case 'muscle_up':
    case 'handstand_push_up':
      return generateSkillLeaderboard(category)
    default:
      return generateGlobalSpartanScoreLeaderboard()
  }
}

export function getAllLeaderboardCategories(): LeaderboardCategory[] {
  return Object.keys(LEADERBOARD_CATEGORIES) as LeaderboardCategory[]
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
// EXPORTS
// =============================================================================

export { LEADERBOARD_CATEGORIES, SKILL_LEVEL_NAMES }
