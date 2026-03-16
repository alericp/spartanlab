// Leaderboard Type Definitions
// Centralized types for the SpartanLab leaderboard system

// Time scope for fair competition - beginners can compete weekly/monthly
export type LeaderboardTimeScope = 'weekly' | 'monthly' | 'all_time'

export type LeaderboardCategory = 
  | 'global_spartan_score'
  | 'consistency'
  | 'front_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand_push_up'

export interface LeaderboardEntry {
  userId: string
  displayName: string
  avatar?: string | null
  rank: number
  score: number
  scoreLabel: string // Human-readable score (e.g., "847 pts", "21 days", "Advanced")
  formattedScore?: string // Alias for scoreLabel
  level?: string // Optional level classification
  achievementCount?: number
  subscriptionTier?: 'free' | 'pro' | 'elite'
  isCurrentUser?: boolean
  isPro?: boolean // Whether user has pro subscription
  badges?: Array<{ id: string; name: string; tier: 'legendary' | 'epic' | 'rare' | 'common' }>
  streakDays?: number // Current streak for display
}

export interface LeaderboardMetadata {
  category: LeaderboardCategory
  title: string
  description: string
  scoreUnit: string
  icon: 'trophy' | 'flame' | 'target' | 'dumbbell' | 'crown' | 'star'
  sortDirection: 'desc' | 'asc'
}

export interface LeaderboardData {
  metadata: LeaderboardMetadata
  entries: LeaderboardEntry[]
  userPosition?: LeaderboardEntry | null
  totalParticipants: number
  lastUpdated: string
  // Flag indicating this is early-access mode (not enough real users for rankings)
  isEarlyAccess?: boolean
  // Time scope for this leaderboard data
  timeScope?: LeaderboardTimeScope
  // When the scope resets (for weekly/monthly)
  scopeResetDate?: string
}

// Time scope configuration
export interface TimeScopeConfig {
  id: LeaderboardTimeScope
  label: string
  shortLabel: string
  description: string
}

export const TIME_SCOPE_CONFIGS: Record<LeaderboardTimeScope, TimeScopeConfig> = {
  weekly: {
    id: 'weekly',
    label: 'Weekly',
    shortLabel: 'Week',
    description: 'Score earned this week (resets Monday)',
  },
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    shortLabel: 'Month',
    description: 'Score earned this month',
  },
  all_time: {
    id: 'all_time',
    label: 'All-Time',
    shortLabel: 'All',
    description: 'Total accumulated Spartan Score',
  },
}

// Leaderboard category metadata
export const LEADERBOARD_CATEGORIES: Record<LeaderboardCategory, LeaderboardMetadata> = {
  global_spartan_score: {
    category: 'global_spartan_score',
    title: 'Spartan Score',
    description: 'Overall performance ranking combining strength, skill, consistency, and achievements',
    scoreUnit: 'pts',
    icon: 'trophy',
    sortDirection: 'desc',
  },
  consistency: {
    category: 'consistency',
    title: 'Consistency',
    description: 'Training streak and workout frequency',
    scoreUnit: 'days',
    icon: 'flame',
    sortDirection: 'desc',
  },
  front_lever: {
    category: 'front_lever',
    title: 'Front Lever',
    description: 'Front lever progression ranking',
    scoreUnit: 'level',
    icon: 'target',
    sortDirection: 'desc',
  },
  planche: {
    category: 'planche',
    title: 'Planche',
    description: 'Planche progression ranking',
    scoreUnit: 'level',
    icon: 'target',
    sortDirection: 'desc',
  },
  muscle_up: {
    category: 'muscle_up',
    title: 'Muscle-Up',
    description: 'Muscle-up progression ranking',
    scoreUnit: 'level',
    icon: 'dumbbell',
    sortDirection: 'desc',
  },
  handstand_push_up: {
    category: 'handstand_push_up',
    title: 'HSPU',
    description: 'Handstand push-up progression ranking',
    scoreUnit: 'level',
    icon: 'star',
    sortDirection: 'desc',
  },
}

// Category config with labels for UI
export interface CategoryConfig extends LeaderboardMetadata {
  label: string
  shortLabel: string
}

export const CATEGORY_CONFIGS: Record<LeaderboardCategory, CategoryConfig> = {
  global_spartan_score: {
    ...LEADERBOARD_CATEGORIES.global_spartan_score,
    label: 'Spartan Score',
    shortLabel: 'Score',
  },
  consistency: {
    ...LEADERBOARD_CATEGORIES.consistency,
    label: 'Consistency',
    shortLabel: 'Streak',
  },
  front_lever: {
    ...LEADERBOARD_CATEGORIES.front_lever,
    label: 'Front Lever',
    shortLabel: 'FL',
  },
  planche: {
    ...LEADERBOARD_CATEGORIES.planche,
    label: 'Planche',
    shortLabel: 'PL',
  },
  muscle_up: {
    ...LEADERBOARD_CATEGORIES.muscle_up,
    label: 'Muscle-Up',
    shortLabel: 'MU',
  },
  handstand_push_up: {
    ...LEADERBOARD_CATEGORIES.handstand_push_up,
    label: 'HSPU',
    shortLabel: 'HSPU',
  },
}

// Helper to get category config
export function getCategoryConfig(category: LeaderboardCategory): CategoryConfig | undefined {
  return CATEGORY_CONFIGS[category]
}

// Skill level names for display
export const SKILL_LEVEL_NAMES: Record<string, Record<number, string>> = {
  planche: {
    0: 'Tuck',
    1: 'Advanced Tuck',
    2: 'Straddle',
    3: 'Full',
    4: 'Maltese',
  },
  front_lever: {
    0: 'Tuck',
    1: 'Advanced Tuck',
    2: 'Straddle',
    3: 'Full',
    4: 'Wide',
  },
  muscle_up: {
    0: 'Kipping',
    1: 'Strict',
    2: 'Weighted',
    3: 'Slow',
    4: 'One Arm',
  },
  handstand_push_up: {
    0: 'Pike',
    1: 'Wall',
    2: 'Freestanding',
    3: 'Deficit',
    4: '90 Degree',
  },
}
