// Challenge Definitions
// Centralized challenge system for SpartanLab
// Supports weekly, monthly, and seasonal challenges with tiered progression
// Design philosophy: realistic goals that reward consistency, not absurd volume

export type ChallengeCategory = 'weekly' | 'monthly' | 'seasonal' | 'special'
export type ChallengeGoalType = 'workout_count' | 'rep_total' | 'streak_days' | 'skill_sessions' | 'training_minutes' | 'exercise_count'
export type ChallengeRewardType = 'badge' | 'score_boost' | 'achievement_unlock'
export type SeasonId = 'season_1' | 'season_2' | 'season_3' | 'season_4'

export interface ChallengeReward {
  type: ChallengeRewardType
  value: number // badge id, score boost amount, or achievement id
  label: string
}

export interface ChallengeTier {
  tier: number
  goalValue: number
  reward: ChallengeReward
}

export interface ChallengeDefinition {
  baseId: string
  name: string
  descriptionTemplate: string // Use {goal} placeholder
  category: ChallengeCategory
  goalType: ChallengeGoalType
  tiers: ChallengeTier[]
  icon: 'flame' | 'target' | 'trophy' | 'star' | 'dumbbell' | 'lightning' | 'medal' | 'crown'
}

export interface Challenge {
  id: string
  name: string
  description: string
  category: ChallengeCategory
  startDate: string // ISO date
  endDate: string // ISO date
  goalType: ChallengeGoalType
  goalValue: number
  reward: ChallengeReward
  seasonId?: SeasonId
  icon: 'flame' | 'target' | 'trophy' | 'star' | 'dumbbell' | 'lightning' | 'medal' | 'crown'
  tier?: number
  maxTier?: number
  baseId?: string
}

export interface ChallengeProgress {
  challengeId: string
  currentValue: number
  completed: boolean
  completedAt?: string
  startedAt: string
}

export interface SeasonInfo {
  id: SeasonId
  name: string
  startDate: string
  endDate: string
  theme: string
  badge: string
}

// =============================================================================
// SEASONS
// =============================================================================

export const SEASONS: SeasonInfo[] = [
  {
    id: 'season_1',
    name: 'Season 1: Foundation',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    theme: 'Building the base',
    badge: 'season_1_badge',
  },
  {
    id: 'season_2',
    name: 'Season 2: Rising',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    theme: 'Pushing limits',
    badge: 'season_2_badge',
  },
  {
    id: 'season_3',
    name: 'Season 3: Peak',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    theme: 'Maximum intensity',
    badge: 'season_3_badge',
  },
  {
    id: 'season_4',
    name: 'Season 4: Legacy',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    theme: 'Proving greatness',
    badge: 'season_4_badge',
  },
]

// =============================================================================
// TIERED CHALLENGE DEFINITIONS
// =============================================================================
// Design philosophy: realistic goals that reward consistency, not absurd volume
// Tier targets are designed for normal athletes training 2-5 days/week

