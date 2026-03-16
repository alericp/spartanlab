// H2H (Head-to-Head) Challenge Service
// Comprehensive competitive challenge system with fair matchmaking
// Supports: friend challenges, weekly pools, and fair skill-matched competition

import { calculateSpartanScore } from '../strength-score-engine'
import { getAthleteProfile, getCurrentUser } from '../data-service'
import { getWorkoutLogs } from '../workout-log-service'

// =============================================================================
// TYPES
// =============================================================================

export type H2HChallengeType = 
  | 'pushups_2min'      // Max push-ups in 2 minutes
  | 'pullups_1min'      // Max pull-ups in 60 seconds
  | 'lsit_hold'         // Longest L-sit hold
  | 'max_pullups'       // Max consecutive pull-ups
  | 'max_dips'          // Max consecutive dips
  | 'weekly_score'      // Highest Spartan Score earned this week
  | 'weekly_workouts'   // Most workouts completed this week

export type H2HChallengeStatus = 
  | 'pending'           // Waiting for opponent to accept
  | 'active'            // Both parties accepted, competition ongoing
  | 'completed'         // Results submitted, winner determined
  | 'expired'           // Time limit passed without completion
  | 'declined'          // Opponent declined

export type H2HMatchType = 
  | 'friend'            // Direct challenge to a friend
  | 'weekly_pool'       // Auto-matched weekly competition pool

export interface H2HChallenge {
  id: string
  matchType: H2HMatchType
  challengeType: H2HChallengeType
  
  // Creator info
  creatorId: string
  creatorName: string
  creatorScore?: number
  creatorSubmittedAt?: string
  
  // Opponent info (for friend challenges)
  opponentId?: string
  opponentName?: string
  opponentScore?: number
  opponentSubmittedAt?: string
  
  // Pool info (for weekly pools)
  poolId?: string
  poolTier?: PoolTier
  
  // Timing
  startDate: string
  endDate: string
  createdAt: string
  completedAt?: string
  
  // Result
  status: H2HChallengeStatus
  winnerId?: string
  isDraw?: boolean
  
  // Rewards
  winnerReward: number      // Spartan Score points
  participationReward: number
}

// Weekly pool tiers for fair matchmaking
export type PoolTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface WeeklyPool {
  id: string
  weekStart: string
  tier: PoolTier
  challengeType: H2HChallengeType
  participants: PoolParticipant[]
  status: 'active' | 'completed'
}

export interface PoolParticipant {
  userId: string
  userName: string
  spartanScore: number  // Score at time of joining
  weeklyScore: number   // Score earned this week (for weekly_score type)
  currentValue: number  // Current challenge value
  submittedAt?: string
  rank?: number
}

// Friend system (minimal)
export interface Friend {
  friendId: string
  friendName: string
  addedAt: string
}

// Challenge type configurations
export const H2H_CHALLENGE_CONFIGS: Record<H2HChallengeType, {
  name: string
  shortName: string
  description: string
  metric: string
  unit: string
  timeLimit?: number  // seconds
  winnerReward: number
  participationReward: number
  poolEligible: boolean
}> = {
  pushups_2min: {
    name: '2-Minute Push-Up Battle',
    shortName: 'Push-Ups',
    description: 'Most push-ups in 2 minutes wins',
    metric: 'push-ups',
    unit: 'reps',
    timeLimit: 120,
    winnerReward: 25,
    participationReward: 5,
    poolEligible: true,
  },
  pullups_1min: {
    name: '1-Minute Pull-Up Battle',
    shortName: 'Pull-Ups',
    description: 'Most pull-ups in 60 seconds wins',
    metric: 'pull-ups',
    unit: 'reps',
    timeLimit: 60,
    winnerReward: 25,
    participationReward: 5,
    poolEligible: true,
  },
  lsit_hold: {
    name: 'L-Sit Hold Challenge',
    shortName: 'L-Sit',
    description: 'Longest L-Sit hold wins',
    metric: 'hold time',
    unit: 'seconds',
    winnerReward: 20,
    participationReward: 5,
    poolEligible: true,
  },
  max_pullups: {
    name: 'Max Pull-Ups',
    shortName: 'Max Pull-Ups',
    description: 'Most consecutive pull-ups wins',
    metric: 'pull-ups',
    unit: 'reps',
    winnerReward: 20,
    participationReward: 5,
    poolEligible: true,
  },
  max_dips: {
    name: 'Max Dips',
    shortName: 'Max Dips',
    description: 'Most consecutive dips wins',
    metric: 'dips',
    unit: 'reps',
    winnerReward: 20,
    participationReward: 5,
    poolEligible: true,
  },
  weekly_score: {
    name: 'Weekly Score Race',
    shortName: 'Weekly Score',
    description: 'Highest Spartan Score earned this week wins',
    metric: 'score',
    unit: 'pts',
    winnerReward: 30,
    participationReward: 10,
    poolEligible: true,
  },
  weekly_workouts: {
    name: 'Weekly Workout Count',
    shortName: 'Workouts',
    description: 'Most workouts completed this week wins',
    metric: 'workouts',
    unit: 'sessions',
    winnerReward: 25,
    participationReward: 8,
    poolEligible: true,
  },
}

