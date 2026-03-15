// Leaderboard Service
// Centralized service for fetching and computing leaderboard data
// Supports both preview mode (localStorage) and production (database)

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

// =============================================================================
// STORAGE
// =============================================================================

const LEADERBOARD_STORAGE_KEY = 'spartanlab_leaderboard_cache'
const SAMPLE_USERS_KEY = 'spartanlab_sample_leaderboard_users'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// =============================================================================
// SAMPLE DATA GENERATION (For Preview Mode)
// =============================================================================

interface SampleUser {
  userId: string
  displayName: string
  spartanScore: number
  streak: number
  workoutsLast30: number
  skills: Record<string, number>
  achievementCount: number
  subscriptionTier: 'free' | 'pro'
}

// Generate realistic sample leaderboard users
function generateSampleUsers(): SampleUser[] {
  const names = [
    'AlexStrong', 'IronMike', 'FlexMaster', 'CoreKing', 'LeverLegend',
    'PlanchePro', 'MuscleMan', 'StrengthSage', 'FitPhoenix', 'PowerPanda',
    'GritGuru', 'BeastMode', 'TitanTom', 'SteelSara', 'MightyMax',
    'RockSolid', 'ZenWarrior', 'FireFit', 'SwiftStrike', 'IronWill',
    'SpartanSam', 'EliteElla', 'ChampCarl', 'DynamoDan', 'ForceField'
  ]
  
  return names.map((name, index) => {
    // Create varied but realistic distributions
    const baseScore = 850 - (index * 25) + Math.floor(Math.random() * 30)
    const normalizedScore = Math.max(150, Math.min(950, baseScore))
    
    return {
      userId: `sample-user-${index}`,
      displayName: name,
      spartanScore: normalizedScore,
      streak: Math.max(0, 45 - (index * 2) + Math.floor(Math.random() * 10)),
      workoutsLast30: Math.max(5, 28 - index + Math.floor(Math.random() * 5)),
      skills: {
        front_lever: Math.min(4, Math.max(0, 4 - Math.floor(index / 5))),
        planche: Math.min(4, Math.max(0, 4 - Math.floor(index / 4))),
        muscle_up: Math.min(4, Math.max(0, 4 - Math.floor(index / 6))),
        handstand_push_up: Math.min(4, Math.max(0, 4 - Math.floor(index / 5))),
      },
      achievementCount: Math.max(2, 15 - Math.floor(index / 2)),
      subscriptionTier: index < 15 ? 'pro' : 'free',
    }
  })
}

// Get or create sample users (cached in localStorage)
function getSampleUsers(): SampleUser[] {
  if (!isBrowser()) return generateSampleUsers()
  
  const cached = localStorage.getItem(SAMPLE_USERS_KEY)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // Fall through to regenerate
    }
  }
  
  const users = generateSampleUsers()
  localStorage.setItem(SAMPLE_USERS_KEY, JSON.stringify(users))
  return users
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
  
  return {
    spartanScore: scoreData.totalScore,
    level: scoreData.level,
    streak: streakData.currentStreak,
    workoutsLast30: recentLogs.length,
    skills,
    achievementCount: achievements.length,
  }
}

// =============================================================================
// LEADERBOARD GENERATORS
// =============================================================================

