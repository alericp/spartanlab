// Challenge Definitions
// Centralized challenge system for SpartanLab
// Supports weekly, monthly, and seasonal challenges

export type ChallengeCategory = 'weekly' | 'monthly' | 'seasonal' | 'special'
export type ChallengeGoalType = 'workout_count' | 'rep_total' | 'streak_days' | 'skill_sessions' | 'training_minutes' | 'exercise_count'
export type ChallengeRewardType = 'badge' | 'score_boost' | 'achievement_unlock'
export type SeasonId = 'season_1' | 'season_2' | 'season_3' | 'season_4'

export interface ChallengeReward {
  type: ChallengeRewardType
  value: number // badge id, score boost amount, or achievement id
  label: string
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
// CHALLENGE DEFINITIONS
// =============================================================================

// Helper to get current week/month dates
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

// Generate dynamic challenges based on current date
export function getActiveChallenges(): Challenge[] {
  const week = getWeekDates()
  const month = getMonthDates()
  const season = getCurrentSeason()
  
  const challenges: Challenge[] = [
    // Weekly Challenges
    {
      id: `weekly_workouts_${week.start}`,
      name: 'Weekly Warrior',
      description: 'Complete 4 workouts this week',
      category: 'weekly',
      startDate: week.start,
      endDate: week.end,
      goalType: 'workout_count',
      goalValue: 4,
      reward: { type: 'score_boost', value: 25, label: '+25 Spartan Score' },
      icon: 'flame',
    },
    {
      id: `weekly_reps_${week.start}`,
      name: 'Rep Crusher',
      description: 'Log 200 total reps this week',
      category: 'weekly',
      startDate: week.start,
      endDate: week.end,
      goalType: 'rep_total',
      goalValue: 200,
      reward: { type: 'score_boost', value: 15, label: '+15 Spartan Score' },
      icon: 'dumbbell',
    },
    {
      id: `weekly_streak_${week.start}`,
      name: 'Consistency King',
      description: 'Train 5 days in a row this week',
      category: 'weekly',
      startDate: week.start,
      endDate: week.end,
      goalType: 'streak_days',
      goalValue: 5,
      reward: { type: 'badge', value: 1, label: 'Consistency Badge' },
      icon: 'lightning',
    },
    
    // Monthly Challenges
    {
      id: `monthly_workouts_${month.start}`,
      name: 'Monthly Grinder',
      description: 'Complete 16 workouts this month',
      category: 'monthly',
      startDate: month.start,
      endDate: month.end,
      goalType: 'workout_count',
      goalValue: 16,
      reward: { type: 'score_boost', value: 75, label: '+75 Spartan Score' },
      icon: 'trophy',
    },
    {
      id: `monthly_reps_${month.start}`,
      name: 'Volume Master',
      description: 'Log 1,000 total reps this month',
      category: 'monthly',
      startDate: month.start,
      endDate: month.end,
      goalType: 'rep_total',
      goalValue: 1000,
      reward: { type: 'badge', value: 2, label: 'Volume Badge' },
      icon: 'target',
    },
    {
      id: `monthly_skill_${month.start}`,
      name: 'Skill Focus',
      description: 'Complete 8 skill training sessions this month',
      category: 'monthly',
      startDate: month.start,
      endDate: month.end,
      goalType: 'skill_sessions',
      goalValue: 8,
      reward: { type: 'score_boost', value: 50, label: '+50 Spartan Score' },
      icon: 'star',
    },
  ]
  
  // Add seasonal challenge if in an active season
  if (season) {
    challenges.push({
      id: `seasonal_${season.id}`,
      name: `${season.name.split(':')[0]} Champion`,
      description: `Complete 50 workouts during ${season.name.split(':')[0]}`,
      category: 'seasonal',
      startDate: season.startDate,
      endDate: season.endDate,
      goalType: 'workout_count',
      goalValue: 50,
      reward: { type: 'badge', value: 10, label: `${season.name.split(':')[0]} Medal` },
      seasonId: season.id,
      icon: 'crown',
    })
    
    challenges.push({
      id: `seasonal_reps_${season.id}`,
      name: 'Seasonal Volume',
      description: `Log 5,000 reps during ${season.name.split(':')[0]}`,
      category: 'seasonal',
      startDate: season.startDate,
      endDate: season.endDate,
      goalType: 'rep_total',
      goalValue: 5000,
      reward: { type: 'score_boost', value: 150, label: '+150 Spartan Score' },
      seasonId: season.id,
      icon: 'medal',
    })
  }
  
  return challenges
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
