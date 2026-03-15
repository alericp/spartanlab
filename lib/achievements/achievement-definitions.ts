// Achievement Definitions
// Centralized achievement system for SpartanLab
// Tracks training milestones, strength progress, skill achievements, and consistency

export type AchievementCategory = 'training' | 'strength' | 'skill' | 'consistency' | 'volume'
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'elite'

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  icon: 'trophy' | 'medal' | 'star' | 'flame' | 'target' | 'dumbbell' | 'crown' | 'lightning'
  requirement: {
    type: 'workout_count' | 'streak_days' | 'total_reps' | 'strength_milestone' | 'skill_level' | 'hold_time'
    value: number
    exercise?: string
    skill?: string
  }
}

export interface UnlockedAchievement {
  achievementId: string
  unlockedAt: string
  seen: boolean
}

// =============================================================================
// ACHIEVEMENT DEFINITIONS
// =============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // Training Progress (workout count)
  {
    id: 'first_workout',
    name: 'First Step',
    description: 'Complete your first recorded workout',
    category: 'training',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'workout_count', value: 1 },
  },
  {
    id: 'workouts_10',
    name: 'Building Momentum',
    description: 'Complete 10 workouts',
    category: 'training',
    tier: 'bronze',
    icon: 'medal',
    requirement: { type: 'workout_count', value: 10 },
  },
  {
    id: 'workouts_25',
    name: 'Committed Athlete',
    description: 'Complete 25 workouts',
    category: 'training',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'workout_count', value: 25 },
  },
  {
    id: 'workouts_50',
    name: 'Consistent Fighter',
    description: 'Complete 50 workouts',
    category: 'training',
    tier: 'silver',
    icon: 'trophy',
    requirement: { type: 'workout_count', value: 50 },
  },
  {
    id: 'workouts_100',
    name: 'Centurion',
    description: 'Complete 100 workouts',
    category: 'training',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'workout_count', value: 100 },
  },
  {
    id: 'workouts_250',
    name: 'Spartan Warrior',
    description: 'Complete 250 workouts',
    category: 'training',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'workout_count', value: 250 },
  },

  // Consistency (streak days)
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Train 7 days in a row',
    category: 'consistency',
    tier: 'bronze',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 7 },
  },
  {
    id: 'streak_14',
    name: 'Two Week Streak',
    description: 'Train 14 days in a row',
    category: 'consistency',
    tier: 'silver',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 14 },
  },
  {
    id: 'streak_30',
    name: 'Monthly Dedication',
    description: 'Train 30 days in a row',
    category: 'consistency',
    tier: 'gold',
    icon: 'flame',
    requirement: { type: 'streak_days', value: 30 },
  },
  {
    id: 'streak_90',
    name: 'Unbreakable',
    description: 'Train 90 days in a row',
    category: 'consistency',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'streak_days', value: 90 },
  },

  // Strength Milestones (weighted pull-up)
  {
    id: 'pullup_25',
    name: 'Pull-Up Power',
    description: 'Weighted pull-up with +25 lbs',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 25, exercise: 'weighted_pull_up' },
  },
  {
    id: 'pullup_45',
    name: 'Serious Puller',
    description: 'Weighted pull-up with +45 lbs',
    category: 'strength',
    tier: 'silver',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 45, exercise: 'weighted_pull_up' },
  },
  {
    id: 'pullup_90',
    name: 'Elite Pull Strength',
    description: 'Weighted pull-up with +90 lbs',
    category: 'strength',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'strength_milestone', value: 90, exercise: 'weighted_pull_up' },
  },

  // Strength Milestones (weighted dip)
  {
    id: 'dip_45',
    name: 'Dip Foundation',
    description: 'Weighted dip with +45 lbs',
    category: 'strength',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 45, exercise: 'weighted_dip' },
  },
  {
    id: 'dip_90',
    name: 'Push Powerhouse',
    description: 'Weighted dip with +90 lbs',
    category: 'strength',
    tier: 'silver',
    icon: 'dumbbell',
    requirement: { type: 'strength_milestone', value: 90, exercise: 'weighted_dip' },
  },
  {
    id: 'dip_135',
    name: 'Elite Dip Strength',
    description: 'Weighted dip with +135 lbs',
    category: 'strength',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'strength_milestone', value: 135, exercise: 'weighted_dip' },
  },

  // Skill Achievements - Front Lever
  {
    id: 'fl_tuck',
    name: 'Front Lever Started',
    description: 'Achieve Tuck Front Lever',
    category: 'skill',
    tier: 'bronze',
    icon: 'target',
    requirement: { type: 'skill_level', value: 1, skill: 'front_lever' },
  },
  {
    id: 'fl_advanced',
    name: 'Front Lever Progress',
    description: 'Achieve Advanced Tuck Front Lever',
    category: 'skill',
    tier: 'silver',
    icon: 'target',
    requirement: { type: 'skill_level', value: 2, skill: 'front_lever' },
  },
  {
    id: 'fl_full',
    name: 'Front Lever Mastery',
    description: 'Achieve Full Front Lever',
    category: 'skill',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'skill_level', value: 4, skill: 'front_lever' },
  },

  // Skill Achievements - Planche
  {
    id: 'planche_tuck',
    name: 'Planche Started',
    description: 'Achieve Tuck Planche',
    category: 'skill',
    tier: 'bronze',
    icon: 'target',
    requirement: { type: 'skill_level', value: 1, skill: 'planche' },
  },
  {
    id: 'planche_advanced',
    name: 'Planche Progress',
    description: 'Achieve Advanced Tuck Planche',
    category: 'skill',
    tier: 'silver',
    icon: 'target',
    requirement: { type: 'skill_level', value: 2, skill: 'planche' },
  },
  {
    id: 'planche_full',
    name: 'Planche Mastery',
    description: 'Achieve Full Planche',
    category: 'skill',
    tier: 'elite',
    icon: 'crown',
    requirement: { type: 'skill_level', value: 5, skill: 'planche' },
  },

  // Muscle-Up Achievement
  {
    id: 'muscle_up_first',
    name: 'First Muscle-Up',
    description: 'Complete your first muscle-up',
    category: 'skill',
    tier: 'gold',
    icon: 'lightning',
    requirement: { type: 'skill_level', value: 1, skill: 'muscle_up' },
  },

  // Volume Achievements
  {
    id: 'reps_1000',
    name: 'Rep Builder',
    description: 'Log 1,000 total reps',
    category: 'volume',
    tier: 'bronze',
    icon: 'star',
    requirement: { type: 'total_reps', value: 1000 },
  },
  {
    id: 'reps_5000',
    name: 'Volume Machine',
    description: 'Log 5,000 total reps',
    category: 'volume',
    tier: 'silver',
    icon: 'medal',
    requirement: { type: 'total_reps', value: 5000 },
  },
  {
    id: 'reps_10000',
    name: 'Ten Thousand Strong',
    description: 'Log 10,000 total reps',
    category: 'volume',
    tier: 'gold',
    icon: 'trophy',
    requirement: { type: 'total_reps', value: 10000 },
  },
]

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id)
}

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category)
}

