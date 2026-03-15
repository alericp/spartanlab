/**
 * SpartanLab Leaderboard Types
 * 
 * Defines types for the modular leaderboard system.
 * Supports multiple leaderboard categories without hardcoding UI logic.
 */

// =============================================================================
// LEADERBOARD CATEGORIES
// =============================================================================

export type LeaderboardCategory = 
  | 'global_spartan_score'
  | 'consistency'
  | 'front_lever'
  | 'planche'
  | 'muscle_up'
  | 'handstand_pushup'
  | 'weighted_strength'

export interface LeaderboardCategoryConfig {
  id: LeaderboardCategory
  label: string
  shortLabel: string
  description: string
  icon: string // Lucide icon name
  scoreUnit: string
  sortDirection: 'desc' | 'asc' // desc = higher is better
}

// Category configurations
export const LEADERBOARD_CATEGORIES: LeaderboardCategoryConfig[] = [
  {
    id: 'global_spartan_score',
    label: 'Spartan Score',
    shortLabel: 'Score',
    description: 'Overall training performance combining strength, skills, and consistency',
    icon: 'Flame',
    scoreUnit: 'pts',
    sortDirection: 'desc',
  },
  {
    id: 'consistency',
    label: 'Consistency',
    shortLabel: 'Streak',
    description: 'Training discipline and workout streak',
    icon: 'Calendar',
    scoreUnit: 'days',
    sortDirection: 'desc',
  },
  {
    id: 'front_lever',
    label: 'Front Lever',
    shortLabel: 'FL',
    description: 'Front lever progression mastery',
    icon: 'Target',
    scoreUnit: 'lvl',
    sortDirection: 'desc',
  },
  {
    id: 'planche',
    label: 'Planche',
    shortLabel: 'PL',
    description: 'Planche progression mastery',
    icon: 'Target',
    scoreUnit: 'lvl',
    sortDirection: 'desc',
  },
  {
    id: 'muscle_up',
    label: 'Muscle-Up',
    shortLabel: 'MU',
    description: 'Muscle-up progression mastery',
    icon: 'Dumbbell',
    scoreUnit: 'lvl',
    sortDirection: 'desc',
  },
  {
    id: 'handstand_pushup',
    label: 'HSPU',
    shortLabel: 'HSPU',
    description: 'Handstand push-up progression mastery',
    icon: 'ArrowUp',
    scoreUnit: 'lvl',
    sortDirection: 'desc',
  },
  {
    id: 'weighted_strength',
    label: 'Weighted Strength',
    shortLabel: 'Strength',
    description: 'Combined weighted pull-up and dip strength',
    icon: 'Dumbbell',
    scoreUnit: 'lbs',
    sortDirection: 'desc',
  },
]

export function getCategoryConfig(category: LeaderboardCategory): LeaderboardCategoryConfig | undefined {
  return LEADERBOARD_CATEGORIES.find(c => c.id === category)
}

// =============================================================================
// LEADERBOARD ENTRY
// =============================================================================

export interface LeaderboardBadge {
  id: string
  name: string
  tier: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  avatarUrl?: string
  rank: number
  score: number
  formattedScore: string
  level?: string // e.g., "Advanced", "Intermediate"
  badges?: LeaderboardBadge[]
  isPro?: boolean
  isCurrentUser?: boolean
  lastUpdated: string
}

// =============================================================================
// LEADERBOARD RESPONSE
// =============================================================================

export interface LeaderboardData {
  category: LeaderboardCategory
  categoryConfig: LeaderboardCategoryConfig
  entries: LeaderboardEntry[]
  userRank?: LeaderboardEntry // Current user's position if not in top entries
  totalParticipants: number
  lastUpdated: string
}

// =============================================================================
// USER RANKING SUMMARY
// =============================================================================

export interface UserRankingSummary {
  userId: string
  displayName: string
  rankings: {
    category: LeaderboardCategory
    rank: number
    score: number
    percentile: number // Top X%
  }[]
  bestCategory: LeaderboardCategory | null
  overallRank: number
}

// =============================================================================
// SKILL PROGRESSION LEVELS (for skill leaderboards)
// =============================================================================

export const SKILL_PROGRESSION_LABELS: Record<string, Record<number, string>> = {
  front_lever: {
    0: 'Tuck',
    1: 'Adv. Tuck',
    2: 'Straddle',
    3: 'Half',
    4: 'Full',
  },
  planche: {
    0: 'Tuck',
    1: 'Adv. Tuck',
    2: 'Straddle',
    3: 'Half',
    4: 'Full',
  },
  muscle_up: {
    0: 'Kipping',
    1: 'Strict',
    2: 'Weighted',
    3: 'Slow',
    4: 'Ring MU',
  },
  handstand_pushup: {
    0: 'Pike',
    1: 'Wall',
    2: 'Free',
    3: 'Deficit',
    4: '90° Push',
  },
}

export function getSkillLevelLabel(skillName: string, level: number): string {
  return SKILL_PROGRESSION_LABELS[skillName]?.[level] || `Level ${level}`
}

// =============================================================================
// SCORING HELPERS
// =============================================================================

export function formatLeaderboardScore(score: number, category: LeaderboardCategory): string {
  const config = getCategoryConfig(category)
  if (!config) return String(score)
  
  switch (category) {
    case 'global_spartan_score':
      return score.toLocaleString()
    case 'consistency':
      return `${score} ${score === 1 ? 'day' : 'days'}`
    case 'weighted_strength':
      return `${score} lbs`
    case 'front_lever':
    case 'planche':
    case 'muscle_up':
    case 'handstand_pushup':
      return getSkillLevelLabel(category, score)
    default:
      return String(score)
  }
}