// Pool tier thresholds based on Spartan Score
export const POOL_TIER_THRESHOLDS: Record<PoolTier, { min: number; max: number; label: string }> = {
  bronze: { min: 0, max: 199, label: 'Bronze (0-199)' },
  silver: { min: 200, max: 399, label: 'Silver (200-399)' },
  gold: { min: 400, max: 599, label: 'Gold (400-599)' },
  platinum: { min: 600, max: 799, label: 'Platinum (600-799)' },
  diamond: { min: 800, max: 1000, label: 'Diamond (800+)' },
}

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEYS = {
  challenges: 'spartanlab_h2h_challenges_v2',
  pools: 'spartanlab_h2h_pools',
  friends: 'spartanlab_friends',
  poolHistory: 'spartanlab_pool_history',
  h2hRewards: 'spartanlab_h2h_rewards',
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Challenges
export function getH2HChallenges(): H2HChallenge[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(STORAGE_KEYS.challenges)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

function saveH2HChallenges(challenges: H2HChallenge[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEYS.challenges, JSON.stringify(challenges))
}

// Pools
export function getWeeklyPools(): WeeklyPool[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(STORAGE_KEYS.pools)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

function saveWeeklyPools(pools: WeeklyPool[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEYS.pools, JSON.stringify(pools))
}

// Friends
export function getFriends(): Friend[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(STORAGE_KEYS.friends)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

function saveFriends(friends: Friend[]): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEYS.friends, JSON.stringify(friends))
}

// H2H Rewards tracking
interface H2HRewardRecord {
  challengeId: string
  reward: number
  type: 'win' | 'participation' | 'pool_win' | 'pool_participation'
  earnedAt: string
}

export function getH2HRewards(): H2HRewardRecord[] {
  if (!isBrowser()) return []
  const stored = localStorage.getItem(STORAGE_KEYS.h2hRewards)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

function saveH2HReward(record: H2HRewardRecord): void {
  if (!isBrowser()) return
  const rewards = getH2HRewards()
  rewards.push(record)
  localStorage.setItem(STORAGE_KEYS.h2hRewards, JSON.stringify(rewards))
}

export function getTotalH2HRewards(): number {
  return getH2HRewards().reduce((sum, r) => sum + r.reward, 0)
}

// =============================================================================
// DATE HELPERS
// =============================================================================

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1 // Monday is day 1
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diff,
    0, 0, 0, 0
  ))
}