export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.tier === tier)
}

// Tier colors for UI
export const TIER_COLORS: Record<AchievementTier, { bg: string; text: string; border: string; glow: string }> = {
  bronze: {
    bg: 'bg-amber-900/20',
    text: 'text-amber-600',
    border: 'border-amber-700/40',
    glow: 'shadow-amber-900/20',
  },
  silver: {
    bg: 'bg-slate-400/10',
    text: 'text-slate-300',
    border: 'border-slate-500/40',
    glow: 'shadow-slate-500/20',
  },
  gold: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/30',
  },
  elite: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
    glow: 'shadow-purple-500/30',
  },
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  training: 'Training Progress',
  strength: 'Strength Milestones',
  skill: 'Skill Mastery',
  consistency: 'Consistency',
  volume: 'Volume',
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: AchievementCategory): string {
  return CATEGORY_LABELS[category] || category
}

// =============================================================================
// UNLOCKED ACHIEVEMENTS STORAGE
// =============================================================================

const UNLOCKED_STORAGE_KEY = 'spartanlab_unlocked_achievements'

/**
 * Get all unlocked achievements from localStorage
 */
export function getUnlockedAchievements(): UnlockedAchievement[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(UNLOCKED_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as UnlockedAchievement[]
  } catch {
    return []
  }
}

/**
 * Save an unlocked achievement
 */
export function saveUnlockedAchievement(achievementId: string): void {
  if (typeof window === 'undefined') return
  
  const unlocked = getUnlockedAchievements()
  
  // Don't add duplicates
  if (unlocked.some(a => a.achievementId === achievementId)) return
  
  const newUnlock: UnlockedAchievement = {
    achievementId,
    unlockedAt: new Date().toISOString(),
    seen: false,
  }
  
  unlocked.push(newUnlock)
  localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlocked))
}

/**
 * Mark an achievement as seen
 */
export function markAchievementSeen(achievementId: string): void {
  if (typeof window === 'undefined') return
  
  const unlocked = getUnlockedAchievements()
  const achievement = unlocked.find(a => a.achievementId === achievementId)
  
  if (achievement) {
    achievement.seen = true
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(unlocked))
  }
}

/**
 * Check if an achievement is unlocked
 */
export function isAchievementUnlocked(achievementId: string): boolean {
  return getUnlockedAchievements().some(a => a.achievementId === achievementId)
}
