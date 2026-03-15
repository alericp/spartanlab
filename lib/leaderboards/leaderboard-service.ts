/**
 * SpartanLab Leaderboard Service
 * 
 * Handles leaderboard data generation, ranking, and user position tracking.
 * Currently uses localStorage for preview mode; ready for database integration.
 */

import {
  type LeaderboardCategory,
  type LeaderboardEntry,
  type LeaderboardData,
  type UserRankingSummary,
  type LeaderboardBadge,
  getCategoryConfig,
  formatLeaderboardScore,
  getSkillLevelLabel,
  LEADERBOARD_CATEGORIES,
} from './leaderboard-types'
import { calculateSpartanScore, calculateConsistencyScore, calculateSkillScore, calculateStrengthScore, getSpartanLevel } from '../strength-score-engine'
import { getAchievementSummary, getUnlockedAchievements } from '../achievements/achievement-engine'
import { getSkillProgressions } from '../data-service'
import { getPersonalRecords } from '../strength-service'

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = 'spartanlab_leaderboard_cache'
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

interface LeaderboardCache {
  [category: string]: {
    data: LeaderboardData
    cachedAt: number
  }
}

function getCache(): LeaderboardCache {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function setCache(category: LeaderboardCategory, data: LeaderboardData): void {
  if (typeof window === 'undefined') return
  try {
    const cache = getCache()
    cache[category] = { data, cachedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore cache errors
  }
}

// =============================================================================
// MOCK DATA GENERATION
// =============================================================================

// Realistic mock users for preview mode leaderboards
const MOCK_USERS = [
  { id: 'user-001', name: 'Atlas', avatarUrl: undefined },
  { id: 'user-002', name: 'Spartan_King', avatarUrl: undefined },
  { id: 'user-003', name: 'CalisthenicsBeast', avatarUrl: undefined },
  { id: 'user-004', name: 'IronWill', avatarUrl: undefined },
  { id: 'user-005', name: 'FlexMaster', avatarUrl: undefined },
  { id: 'user-006', name: 'StreetWorkout_Pro', avatarUrl: undefined },
  { id: 'user-007', name: 'Gymnast_Elite', avatarUrl: undefined },
  { id: 'user-008', name: 'BodyweightKing', avatarUrl: undefined },
  { id: 'user-009', name: 'PlancheMaster', avatarUrl: undefined },
  { id: 'user-010', name: 'LeverLord', avatarUrl: undefined },
  { id: 'user-011', name: 'MuscleUpChamp', avatarUrl: undefined },
  { id: 'user-012', name: 'HandstandHero', avatarUrl: undefined },
  { id: 'user-013', name: 'StrengthSeeker', avatarUrl: undefined },
  { id: 'user-014', name: 'SkillBuilder', avatarUrl: undefined },
  { id: 'user-015', name: 'ConsistentCarl', avatarUrl: undefined },
]

function generateMockScore(category: LeaderboardCategory, rank: number): number {
  // Generate realistic scores based on category and rank
  const variance = Math.random() * 0.1 // 10% variance
  
  switch (category) {
    case 'global_spartan_score':
      // Top scores range from 900 down to 200
      const baseScore = 920 - (rank * 45) + Math.floor(Math.random() * 30)
      return Math.max(100, Math.min(1000, baseScore))
    
    case 'consistency':
      // Streaks range from 180 days down to 3
      const baseStreak = Math.floor(200 - rank * 12 + Math.random() * 10)
      return Math.max(1, baseStreak)
    
    case 'front_lever':
    case 'planche':
    case 'muscle_up':
    case 'handstand_pushup':
      // Skill levels 0-4, with top ranks having higher levels
      if (rank <= 3) return 4
      if (rank <= 6) return 3
      if (rank <= 10) return 2
      return Math.max(0, 1 - Math.floor(rank / 15))
    
    case 'weighted_strength':
      // Combined weighted strength (pull + dip 1RM)
      const baseStrength = 220 - rank * 10 + Math.floor(Math.random() * 15)
      return Math.max(45, baseStrength)
    
    default:
      return 100 - rank * 5
  }
}

function generateMockBadges(rank: number): LeaderboardBadge[] {
  const badges: LeaderboardBadge[] = []
  
  if (rank === 1) {
    badges.push({ id: 'champion', name: 'Champion', tier: 'legendary' })
  }
  if (rank <= 3 && Math.random() > 0.3) {
    badges.push({ id: 'elite_athlete', name: 'Elite Athlete', tier: 'epic' })
  }
  if (rank <= 10 && Math.random() > 0.5) {
    badges.push({ id: 'dedicated', name: 'Dedicated', tier: 'rare' })
  }
  
  return badges
}

function generateMockEntries(category: LeaderboardCategory, count: number = 15): LeaderboardEntry[] {
  return MOCK_USERS.slice(0, count).map((user, index) => {
    const rank = index + 1
    const score = generateMockScore(category, rank)
    
    return {
      userId: user.id,
      displayName: user.name,
      avatarUrl: user.avatarUrl,
      rank,
      score,
      formattedScore: formatLeaderboardScore(score, category),
      level: category === 'global_spartan_score' ? getSpartanLevel(score) : undefined,
      badges: generateMockBadges(rank),
      isPro: Math.random() > 0.4,
      isCurrentUser: false,
      lastUpdated: new Date().toISOString(),
    }
  })
}

// =============================================================================
// CURRENT USER DATA
// =============================================================================

function getCurrentUserEntry(category: LeaderboardCategory): LeaderboardEntry {
  const userId = 'current-user'
  let score = 0
  let level: string | undefined
  
  switch (category) {
    case 'global_spartan_score': {
      const spartanScore = calculateSpartanScore()
      score = spartanScore.totalScore
      level = spartanScore.level
      break
    }
    
    case 'consistency': {
      const consistency = calculateConsistencyScore()
      // Use streak days from localStorage if available
      const progressStr = typeof window !== 'undefined' 
        ? localStorage.getItem('spartanlab_progress') 
        : null
      const progress = progressStr ? JSON.parse(progressStr) : null
      score = progress?.currentStreak || consistency.weeklyWorkouts * 2
      break
    }
    
    case 'front_lever':
    case 'planche':
    case 'muscle_up':
    case 'handstand_pushup': {
      const progressions = getSkillProgressions()
      const skill = progressions.find(p => p.skillName === category)
      score = skill?.currentLevel || 0
      level = getSkillLevelLabel(category, score)
      break
    }
    
    case 'weighted_strength': {
      const records = getPersonalRecords()
      const pullUp = records['weighted_pull_up']?.estimatedOneRM || 0
      const dip = records['weighted_dip']?.estimatedOneRM || 0
      score = pullUp + dip
      break
    }
  }
  
  // Get user badges from achievements
  const achievementSummary = getAchievementSummary()
  const badges: LeaderboardBadge[] = []
  if (achievementSummary.unlockedCount >= 10) {
    badges.push({ id: 'dedicated', name: 'Dedicated', tier: 'rare' })
  }
  if (achievementSummary.earnedPoints >= 500) {
    badges.push({ id: 'achiever', name: 'Achiever', tier: 'epic' })
  }
  
  return {
    userId,
    displayName: 'You',
    avatarUrl: undefined,
    rank: 0, // Will be calculated
    score,
    formattedScore: formatLeaderboardScore(score, category),
    level,
    badges,
    isPro: true,
    isCurrentUser: true,
    lastUpdated: new Date().toISOString(),
  }
}

// =============================================================================
// LEADERBOARD GENERATION
// =============================================================================

/**
 * Get leaderboard data for a specific category
 */
export function getLeaderboard(category: LeaderboardCategory): LeaderboardData {
  const config = getCategoryConfig(category)
  if (!config) {
    throw new Error(`Unknown leaderboard category: ${category}`)
  }
  
  // Check cache
  const cache = getCache()
  const cached = cache[category]
  if (cached && Date.now() - cached.cachedAt < CACHE_DURATION_MS) {
    return cached.data
  }
  
  // Generate mock entries
  const mockEntries = generateMockEntries(category)
  
  // Get current user entry
  const currentUser = getCurrentUserEntry(category)
  
  // Insert current user into proper rank position
  const allEntries = [...mockEntries]
  let userRank = allEntries.length + 1
  
  for (let i = 0; i < allEntries.length; i++) {
    if (currentUser.score >= allEntries[i].score) {
      userRank = i + 1
      break
    }
  }
  
  // Update user rank
  currentUser.rank = userRank
  
  // Determine if user appears in top entries
  const TOP_COUNT = 10
  let entries: LeaderboardEntry[]
  let userRankEntry: LeaderboardEntry | undefined
  
  if (userRank <= TOP_COUNT) {
    // Insert user into the list at proper position
    const before = mockEntries.slice(0, userRank - 1)
    const after = mockEntries.slice(userRank - 1).map(e => ({ ...e, rank: e.rank + 1 }))
    entries = [...before, currentUser, ...after].slice(0, TOP_COUNT)
  } else {
    // User not in top entries, show separately
    entries = mockEntries.slice(0, TOP_COUNT)
    userRankEntry = currentUser
  }
  
  const data: LeaderboardData = {
    category,
    categoryConfig: config,
    entries,
    userRank: userRankEntry,
    totalParticipants: mockEntries.length + 1,
    lastUpdated: new Date().toISOString(),
  }
  
  // Cache the result
  setCache(category, data)
  
  return data
}

/**
 * Get multiple leaderboards at once
 */
export function getLeaderboards(categories: LeaderboardCategory[]): Map<LeaderboardCategory, LeaderboardData> {
  const result = new Map<LeaderboardCategory, LeaderboardData>()
  for (const category of categories) {
    result.set(category, getLeaderboard(category))
  }
  return result
}

/**
 * Get user's ranking summary across all leaderboards
 */
export function getUserRankingSummary(): UserRankingSummary {
  const rankings: UserRankingSummary['rankings'] = []
  let bestCategory: LeaderboardCategory | null = null
  let bestPercentile = 100
  
  for (const config of LEADERBOARD_CATEGORIES) {
    const leaderboard = getLeaderboard(config.id)
    const userEntry = leaderboard.userRank || leaderboard.entries.find(e => e.isCurrentUser)
    
    if (userEntry) {
      const percentile = Math.round((userEntry.rank / leaderboard.totalParticipants) * 100)
      rankings.push({
        category: config.id,
        rank: userEntry.rank,
        score: userEntry.score,
        percentile,
      })
      
      if (percentile < bestPercentile) {
        bestPercentile = percentile
        bestCategory = config.id
      }
    }
  }
  
  // Get overall rank from Spartan Score
  const spartanScoreRanking = rankings.find(r => r.category === 'global_spartan_score')
  
  return {
    userId: 'current-user',
    displayName: 'You',
    rankings,
    bestCategory,
    overallRank: spartanScoreRanking?.rank || 0,
  }
}

/**
 * Force refresh leaderboard cache
 */
export function refreshLeaderboard(category: LeaderboardCategory): LeaderboardData {
  if (typeof window !== 'undefined') {
    const cache = getCache()
    delete cache[category]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  }
  return getLeaderboard(category)
}

/**
 * Clear all leaderboard caches
 */
export function clearLeaderboardCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