function getWeekEnd(): Date {
  const start = getWeekStart()
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function getCurrentWeekKey(): string {
  return getWeekStart().toISOString().split('T')[0]
}

// =============================================================================
// MATCHMAKING / FAIRNESS
// =============================================================================

// Determine pool tier based on Spartan Score
export function getPoolTierForScore(score: number): PoolTier {
  if (score >= POOL_TIER_THRESHOLDS.diamond.min) return 'diamond'
  if (score >= POOL_TIER_THRESHOLDS.platinum.min) return 'platinum'
  if (score >= POOL_TIER_THRESHOLDS.gold.min) return 'gold'
  if (score >= POOL_TIER_THRESHOLDS.silver.min) return 'silver'
  return 'bronze'
}

// Get user's current matchmaking data
function getUserMatchmakingData(): {
  userId: string
  userName: string
  spartanScore: number
  tier: PoolTier
  recentWorkouts: number
  experienceLevel: string
} {
  const user = getCurrentUser()
  const profile = getAthleteProfile()
  const scoreData = calculateSpartanScore()
  
  // Count workouts in last 30 days for activity level
  const logs = getWorkoutLogs()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentWorkouts = logs.filter(l => new Date(l.sessionDate) >= thirtyDaysAgo).length
  
  return {
    userId: user.id,
    userName: user.username || 'Athlete',
    spartanScore: scoreData.totalScore,
    tier: getPoolTierForScore(scoreData.totalScore),
    recentWorkouts,
    experienceLevel: profile?.experienceLevel || 'intermediate',
  }
}

// =============================================================================
// FRIEND CHALLENGES
// =============================================================================

export function addFriend(friendId: string, friendName: string): Friend {
  const friends = getFriends()
  
  // Check if already added
  if (friends.some(f => f.friendId === friendId)) {
    return friends.find(f => f.friendId === friendId)!
  }
  
  const friend: Friend = {
    friendId,
    friendName,
    addedAt: new Date().toISOString(),
  }
  
  friends.push(friend)
  saveFriends(friends)
  return friend
}

export function removeFriend(friendId: string): void {
  const friends = getFriends().filter(f => f.friendId !== friendId)
  saveFriends(friends)
}

export function createFriendChallenge(
  opponentId: string,
  opponentName: string,
  challengeType: H2HChallengeType
): H2HChallenge {
  const user = getUserMatchmakingData()
  const config = H2H_CHALLENGE_CONFIGS[challengeType]
  
  const now = new Date()
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const challenge: H2HChallenge = {
    id: `h2h_friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    matchType: 'friend',
    challengeType,
    creatorId: user.userId,
    creatorName: user.userName,
    opponentId,
    opponentName,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    createdAt: now.toISOString(),
    status: 'pending',
    winnerReward: config.winnerReward,
    participationReward: config.participationReward,
  }
  
  const challenges = getH2HChallenges()
  challenges.push(challenge)
  saveH2HChallenges(challenges)
  
  return challenge
}

export function acceptFriendChallenge(challengeId: string): H2HChallenge | null {
  const challenges = getH2HChallenges()
  const idx = challenges.findIndex(c => c.id === challengeId)
  if (idx === -1) return null
  
  challenges[idx].status = 'active'
  saveH2HChallenges(challenges)
  
  return challenges[idx]
}

export function declineFriendChallenge(challengeId: string): H2HChallenge | null {
  const challenges = getH2HChallenges()
  const idx = challenges.findIndex(c => c.id === challengeId)
  if (idx === -1) return null
  
  challenges[idx].status = 'declined'
  saveH2HChallenges(challenges)
  
  return challenges[idx]
}

export function submitChallengeResult(
  challengeId: string,
  score: number
): H2HChallenge | null {
  const user = getCurrentUser()
  const challenges = getH2HChallenges()
  const idx = challenges.findIndex(c => c.id === challengeId)
  if (idx === -1) return null
  
  const challenge = challenges[idx]
  
  // Determine if user is creator or opponent
  if (user.id === challenge.creatorId) {
    challenge.creatorScore = score
    challenge.creatorSubmittedAt = new Date().toISOString()
  } else if (user.id === challenge.opponentId) {
    challenge.opponentScore = score
    challenge.opponentSubmittedAt = new Date().toISOString()
  }
  
  // Check if both have submitted
  if (challenge.creatorScore !== undefined && challenge.opponentScore !== undefined) {
    challenge.status = 'completed'
    challenge.completedAt = new Date().toISOString()
    
    // Determine winner
    if (challenge.creatorScore > challenge.opponentScore) {
      challenge.winnerId = challenge.creatorId
    } else if (challenge.opponentScore > challenge.creatorScore) {
      challenge.winnerId = challenge.opponentId
    } else {
      challenge.isDraw = true
    }
    
    // Award rewards
    awardChallengeRewards(challenge, user.id)
  }
  
  saveH2HChallenges(challenges)
  return challenges[idx]
}

function awardChallengeRewards(challenge: H2HChallenge, userId: string): void {
  const isWinner = challenge.winnerId === userId
  const isDraw = challenge.isDraw
  
  let reward = challenge.participationReward
  let type: H2HRewardRecord['type'] = 'participation'
  
  if (isWinner) {
    reward = challenge.winnerReward
    type = 'win'
  } else if (isDraw) {
    // Split winner reward for draws
    reward = Math.floor(challenge.winnerReward / 2)
    type = 'participation'
  }
  
  saveH2HReward({
    challengeId: challenge.id,
    reward,
    type,
    earnedAt: new Date().toISOString(),
  })
}

// =============================================================================
// WEEKLY POOLS
// =============================================================================

export function getOrCreateWeeklyPool(challengeType: H2HChallengeType): WeeklyPool | null {
  const user = getUserMatchmakingData()
  const weekKey = getCurrentWeekKey()
  const pools = getWeeklyPools()
  
  // Find existing pool for this tier and challenge type this week
  let pool = pools.find(p => 
    p.weekStart === weekKey && 
    p.tier === user.tier && 
    p.challengeType === challengeType &&
    p.status === 'active'
  )
  
  if (!pool) {
    // Create new pool
    pool = {
      id: `pool_${weekKey}_${user.tier}_${challengeType}_${Math.random().toString(36).substr(2, 6)}`,
      weekStart: weekKey,
      tier: user.tier,
      challengeType,
      participants: [],
      status: 'active',
    }
    pools.push(pool)
  }
  
  // Check if user is already in pool
  if (!pool.participants.some(p => p.userId === user.userId)) {
    pool.participants.push({
      userId: user.userId,
      userName: user.userName,
      spartanScore: user.spartanScore,
      weeklyScore: 0,
      currentValue: 0,
    })
    saveWeeklyPools(pools)
  }
  
  return pool
}

export function joinWeeklyPool(challengeType: H2HChallengeType): WeeklyPool | null {
  return getOrCreateWeeklyPool(challengeType)
}

export function updatePoolScore(
  poolId: string,
  score: number
): WeeklyPool | null {
  const user = getCurrentUser()
  const pools = getWeeklyPools()
  const pool = pools.find(p => p.id === poolId)
  
  if (!pool) return null
  
  const participant = pool.participants.find(p => p.userId === user.id)
  if (!participant) return null
  
  // Update score (take best score)
  if (score > participant.currentValue) {
    participant.currentValue = score
    participant.submittedAt = new Date().toISOString()
  }
  
  // Recalculate ranks
  const sorted = [...pool.participants]
    .filter(p => p.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
  
  sorted.forEach((p, idx) => {
    const original = pool.participants.find(op => op.userId === p.userId)
    if (original) original.rank = idx + 1
  })
  
  saveWeeklyPools(pools)
  return pool
}

export function getMyWeeklyPools(): WeeklyPool[] {
  const user = getCurrentUser()
  const weekKey = getCurrentWeekKey()
  
  return getWeeklyPools().filter(p => 
    p.weekStart === weekKey &&
    p.participants.some(part => part.userId === user.id)
  )
}

export function getPoolStandings(poolId: string): PoolParticipant[] {
  const pool = getWeeklyPools().find(p => p.id === poolId)
  if (!pool) return []
  
  return [...pool.participants]
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((p, idx) => ({ ...p, rank: idx + 1 }))
}

// =============================================================================
// WEEKLY RESET
// =============================================================================

export function processWeeklyReset(): void {
  if (!isBrowser()) return
  
  const pools = getWeeklyPools()
  const currentWeek = getCurrentWeekKey()
  const user = getCurrentUser()
  
  // Complete old pools and award rewards
  pools.forEach(pool => {
    if (pool.weekStart !== currentWeek && pool.status === 'active') {
      pool.status = 'completed'
      
      // Award pool rewards
      const standings = getPoolStandings(pool.id)
      const userStanding = standings.find(s => s.userId === user.id)
      
      if (userStanding && userStanding.currentValue > 0) {
        const config = H2H_CHALLENGE_CONFIGS[pool.challengeType]
        const reward = userStanding.rank === 1 
          ? config.winnerReward
          : config.participationReward
        
        saveH2HReward({
          challengeId: pool.id,
          reward,
          type: userStanding.rank === 1 ? 'pool_win' : 'pool_participation',
          earnedAt: new Date().toISOString(),
        })
      }
    }
  })
  
  // Clean up old pools (keep last 4 weeks)
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
  const cutoffKey = fourWeeksAgo.toISOString().split('T')[0]
  
  const filteredPools = pools.filter(p => p.weekStart >= cutoffKey)
  saveWeeklyPools(filteredPools)
  
  // Expire old friend challenges
  const challenges = getH2HChallenges()
  const now = new Date().toISOString()
  
  challenges.forEach(c => {
    if ((c.status === 'pending' || c.status === 'active') && c.endDate < now) {
      c.status = 'expired'
    }
  })
  
  saveH2HChallenges(challenges)
}

// =============================================================================
// QUERIES
// =============================================================================

export function getMyActiveChallenges(): H2HChallenge[] {
  const user = getCurrentUser()
  
  return getH2HChallenges().filter(c => 
    (c.creatorId === user.id || c.opponentId === user.id) &&
    (c.status === 'pending' || c.status === 'active')
  )
}

export function getPendingChallengesForMe(): H2HChallenge[] {
  const user = getCurrentUser()
  
  return getH2HChallenges().filter(c => 
    c.opponentId === user.id &&
    c.status === 'pending'
  )
}

export function getCompletedChallenges(): H2HChallenge[] {
  const user = getCurrentUser()
  
  return getH2HChallenges()
    .filter(c => 
      (c.creatorId === user.id || c.opponentId === user.id) &&
      c.status === 'completed'
    )
    .sort((a, b) => 
      new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    )
    .slice(0, 10) // Last 10
}

export function getH2HStats(): {
  totalChallenges: number
  wins: number
  losses: number
  draws: number
  winRate: number
  totalRewards: number
  currentPoolRank: number | null
} {
  const user = getCurrentUser()
  const challenges = getH2HChallenges().filter(c => 
    (c.creatorId === user.id || c.opponentId === user.id) &&
    c.status === 'completed'
  )
  
  let wins = 0
  let losses = 0
  let draws = 0
  
  challenges.forEach(c => {
    if (c.isDraw) {
      draws++
    } else if (c.winnerId === user.id) {
      wins++
    } else {
      losses++
    }
  })
  
  const total = wins + losses + draws
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  
  // Current pool rank
  const myPools = getMyWeeklyPools()
  let currentPoolRank: number | null = null
  if (myPools.length > 0) {
    const standings = getPoolStandings(myPools[0].id)
    const me = standings.find(s => s.userId === user.id)
    if (me) currentPoolRank = me.rank || null
  }
  
  return {
    totalChallenges: total,
    wins,
    losses,
    draws,
    winRate,
    totalRewards: getTotalH2HRewards(),
    currentPoolRank,
  }
}

// Available challenge types for UI
export function getAvailableChallengeTypes(): Array<{
  type: H2HChallengeType
  config: typeof H2H_CHALLENGE_CONFIGS[H2HChallengeType]
}> {
  return Object.entries(H2H_CHALLENGE_CONFIGS).map(([type, config]) => ({
    type: type as H2HChallengeType,
    config,
  }))
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getCurrentWeekKey,
  getWeekStart,
  getWeekEnd,
}