const TIERED_CHALLENGES: ChallengeDefinition[] = [
  // ==========================================================================
  // WEEKLY CHALLENGES
  // ==========================================================================
  {
    baseId: 'weekly_warrior',
    name: 'Weekly Warrior',
    descriptionTemplate: 'Complete {goal} workouts this week',
    category: 'weekly',
    goalType: 'workout_count',
    icon: 'flame',
    tiers: [
      { tier: 1, goalValue: 2, reward: { type: 'score_boost', value: 10, label: '+10 Spartan Score' } },
      { tier: 2, goalValue: 3, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 3, goalValue: 4, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 4, goalValue: 5, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
    ],
  },
  {
    baseId: 'rep_crusher',
    name: 'Rep Crusher',
    descriptionTemplate: 'Log {goal} total reps this week',
    category: 'weekly',
    goalType: 'rep_total',
    icon: 'dumbbell',
    tiers: [
      { tier: 1, goalValue: 100, reward: { type: 'score_boost', value: 8, label: '+8 Spartan Score' } },
      { tier: 2, goalValue: 180, reward: { type: 'score_boost', value: 12, label: '+12 Spartan Score' } },
      { tier: 3, goalValue: 260, reward: { type: 'score_boost', value: 18, label: '+18 Spartan Score' } },
      { tier: 4, goalValue: 350, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 5, goalValue: 500, reward: { type: 'badge', value: 1, label: 'Rep Master Badge' } },
    ],
  },
  {
    baseId: 'consistency_king',
    name: 'Consistency King',
    descriptionTemplate: 'Achieve a {goal}-day training streak',
    category: 'weekly',
    goalType: 'streak_days',
    icon: 'lightning',
    tiers: [
      { tier: 1, goalValue: 2, reward: { type: 'score_boost', value: 5, label: '+5 Spartan Score' } },
      { tier: 2, goalValue: 3, reward: { type: 'score_boost', value: 10, label: '+10 Spartan Score' } },
      { tier: 3, goalValue: 5, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 4, goalValue: 7, reward: { type: 'badge', value: 2, label: 'Consistency Badge' } },
      { tier: 5, goalValue: 10, reward: { type: 'badge', value: 3, label: 'Iron Will Badge' } },
    ],
  },
  {
    baseId: 'skill_focus_weekly',
    name: 'Skill Focus',
    descriptionTemplate: 'Complete {goal} skill sessions this week',
    category: 'weekly',
    goalType: 'skill_sessions',
    icon: 'star',
    tiers: [
      { tier: 1, goalValue: 2, reward: { type: 'score_boost', value: 10, label: '+10 Spartan Score' } },
      { tier: 2, goalValue: 4, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 3, goalValue: 6, reward: { type: 'score_boost', value: 30, label: '+30 Spartan Score' } },
    ],
  },
  
  // ==========================================================================
  // MONTHLY CHALLENGES
  // ==========================================================================
  {
    baseId: 'monthly_grinder',
    name: 'Monthly Grinder',
    descriptionTemplate: 'Complete {goal} workouts this month',
    category: 'monthly',
    goalType: 'workout_count',
    icon: 'trophy',
    tiers: [
      { tier: 1, goalValue: 8, reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' } },
      { tier: 2, goalValue: 12, reward: { type: 'score_boost', value: 45, label: '+45 Spartan Score' } },
      { tier: 3, goalValue: 16, reward: { type: 'score_boost', value: 75, label: '+75 Spartan Score' } },
      { tier: 4, goalValue: 20, reward: { type: 'badge', value: 4, label: 'Grinder Badge' } },
    ],
  },
  {
    baseId: 'volume_master',
    name: 'Volume Master',
    descriptionTemplate: 'Log {goal} total reps this month',
    category: 'monthly',
    goalType: 'rep_total',
    icon: 'target',
    tiers: [
      { tier: 1, goalValue: 500, reward: { type: 'score_boost', value: 20, label: '+20 Spartan Score' } },
      { tier: 2, goalValue: 900, reward: { type: 'score_boost', value: 40, label: '+40 Spartan Score' } },
      { tier: 3, goalValue: 1300, reward: { type: 'score_boost', value: 60, label: '+60 Spartan Score' } },
      { tier: 4, goalValue: 1800, reward: { type: 'score_boost', value: 80, label: '+80 Spartan Score' } },
      { tier: 5, goalValue: 2400, reward: { type: 'badge', value: 5, label: 'Volume Champion Badge' } },
    ],
  },
  {
    baseId: 'skill_master',
    name: 'Skill Master',
    descriptionTemplate: 'Complete {goal} skill sessions this month',
    category: 'monthly',
    goalType: 'skill_sessions',
    icon: 'star',
    tiers: [
      { tier: 1, goalValue: 4, reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' } },
      { tier: 2, goalValue: 8, reward: { type: 'score_boost', value: 35, label: '+35 Spartan Score' } },
      { tier: 3, goalValue: 12, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
      { tier: 4, goalValue: 16, reward: { type: 'badge', value: 6, label: 'Skill Master Badge' } },
    ],
  },
]

// =============================================================================
// SEASONAL CHALLENGE DEFINITIONS
// =============================================================================

const SEASONAL_CHALLENGES: ChallengeDefinition[] = [
  {
    baseId: 'seasonal_champion',
    name: 'Season Champion',
    descriptionTemplate: 'Complete {goal} workouts this season',
    category: 'seasonal',
    goalType: 'workout_count',
    icon: 'crown',
    tiers: [
      { tier: 1, goalValue: 24, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
      { tier: 2, goalValue: 40, reward: { type: 'score_boost', value: 100, label: '+100 Spartan Score' } },
      { tier: 3, goalValue: 60, reward: { type: 'badge', value: 10, label: 'Season Champion Badge' } },
    ],
  },
  {
    baseId: 'seasonal_volume',
    name: 'Seasonal Volume',
    descriptionTemplate: 'Log {goal} reps this season',
    category: 'seasonal',
    goalType: 'rep_total',
    icon: 'medal',
    tiers: [
      { tier: 1, goalValue: 2500, reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' } },
      { tier: 2, goalValue: 4000, reward: { type: 'score_boost', value: 100, label: '+100 Spartan Score' } },
      { tier: 3, goalValue: 6000, reward: { type: 'badge', value: 11, label: 'Season Volume Badge' } },
    ],
  },
  {
    baseId: 'seasonal_skill',
    name: 'Skill Season',
    descriptionTemplate: 'Complete {goal} skill sessions this season',
    category: 'seasonal',
    goalType: 'skill_sessions',
    icon: 'star',
    tiers: [
      { tier: 1, goalValue: 10, reward: { type: 'score_boost', value: 40, label: '+40 Spartan Score' } },
      { tier: 2, goalValue: 20, reward: { type: 'score_boost', value: 80, label: '+80 Spartan Score' } },
      { tier: 3, goalValue: 35, reward: { type: 'badge', value: 12, label: 'Skill Season Badge' } },
    ],
  },
  {
    baseId: 'seasonal_streak',
    name: 'Season Streak',
    descriptionTemplate: 'Achieve a {goal}-day streak during the season',
    category: 'seasonal',
    goalType: 'streak_days',
    icon: 'lightning',
    tiers: [
      { tier: 1, goalValue: 7, reward: { type: 'score_boost', value: 30, label: '+30 Spartan Score' } },
      { tier: 2, goalValue: 14, reward: { type: 'score_boost', value: 75, label: '+75 Spartan Score' } },
      { tier: 3, goalValue: 21, reward: { type: 'badge', value: 13, label: 'Unstoppable Badge' } },
    ],
  },
]

// =============================================================================
// DATE HELPERS
// =============================================================================

function getWeekDates(): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
  }
}

function getMonthDates(): { start: string; end: string } {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: endOfMonth.toISOString().split('T')[0],
  }
}

function getCurrentSeason(): SeasonInfo | null {
  const now = new Date().toISOString().split('T')[0]
  return SEASONS.find(s => now >= s.startDate && now <= s.endDate) || null
}

// =============================================================================
// TIER PROGRESS TRACKING
// =============================================================================

const TIER_PROGRESS_KEY = 'spartanlab_tier_progress'

interface TierProgressRecord {
  baseId: string
  periodKey: string // e.g., "weekly_2026-03-15" or "monthly_2026-03"
  completedTier: number
}

function getTierProgressRecords(): TierProgressRecord[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TIER_PROGRESS_KEY)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

function saveTierProgressRecord(record: TierProgressRecord): void {
  if (typeof window === 'undefined') return
  const records = getTierProgressRecords()
  const existingIdx = records.findIndex(
    r => r.baseId === record.baseId && r.periodKey === record.periodKey
  )
  if (existingIdx >= 0) {
    records[existingIdx] = record
  } else {
    records.push(record)
  }
  // Keep only recent records (last 90 days worth)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const filtered = records.filter(r => {
    const datePart = r.periodKey.split('_')[1]
    return new Date(datePart) >= cutoff
  })
  localStorage.setItem(TIER_PROGRESS_KEY, JSON.stringify(filtered))
}

function getCurrentTierForChallenge(baseId: string, periodKey: string): number {
  const records = getTierProgressRecords()
  const record = records.find(r => r.baseId === baseId && r.periodKey === periodKey)
  return record?.completedTier || 0
}

export function markTierCompleted(baseId: string, periodKey: string, tier: number): void {
  const current = getCurrentTierForChallenge(baseId, periodKey)
  if (tier > current) {
    saveTierProgressRecord({ baseId, periodKey, completedTier: tier })
  }
}

// =============================================================================
// ACTIVE CHALLENGES GENERATION
// =============================================================================

/**
 * Generate active challenges with intelligent tier progression
 * Shows the next achievable tier for each challenge type
 */
export function getActiveChallenges(): Challenge[] {
  const week = getWeekDates()
  const month = getMonthDates()
  const season = getCurrentSeason()
  
  const challenges: Challenge[] = []
  
  // Weekly challenges
  const weeklyPeriodKey = `weekly_${week.start}`
  TIERED_CHALLENGES.filter(c => c.category === 'weekly').forEach(def => {
    const completedTier = getCurrentTierForChallenge(def.baseId, weeklyPeriodKey)
    const nextTier = def.tiers.find(t => t.tier > completedTier)
    
    if (nextTier) {
      challenges.push({
        id: `${def.baseId}_t${nextTier.tier}_${week.start}`,
        name: def.name,
        description: def.descriptionTemplate.replace('{goal}', nextTier.goalValue.toLocaleString()),
        category: 'weekly',
        startDate: week.start,
        endDate: week.end,
        goalType: def.goalType,
        goalValue: nextTier.goalValue,
        reward: nextTier.reward,
        icon: def.icon,
        tier: nextTier.tier,
        maxTier: def.tiers.length,
        baseId: def.baseId,
      })
    }
  })
  
  // Monthly challenges
  const monthlyPeriodKey = `monthly_${month.start}`
  TIERED_CHALLENGES.filter(c => c.category === 'monthly').forEach(def => {
    const completedTier = getCurrentTierForChallenge(def.baseId, monthlyPeriodKey)
    const nextTier = def.tiers.find(t => t.tier > completedTier)
    
    if (nextTier) {
      challenges.push({
        id: `${def.baseId}_t${nextTier.tier}_${month.start}`,
        name: def.name,
        description: def.descriptionTemplate.replace('{goal}', nextTier.goalValue.toLocaleString()),
        category: 'monthly',
        startDate: month.start,
        endDate: month.end,
        goalType: def.goalType,
        goalValue: nextTier.goalValue,
        reward: nextTier.reward,
        icon: def.icon,
        tier: nextTier.tier,
        maxTier: def.tiers.length,
        baseId: def.baseId,
      })
    }
  })
  
  // Seasonal challenges
  if (season) {
    const seasonalPeriodKey = `seasonal_${season.id}`
    SEASONAL_CHALLENGES.forEach(def => {
      const completedTier = getCurrentTierForChallenge(def.baseId, seasonalPeriodKey)
      const nextTier = def.tiers.find(t => t.tier > completedTier)
      
      if (nextTier) {
        challenges.push({
          id: `${def.baseId}_t${nextTier.tier}_${season.id}`,
          name: def.name,
          description: def.descriptionTemplate.replace('{goal}', nextTier.goalValue.toLocaleString()),
          category: 'seasonal',
          startDate: season.startDate,
          endDate: season.endDate,
          goalType: def.goalType,
          goalValue: nextTier.goalValue,
          reward: nextTier.reward,
          seasonId: season.id,
          icon: def.icon,
          tier: nextTier.tier,
          maxTier: def.tiers.length,
          baseId: def.baseId,
        })
      }
    })
  }
  
  return challenges
}

/**
 * Get total number of challenges available (including all tiers)
 */
export function getTotalChallengeCount(): number {
  let count = 0
  TIERED_CHALLENGES.forEach(c => count += c.tiers.length)
  SEASONAL_CHALLENGES.forEach(c => count += c.tiers.length)
  return count
}

/**
 * Get period key for a challenge (used for tier tracking)
 */
export function getPeriodKeyForChallenge(challenge: Challenge): string {
  if (challenge.category === 'seasonal' && challenge.seasonId) {
    return `seasonal_${challenge.seasonId}`
  }
  if (challenge.category === 'monthly') {
    return `monthly_${challenge.startDate}`
  }
  return `weekly_${challenge.startDate}`
}

// Get challenge by ID
export function getChallengeById(id: string): Challenge | null {
  return getActiveChallenges().find(c => c.id === id) || null
}

// Get challenges by category
export function getChallengesByCategory(category: ChallengeCategory): Challenge[] {
  return getActiveChallenges().filter(c => c.category === category)
}

// Get current season
export function getCurrentSeasonInfo(): SeasonInfo | null {
  return getCurrentSeason()
}

// Get display name for challenge period
export function getPeriodDisplayName(period: 'weekly' | 'monthly'): string {
  return period === 'weekly' ? 'Weekly' : 'Monthly'
}

// Calculate time remaining for a challenge
export function getChallengeTimeRemaining(challenge: Challenge): { 
  days: number
  hours: number
  label: string
  expired: boolean 
} {
  const now = new Date()
  const end = new Date(challenge.endDate + 'T23:59:59')
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) {
    return { days: 0, hours: 0, label: 'Expired', expired: true }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  let label = ''
  if (days > 0) {
    label = `${days}d ${hours}h left`
  } else if (hours > 0) {
    label = `${hours}h left`
  } else {
    label = 'Less than 1h left'
  }
  
  return { days, hours, label, expired: false }
}

// Category labels for display
export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  seasonal: 'Seasonal',
  special: 'Special Event',
}

// Goal type labels for display
export const GOAL_TYPE_LABELS: Record<ChallengeGoalType, string> = {
  workout_count: 'Workouts',
  rep_total: 'Reps',
  streak_days: 'Day Streak',
  skill_sessions: 'Skill Sessions',
  training_minutes: 'Minutes',
  exercise_count: 'Exercises',
}
