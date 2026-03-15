/**
 * SpartanLab Challenge Definitions
 * 
 * Centralized challenge registry for structured training competitions.
 * Supports weekly, monthly, and seasonal challenges.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ChallengeCategory = 
  | 'consistency'
  | 'volume'
  | 'strength'
  | 'skill'

export type ChallengePeriod = 'weekly' | 'monthly' | 'seasonal'

export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'expired'

export type ChallengeGoalType = 
  | 'workout_count'
  | 'rep_total'
  | 'skill_sessions'
  | 'streak_days'
  | 'exercise_volume'

export interface ChallengeReward {
  /** Badge ID to unlock on completion */
  badgeId: string
  /** Points to add to Spartan Score */
  pointBonus: number
  /** Display name for the reward */
  rewardName: string
}

export interface ChallengeDefinition {
  id: string
  name: string
  description: string
  category: ChallengeCategory
  period: ChallengePeriod
  /** ISO date string */
  startDate: string
  /** ISO date string */
  endDate: string
  /** What we're counting */
  goalType: ChallengeGoalType
  /** Target value to reach */
  goalValue: number
  /** Optional: specific exercise or skill to target */
  targetExercise?: string
  /** Reward for completion */
  reward: ChallengeReward
  /** Season ID if part of a seasonal competition */
  seasonId?: string
  /** Icon for display */
  icon: 'flame' | 'trophy' | 'target' | 'zap' | 'dumbbell' | 'star'
}

export interface UserChallengeProgress {
  challengeId: string
  userId: string
  currentValue: number
  goalValue: number
  startedAt: string
  completedAt?: string
  lastUpdated: string
}

export interface Season {
  id: string
  name: string
  displayName: string
  startDate: string
  endDate: string
  description: string
  /** Challenges included in this season */
  challengeIds: string[]
  /** Season badge for completing all challenges */
  completionBadgeId: string
}

// =============================================================================
// SEASONS
// =============================================================================

export const SEASONS: Season[] = [
  {
    id: 'season_1_2026',
    name: 'Season 1',
    displayName: 'Spartan Season 1: Foundation',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    description: 'Build your foundation with consistency and strength challenges.',
    challengeIds: [
      'weekly_warrior_s1w1',
      'weekly_warrior_s1w2',
      'monthly_volume_jan',
      'monthly_consistency_feb',
      'seasonal_strength_s1',
    ],
    completionBadgeId: 'season_1_champion',
  },
  {
    id: 'season_2_2026',
    name: 'Season 2',
    displayName: 'Spartan Season 2: Progression',
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    description: 'Push your limits with skill and progression challenges.',
    challengeIds: [],
    completionBadgeId: 'season_2_champion',
  },
]

// =============================================================================
// CHALLENGE REGISTRY
// =============================================================================

// Helper to get current week/month boundaries
function getCurrentWeekBounds(): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  return {
    start: startOfWeek.toISOString(),
    end: endOfWeek.toISOString(),
  }
}

function getCurrentMonthBounds(): { start: string; end: string } {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  
  return {
    start: startOfMonth.toISOString(),
    end: endOfMonth.toISOString(),
  }
}