function generateGlobalSpartanScoreLeaderboard(): LeaderboardData {
  const sampleUsers = getSampleUsers()
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  // Combine sample users with current user
  const allEntries: LeaderboardEntry[] = sampleUsers.map(user => ({
    userId: user.userId,
    displayName: user.displayName,
    rank: 0,
    score: user.spartanScore,
    scoreLabel: `${user.spartanScore} pts`,
    level: getScoreLevel(user.spartanScore),
    achievementCount: user.achievementCount,
    subscriptionTier: user.subscriptionTier,
    isCurrentUser: false,
  }))
  
  // Add current user
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 0,
    score: currentUser.spartanScore,
    scoreLabel: `${currentUser.spartanScore} pts`,
    level: currentUser.level,
    achievementCount: currentUser.achievementCount,
    subscriptionTier: 'pro',
    isCurrentUser: true,
  })
  
  // Sort and assign ranks
  allEntries.sort((a, b) => b.score - a.score)
  allEntries.forEach((entry, index) => {
    entry.rank = index + 1
  })
  
  const userPosition = allEntries.find(e => e.isCurrentUser) || null
  const topEntries = allEntries.slice(0, 10)
  
  return {
    metadata: LEADERBOARD_CATEGORIES.global_spartan_score,
    entries: topEntries,
    userPosition,
    totalParticipants: allEntries.length,
    lastUpdated: new Date().toISOString(),
  }
}

function generateConsistencyLeaderboard(): LeaderboardData {
  const sampleUsers = getSampleUsers()
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  const allEntries: LeaderboardEntry[] = sampleUsers.map(user => ({
    userId: user.userId,
    displayName: user.displayName,
    rank: 0,
    score: user.streak,
    scoreLabel: `${user.streak} day streak`,
    achievementCount: user.achievementCount,
    subscriptionTier: user.subscriptionTier,
    isCurrentUser: false,
  }))
  
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 0,
    score: currentUser.streak,
    scoreLabel: `${currentUser.streak} day streak`,
    achievementCount: currentUser.achievementCount,
    subscriptionTier: 'pro',
    isCurrentUser: true,
  })
  
  allEntries.sort((a, b) => b.score - a.score)
  allEntries.forEach((entry, index) => {
    entry.rank = index + 1
  })
  
  const userPosition = allEntries.find(e => e.isCurrentUser) || null
  const topEntries = allEntries.slice(0, 10)
  
  return {
    metadata: LEADERBOARD_CATEGORIES.consistency,
    entries: topEntries,
    userPosition,
    totalParticipants: allEntries.length,
    lastUpdated: new Date().toISOString(),
  }
}

function generateSkillLeaderboard(skillKey: string): LeaderboardData {
  const category = skillKey as LeaderboardCategory
  const sampleUsers = getSampleUsers()
  const currentUser = getCurrentUserData()
  const profile = getAthleteProfile()
  
  const skillLevelNames = SKILL_LEVEL_NAMES[skillKey] || {}
  
  const allEntries: LeaderboardEntry[] = sampleUsers.map(user => {
    const skillLevel = user.skills[skillKey] ?? 0
    return {
      userId: user.userId,
      displayName: user.displayName,
      rank: 0,
      score: skillLevel,
      scoreLabel: skillLevelNames[skillLevel] || `Level ${skillLevel}`,
      level: skillLevelNames[skillLevel],
      achievementCount: user.achievementCount,
      subscriptionTier: user.subscriptionTier,
      isCurrentUser: false,
    }
  })
  
  const currentSkillLevel = currentUser.skills[skillKey] ?? 0
  allEntries.push({
    userId: 'current-user',
    displayName: profile?.username || 'You',
    rank: 0,
    score: currentSkillLevel,
    scoreLabel: skillLevelNames[currentSkillLevel] || `Level ${currentSkillLevel}`,
    level: skillLevelNames[currentSkillLevel],
    achievementCount: currentUser.achievementCount,
    subscriptionTier: 'pro',
    isCurrentUser: true,
  })
  
  // Sort by skill level (higher = better)
  allEntries.sort((a, b) => b.score - a.score)
  allEntries.forEach((entry, index) => {
    entry.rank = index + 1
  })
  
  const userPosition = allEntries.find(e => e.isCurrentUser) || null
  const topEntries = allEntries.slice(0, 10)
  
  return {
    metadata: LEADERBOARD_CATEGORIES[category],
    entries: topEntries,
    userPosition,
    totalParticipants: allEntries.length,
    lastUpdated: new Date().toISOString(),
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