// Dynamic challenges that reset each period
export function getActiveChallenges(): ChallengeDefinition[] {
  const weekBounds = getCurrentWeekBounds()
  const monthBounds = getCurrentMonthBounds()
  
  // Build weekly challenge ID based on current week
  const weekNum = Math.ceil((new Date().getTime() - new Date('2026-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))
  const monthName = new Date().toLocaleString('en-US', { month: 'short' }).toLowerCase()
  
  const challenges: ChallengeDefinition[] = [
    // ===========================================
    // WEEKLY CHALLENGES
    // ===========================================
    {
      id: `weekly_workouts_w${weekNum}`,
      name: 'Weekly Warrior',
      description: 'Complete 4 workouts this week',
      category: 'consistency',
      period: 'weekly',
      startDate: weekBounds.start,
      endDate: weekBounds.end,
      goalType: 'workout_count',
      goalValue: 4,
      reward: {
        badgeId: 'weekly_warrior',
        pointBonus: 25,
        rewardName: 'Weekly Warrior Badge',
      },
      icon: 'flame',
    },
    {
      id: `weekly_volume_w${weekNum}`,
      name: 'Volume Week',
      description: 'Log 300 total reps this week',
      category: 'volume',
      period: 'weekly',
      startDate: weekBounds.start,
      endDate: weekBounds.end,
      goalType: 'rep_total',
      goalValue: 300,
      reward: {
        badgeId: 'volume_week',
        pointBonus: 30,
        rewardName: 'Volume Badge',
      },
      icon: 'target',
    },
    {
      id: `weekly_skill_w${weekNum}`,
      name: 'Skill Focus',
      description: 'Complete 3 skill training sessions',
      category: 'skill',
      period: 'weekly',
      startDate: weekBounds.start,
      endDate: weekBounds.end,
      goalType: 'skill_sessions',
      goalValue: 3,
      reward: {
        badgeId: 'skill_focus',
        pointBonus: 25,
        rewardName: 'Skill Focus Badge',
      },
      icon: 'star',
    },
    
    // ===========================================
    // MONTHLY CHALLENGES
    // ===========================================
    {
      id: `monthly_consistency_${monthName}`,
      name: 'Monthly Discipline',
      description: 'Train at least 16 days this month',
      category: 'consistency',
      period: 'monthly',
      startDate: monthBounds.start,
      endDate: monthBounds.end,
      goalType: 'workout_count',
      goalValue: 16,
      reward: {
        badgeId: 'monthly_discipline',
        pointBonus: 100,
        rewardName: 'Discipline Medal',
      },
      icon: 'trophy',
    },
    {
      id: `monthly_volume_${monthName}`,
      name: 'Volume Champion',
      description: 'Log 2,000 total reps this month',
      category: 'volume',
      period: 'monthly',
      startDate: monthBounds.start,
      endDate: monthBounds.end,
      goalType: 'rep_total',
      goalValue: 2000,
      reward: {
        badgeId: 'volume_champion',
        pointBonus: 150,
        rewardName: 'Volume Champion Medal',
      },
      icon: 'dumbbell',
    },
    {
      id: `monthly_streak_${monthName}`,
      name: 'Streak Master',
      description: 'Achieve a 14-day training streak',
      category: 'consistency',
      period: 'monthly',
      startDate: monthBounds.start,
      endDate: monthBounds.end,
      goalType: 'streak_days',
      goalValue: 14,
      reward: {
        badgeId: 'streak_master',
        pointBonus: 125,
        rewardName: 'Streak Master Medal',
      },
      icon: 'flame',
    },
  ]
  
  return challenges
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get challenge by ID
 */
export function getChallengeById(id: string): ChallengeDefinition | undefined {
  const challenges = getActiveChallenges()
  return challenges.find(c => c.id === id)
}

/**
 * Get challenges by period type
 */
export function getChallengesByPeriod(period: ChallengePeriod): ChallengeDefinition[] {
  return getActiveChallenges().filter(c => c.period === period)
}

/**
 * Get current season
 */
export function getCurrentSeason(): Season | undefined {
  const now = new Date().toISOString()
  return SEASONS.find(s => s.startDate <= now && s.endDate >= now)
}

/**
 * Get season by ID
 */
export function getSeasonById(id: string): Season | undefined {
  return SEASONS.find(s => s.id === id)
}

/**
 * Get challenge status based on dates
 */
export function getChallengeStatus(challenge: ChallengeDefinition): ChallengeStatus {
  const now = new Date().toISOString()
  
  if (now < challenge.startDate) return 'upcoming'
  if (now > challenge.endDate) return 'expired'
  return 'active'
}

/**
 * Calculate time remaining for a challenge
 */
export function getTimeRemaining(challenge: ChallengeDefinition): {
  days: number
  hours: number
  minutes: number
  expired: boolean
} {
  const now = new Date().getTime()
  const end = new Date(challenge.endDate).getTime()
  const diff = end - now
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes, expired: false }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: ChallengeCategory): string {
  const names: Record<ChallengeCategory, string> = {
    consistency: 'Consistency',
    volume: 'Volume',
    strength: 'Strength',
    skill: 'Skill',
  }
  return names[category]
}

/**
 * Get period display name
 */
export function getPeriodDisplayName(period: ChallengePeriod): string {
  const names: Record<ChallengePeriod, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    seasonal: 'Season',
  }
  return names[period]
}
